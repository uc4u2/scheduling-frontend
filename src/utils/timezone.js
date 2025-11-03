// src/utils/timezone.js
export const getUserTimezone = (explicit = "") =>
  explicit ||
  localStorage.getItem("timezone") ||
  Intl.DateTimeFormat().resolvedOptions().timeZone ||
  "UTC";
