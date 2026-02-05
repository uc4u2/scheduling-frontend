import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import { formatBillingNextDateLabel } from "../../components/billing/billingLabels";

const PLAN_LABELS = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

const READY_STATUSES = new Set(["active", "trialing"]);
const PAYMENT_ACTION_REQUIRED = new Set([
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
]);
const CANCELED_STATUSES = new Set(["canceled"]);

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const BillingSuccessPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sid = params.get("sid") || "";
  const [statusPayload, setStatusPayload] = useState(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("checkout"); // checkout | activating | ready | action | timeout
  const [checkoutAttempts, setCheckoutAttempts] = useState(0);
  const [billingAttempts, setBillingAttempts] = useState(0);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const syncDoneRef = useRef(false);
  const redirectTimer = useRef(null);
  const retryTimer = useRef(null);

  const planLabel = useMemo(() => {
    const key = statusPayload?.plan_key;
    return PLAN_LABELS[key] || "Your plan";
  }, [statusPayload]);

  const redirectToLogin = useCallback(() => {
    const next = `/billing/success?sid=${encodeURIComponent(sid)}`;
    navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
  }, [navigate, sid]);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (!token) {
      redirectToLogin();
    }
  }, [redirectToLogin]);

  useEffect(() => {
    if (!sid) {
      setError("Missing checkout session. Please return to pricing.");
      setPhase("timeout");
      return;
    }
  }, [sid]);

  const pollCheckoutStatus = useCallback(async () => {
    if (!sid) return;
    try {
      const res = await api.get(`/billing/checkout-status?sid=${encodeURIComponent(sid)}`);
      const data = res?.data || {};
      if (data.status === "pending") {
        setPhase("checkout");
        setCheckoutAttempts((prev) => prev + 1);
        return;
      }
      setCheckoutComplete(true);
      setPhase("activating");
      setError("");
    } catch (err) {
      if (err?.response?.status === 401) {
        redirectToLogin();
        return;
      }
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "We couldn’t confirm your checkout yet."
      );
      setPhase("checkout");
      setCheckoutAttempts((prev) => prev + 1);
    }
  }, [sid, redirectToLogin]);

  const pollBillingStatus = useCallback(async () => {
    try {
      const res = await api.get("/billing/status");
      const payload = res?.data || null;
      setStatusPayload(payload);
      const status = String(payload?.status || "").toLowerCase();
      if (READY_STATUSES.has(status)) {
        try {
          window.sessionStorage.removeItem("billing_refresh_pending");
        } catch (e) {}
        setPhase("ready");
        if (redirectTimer.current) {
          clearTimeout(redirectTimer.current);
        }
        redirectTimer.current = setTimeout(() => {
          navigate("/manager/dashboard");
        }, 2000);
        return;
      }
      if (PAYMENT_ACTION_REQUIRED.has(status) || CANCELED_STATUSES.has(status)) {
        setPhase("action");
        return;
      }
      setPhase("activating");
      setBillingAttempts((prev) => prev + 1);
    } catch (err) {
      if (err?.response?.status === 401) {
        redirectToLogin();
        return;
      }
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "We couldn’t confirm your subscription yet."
      );
      setPhase("activating");
      setBillingAttempts((prev) => prev + 1);
    }
  }, [navigate, redirectToLogin]);

  useEffect(() => {
    if (checkoutComplete) return;
    if (!sid) return;
    if (checkoutAttempts >= 12) {
      setPhase("timeout");
      return;
    }
    retryTimer.current = setTimeout(() => {
      pollCheckoutStatus();
    }, checkoutAttempts === 0 ? 300 : 2000);
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [checkoutAttempts, checkoutComplete, pollCheckoutStatus, sid]);

  useEffect(() => {
    if (!checkoutComplete) return;
    if (syncDoneRef.current) return;
    syncDoneRef.current = true;
    api
      .post("/billing/sync-from-stripe")
      .catch((err) => {
        if (err?.response?.status === 401) {
          redirectToLogin();
        }
      })
      .finally(() => {
        setBillingAttempts((prev) => prev + 1);
      });
  }, [checkoutComplete, redirectToLogin]);

  useEffect(() => {
    if (!checkoutComplete) return;
    if (phase === "action" || phase === "timeout") return;
    if (billingAttempts >= 12) {
      setPhase("timeout");
      return;
    }
    retryTimer.current = setTimeout(() => {
      pollBillingStatus();
    }, billingAttempts === 0 ? 500 : 2000);
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [billingAttempts, checkoutComplete, phase, pollBillingStatus]);

  const handleDashboard = () => {
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
    }
    navigate("/manager/dashboard");
  };

  const handlePortal = async () => {
    try {
      const res = await api.post("/billing/portal");
      const url = res?.data?.url;
      if (url && typeof window !== "undefined") {
        window.location.href = url;
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to open billing portal."
      );
    }
  };

  const handleRetry = () => {
    setError("");
    if (!checkoutComplete) {
      setPhase("checkout");
      setCheckoutAttempts(0);
      return;
    }
    setPhase("activating");
    setBillingAttempts(0);
  };

  const isCheckoutPhase = phase === "checkout";
  const isActivating = phase === "activating";
  const isActionRequired = phase === "action";
  const isTimeout = phase === "timeout";
  const isReady = phase === "ready";

  return (
    <Box sx={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
      <Paper sx={{ maxWidth: 560, width: "100%", p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          {isCheckoutPhase || isActivating ? (
            <CircularProgress size={48} />
          ) : (
            <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
          )}
          <Typography variant="h5" fontWeight={700}>
            {isCheckoutPhase
              ? "Confirming checkout…"
              : isActivating
              ? "Activating subscription…"
              : isActionRequired
              ? "Action required to activate"
              : isTimeout
              ? "Still confirming your subscription"
              : "Subscription activated"}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isCheckoutPhase
              ? "We’re confirming your Stripe checkout. This usually takes a few seconds."
              : isActivating
              ? "We’re syncing billing details and activating your subscription."
              : isActionRequired
              ? "Your payment needs attention before we can activate the plan."
              : isTimeout
              ? "We couldn’t confirm activation yet. You can retry or open billing."
              : `You’re now on the ${planLabel} plan.`}
          </Typography>

          {error && <Alert severity="warning">{error}</Alert>}

          {statusPayload && !isCheckoutPhase && (
            <Stack spacing={1} sx={{ width: "100%" }}>
              <Typography variant="body2">
                <strong>Status:</strong> {statusPayload.status || "active"}
              </Typography>
              <Typography variant="body2">
                <strong>Trial ends:</strong> {formatDate(statusPayload.trial_end)}
              </Typography>
              <Typography variant="body2">
                <strong>{formatBillingNextDateLabel({
                  nextBillingDate: statusPayload.current_period_end,
                  trialEnd: statusPayload.trial_end,
                })}</strong>
              </Typography>
            </Stack>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: "100%" }}>
            {isReady ? (
              <>
                <Button variant="contained" fullWidth onClick={handleDashboard}>
                  Go to Dashboard now
                </Button>
                <Button variant="outlined" fullWidth onClick={handlePortal}>
                  Manage Billing
                </Button>
              </>
            ) : (
              <>
                <Button variant="contained" fullWidth onClick={handleRetry}>
                  Retry
                </Button>
                <Button variant="outlined" fullWidth onClick={handlePortal}>
                  Open Billing Portal
                </Button>
              </>
            )}
          </Stack>

          {isReady && (
            <Typography variant="caption" color="text.secondary">
              Redirecting to your dashboard in 2 seconds…
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default BillingSuccessPage;
