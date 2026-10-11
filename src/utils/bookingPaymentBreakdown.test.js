import {
  buildManagerBookingPaymentBreakdown,
  withManagerBookingPaymentBreakdown,
} from "./bookingPaymentBreakdown";

describe("manager booking payment breakdown", () => {
  it("preserves exact minor-unit base, extra, tip, total, and currency", () => {
    expect(
      buildManagerBookingPaymentBreakdown({
        baseCents: 10000,
        extraCents: 1000,
        tipCents: 2000,
        currency: "cad",
      })
    ).toEqual({
      version: 1,
      source: "manager_booking_payment_link",
      base_cents: 10000,
      extra_cents: 1000,
      tip_cents: 2000,
      total_cents: 13000,
      currency: "CAD",
    });
  });

  it("rejects fractional minor units and mismatched request totals", () => {
    expect(() =>
      buildManagerBookingPaymentBreakdown({
        baseCents: 100.5,
        extraCents: 0,
        tipCents: 0,
        currency: "CAD",
      })
    ).toThrow(/baseCents/);
    expect(() =>
      withManagerBookingPaymentBreakdown(
        { amount_cents: 12999 },
        { baseCents: 10000, extraCents: 1000, tipCents: 2000, currency: "CAD" }
      )
    ).toThrow(/must equal/);
  });

  it("supports zero tip, extra-only, percentage rounding results, and USD", () => {
    expect(
      buildManagerBookingPaymentBreakdown({
        baseCents: 0,
        extraCents: 333,
        tipCents: Math.round(333 * 0.15),
        currency: "USD",
      })
    ).toMatchObject({
      base_cents: 0,
      extra_cents: 333,
      tip_cents: 50,
      total_cents: 383,
      currency: "USD",
    });
  });
});
