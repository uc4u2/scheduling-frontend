// src/utils/timezone.js
export const detectBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

const getStoredTimezone = () => {
  try {
    return localStorage.getItem("timezone") || "";
  } catch {
    return "";
  }
};

export const getUserTimezone = (explicit = "") =>
  explicit || detectBrowserTimezone() || getStoredTimezone() || "UTC";

export const formatTimezoneLabel = (tz) => {
  const value = String(tz || "").trim();
  if (!value) return "";
  const parts = value.split('/');
  const city = parts[parts.length - 1]?.replace(/_/g, ' ') || value;
  return `${city} (${value})`;
};
