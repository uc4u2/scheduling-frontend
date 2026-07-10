import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  CircularProgress,
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
import { createManagerClient, createWorkOrder, listWorkOrderLocationSuggestions, previewWorkOrderDestination, updateWorkOrder } from "./financeApi";
import ClientQuickCreateDialog from "./ClientQuickCreateDialog";
import ClientLookupField from "./ClientLookupField";
import { buildClientCreatePayload } from "./clientUtils";

const extractDispatchDestination = (metadata = {}) => {
  const source = metadata && typeof metadata === "object" ? metadata : {};
  const nestedDestination = source.destination && typeof source.destination === "object" ? source.destination : {};
  const nestedLocation = source.location && typeof source.location === "object" ? source.location : {};
  return {
    lat:
      nestedDestination.lat ??
      nestedDestination.latitude ??
      source.destination_lat ??
      source.location_lat ??
      nestedLocation.lat ??
      nestedLocation.latitude ??
      "",
    lng:
      nestedDestination.lng ??
      nestedDestination.longitude ??
      source.destination_lng ??
      source.location_lng ??
      nestedLocation.lng ??
      nestedLocation.longitude ??
      "",
  };
};

const buildBlankForm = (prefillEstimate) => {
  const defaultTimezone = normalizeTimezoneValue(prefillEstimate?.timezone || getUserTimezone()) || "UTC";
  const baseMetadata = prefillEstimate?.metadata && typeof prefillEstimate.metadata === "object" ? prefillEstimate.metadata : {};
  const destination = extractDispatchDestination(baseMetadata);
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
    destination_lat: destination.lat === "" ? "" : String(destination.lat),
    destination_lng: destination.lng === "" ? "" : String(destination.lng),
    metadata: baseMetadata,
  };
};

