// src/EmployeeAvailabilityManagement.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Autocomplete,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Paper,
  Stack,
} from "@mui/material";
import axios from "axios";
import { pad } from "../../../utils/datetime";
import { DateTime } from "luxon";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFT_LOOKAHEAD_DAYS = 21;

const EmployeeAvailabilityManagement = ({ token }) => {
  const navigate = useNavigate();
  /* ─────────────────────────────── Reference data ─────────────────────────────── */
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [services, setServices] = useState([]);

  /* ─────────────────────────────── Selections ─────────────────────────────────── */
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedTemplateLabel, setSelectedTemplateLabel] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  /* ─────────────────────────────── Flags / messages ───────────────────────────── */
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* ─────────────────────────────── Daily‑window state ─────────────────────────── */
  const [wDayFrom, setWDayFrom] = useState("");
  const [wDayTo, setWDayTo] = useState("");
  const [wStart, setWStart] = useState("");
  const [wEnd, setWEnd] = useState("");
  const [makeSlots, setMakeSlots] = useState(false);
  const [wDuration, setWDuration] = useState(60);
  const [wCooling, setWCooling] = useState(0);

  /* ─────────────────────────────── Recurring form state ───────────────────────── */
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [breakStartTime, setBreakStartTime] = useState("");
  const [breakEndTime, setBreakEndTime] = useState("");
  const [coolingTime, setCoolingTime] = useState(0);
  const [selectedEmployeeTimezone, setSelectedEmployeeTimezone] = useState("UTC");

  /* ─────────────────────────────── Service‑slot state ─────────────────────────── */
  const [slotDate, setSlotDate] = useState("");
  const [slotStartTime, setSlotStartTime] = useState("");
  const [assignedShifts, setAssignedShifts] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const overtimeCount = useMemo(() => {
    return assignedShifts.filter((shift) => {
      if (!(shift.clock_in && shift.clock_out)) return false;
      try {
        const start = DateTime.fromISO(shift.clock_in);
        const end = DateTime.fromISO(shift.clock_out);
        return end.diff(start, "hours").hours >= 9;
      } catch {
        return false;
      }
    }).length;
  }, [assignedShifts]);

  /* ─────────────────────────────── Helpers ─────────────────────────────────────── */
  const resetAlerts = () => {
    setError("");
    setSuccessMessage("");
  };

  const t = (val) => {
    // normalise “H:MM” → “HH:MM”
    if (/^\d{2}:\d{2}$/.test(val)) return val;
    const [h = 0, m = 0] = String(val).split(":").map(Number);
    return `${pad(h)}:${pad(m)}`;
  };

  /* ─────────────────────────────── Load reference data ─────────────────────────── */
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API_URL}/api/departments`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setDepartments(r.data || []))
      .catch(() => setError("Failed to load departments."));

    setLoadingEmployees(true);
    axios
      .get(`${API_URL}/manager/recruiters?active=true`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) =>
        setEmployees(
          (r.data.recruiters || r.data || []).map((e) => ({
            ...e,
            timezone: e.timezone || "UTC",
          }))
        )
      )
      .catch(() => setError("Failed to load employees."))
      .finally(() => setLoadingEmployees(false));

    axios
      .get(`${API_URL}/api/shift-templates`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) =>
        setTemplates(
          (r.data || []).map((t) => ({
            id: t.id,
            label: t.name,
            start: t.start_time.slice(0, 5),
            end: t.end_time.slice(0, 5),
            days: (t.days || []).map((i) => dayLabels[i]),
            breakStart: t.break_start ? t.break_start.slice(0, 5) : "",
            breakEnd: t.break_end ? t.break_end.slice(0, 5) : "",
            breakMinutes: t.break_minutes ?? "",
            breakPaid: Boolean(t.break_paid),
          }))
        )
      )
      .catch(() => setError("Failed to load shift templates."));

    axios
      .get(`${API_URL}/booking/services`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setServices(r.data || []))
      .catch(() => setError("Failed to load services."));
  }, [token]);

  /* ─────────────────────────────── Pre‑fill on employee change ─────────────────── */
useEffect(() => {
  if (!selectedEmployeeId) {
    setWDayFrom("");
    setWDayTo("");
    setWStart("");
    setWEnd("");
    setMakeSlots(false);
    setWDuration(60);
    setWCooling(0);
    setAssignedShifts([]);
    return;
  }

    const emp = employees.find((e) => e.id === selectedEmployeeId);
    setSelectedEmployeeTimezone(emp?.timezone || "UTC");

    axios
      .get(`${API_URL}/api/manager/employees/${selectedEmployeeId}/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        const slots = r.data || [];
        if (!slots.length) return;
        const s = slots[0];
        setWDayFrom(s.date);
        setWDayTo(s.date);
        setWStart(s.start_time);
        setWEnd(s.end_time);
      })
      .catch(() => {});
}, [selectedEmployeeId, employees, token]);

