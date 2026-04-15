import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import RefreshIcon from "@mui/icons-material/Refresh";
import SectionCard from "../../components/ui/SectionCard";
import api, { leaveSettings } from "../../utils/api";
import { LEAVE_TYPE_OPTIONS, formatLeaveTypeLabel } from "./utils/leaveSettings";

const REPORT_TYPES = [
  { value: "activity", label: "Activity", description: "Leave request history and payroll-readiness context." },
  { value: "balance", label: "Balance", description: "Current leave balance position by employee and leave type." },
  { value: "ledger", label: "Ledger", description: "Audit trail for leave balance movements." },
  { value: "liability", label: "Liability", description: "Estimated accounting liability from current balances and employee rates." },
  { value: "accrual_runs", label: "Accrual runs", description: "Saved accrual posting run history for accounting review." },
  { value: "accrual_run_rows", label: "Accrual run rows", description: "Employee-level detail rows inside a saved accrual run." },
  { value: "carryover_preview", label: "Carryover preview", description: "Read-only year-end carryover, cap, and forfeiture estimate." },
  { value: "carryover_runs", label: "Carryover runs", description: "Applied carryover run history and year-end close audit." },
  { value: "carryover_run_rows", label: "Carryover run rows", description: "Employee-level rows inside an applied carryover run." },
];

