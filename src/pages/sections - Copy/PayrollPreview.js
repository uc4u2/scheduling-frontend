// src/pages/sections/PayrollPreview.js
import React, { useEffect, useState } from "react";
import DownloadPayrollButton from "./DownloadPayrollButton";
import {
  defaultVacationPercent,
  vacationIncludedByDefault,
} from "./utils/payrollRules";

import axios from "axios";
import {
  Typography,
  Divider,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

/* ──────────────────────────────────────────────────────────
   Helper functions
   ────────────────────────────────────────────────────────── */

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]); // strip "data:application/pdf;base64,"
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const formatPercent = (val) => {
  const num = Number(val);
  if (isNaN(num)) return "0.000%";
  return `${num.toFixed(3)}%`;
};

const formatCurrency = (val) => {
  const num = Number(val);
  return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
};

function calculate_gross_with_overtime(
  hoursWorked,
  hourlyRate,
  region = "ca",
  province = "ON"
) {
  let overtimeThreshold = 40;
  if (region === "ca" && province !== "QC") overtimeThreshold = 44;
  if (region === "ca" && (province === "QC" || province === "MB"))
    overtimeThreshold = 40;

  const regularHours = Math.min(hoursWorked, overtimeThreshold);
  const overtimeHours = Math.max(0, hoursWorked - overtimeThreshold);
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * 1.5;
  const grossPay = +(regularPay + overtimePay).toFixed(2);

  return {
    regularHours,
    overtimeHours,
    regularPay: +regularPay.toFixed(2),
    overtimePay: +overtimePay.toFixed(2),
    grossPay,
  };
}

function recalcNetPay(data) {
  const {
    rate,
    hours_worked,
    region = "ca",
    province = "ON",
    vacation_percent = 4,
    include_vacation_in_gross = true,
    bonus = 0,
    tip = 0,
    commission = 0,
    travel_allowance = 0,
    parental_insurance = 0,
    family_bonus = 0,
    tax_credit = 0,
    medical_insurance = 0,
    dental_insurance = 0,
    life_insurance = 0,
    retirement_amount = 0,
    deduction = 0,
    federal_tax_amount = 0,
    provincial_tax_amount = 0,
    state_tax_amount = 0,
    cpp_amount = 0,
    qpp_amount = 0,
    ei_amount = 0,
    fica_amount = 0,
    medicare_amount = 0,
    rqap_amount = 0,
    retirement_employer = 0,
  } = data || {};

  const {
    grossPay: grossBeforeVacation,
    regularPay,
    overtimePay,
    regularHours,
    overtimeHours,
  } = calculate_gross_with_overtime(hours_worked || 0, rate || 0, region, province);

  const vacationPay = +(grossBeforeVacation * (vacation_percent / 100)).toFixed(2);

  const extraEarnings =
    bonus + tip + commission + parental_insurance + travel_allowance + family_bonus + tax_credit;

  const gross = +(
    grossBeforeVacation +
    (include_vacation_in_gross ? vacationPay : 0) +
    extraEarnings
  ).toFixed(2);

  const deductionItems = [
    federal_tax_amount,
    provincial_tax_amount,
    state_tax_amount,
    cpp_amount,
    ei_amount,
    qpp_amount,
    rqap_amount,
    fica_amount,
    medicare_amount,
    retirement_amount,
    medical_insurance,
    dental_insurance,
    life_insurance,
    deduction,
  ];

  const totalDeductions = deductionItems.reduce((s, v) => s + (Number(v) || 0), 0);
  const netPay = +(gross - totalDeductions).toFixed(2);

  return {
    gross_pay: gross,
    regular_pay: +regularPay.toFixed(2),
    overtime_pay: +overtimePay.toFixed(2),
    regular_hours: +regularHours.toFixed(2),
    overtime_hours: +overtimeHours.toFixed(2),
    vacation_pay: vacationPay,
    total_deductions: +totalDeductions.toFixed(2),
    net_pay: netPay,
    employer_retirement_match: +(retirement_employer || 0),
  };
}

