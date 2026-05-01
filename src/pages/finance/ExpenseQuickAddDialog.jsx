import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useTranslation } from "react-i18next";
import {
  createExpense,
  createVendor,
  deleteExpenseReceipt,
  listFinanceInvoices,
  listVendors,
  listWorkOrders,
  updateExpense,
  uploadExpenseReceipt,
} from "./financeApi";
import { formatDate } from "../../utils/datetime";
import ThemedDateField from "../../components/ui/ThemedDateField";
import {
  getActiveCurrency,
  getCurrencyOptions,
  normalizeCurrency,
  subscribeToActiveCurrency,
} from "../../utils/currency";

const ACCEPTED_RECEIPT_TYPES = ".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif";

const parseReceiptLines = (value) =>
  String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const getBlankExpenseForm = (defaultCurrency = getActiveCurrency("USD")) => ({
  title: "",
  amount: "",
  tax_amount: "0",
  category_id: "",
  expense_date: formatDate(new Date()),
  vendor_id: "",
  vendor_name: "",
  note: "",
  client_id: "",
  link_mode: "general",
  work_order_id: "",
  invoice_id: "",
  is_recurring_template: false,
  recurring_frequency: "monthly",
  recurring_next_due_date: formatDate(new Date()),
  recurring_auto_create_mode: "draft",
  review_status: "reviewed",
  receipt_text: "",
  currency: normalizeCurrency(defaultCurrency) || "USD",
});

const getDefaultFinanceCurrency = (taxContext = null) =>
  normalizeCurrency(taxContext?.display_currency || getActiveCurrency("USD")) || "USD";

const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const computeDefaultTaxAmount = (baseAmount, taxContext) => {
  const amount = Number(baseAmount || 0);
  const rate = Number(taxContext?.default_tax_rate || 0);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(rate) || rate <= 0) return null;
  if (taxContext?.prices_include_tax) {
    return roundMoney(amount - amount / (1 + rate / 100));
  }
  return roundMoney(amount * (rate / 100));
};

const blankVendorForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  is_active: true,
};

