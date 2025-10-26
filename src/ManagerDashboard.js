// src/ManagerDashboard.js
import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation } from "react-router-dom";
import NewManagementDashboard from "./NewManagementDashboard";

export default function ManagerDashboard({ token }) {
  const theme = useTheme();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialView = params.get("view") || "__landing__";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
      <NewManagementDashboard token={token} initialView={initialView} />
    </Box>
  );
}
