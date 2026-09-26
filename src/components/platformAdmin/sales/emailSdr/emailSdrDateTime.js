import { formatDateTimeInTz } from "../../../../utils/datetime";
import { getUserTimezone } from "../../../../utils/timezone";

export function getEmailSdrViewerTimezone() {
  return getUserTimezone();
}

export function formatEmailSdrDateTime(value, timezone = getEmailSdrViewerTimezone()) {
  if (!value) return "Not set";

  const resolvedTimezone = timezone || "UTC";
  const formatted = formatDateTimeInTz(value, resolvedTimezone);
  if (!formatted || formatted === "Invalid Date") return String(value);

  return `${formatted} (${resolvedTimezone})`;
}
