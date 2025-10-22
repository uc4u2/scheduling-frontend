// src/pages/sections/management/LayoutTuningLab.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box,
  Grid,
  Stack,
  Button,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Divider,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DownloadIcon from "@mui/icons-material/Download";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import TabletMacIcon from "@mui/icons-material/TabletMac";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";

import SectionCard from "../../../components/ui/SectionCard";
import TabShell from "../../../components/ui/TabShell";
import { RenderSections } from "../../../components/website/RenderSections";

import LayoutLabProPanel, { LayoutLabOverlays } from "../../../components/website/LayoutLabProPanel";
import ThemeRuntimeProvider from "../../../components/website/ThemeRuntimeProvider";
import FloatingDockPanel from "../../../components/website/FloatingDockPanel";
import PreviewControlsOverlay from "../../../components/website/PreviewControlsOverlay";

import useCompanyId from "../../../hooks/useCompanyId";
import { wb } from "../../../utils/api";

/* ---------------------------------- Const --------------------------------- */
const LS_KEY = "layout_tuning_lab_v1";
const deviceWidths = { mobile: 390, tablet: 768, desktop: 1200 };

/** Keep layout mirrored in content.meta.layout (compat w/ VisualSiteBuilder) */
const withLiftedLayout = (p) => {
  const layout = p?.layout ?? p?.content?.meta?.layout ?? "boxed";
  const content = p?.content || {};
  const meta = content.meta || {};
  return { ...p, layout, content: { ...content, meta: { ...meta, layout } } };
};
const serializePage = (p) => {
  const content = p?.content || {};
  const meta = content.meta || {};
  const layout = p?.layout ?? meta.layout ?? "boxed";
  return { ...p, layout, content: { ...content, meta: { ...meta, layout } } };
};
const safeSections = (page) => page?.content?.sections || [];
/** Ensure every section has an id (stable across edits) */
const ensureSectionIds = (page) => {
  const sections = safeSections(page).map((s, i) =>
    s?.id ? s : { ...s, id: `${s?.type || "section"}-${i}-${Date.now()}` }
  );
  return withLiftedLayout({ ...page, content: { ...(page.content || {}), sections } });
};

