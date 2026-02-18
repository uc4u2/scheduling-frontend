import React, { useMemo, useState } from "react";
import {
  Button,
  Alert,
  Typography,
  TextField,
  MenuItem,
  Box,
  Stack,
  Tooltip,
  IconButton,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
  CircularProgress,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PasswordField from "./PasswordField";
import api from "./utils/api";
import TimezoneSelect from "./components/TimezoneSelect";
import AuthCardShell, { authButtonSx, authInputSx } from "./components/auth/AuthCardShell";
import { getSessionUser, getAuthRedirectTarget } from "./utils/authRedirect";
import { buildMarketingUrl } from "./config/origins";

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

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || ""
  );
  const [role, setRole] = useState("owner");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
        agreed_to_terms: acceptedTerms,
        terms_version: AGREEMENT_VERSION,
        terms_agreed_at: new Date().toISOString(),
      });
      setMessage(response.data.message);
      const nextPath = targetRole === "client" ? "/industries" : "/login";
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
      } catch {}
    }
  }, [searchParams]);

  if (authChecking) {
    return (
      <AuthCardShell
        title="Create your account"
        subtitle="Checking your session..."
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
      title="Create your account"
      subtitle="Set up your Schedulaa workspace and launch scheduling, payroll, and booking from one panel."
    >
      <Tooltip
        title="Enterprise-grade scheduling & payroll, made simple. Whether you're a business owner, team member, or customer, choose your role below and get started."
        placement="right"
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, cursor: "help" }}>
          Start with business owner for full billing and operations access.
        </Typography>
      </Tooltip>

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
              Plan selected: {selectedPlan.toUpperCase()} — you’ll get a 14-day trial after signup.
            </Alert>
          )}

          <Box component="form" onSubmit={handleRegister} noValidate>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
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
                autoComplete="new-password"
                helperText={
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
                }
                required
              />

              <PasswordField
                label="Confirm Password"
                fullWidth
                sx={authInputSx}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                error={Boolean(confirmPassword) && !passwordsMatch}
                helperText={
                  confirmPassword && !passwordsMatch ? "Passwords must match" : ""
                }
                required
              />


              <TimezoneSelect
                label="Timezone"
                value={timezone}
                onChange={setTimezone}
                textFieldSx={authInputSx}
                required
              />

              <TextField
                select
                label="Role"
                fullWidth
                sx={authInputSx}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                helperText="Select your account type to ensure the right dashboard experience."
              >
                {ROLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {option.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                Employees are invited by their manager.
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
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
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Already have an account?{" "}
                <MuiLink
                  component={RouterLink}
                  to={selectedPlan ? `/login?plan=${encodeURIComponent(selectedPlan)}` : "/login"}
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
