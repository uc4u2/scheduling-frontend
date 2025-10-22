// src/pages/client/ClientDashboardOverview.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Typography, Grid, Card, CardContent, Skeleton, Button,
  Dialog, DialogContent, Divider, Chip, Link, Stack, TextField,
  IconButton, Tooltip, Alert, LinearProgress
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "axios";
import BookingChart from "../../components/charts/BookingChart";
import { getUserTimezone } from "../../utils/timezone";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";

const API = process.env.REACT_APP_API_URL || ""; // keep relative if you proxy

export default function ClientDashboardOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // NEW: client signals + messages
  const [signals, setSignals] = useState(null);            // { ip, city, region, country, tz, user_agent, device, last_channel }
  const [signalHistory, setSignalHistory] = useState([]);  // recent events
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [signalsErr, setSignalsErr] = useState("");

  const [messages, setMessages] = useState([]);            // [{id, from, body, sent_at}]
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgErr, setMsgErr] = useState("");

  const userTimezone = getUserTimezone();
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  useEffect(() => {
    loadEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTimezone]);

  function loadEverything() {
    setLoading(true);
    setSignalsLoading(true);
    setSignalsErr("");
    setMsgErr("");
    const now = new Date();

    // Core cards
    const p1 = Promise.all([
      axios.get(`${API}/api/client/bookings`, auth),
      axios.get(`${API}/invoices`, auth),
      axios.get(`${API}/notifications?status=unread`, auth),
    ])
      .then(([bookingsRes, invoicesRes, notifsRes]) => {
        const bookings = bookingsRes.data.bookings || [];
        const futureBookings = bookings.filter(b => {
          const tz = b.timezone || userTimezone;
          const iso = isoFromParts(b.date, b.start_time, tz);
          return new Date(iso) >= now && b.status !== "cancelled";
        });
        const nextBooking = futureBookings.length
          ? futureBookings.reduce((a, b) => {
              const tzA = a.timezone || userTimezone;
              const tzB = b.timezone || userTimezone;
              const isoA = isoFromParts(a.date, a.start_time, tzA);
              const isoB = isoFromParts(b.date, b.start_time, tzB);
              return new Date(isoA) < new Date(isoB) ? a : b;
            })
          : null;

        setOverview({
          nextBooking,
          unpaidCount: (invoicesRes.data || []).filter((i) => i.status !== "paid").length,
          unreadNotifs: (notifsRes.data || []).length,
          bookings,
        });
      })
      .catch(() => {
        // keep the page usable even if one call fails
        setOverview((prev) => prev || { nextBooking: null, unpaidCount: 0, unreadNotifs: 0, bookings: [] });
      })
      .finally(() => setLoading(false));

    // Client telemetry (IP/geo/device/last channel)
    const p2 = Promise.all([
      axios.get(`${API}/api/client/telemetry`, auth).catch(() => null),
      axios.get(`${API}/api/client/telemetry/history?limit=5`, auth).catch(() => null),
    ])
      .then(([sigRes, histRes]) => {
        if (!sigRes?.data) throw new Error("telemetry not available");
        setSignals(sigRes.data || null);
        setSignalHistory(histRes?.data?.events || []);
      })
      .catch(() => {
        setSignals(null);
        setSignalHistory([]);
        setSignalsErr("Client signals not available yet.");
      })
      .finally(() => setSignalsLoading(false));

    // Client messages (thread with the company/manager)
    const p3 = axios
      .get(`${API}/api/client/messages?limit=20`, auth)
      .then((r) => setMessages(r?.data?.messages || []))
      .catch(() => {
        setMessages([]);
        setMsgErr("Messages are not available.");
      });

    return Promise.allSettled([p1, p2, p3]);
  }

  const handleViewDetails = (booking) => {
    setSelected(booking);
    setDetailOpen(true);
  };

  // Send a message to manager (will also email from the server side if you wire it to do so)
  const sendMessage = async () => {
    const body = (msgText || "").trim();
    if (!body) return;
    setMsgSending(true);
    setMsgErr("");
    try {
      const { data } = await axios.post(`${API}/api/client/messages`, { body }, auth);
      // Optimistic append
      const newMsg = data?.message || {
        id: `tmp_${Date.now()}`,
        from: "client",
        body,
        sent_at: new Date().toISOString(),
      };
      setMessages((prev) => [newMsg, ...prev]);
      setMsgText("");
    } catch (e) {
      setMsgErr(e?.response?.data?.error || "Failed to send message");
    } finally {
      setMsgSending(false);
    }
  };

  // Ask browser for location and push to server
  const shareLocation = () => {
    if (!navigator.geolocation) {
      setSignalsErr("Geolocation is not supported by your browser.");
      return;
    }
    setSignalsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await axios.post(`${API}/api/client/telemetry/geo`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            tz: userTimezone,
          }, auth);
          await loadEverything(); // refresh signals/history
        } catch {
          setSignalsErr("Failed to save your location.");
        } finally {
          setSignalsLoading(false);
        }
      },
      () => {
        setSignalsErr("Location permission denied.");
        setSignalsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  // Small helpers
  const chip = (label, color = "default") => (
    <Chip size="small" label={label} color={color} sx={{ mr: 1, mb: 1 }} />
  );

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
                    const tz = b.timezone || userTimezone;
                    const iso = isoFromParts(b.date, b.start_time, tz);
                    const dateObj = new Date(iso);
                    return (
                      <>
                        <Typography variant="h6">
                          {formatDate(dateObj)} {formatTime(dateObj)}
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
              ) : (
                <Typography>No upcoming bookings</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Unpaid Invoices */}
        <Grid item xs={12} md={4}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Unpaid Invoices</Typography>
              {loading ? (
                <Skeleton height={60} />
              ) : (
                <Typography variant="h4" color={overview?.unpaidCount > 0 ? "error" : "text.primary"}>
                  {overview?.unpaidCount || 0}
                </Typography>
              )}
              <Button href="/dashboard?tab=invoices" size="small" sx={{ mt: 1 }}>View Invoices</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Unread Notifications */}
        <Grid item xs={12} md={4}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Unread Notifications</Typography>
              {loading ? (
                <Skeleton height={60} />
              ) : (
                <Typography variant="h4" color={overview?.unreadNotifs > 0 ? "primary" : "text.primary"}>
                  {overview?.unreadNotifs || 0}
                </Typography>
              )}
              <Button href="/dashboard?tab=notifications" size="small" sx={{ mt: 1 }}>View All</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* NEW — Client Signals (IP/Geo/Device/Channel) */}
        <Grid item xs={12} md={6}>
          <Card elevation={4}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Client Signals</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<MyLocationIcon />}
                    onClick={shareLocation}
                  >
                    Share Location
                  </Button>
                </Stack>
              </Stack>

              {signalsLoading && <LinearProgress sx={{ mb: 1 }} />}

              {signalsErr && <Alert severity="warning" sx={{ mb: 1 }}>{signalsErr}</Alert>}

              {!signals ? (
                <Typography variant="body2" color="text.secondary">
                  We’ll show your IP, city, timezone, and recent booking channel here once available.
                </Typography>
              ) : (
                <>
                  <Stack direction="row" flexWrap="wrap" sx={{ mb: 1 }}>
                    {signals.ip && chip(`IP: ${signals.ip}`, "default")}
                    {signals.city && chip(`${signals.city}${signals.region ? ", " + signals.region : ""}`, "default")}
                    {signals.country && chip(signals.country, "default")}
                    {signals.tz && chip(`TZ: ${signals.tz}`, "info")}
                    {signals.device && chip(signals.device, "default")}
                    {signals.user_agent && chip("UA", "default")}
                    {signals.last_channel && chip(`Channel: ${signals.last_channel}`, "primary")}
                  </Stack>

                  {signalHistory?.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary">Recent activity</Typography>
                      <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                        {signalHistory.map((e, i) => (
                          <Typography key={i} variant="body2">
                            • {e.event || "event"} — {e.city ? `${e.city}${e.region ? ", " + e.region : ""}` : "—"} · {e.country || "—"} · {e.tz || "—"} · {new Date(e.at).toLocaleString()}
                          </Typography>
                        ))}
                      </Stack>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* NEW — Messages with Manager */}
        <Grid item xs={12} md={6}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Messages
              </Typography>

              {msgErr && <Alert severity="warning" sx={{ mb: 1 }}>{msgErr}</Alert>}

              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message to your provider/manager…"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                />
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  onClick={sendMessage}
                  disabled={msgSending || !msgText.trim()}
                >
                  Send
                </Button>
              </Stack>

              {msgSending && <LinearProgress sx={{ mb: 1 }} />}

              {messages.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No messages yet.</Typography>
              ) : (
                <Stack spacing={1} sx={{ maxHeight: 260, overflow: "auto", pr: 0.5 }}>
                  {messages.map((m) => (
                    <Paper
                      key={m.id}
                      elevation={m.from === "manager" ? 3 : 1}
                      sx={{
                        p: 1.25,
                        borderLeft: m.from === "manager" ? "4px solid #1976d2" : "4px solid transparent",
                        bgcolor: m.from === "manager" ? "rgba(25,118,210,0.05)" : undefined,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">
                          {m.from === "manager" ? "Manager" : "You"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(m.sent_at).toLocaleString()}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{m.body}</Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Booking Chart */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2, mt: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Booking Activity</Typography>
            <BookingChart bookings={overview?.bookings || []} loading={loading} />
          </Paper>
        </Grid>
      </Grid>

      {/* Booking Details Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="h6" gutterBottom>Booking Details</Typography>

              {(() => {
                const tz = selected.timezone || userTimezone;
                const startIso = isoFromParts(selected.date, selected.start_time, tz);
                const endIso = isoFromParts(selected.date, selected.end_time, tz);
                const startDateObj = new Date(startIso);
                const endDateObj = new Date(endIso);
                return (
                  <>
                    <Typography><b>Date:</b> {formatDate(startDateObj)} {formatTime(startDateObj)} - {formatTime(endDateObj)}</Typography>
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
              {selected.company_slug && (
                <Typography>
                  <b>Company:</b>{" "}
                  <Link href={`/${selected.company_slug}`} underline="hover" target="_blank" rel="noopener">
                    {selected.company_name || selected.company_slug}
                  </Link>
                </Typography>
              )}
              {selected.company_address && <Typography><b>Address:</b> {selected.company_address}</Typography>}
              {selected.company_phone && <Typography><b>Phone:</b> {selected.company_phone}</Typography>}
              {selected.company_email && <Typography><b>Email:</b> {selected.company_email}</Typography>}

              {selected.company_slug && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    href={`/${selected.company_slug}`}
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
