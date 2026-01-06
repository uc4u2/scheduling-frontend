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
  Pagination,
  Dialog,
  GlobalStyles,
  useTheme,
  useMediaQuery,
  Avatar,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp, InfoOutlined } from "@mui/icons-material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format, endOfMonth, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from "@mui/icons-material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import { DateTime } from "luxon";
import { formatDate, formatTime } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";

// ------------------------------------------------------------------------------------
// Color helpers
// ------------------------------------------------------------------------------------
const COLORS = [
  "#E57373", "#81C784", "#64B5F6", "#FFD54F",
  "#4DB6AC", "#BA68C8", "#FF8A65", "#A1887F",
  "#90A4AE", "#F06292"
];
const getColorForRecruiter = (recruiterId) => COLORS[Math.abs(parseInt(recruiterId, 10) || 0) % COLORS.length];
const getReadableTextColor = (hex) => {
  if (!hex || typeof hex !== "string") return "#111";
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  if (Number.isNaN(bigint)) return "#111";
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  // Perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111" : "#fff";
};
const hexToRgba = (hex, alpha = 0.15) => {
  if (!hex || typeof hex !== "string") return `rgba(0,0,0,${alpha})`;
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

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
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));

  /* --------------------------- view & layout state --------------------------- */
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [calendarHeight, setCalendarHeight] = useState("auto");
  const [calendarWidth, setCalendarWidth] = useState("100%");
  // put this near your other utils in Team.js
