import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { createExpenseFromReceiptInbox, listVendors } from "./financeApi";
import ThemedDateField from "../../components/ui/ThemedDateField";
import { formatDate } from "../../utils/datetime";
import { getActiveCurrency, getCurrencyOptions, normalizeCurrency } from "../../utils/currency";

const getDefaultCurrency = (taxContext = null) =>
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

const titleFromReceipt = (receipt) => {
  const raw = String(receipt?.file_name || receipt?.label || receipt?.value || "Receipt expense").trim();
  return raw.replace(/\.[^.]+$/, "");
};

export default function FinanceReceiptInboxCreateExpenseDialog({
  open,
  receipt,
  categories = [],
  taxContext = null,
  onClose,
  onSaved,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const currencyOptions = useMemo(() => getCurrencyOptions(), []);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [taxTouched, setTaxTouched] = useState(false);
  const [autoFilledTax, setAutoFilledTax] = useState(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    tax_amount: "0",
    expense_date: formatDate(new Date()),
    category_id: "",
    vendor_id: "",
    vendor_name: "",
    note: "",
    review_status: "draft",
    currency: getDefaultCurrency(taxContext),
  });

  useEffect(() => {
    if (!open) return;
    let active = true;
    setForm({
      title: titleFromReceipt(receipt),
      amount: "",
      tax_amount: "0",
      expense_date: formatDate(new Date()),
      category_id: "",
      vendor_id: "",
      vendor_name: "",
      note: receipt?.note || "",
      review_status: "draft",
      currency: getDefaultCurrency(taxContext),
    });
    setTaxTouched(false);
    setAutoFilledTax(null);
    setError("");
    (async () => {
      try {
        const res = await listVendors({ active: true, per_page: 100 });
        if (active) setVendors(Array.isArray(res?.items) ? res.items : []);
      } catch (err) {
        if (active) setError(err?.response?.data?.error || err?.message || "Unable to load vendors.");
      }
    })();
    return () => {
      active = false;
    };
  }, [open, receipt, taxContext]);

  useEffect(() => {
    if (!open || taxTouched) return;
    const nextTax = computeDefaultTaxAmount(form.amount, taxContext);
    if (nextTax == null) return;
    const currentTax = Number(form.tax_amount || 0);
    const priorAutoTax = autoFilledTax == null ? null : Number(autoFilledTax);
    const shouldAutofill =
      form.tax_amount === "" ||
      currentTax === 0 ||
      (priorAutoTax != null && Math.abs(currentTax - priorAutoTax) < 0.0001);
    if (!shouldAutofill) return;
    setForm((prev) => ({ ...prev, tax_amount: String(nextTax) }));
    setAutoFilledTax(nextTax);
  }, [autoFilledTax, form.amount, form.tax_amount, open, taxContext, taxTouched]);

  const selectedVendor = useMemo(
    () => vendors.find((item) => Number(item.id) === Number(form.vendor_id)) || null,
    [vendors, form.vendor_id]
  );

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const applyDefaultTax = () => {
    const nextTax = computeDefaultTaxAmount(form.amount, taxContext);
    if (nextTax == null) return;
    setTaxTouched(false);
    setAutoFilledTax(nextTax);
    setField("tax_amount", String(nextTax));
  };

  const handleSave = async () => {
    if (!receipt?.id || loading) return;
    if (!form.title || !form.amount || !form.expense_date) {
      setError("Title, amount, and date are required.");
      return;
    }
    if (!form.category_id) {
      setError("Choose an expense category.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = await createExpenseFromReceiptInbox(receipt.id, {
        title: form.title,
        amount: Number(form.amount || 0),
        tax_amount: Number(form.tax_amount || 0),
        currency: form.currency || getDefaultCurrency(taxContext),
        expense_date: form.expense_date,
        category_id: Number(form.category_id),
        vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
        vendor_name: form.vendor_id ? (selectedVendor?.name || form.vendor_name || "") : (form.vendor_name || ""),
        note: form.note || "",
        review_status: form.review_status || "draft",
      });
      enqueueSnackbar("Expense created from receipt.", { variant: "success" });
      onSaved?.(payload);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to create expense from receipt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Create Expense From Receipt</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Alert severity="info">
            This keeps the receipt attached from the start. New receipt-created expenses default to Draft so you can review them before month-end.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Receipt: <strong>{receipt?.file_name || receipt?.label || "Uploaded receipt"}</strong>
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Title" value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Amount" type="number" inputProps={{ step: "0.01" }} value={form.amount} onChange={(e) => setField("amount", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Tax"
                type="number"
                inputProps={{ step: "0.01" }}
                value={form.tax_amount}
                onChange={(e) => {
                  setTaxTouched(true);
                  setAutoFilledTax(null);
                  setField("tax_amount", e.target.value);
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Expense category</InputLabel>
                <Select label="Expense category" value={form.category_id} onChange={(e) => setField("category_id", e.target.value)}>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <ThemedDateField fullWidth label="Date" value={form.expense_date} onChange={(e) => setField("expense_date", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Currency" value={form.currency} onChange={(e) => setField("currency", e.target.value)}>
                {currencyOptions.map((option) => (
                  <MenuItem key={option.code} value={option.code}>{option.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {taxContext ? (
              <Grid item xs={12}>
                <Alert severity={taxContext.warning ? "warning" : "info"}>
                  <Stack spacing={0.75}>
                    <Typography variant="body2" fontWeight={700}>
                      Business Finance tax defaults
                    </Typography>
                    <Typography variant="body2">
                      Jurisdiction: <strong>{taxContext.tax_country_code || "—"} / {taxContext.tax_region_code || "—"}</strong>
                      {" • "}Currency: <strong>{taxContext.display_currency || form.currency}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Prices include tax: <strong>{taxContext.prices_include_tax ? "ON" : "OFF"}</strong>
                      {taxContext.tax_label ? <>{" • "}Label: <strong>{taxContext.tax_label}</strong></> : null}
                      {taxContext.default_tax_rate != null ? (
                        <>{" • "}Default tax: <strong>{Number(taxContext.default_tax_rate).toFixed(2)}%</strong></>
                      ) : null}
                    </Typography>
                    {taxContext.warning ? (
                      <Typography variant="caption" color="text.secondary">{taxContext.warning}</Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Use these defaults for this expense, then override the tax amount only when needed.
                      </Typography>
                    )}
                  </Stack>
                </Alert>
              </Grid>
            ) : null}
            {taxContext?.default_tax_rate != null ? (
              <Grid item xs={12}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                  <Button size="small" variant="outlined" onClick={applyDefaultTax} disabled={computeDefaultTaxAmount(form.amount, taxContext) == null}>
                    Apply default tax
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    {taxContext.prices_include_tax
                      ? "Uses the current amount as tax-included and fills the tax portion from your company default rate."
                      : "Uses the current amount as pre-tax and adds tax from your company default rate."}
                  </Typography>
                </Stack>
              </Grid>
            ) : null}
            <Grid item xs={12}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
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
                  renderInput={(params) => <TextField {...params} label="Vendor" placeholder="No vendor selected" />}
                />
                {!form.vendor_id ? (
                  <TextField
                    fullWidth
                    label="Vendor / payee name"
                    value={form.vendor_name}
                    onChange={(e) => setField("vendor_name", e.target.value)}
                  />
                ) : null}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Review state</InputLabel>
                <Select label="Review state" value={form.review_status} onChange={(e) => setField("review_status", e.target.value)}>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="reviewed">Reviewed / ready for accountant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={3} label="Note" value={form.note} onChange={(e) => setField("note", e.target.value)} />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Creating..." : "Create expense"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
