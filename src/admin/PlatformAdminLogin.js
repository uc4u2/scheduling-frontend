import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import platformAdminApi from "../api/platformAdminApi";

export default function PlatformAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await platformAdminApi.post("/auth/login", { email, password });
      if (data?.mfa_required && data?.challenge_id) {
        setChallengeId(data.challenge_id);
        setNotice("We emailed you a sign-in code.");
      } else {
        setError("Login failed.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const verifyLoginCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await platformAdminApi.post("/auth/login/verify", { email, challenge_id: challengeId, code: loginCode });
      if (!data?.token) throw new Error("Login failed.");
      localStorage.setItem("platformAdminToken", data.token);
      navigate("/admin/search");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Login failed.");
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
        <Box component="form" onSubmit={challengeId ? verifyLoginCode : submit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={Boolean(challengeId)}
            />
            {!challengeId ? (
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            ) : (
              <TextField
                label="Email sign-in code"
                inputMode="numeric"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                required
                autoFocus
              />
            )}
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Signing in..." : challengeId ? "Verify code" : "Sign in"}
            </Button>
            {challengeId ? (
              <Button
                variant="text"
                disabled={loading}
                onClick={async () => {
                  setError("");
                  try {
                    const { data } = await platformAdminApi.post("/auth/login/resend", {
                      email,
                      challenge_id: challengeId,
                    });
                    if (data?.challenge_id) setChallengeId(data.challenge_id);
                    setNotice("A new sign-in code was emailed.");
                  } catch (err) {
                    setError(err?.response?.data?.error || "Unable to resend the code.");
                  }
                }}
              >
                Resend code
              </Button>
            ) : null}
            <Button variant="text" onClick={() => setForgotOpen(true)}>
              Forgot password?
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reset platform admin password</DialogTitle>
        <DialogContent>
          <TextField
            label="Email"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              await platformAdminApi.post("/auth/forgot", { email: forgotEmail });
              setForgotOpen(false);
              setNotice("If the account exists, an email has been sent.");
            }}
          >
            Send reset link
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={() => setNotice("")}
        message={notice}
      />
    </Container>
  );
}
