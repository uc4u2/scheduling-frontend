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
import { api, smartShifts } from "../../utils/api";

const DOW = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

const DEFAULT_RULE = {
  day_of_week: 0,
  start_time: "09:00",
  end_time: "17:00",
  timezone: "",
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
};

const detectTimezone = () => {
  try {
    return (
      localStorage.getItem("timezone") ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "America/Toronto"
    );
  } catch {
    return "America/Toronto";
  }
};

const SmartShiftAvailabilityTab = () => {
  const autoTimezone = useMemo(() => detectTimezone(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [data, setData] = useState({ rules: [], exceptions: [], preference: null });
  const [ruleForm, setRuleForm] = useState({ ...DEFAULT_RULE, timezone: autoTimezone });
  const [exceptionForm, setExceptionForm] = useState({ ...DEFAULT_EXCEPTION, timezone: autoTimezone });
  const [prefForm, setPrefForm] = useState(DEFAULT_PREF);
  const [departments, setDepartments] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const deptNameById = useMemo(() => {
    const m = new Map();
    departments.forEach((d) => m.set(Number(d.id), d.name || `Department #${d.id}`));
    return m;
  }, [departments]);

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
      });

      if (!ruleForm.timezone) {
        setRuleForm((prev) => ({ ...prev, timezone: autoTimezone }));
      }
      if (!exceptionForm.timezone) {
        setExceptionForm((prev) => ({ ...prev, timezone: autoTimezone }));
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load smart shift availability.");
    } finally {
      setLoading(false);
    }
  }, [ruleForm.timezone, exceptionForm.timezone, autoTimezone]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let mounted = true;
    const loadDepartments = async () => {
      try {
        const res = await api.get("/api/departments");
        const raw = res?.data?.departments || res?.data || [];
        if (mounted) setDepartments(Array.isArray(raw) ? raw : []);
      } catch {
        if (mounted) setDepartments([]);
      }
    };
    loadDepartments();
    return () => {
      mounted = false;
    };
  }, []);

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
        location_id: null,
        status: ruleForm.status,
      });
      setRuleForm({ ...DEFAULT_RULE, timezone: autoTimezone });
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
      setExceptionForm({ ...DEFAULT_EXCEPTION, timezone: autoTimezone });
      setSuccess("Exception added.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to add exception.");
    }
  };

  const applyRulePreset = async (preset) => {
    setError("");
    setSuccess("");
    try {
      const days =
        preset === "weekdays"
          ? [0, 1, 2, 3, 4]
          : preset === "weekends"
          ? [5, 6]
          : [0, 1, 2, 3, 4];
      const base =
        preset === "evening"
          ? { start_time: "13:00", end_time: "21:00" }
          : preset === "weekends"
          ? { start_time: "10:00", end_time: "18:00" }
          : { start_time: "09:00", end_time: "17:00" };
      const existing = new Set(
        (data.rules || [])
          .map((r) => `${Number(r.day_of_week)}|${String(r.start_time || "").slice(0, 5)}|${String(r.end_time || "").slice(0, 5)}|${String(r.status || "active").toLowerCase()}`)
      );
      const toCreate = days.filter(
        (day) =>
          !existing.has(
            `${Number(day)}|${base.start_time}|${base.end_time}|active`
          )
      );
      if (!toCreate.length) {
        setSuccess("Preset already exists.");
        return;
      }
      await Promise.all(
        toCreate.map((day_of_week) =>
          smartShifts.recruiter.createRule({
            day_of_week,
            start_time: base.start_time,
            end_time: base.end_time,
            timezone: autoTimezone,
            location_id: null,
            status: "active",
          })
        )
      );
      setSuccess("Preset applied.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || "Could not apply preset. Some rules may already exist.");
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
        max_hours_per_week: prefForm.max_hours_per_week ? Number(prefForm.max_hours_per_week) : null,
        earliest_start: prefForm.earliest_start || null,
        latest_end: prefForm.latest_end || null,
        min_hours_between_shifts: prefForm.min_hours_between_shifts
          ? Number(prefForm.min_hours_between_shifts)
          : null,
        allow_split_shifts: Boolean(prefForm.allow_split_shifts),
        preferred_days: prefForm.preferred_days,
        preferred_locations: [],
      });
      setSuccess("Preferences saved.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to save preferences.");
    }
  };

  return (
    <Stack
      spacing={1.5}
      sx={{
        "& .smart-shift-field": { width: "100%" },
        "& .MuiFormControl-root": { width: "100%" },
        "& .MuiTextField-root": { width: "100%" },
      }}
    >
      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="h6" fontWeight={700}>
          Shift Availability
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          This tab controls Smart Shift assignment only.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          It does not change service booking slots.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Timezone auto-detected: {autoTimezone}
        </Typography>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}
      {loading ? <Alert severity="info">Loading…</Alert> : null}

      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Add recurring rule
        </Typography>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" variant="outlined" onClick={() => applyRulePreset("weekdays")}>
              Weekdays 9-5
            </Button>
            <Button size="small" variant="outlined" onClick={() => applyRulePreset("evening")}>
              Evenings
            </Button>
            <Button size="small" variant="outlined" onClick={() => applyRulePreset("weekends")}>
              Weekends
            </Button>
            <Button size="small" onClick={() => setShowAdvanced((v) => !v)}>
              {showAdvanced ? "Hide advanced" : "Show advanced"}
            </Button>
          </Stack>
          <FormControl size="small" className="smart-shift-field">
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <TextField
              size="small"
              label="Start"
              type="time"
              className="smart-shift-field"
              InputLabelProps={{ shrink: true }}
              value={ruleForm.start_time}
              onChange={(e) => setRuleForm((p) => ({ ...p, start_time: e.target.value }))}
            />
            <TextField
              size="small"
              label="End"
              type="time"
              className="smart-shift-field"
              InputLabelProps={{ shrink: true }}
              value={ruleForm.end_time}
              onChange={(e) => setRuleForm((p) => ({ ...p, end_time: e.target.value }))}
            />
          </Stack>
          {showAdvanced ? (
            <TextField
              size="small"
              label="Timezone"
              className="smart-shift-field"
              value={ruleForm.timezone}
              onChange={(e) => setRuleForm((p) => ({ ...p, timezone: e.target.value }))}
              placeholder={autoTimezone}
            />
          ) : null}
          <Button variant="contained" onClick={handleCreateRule} fullWidth>
            Add Rule
          </Button>
        </Stack>

        <Box sx={{ mt: 1.5 }}>
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
                  spacing={0.75}
                  sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                >
                  <Typography variant="body2">
                    {DOW.find((d) => d.value === r.day_of_week)?.label || r.day_of_week} • {r.start_time} - {r.end_time}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.timezone || "—"}
                    {r.location_id
                      ? ` • ${deptNameById.get(Number(r.location_id)) || `Department ${r.location_id}`}`
                      : ""}
                  </Typography>
                  <Button color="error" size="small" onClick={() => handleDeleteRule(r.id)} sx={{ alignSelf: "flex-start" }}>
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
        <Stack spacing={1.25}>
          <TextField
            size="small"
            label="Date"
            type="date"
            className="smart-shift-field"
            InputLabelProps={{ shrink: true }}
            value={exceptionForm.date}
            onChange={(e) => setExceptionForm((p) => ({ ...p, date: e.target.value }))}
          />
          <FormControl size="small" className="smart-shift-field">
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              value={exceptionForm.exception_type}
              onChange={(e) => setExceptionForm((p) => ({ ...p, exception_type: e.target.value }))}
            >
              <MenuItem value="unavailable_all_day">Unavailable all day</MenuItem>
              <MenuItem value="unavailable_window">Unavailable window</MenuItem>
              <MenuItem value="available_window">Available window</MenuItem>
            </Select>
          </FormControl>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <TextField
              size="small"
              label="Start"
              type="time"
              className="smart-shift-field"
              InputLabelProps={{ shrink: true }}
              value={exceptionForm.start_time}
              onChange={(e) => setExceptionForm((p) => ({ ...p, start_time: e.target.value }))}
            />
            <TextField
              size="small"
              label="End"
              type="time"
              className="smart-shift-field"
              InputLabelProps={{ shrink: true }}
              value={exceptionForm.end_time}
              onChange={(e) => setExceptionForm((p) => ({ ...p, end_time: e.target.value }))}
            />
          </Stack>
          {showAdvanced ? (
            <TextField
              size="small"
              label="Timezone"
              className="smart-shift-field"
              value={exceptionForm.timezone}
              onChange={(e) => setExceptionForm((p) => ({ ...p, timezone: e.target.value }))}
              placeholder={autoTimezone}
            />
          ) : null}
          <TextField
            size="small"
            className="smart-shift-field"
            label="Note"
            value={exceptionForm.note}
            onChange={(e) => setExceptionForm((p) => ({ ...p, note: e.target.value }))}
          />
          <Button variant="contained" onClick={handleCreateException} fullWidth>
            Add Exception
          </Button>
        </Stack>

        <Box sx={{ mt: 1.5 }}>
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
                  spacing={0.75}
                  sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                >
                  <Typography variant="body2">
                    {ex.date} • {ex.exception_type}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ex.start_time && ex.end_time ? `${ex.start_time} - ${ex.end_time}` : "All day"}
                    {ex.timezone ? ` • ${ex.timezone}` : ""}
                  </Typography>
                  <Button color="error" size="small" onClick={() => handleDeleteException(ex.id)} sx={{ alignSelf: "flex-start" }}>
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
        <Stack spacing={1.25}>
          <TextField
            size="small"
            label="Max hours/week"
            type="number"
            className="smart-shift-field"
            value={prefForm.max_hours_per_week}
            onChange={(e) => setPrefForm((p) => ({ ...p, max_hours_per_week: e.target.value }))}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <TextField
              size="small"
              label="Earliest start"
              type="time"
              className="smart-shift-field"
              InputLabelProps={{ shrink: true }}
              value={prefForm.earliest_start}
              onChange={(e) => setPrefForm((p) => ({ ...p, earliest_start: e.target.value }))}
            />
            <TextField
              size="small"
              label="Latest end"
              type="time"
              className="smart-shift-field"
              InputLabelProps={{ shrink: true }}
              value={prefForm.latest_end}
              onChange={(e) => setPrefForm((p) => ({ ...p, latest_end: e.target.value }))}
            />
          </Stack>
          <TextField
            size="small"
            label="Min rest (hours)"
            type="number"
            className="smart-shift-field"
            value={prefForm.min_hours_between_shifts}
            onChange={(e) => setPrefForm((p) => ({ ...p, min_hours_between_shifts: e.target.value }))}
          />
          <FormControl size="small" className="smart-shift-field">
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
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(prefForm.allow_split_shifts)}
                onChange={(e) => setPrefForm((p) => ({ ...p, allow_split_shifts: e.target.checked }))}
              />
            }
            label="Allow split shifts"
          />
          <Button variant="contained" onClick={handleSavePreference} fullWidth>
            Save Preferences
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default SmartShiftAvailabilityTab;
