// src/pages/ClientDashboard.js

import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import ClientDashboardOverview from "./client/ClientDashboardOverview";
import ClientBookings from "./client/ClientBookings";
import ClientProfile from "./client/ClientProfile";
import ClientNotifications from "./client/ClientNotifications";
import ClientPackages from "./client/ClientPackages";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

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

  // Restrict page to clients only
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (getRoleFromToken(token) !== "client") {
      navigate("/login");
      return;
    }
    // Optionally, set tab by URL hash
    const hash = window.location.hash.toLowerCase();
    if (tabHashMap.hasOwnProperty(hash)) {
      setTab(tabHashMap[hash]);
    }
  }, [navigate]);

  const handleTabChange = (_, value) => {
    if (value === LOGOUT_TAB_INDEX) {
      localStorage.removeItem("token");
      localStorage.removeItem("clientToken");
      localStorage.removeItem("role");
      const params = new URLSearchParams(window.location.search);
      const siteSlug = params.get("site");
      if (siteSlug) {
        window.location.assign("/?page=my-bookings");
      } else {
        navigate("/login");
      }
      return;
    }
    setTab(value);
  };

  return (
    <Box sx={{
      width: "100%",
      minHeight: "100vh",
      bgcolor: "background.default",
      pt: { xs: 6, sm: 8 } // space for AppBar
    }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
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
      <Box sx={{ p: { xs: 1, sm: 3 } }}>
        {tab === 0 && <ClientDashboardOverview />}
        {tab === 1 && <ClientBookings />}
        {tab === 2 && <ClientPackages />}
        {tab === 3 && <ClientNotifications />}
        {tab === 4 && <ClientProfile />}
      </Box>
    </Box>
  );
}
