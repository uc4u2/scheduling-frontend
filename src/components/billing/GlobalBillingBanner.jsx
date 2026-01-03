import React, { useEffect, useMemo } from "react";
import { Alert, Button, Stack } from "@mui/material";
import useBillingStatus from "./useBillingStatus";
import { openBillingPortal } from "./billingHelpers";
import { useBillingBanner } from "./BillingBannerContext";

const planLabel = (key) => {
  const map = { starter: "Starter", pro: "Pro", business: "Business" };
  return map[String(key || "").toLowerCase()] || "Pro";
};

const GlobalBillingBanner = () => {
  const { status } = useBillingStatus();
  const { setVisible } = useBillingBanner();

  const banner = useMemo(() => {
    if (!status) return null;
    const state = status.subscription_state || status.status;
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
  }, [status]);

  useEffect(() => {
    setVisible(Boolean(banner));
  }, [banner, setVisible]);

  if (!banner) return null;

  const actions = (
    <Stack direction="row" spacing={1}>
      {banner.action === "update_payment" && (
        <Button color="inherit" size="small" onClick={() => openBillingPortal()}>
          Update payment
        </Button>
      )}
      {banner.action === "start_plan" && (
        <Button color="inherit" size="small" onClick={() => (window.location.href = "/pricing")}>
          Start plan
        </Button>
      )}
      <Button color="inherit" size="small" onClick={() => openBillingPortal()}>
        Manage billing
      </Button>
    </Stack>
  );

  return (
    <Alert severity={banner.severity} sx={{ mb: 2 }} action={actions}>
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
