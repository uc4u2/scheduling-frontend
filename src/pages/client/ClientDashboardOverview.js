// src/pages/client/ClientDashboardOverview.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Typography, Grid, Card, CardContent, Skeleton, Button,
  Dialog, DialogContent, Divider, Chip, Link, Stack,
  IconButton, Tooltip
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../utils/api";
import { getUserTimezone } from "../../utils/timezone";

const bookingTimestamp = (booking) => {
  if (booking?.start_utc) {
    const dt = new Date(booking.start_utc);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  if (booking?.date && booking?.start_time) {
    const dt = new Date(`${booking.date}T${booking.start_time}:00Z`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  return null;
};

const bookingDisplay = (booking) => ({
  date: booking?.local_date || booking?.date || "",
  start: booking?.local_start_time || booking?.start_time || "",
  end: booking?.local_end_time || booking?.end_time || "",
});

export default function ClientDashboardOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const userTimezone = getUserTimezone();
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  useEffect(() => {
    const isMyBookings =
      typeof window !== "undefined" &&
      (window.location.search.includes("page=my-bookings") ||
        window.location.pathname.includes("/client/bookings"));
    if (!isMyBookings || !token) {
      setLoading(false);
      return;
    }
    loadEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTimezone, token]);

  function loadEverything() {
    setLoading(true);
    const now = new Date();

    // Core cards
    const p1 = Promise.all([
      api.get(`/api/client/bookings`, auth),
    ])
      .then(([bookingsRes]) => {
        const bookings = bookingsRes.data.bookings || [];
        const futureBookings = bookings.filter((b) => {
          const dt = bookingTimestamp(b);
          return dt && dt >= now && b.status !== "cancelled";
        });
        const nextBooking = futureBookings.length
          ? futureBookings.reduce((a, b) => {
              const dtA = bookingTimestamp(a);
              const dtB = bookingTimestamp(b);
              if (!dtA) return b;
              if (!dtB) return a;
              return dtA < dtB ? a : b;
            })
          : null;

        const recentBooking = bookings.length ? bookings[0] : null;

        setOverview({
          nextBooking,
          recentBooking,
          bookings,
        });
      })
      .catch(() => {
        // keep the page usable even if one call fails
        setOverview((prev) => prev || { nextBooking: null, bookings: [] });
      })
      .finally(() => {
        setLoading(false);
      });
    return Promise.allSettled([p1]);
  }

  const handleViewDetails = (booking) => {
    setSelected(booking);
    setDetailOpen(true);
  };

  // Small helpers
  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Welcome!</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadEverything}><RefreshIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Next Booking */}
        <Grid item xs={12} md={4}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Next Booking</Typography>
              {loading ? (
                <Skeleton height={60} />
              ) : overview?.nextBooking ? (
                <>
                  {(() => {
                    const b = overview.nextBooking;
                    const display = bookingDisplay(b);
                    return (
                      <>
                        <Typography variant="h6">
                          {display.date} {display.start}
                        </Typography>
                        <Typography variant="body2">
                          {b.service} <br />
                          With: {b.recruiter}
                        </Typography>
                      </>
                    );
                  })()}
                  <Button
                    size="small"
                    sx={{ mt: 1 }}
                    variant="outlined"
                    onClick={() => handleViewDetails(overview.nextBooking)}
                  >
                    View Details
                  </Button>
                </>
              ) : overview?.recentBooking ? (
                <>
                  {(() => {
                    const b = overview.recentBooking;
                    const display = bookingDisplay(b);
                    return (
                      <>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                          Most recent booking
                        </Typography>
                        <Typography variant="h6">
                          {display.date} {display.start}
                        </Typography>
                        <Typography variant="body2">
                          {b.service} <br />
                          With: {b.recruiter}
                        </Typography>
                      </>
                    );
                  })()}
                  <Button
                    size="small"
                    sx={{ mt: 1 }}
                    variant="outlined"
                    onClick={() => handleViewDetails(overview.recentBooking)}
                  >
                    View Details
                  </Button>
                </>
              ) : (
                <Typography>No upcoming bookings</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Overview trimmed to booking card only */}
      </Grid>

      {/* Booking Details Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="h6" gutterBottom>Booking Details</Typography>

              {(() => {
                const display = bookingDisplay(selected);
                return (
                  <>
                    <Typography><b>Date:</b> {display.date} {display.start} - {display.end}</Typography>
                  </>
                );
              })()}

              <Typography><b>Service:</b> {selected.service}</Typography>
              <Typography><b>Provider:</b> {selected.recruiter}</Typography>
              <Typography>
                <b>Status:</b>{" "}
                <Chip
                  label={selected.status}
                  color={selected.status === "cancelled" ? "error" : "primary"}
                  size="small"
                />
              </Typography>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">Company Info:</Typography>
              {(selected.company_public_url || selected.company_slug) && (
                <Typography>
                  <b>Company:</b>{" "}
                  <Link
                    href={selected.company_public_url || `/${selected.company_slug}`}
                    underline="hover"
                    target="_blank"
                    rel="noopener"
                  >
                    {selected.company_name || selected.company_slug}
                  </Link>
                </Typography>
              )}
              {selected.company_address && <Typography><b>Address:</b> {selected.company_address}</Typography>}
              {selected.company_phone && <Typography><b>Phone:</b> {selected.company_phone}</Typography>}
              {selected.company_email && <Typography><b>Email:</b> {selected.company_email}</Typography>}

              {(selected.company_public_url || selected.company_slug) && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    href={selected.company_public_url || `/${selected.company_slug}`}
                    target="_blank"
                    rel="noopener"
                  >
                    Book Again
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
