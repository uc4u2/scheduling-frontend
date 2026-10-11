import {
  amountTextToMinorUnits,
  buildOfflineBookingPaymentPayload,
  minorUnitsToAmountText,
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
});
