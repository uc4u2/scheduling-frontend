import React, { useEffect, useState } from "react";
import {
  Drawer,
  Tooltip,
  IconButton,
  Divider,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@mui/material";
import { HelpOutline } from "@mui/icons-material";
import axios from "axios";
import dayjs from "dayjs";
import DownloadPayrollButton from "./DownloadPayrollButton";
import { recalcNetPay } from "./netpay";
import PayrollFilters from "./PayrollFilters";
import PayrollPreview from "./PayrollPreview";
import PayslipModal from "./PayslipModal";
import { savePayroll, exportPayroll } from "./netpay";
import { vacationIncludedByDefault, defaultVacationPercent } from "./utils/payrollRules";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const columnsToExport = [
  "employee_name",
  "hours_worked",
  "rate",
  "gross_pay",
  "vacation_pay",
  "federal_tax",
  "provincial_tax",
  "state_tax",
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
  "rrsp",
  "rrsp_employer",
  "retirement",
  "retirement_employer",
];

export default function Payroll({ token }) {
  /* ── UI state ── */
  const [viewMode, setViewMode] = useState("preview");
  const [autoRecalc, setAutoRecalc] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  /* ── domain state ── */
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [region, setRegion] = useState("ca");
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [payFrequency, setPayFrequency] = useState("weekly");
  

  const [payroll, setPayroll] = useState(null);
  const [payslipHistory, setPayslipHistory] = useState([]);
  const [ytdTotals, setYtdTotals] = useState(null);

  /* ── misc state ── */
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPayslip, setShowPayslip] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [year, setYear] = useState(""); // ✅ NEW

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // ─────────────────────────────────────────────────────────
// Effects
// ─────────────────────────────────────────────────────────
useEffect(() => {
  fetchRecruiters();
}, []);

useEffect(() => {
  if (viewMode === "history" && selectedRecruiter) {
    fetchPayslipHistory();
  }
}, [viewMode, selectedRecruiter, startDate, endDate, month]);

useEffect(() => {
  if (!selectedRecruiter) return;

  // Dynamically resolve YTD year based on startDate or month
  let ytdYear = new Date().getFullYear();
  if (startDate) {
    const parsed = new Date(startDate);
    if (!isNaN(parsed)) ytdYear = parsed.getFullYear();
  } else if (month) {
    const parts = month.split("-");
    if (parts.length === 2) {
      const maybeYear = parseInt(parts[0], 10);
      if (!isNaN(maybeYear)) ytdYear = maybeYear;
    }
  }

  axios
    .get(`${API_URL}/payroll/ytd`, {
      params: {
        recruiter_id: selectedRecruiter,
        year: ytdYear,
      },
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => setYtdTotals(res.data))
    .catch((err) => console.error("YTD error:", err));
}, [selectedRecruiter, startDate, month, payFrequency]);

  // ─────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────
  const showMessage = (message, severity = "info") =>
    setSnackbar({ open: true, message, severity });

  const fetchRecruiters = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiters(
        Array.isArray(res.data) ? res.data : res.data.recruiters || []
      );
    } catch (error) {
      console.error("Failed to fetch recruiters", error);
      showMessage("❌ Could not load recruiter list.", "error");
    }
  };

  // ✅ 2. fetchPayslipHistory with date range
  const fetchPayslipHistory = async () => {
    try {
      setLoading(true);
      const params = {
        recruiter_id: selectedRecruiter,
        region,
      };
  
      if (year) {
        params.year = year; // ✅ Support full-year fetch
      } else if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      } else {
        params.month = month;
      }
  
      const res = await axios.get(`${API_URL}/payroll/history`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayslipHistory(res.data || []);
    } catch (err) {
      console.error("Failed to fetch payslip history:", err);
      showMessage("❌ Failed to fetch payslip history.", "error");
    } finally {
      setLoading(false);
    }
  };
  
  
  const applyDefaultDeductions = (data) => {
    const isEmpty = (v) => v === undefined || v === null || v === 0;
    const updated = { ...data };

    if (region === "qc") {
      if (isEmpty(updated.ei)) updated.ei = 1.32;
      if (isEmpty(updated.rqap)) updated.rqap = 0.767;
    }

    if (region === "ca") {
      if (isEmpty(updated.cpp)) updated.cpp = 5.95;
      if (isEmpty(updated.ei)) updated.ei = 1.66;
    }

    if (region === "us") {
      if (isEmpty(updated.fica)) updated.fica = 6.2;
      if (isEmpty(updated.medicare)) updated.medicare = 1.45;
    }

    if (isEmpty(updated.retirement)) updated.retirement = 5.0;
    if (isEmpty(updated.vacation_percent)) {
      updated.vacation_percent = defaultVacationPercent(region, updated.province);
    }

    if (updated.include_vacation_in_gross === undefined) {
      updated.include_vacation_in_gross = vacationIncludedByDefault(region, updated.province);
    }

    return updated;
  };

  const runBackendCalculate = async (payload = {}) => {
    const body = {
      recruiter_id: selectedRecruiter,
      region,
      month,
      pay_frequency: payFrequency,
      ...payload, // ✅ correct spread
    };
    
  
    const res = await axios.post(`${API_URL}/payroll/calculate`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
  
    return res.data;
  };
  

  // ─────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────
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
      const genRes = await axios.post(
        `${API_URL}/automation/payroll/generate`,
        {
          recruiter_id: selectedRecruiter,
          region,
          province: payroll?.province || "",
          state: payroll?.state || "",
          pay_period: "custom",
          start_date: startDate,
          end_date: endDate,
          pay_frequency: payFrequency,

        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const base = {
        // everything returned by backend preview
        ...genRes.data,
      
        // always include these
        recruiter_id: selectedRecruiter,
        employee_name: genRes.data.recruiter_name || genRes.data.name || "",
        name: genRes.data.recruiter_name || genRes.data.name || "",
      
        // preserve critical fields so validations work
        start_date: startDate,
        end_date: endDate,
        rate: genRes.data.rate ?? payroll?.rate,
        hours_worked: genRes.data.hours_worked ?? payroll?.hours_worked,
      
        province: payroll?.province || genRes.data.province || "",
        state: payroll?.state || genRes.data.state || "",
        pay_frequency:
          payroll?.pay_frequency || genRes.data.pay_frequency || "weekly",
      };
      
      const withDefaults = applyDefaultDeductions(base);
      const calcData = await runBackendCalculate(withDefaults);
      const { flags = {}, ...payrollData } = calcData; // ✅ correct


      setPayroll({ ...withDefaults, ...payrollData, flags }); // ✅

      showMessage("✅ Payroll preview loaded.", "success");
    } catch (err) {
      console.error("Preview error:", err);
      showMessage("❌ Failed to fetch payroll preview.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = async (field, rawVal) => {
    if (!payroll) return;

    const isText = [
      "province",
      "state",
      "name",
      "pay_frequency",
      "start_date",
      "end_date",
    ].includes(field);

    const value = isText ? rawVal : parseFloat(rawVal) || 0;
    const updated = { ...payroll, [field]: value };

    if (field === "vacation_percent") {
      const newCalc = recalcNetPay(updated, region);
      Object.assign(updated, {
        vacation_pay: newCalc.vacation_pay,
        gross_pay: newCalc.gross_pay,
        total_deductions: newCalc.total_deductions,
        net_pay: newCalc.net_pay,
      });
    }

    setPayroll(updated);

    if (!autoRecalc) return;

    try {
      const newData = await runBackendCalculate(updated);
      const { flags = {}, ...rest } = newData;
      setPayroll((prev) => ({ ...prev, ...rest, flags }));
    } catch (err) {
      console.error("Field-change calc error:", err);
    }
  };

  const handleSavePayroll = async (data) => {
    if (!data || !selectedRecruiter || !startDate || !endDate) {
      throw new Error("Missing required payroll fields.");
    }
    const toSave = {
      ...data,
      payroll_id: undefined,
      recruiter_id: selectedRecruiter,
      region,
      month,
      start_date: startDate,
      end_date: endDate,
    };
    await savePayroll(toSave, token);
  };

  const handleSave = async () => {
    if (!payroll) return;
    if (!startDate || !endDate) {
      showMessage("❌ Please set both start and end dates before saving.", "error");
      return;
    }
    setSaving(true);
    try {
      await handleSavePayroll(payroll);
      showMessage("✅ Payroll saved successfully.", "success");
    } catch (err) {
      console.error("Save error:", err);
      showMessage("❌ Failed to save payroll. Check console for details.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ✅ 1. handleExport – save then export
  const handleExport = async (format) => {
    if (!payroll) return;
    if (!startDate || !endDate) {
      showMessage("❌ Please set both start and end dates before exporting.", "error");
      return;
    }
    setSaving(true);
    try {
      // always save first (keeps history tidy)
      await handleSavePayroll(payroll);
  
      await exportPayroll(
        {
          recruiter_id: selectedRecruiter,
          recruiter: payroll.employee_name || payroll.name || "",
          region,
          month,
          format,
          start_date: startDate,
          end_date: endDate,
          columns: columnsToExport,
        },
        token
      );
  
      showMessage("✅ Export completed.", "success");
    } catch (err) {
      console.error("Export error:", err);
      showMessage("❌ Failed to export payroll.", "error");
    } finally {
      setSaving(false);
    }
  };
  
  // ✅ New: handleDeletePayrollEntry with all query params
  const handleDeletePayrollEntry = async (entry) => {
    if (!window.confirm("Are you sure you want to delete this payroll entry?"))
      return;

    const queryParams = new URLSearchParams({
      recruiter_id: selectedRecruiter, // use the state, not the entry
      month: entry.month,
      region: entry.region,
    });
    if (entry.start_date) queryParams.append("start_date", entry.start_date);
    if (entry.end_date)   queryParams.append("end_date", entry.end_date);
    

    try {
      const res = await fetch(
        `${API_URL}/payroll/delete?${queryParams.toString()}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();

      if (res.ok) {
        showMessage(result.message || "✅ Deleted successfully.", "success");
        fetchPayslipHistory();
      } else {
        showMessage(
          result.error || result.warning || "❌ Delete failed.",
          "error"
        );
      }
    } catch (err) {
      console.error("Delete error:", err);
      showMessage(
        "❌ An error occurred while deleting payroll.",
        "error"
      );
    }
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3 }}>
      {/* Header + Guide */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Payroll Management</Typography>
        <Tooltip title="Payroll Guide">
          <IconButton onClick={() => setGuideOpen(true)}>
            <HelpOutline />
          </IconButton>
        </Tooltip>
      </Box>
      {/* … guide drawer unchanged … */}

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
  startDate={startDate}
  setStartDate={setStartDate}
  endDate={endDate}
  setEndDate={setEndDate}
  year={year}
  setYear={setYear}
  month={month}
  setMonth={setMonth}
  onPreview={handlePreview}
  loading={loading}
  viewMode={viewMode}
  setPayroll={setPayroll}
  payroll={payroll}
  handleFieldChange={handleFieldChange}
  payFrequency={payFrequency}
  setPayFrequency={setPayFrequency}

/>

{viewMode === "preview" && payroll && (
  <PayrollPreview
    payroll={payroll}
    region={region}
    autoRecalc={autoRecalc}
    setAutoRecalc={setAutoRecalc}
    handleFieldChange={handleFieldChange}
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
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          {loading && <CircularProgress />}

          {!loading && payslipHistory.length === 0 && (
            <Alert severity="info">No saved payroll found for this employee.</Alert>
          )}

          {!loading && payslipHistory.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell align="right">Net Pay ($)</TableCell>
                  <TableCell align="center">Finalized</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payslipHistory.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.start_date}</TableCell>
                    <TableCell>{p.end_date}</TableCell>
                    <TableCell>{p.region.toUpperCase()}</TableCell>
                    <TableCell align="right">
                      {(p.net_pay || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      {p.finalized ? "✅" : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <DownloadPayrollButton
                        recruiterId={selectedRecruiter}
                        month={p.month}
                        region={p.region}
                        startDate={p.start_date}
                        endDate={p.end_date}
                        token={token}
                        selectedColumns={[]}
                      />
                      <Button
                        size="small"
                        color="error"
                        sx={{ ml: 1 }}
                        onClick={() => handleDeletePayrollEntry(p)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
