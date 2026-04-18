// ─────────────────────────────────────────────────────────────────────────
//  SecondEmployeeShiftView.js  •  Employee self-service: Shifts + Leave + Swap + Manager Approvals
// ─────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Chip,
  Drawer,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  Modal,
  Stack,
  Tooltip,
  Switch,
  Collapse,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  useMediaQuery,
  LinearProgress,
  Pagination,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { format, parseISO, differenceInMinutes, addDays, startOfDay } from "date-fns";
import { useTheme } from "@mui/material/styles";
import { DateTime } from "luxon";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import api from "../../utils/api";
import { STATUS } from "../../utils/shiftSwap";
import { POLL_MS } from "../../utils/shiftSwap";
import ShiftSwapPanel from "../../components/ShiftSwapPanel";
import IncomingSwapRequests from "../../components/IncomingSwapRequests";
import { getUserTimezone } from "../../utils/timezone";
import { timeTracking } from "../../utils/api";
import SmartShiftAvailabilityTab from "../recruiter/SmartShiftAvailabilityTab";
import {
  applyEmployeeLeaveDurationMode,
  applyEmployeeLeaveStartDate,
  buildEmployeeLeaveRequestSubmission,
  canWithdrawEmployeeLeave,
  defaultEmployeeLeaveForm,
  estimateEmployeeLeaveRequestedHours,
  normalizeEmployeeLeaveRequest,
} from "./utils/employeeLeaveRequest";
import {
  attachmentLabel,
  canEmployeeDeleteLeaveAttachment,
  canEmployeeUploadLeaveAttachment,
  normalizeLeaveAttachment,
  openAttachmentDownload,
  parseAttachmentDownloadResponse,
} from "./utils/leaveAttachments";
import { formatLeaveApiError } from "./utils/leaveErrors";
import { LEAVE_TYPE_OPTIONS, formatLeaveTypeLabel } from "./utils/leaveSettings";
import { formatBalanceHours, normalizeLeaveBalanceSummary } from "./utils/leaveBalances";
import ThemedDateField, { ThemedTimeField } from "../../components/ui/ThemedDateField";

const statusColor = {
  assigned: "default",
  in_progress: "warning",
  completed: "info",
  approved: "success",
  rejected: "error",
};

const formatBreakMinutesLabel = (value, compact = false) => {
  const minutes = Number(value || 0);
  if (!Number.isFinite(minutes) || minutes <= 0) return compact ? "0m" : "0 min";
  if (minutes < 1) return compact ? "<1m" : "Less than 1 min";
  const rounded = Math.round(minutes);
  return compact ? `${rounded}m` : `${rounded} min`;
};

const balanceCardTone = (balance = {}) => {
  if (!balance.balance_managed) return "default";
  if (balance.eligible_now === false) return "warning";
  if (Number(balance.balance_hours || 0) <= 0) return "warning";
  return "success";
};

const balanceCardSx = (tone = "default") => (theme) => {
  const colors = {
    success: {
      border: "rgba(34, 197, 94, 0.32)",
      bg: "linear-gradient(145deg, rgba(240,253,244,0.96), rgba(255,255,255,0.92))",
    },
    warning: {
      border: "rgba(245, 158, 11, 0.36)",
      bg: "linear-gradient(145deg, rgba(255,251,235,0.96), rgba(255,255,255,0.92))",
    },
    default: {
      border: "rgba(148, 163, 184, 0.36)",
      bg: "linear-gradient(145deg, rgba(248,250,252,0.96), rgba(255,255,255,0.92))",
    },
  };
  const selected = colors[tone] || colors.default;
  return {
    p: 1.4,
    borderRadius: 1,
    border: `1px solid ${selected.border}`,
    bgcolor: theme.palette.background.paper,
    background: selected.bg,
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
    height: "100%",
  };
};

const formatPolicySummaryText = (balance = {}) => {
  const policy = balance.policy_summary || {};
  const parts = [];
  if (policy.grant_method) parts.push(String(policy.grant_method).replace(/_/g, " "));
  if (policy.workday_hours) parts.push(`${policy.workday_hours}h standard workday`);
  if (balance.balance_managed) parts.push("balance-managed");
  return parts.length ? parts.join(" · ") : "Manual or not balance-managed";
};

const statusChipSx = (status, active = false) => (theme) => {
  const normalized = String(status || "").toLowerCase();
  if (active || normalized === "in_progress") {
    return {
      bgcolor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      fontWeight: 800,
      border: `1px solid ${theme.palette.primary.dark}`,
      "& .MuiChip-icon": { color: "inherit" },
    };
  }
  if (normalized === "approved" || normalized === "completed") {
    return {
      bgcolor: theme.palette.success.main,
      color: theme.palette.success.contrastText,
      fontWeight: 800,
      "& .MuiChip-icon": { color: "inherit" },
    };
  }
  return {
    bgcolor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    fontWeight: 700,
    border: `1px solid ${theme.palette.divider}`,
    "& .MuiChip-icon": { color: "inherit" },
  };
};

const leaveChipSx = (status) => (theme) => {
  const normalized = String(status || "").toLowerCase();
  const palette =
    normalized === "approved"
      ? theme.palette.success
      : normalized === "pending"
      ? theme.palette.warning
      : theme.palette.error;
  return {
    mt: 1,
    mr: 1,
    bgcolor: palette.main,
    color: palette.contrastText,
    border: `1px solid ${palette.dark || palette.main}`,
    fontWeight: 800,
    maxWidth: "100%",
    "& .MuiChip-label": {
      color: "inherit",
      fontWeight: 800,
      whiteSpace: "normal",
      lineHeight: 1.2,
      py: 0.25,
    },
  };
};

const readableLightChipSx = (theme) => ({
  bgcolor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  border: `1px solid ${theme.palette.divider}`,
  fontWeight: 800,
  "& .MuiChip-label": {
    color: "inherit",
    fontWeight: 800,
  },
});

/* eslint-disable react-hooks/exhaustive-deps */

const SecondEmployeeShiftView = ({ employeePolish = false }) => {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole") || ""; // Example role storage

  const isManager = userRole.toLowerCase() === "manager";
  const [optOut, setOptOut] = useState(false);
  const viewerTimezone = getUserTimezone();

  // ──────────────── Shift / leave states ────────────────
  const [shifts, setShifts] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPanel, setDrawerPanel] = useState("shifts");
  const [hideAvailabilityTab, setHideAvailabilityTab] = useState(false);
  const [availabilityPolicyLoaded, setAvailabilityPolicyLoaded] = useState(false);
  const [todayCardCollapsed, setTodayCardCollapsed] = useState(false);
  const [countdownTick, setCountdownTick] = useState(Date.now());
  const [shiftPage, setShiftPage] = useState(1);
  const [leavePage, setLeavePage] = useState(1);
  const [shiftRange, setShiftRange] = useState(() => {
    const today = new Date();
    return {
      startDate: format(addDays(today, -7), "yyyy-MM-dd"),
      endDate: format(addDays(today, 7), "yyyy-MM-dd"),
    };
  });
  const [fieldPhotosStatus, setFieldPhotosStatus] = useState(null);
  const [fieldPhotoSummaries, setFieldPhotoSummaries] = useState({});
  const [photoUploadShift, setPhotoUploadShift] = useState(null);
  const [photoUploadFiles, setPhotoUploadFiles] = useState([]);
  const [photoUploadNote, setPhotoUploadNote] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState("");

  // Leave-request dialog
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    ...defaultEmployeeLeaveForm(null),
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveFormError, setLeaveFormError] = useState("");
  const [employeeLeaveRequests, setEmployeeLeaveRequests] = useState([]);
  const [leaveHistoryLoading, setLeaveHistoryLoading] = useState(false);
  const [selectedEmployeeLeave, setSelectedEmployeeLeave] = useState(null);
  const [leaveAttachmentBusy, setLeaveAttachmentBusy] = useState(false);
  const [employeeLeaveBalances, setEmployeeLeaveBalances] = useState(() => normalizeLeaveBalanceSummary());
  const [leaveBalancesLoading, setLeaveBalancesLoading] = useState(false);

  // ──────────────── Swap states ────────────────
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetShiftId, setSwapTargetShiftId] = useState(null);
  const [swapMsg, setSwapMsg] = useState("");
  const [swappableShifts, setSwappableShifts] = useState([]);
  const [scopeWeek, setScopeWeek] = useState(false); 
  const [pendingSwaps, setPendingSwaps] = useState([]);
  const [showSwapHistory, setShowSwapHistory] = useState(false);

  // Manager approvals toggle
  const [showSwapApprovals, setShowSwapApprovals] = useState(false);

  // Employee “My Swap Requests” toggle moved inside drawer
  const [showMySwapRequests, setShowMySwapRequests] = useState(false);

  // Snackbar feedback (shared)
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", error: false });
  const [clocking, setClocking] = useState(false);
  const [breakSubmitting, setBreakSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const activeShiftRef = useRef(null);
  const [timeSummary, setTimeSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historySummary, setHistorySummary] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyFilters, setHistoryFilters] = useState(() => {
    const end = format(new Date(), "yyyy-MM-dd");
    return { startDate: end, endDate: end, status: "all" };
  });
  const [locationCaptureMessage, setLocationCaptureMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(DateTime.now());
  const targetWeeklyHours = timeSummary?.policy?.target_weekly_hours || 40;

 // ───────────────────────────────────────────────────────
//  Fetch helpers
// ───────────────────────────────────────────────────────
const authHeader = { Authorization: `Bearer ${token}` };
const loadTimeSummary = useCallback(async () => {
  setSummaryLoading(true);
  try {
    const data = await timeTracking.employeeSummary();
    setTimeSummary(data);
  } catch {
    setTimeSummary(null);
  } finally {
    setSummaryLoading(false);
  }
}, []);

const loadTimeHistory = useCallback(async () => {
  setHistoryLoading(true);
  setHistoryError("");
  try {
    const data = await timeTracking.employeeHistory({
      start_date: historyFilters.startDate,
      end_date: historyFilters.endDate,
      status: historyFilters.status !== "all" ? historyFilters.status : undefined,
    });
    setHistoryEntries(Array.isArray(data?.entries) ? data.entries : []);
    setHistorySummary(data?.summary || null);
  } catch (err) {
    setHistoryEntries([]);
    setHistorySummary(null);
    setHistoryError(err?.response?.data?.error || "Failed to load time history.");
  } finally {
    setHistoryLoading(false);
  }
}, [historyFilters.endDate, historyFilters.startDate, historyFilters.status]);

const loadEmployeeLeaveRequests = useCallback(async () => {
  setLeaveHistoryLoading(true);
  try {
    const res = await api.get("/employee/leave-requests", { headers: authHeader });
    const rows = Array.isArray(res.data?.requests) ? res.data.requests : [];
    setEmployeeLeaveRequests(rows.map(normalizeEmployeeLeaveRequest));
  } catch {
    setEmployeeLeaveRequests([]);
  } finally {
    setLeaveHistoryLoading(false);
  }
}, [token]);

const loadEmployeeLeaveBalances = useCallback(async (params = {}) => {
  setLeaveBalancesLoading(true);
  try {
    const res = await api.get("/employee/leave-balances", { headers: authHeader, params });
    setEmployeeLeaveBalances(normalizeLeaveBalanceSummary(res.data));
  } catch {
    setEmployeeLeaveBalances(normalizeLeaveBalanceSummary());
  } finally {
    setLeaveBalancesLoading(false);
  }
}, [token]);

const selectedLeaveBalancePreview = useMemo(
  () => employeeLeaveBalances.balances.find((row) => row.leave_type === leaveForm.leave_type) || null,
  [employeeLeaveBalances, leaveForm.leave_type]
);

const estimatedLeaveRequestHours = useMemo(
  () => estimateEmployeeLeaveRequestedHours(leaveForm, selectedShift, selectedLeaveBalancePreview),
  [leaveForm, selectedShift, selectedLeaveBalancePreview]
);

const loadShifts = async () => {
  try {
    let photoStatus = fieldPhotosStatus;
    if (!photoStatus) {
      try {
        const statusRes = await api.get("/employee/field-photos/status", { headers: authHeader });
        photoStatus = statusRes.data?.field_photos || null;
        setFieldPhotosStatus(photoStatus);
      } catch {
        photoStatus = null;
      }
    }
    const [res, leaveRes] = await Promise.all([
      api.get("/recruiter/calendar", {
        params: { start_date: shiftRange.startDate, end_date: shiftRange.endDate },
        headers: authHeader,
      }),
      (async () => {
        try {
          return await api.get("/employee/leave-requests", { headers: authHeader });
        } catch {
          try {
            return await api.get("/leave/all", { headers: authHeader });
          } catch {
            return await api.get("/my-availability", { headers: authHeader });
          }
        }
      })(),
    ]);

    const { events = [] } = res.data || {};
    const employeeLeaveRows = Array.isArray(leaveRes.data?.requests)
      ? leaveRes.data.requests.map(normalizeEmployeeLeaveRequest)
      : null;
    if (employeeLeaveRows) {
      setEmployeeLeaveRequests(employeeLeaveRows);
    }
    const leaveBlocks = employeeLeaveRows
      ? employeeLeaveRows.map((l) => ({
          id: l.id,
          leave_type: l.leave_type || "Leave",
          leave_subtype: l.leave_subtype || null,
          status: l.status,
          start_date: l.start_date,
          end_date: l.end_date || l.start_date,
          duration_mode: l.duration_mode,
          requested_hours: l.requested_hours,
          approved_hours: l.approved_hours,
          is_paid_leave: l.is_paid_leave,
          review_comment: l.review_comment,
        }))
      : Array.isArray(leaveRes.data)
      ? leaveRes.data.map((l) => ({
          id: l.id,
          leave_type: l.leave_type || "Leave",
          leave_subtype: l.leave_subtype || null,
          status: (l.status || "").toLowerCase(),
          start_date: l.start_date,
          end_date: l.end_date || l.start_date,
        }))
      : (leaveRes.data?.leave_blocks || []).map((l) => ({
          id: l.id,
          leave_type: l.type || "Leave",
          leave_subtype: l.subtype || null,
          status: "approved",
          start_date: l.start ? l.start.slice(0, 10) : null,
          end_date: l.end ? l.end.slice(0, 10) : (l.start ? l.start.slice(0, 10) : null),
        }));

    const shiftEvents = events
      .filter((e) => e.type === "shift")
      .map((e) => {
        let shiftDate = e.date || null;
        if (!shiftDate && e.start) {
          try {
            shiftDate = format(parseISO(e.start), "yyyy-MM-dd");
          } catch {
            shiftDate = null;
          }
        }
        return {
          id: e.shift_id,
          recruiter_id: e.recruiter_id || e.employee_id || e.recruiter?.id || null,
          clock_in: e.start,
          clock_out: e.end,
          clock_source: e.clock_source || "schedule",
          status: e.status || "assigned",
          timezone: e.timezone,
          is_locked: e.is_locked ?? false,
          swap_status: e.swap_status,
          on_leave: e.on_leave,
          leave_type: e.leave_type,
          leave_subtype: e.leave_subtype,
          leave_status: e.leave_status,
          override_hours: e.override_hours,
          break_start: e.break_start,
          break_end: e.break_end,
          break_minutes: e.break_minutes,
          break_paid: e.break_paid,
          break_policy: e.break_policy,
          date: shiftDate,
        };
      });

    const leaveEntries = [];
    leaveBlocks.forEach((leave) => {
      if (!leave?.start_date) return;
      const start = startOfDay(parseISO(leave.start_date));
      const end = startOfDay(parseISO(leave.end_date || leave.start_date));
      for (let d = start; d.getTime() <= end.getTime(); d = addDays(d, 1)) {
        const dateStr = format(d, "yyyy-MM-dd");
        leaveEntries.push({
          id: `leave-${leave.id}-${dateStr}`,
          clock_in: null,
          clock_out: null,
          status: "leave",
          on_leave: true,
          leave_type: leave.leave_type || "Leave",
          leave_subtype: leave.leave_subtype || null,
          leave_status: leave.status || "approved",
          duration_mode: leave.duration_mode,
          requested_hours: leave.requested_hours,
          approved_hours: leave.approved_hours,
          is_paid_leave: leave.is_paid_leave,
          review_comment: leave.review_comment,
          date: dateStr,
          is_leave_entry: true,
        });
      }
    });

    const combined = [...shiftEvents, ...leaveEntries].sort((a, b) => {
      const ad = a.date || "";
      const bd = b.date || "";
      if (ad === bd) {
        return (a.clock_in || "").localeCompare(b.clock_in || "");
      }
      return ad.localeCompare(bd);
    });

    setShifts(combined);
    const shouldLoadPhotoSummaries = Boolean(photoStatus?.addon_active || photoStatus?.read_only);
    const realShiftIds = shouldLoadPhotoSummaries
      ? combined
          .filter((row) => {
            if (!row.id || row.on_leave || row.is_leave_entry) return false;
            if (row.recruiter_id && userId && String(row.recruiter_id) !== String(userId)) return false;
            return true;
          })
          .slice(0, 30)
          .map((row) => row.id)
      : [];
    const summaries = {};
    await Promise.allSettled(realShiftIds.map(async (id) => {
      const photoRes = await api.get(`/employee/shifts/${id}/field-photos`, { headers: authHeader });
      summaries[id] = photoRes.data || {};
    }));
    setFieldPhotoSummaries(summaries);
  } catch (err) {
    setErrorMsg("Failed to fetch your shifts.");
  } finally {
    setLoading(false);
  }
};

const loadFieldPhotosStatus = async () => {
  try {
    const res = await api.get("/employee/field-photos/status", { headers: authHeader });
    setFieldPhotosStatus(res.data?.field_photos || null);
  } catch {
    setFieldPhotosStatus(null);
  }
};

const canUploadFieldPhotoForShift = (shift) => {
  if (!fieldPhotosStatus?.addon_active || !fieldPhotosStatus?.upload_enabled || fieldPhotosStatus?.read_only) return false;
  if (!shift?.date || shift.on_leave || shift.is_leave_entry) return false;
  if (shift.recruiter_id && userId && String(shift.recruiter_id) !== String(userId)) return false;
  const shiftDay = startOfDay(parseISO(shift.date));
  const today = startOfDay(new Date());
  return shiftDay >= addDays(today, -14) && shiftDay <= addDays(today, 7);
};

const openFieldPhotoUpload = (shift) => {
  setPhotoUploadShift(shift);
  setPhotoUploadFiles([]);
  setPhotoUploadNote("");
  setPhotoUploadProgress("");
};

const submitFieldPhotoUpload = async () => {
  if (!photoUploadShift?.id || !photoUploadFiles.length) {
    setSnackbar({ open: true, msg: "Choose one or more photos to upload.", error: true });
    return;
  }
  setPhotoUploading(true);
  setPhotoUploadProgress(`Preparing ${photoUploadFiles.length} photo${photoUploadFiles.length === 1 ? "" : "s"}...`);
  let uploaded = 0;
  const failed = [];
  try {
    const locationPayload = await getPunchLocationPayload();
    for (let index = 0; index < photoUploadFiles.length; index += 1) {
      const file = photoUploadFiles[index];
      setPhotoUploadProgress(`Uploading ${index + 1} of ${photoUploadFiles.length}`);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("note", photoUploadNote || "");
      const loc = locationPayload?.location || {};
      Object.entries(loc).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(`location[${key}]`, value);
        }
      });
      try {
        await api.post(`/employee/shifts/${photoUploadShift.id}/field-photos`, formData, {
          headers: { ...authHeader, "Content-Type": "multipart/form-data" },
        });
        uploaded += 1;
      } catch (err) {
        failed.push({
          name: file.name,
          message: err?.response?.data?.error || "Upload failed.",
        });
      }
    }
    const message = failed.length
      ? `${uploaded} photo${uploaded === 1 ? "" : "s"} uploaded. ${failed.length} photo${failed.length === 1 ? "" : "s"} could not be uploaded.${failed.length <= 3 ? `\n${failed.map((item) => `${item.name}: ${item.message}`).join("\n")}` : ""}`
      : `${uploaded} photo${uploaded === 1 ? "" : "s"} uploaded. Security check in progress.`;
    setSnackbar({ open: true, msg: message, error: failed.length > 0 });
    setPhotoUploadShift(null);
    setPhotoUploadFiles([]);
    setPhotoUploadNote("");
    await loadShifts();
  } catch (err) {
    const backendMessage = err?.response?.data?.error || "";
    setSnackbar({
      open: true,
      msg: backendMessage === "Shift not found."
        ? "Photos can only be uploaded by the employee assigned to this shift."
        : backendMessage || "Unable to upload photo.",
      error: true,
    });
  } finally {
    setPhotoUploading(false);
    setPhotoUploadProgress("");
  }
};

