export const CLIENT_BOOKING_BLOCKED_PUBLIC_MESSAGE =
  "Online booking is not available right now. Please contact the business.";

export const CLIENT_BOOKING_BLOCKED_MANAGER_MESSAGE =
  "This Client is blocked from new bookings.";

export function getBookingBlockedDisplayMessage(error, audience = "public") {
  const errorCode = error?.response?.data?.error_code;
  if (errorCode === "CLIENT_BOOKING_BLOCKED") {
    return audience === "manager"
      ? CLIENT_BOOKING_BLOCKED_MANAGER_MESSAGE
      : CLIENT_BOOKING_BLOCKED_PUBLIC_MESSAGE;
  }
  return (
    error?.response?.data?.error ||
    error?.displayMessage ||
    error?.message ||
    "Booking failed"
  );
}
