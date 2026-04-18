import React, { useState } from "react";
import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import SectionCard from "../../components/ui/SectionCard";
import useBillingStatus from "../../components/billing/useBillingStatus";
import { openBillingPortal } from "../../components/billing/billingHelpers";
import api from "../../utils/api";
import { formatBillingNextDateLabel } from "../../components/billing/billingLabels";
import FieldPhotosBillingModal from "../../components/billing/FieldPhotosBillingModal";
import { buildMarketingUrl } from "../../config/origins";
import { isMobileComplianceMode, MOBILE_PAYMENTS_MESSAGE } from "../../utils/mobileCompliance";
import MobileWebOnlyNotice from "../../components/mobile/MobileWebOnlyNotice";

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

const formatBytes = (value) => {
  const size = Number(value || 0);
  if (!size) return "0 MB";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const SettingsBillingSubscription = () => {
  const BILLING_SETTINGS_URL = "/manager/settings?tab=billing";
  const MARKETING_PRICING_URL = `${buildMarketingUrl("/en/pricing")}?from=app`;
  const { t } = useTranslation();
  const { status, loading, error, refetch } = useBillingStatus();
  const seatAllowed = Number(status?.seats_allowed || 0);
  const seatIncluded = Number(status?.seats_included || 0);
  const seatAddon = Number(status?.seats_addon_qty || 0);
  const activeStaff = Number(status?.active_staff_count || 0);
  const riskStatus = String(status?.risk_status || "normal").toLowerCase();
  const [syncState, setSyncState] = useState({ loading: false, error: "", message: "" });
  const [portalError, setPortalError] = useState("");
  const [modeMismatchDismissed, setModeMismatchDismissed] = useState(false);
  const [fieldPhotosModal, setFieldPhotosModal] = useState(null);
  const [fieldPhotosNotice, setFieldPhotosNotice] = useState("");
  const mobileComplianceMode = isMobileComplianceMode();
  const fieldPhotos = status?.field_photos || {};

  const handleAddSeats = () => {
    if (mobileComplianceMode) {
      setPortalError(MOBILE_PAYMENTS_MESSAGE);
      return;
    }
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

  const handleManageBilling = async () => {
    if (mobileComplianceMode) {
      setPortalError(MOBILE_PAYMENTS_MESSAGE);
      return;
    }
    setPortalError("");
    try {
      await openBillingPortal();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to open billing portal.";
      setPortalError(message);
    }
  };

  const openFieldPhotosBilling = (mode) => {
    if (mobileComplianceMode) {
      setPortalError(MOBILE_PAYMENTS_MESSAGE);
      return;
    }
    setFieldPhotosNotice("");
    setFieldPhotosModal(mode);
  };

  const handleFieldPhotosSuccess = async (_nextStatus, message) => {
    setFieldPhotosNotice(message || "Field Photos billing updated.");
    setFieldPhotosModal(null);
    try {
      await refetch();
    } catch (err) {
      // The billing action already succeeded; avoid replacing the success state with a refresh warning.
    }
  };

  const handleSync = async () => {
    if (mobileComplianceMode) {
      setPortalError(MOBILE_PAYMENTS_MESSAGE);
      return;
    }
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

  if (mobileComplianceMode) {
    return (
      <SectionCard
        title={t("billing.title")}
        subtitle={t("billing.subtitle")}
      >
        <MobileWebOnlyNotice
          title="Billing is web-only in mobile app mode"
          webPath="/manager/dashboard?view=settings&tab=billing"
        />
      </SectionCard>
    );
  }

  return (
    <Box>
      <SectionCard
        title={t("billing.title")}
        subtitle={t("billing.subtitle")}
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" onClick={handleManageBilling}>
              {t("billing.actions.manageBilling")}
            </Button>
            <Button size="small" variant="outlined" onClick={() => (window.location.href = MARKETING_PRICING_URL)}>
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
                  <Button color="inherit" size="small" onClick={() => (window.location.href = BILLING_SETTINGS_URL)}>
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
            {(riskStatus === "review_hold" || riskStatus === "suspended") && (
              <Alert severity="error">
                {status?.risk_hold_reason ||
                  "Billing is currently blocked by fraud risk controls. Contact support to review this account."}
              </Alert>
            )}
            {status.seats_overage && <Alert severity="info">{t("billing.seatsOverage")}</Alert>}
            {syncState.message && <Alert severity="success">{syncState.message}</Alert>}
            {syncState.error && <Alert severity="error">{syncState.error}</Alert>}
            {portalError && <Alert severity="error">{portalError}</Alert>}
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
              <Typography variant="body2">
                <strong>Risk status:</strong> {riskStatus}
              </Typography>
            </Stack>
            {(() => {
              const trialEnd = status.trial_end;
              const trialEndDate = trialEnd ? new Date(trialEnd) : null;
              const trialEndFuture =
                trialEndDate && !Number.isNaN(trialEndDate.getTime())
                  ? trialEndDate.getTime() > Date.now()
                  : false;
              const showTrial =
                String(status.status || "").toLowerCase() === "trialing" || trialEndFuture;
              const trialEndForLabel = showTrial ? null : status.trial_end;
              return (
                <Stack direction="row" spacing={3} flexWrap="wrap">
                  {showTrial && (
                    <Typography variant="body2">
                      <strong>{t("billing.labels.trialEnds")}:</strong>{" "}
                      {formatDate(status.trial_end, t)}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>
                      {formatBillingNextDateLabel({
                        nextBillingDate: status.next_billing_date,
                        trialEnd: trialEndForLabel,
                        t,
                      })}
                    </strong>
                  </Typography>
                </Stack>
              );
            })()}
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
            <Divider sx={{ my: 1 }} />
            <Stack spacing={1}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Field Photos</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Proof-of-work photo uploads for shift-based teams.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {!fieldPhotos.addon_active && !fieldPhotos.read_only && (
                    <Button size="small" variant="contained" onClick={() => openFieldPhotosBilling("activate")}>
                      Activate
                    </Button>
                  )}
                  {(fieldPhotos.addon_active || fieldPhotos.read_only) && (
                    <Button size="small" variant="outlined" onClick={() => openFieldPhotosBilling("storage")}>
                      Add 10 GB
                    </Button>
                  )}
                </Stack>
              </Stack>
              {fieldPhotosNotice && <Alert severity="success">{fieldPhotosNotice}</Alert>}
              {fieldPhotos.read_only && (
                <Alert severity="warning">
                  Field Photos is read-only. New uploads are disabled; existing photos remain available during the grace period.
                </Alert>
              )}
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <Typography variant="body2">
                  <strong>Status:</strong> {fieldPhotos.addon_active ? "Active" : fieldPhotos.read_only ? "Read-only grace" : "Inactive"}
                </Typography>
                <Typography variant="body2">
                  <strong>Storage expansions:</strong> {Number(fieldPhotos.storage_addon_qty || 0)}
                </Typography>
                <Typography variant="body2">
                  <strong>Storage:</strong> {formatBytes(fieldPhotos.storage_used_bytes)} of {formatBytes(fieldPhotos.storage_quota_bytes)}
                </Typography>
                <Typography variant="body2">
                  <strong>Retention:</strong> {fieldPhotos.retention_days || 90} days
                </Typography>
              </Stack>
              {!fieldPhotos.price_configured && (
                <Alert severity="info">Field Photos billing is not configured yet. Contact support to activate this add-on.</Alert>
              )}
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
              <Button size="small" variant="text" onClick={handleManageBilling}>
                {t("billing.actions.cancelSubscription")}
              </Button>
            </Stack>
          </Stack>
        )}
      </SectionCard>
      <FieldPhotosBillingModal
        open={Boolean(fieldPhotosModal)}
        mode={fieldPhotosModal || "activate"}
        currentStorageQty={Number(fieldPhotos.storage_addon_qty || 0)}
        onClose={() => setFieldPhotosModal(null)}
        onSuccess={(nextStatus) => handleFieldPhotosSuccess(
          nextStatus,
          fieldPhotosModal === "storage" ? "Field Photos storage updated." : "Field Photos activated."
        )}
      />
    </Box>
  );
};

export default SettingsBillingSubscription;