const STATUS_OPTIONS = [
  { value: "", label: "All active statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const ACCRUAL_RUN_STATUS_OPTIONS = [
  { value: "", label: "All run statuses" },
  { value: "posted", label: "Posted" },
  { value: "partial", label: "Partial" },
  { value: "skipped", label: "Skipped" },
  { value: "failed", label: "Failed" },
];

const CARRYOVER_RUN_STATUS_OPTIONS = [
  { value: "", label: "All carryover statuses" },
  { value: "posted", label: "Posted" },
  { value: "no_adjustment_needed", label: "No adjustment needed" },
  { value: "skipped_not_balance_managed", label: "Skipped: not balance-managed" },
  { value: "skipped_no_positive_balance", label: "Skipped: no positive balance" },
];

const STATUS_LABELS = {
  posted: "Posted",
  partial: "Partial",
  skipped: "Skipped",
  failed: "Failed",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  no_adjustment_needed: "No adjustment needed",
  skipped_not_balance_managed: "Skipped: not balance-managed",
  skipped_no_positive_balance: "Skipped: no positive balance",
};

const STATUS_TONES = {
  posted: "success",
  approved: "success",
  no_adjustment_needed: "default",
  pending: "warning",
  partial: "warning",
  skipped: "warning",
  skipped_not_balance_managed: "warning",
  skipped_no_positive_balance: "warning",
  failed: "error",
  rejected: "error",
  cancelled: "default",
};

const STATUS_CHIP_SX = {
  posted: { bgcolor: "#dcfce7", color: "#14532d", borderColor: "#86efac" },
  approved: { bgcolor: "#dcfce7", color: "#14532d", borderColor: "#86efac" },
  no_adjustment_needed: { bgcolor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" },
  pending: { bgcolor: "#fef3c7", color: "#92400e", borderColor: "#fbbf24" },
  partial: { bgcolor: "#fef3c7", color: "#92400e", borderColor: "#fbbf24" },
  skipped: { bgcolor: "#fff7ed", color: "#9a3412", borderColor: "#fdba74" },
  skipped_not_balance_managed: { bgcolor: "#fff7ed", color: "#9a3412", borderColor: "#fdba74" },
  skipped_no_positive_balance: { bgcolor: "#fff7ed", color: "#9a3412", borderColor: "#fdba74" },
  failed: { bgcolor: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" },
  rejected: { bgcolor: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" },
  cancelled: { bgcolor: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" },
};

const PAID_OPTIONS = [
  { value: "", label: "Paid and unpaid" },
  { value: "true", label: "Paid only" },
  { value: "false", label: "Unpaid only" },
];

const PAYROLL_READY_OPTIONS = [
  { value: "", label: "Any payroll readiness" },
  { value: "true", label: "Ready for payroll" },
  { value: "false", label: "Not payroll-ready" },
];

const INCLUDE_CANCELLED_OPTIONS = [
  { value: "false", label: "Exclude cancelled" },
  { value: "true", label: "Include cancelled" },
];

const TRIGGER_TYPE_OPTIONS = [
  { value: "", label: "All trigger types" },
  { value: "manual", label: "Manual" },
  { value: "scheduled", label: "Scheduled" },
];

const SKIPPED_OPTIONS = [
  { value: "", label: "Posted and skipped" },
  { value: "false", label: "Posted only" },
  { value: "true", label: "Skipped only" },
];

const PDF_REPORT_TYPES = new Set(["activity", "liability"]);

const reportAccent = {
  activity: "#2563eb",
  balance: "#0f766e",
  ledger: "#7c3aed",
  liability: "#b45309",
  accrual_runs: "#0369a1",
  accrual_run_rows: "#0e7490",
  carryover_preview: "#15803d",
  carryover_runs: "#166534",
  carryover_run_rows: "#166534",
};

const defaultFilters = () => ({
  report_type: "activity",
  start_date: dayjs().startOf("month").format("YYYY-MM-DD"),
  end_date: dayjs().format("YYYY-MM-DD"),
  as_of_date: dayjs().format("YYYY-MM-DD"),
  department_id: "",
  recruiter_id: "",
  leave_type: "",
  status: "",
  paid: "",
  payroll_ready: "",
  include_cancelled: "false",
  trigger_type: "",
  skipped: "",
  run_id: "",
});

const safeArray = (value) => (Array.isArray(value) ? value : []);

const HELP_REPORTS = [
  {
    title: "Activity",
    purpose: "Review leave request history across employees, dates, statuses, paid/unpaid flags, and payroll-readiness context.",
    use: "Use this when an accountant asks what leave was requested, approved, cancelled, or prepared for payroll in a period.",
    export: "CSV and PDF summary are available.",
  },
  {
    title: "Balance",
    purpose: "See current ledger-derived leave balances by employee and leave type, including balance policy context.",
    use: "Use this to review who has available hours, which leave types are balance-managed, and where balances may need cleanup.",
    export: "CSV export is available.",
  },
  {
    title: "Ledger",
    purpose: "Audit every leave balance movement with deltas, running balances, source type, source id, and creator details.",
    use: "Use this when you need to explain why an employee balance changed.",
    export: "CSV export is available.",
  },
  {
    title: "Liability",
    purpose: "Estimate accounting liability from positive leave balances and employee hourly rates.",
    use: "Use this for accountant review of potential leave liability. Missing-rate warnings show rows that need rate cleanup.",
    export: "CSV and PDF summary are available.",
  },
  {
    title: "Accrual runs",
    purpose: "Review saved accrual posting run history, including status, trigger type, posted hours, skipped rows, and errors.",
    use: "Use this to prove when accrual runs happened and whether they posted, partially posted, skipped, or failed.",
    export: "CSV export is available.",
  },
  {
    title: "Accrual run rows",
    purpose: "Drill into employee-level rows inside one accrual run, including proposed, posted, capped, skipped, and ledger-linked results.",
    use: "Select an accrual run first. Use this when accounting needs the row-level detail behind an accrual run.",
    export: "CSV export is available.",
  },
  {
    title: "Carryover preview",
    purpose: "Preview estimated year-end carryover, forfeiture, caps, and next-period opening balance effects.",
    use: "Use this before year-end decisions. The report preview is read-only; balances change only if a manager explicitly clicks Apply Carryover and confirms.",
    export: "CSV export is available.",
  },
  {
    title: "Carryover runs",
    purpose: "Review carryover apply runs after managers post year-end ledger adjustments.",
    use: "Use this to prove when carryover was applied and what totals were carried, forfeited, or marked for payout review.",
    export: "CSV export is available.",
  },
  {
    title: "Carryover run rows",
    purpose: "Audit employee-level results inside one applied carryover run, including ledger entry ids and payout review amounts.",
    use: "Select a carryover run first. Use this when accounting needs row-level carryover close details.",
    export: "CSV export is available.",
  },
];

const fmtNumber = (value, suffix = "") => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return `0${suffix}`;
  const rounded = Math.round(number * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}${suffix}`;
};

const statusLabel = (value) => {
  if (value == null || value === "") return "-";
  return STATUS_LABELS[String(value)] || String(value).replaceAll("_", " ");
};

const cellValue = (value, key) => {
  if (key === "status") return statusLabel(value);
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value == null || value === "") return "-";
  return String(value);
};

const compactEmployeeName = (row) =>
  row?.name || [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim() || row?.email || `Employee #${row?.id}`;

const getDownloadFilename = (headers, fallback) => {
  const disposition = headers?.["content-disposition"] || headers?.get?.("content-disposition") || "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1] || fallback;
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const tableEmptyMessage = (reportType) => {
  if (reportType === "carryover_preview") {
    return "No carryover preview rows matched the selected filters. Check the as-of date, leave type, employee, or department scope.";
  }
  if (reportType === "carryover_runs") {
    return "No carryover apply runs matched the selected filters yet.";
  }
  if (reportType === "carryover_run_rows") {
    return "Select a carryover run or adjust filters to see employee-level carryover results.";
  }
  if (reportType === "accrual_run_rows") {
    return "Select an accrual run or adjust filters to see employee-level accrual results.";
  }
  return "No report rows matched the selected filters.";
};

const renderCell = (value, key) => {
  if (key === "status") {
    const raw = String(value || "");
    return (
      <Chip
        size="small"
        label={statusLabel(value)}
        color={STATUS_TONES[raw] || "default"}
        variant="outlined"
        sx={{ fontWeight: 800, ...(STATUS_CHIP_SX[raw] || {}) }}
      />
    );
  }
  if (key === "payout_review_required" && value) {
    return <Chip size="small" color="warning" variant="outlined" label="Review payout" sx={{ fontWeight: 800 }} />;
  }
  return cellValue(value, key);
};

const buildParams = (filters, format = "json") => {
  const params = { report_type: filters.report_type, format };
  [
    "start_date",
    "end_date",
    "as_of_date",
    "department_id",
    "recruiter_id",
    "leave_type",
    "status",
    "paid",
    "payroll_ready",
    "include_cancelled",
    "trigger_type",
    "skipped",
    "run_id",
  ].forEach((key) => {
    if (filters[key] !== "" && filters[key] != null) params[key] = filters[key];
  });
  return params;
};

const SummaryCard = ({ label, value, helper, tone = "default" }) => {
  const color = {
    activity: reportAccent.activity,
    balance: reportAccent.balance,
    ledger: reportAccent.ledger,
    liability: reportAccent.liability,
    accrual_runs: reportAccent.accrual_runs,
    accrual_run_rows: reportAccent.accrual_run_rows,
    carryover_preview: reportAccent.carryover_preview,
    carryover_runs: reportAccent.carryover_runs,
    carryover_run_rows: reportAccent.carryover_run_rows,
    warning: "#b45309",
    default: "#0f172a",
  }[tone] || "#0f172a";

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 3,
        borderColor: "rgba(148, 163, 184, 0.35)",
        background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.05)",
      }}
    >
      <CardContent sx={{ py: 1.75 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase" }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={900} sx={{ color, mt: 0.35 }}>
          {value}
        </Typography>
        {helper && <Typography variant="caption" color="text.secondary">{helper}</Typography>}
      </CardContent>
    </Card>
  );
};

const HelpSection = ({ title, children }) => (
  <Box>
    <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 0.75 }}>
      {title}
    </Typography>
    <Stack spacing={0.75}>{children}</Stack>
  </Box>
);

const HelpText = ({ children }) => (
  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
    {children}
  </Typography>
);

const LeaveReportsHelpDrawer = ({ open, onClose }) => (
  <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, maxWidth: "100%" } }}>
    <Stack spacing={2.25} sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography variant="h6" fontWeight={900}>Leave Reports Help</Typography>
          <Typography variant="body2" color="text.secondary">
            How managers and accountants should use the reporting workspace.
          </Typography>
        </Box>
        <IconButton aria-label="Close leave reports help" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Alert severity="info" variant="outlined">
        This page is read-only. It exports accounting review data, but it does not finalize payroll, post accruals, post carryover, or change leave balances.
      </Alert>

      <HelpSection title="What managers can do here">
        <HelpText>Choose a report type, filter by date, employee, department, leave type, or status where relevant, then refresh the preview table.</HelpText>
        <HelpText>Download CSV files for accountants. Activity and Liability also support PDF summaries for quick review.</HelpText>
        <HelpText>Use warnings to identify missing rates, disabled carryover, skipped accrual rows, or policy gaps before accounting close.</HelpText>
        <HelpText>When using Carryover preview, managers can apply carryover manually after review. Apply posts leave ledger adjustments only and never pays employees automatically.</HelpText>
      </HelpSection>

      <Divider />

      <HelpSection title="Report types">
        {HELP_REPORTS.map((report) => (
          <Box
            key={report.title}
            sx={{
              border: "1px solid rgba(148, 163, 184, 0.32)",
              borderRadius: 2,
              p: 1.25,
              bgcolor: "rgba(248,250,252,0.72)",
            }}
          >
            <Typography variant="subtitle2" fontWeight={900}>{report.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
              {report.purpose}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
              Best use: {report.use}
            </Typography>
            <Chip size="small" variant="outlined" label={report.export} sx={{ mt: 0.9, fontWeight: 700 }} />
          </Box>
        ))}
      </HelpSection>

      <Divider />

      <HelpSection title="Export workflow">
        <HelpText>1. Select the report type.</HelpText>
        <HelpText>2. Set the date range or as-of date. Liability, Balance, Ledger, and Carryover Preview depend heavily on the as-of date.</HelpText>
        <HelpText>3. Apply employee, department, leave type, status, paid, payroll-ready, or accrual filters where they appear.</HelpText>
        <HelpText>4. Click Refresh to preview the rows.</HelpText>
        <HelpText>5. Click Download CSV for accountant-ready export. Use PDF only where the button appears.</HelpText>
      </HelpSection>

      <Divider />

      <HelpSection title="Why this helps">
        <HelpText>Accountants get one source for leave activity, balances, ledger movements, liability estimates, accrual history, and carryover estimates.</HelpText>
        <HelpText>Managers can answer year-end and payroll questions without running payroll finalization or changing employee balances.</HelpText>
        <HelpText>The report table provides preview visibility before export, reducing accidental wrong-period or wrong-employee reports.</HelpText>
      </HelpSection>
    </Stack>
  </Drawer>
);

