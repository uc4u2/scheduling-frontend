import {
  bookingCalendarDateKey,
  bookingsForCalendarDate,
  calendarDateKey,
  resolveBookingCalendarTimezone,
} from "./bookingCheckout";

describe("booking checkout calendar dates", () => {
  it("uses the same browser-local day that FullCalendar renders", () => {
    const instant = new Date(2026, 9, 9, 23, 45, 0);
    expect(calendarDateKey(instant)).toBe("2026-10-09");
    expect(bookingCalendarDateKey({ start_iso_local: instant.toISOString() })).toBe(
      "2026-10-09"
    );
  });

  it("groups a Toronto midnight booking on the employee day instead of the browser day", () => {
    const booking = { start_iso_local: "2026-10-14T00:30:00-04:00" };
    expect(bookingCalendarDateKey(booking, "America/Los_Angeles")).toBe("2026-10-13");
    expect(bookingCalendarDateKey(booking, "America/Toronto")).toBe("2026-10-14");
  });

  it("uses real zone offsets across DST boundaries", () => {
    expect(
      bookingCalendarDateKey(
        { start_iso_local: "2026-03-08T06:30:00Z" },
        "America/Toronto"
      )
    ).toBe("2026-03-08");
    expect(
      bookingCalendarDateKey(
        { start_iso_local: "2026-11-01T04:30:00Z" },
        "America/Toronto"
      )
    ).toBe("2026-11-01");
  });

  it("uses the backend effective timezone and falls back safely", () => {
    expect(
      resolveBookingCalendarTimezone({
        timezone: "",
        effective_timezone: "America/Toronto",
      })
    ).toBe("America/Toronto");
    expect(resolveBookingCalendarTimezone({ timezone: "" })).toBe("UTC");
    expect(resolveBookingCalendarTimezone(null)).toBe("local");
  });

  it("keeps completed and cancelled bookings and sorts them chronologically", () => {
    const rows = [
      { id: 3, status: "cancelled", start_iso_local: "2026-10-09T15:00:00-04:00" },
      { id: 1, status: "completed", start_iso_local: "2026-10-09T09:00:00-04:00" },
      { id: 2, status: "booked", start_iso_local: "2026-10-10T10:00:00-04:00" },
    ];
    const dateKey = bookingCalendarDateKey(rows[0], "America/Toronto");
    expect(
      bookingsForCalendarDate(rows, dateKey, "America/Toronto").map((row) => row.id)
    ).toEqual([1, 3]);
  });
});
