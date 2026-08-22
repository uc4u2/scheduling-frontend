import React, { useMemo, useState } from "react";
import {
  Box, Paper, Stack, Typography, TextField, Button, Alert, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Link, Checkbox, FormControlLabel
} from "@mui/material";
import { api } from "../../utils/api";
import { getTenantHostMode } from "../../utils/tenant";
import TimezoneSelect from "../../components/TimezoneSelect";
import { formatTimezoneLabel, getUserTimezone } from "../../utils/timezone";
import Meta from "../../components/Meta";
import { buildMarketingLegalUrl } from "../../config/origins";

const renderDetectedTimezoneNotice = (timezone, showManual, onToggle) => (
  <Stack spacing={1} sx={{ mt: 1 }}>
    <Alert severity="info" sx={{ mb: showManual ? 1 : 0 }}>
      Timezone detected automatically: <strong>{formatTimezoneLabel(timezone) || timezone || "UTC"}</strong>
    </Alert>
    <Box>
      <Button size="small" onClick={onToggle}>
        {showManual ? "Hide timezone change" : "Change timezone"}
      </Button>
    </Box>
  </Stack>
);

export default function PublicClientAuth({ slug }) {
  const userAgreementUrl = buildMarketingLegalUrl("/user-agreement");
  const [tab, setTab] = useState(() => (
    typeof window !== "undefined" && new URLSearchParams(window.location.search || "").get("tab") === "register"
      ? "register"
      : "login"
  ));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [showTimezoneSelect, setShowTimezoneSelect] = useState(false);
  const [timezone, setTimezone] = useState(() => getUserTimezone());
  const seoTitle = useMemo(() => {
    const action = tab === "register" ? "Sign Up" : "Login";
    const siteLabel = slug ? `${slug} client account` : "Client account";
    return `${action} | ${siteLabel}`;
  }, [slug, tab]);

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // register form
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const finish = (token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", "client");
    if (slug) localStorage.setItem("site", slug);
    // Next public pages live on a different origin from this legacy iframe.
    // Notify only the presentation shell that a client session now exists;
    // authentication remains entirely in the existing legacy client flow.
    window.parent?.postMessage({ type: "schedulaa:client-session", signedIn: true }, "*");
    const embedded =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search || "").get("embed") === "1";
    const target =
      // A Next transactional bridge frames the established client login.
      // Return to DashboardShellGate, the mounted client-panel route used by
      // the Next bridge, instead of a tenant-prefixed URL that custom-domain
      // public routing can treat as a marketing page.
      embedded && slug
        ? `/dashboard?site=${encodeURIComponent(slug)}&embed=1&dialog=1`
        : getTenantHostMode() === "custom"
        ? "/?page=my-bookings"
        : slug
          ? `/dashboard?site=${encodeURIComponent(slug)}`
          : "/dashboard";
    window.location.assign(target);
  };

  const doLogin = async () => {
    setError(""); setBusy(true);
    try {
      const { data } = await api.post(`/login`, {
        email, password, role: "client", timezone, company_slug: slug || undefined
      }, { noAuth: true, noCompanyHeader: true });
      if (!data?.access_token) throw new Error("No token");
      finish(data.access_token);
    } catch (e) {
      setError(e?.response?.data?.error || "Login failed.");
    } finally { setBusy(false); }
  };

  const doRegister = async () => {
    setError(""); setBusy(true);
    if (!agreedToTerms) {
      setError("You must accept the Schedulaa User Agreement to create an account.");
      setBusy(false);
      return;
    }
    if (!first || !last || !email || !phone || !password) {
      setError("All fields are required.");
      setBusy(false);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      await api.post(`/register`, {
        first_name: first,
        last_name: last,
        email,
        phone,
        password,
        // The established client registration handler requires this exact
        // confirmation field before it creates the account or queues email.
        password_confirm: passwordConfirm,
        timezone,
        role: "client",
        company_slug: slug || undefined,
        agreed_to_terms: true
      }, { noAuth: true, noCompanyHeader: true });
      // auto-login for convenience
      const { data } = await api.post(`/login`, {
        email, password, role: "client", timezone, company_slug: slug || undefined
      }, { noAuth: true, noCompanyHeader: true });
      if (!data?.access_token) throw new Error("No token");
      finish(data.access_token);
    } catch (e) {
      const data = e?.response?.data;
      if (data?.error === "account_exists") {
        setError(
          data?.message ||
            "You already have an account on the Schedulaa platform used by this business. Please log in to continue, or use Forgot password."
        );
      } else {
        const fieldErrors = data?.field_errors;
        const firstFieldError =
          fieldErrors && typeof fieldErrors === "object"
            ? Object.values(fieldErrors).find(Boolean)
            : "";
        setError(firstFieldError || data?.message || data?.error || "Registration failed.");
      }
    } finally { setBusy(false); }
  };

  const doForgotPassword = async () => {
    setForgotError("");
    setForgotMessage("");
    if (!forgotEmail) {
      setForgotError("Email is required.");
      return;
    }
    setForgotBusy(true);
    try {
      const { data } = await api.post(
        "/forgot-password",
        { email: forgotEmail, company_slug: slug || undefined },
        { noAuth: true, noCompanyHeader: true }
      );
      setForgotMessage(data?.message || "Reset email sent.");
    } catch (e) {
      setForgotError(e?.response?.data?.error || "Request failed.");
    } finally {
      setForgotBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 6 }}>
      <Meta title={seoTitle} robots="noindex, nofollow" />
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
          {tab === "register" && (
            <TextField label="Phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} fullWidth />
          )}
          <TextField label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} fullWidth />
          {tab === "register" && (
            <TextField
              label="Confirm password"
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              fullWidth
            />
          )}
          {renderDetectedTimezoneNotice(timezone, showTimezoneSelect, () => setShowTimezoneSelect((prev) => !prev))}
          {showTimezoneSelect ? (
            <TimezoneSelect label="Timezone" value={timezone} onChange={setTimezone} />
          ) : null}
          {tab === "login" && (
            <Box>
              <Link component="button" variant="body2" onClick={() => setForgotOpen(true)}>
                Forgot password?
              </Link>
            </Box>
          )}
          {tab === "register" && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
              }
              label={
                <span>
                  I agree to the{" "}
                  <Link
                    href={userAgreementUrl}
                    target="_blank"
                    rel="noopener"
                  >
                    Schedulaa User Agreement
                  </Link>
                  .
                </span>
              }
            />
          )}
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
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {forgotError && <Alert severity="error" sx={{ mb: 2 }}>{forgotError}</Alert>}
          {forgotMessage && <Alert severity="success" sx={{ mb: 2 }}>{forgotMessage}</Alert>}
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotOpen(false)} disabled={forgotBusy}>
            Close
          </Button>
          <Button variant="contained" onClick={doForgotPassword} disabled={forgotBusy}>
            {forgotBusy ? "Sending..." : "Send reset email"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
