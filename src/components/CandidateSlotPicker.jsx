import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Stack, Button, Alert, CircularProgress } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { CalendarPicker } from "@mui/x-date-pickers/CalendarPicker";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { format as formatDateFns } from "date-fns";

const formatDisplayTime = (dateStr, timeStr, timezone) => {
  try {
    const date = new Date(`${dateStr}T${timeStr}`);
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone || "UTC",
    }).format(date);
  } catch (error) {
    return timeStr;
  }
};

const CandidateSlotPicker = ({
  slots = [],
  timezone = "UTC",
  selectedSlotId = null,
  onSelect,
  loading = false,
  error = "",
  disabled = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const groupedSlots = useMemo(() => {
    return (slots || []).reduce((acc, slot) => {
      if (!slot?.date) return acc;
      (acc[slot.date] = acc[slot.date] || []).push(slot);
      return acc;
    }, {});
  }, [slots]);

  const sortedDateKeys = useMemo(
    () => Object.keys(groupedSlots).sort((a, b) => new Date(`${a}T00:00:00`) - new Date(`${b}T00:00:00`)),
    [groupedSlots]
  );

  const [calendarDate, setCalendarDate] = useState(() =>
    sortedDateKeys.length ? new Date(`${sortedDateKeys[0]}T00:00:00`) : new Date()
  );

  useEffect(() => {
    if (!sortedDateKeys.length) return;
    const currentIso = formatDateFns(calendarDate, "yyyy-MM-dd");
    if (!groupedSlots[currentIso]) {
      setCalendarDate(new Date(`${sortedDateKeys[0]}T00:00:00`));
    }
  }, [calendarDate, groupedSlots, sortedDateKeys]);

  const selectedDateKey = useMemo(() => {
    if (!calendarDate) return null;
    return formatDateFns(calendarDate, "yyyy-MM-dd");
  }, [calendarDate]);

  const slotsForSelectedDate = selectedDateKey ? groupedSlots[selectedDateKey] || [] : [];

  const handleSelect = (slot) => {
    if (disabled) return;
    onSelect?.(slot);
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: { xs: 2, md: 3 },
        bgcolor: "background.paper",
      }}
    >
      {loading ? (
        <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !sortedDateKeys.length ? (
        <Alert severity="info">No available slots at the moment. Please check back soon or contact the recruiter.</Alert>
      ) : (
        <>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <CalendarPicker
              date={calendarDate}
              onChange={(date) => {
                if (date) {
                  setCalendarDate(date);
                }
              }}
              shouldDisableDate={(date) => {
                const iso = formatDateFns(date, "yyyy-MM-dd");
                return !groupedSlots[iso];
              }}
              disabled={disabled}
              showDaysOutsideCurrentMonth
              sx={{
                "& .MuiPickersDay-root": {
                  width: isMobile ? 32 : 36,
                  height: isMobile ? 32 : 36,
                },
              }}
            />
          </LocalizationProvider>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Times shown in {timezone}
          </Typography>

          {slotsForSelectedDate.length ? (
            <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mt: 2 }}>
              {slotsForSelectedDate.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <Button
                    key={slot.id}
                    variant={isSelected ? "contained" : "outlined"}
                    color={isSelected ? "primary" : "inherit"}
                    onClick={() => handleSelect(slot)}
                    disabled={disabled}
                    sx={{ minWidth: 120 }}
                  >
                    {formatDisplayTime(slot.date, slot.start_time, timezone)} —{" "}
                    {formatDisplayTime(slot.date, slot.end_time, timezone)}
                  </Button>
                );
              })}
            </Stack>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              No slots available for the selected date. Please choose another day.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default CandidateSlotPicker;
