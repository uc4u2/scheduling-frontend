// src/pages/sections/SettingsReviewsTips.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardHeader, CardContent, Divider, Grid, Stack,
  Typography, TextField, Switch, FormControlLabel, Button,
  Snackbar, Alert, Tooltip, IconButton, Chip
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LaunchIcon from "@mui/icons-material/Launch";
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
  const [includeTipCheckout, setIncludeTipCheckout] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);      // NEW: review_auto_publish
  const [windowDays, setWindowDays] = useState(14);           // NEW: review_window_days

  // tip presets as CSV in UI, send as array to API
  const [tipPresetsCsv, setTipPresetsCsv] = useState("3,5,10");

  // Optional redirect (e.g., Google reviews page)
  const [reviewRedirectUrl, setReviewRedirectUrl] = useState("");
  const [googleReviewCtaEnabled, setGoogleReviewCtaEnabled] = useState(false);
  const [googleReviewPageCtaEnabled, setGoogleReviewPageCtaEnabled] = useState(true);
  const [googleReviewCtaText, setGoogleReviewCtaText] = useState("Leave a Google review");

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
        setIncludeTipCheckout(data.include_tip_checkout !== false);

        const presets = Array.isArray(data.tip_presets) ? data.tip_presets : (data.tip_presets || []);
        setTipPresetsCsv(presets.join(","));

        setReviewRedirectUrl(data.review_redirect_url || "");
        setGoogleReviewCtaEnabled(!!data.google_review_cta_enabled);
        setGoogleReviewPageCtaEnabled(data.google_review_page_cta_enabled !== false);
        setGoogleReviewCtaText(data.google_review_cta_text || "Leave a Google review");
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

      const { data } = await api.post(`/admin/review-tip-settings`, {
        enable_auto_review_emails: enableAuto,
        review_delay_hours: safeDelay,
        require_manager_approval: requireApproval,
        include_tip_link: includeTipLink,
        include_tip_checkout: includeTipCheckout,
        tip_presets,
        review_redirect_url: reviewRedirectUrl || null,
        google_review_cta_enabled: !!googleReviewCtaEnabled,
        google_review_page_cta_enabled: !!googleReviewPageCtaEnabled,
        google_review_cta_text: (googleReviewCtaText || "Leave a Google review").trim(),
        email_subject_template: emailSubject || null,
        email_body_template: emailHtml || null,

        // NEW
        review_auto_publish: !!autoPublish,
        review_window_days: safeWindow,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const savedSettings = data?.settings || {};
      if (Object.prototype.hasOwnProperty.call(savedSettings, "review_redirect_url")) {
        setReviewRedirectUrl(savedSettings.review_redirect_url || "");
      }
      if (Object.prototype.hasOwnProperty.call(savedSettings, "google_review_cta_enabled")) {
        setGoogleReviewCtaEnabled(!!savedSettings.google_review_cta_enabled);
      }
      if (Object.prototype.hasOwnProperty.call(savedSettings, "google_review_page_cta_enabled")) {
        setGoogleReviewPageCtaEnabled(savedSettings.google_review_page_cta_enabled !== false);
      }
      if (Object.prototype.hasOwnProperty.call(savedSettings, "google_review_cta_text")) {
        setGoogleReviewCtaText(savedSettings.google_review_cta_text || "Leave a Google review");
      }

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
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Switch checked={includeTipCheckout} onChange={(e) => setIncludeTipCheckout(e.target.checked)} />}
              label={(
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{t("settings.reviews.fields.includeTipCheckout.label")}</span>
                  <Tooltip title={t("settings.reviews.fields.includeTipCheckout.tooltip")}>
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

          {/* Presets + Google review destination */}
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
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight={800}>Google Reviews</Typography>
                <Chip
                  size="small"
                  label={reviewRedirectUrl.trim() ? "Configured" : "Not configured"}
                  variant={reviewRedirectUrl.trim() ? "filled" : "outlined"}
                  sx={reviewRedirectUrl.trim()
                    ? {
                        bgcolor: "#047857",
                        color: "#ffffff",
                        borderColor: "#047857",
                        fontWeight: 800,
                        boxShadow: "0 6px 14px rgba(4,120,87,0.18)",
                      }
                    : {
                        bgcolor: "rgba(255,255,255,0.72)",
                        color: "#334155",
                        borderColor: "#94a3b8",
                        fontWeight: 800,
                      }}
                />
              </Stack>
              <TextField
                label={(
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>Google review link</span>
                    <Tooltip title="Paste the Google review link from your Google Business Profile. Visitors and clients can use this to leave a public review on Google.">
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Stack>
                )}
                fullWidth
                value={reviewRedirectUrl}
                onChange={(e) => setReviewRedirectUrl(e.target.value)}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                <Tooltip title="No Google API is required. This opens the tenant's public Google review destination.">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<LaunchIcon fontSize="small" />}
                      component="a"
                      href={reviewRedirectUrl.trim() || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      disabled={!reviewRedirectUrl.trim()}
                      sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
                    >
                      Open link
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Tooltip title="Shows a subtle, dismissible floating Google review card on public website pages when a Google review link is configured.">
              <FormControlLabel
                control={<Switch checked={googleReviewCtaEnabled} onChange={(e) => setGoogleReviewCtaEnabled(e.target.checked)} />}
                label={(
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>Show Google review CTA on website</span>
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Stack>
                )}
              />
            </Tooltip>
          </Grid>
          <Grid item xs={12} md={6}>
            <Tooltip title="Shows the static Google review card above internal Schedulaa reviews when a Google review link is configured.">
              <FormControlLabel
                control={<Switch checked={googleReviewPageCtaEnabled} onChange={(e) => setGoogleReviewPageCtaEnabled(e.target.checked)} />}
                label={(
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>Show Google review card on Reviews page</span>
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Stack>
                )}
              />
            </Tooltip>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label={(
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <span>Google CTA button text</span>
                  <Tooltip title="Default: Leave a Google review">
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Tooltip>
                </Stack>
              )}
              fullWidth
              value={googleReviewCtaText}
              onChange={(e) => setGoogleReviewCtaText(e.target.value)}
              inputProps={{ maxLength: 80 }}
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
