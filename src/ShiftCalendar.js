import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Paper, Box, Typography, Divider } from "@mui/material";

const ShiftCalendar = ({ shiftLogs }) => {
  const formattedShifts = shiftLogs.map((shift) => ({
    id: shift.id,
    title: shift.note || "Scheduled Shift",
    start: shift.clock_in,
    end: shift.clock_out,
    backgroundColor: "#1976d2",
    textColor: "#fff",
  }));

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>Assigned Shifts</Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ overflowX: "auto" }}>
        <FullCalendar
          height="auto"
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          events={formattedShifts}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
        />
      </Box>
    </Paper>
  );
};

export default ShiftCalendar;
