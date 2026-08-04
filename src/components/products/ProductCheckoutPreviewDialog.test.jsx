import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import ProductCheckoutPreviewDialog from "./ProductCheckoutPreviewDialog";

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
  },
}));

function renderDialog(props = {}) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <ProductCheckoutPreviewDialog
        open
        onClose={jest.fn()}
        token="token-123"
        products={[
          {
            id: 60,
            name: "Smoky-Lemon Quartz Necklace",
            price: 50,
            cost: 20,
            updated_at: "2026-07-30T10:00:00Z",
            shipping_weight_grams: 50,
            is_digital: false,
            is_active: true,
            delivery_methods_override_enabled: false,
          },
        ]}
        globalDeliveryPolicy={{
          enabled: true,
          allow_pickup: true,
          allow_shipping: true,
          allow_local_delivery: false,
        }}
        onNotify={jest.fn()}
        {...props}
      />
    </ThemeProvider>
  );
}

async function expandSellerEstimate() {
  await screen.findByText(/seller estimate/i);
  const accordionButton = screen
    .getAllByRole("button")
    .find((button) => /seller estimate/i.test(button.textContent || ""));
  expect(accordionButton).not.toBeNull();
  await userEvent.click(accordionButton);
}

describe("ProductCheckoutPreviewDialog seller estimate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue() } });
    mockApiGet.mockResolvedValue({ data: { variant_mode: "none", options: [], variants: [] } });
  });

  test("shows complete seller estimate and copies the seller summary", async () => {
    mockApiPost.mockResolvedValue({
      data: {
        domain: "product_checkout",
        preview_only: true,
        currency: "CAD",
        product_lines: [
          {
            product_id: 60,
            name: "Smoky-Lemon Quartz Necklace",
            quantity: 2,
            unit_price: "50.00",
            line_total: "100.00",
            physical: true,
          },
        ],
        customer_view: {
          product_subtotal: "100.00",
          shipping_amount: "14.20",
          known_amount_before_tax: "114.20",
          final_total: null,
          final_total_status: "provider_calculated",
        },
        delivery: {
          method: "shipping",
          customer_label: "Shipping",
          selected_rate: {
            carrier: "CanadaPost",
            service: "ExpeditedParcel",
            amount: "14.20",
            currency: "CAD",
          },
          test_rates: [],
        },
        tax: {
          handling_mode: "stripe_checkout_automatic_tax",
          prices_include_tax: false,
          message: "Tax will be calculated during Stripe Checkout.",
        },
        international: {
          cross_border: false,
        },
        readiness: { items: [] },
        seller_view: {
          status: "complete",
          currency: "CAD",
          revenue: {
            product_revenue_before_tax: "100.00",
            shipping_collected: "14.20",
            known_customer_amount_before_tax: "114.20",
          },
          costs: {
            product_cost_total: "40.00",
            estimated_shipping_label_cost: "14.20",
            known_costs_total: "54.20",
          },
          margin: {
            product_gross_margin: "60.00",
            shipping_difference: "0.00",
            estimated_order_contribution: "60.00",
            estimated_contribution_rate_percent: "52.54",
          },
          recommended_actions: [],
          warnings: [],
          excluded_costs: ["Stripe and payment-processing fees", "Packaging materials"],
          disclaimer: "This is an estimate and is not accounting profit.",
        },
      },
    });

    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /preview customer checkout/i }));
    expect(await screen.findByText(/Preview only — no Product Order, inventory reservation, payment, shipping label, or customer notification will be created\./i)).toBeInTheDocument();
    await expandSellerEstimate();
    expect(await screen.findByText(/Estimated order contribution/i)).toBeInTheDocument();
    expect(screen.getByText(/52\.54%/i)).toBeInTheDocument();
    expect(screen.getByText(/This is an estimate and is not accounting profit\./i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /copy seller estimate/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("Seller estimate"));
  });

  test("shows missing-cost action in a partial seller estimate", async () => {
    const onOpenProductCost = jest.fn();
    mockApiPost.mockResolvedValue({
      data: {
        domain: "product_checkout",
        preview_only: true,
        currency: "CAD",
        product_lines: [
          {
            product_id: 60,
            name: "Smoky-Lemon Quartz Necklace",
            quantity: 1,
            unit_price: "50.00",
            line_total: "50.00",
            physical: true,
          },
        ],
        customer_view: {
          product_subtotal: "50.00",
          shipping_amount: "0.00",
          known_amount_before_tax: "50.00",
          final_total: null,
          final_total_status: "provider_calculated",
        },
        delivery: {
          method: "pickup",
          customer_label: "Pickup",
          selected_rate: null,
          test_rates: [],
        },
        tax: {
          handling_mode: "stripe_checkout_automatic_tax",
          prices_include_tax: false,
          message: "Tax will be calculated during Stripe Checkout.",
        },
        international: {
          cross_border: false,
        },
        readiness: { items: [] },
        seller_view: {
          status: "partial",
          currency: "CAD",
          revenue: {
            product_revenue_before_tax: "50.00",
            shipping_collected: "0.00",
            known_customer_amount_before_tax: "50.00",
          },
          costs: {
            product_cost_total: null,
            estimated_shipping_label_cost: "0.00",
            known_costs_total: null,
          },
          margin: {
            product_gross_margin: null,
            shipping_difference: "0.00",
            estimated_order_contribution: null,
            estimated_contribution_rate_percent: null,
          },
          recommended_actions: [{ code: "open_product_cost", label: "Add Product cost" }],
          warnings: ["Add the Product cost to calculate estimated margin."],
          excluded_costs: ["Stripe and payment-processing fees"],
          disclaimer: "This is an estimate and is not accounting profit.",
        },
      },
    });

    renderDialog({ onOpenProductCost });
    await userEvent.click(screen.getByRole("button", { name: /preview customer checkout/i }));
    await expandSellerEstimate();
    expect(await screen.findByText(/Partial estimate/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /add product cost/i }));
    expect(onOpenProductCost).toHaveBeenCalledWith(60);
  });

  test("loads variant configuration, requires a complete selection, and sends variant_id in the preview payload", async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        variant_mode: "active",
        runtime_selling_enabled: true,
        options: [
          {
            id: 1,
            name: "Colour",
            values: [
              { id: 11, value: "Black", swatch_color: "#000000" },
              { id: 12, value: "White", swatch_color: "#FFFFFF" },
            ],
          },
          {
            id: 2,
            name: "Size",
            values: [
              { id: 21, value: "Mini" },
              { id: 22, value: "Medium" },
            ],
          },
        ],
        variants: [
          {
            id: 101,
            sku: "BAG-BLACK-MINI",
            effective_price: "79.00",
            price_override: "79.00",
            qty_on_hand: 3,
            is_active: true,
            selection: [
              { option_id: 1, option_name: "Colour", value_id: 11, value: "Black" },
              { option_id: 2, option_name: "Size", value_id: 21, value: "Mini" },
            ],
          },
          {
            id: 102,
            sku: "BAG-WHITE-MEDIUM",
            effective_price: "69.00",
            price_override: null,
            qty_on_hand: 0,
            is_active: true,
            selection: [
              { option_id: 1, option_name: "Colour", value_id: 12, value: "White" },
              { option_id: 2, option_name: "Size", value_id: 22, value: "Medium" },
            ],
          },
        ],
      },
    });
    mockApiPost.mockResolvedValueOnce({
      data: {
        domain: "product_checkout",
        preview_only: true,
        currency: "CAD",
        product_lines: [
          {
            product_id: 60,
            variant_id: 101,
            name: "Smoky-Lemon Quartz Necklace",
            quantity: 2,
            unit_price: "79.00",
            line_total: "158.00",
            variant_label: "Black / Mini",
            variant_sku: "BAG-BLACK-MINI",
            variant_options: [
              { option_name: "Colour", value: "Black" },
              { option_name: "Size", value: "Mini" },
            ],
            effective_price_source: "variant_override",
            image_source_label: "Variant override",
            variant_preview_mode: "active_selling_preview",
            physical: true,
          },
        ],
        customer_view: {
          product_subtotal: "158.00",
          shipping_amount: "0.00",
          known_amount_before_tax: "158.00",
          final_total: null,
          final_total_status: "provider_calculated",
        },
        delivery: {
          method: "pickup",
          customer_label: "Pickup",
          selected_rate: null,
          test_rates: [],
        },
        tax: {
          handling_mode: "stripe_checkout_automatic_tax",
          prices_include_tax: false,
          message: "Tax will be calculated during Stripe Checkout.",
        },
        international: { cross_border: false },
        readiness: { items: [] },
        seller_view: {
          status: "partial",
          currency: "CAD",
          lines: [
            {
              product_id: 60,
              variant_id: 101,
              name: "Smoky-Lemon Quartz Necklace",
              variant_label: "Black / Mini",
              variant_sku: "BAG-BLACK-MINI",
              variant_options: [
                { option_name: "Colour", value: "Black" },
                { option_name: "Size", value: "Mini" },
              ],
              quantity: 2,
              unit_price: "79.00",
              line_total: "158.00",
              product_unit_cost: "20.00",
              product_cost_total: "40.00",
              price_source_label: "Variant price",
            },
          ],
          revenue: {
            product_revenue_before_tax: "158.00",
            shipping_collected: "0.00",
            known_customer_amount_before_tax: "158.00",
          },
          costs: {
            product_cost_total: "40.00",
            estimated_shipping_label_cost: "0.00",
            known_costs_total: "40.00",
          },
          margin: {
            product_gross_margin: "118.00",
            shipping_difference: "0.00",
            estimated_order_contribution: "118.00",
            estimated_contribution_rate_percent: "74.68",
          },
          recommended_actions: [],
          warnings: [],
          excluded_costs: [],
          disclaimer: "This is an estimate and is not accounting profit.",
        },
      },
    });

    renderDialog({
      products: [
        {
          id: 60,
          name: "Smoky-Lemon Quartz Necklace",
          price: 50,
          updated_at: "2026-07-30T10:00:00Z",
          shipping_weight_grams: 50,
          is_digital: false,
          is_active: true,
          variant_mode: "active",
          track_stock: true,
          delivery_methods_override_enabled: false,
        },
      ],
    });

    expect(await screen.findByText(/variant selection/i)).toBeInTheDocument();
    expect(screen.getByText(/choose a complete variant combination/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Black" }));
    await userEvent.click(screen.getByRole("button", { name: "Mini" }));
    await userEvent.click(screen.getByRole("button", { name: /preview customer checkout/i }));

    expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/product-checkout-preview",
      expect.objectContaining({
        product_lines: [{ product_id: 60, variant_id: 101, quantity: 1 }],
      }),
      expect.any(Object)
    );
    expect(await screen.findByText(/black \/ mini/i)).toBeInTheDocument();
    expect(screen.getAllByText(/variant sku:\s*bag-black-mini/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/price source:\s*variant price/i).length).toBeGreaterThan(0);
  });
});
