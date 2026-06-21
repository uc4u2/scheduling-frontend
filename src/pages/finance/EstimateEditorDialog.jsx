import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
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
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { createEstimate, createManagerClient, updateEstimate } from "./financeApi";
import ClientQuickCreateDialog from "./ClientQuickCreateDialog";
import ClientLookupField from "./ClientLookupField";
import { buildClientCreatePayload } from "./clientUtils";
import FinanceAuditTimeline from "./components/FinanceAuditTimeline";
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

const PRESET_ENTERPRISE_HINTS = {
  service: "Best for labor or fixed service fees.",
  flat_fee: "Best for one packaged price or project fee.",
  hourly_work: "Best for time-based billing where quantity is hours.",
  materials: "Best for billable materials, supplies, or resale items.",
  custom: "Best for charges that do not fit the standard presets.",
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

const getEstimateClientNotes = (estimate = {}) =>
  String(estimate?.visible_notes || estimate?.notes || "").trim();

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

const computePreviewLine = (line, taxContext = {}) => {
  const quantity = toNumber(line.quantity, 1);
  const unitPrice = toNumber(line.unit_price, 0);
  const gross = roundMoney(quantity * unitPrice);
  const taxable = Boolean(line.taxable);
  const taxRate = hasMeaningfulRate(line.tax_rate)
    ? toNumber(line.tax_rate, 0)
    : taxable && taxContext?.default_tax_rate != null
    ? toNumber(taxContext.default_tax_rate, 0)
    : 0;
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
  onNavigate,
  estimate,
  initialDraft = null,
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
        enterpriseHint: tEstimate(`lineItems.presetMeta.${key}.enterpriseHint`, PRESET_ENTERPRISE_HINTS[key] || ""),
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
  const [lineItemError, setLineItemError] = useState({ lineId: null, field: "" });
  const [estimateNumberError, setEstimateNumberError] = useState("");
  const [taxContextOpen, setTaxContextOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientSaving, setClientSaving] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", email: "", phone: "" });
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
        notes: getEstimateClientNotes(estimate),
        terms: estimate.terms || "",
        visible_notes: getEstimateClientNotes(estimate),
        internal_notes: estimate.internal_notes || "",
        discount_total: estimate.discount_total ?? 0,
        line_items: Array.isArray(estimate.line_items) && estimate.line_items.length
          ? estimate.line_items.map((line, idx) => makeLine(line, idx))
          : [makeLine()],
      });
    } else {
      setForm({
        ...blankForm(taxContext || {}),
        currency: normalizeCurrency((taxContext || {}).display_currency || activeCurrency) || activeCurrency,
        client_id: initialDraft?.client_id || "",
        title: initialDraft?.title || "",
        notes: initialDraft?.notes || "",
        visible_notes: initialDraft?.visible_notes || initialDraft?.notes || "",
        internal_notes: initialDraft?.internal_notes || "",
      });
    }
    setError("");
    setLineItemError({ lineId: null, field: "" });
    setEstimateNumberError("");
  }, [activeCurrency, estimate, initialDraft, open, taxContext]);

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
    const templateNotes = String(template.default_notes || "").trim();
    setForm((prev) => ({
      ...prev,
      notes: templateNotes || prev.notes,
      visible_notes: templateNotes || prev.visible_notes,
      terms: template.default_terms || prev.terms,
      line_items: Array.isArray(template.line_items) && template.line_items.length
        ? template.line_items.map((line, idx) => makeLine(line, idx))
        : prev.line_items,
    }));
  };

  const setField = (field, value) => {
    if (field === "estimate_number") {
      setEstimateNumberError("");
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setClientNotes = (value) =>
    setForm((prev) => ({
      ...prev,
      notes: value,
      visible_notes: value,
    }));

  const setLineField = (lineId, field, value) => {
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.map((line) => {
        if (line.id !== lineId) return line;
        const next = { ...line, [field]: value };
        if (field === "taxable") {
          if (!value) {
            next.tax_rate = "";
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
        return next;
      }),
    }));
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      line_items: [...prev.line_items, makeLine({}, prev.line_items.length)],
    }));
  };

  const removeLine = (lineId) => {
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.length > 1 ? prev.line_items.filter((line) => line.id !== lineId) : prev.line_items,
    }));
    setLineItemError((prev) => (prev.lineId === lineId ? { lineId: null, field: "" } : prev));
  };

  const handleSave = async () => {
    if (!form.client_id || !form.title || !form.issue_date) {
      setError(tEstimate("errors.requiredFields", "Client, title, and issue date are required."));
      setLineItemError({ lineId: null, field: "" });
      return;
    }
    const validLineItems = form.line_items.filter((line) => String(line.description || "").trim());
    if (!validLineItems.length) {
      const firstLine = form.line_items[0];
      setError(tEstimate("errors.lineItemDescriptionRequired", "Add a description to at least one line item before creating the estimate."));
      setLineItemError({ lineId: firstLine?.id || null, field: "description" });
      return;
    }
    setLineItemError({ lineId: null, field: "" });
    setEstimateNumberError("");

    const clientNotes = String(form.visible_notes || form.notes || "").trim();

    const payload = {
      client_id: Number(form.client_id),
      estimate_number: String(form.estimate_number || "").trim() || undefined,
      title: form.title,
      issue_date: form.issue_date,
      expiry_date: form.expiry_date || null,
      currency: form.currency || "USD",
      notes: clientNotes,
      terms: form.terms || "",
      visible_notes: clientNotes,
      internal_notes: form.internal_notes || "",
      discount_total: toNumber(form.discount_total, 0),
      line_items: validLineItems
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
      const apiError = err?.response?.data?.error || err?.message || "";
      if (apiError === "estimate_number_conflict") {
        setEstimateNumberError(
          tEstimate(
            "errors.estimateNumberConflict",
            "This estimate number is already in use. Choose another one or leave it blank to auto-generate."
          )
        );
        setError("");
      } else {
        setError(apiError || tEstimate("errors.saveFailed", "Unable to save estimate."));
      }
    } finally {
      setLoading(false);
    }
  };

  const openCreateClient = () => {
    setClientForm({ name: "", email: "", phone: "" });
    setClientDialogOpen(true);
  };

  const handleCreateClient = async () => {
    const payload = buildClientCreatePayload(clientForm);
    if (!payload.first_name || !payload.email) {
      setError(tEstimate("errors.clientCreateRequired", "Client name and email are required to create a new client."));
      return;
    }
    setClientSaving(true);
    setError("");
    try {
      const created = await createManagerClient(payload);
      setForm((prev) => ({ ...prev, client_id: created.id }));
      setClientDialogOpen(false);
      if (created?.reused) {
        setError("");
      }
    } catch (err) {
      const conflict = err?.response?.data;
      if (conflict?.error === "client_phone_conflict" && conflict?.suggested_client?.id) {
        const useExisting = window.confirm(
          `Possible existing client found: ${conflict.suggested_client.name || conflict.suggested_client.email || `#${conflict.suggested_client.id}`}. Use that client instead?`
        );
        if (useExisting) {
          setForm((prev) => ({ ...prev, client_id: conflict.suggested_client.id }));
          setClientDialogOpen(false);
          setError("");
        } else {
          setError("Possible existing client found. Open the existing client or cancel.");
        }
      } else {
        setError(err?.response?.data?.error || err?.message || tEstimate("errors.clientCreateFailed", "Unable to create client."));
      }
    } finally {
      setClientSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
          <Typography variant="inherit">
            {estimate ? tEstimate("title.edit", "Edit estimate") : tEstimate("title.new", "New estimate")}
          </Typography>
          {estimate?.id ? (
            <Button size="small" variant="contained" onClick={() => setAuditOpen(true)}>
              {tEstimate("audit.open", "Activity log")}
            </Button>
          ) : null}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
            {estimate?.quote_request_id ? <Chip size="small" variant="outlined" color="info" label={tEstimate("quoteRequestChip", "Created from quote request")} /> : null}
            <Tooltip
              title={tEstimate(
                "intro",
                "Estimate is the proposed price. Convert it to an invoice when payment is needed, or create a work order when the job is ready to schedule."
              )}
            >
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: "fit-content", cursor: "help" }}>
                <Typography variant="caption" color="text.secondary">
                  {tEstimate("introBadge", "What this estimate does")}
                </Typography>
                <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              </Stack>
            </Tooltip>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ClientLookupField
                label={tEstimate("fields.client", "Client")}
                value={form.client_id}
                onChange={(nextId) => setField("client_id", nextId)}
                helperText=""
                placeholder={tEstimate("fields.clientSearchPlaceholder", "Search client: ABC Property Management")}
                initialOptions={clients}
                fallbackLabel={tEstimate("fields.clientFallback", "Client")}
              />
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={openCreateClient}>
                  {tEstimate("actions.createClient", "Create new client")}
                </Button>
                <Tooltip title={tEstimate("fields.clientHelperNote", "Can’t find the client? Create it here and keep working on the estimate.")}>
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                </Tooltip>
              </Stack>
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
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={tEstimate("fields.estimateTitle", "Estimate title")} placeholder={tEstimate("fields.estimateTitlePlaceholder", "Kitchen exhaust cleaning estimate")} value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={tEstimate("fields.estimateNumber", "Estimate number (optional)")}
                value={form.estimate_number}
                onChange={(e) => setField("estimate_number", e.target.value)}
                error={Boolean(estimateNumberError)}
                InputProps={{
                  endAdornment: (
                    <Tooltip title={tEstimate("fields.estimateNumberHelp", "Leave blank to auto-generate the next estimate number.")}>
                      <InfoOutlinedIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                    </Tooltip>
                  ),
                }}
                helperText={
                  estimateNumberError ||
                  " "
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label={tEstimate("fields.currency", "Currency")}
                value={form.currency}
                onChange={(e) => setField("currency", e.target.value)}
                helperText=" "
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
                <Stack spacing={1}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
                    <Stack spacing={0.5}>
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
                    </Stack>
                    <Button
                      size="small"
                      variant="text"
                      endIcon={taxContextOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      onClick={() => setTaxContextOpen((prev) => !prev)}
                    >
                      {taxContextOpen
                        ? tEstimate("taxContext.hideDetails", "Hide details")
                        : tEstimate("taxContext.showDetails", "Show details")}
                    </Button>
                  </Stack>
                  <Collapse in={taxContextOpen}>
                    <Stack spacing={0.75}>
                      <Typography variant="body2">
                        {effectiveTaxContext?.prices_include_tax
                          ? tEstimate("taxContext.includedMessage", "Prices include tax. Tax is backed out from taxable line prices.")
                          : tEstimate("taxContext.addedMessage", "Tax is added on top based on your company tax settings.")}
                      </Typography>
                      <Typography variant="body2">
                        {tEstimate(
                          "taxContext.taxableLineRule",
                          "Company default tax applies only to line items marked Taxable = Yes."
                        )}
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
                      <Button size="small" variant="text" onClick={() => onNavigate?.("finance-overview")} sx={{ alignSelf: "flex-start" }}>
                        {tEstimate("taxContext.manageAction", "Manage Business Finance tax")}
                      </Button>
                    </Stack>
                  </Collapse>
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
              <TextField
                fullWidth
                label={tEstimate("fields.clientNotes", "Client notes")}
                value={form.visible_notes || form.notes}
                onChange={(e) => setClientNotes(e.target.value)}
                multiline
                minRows={2}
                InputProps={{
                  endAdornment: (
                    <Tooltip title={tEstimate("fields.clientNotesHelp", "Visible to the client on the estimate page and estimate PDF.")}>
                      <InfoOutlinedIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                    </Tooltip>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={tEstimate("fields.internalNotes", "Internal notes")}
                value={form.internal_notes}
                onChange={(e) => setField("internal_notes", e.target.value)}
                multiline
                minRows={2}
                InputProps={{
                  endAdornment: (
                    <Tooltip title={tEstimate("fields.internalNotesHelp", "For your team only. Not shown to the client.")}>
                      <InfoOutlinedIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                    </Tooltip>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={tEstimate("fields.terms", "Terms")}
                value={form.terms}
                onChange={(e) => setField("terms", e.target.value)}
                multiline
                minRows={2}
                InputProps={{
                  endAdornment: (
                    <Tooltip title={tEstimate("fields.termsHelp", "Client-facing estimate terms such as expiry, deposit requirements, scheduling conditions, or exclusions.")}>
                      <InfoOutlinedIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                    </Tooltip>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="h6" fontWeight={700}>
                  {tEstimate("lineItems.title", "Line items")}
                </Typography>
                <Tooltip
                  title={tEstimate(
                    "lineItems.pricingGuide",
                    "Set the price on each line with quantity and unit price. Presets help structure the line, but totals come from the values you enter here."
                  )}
                >
                  <InfoOutlinedIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                </Tooltip>
              </Stack>
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
                  const linePreview = computePreviewLine(line, effectiveTaxContext);
                  const lineTotalPreview = roundMoney(linePreview.base + linePreview.tax);
                  return (
                <Grid container spacing={1.5} alignItems="flex-start">
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label={tEstimate("lineItems.fields.preset", "Preset")}
                      value={line.preset_key || presetMeta.key}
                      onChange={(e) => applyLinePreset(line.id, e.target.value)}
                      helperText={presetMeta.enterpriseHint || presetMeta.description}
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
                      onChange={(e) => {
                        setLineField(line.id, "description", e.target.value);
                        if (lineItemError.lineId === line.id && lineItemError.field === "description") {
                          const nextValue = String(e.target.value || "").trim();
                          if (nextValue) {
                            setLineItemError({ lineId: null, field: "" });
                            setError("");
                          }
                        }
                      }}
                      error={lineItemError.lineId === line.id && lineItemError.field === "description"}
                      helperText={
                        lineItemError.lineId === line.id && lineItemError.field === "description"
                          ? tEstimate("errors.lineItemDescriptionInline", "Description is required for at least one line item.")
                          : " "
                      }
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
                      helperText={
                        presetMeta.key === "hourly_work"
                          ? tEstimate(
                              "lineItems.hourlyRateHint",
                              "Use the hourly rate for one hour of work before quantity is applied."
                            )
                          : effectiveTaxContext?.prices_include_tax
                          ? tEstimate("lineItems.taxIncludedPrice", "Tax-included price")
                          : tEstimate("lineItems.preTaxPrice", "Pre-tax price")
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={8.5}>
                    <Grid container spacing={1.5} alignItems="flex-start">
                      <Grid item xs={12} sm={6} md={5}>
                    <TextField
                      fullWidth
                      label={tEstimate("lineItems.fields.taxPercentOptional", "Tax % (optional)")}
                      type="number"
                      inputProps={{ step: "0.01" }}
                      value={line.tax_rate}
                      onChange={(e) => setLineField(line.id, "tax_rate", e.target.value)}
                      disabled={!line.taxable}
                      helperText={
                        line.taxable
                          ? effectiveTaxContext?.default_tax_rate != null
                            ? tEstimate(
                                "lineItems.fields.taxPercentHelperDefault",
                                "Leave blank to use company default: {{label}} {{rate}}%",
                                {
                                  label: effectiveTaxContext?.tax_label || tEstimate("taxContext.defaultFallback", "Default tax"),
                                  rate: Number(effectiveTaxContext.default_tax_rate).toFixed(3).replace(/\.?0+$/, ""),
                                }
                              )
                            : tEstimate(
                                "lineItems.fields.taxPercentHelperManual",
                                "Enter a tax rate manually or confirm Business Finance sales tax settings."
                              )
                          : tEstimate("lineItems.fields.taxPercentHelperNotTaxable", "Set Taxable to Yes to apply tax.")
                      }
                    />
                  </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      select
                      fullWidth
                      label={tEstimate("lineItems.fields.taxable", "Taxable")}
                      value={line.taxable ? "yes" : "no"}
                      onChange={(e) => setLineField(line.id, "taxable", e.target.value === "yes")}
                      helperText={
                        line.taxable
                          ? tEstimate(
                              "lineItems.fields.taxableHelperYes",
                              "Uses the entered Tax % or your company default when Tax % is blank."
                            )
                          : tEstimate(
                              "lineItems.fields.taxableHelperNo",
                            "No tax is applied to this line."
                          )
                      }
                    >
                      <MenuItem value="yes">{tEstimate("lineItems.taxableYes", "Yes")}</MenuItem>
                      <MenuItem value="no">{tEstimate("lineItems.taxableNo", "No")}</MenuItem>
                    </TextField>
                  </Grid>
                      <Grid item xs={12} md={3}>
                        <Stack
                          direction="row"
                          justifyContent={{ xs: "flex-end", md: "center" }}
                          alignItems="center"
                          sx={{ height: "100%", pt: { md: 0.5 } }}
                        >
                          <IconButton onClick={() => removeLine(line.id)} disabled={form.line_items.length === 1}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      {presetMeta.key === "hourly_work" ? (
                        <Typography variant="caption" color="text.secondary">
                          {tEstimate(
                            "lineItems.hourlyWorkMeaning",
                            "Hourly work pricing: quantity is hours and unit price is the hourly rate."
                          )}
                        </Typography>
                      ) : null}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={tEstimate("lineItems.preview.base", "Line subtotal: {{amount}}", {
                          amount: linePreview.base.toFixed(2),
                        })}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        color={line.taxable ? "info" : "default"}
                        label={tEstimate("lineItems.preview.tax", "Line tax: {{amount}}", {
                          amount: linePreview.tax.toFixed(2),
                        })}
                      />
                      <Chip
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{
                          color: "success.dark",
                          borderColor: "success.main",
                          bgcolor: "success.50",
                          "& .MuiChip-label": {
                            fontWeight: 700,
                          },
                        }}
                        label={tEstimate("lineItems.preview.total", "Line total: {{amount}}", {
                          amount: lineTotalPreview.toFixed(2),
                        })}
                      />
                    </Stack>
                    </Stack>
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
              <Alert severity="info" icon={<InfoOutlinedIcon fontSize="inherit" />}>
                <Typography variant="body2">
                  {tEstimate("previewInfoShort", "Preview only. Final totals are confirmed when you save.")}
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
                <Typography variant="body2">{tEstimate("totals.subtotal", "Subtotal")}: {preview.subtotal.toFixed(2)}</Typography>
                <Typography variant="body2">{tEstimate("totals.tax", "Tax")}: {preview.taxTotal.toFixed(2)}</Typography>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography variant="body2">{tEstimate("totals.total", "Total")}: {preview.total.toFixed(2)}</Typography>
                  <Tooltip
                    title={tEstimate(
                      "totals.backendRuleTooltip",
                      "Final subtotal, tax, and total are confirmed by backend tax rules when you save."
                    )}
                  >
                    <InfoOutlinedIcon sx={{ color: "text.secondary", fontSize: 16 }} />
                  </Tooltip>
                </Stack>
              </Stack>
            </Grid>
            {estimate?.id ? (
              <Grid item xs={12}>
                <FinanceAuditTimeline
                  entityType="estimate"
                  entityId={estimate.id}
                  title={tEstimate("audit.title", "Estimate activity")}
                  emptyText={tEstimate("audit.empty", "No audit records yet.")}
                />
              </Grid>
            ) : null}
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 1.5, flexWrap: "wrap" }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 0, mr: "auto", flex: "1 1 360px" }}>
            {error}
          </Alert>
        ) : <Box sx={{ flex: "1 1 360px" }} />}
        <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
        <Button onClick={onClose} disabled={loading}>
          {tEstimate("common.cancel", "Cancel")}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? tEstimate("common.saving", "Saving...") : estimate ? tEstimate("common.saveChanges", "Save changes") : tEstimate("common.createEstimate", "Create estimate")}
        </Button>
        </Stack>
      </DialogActions>
      <FinanceAuditTimeline
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        entityType="estimate"
        entityId={estimate?.id}
        title={tEstimate("audit.title", "Estimate activity")}
        emptyText={tEstimate("audit.empty", "No audit records yet.")}
      />
      <ClientQuickCreateDialog
        open={clientDialogOpen}
        onClose={() => !clientSaving && setClientDialogOpen(false)}
        onSubmit={handleCreateClient}
        form={clientForm}
        setForm={setClientForm}
        loading={clientSaving}
        title={tEstimate("clientDialog.title", "Create new client")}
        description={tEstimate("clientDialog.description", "Create the official customer record used for estimates, invoices, and work orders.")}
      />
    </Dialog>
  );
}
