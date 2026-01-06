// src/pages/sections/management/AllEmployeeSlotsCalendar.js
import React, { useState, useEffect, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Typography,
  Alert,
  FormControlLabel,
  Checkbox,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Modal,
  TextField,
  Stack,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  Chip,
  Dialog,
  alpha,
  Menu,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import GlobalStyles from "@mui/material/GlobalStyles";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import api from "../../utils/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import moment from "moment-timezone";

import { useRecruiterMeetingHandler } from "./SecondMasterCalendar";
import "./manager-calendar.css";

// Timezone-safe utilities (use these for the TZ rules)
import { isoFromParts } from "../../utils/datetime";
import { formatSlotWithTZ } from "../../utils/timezone-wrapper";

// consistent employee color (used for accents)
const COLORS = [
  "#E57373", "#81C784", "#64B5F6", "#FFD54F",
  "#4DB6AC", "#BA68C8", "#FF8A65", "#A1887F",
  "#90A4AE", "#F06292"
];
const colorForEmp = (id) => COLORS[Math.abs(parseInt(id, 10) || 0) % COLORS.length];

const AllEmployeeSlotsCalendar = ({ token, timezone: propTimezone }) => {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const calRef = useRef(null);
  const fsCalRef = useRef(null);
  const isRecruiter = window.location.pathname.includes("recruiter");

  // theme CSS vars used by manager-calendar.css
  const vars = {
    "--grid-bg": theme.palette.background.default,
    "--grid-axis-bg": alpha(theme.palette.background.paper, 0.9),
    "--grid-axis-color": theme.palette.text.primary,
    "--grid-border": alpha(theme.palette.text.primary, 0.12),
  };

  /* ------------------------------ state ------------------------------ */
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignFor, setReassignFor] = useState(null);          // the clicked booked event
  const [reassignRecruiterId, setReassignRecruiterId] = useState("");

  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [includeArchived, setIncludeArchived] = useState(false);

  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState("all");

  const [events, setEvents] = useState([]); // normalized events (available + booked)
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // “Setmore-style” day rail: which day is selected in the grid?
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  // modal + form for creating/editing meetings (unchanged)
  const [openModal, setOpenModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: "",
    start: "",
    end: "",
    recruiter_id: "",
    location: "",
    invite_link: "",
    description: "",
    attendees: [],
    candidate_name: "",
    candidate_email: ""
  });

  // enterprise calendar options
  const [calendarView, setCalendarView] = useState("dayGridMonth"); // "timeGridWeek" | "timeGridDay"
  const [showWeekends, setShowWeekends] = useState(true);
  const [workHoursOnly, setWorkHoursOnly] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);
  const [granularity, setGranularity] = useState("00:30:00"); // 15/30/60
  const [timeFmt12h, setTimeFmt12h] = useState(false);
  // statusFilter: "available" and/or "booked" (empty = both)
  const [statusFilter, setStatusFilter] = useState([]);

  // full-screen popup
  const [fullScreenOpen, setFullScreenOpen] = useState(false);

  // permissions (manager OR company policy)
  const [isManagerUser, setIsManagerUser] = useState(false);
  const [canCloseSlots, setCanCloseSlots] = useState(false);
  const [canEditAvailability, setCanEditAvailability] = useState(false);

  // slot chip menu / edit dialog
  const [chipMenuAnchor, setChipMenuAnchor] = useState(null);
  const [chipSlot, setChipSlot] = useState(null);
  const [slotEditOpen, setSlotEditOpen] = useState(false);
  const [slotEditForm, setSlotEditForm] = useState({ date: "", start: "", end: "" });

  // Day menu/actions
  const [dayMenuAnchor, setDayMenuAnchor] = useState(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [dayMode, setDayMode] = useState("close-day"); // "close-day" | "close-after" | "close-before" | "keep-range"
  const [dayTimeA, setDayTimeA] = useState("13:00");
  const [dayTimeB, setDayTimeB] = useState("16:00");

  // Day window (bulk edit)
  const [dayWindowOpen, setDayWindowOpen] = useState(false);
  const [dayWindow, setDayWindow] = useState({
    start: "09:00", // HH:mm in employee tz
    end: "17:00",
    tz: null,       // which tz these times are in
  });

  /* ------------------------- data-fetch helpers ------------------------ */
  const fetchDepartments = async () => {
    try {
      const { data } = await api.get(`/api/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(data || []);
    } catch {
      setError("Failed to fetch departments");
      setDepartments([]);
    }
  };

  const fetchRecruiters = async () => {
    try {
      const params = {
        ...(departmentFilter !== "all" ? { department_id: departmentFilter } : {}),
        ...(includeArchived ? { include_archived: 1 } : {}),
      };
      const { data } = await api.get(`/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setRecruiters(data.recruiters ?? data ?? []);
    } catch {
      setError("Failed to fetch employees");
      setRecruiters([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const url = isRecruiter
        ? `/recruiter/calendar`
        : `/manager/calendar`;
      const { data } = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const tz =
        propTimezone ||
        localStorage.getItem("timezone") ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC";

      // Normalize → viewer TZ for display; DO NOT filter out booked items
      const normalized = (data.events || []).map((ev) => {
        const start = ev.start
          ? moment.utc(ev.start)
          : moment.tz(`${ev.date} ${ev.start_time}`, "YYYY-MM-DD HH:mm:ss", "UTC");
        const end = ev.end
          ? moment.utc(ev.end)
          : moment.tz(`${ev.date} ${ev.end_time}`, "YYYY-MM-DD HH:mm:ss", "UTC");
        return {
          ...ev,
          start: start.tz(tz).toISOString(),
          end: end.tz(tz).toISOString(),
          __status: ev.booked ? "booked" : "available",
        };
      });

      setEvents(normalized);
    } catch {
      setError("Failed to fetch events");
    }
  };

  /*  saving/direct-booking (as in your current file) */
  const { handleRecruiterSaveMeeting, handleRecruiterDirectBooking } =
    useRecruiterMeetingHandler(
      token,
      () => resetForm(),
      fetchEvents,
      setIsSubmitting,
      setSuccessMessage,
      setError,
      setOpenModal
    );

  /* ------------------------------ effects ------------------------------ */
  useEffect(() => {
    if (!token) return;
    fetchDepartments();
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // listen for global refresh events fired by ManagerBookings (one-time)
  useEffect(() => {
    const onRefresh = () => fetchEvents();
    window.addEventListener("slots:refresh", onRefresh);
    return () => window.removeEventListener("slots:refresh", onRefresh);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchRecruiters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, departmentFilter, includeArchived]);

  // load permission flags
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const me = await api.get(`/recruiter/profile`, { headers: { Authorization: `Bearer ${token}` } });
        setIsManagerUser(Boolean(me.data?.recruiter?.is_manager));
      } catch { setIsManagerUser(false); }
      try {
        const pr = await api.get(`/api/employee/permissions`, { headers: { Authorization: `Bearer ${token}` } });
        const p = pr.data || {};
        setCanCloseSlots(Boolean(isManagerUser || p.can_close_slots));
        setCanEditAvailability(Boolean(isManagerUser || p.can_edit_availability || p.can_close_slots));
      } catch {
        setCanCloseSlots(isManagerUser);
        setCanEditAvailability(isManagerUser);
      }
    })();
  }, [token, isManagerUser]);

  /* --------------------------- derived & helpers --------------------------- */

  // filter by dept/employee + status dropdowns
  const filteredEvents = useMemo(() => {
    let ev = events;
    if (departmentFilter !== "all") {
      ev = ev.filter((e) => String(e.department_id) === String(departmentFilter));
    }
    if (selectedRecruiter !== "all") {
      ev = ev.filter((e) => String(e.recruiter_id) === String(selectedRecruiter));
    }
    if (statusFilter.length) {
      ev = ev.filter((e) => statusFilter.includes(e.__status));
    }
    return ev;
  }, [events, departmentFilter, selectedRecruiter, statusFilter]);

  const tzLabel =
    propTimezone ||
    localStorage.getItem("timezone") ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";
  const userTz = tzLabel;

  // Convert a raw event to a timezone-stable UI slot
  // SHOW in viewer TZ (from start/end), but for writes keep provider-local strings if present
  const toUiSlot = (raw) => {
    const tz = raw.timezone || userTz;

    // ISO for labels/tooltips (viewer TZ already set in fetchEvents)
    const startISO = raw.start || isoFromParts(raw.date, raw.start_time, tz);
    const endISO   = raw.end   || isoFromParts(raw.date, raw.end_time, tz);

    // HH:mm we show in the chips (from viewer ISO)
    const startLabelHH = moment(startISO).format("HH:mm");
    const endLabelHH   = moment(endISO).format("HH:mm");
    const uiDate       = moment(startISO).format("YYYY-MM-DD");

    // What we send back to server (provider-local strings if provided)
    const localDate = raw.date || uiDate;
    const startHH   = raw.start_time || startLabelHH;
    const endHH     = raw.end_time   || endLabelHH;

    return {
      ...raw,
      tz,
      startISO,
      endISO,
      localDate,
      startHH,
      endHH,
    };
  };

  // Build daySlots from ALL events for the selected day (booked + available)
  const daySlots = useMemo(() => {
    const allEventsForSelectedDay = filteredEvents.filter((e) => {
      const day = (e.start || "").slice(0, 10); // viewer TZ date
      return day === selectedDate;
    });
    return allEventsForSelectedDay.map(toUiSlot);
  }, [filteredEvents, selectedDate]);

  const resetForm = () => {
    setForm({
      title: "",
      date: "",
      start: "",
      end: "",
      recruiter_id: "",
      location: "",
      invite_link: "",
      description: "",
      attendees: [],
      candidate_name: "",
      candidate_email: ""
    });
    setEditingEvent(null);
  };

  const handleDateClick = (arg) => {
    // pick a day in the grid → update the rail and center the view there
    setSelectedDate(arg.dateStr);
    const api = calRef.current?.getApi?.();
    if (api) api.changeView(calendarView || "dayGridMonth", arg.date);
  };

  const onEventClick = (info) => {
    const dt = info.event.start;
    if (dt) setSelectedDate(moment(dt).format("YYYY-MM-DD"));
  };

  const handleChipClick = (slot) => {
    // booked fragments open the edit modal; free fragments open “Add meeting” prefilled
    if (slot.booked) {
      setEditingEvent({
        id: slot.appointment_ids?.[0] || slot.booking_ids?.[0] || slot.id,
        ...slot,
      });
      setForm((p) => ({
        ...p,
        title: slot.title?.replace(/^Booked:?\s*/i, "") || "Booked",
        date: selectedDate,
        start: slot.startHH,
        end: slot.endHH,
        recruiter_id: slot.recruiter_id,
        candidate_name: "",
        candidate_email: "",
      }));
      setOpenModal(true);
    } else {
      setEditingEvent(null);
      setForm((p) => ({
        ...p,
        title: "New Meeting",
        date: selectedDate,
        start: slot.startHH,
        end: slot.endHH,
        recruiter_id: selectedRecruiter !== "all" ? selectedRecruiter : "",
      }));
      setOpenModal(true);
    }
  };

  const handleFormChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleDeleteMeeting = async () => {
  if (!editingEvent) return;
  try {
    const headers = { headers: { Authorization: `Bearer ${token}` } };

    if (editingEvent.booked) {
      // Booked appointment: trigger cancel (fires cancel email)
      await api.post(`/api/manager/bookings/${editingEvent.id}/cancel`, {}, headers);
    } else if (editingEvent.availability_id) {
      // Availability chip case (defensive)
      await tryDeleteAvailability(editingEvent.availability_id);
    } else {
      // Legacy non-booked meeting fallback
      const url = isRecruiter
        ? `/recruiter/meetings/${editingEvent.id}`
        : `/api/meetings/${editingEvent.id}`;
      await api.delete(url, headers);
    }

    setOpenModal(false);
    resetForm();
    window.dispatchEvent(new Event("slots:refresh"));
    fetchEvents();
  } catch {
    setError("❌ Failed to delete meeting");
  }
};


  const saveManagerMeeting = async () => {
  setIsSubmitting(true);
  try {
    if (editingEvent) {
      // EDIT EXISTING BOOKING — email-sending manager endpoint
      const payload = {
        date: form.date,            // "YYYY-MM-DD" (local)
        start_time: form.start,     // "HH:MM" (local)
        end_time: form.end,         // "HH:MM" (local)
        recruiter_id: form.recruiter_id || undefined,
        notes: form.description || undefined,
        manager_note: form.description || undefined, // ensure note appears in client email
        service_id: form.service_id || undefined,
        auto_adjust: true,
      };

      await api.patch(
        `/api/manager/bookings/${editingEvent.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      // CREATE NEW MEETING — unchanged, but ensure we have a link
      let link = (form.invite_link || "").trim();
      if (!link) {
        const { data } = await api.get(`/utils/generate-jitsi`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        link = data?.link || "";
      }
      const payload = { ...form, invite_link: link };

      await api.post(`/manager/add-meeting`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    setSuccessMessage("✅ Saved. Clients will receive an update email.");
    setOpenModal(false);
    resetForm();
    window.dispatchEvent(new Event("slots:refresh"));
    await fetchEvents();
  } catch (e) {
    setError(e?.response?.data?.error || "❌ Failed to save");
  } finally {
    setIsSubmitting(false);
  }
};



  const handleSaveMeeting = () => {
    if (!form.date || !form.start || !form.end) return setError("Please fill date, start & end");
    if (!form.title) return setError("Please enter a title");

    if (isRecruiter) {
      const selected = recruiters.find((r) => String(r.id) === String(form.recruiter_id));
      if (selected && (!form.candidate_name || !form.candidate_email)) {
        setForm((p) => ({
          ...p,
          candidate_name: `${selected.first_name ?? ""} ${selected.last_name ?? ""}`.trim(),
          candidate_email: selected.email
        }));
      }
      if (form.candidate_name && form.candidate_email) {
        handleRecruiterDirectBooking(form);
      } else {
        handleRecruiterSaveMeeting(form, editingEvent);
      }
    } else {
      saveManagerMeeting();
    }
  };

  // export helpers
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredEvents);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, "schedule.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const rows = filteredEvents.map((e) => [
      e.title || (e.booked ? "Booked" : "Available"),
      (e.start || "").slice(0,10),
      moment(e.start).format("HH:mm"),
      moment(e.end).format("HH:mm"),
      e.recruiter_id
    ]);
    doc.text("Event Schedule", 14, 16);
    doc.autoTable({
      head: [["Title", "Date", "Start", "End", "Recruiter"]],
      body: rows,
      startY: 20
    });
    doc.save("schedule.pdf");
  };

  /* --------------------- availability helpers & endpoints -------------------- */

  // derive availability id from event
  const availabilityIdFromEvent = (ev) => {
    if (ev?.availability_id) return ev.availability_id;
    if (typeof ev?.id === "string" && ev.id.startsWith("avail-")) {
      const n = parseInt(ev.id.replace("avail-",""), 10);
      if (!Number.isNaN(n)) return n;
    }
    return null;
  };

  // single update/delete (tries a few prefixes for compatibility)
  const tryUpdateAvailability = async (id, payload) => {
    const urls = [
      `/manager/availability/${id}`,
      `/api/manager/availability/${id}`,
      `/availability/${id}`,
    ];
    for (const url of urls) {
      try { await api.put(url, payload, { headers: { Authorization: `Bearer ${token}` } }); return true; } catch {}
    }
    throw new Error("No availability update endpoint succeeded.");
  };

  const tryDeleteAvailability = async (id) => {
    const urls = [
      `/manager/availability/${id}`,
      `/api/manager/availability/${id}`,
      `/availability/${id}`,
    ];
    for (const url of urls) {
      try { await api.delete(url, { headers: { Authorization: `Bearer ${token}` } }); return true; } catch {}
    }
    throw new Error("No availability delete endpoint succeeded.");
  };

  // bulk manager day endpoints (optional; UI falls back to per-slot deletes if missing)
  const tryCloseAfterBulk = async ({ recruiter_id, date, from_time }) => {
    const urls = [`/manager/availability/close-after`, `/api/manager/availability/close-after`];
    for (const url of urls) { try { await api.post(url, { recruiter_id, date, from_time }, { headers: { Authorization: `Bearer ${token}` } }); return true; } catch {} }
    return false;
  };
  const tryCloseBeforeBulk = async ({ recruiter_id, date, until_time }) => {
    const urls = [`/manager/availability/close-before`, `/api/manager/availability/close-before`];
    for (const url of urls) { try { await api.post(url, { recruiter_id, date, until_time }, { headers: { Authorization: `Bearer ${token}` } }); return true; } catch {} }
    return false;
  };
  const tryCloseDayBulk = async ({ recruiter_id, date }) => {
    const urls = [`/manager/availability/close-day`, `/api/manager/availability/close-day`];
    for (const url of urls) { try { await api.post(url, { recruiter_id, date }, { headers: { Authorization: `Bearer ${token}` } }); return true; } catch {} }
    return false;
  };
  const tryKeepRangeBulk = async ({ recruiter_id, date, start_time, end_time }) => {
    const urls = [`/manager/availability/keep-range`, `/api/manager/availability/keep-range`];
    for (const url of urls) { try { await api.post(url, { recruiter_id, date, start_time, end_time }, { headers: { Authorization: `Bearer ${token}` } }); return true; } catch {} }
    return false;
  };

  /* --------------------------- event rendering --------------------------- */
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

  // Pro, readable cells in Week/Day
  const renderEventContent = (arg) => {
    const xp = arg.event.extendedProps || {};
    const status = xp.status === "booked" ? "Booked" : "Available";
    const emp = xp.recruiter_name || xp.recruiter || `Emp ${xp.recruiter_id || ""}`;
    const svc = xp.service_name || "";
    const accent = colorForEmp(xp.recruiter_id || 0);

    return (
      <div
        className="evpro"
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
              background: xp.status === "booked" ? "#ffd6d9" : "#e6f4ea",
              border: `1px solid ${xp.status === "booked" ? "#ff4d4f" : "#34a853"}`,
              color: "#111",
            }}
          >
            {status}
          </span>
          <span style={{ fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {emp}
          </span>
        </div>
        {svc ? (
          <div style={{ fontSize: 11, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {svc}
          </div>
        ) : null}
      </div>
    );
  };

  const eventDidMount = (info) => {
    const xp = info.event.extendedProps || {};
    const emp = xp.recruiter_name || xp.recruiter || `Emp ${xp.recruiter_id || ""}`;
    const status = xp.status || "";
    const start = info.event.start ? moment(info.event.start).format(timeFmt12h ? "h:mma" : "HH:mm") : "";
    const end = info.event.end ? moment(info.event.end).format(timeFmt12h ? "h:mma" : "HH:mm") : "";
    const svc = xp.service_name ? `\nService: ${xp.service_name}` : "";
    info.el.setAttribute("title", `${status.toUpperCase()} — ${emp}\n${start}–${end}${svc}`);
  };

  // Calendar events with improved status & employee color accents
  const calendarEvents = filteredEvents.map((e) => {
    const empColor = colorForEmp(e.recruiter_id);
    const bg = e.booked ? "#ffe5e9" : "#e7f7ec";
    const border = e.booked ? "#ff4d4f" : "#34a853";
    return {
      id: e.id,
      title: e.booked ? "Booked" : "Available",
      start: e.start,
      end: e.end,
      backgroundColor: bg,
      borderColor: border,
      textColor: "#111",
      classNames: [e.booked ? "slot-booked" : "slot-available"],
      extendedProps: { ...e, status: e.__status, _empColor: empColor },
    };
  });

  // Common props
  const baseCalProps = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    events: calendarEvents,
    weekends: showWeekends,
    nowIndicator: true,
    expandRows: true,
    dayMaxEvents: 4,
    displayEventEnd: true,
    stickyHeaderDates: true,
    navLinks: true, // click day/week names to navigate
    scrollTime: "08:00:00",
    slotDuration: granularity,
    slotLabelInterval: "01:00",
    slotMinTime: workHoursOnly ? "08:00:00" : "00:00:00",
    slotMaxTime: workHoursOnly ? "20:00:00" : "24:00:00",
    eventTimeFormat,
    slotLabelFormat,
    dateClick: handleDateClick,
    eventClick: onEventClick,
    eventContent: renderEventContent,
    eventDidMount,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
  };

  /* ---------------- Recompute suggested window from FREE slots --------------- */
  // Uses local "HH:MM" directly (safe lexicographic compare)
  useEffect(() => {
    // target employees: selected, else all visible in this day rail
    const targetIds =
      selectedRecruiter !== "all"
        ? [String(selectedRecruiter)]
        : Array.from(new Set(daySlots.map((s) => String(s.recruiter_id))));

    const free = daySlots.filter(
      (s) => !s.booked && targetIds.includes(String(s.recruiter_id))
    );
    if (!free.length) return;

    let earliest = "23:59";
    let latest = "00:00";
    for (const s of free) {
      if (s.startHH && s.startHH < earliest) earliest = s.startHH;
      if (s.endHH && s.endHH > latest) latest = s.endHH;
    }
    setDayWindow({ start: earliest, end: latest, tz: "per-employee local" });
  }, [daySlots, selectedRecruiter]);

  /* ------------------------------- UI --------------------------------- */
  return (
    <Box sx={{ my: 4, ...vars }}>
      {/* subtle global style tweaks for timegrid readability */}
      <GlobalStyles
        styles={{
          ".fc .fc-timegrid-slot": {
            height: compactDensity ? 28 : 34,
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

      <Typography
        variant="h5"
        gutterBottom
        fontWeight={700}
        sx={{ textAlign: { xs: "center", sm: "left" } }}
      >
        Team Availability{" "}
        <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>
          &nbsp;(Enterprise views)
        </Typography>
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {/* Filter & options bar */}
      <Paper
        sx={{
          p: compactDensity ? 1 : 2,
          mb: 2,
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 2,
          alignItems: "center",
        }}
        elevation={1}
      >
        <FormControl sx={{ gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" } }}>
          <InputLabel>Department</InputLabel>
          <Select
            size="small"
            value={departmentFilter}
            label="Department"
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setSelectedRecruiter("all");
            }}
          >
            <MenuItem value="all">All Departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" } }}>
          <InputLabel>Employee</InputLabel>
          <Select
            size="small"
            value={selectedRecruiter}
            label="Employee"
            onChange={(e) => setSelectedRecruiter(e.target.value)}
            disabled={recruiters.length === 0}
          >
            <MenuItem value="all">All Employees</MenuItem>
            {recruiters.map((r) => {
              const label = `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.name || r.email;
              return <MenuItem key={r.id} value={r.id}>{label}</MenuItem>;
            })}
          </Select>
        </FormControl>

        <FormControlLabel
          sx={{ gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" } }}
          control={
            <Checkbox
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
          }
          label="Show archived employees"
        />

        {/* Status filter */}
        <FormControl sx={{ gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" } }}>
          <InputLabel>Slot Status</InputLabel>
          <Select
            multiple
            size="small"
            value={statusFilter}
            label="Slot Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            renderValue={(vals) => (vals.length ? vals.join(", ") : "All")}
          >
            <MenuItem value="available">
              <Chip size="small" color="success" label="Available" />
            </MenuItem>
            <MenuItem value="booked">
              <Chip size="small" color="error" label="Booked" />
            </MenuItem>
          </Select>
        </FormControl>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          sx={{ gridColumn: { xs: "span 12", md: "span 3" }, justifyContent: "flex-end" }}
          alignItems="center"
        >
          <Chip size="small" label={`TZ: ${tzLabel}`} />
          <Tooltip title="Export CSV/XLSX">
            <IconButton onClick={exportToExcel}><DownloadIcon /></IconButton>
          </Tooltip>

          {/* Day bulk actions */}
          {canCloseSlots && (
            <>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => setDayMenuAnchor(e.currentTarget)}
                fullWidth={isSmDown}
              >
                Day
              </Button>
              <Menu anchorEl={dayMenuAnchor} open={Boolean(dayMenuAnchor)} onClose={() => setDayMenuAnchor(null)}>
                <MenuItem onClick={() => { setDayMode("close-day"); setDayDialogOpen(true); setDayMenuAnchor(null); }}>Close entire day</MenuItem>
                <MenuItem onClick={() => { setDayMode("close-after"); setDayDialogOpen(true); setDayMenuAnchor(null); }}>Close rest of day…</MenuItem>
                <MenuItem onClick={() => { setDayMode("close-before"); setDayDialogOpen(true); setDayMenuAnchor(null); }}>Close before time…</MenuItem>
                <MenuItem onClick={() => { setDayMode("keep-range"); setDayDialogOpen(true); setDayMenuAnchor(null); }}>Keep only time range…</MenuItem>
              </Menu>
            </>
          )}

          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => {
              setEditingEvent(null);
              setForm({
                title: "New Meeting",
                date: selectedDate,
                start: "09:00",
                end: "09:30",
                recruiter_id: selectedRecruiter !== "all" ? selectedRecruiter : "",
                location: "",
                invite_link: "",
                description: "",
                attendees: [],
                candidate_name: "",
                candidate_email: ""
              });
              setOpenModal(true);
            }}
            fullWidth={isSmDown}
          >
            Add
          </Button>

          <Button variant="outlined" onClick={() => fetchEvents()} fullWidth={isSmDown}>
            Refresh
          </Button>

          <Button
            startIcon={<OpenInFullIcon />}
            variant="contained"
            onClick={() => setFullScreenOpen(true)}
            fullWidth={isSmDown}
          >
            Open Full Screen
          </Button>
        </Stack>

        {/* View toggles & enterprise options (row 2) */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ gridColumn: "1 / -1" }} useFlexGap flexWrap="wrap">
          <ToggleButtonGroup size="small" value={calendarView} exclusive onChange={(_, v) => v && setCalendarView(v)}>
            <ToggleButton value="dayGridMonth">Month</ToggleButton>
            <ToggleButton value="timeGridWeek">Week</ToggleButton>
            <ToggleButton value="timeGridDay">Day</ToggleButton>
          </ToggleButtonGroup>

          {/* Granularity */}
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

          {/* Time format */}
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
        </Stack>
      </Paper>

      {/* Calendar (Month/Week/Day) */}
      <Paper sx={{ p: compactDensity ? 1 : 2, mb: 2 }} elevation={1}>
        <FullCalendar
          ref={calRef}
          {...baseCalProps}
          initialView={calendarView}
          height="auto"
          key={`${calendarView}-${granularity}-${timeFmt12h}-${showWeekends}-${workHoursOnly}-${compactDensity}-${statusFilter.join(",")}`}
        />
      </Paper>

      {/* Day slot rail (chips) */}
      <Paper sx={{ p: 2 }} elevation={1}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {moment(selectedDate).format(timeFmt12h ? "ddd, MMM D" : "ddd, MMM D")} — {daySlots.length} slot(s)
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Edit available window (single or many employees) */}
          {canCloseSlots && (
            <Button size="small" variant="contained" onClick={() => setDayWindowOpen(true)}>
              Edit Available Window…
            </Button>
          )}

          {/* Quick close entire day — per-employee local date */}
          {canCloseSlots && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={async () => {
                // Group free slots by employee so we know each employee's local date
                const groups = daySlots.reduce((m, s) => {
                  const k = String(s.recruiter_id);
                  (m[k] ||= []).push(s);
                  return m;
                }, {});
                const targetIds =
                  selectedRecruiter !== "all"
                    ? [String(selectedRecruiter)]
                    : Object.keys(groups);

                let anyBulk = false;
                for (const rid of targetIds) {
                  const slots = groups[rid] || [];
                  const localDate = slots[0]?.localDate || selectedDate; // employee's local date if present
                  const ok = await tryCloseDayBulk({ recruiter_id: rid, date: localDate });
                  anyBulk = anyBulk || ok;
                }

                // Fallback: delete each free slot (per employee)
                if (!anyBulk) {
                  for (const rid of targetIds) {
                    for (const s of (groups[rid] || [])) {
                      if (!s.booked) {
                        const id = availabilityIdFromEvent(s);
                        if (id) await tryDeleteAvailability(id);
                      }
                    }
                  }
                }

                setSuccessMessage(`Day closed for ${targetIds.length} employee(s) ✔`);
                fetchEvents();
              }}
            >
              Close day
            </Button>
          )}

          <Chip size="small" color="success" label="Available" />
          <Chip size="small" color="error" label="Booked" />
          <Button size="small" onClick={() => fetchEvents()}>Refresh</Button>
        </Stack>

        {daySlots.length === 0 ? (
          <Typography color="text.secondary">No availability for this day.</Typography>
        ) : (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {daySlots.map((s) => (
              <Box key={`${s.startISO}-${s.recruiter_id}`} sx={{ display: "inline-flex", alignItems: "center" }}>
                <Chip
                  clickable
                  onClick={() => handleChipClick(s)}   // keeps Add Meeting flow
                  color={s.booked ? "error" : "success"}
                  variant={s.booked ? "filled" : "outlined"}
                  label={`${s.startHH}–${s.endHH}${selectedRecruiter === "all" ? ` • ${s.recruiter_label || s.recruiter_id}` : ""}${s.service_name ? ` • ${s.service_name}` : ""}`}
                  sx={{ borderLeft: `4px solid ${colorForEmp(s.recruiter_id)}` }}
                  {...(!s.booked && canEditAvailability
                    ? { onDelete: async () => {
                        try {
                          const id = availabilityIdFromEvent(s);
                          if (!id) throw new Error("No availability id");
                          await tryDeleteAvailability(id);
                          setSuccessMessage("Availability deleted ✔");
                          fetchEvents();
                        } catch { setError("Failed to delete slot."); }
                      } }
                    : {})}
                />
                {/* 3-dot menu for edit/delete (only for free slots & when allowed) */}
                {!s.booked && canEditAvailability && (
                  <IconButton size="small" onClick={(e) => { setChipSlot(s); setChipMenuAnchor(e.currentTarget); }} sx={{ ml: -0.5 }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Create/Edit modal (unchanged core) */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            maxWidth: 520,
            mx: "auto",
            mt: 6,
            boxShadow: 6,
          }}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {editingEvent ? "Edit Booking" : "Add Meeting"}
          </Typography>

          <Stack spacing={2}>
            <TextField label="Title" name="title" value={form.title} onChange={handleFormChange} fullWidth />
            <TextField label="Date" name="date" type="date" value={form.date} onChange={handleFormChange} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Start" name="start" type="time" value={form.start} onChange={handleFormChange} fullWidth />
              <TextField label="End" name="end" type="time" value={form.end} onChange={handleFormChange} fullWidth />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Employee</InputLabel>
              <Select label="Employee" name="recruiter_id" value={form.recruiter_id} onChange={handleFormChange}>
                {recruiters.map((r) => {
                  const label = `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.name || r.email;
                  return <MenuItem key={r.id} value={r.id}>{label}</MenuItem>;
                })}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {editingEvent && (
                <Button color="error" startIcon={<DeleteIcon />} onClick={handleDeleteMeeting}>
                  Delete
                </Button>
              )}
              <Button variant="contained" onClick={handleSaveMeeting} disabled={isSubmitting}>
                {editingEvent ? "Save" : "Create"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      {/* Slot chip menu & Edit availability dialog */}
      <Menu anchorEl={chipMenuAnchor} open={Boolean(chipMenuAnchor)} onClose={() => setChipMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            if (!chipSlot) return;
            const d = chipSlot.localDate || (chipSlot.startISO || "").slice(0,10);
            setSlotEditForm({ date: d, start: chipSlot.startHH, end: chipSlot.endHH });
            setChipMenuAnchor(null);
            setSlotEditOpen(true);
          }}
        >
          <EditOutlinedIcon fontSize="small" style={{ marginRight: 8 }} />
          Edit slot…
        </MenuItem>
        <MenuItem
          onClick={async () => {
            try {
              const id = availabilityIdFromEvent(chipSlot);
              if (!id) throw new Error("No availability id");
              await tryDeleteAvailability(id);
              setChipMenuAnchor(null);
              setSuccessMessage("Availability deleted ✔");
              fetchEvents();
            } catch { setError("Failed to delete slot."); }
          }}
        >
          <DeleteOutlineIcon fontSize="small" style={{ marginRight: 8 }} />
          Delete slot
        </MenuItem>
      </Menu>

      <Dialog open={slotEditOpen} onClose={() => setSlotEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit availability slot</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Date" type="date" value={slotEditForm.date} onChange={(e) => setSlotEditForm(p => ({ ...p, date: e.target.value }))} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Start" type="time" value={slotEditForm.start} onChange={(e) => setSlotEditForm(p => ({ ...p, start: e.target.value }))} fullWidth inputProps={{ step: 300 }} />
              <TextField label="End" type="time" value={slotEditForm.end} onChange={(e) => setSlotEditForm(p => ({ ...p, end: e.target.value }))} fullWidth inputProps={{ step: 300 }} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlotEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                const id = availabilityIdFromEvent(chipSlot);
                if (!id) throw new Error("No availability id");
                await tryUpdateAvailability(id, { date: slotEditForm.date, start_time: slotEditForm.start, end_time: slotEditForm.end });
                setSlotEditOpen(false);
                setSuccessMessage("Availability updated ✔");
                fetchEvents();
              } catch { setError("Failed to update slot."); }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Day bulk action dialog */}
      <Dialog open={dayDialogOpen} onClose={() => setDayDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {dayMode === "close-day" && "Close entire day"}
          {dayMode === "close-after" && "Close rest of day"}
          {dayMode === "close-before" && "Close before time"}
          {dayMode === "keep-range" && "Keep only time range"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {(dayMode === "close-after" || dayMode === "close-before") && (
              <TextField
                label={dayMode === "close-after" ? "From time" : "Until time"}
                type="time"
                value={dayTimeA}
                onChange={(e) => setDayTimeA(e.target.value)}
                inputProps={{ step: 300 }}
                fullWidth
              />
            )}
            {dayMode === "keep-range" && (
              <Stack direction="row" spacing={2}>
                <TextField label="Start time" type="time" value={dayTimeA} onChange={(e) => setDayTimeA(e.target.value)} inputProps={{ step: 300 }} fullWidth />
                <TextField label="End time"   type="time" value={dayTimeB} onChange={(e) => setDayTimeB(e.target.value)} inputProps={{ step: 300 }} fullWidth />
              </Stack>
            )}
            <Alert severity="info">
              Target: {selectedRecruiter !== "all" ? "current employee" : "all visible employees"} on {selectedDate}.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDayDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!canCloseSlots) { setError("You do not have permission to change availability."); return; }

              const targetRids =
                selectedRecruiter !== "all"
                  ? [selectedRecruiter]
                  : Array.from(new Set(daySlots.map((s) => s.recruiter_id)));

              try {
                let anyBulk = false;

                for (const rid of targetRids) {
                  let ok = false;
                  if (dayMode === "close-day") {
                    ok = await tryCloseDayBulk({ recruiter_id: rid, date: selectedDate });
                  } else if (dayMode === "close-after") {
                    ok = await tryCloseAfterBulk({ recruiter_id: rid, date: selectedDate, from_time: dayTimeA });
                  } else if (dayMode === "close-before") {
                    ok = await tryCloseBeforeBulk({ recruiter_id: rid, date: selectedDate, until_time: dayTimeA });
                  } else if (dayMode === "keep-range") {
                    ok = await tryKeepRangeBulk({ recruiter_id: rid, date: selectedDate, start_time: dayTimeA, end_time: dayTimeB });
                  }
                  if (ok) anyBulk = true;
                }

                if (!anyBulk) {
                  // fallback per-slot for all targets (compute in userTz; slots deleted by ISO compare)
                  const A = moment.tz(`${selectedDate} ${dayTimeA}`, "YYYY-MM-DD HH:mm", userTz);
                  const B = moment.tz(`${selectedDate} ${dayTimeB}`, "YYYY-MM-DD HH:mm", userTz);

                  for (const rid of targetRids) {
                    for (const s of daySlots) {
                      if (String(s.recruiter_id) !== String(rid) || s.booked) continue;
                      const st = moment(s.startISO);
                      const shouldDelete =
                        (dayMode === "close-day") ? true :
                        (dayMode === "close-after") ? st.isSameOrAfter(A) :
                        (dayMode === "close-before") ? st.isBefore(A) :
                        (dayMode === "keep-range") ? (st.isBefore(A) || st.isSameOrAfter(B)) :
                        false;

                      if (shouldDelete) {
                        const id = availabilityIdFromEvent(s);
                        if (id) await tryDeleteAvailability(id);
                      }
                    }
                  }
                }

                setDayDialogOpen(false);
                setSuccessMessage(`Availability updated for ${targetRids.length} employee(s) ✔`);
                fetchEvents();
              } catch {
                setError("Failed to update day availability.");
              }
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Available Window dialog */}
      <Dialog open={dayWindowOpen} onClose={() => setDayWindowOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit available window</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              Date: <strong>{selectedDate}</strong><br/>
              Target: <strong>
                {selectedRecruiter !== "all"
                  ? "1 employee"
                  : `${Array.from(new Set(daySlots.map(s => s.recruiter_id))).length} employee(s) (all visible)`}
              </strong><br/>
              Timezone mode: <strong>{dayWindow.tz || "per-employee local"}</strong>
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Current available span detected from today’s <em>free</em> slots:
            </Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Start"
                type="time"
                value={dayWindow.start}
                onChange={(e) => setDayWindow((w) => ({ ...w, start: e.target.value }))}
                inputProps={{ step: 300 }}
                fullWidth
              />
              <TextField
                label="End"
                type="time"
                value={dayWindow.end}
                onChange={(e) => setDayWindow((w) => ({ ...w, end: e.target.value }))}
                inputProps={{ step: 300 }}
                fullWidth
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              We will keep only the free slots that start within this range. Booked time is never touched.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDayWindowOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                // 0) Validate window
                const start = dayWindow.start;
                const end   = dayWindow.end;
                if (!start || !end || start >= end) {
                  setError("Start time must be earlier than end time.");
                  return;
                }

                // 1) Group free slots by employee id
                const groups = daySlots.reduce((m, s) => {
                  if (s.booked) return m; // never touch booked
                  const k = String(s.recruiter_id);
                  (m[k] ||= []).push(s);
                  return m;
                }, {});
                const targetIds =
                  selectedRecruiter !== "all"
                    ? [String(selectedRecruiter)]
                    : Object.keys(groups);
                if (!targetIds.length) { setError("No employees selected/visible for this day."); return; }

                // 2) Try bulk keep-range per employee (with that employee's local date)
                let anyBulk = false;
                for (const rid of targetIds) {
                  const slots = groups[rid] || [];
                  const localDate = slots[0]?.localDate || selectedDate; // employee local date if available
                  const ok = await tryKeepRangeBulk({
                    recruiter_id: rid,
                    date: localDate,
                    start_time: start,   // local "HH:MM"
                    end_time: end,       // local "HH:MM"
                  });
                  anyBulk = anyBulk || ok;
                }

                // 3) Fallback: delete outside-range free slots using LOCAL HH:MM
                if (!anyBulk) {
                  for (const rid of targetIds) {
                    const slots = groups[rid] || [];
                    for (const s of slots) {
                      const st = s.startHH; // already local "HH:MM" from API (or UI fallback)
                      const keep = (st >= start && st < end);
                      if (!keep) {
                        const id = availabilityIdFromEvent(s);
                        if (id) await tryDeleteAvailability(id);
                      }
                    }
                  }
                }

                setDayWindowOpen(false);
                setSuccessMessage(`Available window updated for ${targetIds.length} employee(s) ✔`);
                fetchEvents();
              } catch (e) {
                const msg = e?.response?.data?.error || "Failed to update available window.";
                setError(msg);
              }
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Screen Dialog with calendar */}
      <Dialog
        fullScreen
        open={fullScreenOpen}
        onClose={() => setFullScreenOpen(false)}
      >
        <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={() => setFullScreenOpen(false)}>
            <CloseFullscreenIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>Team Availability — Full Screen</Typography>

          {/* mirroring key controls in FS */}
          <ToggleButtonGroup size="small" value={calendarView} exclusive onChange={(_, v) => v && setCalendarView(v)} sx={{ mr: 1 }}>
            <ToggleButton value="dayGridMonth">Month</ToggleButton>
            <ToggleButton value="timeGridWeek">Week</ToggleButton>
            <ToggleButton value="timeGridDay">Day</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup size="small" value={[granularity]} onChange={(_, val) => { const v = Array.isArray(val) ? val[0] : val; if (v) setGranularity(v); }} sx={{ mr: 1 }}>
            <ToggleButton value="00:15:00">15m</ToggleButton>
            <ToggleButton value="00:30:00">30m</ToggleButton>
            <ToggleButton value="01:00:00">60m</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup size="small" value={timeFmt12h ? ["12h"] : ["24h"]} onChange={() => setTimeFmt12h((s) => !s)} sx={{ mr: 1 }}>
            <ToggleButton value="12h">12-hour</ToggleButton>
            <ToggleButton value="24h">24-hour</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" onClick={() => fetchEvents()}>Refresh</Button>
        </Box>

        <Box sx={{ p: compactDensity ? 1 : 2 }}>
          <Paper sx={{ p: compactDensity ? 0 : 1 }}>
            <FullCalendar
              ref={fsCalRef}
              {...baseCalProps}
              initialView={calendarView}
              key={`fs-${calendarView}-${granularity}-${timeFmt12h}-${showWeekends}-${workHoursOnly}-${compactDensity}-${statusFilter.join(",")}`}
              height="calc(100vh - 96px)"
            />
          </Paper>
        </Box>

        <Box sx={{ px: 2, pb: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button startIcon={<CloseFullscreenIcon />} variant="contained" onClick={() => setFullScreenOpen(false)}>
            Close
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default AllEmployeeSlotsCalendar;
