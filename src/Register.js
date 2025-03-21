// src/Register.js
import React, { useState } from "react";
import { Container, Button, Alert, Typography, TextField } from "@mui/material";
import PasswordField from "./PasswordField";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Use an environment variable for the backend URL.
  // Make sure to set REACT_APP_API_URL in your frontend's .env file.
  const API_URL = process.env.REACT_APP_API_URL || "https://scheduling-application.onrender.com";

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }
    try {
      // Note: Removed the hardcoded port. Now it uses the API_URL environment variable.
      const response = await axios.post(`${API_URL}/register`, { name, email, password, timezone });
      setMessage(response.data.message);
      setError("");
      // Optionally redirect to login after registration
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed!");
    }
  };

  return (
    <Container sx={{ mt: 5, maxWidth: "sm" }}>
      <Typography variant="h4" gutterBottom>
        Recruiter Registration
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <TextField
        label="Name"
        fullWidth
        margin="normal"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Email"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <PasswordField
        label="Password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextField
        label="Timezone"
        fullWidth
        margin="normal"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        helperText="Enter your IANA time zone (e.g., America/New_York)"
      />
      <Button variant="contained" fullWidth onClick={handleRegister} sx={{ mt: 2 }}>
        Register
      </Button>
    </Container>
  );
};

export default Register;