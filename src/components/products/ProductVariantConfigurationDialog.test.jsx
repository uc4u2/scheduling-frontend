import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import ProductVariantConfigurationDialog from "./ProductVariantConfigurationDialog";

const mockApiGet = jest.fn();
const mockApiPut = jest.fn();
const mockApiPost = jest.fn();
const mockApiDelete = jest.fn();

const installMatchMedia = (matcher = () => false) => {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: matcher(String(query || "")),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    put: (...args) => mockApiPut(...args),
    post: (...args) => mockApiPost(...args),
    delete: (...args) => mockApiDelete(...args),
  },
}));

const basePayload = {
  product_id: 48,
  variant_mode: "none",
  configuration_version: "2026-08-03T12:00:00",
  runtime_selling_enabled: false,
  limits: { max_options: 2, max_values_per_option: 20, max_variants: 100 },
  options: [],
  variants: [],
  readiness: {
    complete: false,
    sellable: false,
    expected_combinations: 0,
    configured_variants: 0,
    blockers: [],
  },
  activation_readiness: {
    ready_for_activation: false,
    blockers: [],
    warnings: [],
  },
  variant_summary: {
    option_count: 0,
    variant_count: 0,
    active_variant_count: 0,
    configuration_complete: false,
    selling_enabled: false,
  },
  product_summary: {
    variant_mode: "none",
    variant_summary: {
      option_count: 0,
      variant_count: 0,
      active_variant_count: 0,
      configuration_complete: false,
      selling_enabled: false,
    },
    selling_currency: "CAD",
  },
};

const renderDialog = (props = {}) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <ProductVariantConfigurationDialog
        open
        token="test-token"
        onClose={jest.fn()}
        notify={jest.fn()}
        product={{
          id: 48,
          sku: "BAG-001",
          name: "Carry Bag",
          price: 69,
          track_stock: true,
          selling_currency: "CAD",
          images: [
            { id: 201, filename: "soft-white.jpg", url: "https://example.com/soft-white.jpg", url_public: "https://example.com/soft-white.jpg" },
            { id: 202, filename: "black.jpg", url: "https://example.com/black.jpg", url_public: "https://example.com/black.jpg" },
          ],
        }}
        {...props}
      />
    </ThemeProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  window.confirm = jest.fn(() => true);
  installMatchMedia(() => false);
  mockApiGet.mockImplementation((url) => {
    if (String(url).includes("/image-ids")) {
      return Promise.resolve({
        data: {
          product_id: 48,
          images: [
            { id: 201, filename: "soft-white.jpg", url: "https://example.com/soft-white.jpg", url_public: "https://example.com/soft-white.jpg" },
            { id: 202, filename: "black.jpg", url: "https://example.com/black.jpg", url_public: "https://example.com/black.jpg" },
            { id: 203, filename: "uploaded.jpg", url: "https://example.com/uploaded.jpg", url_public: "https://example.com/uploaded.jpg" },
          ],
        },
      });
    }
    return Promise.resolve({ data: basePayload });
  });
  mockApiPut.mockResolvedValue({
    data: {
      ...basePayload,
      variant_mode: "draft",
      configuration_version: "2026-08-03T12:05:00",
      runtime_selling_enabled: true,
      options: [
        {
          id: 1,
          name: "Colour",
          display_order: 0,
          values: [{ id: 11, value: "Black", display_order: 0, swatch_color: "#000000", image_id: 202 }],
        },
      ],
      variants: [
        {
          id: 101,
          selection: [{ option_id: 1, option_name: "Colour", value_id: 11, value: "Black" }],
          sku: "BAG-001-BLACK",
          price_override: null,
          effective_price: "69.00",
          qty_on_hand: 3,
          is_active: true,
          primary_image_id: null,
        },
      ],
      activation_readiness: {
        ready_for_activation: true,
        blockers: [],
        warnings: [],
      },
      variant_summary: {
        option_count: 1,
        variant_count: 1,
        active_variant_count: 1,
        configuration_complete: true,
        selling_enabled: false,
      },
      product_summary: {
        variant_mode: "draft",
        variant_summary: {
          option_count: 1,
          variant_count: 1,
          active_variant_count: 1,
          configuration_complete: true,
          selling_enabled: false,
        },
        selling_currency: "CAD",
      },
    },
  });
  mockApiPost.mockResolvedValue({
    data: {
      ...basePayload,
      variant_mode: "active",
      configuration_version: "2026-08-03T12:06:00",
      runtime_selling_enabled: true,
      options: [
        {
          id: 1,
          name: "Colour",
          display_order: 0,
          values: [{ id: 11, value: "Black", display_order: 0, swatch_color: "#000000", image_id: 202 }],
        },
      ],
      variants: [
        {
          id: 101,
          selection: [{ option_id: 1, option_name: "Colour", value_id: 11, value: "Black" }],
          sku: "BAG-001-BLACK",
          price_override: null,
          effective_price: "69.00",
          qty_on_hand: 3,
          is_active: true,
          primary_image_id: null,
        },
      ],
      activation_readiness: {
        ready_for_activation: true,
        blockers: [],
        warnings: [],
      },
      variant_summary: {
        option_count: 1,
        variant_count: 1,
        active_variant_count: 1,
        configuration_complete: true,
        selling_enabled: true,
      },
      product_summary: {
        variant_mode: "active",
        variant_summary: {
          option_count: 1,
          variant_count: 1,
          active_variant_count: 1,
          configuration_complete: true,
          selling_enabled: true,
        },
        selling_currency: "CAD",
      },
    },
  });
  mockApiDelete.mockResolvedValue({ data: basePayload });
});

