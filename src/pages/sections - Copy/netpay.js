// netpay.js
import axios from 'axios';
import { vacationIncludedByDefault } from "./utils/payrollRules";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const pctToAmt = (gross, pct) => Number(((gross * (pct || 0)) / 100).toFixed(2));
const num = (v) => Number(v || 0);
const round = (v) => Number((v || 0).toFixed(2));

// ─────────────────────────────────────────────────────────────
// Tax Models (Canada) – 2025
// ─────────────────────────────────────────────────────────────
const BPA_ANNUAL = 15000;

export function getBPA(frequency = 'weekly') {
  switch (frequency) {
    case 'weekly':   return round(BPA_ANNUAL / 52);
    case 'biweekly': return round(BPA_ANNUAL / 26);
    case 'monthly':  return round(BPA_ANNUAL / 12);
    default:         return round(BPA_ANNUAL / 52);
  }
}

// ─────────────────────────────────────────────────────────────
// 🔹 Gross Overtime Calculator
// ─────────────────────────────────────────────────────────────
export function calculate_gross_with_overtime(hoursWorked, hourlyRate, region = "ca", province = "ON") {
  let overtimeThreshold = 40;
  if (region === "ca" && province !== "QC") {
    overtimeThreshold = 44;
  }
  if (region === "ca" && (province === "QC" || province === "MB")) {
    overtimeThreshold = 40;
  }

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
    grossPay
  };
}

// ─────────────────────────────────────────────────────────────
// 🔹 Net Pay Recalculator
// ─────────────────────────────────────────────────────────────
export function recalcNetPay(data, region = "ca") {
  const {
    rate,
    hours_worked,
    province = "ON",
    vacation_percent = 4,
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
    deduction = 0,
    federal_tax_amount = 0,
    provincial_tax_amount = 0,
    provincial_tax_percent = 0,
    state_tax_amount = 0,
    cpp_amount = 0,
    qpp_amount = 0,
    ei_amount = 0,
    fica_amount = 0,
    medicare_amount = 0,
    rqap_amount = 0,
    retirement_percent = 0,
    rrsp_percent = 0
  } = data || {};

  // ✅ Destructure full overtime breakdown
  const {
    grossPay: grossBeforeVacation,
    regularPay,
    overtimePay,
    regularHours,
    overtimeHours
  } = calculate_gross_with_overtime(hours_worked || 0, rate || 0, region, province);

  const vacationPay = +(grossBeforeVacation * (vacation_percent / 100)).toFixed(2);
  const includeVac = data.include_vacation_in_gross ?? vacationIncludedByDefault(region, province);

  const gross = grossBeforeVacation + (includeVac ? vacationPay : 0)
    + bonus + tip + commission + parental_insurance + travel_allowance + family_bonus + tax_credit;

  // ✅ Compute retirement or RRSP based on % of grossBeforeVacation
  const retirementAmt =
    region === "us"
      ? pctToAmt(grossBeforeVacation, retirement_percent)
      : pctToAmt(grossBeforeVacation, rrsp_percent);

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
    retirementAmt,
    medical_insurance,
    dental_insurance,
    life_insurance,
    deduction
  ];

  const totalDeductions = deductionItems.reduce((s, v) => s + num(v), 0);
  const netPay = +(gross - totalDeductions).toFixed(2);

  return {
    gross_pay:        round(gross),
    total_deductions: round(totalDeductions),
    net_pay:          round(netPay),

    // ✅ New overtime breakdown
    regular_hours:    round(regularHours),
    overtime_hours:   round(overtimeHours),
    regular_pay:      round(regularPay),
    overtime_pay:     round(overtimePay),

    vacation_pay:     round(vacationPay),
    vacation_percent: vacation_percent,

    cpp_amount:       round(cpp_amount),
    ei_amount:        round(ei_amount),
    qpp_amount:       round(qpp_amount),
    rqap_amount:      round(rqap_amount),
    fica_amount:      round(fica_amount),
    medicare_amount:  round(medicare_amount),

    federal_tax_amount:    round(federal_tax_amount),
    provincial_tax_amount: round(provincial_tax_amount),
    provincial_tax:        round(provincial_tax_percent),
    state_tax_amount:      round(state_tax_amount),

    retirement_amount: round(retirementAmt),
    retirement_percent: round(retirement_percent),
    rrsp_percent:       round(rrsp_percent),

    medical_insurance: round(medical_insurance),
    dental_insurance:  round(dental_insurance),
    life_insurance:    round(life_insurance),
    deduction:         round(deduction),

    tax_amount: round(federal_tax_amount + provincial_tax_amount + state_tax_amount)
  };
}

// ─────────────────────────────────────────────────────────────
// 🔹 Utility: Update a % field and calculated $ deduction
// ─────────────────────────────────────────────────────────────
export const updateDeductionFromPct = (field, value, payroll, setPayroll) => {
  const gross = num(payroll.hours_worked) * num(payroll.rate) +
                num(payroll.bonus) + num(payroll.commission) + num(payroll.tip) +
                num(payroll.parental_insurance) + num(payroll.travel_allowance) +
                num(payroll.family_bonus) + num(payroll.tax_credit);

  const payFrequency = payroll.pay_frequency || 'weekly';
  const bpa = getBPA(payFrequency);
  const taxable = Math.max(0, gross - bpa);

  const base = ['federal_tax', 'provincial_tax', 'state_tax'].includes(field)
             ? taxable
             : gross;

  const amountField = `${field}_amount`;
  const pctVal = num(value);
  const amountVal = pctToAmt(base, pctVal);

  setPayroll({
    ...payroll,
    [field]: pctVal,
    [amountField]: amountVal
  });
};

// ─────────────────────────────────────────────────────────────
// 🔹 Persistence helpers
// ─────────────────────────────────────────────────────────────
export async function savePayroll(data, token) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const res = await axios.post(
    `${API_URL}/automation/payroll/save`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function exportPayroll(params, token, format = 'pdf') {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const res = await axios.get(
    `${API_URL}/automation/payroll/export`,
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
      params: {
        recruiter_id: params.recruiter_id,
        month:        params.month,
        region:       params.region,
        format,
        columns:      params.columns
      }
    }
  );
  return res.data;
}
