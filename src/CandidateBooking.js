// src/CandidateBooking.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
} from "@mui/material";
import axios from "axios";

const CandidateBooking = () => {
  const { recruiterId, token: invitationToken } = useParams();
  console.log("Invitation Token:", invitationToken);

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePosition, setCandidatePosition] = useState(""); // New field for position
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Use an environment variable for the backend API URL.
  const API_URL = process.env.REACT_APP_API_URL || "https://scheduling-application.onrender.com";

  // Fetch available slots for the given recruiter.
  const fetchSlots = async () => {
    try {
      const response = await axios.get(`${API_URL}/public/availability/${recruiterId}`);
      setSlots(response.data.available_slots);
    } catch (err) {
      console.error(err);
      setError("Failed to load available slots.");
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [recruiterId]);

  // Group slots by date.
  const groupSlotsByDate = (slots) => {
    const grouped = {};
    slots.forEach((slot) => {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date].push(slot);
    });
    return grouped;
  };

  const groupedSlots = groupSlotsByDate(slots);

  // Handle booking confirmation, including the candidate position.
  const handleConfirmBooking = async () => {
    if (!candidateName || !candidateEmail || !candidatePosition) {
      setError("Please enter your name, email, and position.");
      return;
    }
    if (!selectedSlot) {
      setError("Please select a slot to book.");
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/public/book-slot`, {
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        candidate_position: candidatePosition, // Include position in payload
        availability_id: selectedSlot.id,
        invitation_token: invitationToken,
      });
      setMessage(response.data.message);
      setError("");
      fetchSlots();
      setSelectedSlot(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Booking failed.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Book an Interview Slot
      </Typography>
      <Typography variant="subtitle1">
        Booking page for recruiter ID: {recruiterId}
      </Typography>
      <TextField
        label="Invitation Token"
        fullWidth
        margin="normal"
        value={invitationToken}
        disabled
      />
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}

      {Object.keys(groupedSlots).length > 0 ? (
        Object.keys(groupedSlots)
          .sort()
          .map((date) => (
            <Box key={date} sx={{ mt: 3 }}>
              <Typography variant="h6">Date: {date}</Typography>
              <Grid container spacing={2}>
                {groupedSlots[date].map((slot) => (
                  <Grid item xs={12} sm={6} md={4} key={slot.id}>
                    <Box
                      sx={{
                        border: "1px solid #ddd",
                        p: 2,
                        borderRadius: 2,
                        backgroundColor:
                          selectedSlot && selectedSlot.id === slot.id
                            ? "#e0f7fa"
                            : "inherit",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <Typography>Start: {slot.start_time}</Typography>
                      <Typography>End: {slot.end_time}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))
      ) : (
        <Typography sx={{ mt: 3 }}>No available slots at the moment.</Typography>
      )}

      {selectedSlot && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Confirm Your Booking</Typography>
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
            label="Position Applied For"
            fullWidth
            margin="normal"
            value={candidatePosition}
            onChange={(e) => setCandidatePosition(e.target.value)}
          />
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleConfirmBooking}
          >
            Confirm Booking
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CandidateBooking;
