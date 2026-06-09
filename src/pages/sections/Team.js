import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import api from "../../utils/api";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Modal,
  TextField,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormHelperText,
  Snackbar,
  Alert,
  Paper,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TableContainer,
  Toolbar,
  Divider,
  InputAdornment,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Pagination,
  Menu,
  Drawer,
  GlobalStyles,
  useTheme,
  useMediaQuery,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp, InfoOutlined } from "@mui/icons-material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format, endOfMonth, addDays, startOfWeek, endOfWeek } from "date-fns";
import { useLocation, useNavigate } from "react-router-dom";
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, MoreVert as MoreVertIcon, PhotoCamera as PhotoCameraIcon } from "@mui/icons-material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { alpha } from "@mui/material/styles";
import { DateTime } from "luxon";
import { formatDate, formatTime } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import SmartShiftPlannerPanel from "./management/SmartShiftPlannerPanel";
import WorkforceCostAnalytics from "./management/WorkforceCostAnalytics";
import ShiftAdminAuditTimeline from "./ShiftAdminAuditTimeline";
import ThemedDateField, { ThemedMonthField, ThemedTimeField } from "../../components/ui/ThemedDateField";
import TutorialHelpCard from "../../components/tutorials/TutorialHelpCard";
import { SHIFT_SCHEDULE_TUTORIAL_GROUP } from "../../tutorials/appTutorialCatalog";

// ------------------------------------------------------------------------------------
// Constants & utils
// ------------------------------------------------------------------------------------
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayIndexToLabel = (value) => {
  if (typeof value === "string") {
    return dayLabels.includes(value) ? value : value;
  }
  const idx = Number(value);
  if (Number.isNaN(idx) || idx < 0) return dayLabels[0];
  return dayLabels[idx % 7];
};
const normalizeTemplateDays = (days) => (Array.isArray(days) ? days.map(dayIndexToLabel) : []);
const formatAvailabilityDisplay = (slot) =>
  `${slot.date} • ${slot.start_time} - ${slot.end_time}${slot.booked ? " (booked)" : ""}`;
const formatAvailabilityWarning = (payload) => {
  if (!payload?.availability_warning) return "";
  const count = Number(payload.overlapping_availability_count || 0);
  const plural = count === 1 ? "slot" : "slots";
  return payload.availability_warning_message
    || `Approved successfully. This employee still has ${count} availability ${plural} during the approved leave window.`;
};
const toTimeInputValue = (value) => {
  if (!value) return "";
  if (typeof value === "string" && value.includes("T")) {
    try {
      return format(new Date(value), "HH:mm");
    } catch (err) {
      return value.slice(0, 5);
    }
  }
  return value.slice(0, 5);
};
const toArray = (raw) =>
  Array.isArray(raw) ? raw : raw && typeof raw === "object" ? Object.values(raw) : [];

const formatFieldPhotoDateTime = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const defaultBreakPolicyForm = {
  breakMode: "none",
  breakLength: "",
  breakFixedStart: "",
  breakFixedEnd: "",
  breakWindowStart: "",
  breakWindowEnd: "",
  breakLatestStart: "",
  breakMaxSimultaneous: "",
  breakRotate: false,
};

const defaultShiftTimeOffForm = {
  leaveType: "sick",
  isPaidLeave: true,
  approvedHours: "",
  note: "",
  removeFromSchedule: true,
};

const shiftTimeOffLeaveTypes = [
  { value: "sick", label: "Sick" },
  { value: "vacation", label: "Vacation" },
  { value: "personal", label: "Personal" },
  { value: "emergency", label: "Emergency" },
  { value: "family", label: "Family / Parental" },
  { value: "compassionate", label: "Compassionate" },
  { value: "unpaid_day_off", label: "Unpaid day off" },
  { value: "other", label: "Other / Manager note" },
];

const hydrateBreakPolicyFormState = (policy) => {
  if (!policy || typeof policy !== "object") {
    return { ...defaultBreakPolicyForm };
  }
  return {
    ...defaultBreakPolicyForm,
    breakMode: policy.mode || "none",
    breakLength:
      policy.length_minutes !== undefined && policy.length_minutes !== null
        ? String(policy.length_minutes)
        : "",
    breakFixedStart: policy.start_time || "",
    breakFixedEnd: policy.end_time || "",
    breakWindowStart: policy.window_start || "",
    breakWindowEnd: policy.window_end || "",
    breakLatestStart: policy.latest_start || "",
    breakMaxSimultaneous:
      policy.max_simultaneous !== undefined && policy.max_simultaneous !== null
        ? String(policy.max_simultaneous)
        : "",
    breakRotate: Boolean(
      policy.rotate_slots || policy.shuffle || policy.rotate || policy.rotate_employees
    ),
  };
};

const buildBreakPolicyPayload = (formState, paidFlag) => {
  const mode = formState.breakMode || "none";
  if (!mode || mode === "none") {
    return null;
  }
  const policy = { mode };
  const parsedLength = parseInt(formState.breakLength || formState.breakMinutes, 10);
  if (!Number.isNaN(parsedLength) && parsedLength > 0) {
    policy.length_minutes = parsedLength;
  }

  const assignTime = (key, value) => {
    if (value) {
      policy[key] = value;
    }
  };

  if (mode === "fixed") {
    assignTime("start_time", formState.breakFixedStart || formState.breakStart);
    assignTime("end_time", formState.breakFixedEnd || formState.breakEnd);
  } else if (mode === "window") {
    assignTime("window_start", formState.breakWindowStart);
    assignTime("window_end", formState.breakWindowEnd);
    assignTime("latest_start", formState.breakLatestStart);
  } else if (mode === "stagger") {
    assignTime("window_start", formState.breakWindowStart);
    assignTime("window_end", formState.breakWindowEnd);
    const maxSim = parseInt(formState.breakMaxSimultaneous, 10);
    if (!Number.isNaN(maxSim) && maxSim > 0) {
      policy.max_simultaneous = maxSim;
    }
    policy.shuffle = Boolean(formState.breakRotate);
  }

  if (typeof paidFlag === "boolean") {
    policy.paid = paidFlag;
  }
  return policy;
};

const viewerTimezone = getUserTimezone();

const toLocalIso = (iso, zone) => {
  if (!iso) return null;
  try {
    return DateTime.fromISO(iso, { zone: "utc" })
      .setZone(zone || viewerTimezone)
      .toISO();
  } catch {
    return iso;
  }
};

const formatLocalTime = (iso) => {
  if (!iso) return "";
  try {
    return DateTime.fromISO(iso, { setZone: true }).toFormat("HH:mm");
  } catch {
    return iso.slice(11, 16);
  }
};

const formatLocalDate = (iso) => {
  if (!iso) return "";
  try {
    return DateTime.fromISO(iso, { setZone: true }).toFormat("yyyy-MM-dd");
  } catch {
    return iso.slice(0, 10);
  }
};

const getShiftLocalDate = (shift) =>
  shift.clock_in_local_date ||
  formatLocalDate(shift.clock_in_display) ||
  shift.date;

const getShiftLocalEndDate = (shift) =>
  shift.clock_out_local_date ||
  formatLocalDate(shift.clock_out_display) ||
  shift.date;

const getShiftLocalStart = (shift) =>
  shift.clock_in_local_time ||
  formatLocalTime(shift.clock_in_display) ||
  (shift.clock_in || "").slice(11, 16);

const getShiftLocalEnd = (shift) =>
  shift.clock_out_local_time ||
  formatLocalTime(shift.clock_out_display) ||
  (shift.clock_out || "").slice(11, 16);

const parseUtcMillis = (iso) => {
  if (!iso) return null;
  try {
    return DateTime.fromISO(iso, { zone: "utc" }).toMillis();
  } catch {
    return null;
  }
};

const fmtShiftHours = (value) => `${Number(value || 0).toFixed(1)} h`;
const fmtShiftMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const shiftInsightTone = {
  success: { main: "#15803d", soft: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.2)" },
  warning: { main: "#b45309", soft: "rgba(245, 158, 11, 0.09)", border: "rgba(245, 158, 11, 0.22)" },
  danger: { main: "#b91c1c", soft: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.22)" },
  info: { main: "#1d4ed8", soft: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.2)" },
  muted: { main: "#475569", soft: "rgba(100, 116, 139, 0.07)", border: "rgba(148, 163, 184, 0.22)" },
  default: { main: "#0f172a", soft: "rgba(15, 23, 42, 0.03)", border: "rgba(148, 163, 184, 0.2)" },
};

const readableShiftLabel = (value) =>
  String(value || "unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatShiftInsightDateLabel = (value) => {
  if (!value) return "";
  const parsed = DateTime.fromISO(String(value));
  return parsed.isValid ? parsed.toFormat("LLL d") : String(value);
};

const getShiftDurationHours = (shift) => {
  const start = parseUtcMillis(shift?.clock_in || shift?.scheduled_clock_in);
  const end = parseUtcMillis(shift?.clock_out || shift?.scheduled_clock_out);
  if (!start || !end || end <= start) return 0;
  return Math.max((end - start) / 3600000, 0);
};

