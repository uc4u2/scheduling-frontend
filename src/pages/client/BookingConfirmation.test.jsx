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
});
