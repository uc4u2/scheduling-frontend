// src/CandidateManager.js
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  Box,
  Button,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const toConversionLabel = (value) => {
  const status = (value || "").toLowerCase();
  if (!status || status === "none") return "Not requested";
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status;
};
const toConversionColor = (value) => {
  const status = (value || "").toLowerCase();
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  if (status === "pending") return "warning";
  return "default";
};

const CandidateManager = ({ token }) => {
  const [candidates, setCandidates] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});
  const [error, setError] = useState("");

  // Fetch candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await axios.get(`${API_URL}/recruiter/candidates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Fetched candidates:", res.data);
        setCandidates(res.data);
      } catch (err) {
        console.error("Error fetching candidates:", err.response || err);
        setError("Failed to fetch candidates.");
      }
    };

    if (token) {
      fetchCandidates();
    }
  }, [token]);

  // Update candidate field
  const updateCandidate = async (id, field, value) => {
    try {
      const updatedCandidate = { [field]: value };
      await axios.put(`${API_URL}/recruiter/candidates/${id}`, updatedCandidate, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSaveStatus((prev) => ({ ...prev, [id]: "Saved!" }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [id]: null }));
      }, 2000);
    } catch (err) {
      console.error("Update error:", err);
      setSaveStatus((prev) => ({ ...prev, [id]: "Error saving changes." }));
    }
  };

  // Handle field change
  const handleChange = (id, field, value) => {
    const updated = candidates.map((c) =>
      c.id === id ? { ...c, [field]: value } : c
    );
    setCandidates(updated);
    updateCandidate(id, field, value);
  };

  return (
    <Box sx={{ mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Your Candidates
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {candidates.length === 0 && !error && (
        <Typography>No candidates found.</Typography>
      )}

      {candidates.map((c) => (
        <Card key={c.id} sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">
                {c.name} ({c.email})
              </Typography>
              <Chip
                size="small"
                label={`Conversion: ${toConversionLabel(c.conversion_status)}`}
                color={toConversionColor(c.conversion_status)}
                variant={c.conversion_status ? "filled" : "outlined"}
              />
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <TextField
              label="Job Applied"
              fullWidth
              margin="dense"
              value={c.job_applied}
              onChange={(e) =>
                handleChange(c.id, "job_applied", e.target.value)
              }
            />
            <TextField
              label="Status"
              fullWidth
              margin="dense"
              value={c.status}
              onChange={(e) => handleChange(c.id, "status", e.target.value)}
            />
            <TextField
              label="Interview Stage"
              fullWidth
              margin="dense"
              value={c.interview_stage}
              onChange={(e) =>
                handleChange(c.id, "interview_stage", e.target.value)
              }
            />
            <TextField
              label="Feedback"
              fullWidth
              multiline
              rows={2}
              margin="dense"
              value={c.feedback}
              onChange={(e) => handleChange(c.id, "feedback", e.target.value)}
            />

            {saveStatus[c.id] && (
              <Alert
                severity={
                  saveStatus[c.id] === "Saved!" ? "success" : "error"
                }
                sx={{ mt: 2 }}
              >
                {saveStatus[c.id]}
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default CandidateManager;
