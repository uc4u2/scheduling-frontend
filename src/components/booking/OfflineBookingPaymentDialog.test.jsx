import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import OfflineBookingPaymentDialog from "./OfflineBookingPaymentDialog";

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

const resolvedContext = (currency = "CAD", scope = "tenant-user-booking-42") => ({
  data: {
    appointment_id: 42,
    recovery_scope: scope,
    currency_contract: {
      status: "resolved",
      currency,
      source: "payment_transaction",
      historical_locked: true,
      evidence_currencies: [currency],
      message: "Currency is fixed by this booking's existing payment history.",
    },
  },
});

function renderDialog(props = {}) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <OfflineBookingPaymentDialog
        open
        booking={{ id: 42, service: "Haircut", client_name: "Casey Client" }}
        initialBaseCents={10000}
        initialExtraCents={1000}
        initialTipCents={2000}
        initialCurrency="USD"
        onClose={jest.fn()}
        onRecorded={jest.fn()}
        onRefreshError={jest.fn()}
        onNavigateFinance={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe("OfflineBookingPaymentDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    mockGet.mockImplementation((url) => {
      if (url.endsWith("/context")) return Promise.resolve(resolvedContext());
      return Promise.reject({ response: { status: 404, data: { operation_found: false } } });
    });
    mockPost.mockResolvedValue({
      data: {
        payment: { total_cents: 13000, currency: "CAD", appointment_id: 42 },
        appointment_payment_status: "unpaid",
      },
    });
  });

  test.each([375, 1280])("submits the server-bound currency and components at %ipx", async (width) => {
    window.innerWidth = width;
    const onRecorded = jest.fn();
    renderDialog({ onRecorded });

    expect(await screen.findByDisplayValue("CAD")).toBeDisabled();
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
      }),
    );
    await waitFor(() => expect(onRecorded).toHaveBeenCalled());
    expect(window.sessionStorage.length).toBe(0);
  });

  test("recovers a committed response-lost operation after closing and reopening", async () => {
    const onRecorded = jest.fn();
    mockPost.mockRejectedValueOnce(new Error("connection lost"));
    const view = renderDialog({ onRecorded });
    await screen.findByDisplayValue("CAD");
    fireEvent.change(screen.getByLabelText("Note (optional)"), { target: { value: "Exact original note" } });
    fireEvent.click(screen.getByRole("button", { name: "Record payment" }));

    expect(await screen.findByText(/response was lost/i)).toBeInTheDocument();
    const firstPayload = mockPost.mock.calls[0][1];
    expect(firstPayload.note).toBe("Exact original note");
    expect(window.sessionStorage.length).toBe(1);
    view.unmount();

    let recoveryParams;
    mockGet.mockImplementation((url, config) => {
      if (url.endsWith("/context")) return Promise.resolve(resolvedContext());
      if (url.endsWith("/recovery")) {
        recoveryParams = config.params;
        return Promise.resolve({
          data: {
            operation_found: true,
            payment: { total_cents: 13000, currency: "CAD", appointment_id: 42, replayed: true },
            appointment_payment_status: "unpaid",
          },
        });
      }
      throw new Error(`Unexpected GET ${url}`);
    });
    renderDialog({ onRecorded });
    expect(await screen.findByRole("button", { name: "Retry / recover payment" })).toBeEnabled();
    expect(screen.getByLabelText("Note (optional)")).toHaveValue("Exact original note");
    expect(screen.getByLabelText("Note (optional)")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Retry / recover payment" }));

    await waitFor(() => expect(onRecorded).toHaveBeenCalledTimes(1));
    expect(recoveryParams.idempotency_key).toBe(firstPayload.idempotency_key);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.length).toBe(0);
  });

  test("shows a definitive online-payment conflict without treating it as an ambiguous retry", async () => {
    mockPost.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { error: "A hosted payment link is still active for this booking." },
      },
    });
    renderDialog();
    await screen.findByDisplayValue("CAD");
    fireEvent.click(screen.getByRole("button", { name: "Record payment" }));

    expect(await screen.findByText("A hosted payment link is still active for this booking.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start new payment entry" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry / recover payment" })).not.toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(0);
  });

  test("does not report payment failure when only the dashboard refresh fails", async () => {
    const onClose = jest.fn();
    const onRecorded = jest.fn().mockRejectedValue(new Error("refresh failed"));
    const onRefreshError = jest.fn();
    renderDialog({ onClose, onRecorded, onRefreshError });
    await screen.findByDisplayValue("CAD");
    fireEvent.click(screen.getByRole("button", { name: "Record payment" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onRefreshError).toHaveBeenCalledTimes(1));
    expect(onRefreshError.mock.calls[0][0].message).toBe("refresh failed");
    expect(window.sessionStorage.length).toBe(0);
    expect(screen.queryByText("Unable to record the offline payment.")).not.toBeInTheDocument();
  });

  test("blocks an ambiguous historical currency instead of using the display currency", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        appointment_id: 42,
        recovery_scope: "ambiguous-scope",
        currency_contract: {
          status: "ambiguous",
          currency: null,
          source: "historical_evidence_conflict",
          historical_locked: true,
          evidence_currencies: ["CAD", "USD"],
          message: "Resolve the mixed currency history first.",
        },
      },
    });
    renderDialog();
    expect(await screen.findAllByText("Resolve the mixed currency history first.")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Record payment" })).toBeDisabled();
    expect(mockPost).not.toHaveBeenCalled();
  });

  test("ignores a delayed context response after switching bookings", async () => {
    let resolveFirst;
    mockGet
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce(resolvedContext("USD", "scope-43"));
    const view = renderDialog();
    view.rerender(
      <ThemeProvider theme={createTheme()}>
        <OfflineBookingPaymentDialog
          open
          booking={{ id: 43, service: "Colour", client_name: "New Client" }}
          initialBaseCents={5000}
          initialCurrency="USD"
          onClose={jest.fn()}
          onRecorded={jest.fn()}
        />
      </ThemeProvider>,
    );
    expect(await screen.findByDisplayValue("USD")).toBeDisabled();
    resolveFirst(resolvedContext("CAD", "scope-42"));
    expect(await screen.findByDisplayValue("USD")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("CAD")).not.toBeInTheDocument();
  });
});
