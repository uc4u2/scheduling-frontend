// src/pages/sections/MySetmoreCalendar.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Alert,
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  GlobalStyles,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  TextField,
  Menu,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import moment from "moment-timezone";
import api from "./utils/api";

// timezone-safe helpers (paths you confirmed)
import { formatSlot } from "./utils/timezone-wrapper";
import { isoFromParts } from "./utils/datetime";

/**
 * Enterprise Setmore-style calendar for the CURRENT EMPLOYEE.
 * Data source: /recruiter/calendar?view=fragments (availability fragments only).
 * Adds employee-side actions if manager permitted in /api/employee/permissions.
 */
export default function MySetmoreCalendar({ token, initialDate }) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const calRef = useRef(null);
  const fsCalRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    initialDate || moment().format("YYYY-MM-DD")
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // Pro options
  const [calendarView, setCalendarView] = useState("dayGridMonth"); // "timeGridWeek" | "timeGridDay"
  const [granularity, setGranularity] = useState("00:30:00"); // "00:15:00" | "00:30:00" | "01:00:00"
  const [timeFmt12h, setTimeFmt12h] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [workHoursOnly, setWorkHoursOnly] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);
  const [statusFilter, setStatusFilter] = useState([]); // [] = both; or ["available"], ["booked"]
  const [fullScreenOpen, setFullScreenOpen] = useState(false);

  const viewerTz =
    localStorage.getItem("timezone") ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

  // ---------- permissions ----------
  const [canCloseSlots, setCanCloseSlots] = useState(false);
  const [canEditAvailability, setCanEditAvailability] = useState(false);

  const fetchPermissions = async () => {
    if (!token) return;
    try {
      const { data } = await api.get("/api/employee/permissions");
      setCanCloseSlots(!!data?.can_close_slots);
      setCanEditAvailability(!!data?.can_edit_availability);
    } catch {
      setCanCloseSlots(false);
      setCanEditAvailability(false);
    }
  };

  // ---------- normalize event to tz-safe UI slot ----------
  const toUiSlot = (raw) => {
    const tz = raw.timezone || viewerTz;

    // Always build ISO from server-local parts (no toISOString / no slicing ISO)
    const startHH = (raw.start_time || "").slice(0, 5);
    const endHH   = (raw.end_time || "").slice(0, 5);

    const startDisp = formatSlot({ date: raw.date, start_time: startHH, timezone: tz });
    const endDisp   = endHH ? formatSlot({ date: raw.date, start_time: endHH, timezone: tz }) : null;

    const startISO = startDisp?.iso || isoFromParts(raw.date, startHH, tz);
    const endISO   = endDisp?.iso   || (endHH ? isoFromParts(raw.date, endHH, tz) : startISO);

    const startLabel = timeFmt12h
      ? moment(startISO).format("h:mma")
      : moment(startISO).format("HH:mm");
    const endLabel = timeFmt12h
      ? moment(endISO).format("h:mma")
      : moment(endISO).format("HH:mm");

    // 🔒 IMPORTANT: keep day filtering tied to server-local date
    const dateLocal = raw.date; // <— this fixes the “0 slot(s)” issue

    return {
      ...raw,
      tz,
      startISO,
      endISO,
      localDate: raw.date, // send this exact date back to the server
      startHH,
      endHH,
      dateLocal,
      startLabel,
      endLabel,
      __status: raw.booked ? "booked" : "available",
      service_name: raw.service_name || "",
    };
  };

  // ---------- load events ----------
  const fetchEvents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await api.get("/recruiter/calendar", {
        params: { view: "fragments" },
      });

      const normalized = (data.events || [])
        .filter((e) => e.type === "availability")
        .map(toUiSlot);

      setEvents(normalized);
      setErr("");
    } catch (e) {
      setErr("Failed to load your availability.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------- day rail ----------
  const daySlots = useMemo(() => {
    let list = events.filter((e) => e.dateLocal === selectedDate);
    if (statusFilter.length) list = list.filter((e) => statusFilter.includes(e.__status));
    return list.sort((a, b) => a.startISO.localeCompare(b.startISO));
  }, [events, selectedDate, statusFilter]);

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr); // YYYY-MM-DD from FullCalendar (browser local)
    const api = calRef.current?.getApi?.();
    if (api) api.changeView(calendarView || "dayGridMonth", arg.date);
  };

  const onEventClick = (info) => {
    const d = moment(info.event.start).format("YYYY-MM-DD");
    setSelectedDate(d);
  };

  // --------------------- formatting & event rendering ---------------------
  const eventTimeFormat = useMemo(
    () =>
      timeFmt12h
        ? { hour: "numeric", minute: "2-digit", meridiem: "short" }
        : { hour: "2-digit", minute: "2-digit", meridiem: false },
    [timeFmt12h]
  );

  const slotLabelFormat = useMemo(
    () =>
      timeFmt12h
        ? { hour: "numeric", minute: "2-digit", meridiem: "short" }
        : { hour: "2-digit", minute: "2-digit", meridiem: false },
    [timeFmt12h]
  );

  const renderEventContent = (arg) => {
    const xp = arg.event.extendedProps || {};
    const status = xp.__status === "booked" ? "Booked" : "Available";
    const svc = xp.service_name ? String(xp.service_name) : "";
    return (
      <div style={{ padding: "4px 6px 6px", lineHeight: 1.2, borderLeft: "4px solid #1976d2" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 0.3,
              padding: "2px 6px",
              borderRadius: 8,
              background: xp.__status === "booked" ? "#ffd6d9" : "#e6f4ea",
              border: `1px solid ${xp.__status === "booked" ? "#ff4d4f" : "#34a853"}`,
              color: "#111",
              whiteSpace: "nowrap",
            }}
          >
            {status}
          </span>
          <span style={{ fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} />
        </div>
        {svc ? (
          <div style={{ fontSize: 11, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {svc}
          </div>
        ) : null}
      </div>
    );
  };

  const eventDidMount = (info) => {
    const xp = info.event.extendedProps || {};
    const start = info.event.start ? moment(info.event.start).format(timeFmt12h ? "h:mma" : "HH:mm") : "";
    const end = info.event.end ? moment(info.event.end).format(timeFmt12h ? "h:mma" : "HH:mm") : "";
    const svc = xp.service_name ? `\nService: ${xp.service_name}` : "";
    info.el.setAttribute("title", `${xp.__status === "booked" ? "BOOKED" : "AVAILABLE"}\n${start}–${end}${svc}`);
  };

  // ---------------------------- calendar events ----------------------------
  const filteredForCalendar = useMemo(() => {
    let list = events;
    if (statusFilter.length) list = list.filter((e) => statusFilter.includes(e.__status));
    return list;
  }, [events, statusFilter]);

  const calendarEvents = filteredForCalendar.map((e) => ({
    id: e.id,
    title: e.booked ? "Booked" : "Available",
    start: e.startISO,
    end: e.endISO,
    backgroundColor: e.booked ? "#ffe5e9" : "#e7f7ec",
    borderColor: e.booked ? "#ff4d4f" : "#34a853",
    textColor: "#111",
    classNames: [e.booked ? "slot-booked" : "slot-available"],
    extendedProps: e,
  }));

  const baseCalProps = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    events: calendarEvents,
    weekends: showWeekends,
    nowIndicator: true,
    expandRows: true,
    dayMaxEvents: 4,
    displayEventEnd: true,
    stickyHeaderDates: true,
    navLinks: true,
    scrollTime: "08:00:00",
    slotDuration: granularity,
    slotLabelInterval: "01:00",
    slotMinTime: workHoursOnly ? "08:00:00" : "00:00:00",
    slotMaxTime: workHoursOnly ? "20:00:00" : "24:00:00",
    eventTimeFormat,
    slotLabelFormat,
    dateClick: handleDateClick,
    eventClick: onEventClick,
    eventContent: renderEventContent,
    eventDidMount,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
  };

  // ====== helpers: API fallbacks (employee -> manager) ======
  const postTry = async (paths, body) => {
    for (const p of paths) {
      try {
        await api.post(p, body);
        return true;
      } catch {
        // try next
      }
    }
    return false;
  };
  const delTry = async (paths) => {
    for (const p of paths) {
      try {
        await api.delete(p);
        return true;
      } catch {
        // continue
      }
    }
    return false;
  };

  const tryCloseDayBulk = (payload) =>
    postTry(
      [
        "/employee/availability/close-day",
        "/api/employee/availability/close-day",
        "/manager/availability/close-day",
        "/api/manager/availability/close-day",
      ],
      payload
    );

  const tryCloseBeforeBulk = (payload) =>
    postTry(
      [
        "/employee/availability/close-before",
        "/api/employee/availability/close-before",
        "/manager/availability/close-before",
        "/api/manager/availability/close-before",
      ],
      payload
    );

  const tryCloseAfterBulk = (payload) =>
    postTry(
      [
        "/employee/availability/close-after",
        "/api/employee/availability/close-after",
        "/manager/availability/close-after",
        "/api/manager/availability/close-after",
      ],
      payload
    );

  const tryKeepRangeBulk = (payload) =>
    postTry(
      [
        "/employee/availability/keep-range",
        "/api/employee/availability/keep-range",
        "/manager/availability/keep-range",
        "/api/manager/availability/keep-range",
      ],
      payload
    );

  const availabilityIdFromEvent = (s) => {
    if (s.availability_id) return s.availability_id;
    if (typeof s.id === "number") return s.id;
    if (typeof s.id === "string" && s.id.startsWith("avail-")) {
      const n = parseInt(s.id.split("-")[1], 10);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const tryDeleteAvailability = async (slot) => {
    const aid = availabilityIdFromEvent(slot);
    if (!aid) return false;
    return delTry([
      `/employee/availability/${aid}`,
      `/api/employee/availability/${aid}`,
      `/manager/availability/${aid}`,
      `/api/manager/availability/${aid}`,
    ]);
  };

  const tryUpdateAvailability = async (slot, patch) => {
    const aid = availabilityIdFromEvent(slot);
    if (!aid) return false;
    const paths = [
      `/employee/availability/${aid}`,
      `/api/employee/availability/${aid}`,
      `/manager/availability/${aid}`,
      `/api/manager/availability/${aid}`,
    ];
    for (const p of paths) {
      try {
        await api.put(p, patch);
        return true;
      } catch {}
    }
    return false;
  };

  // ====== Day Actions (employee) ======
  const [dayMenuEl, setDayMenuEl] = useState(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [dayMode, setDayMode] = useState("keep-range"); // "close-day" | "close-before" | "close-after" | "keep-range"
  const [dayTimeA, setDayTimeA] = useState("09:00");
  const [dayTimeB, setDayTimeB] = useState("17:00");

  // Detect default window from FREE slots (local HH:MM)
  useEffect(() => {
    const free = daySlots.filter((s) => s.__status === "available");
    if (!free.length) return;
    let earliest = "23:59";
    let latest = "00:00";
    for (const s of free) {
      if (s.startHH && s.startHH < earliest) earliest = s.startHH;
      if (s.endHH && s.endHH > latest) latest = s.endHH;
    }
    setDayTimeA(earliest);
    setDayTimeB(latest);
  }, [daySlots]);

  const applyDayAction = async () => {
    if (!(canCloseSlots || canEditAvailability)) {
      setErr("You don’t have permission to change availability.");
      return;
    }

    const localDate = (daySlots[0]?.localDate) || selectedDate;

    try {
      let ok = false;
      if (dayMode === "close-day") {
        ok = await tryCloseDayBulk({ date: localDate, recruiter_id: daySlots[0]?.recruiter_id });
      } else if (dayMode === "close-before") {
        ok = await tryCloseBeforeBulk({
          date: localDate,
          recruiter_id: daySlots[0]?.recruiter_id,
          until_time: dayTimeA,
        });
      } else if (dayMode === "close-after") {
        ok = await tryCloseAfterBulk({
          date: localDate,
          recruiter_id: daySlots[0]?.recruiter_id,
          from_time: dayTimeA,
        });
      } else if (dayMode === "keep-range") {
        if (!(dayTimeA && dayTimeB && dayTimeA < dayTimeB)) {
          setErr("Start must be earlier than end.");
          return;
        }
        ok = await tryKeepRangeBulk({
          date: localDate,
          recruiter_id: daySlots[0]?.recruiter_id,
          start_time: dayTimeA,
          end_time: dayTimeB,
        });
      }

      // Fallback: delete free slots based on local HH:MM compares
      if (!ok) {
        for (const s of daySlots) {
          if (s.__status === "booked") continue;
          const t = s.startHH;
          const shouldDelete =
            dayMode === "close-day" ? true :
            dayMode === "close-before" ? (t < dayTimeA) :
            dayMode === "close-after"  ? (t >= dayTimeA) :
            dayMode === "keep-range"   ? !(t >= dayTimeA && t < dayTimeB) :
            false;
          if (shouldDelete) await tryDeleteAvailability(s);
        }
      }

      setDayDialogOpen(false);
      setDayMenuEl(null);
      setMsg("Availability updated ✔");
      fetchEvents();
    } catch {
      setErr("Failed to update availability.");
    }
  };

  // Chip menu (per-slot). We keep simple delete-on-× for free slots.
  const [chipMenuEl, setChipMenuEl] = useState(null);
  const [chipSlot, setChipSlot] = useState(null);

  const openChipMenu = (evt, slot) => {
    setChipSlot(slot);
    setChipMenuEl(evt.currentTarget);
  };
  const closeChipMenu = () => {
    setChipMenuEl(null);
    setChipSlot(null);
  };

  const deleteChipSlot = async () => {
    if (!(canCloseSlots || canEditAvailability)) {
      setErr("You don’t have permission to delete slots.");
      return;
    }
    if (!chipSlot || chipSlot.__status !== "available") {
      setErr("Only free slots can be deleted.");
      return;
    }
    const ok = await tryDeleteAvailability(chipSlot);
    if (!ok) {
      setErr("Could not delete this slot.");
    } else {
      setMsg("Slot deleted.");
      fetchEvents();
    }
    closeChipMenu();
  };

  return (
    <Box>
      {/* Global tweaks for Week/Day readability */}
      <GlobalStyles
        styles={{
          ".fc .fc-timegrid-slot": { height: compactDensity ? 26 : 32 },
          ".fc .fc-timegrid-axis-cushion, .fc .fc-timegrid-slot-label-cushion": { fontSize: 12 },
          ".fc .fc-timegrid-event": { borderRadius: 8, boxShadow: "0 1px 0 rgba(0,0,0,0.08)" },
          ".fc .fc-timegrid-event .fc-event-time": { fontWeight: 700, fontSize: 11, paddingLeft: 4 },
          ".fc .fc-timegrid-event .fc-event-title": { fontSize: 11 },
          ".fc .fc-toolbar-title": { fontWeight: 700 },
        }}
      />

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {msg && (
        <Snackbar open onClose={() => setMsg("")} autoHideDuration={3000} message={msg} />
      )}

      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{ mb: 1 }}
          spacing={1}
        >
          <Typography variant="h6" fontWeight={700}>
            My Availability{" "}
            <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>
              &nbsp;(Enterprise)
            </Typography>
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <Chip size="small" label={`TZ: ${viewerTz}`} />
            <Button variant="outlined" onClick={fetchEvents} fullWidth={isSmDown}>
              Refresh
            </Button>
            <Button
              startIcon={<OpenInFullIcon />}
              variant="contained"
              onClick={() => setFullScreenOpen(true)}
              fullWidth={isSmDown}
            >
              Full Screen
            </Button>
          </Stack>
        </Stack>

        {/* Options row */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} useFlexGap flexWrap="wrap">
          <ToggleButtonGroup size="small" value={calendarView} exclusive onChange={(_, v) => v && setCalendarView(v)}>
            <ToggleButton value="dayGridMonth">Month</ToggleButton>
            <ToggleButton value="timeGridWeek">Week</ToggleButton>
            <ToggleButton value="timeGridDay">Day</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            size="small"
            value={[granularity]}
            onChange={(_, val) => {
              const v = Array.isArray(val) ? val[0] : val;
              if (v) setGranularity(v);
            }}
          >
            <ToggleButton value="00:15:00">15m</ToggleButton>
            <ToggleButton value="00:30:00">30m</ToggleButton>
            <ToggleButton value="01:00:00">60m</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup size="small" value={timeFmt12h ? ["12h"] : ["24h"]} onChange={() => setTimeFmt12h((s) => !s)}>
            <ToggleButton value="12h">12-hour</ToggleButton>
            <ToggleButton value="24h">24-hour</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup size="small" value={showWeekends ? ["weekends"] : []} onChange={() => setShowWeekends((s) => !s)}>
            <ToggleButton value="weekends">{showWeekends ? "Hide" : "Show"} Weekends</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup size="small" value={workHoursOnly ? ["hours"] : []} onChange={() => setWorkHoursOnly((s) => !s)}>
            <ToggleButton value="hours">{workHoursOnly ? "All Hours" : "Work Hours"}</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup size="small" value={compactDensity ? ["compact"] : []} onChange={() => setCompactDensity((s) => !s)}>
            <ToggleButton value="compact">{compactDensity ? "Comfortable" : "Compact"}</ToggleButton>
          </ToggleButtonGroup>

          {/* Status filter */}
          <FormControl size="small" sx={{ minWidth: 160, flex: isSmDown ? 1 : "initial" }}>
            <InputLabel>Slot Status</InputLabel>
            <Select
              multiple
              value={statusFilter}
              label="Slot Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              renderValue={(vals) => (vals.length ? vals.join(", ") : "All")}
            >
              <MenuItem value="available">
                <Chip size="small" color="success" label="Available" />
              </MenuItem>
              <MenuItem value="booked">
                <Chip size="small" color="error" label="Booked" />
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <FullCalendar
            ref={calRef}
            {...baseCalProps}
            initialView={calendarView}
            height="auto"
            key={`${calendarView}-${granularity}-${timeFmt12h}-${showWeekends}-${workHoursOnly}-${compactDensity}-${statusFilter.join(",")}`}
          />
        )}
      </Paper>

      <Paper sx={{ p: 2 }} elevation={1}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {moment(selectedDate).format("ddd, MMM D")} — {daySlots.length} slot(s)
          </Typography>
          <Chip size="small" color="success" label="Available" />
          <Chip size="small" color="error" label="Booked" />
          <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }} />
          {(canCloseSlots || canEditAvailability) && (
            <>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => setDayMenuEl(e.currentTarget)}
                fullWidth={isSmDown}
              >
                Day ▾
              </Button>
              <Menu
                open={!!dayMenuEl}
                anchorEl={dayMenuEl}
                onClose={() => setDayMenuEl(null)}
              >
                <MenuItem onClick={() => { setDayMode("close-day"); setDayDialogOpen(true); }}>
                  Close entire day
                </MenuItem>
                <MenuItem onClick={() => { setDayMode("close-before"); setDayDialogOpen(true); }}>
                  Close BEFORE time…
                </MenuItem>
                <MenuItem onClick={() => { setDayMode("close-after"); setDayDialogOpen(true); }}>
                  Close AFTER time…
                </MenuItem>
                <MenuItem onClick={() => { setDayMode("keep-range"); setDayDialogOpen(true); }}>
                  Edit Available Window… (keep range)
                </MenuItem>
              </Menu>
            </>
          )}
          <Button size="small" onClick={fetchEvents}>Refresh</Button>
        </Stack>

        {daySlots.length === 0 ? (
          <Typography color="text.secondary">No availability for this day.</Typography>
        ) : (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {daySlots.map((s) => (
              <Tooltip
                key={`${s.startISO}-${s.availability_id || s.id}`}
                title={`${s.__status.toUpperCase()} • ${s.startLabel}–${s.endLabel}${s.service_name ? `\nService: ${s.service_name}` : ""}`}
                arrow
              >
                <Chip
                  color={s.__status === "booked" ? "error" : "success"}
                  variant={s.__status === "booked" ? "filled" : "outlined"}
                  label={`${s.startLabel}–${s.endLabel}${s.service_name ? ` • ${s.service_name}` : ""}`}
                  onDelete={
                    (canCloseSlots || canEditAvailability) && s.__status === "available"
                      ? async () => {
                          const ok = await tryDeleteAvailability(s);
                          if (!ok) setErr("Could not delete this slot.");
                          else { setMsg("Slot deleted."); fetchEvents(); }
                        }
                      : undefined
                  }
                  deleteIcon={(canCloseSlots || canEditAvailability) && s.__status === "available" ? undefined : <MoreVertIcon />}
                  onClick={() => {
                    if (s.__status === "booked") setMsg("This time is booked.");
                  }}
                />
              </Tooltip>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Day Actions dialog */}
      <Dialog open={dayDialogOpen} onClose={() => setDayDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {dayMode === "close-day" && "Close entire day"}
          {dayMode === "close-before" && "Close BEFORE time"}
          {dayMode === "close-after" && "Close AFTER time"}
          {dayMode === "keep-range" && "Edit Available Window (keep range)"}
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Date: <strong>{(daySlots[0]?.localDate) || selectedDate}</strong><br />
            Timezone: <strong>{daySlots[0]?.tz || viewerTz}</strong>
          </Alert>

          {dayMode === "keep-range" ? (
            <Stack direction="row" spacing={2}>
              <TextField
                label="Start"
                type="time"
                value={dayTimeA}
                onChange={(e) => setDayTimeA(e.target.value)}
                inputProps={{ step: 300 }}
                fullWidth
              />
              <TextField
                label="End"
                type="time"
                value={dayTimeB}
                onChange={(e) => setDayTimeB(e.target.value)}
                inputProps={{ step: 300 }}
                fullWidth
              />
            </Stack>
          ) : (
            <TextField
              fullWidth
              label={dayMode === "close-before" ? "Before (HH:MM)" : "After (HH:MM)"}
              type="time"
              value={dayTimeA}
              onChange={(e) => setDayTimeA(e.target.value)}
              inputProps={{ step: 300 }}
            />
          )}
          {dayMode === "keep-range" && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Booked time is never touched. We will remove only free slots outside this window.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDayDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyDayAction}>Apply</Button>
        </DialogActions>
      </Dialog>

      {/* Full Screen calendar */}
      <Dialog fullScreen open={fullScreenOpen} onClose={() => setFullScreenOpen(false)}>
        <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={() => setFullScreenOpen(false)}>
            <CloseFullscreenIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>My Availability — Full Screen</Typography>

          <ToggleButtonGroup size="small" value={calendarView} exclusive onChange={(_, v) => v && setCalendarView(v)} sx={{ mr: 1 }}>
            <ToggleButton value="dayGridMonth">Month</ToggleButton>
            <ToggleButton value="timeGridWeek">Week</ToggleButton>
            <ToggleButton value="timeGridDay">Day</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup size="small" value={[granularity]} onChange={(_, val) => { const v = Array.isArray(val) ? val[0] : val; if (v) setGranularity(v); }} sx={{ mr: 1 }}>
            <ToggleButton value="00:15:00">15m</ToggleButton>
            <ToggleButton value="00:30:00">30m</ToggleButton>
            <ToggleButton value="01:00:00">60m</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup size="small" value={timeFmt12h ? ["12h"] : ["24h"]} onChange={() => setTimeFmt12h((s) => !s)} sx={{ mr: 1 }}>
            <ToggleButton value="12h">12-hour</ToggleButton>
            <ToggleButton value="24h">24-hour</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" onClick={fetchEvents}>Refresh</Button>
        </Box>

        <Box sx={{ p: compactDensity ? 1 : 2 }}>
          <Paper sx={{ p: compactDensity ? 0 : 1 }}>
            <FullCalendar
              ref={fsCalRef}
              {...baseCalProps}
              initialView={calendarView}
              key={`fs-${calendarView}-${granularity}-${timeFmt12h}-${showWeekends}-${workHoursOnly}-${compactDensity}-${statusFilter.join(",")}`}
              height="calc(100vh - 96px)"
            />
          </Paper>
        </Box>

        <Box sx={{ px: 2, pb: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button startIcon={<CloseFullscreenIcon />} variant="contained" onClick={() => setFullScreenOpen(false)}>
            Close
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
