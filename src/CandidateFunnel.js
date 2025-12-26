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
import api from "./utils/api";

const CandidateFunnel = ({ token }) => {
  const [funnel, setFunnel] = useState({});
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchFunnel = async () => {
      try {
        const response = await api.get("/manager/funnel");
        setFunnel(response.data.funnel);
      } catch (err) {
        setError("Failed to fetch funnel data");
      }
    };

    if (token) fetchFunnel();
  }, [token]);

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
