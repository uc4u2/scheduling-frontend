export const OFFLINE_PAYMENT_METHODS = ["cash", "terminal", "etransfer", "cheque", "other"];
export const OFFLINE_PAYMENT_CURRENCIES = [
  "CAD", "USD", "EUR", "GBP", "AUD", "NZD", "JPY", "SGD", "HKD", "SEK", "DKK", "NOK", "CHF",
];

const MAX_COMPONENT_CENTS = 100000000;
const OFFLINE_RECOVERY_VERSION = 1;
const OFFLINE_RECOVERY_PREFIX = "schedulaa:offline-payment-recovery";

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

export function offlinePaymentRecoveryStorageKey(recoveryScope, appointmentId) {
  const scope = String(recoveryScope || "").trim();
  const bookingId = String(appointmentId || "").trim();
  if (!scope || !bookingId) return null;
  return `${OFFLINE_RECOVERY_PREFIX}:${scope}:${bookingId}`;
}

export function savePendingOfflinePayment(recoveryScope, appointmentId, payload) {
  const storageKey = offlinePaymentRecoveryStorageKey(recoveryScope, appointmentId);
  if (!storageKey || !payload?.idempotency_key) return null;
  const record = {
    version: OFFLINE_RECOVERY_VERSION,
    appointment_id: String(appointmentId),
    payload,
    saved_at: new Date().toISOString(),
  };
  // Session storage is tab-scoped and this record is removed immediately once
  // the server outcome is known. No client or booking profile data is stored.
  window.sessionStorage.setItem(storageKey, JSON.stringify(record));
  return storageKey;
}

export function readPendingOfflinePayment(recoveryScope, appointmentId) {
  const storageKey = offlinePaymentRecoveryStorageKey(recoveryScope, appointmentId);
  if (!storageKey) return null;
  try {
    const record = JSON.parse(window.sessionStorage.getItem(storageKey) || "null");
    if (
      record?.version !== OFFLINE_RECOVERY_VERSION
      || record?.appointment_id !== String(appointmentId)
      || !record?.payload?.idempotency_key
    ) {
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export function clearPendingOfflinePayment(recoveryScope, appointmentId) {
  const storageKey = offlinePaymentRecoveryStorageKey(recoveryScope, appointmentId);
  if (storageKey) window.sessionStorage.removeItem(storageKey);
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