test("shows the empty state and removes stale future-phase wording", async () => {
  renderDialog();

  expect(await screen.findByText("No options are configured for this Product.")).toBeInTheDocument();
  expect(screen.getByText("Add the choices customers need to make.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add Colour" })).toBeInTheDocument();
  expect(screen.queryByText(/next checkout phase/i)).not.toBeInTheDocument();
  expect(screen.getByText("Runtime off")).toBeInTheDocument();
});

test("creates a colour option without phantom combinations and blocks step 2 until the value is valid", async () => {
  renderDialog();

  await userEvent.click(await screen.findByRole("button", { name: "Add Colour" }));
  expect(screen.getByDisplayValue("Colour")).toBeInTheDocument();
  expect(screen.getByLabelText("Value")).toHaveValue("");
  expect(screen.getByRole("tab", { name: /2. Variants/i })).toBeDisabled();
  expect(screen.queryByText(/1 combinations/i)).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Value"), { target: { value: "Black" } });
  await waitFor(() => expect(screen.getByRole("tab", { name: /2. Variants/i })).not.toBeDisabled());
});

test("shows stale readiness messaging once when edits are unsaved", async () => {
  renderDialog();

  await userEvent.click(await screen.findByRole("button", { name: "Add Colour" }));
  fireEvent.change(screen.getByLabelText("Value"), { target: { value: "Black" } });
  await userEvent.click(screen.getByRole("button", { name: "Next" }));
  await userEvent.click(screen.getByRole("button", { name: "Next" }));

  expect(screen.getByText("Save your changes to refresh the activation check.")).toBeInTheDocument();
  expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
});

test("renders the linked inventory blocker once in the review step", async () => {
  mockApiGet.mockResolvedValueOnce({
    data: {
      ...basePayload,
      runtime_selling_enabled: true,
      variant_mode: "draft",
      options: [
        {
          id: 1,
          name: "Colour",
          display_order: 0,
          values: [{ id: 11, value: "Black", display_order: 0, swatch_color: "#000000", image_id: null }],
        },
      ],
      variants: [
        {
          id: 101,
          selection: [{ option_id: 1, option_name: "Colour", value_id: 11, value: "Black" }],
          sku: "BAG-001-BLACK",
          price_override: null,
          effective_price: "69.00",
          qty_on_hand: 3,
          is_active: true,
          primary_image_id: null,
        },
      ],
      activation_readiness: {
        ready_for_activation: false,
        blockers: [
          "This Product uses linked Finance inventory. Variant stock requires Product-owned inventory and cannot be activated until the inventory link is removed.",
        ],
        warnings: [],
      },
      variant_summary: {
        option_count: 1,
        variant_count: 1,
        active_variant_count: 1,
        configuration_complete: true,
        selling_enabled: false,
      },
    },
  });

  renderDialog();
  await screen.findByDisplayValue("Black");
  await userEvent.click(screen.getByRole("tab", { name: /2. Variants/i }));
  await userEvent.click(screen.getByRole("tab", { name: /3. Review and activate/i }));

  expect(screen.getAllByText(/Variant stock cannot be activated while this Product uses linked Materials & Supplies inventory\./i)).toHaveLength(1);
  expect(screen.getByText(/Linked inventory tracks one quantity for the whole Product\./i)).toBeInTheDocument();
  expect(screen.queryByText(/Activation is currently unavailable in this environment/i)).not.toBeInTheDocument();
});

