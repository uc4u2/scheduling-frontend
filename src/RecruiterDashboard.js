// src/RecruiterDashboard.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Paper,
} from "@mui/material";
import axios from "axios";
import RecurringAvailabilityForm from "./RecurringAvailabilityForm";
import InteractiveCalendar from "./InteractiveCalendar";

const RecruiterDashboard = ({ token }) => {
  // Environment variable for API URL
  const API_URL = process.env.REACT_APP_API_URL || "https://scheduling-application.onrender.com";

  // Availability form states
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [dailyDuration, setDailyDuration] = useState("60");

  // Invitation form states
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  // Global states
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [slots, setSlots] = useState([]);
  const [recruiterProfile, setRecruiterProfile] = useState(null);

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditSlot, setCurrentEditSlot] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  // Drag-and-drop pending update state
  const [pendingSlotUpdate, setPendingSlotUpdate] = useState(null);

  // Fetch recruiter profile
  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiterProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // Fetch availability slots (with booking details)
  const fetchSlots = async () => {
    try {
      const response = await axios.get(`${API_URL}/my-availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSlots(response.data.available_slots);
    } catch (err) {
      setError("Failed to fetch availability.");
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchSlots();
    }
  }, [token]);

  // One-Time Availability Submission
  const handleSubmitOneTime = async () => {
    if (!date || !startTime || !endTime) {
      setError("All fields are required.");
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/set-availability`,
        { date, start_time: startTime, end_time: endTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setError("");
      setDate("");
      setStartTime("");
      setEndTime("");
      fetchSlots();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to set availability.");
    }
  };

  // Daily Availability Submission (Auto-Split Slots)
  const handleSubmitDailyAvailability = async () => {
    if (!date || !startTime || !endTime || !dailyDuration) {
      setError("All fields (date, start time, end time, duration) are required.");
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/set-daily-availability`,
        { date, start_time: startTime, end_time: endTime, duration: dailyDuration },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setError("");
      setDate("");
      setStartTime("");
      setEndTime("");
      fetchSlots();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to set daily availability.");
    }
  };

  // Handle candidate invitation sending
  const handleSendInvitation = async () => {
    if (!candidateName || !candidateEmail) {
      setError("Candidate name and email are required for invitation.");
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/send-invitation`,
        { candidate_name: candidateName, candidate_email: candidateEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteMessage(response.data.message);
      setError("");
      setCandidateName("");
      setCandidateEmail("");
    } catch (err) {
      console.error("Error sending invitation:", err);
      setError(err.response?.data?.error || "Failed to send invitation.");
    }
  };

  // Delete an unbooked slot
  const handleDelete = async (slotId) => {
    try {
      await axios.delete(`${API_URL}/delete-availability/${slotId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSlots();
    } catch (err) {
      console.error("Error deleting slot:", err);
      setError("Failed to delete slot.");
    }
  };

  // Cancel a booked slot using booking_id
  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.delete(`${API_URL}/cancel-booking/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Booking cancelled successfully.");
      setError("");
      fetchSlots();
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError(err.response?.data?.error || "Failed to cancel booking.");
    }
  };

  // Open edit dialog for unbooked slot
  const handleEditClick = (slot) => {
    setCurrentEditSlot(slot);
    setEditDate(slot.date);
    setEditStartTime(slot.start_time);
    setEditEndTime(slot.end_time);
    setEditDialogOpen(true);
  };

  // Submit slot edits from dialog
  const handleEditSubmit = async () => {
    try {
      await axios.put(
        `${API_URL}/update-availability/${currentEditSlot.id}`,
        { date: editDate, start_time: editStartTime, end_time: editEndTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditDialogOpen(false);
      setMessage("Slot updated successfully.");
      setError("");
      fetchSlots();
    } catch (err) {
      console.error("Error updating slot:", err);
      setError(err.response?.data?.error || "Failed to update slot.");
    }
  };

  // Drag-and-drop callback from InteractiveCalendar
  const handleSlotDrop = (slotId, newDate, newStartTime, newEndTime) => {
    setPendingSlotUpdate({ slotId, newDate, newStartTime, newEndTime });
  };

  // Save pending slot update when "Save Changes" is clicked
  const handleSaveSlotUpdate = async () => {
    if (!pendingSlotUpdate) return;
    const { slotId, newDate, newStartTime, newEndTime } = pendingSlotUpdate;
    try {
      await axios.put(
        `${API_URL}/update-availability/${slotId}`,
        { date: newDate, start_time: newStartTime, end_time: newEndTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Slot updated via drag and drop.");
      setError("");
      setPendingSlotUpdate(null);
      fetchSlots();
    } catch (err) {
      console.error("Error updating slot after drag and drop:", err);
      setError(err.response?.data?.error || "Failed to update slot after drag and drop.");
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f7f9fc", minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: "#333" }}>
        Recruiter Dashboard
      </Typography>

      <Grid container spacing={2}>
        {/* Left Column: Forms */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }} elevation={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Send Candidate Invitation
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {inviteMessage && <Alert severity="success" sx={{ mb: 2 }}>{inviteMessage}</Alert>}
            <TextField
              label="Candidate Name"
              fullWidth
              margin="normal"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
            />
            <TextField
              label="Candidate Email"
              fullWidth
              margin="normal"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
            />
            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSendInvitation}>
              Send Invitation
            </Button>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }} elevation={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Set One-Time Availability
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Start Time"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="End Time"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </Grid>
            </Grid>
            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSubmitOneTime}>
              Set Availability
            </Button>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }} elevation={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Set Daily Availability (Auto-Split Slots)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Start Time"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="End Time"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Slot Duration (minutes)"
                  select
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={dailyDuration}
                  onChange={(e) => setDailyDuration(e.target.value)}
                >
                  <MenuItem value="15">15 minutes</MenuItem>
                  <MenuItem value="30">30 minutes</MenuItem>
                  <MenuItem value="45">45 minutes</MenuItem>
                  <MenuItem value="60">1 hour</MenuItem>
                  <MenuItem value="120">2 hours</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSubmitDailyAvailability}>
              Set Daily Availability
            </Button>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }} elevation={3}>
            <RecurringAvailabilityForm token={token} onSuccess={fetchSlots} />
          </Paper>
        </Grid>

        {/* Right Column: Interactive Calendar */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }} elevation={3}>
            <Typography variant="h6" gutterBottom>
              Interactive Calendar
            </Typography>
            <InteractiveCalendar token={token} onSlotDrop={handleSlotDrop} />
            {pendingSlotUpdate && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info">
                  You have unsaved changes for slot ID {pendingSlotUpdate.slotId}.{" "}
                  <Button variant="contained" onClick={handleSaveSlotUpdate} sx={{ ml: 2 }}>
                    Save Changes
                  </Button>
                </Alert>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Availability Slots Display (Full Width) */}
      <Paper sx={{ p: 3, mt: 3 }} elevation={3}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Your Availability Slots
        </Typography>
        <Grid container spacing={2}>
          {slots.length > 0 ? (
            slots.map((slot) => (
              <Grid item xs={12} sm={6} key={slot.id}>
                <Box sx={{ border: "1px solid #ddd", p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1">Date: {slot.date}</Typography>
                  <Typography variant="body2">Start: {slot.start_time}</Typography>
                  <Typography variant="body2">End: {slot.end_time}</Typography>
                  {slot.booked ? (
                    <Box sx={{ mt: 1 }}>
                      <Alert severity="error">Booked</Alert>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Candidate: {slot.candidate_name} ({slot.candidate_email})
                      </Typography>
                      {slot.candidate_position && (
                        <Typography variant="body2">
                          Position: {slot.candidate_position}
                        </Typography>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        sx={{ mt: 1 }}
                        onClick={() => handleCancelBooking(slot.booking_id || slot.id)}
                      >
                        Cancel Booking
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                      <Button variant="outlined" size="small" onClick={() => handleEditClick(slot)}>
                        Edit
                      </Button>
                      <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(slot.id)}>
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>
            ))
          ) : (
            <Typography>No available slots.</Typography>
          )}
        </Grid>
      </Paper>

      {/* Edit Availability Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Availability</DialogTitle>
        <DialogContent>
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />
          <TextField
            label="Start Time"
            type="time"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={editStartTime}
            onChange={(e) => setEditStartTime(e.target.value)}
          />
          <TextField
            label="End Time"
            type="time"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={editEndTime}
            onChange={(e) => setEditEndTime(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecruiterDashboard;
