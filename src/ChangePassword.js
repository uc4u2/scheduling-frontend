// ChangePassword.js
import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const handleChangePassword = async () => {
    setError("");
    setMessage("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/change-password`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(res.data.message);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password.");
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: "auto",
        mt: 8,
        p: 3,
      }}
    >
      <Paper sx={{ p: 3 }} elevation={3}>
        <Typography variant="h5" gutterBottom>
          Change Your Password
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}

        <TextField
          label="Current Password"
          type="password"
          fullWidth
          sx={{ mt: 2 }}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <TextField
          label="New Password"
          type="password"
          fullWidth
          sx={{ mt: 2 }}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <TextField
          label="Confirm New Password"
          type="password"
          fullWidth
          sx={{ mt: 2 }}
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
        />
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
          onClick={handleChangePassword}
        >
          Update Password
        </Button>
      </Paper>
    </Box>
  );
};

export default ChangePassword;
