import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { smartShifts } from "../../utils/api";

const DOW = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const DEFAULT_RULE = {
  day_of_week: 1,
  start_time: "09:00",
  end_time: "17:00",
  timezone: "",
  location_id: "",
  status: "active",
};

const DEFAULT_EXCEPTION = {
  date: "",
  start_time: "",
  end_time: "",
  exception_type: "unavailable_all_day",
  timezone: "",
  note: "",
};

const DEFAULT_PREF = {
  max_hours_per_week: "",
  earliest_start: "",
  latest_end: "",
  min_hours_between_shifts: "",
  allow_split_shifts: false,
  preferred_days: [],
  preferred_locations: "",
};

const SmartShiftAvailabilityTab = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [data, setData] = useState({ rules: [], exceptions: [], preference: null });
  const [ruleForm, setRuleForm] = useState(DEFAULT_RULE);
  const [exceptionForm, setExceptionForm] = useState(DEFAULT_EXCEPTION);
  const [prefForm, setPrefForm] = useState(DEFAULT_PREF);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: payload } = await smartShifts.recruiter.getAvailability();
      setData({
        rules: Array.isArray(payload?.rules) ? payload.rules : [],
        exceptions: Array.isArray(payload?.exceptions) ? payload.exceptions : [],
        preference: payload?.preference || null,
      });
      const pref = payload?.preference || null;
      setPrefForm({
        max_hours_per_week: pref?.max_hours_per_week ?? "",
        earliest_start: pref?.earliest_start ?? "",
        latest_end: pref?.latest_end ?? "",
        min_hours_between_shifts: pref?.min_hours_between_shifts ?? "",
        allow_split_shifts: Boolean(pref?.allow_split_shifts),
        preferred_days: Array.isArray(pref?.preferred_days) ? pref.preferred_days : [],
        preferred_locations: Array.isArray(pref?.preferred_locations)
          ? pref.preferred_locations.join(",")
          : "",
      });
      if (!ruleForm.timezone) {
        setRuleForm((prev) => ({
          ...prev,
          timezone: payload?.preference?.timezone || localStorage.getItem("timezone") || "",
        }));
      }
      if (!exceptionForm.timezone) {
        setExceptionForm((prev) => ({
          ...prev,
          timezone: payload?.preference?.timezone || localStorage.getItem("timezone") || "",
        }));
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load smart shift availability.");
    } finally {
      setLoading(false);
    }
  }, [ruleForm.timezone, exceptionForm.timezone]);

  useEffect(() => {
    load();
  }, [load]);

  const ruleRows = useMemo(() => {
    return [...data.rules].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return String(a.start_time || "").localeCompare(String(b.start_time || ""));
    });
  }, [data.rules]);

  const handleCreateRule = async () => {
    setError("");
    setSuccess("");
    try {
      await smartShifts.recruiter.createRule({
        day_of_week: Number(ruleForm.day_of_week),
        start_time: ruleForm.start_time,
        end_time: ruleForm.end_time,
        timezone: ruleForm.timezone || undefined,
        location_id: ruleForm.location_id ? Number(ruleForm.location_id) : null,
        status: ruleForm.status,
      });
      setRuleForm(DEFAULT_RULE);
      setSuccess("Recurring shift availability added.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to add recurring availability.");
    }
  };

  const handleDeleteRule = async (id) => {
    setError("");
    setSuccess("");
    try {
      await smartShifts.recruiter.deleteRule(id);
      setSuccess("Recurring rule deleted.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to delete rule.");
    }
  };

  const handleCreateException = async () => {
    setError("");
    setSuccess("");
    try {
      await smartShifts.recruiter.createException({
        date: exceptionForm.date,
        start_time: exceptionForm.start_time || null,
        end_time: exceptionForm.end_time || null,
        exception_type: exceptionForm.exception_type,
        timezone: exceptionForm.timezone || undefined,
        note: exceptionForm.note || undefined,
      });
      setExceptionForm(DEFAULT_EXCEPTION);
      setSuccess("Exception added.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to add exception.");
    }
  };

  const handleDeleteException = async (id) => {
    setError("");
    setSuccess("");
    try {
      await smartShifts.recruiter.deleteException(id);
      setSuccess("Exception deleted.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to delete exception.");
    }
  };

  const handleSavePreference = async () => {
    setError("");
    setSuccess("");
    try {
      await smartShifts.recruiter.putPreference({
        max_hours_per_week: prefForm.max_hours_per_week
          ? Number(prefForm.max_hours_per_week)
          : null,
        earliest_start: prefForm.earliest_start || null,
        latest_end: prefForm.latest_end || null,
        min_hours_between_shifts: prefForm.min_hours_between_shifts
          ? Number(prefForm.min_hours_between_shifts)
          : null,
        allow_split_shifts: Boolean(prefForm.allow_split_shifts),
        preferred_days: prefForm.preferred_days,
        preferred_locations: prefForm.preferred_locations
          ? prefForm.preferred_locations
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
              .map((v) => Number(v))
              .filter((v) => Number.isFinite(v))
          : [],
      });
      setSuccess("Preferences saved.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to save preferences.");
    }
  };

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="h6" fontWeight={700}>
          Shift Availability
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          This tab controls Smart Shift assignment only. It does not change service booking slots.
        </Typography>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}
      {loading ? <Alert severity="info">Loading…</Alert> : null}

      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Add recurring rule
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Day</InputLabel>
            <Select
              label="Day"
              value={ruleForm.day_of_week}
              onChange={(e) => setRuleForm((p) => ({ ...p, day_of_week: e.target.value }))}
            >
              {DOW.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Start"
            type="time"
            InputLabelProps={{ shrink: true }}
            value={ruleForm.start_time}
            onChange={(e) => setRuleForm((p) => ({ ...p, start_time: e.target.value }))}
          />
          <TextField
            size="small"
            label="End"
            type="time"
            InputLabelProps={{ shrink: true }}
            value={ruleForm.end_time}
            onChange={(e) => setRuleForm((p) => ({ ...p, end_time: e.target.value }))}
          />
          <TextField
            size="small"
            label="Timezone"
            value={ruleForm.timezone}
            onChange={(e) => setRuleForm((p) => ({ ...p, timezone: e.target.value }))}
            placeholder="America/Toronto"
          />
          <TextField
            size="small"
            label="Location ID"
            value={ruleForm.location_id}
            onChange={(e) => setRuleForm((p) => ({ ...p, location_id: e.target.value }))}
          />
          <Button variant="contained" onClick={handleCreateRule}>
            Add Rule
          </Button>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Current recurring rules
          </Typography>
          <Stack spacing={1}>
            {ruleRows.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recurring rules yet.
              </Typography>
            ) : (
              ruleRows.map((r) => (
                <Stack
                  key={r.id}
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                >
                  <Typography variant="body2">
                    {DOW.find((d) => d.value === r.day_of_week)?.label || r.day_of_week} • {r.start_time} - {r.end_time}
                    {r.timezone ? ` • ${r.timezone}` : ""}
                    {r.location_id ? ` • Location ${r.location_id}` : ""}
                  </Typography>
                  <Button color="error" size="small" onClick={() => handleDeleteRule(r.id)}>
                    Delete
                  </Button>
                </Stack>
              ))
            )}
          </Stack>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Add exception
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            size="small"
            label="Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={exceptionForm.date}
            onChange={(e) => setExceptionForm((p) => ({ ...p, date: e.target.value }))}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              value={exceptionForm.exception_type}
              onChange={(e) =>
                setExceptionForm((p) => ({ ...p, exception_type: e.target.value }))
              }
            >
              <MenuItem value="unavailable_all_day">Unavailable all day</MenuItem>
              <MenuItem value="unavailable_window">Unavailable window</MenuItem>
              <MenuItem value="available_window">Available window</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Start"
            type="time"
            InputLabelProps={{ shrink: true }}
            value={exceptionForm.start_time}
            onChange={(e) => setExceptionForm((p) => ({ ...p, start_time: e.target.value }))}
          />
          <TextField
            size="small"
            label="End"
            type="time"
            InputLabelProps={{ shrink: true }}
            value={exceptionForm.end_time}
            onChange={(e) => setExceptionForm((p) => ({ ...p, end_time: e.target.value }))}
          />
          <TextField
            size="small"
            label="Timezone"
            value={exceptionForm.timezone}
            onChange={(e) => setExceptionForm((p) => ({ ...p, timezone: e.target.value }))}
            placeholder="America/Toronto"
          />
          <Button variant="contained" onClick={handleCreateException}>
            Add Exception
          </Button>
        </Stack>
        <TextField
          size="small"
          fullWidth
          sx={{ mt: 1.5 }}
          label="Note"
          value={exceptionForm.note}
          onChange={(e) => setExceptionForm((p) => ({ ...p, note: e.target.value }))}
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Current exceptions
          </Typography>
          <Stack spacing={1}>
            {data.exceptions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No exceptions yet.
              </Typography>
            ) : (
              data.exceptions.map((ex) => (
                <Stack
                  key={ex.id}
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                >
                  <Typography variant="body2">
                    {ex.date} • {ex.exception_type}
                    {ex.start_time && ex.end_time ? ` • ${ex.start_time} - ${ex.end_time}` : ""}
                    {ex.timezone ? ` • ${ex.timezone}` : ""}
                  </Typography>
                  <Button color="error" size="small" onClick={() => handleDeleteException(ex.id)}>
                    Delete
                  </Button>
                </Stack>
              ))
            )}
          </Stack>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Scheduling preferences
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            size="small"
            label="Max hours/week"
            type="number"
            value={prefForm.max_hours_per_week}
            onChange={(e) => setPrefForm((p) => ({ ...p, max_hours_per_week: e.target.value }))}
          />
          <TextField
            size="small"
            label="Earliest start"
            type="time"
            InputLabelProps={{ shrink: true }}
            value={prefForm.earliest_start}
            onChange={(e) => setPrefForm((p) => ({ ...p, earliest_start: e.target.value }))}
          />
          <TextField
            size="small"
            label="Latest end"
            type="time"
            InputLabelProps={{ shrink: true }}
            value={prefForm.latest_end}
            onChange={(e) => setPrefForm((p) => ({ ...p, latest_end: e.target.value }))}
          />
          <TextField
            size="small"
            label="Min rest (hours)"
            type="number"
            value={prefForm.min_hours_between_shifts}
            onChange={(e) =>
              setPrefForm((p) => ({ ...p, min_hours_between_shifts: e.target.value }))
            }
          />
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Preferred days</InputLabel>
            <Select
              multiple
              label="Preferred days"
              value={prefForm.preferred_days}
              onChange={(e) => setPrefForm((p) => ({ ...p, preferred_days: e.target.value }))}
            >
              {DOW.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Preferred location IDs"
            helperText="Comma-separated, e.g. 1,2,3"
            value={prefForm.preferred_locations}
            onChange={(e) => setPrefForm((p) => ({ ...p, preferred_locations: e.target.value }))}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(prefForm.allow_split_shifts)}
                onChange={(e) =>
                  setPrefForm((p) => ({ ...p, allow_split_shifts: e.target.checked }))
                }
              />
            }
            label="Allow split shifts"
          />
          <Button variant="contained" onClick={handleSavePreference}>
            Save Preferences
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default SmartShiftAvailabilityTab;
