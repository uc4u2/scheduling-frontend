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
  FormHelperText,
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
import { useTranslation } from "react-i18next";
import { createEstimate, updateEstimate } from "./financeApi";
import { formatDate } from "../../utils/datetime";
import ThemedDateField from "../../components/ui/ThemedDateField";
import {
  getActiveCurrency,
  getCurrencyOptions,
  normalizeCurrency,
  subscribeToActiveCurrency,
} from "../../utils/currency";

const makeLine = (line = {}, index = 0) => ({
  id: line.id || `line-${Date.now()}-${index}`,
  preset_key: line.preset_key || (line.item_type === "material" ? "materials" : line.item_type === "custom" ? "custom" : "service"),
  item_type: line.item_type || "service",
  description: line.description || "",
  quantity: line.quantity ?? 1,
  unit_price: line.unit_price ?? 0,
  taxable: Boolean(line.taxable),
  tax_rate: line.tax_rate ?? "",
});

const LINE_ITEM_PRESETS = {
  service: {
    key: "service",
    item_type: "service",
  },
  flat_fee: {
    key: "flat_fee",
    item_type: "service",
    quantity: 1,
  },
  hourly_work: {
    key: "hourly_work",
    item_type: "service",
  },
  materials: {
    key: "materials",
    item_type: "material",
  },
  custom: {
    key: "custom",
    item_type: "custom",
  },
};

const getPresetMeta = (line) =>
  LINE_ITEM_PRESETS[line?.preset_key] ||
  LINE_ITEM_PRESETS[line?.item_type === "material" ? "materials" : line?.item_type === "custom" ? "custom" : "service"];

const blankForm = (taxContext = {}) => ({
  client_id: "",
  estimate_number: "",
  title: "",
  issue_date: formatDate(new Date()),
  expiry_date: "",
  currency:
    normalizeCurrency(taxContext?.display_currency || getActiveCurrency("USD")) ||
    "USD",
  notes: "",
  terms: "",
  visible_notes: "",
  internal_notes: "",
  discount_total: 0,
  line_items: [makeLine()],
});

const getDefaultEstimateCurrency = (taxContext = {}) =>
  normalizeCurrency(taxContext?.display_currency || getActiveCurrency("USD")) || "USD";

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const hasMeaningfulRate = (value) => {
  if (value === null || value === undefined || value === "") return false;
  return Number(value) > 0;
};

const applyDefaultTaxRate = (line, taxContext) => {
  if (!line?.taxable) return line;
  if (hasMeaningfulRate(line.tax_rate)) return line;
  if (taxContext?.default_tax_rate == null) return line;
  return { ...line, tax_rate: String(taxContext.default_tax_rate) };
};

const computePreviewLine = (line, taxContext = {}) => {
  const quantity = toNumber(line.quantity, 1);
  const unitPrice = toNumber(line.unit_price, 0);
  const gross = roundMoney(quantity * unitPrice);
  const taxable = Boolean(line.taxable);
  const taxRate = hasMeaningfulRate(line.tax_rate) ? toNumber(line.tax_rate, 0) : 0;
  if (!taxable || taxRate <= 0) {
    return { base: gross, tax: 0, gross };
  }
  if (taxContext?.prices_include_tax) {
    const base = roundMoney(gross / (1 + taxRate / 100));
    const tax = roundMoney(gross - base);
    return { base, tax, gross };
  }
  const base = gross;
  const tax = roundMoney(base * (taxRate / 100));
  return { base, tax, gross };
};

