// src/pages/sections/CompanyProfile.js

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Snackbar,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import axios from "axios";

export default function CompanyProfile({ token }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const endpoint = `${API_URL}/admin/company-profile`;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        setForm(res.data);
      }
    } catch (err) {
      console.error("Error loading profile", err);
      showMessage("❌ Could not load company profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    const { name, email } = form;
    if (!name || !email) {
      showMessage("Name and Email are required.", "warning");
      return;
    }

    try {
      setSaving(true);
      const method = form?.id ? "put" : "post";
      await axios[method](endpoint, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage("✅ Company profile saved successfully", "success");
    } catch (err) {
      console.error("Save failed", err);
      showMessage("❌ Failed to save company profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Company Profile
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={form.name}
                onChange={handleChange("name")}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={form.phone}
                onChange={handleChange("phone")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                value={form.website}
                onChange={handleChange("website")}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={form.address}
                onChange={handleChange("address")}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Logo URL"
                value={form.logo_url}
                onChange={handleChange("logo_url")}
                helperText="Paste a direct image URL"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              {form.logo_url && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1,
                    border: "1px solid #ccc",
                    textAlign: "center",
                    height: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={form.logo_url}
                    alt="Logo Preview"
                    style={{ maxHeight: "60px", maxWidth: "100%" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/150x50?text=Logo";
                    }}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : "Save Company Profile"}
              </Button>
            </Grid>
          </Grid>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        autoHideDuration={3000}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
    </Box>
  );
}
