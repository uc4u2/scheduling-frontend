import { isoFromParts, formatDate, formatTime } from "./datetime";

/**
 * Formats date/time strings using your existing helpers and timezone string.
 * @param {string} date - YYYY-MM-DD
 * @param {string} time - HH:mm
 * @param {string} timezone - IANA timezone string, e.g. "America/New_York"
 * @returns {{ formattedDate: string, formattedTime: string }}
 */
export function formatSlotDateTime(date, time, timezone) {
  const iso = isoFromParts(date, time, timezone);
  const d = new Date(iso);
  return {
    formattedDate: formatDate(d),
    formattedTime: formatTime(d),
  };
}
