import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import { getUserTimezone } from "../../utils/timezone";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";

const ClientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const userTimezone = getUserTimezone();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/api/client/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(data.bookings || []);
    } catch {
      setError("Could not fetch appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const handler = () => fetchAppointments();
    window.addEventListener("booking:changed", handler);
    return () => window.removeEventListener("booking:changed", handler);
  }, [fetchAppointments]);

  const handleCancelBooking = async () => {
    if (!selectedAppt) return;

    try {
      await axios.post(
        `/public/${selectedAppt.slug}/appointment/${selectedAppt.id}/cancel?token=${selectedAppt.cancel_token}`
      );
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === selectedAppt.id ? { ...appt, status: "cancelled" } : appt
        )
      );
      setConfirmOpen(false);
    } catch {
      setError("Failed to cancel booking. Try again later.");
    }
  };

  const openCancelDialog = (appt) => {
    setSelectedAppt(appt);
    setConfirmOpen(true);
  };

  const closeCancelDialog = () => {
    setConfirmOpen(false);
    setSelectedAppt(null);
  };

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        My Appointments
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : appointments.length === 0 ? (
        <Typography>No appointments found.</Typography>
      ) : (
        <Box>
          {appointments.map((appt) => {
            // Build display date/time from UTC + timezone
            const tz = appt.timezone || userTimezone;
            const startIso = isoFromParts(appt.date, appt.start_time, tz);
            const startDateObj = new Date(startIso);

            const displayDate = formatDate(startDateObj);
            const displayTime = formatTime(startDateObj);

            return (
              <Card key={appt.id} sx={{ mb: 2, borderLeft: "5px solid #1976d2" }}>
                <CardContent>
                  <Typography variant="h6">{appt.service}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Employee: {appt.employee}
                  </Typography>
                  <Typography variant="body2">
                    Date: <b>{displayDate}</b> | Time: <b>{displayTime}</b>
                  </Typography>
                  <Typography variant="body2">
                    Status:{" "}
                    <b style={{ color: appt.status === "cancelled" ? "red" : "green" }}>
                      {appt.status}
                    </b>
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  {appt.status !== "cancelled" && (
                    <Button variant="outlined" color="error" onClick={() => openCancelDialog(appt)}>
                      Cancel Booking
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog open={confirmOpen} onClose={closeCancelDialog}>
        <DialogTitle>Cancel Booking?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to cancel this appointment?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog}>No</Button>
          <Button color="error" onClick={handleCancelBooking}>
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClientAppointments;
