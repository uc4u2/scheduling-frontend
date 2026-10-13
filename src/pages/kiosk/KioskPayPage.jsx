import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import { kioskManagerLoginTarget } from "../../utils/kioskHandoff";
import KioskExperienceShell, {
  formatKioskMoney,
  kioskPalette,
} from "./KioskExperienceShell";

const parseCustomTip = (value) => {
  const normalized = String(value || "").trim();
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : null;
};

const TipChoice = ({ selected, label, amount, onClick, ariaLabel }) => (
  <ButtonBase
    onClick={onClick}
    aria-label={ariaLabel || label}
    aria-pressed={selected}
    sx={{
      minHeight: 92,
      width: "100%",
      borderRadius: "18px",
      border: "2px solid",
      borderColor: selected ? kioskPalette.teal : kioskPalette.border,
      bgcolor: selected ? kioskPalette.tealSoft : kioskPalette.surface,
      color: kioskPalette.navy,
      p: 1.5,
      transition: "border-color 160ms ease, background-color 160ms ease, transform 160ms ease",
      "&:hover": { borderColor: kioskPalette.teal, bgcolor: kioskPalette.tealSoft },
      "&:focus-visible": { outline: `3px solid ${kioskPalette.navy}`, outlineOffset: 3 },
      "&:active": { transform: "scale(0.98)" },
    }}
  >
    <Stack spacing={0.4} alignItems="center">
      <Typography sx={{ fontSize: 19, lineHeight: 1.1, fontWeight: 850 }}>{label}</Typography>
      <Typography variant="body2" color={kioskPalette.navyMuted} fontWeight={650}>
        {amount}
      </Typography>
    </Stack>
  </ButtonBase>
);

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
      if (mountedRef.current) setLoading(false);
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

  const chooseTip = (value) => {
    setTipMode(value);
    if (value !== "custom") setCustomTip("");
  };

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
      <KioskExperienceShell businessName="Secure checkout">
        <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
          <Stack spacing={2} alignItems="center" aria-live="polite">
            <CircularProgress aria-label="Loading checkout" sx={{ color: kioskPalette.teal }} />
            <Typography color={kioskPalette.navyMuted}>Preparing your checkout…</Typography>
          </Stack>
        </Box>
      </KioskExperienceShell>
    );
  }

  const expired = operation && !operation.can_initiate && operation.state !== "paid";
  const display = operation?.display || {};
  const appointmentLine = [display.appointment_date, display.appointment_time].filter(Boolean).join(" at ");

  return (
    <KioskExperienceShell businessName={display.business_name}>
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${kioskPalette.border}`,
          borderRadius: { xs: "22px", sm: "28px" },
          overflow: "hidden",
          boxShadow: "0 24px 70px rgba(16, 36, 62, 0.10)",
          bgcolor: kioskPalette.surface,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 0.92fr) minmax(0, 1.08fr)" },
          }}
        >
          <Box sx={{ p: { xs: 2.25, sm: 3.5, md: 4.5 }, bgcolor: "#F9FBFC" }}>
            <Stack spacing={{ xs: 2.5, sm: 3 }}>
              <Box>
                <Typography variant="overline" sx={{ color: kioskPalette.tealDark, fontWeight: 850, letterSpacing: "0.1em" }}>
                  Payment summary
                </Typography>
                <Typography component="h1" sx={{ mt: 0.5, fontSize: { xs: 26, sm: 32 }, lineHeight: 1.12, fontWeight: 850 }}>
                  {display.service_name || "Your appointment"}
                </Typography>
                {appointmentLine && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.25 }}>
                    <CalendarMonthRoundedIcon sx={{ fontSize: 19, color: kioskPalette.teal }} />
                    <Typography variant="body2" color={kioskPalette.navyMuted}>{appointmentLine}</Typography>
                  </Stack>
                )}
              </Box>

              <Box>
                <Typography variant="body2" color={kioskPalette.navyMuted} fontWeight={650}>Amount due</Typography>
                <Typography sx={{ mt: 0.3, fontSize: { xs: 34, sm: 42 }, lineHeight: 1.08, fontWeight: 900 }}>
                  {formatKioskMoney(tipBasisCents, currency)}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: kioskPalette.border }} />
              <Stack spacing={1.4}>
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Typography color={kioskPalette.navyMuted}>Service</Typography>
                  <Typography fontWeight={750}>{formatKioskMoney(baseCents, currency)}</Typography>
                </Stack>
                {extraCents > 0 && (
                  <Stack direction="row" justifyContent="space-between" gap={2}>
                    <Typography color={kioskPalette.navyMuted}>Extras</Typography>
                    <Typography fontWeight={750}>{formatKioskMoney(extraCents, currency)}</Typography>
                  </Stack>
                )}
              </Stack>

              <Stack direction="row" spacing={1} alignItems="flex-start">
                <LockRoundedIcon sx={{ fontSize: 18, color: kioskPalette.teal, mt: 0.15 }} />
                <Typography variant="caption" color={kioskPalette.navyMuted}>
                  Card details are entered on Stripe’s secure Checkout. Schedulaa never displays them here.
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2.25, sm: 3.5, md: 4.5 }, minWidth: 0 }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography component="h2" sx={{ fontSize: { xs: 23, sm: 27 }, fontWeight: 850 }}>
                  Would you like to leave a tip?
                </Typography>
                <Typography sx={{ mt: 0.7 }} variant="body2" color={kioskPalette.navyMuted}>
                  Percentages are calculated from the {formatKioskMoney(tipBasisCents, currency)} service and extras subtotal.
                </Typography>
              </Box>

              <Box role="group" aria-label="Tip amount" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1.25 }}>
                {[10, 15, 20].map((percent) => (
                  <TipChoice
                    key={percent}
                    selected={tipMode === String(percent)}
                    label={`${percent}%`}
                    amount={formatKioskMoney(Math.round(tipBasisCents * percent / 100), currency)}
                    onClick={() => chooseTip(String(percent))}
                  />
                ))}
                <TipChoice selected={tipMode === "none"} label="No tip" amount={formatKioskMoney(0, currency)} onClick={() => chooseTip("none")} />
                <TipChoice
                  selected={tipMode === "custom"}
                  label="Custom"
                  amount={tipMode === "custom" && customTipCents != null ? formatKioskMoney(customTipCents, currency) : "Enter amount"}
                  onClick={() => chooseTip("custom")}
                />
              </Box>

              {tipMode === "custom" && (
                <TextField
                  autoFocus
                  fullWidth
                  label={`Custom tip (${currency})`}
                  value={customTip}
                  onChange={(event) => setCustomTip(event.target.value)}
                  error={customInvalid}
                  helperText={customInvalid ? "Enter a non-negative amount with no more than two decimals." : "Use the decimal key for cents."}
                  inputProps={{ inputMode: "decimal", autoComplete: "off", pattern: "[0-9]*[.,]?[0-9]{0,2}" }}
                  InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }}
                  sx={{
                    "& .MuiOutlinedInput-root": { minHeight: 58, borderRadius: "16px" },
                    "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: kioskPalette.teal },
                    "& .MuiInputLabel-root.Mui-focused": { color: kioskPalette.tealDark },
                  }}
                />
              )}

              <Paper variant="outlined" sx={{ borderColor: kioskPalette.border, borderRadius: "18px", p: 2, bgcolor: "#FBFCFD" }}>
                <Stack spacing={1.2}>
                  <Stack direction="row" justifyContent="space-between" gap={2}>
                    <Typography color={kioskPalette.navyMuted}>Selected tip</Typography>
                    <Typography fontWeight={750}>{formatKioskMoney(tipCents, currency)}</Typography>
                  </Stack>
                  <Divider sx={{ borderColor: kioskPalette.border }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={2}>
                    <Typography fontWeight={850}>Total before Stripe tax</Typography>
                    <Typography sx={{ fontSize: { xs: 23, sm: 26 }, fontWeight: 900, whiteSpace: "nowrap" }}>
                      {formatKioskMoney(totalCents, currency)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              {operation?.automatic_tax_enabled && (
                <Alert severity="info" icon={<ReceiptLongRoundedIcon />} sx={{ borderRadius: "16px" }}>
                  Applicable tax is finalized by Stripe on the next screen. Your final charged total may be higher.
                </Alert>
              )}
              {operation?.state === "awaiting_payment" && (
                <Alert severity="info" sx={{ borderRadius: "16px" }}>
                  A secure Checkout is already open. Changing the tip safely closes that unpaid Session before a replacement is created.
                </Alert>
              )}
              {expired && (
                <Alert severity="warning" sx={{ borderRadius: "16px" }}>
                  This handoff can no longer start a payment. It can still verify an already-started payment; otherwise return the device to the manager.
                </Alert>
              )}
              {error && <Alert severity="warning" sx={{ borderRadius: "16px" }}>{error}</Alert>}

              <Button
                variant="contained"
                size="large"
                disabled={!canInitiate || submitting}
                onClick={handlePay}
                endIcon={!submitting ? <ArrowForwardRoundedIcon /> : null}
                sx={{
                  minHeight: 58,
                  borderRadius: "16px",
                  bgcolor: kioskPalette.teal,
                  fontSize: 16,
                  fontWeight: 800,
                  textTransform: "none",
                  boxShadow: "0 12px 28px rgba(11, 143, 131, 0.24)",
                  "&:hover": { bgcolor: kioskPalette.tealDark },
                  "&:focus-visible": { outline: `3px solid ${kioskPalette.navy}`, outlineOffset: 3 },
                }}
              >
                {submitting ? "Creating secure checkout…" : "Continue to secure card payment"}
              </Button>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button fullWidth variant="outlined" onClick={checkStatus} sx={{ minHeight: 48, borderRadius: "14px", textTransform: "none", color: kioskPalette.navy, borderColor: kioskPalette.border }}>
                  Check payment status
                </Button>
                <Button fullWidth color="inherit" onClick={() => window.location.assign(kioskManagerLoginTarget())} sx={{ minHeight: 48, borderRadius: "14px", textTransform: "none", color: kioskPalette.navyMuted }}>
                  Return to manager
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </KioskExperienceShell>
  );
};

export default KioskPayPage;
