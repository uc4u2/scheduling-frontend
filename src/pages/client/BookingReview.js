import React, { useMemo } from "react";
import { Box, Typography, Button, Chip, Alert } from "@mui/material";
import { getUserTimezone } from "../../utils/timezone";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";
import { addMinutes } from "date-fns";  // <-- import addMinutes

export default function BookingReview({
  companySlug,
  service,
  artist,
  slot,
  onEditService,
  onEditArtist,
  onEditSlot,
  onConfirm,
}) {
  const userTimezone = getUserTimezone();

  const tz = useMemo(() => slot?.timezone || userTimezone, [slot, userTimezone]);

  // Compute start/end ISO and total price including add-ons
  const { startIso, endIso, startDateObj, endDateObj, totalPrice } = useMemo(() => {
    if (!slot?.date || !slot?.start_time) return {};

    const startIsoStr = isoFromParts(slot.date, slot.start_time, tz);

    // total duration = base service duration + add-ons duration
    let mins = service?.duration || 0;
    (slot.addons || []).forEach(a => {
      mins += (a.duration || 0);
    });

    const endIsoStr = addMinutes(new Date(startIsoStr), mins).toISOString();

    const addCost = (slot.addons || []).reduce((s, a) => s + Number(a.base_price || 0), 0);
    const total = Number(service?.base_price || 0) + addCost;

    return {
      startIso: startIsoStr,
      endIso: endIsoStr,
      startDateObj: new Date(startIsoStr),
      endDateObj: new Date(endIsoStr),
      totalPrice: total,
    };
  }, [slot, tz, service]);

  const displayDate = startDateObj ? formatDate(startDateObj) : "N/A";
  const displayStart = startDateObj ? formatTime(startDateObj) : "N/A";
  const displayEnd = endDateObj ? formatTime(endDateObj) : null;

  const addons = slot?.addons || [];

  return (
    <Box p={3} maxWidth={600} mx="auto">
      <Typography variant="h4" gutterBottom>
        Review Your Booking
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Times are shown in <strong>{tz}</strong>
      </Alert>

      {/* Service */}
      <Box mb={2}>
        <Typography variant="subtitle1">
          <strong>Service:</strong> {service?.name || "N/A"}
        </Typography>
        <Button onClick={onEditService} size="small" sx={{ mt: 1 }}>
          Edit
        </Button>
      </Box>

      {/* Artist */}
      <Box mb={2}>
        <Typography variant="subtitle1">
          <strong>Employee:</strong> {artist?.full_name || artist?.name || "N/A"}
        </Typography>
        <Button onClick={onEditArtist} size="small" sx={{ mt: 1 }}>
          Edit
        </Button>
      </Box>

      {/* Date & Time */}
      <Box mb={2}>
        <Typography variant="subtitle1">
          <strong>Date:</strong> {displayDate}
        </Typography>
        <Typography variant="subtitle1">
          <strong>Time:</strong> {displayStart} {displayEnd ? `– ${displayEnd}` : ""}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          (Local time: {tz})
        </Typography>
        <Button onClick={onEditSlot} size="small" sx={{ mt: 1 }}>
          Edit
        </Button>
      </Box>

      {/* Add-ons */}
      {addons.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle1"><strong>Add-ons:</strong></Typography>
          {addons.map(ad => (
            <Chip
              key={ad.id}
              label={`${ad.name} (+${ad.duration} min $${Number(ad.base_price).toFixed(2)})`}
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>
      )}

      {/* Total Price */}
      <Typography variant="h6" sx={{ mt: 2 }}>
        Total&nbsp;Price:&nbsp;$ {totalPrice.toFixed(2)}
      </Typography>

      {/* Confirm button */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 3, py: 1.5, fontSize: "18px", fontWeight: 600 }}
        onClick={() => {
          const slotWithAddons = {
            ...slot,
            timezone: tz,
            addons,
            addon_ids: addons.map(a => a.id),
          };
          onConfirm(slotWithAddons);
        }}
      >
        Confirm & Continue
      </Button>
    </Box>
  );
}
