// src/ManagerDashboard.js
import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useParams } from "react-router-dom";
import NewManagementDashboard from "./NewManagementDashboard";

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

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
      <NewManagementDashboard token={token} initialView={initialView} />
    </Box>
  );
}
