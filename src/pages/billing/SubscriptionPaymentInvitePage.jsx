import React, { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router-dom";

import api from "../../utils/api";
import { isMobileComplianceMode, MOBILE_PAYMENTS_MESSAGE } from "../../utils/mobileCompliance";
import { trackGAEvent, trackGAEventOnce } from "../../analytics/ga";

const terminalStates = new Set(["trialing", "active", "failed", "expired", "revoked"]);

const SubscriptionPaymentInvitePage = () => {
  const { token } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  const successView = location.pathname.endsWith("/success");
  const [preview, setPreview] = useState(null);
  const [state, setState] = useState(successView ? "processing" : "pending");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const mobileComplianceMode = isMobileComplianceMode();

  const loadPreview = useCallback(async () => {
    try {
      const response = await api.get(`/public/billing/subscription-invites/${encodeURIComponent(token)}`);
      setPreview(response.data);
      setState(response.data?.state || "pending");
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error === "invitation_not_found" ? t("billing.publicInvite.invalid") : t("billing.publicInvite.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  const loadStatus = useCallback(async () => {
    try {
      const response = await api.get(`/public/billing/subscription-invites/${encodeURIComponent(token)}/status`);
      const nextState = response.data?.state || "processing";
      setState(nextState);
      if (nextState === "trialing") {
        trackGAEventOnce(`payment_invite_trial:${token}`, "trial_activated", {
          checkout_type: "payment_invite",
        });
      } else if (nextState === "active") {
        trackGAEventOnce(`payment_invite_subscription:${token}:active`, "subscription_activated", {
          subscription_status: nextState,
          checkout_type: "payment_invite",
        });
      }
      setError("");
      return nextState;
    } catch (err) {
      setError(t("billing.publicInvite.statusError"));
      return null;
    }
  }, [t, token]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  useEffect(() => {
    if (!successView) return undefined;
    let cancelled = false;
    let timer;
    const poll = async () => {
      const next = await loadStatus();
      if (!cancelled && !terminalStates.has(next)) timer = window.setTimeout(poll, 2000);
    };
    poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [loadStatus, successView]);

  const startCheckout = async () => {
    if (mobileComplianceMode) {
      setError(MOBILE_PAYMENTS_MESSAGE);
      return;
    }
    setCheckoutLoading(true);
    setError("");
    try {
      const response = await api.post(`/public/billing/subscription-invites/${encodeURIComponent(token)}/checkout`, {});
      if (response.data?.url || response.data?.status_url) {
        trackGAEvent("checkout_started", {
          checkout_type: "payment_invite",
          plan_key: preview?.plan_key || "unknown",
          billing_interval: preview?.billing_interval || "unknown",
        });
      }
      if (response.data?.url) window.location.assign(response.data.url);
      else if (response.data?.status_url) window.location.assign(response.data.status_url);
      else setError(t("billing.publicInvite.checkoutUnavailable"));
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === "subscription_recovery_required") setError(t("billing.publicInvite.recoveryRequired"));
      else if (String(code || "").startsWith("invitation_")) setError(t("billing.publicInvite.noLongerAvailable"));
      else setError(err?.response?.data?.message || t("billing.publicInvite.checkoutError"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const activated = state === "trialing" || state === "active";
  const unavailable = ["failed", "expired", "revoked", "invalid"].includes(state);
  const intervalLabel = preview?.billing_interval === "annual" ? t("billing.publicInvite.year") : t("billing.publicInvite.month");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7ff", py: { xs: 5, md: 10 } }}>
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4, boxShadow: "0 20px 60px rgba(29, 54, 105, 0.14)" }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>{t("billing.publicInvite.brand")}</Typography>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 900, mt: 0.5 }}>
                  {activated ? t("billing.publicInvite.activatedTitle") : t("billing.publicInvite.activateTitle")}
                </Typography>
              </Box>
              {loading && <CircularProgress aria-label={t("billing.publicInvite.loading")} />}
              {error && <Alert severity="error">{error}</Alert>}
              {!loading && preview && (
                <Stack spacing={2}>
                  <Typography variant="h6">{preview.company_name}</Typography>
                  <Typography>
                    <strong>{preview.plan_name}</strong> · {preview.billing_interval}
                    {preview.price?.display ? ` · ${preview.price.display}/${intervalLabel}` : ""}
                  </Typography>
                  {preview.trial_days > 0 && !activated && (
                    <Alert severity="info">
                      {t("billing.publicInvite.trialEligible", { days: preview.trial_days })}
                    </Alert>
                  )}
                  {activated && (
                    <Alert severity="success">
                      {state === "trialing"
                        ? t("billing.publicInvite.trialActivated")
                        : t("billing.publicInvite.activeActivated")}
                    </Alert>
                  )}
                  {successView && !activated && !unavailable && (
                    <Alert severity="info" icon={<CircularProgress size={18} />}>
                      {t("billing.publicInvite.processing")}
                    </Alert>
                  )}
                  {unavailable && <Alert severity="warning">{t("billing.publicInvite.unavailable", { state })}</Alert>}
                  {!successView && !activated && !unavailable && (
                    <Button variant="contained" size="large" onClick={startCheckout} disabled={checkoutLoading || mobileComplianceMode}>
                      {checkoutLoading ? t("billing.publicInvite.openingCheckout") : t("billing.publicInvite.continue")}
                    </Button>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {t("billing.publicInvite.securityNotice")}
                  </Typography>
                  {activated && (
                    <Typography variant="body2" color="text.secondary">
                      {t("billing.publicInvite.completeNotice")}
                    </Typography>
                  )}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default SubscriptionPaymentInvitePage;
