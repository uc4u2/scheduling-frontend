// src/pages/sections/MasterCalendar.js
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Typography,
  Alert,
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
  Paper,
  Grid,
  Chip,
  Checkbox,
  ListItemText,
  CircularProgress
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useRecruiterMeetingHandler } from "./SecondMasterCalendar";
import moment from "moment-timezone";

const MasterCalendar = ({ token }) => {
  const theme = useTheme();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const isRecruiter = window.location.pathname.includes("recruiter");

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState("all");
  const [openModal, setOpenModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Updated initial state to include candidate fields
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
    candidate_name: "", // Will hold comma-separated names of all selected attendees
    candidate_email: "" // Will hold comma-separated emails of all selected attendees
  });

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

  const fetchEvents = async () => {
    try {
      const url = isRecruiter
        ? `${API_URL}/recruiter/calendar`
        : `${API_URL}/manager/calendar`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Convert times from UTC to the recruiter’s local timezone
      const recruiterTimezone = localStorage.getItem("timezone") || "UTC";
      const eventsWithConvertedTimes = res.data.events.map((event) => {
        const start = event.start
          ? moment.utc(event.start)
          : moment.tz(`${event.date} ${event.start_time}`, "YYYY-MM-DD HH:mm:ss", "UTC");
        const end = event.end
          ? moment.utc(event.end)
          : moment.tz(`${event.date} ${event.end_time}`, "YYYY-MM-DD HH:mm:ss", "UTC");

        return {
          ...event,
          start: start.tz(recruiterTimezone).toISOString(),
          end: end.tz(recruiterTimezone).toISOString(),
        };
      });
      setEvents(eventsWithConvertedTimes);
    } catch {
      setError("Failed to fetch events.");
    }
  };

  // Destructure both functions from useRecruiterMeetingHandler
  const { handleRecruiterSaveMeeting, handleRecruiterDirectBooking } = useRecruiterMeetingHandler(
    token,
    API_URL,
    resetForm,
    fetchEvents,
    setIsSubmitting,
    setSuccessMessage,
    setError,
    setOpenModal
  );

  const fetchRecruiters = async () => {
    try {
      const url = isRecruiter
        ? `${API_URL}/team/members`
        : `${API_URL}/manager/recruiters`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecruiters(res.data.recruiters);
    } catch {
      console.error("Failed to fetch recruiters.");
    }
  };

  useEffect(() => {
    if (token) {
      fetchEvents();
      fetchRecruiters();
    }
  }, [token]);

  useEffect(() => {
    setFilteredEvents(
      selectedRecruiter === "all"
        ? events
        : events.filter((e) => e.recruiter === selectedRecruiter)
    );
  }, [selectedRecruiter, events]);

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Updated attendees change handler:
  // Collect all selected attendees and set candidate_name and candidate_email as comma-separated strings.
  const handleAttendeesChange = (event) => {
    const selectedEmails = event.target.value;
    const selectedAttendees = recruiters
      .filter((r) => selectedEmails.includes(r.email))
      .map((r) => ({ name: r.name, email: r.email }));
    setForm((prev) => ({ ...prev, attendees: selectedAttendees }));
    if (selectedAttendees.length > 0) {
      const names = selectedAttendees.map(a => a.name).join(", ");
      const emails = selectedAttendees.map(a => a.email).join(", ");
      setForm((prev) => ({
        ...prev,
        candidate_name: names,
        candidate_email: emails,
      }));
    }
  };

  // Updated Save Meeting Handler for recruiters:
  // If candidate_name or candidate_email is missing, auto-fill using selected recruiter details.
  const handleSaveMeeting = () => {
    if (!form.date || !form.start || !form.end) {
      setError("Please fill out date, start time, and end time.");
      return;
    }
    if (!form.title) {
      setError("Please enter a meeting title.");
      return;
    }
    if (isRecruiter) {
      let bookingForm = { ...form };
      // Auto-fill candidate details if missing and recruiter is selected.
      if (bookingForm.recruiter_id && (!bookingForm.candidate_name || !bookingForm.candidate_email)) {
        const selectedRec = recruiters.find((r) => r.id === bookingForm.recruiter_id);
        if (selectedRec) {
          bookingForm.candidate_name = selectedRec.name;
          bookingForm.candidate_email = selectedRec.email;
          setForm(bookingForm);
        }
      }
      // Call the direct booking endpoint if candidate details are available.
      if (bookingForm.candidate_name && bookingForm.candidate_email) {
        handleRecruiterDirectBooking(bookingForm);
      } else {
        // Fallback: minimal meeting creation.
        handleRecruiterSaveMeeting(form, editingEvent);
      }
    } else {
      saveManagerMeeting();
    }
  };

  const saveManagerMeeting = async () => {
    setIsSubmitting(true);
    setSuccessMessage("");
    setError("");
    try {
      let inviteLink = form.invite_link;
      if (!inviteLink) {
        const res = await axios.get(`${API_URL}/utils/generate-jitsi`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        inviteLink = res.data.link;
      }
      const payload = { ...form, invite_link: inviteLink };
      const url = editingEvent
        ? `${API_URL}/api/meetings/${editingEvent.id}`
        : `${API_URL}/manager/add-meeting`;
      const method = editingEvent ? "put" : "post";
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage("✅ Meeting created, Jitsi link generated, and invitations sent.");
      setOpenModal(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      console.error("Failed to save meeting", err);
      setError("❌ Failed to save meeting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeeting = async () => {
    try {
      if (!editingEvent) return;
      const url = isRecruiter
        ? `${API_URL}/recruiter/meetings/${editingEvent.id}`
        : `${API_URL}/api/meetings/${editingEvent.id}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpenModal(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      console.error("Failed to delete meeting", err);
      setError("❌ Failed to delete meeting.");
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredEvents);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, "schedule.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableData = filteredEvents.map((e) => [
      e.title,
      e.date || e.start.split("T")[0],
      e.start.split("T")[1],
      e.end.split("T")[1],
      e.recruiter
    ]);
    doc.text("Event Schedule", 14, 16);
    doc.autoTable({
      head: [["Title", "Date", "Start", "End", "Recruiter"]],
      body: tableData,
      startY: 20
    });
    doc.save("schedule.pdf");
  };

  // Get the timezone from localStorage (default to UTC)
  const timezone = localStorage.getItem("timezone") ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Master Calendar
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          gap: 2,
          alignItems: "center"
        }}
      >
        <FormControl fullWidth>
          <InputLabel id="recruiter-select-label">
            Filter by Recruiter
          </InputLabel>
          <Select
            labelId="recruiter-select-label"
            value={selectedRecruiter}
            onChange={(e) => setSelectedRecruiter(e.target.value)}
            label="Recruiter"
          >
            <MenuItem value="all">All Recruiters</MenuItem>
            {recruiters.map((r) => (
              <MenuItem key={r.id} value={r.name}>
                {r.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="Add Meeting">
          <IconButton
            color="primary"
            onClick={() => {
              setOpenModal(true);
              resetForm();
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export to Excel">
          <IconButton color="success" onClick={exportToExcel}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export to PDF">
          <IconButton color="secondary" onClick={exportToPDF}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Paper>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={filteredEvents.map((e) => {
          const localStart = moment.utc(e.start).tz(timezone).toDate();
          const localEnd = moment.utc(e.end).tz(timezone).toDate();
          return {
            id: e.id,
            title: e.title,
            start: localStart,
            end: localEnd,
            backgroundColor: e.type === "leave" ? "#f44336" : "#3f51b5",
            extendedProps: e,
          };
        })}
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        }}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }}
        eventClick={(info) => {
          const { extendedProps } = info.event;
          const recruiterTimezone = localStorage.getItem("timezone") || "UTC";
          const startMoment = moment.utc(extendedProps.start).tz(recruiterTimezone);
          const endMoment = moment.utc(extendedProps.end).tz(recruiterTimezone);
          const startLocal = startMoment.format("HH:mm");
          const endLocal = endMoment.format("HH:mm");
          const dateLocal = startMoment.format("YYYY-MM-DD");
          setForm({
            title: extendedProps.title,
            date: dateLocal,
            start: startLocal,
            end: endLocal,
            recruiter_id: extendedProps.recruiter_id,
            location: extendedProps.location,
            invite_link: extendedProps.meeting_link,
            description: extendedProps.description || "",
            attendees: extendedProps.attendees || [],
            candidate_name: extendedProps.candidate_name || "",
            candidate_email: extendedProps.candidate_email || ""
          });
          setEditingEvent({ id: extendedProps.id });
          setOpenModal(true);
        }}
      />
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            width: 500,
            mx: "auto",
            mt: "10%"
          }}
        >
          <Typography variant="h6">
            {editingEvent ? "Edit" : "Create"} Meeting
          </Typography>
          <Stack spacing={2} mt={2}>
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
              fullWidth
              multiline
              rows={2}
            />
            {/* Manual Candidate fields; these are auto‑filled via attendees selection */}
            <TextField
              name="candidate_name"
              label="Candidate Name"
              value={form.candidate_name || ""}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              name="candidate_email"
              label="Candidate Email (comma separated)"
              value={form.candidate_email || ""}
              onChange={handleFormChange}
              fullWidth
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
            <Grid container spacing={2}>
              <Grid item xs={6}>
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
              </Grid>
              <Grid item xs={6}>
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
              </Grid>
            </Grid>
            <FormControl fullWidth>
              <InputLabel id="recruiter-select-label">Recruiter</InputLabel>
              <Select
                labelId="recruiter-select-label"
                name="recruiter_id"
                value={form.recruiter_id}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setForm((prev) => ({ ...prev, recruiter_id: selectedId }));
                  const selectedRecruiter = recruiters.find((r) => r.id === selectedId);
                  if (selectedRecruiter) {
                    setForm((prev) => ({
                      ...prev,
                      candidate_name: selectedRecruiter.name,
                      candidate_email: selectedRecruiter.email,
                    }));
                  }
                }}
                label="Recruiter"
              >
                <MenuItem value="all">All Recruiters</MenuItem>
                {recruiters.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
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
            <FormControl fullWidth>
              <InputLabel>Select Attendees</InputLabel>
              <Select
                multiple
                value={form.attendees.map((a) => a.email)}
                onChange={handleAttendeesChange}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {form.attendees.map((a) => (
                      <Chip key={a.email} label={a.name} />
                    ))}
                  </Box>
                )}
              >
                {recruiters.map((r) => (
                  <MenuItem key={r.id} value={r.email}>
                    <Checkbox checked={form.attendees.some((a) => a.email === r.email)} />
                    <ListItemText primary={r.name} secondary={r.email} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {editingEvent && (
                <Button color="error" onClick={handleDeleteMeeting}>
                  Delete
                </Button>
              )}
              <Button
                onClick={() => {
                  setOpenModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveMeeting}
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? "Sending..." : "Send"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default MasterCalendar;
