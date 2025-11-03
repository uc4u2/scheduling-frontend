// src/RecurringAvailabilityForm.js
import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Alert,
  Typography,
  MenuItem,
  InputLabel,
  FormControl,
  Select
} from "@mui/material";
import axios from "axios";

const RecurringAvailabilityForm = ({ token, onSuccess }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [breakStartTime, setBreakStartTime] = useState("");
  const [breakEndTime, setBreakEndTime] = useState("");
  const [coolingTime, setCoolingTime] = useState("0");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!startDate || !endDate || !startTime || !endTime || !duration) {
      setError("Start/end date, time, and duration are required.");
      return;
    }

    const payload = {
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
      duration: parseInt(duration),
      cooling_time: parseInt(coolingTime)
    };

    if (breakStartTime && breakEndTime) {
      payload.break_start_time = breakStartTime;
      payload.break_end_time = breakEndTime;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/set-recurring-availability",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setError("");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to set recurring availability.");
      setMessage("");
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Set Recurring Availability
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <TextField label="Start Date" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }}
        value={startDate} onChange={(e) => setStartDate(e.target.value)} />

      <TextField label="End Date" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }}
        value={endDate} onChange={(e) => setEndDate(e.target.value)} />

      <TextField label="Start Time" type="time" fullWidth margin="normal" InputLabelProps={{ shrink: true }}
        value={startTime} onChange={(e) => setStartTime(e.target.value)} />

      <TextField label="End Time" type="time" fullWidth margin="normal" InputLabelProps={{ shrink: true }}
        value={endTime} onChange={(e) => setEndTime(e.target.value)} />

      <TextField label="Slot Duration (minutes)" select fullWidth margin="normal" value={duration}
        onChange={(e) => setDuration(e.target.value)} InputLabelProps={{ shrink: true }}>
        <MenuItem value="15">15 minutes</MenuItem>
        <MenuItem value="30">30 minutes</MenuItem>
        <MenuItem value="45">45 minutes</MenuItem>
        <MenuItem value="60">1 hour</MenuItem>
        <MenuItem value="90">1.5 hours</MenuItem>
        <MenuItem value="120">2 hours</MenuItem>
      </TextField>

      <TextField label="Break Start Time (optional)" type="time" fullWidth margin="normal" InputLabelProps={{ shrink: true }}
        value={breakStartTime} onChange={(e) => setBreakStartTime(e.target.value)} />

      <TextField label="Break End Time (optional)" type="time" fullWidth margin="normal" InputLabelProps={{ shrink: true }}
        value={breakEndTime} onChange={(e) => setBreakEndTime(e.target.value)} />

      {/* Cooling Time */}
      <TextField
  label="Cooling Time Between Slots (optional)"
  select
  fullWidth
  margin="normal"
  value={coolingTime}
  onChange={(e) => setCoolingTime(e.target.value)}
  InputLabelProps={{ shrink: true }}
>
  <MenuItem value="0">No Cooling Time</MenuItem>
  <MenuItem value="5">5 minutes</MenuItem>
  <MenuItem value="10">10 minutes</MenuItem>
  <MenuItem value="15">15 minutes</MenuItem>
  <MenuItem value="20">20 minutes</MenuItem>
  <MenuItem value="30">30 minutes</MenuItem>
</TextField>


      <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>
        Set Recurring Availability
      </Button>
    </Box>
  );
};

export default RecurringAvailabilityForm;
