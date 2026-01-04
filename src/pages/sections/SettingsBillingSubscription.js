import React, { useState } from "react";
import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/material";
import SectionCard from "../../components/ui/SectionCard";
import useBillingStatus from "../../components/billing/useBillingStatus";
import { openBillingPortal } from "../../components/billing/billingHelpers";
import api from "../../utils/api";
import { formatBillingNextDateLabel } from "../../components/billing/billingLabels";

const planLabel = (key) => {
  const map = { starter: "Starter", pro: "Pro", business: "Business" };
  return map[String(key || "").toLowerCase()] || "Starter";
};

const formatDate = (value) => {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "N/A";
  }
};

const SettingsBillingSubscription = () => {
  const { status, loading, error } = useBillingStatus();
  const seatAllowed = Number(status?.seats_allowed || 0);
  const seatIncluded = Number(status?.seats_included || 0);
  const seatAddon = Number(status?.seats_addon_qty || 0);
  const activeStaff = Number(status?.active_staff_count || 0);
  const [syncState, setSyncState] = useState({ loading: false, error: "", message: "" });
  const [modeMismatchDismissed, setModeMismatchDismissed] = useState(false);

  const handleAddSeats = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("billing:seats-required", {
        detail: {
          allowed: seatAllowed,
          current: activeStaff,
        },
      })
    );
  };

  const handleSync = async () => {
    setSyncState({ loading: true, error: "", message: "" });
    try {
      await api.post("/billing/sync-from-stripe");
      setSyncState({ loading: false, error: "", message: "Sync complete. Refresh the page to see the latest status." });
    } catch (err) {
      const apiError = err?.response?.data;
      const message = apiError?.message || apiError?.error || "Unable to sync from Stripe.";
      setSyncState({ loading: false, error: message, message: "" });
    }
  };

  const handleModeMismatchDismiss = async () => {
    setModeMismatchDismissed(true);
    try {
      await api.post("/billing/reset-stripe-state");
    } catch (err) {
      // Ignore reset failures to avoid blocking dismissal.
    }
  };

  return (
    <Box>
      <SectionCard
        title="Billing & subscription"
        subtitle="Track your plan, trial, and billing status in one place."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" onClick={() => openBillingPortal()}>
              Manage Billing
            </Button>
            <Button size="small" variant="outlined" onClick={() => (window.location.href = "/pricing")}>
              View Plans
            </Button>
            <Button size="small" variant="contained" onClick={handleAddSeats}>
              Add Seats
            </Button>
            <Button size="small" variant="outlined" onClick={handleSync} disabled={syncState.loading}>
              {syncState.loading ? "Syncing..." : "Sync from Stripe"}
            </Button>
          </Stack>
        }
      >
        {loading && <Typography variant="body2">Loading billing status…</Typography>}
        {!loading && error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
        {!loading && !error && status && (
          <Stack spacing={1.25}>
            {status.error === "mode_mismatch" && !modeMismatchDismissed && (
              <Alert
                severity="warning"
                onClose={handleModeMismatchDismiss}
                action={
                  <Button color="inherit" size="small" onClick={() => (window.location.href = "/pricing")}>
                    Start plan
                  </Button>
                }
              >
                {status.message ||
                  "Billing data was created in test mode. Please start your plan again to activate live billing."}
              </Alert>
            )}
            {status.sync_error === "multiple_subscriptions" && (
              <Alert severity="warning">
                Multiple subscriptions detected in Stripe. Cancel one in the billing portal, then run Sync.
              </Alert>
            )}
            {status.seats_overage && (
              <Alert severity="info">
                Seat limit reached. Add seats to keep adding team members.
              </Alert>
            )}
            {syncState.message && <Alert severity="success">{syncState.message}</Alert>}
            {syncState.error && <Alert severity="error">{syncState.error}</Alert>}
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>Plan:</strong> {planLabel(status.plan_key)}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {status.status || "inactive"}
              </Typography>
              <Typography variant="body2">
                <strong>Subscription:</strong> {status.subscription_state || "none"}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>Trial ends:</strong> {formatDate(status.trial_end)}
              </Typography>
              <Typography variant="body2">
                <strong>{formatBillingNextDateLabel({
                  nextBillingDate: status.next_billing_date,
                  trialEnd: status.trial_end,
                })}</strong>
              </Typography>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>Seats included:</strong> {seatIncluded}
              </Typography>
              <Typography variant="body2">
                <strong>Addon seats:</strong> {seatAddon}
              </Typography>
              <Typography variant="body2">
                <strong>Total allowed:</strong> {seatAllowed}
              </Typography>
              <Typography variant="body2">
                <strong>Active staff:</strong> {activeStaff}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {status.latest_invoice_url && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => window.open(status.latest_invoice_url, "_blank", "noopener")}
                >
                  View last invoice
                </Button>
              )}
              <Button size="small" variant="text" onClick={() => openBillingPortal()}>
                Cancel subscription
              </Button>
            </Stack>
          </Stack>
        )}
      </SectionCard>
    </Box>
  );
};

export default SettingsBillingSubscription;
