import React from "react";
import { Box, Grid, Card, Typography, LinearProgress, Paper, Stack, Chip } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function RecruiterComparisonPanel({ data }) {
  if (!data.length) return null;

  // Prepare data for the chart
  const barData = data.map(r => ({
    name: `${r.first_name} ${r.last_name}`,
    Bookings: r.total_bookings,
    "Conversion Rate": r.conversion_rate,
  }));

  return (
    <Box>
      {/* Cards for each recruiter */}
      <Grid container spacing={2} mb={3}>
        {data.map((r) => (
          <Grid item xs={12} sm={6} md={4} key={r.id}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6">{r.first_name} {r.last_name}</Typography>
              <Typography variant="body2" color="text.secondary">{r.department_name || "No Dept"}</Typography>
              <Stack spacing={1} mt={1}>
                <Typography>Total Bookings: <b>{r.total_bookings}</b></Typography>
                <Typography>Avg Duration: <b>{r.average_duration} min</b></Typography>
                <Typography>Conversion Rate: <Chip label={`${r.conversion_rate}%`} color="success" /></Typography>
                <Typography>Goal Completion:</Typography>
                <LinearProgress value={r.goal_completion_rate} variant="determinate" sx={{ mb: 1 }} />
                <Typography>Active Days: <Chip label={r.active_days} color="primary" /></Typography>
                <Typography>No-Show Rate: <Chip label={`${r.no_show_rate}%`} color="warning" /></Typography>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Chart for overall comparison */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>Bookings & Conversion Rate</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Bookings" fill="#1976d2" />
            <Bar dataKey="Conversion Rate" fill="#43a047" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
