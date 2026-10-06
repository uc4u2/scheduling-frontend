// src/pages/ClientDashboard.js

import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import ClientDashboardOverview from "./client/ClientDashboardOverview";
import ClientBookings from "./client/ClientBookings";
import ClientProfile from "./client/ClientProfile";
import ClientNotifications from "./client/ClientNotifications";
import ClientPackages from "./client/ClientPackages";
import { jwtDecode } from "jwt-decode";
import { useLocation, useNavigate } from "react-router-dom";
import { persistTenantSlug, resolveTenantSlug } from "../utils/clientTenant";
import {
  buildClientLoginTarget,
  CLIENT_SESSION_STATE_EVENT,
  publishClientSessionState,
} from "../utils/clientSession";
import { parseClientOrderDestination } from "../utils/transactionalFrameBridge";

// Tab names for display and logic
const tabLabels = [
  "Overview",
  "Bookings",
  "Packages",
  "Notifications",
  "Profile",
  "Logout"
];

// Map for hash navigation
const tabHashMap = {
  "#overview": 0,
  "#bookings": 1,
  "#packages": 2,
  "#notifications": 3,
  "#profile": 4,
};

const LOGOUT_TAB_INDEX = 5;

function getRoleFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    if (decoded.identity?.startsWith("client:")) return "client";
    if (decoded.role) return decoded.role;
  } catch (e) {}
  return null;
}

export default function ClientDashboard({ tenantSlug: explicitTenantSlug = "" }) {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardSurface = "var(--page-card-bg, var(--checkout-card-bg, #ffffff))";
  const dashboardText = "var(--page-body-color, #111827)";
  const dashboardBorder = "var(--page-border-color, rgba(15,23,42,0.12))";
  const tenantSlug = resolveTenantSlug({ explicitSlug: explicitTenantSlug, search: location.search });

  // Restrict page to clients only
  useEffect(() => {
    if (tenantSlug) persistTenantSlug(tenantSlug);
    const token = localStorage.getItem("token");
    // CompanyPublic, the established public client entry, treats the stored
    // role as the session authority after a successful client login. Keep the
    // dashboard gate compatible with that contract as some valid legacy
    // client tokens do not expose a top-level role claim.
    const storedRole = String(localStorage.getItem("role") || "").toLowerCase();
    const isClientSession = storedRole === "client" || getRoleFromToken(token) === "client";
    if (!isClientSession) {
      publishClientSessionState(false, { reason: "missing-client-session" });
      navigate(buildClientLoginTarget(tenantSlug, location.search));
      return;
    }
    publishClientSessionState(true, { reason: "active-client-session" });
    // Optionally, set tab by URL hash
    const orderDestination = parseClientOrderDestination(location.search, tenantSlug);
    const hash = window.location.hash.toLowerCase();
    if (orderDestination.requested) {
      setTab(1);
    } else if (tabHashMap.hasOwnProperty(hash)) {
      setTab(tabHashMap[hash]);
    }
  }, [location.search, navigate, tenantSlug]);

  useEffect(() => {
    const onClientSessionState = (event) => {
      if (event?.detail?.signedIn !== false) return;
      window.location.assign(buildClientLoginTarget(tenantSlug, location.search));
    };
    window.addEventListener(CLIENT_SESSION_STATE_EVENT, onClientSessionState);
    return () => window.removeEventListener(CLIENT_SESSION_STATE_EVENT, onClientSessionState);
  }, [location.search, tenantSlug]);

  const handleTabChange = (_, value) => {
    if (value === LOGOUT_TAB_INDEX) {
      localStorage.removeItem("token");
      localStorage.removeItem("clientToken");
      localStorage.removeItem("role");
      publishClientSessionState(false, { reason: "logout" });
      return;
    }
    setTab(value);
  };

  return (
    <Box sx={{
      width: "100%",
      minHeight: "100vh",
      bgcolor: "transparent",
      color: dashboardText,
      pt: { xs: 6, sm: 8 } // space for AppBar
    }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: dashboardBorder,
          bgcolor: dashboardSurface,
          color: dashboardText,
          "& .MuiTab-root": { color: "inherit", opacity: 0.85 },
          "& .MuiTab-root.Mui-selected": { color: "var(--page-btn-bg, #1976d2)", opacity: 1 },
          "& .MuiTabs-indicator": { backgroundColor: "var(--page-btn-bg, #1976d2)" },
        }}
      >
        <Tabs
          value={tab}
          onChange={handleTabChange}
          centered
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabLabels.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Box>
      <Box
        sx={{
          p: { xs: 1, sm: 3 },
          color: dashboardText,
          "& .MuiPaper-root, & .MuiCard-root, & .MuiDialog-paper": {
            backgroundColor: dashboardSurface,
            color: dashboardText,
          },
        }}
      >
        {tab === 0 && <ClientDashboardOverview />}
        {tab === 1 && <ClientBookings tenantSlug={tenantSlug} />}
        {tab === 2 && <ClientPackages />}
        {tab === 3 && <ClientNotifications />}
        {tab === 4 && <ClientProfile />}
      </Box>
    </Box>
  );
}
