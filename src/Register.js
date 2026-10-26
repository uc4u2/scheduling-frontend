import React, { useMemo, useState } from "react";
import {
  Button,
  Alert,
  Typography,
  TextField,
  Box,
  Stack,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import PasswordField from "./PasswordField";
import api from "./utils/api";
import TimezoneSelect from "./components/TimezoneSelect";
import RoleSelect from "./components/RoleSelect";
import AuthCardShell, { authButtonSx, authInputSx } from "./components/auth/AuthCardShell";
import { getSessionUser, getAuthRedirectTarget } from "./utils/authRedirect";
import { buildMarketingLegalUrl, buildMarketingUrl } from "./config/origins";
import { getUserTimezone, formatTimezoneLabel } from "./utils/timezone";
import { trackGAEvent, trackGAEventOnce } from "./analytics/ga";
import {
  firstRegistrationErrorField,
  passwordRequirements,
  validateRegistrationForm,
} from "./utils/registrationValidation";

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
const USER_AGREEMENT_URL = buildMarketingLegalUrl("/user-agreement");
const TERMS_URL = buildMarketingLegalUrl("/terms");
const PRIVACY_URL = buildMarketingLegalUrl("/privacy");
const DATA_PROCESSING_URL = buildMarketingLegalUrl("/data-processing");

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
  const [fieldErrors, setFieldErrors] = useState({});
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
  const addonParam = (searchParams.get("addon") || "").toLowerCase();
  const intervalParam = (searchParams.get("interval") || "").toLowerCase();
  const returnToParam = (searchParams.get("returnTo") || "").trim();
  const persistedSite =
    typeof localStorage !== "undefined" ? (localStorage.getItem("site") || "").trim() : "";
  const clientSite = useMemo(
    () => String(slugOverride || "").trim() || siteParam || persistedSite,
    [persistedSite, siteParam, slugOverride]
  );
  const passwordChecklist = useMemo(() => passwordRequirements(password), [password]);

  const passwordsMatch = password && password === confirmPassword;
  const clearFieldError = (field) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const focusField = (field) => {
    if (!field || typeof document === "undefined") return;
    window.setTimeout(() => document.getElementById(`register-${field}`)?.focus(), 0);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const clientErrors = validateRegistrationForm({
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      timezone,
      acceptedTerms,
    });
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      setError("A few details need your attention.");
      focusField(firstRegistrationErrorField(clientErrors));
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    setFieldErrors({});
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
      trackGAEvent("registration_complete", {
        account_role: targetRole,
        selected_plan: selectedPlan || "none",
      });
      setMessage(response.data.message);
      if (targetRole === "client" && clientSite) {
        localStorage.setItem("site", clientSite);
      }
      const loginParams = new URLSearchParams();
      if (targetRole === "client" && clientSite) loginParams.set("site", clientSite);
      if (selectedPlan) loginParams.set("plan", selectedPlan);
      if (addonParam) loginParams.set("addon", addonParam);
      if (intervalParam) loginParams.set("interval", intervalParam === "yearly" ? "annual" : intervalParam);
      if (returnToParam) loginParams.set("returnTo", returnToParam);
      const nextPath = loginParams.toString() ? `/login?${loginParams.toString()}` : "/login";
      setTimeout(() => navigate(nextPath), 1500);
    } catch (err) {
      const serverErrors = err.response?.data?.field_errors;
      if (serverErrors && typeof serverErrors === "object") {
        setFieldErrors(serverErrors);
        setError("A few details need your attention.");
        focusField(firstRegistrationErrorField(serverErrors));
      } else if (err.response?.data?.error === "account_exists") {
        setFieldErrors({ email: err.response?.data?.message || "An account already exists for this email. Please log in or reset your password." });
        setError("An account already exists for this email.");
        focusField("email");
      } else {
        setError(err.response?.data?.message || "We could not create your account right now. Please try again.");
      }
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

          <Box
            component="form"
            onSubmit={handleRegister}
            onChangeCapture={() =>
              trackGAEventOnce("registration_start", "registration_start", {
                page_path: "/register",
              })
            }
            noValidate
          >
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
                  id="register-first_name"
                  label="First Name"
                  fullWidth
                  sx={authInputSx}
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearFieldError("first_name");
                  }}
                  autoComplete="given-name"
                  inputProps={{ autoCapitalize: "words" }}
                  required
                  error={Boolean(fieldErrors.first_name)}
                  helperText={fieldErrors.first_name}
                />
                <TextField
                  id="register-last_name"
                  label="Last Name"
                  fullWidth
                  sx={authInputSx}
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearFieldError("last_name");
                  }}
                  autoComplete="family-name"
                  inputProps={{ autoCapitalize: "words" }}
                  required
                  error={Boolean(fieldErrors.last_name)}
                  helperText={fieldErrors.last_name}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: isMobile ? -0.8 : -1.25, px: 0.25 }}>
                This creates the first owner account for the workspace. Practice details can be completed after signup.
              </Typography>
              <TextField
                id="register-email"
                label="Email"
                fullWidth
                sx={authInputSx}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                inputProps={{ inputMode: "email", autoCapitalize: "none" }}
                autoComplete="email"
                required
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email}
              />
              <TextField
                id="register-phone"
                label="Phone"
                fullWidth
                sx={authInputSx}
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearFieldError("phone");
                }}
                inputProps={{ inputMode: "tel" }}
                autoComplete="tel"
                required
                error={Boolean(fieldErrors.phone)}
                helperText={fieldErrors.phone || "Use a number you can access, for example +1 416 555 0123."}
              />
              <PasswordField
                id="register-password"
                label="Password"
                fullWidth
                sx={authInputSx}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    transform: "translate(14px, -12px) scale(0.75)",
                  },
                }}
                autoComplete="new-password"
                error={Boolean(fieldErrors.password)}
                helperText={fieldErrors.password}
                required
              />
              <Box sx={{ mt: isMobile ? -1.1 : -1.4, px: 0.5 }} aria-live="polite">
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.35 }}>
                  Your password needs:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.65}>
                  {passwordChecklist.map((requirement) => (
                    <Typography
                      key={requirement.key}
                      variant="caption"
                      sx={{ color: requirement.pass ? "success.main" : "text.secondary", fontWeight: requirement.pass ? 700 : 400 }}
                    >
                      {requirement.pass ? "✓" : "○"} {requirement.label}
                    </Typography>
                  ))}
                </Stack>
              </Box>

              <PasswordField
                id="register-password_confirm"
                label="Confirm Password"
                fullWidth
                sx={authInputSx}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError("password_confirm");
                }}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    transform: "translate(14px, -12px) scale(0.75)",
                  },
                }}
                autoComplete="new-password"
                error={Boolean(fieldErrors.password_confirm) || (Boolean(confirmPassword) && !passwordsMatch)}
                helperText={
                  fieldErrors.password_confirm || (confirmPassword && !passwordsMatch ? "Passwords do not match." : "")
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
                      onChange={(value) => {
                        setTimezone(value);
                        clearFieldError("timezone");
                      }}
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
                      ? fieldErrors.timezone || ""
                      : fieldErrors.timezone || undefined
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
                    inputProps={{ id: "register-agreed_to_terms" }}
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      clearFieldError("agreed_to_terms");
                    }}
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
                    <MuiLink href={USER_AGREEMENT_URL} target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
                      User Agreement
                    </MuiLink>
                    ,{" "}
                    <MuiLink href={TERMS_URL} target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
                      Terms of Service
                    </MuiLink>
                    ,{" "}
                    <MuiLink href={PRIVACY_URL} target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
                      Privacy Policy
                    </MuiLink>
                    , and{" "}
                    <MuiLink href={DATA_PROCESSING_URL} target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
                      Data Processing Addendum
                    </MuiLink>
                    .
                  </Typography>
                }
                sx={{ alignItems: "flex-start", ml: -0.25 }}
              />
              {fieldErrors.agreed_to_terms ? (
                <Typography color="error" variant="caption" sx={{ mt: isMobile ? -1.1 : -1.5, px: 0.25 }}>
                  {fieldErrors.agreed_to_terms}
                </Typography>
              ) : null}

              <Button
                variant="contained"
                fullWidth
                type="submit"
                disabled={loading}
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
              {!clientSite ? (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  <MuiLink href={buildMarketingUrl("/en")} sx={{ fontWeight: 600 }}>
                    Back to website
                  </MuiLink>
                </Typography>
              ) : null}
            </Stack>
          </Box>
    </AuthCardShell>
  );
};

export default Register;
