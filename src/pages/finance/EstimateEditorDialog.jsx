import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Tooltip,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTheme } from "@mui/material/styles";
import { createEstimate, updateEstimate } from "./financeApi";
import { formatDate } from "../../utils/datetime";
import ThemedDateField from "../../components/ui/ThemedDateField";
import { getActiveCurrency, getCurrencyOptions, normalizeCurrency } from "../../utils/currency";

const makeLine = (line = {}, index = 0) => ({
  id: line.id || `line-${Date.now()}-${index}`,
  item_type: line.item_type || "service",
  description: line.description || "",
  quantity: line.quantity ?? 1,
  unit_price: line.unit_price ?? 0,
  taxable: Boolean(line.taxable),
  tax_rate: line.tax_rate ?? 0,
});

const blankForm = () => ({
  client_id: "",
  estimate_number: "",
  title: "",
  issue_date: formatDate(new Date()),
  expiry_date: "",
  currency: normalizeCurrency(getActiveCurrency("USD")) || "USD",
  notes: "",
  terms: "",
  visible_notes: "",
  internal_notes: "",
  discount_total: 0,
  line_items: [makeLine()],
});

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export default function EstimateEditorDialog({
  open,
  onClose,
  onSaved,
  estimate,
  clients = [],
  templates = [],
}) {
  const theme = useTheme();
  const currencyOptions = useMemo(() => getCurrencyOptions(), []);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (estimate) {
      setForm({
        client_id: estimate.client_id || "",
        estimate_number: estimate.estimate_number || "",
        title: estimate.title || "",
        issue_date: estimate.issue_date || formatDate(new Date()),
        expiry_date: estimate.expiry_date || "",
        currency: estimate.currency || "USD",
        notes: estimate.notes || "",
        terms: estimate.terms || "",
        visible_notes: estimate.visible_notes || "",
        internal_notes: estimate.internal_notes || "",
        discount_total: estimate.discount_total ?? 0,
        line_items: Array.isArray(estimate.line_items) && estimate.line_items.length
          ? estimate.line_items.map((line, idx) => makeLine(line, idx))
          : [makeLine()],
      });
    } else {
      setForm(blankForm());
    }
    setError("");
  }, [estimate, open]);

  const preview = useMemo(() => {
    const subtotal = form.line_items.reduce(
      (sum, line) => sum + toNumber(line.quantity, 1) * toNumber(line.unit_price, 0),
      0
    );
    const taxTotal = form.line_items.reduce((sum, line) => {
      const amount = toNumber(line.quantity, 1) * toNumber(line.unit_price, 0);
      if (!line.taxable) return sum;
      return sum + amount * (toNumber(line.tax_rate, 0) / 100);
    }, 0);
    const discount = toNumber(form.discount_total, 0);
    return {
      subtotal,
      taxTotal,
      total: subtotal + taxTotal - discount,
    };
  }, [form]);

  const applyTemplate = (templateId) => {
    const template = templates.find((item) => String(item.id) === String(templateId));
    if (!template) return;
    setForm((prev) => ({
      ...prev,
      notes: template.default_notes || prev.notes,
      terms: template.default_terms || prev.terms,
      line_items: Array.isArray(template.line_items) && template.line_items.length
        ? template.line_items.map((line, idx) => makeLine(line, idx))
        : prev.line_items,
    }));
  };

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const setLineField = (lineId, field, value) => {
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)),
    }));
  };

  const addLine = () => {
    setForm((prev) => ({ ...prev, line_items: [...prev.line_items, makeLine({}, prev.line_items.length)] }));
  };

  const removeLine = (lineId) => {
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.length > 1 ? prev.line_items.filter((line) => line.id !== lineId) : prev.line_items,
    }));
  };

  const handleSave = async () => {
    if (!form.client_id || !form.title || !form.issue_date) {
      setError("Client, title, and issue date are required.");
      return;
    }
    if (!form.line_items.some((line) => String(line.description || "").trim())) {
      setError("Add at least one line item.");
      return;
    }

    const payload = {
      client_id: Number(form.client_id),
      estimate_number: String(form.estimate_number || "").trim() || undefined,
      title: form.title,
      issue_date: form.issue_date,
      expiry_date: form.expiry_date || null,
      currency: form.currency || "USD",
      notes: form.notes || "",
      terms: form.terms || "",
      visible_notes: form.visible_notes || "",
      internal_notes: form.internal_notes || "",
      discount_total: toNumber(form.discount_total, 0),
      line_items: form.line_items
        .filter((line) => String(line.description || "").trim())
        .map((line, idx) => ({
          item_type: line.item_type || "service",
          description: line.description,
          quantity: toNumber(line.quantity, 1),
          unit_price: toNumber(line.unit_price, 0),
          taxable: Boolean(line.taxable),
          tax_rate: line.taxable ? toNumber(line.tax_rate, 0) : null,
          sort_order: idx,
        })),
    };

    setLoading(true);
    setError("");
    try {
      const saved = estimate ? await updateEstimate(estimate.id, payload) : await createEstimate(payload);
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to save estimate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle>{estimate ? "Edit estimate" : "New estimate"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
            {estimate?.quote_request_id ? <Chip size="small" variant="outlined" color="info" label="Created from quote request" /> : null}
            <Typography variant="caption" color="text.secondary">
              Estimate is the proposed price. Convert it to an invoice when payment is needed, or create a work order when the job is ready to schedule.
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  label="Client"
                  value={form.client_id}
                  onChange={(e) => setField("client_id", e.target.value)}
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.first_name || client.last_name
                        ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
                        : client.email || `Client #${client.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select label="Template" value="" onChange={(e) => applyTemplate(e.target.value)}>
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Estimate title" value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Estimate number" value={form.estimate_number} onChange={(e) => setField("estimate_number", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Currency"
                value={form.currency}
                onChange={(e) => setField("currency", e.target.value)}
                helperText="Starts with your company display currency from settings. You can override it for this estimate."
                InputProps={{
                  endAdornment: (
                    <Tooltip title="This defaults to the company display currency saved in settings. Change it here only when this estimate needs a different currency.">
                      <InfoOutlinedIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                    </Tooltip>
                  ),
                }}
              >
                {currencyOptions.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <ThemedDateField
                fullWidth
                label="Issue date"
                value={form.issue_date}
                onChange={(e) => setField("issue_date", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ThemedDateField
                fullWidth
                label="Expiry date"
                value={form.expiry_date}
                onChange={(e) => setField("expiry_date", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Visible notes" value={form.visible_notes} onChange={(e) => setField("visible_notes", e.target.value)} multiline minRows={2} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Internal notes" value={form.internal_notes} onChange={(e) => setField("internal_notes", e.target.value)} multiline minRows={2} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Notes" value={form.notes} onChange={(e) => setField("notes", e.target.value)} multiline minRows={2} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Terms" value={form.terms} onChange={(e) => setField("terms", e.target.value)} multiline minRows={2} />
            </Grid>
          </Grid>

          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>
                Line items
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addLine}>
                Add line
              </Button>
            </Stack>
            {form.line_items.map((line) => (
              <Box
                key={line.id}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} md={2}>
                    <TextField select fullWidth label="Type" value={line.item_type} onChange={(e) => setLineField(line.id, "item_type", e.target.value)}>
                      <MenuItem value="service">Service</MenuItem>
                      <MenuItem value="material">Material</MenuItem>
                      <MenuItem value="custom">Custom</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Description" value={line.description} onChange={(e) => setLineField(line.id, "description", e.target.value)} />
                  </Grid>
                  <Grid item xs={6} md={1.5}>
                    <TextField fullWidth label="Qty" type="number" inputProps={{ step: "0.01" }} value={line.quantity} onChange={(e) => setLineField(line.id, "quantity", e.target.value)} />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField fullWidth label="Unit price" type="number" inputProps={{ step: "0.01" }} value={line.unit_price} onChange={(e) => setLineField(line.id, "unit_price", e.target.value)} />
                  </Grid>
                  <Grid item xs={6} md={1.5}>
                    <TextField fullWidth label="Tax %" type="number" inputProps={{ step: "0.01" }} value={line.tax_rate} onChange={(e) => setLineField(line.id, "tax_rate", e.target.value)} disabled={!line.taxable} />
                  </Grid>
                  <Grid item xs={4} md={1}>
                    <TextField
                      select
                      fullWidth
                      label="Taxable"
                      value={line.taxable ? "yes" : "no"}
                      onChange={(e) => setLineField(line.id, "taxable", e.target.value === "yes")}
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={2} md={0.5}>
                    <IconButton onClick={() => removeLine(line.id)} disabled={form.line_items.length === 1}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Discount total" type="number" inputProps={{ step: "0.01" }} value={form.discount_total} onChange={(e) => setField("discount_total", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={8}>
              <Alert severity="info">
                Preview only. The backend recalculates subtotal, tax, and total when you save.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Typography variant="body2">Subtotal: {preview.subtotal.toFixed(2)}</Typography>
                <Typography variant="body2">Tax: {preview.taxTotal.toFixed(2)}</Typography>
                <Typography variant="body2">Total: {preview.total.toFixed(2)}</Typography>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : estimate ? "Save changes" : "Create estimate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
