import React from "react";
import {
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  FormHelperText,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";

const REGIONS = [
  { value: "ca", label: "Canada (Excl. Quebec)" },
  { value: "qc", label: "Quebec" },
  { value: "us", label: "United States" },
  { value: "other", label: "Other" },
];


export default function PayrollFilters({
  recruiters,
  selectedRecruiter,
  setSelectedRecruiter,
  region,
  setRegion,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onPreview,
  loading,
  viewMode,
}) {
  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        {/* Employee Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="recruiter-label">Employee</InputLabel>
            <Select
              labelId="recruiter-label"
              value={selectedRecruiter}
              label="Employee"
              onChange={(e) => setSelectedRecruiter(e.target.value)}
            >
              <MenuItem value="">-- None --</MenuItem>
              {recruiters.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select an Employee</FormHelperText>
          </FormControl>
        </Grid>

        {/* Start Date */}
        <Grid item xs={12} md={4}>
          <TextField
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Payroll period start"
          />
        </Grid>

        {/* End Date */}
        <Grid item xs={12} md={4}>
          <TextField
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Payroll period end"
          />
        </Grid>

        {/* Region Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="region-label">Region</InputLabel>
            <Select
              labelId="region-label"
              value={region}
              label="Region"
              onChange={(e) => setRegion(e.target.value)}
            >
              {REGIONS.map((rg) => (
                <MenuItem key={rg.value} value={rg.value}>
                  {rg.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Choose region for payroll</FormHelperText>
          </FormControl>
        </Grid>

        {/* Load Preview Button */}
        {viewMode === "preview" && (
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={onPreview}
              disabled={!selectedRecruiter || loading}
            >
              {loading ? <CircularProgress size={24} /> : "Load Preview"}
            </Button>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
