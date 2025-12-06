// src/pages/client/MeetWithArtistPage.jsx
// Public “book a meeting with me” page that matches the company site shell.

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EventIcon from "@mui/icons-material/Event";
import ScheduleIcon from "@mui/icons-material/Schedule";

import PublicPageShell, { usePublicSite } from "./PublicPageShell";
import { publicSite } from "../../utils/api";
import { pageStyleToBackgroundSx, pageStyleToCssVars } from "./ServiceList";

/* ---------- helpers shared with ServiceList ---------- */

const isPlainObject = (val) =>
  !!val && typeof val === "object" && !Array.isArray(val);

const cloneStyle = (val) => {
  if (!isPlainObject(val)) return null;
  try {
    return JSON.parse(JSON.stringify(val));
  } catch {
    return { ...val };
  }
};

const extractPageStyleProps = (page) => {
  if (!page) return null;
  const sections = Array.isArray(page?.content?.sections)
    ? page.content.sections
    : [];
  const section = sections.find((s) => s?.type === "pageStyle");
  if (section?.props && isPlainObject(section.props)) {
    const copy = cloneStyle(section.props);
    if (copy && Object.keys(copy).length) return copy;
  }
  const meta = cloneStyle(page?.content?.meta?.pageStyle);
  if (meta && Object.keys(meta).length) return meta;
  return null;
};

const getSiteDefaultPageStyle = (site) => {
  if (!site) return null;
  const meta = cloneStyle(site?.meta?.pageStyle);
  if (meta && Object.keys(meta).length) return meta;
  return null;
};

const resolveMeetPageStyle = (context, pageKey) => {
  if (!context) return null;
  const pages = Array.isArray(context.pages) ? context.pages : [];
  const site = context.site || null;

  const wanted = Array.from(
    new Set(
      [pageKey, "meet", "meet-artist", "meet-with-artist", "services-classic"]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase())
    )
  );

  const targets = pages.filter((p) =>
    wanted.includes(String(p?.slug || "").toLowerCase())
  );
  const home = pages.find((p) => p?.is_homepage) || pages[0] || null;

  const candidates = [
    ...targets.map((p) => extractPageStyleProps(p)),
    extractPageStyleProps(home),
    getSiteDefaultPageStyle(site),
  ];

  for (const candidate of candidates) {
    if (candidate && Object.keys(candidate).length) return candidate;
  }
  return null;
};

/* ---------- booking helpers ---------- */

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

const daysInMonth = (view) =>
  new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

const firstWeekday = (view) =>
  new Date(view.getFullYear(), view.getMonth(), 1).getDay();

