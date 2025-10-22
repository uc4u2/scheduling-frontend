// src/ManagerDashboard.js
import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NewManagementDashboard from "./NewManagementDashboard";

export default function ManagerDashboard({ token }) {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
      <NewManagementDashboard token={token} initialView="__landing__" />
    </Box>
  );
}