export default function EstimateEditorDialog({
  open,
  onClose,
  onSaved,
  estimate,
  clients = [],
  templates = [],
  taxContext,
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const tEstimate = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.estimates.editor.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const presetMetaFor = React.useCallback(
    (line) => {
      const presetMeta = getPresetMeta(line);
      const key = presetMeta.key;
      return {
        ...presetMeta,
        label: tEstimate(`lineItems.presets.${key}`, presetMeta.key),
        description: tEstimate(`lineItems.presetMeta.${key}.description`, ""),
        quantityLabel: tEstimate(
          `lineItems.presetMeta.${key}.quantityLabel`,
          key === "hourly_work" ? "Hours" : tEstimate("lineItems.fields.qty", "Qty")
        ),
        quantityHelper: tEstimate(`lineItems.presetMeta.${key}.quantityHelper`, ""),
        descriptionPlaceholder: tEstimate(`lineItems.presetMeta.${key}.descriptionPlaceholder`, ""),
      };
    },
    [tEstimate]
  );
  const currencyOptions = useMemo(() => getCurrencyOptions(), []);
  const [activeCurrency, setActiveCurrency] = useState(() => getDefaultEstimateCurrency(taxContext || {}));
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const effectiveTaxContext = useMemo(
    () => estimate?.tax_context || taxContext || {},
    [estimate?.tax_context, taxContext]
  );
  const currentCompanyTaxContext = taxContext || {};
  const currencyMismatch = Boolean(
    currentCompanyTaxContext?.display_currency &&
    normalizeCurrency(form.currency) &&
    normalizeCurrency(form.currency) !== normalizeCurrency(currentCompanyTaxContext.display_currency)
  );
  const jurisdictionMismatch = Boolean(
    estimate?.id &&
    (
      normalizeCurrency(effectiveTaxContext?.tax_country_code) !== normalizeCurrency(currentCompanyTaxContext?.tax_country_code) ||
      normalizeCurrency(effectiveTaxContext?.tax_region_code) !== normalizeCurrency(currentCompanyTaxContext?.tax_region_code) ||
      Boolean(effectiveTaxContext?.prices_include_tax) !== Boolean(currentCompanyTaxContext?.prices_include_tax)
    )
  );

  useEffect(() => subscribeToActiveCurrency((next) => {
    const normalized = normalizeCurrency(next) || "USD";
    setActiveCurrency(normalized);
  }), []);

  useEffect(() => {
    if (!open) return;
    if (estimate) {
      setForm({
        client_id: estimate.client_id || "",
        estimate_number: estimate.estimate_number || "",
        title: estimate.title || "",
        issue_date: estimate.issue_date || formatDate(new Date()),
        expiry_date: estimate.expiry_date || "",
        currency: normalizeCurrency(
          estimate.currency ||
          estimate.tax_context?.display_currency ||
          activeCurrency
        ) || activeCurrency,
        notes: estimate.notes || "",
        terms: estimate.terms || "",
        visible_notes: estimate.visible_notes || "",
        internal_notes: estimate.internal_notes || "",
        discount_total: estimate.discount_total ?? 0,
        line_items: Array.isArray(estimate.line_items) && estimate.line_items.length
          ? estimate.line_items.map((line, idx) =>
              applyDefaultTaxRate(makeLine(line, idx), estimate.tax_context || taxContext || {})
            )
          : [makeLine()],
      });
    } else {
      setForm({
        ...blankForm(taxContext || {}),
        currency: normalizeCurrency((taxContext || {}).display_currency || activeCurrency) || activeCurrency,
      });
    }
    setError("");
  }, [activeCurrency, estimate, open, taxContext]);

  const preview = useMemo(() => {
    const subtotal = roundMoney(
      form.line_items.reduce((sum, line) => sum + computePreviewLine(line, effectiveTaxContext).base, 0)
    );
    const taxTotal = roundMoney(
      form.line_items.reduce((sum, line) => sum + computePreviewLine(line, effectiveTaxContext).tax, 0)
    );
    const discount = roundMoney(toNumber(form.discount_total, 0));
    return {
      subtotal,
      taxTotal,
      total: roundMoney(subtotal + taxTotal - discount),
    };
  }, [effectiveTaxContext, form]);

  const applyTemplate = (templateId) => {
    const template = templates.find((item) => String(item.id) === String(templateId));
    if (!template) return;
    setForm((prev) => ({
      ...prev,
      notes: template.default_notes || prev.notes,
      terms: template.default_terms || prev.terms,
      line_items: Array.isArray(template.line_items) && template.line_items.length
        ? template.line_items.map((line, idx) =>
            applyDefaultTaxRate(makeLine(line, idx), effectiveTaxContext)
          )
        : prev.line_items,
    }));
  };

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const setLineField = (lineId, field, value) => {
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.map((line) => {
        if (line.id !== lineId) return line;
        const next = { ...line, [field]: value };
        if (field === "taxable") {
          if (!value) {
            next.tax_rate = "";
          } else if (!hasMeaningfulRate(next.tax_rate)) {
            const withDefault = applyDefaultTaxRate(next, effectiveTaxContext);
            next.tax_rate = withDefault.tax_rate;
          }
        }
        return next;
      }),
    }));
  };

  const applyLinePreset = (lineId, presetKey) => {
    const preset = LINE_ITEM_PRESETS[presetKey] || LINE_ITEM_PRESETS.custom;
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.map((line) => {
        if (line.id !== lineId) return line;
        const next = {
          ...line,
          preset_key: preset.key,
          item_type: preset.item_type,
        };
        if (preset.quantity !== undefined) {
          next.quantity = preset.quantity;
        }
        return applyDefaultTaxRate(next, effectiveTaxContext);
      }),
    }));
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      line_items: [...prev.line_items, applyDefaultTaxRate(makeLine({}, prev.line_items.length), effectiveTaxContext)],
    }));
  };

  const removeLine = (lineId) => {
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.length > 1 ? prev.line_items.filter((line) => line.id !== lineId) : prev.line_items,
    }));
  };

  const handleSave = async () => {
    if (!form.client_id || !form.title || !form.issue_date) {
      setError(tEstimate("errors.requiredFields", "Client, title, and issue date are required."));
      return;
    }
    if (!form.line_items.some((line) => String(line.description || "").trim())) {
      setError(tEstimate("errors.lineItemRequired", "Add at least one line item."));
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
          tax_rate:
            line.taxable && hasMeaningfulRate(line.tax_rate)
              ? toNumber(line.tax_rate, 0)
              : null,
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
      setError(err?.response?.data?.error || err?.message || tEstimate("errors.saveFailed", "Unable to save estimate."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle>{estimate ? tEstimate("title.edit", "Edit estimate") : tEstimate("title.new", "New estimate")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
            {estimate?.quote_request_id ? <Chip size="small" variant="outlined" color="info" label={tEstimate("quoteRequestChip", "Created from quote request")} /> : null}
            <Typography variant="caption" color="text.secondary">
              {tEstimate(
                "intro",
                "Estimate is the proposed price. Convert it to an invoice when payment is needed, or create a work order when the job is ready to schedule."
              )}
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{tEstimate("fields.client", "Client")}</InputLabel>
                <Select
                  label={tEstimate("fields.client", "Client")}
                  value={form.client_id}
                  onChange={(e) => setField("client_id", e.target.value)}
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.first_name || client.last_name
                        ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
                        : client.email || tEstimate("fields.clientFallback", "Client #{{id}}", { id: client.id })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel shrink>{tEstimate("fields.template", "Template")}</InputLabel>
                <Select
                  label={tEstimate("fields.template", "Template")}
                  value=""
                  displayEmpty
                  notched
                  renderValue={() =>
                    templates.length
                      ? tEstimate("fields.templateChoose", "Choose a template")
                      : tEstimate("fields.templateEmpty", "No templates yet")
                  }
                  onChange={(e) => applyTemplate(e.target.value)}
                >
                  <MenuItem value="">
                    <em>
                      {templates.length
                        ? tEstimate("fields.templateChoose", "Choose a template")
                        : tEstimate("fields.templateEmpty", "No templates yet")}
                    </em>
                  </MenuItem>
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {templates.length
                    ? tEstimate("fields.templateHelp", "Apply a saved estimate template to prefill notes, terms, and line items.")
                    : tEstimate("fields.templateEmptyHelp", "Save an estimate as a template first, then reuse it here later.")}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={tEstimate("fields.estimateTitle", "Estimate title")} value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={tEstimate("fields.estimateNumber", "Estimate number")} value={form.estimate_number} onChange={(e) => setField("estimate_number", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label={tEstimate("fields.currency", "Currency")}
                value={form.currency}
                onChange={(e) => setField("currency", e.target.value)}
                helperText={tEstimate("fields.currencyHelp", "Starts with your company display currency from settings. You can override it for this estimate.")}
                InputProps={{
                  endAdornment: (
                    <Tooltip title={tEstimate("fields.currencyTooltip", "This defaults to the company display currency saved in settings. Change it here only when this estimate needs a different currency.")}>
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
            <Grid item xs={12}>
              <Alert
                severity={effectiveTaxContext?.warning || currencyMismatch || jurisdictionMismatch ? "warning" : "info"}
                variant="outlined"
              >
                <Stack spacing={0.75}>
                  <Typography variant="body2" fontWeight={700}>
                    {tEstimate("taxContext.title", "Tax & currency context")}
                  </Typography>
                  <Typography variant="body2">
                    {tEstimate("taxContext.displayCurrency", "Display currency")}: <strong>{effectiveTaxContext?.display_currency || form.currency || "USD"}</strong>
                    {" • "}
                    {tEstimate("taxContext.taxRegion", "Tax country/region")}: <strong>{effectiveTaxContext?.tax_country_code || "—"} / {effectiveTaxContext?.tax_region_code || "—"}</strong>
                    {" • "}
                    {tEstimate("taxContext.pricesIncludeTax", "Prices include tax")}: <strong>{effectiveTaxContext?.prices_include_tax ? tEstimate("taxContext.on", "ON") : tEstimate("taxContext.off", "OFF")}</strong>
                    {effectiveTaxContext?.default_tax_rate != null ? (
                      <>
                        {" • "}
                        {tEstimate("taxContext.defaultTaxRate", "Default tax rate")}: <strong>{Number(effectiveTaxContext.default_tax_rate).toFixed(2)}%</strong>
                      </>
                    ) : null}
                  </Typography>
                  <Typography variant="body2">
                    {effectiveTaxContext?.prices_include_tax
                      ? tEstimate("taxContext.includedMessage", "Prices include tax. Tax is backed out from taxable line prices.")
                      : tEstimate("taxContext.addedMessage", "Tax is added on top based on your company tax settings.")}
                  </Typography>
                  {currencyMismatch ? (
                    <Typography variant="body2" color="warning.main">
                      {tEstimate("taxContext.currencyMismatch", "This estimate uses a different currency than your current company display currency. Keep it only if that is intentional.")}
                    </Typography>
                  ) : null}
                  {jurisdictionMismatch ? (
                    <Typography variant="body2" color="warning.main">
                      {tEstimate("taxContext.jurisdictionMismatch", "This estimate was created under different company tax settings than the current ones. Keep it only if that historical tax treatment is intentional.")}
                    </Typography>
                  ) : null}
                  {effectiveTaxContext?.warning ? (
                    <Typography variant="body2">{effectiveTaxContext.warning}</Typography>
                  ) : null}
                </Stack>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <ThemedDateField
                fullWidth
                label={tEstimate("fields.issueDate", "Issue date")}
                value={form.issue_date}
                onChange={(e) => setField("issue_date", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ThemedDateField
                fullWidth
                label={tEstimate("fields.expiryDate", "Expiry date")}
                value={form.expiry_date}
                onChange={(e) => setField("expiry_date", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tEstimate("fields.visibleNotes", "Visible notes")} value={form.visible_notes} onChange={(e) => setField("visible_notes", e.target.value)} multiline minRows={2} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tEstimate("fields.internalNotes", "Internal notes")} value={form.internal_notes} onChange={(e) => setField("internal_notes", e.target.value)} multiline minRows={2} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={tEstimate("fields.notes", "Notes")} value={form.notes} onChange={(e) => setField("notes", e.target.value)} multiline minRows={2} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={tEstimate("fields.terms", "Terms")} value={form.terms} onChange={(e) => setField("terms", e.target.value)} multiline minRows={2} />
            </Grid>
          </Grid>

          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>
                {tEstimate("lineItems.title", "Line items")}
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addLine}>
                {tEstimate("lineItems.addLine", "Add line")}
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
                {(() => {
                  const presetMeta = presetMetaFor(line);
                  return (
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label={tEstimate("lineItems.fields.preset", "Preset")}
                      value={line.preset_key || presetMeta.key}
                      onChange={(e) => applyLinePreset(line.id, e.target.value)}
                      helperText={presetMeta.description}
                    >
                      <MenuItem value="service">{tEstimate("lineItems.presets.service", "Service")}</MenuItem>
                      <MenuItem value="flat_fee">{tEstimate("lineItems.presets.flatFee", "Flat fee")}</MenuItem>
                      <MenuItem value="hourly_work">{tEstimate("lineItems.presets.hourlyWork", "Hourly work")}</MenuItem>
                      <MenuItem value="materials">{tEstimate("lineItems.presets.materials", "Materials")}</MenuItem>
                      <MenuItem value="custom">{tEstimate("lineItems.presets.custom", "Custom")}</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField select fullWidth label={tEstimate("lineItems.fields.type", "Type")} value={line.item_type} onChange={(e) => setLineField(line.id, "item_type", e.target.value)}>
                      <MenuItem value="service">{tEstimate("lineItems.types.service", "Service")}</MenuItem>
                      <MenuItem value="material">{tEstimate("lineItems.types.material", "Material")}</MenuItem>
                      <MenuItem value="custom">{tEstimate("lineItems.types.custom", "Custom")}</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label={tEstimate("lineItems.fields.description", "Description")}
                      placeholder={presetMeta.descriptionPlaceholder}
                      value={line.description}
                      onChange={(e) => setLineField(line.id, "description", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} md={1.5}>
                    <TextField
                      fullWidth
                      label={presetMeta.quantityLabel || tEstimate("lineItems.fields.qty", "Qty")}
                      type="number"
                      inputProps={{ step: "0.01" }}
                      value={line.quantity}
                      onChange={(e) => setLineField(line.id, "quantity", e.target.value)}
                      helperText={presetMeta.quantityHelper}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label={tEstimate("lineItems.fields.unitPrice", "Unit price")}
                      type="number"
                      inputProps={{ step: "0.01" }}
                      value={line.unit_price}
                      onChange={(e) => setLineField(line.id, "unit_price", e.target.value)}
                      helperText={effectiveTaxContext?.prices_include_tax ? tEstimate("lineItems.taxIncludedPrice", "Tax-included price") : tEstimate("lineItems.preTaxPrice", "Pre-tax price")}
                    />
                  </Grid>
                  <Grid item xs={6} md={1.5}>
                    <TextField
                      fullWidth
                      label={tEstimate("lineItems.fields.taxPercent", "Tax %")}
                      type="number"
                      inputProps={{ step: "0.01" }}
                      value={line.tax_rate}
                      onChange={(e) => setLineField(line.id, "tax_rate", e.target.value)}
                      disabled={!line.taxable}
                    />
                  </Grid>
                  <Grid item xs={4} md={1}>
                    <TextField
                      select
                      fullWidth
                      label={tEstimate("lineItems.fields.taxable", "Taxable")}
                      value={line.taxable ? "yes" : "no"}
                      onChange={(e) => setLineField(line.id, "taxable", e.target.value === "yes")}
                    >
                      <MenuItem value="yes">{tEstimate("lineItems.taxableYes", "Yes")}</MenuItem>
                      <MenuItem value="no">{tEstimate("lineItems.taxableNo", "No")}</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={2} md={0.5}>
                    <IconButton onClick={() => removeLine(line.id)} disabled={form.line_items.length === 1}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Grid>
                </Grid>
                  );
                })()}
              </Box>
            ))}
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={tEstimate("fields.discountTotal", "Discount total")} type="number" inputProps={{ step: "0.01" }} value={form.discount_total} onChange={(e) => setField("discount_total", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={8}>
              <Alert severity="info">
                {tEstimate("previewInfo", "Preview only. The backend recalculates subtotal, tax, and total using your Business Finance tax settings when you save.")}
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Typography variant="body2">{tEstimate("totals.subtotal", "Subtotal")}: {preview.subtotal.toFixed(2)}</Typography>
                <Typography variant="body2">{tEstimate("totals.tax", "Tax")}: {preview.taxTotal.toFixed(2)}</Typography>
                <Typography variant="body2">{tEstimate("totals.total", "Total")}: {preview.total.toFixed(2)}</Typography>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {tEstimate("common.cancel", "Cancel")}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? tEstimate("common.saving", "Saving...") : estimate ? tEstimate("common.saveChanges", "Save changes") : tEstimate("common.createEstimate", "Create estimate")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
