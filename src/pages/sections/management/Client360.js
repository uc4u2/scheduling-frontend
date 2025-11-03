import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Chip, Divider,
  Grid, LinearProgress, Stack, TextField, Typography
} from "@mui/material";
import dayjs from "dayjs";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Toggle this if you want the messaging block visible
const SHOW_MESSAGING = false;

const KPI = ({ label, value, help }) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="overline" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ mt: .5 }}>{value}</Typography>
      {help && <Typography variant="caption" color="text.secondary">{help}</Typography>}
    </CardContent>
  </Card>
);

export default function Client360({
  clientId:    propClientId,
  clientEmail: propClientEmail,
  from:        propFrom,
  to:          propTo,
  tz:          propTz,
}) {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth  = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // Local UI state mirrors props, but remains editable
  const [clientId, setClientId]         = useState(propClientId ? String(propClientId) : "");
  const [clientEmail, setClientEmail]   = useState(propClientEmail || "");
  const [from, setFrom]                 = useState(propFrom || dayjs().startOf("month").format("YYYY-MM-DD"));
  const [to, setTo]                     = useState(propTo   || dayjs().format("YYYY-MM-DD"));
  const [tz, setTz]                     = useState(propTz   || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  const [intel, setIntel]               = useState(null);
  const [msg, setMsg]                   = useState("");
  const [loading, setLoading]           = useState(false);
  const [sending, setSending]           = useState(false);
  const [err, setErr]                   = useState("");

  // Sync local fields whenever parent selection / filters change
  useEffect(() => { setClientId(propClientId ? String(propClientId) : ""); }, [propClientId]);
  useEffect(() => { setClientEmail(propClientEmail || ""); }, [propClientEmail]);
  useEffect(() => { if (propFrom) setFrom(propFrom); }, [propFrom]);
  useEffect(() => { if (propTo)   setTo(propTo);     }, [propTo]);
  useEffect(() => { if (propTz)   setTz(propTz);     }, [propTz]);

  const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;
  const pct = (n) => `${(Number(n || 0) * 100).toFixed(1)}%`;

  const fetchIntel = async () => {
    if (!clientId && !clientEmail) return;
    setErr(""); setLoading(true);
    try {
      const qs = new URLSearchParams({
        from, to, tz,
        ...(clientEmail ? { email: clientEmail.trim() } : {})
      }).toString();

      // Email-first alias when email is provided; otherwise fall back to ID route
      const url = clientEmail
        ? `${API}/api/manager/client/intel?${qs}`
        : `${API}/api/manager/clients/${clientId}/intel?${qs}`;

      const { data } = await axios.get(url, auth);
      setIntel(data);
    } catch (e) {
      setIntel(null);
      const message = e?.response?.data?.error || e?.message || "Failed to load client profile";
      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!clientId || !msg.trim()) return;
    setSending(true);
    try {
      await axios.post(`${API}/api/manager/clients/${clientId}/messages`, { body: msg.trim() }, auth);
      setMsg("");
      await fetchIntel();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Auto-fetch on selection (email/id) or filter changes
  useEffect(() => { if (clientId || clientEmail) fetchIntel(); /* eslint-disable */ }, [clientId, clientEmail]);
  useEffect(() => { if (clientId || clientEmail) fetchIntel(); /* eslint-disable */ }, [from, to, tz]);

  const k = intel?.kpis || {};
  const tel = intel?.telemetry || {};
  const channels = intel?.channels || {};

  const clearSelection = () => { setClientId(""); setClientEmail(""); setIntel(null); setErr(""); };

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardHeader title="Client 360°" subheader="Per-client KPIs and telemetry (email-first lookup)" />
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                label="Client Email"
                value={clientEmail}
                onChange={(e)=>setClientEmail(e.target.value)}
                fullWidth
                placeholder="client@email.com"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Client ID (optional)"
                value={clientId}
                onChange={(e)=>setClientId(e.target.value)}
                fullWidth
                placeholder="123"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField label="From" type="date" fullWidth value={from} onChange={(e)=>setFrom(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField label="To" type="date" fullWidth value={to} onChange={(e)=>setTo(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField label="Timezone" fullWidth value={tz} onChange={(e)=>setTz(e.target.value)} />
            </Grid>
            <Grid item xs={12} md="auto">
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={fetchIntel} disabled={!clientId && !clientEmail}>
                  Refresh
                </Button>
                {(clientId || clientEmail) && (
                  <Button variant="text" onClick={clearSelection}>Clear</Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {(loading) && <LinearProgress sx={{ mb: 2 }} />}
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      {intel && (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {intel.client?.name || `Client #${intel.client?.id}`}{" "}
            <Typography component="span" variant="caption" color="text.secondary">
              ({intel.client?.email})
            </Typography>
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><KPI label="Visits" value={k.visits ?? 0} help={`Kept ${k.kept ?? 0}`} /></Grid>
            <Grid item xs={12} md={3}><KPI label="No-Show Rate" value={pct(k.no_show_rate)} help={`${k.no_show ?? 0} no-shows`} /></Grid>
            <Grid item xs={12} md={3}><KPI label="Avg Lead Time" value={k.avg_lead_time_hours != null ? `${k.avg_lead_time_hours} h` : "—"} /></Grid>
            <Grid item xs={12} md={3}><KPI label="Avg Ticket" value={fmtMoney(k.avg_ticket)} /></Grid>

            <Grid item xs={12} md={3}><KPI label="Gross" value={fmtMoney(k.gross)} /></Grid>
            <Grid item xs={12} md={3}><KPI label="Tips" value={fmtMoney(k.tips)} /></Grid>
            <Grid item xs={12} md={3}><KPI label="Refunds" value={fmtMoney(k.refunds)} /></Grid>
            <Grid item xs={12} md={3}><KPI label="Net" value={fmtMoney(k.net)} /></Grid>

            <Grid item xs={12} md={3}><KPI label="LTV (All-time)" value={fmtMoney(intel.kpis?.ltv || 0)} /></Grid>
            <Grid item xs={12} md={3}><KPI label="Avg Rebook Interval" value={k.avg_rebook_interval_days != null ? `${k.avg_rebook_interval_days} d` : "—"} /></Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Channel Mix (this window)" />
                <CardContent>
                  {Object.keys(channels).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No bookings.</Typography>
                  ) : (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {Object.entries(channels).map(([k,v]) => (
                        <Chip key={k} label={`${k}: ${v}`} />
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Telemetry (last 90 days)" />
                <CardContent>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                    <Chip label={`Last seen: ${tel.last_seen ? dayjs(tel.last_seen).format("YYYY-MM-DD HH:mm") : "—"}`} />
                    <Chip label={`Last IP: ${tel.last_ip || "—"}`} />
                  </Stack>
                  <Typography variant="subtitle2" sx={{ mb: .5 }}>Top Cities</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                    {Object.entries(tel.city_counts || {}).map(([k,v]) => <Chip key={k} label={`${k}: ${v}`} />)}
                  </Stack>
                  <Typography variant="subtitle2" sx={{ mb: .5 }}>Devices</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                    {Object.entries(tel.device_counts || {}).map(([k,v]) => <Chip key={k} label={`${k}: ${v}`} />)}
                  </Stack>
                  <Typography variant="subtitle2" sx={{ mb: .5 }}>Browsers</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Object.entries(tel.browser_counts || {}).map(([k,v]) => <Chip key={k} label={`${k}: ${v}`} />)}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {SHOW_MESSAGING && (
            <>
              <Divider sx={{ my: 3 }} />

              <Card variant="outlined">
                <CardHeader title="Messages" subheader="Send a message — client receives it in-app + via email." />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Write a message"
                        multiline minRows={3} fullWidth
                        value={msg}
                        onChange={(e)=>setMsg(e.target.value)}
                      />
                    </Grid>
                    <Grid item>
                      <Button variant="contained" disabled={sending || !msg.trim()} onClick={sendMessage}>
                        {sending ? "Sending..." : "Send to Client"}
                      </Button>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* History */}
                  <MessageHistory clientId={clientId} auth={auth} />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </Box>
  );
}

function MessageHistory({ clientId, auth }) {
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/manager/clients/${clientId}/messages`, auth);
      setMessages(data?.messages || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable */ }, [clientId]);

  return (
    <>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      <Stack spacing={1}>
        {messages.map(m => (
          <Box key={m.id} sx={{ p: 1, border: "1px dashed #ddd", borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {dayjs(m.created_at).format("YYYY-MM-DD HH:mm")} • {m.sender}
            </Typography>
            <Typography variant="body2">{m.body}</Typography>
          </Box>
        ))}
        {(!messages || messages.length === 0) && (
          <Typography variant="body2" color="text.secondary">No messages yet.</Typography>
        )}
      </Stack>
    </>
  );
}
