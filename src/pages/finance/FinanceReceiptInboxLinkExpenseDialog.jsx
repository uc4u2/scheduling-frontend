import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { linkReceiptInboxExpense, listExpenses } from "./financeApi";

const formatMoney = (value, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function FinanceReceiptInboxLinkExpenseDialog({
  open,
  receipt,
  onClose,
  onSaved,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setSelectedExpense(null);
    setError("");
    const load = async () => {
      setLoading(true);
      try {
        const res = await listExpenses({
          q: query || undefined,
          per_page: 50,
          include_templates: false,
        });
        if (!active) return;
        setOptions(Array.isArray(res?.items) ? res.items : []);
      } catch (err) {
        if (active) setError(err?.response?.data?.error || err?.message || "Unable to load expenses.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [open, query]);

  const optionLabel = useMemo(
    () => (option) => {
      if (!option) return "";
      const total = Number(option.amount || 0) + Number(option.tax_amount || 0);
      return [
        option.title,
        option.vendor_name,
        option.expense_date,
        formatMoney(total, option.currency),
      ].filter(Boolean).join(" • ");
    },
    []
  );

  const handleSave = async () => {
    if (!receipt?.id || !selectedExpense?.id || saving) return;
    setSaving(true);
    setError("");
    try {
      const payload = await linkReceiptInboxExpense(receipt.id, { expense_id: selectedExpense.id });
      enqueueSnackbar("Receipt linked to expense.", { variant: "success" });
      onSaved?.(payload);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to link receipt to expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Link Receipt To Expense</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Alert severity="info">
            Link this uploaded receipt to an existing expense so it no longer appears as unlinked at month-end.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Receipt: <strong>{receipt?.file_name || receipt?.label || "Uploaded receipt"}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Search expenses"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            helperText="Search by title, vendor, or note."
          />
          <Autocomplete
            fullWidth
            loading={loading}
            options={options}
            value={selectedExpense}
            onChange={(_event, value) => setSelectedExpense(value)}
            getOptionLabel={optionLabel}
            isOptionEqualToValue={(option, value) => Number(option?.id) === Number(value?.id)}
            renderInput={(params) => <TextField {...params} label="Existing expense" />}
          />
          {selectedExpense ? (
            <Alert severity="info">
              Linking to: <strong>{selectedExpense.title}</strong>
              {" • "}Date: <strong>{selectedExpense.expense_date || "—"}</strong>
              {" • "}Vendor: <strong>{selectedExpense.vendor_name || "—"}</strong>
              {" • "}Review state: <strong>{selectedExpense.review_status || "reviewed"}</strong>
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !selectedExpense?.id}>
          {saving ? "Linking..." : "Link receipt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
