import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  Drawer,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { DateTime } from "luxon";
import { api, smartShifts } from "../../../utils/api";
import { isoFromParts } from "../../../utils/datetime";

const ALL_EMPLOYEES_VALUE = "__ALL_EMPLOYEES__";
const DEFAULT_VISIBLE_SUGGESTIONS = 50;
const RUNS_PAGE_SIZE = 20;

const DEFAULT_COVERAGE = {
  coverage_id: "",
  location_id: "",
  role_key: "",
  days_of_week: [0, 1, 2, 3, 4],
  timezone: "",
  start_time: "09:00",
  end_time: "17:00",
  headcount: 1,
  break_strategy: "fixed_time",
  break_minutes: 30,
  break_paid: false,
};

const DOW = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];
const DOW_LABEL_BY_VALUE = new Map(DOW.map((d) => [Number(d.value), d.label]));

const toDefaultRangeStart = () => DateTime.local().startOf("week").toFormat("yyyy-MM-dd");
const toDefaultRangeEnd = () => DateTime.local().startOf("week").plus({ days: 6 }).toFormat("yyyy-MM-dd");

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

const toWeekKey = (dt) => `${dt.weekYear}-W${String(dt.weekNumber).padStart(2, "0")}`;

const normalizeIdList = (values) =>
  (Array.isArray(values) ? values : [])
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));

const buildWeekKeysInRange = (startDate, endDate) => {
  const start = DateTime.fromISO(startDate || "");
  const end = DateTime.fromISO(endDate || "");
  if (!start.isValid || !end.isValid || end < start) return [];
  let cursor = start.startOf("day");
  const last = end.startOf("day");
  const out = new Set();
  while (cursor <= last) {
    out.add(toWeekKey(cursor));
    cursor = cursor.plus({ days: 1 });
  }
  return Array.from(out).sort();
};

const buildWeekLabel = (weekKey) => {
  const [yearPart, weekPart] = String(weekKey || "").split("-W");
  const year = Number(yearPart);
  const week = Number(weekPart);
  if (!Number.isFinite(year) || !Number.isFinite(week)) return String(weekKey || "Week");
  const start = DateTime.fromObject({ weekYear: year, weekNumber: week, weekday: 1 });
  const end = start.plus({ days: 6 });
  if (!start.isValid || !end.isValid) return `Week ${week}`;
  return `Week ${week} (${start.toFormat("LLL d")} - ${end.toFormat("LLL d")})`;
};

const hasSuggestionWarnings = (suggestion) =>
  Array.isArray(suggestion?.conflicts) && suggestion.conflicts.length > 0;

