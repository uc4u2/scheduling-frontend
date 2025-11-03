// src/pages/client/PublicMyBookings.js
import React from "react";
import { Box, Button, Typography, Paper, Stack } from "@mui/material";
import { useParams } from "react-router-dom";
import ClientBookings from "./ClientBookings";
import PublicPageShell from "./PublicPageShell";

export default function PublicMyBookings() {
  const { slug } = useParams();
  const token =
    typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";

  const content = !token ? (
    <Box sx={{ maxWidth: 560, mx: "auto", mt: 6 }}>
      <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>My Bookings</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Please sign in to view your bookings and manage appointments.
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="contained" href={`/login`}>Login</Button>
        </Stack>
      </Paper>
    </Box>
  ) : (
    <ClientBookings />
  );

  return <PublicPageShell activeKey="__mybookings">{content}</PublicPageShell>;
}
