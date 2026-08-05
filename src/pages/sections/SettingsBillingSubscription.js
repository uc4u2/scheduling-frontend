import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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

const formatAmountInterval = (amount, interval) => {
  if (!amount) return "Pricing unavailable";
  return interval ? `${amount}/${interval}` : amount;
};

const BillingInfoButton = ({ title, lines = [], buttonLabel = "More info" }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={buttonLabel}>
        <IconButton
          size="small"
          aria-label={buttonLabel}
          aria-haspopup="dialog"
          aria-expanded={open ? "true" : undefined}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ sx: { p: 2, maxWidth: 340 } }}
      >
        <Stack spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{title}</Typography>
          {lines.map((line) => (
            <Typography key={line} variant="body2" color="text.secondary">
              {line}
            </Typography>
          ))}
        </Stack>
      </Popover>
    </>
  );
};

const resolveTrialDisplay = (status, now = new Date()) => {
  const trialEndRaw = status?.trial_end;
  if (!trialEndRaw) return null;
  const trialEnd = new Date(trialEndRaw);
  if (Number.isNaN(trialEnd.getTime())) return null;
  const statusKey = String(status?.status || "").toLowerCase();
  if (statusKey === "trialing" && trialEnd.getTime() > now.getTime()) {
    return { label: "Trial ends", value: trialEndRaw };
  }
  if (statusKey === "active" && trialEnd.getTime() <= now.getTime()) {
    return null;
  }
  if (trialEnd.getTime() <= now.getTime()) {
    return { label: "Trial ended", value: trialEndRaw };
  }
  return null;
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
  const [fieldPhotosPreview, setFieldPhotosPreview] = useState(null);
  const [fieldPhotosPreviewLoading, setFieldPhotosPreviewLoading] = useState(false);
  const [fieldPhotosPreviewError, setFieldPhotosPreviewError] = useState("");
  const [aiCommerceBusy, setAiCommerceBusy] = useState(false);
  const [aiCommerceNotice, setAiCommerceNotice] = useState("");
  const mobileComplianceMode = isMobileComplianceMode();
  const fieldPhotos = status?.field_photos || {};
  const aiCommerce = status?.ai_commerce_copilot || {};
  const trialDisplay = useMemo(() => resolveTrialDisplay(status), [status]);
  const fieldPhotosUsagePercent = useMemo(() => {
    const used = Number(fieldPhotos.storage_used_bytes || 0);
    const quota = Number(fieldPhotos.storage_quota_bytes || 0);
    if (!quota) return 0;
    return Math.min(100, Math.round((used / quota) * 100));
  }, [fieldPhotos.storage_quota_bytes, fieldPhotos.storage_used_bytes]);

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

  useEffect(() => {
    if (mobileComplianceMode || !status) return;
    let active = true;
    setFieldPhotosPreviewLoading(true);
    setFieldPhotosPreviewError("");
    api
      .get("/billing/field-photos/preview")
      .then((res) => {
        if (!active) return;
        setFieldPhotosPreview(res?.data || null);
      })
      .catch((err) => {
        if (!active) return;
        setFieldPhotosPreview(null);
        setFieldPhotosPreviewError(err?.response?.data?.message || "Field Photos pricing is unavailable right now.");
      })
      .finally(() => {
        if (!active) return;
        setFieldPhotosPreviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mobileComplianceMode, status]);

  const handleActivateAiCommerce = async () => {
    if (mobileComplianceMode) {
      setPortalError(MOBILE_PAYMENTS_MESSAGE);
      return;
    }
    setAiCommerceBusy(true);
    setAiCommerceNotice("");
    try {
      const preview = await api.get("/billing/ai-commerce-copilot/preview");
      const label = preview?.data?.amount_formatted || "the configured recurring price";
      const confirmed = window.confirm(
        `Activate AI Commerce Copilot for ${label} and include ${preview?.data?.monthly_action_allowance || 0} successful AI actions per billing period?`
      );
      if (!confirmed) {
        setAiCommerceBusy(false);
        return;
      }
      await api.post("/billing/ai-commerce-copilot/activate");
      await refetch();
      setAiCommerceNotice("AI Commerce Copilot add-on activated.");
    } catch (err) {
      setAiCommerceNotice(err?.response?.data?.message || err?.response?.data?.error || "Unable to activate AI Commerce Copilot.");
    } finally {
      setAiCommerceBusy(false);
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
    <Stack spacing={2}>
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
            <Stack direction="row" spacing={3} flexWrap="wrap">
              {trialDisplay && (
                <Typography variant="body2">
                  <strong>{trialDisplay.label}:</strong> {formatDate(trialDisplay.value, t)}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>
                  {formatBillingNextDateLabel({
                    nextBillingDate: status.next_billing_date,
                    trialEnd: null,
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
              <Button size="small" variant="text" onClick={handleManageBilling}>
                {t("billing.actions.cancelSubscription")}
              </Button>
            </Stack>
          </Stack>
        )}
      </SectionCard>

      <SectionCard
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 900 }}>AI Commerce Copilot</Typography>
            <Chip
              size="small"
              variant="outlined"
              label={aiCommerce.addon_active ? "Active" : aiCommerce.monetization_mode === "free_launch" ? "Included during free launch" : "Inactive"}
            />
            <BillingInfoButton
              title="AI Commerce Copilot"
              buttonLabel="About AI Commerce Copilot billing"
              lines={[
                "Included during the current free launch.",
                "Usage is recorded.",
                "No additional charge currently applies.",
                "Allowance resets according to the current billing-period contract.",
              ]}
            />
          </Stack>
        }
        subtitle="Guided product creation, shipping setup, and manager-approved safe actions."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {aiCommerce.monetization_mode === "paid_addon_required" && !aiCommerce.addon_active && aiCommerce.activation_available ? (
              <Button size="small" variant="contained" onClick={handleActivateAiCommerce} disabled={aiCommerceBusy}>
                {aiCommerceBusy ? "Activating..." : "Activate"}
              </Button>
            ) : null}
            {aiCommerce.monetization_mode !== "free_launch" ? (
              <Button size="small" variant="outlined" onClick={handleManageBilling}>
                Manage billing
              </Button>
            ) : null}
          </Stack>
        }
      >
        <Stack spacing={1.25}>
          {aiCommerceNotice && (
            <Alert severity={String(aiCommerceNotice || "").toLowerCase().includes("unable") ? "error" : "success"}>
              {aiCommerceNotice}
            </Alert>
          )}
          {aiCommerce.monetization_mode === "paid_addon_required" && !aiCommerce.access_allowed && aiCommerce.current_plan === "starter" && (
            <Alert severity="warning">Pro or Business is required before the Commerce Copilot add-on can be activated.</Alert>
          )}
          {aiCommerce.monetization_mode === "paid_addon_required" && !aiCommerce.addon_active && aiCommerce.activation_available && (
            <Alert severity="warning">AI Commerce Copilot add-on required. Activate it to continue creating new Copilot sessions or applying approved changes.</Alert>
          )}
          {aiCommerce.warning && <Alert severity="warning">{aiCommerce.warning}</Alert>}
          <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Used {Number(aiCommerce.successful_actions_used || 0)} of {Number(aiCommerce.monthly_action_allowance || 0)} successful actions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {aiCommerce.successful_actions_remaining ?? "n/a"} remaining this billing period
            </Typography>
          </Stack>
          {aiCommerce.grace_ends_at && (
            <Typography variant="body2">
              <strong>Grace ends:</strong> {formatDate(aiCommerce.grace_ends_at, t)}
            </Typography>
          )}
        </Stack>
      </SectionCard>

      <SectionCard
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Field Photos</Typography>
            <Chip
              size="small"
              variant="outlined"
              label={fieldPhotos.addon_active ? "Active" : fieldPhotos.read_only ? "Read-only grace" : "Inactive"}
            />
            <BillingInfoButton
              title="Field Photos pricing"
              buttonLabel="About Field Photos pricing"
              lines={[
                `Base recurring charge: ${formatAmountInterval(fieldPhotosPreview?.recurring_amount_formatted, fieldPhotosPreview?.interval)}.`,
                `Included storage: ${fieldPhotosPreview?.included_storage_label || "5 GB"}.`,
                `${fieldPhotosPreview?.retention_days || fieldPhotos.retention_days || 90}-day retention.`,
                `Storage expansion: ${fieldPhotosPreview?.storage_expansion_label || "+10 GB"} for ${formatAmountInterval(fieldPhotosPreview?.storage_expansion_amount_formatted, fieldPhotosPreview?.storage_expansion_interval)}.`,
                "Exact taxes and proration, when applicable, are shown in the confirmation modal before activation.",
              ]}
            />
          </Stack>
        }
        subtitle="Proof-of-work photo uploads for shift-based teams."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {!fieldPhotos.addon_active && !fieldPhotos.read_only && (
              <Button size="small" variant="contained" onClick={() => openFieldPhotosBilling("activate")}>
                View pricing & activate
              </Button>
            )}
            {(fieldPhotos.addon_active || fieldPhotos.read_only) && (
              <Button size="small" variant="outlined" onClick={() => openFieldPhotosBilling("storage")}>
                Manage storage
              </Button>
            )}
            {(fieldPhotos.addon_active || fieldPhotos.read_only) && (
              <Button size="small" variant="outlined" onClick={handleManageBilling}>
                Manage billing
              </Button>
            )}
          </Stack>
        }
      >
        <Stack spacing={1.25}>
          {fieldPhotosNotice && <Alert severity="success">{fieldPhotosNotice}</Alert>}
          {fieldPhotos.read_only && (
            <Alert severity="warning">
              Field Photos is read-only. New uploads are disabled; existing photos remain available during the grace period.
            </Alert>
          )}
          {!fieldPhotos.price_configured && (
            <Alert severity="info">Field Photos billing is not configured yet. Contact support to activate this add-on.</Alert>
          )}

          {!fieldPhotos.addon_active && !fieldPhotos.read_only ? (
            <Stack spacing={0.75}>
              {fieldPhotosPreviewLoading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">Loading authoritative pricing...</Typography>
                </Stack>
              ) : (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Starts at {formatAmountInterval(fieldPhotosPreview?.recurring_amount_formatted, fieldPhotosPreview?.interval)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Includes {fieldPhotosPreview?.included_storage_label || "5 GB"} · {fieldPhotosPreview?.retention_days || 90}-day retention
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No charge is created until you review and confirm the billing preview.
                  </Typography>
                  {fieldPhotosPreviewError ? (
                    <Typography variant="body2" color="error">
                      {fieldPhotosPreviewError}
                    </Typography>
                  ) : null}
                </>
              )}
            </Stack>
          ) : (
            <Stack spacing={1}>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <Typography variant="body2">
                  <strong>Storage expansions:</strong> {Number(fieldPhotos.storage_addon_qty || 0)}
                </Typography>
                <Typography variant="body2">
                  <strong>Storage:</strong> {formatBytes(fieldPhotos.storage_used_bytes)} of {formatBytes(fieldPhotos.storage_quota_bytes)}
                </Typography>
                <Typography variant="body2">
                  <strong>Retention:</strong> {fieldPhotos.retention_days || 90} days
                </Typography>
                {status.next_billing_date ? (
                  <Typography variant="body2">
                    <strong>Renewal:</strong> {formatDate(status.next_billing_date, t)}
                  </Typography>
                ) : null}
              </Stack>
              <Box sx={{ width: "100%", maxWidth: 320 }}>
                <Typography id="field-photos-storage-progress" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Storage usage: {fieldPhotosUsagePercent}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={fieldPhotosUsagePercent}
                  aria-labelledby="field-photos-storage-progress"
                />
              </Box>
            </Stack>
          )}
        </Stack>
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
    </Stack>
  );
};

export default SettingsBillingSubscription;
