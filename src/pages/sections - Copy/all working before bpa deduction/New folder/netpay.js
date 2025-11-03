import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const pctToAmt = (gross, pct) => Number(((gross * (pct || 0)) / 100).toFixed(2));
const num = (v) => Number(v || 0);
const round = (v) => Number((v || 0).toFixed(2));

// ─────────────────────────────────────────────────────────────
// Tax Models (Canada) - 2025
// ─────────────────────────────────────────────────────────────
const BPA_ANNUAL = 15000;

export function getBPA(frequency = "weekly") {
  switch (frequency) {
    case "weekly": return round(BPA_ANNUAL / 52);
    case "biweekly": return round(BPA_ANNUAL / 26);
    case "monthly": return round(BPA_ANNUAL / 12);
    default: return round(BPA_ANNUAL / 52);
  }
}



function calcCanadaFederalTax(income) {
  const brackets = [
    { upTo: 53359, rate: 0.15 },
    { upTo: 106717, rate: 0.205 },
    { upTo: 165430, rate: 0.26 },
    { upTo: 235675, rate: 0.29 },
    { upTo: Infinity, rate: 0.33 },
  ];
  return calcBracketedTax(income, brackets);
}

function calcProvincialTax(income, province) {
  const rates = {
    ab: [ // Alberta
      { upTo: 142292, rate: 0.10 },
      { upTo: 170751, rate: 0.12 },
      { upTo: 227668, rate: 0.13 },
      { upTo: 341502, rate: 0.14 },
      { upTo: Infinity, rate: 0.15 },
    ],
    bc: [ // British Columbia
      { upTo: 45654, rate: 0.0506 },
      { upTo: 91310, rate: 0.077 },
      { upTo: 104835, rate: 0.105 },
      { upTo: 127299, rate: 0.1229 },
      { upTo: 172602, rate: 0.147 },
      { upTo: 240716, rate: 0.168 },
      { upTo: Infinity, rate: 0.205 },
    ],
    mb: [ // Manitoba
      { upTo: 36000, rate: 0.105 },
      { upTo: 72000, rate: 0.1275 },
      { upTo: Infinity, rate: 0.174 },
    ],
    nb: [ // New Brunswick
      { upTo: 47915, rate: 0.094 },
      { upTo: 95831, rate: 0.14 },
      { upTo: 176756, rate: 0.16 },
      { upTo: Infinity, rate: 0.195 },
    ],
    nl: [ // Newfoundland & Labrador
      { upTo: 41457, rate: 0.087 },
      { upTo: 82913, rate: 0.145 },
      { upTo: 148027, rate: 0.158 },
      { upTo: 207239, rate: 0.178 },
      { upTo: Infinity, rate: 0.198 },
    ],
    ns: [ // Nova Scotia
      { upTo: 29590, rate: 0.0879 },
      { upTo: 59180, rate: 0.1495 },
      { upTo: 93000, rate: 0.1667 },
      { upTo: 150000, rate: 0.175 },
      { upTo: Infinity, rate: 0.21 },
    ],
    nt: [ // Northwest Territories
      { upTo: 49231, rate: 0.059 },
      { upTo: 98463, rate: 0.086 },
      { upTo: 153693, rate: 0.122 },
      { upTo: Infinity, rate: 0.1405 },
    ],
    nu: [ // Nunavut
      { upTo: 50000, rate: 0.04 },
      { upTo: 100000, rate: 0.07 },
      { upTo: 150000, rate: 0.09 },
      { upTo: Infinity, rate: 0.115 },
    ],
    on: [ // Ontario
      { upTo: 49231, rate: 0.0505 },
      { upTo: 98463, rate: 0.0915 },
      { upTo: 153693, rate: 0.1116 },
      { upTo: 220000, rate: 0.1216 },
      { upTo: Infinity, rate: 0.1316 },
    ],
    pe: [ // Prince Edward Island
      { upTo: 31984, rate: 0.098 },
      { upTo: 63969, rate: 0.138 },
      { upTo: Infinity, rate: 0.167 },
    ],
    qc: [ // Québec
      { upTo: 50000, rate: 0.15 },
      { upTo: 100000, rate: 0.20 },
      { upTo: 160000, rate: 0.24 },
      { upTo: Infinity, rate: 0.2575 },
    ],
    sk: [ // Saskatchewan
      { upTo: 49620, rate: 0.105 },
      { upTo: 99239, rate: 0.125 },
      { upTo: Infinity, rate: 0.145 },
    ],
    yt: [ // Yukon
      { upTo: 53359, rate: 0.064 },
      { upTo: 106717, rate: 0.09 },
      { upTo: 165430, rate: 0.109 },
      { upTo: 235675, rate: 0.128 },
      { upTo: Infinity, rate: 0.15 },
    ],
  };

  const key = (province || '').toLowerCase();
  const brackets = rates[key] || rates['on']; // fallback to Ontario
  return calcBracketedTax(income, brackets);
}

function calcBracketedTax(income, brackets) {
  let tax = 0;
  let prev = 0;
  for (const { upTo, rate } of brackets) {
    const amount = Math.min(income, upTo) - prev;
    if (amount <= 0) break;
    tax += amount * rate;
    prev = upTo;
  }
  return round(tax);
}

