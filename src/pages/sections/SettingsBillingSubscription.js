import React, { useState } from "react";
import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import SectionCard from "../../components/ui/SectionCard";
import useBillingStatus from "../../components/billing/useBillingStatus";
import { openBillingPortal } from "../../components/billing/billingHelpers";
import api from "../../utils/api";
import { formatBillingNextDateLabel } from "../../components/billing/billingLabels";

const planLabel = (key, t) => {
  const map = {
    starter: t("billing.plans.starter"),
    pro: t("billing.plans.pro"),
    business: t("billing.plans.business"),
  };
  return map[String(key || "").toLowerCase()] || t("billing.plans.starter");
};

const formatDate = (value, t) => {
  if (!value) return t("billing.values.na");
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return t("billing.values.na");
  }
};

const SettingsBillingSubscription = () => {
  const { t } = useTranslation();
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
      setSyncState({ loading: false, error: "", message: t("billing.syncComplete") });
    } catch (err) {
      const apiError = err?.response?.data;
      const message = apiError?.message || apiError?.error || t("billing.syncErrorDefault");
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
        title={t("billing.title")}
        subtitle={t("billing.subtitle")}
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" onClick={() => openBillingPortal()}>
              {t("billing.actions.manageBilling")}
            </Button>
            <Button size="small" variant="outlined" onClick={() => (window.location.href = "/pricing")}>
              {t("billing.actions.viewPlans")}
            </Button>
            <Button size="small" variant="contained" onClick={handleAddSeats}>
              {t("billing.actions.addSeats")}
            </Button>
            <Button size="small" variant="outlined" onClick={handleSync} disabled={syncState.loading}>
              {syncState.loading ? t("billing.actions.syncing") : t("billing.actions.syncFromStripe")}
            </Button>
          </Stack>
        }
      >
        {loading && <Typography variant="body2">{t("billing.loading")}</Typography>}
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
                    {t("billing.actions.startPlan")}
                  </Button>
                }
              >
                {status.message || t("billing.modeMismatch.defaultMessage")}
              </Alert>
            )}
            {status.sync_error === "multiple_subscriptions" && (
              <Alert severity="warning">{t("billing.syncErrors.multipleSubscriptions")}</Alert>
            )}
            {status.seats_overage && <Alert severity="info">{t("billing.seatsOverage")}</Alert>}
            {syncState.message && <Alert severity="success">{syncState.message}</Alert>}
            {syncState.error && <Alert severity="error">{syncState.error}</Alert>}
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>{t("billing.labels.plan")}:</strong> {planLabel(status.plan_key, t)}
              </Typography>
              <Typography variant="body2">
                <strong>{t("billing.labels.status")}:</strong> {status.status || t("billing.values.inactive")}
              </Typography>
              <Typography variant="body2">
                <strong>{t("billing.labels.subscription")}:</strong> {status.subscription_state || t("billing.values.none")}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>{t("billing.labels.trialEnds")}:</strong> {formatDate(status.trial_end, t)}
              </Typography>
              <Typography variant="body2">
                <strong>
                  {formatBillingNextDateLabel({
                    nextBillingDate: status.next_billing_date,
                    trialEnd: status.trial_end,
                    t,
                  })}
                </strong>
              </Typography>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>{t("billing.labels.seatsIncluded")}:</strong> {seatIncluded}
              </Typography>
              <Typography variant="body2">
                <strong>{t("billing.labels.addonSeats")}:</strong> {seatAddon}
              </Typography>
              <Typography variant="body2">
                <strong>{t("billing.labels.totalAllowed")}:</strong> {seatAllowed}
              </Typography>
              <Typography variant="body2">
                <strong>{t("billing.labels.activeStaff")}:</strong> {activeStaff}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {status.latest_invoice_url && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => window.open(status.latest_invoice_url, "_blank", "noopener")}
                >
                  {t("billing.actions.viewLastInvoice")}
                </Button>
              )}
              <Button size="small" variant="text" onClick={() => openBillingPortal()}>
                {t("billing.actions.cancelSubscription")}
              </Button>
            </Stack>
          </Stack>
        )}
      </SectionCard>
    </Box>
  );
};

export default SettingsBillingSubscription;
