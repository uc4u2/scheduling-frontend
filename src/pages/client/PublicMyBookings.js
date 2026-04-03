// src/pages/client/PublicMyBookings.js
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { useLocation, useParams } from "react-router-dom";
import ClientBookings from "./ClientBookings";
import PublicPageShell from "./PublicPageShell";
import PublicClientAuth from "./PublicClientAuth";

export default function PublicMyBookings({ slug: slugOverride = "" }) {
  const { slug: routeSlug } = useParams();
  const location = useLocation();
  const qs = new URLSearchParams(location.search || "");
  const slug = String(slugOverride || "").trim() || String(routeSlug || "").trim() || (qs.get("site") || "").trim();
  const storedSite =
    typeof localStorage !== "undefined" ? (localStorage.getItem("site") || "").trim() : "";
  const token =
    typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
  const role =
    typeof localStorage !== "undefined" ? localStorage.getItem("role") : "";
  const tenantMatches = !slug || !storedSite || storedSite === slug;
  const clientLoggedIn = Boolean(token && role === "client" && tenantMatches);

  const content = !clientLoggedIn ? (
    <Box sx={{ maxWidth: 560, mx: "auto", mt: 6 }}>
      <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>My Bookings</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {token && role === "client" && !tenantMatches
            ? "Please sign in again for this business to view and manage your bookings."
            : "Please sign in to view your bookings and manage appointments."}
        </Typography>
        <PublicClientAuth slug={slug} />
      </Paper>
    </Box>
  ) : (
    <ClientBookings />
  );

  return <PublicPageShell activeKey="__mybookings">{content}</PublicPageShell>;
}
