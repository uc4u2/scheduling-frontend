import React, { useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import salesRepApi from "../api/salesRepApi";

export default function SalesResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");

  const handleReset = async () => {
    if (password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }
    try {
      await salesRepApi.post("/auth/reset", { token, password });
      setStatus("Password reset. You can now log in.");
    } catch (err) {
      setStatus("Reset failed. Please request a new link.");
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Set a new password</Typography>
        <Stack spacing={2}>
          <TextField label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <TextField label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button variant="contained" onClick={handleReset}>Reset password</Button>
          {status && <Typography variant="body2">{status}</Typography>}
        </Stack>
      </Paper>
    </Box>
  );
}
