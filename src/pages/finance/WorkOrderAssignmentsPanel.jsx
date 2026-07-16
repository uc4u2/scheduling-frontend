import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useSnackbar } from "notistack";
import ThemedDateField, { ThemedTimeField } from "../../components/ui/ThemedDateField";
import {
  createWorkOrderAssignment,
  deleteWorkOrderAssignment,
  listAssignmentDepartments,
  listRecruitersForAssignment,
  updateWorkOrderAssignment,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";
import { formatAssignmentDateRange, groupAssignmentRows } from "./assignmentGrouping";

const buildBlankForm = (timezone, workDate = "") => ({
  recruiter_id: "",
  recruiter_ids: [],
  work_date: workDate,
  range_start: workDate,
  range_end: workDate,
  start_time: "",
  end_time: "",
  planned_hours: "",
  timezone: timezone || "UTC",
  notes: "",
  can_submit_report: false,
  can_report_materials: false,
  can_upload_files: false,
  is_lead_reporter: false,
});

const mapAssignmentError = (err, tAssignments) => {
  const code = err?.response?.data?.error || err?.message;
  switch (code) {
    case "assignment_overlap_conflict":
      return tAssignments("errors.assignmentOverlap", "This team member is already assigned during that time.");
    case "approved_leave_conflict":
      return tAssignments("errors.approvedLeaveConflict", "This team member has approved leave on that date/time.");
    case "recruiter_archived":
      return tAssignments("errors.recruiterArchived", "This team member is inactive or archived.");
    case "recruiter_not_found":
      return tAssignments("errors.recruiterNotFound", "Team member was not found for this company.");
    case "work_date_required":
      return tAssignments("errors.chooseWorkDate", "Choose a work date.");
    default:
      return code || tAssignments("errors.saveFailed", "Unable to save assignment.");
  }
};

const derivePlannedHours = (startTime, endTime) => {
  if (!startTime || !endTime || endTime <= startTime) return "";
  const [startHours, startMinutes] = String(startTime).split(":").map(Number);
  const [endHours, endMinutes] = String(endTime).split(":").map(Number);
  if ([startHours, startMinutes, endHours, endMinutes].some((value) => Number.isNaN(value))) return "";
  const startTotalMinutes = (startHours * 60) + startMinutes;
  const endTotalMinutes = (endHours * 60) + endMinutes;
  if (endTotalMinutes <= startTotalMinutes) return "";
  return ((endTotalMinutes - startTotalMinutes) / 60).toFixed(2);
};

const buildDepartmentMap = (departments = []) => {
  const map = new Map();
  (departments || []).forEach((department) => {
    if (!department?.id) return;
    map.set(String(department.id), department.name || `Department #${department.id}`);
  });
  return map;
};

const expandDateRange = (startValue, endValue) => {
  if (!startValue || !endValue) return [];
  const start = new Date(`${startValue}T00:00:00`);
  const end = new Date(`${endValue}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
  const values = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    values.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return values;
};

const buildAssignmentDates = (form, scheduleMode) => {
  if (scheduleMode === "date_range") {
    return expandDateRange(form.range_start, form.range_end);
  }
  return form.work_date ? [form.work_date] : [];
};

export default function WorkOrderAssignmentsPanel({ workOrder, onChanged }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tAssignments = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.workOrders.assignments.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [recruiters, setRecruiters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [recruitersError, setRecruitersError] = useState("");
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(buildBlankForm(workOrder?.timezone, workOrder?.start_date || ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mode, setMode] = useState("single");
  const [scheduleMode, setScheduleMode] = useState("single_day");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [bulkFailures, setBulkFailures] = useState([]);
  const [availabilityWarnings, setAvailabilityWarnings] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});

  const items = useMemo(() => Array.isArray(workOrder?.assignments) ? workOrder.assignments : [], [workOrder]);
  const groupedItems = useMemo(() => groupAssignmentRows(items), [items]);
  const departmentNameById = useMemo(() => buildDepartmentMap(departments), [departments]);
  const departmentOptions = useMemo(() => {
    const recruiterDepartmentIds = new Set(
      recruiters
        .map((row) => row?.department_id)
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value))
    );
    return departments.filter((department) => recruiterDepartmentIds.has(String(department.id)));
  }, [departments, recruiters]);
  const filteredRecruiters = useMemo(() => {
    if (departmentFilter === "all") return recruiters;
    return recruiters.filter((row) => String(row.department_id || "") === String(departmentFilter));
  }, [departmentFilter, recruiters]);
  const assignmentDates = useMemo(() => buildAssignmentDates(form, scheduleMode), [form, scheduleMode]);
  const selectedRecruiterCount = useMemo(() => {
    if (mode === "single") return form.recruiter_id ? 1 : 0;
    return Array.from(new Set((form.recruiter_ids || []).filter(Boolean))).length;
  }, [form.recruiter_id, form.recruiter_ids, mode]);
  const previewAssignmentCount = useMemo(
    () => selectedRecruiterCount * assignmentDates.length,
    [assignmentDates.length, selectedRecruiterCount]
  );

  useEffect(() => {
    let mounted = true;
    const loadDirectory = async () => {
      setLoadingRecruiters(true);
      setRecruitersError("");
      try {
        const [rows, deptRows] = await Promise.all([
          listRecruitersForAssignment(),
          listAssignmentDepartments(),
        ]);
        if (!mounted) return;
        setRecruiters(rows.filter((row) => !row.archived_at));
        setDepartments(Array.isArray(deptRows) ? deptRows : []);
      } catch (err) {
        if (!mounted) return;
        setRecruitersError(err?.response?.data?.error || err?.message || tAssignments("errors.loadTeamMembersFailed", "Unable to load team members."));
      } finally {
        if (mounted) setLoadingRecruiters(false);
      }
    };
    loadDirectory();
    return () => {
      mounted = false;
    };
  }, [tAssignments]);

  useEffect(() => {
    setForm((current) => ({ ...current, timezone: workOrder?.timezone || current.timezone || "UTC" }));
  }, [workOrder?.timezone]);

  const derivedPlannedHours = useMemo(
    () => derivePlannedHours(form.start_time, form.end_time),
    [form.end_time, form.start_time]
  );

  useEffect(() => {
    if (!derivedPlannedHours) return;
    setForm((current) => {
      if (current.planned_hours === derivedPlannedHours) return current;
      return { ...current, planned_hours: derivedPlannedHours };
    });
  }, [derivedPlannedHours]);

  const openAdd = () => {
    setEditingId(null);
    setError("");
    setBulkFailures([]);
    setAvailabilityWarnings([]);
    setMode("single");
    setScheduleMode("single_day");
    setDepartmentFilter("all");
    setShowAdvanced(false);
    setForm(buildBlankForm(workOrder?.timezone, workOrder?.start_date || ""));
    setFormOpen(true);
  };

  const openEdit = (row) => {
    const recruiter = recruiters.find((entry) => String(entry.id) === String(row.recruiter_id));
    setEditingId(row.id);
    setError("");
    setBulkFailures([]);
    setAvailabilityWarnings([]);
    setMode("single");
    setScheduleMode("single_day");
    setDepartmentFilter(recruiter?.department_id ? String(recruiter.department_id) : "all");
    setShowAdvanced(Boolean(row.can_submit_report || row.can_report_materials || row.can_upload_files || row.is_lead_reporter));
    setForm({
      recruiter_id: row.recruiter_id || "",
      recruiter_ids: [],
      work_date: row.work_date || "",
      range_start: row.work_date || "",
      range_end: row.work_date || "",
      start_time: row.start_time || "",
      end_time: row.end_time || "",
      planned_hours: row.planned_hours ?? "",
      timezone: row.timezone || workOrder?.timezone || "UTC",
      notes: row.notes || "",
      can_submit_report: !!row.can_submit_report,
      can_report_materials: !!row.can_report_materials,
      can_upload_files: !!row.can_upload_files,
      is_lead_reporter: !!row.is_lead_reporter,
    });
    setFormOpen(true);
  };

  const validate = () => {
    if (mode === "single" && !form.recruiter_id) return tAssignments("errors.chooseTeamMember", "Choose a team member.");
    if (mode === "bulk" && !(Array.isArray(form.recruiter_ids) && form.recruiter_ids.length)) return tAssignments("errors.chooseAtLeastOne", "Choose at least one team member.");
    if (scheduleMode === "single_day" && !form.work_date) return tAssignments("errors.chooseWorkDate", "Choose a work date.");
    if (scheduleMode === "date_range" && !form.range_start) return tAssignments("errors.chooseRangeStart", "Choose a start date.");
    if (scheduleMode === "date_range" && !form.range_end) return tAssignments("errors.chooseRangeEnd", "Choose an end date.");
    if (scheduleMode === "date_range" && form.range_end < form.range_start) return tAssignments("errors.rangeEndAfterStart", "End date must be on or after the start date.");
    if (!form.start_time && !form.end_time && !form.planned_hours) return tAssignments("errors.enterHoursOrTime", "Enter planned hours or choose a start and end time.");
    if ((form.start_time && !form.end_time) || (!form.start_time && form.end_time)) return tAssignments("errors.chooseBothTimes", "Choose both a start time and an end time.");
    if (form.start_time && form.end_time && form.end_time <= form.start_time) return tAssignments("errors.endAfterStart", "End time must be after start time.");
    if (!form.start_time && !form.end_time && Number(form.planned_hours || 0) <= 0) return tAssignments("errors.hoursGreaterThanZero", "Planned hours must be greater than 0.");
    return "";
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    setBulkFailures([]);
    setAvailabilityWarnings([]);
    const payload = {
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      planned_hours: form.planned_hours || null,
      timezone: form.timezone || workOrder?.timezone || null,
      notes: form.notes || null,
      can_submit_report: !!form.can_submit_report,
      can_report_materials: !!form.can_report_materials,
      can_upload_files: !!form.can_upload_files,
      is_lead_reporter: !!form.is_lead_reporter,
    };
    try {
      if (editingId) {
        const response = await updateWorkOrderAssignment(editingId, {
          ...payload,
          work_date: form.work_date,
        });
        const warnings = Array.isArray(response?.warnings) ? response.warnings : [];
        setAvailabilityWarnings(warnings);
        enqueueSnackbar(tAssignments("snackbar.assignmentUpdated", "Assignment updated."), { variant: "success" });
        if (warnings.length) {
          enqueueSnackbar(
            tAssignments("warnings.updatedWithWarnings", "Assignment saved with scheduling warnings."),
            { variant: "warning" }
          );
        }
        setFormOpen(false);
        await onChanged?.();
      } else if (mode === "bulk") {
        const uniqueRecruiterIds = Array.from(new Set((form.recruiter_ids || []).filter(Boolean)));
        const plannedDates = assignmentDates;
        let successCount = 0;
        const failures = [];
        const warnings = [];
        for (const recruiterId of uniqueRecruiterIds) {
          for (const workDate of plannedDates) {
            try {
              const response = await createWorkOrderAssignment(workOrder.id, {
                ...payload,
                recruiter_id: recruiterId,
                work_date: workDate,
                planned_hours: payload.planned_hours || null,
              });
              successCount += 1;
              if (Array.isArray(response?.warnings) && response.warnings.length) {
                const recruiter = recruiters.find((row) => String(row.id) === String(recruiterId));
                response.warnings.forEach((warning) => {
                  warnings.push({
                    recruiterId,
                    name: recruiter?.name || recruiter?.email || tAssignments("fallbacks.teamMemberId", "Team member #{{id}}", { id: recruiterId }),
                    workDate,
                    message: warning?.message || tAssignments("warnings.generic", "Scheduling warning."),
                  });
                });
              }
            } catch (err) {
              const recruiter = recruiters.find((row) => String(row.id) === String(recruiterId));
              failures.push({
                recruiterId,
                workDate,
                name: recruiter?.name || recruiter?.email || tAssignments("fallbacks.teamMemberId", "Team member #{{id}}", { id: recruiterId }),
                message: mapAssignmentError(err, tAssignments),
              });
            }
          }
        }
        setBulkFailures(failures);
        setAvailabilityWarnings(warnings);
        if (successCount > 0 && failures.length === 0) {
          enqueueSnackbar(tAssignments(successCount === 1 ? "snackbar.addedOne" : "snackbar.addedMany", successCount === 1 ? "Added {{count}} assignment row." : "Added {{count}} assignment rows.", { count: successCount }), { variant: "success" });
        } else if (successCount > 0) {
          enqueueSnackbar(tAssignments("snackbar.addedWithFailures", "Added {{successCount}} assignment rows. {{failureCount}} could not be added.", { successCount, failureCount: failures.length }), { variant: "warning" });
        } else {
          setError(tAssignments("errors.noneAdded", "No team members could be added."));
        }
        if (warnings.length) {
          enqueueSnackbar(
            tAssignments("warnings.bulkCreatedWithWarnings", "{{count}} assignment rows were created with scheduling warnings.", { count: warnings.length }),
            { variant: "warning" }
          );
        }
        if (successCount > 0) {
          setFormOpen(false);
          await onChanged?.();
        }
      } else {
        const warnings = [];
        for (const workDate of assignmentDates) {
          const response = await createWorkOrderAssignment(workOrder.id, { ...payload, recruiter_id: form.recruiter_id, work_date: workDate });
          if (Array.isArray(response?.warnings) && response.warnings.length) {
            warnings.push(...response.warnings);
          }
        }
        setAvailabilityWarnings(warnings);
        enqueueSnackbar(tAssignments("snackbar.teamMemberAssigned", "Team member assigned."), { variant: "success" });
        if (warnings.length) {
          enqueueSnackbar(
            tAssignments("warnings.createdWithWarnings", "Assignment created with scheduling warnings."),
            { variant: "warning" }
          );
        }
        setFormOpen(false);
        await onChanged?.();
      }
    } catch (err) {
      setError(mapAssignmentError(err, tAssignments));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    try {
      await deleteWorkOrderAssignment(row.id);
      enqueueSnackbar(tAssignments("snackbar.assignmentRemoved", "Assignment removed."), { variant: "success" });
      onChanged?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tAssignments("errors.removeFailed", "Unable to remove assignment."), { variant: "error" });
    }
  };

  const toggleGroup = (groupKey) => {
    setExpandedGroups((current) => ({ ...current, [groupKey]: !current[groupKey] }));
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="h6" fontWeight={800}>{tAssignments("title", "Assign Team")}</Typography>
          <Typography variant="body2" color="text.secondary">{tAssignments("description", "Plan each day by team member.")}</Typography>
        </Box>
        <Button variant="contained" onClick={openAdd}>{tAssignments("addTeamMember", "Add Team Member")}</Button>
      </Stack>

      {recruitersError ? <Alert severity="warning">{recruitersError}</Alert> : null}

      <Collapse in={formOpen}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 1,
            borderColor: alpha(theme.palette.primary.main, 0.25),
            backgroundColor: alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
              <Typography variant="subtitle2" fontWeight={700}>{tAssignments("mode.title", "Mode")}</Typography>
              <Stack direction="row" spacing={1} useFlexGap>
                <Button
                  size="small"
                  variant={mode === "single" ? "contained" : "outlined"}
                  onClick={() => {
                    setMode("single");
                    setBulkFailures([]);
                    setForm((current) => ({ ...current, recruiter_ids: [] }));
                  }}
                  disabled={Boolean(editingId)}
                >
                  {tAssignments("mode.single", "One team member")}
                </Button>
                <Button
                  size="small"
                  variant={mode === "bulk" ? "contained" : "outlined"}
                  onClick={() => {
                    setMode("bulk");
                    setBulkFailures([]);
                    setForm((current) => ({ ...current, recruiter_id: "" }));
                  }}
                  disabled={Boolean(editingId)}
                >
                  {tAssignments("mode.bulk", "Multiple team members")}
                </Button>
              </Stack>
            </Stack>

            {!editingId ? (
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>{tAssignments("filters.department", "Department")}</InputLabel>
                  <Select
                    label={tAssignments("filters.department", "Department")}
                    value={departmentFilter}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setDepartmentFilter(nextValue);
                      setForm((current) => ({
                        ...current,
                        recruiter_id:
                          mode === "single" && nextValue !== "all" && String(filteredRecruiters.find((row) => String(row.id) === String(current.recruiter_id))?.department_id || "") !== String(nextValue)
                            ? ""
                            : current.recruiter_id,
                        recruiter_ids:
                          mode === "bulk"
                            ? (current.recruiter_ids || []).filter((id) => {
                                const recruiter = recruiters.find((row) => String(row.id) === String(id));
                                return nextValue === "all" || String(recruiter?.department_id || "") === String(nextValue);
                              })
                            : current.recruiter_ids,
                      }));
                    }}
                  >
                    <MenuItem value="all">{tAssignments("filters.allDepartments", "All departments")}</MenuItem>
                    {departmentOptions.map((department) => (
                      <MenuItem key={department.id} value={String(department.id)}>
                        {department.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: { md: 260 } }}>
                  <Typography variant="subtitle2" fontWeight={700}>{tAssignments("schedule.title", "Schedule")}</Typography>
                  <Button
                    size="small"
                    variant={scheduleMode === "single_day" ? "contained" : "outlined"}
                    onClick={() => setScheduleMode("single_day")}
                    disabled={saving}
                  >
                    {tAssignments("schedule.singleDay", "Single day")}
                  </Button>
                  <Button
                    size="small"
                    variant={scheduleMode === "date_range" ? "contained" : "outlined"}
                    onClick={() => setScheduleMode("date_range")}
                    disabled={saving}
                  >
                    {tAssignments("schedule.dateRange", "Date range")}
                  </Button>
                </Stack>
              </Stack>
            ) : null}

            {mode === "bulk" ? (
              <Alert severity="info">{tAssignments("bulkInfo", "Use bulk assignment when several team members share the same date and time.")}</Alert>
            ) : null}

            {bulkFailures.length ? (
              <Alert severity="warning">
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>{tAssignments("bulkFailuresTitle", "Could not add:")}</Typography>
                {bulkFailures.map((failure) => (
                  <Typography key={`${failure.recruiterId}-${failure.workDate || "single"}-${failure.name}`} variant="body2">
                    - {failure.name}{failure.workDate ? ` • ${failure.workDate}` : ""}: {failure.message}
                  </Typography>
                ))}
              </Alert>
            ) : null}

            {availabilityWarnings.length ? (
              <Alert severity="warning">
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                  {tAssignments("warnings.title", "Scheduling warnings")}
                </Typography>
                {availabilityWarnings.slice(0, 8).map((warning, index) => (
                  <Typography key={`${warning.name || "assignment"}-${warning.workDate || "single"}-${index}`} variant="body2">
                    - {warning.name ? `${warning.name}${warning.workDate ? ` • ${warning.workDate}` : ""}: ` : ""}{warning.message}
                  </Typography>
                ))}
                {availabilityWarnings.length > 8 ? (
                  <Typography variant="body2">
                    {tAssignments("warnings.more", "And {{count}} more warning(s).", { count: availabilityWarnings.length - 8 })}
                  </Typography>
                ) : null}
              </Alert>
            ) : null}

            {mode === "single" ? (
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>{tAssignments("fields.teamMember", "Team member")}</InputLabel>
                  <Select
                    label={tAssignments("fields.teamMember", "Team member")}
                    value={form.recruiter_id || ""}
                    onChange={(e) => setForm((current) => ({ ...current, recruiter_id: e.target.value }))}
                    disabled={loadingRecruiters || saving}
                  >
                    <MenuItem value="">{tAssignments("fields.selectTeamMember", "Select team member")}</MenuItem>
                    {filteredRecruiters.map((row) => (
                      <MenuItem key={row.id} value={row.id}>
                        {row.name}
                        {row.hourly_rate != null ? ` • ${row.hourly_rate}/hr` : ""}
                        {row.department_id ? ` • ${departmentNameById.get(String(row.department_id)) || tAssignments("filters.unknownDepartment", "Department #{{id}}", { id: row.department_id })}` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {scheduleMode === "date_range" && !editingId ? (
                  <>
                    <ThemedDateField
                      label={tAssignments("fields.fromDate", "From")}
                      name="range_start"
                      value={form.range_start}
                      onChange={(e) => setForm((current) => ({ ...current, range_start: e.target.value }))}
                      fullWidth
                    />
                    <ThemedDateField
                      label={tAssignments("fields.toDate", "To")}
                      name="range_end"
                      value={form.range_end}
                      onChange={(e) => setForm((current) => ({ ...current, range_end: e.target.value }))}
                      fullWidth
                    />
                  </>
                ) : (
                  <ThemedDateField
                    label={tAssignments("fields.workDate", "Work date")}
                    name="work_date"
                    value={form.work_date}
                    onChange={(e) => setForm((current) => ({ ...current, work_date: e.target.value }))}
                    fullWidth
                  />
                )}
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {tAssignments("bulk.visibleCount", "{{count}} visible team members", { count: filteredRecruiters.length })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tAssignments("bulk.selectedCount", "{{count}} selected", { count: (form.recruiter_ids || []).length })}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      onClick={() => {
                        setForm((current) => ({
                          ...current,
                          recruiter_ids: Array.from(new Set(filteredRecruiters.map((row) => row.id))),
                        }));
                      }}
                      disabled={loadingRecruiters || saving || filteredRecruiters.length === 0}
                    >
                      {tAssignments("bulk.selectAllVisible", "Select all visible")}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setForm((current) => ({ ...current, recruiter_ids: [] }))}
                      disabled={saving || !(form.recruiter_ids || []).length}
                    >
                      {tAssignments("bulk.clearSelection", "Clear selection")}
                    </Button>
                  </Stack>
                </Stack>
                <Autocomplete
                  multiple
                  options={filteredRecruiters}
                  value={filteredRecruiters.filter((row) => (form.recruiter_ids || []).includes(row.id))}
                  onChange={(_, value) => {
                    setForm((current) => ({
                      ...current,
                      recruiter_ids: Array.from(new Set(value.map((row) => row.id))),
                    }));
                  }}
                  getOptionLabel={(option) => option?.email ? `${option.name}${option.hourly_rate != null ? ` • ${option.hourly_rate}/hr` : ""}${option.department_id ? ` • ${departmentNameById.get(String(option.department_id)) || tAssignments("filters.unknownDepartment", "Department #{{id}}", { id: option.department_id })}` : ""} • ${option.email}` : option?.name || ""}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => <TextField {...params} label={tAssignments("fields.teamMembers", "Team members")} placeholder={tAssignments("fields.selectTeamMembers", "Select team members")} />}
                  disabled={loadingRecruiters || saving}
                />
                {scheduleMode === "date_range" ? (
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <ThemedDateField
                      label={tAssignments("fields.fromDate", "From")}
                      name="range_start"
                      value={form.range_start}
                      onChange={(e) => setForm((current) => ({ ...current, range_start: e.target.value }))}
                      fullWidth
                    />
                    <ThemedDateField
                      label={tAssignments("fields.toDate", "To")}
                      name="range_end"
                      value={form.range_end}
                      onChange={(e) => setForm((current) => ({ ...current, range_end: e.target.value }))}
                      fullWidth
                    />
                  </Stack>
                ) : (
                  <ThemedDateField
                    label={tAssignments("fields.workDate", "Work date")}
                    name="work_date"
                    value={form.work_date}
                    onChange={(e) => setForm((current) => ({ ...current, work_date: e.target.value }))}
                    fullWidth
                  />
                )}
              </Stack>
            )}

            {!editingId && previewAssignmentCount > 0 ? (
              <Alert severity="info">
                {tAssignments(
                  "schedule.previewRows",
                  "{{count}} assignment rows will be created.",
                  { count: previewAssignmentCount }
                )}
              </Alert>
            ) : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <ThemedTimeField
                label={tAssignments("fields.startTime", "Start time")}
                name="start_time"
                value={form.start_time}
                onChange={(e) => setForm((current) => ({ ...current, start_time: e.target.value }))}
                fullWidth
              />
              <ThemedTimeField
                label={tAssignments("fields.endTime", "End time")}
                name="end_time"
                value={form.end_time}
                onChange={(e) => setForm((current) => ({ ...current, end_time: e.target.value }))}
                fullWidth
              />
              <TextField
                label={tAssignments("fields.plannedHours", "Planned hours")}
                type="number"
                inputProps={{ min: 0, step: 0.25 }}
                value={form.planned_hours}
                onChange={(e) => setForm((current) => ({ ...current, planned_hours: e.target.value }))}
                fullWidth
                disabled={Boolean(derivedPlannedHours)}
                helperText={
                  derivedPlannedHours
                    ? tAssignments("fields.plannedHoursDerived", "Auto-calculated from the selected start and end times.")
                    : tAssignments("fields.plannedHoursHelp", "Optional when start and end times are set.")
                }
              />
            </Stack>

            {derivedPlannedHours ? (
              <Alert severity="info">
                {tAssignments("fields.plannedHoursDerivedAlert", "Planned hours are currently {{hours}} based on the selected time window.", {
                  hours: derivedPlannedHours,
                })}
              </Alert>
            ) : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label={tAssignments("fields.timezone", "Timezone")}
                value={form.timezone}
                onChange={(e) => setForm((current) => ({ ...current, timezone: e.target.value }))}
                fullWidth
              />
              <TextField
                label={tAssignments("fields.notes", "Notes")}
                value={form.notes}
                onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                fullWidth
              />
            </Stack>

            <Box>
              <Button
                size="small"
                endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowAdvanced((current) => !current)}
              >
                {tAssignments("futureAccess.title", "Future reporting access")}
              </Button>
              <Collapse in={showAdvanced}>
                <Paper variant="outlined" sx={{ mt: 1.5, p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {tAssignments("futureAccess.description", "These flags are future-safe only. Employee field reports are not live yet.")}
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={<Checkbox checked={!!form.can_submit_report} onChange={(e) => setForm((current) => ({ ...current, can_submit_report: e.target.checked }))} />}
                      label={tAssignments("futureAccess.canSubmitReport", "Can submit report later")}
                    />
                    <FormControlLabel
                      control={<Checkbox checked={!!form.can_report_materials} onChange={(e) => setForm((current) => ({ ...current, can_report_materials: e.target.checked }))} />}
                      label={tAssignments("futureAccess.canReportMaterials", "Can report materials later")}
                    />
                    <FormControlLabel
                      control={<Checkbox checked={!!form.can_upload_files} onChange={(e) => setForm((current) => ({ ...current, can_upload_files: e.target.checked }))} />}
                      label={tAssignments("futureAccess.canUploadFiles", "Can upload files later")}
                    />
                    <FormControlLabel
                      control={<Checkbox checked={!!form.is_lead_reporter} onChange={(e) => setForm((current) => ({ ...current, is_lead_reporter: e.target.checked }))} />}
                      label={tAssignments("futureAccess.isLeadReporter", "Lead reporter later")}
                    />
                  </FormGroup>
                </Paper>
              </Collapse>
            </Box>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => setFormOpen(false)} disabled={saving}>{tAssignments("common.cancel", "Cancel")}</Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {editingId ? tAssignments("common.saveAssignment", "Save Assignment") : mode === "bulk" ? tAssignments("common.addSelected", "Add selected team members") : tAssignments("common.addAssignment", "Add Assignment")}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>

      {items.length === 0 ? (
        <FinanceEmptyState
          title={tAssignments("empty.title", "No team assignments yet")}
          description={tAssignments("empty.description", "Add one daily row per team member so the schedule, planned hours, and labor cost stay clear.")}
          actionLabel={tAssignments("empty.action", "Add team member")}
          onAction={openAdd}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tAssignments("table.headers.teamMember", "Team member")}</TableCell>
                <TableCell>{tAssignments("table.headers.workDate", "Work date")}</TableCell>
                <TableCell>{tAssignments("table.headers.time", "Time")}</TableCell>
                <TableCell>{tAssignments("table.headers.hours", "Hours")}</TableCell>
                <TableCell>{tAssignments("table.headers.plannedLabor", "Planned labor")}</TableCell>
                <TableCell>{tAssignments("table.headers.timezone", "Timezone")}</TableCell>
                <TableCell>{tAssignments("table.headers.notes", "Notes")}</TableCell>
                <TableCell>{tAssignments("table.headers.days", "Days")}</TableCell>
                <TableCell align="right">{tAssignments("table.headers.actions", "Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupedItems.map((group, index) => {
                const groupKey = `${group.recruiter_id || "group"}-${group.start_date}-${group.end_date}-${index}`;
                const isExpanded = !!expandedGroups[groupKey];
                const firstRow = group.rows[0];
                return (
                  <React.Fragment key={groupKey}>
                    <TableRow hover>
                      <TableCell>
                        <Typography variant="body2">{group.recruiter_name || tAssignments("fallbacks.teamMemberId", "Team member #{{id}}", { id: group.recruiter_id })}</Typography>
                        <Typography variant="body2" color="text.secondary">{group.recruiter_email || ""}</Typography>
                      </TableCell>
                      <TableCell>{formatAssignmentDateRange(group)}</TableCell>
                      <TableCell>
                        {group.start_time && group.end_time ? `${group.start_time} - ${group.end_time}` : tAssignments("table.hoursOnly", "Hours only")}
                      </TableCell>
                      <TableCell>{group.planned_hours ?? 0}</TableCell>
                      <TableCell>{group.planned_labor_cost ?? 0}</TableCell>
                      <TableCell>{group.timezone || workOrder?.timezone || "-"}</TableCell>
                      <TableCell>{group.notes || "-"}</TableCell>
                      <TableCell>{group.count}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {group.count === 1 ? (
                            <>
                              <Tooltip title={tAssignments("table.editAssignment", "Edit assignment")}><IconButton onClick={() => openEdit(firstRow)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                              <Tooltip title={tAssignments("table.deleteAssignment", "Delete assignment")}><IconButton color="error" onClick={() => handleDelete(firstRow)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                            </>
                          ) : (
                            <Tooltip title={isExpanded ? tAssignments("table.hideRows", "Hide daily rows") : tAssignments("table.showRows", "Show daily rows")}>
                              <IconButton onClick={() => toggleGroup(groupKey)}>
                                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                    {group.count > 1 && isExpanded
                      ? group.rows.map((row) => (
                          <TableRow key={row.id} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.025) }}>
                            <TableCell sx={{ pl: 4 }}>
                              <Typography variant="body2" color="text.secondary">
                                {row.recruiter_name || tAssignments("fallbacks.teamMemberId", "Team member #{{id}}", { id: row.recruiter_id })}
                              </Typography>
                            </TableCell>
                            <TableCell>{row.work_date || "-"}</TableCell>
                            <TableCell>
                              {row.start_time && row.end_time ? `${row.start_time} - ${row.end_time}` : tAssignments("table.hoursOnly", "Hours only")}
                            </TableCell>
                            <TableCell>{row.planned_hours ?? 0}</TableCell>
                            <TableCell>{row.planned_labor_cost ?? 0}</TableCell>
                            <TableCell>{row.timezone || workOrder?.timezone || "-"}</TableCell>
                            <TableCell>{row.notes || "-"}</TableCell>
                            <TableCell>1</TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                <Tooltip title={tAssignments("table.editAssignment", "Edit assignment")}><IconButton onClick={() => openEdit(row)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title={tAssignments("table.deleteAssignment", "Delete assignment")}><IconButton color="error" onClick={() => handleDelete(row)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      : null}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
