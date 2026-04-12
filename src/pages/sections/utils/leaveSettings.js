export const LEAVE_TYPE_OPTIONS = ["sick", "vacation", "personal", "emergency", "family", "compassionate"];

export const LEAVE_TYPE_LABELS = {
  sick: "Sick",
  vacation: "Vacation",
  personal: "Personal",
  emergency: "Emergency",
  family: "Family / Parental",
  compassionate: "Compassionate",
};

export const formatLeaveTypeLabel = (value) =>
  LEAVE_TYPE_LABELS[value] || String(value || "").replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase());

export const defaultLeaveSettings = () => ({
  allow_hourly_leave: true,
  allow_partial_day_leave: true,
  allow_multi_day_leave: true,
  allow_shift_linked_leave: true,
  allow_employee_paid_unpaid_selection: true,
  default_day_count_strategy: "business_days_only",
  count_weekends: false,
  count_non_working_days: false,
  pending_leave_smart_shift_mode: "warn",
  approved_leave_smart_shift_mode: "block",
  attachment_required_leave_types_json: [],
  require_manager_confirmed_hours_for_payroll_ready: true,
  automatic_accruals_enabled: false,
  automatic_accrual_frequency: "monthly",
  automatic_accrual_last_run_at: null,
  automatic_accrual_next_run_at: null,
  updated_by: null,
  updated_by_name: "",
  updated_at: null,
});

export const normalizeLeaveSettings = (value = {}) => {
  const source = value?.settings || value || {};
  const defaults = defaultLeaveSettings();
  return {
    ...defaults,
    ...source,
    allow_hourly_leave: source.allow_hourly_leave ?? defaults.allow_hourly_leave,
    allow_partial_day_leave: source.allow_partial_day_leave ?? defaults.allow_partial_day_leave,
    allow_multi_day_leave: source.allow_multi_day_leave ?? defaults.allow_multi_day_leave,
    allow_shift_linked_leave: source.allow_shift_linked_leave ?? defaults.allow_shift_linked_leave,
    allow_employee_paid_unpaid_selection: source.allow_employee_paid_unpaid_selection ?? defaults.allow_employee_paid_unpaid_selection,
    count_weekends: source.count_weekends ?? defaults.count_weekends,
    count_non_working_days: source.count_non_working_days ?? defaults.count_non_working_days,
    require_manager_confirmed_hours_for_payroll_ready:
      source.require_manager_confirmed_hours_for_payroll_ready ?? defaults.require_manager_confirmed_hours_for_payroll_ready,
    automatic_accruals_enabled: source.automatic_accruals_enabled ?? defaults.automatic_accruals_enabled,
    automatic_accrual_frequency: source.automatic_accrual_frequency || defaults.automatic_accrual_frequency,
    attachment_required_leave_types_json: Array.isArray(source.attachment_required_leave_types_json)
      ? Array.from(new Set(source.attachment_required_leave_types_json.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)))
      : [],
  };
};

export const buildLeaveSettingsPatch = (current = {}, original = {}) => {
  const keys = Object.keys(defaultLeaveSettings()).filter((key) =>
    !["updated_by", "updated_by_name", "updated_at", "automatic_accrual_last_run_at", "automatic_accrual_next_run_at"].includes(key)
  );
  return keys.reduce((patch, key) => {
    const currentValue = current[key];
    const originalValue = original[key];
    if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
      patch[key] = currentValue;
    }
    return patch;
  }, {});
};

export const hasLeaveSettingsChanges = (current = {}, original = {}) =>
  Object.keys(buildLeaveSettingsPatch(current, original)).length > 0;

export const ACCRUAL_UNIT_OPTIONS = ["hours"];
export const ACCRUAL_FREQUENCY_OPTIONS = ["none", "weekly", "biweekly", "semimonthly", "monthly", "annually"];
export const INSUFFICIENT_BALANCE_MODE_OPTIONS = ["warn", "block", "split_to_unpaid", "allow_negative"];

export const formatAccrualFrequencyLabel = (value) => {
  const labels = {
    none: "None",
    weekly: "Weekly",
    biweekly: "Biweekly",
    semimonthly: "Semimonthly",
    monthly: "Monthly",
    annually: "Annually",
  };
  return labels[value] || formatLeaveTypeLabel(value);
};

export const defaultLeaveBalancePolicy = (leaveType) => ({
  leave_type: leaveType,
  balance_managed: false,
  insufficient_balance_mode: "warn",
  deduct_on: "approval",
  accrual_enabled: false,
  accrual_unit: "hours",
  accrual_rate: 0,
  accrual_frequency: "none",
  max_balance_hours: "",
  allow_negative_balance: false,
  updated_by: null,
  updated_by_name: "",
  updated_at: null,
  advisory_only: true,
  active_for_accruals: false,
});

