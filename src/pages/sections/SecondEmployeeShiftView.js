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
} from "@mui/material";
import { format, parseISO, differenceInMinutes, addDays, addMinutes } from "date-fns";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { STATUS } from "../../utils/shiftSwap";
import { POLL_MS } from "../../utils/shiftSwap";

/* eslint-disable react-hooks/exhaustive-deps */
import ShiftSwapPanel from "../../components/ShiftSwapPanel";
import IncomingSwapRequests from "../../components/IncomingSwapRequests";
import { getUserTimezone } from "../../utils/timezone";
import { formatDateTimeInTz } from "../../utils/datetime";
import { timeTracking } from "../../utils/api";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SecondEmployeeShiftView = () => {
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

  // Leave-request dialog
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: "sick",
    reason: "",
    override_hours: "",
    is_paid_leave: true,
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

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

const loadShifts = async () => {
  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const in30 = format(addDays(new Date(), 30), "yyyy-MM-dd");
    const res = await fetch(
      `${API_URL}/recruiter/calendar?start_date=${today}&end_date=${in30}`,
      { headers: authHeader }
    );

    const { events = [] } = await res.json();

    const shiftEvents = events
      .filter((e) => e.type === "shift")
      .map((e) => ({
        id: e.shift_id,
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
      }));

    setShifts(shiftEvents);
  } catch (err) {
    setErrorMsg("Failed to fetch your shifts.");
  } finally {
    setLoading(false);
  }
};

const loadPendingSwaps = async (showHistory = false) => {
  try {
    const statusFilter = showHistory ? "" : "?status=pending,executed";
    const res = await fetch(`${API_URL}/shift-swap-requests${statusFilter}`, {
      headers: authHeader,
    });
    const data = await res.json();
    setPendingSwaps(data);
  } catch (_) {
    setPendingSwaps([]);
  }
};

const loadOptOut = async () => {
  try {
    const res = await fetch(`${API_URL}/employee/swap-opt-out`, {
      headers: authHeader,
    });
    const data = await res.json();
    setOptOut(Boolean(data.opt_out));
  } catch {
    /* if call fails, keep default = false */
  }
};

const loadSwappableShifts = async (shiftId, scope = "week") => {
  try {
    const res = await fetch(
      `${API_URL}/employee/swappable-shifts?shift_id=${shiftId}&scope=${scope}`,
      { headers: authHeader }
    );
    const data = await res.json();
    setSwappableShifts(data);
  } catch (_) {
    setSwappableShifts([]);
  }
};

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  loadShifts();
  loadPendingSwaps(showSwapHistory);
  loadOptOut();
}, [userId]);

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  const intervalId = setInterval(() => {
    loadShifts();
    loadPendingSwaps(showSwapHistory);
  }, POLL_MS); // <--- use the shared constant!
  return () => clearInterval(intervalId);
}, [showSwapHistory]);

