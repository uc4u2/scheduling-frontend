import React, { useEffect, useState } from "react";
import {
  Drawer,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Divider,
  Box,
  Grid,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Button,
  TextField,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Checkbox,
  FormControlLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import Stack from "@mui/material/Stack";
import { HelpOutline } from "@mui/icons-material";
import api from "../../utils/api";
import UpgradeNoticeBanner from "../../components/billing/UpgradeNoticeBanner";
import dayjs from "dayjs";
import DownloadPayrollButton from "./DownloadPayrollButton";
import { recalcNetPay } from "./netpay";
import PayrollFilters from "./PayrollFilters";
import PayrollPreview from "./PayrollPreview";
import PayslipModal from "./PayslipModal";
import { savePayroll, exportPayroll } from "./netpay";
import { vacationIncludedByDefault, defaultVacationPercent } from "./utils/payrollRules";
import ManagementFrame from "../../components/ui/ManagementFrame";
import PayrollScenarios from "./PayrollScenarios";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

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
  const [guideTab, setGuideTab] = useState("overview");

  /* ── domain state ── */
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [exportAllEmployees, setExportAllEmployees] = useState(true);
  const [exportEmployeeIds, setExportEmployeeIds] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [missingExternalEmployees, setMissingExternalEmployees] = useState([]);
  const [providerCsvMismatchEmployees, setProviderCsvMismatchEmployees] = useState([]);
  const [expensePreset, setExpensePreset] = useState("this_year");
  const [expenseStartDate, setExpenseStartDate] = useState(dayjs().startOf("year").format("YYYY-MM-DD"));
  const [expenseEndDate, setExpenseEndDate] = useState(dayjs().endOf("year").format("YYYY-MM-DD"));
  const [expenseRegion, setExpenseRegion] = useState("all");
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseReport, setExpenseReport] = useState(null);
  const [region, setRegion] = useState("ca");
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [payFrequency, setPayFrequency] = useState("biweekly");
  const [payFreqTouched, setPayFreqTouched] = useState(false);
  const [recruiterProfile, setRecruiterProfile] = useState(null);
  const [companyPayDateRule, setCompanyPayDateRule] = useState("end_date");
  const [companyPayDateOffsetDays, setCompanyPayDateOffsetDays] = useState(0);
  

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
    // load company defaults
    const loadPrefs = async () => {
      try {
        // Prefer company profile (adds default_pay_frequency) and fall back silently
        const res = await api.get(`/admin/company-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const defaultPayFreq =
          res.data?.default_pay_frequency || res.data?.company_default_pay_frequency;
        if (defaultPayFreq && !payFreqTouched) {
          setPayFrequency(defaultPayFreq);
        }
        if (res.data?.payroll_pay_date_rule) {
          setCompanyPayDateRule(res.data.payroll_pay_date_rule);
        }
        if (res.data?.payroll_pay_date_offset_days !== undefined && res.data?.payroll_pay_date_offset_days !== null) {
          setCompanyPayDateOffsetDays(res.data.payroll_pay_date_offset_days);
        }
      } catch (err) {
        console.error("Failed to load company defaults", err?.response?.data || err.message);
      }
    };
    loadPrefs();
  }, [token, payFreqTouched]);

useEffect(() => {
  if (!selectedRecruiter) {
    setRecruiterProfile(null);
    return;
  }
  let active = true;
  const loadProfile = async () => {
    try {
      const res = await api.get(`/api/recruiters/${selectedRecruiter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (active) setRecruiterProfile(res.data);
    } catch (err) {
      console.error("Failed to load recruiter profile", err);
      if (active) setRecruiterProfile(null);
    }
  };
  loadProfile();
  return () => {
    active = false;
  };
}, [selectedRecruiter, token]);

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

  api
    .get(`/payroll/ytd`, {
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
      const res = await api.get(`/manager/recruiters`, {
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

  const filteredRecruiters = departmentFilter
    ? recruiters.filter((r) => String(r.department_id) === String(departmentFilter))
    : recruiters;

  const effectiveExportEmployeeIds = exportAllEmployees
    ? []
    : exportEmployeeIds.length
    ? exportEmployeeIds
    : selectedRecruiter
    ? [selectedRecruiter]
    : [];

  const buildExportParams = () => {
    if (!region || !startDate || !endDate) return null;
    return {
      region,
      start_date: startDate,
      end_date: endDate,
      department_id: departmentFilter || undefined,
      employee_ids: effectiveExportEmployeeIds,
    };
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadFinalizedCsv = async () => {
    const params = buildExportParams();
    if (!params) {
      showMessage("Select a region and pay period first.", "warning");
      return;
    }
    setExporting(true);
    try {
      setMissingExternalEmployees([]);
      const res = await api.get(`/automation/payroll/export-finalized`, {
        params: {
          recruiter_id: params.employee_ids || [],
          region: params.region,
          start_date: params.start_date,
          end_date: params.end_date,
          format: "csv",
        },
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      downloadBlob(res.data, `finalized_payroll_${params.region}_${params.start_date}_${params.end_date}.csv`);
    } catch (err) {
      console.error(err);
      showMessage("Export failed.", "error");
    } finally {
      setExporting(false);
    }
  };

  const downloadSummaryCsv = async () => {
    const params = buildExportParams();
    if (!params) {
      showMessage("Select a region and pay period first.", "warning");
      return;
    }
    setExporting(true);
    try {
      setMissingExternalEmployees([]);
      const res = await api.get(`/automation/payroll/export-finalized-summary-csv`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
        paramsSerializer: (p) => {
          const sp = new URLSearchParams();
          Object.entries(p).forEach(([k, v]) => {
            if (v === undefined || v === null || v === "") return;
            if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
            else sp.set(k, v);
          });
          return sp.toString();
        },
      });
      downloadBlob(res.data, `payroll_summary_${params.region}_${params.start_date}_${params.end_date}.csv`);
    } catch (err) {
      console.error(err);
      showMessage("Summary export failed.", "error");
    } finally {
      setExporting(false);
    }
  };

  const downloadPayslipsZip = async () => {
    const params = buildExportParams();
    if (!params) {
      showMessage("Select a region and pay period first.", "warning");
      return;
    }
    setExporting(true);
    try {
      const res = await api.get(`/automation/payroll/export-finalized-payslips-zip`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
        paramsSerializer: (p) => {
          const sp = new URLSearchParams();
          Object.entries(p).forEach(([k, v]) => {
            if (v === undefined || v === null || v === "") return;
            if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
            else sp.set(k, v);
          });
          return sp.toString();
        },
      });
      downloadBlob(res.data, `payslips_${params.region}_${params.start_date}_${params.end_date}.zip`);
    } catch (err) {
      console.error(err);
      showMessage("Payslip ZIP export failed.", "error");
    } finally {
      setExporting(false);
    }
  };

  const downloadProviderImportCsv = async () => {
    const params = buildExportParams();
    if (!params) {
      showMessage("Select a region and pay period first.", "warning");
      return;
    }
    setExporting(true);
    try {
      setMissingExternalEmployees([]);
      setProviderCsvMismatchEmployees([]);
      const res = await api.get(`/automation/payroll/export-finalized-provider-csv`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
        paramsSerializer: (p) => {
          const sp = new URLSearchParams();
          Object.entries(p).forEach(([k, v]) => {
            if (v === undefined || v === null || v === "") return;
            if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
            else sp.set(k, v);
          });
          return sp.toString();
        },
      });
      downloadBlob(res.data, `provider_import_${params.region}_${params.start_date}_${params.end_date}.csv`);
    } catch (err) {
      console.error(err);
      try {
        const blob = err?.response?.data;
        if (blob instanceof Blob) {
          const text = await blob.text();
          const parsed = JSON.parse(text);
          if (parsed?.error === "missing_external_employee_id" && Array.isArray(parsed?.employees)) {
            setMissingExternalEmployees(parsed.employees);
            showMessage("Provider export blocked: missing external employee IDs.", "warning");
          } else if (
            parsed?.error === "gross_pay_mismatch_sum_of_earnings" &&
            Array.isArray(parsed?.employees)
          ) {
            setProviderCsvMismatchEmployees(parsed.employees);
            showMessage("Provider export blocked: gross pay does not match earnings columns.", "warning");
          } else if (parsed?.error === "no_provider_import_rows_after_filters") {
            showMessage("No provider import rows found (all employees had 0 gross pay or were not finalized).", "warning");
          } else {
            showMessage(parsed?.error || "Provider CSV export failed.", "error");
          }
        } else {
          showMessage("Provider CSV export failed.", "error");
        }
      } catch {
        showMessage("Provider CSV export failed.", "error");
      }
    } finally {
      setExporting(false);
    }
  };

  const applyExpensePreset = (preset) => {
    const now = dayjs();
    if (preset === "this_year") {
      setExpenseStartDate(now.startOf("year").format("YYYY-MM-DD"));
      setExpenseEndDate(now.endOf("year").format("YYYY-MM-DD"));
      return;
    }
    if (preset === "last_year") {
      const last = now.subtract(1, "year");
      setExpenseStartDate(last.startOf("year").format("YYYY-MM-DD"));
      setExpenseEndDate(last.endOf("year").format("YYYY-MM-DD"));
      return;
    }
    if (preset === "this_quarter") {
      setExpenseStartDate(now.startOf("quarter").format("YYYY-MM-DD"));
      setExpenseEndDate(now.endOf("quarter").format("YYYY-MM-DD"));
      return;
    }
    if (preset === "last_quarter") {
      const last = now.subtract(1, "quarter");
      setExpenseStartDate(last.startOf("quarter").format("YYYY-MM-DD"));
      setExpenseEndDate(last.endOf("quarter").format("YYYY-MM-DD"));
      return;
    }
    // custom: do nothing
  };

  useEffect(() => {
    applyExpensePreset(expensePreset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expensePreset]);

  const formatMoney = (val) => (Number(val || 0)).toFixed(2);

  const loadExpenseReport = async () => {
    if (!expenseStartDate || !expenseEndDate) {
      showMessage("Select a start and end date.", "warning");
      return;
    }
    setExpenseLoading(true);
    try {
      const params = { start_date: expenseStartDate, end_date: expenseEndDate };
      if (expenseRegion && expenseRegion !== "all") params.region = expenseRegion;
      if (departmentFilter) params.department_id = departmentFilter;
      const res = await api.get(`/automation/payroll/company-expense-report`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenseReport(res.data || null);
    } catch (err) {
      console.error(err);
      showMessage("Failed to generate expense report.", "error");
    } finally {
      setExpenseLoading(false);
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
  
      const res = await api.get(`/payroll/history`, {
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
    const recurringDefaults = {
      garnishment: recruiterProfile?.default_garnishment,
      union_dues: recruiterProfile?.default_union_dues,
      medical_insurance: recruiterProfile?.default_medical_insurance,
      dental_insurance: recruiterProfile?.default_dental_insurance,
      life_insurance: recruiterProfile?.default_life_insurance,
      retirement_amount: recruiterProfile?.default_retirement_amount,
      deduction: recruiterProfile?.default_deduction,
      parental_insurance: recruiterProfile?.default_parental_insurance,
    };
    Object.entries(recurringDefaults).forEach(([key, value]) => {
      if (key === "parental_insurance" && region !== "ca" && region !== "qc") {
        return;
      }
      if (isEmpty(updated[key]) && value !== undefined && value !== null) {
        updated[key] = value;
      }
    });

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
    const location =
      region === "us"
        ? { state: payload.state || payroll?.state }
        : { province: payload.province || payroll?.province };
    const body = {
      recruiter_id: selectedRecruiter,
      region,
      month,
      pay_frequency: payFrequency,
      ...location,
      ...payload, // ✅ correct spread
    };

    const res = await api.post(`/payroll/calculate`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
  
    return res.data;
  };
  
  const recurringDefaultMap = {
    garnishment: Number(recruiterProfile?.default_garnishment ?? 0) || 0,
    union_dues: Number(recruiterProfile?.default_union_dues ?? 0) || 0,
    medical_insurance: Number(recruiterProfile?.default_medical_insurance ?? 0) || 0,
    dental_insurance: Number(recruiterProfile?.default_dental_insurance ?? 0) || 0,
    life_insurance: Number(recruiterProfile?.default_life_insurance ?? 0) || 0,
    retirement_amount: Number(recruiterProfile?.default_retirement_amount ?? 0) || 0,
    deduction: Number(recruiterProfile?.default_deduction ?? 0) || 0,
  };

  const resetOneOffFields = [
    "bonus",
    "attendance_bonus",
    "performance_bonus",
    "commission",
    "tip",
    "travel_allowance",
    "shift_premium",
    "parental_top_up",
    "parental_insurance",
    "family_bonus",
    "tax_credit",
    "non_taxable_reimbursement",
  ];

  useEffect(() => {
    if (!selectedRecruiter) return;
    setPayroll((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      resetOneOffFields.forEach((key) => {
        next[key] = 0;
      });
      Object.entries(recurringDefaultMap).forEach(([key, value]) => {
        next[key] = value ?? 0;
      });
      return next;
    });
  }, [selectedRecruiter, startDate, endDate, region, payFrequency, recruiterProfile]);

  // When recruiter profile arrives later, inject recurring defaults into current payroll
  useEffect(() => {
    if (!recruiterProfile || !payroll) return;
    setPayroll((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      Object.entries(recurringDefaultMap).forEach(([key, value]) => {
        next[key] = value ?? 0;
      });
      return next;
    });
  }, [recruiterProfile]);

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
      const genRes = await api.post(
        `/automation/payroll/generate`,
        {
          recruiter_id: selectedRecruiter,
          region,
          start_date: startDate,
          end_date: endDate,
          pay_frequency: payFrequency,
          ...(region === "us"
            ? { state: payroll?.state || "CA" }
            : { province: payroll?.province || "ON" }),
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
        ...(region === "us"
          ? { state: payroll?.state || generatedRecord.state || "CA" }
          : { province: payroll?.province || generatedRecord.province || "ON" }),
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
        parental_top_up:
          payroll?.parental_top_up ?? generatedRecord.parental_top_up ?? 0,
        shift_premium:
          payroll?.shift_premium ?? generatedRecord.shift_premium ?? 0,

        /* ➖ insurance & retirement overrides (deduction side) */
        medical_insurance:
          payroll?.medical_insurance ??
          generatedRecord.medical_insurance ??
          recurringDefaultMap.medical_insurance ??
          0,
        dental_insurance:
          payroll?.dental_insurance ??
          generatedRecord.dental_insurance ??
          recurringDefaultMap.dental_insurance ??
          0,
        life_insurance:
          payroll?.life_insurance ??
          generatedRecord.life_insurance ??
          recurringDefaultMap.life_insurance ??
          0,
        retirement_amount:
          payroll?.retirement_amount ??
          generatedRecord.retirement_amount ??
          recurringDefaultMap.retirement_amount ??
          0,
        deduction:
          payroll?.deduction ?? generatedRecord.deduction ?? recurringDefaultMap.deduction ?? 0,
        union_dues:
          payroll?.union_dues ?? generatedRecord.union_dues ?? recurringDefaultMap.union_dues ?? 0,
        garnishment:
          payroll?.garnishment ?? generatedRecord.garnishment ?? recurringDefaultMap.garnishment ?? 0,
        non_taxable_reimbursement:
          payroll?.non_taxable_reimbursement ??
          generatedRecord.non_taxable_reimbursement ??
          0,
      };

      const calcRes = await api.post(`/payroll/calculate`, base, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { flags = {}, ...payrollData } = calcRes.data || {};

      // Prefer backend-calculated hours; if missing, derive from regular + OT
      const num = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      // Prefer backend preview values, fall back to generated base values
      const regFromPreview = num(
        payrollData.regular_hours ??
        payrollData.regularHours ??
        base.regular_hours ??
        base.regularHours
      );
      const otFromPreview = num(
        payrollData.overtime_hours ??
        payrollData.overtimeHours ??
        base.overtime_hours ??
        base.overtimeHours
      );
      const holFromPreview = num(
        payrollData.holiday_hours ??
        payrollData.holidayHours ??
        base.holiday_hours ??
        base.holidayHours
      );
      const leaveFromPreview = num(
        payrollData.parental_leave_hours ??
        payrollData.parentalLeaveHours ??
        base.parental_leave_hours ??
        base.parentalLeaveHours
      );
      const totalFromPreview = num(
        payrollData.hours_worked ??
        payrollData.total_hours ??
        payrollData.totalHours ??
        base.total_hours ??
        base.hours_worked
      );
      const hoursFromPreview =
        (totalFromPreview ||
          regFromPreview + otFromPreview + holFromPreview + leaveFromPreview) || 0;

      setPayroll({
        ...base,
        ...payrollData,
        id: base.id,
        payroll_id: base.payroll_id,
        hours_worked: hoursFromPreview,
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
      "family_bonus", "tax_credit", "deduction",
      "parental_top_up", "shift_premium", "union_dues",
      "garnishment", "non_taxable_reimbursement",
      "medical_insurance", "dental_insurance", "life_insurance", "retirement_amount"].includes(field)) {
 
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
      const res = await api.delete("/payroll/delete", {
        headers: { Authorization: `Bearer ${token}` },
        params: Object.fromEntries(queryParams.entries()),
      });
      const result = res.data || {};
      showMessage(result.message || "✅ Deleted successfully.", "success");
      fetchPayslipHistory();
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
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          component={RouterLink}
          to="/manager/payroll/retirement"
          variant="outlined"
          size="small"
        >
          Retirement plan settings
        </Button>
        <Tooltip title="Payroll Guide">
          <IconButton onClick={() => setGuideOpen(true)}>
            <HelpOutline />
          </IconButton>
        </Tooltip>
      </Stack>
    }
  >
    <UpgradeNoticeBanner
      requiredPlan="pro"
      message="Payroll features require the Pro plan or higher."
    />

   {/* Guide Drawer */}
<Drawer anchor="right" open={guideOpen} onClose={() => setGuideOpen(false)}>
  <Box sx={{ width: 600, p: 3 }}>
    <Typography variant="h5" gutterBottom>
      Payroll Coverage & Help
    </Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      What we support, how calculations work, and step-by-step + scenario guidance.
    </Typography>
    <Tabs
      value={guideTab}
      onChange={(_, v) => setGuideTab(v)}
      sx={{ mb: 2 }}
      textColor="primary"
      indicatorColor="primary"
    >
      <Tab value="overview" label="Guide" />
      <Tab value="scenarios" label="Scenarios" />
    </Tabs>
    <Divider sx={{ mb: 2 }} />

    {guideTab === "overview" && (
      <>
        <Typography variant="h5" gutterBottom>🇺🇸 U.S. Payroll Coverage (2025)</Typography>
        <Typography variant="body1" gutterBottom>
          Supported (core compliance):
        </Typography>
        <ul>
          <li>✅ Federal income tax</li>
          <li>✅ State income tax (where applicable)</li>
          <li>✅ FICA: Social Security & Medicare</li>
          <li>✅ SUI/SUTA (employer unemployment)</li>
          <li>✅ PTO & time tracking</li>
          <li>✅ Shift premiums (taxable earnings)</li>
          <li>✅ Simple union dues (employee deduction)</li>
          <li>✅ Simple garnishments (flat amounts; no automatic %-of-disposable-income logic)</li>
          <li>✅ Payroll exports (PDF / CSV / XLSX)</li>
          <li>✅ W-2 generation / export</li>
        </ul>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}><strong>🧾 Enterprise 401(k) (U.S.)</strong></Typography>
        <Typography variant="body2" gutterBottom>
          Schedulaa supports enterprise-grade 401(k) for U.S. payroll.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Company defaults: set in Payroll → Retirement Plans (percent/flat method, default rate, annual IRS limit, cap enforcement, optional employer match).
          Employees follow the company default unless overridden.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Employee overrides: optional per-employee elections in Employee Profile → Employee 401(k) Settings. Blank = company default applies. Overrides can include rate and effective start date; they affect only that employee.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Caps & reporting: employee contributions cap automatically at the IRS limit; contributions stop when capped and resume next year. W-2 reporting is automatic: Box 1 reduced by deferrals, Box 3 & 5 unchanged, Box 12 (code D) shows total employee deferral.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Important: If no retirement plan is configured, no 401(k) contributions occur. 401(k) is optional; leaving everything blank results in normal payroll.
        </Typography>
        <Typography variant="body1" gutterBottom>Not supported / not automated:</Typography>
        <ul>
          <li>❌ Local/city taxes (e.g., NYC, STL, CO locals)</li>
          <li>❌ Special payroll taxes (e.g., OR transit, WA Paid Family)</li>
          <li>❌ Automated garnishment workflows (court-order logic/remittance must be external)</li>
        </ul>
        <Typography variant="body2" gutterBottom>
          Company default pay frequency and employee recurring deduction defaults help prevent setup mistakes across pay runs.
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 2 }}><strong>📍 States Fully Supported (2025)</strong></Typography>
        <Typography variant="body2">
          ✓ AL, AZ, AR, CA***, CO, CT, DE, DC, FL, GA, ID, IL, IN, IA, KS, KY, LA, ME, MD**, MA, MI, MN, MS, MO**, MT, NE, NV, NH*, NJ**, NM, NC, ND, OH**, OK, OR**, PA**, SC, SD, TN*, TX, UT, VT, VA, WA**, WV, WI, WY
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
          * TN & NH: No earned income tax (only dividend/interest tax).<br />
          ** Local taxes may apply (not supported). (Examples: MD county tax, MO St. Louis/KC, NJ locals/transit, OH municipalities, OR TriMet/Metro, PA local EIT, WA certain cities.)<br />
          *** CA: SDI not withheld by default; handle externally if required.
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1.5 }}>
          Note: Schedulaa calculates federal and state taxes in supported states. Local/city/municipal taxes are not automatically calculated and must be handled externally where applicable.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>🇨🇦 Canadian Payroll Coverage (2025)</Typography>
        <Typography variant="body1" gutterBottom>
          Supported (ex‑Québec):
        </Typography>
        <ul>
          <li>✅ Federal & provincial income tax (outside QC)</li>
          <li>✅ CPP (with CPP-exempt employees)</li>
          <li>✅ EI (with EI-exempt employees)</li>
          <li>✅ Vacation pay & accrual</li>
          <li>✅ Statutory holiday pay</li>
          <li>✅ Paid vs unpaid leave</li>
          <li>✅ BPA with YTD tracking</li>
          <li>✅ T4: 14, 16/26, 18/24, 22, 40 (taxable benefits), 44 (union dues)</li>
          <li>✅ ROE (PDF/XML)</li>
          <li>✅ Simple union dues & garnishments</li>
          <li>✅ Non-taxable reimbursements (recorded, excluded from gross/taxes)</li>
        </ul>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}><strong>🧾 RRSP (Canada)</strong></Typography>
        <Typography variant="body2" gutterBottom>
          RRSP in Canada is employee-based (no company-wide default).
        </Typography>
        <Typography variant="body2" gutterBottom>
          RRSP contributions are set per employee in Employee Profile. Leaving RRSP fields blank means the employee does not contribute.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Employer RRSP: employer match can be recorded per employee if offered. Employer-paid RRSP may be treated as taxable benefits and reported in T4 Box 40 depending on plan design.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Important: Schedulaa does not enforce a company-wide RRSP cap. Enterprise retirement plans apply to U.S. 401(k) only.
        </Typography>
        <Typography variant="body1" gutterBottom>Not supported / not automated:</Typography>
        <ul>
          <li>❌ Québec payroll (QPP, RQAP/QPIP)</li>
          <li>❌ Advanced, plan-specific fringe benefit taxation beyond standard Box 40 treatment</li>
          <li>❌ Automated garnishment workflows</li>
        </ul>
        <Typography variant="body2" gutterBottom>
          Company default pay frequency and employee recurring deduction defaults help prevent setup mistakes across pay runs.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>How Schedulaa Payroll Works (US & Canada)</Typography>
        <Typography variant="body2" gutterBottom>
          Payroll combines: (1) Company settings (default pay frequency), (2) Employee profile (country/location, rate, CPP/EI flags, union member, recurring payroll defaults like union dues/garnishment/insurance/retirement), (3) Time & leave (approved shifts, paid/unpaid leave, stat holidays), (4) Manager overrides (bonus, commission, tips, shift premium, allowances, one-off reimbursements, per-period adjustments). Every finalize is logged in the Payroll Audit Log (who finalized/overwrote and when).
        </Typography>
        <Typography variant="body2" gutterBottom>
          Retirement defaults vs employee overrides: United States (401(k)) — Company retirement plans define defaults for all employees; Employee Profile retirement fields are optional overrides only. Canada (RRSP) — No company default exists; Employee Profile RRSP fields are the primary setup. Leaving retirement fields blank always results in no retirement contribution.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Gross = base earnings + vacation + taxable extras (incl. shift premium). Deductions = taxes + statutory + retirement + union dues + garnishment + other deductions. Net pay = Gross − Deductions + Non-taxable reimbursements.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Year-end: W-2 (US) for core boxes; T4 (CA) includes 14/16/18/22/24/26/40/44; ROE for insurable earnings/hours.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>Step-by-Step: Running Payroll</Typography>
        <ol style={{ paddingLeft: 18 }}>
          <li><strong>Set up employees:</strong> Country/location, rate; (CA) CPP/EI exempt if applicable; union member if applicable.</li>
          <li><strong>Approve time & leave:</strong> Shifts clock-in/out, paid vs unpaid leave, stat holidays.</li>
          <li><strong>Load preview:</strong> Pick employee, region, period, pay frequency; click Load preview. Pay frequency is prefilled from Company Profile defaults. Recurring deductions (union dues, garnishment, insurance, retirement, other deduction) can auto-fill from the Employee Profile.</li>
          <li><strong>Adjust earnings:</strong> Bonus, commission, tips, shift premium, allowances, vacation override, non-taxable reimbursement.</li>
          <li><strong>Adjust deductions:</strong> Taxes (auto), CPP/QPP/EI/RQAP or FICA/Medicare (auto), insurance, retirement, union dues, garnishment, other deductions.</li>
          <li><strong>Validate & finalize:</strong> Preview payslip; finalize & send—writes FinalizedPayroll and saves overrides.</li>
          <li><strong>Raw data & exports:</strong> Filter by employee/department/region; export CSV/XLSX with all earnings/deductions.</li>
          <li><strong>Year-end:</strong> T4 (boxes 14/16/18/22/24/26/40/44), W-2 core boxes, ROE (CA) as needed.</li>
        </ol>
        <Typography variant="body2" gutterBottom>
          Payroll workflows send finalized data to accounting or automation tools; employee payments and tax remittances remain external to Schedulaa.
        </Typography>

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>New pay periods start fresh</Typography>
        <Typography variant="body2" gutterBottom>
          New pay periods start clean: one-off fields like tips, bonus, commission, shift premium, and reimbursements default to 0 each run. Recurring deductions (union dues, garnishment, insurance, retirement, other deductions) can be set as Employee Profile defaults and will auto-fill each period. For retirement: U.S. 401(k) defaults are applied automatically from the company plan; Canada RRSP amounts apply only if entered in the Employee Profile. Once finalized, each period is saved as its own snapshot for accurate year-end totals.
        </Typography>

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Finance automation (QuickBooks/Xero + Zapier)</Typography>
        <Typography variant="body2" gutterBottom>
          • If workflow target is QuickBooks or Xero: Schedulaa runs the native export; Zapier is not used. Status will show as posted/exported.
          <br />• If workflow target is Zapier/Approvals/CSV/SFTP/Stripe-Wise/Other: Schedulaa emits <code>payroll.payment_requested</code>. Your Zap handles accounting/approvals/exports/payouts and can POST back to update status here.
          <br />• Status chip: processing (in progress), paid/posted (success), failed (error message shown).
          <br />• Setup: For QuickBooks/Xero, configure mapping in Settings → QuickBooks/Xero. For Zapier/Other workflows, go to the Zapier tab, create an API key, and add an Event hook for “When a payroll payment is requested”.
        </Typography>

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Payroll exports & workflows (important)</Typography>
        <Typography variant="body2" gutterBottom>
          When payroll is finalized, Schedulaa can export payroll data to accounting systems or automation workflows.
          <br />• QuickBooks / Xero (native): posts a balanced payroll journal for accounting and reconciliation.
          <br />• Zapier: emits a payroll workflow event for custom automation (approvals, journals, CSVs, BI, or downstream systems).
          <br />These workflows do not initiate bank payments or direct deposit. Payroll calculations, slips, and compliance documents remain the source of truth inside Schedulaa.
        </Typography>

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Audit & corrections</Typography>
        <Typography variant="body2" gutterBottom>
          If a period is re-finalized, the latest finalize becomes the authoritative snapshot for exports. You can view who finalized/overwrote a period (and what changed) in Payroll Finalization Audit.
        </Typography>
      </>
    )}

    {guideTab === "scenarios" && (
      <PayrollScenarios />
    )}

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
        departmentFilter={departmentFilter}
        setDepartmentFilter={(v) => {
          setDepartmentFilter(v);
          setExportEmployeeIds([]);
          setExportAllEmployees(true);
        }}
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
        setPayFreqTouched={setPayFreqTouched}
      />

    {viewMode === "preview" && payroll && (
      <PayrollPreview
        payroll={payroll}
        region={region}
        companyPayDateRule={companyPayDateRule}
        companyPayDateOffsetDays={companyPayDateOffsetDays}
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

    {viewMode === "preview" && (
      <Accordion sx={{ mt: 2 }} defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Advanced: Exports</Typography>
        </AccordionSummary>
      <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download finalized payroll exports for the selected pay period. These exports do not initiate bank payments or direct deposit.
          </Typography>

          <Stack spacing={2}>
            {missingExternalEmployees.length > 0 && (
              <Alert severity="warning">
                Missing external employee IDs for provider import:
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  {missingExternalEmployees.slice(0, 10).map((e) => (
                    <li key={e.employee_id || e.employee_email || e.employee_name}>
                      {(e.employee_name || `Employee #${e.employee_id}`) + (e.employee_email ? ` (${e.employee_email})` : "")}
                    </li>
                  ))}
                  {missingExternalEmployees.length > 10 && (
                    <li>…and {missingExternalEmployees.length - 10} more</li>
                  )}
                </Box>
              </Alert>
            )}
            {providerCsvMismatchEmployees.length > 0 && (
              <Alert severity="warning">
                Provider import export blocked: gross pay does not match the sum of earnings columns.
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  {providerCsvMismatchEmployees.slice(0, 10).map((e) => (
                    <li key={e.employee_id || e.employee_email || e.employee_name}>
                      {(e.employee_name || `Employee #${e.employee_id}`) +
                        (e.employee_email ? ` (${e.employee_email})` : "") +
                        (e.gross_pay !== undefined && e.sum_earnings !== undefined
                          ? ` — gross ${e.gross_pay}, earnings sum ${e.sum_earnings}`
                          : "")}
                    </li>
                  ))}
                  {providerCsvMismatchEmployees.length > 10 && (
                    <li>…and {providerCsvMismatchEmployees.length - 10} more</li>
                  )}
                </Box>
              </Alert>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={exportAllEmployees}
                  onChange={(e) => {
                    setExportAllEmployees(e.target.checked);
                    if (e.target.checked) setExportEmployeeIds([]);
                  }}
                />
              }
              label={departmentFilter ? "All employees in selected department" : "All employees"}
            />

            {!exportAllEmployees && (
              <FormControl fullWidth>
                <InputLabel id="export-employees-label">Employees</InputLabel>
                <Select
                  labelId="export-employees-label"
                  label="Employees"
                  multiple
                  value={exportEmployeeIds}
                  onChange={(e) => setExportEmployeeIds(e.target.value)}
                  renderValue={(selected) =>
                    (selected || [])
                      .map((id) => {
                        const r = filteredRecruiters.find((x) => String(x.id) === String(id));
                        return r ? `${r.first_name} ${r.last_name}` : id;
                      })
                      .join(", ")
                  }
                >
                  {filteredRecruiters.map((r) => (
                    <MenuItem key={r.id} value={String(r.id)}>
                      <Checkbox checked={exportEmployeeIds.includes(String(r.id))} />
                      {r.first_name} {r.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <Button variant="contained" onClick={downloadSummaryCsv} disabled={exporting}>
                {exporting ? <CircularProgress size={18} /> : "Download payroll summary CSV"}
              </Button>
              <Button variant="outlined" onClick={downloadFinalizedCsv} disabled={exporting}>
                Accountant CSV (full raw export)
              </Button>
              <Button variant="outlined" onClick={downloadPayslipsZip} disabled={exporting}>
                Download payslips ZIP (PDF)
              </Button>
              <Tooltip title="Exports paid earnings + pay period info for payroll provider import. Gross pay in this file equals the sum of earnings columns. Vacation accrual is excluded unless paid out. Taxes and net pay are calculated by your payroll provider.">
                <span>
                  <Button variant="outlined" onClick={downloadProviderImportCsv} disabled={exporting}>
                    Download provider import CSV
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>
    )}

    {viewMode === "preview" && (
      <Accordion sx={{ mt: 2 }} defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Company Payroll Reports</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Company-level payroll expense totals from finalized payroll only (gross, employer taxes, employer benefits, and withholding totals) for a date range.
          </Typography>
          {!!departmentFilter && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Department filter is active and will be applied to this report.
            </Alert>
          )}

          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="expense-preset-label">Range</InputLabel>
                <Select
                  labelId="expense-preset-label"
                  label="Range"
                  value={expensePreset}
                  onChange={(e) => setExpensePreset(e.target.value)}
                >
                  <MenuItem value="this_quarter">This quarter</MenuItem>
                  <MenuItem value="last_quarter">Last quarter</MenuItem>
                  <MenuItem value="this_year">This year</MenuItem>
                  <MenuItem value="last_year">Last year</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start date"
                InputLabelProps={{ shrink: true }}
                value={expenseStartDate}
                onChange={(e) => {
                  setExpensePreset("custom");
                  setExpenseStartDate(e.target.value);
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End date"
                InputLabelProps={{ shrink: true }}
                value={expenseEndDate}
                onChange={(e) => {
                  setExpensePreset("custom");
                  setExpenseEndDate(e.target.value);
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="expense-region-label">Region</InputLabel>
                <Select
                  labelId="expense-region-label"
                  label="Region"
                  value={expenseRegion}
                  onChange={(e) => setExpenseRegion(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="us">US</MenuItem>
                  <MenuItem value="ca">CA</MenuItem>
                  <MenuItem value="qc">QC</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={9}>
              <Stack direction="row" spacing={1} justifyContent="flex-start">
                <Button variant="contained" onClick={loadExpenseReport} disabled={expenseLoading}>
                  {expenseLoading ? <CircularProgress size={18} /> : "Generate report"}
                </Button>
                <Button
                  variant="outlined"
                  disabled={!expenseReport || expenseLoading}
                  onClick={() => {
                    try {
                      const blob = new Blob([JSON.stringify(expenseReport, null, 2)], { type: "application/json" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `company_payroll_expense_${expenseRegion}_${expenseStartDate}_${expenseEndDate}.json`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      console.error("Failed to download report JSON", e);
                    }
                  }}
                >
                  Download JSON
                </Button>
                <Button
                  variant="outlined"
                  disabled={!expenseReport || expenseLoading}
                  onClick={async () => {
                    try {
                      const params = {
                        start_date: expenseStartDate,
                        end_date: expenseEndDate,
                        format: "csv",
                      };
                      if (expenseRegion && expenseRegion !== "all") params.region = expenseRegion;
                      if (departmentFilter) params.department_id = departmentFilter;
                      const resp = await api.get(`/automation/payroll/company-expense-report`, {
                        params,
                        headers: { Authorization: `Bearer ${token}` },
                        responseType: "blob",
                      });
                      const url = window.URL.createObjectURL(resp.data);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `company_payroll_expense_${expenseRegion}_${expenseStartDate}_${expenseEndDate}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      console.error("Failed to download report CSV", e);
                    }
                  }}
                >
                  Download CSV
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {expenseReport && (
            <Stack spacing={2}>
              {expenseReport?.warnings?.includes(
                "multiple_currencies_present_totals_are_reported_per_currency_not_summed"
              ) && (
                <Alert severity="warning">
                  Multiple currencies detected. Totals are shown per currency and are not summed into a single number.
                </Alert>
              )}

              <Typography variant="caption" color="text.secondary">
                Rows: {expenseReport?.counts?.finalized_rows || 0} • Employees:{" "}
                {expenseReport?.counts?.unique_employees || 0}
              </Typography>

              {expenseReport?.by_currency &&
                Object.entries(expenseReport.by_currency).map(([currency, block]) => {
                  const breakdown = block?.breakdown_by_region || {};
                  const regionCount = Object.keys(breakdown).length;
                  return (
                    <Paper key={currency} variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        {currency} totals
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total company cost
                          </Typography>
                          <Typography variant="h6">
                            {currency} {formatMoney(block?.totals?.total_company_cost)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Gross + employer taxes + employer benefits
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Gross wages (finalized)
                          </Typography>
                          <Typography variant="h6">
                            {currency} {formatMoney(block?.totals?.gross_pay)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Employer taxes
                          </Typography>
                          <Typography variant="h6">
                            {currency} {formatMoney(block?.totals?.employer_taxes)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            FICA/Medicare/CPP/QPP/EI/RQAP (if stored)
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Employer benefits
                          </Typography>
                          <Typography variant="h6">
                            {currency} {formatMoney(block?.totals?.employer_benefits)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            RRSP/401(k) employer contributions (if stored)
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Employee withholdings
                          </Typography>
                          <Typography variant="h6">
                            {currency} {formatMoney(block?.totals?.employee_withholdings)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total deductions withheld from employees
                          </Typography>
                        </Grid>

                        {regionCount > 1 && (
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Breakdown by region
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Region</TableCell>
                                  <TableCell align="right">Gross</TableCell>
                                  <TableCell align="right">Employer taxes</TableCell>
                                  <TableCell align="right">Employer benefits</TableCell>
                                  <TableCell align="right">Withholdings</TableCell>
                                  <TableCell align="right">Rows</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.entries(breakdown).map(([reg, b]) => (
                                  <TableRow key={`${currency}-${reg}`}>
                                    <TableCell>{String(reg).toUpperCase()}</TableCell>
                                    <TableCell align="right">
                                      {currency} {formatMoney(b.gross_pay)}
                                    </TableCell>
                                    <TableCell align="right">
                                      {currency} {formatMoney(b.employer_taxes)}
                                    </TableCell>
                                    <TableCell align="right">
                                      {currency} {formatMoney(b.employer_benefits)}
                                    </TableCell>
                                    <TableCell align="right">
                                      {currency} {formatMoney(b.employee_withholdings)}
                                    </TableCell>
                                    <TableCell align="right">{b.finalized_rows || 0}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  );
                })}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>
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
