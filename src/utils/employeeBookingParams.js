const PRESERVED_QUERY_KEYS = [
  "embed",
  "primary",
  "text",
  "h",
  "b",
  "link",
  "hfont",
  "bfont",
  "cardbg",
];

export const buildEmployeeProfileBookingParams = ({
  searchParams,
  employeeId,
  serviceId,
  slot,
  departmentId,
}) => {
  if (!slot || !serviceId || !employeeId) return null;

  const qs = new URLSearchParams();
  PRESERVED_QUERY_KEYS.forEach((key) => {
    const val = searchParams?.get?.(key);
    if (val) {
      qs.set(key, val);
    }
  });
  qs.set("employee_id", String(employeeId));
  qs.set("service_id", String(serviceId));
  qs.set("date", slot.date);
  qs.set("start_time", slot.start_time);

  if (slot.end_time) {
    qs.set("end_time", slot.end_time);
  }
  if (slot.start_utc) {
    qs.set("start_utc", slot.start_utc);
  }
  if (slot.end_utc) {
    qs.set("end_utc", slot.end_utc);
  }
  if (slot.availability_id != null) {
    qs.set("availability_id", String(slot.availability_id));
  }
  if (slot.timezone) {
    qs.set("timezone", slot.timezone);
  }
  if (departmentId) {
    qs.set("department_id", departmentId);
  }

  return qs;
};
