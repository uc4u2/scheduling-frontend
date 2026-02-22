import React from "react";
import { Stack, Typography } from "@mui/material";
import MySetmoreCalendar from "../../MySetmoreCalendar";

export default function EmployeeCalendarPage() {
  return (
    <Stack spacing={1.25}>
      <Typography variant="h5" fontWeight={800}>Calendar</Typography>
      <Typography variant="body2" color="text.secondary">
        Your availability and appointment calendar.
      </Typography>
      <MySetmoreCalendar />
    </Stack>
  );
}
