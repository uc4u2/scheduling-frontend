import {
  amountTextToMinorUnits,
  buildOfflineBookingPaymentPayload,
  clearPendingOfflinePayment,
  minorUnitsToAmountText,
  readPendingOfflinePayment,
  savePendingOfflinePayment,
} from "./offlineBookingPayment";

describe("offline booking payment payload", () => {
  it("preserves explicit base, extra, tip, total, currency, and completion", () => {
    expect(buildOfflineBookingPaymentPayload({
      idempotencyKey: "offline-1",
      baseAmount: "100.00",
      extraAmount: "10",
      tipAmount: "20.00",
      currency: "cad",
      paymentMethod: "cash",
      completesPayment: false,
      reference: " drawer 42 ",
      note: " received now ",
    })).toEqual({
      idempotency_key: "offline-1",
      base_cents: 10000,
      extra_cents: 1000,
      tip_cents: 2000,
      total_cents: 13000,
      currency: "CAD",
      payment_method: "cash",
      completes_payment: false,
      reference: "drawer 42",
      note: "received now",
    });
  });

  it("normalizes the former external card value to terminal", () => {
    expect(buildOfflineBookingPaymentPayload({
      idempotencyKey: "offline-2",
      baseAmount: "1",
      extraAmount: "0",
      tipAmount: "0",
      currency: "USD",
      paymentMethod: "card",
      completesPayment: true,
    }).payment_method).toBe("terminal");
  });

  it("rejects fractional minor units, mismatched formats, and zero totals", () => {
    expect(() => amountTextToMinorUnits("1.001")).toThrow(/two decimals/);
    expect(() => buildOfflineBookingPaymentPayload({
      idempotencyKey: "offline-3",
      baseAmount: "0",
      extraAmount: "0",
      tipAmount: "0",
      currency: "CAD",
      paymentMethod: "cash",
      completesPayment: false,
    })).toThrow(/greater than zero/);
    expect(minorUnitsToAmountText(1234)).toBe("12.34");
  });

  it("scopes an unresolved exact payload to the server recovery scope and booking", () => {
    window.sessionStorage.clear();
    const payload = buildOfflineBookingPaymentPayload({
      idempotencyKey: "offline-recovery-1",
      baseAmount: "25",
      extraAmount: "0",
      tipAmount: "5",
      currency: "CAD",
      paymentMethod: "etransfer",
      completesPayment: false,
      note: "temporary exact note",
    });
    savePendingOfflinePayment("tenant-account-scope", 42, payload);
    expect(readPendingOfflinePayment("tenant-account-scope", 42)?.payload).toEqual(payload);
    expect(readPendingOfflinePayment("other-account-scope", 42)).toBeNull();
    expect(readPendingOfflinePayment("tenant-account-scope", 43)).toBeNull();
    clearPendingOfflinePayment("tenant-account-scope", 42);
    expect(readPendingOfflinePayment("tenant-account-scope", 42)).toBeNull();
  });
});
