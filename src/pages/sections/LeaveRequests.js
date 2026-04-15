import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
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
  FormControlLabel,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useTheme } from "@mui/material/styles";
import { format } from "date-fns";
import {
  formatLeaveWarningReason,
  getLeaveReviewVisibility,
} from "./utils/leaveReviewVisibility";
import {
  buildManagerLeaveCancelPayload,
  buildManagerLeaveRequestQuery,
  buildManagerLeaveReviewPayload,
  canManagerCancelLeave,
  defaultManagerLeaveFilters,
  defaultManagerLeaveReviewDraft,
  normalizeLeavePagination,
} from "./utils/managerLeaveReview";
import {
  attachmentLabel,
  normalizeLeaveAttachment,
  openAttachmentDownload,
  parseAttachmentDownloadResponse,
} from "./utils/leaveAttachments";
import { formatLeaveApiError } from "./utils/leaveErrors";
import { LEAVE_TYPE_OPTIONS, formatLeaveTypeLabel } from "./utils/leaveSettings";
import {
  BALANCE_LEAVE_TYPES,
  buildLeaveBalanceAdjustmentPayload,
  defaultLeaveBalanceAdjustment,
  formatBalanceHours,
  normalizeLeaveBalanceSummary,
} from "./utils/leaveBalances";
import SettingsLeaveSettings from "./SettingsLeaveSettings";
import SettingsLeaveInsights from "./SettingsLeaveInsights";
import SettingsLeaveReports from "./SettingsLeaveReports";

const token = () => localStorage.getItem("token");

const formatAvailabilityWarning = (payload) => {
  if (!payload?.availability_warning) return null;
  const count = Number(payload.overlapping_availability_count || 0);
  const plural = count === 1 ? "slot" : "slots";
  return payload.availability_warning_message
    || `Approved successfully. This employee still has ${count} availability ${plural} during the approved leave window.`;
};

const isBookingConflictPayload = (payload) =>
  payload?.error_code === "booking_conflict" || payload?.code === "booking_conflict" || payload?.error === "booking_conflict";

const payrollReadinessLabel = (leave = {}, meta = {}) => {
  if (meta.payrollReady || leave.payroll_ready || leave.leave_approved_for_payroll) return "Ready for payroll";
  if (meta.estimated || leave.estimated || leave.preview_only) return "Estimated for review";
  return "Needs manager confirmation";
};

const payChipSx = (isPaid) => (theme) => {
  const palette = isPaid ? theme.palette.success : theme.palette.warning;
  return {
    bgcolor: palette.main,
    color: palette.contrastText,
    fontWeight: 800,
    border: `1px solid ${palette.dark || palette.main}`,
    "& .MuiChip-label": { color: "inherit" },
  };
};

const readableChipSx = (tone = "neutral", variant = "filled") => (theme) => {
  const tones = {
    success: { bg: theme.palette.success.main, fg: theme.palette.success.contrastText, border: theme.palette.success.dark },
    warning: { bg: "#9a5b00", fg: "#fff8e1", border: "#6d3f00" },
    error: { bg: theme.palette.error.main, fg: theme.palette.error.contrastText, border: theme.palette.error.dark },
    info: { bg: theme.palette.info.main, fg: theme.palette.info.contrastText, border: theme.palette.info.dark },
    neutral: { bg: theme.palette.grey[700], fg: theme.palette.common.white, border: theme.palette.grey[800] },
  };
  const color = tones[tone] || tones.neutral;
  if (variant === "outlined") {
    return {
      color: color.border || color.bg,
      borderColor: color.border || color.bg,
      bgcolor: theme.palette.background.paper,
      fontWeight: 800,
      "& .MuiChip-label": { color: "inherit" },
    };
  }
  return {
    bgcolor: color.bg,
    color: color.fg,
    border: `1px solid ${color.border || color.bg}`,
    fontWeight: 800,
    "& .MuiChip-label": { color: "inherit" },
  };
};

const statusChipTone = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "success";
  if (normalized === "pending") return "warning";
  if (normalized === "rejected" || normalized === "cancelled" || normalized === "withdrawn") return "error";
  return "neutral";
};

const readinessChipTone = (meta = {}) => {
  if (meta.payrollReady) return "success";
  if (meta.estimated) return "warning";
  return "info";
};

const fmtDateTime = (value) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "yyyy-MM-dd HH:mm");
  } catch {
    return String(value);
  }
};

const fmtDateRange = (row) => {
  const start = row.start_date || row.shift_date || "—";
  const end = row.end_date && row.end_date !== start ? ` → ${row.end_date}` : "";
  return `${start}${end}`;
};

const fmtDurationMode = (mode) => {
  if (mode === "shift_linked") return "Shift-linked";
  if (mode === "partial_day") return "Partial day";
  if (mode === "hourly") return "Hourly";
  return "Full day";
};

const balancePolicyActionLabel = (action) => {
  const labels = {
    within_balance: "Within balance",
    warn: "Insufficient balance warning",
    insufficient_warn: "Insufficient balance warning",
    block: "Approval blocked by balance policy",
    insufficient_block: "Approval blocked by balance policy",
    split_to_unpaid: "Approve available paid hours only",
    allow_negative: "Negative balance allowed",
    unpaid_no_deduction: "Unpaid leave, no balance deduction",
    not_balance_managed: "Not balance-managed",
  };
  return labels[action] || String(action || "Balance impact").replace(/_/g, " ");
};

const balanceImpactSeverity = (impact) => {
  if (impact?.blocking) return "error";
  if (impact?.warning || Number(impact?.insufficient_hours || 0) > 0) return "warning";
  if (impact?.balance_managed) return "success";
  return "info";
};

const employeeName = (row) => row.recruiter_name || row.employee_name || `Employee #${row.recruiter_id || "—"}`;

const employeeDisplayName = (employee = {}) =>
  `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
  || employee.name
  || employee.email
  || `Employee #${employee.id || "—"}`;

const shiftRestorationTone = (status = {}) => {
  if (!status?.has_linked_shift) return "neutral";
  if (status.status === "restored") return "success";
  if (status.restorable) return "success";
  return "warning";
};

const shiftRestorationLabel = (status = {}) => {
  if (!status?.has_linked_shift && !status?.linked_shift_id) return "No linked shift";
  if (status.status === "restored") return "Original shift restored";
  if (status.restorable) return "Restoration available";
  return "Restoration blocked";
};

