import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert, Box, Card, CardContent, CardHeader, Grid, LinearProgress,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography
} from "@mui/material";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ClientsChurnRiskTab({ departmentId, employeeId }) {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth  = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [limit, setLimit] = useState(20);
  const [mult, setMult] = useState(1.5);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr(""); setLoading(true);
    try {
      const qs = new URLSearchParams({
        limit, overdue_multiplier: mult,
        ...(departmentId ? { department_id: departmentId } : {}),
        ...(employeeId ? { employee_id: employeeId } : {}),
      }).toString();
      const { data } = await axios.get(`${API}/api/manager/clients/analytics/churn_risk?${qs}`, auth);
      setRows(data?.results || []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load churn risk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable */ }, [limit, mult, departmentId, employeeId]);

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField
                type="number"
                label="Limit"
                value={limit}
                onChange={(e)=>setLimit(Math.max(1, Math.min(200, Number(e.target.value || 20))))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="number"
                label="Overdue Multiplier"
                helperText="Days since last ≥ multiplier × usual gap"
                value={mult}
                onChange={(e)=>setMult(Number(e.target.value || 1.5))}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Card variant="outlined">
        <CardHeader title="At-Risk Clients (Overdue vs. Personal Cadence)" />
        <CardContent>
          {rows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No clients at risk based on current threshold.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Overdue Ratio</TableCell>
                  <TableCell align="right">Days Since Last</TableCell>
                  <TableCell align="right">Expected Gap (d)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={`${r.client_id}_${idx}`}>
                    <TableCell>{idx+1}</TableCell>
                    <TableCell>{r.name || `Client #${r.client_id}`}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell align="right">{r.overdue_ratio.toFixed(2)}×</TableCell>
                    <TableCell align="right">{r.days_since_last}</TableCell>
                    <TableCell align="right">{Number(r.expected_gap_days || 0).toFixed(1)}</TableCell>
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
