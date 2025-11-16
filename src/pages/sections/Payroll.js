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
import ManagementFrame from "../../components/ui/ManagementFrame";

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
    if (!selectedRecruiter || !startDate || !endDate) {
      showMessage("❌ Please select recruiter and date range.", "error");
      return;
    }
  
    setLoading(true);
  
    try {
      const genRes = await axios.post(
        `${API_URL}/automation/payroll/generate`,
        {
          recruiter_id: selectedRecruiter,
          region,
          start_date: startDate,
          end_date: endDate,
          pay_frequency: payFrequency,
          province: payroll?.province || "ON",
          state: payroll?.state || "CA",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const generatedRecord = genRes.data?.payroll || genRes.data || {};

      // fallback-safe merge of required fields (ensure we keep backend id/flags)
      const base = {
        ...generatedRecord,
        id: generatedRecord.id ?? generatedRecord.payroll_id,
        payroll_id: generatedRecord.id ?? generatedRecord.payroll_id,
        recruiter_id: selectedRecruiter,

        /* names */
        employee_name:
          generatedRecord.recruiter_name ||
          generatedRecord.employee_name ||
          generatedRecord.name ||
          "",
        name:
          generatedRecord.recruiter_name ||
          generatedRecord.employee_name ||
          generatedRecord.name ||
          "",

        /* where & when */
        region,
        province: payroll?.province || generatedRecord.province || "ON",
        state: payroll?.state || generatedRecord.state || "CA",
        start_date: startDate,
        end_date: endDate,
        pay_frequency: payFrequency,
        month,

        /* basics */
        rate: payroll?.rate ?? generatedRecord.rate ?? 0,
        hours_worked: payroll?.hours_worked ?? generatedRecord.hours_worked ?? 0,
        vacation_percent:
          payroll?.vacation_percent ??
          generatedRecord.vacation_percent ??
          4,
        include_vacation_in_gross:
          payroll?.include_vacation_in_gross ??
          generatedRecord.include_vacation_in_gross ??
          true,

        /* ➕ extra earnings */
        bonus: payroll?.bonus ?? generatedRecord.bonus ?? 0,
        attendance_bonus:
          payroll?.attendance_bonus ?? generatedRecord.attendance_bonus ?? 0,
        performance_bonus:
          payroll?.performance_bonus ?? generatedRecord.performance_bonus ?? 0,
        commission: payroll?.commission ?? generatedRecord.commission ?? 0,
        tip: payroll?.tip ?? generatedRecord.tip ?? 0,
        parental_insurance:
          payroll?.parental_insurance ?? generatedRecord.parental_insurance ?? 0,
        travel_allowance:
          payroll?.travel_allowance ?? generatedRecord.travel_allowance ?? 0,
        family_bonus:
          payroll?.family_bonus ?? generatedRecord.family_bonus ?? 0,
        tax_credit: payroll?.tax_credit ?? generatedRecord.tax_credit ?? 0,

        /* ➖ insurance & retirement overrides (deduction side) */
        medical_insurance:
          payroll?.medical_insurance ?? generatedRecord.medical_insurance ?? 0,
        dental_insurance:
          payroll?.dental_insurance ?? generatedRecord.dental_insurance ?? 0,
        life_insurance:
          payroll?.life_insurance ?? generatedRecord.life_insurance ?? 0,
        retirement_amount:
          payroll?.retirement_amount ?? generatedRecord.retirement_amount ?? 0,
        deduction: payroll?.deduction ?? generatedRecord.deduction ?? 0,
      };

      const calcRes = await axios.post(`${API_URL}/payroll/calculate`, base, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { flags = {}, ...payrollData } = calcRes.data || {};

      setPayroll({
        ...base,
        ...payrollData,
        id: base.id,
        payroll_id: base.payroll_id,
        flags,
      });
      showMessage("✅ Payroll preview loaded", "success");
  
    } catch (err) {
      console.error("handlePreview error", err.response?.data || err.message);
      showMessage("❌ Failed to load preview", "error");
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

    if (["vacation_percent", "bonus", "tip", "commission",
      "parental_insurance", "travel_allowance",
      "family_bonus", "tax_credit", "deduction"].includes(field)) {
 
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
      payroll_id: data?.id || data?.payroll_id,
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
  <ManagementFrame
    title="Payroll Management"
    subtitle="Review, calculate, save and export payroll."
    headerActions={
      <Tooltip title="Payroll Guide">
        <IconButton onClick={() => setGuideOpen(true)}>
          <HelpOutline />
        </IconButton>
      </Tooltip>
    }
  >

   {/* Guide Drawer */}
<Drawer anchor="right" open={guideOpen} onClose={() => setGuideOpen(false)}>
  <Box sx={{ width: 600, p: 3 }}>
    <Typography variant="h5" gutterBottom>🇺🇸 U.S. Payroll Coverage (2025)</Typography>
    <Typography variant="body1" gutterBottom>
      Our payroll system supports accurate tax and compliance processing in most U.S. states, including:
    </Typography>
    <ul>
      <li>✅ Federal Income Tax (IRS brackets)</li>
      <li>✅ State Income Tax (where applicable)</li>
      <li>✅ FICA: Social Security & Medicare</li>
      <li>✅ FUTA: Federal Unemployment Tax (employer portion)</li>
      <li>✅ SUI/SUTA: State Unemployment Insurance (employer-paid)</li>
      <li>✅ PTO & Time Tracking support</li>
      <li>✅ Payroll exports (PDF / CSV / XLSX)</li>
      <li>✅ Year-end forms: W-2 generation / export</li>
      <li>❌ Local/City Income Taxes (e.g., NYC, STL, CO local): Not supported</li>
      <li>❌ Special Payroll Taxes (e.g., OR Transit, WA Paid Family): Not supported</li>
      <li>❌ Wage Garnishments: Not automated (must be handled externally)</li>
    </ul>

    <Typography variant="subtitle1" sx={{ mt: 2 }}><strong>📍 States Fully Supported (2025)</strong></Typography>
    <Typography variant="body2">
      Our platform is legally operable and tax-compliant in the following U.S. states:
    </Typography>
    <Box sx={{ fontSize: 14, mt: 1, mb: 2 }}>
      ✓ Alabama, Arizona, Arkansas, <strong>California***</strong>, Colorado, Connecticut, Delaware, District of Columbia (DC), Florida, Georgia, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, <strong>Maryland**</strong>, Massachusetts, Michigan, Minnesota, Mississippi, <strong>Missouri**</strong>, Montana, Nebraska, Nevada, <strong>New Hampshire*</strong>, <strong>New Jersey**</strong>, New Mexico, North Carolina, North Dakota, <strong>Ohio**</strong>, Oklahoma, <strong>Oregon**</strong>, <strong>Pennsylvania**</strong>, South Carolina, South Dakota, <strong>Tennessee*</strong>, Texas, Utah, Vermont, Virginia, <strong>Washington**</strong>, West Virginia, Wisconsin, Wyoming
    </Box>

    <Typography variant="caption" color="text.secondary" component="div">
      <strong>*</strong> TN & NH: No earned income tax. Only dividend/interest tax applies<br />
      <strong>**</strong> These states may impose local/city taxes (e.g., St. Louis, NYC, county levies). Our system does <em>not</em> support local tax compliance.<br />
      <strong>***</strong> California: SDI (State Disability Insurance) is not withheld by default and must be handled externally if required by your organization.<br />
    </Typography>

    <Divider sx={{ my: 3 }} />

    <Typography variant="h5" gutterBottom>🇨🇦 Canadian Payroll Coverage (2025)</Typography>
    <Typography variant="body1" gutterBottom>
      Schedulaa’s CRA-compliant engine covers all provinces <strong>except Québec</strong>.
    </Typography>
    <Typography variant="subtitle1" gutterBottom>Supported</Typography>
    <ul>
      <li>✅ Federal & provincial income tax (outside QC)</li>
      <li>✅ CPP (Canada Pension Plan)</li>
      <li>✅ EI (Employment Insurance)</li>
      <li>✅ Vacation pay & accrual logic</li>
      <li>✅ Automated statutory holiday pay calculation</li>
      <li>✅ Paid vs unpaid leave tracking</li>
      <li>✅ BPA (Basic Personal Amount) with pro-rata and YTD tracking</li>
      <li>✅ T4 generation / export</li>
      <li>✅ ROE (Record of Employment) creation / review / export (PDF & XML)</li>
    </ul>
    <Typography variant="subtitle1" gutterBottom>Not supported / not automated</Typography>
    <ul>
      <li>❌ Québec payroll (QPP, RQAP/QPIP programs)</li>
      <li>❌ Fringe benefit taxation that requires bureau-specific handling</li>
    </ul>

    <Divider sx={{ my: 3 }} />

    <Typography variant="h6" gutterBottom>⚠️ Known Limitations</Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      The following features are not yet automated and may require external handling:
    </Typography>
    <ul>
      <li>❌ Local/city taxes in U.S. jurisdictions</li>
      <li>❌ Wage garnishments and legal holds</li>
      <li>❌ Fringe benefit taxation</li>
      <li>❌ Québec payroll (QPP, RQAP/QPIP)</li>
    </ul>

    <Box textAlign="center" sx={{ mt: 4 }}>
      <Button onClick={() => setGuideOpen(false)} variant="contained" color="primary">
        Close Guide
      </Button>
    </Box>
  </Box>
</Drawer>




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
                  <TableCell align="right">{(p.net_pay || 0).toFixed(2)}</TableCell>
                  <TableCell align="center">{p.finalized ? "✅" : "—"}</TableCell>
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
  </ManagementFrame>
);

}
