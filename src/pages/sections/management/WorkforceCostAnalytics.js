import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../../../utils/api";
import SectionCard from "../../../components/ui/SectionCard";

dayjs.extend(quarterOfYear);

const KPI = ({ label, value, help }) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {help && (
        <Typography variant="caption" color="text.secondary">
          {help}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const chipPalette = {
  primary: { color: "#1d4ed8", bg: "rgba(37, 99, 235, 0.08)", border: "rgba(37, 99, 235, 0.28)" },
  success: { color: "#15803d", bg: "rgba(22, 163, 74, 0.09)", border: "rgba(22, 163, 74, 0.3)" },
  warning: { color: "#92400e", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.34)" },
  error: { color: "#991b1b", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.32)" },
  default: { color: "#334155", bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.28)" },
};

const readableChipSx = (tone = "default") => {
  const colors = chipPalette[tone] || chipPalette.default;
  return {
    color: colors.color,
    bgcolor: colors.bg,
    border: `1px solid ${colors.border}`,
    fontWeight: 850,
    "& .MuiChip-label": {
      color: colors.color,
      fontWeight: 850,
    },
  };
};

const MetricChip = ({ tone = "default", ...props }) => (
  <Chip size="small" variant="outlined" sx={readableChipSx(tone)} {...props} />
);

export default function WorkforceCostAnalytics({ compact = false } = {}) {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );
  const [from, setFrom] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [group, setGroup] = useState("day");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [recruiters, setRecruiters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [directoryError, setDirectoryError] = useState("");
  const [loading, setLoading] = useState(false);
  const [workforce, setWorkforce] = useState(null);
  const [error, setError] = useState("");

  const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;
  const fmtHours = (n) => `${Number(n || 0).toFixed(1)} h`;

  const employees = useMemo(() => {
    return (departmentId
      ? recruiters.filter((row) => String(row.department_id || "") === String(departmentId))
      : recruiters
    ).map((row) => ({
      ...row,
      name:
        row.name ||
        [row.first_name, row.last_name].filter(Boolean).join(" ") ||
        row.email ||
        `Employee #${row.id}`,
    }));
  }, [departmentId, recruiters]);

  const fetchDirectory = async () => {
    setDirectoryError("");
    try {
      const [rec, dept] = await Promise.all([
        api.get(`/manager/recruiters`, auth),
        api.get(`/api/departments`, auth),
      ]);
      setRecruiters(rec?.data?.recruiters || []);
      setDepartments(Array.isArray(dept?.data) ? dept.data : []);
    } catch (err) {
      setDirectoryError(err?.response?.data?.error || "Failed to load departments and employees for workforce filters.");
      setRecruiters([]);
      setDepartments([]);
    }
  };

  const fetchWorkforce = async () => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to, tz, group });
      if (departmentId) params.set("department_id", departmentId);
      if (employeeId) params.set("recruiter_id", employeeId);
      const { data } = await api.get(`/api/manager/analytics/workforce?${params.toString()}`, auth);
      setWorkforce(data || null);
    } catch (err) {
      setWorkforce(null);
      setError(err?.response?.data?.error || "Failed to load workforce analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
    fetchWorkforce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (key) => {
    const today = dayjs();
    if (key === "TODAY") {
      setFrom(today.format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("day");
    } else if (key === "WTD") {
      setFrom(today.startOf("week").format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("day");
    } else if (key === "MTD") {
      setFrom(today.startOf("month").format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("day");
    } else if (key === "QTD") {
      setFrom(dayjs().startOf("quarter").format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("week");
    } else if (key === "YTD") {
      setFrom(today.startOf("year").format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("month");
    }
  };

  const kpis = workforce?.kpis || {};
  const series = workforce?.series || [];
  const employeeBreakdown = workforce?.employee_breakdown || [];
  const departmentBreakdown = workforce?.department_breakdown || [];
  const risk = workforce?.overtime_risk || [];
  const readiness = workforce?.payroll_readiness || {};

  return (
    <Box>
      <SectionCard
        title="Workforce Filters"
        description="Track actual worked labor cost, overtime, paid leave cost, and payroll readiness using workforce analytics data."
        sx={{ mb: 2 }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField label="From" type="date" fullWidth value={from} onChange={(e) => setFrom(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="To" type="date" fullWidth value={to} onChange={(e) => setTo(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField select label="Group" fullWidth value={group} onChange={(e) => setGroup(e.target.value)}>
              <MenuItem value="day">Daily</MenuItem>
              <MenuItem value="week">Weekly</MenuItem>
              <MenuItem value="month">Monthly</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Department"
              fullWidth
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setEmployeeId("");
              }}
            >
              <MenuItem value="">All departments</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select label="Employee" fullWidth value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <MenuItem value="">All employees</MenuItem>
              {employees.map((rec) => (
                <MenuItem key={rec.id} value={String(rec.id)}>
                  {rec.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={compact ? 12 : 3}>
            <TextField label="Timezone" fullWidth value={tz} onChange={(e) => setTz(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={compact ? 12 : 9}>
            <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
              <Button size="small" onClick={() => applyPreset("TODAY")}>Today</Button>
              <Button size="small" onClick={() => applyPreset("WTD")}>WTD</Button>
              <Button size="small" onClick={() => applyPreset("MTD")}>MTD</Button>
              <Button size="small" onClick={() => applyPreset("QTD")}>QTD</Button>
              <Button size="small" onClick={() => applyPreset("YTD")}>YTD</Button>
              <Button variant="contained" onClick={() => { fetchDirectory(); fetchWorkforce(); }}>
                Refresh workforce
              </Button>
            </Stack>
          </Grid>
        </Grid>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
        {directoryError && <Alert severity="warning" sx={{ mt: 2 }}>{directoryError}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </SectionCard>

      {workforce && (
        <>
          <SectionCard
            title="Labor Cost Overview"
            description="Actual worked hours, overtime cost, paid leave cost, and payroll readiness signals for the selected window."
            sx={{ mb: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><KPI label="Estimated Labor Cost" value={fmtMoney(kpis.estimated_labor_cost)} /></Grid>
              <Grid item xs={12} md={3}><KPI label="Worked Hours" value={fmtHours(kpis.worked_hours)} help={`${kpis.worked_shifts || 0} shifts`} /></Grid>
              <Grid item xs={12} md={3}><KPI label="Overtime Hours" value={fmtHours(kpis.overtime_hours)} /></Grid>
              <Grid item xs={12} md={3}><KPI label="Paid Leave Cost" value={fmtMoney(kpis.paid_leave_cost)} /></Grid>
              <Grid item xs={12} md={3}><KPI label="Employees Worked" value={kpis.employees_worked || 0} /></Grid>
              <Grid item xs={12} md={3}><KPI label="Pending Time Approvals" value={readiness.pending_time_approvals || 0} /></Grid>
              <Grid item xs={12} md={3}><KPI label="Pending Leave Requests" value={readiness.pending_leave_requests || 0} /></Grid>
              <Grid item xs={12} md={3}><KPI label="Anomalies" value={readiness.anomaly_count || 0} /></Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Labor Cost Trend" description="Use daily, weekly, or monthly grouping to spot labor-cost spikes before payroll closes." sx={{ mb: 2 }}>
            {series.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No worked hours or approved paid leave in this range.</Typography>
            ) : (
              <Grid container spacing={1.5}>
                {series.map((row) => (
                  <Grid item xs={12} md={6} key={row.bucket_start}>
                    <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">{row.bucket}</Typography>
                        <MetricChip tone="primary" label={fmtMoney(row.labor_cost)} />
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        <MetricChip label={`Hours: ${fmtHours(row.worked_hours)}`} />
                        <MetricChip label={`OT: ${fmtHours(row.overtime_hours)}`} />
                        <MetricChip label={`Paid leave: ${fmtHours(row.paid_leave_hours)}`} />
                        <MetricChip label={`Shifts: ${row.worked_shifts || 0}`} />
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </SectionCard>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <SectionCard title="Overtime & Risk" description="Employees already in overtime or approaching the weekly threshold.">
                {risk.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No overtime risk in the selected range.</Typography>
                ) : (
                  risk.map((row) => (
                    <Box key={`${row.recruiter_id}-${row.week}`} sx={{ mb: 1.25, p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">{row.employee}</Typography>
                        <MetricChip tone={row.status === "overtime" ? "error" : "warning"} label={row.status === "overtime" ? "In overtime" : "Close to overtime"} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{row.department_name || "Unassigned"} · {row.week}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.round((100 * Number(row.hours || 0)) / Math.max(1, Number(row.threshold || 0))))}
                        color={row.status === "overtime" ? "error" : "warning"}
                        sx={{ mt: 1, height: 8, borderRadius: 999 }}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>{fmtHours(row.hours)} against a {fmtHours(row.threshold)} threshold</Typography>
                    </Box>
                  ))
                )}
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Payroll Readiness" description="What still needs review before payroll can close cleanly.">
                <Stack spacing={1.25}>
                  <MetricChip tone={readiness.pending_time_approvals ? "warning" : "success"} label={`Pending time approvals: ${readiness.pending_time_approvals || 0}`} />
                  <MetricChip tone={readiness.pending_leave_requests ? "warning" : "success"} label={`Pending leave requests: ${readiness.pending_leave_requests || 0}`} />
                  <MetricChip tone={readiness.anomaly_count ? "warning" : "success"} label={`Time anomalies: ${readiness.anomaly_count || 0}`} />
                  <Divider />
                  <Typography variant="body2" color="text.secondary">Estimated regular pay: {fmtMoney(kpis.regular_pay)}</Typography>
                  <Typography variant="body2" color="text.secondary">Estimated overtime pay: {fmtMoney(kpis.overtime_pay)}</Typography>
                  <Typography variant="body2" color="text.secondary">Paid leave hours: {fmtHours(kpis.paid_leave_hours)}</Typography>
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SectionCard title="Department Cost Breakdown" description="Compare labor cost and overtime by department.">
                {departmentBreakdown.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No department cost data in this range.</Typography>
                ) : (
                  departmentBreakdown.map((row, idx) => (
                    <Box key={`${row.department_id ?? "unassigned"}-${idx}`} sx={{ mb: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">{row.department_name || "Unassigned"}</Typography>
                        <Typography variant="subtitle2">{fmtMoney(row.total_cost)}</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {row.employees || 0} employee(s) · {fmtHours(row.worked_hours)} · OT {fmtHours(row.overtime_hours)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.round((100 * Number(row.total_cost || 0)) / Math.max(1, Number(departmentBreakdown[0]?.total_cost || 0))))}
                        sx={{ mt: 0.75, height: 7, borderRadius: 999 }}
                      />
                    </Box>
                  ))
                )}
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Employee Cost Breakdown" description="See who is driving labor cost and overtime in the selected period.">
                {employeeBreakdown.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No employee cost data in this range.</Typography>
                ) : (
                  employeeBreakdown.slice(0, 10).map((row) => (
                    <Box key={row.recruiter_id} sx={{ mb: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">{row.employee}</Typography>
                        <Typography variant="subtitle2">{fmtMoney(row.total_cost)}</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {row.department_name || "Unassigned"} · {fmtHours(row.worked_hours)} · OT {fmtHours(row.overtime_hours)}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                        <MetricChip label={`Rate ${fmtMoney(row.hourly_rate)}/h`} />
                        <MetricChip label={`Regular ${fmtMoney(row.regular_pay)}`} />
                        <MetricChip label={`OT ${fmtMoney(row.overtime_pay)}`} />
                        {Number(row.paid_leave_cost || 0) > 0 && (
                          <MetricChip tone="success" label={`Paid leave ${fmtMoney(row.paid_leave_cost)}`} />
                        )}
                      </Stack>
                    </Box>
                  ))
                )}
              </SectionCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
