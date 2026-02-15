import React from "react";
import { Box, Typography, Divider, Tooltip, IconButton } from "@mui/material";
import { HelpOutline } from "@mui/icons-material";

const scenarios = [
  {
    title: "Standard pay period",
    detail:
      "Employee works approved shifts only (no overrides). Regular, overtime, vacation, and taxes are auto-calculated from time entries and region. Manager does nothing extra unless there is a correction.",
    fields: [],
    story:
      "Real-life example: Emily works full-time at a spa in Toronto, Monday to Friday, 9–5. All her shifts are approved with no changes. Her manager opens Payroll Preview, selects the period, and does not touch any fields. Schedulaa calculates regular hours, vacation, CPP/EI and tax automatically and Emily’s payslip is ready with zero manual input.",
  },
  {
    title: "Tips received",
    detail:
      "Employee gets $100 in tips this period. Enter 100 under Tips. Tips are taxable, increase gross pay, and flow into W-2/T4 wages. Do not also add them as Bonus (or you’ll double-count them).",
    fields: ["tip"],
    story:
      "Real-life example: Marcus is a stylist in Chicago. During the week, his clients tip him a total of $120 collected by card. At payroll time, his manager enters 120 in the Tips field. Schedulaa treats the $120 as taxable income, adds it to wages, calculates extra tax/FICA, and shows the tips clearly on the payslip and in W-2 wages.",
  },
  {
    title: "Overtime hours",
    detail:
      "Employee worked beyond the overtime threshold (e.g., 40h/week in most US states, 44h/week in most Canadian provinces). Approved shifts are split automatically into regular and overtime hours. Manager typically does nothing unless correcting hours (for example, moving a block from regular to OT).",
    fields: ["hours_worked", "regular_hours", "overtime_hours"],
    story:
      "Real-life example: Sarah is a call center agent in Ohio. She worked 48 hours this week (8 hours over the 40-hour threshold). All her shifts are in the system. When the manager loads Payroll Preview, Schedulaa automatically splits 40 hours to regular and 8 hours to overtime at 1.5x. The manager doesn’t have to edit anything unless they notice a shift was approved incorrectly.",
  },
  {
    title: "Statutory holiday worked",
    detail:
      "If a statutory holiday falls in the period and the employee worked or is entitled to holiday pay, approved holiday hours are paid at the configured holiday rate. Manager can override Holiday Pay if policy or a special agreement requires a manual amount.",
    fields: ["holiday_hours", "holiday_pay"],
    story:
      "Real-life example: Ahmed works in Vancouver and the Canada Day holiday falls in this pay period. He works 8 hours on the holiday. His manager approves a holiday shift for that day. When Payroll Preview loads, Schedulaa shows 8 holiday hours and calculates Holiday Pay at the configured rate. If company policy says Ahmed should get a slightly different amount, the manager can override Holiday Pay with the final dollar figure.",
  },
  {
    title: "Shift premium",
    detail:
      "Night/evening/weekend premium (e.g., $50 extra for weekend shifts). Enter the total premium for this period in Shift Premium. It is taxable and treated like regular wages for taxes, CPP/EI or FICA/Medicare, and W-2/T4 reporting.",
    fields: ["shift_premium"],
    story:
      "Real-life example: Chloe works at a 24/7 support center in Texas. The company pays an extra $2 per hour for night shifts. She works 10 night-shift hours this pay period, so her night premium is 10 × $2 = $20. The manager enters 20 in Shift Premium. Schedulaa adds $20 as taxable earnings, increases her gross pay, and applies normal US tax and FICA/Medicare on it.",
  },
  {
    title: "Bonus + commission",
    detail:
      "One-time bonus ($300) or commission ($200). Enter these in Bonus and Commission. They are taxable, increase gross pay, and are included in W-2/T4 wages. For a bonus-only run (e.g., annual bonus), leave hours at 0 and just enter the bonus amount.",
    fields: ["bonus", "commission"],
    story:
      "Real-life example: Daniel is an inside sales rep in Texas. His base pay is hourly, but he also earned a $300 bonus for hitting his quarterly target and $150 in commission on upsells. At payroll time, the manager enters 300 in Bonus and 150 in Commission. Schedulaa adds $450 on top of his base wages, taxes it, and shows the combined amount in his payslip and year-end W-2.",
  },
  {
    title: "Union dues",
    detail:
      "Employee pays $45 in union dues this period. Enter 45 in Union Dues. This reduces net pay. For Canadian employees, the total union dues across the year flow into T4 Box 44. If dues are the same every pay, set a default in Employee Profile → Payroll & compliance so it auto-fills.",
    fields: ["union_dues"],
    story:
      "Real-life example: Amrita works in a unionized call center in Ontario. Her union dues are $45 per pay period. On each payroll, the manager enters 45 in Union Dues. Schedulaa reduces her net pay by $45, tracks the dues in Raw Data, and at year-end the total dues for the year appear in T4 Box 44 for her and the accountant.",
  },
  {
    title: "Garnishment",
    detail:
      "Flat legal deduction (e.g., $75 child support) for this pay. Enter 75 in Garnishment. This reduces net pay, appears on Raw Data and payslips, but Schedulaa does not automate court-order logic or remittance—those payments still need to be sent externally. If the same amount recurs, store it as the employee’s default garnishment so it auto-fills each period.",
    fields: ["garnishment"],
    story:
      "Real-life example: James is a warehouse employee in Georgia with a court order to pay $80 per pay period in child support. The company handles court remittances manually. Each payroll, the HR manager enters 80 in Garnishment. Schedulaa subtracts $80 from James’s net pay and shows it clearly as “Garnishment” in the Raw Data and payslip, but the actual payment to the court is still sent outside the system.",
  },
  {
    title: "Non-taxable reimbursement",
    detail:
      "Repay a $60 headset or similar expense. Enter 60 in Non-taxable Reimbursement. It is NOT included in gross pay, CPP/EI or FICA/Medicare, or W-2/T4 wages. It is simply added to net pay so the employee is reimbursed without extra tax.",
    fields: ["non_taxable_reimbursement"],
    story:
      "Real-life example: Lina is working from home in Alberta and buys a $60 headset for work, with a receipt. The company’s policy is to reimburse equipment without extra tax. In Payroll Preview, the manager enters 60 in Non-taxable Reimbursement. Schedulaa does not increase her gross pay or taxes, but adds $60 to her net pay so she gets reimbursed without being taxed on that amount.",
  },
  {
    title: "Vacation override",
    detail:
      "Normally, vacation is calculated from rate × hours × vacation %. If you need a one-off manual payout (e.g., $150 during a termination), enter 150 in Vacation Pay. You can also toggle “Include vacation in gross” if your policy treats vacation differently in reports.",
    fields: ["vacation_pay", "include_vacation_in_gross"],
    story:
      "Real-life example: Victor is leaving a salon in BC and has $300 in unused vacation the owner wants to pay out in his final cheque. Normally, Schedulaa calculates vacation automatically, but in this special case the owner enters 300 in Vacation Pay. The payout appears on this payslip and in T4 income. For other employees, vacation continues to be auto-calculated from rate × hours × vacation % without manual overrides.",
  },
  {
    title: "Paid vs. unpaid sick leave",
    detail:
      "Approved leave from Time/Leave is split into paid vs unpaid, according to your policy. Paid leave hours are included in gross; unpaid are not. Your company decides which leave types are paid vs unpaid; Schedulaa just follows how the leave was coded. Managers usually only step in if a sick day was misclassified.",
    fields: ["hours_worked", "paid_leave_hours", "unpaid_leave_hours"],
    story:
      "Real-life example: Naomi in Washington state calls in sick for two days. One day is paid sick leave (covered by company policy), and one is unpaid. The manager records one day as paid leave and the other as unpaid in Time/Leave. When Payroll Preview loads, Schedulaa includes the paid sick hours in gross pay and leave balances and excludes the unpaid hours. The manager doesn’t need to edit the payroll fields unless a sick day was coded incorrectly.",
  },
  {
    title: "Parental leave + top-up",
    detail:
      "Employee is on approved parental leave. If the employer pays a top-up (e.g., $200 per pay), enter this in Parental Leave Top-up. It is taxable, increases employment income, and flows to W-2/T4 wages. Parental leave hours themselves are tracked separately for ROE in Canada.",
    fields: ["parental_leave_hours", "parental_top_up"],
    story:
      "Real-life example (Canada): Éric in Ontario is on parental leave receiving EI benefits, and his employer has a policy to top up his income by $200 every pay period for the first three months. The manager enters 200 in Parental Leave Top-up each pay. Schedulaa adds the $200 to his taxable income, applies the correct tax/CPP/EI, and tracks parental leave hours separately so an ROE can be generated later if needed. Real-life example (U.S.): Danielle in Washington is on bonding leave and her employer pays a $200 top-up on top of an external state benefit. The manager enters 200 in Parental Leave Top-up; Schedulaa treats it as taxable wages and applies federal/FICA/Medicare while the state benefit itself is handled outside the system.",
  },
  {
    title: "Medical/dental/life insurance",
    detail:
      "If the employee contributes $30 medical / $10 dental / $5 life this period, enter each amount in the respective fields. These reduce net pay. In many Canadian setups, employer-paid portions are counted as taxable benefits and end up in T4 Box 40. If the amounts recur, set defaults in Employee Profile so they auto-fill each pay period.",
    fields: ["medical_insurance", "dental_insurance", "life_insurance"],
    story:
      "Real-life example: Mei in Florida participates in the company’s health plan and pays $30 medical, $10 dental, and $5 life per pay period as employee contributions. The manager enters 30, 10, and 5 in the respective fields. Schedulaa reduces Mei’s net pay by $45, and in Canada, the employer-paid portion of similar benefits can be reported as taxable benefits in Box 40 on the T4.",
  },
  {
    title: "Retirement contributions",
    detail:
      "Employee RRSP/401k contribution (e.g., $50) goes in Retirement (employee). Employer match goes in the employer retirement/RRSP fields. The employee portion reduces net pay. In Canada, the employer portion may be treated as a taxable benefit for T4 Box 40 depending on your plan design. If the employee amount recurs, set a default in Employee Profile so it auto-fills each pay run.",
    fields: ["retirement_amount", "retirement_employer", "rrsp", "rrsp_employer"],
    story:
      "Real-life example: Oscar in British Columbia contributes $50 to his group RRSP each pay period, and his employer matches $25. The manager enters 50 in Retirement (employee) and 25 in the employer RRSP field. Schedulaa reduces Oscar’s net pay by $50 and records the employer contribution for reporting. At year-end, the accountant can use this data for RRSP receipts and any taxable benefit treatment in T4 Box 40.",
  },
  {
    title: "CPP/EI exemptions (Canada)",
    detail:
      "Only check CPP/EI exempt for rare, advisor-confirmed cases (e.g., already collecting CPP, certain owner/family scenarios). If unsure, leave unchecked. Exempt employees have CPP/EI set to zero and their T4 boxes (16/18/24/26) reflect that. These flags are usually set by an admin or accountant, not by front-line managers.",
    fields: ["cpp_exempt", "ei_exempt"],
    story:
      "Real-life example: Maria owns a small incorporated spa in Ontario and pays herself as an employee-owner. Her accountant has advised that for her particular situation, she should not contribute to EI and may already be collecting CPP. In her Employee profile, the admin checks EI exempt (and CPP exempt if applicable). From that point on, Schedulaa stops calculating CPP/EI for Maria, and her T4 boxes for CPP/EI show zeros. For all other staff, the flags remain unchecked and normal CPP/EI applies.",
  },
  {
    title: "Travel allowance (taxable)",
    detail:
      "If you want an allowance taxed and included in wages (per diem, small stipends), use Travel Allowance. If you want to simply pay back an expense without tax (e.g., a receipt-backed purchase), use Non-taxable Reimbursement instead.",
    fields: ["travel_allowance", "non_taxable_reimbursement"],
    story:
      "Real-life example: Quinn works as a field tech in Nevada. The company gives a flat $100 monthly travel allowance that should be taxed, and also reimburses exact fuel receipts as non-taxable. In Payroll Preview, the manager enters 100 in Travel Allowance and the exact fuel receipt total (e.g., 65) in Non-taxable Reimbursement. Schedulaa taxes the $100 and treats it as wages, but adds the $65 only to net pay without affecting gross or taxes.",
  },
  {
    title: "Remote US vs Canada",
    detail:
      "The tax engine follows the employee’s work location on the payroll: US state for US employees, province for Canadian employees. For U.S. employees, full finalize is currently supported only in AK, FL, NV, SD, TX, WA, WY, TN, and NH; other states run in raw preview mode. Make sure the Employee profile has the correct country and work location, especially for remote workers.",
    fields: ["region", "state", "province"],
    story:
      "Real-life example: John lives and works remotely from Texas for a software company incorporated in California. His Employee profile is set to Country: US, Work location: Texas. Schedulaa uses Texas rules (no state income tax, just Federal + FICA/Medicare) for John’s payroll, even though the company HQ is in California. Later, the company hires Anna in Vancouver; her profile is set to Country: Canada, Province: BC, so Schedulaa applies Canadian CRA rules (federal + BC tax, CPP/EI) for her, even though they work on the same team.",
  },
  {
    title: "ROE trigger (Canada)",
    detail:
      "When an employee separates or has an interruption of insurable earnings, use ROE. Insurable earnings and insurable hours are pulled from FinalizedPayroll. Ensure SIN, address, and insurable earnings are present and correct during regular payroll so the ROE is accurate.",
    fields: ["ei_amount", "insurable_earnings"],
    story:
      "Real-life example: Kelsey works at a call center in Ontario and is laid off due to a contract ending. HR has run payroll normally for months: each pay has insurable earnings and hours stored in FinalizedPayroll. When Kelsey leaves, the HR manager goes to the ROE screen; Schedulaa pulls her last insurable earnings and hours, fills in the ROE form, and the manager only adjusts the reason for separation before exporting the ROE as XML for Service Canada.",
  },
  {
    title: "T4 year-end check (Canada)",
    detail:
      "For Canadian employees, T4 boxes include: 14 (income), 16/26 (CPP/pensionable), 18/24 (EI/insurable), 22 (tax), 40 (taxable benefits), 44 (union dues). Make sure benefits, shift premiums, and union dues are recorded during payroll so T4 totals match accountant expectations.",
    fields: ["box14", "box16", "box18", "box22", "box24", "box26", "box40", "box44"],
    story:
      "Real-life example: During the year, a salon in Alberta uses Schedulaa to pay wages, vacation, shift premiums, health benefits, and union dues for staff. At year-end, the owner opens the T4 page and generates slips for 2026. A quick scan shows Box 14 = total employment income, Box 16/26 = CPP/pensionable earnings, Box 18/24 = EI/insurable earnings, Box 22 = tax deducted, Box 40 = taxable benefits, and Box 44 = union dues. Because the manager recorded these items correctly during each pay run, the accountant can sign off on the T4s with minimal adjustments.",
  },
  {
    title: "W-2 year-end check",
    detail:
      "For US employees, wages flow into Box 1/3/5; taxes into Box 2/4/6; Box 13 flags are set in the W-2 flow. Ensure taxable earnings (overtime, bonus, shift premium, tips) are recorded during payroll so annual W-2 totals match what was actually paid.",
    fields: ["box1", "box3", "box5", "box2", "box4", "box6"],
    story:
      "Real-life example: A call center in Florida has 80 agents. All year, managers record regular wages, overtime, bonuses, shift premiums, and tips in Schedulaa. At year-end, they generate W-2 forms. For each agent, Box 1/3/5 show the correct taxable wages (including shift premium and bonus), Boxes 2/4/6 show taxes withheld, and supported-state details are included in the export snapshot. Because earnings and deductions were entered correctly each pay, W-2 totals match what employees saw on their payslips.",
  },
  {
    title: "Call center mixed shift example",
    detail:
      "A call center agent works regular weekday shifts, does 4 hours of weekend work, and receives $200 in bonus and $80 in tips. Hours and overtime come from Time/Leave; enter the $200 in Bonus, $80 in Tips, and any extra night/weekend pay in Shift Premium. Union dues and garnishments, if any, are handled in the Deductions section.",
    fields: ["hours_worked", "shift_premium", "bonus", "tip", "union_dues", "garnishment"],
    story:
      "Real-life example: Priya works at a 24/7 call center in Texas. In one bi-weekly period she works 64 total hours: 48 regular weekday hours, 8 weekend hours with a $1.50/hour premium, earns $200 in bonus, and $80 in tips. Time tracking already holds the 64 hours, and the overtime split is handled automatically by Schedulaa. At payroll time, the manager enters 12 (8 × 1.5) in Shift Premium, 200 in Bonus, and 80 in Tips. If Priya also belongs to a union, the manager enters her $35 union dues. All of this flows through gross, deductions, net pay, and later into her W-2 or T4 as appropriate.",
  },
  {
    title: "US 401(k) — Enterprise default with cap enforcement",
    detail:
      "Company sets a 401(k) default (e.g., 5% percent method, $23k annual limit, caps on). Employees follow it unless overridden. Schedulaa auto-withholds the default, tracks YTD, stops at the IRS cap, shows a cap warning, and resumes next year. W-2 Box 12 code D and wage bases are updated automatically.",
    fields: ["retirement_plan", "us_401k_employee_applied", "taxable_wages_federal", "w2_box12D"],
    story:
      "Example: Gross $2,000 → 5% deferral = $100. If remaining annual cap is $200 and the calculated deferral would be $300, Schedulaa applies $200 and stops 401(k) for the rest of the year. W-2: Box 1 reduced; Box 3/5 unchanged; Box 12 (D) shows total deferral. Manager action: configure the plan once; leave employee 401(k) blank to use the default.",
  },
  {
    title: "US 401(k) — Employee election overrides default",
    detail:
      "Company default is 5%, caps on. A single employee wants a different rate. Enter their election (e.g., 6% with a start date) in Employee 401(k) Settings. Everyone else keeps the 5% default; caps still apply automatically.",
    fields: ["employee_retirement_election", "us_401k_employee_applied"],
    story:
      "Example: Gross $2,000 → 6% deferral = $120. If remaining annual cap is $200 and desired deferral is $300, Schedulaa applies $200 and stops for the year. The election affects only this employee; leaving it blank uses the company default. W-2 Box 12 (D) shows the employee’s actual deferral.",
  },
];

export default function PayrollScenarios() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Real-world payroll scenarios
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Short examples of what to enter, and how the system treats it.
      </Typography>
      <Divider sx={{ my: 2 }} />
      {scenarios.map((s, idx) => (
        <Box key={s.title} sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {idx + 1}. {s.title}
            </Typography>
            {s.story && (
              <Tooltip title={s.story} placement="right" arrow>
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <HelpOutline fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {s.detail}
          </Typography>
          {s.fields.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              Fields: {s.fields.join(", ")}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
