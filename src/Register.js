import React, { useMemo, useState } from "react";
import {
  Button,
  Alert,
  Typography,
  TextField,
  Box,
  Stack,
  Tooltip,
  IconButton,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PasswordField from "./PasswordField";
import api from "./utils/api";
import TimezoneSelect from "./components/TimezoneSelect";
import RoleSelect from "./components/RoleSelect";
import AuthCardShell, { authButtonSx, authInputSx } from "./components/auth/AuthCardShell";
import { getSessionUser, getAuthRedirectTarget } from "./utils/authRedirect";
import { buildMarketingUrl } from "./config/origins";
import { getUserTimezone, formatTimezoneLabel } from "./utils/timezone";

const ROLE_OPTIONS = [
  {
    value: "customer",
    label: "Customer",
    description: "Book services or shop with your business",
    apiValue: "client",
  },
  {
    value: "owner",
    label: "Business Owner",
    description: "Manage your company, team, and online bookings",
    apiValue: "manager",
  },
];

const getRoleMeta = (value) =>
  ROLE_OPTIONS.find((option) => option.value === value) || ROLE_OPTIONS[1];

const AGREEMENT_VERSION = "2025-11";

const Register = ({ slugOverride = "" }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone, setTimezone] = useState(getUserTimezone());
  const [showTimezoneSelect, setShowTimezoneSelect] = useState(false);
  const [role, setRole] = useState("owner");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams] = useSearchParams();
  const siteParam = (searchParams.get("site") || "").trim();
  const intervalParam = (searchParams.get("interval") || "").toLowerCase();
  const returnToParam = (searchParams.get("returnTo") || "").trim();
  const persistedSite =
    typeof localStorage !== "undefined" ? (localStorage.getItem("site") || "").trim() : "";
  const clientSite = useMemo(
    () => String(slugOverride || "").trim() || siteParam || persistedSite,
    [persistedSite, siteParam, slugOverride]
  );
  const passwordChecklist = useMemo(
    () => [
      { label: "At least 8 characters", pass: password.length >= 8 },
      { label: "One uppercase letter", pass: /[A-Z]/.test(password) },
      { label: "One lowercase letter", pass: /[a-z]/.test(password) },
      { label: "One number", pass: /\d/.test(password) },
      { label: "One symbol", pass: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  const passwordIsStrong = passwordChecklist.every((req) => req.pass);
  const passwordsMatch = password && password === confirmPassword;
  const canSubmit =
    Boolean(firstName && lastName && email && phone && password && timezone && role) &&
    passwordIsStrong &&
    passwordsMatch &&
    !loading &&
    acceptedTerms;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("Double-check the fields above and try again.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    const targetRole = getRoleMeta(role).apiValue;
    if (targetRole === "recruiter") {
      setError("Employees are invited by their manager.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post(`/register`, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
        password_confirm: confirmPassword,
        timezone,
        role: targetRole,
        company_slug: targetRole === "client" ? clientSite || undefined : undefined,
        agreed_to_terms: acceptedTerms,
        terms_version: AGREEMENT_VERSION,
        terms_agreed_at: new Date().toISOString(),
      });
      setMessage(response.data.message);
      if (targetRole === "client" && clientSite) {
        localStorage.setItem("site", clientSite);
      }
      const loginParams = new URLSearchParams();
      if (targetRole === "client" && clientSite) loginParams.set("site", clientSite);
      if (selectedPlan) loginParams.set("plan", selectedPlan);
      if (intervalParam) loginParams.set("interval", intervalParam === "yearly" ? "annual" : intervalParam);
      if (returnToParam) loginParams.set("returnTo", returnToParam);
      const nextPath = loginParams.toString() ? `/login?${loginParams.toString()}` : "/login";
      setTimeout(() => navigate(nextPath), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed!");
    }
    setLoading(false);
  };

  React.useEffect(() => {
    let active = true;
    const token = localStorage.getItem("token");

    if (!token) {
      setAuthChecking(false);
      return () => {
        active = false;
      };
    }

    (async () => {
      const user = await getSessionUser();
      if (!active) return;

      if (!user) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setAuthChecking(false);
        return;
      }

      const redirectTarget = getAuthRedirectTarget({ user, searchParams });
      navigate(redirectTarget, { replace: true });
    })();

    return () => {
      active = false;
    };
  }, [navigate, searchParams]);

  React.useEffect(() => {
    const planParam = (searchParams.get("plan") || "").toLowerCase();
    if (["starter", "pro", "business"].includes(planParam)) {
      setSelectedPlan(planParam);
      try {
        localStorage.setItem("pending_plan_key", planParam);
        if (intervalParam) localStorage.setItem("pending_plan_interval", intervalParam === "yearly" ? "annual" : intervalParam);
      } catch {}
    }
  }, [intervalParam, searchParams]);

  if (authChecking) {
    return (
      <AuthCardShell
        eyebrow="Workspace onboarding"
        title="Create your account"
        subtitle="Checking your session..."
        heroTitle="Launch a polished booking and operations experience from day one."
        heroSubtitle="Create a secure account for client access, staffing, scheduling, and growth inside one platform."
      >
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Redirecting to your workspace
          </Typography>
        </Stack>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell
      eyebrow="Tenant-aware registration"
      title="Create your account"
      subtitle={
        isMobile
          ? ""
          : "Set up your Schedulaa workspace and launch scheduling, payroll, and booking from one panel."
      }
      heroTitle={isMobile ? "" : "Build a business workspace clients actually trust."}
      heroSubtitle={
        isMobile
          ? ""
          : "From premium booking flows to operational control, Schedulaa keeps the customer experience and the back office connected."
      }
    >
      {!isMobile ? (
        <Tooltip
          title="Enterprise-grade scheduling & payroll, made simple. Whether you're a business owner, team member, or customer, choose your role below and get started."
          placement="right"
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, cursor: "help" }}>
            Start with business owner for full billing and operations access.
          </Typography>
        </Tooltip>
      ) : null}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}
          {selectedPlan && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Plan selected: {selectedPlan.toUpperCase()} {intervalParam ? `(${intervalParam === "yearly" ? "ANNUAL" : intervalParam.toUpperCase()})` : ""} — you’ll get a 14-day trial after signup.
            </Alert>
          )}

          <Box component="form" onSubmit={handleRegister} noValidate>
            <Stack spacing={isMobile ? 1.8 : 2.5}>
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  letterSpacing: 1.2,
                  fontSize: isMobile ? "0.68rem" : undefined,
                }}
              >
                Workspace details
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={isMobile ? 1.8 : 2.5}>
                <TextField
                  label="First Name"
                  fullWidth
                  sx={authInputSx}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  inputProps={{ autoCapitalize: "words" }}
                  required
                />
                <TextField
                  label="Last Name"
                  fullWidth
                  sx={authInputSx}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  inputProps={{ autoCapitalize: "words" }}
                  required
                />
              </Stack>
              <TextField
                label="Email"
                fullWidth
                sx={authInputSx}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputProps={{ inputMode: "email", autoCapitalize: "none" }}
                autoComplete="email"
                required
              />
              <TextField
                label="Phone"
                fullWidth
                sx={authInputSx}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputProps={{ inputMode: "tel" }}
                autoComplete="tel"
                required
              />
              <PasswordField
                label="Password"
                fullWidth
                sx={authInputSx}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    transform: "translate(14px, -12px) scale(0.75)",
                  },
                }}
                autoComplete="new-password"
                helperText={
                  isMobile ? (
                    ""
                  ) : (
                    <Box display="inline-flex" alignItems="center" gap={0.5}>
                      Use 12+ characters with numbers, letters, and symbols.
                      <Tooltip
                        title="At least 12 characters · One uppercase letter · One lowercase letter · One number · One symbol"
                      >
                        <IconButton size="small" sx={{ p: 0 }}>
                          <InfoOutlinedIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )
                }
                required
              />

              <PasswordField
                label="Confirm Password"
                fullWidth
                sx={authInputSx}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    transform: "translate(14px, -12px) scale(0.75)",
                  },
                }}
                autoComplete="new-password"
                error={Boolean(confirmPassword) && !passwordsMatch}
                helperText={
                  confirmPassword && !passwordsMatch ? "Passwords must match" : ""
                }
                required
              />

              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  letterSpacing: 1.2,
                  fontSize: isMobile ? "0.68rem" : undefined,
                }}
              >
                Preferences
              </Typography>

              {role === "customer" ? (
                <Stack spacing={isMobile ? 0.75 : 1}>
                  {!isMobile ? (
                    <Alert severity="info">
                      Timezone detected automatically: <strong>{formatTimezoneLabel(timezone) || timezone || "UTC"}</strong>
                    </Alert>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ px: 0.25 }}>
                      Timezone: <strong>{formatTimezoneLabel(timezone) || timezone || "UTC"}</strong>
                    </Typography>
                  )}
                  <Box>
                    <Button size="small" sx={{ px: 0.5, minHeight: 28 }} onClick={() => setShowTimezoneSelect((prev) => !prev)}>
                      {showTimezoneSelect ? "Hide timezone change" : "Change timezone"}
                    </Button>
                  </Box>
                  {showTimezoneSelect ? (
                    <TimezoneSelect
                      label="Timezone"
                      value={timezone}
                      onChange={setTimezone}
                      textFieldSx={authInputSx}
                      helperText={isMobile ? "" : undefined}
                      showQuickAction={!isMobile}
                      required
                    />
                  ) : null}
                </Stack>
              ) : (
                <TimezoneSelect
                  label="Timezone"
                  value={timezone}
                  onChange={setTimezone}
                  textFieldSx={authInputSx}
                  helperText={
                    isMobile
                      ? ""
                      : undefined
                  }
                  showQuickAction={!isMobile}
                  required
                />
              )}

              <RoleSelect
                label="Role"
                value={role}
                onChange={setRole}
                options={ROLE_OPTIONS}
                textFieldSx={authInputSx}
                required
                helperText={
                  isMobile
                    ? ""
                    : "Select your account type to ensure the right dashboard experience."
                }
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: isMobile ? -0.5 : -1, fontSize: isMobile ? "0.74rem" : undefined }}
              >
                Employees are invited by their manager.
              </Typography>

              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  letterSpacing: 1.2,
                  fontSize: isMobile ? "0.68rem" : undefined,
                }}
              >
                Compliance
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? "0.94rem" : undefined, lineHeight: isMobile ? 1.55 : undefined }}
                  >
                    I agree to the{" "}
                    <MuiLink component={RouterLink} to="/user-agreement" target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
                      User Agreement
                    </MuiLink>
                    ,{" "}
                    <MuiLink component={RouterLink} to="/terms" target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
                      Terms of Service
                    </MuiLink>
                    ,{" "}
                    <MuiLink component={RouterLink} to="/privacy" target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
                      Privacy Policy
                    </MuiLink>
                    , and{" "}
                    <MuiLink component={RouterLink} to="/data-processing" target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
                      Data Processing Addendum
                    </MuiLink>
                    .
                  </Typography>
                }
                sx={{ alignItems: "flex-start", ml: -0.25 }}
              />

              <Button
                variant="contained"
                fullWidth
                type="submit"
                disabled={!canSubmit}
                sx={authButtonSx}
              >
                {loading ? "Registering..." : "Create account"}
              </Button>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                sx={{
                  pt: isMobile ? 0.75 : 1,
                  borderTop: "1px solid rgba(226,232,240,0.9)",
                }}
              >
                Already have an account?{" "}
                <MuiLink
                  component={RouterLink}
                  to={
                    (() => {
                      const nextParams = new URLSearchParams();
                      if (selectedPlan) nextParams.set("plan", selectedPlan);
                      if (clientSite) nextParams.set("site", clientSite);
                      const suffix = nextParams.toString();
                      return suffix ? `/login?${suffix}` : "/login";
                    })()
                  }
                  sx={{ fontWeight: 600 }}
                >
                  Log in
                </MuiLink>
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                <MuiLink href={buildMarketingUrl("/en")} sx={{ fontWeight: 600 }}>
                  Back to website
                </MuiLink>
              </Typography>
            </Stack>
          </Box>
    </AuthCardShell>
  );
};

export default Register;
