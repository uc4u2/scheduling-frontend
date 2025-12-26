import React, { useEffect, useState } from "react";
import {
  Box, TextField, Button, Typography, Avatar, CircularProgress, Alert, Stack, Paper
} from "@mui/material";
import api from "../../utils/api";

export default function ClientProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("token");
    api.get("/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setProfile(res.data);
        setForm({
          name: res.data.name || "",
          phone: res.data.phone || "",
        });
      })
      .catch(e => setError(e?.response?.data?.error || "Could not load profile"))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    const token = localStorage.getItem("token");
    api.put("/me", form, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => setSuccess("Profile updated!"))
      .catch(e => setError(e?.response?.data?.error || "Update failed"))
      .finally(() => setSaving(false));
  }

  if (loading) return <Box sx={{ textAlign: "center", mt: 4 }}><CircularProgress /></Box>;
  if (error && !profile) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 420, mx: "auto", mt: 4 }}>
      <Stack spacing={2} alignItems="center">
        <Avatar sx={{ width: 64, height: 64, mb: 1 }}>
          {profile?.name?.[0]?.toUpperCase() || "C"}
        </Avatar>
        <Typography variant="h5" gutterBottom>My Profile</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          <TextField
            name="name"
            label="Full Name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            name="email"
            label="Email"
            value={profile?.email || ""}
            disabled
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            name="phone"
            label="Phone"
            value={form.phone}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={saving}
            fullWidth
            sx={{ mt: 1 }}
          >
            {saving ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
