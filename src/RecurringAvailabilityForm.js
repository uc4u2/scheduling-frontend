// src/RecurringAvailabilityForm.js
import React, { useState } from 'react';
import { TextField, Button, Box, Alert, Typography } from '@mui/material';
import axios from 'axios';

const RecurringAvailabilityForm = ({ token, onSuccess }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!startDate || !endDate || !startTime || !endTime) {
      setError('All fields are required.');
      return;
    }
    try {
      const response = await axios.post(
        "https://scheduling-application.onrender.com/set-recurring-availability",
        { start_date: startDate, end_date: endDate, start_time: startTime, end_time: endTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setError('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set recurring availability.');
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Set Recurring Availability
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <TextField
        label="Start Date"
        type="date"
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <TextField
        label="End Date"
        type="date"
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
      <TextField
        label="Start Time"
        type="time"
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />
      <TextField
        label="End Time"
        type="time"
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
      />
      <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>
        Set Recurring Availability
      </Button>
    </Box>
  );
};

export default RecurringAvailabilityForm;
