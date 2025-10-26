import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { CalendarPicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { DateTime } from "luxon";
import axios from "axios";

export default function ModernBookingCalendar({
  companySlug,
  artistId,
  serviceId,
  onSlotSelect,
  onError,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State for slots grouped by date string "YYYY-MM-DD"
  const [availableSlotsByDate, setAvailableSlotsByDate] = useState({});
  // Selected date as Luxon DateTime
  const [selectedDate, setSelectedDate] = useState(DateTime.now().startOf("day"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cache to avoid refetching same data repeatedly
  const cacheRef = useRef({});

  // Fetch slots only once per companySlug, artistId, serviceId
  const fetchSlots = useCallback(async () => {
    if (!companySlug || !serviceId) return;
    setLoading(true);
    setError("");

    // Check cache first
    const cacheKey = `${companySlug}_${artistId || "all"}_${serviceId}`;
    if (cacheRef.current[cacheKey]) {
      setAvailableSlotsByDate(cacheRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.get(`/public/${companySlug}/availability`, {
        params: {
          artist_id: artistId,
          service_id: serviceId,
        },
      });

      // Group slots by date string (YYYY-MM-DD)
      const grouped = (data.slots || []).reduce((acc, slot) => {
        (acc[slot.date] = acc[slot.date] || []).push(slot);
        return acc;
      }, {});

      // Cache grouped slots
      cacheRef.current[cacheKey] = grouped;

      setAvailableSlotsByDate(grouped);

      // If current selected date has no slots, pick next available date
      if (!grouped[selectedDate.toISODate()]) {
        const dates = Object.keys(grouped).sort();
        if (dates.length > 0) {
          setSelectedDate(DateTime.fromISO(dates[0]));
        }
      }
    } catch (e) {
      setError("Failed to load availability.");
      onError?.(e);
    } finally {
      setLoading(false);
    }
  }, [companySlug, artistId, serviceId, onError, selectedDate]);

  // Initial fetch and refetch if dependencies change
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Disable calendar dates with no slots
  const shouldDisableDate = (date) => {
    return !availableSlotsByDate[DateTime.fromJSDate(date).toISODate()];
  };

  // Slots for currently selected date
  const slotsForSelectedDate = availableSlotsByDate[selectedDate.toISODate()] || [];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          p: isMobile ? 2 : 4,
          maxWidth: 480,
          mx: "auto",
          userSelect: "none",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Select a Date
        </Typography>

        <CalendarPicker
          date={selectedDate.toJSDate()}
          onChange={(date) => {
            if (!date) return;
            setSelectedDate(DateTime.fromJSDate(date).startOf("day"));
          }}
          shouldDisableDate={shouldDisableDate}
          showDaysOutsideCurrentMonth
          disabled={loading}
          slotProps={{
            textField: { size: isMobile ? "small" : "medium" },
          }}
          aria-label="Select booking date"
        />

        <Typography variant="h6" mt={4} mb={1}>
          Available Time Slots
        </Typography>

        {loading && (
          <Box textAlign="center" mt={2}>
            <CircularProgress aria-label="Loading available slots" />
          </Box>
        )}

        {error && <Alert severity="error" role="alert">{error}</Alert>}

        {!loading && !error && slotsForSelectedDate.length === 0 && (
          <Typography color="text.secondary" mt={1}>
            No slots available for this date.
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mt: 1,
            justifyContent: "center",
          }}
          role="list"
          aria-label={`Available time slots for ${selectedDate.toLocaleString(
            DateTime.DATE_FULL
          )}`}
        >
          {slotsForSelectedDate.map((slot) => (
            <Button
              key={`${slot.date}-${slot.start_time}`}
              variant="outlined"
              onClick={() => onSlotSelect(slot)}
              role="listitem"
              aria-label={`Select time slot from ${slot.start_time} to ${slot.end_time}`}
              sx={{
                minWidth: 100,
                fontSize: isMobile ? "0.875rem" : "1rem",
                px: 2,
                py: 1,
              }}
            >
              {slot.start_time} - {slot.end_time}
            </Button>
          ))}
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
