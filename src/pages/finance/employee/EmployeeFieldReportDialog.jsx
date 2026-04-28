import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useSnackbar } from "notistack";
import { submitMyFieldReport } from "../financeApi";

const blankMaterial = {
  material_plan_id: "",
  title: "",
  quantity_reported: "",
  reason: "",
  is_extra: false,
};

const blankForm = {
  assignment_id: "",
  completed: false,
  work_notes: "",
  issues_found: "",
  client_requested_extra_work: "",
  client_note: "",
  files_text: "",
  materials: [],
};

const mapSubmitError = (error) => {
  if (error === "field_report_not_allowed") return "You are not allowed to submit a report for this job.";
  if (error === "assignment_not_found") return "This assignment was not found.";
  if (error === "material_title_required") return "Material title is required.";
  if (error === "reported_quantity_required") return "Quantity used is required.";
  return error || "Unable to submit the field report.";
};

export default function EmployeeFieldReportDialog({ open, onClose, workOrder, onSubmitted }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const assignments = useMemo(() => Array.isArray(workOrder?.assignments) ? workOrder.assignments : [], [workOrder]);
  const plannedMaterials = useMemo(() => Array.isArray(workOrder?.planned_materials) ? workOrder.planned_materials : [], [workOrder]);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...blankForm,
      assignment_id: assignments.length === 1 ? assignments[0].assignment_id : "",
    });
    setError("");
  }, [open, assignments]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setMaterialField = (index, field, value) => {
    setForm((current) => ({
      ...current,
      materials: current.materials.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };
  const addMaterial = () => setForm((current) => ({ ...current, materials: [...current.materials, { ...blankMaterial }] }));
  const removeMaterial = (index) => setForm((current) => ({ ...current, materials: current.materials.filter((_, rowIndex) => rowIndex !== index) }));

  const handleSubmit = async () => {
    const hasMaterial = form.materials.some((row) => row.quantity_reported !== "" || String(row.title || "").trim());
    if (!String(form.work_notes || "").trim() && !form.completed && !hasMaterial) {
      setError("Add work notes, mark the job completed, or report at least one material.");
      return;
    }
    for (const row of form.materials) {
      const quantity = Number(row.quantity_reported || 0);
      if (row.quantity_reported !== "" && quantity <= 0) {
        setError("Quantity used is required.");
        return;
      }
      if (row.is_extra && !String(row.title || "").trim()) {
        setError("Material title is required.");
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      await submitMyFieldReport(workOrder.id, {
        assignment_id: form.assignment_id || undefined,
        completed: form.completed,
        work_notes: form.work_notes || undefined,
        issues_found: form.issues_found || undefined,
        client_requested_extra_work: form.client_requested_extra_work || undefined,
        client_note: form.client_note || undefined,
        files: form.files_text.split("\n").map((line) => line.trim()).filter(Boolean),
        materials: form.materials
          .filter((row) => row.quantity_reported !== "" || String(row.title || "").trim())
          .map((row) => ({
            material_plan_id: row.material_plan_id || undefined,
            title: row.title || undefined,
            quantity_reported: Number(row.quantity_reported || 0),
            reason: row.reason || undefined,
            is_extra: row.is_extra,
          })),
      });
      enqueueSnackbar("Field report submitted for manager review.", { variant: "success" });
      onSubmitted?.();
    } catch (err) {
      const nextError = mapSubmitError(err?.response?.data?.error || err?.message);
      setError(nextError);
      enqueueSnackbar(nextError, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Submit Field Report</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <Alert severity="info">
            This does not update inventory or invoices. Your manager reviews and approves it first.
          </Alert>
          {error ? <Alert severity="error">{error}</Alert> : null}

          {assignments.length > 1 ? (
            <FormControl fullWidth>
              <InputLabel>Assignment</InputLabel>
              <Select label="Assignment" value={form.assignment_id} onChange={(e) => setField("assignment_id", e.target.value)}>
                {assignments.map((row) => (
                  <MenuItem key={row.assignment_id} value={row.assignment_id}>
                    {row.work_date || "No date"}{row.start_time ? ` • ${row.start_time}` : ""}{row.end_time ? ` to ${row.end_time}` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          <FormControlLabel control={<Checkbox checked={form.completed} onChange={(e) => setField("completed", e.target.checked)} />} label="Job completed" />

          <TextField fullWidth multiline minRows={3} label="Work notes" value={form.work_notes} onChange={(e) => setField("work_notes", e.target.value)} />
          <TextField fullWidth multiline minRows={2} label="Issues found" value={form.issues_found} onChange={(e) => setField("issues_found", e.target.value)} />
          <TextField fullWidth multiline minRows={2} label="Extra work requested by client" value={form.client_requested_extra_work} onChange={(e) => setField("client_requested_extra_work", e.target.value)} />
          <TextField fullWidth multiline minRows={2} label="Client note" value={form.client_note} onChange={(e) => setField("client_note", e.target.value)} />
          <TextField fullWidth multiline minRows={3} label="File links or file notes" helperText="One link or short file note per line." value={form.files_text} onChange={(e) => setField("files_text", e.target.value)} />

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={800}>Materials Used</Typography>
                <Button startIcon={<AddIcon />} onClick={addMaterial}>Add material</Button>
              </Stack>
              {!form.materials.length ? (
                <Typography variant="body2" color="text.secondary">Add materials only if you used them or the client asked for extra work.</Typography>
              ) : null}
              {form.materials.map((row, index) => (
                <Paper key={`employee-material-${index}`} variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Planned material</InputLabel>
                        <Select label="Planned material" value={row.material_plan_id} onChange={(e) => {
                          const planned = plannedMaterials.find((item) => String(item.material_plan_id || item.id) === String(e.target.value));
                          setMaterialField(index, "material_plan_id", e.target.value);
                          if (planned && !row.title) setMaterialField(index, "title", planned.title || "");
                        }}>
                          <MenuItem value="">Not from the planned list</MenuItem>
                          {plannedMaterials.map((item, plannedIndex) => (
                            <MenuItem key={`planned-${plannedIndex}`} value={item.material_plan_id || item.id || item.title}>
                              {item.title} • Planned {item.qty_planned}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}><TextField fullWidth label="Material title" value={row.title} onChange={(e) => setMaterialField(index, "title", e.target.value)} /></Grid>
                    <Grid item xs={12} md={2}><TextField fullWidth label="Quantity used" value={row.quantity_reported} onChange={(e) => setMaterialField(index, "quantity_reported", e.target.value)} /></Grid>
                    <Grid item xs={12} md={2}><TextField fullWidth label="Reason" value={row.reason} onChange={(e) => setMaterialField(index, "reason", e.target.value)} /></Grid>
                    <Grid item xs={10} md={0.5}><FormControlLabel control={<Checkbox checked={row.is_extra} onChange={(e) => setMaterialField(index, "is_extra", e.target.checked)} />} label="Extra" /></Grid>
                    <Grid item xs={2} md={0.5}><IconButton onClick={() => removeMaterial(index)}><DeleteOutlineIcon fontSize="small" /></IconButton></Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>Submit Report</Button>
      </DialogActions>
    </Dialog>
  );
}
