// src/pages/sections/Settings.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  Stack,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Tooltip,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import { useLocation } from "react-router-dom";

import SettingsReviewsTips from "./SettingsReviewsTips";
import SettingsCheckoutPro from "./SettingsCheckoutPro";
import SettingsStripeHub from "./SettingsStripeHub";
import SettingsArtistVisibility from "./SettingsArtistVisibility";
import SettingsClientVideo from "./SettingsClientVideo";
import SettingsXero from "./SettingsXero";
import SettingsQuickBooks from "./SettingsQuickBooks";
import IntegrationActivityCard from "./IntegrationActivityCard";
import ProfessionSettings from "./ProfessionSetting";
import SettingsTimeTracking from "./SettingsTimeTracking";

import SectionCard from "../../components/ui/SectionCard";
import { PROFESSION_OPTIONS } from "../../constants/professions";
import TabShell from "../../components/ui/TabShell";
import { Trans, useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// tiny helper to extract src="..." from an iframe snippet
const extractIframeSrc = (html) => {
  const m = /src="([^"]+)"/i.exec(html || "");
  if (!m) return "";
  // ensure # in color is encoded
  return m[1].replace("primary=#", "primary=%23");
};

const Settings = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const tabParam = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      return (params.get('tab') || '').toLowerCase();
    } catch {
      return '';
    }
  }, [location.search]);

  const defaultTabIndex = useMemo(() => {
    const map = {
      workspace: 0,
      profession: 1,
      embed: 2,
      reviews: 3,
      'reviews-tips': 3,
      'artist-visibility': 4,
      artist: 4,
      'client-video': 5,
      client: 5,
      stripe: 6,
      'stripe-hub': 6,
      xero: 7,
      quickbooks: 8,
      qb: 8,
      'integration-activity': 10,
      activity: 10,
      checkout: 11,
      payments: 11,
      'checkout-pro': 11,
    };
    return map[tabParam] ?? 0;
  }, [tabParam]);

  /* ---------- state ---------- */
  const [profession, setProfession] = useState("");
  const [defaultProfession, setDefaultProfession] = useState("");
  const [effectiveProfession, setEffectiveProfession] = useState("");
  const [workspaceName, setWorkspaceName] = useState("prefs");
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("light");

  const [primary, setPrimary] = useState("#1976d2");
  const [embedPrimary, setEmbedPrimary] = useState("#1976d2");
  const [embedText, setEmbedText] = useState("light");
  const [embedDialog, setEmbedDialog] = useState(false);

  const professionLabelMap = useMemo(() => new Map(PROFESSION_OPTIONS.map((option) => [option.value, option.label])), []);

  // embed snippets (from backend)
  const [snippetWidget, setSnippetWidget] = useState(""); // script (popup)
  const [snippetIframe, setSnippetIframe] = useState(""); // iframe (inline)

  // which one to show managers (simple toggle)
  const [embedMode, setEmbedMode] = useState("popup"); // "popup" | "inline"
  const [previewOpen, setPreviewOpen] = useState(false);

  // cancellation rules
  const [cancelWindow, setCancelWindow] = useState(24);
  const [maxCancels, setMaxCancels] = useState(3);
  const [resWindow, setResWindow] = useState(6);
  const [maxReschedules, setMaxReschedules] = useState(3);

  const [message, setMessage] = useState(null);
  const [copyToast, setCopyToast] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ---------- load settings + snippets ---------- */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        // 1) load settings
        const { data } = await axios.get(`${API_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfession(data.profession || "general");
        setDefaultProfession(data.default_profession || "general");
        const effective = data.effective_profession ?? data.default_profession ?? "";
        setEffectiveProfession(effective || "general");
        setWorkspaceName(data.workspace_name ?? "prefs");
        setTheme(data.theme ?? "light");
        setLanguage(data.language ?? "en");
        setPrimary(data.primary_color ?? "#1976d2");
        setEmbedPrimary(data.primary_color ?? "#1976d2");
        setEmbedText((data.theme ?? "light").toLowerCase().includes("dark") ? "dark" : "light");
        setCancelWindow(data.cancellation_window_hours ?? 24);
        setMaxCancels(data.max_cancels_per_month ?? 3);
        setResWindow(data.reschedule_window_hours ?? 6);
        setMaxReschedules(data.max_reschedules_per_month ?? 3);

        // 2) load snippets
        const snip = await axios.get(`${API_URL}/embed-snippet`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnippetWidget(snip.data.snippet_widget || "");
        setSnippetIframe(snip.data.snippet_iframe || "");
      } catch (e) {
        // keep page usable even if fetch fails
        console.error("Load settings/snippet failed", e);
      }
    })();
  }, []);

  /* ---------- save ---------- */
  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/settings`,
        {
          profession,
          workspace_name: workspaceName || "prefs",
          language,
          theme,
          primary_color: primary,
          text_theme: theme,
          cancellation_window_hours: Number(cancelWindow),
          max_cancels_per_month: Number(maxCancels),
          reschedule_window_hours: Number(resWindow),
          max_reschedules_per_month: Number(maxReschedules),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // refresh snippets (so color/theme are reflected)
      const snip = await axios.get(`${API_URL}/embed-snippet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnippetWidget(snip.data.snippet_widget || "");
      setSnippetIframe(snip.data.snippet_iframe || "");

      setMessage(t("settings.toast.workspaceSaved"));
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.error || t("settings.common.saveError"));
    } finally {
      setSaving(false);
    }
  };

  /* ---------- derived ---------- */
  const resolvedPrimary = embedPrimary || primary || "#1976d2";
  const resolvedText = embedText || "light";

  const applyAttr = (html, attr, value) => {
    if (!value) return html;
    const re = new RegExp(`${attr}="[^"]*"`);
    if (re.test(html)) return html.replace(re, `${attr}="${value}"`);
    return html.replace(/<script/i, `<script ${attr}="${value}"`);
  };

  const withScriptParams = useMemo(() => {
    if (!snippetWidget) return "";
    let out = snippetWidget;
    out = applyAttr(out, "data-primary", resolvedPrimary);
    out = applyAttr(out, "data-text", resolvedText);
    out = applyAttr(out, "data-mode", embedMode);
    out = embedDialog ? applyAttr(out, "data-dialog", "1") : out;
    if (!embedDialog) {
      out = out.replace(/\sdata-dialog="[^"]*"/, "");
    }
    return out;
  }, [snippetWidget, resolvedPrimary, resolvedText, embedMode, embedDialog]);

  const rewriteIframeSnippet = useMemo(() => {
    if (!snippetIframe) return "";
    const src = extractIframeSrc(snippetIframe);
    if (!src) return snippetIframe;
    let url;
    try {
      url = new URL(src, window.location.origin);
    } catch {
      return snippetIframe;
    }
    url.searchParams.set("primary", resolvedPrimary);
    url.searchParams.set("text", resolvedText);
    url.searchParams.set("embed", "1");
    if (embedDialog) url.searchParams.set("dialog", "1");
    else url.searchParams.delete("dialog");
    if (embedMode === "popup") {
      url.searchParams.set("mode", "modal");
      url.searchParams.set("dialog", "1");
    } else {
      url.searchParams.set("mode", "inline");
    }
    const updatedSrc = url.toString();
    return snippetIframe.replace(src, updatedSrc);
  }, [snippetIframe, resolvedPrimary, resolvedText, embedMode, embedDialog]);

  const activeSnippet = embedMode === "popup" ? withScriptParams : rewriteIframeSnippet;
  const previewSrc = useMemo(() => {
    const target = embedMode === "popup" ? rewriteIframeSnippet : rewriteIframeSnippet;
    return extractIframeSrc(target);
  }, [rewriteIframeSnippet, embedMode]);

  const notSetLabel = t("settings.general.profession.notSet", { defaultValue: "Not set" });

  const resolveProfessionLabel = (value) => {
    if (!value) return "";
    return professionLabelMap.get(value) || value;
  };

  const companyProfessionLabel = resolveProfessionLabel(defaultProfession) || notSetLabel;
  const effectiveProfessionLabel = resolveProfessionLabel(effectiveProfession) || companyProfessionLabel;

  const CancellationCard = (
    <SectionCard
      title={t("settings.workspace.cancellation.title", "Cancellation & Reschedule")}
      description={t("settings.workspace.cancellation.description", "Set company-wide windows for cancel and reschedule. Public meeting links respect these windows.")}
      actions={
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? t("settings.common.saving") : t("settings.common.save")}
        </Button>
      }
    >
      <Stack spacing={2}>
        <TextField
          label={t("settings.workspace.cancellation.window", "Cancellation window (hours)")}
          type="number"
          value={cancelWindow}
          onChange={(e) => setCancelWindow(e.target.value)}
        />
        <TextField
          label={t("settings.workspace.cancellation.max", "Max cancellations per month")}
          type="number"
          value={maxCancels}
          onChange={(e) => setMaxCancels(e.target.value)}
        />
        <TextField
          label={t("settings.workspace.cancellation.rescheduleWindow", "Reschedule window (hours)")}
          type="number"
          value={resWindow}
          onChange={(e) => setResWindow(e.target.value)}
        />
        <TextField
          label={t("settings.workspace.cancellation.maxReschedules", "Max reschedules per month")}
          type="number"
          value={maxReschedules}
          onChange={(e) => setMaxReschedules(e.target.value)}
        />
        <Alert severity="info">
          Public "Meet with me" bookings and service bookings use these windows for cancel/reschedule links. Update once and all flows stay consistent.
        </Alert>
      </Stack>
    </SectionCard>
  );

  /* ---------- sections ---------- */
  const GeneralCard = (
      <SectionCard
      title={t("settings.general.title", { defaultValue: "Industry" })}
      description={t("settings.general.description", { defaultValue: "Choose the industry that best fits your workspace." })}
      actions={
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? t("settings.common.saving") : t("settings.general.actions.save")}
        </Button>
      }
    >
      <Stack spacing={2}>
        <Alert severity="info" variant="outlined">
          {t("settings.general.profession.helper", {
          defaultValue: "Optional but recommended: choose an industry so clients can find your business in the right category and book you faster.",
            company: companyProfessionLabel,
            effective: effectiveProfessionLabel,
          })}
        </Alert>
        <FormControl fullWidth>
          <InputLabel>Industry</InputLabel>
          <Select
            label="Industry"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
          >
            {PROFESSION_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </SectionCard>
  );
  const PolicyCard = (
    <SectionCard
      title={t("settings.policy.title")}
      description={t("settings.policy.description")}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            type="number"
            label={t("settings.policy.fields.freeCancelWindow")}
            fullWidth
            value={cancelWindow}
            onChange={(e) => setCancelWindow(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            type="number"
            label={t("settings.policy.fields.maxCancels")}
            fullWidth
            value={maxCancels}
            onChange={(e) => setMaxCancels(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            type="number"
            label={t("settings.policy.fields.freeRescheduleWindow")}
            fullWidth
            value={resWindow}
            onChange={(e) => setResWindow(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            type="number"
            label={t("settings.policy.fields.maxReschedules")}
            fullWidth
            value={maxReschedules}
            onChange={(e) => setMaxReschedules(e.target.value)}
          />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? t("settings.common.saving") : t("settings.policy.actions.save")}
        </Button>
      </Stack>
    </SectionCard>
  );

  const EmbedCard = (
    <SectionCard
      title={t("settings.embed.title")}
      description={t("settings.embed.description")}
    >
      {/* Choice: popup vs inline */}
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t("settings.embed.choosePrompt")}
        </Typography>
        <RadioGroup
          row
          value={embedMode}
          onChange={(e) => setEmbedMode(e.target.value)}
        >
          <FormControlLabel value="popup" control={<Radio />} label={t("settings.embed.modes.popup")} />
          <FormControlLabel value="inline" control={<Radio />} label={t("settings.embed.modes.inline")} />
        </RadioGroup>
      </FormControl>

      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={4}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {t("settings.general.primaryColor.label")}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <input
              type="color"
              value={resolvedPrimary}
              onChange={(e) => setEmbedPrimary(e.target.value)}
              style={{
                width: 48,
                height: 36,
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 6,
                cursor: "pointer",
                padding: 0,
                background: "transparent",
              }}
            />
            <Chip size="small" label={resolvedPrimary} />
          </Stack>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>{t("settings.general.theme.label")}</InputLabel>
            <Select
              label={t("settings.general.theme.label")}
              value={resolvedText}
              onChange={(e) => setEmbedText(e.target.value)}
            >
              <MenuItem value="light">{t("settings.general.theme.options.light")}</MenuItem>
              <MenuItem value="dark">{t("settings.general.theme.options.dark")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4} sx={{ display: "flex", alignItems: "center" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={embedDialog}
                onChange={(e) => setEmbedDialog(e.target.checked)}
              />
            }
            label={t("settings.embed.dialogLabel", "Force open in modal/dialog")}
          />
        </Grid>
      </Grid>

      {/* Snippet box */}
      <TextField
        label={
          embedMode === "popup"
            ? t("settings.embed.snippetLabel.popup")
            : t("settings.embed.snippetLabel.inline")
        }
        multiline
        minRows={embedMode === "popup" ? 4 : 3}
        fullWidth
        value={activeSnippet}
        InputProps={{ readOnly: true }}
      />

      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button
        variant="outlined"
        startIcon={<ContentCopyIcon />}
        onClick={() =>
          navigator.clipboard
            .writeText(activeSnippet || "")
            .then(() => setCopyToast(true))
            .catch(() => setMessage(t("settings.common.copyFailed", { defaultValue: "Copy failed. Please copy manually." })))
        }
      >
        {t("settings.common.copy")}
      </Button>
        {/* Quick preview for inline and popup */}
        {previewSrc && (
          <Button
            variant="text"
            endIcon={<OpenInNewIcon />}
            onClick={() => setPreviewOpen(true)}
          >
            {t("settings.common.preview")}
          </Button>
        )}
      </Stack>

      {/* Live preview */}
      {previewSrc && (
        <Box
          sx={{
            mt: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <iframe
            title={t("settings.embed.previewTitle")}
            src={previewSrc}
            style={{ width: "100%", height: 540, border: "0" }}
          />
          <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {t("settings.embed.previewFallback", "If the embed is blocked, open the booking page directly.")}
            </Typography>
            <Button size="small" onClick={() => window.open(previewSrc, "_blank", "noopener")}>
              {t("settings.common.preview")}
            </Button>
          </Box>
        </Box>
      )}

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>{t("settings.embed.previewTitle")}</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {previewSrc && (
            <iframe
              title={t("settings.embed.previewTitle")}
              src={previewSrc}
              style={{ width: "100%", height: "70vh", border: "0" }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Help / instructions */}
      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={700}>{t("settings.embed.faq.title")}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t("settings.embed.faq.subtitle")}
          </Typography>
          <ul style={{ marginTop: 0 }}>
            <li>
              <Trans
                i18nKey="settings.embed.faq.popup"
                components={{ strong: <strong />, em: <em /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="settings.embed.faq.inline"
                components={{ strong: <strong />, em: <em /> }}
              />
            </li>
          </ul>
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2">{t("settings.embed.platforms.wix.title")}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <Trans
              i18nKey="settings.embed.platforms.wix.description"
              components={{ bold: <b /> }}
            />
          </Typography>

          <Typography variant="subtitle2">{t("settings.embed.platforms.wordpress.title")}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <Trans
              i18nKey="settings.embed.platforms.wordpress.description"
              components={{ bold: <b /> }}
            />
          </Typography>

          <Typography variant="subtitle2">{t("settings.embed.platforms.squarespace.title")}</Typography>
          <Typography variant="body2">
            <Trans
              i18nKey="settings.embed.platforms.squarespace.description"
              components={{ bold: <b /> }}
            />
          </Typography>
        </AccordionDetails>
      </Accordion>
    </SectionCard>
  );

  /* ---------- tabs ---------- */
  const tabs = [
    {
      label: t("settings.tabs.workspace"),
      content: (
        <Stack spacing={2}>
          {GeneralCard}
          {PolicyCard}
          <SettingsTimeTracking />
        </Stack>
      ),
    },
    {
      label: t("settings.tabs.profession", "Profession"),
      content: <ProfessionSettings />,
    },
    {
      label: t("settings.tabs.embed"),
      content: <>{EmbedCard}</>,
    },
    {
      label: t("settings.tabs.reviewsTips"),
      content: <SettingsReviewsTips />,
    },
    {
      label: t("settings.tabs.artistVisibility"),
      content: <SettingsArtistVisibility />,
    },
    {
      label: t("settings.tabs.clientVideo"),
      content: <SettingsClientVideo />,
    },
    {
      label: t("settings.tabs.stripeHub"),
      content: <SettingsStripeHub />,
    },
    {
      label: t("settings.tabs.xero", "Xero"),
      content: <SettingsXero />,
    },
    {
      label: t("settings.tabs.quickbooks", "QuickBooks"),
      content: <SettingsQuickBooks />,
    },
    {
      label: t("settings.tabs.integrationActivity", "Integration activity"),
      content: <IntegrationActivityCard />,
    },
    {
      label: t("settings.tabs.checkout"),
      content: <SettingsCheckoutPro />,
    },
  ];

  /* ---------- UI ---------- */
  return (
    <>
      <TabShell
        title={t("settings.title")}
        description={t("settings.description")}
        tabs={tabs}
        defaultIndex={defaultTabIndex}
      />

      <Snackbar open={!!message} autoHideDuration={3500} onClose={() => setMessage(null)}>
        <Alert onClose={() => setMessage(null)} severity="info" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
      <Snackbar
        open={copyToast}
        autoHideDuration={2000}
        onClose={() => setCopyToast(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setCopyToast(false)} severity="success" sx={{ width: "100%" }}>
          {t("settings.embed.copySuccess", { defaultValue: "Embed snippet copied" })}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Settings;
