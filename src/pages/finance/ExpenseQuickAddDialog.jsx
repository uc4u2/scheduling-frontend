import React, { useEffect, useState } from "react";
import {
  Alert,
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
  Switch,
  FormControlLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTranslation } from "react-i18next";
import { createExpense, updateExpense } from "./financeApi";
import { formatDate } from "../../utils/datetime";
import ThemedDateField from "../../components/ui/ThemedDateField";
import { getActiveCurrency, getCurrencyOptions, normalizeCurrency } from "../../utils/currency";

const parseReceiptFiles = (value) =>
  String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const getBlankExpenseForm = () => ({
  title: "",
  amount: "",
  tax_amount: "0",
  category_id: "",
  expense_date: formatDate(new Date()),
  vendor_name: "",
  note: "",
  client_id: "",
  linked_entity_type: "",
  linked_entity_id: "",
  is_recurring_template: false,
  receipt_text: "",
  currency: normalizeCurrency(getActiveCurrency("USD")) || "USD",
});

export default function ExpenseQuickAddDialog({
  open,
  onClose,
  onSaved,
  expense,
  categories = [],
  clients = [],
}) {
  const { t } = useTranslation();
  const tExpenses = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.expenses.dialog.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const currencyOptions = useState(() => getCurrencyOptions())[0];
  const [form, setForm] = useState(getBlankExpenseForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setForm({
        title: expense.title || "",
        amount: expense.amount ?? "",
        tax_amount: expense.tax_amount ?? "0",
        category_id: expense.category_id || "",
        expense_date: expense.expense_date || formatDate(new Date()),
        vendor_name: expense.vendor_name || "",
        note: expense.note || "",
        client_id: expense.client_id || "",
        linked_entity_type: expense.linked_entity_type || "",
        linked_entity_id: expense.linked_entity_id || "",
        is_recurring_template: Boolean(expense.is_recurring_template),
        receipt_text: Array.isArray(expense.receipt_files) ? expense.receipt_files.join("\n") : "",
        currency: expense.currency || "USD",
      });
    } else {
      setForm(getBlankExpenseForm());
    }
    setError("");
  }, [expense, open]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.title || !form.amount || !form.expense_date) {
      setError(tExpenses("errors.requiredFields", "Title, amount, and date are required."));
      return;
    }
    if (!form.category_id) {
      setError(tExpenses("errors.categoryRequired", "Choose an expense category."));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        amount: Number(form.amount || 0),
        tax_amount: Number(form.tax_amount || 0),
        category_id: Number(form.category_id),
        expense_date: form.expense_date,
        vendor_name: form.vendor_name || "",
        note: form.note || "",
        client_id: form.client_id ? Number(form.client_id) : null,
        linked_entity_type: form.linked_entity_type || null,
        linked_entity_id: form.linked_entity_id ? Number(form.linked_entity_id) : null,
        is_recurring_template: Boolean(form.is_recurring_template),
        receipt_files: parseReceiptFiles(form.receipt_text),
        currency: form.currency || "USD",
      };
      const saved = expense ? await updateExpense(expense.id, payload) : await createExpense(payload);
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tExpenses("errors.saveFailed", "Unable to save expense."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{expense ? tExpenses("title.edit", "Edit expense") : tExpenses("title.add", "Add expense")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Alert severity="info">
            {tExpenses("receiptInfo", "Receipt file upload will be added later. For now, paste a receipt link or attach metadata.")}
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={tExpenses("fields.title", "Title")} value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={tExpenses("fields.amount", "Amount")} type="number" inputProps={{ step: "0.01" }} value={form.amount} onChange={(e) => setField("amount", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={tExpenses("fields.tax", "Tax")} type="number" inputProps={{ step: "0.01" }} value={form.tax_amount} onChange={(e) => setField("tax_amount", e.target.value)} />
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
              <ThemedDateField
                fullWidth
                label={tExpenses("fields.date", "Date")}
                value={form.expense_date}
                onChange={(e) => setField("expense_date", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label={tExpenses("fields.currency", "Currency")} value={form.currency} onChange={(e) => setField("currency", e.target.value)}>
                {currencyOptions.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={tExpenses("fields.vendor", "Vendor")} value={form.vendor_name} onChange={(e) => setField("vendor_name", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={tExpenses("fields.linkedEntityType", "Linked entity type")} value={form.linked_entity_type} onChange={(e) => setField("linked_entity_type", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={tExpenses("fields.linkedEntityId", "Linked entity ID")} type="number" value={form.linked_entity_id} onChange={(e) => setField("linked_entity_id", e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tExpenses("fields.receiptLinksOrNotes", "Receipt links or notes")} value={form.receipt_text} onChange={(e) => setField("receipt_text", e.target.value)} multiline minRows={3} helperText={tExpenses("fields.receiptLinksHelp", "Use one link or note per line.")} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tExpenses("fields.note", "Note")} value={form.note} onChange={(e) => setField("note", e.target.value)} multiline minRows={3} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={form.is_recurring_template} onChange={(e) => setField("is_recurring_template", e.target.checked)} />}
                label={tExpenses("fields.recurringTemplate", "Mark as recurring expense template")}
              />
            </Grid>
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
  );
}
