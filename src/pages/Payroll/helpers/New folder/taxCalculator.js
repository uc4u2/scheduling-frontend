// src/pages/Payroll/helpers/taxCalculator.js

export const calculatePayroll = (payroll, region = "ca", province = "on") => {
    const n = (v) => parseFloat(v || 0);
  
    const hours      = n(payroll.hours_worked);
    const rate       = n(payroll.rate);
    const bonus      = n(payroll.bonus);
    const commission = n(payroll.commission);
    const tip        = n(payroll.tip);
    let gross        = hours * rate + bonus + commission + tip;
  
    // Vacation Pay
    let vacation = n(payroll.vacation_pay);
    if (vacation > 0 && vacation < 1) vacation = vacation * gross;
    else if (vacation > 1 && vacation <= 100) vacation = (vacation / 100) * gross;
  
    gross += vacation;
  
    // Default deductions
    let cpp = 0, qpp = 0, ei = 0, rqap = 0;
    let fica = 0, medicare = 0;
    let rrsp = n(payroll.rrsp);
    let tax_amount = 0;
  
    // Insurance & benefits (employee)
    const medical = n(payroll.medical_insurance);
    const dental  = n(payroll.dental_insurance);
    const life    = n(payroll.life_insurance);
    const retirement = n(payroll.retirement_amount);
  
    // 🇨🇦 Canada / Quebec
    if (region === "ca") {
      cpp = province === "qc" ? 0 : 0.0595 * gross;
      qpp = province === "qc" ? 0.0635 * gross : 0;
      ei  = 0.0166 * gross;
      rqap = province === "qc" ? 0.00752 * gross : 0;
  
      // Basic flat income tax rates (approx)
      const federalTax = 0.15;
      const provincialTaxRates = {
        on: 0.0505,
        qc: 0.15,
        bc: 0.0506,
        ab: 0.10,
      };
      const provTax = provincialTaxRates[province] || 0.05;
      tax_amount = (federalTax + provTax) * gross;
    }
  
    // 🇺🇸 USA
    if (region === "us") {
      fica = 0.062 * gross;
      medicare = 0.0145 * gross;
  
      // Federal + example state tax
      const federalTax = 0.10;
      const stateTaxRates = {
        ca: 0.06,
        tx: 0,
        ny: 0.04,
      };
      const stateTax = stateTaxRates[province] || 0.04;
      tax_amount = (federalTax + stateTax) * gross;
    }
  
    // 🌍 Global fallback: no tax
    if (region === "global") {
      tax_amount = 0;
    }
  
    // Total deductions (employee)
    const total_deductions = (
      cpp + qpp + ei + rqap + fica + medicare +
      rrsp + retirement + tax_amount + medical + dental + life
    );
  
    const net = gross - total_deductions;
  
    // 💼 Employer-side costs (for reporting)
    const employer_contrib = {
      cpp: cpp,
      qpp: qpp,
      ei: ei,
      rqap: rqap,
      fica: fica,
      medicare: medicare,
      insurance: medical + dental + life,
      total: cpp + qpp + ei + rqap + fica + medicare + medical + dental + life,
    };
  
    return {
      gross_pay: +gross.toFixed(2),
      vacation_pay: +vacation.toFixed(2),
      cpp: +cpp.toFixed(2),
      qpp: +qpp.toFixed(2),
      ei: +ei.toFixed(2),
      rqap: +rqap.toFixed(2),
      fica: +fica.toFixed(2),
      medicare: +medicare.toFixed(2),
      rrsp: +rrsp.toFixed(2),
      retirement_amount: +retirement.toFixed(2),
      tax_amount: +tax_amount.toFixed(2),
      medical_insurance: +medical.toFixed(2),
      dental_insurance: +dental.toFixed(2),
      life_insurance: +life.toFixed(2),
      total_deductions: +total_deductions.toFixed(2),
      net_pay: +net.toFixed(2),
      employer_contrib,
    };
  };
  