function QuickVendorDialog({ open, onClose, onSubmit }) {
  const { t } = useTranslation();
  const tExpenses = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.expenses.dialog.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [form, setForm] = useState(blankVendorForm);

  useEffect(() => {
    if (!open) return;
    setForm(blankVendorForm);
  }, [open]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{tExpenses("vendorDialog.title", "Add vendor")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <TextField
            fullWidth
            label={tExpenses("vendorDialog.fields.name", "Vendor name")}
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={tExpenses("vendorDialog.fields.email", "Email")}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={tExpenses("vendorDialog.fields.phone", "Phone")}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label={tExpenses("vendorDialog.fields.address", "Address")}
            multiline
            minRows={2}
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
          />
          <TextField
            fullWidth
            label={tExpenses("vendorDialog.fields.notes", "Notes")}
            multiline
            minRows={2}
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tExpenses("common.cancel", "Cancel")}</Button>
        <Button variant="contained" onClick={() => onSubmit(form)}>
          {tExpenses("vendorDialog.save", "Save vendor")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ExpenseQuickAddDialog({
  open,
  onClose,
  onSaved,
  expense,
  categories = [],
  clients = [],
  taxContext = null,
}) {
  const { t } = useTranslation();
  const tExpenses = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.expenses.dialog.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const currencyOptions = useMemo(() => getCurrencyOptions(), []);
  const [activeCurrency, setActiveCurrency] = useState(() => getDefaultFinanceCurrency(taxContext));
  const [form, setForm] = useState(() => getBlankExpenseForm(getDefaultFinanceCurrency(taxContext)));
  const [receiptEntries, setReceiptEntries] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [deletedUploadedReceiptIds, setDeletedUploadedReceiptIds] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [persistedExpenseId, setPersistedExpenseId] = useState(null);
  const [taxTouched, setTaxTouched] = useState(false);
  const [autoFilledTaxAmount, setAutoFilledTaxAmount] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedVendor = useMemo(
    () => vendors.find((item) => Number(item.id) === Number(form.vendor_id))
      || (form.vendor_id ? { id: form.vendor_id, name: form.vendor_name || tExpenses("fields.archivedVendor", "Archived vendor") } : null),
    [vendors, form.vendor_id, form.vendor_name, tExpenses]
  );
  const selectedWorkOrder = useMemo(
    () => workOrders.find((item) => Number(item.id) === Number(form.work_order_id)) || null,
    [workOrders, form.work_order_id]
  );
  const selectedInvoice = useMemo(
    () => invoices.find((item) => Number(item.id) === Number(form.invoice_id)) || null,
    [invoices, form.invoice_id]
  );

  useEffect(() => subscribeToActiveCurrency((next) => {
    setActiveCurrency(normalizeCurrency(next) || "USD");
  }), []);

  useEffect(() => {
    const nextCurrency = getDefaultFinanceCurrency(taxContext);
    setActiveCurrency(nextCurrency);
  }, [taxContext]);

  const currencyMismatch = Boolean(
    taxContext?.display_currency &&
    normalizeCurrency(form.currency) &&
    normalizeCurrency(form.currency) !== normalizeCurrency(taxContext.display_currency)
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      try {
        const [vendorsRes, workOrdersRes, invoicesRes] = await Promise.all([
          listVendors({ active: true, per_page: 100 }),
          listWorkOrders({ per_page: 100 }),
          listFinanceInvoices({ finance_only: true, per_page: 100 }),
        ]);
        if (!active) return;
        setVendors(Array.isArray(vendorsRes?.items) ? vendorsRes.items : []);
        setWorkOrders(Array.isArray(workOrdersRes?.items) ? workOrdersRes.items : []);
        setInvoices(Array.isArray(invoicesRes?.items) ? invoicesRes.items : []);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || tExpenses("errors.loadSupportData", "Unable to load expense helper data."));
      }
    })();
    return () => {
      active = false;
    };
  }, [open, tExpenses]);

  useEffect(() => {
    if (!open) return;
    if (expense) {
      const linkMode = expense.linked_entity_type === "work_order"
        ? "work_order"
        : expense.linked_entity_type === "invoice"
          ? "invoice"
          : expense.client_id
            ? "client"
            : "general";
      setForm({
        title: expense.title || "",
        amount: expense.amount ?? "",
        tax_amount: expense.tax_amount ?? "0",
        category_id: expense.category_id || "",
        expense_date: expense.expense_date || formatDate(new Date()),
        vendor_id: expense.vendor_id || "",
        vendor_name: expense.vendor_name || "",
        note: expense.note || "",
        client_id: expense.client_id || "",
        link_mode: linkMode,
        work_order_id: expense.linked_entity_type === "work_order" ? expense.linked_entity_id || "" : "",
        invoice_id: expense.linked_entity_type === "invoice" ? expense.linked_entity_id || "" : "",
        is_recurring_template: Boolean(expense.is_recurring_template),
        recurring_frequency: expense.recurring_frequency || "monthly",
        recurring_next_due_date: expense.recurring_next_due_date || formatDate(new Date()),
        recurring_auto_create_mode: expense.recurring_auto_create_mode || "draft",
        review_status: expense.review_status || "reviewed",
        receipt_text: "",
        currency: normalizeCurrency(expense.currency || taxContext?.display_currency || activeCurrency) || activeCurrency,
      });
      setReceiptEntries(Array.isArray(expense.receipt_files) ? expense.receipt_files : []);
      setPersistedExpenseId(expense.id || null);
    } else {
      setForm({
        ...getBlankExpenseForm(getDefaultFinanceCurrency(taxContext)),
        currency: activeCurrency,
      });
      setReceiptEntries([]);
      setPersistedExpenseId(null);
    }
    setPendingFiles([]);
    setDeletedUploadedReceiptIds([]);
    setTaxTouched(false);
    setAutoFilledTaxAmount(null);
    setError("");
  }, [activeCurrency, expense, open, taxContext]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!open || expense || taxTouched) return;
    const nextTax = computeDefaultTaxAmount(form.amount, taxContext);
    if (nextTax == null) return;
    const currentTax = Number(form.tax_amount || 0);
    const priorAutoTax = autoFilledTaxAmount == null ? null : Number(autoFilledTaxAmount);
    const shouldAutofill =
      form.tax_amount === "" ||
      currentTax === 0 ||
      (priorAutoTax != null && Math.abs(currentTax - priorAutoTax) < 0.0001);
    if (!shouldAutofill) return;
    if (Math.abs(currentTax - nextTax) < 0.0001 && priorAutoTax != null) return;
    setForm((prev) => ({ ...prev, tax_amount: String(nextTax) }));
    setAutoFilledTaxAmount(nextTax);
  }, [autoFilledTaxAmount, expense, form.amount, form.tax_amount, open, taxContext, taxTouched]);

  const handleVendorCreated = async (payload) => {
    try {
      const res = await createVendor(payload);
      const vendor = res?.vendor;
      if (vendor) {
        setVendors((current) => [vendor, ...current].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))));
        setForm((current) => ({ ...current, vendor_id: vendor.id, vendor_name: vendor.name || "" }));
      }
      setVendorDialogOpen(false);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tExpenses("errors.vendorCreateFailed", "Unable to add vendor."));
    }
  };

  const handleLinkModeChange = (value) => {
    setForm((current) => ({
      ...current,
      link_mode: value,
      client_id: value === "client" ? current.client_id : "",
      work_order_id: value === "work_order" ? current.work_order_id : "",
      invoice_id: value === "invoice" ? current.invoice_id : "",
    }));
  };

  const queueFiles = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    if (!nextFiles.length) return;
    setPendingFiles((current) => [...current, ...nextFiles]);
    event.target.value = "";
  };

  const removeReceiptEntry = (entry) => {
    setReceiptEntries((current) => current.filter((item) => item.id !== entry.id));
    if (entry?.is_uploaded) {
      setDeletedUploadedReceiptIds((current) => [...current, entry.id]);
    }
  };

  const removePendingFile = (index) => {
    setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const applyDefaultTaxAmount = () => {
    const nextTax = computeDefaultTaxAmount(form.amount, taxContext);
    if (nextTax == null) return;
    setTaxTouched(false);
    setAutoFilledTaxAmount(nextTax);
    setField("tax_amount", String(nextTax));
  };

  const buildReceiptPayload = () => {
    const keptEntries = receiptEntries.map((entry) => {
      if (entry?.is_uploaded) return { id: entry.id };
      return String(entry?.value || entry?.label || "").trim();
    }).filter(Boolean);
    return [...keptEntries, ...parseReceiptLines(form.receipt_text)];
  };

  const handleSave = async () => {
    if (!form.title || !form.amount || !form.expense_date) {
      setError(tExpenses("errors.requiredFields", "Title, amount, and date are required."));
      return;
    }
    if (!form.category_id) {
      setError(tExpenses("errors.categoryRequired", "Choose an expense category."));
      return;
    }
    if (form.link_mode === "client" && !form.client_id) {
      setError(tExpenses("errors.clientRequired", "Choose a client for this expense."));
      return;
    }
    if (form.link_mode === "work_order" && !form.work_order_id) {
      setError(tExpenses("errors.workOrderRequired", "Choose a work order for this expense."));
      return;
    }
    if (form.link_mode === "invoice" && !form.invoice_id) {
      setError(tExpenses("errors.invoiceRequired", "Choose an invoice for this expense."));
      return;
    }
    if (form.is_recurring_template && (!form.recurring_frequency || !form.recurring_next_due_date)) {
      setError(tExpenses("errors.recurringFieldsRequired", "Choose a recurring frequency and next due date."));
      return;
    }

    const workOrderClientId = selectedWorkOrder?.client?.id || selectedWorkOrder?.client_id || "";
    const invoiceClientId = selectedInvoice?.client_id || "";
    const clientId = form.link_mode === "client"
      ? form.client_id
      : form.link_mode === "work_order"
        ? workOrderClientId
        : form.link_mode === "invoice"
          ? invoiceClientId
          : "";
    const linkedEntityType = form.link_mode === "work_order"
      ? "work_order"
      : form.link_mode === "invoice"
        ? "invoice"
        : null;
    const linkedEntityId = form.link_mode === "work_order"
      ? form.work_order_id
      : form.link_mode === "invoice"
        ? form.invoice_id
        : null;

    setLoading(true);
    setError("");
    try {
      const targetExpenseId = persistedExpenseId || expense?.id || null;

      if (targetExpenseId && deletedUploadedReceiptIds.length) {
        for (const receiptId of deletedUploadedReceiptIds) {
          await deleteExpenseReceipt(targetExpenseId, receiptId);
        }
      }

      const payload = {
        title: form.title,
        amount: Number(form.amount || 0),
        tax_amount: Number(form.tax_amount || 0),
        category_id: Number(form.category_id),
        expense_date: form.expense_date,
        vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
        vendor_name: form.vendor_id ? (selectedVendor?.name || form.vendor_name || "") : (form.vendor_name || ""),
        note: form.note || "",
        client_id: clientId ? Number(clientId) : null,
        linked_entity_type: linkedEntityType,
        linked_entity_id: linkedEntityId ? Number(linkedEntityId) : null,
        is_recurring_template: Boolean(form.is_recurring_template),
        recurring_frequency: form.is_recurring_template ? form.recurring_frequency : null,
        recurring_next_due_date: form.is_recurring_template ? form.recurring_next_due_date : null,
        recurring_auto_create_mode: form.is_recurring_template ? form.recurring_auto_create_mode : null,
        review_status: form.is_recurring_template ? "reviewed" : (form.review_status || "reviewed"),
        receipt_files: buildReceiptPayload(),
        currency: form.currency || "USD",
      };
      const savedResponse = targetExpenseId
        ? await updateExpense(targetExpenseId, payload)
        : await createExpense(payload);
      const savedExpense = savedResponse?.expense || savedResponse;
      const expenseId = savedExpense?.id;
      if (!expenseId) throw new Error(tExpenses("errors.saveFailed", "Unable to save expense."));
      setPersistedExpenseId(expenseId);

      for (const file of pendingFiles) {
        await uploadExpenseReceipt(expenseId, file);
      }

      onSaved?.(savedExpense);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || tExpenses("errors.saveFailed", "Unable to save expense."));
    } finally {
      setLoading(false);
    }
  };

  const workOrderOptionLabel = (option) => {
    if (!option) return "";
    const number = option.work_order_number || `WO-${option.id}`;
    return [number, option.title].filter(Boolean).join(" • ");
  };

  const invoiceOptionLabel = (option) => {
    if (!option) return "";
    return [option.invoice_number, option.client_name].filter(Boolean).join(" • ");
  };

  return (
    <>
      <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
        <DialogTitle>{expense ? tExpenses("title.edit", "Edit expense") : tExpenses("title.add", "Add expense")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label={tExpenses("fields.title", "Title")} value={form.title} onChange={(e) => setField("title", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label={tExpenses("fields.amount", "Amount")} type="number" inputProps={{ step: "0.01" }} value={form.amount} onChange={(e) => setField("amount", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label={tExpenses("fields.tax", "Tax")}
                  type="number"
                  inputProps={{ step: "0.01" }}
                  value={form.tax_amount}
                  onChange={(e) => {
                    setTaxTouched(true);
                    setAutoFilledTaxAmount(null);
                    setField("tax_amount", e.target.value);
                  }}
                  helperText={
                    taxContext?.default_tax_rate != null
                      ? tExpenses(
                          "fields.taxHelp",
                          "Use your company default tax rate as a starting point, then override it if this expense needs a different tax amount."
                        )
                      : undefined
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{tExpenses("fields.expenseCategory", "Expense Category")}</InputLabel>
                  <Select label={tExpenses("fields.expenseCategory", "Expense Category")} value={form.category_id} onChange={(e) => setField("category_id", e.target.value)}>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title={tExpenses("categoryTooltip", "Used for expense reports and accountant exports.")}>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1, width: "fit-content" }}>
                    <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">{tExpenses("categoryTooltip", "Used for expense reports and accountant exports.")}</Typography>
                  </Stack>
                </Tooltip>
              </Grid>
              <Grid item xs={12} md={3}>
                <ThemedDateField fullWidth label={tExpenses("fields.date", "Date")} value={form.expense_date} onChange={(e) => setField("expense_date", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label={tExpenses("fields.currency", "Currency")}
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                  helperText={tExpenses("fields.currencyHelp", "Starts with your company display currency from settings. You can override it for this expense.")}
                >
                  {currencyOptions.map((option) => (
                    <MenuItem key={option.code} value={option.code}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {taxContext ? (
                <Grid item xs={12}>
                  <Alert severity={currencyMismatch || taxContext.warning ? "warning" : "info"}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">
                        {tExpenses("taxContext.summary", "Company tax settings")}:{" "}
                        <strong>{taxContext.tax_country_code || "—"} / {taxContext.tax_region_code || "—"}</strong>
                        {" • "}
                        {tExpenses("taxContext.displayCurrency", "Display currency")}: <strong>{taxContext.display_currency || form.currency || "USD"}</strong>
                        {" • "}
                        {tExpenses("taxContext.pricesIncludeTax", "Prices include tax")}: <strong>{taxContext.prices_include_tax ? tExpenses("taxContext.on", "ON") : tExpenses("taxContext.off", "OFF")}</strong>
                        {taxContext.default_tax_rate != null ? (
                          <>
                            {" • "}
                            {tExpenses("taxContext.defaultTaxRate", "Default tax rate")}: <strong>{Number(taxContext.default_tax_rate).toFixed(2)}%</strong>
                          </>
                        ) : null}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {taxContext.warning || tExpenses("taxContext.helper", "These settings come from Company Profile / Checkout settings. Use them as the default for this expense, then override only when this record needs a different tax treatment.")}
                      </Typography>
                      {currencyMismatch ? (
                        <Typography variant="caption" color="warning.main">
                          {tExpenses("taxContext.currencyMismatch", "This expense uses a different currency than your current company display currency. Keep it only if that is intentional.")}
                        </Typography>
                      ) : null}
                      {taxContext.default_tax_rate != null ? (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={applyDefaultTaxAmount}
                            disabled={computeDefaultTaxAmount(form.amount, taxContext) == null}
                          >
                            {tExpenses("taxContext.applyDefaultTax", "Apply default tax")}
                          </Button>
                          <Typography variant="caption" color="text.secondary">
                            {taxContext.prices_include_tax
                              ? tExpenses("taxContext.applyIncludedHelp", "Uses the current amount as tax-included and fills the tax portion from your company default rate.")
                              : tExpenses("taxContext.applyAddedHelp", "Uses the current amount as pre-tax and adds tax from your company default rate.")}
                          </Typography>
                        </Stack>
                      ) : null}
                    </Stack>
                  </Alert>
                </Grid>
              ) : null}

              <Grid item xs={12}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ xs: "stretch", md: "flex-start" }}>
                  <Autocomplete
                    fullWidth
                    options={vendors}
                    value={selectedVendor}
                    onChange={(_event, value) => {
                      setField("vendor_id", value?.id || "");
                      setField("vendor_name", value?.name || "");
                    }}
                    getOptionLabel={(option) => option?.name || ""}
                    isOptionEqualToValue={(option, value) => Number(option?.id) === Number(value?.id)}
                    renderInput={(params) => <TextField {...params} label={tExpenses("fields.vendor", "Vendor")} placeholder={tExpenses("fields.noVendorPlaceholder", "No vendor selected")} />}
                  />
                  <Button variant="outlined" startIcon={<AddOutlinedIcon />} onClick={() => setVendorDialogOpen(true)}>
                    {tExpenses("vendorDialog.trigger", "Add vendor")}
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  {tExpenses("vendorHelper", "Choose the company or person you paid, such as Rogers, your landlord, a supplier, or an insurance provider.")}
                </Typography>
              </Grid>
              {!form.vendor_id ? (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={tExpenses("fields.vendorFallback", "Vendor / payee name")}
                    value={form.vendor_name}
                    onChange={(e) => setField("vendor_name", e.target.value)}
                    helperText={tExpenses("fields.vendorFallbackHelp", "Use this when the payee is not yet in your vendor list.")}
                  />
                </Grid>
              ) : null}

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>{tExpenses("fields.linkThisExpenseTo", "Link this expense to")}</InputLabel>
                  <Select label={tExpenses("fields.linkThisExpenseTo", "Link this expense to")} value={form.link_mode} onChange={(e) => handleLinkModeChange(e.target.value)}>
                    <MenuItem value="general">{tExpenses("linkOptions.general", "General business expense")}</MenuItem>
                    <MenuItem value="client">{tExpenses("linkOptions.client", "Client")}</MenuItem>
                    <MenuItem value="work_order">{tExpenses("linkOptions.workOrder", "Work order / job")}</MenuItem>
                    <MenuItem value="invoice">{tExpenses("linkOptions.invoice", "Invoice")}</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  {tExpenses("linkHelper", "General expenses are overhead. Link an expense to a job only when the cost belongs to a specific work order.")}
                </Typography>
              </Grid>
              {form.link_mode === "client" ? (
                <Grid item xs={12} md={8}>
                  <FormControl fullWidth>
                    <InputLabel>{tExpenses("fields.linkedClient", "Linked client")}</InputLabel>
                    <Select label={tExpenses("fields.linkedClient", "Linked client")} value={form.client_id} onChange={(e) => setField("client_id", e.target.value)}>
                      <MenuItem value="">{tExpenses("fields.none", "None")}</MenuItem>
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.first_name || client.last_name
                            ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
                            : client.email || tExpenses("fields.clientFallback", "Client #{{id}}", { id: client.id })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ) : null}
              {form.link_mode === "work_order" ? (
                <Grid item xs={12} md={8}>
                  <Autocomplete
                    fullWidth
                    options={workOrders}
                    value={selectedWorkOrder}
                    onChange={(_event, value) => setField("work_order_id", value?.id || "")}
                    getOptionLabel={workOrderOptionLabel}
                    isOptionEqualToValue={(option, value) => Number(option?.id) === Number(value?.id)}
                    renderInput={(params) => <TextField {...params} label={tExpenses("fields.workOrder", "Work order / job")} />}
                  />
                </Grid>
              ) : null}
              {form.link_mode === "invoice" ? (
                <Grid item xs={12} md={8}>
                  <Autocomplete
                    fullWidth
                    options={invoices}
                    value={selectedInvoice}
                    onChange={(_event, value) => setField("invoice_id", value?.id || "")}
                    getOptionLabel={invoiceOptionLabel}
                    isOptionEqualToValue={(option, value) => Number(option?.id) === Number(value?.id)}
                    renderInput={(params) => <TextField {...params} label={tExpenses("fields.invoice", "Invoice")} />}
                  />
                </Grid>
              ) : null}

              <Grid item xs={12}>
                <Stack spacing={1.25}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ xs: "stretch", md: "center" }}>
                    <Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />}>
                      {tExpenses("fields.uploadReceipt", "Upload receipt")}
                      <input hidden type="file" accept={ACCEPTED_RECEIPT_TYPES} multiple onChange={queueFiles} />
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {tExpenses("receiptHelper", "Upload the receipt or invoice PDF/image for month-end review.")}
                    </Typography>
                  </Stack>

                  {receiptEntries.length > 0 ? (
                    <List dense sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                      {receiptEntries.map((entry) => (
                        <ListItem
                          key={entry.id}
                          secondaryAction={
                            <Stack direction="row" spacing={1}>
                              {entry.url ? (
                                <Button size="small" href={entry.url} target="_blank" rel="noreferrer" startIcon={<OpenInNewOutlinedIcon />}>
                                  {tExpenses("fields.openReceipt", "Open")}
                                </Button>
                              ) : null}
                              <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => removeReceiptEntry(entry)}>
                                {tExpenses("fields.removeReceipt", "Remove")}
                              </Button>
                            </Stack>
                          }
                        >
                          <ListItemText
                            primary={entry.label || entry.file_name || tExpenses("fields.savedReceipt", "Saved receipt")}
                            secondary={entry.is_uploaded ? tExpenses("fields.uploadedReceipt", "Uploaded receipt") : tExpenses("fields.savedLinkOrNote", "Saved link or note")}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : null}

                  {pendingFiles.length > 0 ? (
                    <List dense sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 1 }}>
                      {pendingFiles.map((file, index) => (
                        <ListItem
                          key={`${file.name}-${file.size}-${index}`}
                          secondaryAction={
                            <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => removePendingFile(index)}>
                              {tExpenses("fields.removeReceipt", "Remove")}
                            </Button>
                          }
                        >
                          <ListItemText
                            primary={file.name}
                            secondary={tExpenses("fields.pendingUpload", "Will upload when you save this expense")}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : null}

                  <TextField
                    fullWidth
                    label={tExpenses("fields.receiptLinksOrNotes", "Receipt links or notes")}
                    value={form.receipt_text}
                    onChange={(e) => setField("receipt_text", e.target.value)}
                    multiline
                    minRows={2}
                    helperText={tExpenses("fields.receiptLinksHelp", "Paste one receipt link or short note per line if you do not have a file to upload.")}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth label={tExpenses("fields.note", "Note")} value={form.note} onChange={(e) => setField("note", e.target.value)} multiline minRows={3} />
              </Grid>
              {!form.is_recurring_template ? (
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label={tExpenses("fields.reviewStatus", "Review status")}
                    value={form.review_status}
                    onChange={(e) => setField("review_status", e.target.value)}
                    helperText={tExpenses("fields.reviewStatusHelp", "Draft expenses stay out of actual totals until you review them.")}
                  >
                    <MenuItem value="reviewed">{tExpenses("fields.reviewStatusOptions.reviewed", "Reviewed and ready")}</MenuItem>
                    <MenuItem value="draft">{tExpenses("fields.reviewStatusOptions.draft", "Draft / needs review")}</MenuItem>
                    <MenuItem value="excluded">{tExpenses("fields.reviewStatusOptions.excluded", "Exclude from reports")}</MenuItem>
                  </TextField>
                </Grid>
              ) : null}
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={form.is_recurring_template} onChange={(e) => setField("is_recurring_template", e.target.checked)} />}
                  label={tExpenses("fields.recurringTemplate", "Mark as recurring expense template")}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {tExpenses("recurringHelper", "Recurring templates help you remember repeat costs. Generated expenses should be reviewed before month-end.")}
                </Typography>
              </Grid>
              {form.is_recurring_template ? (
                <>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label={tExpenses("fields.recurringFrequency", "Frequency")}
                      value={form.recurring_frequency}
                      onChange={(e) => setField("recurring_frequency", e.target.value)}
                    >
                      <MenuItem value="weekly">{tExpenses("fields.frequency.weekly", "Weekly")}</MenuItem>
                      <MenuItem value="monthly">{tExpenses("fields.frequency.monthly", "Monthly")}</MenuItem>
                      <MenuItem value="yearly">{tExpenses("fields.frequency.yearly", "Yearly")}</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <ThemedDateField
                      fullWidth
                      label={tExpenses("fields.recurringNextDueDate", "Next due date")}
                      value={form.recurring_next_due_date}
                      onChange={(e) => setField("recurring_next_due_date", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label={tExpenses("fields.recurringAutoCreateMode", "Auto-create behavior")}
                      value={form.recurring_auto_create_mode}
                      onChange={(e) => setField("recurring_auto_create_mode", e.target.value)}
                    >
                      <MenuItem value="draft">{tExpenses("fields.autoCreateMode.draft", "Draft expense")}</MenuItem>
                      <MenuItem value="reminder">{tExpenses("fields.autoCreateMode.reminder", "Reminder only")}</MenuItem>
                    </TextField>
                  </Grid>
                </>
              ) : null}
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>{tExpenses("common.cancel", "Cancel")}</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? tExpenses("common.saving", "Saving...") : expense ? tExpenses("common.saveChanges", "Save changes") : tExpenses("common.addExpense", "Add expense")}
          </Button>
        </DialogActions>
      </Dialog>

      <QuickVendorDialog
        open={vendorDialogOpen}
        onClose={() => setVendorDialogOpen(false)}
        onSubmit={handleVendorCreated}
      />
    </>
  );
}
