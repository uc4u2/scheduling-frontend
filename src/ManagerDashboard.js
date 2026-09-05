// src/ManagerDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useParams } from "react-router-dom";
import NewManagementDashboard from "./NewManagementDashboard";
import useBillingStatus from "./components/billing/useBillingStatus";
import { api } from "./utils/api";
import {
  getSupportWorkspaceContext,
  supportCapabilitiesAllowPanel,
} from "./utils/supportWorkspaceAccess";

export default function ManagerDashboard({ token }) {
  const theme = useTheme();
  const location = useLocation();
  const routeParams = useParams();
  const searchParams = new URLSearchParams(location.search);
  const supportContext = getSupportWorkspaceContext(location.pathname, location.search);
  const pathView = location.pathname.startsWith("/manager/")
    ? location.pathname.split("/")[2]
    : null;
  const initialView =
    supportContext.valid
      ? supportContext.initialView
      : (
    routeParams.view ||
    (pathView && pathView !== "dashboard" ? pathView : null) ||
    searchParams.get("view") ||
    "__landing__"
  );

  const [supportAccess, setSupportAccess] = useState({
    loading: supportContext.valid,
    session: null,
    error: "",
  });

  useEffect(() => {
    if (!supportContext.valid) {
      setSupportAccess({ loading: false, session: null, error: "" });
      return undefined;
    }

    let active = true;
    setSupportAccess({ loading: true, session: null, error: "" });
    api.get("/api/support/sessions/current", {
      noAuth: true,
      headers: {
        "X-Support-Session": supportContext.supportSessionId,
        "X-Company-Id": supportContext.companyId,
      },
    })
      .then(({ data }) => {
        if (!active) return;
        setSupportAccess({ loading: false, session: data?.support_session || null, error: "" });
      })
      .catch((error) => {
        if (!active) return;
        const code = error?.response?.data?.error;
        setSupportAccess({
          loading: false,
          session: null,
          error: code || "support_session_unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [supportContext.companyId, supportContext.supportSessionId, supportContext.valid]);

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

  if (supportContext.valid && supportAccess.loading) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
        <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
          <CircularProgress size={36} />
          <Typography variant="h6" fontWeight={600}>Verifying support access…</Typography>
        </Stack>
      </Box>
    );
  }

  const supportCapabilities = supportAccess.session?.capabilities || [];
  const supportPanelAllowed = supportCapabilitiesAllowPanel(
    supportCapabilities,
    supportContext.panel
  );
  if (supportContext.valid && (supportAccess.error || !supportPanelAllowed)) {
    return (
      <Box sx={{ p: 3, minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
        <Alert severity="error" sx={{ maxWidth: 720, mx: "auto", mt: 8 }}>
          {supportAccess.error
            ? "This support session is no longer active or available. Return to the assigned ticket and start an approved session."
            : "The tenant did not approve access to this management area. Return to the assigned ticket and use an approved workspace link."}
        </Alert>
      </Box>
    );
  }

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
      <NewManagementDashboard
        token={token}
        initialView={initialView}
        supportMode={supportContext.valid}
        supportCapabilities={supportCapabilities}
      />
    </Box>
  );
}
