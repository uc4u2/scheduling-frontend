// src/pages/sections/management/EmployeeAvailabilityCalendar.js
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Alert,
  Button,
  CircularProgress,
  IconButton,
  Grid,
  Paper,
  Stack,
  Chip,
  Tooltip,
  SwipeableDrawer,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowBackIos, ArrowForwardIos, Close as CloseIcon } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";

import { api } from "../../utils/api";
import { getUserTimezone } from "../../utils/timezone";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";
import { resolveSeatsLeft, slotIsAvailable, slotSeatsLabel } from "../../utils/bookingSlots";

/* ───────────────── helpers ────────────────── */
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const money = (v) => `$${Number(v || 0).toFixed(2)}`;
const AUTO_SELECT_FIRST_TIME = true;
const sheetSafePadding = "calc(env(safe-area-inset-bottom) + 16px)";

/**
 * Build display date/time using backend-prepared local fields when available.
 * If backends later add day-level hints, this remains compatible.
 */
const buildDisplayFromISO = (iso) => {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return { date: "—", time: "—" };
  return { date: formatDate(dt), time: formatTime(dt) };
};

/** Build "cart" JSON for the availability endpoint (filter by date + artist). */
const buildCartPayload = ({ date, artistId = null }) => {
  try {
    const raw = JSON.parse(sessionStorage.getItem("booking_cart") || "[]");
    const filtered = raw
      .filter(
        (it) =>
          it &&
          it.date === date &&
          (!artistId || String(it.artist_id) === String(artistId))
      )
      .map((it) => ({
        artist_id: it.artist_id,
        service_id: it.service_id,
        date: it.date,
        start_time: it.start_time,
        addon_ids: Array.isArray(it.addon_ids) && it.addon_ids.length
          ? it.addon_ids
          : Array.isArray(it.addons)
          ? it.addons.map((a) => a && a.id).filter(Boolean)
          : [],
      }));
    return JSON.stringify(filtered);
  } catch (e) {
    return "[]";
  }
};

