import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Collapse,
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
import { useSnackbar } from "notistack";
import { recordFinanceInvoiceOfflinePayment } from "./financeApi";
import { formatCurrency } from "../../utils/formatters";

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "etransfer", label: "E-transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "external_card_terminal", label: "External card terminal" },
  { value: "other", label: "Other" },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function FinanceInvoiceOfflinePaymentDialog({
  open,
  invoice,
  onClose,
  onSaved,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const remainingBalance = Number(invoice?.payment_summary?.remaining_balance || 0);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("etransfer");
  const [paidAt, setPaidAt] = useState(todayIso());
  const [referenceNote, setReferenceNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(remainingBalance > 0 ? remainingBalance.toFixed(2) : "");
    setPaymentMethod("etransfer");
    setPaidAt(todayIso());
    setReferenceNote("");
    setConfirmed(false);
    setError("");
    setShowHelp(false);
  }, [open, remainingBalance]);

  const amountNumber = useMemo(() => Number(amount || 0), [amount]);
  const validAmount = Number.isFinite(amountNumber) && amountNumber > 0 && amountNumber <= remainingBalance;
  const nextRemainingBalance = useMemo(
    () => Math.max(remainingBalance - (Number.isFinite(amountNumber) ? amountNumber : 0), 0),
    [amountNumber, remainingBalance]
  );
  const paymentImpactText = useMemo(() => {
    if (!validAmount) return "";
    if (nextRemainingBalance <= 0) {
      return "This will mark the invoice as paid.";
    }
    return "This will record a partial payment.";
  }, [nextRemainingBalance, validAmount]);

  const handleSave = async () => {
    if (!invoice?.id || saving) return;
    setSaving(true);
    setError("");
    try {
      const payload = await recordFinanceInvoiceOfflinePayment(invoice.id, {
        amount: amountNumber,
        payment_method: paymentMethod,
        paid_at: paidAt,
        reference_note: referenceNote.trim() || null,
      });
      enqueueSnackbar("Offline payment recorded.", { variant: "success" });
      onSaved?.(payload);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to record offline payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Record Offline Payment</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Alert
            severity="info"
            action={
              <Button size="small" onClick={() => setShowHelp((value) => !value)}>
                {showHelp ? "Hide help" : "What this does"}
              </Button>
            }
          >
            Record a cash, e-transfer, cheque, bank transfer, or external terminal payment without charging the customer through Stripe.
          </Alert>
          <Collapse in={showHelp}>
            <Stack spacing={0.75} sx={{ px: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Use this only when the client already paid outside the hosted payment link.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This records the payment on the invoice, updates the remaining balance, and keeps finance reporting accurate.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                It does not send a receipt and it does not charge the customer through Stripe.
              </Typography>
            </Stack>
          </Collapse>
          <Typography variant="body2" color="text.secondary">
            Remaining balance: {formatCurrency(remainingBalance, invoice?.currency)}
          </Typography>
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputProps={{ min: 0, step: "0.01" }}
            helperText="Amount cannot exceed the remaining balance."
            fullWidth
          />
          {paymentImpactText ? (
            <Alert severity="success" variant="outlined">
              <Typography variant="body2">{paymentImpactText}</Typography>
              <Typography variant="body2" color="text.secondary">
                After saving, remaining balance will be {formatCurrency(nextRemainingBalance, invoice?.currency)}.
              </Typography>
            </Alert>
          ) : null}
          <FormControl fullWidth>
            <InputLabel>Payment method</InputLabel>
            <Select
              label="Payment method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              {paymentMethods.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Paid date"
            type="date"
            value={paidAt}
            onChange={(event) => setPaidAt(event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Reference number or internal note"
            value={referenceNote}
            onChange={(event) => setReferenceNote(event.target.value)}
            placeholder="Cheque #1042, e-transfer confirmation, terminal receipt ID, or cash collected by manager"
            helperText="Use this for a receipt number, transfer confirmation, cheque number, or internal collection note."
            fullWidth
            multiline
            minRows={2}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
            }
            label="I understand this records an offline payment and does not charge the customer through Stripe."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !confirmed || !validAmount || !paidAt}
        >
          {saving ? "Recording..." : "Record offline payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
