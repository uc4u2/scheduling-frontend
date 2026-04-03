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
import { buildTenantDashboardPath, buildTenantLoginPath, persistTenantSlug, resolveTenantSlug } from "../utils/clientTenant";

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

export default function ClientDashboard() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardSurface = "var(--page-card-bg, var(--checkout-card-bg, #ffffff))";
  const dashboardText = "var(--page-body-color, #111827)";
  const dashboardBorder = "var(--page-border-color, rgba(15,23,42,0.12))";
  const tenantSlug = resolveTenantSlug({ search: location.search });

  // Restrict page to clients only
  useEffect(() => {
    if (tenantSlug) persistTenantSlug(tenantSlug);
    const token = localStorage.getItem("token");
    if (getRoleFromToken(token) !== "client") {
      navigate(buildTenantLoginPath(tenantSlug));
      return;
    }
    // Optionally, set tab by URL hash
    const hash = window.location.hash.toLowerCase();
    if (tabHashMap.hasOwnProperty(hash)) {
      setTab(tabHashMap[hash]);
    }
  }, [navigate, tenantSlug]);

  const handleTabChange = (_, value) => {
    if (value === LOGOUT_TAB_INDEX) {
      localStorage.removeItem("token");
      localStorage.removeItem("clientToken");
      localStorage.removeItem("role");
      const params = new URLSearchParams(window.location.search);
      const siteSlug = params.get("site");
      if (params.get("page") === "my-bookings") {
        window.location.assign(buildTenantDashboardPath(tenantSlug, { page: "my-bookings" }));
        return;
      }
      if (siteSlug || tenantSlug) {
        window.location.assign(`/${siteSlug || tenantSlug}?page=my-bookings`);
      } else {
        navigate(buildTenantLoginPath(tenantSlug));
      }
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
        {tab === 1 && <ClientBookings />}
        {tab === 2 && <ClientPackages />}
        {tab === 3 && <ClientNotifications />}
        {tab === 4 && <ClientProfile />}
      </Box>
    </Box>
  );
}
