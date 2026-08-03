import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import BookingConfirmation from "./BookingConfirmation";

const mockApiGet = jest.fn();

jest.mock("react-router-dom", () => ({
  useParams: () => ({ slug: "tenant", bookingId: undefined }),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams("session_id=cs_capture_1")],
}), { virtual: true });

jest.mock("../../utils/api", () => ({
  __esModule: true,
  api: {
    get: (...args) => mockApiGet(...args),
  },
}));

jest.mock("../../utils/cart", () => ({
  clearCart: jest.fn(),
}));

jest.mock("../../utils/tenant", () => ({
  getTenantHostMode: () => "custom",
}));

jest.mock("./PublicPageShell", () => ({ children }) => <>{children}</>);

describe("BookingConfirmation card-on-file return states", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  test("shows the safe failed verification message for capture mode", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        id: "cs_capture_1",
        checkout_mode: "capture",
        customer_status: "failed",
        currency: "CAD",
        payment_status: "unpaid",
        status: "complete",
        line_items: [],
      },
    });

    render(<BookingConfirmation slugOverride="tenant" />);

    await waitFor(() => {
      expect(
        screen.getByText("We could not verify and save this card. Try another card to complete your booking."),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Card verification incomplete")).toBeInTheDocument();
    expect(screen.queryByText("Order confirmed")).not.toBeInTheDocument();
  });

  test("shows the processing message while card verification is still pending", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        id: "cs_capture_1",
        checkout_mode: "capture",
        customer_status: "verifying",
        currency: "CAD",
        payment_status: "unpaid",
        status: "open",
        line_items: [],
      },
    });

    render(<BookingConfirmation slugOverride="tenant" />);

    await waitFor(() => {
      expect(
        screen.getByText("We're confirming the card with Stripe and completing your booking."),
      ).toBeInTheDocument();
    });
  });

  test("shows the slot unavailable message without provider ids", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        id: "cs_capture_1",
        checkout_mode: "capture",
        customer_status: "slot_unavailable",
        currency: "CAD",
        payment_status: "unpaid",
        status: "complete",
        line_items: [],
        error: "setup_intent seti_123 payment_method pm_456 customer cus_789",
      },
    });

    render(<BookingConfirmation slugOverride="tenant" />);

    await waitFor(() => {
      expect(
        screen.getByText("Your card was saved, but the selected time is no longer available. Choose another appointment time."),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(/seti_/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pm_/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cus_/i)).not.toBeInTheDocument();
  });

  test("shows immutable variant product snapshots for a confirmed order", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        id: "cs_capture_1",
        checkout_mode: "payment",
        customer_status: "confirmed",
        currency: "CAD",
        payment_status: "paid",
        status: "complete",
        paid: true,
        amount_subtotal: 15800,
        amount_tax: 0,
        amount_total: 15800,
        line_items: [],
        product_order: {
          id: 41,
          payment_status: "paid",
          stripe_session_id: "cs_capture_1",
          stripe_currency: "CAD",
          stripe_subtotal_cents: 15800,
          stripe_tax_cents: 0,
          stripe_total_cents: 15800,
          total_amount: 158,
          items: [
            {
              id: 71,
              product_id: 11,
              name: "Carry Bag",
              description: "Canvas carry bag",
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
        },
      },
    });

    render(<BookingConfirmation slugOverride="tenant" />);

    expect(await screen.findByText("Products")).toBeInTheDocument();
    expect(await screen.findByText(/carry bag x2/i)).toBeInTheDocument();
    expect(screen.getByText(/black \/ mini/i)).toBeInTheDocument();
    expect(screen.getByText(/variant sku:\s*bag-black-mini/i)).toBeInTheDocument();
    expect(screen.getByText(/colour: black • size: mini/i)).toBeInTheDocument();
    expect(screen.getByText(/unit:\s*CA\$79\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/products total\s*CA\$158\.00/i)).toBeInTheDocument();
  });
});
