import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Typography,
  Grid,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Meetings = ({ token }) => {
  const [meetings, setMeetings] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    invite_link: "",
    attendees: [{ name: "", email: "" }],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecruiters();
  }, []);

  useEffect(() => {
    if (selectedRecruiter) {
      fetchMeetings(selectedRecruiter);
    }
  }, [selectedRecruiter]);

  const fetchRecruiters = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiters(res.data.recruiters);
      if (res.data.recruiters.length > 0) {
        setSelectedRecruiter(res.data.recruiters[0].id);
      }
    } catch (err) {
      setError("Failed to fetch recruiters");
    }
  };

  const fetchMeetings = async (recruiterId) => {
    try {
      const res = await axios.get(`${API_URL}/api/meetings/${recruiterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.meetings.map((m) => ({
        id: m.id,
        title: m.title,
        start: `${m.date}T${m.start_time}`,
        end: `${m.date}T${m.end_time}`,
        extendedProps: { ...m },
      }));
      setMeetings(data);
    } catch (err) {
      setError("Failed to load meetings");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttendeeChange = (index, field, value) => {
    const updated = [...form.attendees];
    updated[index][field] = value;
    setForm((prev) => ({ ...prev, attendees: updated }));
  };

  const addAttendee = () => {
    setForm((prev) => ({
      ...prev,
      attendees: [...prev.attendees, { name: "", email: "" }],
    }));
  };

  const removeAttendee = (index) => {
    const updated = [...form.attendees];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, attendees: updated }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      date: "",
      start_time: "",
      end_time: "",
      location: "",
      invite_link: "",
      attendees: [{ name: "", email: "" }],
    });
  };

  const handleCreateMeeting = async () => {
    try {
      const payload = {
        ...form,
        recruiter_id: selectedRecruiter,
        attendees: form.attendees.filter((a) => a.email), // Only valid entries
      };
      await axios.post(`${API_URL}/manager/add-meeting`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenModal(false);
      resetForm();
      fetchMeetings(selectedRecruiter);
    } catch (err) {
      console.error("Create meeting error:", err);
      setError("Failed to create meeting");
    }
  };

  const handleDeleteMeeting = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/meetings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMeetings(selectedRecruiter);
    } catch (err) {
      setError("Failed to delete meeting");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">Team Meetings</Typography>
        <Button variant="contained" onClick={() => setOpenModal(true)}>
          + Create Meeting
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Employee</InputLabel>
        <Select
          value={selectedRecruiter}
          onChange={(e) => setSelectedRecruiter(e.target.value)}
          label="Select Employee"
        >
          {recruiters.map((r) => (
            <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={meetings}
        height="80vh"
        headerToolbar={{
          start: "prev,next today",
          center: "title",
          end: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        eventContent={(arg) => {
          const { title, id } = arg.event;
          return (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{title}</Typography>
              <IconButton size="small" onClick={() => handleDeleteMeeting(id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        }}
      />

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Schedule New Meeting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField label="Title" name="title" fullWidth value={form.title} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" name="description" fullWidth multiline rows={2} value={form.description} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField type="date" label="Date" name="date" fullWidth InputLabelProps={{ shrink: true }} value={form.date} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={3}>
              <TextField type="time" label="Start Time" name="start_time" fullWidth InputLabelProps={{ shrink: true }} value={form.start_time} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={3}>
              <TextField type="time" label="End Time" name="end_time" fullWidth InputLabelProps={{ shrink: true }} value={form.end_time} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Location" name="location" fullWidth value={form.location} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Invite Link" name="invite_link" fullWidth value={form.invite_link} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Attendees</Typography>
              {form.attendees.map((a, idx) => (
                <Grid container spacing={1} key={idx} alignItems="center" sx={{ mb: 1 }}>
                  <Grid item xs={5}>
                    <TextField
                      label="Name"
                      value={a.name}
                      onChange={(e) => handleAttendeeChange(idx, "name", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Email"
                      value={a.email}
                      onChange={(e) => handleAttendeeChange(idx, "email", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton onClick={() => removeAttendee(idx)} disabled={form.attendees.length === 1}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button onClick={addAttendee} variant="outlined">+ Add Attendee</Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateMeeting}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Meetings;
