import React, { useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import platformAdminApi from "../api/platformAdminApi";

export default function PlatformAdminResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    setError("");
    const token = params.get("token") || "";
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await platformAdminApi.post("/auth/reset", { token, new_password: password });
      setSuccess(true);
    } catch (err) {
      const msg = err?.response?.data?.error || "Reset failed.";
      setError(msg);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <Paper sx={{ p: 4, width: 420, maxWidth: "90%" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Reset platform admin password
        </Typography>
        {success ? (
          <Stack spacing={2}>
            <Alert severity="success">
              Your password has been updated. You can now log in to the Platform Admin.
            </Alert>
            <Button variant="contained" onClick={() => navigate("/admin/login")}>
              Go to admin login
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {error && <Typography color="error">{error}</Typography>}
            <Button variant="contained" onClick={submit}>Reset password</Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
