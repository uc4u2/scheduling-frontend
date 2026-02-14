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
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  Checkbox,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../../utils/api";

const Meetings = ({ token }) => {
  const [meetings, setMeetings] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
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
    recruiter_ids: [],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDepartments();
    fetchRecruiters();
  }, [includeArchived, token]);

  useEffect(() => {
    fetchRecruiters();
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedRecruiter) {
      fetchMeetings(selectedRecruiter);
    }
  }, [selectedRecruiter]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get(`/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(res.data.departments || res.data || []);
    } catch (err) {
      setError("Failed to fetch departments");
    }
  };

  const fetchRecruiters = async () => {
    try {
      const res = await api.get(`/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...(includeArchived ? { include_archived: 1 } : {}),
          ...(selectedDepartment && selectedDepartment !== "all"
            ? { department_id: selectedDepartment }
            : {}),
        },
      });
      const list = res.data.recruiters || [];
      setRecruiters(list);
      if (list.length > 0) {
        const firstId = list[0].id;
        setSelectedRecruiter(firstId);
        setForm((prev) => ({
          ...prev,
          recruiter_ids: prev.recruiter_ids?.length ? prev.recruiter_ids : [firstId],
        }));
      } else {
        setSelectedRecruiter("");
      }
    } catch (err) {
      setError("Failed to fetch recruiters");
    }
  };

  const fetchMeetings = async (recruiterId) => {
    try {
      const res = await api.get(`/meetings/${recruiterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rows = Array.isArray(res.data) ? res.data : (res.data.meetings || []);
      const data = rows.map((m) => ({
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
      recruiter_ids: [],
    });
  };

  const handleCreateMeeting = async () => {
    try {
      if (!form.recruiter_ids || form.recruiter_ids.length === 0) {
        setError("Please select at least one employee");
        return;
      }
      const payload = {
        ...form,
        recruiter_ids: form.recruiter_ids,
        start: form.start_time,
        end: form.end_time,
        attendees: form.attendees.filter((a) => a.email), // Only valid entries
      };
      await api.post(`/manager/add-meeting`, payload, {
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
      await api.delete(`/api/meetings/${id}`, {
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
        <InputLabel>Department</InputLabel>
        <Select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          label="Department"
        >
          <MenuItem value="all">All departments</MenuItem>
          {departments.map((d) => (
            <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Employee</InputLabel>
        <Select
          value={selectedRecruiter}
          onChange={(e) => setSelectedRecruiter(e.target.value)}
          label="Select Employee"
        >
          {recruiters.map((r) => (
            <MenuItem key={r.id} value={r.id}>{r.name || `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.email}</MenuItem>
          ))}
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
        sx={{ mb: 2 }}
      />

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
              <FormControl fullWidth>
                <InputLabel>Employees</InputLabel>
                <Select
                  multiple
                  label="Employees"
                  value={form.recruiter_ids}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      recruiter_ids: e.target.value,
                    }))
                  }
                  renderValue={(selected) =>
                    recruiters
                      .filter((r) => selected.includes(r.id))
                      .map((r) => r.name || `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.email)
                      .join(", ")
                  }
                >
                  {recruiters.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name || `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
