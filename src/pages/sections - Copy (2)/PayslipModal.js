/* PayslipModal.js – 2025-05-18
   ↳ Lightweight preview of a single payroll row.
     ▸ Hides any values that are 0 / null / undefined
     ▸ Gives a quick breakdown of earnings, deductions & brackets          */

     import React from "react";
     import {
       Dialog,
       DialogTitle,
       DialogContent,
       Typography,
       Box,
       Table,
       TableHead,
       TableBody,
       TableRow,
       TableCell,
       Divider,
     } from "@mui/material";
     
     /* ──────────────────────────────────────────────────────────
        Helper utilities
     ────────────────────────────────────────────────────────── */
     const isNonZero = (v) => {
       const n = Number(v);
       return !isNaN(n) && Math.abs(n) > 0.0001;
     };
     
     const money = (v) => `$${Number(v).toFixed(2)}`;
     const percent = (v) => `${Number(v).toFixed(3)}%`;
     
     /* Pretty-print an array of tax brackets */
     const BracketTable = ({ title, brackets = [] }) =>
       brackets.length ? (
         <Box sx={{ mt: 3 }}>
           <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
             {title}
           </Typography>
           <Table size="small">
             <TableHead>
               <TableRow>
                 <TableCell>From</TableCell>
                 <TableCell>To</TableCell>
                 <TableCell>Rate (%)</TableCell>
               </TableRow>
             </TableHead>
             <TableBody>
               {brackets.map((b, i) => (
                 <TableRow key={i}>
                   <TableCell>{money(b.from)}</TableCell>
                   <TableCell>{b.to ? money(b.to) : "∞"}</TableCell>
                   <TableCell>{(b.rate * 100).toFixed(2)}%</TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </Box>
       ) : null;
     
     /* ──────────────────────────────────────────────────────────
        Component
     ────────────────────────────────────────────────────────── */
     export default function PayslipModal({ open, onClose, payroll = {}, month }) {
       if (!open) return null;
     
       /* ——— quick access helpers ——— */
       const row = payroll; // alias
     
       /* main currency rows (earnings) we want to show if non-zero */
       const earningsRows = [
         { label: "Gross Pay", key: "gross_pay" },
         { label: "Vacation Pay", key: "vacation_pay" },
         { label: "Regular Pay", key: "regular_pay" },
         { label: "Overtime Pay", key: "overtime_pay" },
         { label: "Bonus", key: "bonus" },
         { label: "Commission", key: "commission" },
         { label: "Tip", key: "tip" },
         { label: "Travel Allowance", key: "travel_allowance" },
       ];
     
       /* deductions / taxes */
       const deductionRows = [
         { label: "Federal Tax", key: "federal_tax_amount", pct: "federal_tax_percent" },
         { label: "Provincial Tax", key: "provincial_tax_amount", pct: "provincial_tax_percent" },
         { label: "State Tax", key: "state_tax_amount", pct: "state_tax_percent" },
         { label: "CPP", key: "cpp_amount" },
         { label: "QPP", key: "qpp_amount" },
         { label: "EI", key: "ei_amount" },
         { label: "RQAP", key: "rqap_amount" },
         { label: "FICA", key: "fica_amount" },
         { label: "Medicare", key: "medicare_amount" },
       ];
     
       /* optional benefit overrides entered by manager */
       const benefitRows = [
         { label: "Retirement Contribution", key: "retirement_amount" },
         { label: "Medical Insurance", key: "medical_insurance" },
         { label: "Dental Insurance", key: "dental_insurance" },
         { label: "Life Insurance", key: "life_insurance" },
         { label: "Family Bonus", key: "family_bonus" },
         { label: "Parental Insurance", key: "parental_insurance" },
         { label: "Tax Credit", key: "tax_credit" },
       ];
     
       /* total deduction & Net pay always shown */
       const footerRows = [
         { label: "Total Deductions", key: "total_deductions" },
         { label: "Net Pay", key: "net_pay", strong: true },
       ];
     
       return (
         <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
           <DialogTitle>Payslip Preview</DialogTitle>
     
           <DialogContent dividers>
             <Typography variant="h6" gutterBottom>
               Employee:&nbsp;
               {row.employee_name || row.name || "(No name)"}
             </Typography>
                          <Typography variant="body2" gutterBottom>
               Pay Period: {month}
             </Typography>

{isNonZero(row.bpa_annual) && (
  <Typography>BPA Annual: {money(row.bpa_annual)}</Typography>
)}
{isNonZero(row.bpa_annual - row.bpa_remaining) && (
  <Typography>
    BPA Used: {money(row.bpa_annual - row.bpa_remaining)} / {money(row.bpa_annual)}
  </Typography>
)}
{isNonZero(row.bpa_applied) && (
  <Typography>
    BPA Applied This Period: {money(row.bpa_applied)} ({row.pay_frequency})
  </Typography>
)}
{isNonZero(row.bpa_remaining) && (
  <Typography>BPA Remaining: {money(row.bpa_remaining)}</Typography>
)}




             {/*  Earnings */}
             {earningsRows.some(({ key }) => isNonZero(row[key])) && (
               <>
                 <Divider sx={{ my: 2 }} />
                 <Typography sx={{ fontWeight: 500 }}>Earnings</Typography>
                 {earningsRows.map(
                   ({ label, key }) =>
                     isNonZero(row[key]) && (
                       <Typography key={key}>
                         {label}:&nbsp;{money(row[key])}
                       </Typography>
                     )
                 )}
               </>
             )}
     
             {/*  Hours breakdown (show if any OT or hours exist) */}
             {(isNonZero(row.regular_hours) || isNonZero(row.overtime_hours)) && (
               <>
                 <Divider sx={{ my: 2 }} />
                 <Typography sx={{ fontWeight: 500 }}>Hours</Typography>
                 {isNonZero(row.regular_hours) && (
                   <Typography>Regular Hours: {row.regular_hours}</Typography>
                 )}
                 {isNonZero(row.overtime_hours) && (
                   <Typography>Overtime Hours: {row.overtime_hours}</Typography>
                 )}
               </>
             )}
     
             {/*  Deductions */}
             {deductionRows.some(({ key }) => isNonZero(row[key])) && (
               <>
                 <Divider sx={{ my: 2 }} />
                 <Typography sx={{ fontWeight: 500 }}>Taxes & Contributions</Typography>
                 {deductionRows.map(
                   ({ label, key, pct }) =>
                     isNonZero(row[key]) && (
                       <Typography key={key}>
                         {label}: {money(row[key])}
                         {pct && isNonZero(row[pct]) && (
                           <> ({percent(row[pct])})</>
                         )}
                       </Typography>
                     )
                 )}
               </>
             )}
     
             {/*  Benefits / overrides */}
             {benefitRows.some(({ key }) => isNonZero(row[key])) && (
               <>
                 <Divider sx={{ my: 2 }} />
                 <Typography sx={{ fontWeight: 500 }}>
                   Benefits / Manager Overrides
                 </Typography>
                 {benefitRows.map(
                   ({ label, key }) =>
                     isNonZero(row[key]) && (
                       <Typography key={key}>
                         {label}: {money(row[key])}
                       </Typography>
                     )
                 )}
               </>
             )}
     
             {/*  Footer totals (always shown) */}
             <Divider sx={{ my: 2 }} />
             {footerRows.map(({ label, key, strong }) => (
               <Typography
                 key={key}
                 sx={strong ? { fontWeight: 600, mt: 1 } : undefined}
               >
                 {label}:&nbsp;{money(row[key])}
               </Typography>
             ))}
     
             {/*  Brackets (if backend included them) */}
             <BracketTable
               title="Federal Brackets"
               brackets={row.federal_brackets}
             />
             <BracketTable
               title="Provincial / State Brackets"
               brackets={row.provincial_brackets || row.state_brackets}
             />
           </DialogContent>
         </Dialog>
       );
     }
     