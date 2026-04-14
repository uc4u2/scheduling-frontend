export const isAvailabilityBlockedByLeave = (row = {}) =>
  Boolean(row.blocked_by_leave || row.leave_conflict);

export const filterAvailabilityRows = (rows = [], filter = "all") => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (filter === "blocked") {
    return safeRows.filter(isAvailabilityBlockedByLeave);
  }
  if (filter === "available") {
    return safeRows.filter((row) => !isAvailabilityBlockedByLeave(row));
  }
  return safeRows;
};

export const formatAvailabilityLeaveTooltip = (row = {}) =>
  [
    row.leave_message,
    row.leave_id ? `Leave #${row.leave_id}` : null,
    row.leave_overlap_minutes ? `${Number(row.leave_overlap_minutes).toFixed(0)} min overlap` : null,
  ].filter(Boolean).join(" · ");
