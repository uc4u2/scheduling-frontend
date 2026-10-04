import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { api } from "../../utils/api";
import { getTenantHostMode } from "../../utils/tenant";
import TimezoneSelect from "../../components/TimezoneSelect";
import { formatTimezoneLabel, getUserTimezone } from "../../utils/timezone";
import Meta from "../../components/Meta";
import { buildMarketingLegalUrl } from "../../config/origins";

const renderDetectedTimezoneNotice = (timezone, showManual, onToggle) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.25,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      bgcolor: "action.hover",
      px: 1.5,
      py: 1.25,
    }}
  >
    <AccessTimeRoundedIcon color="primary" sx={{ fontSize: 20, flex: "0 0 auto" }} />
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="caption" sx={{ display: "block", color: "text.secondary", lineHeight: 1.2 }}>
        Booking timezone
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 700, lineHeight: 1.35 }}>
        {formatTimezoneLabel(timezone) || timezone || "UTC"}
      </Typography>
    </Box>
    <Button size="small" onClick={onToggle} sx={{ flex: "0 0 auto", minWidth: 0, px: 1 }}>
      {showManual ? "Done" : "Change"}
    </Button>
  </Box>
);

const authFieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 54,
    borderRadius: 2,
  },
  "& input:-webkit-autofill": {
    WebkitBoxShadow: "0 0 0 1000px var(--page-card-bg, var(--tenant-shell-card, #fff)) inset",
    WebkitTextFillColor: "var(--page-body-color, currentColor)",
    caretColor: "var(--page-body-color, currentColor)",
    transition: "background-color 9999s ease-out 0s",
  },
};

const AuthFieldLabel = ({ htmlFor, children, required = false }) => (
  <Typography
    component="label"
    htmlFor={htmlFor}
    variant="body2"
    sx={{ px: 0.25, color: "text.primary", fontWeight: 700, lineHeight: 1.25 }}
  >
    {children}
    {required ? <Box component="span" sx={{ ml: 0.35, color: "primary.main" }} aria-hidden="true">*</Box> : null}
  </Typography>
);

const AuthField = ({ id, label, required = false, containerSx, ...textFieldProps }) => (
  <Stack spacing={0.75} sx={containerSx}>
    <AuthFieldLabel htmlFor={id} required={required}>{label}</AuthFieldLabel>
    <TextField
      {...textFieldProps}
      id={id}
      required={required}
      fullWidth
      sx={authFieldSx}
    />
  </Stack>
);

