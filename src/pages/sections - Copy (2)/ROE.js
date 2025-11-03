import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Paper,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  FormControlLabel,
  Checkbox,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import axios from "axios";
import { Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

// Accept "token" as a prop or however you are retrieving it
const ROE = ({ token }) => {
  // State for recruiters, new ROE form, and list of existing ROEs
  const [recruiters, setRecruiters] = useState([]);
  const [roeData, setRoeData] = useState([]);
  const [form, setForm] = useState({
    recruiter_id: "",
    last_day: "",
    hours: "",
    pay: "",
    reason: "",
    sin: "",
    employment_type: "Full-time",
    province: "ON",
    ei_deductions: true,
    cpp_qpp_deductions: true,
    income_tax_deductions: true,
  });
const PDFModal = ({ fileUrl, onClose }) => (
  <Dialog open={!!fileUrl} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>ROE PDF Preview</DialogTitle>
    <DialogContent>
      <div style={{ height: '80vh' }}>
        <Viewer fileUrl={fileUrl} />
      </div>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);
  // State for user feedback (success/error)
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // State for selecting a recruiter & fetching employee info
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Use your environment variable, or hardcode your API
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const updateRoeStatus = async (roeId, status) => {
    try {
      await axios.put(`${API_URL}/roe/${roeId}/update-status`, {
        status,
        comment: status === "rejected" ? "Rejected by manager" : ""
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRoeList(); // Refresh list
      setMessage(`ROE ${roeId} marked as ${status}.`);
      setError("");
    } catch (err) {
      console.error("Failed to update status", err);
      setError("Failed to update ROE status.");
      setMessage("");
    }
  };
  
  // Load recruiters on mount
  useEffect(() => {
    fetchRecruiters();
  }, []);

  // Once recruiters are loaded, fetch the ROE list
  useEffect(() => {
    if (recruiters.length > 0) {
      fetchRoeList();
    }
  }, [recruiters]);

  const fetchRecruiters = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiters(res.data.recruiters || []);
    } catch (err) {
      console.error("Failed to fetch recruiters:", err);
      setError("Failed to load recruiters.");
      setErrorMsg("Failed to load recruiters.");
    }
  };

  const fetchRoeList = async () => {
    try {
      const res = await axios.get(`${API_URL}/roe/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoeData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch ROEs", err);
      setError("Failed to fetch ROEs.");
    }
  };

  // Fetch details for a single employee (recruiter) when selected
  const fetchEmployeeInfo = async (recruiterId) => {
    setLoading(true);
    setEmployeeInfo(null);
    try {
      const res = await axios.get(`${API_URL}/manager/recruiter/${recruiterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployeeInfo(res.data);
    } catch (err) {
      console.error("Failed to fetch employee info:", err);
      setErrorMsg("Could not load employee info.");
    } finally {
      setLoading(false);
    }
  };

  // When user selects a recruiter from the dropdown
  const handleSelectChange = (e) => {
    const recruiterId = e.target.value;
    setSelectedRecruiter(recruiterId);
    setForm({ ...form, recruiter_id: recruiterId });
    if (recruiterId) {
      fetchEmployeeInfo(recruiterId);
    } else {
      setEmployeeInfo(null);
    }
  };

  // Handle form input changes for the new ROE
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Submit new ROE form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/roe/create`, { ...form, status: "approved" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("ROE successfully created.");
      setError("");
      fetchRoeList();
    } catch (err) {
      console.error("Failed to create ROE", err);
      setError("Failed to create ROE.");
      setMessage("");
    }
  };

  // Export PDF for a given ROE
  const handleExport = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/roe/${id}/export-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ROE_${id}.pdf`;
      a.click();
    } catch (err) {
      console.error("Failed to export PDF", err);
      setError("Failed to export PDF.");
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Record of Employment (ROE)
      </Typography>

      {/* Global success/error messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {/* Employee selection & details */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Select Employee</Typography>
        <TextField
          select
          label="Select Employee"
          name="recruiter_id"
          value={selectedRecruiter}
          onChange={handleSelectChange}
          fullWidth
          required
          sx={{ mb: 3 }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {recruiters.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.name} ({r.email})
            </MenuItem>
          ))}
        </TextField>

        {loading && <CircularProgress />}

        {employeeInfo && (
          <Box mt={3}>
            <Typography variant="h6">Employee Info</Typography>
            <Typography>Name: {employeeInfo.name}</Typography>
            <Typography>Email: {employeeInfo.email}</Typography>
            <Typography>Role: {employeeInfo.role}</Typography>
            <Typography>Status: {employeeInfo.status}</Typography>
            {/* Add more fields as needed */}
          </Box>
        )}
      </Paper>

      {/* Form to create a new ROE */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>New ROE</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Last Day"
                type="date"
                name="last_day"
                value={form.last_day}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Total Hours"
                type="number"
                name="hours"
                value={form.hours}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Total Pay"
                type="number"
                name="pay"
                value={form.pay}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Reason"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="SIN"
                name="sin"
                value={form.sin}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                select
                label="Employment Type"
                name="employment_type"
                value={form.employment_type}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                select
                label="Province"
                name="province"
                value={form.province}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="ON">Ontario</MenuItem>
                <MenuItem value="QC">Quebec</MenuItem>
                <MenuItem value="BC">British Columbia</MenuItem>
                <MenuItem value="AB">Alberta</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="ei_deductions"
                      checked={form.ei_deductions}
                      onChange={handleChange}
                    />
                  }
                  label="EI"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="cpp_qpp_deductions"
                      checked={form.cpp_qpp_deductions}
                      onChange={handleChange}
                    />
                  }
                  label="CPP/QPP"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="income_tax_deductions"
                      checked={form.income_tax_deductions}
                      onChange={handleChange}
                    />
                  }
                  label="Income Tax"
                />
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Create ROE
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Table to show existing ROEs */}
      <Typography variant="h6" gutterBottom>Existing ROEs</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Employee</TableCell>
            <TableCell>Last Day</TableCell>
            <TableCell>Hours</TableCell>
            <TableCell>Pay</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Issued</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {roeData.map((roe) => (
            <TableRow key={roe.id}>
              <TableCell>{roe.id}</TableCell>
              <TableCell>
                {
                  recruiters.find((r) => r.id === roe.recruiter_id)?.name
                  || roe.recruiter_id
                }
              </TableCell>
              <TableCell>{roe.last_day}</TableCell>
              <TableCell>{roe.hours}</TableCell>
              <TableCell>{roe.pay}</TableCell>
              <TableCell>
  <strong style={{
    color: roe.status === 'approved' ? 'green' :
           roe.status === 'rejected' ? 'red' :
           'orange'
  }}>
    {roe.status}
  </strong>
</TableCell>

              <TableCell>
                {roe.issued_at
                  ? new Date(roe.issued_at).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell>
  <Stack direction="row" spacing={1}>
  {roe.status === "approved" ? (
  <Button size="small" onClick={() => handleExport(roe.id)}>Export PDF</Button>
) : (
  <Typography variant="body2" color="textSecondary">Not exportable</Typography>
)}


  </Stack>
</TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Snackbar for error messages related to employee info */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={5000}
        onClose={() => setErrorMsg("")}
      >
        <Alert severity="error" onClose={() => setErrorMsg("")}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ROE;
