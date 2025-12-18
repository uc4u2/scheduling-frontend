// src/components/PayrollFilters.js
import React, { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Button,
  FormHelperText,
  IconButton,
  Tooltip,
  Badge,
  CircularProgress,
} from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";
import dayjs from "dayjs";
import axios from "axios";

/* ───────────────────────────────
   Region-specific option lists
──────────────────────────────── */
const OPTIONS = {
  ca: ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "SK", "YT"],
  qc: ["QC"],
  us: [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY",
    "LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND",
    "OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  ],
  other: [],
};

const REGION_CHOICES = [
  { value: "ca", label: "Canada (ex-QC)" },
  { value: "qc", label: "Québec" },
  { value: "us", label: "United States" },
  { value: "other", label: "Other" },
];

/* Helper – build preset pay-period labels */
const buildPeriods = (freq = "weekly") => {
  const year   = dayjs().year();
  const start  = dayjs(`${year}-01-01`);
  const end    = dayjs(`${year}-12-31`);
  const out    = [];
  let   cursor = start.clone();

  while (cursor.isBefore(end)) {
    const s = cursor.clone();
    const e =
      ({
        weekly:        () => s.add(6,  "day"),
        biweekly:      () => s.add(13, "day"),
        "semi-monthly":() => s.date() === 1 ? s.date(15) : s.endOf("month"),
        monthly:       () => s.endOf("month"),
      }[freq] || (() => s.add(6, "day")))();

    if (e.isAfter(end)) break;
    out.push({
      label: `${s.format("MMM D")} – ${e.format("MMM D")}`,
      start: s.format("YYYY-MM-DD"),
      end:   e.format("YYYY-MM-DD"),
    });
    cursor = e.add(1, "day");
  }
  return out;
};