/* ───────────────── component ───────────────── */
export default function EmployeeAvailabilityCalendar({
  companySlug: companySlugProp,
  artistId: artistIdProp,
  serviceId: serviceIdProp,
  departmentId: departmentIdProp,
  serviceName,
  onSlotSelect, // optional callback({ date, start_time, timezone })
}) {
  const params = useParams();
  const navigate = useNavigate();
  const userTz = getUserTimezone();

  const companySlug = companySlugProp || params.slug;
  const artistId = artistIdProp || params.employeeId || params.artistId;
  const serviceId = serviceIdProp || params.serviceId;
  const departmentId = departmentIdProp || params.departmentId || "";

  /* ------------ state ------------ */
  const [monthView, setMonthView] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => ymd(new Date()));
  const [slots, setSlots] = useState([]); // availability for selected day
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedTime, setSelectedTime] = useState(""); // "HH:MM"
  const [saving, setSaving] = useState(false);
  const [priceInfo, setPriceInfo] = useState(null); // optional: fetched price
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [timeAnnounce, setTimeAnnounce] = useState("");
  const timesRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const accentColor = "var(--page-calendar-accent, var(--page-btn-bg, var(--sched-primary)))";
  const accentContrast = "var(--page-calendar-accent-contrast, var(--page-btn-color, #ffffff))";
  const borderColor = "var(--page-border-color, rgba(15,23,42,0.12))";
  const focusColor = "var(--page-focus-ring, var(--page-btn-bg, var(--sched-primary)))";
  const softBg = "var(--page-btn-bg-soft, rgba(15,23,42,0.12))";
  const bodyColor = "var(--page-body-color, inherit)";
  const surfaceColor = "var(--page-calendar-surface, var(--page-surface-bg, var(--page-card-bg, var(--page-secondary-bg, #ffffff))))";
  const buttonShadow = "var(--page-btn-shadow, 0 16px 32px rgba(15,23,42,0.16))";
  const buttonShadowHover = "var(--page-btn-shadow-hover, 0 20px 40px rgba(15,23,42,0.2))";
  const focusRing = {
    outline: `2px solid ${focusColor}`,
    outlineOffset: 2,
  };
  const primaryButtonSx = {
    backgroundColor: accentColor,
    color: accentContrast,
    textTransform: "none",
    fontWeight: 700,
    borderRadius: "var(--page-btn-radius, 12px)",
    boxShadow: buttonShadow,
    "&:hover": {
      backgroundColor: `var(--page-btn-bg-hover, ${accentColor})`,
      color: accentContrast,
      boxShadow: buttonShadowHover,
    },
    "&:focus-visible": focusRing,
  };
  const linkButtonSx = {
    color: accentColor,
    textTransform: "none",
    fontWeight: 600,
    "&:focus-visible": focusRing,
  };
  const infoAlertSx = {
    backgroundColor: surfaceColor,
    color: bodyColor,
    border: `1px solid ${borderColor}`,
    "& .MuiAlert-icon": { color: accentColor },
  };
  const timeChipSx = (selected, variant = "inline") => ({
    borderRadius: 999,
    textTransform: "none",
    fontWeight: 700,
    border: `1px solid ${selected ? accentColor : borderColor}`,
    backgroundColor: selected ? accentColor : "transparent",
    color: selected ? accentContrast : bodyColor,
    px: 2,
    width: variant === "drawer" ? "100%" : "auto",
    justifyContent: variant === "drawer" ? "center" : "flex-start",
    boxShadow: selected ? buttonShadow : "none",
    transition: "all .2s ease",
    "&:hover": {
      backgroundColor: selected ? accentColor : softBg,
      borderColor: accentColor,
    },
    "&:focus-visible": focusRing,
  });

  /* ------------ load day slots when selection changes ------------ */
  useEffect(() => {
    const run = async () => {
      if (!companySlug || !artistId || !serviceId || !selectedDate) return;
      try {
        setLoading(true);
        setErr("");
        setSlots([]);

        // Fetch day availability for this artist/service/date
        const cartJSON = buildCartPayload({ date: selectedDate, artistId });
        const { data } = await api.get(`/public/${companySlug}/availability`, {
          params: {
            artist_id: artistId,
            service_id: serviceId,
            date: selectedDate,
            timezone: userTz,
            explicit_only: 1,
            respect_rows: 1,
            cart: cartJSON || undefined,
            department_id: departmentId || undefined,
          },
        });

        const sourceSlots = Array.isArray(data?.slots) ? data.slots : [];
        const daySlots = sourceSlots.filter((slot) => slotIsAvailable(slot));
        setSlots(daySlots);
        setSelectedTime((prev) =>
          daySlots.some((s) => s.start_time === prev) ? prev : ""
        );

        // Optional: pull simple pricing from your public service endpoint if you have it
        // (safe no-op if you don't)
        if (!priceInfo) {
          try {
            const svc = await api.get(`/public/${companySlug}/service/${serviceId}`);
            setPriceInfo({ name: svc.data?.name, base_price: svc.data?.base_price });
          } catch {
            // ignore
          }
        }
      } catch (e) {
        setErr("Unable to load availability.");
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [companySlug, artistId, serviceId, departmentId, selectedDate]);

  useEffect(() => {
    const iso = isoFromParts(
      selectedDate,
      slots[0]?.start_time || "00:00",
      slots[0]?.timezone || userTz
    );
    const label = buildDisplayFromISO(iso).date;
    setTimeAnnounce(
      slots.length
        ? `${slots.length} slot${slots.length === 1 ? "" : "s"} available${
            label && label !== "—" ? ` on ${label}` : ""
          }`
        : "No slots for this day"
    );

    if (!slots.length) {
      setTimeSheetOpen(false);
      return;
    }

    if (AUTO_SELECT_FIRST_TIME && !selectedTime) {
      setSelectedTime(slots[0].start_time);
    }

    if (isMobile) {
      setTimeSheetOpen(true);
      return;
    }

    if (timesRef.current) {
      window.requestAnimationFrame(() => {
        timesRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        const firstBtn = timesRef.current.querySelector(
          "button[data-time-chip='1']"
        );
        firstBtn?.focus({ preventScroll: true });
      });
    }
  }, [slots, selectedDate, userTz, isMobile, selectedTime]);

  /* ------------ handlers ------------ */
  const goPrevMonth = () =>
    setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() - 1, 1));
  const goNextMonth = () =>
    setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() + 1, 1));

  const handleDateSelect = useCallback(
    (ymdValue) => {
      setSelectedDate(ymdValue);
      setSelectedTime("");
      if (isMobile) {
        setTimeSheetOpen(true);
      }
    },
    [isMobile]
  );

  const daysInMonth = (view) =>
    new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const firstWeekday = (view) =>
    new Date(view.getFullYear(), view.getMonth(), 1).getDay(); // 0-Sun

  const dayCell = (dNum) => {
    const d = new Date(monthView.getFullYear(), monthView.getMonth(), dNum);
    const ymdStr = ymd(d);
    const isPast = d < new Date(new Date().setHours(0, 0, 0, 0));
    const isSelected = selectedDate === ymdStr;
    const hasAvail = isSelected && slots.length > 0;

    return (
      <Box
        key={dNum}
        sx={{
          p: 0.75,
          textAlign: "center",
          cursor: isPast ? "default" : "pointer",
          borderRadius: 1.25,
          border: "1px solid",
          borderColor: isSelected ? accentColor : borderColor,
          bgcolor: isSelected ? accentColor : hasAvail ? softBg : "transparent",
          color: isSelected ? accentContrast : isPast ? "text.disabled" : bodyColor,
          transition: "all .15s ease",
          "&:hover": {
            bgcolor: isPast ? "transparent" : isSelected ? accentColor : softBg,
          },
          "&:focus-visible": focusRing,
        }}
        onClick={() => {
          if (!isPast) {
            handleDateSelect(ymdStr);
          }
        }}
      >
        {dNum}
      </Box>
    );
  };

  const confirmSelection = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Pick a date & time first.");
      return;
    }
    const chosen = {
      date: selectedDate,
      start_time: selectedTime,
      timezone: userTz, // FE sends local strings; BE attaches authoritative zone
    };

    if (typeof onSlotSelect === "function") {
      onSlotSelect(chosen);
      return;
    }

    // Default navigation to public booking page (manager-side preview flows can override via onSlotSelect)
    setSaving(true);
    try {
      navigate(
        `/${companySlug}/book?employee_id=${artistId}&service_id=${serviceId}` +
          `&date=${chosen.date}&start_time=${chosen.start_time}`
      );
    } finally {
      setSaving(false);
    }
  };

  /* ------------ UI guards ------------ */
  if (loading)
    return (
      <Box p={3} textAlign="center">
        <CircularProgress />
      </Box>
    );

  if (err)
    return (
      <Box p={3}>
        <Alert severity="error">{err}</Alert>
      </Box>
    );

  /* ------------ header / context ------------ */

  const handleTimeSheetClose = () => setTimeSheetOpen(false);

  const renderTimeButtons = (variant = "inline") => (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        mb: variant === "inline" ? 3 : 0,
      }}
    >
      {slots.map((s, idx) => {
        const iso = isoFromParts(selectedDate, s.start_time, s.timezone || userTz);
        const { time } = buildDisplayFromISO(iso);
        const label = time || s.start_time;
        const seatsLeft = resolveSeatsLeft(s);
        const isFullGroup = s.mode === "group" && seatsLeft !== null && seatsLeft <= 0;
        const seatsLabel = slotSeatsLabel(s);

        return (
          <Button
            key={s.start_time}
            variant={selectedTime === s.start_time ? "contained" : "outlined"}
            size="small"
            onClick={() => {
              if (isFullGroup) return;
              setSelectedTime(s.start_time);
              if (isMobile) {
                setTimeSheetOpen(false);
              }
            }}
            disabled={isFullGroup}
            data-time-chip={idx === 0 ? "1" : undefined}
            fullWidth={variant === "drawer"}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 999,
              border: `1px solid ${selectedTime === s.start_time ? accentColor : borderColor}`,
              backgroundColor: selectedTime === s.start_time ? accentColor : "transparent",
              color: selectedTime === s.start_time ? accentContrast : bodyColor,
              px: 2,
              justifyContent: variant === "drawer" ? "center" : "flex-start",
              boxShadow: selectedTime === s.start_time ? buttonShadow : "none",
              transition: "all .2s ease",
              "&:hover": {
                backgroundColor: selectedTime === s.start_time ? accentColor : softBg,
                borderColor: accentColor,
              },
              "&:focus-visible": focusRing,
            }}
          >
            {label}
            {s.mode === "group" && seatsLabel ? ` • ${seatsLabel}` : ""}
          </Button>
        );
      })}
    </Box>
  );

  const contextISO = isoFromParts(selectedDate, (slots[0]?.start_time || "00:00"), (slots[0]?.timezone || userTz));
  const disp = buildDisplayFromISO(contextISO);
  const svcName = serviceName || priceInfo?.name || "Selected Service";

  /* ------------ JSX ------------ */
  return (
    <Box p={{ xs: 2, md: 3 }} maxWidth="820px" mx="auto">
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          border: `1px solid ${borderColor}`,
          backgroundColor: surfaceColor,
          boxShadow: "var(--page-card-shadow, 0 18px 45px rgba(15,23,42,0.08))",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Choose a time — {svcName}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                size="small"
                label={`TZ: ${userTz}`}
                sx={{
                  borderRadius: 999,
                  fontWeight: 600,
                  backgroundColor: softBg,
                  color: bodyColor,
                }}
              />
              {priceInfo?.base_price != null && (
                <Chip
                  size="small"
                  label={`Base ${money(priceInfo.base_price)}`}
                  sx={{
                    borderRadius: 999,
                    fontWeight: 600,
                    backgroundColor: accentColor,
                    color: accentContrast,
                  }}
                />
              )}
              {slots.length > 0 ? (
                <Chip
                  size="small"
                  label={`${slots.length} slot(s) today`}
                  sx={{
                    borderRadius: 999,
                    fontWeight: 600,
                    backgroundColor: accentColor,
                    color: accentContrast,
                  }}
                />
              ) : (
                <Chip
                  size="small"
                  label="No slots for selected day"
                  sx={{
                    borderRadius: 999,
                    fontWeight: 600,
                    backgroundColor: softBg,
                    color: bodyColor,
                  }}
                />
              )}
            </Stack>
          </Box>

          <Tooltip title="This component uses the same month-grid + time chips pattern as the reschedule UI">
            <Chip
              size="small"
              variant="outlined"
              label="Setmore-style"
              sx={{
                borderRadius: 999,
                border: `1px solid ${borderColor}`,
                color: bodyColor,
              }}
            />
          </Tooltip>
        </Stack>

      {/* ── Month navigation & grid ─────────────────────────── */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          backgroundColor: surfaceColor,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <IconButton
            onClick={goPrevMonth}
            sx={{ color: accentColor, "&:focus-visible": focusRing }}
          >
            <ArrowBackIos fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700}>
            {monthView.toLocaleString("default", { month: "long", year: "numeric" })}
          </Typography>
          <IconButton
            onClick={goNextMonth}
            sx={{ color: accentColor, "&:focus-visible": focusRing }}
          >
            <ArrowForwardIos fontSize="small" />
          </IconButton>
        </Box>

        <Grid container spacing={0.75} sx={{ mt: 1 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <Grid item xs={12 / 7} key={d} sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                {d}
              </Typography>
            </Grid>
          ))}

          {/* blank cells before 1st */}
          {[...Array(firstWeekday(monthView)).keys()].map((i) => (
            <Grid item xs={12 / 7} key={`blank-${i}`} />
          ))}

          {/* days */}
          {[...Array(daysInMonth(monthView)).keys()].map((i) => (
            <Grid item xs={12 / 7} key={i + 1}>
              {dayCell(i + 1)}
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* ── time slots ─────────────────────────── */}
      <Typography variant="subtitle1" gutterBottom>
        {disp.date !== "—" ? `Available times for ${disp.date}` : "Select a date above"}
      </Typography>

      {slots.length === 0 && (
        <Alert severity="info" sx={{ mb: 2, ...infoAlertSx }}>
          No free slots for this day.
        </Alert>
      )}

      <Box ref={timesRef}>
        {renderTimeButtons()}
      </Box>

      <Box
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          border: 0,
        }}
        aria-live="polite"
      >
        {timeAnnounce}
      </Box>

        <SwipeableDrawer
          anchor="bottom"
          open={timeSheetOpen}
          onOpen={() => setTimeSheetOpen(true)}
          onClose={handleTimeSheetClose}
          disableSwipeToOpen={false}
          keepMounted
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "80dvh",
              height: "100%",
              backgroundColor: surfaceColor,
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <Box
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mb={1.5}
              flexShrink={0}
            >
              <Typography variant="h6" fontWeight={800}>
                Select a time
              </Typography>
              <IconButton
                onClick={handleTimeSheetClose}
                sx={{ color: accentColor, "&:focus-visible": focusRing }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                minHeight: 0,
                overscrollBehavior: "contain",
                pb: sheetSafePadding,
              }}
            >
              {renderTimeButtons("drawer")}
            </Box>
          </Box>
        </SwipeableDrawer>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            disabled={saving || !selectedTime}
            onClick={confirmSelection}
            fullWidth={isMobile}
            sx={primaryButtonSx}
          >
            {saving ? "Opening…" : "Continue"}
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="text"
            fullWidth={isMobile}
            sx={linkButtonSx}
          >
            Back
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
