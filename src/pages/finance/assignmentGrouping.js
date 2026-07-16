const toDateKey = (value) => String(value || "").trim();

const toComparableTime = (value) => String(value || "").trim();

const nextDateString = (dateString) => {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sortAssignments = (assignments = []) =>
  [...assignments].sort((a, b) => {
    const recruiterCompare = String(a?.recruiter_name || a?.recruiter_email || a?.recruiter_id || "").localeCompare(
      String(b?.recruiter_name || b?.recruiter_email || b?.recruiter_id || "")
    );
    if (recruiterCompare !== 0) return recruiterCompare;
    const dateCompare = toDateKey(a?.work_date).localeCompare(toDateKey(b?.work_date));
    if (dateCompare !== 0) return dateCompare;
    return toComparableTime(a?.start_time).localeCompare(toComparableTime(b?.start_time));
  });

const canMergeIntoGroup = (group, row) => {
  const last = group.rows[group.rows.length - 1];
  return (
    String(group.recruiter_id || "") === String(row?.recruiter_id || "") &&
    toComparableTime(last?.start_time) === toComparableTime(row?.start_time) &&
    toComparableTime(last?.end_time) === toComparableTime(row?.end_time) &&
    String(last?.planned_hours ?? "") === String(row?.planned_hours ?? "") &&
    String(last?.planned_labor_cost ?? "") === String(row?.planned_labor_cost ?? "") &&
    String(last?.timezone || "") === String(row?.timezone || "") &&
    String(last?.notes || "") === String(row?.notes || "") &&
    nextDateString(last?.work_date) === toDateKey(row?.work_date)
  );
};

export const groupAssignmentRows = (assignments = []) => {
  const sorted = sortAssignments(assignments);
  const groups = [];
  sorted.forEach((row) => {
    const current = {
      recruiter_id: row?.recruiter_id,
      recruiter_name: row?.recruiter_name,
      recruiter_email: row?.recruiter_email,
      rows: [row],
    };
    const previous = groups[groups.length - 1];
    if (previous && canMergeIntoGroup(previous, row)) {
      previous.rows.push(row);
    } else {
      groups.push(current);
    }
  });
  return groups.map((group) => {
    const first = group.rows[0] || {};
    const last = group.rows[group.rows.length - 1] || first;
    return {
      ...group,
      start_date: first.work_date || "",
      end_date: last.work_date || first.work_date || "",
      start_time: first.start_time || "",
      end_time: first.end_time || "",
      planned_hours: first.planned_hours ?? "",
      planned_labor_cost: first.planned_labor_cost ?? "",
      timezone: first.timezone || "",
      notes: first.notes || "",
      count: group.rows.length,
    };
  });
};

export const formatAssignmentDateRange = (group) => {
  if (!group) return "No date";
  if (!group.start_date) return "No date";
  if (group.start_date === group.end_date) return group.start_date;
  return `${group.start_date} to ${group.end_date}`;
};

export const formatAssignmentScheduleLabel = (group, fallbackTimezone = "") => {
  if (!group) return "No assignment details";
  const parts = [formatAssignmentDateRange(group)];
  if (group.start_time) {
    parts.push(group.end_time ? `${group.start_time} to ${group.end_time}` : group.start_time);
  } else if (group.planned_hours) {
    parts.push(`${group.planned_hours} h`);
  }
  const tz = group.timezone || fallbackTimezone;
  if (tz) parts.push(tz);
  if (group.count > 1) {
    parts.push(`${group.count} days`);
  }
  return parts.filter(Boolean).join(" • ");
};

