import React, { useCallback, useEffect, useRef, useState } from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import { kioskManagerLoginTarget } from "../../utils/kioskHandoff";
import KioskExperienceShell, {
  formatKioskMoney,
  kioskPalette,
} from "./KioskExperienceShell";

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
      if (!mountedRef.current) return null;
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
      if (!mountedRef.current) return null;
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

  const display = operation?.display || {};
  const paid = status === "paid";

  return (
    <KioskExperienceShell businessName={display.business_name} eyebrow={paid ? "Receipt" : "Payment status"}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 680,
          mx: "auto",
          p: { xs: 2.5, sm: 4.5, md: 5 },
          borderRadius: { xs: "22px", sm: "28px" },
          border: `1px solid ${kioskPalette.border}`,
          boxShadow: "0 24px 70px rgba(16, 36, 62, 0.10)",
          textAlign: "center",
        }}
      >
        <Stack spacing={3} alignItems="stretch" aria-live="polite">
          {paid ? (
            <>
              <Box>
                <Box
                  sx={{
                    width: 76,
                    height: 76,
                    mx: "auto",
                    mb: 2,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "24px",
                    bgcolor: kioskPalette.tealSoft,
                    color: kioskPalette.teal,
                  }}
                >
                  <CheckCircleRoundedIcon sx={{ fontSize: 48 }} aria-hidden="true" />
                </Box>
                <Typography component="h1" sx={{ fontSize: { xs: 28, sm: 36 }, fontWeight: 900 }}>
                  Payment confirmed
                </Typography>
                <Typography color={kioskPalette.navyMuted} sx={{ mt: 1, maxWidth: 480, mx: "auto" }}>
                  Thank you. Stripe confirmed the payment and Schedulaa recorded the verified amount.
                </Typography>
              </Box>

              <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: "18px", borderColor: kioskPalette.border, textAlign: "left", bgcolor: "#FBFCFD" }}>
                <Stack spacing={1.4}>
                  {display.service_name && (
                    <Stack direction="row" justifyContent="space-between" gap={2}>
                      <Typography color={kioskPalette.navyMuted}>Service</Typography>
                      <Typography fontWeight={750} textAlign="right">{display.service_name}</Typography>
                    </Stack>
                  )}
                  <Divider sx={{ borderColor: kioskPalette.border }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={2}>
                    <Typography fontWeight={800}>Amount charged</Typography>
                    <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, whiteSpace: "nowrap" }}>
                      {formatKioskMoney(operation?.total_cents, operation?.currency)}
                    </Typography>
                  </Stack>
                  {Number(operation?.tax_cents || 0) > 0 && (
                    <Stack direction="row" justifyContent="space-between" gap={2}>
                      <Typography color={kioskPalette.navyMuted}>Tax included</Typography>
                      <Typography fontWeight={700}>{formatKioskMoney(operation.tax_cents, operation.currency)}</Typography>
                    </Stack>
                  )}
                  <Divider sx={{ borderColor: kioskPalette.border }} />
                  <Typography variant="caption" color={kioskPalette.navyMuted} sx={{ overflowWrap: "anywhere" }}>
                    Receipt reference: {operation?.receipt_reference || "Recorded by Stripe"}
                  </Typography>
                </Stack>
              </Paper>
            </>
          ) : status === "confirming" ? (
            <Box sx={{ py: { xs: 4, sm: 6 } }}>
              <CircularProgress sx={{ color: kioskPalette.teal }} aria-label="Confirming payment" />
              <Typography component="h1" sx={{ mt: 2.5, fontSize: { xs: 26, sm: 32 }, fontWeight: 850 }}>
                Confirming payment
              </Typography>
              <Typography color={kioskPalette.navyMuted} sx={{ mt: 1 }}>
                Keep this page open while Stripe confirms the final payment status.
              </Typography>
            </Box>
          ) : (
            <Alert severity={status === "cancelled_expired" || status === "invalid" ? "error" : "warning"} sx={{ borderRadius: "16px", textAlign: "left" }}>
              {status === "timeout"
                ? "Payment has not been confirmed yet. Please check the status before trying again."
                : error || "This payment needs manager reconciliation before another attempt."}
            </Alert>
          )}

          {!paid && (
            <Button
              variant="contained"
              disabled={checking}
              startIcon={<RefreshRoundedIcon />}
              onClick={() => {
                attemptsRef.current = 0;
                checkStatus();
              }}
              sx={{
                minHeight: 54,
                borderRadius: "15px",
                bgcolor: kioskPalette.teal,
                fontWeight: 800,
                textTransform: "none",
                "&:hover": { bgcolor: kioskPalette.tealDark },
              }}
            >
              {checking ? "Checking…" : "Check status"}
            </Button>
          )}
          <Button
            color="inherit"
            onClick={() => window.location.assign(kioskManagerLoginTarget())}
            sx={{ minHeight: 48, borderRadius: "14px", textTransform: "none", color: kioskPalette.navyMuted }}
          >
            Return device to manager
          </Button>
        </Stack>
      </Paper>
    </KioskExperienceShell>
  );
};

export default KioskSuccessPage;
