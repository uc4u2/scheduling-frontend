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
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../utils/api"; // ✅ named import (axios instance)
import { getUserTimezone } from "../../utils/timezone";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";

/* ───────────────── helpers ────────────────── */
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

const buildDisplay = (svc, tz) => {
  const tzName = svc.timezone || tz;
  if (svc.local_date && (svc.local_start_time || svc.local_time)) {
    const localTime = svc.local_start_time || svc.local_time;
    return { date: svc.local_date, time: localTime, tz: tzName };
  }
  const baseDate = svc.local_date || svc.date;
  const baseTime =
    svc.local_start_time || svc.local_time || svc.start_time || "00:00";
  const iso = isoFromParts(baseDate, baseTime, tzName);
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) {
    return { date: baseDate || "—", time: baseTime || "—", tz: tzName };
  }
  return { date: formatDate(dt), time: formatTime(dt), tz: tzName };
};

/* ───────────────── component ───────────────── */
export default function ClientRescheduleBooking({ slugOverride }) {
  const { slug: routeSlug, bookingId } = useParams();
  const slug = slugOverride || routeSlug;
  const location = useLocation(); // hook at top level
  const navigate = useNavigate();
  const userTz = getUserTimezone();
  const basePath = slugOverride ? "" : `/${slug}`;

  // accept ?token= or legacy ?t=
  const qs = new URLSearchParams(location.search);
  const qsToken = qs.get("token") || qs.get("t");

  /* ------------ state ------------ */
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [svc, setSvc] = useState(null); // single-service payload
  const [monthView, setMonthView] = useState(new Date()); // today
  const [slots, setSlots] = useState([]); // availability for selected day
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(""); // "HH:MM"
  const [saving, setSaving] = useState(false);

  /* ------------ load appointment ------------ */
  useEffect(() => {
    (async () => {
      if (!bookingId || !qsToken || !slug) {
        setErr("Invalid reschedule link.");
        setLoading(false);
        return;
      }

      // try canonical, then aliases
      const urls = [
        `/public/${slug}/appointment/${bookingId}?token=${encodeURIComponent(qsToken)}`,
        `/public/${slug}/appointment-reschedule/${bookingId}?token=${encodeURIComponent(qsToken)}`,
        `/api/public/${slug}/appointment/${bookingId}?token=${encodeURIComponent(qsToken)}`,
        `/api/public/${slug}/appointment-reschedule/${bookingId}?token=${encodeURIComponent(qsToken)}`,
      ];

      try {
        let data;
        let lastError;
        for (const u of urls) {
          try {
            const res = await api.get(u, { noCompanyHeader: true });
            data = res.data;
            break;
          } catch (e) {
            lastError = e;
          }
        }
        if (!data) {
          const msg =
            lastError?.response?.data?.error ||
            lastError?.message ||
            "Could not load booking details.";
          throw new Error(msg);
        }

        const s0 =
          Array.isArray(data.services) && data.services.length > 0
            ? data.services[0]
            : null;

        const normalized = s0
          ? {
              ...s0,
              name: s0.name || s0.service_name,
              local_date: s0.local_date || s0.date || null,
              local_start_time:
                s0.local_start_time || s0.local_time || s0.start_time,
              timezone: s0.timezone || s0.tz || userTz,
              recruiter_id: s0.recruiter?.id ?? s0.recruiter_id,
              service_id: s0.id ?? s0.service_id,
              base_price: s0.base_price ?? data.total ?? 0,
            }
          : {
              name: data.service_name || "Service",
              local_date: data.local_date || data.date || null,
              local_start_time:
                data.start_time || data.local_time || "00:00",
              timezone: data.timezone || userTz,
              recruiter_id: data.recruiter?.id ?? data.recruiter_id,
              service_id: data.service?.id ?? data.service_id,
              base_price: data.total ?? 0,
            };

        setSvc(normalized);

        const baseDate = normalized.local_date || normalized.date;
        if (baseDate) {
          const [Y, M] = String(baseDate).split("-");
          setMonthView(new Date(Number(Y), Number(M) - 1, 1));
          setSelectedDate(baseDate);
        }
      } catch (e) {
        setErr(e?.message || "Could not load booking details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, bookingId, qsToken]);

  /* ------------ load slots when day changes ------------ */
  useEffect(() => {
    if (!svc || !selectedDate) return;
    (async () => {
      try {
        setSlots([]);
      const { data } = await api.get(`/public/${slug}/availability`, {
        noCompanyHeader: true,
        params: {
            artist_id: svc.recruiter?.id || svc.recruiter_id,
            service_id: svc.id || svc.service_id,
            date: selectedDate,
          },
        });
        setSlots((data.slots || []).filter((s) => s.type === "available"));
      } catch {
        setSlots([]);
      }
    })();
  }, [svc, selectedDate]);

  /* ------------ handlers ------------ */
  const handleSave = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Pick a date & time first.");
      return;
    }
    setSaving(true);
    try {
      await api.post(
        `/public/${slug}/appointment/${bookingId}/reschedule?token=${encodeURIComponent(
          qsToken
        )}`,
        { date: selectedDate, start_time: selectedTime },
        { noCompanyHeader: true }
      );
      alert("Rescheduled!");
      const confirmationPath = basePath
        ? `${basePath}/booking-confirmation/${bookingId}`
        : `/booking-confirmation/${bookingId}`;
      navigate(
        `${confirmationPath}?token=${encodeURIComponent(qsToken)}`,
        { replace: true }
      );
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        "Reschedule failed. Please pick another slot.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ------------ render helpers ------------ */
  const daysInMonth = (view) =>
    new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const firstWeekday = (view) =>
    new Date(view.getFullYear(), view.getMonth(), 1).getDay(); // 0-Sun

  const dayCell = (dNum) => {
    const d = new Date(monthView.getFullYear(), monthView.getMonth(), dNum);
    const ymdStr = ymd(d);
    const isPast = d < new Date(new Date().setHours(0, 0, 0, 0));
    const hasAvail = selectedDate === ymdStr && slots.length > 0;

    return (
      <Box
        key={dNum}
        sx={{
          p: 0.5,
          textAlign: "center",
          cursor: isPast ? "default" : "pointer",
          borderRadius: 1,
          bgcolor:
            selectedDate === ymdStr
              ? "primary.main"
              : hasAvail
              ? "success.light"
              : "transparent",
          color:
            selectedDate === ymdStr
              ? "primary.contrastText"
              : isPast
              ? "text.disabled"
              : "text.primary",
          "&:hover": { bgcolor: isPast ? "transparent" : "action.hover" },
        }}
        onClick={() => {
          if (!isPast) {
            setSelectedDate(ymdStr);
            setSelectedTime("");
          }
        }}
      >
        {dNum}
      </Box>
    );
  };

  /* ------------ UI guards ------------ */
  if (loading)
    return (
      <Box p={3} textAlign="center">
        <CircularProgress />
      </Box>
    );

  if (err || !svc)
    return (
      <Box p={3}>
        <Alert severity="error">{err || "Unknown error"}</Alert>
      </Box>
    );

  const disp = buildDisplay(svc, userTz);

  /* ------------ JSX ------------ */
  return (
    <Box p={3} maxWidth="620px" mx="auto">
      <Typography variant="h5" gutterBottom>
        Reschedule — {svc.name}
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Current time: <b>{disp.date + " • " + disp.time}</b>{" "}
        <i>({disp.tz})</i>
      </Typography>

      {/* ── Month navigation & grid ─────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <IconButton
            onClick={() =>
              setMonthView(
                new Date(monthView.getFullYear(), monthView.getMonth() - 1, 1)
              )
            }
          >
            <ArrowBackIos fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1">
            {monthView.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </Typography>
          <IconButton
            onClick={() =>
              setMonthView(
                new Date(monthView.getFullYear(), monthView.getMonth() + 1, 1)
              )
            }
          >
            <ArrowForwardIos fontSize="small" />
          </IconButton>
        </Box>

        <Grid container spacing={0.5} sx={{ mt: 1 }}>
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
        Select a time:
      </Typography>
      {slots.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No free slots for this day.
        </Alert>
      )}

      <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
        {slots.map((s) => (
          <Button
            key={s.start_time}
            variant={selectedTime === s.start_time ? "contained" : "outlined"}
            size="small"
            onClick={() => setSelectedTime(s.start_time)}
          >
            {s.start_time}
          </Button>
        ))}
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Total {money(svc.base_price)}
      </Typography>

      <Button
        variant="contained"
        disabled={saving}
        onClick={handleSave}
        sx={{ mr: 2 }}
      >
        {saving ? "Saving…" : "Confirm new slot"}
      </Button>
      <Button onClick={() => navigate(-1)}>Back</Button>
    </Box>
  );
}
