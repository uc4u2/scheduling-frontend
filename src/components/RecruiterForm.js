// src/components/RecruiterForm.js

import React, { useState, useEffect } from "react";
import {
  Box, TextField, Button, MenuItem, Typography
} from "@mui/material";
import axios from "axios";

const RecruiterForm = () => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "recruiter",
    timezone: "UTC",
    manager_id: ""
  });

  const [managers, setManagers] = useState([]);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(res.data.recruiters || []);
    } catch (err) {
      console.error("Error fetching managers:", err);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/manager/recruiters`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Recruiter added successfully!");
      setFormData({ name: "", email: "", role: "recruiter", timezone: "UTC", manager_id: "" });
    } catch (err) {
      console.error("Error adding recruiter:", err);
      alert("Failed to add recruiter.");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500 }}>
      <TextField
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        fullWidth
        required
        sx={{ mb: 2 }}
      />
      <TextField
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        fullWidth
        required
        sx={{ mb: 2 }}
      />
      <TextField
        label="Role"
        name="role"
        value={formData.role}
        onChange={handleChange}
        select
        fullWidth
        sx={{ mb: 2 }}
      >
        <MenuItem value="recruiter">Recruiter</MenuItem>
        <MenuItem value="manager">Manager</MenuItem>
      </TextField>
      <TextField
        label="Timezone"
        name="timezone"
        value={formData.timezone}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Manager"
        name="manager_id"
        value={formData.manager_id}
        onChange={handleChange}
        select
        fullWidth
        sx={{ mb: 2 }}
      >
        <MenuItem value="">None (top-level)</MenuItem>
        {managers.map((mgr) => (
          <MenuItem key={mgr.id} value={mgr.id}>
            {mgr.name} ({mgr.email})
          </MenuItem>
        ))}
      </TextField>
      <Button type="submit" variant="contained" fullWidth>
        Add Recruiter
      </Button>
    </Box>
  );
};

export default RecruiterForm;
