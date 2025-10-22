import React, { useState } from "react";
import {
  Container,
  Button,
  Alert,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Box
} from "@mui/material";
import PasswordField from "./PasswordField";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Keep timezones in sync with Login.js
const timezones = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Europe/Paris", "Asia/Kolkata", "Asia/Tokyo",
  "Asia/Dubai", "Australia/Sydney"
];

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [role, setRole] = useState("recruiter");
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
    try {
      const response = await axios.post(`${API_URL}/register`, {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        timezone,
        role
      });
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed!");
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Create Account
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        <form onSubmit={handleRegister}>
          <TextField
            label="First Name"
            fullWidth
            margin="normal"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <TextField
            label="Last Name"
            fullWidth
            margin="normal"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <PasswordField
            label="Password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <TextField
            select
            label="Timezone"
            fullWidth
            margin="normal"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            required
          >
            {timezones.map((tz) => (
              <MenuItem key={tz} value={tz}>{tz}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Role"
            fullWidth
            margin="normal"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <MenuItem value="client">Client</MenuItem>
            <MenuItem value="recruiter">Recruiter</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
          </TextField>

          <Box mt={3}>
            <Button
              variant="contained"
              fullWidth
              type="submit"
              disabled={loading}
            >
              {loading ? "Registering..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;
