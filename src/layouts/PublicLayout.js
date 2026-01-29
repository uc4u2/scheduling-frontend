import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Footer from "../components/Footer";

const PublicLayout = ({ token, setToken }) => (
  <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
    <Box component="main" sx={{ flex: 1 }}>
      <Outlet />
    </Box>
    <Footer />
  </Box>
);

export default PublicLayout;
