import React from "react";
import { Grid, TextField, Typography } from "@mui/material";

const fields = [
  { label: "Employee Name", key: "employee_name", type: "text", readOnly: true },
  { label: "Hours Worked", key: "hours_worked", type: "number", readOnly: true },
  { label: "Hourly Rate ($)", key: "rate", type: "number" },
  { label: "Bonus ($)", key: "bonus", type: "number" },
  { label: "Commission ($)", key: "commission", type: "number" },
  { label: "Tips ($)", key: "tip", type: "number" },
];

export default function PayrollForm({ payroll, onChange }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {fields.map(({ label, key, type, readOnly }) => (
        <Grid item xs={12} sm={6} md={4} key={key}>
          {readOnly ? (
            <Typography variant="body1" sx={{ mt: 2 }}>
              <strong>{label}:</strong> {payroll[key] ?? "(not available)"}
            </Typography>
          ) : (
            <TextField
              fullWidth
              type={type}
              label={label}
              value={payroll[key] ?? ""}
              onChange={(e) => {
                const val =
                  type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
                onChange(key, val);
              }}
              InputProps={{
                inputProps: type === "number" ? { min: 0 } : {},
              }}
            />
          )}
        </Grid>
      ))}
    </Grid>
  );
}
