// --- SegmentsPanel.jsx (inline inside EnterpriseAnalytics.js is fine) ---
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Alert, Box, Card, CardContent, CardHeader, Chip, Divider, Grid,
  IconButton, LinearProgress, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function SegmentsPanel() {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth  = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // knobs (safe defaults map 1:1 with backend)
  const [asOf, setAsOf] = useState(dayjs().format("YYYY-MM-DD"));
  const [requireEmail, setRequireEmail] = useState(true);
  const [limit, setLimit] = useState(100);

  // advanced knobs (collapsed idea: just pass along; keep UI simple)
  const [vipPct] = useState(10);
  const [defaultGapDays] = useState(30);
  const [atRiskMult] = useState(1.3);
  const [dormantDays] = useState(180);
  const [newDays] = useState(30);
  const [habitMin] = useState(5);
  const [habitGapMax] = useState(45);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr(""); setLoading(true);
    try {
      const qs = new URLSearchParams({
        as_of: asOf,
        require_email: String(requireEmail),
        limit: String(limit),
        vip_pct: String(vipPct),
        default_gap_days: String(defaultGapDays),
        at_risk_multiplier: String(atRiskMult),
        dormant_days: String(dormantDays),
        new_days: String(newDays),
        habitual_min_visits: String(habitMin),
        habitual_avg_gap_max: String(habitGapMax),
      }).toString();

      const { data } = await axios.get(`${API}/api/manager/clients/analytics/segments?${qs}`, auth);
      setRows(data?.results || []);
      setMeta(data?.meta || null);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load segments");
      setRows([]); setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); /* eslint-disable */ }, []);

  const fmt = (n) => (n == null ? "—" : n);
  const money = (n) => `$${Number(n || 0).toFixed(2)}`;

  return (
    <Card variant="outlined">
      <CardHeader
        title="Client Segments"
        subheader="Lifecycle cohorts with meta overview for marketing & retention."
        action={
          <Tooltip title="Refresh">
            <IconButton onClick={load}><RefreshIcon /></IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {/* Filters (light) */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <Grid item xs={12} sm={4} md={2.5}>
            <TextField
              label="As of"
              type="date"
              value={asOf}
              onChange={(e)=>setAsOf(e.target.value)}
              onBlur={load}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2.5}>
            <TextField
              label="Require Email"
              select
              SelectProps={{ native: true }}
              size="small"
              fullWidth
              value={requireEmail ? "true" : "false"}
              onChange={(e)=>setRequireEmail(e.target.value === "true")}
              onBlur={load}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={2.5}>
            <TextField
              label="Limit"
              type="number"
              size="small"
              fullWidth
              value={limit}
              onChange={(e)=>setLimit(Math.max(0, parseInt(e.target.value||"0",10)))}
              onBlur={load}
              inputProps={{ min: 0 }}
            />
          </Grid>
        </Grid>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        {/* Meta chips */}
        {meta && (
          <>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
              <Chip label={`VIP ${meta.segment_counts?.["VIP"] || 0}`} />
              <Chip label={`At Risk ${meta.segment_counts?.["At Risk"] || 0}`} />
              <Chip label={`Dormant ${meta.segment_counts?.["Dormant"] || 0}`} />
              <Chip label={`New ${meta.segment_counts?.["New"] || 0}`} />
              <Chip label={`Habitual ${meta.segment_counts?.["Habitual"] || 0}`} />
              <Chip label={`Occasional ${meta.segment_counts?.["Occasional"] || 0}`} />
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {meta.excluded_no_email > 0 && (
                <Tooltip title="Excluded because require_email=true">
                  <Chip variant="outlined" color="warning" label={`Excluded (no email): ${meta.excluded_no_email}`} />
                </Tooltip>
              )}
              {meta.excluded_below_min_visits > 0 && (
                <Tooltip title="Excluded because below min_visits">
                  <Chip variant="outlined" color="warning" label={`Excluded (below min visits): ${meta.excluded_below_min_visits}`} />
                </Tooltip>
              )}
              <Chip variant="outlined" color="info" label={`Scanned: ${meta.scanned}`} />
              <Chip variant="outlined" color="success" label={`Eligible: ${meta.eligible}`} />
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Params • as_of={meta.params?.as_of} • require_email={String(meta.params?.require_email)} •
              min_visits={meta.params?.min_visits} • default_gap_days={meta.params?.default_gap_days} •
              at_risk_multiplier={meta.params?.at_risk_multiplier} • dormant_days={meta.params?.dormant_days} •
              new_days={meta.params?.new_days} • habitual_min_visits={meta.params?.habitual_min_visits} •
              habitual_avg_gap_max={meta.params?.habitual_avg_gap_max} • vip_pct={meta.params?.vip_pct} •
              limit={meta.params?.limit}
            </Typography>

            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Segment</TableCell>
                <TableCell align="right">Visits</TableCell>
                <TableCell align="right">Avg Gap (d)</TableCell>
                <TableCell align="right">Days Since Last</TableCell>
                <TableCell align="right">LTV</TableCell>
                <TableCell>First Visit</TableCell>
                <TableCell>Last Visit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.client_id}>
                  <TableCell>{r.name || `#${r.client_id}`}</TableCell>
                  <TableCell>{r.email || "—"}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.segment} />
                  </TableCell>
                  <TableCell align="right">{fmt(r.visits)}</TableCell>
                  <TableCell align="right">{fmt(r.avg_gap_days)}</TableCell>
                  <TableCell align="right">{fmt(r.days_since_last)}</TableCell>
                  <TableCell align="right">{money(r.ltv)}</TableCell>
                  <TableCell>{r.first_visit ? dayjs(r.first_visit).format("YYYY-MM-DD") : "—"}</TableCell>
                  <TableCell>{r.last_visit ? dayjs(r.last_visit).format("YYYY-MM-DD") : "—"}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography variant="body2" color="text.secondary">
                      No clients matched these filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
