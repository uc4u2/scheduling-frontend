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
  useMediaQuery,
  LinearProgress,
} from "@mui/material";
import { format, parseISO, differenceInMinutes, addDays } from "date-fns";
import { useTheme } from "@mui/material/styles";
import { DateTime } from "luxon";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import { STATUS } from "../../utils/shiftSwap";
import { POLL_MS } from "../../utils/shiftSwap";

/* eslint-disable react-hooks/exhaustive-deps */
import ShiftSwapPanel from "../../components/ShiftSwapPanel";
import IncomingSwapRequests from "../../components/IncomingSwapRequests";
import { getUserTimezone } from "../../utils/timezone";
import { timeTracking } from "../../utils/api";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SecondEmployeeShiftView = () => {
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
  const [todayCardCollapsed, setTodayCardCollapsed] = useState(false);
  const [countdownTick, setCountdownTick] = useState(Date.now());

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
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historySummary, setHistorySummary] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyFilters, setHistoryFilters] = useState(() => {
    const end = format(new Date(), "yyyy-MM-dd");
    return { startDate: end, endDate: end, status: "all" };
  });
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
  loadTimeHistory();
}, [userId]);

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
  const id = setInterval(() => setLastUpdated(DateTime.now()), 30000);
  return () => clearInterval(id);
}, []);

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

  const [overrideShiftId, setOverrideShiftId] = useState(null);

  const todayShift = useMemo(() => {
    if (!shifts.length) return null;
    const now = DateTime.now().setZone(viewerTimezone);

    const mapped = shifts
      .map((shift) => {
        try {
          const start = shift.clock_in ? DateTime.fromISO(shift.clock_in, { setZone: true }) : null;
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

  const handleClockAction = async (action) => {
    if (!todayShift) return;
    if (action === "out" && canClockOut) {
      const confirmed = window.confirm(
        "Are you sure you want to clock out? Make sure you've finished your tasks."
      );
      if (!confirmed) return;
    }
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
      const res = await fetch(`${API_URL}/employee/time-history?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
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
        spacing={1.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            My Time & Clock
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your current shift, live clock, and break status.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip size="small" color={headerChipColor} label={headerStatusLabel} />
          {lastUpdatedLabel && (
            <Typography variant="caption" color="text.secondary">
              Last updated {lastUpdatedLabel} · auto-refreshing
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>

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
              <Box
                sx={(theme) => ({
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  background: theme.palette.mode === "light" ? theme.palette.grey[50] : theme.palette.background.default,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                })}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: "rgba(255,122,60,0.12)",
                      color: "#FF7A3C",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
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
                    sx={{ mt: 1.5, height: 6, borderRadius: 999 }}
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
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <TextField
            type="date"
            size="small"
            label="From"
            InputLabelProps={{ shrink: true }}
            value={historyFilters.startDate}
            onChange={handleHistoryChange("startDate")}
            fullWidth={isSmDown}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            InputLabelProps={{ shrink: true }}
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
          <Table size="small">
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
                    <Chip size="small" label={entry.status || "—"} />
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
        )}
      </Box>
    </Paper>
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
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Live clock & break guidance
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
                variant="h6"
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
                  fullWidth={isSmDown}
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
                    >
                      Clock Out
                    </Button>
                  </span>
                </Tooltip>
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
                    Breaks logged: {totalBreakMinutes} min {todayShift?.break_paid ? "(paid)" : "(unpaid)"}
                  </Typography>
                </Stack>
              )}
            {breakTimelineMeta && (
              <Box mt={2}>
                <Box
                  sx={(theme) => ({
                    p: 2,
                    borderRadius: 2,
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
                    borderRadius: 999,
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
                        borderRadius: 999,
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
            const breakMeta = (() => {
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
                        sx={{ mt: 1, mr: 1 }}
                      />
                    )}
                    {swapStatusChip(shift)}
                    {shift.break_missing_minutes > 0 && (
                      <Chip
                        label={`Missing ${shift.break_missing_minutes}m`}
                        color={shift.break_missing_minutes > 10 ? "error" : "warning"}
                        size="small"
                        sx={{ mt: 1, mr: 1 }}
                      />
                    )}
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
        fullScreen={isSmDown}
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
