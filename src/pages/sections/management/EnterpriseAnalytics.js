// src/pages/analytics/EnterpriseAnalytics.js
import React, { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api";
import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";

import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  MenuItem,
  Button,
  Chip,
  Typography,
  Divider,
  LinearProgress,
  Alert,
  Stack,
} from "@mui/material";

// 🌟 Unified shells
import TabShell from "../../../components/ui/TabShell";
import SectionCard from "../../../components/ui/SectionCard";
import ProviderTop10 from "./ProviderTop10";
import Client360 from "./Client360";
import ClientFinder from "./ClientFinder";
import ClientsSummaryTab from "./ClientsSummaryTab";
import ClientsTopTab from "./ClientsTopTab";
import ClientsChurnRiskTab from "./ClientsChurnRiskTab";
import ClientsSegmentsTab from "./ClientsSegmentsTab";
import SegmentsPanel from "./SegmentsPanel";
import UpgradeNoticeBanner from "../../../components/billing/UpgradeNoticeBanner";
import useBillingStatus from "../../../components/billing/useBillingStatus";

dayjs.extend(quarterOfYear);

/* ---------- Small KPI card ---------- */
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

export default function EnterpriseAnalytics() {
  const { status: billingStatus } = useBillingStatus();
  const planKey = (billingStatus?.plan_key || "starter").toLowerCase();
  const isActive = ["active", "trialing"].includes(billingStatus?.status || "");
  const canAccess = (planKey === "pro" || planKey === "business") && isActive;
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [from, setFrom] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD")
  );
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [tz, setTz] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [group, setGroup] = useState("day");
  const [selectedClientEA, setSelectedClientEA] = useState(null);
  const [wfDepartmentId, setWfDepartmentId] = useState("");
  const [wfEmployeeId, setWfEmployeeId] = useState("");
  const [wfRecruiters, setWfRecruiters] = useState([]);
  const [wfDepartments, setWfDepartments] = useState([]);
  const [wfDirErr, setWfDirErr] = useState("");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [tips, setTips] = useState([]);
  const [err, setErr] = useState("");

  // Advanced analytics
  const [advanced, setAdvanced] = useState(null);
  const [advErr, setAdvErr] = useState("");
  const [wfLoading, setWfLoading] = useState(false);
  const [workforce, setWorkforce] = useState(null);
  const [wfErr, setWfErr] = useState("");

  // Helpers
  const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;
  const pct = (n) => `${(Number(n || 0) * 100).toFixed(1)}%`;
  const fmtHours = (n) => `${Number(n || 0).toFixed(1)} h`;

  const fetchData = async () => {
    setErr("");
    setLoading(true);
    try {
      const url = `/api/manager/analytics/summary?from=${from}&to=${to}&tz=${encodeURIComponent(
        tz
      )}&group=${group}`;
      const { data } = await api.get(url, auth);
      setData(data);
    } catch (e) {
      setData(null);
      setErr(e?.response?.data?.error || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchTips = async () => {
    try {
      const url = `/api/manager/tips/summary?from=${from}&to=${to}&tz=${encodeURIComponent(
        tz
      )}`;
      const { data } = await api.get(url, auth);
      setTips(data?.tips_by_recipient || []);
    } catch {
      setTips([]);
    }
  };

  const fetchAdvanced = async () => {
    setAdvErr("");
    try {
      const url = `/api/manager/analytics/advanced?from=${from}&to=${to}&tz=${encodeURIComponent(
        tz
      )}`;
      const { data } = await api.get(url, auth);
      setAdvanced(data || {});
    } catch (e) {
      setAdvanced(null);
      setAdvErr(
        e?.response?.data?.error || "Failed to load advanced analytics"
      );
    }
  };

  const fetchWorkforceDirectory = async () => {
    setWfDirErr("");
    try {
      const [rec, dept] = await Promise.all([
        api.get(`/manager/recruiters`, auth),
        api.get(`/api/departments`, auth),
      ]);
      setWfRecruiters(rec?.data?.recruiters || []);
      setWfDepartments(Array.isArray(dept?.data) ? dept.data : []);
    } catch (e) {
      setWfDirErr(
        e?.response?.data?.error ||
          "Failed to load departments and employees for workforce filters."
      );
      setWfRecruiters([]);
      setWfDepartments([]);
    }
  };

  const fetchWorkforce = async () => {
    setWfErr("");
    setWfLoading(true);
    try {
      const params = new URLSearchParams({
        from,
        to,
        tz,
        group,
      });
      if (wfDepartmentId) params.set("department_id", wfDepartmentId);
      if (wfEmployeeId) params.set("recruiter_id", wfEmployeeId);
      const { data } = await api.get(
        `/api/manager/analytics/workforce?${params.toString()}`,
        auth
      );
      setWorkforce(data || null);
    } catch (e) {
      setWorkforce(null);
      setWfErr(
        e?.response?.data?.error || "Failed to load workforce analytics"
      );
    } finally {
      setWfLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
    fetchTips();
    fetchAdvanced();
    fetchWorkforceDirectory();
    fetchWorkforce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shorthands (summary)
  const k = data?.kpis || {};
  const util = data?.utilization_by_provider || [];
  const topServices = data?.top_services || [];
  const series = data?.series || [];
  const clients = data?.clients || {};
  const coupon = data?.coupon || {};
  const win = data?.window || {};

  // Shorthands (advanced)
  const adv = advanced || {};
  const showupByProvider = adv?.showup_reliability_by_provider || [];
  const rebook = adv?.rebook || {};
  const cancelWindow = adv?.cancellation_window_distribution || {};
  const channelMix = adv?.channel_mix || {};
  const cardOnFile = adv?.card_on_file || {};
  const priceByCoupon = adv?.price_sensitivity_by_coupon || [];
  const attachSvc = adv?.service_attachment?.by_service || [];
  const attachProv = adv?.service_attachment?.by_provider || [];
  const rfm = adv?.rfm || [];
  const refundRate = adv?.refund_rate || {};
  const scheduleStability = adv?.schedule_stability || {};
  const workforceKpis = workforce?.kpis || {};
  const workforceSeries = workforce?.series || [];
  const workforceEmployeeBreakdown = workforce?.employee_breakdown || [];
  const workforceDepartmentBreakdown = workforce?.department_breakdown || [];
  const workforceRisk = workforce?.overtime_risk || [];
  const workforceReadiness = workforce?.payroll_readiness || {};
  const workforceEmployees = useMemo(() => {
    return (wfDepartmentId
      ? wfRecruiters.filter(
          (row) => String(row.department_id || "") === String(wfDepartmentId)
        )
      : wfRecruiters
    ).map((row) => ({
      ...row,
      name:
        row.name ||
        [row.first_name, row.last_name].filter(Boolean).join(" ") ||
        row.email ||
        `Employee #${row.id}`,
    }));
  }, [wfDepartmentId, wfRecruiters]);

  // Presets
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
    } else if (key === "30D") {
      setFrom(today.subtract(29, "day").format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("day");
    } else if (key === "QTD") {
      const qStart = dayjs().startOf("quarter");
      setFrom(qStart.format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("week");
    } else if (key === "YTD") {
      setFrom(today.startOf("year").format("YYYY-MM-DD"));
      setTo(today.format("YYYY-MM-DD"));
      setGroup("month");
    }
  };

  /* ------------ Shared Filter Bar (used in tabs) ------------ */
  const Filters = (
    <SectionCard
      title="Filters"
      description="Choose a range, timezone, and grouping. Click Refresh to reload."
      sx={{ mb: 2 }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={2}>
          <TextField
            label="From"
            type="date"
            fullWidth
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            label="To"
            type="date"
            fullWidth
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Timezone"
            fullWidth
            value={tz}
            onChange={(e) => setTz(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            select
            label="Group"
            fullWidth
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={() => applyPreset("MTD")}>
              MTD
            </Button>
            <Button size="small" onClick={() => applyPreset("WTD")}>
              WTD
            </Button>
            <Button size="small" onClick={() => applyPreset("30D")}>
              Last 30d
            </Button>
            <Button size="small" onClick={() => applyPreset("QTD")}>
              QTD
            </Button>
            <Button size="small" onClick={() => applyPreset("YTD")}>
              YTD
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                fetchData();
                fetchTips();
                fetchAdvanced();
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Grid>
      </Grid>
      {loading && <LinearProgress sx={{ mt: 2 }} />}
      {err && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {err}
        </Alert>
      )}
      {advErr && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {advErr}
        </Alert>
      )}
    </SectionCard>
  );

  /* ------------ Tabs content ------------ */
const ClientsTab = (
  <Box>
    {Filters}

    <SectionCard
      title="Client 360 & Geo-Insights"
      description="Find a client by Department → Employee → Search, then view their 360 panel (geo/IP, device, booking behavior, and messaging)."
    >
      {/* Pick client (scoped search) */}
      <ClientFinder
  token={token}
  from={from}
  to={to}
  tz={tz}
  onSelect={(c) => {
    setSelectedClientEA(c || null);
    // Derive scope ids from the selected client's known associations, if present
    if (c) {
      if (Array.isArray(c.department_ids) && c.department_ids.length) {
        setDepartmentId(String(c.department_ids[0]));
      } else {
        setDepartmentId("");
      }
      if (Array.isArray(c.recruiter_ids) && c.recruiter_ids.length) {
        setEmployeeId(String(c.recruiter_ids[0]));
      } else {
        setEmployeeId("");
      }
    } else {
      setDepartmentId("");
      setEmployeeId("");
    }
  }}
/>


      {/* Selected client hint (and quick clear) */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
  {selectedClientEA ? (
    <>
      <Chip
        color="primary"
        variant="outlined"
        label={`Selected client: ${
          selectedClientEA.full_name ||
          selectedClientEA.email ||
          ("#" + selectedClientEA.id)
        }`}
      />
      <Button size="small" onClick={() => setSelectedClientEA(null)}>
        Clear selection
      </Button>
    </>
  ) : (
    <Typography variant="body2" color="text.secondary">
      Tip: choose a Department, then Employee, then search by name/email/phone.
    </Typography>
  )}
</Stack>


      {/* The panel reads tz/from/to and the optional clientId */}
      <Client360
        tz={tz}
        from={from}
        to={to}
        token={token}
        clientId={selectedClientEA?.id}
        clientEmail={selectedClientEA?.email}
        onDrilldown={(clientId) => {
          try {
            window.location.assign(`/manager/clients/${clientId}`);
          } catch {/* no-op */}
        }}
      />
    </SectionCard>
  </Box>
);


  const OverviewTab = (
    <Box>
      {Filters}

      {data && (
        <>
          {/* KPIs */}
          <SectionCard
            title="Key metrics"
            description={
              win?.from && win?.to
                ? `${win.from} → ${win.to}${
                    win?.group ? ` (${win.group})` : ""
                  }`
                : undefined
            }
            sx={{ mb: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <KPI label="Appointments" value={k.total_appointments ?? 0} />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="No-Show Rate"
                  value={pct(k.no_show_rate)}
                  help={`${k.no_show_appointments || 0} no-shows`}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI label="Gross Balance" value={fmtMoney(k.gross_balance)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI label="Tips" value={fmtMoney(k.tips_total)} />
              </Grid>

              <Grid item xs={12} md={3}>
                <KPI label="Refunds" value={fmtMoney(k.refunds_total)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI label="Net Revenue" value={fmtMoney(k.net_revenue)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Tip Rate"
                  value={pct(k.tip_rate)}
                  help={`Avg tip ${fmtMoney(k.avg_tip)}`}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Avg Lead Time"
                  value={
                    k.avg_lead_time_hours != null
                      ? `${k.avg_lead_time_hours} h`
                      : "—"
                  }
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <KPI label="Prepaid" value={k.paid_count ?? 0} help="Paid Now" />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI label="Card on File" value={k.card_on_file_count ?? 0} />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI label="Unpaid" value={k.unpaid_count ?? 0} />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Slot Fill Rate"
                  value={
                    k.slot_fill_rate != null ? pct(k.slot_fill_rate) : "—"
                  }
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <KPI
                  label="Rev per Avail Hour"
                  value={
                    k.rev_per_avail_hour != null
                      ? fmtMoney(k.rev_per_avail_hour)
                      : adv?.rev_per_available_hour != null
                      ? fmtMoney(adv.rev_per_available_hour)
                      : "—"
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Rebook Rate (30d)"
                  value={
                    k.rebook_rate_30d != null
                      ? pct(k.rebook_rate_30d)
                      : rebook?.rate_30d != null
                      ? pct(rebook.rate_30d)
                      : "—"
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Rebook Rate (60d)"
                  value={
                    rebook?.rate_60d != null ? pct(rebook.rate_60d) : "—"
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Rebook Rate (90d)"
                  value={
                    rebook?.rate_90d != null ? pct(rebook.rate_90d) : "—"
                  }
                />
              </Grid>
            </Grid>
          </SectionCard>

          {/* Trend */}
          <SectionCard
            title="Trend"
            description="Bookings and revenue by bucket"
            sx={{ mb: 2 }}
          >
            {series.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No data in range.
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {series.map((row) => (
                  <Grid item xs={12} md={6} key={row.bucket}>
                    <Box
                      sx={{
                        p: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle2">{row.bucket}</Typography>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ mt: 1 }}
                      >
                        <Chip
                          size="small"
                          label={`Bookings: ${row.bookings ?? 0}`}
                        />
                        <Chip
                          size="small"
                          color="primary"
                          label={`Revenue: ${fmtMoney(row.revenue)}`}
                        />
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </SectionCard>

          <Grid container spacing={2}>
            {/* Utilization */}
            <Grid item xs={12} md={6}>
              <SectionCard title="Provider Utilization">
                {util.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No shifts/appointments.
                  </Typography>
                ) : (
                  util.map((u) => (
                    <Box key={u.provider_id} sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle2">{u.provider}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Booked {u.booked_min ?? 0} min / Shift{" "}
                        {u.shift_min ?? 0} min
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          100,
                          Math.round(Number(u?.utilization || 0) * 100)
                        )}
                        sx={{ mt: 0.5, height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  ))
                )}
              </SectionCard>
            </Grid>

            {/* Top services */}
            <Grid item xs={12} md={6}>
              <SectionCard title="Top Services by Revenue">
                {topServices.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No revenue yet.
                  </Typography>
                ) : (
                  topServices.map((s, idx) => (
                    <Box key={s.service_id ?? idx} sx={{ mb: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2">{s.service}</Typography>
                        <Typography variant="subtitle2">
                          {fmtMoney(s.revenue)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          100,
                          Math.round(
                            (100 * Number(s.revenue || 0)) /
                              Math.max(
                                1,
                                Number(topServices[0]?.revenue || 0)
                              )
                          )
                        )}
                        sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                      />
                    </Box>
                  ))
                )}
              </SectionCard>
            </Grid>
          </Grid>
          /* Segments */
<Box sx={{ mt: 2 }}>
  <SegmentsPanel />
</Box>
        </>
      )}
    </Box>
  );

  const WorkforceTab = (
    <Box>
      <SectionCard
        title="Workforce Filters"
        description="Track labor cost, overtime, and payroll readiness using the same date window with employee and department filters."
        sx={{ mb: 2 }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField
              label="From"
              type="date"
              fullWidth
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="To"
              type="date"
              fullWidth
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              select
              label="Group"
              fullWidth
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
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
              value={wfDepartmentId}
              onChange={(e) => {
                setWfDepartmentId(e.target.value);
                setWfEmployeeId("");
              }}
            >
              <MenuItem value="">All departments</MenuItem>
              {wfDepartments.map((dept) => (
                <MenuItem key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Employee"
              fullWidth
              value={wfEmployeeId}
              onChange={(e) => setWfEmployeeId(e.target.value)}
            >
              <MenuItem value="">All employees</MenuItem>
              {workforceEmployees.map((rec) => (
                <MenuItem key={rec.id} value={String(rec.id)}>
                  {rec.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Timezone"
              fullWidth
              value={tz}
              onChange={(e) => setTz(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={9}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
              flexWrap="wrap"
              useFlexGap
            >
              <Button size="small" onClick={() => applyPreset("TODAY")}>
                Today
              </Button>
              <Button size="small" onClick={() => applyPreset("WTD")}>
                WTD
              </Button>
              <Button size="small" onClick={() => applyPreset("MTD")}>
                MTD
              </Button>
              <Button size="small" onClick={() => applyPreset("QTD")}>
                QTD
              </Button>
              <Button size="small" onClick={() => applyPreset("YTD")}>
                YTD
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  fetchWorkforceDirectory();
                  fetchWorkforce();
                }}
              >
                Refresh workforce
              </Button>
            </Stack>
          </Grid>
        </Grid>
        {wfLoading && <LinearProgress sx={{ mt: 2 }} />}
        {wfDirErr && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {wfDirErr}
          </Alert>
        )}
        {wfErr && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {wfErr}
          </Alert>
        )}
      </SectionCard>

      {workforce && (
        <>
          <SectionCard
            title="Labor Cost Overview"
            description="Actual worked hours, overtime cost, paid leave cost, and payroll readiness signals for the selected window."
            sx={{ mb: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Estimated Labor Cost"
                  value={fmtMoney(workforceKpis.estimated_labor_cost)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Worked Hours"
                  value={fmtHours(workforceKpis.worked_hours)}
                  help={`${workforceKpis.worked_shifts || 0} shifts`}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Overtime Hours"
                  value={fmtHours(workforceKpis.overtime_hours)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Paid Leave Cost"
                  value={fmtMoney(workforceKpis.paid_leave_cost)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Employees Worked"
                  value={workforceKpis.employees_worked || 0}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Pending Time Approvals"
                  value={workforceReadiness.pending_time_approvals || 0}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Pending Leave Requests"
                  value={workforceReadiness.pending_leave_requests || 0}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPI
                  label="Anomalies"
                  value={workforceReadiness.anomaly_count || 0}
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard
            title="Labor Cost Trend"
            description="Use daily, weekly, or monthly grouping to spot labor-cost spikes before payroll closes."
            sx={{ mb: 2 }}
          >
            {workforceSeries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No worked hours or approved paid leave in this range.
              </Typography>
            ) : (
              <Grid container spacing={1.5}>
                {workforceSeries.map((row) => (
                  <Grid item xs={12} md={6} key={row.bucket_start}>
                    <Box
                      sx={{
                        p: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1.5,
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2">{row.bucket}</Typography>
                        <Chip
                          size="small"
                          color="primary"
                          label={fmtMoney(row.labor_cost)}
                        />
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 1 }}
                      >
                        <Chip
                          size="small"
                          label={`Hours: ${fmtHours(row.worked_hours)}`}
                        />
                        <Chip
                          size="small"
                          label={`OT: ${fmtHours(row.overtime_hours)}`}
                        />
                        <Chip
                          size="small"
                          label={`Paid leave: ${fmtHours(row.paid_leave_hours)}`}
                        />
                        <Chip
                          size="small"
                          label={`Shifts: ${row.worked_shifts || 0}`}
                        />
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </SectionCard>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <SectionCard
                title="Overtime & Risk"
                description="Employees already in overtime or approaching the weekly threshold."
              >
                {workforceRisk.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No overtime risk in the selected range.
                  </Typography>
                ) : (
                  workforceRisk.map((row) => (
                    <Box
                      key={`${row.recruiter_id}-${row.week}`}
                      sx={{
                        mb: 1.25,
                        p: 1.25,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1.5,
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2">
                          {row.employee}
                        </Typography>
                        <Chip
                          size="small"
                          color={
                            row.status === "overtime" ? "error" : "warning"
                          }
                          label={
                            row.status === "overtime"
                              ? "In overtime"
                              : "Close to overtime"
                          }
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {row.department_name || "Unassigned"} · {row.week}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          100,
                          Math.round((100 * Number(row.hours || 0)) / Math.max(1, Number(row.threshold || 0)))
                        )}
                        color={row.status === "overtime" ? "error" : "warning"}
                        sx={{ mt: 1, height: 8, borderRadius: 999 }}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {fmtHours(row.hours)} against a {fmtHours(row.threshold)} threshold
                      </Typography>
                    </Box>
                  ))
                )}
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard
                title="Payroll Readiness"
                description="What still needs review before payroll can close cleanly."
              >
                <Stack spacing={1.25}>
                  <Chip
                    color={
                      workforceReadiness.pending_time_approvals ? "warning" : "success"
                    }
                    label={`Pending time approvals: ${
                      workforceReadiness.pending_time_approvals || 0
                    }`}
                  />
                  <Chip
                    color={
                      workforceReadiness.pending_leave_requests ? "warning" : "success"
                    }
                    label={`Pending leave requests: ${
                      workforceReadiness.pending_leave_requests || 0
                    }`}
                  />
                  <Chip
                    color={workforceReadiness.anomaly_count ? "warning" : "success"}
                    label={`Time anomalies: ${workforceReadiness.anomaly_count || 0}`}
                  />
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    Estimated regular pay: {fmtMoney(workforceKpis.regular_pay)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estimated overtime pay: {fmtMoney(workforceKpis.overtime_pay)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid leave hours: {fmtHours(workforceKpis.paid_leave_hours)}
                  </Typography>
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SectionCard
                title="Department Cost Breakdown"
                description="Compare labor cost and overtime by department."
              >
                {workforceDepartmentBreakdown.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No department cost data in this range.
                  </Typography>
                ) : (
                  workforceDepartmentBreakdown.map((row, idx) => (
                    <Box key={`${row.department_id ?? "unassigned"}-${idx}`} sx={{ mb: 1.5 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2">
                          {row.department_name || "Unassigned"}
                        </Typography>
                        <Typography variant="subtitle2">
                          {fmtMoney(row.total_cost)}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {row.employees || 0} employee(s) · {fmtHours(row.worked_hours)} · OT {fmtHours(row.overtime_hours)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          100,
                          Math.round(
                            (100 * Number(row.total_cost || 0)) /
                              Math.max(
                                1,
                                Number(workforceDepartmentBreakdown[0]?.total_cost || 0)
                              )
                          )
                        )}
                        sx={{ mt: 0.75, height: 7, borderRadius: 999 }}
                      />
                    </Box>
                  ))
                )}
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard
                title="Employee Cost Breakdown"
                description="See who is driving labor cost and overtime in the selected period."
              >
                {workforceEmployeeBreakdown.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No employee cost data in this range.
                  </Typography>
                ) : (
                  workforceEmployeeBreakdown.slice(0, 10).map((row) => (
                    <Box key={row.recruiter_id} sx={{ mb: 1.5 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2">{row.employee}</Typography>
                        <Typography variant="subtitle2">
                          {fmtMoney(row.total_cost)}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {row.department_name || "Unassigned"} · {fmtHours(row.worked_hours)} · OT {fmtHours(row.overtime_hours)}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 0.75 }}
                      >
                        <Chip size="small" label={`Rate ${fmtMoney(row.hourly_rate)}/h`} />
                        <Chip size="small" label={`Regular ${fmtMoney(row.regular_pay)}`} />
                        <Chip size="small" label={`OT ${fmtMoney(row.overtime_pay)}`} />
                        {Number(row.paid_leave_cost || 0) > 0 && (
                          <Chip
                            size="small"
                            color="success"
                            variant="outlined"
                            label={`Paid leave ${fmtMoney(row.paid_leave_cost)}`}
                          />
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

  const AdvancedTab = (
    <Box>
      {Filters}

      {/* Show-up reliability */}
      <SectionCard
        title="Show-up Reliability by Provider"
        description="Current vs previous no-show rates"
        sx={{ mb: 2 }}
      >
        {showupByProvider.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No provider data.
          </Typography>
        ) : (
          showupByProvider.map((p) => (
            <Box key={p.provider_id} sx={{ mb: 1.5 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="subtitle2">{p.provider}</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip
                    label={`Now: ${
                      p.no_show_rate != null ? pct(p.no_show_rate) : "—"
                    }`}
                  />
                  <Chip
                    color="primary"
                    variant="outlined"
                    label={`Prev: ${
                      p.prev_no_show_rate != null
                        ? pct(p.prev_no_show_rate)
                        : "—"
                    }`}
                  />
                </Stack>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(
                  100,
                  Math.round(Number(p.no_show_rate || 0) * 100)
                )}
                sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
              />
            </Box>
          ))
        )}
      </SectionCard>

      {/* Rebook & interval */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Rebook Rates">
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                label={`30d: ${
                  rebook?.rate_30d != null ? pct(rebook.rate_30d) : "—"
                }`}
              />
              <Chip
                label={`60d: ${
                  rebook?.rate_60d != null ? pct(rebook.rate_60d) : "—"
                }`}
              />
              <Chip
                label={`90d: ${
                  rebook?.rate_90d != null ? pct(rebook.rate_90d) : "—"
                }`}
              />
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard title="Average Rebook Interval">
            <Typography>
              {rebook?.avg_interval_days != null
                ? `${rebook.avg_interval_days} days`
                : "—"}
            </Typography>
          </SectionCard>
        </Grid>
      </Grid>

      {/* Cancellation + stability/refunds */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Cancellation Window Distribution">
            {Object.keys(cancelWindow).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No cancellations in range.
              </Typography>
            ) : (
              Object.entries(cancelWindow).map(([bucket, count]) => (
                <Box key={bucket} sx={{ mb: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle2">{bucket}</Typography>
                    <Chip label={count} />
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      100,
                      Math.round(
                        (100 * Number(count)) /
                          Math.max(
                            1,
                            Object.values(cancelWindow).reduce(
                              (a, b) => a + b,
                              0
                            )
                          )
                      )
                    )}
                    sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                  />
                </Box>
              ))
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Schedule Stability & Refund Rate">
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                label={`Cancellation Rate: ${
                  scheduleStability?.cancellation_rate != null
                    ? pct(scheduleStability.cancellation_rate)
                    : "—"
                }`}
              />
              <Chip
                label={`Reschedule Rate: ${
                  scheduleStability?.reschedule_rate != null
                    ? pct(scheduleStability.reschedule_rate)
                    : "—"
                }`}
              />
              <Chip
                color="primary"
                variant="outlined"
                label={`Refunds (count): ${
                  refundRate?.by_count != null ? pct(refundRate.by_count) : "—"
                }`}
              />
              <Chip
                color="primary"
                variant="outlined"
                label={`Refunds ($): ${
                  refundRate?.by_amount != null ? pct(refundRate.by_amount) : "—"
                }`}
              />
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      {/* Channel mix */}
      <SectionCard
        title="Channel Mix of Bookings"
        description="Source breakdown across the selected range"
        sx={{ mb: 2 }}
      >
        {Object.keys(channelMix).length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No bookings in range.
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {Object.entries(channelMix).map(([src, cnt]) => (
              <Chip key={src} label={`${src}: ${cnt}`} />
            ))}
          </Stack>
        )}
      </SectionCard>

      {/* Card on file */}
      <SectionCard
        title="Card-on-File & Off-session Performance"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 1 }}>
          <Chip
            label={`Card-on-File Adoption: ${
              cardOnFile?.adoption_rate != null
                ? pct(cardOnFile.adoption_rate)
                : "—"
            }`}
          />
          <Chip
            color="primary"
            label={`Off-session Success: ${
              cardOnFile?.off_session?.success_rate != null
                ? pct(cardOnFile.off_session.success_rate)
                : "—"
            }`}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Attempts: {cardOnFile?.off_session?.attempts ?? 0} · Succeeded:{" "}
          {cardOnFile?.off_session?.succeeded ?? 0} · Failed:{" "}
          {cardOnFile?.off_session?.failed ?? 0}
        </Typography>
      </SectionCard>

      {/* Price sensitivity */}
      <SectionCard title="Price Sensitivity by Coupon" sx={{ mb: 2 }}>
        {priceByCoupon.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No coupon usage.
          </Typography>
        ) : (
          priceByCoupon.map((c) => (
            <Box key={c.coupon_id} sx={{ mb: 1.5 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="subtitle2">{c.coupon_code}</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip label={`Bookings: ${c.bookings}`} />
                  <Chip color="primary" label={`Avg Rev: ${fmtMoney(c.avg_revenue)}`} />
                  <Chip
                    label={`Rebook 90d: ${
                      c.rebook_90d_rate != null ? pct(c.rebook_90d_rate) : "—"
                    }`}
                  />
                </Stack>
              </Stack>
            </Box>
          ))
        )}
      </SectionCard>

      {/* Attachment */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Service Attachment (by Service)">
            {attachSvc.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No data.
              </Typography>
            ) : (
              attachSvc.map((s) => (
                <Box key={s.service_id} sx={{ mb: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle2">{s.service}</Typography>
                    <Chip
                      label={`Avg add-ons: ${Number(
                        s.avg_addons_per_booking || 0
                      ).toFixed(2)}`}
                    />
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      100,
                      Math.round(
                        (100 * Number(s.avg_addons_per_booking || 0)) /
                          Math.max(
                            1,
                            Number(attachSvc[0]?.avg_addons_per_booking || 0)
                          )
                      )
                    )}
                    sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                  />
                </Box>
              ))
            )}
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard title="Service Attachment (by Provider)">
            {attachProv.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No data.
              </Typography>
            ) : (
              attachProv.map((p) => (
                <Box key={p.provider_id} sx={{ mb: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle2">{p.provider}</Typography>
                    <Chip
                      label={`Avg add-ons: ${Number(
                        p.avg_addons_per_booking || 0
                      ).toFixed(2)}`}
                    />
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      100,
                      Math.round(
                        (100 * Number(p.avg_addons_per_booking || 0)) /
                          Math.max(
                            1,
                            Number(attachProv[0]?.avg_addons_per_booking || 0)
                          )
                      )
                    )}
                    sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                  />
                </Box>
              ))
            )}
          </SectionCard>
        </Grid>
      </Grid>

      {/* RFM */}
      <SectionCard title="Client RFM Segmentation" sx={{ mb: 2 }}>
        {rfm.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No client cohorts yet.
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {rfm.map((seg) => (
              <Chip key={seg.segment} label={`${seg.segment}: ${seg.clients}`} />
            ))}
          </Stack>
        )}
      </SectionCard>

      <Divider sx={{ my: 3 }} />

            {/* Top-10 Employee KPIs */}
      <SectionCard title="Top-10 Employee KPIs" description="Leaders by revenue, tips, and rebook rate">
        <ProviderTop10 />
      </SectionCard>
    </Box>
  );

  const TipsTab = (
    <Box>
      {Filters}

      <SectionCard
        title="Tip Leaderboard (Payroll Ready)"
        description="Aggregate tips by recipient in the selected range"
      >
        {tips.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No tips in range.
          </Typography>
        ) : (
          tips.map((t, idx) => (
            <Box key={t.recruiter_id ?? idx} sx={{ mb: 1.5 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="subtitle2">
                  {t.recruiter_name ||
                    t.recruiter ||
                    [t.first_name, t.last_name].filter(Boolean).join(" ") ||
                    "Unknown"}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip label={`Tips: ${t.tip_count ?? 0}`} />
                  <Chip color="primary" label={fmtMoney(t.tip_total)} />
                </Stack>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(
                  100,
                  Math.round(
                    (100 * Number(t.tip_total || 0)) /
                      Math.max(1, Number(tips[0]?.tip_total || 0))
                  )
                )}
                sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
              />
            </Box>
          ))
        )}
      </SectionCard>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Coupon Effectiveness">
            <Stack direction="row" spacing={2}>
              <Chip label={`Uses: ${data?.coupon?.uses || 0}`} />
              <Chip
                color="primary"
                label={`Discount (est): ${fmtMoney(
                  data?.coupon?.discount_total_estimate
                )}`}
              />
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard title="Clients">
            <Stack direction="row" spacing={2}>
              <Chip label={`New: ${data?.clients?.new || 0}`} />
              <Chip label={`Returning: ${data?.clients?.returning || 0}`} />
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );

  const tabs = [
    { label: "Overview", content: OverviewTab },
    { label: "Advanced", content: AdvancedTab },
    { label: "Workforce Cost", content: WorkforceTab },
    { label: "Tips & Clients", content: TipsTab },
    { label: "Clients 360", content: ClientsTab },

    // ✅ new client tabs
    { label: "Clients • Summary", content: (
        <ClientsSummaryTab
          from={from}
          to={to}
          tz={tz}
          departmentId={departmentId}
          employeeId={employeeId}
        />
      )
    },
    { label: "Clients • Top", content: (
        <ClientsTopTab
          from={from}
          to={to}
          tz={tz}
          departmentId={departmentId}
          employeeId={employeeId}
        />
      )
    },
    { label: "Clients • Churn", content: (
        <ClientsChurnRiskTab
          departmentId={departmentId}
          employeeId={employeeId}
        />
      )
    },
    { label: "Clients • Segments", content: (
        <ClientsSegmentsTab
          from={from}
          to={to}
          tz={tz}
          departmentId={departmentId}
          employeeId={employeeId}
        />
      )
    },
  ];

  if (!canAccess) {
    return (
      <>
        <UpgradeNoticeBanner
          requiredPlan="pro"
          message="Advanced analytics require the Pro plan or higher."
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Upgrade to Pro to unlock KPI dashboards, client segments, and advanced insights.
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <TabShell
      title="Enterprise Analytics"
      description="KPI snapshots, trends, and insights across your business."
      tabs={tabs}
      defaultTab={0}
    />
  );
}
