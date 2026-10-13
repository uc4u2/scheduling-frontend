import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import { kioskManagerLoginTarget } from "../../utils/kioskHandoff";

const formatMoney = (cents, currency) =>
  `${(Number(cents || 0) / 100).toFixed(2)} ${currency || ""}`.trim();

const parseCustomTip = (value) => {
  const normalized = String(value || "").trim();
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : null;
};

const KioskPayPage = () => {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [operation, setOperation] = useState(null);
  const [tipMode, setTipMode] = useState("none");
  const [customTip, setCustomTip] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);
  const statusRequestRef = useRef(0);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "referrer";
    meta.content = "no-referrer";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const checkStatus = useCallback(async () => {
    const requestId = statusRequestRef.current + 1;
    statusRequestRef.current = requestId;
    if (!token) {
      setError("Missing payment token.");
      setLoading(false);
      return null;
    }
    setError("");
    try {
      const { data } = await api.get("/api/kiosk/status", {
        params: { token },
        noAuth: true,
        noCompanyHeader: true,
      });
      if (!mountedRef.current || statusRequestRef.current !== requestId) return null;
      setOperation(data);
      if (data?.state === "paid") {
        navigate(`/kiosk/success?token=${encodeURIComponent(token)}`, { replace: true });
      }
      return data;
    } catch (err) {
      if (!mountedRef.current || statusRequestRef.current !== requestId) return null;
      const data = err?.response?.data;
      if (data?.operation) setOperation(data.operation);
      setError(data?.error || "Unable to verify this checkout yet.");
      return data?.operation || null;
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    mountedRef.current = true;
    checkStatus();
    return () => {
      mountedRef.current = false;
      statusRequestRef.current += 1;
    };
  }, [checkStatus]);

  const baseCents = Number(operation?.base_cents || 0);
  const extraCents = Number(operation?.extra_cents || 0);
  const tipBasisCents = baseCents + extraCents;
  const currency = String(operation?.currency || "").toUpperCase();
  const customTipCents = parseCustomTip(customTip);
  const tipCents = useMemo(() => {
    if (tipMode === "custom") return customTipCents ?? 0;
    if (tipMode === "none") return 0;
    return Math.round(tipBasisCents * (Number(tipMode) / 100));
  }, [customTipCents, tipBasisCents, tipMode]);
  const totalCents = tipBasisCents + tipCents;
  const customInvalid = tipMode === "custom" && customTipCents == null;
  const canInitiate = Boolean(operation?.can_initiate) && !customInvalid;

  const handlePay = async () => {
    if (!canInitiate || submitting) return;
    setSubmitting(true);
    setError("");
    setOperation((current) => current ? { ...current, state: "creating_checkout" } : current);
    try {
      const { data } = await api.post(
        "/api/kiosk/checkout-session",
        { token, tip_cents: tipCents },
        { noAuth: true, noCompanyHeader: true }
      );
      if (!mountedRef.current) return;
      if (data?.operation) setOperation(data.operation);
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      if (data?.operation?.state === "paid") {
        navigate(`/kiosk/success?token=${encodeURIComponent(token)}`, { replace: true });
        return;
      }
      setError("Checkout is not ready. Check the payment status before trying again.");
    } catch (err) {
      if (!mountedRef.current) return;
      const data = err?.response?.data;
      if (data?.operation) setOperation(data.operation);
      setError(
        data?.error ||
          "Payment has not been confirmed yet. Please check the status before trying again."
      );
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress aria-label="Loading checkout" />
      </Box>
    );
  }

  const expired = operation && !operation.can_initiate && operation.state !== "paid";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", px: 2, py: 4 }}>
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        <Stack spacing={3}>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={800}>
              {operation?.display?.business_name || "Client checkout"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {operation?.display?.service_name || "Review your payment"}
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography color="text.secondary">Service</Typography>
                <Typography fontWeight={700}>{formatMoney(baseCents, currency)}</Typography>
              </Stack>
              {extraCents > 0 && (
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Typography color="text.secondary">Extras</Typography>
                  <Typography fontWeight={700}>{formatMoney(extraCents, currency)}</Typography>
                </Stack>
              )}
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography color="text.secondary">Tip</Typography>
                <Typography fontWeight={700}>{formatMoney(tipCents, currency)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" gap={2} pt={1}>
                <Typography fontWeight={800}>Total before Stripe tax</Typography>
                <Typography fontWeight={800}>{formatMoney(totalCents, currency)}</Typography>
              </Stack>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>Choose a tip</Typography>
                <Typography variant="caption" color="text.secondary">
                  Percentages use the {formatMoney(tipBasisCents, currency)} service and extras subtotal.
                </Typography>
              </Box>
              <ToggleButtonGroup
                value={tipMode}
                exclusive
                onChange={(_, value) => value && setTipMode(value)}
                aria-label="Tip amount"
                sx={{ flexWrap: "wrap", gap: 1, "& .MuiToggleButtonGroup-grouped": { m: 0 } }}
              >
                <ToggleButton value="none">No tip</ToggleButton>
                <ToggleButton value="10">10%</ToggleButton>
                <ToggleButton value="15">15%</ToggleButton>
                <ToggleButton value="20">20%</ToggleButton>
                <ToggleButton value="custom">Custom</ToggleButton>
              </ToggleButtonGroup>
              {tipMode === "custom" && (
                <TextField
                  label={`Custom tip (${currency})`}
                  value={customTip}
                  onChange={(event) => setCustomTip(event.target.value)}
                  error={customInvalid}
                  helperText={customInvalid ? "Enter a non-negative amount with no more than two decimals." : " "}
                  inputProps={{ inputMode: "decimal", autoComplete: "off" }}
                />
              )}
              {operation?.automatic_tax_enabled && (
                <Typography variant="caption" color="text.secondary">
                  Applicable tax is finalized securely by Stripe. The final charged total may differ from the subtotal shown here.
                </Typography>
              )}
            </Stack>
          </Paper>

          {operation?.state === "awaiting_payment" && (
            <Alert severity="info">
              A secure checkout is already open for this payment. Continuing with a different tip safely replaces the prior unpaid Session.
            </Alert>
          )}
          {expired && (
            <Alert severity="warning">
              This handoff can no longer start a new payment. The manager must reopen the booking, but this screen can still check an existing payment outcome.
            </Alert>
          )}
          {error && <Alert severity="warning">{error}</Alert>}

          <Button
            variant="contained"
            size="large"
            disabled={!canInitiate || submitting}
            onClick={handlePay}
            sx={{ minHeight: 52 }}
          >
            {submitting ? "Creating secure checkout…" : "Continue to secure card payment"}
          </Button>
          <Button variant="outlined" onClick={checkStatus} sx={{ minHeight: 48 }}>
            Check payment status
          </Button>
          <Button color="inherit" onClick={() => window.location.assign(kioskManagerLoginTarget())}>
            Return device to manager
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default KioskPayPage;
