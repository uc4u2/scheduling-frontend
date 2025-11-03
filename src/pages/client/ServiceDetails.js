/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { formatCurrency } from "../../utils/formatters";
import { setActiveCurrency, normalizeCurrency, resolveCurrencyForCountry, resolveActiveCurrencyFromCompany, getActiveCurrency } from "../../utils/currency";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Container,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper,
  Chip,
  Stack,
  Card,
  CardContent,
  Avatar,
  Collapse,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme, alpha } from "@mui/material/styles";
import { useNavWithEmbed } from "../../embed";
import PublicPageShell from "./PublicPageShell";
import { loadCart } from "../../utils/cart";

/* ───────────────── helpers ───────────────── */
/** Build "cart" JSON for the availability endpoint (filter by date and optional artist) */
function buildCartPayload({ date, artistId = null }) {
  try {
    const raw = loadCart();
    const filtered = raw
      .filter(
        (it) =>
          it &&
          (!artistId || String(it.artist_id) === String(artistId)) &&
          (!date || it.date === date || it.local_date === date)
      )
      .map((it) => ({
        artist_id: it.artist_id,
        service_id: it.service_id,
        date: it.date || it.local_date,
        local_date: it.local_date || it.date,
        start_time: it.start_time || it.local_time,
        local_time: it.local_time || it.start_time,
        addon_ids:
          Array.isArray(it.addon_ids) && it.addon_ids.length
            ? it.addon_ids
            : Array.isArray(it.addons)
            ? it.addons.map((a) => a && a.id).filter(Boolean)
            : [],
      }));
    return JSON.stringify(filtered);
  } catch (e) {
    return "[]";
  }
}

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const prettyDate = (yyyyMmDd) =>
  yyyyMmDd
    ? new Date(yyyyMmDd + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

/** format a UTC ISO string in the viewer's local time */
const timeFromUTCForViewer = (startUtc) => {
  if (!startUtc) return "";
  const dt = new Date(startUtc);
  return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

/** get YYYY-MM-DD in a specific TZ from a UTC ISO */
const dateYMDInTZ = (startUtc, tz) => {
  return new Date(startUtc).toLocaleDateString("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }); // "YYYY-MM-DD"
};

/** get HH:MM (24h) in a specific TZ from a UTC ISO */
const timeHMInTZ = (startUtc, tz) => {
  return new Date(startUtc).toLocaleTimeString("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }); // "HH:MM"
};

export default function ServiceDetails() {
  const { slug, serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const departmentId = searchParams.get("department_id") || "";
  const navigate = useNavWithEmbed();
  const theme = useTheme();
  const primaryBgVar = "var(--page-btn-bg, var(--sched-primary))";
  const primaryTextVar = "var(--page-btn-color, #ffffff)";
  const buttonRadiusVar = 'var(--page-btn-radius, 12px)';
  const buttonShadowVar = 'var(--page-btn-shadow, 0 16px 32px rgba(15,23,42,0.16))';
  const buttonShadowHoverVar = 'var(--page-btn-shadow-hover, 0 20px 40px rgba(15,23,42,0.2))';
  const buttonHoverBgVar = "var(--page-btn-bg-hover, var(--sched-primary))";
  const buttonSoftBgVar = "var(--page-btn-bg-soft, rgba(15,23,42,0.12))";

  const bookingButtonSx = {
    backgroundColor: primaryBgVar,
    color: primaryTextVar,
    borderRadius: buttonRadiusVar,
    fontWeight: 600,
    textTransform: 'none',
    px: 2.5,
    boxShadow: buttonShadowVar,
    '&:hover': {
      backgroundColor: buttonHoverBgVar,
      color: primaryTextVar,
      boxShadow: buttonShadowHoverVar,
    },
  };

  const bookingButtonOutlinedSx = {
    borderColor: primaryBgVar,
    color: primaryBgVar,
    borderRadius: buttonRadiusVar,
    fontWeight: 600,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: buttonSoftBgVar,
      borderColor: buttonHoverBgVar,
      color: primaryTextVar,
    },
  };


  /* base data */
  const [service, setService] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* calendar modal + view state */
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [monthView, setMonthView] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  /**
   * daySlots: array of time-grouped slots keyed by start_utc, e.g.
   * {
   *   key: start_utc,
   *   date: selectedDate,
   *   start_utc: "...Z",
   *   providers: [{ id, full_name, timezone, start_time_local }...],
   *   count: n
   * }
   */
  const [daySlots, setDaySlots] = useState([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  /* inline provider picker under time */
  const [selectedTimeKey, setSelectedTimeKey] = useState(""); // start_utc key
  const selectedSlot = daySlots.find((s) => s.key === selectedTimeKey);

  /* month availability dots cache: { 'YYYY-MM-DD': true|false } */
  const [availableMap, setAvailableMap] = useState({});
  const [prefetchingMonth, setPrefetchingMonth] = useState(false);

  const [displayCurrency, setDisplayCurrency] = useState(() => getActiveCurrency());
  const money = (value, currencyCode) => formatCurrency(value, currencyCode || displayCurrency);

  /* ───────── load service + employees ───────── */
  useEffect(() => {
    if (!slug || !serviceId) {
      setError("Invalid URL parameters.");
      setLoading(false);
      return;
    }
    const deptQuery = departmentId ? `?department_id=${departmentId}` : "";
    Promise.all([
      api.get(`/public/${slug}/service/${serviceId}${deptQuery}`, { noCompanyHeader: true }),
      api.get(`/public/${slug}/service/${serviceId}/employees${deptQuery}`, { noCompanyHeader: true }),
    ])
      .then(([svc, empRes]) => {
        setService(svc.data);
        setEmployees(empRes.data || []);
      })
      .catch(() => setError("Failed to load service information."))
      .finally(() => setLoading(false));
  }, [slug, serviceId, departmentId]);

  /* open modal → default to today */
  useEffect(() => {
    if (!calendarOpen) return;
    const today = ymd(new Date());
    setMonthView(new Date());
    setSelectedDate(today);
  }, [calendarOpen]);

  /* helper: fetch availability for one employee + one date (canonical route, with safe fallback) */
  const fetchAvail = async (empId, dateStr) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const cartJSON = buildCartPayload({ date: dateStr, artistId: empId });

    // 1) canonical route (supports explicit + shift fallback; returns start_utc)
    const qs = new URLSearchParams({
      artist_id: empId,
      service_id: serviceId,
      date: dateStr,
      timezone: tz,
      explicit_only: 1,   // <- ONLY use explicit manager rows
      respect_rows: 1,    // <- DO NOT subdivide; one slot per manager row
    });
    if (departmentId) qs.set("department_id", departmentId);
    if (cartJSON) qs.set("cart", cartJSON);
    try {
      const { data } = await api.get(
        `/public/${slug}/availability?${qs.toString()}`,
        { noCompanyHeader: true }
      );
      const slots = Array.isArray(data?.slots)
        ? data.slots
        : (Array.isArray(data?.times) ? data.times : []);
      const clean = slots.filter(
        (s) =>
          !s.booked &&
          (s.type ? s.type === "available" : true) &&
          s.origin !== "shift"
      );
      
      if (clean.length) return clean;
    } catch {
      /* ignore and try fallback */
    }

    // 2) per-artist wrapper (if present)
    try {
      const alt = new URLSearchParams({
        service_id: serviceId,
        date: dateStr,
        timezone: tz,
        ...(departmentId ? { department_id: departmentId } : {}),
      });
      if (cartJSON) alt.set("cart", cartJSON);
      const { data } = await api.get(
        `/public/${slug}/artists/${empId}/availability?${alt.toString()}`,
        { noCompanyHeader: true }
      );
      const slots = Array.isArray(data?.slots)
        ? data.slots
        : Array.isArray(data?.times)
        ? data.times
        : [];
      return slots.filter(
        (s) => !s.booked && (s.type ? s.type === "available" : true)
      );
    } catch {
      return [];
    }
  };

  /* helper: aggregate by start_utc (so TZ display is always correct) */
  const aggregateByUTC = (selectedDateStr, results) => {
    const map = new Map(); // key = start_utc
    for (const { emp, slots } of results) {
      for (const s of slots) {
        const startUtc = s.start_utc; // authoritative UTC
        if (!startUtc || (s.type && s.type !== "available")) continue;

        const key = startUtc;
        const tz = s.timezone || "UTC";
        const startLocal = s.start_time || timeHMInTZ(startUtc, tz);

        if (!map.has(key)) {
          map.set(key, {
            key,
            date: selectedDateStr, // UI-selected day
            start_utc: startUtc,
            providers: [
              {
                id: emp.id,
                full_name: emp.full_name,
                timezone: tz,
                start_time_local: startLocal,
              },
            ],
          });
        } else {
          const curr = map.get(key);
          if (!curr.providers.some((p) => p.id === emp.id)) {
            curr.providers.push({
              id: emp.id,
              full_name: emp.full_name,
              timezone: tz,
              start_time_local: startLocal,
            });
          }
        }
      }
    }
    return Array.from(map.values())
      .map((x) => ({ ...x, count: x.providers.length }))
      .sort((a, b) => a.start_utc.localeCompare(b.start_utc));
  };

  /* prefetch month dots (any availability that day across any provider) */
  useEffect(() => {
    if (!calendarOpen || !employees.length) return;

    let cancelled = false;

    const dayHasAny = async (dStr) => {
      for (const emp of employees) {
        try {
          const slots = await fetchAvail(emp.id, dStr);
          if (slots.length > 0) return true;
        } catch {}
      }
      return false;
    };

    const prefetch = async (view) => {
      setPrefetchingMonth(true);
      try {
        const lastDay = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const localMap = { ...availableMap };
        for (let day = 1; day <= lastDay; day++) {
          if (cancelled) break;
          const d = new Date(view.getFullYear(), view.getMonth(), day);
          if (d < today) continue;
          const dStr = ymd(d);
          if (localMap[dStr] !== undefined) continue;

          const hasAny = await dayHasAny(dStr);
          localMap[dStr] = hasAny;
          if (!cancelled) setAvailableMap((prev) => ({ ...prev, [dStr]: hasAny }));
        }
      } finally {
        if (!cancelled) setPrefetchingMonth(false);
      }
    };

    prefetch(monthView);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarOpen, monthView, employees, slug, serviceId, departmentId]);

  /* fetch per-day availability across ALL providers */
  useEffect(() => {
    if (!calendarOpen || !selectedDate || !employees.length) {
      setDaySlots([]);
      setSelectedTimeKey("");
      return;
    }

    let cancelled = false;
    (async () => {
      setIsFetchingSlots(true);
      try {
        const results = await Promise.all(
          employees.map(async (emp) => {
            const slots = await fetchAvail(emp.id, selectedDate);
            return { emp, slots };
          })
        );

        const unique = aggregateByUTC(selectedDate, results);

        if (!cancelled) {
          setDaySlots(unique || []);
          setAvailableMap((prev) => ({
            ...prev,
            [selectedDate]: (unique?.length || 0) > 0,
          }));
          if (selectedTimeKey && !unique?.some((s) => s.key === selectedTimeKey)) {
            setSelectedTimeKey("");
          }
        }
      } finally {
        if (!cancelled) setIsFetchingSlots(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [calendarOpen, selectedDate, employees, slug, serviceId, departmentId]);

  /* time click → open/close inline provider picker */
  const handleTimeClick = (slot) => {
    const key = slot.key; // start_utc key
    setSelectedTimeKey((prev) => (prev === key ? "" : key));
  };

  const handleArtistSelect = (artist) => {
    if (!selectedSlot) return;

    // Compute provider-local date/time from start_utc (explicit slot TZ)
    const provTz = artist.timezone || "UTC";
    const provDate = dateYMDInTZ(selectedSlot.start_utc, provTz);
    const provTime = timeHMInTZ(selectedSlot.start_utc, provTz);

    navigate({
      pathname: `/${slug}/book`,
      search:
        `?employee_id=${artist.id}` +
        `&service_id=${serviceId}` +
        `&date=${provDate}` +
        `&start_time=${provTime}` +
        `&timezone=${encodeURIComponent(provTz)}` +
        (departmentId ? `&department_id=${departmentId}` : ""),
    });
    setCalendarOpen(false);
  };

  /* month grid helpers */
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const daysInMonth = (view) =>
    new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const firstWeekday = (view) =>
    new Date(view.getFullYear(), view.getMonth(), 1).getDay();

  const dayCell = (dNum) => {
    const d = new Date(monthView.getFullYear(), monthView.getMonth(), dNum);
    const ymdStr = ymd(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = d < today;
    const isSelected = selectedDate === ymdStr;
    const hasAvail = availableMap[ymdStr] === true;

    return (
      <Box
        key={dNum}
        onClick={() => {
          if (!isPast) {
            setSelectedDate(ymdStr); // triggers fetch for that day
            setSelectedTimeKey(""); // collapse picker on date change
          }
        }}
        sx={{
          position: "relative",
          aspectRatio: "1 / 1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 1.2,
          cursor: isPast ? "default" : "pointer",
          border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          bgcolor: isSelected
            ? alpha(theme.palette.primary.main, 0.12)
            : "transparent",
          color: isPast ? "text.disabled" : "text.primary",
          "&:hover": {
            bgcolor: isPast
              ? "transparent"
              : alpha(theme.palette.action.hover, 0.6),
          },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500 }}>
          {dNum}
        </Typography>

        {/* Green dot for days with any availability */}
        {hasAvail && !isPast && (
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              bottom: 6,
              transform: "translateX(-50%)",
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: theme.palette.success.main,
            }}
          />
        )}
      </Box>
    );
  };

  /* guards */
  if (loading) {
    return (
      <PublicPageShell activeKey="__services">
        <Container sx={{ textAlign: "center", mt: 5 }}>
          <CircularProgress />
        </Container>
      </PublicPageShell>
    );
  }
  if (error) {
    return (
      <PublicPageShell activeKey="__services">
        <Container sx={{ mt: 5 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </PublicPageShell>
    );
  }
  if (!service) {
    return (
      <PublicPageShell activeKey="__services">
        <Container sx={{ mt: 5 }}>
          <Typography variant="h6" color="text.secondary">
            Service not found.
          </Typography>
        </Container>
      </PublicPageShell>
    );
  }

  /* UI */
  const page = (
    <Container sx={{ my: { xs: 3, md: 6 } }}>
      {/* Service header */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.25,
            background: `linear-gradient(90deg, ${alpha(
              theme.palette.primary.main,
              0.12
            )} 0%, ${alpha(theme.palette.primary.light, 0.08)} 100%)`,
          }}
        >
          <Typography variant="h4" fontWeight={800}>
            {service.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap" }}>
            <Chip label={`Duration: ${service.duration} min`} />
            <Chip label={`Price: ${money(service.base_price)}`} />
          </Stack>
        </Box>
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
            {service.description || "No description available."}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            You’ll be able to add extras during checkout.
          </Typography>
        </Box>
      </Paper>

      {/* Providers list */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Choose a Provider
        </Typography>
        {employees.length === 0 ? (
          <Typography>No providers available for this service.</Typography>
        ) : (
          <List>
            {employees.map((emp) => (
              <ListItem
                key={emp.id}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  mb: 1.5,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.action.hover, 0.6),
                  },
                }}
                secondaryAction={
                  <Button
                    variant="outlined"
                    sx={bookingButtonOutlinedSx}
                    onClick={() =>
                      navigate({
                        pathname: `/${slug}/services/${serviceId}/employees/${emp.id}`,
                        search: departmentId ? `?department_id=${departmentId}` : "",
                      })
                    }
                  >
                    View & Book
                  </Button>
                }
              >
                <ListItemText
                  primaryTypographyProps={{ fontWeight: 600 }}
                  primary={emp.full_name}
                  secondary={emp.bio || "No bio available."}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* CTA */}
      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="contained"
          size="large"
          sx={{ ...bookingButtonSx, px: 4, py: 1.5, fontSize: '1.05rem' }}
          onClick={() => setCalendarOpen(true)}
          disabled={employees.length === 0}
        >
          📅 Check Availability
        </Button>
      </Box>

      {/* Calendar modal */}
      <Dialog
        fullWidth
        maxWidth="md"
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Select a Time Slot
          <IconButton
            onClick={() => setCalendarOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Month navigator */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Button
                onClick={() =>
                  setMonthView(
                    new Date(
                      monthView.getFullYear(),
                      monthView.getMonth() - 1,
                      1
                    )
                  )
                }
              >
                ◀
              </Button>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {monthView.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </Typography>
              <Button
                onClick={() =>
                  setMonthView(
                    new Date(
                      monthView.getFullYear(),
                      monthView.getMonth() + 1,
                      1
                    )
                  )
                }
              >
                ▶
              </Button>
            </Box>

            {/* Weekdays */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 0.5,
                mb: 0.5,
              }}
            >
              {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                <Box key={d} sx={{ textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    {d}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Month grid with green dots */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 0.5,
              }}
            >
              {Array.from({ length: firstWeekday(monthView) }).map((_, i) => (
                <Box key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth(monthView) }).map((_, i) => {
                const dNum = i + 1;
                return dayCell(dNum);
              })}
            </Box>
          </Paper>

          {/* Selected day header */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 2, flexWrap: "wrap" }}
          >
            <Chip
              color="primary"
              variant="outlined"
              label={`Showing: ${prettyDate(selectedDate) || "—"}`}
            />
            <Chip
              label={
                isFetchingSlots
                  ? "Loading…"
                  : `${daySlots.length} time${
                      daySlots.length === 1 ? "" : "s"
                    } available`
              }
            />
          </Stack>

          {/* Slots (grouped by UTC, displayed in viewer's local time) */}
          {!selectedDate && (
            <Alert severity="info">Pick a date to see available times.</Alert>
          )}
          {selectedDate && !isFetchingSlots && daySlots.length === 0 && (
            <Alert severity="info">No free slots for this day.</Alert>
          )}

          <Box display="flex" flexWrap="wrap" gap={1.2} mb={2}>
            {daySlots.map((s) => {
              const selected = s.key === selectedTimeKey;
              return (
                <Button
                  key={s.key}
                  variant={selected ? "contained" : "outlined"}
                  color="primary"
                  size="small"
                  onClick={() => handleTimeClick(s)}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                  title={
                    s.count > 1
                      ? `${s.count} providers available at this time`
                      : "1 provider available at this time"
                  }
                >
                  {timeFromUTCForViewer(s.start_utc)}
                  {s.count > 1 ? ` • ${s.count}` : ""}
                </Button>
              );
            })}
          </Box>

          {/* Inline provider picker */}
          <Collapse in={!!selectedSlot} unmountOnExit>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                background:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.primary.main, 0.08)
                    : alpha(theme.palette.primary.main, 0.06),
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1.5}
                sx={{ mb: 1.5 }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Choose a Provider — {prettyDate(selectedSlot?.date)} ·{" "}
                  {timeFromUTCForViewer(selectedSlot?.start_utc)} (your time)
                </Typography>
                <Chip
                  size="small"
                  label={`${selectedSlot?.providers?.length || 0} provider${
                    (selectedSlot?.providers?.length || 0) === 1 ? "" : "s"
                  } available`}
                />
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 1.25,
                }}
              >
                {selectedSlot?.providers?.map((p) => (
                  <Card
                    key={p.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 3px ${alpha(
                          theme.palette.primary.main,
                          0.12
                        )}`,
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        p: 1.5,
                      }}
                    >
                      <Avatar sx={{ width: 40, height: 40 }}>
                        {p.full_name?.[0] || "•"}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap fontWeight={700} title={p.full_name}>
                          {p.full_name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {p.start_time_local} • {service?.name}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleArtistSelect(p)}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        Select
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
          </Collapse>
        </DialogContent>
      </Dialog>
    </Container>
  );

  return <PublicPageShell activeKey="__services">{page}</PublicPageShell>;
}




