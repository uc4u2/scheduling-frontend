// src/utils/timezone.js
export const detectBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

export const normalizeTimezoneValue = (tz) => {
  const raw = String(tz || "").trim();
  if (!raw) return "";

  // Recover the canonical IANA value from labels like "Toronto (America/Toronto)".
  const parenMatch = raw.match(/\(([^()]+\/[^()]+)\)\s*$/);
  if (parenMatch?.[1]) return parenMatch[1].trim();

  return raw;
};

const getStoredTimezone = () => {
  try {
    return normalizeTimezoneValue(localStorage.getItem("timezone") || "");
  } catch {
    return "";
  }
};

export const getUserTimezone = (explicit = "") =>
  normalizeTimezoneValue(explicit) || normalizeTimezoneValue(detectBrowserTimezone()) || getStoredTimezone() || "UTC";

export const formatTimezoneLabel = (tz) => {
  const value = normalizeTimezoneValue(tz);
  if (!value) return "";
  const parts = value.split('/');
  const city = parts[parts.length - 1]?.replace(/_/g, ' ') || value;
  return `${city} (${value})`;
};
