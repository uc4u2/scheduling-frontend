import {
  bookingCalendarDateKey,
  bookingsForCalendarDate,
  calendarDateKey,
} from "./bookingCheckout";

describe("booking checkout calendar dates", () => {
  it("uses the same browser-local day that FullCalendar renders", () => {
    const instant = new Date(2026, 9, 9, 23, 45, 0);
    expect(calendarDateKey(instant)).toBe("2026-10-09");
    expect(bookingCalendarDateKey({ start_iso_local: instant.toISOString() })).toBe(
      "2026-10-09"
    );
  });

  it("groups near-midnight offset timestamps by their rendered day", () => {
    const booking = { start_iso_local: "2026-11-01T00:30:00-04:00" };
    expect(bookingCalendarDateKey(booking)).toBe(
      calendarDateKey(new Date("2026-11-01T00:30:00-04:00"))
    );
  });

  it("keeps completed and cancelled bookings and sorts them chronologically", () => {
    const rows = [
      { id: 3, status: "cancelled", start_iso_local: "2026-10-09T15:00:00-04:00" },
      { id: 1, status: "completed", start_iso_local: "2026-10-09T09:00:00-04:00" },
      { id: 2, status: "booked", start_iso_local: "2026-10-10T10:00:00-04:00" },
    ];
    const dateKey = bookingCalendarDateKey(rows[0]);
    expect(bookingsForCalendarDate(rows, dateKey).map((row) => row.id)).toEqual([1, 3]);
  });
});
