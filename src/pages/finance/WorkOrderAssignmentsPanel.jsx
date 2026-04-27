import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useSnackbar } from "notistack";
import ThemedDateField, { ThemedTimeField } from "../../components/ui/ThemedDateField";
import { formatDateTimeInTz } from "../../utils/datetime";
import {
  createWorkOrderAssignment,
  deleteWorkOrderAssignment,
  listRecruitersForAssignment,
  updateWorkOrderAssignment,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";

const buildBlankForm = (timezone) => ({
  recruiter_id: "",
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

const mapAssignmentError = (err) => {
  const code = err?.response?.data?.error || err?.message;
  switch (code) {
    case "assignment_overlap_conflict":
      return "This team member is already assigned during that time.";
    case "approved_leave_conflict":
      return "This team member has approved leave on that date/time.";
    case "recruiter_archived":
      return "This team member is inactive or archived.";
    case "recruiter_not_found":
      return "Team member was not found for this company.";
    case "work_date_required":
      return "Choose a work date.";
    default:
      return code || "Unable to save assignment.";
  }
};

export default function WorkOrderAssignmentsPanel({ workOrder, onChanged }) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [recruiters, setRecruiters] = useState([]);
  const [recruitersError, setRecruitersError] = useState("");
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(buildBlankForm(workOrder?.timezone));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        setRecruitersError(err?.response?.data?.error || err?.message || "Unable to load team members.");
      } finally {
        if (mounted) setLoadingRecruiters(false);
      }
    };
    loadRecruiters();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setForm((current) => ({ ...current, timezone: workOrder?.timezone || current.timezone || "UTC" }));
  }, [workOrder?.timezone]);

  const openAdd = () => {
    setEditingId(null);
    setError("");
    setShowAdvanced(false);
    setForm(buildBlankForm(workOrder?.timezone));
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setError("");
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
    if (!form.recruiter_id) return "Choose a team member.";
    if (!form.work_date) return "Choose a work date.";
    if (!form.start_time && !form.end_time && !form.planned_hours) return "Enter planned hours or choose a start and end time.";
    if ((form.start_time && !form.end_time) || (!form.start_time && form.end_time)) return "Choose both a start time and an end time.";
    if (form.start_time && form.end_time && form.end_time <= form.start_time) return "End time must be after start time.";
    if (!form.start_time && !form.end_time && Number(form.planned_hours || 0) <= 0) return "Planned hours must be greater than 0.";
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
    const payload = {
      recruiter_id: form.recruiter_id,
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
        enqueueSnackbar("Assignment updated.", { variant: "success" });
      } else {
        await createWorkOrderAssignment(workOrder.id, payload);
        enqueueSnackbar("Team member assigned.", { variant: "success" });
      }
      setFormOpen(false);
      onChanged?.();
    } catch (err) {
      setError(mapAssignmentError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    try {
      await deleteWorkOrderAssignment(row.id);
      enqueueSnackbar("Assignment removed.", { variant: "success" });
      onChanged?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to remove assignment.", { variant: "error" });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Assign Team</Typography>
          <Typography variant="body2" color="text.secondary">Plan each day by team member. Daily rows keep job scheduling clear and avoid overlaps.</Typography>
        </Box>
        <Button variant="contained" onClick={openAdd}>Add Team Member</Button>
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
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Team member</InputLabel>
                <Select
                  label="Team member"
                  value={form.recruiter_id || ""}
                  onChange={(e) => setForm((current) => ({ ...current, recruiter_id: e.target.value }))}
                  disabled={loadingRecruiters || saving}
                >
                  <MenuItem value="">Select team member</MenuItem>
                  {recruiters.map((row) => (
                    <MenuItem key={row.id} value={row.id}>
                      {row.name}{row.hourly_rate != null ? ` • ${row.hourly_rate}/hr` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <ThemedDateField
                label="Work date"
                name="work_date"
                value={form.work_date}
                onChange={(e) => setForm((current) => ({ ...current, work_date: e.target.value }))}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <ThemedTimeField
                label="Start time"
                name="start_time"
                value={form.start_time}
                onChange={(e) => setForm((current) => ({ ...current, start_time: e.target.value }))}
                fullWidth
              />
              <ThemedTimeField
                label="End time"
                name="end_time"
                value={form.end_time}
                onChange={(e) => setForm((current) => ({ ...current, end_time: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Planned hours"
                type="number"
                inputProps={{ min: 0, step: 0.25 }}
                value={form.planned_hours}
                onChange={(e) => setForm((current) => ({ ...current, planned_hours: e.target.value }))}
                fullWidth
                helperText="Optional when start and end times are set."
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Timezone"
                value={form.timezone}
                onChange={(e) => setForm((current) => ({ ...current, timezone: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Notes"
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
                Future reporting access
              </Button>
              <Collapse in={showAdvanced}>
                <Paper variant="outlined" sx={{ mt: 1.5, p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    These flags are future-safe only. Employee field reports are not live yet.
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={<Checkbox checked={!!form.can_submit_report} onChange={(e) => setForm((current) => ({ ...current, can_submit_report: e.target.checked }))} />}
                      label="Can submit report later"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={!!form.can_report_materials} onChange={(e) => setForm((current) => ({ ...current, can_report_materials: e.target.checked }))} />}
                      label="Can report materials later"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={!!form.can_upload_files} onChange={(e) => setForm((current) => ({ ...current, can_upload_files: e.target.checked }))} />}
                      label="Can upload files later"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={!!form.is_lead_reporter} onChange={(e) => setForm((current) => ({ ...current, is_lead_reporter: e.target.checked }))} />}
                      label="Lead reporter later"
                    />
                  </FormGroup>
                </Paper>
              </Collapse>
            </Box>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {editingId ? "Save Assignment" : "Add Assignment"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>

      {items.length === 0 ? (
        <FinanceEmptyState
          title="No team assignments yet"
          description="Add one daily row per team member so the schedule, planned hours, and labor cost stay clear."
          actionLabel="Add team member"
          onAction={openAdd}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team member</TableCell>
                <TableCell>Work date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Hours</TableCell>
                <TableCell>Planned labor</TableCell>
                <TableCell>Timezone</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2">{row.recruiter_name || `Team member #${row.recruiter_id}`}</Typography>
                    <Typography variant="body2" color="text.secondary">{row.recruiter_email || ""}</Typography>
                  </TableCell>
                  <TableCell>{row.work_date || "-"}</TableCell>
                  <TableCell>
                    {row.start_time && row.end_time ? `${row.start_time} - ${row.end_time}` : "Hours only"}
                  </TableCell>
                  <TableCell>{row.planned_hours ?? 0}</TableCell>
                  <TableCell>{row.planned_labor_cost ?? 0}</TableCell>
                  <TableCell>{row.timezone || workOrder?.timezone || "-"}</TableCell>
                  <TableCell>{row.notes || "-"}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Edit assignment"><IconButton onClick={() => openEdit(row)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete assignment"><IconButton color="error" onClick={() => handleDelete(row)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
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
