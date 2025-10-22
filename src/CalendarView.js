// src/CalendarView.js
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Container, Typography } from "@mui/material";
import axios from "axios";

const CalendarView = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/my-availability", {
      headers: {
        // Add your JWT token here if needed.
      },
    })
    .then((response) => {
      const events = response.data.available_slots.map((slot) => ({
        id: slot.id,
        title: slot.booked ? "Booked" : "Available",
        start: `${slot.date}T${slot.start_time}:00`,
        end: `${slot.date}T${slot.end_time}:00`,
      }));
      setEvents(events);
    })
    .catch((error) => {
      console.error("Error fetching events:", error);
    });
  }, []);

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Calendar View
      </Typography>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek,dayGridDay",
        }}
      />
    </Container>
  );
};

export default CalendarView;
