// src/pages/client/ClientBookingHistory.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Button,
  DialogActions,
  Divider,
} from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";
import axios from "axios";
import PaymentHistory from "./PaymentHistory";

import { getUserTimezone } from "../../utils/timezone";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";

// Helper to set chip colors
function statusColor(status) {
  switch (status) {
    case "booked":
      return "primary";
    case "completed":
      return "success";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
}

export default function ClientBookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const userTimezone = getUserTimezone();

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("/api/client/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setBookings(res.data.bookings || []))
      .catch((err) => {
        console.error("Failed to load client booking history:", err);
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = () => localStorage.getItem("token");
    const handler = () => {
      axios
        .get("/api/client/bookings", {
          headers: { Authorization: 'Bearer ' + token() },
        })
        .then((res) => setBookings(res.data.bookings || []))
        .catch((err) => console.error("Failed to load client booking history:", err));
    };

    window.addEventListener("booking:changed", handler);
    return () => window.removeEventListener("booking:changed", handler);
  }, []);

  const handleViewBooking = (id) => {
    const token = localStorage.getItem("token");
    axios
      .get(`/api/client/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSelected(res.data);
        setDetailOpen(true);
      })
      .catch((err) => console.error("Failed to fetch booking details:", err));
  };

  const handleCancelBooking = async () => {
    if (!selected) return;
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.post(`/api/client/bookings/${selected.id}/cancel`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings((prev) =>
        prev.map((b) => (b.id === selected.id ? { ...b, status: "cancelled" } : b))
      );
      setSelected({ ...selected, status: "cancelled" });
    } catch (err) {
      alert("Failed to cancel booking. Please try again.");
    }
  };

  const downloadInvoice = async (bookingId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/invoices/${bookingId}?format=pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Invoice download failed.");
    }
  };

  if (loading) return <CircularProgress sx={{ mt: 3 }} />;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        My Bookings
      </Typography>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Invoice</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((b) => {
              const tz = b.timezone || userTimezone;
              const startIso = isoFromParts(b.date, b.start_time, tz);
              const startDateObj = new Date(startIso);
              const displayDate = formatDate(startDateObj);
              const displayTime = formatTime(startDateObj);

              return (
                <TableRow key={b.id}>
                  <TableCell>{displayDate} {displayTime}</TableCell>
                  <TableCell>{b.service || b.service_name}</TableCell>
                  <TableCell>{b.recruiter || b.recruiter_name}</TableCell>
                  <TableCell>
                    <Chip color={statusColor(b.status)} label={b.status.toUpperCase()} />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => downloadInvoice(b.id)}>
                      <GetAppIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleViewBooking(b.id)}>View</Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography align="center">No bookings found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          {selected ? (
            <Box>
              <Typography variant="h6" gutterBottom>Booking Details</Typography>

              {(() => {
                const tz = selected.timezone || userTimezone;
                const startIso = isoFromParts(selected.date, selected.start_time, tz);
                const endIso = isoFromParts(selected.date, selected.end_time, tz);
                const startDateObj = new Date(startIso);
                const endDateObj = new Date(endIso);
                const displayDate = formatDate(startDateObj);
                const displayStartTime = formatTime(startDateObj);
                const displayEndTime = formatTime(endDateObj);
                return (
                  <>
                    <Typography><b>Date:</b> {displayDate}</Typography>
                    <Typography><b>Time:</b> {displayStartTime} - {displayEndTime}</Typography>
                  </>
                );
              })()}

              <Typography><b>Service:</b> {selected.service}</Typography>
              <Typography><b>Employee:</b> {selected.recruiter}</Typography>
              <Typography>
                <b>Status:</b>
                <Chip color={statusColor(selected.status)} label={selected.status.toUpperCase()} sx={{ ml: 1 }} />
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>Payment History</Typography>
              <PaymentHistory appointmentId={selected.id} canRefund={false} />

              {selected.status !== "cancelled" && (
                <DialogActions>
                  <Button color="error" onClick={handleCancelBooking}>
                    Cancel Booking
                  </Button>
                </DialogActions>
              )}
            </Box>
          ) : (
            <Typography>Loading details...</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