const asLocalDate = (ymd) => {
  if (!ymd) return new Date();
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1); // constructs a LOCAL date
};

  // NEW — enterprise week/day options
  const [innerCalView, setInnerCalView] = useState("timeGridDay"); // "timeGridWeek" | "timeGridDay"
  const [granularity, setGranularity] = useState("00:30:00");       // 15/30/60
  const [timeFmt12h, setTimeFmt12h] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [workHoursOnly, setWorkHoursOnly] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);

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

  /* ------------------------------- messaging -------------------------------- */
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ------------------------------- calendar refs ----------------------------- */
  const calendarRef = useRef(null);
  const fsCalendarRef = useRef(null);
  const pendingRevertCallbackRef = useRef(null);
  const [pendingEventUpdate, setPendingEventUpdate] = useState(null);
  const [availabilityOverlay, setAvailabilityOverlay] = useState([]);

  /* ------------------------------ date range -------------------------------- */
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(addDays(new Date(), 30), "yyyy-MM-dd"),
  });

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
        const color = getColorForRecruiter(s.recruiter_id);
        const isOnLeave = s.on_leave === true;
        const rec = recruiters.find((r) => r.id === s.recruiter_id);
        const bgTint = hexToRgba(color, 0.14);
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
          backgroundColor: isOnLeave ? "#f0f0f0" : bgTint,
          borderColor: isOnLeave ? "#ccc" : color,
          textColor: isOnLeave ? "#666" : "#111",
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
    ]
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
    const accent = xp._empColor || "#1976d2";
    const emp = xp.recruiter_name || `Emp ${xp.recruiter_id || ""}`;
    const status = (xp.status || "assigned").toUpperCase();
    const viewType = arg.view && arg.view.type ? arg.view.type : "";
    const showAvatar =
      viewType.startsWith("timeGridDay") ||
      viewType.startsWith("timeGridWeek") ||
      viewType === "dayGridMonth";
    const startTime = arg.timeText || "";
    const endTime = arg.event.end
      ? format(arg.event.end, timeFmt12h ? "hh:mmaaa" : "HH:mm")
      : "";

    return (
      <div
        style={{
          padding: "4px 6px 6px",
          borderLeft: `4px solid ${accent}`,
          lineHeight: 1.2,
          background: hexToRgba(accent, 0.12),
          borderRadius: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 0.3,
              padding: "2px 6px",
              borderRadius: 8,
              background: xp.status === "accepted" ? "#e6f4ea" : "#e8f0fe",
              border: `1px solid ${xp.status === "accepted" ? "#34a853" : "#1a73e8"}`,
              color: "#111",
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
                borderRadius: 8,
                background: "#e6f4ea",
                border: "1px solid #34a853",
                color: "#111",
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
                borderRadius: 8,
                background: "#fff8e1",
                border: "1px solid #ffb300",
                color: "#111",
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
                borderRadius: 8,
                background: "#ffebee",
                border: "1px solid #e53935",
                color: "#111",
              }}
            >
              Missed clock‑in
            </span>
          ) : null}
          {showAvatar && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#111" }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundImage: xp.profile_image_url ? `url(${xp.profile_image_url})` : "none",
                  backgroundColor: "#e0e0e0",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#444",
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
                  color: "#111",
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
                color: "#111",
              }}
            >
              {emp}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#111", marginBottom: 2 }}>
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
                borderRadius: 8,
                background: "#fff3e0",
                border: "1px solid #fb8c00",
                color: "#111",
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
                borderRadius: 8,
                background: "#ffebee",
                border: "1px solid #e53935",
                color: "#111",
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
                borderRadius: 8,
                background: "#fce4ec",
                border: "1px solid #d81b60",
                color: "#111",
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
    const start = info.event.start ? format(info.event.start, timeFmt12h ? "hh:mmaaa" : "HH:mm") : "";
    const end = info.event.end ? format(info.event.end, timeFmt12h ? "hh:mmaaa" : "HH:mm") : "";
    const loc = xp.location ? `\nLocation: ${xp.location}` : "";
    const note = xp.note ? `\nNote: ${xp.note}` : "";
    info.el.setAttribute("title", `${emp}\n${start}–${end}${loc}${note}`);
    const accent = xp._empColor || "#1976d2";
    info.el.style.borderRadius = "12px";
    info.el.style.boxShadow = "0 4px 10px rgba(15,23,42,0.12)";
    info.el.style.borderLeft = `4px solid ${accent}`;
    info.el.style.background = hexToRgba(accent, 0.16);
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
      left: "prev,next today",
      center: "title",
      right: "timeGridWeek,timeGridDay,dayGridMonth",
    },
    initialView: innerCalView,
  };

  /* --------------------------------- render --------------------------------- */
  return (
    <Box
      sx={{
        bgcolor: { xs: "transparent", md: "background.default" },
        pt: 0,
        mt: 0,
        px: { xs: 1, md: 2 },
        pb: { xs: 1, md: 2 },
      }}
    >
      {/* Global tweaks for readability in timeGrid */}
      <GlobalStyles
        styles={{
          ".fc .fc-timegrid-slot": {
            height: compactDensity ? 26 : 32,
          },
          ".fc .fc-timegrid-axis-cushion, .fc .fc-timegrid-slot-label-cushion": {
            fontSize: 12,
          },
          ".fc .fc-timegrid-event": {
            borderRadius: 8,
            boxShadow: "0 1px 0 rgba(0,0,0,0.08)",
          },
          ".fc .fc-timegrid-col.fc-day-today": {
            background: "linear-gradient(180deg, rgba(37,99,235,0.05) 0%, rgba(37,99,235,0.01) 100%)",
          },
          ".fc .fc-timegrid-now-indicator-line": {
            borderColor: "#e53935",
            borderWidth: "2px",
          },
          ".fc .fc-timegrid-now-indicator-arrow": {
            borderColor: "transparent transparent #e53935 transparent",
            borderWidth: "0 6px 8px 6px",
          },
          ".fc .fc-timegrid-slot-lane:nth-of-type(odd)": {
            backgroundColor: "rgba(0,0,0,0.015)",
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
          },
        }}
      />



      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        Shift Management
      </Typography>

      {/* Filters row */}
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
                <TextField
                  type="month"
                  label="Month"
                  value={selectedMonth}
                  onChange={(e) => {
                    const month = e.target.value;
                    setSelectedMonth(month);
                    const first = `${month}-01`;
                    const last = format(endOfMonth(asLocalDate(first)), "yyyy-MM-dd");

                    setDateRange({ start: first, end: last });
                    setSelectedDate(first);
                  }}
                  InputLabelProps={{ shrink: true }}
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
            <TextField
              type="month"
              label="Month"
              value={selectedMonth}
              onChange={(e) => {
                const month = e.target.value;
                setSelectedMonth(month);
                const first = `${month}-01`;
const last = format(endOfMonth(asLocalDate(first)), "yyyy-MM-dd");

                setDateRange({ start: first, end: last });
                setSelectedDate(first);
              }}
              InputLabelProps={{ shrink: true }}
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

      {/* Action row */}
      <Box
        mb={2}
        display="flex"
        gap={1}
        alignItems={{ xs: "stretch", md: "center" }}
        flexWrap="wrap"
        sx={{
          flexDirection: { xs: "column", md: "row" },
          position: { xs: "sticky", md: "static" },
          top: { xs: 8, md: "auto" },
          zIndex: 10,
          bgcolor: { xs: "background.paper", md: "transparent" },
          py: { xs: 1, md: 0 },
        }}
      >
        <Button variant="outlined" onClick={openTemplateModal} fullWidth={isMdDown}>
          Edit Templates
        </Button>

        <Tooltip title={selectedRecruiters.length === 0 ? "Select at least one employee above" : ""}>
          <span>
            <Button
              variant="contained"
              onClick={handleOpenAssignShift}
              disabled={selectedRecruiters.length === 0}
              fullWidth={isMdDown}
            >
              Assign Shift
            </Button>
          </span>
        </Tooltip>

        <Button variant="outlined" onClick={handleExportToExcel} fullWidth={isMdDown}>
          Export to Excel
        </Button>

        <Button variant="outlined" onClick={fetchShifts} fullWidth={isMdDown}>
          Refresh
        </Button>

        <Button
          variant="outlined"
          onClick={() => setCalendarHeight(calendarHeight === "auto" ? "90vh" : "auto")}
          fullWidth={isMdDown}
        >
          {calendarHeight === "auto" ? "Fixed Height" : "Auto Height"}
        </Button>

        <Button
          variant="outlined"
          onClick={() => setCalendarWidth(calendarWidth === "100%" ? "300%" : "100%")}
          fullWidth={isMdDown}
        >
          {calendarWidth === "100%" ? "Expand Width" : "Collapse Width"}
        </Button>

        <Button
          startIcon={<OpenInFullIcon />}
          variant="contained"
          onClick={() => setFullScreenOpen(true)}
          fullWidth={isMdDown}
        >
          Full Screen
        </Button>
      </Box>

      {/* =============================== WEEK/DAY MODE ============================== */}
      <>
          <Paper
            sx={{
              p: compactDensity ? 1 : 2,
              mb: 4,
              minHeight: isSmDown ? "360px" : "600px",
              width: calendarWidth,
              maxWidth: "150vw",
              overflowX: calendarWidth !== "100%" ? "auto" : "hidden",
              border: { xs: "none", md: "none" },
              borderColor: { xs: "transparent", md: "transparent" },
              boxShadow: { xs: "none", md: 1 },
              bgcolor: { xs: "transparent", md: "background.paper" },
              mx: { xs: -4, md: 0 },
              width: { xs: "calc(100% + 64px)", md: calendarWidth },
            }}
            elevation={isSmDown ? 0 : 1}
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
                    bgcolor: getColorForRecruiter(r.id),
                    border: "1px solid rgba(0,0,0,0.2)",
                    color: "#111",
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
                background: "white",
                p: 2,
                borderRadius: 2,
                boxShadow: 3,
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

          {/* Full Screen dialog with calendar */}
          <Dialog fullScreen open={fullScreenOpen} onClose={() => setFullScreenOpen(false)}>
            <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={() => setFullScreenOpen(false)}>
                <CloseFullscreenIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flex: 1 }}>Shifts — Full Screen</Typography>

              <ToggleButtonGroup
                size="small"
                exclusive
                value={innerCalView}
                onChange={(_, v) => v && setInnerCalView(v)}
                sx={{ mr: 1 }}
              >
                <ToggleButton value="timeGridWeek">Week</ToggleButton>
                <ToggleButton value="timeGridDay">Day</ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup
                size="small"
                value={[granularity]}
                onChange={(_, val) => { const v = Array.isArray(val) ? val[0] : val; if (v) setGranularity(v); }}
                sx={{ mr: 1 }}
              >
                <ToggleButton value="00:15:00">15m</ToggleButton>
                <ToggleButton value="00:30:00">30m</ToggleButton>
                <ToggleButton value="01:00:00">60m</ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup
                size="small"
                value={timeFmt12h ? ["12h"] : ["24h"]}
                onChange={() => setTimeFmt12h((s) => !s)}
                sx={{ mr: 1 }}
              >
                <ToggleButton value="12h">12-hour</ToggleButton>
                <ToggleButton value="24h">24-hour</ToggleButton>
              </ToggleButtonGroup>

              <Button variant="outlined" onClick={fetchShifts}>Refresh</Button>
            </Box>

            <Box sx={{ p: compactDensity ? 1 : 2 }}>
              <Paper sx={{ p: compactDensity ? 0 : 1 }}>
                <FullCalendar
                  ref={fsCalendarRef}
                  {...baseCalProps}
                  key={`fs-${innerCalView}-${granularity}-${timeFmt12h}-${showWeekends}-${workHoursOnly}-${compactDensity}`}
                  height="calc(100vh - 96px)"
                  initialView={innerCalView}
                />
              </Paper>
            </Box>

            <Box sx={{ px: 2, pb: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button startIcon={<CloseFullscreenIcon />} variant="contained" onClick={() => setFullScreenOpen(false)}>
                Close
              </Button>
            </Box>
          </Dialog>
        </>

      {/* ============================ Add/Edit Shift Modal ============================ */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingShift(null);
          setSelectedAvailabilityIds([]);
          setModalAvailabilitySlots([]);
        }}
      >
        <Box
          sx={{
            p: { xs: 2.5, sm: 4 },
            bgcolor: "background.paper",
            width: { xs: "calc(100% - 24px)", sm: 520 },
            maxWidth: 640,
            mx: "auto",
            mt: { xs: "5vh", sm: "10%" },
            borderRadius: 2,
            boxShadow: 6,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ overflowY: "auto", pr: { xs: 0, sm: 1 } }}>
            <Typography variant="h6" gutterBottom>
              {editingShift ? "Edit Shift" : "Add New Shift"}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  margin="normal"
                  name="date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.date}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  margin="normal"
                  name="startTime"
                  InputLabelProps={{ shrink: true }}
                  value={formData.startTime}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="time"
                  margin="normal"
                  name="endTime"
                  InputLabelProps={{ shrink: true }}
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
                    <TextField
                      fullWidth
                      label="Break start"
                      type="time"
                      margin="normal"
                      name="breakStart"
                      InputLabelProps={{ shrink: true }}
                      value={formData.breakStart}
                      onChange={handleFormChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Break end"
                      type="time"
                      margin="normal"
                      name="breakEnd"
                      InputLabelProps={{ shrink: true }}
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
                        <TextField
                          fullWidth
                          label="Window start"
                          type="time"
                          margin="normal"
                          name="breakWindowStart"
                          InputLabelProps={{ shrink: true }}
                          value={formData.breakWindowStart}
                          onChange={handleFormChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Window end"
                          type="time"
                          margin="normal"
                          name="breakWindowEnd"
                          InputLabelProps={{ shrink: true }}
                          value={formData.breakWindowEnd}
                          onChange={handleFormChange}
                        />
                      </Grid>
                    </>
                  )}
                  {formData.breakMode === "window" && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Must start by"
                        helperText="Latest time an employee can begin their break."
                        type="time"
                        margin="normal"
                        name="breakLatestStart"
                        InputLabelProps={{ shrink: true }}
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
                      <TextField
                        label="End date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
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
                <Button variant="contained" onClick={handleUpdateShift}>
                  Update Shift
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteShift}
                >
                  Delete Shift
                </Button>
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

      {/* ============================ Template Editor Modal ============================ */}
      <Modal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)}>
        <Box
          sx={{
            p: 4,
            bgcolor: "white",
            width: 500,
            mx: "auto",
            mt: "8%",
            borderRadius: 2,
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
          <TextField
            fullWidth
            label="Start Time"
            type="time"
            margin="normal"
            name="start"
            InputLabelProps={{ shrink: true }}
            value={templateFormData.start}
            onChange={handleTemplateFormChange}
          />
          <TextField
            fullWidth
            label="End Time"
            type="time"
            margin="normal"
            name="end"
            InputLabelProps={{ shrink: true }}
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
                  <TextField
                    fullWidth
                    label="Break start"
                    type="time"
                    margin="normal"
                    name="breakStart"
                    InputLabelProps={{ shrink: true }}
                    value={templateFormData.breakStart}
                    onChange={handleTemplateFormChange}
                    helperText="Optional default pause"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Break end"
                    type="time"
                    margin="normal"
                    name="breakEnd"
                    InputLabelProps={{ shrink: true }}
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
                      <TextField
                        fullWidth
                        label="Window start"
                        type="time"
                        margin="normal"
                        name="breakWindowStart"
                        InputLabelProps={{ shrink: true }}
                        value={templateFormData.breakWindowStart}
                        onChange={handleTemplateFormChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Window end"
                        type="time"
                        margin="normal"
                        name="breakWindowEnd"
                        InputLabelProps={{ shrink: true }}
                        value={templateFormData.breakWindowEnd}
                        onChange={handleTemplateFormChange}
                      />
                    </Grid>
                  </>
                )}
                {templateFormData.breakMode === "window" && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Must start by"
                      type="time"
                      margin="normal"
                      name="breakLatestStart"
                      InputLabelProps={{ shrink: true }}
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
                sx={{ border: "1px solid #ccc", borderRadius: 1 }}
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
        <Paper elevation={1} sx={{ mb: 2 }}>
          <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Employee Shift Summary
            </Typography>

            <TextField
              size="small"
              placeholder="Search employee / date / status / note…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setEmpPage(1); // reset to page 1 on new search
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

            <Tooltip title={selectedShiftIds.length === 0 ? "Select rows first" : ""}>
              <span>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={selectedShiftIds.length === 0}
                  onClick={handleBulkDeleteShifts}
                >
                  Delete Selected ({selectedShiftIds.length})
                </Button>
              </span>
            </Tooltip>
          </Toolbar>
          <Divider />
        </Paper>

        {/* top-level select-all (this page only) */}
        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
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
                      <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                        {group.employee}
                      </Typography>
                      <Chip size="small" label={`${group.rows.length} shift(s)`} />
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size={compact ? "small" : "medium"}>
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell>Date</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell sx={{ minWidth: 160 }}>Note</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.rows.map((row) => {
                            const checked = selectedShiftIds.includes(row.id);
                            return (
                              <TableRow key={row.id} hover>
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

                                <TableCell sx={{ whiteSpace: "nowrap" }}>{row.date}</TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                  {row.start}–{row.end}
                                </TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>{row.status}</TableCell>
                                <TableCell sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {row.note}
                                </TableCell>

                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => openEditShiftById(row.id)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteSingle(row.id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
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

        {/* bottom bar with pagination + bulk actions (optional) */}
        <Box mt={2} display="flex" alignItems="center">
          <Pagination
            color="primary"
            shape="rounded"
            page={empPage}
            count={totalEmployeePages}
            onChange={(_, p) => setEmpPage(p)}
          />
          {selectedShiftIds.length > 0 && (
            <Box ml="auto">
              <Button variant="outlined" color="error" onClick={handleBulkDeleteShifts}>
                🗑 Delete Selected ({selectedShiftIds.length})
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SecondTeam;