const loadPendingSwaps = async (showHistory = false) => {
  try {
    const statusFilter = showHistory ? "" : "?status=pending,executed";
    const res = await api.get(`/shift-swap-requests${statusFilter}`, {
      headers: authHeader,
    });
    const data = res.data;
    setPendingSwaps(data);
  } catch (_) {
    setPendingSwaps([]);
  }
};

  const loadOptOut = async () => {
  try {
    const res = await api.get("/employee/swap-opt-out", {
      headers: authHeader,
    });
    const data = res.data;
    setOptOut(Boolean(data.opt_out));
  } catch {
    /* if call fails, keep default = false */
  }
};

const loadSwappableShifts = async (shiftId, scope = "week") => {
  try {
    const res = await api.get("/employee/swappable-shifts", {
      params: { shift_id: shiftId, scope },
      headers: authHeader,
    });
    const data = res.data;
    setSwappableShifts(data);
  } catch (_) {
    setSwappableShifts([]);
  }
};

const loadSmartShiftPolicy = async () => {
  try {
    const res = await api.get("/api/recruiter/smart-shifts/policy", { headers: authHeader });
    const hidden = Boolean(res?.data?.hide_employee_availability_tab);
    const allowed = Boolean(res?.data?.employee_availability_allowed);
    const effectiveHidden = hidden && !allowed;
    setHideAvailabilityTab(effectiveHidden);
    if (effectiveHidden) {
      setDrawerPanel("shifts");
    }
  } catch {
    setHideAvailabilityTab(false);
  } finally {
    setAvailabilityPolicyLoaded(true);
  }
};

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  loadShifts();
  loadPendingSwaps(showSwapHistory);
  loadOptOut();
  loadSmartShiftPolicy();
  loadFieldPhotosStatus();
  loadTimeHistory();
  loadEmployeeLeaveRequests();
  loadEmployeeLeaveBalances();
}, [userId]);

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  if (drawerOpen && drawerPanel === "shifts") {
    loadShifts();
    setShiftPage(1);
  }
}, [shiftRange.startDate, shiftRange.endDate]);

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  const intervalId = setInterval(() => {
    loadShifts();
    loadPendingSwaps(showSwapHistory);
  }, POLL_MS); // <--- use the shared constant!
  return () => clearInterval(intervalId);
}, [showSwapHistory]);

useEffect(() => {
  const ticker = setInterval(() => setCountdownTick(Date.now()), 30000);
  return () => clearInterval(ticker);
}, []);

useEffect(() => {
  loadTimeHistory();
}, [loadTimeHistory, historyFilters.startDate, historyFilters.endDate, historyFilters.status]);

useEffect(() => {
  if (!leaveModalOpen || !leaveForm.leave_type) return;
  loadEmployeeLeaveBalances({
    leave_start_date: leaveForm.start_date || undefined,
    leave_type: leaveForm.leave_type,
    requested_hours: estimatedLeaveRequestHours || undefined,
  });
}, [leaveModalOpen, leaveForm.leave_type, leaveForm.start_date, estimatedLeaveRequestHours, loadEmployeeLeaveBalances]);

useEffect(() => {
  const id = setInterval(() => setLastUpdated(DateTime.now()), 30000);
  return () => clearInterval(id);
}, []);

