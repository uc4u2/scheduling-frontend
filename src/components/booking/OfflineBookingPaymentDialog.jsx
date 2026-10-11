import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import api from "../../utils/api";
import {
  buildOfflineBookingPaymentPayload,
  createOfflinePaymentIdempotencyKey,
  minorUnitsToAmountText,
  OFFLINE_PAYMENT_CURRENCIES,
} from "../../utils/offlineBookingPayment";

const methodOptions = [
  ["cash", "Cash"],
  ["terminal", "Card terminal"],
  ["etransfer", "E-transfer"],
  ["cheque", "Cheque"],
  ["other", "Other"],
];

export default function OfflineBookingPaymentDialog({
  open,
  booking,
  initialBaseCents = 0,
  initialExtraCents = 0,
  initialTipCents = 0,
  initialCurrency = "USD",
  onClose,
  onRecorded,
  onNavigateFinance,
}) {
  const [baseAmount, setBaseAmount] = useState("0.00");
  const [extraAmount, setExtraAmount] = useState("0.00");
  const [tipAmount, setTipAmount] = useState("0.00");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [completesPayment, setCompletesPayment] = useState(false);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [financePath, setFinancePath] = useState(null);
  const idempotencyKeyRef = useRef(null);

  useEffect(() => {
    if (!open || !booking?.id) return;
    setBaseAmount(minorUnitsToAmountText(initialBaseCents));
    setExtraAmount(minorUnitsToAmountText(initialExtraCents));
    setTipAmount(minorUnitsToAmountText(initialTipCents));
    setCurrency(String(initialCurrency || "USD").toUpperCase());
    setPaymentMethod("cash");
    setCompletesPayment(false);
    setReference("");
    setNote("");
    setError("");
    setFinancePath(null);
    idempotencyKeyRef.current = createOfflinePaymentIdempotencyKey(booking.id);
  }, [open, booking?.id, initialBaseCents, initialExtraCents, initialTipCents, initialCurrency]);

  const displayTotal = useMemo(() => {
    const values = [baseAmount, extraAmount, tipAmount].map((value) => Number(value));
    if (values.some((value) => !Number.isFinite(value) || value < 0)) return "—";
    return values.reduce((sum, value) => sum + value, 0).toFixed(2);
  }, [baseAmount, extraAmount, tipAmount]);

  const handleSubmit = async () => {
    setError("");
    setFinancePath(null);
    let payload;
    try {
      payload = buildOfflineBookingPaymentPayload({
        idempotencyKey: idempotencyKeyRef.current,
        baseAmount,
        extraAmount,
        tipAmount,
        currency,
        paymentMethod,
        completesPayment,
        reference,
        note,
      });
    } catch (validationError) {
      setError(validationError.message || "Check the payment details.");
      return;
    }
    setSaving(true);
    try {
      const response = await api.post(`/api/manager/bookings/${booking.id}/offline-payments`, payload);
      await onRecorded?.(response.data);
      onClose?.();
    } catch (requestError) {
      const data = requestError?.response?.data || {};
      setError(data.error || "Unable to record the offline payment.");
      setFinancePath(data.finance_path || null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(open)} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record offline payment received</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Alert severity="info">
            Enter only money received now. Do not include a deposit or payment already recorded.
          </Alert>
          {booking ? (
            <Typography variant="body2" color="text.secondary">
              {booking.service || "Appointment"}{booking.client_name ? ` • ${booking.client_name}` : ""}
            </Typography>
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Service / base received"
              value={baseAmount}
              onChange={(event) => setBaseAmount(event.target.value)}
              inputMode="decimal"
              fullWidth
              InputProps={{ endAdornment: <InputAdornment position="end">{currency}</InputAdornment> }}
            />
            <TextField
              label="Additional charge received"
              value={extraAmount}
              onChange={(event) => setExtraAmount(event.target.value)}
              inputMode="decimal"
              fullWidth
              InputProps={{ endAdornment: <InputAdornment position="end">{currency}</InputAdornment> }}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Tip received"
              value={tipAmount}
              onChange={(event) => setTipAmount(event.target.value)}
              inputMode="decimal"
              fullWidth
              InputProps={{ endAdornment: <InputAdornment position="end">{currency}</InputAdornment> }}
            />
            <FormControl fullWidth>
              <InputLabel>Currency received</InputLabel>
              <Select label="Currency received" value={currency} onChange={(event) => setCurrency(event.target.value)}>
                {OFFLINE_PAYMENT_CURRENCIES.map((code) => <MenuItem value={code} key={code}>{code}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <Typography fontWeight={800}>Total received now: {displayTotal} {currency}</Typography>
          <FormControl fullWidth>
            <InputLabel>Payment method</InputLabel>
            <Select label="Payment method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              {methodOptions.map(([value, label]) => <MenuItem value={value} key={value}>{label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Reference (optional)" value={reference} onChange={(event) => setReference(event.target.value)} fullWidth />
          <TextField label="Note (optional)" value={note} onChange={(event) => setNote(event.target.value)} fullWidth multiline minRows={2} />
          <FormControlLabel
            control={<Checkbox checked={completesPayment} onChange={(event) => setCompletesPayment(event.target.checked)} />}
            label="This completes payment for the booking"
          />
          <Typography variant="caption" color="text.secondary">
            This is a manager declaration. It changes payment status but never creates a balancing transaction or guesses a remaining amount.
          </Typography>
          {error ? (
            <Alert
              severity="error"
              action={financePath && onNavigateFinance ? (
                <Button color="inherit" size="small" onClick={() => onNavigateFinance(financePath)}>Open Finance</Button>
              ) : null}
            >
              {error}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !booking?.id}>
          {saving ? "Recording…" : "Record payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
