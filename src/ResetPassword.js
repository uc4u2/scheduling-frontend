import React, { useState } from "react";
import {
  Button,
  Alert,
  Box,
  Stack,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PasswordField from "./PasswordField";
import { useNavigate, useLocation } from "react-router-dom";
import api from "./utils/api";
import AuthCardShell, { authButtonSx, authInputSx } from "./components/auth/AuthCardShell";
import { buildMarketingUrl } from "./config/origins";

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
  const [submitting, setSubmitting] = useState(false);

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
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardShell
      eyebrow={isTempReset ? "Password refresh" : isTokenReset ? "Secure reset" : "Password settings"}
      title={
        isTempReset
          ? "Set new password"
          : isTokenReset
          ? "Set new password"
          : "Reset your password"
      }
      subtitle="Use a strong password to secure your account access."
      heroTitle={
        isTempReset
          ? "Replace temporary access with a permanent password."
          : isTokenReset
          ? "Finish your password reset and get back into your workspace."
          : "Update your password without breaking your workflow."
      }
      heroSubtitle={
        isTempReset
          ? "Schedulaa keeps first-time security updates clear so you can finish setup and return to operations."
          : isTokenReset
          ? "Schedulaa keeps password recovery fast so bookings, staffing, and client access stay on track."
          : "Schedulaa keeps account protection simple while your scheduling and business operations keep moving."
      }
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

      <Stack component="form" spacing={2.5} onSubmit={handleSubmit} noValidate>
        <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1.2 }}>
          Password security
        </Typography>

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

        <Box mt={0.5}>
          <Button variant="contained" fullWidth type="submit" disabled={submitting} sx={authButtonSx}>
            {submitting
              ? isTempReset
                ? "Saving password..."
                : "Resetting password..."
              : isTempReset
              ? "Set Password"
              : "Reset Password"}
          </Button>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={0.75}
          justifyContent="center"
          alignItems="center"
          sx={{
            pt: 1,
            borderTop: "1px solid rgba(226,232,240,0.9)",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Need a different account action?
          </Typography>
          <MuiLink component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 700 }}>
            Back to sign in
          </MuiLink>
        </Stack>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          <MuiLink href={buildMarketingUrl("/en")} sx={{ fontWeight: 600 }}>
            Back to website
          </MuiLink>
        </Typography>
      </Stack>
    </AuthCardShell>
  );
};

export default ResetPassword;
