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
  listRecruitersForAssignment,
  updateWorkOrderAssignment,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";

const buildBlankForm = (timezone) => ({
  recruiter_id: "",
  recruiter_ids: [],
  work_date: "",
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

export default function WorkOrderAssignmentsPanel({ workOrder, onChanged }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tAssignments = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.workOrders.assignments.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [recruiters, setRecruiters] = useState([]);
  const [recruitersError, setRecruitersError] = useState("");
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(buildBlankForm(workOrder?.timezone));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mode, setMode] = useState("single");
  const [bulkFailures, setBulkFailures] = useState([]);

  const items = useMemo(() => Array.isArray(workOrder?.assignments) ? workOrder.assignments : [], [workOrder]);

  useEffect(() => {
    let mounted = true;
    const loadRecruiters = async () => {
      setLoadingRecruiters(true);
      setRecruitersError("");
      try {
        const rows = await listRecruitersForAssignment();
        if (!mounted) return;
        setRecruiters(rows.filter((row) => !row.archived_at));
      } catch (err) {
        if (!mounted) return;
        setRecruitersError(err?.response?.data?.error || err?.message || tAssignments("errors.loadTeamMembersFailed", "Unable to load team members."));
      } finally {
        if (mounted) setLoadingRecruiters(false);
      }
    };
    loadRecruiters();
    return () => {
      mounted = false;
    };
  }, [tAssignments]);

  useEffect(() => {
    setForm((current) => ({ ...current, timezone: workOrder?.timezone || current.timezone || "UTC" }));
  }, [workOrder?.timezone]);

  const openAdd = () => {
    setEditingId(null);
    setError("");
    setBulkFailures([]);
    setMode("single");
    setShowAdvanced(false);
    setForm(buildBlankForm(workOrder?.timezone));
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setError("");
    setBulkFailures([]);
    setMode("single");
    setShowAdvanced(Boolean(row.can_submit_report || row.can_report_materials || row.can_upload_files || row.is_lead_reporter));
    setForm({
      recruiter_id: row.recruiter_id || "",
      work_date: row.work_date || "",
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
    if (!form.work_date) return tAssignments("errors.chooseWorkDate", "Choose a work date.");
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
    const payload = {
      work_date: form.work_date,
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
        await updateWorkOrderAssignment(editingId, payload);
        enqueueSnackbar(tAssignments("snackbar.assignmentUpdated", "Assignment updated."), { variant: "success" });
      } else if (mode === "bulk") {
        const uniqueRecruiterIds = Array.from(new Set((form.recruiter_ids || []).filter(Boolean)));
        let successCount = 0;
        const failures = [];
        for (const recruiterId of uniqueRecruiterIds) {
          try {
            await createWorkOrderAssignment(workOrder.id, {
              ...payload,
              recruiter_id: recruiterId,
              planned_hours: payload.planned_hours || null,
            });
            successCount += 1;
          } catch (err) {
            const recruiter = recruiters.find((row) => String(row.id) === String(recruiterId));
              failures.push({
                recruiterId,
                name: recruiter?.name || recruiter?.email || tAssignments("fallbacks.teamMemberId", "Team member #{{id}}", { id: recruiterId }),
                message: mapAssignmentError(err, tAssignments),
              });
            }
        }
        setBulkFailures(failures);
        if (successCount > 0 && failures.length === 0) {
          enqueueSnackbar(tAssignments(successCount === 1 ? "snackbar.addedOne" : "snackbar.addedMany", successCount === 1 ? "Added {{count}} team member." : "Added {{count}} team members.", { count: successCount }), { variant: "success" });
        } else if (successCount > 0) {
          enqueueSnackbar(tAssignments("snackbar.addedWithFailures", "Added {{successCount}} team members. {{failureCount}} could not be added.", { successCount, failureCount: failures.length }), { variant: "warning" });
        } else {
          setError(tAssignments("errors.noneAdded", "No team members could be added."));
        }
        if (successCount > 0) {
          setFormOpen(false);
          await onChanged?.();
        }
      } else {
        await createWorkOrderAssignment(workOrder.id, { ...payload, recruiter_id: form.recruiter_id });
        enqueueSnackbar(tAssignments("snackbar.teamMemberAssigned", "Team member assigned."), { variant: "success" });
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
                >
                  {tAssignments("mode.bulk", "Multiple team members")}
                </Button>
              </Stack>
            </Stack>

            {mode === "bulk" ? (
              <Alert severity="info">{tAssignments("bulkInfo", "Use bulk assignment when several team members share the same date and time.")}</Alert>
            ) : null}

            {bulkFailures.length ? (
              <Alert severity="warning">
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>{tAssignments("bulkFailuresTitle", "Could not add:")}</Typography>
                {bulkFailures.map((failure) => (
                  <Typography key={`${failure.recruiterId}-${failure.name}`} variant="body2">
                    - {failure.name}: {failure.message}
                  </Typography>
                ))}
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
                    {recruiters.map((row) => (
                      <MenuItem key={row.id} value={row.id}>
                        {row.name}{row.hourly_rate != null ? ` • ${row.hourly_rate}/hr` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <ThemedDateField
                  label={tAssignments("fields.workDate", "Work date")}
                  name="work_date"
                  value={form.work_date}
                  onChange={(e) => setForm((current) => ({ ...current, work_date: e.target.value }))}
                  fullWidth
                />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Autocomplete
                  multiple
                  options={recruiters}
                  value={recruiters.filter((row) => (form.recruiter_ids || []).includes(row.id))}
                  onChange={(_, value) => {
                    setForm((current) => ({
                      ...current,
                      recruiter_ids: Array.from(new Set(value.map((row) => row.id))),
                    }));
                  }}
                  getOptionLabel={(option) => option?.email ? `${option.name}${option.hourly_rate != null ? ` • ${option.hourly_rate}/hr` : ""} • ${option.email}` : option?.name || ""}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => <TextField {...params} label={tAssignments("fields.teamMembers", "Team members")} placeholder={tAssignments("fields.selectTeamMembers", "Select team members")} />}
                  disabled={loadingRecruiters || saving}
                />
                <ThemedDateField
                  label={tAssignments("fields.workDate", "Work date")}
                  name="work_date"
                  value={form.work_date}
                  onChange={(e) => setForm((current) => ({ ...current, work_date: e.target.value }))}
                  fullWidth
                />
              </Stack>
            )}

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
                helperText={tAssignments("fields.plannedHoursHelp", "Optional when start and end times are set.")}
              />
            </Stack>

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
                <TableCell align="right">{tAssignments("table.headers.actions", "Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2">{row.recruiter_name || tAssignments("fallbacks.teamMemberId", "Team member #{{id}}", { id: row.recruiter_id })}</Typography>
                    <Typography variant="body2" color="text.secondary">{row.recruiter_email || ""}</Typography>
                  </TableCell>
                  <TableCell>{row.work_date || "-"}</TableCell>
                  <TableCell>
                    {row.start_time && row.end_time ? `${row.start_time} - ${row.end_time}` : tAssignments("table.hoursOnly", "Hours only")}
                  </TableCell>
                  <TableCell>{row.planned_hours ?? 0}</TableCell>
                  <TableCell>{row.planned_labor_cost ?? 0}</TableCell>
                  <TableCell>{row.timezone || workOrder?.timezone || "-"}</TableCell>
                  <TableCell>{row.notes || "-"}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title={tAssignments("table.editAssignment", "Edit assignment")}><IconButton onClick={() => openEdit(row)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title={tAssignments("table.deleteAssignment", "Delete assignment")}><IconButton color="error" onClick={() => handleDelete(row)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
