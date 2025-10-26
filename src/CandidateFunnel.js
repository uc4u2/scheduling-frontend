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

const CandidateFunnel = ({ token }) => {
  const [funnel, setFunnel] = useState({});
  const [error, setError] = useState("");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchFunnel = async () => {
      try {
        const response = await axios.get(`${API_URL}/manager/funnel`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFunnel(response.data.funnel);
      } catch (err) {
        setError("Failed to fetch funnel data");
      }
    };

    if (token) fetchFunnel();
  }, [token, API_URL]);

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Candidate Funnel
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Stage</TableCell>
              <TableCell>Number of Candidates</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(funnel).map(([stage, count]) => (
              <TableRow key={stage}>
                <TableCell>{stage}</TableCell>
                <TableCell>{count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default CandidateFunnel;
