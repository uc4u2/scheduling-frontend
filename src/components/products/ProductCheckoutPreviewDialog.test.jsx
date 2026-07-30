import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import ProductCheckoutPreviewDialog from "./ProductCheckoutPreviewDialog";

const mockApiPost = jest.fn();

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
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
    expect(await screen.findByText(/Seller estimate incomplete/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /add product cost/i }));
    expect(onOpenProductCost).toHaveBeenCalledWith(60);
  });
});
