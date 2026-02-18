import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Stack, Typography } from "@mui/material";
import { openBillingPortal } from "./billingHelpers";

const PLAN_LABELS = {
  pro: "Pro",
  business: "Business",
};

const UpgradeRequiredModal = ({ open, requiredPlan, message, action, onClose }) => {
  const BILLING_SETTINGS_URL = "/manager/settings?tab=billing";
  const MARKETING_PRICING_URL = "https://www.schedulaa.com/en/pricing?from=app";
  const planLabel = PLAN_LABELS[requiredPlan] || "Pro";
  const detail = message || `This feature requires the ${planLabel} plan.`;

  const handlePortal = async () => {
    if (onClose) onClose();
    try {
      await openBillingPortal();
    } catch {
      window.location.href = BILLING_SETTINGS_URL;
    }
  };

  const handleStartPlan = () => {
    if (onClose) onClose();
    window.location.href = BILLING_SETTINGS_URL;
  };

  const handleViewPlans = () => {
    if (onClose) onClose();
    window.location.href = MARKETING_PRICING_URL;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Upgrade required</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="body1">
            {detail}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {action === "start_plan"
              ? "Start a plan to unlock this feature."
              : "Upgrade your subscription to unlock this feature."}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="outlined" onClick={handleViewPlans}>
          View plans
        </Button>
        <Button
          variant="contained"
          onClick={action === "start_plan" ? handleStartPlan : handlePortal}
        >
          {action === "start_plan" ? "Start plan" : "Upgrade"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeRequiredModal;
