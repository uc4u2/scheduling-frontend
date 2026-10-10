import { DateTime } from "luxon";

const normalizeCalendarZone = (timeZone) => timeZone || "local";

const parseCalendarDateTime = (value, timeZone = "local") => {
  const zone = normalizeCalendarZone(timeZone);
  if (DateTime.isDateTime(value)) return value.setZone(zone);
  if (value instanceof Date) return DateTime.fromJSDate(value, { zone });
  if (typeof value !== "string" || !value.trim()) return DateTime.invalid("missing date");

  const source = value.trim();
  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(source);
  const parsed = DateTime.fromISO(source, hasOffset ? { setZone: true } : { zone });
  return hasOffset ? parsed.setZone(zone) : parsed;
};

export const calendarDateKey = (value = new Date(), timeZone = "local") => {
  const date = parseCalendarDateTime(value, timeZone);
  return date.isValid ? date.toFormat("yyyy-MM-dd") : "";
};

const bookingStartValue = (booking) =>
  booking?.start_iso_local ||
  (booking?.local_date && booking?.local_start_time
    ? `${booking.local_date}T${booking.local_start_time}`
    : "");

export const bookingCalendarDateKey = (booking, timeZone = "local") => {
  const start = bookingStartValue(booking);
  if (!start) return "";
  return calendarDateKey(start, timeZone);
};

export const bookingsForCalendarDate = (bookings, dateKey, timeZone = "local") =>
  (Array.isArray(bookings) ? bookings : [])
    .filter((booking) => bookingCalendarDateKey(booking, timeZone) === dateKey)
    .sort((left, right) => {
      const leftTime = parseCalendarDateTime(bookingStartValue(left), timeZone).toMillis();
      const rightTime = parseCalendarDateTime(bookingStartValue(right), timeZone).toMillis();
      if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
        return leftTime - rightTime;
      }
      return bookingStartValue(left).localeCompare(bookingStartValue(right));
    });

export const formatBookingCalendarTime = (booking, locale, timeZone = "local") => {
  const start = bookingStartValue(booking);
  const end =
    booking?.end_iso_local ||
    (booking?.local_date && booking?.local_end_time
      ? `${booking.local_date}T${booking.local_end_time}`
      : "");
  const formatTime = (value) => {
    const date = parseCalendarDateTime(value, timeZone);
    if (!date.isValid) return "";
    return date.setLocale(locale || undefined).toLocaleString(DateTime.TIME_SIMPLE);
  };
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  return [startLabel, endLabel].filter(Boolean).join(" – ") || "Time unavailable";
};

export const formatCalendarDateLabel = (dateKey, locale, timeZone = "local") => {
  const date = DateTime.fromISO(dateKey, { zone: normalizeCalendarZone(timeZone) });
  if (!date.isValid) return dateKey;
  return date.setLocale(locale || undefined).toLocaleString({
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const resolveBookingCalendarTimezone = (recruiter) => {
  if (!recruiter) return "local";
  return recruiter.effective_timezone || recruiter.timezone || "UTC";
};