const buildTypedLocationFallback = (value) => {
  const label = String(value || "").trim();
  if (!label) return [];
  return [
    {
      label,
      primary_text: label,
      secondary_text: "Use typed location",
      place_id: `typed:${label.toLowerCase()}`,
    },
  ];
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
  const [destinationPreview, setDestinationPreview] = useState(null);
  const [destinationPreviewLoading, setDestinationPreviewLoading] = useState(false);
  const [destinationPreviewError, setDestinationPreviewError] = useState("");
  const [destinationPreviewSeverity, setDestinationPreviewSeverity] = useState("warning");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationSuggestionsLoading, setLocationSuggestionsLoading] = useState(false);
  const [locationAutocompleteConfigured, setLocationAutocompleteConfigured] = useState(true);

  const selectedEstimate = useMemo(() => {
    const estimateId = Number(form.finance_estimate_id || 0);
    return estimates.find((row) => Number(row.id) === estimateId) || null;
  }, [estimates, form.finance_estimate_id]);

  useEffect(() => {
    if (!open) return;
    if (workOrder) {
      const baseMetadata = workOrder.metadata && typeof workOrder.metadata === "object" ? workOrder.metadata : {};
      const destination = extractDispatchDestination(baseMetadata);
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
        destination_lat: destination.lat === "" ? "" : String(destination.lat),
        destination_lng: destination.lng === "" ? "" : String(destination.lng),
        metadata: baseMetadata,
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
      metadata: current.metadata && Object.keys(current.metadata).length ? current.metadata : (selectedEstimate.metadata || {}),
    }));
  }, [selectedEstimate, workOrder]);

  useEffect(() => {
    const location = String(form.location || "").trim();
    if (!open || !location) {
      setDestinationPreview(null);
      setDestinationPreviewError("");
      setDestinationPreviewSeverity("warning");
      setDestinationPreviewLoading(false);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setDestinationPreviewLoading(true);
      setDestinationPreviewError("");
      try {
        const res = await previewWorkOrderDestination(location);
        if (cancelled) return;
        if (res?.resolved && res?.destination) {
          setDestinationPreview(res.destination);
          setDestinationPreviewError("");
          setDestinationPreviewSeverity("success");
        } else if (res?.reason === "geocoding_unavailable") {
          setDestinationPreview(null);
          setDestinationPreviewSeverity("info");
          setDestinationPreviewError(
            tWorkOrders(
              "fields.locationPreviewUnavailableLocal",
              "Live destination preview is unavailable here. Schedulaa will still try to resolve this location when geocoding is configured."
            )
          );
        } else {
          setDestinationPreview(null);
          setDestinationPreviewSeverity("warning");
          setDestinationPreviewError(
            tWorkOrders(
              "fields.locationPreviewUnavailable",
              "We could not confirm this destination yet. Try a fuller address, postal code, or city-region combination."
            )
          );
        }
      } catch (_err) {
        if (cancelled) return;
        setDestinationPreview(null);
        setDestinationPreviewSeverity("info");
        setDestinationPreviewError(
          tWorkOrders(
            "fields.locationPreviewRetryOnSave",
            "Live destination preview is temporarily unavailable. Schedulaa will still try to resolve this location when you save the work order."
          )
        );
      } finally {
        if (!cancelled) setDestinationPreviewLoading(false);
      }
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.location, open, tWorkOrders]);

  useEffect(() => {
    const location = String(form.location || "").trim();
    if (!open || !location) {
      setLocationSuggestions([]);
      setLocationSuggestionsLoading(false);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLocationSuggestionsLoading(true);
      setLocationSuggestions(buildTypedLocationFallback(location));
      try {
        const res = await listWorkOrderLocationSuggestions(location, 6);
        if (cancelled) return;
        const items = Array.isArray(res?.items) ? res.items : [];
        setLocationSuggestions(items.length ? items : buildTypedLocationFallback(location));
        setLocationAutocompleteConfigured(res?.configured !== false);
      } catch (_err) {
        if (cancelled) return;
        setLocationSuggestions(buildTypedLocationFallback(location));
      } finally {
        if (!cancelled) setLocationSuggestionsLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.location, open]);

  useEffect(() => {
    if (!destinationPreview) return;
    const previewLat = Number(destinationPreview.lat);
    const previewLng = Number(destinationPreview.lng);
    if (!Number.isFinite(previewLat) || !Number.isFinite(previewLng)) return;
    setForm((current) => {
      const currentLat = String(current.destination_lat ?? "").trim();
      const currentLng = String(current.destination_lng ?? "").trim();
      if (currentLat && currentLng) return current;
      return {
        ...current,
        destination_lat: currentLat || String(previewLat),
        destination_lng: currentLng || String(previewLng),
      };
    });
  }, [destinationPreview]);

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
    const nextMetadata = {
      ...(form.metadata && typeof form.metadata === "object" ? form.metadata : {}),
    };
    const destinationLat = form.destination_lat === "" ? null : Number(form.destination_lat);
    const destinationLng = form.destination_lng === "" ? null : Number(form.destination_lng);
    if (form.destination_lat !== "" && !Number.isFinite(destinationLat)) {
      setSaving(false);
      setError(tWorkOrders("errors.destinationLatInvalid", "Destination latitude must be a valid number."));
      return;
    }
    if (form.destination_lng !== "" && !Number.isFinite(destinationLng)) {
      setSaving(false);
      setError(tWorkOrders("errors.destinationLngInvalid", "Destination longitude must be a valid number."));
      return;
    }
    if ((form.destination_lat === "") !== (form.destination_lng === "")) {
      setSaving(false);
      setError(tWorkOrders("errors.destinationPairRequired", "Add both destination latitude and longitude, or leave both blank."));
      return;
    }
    if (Number.isFinite(destinationLat) && Number.isFinite(destinationLng)) {
      nextMetadata.destination_lat = destinationLat;
      nextMetadata.destination_lng = destinationLng;
      nextMetadata.destination_source = "manual";
      nextMetadata.destination = {
        ...(nextMetadata.destination && typeof nextMetadata.destination === "object" ? nextMetadata.destination : {}),
        lat: destinationLat,
        lng: destinationLng,
      };
    } else {
      delete nextMetadata.destination_lat;
      delete nextMetadata.destination_lng;
      delete nextMetadata.destination_source;
      if (nextMetadata.destination && typeof nextMetadata.destination === "object") {
        delete nextMetadata.destination.lat;
        delete nextMetadata.destination.lng;
        delete nextMetadata.destination.latitude;
        delete nextMetadata.destination.longitude;
        if (!Object.keys(nextMetadata.destination).length) {
          delete nextMetadata.destination;
        }
      }
    }
    const payload = {
      title: form.title,
      location: form.location || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      timezone: form.timezone || null,
      notes: form.notes || null,
      manager_only_notes: form.manager_only_notes || null,
      employee_visible_notes: form.employee_visible_notes || null,
      metadata: nextMetadata,
    };
    if (!workOrder) {
      payload.client_id = form.client_id || null;
      payload.finance_estimate_id = form.finance_estimate_id || null;
      payload.invoice_id = form.invoice_id || null;
      payload.copy_materials_from_estimate = !!form.copy_materials_from_estimate;
    }
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

          <Autocomplete
            freeSolo
            fullWidth
            openOnFocus
            autoHighlight
            options={locationSuggestions}
            filterOptions={(x) => x}
            getOptionLabel={(option) => (typeof option === "string" ? option : option?.label || "")}
            inputValue={form.location}
            onInputChange={(_event, nextValue, reason) => {
              if (reason === "reset") return;
              setField("location", nextValue);
            }}
            onChange={(_event, nextValue) => {
              if (typeof nextValue === "string") {
                setField("location", nextValue);
                return;
              }
              setField("location", nextValue?.label || "");
            }}
            loading={locationSuggestionsLoading}
            noOptionsText={
              form.location
                ? tWorkOrders("fields.locationSuggestionsNone", "No location suggestions yet")
                : tWorkOrders("fields.locationSuggestionsStart", "Start typing an address, city, or postal code")
            }
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <Box
                  component="li"
                  {...optionProps}
                  key={`location-option-${option?.place_id || option?.label}`}
                  sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", py: 0.75 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {option?.primary_text || option?.label}
                  </Typography>
                  {option?.secondary_text ? (
                    <Typography variant="caption" color="text.secondary">
                      {option.secondary_text}
                    </Typography>
                  ) : null}
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={tWorkOrders("fields.location", "Location")}
                helperText={
                  locationAutocompleteConfigured
                    ? tWorkOrders("fields.locationHelpAutocomplete", "Type an address, city, region, or postal code and pick a suggestion when available.")
                    : tWorkOrders("fields.locationHelp", "Service address or destination label shown to managers, employees, and clients.")
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {locationSuggestionsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          {destinationPreviewLoading ? (
            <Typography variant="caption" color="text.secondary">
              {tWorkOrders("fields.locationPreviewLoading", "Checking destination…")}
            </Typography>
          ) : null}
          {!destinationPreviewLoading && destinationPreview ? (
            <Alert severity="success">
              <strong>{tWorkOrders("fields.locationPreviewReady", "Destination found")}:</strong> {destinationPreview.label}
              {Number.isFinite(Number(destinationPreview.lat)) && Number.isFinite(Number(destinationPreview.lng))
                ? ` (${Number(destinationPreview.lat).toFixed(4)}, ${Number(destinationPreview.lng).toFixed(4)})`
                : ""}
            </Alert>
          ) : null}
          {!destinationPreviewLoading && !destinationPreview && destinationPreviewError ? (
            <Alert severity={destinationPreviewSeverity}>{destinationPreviewError}</Alert>
          ) : null}

          <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={800}>
              {tWorkOrders("sections.dispatchDestination", "Dispatch destination coordinates")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {tWorkOrders("sections.dispatchDestinationHelp", "Optional advanced override. If left blank, Schedulaa will try to geocode the Location automatically when you save the work order.")}
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label={tWorkOrders("fields.destinationLatitude", "Destination latitude")}
                value={form.destination_lat}
                onChange={(e) => setField("destination_lat", e.target.value)}
                fullWidth
                placeholder="44.1041"
              />
              <TextField
                label={tWorkOrders("fields.destinationLongitude", "Destination longitude")}
                value={form.destination_lng}
                onChange={(e) => setField("destination_lng", e.target.value)}
                fullWidth
                placeholder="-79.5644"
              />
            </Stack>
          </Stack>

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
