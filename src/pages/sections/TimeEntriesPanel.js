import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  Tooltip,
  Typography,
  Switch,
  Avatar,
  Menu,
  ListItemIcon,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DateTime } from "luxon";
import { timeTracking } from "../../utils/api";
import { getUserTimezone } from "../../utils/timezone";
import ThemedDateField from "../../components/ui/ThemedDateField";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import {
  formatLeaveWarningReason,
  getLeaveReviewVisibility,
} from "./utils/leaveReviewVisibility";

const statusColor = {
  assigned: "default",
  in_progress: "warning",
  completed: "info",
  approved: "success",
  rejected: "error",
};

const SummaryCard = ({ label, value, icon }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.default, 0.9)})`,
        flex: 1,
        minWidth: 180,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "6px",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.main,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
          }}
        >
          {icon || "•"}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h6" fontWeight={800}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

const formatTimeInsightHours = (value) => `${Number(value || 0).toFixed(1)} h`;

const isEntryApprovable = (entry) =>
  Boolean(
    entry &&
      !isLeaveEntry(entry) &&
      entry.status === "completed" &&
      !entry.is_locked &&
      !entry.deleted &&
      !entry.deleted_at
  );

const getAttestationBadgeLabel = (status, fallbackLabel) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "pending") return "Attestation pending";
  if (normalized === "submitted") return "Attestation submitted";
  if (normalized === "reviewed") return "Attestation reviewed";
  return fallbackLabel || "Attestation";
};

const hasTimeAnomaly = (entry) =>
  Boolean(
    entry?.device_new ||
      entry?.location_new ||
      entry?.multi_ip_same_day ||
      entry?.outside_trusted ||
      entry?.clock_in_unusual ||
      entry?.clock_out_unusual
  );

const hasMissingLocationEvidence = (entry) =>
  Boolean(
    entry?.location_missing ||
      entry?.missing_location_evidence ||
      entry?.clock_in_location_missing ||
      entry?.clock_out_location_missing
  );

const TimeInsightCard = ({ label, value, help, tone = "default" }) => {
  const toneMap = {
    success: { main: "#15803d", soft: "rgba(34, 197, 94, 0.08)" },
    warning: { main: "#b45309", soft: "rgba(245, 158, 11, 0.09)" },
    danger: { main: "#b91c1c", soft: "rgba(239, 68, 68, 0.08)" },
    info: { main: "#1d4ed8", soft: "rgba(59, 130, 246, 0.08)" },
    default: { main: "#0f172a", soft: "rgba(15, 23, 42, 0.03)" },
  };
  const colors = toneMap[tone] || toneMap.default;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.45,
        borderRadius: 1,
        height: "100%",
        borderColor: "rgba(148, 163, 184, 0.22)",
        background: `linear-gradient(145deg, ${colors.soft}, rgba(255,255,255,0.96))`,
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Stack spacing={0.45}>
        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
          <Typography variant="overline" color="text.secondary" fontWeight={900} sx={{ letterSpacing: 0.75, lineHeight: 1.2 }}>
            {label}
          </Typography>
          <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: colors.main }} />
        </Stack>
        <Typography variant="h4" fontWeight={950} sx={{ color: colors.main, lineHeight: 1 }}>
          {value}
        </Typography>
        {help && <Typography variant="caption" color="text.secondary">{help}</Typography>}
      </Stack>
    </Paper>
  );
};

const TimeInsightSection = ({ title, description, children, attention = false }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      borderRadius: 1,
      height: "100%",
      borderColor: attention ? "rgba(245, 158, 11, 0.24)" : "rgba(148, 163, 184, 0.22)",
      boxShadow: attention ? "0 16px 38px rgba(180, 83, 9, 0.07)" : "0 12px 30px rgba(15, 23, 42, 0.035)",
      bgcolor: "background.paper",
    }}
  >
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="subtitle1" fontWeight={900}>{title}</Typography>
        {description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
      </Box>
      {children}
    </Stack>
  </Paper>
);

const TimeInsightEmpty = ({ children }) => (
  <Box sx={{ py: 1, px: 1.25, borderRadius: 1, bgcolor: "rgba(148, 163, 184, 0.08)", color: "text.secondary" }}>
    <Typography variant="caption">{children}</Typography>
  </Box>
);

const TimeRankedBars = ({ rows, valueKey = "value", valueFormatter = (value) => value, color = "#2563eb", emptyText }) => {
  const visible = rows.slice(0, 8);
  const max = Math.max(1, ...visible.map((row) => Number(row[valueKey] || 0)));
  if (!visible.length) return <TimeInsightEmpty>{emptyText || "No data available."}</TimeInsightEmpty>;
  return (
    <Stack spacing={1.1}>
      {visible.map((row) => {
        const value = Number(row[valueKey] || 0);
        return (
          <Box key={row.key || row.label}>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Typography variant="body2" fontWeight={850} noWrap>{row.label}</Typography>
              <Typography variant="body2" fontWeight={900}>{valueFormatter(value, row)}</Typography>
            </Stack>
            <Box sx={{ mt: 0.5, height: 9, borderRadius: 1, bgcolor: "rgba(148, 163, 184, 0.16)", overflow: "hidden" }}>
              <Box sx={{ width: `${Math.max((value / max) * 100, value ? 6 : 0)}%`, height: "100%", bgcolor: color }} />
            </Box>
            {row.caption && <Typography variant="caption" color="text.secondary">{row.caption}</Typography>}
          </Box>
        );
      })}
    </Stack>
  );
};

const TimeTrendChart = ({ rows }) => {
  const visible = rows.slice(0, 14);
  const max = Math.max(1, ...visible.map((row) => Math.max(row.workedHours, row.approvedHours, row.ptoHours)));
  if (!visible.length) return <TimeInsightEmpty>No time data in this range.</TimeInsightEmpty>;
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
        {[
          ["Worked", "#2563eb"],
          ["Approved", "#15803d"],
          ["PTO", "#64748b"],
          ["Issues", "#b45309"],
        ].map(([label, color]) => (
          <Stack key={label} direction="row" spacing={0.65} alignItems="center">
            <Box sx={{ width: 9, height: 9, borderRadius: 999, bgcolor: color }} />
            <Typography variant="caption" color="text.secondary" fontWeight={800}>{label}</Typography>
          </Stack>
        ))}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${visible.length}, minmax(36px, 1fr))`, gap: 1, alignItems: "end", minHeight: 210 }}>
        {visible.map((row) => (
          <Stack key={row.date} spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
            <Stack justifyContent="flex-end" sx={{ height: 160, width: "100%", maxWidth: 44, borderRadius: 1, overflow: "hidden", bgcolor: "rgba(148, 163, 184, 0.13)", border: "1px solid rgba(148, 163, 184, 0.18)" }}>
              {[
                ["worked", row.workedHours, "#2563eb"],
                ["approved", row.approvedHours, "#15803d"],
                ["pto", row.ptoHours, "#64748b"],
              ].map(([key, value, color]) => (
                <Box key={key} title={`${key}: ${formatTimeInsightHours(value)}`} sx={{ height: `${Math.max((Number(value || 0) / max) * 100, value ? 5 : 0)}%`, minHeight: value ? 4 : 0, bgcolor: color }} />
              ))}
            </Stack>
            {row.issueCount > 0 && <Box sx={{ width: 7, height: 7, borderRadius: 999, bgcolor: "#b45309" }} title={`${row.issueCount} issue signals`} />}
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ writingMode: visible.length > 9 ? "vertical-rl" : "initial" }}>
              {DateTime.fromISO(row.date).isValid ? DateTime.fromISO(row.date).toFormat("LLL d") : row.date}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Stack>
  );
};

const readableRosterChipSx = (theme) => ({
  color: theme.palette.text.primary,
  borderColor: alpha(theme.palette.text.primary, 0.28),
  fontWeight: 700,
  "& .MuiChip-label": {
    color: "inherit",
  },
  "&.MuiChip-filled": {
    color: theme.palette.text.primary,
    backgroundColor: alpha(theme.palette.warning.main, 0.16),
  },
});

const isLeaveEntry = (entry) => entry?.entry_type === "leave";
const leaveKindLabel = (entry) => getLeaveReviewVisibility(entry).payShortLabel;
const leaveHours = (entry) => Number(entry?.paid_leave_hours || entry?.unpaid_leave_hours || entry?.hours_worked_rounded || 0);

