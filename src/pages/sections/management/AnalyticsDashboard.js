import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, CircularProgress } from "@mui/material";
import { Bar, Pie } from "react-chartjs-2";
import axios from "axios";
import Chart from "chart.js/auto";

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({});
  const [summary, setSummary] = useState({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Replace these with real API calls
        const stats = await axios.get("/api/analytics/summary");
        const bookings = await axios.get("/api/analytics/bookings");
        setSummary(stats.data);
        setChartData({
          labels: bookings.data.map(x => x.date),
          datasets: [
            {
              label: "Bookings",
              data: bookings.data.map(x => x.count),
              backgroundColor: "#1976d2",
            }
          ]
        });
      } catch {
        setSummary({});
        setChartData({});
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Analytics Dashboard</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2 }}>
              <Typography>Total Bookings</Typography>
              <Typography variant="h5">{summary.totalBookings ?? "—"}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2 }}>
              <Typography>Total Revenue</Typography>
              <Typography variant="h5">${summary.totalRevenue ?? "—"}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2 }}>
              <Typography>Active Users</Typography>
              <Typography variant="h5">{summary.activeUsers ?? "—"}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography mb={2}>Bookings Trend</Typography>
              <Bar data={chartData} />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AnalyticsDashboard;
