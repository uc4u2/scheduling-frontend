import { getActiveCurrency, normalizeCurrency } from "./currency";

export function formatCurrency(value, currency, options = {}) {
  return formatCurrencyWithCode(value, currency, options);
}

export function formatCurrencyWithCode(value, currency, options = {}) {
  const amount = Number(value ?? 0);
  const requested = normalizeCurrency(currency);
  const resolvedCurrency = requested || getActiveCurrency(options?.fallbackCurrency || "USD");
  if (Number.isNaN(amount)) {
    return `${resolvedCurrency} 0.00`;
  }
  try {
    return new Intl.NumberFormat(options.locale || "en-US", {
      style: "currency",
      currency: resolvedCurrency,
      currencyDisplay: options.currencyDisplay || "symbol",
      minimumFractionDigits: options.minimumFractionDigits ?? 2,
      maximumFractionDigits: options.maximumFractionDigits ?? 2,
    }).format(amount);
  } catch (err) {
    return `${resolvedCurrency} ${amount.toFixed(2)}`;
  }
}

export function formatCurrencyFromCents(cents, currency, options = {}) {
  const amount = Number(cents ?? 0) / 100;
  return formatCurrency(amount, currency, options);
}
