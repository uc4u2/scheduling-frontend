import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import OfflinePaymentHistory from "./OfflinePaymentHistory";

const mockPost = jest.fn();

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: { post: (...args) => mockPost(...args) },
}));

const operation = {
  id: "payment-operation:71",
  balance_transaction_id: 71,
  tip_transaction_id: 72,
  transaction_ids: [71, 72],
  kind: "offline_booking_payment",
  provider: "offline",
  status: "captured",
  currency: "CAD",
  total_cents: 13000,
  base_cents: 10000,
  extra_cents: 1000,
  tip_cents: 2000,
  payment_method: "cash",
  recorded_at: "2026-10-11T15:00:00Z",
  correction_eligible: true,
  corrected: false,
  correction: null,
};

const booking = {
  id: 42,
  payment_operations: [operation],
  offline_correction_recovery_scope: "tenant-account-booking-scope",
};

describe("OfflinePaymentHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    mockPost.mockResolvedValue({
      data: {
        payment: { balance_transaction_id: 71, corrected: true, total_cents: 13000 },
        appointment_payment_status: "unpaid",
        money_returned: false,
      },
    });
  });

  test("shows one logical balance and tip operation and requires a correction reason", async () => {
    const onCorrected = jest.fn();
    render(<OfflinePaymentHistory booking={booking} onCorrected={onCorrected} />);

    expect(screen.getByText("130.00 CAD")).toBeInTheDocument();
    expect(screen.getByText(/Service\/base 100.00.*Extra 10.00.*Tip 20.00 CAD/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Correct erroneous entry" }));
    expect(screen.getByText(/does not return money to the customer/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Correct entry" }));
    expect(await screen.findByText("A correction reason is required.")).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Correction reason/i), { target: { value: "Wrong client selected" } });
    fireEvent.click(screen.getByRole("button", { name: "Correct entry" }));
    await waitFor(() => expect(onCorrected).toHaveBeenCalledTimes(1));
    expect(mockPost).toHaveBeenCalledWith(
      "/api/manager/bookings/42/offline-payments/71/correct",
      expect.objectContaining({
        idempotency_key: expect.stringContaining("offline-correction:42:71:"),
        reason: "Wrong client selected",
      }),
    );
    expect(window.sessionStorage.length).toBe(0);
  });

  test("does not expose correction for unsupported, self-only, or corrected operations", () => {
    const unsupported = { ...operation, id: "stripe:8", provider: "stripe", kind: "payment_transaction", correction_eligible: false };
    const corrected = {
      ...operation,
      id: "payment-operation:90",
      correction_eligible: false,
      corrected: true,
      status: "corrected",
      correction: {
        reason: "Duplicate drawer entry",
        corrected_at: "2026-10-11T16:00:00Z",
        money_returned: false,
      },
    };
    render(<OfflinePaymentHistory booking={{ ...booking, payment_operations: [unsupported, corrected] }} />);

    expect(screen.queryByRole("button", { name: "Correct erroneous entry" })).not.toBeInTheDocument();
    expect(screen.getByText(/Original entry retained/)).toHaveTextContent("Duplicate drawer entry");
    expect(screen.getByText(/Original entry retained/)).toHaveTextContent("No money was returned");
  });

  test("reopens and retries a response-lost correction with the exact key and reason", async () => {
    const onCorrected = jest.fn();
    mockPost.mockRejectedValueOnce(new Error("connection lost"));
    render(<OfflinePaymentHistory booking={booking} onCorrected={onCorrected} />);
    fireEvent.click(screen.getByRole("button", { name: "Correct erroneous entry" }));
    fireEvent.change(screen.getByLabelText(/Correction reason/i), { target: { value: "Exact retained reason" } });
    fireEvent.click(screen.getByRole("button", { name: "Correct entry" }));

    expect(await screen.findByText(/response was lost/i)).toBeInTheDocument();
    const originalPayload = mockPost.mock.calls[0][1];
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Correct erroneous payment entry" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Correct erroneous entry" }));
    expect(screen.getByLabelText(/Correction reason/i)).toHaveValue("Exact retained reason");
    expect(screen.getByLabelText(/Correction reason/i)).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Retry correction" }));

    await waitFor(() => expect(onCorrected).toHaveBeenCalledTimes(1));
    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(mockPost.mock.calls[1][1]).toEqual(originalPayload);
    expect(window.sessionStorage.length).toBe(0);
  });

  test("reports a saved correction separately from a failed history refresh", async () => {
    const onCorrected = jest.fn()
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValueOnce(undefined);
    const onRefreshError = jest.fn();
    render(
      <OfflinePaymentHistory
        booking={booking}
        onCorrected={onCorrected}
        onRefreshError={onRefreshError}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Correct erroneous entry" }));
    fireEvent.change(screen.getByLabelText(/Correction reason/i), { target: { value: "Wrong drawer" } });
    fireEvent.click(screen.getByRole("button", { name: "Correct entry" }));

    expect(await screen.findByText(/Correction saved, but the updated booking history could not load/i)).toBeInTheDocument();
    expect(onRefreshError).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/correction failed/i)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Correct erroneous payment entry" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Refresh now" }));
    await waitFor(() => expect(onCorrected).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText(/updated booking history could not load/i)).not.toBeInTheDocument());
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
});
