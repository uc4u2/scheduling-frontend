import React, { useState } from "react";
import {
  Container,
  Button,
  Alert,
  Typography,
  Box,
} from "@mui/material";
import PasswordField from "./PasswordField";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if it's a temporary password reset (e.g., from forced reset flow)
  const isTempReset = location.pathname.includes("/reset-password/temp");
  const currentPasswordFromState = location.state?.currentPassword || "";

  const [currentPassword, setCurrentPassword] = useState(currentPasswordFromState);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (isTempReset && !currentPassword) {
      setError("Current (temporary) password is required.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // Make API call to change password endpoint
      const res = await axios.post(
        `${API_URL}/change-password`,
        {
          current_password: isTempReset ? currentPassword : undefined,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessage(res.data.message || "Password updated successfully.");
      setError("");

      // Redirect after success, with a delay for user to read message
      setTimeout(() => {
        if (isTempReset) {
          navigate("/login");
        } else {
          // Navigate to dashboard or wherever appropriate
          navigate("/dashboard");
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Password change failed.");
      setMessage("");
    }
  };

  return (
    <Container sx={{ mt: 6, maxWidth: "sm" }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        {isTempReset ? "Set New Password (Temporary Reset)" : "Reset Your Password"}
      </Typography>

      {isTempReset && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You are using a temporary password. Please set a new password to continue.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <form onSubmit={handleSubmit}>
        {isTempReset && (
          <PasswordField
            label="Current Temporary Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        )}

        <PasswordField
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <PasswordField
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <Box mt={3}>
          <Button variant="contained" fullWidth type="submit">
            {isTempReset ? "Set Password" : "Reset Password"}
          </Button>
        </Box>
      </form>
    </Container>
  );
};

export default ResetPassword;
