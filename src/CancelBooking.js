// src/CancelBooking.js
import React, { useState } from "react";
import { Container, TextField, Button, Alert, Typography, Paper } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CancelBooking = () => {
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [invitationToken, setInvitationToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleCancel = async () => {
    if (!candidateName || !candidateEmail || !invitationToken) {
      setError("Candidate name, email, and invitation token are required.");
      return;
    }
    try {
      const response = await axios.post("https://scheduling-application.onrender.com/public/cancel-booking", {
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        invitation_token: invitationToken,
      });
      setMessage(response.data.message);
      setError("");
      // Optionally, redirect to booking page after successful cancellation
      setTimeout(() => {
        navigate("/book-slot"); // Update route as needed
      }, 2000);
    } catch (err) {
      console.error("Cancellation error:", err);
      setError(err.response?.data?.error || "Cancellation failed.");
    }
  };

  return (
    <Container sx={{ mt: 5, maxWidth: "sm" }}>
      <Paper sx={{ p: 3 }} elevation={3}>
        <Typography variant="h4" gutterBottom>
          Cancel Booking
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        <TextField
          label="Your Name"
          fullWidth
          margin="normal"
          value={candidateName}
          onChange={(e) => setCandidateName(e.target.value)}
        />
        <TextField
          label="Your Email"
          fullWidth
          margin="normal"
          value={candidateEmail}
          onChange={(e) => setCandidateEmail(e.target.value)}
        />
        <TextField
          label="Invitation Token"
          fullWidth
          margin="normal"
          value={invitationToken}
          onChange={(e) => setInvitationToken(e.target.value)}
          helperText="Enter the invitation token from your email"
        />
        <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleCancel}>
          Cancel Booking
        </Button>
      </Paper>
    </Container>
  );
};

export default CancelBooking;
