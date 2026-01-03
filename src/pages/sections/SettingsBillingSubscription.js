import React from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import SectionCard from "../../components/ui/SectionCard";
import useBillingStatus from "../../components/billing/useBillingStatus";
import { openBillingPortal } from "../../components/billing/billingHelpers";

const planLabel = (key) => {
  const map = { starter: "Starter", pro: "Pro", business: "Business" };
  return map[String(key || "").toLowerCase()] || "Starter";
};

const formatDate = (value) => {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "N/A";
  }
};

const SettingsBillingSubscription = () => {
  const { status, loading, error } = useBillingStatus();
  const seatAllowed = Number(status?.seats_allowed || 0);
  const seatIncluded = Number(status?.seats_included || 0);
  const seatAddon = Number(status?.seats_addon_qty || 0);
  const activeStaff = Number(status?.active_staff_count || 0);

  const handleAddSeats = () => {
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

  return (
    <Box>
      <SectionCard
        title="Billing & subscription"
        subtitle="Track your plan, trial, and billing status in one place."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" onClick={() => openBillingPortal()}>
              Manage Billing
            </Button>
            <Button size="small" variant="outlined" onClick={() => (window.location.href = "/pricing")}>
              View Plans
            </Button>
            <Button size="small" variant="contained" onClick={handleAddSeats}>
              Add Seats
            </Button>
          </Stack>
        }
      >
        {loading && <Typography variant="body2">Loading billing status…</Typography>}
        {!loading && error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
        {!loading && !error && status && (
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>Plan:</strong> {planLabel(status.plan_key)}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {status.status || "inactive"}
              </Typography>
              <Typography variant="body2">
                <strong>Subscription:</strong> {status.subscription_state || "none"}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>Trial ends:</strong> {formatDate(status.trial_end)}
              </Typography>
              <Typography variant="body2">
                <strong>Next billing date:</strong> {formatDate(status.next_billing_date)}
              </Typography>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>Seats included:</strong> {seatIncluded}
              </Typography>
              <Typography variant="body2">
                <strong>Addon seats:</strong> {seatAddon}
              </Typography>
              <Typography variant="body2">
                <strong>Total allowed:</strong> {seatAllowed}
              </Typography>
              <Typography variant="body2">
                <strong>Active staff:</strong> {activeStaff}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {status.latest_invoice_url && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => window.open(status.latest_invoice_url, "_blank", "noopener")}
                >
                  View last invoice
                </Button>
              )}
              <Button size="small" variant="text" onClick={() => openBillingPortal()}>
                Cancel subscription
              </Button>
            </Stack>
          </Stack>
        )}
      </SectionCard>
    </Box>
  );
};

export default SettingsBillingSubscription;
