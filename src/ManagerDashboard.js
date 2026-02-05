// src/ManagerDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useParams } from "react-router-dom";
import NewManagementDashboard from "./NewManagementDashboard";
import useBillingStatus from "./components/billing/useBillingStatus";

export default function ManagerDashboard({ token }) {
  const theme = useTheme();
  const location = useLocation();
  const routeParams = useParams();
  const searchParams = new URLSearchParams(location.search);
  const pathView = location.pathname.startsWith("/manager/")
    ? location.pathname.split("/")[2]
    : null;
  const initialView =
    routeParams.view ||
    (pathView && pathView !== "dashboard" ? pathView : null) ||
    searchParams.get("view") ||
    "__landing__";

  const [billingRefreshPending, setBillingRefreshPending] = useState(() => {
    try {
      return window.sessionStorage.getItem("billing_refresh_pending") === "1";
    } catch (e) {
      return false;
    }
  });
  const [billingSyncing, setBillingSyncing] = useState(false);
  const { status: billingStatus, loading: billingLoading, refetch: refetchBilling } =
    useBillingStatus();

  useEffect(() => {
    if (!billingRefreshPending) return;
    setBillingSyncing(true);
    refetchBilling({ forceSync: true })
      .catch(() => null)
      .finally(() => {
        setBillingSyncing(false);
        setBillingRefreshPending(false);
        try {
          window.sessionStorage.removeItem("billing_refresh_pending");
        } catch (e) {}
      });
  }, [billingRefreshPending, refetchBilling]);

  const showBillingGate = useMemo(() => {
    if (!billingRefreshPending) return false;
    return billingSyncing || billingLoading || !billingStatus;
  }, [billingRefreshPending, billingSyncing, billingLoading, billingStatus]);

  if (showBillingGate) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
        <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
          <CircularProgress size={36} />
          <Typography variant="h6" fontWeight={600}>
            Confirming billing…
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We’re activating your subscription. This usually takes a few seconds.
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
      <NewManagementDashboard token={token} initialView={initialView} />
    </Box>
  );
}
