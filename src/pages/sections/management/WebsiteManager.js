// src/pages/sections/management/WebsiteManager.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import api, { wb, chatbot } from "../../../utils/api";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Link,
  Tooltip,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PaletteIcon from "@mui/icons-material/Palette";
import ThemeDesignerDialog from "../../../components/website/ThemeDesignerDialog";
import DomainSettingsCard from "./components/DomainSettingsCard";
import SeoSettingsCard from "./components/SeoSettingsCard";
import useCompanyId from "../../../hooks/useCompanyId";

const EMPTY_FORM = {
  slug: "",
  title: "",
  content: { sections: [] },
  show_in_menu: true,
  menu_title: "",
  sort_order: 0,
  published: true,
  is_homepage: false,
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  og_title: "",
  og_description: "",
  og_image_url: "",
  canonical_path: "",
  noindex: false,
};

const CHATBOT_MAX_CHARS = 20000;

const WebsiteManager = ({ companyId: companyIdProp }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const autoCompanyId = useCompanyId();
  const companyId = companyIdProp ?? autoCompanyId;

  // top-level data
  const [company, setCompany] = useState(null); // { id, slug, name, ... }
  const [themes, setThemes] = useState([]);
  const [settings, setSettings] = useState(null);
  const [pages, setPages] = useState([]);

  // page editor
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [readOnlyPages, setReadOnlyPages] = useState(false); // fallback when /api/website/pages not implemented

  // ui
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Theme Designer dialog state
  const [openTheme, setOpenTheme] = useState(false);

  const [domainSnapshot, setDomainSnapshot] = useState({ status: "none", domain: "", verifiedAt: null });

  const [chatbotEnabled, setChatbotEnabled] = useState(false);
  const [chatbotKnowledge, setChatbotKnowledge] = useState("");
  const [chatbotUpdatedAt, setChatbotUpdatedAt] = useState(null);
  const [chatbotLoading, setChatbotLoading] = useState(true);
  const [chatbotSaving, setChatbotSaving] = useState(false);
  const [chatbotErr, setChatbotErr] = useState("");
  const [chatbotMsg, setChatbotMsg] = useState("");
  const [chatbotAssistantName, setChatbotAssistantName] = useState("");
  const [chatbotGreetingText, setChatbotGreetingText] = useState("");
  const [chatbotQuickReplies, setChatbotQuickReplies] = useState("");
  const [chatbotPrimaryCtaLabel, setChatbotPrimaryCtaLabel] = useState("");
  const [chatbotPrimaryCtaHref, setChatbotPrimaryCtaHref] = useState("");
  const [chatbotSecondaryCtaLabel, setChatbotSecondaryCtaLabel] = useState("");
  const [chatbotSecondaryCtaHref, setChatbotSecondaryCtaHref] = useState("");

  const applySettingsPayload = useCallback((payload) => {
    if (!payload) return;
    const data = payload?.data ?? payload;
    setSettings(data);
    if (data) {
      setDomainSnapshot((prev) => {
        const verifiedAt = data.domain_verified_at || prev.verifiedAt || null;
        const hasVerifiedAt = Boolean(verifiedAt);
        const explicitStatus = data.domain_status && data.domain_status !== "none"
          ? data.domain_status
          : "";
        return {
          ...prev,
          status: explicitStatus
            || (data.custom_domain
              ? hasVerifiedAt
                ? "verified"
                : "pending_dns"
              : "none"),
          domain: data.custom_domain || prev.domain || "",
          verifiedAt,
        };
      });
    }
  }, []);

  const handleDomainSnapshotUpdate = useCallback((snapshot) => {
    if (!snapshot) return;
    setDomainSnapshot(snapshot);
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        custom_domain: snapshot.domain ?? prev.custom_domain,
        domain_status: snapshot.status ?? prev.domain_status,
        domain_verified_at: snapshot.verifiedAt ?? prev.domain_verified_at,
      };
    });
  }, []);

  const handleSeoSave = useCallback(
    async (seoPayload) => {
      if (!companyId) throw new Error(t("management.website.errors.missingCompany"));
      const payload = seoPayload && typeof seoPayload === "object" && seoPayload.seo
        ? seoPayload
        : { seo: seoPayload };
      const res = await wb.saveSettings(companyId, payload, { publish: false });
      const data = res?.data || res;
      const nextSeo = payload.seo || {};
      const nextFavicon = Object.prototype.hasOwnProperty.call(payload, "favicon_url")
        ? payload.favicon_url
        : undefined;
      const hasSeo = data && typeof data === "object" && "seo" in data;
      if (hasSeo) {
        applySettingsPayload(res);
      } else {
        const fallback = {
          ...(settings || {}),
          ...(data && typeof data === "object" ? data : {}),
          seo: nextSeo,
          favicon_url: nextFavicon !== undefined ? nextFavicon : settings?.favicon_url,
        };
        fallback.settings = {
          ...(settings?.settings || {}),
          ...(fallback.settings || {}),
          seo: nextSeo,
          favicon_url: nextFavicon !== undefined ? nextFavicon : settings?.settings?.favicon_url,
        };
        fallback.website = {
          ...(settings?.website || {}),
          ...(fallback.website || {}),
          seo: nextSeo,
          favicon_url: nextFavicon !== undefined ? nextFavicon : settings?.website?.favicon_url,
        };
        applySettingsPayload({ data: fallback });
      }
      return res;
    },
    [companyId, t, applySettingsPayload, settings]
  );

  // computed
  const slugPath = useMemo(() => {
    const slug = company?.slug?.trim();
    return slug ? `/${slug}` : "";
  }, [company?.slug]);

  const slugFullUrl = useMemo(() => {
    if (!slugPath) return "";
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      return origin ? `${origin}${slugPath}` : slugPath;
    } catch {
      return slugPath;
    }
  }, [slugPath]);

  const domainStatusMeta = useMemo(() => {
    switch (domainSnapshot.status) {
      case "ssl_active":
      case "verified":
        return { label: t("management.website.domainStatus.verified"), color: "success" };
      case "verified_dns":
      case "provisioning_ssl":
      case "ssl_failed":
      case "pending_dns":
        return { label: t("management.website.domainStatus.pending"), color: "warning" };
      default:
        return { label: t("management.website.domainStatus.none"), color: "default" };
    }
  }, [domainSnapshot.status, t]);

  const statusLabels = useMemo(
    () => ({
      published: t("management.website.pageStatus.published"),
      draft: t("management.website.pageStatus.draft"),
    }),
    [t]
  );

  const pageSecondaryText = useCallback(
    (page) =>
      t("management.website.pageSecondary", {
        slug: page.slug,
        order: page.sort_order ?? 0,
        status: page.published ? statusLabels.published : statusLabels.draft,
      }),
    [statusLabels, t]
  );

  const canPublish = useMemo(() => !!settings?.theme || !!settings?.theme_id, [settings]);
  const companyLogoUrl = useMemo(
    () => company?.logo_url || company?.logo || "",
    [company]
  );
  const hasDraftChanges = Boolean(settings?.has_unpublished_changes);
  const lastPublishedLabel = useMemo(() => {
    const ts = settings?.branding_published_at;
    if (!ts) return null;
    try {
      const date = new Date(ts);
      if (Number.isNaN(date.getTime())) return null;
      return `${t("management.website.labels.publishedAt", "Published")} ${date.toLocaleString()}`;
    } catch {
      return null;
    }
  }, [settings?.branding_published_at, t]);

  const loadPages = useCallback(
    async (slug) => {
      if (!companyId) return;
      try {
        const response = await wb.listPages(companyId);
        const list = Array.isArray(response.data) ? response.data : [];
        setPages(list);
        setReadOnlyPages(false);
      } catch (error) {
        if (slug) {
          console.warn(
            "[website-manager] falling back to public site pages for slug",
            slug,
            error
          );
          try {
            const { data } = await wb.publicBySlug(slug);
            const list = Array.isArray(data?.pages) ? data.pages : [];
            setPages(list);
            setReadOnlyPages(true);
            setMsg((prev) => prev || t("management.website.messages.publicSnapshot"));
          } catch (fallbackErr) {
            console.warn(
              "[website-manager] unable to load pages via public slug fallback",
              fallbackErr
            );
            setErr(t("management.website.errors.pageLoad"));
          }
        } else {
          setErr(t("management.website.errors.pageLoad"));
        }
      }
    },
    [companyId, t]
  );

  useEffect(() => {
    if (!companyId) return;
    let alive = true;

    const fetchCore = async () => {
      setLoading(true);
      setErr("");
      setMsg("");
      setChatbotErr("");
      setChatbotMsg("");
      setChatbotLoading(true);

      try {
        const [companyRes, themesRes, settingsRes, chatbotRes] = await Promise.allSettled([
          api.get("/admin/company-profile", { params: { company_id: companyId } }),
          wb.listThemes(companyId),
          wb.getSettings(companyId),
          chatbot.getSettings(companyId),
        ]);

        let companyData = null;
        let settingsData = null;

        if (companyRes.status === "fulfilled") {
          companyData = companyRes.value?.data || null;
          if (alive) setCompany(companyData);
        } else if (alive) {
          setCompany(null);
          setErr((prev) => prev || t("management.website.errors.companyLoad"));
        }

        if (themesRes.status === "fulfilled") {
          const themeItems = Array.isArray(themesRes.value?.data)
            ? themesRes.value.data
            : [];
          if (alive) setThemes(themeItems);
        } else if (alive) {
          setThemes([]);
        }

        if (settingsRes.status === "fulfilled") {
          settingsData = settingsRes.value?.data || null;
          if (alive) applySettingsPayload(settingsData);
        } else if (alive) {
          setSettings(null);
          setErr((prev) => prev || t("management.website.errors.settingsLoad"));
        }

        if (chatbotRes.status === "fulfilled") {
          const data = chatbotRes.value?.data || {};
          if (alive) {
            setChatbotEnabled(Boolean(data.enabled));
            setChatbotKnowledge(data.knowledge || "");
            setChatbotUpdatedAt(data.updated_at || null);
            setChatbotAssistantName(data.assistant_name || "");
            setChatbotGreetingText(data.greeting_text || "");
            setChatbotQuickReplies(
              Array.isArray(data.quick_replies) ? data.quick_replies.join("\n") : ""
            );
            setChatbotPrimaryCtaLabel(data.primary_cta?.label || "");
            setChatbotPrimaryCtaHref(data.primary_cta?.href || "");
            setChatbotSecondaryCtaLabel(data.secondary_cta?.label || "");
            setChatbotSecondaryCtaHref(data.secondary_cta?.href || "");
          }
        } else if (alive) {
          setChatbotErr("Unable to load chatbot settings.");
        }

        const slug =
          companyData?.slug ||
          settingsData?.slug ||
          settingsData?.company?.slug ||
          null;

        await loadPages(slug);
      } finally {
        if (alive) setLoading(false);
        if (alive) setChatbotLoading(false);
      }
    };

    fetchCore();
    return () => {
      alive = false;
    };
  }, [companyId, loadPages, t, applySettingsPayload]);

  const saveChatbotSettings = async () => {
    if (!companyId) return;
    setChatbotSaving(true);
    setChatbotErr("");
    setChatbotMsg("");
    try {
      const quickReplies = chatbotQuickReplies
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 8);
      const res = await chatbot.saveSettings(companyId, {
        enabled: chatbotEnabled,
        knowledge: chatbotKnowledge,
        assistant_name: chatbotAssistantName,
        greeting_text: chatbotGreetingText,
        quick_replies: quickReplies,
        primary_cta: {
          label: chatbotPrimaryCtaLabel,
          href: chatbotPrimaryCtaHref,
        },
        secondary_cta: {
          label: chatbotSecondaryCtaLabel,
          href: chatbotSecondaryCtaHref,
        },
      });
      const data = res.data || {};
      setChatbotEnabled(Boolean(data.enabled));
      setChatbotKnowledge(data.knowledge || "");
      setChatbotUpdatedAt(data.updated_at || null);
      setChatbotAssistantName(data.assistant_name || "");
      setChatbotGreetingText(data.greeting_text || "");
      setChatbotQuickReplies(
        Array.isArray(data.quick_replies) ? data.quick_replies.join("\n") : ""
      );
      setChatbotPrimaryCtaLabel(data.primary_cta?.label || "");
      setChatbotPrimaryCtaHref(data.primary_cta?.href || "");
      setChatbotSecondaryCtaLabel(data.secondary_cta?.label || "");
      setChatbotSecondaryCtaHref(data.secondary_cta?.href || "");
      setChatbotMsg("Chatbot settings saved.");
    } catch (error) {
      const message = error?.displayMessage || error?.response?.data?.error || "Unable to save chatbot settings.";
      setChatbotErr(message);
    } finally {
      setChatbotSaving(false);
    }
  };

  const refreshPages = async () => {
    if (!companyId) return;
    setErr("");
    setMsg("");
    try {
      const r = await wb.listPages(companyId);
      setPages(Array.isArray(r.data) ? r.data : []);
      setReadOnlyPages(false);
      setMsg(t("management.website.messages.pagesRefreshed"));
    } catch {
      // try public fallback
      if (company?.slug) {
        try {
          const { data } = await wb.publicBySlug(company.slug);
          const list = Array.isArray(data?.pages) ? data.pages : [];
          setPages(list);
          setReadOnlyPages(true);
          setMsg(t("management.website.messages.pagesRefreshedPublic"));
        } catch {
          setErr(t("management.website.errors.refresh"));
        }
      } else {
        setErr(t("management.website.errors.refresh"));
      }
    }
  };

  const saveSettings = async () => {
    if (!companyId) return;
    setErr("");
    setMsg("");
    try {
      const payload = {
        theme_id: settings?.theme?.id || settings?.theme_id || null,
        is_live: !!settings?.is_live,
      };
      const res = await wb.saveSettings(companyId, payload, { publish: false });
      applySettingsPayload(res);
      setMsg(t("management.website.messages.settingsSaved"));
    } catch {
      setErr(t("management.website.errors.settingsSave"));
    }
  };

  const publishSite = async () => {
    if (!companyId) return;
    if (!canPublish) return alert(t("management.website.alerts.pickTheme"));
    setErr("");
    setMsg("");
    setPublishing(true);
    try {
      const brandingRes = await wb.saveSettings(companyId, {}, { publish: true });
      const brandingPayload = brandingRes?.data || brandingRes || {};
      setSettings((s) => ({ ...(s || {}), ...(brandingPayload || {}) }));
      const res = await wb.publish(companyId, true);
      setSettings((s) => ({ ...(s || {}), is_live: !!res.data?.is_live }));
      setMsg(t("management.website.messages.sitePublished"));
    } catch (error) {
      console.error("Publish failed", error);
      setErr(t("management.website.errors.publish"));
    } finally {
      setPublishing(false);
    }
  };

  const editPage = (p) => {
    setEditingId(p.id);
    setForm({
      slug: p.slug || "",
      title: p.title || "",
      content: p.content || { sections: [] },
      show_in_menu: !!p.show_in_menu,
      menu_title: p.menu_title || "",
      sort_order: Number(p.sort_order || 0),
      published: !!p.published,
      is_homepage: !!p.is_homepage,
      seo_title: p.seo_title || "",
      seo_description: p.seo_description || "",
      seo_keywords: p.seo_keywords || "",
      og_title: p.og_title || "",
      og_description: p.og_description || "",
      og_image_url: p.og_image_url || "",
      canonical_path: p.canonical_path || "",
      noindex: !!p.noindex,
    });
  };

  const createOrUpdatePage = async () => {
    if (!companyId || readOnlyPages) return;
    const payload = { ...form };
    if (!payload.slug?.trim() || !payload.title?.trim()) {
      alert(t("management.website.alerts.slugTitleRequired"));
      return;
    }
    setErr("");
    setMsg("");
    try {
      if (editingId) {
        const res = await wb.updatePage(companyId, editingId, payload);
        setEditingId(null);
        setForm(EMPTY_FORM);
        setPages((prev) => prev.map((p) => (p.id === res.data.id ? res.data : p)));
        setMsg(t("management.website.messages.pageSaved"));
      } else {
        const res = await wb.createPage(companyId, payload);
        setForm(EMPTY_FORM);
        setPages((prev) => [...prev, res.data]);
        setMsg(t("management.website.messages.pageCreated"));
      }
    } catch {
      setErr(t("management.website.errors.pageSave"));
    }
  };

  const delPage = async (id) => {
    if (!companyId || readOnlyPages) return;
    if (!window.confirm(t("management.website.alerts.confirmDelete"))) return;
    setErr("");
    setMsg("");
    try {
      await wb.deletePage(companyId, id);
      setPages((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) setEditingId(null);
      setMsg(t("management.website.messages.pageDeleted"));
    } catch {
      setErr(t("management.website.errors.pageDelete"));
    }
  };

  const copyUrl = async () => {
    if (!slugFullUrl) return;
    try {
      await navigator.clipboard.writeText(slugFullUrl);
      setMsg(t("management.website.messages.urlCopied"));
      return;
    } catch {
      try {
        const dummy = document.createElement("textarea");
        dummy.value = slugFullUrl;
        dummy.setAttribute("readonly", "");
        dummy.style.position = "absolute";
        dummy.style.opacity = "0";
        document.body.appendChild(dummy);
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        setMsg(t("management.website.messages.urlCopied"));
        return;
      } catch {
        // ignore
      }
    }
  };

  if (!companyId) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 1 }} variant="body2">
          {t("management.website.states.resolvingCompany")}
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", md: "center" }}
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {t("management.website.title")}
        </Typography>
        <Chip
          size="small"
          label={domainStatusMeta.label}
          color={domainStatusMeta.color === "default" ? "default" : domainStatusMeta.color}
          variant={domainStatusMeta.color === "default" ? "outlined" : "filled"}
        />
        {hasDraftChanges && (
          <Chip size="small" color="warning" label={t("management.website.labels.draftPending", "Draft changes pending")} />
        )}
        {lastPublishedLabel && (
          <Chip size="small" variant="outlined" label={lastPublishedLabel} />
        )}

        {/* Public viewer link (auto from slug) */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ width: "100%" }}
        >
          <TextField
            size="small"
            label={t("management.website.fields.publicUrl")}
            value={slugFullUrl || t("management.website.fields.publicUrlPlaceholder")}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <Tooltip title={t("management.website.tooltips.openPublic")}>
              <span>
                <Button
                  variant="outlined"
                  endIcon={<OpenInNewIcon />}
                  href={slugPath || undefined}
                  target="_blank"
                  disabled={!slugPath}
                  fullWidth={isSmDown}
                >
                  {t("management.website.buttons.open")}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={t("management.website.tooltips.copyLink")}>
              <span>
                <Button
                  variant="text"
                  onClick={copyUrl}
                  disabled={!slugFullUrl}
                  startIcon={<ContentCopyIcon />}
                  fullWidth={isSmDown}
                >
                  {t("management.website.buttons.copy")}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>

      {(msg || err) && (
        <Box sx={{ mb: 2 }}>
          {msg && <Alert severity="success">{msg}</Alert>}
          {err && <Alert severity="error" sx={{ mt: msg ? 1 : 0 }}>{err}</Alert>}
        </Box>
      )}

      <DomainSettingsCard
        companyId={companyId}
        companySlug={company?.slug}
        primaryHost={settings?.primary_host}
        onDomainChange={handleDomainSnapshotUpdate}
      />

      <SeoSettingsCard
        companyId={companyId}
        companySlug={company?.slug}
        domainStatus={domainSnapshot.status}
        customDomain={domainSnapshot.domain || settings?.custom_domain}
        primaryHost={settings?.primary_host}
        settings={settings}
        companyLogoUrl={companyLogoUrl}
        hasDraftChanges={hasDraftChanges}
        onSave={handleSeoSave}
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">Chatbot</Typography>
              <Typography variant="body2" color="text.secondary">
                Control the assistant shown on your public website.
              </Typography>
            </Box>
            {chatbotLoading && <CircularProgress size={20} />}
          </Stack>

          {(chatbotMsg || chatbotErr) && (
            <Box>
              {chatbotMsg && <Alert severity="success">{chatbotMsg}</Alert>}
              {chatbotErr && <Alert severity="error" sx={{ mt: chatbotMsg ? 1 : 0 }}>{chatbotErr}</Alert>}
            </Box>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={chatbotEnabled}
                onChange={(event) => setChatbotEnabled(event.target.checked)}
              />
            }
            label="Enable chatbot on your website"
          />

          <TextField
            label="Assistant name"
            placeholder="Acme Studio Assistant"
            value={chatbotAssistantName}
            onChange={(event) => setChatbotAssistantName(event.target.value)}
          />

          <TextField
            label="Greeting text"
            placeholder="I can help with bookings, services, and policies."
            multiline
            minRows={3}
            value={chatbotGreetingText}
            onChange={(event) => setChatbotGreetingText(event.target.value)}
          />

          <TextField
            label="Quick replies (one per line, max 8)"
            placeholder={"Tell me about your business\nWhat services do you offer?\nHow do I book?"}
            multiline
            minRows={3}
            value={chatbotQuickReplies}
            onChange={(event) => setChatbotQuickReplies(event.target.value)}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Primary CTA label"
              placeholder="Book now"
              value={chatbotPrimaryCtaLabel}
              onChange={(event) => setChatbotPrimaryCtaLabel(event.target.value)}
              fullWidth
            />
            <TextField
              label="Primary CTA link"
              placeholder="/book"
              value={chatbotPrimaryCtaHref}
              onChange={(event) => setChatbotPrimaryCtaHref(event.target.value)}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Secondary CTA label"
              placeholder="View services"
              value={chatbotSecondaryCtaLabel}
              onChange={(event) => setChatbotSecondaryCtaLabel(event.target.value)}
              fullWidth
            />
            <TextField
              label="Secondary CTA link"
              placeholder="/services"
              value={chatbotSecondaryCtaHref}
              onChange={(event) => setChatbotSecondaryCtaHref(event.target.value)}
              fullWidth
            />
          </Stack>

          <TextField
            label="Business knowledge"
            placeholder="Add your business description, services, hours, policies, and FAQs."
            multiline
            minRows={6}
            value={chatbotKnowledge}
            onChange={(event) => setChatbotKnowledge(event.target.value)}
            helperText={`${chatbotKnowledge.length}/${CHATBOT_MAX_CHARS} characters`}
          />

          {chatbotUpdatedAt && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date(chatbotUpdatedAt).toLocaleString()}
            </Typography>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="contained"
              onClick={saveChatbotSettings}
              disabled={chatbotSaving || chatbotLoading}
            >
              {chatbotSaving ? "Saving…" : "Save chatbot settings"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", lg: "center" }}
        >
          <FormControl size="small" sx={{ minWidth: { lg: 240 } }} fullWidth={isMdDown}>
            <InputLabel>{t("management.website.fields.theme")}</InputLabel>
            <Select
              label={t("management.website.fields.theme")}
              value={settings?.theme?.id || settings?.theme_id || ""}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...(prev || {}),
                  theme_id: event.target.value,
                  theme: undefined,
                }))
              }
            >
              {themes.map((tTheme) => (
                <MenuItem key={tTheme.id} value={tTheme.id}>
                  {tTheme.name || tTheme.key || t("management.website.labels.themeFallback", { id: tTheme.id })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Theme Designer trigger button */}
          <Button
            variant="outlined"
            startIcon={<PaletteIcon />}
            onClick={() => setOpenTheme(true)}
            fullWidth={isSmDown}
          >
            {t("management.website.buttons.theme")}
          </Button>

          <Button variant="outlined" onClick={saveSettings} fullWidth={isSmDown}>
            {t("management.website.buttons.saveTheme")}
          </Button>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", lg: "block" } }}
          />
          <Divider
            orientation="horizontal"
            flexItem
            sx={{ display: { xs: "block", lg: "none" }, my: { xs: 1, lg: 0 } }}
          />
          <Button
            variant="contained"
            onClick={publishSite}
            disabled={!canPublish || publishing}
            fullWidth={isSmDown}
          >
            {publishing
              ? t("management.website.buttons.publishing", "Publishing…")
              : settings?.is_live
              ? t("management.website.buttons.republish")
              : t("management.website.buttons.publish")}
          </Button>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ ml: { lg: "auto" } }}
          >
            <Button variant="outlined" href="/manager/website/templates" fullWidth={isSmDown}>
              {t("management.website.buttons.templates")}
            </Button>
            <Button variant="contained" href="/manage/website/builder" fullWidth={isSmDown}>
              {t("management.website.buttons.visualBuilder")}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Pages */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h6">{t("management.website.sections.pages.title")}</Typography>
            <Button size="small" onClick={refreshPages}>{t("management.website.buttons.refresh")}</Button>
          </Stack>

          {readOnlyPages && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <Trans
                i18nKey="management.website.alerts.publicSnapshot"
                components={{ builderLink: <Link href="/manage/website/builder" /> }}
              />
            </Alert>
          )}

          <List dense>
            {[...pages]
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((p) => {
                const baseTitle = p.title || p.menu_title || p.slug;
                const primaryText = `${baseTitle}${p.is_homepage ? ` ${t("management.website.labels.homeSuffix")}` : ""}`;
                return (
                  <ListItem
                    key={p.id || p.slug}
                    secondaryAction={
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ minWidth: { sm: 160 } }}
                      >
                        <Button
                          size="small"
                          onClick={() => editPage(p)}
                          disabled={readOnlyPages}
                          fullWidth={isSmDown}
                        >
                          {t("management.website.buttons.edit")}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => delPage(p.id)}
                          disabled={readOnlyPages || !p.id}
                          fullWidth={isSmDown}
                        >
                          {t("management.website.buttons.delete")}
                        </Button>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={primaryText}
                      secondary={pageSecondaryText(p)}
                    />
                  </ListItem>
                );
              })}
          </List>
        </Paper>

        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {editingId ? t("management.website.sections.form.editTitle") : t("management.website.sections.form.newTitle")}
          </Typography>

          {readOnlyPages ? (
            <Alert severity="info">
              <Trans
                i18nKey="management.website.alerts.readOnlyMode"
                components={{ builderLink: <Link href="/manage/website/builder" /> }}
              />
            </Alert>
          ) : (
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label={t("management.website.fields.slug")}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={t("management.website.placeholders.slug")}
              />
              <TextField
                size="small"
                label={t("management.website.fields.title")}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <TextField
                size="small"
                label={t("management.website.fields.menuTitle")}
                value={form.menu_title}
                onChange={(e) => setForm({ ...form, menu_title: e.target.value })}
              />
              <TextField
                size="small"
                label={t("management.website.fields.sortOrder")}
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.show_in_menu}
                    onChange={(_, v) => setForm({ ...form, show_in_menu: v })}
                  />
                }
                label={t("management.website.fields.showInMenu")}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.published}
                    onChange={(_, v) => setForm({ ...form, published: v })}
                  />
                }
                label={t("management.website.fields.published")}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_homepage}
                    onChange={(_, v) => setForm({ ...form, is_homepage: v })}
                  />
                }
                label={t("management.website.fields.homepage")}
              />

              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {t("management.website.sections.seo", "SEO & Sharing")}
              </Typography>
              <TextField
                size="small"
                label={t("management.website.fields.seoTitle", "SEO Title")}
                value={form.seo_title}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              />
              <TextField
                size="small"
                label={t("management.website.fields.seoDescription", "SEO Description")}
                value={form.seo_description}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                multiline
                minRows={2}
              />
              <TextField
                size="small"
                label={t("management.website.fields.seoKeywords", "SEO Keywords")}
                value={form.seo_keywords}
                onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })}
                helperText={t("management.website.helpers.seoKeywords", "Comma separated")}
              />
              <TextField
                size="small"
                label={t("management.website.fields.ogTitle", "Open Graph Title")}
                value={form.og_title}
                onChange={(e) => setForm({ ...form, og_title: e.target.value })}
              />
              <TextField
                size="small"
                label={t("management.website.fields.ogDescription", "Open Graph Description")}
                value={form.og_description}
                onChange={(e) => setForm({ ...form, og_description: e.target.value })}
              />
              <TextField
                size="small"
                label={t("management.website.fields.ogImage", "Open Graph Image URL")}
                value={form.og_image_url}
                onChange={(e) => setForm({ ...form, og_image_url: e.target.value })}
              />
              <TextField
                size="small"
                label={t("management.website.fields.canonicalPath", "Canonical Path or Override")}
                value={form.canonical_path}
                onChange={(e) => setForm({ ...form, canonical_path: e.target.value })}
                helperText={t(
                  "management.website.helpers.canonicalPath",
                  "Start with /contact or ?page=contact"
                )}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.noindex}
                    onChange={(_, v) => setForm({ ...form, noindex: v })}
                  />
                }
                label={t("management.website.fields.noindex", "Hide from search (noindex)")}
              />

              <TextField
                size="small"
                label={t("management.website.fields.contentJson")}
                value={JSON.stringify(form.content, null, 2)}
                onChange={(e) => {
                  try {
                    const obj = JSON.parse(e.target.value);
                    setForm({ ...form, content: obj });
                  } catch {
                    // ignore invalid JSON while typing
                  }
                }}
                multiline
                minRows={6}
              />

              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={createOrUpdatePage}>
                  {editingId ? t("management.website.buttons.save") : t("management.website.buttons.create")}
                </Button>
                {editingId && (
                  <Button
                    onClick={() => {
                      setEditingId(null);
                      setForm(EMPTY_FORM);
                    }}
                  >
                    {t("management.website.buttons.cancel")}
                  </Button>
                )}
              </Stack>
            </Stack>
          )}
        </Paper>
      </Stack>

      {/* Theme Designer mounted once */}
      <ThemeDesignerDialog
        open={openTheme}
        onClose={() => setOpenTheme(false)}
        companyId={companyId}
      />
    </Box>
  );
};

export default WebsiteManager;
