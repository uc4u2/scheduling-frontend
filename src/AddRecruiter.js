// src/AddRecruiter.js
import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Alert, Box, MenuItem } from "@mui/material";

/* one authoritative helper for the current zone */
import { getUserTimezone } from "./utils/timezone";   // ← adjust if the path differs

const AddRecruiter = () => {
  /* initial form state */
  const [form, setForm] = useState({
    name: "",
    email: "",
    timezone: getUserTimezone(),     // default to viewer’s zone
    role: "Recruiter",
    department: "General",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const managerId = localStorage.getItem("user_id");

      const { data } = await axios.post(
        "/register",
        {
          ...form,
          manager_id: managerId,
          password: "TempPass123!",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage(data.message || "✅ Recruiter added successfully.");
      setError("");
      setForm({
        name: "",
        email: "",
        timezone: getUserTimezone(),  // reset to viewer’s zone again
        role: "Recruiter",
        department: "General",
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "❌ Failed to add recruiter");
      setMessage("");
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 3 }}>
      <h3>Add New Recruiter</h3>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          label="Full Name"
          fullWidth
          required
          value={form.name}
          onChange={handleChange("name")}
          margin="normal"
        />

        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          value={form.email}
          onChange={handleChange("email")}
          margin="normal"
        />

        <TextField
          label="Department"
          fullWidth
          required
          value={form.department}
          onChange={handleChange("department")}
          margin="normal"
          placeholder="e.g. Sales, Tech, HR"
        />

        <TextField
          label="Role"
          fullWidth
          select
          value={form.role}
          onChange={handleChange("role")}
          margin="normal"
        >
          <MenuItem value="Recruiter">Recruiter</MenuItem>
          <MenuItem value="Senior">Senior</MenuItem>
          <MenuItem value="Manager">Manager</MenuItem>
        </TextField>

        <TextField
          label="Timezone"
          fullWidth
          value={form.timezone}
          onChange={handleChange("timezone")}
          margin="normal"
          helperText="IANA name, e.g. America/Toronto"
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Add Recruiter
        </Button>
      </form>
    </Box>
  );
};

export default AddRecruiter;
