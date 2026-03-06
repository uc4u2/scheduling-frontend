// src/components/Overview.js
import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  Typography,
  Box,
  Divider,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";

import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import OnboardingWidget from "../../components/management/OnboardingWidget";
import AttendanceSummaryCard from "../../components/management/AttendanceSummaryCard";

/* renderCard helper unchanged … */
const renderCard = (icon, title, value, color = "#1976d2", onClick) => (
  <Card
    sx={{
      display: "flex",
      alignItems: "center",
      p: 2,
      height: "100%",
      cursor: onClick ? "pointer" : "default",
      boxShadow: 3,
      "&:hover": onClick ? { boxShadow: 6 } : {},
    }}
    onClick={onClick}
  >
    <Box
      sx={{
        mr: 2,
        bgcolor: color,
        color: "#fff",
        borderRadius: "50%",
        width: 52,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="subtitle1">{title}</Typography>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
    </Box>
  </Card>
);

const Overview = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authHeader = { Authorization: `Bearer ${token}` };

  /* state declarations unchanged … */
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
  const [range, setRange] = useState("today"); // "today" | "week"

  /* helper: always return array */
  const asArray = (val, key) => {
    if (Array.isArray(val)) return val;
    if (key && Array.isArray(val?.[key])) return val[key];
    return [];
  };

  const safeGet = async (url, fallback) => {
    try {
      const { data } = await api.get(url, { headers: authHeader });
      return data ?? fallback;
    } catch {
      return fallback;
    }
  };

  /* ###############  UPDATED LOAD FUNCTION ############### */
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
        safeGet(`/manager/recruiters`, []),
        safeGet(`/api/departments`, []),
        safeGet(`/manager/calendar`, []),
        safeGet(`/leaves/pending`, []),
        safeGet(`/team/status/today`, []),
        safeGet(`/shift-swap-requests?status=pending`, []),
        safeGet(`/shift-swap-requests?status=peer_accepted`, []),
        safeGet(`/manager/availability-summary`, { ok: 0, low: 0 }),
        safeGet(`/manager/activity-feed`, []),
        safeGet(`/inventory/products/low-stock?limit=1`, { summary: { count: 0, low_stock_count: 0, out_of_stock_count: 0 }, items: [] }),
        safeGet(`/inventory/product-orders?page=1&page_size=200`, { orders: [], pagination: { total: 0 } }),
      ]);

      /* convert to arrays safely */
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
      setAvailability({
        ok: availRes?.ok ?? 0,
        low: availRes?.low ?? 0,
      });
      setActivityFeed(asArray(feedRes).slice(0, 5));

      const lowSummary = lowStockRes?.summary || {};
      setProductLowStockSummary({
        count: Number(lowSummary.count || 0),
        low_stock_count: Number(lowSummary.low_stock_count || 0),
        out_of_stock_count: Number(lowSummary.out_of_stock_count || 0),
      });

      const orderRows = Array.isArray(productOrdersRes?.orders) ? productOrdersRes.orders : [];
      const totalOrders = Number(productOrdersRes?.pagination?.total || orderRows.length || 0);
      const paidCount = orderRows.filter((o) => String(o?.payment_status || "").toLowerCase() === "paid").length;
      const pendingCount = orderRows.filter((o) => String(o?.payment_status || "").toLowerCase() === "pending").length;
      const backorderCount = orderRows.filter((o) => String(o?.fulfillment_status || "").toLowerCase() === "backorder").length;
      const inventoryActionCount = orderRows.filter((o) => Boolean(o?.inventory_action_required)).length;
      const untrackedShippingCount = orderRows.filter((o) => {
        const delivery = String(o?.delivery_method || "").toLowerCase();
        const tracking = o?.tracking_url_public || o?.tracking_url;
        return (delivery === "shipping" || delivery === "local_delivery") && !tracking;
      }).length;
      setProductOrdersSummary({
        total: totalOrders,
        paid: paidCount,
        pending: pendingCount,
        backorder: backorderCount,
        inventory_action_required: inventoryActionCount,
        untracked_shipping: untrackedShippingCount,
      });

      setLoading(false);
    } catch (e) {
      console.error("Dashboard parse error", e);
      setError("Failed to load dashboard data.");
      setLoading(false);
    }
  };
  /* ####################################################### */

  useEffect(() => {
    loadDashboard();
    const id = setInterval(loadDashboard, 120000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* derived KPI summaries */
  const liveWorkforce = React.useMemo(() => {
    const statuses = todayStatus || [];
    const normalize = (s) => (s || "").toLowerCase();
    const clockedIn = statuses.filter((s) => ["present", "clocked_in", "working"].includes(normalize(s.status))).length;
    const onBreak = statuses.filter((s) => ["break", "on_break"].includes(normalize(s.status))).length;
    const missing = statuses.filter((s) => ["absent", "late", "missing"].includes(normalize(s.status))).length;
    const scheduled = statuses.length;
    return { clockedIn, onBreak, missing, scheduled };
  }, [todayStatus]);

  const weekStatusIsPlaceholder = todayStatus?.week_is_placeholder === true;
  const weekAvailIsPlaceholder = availability?.week_is_placeholder === true;

  const hasWeekStatus = Array.isArray(todayStatus?.week) && !weekStatusIsPlaceholder;
  const hasWeekAvailability =
    availability &&
    !weekAvailIsPlaceholder &&
    (availability.week_gaps !== undefined ||
      availability.week_understaffed !== undefined ||
      availability.week_ok !== undefined);
  const hasWeek = hasWeekStatus || hasWeekAvailability;

  const pickRange = (arr) => {
    if (range === "week" && hasWeekStatus) return arr.week;
    return arr;
  };

  const compliance = React.useMemo(() => {
    const statuses = pickRange(todayStatus) || [];
    const missedBreaks = statuses.filter((s) => s?.missed_break || s?.break_missed || (s?.status || "").toLowerCase() === "missed_break").length;
    const overtimeRisk = statuses.filter((s) => s?.overtime_risk || s?.ot_risk).length;
    const anomalies = statuses.reduce((acc, s) => acc + (Number(s?.anomalies || s?.anomaly_count || 0) || 0), 0);
    const late = statuses.filter((s) => (s?.status || "").toLowerCase() === "late").length;
    const missing = statuses.filter((s) => (s?.status || "").toLowerCase() === "absent").length;
    const earlyLeave = statuses.filter((s) => (s?.status || "").toLowerCase() === "early_leave").length;
    return { missedBreaks, overtimeRisk, anomalies, late, missing, earlyLeave };
  }, [todayStatus, range]);

  const payrollReadiness = React.useMemo(() => {
    const statuses = pickRange(todayStatus) || [];
    const approved = statuses.filter((s) => s?.approved || s?.punch_approved).length;
    const pending = statuses.filter((s) => s?.approved === false || s?.punch_approved === false).length;
    const total = approved + pending;
    const pctApproved = total ? Math.round((approved / total) * 100) : 0;
    const hoursWeek = statuses.reduce((acc, s) => acc + (Number(s?.hours_week || s?.hours_this_week || 0) || 0), 0);
    return { pctApproved, pending, hoursWeek };
  }, [todayStatus, range]);

  const coverageHealth = React.useMemo(() => {
    const gapsToday = availability?.low ?? 0;
    const understaffedToday = availability?.understaffed ?? 0;
    const swaps = pendingSwaps || 0;
    const weekGaps = range === "week" && !weekAvailIsPlaceholder ? (availability?.week_gaps ?? 0) : 0;
    const weekUnder = range === "week" && !weekAvailIsPlaceholder ? (availability?.week_understaffed ?? 0) : 0;
    return {
      gapsToday: range === "week" ? weekGaps : gapsToday,
      understaffed: range === "week" ? weekUnder : understaffedToday,
      swaps,
    };
  }, [availability, pendingSwaps, range, weekAvailIsPlaceholder]);

  const managerActions = React.useMemo(() => {
    return {
      swapsPending: pendingSwaps || 0,
      approvalsNeeded: awaitingManagerSwaps || 0,
    };
  }, [pendingSwaps, awaitingManagerSwaps]);

  const goToManagerActions = () => {
    if (managerActions.approvalsNeeded > 0) {
      navigate("/manager/swap-approvals");
    } else {
      navigate("/manager/swap-approvals");
    }
  };

  React.useEffect(() => {
    if (range === "week" && !hasWeek) {
      setRange("today");
    }
  }, [range, hasWeek]);

  /* ───────────── render ──────────── */
  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time operations, compliance, and payroll visibility.
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            size="small"
            variant={range === "today" ? "contained" : "outlined"}
            onClick={() => setRange("today")}
          >
            Today
          </Button>
          <Button
            size="small"
            variant={range === "week" ? "contained" : "outlined"}
            disabled={!hasWeek}
            onClick={() => setRange("week")}
          >
            This Week
          </Button>
          {!hasWeek && (
            <Typography variant="caption" color="text.secondary">
              {weekStatusIsPlaceholder || weekAvailIsPlaceholder
                ? "Week view coming soon."
                : "Week metrics not available yet."}
            </Typography>
          )}
        </Box>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* NEW KPI row */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <PeopleIcon />,
                "Live Workforce",
                `In: ${liveWorkforce.clockedIn} • Break: ${liveWorkforce.onBreak} • Missing: ${liveWorkforce.missing} • Scheduled: ${liveWorkforce.scheduled}`,
                "#1976d2",
                () => navigate("/manager/time-tracking?filter=missing")
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <WarningAmberIcon />,
                "Compliance Alerts",
                `Missed breaks: ${compliance.missedBreaks} • OT risk: ${compliance.overtimeRisk} • Anomalies: ${compliance.anomalies} • Late: ${compliance.late} • Missing: ${compliance.missing} • Early leave: ${compliance.earlyLeave}`,
                compliance.missedBreaks || compliance.overtimeRisk ? "#d32f2f" : "#f57c00",
                () => navigate("/manager/attendance-summaries?view=issues")
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <PendingActionsIcon />,
                "Payroll Readiness",
                `Approved: ${payrollReadiness.pctApproved}% • Pending: ${payrollReadiness.pending} • Hours (${range === "week" ? "wk" : "day"}): ${payrollReadiness.hoursWeek.toFixed(1)}`,
                "#00796b",
                () => navigate("/manager/payroll?view=approvals")
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <SwapHorizIcon />,
                "Pending Manager Actions",
                `Swap requests: ${managerActions.swapsPending} • Approvals needed: ${managerActions.approvalsNeeded}`,
                managerActions.swapsPending || managerActions.approvalsNeeded ? "#d32f2f" : "#455a64",
                goToManagerActions
              )}
            </Grid>
          </Grid>

          {/* ORIGINAL metric grid (call-center focus) */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(<PeopleIcon />, "Team Members", teamCount)}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <EventIcon />,
                "Shifts Today",
                todayStatus.length,
                "#00796b"
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <BeachAccessIcon />,
                "Pending Leaves",
                leaves.length,
                "#f57c00"
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <AccessTimeIcon />,
                "Checked-in Today",
                todayStatus.filter((s) => s.status === "present").length,
                "#303f9f"
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <BusinessCenterIcon />,
                "Departments",
                departments,
                "#455a64"
              )}
            </Grid>
          </Grid>

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 700 }}>
            Product Operations
          </Typography>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              {renderCard(
                <BusinessCenterIcon />,
                "Product Snapshot",
                `Orders: ${productOrdersSummary.total} • Paid: ${productOrdersSummary.paid} • Pending: ${productOrdersSummary.pending} • Backorder: ${productOrdersSummary.backorder}`,
                "#1565c0",
                () => navigate("/manager/dashboard?tab=product-orders")
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderCard(
                <WarningAmberIcon />,
                "Product Risk",
                `Low stock: ${productLowStockSummary.count} • Out of stock: ${productLowStockSummary.out_of_stock_count} • Inventory actions: ${productOrdersSummary.inventory_action_required} • Untracked shipping: ${productOrdersSummary.untracked_shipping}`,
                productLowStockSummary.count || productOrdersSummary.inventory_action_required ? "#d32f2f" : "#2e7d32",
                () => navigate("/manager/dashboard?tab=products")
              )}
            </Grid>
          </Grid>

          {/* Service/booking metrics (for booking-heavy orgs) */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 700 }}>
            Service & Booking Metrics
          </Typography>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <EventIcon />,
                "Booking Availability",
                `Low availability: ${availability.low}`,
                "#d32f2f",
                () => navigate("/manager/availability")
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <SwapHorizIcon />,
                "Swap Requests",
                pendingSwaps,
                "#6a1b9a",
                () => navigate("/manager/swap-approvals")
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <PendingActionsIcon />,
                "Awaiting Approval",
                awaitingManagerSwaps,
                "#c2185b",
                () => navigate("/manager/swap-approvals")
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <BusinessCenterIcon />,
                "Advanced Booking Analytics",
                "Utilization trend • No-show rate",
                "#1976d2",
                () => navigate("/manager/analytics")
              )}
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <OnboardingWidget
                onViewAll={() => navigate("/manager/onboarding")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <AttendanceSummaryCard
                onViewReport={() =>
                  navigate("/manager/attendance-summaries")
                }
              />
            </Grid>
          </Grid>

          {/* activity + availability panels */}
          <Grid container spacing={3} sx={{ mt: 4 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                {activityFeed.length === 0 ? (
                  <Typography color="text.secondary">
                    No recent actions.
                  </Typography>
                ) : (
                  <List dense>
                    {activityFeed.map((a) => (
                      <ListItem key={a.id} disableGutters>
                        <ListItemText primary={a.title} secondary={a.when} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Availability Snapshot
                </Typography>
                <Typography variant="subtitle1">
                  OK coverage: <strong>{availability.ok}</strong>
                  <br />
                  Gaps / TBD: <strong>{availability.low}</strong>
                </Typography>
                <Tooltip title="Detailed view coming soon">
                  <Button disabled size="small" sx={{ mt: 2 }}>
                    Staffing Calendar
                  </Button>
                </Tooltip>
              </Card>
            </Grid>
          </Grid>

          {/* quick links */}
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Button
              variant="contained"
              sx={{ mr: 2, mb: 1 }}
              onClick={() => navigate("/manager/team")}
            >
              Manage Team
            </Button>
            <Button
              variant="outlined"
              sx={{ mr: 2, mb: 1 }}
              onClick={() => navigate("/manager/payroll")}
            >
              Payroll Summary
            </Button>
            <Button variant="outlined" sx={{ mb: 1 }} disabled>
              More Analytics (coming soon)
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Overview;
