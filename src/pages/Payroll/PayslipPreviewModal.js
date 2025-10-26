import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Divider,
  Grid,
} from "@mui/material";

export default function PayslipPreviewModal({ open, onClose, payroll }) {
  const currency = (val) =>
    typeof val === "number" ? `$${val.toFixed(2)}` : "$0.00";

  const earnings = [
    { label: "Hours Worked", key: "hours_worked" },
    { label: "Hourly Rate", key: "rate" },
    { label: "Gross Pay", key: "gross_pay" },
    { label: "Bonus", key: "bonus" },
    { label: "Commission", key: "commission" },
    { label: "Tip", key: "tip" },
  ];

  const deductionEntries = payroll?.deductions
    ? Object.entries(payroll.deductions)
    : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Payslip Preview</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {payroll.employee_name || "(No Name)"} — {payroll.start_date} to{" "}
            {payroll.end_date}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Earnings
              </Typography>
              {earnings.map(
                (item) =>
                  payroll[item.key] !== undefined && (
                    <Typography key={item.key}>
                      {item.label}: {currency(payroll[item.key])}
                    </Typography>
                  )
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Deductions
              </Typography>
              {deductionEntries.length > 0 ? (
                deductionEntries.map(([label, value]) => (
                  <Typography key={label}>
                    {label.toUpperCase()}: {currency(value)}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2">(No deductions)</Typography>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h5" color="primary">
            Net Pay: {currency(payroll.net_pay)}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
