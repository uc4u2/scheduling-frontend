import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Box,
  Chip,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { api, publicSite } from "../../utils/api";
import { getUserTimezone } from "../../utils/timezone";
import { formatSlot } from "../../utils/timezone-wrapper";
import { useTheme, alpha } from "@mui/material/styles";
import { resolveSeatsLeft, slotIsAvailable, slotSeatsLabel } from "../../utils/bookingSlots";

const fmtDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/** Build "cart" JSON for the availability endpoint (filter by date and optional artist) */
function buildCartPayload({ date, artistId = null }) {
  try {
    const raw = JSON.parse(sessionStorage.getItem("booking_cart") || "[]");
    const filtered = raw
      .filter((it) => it && it.date === date && (!artistId || String(it.artist_id) === String(artistId)))
      .map((it) => ({
        artist_id: it.artist_id,
        service_id: it.service_id,
        date: it.date,
        start_time: it.start_time,
        addon_ids: Array.isArray(it.addon_ids) && it.addon_ids.length
          ? it.addon_ids
          : Array.isArray(it.addons) ? it.addons.map((a) => a && a.id).filter(Boolean) : []
      }));
    return JSON.stringify(filtered);
  } catch (e) {
    return "[]";
  }
}

const AllSlotsCalendarModal = ({
  open,
  onClose,
  slug,
  serviceId,
  departmentId,
  onArtistChosen,
  filterByDate = true,
  initialDate, // optional YYYY-MM-DD to open on
}) => {
  const calRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const surfaceBg = "var(--page-surface-bg, #ffffff)";
  const userTz = getUserTimezone();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawSlots, setRawSlots] = useState([]);
  const [backendTimezone, setBackendTimezone] = useState(null);
  const [primaryArtistId, setPrimaryArtistId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableArtists, setAvailableArtists] = useState([]);
  const [artistPickerOpen, setArtistPickerOpen] = useState(false);
  const availCacheRef = useRef(new Map());
  const availInflightRef = useRef(new Map());
  const [monthAvailability, setMonthAvailability] = useState({});
  const monthCacheRef = useRef(new Map());

  const buildMonthKey = (d) =>
    `${slug || "?"}|${serviceId || "?"}|${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const prefetchMonthAvailability = useCallback(
    async (monthDate) => {
      if (!slug || !serviceId) return;
      const monthKey = buildMonthKey(monthDate);
      if (monthCacheRef.current.has(monthKey)) {
        const cached = monthCacheRef.current.get(monthKey);
        if (cached && typeof cached === "object") {
          setMonthAvailability((prev) => ({ ...prev, ...cached }));
        }
        return;
      }
      try {
        const { data } = await api.get(`/public/${slug}/availability-by-service/${serviceId}`, {
          noCompanyHeader: true,
          noAuth: true,
        });
        const slots = Array.isArray(data?.slots)
          ? data.slots
          : Array.isArray(data?.times)
          ? data.times
          : Array.isArray(data)
          ? data
          : [];
        const monthMap = {};
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        const startKey = monthStart.toISOString().slice(0, 10);
        const endKey = monthEnd.toISOString().slice(0, 10);
        for (const s of slots) {
          const dateKey = s.date || (s.start_utc ? s.start_utc.slice(0, 10) : null);
          if (!dateKey || dateKey < startKey || dateKey > endKey) continue;
          const mode = (s.mode || "one_to_one").toString().toLowerCase();
          const seatsLeft = resolveSeatsLeft(s);
          const available =
            mode === "group"
              ? Number.isFinite(seatsLeft)
                ? seatsLeft > 0
                : s.type !== "booked"
              : s.type !== "booked";
          if (available) monthMap[dateKey] = true;
        }
        monthCacheRef.current.set(monthKey, monthMap);
        setMonthAvailability((prev) => ({ ...prev, ...monthMap }));
      } catch {
        // ignore
      }
    },
    [slug, serviceId]
  );

  useEffect(() => {
    if (!open || !slug || !serviceId) return;
    let cancelled = false;
    (async () => {
      try {
        const emps = await publicSite.getServiceEmployees(slug, serviceId, departmentId);
        if (cancelled) return;
        setEmployees(Array.isArray(emps) ? emps : []);
        setPrimaryArtistId(emps?.[0]?.id || null);
      } catch {
        if (cancelled) return;
        setEmployees([]);
        setPrimaryArtistId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, slug, serviceId, departmentId]);

  useEffect(() => {
    monthCacheRef.current.clear();
    setMonthAvailability({});
  }, [slug, serviceId]);

  // Fetch slots strictly for a single date
  // AllSlotsCalendarModal.js
const fetchSlotsForDate = useCallback(
  async (date) => {
    if (!slug || !serviceId || !date || !employees.length) return;
    setLoading(true);
    setError("");
    try {
      const userTz = getUserTimezone();
      const cartJSON = buildCartPayload({ date });
      const cacheKey = `${slug}|${serviceId}|all|${date}`;
      const cached = availCacheRef.current.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        setRawSlots(cached.data);
        if (!backendTimezone && cached.data.length > 0) {
          const tz = cached.data.find((s) => s.timezone)?.timezone;
          setBackendTimezone(tz || userTz);
        }
        return;
      }
      const inflight = availInflightRef.current.get(cacheKey);
      if (inflight) {
        const data = await inflight;
        setRawSlots(data);
        return;
      }

      const load = (async () => {
        const results = await Promise.all(
          employees.map(async (emp) => {
            const qs = new URLSearchParams({
              artist_id: emp.id,
              service_id: serviceId,
              date,
              timezone: userTz,
              explicit_only: 1,
              respect_rows: 1,
              ...(departmentId ? { department_id: departmentId } : {}),
            });
            if (cartJSON) qs.set("cart", cartJSON);
            const { data } = await api.get(`/public/${slug}/availability?${qs.toString()}`, {
              noCompanyHeader: true,
              noAuth: true,
            });
            const slots = Array.isArray(data?.slots)
              ? data.slots
              : Array.isArray(data?.times)
              ? data.times
              : [];
            const booked = Array.isArray(data?.booked) ? data.booked : [];
            const svcMinutes = Number(data?.service_duration || 0);
            const markBookedOverlaps = (items) => {
              if (!booked.length) return items;
              return items.map((s) => {
                const mode = s.mode || "one_to_one";
                if (mode === "group" && Number.isFinite(s.seats_left) && s.seats_left > 0) {
                  return s;
                }
                const stUtc = s.start_utc
                  ? new Date(s.start_utc)
                  : (s.date && s.start_time && s.timezone
                    ? new Date(`${s.date}T${s.start_time}:00${s.timezone ? "" : "Z"}`)
                    : null);
                if (!stUtc || Number.isNaN(stUtc.getTime())) return s;
                const etUtc = s.end_utc
                  ? new Date(s.end_utc)
                  : new Date(stUtc.getTime() + Math.max(svcMinutes, 0) * 60000);
                const overlaps = booked.some((b) => {
                  const bStart = b.start_utc ? new Date(b.start_utc) : null;
                  const bEnd = b.end_utc ? new Date(b.end_utc) : null;
                  if (!bStart || !bEnd || Number.isNaN(bStart.getTime()) || Number.isNaN(bEnd.getTime())) {
                    return false;
                  }
                  return stUtc < bEnd && etUtc > bStart;
                });
                return overlaps ? { ...s, type: "booked" } : s;
              });
            };
            const slotsMarked = markBookedOverlaps(slots).map((s) => ({ ...s, date }));
            const withBooked = new Map();
            for (const s of slotsMarked) {
              const key = s.start_utc || `${s.date}-${s.start_time}-${s.timezone || ""}`;
              withBooked.set(key, s);
            }
            for (const b of booked) {
              const entry = { ...b, date: b.date || date, type: "booked" };
              const key = entry.start_utc || `${entry.date}-${entry.start_time}-${entry.timezone || ""}`;
              if (!withBooked.has(key)) {
                withBooked.set(key, entry);
              }
            }
            return Array.from(withBooked.values());
          })
        );

        const map = new Map();
        for (const providerSlots of results) {
          for (const s of providerSlots) {
            const key = s.start_utc || `${s.date}-${s.start_time}-${s.timezone || ""}`;
            const mode = s.mode || "one_to_one";
            const seatsLeft = resolveSeatsLeft(s);
            const isGroup = mode === "group";
            const isUnavailable = isGroup
              ? (Number.isFinite(seatsLeft) ? seatsLeft <= 0 : s.type === "booked")
              : s.type === "booked";
            const isAvailable = !isUnavailable;
            if (!map.has(key)) {
              map.set(key, {
                ...s,
                type: isAvailable ? "available" : "booked",
                has_available: isAvailable,
                seats_left: Number.isFinite(seatsLeft) ? seatsLeft : s.seats_left,
              });
            } else {
              const curr = map.get(key);
              if (isAvailable) curr.has_available = true;
              if (Number.isFinite(seatsLeft) && isAvailable) {
                const prev = Number.isFinite(curr.seats_left) ? curr.seats_left : 0;
                curr.seats_left = Math.max(prev, seatsLeft);
              }
            }
          }
        }

        return Array.from(map.values()).map((s) => ({
          ...s,
          type: s.has_available ? "available" : "booked",
        }));
      })();

      availInflightRef.current.set(cacheKey, load);
      const slots = await load;
      availCacheRef.current.set(cacheKey, {
        data: slots,
        expiresAt: Date.now() + 60_000,
      });
      setRawSlots(slots);
      if (date) {
        const hasAny = slots.some((s) => slotIsAvailable(s));
        if (hasAny) {
          setMonthAvailability((prev) => ({ ...prev, [date]: true }));
        }
      }
      if (!backendTimezone && slots.length > 0) {
        const tz = slots.find((s) => s.timezone)?.timezone;
        setBackendTimezone(tz || userTz);
      }
    } catch (err) {
      console.error("❌ Failed to fetch slots:", err);
      setError("Could not load available slots. Please try again later.");
      setRawSlots([]);
    } finally {
      const cacheKey = `${slug}|${serviceId}|all|${date}`;
      availInflightRef.current.delete(cacheKey);
      setLoading(false);
    }
  },
  [slug, serviceId, departmentId, backendTimezone, employees]
);


  const fetchAvailableArtists = async (slot) => {
    try {
      const { data } = await api.get(
        `/public/${slug}/service/${serviceId}/available-artists`,
        {
          params: {
            date: slot.date,
            start_time: slot.start_time,
            timezone: slot.timezone || backendTimezone || userTz,
          },
          noCompanyHeader: true,
          noAuth: true,
        }
      );
      setAvailableArtists(data || []);
    } catch (err) {
      console.error("❌ Failed to fetch artists:", err);
      setAvailableArtists([]);
    }
  };

  // Only show the clicked date if requested + apply day-level constraints
  const displayedSlots = useMemo(() => {
    let list = rawSlots;
    if (filterByDate && selectedDate) {
      list = list.filter((s) => s.date === selectedDate);
    }
    return list;
  }, [rawSlots, filterByDate, selectedDate]);

  // When modal opens, default to the provided date (or today) and force Day view
  useEffect(() => {
    if (open) {
      const start = (initialDate || new Date().toISOString().slice(0, 10));
      setSelectedDate(start);

      requestAnimationFrame(() => {
        const api = calRef.current?.getApi?.();
        if (api) api.changeView(isMobile ? "dayGridMonth" : "timeGridDay", start);
      });
    } else {
      setSelectedSlot(null);
      setAvailableArtists([]);
      setError("");
    }
  }, [open, initialDate, fetchSlotsForDate, isMobile]);

  useEffect(() => {
    if (!open || !selectedDate || !employees.length) return;
    fetchSlotsForDate(selectedDate);
  }, [open, selectedDate, employees, fetchSlotsForDate]);

  useEffect(() => {
    if (!open) return;
    if (selectedDate) {
      prefetchMonthAvailability(new Date(selectedDate));
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    setSelectedDate(today);
    prefetchMonthAvailability(new Date(today));
  }, [open, selectedDate, prefetchMonthAvailability]);

  useEffect(() => {
    if (!open) return;
    const api = calRef.current?.getApi?.();
    if (!api) return;
    const start = api.view?.currentStart;
    if (start) {
      prefetchMonthAvailability(start);
    }
  }, [open, prefetchMonthAvailability]);

  const handleDateClick = (arg) => {
    const clickedDate = arg.dateStr;
    setSelectedDate(clickedDate);
    arg.view.calendar.changeView("timeGridDay", clickedDate);
    fetchSlotsForDate(clickedDate);
  };

  const handleDatesSet = (info) => {
    if (info.view.type === "timeGridDay") {
      const day = info.startStr.slice(0, 10);
      if (day !== selectedDate) {
        setSelectedDate(day);
        fetchSlotsForDate(day);
      }
    } else {
      prefetchMonthAvailability(info.start);
    }
  };

  const handleSlotClick = async (slot) => {
    if (!slotIsAvailable(slot)) {
      return;
    }
    setSelectedSlot(slot);
    await fetchAvailableArtists(slot);
    setArtistPickerOpen(true);
  };

  const handleArtistSelect = (artist) => {
    setArtistPickerOpen(false);
    onArtistChosen({
      date: selectedSlot.date,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      timezone: selectedSlot.timezone || backendTimezone || userTz,
      artist_id: artist.id,
      artist_name: artist.full_name,
      service_id: serviceId,
    });
    onClose();
  };

  // Make events clearly include the DAY context visually
  const events = displayedSlots.map((s) => {
    const isAvailable = slotIsAvailable(s);
    const seatsLeft = s.mode === "group" ? resolveSeatsLeft(s) : null;
    const isFullGroup = s.mode === "group" && Number.isFinite(seatsLeft) && seatsLeft <= 0;
    const slotDisplay = formatSlot(s);
    const endDisplay =
      s.end_time &&
      formatSlot({
        ...s,
        start_time: s.end_time,
      });

    // Build a readable label with date + time for clarity
    const labelDate = new Date(slotDisplay.iso).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
const countTxt = s._count > 1 ? ` (${s._count})` : "";
const seatsTxt = s.mode === "group" && slotSeatsLabel(s) ? slotSeatsLabel(s) : "";
    return {
      id: s.start_utc || `${s.date}-${s.start_time}-${s.timezone || ""}`,
     title: !isAvailable
       ? `🛑 ${labelDate} • ${slotDisplay.time}${countTxt}${seatsTxt}${isFullGroup ? " • Full" : ""}`
       : `✓ ${labelDate} • ${slotDisplay.time}${countTxt}${seatsTxt}`,
      start: slotDisplay.iso,
      end: endDisplay ? endDisplay.iso : null,
      classNames: [!isAvailable ? "slot-booked" : "slot-available"],
      extendedProps: s,
    };
  });

  return (
    <>
      {/* Main calendar modal */}
      <Dialog
        fullScreen={isMobile}
        fullWidth
        maxWidth="lg"
        open={open}
        onClose={onClose}
        aria-labelledby="all-slots-calendar-title"
        PaperProps={{
          sx: {
            backgroundColor: surfaceBg,
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle
          id="all-slots-calendar-title"
          sx={{
            fontWeight: 800,
            pr: 6,
            backgroundColor: surfaceBg,
            textAlign: { xs: "center", md: "left" },
          }}
        >
          📅 Select a Time Slot
          <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            backgroundColor: surfaceBg,
            "& .fc-theme-standard .fc-scrollgrid": {
              borderRadius: 12,
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              overflow: "hidden",
            },
            "& .fc .fc-toolbar-title": { fontWeight: 700 },
            "& .fc .fc-button": { borderRadius: 8, textTransform: "none", fontWeight: 600 },
            "& .fc .fc-daygrid-day.fc-day-today, & .fc .fc-timegrid-col.fc-day-today": {
              backgroundColor: alpha(theme.palette.primary.main, 0.06),
            },
            "& .slot-available": {
              backgroundColor: alpha(theme.palette.success.main, 0.16),
              border: `1px solid ${alpha(theme.palette.success.main, 0.45)}`,
              color: theme.palette.success.dark,
              borderRadius: 8,
              padding: "2px 6px",
              fontWeight: 600,
            },
            "& .slot-booked": {
              backgroundColor: alpha(theme.palette.error.main, 0.12),
              border: `1px solid ${alpha(theme.palette.error.main, 0.45)}`,
              color: theme.palette.error.dark,
              borderRadius: 8,
              padding: "2px 6px",
              fontWeight: 600,
              textDecoration: "line-through",
              opacity: 0.85,
            },
            "& .fc-timegrid-slot": { height: "2.2em" },
          }}
        >
          {/* Date context + slot count = no more confusion */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              mb: 2,
              flexWrap: "wrap",
              justifyContent: { xs: "center", md: "flex-start" },
            }}
          >
            <Chip color="primary" variant="outlined" label={`Showing: ${fmtDate(selectedDate || "")}`} />
            <Chip label={`${events.length} slot${events.length === 1 ? "" : "s"} on this day`} />
          </Stack>

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress size={48} />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && (
            <FullCalendar
              ref={calRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={isMobile ? "dayGridMonth" : "timeGridDay"}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: isMobile ? "dayGridMonth,timeGridDay" : "dayGridMonth,timeGridDay",
              }}
              height={isMobile ? "auto" : "auto"}
              expandRows
              dayMaxEventRows
              nowIndicator
              stickyHeaderDates
              navLinks={false}
              dateClick={handleDateClick}
              datesSet={handleDatesSet}
              dayCellContent={(arg) => {
                const dateStr = arg.dateStr || arg.date.toISOString().slice(0, 10);
                const hasAvail = monthAvailability[dateStr] === true;
                return (
                  <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                    <span>{arg.dayNumberText}</span>
                    {hasAvail && (
                      <span
                        style={{
                          position: "absolute",
                          left: "50%",
                          bottom: 2,
                          transform: "translateX(-50%)",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: theme.palette.primary.main,
                        }}
                      />
                    )}
                  </Box>
                );
              }}
              eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: true }}
              slotEventOverlap={false}
              events={events}
              eventClick={({ event }) => handleSlotClick(event.extendedProps)}
              eventContent={({ event }) => (
                <Tooltip title={event.title} arrow>
                  <span style={{ display: "inline-block", width: "100%" }}>{event.title}</span>
                </Tooltip>
              )}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ backgroundColor: surfaceBg }}>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Artist selection modal */}
      <Dialog
        fullWidth
        maxWidth="sm"
        open={artistPickerOpen}
        onClose={() => setArtistPickerOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: surfaceBg,
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pr: 6, backgroundColor: surfaceBg }}>
          Choose a Provider for {selectedSlot?.date} at {selectedSlot?.start_time}
          <IconButton onClick={() => setArtistPickerOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ backgroundColor: surfaceBg }}>
          {availableArtists.length === 0 ? (
            <Typography>No providers available for this time.</Typography>
          ) : (
            <List dense>
              {availableArtists.map((artist) => (
                <ListItem
                  key={artist.id}
                  secondaryAction={
                    <Button variant="contained" onClick={() => handleArtistSelect(artist)}>
                      Select & Continue
                    </Button>
                  }
                >
                  <ListItemText
                    primary={artist.full_name}
                    secondary={artist.bio || "No bio available"}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions sx={{ backgroundColor: surfaceBg }}>
          <Button onClick={() => setArtistPickerOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AllSlotsCalendarModal;
