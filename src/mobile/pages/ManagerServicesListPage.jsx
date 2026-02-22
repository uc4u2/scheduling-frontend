import React, { useEffect, useState } from "react";
import { Alert, Card, CardContent, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import api from "../../utils/api";

export default function ManagerServicesListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .get("/booking/services?active=true")
      .then((res) => {
        if (!alive) return;
        const data = Array.isArray(res?.data) ? res.data : [];
        setRows(data);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load services.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <Stack spacing={1.25}>
      <Typography variant="h5" fontWeight={800}>Services</Typography>
      <Typography variant="body2" color="text.secondary">
        Quick cards replacing dense table layouts on mobile.
      </Typography>
      {loading ? <CircularProgress size={24} /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!loading && !error && rows.length === 0 ? <Alert severity="info">No services found.</Alert> : null}
      {rows.map((row) => (
        <Card key={row.id || row.name} variant="outlined">
          <CardContent>
            <Stack spacing={0.75}>
              <Typography variant="subtitle1" fontWeight={700}>{row.name || "Service"}</Typography>
              {row.description ? <Typography variant="body2" color="text.secondary">{row.description}</Typography> : null}
              <Stack direction="row" spacing={1}>
                {typeof row.duration !== "undefined" ? <Chip size="small" label={`${row.duration} min`} /> : null}
                {typeof row.base_price !== "undefined" ? <Chip size="small" variant="outlined" label={`$${row.base_price}`} /> : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
