import React from "react";
import {
  Box,
  Drawer,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const sections = [
  {
    title: "Earnings (taxable)",
    items: [
      ["Bonus / Commission / Tips", "Taxable extras. If an employee earned $100 in tips this period, enter 100 here — tips are taxable."],
      ["Shift Premium", "Extra pay for night/evening/weekend work. Taxable like regular wages."],
      ["Travel / Allowances", "Taxable allowances (per diem, small bonuses, etc.). Use this if the amount should be included in gross pay and taxed (CPP/EI/FICA + income tax)."],
      ["Vacation Pay", "Optional override. Otherwise vacation is auto-calculated from rate × hours × vacation %."],
    ],
  },
  {
    title: "Reimbursements (non-taxable)",
    items: [
      ["Non-taxable Reimbursement", "Repay an expense (e.g., equipment, mileage) without taxing it. Added to net pay only; NOT included in gross or taxes."],
    ],
  },
  {
    title: "Deductions",
    items: [
      ["Union Dues", "Employee-paid union dues for this pay. Reduces net pay. For Canadian employees it is also reported on T4 Box 44."],
      ["Garnishment", "Flat legal deduction for this pay (e.g., child support). Reduces net pay. We do not automate court-order logic or remittance—send payments externally."],
      ["Other Deduction", "Catch-all deduction if you need a custom one-off amount."],
    ],
  },
  {
    title: "Taxes & Statutory (auto)",
    items: [
      ["Federal/State/Provincial tax", "Calculated automatically from region and earnings (unless overridden)."],
      ["CPP / EI (Canada)", "Withheld unless the employee is marked CPP/EI exempt in their profile."],
      ["FICA / Medicare (US)", "Calculated automatically for US employees."],
    ],
  },
  {
    title: "Examples",
    items: [
      ["Simple case", "Employee works 9–5 with no changes: you typically don’t edit anything. Gross/taxes/net are auto-calculated from approved time."],
      ["Tips", "Employee received $100 tips: enter 100 under Tips. It will be taxed and flow to W-2/T4."],
      ["Reimbursement", "Employee bought a $50 headset: put 50 in Non-taxable Reimbursement so they’re repaid without extra tax."],
    ],
  },
  {
    title: "CPP/EI exemptions (Canada)",
    items: [
      ["When to check CPP exempt", "Rare. For employees already collecting CPP or otherwise exempt. Usually set by an admin/accountant. If unsure, leave unchecked."],
      ["When to check EI exempt", "Rare. For EI-exempt categories (e.g., certain family members/owners). Usually set by an admin/accountant. If unsure, leave unchecked."],
    ],
  },
];

export default function PayrollPreviewHelp({ open, onClose }) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 420, p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Payroll Preview Help
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          What each field does, and how it affects gross, taxes, and net pay.
        </Typography>
        <Divider sx={{ my: 2 }} />
        {sections.map((section) => (
          <Box key={section.title} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {section.title}
            </Typography>
            <List dense disablePadding>
              {section.items.map(([title, desc]) => (
                <ListItem key={title} sx={{ alignItems: "flex-start", pl: 0 }}>
                  <ListItemText
                    primary={<Typography fontWeight={500}>{title}</Typography>}
                    secondary={desc}
                    secondaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