export const normalizeLeaveBalancePolicies = (value = {}) => {
  const policies = Array.isArray(value?.policies) ? value.policies : [];
  const byType = policies.reduce((acc, policy) => {
    const leaveType = String(policy?.leave_type || "").trim().toLowerCase();
    if (!LEAVE_TYPE_OPTIONS.includes(leaveType)) return acc;
    acc[leaveType] = {
      ...defaultLeaveBalancePolicy(leaveType),
      ...policy,
      leave_type: leaveType,
      balance_managed: Boolean(policy.balance_managed),
      insufficient_balance_mode: policy.insufficient_balance_mode || "warn",
      deduct_on: policy.deduct_on || "approval",
      accrual_enabled: Boolean(policy.accrual_enabled),
      accrual_unit: policy.accrual_unit || "hours",
      accrual_rate: policy.accrual_rate ?? 0,
      accrual_frequency: policy.accrual_frequency || "none",
      max_balance_hours: policy.max_balance_hours ?? "",
      allow_negative_balance: Boolean(policy.allow_negative_balance),
      advisory_only: policy.advisory_only ?? true,
      active_for_accruals: Boolean(policy.active_for_accruals),
    };
    return acc;
  }, {});

  return {
    company_id: value?.company_id ?? null,
    advisory_only: value?.advisory_only ?? true,
    active_for_accruals: Boolean(value?.active_for_accruals),
    policies: LEAVE_TYPE_OPTIONS.map((leaveType) => byType[leaveType] || defaultLeaveBalancePolicy(leaveType)),
  };
};

const editablePolicyKeys = [
  "balance_managed",
  "insufficient_balance_mode",
  "deduct_on",
  "accrual_enabled",
  "accrual_unit",
  "accrual_rate",
  "accrual_frequency",
  "max_balance_hours",
  "allow_negative_balance",
];

const normalizePolicyPatchValue = (key, value) => {
  if (key === "max_balance_hours") {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  }
  if (key === "accrual_rate") {
    if (value === "" || value === null || value === undefined) return 0;
    return Number(value);
  }
  return value;
};

export const buildLeaveBalancePolicyPatch = (current = {}, original = {}) => {
  const currentPolicies = Array.isArray(current.policies) ? current.policies : [];
  const originalPolicies = Array.isArray(original.policies) ? original.policies : [];
  const originalByType = originalPolicies.reduce((acc, policy) => {
    acc[policy.leave_type] = policy;
    return acc;
  }, {});

  const policies = currentPolicies.reduce((updates, policy) => {
    const originalPolicy = originalByType[policy.leave_type] || defaultLeaveBalancePolicy(policy.leave_type);
    const patch = { leave_type: policy.leave_type };
    editablePolicyKeys.forEach((key) => {
      const currentValue = normalizePolicyPatchValue(key, policy[key]);
      const originalValue = normalizePolicyPatchValue(key, originalPolicy[key]);
      if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
        patch[key] = currentValue;
      }
    });
    if (Object.keys(patch).length > 1) updates.push(patch);
    return updates;
  }, []);

  return policies.length ? { policies } : {};
};

export const hasLeaveBalancePolicyChanges = (current = {}, original = {}) =>
  Object.keys(buildLeaveBalancePolicyPatch(current, original)).length > 0;

export const ALLOWANCE_UNIT_OPTIONS = ["hours", "days"];
export const ENTITLEMENT_GRANT_METHOD_OPTIONS = ["opening_balance", "annual_front_load", "monthly_accrual", "biweekly_accrual"];
export const POLICY_YEAR_BASIS_OPTIONS = ["calendar_year", "company_policy_year", "anniversary_year"];
export const START_BASIS_OPTIONS = ["hire_date", "custom_effective_date"];
export const PRORATION_METHOD_OPTIONS = ["prorate_first_period", "start_next_cycle", "full_period", "cutoff_day"];

export const formatGrantMethodLabel = (value) => ({
  opening_balance: "Opening balance setup",
  annual_front_load: "Annual front-load",
  monthly_accrual: "Monthly accrual",
  biweekly_accrual: "Biweekly accrual",
}[value] || formatLeaveTypeLabel(value));

export const formatPolicyYearBasisLabel = (value) => ({
  calendar_year: "Calendar year",
  company_policy_year: "Company policy year",
  anniversary_year: "Employee anniversary year",
}[value] || formatLeaveTypeLabel(value));

export const formatStartBasisLabel = (value) => ({
  hire_date: "Employee hire date",
  custom_effective_date: "Custom effective date",
}[value] || formatLeaveTypeLabel(value));

export const formatProrationMethodLabel = (value) => ({
  prorate_first_period: "Prorate first period",
  start_next_cycle: "Start next cycle",
  full_period: "Full period",
  cutoff_day: "Cutoff day",
}[value] || formatLeaveTypeLabel(value));

