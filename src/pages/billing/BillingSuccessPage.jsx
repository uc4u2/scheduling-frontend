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

const PLAN_LABELS = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

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
  const [pending, setPending] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const redirectTimer = useRef(null);
  const retryTimer = useRef(null);

  const planLabel = useMemo(() => {
    const key = statusPayload?.plan_key;
    return PLAN_LABELS[key] || "Your plan";
  }, [statusPayload]);

  const fetchStatus = useCallback(async () => {
    if (!sid) return;
    try {
      const res = await api.get(`/billing/checkout-status?sid=${encodeURIComponent(sid)}`);
      const data = res?.data || {};
      if (data.status === "pending") {
        setPending(true);
        setStatusPayload(null);
      } else {
        setPending(false);
        setStatusPayload(data);
        setError("");
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "We couldn’t confirm your subscription yet."
      );
      setPending(true);
    }
  }, [sid]);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!sid) {
      setError("Missing checkout session. Please return to pricing.");
      setPending(false);
      return;
    }
    fetchStatus();
  }, [sid, fetchStatus]);

  useEffect(() => {
    if (!pending) return;
    if (attempts === 0) return;
    fetchStatus();
  }, [attempts, fetchStatus, pending]);

  useEffect(() => {
    if (!pending) return;
    if (attempts >= 10) return;
    retryTimer.current = setTimeout(() => {
      setAttempts((prev) => prev + 1);
    }, 2000);
    return () => {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
    };
  }, [pending, attempts]);

  useEffect(() => {
    if (!pending && statusPayload) {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
      redirectTimer.current = setTimeout(() => {
        navigate("/manager/dashboard");
      }, 5000);
    }
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, [navigate, pending, statusPayload]);

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

  return (
    <Box sx={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
      <Paper sx={{ maxWidth: 560, width: "100%", p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          {pending ? (
            <CircularProgress size={48} />
          ) : (
            <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
          )}
          <Typography variant="h5" fontWeight={700}>
            {pending ? "Confirming your subscription…" : "Subscription activated"}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {pending
              ? "We’re confirming your subscription details. This usually takes a few seconds."
              : `You’re now on the ${planLabel} plan.`}
          </Typography>

          {error && <Alert severity="warning">{error}</Alert>}

          {statusPayload && !pending && (
            <Stack spacing={1} sx={{ width: "100%" }}>
              <Typography variant="body2">
                <strong>Status:</strong> {statusPayload.status || "active"}
              </Typography>
              <Typography variant="body2">
                <strong>Trial ends:</strong> {formatDate(statusPayload.trial_end)}
              </Typography>
              <Typography variant="body2">
                <strong>Next billing date:</strong> {formatDate(statusPayload.current_period_end)}
              </Typography>
            </Stack>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: "100%" }}>
            <Button variant="contained" fullWidth onClick={handleDashboard}>
              Go to Dashboard now
            </Button>
            <Button variant="outlined" fullWidth onClick={handlePortal}>
              Manage Billing
            </Button>
          </Stack>

          {!pending && (
            <Typography variant="caption" color="text.secondary">
              Redirecting to your dashboard in 5 seconds…
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default BillingSuccessPage;
