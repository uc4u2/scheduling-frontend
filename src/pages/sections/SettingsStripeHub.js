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
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import SectionCard from "../../components/ui/SectionCard";
import { stripeConnect } from "../../utils/api";
import useStripeConnectStatus from "../../hooks/useStripeConnectStatus";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import TaxHelpGuide from "./TaxHelpGuide";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

  const loadProfile = useCallback(async () => {
    if (!token) return;
    setProfileLoading(true);
    setProfileError("");
    try {
      const { data } = await axios.get(`${API_URL}/admin/company-profile`, {
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
