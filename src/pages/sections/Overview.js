// src/components/Overview.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PeopleIcon from "@mui/icons-material/People";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import OnboardingWidget from "../../components/management/OnboardingWidget";
import AttendanceSummaryCard from "../../components/management/AttendanceSummaryCard";

const toneMap = {
  good: { accent: "#15803d", bg: "rgba(22, 163, 74, 0.08)", border: "rgba(22, 163, 74, 0.22)" },
  info: { accent: "#2563eb", bg: "rgba(37, 99, 235, 0.08)", border: "rgba(37, 99, 235, 0.2)" },
  warning: { accent: "#b45309", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.24)" },
  risk: { accent: "#b91c1c", bg: "rgba(239, 68, 68, 0.09)", border: "rgba(239, 68, 68, 0.24)" },
  neutral: { accent: "#475569", bg: "rgba(100, 116, 139, 0.08)", border: "rgba(100, 116, 139, 0.2)" },
};

const formatNumber = (value, suffix = "") => {
  const number = Number(value || 0);
  return `${Number.isInteger(number) ? number.toLocaleString() : number.toFixed(1)}${suffix}`;
};

const percent = (value, total) => {
  const denominator = Number(total || 0);
  if (!denominator) return 0;
  return Math.max(0, Math.min(100, Math.round((Number(value || 0) / denominator) * 100)));
};

const asArray = (value, key) => {
  if (Array.isArray(value)) return value;
  if (key && Array.isArray(value?.[key])) return value[key];
  return [];
};

const SectionCard = ({ title, description, children, accent = "neutral", action }) => {
  const tone = toneMap[accent] || toneMap.neutral;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        borderColor: "rgba(148, 163, 184, 0.28)",
        bgcolor: "rgba(255,255,255,0.92)",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: tone.accent }} />
            <Typography variant="h6" fontWeight={900}>
              {title}
            </Typography>
          </Stack>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      {children}
    </Paper>
  );
};

