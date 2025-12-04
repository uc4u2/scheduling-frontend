// src/pages/client/MeetWithArtistPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PublicPageShell from "./PublicPageShell";
import { publicSite } from "../../utils/api";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";

function SlotButton({ slot, selected, onSelect }) {
  const iso = isoFromParts(slot.date, slot.start_time, slot.timezone);
  const dt = new Date(iso);
  const label = `${formatDate(dt)} · ${formatTime(dt)} ${slot.timezone}`;
  return (
    <Button
      variant={selected ? "contained" : "outlined"}
      onClick={() => onSelect(slot)}
      sx={{ textTransform: "none" }}
      fullWidth
    >
      {label}
    </Button>
  );
}

export default function MeetWithArtistPage() {
  const { slug, artistId } = useParams();
  const userTz = getUserTimezone();
  const [artist, setArtist] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [artistRes, availRes] = await Promise.all([
          publicSite.getArtist(slug, artistId),
          publicSite.getArtistAvailability(slug, artistId),
        ]);
        if (!active) return;
        setArtist(artistRes);
        setSlots(Array.isArray(availRes?.slots) ? availRes.slots : []);
      } catch (e) {
        if (!active) return;
        setErr(e?.message || "Failed to load availability");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, artistId]);

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const selectedIso = useMemo(() => {
    if (!selectedSlot) return null;
    return isoFromParts(selectedSlot.date, selectedSlot.start_time, selectedSlot.timezone || userTz);
  }, [selectedSlot, userTz]);

  const displaySelection = useMemo(() => {
    if (!selectedIso) return null;
    const dt = new Date(selectedIso);
    return `${formatDate(dt)} · ${formatTime(dt)} (${selectedSlot.timezone || userTz})`;
  }, [selectedIso, selectedSlot, userTz]);

  const groupedSlots = useMemo(() => {
    const map = {};
    slots.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return Object.entries(map)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, list]) => ({ date, list }));
  }, [slots]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk(false);
    if (!selectedSlot) {
      setErr("Please pick a time slot.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await publicSite.bookArtistMeeting(slug, artistId, {
        availability_id: selectedSlot.id,
        ...form,
      });
      if (!res?.ok) throw new Error(res?.error || "Booking failed");
      setOk(true);
      setConfirmation(res);
    } catch (e2) {
      setErr(e2?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const shellTitle = artist ? `Meet with ${artist.first_name || artist.name || "your host"}` : "Meet";

  const content = () => {
    if (loading) {
      return (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading availability…
          </Typography>
        </Box>
      );
    }
    if (err) {
      return <Alert severity="error">{err}</Alert>;
    }
    if (!artist) {
      return <Alert severity="warning">Artist not found.</Alert>;
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h4" fontWeight={800}>
                  Meet with {artist.first_name || artist.name || "our team"}
                </Typography>
                {artist.public_bio && (
                  <Typography variant="body1" color="text.secondary">
                    {artist.public_bio}
                  </Typography>
                )}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Pick a time
                  </Typography>
                  <Stack spacing={2}>
                    {groupedSlots.length === 0 && (
                      <Typography color="text.secondary">No open slots right now.</Typography>
                    )}
                    {groupedSlots.map(({ date, list }) => (
                      <Box key={date}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          {date}
                        </Typography>
                        <Stack spacing={1}>
                          {list.map((slot) => (
                            <SlotButton
                              key={slot.id}
                              slot={slot}
                              selected={selectedSlot?.id === slot.id}
                              onSelect={setSelectedSlot}
                            />
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack spacing={2} component="form" onSubmit={submit}>
                <Typography variant="h6">Your details</Typography>
                {ok && confirmation && (
                  <Alert severity="success">
                    You’re booked!
                    {confirmation.jitsi_link && (
                      <><br />Join via Jitsi: <a href={confirmation.jitsi_link}>{confirmation.jitsi_link}</a></>
                    )}
                  </Alert>
                )}
                {err && <Alert severity="error">{err}</Alert>}

                <TextField
                  label="Full name"
                  value={form.name}
                  onChange={handleChange("name")}
                  required
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  required
                  fullWidth
                />
                <TextField
                  label="Phone"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  fullWidth
                />
                <TextField
                  label="Notes"
                  value={form.note}
                  onChange={handleChange("note")}
                  fullWidth
                  multiline
                  minRows={3}
                />
                {selectedSlot && (
                  <Alert severity="info">
                    Selected: {displaySelection}
                  </Alert>
                )}
                {confirmation && (
                  <Stack spacing={1}>
                    {confirmation.reschedule_link && (
                      <Button
                        variant="outlined"
                        onClick={() => window.open(confirmation.reschedule_link, "_blank", "noopener")}
                      >
                        Reschedule
                      </Button>
                    )}
                    {confirmation.cancel_link && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => window.open(confirmation.cancel_link, "_blank", "noopener")}
                      >
                        Cancel
                      </Button>
                    )}
                  </Stack>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting || !selectedSlot}
                >
                  {submitting ? "Booking…" : "Book meeting"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <PublicPageShell slugOverride={slug} activeKey="__services">
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Card
          elevation={0}
          sx={{
            mb: 3,
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.45), rgba(0,0,0,0.25)), var(--page-card-bg, #0f172a)",
            color: "var(--page-heading-color, #fff)",
          }}
        >
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ letterSpacing: 1, opacity: 0.85 }}>
              Direct booking
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {shellTitle}
            </Typography>
            {artist?.title && (
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {artist.title}
              </Typography>
            )}
          </Stack>
        </Card>
        {content()}
      </Container>
    </PublicPageShell>
  );
}
