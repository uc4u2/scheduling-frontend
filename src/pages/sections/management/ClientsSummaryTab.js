import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert, Box, Card, CardContent, CardHeader, Chip, Divider,
  Grid, LinearProgress, Stack, Typography, Tooltip
} from "@mui/material";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const KPI = ({ label, value, help }) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="overline" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ mt: .5 }}>{value}</Typography>
      {help && <Typography variant="caption" color="text.secondary">{help}</Typography>}
    </CardContent>
  </Card>
);

const DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function ClientsSummaryTab({ from, to, tz, departmentId, employeeId }) {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth  = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

  const load = async () => {
    setErr(""); setLoading(true);
    try {
      const qs = new URLSearchParams({
        from, to, tz,
        ...(departmentId ? { department_id: departmentId } : {}),
        ...(employeeId ? { employee_id: employeeId } : {}),
      }).toString();
      const { data } = await axios.get(`${API}/api/manager/clients/analytics/summary?${qs}`, auth);
      setData(data);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable */ }, [from, to, tz, departmentId, employeeId]);

  const k = data?.kpis || {};
  const dist = data?.distributions || {};
  const dow = dist?.dow || {};
  const hod = dist?.hour_of_day || {};
  const ltvp = dist?.ltv_percentiles || {};

  return (
    <Box>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      {data && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Window: {data.window?.from} → {data.window?.to}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={2}><KPI label="Appointments" value={k.appointments ?? 0} help={`Kept ${k.kept ?? 0}`} /></Grid>
            <Grid item xs={12} md={2}><KPI label="Cancelled" value={k.cancelled ?? 0} /></Grid>
            <Grid item xs={12} md={2}><KPI label="No-Shows" value={k.no_show ?? 0} help={`Rate ${(k.no_show_rate*100||0).toFixed(1)}%`} /></Grid>
            <Grid item xs={12} md={2}><KPI label="Active Clients" value={k.active_clients ?? 0} /></Grid>
            <Grid item xs={12} md={2}><KPI label="Avg Lead Time" value={k.avg_lead_time_hours != null ? `${k.avg_lead_time_hours} h` : "—"} /></Grid>
            <Grid item xs={12} md={2}><KPI label="Avg Ticket" value={fmtMoney(k.avg_ticket)} /></Grid>

            <Grid item xs={12} md={3}><KPI label="Gross" value={fmtMoney(k.gross)} /></Grid>
            <Grid item xs={12} md={3}><KPI label="Tips" value={fmtMoney(k.tips)} /></Grid>
            <Grid item xs={12} md={3}><KPI label="Refunds" value={fmtMoney(k.refunds)} /></Grid>
            <Grid item xs={12} md={3}><KPI label="Net" value={fmtMoney(k.net)} /></Grid>

            <Grid item xs={12} md={3}><KPI label="New Clients" value={k.new_clients ?? 0} /></Grid>
            <Grid item xs={12} md={3}><KPI label="Returning" value={k.returning_clients ?? 0} /></Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Day-of-Week Mix" />
                <CardContent>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {DOW.map((label, idx) => (
                      <Chip key={idx} label={`${label}: ${dow[idx] || 0}`} />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Hour-of-Day Mix" />
                <CardContent>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Array.from({length: 24}).map((_, h) => (
                      <Chip key={h} label={`${String(h).padStart(2,"0")}:00 — ${hod[h] || 0}`} />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {ltvp && (
            <>
              <Divider sx={{ my: 3 }} />
              <Card variant="outlined">
                <CardHeader
                  title="Lifetime Value Percentiles"
                  subheader="Across all clients with payment history"
                />
                <CardContent>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Tooltip title="Median LTV"><Chip label={`P50: $${(ltvp.p50 || 0).toFixed(2)}`} /></Tooltip>
                    <Tooltip title="Upper quartile"><Chip label={`P75: $${(ltvp.p75 || 0).toFixed(2)}`} /></Tooltip>
                    <Tooltip title="Top 10%"><Chip label={`P90: $${(ltvp.p90 || 0).toFixed(2)}`} /></Tooltip>
                    <Tooltip title="Top 1%"><Chip label={`P99: $${(ltvp.p99 || 0).toFixed(2)}`} /></Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </Box>
  );
}
