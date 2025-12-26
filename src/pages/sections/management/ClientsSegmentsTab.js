import React, { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api";
import {
  Alert, Box, Card, CardContent, CardHeader, Chip, Divider, Grid,
  LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography
} from "@mui/material";

const KPI = ({ label, value }) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="overline" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ mt: .5 }}>{value}</Typography>
    </CardContent>
  </Card>
);

function SegmentTable({ title, rows }) {
  return (
    <Card variant="outlined">
      <CardHeader title={title} />
      <CardContent>
        {(!rows || rows.length === 0) ? (
          <Typography variant="body2" color="text.secondary">No examples.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">LTV</TableCell>
                <TableCell align="right">Visits</TableCell>
                <TableCell>Last Visit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={`${r.client_id}_${idx}`}>
                  <TableCell>{idx+1}</TableCell>
                  <TableCell>{r.name || `Client #${r.client_id}`}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell align="right">${Number(r.ltv || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{r.visits || 0}</TableCell>
                  <TableCell>{r.last_visit || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClientsSegmentsTab({ from, to, tz, departmentId, employeeId }) {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth  = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [thresholds, setThresholds] = useState({
    vip_pct: 10,
    loyal_min_visits: 5,
    active_days: 90,
    lost_days: 180,
    risk_overdue_multiplier: 1.5
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr(""); setLoading(true);
    try {
      const qs = new URLSearchParams({
        from, to, tz,
        vip_pct: thresholds.vip_pct,
        loyal_min_visits: thresholds.loyal_min_visits,
        active_days: thresholds.active_days,
        lost_days: thresholds.lost_days,
        risk_overdue_multiplier: thresholds.risk_overdue_multiplier,
        ...(departmentId ? { department_id: departmentId } : {}),
        ...(employeeId ? { employee_id: employeeId } : {}),
      }).toString();
      const { data } = await api.get(`/api/manager/clients/analytics/segments?${qs}`, auth);
      setData(data);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load segments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable */ }, [from, to, tz, departmentId, employeeId]);
  // Recompute when thresholds change
  useEffect(() => { load(); /* eslint-disable */ }, [thresholds.vip_pct, thresholds.loyal_min_visits, thresholds.active_days, thresholds.lost_days, thresholds.risk_overdue_multiplier]);

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardHeader title="Segment Thresholds" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField
                type="number" label="VIP Top %"
                value={thresholds.vip_pct}
                onChange={(e)=>setThresholds(s=>({...s, vip_pct: Math.max(1, Math.min(50, Number(e.target.value || 10)))}))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                type="number" label="Loyal ≥ Visits"
                value={thresholds.loyal_min_visits}
                onChange={(e)=>setThresholds(s=>({...s, loyal_min_visits: Math.max(2, Number(e.target.value || 5))}))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                type="number" label="Active ≤ Days"
                value={thresholds.active_days}
                onChange={(e)=>setThresholds(s=>({...s, active_days: Math.max(7, Number(e.target.value || 90))}))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                type="number" label="Lost > Days"
                value={thresholds.lost_days}
                onChange={(e)=>setThresholds(s=>({...s, lost_days: Math.max(30, Number(e.target.value || 180))}))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                type="number" label="Risk Overdue × Gap"
                value={thresholds.risk_overdue_multiplier}
                onChange={(e)=>setThresholds(s=>({...s, risk_overdue_multiplier: Number(e.target.value || 1.5)}))}
                fullWidth
                helperText="Overdue if days since last ≥ (multiplier × personal gap)"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      {data && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={2}><KPI label="VIP" value={data.counts?.vip ?? 0} /></Grid>
            <Grid item xs={12} md={2}><KPI label="Loyal" value={data.counts?.loyal ?? 0} /></Grid>
            <Grid item xs={12} md={2}><KPI label="New" value={data.counts?.new ?? 0} /></Grid>
            <Grid item xs={12} md={2}><KPI label="Active" value={data.counts?.active ?? 0} /></Grid>
            <Grid item xs={12} md={2}><KPI label="At-Risk" value={data.counts?.at_risk ?? 0} /></Grid>
            <Grid item xs={12} md={2}><KPI label="Lost" value={data.counts?.lost ?? 0} /></Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><SegmentTable title="VIP Examples" rows={data.examples?.vip || []} /></Grid>
            <Grid item xs={12} md={6}><SegmentTable title="Loyal Examples" rows={data.examples?.loyal || []} /></Grid>
            <Grid item xs={12} md={6}><SegmentTable title="New Examples" rows={data.examples?.new || []} /></Grid>
            <Grid item xs={12} md={6}><SegmentTable title="Active Examples" rows={data.examples?.active || []} /></Grid>
            <Grid item xs={12} md={6}><SegmentTable title="At-Risk Examples" rows={data.examples?.at_risk || []} /></Grid>
            <Grid item xs={12} md={6}><SegmentTable title="Lost Examples" rows={data.examples?.lost || []} /></Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
