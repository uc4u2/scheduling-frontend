import React, { useMemo, useRef, useState } from "react";
import {
  Button,
  Alert,
  Typography,
  TextField,
  Box,
  Stack,
  Tooltip,
  FormHelperText,
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
import {
  getPasswordRequirements,
  getPhoneValidationError,
  getRegistrationApiMessage,
  normalizeRegistrationPhone,
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
const REGISTRATION_FIELD_ORDER = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "password",
  "password_confirm",
  "timezone",
  "role",
  "agreed_to_terms",
];
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
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const fieldRefs = useRef({});

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
  const passwordChecklist = useMemo(() => getPasswordRequirements(password), [password]);

  const passwordIsStrong = passwordChecklist.every((req) => req.pass);
  const passwordsMatch = password && password === confirmPassword;

  const setFieldRef = (field) => (node) => {
    if (node) fieldRefs.current[field] = node;
  };

  const clearFieldError = (field) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const markFieldTouched = (field) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  const focusFirstError = (errors) => {
    const firstField = REGISTRATION_FIELD_ORDER.find((field) => errors[field]);
    if (!firstField) return;
    window.requestAnimationFrame(() => {
      const target = fieldRefs.current[firstField];
      target?.focus?.();
      target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    });
  };

  const validateRegistrationForm = () => {
    const errors = {};
    if (!firstName.trim()) errors.first_name = "First name is required.";
    if (!lastName.trim()) errors.last_name = "Last name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address.";

    const phoneError = getPhoneValidationError(phone);
    if (phoneError) errors.phone = phoneError;
    if (!password) errors.password = "Password is required.";
    else if (!passwordIsStrong) errors.password = "Password does not meet all requirements below.";
    if (!confirmPassword) errors.password_confirm = "Confirm your password.";
    else if (!passwordsMatch) errors.password_confirm = "Passwords do not match.";
    if (!timezone) errors.timezone = "Timezone is required.";
    if (!role) errors.role = "Select an account type.";
    if (!acceptedTerms) errors.agreed_to_terms = "You must accept the agreements to create an account.";
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const clientErrors = validateRegistrationForm();
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      setTouchedFields((current) => ({
        ...current,
        ...Object.keys(clientErrors).reduce((result, field) => ({ ...result, [field]: true }), {}),
      }));
      setError("Please correct the highlighted fields and try again.");
      focusFirstError(clientErrors);
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
        phone: normalizeRegistrationPhone(phone),
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
      if (addonParam) loginParams.set("addon", addonParam);
      if (intervalParam) loginParams.set("interval", intervalParam === "yearly" ? "annual" : intervalParam);
      if (returnToParam) loginParams.set("returnTo", returnToParam);
      const nextPath = loginParams.toString() ? `/login?${loginParams.toString()}` : "/login";
      setTimeout(() => navigate(nextPath), 1500);
    } catch (err) {
      const data = err.response?.data || {};
      const apiFieldErrors = data.field_errors && typeof data.field_errors === "object" ? data.field_errors : {};
      setFieldErrors(apiFieldErrors);
      setTouchedFields((current) => ({
        ...current,
        ...Object.keys(apiFieldErrors).reduce((result, field) => ({ ...result, [field]: true }), {}),
      }));
      setError(getRegistrationApiMessage(data));
      focusFirstError(apiFieldErrors);
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

  const phoneInlineError =
    fieldErrors.phone || (touchedFields.phone ? getPhoneValidationError(phone) : "");
  const passwordInlineError =
    fieldErrors.password ||
    (touchedFields.password && !password
      ? "Password is required."
      : touchedFields.password && !passwordIsStrong
        ? "Password does not meet all requirements below."
        : "");
  const confirmPasswordInlineError =
    fieldErrors.password_confirm ||
    (touchedFields.password_confirm && !confirmPassword
      ? "Confirm your password."
      : touchedFields.password_confirm && !passwordsMatch
        ? "Passwords do not match."
        : "");

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
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearFieldError("first_name");
                  }}
                  onBlur={() => markFieldTouched("first_name")}
                  inputRef={setFieldRef("first_name")}
                  error={Boolean(fieldErrors.first_name)}
                  helperText={fieldErrors.first_name || ""}
                  autoComplete="given-name"
                  inputProps={{ autoCapitalize: "words" }}
                  required
                />
                <TextField
                  label="Last Name"
                  fullWidth
                  sx={authInputSx}
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearFieldError("last_name");
                  }}
                  onBlur={() => markFieldTouched("last_name")}
                  inputRef={setFieldRef("last_name")}
                  error={Boolean(fieldErrors.last_name)}
                  helperText={fieldErrors.last_name || ""}
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                onBlur={() => markFieldTouched("email")}
                inputRef={setFieldRef("email")}
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email || ""}
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
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearFieldError("phone");
                }}
                onBlur={() => markFieldTouched("phone")}
                inputRef={setFieldRef("phone")}
                inputProps={{ inputMode: "tel" }}
                autoComplete="tel"
                placeholder="+1 416 444 8839"
                error={Boolean(phoneInlineError)}
                helperText={phoneInlineError || "Example: +1 416 444 8839"}
                required
              />
              <PasswordField
                label="Password"
                fullWidth
                sx={authInputSx}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                onBlur={() => markFieldTouched("password")}
                inputRef={setFieldRef("password")}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    transform: "translate(14px, -12px) scale(0.75)",
                  },
                }}
                autoComplete="new-password"
                error={Boolean(passwordInlineError)}
                helperText={passwordInlineError}
                required
              />

              <Box
                component="ul"
                aria-label="Password requirements"
                aria-live="polite"
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                  gap: 0.5,
                  m: 0,
                  mt: "-0.5rem !important",
                  pl: 0,
                  listStyle: "none",
                }}
              >
                {passwordChecklist.map((requirement) => (
                  <Typography
                    component="li"
                    variant="caption"
                    key={requirement.key}
                    color={requirement.pass ? "success.main" : "text.secondary"}
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <Box component="span" aria-hidden="true" sx={{ fontWeight: 800 }}>
                      {requirement.pass ? "✓" : "○"}
                    </Box>
                    {requirement.label}
                  </Typography>
                ))}
              </Box>

              <PasswordField
                label="Confirm Password"
                fullWidth
                sx={authInputSx}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError("password_confirm");
                }}
                onBlur={() => markFieldTouched("password_confirm")}
                inputRef={setFieldRef("password_confirm")}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    transform: "translate(14px, -12px) scale(0.75)",
                  },
                }}
                autoComplete="new-password"
                error={Boolean(confirmPasswordInlineError)}
                helperText={confirmPasswordInlineError}
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
                      helperText={fieldErrors.timezone || (isMobile ? "" : undefined)}
                      error={Boolean(fieldErrors.timezone)}
                      inputRef={setFieldRef("timezone")}
                      showQuickAction={!isMobile}
                      required
                    />
                  ) : null}
                </Stack>
              ) : (
                <TimezoneSelect
                  label="Timezone"
                  value={timezone}
                  onChange={(value) => {
                    setTimezone(value);
                    clearFieldError("timezone");
                  }}
                  textFieldSx={authInputSx}
                  helperText={
                    fieldErrors.timezone || (isMobile
                      ? ""
                      : undefined)
                  }
                  error={Boolean(fieldErrors.timezone)}
                  inputRef={setFieldRef("timezone")}
                  showQuickAction={!isMobile}
                  required
                />
              )}

              <RoleSelect
                label="Role"
                value={role}
                onChange={(value) => {
                  setRole(value);
                  clearFieldError("role");
                }}
                options={ROLE_OPTIONS}
                textFieldSx={authInputSx}
                error={Boolean(fieldErrors.role)}
                inputRef={setFieldRef("role")}
                required
                helperText={
                  fieldErrors.role || (isMobile
                    ? ""
                    : "Select your account type to ensure the right dashboard experience.")
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
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      clearFieldError("agreed_to_terms");
                    }}
                    inputRef={setFieldRef("agreed_to_terms")}
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
                <FormHelperText error sx={{ mt: "-1rem !important", ml: 1.75 }}>
                  {fieldErrors.agreed_to_terms}
                </FormHelperText>
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
