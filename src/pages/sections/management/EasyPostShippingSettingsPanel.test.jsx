import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EasyPostShippingSettingsPanel from "./EasyPostShippingSettingsPanel";

jest.setTimeout(30000);

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPatch = jest.fn();
const mockApiDelete = jest.fn();
const mockCopilotDrawer = jest.fn(() => null);
const mockClipboardWriteText = jest.fn().mockResolvedValue();

jest.mock("../../../utils/api", () => ({
  api: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
    patch: (...args) => mockApiPatch(...args),
    delete: (...args) => mockApiDelete(...args),
  },
}));

jest.mock("../../../components/commerce-copilot/CommerceCopilotDrawer", () => (props) => {
  mockCopilotDrawer(props);
  return props.open ? <div data-testid="commerce-copilot-drawer">Commerce Copilot Drawer</div> : null;
});

describe("EasyPostShippingSettingsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockClipboardWriteText,
      },
    });
    mockApiPatch.mockResolvedValue({ data: {} });
    mockApiDelete.mockResolvedValue({ data: { deleted: true } });
    mockApiGet.mockResolvedValue({
      data: {
        enabled: true,
        easypost_enabled: true,
        easypost_has_api_key: true,
        easypost_api_key_last4: "1234",
        easypost_connected: true,
        address_verification_enabled: true,
        email_customer_order_shipped: true,
        email_customer_order_delivered: true,
        email_customer_delivery_exception: true,
        email_manager_delivery_exception: true,
        email_customer_ready_for_pickup: true,
        allow_shipping: true,
        origin_country: "CA",
        default_package_profile_id: 9,
        destination_policy_preset: "domestic_only",
        destination_policy_mode: "domestic_only",
        allowed_destination_countries: ["CA"],
        allowed_destination_country_options: [{ code: "CA", label: "Canada" }],
        country_catalog: [
          { code: "CA", label: "Canada" },
          { code: "GB", label: "United Kingdom" },
          { code: "JP", label: "Japan" },
        ],
        international_address_verification_mode: "best_effort",
        package_profiles: [
          {
            id: 9,
            name: "Jewelry Mailer",
            length_mm: 220,
            width_mm: 160,
            height_mm: 40,
            tare_weight_grams: 80,
            packaging_type: "box",
            is_default: true,
            is_active: true,
          },
        ],
        readiness: {
          ready: true,
          checklist: [
            { code: "origin_country", label: "Origin country", ready: true },
            { code: "default_package_profile", label: "Default package", ready: true },
          ],
        },
      },
    });
  });

  test("renders readiness and package profile details from backend settings", async () => {
    render(<EasyPostShippingSettingsPanel token="test-token" compact />);

    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith("/inventory/shipping-settings", expect.any(Object)));
    const automationTab = await screen.findByRole("tab", { name: /easypost automation/i });
    fireEvent.click(automationTab);

    expect(await screen.findByText(/easypost shipping automation/i)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("Shipping readiness: Ready"))).toBeInTheDocument();
    expect(screen.getByText(/jewelry mailer/i)).toBeInTheDocument();
    expect(screen.getByText(/^Default$/)).toBeInTheDocument();
    expect(screen.getAllByText(/origin country/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/default package/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/address verification enabled/i)).toBeInTheDocument();
  });

  test("shows non-empty help tooltip text for origin fields", async () => {
    render(<EasyPostShippingSettingsPanel token="test-token" compact />);
    const automationTab = await screen.findByRole("tab", { name: /easypost automation/i });
    fireEvent.click(automationTab);

    const helpButton = await screen.findByRole("button", { name: /origin name help/i });
    fireEvent.mouseOver(helpButton);

    expect(await screen.findByText(/sender\/business name used as shipment origin/i)).toBeInTheDocument();
  });

  test("opens Commerce Copilot in shipping-test mode from Delivery Setup", async () => {
    render(<EasyPostShippingSettingsPanel token="test-token" compact />);
    await userEvent.click(await screen.findByRole("button", { name: /test shipping setup/i }));

    expect(await screen.findByTestId("commerce-copilot-drawer")).toBeInTheDocument();
    expect(mockCopilotDrawer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        initialWorkflow: "test_shipping_setup",
      })
    );
  });

  test("opens Commerce Copilot in international-review mode from Delivery Setup", async () => {
    render(<EasyPostShippingSettingsPanel token="test-token" compact />);
    await userEvent.click(await screen.findByRole("button", { name: /review international readiness/i }));

    expect(await screen.findByTestId("commerce-copilot-drawer")).toBeInTheDocument();
    expect(mockCopilotDrawer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        initialWorkflow: "international_expansion_assistant",
      })
    );
  });

  test("shows the default Schedulaa setup tab with a neutral shipping example", async () => {
    render(<EasyPostShippingSettingsPanel token="test-token" compact />);

    await userEvent.click(await screen.findByRole("button", { name: /^help$/i }));

    expect(await screen.findByRole("tab", { name: /schedulaa setup/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/current schedulaa checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/physical product: product weight 250 g/i)).toBeInTheDocument();
    expect(screen.getByText(/reusable package profile: box 20 x 15 x 8 cm, empty-package weight 80 g/i)).toBeInTheDocument();
    expect(screen.queryByText(/domestic jewelry in canada/i)).not.toBeInTheDocument();
  });

  test("shows the EasyPost website setup tab with support request helpers and safe external link", async () => {
    render(<EasyPostShippingSettingsPanel token="test-token" compact />);

    await userEvent.click(await screen.findByRole("button", { name: /^help$/i }));
    await userEvent.click(screen.getByRole("tab", { name: /easypost website setup/i }));

    expect(await screen.findByText(/create or verify the easypost account/i)).toBeInTheDocument();
    expect(screen.getByText(/easypost wallet and billing/i)).toBeInTheDocument();
    expect(screen.getByText(/existing carrier account/i)).toBeInTheDocument();
    expect(screen.getByText(/never paste your easypost api key/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /copy subject/i }));
    expect(mockClipboardWriteText).toHaveBeenCalledWith("Security verification required for API access and shipping features");
    expect(await screen.findByRole("status")).toHaveTextContent(/copied support request subject/i);

    await userEvent.click(screen.getByRole("button", { name: /copy request message/i }));
    expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.stringContaining("Hello EasyPost Support,"));

    const supportLink = screen.getByRole("link", { name: /open easypost support/i });
    expect(supportLink).toHaveAttribute("target", "_blank");
    expect(supportLink).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(supportLink).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  test("supports keyboard tab navigation into help tabs and shows webhook responsibility wording", async () => {
    render(<EasyPostShippingSettingsPanel token="test-token" compact />);

    await userEvent.click(await screen.findByRole("button", { name: /^help$/i }));
    const schedulaaTab = screen.getByRole("tab", { name: /schedulaa setup/i });
    await userEvent.tab();
    await userEvent.tab();
    expect(schedulaaTab).toHaveFocus();

    await userEvent.click(screen.getByRole("tab", { name: /test and go live/i }));
    expect(screen.getByText(/tracking integration is managed by schedulaa/i)).toBeInTheDocument();
    expect(screen.getByText(/you do not need to manually create an easypost webhook/i)).toBeInTheDocument();
  });

  test("opens help directly on the EasyPost website setup tab from the account warning", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        enabled: true,
        easypost_enabled: true,
        easypost_has_api_key: false,
        easypost_connected: false,
        allow_shipping: true,
        origin_country: "CA",
        country_catalog: [{ code: "CA", label: "Canada" }],
        package_profiles: [],
        readiness: { ready: false, checklist: [] },
      },
    });

    render(<EasyPostShippingSettingsPanel token="test-token" compact />);
    fireEvent.click(await screen.findByRole("tab", { name: /easypost automation/i }));
    await userEvent.click(await screen.findByRole("button", { name: /easypost account setup guide/i }));

    expect(await screen.findByRole("tab", { name: /easypost website setup/i })).toHaveAttribute("aria-selected", "true");
  });

  test("shows test and go live guidance, dynamic checklist states, and no raw API key examples", async () => {
    render(<EasyPostShippingSettingsPanel token="test-token" compact />);

    await userEvent.click(await screen.findByRole("button", { name: /^help$/i }));
    await userEvent.click(screen.getByRole("tab", { name: /test and go live/i }));

    expect(await screen.findByText(/stage 1 - configure/i)).toBeInTheDocument();
    expect(screen.getByText(/changing from a test key to a production key changes the easypost environment/i)).toBeInTheDocument();
    expect(screen.getByText(/easypost account verification/i)).toBeInTheDocument();
    expect(screen.getAllByText(/confirm in easypost/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/EZTK/i)).not.toBeInTheDocument();
  });

  test("saving manual shipping settings does not send destination policy fields when EasyPost automation is off", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        enabled: true,
        easypost_enabled: false,
        allow_pickup: true,
        allow_shipping: true,
        allow_local_delivery: false,
        origin_country: "",
        destination_policy_preset: "domestic_only",
        destination_policy_mode: "domestic_only",
        allowed_destination_countries: [],
        country_catalog: [{ code: "CA", label: "Canada" }],
        package_profiles: [],
        readiness: { ready: false, checklist: [] },
      },
    });
    mockApiPost.mockResolvedValue({ data: { enabled: true, easypost_enabled: false, allow_pickup: true, allow_shipping: true, allow_local_delivery: false, package_profiles: [], readiness: { ready: false, checklist: [] } } });

    render(<EasyPostShippingSettingsPanel token="test-token" compact />);

    await screen.findByText(/how customers can receive orders/i);
    await userEvent.click(screen.getByRole("button", { name: /save shipping settings/i }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/inventory/shipping-settings",
        expect.not.objectContaining({
          origin_country: expect.anything(),
          destination_policy_preset: expect.anything(),
          destination_policy_mode: expect.anything(),
          destination_countries: expect.anything(),
        }),
        expect.any(Object)
      )
    );
  });

  test("supports editing and archiving package profiles", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        enabled: true,
        easypost_enabled: true,
        allow_shipping: true,
        origin_country: "CA",
        default_package_profile_id: 9,
        destination_policy_preset: "domestic_only",
        destination_policy_mode: "domestic_only",
        allowed_destination_countries: ["CA"],
        allowed_destination_country_options: [{ code: "CA", label: "Canada" }],
        country_catalog: [
          { code: "CA", label: "Canada" },
          { code: "GB", label: "United Kingdom" },
        ],
        international_address_verification_mode: "best_effort",
        package_profiles: [
          {
            id: 9,
            name: "Jewelry Mailer",
            length_mm: 220,
            width_mm: 160,
            height_mm: 40,
            tare_weight_grams: 80,
            packaging_type: "box",
            is_default: true,
            is_active: true,
          },
        ],
        readiness: {
          ready: true,
          checklist: [],
        },
      },
    });

    render(<EasyPostShippingSettingsPanel token="test-token" compact />);
    const automationTab = await screen.findByRole("tab", { name: /easypost automation/i });
    fireEvent.click(automationTab);

    fireEvent.click(await screen.findByRole("button", { name: /edit/i }));
    const profileName = await screen.findByLabelText(/profile name/i);
    fireEvent.change(profileName, { target: { value: "Updated Mailer" } });
    fireEvent.click(screen.getByRole("button", { name: /update package profile/i }));

    await waitFor(() =>
      expect(mockApiPatch).toHaveBeenCalledWith(
        "/inventory/shipping/package-profiles/9",
        expect.objectContaining({ name: "Updated Mailer" }),
        expect.any(Object)
      )
    );

    fireEvent.click(screen.getByRole("button", { name: /archive/i }));
    await waitFor(() =>
      expect(mockApiDelete).toHaveBeenCalledWith(
        "/inventory/shipping/package-profiles/9",
        expect.any(Object)
      )
    );
  });

  test("shows cross-border customs fields and US export filing controls for CA/US policy", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        enabled: true,
        easypost_enabled: true,
        easypost_has_api_key: true,
        allow_shipping: true,
        origin_country: "US",
        destination_policy_preset: "ca_us",
        destination_policy_mode: "ca_us",
        allowed_destination_countries: ["US", "CA"],
        allowed_destination_country_options: [
          { code: "US", label: "United States" },
          { code: "CA", label: "Canada" },
        ],
        country_catalog: [
          { code: "CA", label: "Canada" },
          { code: "US", label: "United States" },
          { code: "GB", label: "United Kingdom" },
        ],
        international_address_verification_mode: "best_effort",
        customs_certify: true,
        customs_signer: "Vanda Manager",
        customs_contents_type: "other",
        customs_contents_explanation: "Jewelry samples",
        customs_non_delivery_option: "return",
        customs_restriction_type: "other",
        customs_restriction_comments: "Carrier review",
        us_export_filing_mode: "aes_itn",
        us_export_filing_citation: "AES X20260726000123",
        package_profiles: [],
        readiness: {
          ready: false,
          products_missing_count: 2,
          checklist: [
            { code: "cross_border_products", label: "Products cross-border ready (2 missing)", ready: false },
          ],
        },
      },
    });

    render(<EasyPostShippingSettingsPanel token="test-token" compact />);
    fireEvent.click(await screen.findByRole("tab", { name: /easypost automation/i }));

    expect(await screen.findByText(/cross-border customs setup/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/destination policy/i)).toHaveTextContent(/canada and united states/i);
    expect(screen.getByLabelText(/customs signer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contents explanation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/restriction comments/i)).toBeInTheDocument();
    expect(screen.getByText(/us export filing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filing citation/i)).toBeInTheDocument();
    expect(screen.getByText(/products cross-border ready \(2 missing\)/i)).toBeInTheDocument();
  });

  test("renders lifecycle email toggles enabled by default and persists disabled values on save", async () => {
    mockApiPost.mockImplementation((url, payload) => {
      if (String(url) === "/inventory/shipping-settings") {
        return Promise.resolve({
          data: {
            enabled: true,
            easypost_enabled: true,
            origin_country: "CA",
            destination_policy_preset: "ca_us",
            destination_policy_mode: "ca_us",
            allowed_destination_countries: ["CA", "US"],
            allowed_destination_country_options: [
              { code: "CA", label: "Canada" },
              { code: "US", label: "United States" },
            ],
            country_catalog: [
              { code: "CA", label: "Canada" },
              { code: "US", label: "United States" },
              { code: "GB", label: "United Kingdom" },
            ],
            international_address_verification_mode: "best_effort",
            email_customer_order_shipped: payload.email_customer_order_shipped,
            email_customer_order_delivered: payload.email_customer_order_delivered,
            email_customer_delivery_exception: payload.email_customer_delivery_exception,
            email_manager_delivery_exception: payload.email_manager_delivery_exception,
            email_customer_ready_for_pickup: payload.email_customer_ready_for_pickup,
            require_import_charges_acknowledgement: true,
            package_profiles: [],
            readiness: { ready: true, checklist: [] },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(<EasyPostShippingSettingsPanel token="test-token" compact />);
    fireEvent.click(await screen.findByRole("tab", { name: /easypost automation/i }));

    expect(await screen.findByText(/customer shipping emails/i)).toBeInTheDocument();
    expect(screen.getByText(/a label purchase alone does not send a shipped email/i)).toBeInTheDocument();
    expect(screen.getByText(/webhook and manual updates are automatically deduplicated/i)).toBeInTheDocument();
    const shippedToggle = await screen.findByRole("checkbox", { name: /email customer when order ships/i });
    const deliveredToggle = await screen.findByRole("checkbox", { name: /email customer when order is delivered/i });
    const customerExceptionToggle = await screen.findByRole("checkbox", { name: /email customer about delivery problems/i });
    const managerExceptionToggle = await screen.findByRole("checkbox", { name: /email managers about delivery problems/i });
    const pickupToggle = await screen.findByRole("checkbox", { name: /email customer when pickup is ready/i });

    expect(shippedToggle).toBeChecked();
    expect(deliveredToggle).toBeChecked();
    expect(customerExceptionToggle).toBeChecked();
    expect(managerExceptionToggle).toBeChecked();
    expect(pickupToggle).toBeChecked();

    fireEvent.click(shippedToggle);
    fireEvent.click(deliveredToggle);
    fireEvent.click(managerExceptionToggle);
    fireEvent.click(screen.getByRole("button", { name: /save shipping settings/i }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/inventory/shipping-settings",
        expect.objectContaining({
          email_customer_order_shipped: false,
          email_customer_order_delivered: false,
          email_customer_delivery_exception: true,
          email_manager_delivery_exception: false,
          email_customer_ready_for_pickup: true,
        }),
        expect.any(Object)
      )
    );
  });

  test("supports selected countries mode and international verification mode", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        enabled: true,
        easypost_enabled: true,
        easypost_has_api_key: true,
        allow_shipping: true,
        origin_country: "CA",
        destination_policy_preset: "selected_countries",
        destination_policy_mode: "selected_countries",
        allowed_destination_countries: ["CA", "GB", "JP"],
        allowed_destination_country_options: [
          { code: "CA", label: "Canada" },
          { code: "GB", label: "United Kingdom" },
          { code: "JP", label: "Japan" },
        ],
        country_catalog: [
          { code: "CA", label: "Canada" },
          { code: "GB", label: "United Kingdom" },
          { code: "JP", label: "Japan" },
        ],
        international_address_verification_mode: "best_effort",
        package_profiles: [],
        readiness: { ready: true, checklist: [] },
      },
    });
    mockApiPost.mockImplementation((url, payload) => {
      if (String(url) === "/inventory/shipping-settings") {
        return Promise.resolve({ data: { ...payload, package_profiles: [], readiness: { ready: true, checklist: [] } } });
      }
      return Promise.resolve({ data: {} });
    });

    render(<EasyPostShippingSettingsPanel token="test-token" compact />);
    fireEvent.click(await screen.findByRole("tab", { name: /easypost automation/i }));

    expect(await screen.findByLabelText(/selected destination countries/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/international address verification/i)).toHaveTextContent(/best effort/i);

    fireEvent.mouseDown(screen.getByLabelText(/international address verification/i));
    fireEvent.click(await screen.findByRole("option", { name: /required/i }));
    fireEvent.click(screen.getByRole("button", { name: /save shipping settings/i }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/inventory/shipping-settings",
        expect.objectContaining({
          destination_policy_mode: "selected_countries",
          destination_countries: ["CA", "GB", "JP"],
          international_address_verification_mode: "required",
        }),
        expect.any(Object)
      )
    );
  });

  test("opens Commerce Copilot from Delivery Setup", async () => {
    render(<EasyPostShippingSettingsPanel token="test-token" compact />);
    fireEvent.click(await screen.findByRole("tab", { name: /easypost automation/i }));

    fireEvent.click(await screen.findByRole("button", { name: /configure shipping with ai/i }));
    expect(await screen.findByTestId("commerce-copilot-drawer")).toBeInTheDocument();
    expect(mockCopilotDrawer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        initialWorkflow: "review_shipping_setup",
      })
    );
  });
});
