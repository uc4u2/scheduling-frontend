import React, { useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import salesRepApi from "../api/salesRepApi";

export default function SalesLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    try {
      const { data } = await salesRepApi.post("/auth/login", { email, password });
      if (data?.token) {
        localStorage.setItem("salesRepToken", data.token);
        navigate("/sales/summary");
      }
    } catch (err) {
      setError("Invalid login. Please try again.");
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Sales Rep Login</Typography>
        <Stack spacing={2}>
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <Typography color="error">{error}</Typography>}
          <Button variant="contained" onClick={handleLogin}>Login</Button>
          <Typography variant="body2">
            <Link to="/sales/forgot">Forgot password?</Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
