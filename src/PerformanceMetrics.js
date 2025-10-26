import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  Paper,
} from "@mui/material";
import axios from "axios";

const PerformanceMetrics = ({ token }) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const response = await axios.get(`${API_URL}/manager/performance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data.performance);
      } catch (err) {
        setError("Failed to fetch performance metrics");
      }
    };

    if (token) fetchPerformance();
  }, [token, API_URL]);

  // Helper: convert seconds to "X min Y sec"
  const formatSeconds = (sec) => {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes} min ${seconds} sec`;
  };

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Recruiter Performance Metrics
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Recruiter</TableCell>
              <TableCell>Candidates Per Week</TableCell>
              <TableCell>Avg Time to Schedule</TableCell>
              <TableCell>Interview-to-Offer Ratio</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((rec, idx) => (
              <TableRow key={idx}>
                <TableCell>{rec.recruiter}</TableCell>
                <TableCell>{rec.candidates_per_week}</TableCell>
                <TableCell>{formatSeconds(rec.avg_time_to_schedule)}</TableCell>
                <TableCell>{rec.interview_to_offer_ratio.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default PerformanceMetrics;
