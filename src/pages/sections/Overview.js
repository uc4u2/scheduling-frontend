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
import axios from "axios";
import OnboardingWidget from "../../components/management/OnboardingWidget";
import AttendanceSummaryCard from "../../components/management/AttendanceSummaryCard";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* helper: always return array */
  const asArray = (val, key) => {
    if (Array.isArray(val)) return val;
    if (key && Array.isArray(val?.[key])) return val[key];
    return [];
  };

  const safeGet = async (url, fallback) => {
    try {
      const { data } = await axios.get(url, { headers: authHeader });
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
      ] = await Promise.all([
        safeGet(`${API_URL}/manager/recruiters`, []),
        safeGet(`${API_URL}/api/departments`, []),
        safeGet(`${API_URL}/manager/calendar`, []),
        safeGet(`${API_URL}/leaves/pending`, []),
        safeGet(`${API_URL}/team/status/today`, []),
        safeGet(`${API_URL}/shift-swap-requests?status=pending`, []),
        safeGet(`${API_URL}/shift-swap-requests?status=peer_accepted`, []),
        safeGet(`${API_URL}/manager/availability-summary`, { ok: 0, low: 0 }),
        safeGet(`${API_URL}/manager/activity-feed`, []),
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

  /* ───────────── render below (unchanged from previous file) ──────────── */
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Dashboard Overview
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* metric grid */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(<PeopleIcon />, "Team Members", teamCount)}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <EventIcon />,
                "Upcoming Meetings",
                meetings.length,
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
                <SwapHorizIcon />,
                "Swap Requests",
                pendingSwaps,
                "#6a1b9a"
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <PendingActionsIcon />,
                "Awaiting Approval",
                awaitingManagerSwaps,
                "#c2185b"
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <WarningAmberIcon />,
                "Coverage Gaps",
                availability.low,
                "#d32f2f"
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
