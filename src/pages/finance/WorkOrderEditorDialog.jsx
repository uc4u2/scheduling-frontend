import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import ThemedDateField from "../../components/ui/ThemedDateField";
import { getUserTimezone, normalizeTimezoneValue } from "../../utils/timezone";
import { createWorkOrder, updateWorkOrder } from "./financeApi";

const buildBlankForm = (prefillEstimate) => {
  const defaultTimezone = normalizeTimezoneValue(prefillEstimate?.timezone || getUserTimezone()) || "UTC";
  return {
    title: prefillEstimate?.title || "",
    client_id: prefillEstimate?.client_id || "",
    finance_estimate_id: prefillEstimate?.id || "",
    invoice_id: "",
    location: "",
    start_date: "",
    end_date: "",
    timezone: defaultTimezone,
    notes: "",
    manager_only_notes: "",
    employee_visible_notes: "",
    copy_materials_from_estimate: !!prefillEstimate,
  };
};

export default function WorkOrderEditorDialog({
  open,
  onClose,
  onSaved,
  workOrder = null,
  clients = [],
  estimates = [],
  prefillEstimate = null,
}) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(buildBlankForm(prefillEstimate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedEstimate = useMemo(() => {
    const estimateId = Number(form.finance_estimate_id || 0);
    return estimates.find((row) => Number(row.id) === estimateId) || null;
  }, [estimates, form.finance_estimate_id]);

  useEffect(() => {
    if (!open) return;
    if (workOrder) {
      setForm({
        title: workOrder.title || "",
        client_id: workOrder.client_id || "",
        finance_estimate_id: workOrder.finance_estimate_id || "",
        invoice_id: workOrder.invoice_id || "",
        location: workOrder.location || "",
        start_date: workOrder.start_date || "",
        end_date: workOrder.end_date || "",
        timezone: normalizeTimezoneValue(workOrder.timezone || getUserTimezone()) || "UTC",
        notes: workOrder.notes || "",
        manager_only_notes: workOrder.manager_only_notes || "",
        employee_visible_notes: workOrder.employee_visible_notes || "",
        copy_materials_from_estimate: false,
      });
      setError("");
      return;
    }
    setForm(buildBlankForm(prefillEstimate));
    setError("");
  }, [open, workOrder, prefillEstimate]);

  useEffect(() => {
    if (!selectedEstimate || workOrder) return;
    setForm((current) => ({
      ...current,
      client_id: selectedEstimate.client_id || current.client_id,
      title: current.title || selectedEstimate.title || "",
      copy_materials_from_estimate: current.copy_materials_from_estimate ?? true,
    }));
  }, [selectedEstimate, workOrder]);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!(form.title || "").trim()) {
      setError("Title is required.");
      return;
    }
    if (!workOrder && !form.client_id && !form.finance_estimate_id) {
      setError("Choose a client or pick an estimate first.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      client_id: form.client_id || null,
      finance_estimate_id: form.finance_estimate_id || null,
      invoice_id: form.invoice_id || null,
      location: form.location || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      timezone: form.timezone || null,
      notes: form.notes || null,
      manager_only_notes: form.manager_only_notes || null,
      employee_visible_notes: form.employee_visible_notes || null,
      copy_materials_from_estimate: !!form.copy_materials_from_estimate,
    };
    try {
      const res = workOrder
        ? await updateWorkOrder(workOrder.id, payload)
        : await createWorkOrder(payload);
      enqueueSnackbar(workOrder ? "Work order updated." : "Work order created.", { variant: "success" });
      onSaved?.(res?.work_order || res);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to save work order.");
    } finally {
      setSaving(false);
    }
  };

  const linkLocked = !!workOrder;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{workOrder ? "Edit Work Order" : prefillEstimate ? "Create Work Order From Estimate" : "New Work Order"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {linkLocked ? (
            <Alert severity="info">Client and estimate links are locked after creation.</Alert>
          ) : (
            <Alert severity="info">Choose a client directly, or start from an estimate to prefill the job.</Alert>
          )}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Job title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Timezone"
              value={form.timezone}
              onChange={(e) => setField("timezone", e.target.value)}
              fullWidth
              helperText="Defaults to your current timezone."
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth disabled={linkLocked}>
              <InputLabel>Client</InputLabel>
              <Select
                label="Client"
                value={form.client_id || ""}
                onChange={(e) => setField("client_id", e.target.value)}
              >
                <MenuItem value="">Select client</MenuItem>
                {clients.map((client) => {
                  const name = `${client.first_name || ""} ${client.last_name || ""}`.trim() || client.email || `Client #${client.id}`;
                  return (
                    <MenuItem key={client.id} value={client.id}>
                      {name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={linkLocked}>
              <InputLabel>Estimate</InputLabel>
              <Select
                label="Estimate"
                value={form.finance_estimate_id || ""}
                onChange={(e) => setField("finance_estimate_id", e.target.value)}
              >
                <MenuItem value="">No estimate link</MenuItem>
                {estimates.map((estimate) => (
                  <MenuItem key={estimate.id} value={estimate.id}>
                    {estimate.estimate_number} - {estimate.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {!workOrder ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.copy_materials_from_estimate}
                  onChange={(e) => setField("copy_materials_from_estimate", e.target.checked)}
                  disabled={!form.finance_estimate_id}
                />
              }
              label="Copy planned materials from estimate"
            />
          ) : null}

          <TextField
            label="Location"
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
            fullWidth
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <ThemedDateField
              label="Start date"
              name="start_date"
              value={form.start_date}
              onChange={(e) => setField("start_date", e.target.value)}
              fullWidth
            />
            <ThemedDateField
              label="End date"
              name="end_date"
              value={form.end_date}
              onChange={(e) => setField("end_date", e.target.value)}
              fullWidth
            />
          </Stack>

          <TextField
            label="Job notes"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
          <TextField
            label="Manager-only notes"
            value={form.manager_only_notes}
            onChange={(e) => setField("manager_only_notes", e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          <TextField
            label="Employee-visible notes"
            value={form.employee_visible_notes}
            onChange={(e) => setField("employee_visible_notes", e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />

          {!workOrder ? (
            <Box sx={{ color: theme.palette.text.secondary }}>
              <Typography variant="body2">Client and estimate links are locked after creation.</Typography>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {workOrder ? "Save" : "Create Work Order"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
