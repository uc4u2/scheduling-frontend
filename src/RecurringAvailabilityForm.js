// src/RecurringAvailabilityForm.js
import React, { useMemo, useState } from "react";
import {
  TextField,
  Button,
  Box,
  Alert,
  Typography,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  Checkbox,
  Grid,
  Tabs,
  Tab
} from "@mui/material";
import api from "./utils/api";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RecurringAvailabilityForm = ({ token, onSuccess }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [breakStartTime, setBreakStartTime] = useState("");
  const [breakEndTime, setBreakEndTime] = useState("");
  const [coolingTime, setCoolingTime] = useState("0");
  const [recurringDays, setRecurringDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [repeatMode, setRepeatMode] = useState("weeks"); // "weeks" | "until"
  const [repeatWeeks, setRepeatWeeks] = useState(2);
  const [repeatUntil, setRepeatUntil] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const repeatUntilDate = repeatMode === "until" ? repeatUntil : endDate;

  const generateRecurringDatesFlexible = (baseDate, days, opts = { mode: "weeks", repeatWeeks: 2, endDate: "" }) => {
    if (!baseDate) return [];
    const result = [];
    const base = new Date(baseDate);
    if (Number.isNaN(base.getTime())) return [];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const selectedDays =
      Array.isArray(days) && days.length > 0
        ? new Set(days)
        : new Set([dayNames[base.getDay()]]);

    const maybePush = (d) => {
      if (selectedDays.has(dayNames[d.getDay()])) {
        result.push(d.toISOString().slice(0, 10));
      }
    };

    if (opts.mode === "until" && opts.endDate) {
      const until = new Date(opts.endDate);
      if (Number.isNaN(until.getTime())) return [];
      const d = new Date(base);
      for (; d <= until; d.setDate(d.getDate() + 1)) {
        maybePush(new Date(d));
      }
    } else {
      const weeks = Math.max(1, Math.min(52, parseInt(opts.repeatWeeks || 2, 10)));
      const spanDays = weeks * 7;
      const d = new Date(base);
      for (let i = 0; i < spanDays; i++) {
        maybePush(new Date(d));
        d.setDate(d.getDate() + 1);
      }
    }

    return Array.from(new Set(result));
  };

  const selectedDates = useMemo(
    () =>
      generateRecurringDatesFlexible(startDate, recurringDays, {
        mode: repeatMode,
        repeatWeeks,
        endDate: repeatMode === "until" ? repeatUntilDate : "",
      }),
    [startDate, recurringDays, repeatMode, repeatWeeks, repeatUntilDate]
  );

  const handleSubmit = async () => {
    if (!startDate || !startTime || !endTime || !duration) {
      setError("Start date, time, and duration are required.");
      return;
    }
    if (repeatMode === "until" && !repeatUntilDate) {
      setError("End date is required for “repeat until date”.");
      return;
    }

    const datesToCreate = selectedDates.length ? selectedDates : [startDate];

    try {
      for (const date of datesToCreate) {
        const payload = {
          start_date: date,
          end_date: date,
          start_time: startTime,
          end_time: endTime,
          duration: parseInt(duration, 10),
          cooling_time: parseInt(coolingTime, 10)
        };

        if (breakStartTime && breakEndTime) {
          payload.break_start_time = breakStartTime;
          payload.break_end_time = breakEndTime;
        }

        await api.post(
          `/api/set-recurring-availability`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setMessage(`${datesToCreate.length} day(s) saved.`);
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

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Select Days
        </Typography>
        <Grid container>
          {dayLabels.map((day) => (
            <Grid item key={day} sx={{ pr: 1 }}>
              <Checkbox
                value={day}
                checked={recurringDays.includes(day)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const value = e.target.value;
                  setRecurringDays((p) =>
                    checked ? [...p, value] : p.filter((d) => d !== value)
                  );
                }}
                size="small"
              />
              <Typography variant="caption">{day}</Typography>
            </Grid>
          ))}
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Tip: If you don’t pick any days, we’ll default to the same weekday as your start date.
        </Typography>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Repeat Options
        </Typography>
        <Tabs
          value={repeatMode}
          onChange={(_, v) => v && setRepeatMode(v)}
          sx={{ minHeight: 32, mb: 1 }}
        >
          <Tab value="weeks" label="Repeat for N weeks" sx={{ minHeight: 32 }} />
          <Tab value="until" label="Repeat until date" sx={{ minHeight: 32 }} />
        </Tabs>

        {repeatMode === "weeks" && (
          <TextField
            label="Number of weeks"
            type="number"
            fullWidth
            margin="normal"
            inputProps={{ min: 1, max: 52 }}
            value={repeatWeeks}
            onChange={(e) =>
              setRepeatWeeks(Math.max(1, Math.min(52, parseInt(e.target.value || "1", 10))))
            }
          />
        )}

        {repeatMode === "until" && (
          <TextField
            label="End Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={repeatUntil}
            onChange={(e) => setRepeatUntil(e.target.value)}
          />
        )}

        <TextField
          label="End Date (optional)"
          type="date"
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          helperText="Optional: if you leave this blank, repeat options above control the range."
        />
      </Box>

      <TextField label="Start Time" type="time" fullWidth margin="normal" InputLabelProps={{ shrink: true }}
        value={startTime} onChange={(e) => setStartTime(e.target.value)} />

      <TextField label="End Time" type="time" fullWidth margin="normal" InputLabelProps={{ shrink: true }}
        value={endTime} onChange={(e) => setEndTime(e.target.value)} />

      <TextField
        label="Slot Duration (minutes)"
        type="number"
        fullWidth
        margin="normal"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: 5, max: 480 }}
      />

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
