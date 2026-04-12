import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SectionCard from "../../components/ui/SectionCard";
import api from "../../utils/api";

const fmtHours = (value) => `${Number(value || 0).toFixed(1)} h`;

const readableReason = (code) =>
  String(code || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const safeArray = (value) => (Array.isArray(value) ? value : []);

const kpiCardSx = {
  height: "100%",
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))",
  boxShadow: "0 12px 34px rgba(15, 23, 42, 0.06)",
};

const palette = {
  pending: "#f59e0b",
  approved: "#2563eb",
  payrollReady: "#16a34a",
  previewOnly: "#7c3aed",
  unpaid: "#64748b",
  blocked: "#dc2626",
  cancelled: "#475569",
};

const readableChipSx = (tone = "default") => {
  const tones = {
    warning: { bgcolor: "#ffedd5", color: "#7c2d12", borderColor: "#fdba74" },
    success: { bgcolor: "#dcfce7", color: "#14532d", borderColor: "#86efac" },
    info: { bgcolor: "#dbeafe", color: "#1e3a8a", borderColor: "#93c5fd" },
    purple: { bgcolor: "#ede9fe", color: "#4c1d95", borderColor: "#c4b5fd" },
    danger: { bgcolor: "#fee2e2", color: "#7f1d1d", borderColor: "#fca5a5" },
    muted: { bgcolor: "#f1f5f9", color: "#0f172a", borderColor: "#cbd5e1" },
    default: { bgcolor: "#f8fafc", color: "#0f172a", borderColor: "#cbd5e1" },
  };
  return {
    ...(tones[tone] || tones.default),
    border: "1px solid",
    fontWeight: 850,
    "& .MuiChip-label": {
      color: "inherit",
    },
  };
};

