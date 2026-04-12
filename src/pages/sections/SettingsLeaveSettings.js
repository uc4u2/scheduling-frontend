import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  Typography,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CloseIcon from "@mui/icons-material/Close";
import SectionCard from "../../components/ui/SectionCard";
import SettingsLeaveInsights from "./SettingsLeaveInsights";
import { leaveSettings } from "../../utils/api";
import api from "../../utils/api";
import {
  LEAVE_TYPE_OPTIONS,
  ACCRUAL_FREQUENCY_OPTIONS,
  ACCRUAL_UNIT_OPTIONS,
  INSUFFICIENT_BALANCE_MODE_OPTIONS,
  buildLeaveBalancePolicyPatch,
  buildLeaveSettingsPatch,
  formatAccrualFrequencyLabel,
  formatLeaveTypeLabel,
  hasLeaveBalancePolicyChanges,
  hasLeaveSettingsChanges,
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

const setupProfiles = {
  simple: {
    label: "Simple",
    tagline: "Best for smaller or lighter-process teams that want safe manual controls.",
    description: "Keeps request options conservative, emphasizes manager review, and leaves balances/accruals mostly manual.",
    summary: [
      "Hourly and partial-day requests off by default; full-day, multi-day, and shift-linked leave remain available.",
      "Approved leave blocks Smart Shift; pending leave warns.",
      "Balance usage remains manual for all leave types.",
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
      require_manager_confirmed_hours_for_payroll_ready: true,
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
      "Sick leave is commonly used for illness, recovery, medical appointments, or short health-related absences. Many companies choose to track sick leave with a balance, but the right strictness depends on how formal their policy is.",
    best: [
      "Track balance usage: On",
      "If balance is insufficient: Warn manager",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Often Off at first, or On if the company has a defined sick accrual policy",
      "Accrual unit: Hours",
      "Frequency: None if managed manually, Monthly if the company accrues sick leave",
      "Max balance hours: Blank at first unless the company has a known cap",
      "Allow negative balance flag: Off",
    ],
    why:
      "This gives managers visibility and control without making the workflow too rigid. Sick leave often needs some flexibility because real health situations are not always predictable.",
    stricter:
      "Choose Block approval if the company has a tightly enforced sick balance policy and managers should not approve paid sick time beyond available balance.",
    flexible:
      "Choose Allow negative only if the company intentionally allows employees to borrow against future sick entitlement.",
    example:
      "An employee has 6 hours of sick balance and requests 8 paid sick hours. With Warn manager, the manager sees the shortage and can decide whether to approve, adjust, or handle the extra time another way.",
    guidance:
      "Sick leave is one of the most common leave types to balance-manage. Most growing teams start with Track balance usage On and Warn manager before moving to stricter enforcement later.",
  },
  vacation: {
    title: "Vacation setup guide",
    overview:
      "Vacation leave is the most common leave type to track with a balance. If a company uses any balance-managed leave at all, Vacation is usually the first and strongest candidate.",
    best: [
      "Track balance usage: On",
      "If balance is insufficient: Warn manager",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Often On once the company is ready to define vacation earning rules",
      "Accrual unit: Hours",
      "Frequency: Monthly is usually the best starting point if vacation accrues",
      "Max balance hours: Blank at first, then set a cap if the company policy requires one",
      "Allow negative balance flag: Off",
    ],
    why:
      "Vacation is usually planned in advance and easier to manage consistently than other leave types. This makes it a strong fit for balance tracking and later accrual setup.",
    stricter:
      "Choose Block approval for larger or stricter teams that do not want paid vacation approved beyond available balance.",
    advanced:
      "Use Approve available paid hours only if the company wants tighter control without fully blocking the manager workflow.",
    example:
      "An employee has 24 hours of vacation balance and requests 8 hours. With Track balance usage On and Deduct balance On approval, the balance reduces only after the manager approves.",
    guidance:
      "Vacation is usually the best leave type to track first. For most SMBs, this is the safest place to start with both balance tracking and later accrual policies.",
  },
  personal: {
    title: "Personal leave setup guide",
    overview:
      "Personal leave is often used for personal errands, family needs, short appointments, or discretionary personal time. Some companies track it formally, while others keep it more flexible.",
    best: [
      "Track balance usage: On",
      "If balance is insufficient: Warn manager",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Usually Off at first",
      "Accrual unit: Hours",
      "Frequency: None unless the company has a defined personal-time accrual policy",
      "Max balance hours: Blank",
      "Allow negative balance flag: Off",
    ],
    why:
      "Personal leave is often less formal than vacation. Warn manager gives flexibility while still helping managers see when a request exceeds the available balance.",
    stricter:
      "Choose Block approval if personal leave is formally limited and the company wants managers to enforce the policy consistently.",
    simpler:
      "Turn Track balance usage Off if personal leave is handled case-by-case and the company does not want to maintain a tracked entitlement.",
    example:
      "An employee has 2 hours of personal balance and requests 4 hours. With Warn manager, the manager sees the shortage but can still decide whether to approve as an exception.",
    guidance:
      "For many SMBs, Personal starts either as balance-managed with Warn manager or as fully manual. It is less commonly enforced as strictly as Vacation.",
  },
  emergency: {
    title: "Emergency leave setup guide",
    overview:
      "Emergency leave is usually used for unexpected personal situations that need immediate time away. Many companies do not track this as a formal balance unless they have a very specific policy.",
    best: [
      "Track balance usage: Off",
      "If balance is insufficient: Warn manager if balance tracking is enabled later",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Off",
      "Accrual unit: Hours if ever used",
      "Frequency: None",
      "Max balance hours: Blank",
      "Allow negative balance flag: Off",
    ],
    why:
      "Emergency leave is often handled case-by-case. A strict balance can be too rigid for unexpected situations, especially in smaller teams.",
    tracking:
      "Only enable Track balance usage if the company has a clearly defined emergency leave entitlement and wants it enforced consistently.",
    example:
      "An employee calls in with an urgent situation. Instead of relying on a tracked balance, the manager reviews the case directly and decides how to record it.",
    guidance:
      "Most SMBs leave Emergency as manual. If it becomes policy-heavy later, the company can turn balance tracking on with Warn manager before adopting stricter rules.",
  },
  family: {
    title: "Family / Parental leave setup guide",
    overview:
      "Family / Parental leave often involves longer absences, protected leave, or policy-heavy situations. Because this can overlap with legal and jurisdiction-specific rules, many companies avoid using simple balance tracking unless they have a very clear internal framework.",
    best: [
      "Track balance usage: Off",
      "If balance is insufficient: Warn manager if balance tracking is ever enabled",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Off",
      "Accrual unit: Hours if used internally",
      "Frequency: None",
      "Max balance hours: Blank",
      "Allow negative balance flag: Off",
    ],
    why:
      "This leave type often needs case-by-case manager/admin review and may depend on company policy or outside legal requirements. A simple tracked balance is often not the best first model.",
    tracking:
      "Only if the company has a clearly defined internal parental/family leave bank that managers are meant to track operationally.",
    example:
      "A manager reviews a family-related leave request with extra care because it may involve longer time ranges or specific company policy, rather than treating it like ordinary vacation.",
    guidance:
      "Most SMBs keep Family / Parental leave manual unless they have a mature HR policy and know exactly what balance behavior they want.",
  },
  compassionate: {
    title: "Compassionate leave setup guide",
    overview:
      "Compassionate leave is typically used for bereavement or serious family hardship situations. Some companies want it documented and tracked, while others prefer manager discretion.",
    best: [
      "Track balance usage: Usually Off or On only if the company has a defined compassionate leave entitlement",
      "If balance is insufficient: Warn manager if tracked",
      "Deduct balance: On approval",
      "Enable saved accrual policy: Usually Off",
      "Accrual unit: Hours",
      "Frequency: None unless policy clearly defines accrual",
      "Max balance hours: Blank",
      "Allow negative balance flag: Off",
    ],
    why:
      "Compassionate leave often needs empathy and manager judgment. A highly rigid balance policy can be too harsh unless the company has a very formal entitlement model.",
    tracking:
      "Turn Track balance usage On only if the company intentionally wants a measured compassionate leave bank.",
    documentation:
      "If the company expects supporting documentation for compassionate leave, make that expectation visible through the documentation settings, while still keeping manager judgment in review.",
    example:
      "An employee requests compassionate leave during a difficult family event. The manager may want policy guidance, but still needs room for discretion.",
    guidance:
      "Compassionate leave is often better as manual for smaller teams. Larger or more policy-heavy teams may track it, but should do so thoughtfully.",
  },
};

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [policiesSaving, setPoliciesSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
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
  const [leaveTypeHelp, setLeaveTypeHelp] = useState(null);
  const [selectedSetupProfile, setSelectedSetupProfile] = useState("standard");
  const [leaveAreaTab, setLeaveAreaTab] = useState("settings");

  const dirty = useMemo(() => settings && original && hasLeaveSettingsChanges(settings, original), [settings, original]);
  const policiesDirty = useMemo(
    () => hasLeaveBalancePolicyChanges(policies, originalPolicies),
    [policies, originalPolicies]
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
    setPoliciesError("");
    try {
      const data = await leaveSettings.getBalancePolicies();
      const normalized = normalizeLeaveBalancePolicies(data);
      setPolicies(normalized);
      setOriginalPolicies(normalized);
    } catch (err) {
      setPoliciesError(err?.response?.data?.error || err?.displayMessage || "Unable to load leave balance policies.");
    } finally {
      setPoliciesLoading(false);
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

  const handleSavePolicies = async () => {
    if (!policiesDirty || policiesSaving) return;
    setPoliciesSaving(true);
    setPoliciesError("");
    try {
      const patch = buildLeaveBalancePolicyPatch(policies, originalPolicies);
      const data = await leaveSettings.saveBalancePolicies(patch);
      const normalized = normalizeLeaveBalancePolicies(data);
      setPolicies(normalized);
      setOriginalPolicies(normalized);
      setSnackbar({ open: true, severity: "success", message: "Leave balance policies saved." });
    } catch (err) {
      const message = err?.response?.data?.error || err?.displayMessage || "Unable to save leave balance policies.";
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
    setSnackbar({
      open: true,
      severity: "info",
      message: `${profile.label} recommended defaults applied to the draft. Review and save when ready.`,
    });
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
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>Payroll readiness</Typography>
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
            This preserves the current payroll safety model: estimated leave should remain preview-only until a manager confirms payroll-safe hours.
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
    if (policiesLoading) {
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

    return (
      <Stack spacing={3}>
        {policiesError && <Alert severity="error">{policiesError}</Alert>}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={800}>Leave balance policies</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure balance usage, shortage handling, and accrual policy setup by leave type.
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<HelpOutlineIcon />}
            onClick={() => setBalancePolicyHelpOpen(true)}
          >
            Help
          </Button>
        </Stack>

        <Alert severity="info" variant="outlined">
          Balance usage rules can guide approval-time deductions when enabled. Accrual automation is still inactive, manual adjustments remain available, and these settings do not change payroll calculations.
        </Alert>

        <Grid container spacing={2}>
          {policyRows.map((policy) => (
            <Grid item xs={12} md={6} xl={4} key={policy.leave_type}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 2,
                  height: "100%",
                  backgroundColor: "background.paper",
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {formatLeaveTypeLabel(policy.leave_type)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Balance usage + future accrual policy
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip
                        size="small"
                        sx={readableChipSx(policy.balance_managed ? "success" : "default")}
                        label={policy.balance_managed ? "Balance-managed" : "Manual"}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setLeaveTypeHelp(policy.leave_type)}
                        aria-label={`Open ${formatLeaveTypeLabel(policy.leave_type)} setup guide`}
                      >
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(policy.balance_managed)}
                        onChange={(event) => updatePolicy(policy.leave_type, "balance_managed", event.target.checked)}
                      />
                    }
                    label="Track balance usage"
                  />
                  <Typography variant="caption" color="text.secondary">
                    When enabled, approved paid leave can deduct from this leave balance using the policy below. Payroll calculations remain separate.
                  </Typography>

                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="If balance is insufficient"
                        value={policy.insufficient_balance_mode || "warn"}
                        onChange={(event) => updatePolicy(policy.leave_type, "insufficient_balance_mode", event.target.value)}
                      >
                        {INSUFFICIENT_BALANCE_MODE_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{insufficientBalanceLabels[option] || formatLeaveTypeLabel(option)}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Deduct balance"
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
                    label="Enable saved accrual policy"
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
                        label="Accrual unit"
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
                        label="Accrual rate"
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
                        label="Frequency"
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
                        label="Max balance hours"
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
                    label="Allow negative balance flag"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Saved for future balance-cap workflows. For approval behavior today, use “If balance is insufficient” above and choose “Allow negative balance.”
                  </Typography>

                  {policy.updated_by_name && (
                    <Typography variant="caption" color="text.secondary">
                      Last updated by {policy.updated_by_name}{policy.updated_at ? ` on ${new Date(policy.updated_at).toLocaleString()}` : ""}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <Button variant="contained" onClick={handleSavePolicies} disabled={!policiesDirty || policiesSaving}>
            {policiesSaving ? "Saving..." : policiesDirty ? "Save balance policies" : "No policy changes to save"}
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
              title="Leave balance policies"
              description="Configure which leave types use balances at approval time, and save future accrual policy settings without changing payroll formulas."
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
        ) : (
          <SettingsLeaveInsights />
        )}
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
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
              Payroll-ready means the leave has approved, payroll-safe hours. Preview-only or estimated leave can be shown to managers but should not silently become finalized payroll truth.
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
            These are practical product recommendations for configuring leave balances in Schedulaa. They do not replace legal, payroll, or HR compliance advice. Payroll formulas are not changed by these settings.
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
