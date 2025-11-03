// BookingChart.js
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const BookingChart = ({ data }) => {
  const theme = useTheme();
  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary }}>
        Booking Trends
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="date" stroke={theme.palette.text.primary} />
          <YAxis stroke={theme.palette.text.primary} />
          <Tooltip />
          <Bar dataKey="bookings" fill={theme.palette.primary.main} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default BookingChart;
