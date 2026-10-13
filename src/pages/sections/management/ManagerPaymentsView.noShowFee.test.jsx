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

let mockLocationSearch = "?appointmentId=41&intent=no_show_fee";

jest.mock(
  "react-router-dom",
  () => ({
    useLocation: () => ({
      pathname: "/manager/payments",
      search: mockLocationSearch,
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
    mockLocationSearch = "?appointmentId=41&intent=no_show_fee";
    window.localStorage.clear();
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

  it("retries a lost no-show refund response with the same key and amount", async () => {
    mockLocationSearch = "";
    api.get.mockImplementation((url) => {
      if (url === "/api/manager/payments-and-refunds") {
        return Promise.resolve({
          data: { items: [booking], company: { display_currency: "CAD" } },
        });
      }
      if (url === "/api/payments/list/41") {
        return Promise.resolve({
          data: {
            transactions: [
              {
                id: 501,
                type: "no_show",
                status: "captured",
                amount: 25,
                currency: "CAD",
                provider: "stripe_off_session",
                fee_summary: {
                  remaining_refundable_cents: 2500,
                  refund_recovery: null,
                },
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    api.post
      .mockRejectedValueOnce({ request: {}, message: "Network Error" })
      .mockResolvedValueOnce({
        data: {
          success: true,
          replayed: true,
          refunded_no_show_cents: 2500,
        },
      });

    render(<ManagerPaymentsView />);
    fireEvent.click(await screen.findByRole("button", { name: "View" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Refund no-show fee" }),
    );
    const refundButton = await screen.findByRole("button", {
      name: "Issue refund",
    });
    fireEvent.click(refundButton);
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    const firstPayload = api.post.mock.calls[0][1];
    expect(firstPayload.no_show_refund_cents).toBe(2500);
    expect(firstPayload.idempotency_key).toBeTruthy();
    expect(
      Object.keys(window.localStorage).filter((key) =>
        key.startsWith("schedulaa:noshow-refund"),
      ),
    ).toHaveLength(1);

    fireEvent.click(refundButton);
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    expect(api.post.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        no_show_refund_cents: 2500,
        idempotency_key: firstPayload.idempotency_key,
      }),
    );
    await waitFor(() =>
      expect(
        Object.keys(window.localStorage).filter((key) =>
          key.startsWith("schedulaa:noshow-refund"),
        ),
      ).toHaveLength(0),
    );
  });

  it("recognizes a committed refund after reopening with zero remaining", async () => {
    mockLocationSearch = "";
    window.localStorage.setItem(
      "schedulaa:noshow-refund:v2:7:current:41:501",
      JSON.stringify({
        idempotencyKey: "refund-response-lost",
        amountCents: 2500,
        scope: {
          companyId: "7",
          accountId: "current",
          bookingId: "41",
          transactionId: "501",
        },
      }),
    );
    api.get.mockImplementation((url) => {
      if (url === "/api/manager/payments-and-refunds") {
        return Promise.resolve({
          data: { items: [booking], company: { display_currency: "CAD" } },
        });
      }
      if (url === "/api/payments/list/41") {
        return Promise.resolve({
          data: {
            transactions: [
              {
                id: 501,
                type: "no_show",
                status: "refunded",
                amount: 25,
                currency: "CAD",
                provider: "stripe_off_session",
                fee_summary: {
                  remaining_refundable_cents: 0,
                  refund_recovery: {
                    idempotency_key: "refund-response-lost",
                    amount_cents: 2500,
                    state: "succeeded",
                  },
                },
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(<ManagerPaymentsView />);
    fireEvent.click(await screen.findByRole("button", { name: "View" }));

    expect(
      await screen.findByText("The no-show fee refund was confirmed and recovered."),
    ).toBeInTheDocument();
    expect(
      Object.keys(window.localStorage).filter((key) =>
        key.startsWith("schedulaa:noshow-refund"),
      ),
    ).toHaveLength(0);
    expect(api.post).not.toHaveBeenCalled();
  });
});
