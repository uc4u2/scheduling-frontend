import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { openBillingPortal } from "./billingHelpers";

const PLAN_LABELS = {
  pro: "Pro",
  business: "Business",
};

const UpgradeRequiredModal = ({ open, requiredPlan, onClose }) => {
  const navigate = useNavigate();
  const planLabel = PLAN_LABELS[requiredPlan] || "Pro";

  const handlePortal = async () => {
    try {
      await openBillingPortal();
    } catch {
      navigate("/pricing");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Upgrade required</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="body1">
            This feature requires the {planLabel} plan.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upgrade your subscription to unlock this feature.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="outlined" onClick={() => navigate("/pricing")}>
          View plans
        </Button>
        <Button variant="contained" onClick={handlePortal}>
          Upgrade
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeRequiredModal;
