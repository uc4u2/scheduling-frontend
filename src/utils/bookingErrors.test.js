import {
  CLIENT_BOOKING_BLOCKED_MANAGER_MESSAGE,
  CLIENT_BOOKING_BLOCKED_PUBLIC_MESSAGE,
  getBookingBlockedDisplayMessage,
} from "./bookingErrors";

describe("bookingErrors", () => {
  it("returns the safe public message for blocked booking errors", () => {
    const message = getBookingBlockedDisplayMessage(
      { response: { data: { error_code: "CLIENT_BOOKING_BLOCKED" } } },
      "public"
    );
    expect(message).toBe(CLIENT_BOOKING_BLOCKED_PUBLIC_MESSAGE);
  });

  it("returns the safe manager message for blocked booking errors", () => {
    const message = getBookingBlockedDisplayMessage(
      { response: { data: { error_code: "CLIENT_BOOKING_BLOCKED" } } },
      "manager"
    );
    expect(message).toBe(CLIENT_BOOKING_BLOCKED_MANAGER_MESSAGE);
  });
});
