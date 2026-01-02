import React from "react";
import { Alert, Button, Stack } from "@mui/material";
import useBillingStatus from "./useBillingStatus";
import { openBillingPortal } from "./billingHelpers";

const PLAN_RANK = { starter: 0, pro: 1, business: 2 };

const UpgradeNoticeBanner = ({ requiredPlan = "pro", message }) => {
  const { status } = useBillingStatus();
  const planKey = status?.plan_key || "starter";
  const needsUpgrade =
    PLAN_RANK[planKey] < (PLAN_RANK[requiredPlan] ?? 0) ||
    (status?.status && !["active", "trialing"].includes(status.status));

  if (!needsUpgrade) return null;

  return (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Stack direction="row" spacing={1}>
          <Button color="inherit" size="small" onClick={() => openBillingPortal()}>
            Upgrade
          </Button>
          <Button color="inherit" size="small" onClick={() => (window.location.href = "/pricing")}>
            View plans
          </Button>
        </Stack>
      }
    >
      {message}
    </Alert>
  );
};

export default UpgradeNoticeBanner;