const DecisionMetric = ({ label, value, tone = "default" }) => {
  const toneSx = {
    success: { color: "success.dark", bgcolor: "rgba(22, 163, 74, 0.08)" },
    warning: { color: "#92400e", bgcolor: "rgba(245, 158, 11, 0.10)" },
    error: { color: "error.dark", bgcolor: "rgba(220, 38, 38, 0.08)" },
    default: { color: "text.primary", bgcolor: "background.paper" },
  }[tone] || {};

  return (
    <Box sx={{ p: 1.15, borderRadius: 2, border: "1px solid", borderColor: "divider", ...toneSx }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={850}>
        {value}
      </Typography>
    </Box>
  );
};

const LeaveDecisionSummary = ({ leave, meta, balanceSummary, bookingConflict, availabilityWarning }) => {
  if (!leave || !meta) return null;
  const selectedBalance = balanceSummary?.balances?.find((row) => row.leave_type === leave.leave_type);
  const future = selectedBalance?.future_balance || {};
  const impact = leave.balance_impact || {};
  const balanceManaged = Boolean(impact.balance_managed || selectedBalance?.balance_managed);
  const shortage = Number(
    impact.insufficient_hours ?? future.shortage_hours ?? 0
  );
  const currentBalance = impact.current_balance_hours ?? future.usable_now_hours ?? selectedBalance?.balance_hours;
  const projectedBalance = impact.projected_balance_hours ?? future.projected_remaining_hours;
  const readiness = payrollReadinessLabel(leave, meta);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.75,
        borderRadius: 3,
        borderColor: bookingConflict ? "error.light" : "rgba(148, 163, 184, 0.45)",
        bgcolor: bookingConflict ? "rgba(220, 38, 38, 0.04)" : "rgba(248, 250, 252, 0.86)",
      }}
    >
      <Stack spacing={1.25}>
        <Box>
          <Typography variant="subtitle2" fontWeight={900}>
            Decision summary
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Review the operational impact before changing approval status.
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={meta.payLabel} sx={payChipSx(meta.isPaid)} />
          <Chip
            size="small"
            variant="outlined"
            label={balanceManaged ? "Balance-managed" : "Not balance-managed"}
            sx={readableChipSx(balanceManaged ? "info" : "neutral", "outlined")}
          />
          <Chip
            size="small"
            variant="outlined"
            label={readiness}
            sx={readableChipSx(meta.payrollReady ? "success" : meta.estimated ? "warning" : "info", "outlined")}
          />
          {bookingConflict && (
            <Chip size="small" label="Booked appointment conflict" sx={readableChipSx("error")} />
          )}
          {availabilityWarning && (
            <Chip size="small" label="Availability still open" sx={readableChipSx("warning")} />
          )}
        </Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 1 }}>
          <DecisionMetric label="Requested hours" value={meta.requestedHours ? `${meta.requestedHours}h` : "—"} />
          <DecisionMetric label="Approved hours" value={meta.approvedHours ? `${meta.approvedHours}h` : "—"} tone={meta.approvedHours ? "success" : "warning"} />
          <DecisionMetric label="Current balance" value={formatBalanceHours(currentBalance)} />
          <DecisionMetric label="Projected balance" value={formatBalanceHours(projectedBalance)} tone={Number(projectedBalance || 0) < 0 ? "warning" : "default"} />
          <DecisionMetric label="Shortage" value={formatBalanceHours(shortage)} tone={shortage > 0 ? "error" : "success"} />
          <DecisionMetric label="Payroll readiness" value={readiness} tone={meta.payrollReady ? "success" : meta.estimated ? "warning" : "default"} />
        </Box>
      </Stack>
    </Paper>
  );
};