const ExecutivePanel = ({ icon, title, value, subtitle, tone = "neutral", onClick, details = [] }) => {
  const palette = toneMap[tone] || toneMap.neutral;
  return (
    <Card
      onClick={onClick}
      sx={{
        height: "100%",
        p: 2,
        borderRadius: 2,
        border: `1px solid ${palette.border}`,
        bgcolor: palette.bg,
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 16px 34px rgba(15, 23, 42, 0.05)",
        transition: "transform 140ms ease, box-shadow 140ms ease",
        "&:hover": onClick ? { transform: "translateY(-2px)", boxShadow: "0 22px 46px rgba(15, 23, 42, 0.08)" } : {},
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 1.25,
              display: "grid",
              placeItems: "center",
              color: palette.accent,
              bgcolor: "rgba(255,255,255,0.75)",
              border: `1px solid ${palette.border}`,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: palette.accent, opacity: 0.9 }} />
        </Stack>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.3, fontWeight: 900 }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={950} sx={{ color: palette.accent, lineHeight: 1.05 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        </Box>
        {details.length > 0 && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {details.map((detail) => (
              <Chip
                key={detail}
                size="small"
                label={detail}
                sx={{ bgcolor: "rgba(255,255,255,0.82)", fontWeight: 800, color: "#334155" }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

const InsightStrip = ({ insights }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.25,
      borderRadius: 1.5,
      borderColor: "rgba(37, 99, 235, 0.18)",
      background: "linear-gradient(135deg, rgba(239,246,255,0.88), rgba(255,255,255,0.92))",
    }}
  >
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
        Insight strip
      </Typography>
      {insights.map((item) => {
        const tone = toneMap[item.tone] || toneMap.neutral;
        return (
          <Chip
            key={item.label}
            size="small"
            label={item.label}
            sx={{
              borderRadius: 1,
              bgcolor: tone.bg,
              color: tone.accent,
              border: `1px solid ${tone.border}`,
              fontWeight: 850,
            }}
          />
        );
      })}
    </Stack>
  </Paper>
);

const CompositionBar = ({ items }) => {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  return (
    <Stack spacing={1.25}>
      <Box sx={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", bgcolor: "rgba(226,232,240,0.9)" }}>
        {items.map((item) => {
          const width = total ? `${Math.max(percent(item.value, total), item.value ? 4 : 0)}%` : "0%";
          return <Box key={item.label} sx={{ width, bgcolor: item.color, transition: "width 180ms ease" }} />;
        })}
      </Box>
      <Stack spacing={0.85}>
        {items.map((item) => (
          <Stack key={item.label} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: item.color }} />
              <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            </Stack>
            <Typography variant="body2" fontWeight={850}>
              {formatNumber(item.value)} <Typography component="span" variant="caption" color="text.secondary">({percent(item.value, total)}%)</Typography>
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

const MetricTile = ({ label, value, helper, tone = "neutral" }) => {
  const palette = toneMap[tone] || toneMap.neutral;
  return (
    <Box sx={{ p: 1.4, borderRadius: 1.5, bgcolor: palette.bg, border: `1px solid ${palette.border}` }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 850 }}>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={950} sx={{ color: palette.accent, lineHeight: 1.1 }}>
        {value}
      </Typography>
      {helper && <Typography variant="caption" color="text.secondary">{helper}</Typography>}
    </Box>
  );
};

const ProgressRow = ({ label, value, total, color = "#2563eb", helper }) => (
  <Box>
    <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
      <Typography variant="body2" fontWeight={850}>{label}</Typography>
      <Typography variant="body2" color="text.secondary">{formatNumber(value)} / {formatNumber(total)}</Typography>
    </Stack>
    <LinearProgress
      variant="determinate"
      value={percent(value, total)}
      sx={{
        height: 8,
        borderRadius: 999,
        bgcolor: "rgba(226,232,240,0.9)",
        "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 999 },
      }}
    />
    {helper && <Typography variant="caption" color="text.secondary">{helper}</Typography>}
  </Box>
);

const Overview = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authHeader = { Authorization: `Bearer ${token}` };

  const [teamCount, setTeamCount] = useState(0);
  const [departments, setDepartments] = useState(0);
  const [meetings, setMeetings] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [todayStatus, setTodayStatus] = useState([]);

  const [pendingSwaps, setPendingSwaps] = useState(0);
  const [awaitingManagerSwaps, setAwaitingManagerSwaps] = useState(0);
  const [availability, setAvailability] = useState({ ok: 0, low: 0 });
  const [activityFeed, setActivityFeed] = useState([]);
  const [productLowStockSummary, setProductLowStockSummary] = useState({
    count: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
  });
  const [productOrdersSummary, setProductOrdersSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    backorder: 0,
    inventory_action_required: 0,
    untracked_shipping: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("today");

  const safeGet = async (url, fallback) => {
    try {
      const { data } = await api.get(url, { headers: authHeader });
      return data ?? fallback;
    } catch {
      return fallback;
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        teamRes,
        deptRes,
        meetRes,
        leaveRes,
        todayRes,
        swapPendingRes,
        swapPeerRes,
        availRes,
        feedRes,
        lowStockRes,
        productOrdersRes,
      ] = await Promise.all([
        safeGet("/manager/recruiters", []),
        safeGet("/api/departments", []),
        safeGet("/manager/calendar", []),
        safeGet("/leaves/pending", []),
        safeGet("/team/status/today", []),
        safeGet("/shift-swap-requests?status=pending", []),
        safeGet("/shift-swap-requests?status=peer_accepted", []),
        safeGet("/manager/availability-summary", { ok: 0, low: 0 }),
        safeGet("/manager/activity-feed", []),
        safeGet("/inventory/products/low-stock?limit=1", { summary: { count: 0, low_stock_count: 0, out_of_stock_count: 0 }, items: [] }),
        safeGet("/inventory/product-orders?page=1&page_size=200", { orders: [], pagination: { total: 0 } }),
      ]);

      const teamArr = asArray(teamRes, "recruiters");
      const deptArr = asArray(deptRes, "departments");
      const meetingArr = asArray(meetRes, "events");
      const leaveArr = asArray(leaveRes, "leaves");
      const statusArr = asArray(todayRes, "statuses");

      setTeamCount(teamArr.length);
      setDepartments(deptArr.length);
      setMeetings(meetingArr);
      setLeaves(leaveArr);
      setTodayStatus(statusArr);
      setPendingSwaps(asArray(swapPendingRes).length);
      setAwaitingManagerSwaps(asArray(swapPeerRes).length);
      setAvailability({ ok: availRes?.ok ?? 0, low: availRes?.low ?? 0, ...availRes });
      setActivityFeed(asArray(feedRes).slice(0, 5));

      const lowSummary = lowStockRes?.summary || {};
      setProductLowStockSummary({
        count: Number(lowSummary.count || 0),
        low_stock_count: Number(lowSummary.low_stock_count || 0),
        out_of_stock_count: Number(lowSummary.out_of_stock_count || 0),
      });

      const orderRows = Array.isArray(productOrdersRes?.orders) ? productOrdersRes.orders : [];
      const totalOrders = Number(productOrdersRes?.pagination?.total || orderRows.length || 0);
      setProductOrdersSummary({
        total: totalOrders,
        paid: orderRows.filter((order) => String(order?.payment_status || "").toLowerCase() === "paid").length,
        pending: orderRows.filter((order) => String(order?.payment_status || "").toLowerCase() === "pending").length,
        backorder: orderRows.filter((order) => String(order?.fulfillment_status || "").toLowerCase() === "backorder").length,
        inventory_action_required: orderRows.filter((order) => Boolean(order?.inventory_action_required)).length,
        untracked_shipping: orderRows.filter((order) => {
          const delivery = String(order?.delivery_method || "").toLowerCase();
          const tracking = order?.tracking_url_public || order?.tracking_url;
          return (delivery === "shipping" || delivery === "local_delivery") && !tracking;
        }).length,
      });
    } catch (err) {
      console.error("Dashboard parse error", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const id = setInterval(loadDashboard, 120000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekStatusIsPlaceholder = todayStatus?.week_is_placeholder === true;
  const weekAvailIsPlaceholder = availability?.week_is_placeholder === true;
  const hasWeekStatus = Array.isArray(todayStatus?.week) && !weekStatusIsPlaceholder;
  const hasWeekAvailability =
    availability &&
    !weekAvailIsPlaceholder &&
    (availability.week_gaps !== undefined || availability.week_understaffed !== undefined || availability.week_ok !== undefined);
  const hasWeek = hasWeekStatus || hasWeekAvailability;

  useEffect(() => {
    if (range === "week" && !hasWeek) setRange("today");
  }, [range, hasWeek]);

  const pickRange = (value) => {
    if (range === "week" && hasWeekStatus) return value.week;
    return value;
  };

  const liveWorkforce = useMemo(() => {
    const statuses = todayStatus || [];
    const normalize = (status) => String(status || "").toLowerCase();
    const clockedIn = statuses.filter((row) => ["present", "clocked_in", "working"].includes(normalize(row.status))).length;
    const onBreak = statuses.filter((row) => ["break", "on_break"].includes(normalize(row.status))).length;
    const missing = statuses.filter((row) => ["absent", "late", "missing"].includes(normalize(row.status))).length;
    return { clockedIn, onBreak, missing, scheduled: statuses.length };
  }, [todayStatus]);

  const compliance = useMemo(() => {
    const statuses = pickRange(todayStatus) || [];
    const missedBreaks = statuses.filter((row) => row?.missed_break || row?.break_missed || String(row?.status || "").toLowerCase() === "missed_break").length;
    const overtimeRisk = statuses.filter((row) => row?.overtime_risk || row?.ot_risk).length;
    const anomalies = statuses.reduce((sum, row) => sum + (Number(row?.anomalies || row?.anomaly_count || 0) || 0), 0);
    const late = statuses.filter((row) => String(row?.status || "").toLowerCase() === "late").length;
    const missing = statuses.filter((row) => String(row?.status || "").toLowerCase() === "absent").length;
    const earlyLeave = statuses.filter((row) => String(row?.status || "").toLowerCase() === "early_leave").length;
    return { missedBreaks, overtimeRisk, anomalies, late, missing, earlyLeave };
  }, [todayStatus, range, hasWeekStatus]);

  const payrollReadiness = useMemo(() => {
    const statuses = pickRange(todayStatus) || [];
    const approved = statuses.filter((row) => row?.approved || row?.punch_approved).length;
    const pending = statuses.filter((row) => row?.approved === false || row?.punch_approved === false).length;
    const total = approved + pending;
    const pctApproved = total ? Math.round((approved / total) * 100) : 100;
    const hours = statuses.reduce((sum, row) => sum + (Number(row?.hours_week || row?.hours_this_week || row?.hours || 0) || 0), 0);
    return { approved, pending, total, pctApproved, hours };
  }, [todayStatus, range, hasWeekStatus]);

  const coverageHealth = useMemo(() => {
    const gaps = range === "week" && !weekAvailIsPlaceholder ? Number(availability?.week_gaps || 0) : Number(availability?.low || 0);
    const ok = range === "week" && !weekAvailIsPlaceholder ? Number(availability?.week_ok || 0) : Number(availability?.ok || 0);
    const understaffed = range === "week" && !weekAvailIsPlaceholder ? Number(availability?.week_understaffed || 0) : Number(availability?.understaffed || 0);
    return { ok, gaps, understaffed, swaps: pendingSwaps || 0 };
  }, [availability, pendingSwaps, range, weekAvailIsPlaceholder]);

  const managerActions = useMemo(() => ({
    swapsPending: pendingSwaps || 0,
    approvalsNeeded: awaitingManagerSwaps || 0,
    pendingLeaves: leaves.length || 0,
    productActions: productLowStockSummary.count + productOrdersSummary.inventory_action_required,
  }), [pendingSwaps, awaitingManagerSwaps, leaves.length, productLowStockSummary.count, productOrdersSummary.inventory_action_required]);

  const insights = useMemo(() => [
    {
      label: compliance.missedBreaks ? `${compliance.missedBreaks} missing break${compliance.missedBreaks === 1 ? "" : "s"} need review` : "No missing breaks detected",
      tone: compliance.missedBreaks ? "warning" : "good",
    },
    {
      label: `${leaves.length} pending leave request${leaves.length === 1 ? "" : "s"}`,
      tone: leaves.length ? "warning" : "good",
    },
    {
      label: `${compliance.anomalies} anomaly alert${compliance.anomalies === 1 ? "" : "s"}`,
      tone: compliance.anomalies ? "risk" : "good",
    },
    {
      label: `${payrollReadiness.pctApproved}% payroll-ready approval mix`,
      tone: payrollReadiness.pending ? "warning" : "good",
    },
  ], [compliance, leaves.length, payrollReadiness]);

  const complianceTotal = compliance.missedBreaks + compliance.overtimeRisk + compliance.anomalies + compliance.late + compliance.missing + compliance.earlyLeave;
  const productRiskTotal = productLowStockSummary.count + productOrdersSummary.inventory_action_required + productOrdersSummary.backorder + productOrdersSummary.untracked_shipping;

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: "100%",
        background: "linear-gradient(180deg, rgba(248,250,252,0.88), rgba(241,245,249,0.72))",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={950} letterSpacing="-0.03em">
            Operations Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Executive view of workforce, compliance, payroll readiness, and service operations.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button size="small" variant={range === "today" ? "contained" : "outlined"} onClick={() => setRange("today")}>
            Today
          </Button>
          <Button size="small" variant={range === "week" ? "contained" : "outlined"} disabled={!hasWeek} onClick={() => setRange("week")}>
            This Week
          </Button>
          {!hasWeek && (
            <Typography variant="caption" color="text.secondary">
              {weekStatusIsPlaceholder || weekAvailIsPlaceholder ? "Week view coming soon." : "Week metrics not available yet."}
            </Typography>
          )}
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} xl={3}>
              <ExecutivePanel
                icon={<PeopleIcon />}
                title="Live Workforce"
                value={formatNumber(liveWorkforce.clockedIn)}
                subtitle="Clocked in now"
                tone={liveWorkforce.missing ? "warning" : "info"}
                details={[`Break: ${liveWorkforce.onBreak}`, `Missing: ${liveWorkforce.missing}`, `Scheduled: ${liveWorkforce.scheduled}`]}
                onClick={() => navigate("/manager/time-tracking")}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <ExecutivePanel
                icon={<WarningAmberIcon />}
                title="Compliance Alerts"
                value={formatNumber(complianceTotal)}
                subtitle="Break, anomaly, overtime, and attendance signals"
                tone={complianceTotal ? "risk" : "good"}
                details={[`Breaks: ${compliance.missedBreaks}`, `OT risk: ${compliance.overtimeRisk}`, `Anomalies: ${compliance.anomalies}`]}
                onClick={() => navigate("/manager/time-tracking-fraud")}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <ExecutivePanel
                icon={<PendingActionsIcon />}
                title="Payroll Readiness"
                value={`${payrollReadiness.pctApproved}%`}
                subtitle="Approved payroll-ready time mix"
                tone={payrollReadiness.pending ? "warning" : "good"}
                details={[`Pending: ${payrollReadiness.pending}`, `Approved: ${payrollReadiness.approved}`, `${formatNumber(payrollReadiness.hours, " h")}`]}
                onClick={() => navigate("/manager/payroll")}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <ExecutivePanel
                icon={<SwapHorizIcon />}
                title="Pending Manager Actions"
                value={formatNumber(managerActions.swapsPending + managerActions.approvalsNeeded + managerActions.pendingLeaves)}
                subtitle="Leave and scheduling items needing review"
                tone={managerActions.swapsPending || managerActions.approvalsNeeded || managerActions.pendingLeaves ? "warning" : "neutral"}
                details={[`Leaves: ${managerActions.pendingLeaves}`, `Swaps: ${managerActions.swapsPending}`, `Approvals: ${managerActions.approvalsNeeded}`]}
                onClick={() => navigate("/manager/leaves")}
              />
            </Grid>
          </Grid>

          <InsightStrip insights={insights} />

          <Grid container spacing={2.5}>
            <Grid item xs={12} lg={7}>
              <SectionCard
                title="Workforce Status / Attendance Health"
                description="Current staffing posture using today’s time and availability signals."
                accent={coverageHealth.gaps || coverageHealth.understaffed ? "warning" : "good"}
              >
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={5}>
                    <CompositionBar
                      items={[
                        { label: "Clocked in", value: liveWorkforce.clockedIn, color: "#2563eb" },
                        { label: "On break", value: liveWorkforce.onBreak, color: "#f59e0b" },
                        { label: "Missing/late", value: liveWorkforce.missing, color: "#ef4444" },
                      ]}
                    />
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <Stack spacing={1.4}>
                      <ProgressRow label="Coverage OK" value={coverageHealth.ok} total={coverageHealth.ok + coverageHealth.gaps || 1} color="#16a34a" />
                      <ProgressRow label="Availability gaps" value={coverageHealth.gaps} total={coverageHealth.ok + coverageHealth.gaps || 1} color="#f59e0b" />
                      <Stack direction="row" spacing={1}>
                        <MetricTile label="Departments" value={formatNumber(departments)} helper="Active departments" tone="neutral" />
                        <MetricTile label="Team members" value={formatNumber(teamCount)} helper="Visible roster" tone="info" />
                      </Stack>
                    </Stack>
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>

            <Grid item xs={12} lg={5}>
              <SectionCard
                title="Compliance / Anomaly Mix"
                description="Risk concentration across time and attendance signals."
                accent={complianceTotal ? "risk" : "good"}
                action={<Button size="small" variant="outlined" onClick={() => navigate("/manager/time-tracking-fraud")}>Review</Button>}
              >
                <Stack spacing={1.2}>
                  <ProgressRow label="Missed breaks" value={compliance.missedBreaks} total={Math.max(complianceTotal, 1)} color="#f59e0b" />
                  <ProgressRow label="Anomaly events" value={compliance.anomalies} total={Math.max(complianceTotal, 1)} color="#ef4444" />
                  <ProgressRow label="Late / missing / early leave" value={compliance.late + compliance.missing + compliance.earlyLeave} total={Math.max(complianceTotal, 1)} color="#b45309" />
                  <MetricTile
                    label="Overtime risk"
                    value={formatNumber(compliance.overtimeRisk)}
                    helper="Existing signals only; payroll remains source of truth"
                    tone={compliance.overtimeRisk ? "warning" : "good"}
                  />
                </Stack>
              </SectionCard>
            </Grid>

            <Grid item xs={12} lg={6}>
              <SectionCard
                title="Payroll Readiness Composition"
                description="Approval pressure before payroll close."
                accent={payrollReadiness.pending ? "warning" : "good"}
                action={<Button size="small" variant="outlined" onClick={() => navigate("/manager/payroll")}>Open payroll</Button>}
              >
                <Stack spacing={1.5}>
                  <CompositionBar
                    items={[
                      { label: "Approved", value: payrollReadiness.approved, color: "#16a34a" },
                      { label: "Pending", value: payrollReadiness.pending, color: "#f59e0b" },
                    ]}
                  />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <MetricTile label="Hours in slice" value={formatNumber(payrollReadiness.hours, " h")} helper={range === "week" ? "Week range" : "Today"} tone="info" />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricTile label="Pending leaves" value={formatNumber(leaves.length)} helper="Manager review queue" tone={leaves.length ? "warning" : "good"} />
                    </Grid>
                  </Grid>
                </Stack>
              </SectionCard>
            </Grid>

            <Grid item xs={12} lg={6}>
              <SectionCard
                title="Service & Booking Activity"
                description="Calendar, availability, and booking operations summary."
                accent={availability.low || pendingSwaps ? "warning" : "info"}
                action={<Button size="small" variant="outlined" onClick={() => navigate("/manager/team")}>Open schedule</Button>}
              >
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <MetricTile label="Shifts today" value={formatNumber(todayStatus.length)} helper="Current status rows" tone="info" />
                  </Grid>
                  <Grid item xs={6}>
                    <MetricTile label="Meetings/events" value={formatNumber(meetings.length)} helper="Calendar events loaded" tone="neutral" />
                  </Grid>
                  <Grid item xs={6}>
                    <MetricTile label="Low availability" value={formatNumber(availability.low)} helper="Booking coverage signal" tone={availability.low ? "warning" : "good"} />
                  </Grid>
                  <Grid item xs={6}>
                    <MetricTile label="Swap requests" value={formatNumber(pendingSwaps)} helper="Pending shift swaps" tone={pendingSwaps ? "warning" : "good"} />
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>

            <Grid item xs={12}>
              <SectionCard
                title="Product Operations"
                description="Inventory and order signals grouped separately from workforce operations."
                accent={productRiskTotal ? "warning" : "good"}
              >
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={7}>
                    <CompositionBar
                      items={[
                        { label: "Paid orders", value: productOrdersSummary.paid, color: "#16a34a" },
                        { label: "Pending orders", value: productOrdersSummary.pending, color: "#f59e0b" },
                        { label: "Backorders", value: productOrdersSummary.backorder, color: "#ef4444" },
                      ]}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <MetricTile label="Orders" value={formatNumber(productOrdersSummary.total)} helper="Loaded order scope" tone="info" />
                      </Grid>
                      <Grid item xs={6}>
                        <MetricTile label="Product risk" value={formatNumber(productRiskTotal)} helper="Inventory/shipping attention" tone={productRiskTotal ? "warning" : "good"} />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <OnboardingWidget onViewAll={() => navigate("/manager/onboarding")} />
            </Grid>
            <Grid item xs={12} md={6}>
              <AttendanceSummaryCard onViewReport={() => navigate("/manager/attendance-summaries")} />
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <SectionCard title="Recent Activity" description="Latest operational changes and audit-style activity." accent="neutral">
                {activityFeed.length === 0 ? (
                  <Typography color="text.secondary">No recent actions.</Typography>
                ) : (
                  <List dense disablePadding>
                    {activityFeed.map((item) => (
                      <ListItem key={item.id || `${item.title}-${item.when}`} disableGutters>
                        <ListItemText primary={item.title} secondary={item.when} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Quick Actions" description="Fast routes into the highest-value manager workspaces." accent="info">
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" onClick={() => navigate("/manager/team")}>Manage schedule</Button>
                  <Button variant="outlined" onClick={() => navigate("/manager/leaves")}>Review leave</Button>
                  <Button variant="outlined" onClick={() => navigate("/manager/payroll")}>Payroll summary</Button>
                  <Tooltip title="Detailed analytics remain in Advanced Analytics.">
                    <span>
                      <Button variant="outlined" disabled>More analytics</Button>
                    </span>
                  </Tooltip>
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
};

export default Overview;
