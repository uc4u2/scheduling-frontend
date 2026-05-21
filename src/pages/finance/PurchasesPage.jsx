import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import ThemedDateField from "../../components/ui/ThemedDateField";
import {
  getActiveCurrency,
  getCurrencyOptions,
  normalizeCurrency,
  subscribeToActiveCurrency,
} from "../../utils/currency";
import {
  createPurchase,
  getFinanceTaxContext,
  listInventoryItems,
  listPurchases,
  listVendors,
  voidPurchase,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinancePagination from "./components/FinancePagination";
import FinanceAuditTimeline from "./components/FinanceAuditTimeline";

const blankLine = {
  inventory_item_id: "",
  description: "",
  quantity: "1",
  unit_cost: "0",
  tax_amount: "0",
  _taxTouched: false,
  _autoTaxAmount: null,
};

const getBlankPurchase = (defaultCurrency = getActiveCurrency("USD")) => ({
  vendor_id: "",
  vendor_name: "",
  purchase_date: "",
  currency: normalizeCurrency(defaultCurrency) || "USD",
  receipt_files_text: "",
  note: "",
  create_expense: true,
  line_items: [{ ...blankLine }],
});

const getDefaultPurchaseCurrency = () => normalizeCurrency(getActiveCurrency("USD")) || "USD";

const parseNumber = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const computeLineDefaultTax = (line, taxContext) => {
  const quantity = parseNumber(line?.quantity, 0);
  const unitCost = parseNumber(line?.unit_cost, 0);
  const rate = parseNumber(taxContext?.default_tax_rate, 0);
  const gross = quantity * unitCost;
  if (gross <= 0 || rate <= 0) return null;
  if (taxContext?.prices_include_tax) {
    return roundMoney(gross - gross / (1 + rate / 100));
  }
  return roundMoney(gross * (rate / 100));
};

const formatMoney = (value, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function PurchaseDialog({ open, onClose, vendors, inventoryItems, onSubmit, defaultCurrency, taxContext, onNavigate }) {
  const { t } = useTranslation();
  const tPurchases = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.purchases.dialog.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const currencyOptions = useMemo(() => getCurrencyOptions(), []);
  const [form, setForm] = useState(() => getBlankPurchase(defaultCurrency));

  useEffect(() => {
    if (!open) return;
    setForm(getBlankPurchase(defaultCurrency));
  }, [defaultCurrency, open]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setLine = (index, field, value, options = {}) => {
    setForm((current) => ({
      ...current,
      line_items: current.line_items.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              [field]: value,
              ...(options.taxTouched != null ? { _taxTouched: options.taxTouched } : null),
              ...(options.autoTaxAmount !== undefined ? { _autoTaxAmount: options.autoTaxAmount } : null),
            }
          : line
      ),
    }));
  };

  const addLine = () => setForm((current) => ({ ...current, line_items: [...current.line_items, { ...blankLine }] }));
  const removeLine = (index) =>
    setForm((current) => {
      const nextLines = current.line_items.filter((_, lineIndex) => lineIndex !== index);
      return {
        ...current,
        line_items: nextLines.length ? nextLines : [{ ...blankLine }],
      };
    });

  const applyDefaultTaxToLine = (index) => {
    const nextTax = computeLineDefaultTax(form.line_items[index], taxContext);
    if (nextTax == null) return;
    setLine(index, "tax_amount", String(nextTax), { taxTouched: false, autoTaxAmount: nextTax });
  };

  const applyDefaultTaxToAllLines = () => {
    setForm((current) => ({
      ...current,
      line_items: current.line_items.map((line) => {
        const nextTax = computeLineDefaultTax(line, taxContext);
        return nextTax == null ? line : { ...line, tax_amount: String(nextTax), _taxTouched: false, _autoTaxAmount: nextTax };
      }),
    }));
  };

  const computedTotal = useMemo(() => form.line_items.reduce((sum, line) => {
    return sum + parseNumber(line.quantity, 0) * parseNumber(line.unit_cost, 0) + parseNumber(line.tax_amount, 0);
  }, 0), [form.line_items]);

  const currencyMismatch = Boolean(
    taxContext?.display_currency &&
    normalizeCurrency(form.currency) &&
    normalizeCurrency(form.currency) !== normalizeCurrency(taxContext.display_currency)
  );

  useEffect(() => {
    if (!open || !taxContext?.default_tax_rate) return;
    setForm((current) => {
      let changed = false;
      const nextLines = current.line_items.map((line) => {
        if (line?._taxTouched) return line;
        const nextTax = computeLineDefaultTax(line, taxContext);
        if (nextTax == null) return line;
        const currentTax = Number(line.tax_amount || 0);
        const priorAutoTax = line._autoTaxAmount == null ? null : Number(line._autoTaxAmount);
        const shouldAutofill =
          line.tax_amount === "" ||
          currentTax === 0 ||
          (priorAutoTax != null && Math.abs(currentTax - priorAutoTax) < 0.0001);
        if (!shouldAutofill) return line;
        if (Math.abs(currentTax - nextTax) < 0.0001 && priorAutoTax != null) return line;
        changed = true;
        return {
          ...line,
          tax_amount: String(nextTax),
          _autoTaxAmount: nextTax,
        };
      });
      return changed ? { ...current, line_items: nextLines } : current;
    });
  }, [form.line_items, open, taxContext]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{tPurchases("title", "Create purchase")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <Alert severity="info">{tPurchases("receiptInfo", "Receipt files are metadata-only in this phase. Paste links or short notes instead of uploading binaries.")}</Alert>
          {taxContext ? (
            <Alert severity={currencyMismatch || taxContext.warning ? "warning" : "info"}>
              <Stack spacing={0.75}>
                <Typography variant="body2" fontWeight={700}>
                  {tPurchases("taxContext.summary", "Business Finance tax defaults")}
                </Typography>
                <Typography variant="body2">
                  {tPurchases("taxContext.location", "Jurisdiction")}: <strong>{taxContext.tax_country_code || "—"} / {taxContext.tax_region_code || "—"}</strong>
                  {" • "}
                  {tPurchases("taxContext.displayCurrency", "Currency")}: <strong>{taxContext.display_currency || form.currency || "USD"}</strong>
                </Typography>
                <Typography variant="body2">
                  {tPurchases("taxContext.pricesIncludeTax", "Prices include tax")}: <strong>{taxContext.prices_include_tax ? tPurchases("taxContext.on", "ON") : tPurchases("taxContext.off", "OFF")}</strong>
                  {taxContext.tax_label ? (
                    <>
                      {" • "}
                      {tPurchases("taxContext.taxLabel", "Label")}: <strong>{taxContext.tax_label}</strong>
                    </>
                  ) : null}
                  {taxContext.default_tax_rate != null ? (
                    <>
                      {" • "}
                      {tPurchases("taxContext.defaultTaxRate", "Default tax")}: <strong>{Number(taxContext.default_tax_rate).toFixed(2)}%</strong>
                    </>
                  ) : null}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {taxContext.warning || tPurchases("taxContext.helper", "Use these as the default for this purchase, then override tax amounts on individual lines only when needed.")}
                </Typography>
                {currencyMismatch ? (
                  <Typography variant="caption" color="warning.main">
                    {tPurchases("taxContext.currencyMismatch", "This purchase uses a different currency than your current company display currency. Keep it only if that is intentional.")}
                  </Typography>
                ) : null}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    {tPurchases(
                      "taxContext.manageHelper",
                      "Need to confirm or override the Business Finance default tax profile?"
                    )}
                  </Typography>
                  <Button size="small" variant="text" onClick={() => onNavigate?.("finance-overview")}>
                    {tPurchases("taxContext.manageAction", "Manage Business Finance tax")}
                  </Button>
                </Stack>
                {taxContext.default_tax_rate != null ? (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={applyDefaultTaxToAllLines}
                      disabled={!form.line_items.some((line) => computeLineDefaultTax(line, taxContext) != null)}
                    >
                      {tPurchases("taxContext.applyDefaultTaxAll", "Apply default tax to all lines")}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {taxContext.prices_include_tax
                        ? tPurchases("taxContext.applyIncludedHelp", "Uses each line quantity × unit cost as tax-included and fills the tax portion from your company default rate.")
                        : tPurchases("taxContext.applyAddedHelp", "Uses each line quantity × unit cost as pre-tax and fills tax from your company default rate.")}
                    </Typography>
                  </Stack>
                ) : null}
              </Stack>
            </Alert>
          ) : null}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>{tPurchases("fields.vendor", "Vendor")}</InputLabel>
                <Select label={tPurchases("fields.vendor", "Vendor")} value={form.vendor_id} onChange={(e) => setField("vendor_id", e.target.value)}>
                  <MenuItem value="">{tPurchases("fields.noLinkedVendor", "No linked vendor")}</MenuItem>
                  {vendors.map((vendor) => <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label={tPurchases("fields.vendorNameFallback", "Vendor name fallback")} value={form.vendor_name} onChange={(e) => setField("vendor_name", e.target.value)} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label={tPurchases("fields.currency", "Currency")}
                value={form.currency}
                onChange={(e) => setField("currency", e.target.value)}
                helperText={tPurchases("fields.currencyHelp", "Starts with your company display currency from settings. You can override it for this purchase.")}
              >
                {currencyOptions.map((option) => (
                  <MenuItem key={option.code} value={option.code}>{option.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}><ThemedDateField fullWidth label={tPurchases("fields.purchaseDate", "Purchase date")} value={form.purchase_date} onChange={(e) => setField("purchase_date", e.target.value)} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label={tPurchases("fields.receiptLinksOrNotes", "Receipt links or notes")} value={form.receipt_files_text} onChange={(e) => setField("receipt_files_text", e.target.value)} helperText={tPurchases("fields.receiptLinksHelp", "One line per link or short file note.")} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={3} label={tPurchases("fields.note", "Note")} value={form.note} onChange={(e) => setField("note", e.target.value)} /></Grid>
            <Grid item xs={12}><FormControlLabel control={<Checkbox checked={form.create_expense} onChange={(e) => setField("create_expense", e.target.checked)} />} label={tPurchases("fields.createLinkedExpense", "Create linked expense record")} /></Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={800}>{tPurchases("lineItems.title", "Line items")}</Typography>
                <Button startIcon={<AddIcon />} onClick={addLine}>{tPurchases("lineItems.addLine", "Add line")}</Button>
              </Stack>
              {form.line_items.map((line, index) => (
                <Grid container spacing={1.5} key={`purchase-line-${index}`} alignItems="flex-start">
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>{tPurchases("lineItems.stockItem", "Stock item")}</InputLabel>
                      <Select label={tPurchases("lineItems.stockItem", "Stock item")} value={line.inventory_item_id} onChange={(e) => setLine(index, "inventory_item_id", e.target.value)}>
                        {inventoryItems.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth label={tPurchases("lineItems.description", "Description")} value={line.description} onChange={(e) => setLine(index, "description", e.target.value)} /></Grid>
                  <Grid item xs={12} sm={4} md={2}><TextField fullWidth label={tPurchases("lineItems.quantity", "Quantity")} value={line.quantity} onChange={(e) => setLine(index, "quantity", e.target.value)} /></Grid>
                  <Grid item xs={12} sm={4} md={2}><TextField fullWidth label={tPurchases("lineItems.unitCost", "Unit cost")} value={line.unit_cost} onChange={(e) => setLine(index, "unit_cost", e.target.value)} /></Grid>
                  <Grid item xs={12} sm={8} md={1.5}>
                    <TextField
                      fullWidth
                      label={tPurchases("lineItems.tax", "Tax")}
                      value={line.tax_amount}
                      onChange={(e) => setLine(index, "tax_amount", e.target.value, { taxTouched: true, autoTaxAmount: null })}
                      helperText={
                        taxContext?.default_tax_rate != null
                          ? tPurchases("lineItems.taxHelp", "You can fill this from the company default tax rate, then override it if needed.")
                          : undefined
                      }
                    />
                  </Grid>
                  <Grid item xs={6} sm={2} md={0.75}>
                    <Stack direction="row" justifyContent={{ xs: "flex-start", md: "center" }} sx={{ pt: { md: 1 } }}>
                      {taxContext?.default_tax_rate != null ? (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => applyDefaultTaxToLine(index)}
                          disabled={computeLineDefaultTax(line, taxContext) == null}
                          sx={{ minWidth: 0, px: 0.5 }}
                        >
                          {tPurchases("lineItems.applyTax", "Apply")}
                        </Button>
                      ) : null}
                    </Stack>
                  </Grid>
                  <Grid item xs={6} sm={2} md={0.75}>
                    <Stack direction="row" justifyContent={{ xs: "flex-end", md: "center" }} sx={{ pt: { md: 0.5 } }}>
                      <IconButton onClick={() => removeLine(index)} disabled={form.line_items.length === 1}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Grid>
                </Grid>
              ))}
              <Typography variant="body2" color="text.secondary">{tPurchases("lineItems.estimatedTotal", "Estimated total")}: {formatMoney(computedTotal, form.currency)}</Typography>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tPurchases("common.cancel", "Cancel")}</Button>
        <Button
          variant="contained"
          onClick={() => onSubmit({
            vendor_id: form.vendor_id || null,
            vendor_name: form.vendor_name || null,
            purchase_date: form.purchase_date,
            currency: form.currency,
            receipt_files: form.receipt_files_text
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
            note: form.note,
            create_expense: form.create_expense,
            line_items: form.line_items.map((line) => ({
              inventory_item_id: line.inventory_item_id,
              description: line.description,
              quantity: parseNumber(line.quantity, 0),
              unit_cost: parseNumber(line.unit_cost, 0),
              tax_amount: parseNumber(line.tax_amount, 0),
            })),
          })}
        >
          {tPurchases("common.savePurchase", "Save purchase")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PurchaseDetailDialog({ open, onClose, purchase }) {
  const { t } = useTranslation();
  const tPurchases = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.purchases.detail.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const activeCurrency = useMemo(() => getDefaultPurchaseCurrency(), []);
  const purchaseCurrency = normalizeCurrency(purchase?.currency || activeCurrency) || activeCurrency;
  const [activityOpen, setActivityOpen] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
          <Typography variant="inherit">
            {tPurchases("title", "Purchase detail")}
          </Typography>
          {purchase?.id ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<HistoryOutlinedIcon />}
              onClick={() => setActivityOpen(true)}
            >
              {tPurchases("activity.open", "Activity log")}
            </Button>
          ) : null}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {purchase ? (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {purchase.vendor_name || purchase.vendor?.name || tPurchases("fallbacks.noVendor", "No vendor")} • {purchase.purchase_date || "-"} • {purchaseCurrency}
            </Typography>
            <Typography variant="body2">{tPurchases("summary.subtotal", "Subtotal")}: {formatMoney(purchase.subtotal, purchaseCurrency)}</Typography>
            <Typography variant="body2">{tPurchases("summary.tax", "Tax")}: {formatMoney(purchase.tax_total, purchaseCurrency)}</Typography>
            <Typography variant="body2">{tPurchases("summary.total", "Total")}: {formatMoney(purchase.total, purchaseCurrency)}</Typography>
            <Typography variant="body2">{tPurchases("summary.linkedExpense", "Linked expense")}: {purchase.linked_expense_id || tPurchases("fallbacks.notCreated", "Not created")}</Typography>
            <Typography variant="body2">{tPurchases("summary.note", "Note")}: {purchase.note || "-"}</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tPurchases("table.headers.item", "Item")}</TableCell>
                  <TableCell>{tPurchases("table.headers.description", "Description")}</TableCell>
                  <TableCell>{tPurchases("table.headers.quantity", "Quantity")}</TableCell>
                  <TableCell>{tPurchases("table.headers.unitCost", "Unit cost")}</TableCell>
                  <TableCell>{tPurchases("table.headers.tax", "Tax")}</TableCell>
                  <TableCell>{tPurchases("table.headers.lineTotal", "Line total")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(purchase.line_items || []).map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.inventory_item_name || line.inventory_item_id}</TableCell>
                    <TableCell>{line.description || "-"}</TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>{formatMoney(line.unit_cost, purchaseCurrency)}</TableCell>
                    <TableCell>{formatMoney(line.tax_amount, purchaseCurrency)}</TableCell>
                    <TableCell>{formatMoney(line.line_total, purchaseCurrency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>{tPurchases("common.close", "Close")}</Button></DialogActions>
      <FinanceAuditTimeline
        entityType="purchase"
        entityId={purchase?.id}
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        title={tPurchases("activity.title", "Purchase activity")}
        emptyText={tPurchases("activity.empty", "No purchase activity recorded yet.")}
      />
    </Dialog>
  );
}

export default function PurchasesPage({ createNonce = 0, onNavigate }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tPurchases = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.purchases.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [activeCurrency, setActiveCurrency] = useState(() => normalizeCurrency(getActiveCurrency("USD")) || "USD");
  const [vendors, setVendors] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [taxContext, setTaxContext] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [messages, setMessages] = useState([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [vendorsRes, itemsRes, purchasesRes, financeTaxContext] = await Promise.all([
        listVendors({ active: true, per_page: 100 }),
        listInventoryItems({ active: true, per_page: 100 }),
        listPurchases({ page, per_page: perPage }),
        getFinanceTaxContext(),
      ]);
      setVendors(Array.isArray(vendorsRes?.items) ? vendorsRes.items : []);
      setInventoryItems(Array.isArray(itemsRes?.items) ? itemsRes.items : []);
      setPurchases(Array.isArray(purchasesRes?.items) ? purchasesRes.items : []);
      setPagination(purchasesRes?.pagination || null);
      setTaxContext(financeTaxContext?.tax_context || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tPurchases("errors.loadFailed", "Unable to load purchases."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Filters for this page are pagination-only right now.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  useEffect(() => {
    if (createNonce) {
      setEditorOpen(true);
    }
  }, [createNonce]);

  useEffect(() => subscribeToActiveCurrency((next) => {
    setActiveCurrency(normalizeCurrency(next) || "USD");
  }), []);

  const totalSpend = purchases.reduce((sum, row) => sum + Number(row.total || 0), 0);

  const handleCreate = async (payload) => {
    try {
      const res = await createPurchase(payload);
      const warnings = Array.isArray(res?.warnings) ? res.warnings : [];
      setMessages(warnings);
      enqueueSnackbar(tPurchases("snackbar.purchaseSaved", "Purchase saved."), { variant: "success" });
      setEditorOpen(false);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tPurchases("errors.createFailed", "Unable to create purchase."), { variant: "error" });
    }
  };

  const handleVoid = async (purchase) => {
    try {
      const res = await voidPurchase(purchase.id);
      const warnings = Array.isArray(res?.warnings) ? res.warnings : [];
      setMessages(warnings);
      enqueueSnackbar(tPurchases("snackbar.purchaseVoided", "Purchase voided."), { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tPurchases("errors.voidFailed", "Unable to void purchase."), { variant: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}><FinanceMetricCard label={tPurchases("metrics.purchases", "Purchases")} value={String(purchases.length)} accent="primary" /></Grid>
        <Grid item xs={12} sm={6} md={4}><FinanceMetricCard label={tPurchases("metrics.totalPurchaseSpend", "Total purchase spend")} value={formatMoney(totalSpend, activeCurrency)} accent="secondary" /></Grid>
      </Grid>

      {messages.map((message) => (
        <Alert key={message} severity={message === "linked_expense_not_reversed" ? "warning" : "info"}>
          {message === "linked_expense_not_reversed" ? tPurchases("messages.linkedExpenseNotReversed", "The linked expense was kept for audit. Reverse it manually if needed.") : message}
        </Alert>
      ))}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
          <Button variant="contained" onClick={() => setEditorOpen(true)}>{tPurchases("toolbar.createPurchase", "Create purchase")}</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : purchases.length === 0 ? (
        <FinanceEmptyState
          title={tPurchases("empty.title", "No purchases yet")}
          description={tPurchases("empty.description", "Create your first purchase.")}
          actionLabel={tPurchases("empty.action", "Create purchase")}
          onAction={() => setEditorOpen(true)}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tPurchases("table.headers.date", "Date")}</TableCell>
                <TableCell>{tPurchases("table.headers.vendor", "Vendor")}</TableCell>
                <TableCell>{tPurchases("table.headers.total", "Total")}</TableCell>
                <TableCell>{tPurchases("table.headers.currency", "Currency")}</TableCell>
                <TableCell>{tPurchases("table.headers.linkedExpense", "Linked expense")}</TableCell>
                <TableCell align="right">{tPurchases("table.headers.actions", "Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id} hover>
                  <TableCell>{purchase.purchase_date || "-"}</TableCell>
                  <TableCell>{purchase.vendor_name || purchase.vendor?.name || "-"}</TableCell>
                  <TableCell>{formatMoney(purchase.total, purchase.currency || activeCurrency)}</TableCell>
                  <TableCell>{purchase.currency || activeCurrency}</TableCell>
                  <TableCell>{purchase.linked_expense_id || "-"}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => { setSelectedPurchase(purchase); setDetailOpen(true); }}>{tPurchases("table.view", "View")}</Button>
                      <Button size="small" color="warning" onClick={() => handleVoid(purchase)}>{tPurchases("table.void", "Void")}</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <FinancePagination
        pagination={pagination}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(next) => {
          setPerPage(next);
          setPage(1);
        }}
      />

      <PurchaseDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        vendors={vendors.filter((row) => row.is_active !== false)}
        inventoryItems={inventoryItems}
        defaultCurrency={normalizeCurrency(taxContext?.display_currency || activeCurrency) || activeCurrency}
        taxContext={taxContext}
        onNavigate={onNavigate}
        onSubmit={handleCreate}
      />
      <PurchaseDetailDialog open={detailOpen} onClose={() => setDetailOpen(false)} purchase={selectedPurchase} />
    </Stack>
  );
}
