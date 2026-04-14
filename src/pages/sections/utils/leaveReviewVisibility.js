const numberValue = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

export const normalizeLeaveWarnings = (record = {}) => {
  const candidates = [
    record.leave_preview_warnings,
    record.overlap_warnings,
    record.warnings,
    record.payroll_leave_warnings,
  ];
  return candidates.flatMap((value) => (Array.isArray(value) ? value : []));
};

export const formatLeaveWarningReason = (code) => {
  if (code === "approved_leave_overlaps_worked_time" || code === "payroll_leave_worked_time_overlap") {
    return "Leave overlaps worked time";
  }
  if (code === "non_payroll_ready_leave") return "Not ready for payroll";
  if (code === "estimated_leave_hours") return "Estimated hours";
  if (code === "leave_not_approved") return "Not approved";
  if (code === "unpaid_leave_visibility") return "Unpaid leave visibility";
  return String(code || "Leave warning").replace(/_/g, " ");
};

export const getLeaveReviewVisibility = (record = {}) => {
  const warnings = normalizeLeaveWarnings(record);
  const warningCodes = warnings.map((warning) => warning?.code || warning?.reason_code).filter(Boolean);
  const status = String(record.status || record.leave_status || "").toLowerCase();
  const isPaid = Boolean(firstDefined(record.is_paid_leave, record.paid_flag));
  const payrollReady = Boolean(firstDefined(
    record.payroll_ready,
    record.leave_payroll_ready,
    record.leave_approved_for_payroll
  ));
  const estimated = Boolean(firstDefined(record.estimated, record.leave_hours_estimated));
  const requestedHours = numberValue(firstDefined(record.requested_hours, record.override_hours));
  const approvedHours = numberValue(record.approved_hours);
  const computedHours = numberValue(firstDefined(
    record.computed_hours,
    record.paid_leave_hours,
    record.unpaid_leave_hours,
    record.hours_worked_rounded,
    record.hours_worked,
    approvedHours || requestedHours
  ));
  const hasWorkedOverlap = warningCodes.includes("approved_leave_overlaps_worked_time") || warningCodes.includes("payroll_leave_worked_time_overlap");
  const actionNeeded = status === "pending" || estimated || hasWorkedOverlap || (status === "approved" && !payrollReady);

  return {
    status,
    isPaid,
    payLabel: isPaid ? "Paid leave" : "Unpaid leave",
    payShortLabel: isPaid ? "Paid PTO" : "Unpaid TO",
    payrollReady,
    estimated,
    requestedHours,
    approvedHours,
    computedHours,
    hoursSource: record.hours_source || record.leave_hours_source || "",
    warnings,
    warningCodes,
    hasWorkedOverlap,
    actionNeeded,
    payrollLabel: payrollReady ? "Ready for payroll" : "Estimated for review",
    payrollColor: payrollReady ? "success" : "warning",
  };
};
