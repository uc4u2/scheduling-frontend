import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import DomainVerificationIcon from "@mui/icons-material/DomainVerification";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WebsiteNavSettingsCard from "../../../components/website/WebsiteNavSettingsCard";

import { wb } from "../../../utils/api";
import useCompanyId from "../../../hooks/useCompanyId";

/**
 * Website Builder (manager)
 * - Theme + publish toggle
 * - Pages (very simple JSON content editor)
 * - Domain connect + verify
 * - Quick links to Templates and Visual Builder
 *
 * Contracts:
 *  - Uses `wb.*` API helpers (see src/utils/api.js)
 *  - Expects backend to supply WebsitePage fields:
 *      { id, slug, title, content, show_in_menu, menu_title, order|sort_order,
 *        published, is_homepage, seo_title?, seo_description? }
 */

const emptyPage = () => ({
  title: "New Page",
  slug: "new-page",
  menu_title: "New Page",
  show_in_menu: true,
  sort_order: 0,
  published: false,
  is_homepage: false,
  content: { sections: [] },
});

const field = (obj, k, fallback = "") =>
  obj?.[k] !== undefined && obj?.[k] !== null ? obj[k] : fallback;

const normalizePage = (p = {}) => ({
  id: p.id,
  title: field(p, "title", ""),
  slug: field(p, "slug", ""),
  menu_title: field(p, "menu_title", field(p, "title", "")),
  show_in_menu: Boolean(p.show_in_menu ?? true),
  sort_order:
    p.sort_order !== undefined
      ? Number(p.sort_order)
      : p.order !== undefined
      ? Number(p.order)
      : 0,
  published: Boolean(p.published ?? true),
  is_homepage: Boolean(p.is_homepage ?? false),
  seo_title: field(p, "seo_title", ""),
  seo_description: field(p, "seo_description", ""),
  content: p.content && typeof p.content === "object" ? p.content : { sections: [] },
});