const getShiftInsights = ({ shifts = [], recruiters = [], departments = [], timeEntriesMap = {}, rosterMap = {} }) => {
  const recruiterById = new Map(recruiters.map((recruiter) => [String(recruiter.id), recruiter]));
  const departmentById = new Map(departments.map((department) => [String(department.id), department]));
  const activeShifts = shifts.filter((shift) => shift && shift.status !== "deleted");
  const byDay = new Map();
  const byDepartment = new Map();
  const byEmployee = new Map();
  const byLeaveType = new Map();
  const byTemplate = new Map();

  const summary = {
    scheduled: activeShifts.length,
    assigned: 0,
    open: 0,
    cancelled: 0,
    timeOff: 0,
    overtimeRisk: 0,
    missingBreak: 0,
    inProgress: 0,
    affectedByLeave: 0,
    restoredOrRestorable: 0,
    totalHours: 0,
  };

  activeShifts.forEach((shift) => {
    const status = shift.status || "assigned";
    const shiftDate = getShiftLocalDate(shift) || shift.date || "Unscheduled";
    const hours = getShiftDurationHours(shift);
    const recruiter = recruiterById.get(String(shift.recruiter_id));
    const employeeName = recruiter?.name || shift.recruiter_name || `Employee ${shift.recruiter_id || "unknown"}`;
    const departmentId = shift.department_id || recruiter?.department_id || "unassigned";
    const departmentName =
      shift.department_name ||
      departmentById.get(String(departmentId))?.name ||
      recruiter?.department_name ||
      "Unassigned";
    const entry = timeEntriesMap[String(shift.id)] || {};
    const roster = rosterMap[String(shift.id)] || {};
    const isCancelled = status === "cancelled";
    const isTimeOff = shift.on_leave === true || Boolean(shift.leave_id);
    const isAssigned = ["assigned", "accepted", "in_progress", "completed"].includes(status) && !isCancelled;
    const isOpen = !shift.recruiter_id || status === "open" || status === "unassigned" || status === "pending";
    const breakMissing = Boolean(entry.break_non_compliant || entry.break_missing_minutes || shift.break_missing_minutes);
    const inProgress = roster.status === "in_progress" || entry.status === "in_progress" || status === "in_progress";
    const overtimeRisk = Boolean(shift.overtime_risk || shift.overtime);
    const templateName = shift.template_name || shift.shift_template_name || shift.template_label || shift.selectedTemplate || null;

    summary.assigned += isAssigned ? 1 : 0;
    summary.open += isOpen ? 1 : 0;
    summary.cancelled += isCancelled ? 1 : 0;
    summary.timeOff += isTimeOff ? 1 : 0;
    summary.missingBreak += breakMissing ? 1 : 0;
    summary.inProgress += inProgress ? 1 : 0;
    summary.overtimeRisk += overtimeRisk ? 1 : 0;
    summary.affectedByLeave += isTimeOff ? 1 : 0;
    summary.restoredOrRestorable += shift.shift_restoration?.restorable || shift.restored_from_leave ? 1 : 0;
    summary.totalHours += hours;

    const day = byDay.get(shiftDate) || { date: shiftDate, scheduled: 0, assigned: 0, open: 0, cancelled: 0, timeOff: 0 };
    day.scheduled += 1;
    day.assigned += isAssigned ? 1 : 0;
    day.open += isOpen ? 1 : 0;
    day.cancelled += isCancelled ? 1 : 0;
    day.timeOff += isTimeOff ? 1 : 0;
    byDay.set(shiftDate, day);

    const dept = byDepartment.get(String(departmentId)) || {
      key: String(departmentId),
      name: departmentName,
      total: 0,
      assigned: 0,
      open: 0,
      cancelledOrTimeOff: 0,
      hours: 0,
    };
    dept.total += 1;
    dept.assigned += isAssigned ? 1 : 0;
    dept.open += isOpen ? 1 : 0;
    dept.cancelledOrTimeOff += isCancelled || isTimeOff ? 1 : 0;
    dept.hours += hours;
    byDepartment.set(String(departmentId), dept);

    const employee = byEmployee.get(String(shift.recruiter_id || employeeName)) || {
      key: String(shift.recruiter_id || employeeName),
      name: employeeName,
      assigned: 0,
      hours: 0,
      overtimeRisk: 0,
      timeOff: 0,
      inProgress: 0,
    };
    employee.assigned += isAssigned ? 1 : 0;
    employee.hours += hours;
    employee.overtimeRisk += overtimeRisk ? 1 : 0;
    employee.timeOff += isTimeOff ? 1 : 0;
    employee.inProgress += inProgress ? 1 : 0;
    byEmployee.set(employee.key, employee);

    if (isTimeOff) {
      const leaveType = shift.leave_display_label || shift.leave_type || "Time off";
      const leave = byLeaveType.get(leaveType) || { label: leaveType, count: 0, hours: 0 };
      leave.count += 1;
      leave.hours += hours;
      byLeaveType.set(leaveType, leave);
    }

    if (templateName) {
      const template = byTemplate.get(templateName) || { label: templateName, count: 0, assigned: 0, open: 0, hours: 0 };
      template.count += 1;
      template.assigned += isAssigned ? 1 : 0;
      template.open += isOpen ? 1 : 0;
      template.hours += hours;
      byTemplate.set(templateName, template);
    }
  });

  const trend = Array.from(byDay.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const departmentsRows = Array.from(byDepartment.values()).sort((a, b) => b.total - a.total);
  const employeeRows = Array.from(byEmployee.values()).sort((a, b) => b.hours - a.hours);
  const leaveRows = Array.from(byLeaveType.values()).sort((a, b) => b.count - a.count);
  const templateRows = Array.from(byTemplate.values()).sort((a, b) => b.count - a.count);
  const pressureRows = [
    ...departmentsRows.filter((row) => row.open > 0).map((row) => ({
      key: `dept-open-${row.key}`,
      label: row.name,
      value: `${row.open} open shift${row.open === 1 ? "" : "s"}`,
      help: "Department has uncovered scheduling work.",
      tone: "warning",
    })),
    ...employeeRows.filter((row) => row.hours >= 40).map((row) => ({
      key: `employee-hours-${row.key}`,
      label: row.name,
      value: fmtShiftHours(row.hours),
      help: "High scheduled workload in this range.",
      tone: "info",
    })),
    ...trend.filter((row) => row.open > 0).map((row) => ({
      key: `day-open-${row.date}`,
      label: row.date,
      value: `${row.open} open`,
      help: "Day has uncovered shifts.",
      tone: "warning",
    })),
  ].slice(0, 8);

  return { summary, trend, departmentsRows, employeeRows, leaveRows, templateRows, pressureRows };
};

const getRecruiterHourlyRate = (recruiter) => {
  if (!recruiter) return 0;
  const raw =
    recruiter.hourly_rate ??
    recruiter.pay_rate ??
    recruiter.rate ??
    recruiter.base_rate ??
    recruiter.default_hourly_rate ??
    recruiter.default_rate;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getShiftCostBucket = (date, groupBy) => {
  const parsed = DateTime.fromISO(String(date || ""));
  if (!parsed.isValid) return date || "Unscheduled";
  if (groupBy === "week") return parsed.startOf("week").toISODate();
  if (groupBy === "month") return parsed.startOf("month").toISODate();
  return parsed.toISODate();
};

const getShiftCostInsights = ({ shifts = [], recruiters = [], departments = [], groupBy = "day", costSlice = "all" }) => {
  const recruiterById = new Map(recruiters.map((recruiter) => [String(recruiter.id), recruiter]));
  const departmentById = new Map(departments.map((department) => [String(department.id), department]));
  const byDay = new Map();
  const byDepartment = new Map();
  const byEmployee = new Map();
  const activeShifts = shifts.filter((shift) => shift && shift.status !== "deleted");
  const hoursByEmployee = new Map();
  activeShifts.forEach((shift) => {
    if (!shift?.recruiter_id) return;
    const key = String(shift.recruiter_id);
    hoursByEmployee.set(key, (hoursByEmployee.get(key) || 0) + getShiftDurationHours(shift));
  });
  const summary = {
    scheduledCost: 0,
    assignedCost: 0,
    timeOffCost: 0,
    cancelledCost: 0,
    scheduledHours: 0,
    assignedHours: 0,
    openHours: 0,
    timeOffHours: 0,
    missingRateShifts: 0,
    unassignedShifts: 0,
    overtimeExposureHours: 0,
  };

  const slicedShifts = activeShifts.filter((shift) => {
    const status = shift.status || "assigned";
    const recruiter = recruiterById.get(String(shift.recruiter_id));
    const rate = getRecruiterHourlyRate(recruiter);
    const isCancelled = status === "cancelled";
    const isTimeOff = shift.on_leave === true || Boolean(shift.leave_id);
    const isOpen = !shift.recruiter_id || status === "open" || status === "unassigned" || status === "pending";
    if (costSlice === "assigned") return !isOpen && !isCancelled;
    if (costSlice === "time_off") return isTimeOff;
    if (costSlice === "cancelled") return isCancelled;
    if (costSlice === "open") return isOpen;
    if (costSlice === "missing_rates") return Boolean(shift.recruiter_id && !rate);
    if (costSlice === "overtime_exposure") return shift.recruiter_id && Number(hoursByEmployee.get(String(shift.recruiter_id)) || 0) > 40;
    return true;
  });

  slicedShifts.forEach((shift) => {
    const status = shift.status || "assigned";
    const hours = getShiftDurationHours(shift);
    const recruiter = recruiterById.get(String(shift.recruiter_id));
    const rate = getRecruiterHourlyRate(recruiter);
    const cost = hours * rate;
    const isCancelled = status === "cancelled";
    const isTimeOff = shift.on_leave === true || Boolean(shift.leave_id);
    const isOpen = !shift.recruiter_id || status === "open" || status === "unassigned" || status === "pending";
    const isAssigned = !isOpen && !isCancelled;
    const shiftDate = getShiftCostBucket(getShiftLocalDate(shift) || shift.date || "Unscheduled", groupBy);
    const employeeName = recruiter?.name || shift.recruiter_name || (shift.recruiter_id ? `Employee ${shift.recruiter_id}` : "Unassigned");
    const departmentId = shift.department_id || recruiter?.department_id || "unassigned";
    const departmentName =
      shift.department_name ||
      departmentById.get(String(departmentId))?.name ||
      recruiter?.department_name ||
      "Unassigned";

    summary.scheduledHours += hours;
    summary.scheduledCost += cost;
    summary.assignedHours += isAssigned ? hours : 0;
    summary.assignedCost += isAssigned ? cost : 0;
    summary.openHours += isOpen ? hours : 0;
    summary.timeOffHours += isTimeOff ? hours : 0;
    summary.timeOffCost += isTimeOff ? cost : 0;
    summary.cancelledCost += isCancelled ? cost : 0;
    summary.unassignedShifts += isOpen ? 1 : 0;
    summary.missingRateShifts += shift.recruiter_id && !rate ? 1 : 0;

    const day = byDay.get(shiftDate) || { date: shiftDate, cost: 0, hours: 0, assignedCost: 0, timeOffCost: 0, openHours: 0 };
    day.cost += cost;
    day.hours += hours;
    day.assignedCost += isAssigned ? cost : 0;
    day.timeOffCost += isTimeOff ? cost : 0;
    day.openHours += isOpen ? hours : 0;
    byDay.set(shiftDate, day);

    const dept = byDepartment.get(String(departmentId)) || {
      key: String(departmentId),
      name: departmentName,
      cost: 0,
      hours: 0,
      assignedCost: 0,
      timeOffCost: 0,
      openHours: 0,
      missingRateShifts: 0,
    };
    dept.cost += cost;
    dept.hours += hours;
    dept.assignedCost += isAssigned ? cost : 0;
    dept.timeOffCost += isTimeOff ? cost : 0;
    dept.openHours += isOpen ? hours : 0;
    dept.missingRateShifts += shift.recruiter_id && !rate ? 1 : 0;
    byDepartment.set(String(departmentId), dept);

    const employee = byEmployee.get(String(shift.recruiter_id || employeeName)) || {
      key: String(shift.recruiter_id || employeeName),
      name: employeeName,
      departmentName,
      cost: 0,
      hours: 0,
      rate,
      shiftCount: 0,
      timeOffHours: 0,
      missingRate: Boolean(shift.recruiter_id && !rate),
    };
    employee.cost += cost;
    employee.hours += hours;
    employee.rate = employee.rate || rate;
    employee.shiftCount += 1;
    employee.timeOffHours += isTimeOff ? hours : 0;
    employee.missingRate = employee.missingRate || Boolean(shift.recruiter_id && !rate);
    byEmployee.set(String(shift.recruiter_id || employeeName), employee);
  });

  const employeeRows = Array.from(byEmployee.values()).sort((a, b) => b.cost - a.cost || b.hours - a.hours);
  summary.overtimeExposureHours = employeeRows.reduce((sum, row) => sum + Math.max(Number(row.hours || 0) - 40, 0), 0);

  return {
    summary,
    trend: Array.from(byDay.values()).sort((a, b) => String(a.date).localeCompare(String(b.date))),
    departmentsRows: Array.from(byDepartment.values()).sort((a, b) => b.cost - a.cost || b.hours - a.hours),
    employeeRows,
  };
};

const ShiftInsightKpi = ({ label, value, help, tone = "default" }) => {
  const colors = shiftInsightTone[tone] || shiftInsightTone.default;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.35,
        borderRadius: "6px",
        height: "100%",
        bgcolor: "rgba(255,255,255,0.92)",
        borderColor: "rgba(148, 163, 184, 0.2)",
        background: `linear-gradient(145deg, ${colors.soft}, rgba(255,255,255,0.96))`,
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Stack spacing={0.45}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 900, letterSpacing: 0.8, lineHeight: 1.2 }}>
            {label}
          </Typography>
          <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: colors.main, boxShadow: `0 0 0 3px ${colors.soft}` }} />
        </Stack>
        <Typography variant="h3" fontWeight={950} sx={{ color: colors.main, lineHeight: 1 }}>
          {value}
        </Typography>
        {help && (
          <Typography variant="caption" color="text.secondary">
            {help}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

const ShiftInsightSection = ({ title, description, children, accent = "default" }) => {
  const colors = shiftInsightTone[accent] || shiftInsightTone.default;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 1,
        height: "100%",
        bgcolor: "background.paper",
        borderColor: accent === "warning" ? colors.border : "rgba(148, 163, 184, 0.2)",
        boxShadow: accent === "warning" ? "0 16px 38px rgba(180, 83, 9, 0.07)" : "0 12px 30px rgba(15, 23, 42, 0.035)",
      }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={900}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
};

const MiniCoverageTrend = ({ rows }) => {
  const visible = rows.slice(0, 14);
  const max = Math.max(1, ...visible.map((row) => row.scheduled || 0));
  if (!visible.length) {
    return <Typography variant="body2" color="text.secondary">No shift data in this range.</Typography>;
  }
  return (
    <Stack spacing={1.75}>
      <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
        {[
          ["Assigned", "#15803d"],
          ["Open", "#b45309"],
          ["Cancelled", "#b91c1c"],
          ["Time off", "#64748b"],
        ].map(([label, color]) => (
          <Stack key={label} direction="row" spacing={0.65} alignItems="center">
            <Box sx={{ width: 9, height: 9, borderRadius: 999, bgcolor: color }} />
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${visible.length}, minmax(34px, 1fr))`,
          gap: 1,
          alignItems: "end",
          minHeight: 210,
          px: 0.5,
        }}
      >
      {visible.map((row) => (
        <Stack key={row.date} spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
          <Stack
            justifyContent="flex-end"
            sx={{
              height: 162,
              width: "100%",
              maxWidth: 42,
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "rgba(148, 163, 184, 0.14)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            {[
              ["assigned", row.assigned, "#15803d"],
              ["open", row.open, "#b45309"],
              ["cancelled", row.cancelled, "#b91c1c"],
              ["timeOff", row.timeOff, "#64748b"],
            ].map(([key, value, color]) => (
              <Box
                key={key}
                title={`${readableShiftLabel(key)}: ${value}`}
                sx={{
                  height: `${Math.max((Number(value || 0) / max) * 100, value ? 5 : 0)}%`,
                  minHeight: value ? 4 : 0,
                  bgcolor: color,
                }}
              />
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ writingMode: visible.length > 9 ? "vertical-rl" : "initial", fontWeight: 700 }}>
            {formatShiftInsightDateLabel(row.date)}
          </Typography>
          <Typography variant="caption" fontWeight={900}>
            {row.scheduled}
          </Typography>
        </Stack>
      ))}
      </Box>
    </Stack>
  );
};

const ShiftCompositionBar = ({ items }) => {
  const total = Math.max(1, items.reduce((sum, item) => sum + Number(item.value || 0), 0));
  return (
    <Stack spacing={1.1}>
      <Stack direction="row" sx={{ height: 16, borderRadius: 1, overflow: "hidden", bgcolor: "rgba(148, 163, 184, 0.13)" }}>
        {items
          .filter((item) => item.value > 0)
          .map((item) => (
            <Box key={item.label} sx={{ width: `${(item.value / total) * 100}%`, bgcolor: item.color }} />
          ))}
      </Stack>
      <Stack spacing={0.75}>
        {items.map((item) => (
          <Stack key={item.label} direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Box sx={{ width: 9, height: 9, borderRadius: 999, bgcolor: item.color }} />
              <Typography variant="body2" fontWeight={850}>
                {item.label}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              {Math.round((Number(item.value || 0) / total) * 100)}% · {item.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

const MiniCostTrend = ({ rows }) => {
  const visible = rows.slice(0, 14);
  const max = Math.max(1, ...visible.map((row) => Number(row.cost || 0)));
  if (!visible.length) {
    return <ShiftInsightEmptyState>No scheduled cost data in this range.</ShiftInsightEmptyState>;
  }
  return (
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {[
          ["Estimated cost", "#2563eb"],
          ["Time-off cost", "#64748b"],
          ["Open hours", "#b45309"],
        ].map(([label, color]) => (
          <Stack key={label} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 9, height: 9, borderRadius: 999, bgcolor: color }} />
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${visible.length}, minmax(36px, 1fr))`,
          gap: 1,
          alignItems: "end",
          minHeight: 220,
        }}
      >
        {visible.map((row) => (
          <Stack key={row.date} spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
            <Stack
              justifyContent="flex-end"
              sx={{
                height: 156,
                width: "100%",
                maxWidth: 44,
                borderRadius: 1,
                overflow: "hidden",
                bgcolor: "rgba(148, 163, 184, 0.13)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              <Box
                title={`Estimated cost: ${fmtShiftMoney(row.cost)}`}
                sx={{
                  height: `${Math.max((Number(row.cost || 0) / max) * 100, row.cost ? 6 : 0)}%`,
                  minHeight: row.cost ? 6 : 0,
                  bgcolor: "#2563eb",
                }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ writingMode: visible.length > 9 ? "vertical-rl" : "initial", fontWeight: 700 }}>
              {formatShiftInsightDateLabel(row.date)}
            </Typography>
            <Typography variant="caption" fontWeight={900}>
              {fmtShiftMoney(row.cost)}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Stack>
  );
};

const ShiftInsightEmptyState = ({ children }) => (
  <Box
    sx={{
      py: 1,
      px: 1.25,
      borderRadius: 1,
      bgcolor: "rgba(148, 163, 184, 0.08)",
      color: "text.secondary",
    }}
  >
    <Typography variant="caption">{children}</Typography>
  </Box>
);

const RankedBarList = ({
  rows,
  valueKey = "hours",
  labelKey = "name",
  valueFormatter = fmtShiftHours,
  color = "#2563eb",
  emptyText = "No data available.",
}) => {
  const visible = rows.slice(0, 8);
  const max = Math.max(1, ...visible.map((row) => Number(row[valueKey] || 0)));
  if (!visible.length) {
    return <ShiftInsightEmptyState>{emptyText}</ShiftInsightEmptyState>;
  }
  return (
    <Stack spacing={1.15}>
      {visible.map((row) => {
        const value = Number(row[valueKey] || 0);
        return (
          <Box key={row.key || row.label || row[labelKey]}>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Typography variant="body2" fontWeight={850} noWrap>
                {row[labelKey] || row.label}
              </Typography>
              <Typography variant="body2" fontWeight={900}>
                {valueFormatter(value, row)}
              </Typography>
            </Stack>
            <Box sx={{ mt: 0.55, height: 9, borderRadius: 1, bgcolor: "rgba(148, 163, 184, 0.16)", overflow: "hidden" }}>
              <Box sx={{ width: `${Math.max((value / max) * 100, value ? 6 : 0)}%`, height: "100%", bgcolor: color }} />
            </Box>
            {row.caption && (
              <Typography variant="caption" color="text.secondary">
                {row.caption}
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
};

const InsightStrip = ({ insights }) => (
  <Grid container spacing={1.25}>
    {insights.map((item) => {
      const colors = shiftInsightTone[item.tone] || shiftInsightTone.default;
      return (
        <Grid item xs={12} md={6} xl={3} key={item.label}>
          <Paper variant="outlined" sx={{ p: 1.2, borderRadius: "6px", borderColor: "rgba(148, 163, 184, 0.2)", bgcolor: colors.soft }}>
            <Typography variant="body2" fontWeight={900} sx={{ color: colors.main }}>
              {item.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.help}
            </Typography>
          </Paper>
        </Grid>
      );
    })}
  </Grid>
);

const ShiftInsightsPanel = ({
  insights,
  departments = [],
  recruiters = [],
  selectedDepartment,
  setSelectedDepartment,
  selectedRecruiters,
  setSelectedRecruiters,
  selectedMonth,
  dateRange,
  handleMonthChange,
  statusFilter,
  setStatusFilter,
  onRangePreset,
  onResetFilters,
  onRefresh,
}) => {
  const { summary, trend, departmentsRows, employeeRows, leaveRows, templateRows, pressureRows } = insights;
  const compositionItems = [
    { label: "Assigned", value: summary.assigned, color: "#15803d" },
    { label: "Open", value: summary.open, color: "#b45309" },
    { label: "Cancelled", value: summary.cancelled, color: "#b91c1c" },
    { label: "Time off", value: summary.timeOff, color: "#64748b" },
  ];
  const insightRows = [
    summary.open
      ? { label: `${summary.open} open shift${summary.open === 1 ? "" : "s"}`, help: "Coverage needs manager attention.", tone: "warning" }
      : { label: "No open shifts", help: "Coverage is assigned for the selected filters.", tone: "success" },
    summary.timeOff
      ? { label: `${summary.timeOff} time-off shift${summary.timeOff === 1 ? "" : "s"}`, help: "Approved leave is affecting scheduled coverage.", tone: "muted" }
      : { label: "No schedule-context time off", help: "No OFF shift impact in this view.", tone: "success" },
    summary.missingBreak
      ? { label: `${summary.missingBreak} break issue${summary.missingBreak === 1 ? "" : "s"}`, help: "Review missing or non-compliant break signals.", tone: "warning" }
      : { label: "No break issues", help: "No missing break signal in this range.", tone: "success" },
    employeeRows[0]
      ? { label: `${employeeRows[0].name} has highest hours`, help: `${fmtShiftHours(employeeRows[0].hours)} scheduled in this range.`, tone: employeeRows[0].hours >= 40 ? "info" : "default" }
      : { label: "No employee workload", help: "No scheduled work in this filter range.", tone: "default" },
  ];
  const departmentVisualRows = departmentsRows.map((row) => ({
    ...row,
    caption: `${row.total} total · ${row.assigned} assigned · ${row.open} open · ${row.cancelledOrTimeOff} cancelled/off`,
  }));
  const employeeVisualRows = employeeRows.map((row) => ({
    ...row,
    caption: `${row.assigned} assigned · ${row.timeOff} off · ${row.inProgress} in progress · ${row.overtimeRisk} overtime risk`,
  }));
  const leaveVisualRows = leaveRows.map((row) => ({
    ...row,
    key: row.label,
    name: readableShiftLabel(row.label),
    caption: `${row.count} shift${row.count === 1 ? "" : "s"} affected`,
  }));
  const pressureVisualRows = pressureRows.map((row) => ({
    ...row,
    name: row.label,
    count: Number.parseFloat(String(row.value).replace(/[^\d.]/g, "")) || 1,
    caption: row.help,
  }));
  const riskVisualRows = [
    { key: "open", name: "Open shifts", value: summary.open, caption: "Uncovered work in the selected range." },
    { key: "breaks", name: "Missing breaks", value: summary.missingBreak, caption: "Break defaults or clocked break issues." },
    { key: "overtime", name: "Overtime risk", value: summary.overtimeRisk, caption: "Signals already present on shift rows." },
    { key: "leave", name: "Leave-affected shifts", value: summary.affectedByLeave, caption: "Approved leave with schedule context." },
    { key: "restorable", name: "Restoration signals", value: summary.restoredOrRestorable, caption: "Shift restoration signal where available." },
  ];
  const templateVisualRows = templateRows.map((row) => ({
    ...row,
    key: row.label,
    name: row.label,
    caption: `${fmtShiftHours(row.hours)} · ${row.assigned} assigned · ${row.open} open`,
  }));
  const selectedDepartmentName =
    toArray(departments).find((dept) => String(dept.id) === String(selectedDepartment))?.name || "All departments";
  const employeeSelectionLabel = selectedRecruiters.length
    ? `${selectedRecruiters.length} employee${selectedRecruiters.length === 1 ? "" : "s"} selected`
    : "All employees";
  const statusLabel = statusFilter === "all" ? "All statuses" : `${readableShiftLabel(statusFilter)} only`;
  const monthLabel = selectedMonth
    ? DateTime.fromFormat(selectedMonth, "yyyy-MM").toFormat("LLLL yyyy")
    : "Current range";
  const activeFilterChips = [
    monthLabel,
    dateRange?.start && dateRange?.end ? `${dateRange.start} to ${dateRange.end}` : null,
    selectedDepartmentName,
    employeeSelectionLabel,
    statusLabel,
  ].filter(Boolean);

  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: "6px",
          bgcolor: "background.paper",
          borderColor: "rgba(148, 163, 184, 0.32)",
          boxShadow: "0 14px 34px rgba(15, 23, 42, 0.04)",
        }}
      >
        <Stack spacing={1.75}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "flex-start" }} spacing={1.5}>
            <Box>
              <Typography variant="subtitle1" fontWeight={900}>
                Shift insight controls
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shared schedule filters for analytics, coverage health, and exception reporting.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", md: "flex-end" }}>
              <Button size="small" variant="outlined" onClick={onRefresh}>
                Refresh
              </Button>
              <Button size="small" variant="text" color="inherit" onClick={onResetFilters}>
                Reset filters
              </Button>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" variant="outlined" onClick={() => onRangePreset("this_week")}>
              This week
            </Button>
            <Button size="small" variant="outlined" onClick={() => onRangePreset("next_7_days")}>
              Next 7 days
            </Button>
            <Button size="small" variant="outlined" onClick={() => onRangePreset("this_month")}>
              This month
            </Button>
            <Button size="small" variant="outlined" onClick={() => onRangePreset("next_month")}>
              Next month
            </Button>
          </Stack>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2.5}>
              <ThemedMonthField
                label="Month"
                value={selectedMonth}
                onChange={(event) => handleMonthChange(event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={selectedDepartment}
                  label="Department"
                  onChange={(event) => setSelectedDepartment(event.target.value)}
                >
                  <MenuItem value="">
                    <em>All departments</em>
                  </MenuItem>
                  {toArray(departments).map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  multiple
                  value={selectedRecruiters}
                  onChange={(event) => setSelectedRecruiters(event.target.value)}
                  input={<OutlinedInput label="Employee" />}
                  renderValue={(selected) =>
                    selected.length
                      ? `${selected.length} employee${selected.length === 1 ? "" : "s"} selected`
                      : "All employees"
                  }
                >
                  {recruiters.map((recruiter) => (
                    <MenuItem key={recruiter.id} value={recruiter.id}>
                      <Checkbox checked={selectedRecruiters.indexOf(recruiter.id) > -1} />
                      <ListItemText primary={recruiter.name} secondary={recruiter.display_role} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(event) => setStatusFilter(event.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {activeFilterChips.map((label) => (
              <Chip key={label} size="small" label={label} variant="outlined" sx={{ bgcolor: "rgba(15, 23, 42, 0.03)", fontWeight: 750 }} />
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Alert severity="info" variant="outlined" sx={{ py: 0.75, borderColor: "rgba(59, 130, 246, 0.2)" }}>
        Read-only dashboard reflecting the current schedule filters and range. Scheduling behavior, drag/drop, Smart Shift, booking, and payroll formulas are unchanged.
      </Alert>

      <InsightStrip insights={insightRows} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="Scheduled shifts" value={summary.scheduled} help={fmtShiftHours(summary.totalHours)} tone="info" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="Assigned shifts" value={summary.assigned} help="Active work coverage" tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="Open shifts" value={summary.open} help="Needs coverage" tone={summary.open ? "warning" : "muted"} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="Cancelled shifts" value={summary.cancelled} help="Removed from active work" tone={summary.cancelled ? "danger" : "muted"} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="Time off" value={summary.timeOff} help="Approved leave with shift context" tone="muted" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="Overtime risk" value={summary.overtimeRisk} help="Signals already present on shift rows" tone={summary.overtimeRisk ? "warning" : "muted"} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="Missing breaks" value={summary.missingBreak} help="Break defaults or clocked break issues" tone={summary.missingBreak ? "warning" : "muted"} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="In progress" value={summary.inProgress} help="Roster/time-entry active now" tone={summary.inProgress ? "success" : "muted"} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <ShiftInsightSection
            title="Coverage trend"
            description="Scheduled, assigned, open, cancelled, and time-off mix by day in the selected range."
            accent={summary.open ? "warning" : "success"}
          >
            <MiniCoverageTrend rows={trend} />
          </ShiftInsightSection>
        </Grid>
        <Grid item xs={12} lg={4}>
          <ShiftInsightSection
            title="Coverage health composition"
            description="Assigned, open, cancelled, and time-off mix."
            accent={summary.open ? "warning" : "info"}
          >
            <ShiftCompositionBar items={compositionItems} />
          </ShiftInsightSection>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <ShiftInsightSection title="Department coverage breakdown" description="Coverage concentration by department." accent="info">
            <RankedBarList rows={departmentVisualRows} valueKey="hours" labelKey="name" color="#2563eb" emptyText="No department coverage data." />
          </ShiftInsightSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <ShiftInsightSection title="Employee workload summary" description="Assigned shifts, scheduled hours, time off, and active work by employee." accent={employeeRows.some((row) => row.hours >= 40) ? "warning" : "success"}>
            <RankedBarList rows={employeeVisualRows} valueKey="hours" labelKey="name" color="#15803d" emptyText="No employee workload data." />
          </ShiftInsightSection>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <ShiftInsightSection title="Time-off impact on schedule" description="Approved leave and manager-entered time off visible through shift context." accent="muted">
            <RankedBarList
              rows={leaveVisualRows}
              valueKey="count"
              labelKey="name"
              valueFormatter={(value, row) => `${value} · ${fmtShiftHours(row.hours)}`}
              color="#64748b"
              emptyText="No schedule-context time off in this range."
            />
          </ShiftInsightSection>
        </Grid>
        <Grid item xs={12} md={4}>
          <ShiftInsightSection title="Exception / risk summary" description="Warning signals already available in current shift data." accent={summary.open || summary.missingBreak || summary.overtimeRisk ? "warning" : "success"}>
            <RankedBarList
              rows={riskVisualRows}
              valueKey="value"
              labelKey="name"
              valueFormatter={(value) => value}
              color={summary.open || summary.missingBreak || summary.overtimeRisk ? "#b45309" : "#15803d"}
              emptyText="No major risk signals in this range."
            />
          </ShiftInsightSection>
        </Grid>
        <Grid item xs={12} md={4}>
          <ShiftInsightSection title="Coverage pressure summary" description="The most visible places where manager review may be needed." accent={pressureRows.length ? "warning" : "success"}>
            <RankedBarList
              rows={pressureVisualRows}
              valueKey="count"
              labelKey="name"
              valueFormatter={(value, row) => row.value}
              color={pressureRows.length ? "#b45309" : "#15803d"}
              emptyText="No major coverage pressure in this range."
            />
          </ShiftInsightSection>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ShiftInsightSection title="Template distribution" description="Shown when current shift rows expose template names." accent="info">
            <RankedBarList
              rows={templateVisualRows}
              valueKey="count"
              labelKey="name"
              valueFormatter={(value) => value}
              color="#7c3aed"
              emptyText="Template data is not available on the current shift rows."
            />
          </ShiftInsightSection>
        </Grid>
      </Grid>
    </Stack>
  );
};

const costSliceOptions = [
  { value: "all", label: "All cost" },
  { value: "assigned", label: "Assigned cost" },
  { value: "time_off", label: "Time-off cost" },
  { value: "cancelled", label: "Cancelled cost" },
  { value: "open", label: "Open cost exposure" },
  { value: "missing_rates", label: "Missing rates" },
  { value: "overtime_exposure", label: "Overtime exposure" },
];

const costViewOptions = [
  { value: "department", label: "Department" },
  { value: "employee", label: "Employee" },
  { value: "risk", label: "Risk" },
];

const WorkforceCostInsightsPanel = ({
  insights,
  costSlice,
  setCostSlice,
  costGroupBy,
  setCostGroupBy,
  costViewBy,
  setCostViewBy,
  dateRange,
  selectedMonth,
  onRangePreset,
  onDateRangeChange,
  onResetFilters,
  onOpenAnalytics,
}) => {
  const { summary, trend, departmentsRows, employeeRows } = insights;
  const selectedSliceLabel = costSliceOptions.find((option) => option.value === costSlice)?.label || "All cost";
  const selectedViewLabel = costViewOptions.find((option) => option.value === costViewBy)?.label || "Department";
  const selectedMonthLabel = selectedMonth ? DateTime.fromFormat(selectedMonth, "yyyy-MM").toFormat("LLLL yyyy") : "Current range";
  const costMixItems = [
    { label: "Assigned cost", value: summary.assignedCost, color: "#2563eb" },
    { label: "Time-off cost", value: summary.timeOffCost, color: "#64748b" },
    { label: "Cancelled cost", value: summary.cancelledCost, color: "#b91c1c" },
  ];
  const insightRows = [
    summary.scheduledCost
      ? { label: `${fmtShiftMoney(summary.scheduledCost)} scheduled cost`, help: `${fmtShiftHours(summary.scheduledHours)} in the selected schedule view.`, tone: "info" }
      : { label: "No scheduled cost", help: "No rated scheduled shifts in the selected view.", tone: "muted" },
    summary.missingRateShifts
      ? { label: `${summary.missingRateShifts} missing rate${summary.missingRateShifts === 1 ? "" : "s"}`, help: "Cost estimates are incomplete until employee rates are set.", tone: "warning" }
      : { label: "Rates available", help: "No missing employee rate signal in this slice.", tone: "success" },
    summary.openHours
      ? { label: `${fmtShiftHours(summary.openHours)} open`, help: "Open shifts are not fully costed until assigned.", tone: "warning" }
      : { label: "No open cost exposure", help: "All scheduled hours are assigned in this slice.", tone: "success" },
    summary.overtimeExposureHours
      ? { label: `${fmtShiftHours(summary.overtimeExposureHours)} over 40h`, help: "Schedule exposure only; payroll remains source of truth.", tone: "warning" }
      : { label: "No overtime exposure", help: "No employee exceeds 40 scheduled hours in this slice.", tone: "success" },
  ];
  const departmentVisualRows = departmentsRows.map((row) => ({
    ...row,
    caption: `${fmtShiftHours(row.hours)} · open ${fmtShiftHours(row.openHours)} · time off ${fmtShiftMoney(row.timeOffCost)}${row.missingRateShifts ? ` · ${row.missingRateShifts} missing rate` : ""}`,
  }));
  const employeeVisualRows = employeeRows.map((row) => ({
    ...row,
    caption: `${fmtShiftHours(row.hours)} · ${row.shiftCount} shift${row.shiftCount === 1 ? "" : "s"} · rate ${row.rate ? `${fmtShiftMoney(row.rate)}/h` : "not set"}${row.timeOffHours ? ` · off ${fmtShiftHours(row.timeOffHours)}` : ""}`,
  }));
  const riskRows = [
    { key: "missing-rate", name: "Missing employee rates", value: summary.missingRateShifts, caption: "Estimated cost cannot be complete without rates." },
    { key: "open-hours", name: "Open shift hours", value: summary.openHours, caption: "Open work is not fully costed until assigned." },
    { key: "overtime-exposure", name: "Over 40 scheduled hours", value: summary.overtimeExposureHours, caption: "Scheduling exposure only, not payroll truth." },
    { key: "time-off-cost", name: "Time-off cost visibility", value: summary.timeOffCost, caption: "Approved leave with schedule context." },
  ];

  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: "6px",
          borderColor: "rgba(148, 163, 184, 0.28)",
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={1.5}>
            <Box>
              <Typography variant="subtitle1" fontWeight={950}>
                Cost insight filters
              </Typography>
              <Typography variant="caption" color="text.secondary">
                These controls affect the schedule-based cost estimate only.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button size="small" onClick={() => onRangePreset("today")}>Today</Button>
              <Button size="small" onClick={() => onRangePreset("this_week")}>This week</Button>
              <Button size="small" onClick={() => onRangePreset("next_7")}>Next 7 days</Button>
              <Button size="small" onClick={() => onRangePreset("this_month")}>This month</Button>
              <Button size="small" onClick={() => onRangePreset("next_month")}>Next month</Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setCostSlice("all");
                  setCostGroupBy("day");
                  setCostViewBy("department");
                  onResetFilters();
                }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={2.4}>
              <ThemedDateField
                fullWidth
                size="small"
                label="From"
                value={dateRange?.start || ""}
                onChange={(event) => onDateRangeChange("start", event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <ThemedDateField
                fullWidth
                size="small"
                label="To"
                value={dateRange?.end || ""}
                onChange={(event) => onDateRangeChange("end", event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField select fullWidth size="small" label="Group by" value={costGroupBy} onChange={(event) => setCostGroupBy(event.target.value)}>
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField select fullWidth size="small" label="Cost slice" value={costSlice} onChange={(event) => setCostSlice(event.target.value)}>
                {costSliceOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField select fullWidth size="small" label="View by" value={costViewBy} onChange={(event) => setCostViewBy(event.target.value)}>
                {costViewOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={selectedMonthLabel} variant="outlined" />
            <Chip size="small" label={`${dateRange?.start || "—"} to ${dateRange?.end || "—"}`} variant="outlined" />
            <Chip size="small" label={selectedSliceLabel} color={costSlice === "all" ? "default" : "primary"} variant="outlined" />
            <Chip size="small" label={`Grouped by ${readableShiftLabel(costGroupBy)}`} variant="outlined" />
            <Chip size="small" label={`View by ${selectedViewLabel}`} variant="outlined" />
          </Stack>
        </Stack>
      </Paper>

      <Alert severity="info" variant="outlined" sx={{ py: 0.75 }}>
        Schedule-based estimate using the current Shift Management filters and employee rate fields already loaded on this page. Payroll formulas and workforce analytics truth are unchanged.
      </Alert>

      <InsightStrip insights={insightRows} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="Scheduled cost" value={fmtShiftMoney(summary.scheduledCost)} help={fmtShiftHours(summary.scheduledHours)} tone="info" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="Assigned cost" value={fmtShiftMoney(summary.assignedCost)} help={fmtShiftHours(summary.assignedHours)} tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="Time-off cost" value={fmtShiftMoney(summary.timeOffCost)} help={fmtShiftHours(summary.timeOffHours)} tone="muted" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ShiftInsightKpi label="Missing rates" value={summary.missingRateShifts} help="Set employee rates for cleaner estimates" tone={summary.missingRateShifts ? "warning" : "success"} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <ShiftInsightSection title="Scheduled cost trend" description="Estimated scheduled labor cost by date in the selected range." accent={summary.missingRateShifts ? "warning" : "info"}>
            <MiniCostTrend rows={trend} />
          </ShiftInsightSection>
        </Grid>
        <Grid item xs={12} lg={4}>
          <ShiftInsightSection title="Cost health composition" description="Assigned, time-off, and cancelled schedule cost mix." accent="info">
            <ShiftCompositionBar items={costMixItems} />
          </ShiftInsightSection>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {(costViewBy === "department" || costViewBy === "risk") && (
        <Grid item xs={12} md={costViewBy === "department" ? 6 : 12}>
          <ShiftInsightSection title="Department cost breakdown" description="Estimated schedule cost concentration by department." accent="info">
            <RankedBarList rows={departmentVisualRows} valueKey="cost" labelKey="name" valueFormatter={fmtShiftMoney} color="#2563eb" emptyText="No department cost data in this schedule view." />
          </ShiftInsightSection>
        </Grid>
        )}
        {(costViewBy === "employee" || costViewBy === "department") && (
        <Grid item xs={12} md={costViewBy === "employee" ? 12 : 6}>
          <ShiftInsightSection title="Employee cost breakdown" description="Highest scheduled cost and hours by employee." accent={summary.overtimeExposureHours ? "warning" : "success"}>
            <RankedBarList rows={employeeVisualRows} valueKey="cost" labelKey="name" valueFormatter={fmtShiftMoney} color="#15803d" emptyText="No employee cost data in this schedule view." />
          </ShiftInsightSection>
        </Grid>
        )}
      </Grid>

      <Grid container spacing={2}>
        {(costViewBy === "risk" || costViewBy === "department" || costViewBy === "employee") && (
        <Grid item xs={12} md={8}>
          <ShiftInsightSection title="Cost risk summary" description="Signals that affect confidence in scheduled cost estimates." accent={summary.missingRateShifts || summary.openHours ? "warning" : "success"}>
            <RankedBarList
              rows={riskRows}
              valueKey="value"
              labelKey="name"
              valueFormatter={(value, row) => (row.key === "time-off-cost" ? fmtShiftMoney(value) : row.key.includes("hours") || row.key.includes("exposure") ? fmtShiftHours(value) : value)}
              color={summary.missingRateShifts || summary.openHours ? "#b45309" : "#15803d"}
              emptyText="No cost risk signals in this schedule view."
            />
          </ShiftInsightSection>
        </Grid>
        )}
        <Grid item xs={12} md={4}>
          <ShiftInsightSection title="Payroll handoff" description="Use the full workforce cost page when you need payroll-adjacent actuals." accent="muted">
            <Stack spacing={1.25}>
              <Typography variant="body2" color="text.secondary">
                This tab estimates scheduled cost. Actual worked cost, overtime, and paid leave cost remain in Advanced Analytics.
              </Typography>
              <Button variant="outlined" onClick={onOpenAnalytics}>
                Open Workforce Cost
              </Button>
            </Stack>
          </ShiftInsightSection>
        </Grid>
      </Grid>
    </Stack>
  );
};

const localPartsToUtcMillis = (date, time, zone) => {
  if (!date || !time) return null;
  try {
    return DateTime.fromISO(`${date}T${time}`, {
      zone: zone || viewerTimezone,
    })
      .toUTC()
      .toMillis();
  } catch {
    return null;
  }
};

/* =============================================================================
   Team / Shift Management (Setmore-style)
   - Week/Day views (drag & drop editing, pro rendering)
   - Shift Template box + editor modal
   - Export, bulk delete, summary table
   - Pro options (granularity, 12/24h, weekends, work hours, compact, full-screen)
   ========================================================================== */
const SecondTeam = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));

  /* --------------------------- view & layout state --------------------------- */
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const calendarHeight = "auto";
  // put this near your other utils in Team.js
const asLocalDate = (ymd) => {
  if (!ymd) return new Date();
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1); // constructs a LOCAL date
};

  // NEW — enterprise week/day options
  const [innerCalView, setInnerCalView] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 600 ? "timeGridDay" : "timeGridWeek"
  ); // "timeGridWeek" | "timeGridDay"
  const [granularity, setGranularity] = useState("00:30:00");       // 15/30/60
  const [timeFmt12h, setTimeFmt12h] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [workHoursOnly, setWorkHoursOnly] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);
  const [shiftManagementTab, setShiftManagementTab] = useState("schedule");
  const [costInsightGroupBy, setCostInsightGroupBy] = useState("day");
  const [costInsightSlice, setCostInsightSlice] = useState("all");
  const [costInsightViewBy, setCostInsightViewBy] = useState("department");
  const [showTimeOffOnCalendar, setShowTimeOffOnCalendar] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("schedulaa.showTimeOffOnShiftCalendar") === "true";
  });

  const accentPalette = useMemo(
    () => [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.secondary.main,
    ],
    [theme]
  );
  const getRecruiterAccent = useCallback(
    (recruiterId) =>
      accentPalette[Math.abs(parseInt(recruiterId, 10) || 0) % accentPalette.length],
    [accentPalette]
  );
  const ui = useMemo(
    () => ({
      leave: {
        bg: alpha(theme.palette.grey[200], 0.9),
        border: theme.palette.divider,
        text: theme.palette.text.secondary,
      },
      status: {
        accepted: {
          bg: alpha(theme.palette.success.light, 0.3),
          border: theme.palette.success.main,
          text: theme.palette.text.primary,
        },
        pending: {
          bg: alpha(theme.palette.info.light, 0.25),
          border: theme.palette.info.main,
          text: theme.palette.text.primary,
        },
        assigned: {
          bg: alpha(theme.palette.warning.light, 0.25),
          border: theme.palette.warning.main,
          text: theme.palette.text.primary,
        },
        rejected: {
          bg: alpha(theme.palette.error.light, 0.22),
          border: theme.palette.error.main,
          text: theme.palette.text.primary,
        },
      },
      chips: {
        subtleBg: alpha(theme.palette.grey[300], 0.6),
        subtleText: theme.palette.text.secondary,
      },
      nowIndicator: theme.palette.error.main,
    }),
    [theme]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("schedulaa.showTimeOffOnShiftCalendar", showTimeOffOnCalendar ? "true" : "false");
  }, [showTimeOffOnCalendar]);

  useEffect(() => {
    if (isSmDown) {
      setInnerCalView((current) => (current === "timeGridWeek" ? "timeGridDay" : current));
    }
  }, [isSmDown]);

  /* -------------------------------- filters --------------------------------- */
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiters, setSelectedRecruiters] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [includeArchived, setIncludeArchived] = useState(false);

  /* --------------------------------- data ----------------------------------- */
  const [shifts, setShifts] = useState([]);
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  const [timeEntriesMap, setTimeEntriesMap] = useState({});
  const [rosterMap, setRosterMap] = useState({});
  const [timePolicy, setTimePolicy] = useState(null);

  /* ============================ summary helpers/state ============================ */
  const [compact, setCompact] = useState(true);
  const [query, setQuery] = useState("");

  // ✅ NEW: employee pagination (avoids tall lists)
  const [empPage, setEmpPage] = useState(1);           // 1-based
  const [employeesPerPage, setEmployeesPerPage] = useState(8);
  const [rowMenuAnchor, setRowMenuAnchor] = useState(null);
  const [rowMenuId, setRowMenuId] = useState(null);

  // flatten shifts into table rows (stable keys for selection/edit)
  const resolveRecruiterTimezone = useCallback(
    (recruiterId) =>
      recruiters.find((r) => r.id === recruiterId)?.timezone || viewerTimezone,
    [recruiters]
  );

  const enrichShift = useCallback(
    (shift) => {
      const zone = shift?.timezone || resolveRecruiterTimezone(shift.recruiter_id);
      const clock_in_display = toLocalIso(shift.clock_in, zone);
      const clock_out_display = toLocalIso(shift.clock_out, zone);
      const break_start_display = toLocalIso(shift.break_start, zone);
      const break_end_display = toLocalIso(shift.break_end, zone);
      return {
        ...shift,
        timezone: zone,
        clock_in_display,
        clock_out_display,
        clock_in_local_time: formatLocalTime(clock_in_display),
        clock_out_local_time: formatLocalTime(clock_out_display),
        clock_in_local_date: formatLocalDate(clock_in_display),
        clock_out_local_date: formatLocalDate(clock_out_display),
        break_start_display,
        break_end_display,
        break_start_local_time: formatLocalTime(break_start_display),
        break_end_local_time: formatLocalTime(break_end_display),
      };
    },
    [resolveRecruiterTimezone]
  );

  const flatRows = useMemo(() => {
    return (shifts || []).map((s) => ({
      id: s.id,
      recruiter_id: s.recruiter_id,
      employee: recruiters.find((r) => r.id === s.recruiter_id)?.name || String(s.recruiter_id),
      date: getShiftLocalDate(s),
      start: getShiftLocalStart(s),
      end: getShiftLocalEnd(s),
      status: s.status || "",
      location: s.location || "",
      note: s.note || "",
    }));
  }, [shifts, recruiters]);
  // search filter (employee / date / status / note)
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flatRows;
    return flatRows.filter((r) =>
      r.employee.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      r.status.toLowerCase().includes(q) ||
      r.note.toLowerCase().includes(q)
    );
  }, [flatRows, query]);

  // ✅ NEW: group rows by employee, then paginate employees
  const groupedByEmployee = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((r) => {
      if (!map.has(r.recruiter_id)) map.set(r.recruiter_id, []);
      map.get(r.recruiter_id).push(r);
    });
    return Array.from(map.entries()).map(([recruiter_id, rows]) => ({
      recruiter_id,
      employee: rows[0]?.employee || String(recruiter_id),
      rows: rows.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    }));
  }, [filteredRows]);

  const totalEmployeePages = Math.max(1, Math.ceil(groupedByEmployee.length / employeesPerPage));
  useEffect(() => {
    if (empPage > totalEmployeePages) setEmpPage(1);
  }, [totalEmployeePages, empPage]);

  const pagedEmployees = useMemo(() => {
    const start = (empPage - 1) * employeesPerPage;
    return groupedByEmployee.slice(start, start + employeesPerPage);
  }, [groupedByEmployee, empPage, employeesPerPage]);

  // ✅ page-scoped selection helpers (Select-All for current view)
  const pageVisibleIds = useMemo(
    () => pagedEmployees.flatMap((g) => g.rows.map((r) => r.id)),
    [pagedEmployees]
  );
  const allSelectedOnPage =
    pageVisibleIds.length > 0 && pageVisibleIds.every((id) => selectedShiftIds.includes(id));
  const someSelectedOnPage =
    pageVisibleIds.some((id) => selectedShiftIds.includes(id)) && !allSelectedOnPage;

  const toggleSelectAllVisible = (checked) => {
    setSelectedShiftIds((prev) => {
      if (checked) {
        const set = new Set(prev);
        pageVisibleIds.forEach((id) => set.add(id));
        return Array.from(set);
      }
      return prev.filter((id) => !pageVisibleIds.includes(id));
    });
  };

  // ✅ per-employee select-all (within a single accordion)
  const isEmployeeAllSelected = (recruiterId) => {
    const ids =
      pagedEmployees.find((g) => g.recruiter_id === recruiterId)?.rows.map((r) => r.id) || [];
    return ids.length > 0 && ids.every((id) => selectedShiftIds.includes(id));
  };
  const isEmployeeSomeSelected = (recruiterId) => {
    const ids =
      pagedEmployees.find((g) => g.recruiter_id === recruiterId)?.rows.map((r) => r.id) || [];
    return ids.some((id) => selectedShiftIds.includes(id)) && !isEmployeeAllSelected(recruiterId);
  };
  const toggleSelectEmployee = (recruiterId, checked) => {
    const ids =
      pagedEmployees.find((g) => g.recruiter_id === recruiterId)?.rows.map((r) => r.id) || [];
    setSelectedShiftIds((prev) => {
      if (checked) {
        const set = new Set(prev);
        ids.forEach((id) => set.add(id));
        return Array.from(set);
      }
      return prev.filter((id) => !ids.includes(id));
    });
  };

  // open edit modal for a single row
  const openEditShiftById = (id) => {
    const shift = (shifts || []).find((s) => String(s.id) === String(id));
    if (!shift) return;
    setEditingShift(shift);
    const startDate = getShiftLocalDate(shift);
    const startTime = getShiftLocalStart(shift);
    const endTime = getShiftLocalEnd(shift);

    const policyState = hydrateBreakPolicyFormState(shift.break_policy);
    const derivedBreakMinutes =
      shift.break_minutes ?? policyState.breakLength ?? "";
    setFormData({
      ...defaultBreakPolicyForm,
      ...policyState,
      date: startDate || shift.date || "",
      startTime: startTime || "",
      endTime: endTime || "",
      location: shift.location || "",
      note: shift.note || "",
      recurring: false,
      recurringDays: [],
      selectedTemplate: "",
      repeatMode: "weeks",
      repeatWeeks: 2,
      repeatUntil: "",
      breakStart: toTimeInputValue(shift.break_start_display || shift.break_start),
      breakEnd: toTimeInputValue(shift.break_end_display || shift.break_end),
      breakMinutes: derivedBreakMinutes,
      breakPaid: Boolean(shift.break_paid),
    });
    setSelectedAvailabilityIds(shift.availability_id ? [shift.availability_id] : []);
    fetchAvailabilityForModal(shift.recruiter_id, shift.date);

    setModalOpen(true);
  };

  // single delete (re-uses your bulk delete API)
  const handleDeleteSingle = async (id) => {
    try {
      await api.delete(`/automation/shifts/delete/${id}`, {
        headers: getAuthHeaders(),
      });
      setSuccessMsg("Shift deleted.");
      setSelectedShiftIds((prev) => prev.filter((x) => x !== id));
      fetchShifts();
    } catch {
      setErrorMsg("Error deleting shift.");
    }
  };

  /* ------------------------------- templates -------------------------------- */
  const [templates, setTemplates] = useState([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
const [templateFormData, setTemplateFormData] = useState({
  id: null,
  label: "",
  start: "",
  end: "",
  days: [],
  recurring: true,
  breakStart: "",
  breakEnd: "",
  breakMinutes: "",
  breakPaid: false,
  ...defaultBreakPolicyForm,
});
  const [editingTemplateIndex, setEditingTemplateIndex] = useState(null);

  /* ----------------------------- shift form/modal ---------------------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftAuditOpen, setShiftAuditOpen] = useState(false);
  const [scheduleAuditOpen, setScheduleAuditOpen] = useState(false);
  const [scheduleGuideOpen, setScheduleGuideOpen] = useState(false);
  const [leaveDetailOpen, setLeaveDetailOpen] = useState(false);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState(null);
  const editingShiftRecruiter = useMemo(() => {
    if (!editingShift) return null;
    const recruiter = recruiters.find((r) => String(r.id) === String(editingShift.recruiter_id));
    if (recruiter) return recruiter;
    return {
      id: editingShift.recruiter_id,
      name: editingShift.recruiter_name || `Employee ${editingShift.recruiter_id}`,
      profile_image_url: editingShift.profile_image_url || editingShift.avatar || null,
      avatar: editingShift.avatar || null,
    };
  }, [editingShift, recruiters]);
const [formData, setFormData] = useState({
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  note: "",
  recurring: false,
  recurringDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  selectedTemplate: "",
  breakStart: "",
  breakEnd: "",
  breakMinutes: "",
  breakPaid: false,
  ...defaultBreakPolicyForm,
  // NEW — recurrence controls:
  repeatMode: "weeks",   // "weeks" | "until"
  repeatWeeks: 2,        // number of weeks when repeatMode = "weeks"
  repeatUntil: ""        // YYYY-MM-DD when repeatMode = "until"
});
  const [modalAvailabilitySlots, setModalAvailabilitySlots] = useState([]);
  const [selectedAvailabilityIds, setSelectedAvailabilityIds] = useState([]);
  const [shiftHandlingMode, setShiftHandlingMode] = useState("scheduled");
  const [shiftTimeOffForm, setShiftTimeOffForm] = useState(defaultShiftTimeOffForm);
  const [shiftTimeOffPreview, setShiftTimeOffPreview] = useState(null);
  const [shiftTimeOffPreviewLoading, setShiftTimeOffPreviewLoading] = useState(false);
  const [shiftTimeOffPreviewError, setShiftTimeOffPreviewError] = useState("");
  const [fieldPhotoPreview, setFieldPhotoPreview] = useState({ count: 0, items: [] });
  const [fieldPhotoPreviewLoading, setFieldPhotoPreviewLoading] = useState(false);

  /* ------------------------------- messaging -------------------------------- */
  const [successMsg, setSuccessMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSmartShift, setShowSmartShift] = useState(false);

  /* ------------------------------- calendar refs ----------------------------- */
  const calendarRef = useRef(null);
  const pendingRevertCallbackRef = useRef(null);
  const [pendingEventUpdate, setPendingEventUpdate] = useState(null);
  const [availabilityOverlay, setAvailabilityOverlay] = useState([]);

  /* ------------------------------ date range -------------------------------- */
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(addDays(new Date(), 30), "yyyy-MM-dd"),
  });
  const openedShiftDeepLinkRef = useRef("");

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const shiftDate = params.get("shift_date");
    if (!shiftDate) return;
    if (shiftDate < dateRange.start || shiftDate > dateRange.end) {
      setSelectedDate(shiftDate);
      setSelectedMonth(shiftDate.slice(0, 7));
      setDateRange({
        start: shiftDate,
        end: format(addDays(asLocalDate(shiftDate), 7), "yyyy-MM-dd"),
      });
    }
  }, [dateRange.end, dateRange.start, location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const shiftId = params.get("shift_id");
    if (!shiftId || openedShiftDeepLinkRef.current === shiftId || !shifts.length) return;
    const shift = shifts.find((item) => String(item.id) === String(shiftId));
    if (!shift) return;
    openedShiftDeepLinkRef.current = shiftId;
    openEditShiftById(shiftId);
  }, [location.search, shifts]);

  const handleMonthChange = useCallback((month) => {
    if (!month) return;
    setSelectedMonth(month);
    const first = `${month}-01`;
    const last = format(endOfMonth(asLocalDate(first)), "yyyy-MM-dd");
    setDateRange({ start: first, end: last });
    setSelectedDate(first);
  }, []);

  const handleShiftInsightRangePreset = useCallback((preset) => {
    const today = new Date();
    if (preset === "today") {
      const start = format(today, "yyyy-MM-dd");
      setSelectedMonth(format(today, "yyyy-MM"));
      setDateRange({ start, end: start });
      setSelectedDate(start);
      return;
    }
    if (preset === "this_month") {
      handleMonthChange(format(today, "yyyy-MM"));
      return;
    }
    if (preset === "next_month") {
      handleMonthChange(format(addDays(today, 30), "yyyy-MM"));
      return;
    }

    const startDate =
      preset === "this_week"
        ? startOfWeek(today, { weekStartsOn: 1 })
        : today;
    const endDate =
      preset === "this_week"
        ? endOfWeek(today, { weekStartsOn: 1 })
        : addDays(today, 6);
    const nextStart = format(startDate, "yyyy-MM-dd");
    setSelectedMonth(format(startDate, "yyyy-MM"));
    setDateRange({
      start: nextStart,
      end: format(endDate, "yyyy-MM-dd"),
    });
    setSelectedDate(nextStart);
  }, [handleMonthChange]);

  const resetShiftInsightFilters = useCallback(() => {
    const today = new Date();
    const start = format(today, "yyyy-MM-dd");
    setSelectedDepartment("");
    setSelectedRecruiters([]);
    setStatusFilter("all");
    setSelectedMonth(format(today, "yyyy-MM"));
    setDateRange({
      start,
      end: format(addDays(today, 30), "yyyy-MM-dd"),
    });
    setSelectedDate(start);
  }, []);

  const handleShiftInsightDateRangeChange = useCallback((field, value) => {
    setDateRange((prev) => {
      const next = { ...prev, [field]: value };
      const anchor = field === "start" ? value : next.start;
      if (anchor) {
        setSelectedMonth(format(asLocalDate(anchor), "yyyy-MM"));
        setSelectedDate(anchor);
      }
      return next;
    });
  }, []);

  /* -------------------------------- helpers --------------------------------- */
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const generateRecurringDatesFlexible = (
    baseDate,
    days,
    opts = { mode: "weeks", repeatWeeks: 2, endDate: "" }
  ) => {
    const result = [];
    const base = new Date(baseDate);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // If manager didn't select days, default to the base date's weekday
    const selectedDays =
      Array.isArray(days) && days.length > 0
        ? new Set(days)
        : new Set([dayNames[base.getDay()]]);

    const maybePush = (d) => {
      if (selectedDays.has(dayNames[d.getDay()])) {
        result.push(format(d, "yyyy-MM-dd"));
      }
    };

    if (opts.mode === "until" && opts.endDate) {
      const until = new Date(opts.endDate);
      let d = new Date(base);
      for (; d <= until; d = addDays(d, 1)) {
        maybePush(d);
      }
    } else {
      // weeks mode
      const weeks = Math.max(1, Math.min(52, parseInt(opts.repeatWeeks || 2, 10)));
      const spanDays = weeks * 7;
      let d = new Date(base);
      for (let i = 0; i < spanDays; i++) {
        maybePush(d);
        d = addDays(d, 1);
      }
    }

    // de-dupe in case base date hits twice
    return Array.from(new Set(result));
  };

  const hasConflict = (recruiterId, date, startTime, endTime, shiftIdToExclude = null) => {
    const zone = resolveRecruiterTimezone(recruiterId);
    const newStartUtc = localPartsToUtcMillis(date, startTime, zone);
    const newEndUtc = localPartsToUtcMillis(date, endTime, zone);
    if (!newStartUtc || !newEndUtc) return false;

    return shifts.some((s) => {
      if (s.recruiter_id !== recruiterId) return false;
      if (shiftIdToExclude && s.id === shiftIdToExclude) return false;
      const existingStartUtc = parseUtcMillis(s.clock_in);
      const existingEndUtc = parseUtcMillis(s.clock_out);
      if (!existingStartUtc || !existingEndUtc) return false;
      return newStartUtc < existingEndUtc && newEndUtc > existingStartUtc;
    });
  };

  const estimateShiftHoursFromForm = () => {
    if (!formData.date || !formData.startTime || !formData.endTime) return "";
    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
    const adjustedEnd = end <= start ? new Date(end.getTime() + 24 * 60 * 60 * 1000) : end;
    const hours = Math.max((adjustedEnd - start) / 3600000, 0);
    return hours ? String(Math.round(hours * 100) / 100) : "";
  };

  const resetShiftTimeOffState = (hours = "") => {
    setShiftHandlingMode("scheduled");
    setShiftTimeOffForm({
      ...defaultShiftTimeOffForm,
      approvedHours: hours,
    });
    setShiftTimeOffPreview(null);
    setShiftTimeOffPreviewError("");
    setShiftTimeOffPreviewLoading(false);
  };

  const getWeeklyHours = (recruiterId, date) => {
const weekKey = format(asLocalDate(date), "yyyy-'W'II");
    return shifts
      .filter(
        (s) =>
          s.recruiter_id === recruiterId &&
format(asLocalDate(s.date), "yyyy-'W'II") === weekKey
      )
      .reduce((sum, s) => {
        const start = new Date(s.clock_in);
        const end = new Date(s.clock_out);
        return sum + (end - start) / 3600000;
      }, 0);
  };

  /* --------------------------------- effects -------------------------------- */
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/api/departments", {
          headers: getAuthHeaders(),
        });
        const data = res.data;
        setDepartments(toArray(data?.departments || data));
      } catch {
        setErrorMsg("Failed to fetch departments.");
      }
    };
    fetchDepartments();
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchRecruiters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartment, includeArchived, getAuthHeaders]);

  useEffect(() => {
    fetchShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recruiters, selectedRecruiters, dateRange, getAuthHeaders]);


  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await api.get("/api/shift-templates");
        const data = res.data;

        const list = (data || []).map((t) => ({
          id: t.id,
          label: t.name,
          start: (t.start_time || "").slice(0, 5),
          end: (t.end_time || "").slice(0, 5),
          days: normalizeTemplateDays(t.days || []),
          recurring: true,
          breakStart: (t.break_start || "").slice(0, 5),
          breakEnd: (t.break_end || "").slice(0, 5),
          breakMinutes: t.break_minutes ?? "",
          breakPaid: Boolean(t.break_paid),
          breakPolicy: t.break_policy || null,
        }));

        setTemplates(list);
      } catch (err) {
        console.error("Failed to load templates", err);
        setErrorMsg("Failed to load shift templates.");
      }
    };
    loadTemplates();
  }, []);

  useEffect(() => {
    if (!selectedRecruiters.length) {
      setAvailabilityOverlay([]);
      return;
    }
    const fetchAvailability = async () => {
      try {
        const results = await Promise.all(
          selectedRecruiters.map(async (rid) => {
            try {
              const res = await api.get(`/manager/recruiters/${rid}/availability`, {
                params: {
                  start_date: dateRange.start,
                  end_date: dateRange.end,
                },
                headers: getAuthHeaders(),
              });
              const data = res.data;
              const slots = (data?.availability || data || []).map((slot) => ({
                ...slot,
                recruiter_id: rid,
              }));
              return { recruiterId: rid, slots };
            } catch {
              return { recruiterId: rid, slots: [] };
            }
          })
        );
        const overlayEvents = results.flatMap(({ recruiterId, slots }) =>
          slots.map((slot) => ({
            id: `availability-${recruiterId}-${slot.id}`,
            start: `${slot.date}T${slot.start_time}`,
            end: `${slot.date}T${slot.end_time}`,
            display: "background",
            backgroundColor: slot.booked ? "rgba(244, 67, 54, 0.15)" : "rgba(76, 175, 80, 0.15)",
            borderColor: slot.booked ? "rgba(244, 67, 54, 0.4)" : "rgba(76, 175, 80, 0.4)",
            extendedProps: {
              recruiterId,
              availabilityId: slot.id,
              booked: slot.booked,
            },
          }))
        );
        setAvailabilityOverlay(overlayEvents);
      } catch (err) {
        console.error("Failed to load availability", err);
      }
    };
    fetchAvailability();
  }, [selectedRecruiters, dateRange, getAuthHeaders]);

  /* --------------------------------- fetchers -------------------------------- */
  const fetchRecruiters = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("per_page", "500");
      if (selectedDepartment) {
        params.set("department_id", selectedDepartment);
      }
      if (includeArchived) {
        params.set("include_archived", "1");
      }
      const res = await api.get("/manager/recruiters", {
        params: Object.fromEntries(params.entries()),
        headers: getAuthHeaders(),
      });
      const data = res.data;
      const list = (data.recruiters || []).map((r) => ({
        ...r,
        name: r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim(),
        display_role: r.is_manager ? "Manager" : (r.role || "Employee"),
      }));
      setRecruiters(list);
    } catch {
      setErrorMsg("Failed to fetch recruiters.");
    }
  };

  const fetchTimePolicy = useCallback(async () => {
    try {
      const res = await api.get("/manager/time-tracking-policy", {
        headers: getAuthHeaders(),
      });
      const data = res.data;
      setTimePolicy(data?.policy || null);
    } catch {
      setTimePolicy(null);
    }
  }, [getAuthHeaders]);

  const fetchShifts = async () => {
    try {
      const ids = selectedRecruiters.length
        ? selectedRecruiters.join(",")
        : recruiters.map((r) => r.id).join(",");
      if (!ids) {
        setShifts([]);
        return;
      }
      const res = await api.get("/automation/shifts/range", {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
          recruiter_ids: ids,
        },
        headers: getAuthHeaders(),
      });
      const data = res.data;
      setShifts((data.shifts || []).map(enrichShift));
    } catch {
      setErrorMsg("Failed to fetch shifts.");
    }
  };

  const fetchTimeEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("start_date", dateRange.start);
      params.set("end_date", dateRange.end);
      if (selectedRecruiters.length === 1) {
        params.set("recruiter_id", String(selectedRecruiters[0]));
      }
      const res = await api.get("/manager/time-entries", {
        params: Object.fromEntries(params.entries()),
        headers: getAuthHeaders(),
      });
      const data = res.data;
      const entryMap = {};
      (data?.time_entries || []).forEach((entry) => {
        if (!entry || !entry.id) return;
        entryMap[String(entry.id)] = entry;
      });
      const rosterMapNext = {};
      (data?.roster || []).forEach((entry) => {
        if (!entry || !entry.id) return;
        rosterMapNext[String(entry.id)] = entry;
      });
      setTimeEntriesMap(entryMap);
      setRosterMap(rosterMapNext);
    } catch {
      setTimeEntriesMap({});
      setRosterMap({});
    }
  }, [dateRange.end, dateRange.start, getAuthHeaders, selectedRecruiters]);

  const fetchAvailabilityForModal = useCallback(
    async (recruiterId, referenceDate) => {
      if (!recruiterId) {
        setModalAvailabilitySlots([]);
        return;
      }
      const fallbackDate = referenceDate || format(new Date(), "yyyy-MM-dd");
      const startDate = format(addDays(asLocalDate(fallbackDate), -7), "yyyy-MM-dd");
      const endDate = format(addDays(asLocalDate(fallbackDate), 14), "yyyy-MM-dd");
      try {
        const res = await api.get(`/manager/recruiters/${recruiterId}/availability`, {
          params: { start_date: startDate, end_date: endDate },
          headers: getAuthHeaders(),
        });
        const data = res.data;
        const slots = (data?.availability || data || []).map((slot) => ({
          ...slot,
          id: slot.id,
        }));
        setModalAvailabilitySlots(slots);
      } catch {
        setModalAvailabilitySlots([]);
      }
    },
    [getAuthHeaders]
  );

  useEffect(() => {
    fetchTimeEntries();
  }, [fetchTimeEntries]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchTimeEntries();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchTimeEntries]);

  useEffect(() => {
    fetchTimePolicy();
  }, [fetchTimePolicy]);

  useEffect(() => {
    if (!modalOpen) return;
    const recruiterId =
      editingShift?.recruiter_id ||
      (selectedRecruiters.length === 1 ? selectedRecruiters[0] : null);
    if (!recruiterId) {
      setModalAvailabilitySlots([]);
      return;
    }
    const fallbackDate = formData.date || selectedDate || format(new Date(), "yyyy-MM-dd");
    fetchAvailabilityForModal(recruiterId, fallbackDate);
  }, [modalOpen, editingShift, selectedRecruiters, formData.date, selectedDate, fetchAvailabilityForModal]);

  useEffect(() => {
    let alive = true;
    const loadRelatedPhotos = async () => {
      if (!modalOpen || !editingShift?.id) {
        setFieldPhotoPreview({ count: 0, items: [] });
        return;
      }
      setFieldPhotoPreviewLoading(true);
      try {
        const res = await api.get(`/manager/shifts/${editingShift.id}/field-photos`, {
          headers: getAuthHeaders(),
        });
        const payload = res.data || { count: 0, items: [] };
        const items = await Promise.all(
          (payload.items || []).slice(0, 5).map(async (item) => {
            if (!item?.is_download_ready) return item;
            try {
              const download = await api.get(`/manager/field-photos/${item.id}/download`, {
                headers: getAuthHeaders(),
              });
              return { ...item, preview_url: download?.data?.url || "" };
            } catch {
              return item;
            }
          })
        );
        if (alive) setFieldPhotoPreview({ ...payload, items });
      } catch {
        if (alive) setFieldPhotoPreview({ count: 0, items: [] });
      } finally {
        if (alive) setFieldPhotoPreviewLoading(false);
      }
    };
    loadRelatedPhotos();
    return () => {
      alive = false;
    };
  }, [modalOpen, editingShift?.id, getAuthHeaders]);

  /* -------------------------------- transforms ------------------------------- */
  const filteredShifts = useMemo(
    () =>
      shifts
        .filter((s) => (statusFilter === "all" ? true : s.status === statusFilter))
        .filter((s) =>
          selectedRecruiters.length === 0
            ? true
            : selectedRecruiters.includes(s.recruiter_id)
        ),
    [shifts, statusFilter, selectedRecruiters]
  );

  const getLocalStartIso = useCallback((shift) => {
    const date = getShiftLocalDate(shift);
    const time = getShiftLocalStart(shift);
    if (!date || !time) return shift.clock_in_display || shift.clock_in;
    return `${date}T${time}`;
  }, []);

  const getLocalEndIso = useCallback((shift) => {
    const date = getShiftLocalEndDate(shift);
    const time = getShiftLocalEnd(shift);
    if (!date || !time) return shift.clock_out_display || shift.clock_out;
    return `${date}T${time}`;
  }, []);

  const getScheduledStartIso = useCallback((shift) => {
    return shift.scheduled_clock_in || shift.clock_in || shift.clock_in_display || null;
  }, []);

  const getScheduledEndIso = useCallback((shift) => {
    return shift.scheduled_clock_out || shift.clock_out || shift.clock_out_display || null;
  }, []);

  // Events for WEEK/DAY view (editable, drag/resize)
  const calendarEvents = useMemo(
    () =>
      filteredShifts.map((s) => {
        const color = getRecruiterAccent(s.recruiter_id);
        const isOnLeave = showTimeOffOnCalendar && s.on_leave === true;
        const rec = recruiters.find((r) => r.id === s.recruiter_id);
        const bgTint = alpha(color, 0.14);
        const entry = timeEntriesMap[String(s.id)];
        const roster = rosterMap[String(s.id)];
        const scheduledStart = getScheduledStartIso(s);
        const scheduledEnd = getScheduledEndIso(s);
        const actualClockIn = entry?.clock_in || s.clock_in;
        const breakMissingMinutes = entry?.break_missing_minutes || 0;
        const breakNonCompliant = Boolean(entry?.break_non_compliant);
        const breakInProgress = Boolean(roster?.break_in_progress);
        const clockedIn = roster?.status === "in_progress" || entry?.status === "in_progress";
        const nowUtc = DateTime.utc();
        const allowLateMinutes = Number(timePolicy?.allow_late_clock_in_minutes || 0);
        let lateMinutes = 0;
        if (scheduledStart && actualClockIn) {
          const sched = DateTime.fromISO(scheduledStart).toUTC();
          const actual = DateTime.fromISO(actualClockIn).toUTC();
          const diff = Math.max(0, Math.round(actual.diff(sched, "minutes").minutes));
          lateMinutes = diff;
        }
        let missedClockIn = false;
        if (scheduledStart && !actualClockIn) {
          const sched = DateTime.fromISO(scheduledStart).toUTC().plus({ minutes: allowLateMinutes });
          missedClockIn = nowUtc > sched;
        }
        return {
          id: String(s.id),
          title: `${s.status || "assigned"}`,
          start: getLocalStartIso(s),
          end: getLocalEndIso(s),
          backgroundColor: isOnLeave ? ui.leave.bg : bgTint,
          borderColor: isOnLeave ? ui.leave.border : color,
          textColor: isOnLeave ? ui.leave.text : theme.palette.text.primary,
          editable: !isOnLeave,
          classNames: [isOnLeave ? "shift-leave" : "shift-event"],
          extendedProps: {
            location: s.location,
            note: s.note,
            recruiter_id: s.recruiter_id,
            recruiter_name: rec?.name || `Emp ${s.recruiter_id}`,
            profile_image_url: rec?.profile_image_url || rec?.avatar || null,
            status: s.status,
            timezone: s.timezone,
            local_start_time: getShiftLocalStart(s),
            local_end_time: getShiftLocalEnd(s),
            on_leave: isOnLeave,
            leave_id: s.leave_id || null,
            leave_type: s.leave_type || null,
            leave_subtype: s.leave_subtype || null,
            leave_paid: s.leave_paid,
            leave_approved_hours: s.leave_approved_hours,
            leave_source: s.leave_source || null,
            leave_display_label: s.leave_display_label || null,
            leave_reason: s.leave_reason || null,
            _empColor: color,
            break_in_progress: breakInProgress,
            clocked_in: clockedIn,
            missed_clock_in: missedClockIn,
            break_missing_minutes: breakMissingMinutes,
            break_non_compliant: breakNonCompliant,
            late_minutes: lateMinutes,
            scheduled_clock_in: scheduledStart,
            scheduled_clock_out: scheduledEnd,
          },
        };
      }),
    [
      filteredShifts,
      recruiters,
      getLocalStartIso,
      getLocalEndIso,
      getScheduledStartIso,
      getScheduledEndIso,
      rosterMap,
      timeEntriesMap,
      timePolicy,
      getRecruiterAccent,
      showTimeOffOnCalendar,
      ui,
      theme,
    ]
	  );

  const shiftInsights = useMemo(
    () => getShiftInsights({ shifts: filteredShifts, recruiters, departments, timeEntriesMap, rosterMap }),
    [filteredShifts, recruiters, departments, timeEntriesMap, rosterMap]
  );
  const shiftCostInsights = useMemo(
    () => getShiftCostInsights({
      shifts: filteredShifts,
      recruiters,
      departments,
      groupBy: costInsightGroupBy,
      costSlice: costInsightSlice,
    }),
    [filteredShifts, recruiters, departments, costInsightGroupBy, costInsightSlice]
  );

  const canLinkAvailability = Boolean(editingShift) || selectedRecruiters.length === 1;

  /* ------------------------------- handlers --------------------------------- */

  const handleEventDrop = (dropInfo) => {
    pendingRevertCallbackRef.current = dropInfo.revert;
    setPendingEventUpdate({
      id: dropInfo.event.id,
      newStart: dropInfo.event.start,
      newEnd: dropInfo.event.end,
      recruiter_id: dropInfo.event.extendedProps.recruiter_id,
      status: dropInfo.event.extendedProps.status,
      location: dropInfo.event.extendedProps.location,
      note: dropInfo.event.extendedProps.note,
      timezone: dropInfo.event.extendedProps.timezone,
    });
  };

  const handleEventResize = (resizeInfo) => {
    pendingRevertCallbackRef.current = resizeInfo.revert;
    setPendingEventUpdate({
      id: resizeInfo.event.id,
      newStart: resizeInfo.event.start,
      newEnd: resizeInfo.event.end,
      recruiter_id: resizeInfo.event.extendedProps.recruiter_id,
      status: resizeInfo.event.extendedProps.status,
      location: resizeInfo.event.extendedProps.location,
      note: resizeInfo.event.extendedProps.note,
      timezone: resizeInfo.event.extendedProps.timezone,
    });
  };

  const handleSavePendingEventUpdate = async () => {
    if (!pendingEventUpdate) return;
    const zone = pendingEventUpdate.timezone || viewerTimezone;
    const startDt = DateTime.fromJSDate(pendingEventUpdate.newStart).setZone(zone);
    const endDt = DateTime.fromJSDate(pendingEventUpdate.newEnd).setZone(zone);
    const newDate = startDt.toFormat("yyyy-MM-dd");
    const newStartTime = startDt.toFormat("HH:mm");
    const newEndTime = endDt.toFormat("HH:mm");
    const payload = {
      date: newDate,
      clock_in: `${newDate}T${newStartTime}`,
      clock_out: `${newDate}T${newEndTime}`,
      location: pendingEventUpdate.location,
      note: pendingEventUpdate.note,
      status: pendingEventUpdate.status,
    };
    try {
      await api.put(`/automation/shifts/update/${pendingEventUpdate.id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      setSuccessMsg("Shift update saved successfully.");
      setPendingEventUpdate(null);
      pendingRevertCallbackRef.current = null;
      fetchShifts();
    } catch {
      setErrorMsg("Error saving shift update.");
    }
  };

  const handleCancelPendingEventUpdate = () => {
    if (pendingRevertCallbackRef.current) pendingRevertCallbackRef.current();
    setPendingEventUpdate(null);
    pendingRevertCallbackRef.current = null;
  };

  const handleEventClick = (clickInfo) => {
    const shift = shifts.find((s) => String(s.id) === String(clickInfo.event.id));
    if (!shift) return;
    const xp = clickInfo.event.extendedProps || {};
    if (xp.on_leave) {
      setSelectedLeaveDetail({
        employeeName: xp.recruiter_name || shift.recruiter?.name || `Employee #${shift.recruiter_id}`,
        leaveDisplayLabel: xp.leave_display_label || "Time off",
        leaveType: xp.leave_type || shift.leave_type || "—",
        leaveSubtype: xp.leave_subtype || shift.leave_subtype || "",
        leavePaid: xp.leave_paid,
        approvedHours: xp.leave_approved_hours,
        reason: xp.leave_reason || shift.leave_reason || "",
        leaveSource: xp.leave_source || shift.leave_source || "shift_linked",
        leaveId: xp.leave_id || shift.leave_id || null,
        shiftId: shift.id,
        status: shift.status,
        start: getLocalStartIso(shift),
        end: getLocalEndIso(shift),
        date: getShiftLocalDate(shift) || shift.date || "",
      });
      setLeaveDetailOpen(true);
      return;
    }
    setEditingShift(shift);
    const startDate = getShiftLocalDate(shift);
    const startTime = getShiftLocalStart(shift);
    const endTime = getShiftLocalEnd(shift);
    const policyState = hydrateBreakPolicyFormState(shift.break_policy);
    const derivedBreakMinutes =
      shift.break_minutes ?? policyState.breakLength ?? "";

    setFormData({
      ...defaultBreakPolicyForm,
      ...policyState,
      date: startDate || shift.date || "",
      startTime: startTime || "",
      endTime: endTime || "",
      location: shift.location || "",
      note: shift.note || "",
      recurring: false,
      recurringDays: [],
      selectedTemplate: "",
      breakStart: toTimeInputValue(shift.break_start_display || shift.break_start),
      breakEnd: toTimeInputValue(shift.break_end_display || shift.break_end),
      breakMinutes: derivedBreakMinutes,
      breakPaid: Boolean(shift.break_paid),
      repeatMode: "weeks",
      repeatWeeks: 2,
      repeatUntil: "",
    });
    const defaultHours = (() => {
      const start = new Date(`${startDate || shift.date}T${startTime || ""}`);
      const end = new Date(`${startDate || shift.date}T${endTime || ""}`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
      const adjustedEnd = end <= start ? new Date(end.getTime() + 24 * 60 * 60 * 1000) : end;
      const hours = Math.max((adjustedEnd - start) / 3600000, 0);
      return hours ? String(Math.round(hours * 100) / 100) : "";
    })();
    resetShiftTimeOffState(defaultHours);
    setSelectedAvailabilityIds(shift.availability_id ? [shift.availability_id] : []);
    fetchAvailabilityForModal(shift.recruiter_id, shift.date);
    setModalOpen(true);
  };

  const handleDateClick = (clickInfo) => {
    setEditingShift(null);
    setFormData({
      ...defaultBreakPolicyForm,
      date: formatDate(clickInfo.date),
      startTime: "09:00",
      endTime: "17:00",
      location: "",
      note: "",
      recurring: false,
      recurringDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      selectedTemplate: "",
      breakStart: "",
      breakEnd: "",
      breakMinutes: "",
      breakPaid: false,
      repeatMode: "weeks",
      repeatWeeks: 2,
      repeatUntil: "",
    });
    resetShiftTimeOffState("");
    setSelectedAvailabilityIds([]);
    if (selectedRecruiters.length === 1) {
      fetchAvailabilityForModal(selectedRecruiters[0], formatDate(clickInfo.date));
    } else {
      setModalAvailabilitySlots([]);
    }
    setModalOpen(true);
  };


  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name === "recurring") {
        setFormData((prev) => ({ ...prev, recurring: checked }));
      } else if (name === "recurringDays") {
        setFormData((prev) => {
          const newDays = checked
            ? [...prev.recurringDays, value]
            : prev.recurringDays.filter((d) => d !== value);
          return { ...prev, recurringDays: newDays };
        });
      } else {
        setFormData((prev) => ({ ...prev, [name]: checked }));
      }
    } else {
      if (name === "breakMinutes") {
        setFormData((prev) => ({ ...prev, breakMinutes: value, breakLength: value }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleBreakModeChange = (_, value) => {
    if (!value) return;
    setFormData((prev) => ({
      ...prev,
      ...defaultBreakPolicyForm,
      breakMode: value,
    }));
  };

  const handleAvailabilitySelection = (event) => {
    const value = event.target.value;
    const raw = typeof value === "string" ? value.split(",") : value;
    const selection = raw.map((v) => {
      const parsed = parseInt(v, 10);
      return Number.isNaN(parsed) ? v : parsed;
    });
    setSelectedAvailabilityIds(selection);
    if (selection.length === 1) {
      const slot = modalAvailabilitySlots.find(
        (s) => String(s.id) === String(selection[0])
      );
      if (slot) {
        setFormData((prev) => ({
          ...prev,
          date: slot.date,
          startTime: slot.start_time?.slice(0, 5) || prev.startTime,
          endTime: slot.end_time?.slice(0, 5) || prev.endTime,
        }));
      }
    }
  };

  // NEW: launch assign modal explicitly (uses selectedDate if available)
  const handleOpenAssignShift = () => {
    const dateStr = selectedDate || format(new Date(), "yyyy-MM-dd");
    setEditingShift(null);
    setFormData({
      ...defaultBreakPolicyForm,
      date: dateStr,
      startTime: "09:00",
      endTime: "17:00",
      location: "",
      note: "",
      recurring: false,
      recurringDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      selectedTemplate: "",
      // keep recurrence controls in sync:
      repeatMode: "weeks",
      repeatWeeks: 2,
      repeatUntil: "",
      breakStart: "",
      breakEnd: "",
      breakMinutes: "",
      breakPaid: false,
    });
    setSelectedAvailabilityIds([]);
    setModalAvailabilitySlots([]);
    if (selectedRecruiters.length === 1) {
      fetchAvailabilityForModal(selectedRecruiters[0], dateStr);
    }
    setModalOpen(true);
  };

  /* --------------------------- template box handlers ------------------------- */
  const handleTemplateSelect = (e) => {
    const templateLabel = e.target.value;
    const template = templates.find((t) => t.label === templateLabel);
    if (template) {
      const policyState = hydrateBreakPolicyFormState(template.breakPolicy);
      const derivedMinutes =
        template.breakMinutes || policyState.breakLength || "";
      setFormData((prev) => ({
        ...prev,
        ...defaultBreakPolicyForm,
        selectedTemplate: templateLabel,
        startTime: template.start,
        endTime: template.end,
        recurring: template.recurring,
        recurringDays: template.days,
        breakStart: template.breakStart || "",
        breakEnd: template.breakEnd || "",
        breakMinutes: derivedMinutes,
        breakPaid: Boolean(template.breakPaid),
        ...policyState,
      }));
    } else {
      setFormData((prev) => ({ ...prev, selectedTemplate: "" }));
    }
  };

  const openTemplateModal = () => {
    setTemplateFormData({
      ...defaultBreakPolicyForm,
      id: null,
      label: "",
      start: "",
      end: "",
      days: [],
      recurring: true,
      breakStart: "",
      breakEnd: "",
      breakMinutes: "",
      breakPaid: false,
    });
    setEditingTemplateIndex(null);
    setTemplateModalOpen(true);
  };

  const handleTemplateFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "days") {
      setTemplateFormData((prev) => {
        const newDays = checked
          ? [...prev.days, value]
          : prev.days.filter((d) => d !== value);
        return { ...prev, days: newDays };
      });
      return;
    }
    setTemplateFormData((prev) => {
      const next = { ...prev };
      if (type === "checkbox") {
        next[name] = checked;
      } else if (name === "breakMinutes") {
        next.breakMinutes = value;
        next.breakLength = value;
      } else {
        next[name] = value;
      }
      return next;
    });
  };

  const handleTemplateBreakModeChange = (_, value) => {
    if (!value) return;
    setTemplateFormData((prev) => ({
      ...prev,
      ...defaultBreakPolicyForm,
      breakMode: value,
    }));
  };

  const handleTemplateSave = async () => {
    if (
      !templateFormData.label ||
      !templateFormData.start ||
      !templateFormData.end ||
      templateFormData.days.length === 0
    ) {
      setErrorMsg("Please fill all template fields.");
      return;
    }

    const payload = {
      name: templateFormData.label,
      start_time: templateFormData.start,
      end_time: templateFormData.end,
      days: templateFormData.days.map((d) => dayLabels.indexOf(d)),
      template_type: "private",
      break_start: templateFormData.breakStart || null,
      break_end: templateFormData.breakEnd || null,
      break_minutes: templateFormData.breakMinutes
        ? parseInt(templateFormData.breakMinutes, 10)
        : null,
      break_paid: Boolean(templateFormData.breakPaid),
    };
    const templatePolicy = buildBreakPolicyPayload(
      templateFormData,
      payload.break_paid
    );
    if (templatePolicy) {
      payload.break_policy = templatePolicy;
    }

    const method = editingTemplateIndex != null ? "PUT" : "POST";
    const id = templates[editingTemplateIndex]?.id;
    const url =
      method === "POST"
        ? `/api/shift-templates`
        : `/api/shift-templates/${id}`;

    try {
      if (method === "POST") {
        await api.post(url, payload, {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await api.put(url, payload, {
          headers: { "Content-Type": "application/json" },
        });
      }

      setTemplateModalOpen(false);
      setEditingTemplateIndex(null);

      // reload templates
      const resReload = await api.get("/api/shift-templates");
      const dataReload = resReload.data;
      const listReload = (dataReload || []).map((t) => ({
        id: t.id,
        label: t.name,
        start: (t.start_time || "").slice(0, 5),
        end: (t.end_time || "").slice(0, 5),
        days: normalizeTemplateDays(t.days || []),
        recurring: true,
        breakStart: (t.break_start || "").slice(0, 5),
        breakEnd: (t.break_end || "").slice(0, 5),
        breakMinutes: t.break_minutes ?? "",
        breakPaid: Boolean(t.break_paid),
        breakPolicy: t.break_policy || null,
      }));
      setTemplates(listReload);
      setSuccessMsg("Template saved successfully.");
    } catch (err) {
      setErrorMsg(err.message || "Error saving template.");
    }
  };

  const handleTemplateEdit = (index) => {
    const tpl = templates[index];
    if (!tpl) return;
    const policyState = hydrateBreakPolicyFormState(tpl.breakPolicy);
    const derivedMinutes =
      tpl.breakMinutes ?? policyState.breakLength ?? "";
    setTemplateFormData({
      ...defaultBreakPolicyForm,
      ...policyState,
      id: tpl.id,
      label: tpl.label || "",
      start: tpl.start || "",
      end: tpl.end || "",
      days: tpl.days || [],
      recurring: tpl.recurring !== false,
      breakStart: tpl.breakStart || "",
      breakEnd: tpl.breakEnd || "",
      breakMinutes: derivedMinutes,
      breakPaid: Boolean(tpl.breakPaid),
    });
    setEditingTemplateIndex(index);
    setTemplateModalOpen(true);
  };

  const handleTemplateDelete = (index) => {
    // Optional: call an API to delete. For now, remove client-side and toast.
    setTemplates((prev) => prev.filter((_, i) => i !== index));
    setSuccessMsg("Template deleted successfully.");
  };

  const applyBreakFields = (payload, dateStr) => {
    const normalize = (time) =>
      time && time.includes("T") ? time : `${dateStr}T${time}`;
    if (formData.breakStart) {
      payload.break_start = normalize(formData.breakStart);
    }
    if (formData.breakEnd) {
      payload.break_end = normalize(formData.breakEnd);
    }
    if (formData.breakMinutes) {
      const parsed = parseInt(formData.breakMinutes, 10);
      if (!Number.isNaN(parsed)) {
        payload.break_minutes = parsed;
      }
    }
    payload.break_paid = Boolean(formData.breakPaid);
    const policyPayload = buildBreakPolicyPayload(formData, payload.break_paid);
    if (policyPayload) {
      payload.break_policy = policyPayload;
    }
    return payload;
  };

  /* --------------------------------- submitters ------------------------------ */
  const handleSubmitShift = async () => {
    if (!formData.date) {
      setErrorMsg("Please specify a date.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    let dates = formData.recurring
      ? generateRecurringDatesFlexible(formData.date, formData.recurringDays, {
          mode: formData.repeatMode || "weeks",
          repeatWeeks: formData.repeatWeeks,
          endDate: formData.repeatUntil
        })
      : [formData.date];

    // sync month picker with chosen dates
    if (dates.length > 0) {
      const first = dates[0];
      const last = dates[dates.length - 1];
      setDateRange({ start: first, end: last });
      setSelectedMonth(first.slice(0, 7));
    }

    let successCount = 0;
    let conflicts = [];
    let failures = [];

    const usingAvailabilitySlots = selectedAvailabilityIds.length > 0;
    if (usingAvailabilitySlots && selectedRecruiters.length !== 1) {
      setErrorMsg("Assign availability slots to one employee at a time.");
      setIsSubmitting(false);
      return;
    }

    const userId = parseInt(localStorage.getItem("userId"), 10);

    if (usingAvailabilitySlots) {
      const recruiterId = selectedRecruiters[0];
      const slots = modalAvailabilitySlots.filter((slot) =>
        selectedAvailabilityIds.includes(slot.id)
      );
      if (!slots.length) {
        setErrorMsg("Select at least one availability slot.");
        setIsSubmitting(false);
        return;
      }

      for (const slot of slots) {
        if (hasConflict(recruiterId, slot.date, slot.start_time, slot.end_time)) {
          conflicts.push(`🟡 Conflict - Recruiter ${recruiterId} on ${slot.date}`);
          continue;
        }

        const payload = applyBreakFields(
          {
            recruiter_id: recruiterId,
            availability_id: slot.id,
            location: formData.location,
            note: formData.note,
            status: "assigned",
            created_by: userId,
          },
          slot.date
        );

        try {
          await api.post("/automation/shifts/create", payload, {
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
          });
          successCount++;
        } catch {
          failures.push(`🔴 Error - Recruiter ${recruiterId} on ${slot.date}`);
        }
      }
    } else {
      for (let dateStr of dates) {
        for (let recruiterId of selectedRecruiters) {
          if (hasConflict(recruiterId, dateStr, formData.startTime, formData.endTime)) {
            conflicts.push(`🟡 Conflict - Recruiter ${recruiterId} on ${dateStr}`);
            continue;
          }

          const payload = applyBreakFields(
            {
              recruiter_id: recruiterId,
              date: dateStr,
              clock_in: `${dateStr}T${formData.startTime}`,
              clock_out: `${dateStr}T${formData.endTime}`,
              location: formData.location,
              note: formData.note,
              status: "assigned",
              created_by: userId,
            },
            dateStr
          );

          try {
            await api.post("/automation/shifts/create", payload, {
              headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
              },
            });
            successCount++;
          } catch {
            failures.push(`🔴 Error - Recruiter ${recruiterId} on ${dateStr}`);
          }
        }
      }
    }

    if (successCount > 0) {
      setSuccessMsg(`✅ ${successCount} shift(s) assigned successfully.`);
    }
    if (conflicts.length > 0 || failures.length > 0) {
      const combined = [...conflicts, ...failures].join("\n");
      setErrorMsg(`Some issues occurred:\n${combined}`);
    }

    setModalOpen(false);
    setSelectedAvailabilityIds([]);
    fetchShifts();
    setIsSubmitting(false);
  };

  const handleUpdateShift = async () => {
    if (!editingShift) return;

    if (shiftHandlingMode === "time_off") {
      await handleMarkShiftAsTimeOff();
      return;
    }

    if (shiftHandlingMode === "delete") {
      await handleDeleteShift();
      return;
    }

    const recruiterId = editingShift.recruiter_id;
    const dateStr = formData.date;
    const clock_in = `${dateStr}T${formData.startTime}`;
    const clock_out = `${dateStr}T${formData.endTime}`;
    const createdBy = localStorage.getItem("user_email");

    const payload = applyBreakFields({
      recruiter_id: recruiterId,
      date: dateStr,
      clock_in,
      clock_out,
      location: formData.location,
      note: formData.note,
      status: "assigned",
      created_by: createdBy,
    }, dateStr);

    if (selectedAvailabilityIds.length === 1) {
      payload.availability_id = selectedAvailabilityIds[0];
    } else if (!selectedAvailabilityIds.length) {
      payload.availability_id = null;
    }

    if (
      hasConflict(recruiterId, dateStr, formData.startTime, formData.endTime, editingShift.id)
    ) {
      setErrorMsg("Conflict detected for updated shift.");
      return;
    }

    try {
      await api.put(`/automation/shifts/update/${editingShift.id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      setSuccessMsg("Shift updated successfully.");
      setModalOpen(false);
      fetchShifts();
    } catch {
      setErrorMsg("Error updating shift.");
    }
  };

  const handleDeleteShift = async () => {
    if (!editingShift) return;
    try {
      await api.delete(`/automation/shifts/delete/${editingShift.id}`, {
        headers: getAuthHeaders(),
      });
      setSuccessMsg("Shift deleted successfully.");
      setModalOpen(false);
      fetchShifts();
    } catch {
      setErrorMsg("Error deleting shift.");
    }
  };

  const buildShiftTimeOffPayload = (extra = {}) => ({
    leave_type: shiftTimeOffForm.leaveType,
    is_paid_leave: shiftTimeOffForm.leaveType === "unpaid_day_off" ? false : Boolean(shiftTimeOffForm.isPaidLeave),
    approved_hours: Number(shiftTimeOffForm.approvedHours || estimateShiftHoursFromForm() || 0),
    note: shiftTimeOffForm.note,
    remove_from_schedule: true,
    ...extra,
  });

  const previewShiftTimeOffImpact = async () => {
    if (!editingShift) return;
    setShiftTimeOffPreviewLoading(true);
    setShiftTimeOffPreviewError("");
    try {
      const response = await api.post(
        `/manager/shifts/${editingShift.id}/mark-time-off`,
        buildShiftTimeOffPayload({ dry_run: true }),
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );
      setShiftTimeOffPreview(response.data?.preview || null);
    } catch (err) {
      setShiftTimeOffPreview(null);
      setShiftTimeOffPreviewError(err?.response?.data?.message || err?.response?.data?.error || "Unable to preview time-off impact.");
    } finally {
      setShiftTimeOffPreviewLoading(false);
    }
  };

  const handleMarkShiftAsTimeOff = async () => {
    if (!editingShift) return;
    setIsSubmitting(true);
    setShiftTimeOffPreviewError("");
    setWarningMsg("");
    try {
      const response = await api.post(
        `/manager/shifts/${editingShift.id}/mark-time-off`,
        buildShiftTimeOffPayload(),
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );
      setSuccessMsg(response.data?.message || "Shift marked as time off.");
      setWarningMsg(formatAvailabilityWarning(response.data));
      setModalOpen(false);
      setEditingShift(null);
      resetShiftTimeOffState("");
      fetchShifts();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.response?.data?.error || "Error marking shift as time off.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDeleteShifts = async () => {
    if (!window.confirm("Are you sure you want to delete selected shifts?")) return;
    try {
      const res = await api.post(
        "/automation/shifts/delete-bulk",
        { shift_ids: selectedShiftIds },
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );
      const result = res.data || {};
      setSuccessMsg(result.message || "Shifts deleted successfully.");
      setSelectedShiftIds([]);
      fetchShifts();
    } catch {
      setErrorMsg("Bulk delete failed.");
    }
  };

  /* ---------------------------------- export -------------------------------- */
  const exportShiftsToExcel = () => {
    const data = filteredShifts.map((s) => ({
      Recruiter:
        recruiters.find((r) => r.id === s.recruiter_id)?.name || s.recruiter_id,
      Date: s.date,
      ClockIn: `${getShiftLocalStart(s)} (${getShiftLocalDate(s)})`,
      ClockOut: `${getShiftLocalEnd(s)} (${getShiftLocalEndDate(s)})`,
      Location: s.location || "",
      Note: s.note || "",
      Status: s.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shifts");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "shifts_schedule.xlsx");
  };

  const handleExportToExcel = async () => {
    const ids = selectedRecruiters.length
      ? selectedRecruiters.join(",")
      : recruiters.map((r) => r.id).join(",");
    if (!ids) {
      setErrorMsg("No employees selected for export.");
      return;
    }
    try {
      const res = await api.get("/automation/shifts/export", {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
          recruiter_ids: ids,
        },
        responseType: "blob",
        headers: getAuthHeaders(),
      });
      const blob = res.data;
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = "shifts.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch {
      setErrorMsg("Export failed.");
    }
  };

  /* --------------------------- event rendering (pro) -------------------------- */
  const eventTimeFormat = useMemo(
    () =>
      timeFmt12h
        ? { hour: "numeric", minute: "2-digit", meridiem: "short" }
        : { hour: "2-digit", minute: "2-digit", meridiem: false },
    [timeFmt12h]
  );

  const slotLabelFormat = useMemo(
    () =>
      timeFmt12h
        ? { hour: "numeric", minute: "2-digit", meridiem: "short" }
        : { hour: "2-digit", minute: "2-digit", meridiem: false },
    [timeFmt12h]
  );

  const renderEventContent = (arg) => {
    const xp = arg.event.extendedProps || {};
    const accent = xp._empColor || theme.palette.primary.main;
    const emp = xp.recruiter_name || `Emp ${xp.recruiter_id || ""}`;
    const status = (xp.status || "assigned").toUpperCase();
    const statusKey = ["accepted", "pending", "rejected", "assigned"].includes(xp.status)
      ? xp.status
      : "assigned";
    const statusUi = ui.status[statusKey] || ui.status.assigned;
    const viewType = arg.view && arg.view.type ? arg.view.type : "";
    const showAvatar =
      viewType.startsWith("timeGridDay") ||
      viewType.startsWith("timeGridWeek") ||
      viewType === "dayGridMonth";
    const isWeekView = viewType.startsWith("timeGridWeek");
    const isDayView = viewType.startsWith("timeGridDay");
    const startTime = xp.local_start_time || arg.timeText || "";
    const endTime =
      xp.local_end_time ||
      (arg.event.end ? format(arg.event.end, timeFmt12h ? "hh:mmaaa" : "HH:mm") : "");
    const issueCount =
      (xp.late_minutes > 0 ? 1 : 0) +
      (xp.break_missing_minutes > 0 ? 1 : 0) +
      (xp.break_non_compliant ? 1 : 0) +
      (xp.missed_clock_in ? 1 : 0);
    const compactIssueLabel =
      xp.break_missing_minutes > 0
        ? `Break missing ${xp.break_missing_minutes}m`
        : xp.break_non_compliant
        ? "Break non-compliant"
        : xp.missed_clock_in
        ? "Missed clock-in"
        : xp.late_minutes > 0
        ? `Late +${xp.late_minutes}m`
        : "";

    if (xp.on_leave) {
      const leaveLabel = xp.leave_display_label || "Time off";
      const paidLabel = xp.leave_paid === false ? "Unpaid" : "Paid";
      const hoursLabel =
        xp.leave_approved_hours !== undefined && xp.leave_approved_hours !== null
          ? `${Number(xp.leave_approved_hours).toFixed(2).replace(/\.00$/, "")}h`
          : "";
      return (
        <div
          style={{
            padding: isDayView ? "5px 7px" : "3px 5px",
            borderLeft: `4px solid ${ui.leave.border}`,
            lineHeight: 1.18,
            background: `repeating-linear-gradient(135deg, ${ui.leave.bg}, ${ui.leave.bg} 8px, ${alpha(theme.palette.grey[300], 0.62)} 8px, ${alpha(theme.palette.grey[300], 0.62)} 12px)`,
            borderRadius: 1.25,
            height: "100%",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, minWidth: 0 }}>
            <span
              style={{
                fontSize: isDayView ? 10 : 9,
                textTransform: "uppercase",
                letterSpacing: 0.35,
                padding: "2px 6px",
                borderRadius: 1,
                background: alpha(theme.palette.grey[900], 0.08),
                border: `1px dashed ${ui.leave.border}`,
                color: ui.leave.text,
                flexShrink: 0,
              }}
            >
              OFF
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: isDayView ? 11 : 10,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: theme.palette.text.primary,
                minWidth: 0,
              }}
            >
              {emp}
            </span>
          </div>
          <div style={{ fontSize: isDayView ? 11 : 10, fontWeight: 700, color: ui.leave.text, marginBottom: 2 }}>
            {leaveLabel}
            {hoursLabel ? ` · ${hoursLabel}` : ""}
          </div>
          <div style={{ fontSize: isDayView ? 10 : 9, color: theme.palette.text.secondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {startTime}
            {endTime ? ` – ${endTime}` : ""}
            {` · ${paidLabel}`}
          </div>
        </div>
      );
    }

    if (isWeekView) {
      return (
        <div
          style={{
            padding: "3px 4px",
            borderLeft: `3px solid ${accent}`,
            lineHeight: 1.15,
            background: alpha(accent, 0.1),
            borderRadius: 1,
            height: "100%",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2, minWidth: 0 }}>
            <span
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: 0.25,
                padding: "1px 4px",
                borderRadius: 1,
                background: statusUi.bg,
                border: `1px solid ${statusUi.border}`,
                color: statusUi.text,
                flexShrink: 0,
              }}
            >
              {status}
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: 10,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: theme.palette.text.primary,
                minWidth: 0,
              }}
            >
              {emp}
            </span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 2 }}>
            {startTime}
            {endTime ? ` - ${endTime}` : ""}
          </div>
          {compactIssueLabel ? (
            <div
              style={{
                fontSize: 9,
                color: theme.palette.error.dark,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {compactIssueLabel}
            </div>
          ) : null}
          {issueCount > 1 ? (
            <div style={{ fontSize: 9, color: theme.palette.text.secondary }}>
              +{issueCount - 1} more issue{issueCount - 1 === 1 ? "" : "s"}
            </div>
          ) : null}
        </div>
      );
    }

    if (isDayView) {
      return (
        <div
          style={{
            padding: "4px 6px",
            borderLeft: `4px solid ${accent}`,
            lineHeight: 1.18,
            background: alpha(accent, 0.12),
            borderRadius: 1.25,
            height: "100%",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, minWidth: 0 }}>
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                padding: "2px 6px",
                borderRadius: 1,
                background: statusUi.bg,
                border: `1px solid ${statusUi.border}`,
                color: statusUi.text,
                flexShrink: 0,
              }}
            >
              {status}
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: 11,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: theme.palette.text.primary,
                minWidth: 0,
              }}
            >
              {emp}
            </span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 3 }}>
            {startTime}
            {endTime ? ` – ${endTime}` : ""}
          </div>
          {compactIssueLabel ? (
            <div
              style={{
                fontSize: 10,
                color: theme.palette.error.dark,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: 2,
              }}
            >
              {compactIssueLabel}
            </div>
          ) : null}
          {xp.location ? (
            <div style={{ fontSize: 10, color: theme.palette.text.secondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {xp.location}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div
        style={{
          padding: "4px 6px 6px",
          borderLeft: `4px solid ${accent}`,
          lineHeight: 1.2,
          background: alpha(accent, 0.12),
          borderRadius: 1.25,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 0.3,
              padding: "2px 6px",
              borderRadius: 1,
              background: statusUi.bg,
              border: `1px solid ${statusUi.border}`,
              color: statusUi.text,
            }}
          >
            {status}
          </span>
          {xp.clocked_in && !xp.break_in_progress ? (
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: 1,
                background: alpha(theme.palette.success.light, 0.3),
                border: `1px solid ${theme.palette.success.main}`,
                color: theme.palette.text.primary,
              }}
            >
              Clocked in
            </span>
          ) : null}
          {xp.break_in_progress ? (
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: 1,
                background: alpha(theme.palette.warning.light, 0.35),
                border: `1px solid ${theme.palette.warning.main}`,
                color: theme.palette.text.primary,
              }}
            >
              On break
            </span>
          ) : null}
          {xp.missed_clock_in ? (
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: 1,
                background: alpha(theme.palette.error.light, 0.3),
                border: `1px solid ${theme.palette.error.main}`,
                color: theme.palette.text.primary,
              }}
            >
              Missed clock‑in
            </span>
          ) : null}
          {showAvatar && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: theme.palette.text.primary }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundImage: xp.profile_image_url ? `url(${xp.profile_image_url})` : "none",
                  backgroundColor: ui.chips.subtleBg,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: ui.chips.subtleText,
                }}
              >
                {!xp.profile_image_url ? (emp || "E").charAt(0) : ""}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: theme.palette.text.primary,
                }}
              >
                {emp}
              </span>
            </span>
          )}
          {!showAvatar && (
            <span
              style={{
                fontWeight: 700,
                fontSize: 12,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: theme.palette.text.primary,
              }}
            >
              {emp}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 2 }}>
          {startTime}
          {endTime ? ` – ${endTime}` : ""}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
          {xp.late_minutes > 0 ? (
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: 1,
                background: alpha(theme.palette.warning.light, 0.35),
                border: `1px solid ${theme.palette.warning.main}`,
                color: theme.palette.text.primary,
              }}
            >
              Late +{xp.late_minutes}m
            </span>
          ) : null}
          {xp.break_missing_minutes > 0 ? (
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: 1,
                background: alpha(theme.palette.error.light, 0.3),
                border: `1px solid ${theme.palette.error.main}`,
                color: theme.palette.text.primary,
              }}
            >
              Break missing {xp.break_missing_minutes}m
            </span>
          ) : null}
          {xp.break_non_compliant ? (
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: 1,
                background: alpha(theme.palette.error.light, 0.18),
                border: `1px solid ${theme.palette.error.main}`,
                color: theme.palette.text.primary,
              }}
            >
              Break non‑compliant
            </span>
          ) : null}
        </div>
        {xp.location ? (
          <div style={{ fontSize: 11, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {xp.location}
          </div>
        ) : null}
      </div>
    );
  };

  const eventDidMount = (info) => {
    const xp = info.event.extendedProps || {};
    const emp = xp.recruiter_name || `Emp ${xp.recruiter_id || ""}`;
    const start = xp.local_start_time || (info.event.start ? format(info.event.start, timeFmt12h ? "hh:mmaaa" : "HH:mm") : "");
    const end = xp.local_end_time || (info.event.end ? format(info.event.end, timeFmt12h ? "hh:mmaaa" : "HH:mm") : "");
    const loc = xp.location ? `\nLocation: ${xp.location}` : "";
    const note = xp.note ? `\nNote: ${xp.note}` : "";
    if (xp.on_leave) {
      const leaveLabel = xp.leave_display_label || "Time off";
      const paidLabel = xp.leave_paid === false ? "Unpaid" : "Paid";
      const hours = xp.leave_approved_hours != null ? `\nApproved hours: ${xp.leave_approved_hours}` : "";
      const reason = xp.leave_reason ? `\nReason: ${xp.leave_reason}` : "";
      info.el.setAttribute("title", `${emp}\n${leaveLabel} (${paidLabel})\n${start}–${end}${hours}${reason}`);
    } else {
      info.el.setAttribute("title", `${emp}\n${start}–${end}${loc}${note}`);
    }
    const accent = xp._empColor || theme.palette.primary.main;
    const viewType = info.view?.type || "";
    const isTimeGrid = viewType.startsWith("timeGrid");
    if (xp.on_leave) {
      info.el.style.borderRadius = "12px";
      info.el.style.boxShadow = "none";
      info.el.style.border = `1px dashed ${ui.leave.border}`;
      info.el.style.borderLeft = `4px solid ${ui.leave.border}`;
      info.el.style.background = ui.leave.bg;
      info.el.style.overflow = "hidden";
      return;
    }
    info.el.style.borderRadius = "12px";
    info.el.style.boxShadow = isTimeGrid ? "none" : theme.shadows[2];
    info.el.style.borderLeft = `4px solid ${accent}`;
    info.el.style.background = alpha(accent, isTimeGrid ? 0.12 : 0.16);
    info.el.style.overflow = "hidden";
  };

  // shared props for Week/Day calendars
  const baseCalProps = {
    plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
    events: calendarEvents,
    editable: true,
    selectable: true,
    weekends: showWeekends,
    nowIndicator: true,
    stickyHeaderDates: true,
    displayEventEnd: true,
    expandRows: true,
    slotEventOverlap: false,
    eventMinHeight: innerCalView === "timeGridDay" ? 72 : innerCalView === "timeGridWeek" ? 54 : 36,
    eventShortHeight: 28,
    scrollTime: "08:00:00",
    slotDuration: granularity,
    slotLabelInterval: "01:00",
    slotMinTime: workHoursOnly ? "08:00:00" : "00:00:00",
    slotMaxTime: workHoursOnly ? "20:00:00" : "24:00:00",
    businessHours: [
      {
        daysOfWeek: showWeekends ? [0,1,2,3,4,5,6] : [1,2,3,4,5],
        startTime: "08:00",
        endTime: "18:00",
      },
    ],
    eventTimeFormat,
    slotLabelFormat,
    eventContent: renderEventContent,
    eventDidMount,
    dateClick: handleDateClick,
    eventClick: handleEventClick,
    eventDrop: handleEventDrop,
    eventResize: handleEventResize,
    headerToolbar: {
      left: "prev,next",
      center: "title",
      right: isSmDown ? "" : "timeGridWeek,timeGridDay,dayGridMonth",
    },
    initialView: innerCalView,
    titleFormat: isSmDown ? { month: "short", day: "numeric" } : undefined,
  };

  /* --------------------------------- render --------------------------------- */
  return (
    <Box
      sx={{
        bgcolor: { xs: "transparent", md: "background.default" },
        pt: { xs: 7, md: 2 },
        mt: 0,
        px: { xs: 1, md: 2 },
        pb: { xs: 1, md: 2 },
      }}
    >
      {/* Global tweaks for readability in timeGrid */}
      <GlobalStyles
        styles={{
          ".fc": {
            "--fc-border-color": theme.palette.divider,
            "--fc-page-bg-color": theme.palette.background.paper,
            "--fc-today-bg-color": alpha(theme.palette.warning.light, 0.2),
            "--fc-button-text-color": theme.palette.text.primary,
            "--fc-button-bg-color": alpha(theme.palette.background.paper, 0.9),
            "--fc-button-border-color": theme.palette.divider,
            "--fc-button-hover-bg-color": alpha(theme.palette.primary.main, 0.08),
            "--fc-button-hover-border-color": alpha(theme.palette.primary.main, 0.3),
            "--fc-button-active-bg-color": alpha(theme.palette.primary.main, 0.18),
            "--fc-button-active-border-color": alpha(theme.palette.primary.main, 0.45),
            "--fc-event-text-color": theme.palette.text.primary,
            "--fc-more-link-text-color": theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily,
          },
          ".fc .fc-timegrid-slot": {
            height: compactDensity ? 26 : 32,
          },
          ".fc .fc-timegrid-axis-cushion, .fc .fc-timegrid-slot-label-cushion": {
            fontSize: 12,
            color: theme.palette.text.secondary,
          },
          ".fc .fc-timegrid-event": {
            borderRadius: 1,
            boxShadow: theme.shadows[1],
          },
          ".fc .shift-leave": {
            cursor: "default",
            opacity: 0.96,
          },
          ".fc .shift-leave .fc-event-main": {
            color: `${ui.leave.text} !important`,
          },
          ".fc .fc-timegrid-col.fc-day-today": {
            background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          },
          ".fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame": {
            background: `linear-gradient(180deg, ${alpha(theme.palette.warning.light, 0.35)} 0%, ${alpha(theme.palette.warning.light, 0.45)} 100%)`,
            boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.warning.main, 0.35)}`,
          },
          ".fc .fc-timegrid-now-indicator-line": {
            borderColor: ui.nowIndicator,
            borderWidth: "2px",
          },
          ".fc .fc-timegrid-now-indicator-arrow": {
            borderColor: `transparent transparent ${ui.nowIndicator} transparent`,
            borderWidth: "0 6px 8px 6px",
          },
          ".fc .fc-timegrid-slot-lane:nth-of-type(odd)": {
            backgroundColor: alpha(theme.palette.action.hover, 0.4),
          },
          ".fc .fc-timegrid-event .fc-event-time": {
            fontWeight: 700,
            fontSize: 11,
            paddingLeft: 4,
          },
          ".fc .fc-timegrid-event .fc-event-title": {
            fontSize: 11,
          },
          ".fc .fc-toolbar-title": {
            fontWeight: 700,
            color: theme.palette.text.primary,
            fontSize: isSmDown ? "1.05rem" : undefined,
            textAlign: "center",
          },
          ".fc .fc-toolbar.fc-header-toolbar": isSmDown
            ? {
                alignItems: "stretch",
                gap: 8,
              }
            : {},
          ".fc .fc-toolbar.fc-header-toolbar .fc-toolbar-chunk": isSmDown
            ? {
                display: "flex",
                justifyContent: "center",
              }
            : {},
          ".fc .fc-col-header-cell-cushion": {
            color: theme.palette.text.primary,
            fontWeight: 600,
          },
          ".fc .fc-more-link": {
            color: theme.palette.text.primary,
          },
        }}
      />
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        {!isSmDown && (
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Shift Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Plan, assign, and manage team schedules in one place.
          </Typography>
        </Box>
        )}
        {shiftManagementTab === "schedule" && (
          isSmDown ? (
            <Stack spacing={1.25} sx={{ width: "100%" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Quick actions
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 1,
                  width: "100%",
                }}
              >
                <Button size="small" sx={{ minHeight: 40 }} variant="outlined" onClick={() => setScheduleGuideOpen(true)}>
                  Schedule guide
                </Button>
                <Button size="small" sx={{ minHeight: 40 }} variant="outlined" onClick={() => setScheduleAuditOpen(true)}>
                  Activity log
                </Button>
                <Button
                  size="small"
                  sx={{ minHeight: 40 }}
                  variant={showSmartShift ? "contained" : "outlined"}
                  onClick={() => setShowSmartShift((v) => !v)}
                >
                  {showSmartShift ? "Hide Smart Shift" : "Smart Shift"}
                </Button>
                <Button size="small" sx={{ minHeight: 40 }} variant="outlined" onClick={openTemplateModal}>
                  Edit Templates
                </Button>
                <Button size="small" sx={{ minHeight: 40 }} variant="outlined" onClick={handleExportToExcel}>
                  Export
                </Button>
                <Button size="small" sx={{ minHeight: 40 }} variant="outlined" onClick={fetchShifts}>
                  Refresh
                </Button>
                <Tooltip title={selectedRecruiters.length === 0 ? "Select at least one employee above" : ""}>
                  <span style={{ display: "contents" }}>
                    <Button
                      size="small"
                      sx={{ minHeight: 40 }}
                      variant="contained"
                      onClick={handleOpenAssignShift}
                      disabled={selectedRecruiters.length === 0}
                    >
                      Assign Shift
                    </Button>
                  </span>
                </Tooltip>
                <Paper
                  variant="outlined"
                  sx={{
                    px: 1,
                    py: 0.75,
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Typography variant="caption" fontWeight={800}>
                    Show time off
                  </Typography>
                  <Switch
                    size="small"
                    checked={showTimeOffOnCalendar}
                    onChange={(event) => setShowTimeOffOnCalendar(event.target.checked)}
                  />
                </Paper>
              </Box>
            </Stack>
          ) : (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            useFlexGap
            sx={{
              flexWrap: { xs: "nowrap", md: "wrap" },
              overflowX: { xs: "auto", md: "visible" },
              width: { xs: "100%", md: "auto" },
              pb: { xs: 0.5, md: 0 },
              "& > *": { flexShrink: 0 },
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            <Button size={isSmDown ? "small" : "medium"} sx={{ minHeight: isSmDown ? 36 : undefined }} variant="outlined" onClick={() => setScheduleGuideOpen(true)}>
              Schedule guide
            </Button>
            <Button size={isSmDown ? "small" : "medium"} sx={{ minHeight: isSmDown ? 36 : undefined }} variant="outlined" onClick={() => setScheduleAuditOpen(true)}>
              Activity log
            </Button>
            <Button
              size={isSmDown ? "small" : "medium"}
              sx={{ minHeight: isSmDown ? 36 : undefined }}
              variant={showSmartShift ? "contained" : "outlined"}
              onClick={() => setShowSmartShift((v) => !v)}
            >
              {showSmartShift ? "Hide Smart Shift" : "Smart Shift"}
            </Button>
            <Button size={isSmDown ? "small" : "medium"} sx={{ minHeight: isSmDown ? 36 : undefined }} variant="outlined" onClick={openTemplateModal}>
              Edit Templates
            </Button>
            <Button size={isSmDown ? "small" : "medium"} sx={{ minHeight: isSmDown ? 36 : undefined }} variant="outlined" onClick={handleExportToExcel}>
              Export
            </Button>
            <FormControlLabel
              sx={{
                m: 0,
                px: 1,
                py: 0.25,
                border: "1px solid",
                borderColor: showTimeOffOnCalendar ? "primary.main" : "divider",
                borderRadius: 1,
                bgcolor: showTimeOffOnCalendar ? alpha(theme.palette.primary.main, 0.06) : "background.paper",
              }}
              control={
                <Switch
                  size="small"
                  checked={showTimeOffOnCalendar}
                  onChange={(event) => setShowTimeOffOnCalendar(event.target.checked)}
                />
              }
              label={<Typography variant="caption" fontWeight={800}>Show time off on calendar</Typography>}
            />
            <Button size={isSmDown ? "small" : "medium"} sx={{ minHeight: isSmDown ? 36 : undefined }} variant="outlined" onClick={fetchShifts}>
              Refresh
            </Button>
            <Tooltip title={selectedRecruiters.length === 0 ? "Select at least one employee above" : ""}>
              <span>
                <Button
                  size={isSmDown ? "small" : "medium"}
                  sx={{ minHeight: isSmDown ? 36 : undefined }}
                  variant="contained"
                  onClick={handleOpenAssignShift}
                  disabled={selectedRecruiters.length === 0}
                >
                  Assign Shift
                </Button>
              </span>
            </Tooltip>
          </Stack>
          )
        )}
	      </Stack>

	      <Paper
	        elevation={0}
	        sx={{
	          mb: 2,
	          borderRadius: 1,
	          border: `1px solid ${theme.palette.divider}`,
	          overflow: "hidden",
	          bgcolor: "background.paper",
	        }}
	      >
          {isSmDown ? (
            <Box
              sx={{
                p: 1,
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 1,
              }}
            >
              {[
                ["schedule", "Schedule"],
                ["insights", "Shift Insights"],
                ["workforce-cost", "Workforce Cost"],
                ["workforce-cost-insights", "Cost Insights"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  variant={shiftManagementTab === value ? "contained" : "outlined"}
                  color={shiftManagementTab === value ? "primary" : "inherit"}
                  onClick={() => setShiftManagementTab(value)}
                  sx={{
                    minHeight: 44,
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          ) : (
            <Tabs
              value={shiftManagementTab}
              onChange={(_, value) => setShiftManagementTab(value)}
              variant="standard"
              sx={{
                px: { xs: 0, sm: 1 },
                "& .MuiTab-root": {
                  fontWeight: 900,
                  textTransform: "none",
                  minHeight: { xs: 44, sm: 48 },
                  minWidth: { xs: "auto", sm: 90 },
                  px: { xs: 1.5, sm: 2 },
                  borderRadius: { xs: 2, sm: 0 },
                  mr: { xs: 0.25, sm: 0 },
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                },
              }}
            >
              <Tab value="schedule" label="Schedule" />
              <Tab value="insights" label="Shift Insights" />
              <Tab value="workforce-cost" label="Workforce Cost" />
              <Tab value="workforce-cost-insights" label="Cost Insights" />
            </Tabs>
          )}
	      </Paper>
	
	      {shiftManagementTab === "schedule" ? (
	      <>
	      {showTimeOffOnCalendar && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
          <Chip size="small" label="Work shift" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}` }} />
          <Chip size="small" label="Time off" sx={{ bgcolor: ui.leave.bg, color: ui.leave.text, border: `1px dashed ${ui.leave.border}` }} />
          <Typography variant="caption" color="text.secondary">
            Approved time off is shown only when it has shift context.
          </Typography>
        </Stack>
      )}

      {showSmartShift && (
        <SmartShiftPlannerPanel
          recruiters={recruiters}
          departments={departments}
          shifts={shifts}
          onApplied={() => {
            fetchShifts();
            fetchTimeEntries();
          }}
        />
      )}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }} elevation={0}>
      {isMdDown ? (
        <Accordion disableGutters sx={{ mb: 2 }} defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Filters & templates</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={2} mt={1}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={selectedDepartment}
                    label="Department"
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    {toArray(departments).map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Employees</InputLabel>
                  <Select
                    multiple
                    value={selectedRecruiters}
                    onChange={(e) => setSelectedRecruiters(e.target.value)}
                    input={<OutlinedInput label="Select Employees" />}
                    renderValue={(selected) =>
                      selected
                        .map((id) => recruiters.find((r) => r.id === id)?.name || id)
                        .join(", ")
                    }
                  >
                    {recruiters.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        <Checkbox checked={selectedRecruiters.indexOf(r.id) > -1} />
                        <ListItemText primary={r.name} secondary={r.display_role} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="accepted">Accepted</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="assigned">Assigned</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeArchived}
                      onChange={(e) => setIncludeArchived(e.target.checked)}
                    />
                  }
                  label="Show archived employees"
                />
              </Grid>

              <Grid item xs={12}>
                <ThemedMonthField
                  label="Month"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Shift Template</InputLabel>
                  <Select
                    value={formData.selectedTemplate}
                    label="Shift Template"
                    onChange={handleTemplateSelect}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {templates.length === 0 ? (
                      <MenuItem disabled>Loading…</MenuItem>
                    ) : (
                      templates.map((t) => (
                        <MenuItem key={t.id} value={t.label}>
                          {t.label}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} />
            </Grid>
          </AccordionDetails>
        </Accordion>
      ) : (
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                label="Department"
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {toArray(departments).map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Select Employees</InputLabel>
              <Select
                multiple
                value={selectedRecruiters}
                onChange={(e) => setSelectedRecruiters(e.target.value)}
                input={<OutlinedInput label="Select Employees" />}
                renderValue={(selected) =>
                  selected
                    .map((id) => recruiters.find((r) => r.id === id)?.name || id)
                    .join(", ")
                }
              >
                {recruiters.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    <Checkbox checked={selectedRecruiters.indexOf(r.id) > -1} />
                    <ListItemText primary={r.name} secondary={r.display_role} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                />
              }
              label="Show archived employees"
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <ThemedMonthField
              label="Month"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              fullWidth
            />
          </Grid>

          {/* ✅ Template Box */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Shift Template</InputLabel>
              <Select
                value={formData.selectedTemplate}
                label="Shift Template"
                onChange={handleTemplateSelect}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {templates.length === 0 ? (
                  <MenuItem disabled>Loading…</MenuItem>
                ) : (
                  templates.map((t) => (
                    <MenuItem key={t.id} value={t.label}>
                      {t.label}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2} />
        </Grid>
      )}
      </Paper>

      {/* =============================== WEEK/DAY MODE ============================== */}
      <>
          {isSmDown && (
            <Paper
              sx={{
                p: 1,
                mb: 1.5,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: "background.paper",
              }}
              elevation={0}
            >
              <ToggleButtonGroup
                size="small"
                value={innerCalView}
                exclusive
                fullWidth
                onChange={(_, v) => v && setInnerCalView(v)}
              >
                <ToggleButton value="timeGridDay">Day</ToggleButton>
                <ToggleButton value="timeGridWeek">Week</ToggleButton>
                <ToggleButton value="dayGridMonth">Month</ToggleButton>
              </ToggleButtonGroup>
            </Paper>
          )}
          <Paper
            sx={{
              p: compactDensity ? 1 : 2,
              mb: 4,
              minHeight: isSmDown ? "360px" : "600px",
              width: "100%",
              maxWidth: "100%",
              overflow: "hidden",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              boxShadow: "none",
              bgcolor: "background.paper",
            }}
            elevation={0}
          >
            <FullCalendar
              ref={calendarRef}
              {...baseCalProps}
              key={`${innerCalView}-${granularity}-${timeFmt12h}-${showWeekends}-${workHoursOnly}-${compactDensity}`}
              height={calendarHeight}
              initialView={innerCalView}
            />
          </Paper>

          {/* Legend for visible employees (Week/Day views) */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} useFlexGap flexWrap="wrap">
            {recruiters
              .filter(
                (r) =>
                  selectedRecruiters.length === 0 ||
                  selectedRecruiters.includes(r.id)
              )
              .map((r) => (
                <Chip
                  key={`legend-week-${r.id}`}
                  label={r.name}
                  sx={{
                    bgcolor: getRecruiterAccent(r.id),
                    border: `1px solid ${theme.palette.divider}`,
                    color: theme.palette.getContrastText(getRecruiterAccent(r.id)),
                  }}
                />
              ))}
          </Stack>

          {/* Floating panel for pending update */}
          {pendingEventUpdate && (
            <Box
              sx={{
                position: "fixed",
                bottom: 16,
                right: 16,
                zIndex: 1300,
                background: theme.palette.background.paper,
                p: 2,
                borderRadius: 1,
                boxShadow: theme.shadows[4],
              }}
            >
              <Typography variant="body1" gutterBottom>
                Unsaved shift update
              </Typography>
              <Button
                onClick={handleSavePendingEventUpdate}
                variant="contained"
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button
                onClick={handleCancelPendingEventUpdate}
                color="secondary"
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                color="primary"
                sx={{ mr: 1 }}
                onClick={() => {
                  const shift = shifts.find(
                    (s) => String(s.id) === String(pendingEventUpdate.id)
                  );
                  if (shift) {
                    setEditingShift(shift);

                    setFormData({
                      date: getShiftLocalDate(shift) || shift.date || "",
                      startTime: getShiftLocalStart(shift) || "",
                      endTime: getShiftLocalEnd(shift) || "",
                      location: shift.location || "",
                      note: shift.note || "",
                      recurring: false,
                      recurringDays: [],
                      selectedTemplate: "",
                      breakStart: toTimeInputValue(shift.break_start_display || shift.break_start),
                      breakEnd: toTimeInputValue(shift.break_end_display || shift.break_end),
                      breakMinutes: shift.break_minutes ?? "",
                      breakPaid: Boolean(shift.break_paid),
                      repeatMode: "weeks",
                      repeatWeeks: 2,
                      repeatUntil: "",
                    });
                    setSelectedAvailabilityIds(
                      shift.availability_id ? [shift.availability_id] : []
                    );
                    fetchAvailabilityForModal(shift.recruiter_id, shift.date);
                    setPendingEventUpdate(null);

                    pendingRevertCallbackRef.current = null;
                    setModalOpen(true);
                  }
                }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={async () => {
                  try {
                    await api.delete(`/automation/shifts/delete/${pendingEventUpdate.id}`, {
                      headers: getAuthHeaders(),
                    });
                    setSuccessMsg("Shift deleted.");
                    setPendingEventUpdate(null);
                    pendingRevertCallbackRef.current = null;
                    fetchShifts();
                  } catch {
                    setErrorMsg("Error deleting shift.");
                  }
                }}
              >
                Delete
              </Button>
            </Box>
          )}

          {/* Full Screen dialog removed per enterprise layout */}
        </>

      {/* ============================ Time Off Detail Modal ============================ */}
      <Modal
        open={leaveDetailOpen}
        onClose={() => {
          setLeaveDetailOpen(false);
          setSelectedLeaveDetail(null);
        }}
      >
        <Box
          sx={{
            position: "relative",
            p: { xs: 2.5, sm: 3 },
            bgcolor: "background.paper",
            width: { xs: "calc(100% - 24px)", sm: 520 },
            maxWidth: 640,
            mx: "auto",
            mt: { xs: "6vh", sm: "10%" },
            borderRadius: 1,
            boxShadow: 8,
            outline: "none",
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={800}>
                  Schedule-context time off
                </Typography>
                <Typography variant="h6" fontWeight={900}>
                  {selectedLeaveDetail?.leaveDisplayLabel || "Time off"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This calendar item is read-only. It represents approved time off tied to a scheduled shift.
                </Typography>
              </Box>
              <Chip
                size="small"
                label="OFF"
                sx={{ bgcolor: ui.leave.bg, color: ui.leave.text, border: `1px dashed ${ui.leave.border}`, fontWeight: 900 }}
              />
            </Stack>

            <Alert severity="info" variant="outlined">
              This is not an editable work shift. Payroll formulas are unchanged.
            </Alert>

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Employee</Typography>
                  <Typography variant="body2" fontWeight={800}>{selectedLeaveDetail?.employeeName || "—"}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Paid status</Typography>
                  <Typography variant="body2" fontWeight={800}>
                    {selectedLeaveDetail?.leavePaid === false ? "Unpaid time off" : "Paid time off"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Canonical leave type</Typography>
                  <Typography variant="body2" fontWeight={800}>{selectedLeaveDetail?.leaveType || "—"}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Subtype</Typography>
                  <Typography variant="body2" fontWeight={800}>{selectedLeaveDetail?.leaveSubtype || "None"}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Approved hours</Typography>
                  <Typography variant="body2" fontWeight={800}>
                    {selectedLeaveDetail?.approvedHours != null ? `${selectedLeaveDetail.approvedHours}h` : "—"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Leave source</Typography>
                  <Typography variant="body2" fontWeight={800}>
                    {String(selectedLeaveDetail?.leaveSource || "shift_linked").replace(/_/g, " ")}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Box>
              <Typography variant="subtitle2" fontWeight={900} gutterBottom>
                Scheduled time
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedLeaveDetail?.date || "—"}
                {selectedLeaveDetail?.start || selectedLeaveDetail?.end ? ` · ${selectedLeaveDetail?.start || "—"} – ${selectedLeaveDetail?.end || "—"}` : ""}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={900} gutterBottom>
                Reason / note
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedLeaveDetail?.reason || "No note provided."}
              </Typography>
            </Box>

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Linked shift #{selectedLeaveDetail?.shiftId || "—"}
                {selectedLeaveDetail?.leaveId ? ` · Leave record #${selectedLeaveDetail.leaveId}` : ""}
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setLeaveDetailOpen(false);
                  setSelectedLeaveDetail(null);
                }}
              >
                Close
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      {/* ============================ Add/Edit Shift Modal ============================ */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingShift(null);
          setSelectedAvailabilityIds([]);
          setModalAvailabilitySlots([]);
          resetShiftTimeOffState("");
        }}
      >
        <Box
          sx={{
            position: "relative",
            p: { xs: 2.5, sm: 4 },
            bgcolor: theme.palette.mode === "dark" ? "#111827" : "#f8fbff",
            backgroundImage: `linear-gradient(180deg, ${
              theme.palette.mode === "dark" ? "#1b2940" : "#eaf3ff"
            } 0%, ${theme.palette.mode === "dark" ? "#111827" : "#f8fbff"} 20%, ${
              theme.palette.mode === "dark" ? "#111827" : "#f8fbff"
            } 100%)`,
            width: { xs: "calc(100% - 24px)", sm: 520 },
            maxWidth: 640,
            mx: "auto",
            mt: { xs: 1.5, sm: 3 },
            borderRadius: 1,
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.16),
            boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.42 : 0.16)}`,
            maxHeight: { xs: "calc(100vh - 24px)", sm: "calc(100vh - 48px)" },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {isSubmitting ? (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 3,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.88 : 0.9),
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  width: "100%",
                  maxWidth: 360,
                  p: 2.5,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: alpha(theme.palette.primary.main, 0.28),
                  bgcolor: theme.palette.mode === "dark" ? "#162133" : "#f7fbff",
                  backgroundImage: `linear-gradient(145deg, ${
                    theme.palette.mode === "dark" ? "#223552" : "#edf5ff"
                  }, ${theme.palette.mode === "dark" ? "#162133" : "#f7fbff"})`,
                  boxShadow: `0 18px 40px ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.12)}`,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={26} thickness={4.5} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Assigning shifts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This can take a little longer when Schedulaa creates shifts for multiple employees and recurring dates.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          ) : null}
          <Box sx={{ overflowY: "auto", pr: { xs: 0, sm: 1 }, flex: "1 1 auto", minHeight: 0 }}>
            <Paper
              variant="outlined"
              sx={{
                mb: 2,
                p: 1.75,
                borderRadius: 1,
                borderColor: alpha(theme.palette.primary.main, 0.16),
                bgcolor: theme.palette.mode === "dark" ? "#162133" : "#f6faff",
                backgroundImage: `linear-gradient(145deg, ${
                  theme.palette.mode === "dark" ? "#20314c" : "#eef6ff"
                }, ${theme.palette.mode === "dark" ? "#162133" : "#f6faff"})`,
              }}
            >
              <Typography variant="h6" sx={{ mb: editingShift && editingShiftRecruiter ? 1.5 : 0 }}>
                {editingShift ? "Edit Shift" : "Add New Shift"}
              </Typography>
            {editingShift && editingShiftRecruiter ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  borderColor: alpha(theme.palette.primary.main, 0.14),
                  bgcolor: theme.palette.mode === "dark" ? "#0f1726" : "#ffffff",
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Avatar
                    src={editingShiftRecruiter.profile_image_url || editingShiftRecruiter.avatar || undefined}
                    alt={editingShiftRecruiter.name || "Employee"}
                    sx={{
                      width: 40,
                      height: 40,
                      fontWeight: 800,
                      border: "1px solid",
                      borderColor: alpha(theme.palette.primary.main, 0.18),
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    }}
                  >
                    {(editingShiftRecruiter.name || "E").charAt(0)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={800} noWrap>
                      {editingShiftRecruiter.name || `Employee ${editingShift.recruiter_id}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Shift owner
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ) : null}
            </Paper>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <ThemedDateField
                  fullWidth
                  label="Date"
                  margin="normal"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <ThemedTimeField
                  fullWidth
                  label="Start Time"
                  margin="normal"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <ThemedTimeField
                  fullWidth
                  label="End Time"
                  margin="normal"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  margin="normal"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Note"
                  margin="normal"
                  name="note"
                  value={formData.note}
                  onChange={handleFormChange}
                />
              </Grid>
            </Grid>
            <Box mt={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Break strategy
                </Typography>
                <Tooltip
                  title="Decide when breaks occur. Fixed = exact times, Window = must occur within the range, Stagger = auto-assigns unique slots to avoid coverage gaps."
                  arrow
                >
                  <IconButton size="small">
                    <InfoOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={formData.breakMode}
                onChange={handleBreakModeChange}
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                <ToggleButton value="none">Manual</ToggleButton>
                <ToggleButton value="fixed">Fixed time</ToggleButton>
                <ToggleButton value="window">Window</ToggleButton>
                <ToggleButton value="stagger">Auto-stagger</ToggleButton>
              </ToggleButtonGroup>
              {formData.breakMode === "fixed" && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <ThemedTimeField
                      fullWidth
                      label="Break start"
                      margin="normal"
                      name="breakStart"
                      value={formData.breakStart}
                      onChange={handleFormChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ThemedTimeField
                      fullWidth
                      label="Break end"
                      margin="normal"
                      name="breakEnd"
                      value={formData.breakEnd}
                      onChange={handleFormChange}
                    />
                  </Grid>
                </Grid>
              )}
              {formData.breakMode !== "none" && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Break minutes"
                      type="number"
                      margin="normal"
                      name="breakMinutes"
                      value={formData.breakMinutes}
                      onChange={handleFormChange}
                    />
                  </Grid>
                  {(formData.breakMode === "window" || formData.breakMode === "stagger") && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <ThemedTimeField
                          fullWidth
                          label="Window start"
                          margin="normal"
                          name="breakWindowStart"
                          value={formData.breakWindowStart}
                          onChange={handleFormChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ThemedTimeField
                          fullWidth
                          label="Window end"
                          margin="normal"
                          name="breakWindowEnd"
                          value={formData.breakWindowEnd}
                          onChange={handleFormChange}
                        />
                      </Grid>
                    </>
                  )}
                  {formData.breakMode === "window" && (
                    <Grid item xs={12} sm={6}>
                      <ThemedTimeField
                        fullWidth
                        label="Must start by"
                        helperText="Latest time an employee can begin their break."
                        margin="normal"
                        name="breakLatestStart"
                        value={formData.breakLatestStart}
                        onChange={handleFormChange}
                      />
                    </Grid>
                  )}
                  {formData.breakMode === "stagger" && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Max people on break"
                          type="number"
                          margin="normal"
                          name="breakMaxSimultaneous"
                          value={formData.breakMaxSimultaneous}
                          onChange={handleFormChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="breakRotate"
                              checked={formData.breakRotate}
                              onChange={handleFormChange}
                            />
                          }
                          label="Rotate assignments each time"
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    name="breakPaid"
                    checked={formData.breakPaid}
                    onChange={handleFormChange}
                  />
                }
                label="Break is paid"
                sx={{ mt: 1 }}
              />
            </Box>
            <FormControl
              fullWidth
              margin="normal"
              disabled={!canLinkAvailability}
            >
              <InputLabel>Availability slot</InputLabel>
              <Select
                multiple
                label="Availability slot"
                value={selectedAvailabilityIds}
                onChange={handleAvailabilitySelection}
                input={<OutlinedInput label="Availability slot" />}
                renderValue={(selected) =>
                  selected
                    .map((id) => {
                      const slot = modalAvailabilitySlots.find(
                        (s) => String(s.id) === String(id)
                      );
                      return slot ? formatAvailabilityDisplay(slot) : id;
                    })
                    .join(", ")
                }
              >
                {!canLinkAvailability ? (
                  <MenuItem disabled>Select one employee to link availability.</MenuItem>
                ) : modalAvailabilitySlots.length === 0 ? (
                  <MenuItem disabled>No open slots near this date.</MenuItem>
                ) : (
                  modalAvailabilitySlots.map((slot) => (
                    <MenuItem
                      key={slot.id}
                      value={slot.id}
                      disabled={
                        slot.booked &&
                        (!editingShift || String(slot.id) !== String(editingShift.availability_id))
                      }
                    >
                      <Checkbox
                        size="small"
                        checked={selectedAvailabilityIds.some(
                          (id) => String(id) === String(slot.id)
                        )}
                      />
                      <ListItemText primary={formatAvailabilityDisplay(slot)} />
                    </MenuItem>
                  ))
                )}
              </Select>
              <FormHelperText>
                {canLinkAvailability
                  ? "Optional: auto-link availability slots (select one to fill times)."
                  : "Select a single employee to link availability slots."}
              </FormHelperText>
            </FormControl>

            {editingShift && (
              <Box
                mt={2}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1.5,
                  bgcolor: "rgba(248,250,252,0.58)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhotoCameraIcon fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Related Photos
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fieldPhotoPreviewLoading
                          ? "Loading photos..."
                          : `${fieldPhotoPreview.count || 0} photo${Number(fieldPhotoPreview.count || 0) === 1 ? "" : "s"} linked to this shift`}
                        {fieldPhotoPreview.items?.[0]?.created_at
                          ? ` · latest ${formatFieldPhotoDateTime(fieldPhotoPreview.items[0].created_at)}`
                          : ""}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!editingShift?.id}
                    onClick={() => navigate(`/manager/field-photos?shift_id=${editingShift.id}`)}
                  >
                    View all photos
                  </Button>
                </Stack>
                {fieldPhotoPreviewLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">Checking linked photos...</Typography>
                  </Stack>
                ) : fieldPhotoPreview.items?.length ? (
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: "auto", pb: 0.5 }}>
                    {fieldPhotoPreview.items.slice(0, 5).map((photo) => (
                      <Tooltip key={photo.id} title={photo.security_status_label || "Field photo"}>
                        <Box
                          sx={{
                            width: 58,
                            height: 58,
                            flex: "0 0 auto",
                            borderRadius: 1,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                            display: "grid",
                            placeItems: "center",
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: theme.palette.primary.main,
                          }}
                        >
                          {photo.preview_url ? (
                            <Box component="img" src={photo.preview_url} alt={photo.file_name || "Field photo"} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <PhotoCameraIcon fontSize="small" />
                          )}
                        </Box>
                      </Tooltip>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No photos have been uploaded for this shift yet.
                  </Typography>
                )}
              </Box>
            )}

            {editingShift && (
              <Box
                mt={2}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1.5,
                  bgcolor: "rgba(248,250,252,0.72)",
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Attendance / time-off handling
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Choose whether this remains scheduled work, becomes manager-entered time off, or is deleted only from the schedule.
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={shiftHandlingMode}
                  onChange={(_, value) => {
                    if (!value) return;
                    setShiftHandlingMode(value);
                    setShiftTimeOffPreview(null);
                    setShiftTimeOffPreviewError("");
                  }}
                  sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}
                >
                  <ToggleButton value="scheduled">Scheduled work</ToggleButton>
                  <ToggleButton value="time_off">Mark as time off</ToggleButton>
                  <ToggleButton value="delete">Delete shift only</ToggleButton>
                </ToggleButtonGroup>

                {shiftHandlingMode === "delete" && (
                  <Alert severity="warning" variant="outlined" sx={{ mt: 1.5 }}>
                    Delete shift only is scheduling cleanup. It does not create leave, deduct balance, or create payroll-ready leave hours.
                  </Alert>
                )}

                {shiftHandlingMode === "time_off" && (
                  <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                    <Alert severity="info" variant="outlined">
                      Marking time off creates an approved leave record. Paid time off may affect leave balance if this leave type is balance-managed. Payroll formulas are unchanged.
                    </Alert>
                    <Alert severity="warning" variant="outlined">
                      Marking time off removes this shift from the active schedule. If needed later, shift restoration is handled separately.
                    </Alert>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Leave type"
                          value={shiftTimeOffForm.leaveType}
                          onChange={(e) => {
                            const value = e.target.value;
                            setShiftTimeOffForm((prev) => ({
                              ...prev,
                              leaveType: value,
                              isPaidLeave: value === "unpaid_day_off" ? false : prev.isPaidLeave,
                            }));
                            setShiftTimeOffPreview(null);
                          }}
                        >
                          {shiftTimeOffLeaveTypes.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={Boolean(shiftTimeOffForm.isPaidLeave) && shiftTimeOffForm.leaveType !== "unpaid_day_off"}
                              disabled={shiftTimeOffForm.leaveType === "unpaid_day_off"}
                              onChange={(e) => {
                                setShiftTimeOffForm((prev) => ({ ...prev, isPaidLeave: e.target.checked }));
                                setShiftTimeOffPreview(null);
                              }}
                            />
                          }
                          label={shiftTimeOffForm.leaveType === "unpaid_day_off" ? "Unpaid time off" : "Paid time off"}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Approved hours"
                          value={shiftTimeOffForm.approvedHours}
                          onChange={(e) => {
                            setShiftTimeOffForm((prev) => ({ ...prev, approvedHours: e.target.value }));
                            setShiftTimeOffPreview(null);
                          }}
                          inputProps={{ min: 0, step: 0.25 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked
                              disabled
                              onChange={() => {}}
                            />
                          }
                          label="Removed from active schedule"
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                          This happens automatically for manager-entered time off.
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Optional note"
                          value={shiftTimeOffForm.note}
                          onChange={(e) => setShiftTimeOffForm((prev) => ({ ...prev, note: e.target.value }))}
                          placeholder="Example: Employee called in sick"
                        />
                      </Grid>
                    </Grid>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                      <Button variant="outlined" size="small" onClick={previewShiftTimeOffImpact} disabled={shiftTimeOffPreviewLoading}>
                        {shiftTimeOffPreviewLoading ? "Previewing..." : "Preview balance impact"}
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Preview is read-only. It does not create leave or ledger rows.
                      </Typography>
                    </Stack>
                    {shiftTimeOffPreviewError && <Alert severity="error">{shiftTimeOffPreviewError}</Alert>}
                    {shiftTimeOffPreview?.balance_impact?.balance_managed && shiftTimeOffPreview?.is_paid_leave && (
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 1 }}>
                        <Paper variant="outlined" sx={{ p: 1, borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Current balance</Typography>
                          <Typography variant="body2" fontWeight={800}>{shiftTimeOffPreview.balance_impact.current_balance_hours}h</Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1, borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Hours to deduct</Typography>
                          <Typography variant="body2" fontWeight={800}>{shiftTimeOffPreview.balance_impact.deduction_hours}h</Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1, borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Projected balance</Typography>
                          <Typography variant="body2" fontWeight={800}>{shiftTimeOffPreview.balance_impact.projected_balance_hours}h</Typography>
                        </Paper>
                      </Box>
                    )}
                    {shiftTimeOffPreview?.balance_impact?.message && (
                      <Alert
                        severity={shiftTimeOffPreview.balance_impact.blocking ? "error" : shiftTimeOffPreview.balance_impact.warning ? "warning" : "success"}
                        variant="outlined"
                      >
                        {shiftTimeOffPreview.balance_impact.message}
                      </Alert>
                    )}
                  </Stack>
                )}
              </Box>
            )}

            {/* Recurrence controls */}
            <Box mt={2}>
              <FormControl fullWidth>
                <InputLabel>Recurring</InputLabel>
                <Select
                  value={formData.recurring ? "yes" : "no"}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, recurring: e.target.value === "yes" }))
                  }
                  label="Recurring"
                >
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </Select>
              </FormControl>

              {formData.recurring && (
                <>
                  {/* Days of week */}
                  <Box mt={2}>
                    <Typography variant="subtitle2">Select Days</Typography>
                    <Grid container>
                      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => (
                        <Grid item key={day} sx={{ pr: 1 }}>
                          <Checkbox
                            name="recurringDays"
                            value={day}
                            checked={formData.recurringDays.includes(day)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const value = e.target.value;
                              setFormData((p) => ({
                                ...p,
                                recurringDays: checked
                                  ? [...p.recurringDays, value]
                                  : p.recurringDays.filter((d) => d !== value),
                              }));
                            }}
                            size="small"
                          />
                          <Typography variant="caption">{day}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  {/* NEW: repeat strategy */}
                  <Box mt={2}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Repeat Options
                    </Typography>

                    {/* Toggle between “N weeks” and “Until date” */}
                    <ToggleButtonGroup
                      size="small"
                      exclusive
                      value={formData.repeatMode}
                      onChange={(_, v) => v && setFormData((p) => ({ ...p, repeatMode: v }))}
                      sx={{ mb: 2 }}
                    >
                      <ToggleButton value="weeks">Repeat for N weeks</ToggleButton>
                      <ToggleButton value="until">Repeat until date</ToggleButton>
                    </ToggleButtonGroup>

                    {/* Weeks count */}
                    {formData.repeatMode === "weeks" && (
                      <TextField
                        label="Number of weeks"
                        type="number"
                        inputProps={{ min: 1, max: 52 }}
                        value={formData.repeatWeeks}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            repeatWeeks: Math.max(1, Math.min(52, parseInt(e.target.value || "1", 10))),
                          }))
                        }
                        fullWidth
                      />
                    )}

                    {/* End date */}
                    {formData.repeatMode === "until" && (
                      <ThemedDateField
                        label="End date"
                        value={formData.repeatUntil}
                        onChange={(e) => setFormData((p) => ({ ...p, repeatUntil: e.target.value }))}
                        fullWidth
                      />
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      Tip: If you don’t pick any days, we’ll default to the same weekday as your chosen start date.
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              zIndex: 1,
              pt: 1.5,
              px: 0.25,
              pb: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
              backgroundColor: "background.paper",
              borderTop: "1px solid",
              borderColor: "divider",
            }}
            display="flex"
            justifyContent="space-between"
          >
            {editingShift ? (
              <>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: "100%" }} justifyContent="space-between">
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button variant="contained" onClick={handleUpdateShift}>
                      {shiftHandlingMode === "time_off"
                        ? "Mark as time off"
                        : shiftHandlingMode === "delete"
                        ? "Delete shift only"
                        : "Update Shift"}
                    </Button>
                    <Button variant="text" onClick={() => setShiftAuditOpen(true)}>
                      Activity log
                    </Button>
                  </Stack>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDeleteShift}
                  >
                    Delete shift only
                  </Button>
                </Stack>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmitShift}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Assigning..." : "Submit Shift"}
              </Button>
            )}
          </Box>
        </Box>
      </Modal>
      <ShiftAdminAuditTimeline
        open={shiftAuditOpen && Boolean(editingShift?.id)}
        onClose={() => setShiftAuditOpen(false)}
        title="Shift activity"
        entityTypes={["shift"]}
        entityId={editingShift?.id}
      />
      <ShiftAdminAuditTimeline
        open={scheduleAuditOpen}
        onClose={() => setScheduleAuditOpen(false)}
        title="Shift management activity"
        emptyText="No shift-management activity recorded yet."
        entityTypes={["shift"]}
      />
      <Drawer
        anchor="right"
        open={scheduleGuideOpen}
        onClose={() => setScheduleGuideOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 520 }, p: 2 } }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>Schedule Guide</Typography>
            <Button size="small" onClick={() => setScheduleGuideOpen(false)}>Close</Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Practical help for assigning shifts, updating schedule rows, handling time off, and keeping the calendar clean.
          </Typography>

          <TutorialHelpCard
            tutorialGroup={SHIFT_SCHEDULE_TUTORIAL_GROUP}
            title="Quick tutorial"
            body="Watch the basic shift-management walkthrough while you assign shifts, edit scheduled work, and review calendar options."
            watchLabel="Watch tutorial"
            moreLabel="More walkthroughs"
            youtubeLabel="Watch on YouTube"
            closeLabel="Close"
            compact
          />

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>1) Start with filters and calendar range</Typography>
            <Typography variant="body2" color="text.secondary">
              Use Department, Select Employees, Status Filter, and Month to narrow the schedule before assigning or reviewing shifts.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>2) Assign a basic shift</Typography>
            <Typography variant="body2" color="text.secondary">
              Select at least one employee, then click <strong>Assign Shift</strong>. Choose the date, start time, end time, location, and note before saving.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>3) Edit existing schedule rows</Typography>
            <Typography variant="body2" color="text.secondary">
              Click a shift on the calendar to update times, break strategy, paid-break settings, notes, recurring behavior, or availability-slot linkage.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>4) Attendance and time-off handling</Typography>
            <Typography variant="body2" color="text.secondary">
              Inside the shift editor, decide whether the row stays scheduled, becomes manager-entered time off, or is removed from the schedule entirely.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>5) Templates and recurring work</Typography>
            <Typography variant="body2" color="text.secondary">
              Use Shift Template for repeat patterns and the template editor when the team uses the same standard shift blocks often.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>6) Show time off on calendar</Typography>
            <Typography variant="body2" color="text.secondary">
              Turn on <strong>Show time off on calendar</strong> when managers need to see approved schedule-context time off next to normal work shifts.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>7) When to use Smart Shift instead</Typography>
            <Typography variant="body2" color="text.secondary">
              Use the normal schedule flow for direct assignments and day-to-day edits. Open Smart Shift when you need coverage-based suggestions across a wider date range.
            </Typography>
          </Box>
        </Stack>
      </Drawer>

      {/* ============================ Template Editor Modal ============================ */}
      <Modal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)}>
        <Box
          sx={{
            p: 4,
            bgcolor: "background.paper",
            width: 500,
            mx: "auto",
            mt: "8%",
            borderRadius: 1,
            boxShadow: 6,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Shift Template Editor
          </Typography>

          <TextField
            fullWidth
            label="Template Label"
            margin="normal"
            name="label"
            value={templateFormData.label}
            onChange={handleTemplateFormChange}
          />
          <ThemedTimeField
            fullWidth
            label="Start Time"
            margin="normal"
            name="start"
            value={templateFormData.start}
            onChange={handleTemplateFormChange}
          />
          <ThemedTimeField
            fullWidth
            label="End Time"
            margin="normal"
            name="end"
            value={templateFormData.end}
            onChange={handleTemplateFormChange}
          />

          <Box mt={3}>
            <Typography variant="subtitle1" fontWeight={600}>
              Break strategy (template)
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={templateFormData.breakMode}
              onChange={handleTemplateBreakModeChange}
              sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}
            >
              <ToggleButton value="none">Manual</ToggleButton>
              <ToggleButton value="fixed">Fixed time</ToggleButton>
              <ToggleButton value="window">Window</ToggleButton>
              <ToggleButton value="stagger">Auto-stagger</ToggleButton>
            </ToggleButtonGroup>
            {templateFormData.breakMode === "fixed" && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <ThemedTimeField
                    fullWidth
                    label="Break start"
                    margin="normal"
                    name="breakStart"
                    value={templateFormData.breakStart}
                    onChange={handleTemplateFormChange}
                    helperText="Optional default pause"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ThemedTimeField
                    fullWidth
                    label="Break end"
                    margin="normal"
                    name="breakEnd"
                    value={templateFormData.breakEnd}
                    onChange={handleTemplateFormChange}
                  />
                </Grid>
              </Grid>
            )}
            {templateFormData.breakMode !== "none" && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Break minutes"
                    type="number"
                    margin="normal"
                    name="breakMinutes"
                    value={templateFormData.breakMinutes}
                    onChange={handleTemplateFormChange}
                    helperText="Used when start/end empty"
                  />
                </Grid>
                {(templateFormData.breakMode === "window" ||
                  templateFormData.breakMode === "stagger") && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <ThemedTimeField
                        fullWidth
                        label="Window start"
                        margin="normal"
                        name="breakWindowStart"
                        value={templateFormData.breakWindowStart}
                        onChange={handleTemplateFormChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ThemedTimeField
                        fullWidth
                        label="Window end"
                        margin="normal"
                        name="breakWindowEnd"
                        value={templateFormData.breakWindowEnd}
                        onChange={handleTemplateFormChange}
                      />
                    </Grid>
                  </>
                )}
                {templateFormData.breakMode === "window" && (
                  <Grid item xs={12} sm={6}>
                    <ThemedTimeField
                      fullWidth
                      label="Must start by"
                      margin="normal"
                      name="breakLatestStart"
                      value={templateFormData.breakLatestStart}
                      onChange={handleTemplateFormChange}
                    />
                  </Grid>
                )}
                {templateFormData.breakMode === "stagger" && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Max people on break"
                        type="number"
                        margin="normal"
                        name="breakMaxSimultaneous"
                        value={templateFormData.breakMaxSimultaneous}
                        onChange={handleTemplateFormChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="breakRotate"
                            checked={templateFormData.breakRotate}
                            onChange={handleTemplateFormChange}
                          />
                        }
                        label="Rotate assignments each time"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            )}
            <FormControlLabel
              control={
                <Checkbox
                  name="breakPaid"
                  checked={templateFormData.breakPaid}
                  onChange={handleTemplateFormChange}
                />
              }
              label="Break is paid"
            />
            <Typography variant="caption" color="text.secondary">
              These defaults flow into shift assignments and employee clock breaks, so values here should
              mirror your labour policy.
            </Typography>
          </Box>

          <Box mt={2}>
            <Typography variant="subtitle2">Select Days</Typography>
            <Grid container>
              {dayLabels.map((day) => (
                <Grid item key={day} sx={{ pr: 1 }}>
                  <Checkbox
                    name="days"
                    value={day}
                    checked={templateFormData.days.includes(day)}
                    onChange={handleTemplateFormChange}
                    size="small"
                  />
                  <Typography variant="caption">{day}</Typography>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box mt={2}>
            <FormControl fullWidth>
              <InputLabel>Recurring</InputLabel>
              <Select
                value={templateFormData.recurring ? "yes" : "no"}
                onChange={(e) =>
                  setTemplateFormData((prev) => ({
                    ...prev,
                    recurring: e.target.value === "yes",
                  }))
                }
                label="Recurring"
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box mt={3} display="flex" justifyContent="space-between">
            <Button variant="contained" onClick={handleTemplateSave}>
              Save Template
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setTemplateModalOpen(false)}
            >
              Cancel
            </Button>
          </Box>

          <Box mt={3}>
            <Typography variant="subtitle1">Existing Templates</Typography>
            {templates.map((temp, index) => (
              <Box
                key={index}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mt={1}
                p={1}
                sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}
              >
                <Typography>
                  {temp.label} ({temp.start} - {temp.end} on {temp.days.join(", ")})
                  {temp.breakStart || temp.breakMinutes ? (
                    <>
                      {" "}• Break {temp.breakStart ? `${temp.breakStart}–${temp.breakEnd || ""}` : `${temp.breakMinutes} min`}{" "}
                      {temp.breakPaid ? "(paid)" : "(unpaid)"}
                    </>
                  ) : null}
                </Typography>
                <Box>
                  <Button size="small" onClick={() => handleTemplateEdit(index)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleTemplateDelete(index)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Modal>

      {/* ================================ Snackbars ================================ */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg("")}
      >
        <Alert severity="success">{successMsg}</Alert>
      </Snackbar>
      <Snackbar
        open={!!warningMsg}
        autoHideDuration={7000}
        onClose={() => setWarningMsg("")}
      >
        <Alert severity="warning">{warningMsg}</Alert>
      </Snackbar>
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={5000}
        onClose={() => setErrorMsg("")}
      >
        <Alert severity="error" sx={{ whiteSpace: "pre-wrap" }}>
          {errorMsg}
        </Alert>
      </Snackbar>

      {/* ======================= Employee Shift Summary — Accordion per Employee ====================== */}
      <Box mt={4}>
        <Paper elevation={0} sx={{ mb: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
          <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
            {selectedShiftIds.length > 0 ? (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
                  {selectedShiftIds.length} selected
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleBulkDeleteShifts}
                >
                  Delete Selected
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedShiftIds([])}
                >
                  Clear selection
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Employee Shift Summary
                </Typography>
                <TextField
                  size="small"
                  placeholder="Search employee / date / status / note…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setEmpPage(1);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 280 }}
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel id="per-page-label">Per page</InputLabel>
                  <Select
                    labelId="per-page-label"
                    label="Per page"
                    size="small"
                    value={employeesPerPage}
                    onChange={(e) => {
                      setEmployeesPerPage(Number(e.target.value));
                      setEmpPage(1);
                    }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={8}>8</MenuItem>
                    <MenuItem value={12}>12</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={compact}
                      onChange={(e) => setCompact(e.target.checked)}
                    />
                  }
                  label="Compact"
                />
              </>
            )}
          </Toolbar>
          <Divider />
          <Box display="flex" alignItems="center" gap={1} sx={{ px: 2, py: 1 }}>
            <Checkbox
              indeterminate={someSelectedOnPage}
              checked={allSelectedOnPage}
              onChange={(e) => toggleSelectAllVisible(e.target.checked)}
              inputProps={{ "aria-label": "select all visible shifts" }}
            />
            <Typography variant="body2">
              Select all shifts on this page
            </Typography>
            <Box sx={{ ml: "auto" }}>
              <Pagination
                color="primary"
                shape="rounded"
                page={empPage}
                count={totalEmployeePages}
                onChange={(_, p) => setEmpPage(p)}
              />
            </Box>
          </Box>
        </Paper>

        {/* one accordion per employee, collapsed by default */}
        {pagedEmployees.length === 0 ? (
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary">No shifts match your filters.</Typography>
          </Paper>
        ) : (
          <Stack spacing={1}>
            {pagedEmployees.map((group) => {
              const gid = group.recruiter_id;
              const empAll = isEmployeeAllSelected(gid);
              const empSome = isEmployeeSomeSelected(gid);

              return (
                <Accordion key={gid} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                      <Checkbox
                        indeterminate={empSome}
                        checked={empAll}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => toggleSelectEmployee(gid, e.target.checked)}
                      />
                      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main, width: 32, height: 32 }}>
                        {group.employee?.charAt(0) || "E"}
                      </Avatar>
                      <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                        {group.employee}
                      </Typography>
                      <Chip size="small" label={`${group.rows.length} shifts`} />
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                      <Table size={compact ? "small" : "medium"} stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ minWidth: 160, fontWeight: 600 }}>Note</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.rows.map((row) => {
                            const checked = selectedShiftIds.includes(row.id);
                            const statusColor =
                              row.status === "accepted"
                                ? "success"
                                : row.status === "pending"
                                ? "warning"
                                : row.status === "rejected"
                                ? "error"
                                : "info";
                            return (
                              <TableRow key={row.id} hover selected={checked}>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={checked}
                                    onChange={(e) => {
                                      setSelectedShiftIds((prev) =>
                                        e.target.checked
                                          ? [...prev, row.id]
                                          : prev.filter((id) => id !== row.id)
                                      );
                                    }}
                                  />
                                </TableCell>

                                <TableCell sx={{ whiteSpace: "nowrap" }}><Typography variant="body2">{row.date}</Typography></TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                  {row.start}–{row.end}
                                </TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                  <Chip size="small" label={row.status} color={statusColor} variant="outlined" />
                                </TableCell>
                                <TableCell sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {row.note}
                                </TableCell>

                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                  <IconButton
                                    size="small"
                                    aria-label="Row actions"
                                    onClick={(e) => {
                                      setRowMenuAnchor(e.currentTarget);
                                      setRowMenuId(row.id);
                                    }}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        )}

        <Menu
          anchorEl={rowMenuAnchor}
          open={Boolean(rowMenuAnchor)}
          onClose={() => {
            setRowMenuAnchor(null);
            setRowMenuId(null);
          }}
        >
          <MenuItem
            onClick={() => {
              if (rowMenuId) openEditShiftById(rowMenuId);
              setRowMenuAnchor(null);
              setRowMenuId(null);
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (rowMenuId) handleDeleteSingle(rowMenuId);
              setRowMenuAnchor(null);
              setRowMenuId(null);
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
      </Box>
      </>
      ) : shiftManagementTab === "insights" ? (
        <ShiftInsightsPanel
          insights={shiftInsights}
          departments={departments}
          recruiters={recruiters}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          selectedRecruiters={selectedRecruiters}
          setSelectedRecruiters={setSelectedRecruiters}
          selectedMonth={selectedMonth}
          dateRange={dateRange}
          handleMonthChange={handleMonthChange}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onRangePreset={handleShiftInsightRangePreset}
          onResetFilters={resetShiftInsightFilters}
          onRefresh={() => {
            fetchShifts();
            fetchTimeEntries();
          }}
        />
      ) : shiftManagementTab === "workforce-cost" ? (
        <WorkforceCostAnalytics compact />
      ) : (
        <WorkforceCostInsightsPanel
          insights={shiftCostInsights}
          costSlice={costInsightSlice}
          setCostSlice={setCostInsightSlice}
          costGroupBy={costInsightGroupBy}
          setCostGroupBy={setCostInsightGroupBy}
          costViewBy={costInsightViewBy}
          setCostViewBy={setCostInsightViewBy}
          dateRange={dateRange}
          selectedMonth={selectedMonth}
          onRangePreset={handleShiftInsightRangePreset}
          onDateRangeChange={handleShiftInsightDateRangeChange}
          onResetFilters={resetShiftInsightFilters}
          onOpenAnalytics={() => navigate("/manager/analytics?view=workforce-cost")}
        />
      )}
    </Box>
  );
};

export default SecondTeam;
