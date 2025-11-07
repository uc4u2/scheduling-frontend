import React, { useMemo, useState } from "react";
import {
  Container,
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
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PasswordField from "./PasswordField";
import axios from "axios";

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Australia/Sydney",
];

const ROLE_OPTIONS = [
  {
    value: "customer",
    label: "Customer",
    description: "Book services or shop with your business",
    apiValue: "client",
  },
  {
    value: "employee",
    label: "Employee",
    description: "Access your schedule, shifts, or payroll",
    apiValue: "recruiter",
  },
  {
    value: "owner",
    label: "Business Owner",
    description: "Manage your company, team, and online bookings",
    apiValue: "manager",
  },
];

const getRoleMeta = (value) =>
  ROLE_OPTIONS.find((option) => option.value === value) || ROLE_OPTIONS[2];

const AGREEMENT_VERSION = "2025-11";

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [role, setRole] = useState("owner");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const passwordChecklist = useMemo(
    () => [
      { label: "At least 12 characters", pass: password.length >= 12 },
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
    Boolean(firstName && lastName && email && password && timezone && role) &&
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

    try {
      const response = await axios.post(`${API_URL}/register`, {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        password_confirm: confirmPassword,
        timezone,
        role: targetRole,
        agreed_to_terms: acceptedTerms,
        terms_version: AGREEMENT_VERSION,
        terms_agreed_at: new Date().toISOString(),
      });
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed!");
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: { xs: 8, md: 12 },
        px: 2,
        background: "linear-gradient(135deg, rgba(255,112,51,0.08) 0%, rgba(56,189,248,0.08) 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ height: 4, width: "100%", bgcolor: "#FF7033", borderRadius: 1, mb: 3 }} />

          <Tooltip
            title="Enterprise-grade scheduling & payroll, made simple. Whether you're a business owner, team member, or customer, choose your role below and get started."
            placement="right"
          >
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ cursor: "help" }}>
              Create Your Account
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

          <Box component="form" onSubmit={handleRegister} noValidate>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  inputProps={{ autoCapitalize: "words" }}
                  required
                />
                <TextField
                  label="Last Name"
                  fullWidth
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
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputProps={{ inputMode: "email", autoCapitalize: "none" }}
                autoComplete="email"
                required
              />
              <PasswordField
                label="Password"
                fullWidth
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                error={Boolean(confirmPassword) && !passwordsMatch}
                helperText={
                  confirmPassword && !passwordsMatch ? "Passwords must match" : ""
                }
                required
              />


              <TextField
                select
                label="Timezone"
                fullWidth
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
                helperText="We store an IANA timezone (e.g. America/New_York)."
              >
                {!timezones.includes(timezone) && (
                  <MenuItem value={timezone}>{timezone} (detected)</MenuItem>
                )}
                {timezones.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Role"
                fullWidth
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
                sx={{ py: 1.25 }}
              >
                {loading ? "Registering..." : "Create account"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
