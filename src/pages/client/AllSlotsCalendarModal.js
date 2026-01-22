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
import { api } from "../../utils/api";
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableArtists, setAvailableArtists] = useState([]);
  const [artistPickerOpen, setArtistPickerOpen] = useState(false);

  // Fetch slots strictly for a single date
  // AllSlotsCalendarModal.js
const fetchSlotsForDate = useCallback(
  async (date) => {
    if (!slug || !serviceId || !date) return;
    setLoading(true);
    setError("");
    try {
      // 1) who can perform this service?
      const { data: emps } = await api.get(`/public/${slug}/service/${serviceId}/employees`, {
        params: departmentId ? { department_id: departmentId } : {},
        noCompanyHeader: true,
        noAuth: true,
      });

      const userTz = getUserTimezone();
      const cartJSON = buildCartPayload({ date });

      // 2) fetch availability per-employee (canonical route)
      const perEmpPromises = (emps || []).map(async (emp) => {
        const qs = new URLSearchParams({
          artist_id: emp.id,
          service_id: serviceId,
          date,
          timezone: userTz,
          explicit_only: 1,  // <- use only manager rows
          respect_rows: 1,   // <- no auto-subdivision
          ...(departmentId ? { department_id: departmentId } : {}),
        });
        if (cartJSON) qs.set("cart", cartJSON);

        try {
          const { data } = await api.get(`/public/${slug}/availability?${qs.toString()}`, {
            noCompanyHeader: true,
            noAuth: true,
          });
          const slots = Array.isArray(data?.slots) ? data.slots
                      : Array.isArray(data?.times) ? data.times
                      : [];
          return slots
            .filter((s) => slotIsAvailable(s))
            .map((s) => ({ ...s, date })); // force day label
        } catch {
          return [];
        }
      });

      const perEmpSlots = await Promise.all(perEmpPromises);
      const all = perEmpSlots.flat();



// ── Dedupe by identical start_utc across employees ──────────────────────────
const groups = new Map();
for (const s of all) {
  // robust fallback if start_utc is missing for any reason
  const key =
    s.start_utc ||
    `${s.date}T${s.start_time}|${s.timezone || ""}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(s);
}

// one representative per time, with a count and optional employee ids
const deduped = [...groups.values()].map((arr) => {
  const s0 = arr[0];
  const seatsLefts = arr.map(resolveSeatsLeft).filter((n) => Number.isFinite(n));
  return {
    ...s0,
    _count: arr.length,
    mode: arr.some((s) => s.mode === "group") ? "group" : s0.mode,
    seats_left: seatsLefts.length ? Math.max(...seatsLefts) : null,
    _employee_ids: arr
      .map((x) => x.employee_id || x.artist_id || x.recruiter_id)
      .filter(Boolean),
  };
});

// sort by time (start_utc preferred)
deduped.sort((a, b) => {
  const ka = a.start_utc || `${a.date} ${a.start_time}`;
  const kb = b.start_utc || `${b.date} ${b.start_time}`;
  return ka.localeCompare(kb);
});


      setRawSlots(deduped);
      if (!backendTimezone && deduped.length > 0) {
   const tz = deduped.find((s) => s.timezone)?.timezone;
        setBackendTimezone(tz || userTz);
      }
    } catch (err) {
      console.error("❌ Failed to fetch slots:", err);
      setError("Could not load available slots. Please try again later.");
      setRawSlots([]);
    } finally {
      setLoading(false);
    }
  },
  [slug, serviceId, departmentId, backendTimezone]
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
      fetchSlotsForDate(start);

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
    }
  };

  const handleSlotClick = async (slot) => {
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
const seatsTxt = s.mode === "group" && slotSeatsLabel(s) ? ` • ${slotSeatsLabel(s)}` : "";
    return {
      id: s.start_utc || `${s.date}-${s.start_time}-${s.timezone || ""}`,
     title: s.type === "booked"
       ? `🛑 ${labelDate} • ${slotDisplay.time}${countTxt}${seatsTxt}`
       : `✓ ${labelDate} • ${slotDisplay.time}${countTxt}${seatsTxt}`,
      start: slotDisplay.iso,
      end: endDisplay ? endDisplay.iso : null,
      classNames: [s.type === "booked" ? "slot-booked" : "slot-available"],
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
          sx={{ fontWeight: 800, pr: 6, backgroundColor: surfaceBg }}
        >
          📅 Select an Available Slot
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
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, flexWrap: "wrap" }}>
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
