// src/pages/sections/SettingsArtistVisibility.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Card, CardHeader, CardContent, Divider,
  Grid, Stack, Typography, Switch, FormControlLabel,
  Button, Snackbar, Alert, Tooltip, Chip, Box, IconButton,
  TextField, Paper
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import axios from "axios";

import { useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

/* ------------------------- Visibility defaults ------------------------- */
const DEFAULTS = {
  // identity
  show_client_name: true,
  show_client_email: true,
  // service / money
  show_service_name: true,
  show_service_duration: true,
  show_service_price: false,
  show_payment_status: true,
  show_paid_amount: true,
  // misc
  show_booking_notes: false,
  show_meeting_link: true,
};

/* ------------------------- Permission defaults ------------------------- */
const PERM_DEFAULTS = {
  can_close_slots: false,         // allow employee to Close Rest of Day / Truncate
  can_edit_availability: false,   // allow employee to edit individual availability slots
};

export default function SettingsArtistVisibility() {
  const { t } = useTranslation();
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);

  const [policy, setPolicy]     = useState(DEFAULTS);
  const [perms, setPerms]       = useState(PERM_DEFAULTS);

  // convenience toggles
  const setAllIdentity = (on) => setPolicy(p => ({ ...p, show_client_name: on, show_client_email: on }));
  const setAllService  = (on) => setPolicy(p => ({
    ...p,
    show_service_name: on, show_service_duration: on,
    show_service_price: on, show_payment_status: on, show_paid_amount: on
  }));
  const setAllMisc     = (on) => setPolicy(p => ({ ...p, show_booking_notes: on, show_meeting_link: on }));

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // visibility settings
        const vis = await axios.get(`${API_URL}/admin/artist-visibility-settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // availability permissions
        const pr  = await axios.get(`${API_URL}/admin/availability-permissions`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!ignore) {
          setPolicy({ ...DEFAULTS, ...(vis.data || {}) });
          setPerms({ ...PERM_DEFAULTS, ...(pr.data || {}) });
        }
      } catch (e) {
        console.error("Load settings failed:", e);
        if (!ignore) setMsg(t("settings.artist.loadError"));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [token]);

  const onSave = async () => {
    setSaving(true);
    try {
      // save both payloads
      await Promise.all([
        axios.post(`${API_URL}/admin/artist-visibility-settings`, policy, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.post(`${API_URL}/admin/availability-permissions`, perms, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
      setMsg(t("settings.artist.saveSuccess"));
    } catch (e) {
      console.error(e);
      setMsg(e?.response?.data?.error || t("settings.common.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const onRestoreDefaults = () => {
    setPolicy(DEFAULTS);
    setPerms(PERM_DEFAULTS);
  };

  const Row = ({ label, hint, checked, onChange, chip }) => (
    <Grid item xs={12} md={6}>
      <FormControlLabel
        control={<Switch checked={!!checked} onChange={(e) => onChange(e.target.checked)} />}
        label={(
          <Stack direction="row" spacing={1} alignItems="center">
            <span>{label}</span>
            {chip && <Chip size="small" label={chip} />}
            {hint && (
              <Tooltip title={hint}>
                <InfoOutlinedIcon fontSize="small" color="action" />
              </Tooltip>
            )}
          </Stack>
        )}
      />
    </Grid>
  );

  const Preview = () => {
    const masked = t("settings.artist.preview.masked");
    const sample = {
      client_name: policy.show_client_name ? t("settings.artist.preview.sample.name") : masked,
      client_email: policy.show_client_email ? t("settings.artist.preview.sample.email") : masked,
      service_name: policy.show_service_name ? t("settings.artist.preview.sample.service") : masked,
      service_duration: policy.show_service_duration ? t("settings.artist.preview.sample.duration") : masked,
      service_price: policy.show_service_price ? t("settings.artist.preview.sample.price") : masked,
      payment_status: policy.show_payment_status ? t("settings.artist.preview.sample.status") : masked,
      paid_amount: policy.show_paid_amount ? t("settings.artist.preview.sample.paid") : masked,
      meeting_link: policy.show_meeting_link ? t("settings.artist.preview.sample.meetingLink") : masked,
      notes: policy.show_booking_notes ? t("settings.artist.preview.sample.notes") : masked,
    };

    return (
      <Box sx={{
        p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2,
        typography: "body2", bgcolor: "background.default"
      }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>{t("settings.artist.preview.title")}</Typography>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}><strong>{t("settings.artist.preview.fields.name")}:</strong> {sample.client_name}</Grid>
          <Grid item xs={12} sm={6}><strong>{t("settings.artist.preview.fields.email")}:</strong> {sample.client_email}</Grid>
          <Grid item xs={12} sm={6}><strong>{t("settings.artist.preview.fields.service")}:</strong> {sample.service_name}</Grid>
          <Grid item xs={6} sm={3}><strong>{t("settings.artist.preview.fields.duration")}:</strong> {sample.service_duration}</Grid>
          <Grid item xs={6} sm={3}><strong>{t("settings.artist.preview.fields.price")}:</strong> {sample.service_price}</Grid>
          <Grid item xs={6} sm={3}><strong>{t("settings.artist.preview.fields.status")}:</strong> {sample.payment_status}</Grid>
          <Grid item xs={6} sm={3}><strong>{t("settings.artist.preview.fields.paid")}:</strong> {sample.paid_amount}</Grid>
          <Grid item xs={12}><strong>{t("settings.artist.preview.fields.meetingLink")}:</strong> {sample.meeting_link}</Grid>
          <Grid item xs={12}><strong>{t("settings.artist.preview.fields.notes")}:</strong> {sample.notes}</Grid>
        </Grid>
      </Box>
    );
  };

  if (loading) {
    return (
      <Card variant="outlined">
        <CardHeader title={t("settings.artist.title")} />
        <Divider />
        <CardContent><Typography>{t("settings.common.loading")}</Typography></CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title={t("settings.artist.title")}
        subheader={t("settings.artist.subheader")}
        action={
          <Tooltip title={t("settings.artist.restoreTooltip")}>
            <span>
              <IconButton onClick={onRestoreDefaults} disabled={saving} size="small">
                <RestoreIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        }
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          {/* Quick toggles */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip label={t("settings.artist.quickToggles")} size="small" />
              <Button size="small" onClick={() => setAllIdentity(true)}>{t("settings.artist.toggles.showIdentity")}</Button>
              <Button size="small" onClick={() => setAllIdentity(false)}>{t("settings.artist.toggles.hideIdentity")}</Button>
              <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />
              <Button size="small" onClick={() => setAllService(true)}>{t("settings.artist.toggles.showService")}</Button>
              <Button size="small" onClick={() => setAllService(false)}>{t("settings.artist.toggles.hideService")}</Button>
              <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />
              <Button size="small" onClick={() => setAllMisc(true)}>{t("settings.artist.toggles.showMisc")}</Button>
              <Button size="small" onClick={() => setAllMisc(false)}>{t("settings.artist.toggles.hideMisc")}</Button>
            </Stack>
          </Grid>

          {/* Identity */}
          <Grid item xs={12}><Typography variant="subtitle2">{t("settings.artist.sections.identity")}</Typography></Grid>
          <Row
            label={t("settings.artist.fields.clientName")}
            checked={policy.show_client_name}
            onChange={(v) => setPolicy(p => ({ ...p, show_client_name: v }))}
          />
          <Row
            label={t("settings.artist.fields.clientEmail")}
            checked={policy.show_client_email}
            onChange={(v) => setPolicy(p => ({ ...p, show_client_email: v }))}
          />

          {/* Service / Money */}
          <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2">{t("settings.artist.sections.service")}</Typography></Grid>
          <Row
            label={t("settings.artist.fields.serviceName")}
            checked={policy.show_service_name}
            onChange={(v) => setPolicy(p => ({ ...p, show_service_name: v }))}
          />
          <Row
            label={t("settings.artist.fields.serviceDuration")}
            checked={policy.show_service_duration}
            onChange={(v) => setPolicy(p => ({ ...p, show_service_duration: v }))}
          />
          <Row
            label={t("settings.artist.fields.servicePrice")}
            hint={t("settings.artist.hints.listPrice")}
            checked={policy.show_service_price}
            onChange={(v) => setPolicy(p => ({ ...p, show_service_price: v }))}
            chip={t("settings.common.optional")}
          />
          <Row
            label={t("settings.artist.fields.paymentStatus")}
            hint={t("settings.artist.hints.paymentStatus")}
            checked={policy.show_payment_status}
            onChange={(v) => setPolicy(p => ({ ...p, show_payment_status: v }))}
          />
          <Row
            label={t("settings.artist.fields.paidAmount")}
            hint={t("settings.artist.hints.paidAmount")}
            checked={policy.show_paid_amount}
            onChange={(v) => setPolicy(p => ({ ...p, show_paid_amount: v }))}
          />

          {/* Misc */}
          <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2">{t("settings.artist.sections.misc")}</Typography></Grid>
          <Row
            label={t("settings.artist.fields.bookingNotes")}
            checked={policy.show_booking_notes}
            onChange={(v) => setPolicy(p => ({ ...p, show_booking_notes: v }))}
          />
          <Row
            label={t("settings.artist.fields.meetingLink")}
            checked={policy.show_meeting_link}
            onChange={(v) => setPolicy(p => ({ ...p, show_meeting_link: v }))}
          />

          {/* Preview */}
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Preview />
          </Grid>

          {/* =================== NEW: Employee Permissions =================== */}
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Typography variant="subtitle2">{t("settings.artist.permissions.title")}</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
              <Grid container spacing={2}>
                <Row
                  label={t("settings.artist.permissions.closeSlots.label")}
                  hint={t("settings.artist.permissions.closeSlots.hint")}
                  checked={perms.can_close_slots}
                  onChange={(v) => setPerms(p => ({ ...p, can_close_slots: v }))}
                />
                <Row
                  label={t("settings.artist.permissions.editSlots.label")}
                  hint={t("settings.artist.permissions.editSlots.hint")}
                  checked={perms.can_edit_availability}
                  onChange={(v) => setPerms(p => ({ ...p, can_edit_availability: v }))}
                />
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" onClick={onSave} disabled={saving}>
            {saving ? t("settings.common.saving") : t("settings.artist.actions.save")}
          </Button>
          <Button variant="text" onClick={onRestoreDefaults} disabled={saving}>
            {t("settings.artist.actions.reset")}
          </Button>
        </Stack>
      </CardContent>

      <Snackbar open={!!msg} autoHideDuration={3500} onClose={() => setMsg(null)}>
        <Alert onClose={() => setMsg(null)} severity="info" sx={{ width: "100%" }}>
          {msg}
        </Alert>
      </Snackbar>
    </Card>
  );
}
