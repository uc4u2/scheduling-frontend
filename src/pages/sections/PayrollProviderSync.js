import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
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
import { alpha } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import api, { payrollProviderSyncApi, payrollSetupApi } from "../../utils/api";
import { extractApiErrorMessage } from "../../utils/apiError";

const PROVIDER_OPTIONS = [
  { value: "generic_csv", label: "Generic Accountant CSV" },
  { value: "quickbooks", label: "QuickBooks CSV (direct sync later)" },
  { value: "check_embedded_placeholder", label: "Check (coming later)", disabled: true },
  { value: "gusto_embedded_placeholder", label: "Gusto (coming later)", disabled: true },
  { value: "canada_provider_placeholder", label: "Canadian payroll provider (coming later)", disabled: true },
];

const WORKSPACE_MODE_CHECK = "check";
const WORKSPACE_MODE_HANDOFF = "handoff";
const CHECK_SECTION_OVERVIEW = "overview";
const CHECK_SECTION_SETUP = "setup";
const CHECK_SECTION_SANDBOX = "sandbox";
const CHECK_SECTION_ONBOARDING = "onboarding";
const CHECK_SECTION_PACKAGE = "package";
const CHECK_SECTION_ACTIVITY = "activity";
const CHECK_SECTION_TECHNICAL = "technical";

const formatList = (items = []) => (Array.isArray(items) ? items.filter(Boolean) : []);

const buildSetupErrorMessage = (status, fallback = "Failed to load provider setup status.") => {
  const errors = Array.isArray(status?.capabilities?.errors) ? status.capabilities.errors : [];
  if (errors.includes("QUICKBOOKS_CONNECTION_REQUIRED")) {
    return "QuickBooks is not connected. Connect QuickBooks in Settings first.";
  }
  if (errors.includes("QUICKBOOKS_TIME_SCOPE_REQUIRED")) {
    return "QuickBooks is connected for accounting, but payroll/time sync is not enabled.";
  }
  return (
    status?.message ||
    status?.error ||
    status?.error_code ||
    fallback
  );
};

const buildRequestErrorMessage = async (err, fallback) => {
  const status = err?.response?.status;
  const rawMessage = await extractApiErrorMessage(err, fallback);
  const normalized = String(rawMessage || "").toLowerCase();
  const message = normalized.includes("duplicate_source_hash")
    ? "A provider run already exists for this same payroll-ready snapshot. Open the existing run from history instead of creating another duplicate run."
    : rawMessage;
  return status ? `${message} (HTTP ${status})` : message;
};

const renderJsonList = (items = []) => {
  const list = formatList(items);
  if (!list.length) return <Typography variant="body2" color="text.secondary">None</Typography>;
  return (
    <Box component="ul" sx={{ m: 0, pl: 3 }}>
      {list.map((item, index) => (
        <li key={`${index}-${typeof item === "string" ? item : item?.code || item?.message || "item"}`}>
          {typeof item === "string"
            ? item
            : item?.message || item?.code || JSON.stringify(item)}
        </li>
      ))}
    </Box>
  );
};

const truthyIds = (ids = []) =>
  Array.isArray(ids)
    ? ids.map((id) => String(id)).filter(Boolean)
    : [];

const adjustmentTypeLabels = {
  tips: "tips",
  bonus: "bonus",
  attendance_bonus: "attendance bonus",
  performance_bonus: "performance bonus",
  commission: "commission",
  shift_premium: "shift premium",
  travel_allowance: "travel allowance",
  non_taxable_reimbursement: "reimbursements",
  vacation_pay: "vacation pay",
  parental_top_up: "parental top-up",
  family_bonus: "family bonus",
};

const NON_BLOCKING_CAPABILITY_ERROR_CODES = new Set([
  "QUICKBOOKS_TIME_SCOPE_REQUIRED",
]);

const EMPLOYEE_MAPPING_ERROR_CODES = new Set([
  "MISSING_EMPLOYEE_MAPPING",
]);

const PAY_ITEM_MAPPING_ERROR_CODES = new Set([
  "MISSING_PAY_ITEM_MAP",
]);

const REGION_METADATA_ERROR_CODES = new Set([
  "MISSING_REGION_METADATA",
]);

const BLOCKING_PREVIEW_ERROR_CODES = new Set([
  "MISSING_EMPLOYEE_MAPPING",
  "MISSING_PAY_ITEM_MAP",
  "MISSING_REGION_METADATA",
  "MISSING_HOURLY_RATE",
  "INVALID_NEGATIVE_LINE",
  "MISSING_REQUIRED_PAYROLL_DATA",
  "MISSING_CLOCK_OUT",
]);

const payItemLabel = {
  regular_hours: "regular hours",
  overtime_1_5: "overtime 1.5x",
  paid_leave: "paid leave",
  holiday_hours: "holiday hours",
  vacation_pay: "vacation pay",
  tips: "tips",
  bonus: "bonus",
  attendance_bonus: "attendance bonus",
  performance_bonus: "performance bonus",
  commission: "commission",
  shift_premium: "shift premium",
  travel_allowance: "travel allowance",
  non_taxable_reimbursement: "non-taxable reimbursement",
  parental_top_up: "parental top-up",
  family_bonus: "family bonus",
};

const titleize = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const onboardingActionLabel = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  const labels = {
    employer_onboarding_requested: "Employer onboarding requested",
    employer_onboarding_blocked: "Employer onboarding blocked",
    employer_onboarding_placeholder_created: "Employer onboarding prepared",
    employee_onboarding_requested: "Employee onboarding requested",
    employee_onboarding_blocked: "Employee onboarding blocked",
    employee_onboarding_placeholder_created: "Employee onboarding prepared",
    employee_onboarding_invite_sent: "Employee invite sent",
    employee_onboarding_resend_requested: "Employee invite resent",
    employee_onboarding_self_started: "Employee self-started onboarding",
    onboarding_status_refreshed: "Onboarding status refreshed",
  };
  return labels[normalized] || titleize(normalized);
};

const humanizeCheckIssue = (issue) => {
  const code = String(typeof issue === "string" ? issue : issue?.code || issue?.key || "").trim().toUpperCase();
  const fallbackMessage = typeof issue === "string" ? issue : issue?.message || titleize(code || "needs_attention");
  const base = { code, title: titleize(code || "needs_attention"), message: fallbackMessage, actionLabel: null, category: "general" };
  const mapped = {
    MISSING_COMPANY_FEIN: {
      title: "Add FEIN/EIN",
      message: "Add the company FEIN/EIN in Company Profile before starting Check onboarding.",
      actionLabel: "Open Company Profile",
      category: "company",
    },
    MISSING_COMPANY_ADDRESS: {
      title: "Complete company address",
      message: "Check needs a complete U.S. company address for payroll setup.",
      actionLabel: "Open Company Profile",
      category: "company",
    },
    MISSING_COMPANY_PHONE: {
      title: "Add company phone number",
      message: "Add a company phone number in Company Profile before the first real Check company sync.",
      actionLabel: "Open Company Profile",
      category: "company",
    },
    MISSING_WORK_LOCATION_ADDRESS: {
      title: "Complete payroll location address",
      message: "Each active payroll location needs a full address before it can be synced to Check.",
      actionLabel: "Edit Payroll Locations",
      category: "location",
    },
    MISSING_WORK_LOCATION_ADDRESS_INCOMPLETE: {
      title: "Complete payroll location address",
      message: "Some payroll locations are missing required address fields for Check.",
      actionLabel: "Edit Payroll Locations",
      category: "location",
    },
    CHECK_COMPANY_NOT_MAPPED: {
      title: "Company not synced to Check",
      message: "After sandbox credentials are configured, sync the company to Check first.",
      category: "sandbox",
    },
    CHECK_WORKPLACE_NOT_MAPPED: {
      title: "Payroll location not synced to Check",
      message: "After company sync is complete, sync payroll locations so Check can create workplaces.",
      category: "sandbox",
    },
    CHECK_EMPLOYEE_NOT_MAPPED: {
      title: "Employee not synced to Check",
      message: "After company and workplace sync are complete, sync employees to Check.",
      actionLabel: "Review employees",
      category: "employee",
    },
    CHECK_ONBOARD_NOT_ENABLED: {
      title: "Check onboarding is not enabled",
      message: "Onboarding links will be available after Check sandbox credentials and onboarding access are configured.",
      category: "onboarding",
    },
    TIP_CREDIT_NOT_SUPPORTED_V1: {
      title: "Tip credit is not supported in v1",
      message: "Simple tips can be prepared, but tip-credit payroll needs a future advanced workflow.",
      category: "payroll",
    },
    NIGHT_SHIFT_NOT_SUPPORTED: {
      title: "Overnight shifts are not supported in v1",
      message: "Schedulaa Payroll v1 does not support overnight shifts for embedded payroll.",
      category: "payroll",
    },
    MISSING_EMPLOYEE_PRIMARY_WORK_LOCATION: {
      title: "Assign primary payroll locations",
      message: "Each eligible payroll employee needs a primary payroll location before employee sync and onboarding.",
      actionLabel: "Review employees",
      category: "employee",
    },
    PRIMARY_PAYROLL_LOCATION_REQUIRED: {
      title: "Assign primary payroll location",
      message: "This employee needs a primary payroll location before Check onboarding can begin.",
      actionLabel: "Review employees",
      category: "employee",
    },
    CHECK_NOT_CONFIGURED: {
      title: "Check sandbox credentials are not configured",
      message: "Add Check sandbox credentials in the backend environment before any sandbox sync or onboarding can begin.",
      category: "connection",
    },
    WORK_LOCATION_ADDRESS_INCOMPLETE: {
      title: "Complete payroll location addresses",
      message: "Some payroll locations still need full address details before embedded payroll can move forward.",
      actionLabel: "Edit Payroll Locations",
      category: "location",
    },
    INVALID_US_WORK_LOCATION_STATE_ZIP: {
      title: "Fix payroll location ZIP and state",
      message: "Fix payroll location ZIP codes so they match the selected U.S. state before syncing workplaces to Check.",
      actionLabel: "Edit Payroll Locations",
      category: "location",
    },
    INVALID_WORK_LOCATION_TIMEZONE: {
      title: "Fix payroll location timezone",
      message: "Some payroll locations still have invalid or mismatched timezones for payroll setup.",
      actionLabel: "Edit Payroll Locations",
      category: "location",
    },
    EMPLOYEE_FIELDS_INCOMPLETE: {
      title: "Review employee payroll fields",
      message: "Some employees are missing payroll-ready location or identity fields used by local readiness checks.",
      actionLabel: "Review employees",
      category: "employee",
    },
    NO_ELIGIBLE_PAYROLL_EMPLOYEE: {
      title: "Add an eligible payroll employee",
      message: "Add a non-manager employee or correct the worker record that should be included in payroll before employee sync begins.",
      actionLabel: "Review employees",
      category: "employee",
    },
    MULTI_STATE_REQUIRES_REVIEW: {
      title: "Review multi-state employees",
      message: "Employees appear to work across multiple states or provinces. Review this setup before embedded payroll goes live.",
      actionLabel: "Review employees",
      category: "employee",
    },
  }[code];
  return mapped ? { ...base, ...mapped } : base;
};

const summarizeManagerIssues = (...issueGroups) => {
  const seen = new Set();
  const result = [];
  issueGroups.flat().filter(Boolean).forEach((issue) => {
    const item = humanizeCheckIssue(issue);
    const signature = `${item.code || item.title}:${item.message}`;
    if (seen.has(signature)) return;
    seen.add(signature);
    result.push(item);
  });
  return result;
};

const aggregateCheckIssues = (...issueGroups) => {
  const groups = new Map();
  issueGroups.flat().filter(Boolean).forEach((issue) => {
    const item = humanizeCheckIssue(issue);
    const key = `${item.code || item.title}:${item.message}`;
    const existing = groups.get(key) || { ...item, count: 0 };
    existing.count += 1;
    groups.set(key, existing);
  });
  return Array.from(groups.values()).map((item) => ({
    ...item,
    message_with_count: item.count > 1 ? `${item.message} ${item.count} affected lines.` : item.message,
  }));
};

const checkCardStatus = ({ blocked = 0, warning = 0, ready = false }) => {
  if (blocked > 0) return { label: "Blocked", tone: "danger" };
  if (warning > 0) return { label: "Needs attention", tone: "warning" };
  if (ready) return { label: "Ready", tone: "success" };
  return { label: "Not ready", tone: "neutral" };
};

const onboardingFilterLabel = (value) => {
  const labels = {
    all: "All",
    missing_location: "Missing payroll location",
    not_mapped: "Not synced to Check",
    invite_ready: "Invite ready",
    invite_sent: "Invite sent",
    needs_attention: "Needs attention",
    completed: "Completed",
  };
  return labels[value] || titleize(value);
};

const employeeOnboardingFilterMatch = (row, filterValue) => {
  switch (filterValue) {
    case "missing_location":
      return !row?.primary_work_location_id;
    case "not_mapped":
      return !row?.check_employee_id;
    case "invite_ready":
      return row?.action_state === "ready";
    case "invite_sent":
      return Boolean(row?.last_invite_sent_at);
    case "needs_attention":
      return ["needs_attention", "blocking"].includes(String(row?.onboard_status || "").toLowerCase()) || row?.action_state === "missing_primary_work_location";
    case "completed":
      return String(row?.onboard_status || "").toLowerCase() === "completed";
    default:
      return true;
  }
};

const payrollPreviewActionTitle = (preview) => {
  const blockerCount = Number(preview?.summary?.blocker_count || 0);
  return blockerCount > 0 ? "Not ready for future Check preview" : "Ready for future Check preview";
};

const checkPackageStatusLabel = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "supported") return "Supported";
  if (normalized === "warning") return "Needs review";
  if (normalized === "blocked") return "Blocked";
  if (normalized === "not_sent") return "Not sent";
  return titleize(normalized);
};

const checkPackageStatusTone = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "supported") return "success";
  if (normalized === "warning") return "warning";
  if (normalized === "blocked") return "danger";
  return "neutral";
};

const checklistChipTone = (item) => {
  if (!item) return "neutral";
  if (item.ok) return "success";
  if (item.severity === "error") return "danger";
  if (item.severity === "warning") return "warning";
  return "neutral";
};

const checklistValueLabel = (value) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "Not set";
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "created_placeholder") return "Prepared";
  if (normalized === "pending_config") return "Pending setup";
  if (normalized === "not_connected") return "Not connected";
  return String(value);
};

const checklistManagerLabel = (key) => {
  const labels = {
    company_profile_exists: "Company profile exists",
    company_country_us: "Company country is U.S.",
    company_address_complete: "Company address is complete",
    company_fein_present: "Company FEIN/EIN is present",
    payroll_intent_check_embedded_us: "Embedded payroll is selected",
    check_configured: "Check sandbox credentials configured",
    check_sandbox_sync_enabled: "Sync to Check sandbox enabled",
    active_work_locations_count: "Active payroll locations",
    default_work_location_exists: "Default payroll location exists",
    all_active_locations_have_address: "All active payroll locations have addresses",
    all_active_locations_have_valid_timezone: "All payroll locations have valid timezones",
    all_active_locations_have_valid_us_state_zip_if_us: "All U.S. payroll locations have valid state and ZIP",
    mapped_workplaces_count: "Payroll locations already synced to Check",
    unmapped_workplaces_count: "Payroll locations not yet synced to Check",
    total_employee_records_reviewed: "Total employee records reviewed",
    eligible_payroll_employee_count: "Eligible payroll employees",
    excluded_records_count: "Excluded records",
    employees_missing_primary_work_location_count: "Employees missing primary payroll location",
    mapped_employee_count: "Employees already synced to Check",
    eligible_employees_not_synced_to_check: "Eligible employees not synced to Check",
    employees_with_onboarding_complete: "Employees with onboarding complete",
    archived_employees_excluded: "Archived employees excluded",
    manager_records_excluded: "Manager records excluded",
    check_onboard_enabled: "Check onboarding enabled",
    check_components_enabled: "Onboarding sessions enabled",
    employer_onboarding_available: "Employer onboarding available",
    employee_onboarding_available: "Employee onboarding available",
    latest_employer_session_status: "Latest employer onboarding session",
    recent_audit_events_count: "Recent onboarding activity events",
    ready_for_payload_preview: "Ready for data preview for Check",
    ready_for_sandbox_company_sync: "Ready to sync company to Check sandbox",
    ready_for_sandbox_workplace_sync: "Ready to sync payroll locations to Check sandbox",
    ready_for_sandbox_employee_sync: "Ready to sync employees to Check sandbox",
  };
  return labels[key] || titleize(key);
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const formatNumber = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const payrollValueSourceFallbackMessage = (source) => {
  switch (String(source || "").toLowerCase()) {
    case "finalized_payroll":
      return "Using finalized payroll values for this period.";
    case "saved_draft_payroll":
      return "Using saved draft payroll preview values for this period. Finalize payroll if you want this CSV to match employee-facing payroll records.";
    default:
      return "Using approved operational payroll-ready data. No saved payroll snapshot was found for this period.";
  }
};

const shortenHash = (value, size = 12) => {
  const text = String(value || "").trim();
  if (!text) return "—";
  if (text.length <= size) return text;
  return `${text.slice(0, size)}...`;
};

const employeeLabelFromContext = (employeeId, runRows = [], recruiters = []) => {
  const normalized = String(employeeId);
  const runMatch = runRows.find((row) => String(row.employee_id) === normalized);
  if (runMatch?.employee_name_snapshot) return runMatch.employee_name_snapshot;
  const recruiterMatch = recruiters.find((row) => String(row.id) === normalized);
  if (recruiterMatch) return `${recruiterMatch.first_name} ${recruiterMatch.last_name}`.trim();
  return `Employee ${employeeId}`;
};

const SectionHeading = ({ title, tooltip, variant = "h6", gutterBottom = true }) => (
  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: gutterBottom ? 1 : 0 }}>
    <Typography variant={variant}>{title}</Typography>
    {tooltip ? (
      <Tooltip title={tooltip}>
        <IconButton size="small" sx={{ p: 0.25 }}>
          <InfoOutlinedIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    ) : null}
  </Stack>
);

const CHECK_HELP_TAB = "check";
const HANDOFF_HELP_TAB = "handoff";

