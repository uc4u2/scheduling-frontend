// src/AnalyticsDashboard.js
import React, { useState, useEffect } from "react";
import { Container, Typography, Card, CardContent, Grid, Alert } from "@mui/material";
import axios from "axios";

const AnalyticsDashboard = ({ token }) => {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  // Use an environment variable for the backend API URL.
  // Make sure to set REACT_APP_API_URL in your frontend's .env file.
  const API_URL = process.env.REACT_APP_API_URL || "https://scheduling-application.onrender.com";

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(response.data);
    } catch (err) {
      setError("Failed to fetch analytics");
    }
  };

  useEffect(() => {
    if (token) fetchAnalytics();
  }, [token]);

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {analytics && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Bookings</Typography>
                <Typography variant="h4">{analytics.total_bookings}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Upcoming Bookings</Typography>
                <Typography variant="h4">{analytics.upcoming_bookings}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AnalyticsDashboard;