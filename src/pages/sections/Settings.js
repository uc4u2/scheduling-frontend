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
import SettingsArtistVisibility from "./SettingsArtistVisibility";
import SettingsClientVideo from "./SettingsClientVideo";
import ProfessionSettings from "./ProfessionSetting";

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
      checkout: 6,
      payments: 6,
      'checkout-pro': 6,
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

  const professionLabelMap = useMemo(() => new Map(PROFESSION_OPTIONS.map((option) => [option.value, option.label])), []);

  // embed snippets (from backend)
  const [snippetWidget, setSnippetWidget] = useState(""); // script (popup)
  const [snippetIframe, setSnippetIframe] = useState(""); // iframe (inline)

  // which one to show managers (simple toggle)
  const [embedMode, setEmbedMode] = useState("popup"); // "popup" | "inline"

  // cancellation rules
  const [cancelWindow, setCancelWindow] = useState(24);
  const [maxCancels, setMaxCancels] = useState(3);
  const [resWindow, setResWindow] = useState(6);
  const [maxReschedules, setMaxReschedules] = useState(3);

  const [message, setMessage] = useState(null);
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
        setProfession(data.profession ?? "");
        setDefaultProfession(data.default_profession ?? "");
        const effective = data.effective_profession ?? data.default_profession ?? "";
        setEffectiveProfession(effective);
        setWorkspaceName(data.workspace_name ?? "prefs");
        setTheme(data.theme ?? "light");
        setLanguage(data.language ?? "en");
        setPrimary(data.primary_color ?? "#1976d2");
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
  const activeSnippet = embedMode === "popup" ? snippetWidget : snippetIframe;
  const previewSrc = useMemo(() => extractIframeSrc(snippetIframe), [snippetIframe]);

  const notSetLabel = t("settings.general.profession.notSet", { defaultValue: "Not set" });

  const resolveProfessionLabel = (value) => {
    if (!value) return "";
    return professionLabelMap.get(value) || value;
  };

  const companyProfessionLabel = resolveProfessionLabel(defaultProfession) || notSetLabel;
  const effectiveProfessionLabel = resolveProfessionLabel(effectiveProfession) || companyProfessionLabel;

  /* ---------- sections ---------- */
  const GeneralCard = (
    <SectionCard
      title={t("settings.general.title")}
      description={t("settings.general.description")}
      actions={
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? t("settings.common.saving") : t("settings.general.actions.save")}
        </Button>
      }
    >
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>{t("settings.general.profession.label")}</InputLabel>
            <Select
              label={t("settings.general.profession.label")}
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            >
              <MenuItem value="hr">{t("settings.general.profession.options.hr")}</MenuItem>
              <MenuItem value="salon">{t("settings.general.profession.options.salon")}</MenuItem>
              <MenuItem value="clinic">{t("settings.general.profession.options.clinic")}</MenuItem>
              <MenuItem value="education">{t("settings.general.profession.options.education")}</MenuItem>
              <MenuItem value="other">{t("settings.general.profession.options.other")}</MenuItem>
            </Select>
          </FormControl>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1 }}
          >
            {t("settings.general.profession.helper", {
              defaultValue: "Company default: {{company}} | Your view: {{effective}}",
              company: companyProfessionLabel,
              effective: effectiveProfessionLabel,
            })}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label={t("settings.general.workspaceName.label")}
            fullWidth
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
          />
        </Grid>

        <Grid item xs={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>{t("settings.general.language.label")}</InputLabel>
            <Select
              label={t("settings.general.language.label")}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <MenuItem value="en">{t("settings.general.language.options.en")}</MenuItem>
              <MenuItem value="fr">{t("settings.general.language.options.fr")}</MenuItem>
              <MenuItem value="es">{t("settings.general.language.options.es")}</MenuItem>
              <MenuItem value="de">{t("settings.general.language.options.de")}</MenuItem>
              <MenuItem value="ar">{t("settings.general.language.options.ar")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>{t("settings.general.theme.label")}</InputLabel>
            <Select
              label={t("settings.general.theme.label")}
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <MenuItem value="light">{t("settings.general.theme.options.light")}</MenuItem>
              <MenuItem value="dark">{t("settings.general.theme.options.dark")}</MenuItem>
              <MenuItem value="blue">{t("settings.general.theme.options.blue")}</MenuItem>
              <MenuItem value="pastel">{t("settings.general.theme.options.pastel")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Brand color */}
        <Grid item xs={12} md={4}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {t("settings.general.primaryColor.label")}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
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
            <Chip size="small" label={primary} />
            <Tooltip title={t("settings.general.primaryColor.tooltip")}>
              <IconButton size="small">
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Grid>
      </Grid>
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
          onClick={() => navigator.clipboard.writeText(activeSnippet || "")}
        >
          {t("settings.common.copy")}
        </Button>
        {/* Quick preview for inline (and for popup we still preview inline UI) */}
        {previewSrc && (
          <Button
            variant="text"
            endIcon={<OpenInNewIcon />}
            onClick={() => window.open(previewSrc, "_blank", "noopener")}
          >
            {t("settings.common.preview")}
          </Button>
        )}
      </Stack>

      {/* Live inline preview (only if inline selected) */}
      {embedMode === "inline" && previewSrc && (
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
        </Box>
      )}

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
    </>
  );
};

export default Settings;