// ───────────────────────────────────────────────────────
//  Leave-request logic

  // ───────────────────────────────────────────────────────
  const openLeaveForm = (shift = null) => {
    setSelectedShift(shift);
    setLeaveForm(defaultEmployeeLeaveForm(shift));
    setLeaveFormError("");
    setLeaveModalOpen(true);
  };

  const pageSize = 14;
  const shiftRows = useMemo(
    () => shifts.filter((s) => !(s.on_leave || s.is_leave_entry)),
    [shifts]
  );
  const leaveRows = useMemo(
    () => shifts.filter((s) => s.on_leave || s.is_leave_entry),
    [shifts]
  );
  const leavesByDate = useMemo(() => {
    const map = {};
    leaveRows.forEach((leave) => {
      const dateKey = leave.date;
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(leave);
    });
    return map;
  }, [leaveRows]);
  const shiftPageCount = Math.max(1, Math.ceil(shiftRows.length / pageSize));
  const leavePageCount = Math.max(1, Math.ceil(leaveRows.length / pageSize));
  const pagedShifts = shiftRows.slice((shiftPage - 1) * pageSize, shiftPage * pageSize);
  const pagedLeaves = leaveRows.slice((leavePage - 1) * pageSize, leavePage * pageSize);

  useEffect(() => {
    setShiftPage(1);
    setLeavePage(1);
  }, [shiftRows.length, leaveRows.length]);

  const submitLeaveRequest = async () => {
    setSubmittingLeave(true);
    try {
      const submission = buildEmployeeLeaveRequestSubmission(leaveForm, selectedShift);
      if (submission.error) {
        setLeaveFormError(submission.error);
        throw new Error(submission.error);
      }
      setLeaveFormError("");
      const res = await api.post(
        submission.endpoint,
        submission.payload,
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
        }
      );
      const data = res.data || {};
      if (data?.error) throw new Error(data.error || "Request failed");
      setSnackbar({ open: true, msg: "Leave request submitted.", error: false });
      setLeaveModalOpen(false);
      setLeaveForm(defaultEmployeeLeaveForm(null));
      loadShifts();
      loadEmployeeLeaveRequests();
    } catch (err) {
      setSnackbar({ open: true, msg: err.response?.data?.error || err.message, error: true });
    } finally {
      setSubmittingLeave(false);
    }
  };

  const withdrawLeaveRequest = async (leaveId) => {
    try {
      await api.post(`/employee/leave-requests/${leaveId}/withdraw`, {}, { headers: authHeader });
      setSnackbar({ open: true, msg: "Leave request withdrawn.", error: false });
      setSelectedEmployeeLeave(null);
      loadShifts();
      loadEmployeeLeaveRequests();
    } catch (err) {
      setSnackbar({
        open: true,
        msg: err.response?.data?.error || "Could not withdraw leave request.",
        error: true,
      });
    }
  };

  const openEmployeeLeaveDetail = async (leave) => {
    const fallback = normalizeEmployeeLeaveRequest(leave);
    setSelectedEmployeeLeave(fallback);
    if (!fallback.id) return;
    try {
      const res = await api.get(`/employee/leave-requests/${fallback.id}`, { headers: authHeader });
      const detail = res.data?.request ? normalizeEmployeeLeaveRequest(res.data.request) : fallback;
      setSelectedEmployeeLeave(detail);
    } catch {
      setSelectedEmployeeLeave(fallback);
    }
  };

  const applyUpdatedEmployeeLeave = (request) => {
    if (!request) return;
    const normalized = normalizeEmployeeLeaveRequest(request);
    setSelectedEmployeeLeave(normalized);
    setEmployeeLeaveRequests((prev) =>
      prev.map((row) => (String(row.id) === String(normalized.id) ? normalized : row))
    );
  };

  const uploadEmployeeLeaveAttachment = async (leave, file) => {
    if (!leave?.id || !file) return;
    const formData = new FormData();
    formData.append("file", file);
    setLeaveAttachmentBusy(true);
    try {
      const res = await api.post(`/employee/leave-requests/${leave.id}/attachment`, formData, {
        headers: authHeader,
      });
      applyUpdatedEmployeeLeave(res.data?.request);
      setSnackbar({ open: true, msg: "Supporting document uploaded.", error: false });
      loadEmployeeLeaveRequests();
    } catch (err) {
      const msg = await formatLeaveApiError(err, "Could not upload document.");
      setSnackbar({
        open: true,
        msg,
        error: true,
      });
    } finally {
      setLeaveAttachmentBusy(false);
    }
  };

  const deleteEmployeeLeaveAttachment = async (leave) => {
    if (!leave?.id) return;
    setLeaveAttachmentBusy(true);
    try {
      const res = await api.delete(`/employee/leave-requests/${leave.id}/attachment`, { headers: authHeader });
      applyUpdatedEmployeeLeave(res.data?.request);
      setSnackbar({ open: true, msg: "Supporting document removed.", error: false });
      loadEmployeeLeaveRequests();
    } catch (err) {
      const msg = await formatLeaveApiError(err, "Could not remove document.");
      setSnackbar({
        open: true,
        msg,
        error: true,
      });
    } finally {
      setLeaveAttachmentBusy(false);
    }
  };

  const downloadEmployeeLeaveAttachment = async (leave) => {
    if (!leave?.id) return;
    setLeaveAttachmentBusy(true);
    try {
      const res = await api.get(`/employee/leave-requests/${leave.id}/attachment`, {
        headers: authHeader,
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
      setLeaveAttachmentBusy(false);
    }
  };

  // ───────────────────────────────────────────────────────
  //  Swap logic
  // ───────────────────────────────────────────────────────

  const fireEmail = async (swapId) => {
    if (!swapId) return;
    try {
      await api.post(
        `/shift-swap-requests/${swapId}/send-email`,
        {},
        { headers: authHeader }
      );
      setSnackbar({ open: true, msg: "Swap request e-mail sent!", error: false });
    } catch {
      setSnackbar({ open: true, msg: "Swap created but e-mail failed.", error: true });
    }
  };

  const openSwapModal = (shift) => {
    setSelectedShift(shift);
    setSwapTargetShiftId(null);
    setSwapMsg("");
    setSwapModalOpen(true);
    loadSwappableShifts(
    shift.id,
     scopeWeek ? "week" : "month"          // fallback is month now
    );
    loadPendingSwaps(showSwapHistory);
  };

  const handleSwapRequest = async () => {
    try {
      const res = await api.post(
        `/shift-swap-requests`,
        {
          from_shift_id: selectedShift.id,
          target_shift_id: swapTargetShiftId,
          message: swapMsg,
        },
        { headers: authHeader }
      );

      await fireEmail(res.data?.swap_id);
      setSwapModalOpen(false);
      loadPendingSwaps(showSwapHistory);
      loadShifts();
    } catch (err) {
  if (err.response?.status === 409 && err.response.data?.swap_id) {
    await fireEmail(err.response.data.swap_id);
    setSwapModalOpen(false);
  } else {
    setSnackbar({
      open: true,
      msg: err.response?.data?.error || "Swap failed",
      error: true,
    });
  }
}

  };

  const cancelSwap = async (swapId) => {
    try {
      await api.delete(`/shift-swap-requests/${swapId}`, {
        headers: authHeader,
      });
      setSnackbar({ open: true, msg: "Swap cancelled.", error: false });
      loadPendingSwaps(showSwapHistory);
      loadShifts();
    } catch (_) {
      setSnackbar({ open: true, msg: "Cancel failed", error: true });
    }
  };

  // ───────────────────────────────────────────────────────
  //  Render helpers
  // ───────────────────────────────────────────────────────
  const durationChip = (shift) => {
    if (!shift.clock_in || !shift.clock_out) return null;
    const start = parseISO(shift.clock_in);
    const end = parseISO(shift.clock_out);
    const mins = differenceInMinutes(end, start);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return shift.override_hours
      ? `⏱️ ${shift.override_hours}h (override)`
      : `⏱️ ${h}h ${m}m`;
  };

  const formatLeaveDurationMode = (mode) => {
    if (mode === "shift_linked") return "Shift-linked";
    if (mode === "partial_day") return "Partial day";
    if (mode === "hourly") return "Hourly";
    return "Full day";
  };

  const formatLeaveHours = (leave) => {
    const approved = Number(leave.approved_hours);
    const requested = Number(leave.requested_hours);
    if (Number.isFinite(approved) && approved > 0) return `Approved ${approved}h`;
    if (Number.isFinite(requested) && requested > 0) return `Requested ${requested}h`;
    return "";
  };

  const balancePolicyActionLabel = (action) => {
    const labels = {
      within_balance: "Within balance",
      warn: "Balance warning",
      insufficient_warn: "Balance warning",
      block: "Blocked by balance policy",
      insufficient_block: "Blocked by balance policy",
      split_to_unpaid: "Available paid hours only",
      allow_negative: "Negative balance allowed",
      unpaid_no_deduction: "Unpaid, no balance deduction",
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

  const [overrideShiftId, setOverrideShiftId] = useState(null);

  const todayShift = useMemo(() => {
    if (!shifts.length) return null;
    const now = DateTime.now().setZone(viewerTimezone);

    const mapped = shifts
      .map((shift) => {
        try {
          if (!shift.clock_in || !shift.clock_out) return null;
          const start = DateTime.fromISO(shift.clock_in, { setZone: true });
          const end = shift.clock_out ? DateTime.fromISO(shift.clock_out, { setZone: true }) : null;
          return {
            ...shift,
            _start: start,
            _end: end,
            _status: (shift.status || "").toLowerCase(),
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // If user manually picked a shift, honor it if found
    if (overrideShiftId) {
      const manual = mapped.find((s) => s.id === overrideShiftId);
      if (manual) return manual;
    }

    const activeStatuses = ["in_progress", "assigned", "pending"];
    const active = mapped
      .filter((s) => activeStatuses.includes(s._status))
      .map((s) => {
        const startDt = s._start;
        const end = s._end || (startDt ? startDt.plus({ hours: 12 }) : null);
        const spansNow = startDt && end && now >= startDt && now <= end;
        return { ...s, _spansNow: spansNow, _start: startDt };
      });

    // Prefer a shift that spans "now"
    const spanning = active.filter((s) => s._spansNow);
    if (spanning.length) {
      return spanning.sort((a, b) => (b._start?.toMillis() || 0) - (a._start?.toMillis() || 0))[0];
    }

    // Otherwise, pick the latest in-progress shift
    const inProgress = active.filter((s) => s._status === "in_progress");
    if (inProgress.length) {
      return inProgress.sort((a, b) => (b._start?.toMillis() || 0) - (a._start?.toMillis() || 0))[0];
    }

    // Finally, choose the nearest upcoming shift (today) if any
    const startOfDay = now.startOf("day");
    const endOfDay = now.endOf("day");
    const todayUpcoming = active.filter(
      (s) => s._start && s._start >= startOfDay && s._start <= endOfDay
    );
    if (todayUpcoming.length) {
      return todayUpcoming.sort((a, b) => {
        const aStart = a._start ? a._start.toMillis() : 0;
        const bStart = b._start ? b._start.toMillis() : 0;
        return aStart - bStart;
      })[0];
    }

    return null;
  }, [shifts, viewerTimezone, overrideShiftId]);

useEffect(() => {
  setTodayCardCollapsed(false);
}, [todayShift?.id]);
  const formatHoursValue = useCallback((value) => `${Number(value || 0).toFixed(1)}h`, []);
  const summaryMetrics = useMemo(() => {
    if (!timeSummary) return [];
    const hoursWorked = Number(timeSummary?.hours?.worked || 0);
    const overtimeHours = Number(timeSummary?.hours?.overtime || 0);
    const remainingHours = Math.max(targetWeeklyHours - hoursWorked, 0);
    const hoursProgress = targetWeeklyHours ? Math.min(100, (hoursWorked / targetWeeklyHours) * 100) : 0;
    return [
      {
        label: "Hours this week",
        value: formatHoursValue(hoursWorked),
        helper: `${formatHoursValue(overtimeHours)} overtime`,
        icon: <AccessTimeFilledIcon fontSize="small" />,
        progress: hoursProgress,
        progressHelper:
          overtimeHours > 0
            ? `${formatHoursValue(overtimeHours)} overtime`
            : `${formatHoursValue(remainingHours)} remaining`,
      },
      {
        label: "Breaks",
        value: `${timeSummary?.breaks?.taken || 0}`,
        helper: `${timeSummary?.breaks?.missed || 0} missed`,
        icon: <LocalCafeIcon fontSize="small" />,
      },
      {
        label: "Shifts tracked",
        value: `${timeSummary?.shifts?.count || 0}`,
        helper: `${timeSummary?.breaks?.minutes || 0} break mins`,
        icon: <EventAvailableIcon fontSize="small" />,
      },
    ];
  }, [timeSummary, formatHoursValue, targetWeeklyHours]);

  const swapStatusChip = (shift) => {
  if (!shift.swap_status) return null;
  return (
    <Tooltip title={STATUS[shift.swap_status]?.label || shift.swap_status}>
      <Chip
        label={`Swap: ${STATUS[shift.swap_status]?.label || shift.swap_status}`}
        color={STATUS[shift.swap_status]?.chip || "default"}
        size="small"
        sx={{ mt: 1, mr: 1 }}
      />
    </Tooltip>
  );
};


  //  Component markup
  const shiftTimezone = todayShift?.timezone || viewerTimezone;
  const parseShiftDate = useCallback(
    (iso) => {
      if (!iso) return null;
      const hasOffset = /([+-]\d{2}:?\d{2}|Z)$/i.test(iso);
      const base = hasOffset
        ? DateTime.fromISO(iso, { setZone: true })
        : DateTime.fromISO(iso, { zone: "utc" });
      if (!base.isValid) return null;
      return base.setZone(shiftTimezone);
    },
    [shiftTimezone]
  );

  const clockInDt = todayShift?.clock_in ? parseShiftDate(todayShift.clock_in) : null;
  const clockOutDt = todayShift?.clock_out ? parseShiftDate(todayShift.clock_out) : null;
  const breakStartDt = todayShift?.break_start ? parseShiftDate(todayShift.break_start) : null;
  const breakEndDt = todayShift?.break_end ? parseShiftDate(todayShift.break_end) : null;
  const shiftDateIso = todayShift?.date || (clockInDt ? clockInDt.toISODate() : null);

  const shiftDateLabel = clockInDt ? clockInDt.toFormat("ccc, LLL d") : null;
  const shiftStartLabel = clockInDt ? clockInDt.toFormat("HH:mm") : null;
  const shiftEndLabel = clockOutDt ? clockOutDt.toFormat("HH:mm") : null;

  const computeElapsedSeconds = useCallback(
    (shift) => {
      if (!shift?.clock_in) return 0;
      const start = shift.clock_in ? parseShiftDate(shift.clock_in) : null;
      const end = shift.clock_out
        ? parseShiftDate(shift.clock_out)
        : DateTime.now().setZone(shiftTimezone);
      if (!start || !end) return 0;
      let total = Math.max(end.diff(start, "seconds").seconds, 0);
      let breakSeconds = (shift.break_minutes || 0) * 60;
      if (shift.break_start && !shift.break_end) {
        try {
          const breakStart = parseShiftDate(shift.break_start);
          if (breakStart) {
            breakSeconds += Math.max(
              DateTime.now().setZone(shiftTimezone).diff(breakStart, "seconds").seconds,
              0
            );
          }
        } catch {}
      }
      return Math.max(total - breakSeconds, 0);
    },
    [parseShiftDate, shiftTimezone]
  );

  useEffect(() => {
    activeShiftRef.current = todayShift;
    if (!todayShift) {
      setElapsedSeconds(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setElapsedSeconds(computeElapsedSeconds(todayShift));

    if (todayShift.clock_source === "clock" && !todayShift.clock_out) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (activeShiftRef.current) {
          setElapsedSeconds(computeElapsedSeconds(activeShiftRef.current));
        }
      }, 1000);
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [todayShift, computeElapsedSeconds]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    loadTimeSummary();
  }, [loadTimeSummary]);

  const formatElapsed = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [String(hrs).padStart(2, "0"), String(mins).padStart(2, "0"), String(secs).padStart(2, "0")];
    return parts.join(":");
  }, []);
  const formatClockLocal = useCallback(
    (iso, tz) => {
      if (!iso) return "—";
      try {
        return DateTime.fromISO(iso, { zone: "utc" })
          .setZone(tz || shiftTimezone || viewerTimezone)
          .toFormat("LLL d, HH:mm");
      } catch {
        return iso;
      }
    },
    [shiftTimezone, viewerTimezone]
  );

  const getPunchLocationPayload = useCallback(async () => {
    const mode = timeSummary?.policy?.punch_location_mode || "off";
    if (mode !== "optional") return {};
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return { location: { permission_state: "unsupported" } };
    }

    let permissionState = "prompt";
    try {
      if (navigator.permissions?.query) {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        permissionState = permission?.state || permissionState;
      }
    } catch {
      permissionState = "prompt";
    }

    return new Promise((resolve) => {
      const captureStartedAt = Date.now();
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const captureDelayMs = Date.now() - captureStartedAt;
          const coords = position?.coords;
          if (!coords) {
            resolve({ location: { permission_state: "unavailable", capture_delay_ms: captureDelayMs } });
            return;
          }
          const accuracy = Number(coords.accuracy);
          resolve({
            location: {
              lat: coords.latitude,
              lng: coords.longitude,
              accuracy_m: Number.isFinite(accuracy) ? accuracy : undefined,
              captured_at: new Date(position.timestamp || Date.now()).toISOString(),
              permission_state: Number.isFinite(accuracy) && accuracy > 500 ? "weak_accuracy" : "granted",
              capture_delay_ms: captureDelayMs,
            },
          });
        },
        (error) => {
          const captureDelayMs = Date.now() - captureStartedAt;
          const stateByCode = {
            1: "denied",
            2: "unavailable",
            3: "timeout",
          };
          resolve({
            location: {
              permission_state: stateByCode[error?.code] || permissionState || "unavailable",
              capture_delay_ms: captureDelayMs,
            },
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [timeSummary?.policy?.punch_location_mode]);

  const handleClockAction = async (action) => {
    if (!todayShift) return;
    if (action === "out" && canClockOut) {
      const confirmed = window.confirm(
        "Are you sure you want to clock out? Make sure you've finished your tasks."
      );
      if (!confirmed) return;
    }
    setClocking(true);
    setLocationCaptureMessage("");
    try {
      if ((timeSummary?.policy?.punch_location_mode || "off") === "optional") {
        setLocationCaptureMessage("Getting location evidence...");
      }
      const punchPayload = await getPunchLocationPayload();
      if (action === "in") {
        await timeTracking.clockIn(todayShift.id, punchPayload);
        setSnackbar({ open: true, msg: "Clock-in recorded.", error: false });
      } else {
        await timeTracking.clockOut(todayShift.id, punchPayload);
        setSnackbar({ open: true, msg: "Clock-out recorded.", error: false });
      }
      if (punchPayload?.location?.permission_state === "timeout") {
        setLocationCaptureMessage("Location could not be verified in time. Your punch was still recorded.");
      } else {
        setLocationCaptureMessage("");
      }
      await loadShifts();
      await loadTimeSummary();
    } catch (err) {
      setSnackbar({
        open: true,
        error: true,
        msg: err?.response?.data?.error || "Unable to record time.",
      });
    } finally {
      setClocking(false);
    }
  };

  const handleHistoryChange = (key) => (event) => {
    const value = event.target.value;
    setHistoryFilters((prev) => ({ ...prev, [key]: value }));
  };

  const downloadHistoryCsv = async () => {
    try {
      const params = new URLSearchParams({
        start_date: historyFilters.startDate,
        end_date: historyFilters.endDate,
      });
      if (historyFilters.status && historyFilters.status !== "all") {
        params.set("status", historyFilters.status);
      }
      params.set("format", "csv");
      const res = await api.get("/employee/time-history", {
        params: Object.fromEntries(params.entries()),
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `time_history_${historyFilters.startDate}_${historyFilters.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setSnackbar({ open: true, msg: "Unable to download CSV.", error: true });
    }
  };

  const isClocked = todayShift?.clock_source === "clock";
  const isInProgress = isClocked && todayShift?.status === "in_progress";
  const isCompleted = isClocked && ["completed", "approved"].includes(todayShift?.status);
  const isLockedShift = todayShift?.is_locked;
  const canClockIn = todayShift && !isClocked && !isLockedShift;
  const hasClockedOut = isCompleted || Boolean(todayShift?.clock_out_ip);
  const canClockOut = isInProgress && !isLockedShift && !hasClockedOut;
  const breakInProgress = Boolean(todayShift?.break_start && !todayShift?.break_end);
  const breakMinutesLogged = todayShift?.break_minutes || 0;
  const currentBreakMinutes =
    breakInProgress && breakStartDt
      ? Math.max(
          DateTime.now().setZone(shiftTimezone).diff(breakStartDt, "minutes").minutes,
          0
        )
      : 0;
  const totalBreakMinutes = breakMinutesLogged + currentBreakMinutes;
  const requiredBreakMinutes = timeSummary?.policy?.required_break_minutes || 0;
  const breakTargetMinutes =
    requiredBreakMinutes || todayShift?.break_minutes || 15;
  const breakPolicy = todayShift?.break_policy || {};
  const generatedSlot = breakPolicy?.generated_slot;
  const resolvedBreakWindow = useMemo(() => {
    if (generatedSlot?.start && generatedSlot?.end) {
      return { start: generatedSlot.start, end: generatedSlot.end, source: "slot" };
    }
    if (breakPolicy?.window_start && breakPolicy?.window_end) {
      return { start: breakPolicy.window_start, end: breakPolicy.window_end, source: "window" };
    }
    if (breakPolicy?.start_time && breakPolicy?.end_time) {
      return { start: breakPolicy.start_time, end: breakPolicy.end_time, source: "fixed" };
    }
    return null;
  }, [generatedSlot, breakPolicy]);
  const breakWindowLabel = resolvedBreakWindow
    ? `${resolvedBreakWindow.start}–${resolvedBreakWindow.end}`
    : null;
  const breakWindowDescriptor =
    resolvedBreakWindow?.source === "slot" ? "Break slot" : "Break window";
  const breakCountdownMinutes = useMemo(() => {
    if (!breakInProgress || !breakTargetMinutes) return null;
    const remaining = Math.max(Math.round(breakTargetMinutes - currentBreakMinutes), 0);
    return remaining;
  }, [breakInProgress, breakTargetMinutes, currentBreakMinutes]);

  const canStartBreak = useMemo(() => {
    if (!(isInProgress && !breakInProgress && !isCompleted)) return false;
    if (!resolvedBreakWindow || !shiftDateIso) return true;
    try {
      const now = DateTime.now().setZone(shiftTimezone);
      const start = DateTime.fromISO(`${shiftDateIso}T${resolvedBreakWindow.start}`, {
        zone: shiftTimezone,
      });
      const end = DateTime.fromISO(`${shiftDateIso}T${resolvedBreakWindow.end}`, {
        zone: shiftTimezone,
      });
      return now >= start && now <= end;
    } catch {
      return true;
    }
  }, [
    isInProgress,
    breakInProgress,
    isCompleted,
    resolvedBreakWindow,
    shiftTimezone,
    shiftDateIso,
  ]);

  const canEndBreak = isInProgress && breakInProgress && !breakSubmitting;
  const breakCountdownNotice = useMemo(() => {
    if (!todayShift || !resolvedBreakWindow || !shiftDateIso) return null;
    try {
      const start = DateTime.fromISO(`${shiftDateIso}T${resolvedBreakWindow.start}`, {
        zone: shiftTimezone,
      });
      const end = DateTime.fromISO(`${shiftDateIso}T${resolvedBreakWindow.end}`, {
        zone: shiftTimezone,
      });
      if (!start.isValid || !end.isValid) return null;
      const now = DateTime.now().setZone(shiftTimezone);
      if (breakInProgress) {
        const remaining = Math.max(
          Math.round((breakTargetMinutes || 0) - currentBreakMinutes),
          0
        );
        if (!breakTargetMinutes) {
          return null;
        }
        return {
          severity: remaining <= 0 ? "warning" : "info",
          text:
            remaining <= 0
              ? "Break has exceeded the planned duration."
              : `Wrap break in ${remaining}m to stay on schedule.`,
        };
      }
      if (now < start) {
        const minutes = Math.max(Math.round(start.diff(now, "minutes").minutes), 0);
        return {
          severity: minutes <= 5 ? "warning" : "info",
          text:
            minutes <= 0
              ? "Break window opening now."
              : minutes <= 60
              ? `Break opens in ${minutes}m`
              : `Break window begins at ${start.toFormat("HH:mm")}`,
        };
      }
      if (now >= start && now <= end) {
        const remaining = Math.max(Math.round(end.diff(now, "minutes").minutes), 0);
        return {
          severity: remaining <= 5 ? "error" : "warning",
          text: `Break window closes in ${remaining}m`,
        };
      }
      if (!todayShift.break_start && !todayShift.break_end) {
        return {
          severity: "error",
          text: "Break window missed — manager will be notified.",
        };
      }
      return null;
    } catch {
      return null;
    }
  }, [
    todayShift,
    resolvedBreakWindow,
    shiftDateIso,
    shiftTimezone,
    breakInProgress,
    breakTargetMinutes,
    currentBreakMinutes,
    countdownTick,
  ]);
  const timelineMeta = useMemo(() => {
    if (!clockInDt || !clockOutDt) return null;
    try {
      const totalMinutes = Math.max(clockOutDt.diff(clockInDt, "minutes").minutes, 1);
      const now = DateTime.now().setZone(shiftTimezone);
      const elapsedMinutes = Math.min(
        Math.max(now.diff(clockInDt, "minutes").minutes, 0),
        totalMinutes
      );
      const progressPct = Math.min(Math.max((elapsedMinutes / totalMinutes) * 100, 0), 100);
      let breakSegment = null;
      if (breakStartDt) {
        const breakEnd = breakEndDt || breakStartDt.plus({ minutes: todayShift?.break_minutes || 15 });
        const startOffset = Math.max(breakStartDt.diff(clockInDt, "minutes").minutes, 0);
        const endOffset = Math.min(breakEnd.diff(clockInDt, "minutes").minutes, totalMinutes);
        if (endOffset > startOffset) {
          breakSegment = {
            left: (startOffset / totalMinutes) * 100,
            width: Math.max(((endOffset - startOffset) / totalMinutes) * 100, 2),
            inProgress: !breakEndDt,
          };
        }
      }
      const requiredBreak = timeSummary?.policy?.required_break_minutes || 0;
      const needsBreak = requiredBreak && totalMinutes / 60 >= 6;
      const breakDeficit = needsBreak ? Math.max(requiredBreak - totalBreakMinutes, 0) : 0;
      return {
        progressPct,
        breakSegment,
        needsBreak,
        breakDeficit,
      };
    } catch {
      return null;
    }
  }, [
    clockInDt,
    clockOutDt,
    breakStartDt,
    breakEndDt,
    todayShift,
    totalBreakMinutes,
    timeSummary,
    shiftTimezone,
  ]);

const headerStatusLabel = useMemo(() => {
  if (isInProgress) return "On shift · in_progress";
  if (todayShift) return `On shift · ${todayShift.status || "scheduled"}`;
  return "Off shift";
}, [isInProgress, todayShift]);
const headerChipColor = isInProgress ? "primary" : todayShift ? "default" : "default";
const lastUpdatedLabel = useMemo(() => {
  try {
    return lastUpdated.setZone(shiftTimezone || viewerTimezone).toFormat("hh:mm a");
  } catch {
    return null;
  }
}, [lastUpdated, shiftTimezone, viewerTimezone]);

const breakTimelineMeta = useMemo(() => {
  if (!breakStartDt) return null;
  try {
    const target = Math.max(breakTargetMinutes || 15, 5);
    const plannedEnd = breakStartDt.plus({ minutes: target });
    const actualEnd = breakEndDt || plannedEnd;
    const totalMinutes = Math.max(actualEnd.diff(breakStartDt, "minutes").minutes, 1);
    const now = breakEndDt || DateTime.now().setZone(shiftTimezone);
    const elapsed = Math.min(Math.max(now.diff(breakStartDt, "minutes").minutes, 0), totalMinutes);
    return {
      start: breakStartDt,
      targetMinutes: target,
      active: !breakEndDt,
      progressPct: Math.min(Math.max((elapsed / totalMinutes) * 100, 0), 100),
      elapsed,
      totalMinutes,
    };
  } catch {
    return null;
  }
}, [breakStartDt, breakEndDt, breakTargetMinutes, shiftTimezone]);

const polishedWorkspaceSx = employeePolish
  ? {
      maxWidth: 1480,
      mx: "auto",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 2,
    }
  : {};

const polishedPanelSx = employeePolish
  ? {
      borderRadius: 1,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      background: (theme) =>
        theme.palette.mode === "light"
          ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
          : theme.palette.background.paper,
      boxShadow: "0 18px 44px rgba(15, 23, 42, 0.08)",
    }
  : {};

  const handleBreakAction = async (action) => {
    if (!todayShift) return;
    setBreakSubmitting(true);
    try {
      if (action === "start") {
        await timeTracking.startBreak(todayShift.id);
        setSnackbar({ open: true, msg: "Break started.", error: false });
      } else {
        await timeTracking.endBreak(todayShift.id);
        setSnackbar({ open: true, msg: "Break ended.", error: false });
      }
      await loadShifts();
      await loadTimeSummary();
    } catch (err) {
      setSnackbar({
        open: true,
        error: true,
        msg: err?.response?.data?.error || "Unable to record break.",
      });
    } finally {
      setBreakSubmitting(false);
    }
  };

// ───────────────────────────────────────────────────────
  return (
  <>
    <Box sx={polishedWorkspaceSx}>
    <Paper
      elevation={0}
      sx={{
        mb: employeePolish ? 0 : 2,
        p: 3,
        order: employeePolish ? 0 : "initial",
        borderRadius: 1,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        background: (theme) => theme.palette.background.paper,
        ...(employeePolish
          ? {
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.06)",
            }
          : {}),
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            My Time
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your shifts, breaks, and approvals in one view.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            color={headerChipColor}
            label={headerStatusLabel}
            sx={statusChipSx(todayShift?.status, isInProgress)}
          />
          {lastUpdatedLabel && (
            <Typography variant="caption" color="text.secondary">
              Last updated {lastUpdatedLabel} · auto-refreshing
            </Typography>
          )}
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }} useFlexGap flexWrap="wrap">
        {availabilityPolicyLoaded && !hideAvailabilityTab && (
          <Button
            variant={drawerOpen && drawerPanel === "availability" ? "contained" : "outlined"}
            onClick={() => {
              setDrawerPanel("availability");
              setDrawerOpen(true);
            }}
          >
            Shift Availability
          </Button>
        )}
        <Button
          variant={drawerOpen && drawerPanel === "shifts" ? "contained" : "outlined"}
          startIcon={<CalendarMonthIcon />}
          onClick={() => {
            setDrawerPanel("shifts");
            setDrawerOpen(true);
          }}
        >
          View My Shifts
        </Button>
      </Stack>
    </Paper>

    <Paper
      elevation={0}
      sx={{
        mb: employeePolish ? 0 : 2,
        p: employeePolish ? { xs: 2, md: 2.5 } : 3,
        order: employeePolish ? 2 : "initial",
        borderRadius: 1,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        background: (theme) => theme.palette.background.paper,
        ...polishedPanelSx,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
          This week at a glance
        </Typography>
        {summaryLoading && <CircularProgress size={16} />}
      </Stack>
      {summaryMetrics.length ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {summaryMetrics.map((metric) => (
            <Grid item xs={12} sm={4} key={metric.label}>
              <Box
                sx={(theme) => ({
                  p: employeePolish ? 1.75 : 2,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  background: employeePolish
                    ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
                    : theme.palette.background.default,
                  boxShadow: employeePolish ? "0 12px 26px rgba(15, 23, 42, 0.07)" : theme.shadows[1],
                  height: "100%",
                })}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box
                    sx={(theme) => ({
                      width: 36,
                      height: 36,
                      borderRadius: 1,
                      bgcolor: `${theme.palette.primary.main}1f`,
                      color: theme.palette.primary.main,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    })}
                  >
                    {metric.icon || <AccessTimeFilledIcon fontSize="small" />}
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {metric.progressHelper || metric.helper}
                    </Typography>
                  </Box>
                </Stack>
                {metric.progress !== undefined && (
                  <LinearProgress
                    variant="determinate"
                    value={metric.progress}
                    sx={{ mt: 1.5, height: 6, borderRadius: 1 }}
                  />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {summaryLoading ? "Calculating your week..." : "No tracked hours yet this week."}
        </Typography>
      )}
    </Paper>

    <Paper
      elevation={0}
      sx={{
        mb: employeePolish ? 0 : 3,
        p: employeePolish ? { xs: 2, md: 2.5 } : 3,
        order: employeePolish ? 3 : "initial",
        borderRadius: 1,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        background: (theme) => theme.palette.background.paper,
        ...polishedPanelSx,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ textAlign: { xs: "center", sm: "left" } }}
      >
        <Box>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
            Time history
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View past shifts, breaks, and approvals.
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          useFlexGap
          alignItems="center"
          sx={{
            width: { xs: "100%", sm: "auto" },
            ...(employeePolish
              ? {
                  p: 1,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }
              : {}),
          }}
        >
          <ThemedDateField
            size="small"
            label="From"
            value={historyFilters.startDate}
            onChange={handleHistoryChange("startDate")}
            fullWidth={isSmDown}
          />
          <ThemedDateField
            size="small"
            label="To"
            value={historyFilters.endDate}
            onChange={handleHistoryChange("endDate")}
            fullWidth={isSmDown}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={historyFilters.status}
            onChange={handleHistoryChange("status")}
            sx={{ minWidth: { sm: 140 } }}
            fullWidth={isSmDown}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="in_progress">In progress</MenuItem>
          </TextField>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button size="small" variant="outlined" onClick={() => {
              const today = format(new Date(), "yyyy-MM-dd");
              setHistoryFilters((prev) => ({ ...prev, startDate: today, endDate: today }));
            }}>
              Today
            </Button>
            <Button size="small" variant="outlined" onClick={() => {
              const start = format(startOfDay(new Date()), "yyyy-MM-dd");
              const end = format(addDays(startOfDay(new Date()), 6), "yyyy-MM-dd");
              setHistoryFilters((prev) => ({ ...prev, startDate: start, endDate: end }));
            }}>
              This week
            </Button>
            <Button size="small" variant="outlined" onClick={() => {
              const start = format(addDays(startOfDay(new Date()), -7), "yyyy-MM-dd");
              const end = format(addDays(startOfDay(new Date()), -1), "yyyy-MM-dd");
              setHistoryFilters((prev) => ({ ...prev, startDate: start, endDate: end }));
            }}>
              Last week
            </Button>
          </Stack>
          <Button
            variant="outlined"
            onClick={downloadHistoryCsv}
            size="small"
            fullWidth={isSmDown}
          >
            Download CSV
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} mt={2} flexWrap="wrap" useFlexGap>
        <Chip
          label={`Hours: ${historySummary?.hours_worked ?? 0}`}
          variant="outlined"
          color="primary"
        />
        <Chip
          label={`Overtime: ${historySummary?.overtime_hours ?? 0}`}
          variant="outlined"
          color={historySummary?.overtime_hours ? "warning" : "default"}
        />
        <Chip
          label={`Break minutes: ${historySummary?.break_minutes ?? 0}`}
          variant="outlined"
        />
        <Chip
          label={`Missed breaks: ${historySummary?.missed_breaks ?? 0}`}
          variant="outlined"
          color={historySummary?.missed_breaks ? "error" : "default"}
        />
      </Stack>

      {historyError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {historyError}
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        {historyLoading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        ) : historyEntries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No shifts found for this range.
          </Typography>
        ) : (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 1,
              overflow: "hidden",
              ...(employeePolish
                ? {
                    borderColor: "divider",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
                    "& .MuiTableHead-root .MuiTableCell-root": {
                      bgcolor: "action.hover",
                      fontWeight: 800,
                    },
                    "& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)": {
                      bgcolor: "rgba(148, 163, 184, 0.045)",
                    },
                    "& .MuiTableCell-root": {
                      py: 1.25,
                    },
                  }
                : {}),
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Clocked</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Breaks</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyEntries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    hover
                    sx={{ cursor: entry.status === "in_progress" || entry.status === "assigned" ? "pointer" : "default" }}
                    onClick={() => {
                      if (entry.id && (entry.status === "in_progress" || entry.status === "assigned" || entry.status === "pending")) {
                        setOverrideShiftId(entry.id);
                        setTodayCardCollapsed(false);
                      }
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={600}>{entry.date}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.period_label || ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        In: {formatClockLocal(entry.clock_in, entry.timezone)}
                      </Typography>
                      <Typography variant="body2">
                        Out: {formatClockLocal(entry.clock_out, entry.timezone)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.clock_in_ip ? `IP: ${entry.clock_in_ip}` : ""}
                      </Typography>
                    </TableCell>
                    <TableCell>{entry.hours_worked_rounded ?? entry.hours_worked}h</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`${entry.break_minutes || 0}m`}
                        color={entry.break_non_compliant ? "error" : "default"}
                        variant={entry.break_non_compliant ? "filled" : "outlined"}
                      />
                      {entry.break_missing_minutes > 0 && (
                        <Typography variant="caption" color="error.main" sx={{ display: "block" }}>
                          Missing {entry.break_missing_minutes}m
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={entry.status || "—"} color={statusColor[entry.status] || "default"} variant="outlined" />
                      {entry.approved_by_name && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          By {entry.approved_by_name}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Paper>
    <Paper
      elevation={0}
      sx={{
        mb: employeePolish ? 0 : 3,
        p: employeePolish ? { xs: 2.25, md: 3 } : 3,
        order: employeePolish ? 1 : "initial",
        borderRadius: 1,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        background: (theme) => theme.palette.background.paper,
        ...(employeePolish
          ? {
              borderColor: (theme) => `${theme.palette.primary.main}55`,
              background: (theme) =>
                `radial-gradient(circle at top right, ${theme.palette.primary.main}16, transparent 34%), linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
              boxShadow: "0 22px 52px rgba(15, 23, 42, 0.1)",
            }
          : {}),
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
      >
        <Stack spacing={0.25} sx={{ textAlign: { xs: "center", sm: "left" } }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "center", sm: "flex-start" }}>
            <Typography variant="h6" fontWeight={700}>
              Today’s shift
            </Typography>
            {todayShift && (
              <Chip
                size="small"
                color={isLockedShift ? "success" : isInProgress ? "primary" : "default"}
                label={todayShift.status}
                icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "currentColor" }} />}
                sx={statusChipSx(todayShift.status, isInProgress)}
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Your live clock, break window, and shift timeline.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={todayCardCollapsed ? "Expand shift card" : "Collapse shift card"}>
            <IconButton size="small" onClick={() => setTodayCardCollapsed((prev) => !prev)}>
              {todayCardCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Collapse in={!todayCardCollapsed} timeout="auto">
        <Box mt={2}>
          {todayShift ? (
            <>
              <Typography
                variant={employeePolish ? "h5" : "h6"}
                fontWeight={700}
                sx={{ textAlign: { xs: "center", sm: "left" } }}
              >
                {shiftDateLabel} · {shiftStartLabel} – {shiftEndLabel}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: { xs: "center", sm: "left" } }}
              >
                {isClocked
                  ? `Clocked in: ${clockInDt?.toFormat("HH:mm")}${
                      breakInProgress && breakStartDt ? ` • On break since: ${breakStartDt.toFormat("HH:mm")}` : ""
                    }${isCompleted && clockOutDt ? ` • Clocked out: ${clockOutDt.toFormat("HH:mm")}` : ""}`
                  : "Not clocked in yet."}
              </Typography>
              {isClocked && (
                <Typography variant="body2" color="text.secondary">
                  Time on shift: {formatElapsed(elapsedSeconds)}
                </Typography>
              )}
              {resolvedBreakWindow && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mt: 1 }}
                  useFlexGap
                  flexWrap="wrap"
                >
                  <Chip
                    size="small"
                    color="info"
                    label={`${breakWindowDescriptor}: ${breakWindowLabel}`}
                  />
                  {!canStartBreak && !breakInProgress && isInProgress && (
                    <Typography variant="caption" color="warning.main">
                      Break opens at {resolvedBreakWindow.start}
                    </Typography>
                  )}
                </Stack>
              )}
              {breakCountdownNotice && (
                <Alert
                  severity={breakCountdownNotice.severity}
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  {breakCountdownNotice.text}
                </Alert>
              )}
              {isLockedShift && (
                <Chip
                  size="small"
                  color="success"
                  label="Approved / locked"
                  sx={{ width: "fit-content", mt: 1 }}
                />
              )}
              {timelineMeta && (
                <Box mt={2} sx={{ textAlign: { xs: "center", sm: "left" } }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 0.4, textTransform: "uppercase" }}>
                      Shift timeline
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(timelineMeta.progressPct)}% through shift
                    </Typography>
                  </Stack>
                  <Box
                    sx={(theme) => ({
                      position: "relative",
                      height: employeePolish ? 14 : 10,
                      borderRadius: 1,
                      background: employeePolish
                        ? `linear-gradient(90deg, ${theme.palette.action.hover}, ${theme.palette.background.default})`
                        : theme.palette.action.hover,
                      mt: 0.5,
                      border: employeePolish ? `1px solid ${theme.palette.divider}` : "none",
                      overflow: "hidden",
                    })}
                  >
                    <Box
                      sx={(theme) => ({
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: `${timelineMeta.progressPct}%`,
                        borderRadius: 1,
                        background: employeePolish
                          ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`
                          : theme.palette.primary.main,
                      })}
                    />
                    {timelineMeta.breakSegment && (
                      <Box
                        sx={(theme) => ({
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: `${timelineMeta.breakSegment.left}%`,
                          width: `${timelineMeta.breakSegment.width}%`,
                          borderRadius: 1,
                          background: theme.palette.warning.light,
                          opacity: 0.9,
                        })}
                      />
                    )}
                    <Box
                      sx={(theme) => ({
                        position: "absolute",
                        top: employeePolish ? -5 : -4,
                        width: employeePolish ? 10 : 8,
                        height: employeePolish ? 22 : 18,
                        borderRadius: 1,
                        left: `calc(${timelineMeta.progressPct}% - 4px)`,
                        background: theme.palette.text.primary,
                        boxShadow: employeePolish ? "0 0 0 3px rgba(255,255,255,0.72)" : "none",
                      })}
                    />
                  </Box>
                  <Stack direction="row" justifyContent="space-between" mt={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      {shiftStartLabel}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {DateTime.now().setZone(shiftTimezone).toFormat("HH:mm")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {shiftEndLabel}
                    </Typography>
                  </Stack>
                  {timelineMeta.needsBreak && (
                    <Chip
                      size="small"
                      color={timelineMeta.breakDeficit > 0 ? "error" : "success"}
                      variant={timelineMeta.breakDeficit > 0 ? "filled" : "outlined"}
                      label={
                        timelineMeta.breakDeficit > 0
                          ? `Break overdue · ${timelineMeta.breakDeficit}m required`
                          : `Break compliant (${formatBreakMinutesLabel(totalBreakMinutes, true)} logged)`
                      }
                      sx={{ mt: 1, width: "fit-content" }}
                    />
                  )}
                </Box>
              )}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                mt={2}
              >
                <Button
                  variant="contained"
                  disabled={!canClockIn || clocking}
                  onClick={() => handleClockAction("in")}
                  fullWidth={isSmDown}
                  sx={employeePolish ? { minHeight: 42, px: 3, fontWeight: 800 } : undefined}
                >
                  Clock In
                </Button>
                <Tooltip
                  title={
                    !canClockOut
                      ? hasClockedOut
                        ? "Already clocked out for this shift."
                        : "Clock out becomes available after you clock in and the shift is active."
                      : ""
                  }
                  arrow
                >
                  <span>
                    <Button
                      variant="outlined"
                      color="secondary"
                      disabled={!canClockOut || clocking}
                      onClick={() => handleClockAction("out")}
                      fullWidth={isSmDown}
                      sx={employeePolish ? { minHeight: 42, px: 3, fontWeight: 800 } : undefined}
                    >
                      Clock Out
                    </Button>
                  </span>
                </Tooltip>
              {isClocked && !isInProgress && !isCompleted && (
                <Chip label={todayShift.status} size="small" sx={statusChipSx(todayShift.status)} />
              )}
              </Stack>
              {locationCaptureMessage && (
                <Alert severity={locationCaptureMessage.includes("could not") ? "warning" : "info"} sx={{ mt: 1 }}>
                  {locationCaptureMessage}
                </Alert>
              )}
              {isInProgress && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  mt={1}
                >
                  <Button
                    variant={canStartBreak ? "outlined" : "text"}
                    size="small"
                    onClick={() => handleBreakAction("start")}
                    disabled={!canStartBreak || breakSubmitting}
                    fullWidth={isSmDown}
                  >
                    Start Break
                  </Button>
                  <Button
                    variant={canEndBreak ? "contained" : "text"}
                    size="small"
                    color="warning"
                    onClick={() => handleBreakAction("end")}
                    disabled={!canEndBreak}
                    fullWidth={isSmDown}
                  >
                    End Break
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Breaks logged: {formatBreakMinutesLabel(totalBreakMinutes)} {todayShift?.break_paid ? "(paid)" : "(unpaid)"}
                  </Typography>
                </Stack>
              )}
            {breakTimelineMeta && (
              <Box mt={2}>
                <Box
                  sx={(theme) => ({
                    p: 2,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.mode === "light" ? theme.palette.grey[50] : theme.palette.background.default,
                  })}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">Break</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {breakTimelineMeta.active && typeof breakCountdownMinutes === "number"
                        ? breakCountdownMinutes > 0
                          ? `${breakCountdownMinutes}m remaining`
                          : "Wrap up now"
                        : `${breakTimelineMeta.totalMinutes}m logged`}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    Started {breakTimelineMeta.start.toFormat("HH:mm")} · Target {breakTimelineMeta.targetMinutes}m
                  </Typography>
                <Box
                  sx={{
                    position: "relative",
                    mt: 1,
                    height: 8,
                    borderRadius: 1,
                    background: (theme) => theme.palette.action.hover,
                    }}
                  >
                    <Box
                      sx={(theme) => ({
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: `${breakTimelineMeta.progressPct}%`,
                        borderRadius: 1,
                        background: breakTimelineMeta.active
                          ? theme.palette.warning.main
                          : theme.palette.success.main,
                        transition: "width 0.2s ease",
                      })}
                    />
                  </Box>
                </Box>
              </Box>
            )}
          </>
        ) : (
            <Typography variant="body2" color="text.secondary">
              No shift scheduled today. Upcoming shifts will appear here for quick clock actions.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
    </Box>
    
    {/* Manager-only toggle for approvals */}
    {isManager && (
      <Button
        variant="outlined"
        color={showSwapApprovals ? "secondary" : "primary"}
        onClick={() => setShowSwapApprovals(!showSwapApprovals)}
        sx={{ mb: 2, ml: 1 }}
      >
        {showSwapApprovals ? "Hide" : "Show"} Swap Approvals
      </Button>
    )}

    {/* ─────────────── Drawer ─────────────── */}
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      PaperProps={{ sx: { width: { xs: "100%", sm: 500, md: 560 }, p: 0 } }}
    >
      {/* Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          bgcolor: "background.paper",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {drawerPanel === "availability" && availabilityPolicyLoaded && !hideAvailabilityTab ? "Shift Availability" : "My Shifts"}
        </Typography>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pt: 2 }}>
        <ToggleButtonGroup
          size="small"
          value={drawerPanel}
          exclusive
          fullWidth
          onChange={(_, v) => v && (!hideAvailabilityTab || v !== "availability") && setDrawerPanel(v)}
        >
          {availabilityPolicyLoaded && !hideAvailabilityTab && (
            <ToggleButton value="availability">Shift Availability</ToggleButton>
          )}
          <ToggleButton value="shifts">My Shifts</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {availabilityPolicyLoaded && drawerPanel === "availability" && !hideAvailabilityTab ? (
        <Box sx={{ p: 2, pt: 1.5, overflowY: "auto" }}>
          <SmartShiftAvailabilityTab />
        </Box>
      ) : (
        <>

      {/*  ➤ Opt-out toggle */}
      <FormControlLabel
        sx={{ mt: 2, px: 2 }}
        control={
          <Switch
            checked={optOut}
            onChange={async (e) => {
              const val = e.target.checked;
              setOptOut(val);
              try {
                await api.put(
                  `/employee/swap-opt-out`,
                  { opt_out: val },
                  { headers: authHeader }
                );
              } catch {
                setOptOut(!val); // rollback
                setSnackbar({
                  open: true,
                  msg: "Failed to save preference.",
                  error: true,
                });
              }
            }}
          />
        }
        label="Hide my shifts from swap offers"
      />

      {/* “My Swaps” toggle (non-managers) */}
      <Box sx={{ px: 2, mt: 2 }}>
        <ToggleButtonGroup
          size="small"
          value={showMySwapRequests ? "swaps" : "shifts"}
          exclusive
          onChange={(_, v) => {
            if (!v) return;
            setShowMySwapRequests(v === "swaps");
          }}
          fullWidth
        >
          <ToggleButton value="shifts">Shifts</ToggleButton>
          <ToggleButton value="swaps">My swap requests</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ px: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} flexWrap="wrap" useFlexGap>
          <Button size="small" variant="outlined" onClick={() => {
            const today = new Date();
            setShiftRange({ startDate: format(addDays(today, -7), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") });
          }}>
            Past 7 days
          </Button>
          <Button size="small" variant="outlined" onClick={() => {
            const today = new Date();
            setShiftRange({ startDate: format(today, "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") });
          }}>
            Today
          </Button>
          <Button size="small" variant="outlined" onClick={() => {
            const today = new Date();
            setShiftRange({ startDate: format(today, "yyyy-MM-dd"), endDate: format(addDays(today, 7), "yyyy-MM-dd") });
          }}>
            Next 7 days
          </Button>
          <ThemedDateField
            size="small"
            label="From"
            value={shiftRange.startDate}
            onChange={(value) => setShiftRange((prev) => ({ ...prev, startDate: value }))}
          />
          <ThemedDateField
            size="small"
            label="To"
            value={shiftRange.endDate}
            onChange={(value) => setShiftRange((prev) => ({ ...prev, endDate: value }))}
          />
        </Stack>
      </Box>

      <Box sx={{ px: 2, mb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => openLeaveForm(null)}
        >
          Request time off
        </Button>
      </Box>

      {/* Shifts list, loading & error blocks */}
      {showMySwapRequests ? (
        <Box sx={{ px: 2 }}>
          {pendingSwaps.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No swap requests yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {pendingSwaps.map((sw) => (
                <Paper
                  key={sw.id}
                  variant="outlined"
                  sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body2">
                    #{sw.id} → Shift {sw.target_shift_id} ({sw.status})
                  </Typography>
                  {sw.status === "pending" && sw.is_requester && (
                    <Button size="small" color="error" onClick={() => cancelSwap(sw.id)}>
                      Cancel
                    </Button>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      ) : loading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : errorMsg ? (
        <Typography color="error" sx={{ px: 2 }}>{errorMsg}</Typography>
      ) : shifts.length === 0 ? (
        <Typography sx={{ px: 2 }}>No shifts assigned yet.</Typography>
      ) : (
        <>
        <Box sx={{ px: 2 }}>
        <Grid container spacing={2}>
          {pagedShifts.map((shift) => {
            const hasTimes = Boolean(shift.clock_in && shift.clock_out);
            const start = hasTimes ? parseISO(shift.clock_in) : null;
            const end = hasTimes ? parseISO(shift.clock_out) : null;
            const disabledSwap =
              shift.is_locked || shift.swap_status === "pending";
            const shiftDateKey = shift.date || (hasTimes ? format(start, "yyyy-MM-dd") : null);
            const dateLeaves = shiftDateKey ? leavesByDate[shiftDateKey] || [] : [];
            const breakMeta = (() => {
              if (!hasTimes) return null;
              const paidTag = shift.break_paid === true ? "paid" : "unpaid";
              const autoTag = shift.break_auto_enforced ? "Auto-enforced" : null;
              if (shift.break_start && shift.break_end) {
                const bs = parseISO(shift.break_start);
                const be = parseISO(shift.break_end);
                return {
                  label: `Break window: ${format(bs, "HH:mm")}–${format(be, "HH:mm")} (${paidTag})`,
                  tooltip: ["Policy: scheduled window", autoTag].filter(Boolean).join(" · "),
                };
              }
              const policy = shift.break_policy || {};
              const slot = policy.generated_slot || {};
              const windowStart = slot.start || policy.window_start || policy.start_time;
              const windowEnd = slot.end || policy.window_end || policy.end_time;
              if (windowStart && windowEnd) {
                const source = slot.start && slot.end ? "auto window" : "policy window";
                return {
                  label: `Break window: ${windowStart}–${windowEnd}`,
                  tooltip: ["Policy: " + source, autoTag].filter(Boolean).join(" · "),
                };
              }
              if (shift.break_minutes) {
                return {
                  label: `Break: ${shift.break_minutes}m (${paidTag})`,
                  tooltip: ["Policy: minutes only", autoTag].filter(Boolean).join(" · "),
                };
              }
              return null;
            })();

            return (
              <Grid item xs={12} key={shift.id}>
                <Card elevation={2} sx={{ borderRadius: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {shift.date
                        ? format(parseISO(shift.date), "EEE, MMM d")
                        : hasTimes
                        ? format(start, "EEE, MMM d")
                        : "—"}
                    </Typography>

                    <Typography variant="body1" fontWeight="bold">
                      {shift.on_leave || !hasTimes
                        ? "On Leave"
                        : `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`}
                    </Typography>
                    {breakMeta && !shift.on_leave && (
                      <Tooltip title={breakMeta.tooltip || ""}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          {breakMeta.label}
                        </Typography>
                      </Tooltip>
                    )}

                    {/* Chips */}
                    {shift.on_leave && (
                      <Chip
                        label={`Leave: ${shift.leave_type}${
                          shift.leave_subtype
                            ? ` – ${shift.leave_subtype}`
                            : ""
                        } (${shift.leave_status})`}
                        color={
                          shift.leave_status === "approved"
                            ? "success"
                            : shift.leave_status === "pending"
                            ? "warning"
                            : "error"
                        }
                        size="small"
                        sx={leaveChipSx(shift.leave_status)}
                      />
                    )}
                    {dateLeaves.map((leave) => {
                      const status = (leave.leave_status || "approved").toLowerCase();
                      const color =
                        status === "approved"
                          ? "success"
                          : status === "pending"
                          ? "warning"
                          : "error";
                      return (
                        <Chip
                          key={leave.id}
                          label={`Leave: ${leave.leave_type || "Leave"}${
                            leave.leave_subtype ? ` – ${leave.leave_subtype}` : ""
                          } (${status})`}
                          color={color}
                          size="small"
                          sx={{ ...leaveChipSx(status)(theme), mt: 1, mr: 1 }}
                        />
                      );
                    })}
                    {swapStatusChip(shift)}
                    {shift.break_missing_minutes > 0 && (
                      <Chip
                        label={`Missing ${shift.break_missing_minutes}m`}
                        color={shift.break_missing_minutes > 10 ? "error" : "warning"}
                        size="small"
                        sx={{ mt: 1, mr: 1 }}
                      />
                    )}
                    {durationChip(shift) && (
                      <Chip
                        label={durationChip(shift)}
                        size="small"
                        sx={{ ...readableLightChipSx(theme), mt: 1 }}
                      />
                    )}
                    {fieldPhotoSummaries[shift.id]?.count > 0 && (
                      <Chip
                        label={`${fieldPhotoSummaries[shift.id].count} photo${fieldPhotoSummaries[shift.id].count === 1 ? "" : "s"} uploaded`}
                        size="small"
                        icon={<UploadFileIcon />}
                        sx={{ ...readableLightChipSx(theme), mt: 1, ml: 1 }}
                      />
                    )}
                    {fieldPhotoSummaries[shift.id]?.latest_uploaded_at && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                        Last photo: {format(parseISO(fieldPhotoSummaries[shift.id].latest_uploaded_at), "MMM d, h:mm a")}
                      </Typography>
                    )}

                    {/* Action buttons */}
                    {!shift.on_leave && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mt: 1, mr: 1 }}
                          onClick={() => openLeaveForm(shift)}
                        >
                          Request Leave
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ mt: 1 }}
                          onClick={() => openSwapModal(shift)}
                          disabled={disabledSwap}
                        >
                          Request Swap
                        </Button>
                        {disabledSwap && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            Shift finalised
                          </Typography>
                        )}
                        {canUploadFieldPhotoForShift(shift) && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<UploadFileIcon />}
                            sx={{ mt: 1, ml: { xs: 0, sm: 1 } }}
                            onClick={() => openFieldPhotoUpload(shift)}
                          >
                            Upload Photos
                          </Button>
                        )}
                        {fieldPhotosStatus?.addon_active && !fieldPhotosStatus?.upload_enabled && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                            {fieldPhotosStatus?.read_only
                              ? "Photo uploads are currently unavailable. Please contact your manager."
                              : "Photo uploads are temporarily unavailable. Please contact your manager."}
                          </Typography>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        </Box>
        {shiftRows.length > pageSize && (
          <Stack alignItems="center" sx={{ mt: 2, px: 2 }}>
            <Pagination
              color="primary"
              size="small"
              page={shiftPage}
              count={shiftPageCount}
              onChange={(_, page) => setShiftPage(page)}
            />
          </Stack>
        )}
        {shifts.some((s) => s.on_leave || s.is_leave_entry) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 2 }}>
              Leave
            </Typography>
            <Box sx={{ px: 2 }}>
            <Grid container spacing={2}>
              {pagedLeaves.map((shift) => (
                <Grid item xs={12} key={shift.id}>
                  <Card
                    elevation={2}
                    sx={{
                      borderRadius: 1,
                      borderLeft: "4px solid",
                      borderColor: (theme) => theme.palette.success.main,
                    }}
                  >
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        {shift.date
                          ? format(parseISO(shift.date), "EEE, MMM d")
                          : "—"}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        On Leave
                      </Typography>
                      {(() => {
                        const status = (shift.leave_status || "approved").toLowerCase();
                        const color =
                          status === "approved"
                            ? "success"
                            : status === "pending"
                            ? "warning"
                            : "error";
                        return (
                          <Chip
                            label={`Leave: ${shift.leave_type || "Leave"}${
                              shift.leave_subtype ? ` – ${shift.leave_subtype}` : ""
                            } (${status})`}
                            color={color}
                            size="small"
                            sx={{ ...leaveChipSx(status)(theme), mt: 1 }}
                          />
                        );
                      })()}
                    </CardContent>
                    </Card>
                </Grid>
              ))}
            </Grid>
            </Box>
            {leaveRows.length > pageSize && (
              <Stack alignItems="center" sx={{ mt: 2, px: 2 }}>
                <Pagination
                  color="primary"
                  size="small"
                  page={leavePage}
                  count={leavePageCount}
                  onChange={(_, page) => setLeavePage(page)}
                />
              </Stack>
            )}
          </>
        )}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={900}>
                My leave balances
              </Typography>
              <Typography variant="caption" color="text.secondary">
                A self-serve view of your current paid leave balance, eligibility, and expected accrual signals. Payroll calculations stay separate.
              </Typography>
            </Box>
            <Button size="small" onClick={loadEmployeeLeaveBalances} disabled={leaveBalancesLoading}>
              Refresh
            </Button>
          </Stack>
          <Alert severity="info" variant="outlined" sx={{ mb: 1.25 }}>
            Before requesting paid leave, check whether the leave type is balance-managed and whether you are eligible on the leave start date.
          </Alert>
          {leaveBalancesLoading ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={22} />
            </Box>
          ) : (
            <Grid container spacing={1.25}>
              {employeeLeaveBalances.balances.map((balance) => (
                <Grid item xs={12} sm={6} key={balance.leave_type}>
                  <Paper
                    variant="outlined"
                    sx={balanceCardSx(balanceCardTone(balance))}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2" fontWeight={900}>
                            {balance.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatPolicySummaryText(balance)}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={balance.balance_managed ? "info" : "default"}
                          label={balance.balance_managed ? "Tracked" : "Manual"}
                          sx={{ fontWeight: 800 }}
                        />
                      </Stack>

                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Remaining hours</Typography>
                          <Typography variant="h6" fontWeight={900}>{formatBalanceHours(balance.balance_hours)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Days equivalent</Typography>
                          <Typography variant="h6" fontWeight={900}>
                            {balance.days_equivalent != null ? `${Number(balance.days_equivalent).toFixed(2)}d` : "—"}
                          </Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        <Chip
                          size="small"
                          color={balance.eligible_now === false ? "warning" : "success"}
                          variant="outlined"
                          label={balance.eligible_now === false ? "Eligibility pending" : "Eligible now"}
                          sx={{ fontWeight: 800 }}
                        />
                        {balance.next_expected_accrual_hours ? (
                          <Chip
                            size="small"
                            color="primary"
                            variant="outlined"
                            label={`Next accrual +${formatBalanceHours(balance.next_expected_accrual_hours)}${balance.next_expected_accrual_date ? ` · ${balance.next_expected_accrual_date}` : ""}`}
                            sx={{ fontWeight: 800 }}
                          />
                        ) : (
                          <Chip size="small" variant="outlined" label="No scheduled accrual shown" />
                        )}
                      </Stack>

                      {balance.eligibility_date && (
                        <Typography variant="caption" color={balance.eligible_now === false ? "warning.main" : "text.secondary"} sx={{ fontWeight: balance.eligible_now === false ? 800 : 500 }}>
                          {balance.eligible_now === false ? `You become eligible on ${balance.eligibility_date}.` : `Eligibility date: ${balance.eligibility_date}.`}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Leave requests
            </Typography>
            <Button size="small" onClick={loadEmployeeLeaveRequests}>
              Refresh
            </Button>
          </Stack>
          {leaveHistoryLoading ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={22} />
            </Box>
          ) : employeeLeaveRequests.length === 0 ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                No leave requests yet.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted time-off requests will appear here with status, approved hours, manager comments, and any supporting document.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1}>
              {employeeLeaveRequests.map((leave) => {
                const status = String(leave.status || "pending").toLowerCase();
                const statusColor =
                  status === "approved"
                    ? "success"
                    : status === "pending"
                    ? "warning"
                    : status === "withdrawn" || status === "cancelled"
                    ? "default"
                    : "error";
                return (
                  <Paper key={leave.id} variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
                    <Stack spacing={0.75}>
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="body2" fontWeight={800}>
                          {leave.leave_type}
                          {leave.leave_subtype ? ` · ${leave.leave_subtype}` : ""}
                        </Typography>
                        <Chip size="small" color={statusColor} label={status} sx={statusChipSx(status)} />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={leave.is_paid_leave ? "Paid leave" : "Unpaid leave"}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Dates: {leave.start_date || "—"}
                        {leave.end_date && leave.end_date !== leave.start_date ? ` → ${leave.end_date}` : ""}
                        {" · "}
                        Duration: {formatLeaveDurationMode(leave.duration_mode)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatLeaveHours(leave) || (String(leave.status || "").toLowerCase() === "approved" ? "Approved; payroll hours not confirmed" : "Manager must confirm payroll-ready hours")}
                      </Typography>
                      {leave.balance_impact?.balance_managed && (
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            color={balanceImpactSeverity(leave.balance_impact)}
                            variant="outlined"
                            label={balancePolicyActionLabel(leave.balance_impact.policy_action)}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Projected balance: {formatBalanceHours(leave.balance_impact.projected_balance_hours)}
                          </Typography>
                        </Stack>
                      )}
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Chip
                          size="small"
                          icon={<UploadFileIcon />}
                          variant="outlined"
                          label={attachmentLabel(normalizeLeaveAttachment(leave))}
                        />
                      </Stack>
                      {leave.review_comment && (
                        <Typography variant="caption" color="text.secondary">
                          Manager comment: {leave.review_comment}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openEmployeeLeaveDetail(leave)}
                        >
                          Details
                        </Button>
                        {canWithdrawEmployeeLeave(leave) && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => withdrawLeaveRequest(leave.id)}
                          >
                            Withdraw
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
        </>
      )}

      {/* Incoming requests (non-manager) */}
      {!isManager && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Incoming Swap Requests
          </Typography>
          <IncomingSwapRequests token={token} />
        </>
      )}
        </>
      )}
    </Drawer>

      <Drawer
        anchor="right"
        open={Boolean(selectedEmployeeLeave)}
        onClose={() => setSelectedEmployeeLeave(null)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 420 }, p: 2 } }}
      >
        {selectedEmployeeLeave && (
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6">Leave request details</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedEmployeeLeave.leave_type}
                  {selectedEmployeeLeave.leave_subtype ? ` · ${selectedEmployeeLeave.leave_subtype}` : ""}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelectedEmployeeLeave(null)} aria-label="Close leave details">
                <CloseIcon />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                color={
                  selectedEmployeeLeave.status === "approved"
                    ? "success"
                    : selectedEmployeeLeave.status === "pending"
                    ? "warning"
                    : selectedEmployeeLeave.status === "rejected"
                    ? "error"
                    : "default"
                }
                label={selectedEmployeeLeave.status || "pending"}
                sx={statusChipSx(selectedEmployeeLeave.status)}
              />
              <Chip
                size="small"
                variant="outlined"
                label={selectedEmployeeLeave.is_paid_leave ? "Paid leave" : "Unpaid leave"}
              />
              {selectedEmployeeLeave.payroll_ready && (
                <Chip size="small" color="success" variant="outlined" label="Ready for payroll" />
              )}
            </Stack>

            <Alert severity="info" variant="outlined">
              Ready for payroll means your manager has confirmed the approved hours for payroll. Uploading a supporting document does not change approval or payroll status.
            </Alert>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
              <Stack spacing={0.75}>
                <Typography variant="body2">
                  <strong>Dates:</strong> {selectedEmployeeLeave.start_date || "—"}
                  {selectedEmployeeLeave.end_date && selectedEmployeeLeave.end_date !== selectedEmployeeLeave.start_date
                    ? ` → ${selectedEmployeeLeave.end_date}`
                    : ""}
                </Typography>
                <Typography variant="body2">
                  <strong>Duration:</strong> {formatLeaveDurationMode(selectedEmployeeLeave.duration_mode)}
                </Typography>
                {selectedEmployeeLeave.start_time || selectedEmployeeLeave.end_time ? (
                  <Typography variant="body2">
                    <strong>Time:</strong> {selectedEmployeeLeave.start_time || "—"} – {selectedEmployeeLeave.end_time || "—"}
                  </Typography>
                ) : null}
                <Typography variant="body2">
                  <strong>Requested hours:</strong> {selectedEmployeeLeave.requested_hours ? `${selectedEmployeeLeave.requested_hours}h` : "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Approved hours:</strong> {selectedEmployeeLeave.approved_hours ? `${selectedEmployeeLeave.approved_hours}h` : "—"}
                </Typography>
                {!selectedEmployeeLeave.approved_hours && (
                  <Typography variant="caption" color="text.secondary">
                    Approved hours may stay blank until a manager reviews or confirms the request.
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Reason:</strong> {selectedEmployeeLeave.reason || "—"}
                </Typography>
              </Stack>
            </Paper>

            {selectedEmployeeLeave.balance_impact && (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="subtitle2" fontWeight={800}>
                      Balance impact
                    </Typography>
                    <Chip
                      size="small"
                      color={balanceImpactSeverity(selectedEmployeeLeave.balance_impact)}
                      variant="outlined"
                      label={balancePolicyActionLabel(selectedEmployeeLeave.balance_impact.policy_action)}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    This is HR balance tracking only. Payroll status is handled separately by manager review.
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">Current balance</Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {formatBalanceHours(selectedEmployeeLeave.balance_impact.current_balance_hours)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Requested</Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {formatBalanceHours(selectedEmployeeLeave.balance_impact.requested_hours)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Projected</Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {formatBalanceHours(selectedEmployeeLeave.balance_impact.projected_balance_hours)}
                      </Typography>
                    </Box>
                  </Box>
                  {Number(selectedEmployeeLeave.balance_impact.insufficient_hours || 0) > 0 && (
                    <Typography variant="body2">
                      Insufficient balance: {formatBalanceHours(selectedEmployeeLeave.balance_impact.insufficient_hours)}
                    </Typography>
                  )}
                  {selectedEmployeeLeave.balance_impact.message && (
                    <Alert severity={balanceImpactSeverity(selectedEmployeeLeave.balance_impact)} variant="outlined">
                      {selectedEmployeeLeave.balance_impact.message}
                    </Alert>
                  )}
                </Stack>
              </Paper>
            )}

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>
                    Supporting document
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {attachmentLabel(selectedEmployeeLeave.attachment)}
                  </Typography>
                  {canEmployeeUploadLeaveAttachment(selectedEmployeeLeave) && (
                    <Typography variant="caption" color="text.secondary">
                      {selectedEmployeeLeave.status === "approved"
                        ? "This leave is already approved. Uploading a supporting document will not change approval or payroll status."
                        : "One document can be attached while this request is pending."}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedEmployeeLeave.attachment?.present && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      disabled={leaveAttachmentBusy}
                      onClick={() => downloadEmployeeLeaveAttachment(selectedEmployeeLeave)}
                    >
                      Download document
                    </Button>
                  )}
                  {canEmployeeUploadLeaveAttachment(selectedEmployeeLeave) && (
                    <Button
                      size="small"
                      variant={selectedEmployeeLeave.attachment?.present ? "outlined" : "contained"}
                      startIcon={<UploadFileIcon />}
                      component="label"
                      disabled={leaveAttachmentBusy}
                    >
                      {selectedEmployeeLeave.attachment?.present ? "Replace document" : "Upload document"}
                      <input
                        hidden
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) uploadEmployeeLeaveAttachment(selectedEmployeeLeave, file);
                        }}
                      />
                    </Button>
                  )}
                  {canEmployeeDeleteLeaveAttachment(selectedEmployeeLeave) && selectedEmployeeLeave.attachment?.present && (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteOutlineIcon />}
                      disabled={leaveAttachmentBusy}
                      onClick={() => deleteEmployeeLeaveAttachment(selectedEmployeeLeave)}
                    >
                      Remove document
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
              <Stack spacing={0.75}>
                <Typography variant="body2">
                  <strong>Manager comment:</strong> {selectedEmployeeLeave.review_comment || "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Reviewed by:</strong> {selectedEmployeeLeave.reviewer_name || "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Reviewed at:</strong> {selectedEmployeeLeave.reviewed_at ? format(parseISO(selectedEmployeeLeave.reviewed_at), "yyyy-MM-dd HH:mm") : "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Submitted:</strong> {selectedEmployeeLeave.created_at ? format(parseISO(selectedEmployeeLeave.created_at), "yyyy-MM-dd HH:mm") : "—"}
                </Typography>
                {selectedEmployeeLeave.withdrawn_at && (
                  <Typography variant="body2">
                    <strong>Withdrawn:</strong> {format(parseISO(selectedEmployeeLeave.withdrawn_at), "yyyy-MM-dd HH:mm")}
                  </Typography>
                )}
                {selectedEmployeeLeave.cancelled_at && (
                  <Typography variant="body2">
                    <strong>Cancelled:</strong> {format(parseISO(selectedEmployeeLeave.cancelled_at), "yyyy-MM-dd HH:mm")}
                  </Typography>
                )}
                {selectedEmployeeLeave.cancel_reason && (
                  <Typography variant="body2">
                    <strong>Cancel reason:</strong> {selectedEmployeeLeave.cancel_reason}
                  </Typography>
                )}
              </Stack>
            </Paper>

            {canWithdrawEmployeeLeave(selectedEmployeeLeave) && (
              <Button
                color="error"
                variant="outlined"
                onClick={() => withdrawLeaveRequest(selectedEmployeeLeave.id)}
              >
                Withdraw request
              </Button>
            )}
          </Stack>
        )}
      </Drawer>

      {/* Leave dialog */}
      <Dialog
        fullScreen={isSmDown}
        open={leaveModalOpen}
        onClose={() => {
          setLeaveModalOpen(false);
          setLeaveFormError("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedShift ? "Request leave for shift" : "Request time off"}</DialogTitle>
        <DialogContent>
          {selectedShift && (
            <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
              This request is linked to the selected shift. Use “Request time off” for a date-range, hourly, or partial-day request that is not tied to one shift.
            </Alert>
          )}
          {leaveFormError && (
            <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
              {leaveFormError}
            </Alert>
          )}
          <TextField
            select
            label="Leave Type"
            fullWidth
            margin="normal"
            value={leaveForm.leave_type}
            onChange={(e) => {
              setLeaveFormError("");
              setLeaveForm({ ...leaveForm, leave_type: e.target.value, leave_subtype: "" });
            }}
          >
            {LEAVE_TYPE_OPTIONS.map((type) => (
              <MenuItem key={type} value={type}>{formatLeaveTypeLabel(type)}</MenuItem>
            ))}
          </TextField>

          {leaveForm.leave_type === "family" && (
            <TextField
              select
              label="Subtype"
              fullWidth
              margin="normal"
              value={leaveForm.leave_subtype || ""}
              onChange={(e) => {
                setLeaveFormError("");
                setLeaveForm({ ...leaveForm, leave_subtype: e.target.value });
              }}
            >
              <MenuItem value="maternity">Maternity</MenuItem>
              <MenuItem value="paternity">Paternity</MenuItem>
              <MenuItem value="parental">Parental</MenuItem>
              <MenuItem value="adoption">Adoption</MenuItem>
            </TextField>
          )}

          {!selectedShift && (
            <TextField
              select
              label="Duration"
              fullWidth
              margin="normal"
              value={leaveForm.duration_mode}
              onChange={(e) => {
                setLeaveFormError("");
                setLeaveForm(applyEmployeeLeaveDurationMode(leaveForm, e.target.value));
              }}
              helperText={
                leaveForm.duration_mode === "full_day"
                  ? "Use full day for one day or a multi-day range."
                  : leaveForm.duration_mode === "partial_day"
                  ? "Use partial day for part of one day."
                  : "Use hourly when you only need to request a number of hours."
              }
            >
              <MenuItem value="full_day">Full day</MenuItem>
              <MenuItem value="partial_day">Partial day</MenuItem>
              <MenuItem value="hourly">Hourly</MenuItem>
            </TextField>
          )}

          {!selectedShift && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <ThemedDateField
                label="Start date"
                fullWidth
                margin="normal"
                value={leaveForm.start_date}
                onChange={(e) => {
                  setLeaveFormError("");
                  setLeaveForm(applyEmployeeLeaveStartDate(leaveForm, e.target.value));
                }}
              />
              <ThemedDateField
                label="End date"
                fullWidth
                margin="normal"
                disabled={leaveForm.duration_mode === "partial_day" || leaveForm.duration_mode === "hourly"}
                value={leaveForm.duration_mode === "partial_day" || leaveForm.duration_mode === "hourly" ? leaveForm.start_date : leaveForm.end_date}
                helperText={leaveForm.duration_mode === "partial_day" || leaveForm.duration_mode === "hourly" ? "Same-day request" : ""}
                onChange={(e) => {
                  setLeaveFormError("");
                  setLeaveForm({ ...leaveForm, end_date: e.target.value });
                }}
              />
            </Stack>
          )}

          {leaveForm.duration_mode === "partial_day" && !selectedShift && (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <ThemedTimeField
                  label="Start time"
                  fullWidth
                  margin="normal"
                  value={leaveForm.start_time}
                  onChange={(e) => {
                    setLeaveFormError("");
                    setLeaveForm({ ...leaveForm, start_time: e.target.value });
                  }}
                />
                <ThemedTimeField
                  label="End time"
                  fullWidth
                  margin="normal"
                  value={leaveForm.end_time}
                  onChange={(e) => {
                    setLeaveFormError("");
                    setLeaveForm({ ...leaveForm, end_time: e.target.value });
                  }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                You can enter start/end time, or use requested hours below.
              </Typography>
            </>
          )}

          {(leaveForm.duration_mode === "hourly" || leaveForm.duration_mode === "partial_day") && !selectedShift && (
            <TextField
              label={leaveForm.duration_mode === "hourly" ? "Requested hours" : "Requested hours (optional)"}
              type="number"
              fullWidth
              margin="normal"
              value={leaveForm.requested_hours}
              onChange={(e) => {
                setLeaveFormError("");
                setLeaveForm({ ...leaveForm, requested_hours: e.target.value });
              }}
              inputProps={{ min: 0, step: 0.25 }}
            />
          )}

          <TextField
            label="Reason"
            fullWidth
            margin="normal"
            multiline
            minRows={2}
            value={leaveForm.reason}
            onChange={(e) => {
              setLeaveFormError("");
              setLeaveForm({ ...leaveForm, reason: e.target.value });
            }}
          />

          {leaveForm.leave_type === "family" && leaveForm.leave_subtype && (
            <>
              <TextField
                label="Employer Top-up %"
                type="number"
                fullWidth
                margin="normal"
                value={leaveForm.top_up_percent || ""}
                onChange={(e) => setLeaveForm({ ...leaveForm, top_up_percent: e.target.value })}
                InputProps={{ endAdornment: <Typography sx={{ ml: 0.5 }}>%</Typography> }}
              />
              <TextField
                label="Top-up Cap (per pay)"
                type="number"
                fullWidth
                margin="normal"
                value={leaveForm.top_up_cap || ""}
                onChange={(e) => setLeaveForm({ ...leaveForm, top_up_cap: e.target.value })}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> }}
              />
            </>
          )}

          {selectedShift && (
            <TextField
              label="Requested hours (optional)"
              type="number"
              fullWidth
              margin="normal"
              value={leaveForm.requested_hours}
              onChange={(e) => {
                setLeaveFormError("");
                setLeaveForm({ ...leaveForm, requested_hours: e.target.value });
              }}
              helperText="Leave blank to use the selected shift duration."
              inputProps={{ min: 0, step: 0.25 }}
            />
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={leaveForm.is_paid_leave}
                onChange={(e) => setLeaveForm({ ...leaveForm, is_paid_leave: e.target.checked })}
              />
            }
            label="Paid Leave"
          />
          {(() => {
            const selectedBalance = selectedLeaveBalancePreview;
            const future = selectedBalance?.future_balance;
            if (!selectedBalance) return null;
            const availableOnStart = future?.available_on_leave_start_hours ?? selectedBalance.balance_hours;
            const projectedRemaining = leaveForm.is_paid_leave
              ? future?.projected_remaining_hours
              : availableOnStart;
            const shortageHours = leaveForm.is_paid_leave ? Number(future?.shortage_hours || 0) : 0;
            const expectedAccrual = Number(future?.expected_before_leave_start_hours ?? future?.expected_accrual_before_leave_start ?? 0);
            const balanceManaged = Boolean(selectedBalance.balance_managed);
            const eligibleNow = future?.eligible_now ?? selectedBalance.eligible_now;
            const eligibleOnStart = future?.eligible_on_leave_start ?? eligibleNow;
            const eligibilityLabel = eligibleNow ? "Eligible now" : eligibleOnStart ? "Eligible on start" : "Eligibility pending";
            return (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  mt: 1.5,
                  borderColor: shortageHours > 0 ? "warning.light" : "rgba(148, 163, 184, 0.45)",
                  bgcolor: shortageHours > 0 ? "rgba(245, 158, 11, 0.08)" : "rgba(248, 250, 252, 0.86)",
                }}
              >
                <Stack spacing={1.4}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={900}>
                        Before you submit
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        This is an estimate based on current policy and your selected dates.
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        color={leaveForm.is_paid_leave ? "success" : "warning"}
                        variant="outlined"
                        label={leaveForm.is_paid_leave ? "Paid leave" : "Unpaid leave"}
                        sx={{ fontWeight: 800 }}
                      />
                      <Chip
                        size="small"
                        color={balanceManaged ? "info" : "default"}
                        variant="outlined"
                        label={balanceManaged ? "Balance-managed" : "Not balance-managed"}
                        sx={{ fontWeight: 800 }}
                      />
                      <Chip
                        size="small"
                        color={eligibleOnStart ? "success" : "warning"}
                        variant="outlined"
                        label={eligibilityLabel}
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>
                  </Stack>

                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))", gap: 1 }}>
                    <Box sx={{ p: 1.1, borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                      <Typography variant="caption" color="text.secondary">Current balance</Typography>
                      <Typography variant="body2" fontWeight={850}>{formatBalanceHours(selectedBalance.balance_hours)}</Typography>
                    </Box>
                    <Box sx={{ p: 1.1, borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                      <Typography variant="caption" color="text.secondary">Available on start</Typography>
                      <Typography variant="body2" fontWeight={850}>{formatBalanceHours(availableOnStart)}</Typography>
                    </Box>
                    <Box sx={{ p: 1.1, borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                      <Typography variant="caption" color="text.secondary">Requested hours</Typography>
                      <Typography variant="body2" fontWeight={850}>{estimatedLeaveRequestHours ? formatBalanceHours(estimatedLeaveRequestHours) : "—"}</Typography>
                    </Box>
                    <Box sx={{ p: 1.1, borderRadius: 1, border: "1px solid", borderColor: shortageHours > 0 ? "warning.light" : "divider", bgcolor: "background.paper" }}>
                      <Typography variant="caption" color="text.secondary">Projected remaining</Typography>
                      <Typography variant="body2" fontWeight={850}>{formatBalanceHours(projectedRemaining)}</Typography>
                    </Box>
                  </Box>

                  {expectedAccrual > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Expected accrual before leave starts: {formatBalanceHours(expectedAccrual)}
                      {future?.next_expected_accrual_date ? ` · next expected accrual ${future.next_expected_accrual_date}` : ""}
                    </Typography>
                  )}

                  {!balanceManaged && leaveForm.is_paid_leave && (
                    <Alert severity="info" variant="outlined">
                      This leave type is not balance-managed. No balance deduction is planned.
                    </Alert>
                  )}

                  {!leaveForm.is_paid_leave && (
                    <Alert severity="info" variant="outlined">
                      Unpaid leave does not deduct from paid entitlement balance. It still creates a leave record, can affect scheduling visibility, and may still require manager approval.
                    </Alert>
                  )}

                  {shortageHours > 0 && (
                    <Alert severity="warning" variant="outlined">
                      Estimated shortage: {formatBalanceHours(shortageHours)}. You can still submit unless company policy blocks this during review.
                    </Alert>
                  )}

                  {(future?.waiting_period_blocking || (future?.eligibility_date && !eligibleNow)) && (
                    <Alert severity={eligibleOnStart ? "info" : "warning"} variant="outlined">
                      {future?.waiting_period_message || `You become eligible on ${future.eligibility_date}.`}
                    </Alert>
                  )}

                  {future?.eligibility_date && eligibleNow && (
                    <Typography variant="caption" color="text.secondary">
                      Eligibility date: {future.eligibility_date}
                    </Typography>
                  )}

                  {selectedBalance.policy_summary?.grant_method && (
                    <Typography variant="caption" color="text.secondary">
                      Policy: {selectedBalance.policy_summary.grant_method.replace(/_/g, " ")} · Standard workday: {selectedBalance.policy_summary.workday_hours || 8}h · Payroll formulas are separate.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setLeaveModalOpen(false);
            setLeaveFormError("");
          }}>Cancel</Button>
          <Button onClick={submitLeaveRequest} disabled={submittingLeave} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

            {/* Swap modal */}
      <Modal open={swapModalOpen} onClose={() => setSwapModalOpen(false)}>
        {/* Swap modal markup unchanged */}
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 1,
            mx: "auto",
            my: isSmDown ? 2 : "10%",
            width: isSmDown ? "94vw" : 420,
            maxWidth: "94vw",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" mb={2}>
            Request Shift Swap
          </Typography>
          {/* inside the Swap modal, above the select */}
<FormControlLabel
  control={
    <Switch
      checked={scopeWeek}
      onChange={(e) => {
        setScopeWeek(e.target.checked);
        loadSwappableShifts(selectedShift.id, e.target.checked ? "week" : "day");
      }}
    />
  }
  label="Limit to this week"
/>

          <TextField
            select
            fullWidth
            label="Swap With Shift"
            value={swapTargetShiftId || ""}
            onChange={(e) => setSwapTargetShiftId(Number(e.target.value))}
          >
            {swappableShifts.length === 0 && (
              <MenuItem disabled value="">
                No eligible shifts found
              </MenuItem>
            )}
            {swappableShifts.map((s) => {
              const startLabel = parseShiftDate(s.clock_in)?.toFormat("MMM d HH:mm");
              const endLabel = parseShiftDate(s.clock_out)?.toFormat("HH:mm");
              return (
                <MenuItem key={s.id} value={s.id}>
                  {startLabel || format(parseISO(s.clock_in), "MMM d HH:mm")} –{" "}
                  {endLabel || format(parseISO(s.clock_out), "HH:mm")} ({s.recruiter_name})
                </MenuItem>
              );
            })}
          </TextField>

          <TextField
            fullWidth
            label="Message (optional)"
            multiline
            rows={2}
            margin="normal"
            value={swapMsg}
            onChange={(e) => setSwapMsg(e.target.value)}
          />

          <FormControlLabel
            control={
              <Switch
                checked={showSwapHistory}
                onChange={(e) => {
                  setShowSwapHistory(e.target.checked);
                  loadPendingSwaps(e.target.checked);
                }}
              />
            }
            label="Show swap history"
            sx={{ mb: 1, mt: 2 }}
          />

          {pendingSwaps.length > 0 && (
            <>
              <Typography variant="subtitle2" mt={2}>
                My Pending Swaps
              </Typography>
              <Stack spacing={1} mt={1} sx={{ maxHeight: 160, overflow: "auto" }}>
                {pendingSwaps.map((sw) => (
                  <Paper
                    key={sw.id}
                    variant="outlined"
                    sx={{ p: 1, display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">
                      #{sw.id} → Shift&nbsp;{sw.target_shift_id} ({sw.status})
                    </Typography>
                    {/* Show Cancel only if this user is the requester */}
                    {sw.status === "pending" && sw.is_requester && (
                      <Button size="small" color="error" onClick={() => cancelSwap(sw.id)}>
                        Cancel
                      </Button>
                    )}
                  </Paper>
                ))}
              </Stack>
            </>
          )}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="flex-end"
            spacing={2}
            mt={3}
          >
            <Button onClick={() => setSwapModalOpen(false)} fullWidth={isSmDown}>
              Close
            </Button>
            <Button
              variant="contained"
              disabled={!swapTargetShiftId}
              onClick={handleSwapRequest}
              fullWidth={isSmDown}
            >
              Submit Swap
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Manager Swap Approvals panel (only for managers) */}
      {isManager && showSwapApprovals && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Shift Swap Approvals
          </Typography>
          <ShiftSwapPanel token={token} headerStyle={{ fontWeight: "bold" }} />
        </>
      )}

      <Dialog open={Boolean(photoUploadShift)} onClose={() => !photoUploading && setPhotoUploadShift(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Photos</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            {photoUploadShift && (
              <Alert severity="info">
                Uploading for {photoUploadShift.date ? format(parseISO(photoUploadShift.date), "EEE, MMM d") : "selected shift"}.
              </Alert>
            )}
            <Stack spacing={0.5} alignItems="flex-start">
              <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={photoUploading}>
                {photoUploadFiles.length ? `${photoUploadFiles.length} selected` : "Take photos or choose from gallery"}
                <input
                  hidden
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    event.target.value = "";
                    setPhotoUploadFiles((prev) => {
                      const existing = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
                      const next = [...prev];
                      files.forEach((file) => {
                        const key = `${file.name}-${file.size}-${file.lastModified}`;
                        if (!existing.has(key)) next.push(file);
                      });
                      return next;
                    });
                  }}
                />
              </Button>
              <Typography variant="caption" color="text.secondary">
                Select one or more JPG, PNG, or WebP photos.
              </Typography>
            </Stack>
            {photoUploadFiles.length > 0 && (
              <Stack spacing={0.75}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {photoUploadFiles.length} photo{photoUploadFiles.length === 1 ? "" : "s"} selected
                  </Typography>
                  <Button size="small" onClick={() => setPhotoUploadFiles([])} disabled={photoUploading}>Remove all</Button>
                </Stack>
                <Box sx={{ maxHeight: { xs: 180, sm: 240 }, overflowY: "auto", pr: 0.5 }}>
                  <Stack spacing={0.5}>
                    {photoUploadFiles.map((file, index) => (
                      <Stack key={`${file.name}-${file.size}-${file.lastModified}`} direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </Typography>
                        <IconButton
                          size="small"
                          disabled={photoUploading}
                          onClick={() => setPhotoUploadFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                          aria-label={`Remove ${file.name}`}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            )}
            <TextField
              label="Note (optional)"
              value={photoUploadNote}
              onChange={(event) => setPhotoUploadNote(event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            <Typography variant="caption" color="text.secondary">
              Photos become available after the security check completes.
            </Typography>
            {photoUploading && (
              <Stack spacing={0.75}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary">{photoUploadProgress || "Uploading photos..."}</Typography>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoUploadShift(null)} disabled={photoUploading}>Cancel</Button>
          <Button variant="contained" onClick={submitFieldPhotoUpload} disabled={photoUploading || !photoUploadFiles.length} startIcon={photoUploading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}>
            {photoUploading ? "Uploading..." : `Upload${photoUploadFiles.length > 1 ? ` ${photoUploadFiles.length}` : ""}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.error ? 9000 : 4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.error ? "error" : "success"}
          variant={snackbar.error ? "filled" : "standard"}
          sx={{ maxWidth: 560, alignItems: "flex-start", whiteSpace: "pre-line" }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

/* eslint-enable react-hooks/exhaustive-deps */
export default SecondEmployeeShiftView;
