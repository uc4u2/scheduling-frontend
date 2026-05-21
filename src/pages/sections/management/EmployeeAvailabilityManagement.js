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
  useMediaQuery,
  Divider,
  Snackbar,
  Chip,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ThemedDateField, { ThemedTimeField } from "../../../components/ui/ThemedDateField";
import api from "../../../utils/api";
import { pad } from "../../../utils/datetime";
import { DateTime } from "luxon";
import { useNavigate } from "react-router-dom";
import {
  filterAvailabilityRows,
  formatAvailabilityLeaveTooltip,
  isAvailabilityBlockedByLeave,
} from "./utils/availabilityRows";
import ShiftAdminAuditTimeline from "../ShiftAdminAuditTimeline";
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFT_LOOKAHEAD_DAYS = 21;
const availabilityConflictMessage = (err, fallback) => {
  const data = err?.response?.data || {};
  if (data.error_code === "availability_overlaps_approved_leave") {
    return data.message || "This employee has approved time off during the selected availability window. Adjust the availability window or review the leave record first.";
  }
  return data.error || data.message || fallback;
};

const availabilityConflictPayload = (err) => {
  const data = err?.response?.data || {};
  return data.error_code === "availability_overlaps_approved_leave" ? data : null;
};

const EmployeeAvailabilityManagement = ({ token }) => {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
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
  const [includeArchived, setIncludeArchived] = useState(false);

  /* ─────────────────────────────── Flags / messages ───────────────────────────── */
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [availabilityConflict, setAvailabilityConflict] = useState(null);
  const [availabilityAuditOpen, setAvailabilityAuditOpen] = useState(false);

  /* ─────────────────────────────── Daily‑window state ─────────────────────────── */
  const [wDayFrom, setWDayFrom] = useState("");
  const [wDayTo, setWDayTo] = useState("");
  const [wStart, setWStart] = useState("");
  const [wEnd, setWEnd] = useState("");
  const [makeSlots, setMakeSlots] = useState(false);
  const [wDuration, setWDuration] = useState(60);
  const [wCooling, setWCooling] = useState(0);
  const [wRecurring, setWRecurring] = useState(false);
  const [wRecurringDays, setWRecurringDays] = useState([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
  ]);
  const [wRepeatMode, setWRepeatMode] = useState("weeks"); // "weeks" | "until"
  const [wRepeatWeeks, setWRepeatWeeks] = useState(2);
  const [wRepeatUntil, setWRepeatUntil] = useState("");

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
  const [serviceSlots, setServiceSlots] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [loadingServiceSlots, setLoadingServiceSlots] = useState(false);
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
    setAvailabilityConflict(null);
  };

  useEffect(() => {
    const today = DateTime.now().toISODate();
    if (!wDayFrom) setWDayFrom(today);
    if (!wDayTo) setWDayTo(today);
    if (!startDate) setStartDate(today);
    if (!endDate) setEndDate(today);
  }, [wDayFrom, wDayTo, startDate, endDate]);

  const t = (val) => {
    // normalise “H:MM” → “HH:MM”
    if (/^\d{2}:\d{2}$/.test(val)) return val;
    const [h = 0, m = 0] = String(val).split(":").map(Number);
    return `${pad(h)}:${pad(m)}`;
  };

  const generateRecurringDatesFlexible = (
    baseDate,
    days,
    opts = { mode: "weeks", repeatWeeks: 2, endDate: "" }
  ) => {
    if (!baseDate) return [];
    const result = [];
    const base = DateTime.fromISO(baseDate).startOf("day");
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const baseLabel = dayNames[(base.weekday || 1) - 1];
    const selectedDays =
      Array.isArray(days) && days.length > 0
        ? new Set(days)
        : new Set([baseLabel]);

    const maybePush = (d) => {
      const label = dayNames[(d.weekday || 1) - 1];
      if (selectedDays.has(label)) {
        result.push(d.toISODate());
      }
    };

    if (opts.mode === "until" && opts.endDate) {
      const until = DateTime.fromISO(opts.endDate).startOf("day");
      for (let d = base; d <= until; d = d.plus({ days: 1 })) {
        maybePush(d);
      }
    } else {
      const weeks = Math.max(1, Math.min(52, parseInt(opts.repeatWeeks || 2, 10)));
      const spanDays = weeks * 7;
      let d = base;
      for (let i = 0; i < spanDays; i++) {
        maybePush(d);
        d = d.plus({ days: 1 });
      }
    }

    return Array.from(new Set(result));
  };

  /* ─────────────────────────────── Load reference data ─────────────────────────── */
  useEffect(() => {
    if (!token) return;

    api
      .get(`/api/departments`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setDepartments(r.data || []))
      .catch(() => setError("Failed to load departments."));

    setLoadingEmployees(true);
    const recruiterParams = includeArchived ? { include_archived: 1 } : { active: true };
    api
      .get(`/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
        params: recruiterParams,
      })
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

    api
      .get(`/api/shift-templates`, { headers: { Authorization: `Bearer ${token}` } })
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

    api
      .get(`/booking/services`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setServices(r.data || []))
      .catch(() => setError("Failed to load services."));
  }, [token, includeArchived]);

  /* ─────────────────────────────── Pre‑fill on employee change ─────────────────── */
useEffect(() => {
  if (!selectedEmployeeId) {
    const today = DateTime.now().toISODate();
    setWDayFrom(today);
    setWDayTo(today);
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

    api
      .get(`/api/manager/employees/${selectedEmployeeId}/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    .then((r) => {
      const slots = r.data || [];
      if (!slots.length) return;
      const s = slots[0];
        setWStart((prev) => prev || s.start_time);
        setWEnd((prev) => prev || s.end_time);
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
  api
    .get(
      `/automation/shifts/range?start_date=${start.toISODate()}&end_date=${end.toISODate()}&recruiter_ids=${selectedEmployeeId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then((r) => setAssignedShifts(r.data?.shifts || []))
    .catch(() => setAssignedShifts([]))
    .finally(() => setLoadingShifts(false));
}, [selectedEmployeeId, token]);

useEffect(() => {
  loadAssignedShifts();
}, [loadAssignedShifts]);

const loadServiceSlots = useCallback(() => {
  if (!selectedEmployeeId) {
    setServiceSlots([]);
    return;
  }
  setLoadingServiceSlots(true);
  api
    .get(`/api/manager/employees/${selectedEmployeeId}/availability`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => {
      const slots = r.data || [];
      setServiceSlots(slots);
    })
    .catch(() => setServiceSlots([]))
    .finally(() => setLoadingServiceSlots(false));
}, [selectedEmployeeId, token]);

useEffect(() => {
  loadServiceSlots();
}, [loadServiceSlots]);

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

  const serviceNameById = useMemo(() => {
    const map = new Map();
    services.forEach((s) => map.set(String(s.id), s.name));
    return map;
  }, [services]);

  const resolveSeatsLeft = (slot) => {
    if (typeof slot.seats_left === "number") return slot.seats_left;
    const capacity = Number(slot.capacity || 1);
    const booked = Number(slot.booked_count || (slot.booked ? 1 : 0));
    return Math.max(0, capacity - booked);
  };

  const filteredServiceSlots = useMemo(() => {
    return filterAvailabilityRows(serviceSlots, availabilityFilter);
  }, [serviceSlots, availabilityFilter]);

  const blockedServiceSlotCount = useMemo(
    () => filterAvailabilityRows(serviceSlots, "blocked").length,
    [serviceSlots]
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
    if (!selectedEmployeeId || !wDayFrom || !wStart || !wEnd) {
      setError("Fill start date and times.");
      return;
    }
    if (!wRecurring && !wDayTo) {
      setError("End date required when recurring is off.");
      return;
    }
    if (wRecurring && wRepeatMode === "until" && !wRepeatUntil) {
      setError("End date required for “repeat until date”.");
      return;
    }
    if (makeSlots && !wDuration) {
      setError("Slot duration required when “generate slots” is on.");
      return;
    }
    setLoading(true);
    try {
      let dates = [];
      if (wRecurring) {
        dates = generateRecurringDatesFlexible(wDayFrom, wRecurringDays, {
          mode: wRepeatMode,
          repeatWeeks: wRepeatWeeks,
          endDate: wRepeatUntil,
        });
      } else {
        const from = DateTime.fromISO(wDayFrom);
        const to = DateTime.fromISO(wDayTo);
        for (let d = from; d <= to; d = d.plus({ days: 1 })) {
          dates.push(d.toISODate());
        }
      }

      if (!dates.length) {
        setError("No dates selected.");
        return;
      }

      for (const date of dates) {
        const lenMin = Math.round(
          DateTime.fromISO(`${date}T${t(wEnd)}`).diff(
            DateTime.fromISO(`${date}T${t(wStart)}`),
            "minutes"
          ).minutes
        );
        await api.post(
          `/set-daily-availability`,
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
      setAvailabilityConflict(availabilityConflictPayload(err));
      setError(availabilityConflictMessage(err, "Save failed."));
    } finally {
      setLoading(false);
    }
    loadServiceSlots();
  };

  const saveRecurringSlots = async () => {
    resetAlerts();
    if (!selectedEmployeeId || !startDate || !endDate || !startTime || !endTime || !duration) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      await api.post(
        `/api/manager/employees/${selectedEmployeeId}/set-recurring-availability`,
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
      setAvailabilityConflict(availabilityConflictPayload(err));
      setError(availabilityConflictMessage(err, "Failed to set availability."));
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
      await api.post(
        `/api/manager/employees/${selectedEmployeeId}/add-service-slot`,
        {
          service_id: selectedServiceId,
          date: slotDate,
          start_time: slotStartTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage("Service slot added successfully!");
    } catch (err) {
      setAvailabilityConflict(availabilityConflictPayload(err));
      setError(availabilityConflictMessage(err, "Failed to add service slot."));
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

      <Stack spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Department"
          fullWidth
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
        <FormControlLabel
          control={
            <Checkbox
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
          }
          label="Show archived employees"
        />

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
          />
        )}
      </Stack>

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
            <Button size="small" variant="text" onClick={() => setAvailabilityAuditOpen(true)}>
              Activity log
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
                onClick={() => navigate(`/manager/team?recruiter=${selectedEmployeeId}`)}
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
      <ShiftAdminAuditTimeline
        open={availabilityAuditOpen && Boolean(selectedEmployeeId)}
        onClose={() => setAvailabilityAuditOpen(false)}
        title="Availability activity"
        entityTypes={["availability"]}
        employeeId={selectedEmployeeId}
      />

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
            <ThemedDateField
              label="Start date"
              fullWidth
              value={wDayFrom}
              onChange={(e) => setWDayFrom(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={wRecurring}
                  onChange={(e) => setWRecurring(e.target.checked)}
                />
              }
              label="Recurring"
            />
          </Grid>

          {!wRecurring && (
            <Grid item xs={6}>
              <ThemedDateField
                label="End date"
                fullWidth
                value={wDayTo}
                onChange={(e) => setWDayTo(e.target.value)}
              />
            </Grid>
          )}

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
            <ThemedTimeField
              label="Start Time"
              fullWidth
              value={wStart}
              onChange={(e) => setWStart(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <ThemedTimeField
              label="End Time"
              fullWidth
              value={wEnd}
              onChange={(e) => setWEnd(e.target.value)}
            />
          </Grid>

          {wRecurring && (
            <Grid item xs={12}>
              <Typography variant="subtitle2">Select Days</Typography>
              <Grid container>
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => (
                  <Grid item key={day} sx={{ pr: 1 }}>
                    <Checkbox
                      name="wRecurringDays"
                      value={day}
                      checked={wRecurringDays.includes(day)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const value = e.target.value;
                        setWRecurringDays((p) =>
                          checked ? [...p, value] : p.filter((d) => d !== value)
                        );
                      }}
                      size="small"
                    />
                    <Typography variant="caption">{day}</Typography>
                  </Grid>
                ))}
              </Grid>

              <Box mt={2}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Repeat Options
                </Typography>
                <Tabs
                  value={wRepeatMode}
                  onChange={(_, v) => v && setWRepeatMode(v)}
                  sx={{ minHeight: 32 }}
                >
                  <Tab value="weeks" label="Repeat for N weeks" sx={{ minHeight: 32 }} />
                  <Tab value="until" label="Repeat until date" sx={{ minHeight: 32 }} />
                </Tabs>

                {wRepeatMode === "weeks" && (
                  <TextField
                    label="Number of weeks"
                    type="number"
                    fullWidth
                    margin="dense"
                    inputProps={{ min: 1, max: 52 }}
                    value={wRepeatWeeks}
                    onChange={(e) =>
                      setWRepeatWeeks(
                        Math.max(1, Math.min(52, parseInt(e.target.value || "1", 10)))
                      )
                    }
                  />
                )}

                {wRepeatMode === "until" && (
                  <ThemedDateField
                    label="End date"
                    fullWidth
                    margin="dense"
                    value={wRepeatUntil}
                    onChange={(e) => setWRepeatUntil(e.target.value)}
                  />
                )}

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  Tip: If you don’t pick any days, we’ll default to the same weekday as your start date.
                </Typography>
              </Box>
            </Grid>
          )}

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
            <ThemedDateField
              label="Start Date"
              fullWidth
              margin="dense"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <ThemedDateField
              label="End Date"
              fullWidth
              margin="dense"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <ThemedTimeField
              label="Start Time"
              fullWidth
              margin="dense"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <ThemedTimeField
              label="End Time"
              fullWidth
              margin="dense"
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
            <ThemedTimeField
              label="Break Start Time"
              fullWidth
              margin="dense"
              value={breakStartTime}
              onChange={(e) => setBreakStartTime(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <ThemedTimeField
              label="Break End Time"
              fullWidth
              margin="dense"
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
            <ThemedDateField
              label="Date"
              fullWidth
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <ThemedTimeField
              label="Start Time"
              fullWidth
              value={slotStartTime}
              onChange={(e) => setSlotStartTime(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Availability rows
            </Typography>
            <Alert severity="info" variant="outlined" sx={{ mb: 1.5 }}>
              Blocked rows are kept for audit but should not be treated as usable availability.
            </Alert>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 1.5 }}>
              <TextField
                select
                size="small"
                label="Availability view"
                value={availabilityFilter}
                onChange={(event) => setAvailabilityFilter(event.target.value)}
                sx={{ minWidth: 190 }}
              >
                <MenuItem value="all">All availability</MenuItem>
                <MenuItem value="blocked">Blocked by leave</MenuItem>
                <MenuItem value="available">Available only</MenuItem>
              </TextField>
              <Chip
                size="small"
                variant="outlined"
                color={blockedServiceSlotCount ? "warning" : "default"}
                label={`${blockedServiceSlotCount} blocked by approved leave`}
                sx={{ alignSelf: { xs: "flex-start", sm: "center" }, fontWeight: 700 }}
              />
            </Stack>
            {loadingServiceSlots ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Loading slots…
                </Typography>
              </Stack>
            ) : serviceSlots.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No availability rows yet.
              </Typography>
            ) : filteredServiceSlots.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No availability rows match this filter.
              </Typography>
            ) : (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  {filteredServiceSlots.map((slot) => {
                    const slotServiceId = slot.service_id || slot.serviceId;
                    const serviceName = serviceNameById.get(String(slotServiceId)) || slot.service || "General availability";
                    const modeLabel = slot.mode === "group" ? "Group" : "1:1";
                    const capacity = Number(slot.capacity || 1);
                    const seatsLeft = resolveSeatsLeft(slot);
                    const blockedByLeave = isAvailabilityBlockedByLeave(slot);
                    const blockedTitle = formatAvailabilityLeaveTooltip(slot);
                    return (
                      <Box
                        key={`${slot.date}-${slot.start_time}-${slotServiceId}-${slot.id || ""}`}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1.3fr 1.2fr 0.8fr 0.7fr 0.8fr",
                          gap: 1,
                          alignItems: "center",
                          p: blockedByLeave ? 1 : 0,
                          borderRadius: 1,
                          border: blockedByLeave ? "1px solid" : "none",
                          borderColor: blockedByLeave ? "warning.light" : "transparent",
                          bgcolor: blockedByLeave ? "rgba(245, 158, 11, 0.08)" : "transparent",
                        }}
                      >
                        <Typography variant="body2">
                          {slot.date} • {slot.start_time}
                        </Typography>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{serviceName}</Typography>
                          {blockedByLeave && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              <Tooltip title={blockedTitle || "Blocked by approved leave"}>
                                <Chip
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  label="Blocked by approved leave"
                                  sx={{ alignSelf: "flex-start", fontWeight: 700 }}
                                />
                              </Tooltip>
                              {slot.leave_type && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={`${slot.leave_type} leave`}
                                  sx={{ alignSelf: "flex-start", fontWeight: 700 }}
                                />
                              )}
                            </Stack>
                          )}
                        </Stack>
                        <Typography variant="body2">{modeLabel}</Typography>
                        <Typography variant="body2">
                          {slot.mode === "group" ? capacity : "-"}
                        </Typography>
                        <Typography variant="body2">
                          {slot.mode === "group" ? `${seatsLeft}/${capacity}` : "-"}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {/* Submit */}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedEmployeeId || loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? "Saving..." : "Save Availability"}
        </Button>
      </Box>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => {
          setError("");
          setAvailabilityConflict(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => {
            setError("");
            setAvailabilityConflict(null);
          }}
          severity="error"
          sx={{ width: "100%" }}
        >
          <Stack spacing={0.75}>
            <Typography variant="body2">{error}</Typography>
            {availabilityConflict?.leave_conflicts?.length > 0 && (
              <Stack spacing={0.5}>
                {availabilityConflict.leave_conflicts.slice(0, 4).map((conflict, index) => (
                  <Typography key={`${conflict.leave_id || "leave"}-${index}`} variant="caption">
                    Leave #{conflict.leave_id || "—"} · {conflict.leave_type || "leave"} · {conflict.leave_status || "approved"} · {Number(conflict.overlap_minutes || 0).toFixed(0)} min overlap
                  </Typography>
                ))}
              </Stack>
            )}
          </Stack>
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessMessage("")}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeAvailabilityManagement;