/** Build an ISO-like string from local date/time + timezone */
const isoFromParts = (dateStr, timeStr, tz) => {
  try {
    const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
    return d
      .toLocaleString("sv-SE", {
        timeZone: tz || "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(" ", "T");
  } catch {
    return null;
  }
};

const formatTimeForViewer = (slot) => {
  const tz = slot.timezone || "UTC";
  const iso = isoFromParts(slot.date, slot.start_time, tz);
  if (!iso) return slot.start_time || "";
  const dt = new Date(iso);
  return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

/* Normalize + filter backend slots (drop anything in the past) */
function normalizeSlots(raw, fallbackTz) {
  const now = new Date();
  const tzFallback =
    fallbackTz ||
    (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  const normalized = [];
  (raw || []).forEach((s) => {
    const timezone = s.timezone || tzFallback;
    const iso = isoFromParts(s.date, s.start_time, timezone);
    if (!iso) return;
    const when = new Date(iso);
    if (when < now) return; // hide past slots completely
    normalized.push({ ...s, timezone, iso, when });
  });

  normalized.sort((a, b) => a.when - b.when);

  const byDate = {};
  normalized.forEach((s) => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });

  const dateKeys = Array.from(new Set(normalized.map((s) => s.date)));

  return {
    byDate,
    dates: dateKeys,
    timezone: tzFallback,
  };
}

/* ---------- main content (rendered inside PublicPageShell) ---------- */

const MeetWithArtistPageContent = ({ slug, artistId, pageKey }) => {
  const siteContext = usePublicSite();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState(null);

  const [availabilityTz, setAvailabilityTz] = useState("UTC");
  const [slotsByDate, setSlotsByDate] = useState({});
  const [sortedDates, setSortedDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [monthView, setMonthView] = useState(() => new Date());

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState("");


  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Page style (honour any Visual Site Builder page style)
  const pageStyle = useMemo(
    () => resolveMeetPageStyle(siteContext, pageKey),
    [siteContext, pageKey]
  );
  const pageCssVars = useMemo(() => pageStyleToCssVars(pageStyle), [pageStyle]);
  const pageBackground = useMemo(
    () => pageStyleToBackgroundSx(pageStyle),
    [pageStyle]
  );

  // Bridge css vars to :root so nav/header/footer inherit template styles
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (!pageCssVars || !Object.keys(pageCssVars).length) return undefined;
    const root = document.documentElement;
    const prev = {};
    Object.entries(pageCssVars).forEach(([key, value]) => {
      prev[key] = root.style.getPropertyValue(key);
      root.style.setProperty(key, value);
    });
    return () => {
      Object.entries(prev).forEach(([key, value]) => {
        if (value) root.style.setProperty(key, value);
        else root.style.removeProperty(key);
      });
    };
  }, [pageCssVars]);

  const cardSurface =
    "var(--page-card-bg, var(--page-surface-bg, rgba(255,255,255,0.94)))";
  const cardShadow =
    "var(--page-card-shadow, 0 22px 40px rgba(15,23,42,0.12))";
  const cardRadius = "var(--page-card-radius, 18px)";
  const buttonBg = "var(--page-btn-bg, var(--sched-primary))";
  const buttonColor = "var(--page-btn-color, #fff)";
  const buttonRadius = "var(--page-btn-radius, 999px)";
  const calendarAccent =
    "var(--page-calendar-accent, var(--page-btn-bg, var(--sched-primary)))";
  const calendarAccentContrast =
    "var(--page-calendar-accent-contrast, var(--page-btn-color, #fff))";

  /* Load artist + availability */
  useEffect(() => {
    if (!slug || !artistId) return;

    let alive = true;
    setLoading(true);
    setError("");

    Promise.all([
      publicSite.getArtist(slug, artistId),
      publicSite.getArtistAvailability(slug, artistId),
    ])
      .then(([artistData, availData]) => {
        if (!alive) return;

        setArtist(artistData);

        const slotsRaw = Array.isArray(availData?.slots)
          ? availData.slots
          : Array.isArray(availData)
          ? availData
          : [];

        const { byDate, dates, timezone } = normalizeSlots(
          slotsRaw,
          availData?.timezone
        );

        setAvailabilityTz(timezone);
        setSlotsByDate(byDate);
        setSortedDates(dates);

        if (dates.length > 0) {
          setSelectedDate((prev) => prev || dates[0]);
          const firstSlot = byDate[dates[0]]?.[0];
          if (firstSlot) {
            setSelectedSlotId(firstSlot.id);
            const firstDt = firstSlot.when;
            setMonthView(
              new Date(firstDt.getFullYear(), firstDt.getMonth(), 1)
            );
          }
        }
      })
      .catch(() => {
        if (!alive) return;
        setError("Unable to load artist or availability.");
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [slug, artistId]);

  const selectedSlotsForDate = useMemo(
    () => (selectedDate && slotsByDate[selectedDate]) || [],
    [selectedDate, slotsByDate]
  );

  const selectedSlot = useMemo(
    () =>
      selectedSlotId &&
      selectedSlotsForDate.find((s) => String(s.id) === String(selectedSlotId)),
    [selectedSlotId, selectedSlotsForDate]
  );

  const canGoPrevMonth = useMemo(() => {
    const firstOfMonth = new Date(
      monthView.getFullYear(),
      monthView.getMonth(),
      1
    );
    const firstOfCurrent = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth(),
      1
    );
    return firstOfMonth > firstOfCurrent;
  }, [monthView, todayStart]);

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    setMonthView(
      new Date(monthView.getFullYear(), monthView.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setMonthView(
      new Date(monthView.getFullYear(), monthView.getMonth() + 1, 1)
    );
  };

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    const daySlots = slotsByDate[dateStr] || [];
    if (daySlots.length > 0) {
      setSelectedSlotId(daySlots[0].id);
    } else {
      setSelectedSlotId(null);
    }
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlotId(slot.id);
  };

  const handleBook = async () => {
    if (!selectedSlot) {
      setSnack({
        open: true,
        message: "Please choose a time first.",
        severity: "warning",
      });
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !country.trim() || !website.trim()) {
      setSnack({
        open: true,
        message: "All fields are required.",
        severity: "warning",
      });
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const noteParts = [
      `Country/Region: ${country.trim()}`,
      `Website: ${website.trim()}`,
    ];
    if (note.trim()) {
      noteParts.push(note.trim());
    }

    setBooking(true);
    setError("");
    try {
      await publicSite.bookArtistMeeting(slug, artistId, {
        name: fullName,
        email: email.trim(),
        phone: phone.trim(),
        country: country.trim(),
        website: website.trim(),
        note: noteParts.join("\n"),
        availability_id: selectedSlot.id,
      });

      setSnack({
        open: true,
        message: "Your meeting has been booked!",
        severity: "success",
      });
      setNote("");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.displayMessage ||
        "Unable to book this time. Please try another slot.";
      setError(msg);
      setSnack({
        open: true,
        message: msg,
        severity: "error",
      });
    } finally {
      setBooking(false);
    }
  };

  /* ---- render helpers ---- */

  const renderCalendarDayCell = (dayNum) => {
    const cellDate = new Date(
      monthView.getFullYear(),
      monthView.getMonth(),
      dayNum
    );
    const dateKey = ymd(cellDate);
    const isPast = cellDate < todayStart;
    const hasSlots = !!slotsByDate[dateKey];
    const isSelected = selectedDate === dateKey;

    const disabled = isPast || !hasSlots;

    return (
      <Box
        key={dayNum}
        onClick={() => {
          if (!disabled) handleSelectDate(dateKey);
        }}
        sx={{
          position: "relative",
          aspectRatio: "1 / 1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 1.4,
          cursor: disabled ? "default" : "pointer",
          border: `1px solid ${
            isSelected
              ? calendarAccent
              : "rgba(15,23,42,0.12)"
          }`,
          bgcolor: isSelected
            ? calendarAccent
            : "transparent",
          color: isSelected
            ? calendarAccentContrast
            : isPast
            ? "text.disabled"
            : "text.primary",
          fontWeight: isSelected ? 700 : 500,
          fontSize: "0.875rem",
          transition: "all .18s ease",
          "&:hover": {
            boxShadow: disabled ? "none" : "0 0 0 1px rgba(15,23,42,0.12)",
          },
        }}
      >
        {dayNum}
        {hasSlots && (
          <Box
            sx={{
              position: "absolute",
              bottom: 6,
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: isSelected
                ? calendarAccentContrast
                : calendarAccent,
            }}
          />
        )}
      </Box>
    );
  };

  const TimesList = () => {
    if (!selectedDate) {
      return (
        <Typography variant="body2" color="text.secondary">
          Pick a date to see available times.
        </Typography>
      );
    }

    if (selectedSlotsForDate.length === 0) {
      return (
        <Alert severity="info">
          No available times for this day. Please choose another date.
        </Alert>
      );
    }

    return (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mt: 1,
        }}
      >
        {selectedSlotsForDate.map((slot) => {
          const isSelected = String(slot.id) === String(selectedSlotId);
          return (
            <Button
              key={slot.id}
              size="small"
              onClick={() => handleSelectSlot(slot)}
              sx={{
                borderRadius: buttonRadius,
                textTransform: "none",
                fontWeight: 600,
                px: 2,
                border: `1px solid ${
                  isSelected
                    ? calendarAccent
                    : "rgba(15,23,42,0.18)"
                }`,
                backgroundColor: isSelected
                  ? calendarAccent
                  : "transparent",
                color: isSelected ? calendarAccentContrast : "inherit",
                boxShadow: isSelected
                  ? "0 12px 26px rgba(15,23,42,0.26)"
                  : "none",
                "&:hover": {
                  backgroundColor: isSelected
                    ? calendarAccent
                    : "rgba(15,23,42,0.04)",
                },
              }}
            >
              {formatTimeForViewer(slot)}
            </Button>
          );
        })}
      </Box>
    );
  };

  /* ---- main layout (mirrors ServiceList spacing) ---- */

  const page = (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        py: { xs: 4, md: 6 },
        px: { xs: 2, md: 4, xl: 6 },
        ...pageBackground,
        color: "var(--page-body-color, inherit)",
      }}
      style={pageCssVars || undefined}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1600,
          mx: "auto",
        }}
      >
        <Container maxWidth="lg" sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !artist ? (
            <Alert severity="info">Artist not found.</Alert>
          ) : (
            <Grid container spacing={4}>
              {/* Left: Artist info */}
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    borderRadius: cardRadius,
                    boxShadow: cardShadow,
                    bgcolor: cardSurface,
                    backdropFilter: "blur(var(--page-card-blur, 0px))",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <CardContent>
                    <Stack spacing={2} alignItems="center">
                      <Avatar
                        src={artist.profile_image_url || undefined}
                        alt={artist.full_name}
                        sx={{
                          width: 96,
                          height: 96,
                          bgcolor: "var(--sched-primary, #6366F1)",
                          fontSize: 36,
                          fontWeight: 700,
                        }}
                      >
                        {artist.full_name?.[0] || "•"}
                      </Avatar>
                      <Box textAlign="center">
                        <Typography
                          variant="h5"
                          fontWeight={800}
                          sx={{ color: "var(--page-heading-color, inherit)" }}
                        >
                          {artist.full_name}
                        </Typography>
                        {artist.role && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {artist.role}
                          </Typography>
                        )}
                      </Box>
                      {Array.isArray(artist.specialties) &&
                        artist.specialties.length > 0 && (
                          <Box sx={{ width: "100%" }}>
                            <Typography
                              variant="overline"
                              color="text.secondary"
                              sx={{ letterSpacing: 1 }}
                            >
                              Specialties
                            </Typography>
                            <Stack
                              direction="row"
                              flexWrap="wrap"
                              gap={1}
                              mt={1}
                            >
                              {artist.specialties.map((s, idx) => (
                                <Box
                                  key={`${idx}-${s}`}
                                  sx={{
                                    px: 1.2,
                                    py: 0.4,
                                    borderRadius: 999,
                                    fontSize: "0.75rem",
                                    bgcolor:
                                      "var(--page-pill-bg, rgba(15,23,42,0.06))",
                                  }}
                                >
                                  {s}
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        )}
                    </Stack>
                  </CardContent>
                </Card>

              <Card
                sx={{
                  mt: 3,
                  borderRadius: cardRadius,
                  boxShadow:
                    "var(--page-card-shadow, 0 14px 30px rgba(15,23,42,0.12))",
                  bgcolor: cardSurface,
                  backdropFilter: "blur(var(--page-card-blur, 0px))",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    gutterBottom
                    sx={{ color: "var(--page-heading-color, inherit)" }}
                  >
                    Meeting details
                  </Typography>
                  <Stack spacing={1.2}>
                    {artist.bio ? (
                      <Typography variant="body2" color="text.secondary">
                        {artist.bio}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Choose a time that works for you.
                      </Typography>
                    )}
                    {availabilityTz && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ScheduleIcon fontSize="small" />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Times are shown in your local time based on{" "}
                          {availabilityTz}.
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

              {/* Right: calendar + booking form */}
              <Grid item xs={12} md={8}>
                <Stack spacing={3}>
                  {/* Calendar + times */}
                  <Card
                    sx={{
                      borderRadius: cardRadius,
                      boxShadow:
                        "var(--page-card-shadow, 0 22px 40px rgba(15,23,42,0.14))",
                      bgcolor: cardSurface,
                      backdropFilter: "blur(var(--page-card-blur, 0px))",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <CardContent>
                      <Stack
                        direction={isMobile ? "column" : "row"}
                        spacing={3}
                        alignItems={isMobile ? "stretch" : "flex-start"}
                      >
                        {/* Calendar */}
                        <Box sx={{ flex: 1.1, minWidth: 260 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 2 }}
                          >
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              sx={{ color: "var(--page-heading-color, inherit)" }}
                            >
                              Select a date
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <IconButton
                                size="small"
                                onClick={handlePrevMonth}
                                disabled={!canGoPrevMonth}
                                sx={{ color: calendarAccent }}
                              >
                                <ChevronLeftIcon fontSize="small" />
                              </IconButton>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                              >
                                {monthView.toLocaleString(undefined, {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={handleNextMonth}
                                sx={{ color: calendarAccent }}
                              >
                                <ChevronRightIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(7, 1fr)",
                              gap: 0.75,
                              mb: 1,
                            }}
                          >
                            {weekdays.map((w, idx) => (
                              <Box
                                key={`${w}-${idx}`}
                                sx={{
                                  textAlign: "center",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  color: "text.secondary",
                                }}
                              >
                                {w}
                              </Box>
                            ))}

                            {Array.from({
                              length: firstWeekday(monthView),
                            }).map((_, i) => (
                              <Box key={`empty-${i}`} />
                            ))}

                            {Array.from({
                              length: daysInMonth(monthView),
                            }).map((_, idx) =>
                              renderCalendarDayCell(idx + 1)
                            )}
                          </Box>

                          {sortedDates.length === 0 && (
                            <Alert severity="info" sx={{ mt: 1 }}>
                              No upcoming availability at the moment.
                            </Alert>
                          )}
                        </Box>

                        {/* Times */}
                        <Box sx={{ flex: 1.2 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ color: "var(--page-heading-color, inherit)" }}
                          >
                            Available times
                          </Typography>
                          <TimesList />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Booking form */}
                  <Card
                    sx={{
                      borderRadius: cardRadius,
                      boxShadow:
                        "var(--page-card-shadow, 0 18px 34px rgba(15,23,42,0.14))",
                      bgcolor: cardSurface,
                      backdropFilter: "blur(var(--page-card-blur, 0px))",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        gutterBottom
                        sx={{ color: "var(--page-heading-color, inherit)" }}
                      >
                        Your details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="First name"
                            required
                            fullWidth
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Last name"
                            required
                            fullWidth
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Email"
                            required
                            fullWidth
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="WhatsApp Phone Number"
                            required
                            fullWidth
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Country/Region"
                            required
                            fullWidth
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Website URL"
                            required
                            fullWidth
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Notes (optional)"
                            fullWidth
                            multiline
                            minRows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                        </Grid>
                        {error && (
                          <Grid item xs={12}>
                            <Alert severity="error">{error}</Alert>
                          </Grid>
                        )}
                        <Grid item xs={12}>
                          <Box sx={{ textAlign: "right", mt: 1 }}>
                            <Button
                              variant="contained"
                              size="large"
                              onClick={handleBook}
                              disabled={booking || sortedDates.length === 0}
                              sx={{
                                borderRadius: buttonRadius,
                                textTransform: "none",
                                px: 3.5,
                                fontWeight: 700,
                                boxShadow:
                                  "var(--page-btn-shadow, 0 16px 32px rgba(15,23,42,0.22))",
                                backgroundColor: buttonBg,
                                color: buttonColor,
                                "&:hover": {
                                  backgroundColor: buttonBg,
                                  boxShadow:
                                    "var(--page-btn-shadow-hover, 0 20px 40px rgba(15,23,42,0.26))",
                                },
                              }}
                            >
                              {booking ? "Booking…" : "Confirm meeting"}
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          )}
        </Container>

        <Snackbar
          open={snack.open}
          autoHideDuration={3500}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          message={snack.message}
        />
      </Box>
    </Box>
  );

  return page;
};

/* ---------- outer wrapper (like ServiceList) ---------- */

const MeetWithArtistPage = () => {
  const { slug: routeSlug, artistId } = useParams();
  const [searchParams] = useSearchParams();

  const pageKey = useMemo(() => {
    return searchParams.get("page") || "meet";
  }, [searchParams]);

  const slug = useMemo(() => {
    const qsSite = searchParams.get("site");
    if (qsSite) return qsSite;
    if (routeSlug) return routeSlug;
    try {
      return localStorage.getItem("site") || "";
    } catch {
      return routeSlug || "";
    }
  }, [routeSlug, searchParams]);

  if (!slug) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Alert severity="error">Missing company slug in URL.</Alert>
      </Box>
    );
  }

  return (
    <PublicPageShell
      activeKey={pageKey}
      slugOverride={slug}
    >
      <MeetWithArtistPageContent
        slug={slug}
        artistId={artistId}
        pageKey={pageKey}
      />
    </PublicPageShell>
  );
};

export default MeetWithArtistPage;