/* ------------------------------ Main component ---------------------------- */
export default function LayoutTuningLab() {
  /* -------- manager/company context -------- */
  const detectedCompanyId = useCompanyId();
  const [companyId, setCompanyId] = useState(detectedCompanyId || "");
  useEffect(() => {
    if (detectedCompanyId && String(detectedCompanyId) !== String(companyId)) {
      setCompanyId(detectedCompanyId);
    }
  }, [detectedCompanyId]); // keep the header in sync so saves hit your company

  /* -------- live pages (so changes persist) -------- */
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState("");
  const [pageOverride, setPageOverride] = useState(null); // actual page we mutate & save

  const loadPages = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await wb.listPages(companyId);
      const items = (res?.data || []).map((p) => ensureSectionIds(withLiftedLayout(p)));
      setPages(items);
      if (!pageId && items.length) setPageId(String(items[0].id));
    } catch (e) {
      console.error("Load pages failed", e);
    }
  }, [companyId, pageId]);

  const loadLivePage = useCallback(async () => {
    if (!companyId || !pageId) return;
    try {
      const found = pages.find((p) => String(p.id) === String(pageId));
      if (found) {
        const lifted = ensureSectionIds(withLiftedLayout(found));
        setPageOverride(lifted);
        setSelectedIndex(-1);  // avoid “apply to selected” hitting the wrong section
      }
    } catch (e) {
      console.error("Load page failed", e);
    }
  }, [companyId, pageId, pages]);

  useEffect(() => { loadPages(); }, [loadPages]);

  /* -------- page-level knobs (used for preview + apply) -------- */
  const [layout, setLayout] = useState("boxed");          // boxed | full
  const [density, setDensity] = useState("standard");     // compact | standard | comfortable
  const [sectionSpacing, setSectionSpacing] = useState(6);

  const densityMap = useMemo(() => {
    if (density === "compact")     return { spacing: 4, defaultGutterX: 12 };
    if (density === "comfortable") return { spacing: 8, defaultGutterX: 24 };
    return { spacing: 6, defaultGutterX: 16 };
  }, [density]);

  /* -------- section-level knobs -------- */
  const [gutterX, setGutterX] = useState(16);
  const [bleedLeft, setBleedLeft] = useState(false);
  const [bleedRight, setBleedRight] = useState(false);

  const [heroHeight, setHeroHeight] = useState(80); // vh (0 = auto)
  const [safeTop, setSafeTop] = useState(true);
  const [contentMaxWidth, setContentMaxWidth] = useState("lg");

  const [maxWidthMapEnabled, setMaxWidthMapEnabled] = useState(true);

  /* -------- preview shell -------- */
  const [device, setDevice] = useState("desktop");
  const frameWidth = deviceWidths[device] || 1200;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [overlays, setOverlays] = useState({});
  const [themeOverrides, setThemeOverrides] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [dockSignal, setDockSignal] = useState(0);
  const previewRef = useRef(null);

  /* -------- local preset (for VisualSiteBuilder fallback) -------- */
  const payload = useMemo(() => ({
    layout, density, sectionSpacing, gutterX, bleedLeft, bleedRight,
    heroHeight, safeTop, contentMaxWidth, maxWidthMapEnabled, device
  }), [
    layout, density, sectionSpacing, gutterX, bleedLeft, bleedRight,
    heroHeight, safeTop, contentMaxWidth, maxWidthMapEnabled, device
  ]);

  const savePresetLocal = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(payload)); } catch {} };
  const loadPresetLocal = () => {
    try {
      const raw = localStorage.getItem(LS_KEY); if (!raw) return;
      const p = JSON.parse(raw) || {};
      setLayout(p.layout ?? "boxed");
      setDensity(p.density ?? "standard");
      setSectionSpacing(p.sectionSpacing ?? 6);
      setGutterX(p.gutterX ?? 16);
      setBleedLeft(!!p.bleedLeft); setBleedRight(!!p.bleedRight);
      setHeroHeight(p.heroHeight ?? 80); setSafeTop(!!p.safeTop);
      setContentMaxWidth(p.contentMaxWidth ?? "lg");
      setMaxWidthMapEnabled(!!p.maxWidthMapEnabled);
      setDevice(p.device ?? "desktop");
    } catch {}
  };
  useEffect(() => { if (localStorage.getItem(LS_KEY)) loadPresetLocal(); }, []);

  /* -------- backend preset (now merges + verifies round-trip) -------- */
  const [presetMsg, setPresetMsg] = useState("");
  const [presetErr, setPresetErr] = useState("");

  const savePresetBackend = async () => {
    setPresetMsg(""); setPresetErr("");
    if (!companyId) { setPresetErr("Sign in as a manager first."); return; }
    try {
      // 1) Read current settings so we don't clobber server fields
      const existing = await wb.getSettings(companyId).catch(() => null);
      const base = (existing?.data && typeof existing.data === "object") ? { ...existing.data } : {};

      // 2) Merge in our preset under multiple shapes for compatibility
      const merged = {
        ...base,
        layout_lab_preset: payload,
        settings: { ...(base.settings || {}), layout_lab_preset: payload },
        website:  { ...(base.website  || {}), layout_lab_preset: payload },
      };

      // 3) Save
      await wb.saveSettings(companyId, merged);

      // 4) Verify by reading back and checking presence
      const verify = await wb.getSettings(companyId);
      const root = verify?.data || {};
      const found =
        root.layout_lab_preset ||
        root.settings?.layout_lab_preset ||
        root.website?.layout_lab_preset ||
        null;

      if (!found) {
        setPresetErr("Saved, but server did not return the preset. Check backend settings mapping.");
        return;
      }

      // 5) Update local knobs with round-tripped values
      setLayout(found.layout ?? "boxed");
      setDensity(found.density ?? "standard");
      setSectionSpacing(found.sectionSpacing ?? 6);
      setGutterX(found.gutterX ?? 16);
      setBleedLeft(!!found.bleedLeft); setBleedRight(!!found.bleedRight);
      setHeroHeight(found.heroHeight ?? 80); setSafeTop(!!found.safeTop);
      setContentMaxWidth(found.contentMaxWidth ?? "lg");
      setMaxWidthMapEnabled(!!found.maxWidthMapEnabled);
      setPresetMsg("Preset saved to backend.");
      setPresetErr("");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save preset.";
      setPresetErr(msg);
    }
  };

  const loadPresetBackend = async (quiet = false) => {
    if (!companyId) { if (!quiet) setPresetErr("Sign in as a manager first."); return; }
    try {
      const s = await wb.getSettings(companyId);
      const root = s?.data || s || {};
      const p =
        root.layout_lab_preset ||
        root.settings?.layout_lab_preset ||
        root.website?.layout_lab_preset ||
        null;

      if (!p) {
        if (!quiet) setPresetErr("No backend preset found.");
        return;
      }

      setLayout(p.layout ?? "boxed");
      setDensity(p.density ?? "standard");
      setSectionSpacing(p.sectionSpacing ?? 6);
      setGutterX(p.gutterX ?? 16);
      setBleedLeft(!!p.bleedLeft); setBleedRight(!!p.bleedRight);
      setHeroHeight(p.heroHeight ?? 80); setSafeTop(!!p.safeTop);
      setContentMaxWidth(p.contentMaxWidth ?? "lg");
      setMaxWidthMapEnabled(!!p.maxWidthMapEnabled);
      setPresetMsg(quiet ? "" : "Preset loaded from backend.");
      setPresetErr("");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load preset.";
      if (!quiet) setPresetErr(msg);
    }
  };

  /* --- NEW: Save preset to backend and jump to Builder (auto-import flag in URL) --- */
  const savePresetAndOpenBuilder = async () => {
    // 1) save the Lab preset to backend (builder can import it)
    await savePresetBackend();

    // 2) if you loaded a live page in the Lab and edited it, persist those mutations too
    try {
      if (pageOverride?.id) {
        await onSavePageToBackend();
      }
    } catch (e) {
      // non-fatal; preset import will still work
      console.warn("Save page during Save&Open failed (non-fatal):", e?.message || e);
    }

    // 3) jump to the builder and ask it to auto-import once
    window.location.assign("/manage/website/builder?importLabPresetOnce=1");
  };

  /* -------- assemble demo sections for preview when no live page is loaded -------- */
  const sectionsFromKnobs = useMemo(() => {
    const heroProps = {
      eyebrow: "Enterprise Ready",
      heading: "Dial in your layout",
      subheading:
        "Gutters, spacing, selective bleed, responsive max widths, and hero safe-area — try them live.",
      ctaText: "Primary action",
      secondaryCtaText: "Secondary",
      overlay: 0.35,
      overlayGradient:
        "linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,.55) 100%)",
      backgroundUrl:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1600&auto=format&fit=crop",
      backgroundPosition: "50% 35%",
      align: "left",
      heroHeight, safeTop, contentMaxWidth,
      maxWidth: layout === "full" ? false : "lg",
      gutterX: gutterX || densityMap.defaultGutterX,
      bleedLeft, bleedRight,
    };

    const galleryProps = {
      title: "Image carousel (responsive width demo)",
      images: [
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1600&auto=format&fit=crop",
      ],
      autoplay: true,
      gutterX: gutterX || densityMap.defaultGutterX,
      bleedLeft, bleedRight,
      maxWidthMap: maxWidthMapEnabled ? { xs: "md", md: "lg", xl: false } : undefined,
      maxWidth: !maxWidthMapEnabled ? (layout === "full" ? false : "lg") : undefined,
    };

    return [
      { type: "hero", props: heroProps },
      { type: "galleryCarousel", props: galleryProps },
      {
        type: "richText",
        props: {
          title: "What these knobs do",
          body:
            `<ul>
               <li><b>Gutters</b> add inner horizontal padding to keep text comfy while images can still bleed.</li>
               <li><b>Section spacing</b> is the vertical rhythm between blocks.</li>
               <li><b>Selective bleed</b> lets media touch the page edges.</li>
               <li><b>Hero height</b> uses viewport units; safe-top respects device notches.</li>
               <li><b>Density presets</b> bundle spacing + gutter values.</li>
               <li><b>Breakpoint width map</b> flips boxed ↔ full at chosen breakpoints.</li>
             </ul>`,
          gutterX: gutterX || densityMap.defaultGutterX,
          maxWidth: layout === "full" ? false : "md",
        },
      },
    ];
  }, [layout, gutterX, bleedLeft, bleedRight, heroHeight, safeTop, contentMaxWidth, densityMap, maxWidthMapEnabled]);

  const pageFromKnobs = useMemo(
    () => ({
      layout,
      content: {
        meta: {
          layout,
          sectionSpacing: densityMap.spacing ?? sectionSpacing,
          defaultGutterX: densityMap.defaultGutterX,
        },
        sections: sectionsFromKnobs,
      },
    }),
    [layout, densityMap, sectionSpacing, sectionsFromKnobs]
  );

  /* if no live page loaded, preview the knobs page */
  const page = pageOverride || pageFromKnobs;

  /* --------------------------- "Apply" = mutate page --------------------------- */
  const [targetMode, setTargetMode] = useState("page"); // page | selected | all | type
  const [typeToApply, setTypeToApply] = useState("hero");

  const buildPropsPatch = (type) => {
    const base = {
      gutterX: gutterX || densityMap.defaultGutterX,
      bleedLeft, bleedRight,
    };
    if (type === "hero") {
      base.heroHeight = heroHeight;
      base.safeTop = safeTop;
      base.contentMaxWidth = contentMaxWidth;
    }
    return base;
  };

  const applyToPageMeta = useCallback(() => {
    setPageOverride((cur) => {
      const content = cur?.content || {};
      const meta = content.meta || {};
      return withLiftedLayout({
        ...(cur || { content: {} }),
        layout,
        content: {
          ...content,
          meta: {
            ...meta,
            layout,
            sectionSpacing: densityMap.spacing ?? sectionSpacing,
            defaultGutterX: densityMap.defaultGutterX,
          },
        },
      });
    });
  }, [layout, densityMap, sectionSpacing]);

  const applyToSelected = useCallback(() => {
    if (selectedIndex < 0) return;
    setPageOverride((cur) => {
      const arr = [...safeSections(cur)];
      const s = { ...(arr[selectedIndex] || {}) };
      s.props = { ...(s.props || {}), ...buildPropsPatch(s.type) };
      arr[selectedIndex] = s;
      return withLiftedLayout({ ...(cur || {}), content: { ...(cur?.content || {}), sections: arr } });
    });
  }, [selectedIndex, gutterX, bleedLeft, bleedRight, heroHeight, safeTop, contentMaxWidth, densityMap]);

  const applyToAll = useCallback(() => {
    setPageOverride((cur) => {
      const arr = safeSections(cur).map((s) => {
        const next = { ...s, props: { ...(s.props || {}), ...buildPropsPatch(s.type) } };
        return next;
      });
      return withLiftedLayout({ ...(cur || {}), content: { ...(cur?.content || {}), sections: arr } });
    });
  }, [gutterX, bleedLeft, bleedRight, heroHeight, safeTop, contentMaxWidth, densityMap]);

  const applyToType = useCallback(() => {
    setPageOverride((cur) => {
      const arr = safeSections(cur).map((s) =>
        s.type === typeToApply
          ? { ...s, props: { ...(s.props || {}), ...buildPropsPatch(s.type) } }
          : s
      );
      return withLiftedLayout({ ...(cur || {}), content: { ...(cur?.content || {}), sections: arr } });
    });
  }, [typeToApply, gutterX, bleedLeft, bleedRight, heroHeight, safeTop, contentMaxWidth, densityMap]);

  /* ---------- keep the in-memory list in sync after a save ---------- */
  const syncSavedPageIntoList = useCallback((saved) => {
    setPages((prev) => {
      if (!Array.isArray(prev) || !saved?.id) return prev;
      const idx = prev.findIndex((p) => String(p.id) === String(saved.id));
      if (idx === -1) return [saved, ...prev];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  }, []);

  /* ------------------------------- Save & publish ------------------------------ */
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  const onSavePageToBackend = async () => {
    setSaveMsg(""); setSaveErr("");
    if (!companyId) { setSaveErr("Sign in as a manager first."); return; }
    if (!pageOverride?.id) { setSaveErr("Load a live page first."); return; }
    setSaving(true);
    try {
      const payload = serializePage(ensureSectionIds(pageOverride));
      const res = await wb.updatePage(companyId, payload.id, payload);
      const saved = ensureSectionIds(withLiftedLayout(res?.data || payload));
      setPageOverride(saved);
      syncSavedPageIntoList(saved);
      setSaveMsg("Page saved.");
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || "Failed to save page.";
      setSaveErr(msg);
    } finally {
      setSaving(false);
    }
  };

  const onSaveThemeOverrides = async () => {
    setSaveMsg(""); setSaveErr("");
    if (!companyId) { setSaveErr("Sign in as a manager first."); return; }
    if (!themeOverrides) { setSaveErr("No theme changes to save."); return; }
    setSaving(true);
    try {
      await wb.saveSettings(companyId, { theme_overrides: themeOverrides });
      setSaveMsg("Theme overrides saved.");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save theme.";
      setSaveErr(msg);
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async () => {
    setSaveMsg(""); setSaveErr("");
    if (!companyId) { setSaveErr("Sign in as a manager first."); return; }
    setSaving(true);
    try {
      await onSavePageToBackend();
      await wb.publish(companyId, true);
      setSaveMsg("Published.");
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Publish failed.";
      setSaveErr(msg);
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------- UI cards -------------------------------- */
  const LoadLivePageCard = (
    <SectionCard
      title="Load live page"
      description="Pick a real page to edit. Your changes will be saved to this page."
      actions={
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={loadPages}>Refresh list</Button>
          <Button size="small" variant="contained" onClick={loadLivePage} disabled={!pageId || !pages.length}>
            Load into Lab
          </Button>
        </Stack>
      }
    >
      <Select
        size="small"
        fullWidth
        value={pageId}
        onChange={(e) => setPageId(String(e.target.value))}
        displayEmpty
      >
        {pages.map((p) => (
          <MenuItem key={p.id} value={String(p.id)}>
            {p.title || p.slug || p.id}
          </MenuItem>
        ))}
      </Select>
      {pageOverride?.id && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          Editing: <b>{pageOverride.title || pageOverride.slug || pageOverride.id}</b>
        </Typography>
      )}
    </SectionCard>
  );

  const Controls = (
    <SectionCard
      title="Quick actions"
      actions={
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {/* Local preset (legacy fallback for Builder import) */}
          <Tooltip title="Save preset locally (legacy)"><span>
            <Button size="small" startIcon={<SaveIcon />} variant="contained" onClick={savePresetLocal}>Save (local)</Button>
          </span></Tooltip>
          <Tooltip title="Load preset from local storage"><span>
            <Button size="small" startIcon={<DownloadIcon />} variant="outlined" onClick={loadPresetLocal}>Load (local)</Button>
          </span></Tooltip>

          {/* Backend preset — merges + verifies */}
          <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />
          <Tooltip title="Save preset to backend so Builder can import it"><span>
            <Button size="small" startIcon={<SaveIcon />} variant="contained" color="secondary" onClick={savePresetBackend}>
              Save preset (backend)
            </Button>
          </span></Tooltip>

          {/* NEW: one-click flow to Builder with fresh preset */}
          <Tooltip title="Save preset, then open Builder and auto-import it"><span>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={savePresetAndOpenBuilder}
            >
              Save & Open in Builder
            </Button>
          </span></Tooltip>

          <Tooltip title="Load preset from backend"><span>
            <Button size="small" startIcon={<DownloadIcon />} variant="outlined" color="secondary" onClick={() => loadPresetBackend(false)}>
              Load preset (backend)
            </Button>
          </span></Tooltip>

          {/* Page + theme persistence */}
          <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />
          <Button size="small" variant="outlined" onClick={onSavePageToBackend}>Save to page</Button>
          <Button size="small" variant="outlined" onClick={onSaveThemeOverrides}>Save theme</Button>
          <Button size="small" variant="contained" onClick={onPublish}>Publish</Button>
        </Stack>
      }
    >
      {(presetMsg || presetErr) && (
        <Box sx={{ mb: 2 }}>
          {presetMsg && <Alert severity="success">{presetMsg}</Alert>}
          {presetErr && <Alert severity="error">{presetErr}</Alert>}
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Page layout" description="Global width baseline for this page">
            <Stack spacing={1}>
              <ToggleButtonGroup exclusive size="small" value={layout} onChange={(_, v) => v && setLayout(v)}>
                <ToggleButton value="boxed">Boxed</ToggleButton>
                <ToggleButton value="full">Full-bleed</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary">
                “Full-bleed” makes the whole page edge-to-edge; individual sections can still be boxed.
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard title="Density preset" description="Bundles spacing + default gutters">
            <ToggleButtonGroup exclusive size="small" value={density} onChange={(_, v) => v && setDensity(v)}>
              <ToggleButton value="compact">Compact</ToggleButton>
              <ToggleButton value="standard">Standard</ToggleButton>
              <ToggleButton value="comfortable">Comfortable</ToggleButton>
            </ToggleButtonGroup>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Section spacing" description="Vertical rhythm between blocks">
            <Stack direction="row" spacing={2} alignItems="center">
              <Slider min={2} max={12} step={1} value={sectionSpacing} onChange={(_, v) => setSectionSpacing(v)} sx={{ flex: 1 }} />
              <Typography width={40} align="right">{sectionSpacing}</Typography>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard title="Per-section gutters" description="Inner horizontal padding (px)">
            <Stack direction="row" spacing={2} alignItems="center">
              <Slider min={0} max={64} step={2} value={gutterX} onChange={(_, v) => setGutterX(v)} sx={{ flex: 1 }} />
              <Typography width={56} align="right">{gutterX}px</Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <FormControlLabel control={<Switch checked={bleedLeft} onChange={(_, v) => setBleedLeft(v)} />} label="Bleed left" />
              <FormControlLabel control={<Switch checked={bleedRight} onChange={(_, v) => setBleedRight(v)} />} label="Bleed right" />
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <SectionCard title="Hero controls" description="Viewport height + safe areas">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Height (vh, 0 = auto)</Typography>
                <Slider min={0} max={100} step={5} value={heroHeight} onChange={(_, v) => setHeroHeight(v)} />
                <Typography variant="caption" color="text.secondary">
                  {heroHeight ? `${heroHeight}vh` : "auto"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel control={<Switch checked={safeTop} onChange={(_, v) => setSafeTop(v)} />} label="Respect safe-area (top notch)" />
                <Typography variant="body2" sx={{ mt: 2, mb: 0.5 }}>Inner content maxWidth</Typography>
                <Select fullWidth size="small" value={contentMaxWidth} onChange={(e) => setContentMaxWidth(e.target.value)}>
                  {["sm", "md", "lg", "xl", false].map((v) => (
                    <MenuItem key={String(v)} value={v}>{v === false ? "Full" : v}</MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <SectionCard title="Breakpoint width map (demo)" description="Boxed on small, full on XL">
            <FormControlLabel
              control={<Switch checked={maxWidthMapEnabled} onChange={(_, v) => setMaxWidthMapEnabled(v)} />}
              label="Enable responsive width map"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              When on, the carousel section uses <code>{`{ xs:"md", md:"lg", xl:false }`}</code>.
            </Typography>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        title="Apply to"
        description="Choose a target and push the current knobs into your live page object."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" onClick={applyToPageMeta} disabled={!pageOverride}>Apply → Page meta</Button>
            <Button size="small" onClick={applyToSelected} disabled={!pageOverride || selectedIndex < 0}>Apply → Selected section</Button>
            <Button size="small" onClick={applyToAll} disabled={!pageOverride}>Apply → All sections</Button>
            <Button size="small" onClick={applyToType} disabled={!pageOverride}>Apply → All of type</Button>
            {/* Convenience: Apply + Save */}
            <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />
            <Button
              size="small"
              onClick={async () => { applyToPageMeta(); await onSavePageToBackend(); }}
              disabled={!pageOverride}
            >
              Apply Page Meta + Save
            </Button>
            <Button
              size="small"
              onClick={async () => { applyToAll(); await onSavePageToBackend(); }}
              disabled={!pageOverride}
            >
              Apply All Sections + Save
            </Button>
          </Stack>
        }
      >
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup exclusive size="small" value={targetMode} onChange={(_, v) => v && setTargetMode(v)}>
            <ToggleButton value="page">Page meta</ToggleButton>
            <ToggleButton value="selected">Selected section</ToggleButton>
            <ToggleButton value="all">All sections</ToggleButton>
            <ToggleButton value="type">All of type</ToggleButton>
          </ToggleButtonGroup>

          {targetMode === "type" && (
            <Select size="small" value={typeToApply} onChange={(e) => setTypeToApply(e.target.value)}>
              {["hero", "galleryCarousel", "gallery", "serviceGrid", "richText", "text"].map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          )}
          {selectedIndex < 0 && targetMode === "selected" && (
            <Typography variant="caption" color="text.secondary">Pick a section below (click a chip in preview).</Typography>
          )}
        </Stack>
      </SectionCard>

      {(saveMsg || saveErr) && (
        <Box sx={{ mt: 1 }}>
          {saveMsg && <Alert severity="success">{saveMsg}</Alert>}
          {saveErr && <Alert severity="error">{saveErr}</Alert>}
        </Box>
      )}
    </SectionCard>
  );

  const SectionPicker = (
    <SectionCard title="Sections on this page" description="Click a chip in the preview to select a section, or choose here.">
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {(page?.content?.sections || []).map((s, i) => (
          <Button key={s.id || i} size="small" variant={selectedIndex === i ? "contained" : "outlined"} onClick={() => setSelectedIndex(i)}>
            #{i + 1} · {s.type}
          </Button>
        ))}
        {!page?.content?.sections?.length && (
          <Typography variant="body2" color="text.secondary">No sections.</Typography>
        )}
      </Stack>
    </SectionCard>
  );

  const TuningPanel = (
    <FloatingDockPanel title="Layout tuning" initialMode="right" forceOpenSignal={dockSignal} anchorRef={previewRef}>
      <LayoutLabProPanel
        page={page}
        onChange={setPageOverride}
        selectedIndex={selectedIndex}
        onOverlaysChange={setOverlays}
        onThemeOverridesChange={setThemeOverrides}
      />
    </FloatingDockPanel>
  );

  const PreviewCard = (
    <SectionCard
      title="Preview"
      description="Rendered via RenderSections. Use the device toggle to simulate widths."
      actions={
        <Stack direction="row" spacing={1}>
          <ToggleButtonGroup exclusive size="small" value={device} onChange={(_, v) => v && setDevice(v)}>
            <ToggleButton value="mobile"><PhoneIphoneIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="tablet"><TabletMacIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="desktop"><DesktopWindowsIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          <Button size="small" startIcon={<FullscreenIcon />} onClick={() => setPreviewOpen(true)}>
            Full-screen Preview
          </Button>
        </Stack>
      }
    >
      <Box
        sx={{
          p: { xs: 1.5, md: 3 },
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
          borderRadius: 2,
          border: (t) => `1px dashed ${t.palette.divider}`,
        }}
      >
        <Box sx={{ display: "grid", placeItems: "center" }}>
          <Box
            sx={{
              width: frameWidth, maxWidth: "100%", bgcolor: "background.paper",
              borderRadius: 2, boxShadow: 3, overflow: "hidden",
              border: (t) => `1px solid ${t.palette.divider}`,
              transform: `scale(${zoom})`, transformOrigin: "top center",
            }}
          >
            <Box sx={{ position: "relative" }} ref={previewRef}>
              <PreviewControlsOverlay
                overlays={overlays}
                onOverlaysChange={setOverlays}
                zoom={zoom}
                onZoomChange={setZoom}
                device="responsive"
                onDeviceChange={() => {}}
                onOpenPanel={() => setDockSignal((n) => n + 1)}
              />
              <ThemeRuntimeProvider overrides={themeOverrides}>
                <RenderSections
                  sections={page?.content?.sections || []}
                  layout={page?.layout || page?.content?.meta?.layout || layout}
                  sectionSpacing={page?.content?.meta?.sectionSpacing ?? (densityMap.spacing ?? sectionSpacing)}
                  defaultGutterX={page?.content?.meta?.defaultGutterX ?? densityMap.defaultGutterX}
                />
              </ThemeRuntimeProvider>
              <LayoutLabOverlays overlays={overlays} />
            </Box>
          </Box>
        </Box>
      </Box>
    </SectionCard>
  );

  const tabs = [
    {
      label: "Playground",
      content: (
        <>
          {TuningPanel}
          <Stack spacing={2}>
            {LoadLivePageCard}
            {Controls}
            {SectionPicker}
            {PreviewCard}
          </Stack>
        </>
      ),
    },
  ];

  return (
    <>
      <TabShell title="Layout Tuning Lab" description="Sandbox for width, spacing, and hero polish" tabs={tabs} defaultIndex={0} />

      {/* Full-screen preview dialog */}
      <Dialog fullScreen open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <DialogTitle sx={{ pr: 6 }}>
          Full-screen Preview
          <IconButton onClick={() => setPreviewOpen(false)} sx={{ position: "absolute", right: 12, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: (t) => t.palette.background.default }}>
          <Box sx={{ display: "grid", placeItems: "center", py: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <ToggleButtonGroup exclusive size="small" value={device} onChange={(_, v) => v && setDevice(v)}>
                <ToggleButton value="mobile"><PhoneIphoneIcon fontSize="small" /></ToggleButton>
                <ToggleButton value="tablet"><TabletMacIcon fontSize="small" /></ToggleButton>
                <ToggleButton value="desktop"><DesktopWindowsIcon fontSize="small" /></ToggleButton>
              </ToggleButtonGroup>
              <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />
              <Button startIcon={<SaveIcon />} onClick={savePresetLocal}>Save (local)</Button>
              <Button startIcon={<DownloadIcon />} onClick={loadPresetLocal}>Load (local)</Button>
              <Button startIcon={<RestartAltIcon />} onClick={() => {
                setLayout("boxed"); setDensity("standard"); setSectionSpacing(6);
                setGutterX(16); setBleedLeft(false); setBleedRight(false);
                setHeroHeight(80); setSafeTop(true); setContentMaxWidth("lg");
                setMaxWidthMapEnabled(true); setDevice("desktop");
              }}>Reset</Button>
            </Stack>

            <Box
              sx={{
                width: deviceWidths[device] || 1200, maxWidth: "100%", bgcolor: "background.paper",
                borderRadius: 2, boxShadow: 6, overflow: "hidden",
                border: (t) => `1px solid ${t.palette.divider}`,
                transform: `scale(${zoom})`, transformOrigin: "top center",
              }}
            >
              <Box sx={{ position: "relative" }} ref={previewRef}>
                <PreviewControlsOverlay
                  overlays={overlays}
                  onOverlaysChange={setOverlays}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  device="responsive"
                  onDeviceChange={() => {}}
                  onOpenPanel={() => setDockSignal((n) => n + 1)}
                />
                <ThemeRuntimeProvider overrides={themeOverrides}>
                  <RenderSections
                    sections={page?.content?.sections || []}
                    layout={page?.layout || page?.content?.meta?.layout || layout}
                    sectionSpacing={page?.content?.meta?.sectionSpacing ?? (densityMap.spacing ?? sectionSpacing)}
                    defaultGutterX={page?.content?.meta?.defaultGutterX ?? densityMap.defaultGutterX}
                  />
                </ThemeRuntimeProvider>
                <LayoutLabOverlays overlays={overlays} />
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
