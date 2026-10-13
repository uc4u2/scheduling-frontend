import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import api from "../../utils/api";
import KioskPayPage from "./KioskPayPage";
import KioskSuccessPage from "./KioskSuccessPage";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ token: "signed-token" }),
  useSearchParams: () => [new URLSearchParams("token=signed-token")],
}), { virtual: true });

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const operation = {
  operation_id: 81,
  appointment_id: 19,
  state: "ready",
  paid: false,
  can_initiate: true,
  base_cents: 10000,
  extra_cents: 1000,
  tip_cents: 0,
  subtotal_cents: 11000,
  total_cents: 11000,
  currency: "CAD",
  automatic_tax_enabled: true,
  display: {
    business_name: "Harbor Studio",
    service_name: "Portrait session",
  },
};

const renderPay = () => render(<KioskPayPage />);

describe("Kiosk customer checkout recovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses server-verified amounts, defaults to no tip, and sends integer tip cents", async () => {
    api.get.mockResolvedValueOnce({ data: operation });
    api.post.mockResolvedValueOnce({
      data: { operation: { ...operation, state: "paid", paid: true, can_initiate: false } },
    });
    renderPay();

    expect(await screen.findByText("Harbor Studio")).toBeInTheDocument();
    expect(screen.getByText("100.00 CAD")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No tip" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "10%" }));
    expect(screen.getByText("11.00 CAD")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Continue to secure card payment/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/api/kiosk/checkout-session",
      { token: "signed-token", tip_cents: 1100 },
      { noAuth: true, noCompanyHeader: true }
    ));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/kiosk/success?token=signed-token",
      { replace: true }
    );
  });

  it("rejects a custom amount with fractional minor units before calling the API", async () => {
    api.get.mockResolvedValueOnce({ data: operation });
    renderPay();
    await screen.findByText("Harbor Studio");
    fireEvent.click(screen.getByRole("button", { name: "Custom" }));
    fireEvent.change(screen.getByLabelText("Custom tip (CAD)"), { target: { value: "1.999" } });
    expect(screen.getByText(/no more than two decimals/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue to secure card payment/i })).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("renders only a server-confirmed receipt on the success screen", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        ...operation,
        state: "paid",
        paid: true,
        can_initiate: false,
        total_cents: 12345,
        tax_cents: 345,
        receipt_reference: "pi_safe_reference",
      },
    });
    render(<KioskSuccessPage />);
    expect(await screen.findByText("Payment confirmed")).toBeInTheDocument();
    expect(screen.getByText("123.45 CAD")).toBeInTheDocument();
    expect(screen.getByText(/pi_safe_reference/)).toBeInTheDocument();
  });
});
