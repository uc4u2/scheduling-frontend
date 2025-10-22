// timezone-wrapper.js
// Centralized utility to handle display of date/time consistently across all frontend components.

import { isoFromParts, formatDate, formatTime } from "./datetime";

/**
 * Get a display-friendly date and time using API fields or fallback conversion.
 *
 * @param {Object} params
 * @param {string} params.local_date  - Date already converted by backend (if available)
 * @param {string} params.local_time  - Time already converted by backend (if available)
 * @param {string} params.date        - Raw date (YYYY-MM-DD)
 * @param {string} params.time        - Raw time (HH:mm)
 * @param {string} params.timezone    - Timezone (e.g. "America/New_York")
 *
 * @returns {Object} { date: "YYYY-MM-DD", time: "HH:mm", iso: "ISO string" }
 */
export function getDisplayDateTime({ local_date, local_time, date, time, timezone }) {
  // ✅ Priority: Use backend-provided local date/time when available
  if (local_date && local_time) {
    const iso = isoFromParts(local_date, local_time, timezone || "UTC");
    return { date: local_date, time: local_time, iso };
  }

  // ✅ Fallback: Construct ISO and format locally
  const iso = isoFromParts(date, time, timezone || "UTC");
  const d = new Date(iso);

  return {
    date: formatDate(d),
    time: formatTime(d),
    iso,
  };
}

/**
 * Format a slot object (with date/time/tz/local fields) into display values.
 *
 * @param {Object} slot - Slot or appointment object from API
 * @returns {Object} { date, time, iso }
 */
export function formatSlot(slot = {}) {
  return getDisplayDateTime({
    local_date: slot.local_date,
    local_time: slot.local_time,
    date: slot.date,
    time: slot.start_time,
    timezone: slot.timezone || slot.recruiterTimezone || "UTC",
  });
}
