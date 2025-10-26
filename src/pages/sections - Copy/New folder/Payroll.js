import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Button,
} from "@mui/material";

import PayrollFilters from "./PayrollFilters";
import PayrollPreview from "./PayrollPreview";
import PayslipModal from "./PayslipModal";

import {
  recalcNetPay,
  savePayroll,
  exportPayroll,
} from "./netpay";

// ---------------- Constants ----------------
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const columnsToExport = [
  "employee_name",
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
  "net_pay",
];

// ---------------- Component ----------------
export default function Payroll({ token }) {
  const [viewMode, setViewMode] = useState("preview");
  const [autoRecalc, setAutoRecalc] = useState(true);
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [region, setRegion] = useState("ca");
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));

  const [payroll, setPayroll] = useState(null);
  const [payslipHistory, setPayslipHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPayslip, setShowPayslip] = useState(false);
  const [ytdTotals, setYtdTotals] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // ---------------- Effects ----------------
  useEffect(() => {
    fetchRecruiters();
  }, []);

  useEffect(() => {
    if (viewMode === "history" && selectedRecruiter) {
      fetchPayslipHistory();
    }
  }, [viewMode, selectedRecruiter]);

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

  // ---------------- API + Utils ----------------
  const fetchRecruiters = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiters(Array.isArray(res.data) ? res.data : res.data.recruiters || []);
    } catch (error) {
      console.error("Failed to fetch recruiters", error);
      showMessage("❌ Could not load recruiter list.", "error");
    }
  };

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

  const handleSavePayroll = async (data) => {
    const toSave = {
      ...data,
      payroll_id: data.id,
      region,
      month,
      recruiter_id: selectedRecruiter,
    };
    await savePayroll(toSave, token);
  };

  const downloadExport = async (format) => {
    try {
      await exportPayroll({
        recruiter_id: selectedRecruiter,
        month,
        region,
        format,
        columns: columnsToExport,
      }, token);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const applyDefaultDeductions = (data) => {
    const updated = { ...data };
    const isEmpty = (v) => v === undefined || v === null || v === 0;

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

  // ---------------- Handlers ----------------
  const showMessage = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChangeViewMode = (_, newMode) => {
    if (!newMode) return;
    setViewMode(newMode);
    setPayroll(null);
    setPayslipHistory([]);
  };

  const handlePreview = async () => {
    if (!selectedRecruiter) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/automation/payroll/generate`,
        { recruiter_id: selectedRecruiter, month, region },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const merged = {
        ...res.data,
        name: res.data.recruiter_name || res.data.name || "",
        province: res.data.province || "",
      };

      const withDefaults = applyDefaultDeductions(merged);
      const recalc = recalcNetPay(withDefaults, region);
      setPayroll({ ...withDefaults, ...recalc });

      showMessage("✅ Payroll preview loaded.", "success");
    } catch (err) {
      console.error("Preview error:", err);
      showMessage("❌ Failed to fetch payroll preview.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, newVal) => {
    if (!payroll) return;

    const isText = ["province", "start_date", "end_date", "name"].includes(field);
    const value = isText ? newVal : parseFloat(newVal) || 0;

    let updated = { ...payroll, [field]: value };

    const percentFields = ["cpp", "ei", "qpp", "rqap", "fica", "medicare"];
    if (percentFields.includes(field)) {
      const gross = (updated.hours_worked || 0) * (updated.rate || 0);
      const amountField = `${field}_amount`;
      updated[amountField] = parseFloat(((gross * value) / 100).toFixed(2));
    }

    if (autoRecalc) {
      updated = { ...updated, ...recalcNetPay(updated, region) };
    }

    setPayroll(updated);
  };

  const recalcNetPayManual = () => {
    if (!payroll) return;
    const updated = { ...payroll, ...recalcNetPay(payroll, region) };
    setPayroll(updated);
  };

  const handleSave = async () => {
    if (!payroll) return;
    setSaving(true);
    try {
      await handleSavePayroll(payroll);
      showMessage("✅ Payroll saved successfully.", "success");
    } catch (err) {
      console.error("Save error:", err);
      showMessage("❌ Failed to save payroll.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format) => {
    if (!payroll) return;
    try {
      await handleSavePayroll(payroll);
      await new Promise((res) => setTimeout(res, 300));
      await downloadExport(format);
      showMessage("✅ Export completed successfully.", "success");
    } catch (err) {
      console.error("Export error:", err);
      showMessage("❌ Failed to export payroll.", "error");
    }
  };

  // ---------------- Render ----------------
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Payroll Management
      </Typography>

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

      <PayrollFilters
        recruiters={recruiters}
        selectedRecruiter={selectedRecruiter}
        setSelectedRecruiter={setSelectedRecruiter}
        region={region}
        setRegion={setRegion}
        month={month}
        setMonth={setMonth}
        onPreview={handlePreview}
        loading={loading}
        viewMode={viewMode}
      />

      {viewMode === "preview" && payroll && (
        <PayrollPreview
          payroll={payroll}
          region={region}
          autoRecalc={autoRecalc}
          setAutoRecalc={setAutoRecalc}
          handleFieldChange={handleFieldChange}
          recalcNetPayManual={recalcNetPayManual}
          handleSave={handleSave}
          handleExport={handleExport}
          saving={saving}
          ytdTotals={ytdTotals}
          setShowPayslip={setShowPayslip}
          selectedRecruiter={selectedRecruiter}
          month={month}
          setPayroll={setPayroll}
          snackbar={snackbar}
          setSnackbar={setSnackbar}
        />
      )}

      {viewMode === "history" && selectedRecruiter && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Payslip History for Recruiter #{selectedRecruiter}
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
            </Box>
          ) : payslipHistory.length === 0 ? (
            <Alert severity="info">No payslips found.</Alert>
          ) : (
            <Box sx={{ mt: 2 }}>
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
                      <td style={{ padding: "8px" }}>${p.gross_pay}</td>
                      <td style={{ padding: "8px" }}>${p.net_pay}</td>
                      <td style={{ padding: "8px" }}>
                        <Button
                          variant="outlined"
                          onClick={() => {
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
            </Box>
          )}
        </Paper>
      )}

      <PayslipModal
        open={showPayslip}
        onClose={() => setShowPayslip(false)}
        payroll={payroll}
        month={month}
      />

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