const accountBenefits = [
  "Review upcoming and past bookings",
  "Keep appointments and details together",
  "Book again with less repetition",
];

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
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
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
    const activeQuery = new URLSearchParams(window.location.search || "");
    const embeddedQuery = new URLSearchParams();
    ["mode", "dialog", "site", "primary", "text", "return_to", "returnTo"].forEach((key) => {
      if (activeQuery.has(key)) embeddedQuery.set(key, activeQuery.get(key));
    });
    if (slug) embeddedQuery.set("site", slug);
    embeddedQuery.set("embed", "1");
    embeddedQuery.set("dialog", "1");
    const target =
      // A Next transactional bridge frames the established client login.
      // Return to DashboardShellGate, the mounted client-panel route used by
      // the Next bridge, instead of a tenant-prefixed URL that custom-domain
      // public routing can treat as a marketing page.
      embedded && slug
        ? `/dashboard?${embeddedQuery.toString()}`
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

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setError("");
  };

  const submitAuth = (event) => {
    event.preventDefault();
    if (!busy) {
      if (tab === "login") doLogin();
      else doRegister();
    }
  };

  const passwordAdornment = (visible, onToggle, label) => (
    <InputAdornment position="end">
      <IconButton
        edge="end"
        onClick={onToggle}
        onMouseDown={(event) => event.preventDefault()}
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      >
        {visible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={{ width: "100%", maxWidth: 980, mx: "auto", px: { xs: 1.5, sm: 2.5 }, py: { xs: 2, sm: 4 } }}>
      <Meta title={seoTitle} robots="noindex, nofollow" />
      <Paper
        elevation={0}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(260px, .82fr) minmax(0, 1.18fr)" },
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: { xs: 2.5, sm: 3 },
          boxShadow: (theme) => `0 24px 70px ${theme.palette.action.disabledBackground}`,
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: { xs: "none", md: "flex" },
            minHeight: 590,
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
            p: { md: 4, lg: 5 },
            color: "primary.contrastText",
            bgcolor: "primary.main",
            backgroundImage: (theme) =>
              `radial-gradient(circle at 85% 12%, ${theme.palette.secondary.main}55, transparent 32%), linear-gradient(150deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              right: -70,
              bottom: -80,
              width: 250,
              height: 250,
              border: "1px solid",
              borderColor: "currentColor",
              borderRadius: "50%",
              opacity: 0.16,
            }}
          />
          <Box sx={{ position: "relative" }}>
            <Box
              sx={{
                display: "grid",
                width: 48,
                height: 48,
                placeItems: "center",
                border: "1px solid",
                borderColor: "currentColor",
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,.12)",
              }}
            >
              <CalendarMonthOutlinedIcon />
            </Box>
            <Typography variant="overline" sx={{ display: "block", mt: 4, fontWeight: 800, letterSpacing: ".18em", opacity: 0.78 }}>
              Client portal
            </Typography>
            <Typography component="h2" variant="h3" sx={{ mt: 1, fontSize: { md: "2.25rem", lg: "2.65rem" }, fontWeight: 700, lineHeight: 1.08 }}>
              Your appointments, organized.
            </Typography>
            <Typography sx={{ mt: 2, lineHeight: 1.7, opacity: 0.82 }}>
              Use your secure client account to manage every visit in one place.
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 4 }}>
              {accountBenefits.map((benefit) => (
                <Stack key={benefit} direction="row" spacing={1.25} alignItems="center">
                  <CheckCircleOutlineRoundedIcon sx={{ fontSize: 19, opacity: 0.85 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{benefit}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ position: "relative", mt: 5, opacity: 0.75 }}>
            <LockOutlinedIcon sx={{ fontSize: 17 }} />
            <Typography variant="caption">Secure account access</Typography>
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 2.25, sm: 4, lg: 5 } }}>
          <Box sx={{ mb: 3 }}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 750, letterSpacing: "-.02em" }}>
              {tab === "login" ? "Welcome back" : "Create your account"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", lineHeight: 1.6 }}>
              {tab === "login"
                ? "Sign in to view and manage your bookings."
                : "Create a client account for faster booking and easy appointment access."}
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, value) => switchTab(value)}
            variant="fullWidth"
            aria-label="Client account options"
            sx={{
              mb: 3,
              minHeight: 44,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "action.hover",
              p: 0.5,
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                minHeight: 36,
                borderRadius: 1.5,
                px: { xs: 1, sm: 2 },
                fontSize: { xs: "0.78rem", sm: "0.875rem" },
                fontWeight: 700,
                textTransform: "none",
                whiteSpace: "nowrap",
              },
              "& .Mui-selected": { bgcolor: "background.paper", boxShadow: 1 },
            }}
          >
            <Tab value="login" label="Sign in" />
            <Tab value="register" label="Create account" />
          </Tabs>

          {error && <Alert severity="error" role="alert" sx={{ mb: 2.5 }}>{error}</Alert>}

          <Box component="form" onSubmit={submitAuth} noValidate>
            <Stack spacing={2}>
              {tab === "register" && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <AuthField id="client-first-name" label="First name" required name="given-name" autoComplete="given-name" value={first} onChange={(event) => setFirst(event.target.value)} containerSx={{ flex: 1 }} />
                  <AuthField id="client-last-name" label="Last name" required name="family-name" autoComplete="family-name" value={last} onChange={(event) => setLast(event.target.value)} containerSx={{ flex: 1 }} />
                </Stack>
              )}
              <AuthField id="client-email" label="Email" required name="email" autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              {tab === "register" && (
                <AuthField id="client-phone" label="Phone" required name="phone" autoComplete="tel" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
              )}
              <AuthField
                id="client-password"
                required
                label="Password"
                name="password"
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                InputProps={{ endAdornment: passwordAdornment(showPassword, () => setShowPassword((value) => !value), "password") }}
              />
              {tab === "login" && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "4px !important" }}>
                  <Link component="button" type="button" variant="body2" onClick={() => { setForgotEmail(email); setForgotOpen(true); }} sx={{ fontWeight: 650 }}>
                    Forgot password?
                  </Link>
                </Box>
              )}
              {tab === "register" && (
                <AuthField
                  id="client-password-confirmation"
                  required
                  label="Confirm password"
                  name="password-confirmation"
                  autoComplete="new-password"
                  type={showPasswordConfirm ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  InputProps={{ endAdornment: passwordAdornment(showPasswordConfirm, () => setShowPasswordConfirm((value) => !value), "confirmed password") }}
                />
              )}

              {renderDetectedTimezoneNotice(timezone, showTimezoneSelect, () => setShowTimezoneSelect((previous) => !previous))}
              {showTimezoneSelect ? (
                <Stack spacing={0.75}>
                  <AuthFieldLabel htmlFor="client-timezone">Timezone</AuthFieldLabel>
                  <TimezoneSelect inputId="client-timezone" label="" value={timezone} onChange={setTimezone} textFieldSx={authFieldSx} />
                </Stack>
              ) : null}

              {tab === "register" && (
                <FormControlLabel
                  sx={{ alignItems: "flex-start", m: 0, "& .MuiCheckbox-root": { pt: 0.1, pl: 0 } }}
                  control={<Checkbox checked={agreedToTerms} onChange={(event) => setAgreedToTerms(event.target.checked)} />}
                  label={
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.55 }}>
                      I agree to the{" "}
                      <Link href={userAgreementUrl} target="_blank" rel="noopener">Schedulaa User Agreement</Link>.
                    </Typography>
                  }
                />
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={busy}
                endIcon={!busy ? <ArrowForwardRoundedIcon /> : null}
                sx={{ minHeight: 50, mt: 0.5, fontWeight: 800, textTransform: "none" }}
              >
                {busy ? (tab === "login" ? "Signing in…" : "Creating account…") : (tab === "login" ? "Sign in" : "Create account")}
              </Button>

              <Typography variant="body2" align="center" sx={{ color: "text.secondary", pt: 0.5 }}>
                {tab === "login" ? "New here?" : "Already have an account?"}{" "}
                <Link component="button" type="button" onClick={() => switchTab(tab === "login" ? "register" : "login")} sx={{ fontWeight: 750 }}>
                  {tab === "login" ? "Create an account" : "Sign in"}
                </Link>
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Paper>
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ pb: 1, fontWeight: 750 }}>Reset your password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            Enter the email connected to your client account. We’ll send reset instructions if the account exists.
          </Typography>
          {forgotError && <Alert severity="error" sx={{ mb: 2 }}>{forgotError}</Alert>}
          {forgotMessage && <Alert severity="success" sx={{ mb: 2 }}>{forgotMessage}</Alert>}
          <AuthField
            id="client-reset-email"
            label="Email"
            name="reset-email"
            autoComplete="email"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            containerSx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setForgotOpen(false)} disabled={forgotBusy}>
            Cancel
          </Button>
          <Button variant="contained" onClick={doForgotPassword} disabled={forgotBusy}>
            {forgotBusy ? "Sending…" : "Send reset email"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
