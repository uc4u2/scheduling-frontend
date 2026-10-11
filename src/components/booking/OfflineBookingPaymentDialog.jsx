import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  clearPendingOfflinePayment,
  createOfflinePaymentIdempotencyKey,
  minorUnitsToAmountText,
  readPendingOfflinePayment,
  savePendingOfflinePayment,
} from "../../utils/offlineBookingPayment";

const methodOptions = [
  ["cash", "Cash"],
  ["terminal", "Card terminal"],
  ["etransfer", "E-transfer"],
  ["cheque", "Cheque"],
  ["other", "Other"],
];

const payloadToForm = (payload) => ({
  baseAmount: minorUnitsToAmountText(payload?.base_cents),
  extraAmount: minorUnitsToAmountText(payload?.extra_cents),
  tipAmount: minorUnitsToAmountText(payload?.tip_cents),
  currency: String(payload?.currency || "USD").toUpperCase(),
  paymentMethod: payload?.payment_method || "cash",
  completesPayment: Boolean(payload?.completes_payment),
  reference: payload?.reference || "",
  note: payload?.note || "",
});

export default function OfflineBookingPaymentDialog({
  open,
  booking,
  initialBaseCents = 0,
  initialExtraCents = 0,
  initialTipCents = 0,
  initialCurrency = "USD",
  onClose,
  onRecorded,
  onRefreshError,
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
  const [contextLoading, setContextLoading] = useState(false);
  const [contextEpoch, setContextEpoch] = useState(0);
  const [currencyContract, setCurrencyContract] = useState(null);
  const [recoveryScope, setRecoveryScope] = useState(null);
  const [attemptState, setAttemptState] = useState("new");
  const [error, setError] = useState("");
  const [financePath, setFinancePath] = useState(null);
  const idempotencyKeyRef = useRef(null);
  const pendingPayloadRef = useRef(null);
  const contextRequestRef = useRef(0);
  const activeSubmissionRef = useRef(false);
  const latestRef = useRef({});
  const initialValuesRef = useRef({});

  latestRef.current = { open, bookingId: booking?.id, onClose, onRecorded, onRefreshError };
  initialValuesRef.current = {
    baseCents: initialBaseCents,
    extraCents: initialExtraCents,
    tipCents: initialTipCents,
    currency: initialCurrency,
  };

  const applyForm = useCallback((form) => {
    setBaseAmount(form.baseAmount);
    setExtraAmount(form.extraAmount);
    setTipAmount(form.tipAmount);
    setCurrency(form.currency);
    setPaymentMethod(form.paymentMethod);
    setCompletesPayment(form.completesPayment);
    setReference(form.reference);
    setNote(form.note);
  }, []);

  const initializeNewEntry = useCallback((bookingId, resolvedCurrency) => {
    const initial = initialValuesRef.current;
    applyForm({
      baseAmount: minorUnitsToAmountText(initial.baseCents),
      extraAmount: minorUnitsToAmountText(initial.extraCents),
      tipAmount: minorUnitsToAmountText(initial.tipCents),
      currency: String(resolvedCurrency !== undefined ? resolvedCurrency : (initial.currency || "USD")).toUpperCase(),
      paymentMethod: "cash",
      completesPayment: false,
      reference: "",
      note: "",
    });
    idempotencyKeyRef.current = createOfflinePaymentIdempotencyKey(bookingId);
    pendingPayloadRef.current = null;
    setAttemptState("new");
    setError("");
    setFinancePath(null);
  }, [applyForm]);

  useEffect(() => {
    if (!open || !booking?.id || activeSubmissionRef.current) return undefined;
    const bookingId = booking.id;
    const requestNumber = contextRequestRef.current + 1;
    contextRequestRef.current = requestNumber;
    setContextLoading(true);
    setCurrencyContract(null);
    setRecoveryScope(null);
    setError("");
    setFinancePath(null);

    api.get(`/api/manager/bookings/${bookingId}/offline-payments/context`)
      .then(({ data }) => {
        if (
          contextRequestRef.current !== requestNumber
          || latestRef.current.bookingId !== bookingId
          || !latestRef.current.open
        ) return;
        const contract = data?.currency_contract || null;
        const scope = data?.recovery_scope || null;
        setCurrencyContract(contract);
        setRecoveryScope(scope);
        const pending = readPendingOfflinePayment(scope, bookingId);
        if (pending?.payload) {
          pendingPayloadRef.current = pending.payload;
          idempotencyKeyRef.current = pending.payload.idempotency_key;
          applyForm(payloadToForm(pending.payload));
          setAttemptState("unresolved");
          setError("A previous submission has an unresolved outcome. Recover that exact payment before starting another entry.");
          return;
        }
        initializeNewEntry(bookingId, contract?.status === "resolved" ? contract.currency : "");
        if (contract?.status !== "resolved") {
          setError(contract?.message || "The booking currency cannot be resolved safely.");
        }
      })
      .catch((requestError) => {
        if (contextRequestRef.current !== requestNumber || latestRef.current.bookingId !== bookingId) return;
        setError(requestError?.response?.data?.error || "Unable to verify this booking's payment currency.");
      })
      .finally(() => {
        if (contextRequestRef.current === requestNumber && latestRef.current.bookingId === bookingId) {
          setContextLoading(false);
        }
      });
    return () => {
      if (contextRequestRef.current === requestNumber) contextRequestRef.current += 1;
    };
  }, [applyForm, booking?.id, contextEpoch, initializeNewEntry, open]);

  const displayTotal = useMemo(() => {
    const values = [baseAmount, extraAmount, tipAmount].map((value) => Number(value));
    if (values.some((value) => !Number.isFinite(value) || value < 0)) return "—";
    return values.reduce((sum, value) => sum + value, 0).toFixed(2);
  }, [baseAmount, extraAmount, tipAmount]);
  const bookingServiceLabel = typeof booking?.service === "string"
    ? booking.service
    : booking?.service?.name;
  const bookingClientLabel = booking?.client_name || booking?.client?.full_name;

  const finishSuccessfulPersistence = async (data, submittedBookingId, submittedScope) => {
    clearPendingOfflinePayment(submittedScope, submittedBookingId);
    pendingPayloadRef.current = null;
    if (latestRef.current.bookingId !== submittedBookingId || !latestRef.current.open) return;
    latestRef.current.onClose?.();
    try {
      await latestRef.current.onRecorded?.(data);
    } catch (refreshError) {
      latestRef.current.onRefreshError?.(refreshError, data);
    }
  };

  const submitExactPayload = async (payload, submittedBookingId, submittedScope) => {
    const response = await api.post(
      `/api/manager/bookings/${submittedBookingId}/offline-payments`,
      payload,
    );
    await finishSuccessfulPersistence(response.data, submittedBookingId, submittedScope);
  };

  const handleSubmit = async () => {
    const submittedBookingId = booking?.id;
    const submittedScope = recoveryScope;
    if (!submittedBookingId || !submittedScope) return;
    setError("");
    setFinancePath(null);
    setSaving(true);
    activeSubmissionRef.current = true;
    let payload = pendingPayloadRef.current;

    try {
      if (attemptState === "unresolved") {
        try {
          const recovered = await api.get(
            `/api/manager/bookings/${submittedBookingId}/offline-payments/recovery`,
            { params: { idempotency_key: payload?.idempotency_key } },
          );
          await finishSuccessfulPersistence(recovered.data, submittedBookingId, submittedScope);
          return;
        } catch (recoveryError) {
          if (recoveryError?.response?.status !== 404) throw recoveryError;
        }
      } else {
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
        pendingPayloadRef.current = payload;
        savePendingOfflinePayment(submittedScope, submittedBookingId, payload);
      }
      setAttemptState("unresolved");
      await submitExactPayload(payload, submittedBookingId, submittedScope);
    } catch (requestError) {
      const data = requestError?.response?.data || {};
      const status = requestError?.response?.status;
      const conflictIsAmbiguous = data.code === "offline_payment_idempotency_conflict";
      if (status && status < 500 && !conflictIsAmbiguous) {
        clearPendingOfflinePayment(submittedScope, submittedBookingId);
        pendingPayloadRef.current = null;
        setAttemptState("rejected");
      } else {
        setAttemptState("unresolved");
      }
      setError(
        data.error
        || (status ? "Unable to recover the original offline payment yet." : "The response was lost. Retry to recover this exact payment; do not enter it again."),
      );
      setFinancePath(data.finance_path || null);
    } finally {
      activeSubmissionRef.current = false;
      setSaving(false);
      if (latestRef.current.bookingId !== submittedBookingId && latestRef.current.open) {
        setContextEpoch((value) => value + 1);
      }
    }
  };

  const handleStartNewEntry = () => {
    if (!booking?.id || attemptState !== "rejected") return;
    initializeNewEntry(booking.id, currencyContract?.currency);
  };

  const formLocked = saving || contextLoading || attemptState !== "new" || currencyContract?.status !== "resolved";
  const submitDisabled = saving || contextLoading || !booking?.id || !recoveryScope || currencyContract?.status !== "resolved" || attemptState === "rejected";

  return (
    <Dialog open={Boolean(open)} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record offline payment received</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Alert severity="info">
            Enter only money received now. Do not include a deposit or payment already recorded.
          </Alert>
          {attemptState === "unresolved" ? (
            <Alert severity="warning">
              This entry is locked to its original amounts and request key. Retry it to recover the server result without recording payment twice.
            </Alert>
          ) : null}
          {booking ? (
            <Typography variant="body2" color="text.secondary">
              {bookingServiceLabel || "Appointment"}{bookingClientLabel ? ` • ${bookingClientLabel}` : ""}
            </Typography>
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Service / base received"
              value={baseAmount}
              onChange={(event) => setBaseAmount(event.target.value)}
              inputMode="decimal"
              fullWidth
              disabled={formLocked}
              InputProps={{ endAdornment: <InputAdornment position="end">{currency}</InputAdornment> }}
            />
            <TextField
              label="Additional charge received"
              value={extraAmount}
              onChange={(event) => setExtraAmount(event.target.value)}
              inputMode="decimal"
              fullWidth
              disabled={formLocked}
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
              disabled={formLocked}
              InputProps={{ endAdornment: <InputAdornment position="end">{currency}</InputAdornment> }}
            />
            <TextField
              label="Booking currency"
              value={currencyContract?.currency || currency || "Unavailable"}
              fullWidth
              disabled
              helperText={currencyContract?.message || (contextLoading ? "Checking booking payment history…" : "Verified by the server")}
            />
          </Stack>
          <Typography fontWeight={800}>Total received now: {displayTotal} {currency}</Typography>
          <FormControl fullWidth disabled={formLocked}>
            <InputLabel>Payment method</InputLabel>
            <Select label="Payment method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              {methodOptions.map(([value, label]) => <MenuItem value={value} key={value}>{label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Reference (optional)" value={reference} onChange={(event) => setReference(event.target.value)} fullWidth disabled={formLocked} />
          <TextField label="Note (optional)" value={note} onChange={(event) => setNote(event.target.value)} fullWidth multiline minRows={2} disabled={formLocked} />
          <FormControlLabel
            control={<Checkbox checked={completesPayment} onChange={(event) => setCompletesPayment(event.target.checked)} disabled={formLocked} />}
            label="This completes payment for the booking"
          />
          <Typography variant="caption" color="text.secondary">
            This is a manager declaration. It changes payment status but never creates a balancing transaction or guesses a remaining amount.
          </Typography>
          {error ? (
            <Alert
              severity={attemptState === "unresolved" ? "warning" : "error"}
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
        {attemptState === "rejected" ? (
          <Button onClick={handleStartNewEntry} disabled={saving}>Start new payment entry</Button>
        ) : null}
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitDisabled}>
          {saving ? "Recording…" : attemptState === "unresolved" ? "Retry / recover payment" : "Record payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
