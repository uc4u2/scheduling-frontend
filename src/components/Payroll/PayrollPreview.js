import React from "react";
import {
  Typography,
  Divider,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
  Alert,
} from "@mui/material";

const formatCurrency = (val) => {
  const num = Number(val);
  return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
};

export default function PayrollPreview({
  payroll,
  region,
  autoRecalc,
  setAutoRecalc,
  handleFieldChange,
  recalcNetPayManual,
  handleSave,
  handleExport,
  saving,
  ytdTotals,
  setShowPayslip,
  selectedRecruiter,
  month,
  setPayroll,
  snackbar,
  setSnackbar,
}) {
  const isCanada = region === "ca";
  const isQuebec = payroll?.province === "QC";
  const gross = (payroll?.hours_worked || 0) * (payroll?.rate || 0);

  const deductionField = (label, key, percent, editable = true) => (
    <>
      <Grid item xs={12} md={3}>
        <TextField
          label={`${label} (%)`}
          type="number"
          value={payroll[key] || 0}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          fullWidth
          disabled={!editable}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          label={`${label} Amount ($)`}
          value={formatCurrency((gross * (payroll[key] || 0)) / 100)}
          fullWidth
          InputProps={{ readOnly: true }}
        />
      </Grid>
    </>
  );

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Payroll Preview for {payroll.name || "--"}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <FormControlLabel
        control={
          <Checkbox
            checked={autoRecalc}
            onChange={() => setAutoRecalc(!autoRecalc)}
          />
        }
        label="Auto‑recalculate Net Pay on each change?"
      />
      {!autoRecalc && (
        <Button variant="outlined" onClick={recalcNetPayManual} sx={{ ml: 2 }}>
          Recalculate Now
        </Button>
      )}

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        {/* Name, Rate, Hours, Gross */}
        <Grid item xs={12} md={3}>
          <TextField
            label="Employee Name"
            value={payroll.name || ""}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Hours Worked"
            value={payroll.hours_worked || 0}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Hourly Rate"
            type="number"
            value={payroll.rate || 0}
            onChange={(e) => handleFieldChange("rate", e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Gross Pay"
            value={formatCurrency(payroll.gross_pay)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>

        {/* Extras */}
        {["vacation_pay", "commission", "bonus", "tip"].map((key) => (
          <Grid item xs={12} md={3} key={key}>
            <TextField
              label={`${key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())} ($)`}
              type="number"
              value={payroll[key] || 0}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              fullWidth
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6">Deductions</Typography>
      <Grid container spacing={2}>
        {/* Canada Deductions */}
        {isCanada && isQuebec && (
          <>
            {deductionField("QPP", "qpp")}
            {deductionField("EI", "ei")}
            {deductionField("RQAP", "rqap")}
          </>
        )}
        {isCanada && !isQuebec && (
          <>
            {deductionField("CPP", "cpp")}
            {deductionField("EI", "ei")}
          </>
        )}

        {/* US Deductions */}
        {region === "us" && (
          <>
            {deductionField("FICA", "fica")}
            {deductionField("Medicare", "medicare")}
          </>
        )}

        {/* Vacation % */}
        <Grid item xs={12} md={3}>
          <TextField
            label="Vacation (%)"
            type="number"
            value={payroll.vacation_percent || 0}
            onChange={(e) =>
              handleFieldChange("vacation_percent", e.target.value)
            }
            fullWidth
            helperText="Percentage of gross pay"
          />
        </Grid>

        {/* Retirement */}
        <Grid item xs={12} md={3}>
          <TextField
            label={
              region === "ca"
                ? "RRSP Amount ($)"
                : region === "us"
                ? "401(k) Amount ($)"
                : "Retirement Amount ($)"
            }
            type="number"
            value={payroll.retirement_amount || 0}
            onChange={(e) =>
              handleFieldChange("retirement_amount", e.target.value)
            }
            fullWidth
          />
        </Grid>

        {/* Other Deduction */}
        <Grid item xs={12} md={3}>
          <TextField
            label="Other Deduction ($)"
            type="number"
            value={payroll.deduction || 0}
            onChange={(e) => handleFieldChange("deduction", e.target.value)}
            fullWidth
          />
        </Grid>

        {/* Tax */}
        <Grid item xs={12} md={3}>
          <TextField
            label="Tax Amount ($)"
            type="number"
            value={payroll.tax_amount || 0}
            onChange={(e) => handleFieldChange("tax_amount", e.target.value)}
            fullWidth
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Summary */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Total Deductions ($)"
            value={formatCurrency(payroll.total_deductions)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Net Pay ($)"
            value={formatCurrency(payroll.net_pay)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
      </Grid>

      {/* YTD Summary */}
      {ytdTotals && (
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">Year-to-Date Summary</Typography>
          <Typography>Gross: ${ytdTotals.gross_pay}</Typography>
          <Typography>Tax Paid: ${ytdTotals.tax}</Typography>
          <Typography>Vacation Paid: ${ytdTotals.vacation_pay}</Typography>
          <Typography>RRSP/401(k): ${ytdTotals.retirement}</Typography>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Save + Export Buttons */}
      <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : "Save Payroll"}
        </Button>
        <Button variant="outlined" onClick={() => handleExport("csv")}>
          Export CSV
        </Button>
        <Button variant="outlined" onClick={() => handleExport("xlsx")}>
          Export XLSX
        </Button>
        <Button variant="outlined" onClick={() => handleExport("pdf")}>
          Export PDF
        </Button>
        <Button variant="outlined" onClick={() => setShowPayslip(true)}>
          Preview Payslip
        </Button>
      </Box>

      {/* Save/Load Local Template */}
      <Box sx={{ display: "flex", gap: 1, my: 2 }}>
        <Button
          onClick={() => {
            localStorage.setItem(
              `payroll-template-${selectedRecruiter}-${month}`,
              JSON.stringify(payroll)
            );
            setSnackbar({
              open: true,
              message: "Template saved",
              severity: "success",
            });
          }}
        >
          📂 Save Template
        </Button>
        <Button
          onClick={() => {
            const data = localStorage.getItem(
              `payroll-template-${selectedRecruiter}-${month}`
            );
            if (data) {
              setPayroll(JSON.parse(data));
              setSnackbar({
                open: true,
                message: "Template loaded",
                severity: "info",
              });
            } else {
              setSnackbar({
                open: true,
                message: "No saved template",
                severity: "warning",
              });
            }
          }}
        >
          💾 Load Last
        </Button>
      </Box>

      {/* Soft Warnings */}
      {payroll?.vacation_percent > 10 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Vacation pay exceeds 10% — double check this amount.
        </Alert>
      )}
      {!payroll?.province && isCanada && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Province is not selected — deductions may be incorrect.
        </Alert>
      )}
      {payroll?.tax === 0 && (
        <Alert severity="info" sx={{ mb: 1 }}>
          Tax is 0%. Is this correct?
        </Alert>
      )}
    </Box>
  );
}