export const defaultLeaveEntitlementPolicy = (leaveType) => ({
  leave_type: leaveType,
  enabled: false,
  paid_entitlement_enabled: false,
  allowance_amount: 0,
  allowance_unit: "hours",
  workday_hours: 8,
  allowance_hours: 0,
  grant_method: "opening_balance",
  policy_year_basis: "calendar_year",
  policy_year_start_month: 1,
  policy_year_start_day: 1,
  start_basis: "hire_date",
  custom_effective_date: "",
  proration_method: "prorate_first_period",
  proration_cutoff_day: "",
  waiting_period_days: 0,
  applies_to_new_hires: false,
  carryover_enabled: false,
  carryover_limit_hours: "",
  payroll_truth: false,
});

export const normalizeLeaveEntitlementPolicies = (value = {}) => {
  const policies = Array.isArray(value?.policies) ? value.policies : [];
  const byType = policies.reduce((acc, policy) => {
    const leaveType = String(policy?.leave_type || "").trim().toLowerCase();
    if (!LEAVE_TYPE_OPTIONS.includes(leaveType)) return acc;
    acc[leaveType] = {
      ...defaultLeaveEntitlementPolicy(leaveType),
      ...policy,
      leave_type: leaveType,
      enabled: Boolean(policy.enabled),
      paid_entitlement_enabled: Boolean(policy.paid_entitlement_enabled),
      allowance_amount: policy.allowance_amount ?? 0,
      allowance_unit: policy.allowance_unit || "hours",
      workday_hours: policy.workday_hours ?? 8,
      allowance_hours: policy.allowance_hours ?? 0,
      grant_method: policy.grant_method || "opening_balance",
      policy_year_basis: policy.policy_year_basis || "calendar_year",
      policy_year_start_month: policy.policy_year_start_month ?? 1,
      policy_year_start_day: policy.policy_year_start_day ?? 1,
      start_basis: policy.start_basis || "hire_date",
      custom_effective_date: policy.custom_effective_date || "",
      proration_method: policy.proration_method || "prorate_first_period",
      proration_cutoff_day: policy.proration_cutoff_day ?? "",
      waiting_period_days: policy.waiting_period_days ?? 0,
      applies_to_new_hires: Boolean(policy.applies_to_new_hires),
      carryover_enabled: Boolean(policy.carryover_enabled),
      carryover_limit_hours: policy.carryover_limit_hours ?? "",
    };
    return acc;
  }, {});

  return {
    company_id: value?.company_id ?? null,
    payroll_truth: Boolean(value?.payroll_truth),
    policies: LEAVE_TYPE_OPTIONS.map((leaveType) => byType[leaveType] || defaultLeaveEntitlementPolicy(leaveType)),
  };
};

const editableEntitlementKeys = [
  "enabled",
  "paid_entitlement_enabled",
  "allowance_amount",
  "allowance_unit",
  "workday_hours",
  "grant_method",
  "policy_year_basis",
  "policy_year_start_month",
  "policy_year_start_day",
  "start_basis",
  "custom_effective_date",
  "proration_method",
  "proration_cutoff_day",
  "waiting_period_days",
  "applies_to_new_hires",
  "carryover_enabled",
  "carryover_limit_hours",
];

const normalizeEntitlementPatchValue = (key, value) => {
  if (["allowance_amount", "workday_hours", "carryover_limit_hours"].includes(key)) {
    if (value === "" || value === null || value === undefined) return key === "carryover_limit_hours" ? null : 0;
    return Number(value);
  }
  if (["policy_year_start_month", "policy_year_start_day", "proration_cutoff_day", "waiting_period_days"].includes(key)) {
    if (value === "" || value === null || value === undefined) return key === "proration_cutoff_day" ? null : 0;
    return Number(value);
  }
  if (key === "custom_effective_date") return value || null;
  return value;
};

export const buildLeaveEntitlementPolicyPatch = (current = {}, original = {}) => {
  const currentPolicies = Array.isArray(current.policies) ? current.policies : [];
  const originalPolicies = Array.isArray(original.policies) ? original.policies : [];
  const originalByType = originalPolicies.reduce((acc, policy) => {
    acc[policy.leave_type] = policy;
    return acc;
  }, {});

  const policies = currentPolicies.reduce((updates, policy) => {
    const originalPolicy = originalByType[policy.leave_type] || defaultLeaveEntitlementPolicy(policy.leave_type);
    const patch = { leave_type: policy.leave_type };
    editableEntitlementKeys.forEach((key) => {
      const currentValue = normalizeEntitlementPatchValue(key, policy[key]);
      const originalValue = normalizeEntitlementPatchValue(key, originalPolicy[key]);
      if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) patch[key] = currentValue;
    });
    if (Object.keys(patch).length > 1) updates.push(patch);
    return updates;
  }, []);

  return policies.length ? { policies } : {};
};

export const hasLeaveEntitlementPolicyChanges = (current = {}, original = {}) =>
  Object.keys(buildLeaveEntitlementPolicyPatch(current, original)).length > 0;
