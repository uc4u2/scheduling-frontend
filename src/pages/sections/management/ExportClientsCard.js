import React, { useState, useMemo } from "react";
import axios from "axios";
import {
  Card, CardHeader, CardContent, Grid, TextField, MenuItem,
  Button, FormControlLabel, Switch, LinearProgress
} from "@mui/material";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function useAuth() {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth  = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  return { token, auth };
}

export default function ExportClientsCard() {
  const { auth } = useAuth();

  const [fmt, setFmt] = useState("csv");
  const [sinceDays, setSinceDays] = useState("");
  const [minVisits, setMinVisits] = useState(1);
  const [requireEmail, setRequireEmail] = useState(true);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams();
      params.set("format", fmt);
      if (sinceDays !== "") params.set("since_days", sinceDays);
      if (minVisits !== "") params.set("min_visits", minVisits);
      params.set("require_email", requireEmail ? "true" : "false");

      const url = `${API}/api/manager/clients/export?${params.toString()}`;
      const res = await axios.get(url, { ...auth, responseType: "blob" });

      const cd = res.headers["content-disposition"] || "attachment; filename=clients.csv";
      const fname = /filename="?([^"]+)"?/.exec(cd)?.[1] || "clients.csv";

      const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(a.href);
      a.remove();
    } catch (e) {
      console.error(e);
      alert("Download failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardHeader title="Export Clients" subheader="Download your client list (this company only)" />
      <CardContent>
        {busy && <LinearProgress sx={{ mb: 2 }} />}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              select fullWidth label="Format" value={fmt}
              onChange={e => setFmt(e.target.value)}
            >
              <MenuItem value="csv">CSV (Excel-friendly)</MenuItem>
              <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Seen in last N days (optional)"
              type="number"
              fullWidth
              value={sinceDays}
              onChange={e => setSinceDays(e.target.value)}
              helperText="Leave blank for all time"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Min visits"
              type="number"
              fullWidth
              value={minVisits}
              onChange={e => setMinVisits(e.target.value)}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={<Switch checked={requireEmail} onChange={e => setRequireEmail(e.target.checked)} />}
              label={requireEmail ? "Require email (ON)" : "Require email (OFF)"}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={download} disabled={busy}>
              Download
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
