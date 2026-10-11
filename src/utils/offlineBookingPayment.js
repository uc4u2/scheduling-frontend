export const OFFLINE_PAYMENT_METHODS = ["cash", "terminal", "etransfer", "cheque", "other"];
export const OFFLINE_PAYMENT_CURRENCIES = [
  "CAD", "USD", "EUR", "GBP", "AUD", "NZD", "JPY", "SGD", "HKD", "SEK", "DKK", "NOK", "CHF",
];

const MAX_COMPONENT_CENTS = 100000000;

export function amountTextToMinorUnits(value, field = "amount") {
  const text = String(value ?? "").trim();
  if (!/^\d+(?:\.\d{0,2})?$/.test(text)) {
    throw new TypeError(`${field} must be a non-negative amount with no more than two decimals`);
  }
  const [whole, fraction = ""] = text.split(".");
  const cents = (Number(whole) * 100) + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_COMPONENT_CENTS) {
    throw new TypeError(`${field} is out of range`);
  }
  return cents;
}

export function minorUnitsToAmountText(value) {
  const cents = Number.isSafeInteger(value) && value >= 0 ? value : 0;
  return (cents / 100).toFixed(2);
}

export function createOfflinePaymentIdempotencyKey(appointmentId) {
  const random = window.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `offline-booking:${appointmentId}:${random}`;
}

export function buildOfflineBookingPaymentPayload({
  idempotencyKey,
  baseAmount,
  extraAmount,
  tipAmount,
  currency,
  paymentMethod,
  completesPayment,
  reference,
  note,
}) {
  const baseCents = amountTextToMinorUnits(baseAmount, "Service/base amount");
  const extraCents = amountTextToMinorUnits(extraAmount, "Additional charge");
  const tipCents = amountTextToMinorUnits(tipAmount, "Tip");
  const totalCents = baseCents + extraCents + tipCents;
  if (totalCents <= 0) throw new TypeError("Enter an amount greater than zero");
  const normalizedCurrency = String(currency || "").trim().toUpperCase();
  if (!OFFLINE_PAYMENT_CURRENCIES.includes(normalizedCurrency)) {
    throw new TypeError("Choose a supported currency");
  }
  let normalizedMethod = String(paymentMethod || "").trim().toLowerCase();
  if (normalizedMethod === "card") normalizedMethod = "terminal";
  if (!OFFLINE_PAYMENT_METHODS.includes(normalizedMethod)) {
    throw new TypeError("Choose a supported payment method");
  }
  if (!idempotencyKey) throw new TypeError("Payment request key is missing. Reopen this form and try again");
  if (typeof completesPayment !== "boolean") throw new TypeError("Completion choice is required");
  return {
    idempotency_key: idempotencyKey,
    base_cents: baseCents,
    extra_cents: extraCents,
    tip_cents: tipCents,
    total_cents: totalCents,
    currency: normalizedCurrency,
    payment_method: normalizedMethod,
    completes_payment: completesPayment,
    reference: String(reference || "").trim() || null,
    note: String(note || "").trim() || null,
  };
}