const loadAssignedShifts = useCallback(() => {
  if (!selectedEmployeeId) {
    setAssignedShifts([]);
    return;
  }
  const start = DateTime.now().startOf("day");
  const end = start.plus({ days: SHIFT_LOOKAHEAD_DAYS });
  setLoadingShifts(true);
  axios
    .get(
      `${API_URL}/automation/shifts/range?start_date=${start.toISODate()}&end_date=${end.toISODate()}&recruiter_ids=${selectedEmployeeId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then((r) => setAssignedShifts(r.data?.shifts || []))
    .catch(() => setAssignedShifts([]))
    .finally(() => setLoadingShifts(false));
}, [selectedEmployeeId, token]);

useEffect(() => {
  loadAssignedShifts();
}, [loadAssignedShifts]);

  /* ─────────────────────────────── Filters & selects ───────────────────────────── */
  const filteredEmployees = useMemo(
    () =>
      selectedDepartment
        ? employees.filter((e) => String(e.department_id) === String(selectedDepartment))
        : employees,
    [employees, selectedDepartment]
  );
  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  );

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setSelectedEmployeeId("");
    resetAlerts();
  };

  const handleEmployeeChange = (_, v) => {
    setSelectedEmployeeId(v ? v.id : "");
    setSelectedEmployeeTimezone(v ? v.timezone || "UTC" : "UTC");
    resetAlerts();
  };

  const handleTemplateChange = (e) => {
    const label = e.target.value;
    setSelectedTemplateLabel(label);
    const tmpl = templates.find((t) => t.label === label);
    if (tmpl) {
      setWStart(tmpl.start);
      setWEnd(tmpl.end);
      setStartTime(tmpl.start);
      setEndTime(tmpl.end);
      setBreakStartTime(tmpl.breakStart || "");
      setBreakEndTime(tmpl.breakEnd || "");
    } else {
      setWStart("");
      setWEnd("");
      setBreakStartTime("");
      setBreakEndTime("");
    }
  };


  /* ─────────────────────────────── Save helpers ────────────────────────────────── */
  const saveDailyWindow = async () => {
    resetAlerts();
    if (!selectedEmployeeId || !wDayFrom || !wDayTo || !wStart || !wEnd) {
      setError("Fill start/end dates and times.");
      return;
    }
    if (makeSlots && !wDuration) {
      setError("Slot duration required when “generate slots” is on.");
      return;
    }
    setLoading(true);
    try {
      const from = DateTime.fromISO(wDayFrom);
      const to = DateTime.fromISO(wDayTo);
      const dates = [];
      for (let d = from; d <= to; d = d.plus({ days: 1 })) dates.push(d.toISODate());

      for (const date of dates) {
        const lenMin = Math.round(
          DateTime.fromISO(`${date}T${t(wEnd)}`).diff(
            DateTime.fromISO(`${date}T${t(wStart)}`),
            "minutes"
          ).minutes
        );
        await axios.post(
          `${API_URL}/set-daily-availability`,
          {
            recruiter_id: selectedEmployeeId,
            date,
            start_time: t(wStart),
            end_time: t(wEnd),
            duration: makeSlots ? Number(wDuration) : Math.max(lenMin, 5),
            cooling_time: makeSlots ? Number(wCooling) : 0,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setSuccessMessage(`Shift window saved for ${dates.length} day(s)!`);
    } catch (err) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  const saveRecurringSlots = async () => {
    resetAlerts();
    if (!selectedEmployeeId || !startDate || !endDate || !startTime || !endTime || !duration) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/manager/employees/${selectedEmployeeId}/set-recurring-availability`,
        {
          start_date: startDate,
          end_date: endDate,
          start_time: t(startTime),
          end_time: t(endTime),
          duration: Number(duration),
          timezone: selectedEmployeeTimezone,
          break_start_time: breakStartTime ? t(breakStartTime) : null,
          break_end_time: breakEndTime ? t(breakEndTime) : null,
          cooling_time: Number(coolingTime || 0),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage("Recurring pattern saved!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to set availability.");
    } finally {
      setLoading(false);
    }
  };

  const saveServiceSlot = async () => {
    resetAlerts();
    if (!selectedEmployeeId || !selectedServiceId || !slotDate || !slotStartTime) {
      setError("Please fill all service slot fields.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/manager/employees/${selectedEmployeeId}/add-service-slot`,
        {
          service_id: selectedServiceId,
          date: slotDate,
          start_time: slotStartTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage("Service slot added successfully!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add service slot.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (tab === 0) saveDailyWindow();
    else if (tab === 1) saveRecurringSlots();
    else saveServiceSlot();
  };

  /* ─────────────────────────────── Render ──────────────────────────────────────── */
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Employee Availability Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Department select */}
      <TextField
        select
        label="Department"
        fullWidth
        sx={{ mb: 2 }}
        value={selectedDepartment}
        onChange={handleDepartmentChange}
      >
        <MenuItem value="">
          <em>All Departments</em>
        </MenuItem>
        {departments.map((d) => (
          <MenuItem key={d.id} value={String(d.id)}>
            {d.name}
          </MenuItem>
        ))}
      </TextField>

      {/* Employee select */}
      {loadingEmployees ? (
        <CircularProgress size={24} />
      ) : (
        <Autocomplete
          options={filteredEmployees}
          getOptionLabel={(o) => o.full_name || `${o.first_name} ${o.last_name}`}
          noOptionsText={selectedDepartment ? "No employees in department" : "No employees"}
          value={filteredEmployees.find((e) => e.id === selectedEmployeeId) || null}
          onChange={handleEmployeeChange}
          renderInput={(params) => <TextField {...params} label="Employee" fullWidth margin="dense" />}
          sx={{ mb: 2 }}
        />
      )}

      {selectedEmployeeId && (
        <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Shift health snapshot
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming {SHIFT_LOOKAHEAD_DAYS}-day outlook for{" "}
                {selectedEmployee?.full_name || selectedEmployee?.name || "this employee"}.
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={loadAssignedShifts} disabled={loadingShifts}>
              Refresh metrics
            </Button>
          </Stack>
          {loadingShifts ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Calculating shift metrics…
              </Typography>
            </Stack>
          ) : (
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
              <Paper
                variant="outlined"
                sx={{ flex: 1, p: 2, cursor: "pointer" }}
                onClick={() => navigate(`/manager/dashboard?view=team&recruiter=${selectedEmployeeId}`)}
              >
                <Typography variant="h4" fontWeight={700}>
                  {assignedShifts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Shifts scheduled next {SHIFT_LOOKAHEAD_DAYS} days
                </Typography>
                <Typography variant="caption" color="primary">
                  Open shift manager ↗
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ flex: 1, p: 2 }}>
                <Typography variant="h4" fontWeight={700}>
                  {assignedShifts.filter((s) => s.status === "in_progress").length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently in progress
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ flex: 1, p: 2 }}>
                <Typography variant="h4" fontWeight={700}>
                  {overtimeCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overtime risk (9h+ shifts)
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ flex: 1, p: 2 }}>
                <Typography variant="h4" fontWeight={700}>
                  {
                    assignedShifts.filter(
                      (s) =>
                        !s.break_start &&
                        !s.break_minutes &&
                        (!s.breakStart || s.breakStart === "") &&
                        (!s.breakMinutes || s.breakMinutes === "")
                    ).length
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Shifts lacking break defaults
                </Typography>
              </Paper>
            </Stack>
          )}
        </Paper>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Daily Shift Window" />
        <Tab label="Recurring Slots" />
        <Tab label="Service Slot Assignment" />
      </Tabs>

      {/* Daily window tab */}
      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Start date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={wDayFrom}
              onChange={(e) => setWDayFrom(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="End date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={wDayTo}
              onChange={(e) => setWDayTo(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              select
              label="Shift Template (optional)"
              fullWidth
              value={selectedTemplateLabel}
              onChange={handleTemplateChange}
              helperText="Select a template to autofill times, or enter manually"
              margin="normal"
            >
              <MenuItem value="">
                <em>None (manual input)</em>
              </MenuItem>
              {templates.map((t) => (
                <MenuItem key={t.id} value={t.label}>
                  {t.label} ({t.start} - {t.end})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6}>
            <FormControlLabel
              control={<Checkbox checked={makeSlots} onChange={(e) => setMakeSlots(e.target.checked)} />}
              label="Generate fixed slots"
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Start Time"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={wStart}
              onChange={(e) => setWStart(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="End Time"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={wEnd}
              onChange={(e) => setWEnd(e.target.value)}
            />
          </Grid>

          {makeSlots && (
            <>
              <Grid item xs={6}>
                <TextField
                  label="Slot Duration (min)"
                  type="number"
                  fullWidth
                  margin="dense"
                  value={wDuration}
                  onChange={(e) => setWDuration(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Cooling Time (min)"
                  type="number"
                  fullWidth
                  margin="dense"
                  value={wCooling}
                  onChange={(e) => setWCooling(e.target.value)}
                />
              </Grid>
            </>
          )}
        </Grid>
      )}

      {/* Recurring tab */}
      {tab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Start Time"
              type="time"
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="End Time"
              type="time"
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Slot Duration (min)"
              type="number"
              fullWidth
              margin="dense"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Break Start Time"
              type="time"
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
              value={breakStartTime}
              onChange={(e) => setBreakStartTime(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Break End Time"
              type="time"
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
              value={breakEndTime}
              onChange={(e) => setBreakEndTime(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Cooling Time (min)"
              type="number"
              fullWidth
              margin="dense"
              value={coolingTime}
              onChange={(e) => setCoolingTime(e.target.value)}
            />
          </Grid>
        </Grid>
      )}

      {/* Service slot tab */}
      {tab === 2 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              select
              label="Service"
              fullWidth
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              <MenuItem value="">
                <em>Select service</em>
              </MenuItem>
              {services.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Start Time"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={slotStartTime}
              onChange={(e) => setSlotStartTime(e.target.value)}
            />
          </Grid>
        </Grid>
      )}

      {/* Submit */}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedEmployeeId || loading}
        >
          {loading ? "Saving..." : "Save Availability"}
        </Button>
      </Box>
    </Box>
  );
};

export default EmployeeAvailabilityManagement;