test("uploads a new gallery image, refreshes the gallery, and auto-assigns it to the value", async () => {
  renderDialog();

  await userEvent.click(await screen.findByRole("button", { name: "Add Colour" }));
  const file = new File(["image"], "uploaded.jpg", { type: "image/jpeg" });

  mockApiPost.mockResolvedValueOnce({ data: { id: 203, url_public: "https://example.com/uploaded.jpg" } });
  const uploadInput = screen.getByTestId("value-image-upload-0-0");

  fireEvent.change(uploadInput, { target: { files: [file] } });

  await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
    "/inventory/products/48/images",
    expect.any(FormData),
    expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-token" }) })
  ));
  expect((await screen.findAllByText("uploaded.jpg")).length).toBeGreaterThan(0);
});

test("shows mobile variant cards instead of the desktop table", async () => {
  installMatchMedia((query) => query.includes("max-width"));
  renderDialog();

  await userEvent.click(await screen.findByRole("button", { name: "Add Colour" }));
  fireEvent.change(screen.getByLabelText("Value"), { target: { value: "Mini" } });
  await userEvent.click(screen.getByRole("button", { name: "Next" }));

  expect(await screen.findByTestId("variant-mobile-cards")).toBeInTheDocument();
});

test(
  "saves a valid draft and then activates variant selling",
  async () => {
  const notify = jest.fn();
  const onSaved = jest.fn();
  renderDialog({ notify, onSaved });

  await userEvent.click(await screen.findByRole("button", { name: "Add Colour" }));
  fireEvent.change(screen.getByLabelText("Value"), { target: { value: "Black" } });
  fireEvent.change(screen.getByLabelText("Swatch"), { target: { value: "#000000" } });

  await userEvent.click(screen.getByRole("button", { name: "Next" }));
  const skuInput = await screen.findByDisplayValue("BAG-001-BLACK");
  expect(skuInput).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /Save draft/i }));
  await waitFor(() => expect(mockApiPut).toHaveBeenCalled());
  await waitFor(() => expect(notify).toHaveBeenCalledWith("Variant draft saved."));

  await userEvent.click(screen.getByRole("tab", { name: /3. Review and activate/i }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Activate Variant selling" })).toBeEnabled());
  await userEvent.click(screen.getByRole("button", { name: "Activate Variant selling" }));
  await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
    "/inventory/products/48/variant-activation",
    expect.objectContaining({ activate: true, configuration_version: "2026-08-03T12:05:00" }),
    expect.any(Object)
  ));
  expect(onSaved).toHaveBeenCalled();
  },
  15000
);

test("opens the danger-zone removal action from More actions", async () => {
  mockApiGet.mockResolvedValueOnce({
    data: {
      ...basePayload,
      variant_mode: "draft",
      configuration_version: "2026-08-03T12:00:00",
      options: [
        {
          id: 1,
          name: "Size",
          display_order: 0,
          values: [{ id: 11, value: "Mini", display_order: 0, swatch_color: null, image_id: null }],
        },
      ],
      variants: [
        {
          id: 101,
          selection: [{ option_id: 1, option_name: "Size", value_id: 11, value: "Mini" }],
          sku: "BAG-001-MINI",
          price_override: null,
          effective_price: "69.00",
          qty_on_hand: 0,
          is_active: true,
          primary_image_id: null,
        },
      ],
    },
  });

  renderDialog();
  await screen.findByDisplayValue("Mini");
  await userEvent.click(screen.getByRole("button", { name: "More actions" }));
  const menu = await screen.findByRole("menu");
  await userEvent.click(within(menu).getByText("Remove configuration"));

  await waitFor(() =>
    expect(mockApiDelete).toHaveBeenCalledWith(
      "/inventory/products/48/variant-configuration",
      expect.objectContaining({ data: { configuration_version: "2026-08-03T12:00:00" } })
    )
  );
});