const KpiCard = ({ label, value, help, tone = "default" }) => {
  const toneColor = {
    warning: palette.pending,
    success: palette.payrollReady,
    info: palette.approved,
    purple: palette.previewOnly,
    danger: palette.blocked,
    muted: palette.cancelled,
    default: "#0f172a",
  }[tone];

  return (
    <Card variant="outlined" sx={kpiCardSx}>
      <CardContent>
        <Stack spacing={0.75}>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", letterSpacing: 1.2, fontWeight: 800 }}
          >
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={850} sx={{ color: toneColor }}>
            {value}
          </Typography>
          {help && (
            <Typography variant="caption" color="text.secondary">
              {help}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ children }) => (
  <Box
    sx={{
      border: "1px dashed",
      borderColor: "divider",
      borderRadius: 2,
      p: 2,
      bgcolor: "rgba(15, 23, 42, 0.02)",
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  </Box>
);

const StackedBar = ({ segments, total, height = 12 }) => {
  const safeTotal = Math.max(Number(total || 0), 0.0001);
  return (
    <Stack direction="row" sx={{ width: "100%", height, borderRadius: 999, overflow: "hidden", bgcolor: "grey.100" }}>
      {segments
        .filter((segment) => Number(segment.value || 0) > 0)
        .map((segment) => (
          <Box
            key={segment.key}
            sx={{
              width: `${Math.max((Number(segment.value || 0) / safeTotal) * 100, 2)}%`,
              bgcolor: segment.color,
            }}
          />
        ))}
    </Stack>
  );
};

const DonutChart = ({ items }) => {
  const visible = items.filter((item) => Number(item.value || 0) > 0);
  const total = visible.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total <= 0) {
    return <EmptyState>No readiness mix to chart in this range.</EmptyState>;
  }

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
      <Box sx={{ position: "relative", width: 132, height: 132, flex: "0 0 auto" }}>
        <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label="Readiness breakdown chart">
          <circle cx="66" cy="66" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="18" />
          {visible.map((item) => {
            const length = (Number(item.value || 0) / total) * circumference;
            const circle = (
              <circle
                key={item.key}
                cx="66"
                cy="66"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 66 66)"
              />
            );
            offset += length;
            return circle;
          })}
        </svg>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <Typography variant="h5" fontWeight={850}>{total}</Typography>
          <Typography variant="caption" color="text.secondary">records</Typography>
        </Box>
      </Box>
      <Stack spacing={1} sx={{ width: "100%" }}>
        {visible.map((item) => (
          <Stack key={item.key} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: 999, bgcolor: item.color }} />
              <Typography variant="body2">{item.label}</Typography>
            </Stack>
            <Typography variant="body2" fontWeight={800}>{item.value}</Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

const TrendChart = ({ rows }) => {
  const data = safeArray(rows).slice(-14);
  const maxValue = Math.max(
    1,
    ...data.map(
      (row) =>
        Number(row.pending || 0) +
        Number(row.approved || 0) +
        Number(row.payroll_ready || 0) +
        Number(row.preview_only || 0) +
        Number(row.cancelled || 0)
    )
  );

  if (!data.length) return <EmptyState>No leave readiness trend data in this range.</EmptyState>;

  return (
    <Box sx={{ overflowX: "auto", pb: 1 }}>
      <Stack direction="row" spacing={1.25} alignItems="flex-end" sx={{ minWidth: Math.max(data.length * 70, 420), height: 230 }}>
        {data.map((row) => {
          const total =
            Number(row.pending || 0) +
            Number(row.approved || 0) +
            Number(row.payroll_ready || 0) +
            Number(row.preview_only || 0) +
            Number(row.cancelled || 0);
          const height = Math.max((total / maxValue) * 150, total ? 12 : 4);
          const segments = [
            { key: "pending", value: row.pending, color: palette.pending },
            { key: "approved", value: row.approved, color: palette.approved },
            { key: "ready", value: row.payroll_ready, color: palette.payrollReady },
            { key: "preview", value: row.preview_only, color: palette.previewOnly },
            { key: "cancelled", value: row.cancelled, color: palette.cancelled },
          ];
          return (
            <Stack key={row.bucket} spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 58 }}>
              <Box
                sx={{
                  height,
                  width: "100%",
                  minWidth: 28,
                  borderRadius: 1.5,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column-reverse",
                  bgcolor: "grey.100",
                  border: "1px solid",
                  borderColor: "divider",
                }}
                title={`${row.bucket}: ${total} leave records`}
              >
                {segments
                  .filter((segment) => Number(segment.value || 0) > 0)
                  .map((segment) => (
                    <Box
                      key={segment.key}
                      sx={{
                        height: `${Math.max((Number(segment.value || 0) / Math.max(total, 1)) * 100, 6)}%`,
                        bgcolor: segment.color,
                      }}
                    />
                  ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
                {row.bucket}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        <Chip size="small" label="Pending" sx={readableChipSx("warning")} />
        <Chip size="small" label="Approved" sx={readableChipSx("info")} />
        <Chip size="small" label="Payroll-ready" sx={readableChipSx("success")} />
        <Chip size="small" label="Preview-only" sx={readableChipSx("purple")} />
        <Chip size="small" label="Cancelled" sx={readableChipSx("muted")} />
      </Stack>
    </Box>
  );
};

const DepartmentChart = ({ rows }) => {
  const data = safeArray(rows).slice(0, 10);
  const maxHours = Math.max(
    1,
    ...data.map((row) => Number(row.paid_leave_hours || 0) + Number(row.unpaid_leave_hours || 0))
  );

  if (!data.length) return <EmptyState>No department leave data in this range.</EmptyState>;

  return (
    <Stack spacing={1.6}>
      {data.map((row, idx) => {
        const paid = Number(row.paid_leave_hours || 0);
        const unpaid = Number(row.unpaid_leave_hours || 0);
        const total = paid + unpaid;
        return (
          <Box key={`${row.department_id ?? "unassigned"}-${idx}`}>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Typography variant="subtitle2" fontWeight={800} noWrap>
                {row.department_name || "Unassigned"}
              </Typography>
              <Typography variant="subtitle2" fontWeight={800}>{fmtHours(total)}</Typography>
            </Stack>
            <Box sx={{ mt: 0.75, width: `${Math.max((total / maxHours) * 100, total ? 8 : 2)}%`, minWidth: total ? 80 : 0 }}>
              <StackedBar
                total={Math.max(total, 1)}
                segments={[
                  { key: "paid", value: paid, color: palette.payrollReady },
                  { key: "unpaid", value: unpaid, color: palette.unpaid },
                ]}
                height={14}
              />
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
              <Chip size="small" label={`Pending ${row.pending || 0}`} sx={readableChipSx("warning")} />
              <Chip size="small" label={`Ready ${row.payroll_ready || 0}`} sx={readableChipSx("success")} />
              <Chip size="small" label={`Blocked ${row.blocked || 0}`} sx={readableChipSx(row.blocked ? "danger" : "muted")} />
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
};

const AttentionList = ({ rows }) => {
  const data = safeArray(rows).slice(0, 10);
  if (!data.length) return <EmptyState>No employee attention items in this range.</EmptyState>;

  return (
    <Grid container spacing={1.5}>
      {data.map((row) => {
        const reasons = safeArray(row.attention_reasons);
        const blocked = reasons.includes("finalization_blocker") || Number(row.blocked || 0) > 0;
        return (
          <Grid item xs={12} md={6} key={`${row.recruiter_id}-${row.employee}`}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: blocked ? "error.light" : "divider",
                bgcolor: blocked ? "rgba(220, 38, 38, 0.04)" : "background.paper",
              }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2" fontWeight={850}>{row.employee || "Unknown employee"}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.department_name || "Unassigned"}</Typography>
                </Box>
                <Typography variant="subtitle2" fontWeight={850}>
                  {fmtHours(Number(row.paid_leave_hours || 0) + Number(row.unpaid_leave_hours || 0))}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {reasons.map((reason) => (
                  <Chip
                    key={reason}
                    size="small"
                    label={readableReason(reason)}
                    sx={readableChipSx(
                      reason === "finalization_blocker"
                        ? "danger"
                        : reason === "pending_review"
                        ? "warning"
                        : "default"
                    )}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
};

const SettingsLeaveInsights = () => {
  const [from, setFrom] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [group, setGroup] = useState("day");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [directoryError, setDirectoryError] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredEmployees = useMemo(() => {
    return (departmentId
      ? employees.filter((row) => String(row.department_id || "") === String(departmentId))
      : employees
    ).map((row) => ({
      ...row,
      name:
        row.name ||
        [row.first_name, row.last_name].filter(Boolean).join(" ") ||
        row.email ||
        `Employee #${row.id}`,
    }));
  }, [departmentId, employees]);

  const fetchDirectory = async () => {
    setDirectoryError("");
    try {
      const [rec, dept] = await Promise.all([
        api.get("/manager/recruiters"),
        api.get("/api/departments"),
      ]);
      setEmployees(safeArray(rec?.data?.recruiters));
      setDepartments(Array.isArray(dept?.data) ? dept.data : []);
    } catch (err) {
      setDirectoryError(
        err?.response?.data?.error ||
          err?.displayMessage ||
          "Failed to load departments and employees for leave filters."
      );
      setEmployees([]);
      setDepartments([]);
    }
  };

  const fetchInsights = async () => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to, tz: timezone, group });
      if (departmentId) params.set("department_id", departmentId);
      if (employeeId) params.set("recruiter_id", employeeId);
      const response = await api.get(`/api/manager/analytics/workforce?${params.toString()}`);
      setData(response?.data || null);
    } catch (err) {
      setData(null);
      setError(
        err?.response?.data?.error ||
          err?.displayMessage ||
          "Failed to load leave insights."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (preset) => {
    const today = dayjs();
    if (preset === "TODAY") {
      setFrom(today.format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("day");
    } else if (preset === "WTD") {
      setFrom(today.startOf("week").format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("day");
    } else if (preset === "MTD") {
      setFrom(today.startOf("month").format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("day");
    } else if (preset === "QTD") {
      const quarterStartMonth = Math.floor(today.month() / 3) * 3;
      setFrom(today.month(quarterStartMonth).startOf("month").format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("week");
    } else if (preset === "YTD") {
      setFrom(today.startOf("year").format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("month");
    }
  };

  const leaveReadiness = data?.leave_readiness || {};
  const summary = leaveReadiness?.summary || {};
  const trend = safeArray(leaveReadiness?.trend);
  const departmentsBreakdown = safeArray(leaveReadiness?.department_breakdown);
  const attention = safeArray(leaveReadiness?.employee_attention);
  const blockers = safeArray(leaveReadiness?.blockers);

  const readinessItems = [
    { key: "pending", label: "Pending", value: summary.pending_leave_requests || 0, color: palette.pending },
    { key: "approved", label: "Approved", value: summary.approved_leave_requests || 0, color: palette.approved },
    { key: "ready", label: "Payroll-ready", value: summary.payroll_ready_leave_requests || 0, color: palette.payrollReady },
    { key: "preview", label: "Preview-only / estimated", value: summary.preview_only_estimated_leave_requests || 0, color: palette.previewOnly },
    { key: "blocked", label: "Blockers", value: summary.leave_blockers_count || 0, color: palette.blocked },
    { key: "cancelled", label: "Cancelled", value: summary.cancelled_leave_count || 0, color: palette.cancelled },
  ];

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h5" fontWeight={900}>Leave Insights</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Visual view of leave readiness, payroll-prep signals, blockers, and team attention areas.
        </Typography>
      </Box>

      <SectionCard
        title="Insight filters"
        description="Use the same workforce analytics window and team filters for leave readiness reporting."
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField label="From" type="date" fullWidth value={from} onChange={(e) => setFrom(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="To" type="date" fullWidth value={to} onChange={(e) => setTo(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField select label="Group by" fullWidth value={group} onChange={(e) => setGroup(e.target.value)}>
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
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
              {departments.map((department) => (
                <MenuItem key={department.id} value={String(department.id)}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select label="Employee" fullWidth value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <MenuItem value="">All employees</MenuItem>
              {filteredEmployees.map((employee) => (
                <MenuItem key={employee.id} value={String(employee.id)}>
                  {employee.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Timezone" fullWidth value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={9}>
            <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
              <Button size="small" onClick={() => applyPreset("TODAY")}>Today</Button>
              <Button size="small" onClick={() => applyPreset("WTD")}>WTD</Button>
              <Button size="small" onClick={() => applyPreset("MTD")}>MTD</Button>
              <Button size="small" onClick={() => applyPreset("QTD")}>QTD</Button>
              <Button size="small" onClick={() => applyPreset("YTD")}>YTD</Button>
              <Button variant="contained" onClick={() => { fetchDirectory(); fetchInsights(); }}>
                Refresh insights
              </Button>
            </Stack>
          </Grid>
        </Grid>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
        {directoryError && <Alert severity="warning" sx={{ mt: 2 }}>{directoryError}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </SectionCard>

      <Alert severity="info">
        This is an operational insight view. Finalized payroll still uses only payroll-ready leave and the existing payroll rules; preview-only and estimated items are shown for manager review, not as finalized payroll truth.
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Pending Leave" value={summary.pending_leave_requests || 0} help="Needs manager review" tone="warning" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Approved Leave" value={summary.approved_leave_requests || 0} help="Approved in selected range" tone="info" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Payroll-Ready" value={summary.payroll_ready_leave_requests || 0} help="Confirmed for payroll input" tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Preview-Only / Estimated" value={summary.preview_only_estimated_leave_requests || 0} help="Review signal, not finalized truth" tone="purple" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Paid Leave Hours" value={fmtHours(summary.paid_leave_hours)} help="Payroll-ready visibility depends on approval state" tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Unpaid Leave Hours" value={fmtHours(summary.unpaid_leave_hours)} help="Tracked separately from paid leave" tone="muted" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Leave Blockers" value={summary.leave_blockers_count || 0} help="Needs attention before payroll close" tone="danger" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Cancelled Leave" value={summary.cancelled_leave_count || 0} help="Excluded from active payroll readiness" tone="muted" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <SectionCard title="Leave readiness trend" description="Volume and readiness mix by selected day, week, or month.">
            <TrendChart rows={trend} />
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={5}>
          <SectionCard title="Readiness breakdown" description="Current readiness mix for the selected team and date range.">
            <DonutChart items={readinessItems} />
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={6}>
          <SectionCard title="Department leave breakdown" description="Paid and unpaid leave hours with payroll-readiness signals by department.">
            <DepartmentChart rows={departmentsBreakdown} />
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={6}>
          <SectionCard title="Employee attention visual summary" description="Employees with pending, estimated, preview-only, or blocked leave that may need action.">
            <AttentionList rows={attention} />
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={6}>
          <SectionCard title="Payroll readiness blockers" description="Leave records that need payroll review before finalization.">
            {blockers.length === 0 ? (
              <EmptyState>No payroll readiness blockers in this range.</EmptyState>
            ) : (
              <Stack spacing={1.25}>
                {blockers.slice(0, 12).map((row, idx) => (
                  <Box
                    key={`${row.leave_id}-${idx}`}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "error.light",
                      bgcolor: "rgba(220, 38, 38, 0.04)",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="subtitle2" fontWeight={850}>{row.employee_name || "Unknown employee"}</Typography>
                      <Chip size="small" label={readableReason(row.reason_code)} sx={readableChipSx("danger")} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      {row.warning?.message || "Leave overlaps worked time or needs payroll review."}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.department_name || "Unassigned"} · Leave #{row.leave_id} · {fmtHours(row.computed_hours)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={6}>
          <SectionCard title="Operational notes" description="How to read this dashboard without confusing it with finalized payroll output.">
            <Stack spacing={1.25}>
              <Alert severity="success" variant="outlined">
                Payroll-ready leave is the only leave state intended to flow into finalized payroll input.
              </Alert>
              <Alert severity="warning" variant="outlined">
                Preview-only and estimated leave are review signals. They should be resolved before payroll close when they affect pay.
              </Alert>
              <Alert severity="info" variant="outlined">
                Balances, attachments, and saved accrual policies stay outside payroll formulas. They support HR operations and manager review.
              </Alert>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default SettingsLeaveInsights;
