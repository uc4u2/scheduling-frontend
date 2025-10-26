// src/components/PayrollFilters.js
import React, { useState, useEffect } from "react";
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
  IconButton,
  Tooltip,
  Badge,
} from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";
import dayjs from "dayjs";

/* ──────────────────────────────────────────────────────────
   Helpers & constants
────────────────────────────────────────────────────────── */
const REGIONS = [
  { value: "ca", label: "Canada (Excl. QC)" },
  { value: "qc", label: "Quebec" },
  { value: "us", label: "United States" },
  { value: "other", label: "Other" },
];

const generateDateOptions = (frequency = "weekly") => {
  const year = dayjs().year();
  const start = dayjs(`${year}-01-01`);
  const end = dayjs(`${year}-12-31`);
  const options = [];
  let cursor = start;

  while (cursor.isBefore(end)) {
    const periodStart = cursor;
    let periodEnd;

    switch (frequency) {
      case "weekly":
        periodEnd = cursor.add(6, "day");
        break;
      case "biweekly":
        periodEnd = cursor.add(13, "day");
        break;
      case "semi-monthly":
        periodEnd = cursor.date() === 1 ? cursor.date(15) : cursor.endOf("month");
        break;
      case "monthly":
        periodEnd = cursor.endOf("month");
        break;
      default:
        periodEnd = cursor.add(6, "day");
    }

    if (periodEnd.isAfter(end)) break;

    options.push({
      label: `${periodStart.format("MMM D")} – ${periodEnd.format("MMM D")}`,
      start: periodStart.format("YYYY-MM-DD"),
      end: periodEnd.format("YYYY-MM-DD"),
    });

    cursor = periodEnd.add(1, "day");
  }

  return options;
};

