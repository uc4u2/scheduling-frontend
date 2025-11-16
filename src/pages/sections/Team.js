import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
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
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
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
import { formatDate, formatTime } from "../../utils/datetime";

// ------------------------------------------------------------------------------------
// Color helpers
// ------------------------------------------------------------------------------------
const COLORS = [
  "#E57373", "#81C784", "#64B5F6", "#FFD54F",
  "#4DB6AC", "#BA68C8", "#FF8A65", "#A1887F",
  "#90A4AE", "#F06292"
];
const getColorForRecruiter = (recruiterId) => COLORS[Math.abs(parseInt(recruiterId, 10) || 0) % COLORS.length];

// ------------------------------------------------------------------------------------
// Constants & utils
// ------------------------------------------------------------------------------------
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
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

/* =============================================================================
   Team / Shift Management (Setmore-style)
   - Month + Day chips view (clean overview)
   - Week/Day views (drag & drop editing, pro rendering)
   - Shift Template box + editor modal
   - Export, bulk delete, summary table
   - NEW: Pro options (granularity, 12/24h, weekends, work hours, compact, full-screen)
   ========================================================================== */
const SecondTeam = () => {
  const navigate = useNavigate();

  /* --------------------------- view & layout state --------------------------- */
  const [viewMode, setViewMode] = useState("month"); // 'month' | 'week'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [calendarHeight, setCalendarHeight] = useState("600px");
  const [calendarWidth, setCalendarWidth] = useState("100%");
  // put this near your other utils in Team.js
const asLocalDate = (ymd) => {
  if (!ymd) return new Date();
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1); // constructs a LOCAL date
};

  // NEW — enterprise week/day options
  const [innerCalView, setInnerCalView] = useState("timeGridWeek"); // "timeGridWeek" | "timeGridDay"
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

  /* --------------------------------- data ----------------------------------- */
  const [shifts, setShifts] = useState([]);
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);

  /* ============================ summary helpers/state ============================ */
  const [compact, setCompact] = useState(true);
  const [query, setQuery] = useState("");

  // ✅ NEW: employee pagination (avoids tall lists)
  const [empPage, setEmpPage] = useState(1);           // 1-based
  const [employeesPerPage, setEmployeesPerPage] = useState(8);

  // flatten shifts into table rows (stable keys for selection/edit)
  const flatRows = useMemo(() => {
    return (shifts || []).map((s) => ({
      id: s.id,
      recruiter_id: s.recruiter_id,
      employee: recruiters.find((r) => r.id === s.recruiter_id)?.name || String(s.recruiter_id),
      date: s.date,
      start: s.clock_in  ? format(new Date(s.clock_in), "HH:mm")  : "",
end:   s.clock_out ? format(new Date(s.clock_out), "HH:mm") : "",

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
    const startD = shift?.clock_in ? new Date(shift.clock_in) : null;
    const endD = shift?.clock_out ? new Date(shift.clock_out) : null;

    setFormData({
      date: startD ? formatDate(startD) : shift.date || "",
      startTime: startD ? formatTime(startD) : "",
      endTime: endD ? formatTime(endD) : "",
      location: shift.location || "",
      note: shift.note || "",
      recurring: false,
      recurringDays: [],
      selectedTemplate: "",
      repeatMode: "weeks",
      repeatWeeks: 2,
      repeatUntil: "",
      breakStart: toTimeInputValue(shift.break_start),
      breakEnd: toTimeInputValue(shift.break_end),
      breakMinutes: shift.break_minutes ?? "",
      breakPaid: Boolean(shift.break_paid),
    });
    setSelectedAvailabilityIds(shift.availability_id ? [shift.availability_id] : []);
    fetchAvailabilityForModal(shift.recruiter_id, shift.date);

    setModalOpen(true);
  };

  // single delete (re-uses your bulk delete API)
  const handleDeleteSingle = async (id) => {
    try {
      await fetch(`${API_URL}/automation/shifts/delete/${id}`, {
        method: "DELETE",
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
    const newStart = new Date(`${date}T${startTime}`);
    const newEnd = new Date(`${date}T${endTime}`);
    return shifts.some((s) => {
      if (s.recruiter_id !== recruiterId) return false;
      if (shiftIdToExclude && s.id === shiftIdToExclude) return false;
      const existingStart = new Date(s.clock_in);
      const existingEnd = new Date(s.clock_out);
      return newStart < existingEnd && newEnd > existingStart;
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
        const res = await fetch(`${API_URL}/api/departments`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
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
  }, [selectedDepartment, getAuthHeaders]);

  useEffect(() => {
    fetchShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recruiters, selectedRecruiters, dateRange, getAuthHeaders]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/shift-templates`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();

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
            const res = await fetch(
              `${API_URL}/manager/recruiters/${rid}/availability?start_date=${dateRange.start}&end_date=${dateRange.end}`,
              { headers: getAuthHeaders() }
            );
            if (!res.ok) {
              return { recruiterId: rid, slots: [] };
            }
            const data = await res.json();
            const slots = (data?.availability || data || []).map((slot) => ({
              ...slot,
              recruiter_id: rid,
            }));
            return { recruiterId: rid, slots };
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
      const res = await fetch(
        `${API_URL}/manager/recruiters${
          selectedDepartment ? `?department_id=${selectedDepartment}` : ""
        }`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      const list = (data.recruiters || []).map((r) => ({
        ...r,
        name: r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim(),
      }));
      setRecruiters(list);
    } catch {
      setErrorMsg("Failed to fetch recruiters.");
    }
  };

  const fetchShifts = async () => {
    try {
      const ids = selectedRecruiters.length
        ? selectedRecruiters.join(",")
        : recruiters.map((r) => r.id).join(",");
      const url = `${API_URL}/automation/shifts/range?start_date=${dateRange.start}&end_date=${dateRange.end}&recruiter_ids=${ids}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      setShifts(data.shifts || []);
    } catch {
      setErrorMsg("Failed to fetch shifts.");
    }
  };

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
        const res = await fetch(
          `${API_URL}/manager/recruiters/${recruiterId}/availability?start_date=${startDate}&end_date=${endDate}`,
          { headers: getAuthHeaders() }
        );
        const data = await res.json();
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

  // Events for WEEK/DAY view (editable, drag/resize)
  const calendarEvents = useMemo(
    () =>
      filteredShifts.map((s) => {
        const color = getColorForRecruiter(s.recruiter_id);
        const isOnLeave = s.on_leave === true;
        return {
          id: String(s.id),
          title: `${s.status || "assigned"}`,
          start: s.clock_in, // ISO string (browser renders in local TZ)
          end: s.clock_out,
          backgroundColor: isOnLeave ? "#f0f0f0" : (s.status === "accepted" ? "#e6f4ea" : "#e8f0fe"),
          borderColor: isOnLeave ? "#ccc" : color,
          textColor: isOnLeave ? "#999" : "#111",
          editable: !isOnLeave,
          classNames: [isOnLeave ? "shift-leave" : "shift-event"],
          extendedProps: {
            location: s.location,
            note: s.note,
            recruiter_id: s.recruiter_id,
            recruiter_name: recruiters.find((r) => r.id === s.recruiter_id)?.name || `Emp ${s.recruiter_id}`,
            status: s.status,
            leave_reason: s.leave_reason || null,
            _empColor: color,
          },
        };
      }),
    [filteredShifts, recruiters]
  );

  // Events for MONTH view (non-editable, just for navigating days)
  const monthEvents = useMemo(
    () =>
      filteredShifts.map((s) => ({
        id: String(s.id),
        title:
          recruiters.find((r) => r.id === s.recruiter_id)?.name ||
          `Emp ${s.recruiter_id}`,
        start: s.clock_in,
        end: s.clock_out,
        backgroundColor: getColorForRecruiter(s.recruiter_id),
        borderColor: getColorForRecruiter(s.recruiter_id),
        textColor: "#000",
        classNames: ["shift-event-month"],
      })),
    [filteredShifts, recruiters]
  );

  // Day rail chips (for selectedDate)
  const dayChips = useMemo(() => {
    const list = filteredShifts
      .filter((s) => {
  const localDateFromISO = format(new Date(s.clock_in), "yyyy-MM-dd");
  return s.date === selectedDate || localDateFromISO === selectedDate;
})

      .map((s) => {
        const start = new Date(s.clock_in);
        const end = new Date(s.clock_out);
        const startLabel = format(start, "HH:mm");
        const endLabel = format(end, "HH:mm");
        const name =
          recruiters.find((r) => r.id === s.recruiter_id)?.name ||
          s.recruiter_id;
        return {
          key: `${s.id}-${s.clock_in}`,
          id: s.id,
          recruiter_id: s.recruiter_id,
          label: `${startLabel}–${endLabel} • ${name} (${s.status})`,
          color: getColorForRecruiter(s.recruiter_id),
          raw: s,
        };
      })
      .sort((a, b) => (a.raw.clock_in < b.raw.clock_in ? -1 : 1));

    return list;
  }, [filteredShifts, recruiters, selectedDate]);
  const canLinkAvailability = Boolean(editingShift) || selectedRecruiters.length === 1;

  /* ------------------------------- handlers --------------------------------- */
  const handleMonthDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
  };
  const handleMonthEventClick = (info) => {
    if (info.event.start) {
      setSelectedDate(format(info.event.start, "yyyy-MM-dd"));
    }
  };

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
    });
  };

  const handleSavePendingEventUpdate = async () => {
    if (!pendingEventUpdate) return;
    const newDate = format(pendingEventUpdate.newStart, "yyyy-MM-dd");
    const newStartTime = format(pendingEventUpdate.newStart, "HH:mm");
    const newEndTime = format(pendingEventUpdate.newEnd, "HH:mm");
    const payload = {
      date: newDate,
      clock_in: `${newDate}T${newStartTime}`,
      clock_out: `${newDate}T${newEndTime}`,
      location: pendingEventUpdate.location,
      note: pendingEventUpdate.note,
      status: pendingEventUpdate.status,
    };
    try {
      const res = await fetch(
        `${API_URL}/automation/shifts/update/${pendingEventUpdate.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        setSuccessMsg("Shift update saved successfully.");
        setPendingEventUpdate(null);
        pendingRevertCallbackRef.current = null;
        fetchShifts();
      } else {
        setErrorMsg("Error saving shift update.");
      }
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
    if (shift) {
      setEditingShift(shift);
      const sD = shift?.clock_in ? new Date(shift.clock_in) : null;
      const eD = shift?.clock_out ? new Date(shift.clock_out) : null;

      setFormData({
        date: sD ? formatDate(sD) : shift.date || "",
        startTime: sD ? formatTime(sD) : "",
        endTime: eD ? formatTime(eD) : "",
        location: shift.location || "",
        note: shift.note || "",
        recurring: false,
        recurringDays: [],
        selectedTemplate: "",
        breakStart: toTimeInputValue(shift.break_start),
        breakEnd: toTimeInputValue(shift.break_end),
        breakMinutes: shift.break_minutes ?? "",
        breakPaid: Boolean(shift.break_paid),
        repeatMode: "weeks",
        repeatWeeks: 2,
        repeatUntil: "",
      });
      setSelectedAvailabilityIds(shift.availability_id ? [shift.availability_id] : []);
      fetchAvailabilityForModal(shift.recruiter_id, shift.date);

      setModalOpen(true);
    }
  };

  const handleDateClick = (clickInfo) => {
    setEditingShift(null);
    setFormData({
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
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
      setFormData((prev) => ({
        ...prev,
        selectedTemplate: templateLabel,
        startTime: template.start,
        endTime: template.end,
        recurring: template.recurring,
        recurringDays: template.days,
        breakStart: template.breakStart || "",
        breakEnd: template.breakEnd || "",
        breakMinutes: template.breakMinutes || "",
        breakPaid: Boolean(template.breakPaid),
      }));
    } else {
      setFormData((prev) => ({ ...prev, selectedTemplate: "" }));
    }
  };

  const openTemplateModal = () => {
    setTemplateFormData({
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
    } else {
      setTemplateFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
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

    const method = editingTemplateIndex != null ? "PUT" : "POST";
    const id = templates[editingTemplateIndex]?.id;
    const url =
      method === "POST"
        ? `${API_URL}/api/shift-templates`
        : `${API_URL}/api/shift-templates/${id}`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save template");

      setTemplateModalOpen(false);
      setEditingTemplateIndex(null);

      // reload templates
      const resReload = await fetch(`${API_URL}/api/shift-templates`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const dataReload = await resReload.json();
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
    setTemplateFormData({
      id: tpl.id,
      label: tpl.label || "",
      start: tpl.start || "",
      end: tpl.end || "",
      days: tpl.days || [],
      recurring: tpl.recurring !== false,
      breakStart: tpl.breakStart || "",
      breakEnd: tpl.breakEnd || "",
      breakMinutes: tpl.breakMinutes ?? "",
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
          const res = await fetch(`${API_URL}/automation/shifts/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            failures.push(`🔴 Failed - Recruiter ${recruiterId} on ${slot.date}`);
          } else {
            successCount++;
          }
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
            const res = await fetch(`${API_URL}/automation/shifts/create`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
              },
              body: JSON.stringify(payload),
            });
            if (!res.ok) {
              failures.push(`🔴 Failed - Recruiter ${recruiterId} on ${dateStr}`);
            } else {
              successCount++;
            }
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
      await fetch(`${API_URL}/automation/shifts/update/${editingShift.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
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
      await fetch(`${API_URL}/automation/shifts/delete/${editingShift.id}`, {
        method: "DELETE",
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
      const res = await fetch(`${API_URL}/automation/shifts/delete-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ shift_ids: selectedShiftIds }),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccessMsg(result.message || "Shifts deleted successfully.");
        setSelectedShiftIds([]);
        fetchShifts();
      } else {
        setErrorMsg(result.error || "Error deleting shifts.");
      }
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
      ClockIn: s.clock_in,
      ClockOut: s.clock_out,
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
    const url = `${API_URL}/automation/shifts/export?start_date=${dateRange.start}&end_date=${dateRange.end}&recruiter_ids=${ids}`;
    try {
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        setErrorMsg("Failed to export shifts.");
        return;
      }
      const blob = await res.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = "shifts.xlsx";
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

    return (
      <div
        style={{
          padding: "4px 6px 6px",
          borderLeft: `4px solid ${accent}`,
          lineHeight: 1.2,
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
          <span style={{ fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {emp}
          </span>
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
  };

  // shared props for Week/Day calendars
  const baseCalProps = {
    plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
    events: [...calendarEvents, ...availabilityOverlay],
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
    <Box p={4}>
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



      {/* Filters row */}
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
            <InputLabel>Select Recruiters</InputLabel>
            <Select
              multiple
              value={selectedRecruiters}
              onChange={(e) => setSelectedRecruiters(e.target.value)}
              input={<OutlinedInput label="Select Recruiters" />}
              renderValue={(selected) =>
                selected
                  .map((id) => recruiters.find((r) => r.id === id)?.name || id)
                  .join(", ")
              }
            >
              {recruiters.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  <Checkbox checked={selectedRecruiters.indexOf(r.id) > -1} />
                  <ListItemText primary={r.name} />
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

        <Grid item xs={12} md={2} display="flex" gap={1} alignItems="center">
          <Button variant="outlined" onClick={openTemplateModal}>
            Edit Templates
          </Button>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={viewMode}
            onChange={(_, v) => v && setViewMode(v)}
          >
            <ToggleButton value="month" title="Month + Chips">
              Month
            </ToggleButton>
            <ToggleButton value="week" title="Week/Day (drag & drop)">
              Week/Day
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>

      {/* Action row */}
      <Box mb={2} display="flex" gap={1} alignItems="center" flexWrap="wrap">
        <Tooltip title={selectedRecruiters.length === 0 ? "Select at least one employee above" : ""}>
          <span>
            <Button
              variant="contained"
              onClick={handleOpenAssignShift}
              disabled={selectedRecruiters.length === 0}
            >
              Assign Shift
            </Button>
          </span>
        </Tooltip>

        <Button variant="outlined" onClick={handleExportToExcel}>
          Export to Excel
        </Button>

        <Button variant="outlined" onClick={fetchShifts}>
          Refresh
        </Button>
      </Box>

      {/* ============================== MONTH MODE ============================== */}
      {viewMode === "month" && (
        <>
          <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height="auto"
              dayMaxEvents={3}
              events={monthEvents}
              dateClick={handleMonthDateClick}
              eventClick={handleMonthEventClick}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
            />
          </Paper>

          {/* Legend for visible employees */}
          <Stack direction="row" spacing={1} sx={{ mb: 1 }} useFlexGap flexWrap="wrap">
            {recruiters
              .filter(
                (r) =>
                  selectedRecruiters.length === 0 ||
                  selectedRecruiters.includes(r.id)
              )
              .map((r) => (
                <Chip
                  key={r.id}
                  label={r.name}
                  sx={{
                    bgcolor: getColorForRecruiter(r.id),
                    border: "1px solid rgba(0,0,0,0.2)",
                  }}
                />
              ))}
          </Stack>

          {/* Day rail chips */}
          <Paper sx={{ p: 2, mb: 4 }} elevation={1}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {format(asLocalDate(selectedDate), "EEE, MMM d")} — {dayChips.length} shift(s)

              </Typography>
              <Tooltip title="Each chip uses the employee color">
                <Chip size="small" label="Legend: color by employee" />
              </Tooltip>
              <Button size="small" onClick={fetchShifts} sx={{ ml: "auto" }}>
                Refresh
              </Button>
            </Stack>

            {dayChips.length === 0 ? (
              <Typography color="text.secondary">No shifts for this day.</Typography>
            ) : (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {dayChips.map((c) => (
                  <Chip
                    key={c.key}
                    label={c.label}
                    onClick={() => {
                      const s = c.raw;
                      setEditingShift(s);
                      const sD = s?.clock_in ? new Date(s.clock_in) : null;
                      const eD = s?.clock_out ? new Date(s.clock_out) : null;

                      setFormData({
                        date: sD ? formatDate(sD) : s.date || "",
                        startTime: sD ? formatTime(sD) : "",
                        endTime: eD ? formatTime(eD) : "",
                        location: s.location || "",
                        note: s.note || "",
                        recurring: false,
                        recurringDays: [],
                        selectedTemplate: "",
                        breakStart: toTimeInputValue(s.break_start),
                        breakEnd: toTimeInputValue(s.break_end),
                        breakMinutes: s.break_minutes ?? "",
                        breakPaid: Boolean(s.break_paid),
                        repeatMode: "weeks",
                        repeatWeeks: 2,
                        repeatUntil: "",
                      });
                      setSelectedAvailabilityIds(s.availability_id ? [s.availability_id] : []);
                      fetchAvailabilityForModal(s.recruiter_id, s.date);

                      setModalOpen(true);
                    }}
                    sx={{
                      bgcolor: c.color,
                      border: "1px solid rgba(0,0,0,0.2)",
                    }}
                  />
                ))}
              </Stack>
            )}
          </Paper>
        </>
      )}

      {/* =============================== WEEK/DAY MODE ============================== */}
      {viewMode === "week" && (
        <>
          <Typography variant="h6" gutterBottom>
            🧭 Week/Day View
          </Typography>

          {/* Pro options */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} useFlexGap flexWrap="wrap">
            <ToggleButtonGroup
              size="small"
              exclusive
              value={innerCalView}
              onChange={(_, v) => v && setInnerCalView(v)}
            >
              <ToggleButton value="timeGridWeek">Week</ToggleButton>
              <ToggleButton value="timeGridDay">Day</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              value={[granularity]}
              onChange={(_, val) => {
                const v = Array.isArray(val) ? val[0] : val;
                if (v) setGranularity(v);
              }}
            >
              <ToggleButton value="00:15:00">15m</ToggleButton>
              <ToggleButton value="00:30:00">30m</ToggleButton>
              <ToggleButton value="01:00:00">60m</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              value={timeFmt12h ? ["12h"] : ["24h"]}
              onChange={() => setTimeFmt12h((s) => !s)}
            >
              <ToggleButton value="12h">12-hour</ToggleButton>
              <ToggleButton value="24h">24-hour</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              value={showWeekends ? ["weekends"] : []}
              onChange={() => setShowWeekends((s) => !s)}
            >
              <ToggleButton value="weekends">{showWeekends ? "Hide" : "Show"} Weekends</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              value={workHoursOnly ? ["hours"] : []}
              onChange={() => setWorkHoursOnly((s) => !s)}
            >
              <ToggleButton value="hours">{workHoursOnly ? "All Hours" : "Work Hours"}</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              value={compactDensity ? ["compact"] : []}
              onChange={() => setCompactDensity((s) => !s)}
            >
              <ToggleButton value="compact">{compactDensity ? "Comfortable" : "Compact"}</ToggleButton>
            </ToggleButtonGroup>

            <Button variant="outlined" onClick={() =>
              setCalendarHeight(calendarHeight === "90vh" ? "600px" : "90vh")
            }>
              {calendarHeight === "90vh" ? "Collapse Height" : "Expand Height"}
            </Button>

            <Button variant="outlined" onClick={() =>
              setCalendarWidth(calendarWidth === "100%" ? "300%" : "100%")
            }>
              {calendarWidth === "100%" ? "Expand Width" : "Collapse Width"}
            </Button>

            <Button startIcon={<OpenInFullIcon />} variant="contained" onClick={() => setFullScreenOpen(true)}>
              Full Screen
            </Button>

            <Button variant="outlined" onClick={fetchShifts}>Refresh</Button>
          </Stack>

          <Paper
            sx={{
              p: compactDensity ? 1 : 2,
              mb: 4,
              minHeight: "600px",
              width: calendarWidth,
              maxWidth: "150vw",
              overflowX: calendarWidth !== "100%" ? "auto" : "hidden",
            }}
          >
            <FullCalendar
              ref={calendarRef}
              {...baseCalProps}
              key={`${innerCalView}-${granularity}-${timeFmt12h}-${showWeekends}-${workHoursOnly}-${compactDensity}`}
              height={calendarHeight}
              initialView={innerCalView}
            />
          </Paper>

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
                    const sD = shift?.clock_in ? new Date(shift.clock_in) : null;
                    const eD = shift?.clock_out ? new Date(shift.clock_out) : null;

                    setFormData({
                      date: sD ? formatDate(sD) : shift.date || "",
                      startTime: sD ? formatTime(sD) : "",
                      endTime: eD ? formatTime(eD) : "",
                      location: shift.location || "",
                      note: shift.note || "",
                      recurring: false,
                      recurringDays: [],
                      selectedTemplate: "",
                      breakStart: toTimeInputValue(shift.break_start),
                      breakEnd: toTimeInputValue(shift.break_end),
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
                    await fetch(
                      `${API_URL}/automation/shifts/delete/${pendingEventUpdate.id}`,
                      { method: "DELETE", headers: getAuthHeaders() }
                    );
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
      )}

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
            p: 4,
            bgcolor: "white",
            width: 420,
            mx: "auto",
            mt: "10%",
            borderRadius: 2,
            boxShadow: 6,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {editingShift ? "Edit Shift" : "Add New Shift"}
          </Typography>

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
          <TextField
            fullWidth
            label="Location"
            margin="normal"
            name="location"
            value={formData.location}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            label="Note"
            margin="normal"
            name="note"
            value={formData.note}
            onChange={handleFormChange}
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
          </Grid>
          <FormControlLabel
            control={
              <Checkbox
                name="breakPaid"
                checked={formData.breakPaid}
                onChange={handleFormChange}
              />
            }
            label="Break is paid"
          />
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

          <Box mt={3} display="flex" justifyContent="space-between">
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

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12}>
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
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary">
            These defaults flow into shift assignments and employee clock breaks, so values here should
            mirror your labour policy.
          </Typography>

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
