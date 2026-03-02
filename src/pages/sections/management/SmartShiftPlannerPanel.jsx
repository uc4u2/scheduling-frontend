import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { DateTime } from "luxon";
import { smartShifts } from "../../../utils/api";
import { isoFromParts } from "../../../utils/datetime";

const DEFAULT_COVERAGE = {
  coverage_id: "",
  location_id: "",
  role_key: "",
  days_of_week: [1, 2, 3, 4, 5],
  timezone: "",
  start_time: "09:00",
  end_time: "17:00",
  headcount: 1,
  break_strategy: "fixed_time",
  break_minutes: 30,
  break_paid: false,
};

const DOW = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const toDefaultRangeStart = () => DateTime.local().startOf("week").plus({ days: 1 }).toFormat("yyyy-MM-dd");
const toDefaultRangeEnd = () => DateTime.local().startOf("week").plus({ days: 7 }).toFormat("yyyy-MM-dd");
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

const toSuggestionDateTime = (date, hhmm, timezone) => {
  try {
    const iso = isoFromParts(date, hhmm, timezone || "UTC");
    const dt = DateTime.fromISO(iso, { setZone: true });
    return dt.isValid ? dt.toFormat("ccc, LLL d • HH:mm ZZZZ") : `${date} ${hhmm}`;
  } catch {
    return `${date} ${hhmm}`;
  }
};

