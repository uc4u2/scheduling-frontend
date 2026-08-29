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

function withPresentationQuery(path, search) {
  const source = new URLSearchParams(search || "");
  const [pathname, rawQuery = ""] = String(path || "").split("?");
  const query = new URLSearchParams(rawQuery);
  ["embed", "mode", "dialog", "site", "primary", "text", "return_to", "returnTo"].forEach((key) => {
    if (source.has(key)) query.set(key, source.get(key));
  });
  return query.toString() ? `${pathname}?${query.toString()}` : pathname;
}

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
    // CompanyPublic, the established public client entry, treats the stored
    // role as the session authority after a successful client login. Keep the
    // dashboard gate compatible with that contract as some valid legacy
    // client tokens do not expose a top-level role claim.
    const storedRole = String(localStorage.getItem("role") || "").toLowerCase();
    const isClientSession = storedRole === "client" || getRoleFromToken(token) === "client";
    if (!isClientSession) {
      window.parent?.postMessage({ type: "schedulaa:client-session", signedIn: false }, "*");
      navigate(withPresentationQuery(buildTenantLoginPath(tenantSlug), location.search));
      return;
    }
    window.parent?.postMessage({ type: "schedulaa:client-session", signedIn: true }, "*");
    // Optionally, set tab by URL hash
    const hash = window.location.hash.toLowerCase();
    if (tabHashMap.hasOwnProperty(hash)) {
      setTab(tabHashMap[hash]);
    }
  }, [location.search, navigate, tenantSlug]);

  const handleTabChange = (_, value) => {
    if (value === LOGOUT_TAB_INDEX) {
      localStorage.removeItem("token");
      localStorage.removeItem("clientToken");
      localStorage.removeItem("role");
      window.parent?.postMessage({ type: "schedulaa:client-session", signedIn: false }, "*");
      const params = new URLSearchParams(window.location.search);
      const siteSlug = params.get("site");
      // A Next public page frames this dashboard with embed=1. Keep logout
      // inside the tenant-scoped client-auth surface so it does not fall back
      // to the legacy public page/header.
      if (params.get("embed") === "1" && (siteSlug || tenantSlug)) {
        const tenant = siteSlug || tenantSlug;
        const loginParams = new URLSearchParams();
        ["mode", "dialog", "primary", "text", "return_to", "returnTo"].forEach((key) => {
          if (params.has(key)) loginParams.set(key, params.get(key));
        });
        loginParams.set("site", tenant);
        loginParams.set("client", "1");
        loginParams.set("embed", "1");
        loginParams.set("dialog", "1");
        window.location.assign(
          `/login?${loginParams.toString()}`,
        );
        return;
      }
      if (params.get("page") === "my-bookings") {
        window.location.assign(buildTenantDashboardPath(tenantSlug, { page: "my-bookings" }));
        return;
      }
      if (siteSlug || tenantSlug) {
        window.location.assign(`/${siteSlug || tenantSlug}?page=my-bookings`);
      } else {
        navigate(withPresentationQuery(buildTenantLoginPath(tenantSlug), location.search));
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
