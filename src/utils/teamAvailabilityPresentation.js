export const recruiterDisplayName = (recruiter) => {
  if (!recruiter) return "";
  const fullName = [recruiter.first_name, recruiter.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return recruiter.name || recruiter.full_name || fullName || recruiter.email || "";
};

export const buildRecruiterNameMap = (recruiters = []) => {
  const names = new Map();
  recruiters.forEach((recruiter) => {
    const name = recruiterDisplayName(recruiter);
    if (name && recruiter?.id != null) names.set(String(recruiter.id), name);
  });
  return names;
};

export const resolveSlotEmployeeName = (slot, recruiterNames) => {
  const embeddedRecruiter = recruiterDisplayName(slot?.bookingMeta?.recruiter);
  return (
    slot?.recruiter_label ||
    slot?.recruiter_name ||
    recruiterDisplayName(slot?.recruiter) ||
    embeddedRecruiter ||
    recruiterNames?.get(String(slot?.recruiter_id ?? "")) ||
    "Employee"
  );
};

export const groupSlotsByEmployee = (slots = [], recruiterNames = new Map()) => {
  const groups = new Map();
  slots.forEach((slot) => {
    const key = String(slot?.recruiter_id ?? "unassigned");
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        employeeName: resolveSlotEmployeeName(slot, recruiterNames),
        slots: [],
      });
    }
    groups.get(key).slots.push(slot);
  });
  return Array.from(groups.values());
};

export const resolveTeamAvailabilityTimezone = (recruiter, fallbackTimezone = "UTC") =>
  recruiter?.effective_timezone || recruiter?.timezone || fallbackTimezone || "UTC";
