// src/pages/sections/management/InlineSiteEditor.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Tabs,
  Tab,
  Button,
  Typography,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BrushIcon from "@mui/icons-material/Brush";
import PublishIcon from "@mui/icons-material/Publish";
import EditIcon from "@mui/icons-material/Edit";
import { wb } from "../../../utils/api";
import { getAuthedCompanyId } from "../../../utils/authedCompany";
import { RenderSections } from "../../../components/website/RenderSections";
import VisualSiteBuilder from "./VisualSiteBuilder";

export default function InlineSiteEditor() {
  const companyId = getAuthedCompanyId();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [settings, setSettings] = useState(null);
  const [pages, setPages] = useState([]);
  const [tab, setTab] = useState(0);
  const [themes, setThemes] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const applySettingsPayload = useCallback((payload) => {
    if (!payload) return;
    const data = payload?.data ?? payload;
    setSettings(data);
  }, []);

  const hasDraftChanges = Boolean(settings?.has_unpublished_changes);
  const lastPublishedLabel = React.useMemo(() => {
    const ts = settings?.branding_published_at;
    if (!ts) return null;
    try {
      const date = new Date(ts);
      if (Number.isNaN(date.getTime())) return null;
      return `Published ${date.toLocaleString()}`;
    } catch {
      return null;
    }
  }, [settings?.branding_published_at]);

  const current = pages[tab] || null;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [settingsRes, pagesRes, themesRes] = await Promise.all([
          wb.getSettings(companyId),
          wb.listPages(companyId),
          wb.listThemes(),
        ]);
        if (!alive) return;
        const list = Array.isArray(pagesRes.data) ? pagesRes.data : [];
        setPages(list);
        applySettingsPayload(settingsRes.data || null);
        setThemes(Array.isArray(themesRes.data) ? themesRes.data : []);
      } catch {
        setErr("Failed to load the site.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [companyId, applySettingsPayload]);

  const ordered = useMemo(
    () => pages.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [pages]
  );

  useEffect(() => {
    // keep tab index in bounds if pages change
    if (tab > ordered.length - 1) setTab(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered.length]);

  const publish = async () => {
    setPublishing(true);
    try {
      const res = await wb.publish(companyId, true);
      applySettingsPayload(res);
    } catch {
      // no-op; show toast in real app
    } finally {
      setPublishing(false);
    }
  };

  const setTheme = async (themeId) => {
    try {
      const payload = { theme_id: themeId, is_live: settings?.is_live ?? false };
      const res = await wb.saveSettings(companyId, payload, { publish: false });
      applySettingsPayload(res);
    } catch {
      // toast error
    }
  };

  if (!companyId) {
    return <Alert severity="warning" sx={{ m: 2 }}>Login as a manager to edit your site.</Alert>;
  }

  if (loading) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (err) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{err}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h5" fontWeight={800}>
          Your Website
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {hasDraftChanges && (
            <Chip size="small" color="warning" label="Draft changes pending" />
          )}
          {lastPublishedLabel && (
            <Chip size="small" variant="outlined" label={lastPublishedLabel} />
          )}
          <Button
            size="small"
            startIcon={<BrushIcon />}
            onClick={() => {
              // pick next theme as a quick demo toggle
              if (!themes.length) return;
              const curr = settings?.theme?.id;
              const idx = Math.max(0, themes.findIndex((t) => t.id === curr));
              const next = themes[(idx + 1) % themes.length]?.id;
              if (next) setTheme(next);
            }}
          >
            Change Theme
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PublishIcon />}
            disabled={publishing}
            onClick={publish}
          >
            {publishing ? "Publishing…" : "Publish"}
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditorOpen(true)}
          >
            Edit Site
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {/* Page tabs */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
        >
          {ordered.map((p, i) => (
            <Tab key={p.id} label={p.menu_title || p.title || p.slug || `Page ${i + 1}`} />
          ))}
        </Tabs>
      </Paper>

      {/* Live, scaled preview */}
      <Paper
        sx={{
          p: 2,
          overflow: "auto",
          background: (t) => t.palette.background.default,
        }}
        variant="outlined"
      >
        {!current ? (
          <Alert severity="info">No page available.</Alert>
        ) : (
          <Box
            sx={{
              width: "100%",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Box
              sx={{
                width: 1200,
                maxWidth: "100%",
                transform: "scale(.90)",
                transformOrigin: "top center",
              }}
            >
              <RenderSections sections={current.content?.sections || []} />
            </Box>
          </Box>
        )}
      </Paper>

      {/* Full-screen Visual Builder */}
      <Dialog fullScreen open={editorOpen} onClose={() => setEditorOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }} fontWeight={800}>
            Visual Site Builder
          </Typography>
          <IconButton onClick={() => setEditorOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <VisualSiteBuilder />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
