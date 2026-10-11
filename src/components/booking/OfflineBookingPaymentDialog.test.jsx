import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import OfflineBookingPaymentDialog from "./OfflineBookingPaymentDialog";

const mockPost = jest.fn();

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: { post: (...args) => mockPost(...args) },
}));

function renderDialog(props = {}) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <OfflineBookingPaymentDialog
        open
        booking={{ id: 42, service: "Haircut", client_name: "Casey Client" }}
        initialBaseCents={10000}
        initialExtraCents={1000}
        initialTipCents={2000}
        initialCurrency="CAD"
        onClose={jest.fn()}
        onRecorded={jest.fn()}
        onNavigateFinance={jest.fn()}
        {...props}
      />
    </ThemeProvider>
  );
}

describe("OfflineBookingPaymentDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({
      data: {
        payment: { total_cents: 13000, currency: "CAD" },
        appointment_payment_status: "unpaid",
      },
    });
  });

  test("submits explicit new-money components and leaves completion unchecked by default", async () => {
    const onRecorded = jest.fn();
    renderDialog({ onRecorded });

    expect(screen.getByRole("checkbox", { name: /This completes payment/i })).not.toBeChecked();
    expect(screen.getByText("Total received now: 130.00 CAD")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Record payment" }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
    expect(mockPost).toHaveBeenCalledWith(
      "/api/manager/bookings/42/offline-payments",
      expect.objectContaining({
        base_cents: 10000,
        extra_cents: 1000,
        tip_cents: 2000,
        total_cents: 13000,
        currency: "CAD",
        payment_method: "cash",
        completes_payment: false,
        idempotency_key: expect.stringContaining("offline-booking:42:"),
      })
    );
    await waitFor(() => expect(onRecorded).toHaveBeenCalled());
  });

  test("keeps the same request key after a retryable error and offers Finance redirect", async () => {
    const onNavigateFinance = jest.fn();
    mockPost
      .mockRejectedValueOnce({
        response: {
          data: {
            error: "Use the linked Finance invoice.",
            finance_path: "/manager/finance-invoices?invoiceId=9",
          },
        },
      })
      .mockResolvedValueOnce({ data: { payment: { total_cents: 13000, currency: "CAD" } } });
    renderDialog({ onNavigateFinance });

    fireEvent.click(screen.getByRole("button", { name: "Record payment" }));
    expect(await screen.findByText("Use the linked Finance invoice.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Finance" }));
    expect(onNavigateFinance).toHaveBeenCalledWith("/manager/finance-invoices?invoiceId=9");

    const firstKey = mockPost.mock.calls[0][1].idempotency_key;
    fireEvent.click(screen.getByRole("button", { name: "Record payment" }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));
    expect(mockPost.mock.calls[1][1].idempotency_key).toBe(firstKey);
  });
});
