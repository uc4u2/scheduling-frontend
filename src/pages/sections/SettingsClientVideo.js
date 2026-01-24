import React, { useEffect, useMemo, useState } from "react";
import {
  Card, CardHeader, CardContent, Divider,
  Grid, TextField, Switch, FormControlLabel,
  Button, Snackbar, Alert, Stack, Tooltip, Chip
} from "@mui/material";
import api from "../../utils/api";

import { useTranslation } from "react-i18next";

export default function SettingsClientVideo() {
  const { t } = useTranslation();
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const H = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState("");
  const [p, setP]             = useState({
    enable_jitsi_for_clients: false,
    include_in_emails: true,
    jitsi_domain: "https://meet.jit.si",
    room_prefix: "appt",
    stable_room_per_appointment: true,
    group_share_meeting_link: true,
  });

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data } = await api.get(`/admin/client-video-policy`, { headers: H });
        if (!dead) setP({ ...p, ...data });
      } catch (e) {
        setMsg(t("settings.clientVideo.loadError"));
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []); // eslint-disable-line

  const save = async () => {
    setSaving(true);
    try {
      await api.post(`/admin/client-video-policy`, p, { headers: H });
      setMsg(t("settings.clientVideo.saveSuccess"));
    } catch (e) {
      setMsg(e?.response?.data?.error || t("settings.common.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card variant="outlined"><CardHeader title={t("settings.clientVideo.title")} /><Divider /><CardContent>{t("settings.common.loading")}</CardContent></Card>;
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title={t("settings.clientVideo.title")}
        subheader={t("settings.clientVideo.subheader")}
        action={<Chip label={t("settings.common.beta")} size="small" />}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={p.enable_jitsi_for_clients} onChange={(e)=>setP({ ...p, enable_jitsi_for_clients: e.target.checked })} />}
              label={t("settings.clientVideo.fields.enableLink")}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth label={t("settings.clientVideo.fields.domain.label")} value={p.jitsi_domain}
              onChange={(e)=>setP({ ...p, jitsi_domain: e.target.value })}
              helperText={t("settings.clientVideo.fields.domain.helper")}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth label={t("settings.clientVideo.fields.roomPrefix.label")} value={p.room_prefix}
              onChange={(e)=>setP({ ...p, room_prefix: e.target.value })}
              helperText={t("settings.clientVideo.fields.roomPrefix.helper")}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControlLabel
              control={<Switch checked={p.stable_room_per_appointment} onChange={(e)=>setP({ ...p, stable_room_per_appointment: e.target.checked })} />}
              label={t("settings.clientVideo.fields.stableRoom")}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={p.group_share_meeting_link} onChange={(e)=>setP({ ...p, group_share_meeting_link: e.target.checked })} />}
              label={t("settings.clientVideo.fields.groupShare")}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={p.include_in_emails} onChange={(e)=>setP({ ...p, include_in_emails: e.target.checked })} />}
              label={t("settings.clientVideo.fields.includeInEmails")}
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" onClick={save} disabled={saving}>{saving ? t("settings.common.saving") : t("settings.clientVideo.actions.save")}</Button>
        </Stack>
      </CardContent>

      <Snackbar open={!!msg} autoHideDuration={3000} onClose={()=>setMsg("")}>
        <Alert severity="info" onClose={()=>setMsg("")}>{msg}</Alert>
      </Snackbar>
    </Card>
  );
}
