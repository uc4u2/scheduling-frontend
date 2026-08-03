import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import ManagerProductOrdersView from "./ManagerProductOrdersView";

jest.setTimeout(15000);

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPatch = jest.fn();
const mockCopilotDrawer = jest.fn(() => null);

jest.mock("../../../utils/api", () => ({
  api: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
    patch: (...args) => mockApiPatch(...args),
  },
  isStripeOnboardingIncomplete: () => false,
}));

jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }) => (
    <div data-testid="orders-grid">
      {rows.map((row) => (
        <div key={row.id}>
          {columns.map((column) => (
            <div key={column.field}>
              {column.renderCell
                ? column.renderCell({ row, value: row[column.field] })
                : String(row[column.field] ?? "")}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

jest.mock("../../../utils/currency", () => ({
  setActiveCurrency: jest.fn(),
  normalizeCurrency: (value) => (value ? String(value).toUpperCase() : ""),
  resolveCurrencyForCountry: () => "CAD",
  resolveActiveCurrencyFromCompany: () => "CAD",
  getActiveCurrency: () => "CAD",
}));

jest.mock("../../../utils/timezone", () => ({
  getUserTimezone: () => "America/Toronto",
}));

jest.mock("../../../utils/mobileCompliance", () => ({
  isMobileComplianceMode: () => false,
}));

jest.mock("../../../components/mobile/MobileWebOnlyNotice", () => () => null);
jest.mock("../../../components/commerce-copilot/CommerceCopilotDrawer", () => (props) => {
  mockCopilotDrawer(props);
  return props.open ? <div data-testid="commerce-copilot-drawer">Commerce Copilot Drawer</div> : null;
});

describe("ManagerProductOrdersView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiPost.mockResolvedValue({ data: {} });
    mockApiPatch.mockResolvedValue({ data: {} });
    mockApiGet.mockImplementation((url) => {
      if (String(url) === "/inventory/product-orders") {
        return Promise.resolve({
          data: {
            orders: [
              {
                id: 1,
                client_name: "Client",
                delivery_method: "shipping",
                delivery_method_label: "Shipping",
                fulfillment_status: "pending",
                fulfillment_status_label: "Pending",
                payment_status: "paid",
                payment_status_label: "Paid",
                total_amount: 120,
                currency: "CAD",
                refunded_cents: 0,
              },
            ],
            pagination: { total: 1 },
            company: { country_code: "CA" },
          },
        });
      }
      if (String(url) === "/inventory/shipping-settings") {
        return Promise.resolve({
          data: {
            package_profiles: [
              {
                id: 9,
                name: "Jewelry Mailer",
                is_default: true,
                is_active: true,
              },
            ],
          },
        });
      }
      if (String(url) === "/inventory/product-orders/1") {
        return Promise.resolve({
          data: {
            id: 1,
            client_name: "Client",
            client_email: "client@example.com",
            delivery_method: "shipping",
            delivery_method_label: "Shipping",
            fulfillment_status: "pending",
            fulfillment_status_label: "Pending",
            payment_status: "paid",
            payment_status_label: "Paid",
            total_amount: 120,
            currency: "CAD",
            refunded_cents: 0,
            inventory_committed: true,
            items: [],
            payments: [],
            events: [
              {
                id: 10,
                event_type: "notification.customer_shipped_queued",
                note: "Customer shipped email queued",
                data: { source: "webhook" },
                created_at: "2026-07-26T12:10:00Z",
              },
            ],
            company: { timezone: "America/Toronto" },
            latest_shipment: null,
            parcel_snapshot: null,
            customer_selected_rate_snapshot: {
              carrier: "Carrier",
              service: "Ground",
              amount_cents: 1250,
              currency: "CAD",
            },
            customer_shipping_amount_cents: 1250,
            customer_shipping_currency: "CAD",
            customer_rate_quoted_at: "2026-07-26T12:00:00Z",
            internal_rate_quote_expires_at: "2026-07-26T12:30:00Z",
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test("shows historical parcel-entry controls for shipping orders without parcel snapshots", async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <ManagerProductOrdersView token="test-token" />
      </ThemeProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /view/i }));
    fireEvent.click(await screen.findByRole("tab", { name: /actions/i }));

    expect(
      await screen.findByText(/this order was created before accurate parcel snapshots were stored/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/package profile/i)).toBeInTheDocument();
  });

  test("renders pinned customer-paid shipping and requires override confirmation for higher-cost labels", async () => {
    mockApiPost.mockImplementation((url) => {
      if (String(url) === "/inventory/product-orders/1/shipping/rates") {
        return Promise.resolve({
          data: {
            shipment_id: "shp_refresh_1",
            default_rate_id: "rate_2",
            customer_selected_shipping: {
              source: "server_authoritative_quote",
              carrier: "Carrier",
              service: "Ground",
              amount_cents: 1250,
              currency: "CAD",
              quote_time: "2026-07-26T12:00:00Z",
              quote_state: "current",
            },
            rates: [
              {
                rate_id: "rate_2",
                carrier: "Carrier",
                service: "Ground",
                amount_cents: 1500,
                currency: "CAD",
                match_type: "same_service_higher_price",
                difference_cents: 250,
                override_required: true,
                comparison_message: "Same carrier/service but at a higher cost than the customer paid.",
              },
            ],
          },
        });
      }
      if (String(url) === "/inventory/product-orders/1/shipping/buy") {
        return Promise.resolve({
          data: {
            order: { id: 1, events: [] },
            shipment: { id: 7 },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <ThemeProvider theme={createTheme()}>
        <ManagerProductOrdersView token="test-token" />
      </ThemeProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /view/i }));
    fireEvent.click(await screen.findByRole("tab", { name: /actions/i }));
    fireEvent.click(await screen.findByRole("button", { name: /refresh rates/i }));

    expect(await screen.findByText(/customer-selected shipping/i)).toBeInTheDocument();
    expect(screen.getByText(/shipping paid/i)).toBeInTheDocument();
    expect(
      screen.getByText(/same carrier\/service but at a higher cost than the customer paid/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /buy label/i }));
    expect(await screen.findByText(/business will absorb the difference/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/override reason/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business will absorb the difference/i)).toBeInTheDocument();
  });

  test("renders safe customs document links for international shipments", async () => {
    mockApiGet.mockImplementation((url) => {
      if (String(url) === "/inventory/product-orders") {
        return Promise.resolve({
          data: {
            orders: [
              {
                id: 1,
                client_name: "Client",
                delivery_method: "shipping",
                delivery_method_label: "Shipping",
                fulfillment_status: "in_transit",
                fulfillment_status_label: "In transit",
                payment_status: "paid",
                payment_status_label: "Paid",
                total_amount: 120,
                currency: "CAD",
                refunded_cents: 0,
              },
            ],
            pagination: { total: 1 },
            company: { country_code: "CA" },
          },
        });
      }
      if (String(url) === "/inventory/shipping-settings") {
        return Promise.resolve({ data: { package_profiles: [] } });
      }
      if (String(url) === "/inventory/product-orders/1") {
        return Promise.resolve({
          data: {
            id: 1,
            client_name: "Client",
            client_email: "client@example.com",
            delivery_method: "shipping",
            delivery_method_label: "Shipping",
            fulfillment_status: "in_transit",
            fulfillment_status_label: "In transit",
            payment_status: "paid",
            payment_status_label: "Paid",
            total_amount: 120,
            currency: "CAD",
            refunded_cents: 0,
            inventory_committed: true,
            items: [],
            payments: [],
            events: [],
            company: { timezone: "America/Toronto" },
            is_cross_border: true,
            shipping_country: "GB",
            shipping_origin_snapshot: { country: "CA" },
            shipping_address_verification_level: "customer_confirmed_unverified",
            shipping_address_customer_confirmed: true,
            import_charges_acknowledged: true,
            duties_included: false,
            latest_shipment: {
              id: 7,
              carrier: "Carrier",
              service: "International",
              rate_amount_cents: 2200,
              rate_currency: "CAD",
              easypost_customs_info_id: "cstinfo_123",
              customs_forms_json: [
                {
                  form_type: "commercial_invoice",
                  form_url: "https://example.test/forms/invoice.pdf",
                  form_format: "pdf",
                },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <ThemeProvider theme={createTheme()}>
        <ManagerProductOrdersView token="test-token" />
      </ThemeProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /view/i }));

    expect(await screen.findByText(/address verification level:/i)).toBeInTheDocument();
    expect(screen.getByText(/customer confirmed — not provider verified/i)).toBeInTheDocument();
    expect(screen.getByText(/this address was confirmed by the customer but was not automatically verified/i)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("tab", { name: /actions/i }));
    expect(await screen.findByText(/customs documents/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open commercial_invoice/i })).toBeInTheDocument();
  });

  test("renders lifecycle notification timeline entries as readable notes without raw JSON", async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <ManagerProductOrdersView token="test-token" />
      </ThemeProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /view/i }));
    fireEvent.click(await screen.findByRole("tab", { name: /timeline/i }));

    expect(await screen.findByText(/customer shipped email queued/i)).toBeInTheDocument();
    expect(screen.queryByText(/notification_key/i)).not.toBeInTheDocument();
  });

  test("renders variant snapshot details from immutable order-item fields", async () => {
    mockApiGet.mockImplementation((url) => {
      if (String(url) === "/inventory/product-orders") {
        return Promise.resolve({
          data: {
            orders: [
              {
                id: 1,
                client_name: "Client",
                delivery_method: "shipping",
                delivery_method_label: "Shipping",
                fulfillment_status: "pending",
                fulfillment_status_label: "Pending",
                payment_status: "paid",
                payment_status_label: "Paid",
                total_amount: 120,
                currency: "CAD",
                refunded_cents: 0,
              },
            ],
            pagination: { total: 1 },
            company: { country_code: "CA" },
          },
        });
      }
      if (String(url) === "/inventory/shipping-settings") {
        return Promise.resolve({ data: { package_profiles: [] } });
      }
      if (String(url) === "/inventory/product-orders/1") {
        return Promise.resolve({
          data: {
            id: 1,
            client_name: "Client",
            client_email: "client@example.com",
            delivery_method: "shipping",
            delivery_method_label: "Shipping",
            fulfillment_status: "pending",
            fulfillment_status_label: "Pending",
            payment_status: "paid",
            payment_status_label: "Paid",
            total_amount: 120,
            currency: "CAD",
            refunded_cents: 0,
            inventory_committed: true,
            items: [
              {
                id: 71,
                name: "Carry Bag",
                sku: "BAG-001",
                quantity: 2,
                unit_price: "79.00",
                total_price: "158.00",
                variant_label_snapshot: "Black / Mini",
                variant_sku_snapshot: "BAG-BLACK-MINI",
                variant_options_snapshot: [
                  { option_name: "Colour", value: "Black" },
                  { option_name: "Size", value: "Mini" },
                ],
              },
            ],
            payments: [],
            events: [],
            company: { timezone: "America/Toronto" },
            latest_shipment: null,
            parcel_snapshot: null,
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <ThemeProvider theme={createTheme()}>
        <ManagerProductOrdersView token="test-token" />
      </ThemeProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /view/i }));
    fireEvent.click(await screen.findByRole("tab", { name: /items/i }));

    expect((await screen.findAllByText(/black \/ mini/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/variant sku:\s*bag-black-mini/i)).toBeInTheDocument();
    expect(screen.getByText(/colour: black • size: mini/i)).toBeInTheDocument();
  });

  test("opens Commerce Copilot order explanation in preview mode", async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <ManagerProductOrdersView token="test-token" />
      </ThemeProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /view/i }));
    fireEvent.click(await screen.findByRole("button", { name: /explain this order/i }));

    expect(await screen.findByTestId("commerce-copilot-drawer")).toBeInTheDocument();
    expect(mockCopilotDrawer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        initialWorkflow: "explain_order",
        targetProductOrderId: 1,
      })
    );
  });
});
