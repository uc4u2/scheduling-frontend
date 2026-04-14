import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SectionCard from "../../components/ui/SectionCard";
import SettingsLeaveInsights from "./SettingsLeaveInsights";
import { leaveSettings } from "../../utils/api";
import api from "../../utils/api";
import {
  LEAVE_TYPE_OPTIONS,
  ACCRUAL_FREQUENCY_OPTIONS,
  ACCRUAL_UNIT_OPTIONS,
  ALLOWANCE_UNIT_OPTIONS,
  ENTITLEMENT_GRANT_METHOD_OPTIONS,
  INSUFFICIENT_BALANCE_MODE_OPTIONS,
  POLICY_YEAR_BASIS_OPTIONS,
  PRORATION_METHOD_OPTIONS,
  START_BASIS_OPTIONS,
  buildLeaveEntitlementPolicyPatch,
  buildLeaveBalancePolicyPatch,
  buildLeaveSettingsPatch,
  formatAccrualFrequencyLabel,
  formatGrantMethodLabel,
  formatLeaveTypeLabel,
  formatPolicyYearBasisLabel,
  formatProrationMethodLabel,
  formatStartBasisLabel,
  hasLeaveBalancePolicyChanges,
  hasLeaveEntitlementPolicyChanges,
  hasLeaveSettingsChanges,
  normalizeLeaveEntitlementPolicies,
  normalizeLeaveBalancePolicies,
  normalizeLeaveSettings,
} from "./utils/leaveSettings";

const dayCountOptions = [
  { value: "business_days_only", label: "Business days only", helper: "Default: weekends are not counted unless explicitly configured." },
  { value: "shift_days_only", label: "Scheduled shift days", helper: "Best when leave should follow existing scheduled shifts." },
  { value: "calendar_days", label: "Calendar days", helper: "Includes every day in the selected range when broader logic consumes it." },
  { value: "explicit_hours_only", label: "Explicit hours only", helper: "Use only manager/employee-provided hours." },
];

const smartShiftModeOptions = [
  { value: "warn", label: "Warn only" },
  { value: "block", label: "Block" },
  { value: "ignore", label: "Ignore" },
];

const insufficientBalanceLabels = {
  warn: "Warn manager",
  block: "Block approval",
  split_to_unpaid: "Approve available paid hours only",
  allow_negative: "Allow negative balance",
};

const deductOnLabels = {
  approval: "On approval",
};

const leaveAllowanceFieldHelp = {
  paidEntitlement: "Turn this on only when the company gives this leave type as paid time off. If it is off, managers can still review requests manually, but no company allowance is configured here.",
  allowanceAmount: "The company allowance for this leave type. Example: enter 5 with Unit = Days for 5 paid sick days, or 40 with Unit = Hours for 40 hours.",
  allowanceUnit: "Choose whether the allowance is entered in days or hours. The backend always tracks hours, so days are converted using Standard workday hours.",
  workdayHours: "The standard number of hours in one workday for this policy. Used only to convert day-based allowances into hours.",
  grantMethod: "How the company gives this allowance. Opening balance is for setup, annual front-load is a yearly grant, and monthly/biweekly accrual means employees earn time over time.",
  policyYearBasis: "Defines the policy period. Calendar year starts Jan 1, company policy year uses your chosen month/day, and anniversary year follows each employee's hire anniversary.",
  policyYearStartMonth: "For company policy year only. This is the month when the company's leave year starts.",
  policyYearStartDay: "For company policy year only. This is the day of the month when the company's leave year starts.",
  startBasis: "Usually employee hire date. Use a custom effective date only when this policy should start from a specific company-defined date instead.",
  customEffectiveDate: "The date this policy starts when Start basis is custom effective date.",
  waitingPeriod: "How many days after the start basis the employee must wait before this paid entitlement becomes usable.",
  prorationMethod: "How to handle employees hired mid-period or mid-year. Prorate gives a proportional amount; start next cycle gives none until the next period; full period gives the whole amount.",
  cutoffDay: "For cutoff-day handling. Hired on or before this day gets the current period; hired after this day starts next cycle.",
  appliesToNewHires: "When enabled, this policy is intended to apply to future employees by default. Existing employees still need preview/apply before ledger-backed balances are created.",
  balanceManaged: "When enabled, approved paid leave can deduct from this leave balance. Keep it off for manual or case-by-case leave types.",
  insufficientBalance: "What managers can do when a paid request is larger than the employee's available balance: warn, block, allow negative, or approve only available paid hours.",
  deductOn: "When the balance should be reduced. On approval is the safe current behavior because pending requests do not change balances.",
  accrualEnabled: "Stores the accrual policy for this leave type. It does not create ledger entries until the manager runs accrual preview/manual posting.",
  accrualUnit: "The unit for accrual policy settings. Hours are recommended because they support hourly and partial-day leave clearly.",
  accrualRate: "How much balance is earned each accrual period. Example: 8 with Monthly frequency gives 8 hours per month.",
  accrualFrequency: "How often the accrual rate is earned. Monthly is common for vacation; none means no saved accrual cadence.",
  maxBalance: "Optional cap for how high this balance can grow during accrual posting. Leave blank if the company has no cap yet.",
  allowNegative: "Future-oriented flag for negative balance policy. For today's approval behavior, use If balance is insufficient and choose Allow negative balance.",
};

const fieldHelpLabel = (label, title) => (
  <Stack component="span" direction="row" spacing={0.5} alignItems="center" sx={{ display: "inline-flex" }}>
    <span>{label}</span>
    <Tooltip title={title} arrow placement="top">
      <HelpOutlineIcon sx={{ fontSize: 15, color: "text.secondary" }} />
    </Tooltip>
  </Stack>
);

const accrualRunStatusLabels = {
  posted: "Posted",
  partial: "Partial",
  skipped: "Skipped",
  failed: "Failed",
};

const accrualRunStatusColors = {
  posted: "success",
  partial: "warning",
  skipped: "default",
  failed: "error",
};

