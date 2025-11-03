// src/CandidateBooking.js

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Backdrop,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
} from "@mui/material";
import axios from "axios";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const CandidateBooking = () => {
  const { recruiterId, token: invitationToken } = useParams();
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [candidatePosition, setCandidatePosition] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [otherLink, setOtherLink] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [recruiterTimeZone, setRecruiterTimeZone] = useState("UTC");
  const [loadError, setLoadError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, severity: "info", message: "" });

  // “Enterprise” saving overlay
  const [saving, setSaving] = useState(false);
  const [savingStep, setSavingStep] = useState(0);
  const savingMessages = useMemo(
    () => [
      "🏢 updating schedule…",
      "📡 syncing calendars…",
      "🔄 propagating changes…",
      "🔔 notifying recruiter…",
      "🧭 reconfirming availability…",
      "✅ finalizing booking…",
    ],
    []
  );
  useEffect(() => {
    if (!saving) return;
    const id = setInterval(
      () => setSavingStep((s) => (s + 1) % savingMessages.length),
      900
    );
    return () => clearInterval(id);
  }, [saving, savingMessages.length]);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await axios.get(`${API_URL}/public/availability/${recruiterId}`);
        setSlots(response.data.available_slots);
        setRecruiterTimeZone(response.data.timezone || "UTC");
        setLoadError("");
      } catch (err) {
        console.error(err);
        setLoadError("Failed to load available slots.");
      }
    };
    fetchSlots();
  }, [recruiterId, API_URL]);

  const upcomingSlots = useMemo(() => {
    const now = new Date();
    return (slots || [])
      .filter((slot) => {
        if (!slot?.date || !slot?.start_time) return false;
        const slotStart = new Date(`${slot.date}T${slot.start_time}`);
        return slotStart >= now;
      })
      .sort((a, b) =>
        new Date(`${a.date}T${a.start_time}`) - new Date(`${b.date}T${b.start_time}`)
      );
  }, [slots]);

  const groupedSlots = useMemo(() => {
    return upcomingSlots.reduce((acc, slot) => {
      (acc[slot.date] = acc[slot.date] || []).push(slot);
      return acc;
    }, {});
  }, [upcomingSlots]);

  const sortedDateKeys = useMemo(() =>
    Object.keys(groupedSlots).sort((a, b) => new Date(`${a}T00:00:00`) - new Date(`${b}T00:00:00`)),
  [groupedSlots]);

  const dateHeadingFormatter = useMemo(() =>
    new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
  []);

  const formatDateHeading = (dateStr) => {
    try {
      return dateHeadingFormatter.format(new Date(`${dateStr}T00:00:00`));
    } catch (error) {
      return dateStr;
    }
  };

  const formatTime = (dateStr, timeStr, tz) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(date);
  };

  const handleConfirmBooking = async () => {
    if (saving) return; // double-submit protection
    if (!candidateName || !candidateEmail || !candidatePosition || !candidatePhone) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Please enter your name, email, phone, and position.",
      });
      return;
    }
    if (!selectedSlot) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Please select a slot to book.",
      });
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("candidate_name", candidateName);
      formData.append("candidate_email", candidateEmail);
      formData.append("candidate_phone", candidatePhone);
      formData.append("candidate_position", candidatePosition);
      formData.append("availability_id", selectedSlot.id);
      formData.append("invitation_token", invitationToken);
      formData.append("linkedin", linkedin);
      formData.append("other_link", otherLink);
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      const response = await axios.post(`${API_URL}/public/book-slot`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const successMessage =
        response.data?.message || "Interview slot booked successfully!";
      setSlots((prev) => prev.filter((slot) => slot.id !== selectedSlot.id));
      setSnackbar({ open: true, severity: "success", message: successMessage });
      setSelectedSlot(null);
      setResumeFile(null);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.error || err.message || "Booking failed.";
      setSnackbar({ open: true, severity: "error", message: errorMessage });
    } finally {
      setSaving(false);
      setSavingStep(0);
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Book an Interview Slot
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Booking page for recruiter ID: {recruiterId}
      </Typography>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}

            {sortedDateKeys.length > 0 ? (
        sortedDateKeys.map((date, index) => {
          const slotsForDate = groupedSlots[date] || [];
          return (
            <Accordion
              key={date}
              defaultExpanded={index === 0}
              sx={{ mt: index === 0 ? 3 : 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box>
                  <Typography variant="h6">{formatDateHeading(date)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {slotsForDate.length} {slotsForDate.length === 1 ? "slot" : "slots"} available — Times shown in {recruiterTimeZone}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1.5}>
                  {slotsForDate.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <Grid item xs={12} sm={6} md={4} key={slot.id}>
                        <Button
                          fullWidth
                          variant={isSelected ? "contained" : "outlined"}
                          color={isSelected ? "primary" : "inherit"}
                          onClick={() => setSelectedSlot(slot)}
                          sx={{ justifyContent: "space-between", py: 1.5 }}
                        >
                          <span>
                            {formatTime(slot.date, slot.start_time, recruiterTimeZone)} - {formatTime(slot.date, slot.end_time, recruiterTimeZone)}
                          </span>
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })
      ) : (
        <Typography sx={{ mt: 3 }}>No upcoming slots are currently available. Please check back soon.</Typography>
      )}

      {selectedSlot && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Confirm Your Booking
          </Typography>

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
            label="Your Phone Number"
            fullWidth
            margin="normal"
            value={candidatePhone}
            onChange={(e) => setCandidatePhone(e.target.value)}
          />
          <TextField
            label="Position Applied For"
            fullWidth
            margin="normal"
            value={candidatePosition}
            onChange={(e) => setCandidatePosition(e.target.value)}
          />
          <TextField
            label="LinkedIn Profile (optional)"
            fullWidth
            margin="normal"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
          />
          <TextField
            label="Other Link (e.g., portfolio)"
            fullWidth
            margin="normal"
            value={otherLink}
            onChange={(e) => setOtherLink(e.target.value)}
          />

          <Typography sx={{ mt: 2, mb: 1 }}>
            Upload Resume (PDF or DOC):
          </Typography>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResumeFile(e.target.files[0])}
          />

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            onClick={handleConfirmBooking}
            disabled={saving}
          >
            {saving ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1 }} />
                Working…
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </Box>
      )}

      <Snackbar

        open={snackbar.open}

        autoHideDuration={4000}

        onClose={handleCloseSnackbar}

        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}

      >

        <Alert

          onClose={handleCloseSnackbar}

          severity={snackbar.severity}

          sx={{ width: "100%" }}

        >

          {snackbar.message}

        </Alert>

      </Snackbar>



      {/* Enterprise-grade saving overlay */}
      <Backdrop
        open={saving}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 2 }}
      >
        <Paper elevation={6} sx={{ p: 3, maxWidth: 420, textAlign: "center" }}>
          <Typography variant="overline" color="text.secondary">
            enterprise-grade
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            Processing your booking…
          </Typography>
          <Box
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <CircularProgress size={20} />
            <Typography role="status" aria-live="polite">
              {savingMessages[savingStep]}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ display: "block", mt: 2 }} color="text.secondary">
            Please don’t close or click back.
          </Typography>
        </Paper>
      </Backdrop>
    </Box>
  );
};

export default CandidateBooking;
