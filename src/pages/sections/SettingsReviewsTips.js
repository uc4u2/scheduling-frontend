// src/pages/sections/SettingsReviewsTips.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardHeader, CardContent, Divider, Grid, Stack,
  Typography, TextField, Switch, FormControlLabel, Button,
  Snackbar, Alert, Tooltip, IconButton, Chip
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import api from "../../utils/api";
import { useTranslation } from "react-i18next";

export default function SettingsReviewsTips() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // --- SETTINGS STATE (match backend keys) ---
  const [enableAuto, setEnableAuto] = useState(true);
  const [delayHours, setDelayHours] = useState(24);
  const [requireApproval, setRequireApproval] = useState(false);
  const [includeTipLink, setIncludeTipLink] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);      // NEW: review_auto_publish
  const [windowDays, setWindowDays] = useState(14);           // NEW: review_window_days

  // tip presets as CSV in UI, send as array to API
  const [tipPresetsCsv, setTipPresetsCsv] = useState("3,5,10");

  // Optional redirect (e.g., Google reviews page)
  const [reviewRedirectUrl, setReviewRedirectUrl] = useState("");

  // Optional email subject/body overrides
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHtml, setEmailHtml] = useState("");

  const token = useMemo(() => localStorage.getItem("token") || "", []);

  // -------- Load existing values --------
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get(`/admin/review-tip-settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (ignore) return;

        setEnableAuto(!!data.enable_auto_review_emails);
        setDelayHours(Number(data.review_delay_hours ?? 24));
        setRequireApproval(!!data.require_manager_approval);
        setIncludeTipLink(!!data.include_tip_link);

        const presets = Array.isArray(data.tip_presets) ? data.tip_presets : (data.tip_presets || []);
        setTipPresetsCsv(presets.join(","));

        setReviewRedirectUrl(data.review_redirect_url || "");
        setEmailSubject(data.email_subject_template || "");
        setEmailHtml(data.email_body_template || "");

        // NEW
        setAutoPublish(!!data.review_auto_publish);
        setWindowDays(Number.isFinite(+data.review_window_days) ? Number(data.review_window_days) : 14);
      } catch (e) {
        console.error("Load review/tip settings failed:", e);
        setMsg(t("settings.reviews.loadError"));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [token]);

  // -------- Save --------
  const onSave = async () => {
    setSaving(true);
    try {
      // normalize presets
      const tip_presets = (tipPresetsCsv || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(v => Number.isFinite(+v) ? Math.max(0, Math.round(+v * 100) / 100) : null)
        .filter(v => v !== null);

      // basic guards
      const safeDelay = Math.max(0, Math.floor(Number(delayHours || 0)));
      const safeWindow = Math.max(0, Math.min(90, Math.floor(Number(windowDays || 0)))); // cap to 90 just for sanity

      await api.post(`/admin/review-tip-settings`, {
        enable_auto_review_emails: enableAuto,
        review_delay_hours: safeDelay,
        require_manager_approval: requireApproval,
        include_tip_link: includeTipLink,
        tip_presets,
        review_redirect_url: reviewRedirectUrl || null,
        email_subject_template: emailSubject || null,
        email_body_template: emailHtml || null,

        // NEW
        review_auto_publish: !!autoPublish,
        review_window_days: safeWindow,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg(t("settings.reviews.saveSuccess"));
    } catch (e) {
      console.error(e);
      setMsg(e?.response?.data?.error || t("settings.common.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card variant="outlined">
        <CardHeader title={t("settings.reviews.title")} />
        <Divider />
        <CardContent><Typography>{t("settings.common.loading")}</Typography></CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title={t("settings.reviews.title")}
        subheader={t("settings.reviews.subheader")}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          {/* Delivery controls */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Switch checked={enableAuto} onChange={(e) => setEnableAuto(e.target.checked)} />}
              label={(
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{t("settings.reviews.fields.autoSend.label")}</span>
                  <Tooltip title={t("settings.reviews.fields.autoSend.tooltip")}>
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Tooltip>
                </Stack>
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              type="number"
              label={t("settings.reviews.fields.sendAfter.label")}
              fullWidth
              value={delayHours}
              onChange={(e) => setDelayHours(e.target.value)}
              helperText={t("settings.reviews.fields.sendAfter.helper")}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>

          {/* Approval + Tip button */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Switch checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} />}
              label={(
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{t("settings.reviews.fields.requireApproval.label")}</span>
                  <Tooltip title={t("settings.reviews.fields.requireApproval.tooltip")}>
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Tooltip>
                </Stack>
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Switch checked={includeTipLink} onChange={(e) => setIncludeTipLink(e.target.checked)} />}
              label={(
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{t("settings.reviews.fields.includeTip.label")}</span>
                  <Tooltip title={t("settings.reviews.fields.includeTip.tooltip")}>
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Tooltip>
                </Stack>
              )}
            />
          </Grid>

          {/* NEW: Publishing + Window */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Switch checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} />}
              label={(
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{t("settings.reviews.fields.autoPublish.label")}</span>
                  <Tooltip title={t("settings.reviews.fields.autoPublish.tooltip")}>
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Tooltip>
                </Stack>
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              type="number"
              label={t("settings.reviews.fields.reviewWindow.label")}
              fullWidth
              value={windowDays}
              onChange={(e) => setWindowDays(e.target.value)}
              helperText={t("settings.reviews.fields.reviewWindow.helper")}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>

          {/* Presets + Redirect */}
          <Grid item xs={12} md={6}>
            <TextField
              label={t("settings.reviews.fields.tipPresets.label")}
              fullWidth
              value={tipPresetsCsv}
              onChange={(e) => setTipPresetsCsv(e.target.value)}
              helperText={t("settings.reviews.fields.tipPresets.helper")}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label={t("settings.reviews.fields.redirectUrl.label")}
              fullWidth
              value={reviewRedirectUrl}
              onChange={(e) => setReviewRedirectUrl(e.target.value)}
              helperText={t("settings.reviews.fields.redirectUrl.helper")}
            />
          </Grid>

          {/* Email overrides */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2">{t("settings.reviews.fields.subject.label")}</Typography>
              <Chip size="small" label={t("settings.common.optional")} />
            </Stack>
            <TextField
              placeholder={t("settings.reviews.fields.subject.placeholder")}
              fullWidth
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="subtitle2">{t("settings.reviews.fields.html.label")}</Typography>
              <Chip size="small" label={t("settings.common.optional")} />
              <Tooltip title={t("settings.reviews.fields.html.tooltip")}>
                <InfoOutlinedIcon fontSize="small" color="action" />
              </Tooltip>
            </Stack>
            <TextField
              placeholder={t("settings.reviews.fields.html.placeholder")}
              fullWidth
              minRows={6}
              multiline
              value={emailHtml}
              onChange={(e) => setEmailHtml(e.target.value)}
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" disabled={saving} onClick={onSave}>
            {saving ? t("settings.common.saving") : t("settings.reviews.actions.save")}
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

