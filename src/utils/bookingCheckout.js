export const calendarDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const bookingStartValue = (booking) =>
  booking?.start_iso_local ||
  (booking?.local_date && booking?.local_start_time
    ? `${booking.local_date}T${booking.local_start_time}`
    : "");

export const bookingCalendarDateKey = (booking) => {
  const start = bookingStartValue(booking);
  if (!start) return "";
  return calendarDateKey(start);
};

export const bookingsForCalendarDate = (bookings, dateKey) =>
  (Array.isArray(bookings) ? bookings : [])
    .filter((booking) => bookingCalendarDateKey(booking) === dateKey)
    .sort((left, right) => {
      const leftTime = new Date(bookingStartValue(left)).getTime();
      const rightTime = new Date(bookingStartValue(right)).getTime();
      if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
        return leftTime - rightTime;
      }
      return bookingStartValue(left).localeCompare(bookingStartValue(right));
    });

export const formatBookingCalendarTime = (booking, locale) => {
  const start = bookingStartValue(booking);
  const end =
    booking?.end_iso_local ||
    (booking?.local_date && booking?.local_end_time
      ? `${booking.local_date}T${booking.local_end_time}`
      : "");
  const formatTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  return [startLabel, endLabel].filter(Boolean).join(" – ") || "Time unavailable";
};

export const formatCalendarDateLabel = (dateKey, locale) => {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};
