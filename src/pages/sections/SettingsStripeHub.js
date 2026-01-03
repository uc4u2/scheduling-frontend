// src/pages/sections/SettingsStripeHub.js
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  Tooltip,
  IconButton,
  Drawer,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import SectionCard from "../../components/ui/SectionCard";
import { stripeConnect } from "../../utils/api";
import useStripeConnectStatus from "../../hooks/useStripeConnectStatus";
import api from "../../utils/api";
import { useTranslation } from "react-i18next";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import TaxHelpGuide from "./TaxHelpGuide";

const MODE_LABEL_KEY = {
  offline: "settings.stripeHub.checkout.mode.offline",
  card_on_file: "settings.stripeHub.checkout.mode.cardOnFile",
  pay_now: "settings.stripeHub.checkout.mode.payNow",
};

const mapChargeCurrencyKey = (mode, t) =>
  mode === "LOCALIZED"
    ? t("settings.payments.chargeModes.localized")
    : t("settings.payments.chargeModes.platformFixed");

export default function SettingsStripeHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const {
    status: connectStatus,
    loading: connectLoading,
    refresh: refreshConnectStatus,
  } = useStripeConnectStatus({ auto: Boolean(token) });
  const [connectError, setConnectError] = useState("");
  const [connectAction, setConnectAction] = useState(null);

  const [profileLoading, setProfileLoading] = useState(Boolean(token));
  const [profileError, setProfileError] = useState("");
  const [profile, setProfile] = useState(null);
  const [copyNotice, setCopyNotice] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingStatus, setBillingStatus] = useState(null);
  const [billingStatusError, setBillingStatusError] = useState("");
  const [billingStatusLoading, setBillingStatusLoading] = useState(Boolean(token));
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);
  const [seatInput, setSeatInput] = useState("");
  const [seatPreview, setSeatPreview] = useState(null);
  const [seatPreviewLoading, setSeatPreviewLoading] = useState(false);
  const trialEnd = billingStatus?.trial_end;
  const seatNextBillingLabel = seatPreview?.next_billing_date
    ? `Next billing date: ${new Date(seatPreview.next_billing_date).toLocaleDateString()}`
    : trialEnd
      ? `Trial ends: ${new Date(trialEnd).toLocaleDateString()}`
      : "Next billing date: —";
  const [seatDialogError, setSeatDialogError] = useState("");
  const [seatNotice, setSeatNotice] = useState("");
  const [seatInvoiceUrl, setSeatInvoiceUrl] = useState("");

  const loadProfile = useCallback(async () => {
    if (!token) return;
    setProfileLoading(true);
    setProfileError("");
    try {
      const { data } = await api.get(`/admin/company-profile`, {
        headers,
      });
      setProfile(data || {});
    } catch (error) {
      setProfileError(
        error?.response?.data?.error ||
          error?.message ||
          t("settings.common.saveError")
      );
    } finally {
      setProfileLoading(false);
    }
  }, [headers, t, token]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const loadBillingStatus = useCallback(async () => {
    if (!token) return;
    setBillingStatusLoading(true);
    setBillingStatusError("");
    try {
      const { data } = await api.get("/billing/status", { headers });
      setBillingStatus(data || null);
    } catch (error) {
      setBillingStatusError(
        error?.response?.data?.error || error?.message || t("settings.common.saveError")
      );
    } finally {
      setBillingStatusLoading(false);
    }
  }, [headers, t, token]);

  React.useEffect(() => {
    loadBillingStatus();
  }, [loadBillingStatus]);

  const runConnectAction = useCallback(
    async (action) => {
      setConnectAction(action);
      setConnectError("");
      try {
        let response;
        if (action === "start") {
          response = await stripeConnect.startOnboarding({}, { headers });
        } else if (action === "refresh") {
          response = await stripeConnect.refreshOnboardingLink({}, { headers });
        } else {
          response = await stripeConnect.dashboardLogin({}, { headers });
        }

        const link =
          response?.url ||
          response?.onboarding_url ||
          response?.refresh_url ||
          response?.account_link ||
          response?.account_link_url ||
          response?.login_url;

        if (link && typeof window !== "undefined") {
          const target = action === "dashboard" ? "_blank" : "_self";
          if (target === "_self") {
            window.location.href = link;
          } else {
            window.open(link, target, "noopener");
          }
        } else {
          throw new Error("Stripe did not return an onboarding link.");
        }

        await refreshConnectStatus();
      } catch (error) {
        setConnectError(
          error?.displayMessage ||
            error?.response?.data?.error ||
            error?.message ||
            t("settings.common.saveError")
        );
      } finally {
        setConnectAction(null);
      }
    },
    [headers, refreshConnectStatus, t]
  );

  const paymentMode = React.useMemo(() => {
    if (!profile) return null;
    const enable = Boolean(profile.enable_stripe_payments);
    const allow = Boolean(profile.allow_card_on_file);
    if (enable) return "pay_now";
    if (allow) return "card_on_file";
    return "offline";
  }, [profile]);

  const publishableKey = profile?.stripe_publishable_key?.trim();

  const handleCopyKey = async () => {
    if (!publishableKey) return;
    try {
      await navigator.clipboard.writeText(publishableKey);
      setCopyNotice(t("settings.stripeHub.checkout.copySuccess"));
      setTimeout(() => setCopyNotice(""), 2500);
    } catch {
      setCopyNotice(t("settings.stripeHub.checkout.copyError"));
      setTimeout(() => setCopyNotice(""), 2500);
    }
  };

  const handleBillingPortal = async () => {
    setBillingError("");
    setBillingLoading(true);
    try {
      const res = await api.post("/billing/portal", {}, { headers });
      const url = res?.data?.url;
      if (url && typeof window !== "undefined") {
        window.location.href = url;
        return;
      }
      throw new Error("Billing portal URL missing.");
    } catch (error) {
      setBillingError(
        error?.displayMessage ||
          error?.response?.data?.error ||
          error?.message ||
          t("settings.common.saveError")
      );
    } finally {
      setBillingLoading(false);
    }
  };

  const seatsAllowed = Number(billingStatus?.seats_allowed || 0);
  const seatsIncluded = Number(billingStatus?.seats_included || 0);
  const seatsAddon = Number(billingStatus?.seats_addon_qty || 0);
  const activeStaff = Number(billingStatus?.active_staff_count || 0);
  const seatsOver = Boolean(billingStatus?.seats_overage);
  const neededSeats = Math.max(0, activeStaff - seatsAllowed);

  const handleOpenSeatDialog = () => {
    setSeatInput(neededSeats > 0 ? String(neededSeats) : "1");
    setSeatPreview(null);
    setSeatDialogError("");
    setSeatDialogOpen(true);
  };

  const handleSeatPurchase = async () => {
    const additional = Math.max(0, parseInt(seatInput, 10) || 0);
    if (!additional) {
      setBillingStatusError("Enter at least 1 seat.");
      return;
    }
    setBillingStatusError("");
    setSeatDialogError("");
    setBillingStatusLoading(true);
    try {
      const targetTotal = seatsAllowed + additional;
      const { data } = await api.post(
        "/billing/seats/set",
        { target_total_seats: targetTotal },
        { headers }
      );
      setBillingStatus(data || null);
      setSeatInvoiceUrl(data?.latest_invoice_url || "");
      setSeatNotice("Seats updated. View invoice in Billing Portal.");
      setSeatDialogOpen(false);
    } catch (error) {
      const apiError = error?.response?.data?.error;
      if (apiError === "subscription_missing") {
        setSeatDialogError("No active subscription. Start a plan to purchase seats.");
        setBillingStatusError("Active subscription required to add seats.");
      } else {
        setSeatDialogError(error?.response?.data?.message || "");
        setBillingStatusError(
          apiError || error?.message || t("settings.common.saveError")
        );
      }
    } finally {
      setBillingStatusLoading(false);
    }
  };

  React.useEffect(() => {
    if (!seatDialogOpen) return;
    const value = Math.max(0, parseInt(seatInput, 10) || 0);
    if (!value) {
      setSeatPreview(null);
      setSeatDialogError("");
      return;
    }
    let active = true;
    setSeatPreviewLoading(true);
    api
      .get(`/billing/seats/preview?addon_qty=${value}`, { headers })
      .then((res) => {
        if (!active) return;
        setSeatDialogError("");
        setSeatPreview(res?.data || null);
      })
      .catch((error) => {
        if (!active) return;
        const apiError = error?.response?.data?.error;
        if (apiError === "subscription_missing") {
          setSeatDialogError("No active subscription. Start a plan to purchase seats.");
        } else if (apiError === "seat_addon_price_missing") {
          setSeatDialogError("Seat add-on price is not configured yet.");
        } else {
          setSeatDialogError("");
        }
        setSeatPreview(null);
      })
      .finally(() => {
        if (!active) return;
        setSeatPreviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [seatDialogOpen, seatInput, headers]);

  const handleSeatSync = async () => {
    setBillingStatusError("");
    setBillingStatusLoading(true);
    try {
      const { data } = await api.post("/billing/sync-seats", {}, { headers });
      setBillingStatus(data || null);
    } catch (error) {
      setBillingStatusError(
        error?.response?.data?.error || error?.message || t("settings.common.saveError")
      );
    } finally {
      setBillingStatusLoading(false);
    }
  };

  if (!token) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        {t("settings.stripeHub.authRequired")}
      </Alert>
    );
  }

  const chargesEnabled = Boolean(connectStatus?.charges_enabled);
  const payoutsEnabled = Boolean(connectStatus?.payouts_enabled);
  const connected = Boolean(connectStatus?.connected);
  const requirementsDue = Array.isArray(connectStatus?.requirements_due)
    ? connectStatus.requirements_due
    : [];

  const modeLabel = t(
    MODE_LABEL_KEY[paymentMode || "offline"] ||
      MODE_LABEL_KEY.offline
  );

  const publishableDisplay =
    publishableKey &&
    `${publishableKey.slice(0, 12)}…${publishableKey.slice(-4)}`;

  const chargeCurrencyMode = (profile?.charge_currency_mode || "PLATFORM_FIXED").toUpperCase();

  return (
    <Stack spacing={3}>
      <SectionCard
        title={t("settings.stripeHub.connect.title")}
        description={t("settings.stripeHub.connect.description")}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                refreshConnectStatus();
                setConnectError("");
              }}
              disabled={connectLoading || Boolean(connectAction)}
            >
              {t("settings.stripeHub.buttons.refreshStatus")}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2}>
          {connectLoading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2">
                {t("settings.stripeHub.connect.loading")}
              </Typography>
            </Stack>
          ) : (
            <>
              {connectError && <Alert severity="error">{connectError}</Alert>}

              {connected ? (
                <Alert severity={chargesEnabled ? "success" : "warning"}>
                  {chargesEnabled
                    ? payoutsEnabled
                      ? t("settings.stripeHub.connect.status.ready")
                      : t("settings.stripeHub.connect.status.readyNoPayouts")
                    : t("settings.stripeHub.connect.status.notReady")}
                </Alert>
              ) : (
                <Alert severity="info">
                  {t("settings.stripeHub.connect.status.disconnected")}
                </Alert>
              )}

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={
                    chargesEnabled
                      ? t("settings.stripeHub.connect.chargesEnabled")
                      : t("settings.stripeHub.connect.chargesDisabled")
                  }
                  color={chargesEnabled ? "success" : "default"}
                  size="small"
                />
                <Chip
                  label={
                    payoutsEnabled
                      ? t("settings.stripeHub.connect.payoutsEnabled")
                      : t("settings.stripeHub.connect.payoutsDisabled")
                  }
                  color={payoutsEnabled ? "success" : "default"}
                  size="small"
                />
              </Stack>

              {requirementsDue.length > 0 && (
                <Alert severity="warning">
                  <Typography variant="subtitle2">
                    {t("settings.stripeHub.connect.requirementsTitle")}
                  </Typography>
                  <ul style={{ paddingLeft: 18, marginTop: 4, marginBottom: 0 }}>
                    {requirementsDue.map((req) => (
                      <li key={req}>
                        <Typography variant="body2">{req}</Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<PlayCircleOutlineIcon />}
                  onClick={() => runConnectAction(connected ? "refresh" : "start")}
                  disabled={Boolean(connectAction)}
                >
                  {connected
                    ? t("settings.stripeHub.buttons.resumeOnboarding")
                    : t("settings.stripeHub.buttons.startOnboarding")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LaunchIcon />}
                  onClick={() => runConnectAction("dashboard")}
                  disabled={Boolean(connectAction)}
                >
                  {t("settings.stripeHub.buttons.openDashboard")}
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </SectionCard>

      <SectionCard
        title="Subscription & Billing"
        description="Manage your subscription, payment method, and invoices."
        actions={
          <Button
            size="small"
            variant="contained"
            onClick={handleBillingPortal}
            disabled={billingLoading}
          >
            {billingLoading ? "Opening..." : "Manage Billing"}
          </Button>
        }
      >
        {billingError && <Alert severity="error">{billingError}</Alert>}
        {!billingError && (
          <Typography variant="body2" color="text.secondary">
            Use the billing portal to upgrade plans, update your card, or download invoices.
          </Typography>
        )}
      </SectionCard>

      <SectionCard
        title="Seats"
        description="Manage staff seat limits for your subscription."
        actions={
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={handleSeatSync} disabled={billingStatusLoading}>
              Sync seats
            </Button>
            <Button size="small" variant="contained" onClick={handleOpenSeatDialog} disabled={billingStatusLoading}>
              Add seats
            </Button>
          </Stack>
        }
      >
        {billingStatusLoading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2">Loading seat usage…</Typography>
          </Stack>
        ) : (
          <Stack spacing={1}>
            {seatNotice && (
              <Alert
                severity="success"
                action={
                  <Stack direction="row" spacing={1}>
                    {seatInvoiceUrl && (
                      <Button
                        color="inherit"
                        size="small"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.open(seatInvoiceUrl, "_blank", "noopener");
                          }
                        }}
                      >
                        View invoice
                      </Button>
                    )}
                    <Button color="inherit" size="small" onClick={handleBillingPortal}>
                      Manage Billing
                    </Button>
                  </Stack>
                }
              >
                {seatNotice}
              </Alert>
            )}
            {billingStatusError && <Alert severity="error">{billingStatusError}</Alert>}
            {seatsOver && (
              <Alert severity="warning">
                Over limit: {activeStaff} active staff with {seatsAllowed} seats available.
              </Alert>
            )}
            <Typography variant="body2"><strong>Active staff:</strong> {activeStaff}</Typography>
            <Typography variant="body2"><strong>Included seats:</strong> {seatsIncluded}</Typography>
            <Typography variant="body2"><strong>Addon seats:</strong> {seatsAddon}</Typography>
            <Typography variant="body2"><strong>Total allowed:</strong> {seatsAllowed}</Typography>
          </Stack>
        )}
      </SectionCard>

      <Dialog open={seatDialogOpen} onClose={() => setSeatDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add seats</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Add seats to increase your total allowed headcount.
            </Typography>
            {seatDialogError && <Alert severity="warning">{seatDialogError}</Alert>}
            <TextField
              label="Additional seats"
              type="number"
              inputProps={{ min: 1 }}
              value={seatInput}
              onChange={(e) => setSeatInput(e.target.value)}
              fullWidth
              disabled={Boolean(seatDialogError)}
            />
            {seatPreviewLoading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Typography variant="caption">Fetching estimate…</Typography>
              </Stack>
            )}
            {seatPreview && (
              <Stack spacing={0.5}>
                <Typography variant="caption">
                  Estimated charge today: {seatPreview.amount_due_today_formatted || "—"}
                </Typography>
                <Typography variant="caption">
                  {seatNextBillingLabel}
                </Typography>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSeatDialogOpen(false)}>Cancel</Button>
          {seatDialogError ? (
            <Button
              variant="contained"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/pricing";
                }
              }}
            >
              View plans
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSeatPurchase} disabled={billingStatusLoading}>
              Confirm purchase
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <SectionCard
        title={t("settings.stripeHub.checkout.title")}
        description={t("settings.stripeHub.checkout.description")}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              component={RouterLink}
              to="/settings?tab=checkout"
            >
              {t("settings.stripeHub.checkout.manageCheckout")}
            </Button>
            <Button
              size="small"
              variant="outlined"
              component={RouterLink}
              to="/admin/CompanyProfile"
            >
              {t("settings.stripeHub.checkout.manageProfile")}
            </Button>
          </Stack>
        }
      >
        {profileLoading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2">
              {t("settings.common.loading")}
            </Typography>
          </Stack>
        ) : profileError ? (
          <Alert severity="error">{profileError}</Alert>
        ) : (
          <Stack spacing={1.5}>
            <Typography variant="body2">{modeLabel}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                size="small"
                color={Boolean(profile?.enable_stripe_payments) ? "success" : "default"}
                label={t("settings.payments.stripePayments") + ": " + (profile?.enable_stripe_payments ? t("settings.payments.allowed") : t("settings.payments.notSet"))}
              />
              <Chip
                size="small"
                color={Boolean(profile?.allow_card_on_file) ? "primary" : "default"}
                label={t("settings.payments.cardsOnFile") + ": " + (profile?.allow_card_on_file ? t("settings.payments.allowed") : t("settings.payments.notSet"))}
              />
              <Chip
                size="small"
                label={
                  t("settings.payments.pricesIncludeTax") +
                  ": " +
                  (profile?.prices_include_tax ? t("common.yes") : t("common.no"))
                }
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {t("settings.stripeHub.checkout.publishableKey")}
              </Typography>
              {publishableKey ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {publishableDisplay}
                  </Typography>
                  <Tooltip title={t("settings.stripeHub.checkout.copyKey")}>
                    <IconButton size="small" onClick={handleCopyKey}>
                      <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ) : (
                <Typography variant="body2" color="warning.main">
                  {t("settings.stripeHub.checkout.missingKey")}
                </Typography>
              )}
            </Stack>
            {copyNotice && <Alert severity="info">{copyNotice}</Alert>}

            <Typography variant="body2">
              {t("settings.payments.chargeCurrencyMode")}:{" "}
              {mapChargeCurrencyKey(chargeCurrencyMode, t)}
            </Typography>
            <Typography variant="body2">
              {t("settings.payments.displayCurrency")}:{" "}
              {(profile?.display_currency || "").toUpperCase() || t("settings.payments.notSet")}
            </Typography>
            <Typography variant="body2">
              {t("settings.payments.taxCountry")}:{" "}
              {(profile?.tax_country_code || "").toUpperCase() || t("settings.payments.notSet")}
            </Typography>
            <Typography variant="body2">
              {t("settings.payments.taxRegion")}:{" "}
              {(profile?.tax_region_code || "").toUpperCase() || t("settings.payments.notSet")}
            </Typography>
          </Stack>
        )}
      </SectionCard>

      <SectionCard
        title={t("settings.stripeHub.help.title")}
        description={t("settings.stripeHub.help.subtitle")}
      >
        <Stack spacing={1}>
          {(t("settings.stripeHub.help.items", { returnObjects: true }) || []).map(
            (item, index) => (
              <Typography key={index} variant="body2">
                • {item}
              </Typography>
            )
          )}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ pt: 1 }}
          >
            <Button
              variant="contained"
              onClick={() => setGuideOpen(true)}
            >
              {t("settings.stripeHub.help.openTaxGuide")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/settings?tab=checkout")}
            >
              {t("settings.stripeHub.help.openCheckout")}
            </Button>
            <Button
              variant="outlined"
              startIcon={<LaunchIcon />}
              onClick={() => navigate("/manager/payments")}
            >
              {t("settings.stripeHub.help.openPayments")}
            </Button>
          </Stack>
        </Stack>
      </SectionCard>

      <Drawer
        anchor="right"
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
      >
        <Box sx={{ width: 600, maxWidth: "100%", p: 3 }}>
          <TaxHelpGuide
            onClose={() => setGuideOpen(false)}
            onOpenStripe={() => runConnectAction("dashboard")}
            pricesIncludeTax={Boolean(profile?.prices_include_tax)}
            translationBase="settings.stripeHub"
          />
        </Box>
      </Drawer>
    </Stack>
  );
}
