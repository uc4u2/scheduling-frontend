import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
} from "@mui/material";

const formatCurrency = (val) => {
  const num = Number(val);
  return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
};

export default function PayslipModal({ open, onClose, payroll, month }) {
  if (!payroll) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Payslip Preview</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          Employee: {payroll.name || "(No name)"}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Pay Period: {month}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography>Gross Pay: {formatCurrency(payroll.gross_pay)}</Typography>
          <Typography>Vacation Pay: {payroll.vacation_percent || 0}%</Typography>
          <Typography>Tax: {payroll.tax || 0}%</Typography>
          <Typography>Net Pay: {formatCurrency(payroll.net_pay)}</Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
