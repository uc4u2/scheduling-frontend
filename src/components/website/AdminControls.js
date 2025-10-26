// src/components/website/AdminControls.js
import * as React from "react";
import { Box, Stack, Button, Typography, Switch, FormControlLabel, Alert } from "@mui/material";
import { websiteAdmin } from "../../utils/api";

export default function AdminControls({ companyId, canPublish, canStage, role = "editor" }) {
  const [isLive, setIsLive] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");

  React.useEffect(()=>{
    websiteAdmin.getSettings().then(r=>{
      const live = Boolean(r?.data?.is_live);
      setIsLive(live);
    }).catch(()=>{});
  }, []);

  const publish = async (next) => {
    if (!canPublish) { setErr("You don’t have permission to publish."); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      await websiteAdmin.publish(next);
      setIsLive(next);
      setMsg(next ? "Site published" : "Site set to draft");
    } catch (e) {
      setErr("Publish toggle failed");
    } finally { setBusy(false); }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: .5 }}>Admin</Typography>
      {msg && <Alert severity="success" sx={{ mb: 1 }}>{msg}</Alert>}
      {err && <Alert severity="error" sx={{ mb: 1 }}>{err}</Alert>}
      <Stack direction="row" spacing={2} alignItems="center">
        <FormControlLabel
          label={isLive ? "Live" : "Draft"}
          control={<Switch checked={isLive} onChange={(_,v)=>publish(v)} disabled={busy || !canPublish} />}
        />
        <Button size="small" disabled={!canStage || busy} variant="outlined">Create staging snapshot</Button>
        <Button size="small" disabled={!canStage || busy}>View audit log</Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">Role: {role}</Typography>
    </Box>
  );
}
