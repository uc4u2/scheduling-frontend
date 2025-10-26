
import React, { useEffect, useState } from "react";
import {
  Drawer, Tooltip, IconButton, Divider
} from "@mui/material";
import { HelpOutline } from "@mui/icons-material";

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
  getBPA,
} from "./netpay";

// ---------------- Constants ----------------
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const columnsToExport = [
  "employee_name",
  "hours_worked",
  "rate",
  "gross_pay",
  "vacation_pay",
  // Canada
  "federal_tax",       // ➕ new
  "provincial_tax",    // ➕ new
  // United States (keep both regions happy)
  "state_tax",         // ➕ new
  // whichever deductions you need below
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
  const [guideOpen, setGuideOpen] = useState(false);

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

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


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
      
      start_date: startDate || null,
      end_date: endDate || null,
    };
    

  try {
    const result = await savePayroll(toSave, token);
    console.log("✅ Backend confirmed save:", result);

    if (!result || !result.message?.includes("success")) {
      throw new Error("Backend save was silent or failed validation");
    }
  } catch (err) {
    console.error("❌ Payroll save failed:", err);
    throw err;
  }
};


  const applyDefaultDeductions = (data) => {
    const updated = { ...data };
    const isEmpty = (v) => v === undefined || v === null || v === 0;


    if (region === "qc") {
      if (isEmpty(updated.qpp)) updated.qpp = 6.4;
      if (isEmpty(updated.ei)) updated.ei = 1.32;
      if (isEmpty(updated.rqap)) updated.rqap = 0.767;
      if (isEmpty(updated.retirement)) updated.retirement = 5.0;
    }
    
    if (region === "ca") {
      if (isEmpty(updated.cpp)) updated.cpp = 5.95;
      if (isEmpty(updated.ei)) updated.ei = 1.66;
      if (isEmpty(updated.retirement)) updated.retirement = 5.0;
    }
    
    if (region === "us") {
      if (isEmpty(updated.fica)) updated.fica = 6.2;
      if (isEmpty(updated.medicare)) updated.medicare = 1.45;
      if (isEmpty(updated.retirement)) updated.retirement = 5.0;
    }
    
    if (isEmpty(updated.vacation_percent)) updated.vacation_percent = 0.0;
    
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
      // 1️⃣ Fetch raw payroll inputs (e.g. hours worked, name)
      const genRes = await axios.post(
        `${API_URL}/automation/payroll/generate`,
        {
          recruiter_id: selectedRecruiter,
          region,
          pay_period: "custom",  // 🛠 Required to trigger correct logic
          start_date: startDate || null,
          end_date: endDate || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const base = {
        ...genRes.data,
        name: genRes.data.recruiter_name || genRes.data.name || "",
        province: payroll?.province || genRes.data.province || "",
        pay_frequency: payroll?.pay_frequency || genRes.data.pay_frequency || "weekly",
      };
      
      // ✅ Map state → province if in U.S.
      if (region === "us" && genRes.data.state && !base.province) {
        base.province = genRes.data.state;
      }
      
  
      // 2️⃣ Apply default deduction settings
      const withDefaults = applyDefaultDeductions(base);
  
      // 3️⃣ Run server-side calculation (BPA, caps, tax bracket)
      const calcRes = await axios.post(
        `${API_URL}/payroll/calculate`,
        {
          recruiter_id: selectedRecruiter,
          month,
          region,
          pay_frequency: withDefaults.pay_frequency || "weekly",  // ✅ Pass frequency to backend
          ...withDefaults,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const { flags = {}, ...payrollData } = calcRes.data;
  
      setPayroll(prev => ({
        ...prev,
        ...withDefaults,
        ...payrollData,
        flags,
        pay_frequency: withDefaults.pay_frequency || "weekly"  // ✅ Persist in state
      }));
  
      showMessage("✅ Payroll preview loaded.", "success");
    } catch (err) {
      console.error("Preview error:", err);
      showMessage("❌ Failed to fetch payroll preview.", "error");
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleFieldChange = async (field, newVal) => {

    if (!payroll) return;
    if (field === "start_date" || field === "end_date") {
      const isText = true;
      const value = newVal;
      let updated = { ...payroll, [field]: value };
  
      setPayroll(updated);
  
      if (updated.start_date && updated.end_date) {
        const calcRes = await axios.post(`${API_URL}/payroll/calculate`, {
          recruiter_id: selectedRecruiter,
          region,
          month,
          rate: updated.rate,
          start_date: updated.start_date,
          end_date: updated.end_date,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        const { flags = {}, ...newData } = calcRes.data;
        setPayroll(prev => ({
          ...prev,
          ...newData,
          flags,
          start_date: updated.start_date,
          end_date: updated.end_date,
        }));
      }
  
      return; // ⛔ Don't run rest of field updates
    }
  
    const isText = ["province", "start_date", "end_date", "name", "pay_frequency"].includes(field);

    const value = isText ? newVal : parseFloat(newVal) || 0;

    let updated = { ...payroll, [field]: value };
    if (field === "pay_frequency") {
      updated[field] = value;
    
      if (autoRecalc) {
        try {
          const calcRes = await axios.post(`${API_URL}/payroll/calculate`, {
            recruiter_id: selectedRecruiter,
            region,
            month,
            ...updated,
            pay_frequency: value,
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
    
          const { flags = {}, ...newData } = calcRes.data;
    
          setPayroll(prev => ({
            ...prev,
            ...updated,
            ...newData,
            flags,
          }));
    
          return; // skip local recalcNetPay fallback
        } catch (err) {
          console.error("Error recalculating BPA with pay_frequency:", err);
        }
      }
    }
    

    const percentFields = [
      "cpp", "ei", "qpp", "rqap",
      "fica", "medicare",
      "federal_tax", "provincial_tax", "state_tax"
        // 🟢 Add these to trigger deduction recalculation
    ];
    
    
    const fetchHoursFromRange = async () => {
      if (!startDate || !endDate || !selectedRecruiter) return;
    
      try {
        const res = await axios.post(`${API_URL}/payroll/hours`, {
          recruiter_id: selectedRecruiter,
          start_date: startDate,
          end_date: endDate,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
    
        setPayroll(prev => ({
          ...prev,
          hours_worked: res.data.hours_worked || 0,
        }));
    
        if (autoRecalc) {
          setPayroll(prev => ({
            ...prev,
            ...recalcNetPay({ ...prev, hours_worked: res.data.hours_worked || 0 }, region),
          }));
        }
    
      } catch (err) {
        console.error("Error fetching hours from date range:", err);
      }
    };
    
    // ⏱ Trigger if a date changed
    if (field === "start_date" || field === "end_date") {
      fetchHoursFromRange();
    }
    
    
    // Recalculate percentage-based deductions
    if (percentFields.includes(field)) {
      const gross =
        (updated.hours_worked || 0) * (updated.rate || 0) +
        (updated.bonus || 0) +
        (updated.commission || 0) +
        (updated.tip || 0) +
        (updated.vacation_pay || 0);
    
      const bpa = getBPA(updated.pay_frequency || "weekly");
      const taxable = Math.max(0, gross - bpa);
    
      const deductionFields = [
        "cpp", "ei", "qpp", "rqap",
        "fica", "medicare",
        "federal_tax", "provincial_tax", "state_tax"
      ];
    
      for (const dField of deductionFields) {
        const pct = updated[dField] || 0;
        const amountField = `${dField}_amount`;
        const baseForPct = ["federal_tax", "provincial_tax", "state_tax"].includes(dField)
          ? taxable
          : gross;
    
        updated[amountField] = parseFloat(((baseForPct * pct) / 100).toFixed(2));
      }
    }
    

    

    if (autoRecalc) {
      updated = { ...updated, ...recalcNetPay(updated, region) };
    }

    setPayroll(updated);
  };

 // ---------------------------------------------
// Manual “Recalculate” button helper
// (called when Auto‑recalc is off)
// ---------------------------------------------
const recalcNetPayManual = () =>
  setPayroll(curr => ({ ...curr, ...recalcNetPay(curr, region) }));

  
  
  const handleSave = async () => {
    if (!payroll) return;
    setSaving(true);
    try {
      await handleSavePayroll(payroll);
      if (!payroll.vacation_pay) {
        payroll.vacation_pay = 0.0;
      }
      
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
      await exportPayroll({
        recruiter_id: selectedRecruiter,
        month,
        region,
        format,
        columns: columnsToExport,
      }, token);
      showMessage("✅ Export completed successfully.", "success");
    } catch (err) {
      console.error("Export error:", err);
      showMessage("❌ Failed to export payroll.", "error");
    }
  };
  

  // ---------------- Render ----------------
  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
  <Typography variant="h4" gutterBottom>
    Payroll Management
  </Typography>
  <Tooltip title="Payroll Guide">
    <IconButton onClick={() => setGuideOpen(true)}>
      <HelpOutline />
    </IconButton>
  </Tooltip>
</Box>
<Drawer anchor="right" open={guideOpen} onClose={() => setGuideOpen(false)}>
  <Box sx={{ width: 380, p: 3 }}>
    <Typography variant="h6" gutterBottom>
      👩‍💼 Payroll Guide for Managers
    </Typography>
    <Divider sx={{ mb: 2 }} />

    <Typography variant="subtitle2">✅ Step-by-Step</Typography>
    <Typography variant="body2" paragraph>
      This guide walks you through how to process payroll correctly for Canadian and U.S. employees.
    </Typography>

    <Typography variant="body2" component="ol">
      <li>Select an employee</li>
      <li>Choose a region (Canada or U.S.)</li>
      <li>Enter the pay period (start & end date)</li>
      <li>Pick the correct pay frequency: <b>weekly, biweekly, or monthly</b></li>
      <li>Enter hourly rate and hours worked</li>
      <li>Review or adjust any bonuses, deductions, or benefits</li>
      <li>Click “Preview” to calculate payroll</li>
    </Typography>

    <Divider sx={{ my: 2 }} />

    <Typography variant="subtitle2">📌 What is BPA?</Typography>
    <Typography variant="body2" paragraph>
      BPA (Basic Personal Amount) is a portion of income that's tax-free. In Canada, it's $15,000 per year (2025). It's automatically prorated by pay frequency:
    </Typography>
    <Typography variant="body2" component="ul">
      <li>Weekly: $288.46</li>
      <li>Biweekly: $576.92</li>
      <li>Monthly: $1,250.00</li>
    </Typography>

    <Typography variant="subtitle2">📊 Canada: Federal Brackets (2025)</Typography>
    <Typography variant="body2" component="div">
      <ul>
        <li>15% on income ≤ $57,375</li>
        <li>20.5% on $57,376 – $114,750</li>
        <li>26% on $114,751 – $177,882</li>
        <li>29% on $177,883 – $253,414</li>
        <li>33% on income over $253,414</li>
      </ul>
    </Typography>

    <Typography variant="subtitle2">📊 Example: Joseph in Ontario</Typography>
    <Typography variant="body2" paragraph>
      - Rate: $20/hr  
      - Hours: 43  
      - Gross: $860  
      - BPA (biweekly): $576.92  
      - Taxable: $283.08  
      - Net = Gross − CPP − EI − Tax
    </Typography>

    <Typography variant="subtitle2">🇺🇸 U.S. Payroll Tips</Typography>
    <Typography variant="body2" paragraph>
      - U.S. uses federal + state brackets  
      - FICA (6.2%) and Medicare (1.45%) apply to most wages  
      - State tax varies by location
    </Typography>

    <Typography variant="subtitle2">📋 Contribution Caps</Typography>
    <Typography variant="body2" component="div">
      <ul>
        <li><b>CPP (CA):</b> 5.95% up to $3,867.50</li>
        <li><b>EI (CA):</b> 1.66% up to $1,049.12</li>
        <li><b>FICA (US):</b> 6.2% up to $10,453.20</li>
        <li><b>Medicare (US):</b> 1.45% (no cap)</li>
      </ul>
    </Typography>

    <Divider sx={{ my: 2 }} />

    <Typography variant="subtitle2">🔗 Official Sources</Typography>
    <Typography variant="body2">
      <a href="https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4032.html" target="_blank" rel="noreferrer">
        CRA Payroll Tables (T4032)
      </a><br />
      <a href="https://www.irs.gov/publications/p15" target="_blank" rel="noreferrer">
        IRS Publication 15 (Circular E)
      </a><br />
      <a href="https://www.irs.gov/newsroom" target="_blank" rel="noreferrer">
        IRS Newsroom
      </a>
    </Typography>

    <Box mt={3} textAlign="center">
      <Button variant="outlined" onClick={() => setGuideOpen(false)}>
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
  startDate={startDate}             // ✅ NEW
  setStartDate={setStartDate}
  endDate={endDate}                 // ✅ NEW
  setEndDate={setEndDate}
  onPreview={handlePreview}
  loading={loading}
  viewMode="preview"
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
