// src/ForgotPassword.js
import React, { useState } from "react";
import { Button, Alert, Typography, TextField, Stack, Link as MuiLink } from "@mui/material";
import { Link as RouterLink, useLocation, useParams } from "react-router-dom";
import { api } from "./utils/api";
import AuthCardShell, { authButtonSx, authInputSx } from "./components/auth/AuthCardShell";

const ForgotPassword = ({ slugOverride = "" }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const params = useParams();
  const search = new URLSearchParams(location.search || "");
  const querySite = (search.get("site") || "").trim();
  const storedSite =
    typeof localStorage !== "undefined" ? (localStorage.getItem("site") || "").trim() : "";
  const tenantSite =
    String(slugOverride || "").trim() ||
    String(params.slug || "").trim() ||
    querySite ||
    storedSite;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!email) {
      setError("Email is required");
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post(
        "/forgot-password",
        { email, company_slug: tenantSite || undefined },
        { noAuth: true, noCompanyHeader: true }
      );
      setMessage(response.data.message);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Request failed!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardShell
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email address tied to your account and we will send you a reset link."
      heroTitle="Recover access without losing momentum."
      heroSubtitle="Schedulaa keeps account recovery simple so your bookings, team access, and business operations stay moving."
    >
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit} noValidate>
        <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1.2 }}>
          Password recovery
        </Typography>
        <TextField
          label="Email"
          fullWidth
          sx={authInputSx}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          inputProps={{ inputMode: "email", autoCapitalize: "none" }}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={submitting}
          sx={authButtonSx}
        >
          {submitting ? "Sending reset link..." : "Send reset email"}
        </Button>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={0.75}
          justifyContent="center"
          alignItems="center"
          sx={{
            pt: 1,
            borderTop: "1px solid rgba(226,232,240,0.9)",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Remembered your password?
          </Typography>
          <MuiLink
            component={RouterLink}
            to={tenantSite ? `/login?site=${encodeURIComponent(tenantSite)}` : "/login"}
            underline="hover"
            sx={{ fontWeight: 700 }}
          >
            Back to sign in
          </MuiLink>
        </Stack>
      </Stack>
    </AuthCardShell>
  );
};

export default ForgotPassword;
