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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
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

const token = () => localStorage.getItem("token");

const formatAvailabilityWarning = (payload) => {
  if (!payload?.availability_warning) return null;
  const count = Number(payload.overlapping_availability_count || 0);
  const plural = count === 1 ? "slot" : "slots";
  return payload.availability_warning_message
    || `Approved successfully. This employee still has ${count} availability ${plural} during the approved leave window.`;
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

const LeaveRequests = () => {
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
  const [reviewDraft, setReviewDraft] = useState(defaultManagerLeaveReviewDraft());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [saving, setSaving] = useState(false);
  const [attachmentDownloading, setAttachmentDownloading] = useState(false);
  const [balanceSummary, setBalanceSummary] = useState(() => normalizeLeaveBalanceSummary());
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceSaving, setBalanceSaving] = useState(false);
  const [balanceDraft, setBalanceDraft] = useState(defaultLeaveBalanceAdjustment());
  const [balanceError, setBalanceError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", error: false, severity: undefined });

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token()}` }), []);

  const filteredEmployees = useMemo(() => {
    if (!filters.department_id) return employees;
    return employees.filter((employee) => String(employee.department_id || "") === String(filters.department_id));
  }, [filters.department_id, employees]);

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
    setReviewDraft(defaultManagerLeaveReviewDraft(row));
    setBalanceDraft(defaultLeaveBalanceAdjustment());
    setBalanceError("");
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
    } catch {
      setBalanceSummary(normalizeLeaveBalanceSummary());
    } finally {
      setBalanceLoading(false);
    }
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
      setSelectedLeave(null);
      await fetchRequests();
    } catch (err) {
      setSnackbar({
        open: true,
        msg: err?.response?.data?.error || err?.response?.data?.message || "Failed to update leave request.",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelLeave = async () => {
    if (!selectedLeave) return;
    const payload = buildManagerLeaveCancelPayload(selectedLeave, cancelReason);
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
      const updated = res.data?.request || null;
      setSelectedLeave(updated);
      await fetchRequests();
    } catch (err) {
      setSnackbar({
        open: true,
        msg: err?.response?.data?.message || err?.response?.data?.error || "Failed to cancel leave request.",
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

  return (
    <Box p={3}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Leave Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review time off, confirm payroll-ready hours, and catch overlap warnings before payroll. Preview-only or estimated leave stays visible for review but is not finalized payroll truth.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={fetchRequests} disabled={loading}>
          Refresh
        </Button>
      </Stack>

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
                <MenuItem value="true">Payroll-ready only</MenuItem>
                <MenuItem value="false">Preview-only / needs confirmation</MenuItem>
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
                                label={leaveMeta.status === "approved" && !leaveMeta.payrollReady ? "Confirm hours" : "Review needed"}
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

      <Drawer
        anchor="right"
        open={Boolean(selectedLeave)}
        onClose={() => setSelectedLeave(null)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, p: 2 } }}
      >
        {selectedLeave && drawerMeta && (
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6">Leave details</Typography>
                <Typography variant="body2" color="text.secondary">{employeeName(selectedLeave)}</Typography>
              </Box>
              <IconButton onClick={() => setSelectedLeave(null)} aria-label="Close leave details">
                <CloseIcon />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={selectedLeave.status || "pending"} sx={readableChipSx(statusChipTone(selectedLeave.status))} />
              <Chip size="small" label={drawerMeta.payLabel} sx={payChipSx(drawerMeta.isPaid)} />
              <Chip size="small" variant="outlined" label={drawerMeta.payrollLabel} sx={readableChipSx(readinessChipTone(drawerMeta), "outlined")} />
              {drawerMeta.estimated && <Chip size="small" variant="outlined" label="Estimated hours" sx={readableChipSx("warning", "outlined")} />}
            </Stack>

            <Alert severity={drawerMeta.actionNeeded ? "warning" : "info"} variant="outlined">
              {drawerMeta.actionNeeded
                ? "This request still needs manager confirmation before it is safe for finalized payroll."
                : "Payroll-ready means the approved hours are confirmed for payroll inputs. Preview-only or estimated leave remains visible for review but is not finalized payroll truth."}
            </Alert>

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
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>
                    Recent balance ledger
                  </Typography>
                  {balanceSummary.ledger.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No balance ledger entries yet.
                    </Typography>
                  ) : (
                    <Stack spacing={0.75}>
                      {balanceSummary.ledger.slice(0, 5).map((entry) => (
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

            {renderWarnings(drawerMeta)}

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
                      helperText="Confirm exact payroll-ready hours before approval."
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
                        Reject
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
                  </Alert>
                  <Button
                    color="error"
                    variant="outlined"
                    disabled={saving}
                    onClick={() => {
                      setCancelReason("");
                      setCancelError("");
                      setCancelDialogOpen(true);
                    }}
                  >
                    Cancel leave
                  </Button>
                </Box>
              </>
            )}
          </Stack>
        )}
      </Drawer>

      <Dialog
        open={cancelDialogOpen}
        onClose={() => {
          if (!saving) setCancelDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Cancel leave request</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
            Cancelling approved leave may affect scheduling and payroll preview. If this leave was already used in finalized payroll, the backend will block cancellation.
          </Alert>
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
          <Button disabled={saving} onClick={() => setCancelDialogOpen(false)}>
            Keep leave
          </Button>
          <Button color="error" variant="contained" disabled={saving} onClick={handleCancelLeave}>
            Cancel leave
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
    </Box>
  );
};

export default LeaveRequests;
