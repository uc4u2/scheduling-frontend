import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import ManagerProductOrdersView from "./ManagerProductOrdersView";

jest.setTimeout(15000);

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPatch = jest.fn();
const mockCopilotDrawer = jest.fn(() => null);
const tokenFor = (claims) => `header.${btoa(JSON.stringify(claims)).replace(/=/g, "")}.signature`;

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
    window.sessionStorage.clear();
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

  test("shows variant-aware refund restock eligibility from immutable order snapshots", async () => {
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
                product_id: 88,
                name: "Carry Bag",
                sku: "BAG-001",
                quantity: 3,
                unit_price: "79.00",
                total_price: "237.00",
                product_track_stock: true,
                product_qty_on_hand: 2,
                variant_label_snapshot: "Black / Mini",
                variant_sku_snapshot: "BAG-BLACK-MINI",
                variant_options_snapshot: [
                  { option_name: "Colour", value: "Black" },
                  { option_name: "Size", value: "Mini" },
                ],
              },
            ],
            extra_metadata: {
              product_order_restocked_qty_by_item: {
                "71": 1,
              },
            },
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
    fireEvent.click(await screen.findByRole("tab", { name: /actions/i }));
    fireEvent.click(await screen.findByText(/^refund$/i));
    fireEvent.click(await screen.findByRole("checkbox", { name: /show advanced refund options/i }));

    expect(await screen.findByText(/carry bag — black \/ mini/i)).toBeInTheDocument();
    expect(screen.getByText(/variant sku:\s*bag-black-mini/i)).toBeInTheDocument();
    expect(screen.getByText(/colour: black • size: mini/i)).toBeInTheDocument();
    expect(document.body.textContent).toContain("Already restocked: 1");
    expect(document.body.textContent).toContain("Remaining eligible: 2");
    expect(document.body.textContent).toContain("On hand: 2");
    const quantityInput = screen.getByRole("spinbutton", { name: /quantity/i });
    expect(quantityInput).toHaveAttribute("max", "2");
  });

  test("reuses the same Stripe refund operation after response loss and page reload", async () => {
    const token = tokenFor({ sub: "manager-7", company_id: 12 });
    const detail = {
      id: 1,
      company_id: 12,
      client_name: "Client",
      delivery_method: "shipping",
      fulfillment_status: "pending",
      payment_status: "paid",
      total_amount: 95,
      currency: "CAD",
      stripe_total_cents: 9500,
      refunded_cents: 0,
      payment_intent_id: "pi_shared_145",
      inventory_committed: true,
      items: [],
      payments: [{ provider: "stripe", status: "captured", currency: "CAD" }],
      events: [],
      company: { id: 12, timezone: "America/Toronto" },
      latest_shipment: null,
      parcel_snapshot: null,
    };
    mockApiGet.mockImplementation((url) => {
      if (String(url) === "/inventory/product-orders") {
        return Promise.resolve({
          data: {
            orders: [{ ...detail }],
            pagination: { total: 1 },
            company: { id: 12, country_code: "CA" },
          },
        });
      }
      if (String(url) === "/inventory/shipping-settings") return Promise.resolve({ data: {} });
      if (String(url) === "/inventory/product-orders/1") return Promise.resolve({ data: detail });
      return Promise.resolve({ data: {} });
    });
    const refundPayloads = [];
    mockApiPost.mockImplementation((url, payload) => {
      if (String(url) !== "/inventory/product-orders/1/refund") return Promise.resolve({ data: {} });
      refundPayloads.push(payload);
      if (refundPayloads.length === 1) return Promise.reject(new Error("connection lost"));
      return Promise.resolve({
        status: 200,
        data: {
          message: "Refund recorded",
          refund_operation: { state: "succeeded", amount_cents: 4000, currency: "CAD" },
          refund_transaction: {
            id: 71,
            amount_cents: 4000,
            currency: "CAD",
            provider: "stripe",
            status: "refunded",
          },
        },
      });
    });

    const view = render(
      <ThemeProvider theme={createTheme()}>
        <ManagerProductOrdersView token={token} connect={{ status: { charges_enabled: true, payouts_enabled: true } }} />
      </ThemeProvider>
    );
    fireEvent.click(await screen.findByRole("button", { name: /view/i }));
    fireEvent.click(await screen.findByRole("tab", { name: /actions/i }));
    fireEvent.click(await screen.findByText(/^refund$/i));
    fireEvent.change(screen.getByRole("spinbutton", { name: /amount/i }), { target: { value: "40.00" } });
    fireEvent.click(screen.getByRole("button", { name: /record refund/i }));
    expect(await screen.findByText(/retry this same refund to check its status/i)).toBeInTheDocument();
    const firstPayload = refundPayloads[0];
    expect(firstPayload.idempotency_key).toMatch(/^product-order-refund:1:/);

    view.unmount();
    render(
      <ThemeProvider theme={createTheme()}>
        <ManagerProductOrdersView token={token} connect={{ status: { charges_enabled: true, payouts_enabled: true } }} />
      </ThemeProvider>
    );
    fireEvent.click(await screen.findByRole("button", { name: /view/i }));
    fireEvent.click(await screen.findByRole("tab", { name: /actions/i }));
    fireEvent.click(await screen.findByText(/^refund$/i));
    expect(await screen.findByDisplayValue("40.00")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /check refund status/i }));

    await waitFor(() => expect(refundPayloads).toHaveLength(2));
    expect(refundPayloads[1]).toEqual(firstPayload);
    expect(await screen.findByText(/refund recorded/i)).toBeInTheDocument();
  }, 30000);

  test("keeps confirmed success when the subsequent order refresh fails", async () => {
    const token = tokenFor({ sub: "manager-8", company_id: 12 });
    let failRefresh = false;
    const detail = {
      id: 1,
      company_id: 12,
      client_name: "Client",
      delivery_method: "shipping",
      fulfillment_status: "pending",
      payment_status: "paid",
      total_amount: 95,
      currency: "CAD",
      stripe_total_cents: 9500,
      refunded_cents: 0,
      payment_intent_id: "pi_shared_refresh",
      inventory_committed: true,
      items: [],
      payments: [{ provider: "stripe", status: "captured", currency: "CAD" }],
      events: [],
      company: { id: 12, timezone: "America/Toronto" },
    };
    mockApiGet.mockImplementation((url) => {
      if (failRefresh && ["/inventory/product-orders", "/inventory/product-orders/1"].includes(String(url))) {
        return Promise.reject(new Error("refresh unavailable"));
      }
      if (String(url) === "/inventory/product-orders") {
        return Promise.resolve({ data: { orders: [detail], pagination: { total: 1 }, company: { id: 12 } } });
      }
      if (String(url) === "/inventory/shipping-settings") return Promise.resolve({ data: {} });
      if (String(url) === "/inventory/product-orders/1") return Promise.resolve({ data: detail });
      return Promise.resolve({ data: {} });
    });
    mockApiPost.mockImplementation((url) => {
      if (String(url) !== "/inventory/product-orders/1/refund") return Promise.resolve({ data: {} });
      failRefresh = true;
      return Promise.resolve({
        status: 200,
        data: {
          refund_operation: { state: "succeeded", amount_cents: 4000, currency: "CAD" },
          refund_transaction: { id: 72, amount_cents: 4000, currency: "CAD", provider: "stripe", status: "refunded" },
        },
      });
    });

    render(
      <ThemeProvider theme={createTheme()}>
        <ManagerProductOrdersView token={token} connect={{ status: { charges_enabled: true, payouts_enabled: true } }} />
      </ThemeProvider>
    );
    fireEvent.click(await screen.findByRole("button", { name: /view/i }));
    fireEvent.click(await screen.findByRole("tab", { name: /actions/i }));
    fireEvent.click(await screen.findByText(/^refund$/i));
    fireEvent.change(screen.getByRole("spinbutton", { name: /amount/i }), { target: { value: "40.00" } });
    fireEvent.click(screen.getByRole("button", { name: /record refund/i }));

    expect(await screen.findByText(/refund saved, but the latest order totals could not be loaded/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh order/i })).toBeInTheDocument();
    expect(screen.queryByText(/unable to record refund/i)).not.toBeInTheDocument();
  });

  test("ignores a delayed refund response after the authenticated account changes", async () => {
    const firstToken = tokenFor({ sub: "manager-7", company_id: 12 });
    const secondToken = tokenFor({ sub: "manager-8", company_id: 13 });
    const detail = {
      id: 1,
      company_id: 12,
      client_name: "Client",
      delivery_method: "shipping",
      fulfillment_status: "pending",
      payment_status: "paid",
      total_amount: 95,
      currency: "CAD",
      stripe_total_cents: 9500,
      refunded_cents: 0,
      payment_intent_id: "pi_stale_account",
      inventory_committed: true,
      items: [],
      payments: [{ provider: "stripe", status: "captured", currency: "CAD" }],
      events: [],
      company: { id: 12, timezone: "America/Toronto" },
    };
    mockApiGet.mockImplementation((url) => {
      if (String(url) === "/inventory/product-orders") {
        return Promise.resolve({ data: { orders: [detail], pagination: { total: 1 }, company: { id: 12 } } });
      }
      if (String(url) === "/inventory/shipping-settings") return Promise.resolve({ data: {} });
      if (String(url) === "/inventory/product-orders/1") return Promise.resolve({ data: detail });
      return Promise.resolve({ data: {} });
    });
    let resolveRefund;
    mockApiPost.mockImplementation((url) => {
      if (String(url) !== "/inventory/product-orders/1/refund") return Promise.resolve({ data: {} });
      return new Promise((resolve) => {
        resolveRefund = resolve;
      });
    });

    const view = render(
      <ThemeProvider theme={createTheme()}>
        <ManagerProductOrdersView token={firstToken} connect={{ status: { charges_enabled: true, payouts_enabled: true } }} />
      </ThemeProvider>
    );
    fireEvent.click(await screen.findByRole("button", { name: /view/i }));
    fireEvent.click(await screen.findByRole("tab", { name: /actions/i }));
    fireEvent.click(await screen.findByText(/^refund$/i));
    fireEvent.change(screen.getByRole("spinbutton", { name: /amount/i }), { target: { value: "40.00" } });
    fireEvent.click(screen.getByRole("button", { name: /record refund/i }));
    await waitFor(() => expect(resolveRefund).toEqual(expect.any(Function)));

    view.rerender(
      <ThemeProvider theme={createTheme()}>
        <ManagerProductOrdersView token={secondToken} connect={{ status: { charges_enabled: true, payouts_enabled: true } }} />
      </ThemeProvider>
    );
    await act(async () => {
      resolveRefund({
        status: 200,
        data: {
          message: "Refund recorded",
          refund_operation: { state: "succeeded", amount_cents: 4000, currency: "CAD" },
          refund_transaction: { id: 73, amount_cents: 4000, currency: "CAD", provider: "stripe" },
        },
      });
      await Promise.resolve();
    });

    expect(screen.queryByText(/^refund recorded$/i)).not.toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(1);
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
        initialPromptText: "Explain order #1 and the safest next manual step.",
        targetProductOrderId: 1,
      })
    );
  });
});
