// src/InteractiveCalendar.js
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Typography,
  Alert,
  Paper,
  Tooltip,
  Divider,
  Modal,
  Button,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  CircularProgress,
  Chip,
  Checkbox,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import axios from "axios";
import { alpha, darken, lighten, useTheme } from "@mui/material/styles";
import { isoFromParts } from "./utils/datetime";
import { DateTime } from "luxon";
import { API_BASE_URL } from "./utils/api";

const API_URL =
  (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) ||
  API_BASE_URL;

const InteractiveCalendar = ({ token, refreshTrigger, permissions, calendarFilters, readOnly = false }) => {
  const theme = useTheme();

  const calendarThemeVars = useMemo(() => {
    const primary = theme.palette.primary.main;
    const primaryDark = theme.palette.primary.dark || darken(primary, 0.2);
    const buttonText = theme.palette.getContrastText(primary);
    return {
      "--fc-page-bg-color": theme.palette.background.paper,
      "--fc-neutral-bg-color": alpha(theme.palette.background.paper, 0.65),
      "--fc-border-color": alpha(theme.palette.divider, 0.4),
      "--fc-button-bg-color": primary,
      "--fc-button-border-color": primary,
      "--fc-button-text-color": buttonText,
      "--fc-button-hover-bg-color": lighten(primary, 0.1),
      "--fc-button-hover-border-color": lighten(primary, 0.1),
      "--fc-button-active-bg-color": primaryDark,
      "--fc-button-active-border-color": primaryDark,
      "--fc-button-active-text-color": theme.palette.getContrastText(primaryDark),
      "--fc-event-bg-color": primary,
      "--fc-event-border-color": primary,
      "--fc-event-text-color": buttonText,
      "--fc-today-bg-color": alpha(primary, 0.12),
      "--fc-highlight-color": alpha(theme.palette.secondary.main, 0.16),
      "--fc-list-event-dot-color": primary,
      "--fc-non-business-color": alpha(primary, 0.04),
    };
  }, [theme]);

  const eventTextColor = useMemo(() => theme.palette.getContrastText(theme.palette.primary.main), [theme]);
  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ core data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ui state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(Date.now());
  const [openModal, setOpenModal] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [lastChange, setLastChange] = useState(null);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ department filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ form + editing state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [form, setForm] = useState({
    title: "",
    description: "",
    candidate_name: "",
    candidate_email: "",
    date: "",
    start: "",
    end: "",
    recruiter_id: "",
    location: "",
    invite_link: "",
    attendees: [],
    status: "",
    manager_note: "",
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [recruiters, setRecruiters] = useState([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDropInfo, setPendingDropInfo] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ fetchers wrapped in useCallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const fetchRecruiters = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(
        `${API_URL}/api/manager/employees`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecruiters(data || []);
    } catch {
      setRecruiters([]);
    }
  }, [token]);

  const fetchDepartments = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(
        `${API_URL}/api/departments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDepartments(data || []);
    } catch {
      setDepartments([]);
    }
  }, [token]);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/my-availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const slots   = res.data.available_slots || [];
      const leaves  = res.data.leave_blocks || [];
      const blocks  = res.data.appointment_blocks || [];   // NEW â€” single contiguous appointment blocks

      const availabilityEvents = slots.map((slot) => {
        const status = slot.status || (slot.booked ? "booked" : "available");
        const backgroundColor =
          status === "cancelled" ? "#d32f2f" :
          status === "no-show"  ? "#ff9800" :
          slot.booked           ? "#ffcdd2" : "#c8e6c9";
        const borderColor =
          status === "cancelled" ? "#b71c1c" :
          status === "no-show"  ? "#ef6c00" :
          slot.booked           ? "#f44336" : "#4caf50";

        return {
          id: String(slot.id),
          title: slot.booked
            ? (permissions?.can_view_clients && slot.candidate_name ? `Booked “ ${slot.candidate_name}` : "Booked")
            : "Available",
          start: isoFromParts(slot.date, slot.start_time, slot.timezone),
          end:   isoFromParts(slot.date, slot.end_time,   slot.timezone),
          backgroundColor,
          borderColor,
          textColor: "#000",
          editable: true,
          extendedProps: {
            ...slot,
            booked: !!slot.booked,
            type: "availability",
            status,
            manager_note: slot.manager_note || "",
            origin: (slot.service_name || slot.appointment_id) ? "clients" : (slot.candidate_email ? "candidates" : "unknown"), // helps FE filter
          },
        };
      });

      // NEW â€” single contiguous appointment events (client-side; server already policy-masked)
      const appointmentEvents = blocks.map((b) => ({
        id: String(b.id),
        title: permissions?.can_view_clients && b.candidate_name ? `Booked “ ${b.candidate_name}` : "Booked",
        start: b.start,  // already ISO with correct tz
        end:   b.end,
        backgroundColor: "#ffe0b2",
        borderColor: "#ff9800",
        textColor: "#000",
        editable: false,
        extendedProps: {
          ...b,
          booked: true,
          type: "appointment",
          status: b.payment_status || "booked",
          origin: "clients",
        },
      }));

      const leaveEvents = leaves.map((l) => ({
        id: `leave-${l.id}`,
        title: ` ${l.type || "Leave"}`,
        start: l.start,
        end:   l.end,
        backgroundColor: "#eeeeee",
        borderColor: "#9e9e9e",
        textColor: "#444",
        editable: false,
        extendedProps: { ...l, type: "leave" },
      }));

      setEvents([...availabilityEvents, ...appointmentEvents, ...leaveEvents]);
    } catch {
      setError("Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  }, [token, permissions]);

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ initial loads â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    if (token) {
      fetchEvents();
      fetchRecruiters();
      fetchDepartments();
    }
  }, [
    token,
    refreshTrigger,
    calendarRefreshTrigger,
    fetchEvents,
    fetchRecruiters,
    fetchDepartments,
  ]);

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ derived recruiter list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const filteredRecruiters = useMemo(
    () =>
      selectedDepartment
        ? recruiters.filter(
            (r) => String(r.department_id) === String(selectedDepartment)
          )
        : recruiters,
    [recruiters, selectedDepartment]
  );

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ filtering logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    let ev = events;
    // existing quick filter
    if (typeFilter !== "all") ev = ev.filter((e) => e.extendedProps.type === typeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      ev = ev.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.extendedProps.candidate_name || "").toLowerCase().includes(q) ||
          (e.extendedProps.candidate_email || "").toLowerCase().includes(q)
      );
    }
    // NEW â€” enterprise filters from parent (RecruiterDashboard)
    if (calendarFilters) {
      const { showAvailability = true, showAppointments = true, appointmentSource = "all" } = calendarFilters || {};
      if (!showAvailability) ev = ev.filter((e) => e.extendedProps.type !== "availability");
      if (!showAppointments) ev = ev.filter((e) => e.extendedProps.type !== "appointment");
      if (appointmentSource !== "all") {
        ev = ev.filter((e) => {
          // appointment events carry origin directly; availability uses heuristics
          if (e.extendedProps.type === "appointment")
            return e.extendedProps.origin === "clients" ? appointmentSource === "clients" : appointmentSource === "candidates";
          if (e.extendedProps.type === "availability" && e.extendedProps.booked) {
            const isClient = !!(e.extendedProps.service_name || e.extendedProps.appointment_id);
            return appointmentSource === "clients" ? isClient : !isClient;
          }
          return true;
        });
      }
    }
    setFilteredEvents(ev);
  }, [events, typeFilter, searchQuery, calendarFilters]);

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ slot updates + undo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const updateSlot = async (slotId, start, end) => {
    try {
      const event = events.find((ev) => ev.id === slotId.toString());
      setLastChange({ slotId, prevStart: event.start, prevEnd: event.end });
      setShowUndo(true);

      const payload = {
        start: start.toISOString(),
        end: end.toISOString(),
        location: event.extendedProps.location || "",
        description: event.extendedProps.description || "",
        meeting_link: event.extendedProps.meeting_link || "",
        attendees: event.extendedProps.attendees || [],
      };

      await axios.put(
        `${API_URL}/update-availability/${slotId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCalendarRefreshTrigger(Date.now());
      setSnackbarMsg("Slot updated successfully. Email notifications sent.");
    } catch (err) {
      console.error("Update slot error:", err.response || err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.details ||
          "Failed to update slot."
      );
    }
  };

  const undoLastChange = async () => {
    if (!lastChange) return;
    try {
      await axios.put(
        `${API_URL}/update-availability/${lastChange.slotId}`,
        { start: lastChange.prevStart, end: lastChange.prevEnd },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCalendarRefreshTrigger(Date.now());
      setShowUndo(false);
      setLastChange(null);
    } catch {
      setError("Undo failed “ please refresh.");
    }
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ handlers for FC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleEventDrop = (info) => {
    if (info.event.extendedProps.booked) {
      setPendingDropInfo(info);
      setConfirmOpen(true);
    } else if (info.event.start && info.event.end) {
      updateSlot(info.event.id, info.event.start, info.event.end);
    }
  };

  const handleEventResize = (info) => {
    if (info.event.start && info.event.end)
      updateSlot(info.event.id, info.event.start, info.event.end);
  };

  /* Confirm drag of booked slot */
  const confirmDrop = () => {
    if (!pendingDropInfo) return;
    const info = pendingDropInfo;
    setConfirmOpen(false);
    if (info.event.start && info.event.end) {
      updateSlot(info.event.id, info.event.start, info.event.end);
    }
    setPendingDropInfo(null);
  };

  const cancelDrop = () => {
    if (!pendingDropInfo) return;
    pendingDropInfo.revert();
    setConfirmOpen(false);
    setPendingDropInfo(null);
  };

  // When event clicked, open modal and populate form
  const handleEventClick = (info) => {
    const ext = info.event.extendedProps;
    const tz = ext.timezone || "UTC";
    const startDT = info.event.start
      ? DateTime.fromJSDate(info.event.start).setZone(tz)
      : null;
    const endDT = info.event.end
      ? DateTime.fromJSDate(info.event.end).setZone(tz)
      : null;

    setForm({
      title: info.event.title || ext.title || "",
      description: ext.description || "",
      candidate_name: permissions?.can_view_clients ? ext.candidate_name || "" : "",
      candidate_email: permissions?.can_view_clients ? ext.candidate_email || "" : "",
      date: startDT ? startDT.toFormat("yyyy-MM-dd") : "",
      start: startDT ? startDT.toFormat("HH:mm") : "",
      end: endDT ? endDT.toFormat("HH:mm") : "",
      recruiter_id: ext.recruiter_id || "",
      location: ext.location || "",
      invite_link: ext.meeting_link || ext.invite_link || "",
      attendees: ext.attendees || [],
      status: ext.status || (ext.booked ? "booked" : "available"),
      manager_note: ext.manager_note || "",
    });
    setEditingEvent({ id: info.event.id });
    setOpenModal(true);
    setError("");
    setSuccessMessage("");
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ event render content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const renderEventContent = (arg) => {
    const { booked, meeting_link, type, status } = arg.event.extendedProps;

    const color =
      type === "leave"         ? "#9e9e9e" :
      status === "cancelled"   ? "#d32f2f" :
      status === "no-show"     ? "#ff9800" :
      booked                   ? "#d32f2f" : "#2e7d32";

    const displayTitle = permissions?.can_view_clients
      ? arg.event.title
      : booked
        ? "Booked (Details Hidden)"
        : arg.event.title;

    const tooltipTitle = meeting_link
      ? `${displayTitle}\n${meeting_link}\n(click  to copy)`
      : displayTitle;

    return (
      <Tooltip arrow title={tooltipTitle}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {type === "leave"
            ? <EventBusyIcon fontSize="small" sx={{ color }} />
            : <EventAvailableIcon fontSize="small" sx={{ color }} />}
          <Typography variant="caption">{displayTitle}</Typography>
          {meeting_link && (
            <ContentCopyIcon
              fontSize="inherit"
              sx={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(meeting_link);
                setSnackbarMsg("Meeting link copied!");
              }}
            />
          )}
        </Box>
      </Tooltip>
    );
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ form handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleFormChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const [successAfterAction, setSuccessAfterAction] = useState(false);

  const handleAttendeesChange = (e) => {
    const picked = e.target.value; // emails
    const added = recruiters
      .filter((r) => picked.includes(r.email))
      .map((r) => ({
        name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.name,
        email: r.email,
      }));

    const merged = [
      ...form.attendees.filter(
        (a) => !added.some((b) => b.email === a.email)
      ),
      ...added,
    ];

    setForm((p) => ({
      ...p,
      attendees: merged,
      candidate_name: merged.map((a) => a.name).join(", "),
      candidate_email: merged.map((a) => a.email).join(", "),
    }));
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ save & employee actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleSaveMeeting = async () => {
    if (!form.date || !form.start || !form.end) {
      setError("Please fill date, start & end");
      return;
    }
    if (!form.title) {
      setError("Please enter a title");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        candidate_name: form.candidate_name,
        candidate_email: form.candidate_email,
        date: form.date,
        start_time: form.start,
        end_time: form.end,
        recruiter_id: form.recruiter_id,
        location: form.location,
        invite_link: form.invite_link,
        attendees: form.attendees,
      };
      const url = editingEvent
        ? `${API_URL}/api/meetings/${editingEvent.id}`
        : `${API_URL}/api/meetings`;
      const method = editingEvent ? "put" : "post";
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage("Meeting saved!");
      setOpenModal(false);
      setEditingEvent(null);
      setSuccessAfterAction(true);
      fetchEvents();
    } catch {
      setError("Failed to save meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!editingEvent) return;
    try {
      await axios.post(
        `${API_URL}/api/employee/bookings/${editingEvent.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage("Booking cancelled successfully");
      setOpenModal(false);
      fetchEvents();
    } catch {
      setError("Failed to cancel booking");
    }
  };

  const handleMarkNoShow = async () => {
    if (!editingEvent) return;
    try {
      await axios.post(
        `${API_URL}/api/employee/bookings/${editingEvent.id}/no-show`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage("Booking marked as no-show");
      setOpenModal(false);
      fetchEvents();
    } catch {
      setError("Failed to mark no-show");
    }
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <Paper
      elevation={4}
      sx={{ p: 3, mt: 3, backgroundColor: "#fff", borderRadius: 3 }}
    >
      {/* top-bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Interactive Calendar
        </Typography>
        <Stack direction="row" spacing={1}>
          <FormControl size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="availability">Availability</MenuItem>
              <MenuItem value="leave">Leave</MenuItem>
              <MenuItem value="appointment">Appointments</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Stack>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      {/* central spinner while loading data */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <Box sx={{ overflowX: "auto", ...calendarThemeVars }}>
          <FullCalendar
            height="auto"
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={filteredEvents}
            editable={!readOnly}
            droppable={!readOnly}
            eventBackgroundColor={theme.palette.primary.main}
            eventBorderColor={theme.palette.primary.main}
            eventTextColor={eventTextColor}
            eventDrop={readOnly ? undefined : handleEventDrop}
            eventResize={readOnly ? undefined : handleEventResize}
            eventResizableFromStart={!readOnly}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
          />
        </Box>
      )}

      {/* undo snackbar */}
      <Snackbar
        open={showUndo}
        message="Slot moved"
        action={
          <Button
            color="secondary"
            startIcon={<UndoIcon />}
            onClick={undoLastChange}
            size="small"
          >
            Undo
          </Button>
        }
        autoHideDuration={8000}
        onClose={() => setShowUndo(false)}
      />

      {/* snackbar for update status */}
      <Snackbar
        open={!!snackbarMsg}
        autoHideDuration={6000}
        onClose={() => setSnackbarMsg("")}
        message={snackbarMsg}
      />

      {/* confirmation dialog for booked slot drag */}
      <Dialog open={confirmOpen} onClose={cancelDrop}>
        <DialogTitle>Confirm Reschedule</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This slot is booked. Are you sure you want to reschedule? An email
            notification will be sent to all parties.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDrop}>Cancel</Button>
          <Button variant="contained" onClick={confirmDrop}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal with full edit form */}
      <Modal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedDepartment("");
        }}
      >
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            width: 500,
            mx: "auto",
            mt: "10%",
          }}
        >
          <Typography variant="h6" mb={2}>
            {editingEvent ? "Edit Booking" : "Create Booking"}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {successMessage && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              onClose={() => setSuccessMessage("")}
            >
              {successMessage}
            </Alert>
          )}

          {/* Status Chip */}
          {form.status && (
            <Chip
              label={`Status: ${form.status}`}
              color={
                form.status === "cancelled"
                  ? "error"
                  : form.status === "no-show"
                  ? "warning"
                  : "success"
              }
              sx={{ mb: 2 }}
            />
          )}

          {/* Manager Note */}
          {form.manager_note && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Manager Note:</strong> {form.manager_note}
            </Alert>
          )}

          {/* Client Info */}
          {permissions?.can_view_clients && form.candidate_name && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              Client: {form.candidate_name} ({form.candidate_email})
            </Typography>
          )}

          <Stack spacing={2}>
            <TextField
              name="title"
              label="Title"
              value={form.title}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              name="description"
              label="Description"
              value={form.description}
              onChange={handleFormChange}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              name="candidate_name"
              label="Candidate Name"
              value={form.candidate_name}
              onChange={handleFormChange}
              fullWidth
              disabled={!permissions?.can_view_clients}
            />
            <TextField
              name="candidate_email"
              label="Candidate Email (comma separated)"
              value={form.candidate_email}
              onChange={handleFormChange}
              fullWidth
              disabled={!permissions?.can_view_clients}
            />
            <TextField
              name="date"
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={form.date}
              onChange={handleFormChange}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                name="start"
                type="time"
                label="Start Time"
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                value={form.start}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                name="end"
                type="time"
                label="End Time"
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                value={form.end}
                onChange={handleFormChange}
                fullWidth
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel id="recruiter-select-modal">Recruiter</InputLabel>
              <Select
                labelId="recruiter-select-modal"
                name="recruiter_id"
                value={form.recruiter_id}
                label="Recruiter"
                onChange={handleFormChange}
              >
                <MenuItem value="">None</MenuItem>
                {filteredRecruiters.map((r) => {
                  const label = `${r.first_name ?? ""} ${r.last_name ??
                    ""}`.trim() || r.name || r.email;
                  return <MenuItem key={r.id} value={r.id}>{label}</MenuItem>;
                })}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="attendee-dept-select">Department</InputLabel>
              <Select
                labelId="attendee-dept-select"
                value={selectedDepartment}
                label="Department"
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Departments</em>
                </MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Select Attendees</InputLabel>
              <Select
                multiple
                value={form.attendees.map((a) => a.email)}
                onChange={handleAttendeesChange}
                renderValue={() => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {form.attendees.map((a) => (
                      <Chip key={a.email} label={a.name} />
                    ))}
                  </Box>
                )}
              >
                {filteredRecruiters.map((r) => (
                  <MenuItem key={r.id} value={r.email}>
                    <Checkbox
                      checked={form.attendees.some((a) => a.email === r.email)}
                    />
                    <ListItemText
                      primary={`${r.first_name ?? ""} ${r.last_name ??
                        ""}`.trim() || r.name}
                      secondary={r.email}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="location"
              label="Location"
              value={form.location}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              name="invite_link"
              label="Invite Link (optional)"
              value={form.invite_link}
              onChange={handleFormChange}
              fullWidth
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {editingEvent && (
                <Button
                  color="error"
                  variant="outlined"
                  onClick={handleCancelBooking}
                  disabled={readOnly}
                >
                  Cancel Booking
                </Button>
              )}
              {editingEvent && (
                <Button
                  color="warning"
                  variant="outlined"
                  onClick={handleMarkNoShow}
                  disabled={readOnly}
                >
                  Mark No-Show
                </Button>
              )}
              <Button
                onClick={() => {
                  setOpenModal(false);
                  setEditingEvent(null);
                  setSelectedDepartment("");
                }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveMeeting}
                disabled={isSubmitting || readOnly}
                startIcon={
                  isSubmitting ? <CircularProgress size={20} /> : null
                }
              >
                {isSubmitting ? "Saving¦" : "Save"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </Paper>
  );
};

export default InteractiveCalendar;
