// src/pages/sections/CompanySlugManager.js

import React, { useState, useEffect } from "react";
import { Box, TextField, Button, Typography, CircularProgress, Alert } from "@mui/material";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function CompanySlugManager({ slug, onSlugChange, token, readOnly }) {
  const [value, setValue] = useState(slug || "");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setValue(slug || "");
    setAvailable(null);
    setError("");
    setDirty(false);
  }, [slug]);

  // Check slug availability
  const checkSlug = async (str) => {
    if (!str) {
      setAvailable(null);
      setError("");
      return;
    }
    setChecking(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_URL}/api/company/check-slug`, {
        params: { slug: str },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAvailable(data.available);
      setError(data.available ? "" : "This slug is already taken.");
    } catch (err) {
      setAvailable(false);
      setError("Error checking slug.");
    } finally {
      setChecking(false);
    }
  };

  // When typing
  const handleChange = (e) => {
    setValue(e.target.value);
    setDirty(true);
    setAvailable(null);
    setError("");
  };

  // When leaving the field or pressing check
  const handleBlur = () => {
    if (value && value !== slug) checkSlug(value);
  };

  // If manager submits a new slug
  const handleSetSlug = () => {
    if (!available) {
      setError("Please choose an available slug before saving.");
      return;
    }
    if (value && value !== slug) onSlugChange(value);
  };

  return (
    <Box sx={{ mt: 2, mb: 2, p: 2, background: "#fafbfc", borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Company Public Slug / Friendly URL
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        This sets your public booking link: <strong>https://yourapp.com/<span style={{color:'#1976d2'}}>{value || "<slug>"}</span></strong>
      </Typography>
      <TextField
        label="Company Slug"
        fullWidth
        disabled={!!readOnly}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        helperText={error || (available === true && dirty && "✅ This slug is available!")}
        error={!!error}
        InputProps={{
          endAdornment: checking ? <CircularProgress size={20} /> : null,
        }}
        sx={{ mb: 1 }}
      />
      {!readOnly && (
        <Button
          variant="contained"
          color="primary"
          disabled={checking || !dirty || !value || value === slug}
          onClick={handleSetSlug}
        >
          {slug ? "Update Slug" : "Set Slug"}
        </Button>
      )}
      {slug && value !== slug && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Changing your slug will break all old links! Existing clients will not be able to access your company via the old URL.
        </Alert>
      )}
    </Box>
  );
}
