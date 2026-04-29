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
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { refundFinanceInvoice } from "./financeApi";
import { formatCurrency } from "../../utils/formatters";

const q2 = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
};

export default function FinanceInvoiceRefundDialog({
  open,
  invoice,
  onClose,
  onRefunded,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [mode, setMode] = useState("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode("full");
    setAmount("");
    setReason("");
    setConfirmed(false);
    setError("");
    setSaving(false);
  }, [open, invoice?.id]);

  const currency = invoice?.currency || invoice?.refund_summary?.currency || "USD";
  const paidAmount = q2(invoice?.refund_summary?.paid_amount);
  const refundedAmount = q2(invoice?.refund_summary?.refunded_amount);
  const remainingAmount = q2(invoice?.refund_summary?.remaining_refundable_amount);
  const customAmount = q2(amount);
  const customAmountInvalid = mode === "custom" && (!amount || customAmount <= 0 || customAmount > remainingAmount);

  const helperText = useMemo(() => {
    if (mode !== "custom") return "";
    if (!amount) return `Enter an amount up to ${formatCurrency(remainingAmount, currency)}.`;
    if (customAmount <= 0) return "Enter a refund amount greater than zero.";
    if (customAmount > remainingAmount) return "Refund amount cannot exceed the remaining refundable amount.";
    return `Refund ${formatCurrency(customAmount, currency)}.`;
  }, [amount, currency, customAmount, mode, remainingAmount]);

  const handleSubmit = async () => {
    if (!invoice?.id || saving) return;
    if (!confirmed) {
      setError("Confirm that you understand the refund only affects payment state.");
      return;
    }
    if (mode === "custom" && customAmountInvalid) {
      setError("Enter a valid refund amount.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        reason: reason.trim() || undefined,
      };
      if (mode === "full") {
        payload.full = true;
      } else {
        payload.amount = customAmount;
      }
      const res = await refundFinanceInvoice(invoice.id, payload);
      enqueueSnackbar("Refund processed.", { variant: "success" });
      onRefunded?.(res);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to process refund.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Issue finance invoice refund</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Alert severity="warning">
            This refunds the payment only. It does not change estimate, work order, tax, or line-item totals.
          </Alert>

          <Stack spacing={0.5}>
            <Typography variant="body2">Invoice: {invoice?.invoice_number || `#${invoice?.id || ""}`}</Typography>
            <Typography variant="body2" color="text.secondary">
              Paid amount: {formatCurrency(paidAmount, currency)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Already refunded: {formatCurrency(refundedAmount, currency)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Remaining refundable: {formatCurrency(remainingAmount, currency)}
            </Typography>
          </Stack>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Refund amount
            </Typography>
            <RadioGroup value={mode} onChange={(event) => setMode(event.target.value)}>
              <FormControlLabel
                value="full"
                control={<Radio />}
                label={`Full remaining refund (${formatCurrency(remainingAmount, currency)})`}
              />
              <FormControlLabel value="custom" control={<Radio />} label="Custom amount" />
            </RadioGroup>
          </Box>

          {mode === "custom" ? (
            <TextField
              label={`Custom refund amount (${currency})`}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              error={customAmountInvalid && Boolean(amount)}
              helperText={helperText}
              inputProps={{ inputMode: "decimal" }}
              fullWidth
            />
          ) : null}

          <TextField
            label="Reason / note"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder="Optional refund note"
          />

          <FormControlLabel
            control={<Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />}
            label="I understand this refunds the payment but does not change estimate, work order, tax, or line-item totals."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || !confirmed || (mode === "custom" && customAmountInvalid)}
        >
          {saving ? "Processing..." : "Issue refund"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
