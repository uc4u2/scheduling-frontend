import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Alert,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField
} from "@mui/material";
import api from "./utils/api";

const CandidateManagement = ({ token }) => {
  // State for bookings data
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updateError, setUpdateError] = useState("");

  // State for editing a booking
  const [editingBooking, setEditingBooking] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    candidate_name: "",
    candidate_email: "",
    candidate_position: "",
    date: "",
    start_time: "",
    end_time: "",
    meeting_link: ""
  });

  // Fetch bookings from the new endpoint using the /api prefix
  const fetchBookings = async () => {
    try {
      const res = await api.get("/api/candidate/get-bookings");
      setBookings(res.data.bookings || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch bookings");
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token]);

  // Open dialog to edit booking
  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setBookingForm({
      candidate_name: booking.candidate_name || "",
      candidate_email: booking.candidate_email || "",
      candidate_position: booking.candidate_position || "",
      date: booking.date || "",
      start_time: booking.start_time || "",
      end_time: booking.end_time || "",
      meeting_link: booking.meeting_link || ""
    });
    setDialogOpen(true);
  };

  // Handle form changes
  const handleFormChange = (e) => {
    setBookingForm({
      ...bookingForm,
      [e.target.name]: e.target.value
    });
  };

  // Save updated booking via the new endpoint
  const handleSave = async () => {
    try {
      await api.put(`/api/candidate/bookings/${editingBooking.id}`, bookingForm);
      setMessage("Booking updated successfully.");
      setDialogOpen(false);
      setEditingBooking(null);
      fetchBookings();
    } catch (err) {
      setUpdateError(err.response?.data?.error || "Failed to update booking");
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Candidate Management - Recent Bookings
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {updateError && <Alert severity="error" sx={{ mb: 2 }}>{updateError}</Alert>}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Bookings
        </Typography>
        {bookings && bookings.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Candidate</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Recruiter</TableCell>
                <TableCell>Meeting</TableCell>
                <TableCell>Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.candidate_name}</TableCell>
                  <TableCell>{booking.candidate_email}</TableCell>
                  <TableCell>{booking.candidate_position}</TableCell>
                  <TableCell>{booking.date}</TableCell>
                  <TableCell>{booking.start_time}</TableCell>
                  <TableCell>{booking.end_time}</TableCell>
                  <TableCell>{booking.recruiter}</TableCell>
                  <TableCell>
                    <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer">
                      Join
                    </a>
                  </TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => handleEdit(booking)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography>No recent bookings found.</Typography>
        )}
      </Paper>

      {/* Booking Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit Booking</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Candidate Name"
                name="candidate_name"
                value={bookingForm.candidate_name}
                onChange={handleFormChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Candidate Email"
                name="candidate_email"
                value={bookingForm.candidate_email}
                onChange={handleFormChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Position"
                name="candidate_position"
                value={bookingForm.candidate_position}
                onChange={handleFormChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Date"
                name="date"
                type="date"
                value={bookingForm.date}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                margin="dense"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Start Time"
                name="start_time"
                type="time"
                value={bookingForm.start_time}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                margin="dense"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="End Time"
                name="end_time"
                type="time"
                value={bookingForm.end_time}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Meeting Link"
                name="meeting_link"
                value={bookingForm.meeting_link}
                onChange={handleFormChange}
                fullWidth
                margin="dense"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CandidateManagement;
