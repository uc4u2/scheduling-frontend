// src/pages/sections/management/EmployeeAvailabilityCalendar.js
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";

import { api } from "../../utils/api";
import { getUserTimezone } from "../../utils/timezone";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";

/* ───────────────── helpers ────────────────── */
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

/**
 * Build display date/time using backend-prepared local fields when available.
 * If backends later add day-level hints, this remains compatible.
 */
const buildDisplayFromISO = (iso) => {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return { date: "—", time: "—" };
  return { date: formatDate(dt), time: formatTime(dt) };
};

/* ───────────────── component ───────────────── */
export default function EmployeeAvailabilityCalendar({
  companySlug: companySlugProp,
  artistId: artistIdProp,
  serviceId: serviceIdProp,
  serviceName,
  onSlotSelect, // optional callback({ date, start_time, timezone })
}) {
  const params = useParams();
  const navigate = useNavigate();
  const userTz = getUserTimezone();

  const companySlug = companySlugProp || params.slug;
  const artistId = artistIdProp || params.employeeId || params.artistId;
  const serviceId = serviceIdProp || params.serviceId;

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

  /* ------------ load day slots when selection changes ------------ */
  useEffect(() => {
    const run = async () => {
      if (!companySlug || !artistId || !serviceId || !selectedDate) return;
      try {
        setLoading(true);
        setErr("");
        setSlots([]);

        // Fetch day availability for this artist/service/date
        const { data } = await api.get(`/public/${companySlug}/availability`, {
          params: {
            artist_id: artistId,
            service_id: serviceId,
            date: selectedDate,
            explicit_only: 1,   // ← only explicit availability rows
            respect_rows: 1,    // ← do NOT subdivide; one slot per manager row
            timezone: userTz,   // ← just for correct client labels
          },
        });

        // (Optional but safe) keep only explicit availability in the UI
        const daySlots = (data.slots || [])
          .filter(s => s.type === "available" && s.origin !== "shift");
        setSlots(daySlots);

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
  }, [companySlug, artistId, serviceId, selectedDate]);

  /* ------------ handlers ------------ */
  const goPrevMonth = () =>
    setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() - 1, 1));
  const goNextMonth = () =>
    setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() + 1, 1));

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
          borderColor: isSelected ? "primary.main" : "divider",
          bgcolor: isSelected ? "primary.main" : hasAvail ? "success.light" : "background.paper",
          color: isSelected ? "primary.contrastText" : isPast ? "text.disabled" : "text.primary",
          transition: "all .15s ease",
          "&:hover": {
            bgcolor: isPast ? "background.paper" : isSelected ? "primary.main" : "action.hover",
          },
        }}
        onClick={() => {
          if (!isPast) {
            setSelectedDate(ymdStr);
            setSelectedTime(""); // reset time selection
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
  const contextISO = isoFromParts(selectedDate, (slots[0]?.start_time || "00:00"), (slots[0]?.timezone || userTz));
  const disp = buildDisplayFromISO(contextISO);
  const svcName = serviceName || priceInfo?.name || "Selected Service";

  /* ------------ JSX ------------ */
  return (
    <Box p={2} maxWidth="820px" mx="auto">
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
            <Chip size="small" label={`TZ: ${userTz}`} />
            {priceInfo?.base_price != null && (
              <Chip size="small" color="primary" variant="outlined" label={`Base ${money(priceInfo.base_price)}`} />
            )}
            {slots.length > 0 ? (
              <Chip size="small" color="success" label={`${slots.length} slot(s) today`} />
            ) : (
              <Chip size="small" color="warning" label="No slots for selected day" />
            )}
          </Stack>
        </Box>

        <Tooltip title="This component uses the same month-grid + time chips pattern as the reschedule UI">
          <Chip size="small" variant="outlined" label="Setmore-style" />
        </Tooltip>
      </Stack>

      {/* ── Month navigation & grid ─────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <IconButton onClick={goPrevMonth}>
            <ArrowBackIos fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700}>
            {monthView.toLocaleString("default", { month: "long", year: "numeric" })}
          </Typography>
          <IconButton onClick={goNextMonth}>
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
        <Alert severity="info" sx={{ mb: 2 }}>
          No free slots for this day.
        </Alert>
      )}

      <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
        {slots.map((s) => {
          // show local label using timezone from slot (fallback to userTz)
          const iso = isoFromParts(selectedDate, s.start_time, s.timezone || userTz);
          const { time } = buildDisplayFromISO(iso);
          const label = time || s.start_time;

          return (
            <Button
              key={s.start_time}
              variant={selectedTime === s.start_time ? "contained" : "outlined"}
              size="small"
              onClick={() => setSelectedTime(s.start_time)}
            >
              {label}
            </Button>
          );
        })}
      </Box>

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Button
          variant="contained"
          disabled={saving || !selectedTime}
          onClick={confirmSelection}
        >
          {saving ? "Opening…" : "Continue"}
        </Button>
        <Button onClick={() => navigate(-1)} variant="text">
          Back
        </Button>
      </Stack>
    </Box>
  );
}
