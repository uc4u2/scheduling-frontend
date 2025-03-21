// src/ResetPassword.js
import React, { useState } from "react";
import { Container, Button, Alert, Typography, TextField } from "@mui/material";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  // Extract token from URL parameters
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const response = await axios.post("https://scheduling-application.onrender.com/reset-password", {
        token,
        new_password: newPassword,
      });
      setMessage(response.data.message);
      setError("");
      // Optionally, redirect to login after successful reset
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Reset password failed.");
    }
  };

  return (
    <Container sx={{ mt: 5, maxWidth: "sm" }}>
      <Typography variant="h4" gutterBottom>
        Reset Password
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <TextField
        label="New Password"
        type="password"
        fullWidth
        margin="normal"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <TextField
        label="Confirm New Password"
        type="password"
        fullWidth
        margin="normal"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <Button variant="contained" fullWidth onClick={handleReset} sx={{ mt: 2 }}>
        Reset Password
      </Button>
    </Container>
  );
};

export default ResetPassword;
