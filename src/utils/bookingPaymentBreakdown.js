export const BOOKING_PAYMENT_BREAKDOWN_VERSION = 1;
export const MANAGER_BOOKING_PAYMENT_LINK_SOURCE = "manager_booking_payment_link";

const requireMinorUnits = (value, field) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative integer`);
  }
  return value;
};

export function buildManagerBookingPaymentBreakdown({
  baseCents,
  extraCents,
  tipCents,
  currency,
}) {
  const base = requireMinorUnits(baseCents, "baseCents");
  const extra = requireMinorUnits(extraCents, "extraCents");
  const tip = requireMinorUnits(tipCents, "tipCents");
  const normalizedCurrency = String(currency || "").trim().toUpperCase();
  if (!normalizedCurrency) throw new TypeError("currency is required");

  return {
    version: BOOKING_PAYMENT_BREAKDOWN_VERSION,
    source: MANAGER_BOOKING_PAYMENT_LINK_SOURCE,
    base_cents: base,
    extra_cents: extra,
    tip_cents: tip,
    total_cents: base + extra + tip,
    currency: normalizedCurrency,
  };
}

export function withManagerBookingPaymentBreakdown(payload, components) {
  const paymentBreakdown = buildManagerBookingPaymentBreakdown(components);
  if (payload.amount_cents !== paymentBreakdown.total_cents) {
    throw new TypeError("amount_cents must equal the payment breakdown total");
  }
  return { ...payload, payment_breakdown: paymentBreakdown };
}
