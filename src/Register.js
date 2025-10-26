import React, { useState } from "react";
import {
  Container,
  Button,
  Alert,
  Typography,
  TextField,
  MenuItem,
  Box,
  Stack,
} from "@mui/material";
import PasswordField from "./PasswordField";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [role, setRole] = useState("owner");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !timezone || !role) {
      setError("All fields are required.");
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
        timezone,
        role: targetRole,
      });
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed!");
    }
    setLoading(false);
  };

  const selectedRoleMeta = getRoleMeta(role);

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

          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
            Step 1 of 1 · Create Your Account
          </Typography>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Create Your Account
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Enterprise-grade scheduling & payroll, made simple.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Whether you're a business owner, team member, or customer, choose your role below and get started.
          </Typography>

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
              <TextField
                label="First Name"
                fullWidth
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <TextField
                label="Last Name"
                fullWidth
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <PasswordField
                label="Password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

              <Button
                variant="contained"
                fullWidth
                type="submit"
                disabled={loading}
                sx={{ py: 1.25 }}
              >
                {loading
                  ? "Registering..."
                  : `Create account as ${selectedRoleMeta.label}`}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
