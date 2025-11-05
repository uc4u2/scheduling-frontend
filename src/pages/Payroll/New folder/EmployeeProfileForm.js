import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Button,
  Paper,
  Snackbar,
  Alert,
  CircularProgress
} from "@mui/material";
import axios from "axios";
import LaunchIcon from "@mui/icons-material/Launch";
import { Link as RouterLink } from "react-router-dom";

const EmployeeProfileForm = ({ token }) => {
  const [recruiters, setRecruiters] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [employee, setEmployee] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiters(res.data.recruiters || []);
    } catch (err) {
      console.error("Failed to load recruiters", err);
      setError("Could not load recruiter list.");
    }
  };

  const handleSelect = async (id) => {
    setSelectedId(id);
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/recruiters/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployee(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch employee", err);
      setError("Could not load employee profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee({ ...employee, [name]: value });
  };

  const handleSubmit = async () => {
    if (!employee || !selectedId) return;
    try {
      await axios.put(`${API_URL}/api/recruiters/${selectedId}`, employee, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("✅ Profile updated successfully");
      setError("");
    } catch (err) {
      console.error("Update failed", err);
      setError("Failed to update recruiter");
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Employee Profile Editor
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          component={RouterLink}
          to="/client/profile"
          variant="outlined"
          endIcon={<LaunchIcon fontSize="small" />}
          sx={{ textTransform: "none" }}
        >
          Open Candidate Profile
        </Button>
      </Box>

      <TextField
        select
        label="Select Employee"
        value={selectedId}
        onChange={(e) => handleSelect(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        {recruiters.map((r) => (
          <MenuItem key={r.id} value={r.id}>
            {r.name} ({r.email})
          </MenuItem>
        ))}
      </TextField>

      {loading && <CircularProgress sx={{ mb: 2 }} />}

      {employee && (
        <Paper sx={{ p: 3, mt: 2 }} elevation={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Full Name"
                name="name"
                value={employee.name || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                name="email"
                value={employee.email || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Phone"
                name="phone"
                value={employee.phone || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Department"
                name="department"
                value={employee.department || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Hourly Rate ($)"
                name="hourly_rate"
                type="number"
                value={employee.hourly_rate || 0}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Insurance Number"
                name="insurance_number"
                value={employee.insurance_number || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="SIN"
                name="sin"
                value={employee.sin || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Address"
                name="address"
                value={employee.address || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={handleSubmit}>
              Save Profile
            </Button>
          </Box>
        </Paper>
      )}

      {/* Feedback */}
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage("")}
      >
        <Alert onClose={() => setMessage("")} severity="success">{message}</Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError("")}
      >
        <Alert onClose={() => setError("")} severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeProfileForm;
