import React, { useState, useEffect, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Container, Typography, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import axios from "axios";

const DEFAULT_HEADER = {
  left: "prev,next today",
  center: "title",
  right: "dayGridMonth,timeGridWeek,timeGridDay",
};

const AnimatedCalendar = ({
  token,
  onSlotDrop,
  initialEvents = [],
  fetchOnMount = true,
  showHeader = true,
  title = "Interactive Calendar",
  containerProps = {},
  calendarProps = {},
}) => {
  const theme = useTheme();
  const [events, setEvents] = useState(initialEvents);
  const [error, setError] = useState("");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const shouldFetch = Boolean(token) && fetchOnMount;

  const fetchEvents = useCallback(async () => {
    if (!shouldFetch) return;
    try {
      const response = await axios.get(`${API_URL}/my-availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedEvents = response.data.available_slots.map((slot) => ({
        id: slot.id,
        title: slot.booked ? "Booked" : "Available",
        start: `${slot.date}T${slot.start_time}:00`,
        end: `${slot.date}T${slot.end_time}:00`,
        backgroundColor: slot.booked
          ? theme.palette.primary.main
          : theme.palette.success.main,
      }));
      setEvents(fetchedEvents);
      setError("");
    } catch (err) {
      setError("Failed to fetch events");
    }
  }, [API_URL, shouldFetch, theme.palette.primary.main, theme.palette.success.main, token]);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventDrop = useCallback(
    (info) => {
      if (!onSlotDrop) return;
      const newStart = info.event.start;
      const newEnd = info.event.end;
      if (!newStart || !newEnd) return;
      const newDate = newStart.toISOString().split("T")[0];
      const newStartTime = newStart.toTimeString().split(" ")[0].substring(0, 5);
      const newEndTime = newEnd.toTimeString().split(" ")[0].substring(0, 5);
      onSlotDrop(info.event.id, newDate, newStartTime, newEndTime);
    },
    [onSlotDrop]
  );

  const containerSx = useMemo(() => {
    const base = {
      mt: showHeader ? 5 : 0,
      px: 0,
      backgroundColor: theme.palette.background.default,
    };
    if (containerProps?.sx) {
      return { ...base, ...containerProps.sx };
    }
    return base;
  }, [containerProps?.sx, showHeader, theme.palette.background.default]);

  const baseCalendarOptions = useMemo(
    () => ({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: "timeGridWeek",
      headerToolbar: DEFAULT_HEADER,
      events,
      editable: Boolean(onSlotDrop),
      droppable: Boolean(onSlotDrop),
    }),
    [events, onSlotDrop]
  );

  const mergedCalendarOptions = useMemo(() => {
    const options = { ...baseCalendarOptions, ...calendarProps };
    if (onSlotDrop && !calendarProps?.eventDrop) {
      options.eventDrop = handleEventDrop;
    }
    if (!calendarProps?.headerToolbar) {
      options.headerToolbar = DEFAULT_HEADER;
    }
    return options;
  }, [baseCalendarOptions, calendarProps, handleEventDrop, onSlotDrop]);

  return (
    <Container {...containerProps} sx={containerSx}>
      {showHeader && (
        <Typography variant="h4" gutterBottom sx={{ color: theme.palette.text.primary }}>
          {title}
        </Typography>
      )}
      {error && shouldFetch && <Alert severity="error">{error}</Alert>}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <FullCalendar {...mergedCalendarOptions} />
      </motion.div>
    </Container>
  );
};

export default AnimatedCalendar;