const CarryoverHelpDrawer = ({ open, onClose }) => (
  <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, maxWidth: "100%" } }}>
    <Stack spacing={2.25} sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography variant="h6" fontWeight={900}>How Carryover Works</Typography>
          <Typography variant="body2" color="text.secondary">
            A simple year-end workflow for carrying unused leave into the next policy year.
          </Typography>
        </Box>
        <IconButton aria-label="Close carryover help" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Alert severity="warning" variant="outlined">
        Carryover apply updates leave balances only. It does not pay employees, finalize payroll, change payroll formulas, or change leave request status.
      </Alert>

      <HelpSection title="Configure carryover">
        <HelpText>Go to Leave Settings, then Leave allowances & balance rules. Choose a leave type and open the Year-end carryover section.</HelpText>
        <HelpText>Turn carryover on or off. If carryover is on, set Carryover cap hours to the maximum unused hours that can move into the next policy year.</HelpText>
      </HelpSection>

      <Divider />

      <HelpSection title="Review year-end preview">
        <HelpText>Go to Leave Reports and choose Carryover preview. Set As-of date to the end of the policy year, such as 2026-12-31.</HelpText>
        <HelpText>Review current balance, estimated carryover, estimated forfeited hours, next opening estimate, warnings, and payout review estimate.</HelpText>
      </HelpSection>

      <Divider />

      <HelpSection title="Apply carryover">
        <HelpText>Click Apply Carryover only after the preview looks correct. The confirmation modal shows the selected scope and totals before anything is posted.</HelpText>
        <HelpText>Apply Carryover posts ledger adjustments, creates carryover run history, and removes hours above the cap from leave balance where needed.</HelpText>
        <HelpText>Applying the same scope again is protected: the system returns the existing run instead of posting duplicate ledger entries.</HelpText>
      </HelpSection>

      <Divider />

      <HelpSection title="Payroll payout note">
        <HelpText>If company policy pays unused leave instead of forfeiting it, process that payout separately in payroll.</HelpText>
        <HelpText>The payout estimate is only for manager/accountant review. Employees should not keep the same unused hours in their leave balance and also be paid for those hours.</HelpText>
      </HelpSection>

      <Divider />

      <HelpSection title="Review history">
        <HelpText>Carryover runs shows each applied year-end carryover run and its totals.</HelpText>
        <HelpText>Carryover run rows shows employee-level details, including carried hours, forfeited hours, payout review amount, and ledger entry ids.</HelpText>
      </HelpSection>

      <Divider />

      <HelpSection title="Simple example">
        <Box sx={{ border: "1px solid rgba(148, 163, 184, 0.32)", borderRadius: 2, p: 1.25, bgcolor: "rgba(248,250,252,0.72)" }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Employee balance = <strong>15h</strong>. Carryover cap = <strong>10h</strong>. Result: <strong>10h carried</strong>, <strong>5h not carried</strong>, and the next period opening estimate is <strong>10h</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mt: 0.75 }}>
            If the company pays unused leave, the 5h payout is handled separately in payroll after accounting review.
          </Typography>
        </Box>
      </HelpSection>

      <Divider />

      <HelpSection title="Recommended year-end workflow">
        {[
          "Configure carryover.",
          "Run Carryover preview.",
          "Review warnings and payout estimate.",
          "Apply Carryover after confirmation.",
          "Handle payroll payout separately if company policy requires it.",
          "Review Carryover runs and Carryover run rows.",
        ].map((step, index) => (
          <HelpText key={step}>{index + 1}. {step}</HelpText>
        ))}
      </HelpSection>

      <Alert severity="info" variant="outlined">
        V1 is manual by design: no auto-carryover scheduling, no auto-pay, no payroll formula changes, and no policy versioning.
      </Alert>
    </Stack>
  </Drawer>
);