const SmartShiftPlannerPanel = ({ recruiters = [], departments = [], onApplied }) => {
  const autoTimezone = useMemo(() => detectTimezone(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [range, setRange] = useState({
    start_date: toDefaultRangeStart(),
    end_date: toDefaultRangeEnd(),
    timezone: autoTimezone,
  });
  const [coverage, setCoverage] = useState([{ ...DEFAULT_COVERAGE, timezone: autoTimezone }]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState([]);
  const [latestRun, setLatestRun] = useState(null);
  const [runs, setRuns] = useState([]);
  const [runDetail, setRunDetail] = useState(null);
  const [includeRecruiterIds, setIncludeRecruiterIds] = useState([]);
  const [weeksSpan, setWeeksSpan] = useState(4);

  const recruiterNameById = useMemo(() => {
    const m = new Map();
    recruiters.forEach((r) => m.set(r.id, r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim()));
    return m;
  }, [recruiters]);

  const buildPayload = () => {
    const normalizedCoverage = coverage
      .filter((c) => c.start_time && c.end_time && Number(c.headcount || 0) > 0)
      .map((c, idx) => ({
        coverage_id: c.coverage_id || `coverage-${idx + 1}`,
        location_id: c.location_id ? Number(c.location_id) : null,
        role_key: c.role_key || null,
        days_of_week: c.days_of_week,
        timezone: c.timezone || range.timezone || autoTimezone,
        shifts: [
          {
            start_time: c.start_time,
            end_time: c.end_time,
            headcount: Number(c.headcount || 1),
            break_policy: {
              strategy: c.break_strategy,
              minutes: Number(c.break_minutes || 30),
              paid: Boolean(c.break_paid),
            },
          },
        ],
      }));

    return {
      range,
      coverage: normalizedCoverage,
      filters: {
        include_recruiter_ids: includeRecruiterIds,
        respect_leaves: true,
        respect_existing_shifts: true,
        respect_break_policy: true,
        allow_overtime: false,
        max_weekly_hours_default: 40,
        min_rest_hours_default: 11,
      },
      options: {
        mode: "preview",
        max_suggestions: 500,
      },
    };
  };

  const applyCoveragePreset = () => {
    setCoverage([
      {
        ...DEFAULT_COVERAGE,
        coverage_id: "weekday-core",
        days_of_week: [1, 2, 3, 4, 5],
        start_time: "09:00",
        end_time: "17:00",
        headcount: 1,
        timezone: range.timezone || autoTimezone,
      },
    ]);
  };

  const applyRangeByWeeks = (weeksInput = weeksSpan) => {
    const weeks = Math.max(1, Math.min(52, Number(weeksInput) || 1));
    const start = DateTime.fromISO(range.start_date);
    if (!start.isValid) return;
    const end = start.plus({ weeks }).minus({ days: 1 }).toFormat("yyyy-MM-dd");
    setWeeksSpan(weeks);
    setRange((prev) => ({ ...prev, end_date: end }));
  };

  const handleSuggest = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = buildPayload();
      if (!payload.coverage.length) {
        throw new Error("Add at least one valid coverage row.");
      }
      const { data } = await smartShifts.manager.suggest(payload);
      setLatestRun(data?.run || null);
      const list = Array.isArray(data?.suggestions) ? data.suggestions : [];
      setSuggestions(list);
      setSelectedSuggestionIds(list.map((s) => s.suggestion_id));
      setSuccess(`Generated ${list.length} suggestions.`);
      const runsRes = await smartShifts.manager.listRuns(20);
      setRuns(Array.isArray(runsRes?.data?.items) ? runsRes.data.items : []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to generate smart shift suggestions.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!latestRun?.run_id) {
      setError("Generate suggestions first.");
      return;
    }
    if (!selectedSuggestionIds.length) {
      setError("Select at least one suggestion.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await smartShifts.manager.apply({
        run_id: latestRun.run_id,
        selected_suggestion_ids: selectedSuggestionIds,
        apply_options: {
          dry_run: false,
          on_conflict: "skip",
          enforce_overlap_checks: true,
          enforce_leave_conflicts: true,
        },
      });
      setSuccess(`Applied ${data?.run?.applied_count || 0} shift(s), failed ${data?.run?.failed_count || 0}.`);
      if (onApplied) onApplied();
      const runsRes = await smartShifts.manager.listRuns(20);
      setRuns(Array.isArray(runsRes?.data?.items) ? runsRes.data.items : []);
      if (latestRun?.run_id) {
        const detail = await smartShifts.manager.getRun(latestRun.run_id);
        setRunDetail(detail?.data || null);
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to apply suggestions.");
    } finally {
      setLoading(false);
    }
  };

  const loadRunDetail = async (runId) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await smartShifts.manager.getRun(runId);
      setRunDetail(data || null);
      setLatestRun(data?.run || null);
      setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
      setSelectedSuggestionIds(
        (data?.suggestions || [])
          .filter((s) => (s.status || "").toLowerCase() !== "failed")
          .map((s) => s.suggestion_id)
      );
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load run details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="h6" fontWeight={700}>
          Smart Shift
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Generate shift suggestions from employee smart availability, then apply selected rows into real shifts.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          Timezone auto-detected: {autoTimezone}
        </Typography>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Suggestion input
        </Typography>
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Set a start date, choose how many weeks to plan, then define coverage rows and click Generate Suggestions.
        </Alert>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            label="Start date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={range.start_date}
            onChange={(e) => setRange((p) => ({ ...p, start_date: e.target.value }))}
          />
          <TextField
            label="End date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={range.end_date}
            onChange={(e) => setRange((p) => ({ ...p, end_date: e.target.value }))}
          />
          {showAdvanced ? (
            <TextField
              label="Timezone"
              value={range.timezone}
              onChange={(e) => setRange((p) => ({ ...p, timezone: e.target.value }))}
              placeholder={autoTimezone}
            />
          ) : null}
          <FormControl sx={{ minWidth: 260 }}>
            <InputLabel>Employees</InputLabel>
            <Select
              multiple
              label="Employees"
              value={includeRecruiterIds}
              onChange={(e) => setIncludeRecruiterIds(e.target.value)}
              renderValue={(selected) =>
                selected
                  .map((id) => recruiterNameById.get(id) || `#${id}`)
                  .join(", ")
              }
            >
              {recruiters.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim() || `#${r.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Plan weeks</InputLabel>
            <Select
              label="Plan weeks"
              value={weeksSpan}
              onChange={(e) => setWeeksSpan(Number(e.target.value))}
            >
              <MenuItem value={1}>1 week</MenuItem>
              <MenuItem value={4}>4 weeks</MenuItem>
              <MenuItem value={12}>12 weeks</MenuItem>
              <MenuItem value={52}>52 weeks</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => applyRangeByWeeks()}>
            Set end date from weeks
          </Button>
          <Button size="small" onClick={() => applyRangeByWeeks(1)}>1w</Button>
          <Button size="small" onClick={() => applyRangeByWeeks(4)}>4w</Button>
          <Button size="small" onClick={() => applyRangeByWeeks(12)}>12w</Button>
          <Button size="small" onClick={() => applyRangeByWeeks(52)}>52w</Button>
        </Stack>

        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {coverage.map((c, idx) => (
            <Paper key={`cov-${idx}`} sx={{ p: 1.5, borderRadius: 1.5 }} variant="outlined">
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                <Stack direction="row" spacing={0.25} alignItems="center" sx={{ minWidth: 210, flex: 1 }}>
                  <TextField
                    size="small"
                    label="Coverage label"
                    value={c.coverage_id}
                    onChange={(e) =>
                      setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, coverage_id: e.target.value } : it)))
                    }
                  />
                  <Tooltip title="Internal name for this coverage row, such as Front Desk Day Shift.">
                    <IconButton size="small" sx={{ mt: 0.25 }}>
                      <HelpOutlineIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <TextField
                  select
                  size="small"
                  label="Department"
                  value={c.location_id}
                  onChange={(e) =>
                    setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, location_id: e.target.value } : it)))
                  }
                >
                  <MenuItem value="">
                    <em>Any department</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name || `Department #${dept.id}`}
                    </MenuItem>
                  ))}
                </TextField>
                <Stack direction="row" spacing={0.25} alignItems="center" sx={{ minWidth: 170, flex: 1 }}>
                  <TextField
                    size="small"
                    label="Role (optional)"
                    value={c.role_key}
                    onChange={(e) =>
                      setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, role_key: e.target.value } : it)))
                    }
                  />
                  <Tooltip title="Optional tag for matching staff role, like cashier or frontdesk.">
                    <IconButton size="small" sx={{ mt: 0.25 }}>
                      <HelpOutlineIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <TextField
                  size="small"
                  label="Start"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  value={c.start_time}
                  onChange={(e) =>
                    setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, start_time: e.target.value } : it)))
                  }
                />
                <TextField
                  size="small"
                  label="End"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  value={c.end_time}
                  onChange={(e) =>
                    setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, end_time: e.target.value } : it)))
                  }
                />
                <Stack direction="row" spacing={0.25} alignItems="center" sx={{ width: 140 }}>
                  <TextField
                    size="small"
                    label="Headcount"
                    type="number"
                    value={c.headcount}
                    onChange={(e) =>
                      setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, headcount: e.target.value } : it)))
                    }
                    sx={{ width: 110 }}
                  />
                  <Tooltip title="How many employees are needed for this shift window.">
                    <IconButton size="small" sx={{ mt: 0.25 }}>
                      <HelpOutlineIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ mt: 1.25 }}>
                <Stack direction="row" spacing={0.25} alignItems="center" sx={{ minWidth: 260 }}>
                  <FormControl size="small" sx={{ minWidth: 240 }}>
                    <InputLabel>Days of week</InputLabel>
                    <Select
                      multiple
                      label="Days of week"
                      value={c.days_of_week}
                      onChange={(e) =>
                        setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, days_of_week: e.target.value } : it)))
                      }
                      renderValue={(selected) =>
                        selected
                          .map((d) => DOW.find((x) => x.value === d)?.label || d)
                          .join(", ")
                      }
                    >
                      {DOW.map((d) => (
                        <MenuItem key={d.value} value={d.value}>
                          {d.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Tooltip title="Which weekdays this coverage row should repeat on inside the selected date range.">
                    <IconButton size="small" sx={{ mt: 0.25 }}>
                      <HelpOutlineIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                {showAdvanced ? (
                  <TextField
                    size="small"
                    label="Coverage timezone"
                    value={c.timezone}
                    onChange={(e) =>
                      setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, timezone: e.target.value } : it)))
                    }
                    placeholder={range.timezone || autoTimezone}
                  />
                ) : null}
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Break strategy</InputLabel>
                  <Select
                    label="Break strategy"
                    value={c.break_strategy}
                    onChange={(e) =>
                      setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, break_strategy: e.target.value } : it)))
                    }
                  >
                    <MenuItem value="fixed_time">Fixed time</MenuItem>
                    <MenuItem value="window">Window</MenuItem>
                    <MenuItem value="manual">Manual</MenuItem>
                    <MenuItem value="auto_stagger">Auto stagger</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Break min"
                  type="number"
                  value={c.break_minutes}
                  onChange={(e) =>
                    setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, break_minutes: e.target.value } : it)))
                  }
                  sx={{ width: 120 }}
                />
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Checkbox
                    checked={Boolean(c.break_paid)}
                    onChange={(e) =>
                      setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, break_paid: e.target.checked } : it)))
                    }
                  />
                  <Typography variant="body2">Paid break</Typography>
                </Box>
                <Button
                  color="error"
                  disabled={coverage.length <= 1}
                  onClick={() => setCoverage((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Remove
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button variant="outlined" onClick={applyCoveragePreset}>
            Load sample coverage
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              setCoverage((prev) => [
                ...prev,
                { ...DEFAULT_COVERAGE, timezone: range.timezone || autoTimezone },
              ])
            }
          >
            Add coverage row
          </Button>
          <Button variant="text" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? "Hide advanced" : "Show advanced"}
          </Button>
          <Button variant="contained" onClick={handleSuggest} disabled={loading}>
            Generate Suggestions
          </Button>
          <Button variant="contained" color="success" onClick={handleApply} disabled={loading || !selectedSuggestionIds.length}>
            Apply Selected
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Suggestions
        </Typography>
        {suggestions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No suggestions yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {suggestions.map((s) => {
              const selected = selectedSuggestionIds.includes(s.suggestion_id);
              const recName = recruiterNameById.get(s.recruiter_id) || `#${s.recruiter_id}`;
              return (
                <Stack
                  key={s.suggestion_id}
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.25}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                >
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }}>
                    <Checkbox
                      checked={selected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSuggestionIds((prev) => [...prev, s.suggestion_id]);
                        } else {
                          setSelectedSuggestionIds((prev) => prev.filter((id) => id !== s.suggestion_id));
                        }
                      }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {recName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {toSuggestionDateTime(s.date, s.start_time, s.timezone)} - {toSuggestionDateTime(s.date, s.end_time, s.timezone)}
                    </Typography>
                    <Chip size="small" label={`Score ${Number(s.score || 0).toFixed(2)}`} />
                    <Chip size="small" variant="outlined" label={s.coverage_id || "coverage"} />
                    {s.location_id ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={
                          departments.find((d) => Number(d.id) === Number(s.location_id))?.name ||
                          `Department ${s.location_id}`
                        }
                      />
                    ) : null}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {Array.isArray(s.reasons) && s.reasons.length ? s.reasons.join(", ") : "no reasons"}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Runs history
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Button
            variant="outlined"
            onClick={async () => {
              setLoading(true);
              try {
                const { data } = await smartShifts.manager.listRuns(20);
                setRuns(Array.isArray(data?.items) ? data.items : []);
              } catch (e) {
                setError(e?.response?.data?.error || "Failed to load runs.");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            Refresh Runs
          </Button>
        </Stack>

        <Stack spacing={1}>
          {runs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No runs yet.
            </Typography>
          ) : (
            runs.map((r) => (
              <Stack
                key={r.run_id}
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
              >
                <Typography variant="body2">
                  {r.run_id} • {r.status} • {r.range_start_date} to {r.range_end_date} ({r.timezone || "UTC"})
                </Typography>
                <Button size="small" onClick={() => loadRunDetail(r.run_id)}>
                  Open
                </Button>
              </Stack>
            ))
          )}
        </Stack>

        {runDetail?.run ? (
          <Box sx={{ mt: 1.5, p: 1.25, border: "1px dashed", borderColor: "divider", borderRadius: 1.5 }}>
            <Typography variant="body2" fontWeight={700}>
              Active run: {runDetail.run.run_id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              suggested {runDetail.run.suggested_count} • applied {runDetail.run.applied_count} • failed {runDetail.run.failed_count}
            </Typography>
          </Box>
        ) : null}
      </Paper>
    </Stack>
  );
};

export default SmartShiftPlannerPanel;
