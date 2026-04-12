import { LEAVE_TYPE_OPTIONS, formatLeaveTypeLabel } from "./leaveSettings";

export const BALANCE_LEAVE_TYPES = LEAVE_TYPE_OPTIONS.filter((type) => type !== "unpaid");

export const formatBalanceHours = (value) => {
  const hours = Number(value || 0);
  if (!Number.isFinite(hours)) return "0h";
  const rounded = Math.round(hours * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}h`;
};

export const normalizeLeaveBalanceSummary = (payload = {}) => {
  const source = payload?.balances && !Array.isArray(payload?.balances) ? payload.balances : payload;
  const rawBalances = Array.isArray(source?.balances) ? source.balances : [];
  const byType = rawBalances.reduce((acc, row) => {
    const leaveType = String(row?.leave_type || "").trim().toLowerCase();
    if (!leaveType || leaveType === "unpaid") return acc;
    acc[leaveType] = {
      ...row,
      leave_type: leaveType,
      label: formatLeaveTypeLabel(leaveType),
      balance_hours: Number(row?.balance_hours || 0),
      current_balance_hours: Number(row?.current_balance_hours ?? row?.balance_hours ?? 0),
      days_equivalent: row?.days_equivalent ?? null,
      next_expected_accrual_hours: row?.next_expected_accrual_hours ?? null,
      next_expected_accrual_date: row?.next_expected_accrual_date || null,
      eligibility_date: row?.eligibility_date || null,
      eligible_now: row?.eligible_now ?? true,
      policy_summary: row?.policy_summary || null,
      future_balance: row?.future_balance || null,
    };
    return acc;
  }, {});

  return {
    company_id: source?.company_id ?? null,
    recruiter_id: source?.recruiter_id ?? null,
    payroll_truth: Boolean(source?.payroll_truth),
    source: source?.source || "manual_ledger",
    balances: BALANCE_LEAVE_TYPES.map((leaveType) => (
      byType[leaveType] || {
        leave_type: leaveType,
        label: formatLeaveTypeLabel(leaveType),
        balance_hours: 0,
        current_balance_hours: 0,
        days_equivalent: null,
        next_expected_accrual_hours: null,
        next_expected_accrual_date: null,
        eligibility_date: null,
        eligible_now: true,
        policy_summary: null,
        future_balance: null,
      }
    )),
    ledger: Array.isArray(source?.ledger)
      ? source.ledger.map((entry) => ({
          id: entry?.id,
          leave_type: String(entry?.leave_type || "").trim().toLowerCase(),
          label: formatLeaveTypeLabel(entry?.leave_type),
          delta_hours: Number(entry?.delta_hours || 0),
          reason: entry?.reason || "",
          source_type: entry?.source_type || "manual_adjustment",
          created_by: entry?.created_by ?? null,
          created_by_name: entry?.created_by_name || "",
          created_at: entry?.created_at || null,
        })).filter((entry) => entry.leave_type && entry.leave_type !== "unpaid")
      : [],
  };
};

export const defaultLeaveBalanceAdjustment = () => ({
  leave_type: "vacation",
  delta_hours: "",
  reason: "",
});

export const buildLeaveBalanceAdjustmentPayload = (draft = {}) => {
  const leaveType = String(draft.leave_type || "").trim().toLowerCase();
  const hours = Number(draft.delta_hours);
  const reason = String(draft.reason || "").trim();
  if (!BALANCE_LEAVE_TYPES.includes(leaveType)) {
    return { error: "Choose a supported leave type." };
  }
  if (!Number.isFinite(hours) || hours === 0) {
    return { error: "Enter adjustment hours. Use a positive number to add hours or a negative number to subtract hours." };
  }
  if (!reason) {
    return { error: "Adjustment reason is required." };
  }
  return {
    leave_type: leaveType,
    delta_hours: hours,
    reason,
  };
};