// ─────────────────────────────────────────────────────────────
// 🔹 Main Net‑Pay calculation helper
// ─────────────────────────────────────────────────────────────
export function recalcNetPay(data, region = 'ca') {
  const baseEarnings =
    num(data.hours_worked)   * num(data.rate) +
    num(data.bonus)          +
    num(data.commission)     +
    num(data.tip)            +
    num(data.parental_insurance) +
    num(data.travel_allowance)   +
    num(data.family_bonus)       +
    num(data.tax_credit);

  const vacPct = num(data.vacation_percent);
  const vacationPay = vacPct > 0
    ? pctToAmt(baseEarnings, vacPct)
    : num(data.vacation_pay);

  const gross = baseEarnings + vacationPay;

  const payFrequency = data.pay_frequency || 'weekly';
const bpa = getBPA(payFrequency);
const taxable = Math.max(0, gross - bpa);


  const cppAmt       = data.cpp_amount       ?? pctToAmt(gross, data.cpp);
  const eiAmt        = data.ei_amount        ?? pctToAmt(gross, data.ei);
  const qppAmt       = data.qpp_amount       ?? pctToAmt(gross, data.qpp);
  const rqapAmt      = data.rqap_amount      ?? pctToAmt(gross, data.rqap);
  const ficaAmt      = data.fica_amount      ?? pctToAmt(gross, data.fica);
  const medicareAmt  = data.medicare_amount  ?? pctToAmt(gross, data.medicare);

  // First, calculate taxable income (already done above)
  const federalTaxAmt = (data.federal_tax_amount ?? null) > 0
  ? num(data.federal_tax_amount)
  : data.federal_tax
    ? pctToAmt(taxable, data.federal_tax)
    : calcCanadaFederalTax(taxable);

  const provincialTaxAmt = (data.provincial_tax_amount ?? null) > 0
   ? num(data.provincial_tax_amount)
  : data.provincial_tax
    ? pctToAmt(taxable, data.provincial_tax)
    : calcProvincialTax(taxable, data.province);


    const stateTaxAmt = (data.state_tax_amount ?? null) > 0
     ? num(data.state_tax_amount)
: data.state_tax
  ? pctToAmt(taxable, data.state_tax)
  : 0;


  const retirementAmt  = num(data.retirement_amount);
  const medicalIns     = num(data.medical_insurance);
  const dentalIns      = num(data.dental_insurance);
  const lifeIns        = num(data.life_insurance);
  const taxAmt         = num(data.tax_amount);
  const otherDeduction = num(data.deduction);

  const deductionItems = [
    federalTaxAmt,
    provincialTaxAmt,
    stateTaxAmt,
    cppAmt,
    eiAmt,
    qppAmt,
    rqapAmt,
    ficaAmt,
    medicareAmt,
    retirementAmt,
    medicalIns,
    dentalIns,
    lifeIns,
    otherDeduction,
  ];
  
  

  const totalDeductions = deductionItems.reduce((s, v) => s + num(v), 0);
  const netPay = gross - totalDeductions;

  return {
    gross_pay:        round(gross),
    total_deductions: round(totalDeductions),
    net_pay:          round(netPay),
  
    vacation_pay:     round(vacationPay),
    vacation_percent: vacPct,
  
    // Individual deduction breakdowns
    cpp_amount:       round(cppAmt),
    ei_amount:        round(eiAmt),
    qpp_amount:       round(qppAmt),
    rqap_amount:      round(rqapAmt),
    fica_amount:      round(ficaAmt),
    medicare_amount:  round(medicareAmt),
    federal_tax_amount: round(federalTaxAmt),
    provincial_tax_amount: round(provincialTaxAmt),
    state_tax_amount: round(stateTaxAmt),
    retirement_amount: round(retirementAmt),
    medical_insurance: round(medicalIns),
    dental_insurance:  round(dentalIns),
    life_insurance:    round(lifeIns),
    deduction:         round(otherDeduction),
  
    // Summary only — not used in total_deductions
    tax_amount:        round(federalTaxAmt + provincialTaxAmt + stateTaxAmt),
  
    // Raw percentage fields
    cpp:       num(data.cpp),
    ei:        num(data.ei),
    qpp:       num(data.qpp),
    rqap:      num(data.rqap),
    fica:      num(data.fica),
    medicare:  num(data.medicare),
    federal_tax:    num(data.federal_tax),
    provincial_tax: num(data.provincial_tax),
    state_tax:      num(data.state_tax),
  };
}

// Optional export/save functions can remain the same...


// ─────────────────────────────────────────────────────────────
// 🔹 Utility: update a % field + its paired _amount key in state
export const updateDeductionFromPct = (field, value, payroll, setPayroll) => {
  const gross = num(payroll.hours_worked) * num(payroll.rate) +
    num(payroll.bonus)           + num(payroll.commission)   + num(payroll.tip) +
    num(payroll.parental_insurance) + num(payroll.travel_allowance) +
    num(payroll.family_bonus)       + num(payroll.tax_credit);

  const payFrequency = payroll.pay_frequency || "weekly";
  const bpa = getBPA(payFrequency);
  const taxable = Math.max(0, gross - bpa);

  const base = ["federal_tax", "provincial_tax", "state_tax"].includes(field)
    ? taxable
    : gross;

  const amountField = `${field}_amount`;
  const pctVal = num(value);
  const amountVal = pctToAmt(base, pctVal);

  setPayroll({
    ...payroll,
    [field]: pctVal,
    [amountField]: amountVal,
  });
};


// ─────────────────────────────────────────────────────────────
// 🔹 Persistence helpers (unchanged)
export async function savePayroll(data, token) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const res = await axios.post(
    `${API_URL}/automation/payroll/save`,
    data,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
}

export async function exportPayroll(params, token, format = 'pdf') {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const res = await axios.get(
    `${API_URL}/automation/payroll/export`,
    {
      headers:      { Authorization: `Bearer ${token}` },
      responseType: 'blob',
      params: {
        recruiter_id: params.recruiter_id,
        month:        params.month,
        region:       params.region,
        format,
        columns:      params.columns,
      },
    },
  );
  return res.data;
}