/* 🔹 Helper – call backend /payroll/calculate */
const fetchPayrollPreview = async (payload, token) => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const res = await axios.post(`${API_URL}/payroll/calculate`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */
export default function PayrollPreview({
  payroll,
  region,
  autoRecalc,
  setAutoRecalc,
  handleFieldChange,
  setPayroll,
  /* handleSave removed */
    
  ytdTotals,
  
  selectedRecruiter,
  month,
  
  setSnackbar,
}) {
  const isCanada = region === "ca";
  const token = localStorage.getItem("token");

  /* Local state */
  const [calculatedNetPay, setCalculatedNetPay] = useState(0);
  const [savingFinalized, setSavingFinalized] = useState(false);

  /* ✅ PDF Finalize & Save */
const saveFinalizedPayroll = async () => {
  try {
    setSavingFinalized(true);

    // 🔍 Validate required fields before proceeding
    if (!payroll?.recruiter_id || !payroll?.start_date || !payroll?.end_date) {
      setSnackbar({
        open: true,
        message: "❌ Missing required fields: recruiter, start or end date.",
        severity: "error",
      });
      setSavingFinalized(false);
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const params = new URLSearchParams({
      recruiter_id: payroll.recruiter_id,
      month,
      region: payroll.region || region || "ca",
      start_date: payroll.start_date,
      end_date: payroll.end_date,
      format: "pdf",
    });

    const headers = { Authorization: `Bearer ${token}` };

    // 📥 Step 1: Get finalized PDF blob from backend
    const pdfRes = await axios.get(
      `${apiUrl}/automation/payroll/export-finalized?recruiter_id=${payroll.recruiter_id}&month=${month}&region=${region}&format=pdf&start_date=${payroll.start_date}&end_date=${payroll.end_date}`,
      { headers, responseType: "blob" }
    );
    
    const base64File = await blobToBase64(pdfRes.data);

    // 📤 Step 2: POST to save-finalized endpoint
    const savePayload = {
      ...payroll,
      employee_id: payroll.recruiter_id,
      file_data: base64File,
      file_name: `${payroll.employee_name || payroll.name || "payroll"}.pdf`,

      content_type: "application/pdf",
      start_date: payroll.start_date,
      end_date: payroll.end_date,
      month,
    };

    await axios.post(`${apiUrl}/payroll/finalize`, savePayload, {
      headers,
    });

    setSnackbar({
      open: true,
      message: "✅ Finalized payroll saved",
      severity: "success",
    });
  } catch (err) {
    console.error("❌ Failed to save finalized payroll:", err.response?.data || err.message);
    setSnackbar({ open: true, message: "❌ Save failed", severity: "error" });
  } finally {
    setSavingFinalized(false);
  }
};

  /* ─────────────────────────
     Front-end net-pay preview
  ───────────────────────── */
  useEffect(() => {
    if (!payroll) return;

    if (!payroll.pay_frequency) payroll.pay_frequency = "weekly";
    if (payroll.vacation_percent == null)
      payroll.vacation_percent = defaultVacationPercent(region, payroll.province);
    if (payroll.include_vacation_in_gross === undefined)
      payroll.include_vacation_in_gross = vacationIncludedByDefault(region, payroll.province);

    const { net_pay } = recalcNetPay(payroll);
    setCalculatedNetPay(net_pay);
  }, [payroll]);

  /* 🔁 Auto-recalc with backend */
  /* 🔁 Auto-recalc with backend */
  useEffect(() => {
    if (
      !autoRecalc ||
      !payroll?.recruiter_id ||
      !payroll?.rate ||
      !payroll?.hours_worked ||
      !payroll?.start_date || // <-- MUST be present
      !payroll?.end_date      // <-- MUST be present
    )
      return;
  
    const payload = {
      recruiter_id: payroll.recruiter_id,
      region: payroll.region || region || "ca",
      province: payroll.province,
      state: payroll.state,
      rate: parseFloat(payroll.rate || 0),
      hours_worked: parseFloat(payroll.hours_worked || 0),
      start_date: payroll.start_date,
      end_date: payroll.end_date,
      month,
      pay_frequency: payroll.pay_frequency || "biweekly",
      vacation_percent: parseFloat(payroll.vacation_percent ?? defaultVacationPercent(region, payroll?.province)),
      include_vacation_in_gross: payroll.include_vacation_in_gross ?? vacationIncludedByDefault(region, payroll?.province),
      bonus: parseFloat(payroll.bonus || 0),
      tip: parseFloat(payroll.tip || 0),
      commission: parseFloat(payroll.commission || 0),
      vacation_pay: parseFloat(payroll.vacation_pay || 0),
      medical_insurance: parseFloat(payroll.medical_insurance || 0),
      dental_insurance: parseFloat(payroll.dental_insurance || 0),
      life_insurance: parseFloat(payroll.life_insurance || 0),
      retirement_amount: parseFloat(payroll.retirement || 0),
      retirement_employer: parseFloat(payroll.retirement_employer || 0),
      rrsp: parseFloat(payroll.rrsp || 0),
      rrsp_employer: parseFloat(payroll.rrsp_employer || 0),
      fica_amount: parseFloat(payroll.fica_amount || 0),
      medicare_amount: parseFloat(payroll.medicare_amount || 0),
      tax_credit: parseFloat(payroll.tax_credit || 0),
      travel_allowance: parseFloat(payroll.travel_allowance || 0),
      parental_insurance: parseFloat(payroll.parental_insurance || 0),
      family_bonus: parseFloat(payroll.family_bonus || 0),
      deduction: parseFloat(payroll.deduction || 0),
    };
  
    fetchPayrollPreview(payload, token)
      .then((preview) => setPayroll((prev) => ({ ...prev, ...preview })))
      .catch((err) => {
        console.error("❌ Auto-recalc failed:", err.response?.data || err.message);
      });
  }, [
    autoRecalc,
    payroll.recruiter_id,
    payroll.rate,
    payroll.hours_worked,
    payroll.start_date,  // <-- required dependency
    payroll.end_date,    // <-- required dependency
    // ... rest of dependencies
  ]);
  
  /* Manual “Recalculate Now” */
  const handleRecalculate = () => {
    if (
      !payroll?.recruiter_id ||
      !payroll?.start_date ||
      !payroll?.end_date ||
      !month
    ) {
      setSnackbar({
        open: true,
        message: "❌ Missing recruiter, month, start or end date.",
        severity: "error",
      });
      return;
    }

    const payload = {
      recruiter_id: payroll.recruiter_id,
      region: payroll.region || region || "ca",
      province: payroll.province,
      state: payroll.state,
      rate: payroll.rate,
      vacation_percent:
        payroll?.vacation_percent ?? defaultVacationPercent(region, payroll?.province),
      include_vacation_in_gross:
        payroll?.include_vacation_in_gross ?? vacationIncludedByDefault(region, payroll?.province),
      start_date: payroll.start_date,
      end_date: payroll.end_date,
      month,
      pay_frequency: payroll.pay_frequency || "biweekly",

      bonus: payroll.bonus,
      tip: payroll.tip,
      commission: payroll.commission,
      vacation_pay: payroll.vacation_pay,
      medical_insurance: payroll.medical_insurance,
      dental_insurance: payroll.dental_insurance,
      life_insurance: payroll.life_insurance,
      retirement: payroll.retirement,
      retirement_employer: payroll.retirement_employer,
      rrsp: payroll.rrsp,
      rrsp_employer: payroll.rrsp_employer,
      fica: payroll.fica,
      fica_amount: payroll.fica_amount,
      medicare: payroll.medicare,
      medicare_amount: payroll.medicare_amount,
      tax_credit: payroll.tax_credit,
      travel_allowance: payroll.travel_allowance,
      parental_insurance: payroll.parental_insurance,
      family_bonus: payroll.family_bonus,
      deduction: payroll.deduction,
    };

    console.log("📤 Sending manual recalc payload:", payload);

    fetchPayrollPreview(payload, token)
      .then((preview) => setPayroll((prev) => ({ ...prev, ...preview })))
      .catch((err) => {
        console.error("❌ Preview fetch failed:", err.response?.data || err.message);
        setSnackbar({
          open: true,
          message: `❌ Preview failed: ${err.response?.data?.error || err.message}`,
          severity: "error",
        });
      });
  };


  /* Helper for deduction rows (kept unchanged) */
  const deductionField = (label, key, dynamicPercentKey = null) => (
    <>
      {dynamicPercentKey && (
        <Grid item xs={12} md={3}>
          <TextField
            label={`${label} (%)`}
            value={
              payroll[dynamicPercentKey] !== undefined
                ? Number(payroll[dynamicPercentKey] || 0).toFixed(3) + "%"
                : "0.000%"
            }
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
      )}
      <Grid item xs={12} md={3}>
        <TextField
          label={`${label} Amount ($)`}
          value={formatCurrency(payroll[key] || 0)}
          fullWidth
          InputProps={{ readOnly: true }}
        />
      </Grid>
    </>
  );

  /* ────────────────────────────────────────────────
     ⬇️ UI
  ──────────────────────────────────────────────── */
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
      Payroll Preview for {payroll.employee_name || payroll.name || selectedRecruiter?.name || "--"}

      </Typography>

      <Divider sx={{ my: 2 }} />

      <FormControlLabel
        control={
          <Checkbox checked={autoRecalc} onChange={() => setAutoRecalc(!autoRecalc)} />
        }
        label="Auto-recalculate Net Pay on each change?"
      />
      {!autoRecalc && (
        <Button variant="outlined" onClick={handleRecalculate} sx={{ ml: 2 }}>
          Recalculate Now
        </Button>
      )}

      <Divider sx={{ my: 2 }} />

      {/* --------------------------------------------------
         Basics
      -------------------------------------------------- */}

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
        <TextField
  label="Employee Name"
 value={payroll.employee_name || payroll.name || ""}  // ✅ this fallback ensures the name shows
  InputProps={{ readOnly: true }}
  fullWidth
/>

        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Hours Worked"
            value={payroll.hours_worked || 0}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Hourly Rate"
            type="number"
            value={payroll.rate || 0}
            onChange={(e) => handleFieldChange("rate", e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Gross Pay"
            value={formatCurrency(payroll.gross_pay)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>

        {/* Optional earnings / allowances */}
        {[
          "vacation_pay",
          "commission",
          "bonus",
          "tip",
          "parental_insurance",
          "travel_allowance",
          "family_bonus",
          "tax_credit",
          "medical_insurance",
          "dental_insurance",
          "life_insurance",
        ].map((key) => (
          <Grid item xs={12} md={3} key={key}>
            <TextField
              label={
                key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase()) + " ($)"
              }
              type="number"
              value={payroll[key] || 0}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              fullWidth
            />
          </Grid>
        ))}
      </Grid>

 {/* -------------------------------------------------- 
     Deductions
-------------------------------------------------- */}
<Divider sx={{ my: 3 }} />
<Typography variant="h6">Deductions</Typography>
<Grid container spacing={2}>
  {region === "qc" && (
    <>
      {deductionField("Federal Tax", "federal_tax_amount", "federal_tax_percent")}
      {deductionField("QPP", "qpp_amount", "qpp_percent")}
      {deductionField("EI", "ei_amount", "ei_percent")}
      {deductionField("RQAP", "rqap_amount", "rqap_percent")}
    </>
  )}

  {region === "ca" && (
    <>
      {deductionField("Federal Tax", "federal_tax_amount", "federal_tax_percent")}
      {deductionField("Provincial Tax", "provincial_tax_amount", "provincial_tax_percent")}
      {deductionField("CPP", "cpp_amount", "cpp_percent")}
      {deductionField("EI", "ei_amount", "ei_percent")}
    </>
  )}

  {region === "us" && (
    <>
      {deductionField("Federal Tax", "federal_tax_amount", "federal_tax_percent")}
      {deductionField("State Tax", "state_tax_amount", "state_tax_percent")}
      {deductionField("FICA", "fica_amount", "fica_percent")}
      {deductionField("Medicare", "medicare_amount", "medicare_percent")}
    </>
  )}

  {/* Vacation Include Checkbox */}
  {!vacationIncludedByDefault(region, payroll?.province) && (
  <Grid item xs={12} md={4}>
    <FormControlLabel
      control={
        <Checkbox
          checked={!!payroll.include_vacation_in_gross}
          onChange={(e) =>
            handleFieldChange("include_vacation_in_gross", e.target.checked)
          }
        />
      }
      label="Include Vacation in Gross?"
    />
  </Grid>
)}


  {/* Vacation %, RRSP, 401(k), Other Deduction */}
  <Grid item xs={12} md={3}>
    <TextField
      label="Vacation %"
      type="number"
      fullWidth
      value={payroll.vacation_percent || 0}
      onChange={(e) =>
        handleFieldChange("vacation_percent", Number(e.target.value))
      }
    />
  </Grid>

  {["ca", "qc"].includes(region) && (
    <>
      <Grid item xs={12} md={3}>
        <TextField
          label="RRSP Amount ($)"
          value={payroll.rrsp || 0}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          label="Employer RRSP Match ($)"
          value={payroll.rrsp_employer || 0}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
    </>
  )}

  {region === "us" && (
    <>
      <Grid item xs={12} md={3}>
        <TextField
          label="401(k) Amount ($)"
          value={payroll.retirement || 0}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          label="Employer 401(k) Match ($)"
          value={payroll.retirement_employer || 0}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
    </>
  )}

  <Grid item xs={12} md={3}>
    <TextField
      label="Other Deduction ($)"
      type="number"
      value={payroll.deduction || 0}
      onChange={(e) => handleFieldChange("deduction", e.target.value)}
      fullWidth
    />
  </Grid>
</Grid>

      {/* --------------------------------------------------
         Net Pay + BPA / bracketing info
      -------------------------------------------------- */}
      <Divider sx={{ my: 3 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Net Pay ($)"
            value={`$${calculatedNetPay}`}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
      </Grid>

      {/* BPA flags */}
      {payroll?.flags && (
        <Box sx={{ my: 2 }}>
          <Alert severity="info" sx={{ mb: 1 }}>
            <strong>BPA Annual:</strong>{" "}
            ${payroll.flags.bpa_annual?.toFixed(2)}
          </Alert>
          <Alert severity="success" sx={{ mb: 1 }}>
            <strong>BPA Remaining:</strong>{" "}
            ${payroll.flags.bpa_remaining?.toFixed(2)}
          </Alert>
          <Alert severity="warning" sx={{ mb: 1 }}>
            <strong>BPA Used:</strong>{" "}
            {(
              payroll.flags.bpa_annual - payroll.flags.bpa_remaining
            ).toFixed(2)}{" "}
            / ${payroll.flags.bpa_annual.toFixed(2)}
          </Alert>
          <Alert severity="info" sx={{ mb: 1 }}>
            <strong>BPA Applied This Period:</strong>{" "}
            ${payroll.flags.bpa_period?.toFixed(2)} ({payroll.pay_frequency})
          </Alert>
        </Box>
      )}

      {/* Federal bracket breakdown */}
      {payroll?.federal_brackets?.length > 0 && (
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">Federal Brackets Used</Typography>
          {payroll.federal_brackets.map((b, i) => (
            <Typography key={i}>
              ${b.from.toFixed(2)} –{" "}
              {b.to ? `$${b.to.toFixed(2)}` : "∞"} @ {(b.rate * 100).toFixed(2)}%
            </Typography>
          ))}
        </Box>
      )}

      {/* --------------------------------------------------
         Year-to-Date summary
      -------------------------------------------------- */}
      {ytdTotals && (
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">Year-to-Date Summary</Typography>
          <Typography>Gross: ${ytdTotals.gross_pay}</Typography>
          <Typography>Tax Paid: ${ytdTotals.tax}</Typography>
          <Typography>Vacation Paid: ${ytdTotals.vacation_pay}</Typography>
          {region === "ca" && (
            <Typography>RRSP: ${ytdTotals.retirement}</Typography>
          )}
          {region === "us" && (
            <Typography>401(k): ${ytdTotals.retirement}</Typography>
          )}
        </Box>
      )}

      {/* --------------------------------------------------
         Action buttons
      -------------------------------------------------- */}
      <Divider sx={{ my: 2 }} />
      <DownloadPayrollButton
  recruiterId={payroll.recruiter_id}
  month={month}
  region={payroll.region || region || "ca"}
  selectedColumns={[
    "regular_hours", "overtime_hours", "bonus", "commission", "tip",
    "gross_pay", "net_pay", "federal_tax_amount", "provincial_tax_amount"
  ]}
  token={token}
  startDate={payroll.start_date}
  endDate={payroll.end_date}
/>

      <Button
  variant="contained"
  color="primary"
  sx={{ ml: 2 }}
  disabled={savingFinalized}
  onClick={saveFinalizedPayroll}
>
  {savingFinalized ? <CircularProgress size={20} /> : "Save Payroll"}
</Button>


      {/* Template save / load */}
      <Box sx={{ display: "flex", gap: 1, my: 2 }}>
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

      {/* Misc warnings */}
      {payroll?.vacation_percent > 10 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Vacation pay exceeds 10 % — double-check this amount.
        </Alert>
      )}
      {!payroll?.province && isCanada && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Province is not selected — deductions may be incorrect.
        </Alert>
      )}
      {payroll?.tax === 0 && (
        <Alert severity="info" sx={{ mb: 1 }}>
          Tax is 0 %. Is this correct?
        </Alert>
      )}

      {/* Debug sections */}
      {payroll?.debug_shifts?.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            🛠 Shift Breakdown (Debug)
          </Typography>
          <Box
            component="table"
            sx={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                <th style={{ padding: "8px" }}>Date</th>
                <th style={{ padding: "8px" }}>Clock In</th>
                <th style={{ padding: "8px" }}>Clock Out</th>
                <th style={{ padding: "8px" }}>Duration (hrs)</th>
              </tr>
            </thead>
            <tbody>
              {payroll.debug_shifts.map((shift, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>{shift.date}</td>
                  <td style={{ padding: "8px" }}>{shift.clock_in}</td>
                  <td style={{ padding: "8px" }}>{shift.clock_out}</td>
                  <td style={{ padding: "8px" }}>{shift.duration_hours}</td>
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      )}

      {payroll?.debug_logs?.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">🧾 Debug Logs</Typography>
          <ul
            style={{ paddingLeft: "1rem", color: "#666", fontSize: "14px" }}
          >
            {payroll.debug_logs.map((log, i) => (
              <li key={i}>{log}</li>
            ))}
          </ul>
        </Box>
      )}
    </Box>
  );
}