const summaryCards = (report) => {
  const summary = report?.summary || {};
  const type = report?.report_type || "activity";
  if (type === "activity") {
    return [
      ["Employees included", summary.employees_included || 0, "Filtered employee scope", "activity"],
      ["Leave rows", summary.leave_rows || 0, "Requests in selected range", "activity"],
      ["Paid leave hours", fmtNumber(summary.total_paid_leave_hours, " h"), "Computed from leave truth", "activity"],
      ["Unpaid leave hours", fmtNumber(summary.total_unpaid_leave_hours, " h"), "Tracked separately", "default"],
      ["Ready for payroll", summary.payroll_ready_rows || 0, "Approved payroll-ready rows", "balance"],
    ];
  }
  if (type === "balance") {
    return [
      ["Employees included", summary.employees_included || 0, "Filtered employee scope", "balance"],
      ["Balance rows", summary.balance_rows || 0, "Employee and leave type rows", "balance"],
      ["Current balance", fmtNumber(summary.total_current_balance_hours, " h"), "Ledger-derived total", "balance"],
      ["Managed rows", summary.balance_managed_rows || 0, "Balance-managed policies", "default"],
    ];
  }
  if (type === "ledger") {
    return [
      ["Employees included", summary.employees_included || 0, "Filtered employee scope", "ledger"],
      ["Ledger entries", summary.ledger_entries || 0, "Balance movements", "ledger"],
      ["Net movement", fmtNumber(summary.total_delta_hours, " h"), "Sum of deltas", "ledger"],
    ];
  }
  if (type === "liability") {
    return [
      ["Employees included", summary.employees_included || 0, "Filtered employee scope", "liability"],
      ["Liability rows", summary.liability_rows || 0, "Employee and leave type rows", "liability"],
      ["Payable hours", fmtNumber(summary.total_payable_balance_hours, " h"), "Positive balances only", "liability"],
      ["Estimated liability", `$${fmtNumber(summary.total_estimated_liability_amount)}`, "Accounting estimate", "liability"],
      ["Missing rates", summary.missing_rate_count || 0, "Rows needing rate review", summary.missing_rate_count ? "warning" : "default"],
    ];
  }
  if (type === "accrual_runs") {
    return [
      ["Runs included", summary.runs_included || 0, "Saved accrual runs", "accrual_runs"],
      ["Posted hours", fmtNumber(summary.total_posted_hours, " h"), "Total posted accruals", "accrual_runs"],
      ["Employees posted", summary.total_employees_posted || 0, "Rows that posted accrual", "balance"],
      ["Skipped rows", summary.total_skipped_rows || 0, "Rows skipped by policy", summary.total_skipped_rows ? "warning" : "default"],
    ];
  }
  if (type === "carryover_preview") {
    return [
      ["Employees included", summary.employees_included || 0, "Filtered employee scope", "carryover_preview"],
      ["Rows included", summary.rows_included || 0, "Employee and leave type rows", "carryover_preview"],
      ["Estimated carryover", fmtNumber(summary.total_estimated_carryover_hours, " h"), "Opening balance estimate", "carryover_preview"],
      ["Estimated forfeited", fmtNumber(summary.total_estimated_forfeited_hours, " h"), "Hours above policy carryover", summary.total_estimated_forfeited_hours ? "warning" : "default"],
      ["Payout review", `$${fmtNumber(summary.total_estimated_excess_value)}`, "Manual payroll review only", summary.total_estimated_excess_value ? "warning" : "default"],
      ["Warnings", summary.rows_with_warnings || 0, "Rows needing policy review", summary.rows_with_warnings ? "warning" : "default"],
    ];
  }
  if (type === "carryover_runs") {
    return [
      ["Runs included", summary.runs_included || 0, "Applied carryover runs", "carryover_runs"],
      ["Posted runs", summary.posted_runs || 0, "Runs with ledger adjustments", "carryover_runs"],
      ["Carried hours", fmtNumber(summary.total_carried_hours, " h"), "Hours retained", "carryover_runs"],
      ["Forfeited hours", fmtNumber(summary.total_forfeited_hours, " h"), "Hours removed from balance", summary.total_forfeited_hours ? "warning" : "default"],
      ["Payout estimate", `$${fmtNumber(summary.total_payout_estimate_amount)}`, "Manual payroll review only", summary.total_payout_estimate_amount ? "warning" : "default"],
    ];
  }
  if (type === "carryover_run_rows") {
    return [
      ["Employees included", summary.employees_included || 0, "Filtered employee scope", "carryover_run_rows"],
      ["Rows included", summary.rows_included || 0, "Carryover detail rows", "carryover_run_rows"],
      ["Posted rows", summary.posted_rows || 0, "Rows with ledger adjustments", "carryover_run_rows"],
      ["Skipped rows", summary.skipped_rows || 0, "Rows without ledger adjustments", "default"],
      ["Forfeited hours", fmtNumber(summary.total_forfeited_hours, " h"), "Hours removed from balance", summary.total_forfeited_hours ? "warning" : "default"],
      ["Payout estimate", `$${fmtNumber(summary.total_payout_estimate_amount)}`, "Manual payroll review only", summary.total_payout_estimate_amount ? "warning" : "default"],
    ];
  }
  return [
    ["Employees included", summary.employees_included || 0, "Filtered employee scope", "accrual_run_rows"],
    ["Rows included", summary.rows_included || 0, "Accrual run detail rows", "accrual_run_rows"],
    ["Posted rows", summary.posted_rows || 0, "Rows that posted accrual", "balance"],
    ["Skipped rows", summary.skipped_rows || 0, "Rows skipped by policy", summary.skipped_rows ? "warning" : "default"],
    ["Posted hours", fmtNumber(summary.total_posted_hours, " h"), "Total posted accruals", "accrual_run_rows"],
    ["Capped hours", fmtNumber(summary.total_capped_hours, " h"), "Accrual capped by max balance", "default"],
  ];
};

