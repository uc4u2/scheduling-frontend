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
  Chip,
  Stack,
  Tooltip,
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { xeroIntegration, quickbooksIntegration } from "../../utils/api";
import PayrollPreviewHelp from "./PayrollPreviewHelp";





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
  const numVal = Number(val);
  if (Number.isNaN(numVal)) return "0.000%";
  return `${numVal.toFixed(3)}%`;
};

const formatCurrency = (val) => {
  const numVal = Number(val);
  return Number.isNaN(numVal) ? "$0.00" : `$${numVal.toFixed(2)}`;
};

function calculate_gross_with_overtime(hoursWorked, hourlyRate, region = "ca", province = "ON") {
  const hrs = Number(hoursWorked || 0);
  const rate = Number(hourlyRate || 0);
  let overtimeThreshold = 40;
  if (region === "ca" && province !== "QC") overtimeThreshold = 44;
  if (region === "ca" && (province === "QC" || province === "MB")) overtimeThreshold = 40;

  const regularHours = Math.min(hrs, overtimeThreshold);
  const overtimeHours = Math.max(0, hrs - overtimeThreshold);
  const regularPay = regularHours * rate;
  const overtimePay = overtimeHours * rate * 1.5;
  const grossPay = regularPay + overtimePay;

  return {
    regularHours,
    overtimeHours,
    regularPay: +regularPay.toFixed(2),
    overtimePay: +overtimePay.toFixed(2),
    grossPay: +grossPay.toFixed(2),
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
    shift_premium = 0,
    union_dues = 0,
    garnishment = 0,
    non_taxable_reimbursement = 0,
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

  const vacationPay = +(
    Number(grossBeforeVacation || 0) *
    (Number(vacation_percent || 0) / 100)
  ).toFixed(2);

  const extraEarnings =
    Number(bonus || 0) +
    Number(tip || 0) +
    Number(commission || 0) +
    Number(parental_insurance || 0) +
    Number(travel_allowance || 0) +
    Number(family_bonus || 0) +
    Number(tax_credit || 0) +
    Number(data.parental_top_up || 0) +
    Number(shift_premium || 0);

  const grossBase =
    Number(grossBeforeVacation || 0) +
    Number(include_vacation_in_gross ? vacationPay : 0) +
    Number(extraEarnings || 0);
  const gross = Number(grossBase.toFixed(2));

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
    union_dues,
    garnishment,
  ];

  const totalDeductions = deductionItems.reduce((s, v) => s + (Number(v) || 0), 0);
  const netPay = +(gross - totalDeductions + Number(non_taxable_reimbursement || 0)).toFixed(2);

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

const getIntegrationStatusChip = (status) => {
  if (status === "success") return { color: "success", label: "Synced" };
  if (status === "error") return { color: "error", label: "Error" };
  return { color: "default", label: status === "pending" ? "Pending" : status || "Pending" };
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

  const [xeroStatus, setXeroStatus] = useState(null);
  const [xeroValidation, setXeroValidation] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [xeroSyncing, setXeroSyncing] = useState(false);
  const [quickbooksStatus, setQuickbooksStatus] = useState(null);
  const [quickbooksValidation, setQuickbooksValidation] = useState(null);
  const [quickbooksSyncing, setQuickbooksSyncing] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const statusData = await xeroIntegration.status();
        if (active) setXeroStatus(statusData);
      } catch {
        if (active) setXeroStatus(null);
      }
      try {
        const validationData = await xeroIntegration.validate();
        if (active) setXeroValidation(validationData);
      } catch {
        if (active) setXeroValidation(null);
      }
      try {
        const qbStatusData = await quickbooksIntegration.status();
        if (active) setQuickbooksStatus(qbStatusData);
      } catch {
        if (active) setQuickbooksStatus(null);
      }
      try {
        const qbValidationData = await quickbooksIntegration.validate();
        if (active) setQuickbooksValidation(qbValidationData);
      } catch {
        if (active) setQuickbooksValidation(null);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  /* Local state */
  const [calculatedNetPay, setCalculatedNetPay] = useState(0);
  const [savingFinalized, setSavingFinalized] = useState(false);

  /* ✅ PDF Finalize & Save */
/* ✅ PDF Finalize & Save --------------------------------------------- */
const saveFinalizedPayroll = async () => {
  try {
    setSavingFinalized(true);

    // 1️⃣ quick validation
    if (!payroll?.recruiter_id || !payroll?.start_date || !payroll?.end_date) {
      setSnackbar({ open:true, severity:"error",
        message:"❌ Missing recruiter, start or end date." });
      return;
    }

    const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const headers = { Authorization:`Bearer ${token}` };

    // 2️⃣ download the already-finalised PDF (blob)
    const url = `${API}/automation/payroll/export-finalized`
      + `?recruiter_id=${payroll.recruiter_id}`
      + `&month=${month}`
      + `&region=${region}`
      + `&format=pdf`
      + `&start_date=${payroll.start_date}`
      + `&end_date=${payroll.end_date}`;

    const blobRes = await axios.get(url, { headers, responseType:"blob" });
    const base64File = await blobToBase64(blobRes.data);

    // 3️⃣ send that file to your “portal” table
    await axios.post(`${API}/main/payroll/save-finalized`, {
      ...payroll,
      employee_id : payroll.recruiter_id,
      file_data   : base64File,
      file_name   : `payslip_${month}_${payroll.recruiter_id}.pdf`,
      content_type: "application/pdf",
      month,
    }, { headers });

    setSnackbar({ open:true, severity:"success",
      message:"✅ Finalized payroll saved" });
  } catch (err) {
    console.error(err);
    setSnackbar({ open:true, severity:"error", message:"❌ Save failed" });
  } finally {
    setSavingFinalized(false);
  }
};


 /* ─────────────────────────
   Front-end net-pay preview
───────────────────────── */
useEffect(() => {
  if (!payroll) return;

  if (!payroll.pay_frequency) {
    payroll.pay_frequency = "weekly";
  }
  if (payroll.vacation_percent == null) {
    payroll.vacation_percent = defaultVacationPercent(region, payroll.province);
  }
  if (payroll.include_vacation_in_gross === undefined) {
    payroll.include_vacation_in_gross = vacationIncludedByDefault(
      region,
      payroll.province
    );
  }

  const { net_pay } = recalcNetPay(payroll);
  setCalculatedNetPay(net_pay);
}, [payroll]);

/* 🔁 Auto-recalc with backend */
useEffect(() => {
  if (
    !autoRecalc ||
    !payroll?.recruiter_id ||
    !payroll?.rate ||
    !payroll?.hours_worked ||
    !payroll?.start_date || // <-- MUST be present
    !payroll?.end_date      // <-- MUST be present
  ) return;

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
    pay_frequency: payroll.pay_frequency || "weekly",
    vacation_percent: parseFloat(
      payroll.vacation_percent ?? defaultVacationPercent(region, payroll.province)
    ),
    include_vacation_in_gross:
      payroll.include_vacation_in_gross ??
      vacationIncludedByDefault(region, payroll.province),
    bonus: parseFloat(payroll.bonus || 0),
    tip: parseFloat(payroll.tip || 0),
    commission: parseFloat(payroll.commission || 0),
    vacation_pay: parseFloat(payroll.vacation_pay || 0),
    medical_insurance: parseFloat(payroll.medical_insurance || 0),
    dental_insurance: parseFloat(payroll.dental_insurance || 0),
    life_insurance: parseFloat(payroll.life_insurance || 0),
    retirement_amount: parseFloat(payroll.retirement_amount || 0),
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
    parental_top_up: parseFloat(payroll.parental_top_up || 0),
    shift_premium: parseFloat(payroll.shift_premium || 0),
    union_dues: parseFloat(payroll.union_dues || 0),
    garnishment: parseFloat(payroll.garnishment || 0),
    non_taxable_reimbursement: parseFloat(payroll.non_taxable_reimbursement || 0),
  };

  fetchPayrollPreview(payload, token)
    .then((preview) => {
      const num = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      const reg = num(
        preview.regular_hours ??
        preview.regularHours ??
        payroll.regular_hours ??
        payroll.regularHours
      );
      const ot = num(
        preview.overtime_hours ??
        preview.overtimeHours ??
        payroll.overtime_hours ??
        payroll.overtimeHours
      );
      const hol = num(
        preview.holiday_hours ??
        preview.holidayHours ??
        payroll.holiday_hours ??
        payroll.holidayHours
      );
      const leave = num(
        preview.parental_leave_hours ??
        preview.parentalLeaveHours ??
        payroll.parental_leave_hours ??
        payroll.parentalLeaveHours
      );
      const total = num(
        preview.hours_worked ??
        preview.total_hours ??
        preview.totalHours
      ) || reg + ot + hol + leave;

      setPayroll((prev) => ({
        ...prev,
        ...preview,
        hours_worked: total,
      }));
    })
    .catch((err) => {
      console.error("❌ Auto-recalc failed:", err.response?.data || err.message);
    });
}, [
  autoRecalc,
  /* basics */
  payroll.recruiter_id,
  payroll.rate,
  payroll.hours_worked,
  payroll.start_date,
  payroll.end_date,
  /* ➕ extra earnings */
  payroll.bonus,
  payroll.tip,
  payroll.commission,
  payroll.parental_insurance,
  payroll.travel_allowance,
  payroll.family_bonus,
  payroll.tax_credit,
  /* editable deductions */
  payroll.medical_insurance,
  payroll.dental_insurance,
  payroll.life_insurance,
  payroll.retirement_amount,
  payroll.deduction,
  payroll.shift_premium,
  payroll.union_dues,
  payroll.garnishment,
  payroll.non_taxable_reimbursement,
  payroll.parental_top_up,
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
    payroll.vacation_percent ?? defaultVacationPercent(region, payroll.province),
    include_vacation_in_gross:
    payroll.include_vacation_in_gross ??
    vacationIncludedByDefault(region, payroll.province),
    start_date: payroll.start_date,
    end_date: payroll.end_date,
    month,
    pay_frequency: payroll.pay_frequency || "weekly",

    bonus: payroll.bonus,
    tip: payroll.tip,
    commission: payroll.commission,
    vacation_pay: payroll.vacation_pay,
    medical_insurance: payroll.medical_insurance,
    dental_insurance: payroll.dental_insurance,
    life_insurance: payroll.life_insurance,
    retirement: payroll.retirement,
    retirement_amount: payroll.retirement_amount,
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
    parental_top_up: parseFloat(payroll.parental_top_up || 0),
    shift_premium: parseFloat(payroll.shift_premium || 0),
    union_dues: parseFloat(payroll.union_dues || 0),
    garnishment: parseFloat(payroll.garnishment || 0),
    non_taxable_reimbursement: parseFloat(payroll.non_taxable_reimbursement || 0),
  };

  console.log("📤 Sending manual recalc payload:", payload);

  fetchPayrollPreview(payload, token)
    .then((preview) => {
      const num = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      const reg = num(
        preview.regular_hours ??
        preview.regularHours ??
        payroll.regular_hours ??
        payroll.regularHours
      );
      const ot = num(
        preview.overtime_hours ??
        preview.overtimeHours ??
        payroll.overtime_hours ??
        payroll.overtimeHours
      );
      const hol = num(
        preview.holiday_hours ??
        preview.holidayHours ??
        payroll.holiday_hours ??
        payroll.holidayHours
      );
      const leave = num(
        preview.parental_leave_hours ??
        preview.parentalLeaveHours ??
        payroll.parental_leave_hours ??
        payroll.parentalLeaveHours
      );
      const total = num(
        preview.hours_worked ??
        preview.total_hours ??
        preview.totalHours
      ) || reg + ot + hol + leave;

      setPayroll((prev) => ({
        ...prev,
        ...preview,
        hours_worked: total,
      }));
    })
    .catch((err) => {
      console.error("❌ Preview fetch failed:", err.response?.data || err.message);
      setSnackbar({
        open: true,
        message: `❌ Preview failed: ${err.response?.data?.error || err.message}`,
        severity: "error",
      });
    });
};

  const handleSyncToXero = async () => {
    if (!payroll?.id) return;
    setXeroSyncing(true);
    try {
      const res = await xeroIntegration.exportPayroll({ payroll_id: payroll.id });
      setSnackbar({ open: true, message: "Payroll synced to Xero", severity: "success" });
      setPayroll((prev) =>
        prev
          ? {
              ...prev,
              xero_export_status: "success",
              xero_journal_id: res?.xero_journal_id || prev.xero_journal_id,
            }
          : prev
      );
      try {
        const [latestStatus, latestValidation] = await Promise.all([
          xeroIntegration.status().catch(() => null),
          xeroIntegration.validate().catch(() => null),
        ]);
        if (latestStatus) setXeroStatus(latestStatus);
        if (latestValidation) setXeroValidation(latestValidation);
      } catch {}
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error?.displayMessage ||
          error?.response?.data?.error ||
          "Failed to sync payroll to Xero",
        severity: "error",
      });
    } finally {
      setXeroSyncing(false);
    }
  };

  const handleSyncToQuickBooks = async () => {
    if (!payroll?.id) return;
    setQuickbooksSyncing(true);
    try {
      const res = await quickbooksIntegration.exportPayroll({ payroll_id: payroll.id });
      setSnackbar({ open: true, message: "Payroll synced to QuickBooks", severity: "success" });
      setPayroll((prev) =>
        prev
          ? {
              ...prev,
              qb_export_status: "success",
              qb_journal_id: res?.qb_journal_id || prev.qb_journal_id,
              qb_export_error: null,
            }
          : prev
      );
      try {
        const [latestStatus, latestValidation] = await Promise.all([
          quickbooksIntegration.status().catch(() => null),
          quickbooksIntegration.validate().catch(() => null),
        ]);
        if (latestStatus) setQuickbooksStatus(latestStatus);
        if (latestValidation) setQuickbooksValidation(latestValidation);
      } catch {}
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error?.displayMessage ||
          error?.response?.data?.error ||
          "Failed to sync payroll to QuickBooks",
        severity: "error",
      });
    } finally {
      setQuickbooksSyncing(false);
    }
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

  const xeroConnected = Boolean(xeroStatus?.connected);
  const xeroMappingReady = Boolean(xeroValidation?.payroll?.ok);
  const xeroChipMeta = getIntegrationStatusChip(payroll?.xero_export_status || "pending");
  const xeroSyncDisabled =
    xeroSyncing || !xeroConnected || !xeroMappingReady || !payroll?.id;
  const xeroSyncTooltip = !xeroConnected
    ? "Connect Xero in Settings"
    : !xeroMappingReady
    ? "Complete payroll mapping in Settings → Xero"
    : !payroll?.id
    ? "Save this payroll before syncing"
    : "";

  const quickbooksConnected = Boolean(quickbooksStatus?.connected);
  const quickbooksMappingReady = Boolean(quickbooksValidation?.payroll?.ok);
  const quickbooksChipMeta = getIntegrationStatusChip(payroll?.qb_export_status || "pending");
  const quickbooksSyncDisabled =
    quickbooksSyncing || !quickbooksConnected || !quickbooksMappingReady || !payroll?.id;
  const quickbooksSyncTooltip = !quickbooksConnected
    ? "Connect QuickBooks in Settings"
    : !quickbooksMappingReady
    ? "Complete payroll mapping in Settings → QuickBooks"
    : !payroll?.id
    ? "Save this payroll before syncing"
    : "";

  /* ────────────────────────────────────────────────
     ⬇️ UI
  ──────────────────────────────────────────────── */
  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
          Payroll Preview for {payroll.employee_name || payroll.name || selectedRecruiter?.name || "--"}
        </Typography>
        <Tooltip title="Field-by-field help">
          <IconButton size="small" onClick={() => setHelpOpen(true)}>
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider sx={{ my: 2 }} />
      
      {payroll.on_parental_leave && (
      <Alert severity="info" sx={{ mb: 2 }}>
        This pay period is covered by approved parental/maternity/paternity leave.
        {payroll.parental_top_up > 0 && (
          <> Employer top-up: {formatCurrency(payroll.parental_top_up)} </>
        )}
      </Alert>
    )}

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
            helperText="Calculated from approved shifts"
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={3}>
  <TextField
    label="Parental Leave Hours"
    value={payroll.parental_leave_hours || 0}
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
          "parental_top_up",
          "family_bonus",
          "tax_credit",
          "medical_insurance",
          "dental_insurance",
          "life_insurance",
          "retirement_amount",
          "deduction",
          "shift_premium",
          "union_dues",
          "garnishment",

        ].map((key) => (
          <Grid item xs={12} md={3} key={key}>
            <TextField
              label={
                {
                  shift_premium: "Shift Premium ($)",
                  union_dues: "Union Dues ($)",
                  garnishment: "Garnishment ($)",
                  vacation_pay: "Vacation Pay ($)",
                  travel_allowance: "Travel Allowance ($)",
                  parental_insurance: "Parental Insurance ($)",
                  parental_top_up: "Parental Leave Top-up ($)",
                  family_bonus: "Family Bonus ($)",
                  tax_credit: "Tax Credit ($)",
                  medical_insurance: "Medical Insurance ($)",
                  dental_insurance: "Dental Insurance ($)",
                  life_insurance: "Life Insurance ($)",
                  retirement_amount: "Retirement (employee) ($)",
                  deduction: "Other Deduction ($)",
                }[key] ||
                key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase()) + " ($)"
              }
              type="number"
              value={payroll[key] || 0}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              fullWidth
              helperText={
                {
                  shift_premium: "Taxable extra pay for night/evening/weekend work.",
                  union_dues: "Employee-paid union dues. Reduces net; goes to T4 Box 44.",
                  garnishment: "Flat legal deduction (e.g., child support). No remittance automation.",
                  non_taxable_reimbursement: "Reimbursed to employee but not taxed.",
                }[key] || ""
              }
            />
          </Grid>
        ))}

        <Grid item xs={12} md={3}>
          <TextField
            label="Non-taxable Reimbursement ($)"
            type="number"
            value={payroll.non_taxable_reimbursement || 0}
            onChange={(e) => handleFieldChange("non_taxable_reimbursement", e.target.value)}
            fullWidth
            helperText="Repay expenses without taxing them. Added to net pay only."
          />
        </Grid>
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

  <Grid item xs={12} md={3}>
  <TextField
    label="Retirement Contribution ($)"
    type="number"
    value={payroll.retirement_amount || 0}
    onChange={(e) => handleFieldChange("retirement_amount", e.target.value)}
    fullWidth
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
            value={formatCurrency(calculatedNetPay)}
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
      ${Number(payroll.flags.bpa_annual || 0).toFixed(2)}
    </Alert>
    <Alert severity="success" sx={{ mb: 1 }}>
      <strong>BPA Used:</strong>{" "}
      ${Number((payroll.flags.bpa_annual || 0) - (payroll.flags.bpa_remaining || 0)).toFixed(2)}
      {" / "}
      ${Number(payroll.flags.bpa_annual || 0).toFixed(2)}
    </Alert>
    <Alert severity="info" sx={{ mb: 1 }}>
      <strong>BPA Applied This Period:</strong>{" "}
      ${Number(payroll.flags.bpa_applied || 0).toFixed(2)} ({payroll.pay_frequency})
    </Alert>
    <Alert severity="warning" sx={{ mb: 1 }}>
      <strong>BPA Remaining:</strong>{" "}
      ${Number(payroll.flags.bpa_remaining || 0).toFixed(2)}
    </Alert>
  </Box>
)}


      {/* Federal bracket breakdown */}
      {payroll?.federal_brackets?.length > 0 && (
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">Federal Brackets Used</Typography>
          {payroll.federal_brackets.map((b, i) => (
            <Typography key={i}>
              ${Number(b.from || 0).toFixed(2)} –{" "}
              {b.to && isFinite(Number(b.to))
                ? `$${Number(b.to).toFixed(2)}`
                : "∞"} @ {Number(b.rate * 100 || 0).toFixed(2)}%
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
      {/* --------------------------------------------------
         Action buttons
-------------------------------------------------- */}
      <Divider sx={{ my: 2 }} />

      <Stack spacing={1} sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2">Xero</Typography>
            <Chip size="small" color={xeroChipMeta.color} label={xeroChipMeta.label} />
            {payroll?.xero_journal_id && (
              <Typography variant="body2" color="text.secondary">
                #{payroll.xero_journal_id}
              </Typography>
            )}
          </Stack>
          <Box flexGrow={1} />
          <Tooltip
            title={xeroSyncTooltip}
            disableHoverListener={!xeroSyncDisabled || !xeroSyncTooltip}
          >
            <span>
              <Button
                variant="outlined"
                startIcon={xeroSyncing ? <CircularProgress size={18} /> : <CloudUploadIcon />}
                disabled={xeroSyncDisabled}
                onClick={handleSyncToXero}
              >
                Sync to Xero
              </Button>
            </span>
          </Tooltip>
        </Stack>
        {payroll?.xero_export_error && (
          <Alert severity="warning">{payroll.xero_export_error}</Alert>
        )}
        {!xeroConnected && (
          <Alert severity="info">
            Connect Xero from Settings → Xero to enable payroll exports.
          </Alert>
        )}
        {xeroConnected && !xeroMappingReady && (
          <Alert severity="warning">
            Complete the payroll account mapping in Settings → Xero before syncing.
          </Alert>
        )}
      </Stack>

      <Stack spacing={1} sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2">QuickBooks</Typography>
            <Chip size="small" color={quickbooksChipMeta.color} label={quickbooksChipMeta.label} />
            {payroll?.qb_journal_id && (
              <Typography variant="body2" color="text.secondary">
                #{payroll.qb_journal_id}
              </Typography>
            )}
          </Stack>
          <Box flexGrow={1} />
          <Tooltip
            title={quickbooksSyncTooltip}
            disableHoverListener={!quickbooksSyncDisabled || !quickbooksSyncTooltip}
          >
            <span>
              <Button
                variant="outlined"
                startIcon={quickbooksSyncing ? <CircularProgress size={18} /> : <CloudUploadIcon />}
                disabled={quickbooksSyncDisabled}
                onClick={handleSyncToQuickBooks}
              >
                Sync to QuickBooks
              </Button>
            </span>
          </Tooltip>
        </Stack>
        {payroll?.qb_export_error && (
          <Alert severity="warning">{payroll.qb_export_error}</Alert>
        )}
        {!quickbooksConnected && (
          <Alert severity="info">
            Connect QuickBooks from Settings → QuickBooks to enable payroll exports.
          </Alert>
        )}
        {quickbooksConnected && !quickbooksMappingReady && (
          <Alert severity="warning">
            Complete the payroll account mapping in Settings → QuickBooks before syncing.
          </Alert>
        )}
      </Stack>

      <DownloadPayrollButton
        recruiterId={payroll.recruiter_id}
        payroll={payroll}
        month={month}
        region={payroll.region || region || "ca"}
        startDate={payroll.start_date}
        endDate={payroll.end_date}
        token={token}
        selectedColumns={[
          "regular_hours",
          "overtime_hours",
          "bonus",
          "commission",
          "tip",
          "parental_top_up",
          "parental_leave_hours",
          "on_parental_leave",
          "gross_pay",
          "net_pay",
          "federal_tax_amount",
          "provincial_tax_amount",
        ]}
      />

      <Button
        variant="contained"
        color="primary"
        sx={{ ml: 2 }}
        disabled={savingFinalized}
        onClick={saveFinalizedPayroll}
      >
        {savingFinalized ? <CircularProgress size={18} /> : "Finalize & Save"}
      </Button>

      {/* Help Drawer */}
      <PayrollPreviewHelp open={helpOpen} onClose={() => setHelpOpen(false)} />

{/* Template save / load */}
<Box sx={{ display: "flex", gap: 1, my: 2 }}>
  <Button
    onClick={() => {
      localStorage.setItem(
        `payroll-template-${selectedRecruiter}-${month}`,
        JSON.stringify(payroll)
      );
      setSnackbar({ open: true, message: "Template saved", severity: "success" });
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
        setSnackbar({ open: true, message: "Template loaded", severity: "info" });
      } else {
        setSnackbar({ open: true, message: "No saved template", severity: "warning" });
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
      🛠 Shift Breakdown&nbsp;(Debug)
    </Typography>
    <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
          <th style={{ padding: "8px" }}>Date</th>
          <th style={{ padding: "8px" }}>Clock&nbsp;In</th>
          <th style={{ padding: "8px" }}>Clock&nbsp;Out</th>
          <th style={{ padding: "8px" }}>Duration&nbsp;(hrs)</th>
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
    <ul style={{ paddingLeft: "1rem", color: "#666", fontSize: "14px" }}>
      {payroll.debug_logs.map((log, i) => (
        <li key={i}>{log}</li>
      ))}
    </ul>
  </Box>
)}

    </Box>
  );
}
