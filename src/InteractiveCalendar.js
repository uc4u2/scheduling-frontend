// src/InteractiveCalendar.js
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Container, Typography, Alert } from "@mui/material";
import axios from "axios";

const InteractiveCalendar = ({ token, onSlotDrop }) => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  // Fetch availability slots from backend
  const fetchEvents = async () => {
    try {
      const response = await axios.get("https://scheduling-application.onrender.com/my-availability", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Convert availability slots into FullCalendar event format.
      const fetchedEvents = response.data.available_slots.map((slot) => ({
        id: slot.id,
        title: slot.booked ? "Booked" : "Available",
        start: `${slot.date}T${slot.start_time}:00`,
        end: `${slot.date}T${slot.end_time}:00`,
      }));
      setEvents(fetchedEvents);
    } catch (err) {
      setError("Failed to fetch events");
    }
  };

  useEffect(() => {
    if (token) fetchEvents();
  }, [token]);

  // Handle event drop (drag-and-drop update)
  const handleEventDrop = (info) => {
    console.log("Event dropped", info.event);
    // Extract new start and end dates/times.
    const newStart = info.event.start; // JavaScript Date object
    const newEnd = info.event.end; // JavaScript Date object
    if (!newStart || !newEnd) return;
    // Format date as YYYY-MM-DD
    const newDate = newStart.toISOString().split("T")[0];
    // Format time as HH:MM
    const newStartTime = newStart.toTimeString().split(" ")[0].substring(0, 5);
    const newEndTime = newEnd.toTimeString().split(" ")[0].substring(0, 5);
    console.log("Formatted drop:", { newDate, newStartTime, newEndTime });
    // Call parent's callback if provided.
    if (onSlotDrop) {
      onSlotDrop(info.event.id, newDate, newStartTime, newEndTime);
    }
  };

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Interactive Calendar
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        editable={true}
        droppable={true}
        eventDrop={handleEventDrop}
      />
    </Container>
  );
};

export default InteractiveCalendar;