const BookingConflictAlert = ({ conflict }) => {
  if (!conflict) return null;
  const bookings = Array.isArray(conflict.bookings) ? conflict.bookings : [];
  return (
    <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
      <Stack spacing={1.2}>
        <Box>
          <Typography variant="subtitle2" fontWeight={900}>
            Booked appointment conflict
          </Typography>
          <Typography variant="body2">
            {conflict.message || "This employee has booked client appointments during the requested leave window."}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
            Resolve these bookings first, then try approval again.
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`${Number(conflict.overlapping_booking_count ?? bookings.length)} overlapping booking${Number(conflict.overlapping_booking_count ?? bookings.length) === 1 ? "" : "s"}`}
          sx={{ alignSelf: "flex-start", fontWeight: 800 }}
        />
        {bookings.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Date/time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking, index) => (
                  <TableRow key={booking.booking_id || booking.appointment_id || index}>
                    <TableCell>{booking.client_name || "Client"}</TableCell>
                    <TableCell>{booking.service || booking.service_name || "Service"}</TableCell>
                    <TableCell>
                      {booking.date || "—"}
                      {(booking.start_time || booking.end_time) ? ` · ${booking.start_time || "—"}-${booking.end_time || "—"}` : ""}
                    </TableCell>
                    <TableCell>{booking.status || "booked"}</TableCell>
                    <TableCell>{booking.booking_id || booking.appointment_id || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </Alert>
  );
};

const ShiftRestorationPanel = ({ restoration }) => {
  if (!restoration?.linked_shift_id && !restoration?.has_linked_shift) return null;
  const shift = restoration.original_shift || {};
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="subtitle2" fontWeight={900}>Original shift</Typography>
          <Chip size="small" label={shiftRestorationLabel(restoration)} sx={readableChipSx(shiftRestorationTone(restoration), "outlined")} />
          {restoration.removed_from_schedule && (
            <Chip size="small" label="Removed from active schedule" sx={readableChipSx("neutral", "outlined")} />
          )}
        </Stack>
        <Typography variant="body2">
          {shift.date || "Date not available"}
          {shift.clock_in || shift.clock_out ? ` · ${fmtDateTime(shift.clock_in)} - ${fmtDateTime(shift.clock_out)}` : ""}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {restoration.message || "Linked shift restoration status is available."}
        </Typography>
        {restoration.blockers?.length ? (
          <Alert severity="warning" variant="outlined">
            <Stack spacing={0.5}>
              {restoration.blockers.map((blocker, idx) => (
                <Typography key={`${blocker.code}-${idx}`} variant="caption">
                  {blocker.message || String(blocker.code || "Restore blocked").replace(/_/g, " ")}
                </Typography>
              ))}
            </Stack>
          </Alert>
        ) : null}
        {restoration.warnings?.length ? (
          <Stack spacing={0.5}>
            {restoration.warnings.map((warning, idx) => (
              <Typography key={`${warning.code}-${idx}`} variant="caption" color="text.secondary">
                {warning.message}
              </Typography>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
};

const AvailabilityWarningAlert = ({ warning }) => {
  if (!warning?.availability_warning) return null;
  const slots = Array.isArray(warning.availability_slots) ? warning.availability_slots : [];
  return (
    <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
      <Stack spacing={1}>
        <Box>
          <Typography variant="subtitle2" fontWeight={900}>
            Availability still open
          </Typography>
          <Typography variant="body2">
            {warning.availability_warning_message || "This employee still has availability slots during the approved leave window."}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`${Number(warning.overlapping_availability_count ?? slots.length)} overlapping availability slot${Number(warning.overlapping_availability_count ?? slots.length) === 1 ? "" : "s"}`}
          sx={{ alignSelf: "flex-start", fontWeight: 800 }}
        />
        {slots.length > 0 && (
          <Stack spacing={0.5}>
            {slots.slice(0, 4).map((slot) => (
              <Typography key={slot.availability_id || `${slot.date}-${slot.start_time}`} variant="caption">
                {slot.date || "—"} · {slot.start_time || "—"}-{slot.end_time || "—"}
                {slot.service ? ` · ${slot.service}` : ""}
              </Typography>
            ))}
          </Stack>
        )}
      </Stack>
    </Alert>
  );
};

const LeaveWorkspaceHelpDrawer = ({ open, onClose }) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    sx={{ zIndex: (theme) => theme.zIndex.modal + 20 }}
    PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, p: 2 } }}
  >
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h6" fontWeight={900}>Leave review guide</Typography>
          <Typography variant="body2" color="text.secondary">
            Practical guidance for reviewing requests, confirming hours, and adjusting balances.
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close leave help">
          <CloseIcon />
        </IconButton>
      </Stack>

      <Alert severity="info" variant="outlined">
        Payroll formulas are not changed here. Managers confirm leave records and HR balance ledger entries; payroll still uses the existing payroll workflow.
      </Alert>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight={900}>1. Start with the request list</Typography>
          <Typography variant="body2" color="text.secondary">
            Use Status, Department, Employee, and More filters to find requests needing attention. Click Details to open the full review workspace.
          </Typography>
          <Typography variant="body2">
            Example: choose <strong>Pending</strong> and an employee, then open Details to approve, reject, or confirm payroll-ready hours.
          </Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight={900}>2. Manager review</Typography>
          <Typography variant="body2" color="text.secondary">
            Manager review is where you confirm what should become the approved leave record. For pending requests, review requested hours, balance impact, warnings, and any booking or availability conflicts before approving.
          </Typography>
          <Typography variant="body2">
            Example: an employee requests <strong>8h paid vacation</strong>, but only <strong>5h</strong> should be paid. Set Approved hours to <strong>8</strong>, switch paid/unpaid only if policy requires it, and explain the change in Adjustment reason.
          </Typography>
          <Typography variant="body2">
            Example: if a booking conflict appears, do not approve. Reschedule, cancel, or reassign the booked appointment first, then try approval again.
          </Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight={900}>3. Ready for payroll</Typography>
          <Typography variant="body2" color="text.secondary">
            Ready for payroll means the manager-confirmed hours are safe to be used as payroll input. Estimated for review means the row is visible for manager review, but is not finalized payroll truth.
          </Typography>
          <Typography variant="body2">
            Example: a full-day sick request shows <strong>8h requested</strong>. If the manager approves <strong>8h</strong>, the request can become ready for payroll when the policy allows it.
          </Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight={900}>4. Adjust balance</Typography>
          <Typography variant="body2" color="text.secondary">
            Adjust balance creates a leave balance ledger entry. Use it for HR corrections, opening balances, manual accrual corrections, or year-end corrections. Always enter a clear reason.
          </Typography>
          <Typography variant="body2">
            Example: the employee should receive a vacation opening balance of <strong>40h</strong>. Choose Vacation, enter <strong>+40</strong>, and use reason “Opening balance for 2026 policy year.”
          </Typography>
          <Typography variant="body2">
            Example: an employee was over-credited by <strong>4h</strong>. Choose the leave type, enter <strong>-4</strong>, and explain “Correction for duplicate accrual posting.”
          </Typography>
          <Alert severity="warning" variant="outlined">
            Balance adjustments affect HR leave balances only. They do not pay employees automatically and do not change payroll formulas.
          </Alert>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight={900}>5. Ledger and audit</Typography>
          <Typography variant="body2" color="text.secondary">
            The ledger is collapsed by default because it can grow long. Open it when you need to verify deductions, corrections, accrual postings, reversals, or carryover entries.
          </Typography>
          <Typography variant="body2">
            Example: if a manager asks why vacation balance dropped, open the ledger and look for a leave approval deduction or manual adjustment with its timestamp and reason.
          </Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight={900}>6. Cancel approved leave</Typography>
          <Typography variant="body2" color="text.secondary">
            Cancel approved leave when the time off should no longer be active. If the leave came from a shift, the system may offer an option to restore the original shift.
          </Typography>
          <Typography variant="body2">
            Example: a manager cancels approved time off for Friday. If Restore original shift is available and safe, choose it only if the employee should return to that original scheduled shift.
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  </Drawer>
);

const LeaveRequests = ({ currentUserInfo = null }) => {
  const [leaveWorkspaceTab, setLeaveWorkspaceTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultManagerLeaveFilters());
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState(normalizeLeavePagination());
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveDetailsExpanded, setLeaveDetailsExpanded] = useState(false);
  const [reviewDraft, setReviewDraft] = useState(defaultManagerLeaveReviewDraft());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [restoreLinkedShift, setRestoreLinkedShift] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attachmentDownloading, setAttachmentDownloading] = useState(false);
  const [balanceSummary, setBalanceSummary] = useState(() => normalizeLeaveBalanceSummary());
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceSaving, setBalanceSaving] = useState(false);
  const [balanceDraft, setBalanceDraft] = useState(defaultLeaveBalanceAdjustment());
  const [balanceError, setBalanceError] = useState("");
  const [requestLedgerOpen, setRequestLedgerOpen] = useState(false);
  const [requestLedgerPage, setRequestLedgerPage] = useState(1);
  const [employeeLeaveProfileOpen, setEmployeeLeaveProfileOpen] = useState(false);
  const [profileEmployee, setProfileEmployee] = useState(null);
  const [profileBalanceSummary, setProfileBalanceSummary] = useState(() => normalizeLeaveBalanceSummary());
  const [profileBalanceLoading, setProfileBalanceLoading] = useState(false);
  const [profileBalanceError, setProfileBalanceError] = useState("");
  const [profileLedgerOpen, setProfileLedgerOpen] = useState(false);
  const [profileLedgerPage, setProfileLedgerPage] = useState(1);
  const [bookingConflict, setBookingConflict] = useState(null);
  const [availabilityWarningDetail, setAvailabilityWarningDetail] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", error: false, severity: undefined });
  const [leaveHelpOpen, setLeaveHelpOpen] = useState(false);

  const theme = useTheme();
  const leaveDetailsMobile = useMediaQuery(theme.breakpoints.down("md"));
  const leaveDetailsFullScreen = leaveDetailsMobile || leaveDetailsExpanded;
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token()}` }), []);
  const storedRole = typeof window !== "undefined" ? String(window.localStorage.getItem("role") || "").toLowerCase() : "";
  const isFullManager = Boolean(currentUserInfo?.is_manager || storedRole === "manager");
  const hasHrLeaveAdminAccess = Boolean(currentUserInfo?.can_manage_onboarding);
  const hasPayrollLeaveAccess = Boolean(currentUserInfo?.can_manage_payroll);
  const canAdministerLeave = isFullManager || hasHrLeaveAdminAccess;
  const canViewLeaveReports = isFullManager || hasHrLeaveAdminAccess || hasPayrollLeaveAccess;
  const canAdjustLeaveBalances = isFullManager || hasHrLeaveAdminAccess || hasPayrollLeaveAccess;
  const canApplyCarryover = isFullManager || hasPayrollLeaveAccess;

  useEffect(() => {
    if (!canAdministerLeave && leaveWorkspaceTab === "settings") {
      setLeaveWorkspaceTab("requests");
    }
    if (!canViewLeaveReports && leaveWorkspaceTab === "reports") {
      setLeaveWorkspaceTab("requests");
    }
  }, [canAdministerLeave, canViewLeaveReports, leaveWorkspaceTab]);

  const filteredEmployees = useMemo(() => {
    if (!filters.department_id) return employees;
    return employees.filter((employee) => String(employee.department_id || "") === String(filters.department_id));
  }, [filters.department_id, employees]);

  const selectedFilterEmployee = useMemo(
    () => employees.find((employee) => String(employee.id) === String(filters.recruiter_id)) || null,
    [employees, filters.recruiter_id]
  );

  const profileLedgerPageSize = 5;
  const profileLedgerTotalPages = Math.max(1, Math.ceil((profileBalanceSummary.ledger.length || 0) / profileLedgerPageSize));
  const profileLedgerRows = profileBalanceSummary.ledger.slice(
    (profileLedgerPage - 1) * profileLedgerPageSize,
    profileLedgerPage * profileLedgerPageSize
  );
  const requestLedgerPageSize = 5;
  const requestLedgerTotalPages = Math.max(1, Math.ceil((balanceSummary.ledger.length || 0) / requestLedgerPageSize));
  const requestLedgerRows = balanceSummary.ledger.slice(
    (requestLedgerPage - 1) * requestLedgerPageSize,
    requestLedgerPage * requestLedgerPageSize
  );

  const handleDownloadAttachment = async (leave) => {
    if (!leave?.id) return;
    setAttachmentDownloading(true);
    try {
      const res = await api.get(`/manager/leave-requests/${leave.id}/attachment`, {
        headers: authHeaders,
        responseType: "blob",
      });
      const download = await parseAttachmentDownloadResponse(res);
      if (!openAttachmentDownload(download)) {
        throw new Error("Document is not available.");
      }
    } catch (err) {
      const msg = await formatLeaveApiError(err, "Could not download document.");
      setSnackbar({
        open: true,
        msg,
        error: true,
      });
    } finally {
      setAttachmentDownloading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        api.get("/api/departments", { headers: authHeaders }),
        api.get("/manager/recruiters", { headers: authHeaders }),
      ]);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setEmployees(Array.isArray(empRes.data?.recruiters) ? empRes.data.recruiters : []);
    } catch {
      setDepartments([]);
      setEmployees([]);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = buildManagerLeaveRequestQuery(filters, page, pageSize);

      const res = await api.get(`/manager/leave-requests?${params.toString()}`, {
        headers: authHeaders,
      });
      const data = res.data || {};
      setRequests(data.requests || []);
      setPagination(normalizeLeavePagination(data.pagination));
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, msg: "Failed to load leave requests.", error: true });
      setRequests([]);
      setPagination(normalizeLeavePagination());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [filters, page, pageSize]);

  const openDetails = (row) => {
    setSelectedLeave(row);
    setLeaveDetailsExpanded(false);
    setReviewDraft(defaultManagerLeaveReviewDraft(row));
    setBalanceDraft(defaultLeaveBalanceAdjustment());
    setBalanceError("");
    setRequestLedgerOpen(false);
    setRequestLedgerPage(1);
    setBookingConflict(null);
    setAvailabilityWarningDetail(null);
    setRestoreLinkedShift(false);
  };

  const closeLeaveDetails = () => {
    setSelectedLeave(null);
    setBookingConflict(null);
    setAvailabilityWarningDetail(null);
    setRestoreLinkedShift(false);
    setRequestLedgerOpen(false);
    setRequestLedgerPage(1);
    setLeaveDetailsExpanded(false);
  };

  const loadLeaveBalancesForEmployee = async (recruiterId) => {
    if (!recruiterId) {
      setBalanceSummary(normalizeLeaveBalanceSummary());
      return;
    }
    setBalanceLoading(true);
    try {
      const res = await api.get(`/manager/recruiters/${recruiterId}/leave-balances`, {
        headers: authHeaders,
        params: {
          leave_start_date: selectedLeave?.start_date || undefined,
          leave_type: selectedLeave?.leave_type || undefined,
          requested_hours: selectedLeave?.requested_hours || selectedLeave?.approved_hours || undefined,
        },
      });
      setBalanceSummary(normalizeLeaveBalanceSummary(res.data));
      setRequestLedgerPage(1);
    } catch {
      setBalanceSummary(normalizeLeaveBalanceSummary());
    } finally {
      setBalanceLoading(false);
    }
  };

  const loadLeaveProfileBalances = async (recruiterId) => {
    if (!recruiterId) {
      setProfileBalanceSummary(normalizeLeaveBalanceSummary());
      return;
    }
    setProfileBalanceLoading(true);
    setProfileBalanceError("");
    try {
      const res = await api.get(`/manager/recruiters/${recruiterId}/leave-balances`, {
        headers: authHeaders,
      });
      setProfileBalanceSummary(normalizeLeaveBalanceSummary(res.data));
      setProfileLedgerPage(1);
    } catch (err) {
      setProfileBalanceSummary(normalizeLeaveBalanceSummary());
      setProfileBalanceError(err?.response?.data?.error || err?.response?.data?.message || "Could not load employee leave details.");
    } finally {
      setProfileBalanceLoading(false);
    }
  };

  const openEmployeeLeaveProfile = () => {
    if (!selectedFilterEmployee) return;
    setProfileEmployee(selectedFilterEmployee);
    setEmployeeLeaveProfileOpen(true);
    setProfileLedgerOpen(false);
    setProfileLedgerPage(1);
    loadLeaveProfileBalances(selectedFilterEmployee.id);
  };

  useEffect(() => {
    if (selectedLeave?.recruiter_id) {
      loadLeaveBalancesForEmployee(selectedLeave.recruiter_id);
    } else {
      setBalanceSummary(normalizeLeaveBalanceSummary());
    }
  }, [selectedLeave?.recruiter_id, selectedLeave?.start_date, selectedLeave?.leave_type, selectedLeave?.requested_hours, selectedLeave?.approved_hours]);

  const handleBalanceAdjustment = async () => {
    if (!selectedLeave?.recruiter_id) return;
    if (!canAdjustLeaveBalances) {
      setBalanceError("Only managers, HR admins, and payroll users can adjust leave balances.");
      return;
    }
    const payload = buildLeaveBalanceAdjustmentPayload(balanceDraft);
    if (payload.error) {
      setBalanceError(payload.error);
      return;
    }
    setBalanceSaving(true);
    setBalanceError("");
    try {
      const res = await api.post(
        `/manager/recruiters/${selectedLeave.recruiter_id}/leave-balances/adjust`,
        payload,
        { headers: authHeaders }
      );
      setBalanceSummary(normalizeLeaveBalanceSummary(res.data?.summary || res.data));
      setBalanceDraft(defaultLeaveBalanceAdjustment());
      setSnackbar({ open: true, msg: "Leave balance adjusted.", error: false });
    } catch (err) {
      setBalanceError(err?.response?.data?.error || err?.response?.data?.message || "Could not adjust leave balance.");
    } finally {
      setBalanceSaving(false);
    }
  };

  const handleReview = async (action) => {
    if (!selectedLeave) return;
    setSaving(true);
    setBookingConflict(null);
    setAvailabilityWarningDetail(null);
    try {
      const payload = buildManagerLeaveReviewPayload(selectedLeave, reviewDraft, action);
      const res = await api.post("/manager/leave-review", payload, { headers: authHeaders });
      const availabilityWarning = formatAvailabilityWarning(res.data);
      setSnackbar({
        open: true,
        msg: availabilityWarning || res.data?.message || `Leave ${action}d.`,
        error: false,
        severity: availabilityWarning ? "warning" : "success",
      });
      if (availabilityWarning) {
        const updated = res.data?.request || selectedLeave;
        setAvailabilityWarningDetail(res.data);
        setSelectedLeave(updated);
        setReviewDraft(defaultManagerLeaveReviewDraft(updated));
        await fetchRequests();
        return;
      }
      setSelectedLeave(null);
      await fetchRequests();
    } catch (err) {
      const data = err?.response?.data || {};
      if (isBookingConflictPayload(data)) {
        setBookingConflict(data);
      }
      setSnackbar({
        open: true,
        msg: isBookingConflictPayload(data)
          ? "Booked appointment conflict. Resolve these bookings first, then try approval again."
          : data.error || data.message || "Failed to update leave request.",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelLeave = async () => {
    if (!selectedLeave) return;
    const payload = buildManagerLeaveCancelPayload(selectedLeave, cancelReason, {
      restore_linked_shift: restoreLinkedShift,
    });
    if (payload.error) {
      setCancelError(payload.error);
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/manager/leave-review", payload, { headers: authHeaders });
      setSnackbar({ open: true, msg: res.data?.message || "Leave request cancelled.", error: false });
      setCancelDialogOpen(false);
      setCancelReason("");
      setCancelError("");
      setRestoreLinkedShift(false);
      setBookingConflict(null);
      setAvailabilityWarningDetail(null);
      const updated = res.data?.request || null;
      setSelectedLeave(updated);
      await fetchRequests();
    } catch (err) {
      const data = err?.response?.data || {};
      if (data.shift_restoration && selectedLeave) {
        setSelectedLeave({ ...selectedLeave, shift_restoration: data.shift_restoration });
      }
      setCancelError(data.message || data.error || "Failed to cancel leave request.");
      setSnackbar({
        open: true,
        msg: data.message || data.error || "Failed to cancel leave request.",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const setFilterValue = (key) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "department_id" ? { recruiter_id: "" } : {}),
    }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(defaultManagerLeaveFilters());
    setPage(1);
  };

  const renderWarnings = (leaveMeta) => (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {leaveMeta.warnings.length === 0 ? (
        <Typography variant="caption" color="text.secondary">No warnings</Typography>
      ) : leaveMeta.warnings.map((warning, idx) => (
        <Tooltip key={`${warning.code || warning.reason_code || "warning"}-${idx}`} title={warning.message || ""}>
          <Chip
            size="small"
            color={leaveMeta.hasWorkedOverlap ? "error" : "warning"}
            variant="outlined"
            label={formatLeaveWarningReason(warning.code || warning.reason_code)}
          />
        </Tooltip>
      ))}
    </Stack>
  );

  const drawerMeta = selectedLeave ? getLeaveReviewVisibility(selectedLeave) : null;
  const drawerAttachment = selectedLeave ? normalizeLeaveAttachment(selectedLeave) : null;
  const drawerShiftRestoration = selectedLeave?.shift_restoration || null;
  const canRestoreLinkedShift = Boolean(drawerShiftRestoration?.has_linked_shift && drawerShiftRestoration?.restorable);
  const drawerHasAvailabilityWarning = Boolean(
    availabilityWarningDetail?.availability_warning
    || selectedLeave?.availability_warning
    || selectedLeave?.availability_warning_message
  );

  return (
    <Box p={3}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Leave
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review requests, monitor leave operations, and keep approval decisions clear from one manager workspace.
          </Typography>
        </Box>
        {leaveWorkspaceTab === "requests" && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<HelpOutlineIcon />} onClick={() => setLeaveHelpOpen(true)}>
              Help guide
            </Button>
            <Button variant="outlined" onClick={fetchRequests} disabled={loading}>
              Refresh
            </Button>
          </Stack>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={leaveWorkspaceTab}
          onChange={(_, value) => setLeaveWorkspaceTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab value="requests" label="Leave Requests" />
          {canAdministerLeave && <Tab value="settings" label="Leave Settings" />}
          <Tab value="insights" label="Leave Insights" />
          <Tab value="operations" label="Leave Operations" />
          {canViewLeaveReports && <Tab value="reports" label="Leave Reports" />}
        </Tabs>
      </Paper>

      {leaveWorkspaceTab === "requests" ? (
        <>
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            select
            size="small"
            label="Status"
            value={filters.status}
            onChange={setFilterValue("status")}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="withdrawn">Withdrawn</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Department"
            value={filters.department_id}
            onChange={setFilterValue("department_id")}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="">All departments</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Employee"
            value={filters.recruiter_id}
            onChange={setFilterValue("recruiter_id")}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All employees</MenuItem>
            {filteredEmployees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {`${employee.first_name || ""} ${employee.last_name || ""}`.trim() || employee.email}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Rows"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            sx={{ minWidth: 110 }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </TextField>

          <Button variant="text" onClick={() => setMoreFiltersOpen((open) => !open)}>
            {moreFiltersOpen ? "Hide filters" : "More filters"}
          </Button>
          <Button variant="outlined" onClick={resetFilters}>
            Reset
          </Button>
          <Button
            variant="contained"
            disabled={!selectedFilterEmployee}
            onClick={openEmployeeLeaveProfile}
          >
            Employee leave details
          </Button>
        </Stack>
        {moreFiltersOpen && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }} flexWrap="wrap" useFlexGap>
              <TextField
                size="small"
                label="Start date"
                type="date"
                value={filters.start_date}
                onChange={setFilterValue("start_date")}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 170 }}
              />
              <TextField
                size="small"
                label="End date"
                type="date"
                value={filters.end_date}
                onChange={setFilterValue("end_date")}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 170 }}
              />
              <TextField
                select
                size="small"
                label="Leave type"
                value={filters.leave_type}
                onChange={setFilterValue("leave_type")}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">Any type</MenuItem>
                {LEAVE_TYPE_OPTIONS.map((type) => (
                  <MenuItem key={type} value={type}>{formatLeaveTypeLabel(type)}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Duration"
                value={filters.duration_mode}
                onChange={setFilterValue("duration_mode")}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">Any duration</MenuItem>
                <MenuItem value="full_day">Full day</MenuItem>
                <MenuItem value="partial_day">Partial day</MenuItem>
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="shift_linked">Shift-linked</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Pay"
                value={filters.is_paid_leave}
                onChange={setFilterValue("is_paid_leave")}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Paid or unpaid</MenuItem>
                <MenuItem value="true">Paid leave</MenuItem>
                <MenuItem value="false">Unpaid leave</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Payroll"
                value={filters.payroll_ready}
                onChange={setFilterValue("payroll_ready")}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">Any readiness</MenuItem>
                <MenuItem value="true">Ready for payroll only</MenuItem>
                <MenuItem value="false">Estimated or needs confirmation</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Warnings"
                value={filters.has_warnings}
                onChange={setFilterValue("has_warnings")}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">Any warning state</MenuItem>
                <MenuItem value="true">Has warnings</MenuItem>
                <MenuItem value="false">No warnings</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Warning type"
                value={filters.warning_code}
                onChange={setFilterValue("warning_code")}
                sx={{ minWidth: 240 }}
              >
                <MenuItem value="">Any warning type</MenuItem>
                <MenuItem value="approved_leave_overlaps_shift">Approved leave overlaps shift</MenuItem>
                <MenuItem value="approved_leave_overlaps_worked_time">Leave overlaps worked time</MenuItem>
                <MenuItem value="pending_leave_overlaps_shift">Pending leave overlaps shift</MenuItem>
                <MenuItem value="pending_leave_overlaps_worked_time">Pending leave overlaps worked time</MenuItem>
              </TextField>
            </Stack>
          </>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box py={6} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : requests.length === 0 ? (
          <Box py={6} px={3} textAlign="center">
            <Typography variant="subtitle1" fontWeight={800}>No leave requests match this filter.</Typography>
            <Typography variant="body2" color="text.secondary">
              Change the status, department, or employee filter to review another set.
            </Typography>
            {selectedFilterEmployee && (
              <Button variant="outlined" sx={{ mt: 2 }} onClick={openEmployeeLeaveProfile}>
                Open {employeeDisplayName(selectedFilterEmployee)} leave details
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Pay / hours</TableCell>
                    <TableCell>Readiness</TableCell>
                    <TableCell>Warnings</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((row) => {
                    const leaveMeta = getLeaveReviewVisibility(row);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight={800}>{employeeName(row)}</Typography>
                            <Chip size="small" label={row.status || "pending"} sx={(theme) => ({ ...readableChipSx(statusChipTone(row.status))(theme), alignSelf: "flex-start" })} />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{fmtDateRange(row)}</Typography>
                          <Typography variant="caption" color="text.secondary">{fmtDurationMode(row.duration_mode)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.leave_type || "Leave"}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.leave_subtype || "—"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5} alignItems="flex-start">
                            <Chip size="small" label={leaveMeta.payLabel} sx={payChipSx(leaveMeta.isPaid)} />
                            <Typography variant="caption" color="text.secondary">
                              Approved: {row.approved_hours !== null && row.approved_hours !== undefined && row.approved_hours !== "" ? `${Number(row.approved_hours)}h` : "—"} · Requested: {row.requested_hours !== null && row.requested_hours !== undefined && row.requested_hours !== "" ? `${Number(row.requested_hours)}h` : "—"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            <Chip size="small" variant="outlined" label={leaveMeta.payrollLabel} sx={readableChipSx(readinessChipTone(leaveMeta), "outlined")} />
                            {leaveMeta.estimated && <Chip size="small" variant="outlined" label="Estimated" sx={readableChipSx("warning", "outlined")} />}
                            {leaveMeta.actionNeeded && (
                              <Chip
                                size="small"
                                label={leaveMeta.status === "approved" && !leaveMeta.payrollReady ? "Confirm hours" : "Needs manager confirmation"}
                                sx={readableChipSx("warning")}
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>{renderWarnings(leaveMeta)}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" onClick={() => openDetails(row)}>
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="space-between" spacing={1.5} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Showing page {pagination.page} of {pagination.total_pages} · {pagination.total} request{pagination.total === 1 ? "" : "s"}
              </Typography>
              <Pagination
                color="primary"
                page={page}
                count={pagination.total_pages}
                onChange={(_, nextPage) => setPage(nextPage)}
              />
            </Stack>
          </>
        )}
      </Paper>

      <Dialog
        open={Boolean(selectedLeave)}
        onClose={closeLeaveDetails}
        fullWidth
        fullScreen={leaveDetailsFullScreen}
        maxWidth="xl"
        PaperProps={{
          sx: {
            height: leaveDetailsFullScreen ? "100%" : "min(92vh, 980px)",
            borderRadius: leaveDetailsFullScreen ? 0 : 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            py: 1.5,
            px: { xs: 2, md: 2.5 },
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
            <Box>
              <Typography variant="h6" fontWeight={900}>Leave details</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedLeave ? `${employeeName(selectedLeave)} · ${fmtDateRange(selectedLeave)}` : "Review leave request"}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }} alignItems="center">
              {!leaveDetailsMobile && (
                <Button size="small" variant="outlined" onClick={() => setLeaveDetailsExpanded((expanded) => !expanded)}>
                  {leaveDetailsExpanded ? "Standard view" : "Full screen"}
                </Button>
              )}
              <Button size="small" variant="outlined" startIcon={<HelpOutlineIcon />} onClick={() => setLeaveHelpOpen(true)}>
                Help
              </Button>
              <IconButton onClick={closeLeaveDetails} aria-label="Close leave details">
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent
          dividers={false}
          sx={{
            p: { xs: 1.5, md: 2.5 },
            bgcolor: "background.default",
            overflowY: "auto",
          }}
        >
        {selectedLeave && drawerMeta && (
          <Stack spacing={2} sx={{ maxWidth: 1320, mx: "auto" }}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={selectedLeave.status || "pending"} sx={readableChipSx(statusChipTone(selectedLeave.status))} />
              <Chip size="small" label={drawerMeta.payLabel} sx={payChipSx(drawerMeta.isPaid)} />
              <Chip size="small" variant="outlined" label={drawerMeta.payrollLabel} sx={readableChipSx(readinessChipTone(drawerMeta), "outlined")} />
              {drawerMeta.estimated && <Chip size="small" variant="outlined" label="Estimated hours" sx={readableChipSx("warning", "outlined")} />}
            </Stack>

            <Alert severity={drawerMeta.actionNeeded ? "warning" : "info"} variant="outlined">
              {drawerMeta.actionNeeded
                ? "This request still needs manager confirmation before it is safe for finalized payroll."
                : "Ready for payroll means the approved hours are confirmed for payroll inputs. Estimated leave remains visible for review but is not finalized payroll truth."}
            </Alert>

            <LeaveDecisionSummary
              leave={selectedLeave}
              meta={drawerMeta}
              balanceSummary={balanceSummary}
              bookingConflict={bookingConflict}
              availabilityWarning={drawerHasAvailabilityWarning}
            />

            <BookingConflictAlert conflict={bookingConflict} />

            <AvailabilityWarningAlert warning={availabilityWarningDetail} />

            {renderWarnings(drawerMeta)}

            <ShiftRestorationPanel restoration={drawerShiftRestoration} />

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack spacing={0.75}>
                <Typography variant="body2"><strong>Type:</strong> {selectedLeave.leave_type || "Leave"}{selectedLeave.leave_subtype ? ` · ${selectedLeave.leave_subtype}` : ""}</Typography>
                <Typography variant="body2"><strong>Dates:</strong> {fmtDateRange(selectedLeave)}</Typography>
                <Typography variant="body2"><strong>Duration:</strong> {fmtDurationMode(selectedLeave.duration_mode)}</Typography>
                <Typography variant="body2"><strong>Requested hours:</strong> {drawerMeta.requestedHours ? `${drawerMeta.requestedHours}h` : "—"}</Typography>
                <Typography variant="body2"><strong>Approved hours:</strong> {drawerMeta.approvedHours ? `${drawerMeta.approvedHours}h` : "—"}</Typography>
                <Typography variant="body2"><strong>Reason:</strong> {selectedLeave.reason || "—"}</Typography>
              </Stack>
            </Paper>

            {selectedLeave.balance_impact && (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="subtitle2" fontWeight={800}>
                      Balance impact
                    </Typography>
                    <Chip
                      size="small"
                      color={balanceImpactSeverity(selectedLeave.balance_impact)}
                      variant="outlined"
                      label={balancePolicyActionLabel(selectedLeave.balance_impact.policy_action)}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Approval recalculates this from the latest employee balance. Payroll formulas remain separate.
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">Current</Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {formatBalanceHours(selectedLeave.balance_impact.current_balance_hours)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Requested</Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {formatBalanceHours(selectedLeave.balance_impact.requested_hours)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Projected</Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {formatBalanceHours(selectedLeave.balance_impact.projected_balance_hours)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Insufficient</Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {formatBalanceHours(selectedLeave.balance_impact.insufficient_hours)}
                      </Typography>
                    </Box>
                  </Box>
                  {(selectedLeave.balance_impact.paid_hours_suggested || selectedLeave.balance_impact.unpaid_hours_suggested) && (
                    <Typography variant="body2">
                      Suggested handling: {formatBalanceHours(selectedLeave.balance_impact.paid_hours_suggested)} paid balance use
                      {Number(selectedLeave.balance_impact.unpaid_hours_suggested || 0) > 0
                        ? `, ${formatBalanceHours(selectedLeave.balance_impact.unpaid_hours_suggested)} unpaid overage`
                        : ""}
                    </Typography>
                  )}
                  {selectedLeave.balance_impact.message && (
                    <Alert severity={balanceImpactSeverity(selectedLeave.balance_impact)} variant="outlined">
                      {selectedLeave.balance_impact.message}
                    </Alert>
                  )}
                </Stack>
              </Paper>
            )}

            {(() => {
              const selectedBalance = balanceSummary.balances.find((row) => row.leave_type === selectedLeave.leave_type);
              const future = selectedBalance?.future_balance;
              if (!selectedBalance && !future) return null;
              return (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.75,
                    borderRadius: 3,
                    borderColor: "rgba(148, 163, 184, 0.45)",
                    bgcolor: "rgba(248, 250, 252, 0.72)",
                  }}
                >
                  <Stack spacing={1.25}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={900}>
                        Decision balance context
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uses the leave start date as the decision date. Balances are HR tracking, not payroll formulas.
                      </Typography>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 1 }}>
                      <Box sx={{ p: 1.1, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                        <Typography variant="caption" color="text.secondary">Usable now</Typography>
                        <Typography variant="body2" fontWeight={800}>{formatBalanceHours(future?.usable_now_hours ?? selectedBalance?.balance_hours)}</Typography>
                      </Box>
                      <Box sx={{ p: 1.1, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                        <Typography variant="caption" color="text.secondary">Expected before leave</Typography>
                        <Typography variant="body2" fontWeight={800}>{formatBalanceHours(future?.expected_before_leave_start_hours)}</Typography>
                      </Box>
                      <Box sx={{ p: 1.1, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                        <Typography variant="caption" color="text.secondary">Available on start</Typography>
                        <Typography variant="body2" fontWeight={800}>{formatBalanceHours(future?.available_on_leave_start_hours ?? selectedBalance?.balance_hours)}</Typography>
                      </Box>
                      <Box sx={{ p: 1.1, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                        <Typography variant="caption" color="text.secondary">Projected remaining</Typography>
                        <Typography variant="body2" fontWeight={800}>{formatBalanceHours(future?.projected_remaining_hours)}</Typography>
                      </Box>
                    </Box>
                    {future?.eligibility_date && (
                      <Typography variant="body2">
                        <strong>Eligibility date:</strong> {future.eligibility_date} · {future.eligible_on_leave_start ? "Eligible on leave start" : "Not eligible on leave start"}
                      </Typography>
                    )}
                    {future?.waiting_period_blocking && (
                      <Alert severity="warning" variant="outlined">{future.waiting_period_message}</Alert>
                    )}
                    {!drawerMeta.isPaid && (
                      <Alert severity="info" variant="outlined">
                        This is unpaid leave. It does not deduct from paid entitlement balance, but it can still affect scheduling and approval records.
                      </Alert>
                    )}
                  </Stack>
                </Paper>
              );
            })()}

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack spacing={1.25}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>
                    Leave balances
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Balances are HR tracking. Manual adjustments and approved balance-managed leave can update the ledger, but payroll calculations remain separate.
                  </Typography>
                </Box>
                {balanceLoading ? (
                  <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={22} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 1,
                    }}
                  >
                    {balanceSummary.balances.map((balance) => (
                      <Box
                        key={balance.leave_type}
                        sx={(theme) => ({
                          p: 1,
                          borderRadius: 1.5,
                          border: `1px solid ${theme.palette.divider}`,
                          bgcolor: theme.palette.background.default,
                        })}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {balance.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={800}>
                          {formatBalanceHours(balance.balance_hours)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                {canAdjustLeaveBalances ? (
                  <>
                    <Divider />
                    <Typography variant="subtitle2" fontWeight={800}>
                      Adjust balance
                    </Typography>
                    {balanceError && <Alert severity="error">{balanceError}</Alert>}
                    <Stack spacing={1}>
                      <TextField
                        select
                        size="small"
                        label="Leave type"
                        value={balanceDraft.leave_type}
                        onChange={(event) => {
                          setBalanceDraft((prev) => ({ ...prev, leave_type: event.target.value }));
                          setBalanceError("");
                        }}
                      >
                        {BALANCE_LEAVE_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>{formatLeaveTypeLabel(type)}</MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        label="Hours adjustment"
                        type="number"
                        value={balanceDraft.delta_hours}
                        onChange={(event) => {
                          setBalanceDraft((prev) => ({ ...prev, delta_hours: event.target.value }));
                          setBalanceError("");
                        }}
                        helperText="Use positive hours to add balance or negative hours to subtract."
                        inputProps={{ step: 0.25 }}
                      />
                      <TextField
                        size="small"
                        label="Adjustment reason"
                        value={balanceDraft.reason}
                        onChange={(event) => {
                          setBalanceDraft((prev) => ({ ...prev, reason: event.target.value }));
                          setBalanceError("");
                        }}
                        multiline
                        minRows={2}
                      />
                      <Button
                        variant="outlined"
                        disabled={balanceSaving || balanceLoading}
                        onClick={handleBalanceAdjustment}
                        sx={{ alignSelf: "flex-start" }}
                      >
                        {balanceSaving ? "Saving..." : "Save adjustment"}
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <Alert severity="info" variant="outlined">
                    Supervisors can review, approve, reject, and cancel leave. Balance adjustments are available to managers, HR admins, and payroll users.
                  </Alert>
                )}
                <Divider />
                <Box>
                  <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800}>
                        Recent balance ledger
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {balanceSummary.ledger.length} ledger entr{balanceSummary.ledger.length === 1 ? "y" : "ies"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setRequestLedgerOpen((open) => !open)}
                      disabled={balanceLoading || balanceSummary.ledger.length === 0}
                    >
                      {requestLedgerOpen ? "Hide ledger" : "Show ledger"}
                    </Button>
                  </Stack>
                  {balanceSummary.ledger.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No balance ledger entries yet.
                    </Typography>
                  ) : !requestLedgerOpen ? (
                    <Typography variant="body2" color="text.secondary">
                      Ledger activity is collapsed by default. Open it when you need audit detail for this employee.
                    </Typography>
                  ) : (
                    <>
                      <Stack spacing={0.75}>
                        {requestLedgerRows.map((entry) => (
                          <Box key={entry.id} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                {entry.label} · {formatBalanceHours(entry.delta_hours)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {entry.reason || "No reason"}{entry.created_by_name ? ` · ${entry.created_by_name}` : ""}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                              {fmtDateTime(entry.created_at)}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Page {requestLedgerPage} of {requestLedgerTotalPages}
                        </Typography>
                        <Pagination
                          size="small"
                          page={requestLedgerPage}
                          count={requestLedgerTotalPages}
                          onChange={(_, nextPage) => setRequestLedgerPage(nextPage)}
                        />
                      </Stack>
                    </>
                  )}
                </Box>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>
                    Supporting document
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {attachmentLabel(drawerAttachment)}
                  </Typography>
                </Box>
                {drawerAttachment?.present ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    disabled={attachmentDownloading}
                    onClick={() => handleDownloadAttachment(selectedLeave)}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Download document
                  </Button>
                ) : (
                  <Chip
                    size="small"
                    icon={<UploadFileIcon />}
                    variant="outlined"
                    label="No document attached"
                    sx={{ alignSelf: "flex-start" }}
                  />
                )}
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack spacing={0.75}>
                <Typography variant="body2"><strong>Reviewed by:</strong> {selectedLeave.reviewer_name || "—"}</Typography>
                <Typography variant="body2"><strong>Reviewed at:</strong> {fmtDateTime(selectedLeave.reviewed_at)}</Typography>
                <Typography variant="body2"><strong>Manager comment:</strong> {selectedLeave.review_comment || "—"}</Typography>
                <Typography variant="body2"><strong>Adjustment reason:</strong> {selectedLeave.manager_adjust_reason || "—"}</Typography>
                <Typography variant="body2"><strong>Withdrawn:</strong> {fmtDateTime(selectedLeave.withdrawn_at)}</Typography>
                <Typography variant="body2"><strong>Cancelled:</strong> {fmtDateTime(selectedLeave.cancelled_at)}</Typography>
                <Typography variant="body2"><strong>Cancelled by:</strong> {selectedLeave.cancelled_by_name || selectedLeave.cancelled_by || "—"}</Typography>
                {selectedLeave.cancel_reason && (
                  <Typography variant="body2"><strong>Cancel reason:</strong> {selectedLeave.cancel_reason}</Typography>
                )}
              </Stack>
            </Paper>

            {String(selectedLeave.status || "").toLowerCase() === "pending" && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                    Manager review
                  </Typography>
                  <Stack spacing={1.25}>
                    <TextField
                      label="Approved hours"
                      type="number"
                      size="small"
                      value={reviewDraft.approved_hours}
                      onChange={(e) => setReviewDraft({ ...reviewDraft, approved_hours: e.target.value })}
                      inputProps={{ min: 0, step: 0.25 }}
                      helperText="Confirm exact ready-for-payroll hours before approval."
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(reviewDraft.is_paid_leave)}
                          onChange={(e) => setReviewDraft({ ...reviewDraft, is_paid_leave: e.target.checked })}
                        />
                      }
                      label={reviewDraft.is_paid_leave ? "Paid leave" : "Unpaid leave"}
                    />
                    <TextField
                      select
                      label="Leave type"
                      size="small"
                      value={reviewDraft.leave_type}
                      onChange={(e) => setReviewDraft({ ...reviewDraft, leave_type: e.target.value, leave_subtype: "" })}
                    >
                      {LEAVE_TYPE_OPTIONS.map((type) => (
                        <MenuItem key={type} value={type}>{formatLeaveTypeLabel(type)}</MenuItem>
                      ))}
                    </TextField>
                    {reviewDraft.leave_type === "family" ? (
                      <TextField
                        select
                        label="Subtype"
                        size="small"
                        value={reviewDraft.leave_subtype}
                        onChange={(e) => setReviewDraft({ ...reviewDraft, leave_subtype: e.target.value })}
                      >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="maternity">Maternity</MenuItem>
                        <MenuItem value="paternity">Paternity</MenuItem>
                        <MenuItem value="parental">Parental</MenuItem>
                        <MenuItem value="adoption">Adoption</MenuItem>
                      </TextField>
                    ) : (
                      <TextField
                        label="Subtype"
                        size="small"
                        value={reviewDraft.leave_subtype}
                        onChange={(e) => setReviewDraft({ ...reviewDraft, leave_subtype: e.target.value })}
                        placeholder="Optional"
                      />
                    )}
                    <TextField
                      label="Adjustment reason"
                      size="small"
                      value={reviewDraft.manager_adjust_reason}
                      onChange={(e) => setReviewDraft({ ...reviewDraft, manager_adjust_reason: e.target.value })}
                      placeholder="Required when changing hours, pay, type, or subtype"
                      helperText="Explain any manager change so payroll and HR review can understand it later."
                    />
                    <TextField
                      label="Manager comment"
                      size="small"
                      multiline
                      minRows={2}
                      value={reviewDraft.comment}
                      onChange={(e) => setReviewDraft({ ...reviewDraft, comment: e.target.value })}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button color="error" variant="outlined" disabled={saving} onClick={() => handleReview("reject")}>
                        Reject request
                      </Button>
                      <Button variant="contained" disabled={saving} onClick={() => handleReview("approve")}>
                        Approve
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </>
            )}

            {canManagerCancelLeave(selectedLeave) && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                    Cancellation
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 1.5 }}>
                    Cancelling approved leave may affect scheduling and payroll preview.
                    {drawerShiftRestoration?.has_linked_shift
                      ? " This leave is linked to an original shift; restoration is optional during cancellation."
                      : ""}
                  </Alert>
                  <Button
                    color="error"
                    variant="outlined"
                    disabled={saving}
                    onClick={() => {
                      setCancelReason("");
                      setCancelError("");
                      setRestoreLinkedShift(false);
                      setCancelDialogOpen(true);
                    }}
                  >
                    Cancel approved leave
                  </Button>
                </Box>
              </>
            )}
          </Stack>
        )}
        </DialogContent>
      </Dialog>

      <Drawer
        anchor="right"
        open={employeeLeaveProfileOpen}
        onClose={() => {
          setEmployeeLeaveProfileOpen(false);
          setProfileEmployee(null);
          setProfileBalanceError("");
          setProfileLedgerOpen(false);
          setProfileLedgerPage(1);
        }}
        PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, p: 2 } }}
      >
        {profileEmployee && (
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6">Employee leave details</Typography>
                <Typography variant="body2" color="text.secondary">
                  {employeeDisplayName(profileEmployee)}
                </Typography>
              </Box>
              <IconButton
                onClick={() => {
                  setEmployeeLeaveProfileOpen(false);
                  setProfileEmployee(null);
                  setProfileBalanceError("");
                  setProfileLedgerOpen(false);
                  setProfileLedgerPage(1);
                }}
                aria-label="Close employee leave details"
              >
                <CloseIcon />
              </IconButton>
            </Stack>

            <Alert severity="info" variant="outlined">
              Use this drawer to view the selected employee&apos;s leave balances and recent ledger activity even when they do not have a visible request row in the current filter.
            </Alert>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack spacing={0.75}>
                <Typography variant="body2"><strong>Name:</strong> {employeeDisplayName(profileEmployee)}</Typography>
                <Typography variant="body2"><strong>Email:</strong> {profileEmployee.email || "—"}</Typography>
                <Typography variant="body2"><strong>Department:</strong> {profileEmployee.department_name || profileEmployee.department || "Unassigned"}</Typography>
                <Typography variant="body2"><strong>Employee ID:</strong> {profileEmployee.id || "—"}</Typography>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>
                      Leave balances
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Current ledger-backed balance view. Payroll formulas remain separate.
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={profileBalanceLoading}
                    onClick={() => loadLeaveProfileBalances(profileEmployee.id)}
                  >
                    Refresh
                  </Button>
                </Stack>

                {profileBalanceError && <Alert severity="error">{profileBalanceError}</Alert>}

                {profileBalanceLoading ? (
                  <Box display="flex" justifyContent="center" py={3}>
                    <CircularProgress size={24} />
                  </Box>
                ) : profileBalanceSummary.balances.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No leave balance records are available for this employee yet.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                      gap: 1,
                    }}
                  >
                    {profileBalanceSummary.balances.map((balance) => (
                      <Box
                        key={balance.leave_type}
                        sx={(theme) => ({
                          p: 1.1,
                          borderRadius: 1.5,
                          border: `1px solid ${theme.palette.divider}`,
                          bgcolor: theme.palette.background.default,
                        })}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {balance.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={900}>
                          {formatBalanceHours(balance.balance_hours)}
                        </Typography>
                        {balance.days_equivalent !== null && balance.days_equivalent !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            {Number(balance.days_equivalent).toFixed(2)} day equivalent
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>
                      Recent balance ledger
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {profileBalanceSummary.ledger.length} ledger entr{profileBalanceSummary.ledger.length === 1 ? "y" : "ies"}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setProfileLedgerOpen((open) => !open)}
                    disabled={profileBalanceLoading || profileBalanceSummary.ledger.length === 0}
                  >
                    {profileLedgerOpen ? "Hide ledger" : "Show ledger"}
                  </Button>
                </Stack>
                {profileBalanceLoading ? (
                  <Typography variant="body2" color="text.secondary">Loading ledger...</Typography>
                ) : profileBalanceSummary.ledger.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No recent leave ledger activity.
                  </Typography>
                ) : !profileLedgerOpen ? (
                  <Typography variant="body2" color="text.secondary">
                    Ledger activity is collapsed by default to keep this drawer focused. Open it when you need audit detail.
                  </Typography>
                ) : (
                  <>
                    <Stack spacing={0.75}>
                      {profileLedgerRows.map((entry) => (
                        <Box key={entry.id} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                          <Box>
                            <Typography variant="body2" fontWeight={800}>
                              {entry.label} · {formatBalanceHours(entry.delta_hours)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {entry.reason || "No reason"}{entry.created_by_name ? ` · ${entry.created_by_name}` : ""}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                            {fmtDateTime(entry.created_at)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        Page {profileLedgerPage} of {profileLedgerTotalPages}
                      </Typography>
                      <Pagination
                        size="small"
                        page={profileLedgerPage}
                        count={profileLedgerTotalPages}
                        onChange={(_, nextPage) => setProfileLedgerPage(nextPage)}
                      />
                    </Stack>
                  </>
                )}
              </Stack>
            </Paper>
          </Stack>
        )}
      </Drawer>

      <Dialog
        open={cancelDialogOpen}
        onClose={() => {
          if (!saving) {
            setCancelDialogOpen(false);
            setRestoreLinkedShift(false);
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Cancel approved leave</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
            Cancelling approved leave may affect scheduling and payroll preview. If this leave was already used in finalized payroll, the backend will block cancellation.
          </Alert>
          {drawerShiftRestoration?.has_linked_shift && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="subtitle2" fontWeight={900}>
                    Original shift
                  </Typography>
                  <Chip
                    size="small"
                    label={shiftRestorationLabel(drawerShiftRestoration)}
                    sx={readableChipSx(shiftRestorationTone(drawerShiftRestoration), "outlined")}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {drawerShiftRestoration.message || "This leave is linked to a shift that was removed from the active schedule."}
                </Typography>
                {drawerShiftRestoration.original_shift && (
                  <Typography variant="body2">
                    {drawerShiftRestoration.original_shift.date || "Date not available"}
                    {(drawerShiftRestoration.original_shift.clock_in || drawerShiftRestoration.original_shift.clock_out)
                      ? ` · ${fmtDateTime(drawerShiftRestoration.original_shift.clock_in)} - ${fmtDateTime(drawerShiftRestoration.original_shift.clock_out)}`
                      : ""}
                  </Typography>
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={restoreLinkedShift}
                      disabled={saving || !canRestoreLinkedShift}
                      onChange={(event) => {
                        setRestoreLinkedShift(event.target.checked);
                        setCancelError("");
                      }}
                    />
                  }
                  label="Cancel leave and restore original shift"
                />
                <Typography variant="caption" color="text.secondary">
                  Leave cancellation only is the default. Restore the original shift only when you want it returned to the active schedule.
                </Typography>
                {!canRestoreLinkedShift && drawerShiftRestoration.blockers?.length > 0 && (
                  <Alert severity="warning" variant="outlined">
                    <Stack spacing={0.5}>
                      {drawerShiftRestoration.blockers.map((blocker, index) => (
                        <Typography key={`${blocker.code || "blocker"}-${index}`} variant="caption">
                          {blocker.message || "Original shift cannot be restored."}
                        </Typography>
                      ))}
                    </Stack>
                  </Alert>
                )}
              </Stack>
            </Paper>
          )}
          {cancelError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cancelError}
            </Alert>
          )}
          <TextField
            label="Cancellation reason"
            fullWidth
            multiline
            minRows={3}
            value={cancelReason}
            onChange={(event) => {
              setCancelReason(event.target.value);
              setCancelError("");
            }}
            placeholder="Explain why this leave is being cancelled."
          />
        </DialogContent>
        <DialogActions>
          <Button
            disabled={saving}
            onClick={() => {
              setCancelDialogOpen(false);
              setRestoreLinkedShift(false);
            }}
          >
            Keep leave
          </Button>
          <Button color="error" variant="contained" disabled={saving} onClick={handleCancelLeave}>
            {restoreLinkedShift ? "Cancel leave and restore shift" : "Cancel approved leave"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity || (snackbar.error ? "error" : "success")}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
      <LeaveWorkspaceHelpDrawer open={leaveHelpOpen} onClose={() => setLeaveHelpOpen(false)} />
        </>
      ) : leaveWorkspaceTab === "settings" && canAdministerLeave ? (
        <SettingsLeaveSettings forcedAreaTab="settings" hideAreaTabs />
      ) : leaveWorkspaceTab === "insights" ? (
        <SettingsLeaveInsights onOpenOperations={() => setLeaveWorkspaceTab("operations")} />
      ) : leaveWorkspaceTab === "operations" ? (
        <SettingsLeaveInsights mode="operations" />
      ) : leaveWorkspaceTab === "reports" && canViewLeaveReports ? (
        <SettingsLeaveReports canApplyCarryover={canApplyCarryover} />
      ) : (
        <SettingsLeaveInsights onOpenOperations={() => setLeaveWorkspaceTab("operations")} />
      )}
    </Box>
  );
};

export default LeaveRequests;
