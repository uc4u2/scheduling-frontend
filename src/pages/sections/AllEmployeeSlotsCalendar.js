// src/pages/sections/management/AllEmployeeSlotsCalendar.js
import React, { useState, useEffect, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import GlobalStyles from "@mui/material/GlobalStyles";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
import ThemedDateField, { ThemedTimeField } from "../../components/ui/ThemedDateField";
import {
  buildRecruiterNameMap,
  groupSlotsByEmployee,
  recruiterDisplayName,
  resolveSlotEmployeeName,
  resolveTeamAvailabilityTimezone,
} from "../../utils/teamAvailabilityPresentation";
import {
  calendarDateKey,
  formatCalendarDateLabel,
} from "../../utils/bookingCheckout";

const AllEmployeeSlotsCalendar = ({ token, timezone: propTimezone }) => {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const calRef = useRef(null);
  const isRecruiter = window.location.pathname.includes("recruiter");
  const viewerTimezone =
    propTimezone ||
    localStorage.getItem("timezone") ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

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
  const getEmpAccent = useMemo(
    () => (id) => accentPalette[Math.abs(parseInt(id, 10) || 0) % accentPalette.length],
    [accentPalette]
  );
  const ui = useMemo(
    () => ({
      available: {
        bg: alpha(theme.palette.success.light, 0.25),
        border: alpha(theme.palette.success.main, 0.55),
        text: theme.palette.mode === "dark" ? theme.palette.success.light : theme.palette.success.dark,
      },
      booked: {
        bg: alpha(theme.palette.error.light, 0.25),
        border: alpha(theme.palette.error.main, 0.55),
        text: theme.palette.mode === "dark" ? theme.palette.error.light : theme.palette.error.dark,
      },
      chips: {
        mutedBg: alpha(theme.palette.background.paper, 0.9),
      },
    }),
    [theme]
  );

  // theme CSS vars used by manager-calendar.css
  const vars = {
    "--grid-bg": theme.palette.background.default,
    "--grid-axis-bg": alpha(theme.palette.background.paper, 0.9),
    "--grid-axis-color": theme.palette.text.primary,
    "--grid-border": alpha(theme.palette.text.primary, 0.12),
    "--fc-border-color": theme.palette.divider,
    "--fc-page-bg-color": theme.palette.background.paper,
    "--fc-today-bg-color": alpha(theme.palette.warning.light, 0.2),
    "--fc-button-text-color": theme.palette.text.primary,
    "--fc-button-bg-color": alpha(theme.palette.background.paper, 0.9),
    "--fc-button-border-color": theme.palette.divider,
    "--fc-button-hover-bg-color": alpha(theme.palette.primary.main, 0.08),
    "--fc-button-active-bg-color": alpha(theme.palette.primary.main, 0.18),
    "--fc-event-text-color": theme.palette.text.primary,
    "--fc-more-link-text-color": theme.palette.text.primary,
    "--team-calendar-event-text": theme.palette.text.primary,
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
    calendarDateKey(new Date(), viewerTimezone)
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
    recruiter_ids: [],
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
  });
  const [availabilityMutationPending, setAvailabilityMutationPending] = useState(false);
  const availabilityMutationContextRef = useRef(0);
  const [bookingCatalog, setBookingCatalog] = useState([]);
  const [bookedSlotOpen, setBookedSlotOpen] = useState(false);
  const [bookedSlotLoading, setBookedSlotLoading] = useState(false);
  const [selectedBookedSlot, setSelectedBookedSlot] = useState(null);
  const [bookingRescheduleOpen, setBookingRescheduleOpen] = useState(false);
  const [bookingRescheduleForm, setBookingRescheduleForm] = useState({
    date: "",
    start: "",
    end: "",
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

  const fetchBookingCatalog = async () => {
    if (!token || isRecruiter) {
      setBookingCatalog([]);
      return;
    }
    try {
      const { data } = await api.get(`/api/manager/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookingCatalog(Array.isArray(data) ? data : []);
    } catch {
      setBookingCatalog([]);
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

      // Preserve the API's offset-bearing instants. FullCalendar renders them in
      // the selected calendar timezone; converting them to UTC strings here
      // caused day grouping and employee-local mutations to disagree.
      const normalized = (data.events || []).map((ev) => {
        const eventTimezone = ev.timezone || viewerTimezone;
        return {
          ...ev,
          start: ev.start || isoFromParts(ev.date, ev.start_time, eventTimezone),
          end: ev.end || isoFromParts(ev.date, ev.end_time, eventTimezone),
          __status: ev.booked ? "booked" : "available",
        };
      });

      setEvents(normalized);
    } catch {
      setError("Failed to fetch events");
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchEvents(), fetchBookingCatalog()]);
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
    fetchBookingCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // listen for global refresh events fired by ManagerBookings (one-time)
  useEffect(() => {
    const onRefresh = () => refreshAll();
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

  const recruiterNames = useMemo(() => buildRecruiterNameMap(recruiters), [recruiters]);
  const getEmployeeName = (slot) => resolveSlotEmployeeName(slot, recruiterNames);

  const activeFilterSummary = useMemo(() => {
    const department = departments.find((row) => String(row.id) === String(departmentFilter));
    const recruiter = recruiters.find((row) => String(row.id) === String(selectedRecruiter));
    const statuses = statusFilter.length
      ? statusFilter.map((status) => status === "booked" ? "Booked" : "Available").join(" + ")
      : "All statuses";
    return [
      departmentFilter === "all" ? "All departments" : department?.name || "Department",
      selectedRecruiter === "all" ? "All employees" : recruiterDisplayName(recruiter) || "Employee",
      statuses,
    ].join(" • ");
  }, [departmentFilter, departments, recruiters, selectedRecruiter, statusFilter]);

  const selectedEmployee = useMemo(
    () => recruiters.find((row) => String(row.id) === String(selectedRecruiter)) || null,
    [recruiters, selectedRecruiter]
  );
  const calendarTimezone = selectedRecruiter === "all"
    ? viewerTimezone
    : resolveTeamAvailabilityTimezone(selectedEmployee, viewerTimezone);
  const tzLabel = calendarTimezone;

  useEffect(() => {
    availabilityMutationContextRef.current += 1;
    setAvailabilityMutationPending(false);
  }, [calendarTimezone, selectedDate, selectedRecruiter]);

  const bookingCatalogById = useMemo(() => {
    const map = new Map();
    bookingCatalog.forEach((item) => map.set(String(item.id), item));
    return map;
  }, [bookingCatalog]);

  const getSlotKind = (raw) => {
    if (!raw.booked) return "available";
    if (Array.isArray(raw.appointment_ids) && raw.appointment_ids.length) return "client_booking";
    if (Array.isArray(raw.booking_ids) && raw.booking_ids.length) return "candidate_booking";
    return "meeting";
  };

  const getSlotKindLabel = (slot) => {
    switch (slot.slotKind) {
      case "client_booking":
        return "Client Booking";
      case "candidate_booking":
        return "Candidate Booking";
      case "meeting":
        return "Meeting";
      default:
        return "Available";
    }
  };

  const buildBulkFeedbackMessage = ({ changedLabel = "Availability updated", deleted = 0, skipped = 0, employeeCount = 0 }) => {
    const parts = [`${changedLabel}: ${deleted} free slot(s) changed`];
    if (skipped > 0) parts.push(`${skipped} booked slot(s) kept`);
    if (employeeCount > 0) parts.push(`across ${employeeCount} employee(s)`);
    return `${parts.join(", ")}.`;
  };

  const formatMoney = (amount, currency = "CAD") => {
    const numeric = Number(amount || 0);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: String(currency || "CAD").toUpperCase(),
        maximumFractionDigits: 2,
      }).format(numeric);
    } catch {
      return `${numeric.toFixed(2)} ${currency || "CAD"}`;
    }
  };

  const getSlotVisuals = (slotLike) => {
    switch (getSlotKind(slotLike)) {
      case "client_booking":
        return {
          label: "Client Booking",
          bg: alpha(theme.palette.info.main, 0.18),
          border: alpha(theme.palette.info.main, 0.9),
          text: theme.palette.mode === "dark" ? theme.palette.info.light : theme.palette.info.dark,
          chipColor: "info",
        };
      case "candidate_booking":
        return {
          label: "Candidate Booking",
          bg: alpha(theme.palette.warning.main, 0.18),
          border: alpha(theme.palette.warning.main, 0.9),
          text: theme.palette.mode === "dark" ? theme.palette.warning.light : theme.palette.warning.dark,
          chipColor: "warning",
        };
      case "meeting":
        return {
          label: "Meeting",
          bg: alpha(theme.palette.secondary.main, 0.16),
          border: alpha(theme.palette.secondary.main, 0.85),
          text: theme.palette.mode === "dark" ? theme.palette.secondary.light : theme.palette.secondary.dark,
          chipColor: "secondary",
        };
      default:
        return {
          label: "Available",
          bg: ui.available.bg,
          border: ui.available.border,
          text: ui.available.text,
          chipColor: "success",
        };
    }
  };

  // Convert a raw event to a timezone-stable UI slot
  // Show in the active calendar timezone, while writes retain employee-local
  // strings supplied by the backend.
  const toUiSlot = (raw) => {
    const tz = raw.timezone || calendarTimezone;

    // Offset-bearing ISO instants are authoritative for display/grouping.
    const startISO = raw.start || isoFromParts(raw.date, raw.start_time, tz);
    const endISO   = raw.end   || isoFromParts(raw.date, raw.end_time, tz);

    const startLabelHH = moment.parseZone(startISO).tz(calendarTimezone).format("HH:mm");
    const endLabelHH   = moment.parseZone(endISO).tz(calendarTimezone).format("HH:mm");
    const uiDate       = calendarDateKey(startISO, calendarTimezone);

    // What we send back to server (provider-local strings if provided)
    const localDate = raw.date || uiDate;
    const startHH   = raw.start_time || startLabelHH;
    const endHH     = raw.end_time   || endLabelHH;
    const slotKind = getSlotKind(raw);
    const primaryAppointmentId =
      Array.isArray(raw.appointment_ids) && raw.appointment_ids.length
        ? raw.appointment_ids[0]
        : null;
    const bookingMeta = primaryAppointmentId
      ? bookingCatalogById.get(String(primaryAppointmentId)) || null
      : null;

    return {
      ...raw,
      tz,
      startISO,
      endISO,
      localDate,
      startHH,
      endHH,
      slotKind,
      primaryAppointmentId,
      bookingMeta,
    };
  };

  // Build daySlots from ALL events for the selected day (booked + available)
  const daySlots = useMemo(() => {
    const allEventsForSelectedDay = filteredEvents.filter((e) => {
      const day = calendarDateKey(e.start, calendarTimezone);
      return day === selectedDate;
    });
    return allEventsForSelectedDay
      .map(toUiSlot)
      .sort((a, b) => {
        const st = a.startISO.localeCompare(b.startISO);
        if (st !== 0) return st;
        return String(a.recruiter_id || "").localeCompare(String(b.recruiter_id || ""));
      });
  }, [filteredEvents, selectedDate, bookingCatalogById, calendarTimezone]);

  const daySlotGroups = useMemo(
    () => groupSlotsByEmployee(daySlots, recruiterNames),
    [daySlots, recruiterNames]
  );

  const resetForm = () => {
    setForm({
      title: "",
      date: "",
      start: "",
      end: "",
      recruiter_id: "",
      recruiter_ids: [],
      location: "",
      invite_link: "",
      description: "",
      attendees: [],
      candidate_name: "",
      candidate_email: ""
    });
    setEditingEvent(null);
  };

  const closeBookedSlotDialog = () => {
    setBookedSlotOpen(false);
    setSelectedBookedSlot(null);
  };

  const hydrateBookedSlotDetails = async (slot) => {
    const apptId = slot?.primaryAppointmentId;
    if (!apptId || slot?.bookingMeta?.meeting_link || slot?.meeting_link) return slot;
    try {
      const { data } = await api.get(`/api/appointments/${apptId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        ...slot,
        meeting_link: data?.meeting_link || slot?.meeting_link || "",
        bookingMeta: {
          ...(slot?.bookingMeta || {}),
          ...data,
          client: data?.client || slot?.bookingMeta?.client || null,
          recruiter: data?.recruiter || slot?.bookingMeta?.recruiter || null,
          service: data?.service || slot?.bookingMeta?.service || null,
          payments: Array.isArray(data?.payments) ? data.payments : (slot?.bookingMeta?.payments || []),
        },
      };
    } catch {
      return slot;
    }
  };

  const openBookingRescheduleDialog = () => {
    if (!selectedBookedSlot) return;
    setBookingRescheduleForm({
      date: selectedBookedSlot.bookingMeta?.local_date || selectedBookedSlot.localDate || selectedDate,
      start: selectedBookedSlot.bookingMeta?.local_start_time || selectedBookedSlot.startHH,
      end: selectedBookedSlot.bookingMeta?.local_end_time || selectedBookedSlot.endHH,
    });
    setBookingRescheduleOpen(true);
  };

  const handleCancelBookedSlot = async () => {
    const apptId = selectedBookedSlot?.primaryAppointmentId;
    if (!apptId) return;
    setBookedSlotLoading(true);
    try {
      await api.post(
        `/api/manager/bookings/${apptId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      closeBookedSlotDialog();
      setSuccessMessage("Booking cancelled. The slot is now free to reuse. Refunds, if needed, must be handled separately.");
      window.dispatchEvent(new Event("slots:refresh"));
      await Promise.all([fetchEvents(), fetchBookingCatalog()]);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to cancel booking.");
    } finally {
      setBookedSlotLoading(false);
    }
  };

  const handleRescheduleBookedSlot = async () => {
    const apptId = selectedBookedSlot?.primaryAppointmentId;
    if (!apptId) return;
    setBookedSlotLoading(true);
    try {
      await api.patch(
        `/api/manager/bookings/${apptId}`,
        {
          date: bookingRescheduleForm.date,
          start_time: bookingRescheduleForm.start,
          end_time: bookingRescheduleForm.end,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookingRescheduleOpen(false);
      closeBookedSlotDialog();
      setSuccessMessage("Booking rescheduled. The client booking was kept and the calendar has been refreshed.");
      window.dispatchEvent(new Event("slots:refresh"));
      await Promise.all([fetchEvents(), fetchBookingCatalog()]);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to reschedule booking.");
    } finally {
      setBookedSlotLoading(false);
    }
  };

  const openRefundHub = () => {
    if (!selectedBookedSlot?.primaryAppointmentId) return;
    const params = new URLSearchParams({
      appointmentId: String(selectedBookedSlot.primaryAppointmentId),
      clientId: String(selectedBookedSlot.bookingMeta?.client?.id || ""),
      email: selectedBookedSlot.bookingMeta?.client?.email || "",
      company: window.location.hostname || "",
      intent: "refund",
    });
    window.location.href = `/manager/payments?${params.toString()}`;
  };

  const openMeetingLink = () => {
    const link = selectedBookedSlot?.bookingMeta?.meeting_link || selectedBookedSlot?.meeting_link || "";
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const handleDateClick = (arg) => {
    const dateKey = calendarDateKey(arg.dateStr || arg.date, calendarTimezone);
    if (dateKey) setSelectedDate(dateKey);
  };

  const onEventClick = (info) => {
    const dt = info.event.start;
    if (dt) setSelectedDate(calendarDateKey(dt, calendarTimezone));
  };

  const handleCalendarToday = () => {
    const today = calendarDateKey(new Date(), calendarTimezone);
    if (!today) return;
    setSelectedDate(today);
    calRef.current?.getApi?.().gotoDate(today);
  };

  const handleChipClick = async (slot) => {
    if (slot.booked) {
      setBookedSlotLoading(true);
      const hydrated = await hydrateBookedSlotDetails(slot);
      setSelectedBookedSlot(hydrated);
      setBookedSlotOpen(true);
      setBookedSlotLoading(false);
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
    refreshAll();
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
      const recruiter_ids = Array.isArray(form.recruiter_ids)
        ? form.recruiter_ids
        : form.recruiter_id
          ? [form.recruiter_id]
          : [];
      const payload = { ...form, recruiter_ids, invite_link: link };

      await api.post(`/manager/add-meeting`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    setSuccessMessage("✅ Saved. Clients will receive an update email.");
    setOpenModal(false);
    resetForm();
    window.dispatchEvent(new Event("slots:refresh"));
    await refreshAll();
  } catch (e) {
    setError(e?.response?.data?.error || "❌ Failed to save");
  } finally {
    setIsSubmitting(false);
  }
};



  const handleSaveMeeting = () => {
    if (!form.date || !form.start || !form.end) return setError("Please fill date, start & end");
    if (!form.title) return setError("Please enter a title");
    if ((!form.recruiter_id || form.recruiter_id === "") && (!form.recruiter_ids || form.recruiter_ids.length === 0)) {
      return setError("Please select at least one employee");
    }

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
      calendarDateKey(e.start, calendarTimezone),
      moment.parseZone(e.start).tz(calendarTimezone).format("HH:mm"),
      moment.parseZone(e.end).tz(calendarTimezone).format("HH:mm"),
      getEmployeeName(e),
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

  const postAvailabilityDayAction = async (action, payload) => {
    const { data } = await api.post(
      `/api/manager/availability/${action}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data || {};
  };

  const beginAvailabilityMutation = () => {
    const requestId = availabilityMutationContextRef.current + 1;
    availabilityMutationContextRef.current = requestId;
    setAvailabilityMutationPending(true);
    return requestId;
  };

  const mutationContextIsCurrent = (requestId) =>
    availabilityMutationContextRef.current === requestId;

  const finishAvailabilityMutation = (requestId) => {
    if (mutationContextIsCurrent(requestId)) setAvailabilityMutationPending(false);
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
    const visuals = getSlotVisuals(xp);
    const status = visuals.label;
    const emp = getEmployeeName(xp);
    const client = xp.bookingMeta?.client?.full_name || xp.candidate_name || "";
    const svc = xp.service_name || "";
    const accent = getEmpAccent(xp.recruiter_id || 0);

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
              borderRadius: 1,
              background: visuals.bg,
              border: `1px solid ${visuals.border}`,
              color: visuals.text,
              fontWeight: 700,
            }}
          >
            {status}
          </span>
          <span style={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {emp}
          </span>
        </div>
        {svc ? (
          <div style={{ fontSize: 11, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {svc}
          </div>
        ) : null}
        {client ? (
          <div style={{ fontSize: 11, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {client}
          </div>
        ) : null}
      </div>
    );
  };

  const eventDidMount = (info) => {
    const xp = info.event.extendedProps || {};
    const emp = getEmployeeName(xp);
    const status = getSlotVisuals(xp).label;
    const start = info.event.start ? moment(info.event.start).tz(calendarTimezone).format(timeFmt12h ? "h:mma" : "HH:mm") : "";
    const end = info.event.end ? moment(info.event.end).tz(calendarTimezone).format(timeFmt12h ? "h:mma" : "HH:mm") : "";
    const svc = xp.service_name ? `\nService: ${xp.service_name}` : "";
    const client = xp.bookingMeta?.client?.full_name || xp.candidate_name ? `\nClient: ${xp.bookingMeta?.client?.full_name || xp.candidate_name}` : "";
    info.el.setAttribute("title", `${status.toUpperCase()} — ${emp}\n${start}–${end}${svc}${client}`);
  };

  // Calendar events with improved status & employee color accents
  const calendarEvents = filteredEvents.map((e) => {
    const empColor = getEmpAccent(e.recruiter_id);
    const visuals = getSlotVisuals(e);
    return {
      id: e.id,
      title: visuals.label,
      start: e.start,
      end: e.end,
      backgroundColor: visuals.bg,
      borderColor: visuals.border,
      textColor: visuals.text,
      classNames: [e.booked ? "slot-booked" : "slot-available", `slot-${getSlotKind(e)}`],
      extendedProps: { ...e, status: e.__status, _empColor: empColor, slotKind: getSlotKind(e), bookingMeta: e.appointment_ids?.length ? bookingCatalogById.get(String(e.appointment_ids[0])) || null : null },
    };
  });

  // Common props
  const baseCalProps = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, luxonPlugin],
    timeZone: calendarTimezone,
    events: calendarEvents,
    weekends: showWeekends,
    nowIndicator: true,
    // Desktop month view uses a compact bounded grid; FullCalendar collapses
    // dense cells behind its accessible "+ more" control. Mobile keeps its
    // natural height so touch users can scroll through every week.
    expandRows: calendarView !== "dayGridMonth" || !isSmDown,
    dayMaxEvents: calendarView === "dayGridMonth" && !isSmDown ? true : 4,
    displayEventEnd: true,
    stickyHeaderDates: true,
    navLinks: false,
    scrollTime: "08:00:00",
    slotDuration: granularity,
    slotLabelInterval: "01:00",
    slotMinTime: workHoursOnly ? "08:00:00" : "00:00:00",
    slotMaxTime: workHoursOnly ? "20:00:00" : "24:00:00",
    eventTimeFormat,
    slotLabelFormat,
    dateClick: handleDateClick,
    eventClick: onEventClick,
    dayCellClassNames: (info) =>
      calendarDateKey(info.date, calendarTimezone) === selectedDate
        ? ["team-availability-selected-day"]
        : [],
    datesSet: (info) => {
      if (info.view.type !== calendarView) setCalendarView(info.view.type);
    },
    eventContent: renderEventContent,
    eventDidMount,
    headerToolbar: isSmDown
      ? { left: "prev", center: "title", right: "selectToday,next" }
      : {
          left: "prev,next selectToday",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        },
    customButtons: {
      selectToday: {
        text: "Today",
        click: handleCalendarToday,
      },
    },
    titleFormat: isSmDown ? { month: "short", day: "numeric" } : { month: "long", day: "numeric", year: "numeric" },
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
    setDayWindow({ start: earliest, end: latest });
  }, [daySlots, selectedRecruiter]);

  /* ------------------------------- UI --------------------------------- */
  return (
    <Box
      sx={{
        my: 4,
        ...vars,
        display: "flex",
        flexDirection: "column",
        minHeight: { xs: "auto", md: "calc(100vh - 220px)" },
        gap: 2,
      }}
    >
      {/* Scoped FullCalendar polish for this surface only. */}
      <GlobalStyles
        styles={{
          ".team-availability-calendar .fc .fc-timegrid-slot": {
            height: compactDensity ? 28 : 34,
          },
          ".team-availability-calendar .fc .fc-timegrid-axis-cushion, .team-availability-calendar .fc .fc-timegrid-slot-label-cushion": {
            fontSize: 12,
          },
          ".team-availability-calendar .fc .fc-timegrid-event": {
            borderRadius: 1,
            boxShadow: theme.shadows[1],
          },
          ".team-availability-calendar .fc .fc-event, .team-availability-calendar .fc .fc-daygrid-event, .team-availability-calendar .fc .fc-daygrid-dot-event, .team-availability-calendar .fc .fc-daygrid-block-event, .team-availability-calendar .fc .fc-timegrid-event": {
            borderRadius: "6px !important",
          },
          ".team-availability-calendar .fc .fc-event-main, .team-availability-calendar .fc .fc-event-main-frame": {
            borderRadius: "6px !important",
            overflow: "hidden",
          },
          ".team-availability-calendar .fc .fc-timegrid-event .fc-event-time": {
            fontWeight: 700,
            fontSize: 11,
            paddingLeft: 4,
          },
          ".team-availability-calendar .fc .fc-timegrid-event .fc-event-title": {
            fontSize: 11,
          },
          ".team-availability-calendar .fc .fc-button": {
            color: theme.palette.text.primary,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            borderColor: theme.palette.divider,
            boxShadow: "none",
          },
          ".team-availability-calendar .fc .fc-button:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            borderColor: alpha(theme.palette.primary.main, 0.3),
          },
          ".team-availability-calendar .fc .fc-button-primary:not(:disabled).fc-button-active": {
            backgroundColor: alpha(theme.palette.primary.main, 0.18),
            borderColor: alpha(theme.palette.primary.main, 0.45),
            color: theme.palette.primary.main,
          },
          ".team-availability-calendar .fc .fc-button:focus-visible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
          ".team-availability-calendar .fc .fc-toolbar-title": {
            fontWeight: 700,
            color: theme.palette.text.primary,
          },
          ".team-availability-calendar .fc .fc-col-header-cell-cushion": {
            color: theme.palette.text.primary,
            fontWeight: 600,
          },
          ".team-availability-calendar .fc .fc-more-link": {
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
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Team Availability
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage bookable slots for employees.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Calendar timezone: {tzLabel}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
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
          >
            Add meeting
          </Button>
          <Button variant="outlined" onClick={() => refreshAll()}>
            Refresh
          </Button>
          <Tooltip title="Export CSV/XLSX">
            <IconButton onClick={exportToExcel} aria-label="Export team availability"><DownloadIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      <Accordion
        defaultExpanded={false}
        disableGutters
        sx={{
          mb: 2,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          "&::before": { display: "none" },
        }}
        elevation={0}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="team-availability-filter-options"
          id="team-availability-filter-options-header"
          sx={{ px: { xs: 1.5, sm: 2 } }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700}>Filters &amp; calendar options</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {activeFilterSummary}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails id="team-availability-filter-options" sx={{ pt: 0 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} useFlexGap flexWrap="wrap">
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel id="team-availability-department-label">Department</InputLabel>
          <Select
            id="team-availability-department"
            labelId="team-availability-department-label"
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

        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel id="team-availability-employee-label">Employee</InputLabel>
          <Select
            id="team-availability-employee"
            labelId="team-availability-employee-label"
            size="small"
            value={selectedRecruiter}
            label="Employee"
            onChange={(e) => setSelectedRecruiter(e.target.value)}
            disabled={recruiters.length === 0}
          >
            <MenuItem value="all">All Employees</MenuItem>
            {recruiters.map((r) => {
              const label = recruiterDisplayName(r);
              return <MenuItem key={r.id} value={r.id}>{label}</MenuItem>;
            })}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel id="team-availability-status-label">Slot Status</InputLabel>
          <Select
            id="team-availability-status"
            labelId="team-availability-status-label"
            multiple
            size="small"
            value={statusFilter}
            label="Slot Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            renderValue={(vals) => (vals.length ? vals.join(", ") : "All")}
          >
            <MenuItem value="available">
              <Chip size="small" label="Available" sx={{ bgcolor: ui.available.bg, color: ui.available.text }} />
            </MenuItem>
            <MenuItem value="booked">
              <Chip size="small" label="Booked" sx={{ bgcolor: ui.booked.bg, color: ui.booked.text }} />
            </MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
          }
          label="Show archived employees"
        />

          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" sx={{ ml: "auto" }}>
            {canCloseSlots && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={selectedRecruiter === "all" || availabilityMutationPending}
                  onClick={(e) => setDayMenuAnchor(e.currentTarget)}
                >
                  Day actions
                </Button>
                <Menu anchorEl={dayMenuAnchor} open={Boolean(dayMenuAnchor)} onClose={() => setDayMenuAnchor(null)}>
                  <MenuItem onClick={() => { setDayMode("close-day"); setDayDialogOpen(true); setDayMenuAnchor(null); }}>Close entire day</MenuItem>
                  <MenuItem onClick={() => { setDayMode("close-after"); setDayDialogOpen(true); setDayMenuAnchor(null); }}>Close rest of day…</MenuItem>
                  <MenuItem onClick={() => { setDayMode("close-before"); setDayDialogOpen(true); setDayMenuAnchor(null); }}>Close before time…</MenuItem>
                  <MenuItem onClick={() => { setDayMode("keep-range"); setDayDialogOpen(true); setDayMenuAnchor(null); }}>Keep only time range…</MenuItem>
                </Menu>
              </>
            )}
            {!isSmDown && (
              <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                <Chip size="small" label="Available" sx={{ bgcolor: ui.available.bg, color: ui.available.text }} />
                <Chip size="small" label="Booked" sx={{ bgcolor: ui.booked.bg, color: ui.booked.text }} />
              </Stack>
            )}
          </Stack>
        </Stack>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Paper
          className="team-availability-calendar"
          sx={{
            p: compactDensity ? 1 : 2,
            minHeight: calendarView === "dayGridMonth" ? 0 : 520,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            overflowX: "auto",
            overflowY: "visible",
            width: "100%",
            maxWidth: "100%",
          }}
          elevation={0}
        >
          <FullCalendar
            ref={calRef}
            {...baseCalProps}
            initialView={calendarView}
            initialDate={selectedDate}
            height={calendarView === "dayGridMonth" ? (isSmDown ? "auto" : 540) : (isSmDown ? "auto" : 700)}
            key={`${granularity}-${timeFmt12h}-${showWeekends}-${workHoursOnly}-${compactDensity}-${statusFilter.join(",")}`}
          />
        </Paper>

        <Paper sx={{ p: 2 }} elevation={0} variant="outlined">
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {formatCalendarDateLabel(selectedDate, undefined, calendarTimezone)} — {daySlots.length} slot(s)
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
            {/* Edit available window (single or many employees) */}
            {canCloseSlots && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setDayWindowOpen(true)}
                disabled={selectedRecruiter === "all" || availabilityMutationPending}
                sx={{ minWidth: 180 }}
                fullWidth
              >
                Edit Available Window…
              </Button>
            )}

            {/* Quick close entire day — per-employee local date */}
            {canCloseSlots && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={selectedRecruiter === "all" || availabilityMutationPending}
                sx={{ minWidth: 140 }}
                fullWidth
                onClick={() => {
                  setDayMode("close-day");
                  setDayDialogOpen(true);
                }}
              >
                Close day
              </Button>
            )}

            <Button size="small" onClick={() => refreshAll()} sx={{ minWidth: 120 }} fullWidth>
              Refresh
            </Button>
          </Stack>
        </Stack>

        {canCloseSlots && selectedRecruiter === "all" && (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            Select one employee to edit an available window or close a day. This keeps the displayed timezone and the employee-local action date aligned.
          </Alert>
        )}

        {daySlots.length === 0 ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography fontWeight={600}>No availability or bookings for this day</Typography>
            <Typography variant="body2" color="text.secondary">
              Choose another date or adjust the filters.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {daySlotGroups.map((group) => (
              <Box key={group.key}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {group.employeeName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {group.slots.length} slot{group.slots.length === 1 ? "" : "s"}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                    gap: 1,
                  }}
                >
                  {group.slots.map((s) => {
                    const visuals = getSlotVisuals(s);
                    const clientName = s.bookingMeta?.client?.full_name || s.candidate_name || "";
                    const serviceName = s.service_name || s.bookingMeta?.service?.name || "";
                    const capacityLabel = s.mode === "group" && Number.isFinite(s.capacity)
                      ? `${Number(s.booked_count || 0)}/${s.capacity} booked • ${Number.isFinite(s.seats_left) ? s.seats_left : 0} left`
                      : "";
                    return (
                      <Paper
                        key={`${s.startISO}-${s.recruiter_id}`}
                        variant="outlined"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleChipClick(s)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleChipClick(s);
                          }
                        }}
                        sx={{
                          p: 1.25,
                          borderRadius: 1,
                          borderColor: visuals.border,
                          borderLeft: `4px solid ${getEmpAccent(s.recruiter_id)}`,
                          bgcolor: alpha(visuals.bg, theme.palette.mode === "dark" ? 0.7 : 0.55),
                          cursor: "pointer",
                          minWidth: 0,
                          "&:hover": { borderColor: getEmpAccent(s.recruiter_id), boxShadow: theme.shadows[1] },
                          "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                              <Typography fontWeight={700} variant="body2">
                                {s.startHH}–{s.endHH}
                              </Typography>
                              <Chip
                                size="small"
                                label={getSlotKindLabel(s)}
                                sx={{
                                  height: 22,
                                  borderRadius: 1,
                                  bgcolor: visuals.bg,
                                  border: `1px solid ${visuals.border}`,
                                  color: visuals.text,
                                  "& .MuiChip-label": { px: 0.75, fontWeight: 700 },
                                }}
                              />
                            </Stack>
                            {(serviceName || clientName || capacityLabel) ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                {[serviceName, clientName, capacityLabel].filter(Boolean).join(" • ")}
                              </Typography>
                            ) : null}
                          </Box>
                          {!s.booked && canEditAvailability ? (
                            <Tooltip title={`Edit availability for ${group.employeeName}`}>
                              <IconButton
                                size="small"
                                aria-label={`Edit ${s.startHH} availability for ${group.employeeName}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setChipSlot(s);
                                  setChipMenuAnchor(event.currentTarget);
                                }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
      </Box>

      {/* Create/Edit modal (unchanged core) */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 1,
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
            <ThemedDateField label="Date" name="date" value={form.date} onChange={handleFormChange} fullWidth />
            <Stack direction="row" spacing={2}>
              <ThemedTimeField label="Start" name="start" value={form.start} onChange={handleFormChange} fullWidth />
              <ThemedTimeField label="End" name="end" value={form.end} onChange={handleFormChange} fullWidth />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Employees</InputLabel>
              <Select
                multiple
                label="Employees"
                name="recruiter_ids"
                value={form.recruiter_ids || (form.recruiter_id ? [form.recruiter_id] : [])}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    recruiter_ids: e.target.value,
                    recruiter_id: Array.isArray(e.target.value) && e.target.value.length ? e.target.value[0] : "",
                  }))
                }
                renderValue={(selected) =>
                  recruiters
                    .filter((r) => selected.includes(r.id))
                    .map(recruiterDisplayName)
                    .join(", ")
                }
              >
                {recruiters.map((r) => {
                  const label = recruiterDisplayName(r);
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

      <Dialog open={bookedSlotOpen} onClose={closeBookedSlotDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedBookedSlot ? getSlotKindLabel(selectedBookedSlot) : "Booked Slot"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {selectedBookedSlot && (
              <>
                <Alert severity="info">
                  {selectedBookedSlot.startHH}–{selectedBookedSlot.endHH} on {selectedBookedSlot.localDate}
                  {selectedBookedSlot.bookingMeta?.appointment_timezone ? ` • ${selectedBookedSlot.bookingMeta.appointment_timezone}` : ""}
                </Alert>
                <Stack spacing={1}>
                  {selectedBookedSlot.primaryAppointmentId ? (
                    <Typography variant="body2"><strong>Booking ID:</strong> {selectedBookedSlot.primaryAppointmentId}</Typography>
                  ) : null}
                  <Typography variant="body2"><strong>Employee:</strong> {getEmployeeName(selectedBookedSlot)}</Typography>
                  <Typography variant="body2"><strong>Service:</strong> {selectedBookedSlot.service_name || selectedBookedSlot.bookingMeta?.service?.name || "—"}</Typography>
                  <Typography variant="body2"><strong>Client:</strong> {selectedBookedSlot.bookingMeta?.client?.full_name || selectedBookedSlot.candidate_name || "—"}</Typography>
                  {selectedBookedSlot.bookingMeta?.client?.email ? (
                    <Typography variant="body2"><strong>Email:</strong> {selectedBookedSlot.bookingMeta.client.email}</Typography>
                  ) : null}
                  {selectedBookedSlot.bookingMeta?.client?.phone ? (
                    <Typography variant="body2"><strong>Phone:</strong> {selectedBookedSlot.bookingMeta.client.phone}</Typography>
                  ) : null}
                  <Typography variant="body2"><strong>Status:</strong> {selectedBookedSlot.bookingMeta?.status || "booked"}</Typography>
                  {selectedBookedSlot.primaryAppointmentId ? (
                    <Typography variant="body2"><strong>Payment:</strong> {selectedBookedSlot.bookingMeta?.payment_status || "unpaid"}</Typography>
                  ) : null}
                  {Array.isArray(selectedBookedSlot.bookingMeta?.payments) && selectedBookedSlot.bookingMeta.payments.length ? (
                    <Typography variant="body2">
                      <strong>Payments:</strong> {selectedBookedSlot.bookingMeta.payments.map((p) => `${p.status || p.type || "txn"} ${p.amount != null ? formatMoney(p.amount, p.currency || selectedBookedSlot.bookingMeta?.currency || "CAD") : ""}`.trim()).join(" • ")}
                    </Typography>
                  ) : null}
                  {selectedBookedSlot.bookingMeta?.manager_note ? (
                    <Typography variant="body2"><strong>Manager note:</strong> {selectedBookedSlot.bookingMeta.manager_note}</Typography>
                  ) : null}
                  {(selectedBookedSlot.bookingMeta?.meeting_link || selectedBookedSlot.meeting_link) ? (
                    <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                      <strong>Meeting link:</strong> {selectedBookedSlot.bookingMeta?.meeting_link || selectedBookedSlot.meeting_link}
                    </Typography>
                  ) : null}
                </Stack>
                {selectedBookedSlot.primaryAppointmentId ? (
                  <Alert severity="warning">
                    If this booking was paid, canceling will free the slot but refund must be handled separately from the refund/payment page.
                  </Alert>
                ) : (
                  <Alert severity="info">
                    This booked time is preserved by Close day. Availability can be closed around it, but the booking itself must be managed separately.
                  </Alert>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBookedSlotDialog}>Close</Button>
          <Button
            variant="outlined"
            onClick={openMeetingLink}
            disabled={!(selectedBookedSlot?.bookingMeta?.meeting_link || selectedBookedSlot?.meeting_link)}
          >
            Join meeting
          </Button>
          <Button
            variant="outlined"
            onClick={openRefundHub}
            disabled={!selectedBookedSlot?.primaryAppointmentId}
          >
            Payments / refund
          </Button>
          <Button
            variant="outlined"
            onClick={openBookingRescheduleDialog}
            disabled={!selectedBookedSlot?.primaryAppointmentId || bookedSlotLoading}
          >
            Reschedule
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleCancelBookedSlot}
            disabled={!selectedBookedSlot?.primaryAppointmentId || bookedSlotLoading}
          >
            Cancel booking
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bookingRescheduleOpen} onClose={() => setBookingRescheduleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reschedule booking</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <ThemedDateField
              label="Date"
              value={bookingRescheduleForm.date}
              onChange={(e) => setBookingRescheduleForm((p) => ({ ...p, date: e.target.value }))}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <ThemedTimeField
                label="Start"
                value={bookingRescheduleForm.start}
                onChange={(e) => setBookingRescheduleForm((p) => ({ ...p, start: e.target.value }))}
                fullWidth
                inputProps={{ step: 300 }}
              />
              <ThemedTimeField
                label="End"
                value={bookingRescheduleForm.end}
                onChange={(e) => setBookingRescheduleForm((p) => ({ ...p, end: e.target.value }))}
                fullWidth
                inputProps={{ step: 300 }}
              />
            </Stack>
            <Alert severity="info">
              Rescheduling keeps the booking active and updates the occupied slot. Paid bookings are not refunded automatically.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingRescheduleOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRescheduleBookedSlot} disabled={bookedSlotLoading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

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
            <ThemedDateField label="Date" value={slotEditForm.date} onChange={(e) => setSlotEditForm(p => ({ ...p, date: e.target.value }))} fullWidth />
            <Stack direction="row" spacing={2}>
              <ThemedTimeField label="Start" value={slotEditForm.start} onChange={(e) => setSlotEditForm(p => ({ ...p, start: e.target.value }))} fullWidth inputProps={{ step: 300 }} />
              <ThemedTimeField label="End" value={slotEditForm.end} onChange={(e) => setSlotEditForm(p => ({ ...p, end: e.target.value }))} fullWidth inputProps={{ step: 300 }} />
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
                refreshAll();
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
              <ThemedTimeField
                label={dayMode === "close-after" ? "From time" : "Until time"}
                value={dayTimeA}
                onChange={(e) => setDayTimeA(e.target.value)}
                inputProps={{ step: 300 }}
                fullWidth
              />
            )}
            {dayMode === "keep-range" && (
              <Stack direction="row" spacing={2}>
                <ThemedTimeField label="Start time" value={dayTimeA} onChange={(e) => setDayTimeA(e.target.value)} inputProps={{ step: 300 }} fullWidth />
                <ThemedTimeField label="End time" value={dayTimeB} onChange={(e) => setDayTimeB(e.target.value)} inputProps={{ step: 300 }} fullWidth />
              </Stack>
            )}
            <Alert severity="info">
              Target: {selectedEmployee ? recruiterDisplayName(selectedEmployee) : "Select one employee"}<br />
              Date: {selectedDate} in {calendarTimezone}.
            </Alert>
            {dayMode === "close-day" && (
              <Typography variant="body2" color="text.secondary">
                This removes free availability for the selected employee and day. Existing bookings are not cancelled, and attendance, payroll, refunds, and shifts are unchanged.
              </Typography>
            )}
            {dayMode === "keep-range" && (
              <Typography variant="body2" color="text.secondary">
                This keeps existing free slots whose employee-local start falls inside the range. It does not create, extend, or reopen availability.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDayDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={selectedRecruiter === "all" || availabilityMutationPending}
            onClick={async () => {
              if (!canCloseSlots) { setError("You do not have permission to change availability."); return; }
              if (selectedRecruiter === "all") { setError("Select one employee before changing availability."); return; }

              const requestId = beginAvailabilityMutation();
              try {
                const payload = { recruiter_id: selectedRecruiter, date: selectedDate };
                let action = dayMode;
                if (dayMode === "close-after") payload.from_time = dayTimeA;
                if (dayMode === "close-before") payload.until_time = dayTimeA;
                if (dayMode === "keep-range") {
                  if (!dayTimeA || !dayTimeB || dayTimeA >= dayTimeB) {
                    setError("Start time must be earlier than end time.");
                    return;
                  }
                  payload.start_time = dayTimeA;
                  payload.end_time = dayTimeB;
                }
                const result = await postAvailabilityDayAction(action, payload);
                if (!mutationContextIsCurrent(requestId)) return;

                setDayDialogOpen(false);
                setSuccessMessage(
                  buildBulkFeedbackMessage({
                    changedLabel: "Day availability updated",
                    deleted: Number(result.deleted || result.removed || 0),
                    skipped: Number(result.skipped_booked || 0),
                    employeeCount: 1,
                  })
                );
                await refreshAll();
              } catch (e) {
                if (mutationContextIsCurrent(requestId)) {
                  setError(e?.response?.data?.error || "Failed to update day availability.");
                }
              } finally {
                finishAvailabilityMutation(requestId);
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
              Employee: <strong>{selectedEmployee ? recruiterDisplayName(selectedEmployee) : "Select one employee"}</strong><br/>
              Timezone: <strong>{calendarTimezone}</strong>
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Current available span detected from today’s <em>free</em> slots:
            </Typography>

            <Stack direction="row" spacing={2}>
              <ThemedTimeField
                label="Start"
                value={dayWindow.start}
                onChange={(e) => setDayWindow((w) => ({ ...w, start: e.target.value }))}
                inputProps={{ step: 300 }}
                fullWidth
              />
              <ThemedTimeField
                label="End"
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
            disabled={selectedRecruiter === "all" || availabilityMutationPending}
            onClick={async () => {
              if (selectedRecruiter === "all") {
                setError("Select one employee before changing availability.");
                return;
              }
              const requestId = beginAvailabilityMutation();
              try {
                const start = dayWindow.start;
                const end   = dayWindow.end;
                if (!start || !end || start >= end) {
                  setError("Start time must be earlier than end time.");
                  return;
                }
                const result = await postAvailabilityDayAction("keep-range", {
                  recruiter_id: selectedRecruiter,
                  date: selectedDate,
                  start_time: start,
                  end_time: end,
                });
                if (!mutationContextIsCurrent(requestId)) return;

                setDayWindowOpen(false);
                setSuccessMessage(
                  buildBulkFeedbackMessage({
                    changedLabel: "Available window updated",
                    deleted: Number(result.deleted || 0),
                    skipped: Number(result.skipped_booked || 0),
                    employeeCount: 1,
                  })
                );
                await refreshAll();
              } catch (e) {
                if (mutationContextIsCurrent(requestId)) {
                  const msg = e?.response?.data?.error || "Failed to update available window.";
                  setError(msg);
                }
              } finally {
                finishAvailabilityMutation(requestId);
              }
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Screen Dialog with calendar */}
      {/* Full Screen dialog removed per enterprise layout */}
    </Box>
  );
};

export default AllEmployeeSlotsCalendar;
