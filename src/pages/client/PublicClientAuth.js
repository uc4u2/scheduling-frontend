import React, { useMemo, useState } from "react";
import axios from "axios";
import {
  Box, Paper, Stack, Typography, TextField, Button, Alert, Tabs, Tab
} from "@mui/material";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function PublicClientAuth({ slug }) {
  const [tab, setTab] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // register form
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const finish = (token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", "client");
    // Optional: persist company scope if your APIs expect it
    // localStorage.setItem("company_id", "<set if you scope to a company>");
    window.location.assign(`/${slug}/my-bookings`);
  };

  const doLogin = async () => {
    setError(""); setBusy(true);
    try {
      const { data } = await axios.post(`${API}/login`, {
        email, password, role: "client", timezone: tz
      });
      if (!data?.access_token) throw new Error("No token");
      finish(data.access_token);
    } catch (e) {
      setError(e?.response?.data?.error || "Login failed.");
    } finally { setBusy(false); }
  };

  const doRegister = async () => {
    setError(""); setBusy(true);
    try {
      await axios.post(`${API}/register`, {
        first_name: first, last_name: last, email, password, timezone: tz, role: "client"
      });
      // auto-login for convenience
      const { data } = await axios.post(`${API}/login`, {
        email, password, role: "client", timezone: tz
      });
      if (!data?.access_token) throw new Error("No token");
      finish(data.access_token);
    } catch (e) {
      setError(e?.response?.data?.error || "Registration failed.");
    } finally { setBusy(false); }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 6 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>Client Account</Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="login" label="Login" />
          <Tab value="register" label="Sign Up" />
        </Tabs>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          {tab === "register" && (
            <Stack direction="row" spacing={1}>
              <TextField label="First" value={first} onChange={e=>setFirst(e.target.value)} fullWidth />
              <TextField label="Last"  value={last}  onChange={e=>setLast(e.target.value)}  fullWidth />
            </Stack>
          )}
          <TextField label="Email"    type="email"    value={email}    onChange={e=>setEmail(e.target.value)} fullWidth />
          <TextField label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} fullWidth />
          {tab === "login" ? (
            <Button variant="contained" onClick={doLogin} disabled={busy}>
              {busy ? "Logging in..." : "Login"}
            </Button>
          ) : (
            <Button variant="contained" onClick={doRegister} disabled={busy}>
              {busy ? "Creating account..." : "Create account"}
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