/* ───────────────────────────────
   Component
──────────────────────────────── */
export default function PayrollFilters({
  /* props from parent */
  recruiters              = [],
  selectedRecruiter,
  setSelectedRecruiter,
  region,
  setRegion,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onPreview,
  loading                 = false,
  viewMode,
  payroll,
  setPayroll,
  handleFieldChange,
  payFrequency            = "weekly",
  setPayFrequency,
  setPayFreqTouched,
  departmentFilter: departmentFilterProp,
  setDepartmentFilter: setDepartmentFilterProp,
}) {
  /* ───────── API helpers ───────── */
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token   = localStorage.getItem("token");

  /* ───────── local UI state ───────── */
  const [periods,  setPeriods]  = useState([]);
  const [periodID, setPeriodID] = useState("");
  const [province, setProvince] = useState("");

  /* ⇢ NEW – departments */
  const [departments, setDepartments] = useState([]);
  const [departmentFilterLocal, setDepartmentFilterLocal] = useState("");

  const departmentFilter =
    departmentFilterProp !== undefined ? departmentFilterProp : departmentFilterLocal;
  const setDepartmentFilter =
    setDepartmentFilterProp !== undefined
      ? setDepartmentFilterProp
      : setDepartmentFilterLocal;

  /* fetch departments once */
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(res.data || []);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    fetchDepartments();
  }, [API_URL, token]);

  /* recruiters shown after dept filter */
  const filteredRecruiters = departmentFilter
    ? recruiters.filter(
        (r) => String(r.department_id) === String(departmentFilter)
      )
    : recruiters;

  /* ───────── initial defaults ───────── */
  useEffect(() => {
    if (!region && recruiters.length) {
      const guess =
        recruiters[0].country?.toLowerCase().includes("us") ? "us" : "ca";
      setRegion(guess);
    }
  }, [recruiters, region, setRegion]);

  /* pay-frequency → period options */
  useEffect(() => {
    setPeriods(
      ["weekly", "biweekly", "semi-monthly", "monthly"].includes(payFrequency)
        ? buildPeriods(payFrequency)
        : []
    );
    setPeriodID("");
  }, [payFrequency]);

  /* when an existing payroll row is opened for edit */
  useEffect(() => {
    if (payroll?.province) setProvince(payroll.province);
  }, [payroll]);

  /* keep payroll.province in sync with UI */
  useEffect(() => {
    setPayroll((p) => (p ? { ...p, province } : p));
  }, [province, setPayroll]);

  /* helper: one-click “today” */
  const pickToday = () => {
    const today = dayjs().format("YYYY-MM-DD");
    setStartDate(today);
    setEndDate(today);
    setPeriodID("");
    setPayroll((p) => (p ? { ...p, start_date: today, end_date: today } : p));
  };

  /* BPA badge rule (Canadian only) */
  const showBPA =
    ["weekly", "biweekly", "monthly"].includes(payFrequency) && region !== "us";

  /* ───────── render ───────── */
  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        {/* ───── Department picker ───── */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="deptLbl">Department</InputLabel>
            <Select
              labelId="deptLbl"
              label="Department"
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setSelectedRecruiter("");          // reset recruiter when dept changes
              }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* ───── Employee picker ───── */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="empLbl">Employee</InputLabel>
            <Select
              labelId="empLbl"
              label="Employee"
              value={selectedRecruiter || ""}
              onChange={(e) => {
                const rec = filteredRecruiters.find(
                  (r) => String(r.id) === String(e.target.value)
                );
                setSelectedRecruiter(e.target.value);

                if (!rec) return;

                /* derive region + province from recruiter object */
                const recProv = rec.province || "ON";
                const recReg  = rec.country?.toLowerCase().includes("us")
                  ? "us"
                  : recProv === "QC"
                  ? "qc"
                  : "ca";

                setProvince(recProv);
                setTimeout(() => setRegion(recReg), 0); // guarantee dropdown refresh

                setPayroll((p) => ({
                  ...(p || {}),
                  recruiter_id: rec.id,
                  employee_name: `${rec.first_name} ${rec.last_name}`,
                  name: `${rec.first_name} ${rec.last_name}`,
                  rate: rec.hourly_rate || 0,
                  province: recProv,
                  garnishment: Number(rec.default_garnishment ?? 0) || 0,
                  union_dues: Number(rec.default_union_dues ?? 0) || 0,
                  medical_insurance: Number(rec.default_medical_insurance ?? 0) || 0,
                  dental_insurance: Number(rec.default_dental_insurance ?? 0) || 0,
                  life_insurance: Number(rec.default_life_insurance ?? 0) || 0,
                  retirement_amount: Number(rec.default_retirement_amount ?? 0) || 0,
                  deduction: Number(rec.default_deduction ?? 0) || 0,
                }));
              }}
            >
              <MenuItem value="">— None —</MenuItem>
              {filteredRecruiters.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.first_name} {r.last_name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select an employee</FormHelperText>
          </FormControl>
        </Grid>

        {/* ───── Dates ───── */}
        <Grid item xs={12} md={3}>
          <TextField
            type="date"
            label="Start Date"
            fullWidth
            value={startDate || ""}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPeriodID("");
              setPayroll((p) =>
                p ? { ...p, start_date: e.target.value } : p
              );
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            type="date"
            label="End Date"
            fullWidth
            value={endDate || ""}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPeriodID("");
              setPayroll((p) =>
                p ? { ...p, end_date: e.target.value } : p
              );
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid
          item
          xs={12}
          md={2}
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Tooltip title="Set both dates to today">
            <IconButton onClick={pickToday} size="large">
              <TodayIcon />
            </IconButton>
          </Tooltip>
        </Grid>

        {/* ───── Region ───── */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="regLbl">Region</InputLabel>
            <Select
              labelId="regLbl"
              label="Region"
              value={region || "ca"}
              onChange={(e) => {
                const r = e.target.value;
                setRegion(r);
                const fallback = r === "qc" ? "QC" : r === "us" ? "CA" : "ON";
                setProvince(fallback);
              }}
            >
              {REGION_CHOICES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* ───── Pay frequency ───── */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Pay Frequency</InputLabel>
            <Badge
              badgeContent="BPA"
              color="secondary"
              invisible={!showBPA}
              sx={{ width: "100%" }}
            >
              <Select
                value={payFrequency}
                fullWidth
                onChange={(e) => {
                  setPayFrequency?.(e.target.value);
                  setPayFreqTouched?.(true);
                  handleFieldChange("pay_frequency", e.target.value);
                }}
              >
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="biweekly">Bi-weekly</MenuItem>
                <MenuItem value="semi-monthly">Semi-monthly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </Badge>
          </FormControl>
        </Grid>

        {/* ───── Preset pay-period picker ───── */}
        {periods.length > 0 && (
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Pay Period</InputLabel>
              <Select
                label="Pay Period"
                value={periodID}
                onChange={(e) => {
                  const pp = periods.find((p) => p.start === e.target.value);
                  if (!pp) return;
                  setPeriodID(pp.start);
                  setStartDate(pp.start);
                  setEndDate(pp.end);
                  setPayroll((p) =>
                    p ? { ...p, start_date: pp.start, end_date: pp.end } : p
                  );
                }}
              >
                {periods.map((p) => (
                  <MenuItem key={p.start} value={p.start}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* ───── Province / State ───── */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Province / State</InputLabel>
            <Select
              label="Province / State"
              value={province || (region === "qc" ? "QC" : "ON")}
              onChange={(e) => {
                setProvince(e.target.value);
                handleFieldChange("province", e.target.value);
              }}
            >
              {(OPTIONS[region || "ca"] || []).map((code) => (
                <MenuItem key={code} value={code}>
                  {code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* ───── Preview button ───── */}
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
