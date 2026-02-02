import React, { useMemo } from "react";
import { Box, Typography, Button, Chip, Alert, Paper, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const accent = "var(--page-btn-bg, var(--sched-primary))";
  const accentContrast = "var(--page-btn-color, #ffffff)";
  const focusRing = {
    outline: `2px solid var(--page-focus-ring, var(--page-btn-bg, var(--sched-primary)))`,
    outlineOffset: 2,
  };
  const softBg = "var(--page-btn-bg-soft, rgba(15,23,42,0.12))";
  const borderColor = "var(--page-border-color, rgba(15,23,42,0.16))";
  const bodyColor = "var(--page-body-color, inherit)";
  const actionButtonSx = {
    backgroundColor: accent,
    color: accentContrast,
    fontWeight: 700,
    textTransform: "none",
    borderRadius: "var(--page-btn-radius, 12px)",
    boxShadow: "var(--page-btn-shadow, 0 16px 32px rgba(15,23,42,0.16))",
    "&:hover": {
      backgroundColor: "var(--page-btn-bg-hover, var(--page-btn-bg, var(--sched-primary)))",
      color: accentContrast,
    },
    "&:focus-visible": focusRing,
  };
  const textButtonSx = {
    textTransform: "none",
    fontWeight: 600,
    color: accent,
    "&:focus-visible": focusRing,
  };
  const chipSx = {
    backgroundColor: softBg,
    borderRadius: 999,
    fontWeight: 600,
    border: `1px solid ${borderColor}`,
    color: bodyColor,
  };
  const cardSx = {
    p: { xs: 2.5, sm: 3 },
    borderRadius: 3,
    border: `1px solid ${borderColor}`,
    backgroundColor: "var(--page-card-bg, var(--page-surface-bg, #ffffff))",
    backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
    boxShadow: "var(--page-card-shadow, 0 18px 45px rgba(15,23,42,0.12))",
  };
  const sectionSx = {
    p: 2,
    borderRadius: 2,
    border: `1px solid ${borderColor}`,
    backgroundColor: "var(--page-surface-bg, #ffffff)",
  };

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
    <Box p={{ xs: 2, sm: 3 }} maxWidth={680} mx="auto">
      <Paper sx={cardSx}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800} gutterBottom>
              Review Your Booking
            </Typography>
            <Alert severity="info" sx={{ mb: 0 }}>
              Times are shown in <strong>{tz}</strong>
            </Alert>
          </Box>

          {/* Service */}
          <Box sx={sectionSx}>
            <Typography variant="subtitle1">
              <strong>Service:</strong> {service?.name || "N/A"}
            </Typography>
            <Button onClick={onEditService} size="small" sx={{ mt: 1, ...textButtonSx }}>
              Edit
            </Button>
          </Box>

          {/* Artist */}
          <Box sx={sectionSx}>
            <Typography variant="subtitle1">
              <strong>Employee:</strong> {artist?.full_name || artist?.name || "N/A"}
            </Typography>
            <Button onClick={onEditArtist} size="small" sx={{ mt: 1, ...textButtonSx }}>
              Edit
            </Button>
          </Box>

          {/* Date & Time */}
          <Box sx={sectionSx}>
            <Typography variant="subtitle1">
              <strong>Date:</strong> {displayDate}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Time:</strong> {displayStart} {displayEnd ? `– ${displayEnd}` : ""}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (Local time: {tz})
            </Typography>
            <Button onClick={onEditSlot} size="small" sx={{ mt: 1, ...textButtonSx }}>
              Edit
            </Button>
          </Box>

          {/* Add-ons */}
          {addons.length > 0 && (
            <Box sx={sectionSx}>
              <Typography variant="subtitle1"><strong>Add-ons:</strong></Typography>
              <Box sx={{ mt: 1 }}>
                {addons.map(ad => (
                  <Chip
                    key={ad.id}
                    label={`${ad.name} (+${ad.duration} min $${Number(ad.base_price).toFixed(2)})`}
                    sx={{ mr: 1, mb: 1, ...chipSx }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Total Price */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 999,
              border: `1px solid ${borderColor}`,
              backgroundColor: softBg,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 700,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Total Price
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              ${totalPrice.toFixed(2)}
            </Typography>
          </Box>

          {/* Confirm button */}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 0.5, py: 1.6, fontSize: "18px", ...actionButtonSx }}
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
        </Stack>
      </Paper>
    </Box>
  );
}
