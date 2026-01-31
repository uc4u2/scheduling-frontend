import React, { useState } from "react";
import { Box, Button, Container, Paper, Stack, TextField, Typography, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import platformAdminApi from "../api/platformAdminApi";

export default function PlatformAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await platformAdminApi.post("/auth/login", { email, password });
      if (data?.token) {
        localStorage.setItem("platformAdminToken", data.token);
        navigate("/admin/search");
      } else {
        setError("Login failed.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Platform Admin Login
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
