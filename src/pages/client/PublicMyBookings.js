// src/pages/client/PublicMyBookings.js
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import ClientBookings from "./ClientBookings";
import PublicPageShell from "./PublicPageShell";
import PublicClientAuth from "./PublicClientAuth";

export default function PublicMyBookings() {
  const { slug } = useParams();
  const token =
    typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
  const role =
    typeof localStorage !== "undefined" ? localStorage.getItem("role") : "";
  const clientLoggedIn = Boolean(token && role === "client");

  const content = !clientLoggedIn ? (
    <Box sx={{ maxWidth: 560, mx: "auto", mt: 6 }}>
      <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>My Bookings</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Please sign in to view your bookings and manage appointments.
        </Typography>
        <PublicClientAuth slug={slug} />
      </Paper>
    </Box>
  ) : (
    <ClientBookings />
  );

  return <PublicPageShell activeKey="__mybookings">{content}</PublicPageShell>;
}