export default function SettingsLeaveReports() {
  const [filters, setFilters] = useState(defaultFilters);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState("");
  const [metaError, setMetaError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accrualRuns, setAccrualRuns] = useState([]);
  const [carryoverRuns, setCarryoverRuns] = useState([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [carryoverHelpOpen, setCarryoverHelpOpen] = useState(false);
  const [carryoverConfirmOpen, setCarryoverConfirmOpen] = useState(false);
  const [applyingCarryover, setApplyingCarryover] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  const selectedReportType = useMemo(
    () => REPORT_TYPES.find((item) => item.value === filters.report_type) || REPORT_TYPES[0],
    [filters.report_type]
  );

  const employeeOptions = useMemo(() => {
    if (!filters.department_id) return employees;
    return employees.filter((employee) => String(employee.department_id || "") === String(filters.department_id));
  }, [employees, filters.department_id]);

  const isAccrualRunsReport = filters.report_type === "accrual_runs";
  const isAccrualRowsReport = filters.report_type === "accrual_run_rows";
  const isAccrualReport = isAccrualRunsReport || isAccrualRowsReport;
  const isCarryoverPreviewReport = filters.report_type === "carryover_preview";
  const isCarryoverRunsReport = filters.report_type === "carryover_runs";
  const isCarryoverRowsReport = filters.report_type === "carryover_run_rows";
  const isCarryoverReport = isCarryoverPreviewReport || isCarryoverRunsReport || isCarryoverRowsReport;

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get("/manager/recruiters"),
      api.get("/api/departments"),
      leaveSettings.listBalanceAccrualRuns({ limit: 100 }),
      leaveSettings.getAccountingReport({ report_type: "carryover_runs" }),
    ])
      .then(([rec, dept, runs, carryover]) => {
        if (!mounted) return;
        setEmployees(safeArray(rec?.data?.recruiters));
        setDepartments(safeArray(dept?.data?.departments || dept?.data));
        setAccrualRuns(safeArray(runs?.runs));
        setCarryoverRuns(safeArray(carryover?.rows));
      })
      .catch(() => {
        if (mounted) setMetaError("Unable to load all report filter metadata. Reports can still run with default scope.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "department_id" ? { recruiter_id: "" } : {}),
      ...(key === "report_type" && !["accrual_run_rows", "carryover_run_rows"].includes(value) ? { run_id: "", skipped: "" } : {}),
      ...(key === "report_type" && value !== "accrual_runs" ? { trigger_type: "" } : {}),
      ...(key === "report_type" && value === "carryover_preview" ? { status: "", paid: "", payroll_ready: "", include_cancelled: "false" } : {}),
    }));
  };

  const loadReport = async () => {
    if (filters.report_type === "accrual_run_rows" && !filters.run_id) {
      setReport(null);
      setError("Select an accrual run before loading row-level accrual details.");
      return;
    }
    if (filters.report_type === "carryover_run_rows" && !filters.run_id) {
      setReport(null);
      setError("Select a carryover run before loading row-level carryover details.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await leaveSettings.getAccountingReport(buildParams(filters));
      setReport(data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to load leave report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadCsv = async () => {
    if (filters.report_type === "accrual_run_rows" && !filters.run_id) {
      setError("Select an accrual run before exporting row-level accrual details.");
      return;
    }
    if (filters.report_type === "carryover_run_rows" && !filters.run_id) {
      setError("Select a carryover run before exporting row-level carryover details.");
      return;
    }
    setExporting(true);
    setError("");
    try {
      const response = await api.get("/manager/leave-accounting-report", {
        params: buildParams(filters, "csv"),
        responseType: "blob",
      });
      const filename = getDownloadFilename(response.headers, `leave-${filters.report_type}-report.csv`);
      triggerDownload(new Blob([response.data], { type: response.headers?.["content-type"] || "text/csv" }), filename);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to export CSV.");
    } finally {
      setExporting(false);
    }
  };

  const downloadPdf = async () => {
    if (!PDF_REPORT_TYPES.has(filters.report_type)) return;
    setExportingPdf(true);
    setError("");
    try {
      const response = await api.get("/manager/leave-accounting-report", {
        params: buildParams(filters, "pdf"),
        responseType: "blob",
      });
      const filename = getDownloadFilename(response.headers, `leave-${filters.report_type}-report.pdf`);
      triggerDownload(new Blob([response.data], { type: response.headers?.["content-type"] || "application/pdf" }), filename);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to export PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const rows = safeArray(report?.rows);
  const columns = safeArray(report?.columns);
  const reportSummary = report?.summary || {};

  const applyCarryover = async () => {
    setApplyingCarryover(true);
    setError("");
    setApplyResult(null);
    try {
      const payload = {
        as_of_date: filters.as_of_date,
        leave_type: filters.leave_type || undefined,
        department_id: filters.department_id || undefined,
        recruiter_id: filters.recruiter_id || undefined,
      };
      const result = await leaveSettings.applyCarryover(payload);
      setApplyResult(result);
      setCarryoverConfirmOpen(false);
      await loadReport();
      try {
        const carryover = await leaveSettings.getAccountingReport({ report_type: "carryover_runs" });
        setCarryoverRuns(safeArray(carryover?.rows));
      } catch (_err) {
        // Keep the successful apply result visible even if metadata refresh fails.
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to apply carryover.");
    } finally {
      setApplyingCarryover(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={900}>Leave Reports</Typography>
          <Typography variant="body2" color="text.secondary">
            Accountant-ready leave activity, balances, ledger movements, accruals, carryover previews, and liability reports.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {isCarryoverReport && (
            <Button variant="outlined" color="success" startIcon={<HelpOutlineIcon />} onClick={() => setCarryoverHelpOpen(true)}>
              How carryover works
            </Button>
          )}
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} onClick={() => setHelpOpen(true)}>
            How reports work
          </Button>
        </Stack>
      </Stack>

      <SectionCard
        title="Report filters"
        description="Choose the accounting view and employee slice. Reports are read-only and do not finalize payroll."
      >
        <Stack spacing={2}>
          {metaError && <Alert severity="warning" variant="outlined">{metaError}</Alert>}
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Report type"
                value={filters.report_type}
                onChange={(event) => updateFilter("report_type", event.target.value)}
              >
                {REPORT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From"
                InputLabelProps={{ shrink: true }}
                value={filters.start_date}
                onChange={(event) => updateFilter("start_date", event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To"
                InputLabelProps={{ shrink: true }}
                value={filters.end_date}
                onChange={(event) => updateFilter("end_date", event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="As of"
                InputLabelProps={{ shrink: true }}
                value={filters.as_of_date}
                onChange={(event) => updateFilter("as_of_date", event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", md: "flex-end" }}>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadReport} disabled={loading}>
                  {loading ? "Loading..." : "Refresh"}
                </Button>
                {isCarryoverPreviewReport && (
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => setCarryoverConfirmOpen(true)}
                    disabled={loading || rows.length === 0}
                  >
                    Apply Carryover
                  </Button>
                )}
                <Button variant="contained" startIcon={<DownloadIcon />} onClick={downloadCsv} disabled={exporting || loading}>
                  {exporting ? "Exporting..." : "Download CSV"}
                </Button>
                {PDF_REPORT_TYPES.has(filters.report_type) && (
                  <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={downloadPdf} disabled={exportingPdf || loading}>
                    {exportingPdf ? "Exporting..." : "PDF"}
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>

          <Grid container spacing={1.5}>
            {isAccrualRowsReport && (
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Accrual run"
                  value={filters.run_id}
                  onChange={(event) => updateFilter("run_id", event.target.value)}
                  helperText="Required for row-level accrual detail."
                >
                  <MenuItem value="">Select an accrual run</MenuItem>
                  {accrualRuns.map((run) => (
                    <MenuItem key={run.id} value={String(run.id)}>
                      #{run.id} · {formatLeaveTypeLabel(run.leave_type)} · {run.period_start || "-"} to {run.period_end || "-"} · {run.status || "unknown"}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            {isCarryoverRowsReport && (
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Carryover run"
                  value={filters.run_id}
                  onChange={(event) => updateFilter("run_id", event.target.value)}
                  helperText="Required for row-level carryover detail."
                >
                  <MenuItem value="">Select a carryover run</MenuItem>
                  {carryoverRuns.map((run) => (
                    <MenuItem key={run.run_id} value={String(run.run_id)}>
                      #{run.run_id} · {run.as_of_date || "-"} · {statusLabel(run.status)} · {fmtNumber(run.total_forfeited_hours, "h")} forfeited
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            {(isAccrualRowsReport || isCarryoverPreviewReport || isCarryoverRowsReport || (!isAccrualReport && !isCarryoverReport)) && (
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Department"
                  value={filters.department_id}
                  onChange={(event) => updateFilter("department_id", event.target.value)}
                >
                  <MenuItem value="">All departments</MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={String(department.id)}>{department.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            {(isAccrualRowsReport || isCarryoverPreviewReport || isCarryoverRowsReport || (!isAccrualReport && !isCarryoverReport)) && (
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Employee"
                  value={filters.recruiter_id}
                  onChange={(event) => updateFilter("recruiter_id", event.target.value)}
                >
                  <MenuItem value="">All employees</MenuItem>
                  {employeeOptions.map((employee) => (
                    <MenuItem key={employee.id} value={String(employee.id)}>{compactEmployeeName(employee)}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Leave type"
                value={filters.leave_type}
                onChange={(event) => updateFilter("leave_type", event.target.value)}
              >
                <MenuItem value="">All leave types</MenuItem>
                {LEAVE_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label || formatLeaveTypeLabel(option.value)}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {(isAccrualRunsReport || isCarryoverRunsReport || isCarryoverRowsReport || (!isAccrualReport && !isCarryoverReport)) && (
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={filters.status}
                  onChange={(event) => updateFilter("status", event.target.value)}
                >
                  {(isAccrualRunsReport ? ACCRUAL_RUN_STATUS_OPTIONS : isCarryoverReport ? CARRYOVER_RUN_STATUS_OPTIONS : STATUS_OPTIONS).map((option) => (
                    <MenuItem key={option.value || "all"} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            {isAccrualRunsReport && (
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Trigger type"
                  value={filters.trigger_type}
                  onChange={(event) => updateFilter("trigger_type", event.target.value)}
                >
                  {TRIGGER_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value || "all"} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            {isAccrualRowsReport && (
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Row result"
                  value={filters.skipped}
                  onChange={(event) => updateFilter("skipped", event.target.value)}
                >
                  {SKIPPED_OPTIONS.map((option) => (
                    <MenuItem key={option.value || "all"} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            {!isAccrualReport && !isCarryoverReport && (
              <>
                <Grid item xs={12} md={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Paid"
                    value={filters.paid}
                    onChange={(event) => updateFilter("paid", event.target.value)}
                  >
                    {PAID_OPTIONS.map((option) => (
                      <MenuItem key={option.value || "all"} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Payroll readiness"
                    value={filters.payroll_ready}
                    onChange={(event) => updateFilter("payroll_ready", event.target.value)}
                  >
                    {PAYROLL_READY_OPTIONS.map((option) => (
                      <MenuItem key={option.value || "all"} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Cancelled rows"
                    value={filters.include_cancelled}
                    onChange={(event) => updateFilter("include_cancelled", event.target.value)}
                  >
                    {INCLUDE_CANCELLED_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </>
            )}
          </Grid>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={selectedReportType.label} sx={{ fontWeight: 800, bgcolor: `${reportAccent[filters.report_type]}18`, color: reportAccent[filters.report_type] }} />
            <Chip label={selectedReportType.description} variant="outlined" />
            {filters.report_type === "liability" && <Chip color="warning" variant="outlined" label="Estimated liability only" />}
            {isAccrualReport && <Chip color="info" variant="outlined" label="Generated from saved accrual runs" />}
            {isCarryoverPreviewReport && <Chip color="success" variant="outlined" label="Read-only preview until confirmed apply" />}
            {(isCarryoverRunsReport || isCarryoverRowsReport) && <Chip color="success" variant="outlined" label="Generated from applied carryover runs" />}
            {PDF_REPORT_TYPES.has(filters.report_type) ? (
              <Chip color="info" variant="outlined" label="PDF summary available" />
            ) : (
              <Chip variant="outlined" label="CSV export only in V1" />
            )}
            <Chip variant="outlined" label="Read-only" />
          </Stack>
        </Stack>
      </SectionCard>

      {error && <Alert severity="error">{error}</Alert>}
      {applyResult && (
        <Alert severity={applyResult.idempotent_replay ? "info" : "success"} variant="outlined">
          {applyResult.idempotent_replay
            ? `Carryover was already applied for this exact scope as run #${applyResult.run_id}. No duplicate ledger entries were posted.`
            : `Carryover apply completed for run #${applyResult.run_id}. Posted rows: ${applyResult.posted_rows || 0}; skipped rows: ${applyResult.skipped_rows || 0}.`}
          {" "}Payroll was not changed.
        </Alert>
      )}

      <Grid container spacing={1.5}>
        {summaryCards(report).map(([label, value, helper, tone]) => (
          <Grid item xs={12} sm={6} md={2.4} key={label}>
            <SummaryCard label={label} value={value} helper={helper} tone={tone} />
          </Grid>
        ))}
      </Grid>

      {report?.message && (
        <Alert severity={filters.report_type === "liability" ? "warning" : "info"} variant="outlined">
          {report.message}
        </Alert>
      )}

      {isCarryoverReport && (
        <Alert severity="warning" variant="outlined">
          Payroll handoff: carryover apply updates leave balances only. Payout estimates are for accountant review; if company policy requires payout, process it separately in payroll. Employees should not keep the same unused hours in their leave balance and also be paid for those hours.
        </Alert>
      )}

      <SectionCard
        title="Report table"
        description="Preview the current report before exporting. No actions on this page mutate leave, payroll, balances, or accruals."
      >
        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Loading report...</Typography>
          </Stack>
        ) : rows.length === 0 ? (
          <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2, p: 2, bgcolor: "rgba(15,23,42,0.02)" }}>
            <Typography variant="body2" color="text.secondary">{tableEmptyMessage(filters.report_type)}</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 560 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.key} sx={{ fontWeight: 900, whiteSpace: "nowrap" }}>{column.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={`${row.leave_id || row.ledger_id || row.employee_id || "row"}-${row.leave_type || ""}-${index}`} hover>
                    {columns.map((column) => (
                      <TableCell key={column.key} sx={{ whiteSpace: "nowrap" }}>{renderCell(row[column.key], column.key)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      <Alert severity="info" variant="outlined">
        {isCarryoverPreviewReport
          ? "Carryover preview is read-only and shows estimated year-end carryover and forfeiture based on current balance truth and saved policy settings. Ledger changes happen only through the explicit Apply Carryover confirmation, and payroll formulas are not changed."
          : (isCarryoverRunsReport || isCarryoverRowsReport)
          ? "Carryover run reports are read-only and generated from applied carryover history. They do not pay employees or change payroll formulas."
          : isAccrualReport
          ? "Accrual reports are read-only and generated from saved accrual run history and row-level accrual results. They do not post accruals or change payroll formulas."
          : "Reports are read-only and generated from leave requests, leave balance ledger entries, and current employee profile rates. They do not finalize payroll or change payroll formulas."}
      </Alert>
      <Dialog open={carryoverConfirmOpen} onClose={() => setCarryoverConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Apply carryover for year-end</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Alert severity="warning" variant="outlined">
              This will post leave balance ledger adjustments only. It will not pay employees, finalize payroll, change payroll formulas, or approve/reject leave requests.
            </Alert>
            <Grid container spacing={1.25}>
              <Grid item xs={6}>
                <SummaryCard label="As of" value={filters.as_of_date || "-"} helper="Balance cutoff date" tone="carryover_preview" />
              </Grid>
              <Grid item xs={6}>
                <SummaryCard label="Rows" value={reportSummary.rows_included || 0} helper="Preview rows in scope" tone="carryover_preview" />
              </Grid>
              <Grid item xs={6}>
                <SummaryCard label="Carryover" value={fmtNumber(reportSummary.total_estimated_carryover_hours, " h")} helper="Hours retained" tone="carryover_preview" />
              </Grid>
              <Grid item xs={6}>
                <SummaryCard label="Forfeited" value={fmtNumber(reportSummary.total_estimated_forfeited_hours, " h")} helper="Hours removed from balance" tone={reportSummary.total_estimated_forfeited_hours ? "warning" : "default"} />
              </Grid>
              <Grid item xs={6}>
                <SummaryCard label="Warnings" value={reportSummary.rows_with_warnings || 0} helper="Rows needing review" tone={reportSummary.rows_with_warnings ? "warning" : "default"} />
              </Grid>
              <Grid item xs={6}>
                <SummaryCard label="Payout review" value={`$${fmtNumber(reportSummary.total_estimated_excess_value)}`} helper="Manual payroll review only" tone={reportSummary.total_estimated_excess_value ? "warning" : "default"} />
              </Grid>
            </Grid>
            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5, bgcolor: "rgba(248,250,252,0.72)" }}>
              <Typography variant="subtitle2" fontWeight={900} gutterBottom>This will</Typography>
              <Typography variant="body2" color="text.secondary">Update leave balances through ledger entries, carry eligible hours into the next policy year, remove hours above carryover caps from leave balances, and create an audit run.</Typography>
              <Typography variant="subtitle2" fontWeight={900} sx={{ mt: 1.25 }} gutterBottom>This will not</Typography>
              <Typography variant="body2" color="text.secondary">Pay employees, finalize payroll, change payroll formulas, or change leave request status.</Typography>
              <Typography variant="subtitle2" fontWeight={900} sx={{ mt: 1.25 }} gutterBottom>If payout is required</Typography>
              <Typography variant="body2" color="text.secondary">Process payout separately in payroll after review. Do not leave the same unused hours in the employee balance and also pay those hours.</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCarryoverConfirmOpen(false)} disabled={applyingCarryover}>Cancel</Button>
          <Button variant="contained" color="success" onClick={applyCarryover} disabled={applyingCarryover}>
            {applyingCarryover ? "Applying..." : "Apply carryover"}
          </Button>
        </DialogActions>
      </Dialog>
      <LeaveReportsHelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
      <CarryoverHelpDrawer open={carryoverHelpOpen} onClose={() => setCarryoverHelpOpen(false)} />
    </Stack>
  );
}
