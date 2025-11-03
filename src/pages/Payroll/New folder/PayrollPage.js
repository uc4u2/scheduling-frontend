import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  MenuItem,
  TextField,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
} from "@mui/material";
import axios from "axios";
import RegionSelector from "./RegionSelector";
import PayrollForm from "./PayrollForm";
import DeductionFields from "./DeductionFields";
import PayslipPreviewModal from "./PayslipPreviewModal";
import { calculatePayroll } from "./helpers/taxCalculator";

const initialPayroll = {
  employee_id: "",
  employee_name: "",
  hours_worked: 0,
  rate: 0,
  bonus: 0,
  commission: 0,
  tip: 0,
  region: "ca",
  province: "on",
  start_date: "",
  end_date: "",
};

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function PayrollPage({ token }) {
  const [payroll, setPayroll] = useState(initialPayroll);
  const [region, setRegion] = useState("ca");
  const [province, setProvince] = useState("on");
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setRecruiters(res.data.recruiters || []);
      })
      .catch((err) => {
        console.error("Failed to load recruiters", err);
        setError("Could not load recruiter list.");
      });
  }, [token]);

  const handleEmployeeSelect = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/recruiters/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const emp = res.data;
      setPayroll((prev) => ({
        ...prev,
        employee_id: id,
        employee_name: emp.name || "",
        rate: emp.hourly_rate || 0,
      }));
    } catch (err) {
      console.error("Failed to fetch employee", err);
      setError("Could not load employee profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setPayroll((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegionChange = (newRegion, newProvince) => {
    setRegion(newRegion);
    setProvince(newProvince);
    setPayroll((prev) => ({
      ...prev,
      region: newRegion,
      province: newProvince,
    }));
  };

  const handleLoadPayroll = async () => {
    if (!payroll.employee_id || !payroll.start_date || !payroll.end_date) {
      return setError("Please select an employee and date range.");
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/payroll/full-compute`,
        {
          employee_id: payroll.employee_id,
          start_date: payroll.start_date,
          end_date: payroll.end_date,
          region,
          province,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPayroll((prev) => ({
        ...prev,
        ...res.data,
      }));
    } catch (err) {
      console.error("Failed to load payroll", err);
      setError("Could not calculate payroll.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayroll = async () => {
    try {
      await axios.post(`${API_URL}/api/payroll/submit`, payroll, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Payroll saved successfully.");
    } catch (err) {
      console.error("Failed to save payroll", err);
      alert("❌ Could not save payroll.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Payroll Management
      </Typography>

      <TextField
        select
        label="Select Employee"
        value={payroll.employee_id}
        onChange={(e) => handleEmployeeSelect(e.target.value)}
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

      {payroll.employee_id && (
        <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                value={payroll.start_date}
                onChange={(e) => handleFieldChange("start_date", e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                type="date"
                value={payroll.end_date}
                onChange={(e) => handleFieldChange("end_date", e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" onClick={handleLoadPayroll}>
                Load Payroll Data
              </Button>
            </Grid>
          </Grid>

          <RegionSelector
            region={region}
            province={province}
            onChange={handleRegionChange}
          />

          <PayrollForm payroll={payroll} onChange={handleFieldChange} />
          <DeductionFields
            payroll={payroll}
            onChange={handleFieldChange}
            region={region}
          />

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={() => setShowPreview(true)}>
              Preview Payslip
            </Button>
            <Button variant="contained" color="success" onClick={handleSavePayroll}>
              Save Payroll
            </Button>
          </Box>
        </Paper>
      )}

      <PayslipPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        payroll={payroll}
      />

      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError("")}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
