import React, { useEffect, useMemo, useState } from "react";
import { Alert, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import api from "../../utils/api";

function formatRange(startIso, endIso) {
  if (!startIso) return "";
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return "";
  const end = endIso ? new Date(endIso) : null;
  const date = start.toLocaleDateString();
  const startTime = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endTime = end && !Number.isNaN(end.getTime())
    ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  return `${date} • ${startTime}${endTime ? ` - ${endTime}` : ""}`;
}

export default function EmployeeBookingsListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .get("/my-availability")
      .then((res) => {
        if (!alive) return;
        const blocks = Array.isArray(res?.data?.appointment_blocks)
          ? res.data.appointment_blocks
          : [];
        setRows(blocks);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load employee bookings.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo(() => rows.slice(0, 100), [rows]);

  return (
    <Stack spacing={1.25}>
      <Typography variant="h5" fontWeight={800}>Bookings</Typography>
      <Typography variant="body2" color="text.secondary">
        Upcoming client bookings assigned to you.
      </Typography>
      {loading ? <CircularProgress size={24} /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!loading && !error && items.length === 0 ? (
        <Alert severity="info">No upcoming bookings.</Alert>
      ) : null}
      {items.map((row, idx) => (
        <Card key={row.id || `${row.start || ""}-${idx}`} variant="outlined">
          <CardContent>
            <Stack spacing={0.65}>
              <Typography variant="subtitle1" fontWeight={700}>
                {row.candidate_name || row.client_name || "Booking"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatRange(row.start, row.end)}
              </Typography>
              {row.service_name ? (
                <Typography variant="caption" color="text.secondary">Service: {row.service_name}</Typography>
              ) : null}
              {row.status ? <Typography variant="caption">Status: {row.status}</Typography> : null}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