const formatDateTime = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const formatHours = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0h";
  const rounded = Math.round(number * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}h`;
};

const skipReasonLabel = (reason) => {
  const labels = {
    accrual_disabled: "Accrual disabled",
    accrual_frequency_none: "Frequency is none",
    accrual_rate_zero: "Accrual rate is zero",
    cap_already_reached: "Cap already reached",
    entitlement_disabled: "Paid entitlement is off",
    blocked_by_waiting_period: "Waiting period active",
    allowance_zero: "No allowance configured",
    existing_balance: "Already initialized",
    no_current_period_entitlement: "No current-period entitlement",
    not_selected: "Excluded by current apply mode",
  };
  return labels[reason] || String(reason || "Not skipped").replace(/_/g, " ");
};

const formatAccrualTriggerLabel = (trigger) => {
  const labels = {
    manual: "Manual posting",
    scheduled: "Scheduled automation",
  };
  return labels[trigger] || String(trigger || "manual").replace(/_/g, " ");
};

const entitlementImpactLabels = {
  initialize: "Needs initialization",
  partial_initialize: "Partial initialization",
  top_up: "Top up",
  skip_existing_balance: "Already initialized",
  conflict_existing_manual_balance: "Manual balance conflict",
  blocked_by_waiting_period: "Eligibility pending",
  not_assigned: "Not assigned",
  would_create_first_accrual: "Accrual preview",
  no_change: "No change",
};

const entitlementImpactTone = (impact, skipped) => {
  if (impact === "blocked_by_waiting_period" || impact === "conflict_existing_manual_balance") return "warning";
  if (skipped) return "default";
  if (impact === "would_create_first_accrual") return "primary";
  return "success";
};

const readableChipSx = (tone = "default") => {
  const tones = {
    primary: {
      bgcolor: "#dbeafe",
      color: "#1e3a8a",
      borderColor: "#93c5fd",
    },
    success: {
      bgcolor: "#dcfce7",
      color: "#14532d",
      borderColor: "#86efac",
    },
    warning: {
      bgcolor: "#ffedd5",
      color: "#7c2d12",
      borderColor: "#fdba74",
    },
    default: {
      bgcolor: "#f1f5f9",
      color: "#0f172a",
      borderColor: "#cbd5e1",
    },
  };
  return {
    ...(tones[tone] || tones.default),
    border: "1px solid",
    fontWeight: 800,
    "& .MuiChip-label": {
      color: "inherit",
    },
  };
};

const enterpriseCardSx = {
  border: "1px solid",
  borderColor: "rgba(148, 163, 184, 0.45)",
  borderRadius: 3,
  p: 2.25,
  height: "100%",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.86))",
  boxShadow: "0 16px 38px rgba(15, 23, 42, 0.055)",
};

const policyGroupSx = {
  border: "1px solid",
  borderColor: "rgba(148, 163, 184, 0.24)",
  borderRadius: 2,
  p: 1.5,
  bgcolor: "rgba(248, 250, 252, 0.52)",
};

const metricCellSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  p: 1.25,
  bgcolor: "background.paper",
};

const formatEntitlementSummary = (entitlement = {}, policy = {}) => {
  if (!entitlement.paid_entitlement_enabled && policy.balance_managed) {
    return "No company allowance is configured. Balance tracking is still enabled below.";
  }
  if (!entitlement.paid_entitlement_enabled) return "Manual leave type. No paid entitlement is configured.";
  const amount = Number(entitlement.allowance_amount || 0);
  const unit = entitlement.allowance_unit || "hours";
  const workday = Number(entitlement.workday_hours || 8);
  const waiting = Number(entitlement.waiting_period_days || 0);
  return `${amount || 0} ${unit}/year · ${workday}h standard workday · ${waiting ? `${waiting} day waiting period` : "no waiting period"}`;
};

const formatAllowanceSetupLabel = (entitlement = {}) => {
  if (!entitlement.paid_entitlement_enabled) return "Allowance not configured";
  const amount = Number(entitlement.allowance_amount || 0);
  const unit = entitlement.allowance_unit || "hours";
  if (amount <= 0) return "Allowance amount missing";
  return `${amount} ${unit}`;
};

const getEntitlementSetupChips = (entitlement = {}, policy = {}) => {
  const waiting = Number(entitlement.waiting_period_days || 0);
  return [
    {
      label: entitlement.paid_entitlement_enabled ? formatAllowanceSetupLabel(entitlement) : "No paid allowance",
      tone: entitlement.paid_entitlement_enabled && Number(entitlement.allowance_amount || 0) > 0 ? "success" : "default",
    },
    {
      label: policy.balance_managed ? "Balance tracking on" : "Balance tracking off",
      tone: policy.balance_managed ? "primary" : "default",
    },
    {
      label: waiting ? `${waiting} day waiting period` : "No waiting period",
      tone: waiting ? "warning" : "default",
    },
    {
      label: entitlement.applies_to_new_hires ? "Auto-applies to new hires" : "New hires manual",
      tone: entitlement.applies_to_new_hires ? "primary" : "default",
    },
    {
      label: insufficientBalanceLabels[policy.insufficient_balance_mode || "warn"] || "Warn manager",
      tone: policy.insufficient_balance_mode === "block" ? "warning" : "default",
    },
  ];
};

const getEntitlementRowState = (row = {}) => {
  if (row.impact_type === "blocked_by_waiting_period") {
    return {
      label: "Eligibility pending",
      tone: "warning",
      detail: row.message || (row.eligibility_date ? `Eligible on ${row.eligibility_date}` : "Waiting period is active."),
    };
  }
  if (row.impact_type === "skip_existing_balance" || row.skip_reason === "existing_balance") {
    return {
      label: "Already initialized",
      tone: "default",
      detail: "This employee already has a balance row for this leave type.",
    };
  }
  if (!row.skipped && Number(row.proposed_ledger_delta_hours || 0) > 0) {
    return {
      label: "Needs initialization",
      tone: "success",
      detail: row.message || "Eligible for a ledger-backed balance entry.",
    };
  }
  if (row.impact_type === "would_create_first_accrual") {
    return {
      label: "Accrual preview only",
      tone: "primary",
      detail: "Use Accrual preview / manual posting to create accrual ledger entries.",
    };
  }
  if (row.skipped) {
    return {
      label: "Skipped",
      tone: "default",
      detail: skipReasonLabel(row.skip_reason),
    };
  }
  return {
    label: "No action needed",
    tone: "default",
    detail: row.message || "No ledger-backed balance action is proposed.",
  };
};

const setupProfiles = {
  simple: {
    label: "Simple",
    tagline: "Best for smaller or lighter-process teams that want safe manual controls.",
    description: "Keeps request options conservative, uses approval as payroll-hours confirmation, and leaves balances/accruals mostly manual.",
    summary: [
      "Hourly and partial-day requests off by default; full-day, multi-day, and shift-linked leave remain available.",
      "Approved leave blocks Smart Shift; pending leave warns.",
      "Approving leave confirms payroll-ready hours from safe request/computed values; the extra payroll-hours review is off.",
      "Track balance usage is off for every leave type, so paid leave can still be approved without balance checks.",
      "Scheduled accrual automation stays off.",
    ],
    settings: {
      allow_hourly_leave: false,
      allow_partial_day_leave: false,
      allow_multi_day_leave: true,
      allow_shift_linked_leave: true,
      allow_employee_paid_unpaid_selection: false,
      default_day_count_strategy: "business_days_only",
      count_weekends: false,
      count_non_working_days: false,
      pending_leave_smart_shift_mode: "warn",
      approved_leave_smart_shift_mode: "block",
      attachment_required_leave_types_json: [],
      require_manager_confirmed_hours_for_payroll_ready: false,
      automatic_accruals_enabled: false,
      automatic_accrual_frequency: "monthly",
    },
    policyFor: () => ({
      balance_managed: false,
      insufficient_balance_mode: "warn",
      deduct_on: "approval",
      accrual_enabled: false,
      accrual_unit: "hours",
      accrual_rate: 0,
      accrual_frequency: "none",
      max_balance_hours: "",
      allow_negative_balance: false,
    }),
  },
  standard: {
    label: "Standard",
    tagline: "Recommended for growing teams that need flexible requests and clear manager controls.",
    description: "Supports modern time-off requests, keeps payroll readiness manager-confirmed, and makes vacation/sick balances operational.",
    summary: [
      "Hourly, partial-day, multi-day, and shift-linked requests are available.",
      "Approved leave blocks Smart Shift; pending leave warns.",
      "Vacation and sick leave become balance-managed with manager warnings for shortages.",
      "Scheduled accrual automation stays off; manual dry run/posting remains available.",
    ],
    settings: {
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
    },
    policyFor: (leaveType) => {
      const managed = ["vacation", "sick"].includes(leaveType);
      return {
        balance_managed: managed,
        insufficient_balance_mode: managed ? "warn" : "warn",
        deduct_on: "approval",
        accrual_enabled: false,
        accrual_unit: "hours",
        accrual_rate: 0,
        accrual_frequency: managed ? "monthly" : "none",
        max_balance_hours: "",
        allow_negative_balance: false,
      };
    },
  },
  advanced: {
    label: "Advanced",
    tagline: "Best for larger or more policy-heavy teams that want stronger operating controls.",
    description: "Expands balance-managed leave types, tightens shortage handling, and prepares accrual policy fields without turning automation on.",
    summary: [
      "All request modes stay available for detailed manager review.",
      "Approved leave blocks Smart Shift; pending leave blocks to reduce scheduling risk.",
      "Vacation, sick, personal, and compassionate leave become balance-managed.",
      "Sick and compassionate leave are marked as documentation-expected. Scheduled automation stays off.",
    ],
    settings: {
      allow_hourly_leave: true,
      allow_partial_day_leave: true,
      allow_multi_day_leave: true,
      allow_shift_linked_leave: true,
      allow_employee_paid_unpaid_selection: true,
      default_day_count_strategy: "business_days_only",
      count_weekends: false,
      count_non_working_days: false,
      pending_leave_smart_shift_mode: "block",
      approved_leave_smart_shift_mode: "block",
      attachment_required_leave_types_json: ["sick", "compassionate"],
      require_manager_confirmed_hours_for_payroll_ready: true,
      automatic_accruals_enabled: false,
      automatic_accrual_frequency: "monthly",
    },
    policyFor: (leaveType) => {
      const managed = ["vacation", "sick", "personal", "compassionate"].includes(leaveType);
      return {
        balance_managed: managed,
        insufficient_balance_mode: managed ? "block" : "warn",
        deduct_on: "approval",
        accrual_enabled: false,
        accrual_unit: "hours",
        accrual_rate: 0,
        accrual_frequency: managed ? "monthly" : "none",
        max_balance_hours: "",
        allow_negative_balance: false,
      };
    },
  },
};

const leaveTypeSetupGuides = {
  sick: {
    title: "Sick leave setup guide",
    overview:
      "Sick leave is commonly used for illness, recovery, medical appointments, or short health-related absences. Many teams track it as a paid entitlement, but sick leave usually needs more manager judgment than vacation.",
    best: [
      "Enable paid entitlement: Usually On if the company offers paid sick time",
      "Allowance amount: use the company policy, for example 5 days/year or 40 hours/year",
      "Allowance unit: Days for manager-friendly setup, Hours for exact hourly policies",
      "Workday hours: Usually 8 unless the company uses a different standard day",
      "Grant method: Opening balance for initial setup, Annual front-load if granted yearly, Monthly accrual if earned over time",
      "Policy year basis: Calendar year for simple teams, company policy year if the company uses a custom reset date",
      "Start basis: Employee hire date",
      "Waiting period: 0 unless employees must wait before sick time is usable",
      "New hire proration: Prorate first period",
      "Shortage handling: Warn manager",
      "Advanced rules: Track balance usage On, deduct On approval, allow negative Off",
    ],
    why:
      "This gives managers the real company allowance in plain terms while still keeping flexibility for health-related situations. The ledger balance remains the source of truth after preview/apply or accrual posting.",
    stricter:
      "Use Block approval if paid sick time must never exceed the available balance. Use a waiting period if employees are not eligible immediately after hire.",
    flexible:
      "Use Allow negative only if the company intentionally allows borrowing from future sick entitlement. Otherwise keep Warn manager so exceptions are visible but controlled.",
    example:
      "A company offers 5 sick days per year with an 8-hour workday. The manager enters Allowance amount 5 and Unit Days. The system stores 40 allowance hours. If an employee hired mid-year is prorated, preview shows the employee-specific amount before any ledger entry is created.",
    guidance:
      "For most SMBs, Sick should be configured as a paid entitlement only if the company has a real sick-time policy. Start with Warn manager and On approval deduction before moving to stricter enforcement.",
  },
  vacation: {
    title: "Vacation setup guide",
    overview:
      "Vacation is usually the first leave type companies manage with a paid allowance and tracked balance. It is planned ahead, easier to audit, and usually has the clearest company policy.",
    best: [
      "Enable paid entitlement: On",
      "Allowance amount: use the company policy, for example 10 days/year or 80 hours/year",
      "Allowance unit: Days for simple setup, Hours if the company manages vacation hourly",
      "Workday hours: Usually 8",
      "Grant method: Annual front-load if granted at the start of the year, Monthly accrual if earned over time, Opening balance for first-time setup only",
      "Policy year basis: Calendar year or company policy year",
      "Start basis: Employee hire date",
      "Waiting period: 0 unless vacation cannot be used immediately",
      "New hire proration: Prorate first period for mid-year hires",
      "Shortage handling: Warn manager for most teams, Block approval for stricter teams",
      "Advanced rules: Track balance usage On, deduct On approval, max balance blank until the company has a known cap",
    ],
    why:
      "Vacation is the strongest fit for the new allowance workflow because managers normally think in annual days or hours, employees expect to see remaining balance, and approvals should show projected remaining balance.",
    stricter:
      "Use Block approval if managers should not approve paid vacation above the available balance. Use Approve available paid hours only if the company wants only the available paid portion applied and the overage handled manually/unpaid.",
    advanced:
      "For Monthly or Biweekly accrual, entitlement preview shows expected current-period impact, but apply does not create a fake opening balance. Use Accrual preview / manual posting to create real accrual ledger entries.",
    example:
      "A company offers 10 vacation days per year. The manager enters Allowance amount 10, Unit Days, Workday hours 8. Preview shows each employee's eligible/prorated hours. Applying eligible rows creates ledger-backed entries only for safe opening/front-load policies.",
    guidance:
      "Vacation is the best first candidate for paid entitlement, employee balance visibility, request impact preview, and manager approval-time deduction.",
  },
  personal: {
    title: "Personal leave setup guide",
    overview:
      "Personal leave is often used for errands, appointments, family needs, or discretionary personal time. Some companies offer a small paid allowance; others keep it manager-discretionary.",
    best: [
      "Enable paid entitlement: On only if the company has a defined personal leave allowance",
      "Allowance amount: commonly small, for example 2 days/year or 16 hours/year",
      "Allowance unit: Days for simple policy, Hours for precise partial-day usage",
      "Workday hours: Usually 8",
      "Grant method: Annual front-load or Opening balance; Monthly accrual only if the company intentionally earns personal time over time",
      "Policy year basis: Calendar year for simple teams",
      "Start basis: Employee hire date",
      "Waiting period: usually 0",
      "New hire proration: Prorate first period or Full period depending on company generosity",
      "Shortage handling: Warn manager",
      "Advanced rules: Track balance usage On if entitlement-backed, Off if handled case-by-case",
    ],
    why:
      "Personal leave benefits from visibility, but it is usually less strict than vacation. A small allowance with Warn manager gives managers context without overcomplicating approvals.",
    stricter:
      "Use Block approval only if personal leave is a firm capped paid benefit and exceptions should not be approved as paid time.",
    simpler:
      "Leave paid entitlement Off and Track balance usage Off if personal leave is handled case-by-case without a tracked bank.",
    example:
      "A company offers 2 personal days per year. The system stores this as 16 hours when Workday hours is 8. Employees see remaining balance, and managers see projected remaining balance before approval.",
    guidance:
      "Personal should either be a small paid entitlement with flexible warnings or remain fully manual. Avoid making it stricter than the company's real policy.",
  },
  emergency: {
    title: "Emergency leave setup guide",
    overview:
      "Emergency leave is usually for unexpected situations that need immediate time away. Most SMBs do not treat it as a standard paid entitlement unless they have a very specific internal policy.",
    best: [
      "Enable paid entitlement: Usually Off",
      "Allowance amount: 0 unless the company has a formal emergency leave allowance",
      "Allowance unit: Hours if tracked",
      "Workday hours: Usually 8 if days are used",
      "Grant method: Opening balance only if initializing a formal emergency bank",
      "Policy year basis: Calendar year if tracked",
      "Start basis: Employee hire date",
      "Waiting period: usually 0",
      "New hire proration: usually Full period if emergency leave is intentionally offered",
      "Shortage handling: Warn manager if tracking is enabled",
      "Advanced rules: Track balance usage Off for most teams",
    ],
    why:
      "Emergency leave usually needs speed and discretion. A strict paid balance can be too rigid unless the company has a defined entitlement.",
    tracking:
      "Only enable paid entitlement and Track balance usage if the company has a clearly defined emergency leave bank and wants managers to enforce it consistently.",
    example:
      "An employee has an urgent issue and needs immediate time away. For most teams, the manager records and approves the request without using a formal entitlement balance.",
    guidance:
      "Keep Emergency manual unless the business has a real paid emergency leave allowance. If tracking is added later, start with Warn manager, not Block approval.",
  },
  family: {
    title: "Family / Parental leave setup guide",
    overview:
      "Family / Parental leave often involves longer absences and policy-heavy situations. It may overlap with company policy or external legal requirements, so simple balance tracking should be used carefully.",
    best: [
      "Enable paid entitlement: Usually Off unless the company has a defined paid family/parental bank",
      "Allowance amount: 0 unless internally defined",
      "Allowance unit: Hours if tracked operationally",
      "Workday hours: Usually 8 if days are used",
      "Grant method: Opening balance only for an internal bank; avoid monthly/biweekly accrual unless the policy truly earns over time",
      "Policy year basis: Company policy year or employee anniversary year only if the internal policy requires it",
      "Start basis: Employee hire date",
      "Waiting period: set only if company policy has eligibility timing",
      "New hire proration: usually Start next cycle or Prorate first period if tracked",
      "Shortage handling: Warn manager if tracking is enabled",
      "Advanced rules: Track balance usage Off unless intentionally balance-managed",
    ],
    why:
      "This leave type often needs careful manager/admin review. A simple entitlement balance is not always the right model for longer or protected absences.",
    tracking:
      "Use paid entitlement only if the company has a clearly defined internal family/parental leave bank that managers are expected to track operationally.",
    example:
      "A company may keep Family / Parental manual so managers can review the employee's situation, expected duration, documentation, and company policy before deciding how to record the leave.",
    guidance:
      "Most SMBs should keep Family / Parental manual until they have a mature policy. Do not imply this feature provides legal entitlement calculations.",
  },
  compassionate: {
    title: "Compassionate leave setup guide",
    overview:
      "Compassionate leave is typically used for bereavement or serious family hardship. Some companies offer a small paid allowance; many prefer manager discretion.",
    best: [
      "Enable paid entitlement: Off unless the company has a defined compassionate leave allowance",
      "Allowance amount: use company policy, for example 3 days/year if formalized",
      "Allowance unit: Days for manager-friendly setup, Hours for exact balances",
      "Workday hours: Usually 8",
      "Grant method: Annual front-load or Opening balance if formalized; usually not monthly/biweekly accrual",
      "Policy year basis: Calendar year for simple teams",
      "Start basis: Employee hire date",
      "Waiting period: usually 0 unless company policy requires eligibility timing",
      "New hire proration: Full period or Prorate first period depending on company policy",
      "Shortage handling: Warn manager",
      "Advanced rules: Track balance usage Off unless intentionally formalized",
    ],
    why:
      "Compassionate leave needs empathy and discretion. A rigid balance policy can feel too harsh unless the company has a formal entitlement.",
    tracking:
      "Turn paid entitlement and Track balance usage On only if the company intentionally wants a measured compassionate leave bank.",
    documentation:
      "If the company expects supporting documentation, use Documentation settings to show that expectation while still keeping manager judgment in review.",
    example:
      "A company offers 3 compassionate days per year. The manager enters 3 days and uses Warn manager so shortages are visible but not handled harshly by default.",
    guidance:
      "Smaller teams often keep Compassionate manual. Larger or more policy-heavy teams may track it, but should do so thoughtfully and avoid over-automation.",
  },
};

const managerSetupLeaveGuides = [
  {
    title: "Vacation",
    subtitle: "Usually the first leave type to track",
    overview:
      "Vacation is the most common leave type to manage with a balance. For most companies, this is the best leave type to start with.",
    best: [
      "Track balance usage: On",
      "If balance is insufficient: Warn manager",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Often On",
      "Accrual unit: Hours",
      "Frequency: Monthly",
      "Max balance hours: Blank at first",
      "Allow negative balance flag: Off",
    ],
    why:
      "Vacation is usually planned ahead, easier to review, and easier to manage consistently than other leave types.",
    example:
      "An employee has 24 vacation hours and requests 8 hours. If approved, the system deducts 8 hours and the remaining balance becomes 16.",
    stricter:
      "Use Block approval if managers should not approve paid vacation above the available balance.",
  },
  {
    title: "Sick",
    subtitle: "Usually tracked, but often needs more flexibility",
    overview:
      "Sick leave is commonly used for illness, recovery, or medical appointments. Many companies track it with a balance, but usually allow more manager judgment than vacation.",
    best: [
      "Track balance usage: On",
      "If balance is insufficient: Warn manager",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Off at first, or On if the company has a defined sick accrual policy",
      "Accrual unit: Hours",
      "Frequency: None or Monthly",
      "Max balance hours: Blank at first",
      "Allow negative balance flag: Off",
    ],
    why:
      "Sick leave often needs some flexibility because real health situations are not always predictable.",
    example:
      "An employee has 6 sick hours and requests 8. With Warn manager, the manager sees the shortage and can decide whether to approve, adjust, or handle it another way.",
    stricter:
      "Use Block approval only if the company has a firm sick leave policy and does not allow exceptions.",
  },
  {
    title: "Personal",
    subtitle: "Often flexible, sometimes tracked",
    overview:
      "Personal leave is often used for errands, short appointments, or personal matters. Some companies track it, while others handle it case by case.",
    best: [
      "Track balance usage: On",
      "If balance is insufficient: Warn manager",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Usually Off",
      "Accrual unit: Hours",
      "Frequency: None",
      "Max balance hours: Blank",
      "Allow negative balance flag: Off",
    ],
    why:
      "Personal leave is usually less formal than vacation, so managers often want flexibility without losing visibility.",
    example:
      "An employee has 2 personal hours and requests 4. With Warn manager, the manager sees the shortage but can still make an exception if appropriate.",
    simpler:
      "Turn Track balance usage Off if personal leave is handled case by case and the company does not want a tracked entitlement.",
  },
  {
    title: "Emergency",
    subtitle: "Usually manual, not strongly balance-managed",
    overview:
      "Emergency leave is usually for unexpected situations that need immediate time away. Most small and medium teams do not track this with a formal balance.",
    best: [
      "Track balance usage: Off",
      "If balance is insufficient: Warn manager only if tracking is enabled later",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Off",
      "Accrual unit: Hours",
      "Frequency: None",
      "Max balance hours: Blank",
      "Allow negative balance flag: Off",
    ],
    why:
      "Emergency leave is often better handled case by case rather than through a strict tracked bank.",
    example:
      "An employee has an urgent personal issue and needs immediate time off. The manager reviews the case directly instead of relying on a formal balance.",
    tracking:
      "Only turn tracking on if the company has a clearly defined emergency leave entitlement and wants it enforced consistently.",
  },
  {
    title: "Family / Parental",
    subtitle: "Usually manual unless the company has a mature policy",
    overview:
      "Family / Parental leave often involves longer absences or policy-heavy situations. Many teams avoid simple balance tracking unless they have a very clear internal framework.",
    best: [
      "Track balance usage: Off",
      "If balance is insufficient: Warn manager only if tracking is enabled",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Off",
      "Accrual unit: Hours",
      "Frequency: None",
      "Max balance hours: Blank",
      "Allow negative balance flag: Off",
    ],
    why:
      "This leave type often needs careful case-by-case review and may depend on company policy beyond a simple balance rule.",
    example:
      "A family-related leave request may span multiple days and need extra review, rather than being treated like ordinary vacation.",
    tracking:
      "Only track it if the company already has a defined family/parental leave bank and managers are expected to track it operationally.",
  },
  {
    title: "Compassionate",
    subtitle: "Often sensitive, usually manager-guided",
    overview:
      "Compassionate leave is commonly used for bereavement or serious family hardship. Some companies track it, but many prefer manager judgment.",
    best: [
      "Track balance usage: Off, or On only if intentionally tracked",
      "If balance is insufficient: Warn manager",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Usually Off",
      "Accrual unit: Hours",
      "Frequency: None",
      "Max balance hours: Blank",
      "Allow negative balance flag: Off",
    ],
    why:
      "Compassionate leave often needs empathy and discretion. A rigid balance policy can feel too harsh unless the company has a very formal entitlement model.",
    example:
      "An employee requests compassionate leave during a serious family event. The manager may want policy guidance, but still needs room for judgment.",
    documentation:
      "If the company expects supporting documentation, use the Documentation settings to show that expectation, while still keeping manager discretion in review.",
  },
];

const managerSetupSettingGuide = [
  {
    title: "Track balance usage",
    body:
      "Turn this On when the leave type should reduce from a tracked balance. Turn it Off when the leave is usually handled manually or case by case.",
  },
  {
    title: "If balance is insufficient",
    body:
      "Warn manager is the best default for most growing teams. Block approval is best for stricter teams. Allow negative should be used only when the company intentionally allows borrowing from future balance. Approve available paid hours only is more advanced control for applying only the available paid portion.",
  },
  {
    title: "Deduct balance",
    body:
      "Usually best as On approval. This keeps requests from changing balances before a manager confirms them.",
  },
  {
    title: "Enable saved accrual policy",
    body:
      "Turn this On only when the company wants this leave type to build up over time. Good early candidates are Vacation and sometimes Sick.",
  },
  {
    title: "Accrual unit",
    body:
      "Usually best as Hours because it works well with hourly, partial-day, and payroll-ready workflows.",
  },
  {
    title: "Frequency",
    body:
      "Usually best as Monthly for Vacation, and None if accrual is not being used yet.",
  },
  {
    title: "Max balance hours",
    body:
      "Usually leave this blank at first. Add a cap later when the company has a clear cap policy.",
  },
  {
    title: "Allow negative balance flag",
    body:
      "Usually Off. Use only when the company clearly wants negative balances as part of policy.",
  },
];

const buildPostingKey = (draft = {}) => [
  "manual-accrual",
  draft.leave_type || "leave",
  draft.department_id || "all-departments",
  draft.recruiter_id || "all-employees",
  draft.period_start || draft.as_of_date || "no-start",
  draft.period_end || "no-end",
].join(":");

const HelpStatusChip = ({ label, color = "default" }) => (
  <Chip size="small" label={label} sx={readableChipSx(color)} />
);

const HelpSection = ({ title, status, statusColor, children }) => (
  <Box>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }} flexWrap="wrap" useFlexGap>
      <Typography variant="subtitle2" fontWeight={800}>{title}</Typography>
      <HelpStatusChip label={status} color={statusColor} />
    </Stack>
    <Stack spacing={0.75}>{children}</Stack>
  </Box>
);

const SettingsLeaveSettings = () => {
  const [settings, setSettings] = useState(null);
  const [original, setOriginal] = useState(null);
  const [policies, setPolicies] = useState(() => normalizeLeaveBalancePolicies());
  const [originalPolicies, setOriginalPolicies] = useState(() => normalizeLeaveBalancePolicies());
  const [entitlementPolicies, setEntitlementPolicies] = useState(() => normalizeLeaveEntitlementPolicies());
  const [originalEntitlementPolicies, setOriginalEntitlementPolicies] = useState(() => normalizeLeaveEntitlementPolicies());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [policiesSaving, setPoliciesSaving] = useState(false);
  const [entitlementsLoading, setEntitlementsLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [entitlementPreviewDraft, setEntitlementPreviewDraft] = useState({
    leave_type: "vacation",
    recruiter_id: "",
    department_id: "",
    as_of_date: "",
    effective_date: "",
    action_mode: "initialize_missing_only",
  });
  const [entitlementPreviewResult, setEntitlementPreviewResult] = useState(null);
  const [entitlementPreviewLoading, setEntitlementPreviewLoading] = useState(false);
  const [entitlementPreviewError, setEntitlementPreviewError] = useState("");
  const [entitlementApplyOpen, setEntitlementApplyOpen] = useState(false);
  const [entitlementApplyLoading, setEntitlementApplyLoading] = useState(false);
  const [entitlementApplyError, setEntitlementApplyError] = useState("");
  const [entitlementApplyResult, setEntitlementApplyResult] = useState(null);
  const [previewDraft, setPreviewDraft] = useState({
    leave_type: "vacation",
    recruiter_id: "",
    department_id: "",
    as_of_date: "",
    period_start: "",
    period_end: "",
  });
  const [previewResult, setPreviewResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [postConfirmOpen, setPostConfirmOpen] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState("");
  const [postResult, setPostResult] = useState(null);
  const [accrualRuns, setAccrualRuns] = useState([]);
  const [accrualRunsLoading, setAccrualRunsLoading] = useState(false);
  const [accrualRunsError, setAccrualRunsError] = useState("");
  const [accrualHistoryOpen, setAccrualHistoryOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedRunLoading, setSelectedRunLoading] = useState(false);
  const [selectedRunError, setSelectedRunError] = useState("");
  const [error, setError] = useState("");
  const [policiesError, setPoliciesError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, severity: "success", message: "" });
  const [helpOpen, setHelpOpen] = useState(false);
  const [balancePolicyHelpOpen, setBalancePolicyHelpOpen] = useState(false);
  const [managerSetupGuideOpen, setManagerSetupGuideOpen] = useState(false);
  const [leaveTypeHelp, setLeaveTypeHelp] = useState(null);
  const [selectedSetupProfile, setSelectedSetupProfile] = useState("simple");
  const [leaveAreaTab, setLeaveAreaTab] = useState("settings");

  const dirty = useMemo(() => settings && original && hasLeaveSettingsChanges(settings, original), [settings, original]);
  const policiesDirty = useMemo(
    () => hasLeaveBalancePolicyChanges(policies, originalPolicies),
    [policies, originalPolicies]
  );
  const entitlementsDirty = useMemo(
    () => hasLeaveEntitlementPolicyChanges(entitlementPolicies, originalEntitlementPolicies),
    [entitlementPolicies, originalEntitlementPolicies]
  );
  const selectedDayCount = dayCountOptions.find((option) => option.value === settings?.default_day_count_strategy);
  const latestAccrualRun = accrualRuns[0] || null;
  const selectedLeaveTypeGuide = leaveTypeHelp ? leaveTypeSetupGuides[leaveTypeHelp] : null;

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await leaveSettings.getSettings();
      const normalized = normalizeLeaveSettings(data);
      setSettings(normalized);
      setOriginal(normalized);
    } catch (err) {
      setError(err?.response?.data?.error || err?.displayMessage || "Unable to load leave settings.");
    } finally {
      setLoading(false);
    }
  };

  const loadBalancePolicies = async () => {
    setPoliciesLoading(true);
    setEntitlementsLoading(true);
    setPoliciesError("");
    try {
      const [balanceData, entitlementData] = await Promise.all([
        leaveSettings.getBalancePolicies(),
        leaveSettings.getEntitlementPolicies(),
      ]);
      const normalizedBalance = normalizeLeaveBalancePolicies(balanceData);
      const normalizedEntitlements = normalizeLeaveEntitlementPolicies(entitlementData);
      setPolicies(normalizedBalance);
      setOriginalPolicies(normalizedBalance);
      setEntitlementPolicies(normalizedEntitlements);
      setOriginalEntitlementPolicies(normalizedEntitlements);
    } catch (err) {
      setPoliciesError(err?.response?.data?.error || err?.displayMessage || "Unable to load leave allowance policies.");
    } finally {
      setPoliciesLoading(false);
      setEntitlementsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadBalancePolicies();
    loadPreviewFilters();
    loadAccrualRuns();
  }, []);

  const loadAccrualRuns = async () => {
    setAccrualRunsLoading(true);
    setAccrualRunsError("");
    try {
      const data = await leaveSettings.listBalanceAccrualRuns({ limit: 25 });
      setAccrualRuns(Array.isArray(data?.runs) ? data.runs : []);
    } catch (err) {
      setAccrualRunsError(err?.response?.data?.error || err?.displayMessage || "Unable to load accrual run history.");
    } finally {
      setAccrualRunsLoading(false);
    }
  };

  const openAccrualRunDetail = async (run) => {
    if (!run?.id) return;
    setSelectedRun(run);
    setSelectedRunLoading(true);
    setSelectedRunError("");
    try {
      const data = await leaveSettings.getBalanceAccrualRun(run.id);
      setSelectedRun(data);
    } catch (err) {
      setSelectedRunError(err?.response?.data?.error || err?.displayMessage || "Unable to load accrual run details.");
    } finally {
      setSelectedRunLoading(false);
    }
  };

  const loadPreviewFilters = async () => {
    try {
      const [deptRes, employeeRes] = await Promise.all([
        api.get("/api/departments"),
        api.get("/manager/recruiters"),
      ]);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setEmployees(Array.isArray(employeeRes.data?.recruiters) ? employeeRes.data.recruiters : []);
    } catch {
      setDepartments([]);
      setEmployees([]);
    }
  };

  const updateField = (key, value) => {
    setSettings((prev) => ({ ...(prev || {}), [key]: value }));
  };

  const handleSave = async () => {
    if (!settings || !original || !dirty || saving) return;
    setSaving(true);
    setError("");
    try {
      const patch = buildLeaveSettingsPatch(settings, original);
      const data = await leaveSettings.saveSettings(patch);
      const normalized = normalizeLeaveSettings(data);
      setSettings(normalized);
      setOriginal(normalized);
      setSnackbar({ open: true, severity: "success", message: "Leave settings saved." });
    } catch (err) {
      const message = err?.response?.data?.error || err?.displayMessage || "Unable to save leave settings.";
      setError(message);
      setSnackbar({ open: true, severity: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const updatePolicy = (leaveType, key, value) => {
    setPolicies((prev) => ({
      ...(prev || normalizeLeaveBalancePolicies()),
      policies: (prev?.policies || []).map((policy) =>
        policy.leave_type === leaveType ? { ...policy, [key]: value } : policy
      ),
    }));
  };

  const updateEntitlementPolicy = (leaveType, key, value) => {
    setEntitlementPolicies((prev) => ({
      ...(prev || normalizeLeaveEntitlementPolicies()),
      policies: (prev?.policies || []).map((policy) =>
        policy.leave_type === leaveType ? { ...policy, [key]: value } : policy
      ),
    }));
  };

  const handleSavePolicies = async () => {
    if ((!policiesDirty && !entitlementsDirty) || policiesSaving) return;
    setPoliciesSaving(true);
    setPoliciesError("");
    try {
      if (entitlementsDirty) {
        const entitlementPatch = buildLeaveEntitlementPolicyPatch(entitlementPolicies, originalEntitlementPolicies);
        const entitlementData = await leaveSettings.saveEntitlementPolicies(entitlementPatch);
        const normalizedEntitlements = normalizeLeaveEntitlementPolicies(entitlementData);
        setEntitlementPolicies(normalizedEntitlements);
        setOriginalEntitlementPolicies(normalizedEntitlements);
      }
      if (policiesDirty) {
        const patch = buildLeaveBalancePolicyPatch(policies, originalPolicies);
        const data = await leaveSettings.saveBalancePolicies(patch);
        const normalized = normalizeLeaveBalancePolicies(data);
        setPolicies(normalized);
        setOriginalPolicies(normalized);
      }
      setSnackbar({ open: true, severity: "success", message: "Leave allowances and balance rules saved." });
    } catch (err) {
      const message = err?.response?.data?.error || err?.displayMessage || "Unable to save leave allowances and balance rules.";
      setPoliciesError(message);
      setSnackbar({ open: true, severity: "error", message });
    } finally {
      setPoliciesSaving(false);
    }
  };

  const runAccrualPreview = async () => {
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewResult(null);
    setPostResult(null);
    setPostError("");
    try {
      const payload = {
        leave_type: previewDraft.leave_type,
        ...(previewDraft.recruiter_id ? { recruiter_ids: [Number(previewDraft.recruiter_id)] } : {}),
        ...(previewDraft.department_id ? { department_id: Number(previewDraft.department_id) } : {}),
        ...(previewDraft.as_of_date ? { as_of_date: previewDraft.as_of_date } : {}),
        ...(previewDraft.period_start ? { period_start: previewDraft.period_start } : {}),
        ...(previewDraft.period_end ? { period_end: previewDraft.period_end } : {}),
      };
      const data = await leaveSettings.previewBalanceAccruals(payload);
      setPreviewResult(data);
    } catch (err) {
      setPreviewError(err?.response?.data?.error || err?.displayMessage || "Unable to run accrual preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const postablePreviewRows = useMemo(
    () => (previewResult?.rows || []).filter((row) => !row.skipped && Number(row.proposed_accrual_hours || 0) > 0),
    [previewResult]
  );
  const postableEntitlementRows = useMemo(
    () => (entitlementPreviewResult?.rows || []).filter((row) => !row.skipped && Number(row.proposed_ledger_delta_hours || 0) > 0),
    [entitlementPreviewResult]
  );
  const entitlementEnrollmentSummary = useMemo(() => {
    const rows = entitlementPreviewResult?.rows || [];
    return {
      needsInitialization: rows.filter((row) => !row.skipped && Number(row.proposed_ledger_delta_hours || 0) > 0).length,
      alreadyInitialized: rows.filter((row) => row.impact_type === "skip_existing_balance" || row.skip_reason === "existing_balance").length,
      eligibilityPending: rows.filter((row) => row.impact_type === "blocked_by_waiting_period" || row.skip_reason === "blocked_by_waiting_period").length,
      manualConflicts: rows.filter((row) => row.impact_type === "conflict_existing_manual_balance").length,
      noAction: rows.filter((row) => row.impact_type === "no_change").length,
    };
  }, [entitlementPreviewResult]);
  const hasSettingsDraftChanges = Boolean(dirty);
  const hasPolicyDraftChanges = Boolean(policiesDirty || entitlementsDirty);

  const applySetupProfile = () => {
    const profile = setupProfiles[selectedSetupProfile] || setupProfiles.standard;
    setSettings((prev) => ({
      ...(prev || {}),
      ...profile.settings,
    }));
    setPolicies((prev) => {
      const normalized = prev || normalizeLeaveBalancePolicies();
      return {
        ...normalized,
        policies: (normalized.policies || []).map((policy) => ({
          ...policy,
          ...profile.policyFor(policy.leave_type),
        })),
      };
    });
    setEntitlementPolicies((prev) => {
      const normalized = prev || normalizeLeaveEntitlementPolicies();
      return {
        ...normalized,
        policies: (normalized.policies || []).map((policy) => ({
          ...policy,
          enabled: false,
          paid_entitlement_enabled: false,
          allowance_amount: 0,
          allowance_unit: "hours",
          workday_hours: 8,
          grant_method: "opening_balance",
          policy_year_basis: "calendar_year",
          start_basis: "hire_date",
          proration_method: "prorate_first_period",
          waiting_period_days: 0,
          applies_to_new_hires: false,
        })),
      };
    });
    setSnackbar({ open: true, severity: "info", message: `${profile.label} defaults applied. Use the floating Save bar to make them active.` });
  };

  const buildEntitlementPreviewPayload = () => ({
    leave_type: entitlementPreviewDraft.leave_type,
    action_mode: entitlementPreviewDraft.action_mode || "initialize_missing_only",
    ...(entitlementPreviewDraft.recruiter_id ? { recruiter_ids: [Number(entitlementPreviewDraft.recruiter_id)] } : {}),
    ...(entitlementPreviewDraft.department_id ? { department_id: Number(entitlementPreviewDraft.department_id) } : {}),
    ...(entitlementPreviewDraft.as_of_date ? { as_of_date: entitlementPreviewDraft.as_of_date } : {}),
    ...(entitlementPreviewDraft.effective_date ? { effective_date: entitlementPreviewDraft.effective_date } : {}),
  });

  const runEntitlementPreview = async () => {
    setEntitlementPreviewLoading(true);
    setEntitlementPreviewError("");
    setEntitlementPreviewResult(null);
    setEntitlementApplyResult(null);
    setEntitlementApplyError("");
    try {
      const data = await leaveSettings.previewEntitlements(buildEntitlementPreviewPayload());
      setEntitlementPreviewResult(data);
    } catch (err) {
      setEntitlementPreviewError(err?.response?.data?.error || err?.displayMessage || "Unable to preview leave entitlements.");
    } finally {
      setEntitlementPreviewLoading(false);
    }
  };

  const applyEntitlements = async () => {
    if (!entitlementPreviewResult || entitlementApplyLoading || postableEntitlementRows.length === 0) return;
    setEntitlementApplyLoading(true);
    setEntitlementApplyError("");
    try {
      const selectedIds = postableEntitlementRows.map((row) => row.recruiter_id);
      const data = await leaveSettings.applyEntitlements({
        ...buildEntitlementPreviewPayload(),
        action_mode: "apply_selected_only",
        selected_recruiter_ids: selectedIds,
        confirm: true,
        idempotency_key: [
          "entitlement",
          entitlementPreviewDraft.leave_type,
          entitlementPreviewDraft.department_id || "all-departments",
          entitlementPreviewDraft.recruiter_id || "all-employees",
          entitlementPreviewDraft.as_of_date || "asof-default",
          entitlementPreviewDraft.effective_date || "effective-default",
        ].join("-"),
      });
      setEntitlementApplyResult(data);
      setEntitlementApplyOpen(false);
      loadEmployeeBalancesAfterEntitlementApply();
      setSnackbar({
        open: true,
        severity: data.idempotent_replay ? "info" : "success",
        message: data.idempotent_replay ? "This entitlement apply was already completed for the same key." : "Entitlement balances applied.",
      });
    } catch (err) {
      const message = err?.response?.data?.error || err?.displayMessage || "Unable to apply entitlements.";
      setEntitlementApplyError(message);
      setSnackbar({ open: true, severity: "error", message });
    } finally {
      setEntitlementApplyLoading(false);
    }
  };

  const loadEmployeeBalancesAfterEntitlementApply = () => {
    // Keep this narrow: re-run the preview so managers see updated skipped/projected rows after ledger writes.
    runEntitlementPreview();
  };

  const postAccruals = async () => {
    if (!previewResult || postLoading || postablePreviewRows.length === 0) return;
    setPostLoading(true);
    setPostError("");
    try {
      const payload = {
        leave_type: previewDraft.leave_type,
        confirm: true,
        idempotency_key: buildPostingKey(previewDraft),
        ...(previewDraft.recruiter_id ? { recruiter_ids: [Number(previewDraft.recruiter_id)] } : {}),
        ...(previewDraft.department_id ? { department_id: Number(previewDraft.department_id) } : {}),
        ...(previewDraft.as_of_date ? { as_of_date: previewDraft.as_of_date } : {}),
        ...(previewDraft.period_start ? { period_start: previewDraft.period_start } : {}),
        ...(previewDraft.period_end ? { period_end: previewDraft.period_end } : {}),
      };
      const data = await leaveSettings.postBalanceAccruals(payload);
      setPostResult(data);
      setPostConfirmOpen(false);
      loadAccrualRuns();
      setSnackbar({
        open: true,
        severity: "success",
        message: data.idempotent_replay ? "Accrual posting was already completed for this key." : "Accruals posted.",
      });
    } catch (err) {
      const message = err?.response?.data?.error || err?.displayMessage || "Unable to post accruals.";
      setPostError(message);
      setSnackbar({ open: true, severity: "error", message });
    } finally {
      setPostLoading(false);
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (error && !settings) {
      return (
        <Stack spacing={2}>
          <Alert severity="error">{error}</Alert>
          <Button variant="outlined" onClick={loadSettings}>Retry</Button>
        </Stack>
      );
    }

    if (!settings) return null;

    return (
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Alert severity="info" variant="outlined">
          These settings define company leave defaults for current and future leave workflows. They do not rewrite existing approved leave rows, and some scheduling/documentation options are advisory until their related workflows are connected.
        </Alert>

        <Box>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "flex-start" }} sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800}>Setup profile</Typography>
              <Typography variant="body2" color="text.secondary">
                Apply recommended starting defaults for different operating styles. This does not save automatically, and every setting remains editable afterward.
              </Typography>
            </Box>
            <Button variant="contained" onClick={applySetupProfile} disabled={policiesLoading}>
              Apply recommended defaults
            </Button>
          </Stack>
          <Grid container spacing={1.5}>
            {Object.entries(setupProfiles).map(([key, profile]) => {
              const selected = selectedSetupProfile === key;
              return (
                <Grid item xs={12} md={4} key={key}>
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSetupProfile(key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") setSelectedSetupProfile(key);
                    }}
                    sx={{
                      border: "1px solid",
                      borderColor: selected ? "primary.main" : "divider",
                      borderRadius: 2,
                      p: 1.5,
                      height: "100%",
                      cursor: "pointer",
                      backgroundColor: selected ? "action.selected" : "background.paper",
                      boxShadow: selected ? "0 0 0 1px rgba(66, 99, 235, 0.18)" : "none",
                    }}
                  >
                    <Stack spacing={0.75}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2" fontWeight={800}>{profile.label}</Typography>
                        {selected && <Chip size="small" label="Selected" sx={readableChipSx("primary")} />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{profile.tagline}</Typography>
                      <Typography variant="caption" color="text.secondary">{profile.description}</Typography>
                    </Stack>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
          <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
            <Typography variant="body2" fontWeight={700} gutterBottom>
              {setupProfiles[selectedSetupProfile]?.label} profile preview
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, my: 0 }}>
              {(setupProfiles[selectedSetupProfile]?.summary || []).map((item) => (
                <Typography component="li" variant="body2" key={item}>{item}</Typography>
              ))}
            </Stack>
          </Alert>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>Leave request options</Typography>
          <Grid container spacing={1}>
            {[
              ["allow_hourly_leave", "Hourly leave requests", "Allows employees to request a specific number of hours."],
              ["allow_partial_day_leave", "Partial-day leave requests", "Allows same-day time-off requests using hours or start/end time."],
              ["allow_multi_day_leave", "Multi-day leave requests", "Allows date ranges longer than one day."],
              ["allow_shift_linked_leave", "Shift-linked leave", "Keeps the existing request-from-shift workflow available."],
              ["allow_employee_paid_unpaid_selection", "Employee paid/unpaid selection", "Controls whether employee-facing forms may expose paid/unpaid choice in future UI."],
            ].map(([key, label, helper]) => (
              <Grid item xs={12} md={6} key={key}>
                <FormControlLabel
                  control={<Switch checked={Boolean(settings[key])} onChange={(event) => updateField(key, event.target.checked)} />}
                  label={<Box><Typography variant="body2" fontWeight={700}>{label}</Typography><Typography variant="caption" color="text.secondary">{helper}</Typography></Box>}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>Day counting</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Default day-count strategy"
                value={settings.default_day_count_strategy || "business_days_only"}
                onChange={(event) => updateField("default_day_count_strategy", event.target.value)}
                helperText={selectedDayCount?.helper || "Used as the default for future leave calculations."}
              >
                {dayCountOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <FormControlLabel
                  control={<Switch checked={Boolean(settings.count_weekends)} onChange={(event) => updateField("count_weekends", event.target.checked)} />}
                  label="Count weekends by default"
                />
                <Typography variant="caption" color="text.secondary">
                  Advisory default. Existing approved leave rows keep their stored day-count strategy.
                </Typography>
                <FormControlLabel
                  control={<Switch checked={Boolean(settings.count_non_working_days)} onChange={(event) => updateField("count_non_working_days", event.target.checked)} />}
                  label="Count non-working days by default"
                />
              </Stack>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>Scheduling behavior</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Pending leave in Smart Shift"
                value={settings.pending_leave_smart_shift_mode || "warn"}
                onChange={(event) => updateField("pending_leave_smart_shift_mode", event.target.value)}
                helperText="Controls whether pending leave warns, blocks, or is ignored during Smart Shift suggestion/apply checks."
              >
                {smartShiftModeOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Approved leave in Smart Shift"
                value={settings.approved_leave_smart_shift_mode || "block"}
                onChange={(event) => updateField("approved_leave_smart_shift_mode", event.target.value)}
                helperText="Controls whether approved leave blocks, warns, or is ignored during Smart Shift suggestion/apply checks. Default is block."
              >
                {smartShiftModeOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>Documentation</Typography>
          <FormControl fullWidth size="small">
            <InputLabel id="leave-attachment-types-label">Attachment-required leave types</InputLabel>
            <Select
              labelId="leave-attachment-types-label"
              multiple
              value={settings.attachment_required_leave_types_json || []}
              onChange={(event) => updateField("attachment_required_leave_types_json", event.target.value)}
              input={<OutlinedInput label="Attachment-required leave types" />}
              renderValue={(selected) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {selected.length === 0 ? <Typography variant="body2" color="text.secondary">None</Typography> : selected.map((value) => <Chip key={value} size="small" label={formatLeaveTypeLabel(value)} />)}
                </Stack>
              )}
            >
              {LEAVE_TYPE_OPTIONS.map((type) => (
                <MenuItem key={type} value={type}>{formatLeaveTypeLabel(type)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
            This records documentation requirements for future attachment workflows. It does not upload or enforce documents yet.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={800}>Payroll readiness</Typography>
            <Tooltip
              placement="top"
              arrow
              title="Ready-for-payroll leave is approved leave that payroll exports can use. If this is on, managers approve the request first and then must confirm the exact approved hours in the manager leave drawer. If this is off, approval also confirms the request's safe computed/requested hours. Keep it on for hourly, partial-day, split-to-unpaid, or stricter payroll review workflows."
            >
              <IconButton size="small" aria-label="Payroll readiness help">
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(settings.require_manager_confirmed_hours_for_payroll_ready)}
                onChange={(event) => updateField("require_manager_confirmed_hours_for_payroll_ready", event.target.checked)}
              />
            }
            label="Require manager-confirmed hours before payroll-ready"
          />
          <Typography variant="caption" color="text.secondary" display="block">
            On: approved leave stays preview-only until a manager confirms approved hours in the manager leave drawer. Off: approving leave also confirms payroll-ready hours from safe request/computed values. Payroll formulas are unchanged.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>Scheduled accrual automation</Typography>
          <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
            Automation setup only: turning this on stores the company opt-in for scheduled accrual posting. No posting starts from this screen; payroll formulas, filing, and remittance are not affected. Each leave type still follows its own accrual policy frequency.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(settings.automatic_accruals_enabled)}
                    onChange={(event) => updateField("automatic_accruals_enabled", event.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>Enable future scheduled accrual automation</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Stores your company opt-in for scheduled accrual posting. Use manual dry run/posting above for active balance changes and verification.
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Automation scan frequency"
                value={settings.automatic_accrual_frequency || "monthly"}
                onChange={(event) => updateField("automatic_accrual_frequency", event.target.value)}
                helperText="This is the scheduler scan cadence/fallback only. Leave-type policy frequency remains the accrual cadence source of truth."
              >
                {ACCRUAL_FREQUENCY_OPTIONS.filter((option) => option !== "none").map((option) => (
                  <MenuItem key={option} value={option}>{formatAccrualFrequencyLabel(option)}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">Last automation run</Typography>
              <Typography variant="body2" fontWeight={700}>{formatDateTime(settings.automatic_accrual_last_run_at)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">Next automation run</Typography>
              <Typography variant="body2" fontWeight={700}>{formatDateTime(settings.automatic_accrual_next_run_at)}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <Button variant="contained" onClick={handleSave} disabled={!dirty || saving}>
            {saving ? "Saving..." : dirty ? "Save leave settings" : "No changes to save"}
          </Button>
          <Button variant="text" onClick={loadSettings} disabled={loading || saving}>Reload</Button>
          {settings.updated_by_name && (
            <Typography variant="caption" color="text.secondary">
              Last updated by {settings.updated_by_name}{settings.updated_at ? ` on ${new Date(settings.updated_at).toLocaleString()}` : ""}
            </Typography>
          )}
        </Stack>
      </Stack>
    );
  };

  const renderBalancePoliciesBody = () => {
    if (policiesLoading || entitlementsLoading) {
      return (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (policiesError && !policies?.policies?.length) {
      return (
        <Stack spacing={2}>
          <Alert severity="error">{policiesError}</Alert>
          <Button variant="outlined" onClick={loadBalancePolicies}>Retry</Button>
        </Stack>
      );
    }

    const policyRows = policies?.policies || [];
    const entitlementByType = (entitlementPolicies?.policies || []).reduce((acc, policy) => {
      acc[policy.leave_type] = policy;
      return acc;
    }, {});

    return (
      <Stack spacing={3}>
        {policiesError && <Alert severity="error">{policiesError}</Alert>}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={800}>Leave allowances & balance rules</Typography>
            <Typography variant="body2" color="text.secondary">
              Set company allowance policies first, then keep advanced balance mechanics available for stricter teams.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setManagerSetupGuideOpen(true)}
            >
              Manager setup guide
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setBalancePolicyHelpOpen(true)}
            >
              Field guide
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" variant="outlined">
          Policy setup does not automatically give every employee a balance. Use Preview employee impact, then apply eligible rows when you want ledger-backed opening or front-load entries. Monthly and biweekly accrual policies are previewed here; actual accrual posting uses the Accrual preview / manual posting workflow.
        </Alert>

        <Grid container spacing={2}>
          {policyRows.map((policy) => {
            const entitlement = entitlementByType[policy.leave_type] || {};
            const isAccrualGrant = ["monthly_accrual", "biweekly_accrual"].includes(entitlement.grant_method);
            return (
            <Grid item xs={12} md={6} xl={4} key={policy.leave_type}>
              <Box
                sx={enterpriseCardSx}
              >
                <Stack spacing={1.75}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.25}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={900}>
                        {formatLeaveTypeLabel(policy.leave_type)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Company allowance and balance behavior
                      </Typography>
                    </Box>
                      <IconButton
                        size="small"
                        onClick={() => setLeaveTypeHelp(policy.leave_type)}
                        aria-label={`Open ${formatLeaveTypeLabel(policy.leave_type)} setup guide`}
                      >
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                  </Stack>

                  <Box
                    sx={{
                      px: 1.25,
                      py: 1.15,
                      borderRadius: 2,
                      bgcolor: "rgba(248, 250, 252, 0.72)",
                      border: "1px solid",
                      borderColor: "rgba(226, 232, 240, 0.9)",
                    }}
                  >
                    <Stack spacing={0.9}>
                      <Stack direction="row" spacing={0.65} alignItems="center" flexWrap="wrap" useFlexGap>
                        {getEntitlementSetupChips(entitlement, policy).map((chip) => (
                          <Chip
                            key={`${policy.leave_type}-${chip.label}`}
                            size="small"
                            sx={readableChipSx(chip.tone)}
                            label={chip.label}
                          />
                        ))}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {formatEntitlementSummary(entitlement, policy)} Grant method: {formatGrantMethodLabel(entitlement.grant_method || "opening_balance")}. Current employee balances are confirmed through Preview employee balance impact.
                      </Typography>
                    </Stack>
                  </Box>

                  <Box sx={policyGroupSx}>
                    <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 900, letterSpacing: 0.9 }}>
                        Core allowance settings
                      </Typography>
                    </Stack>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(entitlement.paid_entitlement_enabled)}
                          onChange={(event) => {
                            updateEntitlementPolicy(policy.leave_type, "enabled", event.target.checked);
                            updateEntitlementPolicy(policy.leave_type, "paid_entitlement_enabled", event.target.checked);
                            if (event.target.checked) updatePolicy(policy.leave_type, "balance_managed", true);
                          }}
                        />
                      }
                      label={fieldHelpLabel("Enable paid entitlement", leaveAllowanceFieldHelp.paidEntitlement)}
                      sx={{ mb: 0.5 }}
                    />
                  <Grid container spacing={1.5} sx={{ mt: 0.25 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label={fieldHelpLabel("Allowance amount", leaveAllowanceFieldHelp.allowanceAmount)}
                        value={entitlement.allowance_amount ?? 0}
                        onChange={(event) => updateEntitlementPolicy(policy.leave_type, "allowance_amount", event.target.value)}
                        inputProps={{ min: 0, step: "0.01" }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label={fieldHelpLabel("Unit", leaveAllowanceFieldHelp.allowanceUnit)}
                        value={entitlement.allowance_unit || "hours"}
                        onChange={(event) => updateEntitlementPolicy(policy.leave_type, "allowance_unit", event.target.value)}
                      >
                        {ALLOWANCE_UNIT_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{formatLeaveTypeLabel(option)}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label={fieldHelpLabel("Standard workday hours", leaveAllowanceFieldHelp.workdayHours)}
                        value={entitlement.workday_hours ?? 8}
                        onChange={(event) => updateEntitlementPolicy(policy.leave_type, "workday_hours", event.target.value)}
                        helperText="Used to convert days to hours"
                        inputProps={{ min: 0.25, max: 24, step: "0.25" }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label={fieldHelpLabel("Grant method", leaveAllowanceFieldHelp.grantMethod)}
                        value={entitlement.grant_method || "opening_balance"}
                        onChange={(event) => updateEntitlementPolicy(policy.leave_type, "grant_method", event.target.value)}
                      >
                        {ENTITLEMENT_GRANT_METHOD_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{formatGrantMethodLabel(option)}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      {isAccrualGrant && (
                        <Alert severity="warning" variant="outlined">
                          This policy accrues over time. Use Accrual preview / manual posting to create accrual ledger entries; entitlement apply will not create a fake opening balance.
                        </Alert>
                      )}
                    </Grid>
                  </Grid>
                  </Box>

                  <Box sx={policyGroupSx}>
                    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 900, letterSpacing: 0.9 }}>
                      Eligibility and new hire handling
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mt: 0.25 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label={fieldHelpLabel("Policy year basis", leaveAllowanceFieldHelp.policyYearBasis)}
                        value={entitlement.policy_year_basis || "calendar_year"}
                        onChange={(event) => updateEntitlementPolicy(policy.leave_type, "policy_year_basis", event.target.value)}
                      >
                        {POLICY_YEAR_BASIS_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{formatPolicyYearBasisLabel(option)}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    {entitlement.policy_year_basis === "company_policy_year" && (
                      <>
                        <Grid item xs={6} sm={3}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label={fieldHelpLabel("Start month", leaveAllowanceFieldHelp.policyYearStartMonth)}
                            value={entitlement.policy_year_start_month ?? 1}
                            onChange={(event) => updateEntitlementPolicy(policy.leave_type, "policy_year_start_month", event.target.value)}
                            inputProps={{ min: 1, max: 12 }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label={fieldHelpLabel("Start day", leaveAllowanceFieldHelp.policyYearStartDay)}
                            value={entitlement.policy_year_start_day ?? 1}
                            onChange={(event) => updateEntitlementPolicy(policy.leave_type, "policy_year_start_day", event.target.value)}
                            inputProps={{ min: 1, max: 31 }}
                          />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label={fieldHelpLabel("Start basis", leaveAllowanceFieldHelp.startBasis)}
                        value={entitlement.start_basis || "hire_date"}
                        onChange={(event) => updateEntitlementPolicy(policy.leave_type, "start_basis", event.target.value)}
                      >
                        {START_BASIS_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{formatStartBasisLabel(option)}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    {entitlement.start_basis === "custom_effective_date" && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          label={fieldHelpLabel("Custom effective date", leaveAllowanceFieldHelp.customEffectiveDate)}
                          InputLabelProps={{ shrink: true }}
                          value={entitlement.custom_effective_date || ""}
                          onChange={(event) => updateEntitlementPolicy(policy.leave_type, "custom_effective_date", event.target.value)}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label={fieldHelpLabel("Waiting period days", leaveAllowanceFieldHelp.waitingPeriod)}
                        value={entitlement.waiting_period_days ?? 0}
                        onChange={(event) => updateEntitlementPolicy(policy.leave_type, "waiting_period_days", event.target.value)}
                        helperText="Visible but unavailable until eligible"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label={fieldHelpLabel("New hire handling", leaveAllowanceFieldHelp.prorationMethod)}
                        value={entitlement.proration_method || "prorate_first_period"}
                        onChange={(event) => updateEntitlementPolicy(policy.leave_type, "proration_method", event.target.value)}
                      >
                        {PRORATION_METHOD_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{formatProrationMethodLabel(option)}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    {entitlement.proration_method === "cutoff_day" && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label={fieldHelpLabel("Cutoff day", leaveAllowanceFieldHelp.cutoffDay)}
                          value={entitlement.proration_cutoff_day ?? ""}
                          onChange={(event) => updateEntitlementPolicy(policy.leave_type, "proration_cutoff_day", event.target.value)}
                          inputProps={{ min: 1, max: 31 }}
                        />
                      </Grid>
                    )}
                  </Grid>
                  <Divider sx={{ my: 1.25 }} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(entitlement.applies_to_new_hires)}
                        onChange={(event) => updateEntitlementPolicy(policy.leave_type, "applies_to_new_hires", event.target.checked)}
                      />
                    }
                    label={fieldHelpLabel("Auto-apply to new hires", leaveAllowanceFieldHelp.appliesToNewHires)}
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Auto-apply affects future hires. Current employees are initialized through Preview employee balance impact.
                  </Typography>
                  </Box>

                  <Box sx={policyGroupSx}>
                    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 900, letterSpacing: 0.9 }}>
                      Approval guardrail
                    </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(policy.balance_managed)}
                        onChange={(event) => updatePolicy(policy.leave_type, "balance_managed", event.target.checked)}
                      />
                    }
                    label={fieldHelpLabel("Track balance usage", leaveAllowanceFieldHelp.balanceManaged)}
                  />
                  <Typography variant="caption" color="text.secondary">
                    When enabled, approved paid leave can deduct from this leave balance using the policy below. Payroll calculations remain separate.
                  </Typography>

                  <Grid container spacing={1.5} sx={{ mt: 0.25 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label={fieldHelpLabel("If balance is insufficient", leaveAllowanceFieldHelp.insufficientBalance)}
                        value={policy.insufficient_balance_mode || "warn"}
                        onChange={(event) => updatePolicy(policy.leave_type, "insufficient_balance_mode", event.target.value)}
                      >
                        {INSUFFICIENT_BALANCE_MODE_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{insufficientBalanceLabels[option] || formatLeaveTypeLabel(option)}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                  </Box>

                  <Accordion disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "rgba(148, 163, 184, 0.36)", borderRadius: 2, overflow: "hidden", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box>
                        <Typography variant="body2" fontWeight={850}>Advanced balance mechanics</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Balance deduction mechanics and saved accrual policy fields.
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1.5}>
                        <Grid container spacing={1.5}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label={fieldHelpLabel("Deduct balance", leaveAllowanceFieldHelp.deductOn)}
                              value={policy.deduct_on || "approval"}
                              onChange={(event) => updatePolicy(policy.leave_type, "deduct_on", event.target.value)}
                              helperText="Current active option"
                            >
                              <MenuItem value="approval">{deductOnLabels.approval}</MenuItem>
                            </TextField>
                          </Grid>
                        </Grid>

                        <Divider />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(policy.accrual_enabled)}
                        onChange={(event) => updatePolicy(policy.leave_type, "accrual_enabled", event.target.checked)}
                      />
                    }
                    label={fieldHelpLabel("Enable saved accrual policy", leaveAllowanceFieldHelp.accrualEnabled)}
                  />
                  <Typography variant="caption" color="text.secondary">
                    This stores the intended accrual policy. It does not create accrual ledger entries yet.
                  </Typography>

                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label={fieldHelpLabel("Accrual unit", leaveAllowanceFieldHelp.accrualUnit)}
                        value={policy.accrual_unit || "hours"}
                        onChange={(event) => updatePolicy(policy.leave_type, "accrual_unit", event.target.value)}
                      >
                        {ACCRUAL_UNIT_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{formatLeaveTypeLabel(option)}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label={fieldHelpLabel("Accrual rate", leaveAllowanceFieldHelp.accrualRate)}
                        value={policy.accrual_rate ?? 0}
                        onChange={(event) => updatePolicy(policy.leave_type, "accrual_rate", event.target.value)}
                        inputProps={{ min: 0, step: "0.01" }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label={fieldHelpLabel("Frequency", leaveAllowanceFieldHelp.accrualFrequency)}
                        value={policy.accrual_frequency || "none"}
                        onChange={(event) => updatePolicy(policy.leave_type, "accrual_frequency", event.target.value)}
                      >
                        {ACCRUAL_FREQUENCY_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{formatAccrualFrequencyLabel(option)}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label={fieldHelpLabel("Max balance hours", leaveAllowanceFieldHelp.maxBalance)}
                        value={policy.max_balance_hours ?? ""}
                        onChange={(event) => updatePolicy(policy.leave_type, "max_balance_hours", event.target.value)}
                        inputProps={{ min: 0, step: "0.01" }}
                        helperText="Optional future cap. Not enforced yet."
                      />
                    </Grid>
                  </Grid>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(policy.allow_negative_balance)}
                        onChange={(event) => updatePolicy(policy.leave_type, "allow_negative_balance", event.target.checked)}
                      />
                    }
                    label={fieldHelpLabel("Allow negative balance flag", leaveAllowanceFieldHelp.allowNegative)}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Saved for future balance-cap workflows. For approval behavior today, use “If balance is insufficient” above and choose “Allow negative balance.”
                  </Typography>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  {policy.updated_by_name && (
                    <Typography variant="caption" color="text.secondary">
                      Last updated by {policy.updated_by_name}{policy.updated_at ? ` on ${new Date(policy.updated_at).toLocaleString()}` : ""}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Grid>
            );
          })}
        </Grid>

        <Divider />

        <Box sx={{ border: "1px solid", borderColor: "rgba(148, 163, 184, 0.42)", borderRadius: 3, p: 2, bgcolor: "rgba(248, 250, 252, 0.62)" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: "stretch", md: "flex-start" }} sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={900}>Preview employee balance impact</Typography>
              <Typography variant="body2" color="text.secondary">
                Preview which employees would receive ledger-backed balances before applying anything. Existing balances and waiting periods are shown as skipped or blocked rows.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Policy setup does not automatically create balances for all current employees. Preview eligible employees first, then apply ledger-backed balances when ready.
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip size="small" label="Dry run first" sx={readableChipSx("primary")} />
              <Chip size="small" label="Ledger-backed apply" sx={readableChipSx("success")} />
            </Stack>
          </Stack>
          <Alert severity="info" variant="outlined" sx={{ mb: 1.5 }}>
            Auto-apply to new hires controls future employees. It does not initialize balances for employees who already exist today.
          </Alert>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Leave type"
                value={entitlementPreviewDraft.leave_type}
                onChange={(event) => setEntitlementPreviewDraft((prev) => ({ ...prev, leave_type: event.target.value }))}
              >
                {LEAVE_TYPE_OPTIONS.map((type) => (
                  <MenuItem key={type} value={type}>{formatLeaveTypeLabel(type)}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Department"
                value={entitlementPreviewDraft.department_id}
                onChange={(event) => setEntitlementPreviewDraft((prev) => ({ ...prev, department_id: event.target.value, recruiter_id: "" }))}
              >
                <MenuItem value="">All departments</MenuItem>
                {departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>{department.name || `Department #${department.id}`}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Employee"
                value={entitlementPreviewDraft.recruiter_id}
                onChange={(event) => setEntitlementPreviewDraft((prev) => ({ ...prev, recruiter_id: event.target.value }))}
              >
                <MenuItem value="">All employees</MenuItem>
                {employees
                  .filter((employee) => !entitlementPreviewDraft.department_id || String(employee.department_id || "") === String(entitlementPreviewDraft.department_id))
                  .map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.name || employee.full_name || employee.email || `Employee #${employee.id}`}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Apply mode"
                value={entitlementPreviewDraft.action_mode}
                onChange={(event) => setEntitlementPreviewDraft((prev) => ({ ...prev, action_mode: event.target.value }))}
              >
                <MenuItem value="initialize_missing_only">Initialize missing only</MenuItem>
                <MenuItem value="apply_selected_only">Apply previewed eligible rows</MenuItem>
              </TextField>
              <Typography variant="caption" color="text.secondary">
                Initialize missing only means employees with existing balance rows are skipped, not overwritten.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="As of date"
                InputLabelProps={{ shrink: true }}
                value={entitlementPreviewDraft.as_of_date}
                onChange={(event) => setEntitlementPreviewDraft((prev) => ({ ...prev, as_of_date: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Effective date"
                InputLabelProps={{ shrink: true }}
                value={entitlementPreviewDraft.effective_date}
                onChange={(event) => setEntitlementPreviewDraft((prev) => ({ ...prev, effective_date: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="contained" onClick={runEntitlementPreview} disabled={entitlementPreviewLoading}>
                  {entitlementPreviewLoading ? "Previewing..." : "Preview balance impact"}
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  disabled={!entitlementPreviewResult || postableEntitlementRows.length === 0 || entitlementPreviewLoading || entitlementApplyLoading}
                  onClick={() => setEntitlementApplyOpen(true)}
                >
                  Apply eligible rows
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {entitlementPreviewError && <Alert severity="error" sx={{ mt: 1.5 }}>{entitlementPreviewError}</Alert>}
          {entitlementApplyError && (
            <Alert severity={String(entitlementApplyError).includes("preview-only") ? "info" : "error"} sx={{ mt: 1.5 }}>
              {entitlementApplyError}
            </Alert>
          )}

          {entitlementPreviewResult && (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <Alert severity="success" variant="outlined">
                Preview complete. {entitlementPreviewResult.summary?.employees_postable || 0} employee(s) eligible for {formatHours(entitlementPreviewResult.summary?.total_proposed_ledger_delta_hours)}. No balances were changed.
              </Alert>
              <Grid container spacing={1.25}>
                <Grid item xs={12} sm={4}>
                  <Box sx={metricCellSx}>
                    <Typography variant="caption" color="text.secondary">Eligible employees</Typography>
                    <Typography variant="h6" fontWeight={900}>{entitlementPreviewResult.summary?.employees_postable || 0}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={metricCellSx}>
                    <Typography variant="caption" color="text.secondary">Skipped / blocked</Typography>
                    <Typography variant="h6" fontWeight={900}>{entitlementPreviewResult.summary?.employees_skipped || 0}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={metricCellSx}>
                    <Typography variant="caption" color="text.secondary">Proposed ledger hours</Typography>
                    <Typography variant="h6" fontWeight={900}>{formatHours(entitlementPreviewResult.summary?.total_proposed_ledger_delta_hours)}</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip size="small" sx={readableChipSx("success")} label={`Needs initialization: ${entitlementEnrollmentSummary.needsInitialization}`} />
                <Chip size="small" sx={readableChipSx("default")} label={`Already initialized: ${entitlementEnrollmentSummary.alreadyInitialized}`} />
                <Chip size="small" sx={readableChipSx("warning")} label={`Eligibility pending: ${entitlementEnrollmentSummary.eligibilityPending}`} />
                <Chip size="small" sx={readableChipSx(entitlementEnrollmentSummary.manualConflicts ? "warning" : "default")} label={`Manual conflicts: ${entitlementEnrollmentSummary.manualConflicts}`} />
                <Chip size="small" sx={readableChipSx("default")} label={`No action: ${entitlementEnrollmentSummary.noAction}`} />
              </Stack>
              {["monthly_accrual", "biweekly_accrual"].includes(entitlementPreviewResult.policy?.grant_method) && (
                <Alert severity="warning" variant="outlined">
                  This policy accrues over time. Use Accrual preview / manual posting below to create accrual ledger entries.
                </Alert>
              )}
              {entitlementPreviewResult.rows?.length ? (
                <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "rgba(15, 23, 42, 0.035)" }}>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Hire date</TableCell>
                        <TableCell>Eligibility</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell align="right">Current</TableCell>
                        <TableCell align="right">Period allowance</TableCell>
                        <TableCell align="right">Proposed</TableCell>
                        <TableCell align="right">Projected</TableCell>
                        <TableCell>Impact</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entitlementPreviewResult.rows.map((row) => (
                        <TableRow
                          key={`${row.recruiter_id}-${row.leave_type}-${row.period_start}`}
                          sx={{ "&:nth-of-type(even)": { bgcolor: "rgba(248, 250, 252, 0.72)" } }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{row.employee_name || `Employee #${row.recruiter_id}`}</Typography>
                          </TableCell>
                          <TableCell>{row.hire_date || "—"}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{row.eligible_now ? "Eligible" : "Not eligible"}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.eligibility_date || "No waiting period"}</Typography>
                          </TableCell>
                          <TableCell>{row.period_start || "—"} to {row.period_end || "—"}</TableCell>
                          <TableCell align="right">{formatHours(row.current_balance_hours)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{formatHours(row.allowance_hours)}</Typography>
                            {row.grant_period_allowance_hours != null && (
                              <Typography variant="caption" color="text.secondary">Period: {formatHours(row.grant_period_allowance_hours)}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{formatHours(row.proposed_ledger_delta_hours)}</TableCell>
                          <TableCell align="right">{formatHours(row.projected_balance_hours)}</TableCell>
                          <TableCell>
                            <Stack spacing={0.5} alignItems="flex-start">
                              {(() => {
                                const state = getEntitlementRowState(row);
                                return (
                                  <>
                                    <Chip
                                      size="small"
                                      sx={readableChipSx(state.tone)}
                                      label={state.label}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      {state.detail}
                                    </Typography>
                                  </>
                                );
                              })()}
                              <Chip
                                size="small"
                                sx={readableChipSx(entitlementImpactTone(row.impact_type, row.skipped))}
                                label={entitlementImpactLabels[row.impact_type] || String(row.impact_type || "No change").replace(/_/g, " ")}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {row.skipped ? `Reason: ${skipReasonLabel(row.skip_reason)}` : row.message}
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="warning" variant="outlined">No employees matched these filters.</Alert>
              )}
            </Stack>
          )}

          {entitlementApplyResult && (
            <Box sx={{ mt: 1.5, ...policyGroupSx, bgcolor: entitlementApplyResult.idempotent_replay ? "rgba(239, 246, 255, 0.74)" : "rgba(240, 253, 244, 0.76)" }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    sx={readableChipSx(entitlementApplyResult.idempotent_replay ? "primary" : "success")}
                    label={entitlementApplyResult.idempotent_replay ? "Idempotent replay" : "Ledger entries created"}
                  />
                  <Typography variant="subtitle2" fontWeight={900}>
                    {entitlementApplyResult.idempotent_replay
                      ? "This apply was already completed. No duplicate ledger entries were created."
                      : `Applied ${formatHours(entitlementApplyResult.summary?.total_posted_hours)} for ${entitlementApplyResult.summary?.employees_posted || 0} employee(s).`}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Payroll formulas were not changed. Review ledger history for employee-level balance audit details.
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <Button variant="contained" onClick={handleSavePolicies} disabled={(!policiesDirty && !entitlementsDirty) || policiesSaving}>
            {policiesSaving ? "Saving..." : (policiesDirty || entitlementsDirty) ? "Save allowances & rules" : "No policy changes to save"}
          </Button>
          <Button variant="text" onClick={loadBalancePolicies} disabled={policiesLoading || policiesSaving}>Reload</Button>
        </Stack>
      </Stack>
    );
  };

  const renderAccrualPreviewBody = () => (
    <Stack spacing={2}>
      <Alert severity="info" variant="outlined">
        This is a manual accrual workflow. The dry run simulates saved policy settings, and posting only happens after manager confirmation. It does not enforce scheduled eligibility, tenure, anniversary, carryover, expiry, or payroll calculations.
      </Alert>

      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Leave type"
            value={previewDraft.leave_type}
            onChange={(event) => setPreviewDraft((prev) => ({ ...prev, leave_type: event.target.value }))}
          >
            {LEAVE_TYPE_OPTIONS.map((type) => (
              <MenuItem key={type} value={type}>{formatLeaveTypeLabel(type)}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Department"
            value={previewDraft.department_id}
            onChange={(event) => setPreviewDraft((prev) => ({ ...prev, department_id: event.target.value, recruiter_id: "" }))}
          >
            <MenuItem value="">All departments</MenuItem>
            {departments.map((department) => (
              <MenuItem key={department.id} value={department.id}>{department.name || `Department #${department.id}`}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Employee"
            value={previewDraft.recruiter_id}
            onChange={(event) => setPreviewDraft((prev) => ({ ...prev, recruiter_id: event.target.value }))}
          >
            <MenuItem value="">All employees</MenuItem>
            {employees
              .filter((employee) => !previewDraft.department_id || String(employee.department_id || "") === String(previewDraft.department_id))
              .map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.name || employee.full_name || employee.email || `Employee #${employee.id}`}
                </MenuItem>
              ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="As of date"
            InputLabelProps={{ shrink: true }}
            value={previewDraft.as_of_date}
            onChange={(event) => setPreviewDraft((prev) => ({ ...prev, as_of_date: event.target.value }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Period start"
            InputLabelProps={{ shrink: true }}
            value={previewDraft.period_start}
            onChange={(event) => setPreviewDraft((prev) => ({ ...prev, period_start: event.target.value }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Period end"
            InputLabelProps={{ shrink: true }}
            value={previewDraft.period_end}
            onChange={(event) => setPreviewDraft((prev) => ({ ...prev, period_end: event.target.value }))}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" onClick={runAccrualPreview} disabled={previewLoading}>
              {previewLoading ? "Running preview..." : "Run dry run"}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              disabled={!previewResult || postablePreviewRows.length === 0 || previewLoading || postLoading}
              onClick={() => setPostConfirmOpen(true)}
            >
              Post accruals now
            </Button>
            <Button
              variant="text"
              disabled={previewLoading}
              onClick={() => {
                setPreviewDraft({ leave_type: "vacation", recruiter_id: "", department_id: "", as_of_date: "", period_start: "", period_end: "" });
                setPreviewResult(null);
                setPostResult(null);
                setPostError("");
                setPreviewError("");
              }}
            >
              Reset
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {previewError && <Alert severity="error">{previewError}</Alert>}
      {postError && <Alert severity="error">{postError}</Alert>}

      {previewResult && (
        <Stack spacing={1.5}>
          <Alert severity="success" variant="outlined">
            Dry run complete. {previewResult.summary?.employees_receiving_accrual || 0} employee(s) would receive {formatHours(previewResult.summary?.total_proposed_accrual_hours)}. No balances were changed.
          </Alert>
          <Grid container spacing={1}>
            <Grid item xs={6} sm={3}>
              <Chip label={`Considered: ${previewResult.summary?.employees_considered || 0}`} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Chip color="success" label={`Receiving: ${previewResult.summary?.employees_receiving_accrual || 0}`} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Chip color="warning" variant="outlined" label={`Skipped: ${previewResult.summary?.employees_skipped || 0}`} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Chip variant="outlined" label={`Capped: ${formatHours(previewResult.summary?.total_capped_hours)}`} />
            </Grid>
          </Grid>

          {previewResult.rows?.length ? (
            <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Current</TableCell>
                    <TableCell>Proposed</TableCell>
                    <TableCell>Projected</TableCell>
                    <TableCell>Cap</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewResult.rows.map((row) => (
                    <TableRow key={`${row.recruiter_id}-${row.leave_type}`}>
                      <TableCell>{row.employee_name || `Employee #${row.recruiter_id}`}</TableCell>
                      <TableCell>{formatHours(row.current_balance_hours)}</TableCell>
                      <TableCell>{formatHours(row.proposed_accrual_hours)}</TableCell>
                      <TableCell>{formatHours(row.projected_balance_hours)}</TableCell>
                      <TableCell>
                        {row.max_balance_applied
                          ? `Applied (${formatHours(row.capped_amount)} capped)`
                          : row.max_balance_hours != null
                          ? formatHours(row.max_balance_hours)
                          : "No cap"}
                      </TableCell>
                      <TableCell>
                        {row.skipped ? (
                          <Chip size="small" color="warning" variant="outlined" label={skipReasonLabel(row.skip_reason)} />
                        ) : (
                          <Chip size="small" color="success" label="Would accrue" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="warning" variant="outlined">
              No employees matched these filters.
            </Alert>
          )}
        </Stack>
      )}

      {postResult && (
        <Stack spacing={1}>
          <Alert severity={postResult.idempotent_replay ? "info" : "success"} variant="outlined">
            {postResult.idempotent_replay
              ? "This period/filter combination was already posted with the same posting key. Showing the existing ledger entries; no duplicate posting was created."
              : `Posted ${formatHours(postResult.summary?.total_posted_accrual_hours)} across ${postResult.summary?.employees_posted || 0} employee(s). Payroll formulas were not changed.`}
          </Alert>
          {postResult.rows?.length ? (
            <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Posted</TableCell>
                    <TableCell>Projected</TableCell>
                    <TableCell>Ledger entry</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {postResult.rows.map((row) => (
                    <TableRow key={`${row.recruiter_id}-${row.created_ledger_entry_id || row.skip_reason || "skipped"}`}>
                      <TableCell>{row.employee_name || `Employee #${row.recruiter_id}`}</TableCell>
                      <TableCell>{formatHours(row.posted_accrual_hours)}</TableCell>
                      <TableCell>{formatHours(row.projected_balance_hours)}</TableCell>
                      <TableCell>{row.created_ledger_entry_id || "—"}</TableCell>
                      <TableCell>
                        {row.skipped ? (
                          <Chip size="small" color="warning" variant="outlined" label={skipReasonLabel(row.skip_reason)} />
                        ) : (
                          <Chip size="small" color="success" label="Posted" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Stack>
      )}
    </Stack>
  );

  const renderAccrualRunHistoryBody = () => (
    <Stack spacing={2}>
      <Alert severity="info" variant="outlined">
        This shows accrual posting records from manual posting and scheduled automation. It does not change payroll formulas.
      </Alert>
      {accrualRunsError && <Alert severity="error">{accrualRunsError}</Alert>}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1}>
        <Typography variant="body2" color="text.secondary">
          Showing the most recent {accrualRuns.length} accrual run(s).
        </Typography>
        <Button variant="outlined" size="small" onClick={loadAccrualRuns} disabled={accrualRunsLoading}>
          {accrualRunsLoading ? "Refreshing..." : "Refresh history"}
        </Button>
      </Stack>
      {accrualRunsLoading ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={24} />
        </Box>
      ) : accrualRuns.length ? (
        <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Leave type</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Trigger</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Posted hours</TableCell>
                <TableCell>Skipped rows</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell align="right">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accrualRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{formatLeaveTypeLabel(run.leave_type)}</TableCell>
                  <TableCell>{run.period_start || "—"} to {run.period_end || "—"}</TableCell>
                  <TableCell>{formatAccrualTriggerLabel(run.trigger_type)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={accrualRunStatusColors[run.status] || "default"}
                      variant={run.status === "skipped" ? "outlined" : "filled"}
                      label={accrualRunStatusLabels[run.status] || formatLeaveTypeLabel(run.status)}
                    />
                  </TableCell>
                  <TableCell>{formatHours(run.summary?.total_posted_accrual_hours)}</TableCell>
                  <TableCell>{run.summary?.employees_skipped ?? "—"}</TableCell>
                  <TableCell>{formatDateTime(run.started_at)}</TableCell>
                  <TableCell>{formatDateTime(run.completed_at)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openAccrualRunDetail(run)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" variant="outlined">
          No accrual posting runs have been recorded yet. Manual dry run/posting is available above. Scheduled automation only posts for companies that explicitly opt in.
        </Alert>
      )}
    </Stack>
  );

  const renderAccrualRunHistorySummary = () => (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
        <Box>
          <Typography variant="subtitle2" fontWeight={800}>Accrual posting history</Typography>
          <Typography variant="body2" color="text.secondary">
            View past manual posting runs and future scheduled automation runs in one place.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => {
            setAccrualHistoryOpen(true);
            loadAccrualRuns();
          }}
        >
          View history
        </Button>
      </Stack>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block">Recent runs loaded</Typography>
            <Typography variant="h6" fontWeight={800}>{accrualRunsLoading ? "..." : accrualRuns.length}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block">Last run</Typography>
            <Typography variant="body2" fontWeight={700}>
              {latestAccrualRun ? formatDateTime(latestAccrualRun.completed_at || latestAccrualRun.started_at) : "No runs yet"}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block">Last trigger</Typography>
            <Typography variant="body2" fontWeight={700}>
              {latestAccrualRun ? formatAccrualTriggerLabel(latestAccrualRun.trigger_type) : "Not available"}
            </Typography>
          </Box>
        </Grid>
      </Grid>
      {!accrualRunsLoading && !accrualRuns.length && (
        <Alert severity="info" variant="outlined">
          No accrual posting runs yet. Manual dry run/posting is available above. Scheduled automation only posts for companies that explicitly opt in.
        </Alert>
      )}
      {accrualRunsError && <Alert severity="error">{accrualRunsError}</Alert>}
    </Stack>
  );

  return (
    <Stack spacing={2}>
      <Box>
        <Tabs
          value={leaveAreaTab}
          onChange={(_, value) => setLeaveAreaTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          <Tab value="settings" label="Leave Settings" />
          <Tab value="insights" label="Leave Insights" />
          <Tab value="operations" label="Leave Operations" />
        </Tabs>
        {leaveAreaTab === "settings" ? (
          <Stack spacing={2}>
            <SectionCard
              title={
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={800}>Leave settings</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<HelpOutlineIcon />}
                    onClick={() => setHelpOpen(true)}
                  >
                    Explain settings
                  </Button>
                </Stack>
              }
              description="Configure lightweight company defaults for leave requests, scheduling warnings, documentation expectations, and payroll readiness."
            >
              {renderBody()}
            </SectionCard>
            <SectionCard
              title="Leave allowances & balance rules"
              description="Configure company allowances, employee balance behavior, and advanced mechanics by leave type without changing payroll formulas."
            >
              {renderBalancePoliciesBody()}
            </SectionCard>
            <SectionCard
              title="Accrual preview / manual posting"
              description="Preview policy-based accruals, then optionally post them manually. This is not scheduled automation."
            >
              {renderAccrualPreviewBody()}
            </SectionCard>
            <SectionCard
              title="Accrual posting history"
              description="A compact audit summary. Open the drawer for row-level history and linked ledger entries."
            >
              {renderAccrualRunHistorySummary()}
            </SectionCard>
          </Stack>
        ) : leaveAreaTab === "insights" ? (
          <SettingsLeaveInsights onOpenOperations={() => setLeaveAreaTab("operations")} />
        ) : (
          <SettingsLeaveInsights mode="operations" />
        )}
      </Box>
      {leaveAreaTab === "settings" && (hasSettingsDraftChanges || hasPolicyDraftChanges) && (
        <Alert
          severity="info"
          variant="filled"
          sx={{
            position: "fixed",
            right: { xs: 12, md: 24 },
            bottom: { xs: 12, md: 24 },
            zIndex: (theme) => theme.zIndex.snackbar + 2,
            width: { xs: "calc(100% - 24px)", sm: 430, md: 540 },
            borderRadius: 3,
            boxShadow: "0 22px 54px rgba(15, 23, 42, 0.28)",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Stack spacing={1.25}>
            <Box>
              <Typography variant="subtitle2" fontWeight={900}>
                Unsaved leave changes
              </Typography>
              <Typography variant="body2">
                Save now to make draft settings active. Profile defaults and allowance rules do not apply until saved.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                fullWidth
                variant="contained"
                color="inherit"
                onClick={handleSave}
                disabled={!hasSettingsDraftChanges || saving}
                sx={{ color: "#0f172a", bgcolor: "common.white", "&:hover": { bgcolor: "#f8fafc" } }}
              >
                {saving ? "Saving..." : "Save leave settings"}
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="inherit"
                onClick={handleSavePolicies}
                disabled={!hasPolicyDraftChanges || policiesSaving}
                sx={{ color: "#0f172a", bgcolor: "common.white", "&:hover": { bgcolor: "#f8fafc" } }}
              >
                {policiesSaving ? "Saving..." : "Save allowances & rules"}
              </Button>
            </Stack>
          </Stack>
        </Alert>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={7000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          variant="filled"
          sx={{
            width: "100%",
            minWidth: { xs: "auto", sm: 520 },
            fontSize: 15,
            fontWeight: 800,
            boxShadow: "0 14px 34px rgba(15, 23, 42, 0.22)",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Dialog open={postConfirmOpen} onClose={() => !postLoading && setPostConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Post accruals now?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Alert severity="warning" variant="outlined">
              This will create real leave balance ledger entries. It does not change payroll formulas and does not schedule future automation.
            </Alert>
            <Alert severity="info" variant="outlined">
              The posting key is built from the selected leave type, employee/department filters, and period dates. Reusing the same key for the same period replays the previous posting instead of creating duplicates.
            </Alert>
            <Typography variant="body2">
              Employees affected: <strong>{postablePreviewRows.length}</strong>
            </Typography>
            <Typography variant="body2">
              Total hours to post: <strong>{formatHours(previewResult?.summary?.total_proposed_accrual_hours)}</strong>
            </Typography>
            <Typography variant="body2">
              Skipped rows: <strong>{previewResult?.summary?.employees_skipped || 0}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Posting key: {buildPostingKey(previewDraft)}
            </Typography>
            {postError && <Alert severity="error">{postError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostConfirmOpen(false)} disabled={postLoading}>Cancel</Button>
          <Button color="warning" variant="contained" onClick={postAccruals} disabled={postLoading}>
            {postLoading ? "Posting..." : "Confirm and post"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={entitlementApplyOpen} onClose={() => !entitlementApplyLoading && setEntitlementApplyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply entitlement balances?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Alert severity="warning" variant="outlined">
              This creates real leave balance ledger entries for eligible rows only. Review the totals before confirming; payroll formulas are not changed.
            </Alert>
            {["monthly_accrual", "biweekly_accrual"].includes(entitlementPreviewResult?.policy?.grant_method) ? (
              <Alert severity="info" variant="outlined">
                This policy accrues over time, so entitlement apply is preview-only. Use Accrual preview / manual posting to create accrual ledger entries.
              </Alert>
            ) : (
              <>
                <Grid container spacing={1.25}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={metricCellSx}>
                      <Typography variant="caption" color="text.secondary">Eligible</Typography>
                      <Typography variant="h6" fontWeight={900}>{postableEntitlementRows.length}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={metricCellSx}>
                      <Typography variant="caption" color="text.secondary">Hours to apply</Typography>
                      <Typography variant="h6" fontWeight={900}>{formatHours(entitlementPreviewResult?.summary?.total_proposed_ledger_delta_hours)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={metricCellSx}>
                      <Typography variant="caption" color="text.secondary">Skipped</Typography>
                      <Typography variant="h6" fontWeight={900}>{entitlementPreviewResult?.summary?.employees_skipped || 0}</Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary">
                  Existing balance rows are skipped by default; manual balance conflicts remain visible in the preview.
                </Typography>
              </>
            )}
            {entitlementApplyError && <Alert severity="error">{entitlementApplyError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntitlementApplyOpen(false)} disabled={entitlementApplyLoading}>Cancel</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={applyEntitlements}
            disabled={entitlementApplyLoading || ["monthly_accrual", "biweekly_accrual"].includes(entitlementPreviewResult?.policy?.grant_method)}
          >
            {entitlementApplyLoading ? "Applying..." : "Confirm and apply"}
          </Button>
        </DialogActions>
      </Dialog>
      <Drawer
        anchor="right"
        open={accrualHistoryOpen}
        onClose={() => setAccrualHistoryOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", md: 960 }, p: 2.5 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Accrual posting history</Typography>
              <Typography variant="body2" color="text.secondary">
                Manual posting and scheduled automation records. Payroll formulas are not affected.
              </Typography>
            </Box>
            <IconButton onClick={() => setAccrualHistoryOpen(false)}><CloseIcon /></IconButton>
          </Stack>
          {renderAccrualRunHistoryBody()}
        </Stack>
      </Drawer>
      <Drawer
        anchor="right"
        open={Boolean(selectedRun)}
        onClose={() => {
          setSelectedRun(null);
          setSelectedRunError("");
        }}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 720 }, p: 2.5 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Accrual run details</Typography>
              <Typography variant="body2" color="text.secondary">
                Row-level balance posting results. Payroll formulas are not affected.
              </Typography>
            </Box>
            <IconButton onClick={() => setSelectedRun(null)}><CloseIcon /></IconButton>
          </Stack>
          {selectedRunLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={24} />
            </Box>
          ) : selectedRun ? (
            <Stack spacing={2}>
              {selectedRunError && <Alert severity="error">{selectedRunError}</Alert>}
              {selectedRun.error_message && <Alert severity="error">{selectedRun.error_message}</Alert>}
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Leave type</Typography>
                  <Typography variant="body2" fontWeight={700}>{formatLeaveTypeLabel(selectedRun.leave_type)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      color={accrualRunStatusColors[selectedRun.status] || "default"}
                      variant={selectedRun.status === "skipped" ? "outlined" : "filled"}
                      label={accrualRunStatusLabels[selectedRun.status] || formatLeaveTypeLabel(selectedRun.status)}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Period</Typography>
                  <Typography variant="body2" fontWeight={700}>{selectedRun.period_start || "—"} to {selectedRun.period_end || "—"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Trigger</Typography>
                  <Typography variant="body2" fontWeight={700}>{formatAccrualTriggerLabel(selectedRun.trigger_type)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Idempotency key</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ wordBreak: "break-word" }}>{selectedRun.idempotency_key || "—"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Started</Typography>
                  <Typography variant="body2" fontWeight={700}>{formatDateTime(selectedRun.started_at)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Completed</Typography>
                  <Typography variant="body2" fontWeight={700}>{formatDateTime(selectedRun.completed_at)}</Typography>
                </Grid>
              </Grid>
              <Grid container spacing={1}>
                <Grid item xs={6} sm={3}>
                  <Chip label={`Posted: ${formatHours(selectedRun.summary?.total_posted_accrual_hours)}`} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip variant="outlined" label={`Capped: ${formatHours(selectedRun.summary?.total_capped_hours)}`} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip color="success" label={`Rows posted: ${selectedRun.summary?.employees_posted || 0}`} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip color="warning" variant="outlined" label={`Skipped: ${selectedRun.summary?.employees_skipped || 0}`} />
                </Grid>
              </Grid>
              {selectedRun.rows?.length ? (
                <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Posted</TableCell>
                        <TableCell>Projected</TableCell>
                        <TableCell>Cap</TableCell>
                        <TableCell>Ledger</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedRun.rows.map((row) => (
                        <TableRow key={row.id || `${row.recruiter_id}-${row.ledger_entry_id || row.skip_reason}`}>
                          <TableCell>{row.employee_name || `Employee #${row.recruiter_id}`}</TableCell>
                          <TableCell>{formatHours(row.posted_accrual_hours)}</TableCell>
                          <TableCell>{formatHours(row.projected_balance_hours)}</TableCell>
                          <TableCell>{row.max_balance_applied ? `${formatHours(row.capped_amount)} capped` : "No cap"}</TableCell>
                          <TableCell>{row.ledger_entry_id || "—"}</TableCell>
                          <TableCell>
                            {row.skipped ? (
                              <Chip size="small" color="warning" variant="outlined" label={skipReasonLabel(row.skip_reason)} />
                            ) : (
                              <Chip size="small" color="success" label="Posted" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" variant="outlined">No row-level results were recorded for this run.</Alert>
              )}
            </Stack>
          ) : null}
        </Stack>
      </Drawer>
      <Drawer
        anchor="right"
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 520 }, p: 2.5 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Leave Settings Guide</Typography>
              <Typography variant="body2" color="text.secondary">
                Operational guide for configuring company time-off, balance, Smart Shift, and payroll-readiness controls.
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setHelpOpen(false)} aria-label="Close leave settings guide">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Alert severity="info" variant="outlined">
            These settings help shape leave workflows. They do not change payroll formulas, and existing approved leave keeps its stored values.
          </Alert>

          <HelpSection title="Setup profiles" status="Draft helper" statusColor="default">
            <Typography variant="body2">
              Setup profiles are recommended starting points, not locked company modes. Applying one updates the editable draft only; managers still review and save changes.
            </Typography>
            <Typography variant="body2">
              Simple keeps most balance and automation work manual. Standard is the balanced operating setup for growing teams. Advanced turns on stronger review defaults and more balance-managed leave types without changing payroll formulas.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Leave request options" status="Active now" statusColor="success">
            <Typography variant="body2">
              Controls which request types the company wants to support: full-day, hourly, partial-day, multi-day, and shift-linked leave.
            </Typography>
            <Typography variant="body2">
              Example: use hourly leave for “2 hours sick time”; use partial-day with start/end time for “doctor appointment from 10:00 to 12:00.”
            </Typography>
            <Typography variant="body2">
              Employee paid/unpaid selection controls whether employees can mark a request paid or unpaid. Managers still confirm payroll-safe details during review.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Day counting" status="Advanced" statusColor="warning">
            <Typography variant="body2">
              The default day-count strategy is used for future leave calculations when exact approved hours are not already stored.
            </Typography>
            <Typography variant="body2">
              Business days only is safest for most SMB teams because weekends do not silently count unless configured.
            </Typography>
            <Typography variant="body2">
              Example: Friday to Monday counts Friday and Monday with business-days logic, but can count all calendar days if your company policy requires it.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Smart Shift behavior" status="Active now" statusColor="success">
            <Typography variant="body2">
              Smart Shift uses these settings when a suggested or applied shift overlaps leave.
            </Typography>
            <Typography variant="body2">
              Warn means the manager can continue but sees a warning. Block means Smart Shift prevents the conflicting assignment. Ignore means Smart Shift does not consider that leave status.
            </Typography>
            <Typography variant="body2">
              Recommended default: approved leave blocks; pending leave warns.
            </Typography>
            <Typography variant="body2">
              Example: if pending vacation is set to warn, Smart Shift may still suggest the employee but labels the conflict before apply.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Documentation" status="Active metadata / policy expectation" statusColor="warning">
            <Typography variant="body2">
              Attachment-required leave types record your company expectation for supporting documents.
            </Typography>
            <Typography variant="body2">
              Employees can upload a single supporting document on leave requests where allowed. This setting records which leave types should normally require documentation, but it does not create a full document enforcement workflow by itself.
            </Typography>
            <Typography variant="body2">
              Example: mark Sick as requiring documentation if managers should ask for a note when appropriate.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Payroll readiness" status="Active now" statusColor="success">
            <Typography variant="body2">
              Ready for payroll means the leave has approved, payroll-safe hours. Estimated leave can be shown to managers but should not silently become finalized payroll truth.
            </Typography>
            <Typography variant="body2">
              Requiring manager-confirmed hours keeps payroll safer for partial-day, hourly, or unusual leave requests.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Leave balance usage" status="Active when enabled" statusColor="success">
            <Typography variant="body2">
              Track balance usage makes a leave type operational for approval-time balance checks and ledger deductions.
            </Typography>
            <Typography variant="body2">
              Example: if Vacation is balance-managed and the employee has 10h available, approving 8h of paid vacation deducts 8h from their vacation ledger.
            </Typography>
            <Typography variant="body2">
              If balance is insufficient, managers can be warned, blocked, limited to the available paid hours, or allowed to create a negative balance based on your saved rule.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Leave accrual policies" status="Manual posting active" statusColor="warning">
            <Typography variant="body2">
              Accrual policy settings support dry-run previews and manager-confirmed manual posting into the leave balance ledger.
            </Typography>
            <Typography variant="body2">
              Scheduled automation can be opted into separately, but automation remains off by default and only changes leave balances for opted-in companies.
            </Typography>
            <Typography variant="body2">
              Balance and accrual policy settings do not change payroll calculations.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Bookings and availability guardrails" status="Operational safety" statusColor="success">
            <Typography variant="body2">
              Active client bookings are protected before approval. If an employee has a booked appointment during the requested leave window, the manager must cancel, reschedule, or reassign that booking before approving leave.
            </Typography>
            <Typography variant="body2">
              Availability is handled differently. If availability already exists when leave is approved, approval can still succeed, but managers see a warning so they can review those slots.
            </Typography>
            <Typography variant="body2">
              After leave is approved, managers cannot create or move availability into that approved leave window. Existing availability is kept for audit and shown as blocked by approved leave.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Shift-side time off and calendar visibility" status="Manager shortcut" statusColor="primary">
            <Typography variant="body2">
              Managers can mark a scheduled shift as time off from the Edit Shift modal. This creates an approved leave record through the same leave pipeline and removes the shift from active scheduling.
            </Typography>
            <Typography variant="body2">
              Delete shift only remains scheduling-only. It does not create leave, deduct balances, or create payroll-ready leave hours.
            </Typography>
            <Typography variant="body2">
              When Show time off on calendar is enabled, approved schedule-context time off appears as a distinct non-work item. Clicking it opens a read-only leave detail view instead of the editable shift modal.
            </Typography>
          </HelpSection>
        </Stack>
      </Drawer>
      <Drawer
        anchor="right"
        open={managerSetupGuideOpen}
        onClose={() => setManagerSetupGuideOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 680 }, p: 2.5 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Manager setup guide</Typography>
              <Typography variant="body2" color="text.secondary">
                Practical guidance for choosing balance rules, shortage handling, and accrual defaults by leave type.
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setManagerSetupGuideOpen(false)} aria-label="Close manager setup guide">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Alert severity="info" variant="outlined">
            Use this guide as a manager-friendly starting point. These recommendations do not change payroll formulas, and every setting remains editable.
          </Alert>

          <HelpSection title="A simple mental model" status="How to decide" statusColor="primary">
            <Typography variant="body2">
              Track balance usage means this leave type should use a tracked balance. If balance is insufficient controls what happens when an employee requests more paid time than they have.
            </Typography>
            <Typography variant="body2">
              Deduct balance controls when the balance decreases. Enable saved accrual policy stores the intended earning rules for manual accrual preview/posting and future automation setup.
            </Typography>
            <Typography variant="body2">
              Payroll remains separate: these settings affect leave balances and manager decisions, not payroll formulas.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="How leave interacts with bookings and availability" status="Manager workflow" statusColor="success">
            <Typography variant="body2">
              A booked client appointment is the strongest conflict. If an employee is booked with a client, leave approval is blocked until the booking is cancelled, rescheduled, or reassigned.
            </Typography>
            <Typography variant="body2">
              Availability slots are softer operational intent. Existing availability during approved leave stays visible and is flagged for the manager, but it is not deleted automatically.
            </Typography>
            <Typography variant="body2">
              Once leave is approved, new manager-created availability over that leave is blocked. This prevents blind availability from being published over known time off.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Small-team shortcut from shifts" status="SMB-friendly" statusColor="primary">
            <Typography variant="body2">
              For simple teams, managers can use Edit Shift to mark a scheduled shift as time off instead of asking the employee to submit a request first.
            </Typography>
            <Typography variant="body2">
              This still creates a real approved leave record underneath, so reports, payroll readiness, balances, warnings, and calendar visibility stay connected to the same source of truth.
            </Typography>
            <Typography variant="body2">
              If the manager only wants to remove schedule coverage without recording time off, use Delete shift only.
            </Typography>
          </HelpSection>

          <Divider />

          {managerSetupLeaveGuides.map((guide) => (
            <React.Fragment key={guide.title}>
              <HelpSection title={guide.title} status={guide.subtitle} statusColor="default">
                <Typography variant="body2">{guide.overview}</Typography>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Best starting point for most SMBs
                  </Typography>
                  <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, my: 0 }}>
                    {guide.best.map((item) => (
                      <Typography component="li" variant="body2" key={item}>{item}</Typography>
                    ))}
                  </Stack>
                </Box>
                <Typography variant="body2">
                  <strong>Why this is usually best:</strong> {guide.why}
                </Typography>
                <Typography variant="body2">
                  <strong>Example:</strong> {guide.example}
                </Typography>
                {guide.stricter && (
                  <Typography variant="body2">
                    <strong>When to be stricter:</strong> {guide.stricter}
                  </Typography>
                )}
                {guide.simpler && (
                  <Typography variant="body2">
                    <strong>When to simplify further:</strong> {guide.simpler}
                  </Typography>
                )}
                {guide.tracking && (
                  <Typography variant="body2">
                    <strong>When to turn tracking on:</strong> {guide.tracking}
                  </Typography>
                )}
                {guide.documentation && (
                  <Typography variant="body2">
                    <strong>When to pair it with documentation:</strong> {guide.documentation}
                  </Typography>
                )}
              </HelpSection>
              <Divider />
            </React.Fragment>
          ))}

          <HelpSection title="What each setting means in practice" status="Field meanings" statusColor="primary">
            <Stack spacing={1}>
              {managerSetupSettingGuide.map((item) => (
                <Box key={item.title}>
                  <Typography variant="body2" fontWeight={800}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.body}</Typography>
                </Box>
              ))}
            </Stack>
          </HelpSection>

          <Divider />

          <HelpSection title="Recommended manager-friendly starting setup" status="Profiles" statusColor="success">
            <Typography variant="body2">
              <strong>Simple teams:</strong> Vacation tracked; Sick and Personal optional; Emergency, Family / Parental, and Compassionate usually manual; Warn manager for shortages; Deduct on approval; saved accrual policy Off or Vacation only; automation Off.
            </Typography>
            <Typography variant="body2">
              <strong>Standard teams:</strong> Vacation and Sick tracked; Personal optional; Emergency, Family / Parental, and Compassionate mostly manual; Warn manager; Deduct on approval; saved accrual policy for Vacation and maybe Sick; automation Off.
            </Typography>
            <Typography variant="body2">
              <strong>Advanced teams:</strong> Vacation and Sick tracked; Personal tracked if needed; Compassionate tracked only if intentionally formalized; Block approval or Approve available paid hours only for shortages; saved accrual policy On for tracked leave types; automation still Off by default until ready.
            </Typography>
          </HelpSection>

          <Alert severity="info" variant="outlined">
            These are recommended starting values, not hard rules. Managers can still adjust every setting to match the company's real leave policy.
          </Alert>
        </Stack>
      </Drawer>
      <Drawer
        anchor="right"
        open={balancePolicyHelpOpen}
        onClose={() => setBalancePolicyHelpOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 620 }, p: 2.5 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Leave balance policy guide</Typography>
              <Typography variant="body2" color="text.secondary">
                Understand balance-managed leave, shortage handling, accrual setup, and recommended starting values.
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setBalancePolicyHelpOpen(false)} aria-label="Close leave balance policy guide">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <HelpSection title="What this section is for" status="Overview" statusColor="default">
            <Typography variant="body2">
              Leave balance policies let managers decide whether a leave type should use a tracked balance and how the system should behave when an employee requests more paid time than is available.
            </Typography>
            <Typography variant="body2">
              This section is mainly for leave types like Vacation, Sick, and Personal. It is less commonly needed for leave types like Emergency, Family / Parental, or Compassionate unless the business intentionally wants to track them with a balance too.
            </Typography>
            <Alert severity="info" variant="outlined">
              These settings do not change payroll formulas. Balance-managed leave affects leave balance behavior, not payroll calculation rules. Saved accrual policy fields support manual accrual preview/posting and future automation setup, but automation should normally remain off until the company is ready.
            </Alert>
          </HelpSection>

          <Divider />

          <HelpSection title="Track balance usage" status="Active when enabled" statusColor="success">
            <Typography variant="body2">
              When enabled, approved paid leave can deduct from the employee's balance for this leave type.
            </Typography>
            <Typography variant="body2">
              Use this for leave types where the employee should have a measurable entitlement, such as Vacation, Sick, or Personal leave. Leave it off when the business handles that leave type case-by-case and does not want tracked entitlements.
            </Typography>
            <Typography variant="body2">
              Example: An employee has 16 hours of vacation balance. They request 8 paid vacation hours. If balance usage is enabled and the request is approved, the system can deduct those 8 hours from the vacation balance.
            </Typography>
            <Typography variant="body2">
              Recommended: Vacation usually On, Sick often On, Personal depends on policy, and Emergency / Family / Compassionate often Off unless explicitly tracked.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="If balance is insufficient" status="Active when enabled" statusColor="success">
            <Typography variant="body2">
              This controls what happens when an employee requests more paid leave than their available balance.
            </Typography>
            <Typography variant="body2">
              Warn manager: the manager can still approve, but sees a warning. Best for growing teams and companies that want flexibility.
            </Typography>
            <Typography variant="body2">
              Block approval: the request cannot be approved as paid leave if there is not enough balance. Best for larger teams or stricter policy environments.
            </Typography>
            <Typography variant="body2">
              Allow negative: approval can proceed and the balance can go below zero. Use only if the company clearly allows borrowing against future entitlement.
            </Typography>
            <Typography variant="body2">
              Approve available paid hours only: the system only approves the paid portion that is available and leaves the rest for unpaid/manual handling.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Deduct balance" status="Active now" statusColor="success">
            <Typography variant="body2">
              This controls when the balance is deducted. The current active option is On approval.
            </Typography>
            <Typography variant="body2">
              On approval is usually best because requests do not change balances until a manager confirms them.
            </Typography>
            <Typography variant="body2">
              Example: An employee submits leave today, but the balance is only deducted after manager approval.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Enable saved accrual policy" status="Manual posting setup" statusColor="warning">
            <Typography variant="body2">
              This turns on the saved accrual policy configuration for that leave type.
            </Typography>
            <Typography variant="body2">
              It does not automatically create ledger entries by itself. It stores the intended accrual setup for manual accrual preview/posting and future scheduled automation.
            </Typography>
            <Typography variant="body2">
              Use this when the company wants this leave type to accumulate over time, such as vacation earned monthly or sick hours earned periodically. Leave it off if managers only want manual adjustments.
            </Typography>
            <Typography variant="body2">
              Recommended: smaller/simple teams often Off; standard/advanced teams often On for Vacation and sometimes Sick.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Accrual unit" status="Current unit" statusColor="default">
            <Typography variant="body2">
              This is the unit used for the accrual amount. Recommended starting point: Hours.
            </Typography>
            <Typography variant="body2">
              Hours are usually better because they are easier for payroll-ready operations, better for partial-day and hourly leave, and more flexible for part-time and full-time employees.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Accrual rate" status="Policy value" statusColor="default">
            <Typography variant="body2">
              This is how much balance is added each accrual period.
            </Typography>
            <Typography variant="body2">
              Example: If Accrual rate is 8 and Frequency is Monthly, the employee earns 8 hours each month.
            </Typography>
            <Typography variant="body2">
              Choose a rate that matches the company's internal leave policy. Start with a simple, explainable rate and avoid unnecessary complexity unless the business truly needs it.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Frequency" status="Policy cadence" statusColor="default">
            <Typography variant="body2">
              This is how often the balance accrues. Examples include Weekly, Biweekly, Monthly, or None.
            </Typography>
            <Typography variant="body2">
              Recommended starting point: Monthly for Vacation, sometimes Monthly for Sick, and None if the leave type is manual only.
            </Typography>
            <Typography variant="body2">
              Monthly is usually the easiest cadence for SMB teams because it is simple to understand and audit.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Max balance hours" status="Optional cap" statusColor="default">
            <Typography variant="body2">
              This is the maximum balance the employee can accumulate for that leave type.
            </Typography>
            <Typography variant="body2">
              Example: If the max balance is 120 hours and the employee already has 118 hours, a monthly accrual of 8 hours would be capped.
            </Typography>
            <Typography variant="body2">
              Use a cap if the business does not want leave balance to grow indefinitely. Leave it blank if the company is not ready to define a cap yet.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Allow negative balance flag" status="Future-oriented" statusColor="warning">
            <Typography variant="body2">
              This is a future-oriented flag for negative balance handling and cap workflows.
            </Typography>
            <Typography variant="body2">
              For today's approval workflow, managers should mainly use If balance is insufficient to control current behavior.
            </Typography>
            <Typography variant="body2">
              Recommended starting point: Off, unless there is a clear future policy reason to enable it.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Recommended starting points for Simple teams" status="Profile guidance" statusColor="default">
            <Typography variant="body2">Best for small or lighter-process teams.</Typography>
            <Typography variant="body2">
              Recommended: Vacation On, Sick Optional, others Off; insufficient balance warns manager; deduct on approval; saved accrual policy Off or Vacation only; accrual unit Hours; frequency None or Monthly for Vacation; max balance blank; negative balance Off.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Recommended starting points for Standard teams" status="Profile guidance" statusColor="default">
            <Typography variant="body2">Best for growing teams.</Typography>
            <Typography variant="body2">
              Recommended: Vacation On, Sick On, Personal Optional; insufficient balance warns manager; deduct on approval; saved accrual policy for Vacation and maybe Sick; accrual unit Hours; frequency Monthly; max balance blank or set if known; negative balance Off.
            </Typography>
          </HelpSection>

          <Divider />

          <HelpSection title="Recommended starting points for Advanced teams" status="Profile guidance" statusColor="default">
            <Typography variant="body2">Best for larger or stricter teams.</Typography>
            <Typography variant="body2">
              Recommended: Vacation On, Sick On, Personal On if tracked, Compassionate only if intentionally balance-managed; insufficient balance blocks approval or approves available paid hours only; deduct on approval; saved accrual policy On for tracked leave types; accrual unit Hours; frequency Monthly unless the company has a clear alternative; max balance set where policy requires it; negative balance usually Off unless explicitly allowed.
            </Typography>
          </HelpSection>
        </Stack>
      </Drawer>
      <Drawer
        anchor="right"
        open={Boolean(selectedLeaveTypeGuide)}
        onClose={() => setLeaveTypeHelp(null)}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 620 }, p: 2.5 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                {selectedLeaveTypeGuide?.title || "Leave type setup guide"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {leaveTypeHelp
                  ? `Recommended starting values for ${formatLeaveTypeLabel(leaveTypeHelp)}, plus when stricter or more flexible settings may be better.`
                  : "Recommended starting values for this leave type, plus when stricter or more flexible settings may be better."}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setLeaveTypeHelp(null)} aria-label="Close leave type setup guide">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Alert severity="info" variant="outlined">
            These are practical product recommendations for configuring company leave allowances and balance rules in Schedulaa. They do not replace legal, payroll, or HR compliance advice. Payroll formulas are not changed by these settings.
          </Alert>

          {selectedLeaveTypeGuide && (
            <Stack spacing={2}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1.5,
                  backgroundColor: "background.paper",
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Recommended posture for {formatLeaveTypeLabel(leaveTypeHelp)}
                </Typography>
                <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5 }}>
                  {selectedLeaveTypeGuide.guidance}
                </Typography>
              </Box>

              <HelpSection title={`${formatLeaveTypeLabel(leaveTypeHelp)} overview`} status="Use case" statusColor="default">
                <Typography variant="body2">{selectedLeaveTypeGuide.overview}</Typography>
              </HelpSection>

              <Divider />

              <HelpSection title="How this card is organized" status="New setup" statusColor="primary">
                <Typography variant="body2">
                  Start with the simple allowance fields: paid entitlement, allowance amount, unit, workday hours, grant method, policy year, hire-date start, waiting period, and proration.
                </Typography>
                <Typography variant="body2">
                  Use Advanced rules only when you need lower-level mechanics such as balance-managed deductions, saved accrual rate/frequency, max balance, or negative-balance behavior.
                </Typography>
                <Typography variant="body2">
                  Monthly and biweekly entitlement policies are preview-only in this setup flow. Use Accrual preview / manual posting to create real accrual ledger entries.
                </Typography>
              </HelpSection>

              <Divider />

              <HelpSection title={`Best starting point for ${formatLeaveTypeLabel(leaveTypeHelp)}`} status="Starting values" statusColor="success">
                <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, my: 0 }}>
                  {selectedLeaveTypeGuide.best.map((item) => (
                    <Typography component="li" variant="body2" key={item}>{item}</Typography>
                  ))}
                </Stack>
              </HelpSection>

              <Divider />

              <HelpSection title={`Why this works for ${formatLeaveTypeLabel(leaveTypeHelp)}`} status="Practical reason" statusColor="default">
                <Typography variant="body2">{selectedLeaveTypeGuide.why}</Typography>
              </HelpSection>

              {selectedLeaveTypeGuide.stricter && (
                <>
                  <Divider />
                  <HelpSection title="When to be stricter" status="Stricter teams" statusColor="warning">
                    <Typography variant="body2">{selectedLeaveTypeGuide.stricter}</Typography>
                  </HelpSection>
                </>
              )}

              {selectedLeaveTypeGuide.flexible && (
                <>
                  <Divider />
                  <HelpSection title="When to be more flexible" status="Flexible teams" statusColor="default">
                    <Typography variant="body2">{selectedLeaveTypeGuide.flexible}</Typography>
                  </HelpSection>
                </>
              )}

              {selectedLeaveTypeGuide.advanced && (
                <>
                  <Divider />
                  <HelpSection title="When to be more advanced" status="Advanced teams" statusColor="warning">
                    <Typography variant="body2">{selectedLeaveTypeGuide.advanced}</Typography>
                  </HelpSection>
                </>
              )}

              {selectedLeaveTypeGuide.simpler && (
                <>
                  <Divider />
                  <HelpSection title="When to be simpler" status="Manual option" statusColor="default">
                    <Typography variant="body2">{selectedLeaveTypeGuide.simpler}</Typography>
                  </HelpSection>
                </>
              )}

              {selectedLeaveTypeGuide.tracking && (
                <>
                  <Divider />
                  <HelpSection title="When to use balance tracking" status="Policy choice" statusColor="default">
                    <Typography variant="body2">{selectedLeaveTypeGuide.tracking}</Typography>
                  </HelpSection>
                </>
              )}

              {selectedLeaveTypeGuide.documentation && (
                <>
                  <Divider />
                  <HelpSection title="When to pair with documentation" status="Documentation" statusColor="warning">
                    <Typography variant="body2">{selectedLeaveTypeGuide.documentation}</Typography>
                  </HelpSection>
                </>
              )}

              <Divider />

                  <HelpSection title={`${formatLeaveTypeLabel(leaveTypeHelp)} example`} status="Example" statusColor="default">
                <Typography variant="body2">{selectedLeaveTypeGuide.example}</Typography>
              </HelpSection>

              <Divider />

              <HelpSection title={`${formatLeaveTypeLabel(leaveTypeHelp)} professional guidance`} status="Guidance" statusColor="default">
                <Typography variant="body2">{selectedLeaveTypeGuide.guidance}</Typography>
              </HelpSection>

              <Alert severity="info" variant="outlined">
                Recommended starting values should help managers begin safely, but every company can adjust these settings to match its real policy. These settings remain editable after setup and do not change payroll formulas.
              </Alert>
            </Stack>
          )}
        </Stack>
      </Drawer>
    </Stack>
  );
};

export default SettingsLeaveSettings;
