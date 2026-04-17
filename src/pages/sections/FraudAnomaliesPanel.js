import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Grid,
  IconButton,
  Collapse,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DateTime } from "luxon";
import api from "../../utils/api";
import ThemedDateField from "../../components/ui/ThemedDateField";

const palette = {
  accent: "#FF7A3C",
  warning: "#FFB020",
  error: "#E53935",
  info: "#4C6FFF",
};

const SummaryCard = ({ label, value, color }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 1,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,247,250,0.9))",
      minWidth: 180,
      flex: 1,
    }}
  >
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: color || "text.primary" }}>
        {value}
      </Typography>
    </Stack>
  </Paper>
);

const flagLabels = {
  device_new: "New device",
  location_new: "New location",
  multi_ip_same_day: "Multi-IP same day",
  outside_trusted: "Outside trusted IP",
};

const readableTableSx = (theme) => ({
  "& .MuiTableHead-root .MuiTableCell-root": {
    color: theme.palette.text.primary,
    fontWeight: 700,
    backgroundColor: alpha(theme.palette.primary.main, 0.06),
  },
  "& .MuiTableBody-root .MuiTableCell-root": {
    color: theme.palette.text.primary,
  },
});

const anomalyChipSx = (tone = "primary") => (theme) => {
  const colorByTone = {
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    success: theme.palette.success.main,
    primary: theme.palette.primary.main,
  };
  const base = colorByTone[tone] || theme.palette.primary.main;
  return {
    color: theme.palette.text.primary,
    bgcolor: alpha(base, 0.14),
    border: `1px solid ${alpha(base, 0.4)}`,
    fontWeight: 800,
    "& .MuiChip-label": {
      color: "inherit",
    },
  };
};

function flagChips(flags = {}) {
  return Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => (
      <Chip
        key={k}
        size="small"
        label={flagLabels[k] || k}
        sx={(theme) => ({
          ...anomalyChipSx(k === "outside_trusted" ? "error" : k === "multi_ip_same_day" ? "warning" : "primary")(theme),
          mr: 0.5,
          mb: 0.5,
        })}
      />
    ));
}

const FraudAnomaliesPanel = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ counts: {}, total_events: 0, total_shifts: 0, anomaly_percent: 0 });
  const [offenders, setOffenders] = useState([]);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const start = new Date(today.getTime() - 30 * 24 * 3600 * 1000);
    return {
      start_date: start.toISOString().slice(0, 10),
      end_date: today.toISOString().slice(0, 10),
      department_id: "",
      recruiter_id: "",
      type: "any",
    };
  });
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const totalFlags = useMemo(() => summary.counts || {}, [summary]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        type: filters.type || "any",
      });
      if (filters.department_id) params.set("department_id", filters.department_id);
      if (filters.recruiter_id) params.set("recruiter_id", filters.recruiter_id);
      const res = await api.get(`/manager/time-entries/anomalies?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSummary(res.data.summary || {});
      setOffenders(res.data.offenders || []);
      setEvents(res.data.events || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load anomalies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const loadDepartments = async () => {
      try {
        const res = await api.get("/api/departments", { headers });
        const data = res.data;
        if (Array.isArray(data)) {
          setDepartments(data.map((dept) => ({ id: dept.id, name: dept.name })));
        }
      } catch {
        setDepartments([]);
      }
    };

    const loadEmployees = async () => {
      try {
        const res = await api.get("/manager/recruiters", {
          headers,
        });
        const data = res.data;
        const rows = Array.isArray(data?.recruiters) ? data.recruiters : Array.isArray(data) ? data : [];
        setEmployees(rows);
      } catch {
        setEmployees([]);
      }
    };

    loadDepartments();
    loadEmployees();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.start_date, filters.end_date, filters.department_id, filters.recruiter_id, filters.type]);

  const percent = (summary?.anomaly_percent || 0).toFixed(1);

  const handleDepartmentChange = (event) => {
    const value = event.target.value;
    setFilters((prev) => {
      let recruiterId = prev.recruiter_id;
      if (
        value &&
        recruiterId &&
        !employees.some(
          (emp) =>
            String(emp.id) === String(recruiterId) &&
            String(emp.department_id || emp.departmentId || "") === String(value)
        )
      ) {
        recruiterId = "";
      }
      return { ...prev, department_id: value, recruiter_id: recruiterId };
    });
  };

  const applyDatePreset = (preset) => {
    const now = DateTime.local();
    let start = now;
    let end = now;
    if (preset === "this_week") {
      start = now.startOf("week");
      end = now.endOf("week");
    } else if (preset === "last_week") {
      start = now.startOf("week").minus({ weeks: 1 });
      end = start.endOf("week");
    }
    setFilters((prev) => ({
      ...prev,
      start_date: start.toISODate(),
      end_date: end.toISODate(),
    }));
  };

  const departmentOptions = useMemo(() => {
    if (departments.length) return departments;
    const unique = new Map();
    employees.forEach((emp) => {
      if (emp.department_id && emp.department_name) {
        unique.set(emp.department_id, emp.department_name);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [departments, employees]);

  const visibleEmployees = useMemo(() => {
    if (!filters.department_id) return employees;
    return employees.filter(
      (emp) => String(emp.department_id || emp.departmentId || "") === String(filters.department_id)
    );
  }, [employees, filters.department_id]);

  const riskChip = (score) => {
    const val = Number(score || 0);
    let tone = "success";
    if (val >= 60) tone = "error";
    else if (val >= 30) tone = "warning";
    return (
      <Chip
        size="small"
        label={`${val}`}
        sx={anomalyChipSx(tone)}
      />
    );
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={700}>
          Fraud / Anomalies
        </Typography>
        <Tooltip title="How this works">
          <IconButton onClick={() => setShowHelp((v) => !v)} size="small" aria-label="help">
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Collapse in={showHelp}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            background: (theme) => theme.palette.action.hover,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Help: Understanding Fraud & Anomalies
          </Typography>
          <Stack spacing={1}>
            <Typography>
              This dashboard flags unusual clock-in/out behavior that may indicate time theft, buddy punching,
              off-site punches, device spoofing, VPN usage, or forgotten clock-outs.
            </Typography>
            <Typography variant="subtitle2">How Schedulaa detects anomalies</Typography>
            <ul style={{ marginTop: 0, marginBottom: 0, paddingLeft: 18 }}>
              <li>New device: a browser/device fingerprint not seen before.</li>
              <li>New location: timezone/IP region changes unexpectedly.</li>
              <li>Multi-IP same day: clock-in and clock-out from different IPs.</li>
              <li>Outside trusted network: punch from an IP not in the company’s trusted list.</li>
            </ul>
            <Typography variant="subtitle2">Risk score (per event)</Typography>
            <Typography>
              New device +30, New location +30, Multi-IP +20, Outside trusted +40. 0–20 low, 21–59 medium, 60+ high.
            </Typography>
            <Typography variant="subtitle2">Top high-risk days</Typography>
            <Typography>Shows days with the most anomalies and highest average risk.</Typography>
            <Typography variant="subtitle2">Top offenders</Typography>
            <Typography>Employees with repeated anomalies and latest anomaly timestamps.</Typography>
            <Typography variant="subtitle2">What to do</Typography>
            <ul style={{ marginTop: 0, marginBottom: 0, paddingLeft: 18 }}>
              <li>Review the shift: check times and IPs.</li>
              <li>Ask the employee: confirm legitimacy.</li>
              <li>Update trusted IPs: add/remove office networks.</li>
              <li>Investigate repeats: high scores or repeated flags often indicate issues.</li>
            </ul>
          </Stack>
        </Paper>
      </Collapse>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            select
            fullWidth
            label="Anomaly type"
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          >
            <MenuItem value="any">Any</MenuItem>
            <MenuItem value="device">New device</MenuItem>
            <MenuItem value="location">New location</MenuItem>
            <MenuItem value="multi_ip">Multi-IP same day</MenuItem>
            <MenuItem value="outside_trusted">Outside trusted IP</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            fullWidth
            label="Department"
            value={filters.department_id}
            onChange={handleDepartmentChange}
          >
            <MenuItem value="">All departments</MenuItem>
            {departmentOptions.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            fullWidth
            label="Employee"
            value={filters.recruiter_id}
            onChange={(e) => setFilters((f) => ({ ...f, recruiter_id: e.target.value }))}
            helperText="Choose one employee or leave as All employees to see everyone."
          >
            <MenuItem value="">All employees (show everyone)</MenuItem>
            {visibleEmployees.map((rec) => {
              const displayName =
                rec.name ||
                rec.full_name ||
                [rec.first_name, rec.last_name].filter(Boolean).join(" ") ||
                (rec.email ? rec.email : `#${rec.id}`);
              return (
                <MenuItem key={rec.id} value={rec.id}>
                  {displayName}
                </MenuItem>
              );
            })}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <ThemedDateField
            label="From"
            fullWidth
            value={filters.start_date}
            onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <ThemedDateField
            label="To"
            fullWidth
            value={filters.end_date}
            onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ height: "100%" }}>
            <Button size="small" variant="outlined" onClick={() => applyDatePreset("today")}>
              Today
            </Button>
            <Button size="small" variant="outlined" onClick={() => applyDatePreset("this_week")}>
              This week
            </Button>
            <Button size="small" variant="outlined" onClick={() => applyDatePreset("last_week")}>
              Last week
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button variant="contained" onClick={load} disabled={loading} fullWidth={isMobile}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </Grid>
      </Grid>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <SummaryCard label="Anomaly events" value={summary?.total_events || 0} color={palette.error} />
        </Grid>
        <Grid item xs={12} md={3}>
          <SummaryCard label="Shifts in range" value={summary?.total_shifts || 0} />
        </Grid>
        <Grid item xs={12} md={3}>
          <SummaryCard label="Shifts with anomalies" value={`${percent}%`} color={palette.warning} />
        </Grid>
        <Grid item xs={12} md={3}>
          <SummaryCard
            label="Outside trusted IPs"
            value={totalFlags?.outside_trusted || 0}
            color={palette.error}
          />
        </Grid>
      </Grid>

      {Array.isArray(summary?.top_days) && summary.top_days.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Top high-risk days
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {summary.top_days.map((d) => (
              <Paper
                key={d.date}
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 1, minWidth: 140 }}
              >
                <Typography fontWeight={700}>{d.date}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {d.count} anomalies
                </Typography>
                <Typography variant="body2">
                  Avg risk: {Number(d.avg_risk || 0).toFixed(0)}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Top offenders
          </Typography>
          {loading && <LinearProgress sx={{ width: 160 }} />}
        </Stack>
        {offenders.length === 0 ? (
          <Typography color="text.secondary">No anomalies found for this range.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={(theme) => ({ minWidth: 720, ...readableTableSx(theme) })}>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Multi-IP</TableCell>
                  <TableCell>Outside trusted</TableCell>
                  <TableCell>Max risk</TableCell>
                  <TableCell>Last anomaly</TableCell>
                  <TableCell>Last IP</TableCell>
                  <TableCell>Last device</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offenders.map((o, idx) => (
                  <TableRow key={`${o.recruiter_id || "unknown"}-${idx}`}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar src={o.avatar || undefined} sx={{ width: 32, height: 32 }}>
                          {(o.employee_name || "E").charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600}>{o.employee_name || "Employee"}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{o.counts?.device_new || 0}</TableCell>
                    <TableCell>{o.counts?.location_new || 0}</TableCell>
                    <TableCell>{o.counts?.multi_ip_same_day || 0}</TableCell>
                    <TableCell>{o.counts?.outside_trusted || 0}</TableCell>
                    <TableCell>{riskChip(o.max_risk)}</TableCell>
                    <TableCell>
                      {o.last_anomaly_at ? new Date(o.last_anomaly_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>{o.last_ip || "—"}</TableCell>
                    <TableCell>{o.last_device || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Anomaly events
          </Typography>
          {loading && <LinearProgress sx={{ width: 160 }} />}
        </Stack>
        {events.length === 0 ? (
          <Typography color="text.secondary">No events in this range.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={(theme) => ({ minWidth: 720, ...readableTableSx(theme) })}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Clock in</TableCell>
                  <TableCell>Clock out</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Flags</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>IP in</TableCell>
                  <TableCell>IP out</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.date || "—"}</TableCell>
                    <TableCell>{e.employee_name || "Employee"}</TableCell>
                    <TableCell>{e.clock_in ? new Date(e.clock_in).toLocaleString() : "—"}</TableCell>
                    <TableCell>{e.clock_out ? new Date(e.clock_out).toLocaleString() : "—"}</TableCell>
                    <TableCell>{riskChip(e.risk_score)}</TableCell>
                    <TableCell>{flagChips(e.flags)}</TableCell>
                    <TableCell>
                      {e.device_in?.display || e.device_out?.display || "—"}
                      {(e.device_in?.fingerprint || e.device_out?.fingerprint) && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          FP: {(e.device_out?.fingerprint || e.device_in?.fingerprint || "").slice(0, 12)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{e.clock_in_ip || "—"}</TableCell>
                    <TableCell>{e.clock_out_ip || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Stack>
  );
};

export default FraudAnomaliesPanel;
