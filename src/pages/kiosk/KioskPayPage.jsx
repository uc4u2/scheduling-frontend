import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Button,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Paper,
} from "@mui/material";
import api from "../../utils/api";

const decodeTokenPayload = (token) => {
  if (!token || !token.includes(".")) return null;
  try {
    const [b64] = token.split(".");
    const padded = b64.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const parseAmount = (val) => {
  if (val == null) return 0;
  const num = Number(String(val).replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
};

const toCents = (val) => Math.round(parseAmount(val) * 100);

const formatMoney = (cents, currency) => `${(cents / 100).toFixed(2)} ${currency}`;

const KioskPayPage = () => {
  const { token } = useParams();
  const payload = useMemo(() => decodeTokenPayload(token), [token]);
  const [tipMode, setTipMode] = useState("0");
  const [customTip, setCustomTip] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const baseCents = Number(payload?.base_cents || 0);
  const extraCents = Number(payload?.extra_cents || 0);
  const currency = String(payload?.currency || "USD").toUpperCase();
  const tipCents =
    tipMode === "custom"
      ? toCents(customTip)
      : Math.round((baseCents + extraCents) * (Number(tipMode) / 100));
  const totalCents = Math.max(0, baseCents + extraCents + tipCents);

  const handlePay = async () => {
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post(
        "/api/kiosk/checkout-session",
        { token, tip_cents: tipCents },
        { noAuth: true, noCompanyHeader: true }
      );
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError("Checkout link unavailable.");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to start checkout.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!payload) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Invalid or expired checkout link.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", px: 3, py: 6 }}>
      <Box sx={{ maxWidth: 520, mx: "auto" }}>
        <Stack spacing={3}>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              Client checkout
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review your total and choose a tip before paying.
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Base</Typography>
                <Typography fontWeight={600}>{formatMoney(baseCents, currency)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Extras</Typography>
                <Typography fontWeight={600}>{formatMoney(extraCents, currency)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Tip</Typography>
                <Typography fontWeight={600}>{formatMoney(tipCents, currency)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>Total</Typography>
                <Typography fontWeight={700}>{formatMoney(totalCents, currency)}</Typography>
              </Stack>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                Add a tip
              </Typography>
              <ToggleButtonGroup
                value={tipMode}
                exclusive
                onChange={(_, value) => value && setTipMode(value)}
                size="small"
              >
                <ToggleButton value="0">0%</ToggleButton>
                <ToggleButton value="10">10%</ToggleButton>
                <ToggleButton value="15">15%</ToggleButton>
                <ToggleButton value="20">20%</ToggleButton>
                <ToggleButton value="custom">Custom</ToggleButton>
              </ToggleButtonGroup>
              {tipMode === "custom" && (
                <TextField
                  label={`Custom tip (${currency})`}
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                />
              )}
              <Typography variant="caption" color="text.secondary">
                Tax will be calculated at checkout when Stripe Automatic Tax is enabled.
              </Typography>
            </Stack>
          </Paper>

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            variant="contained"
            size="large"
            disabled={submitting}
            onClick={handlePay}
          >
            Pay by card
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default KioskPayPage;