export default function WebsiteBuilder() {
  const theme = useTheme();
  const detectedCompanyId = useCompanyId(); // reads from context/localStorage
  const [companyId, setCompanyId] = useState(detectedCompanyId || "");

  // Data
  const [settings, setSettings] = useState(null);
  const [themes, setThemes] = useState([]);
  const [pages, setPages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Editing states
  const [editing, setEditing] = useState(emptyPage());
  const [contentText, setContentText] = useState(JSON.stringify({ sections: [] }, null, 2));

  // Domain
  const [customDomain, setCustomDomain] = useState("");
  const [domainCheck, setDomainCheck] = useState(null);

  // UI
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const currentThemeId = settings?.theme?.id || settings?.theme_id || "";
  const isLive = Boolean(settings?.is_live);

  const selectedPage = useMemo(
    () => pages.find((p) => p.id === selectedId) || null,
    [pages, selectedId]
  );

  useEffect(() => {
    if (!companyId) return;
    loadAll(companyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const loadAll = async (cid) => {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const [themesRes, settingsRes, pagesRes] = await Promise.all([
        wb.listThemes(), // GET /api/website/themes
        wb.getSettings(cid), // GET /api/website/settings
        wb.listPages(cid), // GET /api/website/pages
      ]);

      const rawThemes = themesRes?.data;
const t = Array.isArray(rawThemes)
  ? rawThemes
  : Array.isArray(rawThemes?.items)
  ? rawThemes.items
  : [];

      const st = settingsRes.data || {};
      const pg = (pagesRes.data || []).map(normalizePage);

      setThemes(t);
      setSettings(st);
      setCustomDomain(st?.custom_domain || "");
      setPages(pg);
      if (pg.length > 0) {
        setSelectedId(pg[0].id);
        setEditing(pg[0]);
        setContentText(JSON.stringify(pg[0].content || { sections: [] }, null, 2));
      } else {
        setSelectedId(null);
        setEditing(emptyPage());
        setContentText(JSON.stringify({ sections: [] }, null, 2));
      }
      setMsg("Loaded website data.");
    } catch (e) {
      console.error(e);
      setErr("Failed to load website data.");
    } finally {
      setBusy(false);
    }
  };

  const onPickPage = (id) => {
    const p = pages.find((x) => x.id === id);
    if (!p) return;
    setSelectedId(id);
    setEditing(p);
    setContentText(JSON.stringify(p.content || { sections: [] }, null, 2));
  };

  const onCreatePage = async () => {
    if (!companyId) return setErr("Company ID is required.");
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const payload = emptyPage();
      const res = await wb.createPage(companyId, payload);
      const created = normalizePage(res.data);
      const next = [created, ...pages];
      setPages(next);
      setSelectedId(created.id);
      setEditing(created);
      setContentText(JSON.stringify(created.content, null, 2));
      setMsg("Page created.");
    } catch (e) {
      console.error(e);
      setErr("Failed to create page.");
    } finally {
      setBusy(false);
    }
  };

  const onDeletePage = async () => {
    if (!companyId || !selectedId) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await wb.deletePage(companyId, selectedId);
      const next = pages.filter((p) => p.id !== selectedId);
      setPages(next);
      if (next.length > 0) {
        setSelectedId(next[0].id);
        setEditing(next[0]);
        setContentText(JSON.stringify(next[0].content, null, 2));
      } else {
        setSelectedId(null);
        setEditing(emptyPage());
        setContentText(JSON.stringify({ sections: [] }, null, 2));
      }
      setMsg("Page deleted.");
    } catch (e) {
      console.error(e);
      setErr("Failed to delete page.");
    } finally {
      setBusy(false);
    }
  };

  const parseContent = () => {
    try {
      const obj = JSON.parse(contentText);
      return obj && typeof obj === "object" ? obj : { sections: [] };
    } catch {
      return { sections: [] };
    }
  };

  const onSavePage = async () => {
    if (!companyId || !selectedId) return;
    setBusy(true);
    setErr("");
    setMsg("");

    const body = {
      title: editing.title,
      slug: editing.slug,
      menu_title: editing.menu_title,
      show_in_menu: Boolean(editing.show_in_menu),
      sort_order: Number(editing.sort_order || 0),
      published: Boolean(editing.published),
      is_homepage: Boolean(editing.is_homepage),
      seo_title: editing.seo_title || "",
      seo_description: editing.seo_description || "",
      content: parseContent(),
    };

    try {
      const res = await wb.updatePage(companyId, selectedId, body);
      const saved = normalizePage(res.data || body);
      const next = pages.map((p) => (p.id === selectedId ? saved : p));
      setPages(next);
      setEditing(saved);
      setContentText(JSON.stringify(saved.content, null, 2));
      setMsg("Page saved.");
    } catch (e) {
      console.error(e);
      setErr("Failed to save page.");
    } finally {
      setBusy(false);
    }
  };

  const onSaveTheme = async () => {
    if (!companyId) return;
    const theme_id = currentThemeId ? Number(currentThemeId) : null;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await wb.saveSettings(companyId, { theme_id });
      setSettings(res.data);
      setMsg("Theme saved.");
    } catch (e) {
      console.error(e);
      setErr("Failed to save theme.");
    } finally {
      setBusy(false);
    }
  };

  const onToggleLive = async () => {
    if (!companyId) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await wb.publish(companyId, !isLive);
      setSettings(res.data);
      setMsg(!isLive ? "Site published." : "Site unpublished.");
    } catch (e) {
      console.error(e);
      setErr("Failed to change publish state.");
    } finally {
           setBusy(false);
    }
  };

  const onConnectDomain = async () => {
    if (!companyId || !customDomain) {
      return setErr("Please enter a domain first.");
    }
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await wb.connectDomain(companyId, customDomain);
      setDomainCheck(res.data);
      setMsg("Domain saved. Update DNS, then click Verify.");
    } catch (e) {
      console.error(e);
      setErr("Failed to save domain.");
    } finally {
      setBusy(false);
    }
  };

  const onVerifyDomain = async () => {
    if (!companyId) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await wb.verifyDomain(companyId);
      setDomainCheck(res.data);
      setMsg(res.data?.connected ? "Domain connected ✅" : "Not connected yet.");
    } catch (e) {
      console.error(e);
      setErr("Failed to verify domain.");
    } finally {
      setBusy(false);
    }
  };

  const viewerHint = useMemo(() => {
    // Your public viewer routes (CompanyPublic.js) are /:slug/site and /:slug/site/:pageSlug
    // We don’t know the slug here; show a generic hint.
    return "Open your public site at /:slug/site (see Manager → Company Profile for your slug).";
  }, []);

  return (
    <Box sx={{ p: 2, maxWidth: 1300, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Website Builder
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={busy || !companyId}
            onClick={() => loadAll(companyId)}
          >
            Refresh
          </Button>
          <Button
            size="small"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            href="/manager/website/templates"
          >
            Templates
          </Button>
          <Button
            size="small"
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            href="/manage/website/builder"
          >
            Visual Builder
          </Button>
        </Stack>
      </Stack>

      {(msg || err) && (
        <Box sx={{ mb: 2 }}>
          {msg && <Alert severity="success">{msg}</Alert>}
          {err && <Alert severity="error" sx={{ mt: msg ? 1 : 0 }}>{err}</Alert>}
        </Box>
      )}

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            label="Company ID"
            size="small"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            helperText="Auto-detected from your session (override if needed)"
            sx={{ minWidth: 220 }}
          />
          <Typography variant="body2" color="text.secondary">
            {viewerHint}
          </Typography>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {/* Left: Settings & Domain */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Theme & Publish
            </Typography>

            <TextField
              select
              label="Theme"
              value={currentThemeId || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...(s || {}),
                  theme_id: e.target.value,
                  theme: { ...(s?.theme || {}), id: e.target.value },
                }))
              }
              fullWidth
              size="small"
              sx={{ mb: 1 }}
            >
              {(Array.isArray(themes) ? themes : []).map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name || t.key || `Theme #${t.id}`}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={busy || !companyId}
                onClick={onSaveTheme}
              >
                Save Theme
              </Button>
              <Button
                variant={isLive ? "outlined" : "contained"}
                color={isLive ? "warning" : "success"}
                startIcon={<RocketLaunchIcon />}
                disabled={busy || !companyId}
                onClick={onToggleLive}
              >
                {isLive ? "Unpublish" : "Publish"}
              </Button>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Custom Domain
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                label="Domain (e.g. www.example.com)"
                size="small"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={onConnectDomain}
                disabled={busy || !companyId || !customDomain}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                startIcon={<DomainVerificationIcon />}
                onClick={onVerifyDomain}
                disabled={busy || !companyId}
              >
                Verify
              </Button>
            </Stack>

            {domainCheck && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Verification Result
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    background: theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.02)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {JSON.stringify(domainCheck, null, 2)}
                </Paper>
              </Box>
            )}
          </Paper>
        </Grid>
{/* Navigation (Services/Reviews) settings */}
{settings && (
  <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
      Navigation (Services / Reviews)
    </Typography>
    <WebsiteNavSettingsCard
      companyId={companyId}
      pages={pages}
      initialSettings={settings}
      onSaved={(data) => {
        setSettings(data);
        setMsg("Navigation settings saved");
      }}
    />
  </Paper>
)}

        {/* Right: Pages Editor */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={1}
              sx={{ mb: 1 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                Pages
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={onCreatePage}
                disabled={busy || !companyId}
              >
                New Page
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
              {pages.map((p) => (
                <Button
                  key={p.id}
                  size="small"
                  variant={selectedId === p.id ? "contained" : "outlined"}
                  onClick={() => onPickPage(p.id)}
                  sx={{ textTransform: "none" }}
                >
                  {p.menu_title || p.title || p.slug}
                </Button>
              ))}
            </Stack>

            {/* Meta fields */}
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Title"
                  size="small"
                  fullWidth
                  value={editing.title}
                  onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Slug"
                  size="small"
                  fullWidth
                  value={editing.slug}
                  onChange={(e) => setEditing((s) => ({ ...s, slug: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Menu Title"
                  size="small"
                  fullWidth
                  value={editing.menu_title}
                  onChange={(e) => setEditing((s) => ({ ...s, menu_title: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Sort Order"
                  size="small"
                  type="number"
                  fullWidth
                  value={editing.sort_order}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, sort_order: Number(e.target.value || 0) }))
                  }
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ height: "100%" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(editing.show_in_menu)}
                        onChange={(e) =>
                          setEditing((s) => ({ ...s, show_in_menu: Boolean(e.target.checked) }))
                        }
                      />
                    }
                    label="Show in menu"
                  />
                </Stack>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(editing.published)}
                      onChange={(e) =>
                        setEditing((s) => ({ ...s, published: Boolean(e.target.checked) }))
                      }
                    />
                  }
                  label="Published"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(editing.is_homepage)}
                      onChange={(e) =>
                        setEditing((s) => ({ ...s, is_homepage: Boolean(e.target.checked) }))
                      }
                    />
                  }
                  label="Homepage"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="SEO Title"
                  size="small"
                  fullWidth
                  value={editing.seo_title || ""}
                  onChange={(e) => setEditing((s) => ({ ...s, seo_title: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="SEO Description"
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                  value={editing.seo_description || ""}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, seo_description: e.target.value }))
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Content JSON"
                  fullWidth
                  multiline
                  minRows={10}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  helperText="Keep valid JSON. The visual builder can edit sections more comfortably."
                  sx={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  }}
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={onSavePage}
                disabled={busy || !companyId || !selectedId}
              >
                Save Page
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDeletePage}
                disabled={busy || !companyId || !selectedId}
              >
                Delete
              </Button>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Need templates or a richer editor?
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" href="/manager/website/templates">
                Browse Templates
              </Button>
              <Button variant="outlined" href="/manage/website/builder">
                Open Visual Builder
              </Button>
              <Button variant="text" href="/manager/website">
                Website Manager
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