const PayrollProviderSyncHelpDrawer = ({ open, onClose, activeTab = HANDOFF_HELP_TAB, onChangeTab }) => {
  const checkSections = [
    {
      title: "What this workspace covers",
      bullets: [
        "Schedulaa prepares payroll inputs, employee records, and payroll locations for embedded payroll.",
        "Check will later handle secure onboarding, taxes, payroll processing, and compliance once sandbox credentials are configured.",
        "Nothing is sent to Check from this page yet.",
      ],
    },
    {
      title: "Current rollout status",
      bullets: [
        "Check is not live yet in this environment.",
        "Sandbox credentials, sandbox sync, onboarding access, and component access are still gated.",
        "This control center is a preparation workspace, not a payroll submission workflow.",
      ],
    },
    {
      title: "Recommended setup sequence",
      bullets: [
        "Complete Company Profile and add FEIN/EIN.",
        "Add payroll locations and confirm full U.S. addresses and timezones.",
        "Add employees and assign a primary payroll location to each payroll employee.",
        "Preview data for Check, then sync sandbox company, payroll locations, and employees later.",
        "Start employer onboarding, then employee onboarding, then provider payroll preview in a later phase.",
      ],
    },
    {
      title: "Employer onboarding",
      bullets: [
        "An authorized manager or payroll signer will complete company onboarding through Check.",
        "Sensitive funding, bank, and tax setup belongs in Check, not in Schedulaa.",
      ],
    },
    {
      title: "Employee onboarding",
      bullets: [
        "Employees will complete SSN/TIN, tax forms, and direct deposit through Check later.",
        "Schedulaa stores only status, mapping, and audit trail data for this flow.",
      ],
    },
    {
      title: "Common operating scenarios",
      bullets: [
        "Scenario A: Simple U.S. salon with one location and five employees is the easiest path.",
        "Scenario B: Salon or spa with simple paycheck tips works when tipped employees are on and tip credit is off.",
        "Scenario C: Tip credit business is blocked for v1 and needs a future advanced workflow.",
        "Scenario D: 100 employees can use bulk select, bulk invite, and bulk status refresh once onboarding is enabled.",
        "Scenario E: Missing FEIN or payroll location address blocks the flow until fixed.",
      ],
    },
    {
      title: "Avoid these mistakes",
      bullets: [
        "Do not enter SSN, bank, W-4, or direct deposit data in Schedulaa for Check payroll.",
        "Do not treat Add Member as legal payroll onboarding.",
        "Do not submit payroll to Check until onboarding and sandbox mapping are complete.",
      ],
    },
  ];

  const handoffSections = [
    {
      title: "What this workspace covers",
      bullets: [
        "Payroll Handoff builds a payroll-ready CSV for your accountant or payroll provider.",
        "It reads the current pay period, employee scope, approved operational payroll data, and saved payroll values.",
        "It does not pay employees and does not submit payroll directly to providers yet.",
      ],
    },
    {
      title: "Recommended workflow",
      bullets: [
        "1. Open Payroll Preview, review hours, bonus, commission, tips, vacation, and deductions.",
        "2. Finalize payroll when you want employee-facing payroll and handoff values to match.",
        "3. Open Provider Sync, preview the payroll-ready data, then prepare and download the CSV.",
        "4. Use Run history if you need to reopen a previous handoff, compare runs, or re-download a CSV.",
      ],
    },
    {
      title: "How to read this page",
      bullets: [
        "Review data shows the active employee scope, period, and the source used for payroll values.",
        "CSV status tells you whether the current selection is ready for export and lists blocking issues if not.",
        "Current batch shows the selected run metrics, source hash, and validation state for the run you are working with.",
        "Run history is your audit trail of created, validated, previewed, and exported handoff runs.",
      ],
    },
    {
      title: "How to read payroll sources",
      bullets: [
        "Finalized payroll means the CSV is using finalized period payroll values first.",
        "Saved draft payroll means there is no finalized row, so the CSV is using saved draft payroll values for that period.",
        "Operational raw means no finalized or saved draft payroll values were found, so the CSV is built from approved time and leave only.",
      ],
    },
    {
      title: "How to use filters",
      bullets: [
        "The main Payroll page filters control the default employee and date scope for this page.",
        "Use the override handoff scope only when you intentionally want this tab to ignore the main employee selection.",
        "Use Run history filters to narrow history by department, employee, status, and date range.",
      ],
    },
  ];

  return (
    <Paper variant="outlined" sx={{ p: 0, borderRadius: 2, overflow: "hidden" }}>
      <Stack sx={{ height: "100%" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5, borderBottom: 1, borderColor: "divider" }}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Payroll Operations Guide</Typography>
            <Typography variant="body2" color="text.secondary">
              Choose the workflow that matches this company’s payroll path: Check preparation or CSV handoff.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close payroll provider sync guide">
            <CloseIcon />
          </IconButton>
        </Stack>
        <Stack spacing={2} sx={{ p: 2.5, overflowY: "auto" }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => onChangeTab?.(value)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab value={CHECK_HELP_TAB} label="Check Payroll" />
            <Tab value={HANDOFF_HELP_TAB} label="CSV Handoff" />
          </Tabs>
          <Alert severity="info" variant="outlined" sx={{ py: 0.75 }}>
            {activeTab === CHECK_HELP_TAB
              ? "Check is not live in this environment yet. This workspace prepares data only and does not send payroll to Check."
              : "Payroll Handoff is a CSV export workflow. It is not a direct payroll submission workflow yet."}
          </Alert>
          {(activeTab === CHECK_HELP_TAB ? checkSections : handoffSections).map((section) => (
            <Paper key={section.title} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                {section.title}
              </Typography>
              <Stack spacing={0.75}>
                {section.bullets.map((bullet) => (
                  <Typography key={bullet} variant="body2" color="text.secondary">
                    - {bullet}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          ))}
          {activeTab === HANDOFF_HELP_TAB ? (
            <>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                  Real-world example: finalized payroll handoff
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A manager reviews Noah Reed for Mar 26 to Apr 8, adds a bonus and commission, finalizes payroll, then opens Provider Sync. The page shows “Using finalized payroll values for this period.” The manager previews the run, confirms the exported total, downloads the CSV, and sends it to the accountant. If the run needs to be revisited later, the same period can be reopened from Run history.
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                  Real-world example: accrued vacation only
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A manager finalizes a period where Vacation Pay exists but Include Vacation in Gross is off. The payslip still shows the vacation amount for the period, but Provider Sync warns that vacation was accrued and not included as payable earnings. The CSV exports payable items like holiday, bonus, and commission, but excludes Vacation Pay from the handoff rows.
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                  What to do when something looks wrong
                </Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2" color="text.secondary">- If source says operational raw when you expect finalized values, check whether that period was actually finalized.</Typography>
                  <Typography variant="body2" color="text.secondary">- If CSV status is not ready, fix employee mapping, pay item mapping, or export metadata issues listed in the page.</Typography>
                  <Typography variant="body2" color="text.secondary">- If history shows multiple runs for the same period, compare the source hash and selected run details before exporting again.</Typography>
                </Stack>
              </Paper>
            </>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
};

const managerFriendlyMessage = (item, { runRows = [], recruiters = [] } = {}) => {
  const code = typeof item === "string" ? item : item?.code || item?.message || "";
  const key = item?.key;
  const employeeId = item?.employee_id;

  if (code === "QUICKBOOKS_TIME_SCOPE_REQUIRED") {
    return "Live QuickBooks payroll/time submit is not enabled. CSV export is still available.";
  }
  if (code === "MISSING_PAY_ITEM_MAP" && key) {
    return `${payItemLabel[key] || key} needs to be matched to a payroll/pay item.`;
  }
  if (code === "MISSING_EMPLOYEE_MAPPING" && employeeId) {
    return `${employeeLabelFromContext(employeeId, runRows, recruiters)} needs to be matched to a payroll employee.`;
  }
  if (code === "MISSING_REGION_METADATA" && employeeId) {
    return `${employeeLabelFromContext(employeeId, runRows, recruiters)} is missing export location metadata in the employee profile.`;
  }
  if (code === "MISSING_REGION_METADATA") {
    return "Employee export location metadata is missing.";
  }
  if (typeof item === "string") return item;
  return item?.message || item?.code || JSON.stringify(item);
};

const runStatusLabel = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "unsupported":
      return "CSV handoff only";
    case "validated":
      return "Validated";
    case "draft":
      return "Draft";
    case "failed":
      return "Needs attention";
    case "submitted_to_time_tracking":
      return "Time entries sent";
    default:
      return status || "—";
  }
};

const issueCode = (item) => {
  if (typeof item === "string") return item;
  return item?.code || item?.error || item?.message || "";
};

const isNonBlockingCapabilityIssue = (item) =>
  NON_BLOCKING_CAPABILITY_ERROR_CODES.has(issueCode(item));

const isBlockingPreviewIssue = (item) =>
  BLOCKING_PREVIEW_ERROR_CODES.has(issueCode(item)) && !isNonBlockingCapabilityIssue(item);

const renderManagerMessages = (items = [], context = {}) => {
  const list = formatList(items);
  if (!list.length) return <Typography variant="body2" color="text.secondary">None</Typography>;
  return (
    <Box component="ul" sx={{ m: 0, pl: 3 }}>
      {list.map((item, index) => (
        <li key={`${index}-${typeof item === "string" ? item : item?.code || item?.message || "item"}`}>
          {managerFriendlyMessage(item, context)}
        </li>
      ))}
    </Box>
  );
};

const CORE_PAY_ITEM_KEYS = [
  "regular_hours",
  "overtime_1_5",
  "paid_leave",
  "holiday_hours",
];

const PAY_ITEM_SORT_ORDER = [
  ...CORE_PAY_ITEM_KEYS,
  "vacation_pay",
  "tips",
  "bonus",
  "attendance_bonus",
  "performance_bonus",
  "commission",
  "shift_premium",
  "travel_allowance",
  "non_taxable_reimbursement",
  "parental_top_up",
  "family_bonus",
];

const sortPayItemKeys = (keys = []) =>
  [...keys].sort((a, b) => {
    const aIndex = PAY_ITEM_SORT_ORDER.indexOf(a);
    const bIndex = PAY_ITEM_SORT_ORDER.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return String(a).localeCompare(String(b));
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

const comparePayItemKey = (left, right) => {
  const [first, second] = sortPayItemKeys([left, right]);
  if (first === second) return 0;
  return first === left ? -1 : 1;
};

const normalizeMatchText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");

const buildEmployeeSuggestion = (row, candidates = []) => {
  const email = normalizeMatchText(row?.employee_email);
  const fullName = normalizeMatchText(row?.employee_name);
  if (!candidates.length) return null;
  if (email) {
    const emailMatch = candidates.find((candidate) => normalizeMatchText(candidate.email) === email);
    if (emailMatch) return emailMatch;
  }
  if (fullName) {
    const nameMatch = candidates.find((candidate) => normalizeMatchText(candidate.display_name || candidate.name) === fullName);
    if (nameMatch) return nameMatch;
  }
  return null;
};

const PAY_ITEM_SUGGESTION_LABELS = {
  regular_hours: ["regular hours", "hours"],
  overtime_1_5: ["overtime", "overtime 1 5", "overtime 1.5"],
  paid_leave: ["paid leave"],
  holiday_hours: ["holiday pay", "holiday hours"],
  vacation_pay: ["vacation pay"],
  tips: ["tips"],
  bonus: ["bonus"],
  commission: ["commission"],
};

const buildPayItemSuggestion = (localKey, candidates = []) => {
  const candidateLabels = PAY_ITEM_SUGGESTION_LABELS[localKey] || [payItemLabel[localKey] || localKey];
  const normalizedTargets = candidateLabels.map(normalizeMatchText);
  return candidates.find((candidate) =>
    normalizedTargets.includes(normalizeMatchText(candidate.display_name || candidate.name))
  ) || null;
};

export default function PayrollProviderSync({
  payrollSetupProfile = null,
  departmentFilter,
  selectedRecruiter,
  exportAllEmployees,
  exportEmployeeIds,
  region,
  startDate,
  endDate,
  payFrequency,
  payroll,
  recruiters = [],
  filteredRecruiters = [],
  setSnackbar,
}) {
  const [provider, setProvider] = useState("generic_csv");
  const [workspaceMode, setWorkspaceMode] = useState(WORKSPACE_MODE_HANDOFF);
  const [statusLoading, setStatusLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState(null);
  const [setupError, setSetupError] = useState("");
  const [checkReadinessLoading, setCheckReadinessLoading] = useState(false);
  const [checkReadiness, setCheckReadiness] = useState(null);
  const [checkReadinessError, setCheckReadinessError] = useState("");
  const [checkStatusLoading, setCheckStatusLoading] = useState(false);
  const [checkStatus, setCheckStatus] = useState(null);
  const [checkStatusError, setCheckStatusError] = useState("");
  const [checkOnboardingLoading, setCheckOnboardingLoading] = useState(false);
  const [checkOnboardingOverview, setCheckOnboardingOverview] = useState(null);
  const [checkOnboardingError, setCheckOnboardingError] = useState("");
  const [checkLaunchReadinessLoading, setCheckLaunchReadinessLoading] = useState(false);
  const [checkLaunchReadiness, setCheckLaunchReadiness] = useState(null);
  const [checkLaunchReadinessError, setCheckLaunchReadinessError] = useState("");
  const [checkPackagePreviewLoading, setCheckPackagePreviewLoading] = useState(false);
  const [checkPackagePreview, setCheckPackagePreview] = useState(null);
  const [checkPackagePreviewError, setCheckPackagePreviewError] = useState("");
  const [checkComponentSessions, setCheckComponentSessions] = useState([]);
  const [checkComponentLoading, setCheckComponentLoading] = useState(false);
  const [checkComponentActionLoading, setCheckComponentActionLoading] = useState(false);
  const [checkEmployeeOnboardingActionLoading, setCheckEmployeeOnboardingActionLoading] = useState({});
  const [checkBulkActionLoading, setCheckBulkActionLoading] = useState("");
  const [checkPayloadLoading, setCheckPayloadLoading] = useState(false);
  const [checkPayloadPreview, setCheckPayloadPreview] = useState(null);
  const [checkActionNotice, setCheckActionNotice] = useState("");
  const [checkSyncLoading, setCheckSyncLoading] = useState({
    company: false,
    workplaces: false,
    employees: false,
  });

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [prepareCsvLoading, setPrepareCsvLoading] = useState(false);

  const [createLoading, setCreateLoading] = useState(false);
  const [runData, setRunData] = useState(null);
  const [runError, setRunError] = useState("");
  const [runNotice, setRunNotice] = useState("");

  const [validationLoading, setValidationLoading] = useState(false);
  const [validationData, setValidationData] = useState(null);

  const [payloadLoading, setPayloadLoading] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState(null);

  const [downloadLoading, setDownloadLoading] = useState(false);
  const [bootstrapPayItemsLoading, setBootstrapPayItemsLoading] = useState(false);
  const [bootstrapEmployeesLoading, setBootstrapEmployeesLoading] = useState(false);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employeeMappings, setEmployeeMappings] = useState([]);
  const [payItemMappings, setPayItemMappings] = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [runHistoryMeta, setRunHistoryMeta] = useState({ limit: 10, offset: 0, has_more: false });
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState("");
  const [historyDepartmentFilter, setHistoryDepartmentFilter] = useState(departmentFilter ? String(departmentFilter) : "");
  const [historyEmployeeFilter, setHistoryEmployeeFilter] = useState(selectedRecruiter ? String(selectedRecruiter) : "");
  const [historyStartFilter, setHistoryStartFilter] = useState(startDate || "");
  const [historyEndFilter, setHistoryEndFilter] = useState(endDate || "");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("current_run_unmapped");
  const [employeePage, setEmployeePage] = useState(0);
  const [employeeMappingDrafts, setEmployeeMappingDrafts] = useState({});
  const [missingPayItemDrafts, setMissingPayItemDrafts] = useState({});
  const [employeeCandidateState, setEmployeeCandidateState] = useState({ available: false, reason: "", items: [] });
  const [payItemCandidateState, setPayItemCandidateState] = useState({ available: false, reason: "", items: [] });
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [employeeCandidateSelections, setEmployeeCandidateSelections] = useState({});
  const [payItemCandidateSelections, setPayItemCandidateSelections] = useState({});
  const [csvSuggestionState, setCsvSuggestionState] = useState({ employee_suggestions: [], pay_item_suggestions: [] });
  const [csvSuggestionLoading, setCsvSuggestionLoading] = useState(false);
  const [applySuggestionsLoading, setApplySuggestionsLoading] = useState(false);
  const [payItemDraft, setPayItemDraft] = useState({
    local_key: "",
    provider_item_id: "",
    provider_item_name: "",
  });
  const [overrideScopeEnabled, setOverrideScopeEnabled] = useState(false);
  const [providerScopeMode, setProviderScopeMode] = useState("all_filtered");
  const [providerSelectedEmployeeIds, setProviderSelectedEmployeeIds] = useState([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState(HANDOFF_HELP_TAB);
  const [checkSection, setCheckSection] = useState(CHECK_SECTION_OVERVIEW);
  const [checkOnboardingSearch, setCheckOnboardingSearch] = useState("");
  const [checkOnboardingFilter, setCheckOnboardingFilter] = useState("all");
  const [checkOnboardingPageSize, setCheckOnboardingPageSize] = useState(10);
  const [checkOnboardingPage, setCheckOnboardingPage] = useState(0);
  const [checkSelectedEmployeeIds, setCheckSelectedEmployeeIds] = useState([]);
  const runPanelRef = useRef(null);

  const scopedRecruiters = useMemo(
    () => (departmentFilter ? filteredRecruiters : recruiters),
    [departmentFilter, filteredRecruiters, recruiters]
  );
  const historyScopedRecruiters = useMemo(
    () => (historyDepartmentFilter
      ? recruiters.filter((row) => String(row.department_id) === String(historyDepartmentFilter))
      : recruiters),
    [historyDepartmentFilter, recruiters]
  );
  const scopedRecruiterIds = useMemo(
    () => truthyIds(scopedRecruiters.map((row) => row.id)),
    [scopedRecruiters]
  );
  const defaultProviderEmployeeIds = useMemo(() => {
    if (selectedRecruiter) {
      return [String(selectedRecruiter)];
    }
    return scopedRecruiterIds;
  }, [scopedRecruiterIds, selectedRecruiter]);
  const defaultProviderScopeMode = useMemo(() => {
    if (defaultProviderEmployeeIds.length > 1) return "custom";
    if (defaultProviderEmployeeIds.length === 1) return "single";
    return "all_filtered";
  }, [defaultProviderEmployeeIds]);
  const availableEmployeeIds = useMemo(() => {
    if (!overrideScopeEnabled) {
      return defaultProviderEmployeeIds;
    }
    if (providerScopeMode === "single") {
      return providerSelectedEmployeeIds[0] ? [providerSelectedEmployeeIds[0]] : [];
    }
    if (providerScopeMode === "custom") {
      return providerSelectedEmployeeIds;
    }
    return scopedRecruiterIds;
  }, [defaultProviderEmployeeIds, overrideScopeEnabled, providerScopeMode, providerSelectedEmployeeIds, scopedRecruiterIds]);
  const selectedEmployeeNames = useMemo(() => {
    const byId = new Map(scopedRecruiters.map((row) => [String(row.id), `${row.first_name} ${row.last_name}`.trim()]));
    return availableEmployeeIds.map((id) => byId.get(String(id)) || `Employee ${id}`);
  }, [availableEmployeeIds, scopedRecruiters]);

  const missingDates = !startDate || !endDate;
  const noExplicitEmployees =
    overrideScopeEnabled &&
    (providerScopeMode === "single" || providerScopeMode === "custom") &&
    availableEmployeeIds.length === 0;
  const canPrepare = !missingDates;

  // Province/state is still owned inside PayrollFilters. For this first pass,
  // provider-sync uses region plus any province/state already present on payroll.
  const provinceOrState = payroll?.state || payroll?.province || null;

  const showMessage = (message, severity = "info") => {
    if (typeof setSnackbar === "function") {
      setSnackbar({ open: true, message, severity });
    }
  };

  const payrollSetupContext = payrollSetupProfile || setupStatus?.setup_profile || checkReadiness?.setup_profile || {};
  const payrollIntent = payrollSetupContext?.payroll_intent || setupStatus?.payroll_intent || checkReadiness?.intent_mode || "none";
  const payrollCountry = payrollSetupContext?.payroll_country || setupStatus?.payroll_country || checkReadiness?.setup_profile?.payroll_country || "";
  const currentPayrollProvider = payrollSetupContext?.current_payroll_provider || setupStatus?.current_payroll_provider || "";
  const isCheckIntent = payrollIntent === "check_embedded_us";
  const isCsvIntent = payrollIntent === "csv_handoff";
  const isUnsetIntent = !payrollIntent || payrollIntent === "none";
  const isCanadianPayroll = String(payrollCountry || "").toUpperCase() === "CA";
  const shouldShowCheckWorkspace = isCheckIntent && workspaceMode === WORKSPACE_MODE_CHECK;
  const shouldShowHandoffWorkspace = !isCheckIntent || workspaceMode === WORKSPACE_MODE_HANDOFF;
  const shouldShowEmbeddedPlanningCard = !isCheckIntent;
  const providerPickerDisabled = isUnsetIntent;

  const checkWorkspaceSections = [
    { key: CHECK_SECTION_OVERVIEW, label: "Overview" },
    { key: CHECK_SECTION_SETUP, label: "Setup checklist" },
    { key: CHECK_SECTION_SANDBOX, label: "Sandbox sync" },
    { key: CHECK_SECTION_ONBOARDING, label: "Onboarding" },
    { key: CHECK_SECTION_PACKAGE, label: "Payroll package" },
    { key: CHECK_SECTION_ACTIVITY, label: "Activity" },
    { key: CHECK_SECTION_TECHNICAL, label: "Technical details" },
  ];
  const checkOnboardingRows = useMemo(
    () => Array.isArray(checkOnboardingOverview?.employee_onboard_summary?.items) ? checkOnboardingOverview.employee_onboard_summary.items : [],
    [checkOnboardingOverview]
  );
  const filteredCheckOnboardingRows = useMemo(() => {
    const search = String(checkOnboardingSearch || "").trim().toLowerCase();
    return checkOnboardingRows.filter((row) => {
      const matchesSearch = !search
        || String(row?.employee_name || "").toLowerCase().includes(search)
        || String(row?.email || "").toLowerCase().includes(search);
      return matchesSearch && employeeOnboardingFilterMatch(row, checkOnboardingFilter);
    });
  }, [checkOnboardingFilter, checkOnboardingRows, checkOnboardingSearch]);
  const pagedCheckOnboardingRows = useMemo(() => {
    const start = checkOnboardingPage * checkOnboardingPageSize;
    return filteredCheckOnboardingRows.slice(start, start + checkOnboardingPageSize);
  }, [checkOnboardingPage, checkOnboardingPageSize, filteredCheckOnboardingRows]);
  const allVisibleCheckEmployeesSelected = pagedCheckOnboardingRows.length > 0
    && pagedCheckOnboardingRows.every((row) => checkSelectedEmployeeIds.includes(row.employee_id));
  const selectedCheckEmployeesVisibleCount = pagedCheckOnboardingRows.filter((row) => checkSelectedEmployeeIds.includes(row.employee_id)).length;

  const managerIssues = useMemo(
    () => summarizeManagerIssues(
      checkLaunchReadiness?.blockers,
      (checkLaunchReadiness?.warnings || []).map((message) => ({ message })),
      (() => {
        const derived = [];
        const workplaceChecklist = Array.isArray(checkLaunchReadiness?.workplace_checklist)
          ? checkLaunchReadiness.workplace_checklist
          : [];
        const employeeChecklist = Array.isArray(checkLaunchReadiness?.employee_checklist)
          ? checkLaunchReadiness.employee_checklist
          : [];
        const eligibleEmployees =
          Number(checkLaunchReadiness?.counts?.eligible_employee_count ?? 0)
          || Number(checkOnboardingOverview?.employee_counts?.eligible_payroll_employees ?? 0);
        if (eligibleEmployees === 0) {
          derived.push({ code: "NO_ELIGIBLE_PAYROLL_EMPLOYEE" });
        }
        if (workplaceChecklist.some((item) => item?.key === "all_active_locations_have_valid_us_state_zip_if_us" && item?.ok === false)) {
          derived.push({ code: "INVALID_US_WORK_LOCATION_STATE_ZIP" });
        }
        if (workplaceChecklist.some((item) => item?.key === "all_active_locations_have_valid_timezone" && item?.ok === false)) {
          derived.push({ code: "INVALID_WORK_LOCATION_TIMEZONE" });
        }
        if (
          checkPayloadPreview?.kind === "company"
          && !String(checkPayloadPreview?.data?.payload?.phone || "").trim()
        ) {
          derived.push({ code: "MISSING_COMPANY_PHONE" });
        }
        if (employeeChecklist.some((item) => item?.key === "eligible_payroll_employee_count" && item?.ok === false)) {
          derived.push({ code: "NO_ELIGIBLE_PAYROLL_EMPLOYEE" });
        }
        return derived;
      })(),
      checkReadiness?.unsupported_conditions,
      checkReadiness?.warnings,
      checkOnboardingOverview?.blockers,
      checkPackagePreview?.blockers,
      checkPackagePreview?.warnings
    ),
    [checkLaunchReadiness, checkReadiness, checkOnboardingOverview, checkPackagePreview, checkPayloadPreview]
  );

  const companySummary = useMemo(() => {
    const issues = managerIssues.filter((item) => item.category === "company");
    return {
      ...checkCardStatus({
        blocked: issues.length,
        warning: (!checkLaunchReadiness?.counts?.active_work_locations_count || !checkLaunchReadiness?.ready_for_sandbox_payload_preview) && issues.length === 0 ? 1 : 0,
        ready: Boolean(checkLaunchReadiness?.ready_for_sandbox_payload_preview && !issues.length),
      }),
      issue: issues[0]?.message || "Company profile, U.S. country, address, and FEIN/EIN are ready for local Check preparation.",
      cta: "Go to Company Profile",
    };
  }, [checkLaunchReadiness, managerIssues]);

  const locationSummary = useMemo(() => {
    const issues = managerIssues.filter((item) => item.category === "location" || item.category === "sandbox");
    const needsAttention = Number(checkLaunchReadiness?.counts?.active_work_locations_count || 0) === 0
      || Number(checkLaunchReadiness?.counts?.mapped_workplaces_count || 0) === 0;
    return {
      ...checkCardStatus({
        blocked: issues.filter((item) => item.category === "location").length,
        warning: issues.length + (needsAttention ? 1 : 0),
        ready: Boolean(checkLaunchReadiness?.ready_for_sandbox_workplace_sync && !issues.length),
      }),
      issue: issues[0]?.message || "Payroll locations need full addresses, valid timezones, and later Check workplace sync.",
      cta: "Edit Payroll Locations",
    };
  }, [checkLaunchReadiness, managerIssues]);

  const employeeSummary = useMemo(() => {
    const counts = checkOnboardingOverview?.employee_counts || {};
    const issues = managerIssues.filter((item) => item.category === "employee");
    return {
      ...checkCardStatus({
        blocked: Number(counts.employees_missing_primary_payroll_location || 0),
        warning: Number(counts.eligible_employees_not_synced_to_check || 0) + issues.length,
        ready: Boolean(counts.eligible_payroll_employees > 0 && !issues.length),
      }),
      issue: issues[0]?.message || `${counts.eligible_payroll_employees || 0} eligible payroll employees are in scope for Check preparation.`,
      cta: "Review employees",
    };
  }, [checkOnboardingOverview, managerIssues]);

  const connectionSummary = useMemo(() => {
    const configured = Boolean(checkStatus?.configured);
    const sandboxSyncEnabled = Boolean(checkStatus?.sandbox_sync_enabled);
    if (!configured) {
      return { label: "Not configured", tone: "neutral", issue: "Check sandbox credentials are not configured yet.", cta: "Configure Check sandbox credentials" };
    }
    if (!sandboxSyncEnabled) {
      return { label: "Sandbox sync disabled", tone: "warning", issue: "Check credentials can be added, but sandbox sync remains intentionally disabled until data preview is clean.", cta: "Configure Check sandbox credentials" };
    }
    if (checkStatus?.check_connected) {
      return { label: "Connected", tone: "success", issue: "Company sync is connected for sandbox use.", cta: "Configure Check sandbox credentials" };
    }
    return { label: "Configured", tone: "neutral", issue: "Check credentials exist, but company sync has not been completed yet.", cta: "Configure Check sandbox credentials" };
  }, [checkStatus]);

  useEffect(() => {
    let active = true;
    const loadDepartments = async () => {
      try {
        const res = await api.get("/api/departments");
        if (active) {
          setDepartments(Array.isArray(res?.data) ? res.data : []);
        }
      } catch {
        if (active) {
          setDepartments([]);
        }
      }
    };
    loadDepartments();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setHistoryDepartmentFilter(departmentFilter ? String(departmentFilter) : "");
  }, [departmentFilter]);

  useEffect(() => {
    setHistoryEmployeeFilter(selectedRecruiter ? String(selectedRecruiter) : "");
  }, [selectedRecruiter]);

  useEffect(() => {
    setHistoryStartFilter(startDate || "");
    setHistoryEndFilter(endDate || "");
  }, [startDate, endDate]);

  useEffect(() => {
    if (historyEmployeeFilter && !historyScopedRecruiters.some((row) => String(row.id) === String(historyEmployeeFilter))) {
      setHistoryEmployeeFilter("");
    }
  }, [historyEmployeeFilter, historyScopedRecruiters]);

  useEffect(() => {
    if (isCheckIntent) {
      setCheckSection(CHECK_SECTION_OVERVIEW);
    }
  }, [isCheckIntent]);

  useEffect(() => {
    setCheckOnboardingPage(0);
  }, [checkOnboardingFilter, checkOnboardingSearch, checkOnboardingPageSize]);

  useEffect(() => {
    setCheckSelectedEmployeeIds((prev) => prev.filter((employeeId) => checkOnboardingRows.some((row) => row.employee_id === employeeId)));
  }, [checkOnboardingRows]);

  const providerDisplayName =
    provider === "quickbooks"
      ? "QuickBooks"
      : provider === "generic_csv" || provider === "csv_provider"
        ? "your payroll provider"
        : "your payroll provider";
  const employeeMatchLabel =
    provider === "quickbooks"
      ? "Match to QuickBooks employee"
      : "Match to payroll employee";
  const employeeCodeLabel =
    provider === "quickbooks"
      ? "QuickBooks employee ID or payroll employee code"
      : "Suggested CSV employee match";
  const payItemCodeLabel =
    provider === "quickbooks"
      ? "QuickBooks/payroll item code"
      : "Suggested payroll item";
  const handoffProviderOptions = useMemo(
    () => PROVIDER_OPTIONS.filter((option) => ["generic_csv", "quickbooks"].includes(option.value)),
    []
  );
  const workspacePrimaryTitle = isCheckIntent ? "Check Payroll Workspace" : "Payroll Handoff";
  const workspacePrimarySubtitle = isCheckIntent
    ? "Use this workspace to prepare Check-powered payroll readiness first. This is preparation only until sandbox credentials and sync are enabled. Fallback CSV handoff remains available if you need an export path."
    : "Build a payroll-ready CSV from approved time, payroll-ready leave, finalized payroll values, and saved payroll preview values.";
  const helpDefaultTab = shouldShowCheckWorkspace ? CHECK_HELP_TAB : HANDOFF_HELP_TAB;

  useEffect(() => {
    if (!helpOpen) {
      setHelpTab(helpDefaultTab);
    }
  }, [helpDefaultTab, helpOpen]);

  const payItemHelperText = (key) => {
    if (provider === "quickbooks" && key === "vacation_pay") {
      return "Choose or enter the QuickBooks payroll item used for vacation pay. Until QuickBooks item sync is enabled, this can be a temporary code for CSV testing.";
    }
    return provider === "quickbooks"
      ? "Enter the QuickBooks/payroll item code used for this earning. Until QuickBooks item sync is enabled, this can be a temporary code for CSV testing."
      : "Enter the export payroll item code used for this earning. This can be a temporary code for accountant CSV handoff testing.";
  };

  const focusRunPanel = () => {
    window.requestAnimationFrame(() => {
      runPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const openEmployeeProfiles = () => {
    window.location.assign("/manager/dashboard?view=employee-profiles");
  };

  const loadMappingData = async () => {
    setMappingLoading(true);
    try {
      const [employeeRes, payItemRes] = await Promise.all([
        payrollProviderSyncApi.listEmployeeMappings(provider),
        payrollProviderSyncApi.listPayItemMappings(provider),
      ]);
      setEmployeeMappings(employeeRes?.items || []);
      setPayItemMappings(payItemRes?.items || []);
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to load provider mappings/history."), "error");
    } finally {
      setMappingLoading(false);
    }
  };

  const loadQuickBooksCandidates = async () => {
    if (provider !== "quickbooks") {
      setEmployeeCandidateState({ available: false, reason: "", items: [] });
      setPayItemCandidateState({ available: false, reason: "", items: [] });
      return;
    }
    setCandidateLoading(true);
    try {
      const [employeeRes, payItemRes] = await Promise.all([
        payrollProviderSyncApi.listQuickBooksEmployeeCandidates(),
        payrollProviderSyncApi.listQuickBooksPayItemCandidates(),
      ]);
      setEmployeeCandidateState({
        available: Boolean(employeeRes?.available),
        reason: employeeRes?.reason || "",
        items: employeeRes?.items || [],
      });
      setPayItemCandidateState({
        available: Boolean(payItemRes?.available),
        reason: payItemRes?.reason || "",
        items: payItemRes?.items || [],
      });
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to load QuickBooks mapping candidates."), "error");
    } finally {
      setCandidateLoading(false);
    }
  };

  const loadCsvHandoffSuggestions = async (runId) => {
    if (!runId || provider !== "quickbooks") {
      setCsvSuggestionState({ employee_suggestions: [], pay_item_suggestions: [] });
      return;
    }
    setCsvSuggestionLoading(true);
    try {
      const data = await payrollProviderSyncApi.csvHandoffSuggestions(runId);
      setCsvSuggestionState(data || { employee_suggestions: [], pay_item_suggestions: [] });
    } catch (err) {
      setCsvSuggestionState({ employee_suggestions: [], pay_item_suggestions: [] });
      showMessage(await buildRequestErrorMessage(err, "Failed to load CSV handoff suggestions."), "error");
    } finally {
      setCsvSuggestionLoading(false);
    }
  };

  const loadRunHistory = async (overrides = {}) => {
    const params = {
      provider,
      limit: overrides.limit ?? runHistoryMeta.limit ?? 10,
      offset: overrides.offset ?? runHistoryMeta.offset ?? 0,
      ...(historyStatusFilter ? { status: historyStatusFilter } : {}),
      ...(historyDepartmentFilter ? { department_id: historyDepartmentFilter } : {}),
      ...(historyEmployeeFilter ? { employee_id: historyEmployeeFilter } : {}),
      ...(historyStartFilter ? { start_date: historyStartFilter } : {}),
      ...(historyEndFilter ? { end_date: historyEndFilter } : {}),
      ...overrides,
    };
    setHistoryLoading(true);
    try {
      const runsRes = await payrollProviderSyncApi.listRuns(params);
      setRunHistory(runsRes?.items || []);
      setRunHistoryMeta(runsRes?.pagination || {
        limit: params.limit,
        offset: params.offset,
        has_more: false,
        count: (runsRes?.items || []).length,
      });
      if (selectedRunId && !(runsRes?.items || []).some((item) => item.id === selectedRunId)) {
        // Keep selected run loaded in detail view even when it is outside the current page.
      } else if (!selectedRunId && (runsRes?.items || []).length) {
        setSelectedRunId((runsRes.items[0] || {}).id || null);
      }
      return runsRes;
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to load provider run history."), "error");
      return null;
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSelectedRun = async (runId, { validate = true } = {}) => {
    if (!runId) {
      setSelectedRunId(null);
      setRunData(null);
      setValidationData(null);
      setPayloadPreview(null);
      setRunNotice("");
      return;
    }
    setSelectedRunId(runId);
    try {
      const detail = await payrollProviderSyncApi.runDetail(runId);
      const run = detail?.run || null;
      setRunData(run);
      setRunError("");
      setRunNotice("");
      if (validate && runId) {
        const validated = await payrollProviderSyncApi.validateRun(runId);
        setValidationData(validated?.result || null);
        setRunData(validated?.run || run);
      } else {
        setValidationData(null);
      }
      await loadCsvHandoffSuggestions(runId);
      setPayloadPreview(null);
      focusRunPanel();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to load provider run detail."), "error");
    }
  };

  const loadSetupStatus = async () => {
    setStatusLoading(true);
    setSetupError("");
    try {
      const data = await payrollProviderSyncApi.setupStatus(provider);
      setSetupStatus(data);
      const derivedMessage = buildSetupErrorMessage(data, "");
      setSetupError(derivedMessage);
    } catch (err) {
      const message = await buildRequestErrorMessage(err, "Failed to load provider setup status.");
      setSetupError(message);
    } finally {
      setStatusLoading(false);
    }
  };

  const loadCheckReadiness = async () => {
    setCheckReadinessLoading(true);
    setCheckReadinessError("");
    try {
      const data = await payrollSetupApi.getCheckReadiness();
      setCheckReadiness(data || null);
    } catch (err) {
      const message = await buildRequestErrorMessage(err, "Failed to load local Check payroll readiness.");
      setCheckReadinessError(message);
    } finally {
      setCheckReadinessLoading(false);
    }
  };

  const loadCheckStatus = async () => {
    setCheckStatusLoading(true);
    setCheckStatusError("");
    try {
      const data = await payrollSetupApi.getCheckStatus();
      setCheckStatus(data || null);
    } catch (err) {
      const message = await buildRequestErrorMessage(err, "Failed to load Check sandbox status.");
      setCheckStatusError(message);
    } finally {
      setCheckStatusLoading(false);
    }
  };

  const loadCheckOnboardingOverview = async () => {
    setCheckOnboardingLoading(true);
    setCheckOnboardingError("");
    setCheckComponentLoading(true);
    try {
      const [overview, sessions] = await Promise.all([
        payrollSetupApi.getCheckOnboardingOverview(),
        payrollSetupApi.listCheckComponentSessions(),
      ]);
      setCheckOnboardingOverview(overview || null);
      setCheckComponentSessions(Array.isArray(sessions?.items) ? sessions.items : []);
    } catch (err) {
      const message = await buildRequestErrorMessage(err, "Failed to load Check onboarding overview.");
      setCheckOnboardingError(message);
    } finally {
      setCheckOnboardingLoading(false);
      setCheckComponentLoading(false);
    }
  };

  const loadCheckLaunchReadiness = async () => {
    setCheckLaunchReadinessLoading(true);
    setCheckLaunchReadinessError("");
    try {
      const data = await payrollSetupApi.getCheckLaunchReadiness();
      setCheckLaunchReadiness(data || null);
    } catch (err) {
      const message = await buildRequestErrorMessage(err, "Failed to load Check launch readiness.");
      setCheckLaunchReadinessError(message);
    } finally {
      setCheckLaunchReadinessLoading(false);
    }
  };

  const loadCheckPayrollPackagePreview = async (runId) => {
    if (!runId) {
      setCheckPackagePreview(null);
      setCheckPackagePreviewError("");
      return;
    }
    setCheckPackagePreviewLoading(true);
    setCheckPackagePreviewError("");
    try {
      const data = await payrollSetupApi.getCheckPayrollPackagePreview({ provider_run_id: runId });
      setCheckPackagePreview(data || null);
    } catch (err) {
      setCheckPackagePreview(null);
      const message = await buildRequestErrorMessage(err, "Failed to load Check payroll package preview.");
      setCheckPackagePreviewError(message);
    } finally {
      setCheckPackagePreviewLoading(false);
    }
  };

  const handleCheckOnboardingPlaceholder = async (entityType, localEntityId = null) => {
    setCheckComponentActionLoading(true);
    try {
      const data = await payrollSetupApi.createCheckComponentSessionPlaceholder({
        component_type: entityType === "company" ? "company_onboard" : "employee_onboard",
        entity_type: entityType,
        local_entity_id: localEntityId,
      });
      setCheckActionNotice("Local onboarding placeholder created. Check Components remain disabled until onboarding access is configured.");
      await loadCheckOnboardingOverview();
      return data;
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Unable to create onboarding placeholder."), "error");
      return null;
    } finally {
      setCheckComponentActionLoading(false);
    }
  };

  const handleEmployerOnboardingStart = async () => {
    setCheckComponentActionLoading(true);
    try {
      await payrollSetupApi.startCheckEmployerOnboarding();
      setCheckActionNotice("Employer onboarding preparation recorded.");
      await loadCheckOnboardingOverview();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Unable to start employer onboarding."), "error");
    } finally {
      setCheckComponentActionLoading(false);
    }
  };

  const handleEmployeeOnboardingAction = async (employeeId, mode) => {
    setCheckEmployeeOnboardingActionLoading((prev) => ({ ...prev, [`${mode}-${employeeId}`]: true }));
    try {
      if (mode === "send") {
        await payrollSetupApi.sendCheckEmployeeOnboardingInvite(employeeId, { delivery_channel: "email" });
      } else if (mode === "resend") {
        await payrollSetupApi.resendCheckEmployeeOnboardingInvite(employeeId, { delivery_channel: "email" });
      } else if (mode === "refresh") {
        await payrollSetupApi.refreshCheckEmployeeOnboardingStatus(employeeId);
      }
      setCheckActionNotice(
        mode === "refresh" ? "Employee onboarding status refreshed." : "Employee onboarding action recorded."
      );
      await loadCheckOnboardingOverview();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Unable to update employee onboarding."), "error");
    } finally {
      setCheckEmployeeOnboardingActionLoading((prev) => ({ ...prev, [`${mode}-${employeeId}`]: false }));
    }
  };

  const handleToggleAllVisibleCheckEmployees = () => {
    const visibleIds = pagedCheckOnboardingRows.map((row) => row.employee_id);
    setCheckSelectedEmployeeIds((prev) => {
      if (allVisibleCheckEmployeesSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  const handleToggleCheckEmployeeSelection = (employeeId) => {
    setCheckSelectedEmployeeIds((prev) => (
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]
    ));
  };

  const handleBulkCheckOnboardingAction = async (mode) => {
    if (!checkSelectedEmployeeIds.length) {
      showMessage("Select at least one employee first.", "warning");
      return;
    }
    setCheckBulkActionLoading(mode);
    try {
      let payload = null;
      if (mode === "send") {
        payload = await payrollSetupApi.bulkSendCheckEmployeeOnboardingInvites(checkSelectedEmployeeIds, { delivery_channel: "email" });
      } else if (mode === "resend") {
        payload = await payrollSetupApi.bulkResendCheckEmployeeOnboardingInvites(checkSelectedEmployeeIds, { delivery_channel: "email" });
      } else if (mode === "refresh") {
        payload = await payrollSetupApi.bulkRefreshCheckEmployeeOnboardingStatus(checkSelectedEmployeeIds, { delivery_channel: "email" });
      }
      const summary = payload?.summary || {};
      setCheckActionNotice(
        `${titleize(mode)} prepared for ${summary.selected || checkSelectedEmployeeIds.length} employees. `
        + `${summary.ready || 0} ready, ${summary.blocked || 0} blocked, ${summary.disabled || 0} disabled.`
      );
      await loadCheckOnboardingOverview();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Unable to prepare bulk employee onboarding."), "error");
    } finally {
      setCheckBulkActionLoading("");
    }
  };

  const handleCheckPayloadPreview = async (kind) => {
    setCheckPayloadLoading(true);
    setCheckActionNotice("");
    try {
      let data = null;
      if (kind === "company") data = await payrollSetupApi.getCheckCompanyPayload();
      if (kind === "workplaces") data = await payrollSetupApi.getCheckWorkplacePayloads();
      if (kind === "employees") data = await payrollSetupApi.getCheckEmployeePayloads();
      setCheckPayloadPreview({ kind, data });
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to preview Check payload."), "error");
    } finally {
      setCheckPayloadLoading(false);
    }
  };

  const handleCheckSandboxSync = async (kind) => {
    setCheckSyncLoading((prev) => ({ ...prev, [kind]: true }));
    setCheckActionNotice("");
    try {
      let data = null;
      if (kind === "company") data = await payrollSetupApi.syncCheckSandboxCompany();
      if (kind === "workplaces") data = await payrollSetupApi.syncCheckSandboxWorkplaces();
      if (kind === "employees") data = await payrollSetupApi.syncCheckSandboxEmployees();
      setCheckActionNotice(
        kind === "company"
          ? "Company sandbox sync completed."
          : kind === "workplaces"
            ? `Workplace sandbox sync completed${data?.synced_count !== undefined ? ` (${data.synced_count} synced)` : ""}.`
            : `Employee sandbox sync completed${data?.synced_count !== undefined ? ` (${data.synced_count} synced)` : ""}.`
      );
      await Promise.all([loadCheckStatus(), loadCheckReadiness()]);
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Check sandbox sync failed."), "error");
    } finally {
      setCheckSyncLoading((prev) => ({ ...prev, [kind]: false }));
    }
  };

  useEffect(() => {
    setRunData(null);
    setValidationData(null);
    setPayloadPreview(null);
    setCheckPackagePreview(null);
    setCheckPackagePreviewError("");
    setSelectedRunId(null);
    loadSetupStatus();
    loadCheckReadiness();
    loadCheckStatus();
    loadCheckLaunchReadiness();
    loadCheckOnboardingOverview();
    loadMappingData();
    loadQuickBooksCandidates();
    loadRunHistory({ offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  useEffect(() => {
    if (isCheckIntent) {
      setWorkspaceMode(WORKSPACE_MODE_CHECK);
      return;
    }
    setWorkspaceMode(WORKSPACE_MODE_HANDOFF);
  }, [isCheckIntent]);

  useEffect(() => {
    setEmployeePage(0);
  }, [employeeFilter, employeeSearch, selectedRunId]);

  useEffect(() => {
    setProviderScopeMode(defaultProviderScopeMode);
    setProviderSelectedEmployeeIds(defaultProviderEmployeeIds);
  }, [defaultProviderEmployeeIds, defaultProviderScopeMode]);

  useEffect(() => {
    if (selectedRunId && runData?.id !== selectedRunId) {
      loadSelectedRun(selectedRunId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRunId, runData?.id]);

  const buildRunPayload = () => ({
    provider,
    region,
    start_date: startDate,
    end_date: endDate,
    pay_date: endDate || undefined,
    employee_ids: availableEmployeeIds,
    // Province/state is best-effort from the current payroll object until it is
    // lifted from PayrollFilters in a dedicated refactor.
    province_state: provinceOrState || undefined,
    pay_frequency: payFrequency || undefined,
  });

  const handlePreview = async () => {
    if (!canPrepare) return;
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewData(null);
    setRunNotice("");
    try {
      const data = await payrollProviderSyncApi.rawPreview(buildRunPayload());
      setPreviewData(data?.preview || data);
    } catch (err) {
      const message = await buildRequestErrorMessage(err, "Failed to preview payroll-ready data.");
      setPreviewError(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrepareCsv = async () => {
    if (!canPrepare) return;
    setPrepareCsvLoading(true);
    setPreviewError("");
    setRunError("");
    setRunNotice("");
    setPayloadPreview(null);
    try {
      const previewResponse = await payrollProviderSyncApi.rawPreview(buildRunPayload());
      const preview = previewResponse?.preview || previewResponse;
      setPreviewData(preview);
      if (
        preview &&
        formatNumber(preview?.line_count) === 0 &&
        formatNumber(preview?.adjustment_line_count) === 0
      ) {
        setValidationData(null);
        showMessage("No payroll-ready time, leave, or saved adjustments were found for this selection.", "info");
        return;
      }

      let currentRunId = null;
      try {
        const createResponse = await payrollProviderSyncApi.createFromRaw(buildRunPayload());
        const createdRun = createResponse?.run || createResponse;
        currentRunId = createdRun?.id || createResponse?.id || null;
      } catch (err) {
        const duplicateRunId = err?.response?.data?.existing_run_id;
        const duplicateError = err?.response?.data?.error;
        if (err?.response?.status === 409 && duplicateError === "duplicate_source_hash" && duplicateRunId) {
          currentRunId = duplicateRunId;
          setRunNotice("A provider run already exists for this payroll snapshot. We opened it.");
        } else {
          throw err;
        }
      }

      const historyRes = await loadRunHistory({ offset: 0 });
      if (!currentRunId) {
        currentRunId = historyRes?.items?.[0]?.id || null;
      }
      if (!currentRunId) {
        throw new Error("provider_run_not_available");
      }

      const detail = await payrollProviderSyncApi.runDetail(currentRunId);
      setRunData(detail?.run || null);
      setSelectedRunId(currentRunId);

      let validateResponse = await payrollProviderSyncApi.validateRun(currentRunId);
      let validation = validateResponse?.result || null;
      let nextRun = validateResponse?.run || detail?.run || null;
      setValidationData(validation);
      setRunData(nextRun);

      const missingEmployeeMappings = (validation?.missing_employee_map_ids || []).length > 0;
      const missingPayItemMappings = (validation?.missing_pay_item_keys || []).length > 0;
      const quickBooksCandidatesUnavailable =
        provider !== "quickbooks" ||
        ((missingEmployeeMappings && !employeeCandidateState.available) ||
          (missingPayItemMappings && !payItemCandidateState.available));
      const shouldApplySuggestions =
        (provider === "quickbooks" || provider === "generic_csv" || provider === "csv_provider") &&
        quickBooksCandidatesUnavailable;

      if (shouldApplySuggestions) {
        const applied = await payrollProviderSyncApi.applyCsvHandoffSuggestions(currentRunId);
        validation = applied?.result || validation;
        nextRun = applied?.run || nextRun;
        setValidationData(validation);
        setRunData(nextRun);
        await loadMappingData();
      }

      await loadCsvHandoffSuggestions(currentRunId);
      await loadRunHistory({ offset: 0 });
      focusRunPanel();
      showMessage(validation?.csv_download_allowed ? "Payroll Handoff CSV ready." : "Payroll Handoff CSV not ready yet. Fix the items listed below.", validation?.csv_download_allowed ? "success" : "warning");
    } catch (err) {
      const message = err?.message === "provider_run_not_available"
        ? "Could not determine the current payroll handoff batch. Refresh and try again."
        : await buildRequestErrorMessage(err, "Failed to prepare Payroll Handoff CSV.");
      setRunError(message);
      showMessage(message, "error");
    } finally {
      setPrepareCsvLoading(false);
    }
  };

  const handleCreateRun = async () => {
    if (!canPrepare || !previewData) return;
    setCreateLoading(true);
    setRunError("");
    setRunNotice("");
    setValidationData(null);
    setPayloadPreview(null);
    try {
      const data = await payrollProviderSyncApi.createFromRaw(buildRunPayload());
      const createdRun = data?.run || data;
      await loadMappingData();
      const historyRes = await loadRunHistory({ offset: 0 });
      const resolvedRunId = createdRun?.id || data?.id || historyRes?.items?.[0]?.id || null;
      if (resolvedRunId) {
        await loadSelectedRun(resolvedRunId);
      } else {
        setRunData(createdRun || null);
        setSelectedRunId(createdRun?.id || null);
        focusRunPanel();
      }
      showMessage("Payroll handoff batch created.", "success");
    } catch (err) {
      const status = err?.response?.status;
      const duplicateRunId = err?.response?.data?.existing_run_id;
      const duplicateError = err?.response?.data?.error;
      if (status === 409 && duplicateError === "duplicate_source_hash" && duplicateRunId) {
        setRunNotice("A provider run already exists for this same payroll-ready snapshot. We opened the existing run from history.");
        await loadSelectedRun(duplicateRunId);
        await loadRunHistory({ offset: 0 });
        showMessage("Existing provider run opened.", "info");
      } else {
        const message = await buildRequestErrorMessage(err, "Failed to create provider run.");
        setRunError(message);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleValidateRun = async () => {
    const runId = activeRunId;
    if (!runId) {
      showMessage("Create or select a provider run first.", "warning");
      return;
    }
    setValidationLoading(true);
    setRunNotice("");
    try {
      if (!runData?.id) {
        await loadSelectedRun(runId, { validate: false });
      }
      const data = await payrollProviderSyncApi.validateRun(runId);
      setValidationData(data?.result || data);
      setRunData(data?.run || runData);
      await loadCsvHandoffSuggestions(runId);
      await loadRunHistory();
      showMessage("Payroll handoff batch checked.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Run validation failed."), "error");
    } finally {
      setValidationLoading(false);
    }
  };

  const handlePreviewPayload = async () => {
    const runId = activeRunId;
    if (!runId) {
      showMessage("Create or select a provider run first.", "warning");
      return;
    }
    setPayloadLoading(true);
    try {
      if (!runData?.id) {
        await loadSelectedRun(runId, { validate: false });
      }
      const data = await payrollProviderSyncApi.quickbooksPayloadPreview(runId);
      setPayloadPreview(data);
      await loadRunHistory();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to preview provider payload."), "error");
    } finally {
      setPayloadLoading(false);
    }
  };

  const handleCsvDownload = async () => {
    const runId = activeRunId;
    if (!runId) {
      showMessage("Create or select a provider run first.", "warning");
      return;
    }
    setDownloadLoading(true);
    try {
      if (!runData?.id) {
        await loadSelectedRun(runId, { validate: false });
      }
      const resp = await payrollProviderSyncApi.csvDownload(runId);
      const blob = new Blob([resp.data], { type: resp.headers["content-type"] || "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `provider_run_${runId}_${provider}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      await loadRunHistory();
    } catch (err) {
      const status = err?.response?.status;
      const apiError = err?.response?.data?.error;
      if (status === 400 && apiError === "validation_failed") {
        showMessage("CSV cannot be downloaded yet. Fix the items listed in 'Fix before export'.", "error");
      } else {
        showMessage(await buildRequestErrorMessage(err, "Failed to download provider CSV."), "error");
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleApplyCsvSuggestions = async () => {
    if (!runData?.id) return;
    setApplySuggestionsLoading(true);
    try {
      const data = await payrollProviderSyncApi.applyCsvHandoffSuggestions(runData.id);
      setValidationData(data?.result || null);
      setRunData(data?.run || runData);
      await loadMappingData();
      await loadRunHistory();
      await loadCsvHandoffSuggestions(runData.id);
      showMessage("Suggested CSV handoff matches applied.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to apply suggested CSV handoff matches."), "error");
    } finally {
      setApplySuggestionsLoading(false);
    }
  };

  const handleHistoryValidate = async (runId, fallbackRun) => {
    try {
      await loadSelectedRun(runId);
      const data = await payrollProviderSyncApi.validateRun(runId);
      setValidationData(data?.result || data);
      setRunData(data?.run || fallbackRun || null);
      focusRunPanel();
      await loadRunHistory();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Run validation failed."), "error");
    }
  };

  const handleHistoryPreviewPayload = async (runId) => {
    try {
      await loadSelectedRun(runId);
      const data = await payrollProviderSyncApi.quickbooksPayloadPreview(runId);
      setPayloadPreview(data);
      focusRunPanel();
      await loadRunHistory();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to preview provider payload."), "error");
    }
  };

  const handleHistoryCsvDownload = async (runId, fallbackProvider) => {
    try {
      await loadSelectedRun(runId);
      const resp = await payrollProviderSyncApi.csvDownload(runId);
      const blob = new Blob([resp.data], { type: resp.headers["content-type"] || "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `provider_run_${runId}_${fallbackProvider || provider}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      await loadRunHistory();
      focusRunPanel();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to download provider CSV."), "error");
    }
  };

  const handleBootstrapPayItems = async () => {
    setBootstrapPayItemsLoading(true);
    try {
      await payrollProviderSyncApi.bootstrapPayItemDefaults("quickbooks");
      await loadSetupStatus();
      await loadMappingData();
      showMessage("Pay item placeholders created.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to bootstrap pay item placeholders."), "error");
    } finally {
      setBootstrapPayItemsLoading(false);
    }
  };

  const handleBootstrapEmployees = async () => {
    setBootstrapEmployeesLoading(true);
    try {
      await payrollProviderSyncApi.bootstrapEmployeesFromLegacy("quickbooks");
      await loadSetupStatus();
      await loadMappingData();
      showMessage("Employee mappings bootstrapped from legacy IDs.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to bootstrap employee mappings."), "error");
    } finally {
      setBootstrapEmployeesLoading(false);
    }
  };

  const setupCapabilities = setupStatus?.capabilities || {};
  const statusReadiness = setupStatus?.readiness || "unknown";
  const isQuickBooksAccountingOnly =
    provider === "quickbooks" &&
    statusReadiness === "accounting_only";

  const mappedEmployeeIds = useMemo(
    () =>
      new Set(
        employeeMappings
          .filter((item) => item.provider === provider && item.provider_employee_id)
          .map((item) => String(item.employee_id))
      ),
    [employeeMappings, provider]
  );

  const mappedPayItemKeys = useMemo(
    () =>
      new Set(
        payItemMappings
          .filter((item) => item.provider === provider && item.provider_item_id && item.is_active)
          .map((item) => item.local_key)
      ),
    [payItemMappings, provider]
  );

  const selectedHistoryRun = useMemo(
    () => (runHistory || []).find((item) => item.id === selectedRunId) || null,
    [runHistory, selectedRunId]
  );
  const activeRun = runData || selectedHistoryRun || null;
  const activeRunId = runData?.id || selectedRunId || selectedHistoryRun?.id || null;
  useEffect(() => {
    loadCheckPayrollPackagePreview(activeRunId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRunId]);
  const currentRunRows = activeRun?.employee_rows || [];
  const currentRunEmployeeIds = useMemo(
    () => currentRunRows.map((row) => String(row.employee_id)),
    [currentRunRows]
  );
  const unmappedRunEmployees = useMemo(
    () =>
      currentRunRows.filter((row) => !row.provider_employee_id && !mappedEmployeeIds.has(String(row.employee_id))),
    [currentRunRows, mappedEmployeeIds]
  );
  const currentRunKeys = useMemo(
    () =>
      Array.from(
        new Set(
          (currentRunRows || []).flatMap((row) =>
            (row.earning_lines || []).map((line) => line.earning_key).filter(Boolean)
          )
        )
      ).sort(),
    [currentRunRows]
  );
  const requiredPayItemKeys = sortPayItemKeys(validationData?.required_pay_item_keys_for_run || currentRunKeys);
  const missingPayItemKeys = validationData?.missing_pay_item_keys || [];
  const optionalMappedPayItemKeys = sortPayItemKeys(
    validationData?.optional_mapped_pay_item_keys || Array.from(mappedPayItemKeys).filter((key) => !requiredPayItemKeys.includes(key)).sort()
  );
  const corePayItemMappings = useMemo(
    () =>
      [...payItemMappings.filter((row) => CORE_PAY_ITEM_KEYS.includes(row.local_key))].sort(
        (a, b) => comparePayItemKey(a.local_key, b.local_key)
      ),
    [payItemMappings]
  );
  const optionalPayItemMappings = useMemo(
    () =>
      [...payItemMappings.filter((row) => !CORE_PAY_ITEM_KEYS.includes(row.local_key))].sort(
        (a, b) => comparePayItemKey(a.local_key, b.local_key)
      ),
    [payItemMappings]
  );
  const unmappedEmployeeIdsFromValidation = formatList(validationData?.missing_employee_map_ids).map((id) => String(id));
  const sourceHashChanged = useMemo(() => {
    if (!previewData?.source_hash) return false;
    const previous = (runHistory || []).find(
      (item) =>
        item.provider === provider &&
        item.start_date === startDate &&
        item.end_date === endDate &&
        item.source_hash !== previewData.source_hash
    );
    return Boolean(previous);
  }, [previewData, runHistory, provider, startDate, endDate]);
  const currentPeriodHistory = useMemo(
    () =>
      (runHistory || []).filter(
        (item) =>
          item.provider === provider &&
          item.start_date === startDate &&
          item.end_date === endDate
      ),
    [provider, runHistory, startDate, endDate]
  );
  const latestPreviousRun = currentPeriodHistory.find((item) => item.id !== runData?.id);
  const selectedRunAdjustmentTotal = formatNumber(activeRun?.request_payload_json?.adjustments?.adjustment_total);
  const selectedRunAdjustmentCount = formatNumber(activeRun?.request_payload_json?.adjustments?.adjustment_line_count);
  const previewBlockingErrors = formatList(previewData?.errors).filter(isBlockingPreviewIssue);
  const previewCapabilityWarnings = formatList(previewData?.errors).filter(isNonBlockingCapabilityIssue);
  const previewHasNoExportableData = Boolean(previewData) &&
    formatNumber(previewData?.line_count) === 0 &&
    formatNumber(previewData?.adjustment_line_count) === 0;
  const previewPayrollValueSource = previewData?.payroll_value_source || null;
  const previewPayrollValueSourceMessage = previewData?.payroll_value_source_message
    || payrollValueSourceFallbackMessage(previewPayrollValueSource);
  const previewPayrollValueInfoMessages = previewData?.payroll_value_info_messages || [];
  const activeRunPayrollValueSource = activeRun?.request_payload_json?.payroll_value_source || null;
  const activeRunPayrollValueSourceMessage = activeRun?.request_payload_json?.payroll_value_source_message
    || payrollValueSourceFallbackMessage(activeRunPayrollValueSource);
  const activeRunPayrollValueInfoMessages = activeRun?.request_payload_json?.payroll_value_info_messages || [];
  const showPreviewSavedAdjustmentsMessage = Boolean(previewData) &&
    !previewData.saved_adjustments_included &&
    previewPayrollValueSource === "operational_raw";
  const showActiveRunSourceMessage = Boolean(activeRunId) &&
    (!previewData || activeRunPayrollValueSourceMessage !== previewPayrollValueSourceMessage);
  const showActiveRunInfoMessages = Boolean(activeRunId) &&
    (!previewData || JSON.stringify(activeRunPayrollValueInfoMessages) !== JSON.stringify(previewPayrollValueInfoMessages));
  const validationOnlyCapabilityLimitation =
    Boolean(validationData?.errors?.length) &&
    (validationData?.csv_download_allowed === true) &&
    (validationData?.csv_blocking_errors || []).length === 0;
  const csvDownloadAllowed = Boolean(activeRunId && validationData && (validationData?.csv_download_allowed ?? false));
  const csvBlockingErrors = validationData?.csv_blocking_errors || [];
  const fixBeforeExportIssues = csvBlockingErrors.length ? csvBlockingErrors : previewBlockingErrors;
  const hasFixBeforeExportIssues = fixBeforeExportIssues.length > 0;
  const currentRunContext = { runRows: currentRunRows, recruiters: scopedRecruiters };
  const previewIssueContext = { runRows: [], recruiters: scopedRecruiters };
  const missingEmployeeIssueRows = useMemo(() => {
    const rows = unmappedRunEmployees.map((row) => ({
      employee_id: row.employee_id,
      employee_name: row.employee_name_snapshot || `Employee ${row.employee_id}`,
      employee_email: row.employee_email_snapshot || "",
      provider_employee_id: "",
      source: "run_unmapped",
    }));
    unmappedEmployeeIdsFromValidation.forEach((employeeId) => {
      if (rows.some((row) => String(row.employee_id) === String(employeeId))) return;
      const recruiter = scopedRecruiters.find((row) => String(row.id) === String(employeeId));
      rows.push({
        employee_id: employeeId,
        employee_name: recruiter ? `${recruiter.first_name} ${recruiter.last_name}`.trim() : `Employee ${employeeId}`,
        employee_email: recruiter?.email || "",
        provider_employee_id: "",
        source: "validation_unmapped",
      });
    });
    return rows;
  }, [scopedRecruiters, unmappedEmployeeIdsFromValidation, unmappedRunEmployees]);
  const chipBaseSx = {
    height: 24,
    minWidth: 44,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: 0,
    "& .MuiChip-label": {
      px: 1,
    },
  };
  const chipPalette = {
    active: (theme) => ({
      bgcolor: theme.palette.primary.dark,
      color: theme.palette.primary.contrastText,
      borderColor: theme.palette.primary.dark,
    }),
    neutral: (theme) => ({
      bgcolor: alpha(theme.palette.primary.main, 0.08),
      color: theme.palette.text.primary,
      borderColor: alpha(theme.palette.primary.main, 0.2),
    }),
    success: (theme) => ({
      bgcolor: theme.palette.success.dark,
      color: theme.palette.success.contrastText,
      borderColor: theme.palette.success.dark,
    }),
    warning: (theme) => ({
      bgcolor: alpha(theme.palette.warning.main, 0.16),
      color: theme.palette.warning.dark,
      borderColor: alpha(theme.palette.warning.main, 0.48),
    }),
    danger: (theme) => ({
      bgcolor: alpha(theme.palette.error.main, 0.14),
      color: theme.palette.error.dark,
      borderColor: alpha(theme.palette.error.main, 0.44),
    }),
  };
  const chipSx = {
    active: (theme) => ({
      ...chipBaseSx,
      border: "1px solid",
      ...chipPalette.active(theme),
    }),
    neutral: (theme) => ({
      ...chipBaseSx,
      border: "1px solid",
      ...chipPalette.neutral(theme),
    }),
    success: (theme) => ({
      ...chipBaseSx,
      border: "1px solid",
      ...chipPalette.success(theme),
    }),
    warning: (theme) => ({
      ...chipBaseSx,
      border: "1px solid",
      ...chipPalette.warning(theme),
    }),
    danger: (theme) => ({
      ...chipBaseSx,
      border: "1px solid",
      ...chipPalette.danger(theme),
    }),
  };
  const lowerAccordionSx = {
    bgcolor: "#fbfcff",
    border: "1px solid #dbe5ff",
    boxShadow: "none",
  };

  const employeeMappingRows = useMemo(() => {
    const mappedRows = employeeMappings.filter((row) => row.provider === provider);
    const currentUnmappedIds = new Set(unmappedRunEmployees.map((row) => String(row.employee_id)));
    let rows = [];
    if (employeeFilter === "current_run_unmapped") {
      rows = unmappedRunEmployees.map((row) => ({
        employee_id: row.employee_id,
        employee_name: row.employee_name_snapshot || `Employee ${row.employee_id}`,
        employee_email: row.employee_email_snapshot || "",
        provider_employee_id: "",
        provider_environment: runData?.provider_environment,
        source: "run_unmapped",
      }));
    } else if (employeeFilter === "unmapped_all") {
      rows = mappedRows
        .filter(() => false);
      const mappedIds = new Set(mappedRows.filter((item) => item.provider_employee_id).map((item) => String(item.employee_id)));
      rows = (filteredRecruiters.length ? filteredRecruiters : []).filter((row) => !mappedIds.has(String(row.id))).map((row) => ({
        employee_id: row.id,
        employee_name: row.name || `${row.first_name || ""} ${row.last_name || ""}`.trim() || `Employee ${row.id}`,
        employee_email: row.email || "",
        provider_employee_id: "",
        source: currentUnmappedIds.has(String(row.id)) ? "run_unmapped" : "company_unmapped",
      }));
    } else if (employeeFilter === "mapped") {
      rows = mappedRows.filter((row) => row.provider_employee_id).map((row) => ({
        employee_id: row.employee_id,
        employee_name: row.employee_name || `Employee ${row.employee_id}`,
        employee_email: row.employee_email || "",
        provider_employee_id: row.provider_employee_id,
        provider_environment: row.provider_environment,
        source: "mapped",
      }));
    } else {
      rows = [
        ...mappedRows.map((row) => ({
          employee_id: row.employee_id,
          employee_name: row.employee_name || `Employee ${row.employee_id}`,
          employee_email: row.employee_email || "",
          provider_employee_id: row.provider_employee_id,
          provider_environment: row.provider_environment,
          source: row.provider_employee_id ? "mapped" : "company_unmapped",
        })),
        ...unmappedRunEmployees
          .filter((row) => !mappedRows.some((mapped) => String(mapped.employee_id) === String(row.employee_id)))
          .map((row) => ({
            employee_id: row.employee_id,
            employee_name: row.employee_name_snapshot || `Employee ${row.employee_id}`,
            employee_email: row.employee_email_snapshot || "",
            provider_employee_id: "",
            provider_environment: runData?.provider_environment,
            source: "run_unmapped",
          })),
      ];
    }
    const search = employeeSearch.trim().toLowerCase();
    if (search) {
      rows = rows.filter((row) =>
        [row.employee_name, row.employee_email, row.provider_employee_id, row.employee_id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search))
      );
    }
    const seen = new Set();
    return rows.filter((row) => {
      const key = `${row.employee_id}:${row.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [employeeMappings, employeeFilter, employeeSearch, filteredRecruiters, provider, runData?.provider_environment, unmappedRunEmployees]);
  const previewMissingEmployeeIssueRows = formatList(previewBlockingErrors)
    .filter((item) => EMPLOYEE_MAPPING_ERROR_CODES.has(issueCode(item)) && item?.employee_id)
    .map((item) => {
      const recruiter = scopedRecruiters.find((row) => String(row.id) === String(item.employee_id));
      return {
        employee_id: item.employee_id,
        employee_name: recruiter ? `${recruiter.first_name} ${recruiter.last_name}`.trim() : employeeLabelFromContext(item.employee_id, [], scopedRecruiters),
        employee_email: recruiter?.email || "",
      };
    });
  const previewMissingPayItemKeys = sortPayItemKeys(
    formatList(previewBlockingErrors)
      .filter((item) => PAY_ITEM_MAPPING_ERROR_CODES.has(issueCode(item)) && item?.key)
      .map((item) => item.key)
  );
  const previewMissingRegionRows = formatList(previewBlockingErrors)
    .filter((item) => REGION_METADATA_ERROR_CODES.has(issueCode(item)) && item?.employee_id)
    .map((item) => ({
      employee_id: item.employee_id,
      employee_name: employeeLabelFromContext(item.employee_id, [], scopedRecruiters),
    }));
  const checkPackageWarnings = formatList(checkPackagePreview?.warnings);
  const checkPackageBlockers = formatList(checkPackagePreview?.blockers);
  const checkPackageItems = formatList(checkPackagePreview?.items);
  const checkPackageFieldMappings = formatList(checkPackagePreview?.field_mapping_rows);
  const createRunLabel = hasFixBeforeExportIssues ? "Create run to fix mappings" : "Create provider run";
  const managerBlockingMessages = previewHasNoExportableData
    ? ["No payroll-ready time, leave, or saved adjustments were found for this selection."]
    : fixBeforeExportIssues.map((item) => managerFriendlyMessage(item, validationData ? currentRunContext : previewIssueContext));
  const csvReady = Boolean(csvDownloadAllowed);
  const csvStatusTitle = csvReady ? "CSV ready" : "CSV not ready";
  const currentScopeLabel = historyEmployeeFilter
    ? "Current employee"
    : historyDepartmentFilter
      ? "Department"
      : "Company-wide";
  const previewSourceChipLabel = `Source: ${titleize((previewPayrollValueSource || "operational_raw").replace("finalized_payroll", "finalized payroll").replace("saved_draft_payroll", "saved draft payroll").replace("operational_raw", "operational raw"))}`;
  const previewEmployeesChipLabel = `Employees: ${previewData?.employee_count ?? availableEmployeeIds.length ?? 0}`;
  const previewPeriodChipLabel = `Period: ${(startDate || "—")} to ${(endDate || "—")}`;
  const previewExportedTotalChipLabel = `Exported total: ${previewData?.gross_preview_total ?? 0}`;
  const csvStatusSeverity = csvReady ? "success" : "warning";
  const csvBlockedReasonText = !activeRunId
    ? "Create or select a provider run first."
    : !validationData
      ? "Check CSV readiness before downloading."
        : csvBlockingErrors.length
          ? "Fix the items listed in 'Fix before export' before downloading CSV."
          : "";
  const csvEmployeeSuggestionsById = useMemo(
    () => Object.fromEntries((csvSuggestionState.employee_suggestions || []).map((item) => [String(item.employee_id), item])),
    [csvSuggestionState.employee_suggestions]
  );
  const csvPayItemSuggestionsByKey = useMemo(
    () => Object.fromEntries((csvSuggestionState.pay_item_suggestions || []).map((item) => [item.local_key, item])),
    [csvSuggestionState.pay_item_suggestions]
  );
  const onlyMappingCsvBlockers = Boolean(
    validationData &&
    csvBlockingErrors.length &&
    csvBlockingErrors.every((item) => EMPLOYEE_MAPPING_ERROR_CODES.has(issueCode(item)) || PAY_ITEM_MAPPING_ERROR_CODES.has(issueCode(item)))
  );
  const canApplyCsvSuggestions = Boolean(
    runData?.id &&
    (provider === "quickbooks" || provider === "generic_csv" || provider === "csv_provider") &&
    onlyMappingCsvBlockers &&
    ((csvSuggestionState.employee_suggestions || []).length || (csvSuggestionState.pay_item_suggestions || []).length)
  );
  const suggestedEmployeeMatches = useMemo(() => {
    const suggestions = {};
    [...previewMissingEmployeeIssueRows, ...missingEmployeeIssueRows].forEach((row) => {
      suggestions[row.employee_id] = buildEmployeeSuggestion(row, employeeCandidateState.items);
    });
    return suggestions;
  }, [employeeCandidateState.items, missingEmployeeIssueRows, previewMissingEmployeeIssueRows]);
  const suggestedPayItemMatches = useMemo(() => {
    const suggestions = {};
    [...previewMissingPayItemKeys, ...missingPayItemKeys].forEach((key) => {
      suggestions[key] = buildPayItemSuggestion(key, payItemCandidateState.items);
    });
    return suggestions;
  }, [missingPayItemKeys, payItemCandidateState.items, previewMissingPayItemKeys]);
  const employeePageSize = 10;
  const pagedEmployeeMappingRows = useMemo(
    () => employeeMappingRows.slice(employeePage * employeePageSize, (employeePage + 1) * employeePageSize),
    [employeeMappingRows, employeePage]
  );

  const handleEmployeeMapChange = (employeeId, value) => {
    setEmployeeMappingDrafts((prev) => ({ ...prev, [employeeId]: value }));
  };

  const handleEmployeeCandidateSelect = (employeeId, candidate) => {
    setEmployeeCandidateSelections((prev) => ({ ...prev, [employeeId]: candidate || null }));
    if (candidate?.id) {
      setEmployeeMappingDrafts((prev) => ({ ...prev, [employeeId]: candidate.id }));
    }
  };

  const saveEmployeeMapping = async (row) => {
    const providerEmployeeId = (employeeMappingDrafts[row.employee_id] || "").trim();
    if (!providerEmployeeId) {
      showMessage(`${employeeCodeLabel} is required.`, "warning");
      return;
    }
    try {
      await payrollProviderSyncApi.linkEmployeeMapping(row.employee_id, {
        provider,
        provider_employee_id: providerEmployeeId,
        provider_display_name: row.employee_name_snapshot || row.employee_name,
      });
      await loadMappingData();
      if (runData?.id) {
        const refreshed = await payrollProviderSyncApi.runDetail(runData.id);
        setRunData(refreshed?.run || runData);
        if (validationData) {
          const validated = await payrollProviderSyncApi.validateRun(runData.id);
          setValidationData(validated?.result || validationData);
        }
      }
      await loadRunHistory();
      showMessage("Employee mapping saved.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to save employee mapping."), "error");
    }
  };

  const savePayItemMapping = async () => {
    const localKey = (payItemDraft.local_key || "").trim();
    if (!localKey || !payItemDraft.provider_item_id.trim()) {
      showMessage("Local key and provider item ID are required.", "warning");
      return;
    }
    const existing = payItemMappings.find((item) => item.local_key === localKey && item.provider_item_id);
    if (existing) {
      showMessage("That pay item key is already mapped. Existing mappings are not overwritten here.", "info");
      return;
    }
    try {
      await payrollProviderSyncApi.upsertPayItemMapping({
        provider,
        local_key: localKey,
        item_category: localKey === "non_taxable_reimbursement" ? "reimbursement" : "earning",
        provider_item_id: payItemDraft.provider_item_id.trim(),
        provider_item_name: payItemDraft.provider_item_name.trim() || localKey,
      });
      setPayItemDraft({ local_key: "", provider_item_id: "", provider_item_name: "" });
      await loadMappingData();
      if (runData?.id && validationData) {
        const validated = await payrollProviderSyncApi.validateRun(runData.id);
        setValidationData(validated?.result || validationData);
      }
      showMessage("Pay item mapping saved.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to save pay item mapping."), "error");
    }
  };

  const saveMissingPayItemMapping = async (localKey) => {
    const draft = missingPayItemDrafts[localKey] || {};
    const providerItemId = String(draft.provider_item_id || "").trim();
    const providerItemName = String(draft.provider_item_name || "").trim();
    if (!providerItemId) {
      showMessage(`${payItemCodeLabel} is required.`, "warning");
      return;
    }
    try {
      await payrollProviderSyncApi.upsertPayItemMapping({
        provider,
        local_key: localKey,
        item_category: localKey === "non_taxable_reimbursement" ? "reimbursement" : "earning",
        provider_item_id: providerItemId,
        provider_item_name: providerItemName || localKey,
      });
      setMissingPayItemDrafts((prev) => ({
        ...prev,
        [localKey]: { provider_item_id: "", provider_item_name: "" },
      }));
      await loadMappingData();
      if (runData?.id) {
        const validated = await payrollProviderSyncApi.validateRun(runData.id);
        setValidationData(validated?.result || validationData);
        setRunData(validated?.run || runData);
      }
      showMessage("Pay item mapping saved.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to save pay item mapping."), "error");
    }
  };

  const handlePayItemCandidateSelect = (localKey, candidate) => {
    setPayItemCandidateSelections((prev) => ({ ...prev, [localKey]: candidate || null }));
    setMissingPayItemDrafts((prev) => ({
      ...prev,
      [localKey]: {
        ...(prev[localKey] || {}),
        provider_item_id: candidate?.id || "",
        provider_item_name: candidate?.display_name || candidate?.name || "",
      },
    }));
  };

  const applySuggestedEmployeeMatch = async (row) => {
    const suggestion = csvSuggestionState.employee_suggestions?.find((item) => String(item.employee_id) === String(row.employee_id));
    if (!suggestion) {
      showMessage("No suggested CSV employee match is available for this employee.", "warning");
      return;
    }
    try {
      await payrollProviderSyncApi.linkEmployeeMapping(row.employee_id, {
        provider,
        provider_employee_id: suggestion.provider_employee_id,
        provider_display_name: suggestion.provider_display_name,
        source_payload_json: suggestion.metadata || {},
      });
      await loadMappingData();
      if (runData?.id) {
        const validated = await payrollProviderSyncApi.validateRun(runData.id);
        setValidationData(validated?.result || validationData);
        setRunData(validated?.run || runData);
        await loadCsvHandoffSuggestions(runData.id);
      }
      await loadRunHistory();
      showMessage("Suggested CSV employee match applied.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to save suggested employee match."), "error");
    }
  };

  const applySuggestedPayItemMatch = async (localKey) => {
    const suggestion = csvSuggestionState.pay_item_suggestions?.find((item) => item.local_key === localKey);
    if (!suggestion) {
      showMessage("No suggested payroll item is available for this key.", "warning");
      return;
    }
    try {
      await payrollProviderSyncApi.upsertPayItemMapping({
        provider,
        local_key: localKey,
        item_category: suggestion.item_category || (localKey === "non_taxable_reimbursement" ? "reimbursement" : "earning"),
        provider_item_id: suggestion.provider_item_id,
        provider_item_code: suggestion.provider_item_id,
        provider_item_name: suggestion.provider_item_name,
        metadata_json: suggestion.metadata || {},
      });
      await loadMappingData();
      if (runData?.id) {
        const validated = await payrollProviderSyncApi.validateRun(runData.id);
        setValidationData(validated?.result || validationData);
        setRunData(validated?.run || runData);
        await loadCsvHandoffSuggestions(runData.id);
      }
      await loadRunHistory();
      showMessage("Suggested payroll item applied.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to save suggested payroll item."), "error");
    }
  };

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
          <SectionHeading
            title={workspacePrimaryTitle}
            variant="h5"
            tooltip="Build a payroll-ready CSV from approved time, payroll-ready leave, finalized payroll values, and saved payroll preview values."
          />
          {!shouldShowCheckWorkspace ? (
            <Button
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setHelpOpen(true)}
            >
              Payroll guide
            </Button>
          ) : null}
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
          <Chip
            label={isCheckIntent ? "Check payroll = primary configured path" : "Payroll Handoff = recommended payroll handoff workflow"}
            sx={isCheckIntent ? chipSx.active : chipSx.success}
          />
          {provider === "quickbooks" && <Chip label="QuickBooks official import format: not verified yet" sx={chipSx.warning} />}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {workspacePrimarySubtitle}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
          <Chip label={isCheckIntent ? "Check payroll planning + fallback handoff" : "CSV handoff only"} sx={chipSx.neutral} />
          <Tooltip title="This workflow exports a CSV for your accountant or payroll provider. It does not submit payroll or pay employees directly.">
            <Chip label="How it works" sx={chipSx.neutral} />
          </Tooltip>
        </Stack>
      </Paper>

      {helpOpen ? (
        <PayrollProviderSyncHelpDrawer
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          activeTab={helpTab}
          onChangeTab={setHelpTab}
        />
      ) : null}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
            <Box>
              <Typography variant="subtitle2">
                {isCheckIntent ? "Workspace focus" : "Payroll path"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isCheckIntent
                  ? "Embedded payroll is the configured payroll path for this company. CSV handoff remains available as a fallback export workflow."
                  : isCsvIntent
                    ? "This company is currently using payroll handoff/export mode."
                    : "Choose a payroll path in Company Profile before using provider-specific payroll tools."}
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Intent: ${titleize(payrollIntent || "none")}`} sx={isCheckIntent ? chipSx.active : isUnsetIntent ? chipSx.warning : chipSx.neutral} />
              <Chip label={`Country: ${payrollCountry || "Not set"}`} sx={chipSx.neutral} />
              {currentPayrollProvider ? <Chip label={`Current provider: ${currentPayrollProvider}`} sx={chipSx.neutral} /> : null}
            </Stack>
          </Stack>

          {isCheckIntent ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant={workspaceMode === WORKSPACE_MODE_CHECK ? "contained" : "outlined"}
                onClick={() => setWorkspaceMode(WORKSPACE_MODE_CHECK)}
              >
                Embedded Payroll
              </Button>
              <Button
                variant={workspaceMode === WORKSPACE_MODE_HANDOFF ? "contained" : "outlined"}
                onClick={() => setWorkspaceMode(WORKSPACE_MODE_HANDOFF)}
              >
                Fallback Handoff
              </Button>
            </Stack>
          ) : null}

          {shouldShowHandoffWorkspace ? (
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth disabled={providerPickerDisabled}>
                  <InputLabel id="provider-sync-provider-label">Provider</InputLabel>
                  <Select
                    labelId="provider-sync-provider-label"
                    label="Provider"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  >
                    {handoffProviderOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value} disabled={Boolean(option.disabled)}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }} flexWrap="wrap" useFlexGap>
                  <Chip label="Generic Accountant CSV" sx={provider === "generic_csv" ? chipSx.active : chipSx.neutral} />
                  <Chip label="QuickBooks CSV" sx={provider === "quickbooks" ? chipSx.active : chipSx.neutral} />
                </Stack>
              </Grid>
            </Grid>
          ) : null}

          {shouldShowEmbeddedPlanningCard ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2">
                  {isUnsetIntent ? "Payroll Path Setup" : "Embedded U.S. Payroll Planning"}
                </Typography>
                <Alert severity={isUnsetIntent ? "warning" : "info"}>
                  {isUnsetIntent
                    ? "Choose a payroll path in Company Profile before using provider-specific payroll tools."
                    : isCanadianPayroll
                      ? "Embedded U.S. payroll is not part of this Canadian payroll path."
                      : "This company is currently using payroll handoff/export mode. Embedded U.S. payroll tools become relevant only if payroll intent is switched later."}
                </Alert>
                {isUnsetIntent ? (
                  <Button
                    variant="outlined"
                    onClick={() => window.location.assign("/manager/dashboard?view=company-profile")}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Go to Company Profile
                  </Button>
                ) : null}
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      </Paper>

      {shouldShowCheckWorkspace && (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={800}>Check Payroll Control Center</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 920 }}>
                Prepare your company, employees, onboarding, and payroll package for Check-powered payroll. Nothing is sent to Check until sandbox credentials are configured and sync is explicitly enabled.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => {
                setCheckSection(CHECK_SECTION_OVERVIEW);
                setHelpOpen(true);
              }}
              sx={{ alignSelf: { xs: "stretch", md: "flex-start" } }}
            >
              Payroll guide
            </Button>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
            {checkWorkspaceSections.map((section) => (
              <Button
                key={section.key}
                size="small"
                variant={checkSection === section.key ? "contained" : "outlined"}
                onClick={() => setCheckSection(section.key)}
              >
                {section.label}
              </Button>
            ))}
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label="Check payroll workspace" sx={chipSx.active} />
            <Chip label={`Intent: ${titleize(payrollIntent || "none")}`} sx={chipSx.neutral} />
            <Chip label={`Country: ${payrollCountry || "Not set"}`} sx={chipSx.neutral} />
            <Chip label={`Current provider: ${currentPayrollProvider || "Other"}`} sx={chipSx.neutral} />
          </Stack>

          {checkActionNotice ? <Alert severity="success">{checkActionNotice}</Alert> : null}
          {checkReadinessError ? <Alert severity="warning">{checkReadinessError}</Alert> : null}
          {checkStatusError ? <Alert severity="warning">{checkStatusError}</Alert> : null}
          {checkLaunchReadinessError ? <Alert severity="warning">{checkLaunchReadinessError}</Alert> : null}
          {checkOnboardingError ? <Alert severity="warning">{checkOnboardingError}</Alert> : null}

          {checkSection === CHECK_SECTION_OVERVIEW && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                {[
                  {
                    key: "company",
                    title: "Company",
                    summary: companySummary,
                    onClick: () => window.location.assign("/manager/dashboard?view=company-profile"),
                  },
                  {
                    key: "locations",
                    title: "Payroll locations",
                    summary: locationSummary,
                    onClick: () => window.location.assign("/manager/payroll"),
                  },
                  {
                    key: "employees",
                    title: "Employees",
                    summary: employeeSummary,
                    onClick: () => setCheckSection(CHECK_SECTION_ONBOARDING),
                  },
                  {
                    key: "connection",
                    title: "Check connection",
                    summary: connectionSummary,
                    onClick: () => setCheckSection(CHECK_SECTION_SANDBOX),
                  },
                ].map((card) => (
                  <Grid item xs={12} md={6} lg={3} key={card.key}>
                    <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                      <Stack spacing={1.25} sx={{ height: "100%" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1" fontWeight={700}>{card.title}</Typography>
                          <Chip size="small" label={card.summary.label} sx={chipSx[card.summary.tone]} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                          {card.summary.issue}
                        </Typography>
                        <Button variant="outlined" size="small" onClick={card.onClick}>
                          {card.summary.cta}
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={700}>Action required</Typography>
                  {managerIssues.length ? (
                    <Stack spacing={1}>
                      {managerIssues.slice(0, 8).map((item, index) => (
                        <Alert
                          key={`manager-issue-${index}-${item.code || item.title}`}
                          severity={["company", "payroll", "employee"].includes(item.category) ? "error" : "warning"}
                          action={item.actionLabel ? (
                            <Button
                              color="inherit"
                              size="small"
                              onClick={() => {
                                if (item.actionLabel === "Open Company Profile") window.location.assign("/manager/dashboard?view=company-profile");
                                if (item.actionLabel === "Edit Payroll Locations") window.location.assign("/manager/payroll");
                                if (item.actionLabel === "Review employees") setCheckSection(CHECK_SECTION_ONBOARDING);
                              }}
                            >
                              {item.actionLabel}
                            </Button>
                          ) : null}
                        >
                          <strong>{item.title}</strong>: {item.message}
                        </Alert>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="success">Local Check preparation is structurally clean. The remaining gate is Check sandbox credentials and sandbox sync enablement.</Alert>
                  )}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle1" fontWeight={700}>What managers should do next</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use this control center to fix company setup, payroll locations, employee mapping, and onboarding readiness first. Check is not live until sandbox credentials and sandbox sync are enabled.
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 3 }}>
                    {(checkLaunchReadiness?.next_steps || []).slice(0, 6).map((step, index) => (
                      <li key={`check-next-step-${index}`}>
                        <Typography variant="body2">{step}</Typography>
                      </li>
                    ))}
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          )}

          {checkSection === CHECK_SECTION_SETUP && (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Setup checklist</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Review the local readiness gates before any future Check sandbox sync or onboarding work.
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="outlined" onClick={loadCheckReadiness} disabled={checkReadinessLoading}>
                    {checkReadinessLoading ? <CircularProgress size={18} /> : "Refresh readiness"}
                  </Button>
                  <Button variant="outlined" onClick={loadCheckLaunchReadiness} disabled={checkLaunchReadinessLoading}>
                    {checkLaunchReadinessLoading ? <CircularProgress size={18} /> : "Refresh launch readiness"}
                  </Button>
                </Stack>
              </Stack>
              <Grid container spacing={2}>
                {[
                  { title: "Company", items: checkLaunchReadiness?.company_checklist || [] },
                  { title: "Payroll locations", items: checkLaunchReadiness?.workplace_checklist || [] },
                  { title: "Employees", items: checkLaunchReadiness?.employee_checklist || [] },
                  {
                    title: "Onboarding and sandbox",
                    items: [
                      ...(checkLaunchReadiness?.onboarding_checklist || []),
                      { key: "ready_for_payload_preview", value: checkLaunchReadiness?.ready_for_sandbox_payload_preview, ok: Boolean(checkLaunchReadiness?.ready_for_sandbox_payload_preview), severity: "warning" },
                      { key: "ready_for_sandbox_company_sync", value: checkLaunchReadiness?.ready_for_sandbox_company_sync, ok: Boolean(checkLaunchReadiness?.ready_for_sandbox_company_sync), severity: "warning" },
                      { key: "ready_for_sandbox_workplace_sync", value: checkLaunchReadiness?.ready_for_sandbox_workplace_sync, ok: Boolean(checkLaunchReadiness?.ready_for_sandbox_workplace_sync), severity: "warning" },
                      { key: "ready_for_sandbox_employee_sync", value: checkLaunchReadiness?.ready_for_sandbox_employee_sync, ok: Boolean(checkLaunchReadiness?.ready_for_sandbox_employee_sync), severity: "warning" },
                    ],
                  },
                ].map((group) => (
                  <Grid item xs={12} md={6} key={group.title}>
                    <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" fontWeight={700}>{group.title}</Typography>
                        {group.items.map((item) => (
                          <Stack key={item.key} direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">{checklistManagerLabel(item.key)}</Typography>
                            <Chip size="small" sx={chipSx[checklistChipTone(item)]} label={checklistValueLabel(item.value)} />
                          </Stack>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          )}

          {checkSection === CHECK_SECTION_SANDBOX && (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Check Connection</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Review Check sandbox status, preview data for Check, and keep sync actions gated until credentials and flags are enabled.
                  </Typography>
                </Box>
                <Button variant="outlined" onClick={loadCheckStatus} disabled={checkStatusLoading}>
                  {checkStatusLoading ? <CircularProgress size={18} /> : "Refresh connection"}
                </Button>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 2 }}><Typography variant="body2"><strong>Status:</strong> {checklistValueLabel(checkStatus?.status || "not_configured")}</Typography></Paper></Grid>
                <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 2 }}><Typography variant="body2"><strong>Environment:</strong> {checkStatus?.environment || "sandbox"}</Typography></Paper></Grid>
                <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 2 }}><Typography variant="body2"><strong>API configured:</strong> {checkStatus?.configured ? "Yes" : "No"}</Typography></Paper></Grid>
              </Grid>
              {!checkStatus?.configured ? (
                <Alert severity="info">Check sandbox credentials are not configured yet.</Alert>
              ) : null}
              {checkStatus?.configured && !checkStatus?.sandbox_sync_enabled ? (
                <Alert severity="info">Sync to Check sandbox remains disabled until your data preview is clean and you explicitly enable the sync flag.</Alert>
              ) : null}
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <Button variant="outlined" onClick={() => handleCheckPayloadPreview("company")} disabled={checkPayloadLoading || !checkStatus?.configured}>
                  {checkPayloadLoading && checkPayloadPreview?.kind === "company" ? <CircularProgress size={18} /> : "Preview company data for Check"}
                </Button>
                <Button variant="outlined" onClick={() => handleCheckPayloadPreview("workplaces")} disabled={checkPayloadLoading || !checkStatus?.configured}>
                  {checkPayloadLoading && checkPayloadPreview?.kind === "workplaces" ? <CircularProgress size={18} /> : "Preview payroll locations for Check"}
                </Button>
                <Button variant="outlined" onClick={() => handleCheckPayloadPreview("employees")} disabled={checkPayloadLoading || !checkStatus?.configured}>
                  {checkPayloadLoading && checkPayloadPreview?.kind === "employees" ? <CircularProgress size={18} /> : "Preview employees for Check"}
                </Button>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <Button variant="contained" onClick={() => handleCheckSandboxSync("company")} disabled={checkSyncLoading.company || !checkStatus?.configured || !checkStatus?.sandbox_sync_enabled}>
                  {checkSyncLoading.company ? <CircularProgress size={18} /> : "Sync company to Check sandbox"}
                </Button>
                <Button variant="contained" onClick={() => handleCheckSandboxSync("workplaces")} disabled={checkSyncLoading.workplaces || !checkStatus?.configured || !checkStatus?.sandbox_sync_enabled}>
                  {checkSyncLoading.workplaces ? <CircularProgress size={18} /> : "Sync payroll locations to Check sandbox"}
                </Button>
                <Button variant="contained" onClick={() => handleCheckSandboxSync("employees")} disabled={checkSyncLoading.employees || !checkStatus?.configured || !checkStatus?.sandbox_sync_enabled}>
                  {checkSyncLoading.employees ? <CircularProgress size={18} /> : "Sync employees to Check sandbox"}
                </Button>
              </Stack>
              {checkPayloadPreview ? (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Show latest data preview for Check</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box
                      component="pre"
                      sx={{ m: 0, p: 1.5, overflow: "auto", borderRadius: 1, bgcolor: "background.default", border: 1, borderColor: "divider", fontSize: 12 }}
                    >
                      {JSON.stringify(checkPayloadPreview.data, null, 2)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ) : null}
            </Stack>
          )}

          {checkSection === CHECK_SECTION_ONBOARDING && (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Check Payroll Onboarding</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Managers prepare company onboarding first. Employees later complete tax and direct-deposit details through Check. Schedulaa stores only status and audit trail data.
                  </Typography>
                </Box>
                <Button variant="outlined" onClick={loadCheckOnboardingOverview} disabled={checkOnboardingLoading}>
                  {checkOnboardingLoading ? <CircularProgress size={18} /> : "Refresh onboarding"}
                </Button>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" fontWeight={700}>Employer onboarding</Typography>
                      <Typography variant="body2"><strong>Status:</strong> {checklistValueLabel(checkOnboardingOverview?.company_onboard_status || "not_connected")}</Typography>
                      <Typography variant="body2"><strong>Company sync:</strong> {checkOnboardingOverview?.company_mapping_status === "mapped" ? "Ready" : "Not synced to Check"}</Typography>
                      <Typography variant="body2"><strong>Payroll locations sync:</strong> {checkOnboardingOverview?.workplace_mapping_status === "mapped" ? "Ready" : "Not synced to Check"}</Typography>
                      <Button
                        variant="contained"
                        onClick={handleEmployerOnboardingStart}
                        disabled={checkComponentActionLoading || !checkStatus?.configured || !checkReadiness?.check_company_mapped || !checkStatus?.check_onboard_enabled}
                      >
                        {checkComponentActionLoading ? <CircularProgress size={18} /> : "Start employer onboarding"}
                      </Button>
                      <Alert severity="info">
                        Check onboarding will be available after sandbox credentials and onboarding access are configured.
                      </Alert>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={7}>
                  <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                    <Stack spacing={1.25}>
                      <Typography variant="subtitle2" fontWeight={700}>Requirements and onboarding sessions</Typography>
                      {checkOnboardingOverview?.requirements_summary?.items?.length ? (
                        <Stack spacing={1}>
                          {checkOnboardingOverview.requirements_summary.items.map((item) => (
                            <Alert key={item.id} severity={String(item.status || "").toLowerCase() === "blocking" ? "warning" : "info"}>
                              {titleize(item.requirement)}: {titleize(item.status || "pending")}
                            </Alert>
                          ))}
                        </Stack>
                      ) : (
                        <Alert severity="info">Requirements will appear here after Check onboarding is connected.</Alert>
                      )}
                      <Typography variant="body2"><strong>Onboarding sessions:</strong> {checkOnboardingOverview?.component_sessions_summary?.total ?? 0}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                      <TextField
                        size="small"
                        label="Search employees"
                        value={checkOnboardingSearch}
                        onChange={(event) => setCheckOnboardingSearch(event.target.value)}
                      />
                      <FormControl size="small" sx={{ minWidth: 190 }}>
                        <InputLabel id="check-onboarding-filter-label">Filter</InputLabel>
                        <Select
                          labelId="check-onboarding-filter-label"
                          value={checkOnboardingFilter}
                          label="Filter"
                          onChange={(event) => setCheckOnboardingFilter(event.target.value)}
                        >
                          {["all", "missing_location", "not_mapped", "invite_ready", "invite_sent", "needs_attention", "completed"].map((option) => (
                            <MenuItem key={option} value={option}>{onboardingFilterLabel(option)}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                      <Button variant="outlined" disabled={!checkSelectedEmployeeIds.length || Boolean(checkBulkActionLoading) || !checkStatus?.check_onboard_enabled} onClick={() => handleBulkCheckOnboardingAction("send")}>
                        {checkBulkActionLoading === "send" ? <CircularProgress size={18} /> : "Send invites"}
                      </Button>
                      <Button variant="outlined" disabled={!checkSelectedEmployeeIds.length || Boolean(checkBulkActionLoading) || !checkStatus?.check_onboard_enabled} onClick={() => handleBulkCheckOnboardingAction("resend")}>
                        {checkBulkActionLoading === "resend" ? <CircularProgress size={18} /> : "Resend invites"}
                      </Button>
                      <Button variant="outlined" disabled={!checkSelectedEmployeeIds.length || Boolean(checkBulkActionLoading)} onClick={() => handleBulkCheckOnboardingAction("refresh")}>
                        {checkBulkActionLoading === "refresh" ? <CircularProgress size={18} /> : "Refresh statuses"}
                      </Button>
                    </Stack>
                  </Stack>

                  <Alert severity="info">
                    Bulk onboarding will be available after Check sandbox sync and onboarding access are configured.
                  </Alert>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      {filteredCheckOnboardingRows.length} employee rows match the current filter. {checkSelectedEmployeeIds.length} selected.
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary">Page size</Typography>
                      <FormControl size="small" sx={{ minWidth: 90 }}>
                        <Select value={checkOnboardingPageSize} onChange={(event) => setCheckOnboardingPageSize(Number(event.target.value))}>
                          {[10, 25, 50].map((size) => <MenuItem key={size} value={size}>{size}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={allVisibleCheckEmployeesSelected}
                              indeterminate={selectedCheckEmployeesVisibleCount > 0 && !allVisibleCheckEmployeesSelected}
                              onChange={handleToggleAllVisibleCheckEmployees}
                              inputProps={{ "aria-label": "Select all visible employees" }}
                            />
                          </TableCell>
                          <TableCell>Employee</TableCell>
                          <TableCell>Primary payroll location</TableCell>
                          <TableCell>Check employee sync</TableCell>
                          <TableCell>Onboarding status</TableCell>
                          <TableCell>Last invite / session</TableCell>
                          <TableCell>Needs attention</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pagedCheckOnboardingRows.map((row) => (
                          <TableRow key={row.employee_id} hover>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={checkSelectedEmployeeIds.includes(row.employee_id)}
                                onChange={() => handleToggleCheckEmployeeSelection(row.employee_id)}
                                inputProps={{ "aria-label": `Select ${row.employee_name}` }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{row.employee_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{row.email || "No email"}</Typography>
                            </TableCell>
                            <TableCell>{row.primary_work_location_name || "Missing primary payroll location"}</TableCell>
                            <TableCell>{row.check_employee_id ? "Synced to Check" : "Not synced to Check"}</TableCell>
                            <TableCell>{titleize(row.onboard_status || "not_started")}</TableCell>
                            <TableCell>
                              {row.last_invite_sent_at ? (
                                <Typography variant="body2">{formatDateTime(row.last_invite_sent_at)}</Typography>
                              ) : row.last_component_session_status ? (
                                <Typography variant="body2">{checklistValueLabel(row.last_component_session_status)}</Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">No invite yet</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {row.blocking_steps?.length ? row.blocking_steps.length : row.action_state === "missing_primary_work_location" ? "Missing payroll location" : "None"}
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button size="small" variant="outlined" onClick={() => handleEmployeeOnboardingAction(row.employee_id, "send")} disabled={checkEmployeeOnboardingActionLoading[`send-${row.employee_id}`] || !checkStatus?.configured || !row.check_employee_id || !row.primary_work_location_id || !checkStatus?.check_onboard_enabled}>
                                  Send invite
                                </Button>
                                <Button size="small" variant="outlined" onClick={() => handleEmployeeOnboardingAction(row.employee_id, "resend")} disabled={checkEmployeeOnboardingActionLoading[`resend-${row.employee_id}`] || !checkStatus?.configured || !row.check_employee_id || !row.primary_work_location_id || !checkStatus?.check_onboard_enabled}>
                                  Resend invite
                                </Button>
                                <Button size="small" variant="outlined" onClick={() => handleEmployeeOnboardingAction(row.employee_id, "refresh")} disabled={checkEmployeeOnboardingActionLoading[`refresh-${row.employee_id}`]}>
                                  Refresh status
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!pagedCheckOnboardingRows.length ? (
                          <TableRow>
                            <TableCell colSpan={8}>
                              <Typography variant="body2" color="text.secondary">No employee onboarding rows match the current search and filter.</Typography>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button variant="outlined" size="small" disabled={checkOnboardingPage === 0} onClick={() => setCheckOnboardingPage((page) => Math.max(page - 1, 0))}>Previous</Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={(checkOnboardingPage + 1) * checkOnboardingPageSize >= filteredCheckOnboardingRows.length}
                      onClick={() => setCheckOnboardingPage((page) => page + 1)}
                    >
                      Next
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          )}

          {checkSection === CHECK_SECTION_PACKAGE && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Check Payroll Package Preview</Typography>
                <Typography variant="body2" color="text.secondary">
                  This package preview shows how Schedulaa payroll inputs would be translated for Check later. It does not call Check and does not submit payroll.
                </Typography>
              </Box>
              {!activeRunId ? (
                <Alert severity="info">Create or select a provider run first. The Check payroll package preview is generated from the current batch so it stays aligned with payroll-ready source data.</Alert>
              ) : checkPackagePreviewLoading ? (
                <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={18} /><Typography variant="body2">Loading Check payroll package preview…</Typography></Stack>
              ) : checkPackagePreviewError ? (
                <Alert severity="error">{checkPackagePreviewError}</Alert>
              ) : !checkPackagePreview ? (
                <Alert severity="info">No Check payroll package preview is available for this run yet.</Alert>
              ) : (
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={payrollPreviewActionTitle(checkPackagePreview)} sx={Number(checkPackagePreview?.summary?.blocker_count || 0) > 0 ? chipSx.danger : chipSx.success} />
                    <Chip label={`Employees ${checkPackagePreview?.summary?.employees_count ?? 0}`} sx={chipSx.neutral} />
                    <Chip label={`Earnings ${checkPackagePreview?.summary?.earnings_count ?? 0}`} sx={chipSx.neutral} />
                    <Chip label={`Reimbursements ${checkPackagePreview?.summary?.reimbursements_count ?? 0}`} sx={chipSx.neutral} />
                    <Chip label={`Warnings ${checkPackagePreview?.summary?.warning_count ?? 0}`} sx={chipSx.warning} />
                    <Chip label={`Blockers ${checkPackagePreview?.summary?.blocker_count ?? 0}`} sx={chipSx.danger} />
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}><Typography variant="body2"><strong>Period:</strong> {checkPackagePreview?.payroll?.period_start || "—"} to {checkPackagePreview?.payroll?.period_end || "—"}</Typography></Grid>
                    <Grid item xs={12} md={4}><Typography variant="body2"><strong>Payday:</strong> {checkPackagePreview?.payroll?.payday || "—"}</Typography></Grid>
                    <Grid item xs={12} md={4}><Typography variant="body2"><strong>Pay frequency:</strong> {checkPackagePreview?.payroll?.pay_frequency || "—"}</Typography></Grid>
                  </Grid>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={700}>Action required</Typography>
                      {aggregateCheckIssues(checkPackagePreview?.blockers, checkPackagePreview?.warnings).length ? (
                        aggregateCheckIssues(checkPackagePreview?.blockers, checkPackagePreview?.warnings).map((item, index) => (
                          <Alert key={`package-human-${index}-${item.code || item.title}`} severity={item.category === "payroll" ? "warning" : "error"}>
                            <strong>{item.title}</strong>: {item.message_with_count}
                          </Alert>
                        ))
                      ) : (
                        <Alert severity="success">This package is structurally ready for a future provider payroll preview once Check sandbox sync and onboarding are enabled.</Alert>
                      )}
                    </Stack>
                  </Paper>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">Show technical package details</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1}>
                        {aggregateCheckIssues(checkPackageBlockers).map((item, index) => (
                          <Alert key={`check-package-blocker-${index}-${item.code || item.message}`} severity="error">
                            <strong>{item.code || "BLOCKER"}</strong>: {item.message_with_count}
                          </Alert>
                        ))}
                        {aggregateCheckIssues(checkPackageWarnings).map((item, index) => (
                          <Alert key={`check-package-warning-${index}-${item.code || item.message}`} severity={item.severity === "info" ? "info" : "warning"}>
                            <strong>{item.code || "WARNING"}</strong>: {item.message_with_count}
                          </Alert>
                        ))}
                        {!checkPackageBlockers.length && !checkPackageWarnings.length ? <Typography variant="body2" color="text.secondary">No technical warnings or blockers.</Typography> : null}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">Show field mapping table</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Schedulaa field</TableCell>
                              <TableCell>Check object</TableCell>
                              <TableCell>Check type/code</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Notes</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {checkPackageFieldMappings.map((row) => (
                              <TableRow key={`${row.schedulaa_field}-${row.check_object}-${row.check_type_code || "none"}`}>
                                <TableCell>{titleize(row.schedulaa_field)}</TableCell>
                                <TableCell>{row.check_object || "—"}</TableCell>
                                <TableCell>{row.check_type_code || "—"}</TableCell>
                                <TableCell><Chip size="small" label={checkPackageStatusLabel(row.status)} sx={chipSx[checkPackageStatusTone(row.status)]} /></TableCell>
                                <TableCell>{row.notes}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">Show employee package rows</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        {checkPackageItems.map((item) => (
                          <Paper key={`check-package-item-${item.employee_id}`} variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={1.5}>
                              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                                <Box>
                                  <Typography variant="body1"><strong>{item.employee_name}</strong></Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Employee ID {item.employee_id} • Primary payroll location {item.primary_work_location_id || "missing"} • Check employee {item.check_employee_id || "not synced"}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={1}>
                                  <Chip size="small" label={`Earnings ${item.earnings?.length || 0}`} sx={chipSx.neutral} />
                                  <Chip size="small" label={`Reimbursements ${item.reimbursements?.length || 0}`} sx={chipSx.neutral} />
                                  <Chip size="small" label={`Not sent ${item.not_sent?.length || 0}`} sx={chipSx.warning} />
                                </Stack>
                              </Stack>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Earnings</strong></Typography>
                                  {item.earnings?.length ? (
                                    <Stack spacing={1}>
                                      {item.earnings.map((earning) => (
                                        <Box key={`earning-${earning.line_id}`} sx={{ p: 1.25, border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) }}>
                                          <Typography variant="body2"><strong>{titleize(earning.earning_key)}</strong> • {earning.check_type_code || "type pending"} • {earning.amount}</Typography>
                                          <Typography variant="caption" color="text.secondary">Hours {earning.hours ?? 0} • Workplace {earning.check_workplace_id || earning.work_location_id || "missing"} • {earning.notes}</Typography>
                                        </Box>
                                      ))}
                                    </Stack>
                                  ) : <Typography variant="body2" color="text.secondary">No earnings mapped.</Typography>}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Reimbursements / not sent</strong></Typography>
                                  {item.reimbursements?.length ? (
                                    <Stack spacing={1} sx={{ mb: item.not_sent?.length ? 1 : 0 }}>
                                      {item.reimbursements.map((row) => (
                                        <Box key={`reimbursement-${row.line_id}`} sx={{ p: 1.25, border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) }}>
                                          <Typography variant="body2"><strong>{titleize(row.earning_key)}</strong> • {row.amount}</Typography>
                                          <Typography variant="caption" color="text.secondary">{row.description || row.notes}</Typography>
                                        </Box>
                                      ))}
                                    </Stack>
                                  ) : null}
                                  {item.not_sent?.length ? (
                                    <Stack spacing={1}>
                                      {item.not_sent.map((row, index) => (
                                        <Alert key={`not-sent-${item.employee_id}-${index}`} severity="info"><strong>{row.code || "NOT_SENT"}</strong>: {row.message}</Alert>
                                      ))}
                                    </Stack>
                                  ) : !item.reimbursements?.length ? (
                                    <Typography variant="body2" color="text.secondary">No reimbursements or not-sent lines for this employee.</Typography>
                                  ) : null}
                                </Grid>
                              </Grid>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Stack>
              )}
            </Stack>
          )}

          {checkSection === CHECK_SECTION_ACTIVITY && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Recent onboarding activity</Typography>
                {checkOnboardingOverview?.recent_audit_events?.length ? (
                  <Stack spacing={1}>
                    {checkOnboardingOverview.recent_audit_events.slice(0, 10).map((item) => (
                      <Typography key={item.id} variant="body2">
                        {formatDateTime(item.created_at)} - {titleize(item.actor_type)} - {onboardingActionLabel(item.action)} - {titleize(item.status)}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No onboarding activity has been recorded yet.</Typography>
                )}
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Upcoming manager steps</Typography>
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  {(checkOnboardingOverview?.next_steps || checkLaunchReadiness?.next_steps || []).map((step, index) => (
                    <li key={`activity-next-step-${index}`}>
                      <Typography variant="body2">{step}</Typography>
                    </li>
                  ))}
                </Box>
              </Paper>
            </Stack>
          )}

          {checkSection === CHECK_SECTION_TECHNICAL && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Technical details</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Raw codes and technical payload state are kept here for troubleshooting. Managers should use Overview first.
                </Typography>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Readiness and unsupported conditions</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      {formatList(checkReadiness?.unsupported_conditions).map((item) => (
                        <Alert key={`${item.code}-${item.message}`} severity={item.severity === "info" ? "info" : item.severity === "warning" ? "warning" : "error"}>
                          <strong>{item.code}</strong>: {item.message}
                        </Alert>
                      ))}
                      {formatList(checkReadiness?.warnings).map((item, index) => (
                        <Alert key={`check-warning-${index}`} severity="warning">
                          <strong>{item.code || "WARNING"}</strong>: {item.message || String(item)}
                        </Alert>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Missing work location addresses</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {formatList(checkReadiness?.missing_work_location_address).length ? (
                      <Stack spacing={0.5}>
                        {checkReadiness.missing_work_location_address.map((item) => (
                          <Typography key={item.id} variant="body2">{item.name}: {(item.missing_fields || []).join(", ")}</Typography>
                        ))}
                      </Stack>
                    ) : <Typography variant="body2" color="text.secondary">None</Typography>}
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Employees missing primary payroll location</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {formatList(checkReadiness?.missing_employee_primary_work_location).length ? (
                      <Stack spacing={0.5}>
                        {checkReadiness.missing_employee_primary_work_location.slice(0, 20).map((item) => (
                          <Typography key={item.employee_id} variant="body2">{item.employee_name}</Typography>
                        ))}
                      </Stack>
                    ) : <Typography variant="body2" color="text.secondary">None</Typography>}
                  </AccordionDetails>
                </Accordion>
              </Paper>
            </Stack>
          )}
        </Stack>
      </Paper>
      )}

      {shouldShowHandoffWorkspace && (
      <>
      {provider === "quickbooks" && (
      <Accordion elevation={2} defaultExpanded={false} disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">QuickBooks connection and setup</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">QuickBooks Setup Status</Typography>
            <Typography variant="body2" color="text.secondary">
              Settings remains for setup, connect, and mappings. Payroll page owns pay-period execution.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="outlined" onClick={loadSetupStatus} disabled={statusLoading}>
              {statusLoading ? <CircularProgress size={18} /> : "Refresh status"}
            </Button>
            <Button variant="outlined" onClick={handleBootstrapPayItems} disabled={bootstrapPayItemsLoading}>
              {bootstrapPayItemsLoading ? <CircularProgress size={18} /> : "Bootstrap pay item placeholders"}
            </Button>
            <Button variant="outlined" onClick={handleBootstrapEmployees} disabled={bootstrapEmployeesLoading}>
              {bootstrapEmployeesLoading ? <CircularProgress size={18} /> : "Bootstrap employees from legacy IDs"}
            </Button>
          </Stack>
        </Stack>

        {setupError && (
          <Alert severity={setupError.includes("not enabled") ? "info" : "warning"} sx={{ mb: 2 }}>
            {setupError}
          </Alert>
        )}
        {isQuickBooksAccountingOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            QuickBooks accounting is connected. Live QuickBooks payroll/time submit is not enabled. CSV fallback is available.
          </Alert>
        )}
          {(provider === "generic_csv" || provider === "csv_provider") && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No provider connection is required for this CSV handoff.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Connection status:</strong> {setupStatus?.connection_status || "unknown"}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Readiness:</strong> {statusReadiness}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Provider company ref:</strong> {setupStatus?.provider_company_ref || "—"}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Supports accounting:</strong> {setupCapabilities?.supports_accounting ? "Yes" : "No"}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Supports time activity submit:</strong> {setupCapabilities?.supports_time_activity_submit ? "Yes" : "No"}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Supports payroll run submit:</strong> {setupCapabilities?.supports_payroll_run_submit ? "Yes" : "No"}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Employee mappings:</strong> {setupStatus?.employee_mapping_count ?? 0}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Pay item mappings:</strong> {setupStatus?.pay_item_mapping_count ?? 0}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Missing scopes:</strong> {formatList(setupStatus?.missing_scopes).join(", ") || "None"}</Typography></Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>Missing required pay item keys</Typography>
        {renderJsonList(setupStatus?.missing_required_pay_item_keys)}
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Setup steps</Typography>
        {renderJsonList(setupStatus?.setup_steps)}
        </AccordionDetails>
      </Accordion>
      )}


      <Paper elevation={2} sx={{ p: 3 }}>
        <SectionHeading
          title="Review data"
          tooltip="Review the employee scope and pay period before previewing or preparing the CSV handoff."
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <Chip label={overrideScopeEnabled ? "Scope override active" : "Using current payroll filters"} sx={overrideScopeEnabled ? chipSx.warning : chipSx.neutral} />
          <Tooltip title={provider === "quickbooks"
            ? "Use this file for your accountant or payroll provider. Direct QuickBooks submission is still future-only."
            : "Use this file for your accountant or payroll provider. No provider connection is required for this CSV handoff."}>
            <Chip label="Handoff guidance" sx={chipSx.neutral} />
          </Tooltip>
        </Stack>
        {missingDates && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Start date and end date are required before preparing provider-sync data.
          </Alert>
        )}
        {noExplicitEmployees && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No payroll handoff employees are selected yet. Choose one employee or a custom employee list before preparing payroll-ready data.
          </Alert>
        )}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <Chip label={`Region: ${region || "—"}`} sx={chipSx.neutral} />
          <Chip label={`Province/state: ${provinceOrState || "—"}`} sx={chipSx.neutral} />
          <Chip label={`Period: ${(startDate || "—")} to ${(endDate || "—")}`} sx={chipSx.neutral} />
          <Chip label={`Department: ${departmentFilter || "All departments"}`} sx={chipSx.neutral} />
          <Chip label={`Employees: ${selectedEmployeeNames.length || availableEmployeeIds.length || 0}`} sx={chipSx.neutral} />
          <Chip label={`Pay frequency: ${payFrequency || "—"}`} sx={chipSx.neutral} />
        </Stack>
        <Accordion elevation={0} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Advanced: override handoff scope</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <Stack spacing={2}>
              <Alert severity={overrideScopeEnabled ? "warning" : "info"}>
                {overrideScopeEnabled
                  ? "Payroll Handoff override is active. This tab will ignore the main Payroll employee filter until you turn the override off."
                  : "Override is off. Payroll Handoff is using the current Payroll filters."}
              </Alert>
              <Button
                variant={overrideScopeEnabled ? "contained" : "outlined"}
                onClick={() => setOverrideScopeEnabled((value) => !value)}
                sx={{ alignSelf: "flex-start" }}
              >
                {overrideScopeEnabled ? "Turn off Payroll Handoff override" : "Turn on Payroll Handoff override"}
              </Button>
              {overrideScopeEnabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="provider-sync-scope-label">Payroll Handoff employee scope</InputLabel>
                      <Select
                        labelId="provider-sync-scope-label"
                        label="Payroll Handoff employee scope"
                        value={providerScopeMode}
                        onChange={(event) => {
                          const nextMode = event.target.value;
                          setProviderScopeMode(nextMode);
                          if (nextMode === "all_filtered") {
                            setProviderSelectedEmployeeIds([]);
                          } else if (nextMode === "single") {
                            setProviderSelectedEmployeeIds(defaultProviderEmployeeIds.slice(0, 1));
                          } else {
                            setProviderSelectedEmployeeIds(defaultProviderEmployeeIds);
                          }
                        }}
                      >
                        <MenuItem value="all_filtered">
                          {departmentFilter ? "All employees in selected department" : "All employees in Payroll Handoff"}
                        </MenuItem>
                        <MenuItem value="single">One employee only</MenuItem>
                        <MenuItem value="custom">Custom employee selection</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {providerScopeMode === "single" && (
                    <Grid item xs={12} md={8}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="provider-sync-single-employee-label">Employee</InputLabel>
                        <Select
                          labelId="provider-sync-single-employee-label"
                          label="Employee"
                          value={providerSelectedEmployeeIds[0] || ""}
                          onChange={(event) => setProviderSelectedEmployeeIds(event.target.value ? [String(event.target.value)] : [])}
                        >
                          {scopedRecruiters.map((row) => (
                            <MenuItem key={row.id} value={String(row.id)}>
                              {row.first_name} {row.last_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  {providerScopeMode === "custom" && (
                    <Grid item xs={12} md={8}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="provider-sync-custom-employees-label">Employees</InputLabel>
                        <Select
                          multiple
                          labelId="provider-sync-custom-employees-label"
                          label="Employees"
                          value={providerSelectedEmployeeIds}
                          onChange={(event) => setProviderSelectedEmployeeIds(truthyIds(event.target.value))}
                          renderValue={(selected) =>
                            truthyIds(selected)
                              .map((id) => {
                                const row = scopedRecruiters.find((item) => String(item.id) === String(id));
                                return row ? `${row.first_name} ${row.last_name}` : id;
                              })
                              .join(", ")
                          }
                        >
                          {scopedRecruiters.map((row) => (
                            <MenuItem key={row.id} value={String(row.id)}>
                              {row.first_name} {row.last_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="contained" onClick={handlePrepareCsv} disabled={!canPrepare || prepareCsvLoading}>
            {prepareCsvLoading ? <CircularProgress size={18} /> : "Prepare CSV"}
          </Button>
          <Button variant="contained" onClick={handlePreview} disabled={!canPrepare || previewLoading}>
            {previewLoading ? <CircularProgress size={18} /> : "Preview payroll-ready data"}
          </Button>
          <Tooltip title={previewData ? "" : "Preview payroll-ready data first."}>
            <span>
              <Button variant="outlined" onClick={handleCreateRun} disabled={!canPrepare || createLoading || !previewData}>
                {createLoading ? <CircularProgress size={18} /> : createRunLabel}
              </Button>
            </span>
          </Tooltip>
        </Stack>

        {(previewError || previewData) && <Divider sx={{ my: 2 }} />}
        {previewError && <Alert severity="error" sx={{ mb: 2 }}>{previewError}</Alert>}
        {previewData && (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
              <Chip label={previewSourceChipLabel} sx={chipSx.active} />
              <Chip label={previewEmployeesChipLabel} sx={chipSx.neutral} />
              <Chip label={previewPeriodChipLabel} sx={chipSx.neutral} />
              <Chip label={previewExportedTotalChipLabel} sx={chipSx.success} />
            </Stack>
            {previewData.saved_adjustments_included ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Saved Payroll Preview adjustments will be included.
              </Alert>
            ) : showPreviewSavedAdjustmentsMessage ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No saved Payroll Preview adjustments found for this period. Payroll Handoff will use approved time and leave only.
              </Alert>
            ) : null}
            {previewHasNoExportableData && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No payroll-ready time, leave, or saved adjustments were found for this selection.
              </Alert>
            )}
            {previewCapabilityWarnings.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {renderManagerMessages(previewCapabilityWarnings, previewIssueContext)}
              </Alert>
            )}
            <Alert severity="info" sx={{ mb: 2 }}>{previewPayrollValueSourceMessage}</Alert>
            {previewPayrollValueInfoMessages.map((message) => (
              <Alert key={message} severity="warning" sx={{ mb: 2 }}>
                {message}
              </Alert>
            ))}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Operational base</Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2"><strong>Employees:</strong> {previewData.employee_count ?? 0}</Typography>
                  <Typography variant="body2"><strong>Lines:</strong> {previewData.line_count ?? 0}</Typography>
                  <Typography variant="body2"><strong>Total hours:</strong> {previewData.total_hours ?? 0}</Typography>
                  <Typography variant="body2"><strong>Regular hours:</strong> {previewData.regular_hours ?? 0}</Typography>
                  <Typography variant="body2"><strong>Overtime hours:</strong> {previewData.overtime_hours ?? 0}</Typography>
                  <Typography variant="body2"><strong>Paid leave hours:</strong> {previewData.paid_leave_hours ?? 0}</Typography>
                  <Typography variant="body2"><strong>Holiday hours:</strong> {previewData.holiday_hours ?? 0}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Saved adjustments</Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2"><strong>Payroll value source:</strong> {titleize((previewPayrollValueSource || "operational_raw").replace("finalized_payroll", "finalized payroll").replace("saved_draft_payroll", "saved draft payroll").replace("operational_raw", "operational raw"))}</Typography>
                  <Typography variant="body2"><strong>Adjustment line count:</strong> {previewData.adjustment_line_count ?? 0}</Typography>
                  <Typography variant="body2"><strong>Adjustment total:</strong> {previewData.adjustment_total ?? 0}</Typography>
                  <Typography variant="body2"><strong>Adjustment types found:</strong> {(previewData.adjustment_types_found || []).map((key) => adjustmentTypeLabels[key] || key).join(", ") || "None"}</Typography>
                  <Typography variant="body2"><strong>Exported payable total:</strong> {previewData.gross_preview_total ?? 0}</Typography>
                </Stack>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>

      {(previewData || validationData || runError) && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <SectionHeading
            title="CSV status"
            tooltip="This section shows whether the current selection is ready to export as a CSV handoff. It does not submit payroll to a provider."
          />
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor:
                csvStatusSeverity === "success"
                  ? "#b7e1c4"
                  : csvStatusSeverity === "warning"
                    ? "#f2cb6b"
                    : "#ef9a95",
              bgcolor:
                csvStatusSeverity === "success"
                  ? "#eefaf1"
                  : csvStatusSeverity === "warning"
                    ? "#fff8e8"
                    : "#fff1f0",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1.25 }} flexWrap="wrap" useFlexGap>
              <Chip label={csvStatusTitle} sx={csvStatusSeverity === "success" ? chipSx.success : csvStatusSeverity === "warning" ? chipSx.warning : chipSx.danger} />
              {activeRunId ? <Chip label={`Run: ${activeRunId}`} sx={chipSx.neutral} /> : null}
              <Chip label={previewSourceChipLabel} sx={chipSx.neutral} />
              <Chip label={previewEmployeesChipLabel} sx={chipSx.neutral} />
              <Chip label={previewExportedTotalChipLabel} sx={chipSx.neutral} />
            </Stack>
            {runError ? (
              <Typography variant="body2">{runError}</Typography>
            ) : managerBlockingMessages.length ? (
              <Box component="ul" sx={{ m: 0, pl: 3 }}>
                {managerBlockingMessages.map((message, index) => (
                  <li key={`${index}-${message}`}>
                    <Typography variant="body2">{message}</Typography>
                  </li>
                ))}
              </Box>
            ) : (
              <Typography variant="body2">This selection is ready for CSV handoff.</Typography>
            )}
          </Paper>
          {activeRunId && !previewData && (
            <>
              {showActiveRunSourceMessage && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {activeRunPayrollValueSourceMessage}
                </Alert>
              )}
              {showActiveRunInfoMessages && activeRunPayrollValueInfoMessages.map((message) => (
                <Alert key={message} severity="warning" sx={{ mb: 2 }}>
                  {message}
                </Alert>
              ))}
            </>
          )}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
            <Tooltip title={csvBlockedReasonText}>
              <span>
                <Button variant="contained" onClick={handleCsvDownload} disabled={downloadLoading || !csvDownloadAllowed}>
                  {downloadLoading ? <CircularProgress size={18} /> : "Download CSV"}
                </Button>
              </span>
            </Tooltip>
          </Stack>
          {csvBlockedReasonText && (
            <Paper elevation={0} sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: "#f7f9fc", border: "1px solid #dbe5ff" }}>
              <Typography variant="body2" color="text.secondary">
                {csvBlockedReasonText}
              </Typography>
            </Paper>
          )}
          <Accordion elevation={0} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Advanced: setup and mapping</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
          {sourceHashChanged && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Source hash changed since an earlier run for this same period. Review the saved adjustments and approved time before exporting.
            </Alert>
          )}
          {hasFixBeforeExportIssues ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Fix before export</Typography>
              {renderManagerMessages(fixBeforeExportIssues, validationData ? currentRunContext : previewIssueContext)}
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              No blocking setup issues were found for this selection.
            </Alert>
          )}
          {validationOnlyCapabilityLimitation && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Live QuickBooks payroll/time submit is not enabled. CSV export is still available.
            </Alert>
          )}
          {canApplyCsvSuggestions && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>CSV handoff suggestions are ready</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                These suggested matches are used to create the CSV handoff. They do not submit payroll to QuickBooks.
              </Typography>
              <Button
                variant="contained"
                onClick={handleApplyCsvSuggestions}
                disabled={applySuggestionsLoading}
              >
                {applySuggestionsLoading ? "Applying suggested matches..." : "Apply suggested CSV handoff matches"}
              </Button>
            </Alert>
          )}
          {previewMissingEmployeeIssueRows.length > 0 && !validationData && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Missing employee mappings</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Schedulaa can generate a CSV handoff match for this employee. This is used for the CSV export only. Direct provider sync will require the real provider employee later.
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                <Tooltip title="Available after QuickBooks production payroll/time access is enabled.">
                  <span>
                    <Button variant="outlined" disabled>Import employees from QuickBooks</Button>
                  </span>
                </Tooltip>
              </Stack>
              <Stack spacing={2}>
                {previewMissingEmployeeIssueRows.map((row) => (
                  <Grid container spacing={2} key={`preview-missing-employee-${row.employee_id}`} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2"><strong>{row.employee_name}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">{row.employee_email || `Employee ID ${row.employee_id}`}</Typography>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Suggested CSV employee match"
                        value={csvEmployeeSuggestionsById[String(row.employee_id)]?.provider_employee_id || ""}
                        helperText={csvEmployeeSuggestionsById[String(row.employee_id)]?.provider_display_name || "No suggested CSV employee match available."}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Stack spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={() => applySuggestedEmployeeMatch(row)}
                          disabled={!csvEmployeeSuggestionsById[String(row.employee_id)]}
                        >
                          Use suggested employee match
                        </Button>
                        <Accordion elevation={0} disableGutters>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2">Advanced manual entry</Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ px: 0 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={employeeCodeLabel}
                              helperText="For CSV testing, you can enter a temporary code. For real QuickBooks sync, this should match the employee record in QuickBooks."
                              value={employeeMappingDrafts[row.employee_id] ?? ""}
                              onChange={(event) => handleEmployeeMapChange(row.employee_id, event.target.value)}
                              sx={{ mb: 1 }}
                            />
                            <Button variant="outlined" onClick={() => saveEmployeeMapping(row)}>Save match</Button>
                          </AccordionDetails>
                        </Accordion>
                      </Stack>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Box>
          )}
          {validationData && missingEmployeeIssueRows.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Missing employee mappings</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Schedulaa can generate a CSV handoff match for this employee. This is used for the CSV export only. Direct provider sync will require the real provider employee later.
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                <Tooltip title="Available after QuickBooks production payroll/time access is enabled.">
                  <span>
                    <Button variant="outlined" disabled>Import employees from QuickBooks</Button>
                  </span>
                </Tooltip>
              </Stack>
              <Stack spacing={2}>
                {missingEmployeeIssueRows.map((row) => (
                  <Grid container spacing={2} key={`missing-employee-${row.employee_id}`} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2"><strong>{row.employee_name}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">{row.employee_email || `Employee ID ${row.employee_id}`}</Typography>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Suggested CSV employee match"
                        value={csvEmployeeSuggestionsById[String(row.employee_id)]?.provider_employee_id || ""}
                        helperText={csvEmployeeSuggestionsById[String(row.employee_id)]?.provider_display_name || "No suggested CSV employee match available."}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Stack spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={() => applySuggestedEmployeeMatch(row)}
                          disabled={!csvEmployeeSuggestionsById[String(row.employee_id)]}
                        >
                          Use suggested employee match
                        </Button>
                        <Accordion elevation={0} disableGutters>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2">Advanced manual entry</Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ px: 0 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={employeeCodeLabel}
                              helperText="For CSV testing, you can enter a temporary code. For real QuickBooks sync, this should match the employee record in QuickBooks."
                              value={employeeMappingDrafts[row.employee_id] ?? ""}
                              onChange={(event) => handleEmployeeMapChange(row.employee_id, event.target.value)}
                              sx={{ mb: 1 }}
                            />
                            <Button variant="outlined" onClick={() => saveEmployeeMapping(row)}>Save match</Button>
                          </AccordionDetails>
                        </Accordion>
                      </Stack>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Box>
          )}
          {previewMissingPayItemKeys.length > 0 && !validationData && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Missing pay item mappings</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                These suggested matches are used to create the CSV handoff. They do not submit payroll to QuickBooks.
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                <Tooltip title="Available after QuickBooks production payroll/time access is enabled.">
                  <span>
                    <Button variant="outlined" disabled>Import pay items from QuickBooks</Button>
                  </span>
                </Tooltip>
              </Stack>
              <Stack spacing={2}>
                {previewMissingPayItemKeys.map((key) => (
                  <Grid container spacing={2} key={`preview-missing-pay-item-${key}`} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2"><strong>{titleize(payItemLabel[key] || key)}</strong></Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Suggested payroll item"
                        value={csvPayItemSuggestionsByKey[key]?.provider_item_id || ""}
                        helperText={csvPayItemSuggestionsByKey[key]?.provider_item_name || payItemHelperText(key)}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Stack spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={() => applySuggestedPayItemMatch(key)}
                          disabled={!csvPayItemSuggestionsByKey[key]}
                        >
                          Use suggested payroll item
                        </Button>
                        <Accordion elevation={0} disableGutters>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2">Advanced manual entry</Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ px: 0 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={payItemCodeLabel}
                              helperText={payItemHelperText(key)}
                              value={missingPayItemDrafts[key]?.provider_item_id || ""}
                              onChange={(event) => setMissingPayItemDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), provider_item_id: event.target.value } }))}
                              sx={{ mb: 1 }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              label="Display name"
                              value={missingPayItemDrafts[key]?.provider_item_name || ""}
                              onChange={(event) => setMissingPayItemDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), provider_item_name: event.target.value } }))}
                              sx={{ mb: 1 }}
                            />
                            <Button variant="outlined" onClick={() => saveMissingPayItemMapping(key)}>Save match</Button>
                          </AccordionDetails>
                        </Accordion>
                      </Stack>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Box>
          )}
          {validationData && missingPayItemKeys.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Missing pay item mappings</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                These suggested matches are used to create the CSV handoff. They do not submit payroll to QuickBooks.
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                <Tooltip title="Available after QuickBooks production payroll/time access is enabled.">
                  <span>
                    <Button variant="outlined" disabled>Import pay items from QuickBooks</Button>
                  </span>
                </Tooltip>
              </Stack>
              <Stack spacing={2}>
                {missingPayItemKeys.map((key) => (
                  <Grid container spacing={2} key={`missing-pay-item-${key}`} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2"><strong>{titleize(payItemLabel[key] || key)}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">{managerFriendlyMessage({ code: "MISSING_PAY_ITEM_MAP", key })}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Suggested payroll item"
                        value={csvPayItemSuggestionsByKey[key]?.provider_item_id || ""}
                        helperText={csvPayItemSuggestionsByKey[key]?.provider_item_name || payItemHelperText(key)}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Stack spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={() => applySuggestedPayItemMatch(key)}
                          disabled={!csvPayItemSuggestionsByKey[key]}
                        >
                          Use suggested payroll item
                        </Button>
                        <Accordion elevation={0} disableGutters>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2">Advanced manual entry</Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ px: 0 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={payItemCodeLabel}
                              helperText={payItemHelperText(key)}
                              value={missingPayItemDrafts[key]?.provider_item_id || ""}
                              onChange={(event) => setMissingPayItemDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), provider_item_id: event.target.value } }))}
                              sx={{ mb: 1 }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              label="Display name"
                              value={missingPayItemDrafts[key]?.provider_item_name || ""}
                              onChange={(event) => setMissingPayItemDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), provider_item_name: event.target.value } }))}
                              sx={{ mb: 1 }}
                            />
                            <Button variant="outlined" onClick={() => saveMissingPayItemMapping(key)}>Save match</Button>
                          </AccordionDetails>
                        </Accordion>
                      </Stack>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Box>
          )}
          {(previewMissingRegionRows.length > 0 || formatList(csvBlockingErrors).some((item) => REGION_METADATA_ERROR_CODES.has(issueCode(item)))) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Missing employee export location metadata</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Open employee profiles and fill country/province so Payroll Handoff can attach the correct export location metadata.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="outlined" onClick={openEmployeeProfiles}>Open employee profiles</Button>
              </Stack>
            </Box>
          )}
          <Accordion elevation={0} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Advanced mapping management</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Employee mapping management</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Legacy external payroll employee IDs are bootstrap-only. Live Payroll Handoff uses PayrollProviderEmployeeMap only.
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={5}>
                      <TextField fullWidth size="small" label="Search employees or provider IDs" value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="provider-sync-employee-filter-label">Employee filter</InputLabel>
                        <Select labelId="provider-sync-employee-filter-label" label="Employee filter" value={employeeFilter} onChange={(event) => { setEmployeeFilter(event.target.value); setEmployeePage(0); }}>
                          <MenuItem value="current_run_unmapped">Current-run unmapped</MenuItem>
                          <MenuItem value="unmapped_all">All unmapped</MenuItem>
                          <MenuItem value="mapped">Mapped only</MenuItem>
                          <MenuItem value="all">All visible</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}><Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>Showing {pagedEmployeeMappingRows.length} of {employeeMappingRows.length}</Typography></Grid>
                  </Grid>
                  {!employeeMappingRows.length ? (
                    <Alert severity="success">{runData ? "No employees in the current view need mapping attention." : "No employee mappings to review in the current filter."}</Alert>
                  ) : (
                    <Stack spacing={2}>
                      {pagedEmployeeMappingRows.map((row) => (
                        <Grid container spacing={2} key={`${row.employee_id}-${row.source}`} alignItems="center">
                          <Grid item xs={12} md={3}>
                            <Typography variant="body2"><strong>{row.employee_name || row.employee_name_snapshot || `Employee ${row.employee_id}`}</strong></Typography>
                            <Typography variant="caption" color="text.secondary">Employee ID {row.employee_id}{row.employee_email ? ` • ${row.employee_email}` : ""}</Typography>
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <Chip size="small" sx={row.provider_employee_id ? chipSx.success : chipSx.warning} label={row.provider_employee_id ? "Mapped" : row.source === "run_unmapped" ? "Current run unmapped" : "Needs mapping"} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label={employeeCodeLabel}
                              helperText="For CSV testing, you can enter a temporary code. For real QuickBooks sync, this should match the employee record in QuickBooks."
                              value={employeeMappingDrafts[row.employee_id] ?? row.provider_employee_id ?? ""}
                              onChange={(event) => handleEmployeeMapChange(row.employee_id, event.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Button variant="outlined" onClick={() => saveEmployeeMapping(row)}>Save employee mapping</Button>
                          </Grid>
                        </Grid>
                      ))}
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button variant="outlined" disabled={employeePage === 0} onClick={() => setEmployeePage((page) => Math.max(0, page - 1))}>Previous</Button>
                        <Button variant="outlined" disabled={(employeePage + 1) * employeePageSize >= employeeMappingRows.length} onClick={() => setEmployeePage((page) => page + 1)}>Next</Button>
                      </Stack>
                    </Stack>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Pay item mapping management</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Core payroll mappings appear first. Optional payroll adjustment mappings are available for future periods and only become required when those lines exist in a selected run.
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="provider-sync-local-key-label">Local key</InputLabel>
                        <Select labelId="provider-sync-local-key-label" label="Local key" value={payItemDraft.local_key} onChange={(event) => setPayItemDraft((prev) => ({ ...prev, local_key: event.target.value }))}>
                          {sortPayItemKeys(Object.keys(payItemLabel)).map((key) => (
                            <MenuItem key={key} value={key}>{payItemLabel[key] || key}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth size="small" label={payItemCodeLabel} value={payItemDraft.provider_item_id} onChange={(event) => setPayItemDraft((prev) => ({ ...prev, provider_item_id: event.target.value }))} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Display name" value={payItemDraft.provider_item_name} onChange={(event) => setPayItemDraft((prev) => ({ ...prev, provider_item_name: event.target.value }))} /></Grid>
                    <Grid item xs={12}><Button variant="outlined" onClick={savePayItemMapping}>Save pay item mapping</Button></Grid>
                  </Grid>
                  <Typography variant="subtitle2" gutterBottom>Core payroll mappings</Typography>
                  <Table size="small" sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Local key</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>{payItemCodeLabel}</TableCell>
                        <TableCell>Display name</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {corePayItemMappings.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{payItemLabel[row.local_key] || row.local_key}</TableCell>
                          <TableCell>{row.item_category}</TableCell>
                          <TableCell>{row.provider_item_id || "—"}</TableCell>
                          <TableCell>{row.provider_item_name || "—"}</TableCell>
                          <TableCell>{row.is_active ? "active" : "inactive"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Accordion elevation={0} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">Optional payroll adjustment mappings</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0 }}>
                      {!optionalPayItemMappings.length ? (
                        <Typography variant="body2" color="text.secondary">No optional payroll adjustment mappings are available yet.</Typography>
                      ) : (
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Local key</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell>{payItemCodeLabel}</TableCell>
                              <TableCell>Display name</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {optionalPayItemMappings.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell>{payItemLabel[row.local_key] || row.local_key}</TableCell>
                                <TableCell>{row.item_category}</TableCell>
                                <TableCell>{row.provider_item_id || "—"}</TableCell>
                                <TableCell>{row.provider_item_name || "—"}</TableCell>
                                <TableCell>{row.is_active ? "active" : "inactive"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>
          <Accordion elevation={0} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Technical details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              {previewData && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Preview errors</Typography>
                  {renderJsonList(previewData.errors)}
                </Box>
              )}
              {validationData && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Validation errors</Typography>
                    {renderJsonList(validationData.errors)}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Validation warnings</Typography>
                    {renderJsonList(validationData.warnings)}
                  </Grid>
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}

      <Accordion elevation={0} disableGutters ref={runPanelRef} sx={lowerAccordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Current batch</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
        <Tooltip title="Details for the currently selected payroll handoff run, including validation state and source hash.">
          <Chip label="Batch details" sx={chipSx.neutral} />
        </Tooltip>
        <Box sx={{ mb: 2 }} />
        {!activeRunId ? (
          <Alert severity="info">
            No provider run selected. Create a run or select one from history.
          </Alert>
        ) : (
          <>
            {runNotice && <Alert severity="info" sx={{ mb: 2 }}>{runNotice}</Alert>}
            {runError && <Alert severity="error" sx={{ mb: 2 }}>{runError}</Alert>}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
              <Chip label={`Run: ${activeRun?.id || "—"}`} sx={chipSx.active} />
              <Chip label={`Period: ${activeRun?.start_date || "—"} to ${activeRun?.end_date || "—"}`} sx={chipSx.neutral} />
              <Chip label={`Status: ${runStatusLabel(activeRun?.status)}`} sx={chipSx.neutral} />
              <Chip label={`Employees: ${activeRun?.employee_count ?? 0}`} sx={chipSx.neutral} />
              <Chip label={`Lines: ${activeRun?.time_entry_count ?? 0}`} sx={chipSx.neutral} />
              <Chip label={`Hours: ${activeRun?.total_hours ?? 0}`} sx={chipSx.neutral} />
              <Chip label={`Adjustment lines: ${selectedRunAdjustmentCount}`} sx={chipSx.neutral} />
              <Chip label={`Adjustment total: ${selectedRunAdjustmentTotal}`} sx={chipSx.neutral} />
              <Chip label={`Validation: ${validationData?.status || "Not validated yet"}`} sx={chipSx.neutral} />
            </Stack>
            <Accordion elevation={0} disableGutters sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Source hash details</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0 }}>
                <Typography variant="body2">
                  <strong>Source hash:</strong>{" "}
                  <Tooltip title={activeRun?.source_hash || "—"}>
                    <Box component="span" sx={{ fontFamily: "monospace" }}>{shortenHash(activeRun?.source_hash)}</Box>
                  </Tooltip>
                </Typography>
              </AccordionDetails>
            </Accordion>
            {hasFixBeforeExportIssues && (
              <Paper elevation={0} sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: "#fff8e8", border: "1px solid #f2cb6b" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Fix before export</Typography>
                {renderManagerMessages(fixBeforeExportIssues, validationData ? currentRunContext : previewIssueContext)}
              </Paper>
            )}
            {validationOnlyCapabilityLimitation && (
              <Paper elevation={0} sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: "#f7f9fc", border: "1px solid #dbe5ff" }}>
                <Typography variant="body2">
                  Live QuickBooks payroll/time submit is not enabled. CSV export is still available.
                </Typography>
              </Paper>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" onClick={handleValidateRun} disabled={validationLoading || !activeRunId}>
                {validationLoading ? <CircularProgress size={18} /> : "Check CSV readiness"}
              </Button>
              <Button variant="outlined" onClick={handlePreviewPayload} disabled={payloadLoading || provider !== "quickbooks" || !activeRunId}>
                {payloadLoading ? <CircularProgress size={18} /> : "Preview provider payload"}
              </Button>
              <Tooltip title={csvBlockedReasonText}>
                <span>
                  <Button variant="outlined" onClick={handleCsvDownload} disabled={downloadLoading || !csvDownloadAllowed}>
                    {downloadLoading ? <CircularProgress size={18} /> : "Download Payroll Handoff CSV"}
                  </Button>
                </span>
              </Tooltip>
            </Stack>
            {csvBlockedReasonText && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {csvBlockedReasonText}
              </Typography>
            )}
          </>
        )}
        </AccordionDetails>
      </Accordion>

      {activeRunId && (
        <Accordion elevation={0} disableGutters sx={lowerAccordionSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Advanced: provider payload</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Preview provider inputs only. This does not submit official payroll and does not pay employees.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Direct provider submission is not enabled. CSV export is available.
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
            <Button variant="outlined" onClick={handlePreviewPayload} disabled={payloadLoading || provider !== "quickbooks"}>
              {payloadLoading ? <CircularProgress size={18} /> : "Preview provider payload"}
            </Button>
            <Tooltip title={csvBlockedReasonText}>
              <span>
                <Button variant="contained" onClick={handleCsvDownload} disabled={downloadLoading || !csvDownloadAllowed}>
                  {downloadLoading ? <CircularProgress size={18} /> : "Download Payroll Handoff CSV"}
                </Button>
              </span>
            </Tooltip>
          </Stack>
          {!payloadPreview ? (
            <Typography variant="body2" color="text.secondary">
              Preview the provider payload after validation if you want to inspect the handoff line by line before exporting.
            </Typography>
          ) : (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={2}><Typography variant="body2"><strong>Total lines:</strong> {payloadPreview.summary?.total_lines ?? 0}</Typography></Grid>
                <Grid item xs={12} md={2}><Typography variant="body2"><strong>Valid lines:</strong> {payloadPreview.summary?.valid_lines ?? 0}</Typography></Grid>
                <Grid item xs={12} md={2}><Typography variant="body2"><strong>Invalid lines:</strong> {payloadPreview.summary?.invalid_lines ?? 0}</Typography></Grid>
                <Grid item xs={12} md={2}><Typography variant="body2"><strong>Employees:</strong> {payloadPreview.summary?.employees_count ?? 0}</Typography></Grid>
                <Grid item xs={12} md={2}><Typography variant="body2"><strong>Total hours:</strong> {payloadPreview.summary?.total_hours ?? 0}</Typography></Grid>
                <Grid item xs={12} md={2}><Typography variant="body2"><strong>Missing employee mappings:</strong> {formatList(payloadPreview.summary?.missing_employee_mappings).join(", ") || "None"}</Typography></Grid>
                <Grid item xs={12} md={12}><Typography variant="body2"><strong>Missing pay item mappings:</strong> {formatList(payloadPreview.summary?.missing_pay_item_mappings).join(", ") || "None"}</Typography></Grid>
              </Grid>
              {payloadPreview.errors?.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {payloadPreview.errors.length} provider preview issue(s) were detected.
                </Alert>
              )}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Manager view</Typography>
                {renderManagerMessages(payloadPreview.errors, currentRunContext)}
              </Box>
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 980 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Work date</TableCell>
                      <TableCell>Earning key</TableCell>
                      <TableCell align="right">Hours</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Provider employee id</TableCell>
                      <TableCell>Provider item id</TableCell>
                      <TableCell>Status / errors</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(payloadPreview.line_previews || []).map((line) => (
                      <TableRow key={line.line_id}>
                        <TableCell>{line.employee_name_snapshot || "—"}</TableCell>
                        <TableCell>{line.work_date || "—"}</TableCell>
                        <TableCell>{line.earning_key || "—"}</TableCell>
                        <TableCell align="right">{line.hours ?? 0}</TableCell>
                        <TableCell align="right">{line.rate ?? 0}</TableCell>
                        <TableCell align="right">{line.amount_preview ?? 0}</TableCell>
                        <TableCell>{line.provider_employee_id || "—"}</TableCell>
                        <TableCell>{line.provider_item_id || "—"}</TableCell>
                        <TableCell>
                          {line.is_valid ? (
                            <Chip size="small" sx={chipSx.success} label="Valid" />
                          ) : (
                            <Stack spacing={0.5}>
                              <Chip size="small" sx={chipSx.warning} label="Needs attention" />
                              {line.errors?.map((error, index) => (
                                <Typography variant="caption" color="error" key={`${line.line_id}-${index}`}>
                                  {error?.code || error?.message}
                                </Typography>
                              ))}
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Send directly to payroll provider</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Direct provider submission will be enabled after production credentials, required scopes, and provider support are confirmed.
            </Alert>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}><Typography variant="body2"><strong>Provider selected:</strong> {PROVIDER_OPTIONS.find((item) => item.value === provider)?.label || provider}</Typography></Grid>
              <Grid item xs={12} md={4}><Typography variant="body2"><strong>Provider account connected:</strong> {provider === "quickbooks" ? (setupStatus?.connection_status === "connected" ? "Connected" : "Not connected") : "Not required for CSV handoff"}</Typography></Grid>
              <Grid item xs={12} md={4}><Typography variant="body2"><strong>Production access confirmed:</strong> {provider === "quickbooks" ? (setupStatus?.provider_environment === "production" ? "Ready" : "Not ready") : "Coming later"}</Typography></Grid>
              <Grid item xs={12} md={4}><Typography variant="body2"><strong>Employee matching:</strong> {missingEmployeeIssueRows.length ? "Incomplete" : "Ready"}</Typography></Grid>
              <Grid item xs={12} md={4}><Typography variant="body2"><strong>Pay item matching:</strong> {missingPayItemKeys.length ? "Incomplete" : "Ready"}</Typography></Grid>
              <Grid item xs={12} md={4}><Typography variant="body2"><strong>Supported line types:</strong> time-based lines only, not confirmed</Typography></Grid>
              <Grid item xs={12}><Typography variant="body2"><strong>Unsupported line types today:</strong> tips, bonus, commission, reimbursements, and other amount-only adjustments for direct provider submit</Typography></Grid>
            </Grid>
            <Tooltip title="Available after QuickBooks production payroll/time access is enabled.">
              <span>
                <Button variant="outlined" disabled>Send directly to payroll provider</Button>
              </span>
            </Tooltip>
          </Box>
          </AccordionDetails>
        </Accordion>
      )}

      <Accordion elevation={0} disableGutters sx={lowerAccordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Run history</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <Chip label={`History scope: ${currentScopeLabel}`} sx={chipSx.active} />
          <Tooltip title="Run history shows company payroll handoff runs narrowed by the current history filters. It tracks draft, validated, payload-previewed, CSV-exported, failed, and unsupported runs only.">
            <Chip label="How history works" sx={chipSx.neutral} />
          </Tooltip>
        </Stack>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="provider-sync-history-status-label">Status filter</InputLabel>
              <Select
                labelId="provider-sync-history-status-label"
                label="Status filter"
                value={historyStatusFilter}
                onChange={(event) => setHistoryStatusFilter(event.target.value)}
              >
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="draft">draft</MenuItem>
                <MenuItem value="validated">validated</MenuItem>
                <MenuItem value="unsupported">unsupported</MenuItem>
                <MenuItem value="failed">failed</MenuItem>
                <MenuItem value="submitted_to_time_tracking">time activity submitted</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="provider-sync-history-department-label">Department</InputLabel>
              <Select
                labelId="provider-sync-history-department-label"
                label="Department"
                value={historyDepartmentFilter}
                onChange={(event) => {
                  setHistoryDepartmentFilter(event.target.value);
                  setHistoryEmployeeFilter("");
                }}
              >
                <MenuItem value="">All departments</MenuItem>
                {departments.map((department) => (
                  <MenuItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="provider-sync-history-employee-label">Employee</InputLabel>
              <Select
                labelId="provider-sync-history-employee-label"
                label="Employee"
                value={historyEmployeeFilter}
                onChange={(event) => setHistoryEmployeeFilter(event.target.value)}
              >
                <MenuItem value="">
                  {historyDepartmentFilter ? "All employees in selected department" : "All employees"}
                </MenuItem>
                {historyScopedRecruiters.map((row) => (
                  <MenuItem key={row.id} value={String(row.id)}>
                    {`${row.first_name} ${row.last_name}`.trim()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start date"
              InputLabelProps={{ shrink: true }}
              value={historyStartFilter}
              onChange={(event) => setHistoryStartFilter(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End date"
              InputLabelProps={{ shrink: true }}
              value={historyEndFilter}
              onChange={(event) => setHistoryEndFilter(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => loadRunHistory({ offset: 0 })}>Apply</Button>
              <Button
                variant="text"
                onClick={() => {
                  setHistoryStatusFilter("");
                  setHistoryDepartmentFilter(departmentFilter ? String(departmentFilter) : "");
                  setHistoryEmployeeFilter(selectedRecruiter ? String(selectedRecruiter) : "");
                  setHistoryStartFilter(startDate || "");
                  setHistoryEndFilter(endDate || "");
                  loadRunHistory({
                    offset: 0,
                    status: "",
                    department_id: departmentFilter ? String(departmentFilter) : "",
                    employee_id: selectedRecruiter ? String(selectedRecruiter) : "",
                    start_date: startDate || "",
                    end_date: endDate || "",
                  });
                }}
              >
                Reset
              </Button>
            </Stack>
          </Grid>
        </Grid>
        {selectedHistoryRun && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Selected run #{selectedHistoryRun.id}: {selectedHistoryRun.start_date} to {selectedHistoryRun.end_date} • status {selectedHistoryRun.status || "draft"} • payload previewed {selectedHistoryRun.payload_previewed_at ? "yes" : "no"} • CSV exported {selectedHistoryRun.csv_exported_at ? "yes" : "no"}.
          </Alert>
        )}
        {historyLoading ? (
          <CircularProgress size={20} />
        ) : !runHistory.length ? (
          <Typography variant="body2" color="text.secondary">No provider runs found yet.</Typography>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow>
                <TableCell>Run ID</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="right">Employees</TableCell>
                <TableCell align="right">Lines</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>CSV exported</TableCell>
                <TableCell>Source hash</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runHistory.map((item) => (
                <TableRow
                  key={item.id}
                  selected={item.id === selectedRunId}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => loadSelectedRun(item.id)}
                >
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.start_date} to {item.end_date}</TableCell>
                  <TableCell align="right">{formatNumber(item.employee_count)}</TableCell>
                  <TableCell align="right">{formatNumber(item.time_entry_count)}</TableCell>
                  <TableCell>{item.status || "draft"}</TableCell>
                  <TableCell>{item.csv_exported_at ? "Yes" : "No"}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Tooltip title={item.source_hash || "—"}>
                      <Box component="span" sx={{ fontFamily: "monospace" }}>
                        {shortenHash(item.source_hash, 10)}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.75} sx={{ minWidth: 120 }}>
                      <Button
                        size="small"
                        variant={item.id === selectedRunId ? "contained" : "outlined"}
                        onClick={(event) => {
                          event.stopPropagation();
                          loadSelectedRun(item.id);
                        }}
                      >
                        {item.id === selectedRunId ? "Selected" : "View run"}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleHistoryValidate(item.id, item);
                        }}
                      >
                        Validate
                      </Button>
                      {item.provider === "quickbooks" && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleHistoryPreviewPayload(item.id);
                          }}
                        >
                          Preview payload
                        </Button>
                      )}
                      {item.id === selectedRunId && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={!csvDownloadAllowed}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleHistoryCsvDownload(item.id, item.provider);
                          }}
                        >
                          Download CSV
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
        )}
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            disabled={historyLoading || !runHistoryMeta.offset}
            onClick={() => loadRunHistory({ offset: Math.max(0, (runHistoryMeta.offset || 0) - (runHistoryMeta.limit || 10)) })}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            disabled={historyLoading || !runHistoryMeta.has_more}
            onClick={() => loadRunHistory({ offset: (runHistoryMeta.offset || 0) + (runHistoryMeta.limit || 10) })}
          >
            Next
          </Button>
        </Stack>
        {latestPreviousRun && previewData?.source_hash && latestPreviousRun.source_hash !== previewData.source_hash && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            The current preview source hash differs from the most recent earlier run for this same period. This usually means approved time or saved Payroll Preview adjustments changed.
          </Alert>
        )}
        </AccordionDetails>
      </Accordion>
      </>
      )}
    </Stack>
  );
}
