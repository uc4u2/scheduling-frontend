// src/pages/client/ClientProfileSettings.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Stack,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ClientProfileSettings() {
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/profile`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setProfile(data || {});
        setForm(data || {});
      } catch (err) {
        setError("We couldn't load your profile details just now.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put(`${API_URL}/profile`, form, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setProfile(form);
      setError("");
      alert("Profile updated.");
    } catch (err) {
      setError("We couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Profile Settings
      </Typography>
      {error && (
        <Alert severity="warning" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Stack spacing={2}>
          <TextField
            label="First Name"
            name="first_name"
            value={form.first_name || ""}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Last Name"
            name="last_name"
            value={form.last_name || ""}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Email"
            name="email"
            value={form.email || ""}
            onChange={handleChange}
            fullWidth
            disabled
          />
          <TextField
            label="Phone"
            name="phone"
            value={form.phone || ""}
            onChange={handleChange}
            fullWidth
          />
          <Box>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}
