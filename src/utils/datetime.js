// ──────────────────────────────────────────────────────────────
//  src/utils/datetime.js
//  Common date / time helpers (no React code here)
// ──────────────────────────────────────────────────────────────
import { DateTime } from "luxon";

/**
 * Build a full ISO‑8601 string (with offset) from
 *   • YYYY‑MM‑DD      date
 *   • HH:MM           time
 *   • IANA zone name  tz  (e.g. "America/Toronto")
 *
 * Example:
 *   isoFromParts("2025-07-16", "09:30", "Europe/Paris")
 *   → "2025-07-16T09:30:00.000+02:00"
 */
export const isoFromParts = (date, time, tz) =>
  DateTime.fromISO(`${date}T${time}`, { zone: tz }).toISO();

/**
 * Simple left‑pad utility for double‑digit parts.
 */
export const pad = (n) => String(n).padStart(2, "0");

/**
 * Format a native Date → "YYYY-MM-DD"  (local zone)
 */
export const formatDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Format a native Date → "HH:MM"  (local zone)
 */
export const formatTime = (d) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}`;
