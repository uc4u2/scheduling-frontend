import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Button, LinearProgress, Stack,
  Table, TableBody, TableCell, TableHead, TableRow,
  Alert, TextField, Divider
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useParams, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import api from "./utils/api";

const RecruiterStats = ({ token }) => {
  const { recruiterId } = useParams();
  const navigate = useNavigate();

  const [recruiter, setRecruiter] = useState(null);
  const [goals, setGoals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [newGoal, setNewGoal] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) fetchStats();
  }, [recruiterId]);

  const fetchStats = async () => {
    try {
      const metricsRes = await api.get(`/manager/recruiters/${recruiterId}/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiter({
        name: metricsRes.data.name,
        email: metricsRes.data.email,
        timezone: metricsRes.data.timezone,
        role: metricsRes.data.role,
        status: "active",
      });
      setGoals(metricsRes.data.performance_goals || []);
      setLogs(metricsRes.data.audit_logs || []);

      const chartRes = await api.get(`/manager/recruiter-stats/${recruiterId}/chart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChartData({
        labels: chartRes.data.labels,
        values: chartRes.data.counts,
      });

      const bookingsRes = await api.get(`/manager/recruiter-stats/${recruiterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentBookings(bookingsRes.data.recent_bookings || []);

    } catch (err) {
      console.error(err);
      setError("Failed to load recruiter stats.");
    }
  };

  const handleExportPDF = () => {
    api
      .get(`/manager/recruiter-stats/${recruiterId}/export-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })
      .then((res) => {
        const blobURL = window.URL.createObjectURL(res.data);
        const link = document.createElement("a");
        link.href = blobURL;
        link.setAttribute("download", `Recruiter_Report_${recruiterId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => setError("Failed to download PDF."));
  };

  const handlePromote = async () => {
    try {
      await api.patch(`/manager/recruiters/${recruiterId}/promote`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Recruiter promoted to Manager.");
      fetchStats();
    } catch {
      setError("Failed to promote recruiter.");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/manager/recruiters/${recruiterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Recruiter deleted.");
      navigate("/manager/dashboard");
    } catch {
      setError("Failed to delete recruiter.");
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back to Dashboard
      </Button>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {recruiter && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>{recruiter.name}'s Profile</Typography>
          <Typography>Email: {recruiter.email}</Typography>
          <Typography>Role: {recruiter.role}</Typography>
          <Typography>Timezone: {recruiter.timezone}</Typography>
          <Typography>Status: {recruiter.status}</Typography>

          <Stack direction="row" spacing={2} mt={2}>
            <Button variant="outlined" startIcon={<TrendingUpIcon />} onClick={handlePromote}>
              Promote to Manager
            </Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
              Delete Recruiter
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportPDF}>
              Export to PDF
            </Button>
          </Stack>
        </Paper>
      )}

      {chartData && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>14-Day Candidate Activity</Typography>
          <Line data={{
            labels: chartData.labels,
            datasets: [{
              label: "Candidates Processed",
              data: chartData.values,
              borderColor: "#3f51b5",
              tension: 0.3,
              fill: false
            }],
          }} />
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Performance Goals</Typography>

        {goals.map((goal, idx) => (
          <Box key={goal.id} sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Goal Name"
                size="small"
                value={goal.goal_name}
                onChange={(e) => {
                  const updated = [...goals];
                  updated[idx].goal_name = e.target.value;
                  setGoals(updated);
                }}
              />
              <TextField
                label="Target"
                size="small"
                type="number"
                value={goal.target}
                onChange={(e) => {
                  const updated = [...goals];
                  updated[idx].target = parseInt(e.target.value);
                  setGoals(updated);
                }}
              />
              <Button variant="contained" onClick={async () => {
                try {
                  await api.put(`/manager/goals/${goal.id}`, goal, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  setMessage("Goal updated.");
                } catch {
                  setError("Failed to update goal.");
                }
              }}>Save</Button>
              <Button variant="outlined" color="error" onClick={async () => {
                try {
                  await api.delete(`/manager/goals/${goal.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  setGoals(goals.filter(g => g.id !== goal.id));
                  setMessage("Goal deleted.");
                } catch {
                  setError("Failed to delete goal.");
                }
              }}>Delete</Button>
            </Stack>
            <LinearProgress value={Math.min(goal.progress || 0, 100)} variant="determinate" sx={{ height: 10, mt: 1 }} />
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1">Add New Goal</Typography>
        <Stack direction="row" spacing={2} mt={1}>
          <TextField label="Goal Name" size="small" value={newGoal.name || ""} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })} />
          <TextField label="Target" size="small" type="number" value={newGoal.target || ""} onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) })} />
          <Button variant="contained" onClick={async () => {
            try {
              await api.post(`/manager/recruiters/${recruiterId}/goals`, {
                goal_name: newGoal.name,
                target: newGoal.target
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setMessage("Goal added.");
              setNewGoal({});
              fetchStats();
            } catch {
              setError("Failed to add goal.");
            }
          }}>Add Goal</Button>
        </Stack>
      </Paper>

      {recentBookings.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Recent Bookings</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Candidate</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentBookings.map((b, idx) => (
                <TableRow key={idx}>
                  <TableCell>{b.candidate_name}</TableCell>
                  <TableCell>{b.position}</TableCell>
                  <TableCell>{b.date}</TableCell>
                  <TableCell>{b.start_time}</TableCell>
                  <TableCell>{b.end_time}</TableCell>
                  <TableCell>{b.status || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Audit Log</Typography>
        {logs.length === 0 ? (
          <Typography>No logs available.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log, idx) => (
                <TableRow key={idx}>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
};

export default RecruiterStats;
