import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert, Box, Card, CardContent, CardHeader, Grid, LinearProgress,
  MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography
} from "@mui/material";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const METRICS = [
  { value: "ltv",         label: "Top LTV (lifetime)" },
  { value: "visits",      label: "Top Visits (window)" },
  { value: "gross",       label: "Top Gross (window)" },
  { value: "tips",        label: "Top Tips (window)" },
  { value: "net",         label: "Top Net (window)" },
  { value: "no_show_rate",label: "Worst No-Show Rate (window)" },
];

export default function ClientsTopTab({ from, to, tz, departmentId, employeeId }) {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth  = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [metric, setMetric] = useState("ltv");
  const [limit, setLimit] = useState(20);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

  const load = async () => {
    setErr(""); setLoading(true);
    try {
      const qs = new URLSearchParams({
        metric, limit, from, to, tz,
        ...(departmentId ? { department_id: departmentId } : {}),
        ...(employeeId ? { employee_id: employeeId } : {}),
      }).toString();
      const { data } = await axios.get(`${API}/api/manager/clients/analytics/top?${qs}`, auth);
      setRows(data?.results || []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load top clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable */ }, [metric, limit, from, to, tz, departmentId, employeeId]);

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField select label="Metric" fullWidth value={metric} onChange={(e)=>setMetric(e.target.value)}>
                {METRICS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                type="number"
                label="Limit"
                value={limit}
                onChange={(e)=>setLimit(Math.max(1, Math.min(100, Number(e.target.value || 20))))}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Card variant="outlined">
        <CardHeader title="Ranked Clients" />
        <CardContent>
          {rows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No results.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={`${r.client_id}_${idx}`}>
                    <TableCell>{idx+1}</TableCell>
                    <TableCell>{r.name || `Client #${r.client_id}`}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell align="right">
                      {["ltv","gross","tips","net"].includes(metric) ? fmtMoney(r.value) :
                       metric === "no_show_rate" ? `${(Number(r.value||0)*100).toFixed(1)}%` :
                       r.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
