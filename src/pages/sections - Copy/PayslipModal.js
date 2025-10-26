import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

const formatCurrency = (val) => {
  const num = Number(val);
  return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
};

const formatPercent = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0%" : `${num.toFixed(3)}%`;
};

const renderBracketTable = (title, brackets) => {
  if (!brackets || !brackets.length) return null;
  return (
    <Box sx={{ mt: 2 }}>
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
          {brackets.map((b, idx) => (
            <TableRow key={idx}>
              <TableCell>{formatCurrency(b.from)}</TableCell>
              <TableCell>{b.to ? formatCurrency(b.to) : "∞"}</TableCell>
              <TableCell>{(b.rate * 100).toFixed(2)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default function PayslipModal({ open, onClose, payroll, month }) {
  if (!payroll) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Payslip Preview</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
        Employee: {payroll.employee_name || payroll.name || "(No name)"}

        </Typography>
        <Typography variant="body2" gutterBottom>
          Pay Period: {month}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography>
            Gross Pay: {formatCurrency(payroll.gross_pay)}
          </Typography>
          <Typography>
            Vacation Pay: {formatCurrency(payroll.vacation_pay)}
          </Typography>

          {/* Optional breakdown */}
          <Typography sx={{ mt: 2 }}>Hours:</Typography>
          <Box sx={{ pl: 2 }}>
            <Typography>Regular Hours: {payroll.regular_hours || 0}</Typography>
            <Typography>Overtime Hours: {payroll.overtime_hours || 0}</Typography>
            <Typography>Regular Pay: {formatCurrency(payroll.regular_pay)}</Typography>
            <Typography>Overtime Pay: {formatCurrency(payroll.overtime_pay)}</Typography>
          </Box>

          <Typography sx={{ mt: 2 }}>Tax Breakdown:</Typography>
          <Box sx={{ pl: 2 }}>
            {payroll.federal_tax_amount ? (
              <Typography>
                Federal Tax: {formatCurrency(payroll.federal_tax_amount)} (
                {formatPercent(payroll.federal_tax_percent)})
              </Typography>
            ) : null}

            {payroll.provincial_tax_amount ? (
              <Typography>
                Provincial Tax: {formatCurrency(payroll.provincial_tax_amount)} (
                {formatPercent(payroll.provincial_tax_percent)})
              </Typography>
            ) : null}

            {payroll.state_tax_amount ? (
              <Typography>
                State Tax: {formatCurrency(payroll.state_tax_amount)} (
                {formatPercent(payroll.state_tax_percent)})
              </Typography>
            ) : null}

            {payroll.cpp_amount ? (
              <Typography>CPP: {formatCurrency(payroll.cpp_amount)}</Typography>
            ) : null}
            {payroll.qpp_amount ? (
              <Typography>QPP: {formatCurrency(payroll.qpp_amount)}</Typography>
            ) : null}
            {payroll.ei_amount ? (
              <Typography>EI: {formatCurrency(payroll.ei_amount)}</Typography>
            ) : null}
            {payroll.rqap_amount ? (
              <Typography>RQAP: {formatCurrency(payroll.rqap_amount)}</Typography>
            ) : null}
            {payroll.fica_amount ? (
              <Typography>FICA: {formatCurrency(payroll.fica_amount)}</Typography>
            ) : null}
            {payroll.medicare_amount ? (
              <Typography>
                Medicare: {formatCurrency(payroll.medicare_amount)}
              </Typography>
            ) : null}

            {payroll.rrsp ? (
              <Typography>RRSP: {formatCurrency(payroll.rrsp)}</Typography>
            ) : null}
            {payroll.rrsp_employer ? (
              <Typography>
                Employer RRSP: {formatCurrency(payroll.rrsp_employer)}
              </Typography>
            ) : null}
            {payroll.retirement ? (
              <Typography>
                Retirement: {formatCurrency(payroll.retirement)}
              </Typography>
            ) : null}
            {payroll.retirement_employer ? (
              <Typography>
                Employer Retirement:{" "}
                {formatCurrency(payroll.retirement_employer)}
              </Typography>
            ) : null}
          </Box>

          <Typography sx={{ mt: 2 }}>
            Net Pay: {formatCurrency(payroll.net_pay)}
          </Typography>

          {/* Bracket Tables */}
          {renderBracketTable("Federal Brackets", payroll.federal_brackets)}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
