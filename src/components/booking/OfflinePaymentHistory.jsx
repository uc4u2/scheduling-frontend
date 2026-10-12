import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import api from "../../utils/api";
import {
  clearPendingOfflineCorrection,
  createOfflineCorrectionIdempotencyKey,
  readPendingOfflineCorrection,
  savePendingOfflineCorrection,
} from "../../utils/offlineBookingPayment";

const methodLabels = {
  cash: "Cash",
  terminal: "Card terminal",
  etransfer: "E-transfer",
  cheque: "Cheque",
  other: "Other",
};

function amountLabel(operation) {
  if (!Number.isInteger(operation?.total_cents) || !operation?.currency) return "Amount unavailable";
  return `${(operation.total_cents / 100).toFixed(2)} ${operation.currency}`;
}

function timeLabel(value) {
  if (!value) return "Time unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
}

export default function OfflinePaymentHistory({ booking, onCorrected, onRefreshError }) {
  const operations = Array.isArray(booking?.payment_operations) ? booking.payment_operations : [];
  const recoveryScope = booking?.offline_correction_recovery_scope || "";
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [reason, setReason] = useState("");
  const [attemptState, setAttemptState] = useState("new");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshPending, setRefreshPending] = useState(null);
  const pendingPayloadRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const latestRef = useRef({});

  latestRef.current = { bookingId: booking?.id, onCorrected, onRefreshError };

  useEffect(() => {
    requestSequenceRef.current += 1;
    setSelectedOperation(null);
    setReason("");
    setAttemptState("new");
    setSaving(false);
    setError("");
    setRefreshPending(null);
    pendingPayloadRef.current = null;
    return () => {
      requestSequenceRef.current += 1;
    };
  }, [booking?.id]);

  if (!operations.length) return null;

  const openCorrection = (operation) => {
    const pending = readPendingOfflineCorrection(
      recoveryScope,
      booking.id,
      operation.balance_transaction_id,
    );
    setSelectedOperation(operation);
    setError("");
    if (pending?.payload) {
      pendingPayloadRef.current = pending.payload;
      setReason(pending.payload.reason);
      setAttemptState("unresolved");
    } else {
      pendingPayloadRef.current = null;
      setReason("");
      setAttemptState("new");
    }
  };

  const closeCorrection = () => {
    if (!saving) setSelectedOperation(null);
  };

  const handleCorrection = async () => {
    if (!selectedOperation?.balance_transaction_id || !recoveryScope || saving) return;
    const submittedBookingId = booking.id;
    const transactionId = selectedOperation.balance_transaction_id;
    const submittedScope = recoveryScope;
    let payload = pendingPayloadRef.current;
    if (attemptState !== "unresolved") {
      const cleanedReason = String(reason || "").trim();
      if (!cleanedReason) {
        setError("A correction reason is required.");
        return;
      }
      payload = {
        idempotency_key: createOfflineCorrectionIdempotencyKey(submittedBookingId, transactionId),
        reason: cleanedReason,
      };
      pendingPayloadRef.current = payload;
      savePendingOfflineCorrection(submittedScope, submittedBookingId, transactionId, payload);
    }

    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;
    setSaving(true);
    setAttemptState("unresolved");
    setError("");
    try {
      const { data } = await api.post(
        `/api/manager/bookings/${submittedBookingId}/offline-payments/${transactionId}/correct`,
        payload,
      );
      clearPendingOfflineCorrection(submittedScope, submittedBookingId, transactionId);
      pendingPayloadRef.current = null;
      if (
        requestSequenceRef.current !== requestSequence
        || latestRef.current.bookingId !== submittedBookingId
      ) return;
      setSelectedOperation(null);
      setAttemptState("new");
      try {
        await latestRef.current.onCorrected?.(data);
        setRefreshPending(null);
      } catch (refreshError) {
        setRefreshPending(data);
        latestRef.current.onRefreshError?.(refreshError, data);
      }
    } catch (requestError) {
      if (
        requestSequenceRef.current !== requestSequence
        || latestRef.current.bookingId !== submittedBookingId
      ) return;
      const status = requestError?.response?.status;
      const data = requestError?.response?.data || {};
      if (status && status < 500) {
        clearPendingOfflineCorrection(submittedScope, submittedBookingId, transactionId);
        pendingPayloadRef.current = null;
        setAttemptState("rejected");
      }
      setError(
        data.error
        || (status
          ? "The correction could not be saved. Refresh the payment history before trying again."
          : "The response was lost. Retry this exact correction to recover its result."),
      );
    } finally {
      if (requestSequenceRef.current === requestSequence) setSaving(false);
    }
  };

  const retryRefresh = async () => {
    if (!refreshPending) return;
    try {
      await latestRef.current.onCorrected?.(refreshPending);
      setRefreshPending(null);
    } catch (refreshError) {
      latestRef.current.onRefreshError?.(refreshError, refreshPending);
    }
  };

  return (
    <Box component="section" aria-label="Payment history" sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" fontWeight={700} mb={1}>Payment history</Typography>
      {refreshPending ? (
        <Alert
          severity="warning"
          sx={{ mb: 1 }}
          action={<Button color="inherit" size="small" onClick={retryRefresh}>Refresh now</Button>}
        >
          Correction saved, but the updated booking history could not load.
        </Alert>
      ) : null}
      <Stack spacing={1}>
        {operations.map((operation) => (
          <Paper key={operation.id} variant="outlined" sx={{ p: 1.25, minWidth: 0, overflow: "hidden" }}>
            <Stack spacing={0.75}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700}>{amountLabel(operation)}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflowWrap: "anywhere" }}>
                    {operation.kind === "offline_booking_payment"
                      ? `${methodLabels[operation.payment_method] || "Offline payment"} • ${timeLabel(operation.recorded_at)}`
                      : `${operation.provider || "Payment"} • ${timeLabel(operation.recorded_at)}`}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={operation.corrected ? "Corrected / void" : operation.status || "Recorded"}
                  color={operation.corrected ? "default" : "success"}
                  variant="outlined"
                  sx={{ alignSelf: { xs: "flex-start", sm: "center" }, textTransform: "capitalize" }}
                />
              </Stack>
              {operation.kind === "offline_booking_payment" ? (
                <Typography variant="caption" color="text.secondary">
                  Service/base {((operation.base_cents || 0) / 100).toFixed(2)} • Extra {((operation.extra_cents || 0) / 100).toFixed(2)} • Tip {((operation.tip_cents || 0) / 100).toFixed(2)} {operation.currency}
                </Typography>
              ) : null}
              {operation.corrected ? (
                <Alert severity="info" sx={{ py: 0 }}>
                  Original entry retained. Corrected {timeLabel(operation.correction?.corrected_at)}: {operation.correction?.reason || "No reason available"}. No money was returned.
                </Alert>
              ) : null}
              {operation.correction_eligible ? (
                <Box>
                  <Button size="small" color="error" onClick={() => openCorrection(operation)}>
                    Correct erroneous entry
                  </Button>
                </Box>
              ) : null}
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Dialog open={Boolean(selectedOperation)} onClose={closeCorrection} maxWidth="sm" fullWidth>
        <DialogTitle>Correct erroneous payment entry</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography fontWeight={700}>{amountLabel(selectedOperation)}</Typography>
            <Alert severity="warning">
              This corrects an erroneous record. It does not return money to the customer and does not contact Stripe.
            </Alert>
            {attemptState === "unresolved" ? (
              <Alert severity="info">
                The previous response was uncertain. The original reason and request key are locked so retrying cannot create a second correction.
              </Alert>
            ) : null}
            <Divider />
            <TextField
              label="Correction reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              fullWidth
              multiline
              minRows={3}
              disabled={saving || attemptState === "unresolved" || attemptState === "rejected"}
              inputProps={{ maxLength: 500 }}
            />
            {error ? <Alert severity={attemptState === "unresolved" ? "warning" : "error"}>{error}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCorrection} disabled={saving}>Close</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCorrection}
            disabled={saving || attemptState === "rejected"}
          >
            {saving ? "Saving…" : attemptState === "unresolved" ? "Retry correction" : "Correct entry"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
