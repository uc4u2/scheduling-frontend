// src/components/Overview.js

import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Overview = () => {
  const [teamCount, setTeamCount] = useState(0);
  const [meetings, setMeetings] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [todayStatus, setTodayStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const navigate = useNavigate();

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [teamRes, meetRes, leaveRes, todayRes] = await Promise.all([
        axios.get(`${API_URL}/manager/recruiters`, { headers }),
        axios.get(`${API_URL}/manager/calendar`, { headers }),
        axios.get(`${API_URL}/leaves/pending`, { headers }),
        axios.get(`${API_URL}/team/status/today`, { headers }),
      ]);

      setTeamCount(
        Array.isArray(teamRes.data.recruiters)
          ? teamRes.data.recruiters.length
          : 0
      );
      setMeetings(meetRes.data.events || []);
      setLeaves(leaveRes.data.leaves || []);
      setTodayStatus(todayRes.data.statuses || []);
    } catch (err) {
      console.error("Error fetching overview data:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (icon, title, value, color = "#1976d2", onClick) => (
    <Card
      sx={{
        display: "flex",
        alignItems: "center",
        p: 2,
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
          width: 50,
          height: 50,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="h5" fontWeight={700}>
          {value}
        </Typography>
      </Box>
    </Card>
  );

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
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(<PeopleIcon />, "Team Members", teamCount)}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <EventIcon />,
                "Upcoming Meetings",
                meetings.length,
                "#00796b",
                () => navigate("/manager/meetings")
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <BeachAccessIcon />,
                "Pending Leaves",
                leaves.length,
                "#f57c00",
                () => navigate("/manager/leaves")
              )}
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              {renderCard(
                <AccessTimeIcon />,
                "Checked In Today",
                todayStatus.filter((s) => s.status === "present").length,
                "#303f9f"
              )}
            </Grid>
          </Grid>

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
            <Button
              variant="outlined"
              sx={{ mb: 1 }}
              onClick={() => navigate("/manager/settings")}
            >
              Organization Settings
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Overview;
