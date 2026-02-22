import React, { useEffect, useMemo, useState } from "react";
import { Alert, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import api from "../../utils/api";

function formatDate(date, startTime, endTime) {
  if (!date) return "";
  const suffix = [startTime, endTime].filter(Boolean).join(" - ");
  return suffix ? `${date} (${suffix})` : date;
}

export default function ManagerBookingsListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .get("/api/manager/bookings")
      .then((res) => {
        if (!alive) return;
        const data = Array.isArray(res?.data) ? res.data : res?.data?.bookings || [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load bookings.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const topRows = useMemo(() => rows.slice(0, 50), [rows]);

  return (
    <Stack spacing={1.25}>
      <Typography variant="h5" fontWeight={800}>Bookings</Typography>
      <Typography variant="body2" color="text.secondary">
        Recent bookings in a mobile-first card view.
      </Typography>
      {loading ? <CircularProgress size={24} /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!loading && !error && topRows.length === 0 ? <Alert severity="info">No bookings found.</Alert> : null}
      {topRows.map((row) => (
        <Card key={row.id || `${row.client_name}-${row.date}`} variant="outlined">
          <CardContent>
            <Stack spacing={0.75}>
              <Typography variant="subtitle1" fontWeight={700}>
                {row.client_name || row.client?.name || "Client"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {row.service_name || row.service?.name || "Service"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(row.date, row.start_time, row.end_time)}
              </Typography>
              {row.status ? <Typography variant="caption">Status: {row.status}</Typography> : null}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
