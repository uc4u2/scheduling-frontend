// src/Login.js
import React, { useState } from "react";
import { Container, Button, Alert, Typography, TextField } from "@mui/material";
import PasswordField from "./PasswordField"; // This component has the toggle
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Use an environment variable for the backend API URL.
  // Make sure to set REACT_APP_API_URL in your frontend's .env file.
  const API_URL = process.env.REACT_APP_API_URL || "https://scheduling-application.onrender.com";

  // Handle first step: submit email and password to get OTP
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      setMessage(response.data.message);
      setError("");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed!");
    }
  };

  // Handle second step: submit OTP to verify and get JWT
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
      localStorage.setItem("token", response.data.access_token);
      setToken(response.data.access_token);
      setError("");
      navigate("/recruiter");
    } catch (err) {
      setError(err.response?.data?.error || "OTP verification failed!");
    }
  };

  return (
    <Container sx={{ mt: 5, maxWidth: "sm" }}>
      <Typography variant="h4" gutterBottom>
        Recruiter Login
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}
      {step === 1 ? (
        <form onSubmit={handleLoginSubmit}>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <PasswordField
            label="Password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Button variant="contained" fullWidth type="submit" sx={{ mt: 2 }}>
            Login
          </Button>
        </form>
      ) : (
        <form onSubmit={handleOTPSubmit}>
          <TextField
            label="Enter OTP"
            fullWidth
            margin="normal"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <Button variant="contained" fullWidth type="submit" sx={{ mt: 2 }}>
            Verify OTP
          </Button>
        </form>
      )}
    </Container>
  );
};

export default Login;