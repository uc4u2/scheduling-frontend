import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import { kioskManagerLoginTarget } from "../../utils/kioskHandoff";

const formatMoney = (cents, currency) =>
  `${(Number(cents || 0) / 100).toFixed(2)} ${currency || ""}`.trim();

const KioskSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [operation, setOperation] = useState(null);
  const [status, setStatus] = useState("confirming");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const attemptsRef = useRef(0);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "referrer";
    meta.content = "no-referrer";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const checkStatus = useCallback(async () => {
    if (!token || inFlightRef.current) return null;
    inFlightRef.current = true;
    setChecking(true);
    try {
      const { data } = await api.get("/api/kiosk/status", {
        params: { token },
        noAuth: true,
        noCompanyHeader: true,
      });
      if (!mountedRef.current) return;
      setOperation(data);
      setError("");
      if (data?.state === "paid") {
        setStatus("paid");
        return "paid";
      }
      if (["cancelled_expired", "needs_reconciliation"].includes(data?.state)) {
        setStatus(data.state);
        return data.state;
      }
      setStatus("confirming");
      return "confirming";
    } catch (err) {
      if (!mountedRef.current) return;
      const data = err?.response?.data;
      if (data?.operation) setOperation(data.operation);
      setError(data?.error || "Unable to confirm payment yet.");
      setStatus(data?.operation?.state || "needs_reconciliation");
      return data?.operation?.state || "needs_reconciliation";
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setChecking(false);
    }
  }, [token]);

  useEffect(() => {
    mountedRef.current = true;
    if (!token) {
      setStatus("invalid");
      setError("Missing payment token.");
      return undefined;
    }
    const poll = async () => {
      const nextState = await checkStatus();
      if (!mountedRef.current || ["paid", "cancelled_expired", "needs_reconciliation"].includes(nextState)) return;
      attemptsRef.current += 1;
      if (attemptsRef.current >= 15) {
        setStatus("timeout");
        return;
      }
      timerRef.current = window.setTimeout(poll, 2000);
    };
    poll();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [checkStatus, token]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", px: 2, py: 5 }}>
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        <Stack spacing={3} textAlign="center">
          {status === "paid" ? (
            <>
              <Typography variant="h4" fontWeight={800}>Payment confirmed</Typography>
              <Typography color="text.secondary">
                Thank you. Stripe confirmed the payment and Schedulaa recorded the verified amount.
              </Typography>
              <Paper variant="outlined" sx={{ p: 3, textAlign: "left" }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" gap={2}>
                    <Typography color="text.secondary">Charged</Typography>
                    <Typography fontWeight={800}>
                      {formatMoney(operation?.total_cents, operation?.currency)}
                    </Typography>
                  </Stack>
                  {Number(operation?.tax_cents || 0) > 0 && (
                    <Stack direction="row" justifyContent="space-between" gap={2}>
                      <Typography color="text.secondary">Tax</Typography>
                      <Typography>{formatMoney(operation.tax_cents, operation.currency)}</Typography>
                    </Stack>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                    Reference: {operation?.receipt_reference || "Recorded by Stripe"}
                  </Typography>
                </Stack>
              </Paper>
            </>
          ) : status === "confirming" ? (
            <>
              <CircularProgress sx={{ mx: "auto" }} aria-label="Confirming payment" />
              <Typography variant="h5" fontWeight={800}>Confirming payment</Typography>
              <Typography color="text.secondary">
                Keep this page open while Stripe confirms the payment.
              </Typography>
            </>
          ) : (
            <Alert severity={status === "cancelled_expired" || status === "invalid" ? "error" : "warning"}>
              {status === "timeout"
                ? "Payment has not been confirmed yet. Please check the status before trying again."
                : error || "This payment needs manager reconciliation before another attempt."}
            </Alert>
          )}

          {status !== "paid" && (
            <Button
              variant="outlined"
              disabled={checking}
              onClick={() => {
                attemptsRef.current = 0;
                checkStatus();
              }}
              sx={{ minHeight: 48 }}
            >
              {checking ? "Checking…" : "Check status"}
            </Button>
          )}
          <Button
            color="inherit"
            onClick={() => window.location.assign(kioskManagerLoginTarget())}
            sx={{ minHeight: 48 }}
          >
            Return device to manager
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default KioskSuccessPage;
