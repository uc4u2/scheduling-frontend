import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useBillingStatus from "./useBillingStatus";
import { useBillingBanner } from "./BillingBannerContext";
import api from "../../utils/api";

const planLabel = (key) => {
  const map = { starter: "Starter", pro: "Pro", business: "Business" };
  return map[String(key || "").toLowerCase()] || "Pro";
};

const GlobalBillingBanner = () => {
  const BILLING_SETTINGS_URL = "/manager/settings?tab=billing";
  const MARKETING_PRICING_URL = "https://www.schedulaa.com/en/pricing?from=app";
  const theme = useTheme();
  const hideOnSmallScreens = useMediaQuery(theme.breakpoints.down("md"));
  const { status } = useBillingStatus();
  const { setVisible } = useBillingBanner();
  const [dismissed, setDismissed] = useState(false);

  const banner = useMemo(() => {
    if (!status) return null;
    if (dismissed) return null;
    const state = status.subscription_state || status.status;
    if (status.error === "mode_mismatch") {
      return {
        severity: "warning",
        message:
          status.message ||
          "Billing data was created in test mode. Please start your plan again to activate live billing.",
        action: "start_plan",
      };
    }
    if (state === "none" || state === "inactive" || state === "canceled") {
      return {
        severity: "warning",
        message: status.message || "No active subscription. Start a plan to unlock billing features.",
        action: "start_plan",
      };
    }
    if (status.in_grace || state === "past_due" || state === "unpaid") {
      return {
        severity: "warning",
        message: "Payment issue detected. Update your payment method to avoid interruptions.",
        action: "update_payment",
      };
    }
    return null;
  }, [status, dismissed]);

  useEffect(() => {
    setVisible(Boolean(banner));
  }, [banner, setVisible]);

  if (!banner || hideOnSmallScreens) return null;

  const actions = (
    <Stack direction="row" spacing={1}>
      {banner.action === "update_payment" && (
        <Button color="inherit" size="small" onClick={() => (window.location.href = BILLING_SETTINGS_URL)}>
          Update payment
        </Button>
      )}
      {banner.action === "start_plan" && (
        <Button color="inherit" size="small" onClick={() => (window.location.href = BILLING_SETTINGS_URL)}>
          Start plan
        </Button>
      )}
      {banner.action === "start_plan" && (
        <Button color="inherit" size="small" onClick={() => (window.location.href = MARKETING_PRICING_URL)}>
          Choose a plan
        </Button>
      )}
      {status?.error !== "mode_mismatch" && (
        <Button color="inherit" size="small" onClick={() => (window.location.href = BILLING_SETTINGS_URL)}>
          Manage billing
        </Button>
      )}
    </Stack>
  );

  return (
    <Alert
      severity={banner.severity}
      sx={{ mb: 2 }}
      action={actions}
      onClose={async () => {
        setDismissed(true);
        setVisible(false);
        if (status?.error === "mode_mismatch") {
          try {
            await api.post("/billing/reset-stripe-state");
          } catch (err) {
            // Swallow reset failures to avoid blocking dismissal.
          }
        }
      }}
    >
      {banner.message}
      {banner.action === "start_plan" && status?.plan_key && (
        <>
          {" "}
          Current plan: {planLabel(status.plan_key)}.
        </>
      )}
    </Alert>
  );
};

export default GlobalBillingBanner;