const SmartShiftPlannerPanel = ({ recruiters = [], departments = [], shifts = [], onApplied }) => {
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
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsStatusFilter, setRunsStatusFilter] = useState("all");
  const [runsSearch, setRunsSearch] = useState("");
  const [runsOffset, setRunsOffset] = useState(0);
  const [runsTotal, setRunsTotal] = useState(0);

  const [includeRecruiterIds, setIncludeRecruiterIds] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [weeksSpan, setWeeksSpan] = useState(4);
  const [targetShiftsPerWeek, setTargetShiftsPerWeek] = useState(1);
  const [onlyWithAvailability, setOnlyWithAvailability] = useState(false);

  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [availabilityPresence, setAvailabilityPresence] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [groupMode, setGroupMode] = useState("week");
  const [weekFocus, setWeekFocus] = useState("current");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [warningsOnly, setWarningsOnly] = useState(false);
  const [suggestionEmployeeFilter, setSuggestionEmployeeFilter] = useState("");
  const [visibleSuggestionCount, setVisibleSuggestionCount] = useState(DEFAULT_VISIBLE_SUGGESTIONS);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [guideOpen, setGuideOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportData, setReportData] = useState(null);
  const [reportTab, setReportTab] = useState("summary");
  const [reportRecruiterId, setReportRecruiterId] = useState("");
  const [reportDepartmentId, setReportDepartmentId] = useState("");
  const [reportEmployeeIds, setReportEmployeeIds] = useState([]);
  const [reportOverrideLoading, setReportOverrideLoading] = useState(false);
  const [reportOverrideByRecruiter, setReportOverrideByRecruiter] = useState({});
  const [hideEmployeeAvailabilityTab, setHideEmployeeAvailabilityTab] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(false);

  const recruiterNameById = useMemo(() => {
    const map = new Map();
    recruiters.forEach((r) => {
      map.set(Number(r.id), r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim());
    });
    return map;
  }, [recruiters]);

  const filteredRecruiters = useMemo(() => {
    if (!selectedDepartment) return recruiters;
    return recruiters.filter((r) => String(r.department_id || "") === String(selectedDepartment));
  }, [recruiters, selectedDepartment]);

  const weekKeysInRange = useMemo(
    () => buildWeekKeysInRange(range.start_date, range.end_date),
    [range.start_date, range.end_date]
  );

  const scopeRecruiterIds = useMemo(
    () => new Set(filteredRecruiters.map((r) => Number(r.id))),
    [filteredRecruiters]
  );

  const effectiveRecruiterIds = useMemo(
    () =>
      includeRecruiterIds.length
        ? normalizeIdList(includeRecruiterIds)
        : filteredRecruiters.map((r) => Number(r.id)),
    [includeRecruiterIds, filteredRecruiters]
  );

  const selectedInScopeCount = useMemo(() => {
    let count = 0;
    effectiveRecruiterIds.forEach((id) => {
      if (scopeRecruiterIds.has(Number(id))) count += 1;
    });
    return count;
  }, [effectiveRecruiterIds, scopeRecruiterIds]);

  const { scheduledRecruiterIds, recruiterWeekShiftCounts } = useMemo(() => {
    const scheduledSet = new Set();
    const byRecruiter = new Map();
    const start = range.start_date || "";
    const end = range.end_date || "";

    shifts.forEach((s) => {
      const rid = Number(s?.recruiter_id);
      if (!scopeRecruiterIds.has(rid)) return;

      const dateStr =
        (s?.date && String(s.date).slice(0, 10)) ||
        (() => {
          const dt = DateTime.fromISO(String(s?.clock_in || ""));
          return dt.isValid ? dt.toFormat("yyyy-MM-dd") : "";
        })();

      if (!dateStr) return;
      if (start && dateStr < start) return;
      if (end && dateStr > end) return;

      scheduledSet.add(rid);
      const dt = DateTime.fromISO(dateStr);
      const wk = dt.isValid ? toWeekKey(dt) : null;
      if (!wk) return;
      if (!byRecruiter.has(rid)) byRecruiter.set(rid, {});
      const rec = byRecruiter.get(rid);
      rec[wk] = (rec[wk] || 0) + 1;
    });

    return { scheduledRecruiterIds: scheduledSet, recruiterWeekShiftCounts: byRecruiter };
  }, [shifts, scopeRecruiterIds, range.start_date, range.end_date]);

  const unscheduledRecruiters = useMemo(
    () => filteredRecruiters.filter((r) => !scheduledRecruiterIds.has(Number(r.id))),
    [filteredRecruiters, scheduledRecruiterIds]
  );

  const { fullScheduledCount, partialScheduledCount, belowTargetRecruiters } = useMemo(() => {
    let full = 0;
    let partial = 0;
    const below = [];
    const target = Math.max(1, Number(targetShiftsPerWeek) || 1);

    filteredRecruiters.forEach((r) => {
      const rid = Number(r.id);
      const weekCounts = recruiterWeekShiftCounts.get(rid) || {};
      if (!weekKeysInRange.length) {
        below.push(r);
        return;
      }

      let weeksMeetingTarget = 0;
      let anyShift = false;
      weekKeysInRange.forEach((wk) => {
        const c = Number(weekCounts[wk] || 0);
        if (c > 0) anyShift = true;
        if (c >= target) weeksMeetingTarget += 1;
      });

      if (weeksMeetingTarget === weekKeysInRange.length) full += 1;
      else if (anyShift) partial += 1;

      if (weeksMeetingTarget < weekKeysInRange.length) below.push(r);
    });

    return { fullScheduledCount: full, partialScheduledCount: partial, belowTargetRecruiters: below };
  }, [filteredRecruiters, recruiterWeekShiftCounts, weekKeysInRange, targetShiftsPerWeek]);

  const loadAvailabilityPresence = useCallback(async () => {
    setAvailabilityLoading(true);
    try {
      const [rulesRes, exceptionsRes] = await Promise.all([
        api.get("/api/smart-shifts/availability-rules"),
        api.get("/api/smart-shifts/exceptions"),
      ]);
      const set = new Set();
      (rulesRes?.data?.items || []).forEach((r) => set.add(Number(r.recruiter_id)));
      (exceptionsRes?.data?.items || []).forEach((e) => set.add(Number(e.recruiter_id)));
      const map = {};
      filteredRecruiters.forEach((r) => {
        map[Number(r.id)] = set.has(Number(r.id));
      });
      setAvailabilityPresence(map);
    } catch {
      setAvailabilityPresence({});
    } finally {
      setAvailabilityLoading(false);
    }
  }, [filteredRecruiters]);

  useEffect(() => {
    loadAvailabilityPresence();
  }, [loadAvailabilityPresence]);

  const loadManagerPolicy = useCallback(async () => {
    setPolicyLoading(true);
    try {
      const { data } = await smartShifts.manager.getPolicy();
      setHideEmployeeAvailabilityTab(Boolean(data?.hide_employee_availability_tab));
    } catch {
      setHideEmployeeAvailabilityTab(false);
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManagerPolicy();
  }, [loadManagerPolicy]);

  const availabilityFilteredRecruiterIds = useMemo(
    () => filteredRecruiters.filter((r) => availabilityPresence[Number(r.id)]).map((r) => Number(r.id)),
    [filteredRecruiters, availabilityPresence]
  );

  const effectiveSuggestRecruiterIds = useMemo(() => {
    const base = normalizeIdList(effectiveRecruiterIds);
    if (!onlyWithAvailability) return base;
    const allowed = new Set(availabilityFilteredRecruiterIds);
    return base.filter((id) => allowed.has(id));
  }, [effectiveRecruiterIds, onlyWithAvailability, availabilityFilteredRecruiterIds]);

  const currentWeekKey = useMemo(() => {
    const dt = DateTime.fromISO(range.start_date || "");
    return dt.isValid ? toWeekKey(dt) : "";
  }, [range.start_date]);

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
        include_recruiter_ids: effectiveSuggestRecruiterIds,
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
        days_of_week: [0, 1, 2, 3, 4],
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

  const fetchRuns = useCallback(
    async ({ reset = false, offsetOverride = 0 } = {}) => {
      setRunsLoading(true);
      try {
        const nextOffset = reset ? 0 : offsetOverride;
        const { data } = await smartShifts.manager.listRuns({
          limit: RUNS_PAGE_SIZE,
          offset: nextOffset,
          status: runsStatusFilter,
          q: runsSearch,
        });
        const items = Array.isArray(data?.items) ? data.items : [];
        const total = Number(data?.paging?.total || 0);
        setRuns((prev) => (reset ? items : [...prev, ...items]));
        setRunsOffset(nextOffset + items.length);
        setRunsTotal(total);
      } catch (e) {
        setError(e?.response?.data?.error || "Failed to load runs.");
      } finally {
        setRunsLoading(false);
      }
    },
    [runsSearch, runsStatusFilter]
  );

  useEffect(() => {
    fetchRuns({ reset: true });
  }, [fetchRuns]);

  const handleSuggest = async ({ onlyBelowTarget = false } = {}) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = buildPayload();
      if (onlyBelowTarget) {
        payload.filters.include_recruiter_ids = belowTargetRecruiters.map((r) => Number(r.id));
      }
      if (!payload.coverage.length) throw new Error("Add at least one valid coverage row.");
      if (!payload.filters.include_recruiter_ids?.length) {
        throw new Error("No eligible employees in current filter.");
      }

      const { data } = await smartShifts.manager.suggest(payload);
      const list = Array.isArray(data?.suggestions) ? data.suggestions : [];
      setLatestRun(data?.run || null);
      setSuggestions(list);
      setSelectedSuggestionIds(list.map((s) => s.suggestion_id));
      setVisibleSuggestionCount(DEFAULT_VISIBLE_SUGGESTIONS);
      setSuccess(`Generated ${list.length} suggestions.`);

      await fetchRuns({ reset: true });
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

      await fetchRuns({ reset: true });
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

  const handleSeedDefaultAvailability = async () => {
    setCoverage([
      {
        ...DEFAULT_COVERAGE,
        coverage_id: "weekday-core",
        days_of_week: [0, 1, 2, 3, 4],
        start_time: "09:00",
        end_time: "17:00",
        headcount: 1,
        timezone: range.timezone || autoTimezone,
      },
    ]);

    const targets = normalizeIdList(effectiveRecruiterIds);
    if (!targets.length) {
      setError("Select at least one employee first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const days = [0, 1, 2, 3, 4];
      let created = 0;
      let skipped = 0;

      for (const recruiterId of targets) {
        for (const day of days) {
          try {
            await api.post("/api/smart-shifts/availability-rules", {
              recruiter_id: recruiterId,
              day_of_week: day,
              start_time: "09:00",
              end_time: "17:00",
              timezone: range.timezone || autoTimezone,
              location_id: null,
              status: "active",
            });
            created += 1;
          } catch (e) {
            const isDup = e?.response?.status === 409 || e?.response?.data?.error === "duplicate_rule";
            if (isDup) {
              skipped += 1;
              continue;
            }
            throw e;
          }
        }
      }

      await loadAvailabilityPresence();
      setSuccess(`Default availability seeded. Created ${created} rules, skipped ${skipped} duplicates.`);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to seed default availability.");
    } finally {
      setLoading(false);
    }
  };

  const loadRunDetail = async (runId) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await smartShifts.manager.getRun(runId);
      const list = Array.isArray(data?.suggestions) ? data.suggestions : [];
      setRunDetail(data || null);
      setLatestRun(data?.run || null);
      setSuggestions(list);
      setSelectedSuggestionIds(
        list
          .filter((s) => (s.status || "").toLowerCase() !== "failed")
          .map((s) => s.suggestion_id)
      );
      setVisibleSuggestionCount(DEFAULT_VISIBLE_SUGGESTIONS);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load run details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeDepartment = (value) => {
    setSelectedDepartment(value);
    if (!value) return;
    const allowed = new Set(
      recruiters
        .filter((r) => String(r.department_id || "") === String(value))
        .map((r) => Number(r.id))
    );
    setIncludeRecruiterIds((prev) => prev.filter((id) => allowed.has(Number(id))));
  };

  const handleSelectAllFilteredEmployees = () => setIncludeRecruiterIds(filteredRecruiters.map((r) => Number(r.id)));
  const handleClearSelectedEmployees = () => setIncludeRecruiterIds([]);
  const handleSelectUnscheduledEmployees = () => setIncludeRecruiterIds(unscheduledRecruiters.map((r) => Number(r.id)));
  const handleSelectBelowTargetEmployees = () => setIncludeRecruiterIds(belowTargetRecruiters.map((r) => Number(r.id)));

  const suggestionsWithMeta = useMemo(() => {
    return suggestions.map((s) => {
      const dt = DateTime.fromISO(String(s?.date || ""));
      const weekKey = dt.isValid ? toWeekKey(dt) : "unknown";
      const dayKey = dt.isValid ? dt.toFormat("yyyy-MM-dd") : String(s?.date || "unknown");
      const employeeKey = String(s?.recruiter_id || "unknown");
      return {
        ...s,
        _weekKey: weekKey,
        _weekLabel: buildWeekLabel(weekKey),
        _dayKey: dayKey,
        _dayLabel: dt.isValid ? dt.toFormat("ccc, LLL d") : dayKey,
        _employeeKey: employeeKey,
      };
    });
  }, [suggestions]);

  const suggestionWeekOptions = useMemo(() => {
    const set = new Set(suggestionsWithMeta.map((s) => s._weekKey).filter(Boolean));
    return Array.from(set).sort();
  }, [suggestionsWithMeta]);

  const focusedWeekKey = useMemo(() => {
    if (weekFocus === "all") return "all";
    if (weekFocus === "current") return currentWeekKey || "all";
    return weekFocus;
  }, [weekFocus, currentWeekKey]);

  const filteredSuggestionRows = useMemo(() => {
    let list = suggestionsWithMeta;
    if (showSelectedOnly) {
      const selectedSet = new Set(selectedSuggestionIds);
      list = list.filter((s) => selectedSet.has(s.suggestion_id));
    }
    if (warningsOnly) {
      list = list.filter((s) => hasSuggestionWarnings(s));
    }
    if (suggestionEmployeeFilter) {
      list = list.filter((s) => String(s.recruiter_id) === String(suggestionEmployeeFilter));
    }
    if (groupMode === "week" && focusedWeekKey !== "all") {
      list = list.filter((s) => s._weekKey === focusedWeekKey);
    }
    return list;
  }, [
    suggestionsWithMeta,
    showSelectedOnly,
    selectedSuggestionIds,
    warningsOnly,
    suggestionEmployeeFilter,
    groupMode,
    focusedWeekKey,
  ]);

  const visibleSuggestionRows = useMemo(
    () => filteredSuggestionRows.slice(0, visibleSuggestionCount),
    [filteredSuggestionRows, visibleSuggestionCount]
  );

  const groupedSuggestionBlocks = useMemo(() => {
    const buckets = new Map();
    visibleSuggestionRows.forEach((s) => {
      let key = s._weekKey;
      let label = s._weekLabel;
      if (groupMode === "day") {
        key = s._dayKey;
        label = s._dayLabel;
      } else if (groupMode === "employee") {
        key = s._employeeKey;
        label = recruiterNameById.get(Number(s.recruiter_id)) || `Employee #${s.recruiter_id}`;
      }
      if (!buckets.has(key)) buckets.set(key, { key, label, items: [] });
      buckets.get(key).items.push(s);
    });

    const out = Array.from(buckets.values());
    out.sort((a, b) => String(a.key).localeCompare(String(b.key)));
    return out;
  }, [visibleSuggestionRows, groupMode, recruiterNameById]);

  useEffect(() => {
    const next = {};
    groupedSuggestionBlocks.forEach((g, idx) => {
      next[g.key] = idx === 0;
    });
    setExpandedGroups(next);
  }, [groupMode, focusedWeekKey, visibleSuggestionCount, suggestions.length]);

  const selectedSet = useMemo(() => new Set(selectedSuggestionIds), [selectedSuggestionIds]);
  const visibleSuggestionIds = useMemo(
    () => visibleSuggestionRows.map((s) => s.suggestion_id).filter(Boolean),
    [visibleSuggestionRows]
  );
  const handleSelectAllVisibleSuggestions = () => {
    setSelectedSuggestionIds((prev) => {
      const merged = new Set(prev);
      visibleSuggestionIds.forEach((id) => merged.add(id));
      return Array.from(merged);
    });
  };
  const handleClearVisibleSuggestions = () => {
    const visible = new Set(visibleSuggestionIds);
    setSelectedSuggestionIds((prev) => prev.filter((id) => !visible.has(id)));
  };

  const handleDeleteRun = async (runId) => {
    if (!window.confirm("Delete this run? This removes suggestion history only. Real shifts will not be deleted.")) {
      return;
    }
    setError("");
    try {
      await smartShifts.manager.deleteRun(runId);
      setSuccess("Run deleted.");
      if (runDetail?.run?.run_id === runId || latestRun?.run_id === runId) {
        setRunDetail(null);
        setLatestRun(null);
        setSuggestions([]);
        setSelectedSuggestionIds([]);
      }
      await fetchRuns({ reset: true });
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to delete run.");
    }
  };

  const reportRecruiterOptions = useMemo(() => {
    const base = reportDepartmentId
      ? recruiters.filter((r) => String(r.department_id || "") === String(reportDepartmentId))
      : recruiters;
    return base;
  }, [recruiters, reportDepartmentId]);

  const loadAvailabilityReport = async (opts = {}) => {
    const departmentId = opts.departmentId ?? reportDepartmentId;
    const employeeIds = opts.employeeIds ?? reportEmployeeIds;
    const recruiterOptions = departmentId
      ? recruiters.filter((r) => String(r.department_id || "") === String(departmentId))
      : recruiters;
    setReportLoading(true);
    setReportError("");
    try {
      const recruiterIds = employeeIds.length
        ? normalizeIdList(employeeIds)
        : recruiterOptions.map((r) => Number(r.id));
      const payload = {
        range,
        recruiter_ids: recruiterIds,
        coverage,
      };
      if (departmentId) payload.department_id = Number(departmentId);
      const { data } = await smartShifts.manager.availabilityReport(payload);
      setReportData(data || null);
      const firstId = data?.items?.[0]?.recruiter_id;
      setReportRecruiterId(firstId ? String(firstId) : "");
    } catch (e) {
      setReportError(e?.response?.data?.error || "Failed to load availability report.");
    } finally {
      setReportLoading(false);
    }
  };

  const openAvailabilityReport = async () => {
    setReportOpen(true);
    const nextDept = selectedDepartment ? String(selectedDepartment) : "";
    const nextEmp = effectiveSuggestRecruiterIds || [];
    setReportDepartmentId(nextDept);
    setReportEmployeeIds(nextEmp);
    loadAvailabilityReport({ departmentId: nextDept, employeeIds: nextEmp });
    loadAvailabilityOverrides({ departmentId: nextDept, employeeIds: nextEmp });
  };

  const loadAvailabilityOverrides = async (opts = {}) => {
    const departmentId = opts.departmentId ?? reportDepartmentId;
    const employeeIds = opts.employeeIds ?? reportEmployeeIds;
    setReportOverrideLoading(true);
    try {
      const params = {};
      if (departmentId) params.department_id = departmentId;
      if (Array.isArray(employeeIds) && employeeIds.length) {
        params.recruiter_ids = employeeIds.join(",");
      }
      const { data } = await smartShifts.manager.getEmployeeOverrides(params);
      const map = {};
      (data?.items || []).forEach((item) => {
        map[Number(item.recruiter_id)] = Boolean(item.availability_override);
      });
      setReportOverrideByRecruiter(map);
    } catch (e) {
      setReportError((prev) => prev || e?.response?.data?.error || "Failed to load availability access overrides.");
      setReportOverrideByRecruiter({});
    } finally {
      setReportOverrideLoading(false);
    }
  };

  const applyAvailabilityOverride = async (enabled) => {
    const targetIds = reportEmployeeIds.length
      ? normalizeIdList(reportEmployeeIds)
      : reportRecruiterOptions.map((r) => Number(r.id));
    if (!targetIds.length) {
      setReportError("Select at least one employee or department with employees.");
      return;
    }
    setReportOverrideLoading(true);
    setReportError("");
    try {
      await smartShifts.manager.putEmployeeOverrides({
        recruiter_ids: targetIds,
        availability_override: Boolean(enabled),
      });
      setSuccess(
        enabled
          ? `Granted availability access override to ${targetIds.length} employee(s).`
          : `Removed availability access override from ${targetIds.length} employee(s).`
      );
      await Promise.all([
        loadAvailabilityReport(),
        loadAvailabilityOverrides(),
        loadManagerPolicy(),
      ]);
    } catch (e) {
      setReportError(e?.response?.data?.error || "Failed to update employee availability overrides.");
    } finally {
      setReportOverrideLoading(false);
    }
  };

  const handleToggleEmployeeAvailability = async (nextValue) => {
    setPolicyLoading(true);
    setError("");
    try {
      const { data } = await smartShifts.manager.putPolicy({
        hide_employee_availability_tab: Boolean(nextValue),
      });
      setHideEmployeeAvailabilityTab(Boolean(data?.hide_employee_availability_tab));
      setSuccess(
        nextValue
          ? "Employee Shift Availability tab is now hidden."
          : "Employee Shift Availability tab is now visible."
      );
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to update Smart Shift policy.");
    } finally {
      setPolicyLoading(false);
    }
  };

  const reportItems = useMemo(() => (Array.isArray(reportData?.items) ? reportData.items : []), [reportData]);
  const selectedReportItem = useMemo(
    () => reportItems.find((i) => String(i.recruiter_id) === String(reportRecruiterId)) || reportItems[0] || null,
    [reportItems, reportRecruiterId]
  );
  const reportRangeLabel = useMemo(() => {
    const start = reportData?.summary?.range_start || range?.start_date;
    const end = reportData?.summary?.range_end || range?.end_date;
    const tz = reportData?.summary?.timezone || range?.timezone || autoTimezone;
    if (!start || !end) return `Timezone: ${tz}`;
    return `Range: ${start} to ${end} (${tz})`;
  }, [reportData, range, autoTimezone]);

  const suggestionSummary = useMemo(() => {
    const total = filteredSuggestionRows.length;
    const selected = filteredSuggestionRows.filter((s) => selectedSet.has(s.suggestion_id)).length;
    const warnings = filteredSuggestionRows.filter((s) => hasSuggestionWarnings(s)).length;
    const fillRate = total > 0 ? Math.round((selected / total) * 100) : 0;
    return { total, selected, warnings, fillRate };
  }, [filteredSuggestionRows, selectedSet]);

  const scheduledCount = scheduledRecruiterIds.size;
  const unscheduledCount = unscheduledRecruiters.length;

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ gap: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Smart Shift</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Generate shift suggestions from employee smart availability, then apply selected rows into real shifts.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
              Timezone auto-detected: {autoTimezone}
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
            <FormControlLabel
              sx={{ ml: 0 }}
              control={
                <Switch
                  size="small"
                  checked={hideEmployeeAvailabilityTab}
                  onChange={(e) => handleToggleEmployeeAvailability(e.target.checked)}
                  disabled={policyLoading}
                />
              }
              label="Hide employee availability tab"
            />
            <Button variant="outlined" size="small" onClick={() => setGuideOpen(true)}>
              Smart Shift Guide
            </Button>
            <Button variant="contained" size="small" onClick={openAvailabilityReport}>
              Availability Report
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Suggestion input</Typography>
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

          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Department filter</InputLabel>
            <Select
              label="Department filter"
              value={selectedDepartment}
              onChange={(e) => handleChangeDepartment(e.target.value)}
            >
              <MenuItem value=""><em>All departments</em></MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>{dept.name || `Department #${dept.id}`}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 260 }}>
            <InputLabel>Employees</InputLabel>
            <Select
              multiple
              label="Employees"
              value={includeRecruiterIds}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes(ALL_EMPLOYEES_VALUE)) {
                  setIncludeRecruiterIds(filteredRecruiters.map((r) => Number(r.id)));
                  return;
                }
                setIncludeRecruiterIds(normalizeIdList(value));
              }}
              renderValue={(selected) =>
                (selected.length ? selected : filteredRecruiters.map((r) => Number(r.id)))
                  .map((id) => recruiterNameById.get(Number(id)) || `#${id}`)
                  .join(", ")
              }
            >
              <MenuItem value={ALL_EMPLOYEES_VALUE}><em>All employees</em></MenuItem>
              {filteredRecruiters.map((r) => (
                <MenuItem key={r.id} value={Number(r.id)}>
                  {r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim() || `#${r.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" size="small" onClick={handleSelectAllFilteredEmployees}>
            Select all in {selectedDepartment ? "department" : "list"}
          </Button>
          <Button variant="outlined" size="small" onClick={handleSelectUnscheduledEmployees}>Select unscheduled</Button>
          <Button variant="outlined" size="small" onClick={handleSelectBelowTargetEmployees}>Select below target</Button>
          <Button variant="text" size="small" onClick={handleClearSelectedEmployees}>Clear selection</Button>
          <Button variant="outlined" size="small" onClick={handleSeedDefaultAvailability} disabled={loading}>
            Seed default availability
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
          <Chip label={`Employees in dept: ${filteredRecruiters.length}`} />
          <Chip label={`Selected: ${selectedInScopeCount}`} />
          <Chip label={`Has shifts in range: ${scheduledCount}`} color={scheduledCount > 0 ? "success" : "default"} />
          <Chip label={`Fully scheduled: ${fullScheduledCount}`} color={fullScheduledCount > 0 ? "success" : "default"} />
          <Chip label={`Partial: ${partialScheduledCount}`} color={partialScheduledCount > 0 ? "warning" : "default"} />
          <Chip
            label={`Below target this range: ${belowTargetRecruiters.length}`}
            color={belowTargetRecruiters.length > 0 ? "warning" : "success"}
            variant={belowTargetRecruiters.length > 0 ? "filled" : "outlined"}
          />
          <Chip
            label={`Unscheduled: ${unscheduledCount}`}
            color={unscheduledCount > 0 ? "warning" : "success"}
            variant={unscheduledCount > 0 ? "filled" : "outlined"}
          />
          <Button size="small" variant="outlined" onClick={() => setShowUnscheduled((v) => !v)}>
            {showUnscheduled ? "Hide unscheduled" : "View unscheduled"}
          </Button>
        </Stack>

        <Collapse in={showUnscheduled}>
          <Paper sx={{ p: 1.25, mt: 1, borderRadius: 1.5 }} variant="outlined">
            {availabilityLoading ? (
              <Typography variant="body2" color="text.secondary">Loading availability status...</Typography>
            ) : unscheduledRecruiters.length === 0 ? (
              <Typography variant="body2" color="text.secondary">All filtered employees have at least one shift in this range.</Typography>
            ) : (
              <Stack spacing={0.75}>
                {unscheduledRecruiters.map((r) => (
                  <Stack key={r.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">
                      {r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim() || `#${r.id}`}
                    </Typography>
                    <Chip
                      size="small"
                      color={availabilityPresence[Number(r.id)] ? "success" : "warning"}
                      label={availabilityPresence[Number(r.id)] ? "Availability exists" : "No availability submitted"}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Collapse>

        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            type="number"
            label="Target shifts/week"
            value={targetShiftsPerWeek}
            onChange={(e) => setTargetShiftsPerWeek(Math.max(1, Number(e.target.value) || 1))}
            sx={{ width: 160 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Plan weeks</InputLabel>
            <Select label="Plan weeks" value={weeksSpan} onChange={(e) => setWeeksSpan(Number(e.target.value))}>
              <MenuItem value={1}>1 week</MenuItem>
              <MenuItem value={4}>4 weeks</MenuItem>
              <MenuItem value={12}>12 weeks</MenuItem>
              <MenuItem value={52}>52 weeks</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => applyRangeByWeeks()}>Set end date from weeks</Button>
          <Button size="small" onClick={() => applyRangeByWeeks(1)}>1w</Button>
          <Button size="small" onClick={() => applyRangeByWeeks(4)}>4w</Button>
          <Button size="small" onClick={() => applyRangeByWeeks(12)}>12w</Button>
          <Button size="small" onClick={() => applyRangeByWeeks(52)}>52w</Button>
          <FormControlLabel
            control={
              <Switch
                checked={onlyWithAvailability}
                onChange={(e) => setOnlyWithAvailability(e.target.checked)}
              />
            }
            label="Apply only employees with submitted availability"
          />
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
                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
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
                    select
                    size="small"
                    label="Target department"
                    value={c.location_id}
                    onChange={(e) =>
                      setCoverage((prev) => prev.map((it, i) => (i === idx ? { ...it, location_id: e.target.value } : it)))
                    }
                  >
                    <MenuItem value=""><em>Any department</em></MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>{dept.name || `Department #${dept.id}`}</MenuItem>
                    ))}
                  </TextField>
                ) : null}

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

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" onClick={applyCoveragePreset}>Load sample coverage</Button>
          <Button
            variant="outlined"
            onClick={() =>
              setCoverage((prev) => [...prev, { ...DEFAULT_COVERAGE, timezone: range.timezone || autoTimezone }])
            }
          >
            Add coverage row
          </Button>
          <Button variant="text" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? "Hide advanced" : "Show advanced"}
          </Button>
          <Button variant="contained" onClick={() => handleSuggest()} disabled={loading}>
            Generate Suggestions
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleSuggest({ onlyBelowTarget: true })}
            disabled={loading || belowTargetRecruiters.length === 0}
          >
            Fill Gaps
          </Button>
          <Button variant="contained" color="success" onClick={handleApply} disabled={loading || !selectedSuggestionIds.length}>
            Apply Selected
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Suggestions</Typography>
        {unscheduledCount > 0 ? (
          <Alert severity="warning" sx={{ mb: 1 }}>
            Warning: {unscheduledCount} employee{unscheduledCount === 1 ? "" : "s"} in this department have no shifts in this range.
          </Alert>
        ) : null}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 1.25 }} flexWrap="wrap" useFlexGap>
          <Chip label={`Suggestions: ${suggestionSummary.total}`} />
          <Chip label={`Selected: ${suggestionSummary.selected}`} color={suggestionSummary.selected > 0 ? "primary" : "default"} />
          <Chip label={`Coverage fill: ${suggestionSummary.fillRate}%`} color={suggestionSummary.fillRate >= 70 ? "success" : "warning"} />
          <Chip label={`Warnings: ${suggestionSummary.warnings}`} color={suggestionSummary.warnings > 0 ? "warning" : "default"} />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 1.25 }} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Group by</InputLabel>
            <Select label="Group by" value={groupMode} onChange={(e) => setGroupMode(e.target.value)}>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="employee">Employee</MenuItem>
            </Select>
          </FormControl>

          {groupMode === "week" ? (
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel>Week focus</InputLabel>
              <Select label="Week focus" value={weekFocus} onChange={(e) => setWeekFocus(e.target.value)}>
                <MenuItem value="current">Current viewed week</MenuItem>
                <MenuItem value="all">All weeks</MenuItem>
                {suggestionWeekOptions.map((wk) => (
                  <MenuItem key={wk} value={wk}>{buildWeekLabel(wk)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          <FormControl size="small" sx={{ minWidth: 230 }}>
            <InputLabel>Employee filter</InputLabel>
            <Select
              label="Employee filter"
              value={suggestionEmployeeFilter}
              onChange={(e) => setSuggestionEmployeeFilter(e.target.value)}
            >
              <MenuItem value="">All employees</MenuItem>
              {filteredRecruiters.map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim() || `#${r.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={showSelectedOnly} onChange={(e) => setShowSelectedOnly(e.target.checked)} />}
            label="Show selected only"
          />
          <FormControlLabel
            control={<Switch checked={warningsOnly} onChange={(e) => setWarningsOnly(e.target.checked)} />}
            label="Warnings only"
          />
          <Button size="small" variant="outlined" onClick={handleSelectAllVisibleSuggestions}>
            Select all visible
          </Button>
          <Button size="small" variant="outlined" onClick={handleClearVisibleSuggestions}>
            Clear visible
          </Button>
        </Stack>

        {filteredSuggestionRows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No suggestions for current filters.</Typography>
        ) : (
          <Stack spacing={1}>
            {groupedSuggestionBlocks.map((group) => (
              <Accordion
                key={group.key}
                expanded={Boolean(expandedGroups[group.key])}
                onChange={(_, expanded) => setExpandedGroups((prev) => ({ ...prev, [group.key]: expanded }))}
                disableGutters
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Typography variant="body2" fontWeight={700}>{group.label}</Typography>
                    <Chip size="small" label={`${group.items.length} suggestion${group.items.length === 1 ? "" : "s"}`} />
                    <Chip size="small" label={`${group.items.filter((s) => selectedSet.has(s.suggestion_id)).length} selected`} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {group.items.map((s) => {
                      const selected = selectedSet.has(s.suggestion_id);
                      const recName = recruiterNameById.get(Number(s.recruiter_id)) || `#${s.recruiter_id}`;
                      const warnings = hasSuggestionWarnings(s);
                      return (
                        <Stack
                          key={s.suggestion_id}
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.25}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", md: "center" }}
                          sx={{ p: 1.25, border: "1px solid", borderColor: warnings ? "warning.main" : "divider", borderRadius: 1.5 }}
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
                            <Typography variant="body2" fontWeight={600}>{recName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {toSuggestionDateTime(s.date, s.start_time, s.timezone)} - {toSuggestionDateTime(s.date, s.end_time, s.timezone)}
                            </Typography>
                            <Chip size="small" label={`Score ${Number(s.score || 0).toFixed(2)}`} />
                            <Chip size="small" variant="outlined" label={s.coverage_id || "coverage"} />
                            {warnings ? <Chip size="small" color="warning" label={`${s.conflicts.length} warning(s)`} /> : null}
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
                </AccordionDetails>
              </Accordion>
            ))}

            {visibleSuggestionRows.length < filteredSuggestionRows.length ? (
              <Button
                variant="outlined"
                onClick={() => setVisibleSuggestionCount((prev) => prev + DEFAULT_VISIBLE_SUGGESTIONS)}
              >
                Load more ({filteredSuggestionRows.length - visibleSuggestionRows.length} remaining)
              </Button>
            ) : null}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Runs history</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={runsStatusFilter}
              onChange={(e) => setRunsStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="preview">Preview</MenuItem>
              <MenuItem value="applied">Applied</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Search run"
            value={runsSearch}
            onChange={(e) => setRunsSearch(e.target.value)}
            placeholder="run id, status, timezone"
          />
          <Button
            variant="outlined"
            onClick={() => fetchRuns({ reset: true })}
            disabled={runsLoading}
          >
            Refresh Runs
          </Button>
          <Chip size="small" label={`Showing ${runs.length} of ${runsTotal}`} />
        </Stack>

        <Stack spacing={1}>
          {runs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No runs yet.</Typography>
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
                  {String(r.run_id).slice(0, 10)}... • {r.status} • {r.range_start_date} to {r.range_end_date} ({r.timezone || "UTC"})
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => loadRunDetail(r.run_id)}>Open</Button>
                  <Button size="small" color="error" onClick={() => handleDeleteRun(r.run_id)}>Delete</Button>
                </Stack>
              </Stack>
            ))
          )}
        </Stack>
        {runs.length < runsTotal ? (
          <Button
            variant="outlined"
            sx={{ mt: 1.25 }}
            onClick={() => fetchRuns({ reset: false, offsetOverride: runsOffset })}
            disabled={runsLoading}
          >
            Load more runs
          </Button>
        ) : null}

        {runDetail?.run ? (
          <Box sx={{ mt: 1.5, p: 1.25, border: "1px dashed", borderColor: "divider", borderRadius: 1.5 }}>
            <Typography variant="body2" fontWeight={700}>Active run: {runDetail.run.run_id}</Typography>
            <Typography variant="caption" color="text.secondary">
              suggested {runDetail.run.suggested_count} • applied {runDetail.run.applied_count} • failed {runDetail.run.failed_count}
            </Typography>
          </Box>
        ) : null}
      </Paper>

      <Drawer
        anchor="right"
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 460 }, p: 2 } }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>Smart Shift Guide</Typography>
            <Button size="small" onClick={() => setGuideOpen(false)}>Close</Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            End-to-end guide for planning shifts quickly and safely.
          </Typography>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>1) Quick workflow</Typography>
            <Typography variant="body2">
              1. Pick date range and department. 2. Select employees (or keep empty to include all filtered).
              3. Set coverage row(s). 4. Generate suggestions. 5. Review and Apply Selected.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>2) Department and employee picker</Typography>
            <Typography variant="body2">
              Department filter narrows the pool. Employee selection is optional:
              if you leave it empty, Smart Shift uses all employees in the filtered department.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>3) Headcount vs selected employees</Typography>
            <Typography variant="body2">
              Headcount means how many employees are required per coverage slot.
              Selected employees are the candidate pool.
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Example: IT has 20 staff. If headcount = 10, Smart Shift tries to place 10 per slot.
              If headcount = 1, it places 1 per slot even if 10 employees are selected.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>4) New employees with no availability</Typography>
            <Typography variant="body2">
              Use <strong>Seed default availability</strong> to create Mon–Fri 09:00–17:00
              for selected employees. This also resets planner coverage to the same default set.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>5) Range health chips</Typography>
            <Typography variant="body2">
              Fully scheduled, Partial, Below target, and Unscheduled are computed for the selected date range.
              Use <strong>Select below target</strong> or <strong>Select unscheduled</strong> for targeted fixes.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>6) Availability-only mode</Typography>
            <Typography variant="body2">
              Toggle <strong>Apply only employees with submitted availability</strong> to exclude employees
              who have no rules/exceptions from suggestion generation.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>7) Suggestions panel controls</Typography>
            <Typography variant="body2">
              Group by Week/Day/Employee, focus a specific week, show selected only, warnings only,
              and filter by employee to manage large result sets.
            </Typography>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>8) Runs history</Typography>
            <Typography variant="body2">
              Use runs to reopen previous previews/applies. Keep list compact by default and refresh when needed.
            </Typography>
          </Box>
        </Stack>
      </Drawer>

      <Drawer
        anchor="right"
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 620 }, p: 2 } }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>Availability Report</Typography>
            <Button size="small" onClick={() => setReportOpen(false)}>Close</Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            One-click manager report for employee availability inputs, exceptions, and blocked-day reasons.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {reportRangeLabel}
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Department</InputLabel>
              <Select
                label="Department"
                value={reportDepartmentId}
                onChange={(e) => {
                  setReportDepartmentId(e.target.value);
                  setReportEmployeeIds([]);
                }}
              >
                <MenuItem value=""><em>All departments</em></MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={`report-dept-${dept.id}`} value={String(dept.id)}>
                    {dept.name || `Department #${dept.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Employees</InputLabel>
              <Select
                multiple
                label="Employees"
                value={reportEmployeeIds}
                onChange={(e) => setReportEmployeeIds(normalizeIdList(e.target.value))}
                renderValue={(selected) =>
                  selected.length
                    ? selected.map((id) => recruiterNameById.get(Number(id)) || `#${id}`).join(", ")
                    : "All in filter"
                }
              >
                {reportRecruiterOptions.map((r) => (
                  <MenuItem key={`report-rec-${r.id}`} value={Number(r.id)}>
                    {r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim() || `#${r.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={async () => {
                await Promise.all([loadAvailabilityReport(), loadAvailabilityOverrides()]);
              }}
              disabled={reportLoading || reportOverrideLoading}
            >
              Refresh
            </Button>
          </Stack>

          <Paper variant="outlined" sx={{ p: 1.25 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Employee Availability Access Overrides
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Use this when global "Hide employee availability tab" is ON. Overrides allow selected employees to still access and submit their availability.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="contained"
                onClick={() => applyAvailabilityOverride(true)}
                disabled={reportOverrideLoading}
              >
                Grant access for selected/filter
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => applyAvailabilityOverride(false)}
                disabled={reportOverrideLoading}
              >
                Remove access for selected/filter
              </Button>
              <Chip
                size="small"
                label={`Overrides in report: ${Object.values(reportOverrideByRecruiter).filter(Boolean).length}`}
                color="info"
              />
            </Stack>
          </Paper>

          <Tabs value={reportTab} onChange={(_, v) => setReportTab(v)}>
            <Tab label="Summary" value="summary" />
            <Tab label="Details" value="details" />
          </Tabs>

          {reportLoading ? (
            <Alert severity="info">Loading report...</Alert>
          ) : reportError ? (
            <Alert severity="error">{reportError}</Alert>
          ) : null}

          {reportTab === "summary" ? (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`Employees: ${reportData?.summary?.employees ?? 0}`} />
                <Chip label={`With availability: ${reportData?.summary?.with_availability ?? 0}`} color="success" />
                <Chip label={`Without availability: ${reportData?.summary?.without_availability ?? 0}`} color="warning" />
                <Chip label={`Overrides enabled: ${reportData?.summary?.availability_override_enabled ?? 0}`} color="info" />
                <Chip label={`Blocked days total: ${reportData?.summary?.blocked_days_total ?? 0}`} />
                <Chip label={`Range days: ${reportData?.summary?.date_span_days ?? 0}`} />
              </Stack>

              {!reportItems.length ? (
                <Typography variant="body2" color="text.secondary">No report rows.</Typography>
              ) : (
                reportItems.map((row) => (
                  <Paper key={`report-row-${row.recruiter_id}`} variant="outlined" sx={{ p: 1.25 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{row.name || `#${row.recruiter_id}`}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.email || "—"}</Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() => {
                          setReportRecruiterId(String(row.recruiter_id));
                          setReportTab("details");
                        }}
                      >
                        View details
                      </Button>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={`Rules: ${row?.summary?.rules_count ?? 0}`} />
                      <Chip size="small" label={`Exceptions: ${row?.summary?.exceptions_count ?? 0}`} />
                      <Chip size="small" label={`Leaves: ${row?.summary?.leave_count ?? 0}`} />
                      <Chip
                        size="small"
                        label={
                          (row?.availability_override ?? reportOverrideByRecruiter[Number(row?.recruiter_id)])
                            ? "Availability access: override ON"
                            : "Availability access: default"
                        }
                        color={
                          (row?.availability_override ?? reportOverrideByRecruiter[Number(row?.recruiter_id)])
                            ? "info"
                            : "default"
                        }
                      />
                      <Chip size="small" label={`Schedulable: ${row?.summary?.schedulable_days ?? 0}`} color="success" />
                      <Chip size="small" label={`Blocked: ${row?.summary?.blocked_days ?? 0}`} color={(row?.summary?.blocked_days ?? 0) > 0 ? "warning" : "default"} />
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          ) : (
            <Stack spacing={1.25}>
              <FormControl size="small">
                <InputLabel>Employee</InputLabel>
                <Select
                  label="Employee"
                  value={reportRecruiterId}
                  onChange={(e) => setReportRecruiterId(e.target.value)}
                >
                  {reportItems.map((row) => (
                    <MenuItem key={`report-emp-${row.recruiter_id}`} value={String(row.recruiter_id)}>
                      {row.name || `#${row.recruiter_id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedReportItem ? (
                <Stack spacing={1}>
                  <Paper variant="outlined" sx={{ p: 1.25 }}>
                    <Typography variant="body2" fontWeight={700}>Employee Inputs</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Rules: {selectedReportItem?.rules?.length ?? 0} • Exceptions: {selectedReportItem?.exceptions?.length ?? 0}
                    </Typography>
                    <Box sx={{ mt: 0.75 }}>
                      <Chip
                        size="small"
                        label={
                          (selectedReportItem?.availability_override ??
                            reportOverrideByRecruiter[Number(selectedReportItem?.recruiter_id)])
                            ? "Availability access override: ON"
                            : "Availability access override: OFF"
                        }
                        color={
                          (selectedReportItem?.availability_override ??
                            reportOverrideByRecruiter[Number(selectedReportItem?.recruiter_id)])
                            ? "info"
                            : "default"
                        }
                      />
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      {(selectedReportItem?.rules || []).slice(0, 12).map((r) => (
                        <Typography key={`rr-${r.id}`} variant="body2">
                          {(DOW_LABEL_BY_VALUE.get(Number(r.day_of_week)) || `DOW ${r.day_of_week}`)} • {r.start_time} - {r.end_time} • {r.status}
                        </Typography>
                      ))}
                      {(selectedReportItem?.rules || []).length > 12 ? (
                        <Typography variant="caption" color="text.secondary">
                          +{(selectedReportItem?.rules || []).length - 12} more rules
                        </Typography>
                      ) : null}
                    </Box>
                    {(selectedReportItem?.exceptions || []).length ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Exceptions in range</Typography>
                        {(selectedReportItem?.exceptions || []).slice(0, 10).map((ex) => (
                          <Typography key={`rex-${ex.id}`} variant="body2">
                            {ex.date} • {ex.exception_type}
                            {ex.start_time && ex.end_time ? ` • ${ex.start_time}-${ex.end_time}` : ""}
                          </Typography>
                        ))}
                      </Box>
                    ) : null}
                    {selectedReportItem?.preference ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Scheduling preferences</Typography>
                        <Typography variant="body2">
                          Max hours/week: {selectedReportItem.preference.max_hours_per_week ?? "—"} • Min rest: {selectedReportItem.preference.min_hours_between_shifts ?? "—"}h
                        </Typography>
                        <Typography variant="body2">
                          Preferred days: {Array.isArray(selectedReportItem.preference.preferred_days) && selectedReportItem.preference.preferred_days.length
                            ? selectedReportItem.preference.preferred_days
                                .map((n) => DOW_LABEL_BY_VALUE.get(Number(n)) || String(n))
                                .join(", ")
                            : "—"}
                        </Typography>
                      </Box>
                    ) : null}
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 1.25 }}>
                    <Typography variant="body2" fontWeight={700}>Blocked Date Reasons</Typography>
                    {!(selectedReportItem?.missing_by_date || []).length ? (
                      <Typography variant="body2" color="text.secondary">No blocked dates in current range.</Typography>
                    ) : (
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {(selectedReportItem?.missing_by_date || []).slice(0, 60).map((m, idx) => (
                          <Typography key={`rm-${idx}`} variant="body2">
                            {m.date} • {m.code} • {m.message}
                          </Typography>
                        ))}
                        {(selectedReportItem?.missing_by_date || []).length > 60 ? (
                          <Typography variant="caption" color="text.secondary">
                            +{(selectedReportItem?.missing_by_date || []).length - 60} more reason rows
                          </Typography>
                        ) : null}
                      </Stack>
                    )}
                  </Paper>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No employee selected.</Typography>
              )}
            </Stack>
          )}
        </Stack>
      </Drawer>
    </Stack>
  );
};

export default SmartShiftPlannerPanel;
