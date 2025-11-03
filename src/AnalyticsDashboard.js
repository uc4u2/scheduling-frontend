// src/AnalyticsDashboard.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Button,
} from "@mui/material";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { CSVLink } from "react-csv";

const AnalyticsDashboard = ({ token }) => {
  const [analytics, setAnalytics] = useState(null);
  const [funnelData, setFunnelData] = useState([]);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

  const fetchFunnel = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/funnel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const transformed = Object.entries(res.data.funnel).map(([stage, count]) => ({
        stage,
        candidates: count,
      }));
      setFunnelData(transformed);
    } catch (err) {
      setError("Failed to fetch funnel data");
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
      fetchFunnel();
    }
  }, [token]);

  const csvHeaders = [
    { label: "Stage", key: "stage" },
    { label: "Candidates", key: "candidates" },
  ];

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}

      {analytics && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
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

      {/* Candidate Funnel Chart */}
      {funnelData.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Candidate Funnel Visualization
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical" margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="stage" />
                <Tooltip />
                <Legend />
                <Bar dataKey="candidates" fill="#1976d2" name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
            <Button variant="outlined" sx={{ mt: 2 }}>
              <CSVLink data={funnelData} headers={csvHeaders} filename="funnel-report.csv" style={{ textDecoration: 'none', color: 'inherit' }}>
                Export Funnel CSV
              </CSVLink>
            </Button>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default AnalyticsDashboard;