const TimeInsightsPanel = ({
  entries,
  roster,
  filters,
  handleChange,
  handleDepartmentChange,
  applyDatePreset,
  fetchEntries,
  loading,
  statusOptions,
  departmentOptions,
  visibleEmployees,
  includeArchived,
  setIncludeArchived,
  recruiterMap,
}) => {
  const shiftEntries = useMemo(() => entries.filter((entry) => !isLeaveEntry(entry)), [entries]);
  const leaveRows = useMemo(() => entries.filter(isLeaveEntry), [entries]);
  const byDay = useMemo(() => {
    const map = new Map();
    entries.forEach((entry) => {
      const date = entry.date || entry.date_label || "Unknown";
      const row = map.get(date) || { date, workedHours: 0, approvedHours: 0, ptoHours: 0, issueCount: 0 };
      if (isLeaveEntry(entry)) {
        row.ptoHours += leaveHours(entry);
      } else {
        const hours = Number(entry.hours_worked_rounded ?? entry.hours_worked ?? 0);
        row.workedHours += Number.isFinite(hours) ? hours : 0;
        if (entry.status === "approved") row.approvedHours += Number.isFinite(hours) ? hours : 0;
        if (hasTimeAnomaly(entry) || entry.break_non_compliant || Number(entry.break_missing_minutes || 0) > 0) {
          row.issueCount += 1;
        }
      }
      map.set(date, row);
    });
    return Array.from(map.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [entries]);

  const employeeRows = useMemo(() => {
    const map = new Map();
    shiftEntries.forEach((entry) => {
      const employee = entry.recruiter || recruiterMap[entry.recruiter_id] || {};
      const label =
        employee.name ||
        employee.full_name ||
        `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
        employee.email ||
        `Employee ${entry.recruiter_id || "unknown"}`;
      const key = String(entry.recruiter_id || label);
      const row = map.get(key) || {
        key,
        label,
        totalHours: 0,
        approvedHours: 0,
        pending: 0,
        anomalyCount: 0,
        breakIssues: 0,
      };
      const hours = Number(entry.hours_worked_rounded ?? entry.hours_worked ?? 0);
      row.totalHours += Number.isFinite(hours) ? hours : 0;
      if (entry.status === "approved") row.approvedHours += Number.isFinite(hours) ? hours : 0;
      if (entry.status === "completed") row.pending += 1;
      if (hasTimeAnomaly(entry)) row.anomalyCount += 1;
      if (entry.break_non_compliant || Number(entry.break_missing_minutes || 0) > 0) row.breakIssues += 1;
      map.set(key, row);
    });
    return Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);
  }, [recruiterMap, shiftEntries]);

  const pendingApprovals = shiftEntries.filter((entry) => entry.status === "completed").length;
  const approvedHours = shiftEntries.reduce((sum, entry) => {
    if (entry.status !== "approved") return sum;
    const hours = Number(entry.hours_worked_rounded ?? entry.hours_worked ?? 0);
    return sum + (Number.isFinite(hours) ? hours : 0);
  }, 0);
  const workedHours = shiftEntries.reduce((sum, entry) => {
    const hours = Number(entry.hours_worked_rounded ?? entry.hours_worked ?? 0);
    return sum + (Number.isFinite(hours) ? hours : 0);
  }, 0);
  const ptoHours = leaveRows.reduce((sum, entry) => sum + leaveHours(entry), 0);
  const breakIssues = shiftEntries.filter((entry) => entry.break_non_compliant || Number(entry.break_missing_minutes || 0) > 0);
  const anomalyEntries = shiftEntries.filter(hasTimeAnomaly);
  const missingLocationCount = shiftEntries.filter(hasMissingLocationEvidence).length;
  const clockedInNow = roster.length;
  const onBreakNow = roster.filter((person) => person.break_in_progress).length;
  const maxBreakMissing = breakIssues.reduce((max, entry) => Math.max(max, Number(entry.break_missing_minutes || 0)), 0);
  const employeesAwaitingReview = new Set(shiftEntries.filter((entry) => entry.status === "completed").map((entry) => entry.recruiter_id)).size;
  const longestActive = roster.reduce((longest, person) => {
    if (!person.clock_in) return longest;
    const start = DateTime.fromISO(person.clock_in, { zone: "utc" });
    if (!start.isValid) return longest;
    const minutes = Math.max(0, Math.round(DateTime.utc().diff(start, "minutes").minutes));
    return Math.max(longest, minutes);
  }, 0);

  const riskRows = [
    { key: "new-device", label: "New device", value: shiftEntries.filter((entry) => entry.device_new).length, caption: "Clock events from new devices." },
    { key: "new-location", label: "New location", value: shiftEntries.filter((entry) => entry.location_new).length, caption: "Clock events from new locations." },
    { key: "multi-ip", label: "Multiple IPs", value: shiftEntries.filter((entry) => entry.multi_ip_same_day).length, caption: "Same-day multi-IP signals." },
    { key: "outside-trusted", label: "Outside trusted IP", value: shiftEntries.filter((entry) => entry.outside_trusted).length, caption: "Outside trusted location/IP controls." },
  ].filter((row) => row.value > 0);

  const breakEmployeeRows = employeeRows
    .filter((row) => row.breakIssues > 0)
    .map((row) => ({ ...row, value: row.breakIssues, caption: `${formatTimeInsightHours(row.totalHours)} worked` }));

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, borderColor: "rgba(148, 163, 184, 0.24)", boxShadow: "0 14px 34px rgba(15, 23, 42, 0.04)" }}>
        <Stack spacing={1.75}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
            <Box>
              <Typography variant="subtitle1" fontWeight={900}>Time insight controls</Typography>
              <Typography variant="body2" color="text.secondary">
                Read-only attendance analytics using the current approvals range, employee, department, and status filters.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button size="small" variant="outlined" onClick={fetchEntries} disabled={loading}>Refresh</Button>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" variant="outlined" onClick={() => applyDatePreset("today")}>Today</Button>
            <Button size="small" variant="outlined" onClick={() => applyDatePreset("this_week")}>This week</Button>
            <Button size="small" variant="outlined" onClick={() => applyDatePreset("last_week")}>Last week</Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2.4}>
              <TextField select fullWidth label="Status" value={filters.status} onChange={handleChange("status")}>
                {statusOptions.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField select fullWidth label="Department" value={filters.departmentId} onChange={handleDepartmentChange}>
                <MenuItem value="">All departments</MenuItem>
                {departmentOptions.map((dept) => <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField select fullWidth label="Employee" value={filters.recruiterId} onChange={handleChange("recruiterId")}>
                <MenuItem value="">All employees</MenuItem>
                {visibleEmployees.map((rec) => {
                  const displayName = rec.name || rec.full_name || [rec.first_name, rec.last_name].filter(Boolean).join(" ") || rec.email || `#${rec.id}`;
                  return <MenuItem key={rec.id} value={rec.id}>{displayName}</MenuItem>;
                })}
              </TextField>
            </Grid>
            <Grid item xs={12} md={1.8}>
              <ThemedDateField fullWidth label="From" value={filters.startDate} onChange={handleChange("startDate")} />
            </Grid>
            <Grid item xs={12} md={1.8}>
              <ThemedDateField fullWidth label="To" value={filters.endDate} onChange={handleChange("endDate")} />
            </Grid>
            <Grid item xs={12} md={1.2}>
              <FormControlLabel control={<Switch checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />} label="Archived" />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" variant="outlined" label={`${filters.startDate} to ${filters.endDate}`} />
            <Chip size="small" variant="outlined" label={filters.status === "all" ? "All statuses" : filters.status.replace(/_/g, " ")} />
            <Chip size="small" variant="outlined" label={filters.recruiterId ? "1 employee" : "All employees"} />
            <Chip size="small" variant="outlined" label={filters.departmentId ? "Department filtered" : "All departments"} />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}><TimeInsightCard label="Clocked in now" value={clockedInNow} help="Live roster active sessions" tone={clockedInNow ? "success" : "default"} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><TimeInsightCard label="On break now" value={onBreakNow} help="Live roster break state" tone={onBreakNow ? "warning" : "default"} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><TimeInsightCard label="Pending approvals" value={pendingApprovals} help="Completed entries awaiting review" tone={pendingApprovals ? "warning" : "success"} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><TimeInsightCard label="Approved hours" value={formatTimeInsightHours(approvedHours)} help={`${formatTimeInsightHours(workedHours)} worked in range`} tone="info" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><TimeInsightCard label="PTO / time off" value={formatTimeInsightHours(ptoHours)} help="Leave rows in current time view" tone={ptoHours ? "default" : "success"} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><TimeInsightCard label="Break issues" value={breakIssues.length} help={`Max missing ${maxBreakMissing}m`} tone={breakIssues.length ? "warning" : "success"} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><TimeInsightCard label="Anomaly events" value={anomalyEntries.length} help="Device, location, IP, or unusual clock signals" tone={anomalyEntries.length ? "danger" : "success"} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><TimeInsightCard label="Location evidence" value={missingLocationCount} help="Missing location evidence signals" tone={missingLocationCount ? "warning" : "success"} /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <TimeInsightSection title="Worked hours trend" description="Worked, approved, PTO, and issue signals by day in the selected range." attention={pendingApprovals > 0}>
            <TimeTrendChart rows={byDay} />
          </TimeInsightSection>
        </Grid>
        <Grid item xs={12} lg={4}>
          <TimeInsightSection title="Approval pressure summary" description="Manager review pressure for the selected range." attention={pendingApprovals > 0}>
            <TimeRankedBars
              rows={[
                { key: "pending", label: "Pending approvals", value: pendingApprovals, caption: `${employeesAwaitingReview} employee${employeesAwaitingReview === 1 ? "" : "s"} awaiting review` },
                { key: "attention", label: "Entries needing attention", value: breakIssues.length + anomalyEntries.length, caption: "Break and anomaly signals combined" },
                { key: "approved", label: "Approved hours", value: approvedHours, caption: "Confirmed for payroll input" },
              ]}
              valueFormatter={(value, row) => row.key === "approved" ? formatTimeInsightHours(value) : value}
              color={pendingApprovals ? "#b45309" : "#15803d"}
            />
          </TimeInsightSection>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TimeInsightSection title="Break compliance summary" description="Break issues and employees with recurring break signals." attention={breakIssues.length > 0}>
            <TimeRankedBars rows={breakEmployeeRows} valueKey="value" color="#b45309" emptyText="No break issues in this range." />
          </TimeInsightSection>
        </Grid>
        <Grid item xs={12} md={4}>
          <TimeInsightSection title="Risk / anomaly summary" description="Fraud and location signals already present on time entries." attention={anomalyEntries.length > 0}>
            <TimeRankedBars rows={riskRows} valueKey="value" color="#b91c1c" emptyText="No anomaly signals in this range." />
          </TimeInsightSection>
        </Grid>
        <Grid item xs={12} md={4}>
          <TimeInsightSection title="Live roster health" description="Current active sessions and break state." attention={onBreakNow > 0}>
            <TimeRankedBars
              rows={[
                { key: "active", label: "Active now", value: clockedInNow, caption: "Clocked in right now" },
                { key: "break", label: "On break now", value: onBreakNow, caption: "Break currently in progress" },
                { key: "longest", label: "Longest active session", value: longestActive, caption: "Minutes since clock-in" },
              ]}
              valueFormatter={(value, row) => row.key === "longest" ? `${value}m` : value}
              color="#2563eb"
            />
          </TimeInsightSection>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <TimeInsightSection title="Employee time summary" description="Ranked by total worked hours in the selected range.">
            <TimeRankedBars
              rows={employeeRows.map((row) => ({
                ...row,
                value: row.totalHours,
                caption: `${formatTimeInsightHours(row.approvedHours)} approved · ${row.pending} pending · ${row.anomalyCount} anomalies · ${row.breakIssues} break issues`,
              }))}
              valueKey="value"
              valueFormatter={formatTimeInsightHours}
              color="#2563eb"
              emptyText="No employee time rows in this range."
            />
          </TimeInsightSection>
        </Grid>
        <Grid item xs={12} md={4}>
          <TimeInsightSection title="PTO / leave interaction" description="Leave rows currently visible in the time tracking range.">
            <TimeRankedBars
              rows={[
                { key: "pto-hours", label: "PTO / time off hours", value: ptoHours, caption: `${leaveRows.length} leave row${leaveRows.length === 1 ? "" : "s"}` },
                { key: "estimated", label: "Estimated leave rows", value: leaveRows.filter((entry) => getLeaveReviewVisibility(entry).estimated).length, caption: "Needs manager confirmation when pay-impacting" },
                { key: "overlap", label: "Worked-time overlap", value: leaveRows.filter((entry) => getLeaveReviewVisibility(entry).hasWorkedOverlap).length, caption: "Requires payroll attention" },
              ]}
              valueKey="value"
              valueFormatter={(value, row) => row.key === "pto-hours" ? formatTimeInsightHours(value) : value}
              color="#64748b"
              emptyText="No PTO or leave rows in this range."
            />
          </TimeInsightSection>
        </Grid>
      </Grid>
    </Stack>
  );
};

const AttestationsPanel = ({
  filters,
  attestationFilters,
  setAttestationFilters,
  handleChange,
  handleDepartmentChange,
  applyDatePreset,
  fetchAttestations,
  loading,
  departmentOptions,
  visibleEmployees,
  includeArchived,
  setIncludeArchived,
  recruiterMap,
  items,
  summary,
  setSnackbar,
}) => {
  const triggerOptions = [
    { value: "all", label: "All triggers" },
    { value: "missed_break", label: "Missed break" },
    { value: "short_break", label: "Short break" },
    { value: "early_clock_out", label: "Early clock-out" },
    { value: "injury_free", label: "Injury-free" },
  ];
  const statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "submitted", label: "Submitted" },
    { value: "reviewed", label: "Reviewed" },
  ];

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams({
        start_date: filters.startDate,
        end_date: filters.endDate,
        trigger_type: attestationFilters.triggerType,
        status: attestationFilters.status,
      });
      if (filters.recruiterId) params.set("recruiter_id", filters.recruiterId);
      if (filters.departmentId) params.set("department_id", filters.departmentId);
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
      const res = await api.get(`/manager/time-entries/attestations/export?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shift_attestations_${filters.startDate}_${filters.endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setSnackbar({ open: true, severity: "error", message: "Unable to export attestations." });
    }
  };

  const reviewAttestation = async (id) => {
    try {
      await timeTracking.reviewAttestation(id);
      setSnackbar({ open: true, severity: "success", message: "Attestation reviewed." });
      fetchAttestations();
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: err?.response?.data?.error || "Unable to review attestation." });
    }
  };

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, borderColor: "rgba(148, 163, 184, 0.24)", boxShadow: "0 14px 34px rgba(15, 23, 42, 0.04)" }}>
        <Stack spacing={1.75}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
            <Box>
              <Typography variant="subtitle1" fontWeight={900}>Attestation controls</Typography>
              <Typography variant="body2" color="text.secondary">
                Review clock-out and break attestations using the same employee, department, and date filters as Time Tracking.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                Marking an attestation as reviewed only confirms you saw the employee&apos;s response. It does not approve or change the time entry.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button size="small" variant="outlined" onClick={fetchAttestations} disabled={loading}>Refresh</Button>
              <Button size="small" variant="outlined" onClick={exportCsv} disabled={loading}>Export CSV</Button>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" variant="outlined" onClick={() => applyDatePreset("today")}>Today</Button>
            <Button size="small" variant="outlined" onClick={() => applyDatePreset("this_week")}>This week</Button>
            <Button size="small" variant="outlined" onClick={() => applyDatePreset("last_week")}>Last week</Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2.4}>
              <TextField
                select
                fullWidth
                label="Status"
                value={attestationFilters.status}
                onChange={(event) => setAttestationFilters((prev) => ({ ...prev, status: event.target.value }))}
              >
                {statusOptions.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField select fullWidth label="Department" value={filters.departmentId} onChange={handleDepartmentChange}>
                <MenuItem value="">All departments</MenuItem>
                {departmentOptions.map((dept) => <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField select fullWidth label="Employee" value={filters.recruiterId} onChange={handleChange("recruiterId")}>
                <MenuItem value="">All employees</MenuItem>
                {visibleEmployees.map((rec) => {
                  const displayName = rec.name || rec.full_name || [rec.first_name, rec.last_name].filter(Boolean).join(" ") || rec.email || `#${rec.id}`;
                  return <MenuItem key={rec.id} value={rec.id}>{displayName}</MenuItem>;
                })}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField
                select
                fullWidth
                label="Trigger"
                value={attestationFilters.triggerType}
                onChange={(event) => setAttestationFilters((prev) => ({ ...prev, triggerType: event.target.value }))}
              >
                {triggerOptions.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={1.2}>
              <ThemedDateField fullWidth label="From" value={filters.startDate} onChange={handleChange("startDate")} />
            </Grid>
            <Grid item xs={12} md={1.2}>
              <ThemedDateField fullWidth label="To" value={filters.endDate} onChange={handleChange("endDate")} />
            </Grid>
            <Grid item xs={12} md={1.2}>
              <FormControlLabel control={<Switch checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />} label="Archived" />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" variant="outlined" label={`Pending ${summary?.pending || 0}`} />
            <Chip size="small" variant="outlined" label={`Submitted ${summary?.submitted || 0}`} />
            <Chip size="small" variant="outlined" label={`Reviewed ${summary?.reviewed || 0}`} />
            <Chip size="small" variant="outlined" color={(summary?.missed_break || 0) ? "warning" : "default"} label={`Missed break ${summary?.missed_break || 0}`} />
            <Chip size="small" variant="outlined" color={(summary?.short_break || 0) ? "warning" : "default"} label={`Short break ${summary?.short_break || 0}`} />
            <Chip size="small" variant="outlined" color={(summary?.early_clock_out || 0) ? "warning" : "default"} label={`Early clock-out ${summary?.early_clock_out || 0}`} />
            <Chip size="small" variant="outlined" color={(summary?.injury_free || 0) ? "info" : "default"} label={`Injury-free ${summary?.injury_free || 0}`} />
          </Stack>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Trigger</TableCell>
              <TableCell>Shift time</TableCell>
              <TableCell>Breaks</TableCell>
              <TableCell>Response</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
                </TableCell>
              </TableRow>
            ) : !items.length ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <Typography variant="body2" color="text.secondary">No attestations found for this filter.</Typography>
                </TableCell>
              </TableRow>
            ) : items.map((item) => {
              const recruiter = recruiterMap[item.recruiter_id] || item.employee || {};
              return (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={recruiter.profile_image_url || recruiter.avatar || undefined}>
                        {(item.employee_name || "E").charAt(0)}
                      </Avatar>
                      <Typography fontWeight={600}>{item.employee_name || recruiter.name || `#${item.recruiter_id}`}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.date || "—"}</TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={item.trigger_label || item.trigger_type} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.actual_start_local ? `In ${item.actual_start_local}` : "—"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.actual_end_local ? `Out ${item.actual_end_local}` : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={`${item.break_recorded_minutes || 0}m / ${item.break_expected_minutes || 0}m`} />
                  </TableCell>
                  <TableCell>{item.response_value ? String(item.response_value).replace(/_/g, " ") : "Pending"}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{item.comment || "—"}</Typography>
                  </TableCell>
                  <TableCell>{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={item.status}
                      color={item.status === "pending" ? "warning" : item.status === "submitted" ? "info" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={item.status === "reviewed"}
                      onClick={() => reviewAttestation(item.id)}
                    >
                      Mark reviewed
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

const TimeEntriesPanel = ({ recruiters = [] }) => {
  const theme = useTheme();
  const viewerTimezone = getUserTimezone();
  const today = useMemo(() => new Date(), []);
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState("approvals");
  const [employees, setEmployees] = useState(recruiters || []);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    recruiterId: "",
    departmentId: "",
    startDate: today.toISOString().slice(0, 10),
    endDate: today.toISOString().slice(0, 10),
  });
  const [attestationFilters, setAttestationFilters] = useState({
    status: "all",
    triggerType: "all",
  });
  const [entries, setEntries] = useState([]);
  const [attestations, setAttestations] = useState([]);
  const [attestationSummary, setAttestationSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [attestationLoading, setAttestationLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "info",
    message: "",
  });
  const [rejectState, setRejectState] = useState({
    open: false,
    entryId: null,
    reason: "",
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [rowMenuAnchor, setRowMenuAnchor] = useState(null);
  const [rowMenuEntry, setRowMenuEntry] = useState(null);
  const [bulkForm, setBulkForm] = useState({
    templateId: "",
    breakMinutes: "",
    breakPaid: true,
  });
  const [roster, setRoster] = useState([]);
  const [rosterCollapsed, setRosterCollapsed] = useState(false);
  const [rosterUpdatedAt, setRosterUpdatedAt] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState(null);
  const [detailEntries, setDetailEntries] = useState([]);
  const [detailSummary, setDetailSummary] = useState(null);
  const [detailFilters, setDetailFilters] = useState(() => {
    const today = DateTime.local().toISODate();
    return { startDate: today, endDate: today, status: "all" };
  });
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const recruiterMap = useMemo(() => {
    const map = {};
    (employees || []).forEach((r) => {
      if (!r || typeof r !== "object") return;
      const id = r.id || r.recruiter_id;
      if (!id) return;
      map[id] = r;
    });
    return map;
  }, [employees]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All statuses" },
      { value: "completed", label: "Completed (awaiting approval)" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
      { value: "in_progress", label: "In progress" },
    ],
    []
  );
  const templateOptions = useMemo(() => {
    if (Array.isArray(templates)) return templates;
    if (templates && Array.isArray(templates.templates)) {
      return templates.templates;
    }
    return [];
  }, [templates]);
  const rosterStats = useMemo(() => {
    const active = roster.length;
    const onBreak = roster.filter((person) => person.break_in_progress).length;
    return { active, onBreak };
  }, [roster]);
  const rosterByEntryId = useMemo(() => {
    const map = {};
    roster.forEach((person) => {
      if (!person?.id) return;
      map[String(person.id)] = person;
    });
    return map;
  }, [roster]);
  const pendingCount = useMemo(
    () => entries.filter((e) => !isLeaveEntry(e) && e.status === "completed").length,
    [entries]
  );
  const selectableEntries = useMemo(() => entries.filter((entry) => !isLeaveEntry(entry)), [entries]);
  const selectedEntries = useMemo(
    () => entries.filter((entry) => selectedIds.includes(entry.id)),
    [entries, selectedIds]
  );
  const selectedApprovableEntries = useMemo(
    () => selectedEntries.filter(isEntryApprovable),
    [selectedEntries]
  );
  const selectedApprovableIds = useMemo(
    () => selectedApprovableEntries.map((entry) => entry.id),
    [selectedApprovableEntries]
  );
  const leaveRows = useMemo(() => entries.filter(isLeaveEntry), [entries]);
  const ptoHoursRange = useMemo(
    () => leaveRows.reduce((sum, entry) => sum + leaveHours(entry), 0),
    [leaveRows]
  );
  const hoursToday = useMemo(() => {
    const targetDate = filters.startDate === filters.endDate ? filters.startDate : null;
    return entries.reduce((sum, e) => {
      if (targetDate && e.date !== targetDate) return sum;
      const hrs = Number(e.hours_worked_rounded ?? e.hours_worked ?? 0);
      return sum + (Number.isFinite(hrs) ? hrs : 0);
    }, 0);
  }, [entries, filters.startDate, filters.endDate]);
  const clockedInCount = rosterStats.active;
  const onBreakCount = rosterStats.onBreak;
  const detailEmployeeName = useMemo(() => {
    if (!detailEmployee) return "";
    const idLabel = detailEmployee.id ? `#${detailEmployee.id}` : "";
    const full = `${detailEmployee.first_name || ""} ${detailEmployee.last_name || ""}`.trim();
    return detailEmployee.name || detailEmployee.full_name || full || detailEmployee.email || idLabel;
  }, [detailEmployee]);
  const detailStats = useMemo(() => {
    if (!Array.isArray(detailEntries) || !detailEntries.length) {
      return {
        total: 0,
        breakCompliance: null,
        breakNonCompliant: 0,
        unusualIPs: 0,
        rejected: 0,
        approved: 0,
        inProgress: 0,
        anomalies: 0,
        maxBreakMissing: 0,
      };
    }
    const shiftEntries = detailEntries.filter((entry) => !isLeaveEntry(entry));
    let breakNon = 0;
    let unusual = 0;
    let rejected = 0;
    let approved = 0;
    let inProgress = 0;
    let anomalies = 0;
    let maxBreakMissing = 0;
    shiftEntries.forEach((e) => {
      if (e.break_non_compliant) breakNon += 1;
      if (e.clock_in_unusual || e.clock_out_unusual) unusual += 1;
      if (e.status === "rejected") rejected += 1;
      if (e.status === "approved") approved += 1;
      if (e.status === "in_progress") inProgress += 1;
      const missing = Number(e.break_missing_minutes || 0);
      if (missing > maxBreakMissing) maxBreakMissing = missing;
    });
    anomalies = breakNon + unusual + rejected;
    const total = shiftEntries.length;
    const breakCompliance = total ? Math.round(((total - breakNon) / total) * 100) : null;
    return {
      total,
      breakCompliance,
      breakNonCompliant: breakNon,
      unusualIPs: unusual,
      rejected,
      approved,
      inProgress,
      anomalies,
      maxBreakMissing,
    };
  }, [detailEntries]);

  const handleChange = (key) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleDepartmentChange = (event) => {
    const value = event.target.value;
    setFilters((prev) => {
      let recruiterId = prev.recruiterId;
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
      return { ...prev, departmentId: value, recruiterId };
    });
  };
  const applyDatePreset = (preset) => {
    const now = DateTime.local();
    let start = now;
    let end = now;
    if (preset === "today") {
      start = now;
      end = now;
    } else if (preset === "this_week") {
      start = now.startOf("week");
      end = now.endOf("week");
    } else if (preset === "last_week") {
      start = now.startOf("week").minus({ weeks: 1 });
      end = start.endOf("week");
    }
    setFilters((prev) => ({
      ...prev,
      startDate: start.toISODate(),
      endDate: end.toISODate(),
    }));
  };
  const selectedCount = selectedIds.length;
  const selectedApprovableCount = selectedApprovableIds.length;
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = selectableEntries.map((entry) => entry.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelectOne = (entryId) => (event) => {
    if (event.target.checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, entryId])));
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== entryId));
    }
  };

  const applyDetailDatePreset = (preset) => {
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
    setDetailFilters((prev) => ({
      ...prev,
      startDate: start.toISODate(),
      endDate: end.toISODate(),
    }));
  };

  const fetchEntries = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.status && filters.status !== "all") params.status = filters.status;
      if (filters.recruiterId) params.recruiter_id = filters.recruiterId;
      if (filters.departmentId) params.department_id = filters.departmentId;
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      const data = await timeTracking.listEntries(params);
      setEntries(data.time_entries || []);
      setRoster(Array.isArray(data.roster) ? data.roster : []);
      setRosterUpdatedAt(new Date());
    } catch (err) {
      setEntries([]);
      setRoster([]);
      setError(err?.response?.data?.error || "Failed to load time entries.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttestations = async () => {
    setAttestationLoading(true);
    try {
      const params = {};
      if (filters.recruiterId) params.recruiter_id = filters.recruiterId;
      if (filters.departmentId) params.department_id = filters.departmentId;
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (attestationFilters.status && attestationFilters.status !== "all") {
        params.status = attestationFilters.status;
      }
      if (attestationFilters.triggerType && attestationFilters.triggerType !== "all") {
        params.trigger_type = attestationFilters.triggerType;
      }
      const data = await timeTracking.listAttestations(params);
      setAttestations(Array.isArray(data?.items) ? data.items : []);
      setAttestationSummary(data?.summary || {});
    } catch (err) {
      setAttestations([]);
      setAttestationSummary({});
      setSnackbar({ open: true, severity: "error", message: err?.response?.data?.error || "Failed to load attestations." });
    } finally {
      setAttestationLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.startDate, filters.endDate, filters.recruiterId, filters.departmentId]);

  useEffect(() => {
    if (activeTab === "attestations") {
      fetchAttestations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters.startDate, filters.endDate, filters.recruiterId, filters.departmentId, attestationFilters.status, attestationFilters.triggerType]);

  useEffect(() => {
    if (!entries.length) {
      if (selectedIds.length) {
        setSelectedIds([]);
      }
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => entries.some((entry) => !isLeaveEntry(entry) && entry.id === id)));
  }, [entries, selectedIds.length]);

  useEffect(() => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const loadDepartments = async () => {
      try {
        const res = await api.get(`/api/departments`, { headers });
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
        const res = await api.get(`/manager/recruiters`, {
          headers,
          params: includeArchived ? { include_archived: 1 } : {},
        });
        const data = res.data;
        const normalize = (arr = []) =>
          arr.map((r) => {
            const role = ["recruiter", "manager"].includes(r.role) ? r.role : "recruiter";
            return { ...r, role };
          });
        if (Array.isArray(data?.recruiters)) {
          setEmployees(normalize(data.recruiters));
        } else if (Array.isArray(data)) {
          setEmployees(normalize(data));
        } else if (recruiters.length) {
          setEmployees(normalize(recruiters));
        }
      } catch {
        if (recruiters.length) {
          setEmployees(recruiters);
        }
      }
    };

    loadDepartments();
    loadEmployees();
  }, [recruiters, includeArchived]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await timeTracking.listTemplates();
        if (Array.isArray(data)) {
          setTemplates(data);
        } else if (Array.isArray(data?.templates)) {
          setTemplates(data.templates);
        }
      } catch {
        setTemplates([]);
      }
    };
    loadTemplates();
  }, []);

  useEffect(() => {
    if (!filters.recruiterId) return;
    const exists = employees.some((emp) => String(emp.id) === String(filters.recruiterId));
    if (!exists) {
      setFilters((prev) => ({ ...prev, recruiterId: "" }));
    }
  }, [employees, filters.recruiterId]);

  useEffect(() => {
    if (detailOpen) {
      loadDetailHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailOpen, detailFilters.startDate, detailFilters.endDate, detailFilters.status]);

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
    if (!filters.departmentId) return employees;
    return employees.filter(
      (emp) => String(emp.department_id || emp.departmentId || "") === String(filters.departmentId)
    );
  }, [employees, filters.departmentId]);

  const formatClock = (iso, tz) => {
    if (!iso) return "—";
    try {
      return DateTime.fromISO(iso, { zone: "utc" })
        .setZone(tz || viewerTimezone)
        .toFormat("MMM d, yyyy, hh:mm:ss a");
    } catch {
      return iso;
    }
  };
  const formatClockShort = (iso, tz) => {
    if (!iso) return "—";
    try {
      return DateTime.fromISO(iso, { zone: "utc" })
        .setZone(tz || viewerTimezone)
        .toFormat("LLL d, HH:mm");
    } catch {
      return iso;
    }
  };
  const formatRosterClock = (iso, tz) => {
    if (!iso) return "—";
    try {
      return DateTime.fromISO(iso, { zone: "utc" })
        .setZone(tz || viewerTimezone)
        .toFormat("hh:mm a");
    } catch {
      return iso;
    }
  };
  const anomalyChips = (entry) => {
    const chips = [];
    if (entry.device_new) {
      chips.push(
        <Chip
          key="device_new"
          size="small"
          label="New device"
          sx={{ bgcolor: alpha(theme.palette.info.light, 0.2), color: theme.palette.text.primary, fontWeight: 600 }}
        />
      );
    }
    if (entry.location_new) {
      chips.push(
        <Chip
          key="location_new"
          size="small"
          label="New location"
          sx={{ bgcolor: alpha(theme.palette.warning.light, 0.24), color: theme.palette.text.primary, fontWeight: 600 }}
        />
      );
    }
    if (entry.multi_ip_same_day) {
      chips.push(
        <Chip
          key="multi_ip"
          size="small"
          label="Multiple IPs"
          sx={{ bgcolor: alpha(theme.palette.primary.light, 0.2), color: theme.palette.text.primary, fontWeight: 600 }}
        />
      );
    }
    if (entry.outside_trusted) {
      chips.push(
        <Chip
          key="outside_trusted"
          size="small"
          label="Outside trusted IPs"
          sx={{ bgcolor: alpha(theme.palette.error.light, 0.2), color: theme.palette.text.primary, fontWeight: 600 }}
        />
      );
    }
    return chips;
  };
  const rosterUpdatedLabel = useMemo(() => {
    if (!rosterUpdatedAt) return null;
    try {
      return DateTime.fromJSDate(rosterUpdatedAt).setZone(viewerTimezone).toFormat("hh:mm:ss a");
    } catch {
      return null;
    }
  }, [rosterUpdatedAt, viewerTimezone]);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await timeTracking.approveEntry(id);
      setSnackbar({
        open: true,
        severity: "success",
        message: "Time entry approved.",
      });
      fetchEntries();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Approve failed.",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Delete this time entry? This cannot be undone.");
    if (!confirm) return;
    setActionId(id);
    try {
      await timeTracking.deleteEntry(id);
      setEntries((prev) => prev.filter((e) => String(e.id) !== String(id)));
      setSnackbar({
        open: true,
        severity: "success",
        message: "Time entry deleted.",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Failed to delete entry.",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleForceClockOut = async (id) => {
    setActionId(id);
    try {
      await timeTracking.forceClockOut(id);
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Clock-out forced.",
      });
      fetchEntries();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Failed to force clock-out.",
      });
    } finally {
      setActionId(null);
    }
  };

  const openHistoryDetail = (entry) => {
    const base = entry.recruiter || {};
    const id = base.id || entry.recruiter_id;
    const first = base.first_name || entry.first_name || "";
    const last = base.last_name || entry.last_name || "";
    const full = base.full_name || `${first} ${last}`.trim();
    const name =
      base.name ||
      full ||
      base.email ||
      entry.recruiter?.email ||
      (id ? `#${id}` : "");
    const email = base.email || entry.recruiter?.email || entry.email;
    setDetailEmployee({
      id,
      name,
      full_name: full,
      first_name: first,
      last_name: last,
      email,
    });
    setDetailOpen(true);
  };

  const handleDetailFilterChange = (key) => (event) => {
    const value = event.target.value;
    setDetailFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadDetailHistory = async () => {
    if (!detailEmployee) return;
    setDetailLoading(true);
    setDetailError("");
    try {
      const data = await timeTracking.managerHistory({
        recruiter_id: detailEmployee.id,
        start_date: detailFilters.startDate,
        end_date: detailFilters.endDate,
        status: detailFilters.status !== "all" ? detailFilters.status : undefined,
      });
      setDetailEntries(Array.isArray(data?.entries) ? data.entries : []);
      setDetailSummary(data?.summary || null);
    } catch (err) {
      setDetailEntries([]);
      setDetailSummary(null);
      setDetailError(err?.response?.data?.error || "Failed to load history.");
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadDetailCsv = () => {
    if (!detailEmployee || !detailEntries.length) {
      setSnackbar({ open: true, severity: "error", message: "Nothing to download." });
      return;
    }

    const csvEscape = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [];
    lines.push("Summary,,,,,,,,,,,");
    lines.push(
      [
        "Employee",
        csvEscape(detailEmployeeName || detailEmployee.email || detailEmployee.id),
        "", "", "", "", "", "", "", "", "",
      ].join(",")
    );
    lines.push(
      [
        "Range",
        `${csvEscape(detailFilters.startDate)} to ${csvEscape(detailFilters.endDate)}`,
        "", "", "", "", "", "", "", "", "",
      ].join(",")
    );
    lines.push(
      ["Hours", csvEscape(detailSummary?.hours_worked ?? 0), "", "", "", "", "", "", "", "", ""].join(",")
    );
    lines.push(
      ["Overtime", csvEscape(detailSummary?.overtime_hours ?? 0), "", "", "", "", "", "", "", "", ""].join(",")
    );
    const padSummary = (label, value) => [label, value, ...Array(12).fill("")].join(",");
    lines.push(padSummary("Break minutes", csvEscape(detailSummary?.break_minutes ?? 0)));
    lines.push(padSummary("Missed breaks", csvEscape(detailSummary?.missed_breaks ?? 0)));
    if (detailStats.breakCompliance !== null) {
      lines.push(padSummary("Break compliance", csvEscape(`${detailStats.breakCompliance}%`)));
    }
    lines.push(padSummary("Anomalies", csvEscape(detailStats.anomalies)));
    lines.push(padSummary("Unusual IPs", csvEscape(detailStats.unusualIPs)));
    if (detailStats.maxBreakMissing > 0) {
      lines.push(padSummary("Max break missing", csvEscape(`${detailStats.maxBreakMissing}m`)));
    }
    lines.push(new Array(18).fill("").join(",")); // blank line before detail rows
    lines.push(
      [
        "Employee",
        "Entry Type",
        "Date",
        "Clock In",
        "Clock Out",
        "Timezone",
        "Hours",
        "Leave Type",
        "Paid Leave",
        "Leave Hours Source",
        "Break minutes",
        "Break required",
        "Break missing",
        "Shift deviation (m)",
        "Status",
        "Device new",
        "New location",
        "Multi IP (day)",
        "Outside trusted",
        "Approved by",
        "Clock-in IP",
        "Clock-out IP",
      ].join(",")
    );

    detailEntries.forEach((entry) => {
      lines.push(
        [
          csvEscape(detailEmployeeName || detailEmployee.email || detailEmployee.id),
          csvEscape(entry.entry_type || "shift"),
          csvEscape(entry.date_label || entry.date),
          csvEscape(formatClockShort(entry.clock_in, entry.timezone)),
          csvEscape(formatClockShort(entry.clock_out, entry.timezone)),
          csvEscape(entry.timezone || ""),
          csvEscape(entry.hours_worked_rounded ?? entry.hours_worked),
          csvEscape(entry.leave_label || ""),
          csvEscape(isLeaveEntry(entry) ? (entry.is_paid_leave ? "yes" : "no") : ""),
          csvEscape(entry.leave_hours_source || ""),
          csvEscape(entry.break_minutes || 0),
          csvEscape(entry.break_required_minutes || 0),
          csvEscape(entry.break_missing_minutes || 0),
          csvEscape(entry.shift_deviation_minutes ?? ""),
          csvEscape(entry.status),
          csvEscape(entry.device_new ? "1" : "0"),
          csvEscape(entry.location_new ? "1" : "0"),
          csvEscape(entry.multi_ip_same_day ? "1" : "0"),
          csvEscape(entry.outside_trusted ? "1" : "0"),
          csvEscape(entry.approved_by_name || ""),
          csvEscape(entry.clock_in_ip || ""),
          csvEscape(entry.clock_out_ip || ""),
        ].join(",")
      );
    });

    try {
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `time_entries_${detailEmployeeName || "employee"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setSnackbar({ open: true, severity: "error", message: "Unable to download CSV." });
    }
  };

  const downloadDetailPdf = async () => {
    if (!detailEmployee || !detailEntries.length) {
      setSnackbar({ open: true, severity: "error", message: "Nothing to download." });
      return;
    }
    const recruiterId =
      detailEmployee.id ||
      detailEmployee.recruiter_id ||
      (detailEntries.length ? detailEntries[0].recruiter_id : null);
    if (!recruiterId) {
      setSnackbar({ open: true, severity: "error", message: "Missing employee id for export." });
      return;
    }
    try {
      const params = new URLSearchParams({
        recruiter_id: recruiterId,
        start_date: detailFilters.startDate,
        end_date: detailFilters.endDate,
        format: "pdf",
      });
      if (detailFilters.status && detailFilters.status !== "all") {
        params.set("status", detailFilters.status);
      }
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
      const res = await api.get(`/manager/time-entries/history?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
      });
      const ct = res.headers?.["content-type"] || "";
      const blob = res.data;
      if (blob.size === 0 || (ct && !ct.includes("pdf"))) {
        setSnackbar({ open: true, severity: "error", message: "PDF export returned an empty file." });
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `time_entries_${detailEmployeeName || "employee"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, severity: "success", message: "PDF downloaded." });
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: "Unable to download PDF." });
    }
  };

  const openRejectDialog = (entryId) => {
    setRejectState({ open: true, entryId, reason: "" });
  };

  const submitReject = async () => {
    if (!rejectState.entryId) return;
    setActionId(rejectState.entryId);
    try {
      await timeTracking.rejectEntry(rejectState.entryId, {
        reason: rejectState.reason || undefined,
      });
      setSnackbar({
        open: true,
        severity: "info",
        message: "Time entry rejected.",
      });
      setRejectState({ open: false, entryId: null, reason: "" });
      fetchEntries();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Reject failed.",
      });
    } finally {
      setActionId(null);
    }
  };
  const resetBulkForm = () =>
    setBulkForm({
      templateId: "",
      breakMinutes: "",
      breakPaid: true,
    });
  const handleBulkFormChange = (field) => (event) => {
    const value = field === "breakPaid" ? event.target.checked : event.target.value;
    setBulkForm((prev) => ({ ...prev, [field]: value }));
  };
  const closeBulkDialog = () => {
    setBulkDialogOpen(false);
    resetBulkForm();
  };
  const submitBulkAdjust = async () => {
    if (!selectedCount) return;
    const payload = {
      shift_ids: selectedIds,
    };
    if (bulkForm.templateId) {
      payload.template_id = Number(bulkForm.templateId);
    }
    if (bulkForm.breakMinutes) {
      payload.break_minutes = Number(bulkForm.breakMinutes);
    }
    if (typeof bulkForm.breakPaid === "boolean") {
      payload.break_paid = bulkForm.breakPaid;
    }

    setBulkSubmitting(true);
    try {
      await timeTracking.bulkAdjustEntries(payload);
      setSnackbar({
        open: true,
        severity: "success",
        message: "Template applied to selected entries.",
      });
      closeBulkDialog();
      setSelectedIds([]);
      fetchEntries();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Bulk update failed.",
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const bulkApproveSelected = async () => {
    if (!selectedApprovableCount) return;
    setBulkSubmitting(true);
    try {
      await Promise.all(selectedApprovableIds.map((id) => timeTracking.approveEntry(id)));
      setSnackbar({
        open: true,
        severity: "success",
        message:
          selectedApprovableCount === selectedCount
            ? "Selected entries approved."
            : `${selectedApprovableCount} selected entr${selectedApprovableCount === 1 ? "y was" : "ies were"} approved.`,
      });
      setSelectedIds([]);
      fetchEntries();
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: err?.response?.data?.error || "Bulk approve failed." });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const bulkRejectSelected = async () => {
    if (!selectedCount) return;
    setBulkSubmitting(true);
    try {
      await Promise.all(selectedIds.map((id) => timeTracking.rejectEntry(id, {})));
      setSnackbar({ open: true, severity: "success", message: "Selected entries rejected." });
      setSelectedIds([]);
      fetchEntries();
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: err?.response?.data?.error || "Bulk reject failed." });
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <>
      <Paper variant="outlined" sx={{ mt: 2, borderRadius: 1, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ px: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          <Tab value="approvals" label="Approvals" />
          <Tab value="insights" label="Time Insights" />
          <Tab value="attestations" label="Attestations" />
        </Tabs>
      </Paper>

      {activeTab === "approvals" ? (
      <>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <SummaryCard label="Clocked in now" value={clockedInCount} />
            <SummaryCard label="On break now" value={onBreakCount} />
            <SummaryCard label="Pending approvals" value={pendingCount} />
            <SummaryCard label="Hours (range)" value={hoursToday.toFixed(2)} />
            <SummaryCard label="PTO / time off" value={`${ptoHoursRange.toFixed(2)}h`} />
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 1 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Time tracking approvals
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review employee punches, approve them for payroll, or send them back with notes.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchEntries}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={filters.status}
                  onChange={handleChange("status")}
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Department"
                  value={filters.departmentId}
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
                  value={filters.recruiterId}
                  onChange={handleChange("recruiterId")}
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
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeArchived}
                      onChange={(e) => setIncludeArchived(e.target.checked)}
                    />
                  }
                  label="Show archived employees"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ThemedDateField
                  fullWidth
                  label="From"
                  value={filters.startDate}
                  onChange={handleChange("startDate")}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ThemedDateField
                  fullWidth
                  label="To"
                  value={filters.endDate}
                  onChange={handleChange("endDate")}
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
            </Grid>

            {selectedCount > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {selectedCount} selected{selectedApprovableCount !== selectedCount ? ` · ${selectedApprovableCount} approvable` : ""}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={bulkApproveSelected}
                    disabled={bulkSubmitting || selectedApprovableCount === 0}
                  >
                    Approve selected
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={bulkRejectSelected}>
                    Reject selected
                  </Button>
                  <Button size="small" variant="contained" onClick={() => setBulkDialogOpen(true)}>
                    Apply template
                  </Button>
                  <Button size="small" onClick={() => setSelectedIds([])}>
                    Clear
                  </Button>
                </Stack>
              </Paper>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mt: 2 }}>
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={28} />
                </Box>
              ) : entries.length === 0 ? (
                <Typography color="text.secondary">No time entries found for this filter.</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, borderRadius: 1 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={selectedCount > 0 && selectedCount < selectableEntries.length}
                            checked={selectableEntries.length > 0 && selectedCount === selectableEntries.length}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell>Employee</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Clocked</TableCell>
                        <TableCell>Hours</TableCell>
                        <TableCell>Anomalies</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                    {entries.map((entry) => {
                      const entryIsLeave = isLeaveEntry(entry);
                      const leaveMeta = entryIsLeave ? getLeaveReviewVisibility(entry) : null;
                      const liveRosterState = rosterByEntryId[String(entry.id)] || null;
                      const breakInProgress = Boolean(liveRosterState?.break_in_progress);
                      const breakElapsedLabel = Number.isFinite(liveRosterState?.break_elapsed_minutes)
                        ? `${liveRosterState.break_elapsed_minutes}m`
                        : null;
                      const r =
                        entry.recruiter ||
                        recruiterMap[entry.recruiter_id] ||
                        {};
                      const name =
                        r.name ||
                        r.full_name ||
                        `${(r.first_name || "").trim()} ${(r.last_name || "").trim()}`.trim() ||
                        entry.recruiter?.name ||
                        entry.recruiter?.full_name ||
                        entry.recruiter?.email ||
                        `#${entry.recruiter_id}`;
                      const email = r.email || entry.recruiter?.email;
                      const avatarSrc = r.profile_image_url || r.avatar || undefined;
                      const avatarAlt = name || email || "Employee";
                      const breakChips = (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.5} useFlexGap>
                          {entry.break_schedule_label && (
                            <Chip
                              size="small"
                              variant="outlined"
                              color="info"
                              label={`Scheduled ${entry.break_schedule_label}`}
                            />
                          )}
                          {entry.break_plan_max_simultaneous && (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`Max ${entry.break_plan_max_simultaneous} on break`}
                            />
                          )}
                          {entry.break_non_compliant ? (
                            <Chip
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.error.light, 0.16),
                                color: theme.palette.text.primary,
                                fontWeight: 600,
                              }}
                              label={`Break missing ${entry.break_missing_minutes}m`}
                            />
                          ) : entry.break_taken_minutes ? (
                            <Chip
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.success.light, 0.18),
                                color: theme.palette.text.primary,
                                fontWeight: 600,
                              }}
                              label={`Break ${entry.break_taken_minutes}m`}
                            />
                          ) : null}
                          {entry.break_auto_enforced && (
                            <Tooltip title={entry.break_auto_reason || "Break auto-enforced"}>
                              <Chip
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.warning.light, 0.2),
                                  color: theme.palette.text.primary,
                                  fontWeight: 600,
                                }}
                                label={
                                  entry.break_auto_reason
                                    ? `Auto break · ${entry.break_auto_reason}`
                                    : "Auto break enforced"
                                }
                              />
                            </Tooltip>
                          )}
                        </Stack>
                      );
                      return (
                        <TableRow key={entry.id} hover selected={selectedIds.includes(entry.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              disabled={entryIsLeave}
                              checked={selectedIds.includes(entry.id)}
                              onChange={handleSelectOne(entry.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => {
                                openHistoryDetail({
                                  ...entry.recruiter,
                                  id: entry.recruiter_id,
                                });
                              }}
                              sx={{ p: 0, textTransform: "none" }}
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar
                                  src={avatarSrc}
                                  alt={avatarAlt}
                                  sx={{ width: 36, height: 36 }}
                                >
                                  {(name || avatarAlt || "E").charAt(0)}
                                </Avatar>
                                <Box textAlign="left">
                                  <Typography fontWeight={600}>
                                    {name}
                                  </Typography>
                                  {email && (
                                    <Typography variant="caption" color="text.secondary">
                                      {email}
                                    </Typography>
                                  )}
                                </Box>
                              </Stack>
                            </Button>
                          </TableCell>
                          <TableCell>{entry.date_label || entry.date}</TableCell>
                          <TableCell>
                            {entryIsLeave ? (
                              <Stack spacing={0.5}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                  <Chip
                                    size="small"
                                    label={leaveMeta.payShortLabel}
                                    sx={{
                                      bgcolor: alpha(leaveMeta.isPaid ? theme.palette.success.main : theme.palette.warning.main, 0.16),
                                      color: theme.palette.text.primary,
                                      fontWeight: 700,
                                    }}
                                  />
                                  <Chip
                                    size="small"
                                    color={leaveMeta.payrollColor}
                                    variant="outlined"
                                    label={leaveMeta.payrollLabel}
                                  />
                                  {leaveMeta.estimated && (
                                    <Tooltip title="Leave hours are estimated and should be manager-confirmed before finalized payroll use.">
                                      <Chip size="small" color="warning" variant="outlined" label="Estimated" />
                                    </Tooltip>
                                  )}
                                  {leaveMeta.hasWorkedOverlap && (
                                    <Tooltip title="Approved leave overlaps worked time. Resolve before finalizing payroll.">
                                      <Chip size="small" color="error" variant="outlined" label="Overlap warning" />
                                    </Tooltip>
                                  )}
                                  <Typography variant="body2">{entry.leave_label || "Time off"}</Typography>
                                </Stack>
                                {entry.reason && (
                                  <Typography variant="caption" color="text.secondary">
                                    {entry.reason}
                                  </Typography>
                                )}
                              </Stack>
                            ) : (
                              <Stack spacing={0.5}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                  <Chip size="small" variant="outlined" label="In" />
                                  <Typography variant="body2">{formatClock(entry.clock_in, entry.timezone)}</Typography>
                                  {entry.clock_in_ip && (
                                    <Tooltip title={entry.clock_in_device_hint || "Clock-in device"}>
                                      <Chip
                                        label={entry.clock_in_ip}
                                        color={entry.clock_in_unusual ? "error" : "default"}
                                        size="small"
                                        variant={entry.clock_in_unusual ? "filled" : "outlined"}
                                      />
                                    </Tooltip>
                                  )}
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                  <Chip size="small" variant="outlined" label="Out" />
                                  <Typography variant="body2">{formatClock(entry.clock_out, entry.timezone)}</Typography>
                                  {entry.clock_out_ip && (
                                    <Tooltip title={entry.clock_out_device_hint || "Clock-out device"}>
                                      <Chip
                                        label={entry.clock_out_ip}
                                        color={entry.clock_out_unusual ? "error" : "default"}
                                        size="small"
                                        variant={entry.clock_out_unusual ? "filled" : "outlined"}
                                      />
                                    </Tooltip>
                                  )}
                                </Stack>
                              </Stack>
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography>{entry.hours_worked_rounded ?? entry.hours_worked}h</Typography>
                              {entryIsLeave ? (
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={leaveMeta.isPaid ? "Paid leave hours" : "Unpaid time-off hours"}
                                    sx={{ width: "fit-content" }}
                                  />
                                  {leaveMeta.hoursSource && (
                                    <Chip
                                      size="small"
                                      variant="outlined"
                                      label={`Source: ${String(leaveMeta.hoursSource).replace(/_/g, " ")}`}
                                      sx={{ width: "fit-content" }}
                                    />
                                  )}
                                  {leaveMeta.estimated && (
                                    <Tooltip title="No override hours or linked shift duration was available, so this uses the report estimate.">
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        color="warning"
                                        label="Estimated"
                                        sx={{ width: "fit-content" }}
                                      />
                                    </Tooltip>
                                  )}
                                  {leaveMeta.warnings.map((warning, idx) => (
                                    <Tooltip key={`${warning.code || warning.reason_code || "warning"}-${idx}`} title={warning.message || ""}>
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        color={leaveMeta.hasWorkedOverlap ? "error" : "warning"}
                                        label={formatLeaveWarningReason(warning.code || warning.reason_code)}
                                        sx={{ width: "fit-content" }}
                                      />
                                    </Tooltip>
                                  ))}
                                </Stack>
                              ) : breakChips}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {entryIsLeave ? (
                                <Typography variant="body2" color="text.secondary">—</Typography>
                              ) : anomalyChips(entry)}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              <Chip
                                label={entryIsLeave ? leaveMeta.payrollLabel : entry.status}
                                size="small"
                                color={entryIsLeave ? leaveMeta.payrollColor : statusColor[entry.status] || "default"}
                                variant="outlined"
                              />
                              {!entryIsLeave && breakInProgress && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  label={breakElapsedLabel ? `On break · ${breakElapsedLabel}` : "On break"}
                                />
                              )}
                              {!entryIsLeave && entry.attestation_summary?.badge_label && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  color={
                                    entry.attestation_summary?.badge_status === "pending"
                                      ? "warning"
                                      : entry.attestation_summary?.badge_status === "submitted"
                                      ? "info"
                                      : "success"
                                  }
                                  label={getAttestationBadgeLabel(entry.attestation_summary?.badge_status, entry.attestation_summary?.badge_label)}
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              aria-label="Row actions"
                              disabled={entryIsLeave}
                              onClick={(e) => {
                                setRowMenuAnchor(e.currentTarget);
                                setRowMenuEntry(entry);
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={() => {
          setRowMenuAnchor(null);
          setRowMenuEntry(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (rowMenuEntry?.id) openHistoryDetail({ ...rowMenuEntry.recruiter, id: rowMenuEntry.recruiter_id });
            setRowMenuAnchor(null);
            setRowMenuEntry(null);
          }}
        >
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          View history
        </MenuItem>
        <MenuItem
          disabled={!rowMenuEntry || !isEntryApprovable(rowMenuEntry)}
          onClick={() => {
            if (rowMenuEntry?.id) handleApprove(rowMenuEntry.id);
            setRowMenuAnchor(null);
            setRowMenuEntry(null);
          }}
        >
          <ListItemIcon>
            <CheckCircleOutlineIcon fontSize="small" />
          </ListItemIcon>
          Approve
        </MenuItem>
        <MenuItem
          disabled={!rowMenuEntry || rowMenuEntry.is_locked}
          onClick={() => {
            if (rowMenuEntry?.id) openRejectDialog(rowMenuEntry.id);
            setRowMenuAnchor(null);
            setRowMenuEntry(null);
          }}
        >
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          Reject
        </MenuItem>
        {rowMenuEntry?.status === "in_progress" && (
          <MenuItem
            disabled={rowMenuEntry.is_locked}
            onClick={() => {
              if (rowMenuEntry?.id) handleForceClockOut(rowMenuEntry.id);
              setRowMenuAnchor(null);
              setRowMenuEntry(null);
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Force clock-out
          </MenuItem>
        )}
        <MenuItem
          disabled={!rowMenuEntry || rowMenuEntry.is_locked}
          onClick={() => {
            if (rowMenuEntry?.id) handleDelete(rowMenuEntry.id);
            setRowMenuAnchor(null);
            setRowMenuEntry(null);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={rejectState.open}
        onClose={() => setRejectState({ open: false, entryId: null, reason: "" })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Reject time entry</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason (optional)"
            fullWidth
            multiline
            minRows={2}
            value={rejectState.reason}
            onChange={(e) => setRejectState((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Let the employee know what to fix."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectState({ open: false, entryId: null, reason: "" })}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={submitReject}
            disabled={!rejectState.entryId}
          >
            Reject entry
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDialogOpen} onClose={closeBulkDialog} fullWidth maxWidth="sm">
        <DialogTitle>Apply break template</DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ mb: 2 }}>
            Use a saved shift template or override break minutes for the {selectedCount} selected{" "}
            {selectedCount === 1 ? "entry" : "entries"}. Existing approvals stay in place.
          </DialogContentText>
          <TextField
            select
            fullWidth
            label="Shift template"
            value={bulkForm.templateId}
            onChange={handleBulkFormChange("templateId")}
            helperText="Optional — pulls break window + paid/unpaid from the template."
            margin="normal"
          >
            <MenuItem value="">No template</MenuItem>
            {templateOptions.map((tpl) => (
              <MenuItem key={tpl.id} value={tpl.id}>
                {tpl.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Break minutes override"
            type="number"
            value={bulkForm.breakMinutes}
            onChange={handleBulkFormChange("breakMinutes")}
            helperText="Leave blank to keep the template default. Example: 30"
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(bulkForm.breakPaid)}
                onChange={handleBulkFormChange("breakPaid")}
              />
            }
            label="Break is paid"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBulkDialog}>Cancel</Button>
          <Button
            variant="contained"
            disabled={bulkSubmitting || !selectedCount}
            onClick={submitBulkAdjust}
          >
            {bulkSubmitting ? "Applying..." : "Apply"}
          </Button>
        </DialogActions>
      </Dialog>

      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 3,
          borderRadius: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          background: (theme) => theme.palette.background.paper,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              Live roster
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Who’s clocked in right now
            </Typography>
            {rosterUpdatedLabel && (
              <Typography variant="caption" color="text.secondary">
                Updated {rosterUpdatedLabel}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={`${rosterStats.active} active`}
              sx={readableRosterChipSx}
            />
            <Chip
              size="small"
              color={rosterStats.onBreak ? "warning" : "default"}
              variant="outlined"
              label={`${rosterStats.onBreak} on break`}
              sx={readableRosterChipSx}
            />
            <Tooltip title={rosterCollapsed ? "Expand roster" : "Collapse roster"}>
              <IconButton size="small" onClick={() => setRosterCollapsed((prev) => !prev)}>
                {rosterCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh roster">
              <span>
                <IconButton size="small" onClick={fetchEntries} disabled={loading}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
        <Collapse in={!rosterCollapsed} timeout="auto" unmountOnExit>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={24} />
            </Box>
          ) : roster.length ? (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {roster.map((active) => (
                <Grid item xs={12} sm={6} md={4} key={active.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      height: "100%",
                      borderColor: (theme) =>
                        active.break_in_progress
                          ? theme.palette.warning.light
                          : theme.palette.divider,
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.5 }}>
                      <Avatar
                        src={active.profile_image_url || active.avatar || undefined}
                        alt={active.employee_name || "Employee"}
                        sx={{ width: 40, height: 40 }}
                      >
                        {(active.employee_name || "E").charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600}>{active.employee_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Clocked in {formatRosterClock(active.clock_in, active.timezone)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        color={statusColor[active.status] || "default"}
                        label={active.status}
                        sx={readableRosterChipSx}
                      />
                      {(() => {
                        if (active.break_in_progress) {
                          const elapsed = Number.isFinite(active.break_elapsed_minutes)
                            ? `${active.break_elapsed_minutes}m`
                            : null;
                          const required = Number.isFinite(active.break_required_minutes)
                            ? `${active.break_required_minutes}m`
                            : null;
                          const overage =
                            Number.isFinite(active.break_elapsed_minutes) &&
                            Number.isFinite(active.break_required_minutes) &&
                            active.break_elapsed_minutes > active.break_required_minutes;

                          const label = overage
                            ? `On break · ${active.break_elapsed_minutes}m (over)`
                            : required && elapsed
                            ? `On break · ${elapsed} / ${required}`
                            : elapsed
                            ? `On break · ${elapsed}`
                            : "On break";

                          return (
                            <Chip
                              size="small"
                              color={overage ? "error" : "warning"}
                              label={label}
                              variant={overage ? "filled" : "outlined"}
                              sx={overage ? { fontWeight: 700 } : readableRosterChipSx}
                            />
                          );
                        }
                        return <Chip size="small" variant="outlined" label="On shift" sx={readableRosterChipSx} />;
                      })()}
                      {active.break_slot?.start && active.break_slot?.end && (
                        <Chip
                          size="small"
                          variant="outlined"
                          color="info"
                          label={`Slot ${active.break_slot.start}–${active.break_slot.end}`}
                          sx={readableRosterChipSx}
                        />
                      )}
                      {active.timezone && (
                        <Chip size="small" variant="outlined" label={active.timezone} sx={readableRosterChipSx} />
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No one is clocked in right now.
            </Typography>
          )}
        </Collapse>
      </Paper>
      </>
      ) : (
      activeTab === "insights" ? (
        <TimeInsightsPanel
          entries={entries}
          roster={roster}
          filters={filters}
          handleChange={handleChange}
          handleDepartmentChange={handleDepartmentChange}
          applyDatePreset={applyDatePreset}
          fetchEntries={fetchEntries}
          loading={loading}
          statusOptions={statusOptions}
          departmentOptions={departmentOptions}
          visibleEmployees={visibleEmployees}
          includeArchived={includeArchived}
          setIncludeArchived={setIncludeArchived}
          recruiterMap={recruiterMap}
        />
      ) : (
        <AttestationsPanel
          filters={filters}
          attestationFilters={attestationFilters}
          setAttestationFilters={setAttestationFilters}
          handleChange={handleChange}
          handleDepartmentChange={handleDepartmentChange}
          applyDatePreset={applyDatePreset}
          fetchAttestations={fetchAttestations}
          loading={attestationLoading}
          departmentOptions={departmentOptions}
          visibleEmployees={visibleEmployees}
          includeArchived={includeArchived}
          setIncludeArchived={setIncludeArchived}
          recruiterMap={recruiterMap}
          items={attestations}
          summary={attestationSummary}
          setSnackbar={setSnackbar}
        />
      )
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          {detailEmployeeName ? `Time history · ${detailEmployeeName}` : "Time history"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <ThemedDateField
                label="From"
                fullWidth
                value={detailFilters.startDate}
                onChange={handleDetailFilterChange("startDate")}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <ThemedDateField
                label="To"
                fullWidth
                value={detailFilters.endDate}
                onChange={handleDetailFilterChange("endDate")}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Status"
                fullWidth
                value={detailFilters.status}
                onChange={handleDetailFilterChange("status")}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="in_progress">In progress</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button size="small" variant="outlined" onClick={() => applyDetailDatePreset("today")}>
                  Today
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyDetailDatePreset("this_week")}>
                  This week
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyDetailDatePreset("last_week")}>
                  Last week
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Hours: ${detailSummary?.hours_worked ?? 0}`}
              variant="outlined"
              color="primary"
            />
            <Chip
              label={`Overtime: ${detailSummary?.overtime_hours ?? 0}`}
              variant="outlined"
              color={detailSummary?.overtime_hours ? "warning" : "default"}
            />
            <Chip
              label={`Break minutes: ${detailSummary?.break_minutes ?? 0}`}
              variant="outlined"
            />
            <Chip
              label={`Missed breaks: ${detailSummary?.missed_breaks ?? 0}`}
              variant="outlined"
              color={detailSummary?.missed_breaks ? "error" : "default"}
            />
            {detailStats.breakCompliance !== null && (
              <Chip
                label={`Break compliance: ${detailStats.breakCompliance}%`}
                color={detailStats.breakCompliance < 90 ? "warning" : "success"}
                variant="outlined"
              />
            )}
            <Chip
              label={`Anomalies: ${detailStats.anomalies}`}
              color={detailStats.anomalies ? "error" : "default"}
              variant={detailStats.anomalies ? "filled" : "outlined"}
            />
            {detailStats.unusualIPs > 0 && (
              <Chip
                label={`Unusual IPs: ${detailStats.unusualIPs}`}
                color="warning"
                variant="outlined"
              />
            )}
            {detailStats.maxBreakMissing > 0 && (
              <Chip
                label={`Max break missing: ${detailStats.maxBreakMissing}m`}
                color="error"
                variant="outlined"
              />
            )}
          </Stack>

          {detailError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {detailError}
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            {detailLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} />
              </Box>
            ) : detailEntries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No entries for this range.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Clocked</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Deviation</TableCell>
                    <TableCell>Breaks</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailEntries.map((entry) => {
                    const entryIsLeave = isLeaveEntry(entry);
                    const leaveMeta = entryIsLeave ? getLeaveReviewVisibility(entry) : null;
                    return (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date_label || entry.date}</TableCell>
                      <TableCell>
                        {entryIsLeave ? (
                          <>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              <Chip size="small" variant="outlined" color={leaveMeta.isPaid ? "success" : "warning"} label={leaveMeta.payShortLabel} />
                              <Chip size="small" variant="outlined" color={leaveMeta.payrollColor} label={leaveMeta.payrollLabel} />
                              {leaveMeta.estimated && <Chip size="small" variant="outlined" color="warning" label="Estimated" />}
                              {leaveMeta.hasWorkedOverlap && <Chip size="small" variant="outlined" color="error" label="Overlap warning" />}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {entry.leave_label || "Time off"}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography variant="body2">
                              In: {formatClockShort(entry.clock_in, entry.timezone)}
                            </Typography>
                            <Typography variant="body2">
                              Out: {formatClockShort(entry.clock_out, entry.timezone)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {entry.clock_in_ip ? `IP: ${entry.clock_in_ip}` : ""}
                            </Typography>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{entry.hours_worked_rounded ?? entry.hours_worked}h</Typography>
                        {entryIsLeave && leaveMeta.estimated && (
                          <Chip size="small" variant="outlined" color="warning" label="Estimated" sx={{ mt: 0.5 }} />
                        )}
                        {entryIsLeave && leaveMeta.hoursSource && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Source: {String(leaveMeta.hoursSource).replace(/_/g, " ")}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {!entryIsLeave && entry.shift_deviation_minutes !== null && entry.shift_deviation_minutes !== undefined ? (
                          <Chip
                            size="small"
                            label={`${entry.shift_deviation_minutes}m`}
                            color={
                              entry.shift_deviation_minutes > 0
                                ? "success"
                                : entry.shift_deviation_minutes < 0
                                ? "warning"
                                : "default"
                            }
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {entryIsLeave ? (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        ) : (
                          <>
                            <Chip
                              size="small"
                              label={`${entry.break_minutes || 0}m`}
                              color={entry.break_non_compliant ? "error" : "default"}
                              variant={entry.break_non_compliant ? "filled" : "outlined"}
                            />
                            {entry.break_missing_minutes > 0 && (
                              <Typography variant="caption" color="error.main" sx={{ display: "block" }}>
                                Missing {entry.break_missing_minutes}m
                              </Typography>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            label={entryIsLeave ? leaveMeta.payrollLabel : entry.status}
                            color={entryIsLeave ? leaveMeta.payrollColor : "default"}
                            variant="outlined"
                          />
                          {!entryIsLeave && entry.attestation_summary?.badge_label && (
                            <Chip
                              size="small"
                              variant="outlined"
                              color={
                                entry.attestation_summary?.badge_status === "pending"
                                  ? "warning"
                                  : entry.attestation_summary?.badge_status === "submitted"
                                  ? "info"
                                  : "success"
                              }
                              label={getAttestationBadgeLabel(entry.attestation_summary?.badge_status, entry.attestation_summary?.badge_label)}
                            />
                          )}
                        </Stack>
                        {entry.approved_by_name && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            By {entry.approved_by_name}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                          {entryIsLeave
                            ? leaveMeta.warnings.map((warning, idx) => (
                                <Chip
                                  key={`${warning.code || warning.reason_code || "warning"}-${idx}`}
                                  size="small"
                                  variant="outlined"
                                  color={leaveMeta.hasWorkedOverlap ? "error" : "warning"}
                                  label={formatLeaveWarningReason(warning.code || warning.reason_code)}
                                />
                              ))
                            : anomalyChips(entry)}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={downloadDetailCsv} disabled={!detailEntries.length}>
            Download CSV
          </Button>
          <Button onClick={downloadDetailPdf} disabled={!detailEntries.length}>
            Download PDF
          </Button>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TimeEntriesPanel;
