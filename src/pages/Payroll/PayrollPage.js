/*************************************************************************
 *
 *                 PAYROLL.js - Extended Example (Integrated)
 *
 *   Features added:
 *     1) Vacation Pay as a % of gross
 *     2) Mid-Year Hiring (start/end date read-only)
 *     3) RRSP / 401(k) deduction as %
 *     4) Quebec-specific fields (QPP, RQAP) if region=CA & province=QC
 *     5) Canada/US fields now expressed as % (CPP/EI or FICA/Medicare)
 *     6) Payslip Preview Modal, YTD Summary, Template Save/Load, Soft Warnings
 *
 *************************************************************************/

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { recalcNetPay, savePayroll, exportPayroll, updateDeductionFromPct } from "./netpay";

// ✅ Imports (make sure these exist at the top)
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

// Region choices

const REGIONS = [
  { value: "ca", label: "Canada" },
  { value: "us", label: "United States" },
  { value: "other", label: "Other" },
];

export default function Payroll({ token }) {
  // --------------------------------------------------------------
  // 1) State
  // --------------------------------------------------------------
  const [viewMode, setViewMode] = useState("preview");
  const [autoRecalc, setAutoRecalc] = useState(true);

  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState("");

  // Region can be "ca", "us", or "other"
  const [region, setRegion] = useState("ca");

  // The user picks a month
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));

  // Data for single payroll preview
  const [payroll, setPayroll] = useState(null);

  // Payslip history
  const [payslipHistory, setPayslipHistory] = useState([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Replaces old message/snackbarOpen with a single state object
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // ✅ Additional snippet states
  const [showPayslip, setShowPayslip] = useState(false);
  const [ytdTotals, setYtdTotals] = useState(null);

  // Adjust to your actual backend route
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const downloadExport = async (format, recruiterId, month, region, token) => {
    try {
      await exportPayroll({
        recruiter_id: recruiterId,
        month,
        region,
        format,
        columns: columnsToExport,
      }, token);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };
  
  const handleSavePayroll = async (data, token, region, month, recruiterId) => {
    const toSave = {
      ...data,
      payroll_id: data.id,

      region,
      month,
      recruiter_id: recruiterId,
      
    };
    await savePayroll(toSave, token);
  };
  
  // --------------------------------------------------------------
  // 2) Effects
  // --------------------------------------------------------------
  useEffect(() => {
    fetchRecruiters();
  }, []);

  useEffect(() => {
    if (viewMode === "history" && selectedRecruiter) {
      fetchPayslipHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedRecruiter]);

  // ✅ Add inside useEffect or when recruiter/month changes (fetch YTD):
  useEffect(() => {
    if (selectedRecruiter && month) {
      axios
        .get(`${API_URL}/payroll/ytd`, {
          params: {
            recruiter_id: selectedRecruiter,
            year: new Date().getFullYear(),
          },
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setYtdTotals(res.data))
        .catch((err) => console.error("YTD error:", err));
    }
  }, [selectedRecruiter, month]);

  // --------------------------------------------------------------
  // 3) Handlers / Functions
  // --------------------------------------------------------------

  // Utility to set the snackbar easily
  const showMessage = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch list of recruiters
  const fetchRecruiters = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        setRecruiters(res.data);
      } else {
        setRecruiters(res.data.recruiters || []);
      }
    } catch (error) {
      console.error("Failed to fetch recruiters", error);
      showMessage("❌ Could not load recruiter list.", "error");
    }
  };

  // Load payslip history for the chosen recruiter
  const fetchPayslipHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/payroll/history?recruiter_id=${selectedRecruiter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayslipHistory(res.data || []);
    } catch (err) {
      console.error("Failed to fetch payslip history:", err);
      showMessage("❌ Failed to fetch payslip history.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Switch between "preview" and "history"
  const handleChangeViewMode = (_, newMode) => {
    if (!newMode) return;
    setViewMode(newMode);
    if (newMode === "history") {
      setPayroll(null);
    } else {
      setPayslipHistory([]);
    }
  };

  const isEmpty = (v) => v === undefined || v === null || v === 0;

  const applyDefaultDeductions = (data) => {
    const updated = { ...data };

    if (region === "ca") {
      if (updated.province === "QC") {
        if (isEmpty(updated.qpp)) updated.qpp = 6.4;
        if (isEmpty(updated.ei)) updated.ei = 1.32;
        if (isEmpty(updated.rqap)) updated.rqap = 0.767;
      } else {
        if (isEmpty(updated.cpp)) updated.cpp = 5.95;
        if (isEmpty(updated.ei)) updated.ei = 1.66;
      }

      if (isEmpty(updated.retirement)) updated.retirement = 5.0;
    }

    if (region === "us") {
      if (isEmpty(updated.fica)) updated.fica = 6.2;
      if (isEmpty(updated.medicare)) updated.medicare = 1.45;
      if (isEmpty(updated.retirement)) updated.retirement = 5.0;
    }

    if (isEmpty(updated.vacation_percent)) updated.vacation_percent = 4.0;

    return updated;
  };

  // Preview button => calls backend
  const handlePreview = async () => {
    if (!selectedRecruiter) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/automation/payroll/generate`,
        { recruiter_id: selectedRecruiter, month, region },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // This is where we get the "payroll" object with new fields.
      setPayroll((prev) => {
        const merged = {
          ...res.data,
          name: res.data.recruiter_name || res.data.name || prev?.name || "",
          province: prev?.province || res.data.province || "",
        };
        const withDefaults = applyDefaultDeductions(merged);
        return withDefaults;
      });

      showMessage("✅ Payroll preview loaded.", "success");
    } catch (err) {
      console.error("Preview error:", err);
      showMessage("❌ Failed to fetch payroll preview.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Master "field change" handler
  const handleFieldChange = (field, newVal) => {
    if (!payroll) return;
  
    const isText = ["province", "start_date", "end_date", "name"].includes(field);
    const value = isText ? newVal : parseFloat(newVal) || 0;
  
    // Clone payroll
    let updated = { ...payroll, [field]: value };
  
    // Sync percentage to amount for deduction fields
    const percentFields = ["cpp", "ei", "qpp", "rqap", "fica", "medicare"];
    if (percentFields.includes(field)) {
      const amountField = `${field}_amount`;
      const gross = (updated.hours_worked || 0) * (updated.rate || 0);
      updated[amountField] = parseFloat(((gross * value) / 100).toFixed(2));
    }
  
    if (autoRecalc) {
      const recalcResults = recalcNetPay(updated, region);
      updated = { ...updated, ...recalcResults };
    }
    setPayroll(updated);
    
  };
  

  // Manual recalc if autoRecalc is off
  

  // The net pay calculation logic
  const handleExport = async (format) => {
    if (!payroll) return;
    try {
      // 1) persist the latest edits
      await handleSavePayroll(payroll, token, region, month, selectedRecruiter);
  
      // 1‑bis) small debounce to let the DB commit
      await new Promise(res => setTimeout(res, 300));   // 0.3 s is plenty locally
  
      // 2) now fetch the same row for export
      await downloadExport(format, selectedRecruiter, month, region, token);
  
      showMessage("✅ Export completed successfully.", "success");
    } catch (err) {
      console.error("Export error:", err);
      showMessage("❌ Failed to export payroll.", "error");
    }
  };
  

  // Save payroll
  const handleSave = async () => {
    if (!payroll) return;
    setSaving(true);
    try {
      await handleSavePayroll(payroll, token, region, month, selectedRecruiter);
      showMessage("✅ Payroll saved successfully.", "success");
    } catch (err) {
      console.error("Save error:", err);
      showMessage("❌ Failed to save payroll.", "error");
    } finally {
      setSaving(false);
    }
  };
  
// Define export columns
const columnsToExport = [
  "employee_name",          // changed from "name"
  "hours_worked",
  "rate",
  "gross_pay",
  "vacation_pay",
  "cpp_amount",
  "qpp_amount",
  "ei_amount",
  "rqap_amount",
  "fica_amount",
  "medicare_amount",
  "bonus",
  "commission",
  "tip",
  "tax_amount",
  "retirement_amount",
  "deduction",
  "total_deductions",
  "net_pay"
];


// Download export (CSV/XLSX/PDF)
const recalcNetPayManual = () => {
  if (!payroll) return;
  let updated = { ...payroll };
  const recalcResults = recalcNetPay(updated, region);
  updated = { ...updated, ...recalcResults };
  setPayroll(updated);
};



// Optional: currency formatting helper
const formatCurrency = (val) => {
  const num = Number(val);
  return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
};


  // --------------------------------------------------------------
  // 4) Render
  // --------------------------------------------------------------
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Payroll Management
      </Typography>

      {/* PREVIEW vs HISTORY Toggle */}
      <ToggleButtonGroup
        color="primary"
        value={viewMode}
        exclusive
        onChange={handleChangeViewMode}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="preview">Preview</ToggleButton>
        <ToggleButton value="history">History</ToggleButton>
      </ToggleButtonGroup>

      {/* Filter Row */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        {/* Employee selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="recruiter-label">Employee</InputLabel>
            <Select
              labelId="recruiter-label"
              value={selectedRecruiter}
              label="Recruiter"
              onChange={(e) => setSelectedRecruiter(e.target.value)}
            >
              <MenuItem value="">-- None --</MenuItem>
              {recruiters.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select an Employee</FormHelperText>
          </FormControl>
        </Grid>

        {/* Month */}
        <Grid item xs={12} md={4}>
          <TextField
            type="month"
            label="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Select a month"
          />
        </Grid>

        {/* Region */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="region-label">Region</InputLabel>
            <Select
              labelId="region-label"
              value={region}
              label="Region"
              onChange={(e) => setRegion(e.target.value)}
            >
              {REGIONS.map((rg) => (
                <MenuItem key={rg.value} value={rg.value}>
                  {rg.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Choose region for payroll</FormHelperText>
          </FormControl>
        </Grid>

        {/* Load preview */}
        {viewMode === "preview" && (
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handlePreview}
              disabled={!selectedRecruiter || loading}
            >
              {loading ? <CircularProgress size={24} /> : "Load Preview"}
            </Button>
          </Grid>
        )}
      </Grid>
    </Paper>

    {/* ─────────────────────────────── PREVIEW MODE ────────────────────────────── */}
    {viewMode === "preview" && payroll && (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Payroll Preview for {payroll.name || "--"}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {/* Auto‑recalc toggle */}
        <FormControlLabel
          control={
            <Checkbox
              checked={autoRecalc}
              onChange={() => setAutoRecalc(!autoRecalc)}
            />
          }
          label="Auto‑recalculate Net Pay on each change?"
        />
        {!autoRecalc && (
          <Button variant="outlined" onClick={recalcNetPayManual} sx={{ ml: 2 }}>
            Recalculate Now
          </Button>
        )}

        <Divider sx={{ my: 2 }} />

        {/* ─────────────────────────────── BASIC INFO ─────────────────────────────── */}
        <Grid container spacing={2}>
          {/* Hiring Date */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Hiring Date"
              type="date"
              value={payroll.start_date || ""}
              onChange={(e) =>
                handleFieldChange("start_date", e.target.value)
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="For mid‑year proration"
            />
          </Grid>
          {/* End Date */}
          <Grid item xs={12} md={3}>
            <TextField
              label="End Date"
              type="date"
              value={payroll.end_date || ""}
              onChange={(e) => handleFieldChange("end_date", e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Leave blank if still active"
            />
          </Grid>
          {/* Province (Canada only) */}
          {region === "ca" && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="province-label">Province</InputLabel>
                <Select
                  labelId="province-label"
                  value={payroll.province || ""}
                  label="Province"
                  onChange={(e) =>
                    handleFieldChange("province", e.target.value)
                  }
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {[
                    ["AB", "Alberta"],
                    ["BC", "British Columbia"],
                    ["MB", "Manitoba"],
                    ["NB", "New Brunswick"],
                    ["NL", "Newfoundland and Labrador"],
                    ["NS", "Nova Scotia"],
                    ["NT", "Northwest Territories"],
                    ["NU", "Nunavut"],
                    ["ON", "Ontario"],
                    ["PE", "Prince Edward Island"],
                    ["QC", "Quebec"],
                    ["SK", "Saskatchewan"],
                    ["YT", "Yukon"],
                  ].map(([val, label]) => (
                    <MenuItem key={val} value={val}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Used for deductions (e.g., QPP in QC)
                </FormHelperText>
              </FormControl>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* ─────────────────────────────── PAY DETAILS ────────────────────────────── */}
        <Typography variant="h6" sx={{ mb: 1 }}>
          Pay Details
        </Typography>
        <Grid container spacing={2}>
          {/* Employee Name */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Employee Name"
              value={payroll.name || ""}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Grid>

          {/* Hours Worked */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Hours Worked"
              value={payroll.hours_worked || 0}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Grid>

          {/* Hourly Rate */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Hourly Rate"
              type="number"
              value={payroll.rate || 0}
              onChange={(e) => handleFieldChange("rate", e.target.value)}
              fullWidth
            />
          </Grid>

          {/* Gross Pay */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Gross Pay"
              value={formatCurrency(payroll.gross_pay)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Grid>

          {/* Vacation Pay ($) */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Vacation Pay ($)"
              type="number"
              value={payroll.vacation_pay || 0}
              onChange={(e) =>
                handleFieldChange("vacation_pay", e.target.value)
              }
              fullWidth
            />
          </Grid>

          {/* Commission ($) */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Commission ($)"
              type="number"
              value={payroll.commission || 0}
              onChange={(e) =>
                handleFieldChange("commission", e.target.value)
              }
              fullWidth
            />
          </Grid>

          {/* Bonus ($) */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Bonus ($)"
              type="number"
              value={payroll.bonus || 0}
              onChange={(e) => handleFieldChange("bonus", e.target.value)}
              fullWidth
            />
          </Grid>

          {/* Tip ($) */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Tip ($)"
              type="number"
              value={payroll.tip || 0}
              onChange={(e) => handleFieldChange("tip", e.target.value)}
              fullWidth
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

       {/* ─────────────────────────────── DEDUCTIONS ────────────────────────────── */}
<Typography variant="h6" sx={{ mb: 1 }}>
  Deductions
</Typography>
<Grid container spacing={2}>
  {/* Canada-specific */}
  {region === "ca" &&
    (payroll.province === "QC" ? (
      <>
        {/* QPP (%) + Amount */}
        <Grid item xs={12} md={3}>
          <TextField
            label="QPP (%)"
            type="number"
            value={payroll.qpp || 0}
            onChange={(e) => handleFieldChange("qpp", e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="QPP Amount ($)"
            value={formatCurrency((payroll.hours_worked || 0) * (payroll.rate || 0) * (payroll.qpp || 0) / 100)}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>

        {/* EI (%) + Amount */}
        <Grid item xs={12} md={3}>
          <TextField
            label="EI (%)"
            type="number"
            value={payroll.ei || 0}
            onChange={(e) => handleFieldChange("ei", e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="EI Amount ($)"
            value={formatCurrency((payroll.hours_worked || 0) * (payroll.rate || 0) * (payroll.ei || 0) / 100)}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>

        {/* RQAP (%) + Amount */}
        <Grid item xs={12} md={3}>
          <TextField
            label="RQAP (%)"
            type="number"
            value={payroll.rqap || 0}
            onChange={(e) => handleFieldChange("rqap", e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="RQAP Amount ($)"
            value={formatCurrency((payroll.hours_worked || 0) * (payroll.rate || 0) * (payroll.rqap || 0) / 100)}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>
      </>
    ) : (
      <>
        {/* CPP (%) + Amount */}
        <Grid item xs={12} md={3}>
          <TextField
            label="CPP (%)"
            type="number"
            value={payroll.cpp || 0}
            onChange={(e) => handleFieldChange("cpp", e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="CPP Amount ($)"
            value={formatCurrency((payroll.hours_worked || 0) * (payroll.rate || 0) * (payroll.cpp || 0) / 100)}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>

        {/* EI (%) + Amount */}
        <Grid item xs={12} md={3}>
          <TextField
            label="EI (%)"
            type="number"
            value={payroll.ei || 0}
            onChange={(e) => handleFieldChange("ei", e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="EI Amount ($)"
            value={formatCurrency((payroll.hours_worked || 0) * (payroll.rate || 0) * (payroll.ei || 0) / 100)}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>
      </>
    ))}

  {/* US-specific */}
  {region === "us" && (
    <>
      {/* FICA (%) + Amount */}
      <Grid item xs={12} md={3}>
        <TextField
          label="FICA (%)"
          type="number"
          value={payroll.fica || 0}
          onChange={(e) => handleFieldChange("fica", e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          label="FICA Amount ($)"
          value={formatCurrency((payroll.hours_worked || 0) * (payroll.rate || 0) * (payroll.fica || 0) / 100)}
          fullWidth
          InputProps={{ readOnly: true }}
        />
      </Grid>

      {/* Medicare (%) + Amount */}
      <Grid item xs={12} md={3}>
        <TextField
          label="Medicare (%)"
          type="number"
          value={payroll.medicare || 0}
          onChange={(e) => handleFieldChange("medicare", e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          label="Medicare Amount ($)"
          value={formatCurrency((payroll.hours_worked || 0) * (payroll.rate || 0) * (payroll.medicare || 0) / 100)}
          fullWidth
          InputProps={{ readOnly: true }}
        />
      </Grid>
    </>
  )}

  {/* Vacation % */}
  <Grid item xs={12} md={3}>
    <TextField
      label="Vacation (%)"
      type="number"
      value={payroll.vacation_percent || 0}
      onChange={(e) => handleFieldChange("vacation_percent", e.target.value)}
      fullWidth
      helperText="Percentage of gross pay"
    />
  </Grid>

  {/* Retirement ($) */}
  <Grid item xs={12} md={3}>
    <TextField
      label={region === "ca" ? "RRSP Amount ($)" : region === "us" ? "401(k) Amount ($)" : "Retirement Amount ($)"}
      type="number"
      value={payroll.retirement_amount || 0}
      onChange={(e) => handleFieldChange("retirement_amount", e.target.value)}
      fullWidth
    />
  </Grid>

  {/* Other Deduction */}
  <Grid item xs={12} md={3}>
    <TextField
      label="Other Deduction ($)"
      type="number"
      value={payroll.deduction || 0}
      onChange={(e) => handleFieldChange("deduction", e.target.value)}
      fullWidth
    />
  </Grid>

  {/* Tax Amount */}
  <Grid item xs={12} md={3}>
    <TextField
      label="Tax Amount ($)"
      type="number"
      value={payroll.tax_amount || 0}
      onChange={(e) => handleFieldChange("tax_amount", e.target.value)}
      fullWidth
    />
  </Grid>
</Grid>

<Divider sx={{ my: 2 }} />

{/* ─────────────────────────────── SUMMARY ─────────────────────────────── */}
<Grid container spacing={2}>
  <Grid item xs={12} md={3}>
    <TextField
      label="Total Deductions ($)"
      value={formatCurrency(payroll.total_deductions)}
      InputProps={{ readOnly: true }}
      fullWidth
    />
  </Grid>
  <Grid item xs={12} md={3}>
    <TextField
      label="Net Pay ($)"
      value={formatCurrency(payroll.net_pay)}
      InputProps={{ readOnly: true }}
      fullWidth
    />
  </Grid>
</Grid>

          {ytdTotals && (
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1">Year-to-Date Summary</Typography>
              <Typography>Gross: ${ytdTotals.gross_pay}</Typography>
<Typography>Tax Paid: ${ytdTotals.tax}</Typography>
<Typography>Vacation Paid: ${ytdTotals.vacation_pay}</Typography>
<Typography>RRSP/401(k): ${ytdTotals.retirement}</Typography>

            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Save + Export */}
          <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : "Save Payroll"}
            </Button>
            <Button variant="outlined" onClick={() => handleExport("csv")}>
            Export CSV
            </Button>
            <Button variant="outlined" onClick={() => handleExport("xlsx")}>
            Export XLSX
            </Button>
            <Button variant="outlined" onClick={() => handleExport("pdf")}>
            Export PDF
            </Button>
          </Box>

          {/* ✅ Add Payslip Preview modal trigger */}
          <Box sx={{ my: 2 }}>
            <Button variant="outlined" onClick={() => setShowPayslip(true)}>
              Preview Payslip
            </Button>
          </Box>

          {/* ✅ Save + Load Payroll Template (LocalStorage) */}
          <Box sx={{ display: "flex", gap: 1, my: 1 }}>
            <Button
              onClick={() => {
                localStorage.setItem(
                  `payroll-template-${selectedRecruiter}-${month}`,
                  JSON.stringify(payroll)
                );
                setSnackbar({
                  open: true,
                  message: "Template saved",
                  severity: "success",
                });
              }}
            >
              📂 Save Template
            </Button>
            <Button
              onClick={() => {
                const data = localStorage.getItem(
                  `payroll-template-${selectedRecruiter}-${month}`
                );
                if (data) {
                  setPayroll(JSON.parse(data));
                  setSnackbar({
                    open: true,
                    message: "Template loaded",
                    severity: "info",
                  });
                } else {
                  setSnackbar({
                    open: true,
                    message: "No saved template",
                    severity: "warning",
                  });
                }
              }}
            >
              💾 Load Last
            </Button>
          </Box>

          {/* ✅ Soft Validation Warnings */}
          {payroll?.vacation_percent > 10 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              Vacation pay exceeds 10% — double check this amount.
            </Alert>
          )}
          {!payroll?.province && region === "ca" && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              Province is not selected — deductions may be incorrect.
            </Alert>
          )}
          {payroll?.tax === 0 && (
            <Alert severity="info" sx={{ mb: 1 }}>
              Tax is 0%. Is this correct?
            </Alert>
          )}
        </Paper>
      )}

      {/* HISTORY MODE */}
      {viewMode === "history" && selectedRecruiter && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Payslip History for Recruiter #{selectedRecruiter}
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {payslipHistory.length === 0 ? (
                <Alert severity="info">No payslips found.</Alert>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
                      <th style={{ padding: "8px" }}>Month</th>
                      <th style={{ padding: "8px" }}>Gross</th>
                      <th style={{ padding: "8px" }}>Net</th>
                      <th style={{ padding: "8px" }}>Download PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslipHistory.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "8px" }}>{p.month}</td>
                        <td style={{ padding: "8px" }}>
                          {formatCurrency(p.gross_pay)}
                        </td>
                        <td style={{ padding: "8px" }}>
                          {formatCurrency(p.net_pay)}
                        </td>
                        <td style={{ padding: "8px" }}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              // example only
                              const url = `${API_URL}/automation/payroll/payslip-pdf?recruiter_id=${selectedRecruiter}&month=${month}&region=${region}`;
window.open(url, "_blank");

                            }}
                          >
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* ✅ Payslip Modal */}
      <Dialog
        open={showPayslip}
        onClose={() => setShowPayslip(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Payslip Preview</DialogTitle>
        <DialogContent>
          <Typography variant="h6">
            Employee: {payroll?.name || "(No name)"}
          </Typography>
          <Typography variant="body2">Pay Period: {month}</Typography>
          <Box sx={{ mt: 2 }}>
          <Typography>Gross Pay: {formatCurrency(payroll?.gross_pay)}</Typography>

            <Typography>Vacation Pay: {payroll?.vacation_percent || 0}%</Typography>
            <Typography>Tax: {payroll?.tax || 0}%</Typography>
            <Typography>Net Pay: {formatCurrency(payroll?.net_pay)}</Typography>

          </Box>
        </DialogContent>
      </Dialog>

      {/* ✅ Snackbar Alert (at bottom of render) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
    </Box>
  );
}
