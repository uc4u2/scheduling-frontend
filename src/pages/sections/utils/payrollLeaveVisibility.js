export const getPayrollLeaveVisibility = (payroll = {}) => {
  const preview = payroll?.payroll_leave_preview || {};
  const visibility = payroll?.payroll_leave_visibility || preview?.visibility || {};
  const summary = visibility?.summary || preview?.summary || {};
  const blockers = Array.isArray(payroll?.payroll_leave_blockers)
    ? payroll.payroll_leave_blockers
    : Array.isArray(preview?.finalization_blockers)
      ? preview.finalization_blockers
      : Array.isArray(visibility?.finalization_blockers)
        ? visibility.finalization_blockers
        : [];
  const rows = Array.isArray(preview?.rows) ? preview.rows : [];
  const warnings = Array.isArray(payroll?.payroll_leave_warnings)
    ? payroll.payroll_leave_warnings
    : Array.isArray(preview?.warnings)
      ? preview.warnings
      : [];

  const numberValue = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const payrollReadyLeaveCount = numberValue(summary.payroll_ready_leave_count);
  const previewOnlyLeaveCount = numberValue(summary.preview_only_leave_count);
  const paidLeaveReadyHours = numberValue(
    summary.paid_leave_ready_hours ?? summary.payroll_ready_paid_leave_hours
  );
  const unpaidLeaveReadyHours = numberValue(
    summary.unpaid_leave_ready_hours ?? summary.payroll_ready_unpaid_leave_hours
  );
  const previewPaidLeaveHours = numberValue(summary.preview_paid_leave_hours);
  const previewUnpaidLeaveHours = numberValue(summary.preview_unpaid_leave_hours);
  const finalizationBlocked = Boolean(summary.finalization_blocked) || blockers.length > 0;

  return {
    rows,
    warnings,
    blockers,
    summary,
    payrollReadyLeaveCount,
    previewOnlyLeaveCount,
    paidLeaveReadyHours,
    unpaidLeaveReadyHours,
    previewPaidLeaveHours,
    previewUnpaidLeaveHours,
    finalizationBlocked,
    finalizationBlockReason: finalizationBlocked
      ? "Resolve payroll leave blockers before finalizing."
      : "",
    hasLeaveData:
      rows.length > 0 ||
      blockers.length > 0 ||
      payrollReadyLeaveCount > 0 ||
      previewOnlyLeaveCount > 0 ||
      paidLeaveReadyHours > 0 ||
      unpaidLeaveReadyHours > 0 ||
      previewPaidLeaveHours > 0 ||
      previewUnpaidLeaveHours > 0,
  };
};

export const formatLeaveBlockerReason = (code) => {
  if (code === "payroll_leave_worked_time_overlap") {
    return "Leave overlaps worked time";
  }
  return String(code || "Leave blocker").replace(/_/g, " ");
};
