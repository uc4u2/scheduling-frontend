import React from "react";
import { useEffect, useState } from "react";
import { stripeConnect } from "../../../utils/api";
import { Button, Alert, CircularProgress, Stack, Typography } from "@mui/material";

export default function StripeConnectReturn() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const token = localStorage.getItem("token"); // your app already stores JWT here for manager

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await stripeConnect.getStatus({ headers });
      setStatus(data);
    } catch (e) {
      const message = e?.displayMessage || e?.response?.data?.error || e?.message || "Failed to load status";
      setStatus({ error: message });
    } finally {
      setLoading(false);
    }
  };

  const refreshLink = async () => {
    setLoading(true);
    try {
      const data = await stripeConnect.refreshOnboardingLink({}, { headers });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Stripe did not return a redirect URL.");
      }
    } catch (e) {
      const message = e?.displayMessage || e?.response?.data?.error || e?.message || "Unable to resume onboarding.";
      setStatus((prev) => ({ ...(prev || {}), error: message }));
    } finally {
      setLoading(false);
    }
  };

  const openDashboard = async () => {
    setLoading(true);
    try {
      const data = await stripeConnect.dashboardLogin({}, { headers });
      if (data?.url) {
        window.open(data.url, "_blank", "noopener");
      } else {
        throw new Error("Stripe did not return a dashboard URL.");
      }
    } catch (e) {
      const message = e?.displayMessage || e?.response?.data?.error || e?.message || "Could not open Stripe dashboard.";
      setStatus((prev) => ({ ...(prev || {}), error: message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  if (loading) return <Stack p={4} alignItems="center"><CircularProgress/></Stack>;

  if (!token) {
    return (
      <Stack p={4} spacing={2}>
        <Alert severity="warning">Please sign in as a manager to continue.</Alert>
      </Stack>
    );
  }

  return (
    <Stack p={4} spacing={2}>
      <Typography variant="h5">Stripe Connect — Onboarding status</Typography>

      {status?.error && <Alert severity="error">{status.error}</Alert>}

      {status?.connected ? (
        <Alert severity={status?.charges_enabled ? "success" : "warning"}>
          {status?.charges_enabled
            ? "✅ Charges are enabled — you're ready to accept payments."
            : "⚠️ Connected, but charges are not enabled yet. Finish onboarding."}
        </Alert>
      ) : (
        <Alert severity="info">Not connected yet — start onboarding from Settings.</Alert>
      )}

      {!!status?.requirements_due?.length && (
        <Alert severity="info">
          Stripe needs: {status.requirements_due.join(", ")}
        </Alert>
      )}

      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={refreshLink} disabled={loading}>
          {status?.charges_enabled ? "Update details" : "Finish onboarding"}
        </Button>
        <Button variant="outlined" onClick={openDashboard} disabled={loading}>
          Open Stripe Dashboard
        </Button>
        <Button variant="text" onClick={loadStatus} disabled={loading}>
          Refresh status
        </Button>
      </Stack>
    </Stack>
  );
}
