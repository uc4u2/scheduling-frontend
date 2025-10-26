// ───────────────────────────────────────────────────────────────
//  ClientCancelBooking.js  –  public “cancel” link
// ───────────────────────────────────────────────────────────────
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Box, Typography, Alert, Button, CircularProgress
} from "@mui/material";
import { getUserTimezone } from "../../utils/timezone";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";

/* ---------- helpers ---------- */
const buildDisplay = (slot, fallbackTz) => {
  // slot: { date, start_time, local_date?, local_time?, timezone? }
  if (slot.local_date && slot.local_time) {
    return {
      date : slot.local_date,
      time : slot.local_time,
      tz   : slot.timezone || fallbackTz
    };
  }
  const iso = isoFromParts(
    slot.date,
    slot.start_time,
    slot.timezone || fallbackTz
  );
  const d = new Date(iso);
  return { date: formatDate(d), time: formatTime(d), tz: slot.timezone || fallbackTz };
};

/**
 * Normalise backend payload -> { service_name, date, start_time, timezone, local_* }
 */
const toDisplayShape = (payload, tzFallback) => {
  if (Array.isArray(payload?.services) && payload.services.length) {
    const s = payload.services[0];
    return {
      service_name : s.name,
      date         : s.date        ?? payload.date,
      start_time   : s.start_time  ?? payload.start_time,
      timezone     : s.timezone    ?? payload.timezone ?? tzFallback,
      local_date   : s.local_date,
      local_time   : s.local_time
    };
  }
  // legacy single-service shape
  return {
    service_name : payload?.service?.name ?? payload?.service_name,
    date         : payload.date,
    start_time   : payload.start_time,
    timezone     : payload.timezone ?? tzFallback,
    local_date   : payload.local_date,
    local_time   : payload.local_time
  };
};

/* ---------- component ---------- */
const ClientCancelBooking = () => {
  const { slug, bookingId } = useParams();
  const qsToken  = new URLSearchParams(useLocation().search).get("token");
  const navigate = useNavigate();
  const userTz   = getUserTimezone();

  const [display, setDisplay]   = useState(null);  // normalised info
  const [policy,  setPolicy]    = useState({});
  const [status,  setStatus]    = useState("idle"); // idle | cancelled
  const [err,     setErr]       = useState("");

  /* ───────── fetch appointment ───────── */
  useEffect(() => { (async () => {
    if (!bookingId || !qsToken) {
      setErr("Invalid cancellation link.");
      return;
    }
    try {
      const { data } = await axios.get(
        `/public/${slug}/appointment/${bookingId}`,
        { params: { token: qsToken } }
      );
      setDisplay(toDisplayShape(data, userTz));
      setPolicy({
        window      : data.cancellation_window_hours,
        max_cancels : data.max_cancels_per_month,
        fee         : data.cancellation_fee
      });
    } catch {
      setErr("Could not load booking details.");
    }
  })(); }, [slug, bookingId, qsToken]);

  /* ───────── cancel booking ───────── */
  const handleCancel = async () => {
    if (!display) return;
    if (policy.fee) {
      const ok = window.confirm(
        `A fee of $${policy.fee} may apply. Continue to cancel?`
      );
      if (!ok) return;
    }
    try {
      await axios.post(
        `/public/${slug}/appointment/${bookingId}/cancel`,
        null,
        { params: { token: qsToken } }
      );
      setStatus("cancelled");
      window.dispatchEvent(new Event("booking:changed"));
    } catch (e) {
      setErr(
        e.response?.data?.error ||
        e.response?.data?.policy_message ||
        "Cancellation failed."
      );
    }
  };

  /* ───────── ui states ───────── */
  if (err) {
    return (
      <Box p={3}><Alert severity="error">{err}</Alert></Box>
    );
  }
  if (!display) {
    return (
      <Box p={3} textAlign="center">
        <CircularProgress/>
        <Typography sx={{ mt: 2 }}>Loading booking…</Typography>
      </Box>
    );
  }
  if (status === "cancelled") {
    return (
      <Box p={3}>
        <Alert severity="success">Booking cancelled successfully.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(`/${slug}`)}>
          Back to site
        </Button>
      </Box>
    );
  }

  /* ───────── render form ───────── */
  const dt = buildDisplay(display, userTz);

  return (
    <Box p={3} maxWidth="540px" mx="auto">
      <Typography variant="h5" gutterBottom>Cancel Booking</Typography>

      <Typography>
        Service:&nbsp;
        <b>{display.service_name || "(unknown)"}</b>
      </Typography>

      <Typography>
        Date &amp; Time:&nbsp;
        <b>{dt.date}</b> • <b>{dt.time}</b> (<i>{dt.tz}</i>)
      </Typography>

      <Box mt={2}>
        <Alert severity="warning">
          <b>Cancellation Policy</b>
          <ul style={{ marginTop: 4, marginBottom: 0 }}>
            <li>
              Free cancellation up to <b>{policy.window} h</b> before start.
            </li>
            {policy.max_cancels && (
              <li>Max cancels / month: <b>{policy.max_cancels}</b></li>
            )}
            {policy.fee && (
              <li>Cancellation fee: <b>${policy.fee}</b></li>
            )}
          </ul>
        </Alert>
      </Box>

      <Box mt={3}>
        <Button
          variant="contained"
          color="error"
          onClick={handleCancel}
        >
          Cancel Now
        </Button>
      </Box>
    </Box>
  );
};

export default ClientCancelBooking;