// ───────────────────────────────────────────────────────
//  Leave-request logic

  // ───────────────────────────────────────────────────────
  const openLeaveForm = (shift) => {
    setSelectedShift(shift);
    setLeaveForm({
      leave_type: "sick",
      reason: "",
      override_hours: "",
      is_paid_leave: true,
    });
    setLeaveModalOpen(true);
  };

  const submitLeaveRequest = async () => {
    setSubmittingLeave(true);
    try {
      const res = await fetch(`${API_URL}/employee/leave-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          shift_id: selectedShift.id,
          leave_type: leaveForm.leave_type,
          leave_subtype: leaveForm.leave_subtype,
          reason: leaveForm.reason,
          start: selectedShift.clock_in,
          end: selectedShift.clock_out,
          is_paid_leave: leaveForm.is_paid_leave,
          override_hours: leaveForm.override_hours || null,
          top_up_percent: leaveForm.top_up_percent,
          top_up_cap: leaveForm.top_up_cap,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSnackbar({ open: true, msg: "Leave request submitted.", error: false });
      setLeaveModalOpen(false);
      loadShifts();
    } catch (err) {
      setSnackbar({ open: true, msg: err.message, error: true });
    } finally {
      setSubmittingLeave(false);
    }
  };

  // ───────────────────────────────────────────────────────
  //  Swap logic
  // ───────────────────────────────────────────────────────

  const fireEmail = async (swapId) => {
    if (!swapId) return;
    try {
      await axios.post(
        `${API_URL}/shift-swap-requests/${swapId}/send-email`,
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
      const res = await axios.post(
        `${API_URL}/shift-swap-requests`,
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
      await axios.delete(`${API_URL}/shift-swap-requests/${swapId}`, {
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
    const start = parseISO(shift.clock_in);
    const end = parseISO(shift.clock_out);
    const mins = differenceInMinutes(end, start);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return shift.override_hours
      ? `⏱️ ${shift.override_hours}h (override)`
      : `⏱️ ${h}h ${m}m`;
  };

  const todayShift = useMemo(() => {
    if (!shifts.length) return null;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const match = shifts.find((shift) => {
      try {
        return format(parseISO(shift.clock_in), "yyyy-MM-dd") === todayStr;
      } catch {
        return false;
      }
    });
    return match || null;
  }, [shifts]);
  const formatHoursValue = useCallback((value) => `${Number(value || 0).toFixed(1)}h`, []);
  const summaryMetrics = useMemo(() => {
    if (!timeSummary) return [];
    return [
      {
        label: "Hours this week",
        value: formatHoursValue(timeSummary?.hours?.worked),
        helper: `${formatHoursValue(timeSummary?.hours?.overtime)} overtime`,
      },
      {
        label: "Breaks",
        value: `${timeSummary?.breaks?.taken || 0}`,
        helper: `${timeSummary?.breaks?.missed || 0} missed`,
      },
      {
        label: "Shifts tracked",
        value: `${timeSummary?.shifts?.count || 0}`,
        helper: `${timeSummary?.breaks?.minutes || 0} break mins`,
      },
    ];
  }, [timeSummary, formatHoursValue]);

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
  const currentShiftNumbers = todayShift
    ? {
        in: formatDateTimeInTz(todayShift.clock_in, todayShift.timezone || viewerTimezone),
        out: todayShift.clock_out
          ? formatDateTimeInTz(todayShift.clock_out, todayShift.timezone || viewerTimezone)
          : null,
      }
    : null;

  const computeElapsedSeconds = useCallback((shift) => {
    if (!shift?.clock_in) return 0;
    const start = parseISO(shift.clock_in);
    const end = shift.clock_out ? parseISO(shift.clock_out) : new Date();
    let total = Math.max((end - start) / 1000, 0);
    let breakSeconds = (shift.break_minutes || 0) * 60;
    if (shift.break_start && !shift.break_end) {
      try {
        breakSeconds += Math.max((new Date() - parseISO(shift.break_start)) / 1000, 0);
      } catch {}
    }
    return Math.max(total - breakSeconds, 0);
  }, []);

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

  const handleClockAction = async (action) => {
    if (!todayShift) return;
    setClocking(true);
    try {
      if (action === "in") {
        await timeTracking.clockIn(todayShift.id);
        setSnackbar({ open: true, msg: "Clock-in recorded.", error: false });
      } else {
        await timeTracking.clockOut(todayShift.id);
        setSnackbar({ open: true, msg: "Clock-out recorded.", error: false });
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

  const isClocked = todayShift?.clock_source === "clock";
  const isInProgress = isClocked && todayShift?.status === "in_progress";
  const isCompleted = isClocked && ["completed", "approved"].includes(todayShift?.status);
  const isLockedShift = todayShift?.is_locked;
  const canClockIn = todayShift && !isClocked && !isLockedShift;
  const canClockOut = isInProgress && !isLockedShift;
  const breakInProgress = Boolean(todayShift?.break_start && !todayShift?.break_end);
  const breakMinutesLogged = todayShift?.break_minutes || 0;
  const currentBreakMinutes = breakInProgress
    ? Math.max(
        differenceInMinutes(new Date(), parseISO(todayShift.break_start || new Date().toISOString())),
        0
      )
    : 0;
  const totalBreakMinutes = breakMinutesLogged + currentBreakMinutes;
  const canStartBreak = isInProgress && !breakInProgress && !isCompleted && !breakSubmitting;
  const canEndBreak = isInProgress && breakInProgress && !breakSubmitting;
  const timelineMeta = useMemo(() => {
    if (!todayShift) return null;
    try {
      const start = parseISO(todayShift.clock_in);
      const endRaw = todayShift.clock_out;
      if (!start || !endRaw) return null;
      const end = parseISO(endRaw);
      const totalMinutes = Math.max(differenceInMinutes(end, start), 1);
      const now = new Date();
      const elapsedMinutes = Math.min(Math.max((now - start) / 60000, 0), totalMinutes);
      const progressPct = Math.min(Math.max((elapsedMinutes / totalMinutes) * 100, 0), 100);
      let breakSegment = null;
      if (todayShift.break_start) {
        const breakStart = parseISO(todayShift.break_start);
        const breakEnd = todayShift.break_end
          ? parseISO(todayShift.break_end)
          : todayShift.break_minutes
          ? addMinutes(breakStart, todayShift.break_minutes)
          : new Date();
        const startOffset = Math.max((breakStart - start) / 60000, 0);
        const endOffset = Math.min((breakEnd - start) / 60000, totalMinutes);
        if (endOffset > startOffset) {
          breakSegment = {
            left: (startOffset / totalMinutes) * 100,
            width: Math.max(((endOffset - startOffset) / totalMinutes) * 100, 2),
            inProgress: !todayShift.break_end,
          };
        }
      }
      const requiredBreak = timeSummary?.policy?.required_break_minutes || 0;
      const needsBreak = requiredBreak && totalMinutes / 60 >= 6;
      const breakDeficit = needsBreak ? Math.max(requiredBreak - totalBreakMinutes, 0) : 0;
      return {
        start,
        end,
        progressPct,
        breakSegment,
        needsBreak,
        breakDeficit,
      };
    } catch {
      return null;
    }
  }, [todayShift, totalBreakMinutes, timeSummary]);

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
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        p: 3,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        background: (theme) => theme.palette.background.paper,
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
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {metric.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {metric.helper}
                </Typography>
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

    {/* Top-level button */}
    <Button
      variant="outlined"
      startIcon={<CalendarMonthIcon />}
      onClick={() => setDrawerOpen(true)}
      sx={{ mb: 2 }}
    >
      View My Shifts
    </Button>

    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: 3,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        background: (theme) => theme.palette.background.paper,
      }}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
          Today's shift
        </Typography>
        {todayShift ? (
          <>
            <Typography variant="h6" fontWeight={700}>
              {format(parseISO(todayShift.clock_in), "EEE, MMM d")} ·{" "}
              {format(parseISO(todayShift.clock_in), "HH:mm")} –{" "}
              {format(parseISO(todayShift.clock_out), "HH:mm")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isClocked
                ? `Clocked in at ${currentShiftNumbers?.in}${
                    isCompleted && currentShiftNumbers?.out
                      ? ` • Clocked out at ${currentShiftNumbers?.out}`
                      : ""
                  }`
                : "Not clocked in yet."}
            </Typography>
            {isClocked && (
              <Typography variant="body2" color="text.secondary">
                Time on shift: {formatElapsed(elapsedSeconds)}
              </Typography>
            )}
            {breakInProgress && todayShift.break_start && (
              <Chip
                size="small"
                color="warning"
                label={`On break since ${formatDateTimeInTz(
                  todayShift.break_start,
                  todayShift.timezone || viewerTimezone
                )}`}
                sx={{ width: "fit-content", mt: 1 }}
              />
            )}
            {isLockedShift && (
              <Chip size="small" color="success" label="Approved / locked" sx={{ width: "fit-content", mt: 1 }} />
            )}
            {timelineMeta && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Shift timeline
                </Typography>
                <Box
                  sx={(theme) => ({
                    position: "relative",
                    height: 10,
                    borderRadius: 999,
                    background: theme.palette.action.hover,
                    mt: 0.5,
                  })}
                >
                  <Box
                    sx={(theme) => ({
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: `${timelineMeta.progressPct}%`,
                      borderRadius: 999,
                      background: theme.palette.primary.main,
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
                        borderRadius: 999,
                        background: theme.palette.warning.light,
                        opacity: 0.9,
                      })}
                    />
                  )}
                  <Box
                    sx={(theme) => ({
                      position: "absolute",
                      top: -4,
                      width: 8,
                      height: 18,
                      borderRadius: 1,
                      left: `calc(${timelineMeta.progressPct}% - 4px)`,
                      background: theme.palette.text.primary,
                    })}
                  />
                </Box>
                <Stack direction="row" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {format(timelineMeta.start, "HH:mm")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(), "HH:mm")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(timelineMeta.end, "HH:mm")}
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
                        : `Break compliant (${totalBreakMinutes}m logged)`
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
              >
                Clock In
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                disabled={!canClockOut || clocking}
                onClick={() => handleClockAction("out")}
              >
                Clock Out
              </Button>
              {isClocked && !isInProgress && !isCompleted && (
                <Chip label={todayShift.status} size="small" sx={{ width: "fit-content" }} />
              )}
            </Stack>
            {isInProgress && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                mt={1}
              >
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleBreakAction("start")}
                  disabled={!canStartBreak}
                >
                  Start Break
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleBreakAction("end")}
                  disabled={!canEndBreak}
                >
                  End Break
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Breaks logged: {totalBreakMinutes} min {todayShift?.break_paid ? "(paid)" : "(unpaid)"}
                </Typography>
              </Stack>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No shift scheduled today. Upcoming shifts will appear here for quick clock actions.
          </Typography>
        )}
      </Stack>
    </Paper>
    
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
      PaperProps={{ sx: { width: { xs: "100%", sm: 420 }, p: 3 } }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight="bold">
          👤 My Shifts
        </Typography>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/*  ➤ Opt-out toggle */}
      <FormControlLabel
        sx={{ mt: 2 }}
        control={
          <Switch
            checked={optOut}
            onChange={async (e) => {
              const val = e.target.checked;
              setOptOut(val);
              try {
                await axios.put(
                  `${API_URL}/employee/swap-opt-out`,
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
      {!isManager && (
        <Button
          size="small"
          variant="outlined"
          sx={{ ml: 1, mt: 2, mb: 2 }}
          onClick={() => setShowMySwapRequests(!showMySwapRequests)}
        >
          {showMySwapRequests ? "Hide" : "Show"} My Swaps
        </Button>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Shifts list, loading & error blocks */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : errorMsg ? (
        <Typography color="error">{errorMsg}</Typography>
      ) : shifts.length === 0 ? (
        <Typography>No shifts assigned yet.</Typography>
      ) : (
        <Grid container spacing={2}>
          {shifts.map((shift) => {
            const start = parseISO(shift.clock_in);
            const end   = parseISO(shift.clock_out);
            const disabledSwap =
              shift.is_locked || shift.swap_status === "pending";

            return (
              <Grid item xs={12} key={shift.id}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      {format(start, "EEE, MMM d")}
                    </Typography>

                    <Typography variant="body1" fontWeight="bold">
                      {shift.on_leave
                        ? "⛔ On Leave"
                        : `🕒 ${format(start, "HH:mm")} – ${format(
                            end,
                            "HH:mm"
                          )}`}
                    </Typography>

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
                        sx={{ mt: 1, mr: 1 }}
                      />
                    )}
                    {swapStatusChip(shift)}
                    <Chip
                      label={durationChip(shift)}
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />

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
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
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
    </Drawer>

      {/* Leave dialog */}
      <Dialog
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {/* Leave form markup as before */}
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Leave Type"
            fullWidth
            margin="normal"
            value={leaveForm.leave_type}
            onChange={(e) =>
              setLeaveForm({ ...leaveForm, leave_type: e.target.value, leave_subtype: "" })
            }
          >
            <MenuItem value="sick">Sick</MenuItem>
            <MenuItem value="vacation">Vacation</MenuItem>
            <MenuItem value="personal">Personal</MenuItem>
            <MenuItem value="emergency">Emergency</MenuItem>
            <MenuItem value="family">Family / Parental</MenuItem>
          </TextField>

          {leaveForm.leave_type === "family" && (
            <TextField
              select
              label="Subtype"
              fullWidth
              margin="normal"
              value={leaveForm.leave_subtype || ""}
              onChange={(e) => setLeaveForm({ ...leaveForm, leave_subtype: e.target.value })}
            >
              <MenuItem value="maternity">Maternity</MenuItem>
              <MenuItem value="paternity">Paternity</MenuItem>
              <MenuItem value="parental">Parental</MenuItem>
              <MenuItem value="adoption">Adoption</MenuItem>
            </TextField>
          )}

          <TextField
            label="Reason"
            fullWidth
            margin="normal"
            multiline
            minRows={2}
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
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

          <TextField
            label="Override Hours (optional)"
            type="number"
            fullWidth
            margin="normal"
            value={leaveForm.override_hours}
            onChange={(e) => setLeaveForm({ ...leaveForm, override_hours: e.target.value })}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={leaveForm.is_paid_leave}
                onChange={(e) => setLeaveForm({ ...leaveForm, is_paid_leave: e.target.checked })}
              />
            }
            label="Paid Leave"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveModalOpen(false)}>Cancel</Button>
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
            borderRadius: 2,
            mx: "auto",
            my: "10%",
            width: 420,
            maxWidth: "90vw",
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
            {swappableShifts.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {format(parseISO(s.clock_in), "MMM d HH:mm")} –{" "}
                {format(parseISO(s.clock_out), "HH:mm")} ({s.recruiter_name})
              </MenuItem>
            ))}
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

          <Stack direction="row" justifyContent="flex-end" spacing={2} mt={3}>
            <Button onClick={() => setSwapModalOpen(false)}>Close</Button>
            <Button
              variant="contained"
              disabled={!swapTargetShiftId}
              onClick={handleSwapRequest}
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

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.error ? "error" : "success"}>{snackbar.msg}</Alert>
      </Snackbar>
    </>
  );
};

/* eslint-enable react-hooks/exhaustive-deps */
export default SecondEmployeeShiftView;
