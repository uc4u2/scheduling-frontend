import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
/**
 * Convert a percentage value (e.g. 4 for 4 %) to a dollar amount
 * based on the supplied gross‐pay figure, always rounded to 2 decimals.
 */
const pctToAmt = (gross, pct) => Number(((gross * (pct || 0)) / 100).toFixed(2));

/**
 * Convenience: coerce anything falsy or NaN to the number 0.
 */
const num = (v) => Number(v || 0);

// ─────────────────────────────────────────────────────────────
// 🔹 Main Net‑Pay calculation helper
// -----------------------------------------------------------------
//  • Now includes the four extra earning fields the UI exposes
//    (parental_insurance, travel_allowance, family_bonus, tax_credit).
//  • Computes vacation pay automatically from `vacation_percent` if the
//    caller hasn’t supplied an explicit `vacation_pay` amount.
//  • Keeps every amount rounded to two decimals so React renders nice,
//    predictable values.
// -----------------------------------------------------------------
export function recalcNetPay(data, region = 'ca') {
  // ---------------- 1️⃣  Build gross pay ----------------
  // Start with the core hourly earnings
  const baseEarnings =
    num(data.hours_worked)   * num(data.rate) +
    num(data.bonus)          +
    num(data.commission)     +
    num(data.tip)            +

    // NEW: extra allowances (all treated as taxable earnings)
    num(data.parental_insurance) +
    num(data.travel_allowance)   +
    num(data.family_bonus)       +
    num(data.tax_credit);

  // Vacation pay – either take the explicit dollar value, or derive it
  // from vacation_percent.  We purposely *exclude* vacation pay from the
  // base on which it is calculated to avoid a circular reference.
  // Vacation pay – compute from vacation_percent when that % is > 0;
  // otherwise fall back to an explicitly‑entered dollar amount.
  const vacPct = num(data.vacation_percent);
  const vacationPay = vacPct > 0
    ? pctToAmt(baseEarnings, vacPct)
    : num(data.vacation_pay);

  // Full gross = base earnings + computed vacation pay
  const gross = baseEarnings + vacationPay;

  // ---------------- 2️⃣  Statutory %‑based deductions ----------------
  const cppAmt       = data.cpp_amount       ?? pctToAmt(gross, data.cpp);
  const eiAmt        = data.ei_amount        ?? pctToAmt(gross, data.ei);
  const qppAmt       = data.qpp_amount       ?? pctToAmt(gross, data.qpp);
  const rqapAmt      = data.rqap_amount      ?? pctToAmt(gross, data.rqap);

  const ficaAmt      = data.fica_amount      ?? pctToAmt(gross, data.fica);
  const medicareAmt  = data.medicare_amount  ?? pctToAmt(gross, data.medicare);

  const federalTaxAmt    = data.federal_tax_amount    ?? pctToAmt(gross, data.federal_tax);
  const provincialTaxAmt = data.provincial_tax_amount ?? pctToAmt(gross, data.provincial_tax);
  const stateTaxAmt      = data.state_tax_amount      ?? pctToAmt(gross, data.state_tax);

  // ---------------- 3️⃣  Fixed‑amount deductions ----------------
  const retirementAmt  = num(data.retirement_amount);
  const medicalIns     = num(data.medical_insurance);
  const dentalIns      = num(data.dental_insurance);
  const lifeIns        = num(data.life_insurance);
  const taxAmt         = num(data.tax_amount);        // manual extra tax field
  const otherDeduction = num(data.deduction);

  // ---------------- 4️⃣  Sum everything ----------------
  const deductionItems = [
    cppAmt, eiAmt, qppAmt, rqapAmt,
    ficaAmt, medicareAmt,
    federalTaxAmt, provincialTaxAmt, stateTaxAmt,
    retirementAmt, medicalIns, dentalIns, lifeIns,
    taxAmt, otherDeduction,
  ];

  const totalDeductions = deductionItems.reduce((s, v) => s + num(v), 0);
  const netPay          = gross - totalDeductions;

  // ---------------- 5️⃣  Return a complete patch ----------------
  return {
    // topline figures
    gross_pay:        Number(gross.toFixed(2)),
    total_deductions: Number(totalDeductions.toFixed(2)),
    net_pay:          Number(netPay.toFixed(2)),

    // break‑outs so the UI can show them
    vacation_pay:          Number(vacationPay.toFixed(2)),
    vacation_percent:      num(data.vacation_percent),

    cpp_amount:            cppAmt,
    ei_amount:             eiAmt,
    qpp_amount:            qppAmt,
    rqap_amount:           rqapAmt,
    fica_amount:           ficaAmt,
    medicare_amount:       medicareAmt,
    federal_tax_amount:    federalTaxAmt,
    provincial_tax_amount: provincialTaxAmt,
    state_tax_amount:      stateTaxAmt,

    tax_amount:            taxAmt,
    retirement_amount:     retirementAmt,
    medical_insurance:     medicalIns,
    dental_insurance:      dentalIns,
    life_insurance:        lifeIns,
    deduction:             otherDeduction,

    // leave the raw percentage fields untouched so the sliders/inputs keep state
    cpp:            num(data.cpp),
    ei:             num(data.ei),
    qpp:            num(data.qpp),
    rqap:           num(data.rqap),
    fica:           num(data.fica),
    medicare:       num(data.medicare),
    federal_tax:    num(data.federal_tax),
    provincial_tax: num(data.provincial_tax),
    state_tax:      num(data.state_tax),
  };
}

// ─────────────────────────────────────────────────────────────
// 🔹 Utility: update a % field + its paired _amount key in state
export const updateDeductionFromPct = (field, value, payroll, setPayroll) => {
  const gross = num(payroll.hours_worked) * num(payroll.rate) +
    num(payroll.bonus)           + num(payroll.commission)   + num(payroll.tip) +
    num(payroll.parental_insurance) + num(payroll.travel_allowance) +
    num(payroll.family_bonus)       + num(payroll.tax_credit);

  const amountField = `${field}_amount`;
  const pctVal      = num(value);
  const amountVal   = pctToAmt(gross, pctVal);

  setPayroll({
    ...payroll,
    [field]:       pctVal,
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
