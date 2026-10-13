import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ManagerPaymentsView from "./ManagerPaymentsView";
import { api } from "../../../utils/api";

jest.mock("../../../utils/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
  isStripeOnboardingIncomplete: jest.fn(() => false),
}));

jest.mock(
  "react-router-dom",
  () => ({
    useLocation: () => ({
      pathname: "/manager/payments",
      search: "?appointmentId=41&intent=no_show_fee",
    }),
  }),
  { virtual: true },
);

jest.mock("../../finance/FinanceInvoiceDetailDialog", () => () => null);

const booking = {
  id: 41,
  company_id: 7,
  status: "no_show",
  payment_status: "unpaid",
  currency: "CAD",
  date: "2026-10-12",
  start_time: "10:00:00",
  end_time: "11:00:00",
  appointment_timezone: "America/Toronto",
  client: {
    id: 9,
    full_name: "Nora Client",
    email: "nora@example.com",
  },
  service: { id: 3, name: "Consultation" },
  payments: [],
};

describe("ManagerPaymentsView no-show fee confirmation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === "/api/manager/payments-and-refunds") {
        return Promise.resolve({
          data: { items: [booking], company: { display_currency: "CAD" } },
        });
      }
      if (url === "/api/manager/bookings/41/no-show-fee-context") {
        return Promise.resolve({
          data: {
            appointment_id: 41,
            client_id: 9,
            appointment_status: "no_show",
            service_payment_status: "unpaid",
            currency_contract: { status: "resolved", currency: "CAD" },
            suggestion: {
              status: "configured_zero",
              amount_cents: 0,
              currency: "CAD",
              source: "cancellation_fee",
            },
            accepted_policy: {
              available: true,
              policy_text: "A missed appointment fee may apply.",
              accepted_at: "2026-10-01T12:00:00",
            },
            fee: { exists: false, state: "not_requested" },
          },
        });
      }
      if (url === "/api/manager/clients/9/payment-methods") {
        return Promise.resolve({
          data: {
            payment_methods: [
              {
                id: "pm_verified",
                card: {
                  brand: "visa",
                  last4: "4242",
                  exp_month: 12,
                  exp_year: 2030,
                },
              },
            ],
          },
        });
      }
      if (url === "/api/payments/list/41") {
        return Promise.resolve({ data: { transactions: [] } });
      }
      return Promise.resolve({ data: {} });
    });
    api.post.mockResolvedValue({
      data: { message: "No-show fee captured", payment_purpose: "no_show_fee" },
    });
  });

  it("shows a separate explicit fee with no hard-coded fallback and sends its purpose", async () => {
    render(<ManagerPaymentsView />);

    expect(await screen.findByText("Confirm no-show fee")).toBeInTheDocument();
    expect(
      screen.getByText(/This is a separate no-show fee/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/cancellation-fee setting is zero/i),
    ).toBeInTheDocument();
    expect(screen.getByText("A missed appointment fee may apply.")).toBeInTheDocument();
    expect(screen.getByText(/VISA.*4242/i)).toBeInTheDocument();

    const amountInput = screen.getByLabelText("Amount (CAD)");
    expect(amountInput).toHaveValue(null);
    fireEvent.change(amountInput, { target: { value: "25.00" } });
    fireEvent.click(screen.getByRole("button", { name: "Charge no-show fee" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(api.post).toHaveBeenCalledWith(
      "/api/manager/charge",
      expect.objectContaining({
        appointment_id: 41,
        client_id: 9,
        payment_method_id: "pm_verified",
        amount_cents: 2500,
        currency: "cad",
        payment_purpose: "no_show_fee",
        extra_amount_cents: 0,
        tip_amount_cents: 0,
      }),
    );
  });

  it("blocks charging when fee context is unavailable instead of suggesting 25", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/api/manager/payments-and-refunds") {
        return Promise.resolve({
          data: { items: [booking], company: { display_currency: "CAD" } },
        });
      }
      if (url === "/api/manager/bookings/41/no-show-fee-context") {
        return Promise.reject({
          response: { data: { error: "Fee settings are temporarily unavailable." } },
        });
      }
      if (url === "/api/manager/clients/9/payment-methods") {
        return Promise.resolve({
          data: {
            payment_methods: [
              {
                id: "pm_verified",
                card: {
                  brand: "visa",
                  last4: "4242",
                  exp_month: 12,
                  exp_year: 2030,
                },
              },
            ],
          },
        });
      }
      if (url === "/api/payments/list/41") {
        return Promise.resolve({ data: { transactions: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    render(<ManagerPaymentsView />);

    expect(
      await screen.findByText("Fee settings are temporarily unavailable."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/25\.00/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Charge no-show fee" }),
    ).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
  });
});
