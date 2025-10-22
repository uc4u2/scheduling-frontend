import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Alert,
} from "@mui/material";
import axios from "axios";

const RecruiterAvailabilityTracker = ({ token }) => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState("");

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/availability-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data.availability_summary);
      setError("");
    } catch (err) {
      setError("Failed to fetch availability summary");
    }
  };

  useEffect(() => {
    if (token) {
      fetchSummary();
    }
  }, [token]);

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Recruiter Availability Tracker
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Recruiter</TableCell>
              <TableCell>Total Slots</TableCell>
              <TableCell>Booked Slots</TableCell>
              <TableCell>Available Slots</TableCell>
              <TableCell>% Booked</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>{item.recruiter}</TableCell>
                <TableCell>{item.total_slots}</TableCell>
                <TableCell>{item.booked_slots}</TableCell>
                <TableCell>{item.available_slots}</TableCell>
                <TableCell>{item.percentage_booked}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default RecruiterAvailabilityTracker;
