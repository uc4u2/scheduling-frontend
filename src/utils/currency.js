// src/utils/currency.js
// Centralized currency helpers shared across dashboard + public flows.

// We keep a module-level fallback so SSR/tests without localStorage still work.
let memoryCurrency = "USD";
const STORAGE_KEY = "company_currency";

export const COUNTRY_TO_CURRENCY = Object.freeze({
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  IE: "EUR",
  FR: "EUR",
  DE: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  BE: "EUR",
  PT: "EUR",
  AT: "EUR",
  FI: "EUR",
  LU: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  CY: "EUR",
  MT: "EUR",
  SK: "EUR",
  SI: "EUR",
  GR: "EUR",
  AU: "AUD",
  NZ: "NZD",
  JP: "JPY",
  SG: "SGD",
  HK: "HKD",
  SE: "SEK",
  DK: "DKK",
  NO: "NOK",
  CH: "CHF",
});

export const SUPPORTED_CURRENCIES = new Set([
  "USD",
  "CAD",
  "EUR",
  "GBP",
  "AUD",
  "NZD",
  "JPY",
  "SGD",
  "HKD",
  "SEK",
  "DKK",
  "NOK",
  "CHF",
]);

const CURRENCY_KEYS = [
  "display_currency",
  "preferred_billing_currency",
  "billing_currency",
  "currency_code",
  "currency",
  "stripe_currency",
  "price_currency",
  "default_currency",
];

const COMPANY_KEYS = ["company", "profile", "settings", "config", "organization"];

export function normalizeCurrency(value) {
  if (!value || typeof value !== "string") return "";
  const code = value.trim().toUpperCase();
  if (!code) return "";
  return code;
}

export function isSupportedCurrency(code) {
  const norm = normalizeCurrency(code);
  return norm ? SUPPORTED_CURRENCIES.has(norm) : false;
}

export function resolveCurrencyForCountry(countryCode) {
  const code = normalizeCurrency(countryCode);
  if (!code) return "USD";
  return COUNTRY_TO_CURRENCY[code] || "USD";
}

function writeStorage(code) {
  memoryCurrency = code;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, code);
    }
  } catch {
    // ignore storage failures (private browsing, SSR, etc.)
  }
}

export function setActiveCurrency(code) {
  const norm = normalizeCurrency(code);
  if (!norm) return;
  if (!isSupportedCurrency(norm)) return;
  if (norm === memoryCurrency) return;
  writeStorage(norm);
}

export function getActiveCurrency(fallback = "USD") {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      const norm = normalizeCurrency(raw);
      if (isSupportedCurrency(norm)) {
        memoryCurrency = norm;
        return norm;
      }
    }
  } catch {
    // ignore
  }
  const normMem = normalizeCurrency(memoryCurrency);
  if (isSupportedCurrency(normMem)) return normMem;
  const normFallback = normalizeCurrency(fallback) || "USD";
  if (isSupportedCurrency(normFallback)) {
    writeStorage(normFallback);
    return normFallback;
  }
  writeStorage("USD");
  return "USD";
}

function pickCurrencyFromObject(obj) {
  if (!obj || typeof obj !== "object") return "";

  for (const key of CURRENCY_KEYS) {
    if (key in obj) {
      const norm = normalizeCurrency(obj[key]);
      if (isSupportedCurrency(norm)) return norm;
    }
  }

  // Look for company-level hints
  for (const key of COMPANY_KEYS) {
    if (obj[key] && typeof obj[key] === "object") {
      const nested = pickCurrencyFromObject(obj[key]);
      if (nested) return nested;
    }
  }

  // fallback: derive from country_code
  const country = normalizeCurrency(obj.country_code || obj.tax_country_code);
  if (country) {
    const derived = resolveCurrencyForCountry(country);
    if (derived) return derived;
  }

  return "";
}

function extractCurrency(data) {
  if (!data) return "";
  if (typeof data === "string") return normalizeCurrency(data);
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = extractCurrency(item);
      if (found) return found;
    }
    return "";
  }
  if (typeof data === "object") {
    const direct = pickCurrencyFromObject(data);
    if (direct) return direct;
    // scan nested values
    for (const key of Object.keys(data)) {
      const child = extractCurrency(data[key]);
      if (child) return child;
    }
  }
  return "";
}

export function captureCurrencyFromResponse(data) {
  const candidate = extractCurrency(data);
  if (candidate && isSupportedCurrency(candidate)) {
    setActiveCurrency(candidate);
  }
}

const currencyDisplayNames = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" });
  } catch (err) {
    return null;
  }
})();

export function getCurrencyOptions() {
  return Array.from(SUPPORTED_CURRENCIES)
    .sort()
    .map((code) => {
      let label = code;
      if (currencyDisplayNames) {
        try {
          label = currencyDisplayNames.of(code) || code;
        } catch {
          label = code;
        }
      }
      return { code, label: `${code} - ${label}` };
    });
}

export function resolveActiveCurrencyFromCompany(companyLike) {
  if (!companyLike) return getActiveCurrency();
  const direct = pickCurrencyFromObject(companyLike);
  if (direct && isSupportedCurrency(direct)) {
    setActiveCurrency(direct);
    return direct;
  }
  const derived = resolveCurrencyForCountry(
    companyLike.country_code || companyLike.tax_country_code || ""
  );
  setActiveCurrency(derived);
  return derived;
}
