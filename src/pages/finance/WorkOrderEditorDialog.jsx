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
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import ThemedDateField from "../../components/ui/ThemedDateField";
import { getUserTimezone, normalizeTimezoneValue } from "../../utils/timezone";
import { createManagerClient, createWorkOrder, updateWorkOrder } from "./financeApi";
import ClientQuickCreateDialog from "./ClientQuickCreateDialog";
import ClientLookupField from "./ClientLookupField";
import { buildClientCreatePayload } from "./clientUtils";

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
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tWorkOrders = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.workOrders.editor.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [form, setForm] = useState(buildBlankForm(prefillEstimate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientSaving, setClientSaving] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", email: "", phone: "" });

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
      setError(tWorkOrders("errors.titleRequired", "Title is required."));
      return;
    }
    if (!workOrder && !form.client_id && !form.finance_estimate_id) {
      setError(tWorkOrders("errors.clientOrEstimateRequired", "Choose a client or pick an estimate first."));
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
      enqueueSnackbar(workOrder ? tWorkOrders("snackbar.updated", "Work order updated.") : tWorkOrders("snackbar.created", "Work order created."), { variant: "success" });
      onSaved?.(res?.work_order || res);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tWorkOrders("errors.saveFailed", "Unable to save work order."));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateClient = async () => {
    const payload = buildClientCreatePayload(clientForm);
    if (!payload.first_name || !payload.email) {
      setError(tWorkOrders("errors.clientCreateRequired", "Client name and email are required to create a new client."));
      return;
    }
    setClientSaving(true);
    setError("");
    try {
      const created = await createManagerClient(payload);
      setForm((current) => ({ ...current, client_id: created.id }));
      setClientDialogOpen(false);
    } catch (err) {
      const conflict = err?.response?.data;
      if (conflict?.error === "client_phone_conflict" && conflict?.suggested_client?.id) {
        const useExisting = window.confirm(
          `Possible existing client found: ${conflict.suggested_client.name || conflict.suggested_client.email || `#${conflict.suggested_client.id}`}. Use that client instead?`
        );
        if (useExisting) {
          setForm((current) => ({ ...current, client_id: conflict.suggested_client.id }));
          setClientDialogOpen(false);
          setError("");
        } else {
          setError("Possible existing client found. Open the existing client or cancel.");
        }
      } else {
        setError(err?.response?.data?.error || err?.message || tWorkOrders("errors.clientCreateFailed", "Unable to create client."));
      }
    } finally {
      setClientSaving(false);
    }
  };

  const linkLocked = !!workOrder;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{workOrder ? tWorkOrders("title.edit", "Edit Work Order") : prefillEstimate ? tWorkOrders("title.fromEstimate", "Create Work Order From Estimate") : tWorkOrders("title.new", "New Work Order")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {linkLocked ? (
            <Alert severity="info">{tWorkOrders("linkLocked", "Client and estimate links are locked after creation.")}</Alert>
          ) : (
            <Alert severity="info">{tWorkOrders("chooseClientOrEstimate", "Choose a client directly, or start from an estimate to prefill the job.")}</Alert>
          )}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label={tWorkOrders("fields.jobTitle", "Job title")}
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              fullWidth
              required
            />
            <TextField
              label={tWorkOrders("fields.timezone", "Timezone")}
              value={form.timezone}
              onChange={(e) => setField("timezone", e.target.value)}
              fullWidth
              helperText={tWorkOrders("fields.timezoneHelp", "Defaults to your current timezone.")}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <ClientLookupField
              label={tWorkOrders("fields.client", "Client")}
              value={form.client_id || ""}
              onChange={(nextId) => setField("client_id", nextId)}
              helperText={tWorkOrders("fields.clientSearchHelp", "Search the official customer record by client name, email, or phone.")}
              placeholder={tWorkOrders("fields.clientSearchPlaceholder", "Search client: ABC Property Management")}
              initialOptions={clients}
              fallbackLabel={tWorkOrders("fields.clientFallback", "Client")}
              disabled={linkLocked}
            />
            <FormControl fullWidth disabled={linkLocked}>
              <InputLabel>{tWorkOrders("fields.estimate", "Estimate")}</InputLabel>
              <Select
                label={tWorkOrders("fields.estimate", "Estimate")}
                value={form.finance_estimate_id || ""}
                onChange={(e) => setField("finance_estimate_id", e.target.value)}
              >
                <MenuItem value="">{tWorkOrders("fields.noEstimateLink", "No estimate link")}</MenuItem>
                {estimates.map((estimate) => (
                  <MenuItem key={estimate.id} value={estimate.id}>
                    {estimate.estimate_number} - {estimate.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {!linkLocked ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                onClick={() => {
                  setClientForm({ name: "", email: "", phone: "" });
                  setClientDialogOpen(true);
                }}
              >
                {tWorkOrders("actions.createClient", "Create new client")}
              </Button>
              <Typography variant="caption" color="text.secondary">
                {tWorkOrders("fields.clientHelp", "Choose an existing client or create the official customer record before scheduling work.")}
              </Typography>
            </Stack>
          ) : null}

          {!workOrder ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.copy_materials_from_estimate}
                  onChange={(e) => setField("copy_materials_from_estimate", e.target.checked)}
                  disabled={!form.finance_estimate_id}
                />
              }
              label={tWorkOrders("fields.copyMaterials", "Copy planned materials from estimate")}
            />
          ) : null}

          <TextField
            label={tWorkOrders("fields.location", "Location")}
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
            fullWidth
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <ThemedDateField
              label={tWorkOrders("fields.startDate", "Start date")}
              name="start_date"
              value={form.start_date}
              onChange={(e) => setField("start_date", e.target.value)}
              fullWidth
            />
            <ThemedDateField
              label={tWorkOrders("fields.endDate", "End date")}
              name="end_date"
              value={form.end_date}
              onChange={(e) => setField("end_date", e.target.value)}
              fullWidth
            />
          </Stack>

          <TextField
            label={tWorkOrders("fields.jobNotes", "Job notes")}
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
          <TextField
            label={tWorkOrders("fields.managerNotes", "Manager-only notes")}
            value={form.manager_only_notes}
            onChange={(e) => setField("manager_only_notes", e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          <TextField
            label={tWorkOrders("fields.employeeNotes", "Employee-visible notes")}
            value={form.employee_visible_notes}
            onChange={(e) => setField("employee_visible_notes", e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />

          {!workOrder ? (
            <Box sx={{ color: theme.palette.text.secondary }}>
              <Typography variant="body2">{tWorkOrders("linkLocked", "Client and estimate links are locked after creation.")}</Typography>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{tWorkOrders("common.cancel", "Cancel")}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {workOrder ? tWorkOrders("common.save", "Save") : tWorkOrders("common.createWorkOrder", "Create Work Order")}
        </Button>
      </DialogActions>
      <ClientQuickCreateDialog
        open={clientDialogOpen}
        onClose={() => !clientSaving && setClientDialogOpen(false)}
        onSubmit={handleCreateClient}
        form={clientForm}
        setForm={setClientForm}
        loading={clientSaving}
        title={tWorkOrders("clientDialog.title", "Create new client")}
        description={tWorkOrders("clientDialog.description", "Create the official customer record used for work orders, estimates, and invoices.")}
      />
    </Dialog>
  );
}