/* ──────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────── */
export default function PayrollFilters({
  recruiters = [],
  selectedRecruiter,
  setSelectedRecruiter,
  region,
  setRegion,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onPreview,
  loading = false,
  viewMode,
  setPayroll,
  payroll,
  handleFieldChange,
  setPayFrequency,
  payFrequency,
}) {
  const [periodOptions, setPeriodOptions] = useState([]);
  const [selectedPeriodStart, setSelectedPeriodStart] = useState("");

  useEffect(() => {
    if (!region && recruiters.length) {
      const guess = recruiters[0].country?.toLowerCase().startsWith("us") ? "us" : "ca";
      setRegion(guess);
    }
  }, [recruiters]); // eslint disabled in original

  const activeFreq = payFrequency || "weekly";

  useEffect(() => {
    if (["weekly", "biweekly", "semi-monthly", "monthly"].includes(activeFreq)) {
      setPeriodOptions(generateDateOptions(activeFreq));
      setSelectedPeriodStart("");
    } else {
      setPeriodOptions([]);
      setSelectedPeriodStart("");
    }
  }, [activeFreq]);

  const setToday = () => {
    const today = dayjs().format("YYYY-MM-DD");
    setStartDate(today);
    setEndDate(today);
    setPayroll((prev) => (prev ? { ...prev, start_date: today, end_date: today } : prev));
    setSelectedPeriodStart("");
  };

  const onPayFrequencyChange = (value) => {
    handleFieldChange("pay_frequency", value);
    setPayFrequency?.(value);
    setStartDate("");
    setEndDate("");
    setPayroll((prev) => (prev ? { ...prev, start_date: "", end_date: "" } : prev));
    setSelectedPeriodStart("");
  };

  const bpaApplies =
    ["weekly", "biweekly", "monthly"].includes(activeFreq) && region !== "us";

  const clearPresetPeriod = () => setSelectedPeriodStart("");

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        {/* Employee selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="recruiter-label">Employee</InputLabel>
            <Select
              labelId="recruiter-label"
              value={selectedRecruiter}
              label="Employee"
              onChange={(e) => {
                const recruiterId = e.target.value;
                setSelectedRecruiter(recruiterId);

                const recruiter = recruiters.find(
                  (r) => String(r.id) === String(recruiterId)
                );

                if (recruiter) {
                  setPayroll((prev) => ({
                    ...(prev || {}),
                    recruiter_id: recruiter.id,
                    employee_name: recruiter.name,
                    name: recruiter.name,
                    rate: recruiter.hourly_rate || 0,
                    province: recruiter.province || "ON",
                  }));
                }
              }}
            >
              <MenuItem value="">-- None --</MenuItem>
              {recruiters.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select an employee</FormHelperText>
          </FormControl>
        </Grid>

        {/* Start Date */}
        <Grid item xs={12} md={3}>
          <TextField
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPayroll((prev) =>
                prev ? { ...prev, start_date: e.target.value } : prev
              );
              clearPresetPeriod();
            }}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Payroll period start"
          />
        </Grid>

        {/* End Date */}
        <Grid item xs={12} md={3}>
          <TextField
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPayroll((prev) =>
                prev ? { ...prev, end_date: e.target.value } : prev
              );
              clearPresetPeriod();
            }}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Payroll period end"
          />
        </Grid>

        <Grid item xs={12} md={2} sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title="Set period to today">
            <IconButton onClick={setToday} size="large">
              <TodayIcon />
            </IconButton>
          </Tooltip>
        </Grid>

        {/* Region selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="region-label">Region</InputLabel>
            <Select
              labelId="region-label"
              value={region}
              label="Region"
              onChange={(e) => {
                const newRegion = e.target.value;
                setRegion(newRegion);
                setPayroll((prev) =>
                  prev
                    ? {
                        ...prev,
                        province:
                          newRegion === "qc"
                            ? "QC"
                            : newRegion === "ca"
                            ? "ON"
                            : "",
                        state: newRegion === "us" ? "CA" : "",
                        qpp: 0,
                        qpp_amount: 0,
                        cpp: 0,
                        cpp_amount: 0,
                        ei: 0,
                        ei_amount: 0,
                        rqap: 0,
                        rqap_amount: 0,
                        fica: 0,
                        fica_amount: 0,
                        medicare: 0,
                        medicare_amount: 0,
                        provincial_tax: 0,
                        provincial_tax_amount: 0,
                        state_tax: 0,
                        state_tax_amount: 0,
                      }
                    : prev
                );
              }}
            >
              {REGIONS.map((rg) => (
                <MenuItem key={rg.value} value={rg.value}>
                  {rg.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Choose region</FormHelperText>
          </FormControl>
        </Grid>

        {/* Pay frequency */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Pay Frequency</InputLabel>
            <Badge
              badgeContent="BPA"
              color="secondary"
              invisible={!bpaApplies}
              sx={{ width: "100%" }}
            >
              <Select
                value={activeFreq}
                onChange={(e) => onPayFrequencyChange(e.target.value)}
                fullWidth
              >
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="biweekly">Bi-weekly</MenuItem>
                <MenuItem value="semi-monthly">Semi-monthly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </Badge>
          </FormControl>
        </Grid>

        {/* Pay Period */}
        {periodOptions.length > 0 && (
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Pay Period</InputLabel>
              <Select
                value={selectedPeriodStart}
                label="Pay Period"
                onChange={(e) => {
                  const period = periodOptions.find((p) => p.start === e.target.value);
                  if (period) {
                    setSelectedPeriodStart(period.start);
                    setStartDate(period.start);
                    setEndDate(period.end);
                    setPayroll((prev) =>
                      prev
                        ? {
                            ...prev,
                            start_date: period.start,
                            end_date: period.end,
                            recruiter_id: prev.recruiter_id,
                            employee_name: prev.employee_name,
                            name: prev.name,
                            rate: prev.rate,
                            province: prev.province,
                          }
                        : prev
                    );
                  }
                }}
                fullWidth
              >
                {periodOptions.map((p) => (
                  <MenuItem key={p.start} value={p.start}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Province and State selectors */}
        {["ca", "qc"].includes(region) && (
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Province</InputLabel>
              <Select
                value={payroll?.province || (region === "qc" ? "QC" : "ON")}
                onChange={(e) => {
                  handleFieldChange("province", e.target.value);
                  setPayroll((prev) =>
                    prev ? { ...prev, provincial_tax: 0, provincial_tax_amount: 0 } : prev
                  );
                }}
              >
                {(region === "qc" ? ["QC"] : [
                  "AB","BC","MB","NB","NL","NS","NT","NU",
                  "ON","PE","SK","YT"
                ]).map((prov) => (
                  <MenuItem key={prov} value={prov}>
                    {prov}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {region === "us" && (
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>State</InputLabel>
              <Select
                value={payroll?.state || ""}
                onChange={(e) => {
                  handleFieldChange("state", e.target.value);
                  setPayroll((prev) =>
                    prev ? { ...prev, state_tax: 0, state_tax_amount: 0 } : prev
                  );
                }}
              >
                {["CA","NY","TX","FL","IL","PA","OH","MI",
                  "GA","NC","NJ","VA","WA"
                ].map((st) => (
                  <MenuItem key={st} value={st}>
                    {st}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

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
