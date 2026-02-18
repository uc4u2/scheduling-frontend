import React, { useState } from "react";
import {
  Button,
  Alert,
  Box,
  Stack,
} from "@mui/material";
import PasswordField from "./PasswordField";
import { useNavigate, useLocation } from "react-router-dom";
import api from "./utils/api";
import AuthCardShell, { authButtonSx, authInputSx } from "./components/auth/AuthCardShell";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if it's a temporary password reset (e.g., from forced reset flow)
  const isTempReset = location.pathname.includes("/reset-password/temp");
  const searchParams = new URLSearchParams(location.search);
  const resetToken = searchParams.get("token");
  const resetType = searchParams.get("type") || "client";
  const isTokenReset = Boolean(resetToken);
  const currentPasswordFromState = location.state?.currentPassword || "";

  const [currentPassword, setCurrentPassword] = useState(currentPasswordFromState);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      let res;
      if (isTokenReset) {
        const endpoint = resetType === "recruiter" ? "/recruiter/reset-password" : "/reset-password";
        res = await api.post(endpoint, {
          token: resetToken,
          password: newPassword,
        }, { noAuth: true });
      } else {
        // Make API call to change password endpoint
        res = await api.post(
          `/change-password`,
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
      }

      setMessage(res.data.message || "Password updated successfully.");
      setError("");

      // Redirect after success, with a delay for user to read message
      setTimeout(() => {
        if (isTempReset || isTokenReset) {
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
    <AuthCardShell
      title={
        isTempReset
          ? "Set new password"
          : isTokenReset
          ? "Set new password"
          : "Reset your password"
      }
      subtitle="Use a strong password to secure your account access."
    >

      {isTempReset && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You are using a temporary password. Please set a new password to continue.
        </Alert>
      )}
      {isTokenReset && !isTempReset && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Set a new password to finish your reset.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
        {isTempReset && (
          <PasswordField
            label="Current Temporary Password"
            sx={authInputSx}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        )}

        <PasswordField
          label="New Password"
          sx={authInputSx}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <PasswordField
          label="Confirm New Password"
          sx={authInputSx}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <Box mt={1}>
          <Button variant="contained" fullWidth type="submit" sx={authButtonSx}>
            {isTempReset ? "Set Password" : "Reset Password"}
          </Button>
        </Box>
        </Stack>
      </form>
    </AuthCardShell>
  );
};

export default ResetPassword;
