// src/pages/sections/management/VisualSiteBuilder.js

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useDeferredValue,
  useRef,
} from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,               // NEW for PageStyleCard
  CardContent,        // NEW for PageStyleCard
 Slider, InputAdornment } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import PublishIcon from "@mui/icons-material/Publish";
import RefreshIcon from "@mui/icons-material/Refresh";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import BrushIcon from "@mui/icons-material/Brush";
import ViewCarouselIcon from "@mui/icons-material/ViewCarousel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"; // NEW
import PaletteIcon from "@mui/icons-material/Palette";

import { nanoid } from "nanoid";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { useTranslation, Trans } from "react-i18next";

import { wb } from "../../../utils/api";
import { RenderSections } from "../../../components/website/RenderSections";
import useCompanyId from "../../../hooks/useCompanyId";
import useHistory from "../../../hooks/useHistory";
 //import WebsiteNavSettingsCard from "../../../components/website/WebsiteNavSettingsCard";

/** Floating + Inline inspectors and schema registry */
import {
  FloatingInspector,
  useFloatingInspector,
} from "../../../components/website/FloatingInspector";
import { InlineStickyInspector } from "../../../components/website/InlineStickyInspector";
import { SCHEMA_REGISTRY } from "../../../components/website/schemas";
import SchemaInspector from "../../../components/website/SchemaInspector";

/** Moved out pieces */
import SectionInspector, { ImageField } from "../../../components/website/BuilderInspectorParts"; // ImageField NEW
import { NEW_BLOCKS } from "../../../components/website/BuilderBlockTemplates";
import {
  emptyPage,
  normalizePage,
  safeSections,
} from "../../../components/website/BuilderPageUtils";

/** Theme designer (drawer content) */
import ThemeDesigner from "../../../components/website/ThemeDesigner";

/** UI wrappers per design system */
import SectionCard from "../../../components/ui/SectionCard";
import TabShell from "../../../components/ui/TabShell";

/** Enterprise “Easy” panel – default export only */
 //import EnterpriseEditorExtras from "../../../components/website/EnterpriseEditorExtras";

import WebsiteBuilderHelpDrawer from "./WebsiteBuilderHelpDrawer"; // NEW
/** Local shims so the app renders even if helpers aren’t exported yet */
const ThemeRuntimeProvider = ({ overrides, children }) => <>{children}</>;
const ThemePalettePanel = ({
  value,
  onChange,
  onSave,
  saving,
  message,
  error,
}) => null;

/* ---------- Constants ---------- */
const LAB_LS_KEY = "layout_tuning_lab_v1";

/* ---------- Small utils ---------- */

// --- PageStyle (SECTION-BASED) helpers ---
const nanoOrShortId = () =>
  (typeof nanoid === "function" ? nanoid(8) : Math.random().toString(36).slice(2, 10));

const findPageStyleBlock = (page) =>
  (page?.content?.sections || []).find((s) => s?.type === "pageStyle");

const readPageStyleProps = (page) => {
  const blk = findPageStyleBlock(page);
  return blk?.props ? JSON.parse(JSON.stringify(blk.props)) : null;
};

const writePageStyleProps = (page, props) => {
  const next = JSON.parse(JSON.stringify(page || {}));
  const sections = Array.isArray(next?.content?.sections) ? [...next.content.sections] : [];
  const idx = sections.findIndex((s) => s?.type === "pageStyle");
  const id = idx >= 0 && sections[idx]?.id ? sections[idx].id : nanoOrShortId();
  const block = { id, type: "pageStyle", props: { ...props }, sx: sections[idx]?.sx || { py: 0 } };
  if (idx >= 0) sections[idx] = block; else sections.unshift(block);
  next.content = { ...(next.content || {}), sections };
  return next;
};


const safeUid = () => Math.random().toString(36).slice(2, 10);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ---------- Helpers: layout compat shim ---------- */
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

const ensureSectionIds = (page) => {
  const sections = safeSections(page).map((s) =>
    s?.id ? s : { ...s, id: uid() }
  );
  return withLiftedLayout({
    ...page,
    content: { ...(page.content || {}), sections },
  });
};


/** Deep clone + scrub linkages */
function makeIndependentClone(src) {
  const clone = JSON.parse(JSON.stringify(src || {}));
  clone.id = safeUid();
  clone.props = { ...(clone.props || {}) };
  delete clone.props?.bindId;
  delete clone.props?.blockId;
  delete clone.props?.sectionId;
  delete clone.props?.anchor;
  if (clone.props?.dataSource) {
    const { url, pick } = clone.props.dataSource;
    clone.props.dataSource = { url, pick };
  }
  delete clone.runtime;
  delete clone._cache;
  return clone;
}

/* ---------- PageStyle defaults (NEW) ---------- */
const defaultPageStyleBlock = () => ({
  id: nanoid(8),
  type: "pageStyle",
  props: {
    backgroundColor: "#f6f7fb",
    backgroundImage: "",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    overlayColor: "#000000",
    overlayOpacity: 0,
    contentMaxWidth: "lg",
    gutterX: 24,
  },
  sx: { py: 0 },
});

/* ---------- CSS VARS helper for page-level style (NEW) ---------- */
/* ---------- CSS VARS helper for page-level style (final) ---------- */
function styleToCssVars(style = {}) {
  // Card bg supports color + opacity (handles #rrggbb); falls back to given value.
  const hexToRgba = (hex, alpha = 1) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
    if (!m) return hex; // not a 6-digit hex
    const r = parseInt(m[1], 16);
    const g = parseInt(m[2], 16);
    const b = parseInt(m[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const cardColor   = style.cardColor || style.cardBg || "rgba(255,255,255,1)";
  const cardOpacity = Number.isFinite(style.cardOpacity) ? style.cardOpacity : 1;
  const cardBgValue =
    cardColor.startsWith("#") ? hexToRgba(cardColor, cardOpacity) : cardColor;

  return {
    // colors + fonts
    "--page-heading-color": style.headingColor || "inherit",
    "--page-body-color": style.bodyColor || "inherit",
    "--page-link-color": style.linkColor || "var(--sched-primary)",
    "--page-heading-font": style.headingFont || "inherit",
    "--page-body-font": style.bodyFont || "inherit",

    // hero hooks
    "--page-hero-text-color": style.bodyColor || "inherit",
    "--page-hero-heading-color": style.headingColor || "inherit",
    "--page-hero-heading-font": style.headingFont || "inherit",
    "--page-hero-body-font": style.bodyFont || "inherit",
    "--page-hero-heading-shadow":
      style.heroHeadingShadow || "0 2px 24px rgba(0,0,0,.25)",

    // cards
    "--page-card-bg": cardBgValue,
    "--page-card-radius": (style.cardRadius ?? 12) + "px",

    // NEW — buttons
    "--page-btn-bg": style.btnBg || "var(--sched-primary)",
    "--page-btn-color": style.btnColor || "#fff",
    "--page-btn-radius": (style.btnRadius ?? 10) + "px",

    // background image opacity
    "--page-bg-image-opacity": String(
      style.backgroundImageOpacity == null
        ? 1
        : style.backgroundImageOpacity
    ),
  };
}


/* ---------- PageStyleCard (inline helper) — mounted in Inspector (NEW) ---------- */
/* ---------- PageStyleCard (inline helper) — Inspector card (final) ---------- */
function PageStyleCard({
  value,
  onChange,
  onPickImage,
  applyToAll,
  onToggleApplyToAll,
  onApplyNow,
  onOpenAdvanced,
  companyId,
}) {
  const { t } = useTranslation();

  const clamp01 = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(1, num));
  };
  const toHexByte = (n) =>
    Math.max(0, Math.min(255, Math.round(Number(n) || 0)))
      .toString(16)
      .padStart(2, "0");
  const normalizeHexColor = (hex) => {
    if (typeof hex !== "string") return "";
    let s = hex.trim();
    if (!s) return "";
    if (!s.startsWith("#")) return s;
    let h = s.slice(1);
    if (h.length === 3) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    } else if (h.length === 4) {
      h = h
        .slice(0, 3)
        .split("")
        .map((c) => c + c)
        .join("");
    } else if (h.length === 8) {
      h = h.slice(0, 6);
    }
    if (h.length < 6) h = h.padEnd(6, "0");
    return `#${h.toLowerCase()}`;
  };
  const hexToRgba = (hex, opacity = 1) => {
    const norm = normalizeHexColor(hex);
    if (!norm || !norm.startsWith("#")) return norm || "";
    const h = norm.slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${clamp01(opacity)})`;
  };
  const parseCssColor = (css, fallbackOpacity = 1) => {
    const base = { hex: "#ffffff", opacity: clamp01(fallbackOpacity) };
    if (!css || typeof css !== "string") return base;
    const str = css.trim();
    if (!str) return base;
    if (str.toLowerCase() === "transparent") {
      return { hex: "#000000", opacity: 0 };
    }
    const rgba = /^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)$/i.exec(str);
    if (rgba) {
      const r = Number(rgba[1]);
      const g = Number(rgba[2]);
      const b = Number(rgba[3]);
      const a = rgba[4] != null ? parseFloat(rgba[4]) : base.opacity;
      return {
        hex: `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`,
        opacity: clamp01(a),
      };
    }
    if (str.startsWith("#")) {
      const raw = str.slice(1);
      let alpha = base.opacity;
      if (raw.length === 4) {
        alpha = parseInt(raw[3] + raw[3], 16) / 255;
      } else if (raw.length === 8) {
        alpha = parseInt(raw.slice(6, 8), 16) / 255;
      }
      return { hex: normalizeHexColor(str), opacity: clamp01(alpha) };
    }
    return base;
  };

  const v = value || {};
  const initialCard = parseCssColor(v.cardColor || v.cardBg || null, v.cardOpacity ?? 1);
  const cardColorInput = normalizeHexColor(v.cardColor || initialCard.hex) || "#ffffff";
  const cardOpacityInput =
    v.cardOpacity != null ? clamp01(v.cardOpacity) : initialCard.opacity;
  const set = (patch) => onChange?.({ ...(v || {}), ...patch });
  const applyCardValues = (color, opacity) => {
    if (!onChange) return;
    const normalized = normalizeHexColor(color);
    const finalOpacity = clamp01(opacity);
    onChange({
      ...(v || {}),
      cardColor: normalized,
      cardOpacity: finalOpacity,
      cardBg: normalized ? hexToRgba(normalized, finalOpacity) : "",
    });
  };
  const handleCardColor = (event) =>
    applyCardValues(event.target.value || cardColorInput, cardOpacityInput);
  const handleCardOpacity = (event) => {
    const raw = event.target.value;
    const num = Number(raw);
    const nextOpacity = Number.isFinite(num) ? num : cardOpacityInput;
    applyCardValues(v.cardColor || cardColorInput, nextOpacity);
  };

  return (
  <SectionCard
    title={t("manager.visualBuilder.pageStyle.title")}
    description={t("manager.visualBuilder.pageStyle.description")}
    id="page-style-card"
  >
    <Stack spacing={1.25}>
      {/* Background */}
      <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.background.heading")}</Typography>
      <TextField
        size="small"
        type="color"
        label={t("manager.visualBuilder.pageStyle.background.color")}
        value={v.backgroundColor || "#ffffff"}
        onChange={(e) => set({ backgroundColor: e.target.value })}
        fullWidth
      />

      {/* NOTE: Background image picker removed */}

      <Stack direction="row" spacing={1}>
        <Select
          size="small"
          value={v.backgroundRepeat || "no-repeat"}
          onChange={(e) => set({ backgroundRepeat: e.target.value })}
          fullWidth
        >
          <MenuItem value="no-repeat">{t("manager.visualBuilder.pageStyle.background.repeat.noRepeat")}</MenuItem>
          <MenuItem value="repeat">{t("manager.visualBuilder.pageStyle.background.repeat.repeat")}</MenuItem>
          <MenuItem value="repeat-x">{t("manager.visualBuilder.pageStyle.background.repeat.repeatX")}</MenuItem>
          <MenuItem value="repeat-y">{t("manager.visualBuilder.pageStyle.background.repeat.repeatY")}</MenuItem>
        </Select>
        <Select
          size="small"
          value={v.backgroundSize || "cover"}
          onChange={(e) => set({ backgroundSize: e.target.value })}
          fullWidth
        >
          <MenuItem value="cover">{t("manager.visualBuilder.pageStyle.background.size.cover")}</MenuItem>
          <MenuItem value="contain">{t("manager.visualBuilder.pageStyle.background.size.contain")}</MenuItem>
          <MenuItem value="auto">{t("manager.visualBuilder.pageStyle.background.size.auto")}</MenuItem>
        </Select>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Select
          size="small"
          value={v.backgroundPosition || "center"}
          onChange={(e) => set({ backgroundPosition: e.target.value })}
          fullWidth
        >
          <MenuItem value="center">{t("manager.visualBuilder.pageStyle.background.position.center")}</MenuItem>
          <MenuItem value="top">{t("manager.visualBuilder.pageStyle.background.position.top")}</MenuItem>
          <MenuItem value="bottom">{t("manager.visualBuilder.pageStyle.background.position.bottom")}</MenuItem>
          <MenuItem value="left">{t("manager.visualBuilder.pageStyle.background.position.left")}</MenuItem>
          <MenuItem value="right">{t("manager.visualBuilder.pageStyle.background.position.right")}</MenuItem>
        </Select>
        <Select
          size="small"
          value={v.backgroundAttachment || "scroll"}
          onChange={(e) => set({ backgroundAttachment: e.target.value })}
          fullWidth
        >
          <MenuItem value="scroll">{t("manager.visualBuilder.pageStyle.background.attachment.scroll")}</MenuItem>
          <MenuItem value="fixed">{t("manager.visualBuilder.pageStyle.background.attachment.fixed")}</MenuItem>
        </Select>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          type="color"
          label={t("manager.visualBuilder.pageStyle.background.overlayColor")}
          value={v.overlayColor || "#000000"}
          onChange={(e) => set({ overlayColor: e.target.value })}
          fullWidth
        />
        <TextField
          size="small"
          label={t("manager.visualBuilder.pageStyle.background.overlayOpacity")}
          type="number"
          value={v.overlayOpacity ?? 0}
          onChange={(e) =>
            set({
              overlayOpacity: Math.max(0, Math.min(1, Number(e.target.value || 0))),
            })
          }
          fullWidth
        />
      </Stack>

      {/* NOTE: Typography group removed */}

      {/* Card / Box styling */}
      <Typography variant="subtitle2" sx={{ mt: 1 }}>{t("manager.visualBuilder.pageStyle.card.heading")}</Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          type="color"
          label={t("manager.visualBuilder.pageStyle.card.backgroundColor")}
          value={cardColorInput}
          onChange={handleCardColor}
          fullWidth
        />
        <TextField
          size="small"
          label={t("manager.visualBuilder.pageStyle.card.opacity")}
          type="number"
          value={cardOpacityInput}
          onChange={handleCardOpacity}
          inputProps={{ step: 0.05, min: 0, max: 1 }}
          fullWidth
        />
      </Stack>
            <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          label={t("manager.visualBuilder.pageStyle.card.radius")}
          type="number"
          value={v.cardRadius ?? 12}
          onChange={(e) => set({ cardRadius: Number(e.target.value || 0) })}
          fullWidth
        />
        <TextField
          size="small"
          label={t("manager.visualBuilder.pageStyle.card.blur")}
          type="number"
          value={v.cardBlur ?? 0}
          onChange={(e) => set({ cardBlur: Number(e.target.value || 0) })}
          fullWidth
        />
      </Stack>
      <TextField
        size="small"
        label={t("manager.visualBuilder.pageStyle.card.shadow")}
        value={v.cardShadow || ""}
        onChange={(e) => set({ cardShadow: e.target.value })}
        placeholder={t("manager.visualBuilder.pageStyle.card.shadowExample")}
        fullWidth
      />

      {/* Hero heading effects */}
      <Typography variant="subtitle2" sx={{ mt: 1 }}>{t("manager.visualBuilder.pageStyle.hero.heading")}</Typography>
      <TextField
        size="small"
        label={t("manager.visualBuilder.pageStyle.hero.shadow")}
        value={v.heroHeadingShadow || "0 2px 24px rgba(0,0,0,.25)"}
        onChange={(e) => set({ heroHeadingShadow: e.target.value })}
        fullWidth
      />

      {/* Buttons */}
      <Divider sx={{ my: 1 }} />
      <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.buttons.heading")}</Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          type="color"
          label={t("manager.visualBuilder.pageStyle.buttons.background")}
          value={v.btnBg || "#1976d2"}
          onChange={(e) => set({ btnBg: e.target.value })}
          fullWidth
        />
        <TextField
          size="small"
          type="color"
          label={t("manager.visualBuilder.pageStyle.buttons.textColor")}
          value={v.btnColor || "#ffffff"}
          onChange={(e) => set({ btnColor: e.target.value })}
          fullWidth
        />
      </Stack>
      <TextField
        sx={{ mt: 1 }}
        size="small"
        label={t("manager.visualBuilder.pageStyle.buttons.radius")}
        type="number"
        value={v.btnRadius ?? 10}
        onChange={(e) =>
          set({ btnRadius: e.target.value === "" ? "" : Number(e.target.value) })
        }
        placeholder={t("manager.visualBuilder.pageStyle.buttons.radiusPlaceholder")}
        fullWidth
      />

      {/* Apply-to-all */}
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControlLabel
          control={
            <Switch
              checked={!!applyToAll}
              onChange={(_, c) => onToggleApplyToAll?.(c)}
            />
          }
          label={t("manager.visualBuilder.pageStyle.applyAllLabel")}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={onApplyNow}
          disabled={!onApplyNow}
        >
          {t("manager.visualBuilder.pageStyle.applyNow")}
        </Button>
        
      </Stack>
      {/* NEW — open the full, section-based editor */}
        <Button
          size="small"
          variant="contained"
          startIcon={<PaletteIcon />}
          onClick={onOpenAdvanced}
        >
          {t("manager.visualBuilder.pageStyle.openAdvanced")}
        </Button>
      </Stack>
  </SectionCard>
);

}



/* ---------- Main builder ---------- */

export default function VisualSiteBuilder({ companyId: companyIdProp }) {
  // prefer explicit prop if parent passed one
  const { t } = useTranslation();
  const location = useLocation();                 // ✅ use the hook, not window.location
  const detectedCompanyId = useCompanyId();       // ✅ get it from the hook
  const [companyId, setCompanyId] = useState(     // ✅ local state
    companyIdProp ?? detectedCompanyId ?? ""
  );

  // local state the component already uses elsewhere
  const [settings, setSettings] = useState(null);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (companyIdProp && companyIdProp !== companyId) {
      setCompanyId(companyIdProp);
    }
  }, [companyIdProp]); // eslint-disable-line react-hooks/exhaustive-deps

  
  // when the hook finally resolves, adopt it (avoids initializing as "")
  useEffect(() => {
    if (!companyId && detectedCompanyId) {
      setCompanyId(detectedCompanyId);
    }
  }, [detectedCompanyId, companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const justImported = Boolean(location.state?.postImportReload);
  const [suppressEmptyState, setSuppressEmptyState] = useState(justImported);

  useEffect(() => {
    if (!justImported) return;
    const t = setTimeout(() => setSuppressEmptyState(false), 400);
    return () => clearTimeout(t);
  }, [justImported]);

  useEffect(() => {
    // If Lab redirected with ?importLabPresetOnce=1, pull the preset then strip flag
    try {
      const qs = new URLSearchParams(
        location.search || window.location.search || ""
      );
      if (qs.get("importLabPresetOnce") === "1") {
        (async () => {
          try {
            await importLabSettingsFromServer(); // uses wb.getSettings()
          } finally {
            qs.delete("importLabPresetOnce");
            const nextSearch = qs.toString();
            const nextUrl = `${location.pathname}${
              nextSearch ? `?${nextSearch}` : ""
            }`;
            window.history.replaceState({}, "", nextUrl);
          }
        })();
      }
    } catch (e) {
      console.warn("Auto-import from Lab failed:", e?.message || e);
    }
  }, [location?.key]);

  const [loading, setLoading] = useState(true);        // ← used by Step 4
  const [authError, setAuthError] = useState(null);    // ← used by Step 5

  const slug = useMemo(() => {
    const [, s] = (location?.pathname || "").split("/");
    return s || "";
  }, [location?.pathname]);

  // ---------- Step 3: hardened preflight with 401/403 handling ----------
  useEffect(() => {
    if (!companyId) return;
    let alive = true;

    async function boot() {
      setLoading(true);
      setAuthError(null);
      try {
        const [settingsRes, pagesRes] = await Promise.all([
          wb.getSettings(companyId),
          wb.listPages(companyId),
        ]);

        const pagesList =
          Array.isArray(pagesRes?.data) ? pagesRes.data :
          (pagesRes?.data?.items || []);

        setSettings(settingsRes?.data ?? settingsRes ?? null);

        if (!pagesList.length) {
          try {
            const { data: all } = await wb.listTemplates();
            const templates = Array.isArray(all)
              ? all
              : Array.isArray(all?.templates)
              ? all.templates
              : Array.isArray(all?.items)
              ? all.items
              : [];

            const def = templates.find((t) => t.is_default) || templates[0];
            if (def?.key) {
              await wb.importTemplate(companyId, { key: def.key }); // header + ?company_id=
              const pages2 = await wb.listPages(companyId);
              if (!alive) return;
              setPages(pages2?.data || []);
              setLoading(false);
              return;
            }
          } catch (e) {
            throw e;
          }
        }

        if (!alive) return;
        setPages(pagesList);
        setLoading(false);
      } catch (e) {
        const code = e?.response?.status;
        if ((code === 401 || code === 403) && alive) {
          setAuthError({ code, slug, cid: companyId });
          setPages([]);
          setLoading(false);
          return;
        }
        console.error("[VisualSiteBuilder] boot error:", e);
        if (alive) {
          setAuthError({ code: code || 500, slug, cid: companyId });
          setLoading(false);
        }
      }
    }

    boot();
    return () => { alive = false; };
  }, [companyId, slug, location?.key]);


  // ---------- NEW (Step 3: preflight/auth guard needs these) ----------
  
  // ---------------------------------------------------------------

  const [selectedId, setSelectedId] = useState(null);
  


  // History state for undo/redo
  const {
    value: editing,
    set: setEditing,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory(emptyPage());
  const [selectedBlock, setSelectedBlock] = useState(-1);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Simple / Advanced toggle
  const [mode, setMode] = useState("simple"); // "simple" | "advanced"

  // floating inspector controller
  const fi = useFloatingInspector({ mode });

  // THEME drawer
  const [themeOpen, setThemeOpen] = useState(false);

  // Canvas preview mode
  const [fullPreview, setFullPreview] = useState(false);
  // Canvas height control
const [canvasHeightMode, setCanvasHeightMode] = useState("medium"); // "short" | "medium" | "tall" | "auto"
const canvasMaxHeight = useMemo(() => {
  switch (canvasHeightMode) {
    case "short":
      return "40vh";
    case "tall":
      return "80vh";
    case "auto":
      return "none"; // unlimited (no scroll clipping)
    case "medium":
    default:
      return "60vh";
  }
}, [canvasHeightMode]);


  // {t("manager.visualBuilder.pageStyle.applyAll.button")} (UI toggle + helper)
const [applyPageStyleToAll, setApplyPageStyleToAll] = useState(false);

/** pick only the page-style keys we want to propagate */
/** pick only the page-style keys we want to propagate */
const pickPageStyle = (meta = {}) => {
  const src = meta.pageStyle || meta;
  const allow = [
    // both naming styles supported
    "bgColor","bgImage","bgPos","bgRepeat",
    "backgroundColor","backgroundImage","backgroundRepeat","backgroundSize","backgroundPosition",
    "overlayColor","overlayOpacity",
    "bodyColor","headingColor","linkColor",
    "headingFont","bodyFont",
    "cardBg","cardRadius","cardShadow","cardBlur",
    "heroHeadingShadow",
    "btnBg","btnColor","btnRadius"
  ];
  const out = {};
  for (const k of allow) if (src[k] !== undefined) out[k] = src[k];

  // small normalization: mirror background* -> bg* for older code paths
  if (out.backgroundColor && !out.bgColor) out.bgColor = out.backgroundColor;
  if (out.backgroundImage && !out.bgImage) out.bgImage = out.backgroundImage;
  if (out.backgroundRepeat && !out.bgRepeat) out.bgRepeat = out.backgroundRepeat;
  if (out.backgroundPosition && !out.bgPos) out.bgPos = out.backgroundPosition;

  return out;
};







/** Apply current page's PageStyle to every other page */
// Replace BOTH earlier applyStyleToAllPagesNow() definitions with this one:
// Apply the current page's Page Style (SECTION) to all other pages
async function applyStyleToAllPagesNow() {
  if (!companyId) return;

  // Prefer the section props; fall back to meta.pageStyle
  // Prefer the Inspector (meta), then the section
const srcProps =
  editing?.content?.meta?.pageStyle ||
  readPageStyleProps(editing) ||
  null;


  if (!srcProps) {
    setErr(t("manager.visualBuilder.pageStyle.applyAll.none"));
    return;
  }

  setBusy(true);
  setErr(""); setMsg("");
  try {
    const list = await wb.listPages(companyId);
    const pagesList = Array.isArray(list?.data) ? list.data : (list || []);

    for (const p of pagesList) {
      if (!p?.id || p.id === editing?.id) continue;

      const full = await wb.getPage(companyId, p.id);
      const current = full?.data || full || p;

      const updated = writePageStyleProps(current, srcProps);
      await wb.updatePage(
        companyId,
        updated.id,
        serializePage ? serializePage(updated) : updated
      );
    }

    setMsg(`${t("manager.visualBuilder.pageStyle.applyAll.success")} ✔`);
  } catch (e) {
    setErr(e?.response?.data?.error || e.message || t("manager.visualBuilder.pageStyle.applyAll.failed"));
  } finally {
    setBusy(false);
  }
}




  // NEW — Help drawer state and jump helpers  (keep this below your new block)
  const [helpOpen, setHelpOpen] = useState(false);
  const jumpToById = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => setHelpOpen(false), 250);
    }
  };
  const handleJumpToPageStyle = () => jumpToById("page-style-card");
  const handleJumpToNav = () => jumpToById("nav-settings-card");
  const handleJumpToAssets = () => jumpToById("assets-manager-card");

  // --- Theme palette state (persisted with wb.saveSettings) ---
  const [themeOverrides, setThemeOverrides] = useState({});
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMsg, setThemeMsg] = useState("");
  const [themeErr, setThemeErr] = useState("");

  // load once
  useEffect(() => {
    (async () => {
      try {
        const s = await wb.getSettings(companyId);
        const root = s?.data || s || {};
        setThemeOverrides(root.theme_overrides || {});
      } catch {}
    })();
  }, [companyId]);

  // save
  const saveTheme = async () => {
    setThemeMsg("");
    setThemeErr("");
    setThemeSaving(true);
    try {
      await wb.saveSettings(companyId, { theme_overrides: themeOverrides || {} });
      setThemeMsg(t("manager.visualBuilder.messages.themeSaved"));
    } catch (e) {
      setThemeErr(
        e?.response?.data?.message || e?.message || t("manager.visualBuilder.errors.saveTheme")
      );
    } finally {
      setThemeSaving(false);
    }
  };

  const selectedPage = useMemo(
    () => pages.find((p) => p.id === selectedId) || null,
    [pages, selectedId]
  );

// choose a template and import it for this company (MUST send X-Company-Id)



// Helper: pick a valid template key from the backend list
// Helper: pick a valid template key from the backend list
const pickTemplateKey = async () => {
  const res = await wb.listTemplates();                 // -> { data: [...] }
  const items = Array.isArray(res?.data) ? res.data : [];
  if (!items.length) throw new Error("No templates available on server");

  // Prefer default if flagged, else the first item
  const def = items.find(t => t.is_default) || items[0];

  // Keys are the filename stem; backend expects this exact value
  const key = def.key || def.id || def.title;
  if (!key) throw new Error("Template list did not include a usable key");
  return key;
};

// Import one template for this company (ALWAYS with a key)
const autoProvisionIfEmpty = useCallback(
  async (cid, settingsObj) => {
    // 1) Try hinted key from settings, if any
    const hintedKey =
      settingsObj?.website?.template_key ||
      settingsObj?.template_key ||
      null;

    let keyToUse = hintedKey;

    // 2) Validate hinted key exists; otherwise fall back to a real one
    try {
      const res = await wb.listTemplates();
      const items = Array.isArray(res?.data) ? res.data : [];

      const exists = keyToUse && items.some(
        t => (t.key || t.id || t.title) === keyToUse
      );

      keyToUse = exists ? keyToUse : await pickTemplateKey();
    } catch (e) {
      // If listing fails, don’t send an empty body—pickTemplateKey throws
      // and we surface a meaningful error to the UI instead.
      throw e;
    }

    // 3) Import with a required key
    await wb.importTemplate(cid, { key: keyToUse });
    return true;
  },
  []
);


  
  const loadAll = async (cid) => {
  setErr("");
  setMsg("");
  setBusy(true);
  try {
    // 1) settings (we might use template_key hint)
    let settingsObj = null;
    try {
      const s = await wb.getSettings(cid);
      settingsObj = s?.data || s || null;
      setSettings(settingsObj);
    } catch (e) {
      console.warn("Settings load failed", e?.response?.data || e);
    }

    // 2) pages
    let res = await wb.listPages(cid);
    let pgRaw = (res.data || []).map(normalizePage);

    // 3) if empty → import real template first, then reload pages
    if (!pgRaw.length) {
      try {
        await autoProvisionIfEmpty(cid, settingsObj);
        res = await wb.listPages(cid);
        pgRaw = (res.data || []).map(normalizePage);
        setMsg(`${t("manager.visualBuilder.load.starterCreated")} ✔`);
      } catch (e) {
        console.error("Auto-provision failed", e?.response?.data || e);
        setErr(t("manager.visualBuilder.load.autoprovisionFailed"));
      }
    }

    const pg = pgRaw.map((p) => ensureSectionIds(withLiftedLayout(p)));
    setPages(pg);

    if (pg.length) {
      const home =
        pg.find((p) => p.is_homepage) ||
        pg.find((p) => (p.slug || "").toLowerCase() === "home") ||
        pg.find((p) => Number(p.sort_order) === 0) ||
        pg[0];

      const first = ensureSectionIds(withLiftedLayout(home));
      setSelectedId(first.id);
      setEditing(first);
    } else {
      setSelectedId(null);
      setEditing(ensureSectionIds(withLiftedLayout(emptyPage())));
    }

    setSelectedBlock(-1);
  } finally {
    setBusy(false);
  }
};


  useEffect(() => {
    if (!companyId) return;
    // initial load
    loadAll(companyId);

    // follow-up reload if we had postImportReload
    if (location?.state?.postImportReload) {
      setTimeout(() => loadAll(companyId), 300);
      if (window?.history?.replaceState) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const applyLabPresetFromServerNow = useCallback(
    async (cid = companyId) => {
      try {
        const res = await wb.getSettings(cid);
        const preset =
          res?.data?.layout_lab_preset ||
          res?.data?.settings?.layout_lab_preset ||
          res?.data?.website?.layout_lab_preset ||
          null;

        if (!preset || (typeof preset === "object" && !Object.keys(preset).length))
          return;

        const computedDefaultGutterX = (() => {
          if (typeof preset.gutterX === "number") return preset.gutterX;
          if (preset.density === "compact") return 12;
          if (preset.density === "comfortable") return 24;
          return 16;
        })();

        setEditing((prev) => {
          if (!prev) return prev;

          const layout = preset.layout ?? prev.layout ?? "boxed";
          const sectionSpacing =
            typeof preset.sectionSpacing === "number"
              ? preset.sectionSpacing
              : prev?.content?.meta?.sectionSpacing ?? 6;

          const srcSections = Array.isArray(preset.sections)
            ? preset.sections
            : [];
          const mergedSections = (
            Array.isArray(prev?.content?.sections) ? prev.content.sections : []
          ).map((sec, i) => {
            const sp = srcSections[i] || {};
            const props = { ...(sec.props || {}) };
            if (sp.cardStyle != null) props.cardStyle = sp.cardStyle;
            if (sp.imageMode != null) props.imageMode = sp.imageMode;
            if (sp.maxWidth != null) props.maxWidth = sp.maxWidth;
            if (sp.align != null) props.align = sp.align;
            if (sp.columns != null) props.columns = sp.columns;
            if (sp.variant != null) props.variant = sp.variant;

            if (typeof preset.gutterX === "number") props.gutterX = preset.gutterX;
            if (typeof preset.bleedLeft === "boolean")
              props.bleedLeft = preset.bleedLeft;
            if (typeof preset.bleedRight === "boolean")
              props.bleedRight = preset.bleedRight;

            if (sec.type === "hero") {
              if (typeof preset.heroHeight === "number")
                props.heroHeight = preset.heroHeight;
              if (typeof preset.safeTop === "boolean")
                props.safeTop = preset.safeTop;
              if (preset.contentMaxWidth !== undefined)
                props.contentMaxWidth = preset.contentMaxWidth;
            }

            return { ...sec, props };
          });

          const content = prev.content || {};
          const meta = content.meta || {};
          const next = {
            ...prev,
            layout,
            content: {
              ...content,
              meta: {
                ...meta,
                layout,
                sectionSpacing,
                defaultGutterX: computedDefaultGutterX,
              },
              sections: mergedSections,
            },
          };

          return withLiftedLayout(next);
        });

        setMsg?.(t("manager.visualBuilder.messages.importedPreset"));
      } catch (e) {
        console.error("applyLabPresetFromServerNow failed", e);
      }
    },
    [companyId, setEditing, setMsg]
  );

  /* ----- save & publish (HOISTED) ----- */
async function onSavePage() {
  if (!companyId) return;
  setBusy(true);
  setErr("");
  setMsg("");
  try {
    const payload = serializePage(ensureSectionIds(editing));
    if (payload.id) {
      const r = await wb.updatePage(companyId, payload.id, payload);
      const saved = ensureSectionIds(
        withLiftedLayout(normalizePage(r.data || payload))
      );
      setPages((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      setEditing(saved);
      setMsg(t("manager.visualBuilder.messages.saved"));
      if (applyPageStyleToAll) {
        await applyStyleToAllPagesNow();
      }
    } else {
      const r = await wb.createPage(companyId, payload);
      const created = ensureSectionIds(
        withLiftedLayout(normalizePage(r.data))
      );
      setPages((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setEditing(created);
      setMsg(t("manager.visualBuilder.messages.created"));
    }
  } catch (e) {
    console.error(e);
    setErr(t("manager.visualBuilder.errors.savePage"));
  } finally {
    setBusy(false);
  }
}

  async function importLabSettingsFromServer() {
    if (!companyId) {
      setErr(t("manager.visualBuilder.errors.signIn"));
      return;
    }
    setErr("");
    setMsg("");
    try {
      const s = await wb.getSettings(companyId);
      const root = s?.data || s || {};
      const preset =
        root.layout_lab_preset ||
        root.settings?.layout_lab_preset ||
        root.website?.layout_lab_preset ||
        null;

      if (!preset) {
        setErr(t("manager.visualBuilder.errors.noPreset"));
        return;
      }

      // Page meta
      const layout = preset.layout ?? editing.layout ?? "boxed";
      const sectionSpacing = preset.sectionSpacing ?? 6;
      const defaultGutterX = (() => {
        if (typeof preset.gutterX === "number") return preset.gutterX;
        if (preset.density === "compact") return 12;
        if (preset.density === "comfortable") return 24;
        return 16;
      })();

      setEditing((cur) => {
        const content = cur.content || {};
        const meta = content.meta || {};
        return withLiftedLayout({
          ...cur,
          layout,
          content: {
            ...content,
            meta: { ...meta, layout, sectionSpacing, defaultGutterX },
          },
        });
      });

      // section-level knobs
      setEditing((cur) => {
        const sections = (cur?.content?.sections || []).map((sct) => {
          const props = { ...(sct.props || {}) };
          if (typeof preset.gutterX === "number") props.gutterX = preset.gutterX;
          if (typeof preset.bleedLeft === "boolean")
            props.bleedLeft = preset.bleedLeft;
          if (typeof preset.bleedRight === "boolean")
            props.bleedRight = preset.bleedRight;

          if (sct.type === "hero") {
            if (typeof preset.heroHeight === "number")
              props.heroHeight = preset.heroHeight;
            if (typeof preset.safeTop === "boolean") props.safeTop = preset.safeTop;
            if (preset.contentMaxWidth !== undefined)
              props.contentMaxWidth = preset.contentMaxWidth;
          }
          return { ...sct, props };
        });
        return withLiftedLayout({
          ...cur,
          content: { ...(cur?.content || {}), sections },
        });
      });

      setMsg(t("manager.visualBuilder.messages.importedPreset"));
    } catch (e) {
      const detail = e?.response?.data?.message || e?.message || "";
      setErr(detail ? t("manager.visualBuilder.errors.importPresetDetail", { detail }) : t("manager.visualBuilder.errors.importPreset"));
    }
  }

  // --- Publish (no auto-apply of Lab; save current page then publish) ---
  // VisualSiteBuilder.js
async function onPublish() {
  if (!companyId) return;
  setBusy(true);
  setErr("");
  setMsg("");

  try {
    // Take the current editor state, ensure section ids + mark as published
    const snapshot = withLiftedLayout(ensureSectionIds({ ...editing, published: true }));
    const payload  = serializePage(snapshot);

    if (payload.id) {
      // Save the latest snapshot before publish
      await wb.updatePage(companyId, payload.id, payload);
      // keep local state in sync
      setEditing(snapshot);
      setPages((prev) => prev.map((p) => (p.id === payload.id ? snapshot : p)));
    } else {
      // brand-new page flow (rare during publish)
      const r = await wb.createPage(companyId, payload);
      const created = ensureSectionIds(withLiftedLayout(normalizePage(r.data)));
      setPages((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setEditing(created);
    }

    // Publish the whole site (force)
    await wb.publish(companyId, true);
    setMsg(`${t("manager.visualBuilder.messages.sitePublished")} ✔`);
  } catch (e) {
    setErr(t("manager.visualBuilder.errors.publishFailed", { reason: e?.response?.data?.message || e.message || t("manager.visualBuilder.errors.unknown") }));
  } finally {
    setBusy(false);
  }
}


  /* ----- Keyboard shortcuts ----- */
  const handlersRef = useRef({ onSavePage, onPublish, undo, redo });
  useEffect(() => {
    handlersRef.current = { onSavePage, onPublish, undo, redo };
  }, [onSavePage, onPublish, undo, redo]);

  useEffect(() => {
    const onKey = (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      const k = e.key.toLowerCase();
      const { onSavePage, onPublish, undo, redo } = handlersRef.current || {};
      if (k === "s" && onSavePage) {
        e.preventDefault();
        onSavePage();
      }
      if (k === "p" && onPublish) {
        e.preventDefault();
        onPublish();
      }
      if (k === "z" && !e.shiftKey && undo) {
        e.preventDefault();
        undo();
      }
      if ((k === "y" || (k === "z" && e.shiftKey)) && redo) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ----- Autosave (debounced, OFF by default) ----- */
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const debounce = (fn, ms = 800) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };
  const autosave = React.useMemo(
    () =>
      debounce(async (snapshot) => {
        try {
          if (!autosaveEnabled) return;
          if (!companyId || !snapshot?.id) return;
          const payload = serializePage(ensureSectionIds(snapshot));
          await wb.updatePage(companyId, payload.id, payload);
          setMsg?.(t("manager.visualBuilder.messages.autosaved"));
        } catch (e) {
          console.error(e);
        }
      }, 800),
    [companyId, autosaveEnabled]
  );
  useEffect(() => {
    if (!autosaveEnabled) return;
    autosave(editing);
  }, [autosaveEnabled, autosave, editing]);

  /* ----- block helpers ----- */
  const setBlockProp = useCallback(
    (idx, key, value) => {
      setEditing((cur) => {
        const next = { ...cur, content: { sections: [...safeSections(cur)] } };
        if (!next.content.sections[idx]) return cur;
        const blk = { ...next.content.sections[idx] };
        blk.props = { ...(blk.props || {}) };
        blk.props[key] = value;
        next.content.sections[idx] = blk;
        return withLiftedLayout(next);
      });
    },
    [setEditing]
  );

  const setBlockPropsAll = useCallback(
    (idx, newPropsObj) => {
      setEditing((cur) => {
        const next = { ...cur, content: { sections: [...safeSections(cur)] } };
        if (!next.content.sections[idx]) return cur;
        const blk = { ...next.content.sections[idx] };
        blk.props = { ...(blk.props || {}), ...(newPropsObj || {}) };
        next.content.sections[idx] = blk;
        return withLiftedLayout(next);
      });
    },
    [setEditing]
  );

  // Drag-to-adjust section spacing (per block)
  const dragRef = useRef({ active: false, index: -1, startY: 0, startVal: 0 });

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dy = e.clientY - d.startY;
      const nextUnits = Math.max(0, Math.round((d.startVal * 8 + dy) / 8));
      setBlockProp(d.index, "spaceAfter", nextUnits);
    };
    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current = { active: false, index: -1, startY: 0, startVal: 0 };
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [setBlockProp]);

  const beginSpaceDrag = (i, e) => {
    e.preventDefault();
    const metaSpace = editing?.content?.meta?.sectionSpacing ?? 6;
    const startVal =
      safeSections(editing)[i]?.props?.spaceAfter ?? metaSpace;
    dragRef.current = {
      active: true,
      index: i,
      startY: e.clientY,
      startVal,
    };
    document.body.style.cursor = "ns-resize";
  };
  const moveBlock = (idx, dir) => {
  const delta = dir === "up" ? -1 : dir === "down" ? 1 : Number(dir) || 0;

  setEditing((cur) => {
    const arr = [...safeSections(cur)];
    const j = idx + delta;
    if (idx < 0 || idx >= arr.length || j < 0 || j >= arr.length) {
      return withLiftedLayout(cur);
    }
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    return withLiftedLayout({ ...cur, content: { sections: arr } });
  });

  setSelectedBlock((b) => {
    const len = safeSections(editing).length;
    return Math.max(0, Math.min((b ?? idx) + delta, Math.max(0, len - 1)));
  });
};


  const duplicateBlock = (idx) => {
    setEditing((cur) => {
      const sections = [...safeSections(cur)];
      if (idx < 0 || idx >= sections.length) return withLiftedLayout(cur);
      const cloned = makeIndependentClone(sections[idx]);
      if (cloned?.type && (!cloned.id || cloned.id.length < 4)) {
        cloned.id = `${cloned.type}-${safeUid()}`;
      }
      sections.splice(idx + 1, 0, cloned);
      return withLiftedLayout({
        ...cur,
        content: { ...cur.content, sections },
      });
    });
    setSelectedBlock(idx + 1);
  };

  const deleteBlock = (idx) => {
    setEditing((cur) => {
      const arr = [...safeSections(cur)];
      arr.splice(idx, 1);
      return withLiftedLayout({ ...cur, content: { sections: arr } });
    });
    setSelectedBlock(-1);
  };

  // NEW: safe addSection helper that handles pageStyle specially
  function addSection(type, index) {
    setEditing((prev) => {
      const page = { ...prev };
      const sections = Array.isArray(page?.content?.sections)
        ? [...page.content.sections]
        : [];

      if (type === "pageStyle") {
        const existingIdx = sections.findIndex((s) => s.type === "pageStyle");
        if (existingIdx >= 0) {
          // already present — just select it
          setSelectedBlock(existingIdx);
          return prev;
        }
        const block = defaultPageStyleBlock();
        sections.splice(0, 0, block); // pin to top
        page.content = { ...(page.content || {}), sections };
        setSelectedBlock(0);
        return withLiftedLayout(page);
      }
  // Read props from the first pageStyle section (if any)

    
      // generic add (kept simple; for others you still have addBlock/NEW_BLOCKS)
      const block = { id: nanoid(8), type, props: {} };
      const insertAt = typeof index === "number" ? index : sections.length;
      sections.splice(insertAt, 0, block);
      page.content = { ...(page.content || {}), sections };
      setSelectedBlock(insertAt);
      return withLiftedLayout(page);
    });
  }

  const addBlock = (type) => {
    setEditing((cur) => {
      const arr = [...safeSections(cur)];
      const factory = NEW_BLOCKS[type] || NEW_BLOCKS.text;
      const created = factory();
      if (!created.id) created.id = uid();
      arr.push(created);
      return withLiftedLayout({ ...cur, content: { sections: arr } });
    });
    setSelectedBlock(safeSections(editing).length);
  };

  /* ----- Page meta helpers ----- */
  const updatePageMeta = (patch) => {
    setEditing((cur) => {
      let next = { ...cur, ...patch };
      if ("layout" in patch) {
        const content = next.content || {};
        const meta = content.meta || {};
        next = {
          ...next,
          content: { ...content, meta: { ...meta, layout: patch.layout } },
        };
      }
      return withLiftedLayout(next);
    });
  };

  const savePageMeta = async () => {
    if (!companyId) return;
    try {
      setBusy(true);
      if (editing?.id) {
        const payload = serializePage(ensureSectionIds(editing));
        const r = await wb.updatePage(companyId, payload.id, payload);
        const saved = ensureSectionIds(
          withLiftedLayout(normalizePage(r.data || payload))
        );
        setPages((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        setEditing(saved);
        setMsg(t("manager.visualBuilder.messages.pageSettingsSaved"));
      } else {
        await onSavePage();
      }
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.savePageSettings"));
    } finally {
      setBusy(false);
    }
  };

  /* ----- LAB import helpers ----- */
  const importLabSettings = () => {
    try {
      const raw = localStorage.getItem(LAB_LS_KEY);
      if (!raw) {
        setErr(t("manager.visualBuilder.errors.noSavedLabSettings"));
        return;
      }
      const p = JSON.parse(raw) || {};
      const layout = p.layout ?? editing.layout ?? "boxed";
      const sectionSpacing = p.sectionSpacing ?? 6;
      const defaultGutterX = (() => {
        if (typeof p.gutterX === "number") return p.gutterX;
        if (p.density === "compact") return 12;
        if (p.density === "comfortable") return 24;
        return 16;
      })();

      setEditing((cur) => {
        const content = cur.content || {};
        const meta = content.meta || {};
        const next = {
          ...cur,
          layout,
          content: {
            ...content,
            meta: { ...meta, layout, sectionSpacing, defaultGutterX },
          },
        };
        return withLiftedLayout(next);
      });

      if (selectedBlock >= 0) {
        const selected = safeSections(editing)[selectedBlock];
        if (selected) {
          const blockPatch = {};
          if (typeof p.gutterX === "number") blockPatch.gutterX = p.gutterX;
          if (typeof p.bleedLeft === "boolean") blockPatch.bleedLeft = p.bleedLeft;
          if (typeof p.bleedRight === "boolean")
            blockPatch.bleedRight = p.bleedRight;
          if (typeof p.heroHeight === "number" && selected.type === "hero")
            blockPatch.heroHeight = p.heroHeight;
          if (typeof p.safeTop === "boolean" && selected.type === "hero")
            blockPatch.safeTop = p.safeTop;
          if (p.contentMaxWidth !== undefined && selected.type === "hero")
            blockPatch.contentMaxWidth = p.contentMaxWidth;
          if (Object.keys(blockPatch).length) {
            setBlockPropsAll(selectedBlock, {
              ...(selected.props || {}),
              ...blockPatch,
            });
          }
        }
      }

      setMsg(t("manager.visualBuilder.messages.importedLayoutLab"));
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.importSettings"));
    }
  };

  const importLabSettingsAll = () => {
    try {
      const raw = localStorage.getItem(LAB_LS_KEY);
      if (!raw) {
        setErr(t("manager.visualBuilder.errors.noLayoutSettings"));
        return;
      }
      const p = JSON.parse(raw) || {};

      const layout = p.layout ?? editing.layout ?? "boxed";
      const sectionSpacing = p.sectionSpacing ?? 6;
      const defaultGutterX = (() => {
        if (typeof p.gutterX === "number") return p.gutterX;
        if (p.density === "compact") return 12;
        if (p.density === "comfortable") return 24;
        return 16;
      })();

      setEditing((cur) => {
        const content = cur.content || {};
        const meta = content.meta || {};
        const nextSections = (cur?.content?.sections || []).map((s) => {
          const props = { ...(s.props || {}) };
          if (typeof p.gutterX === "number") props.gutterX = p.gutterX;
          if (typeof p.bleedLeft === "boolean") props.bleedLeft = p.bleedLeft;
          if (typeof p.bleedRight === "boolean")
            props.bleedRight = p.bleedRight;
          if (s.type === "hero") {
            if (typeof p.heroHeight === "number") props.heroHeight = p.heroHeight;
            if (typeof p.safeTop === "boolean") props.safeTop = p.safeTop;
            if (p.contentMaxWidth !== undefined)
              props.contentMaxWidth = p.contentMaxWidth;
          }
          return { ...s, props };
        });

        const next = {
          ...cur,
          layout,
          content: {
            ...content,
            meta: { ...meta, layout, sectionSpacing, defaultGutterX },
            sections: nextSections,
          },
        };
        return withLiftedLayout(next);
      });

      setMsg(t("manager.visualBuilder.messages.importedAllLab"));
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.importLabSettings"));
    }
  };

  /* ---------- RENDER ---------- */

  // Compute schema via registry
  const selectedBlockObj = safeSections(editing)[selectedBlock];
  const blockType = selectedBlockObj?.type;
  const schemaForBlock =
    (blockType && SCHEMA_REGISTRY[blockType]) ||
    selectedBlockObj?.schema ||
    null;

  const ControlsCard = (
    <SectionCard
      title={t("manager.visualBuilder.controls.title")}
      description={t("manager.visualBuilder.controls.description")}
      actions={
        <Stack direction="row" spacing={1}>
          {/* NEW — Help button in the header actions */}
          <Tooltip title={t("manager.visualBuilder.controls.tooltips.guide")}>
            <IconButton onClick={() => setHelpOpen(true)} size="small">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>

          <Button
            size="small"
            startIcon={<ViewCarouselIcon />}
            component={RouterLink}
            to="/manager/website/templates"
          >
            {t("manager.visualBuilder.controls.buttons.chooseTemplate")}
          </Button>

          {/* Optional helper */}
          <Button size="small" component={RouterLink} to="/manage/website/layout-lab">
            {t("manager.visualBuilder.controls.buttons.layoutLab")}
          </Button>
          <Button size="small" onClick={importLabSettingsFromServer}>
            {t("manager.visualBuilder.controls.buttons.importServer")}
          </Button>

          {/* Import buttons */}
          <Button size="small" onClick={importLabSettings}>
            {t("manager.visualBuilder.controls.buttons.importSettings")}
          </Button>
          <Button size="small" onClick={importLabSettingsAll}>
            {t("manager.visualBuilder.controls.buttons.importAll")}
          </Button>

          <Button
            size="small"
            startIcon={<RefreshIcon />}
            disabled={busy || !companyId}
            onClick={() => loadAll(companyId)}
          >
            {t("manager.visualBuilder.controls.buttons.refresh")}
          </Button>

          <Tooltip title={t("manager.visualBuilder.controls.tooltips.save")}>
   <span>
     <Button size="small" startIcon={<SaveIcon />} variant="outlined" disabled={busy || !companyId} onClick={onSavePage}>
       {t("manager.visualBuilder.controls.buttons.save")}
     </Button>
   </span>
 </Tooltip>
            <Tooltip title={t("manager.visualBuilder.pageStyle.applyAll.tooltip")}>
   <span>
     <Button size="small" variant="outlined" onClick={applyStyleToAllPagesNow} startIcon={<PaletteIcon />}>
       {t("manager.visualBuilder.pageStyle.applyAll.button")}
     </Button>
   </span>
 </Tooltip>
          <Tooltip title={t("manager.visualBuilder.controls.tooltips.publish")}>
   <span>
     <Button size="small" startIcon={<PublishIcon />} variant="contained" disabled={busy || !companyId} onClick={onPublish}>
       {t("manager.visualBuilder.controls.buttons.publish")}
     </Button>
   </span>
 </Tooltip>
        </Stack>
      }
    >
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Tooltip
          title={!companyId ? t("manager.visualBuilder.controls.tooltips.themeSignIn") : t("manager.visualBuilder.controls.tooltips.themeOpen")}
        >
          <span>
            <Button
              size="small"
              startIcon={<BrushIcon />}
              onClick={() => setThemeOpen(true)}
              disabled={!companyId}
            >
              {t("manager.visualBuilder.controls.buttons.theme")}
            </Button>
          </span>
        </Tooltip>

        <Button size="small" startIcon={<UndoIcon />} disabled={!canUndo} onClick={undo}>
          {t("manager.visualBuilder.controls.buttons.undo")}
        </Button>
        <Button size="small" startIcon={<RedoIcon />} disabled={!canRedo} onClick={redo}>
          {t("manager.visualBuilder.controls.buttons.redo")}
        </Button>

        <FormControlLabel
          sx={{ ml: 1 }}
          label={t("manager.visualBuilder.controls.toggles.simpleMode")}
          control={
            <Switch
              checked={mode === "simple"}
              onChange={(_, v) => setMode(v ? "simple" : "advanced")}
            />
          }
        />

        {/* Floating inspector controls */}
        <FloatingInspector.Controls fi={fi} />

        {/* Dock/Float/Inline toggle (simple mode only) */}
        <ToggleButtonGroup
  value={mode}
  exclusive
  onChange={(_, v) => {
    if (!v) return;
    fi.setInspectorMode(v);
    fi.setEnabled?.(v !== "dock");   // turn floating/inline on

    // If nothing is selected yet, pick the first block so the panel has context
    if (v !== "dock" && selectedBlock < 0 && safeSections(editing).length) {
      setSelectedBlock(0);
    }
  }}
  size="small"
>
  <ToggleButton value="dock">{t("manager.visualBuilder.controls.toggles.dock")}</ToggleButton>
  <ToggleButton value="inline">{t("manager.visualBuilder.controls.toggles.inline")}</ToggleButton>
  <ToggleButton value="float">{t("manager.visualBuilder.controls.toggles.float")}</ToggleButton>
</ToggleButtonGroup>



        {/* {t("manager.visualBuilder.controls.toggles.fullPreview")} toggle */}
        <FormControlLabel
          sx={{ ml: 1 }}
          label={t("manager.visualBuilder.controls.toggles.fullPreview")}
          control={
            <Switch checked={fullPreview} onChange={(_, v) => setFullPreview(v)} />
          }
        />
      </Stack>
    </SectionCard>
  );

  const AlertsCard =
    msg || err ? (
      <SectionCard title={t("manager.visualBuilder.status.title")}>
        <Stack spacing={1}>
          {msg && <Alert severity="success">{msg}</Alert>}
          {err && <Alert severity="error">{err}</Alert>}
        </Stack>
      </SectionCard>
    ) : null;

  const LeftColumn = (
  <Stack spacing={2}>
    <SectionCard title={t("manager.visualBuilder.pages.title")}>
      <List dense sx={{ mb: 1 }}>
        {pages.map((p) => (
          <ListItem key={p.id} disablePadding>
            <ListItemButton
              selected={selectedId === p.id}
              onClick={() => {
                const lifted = withLiftedLayout(p);
                setSelectedId(lifted.id);
                setEditing(lifted);
                setSelectedBlock(-1);
              }}
            >
              <ListItemText primary={p.title || p.slug} secondary={p.slug} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </SectionCard>

    <SectionCard
      title={t("manager.visualBuilder.pages.settings.title")}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            onClick={savePageMeta}
            disabled={busy || !companyId}
          >
            {t("manager.visualBuilder.pages.settings.save")}
          </Button>
          <Button
            size="small"
            onClick={() => loadAll(companyId)}
            disabled={busy || !companyId}
          >
            {t("manager.visualBuilder.pages.settings.reload")}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={1}>
        <TextField
          label={t("manager.visualBuilder.pages.settings.fields.slug")}
          size="small"
          value={editing.slug || ""}
          onChange={(e) => updatePageMeta({ slug: e.target.value })}
          helperText={t("manager.visualBuilder.pages.settings.fields.slugHint")}
          fullWidth
        />
        <TextField
          label={t("manager.visualBuilder.pages.settings.fields.pageTitle")}
          size="small"
          value={editing.title || ""}
          onChange={(e) => updatePageMeta({ title: e.target.value })}
          fullWidth
        />
        <TextField
          label={t("manager.visualBuilder.pages.settings.fields.menuTitle")}
          size="small"
          value={editing.menu_title || ""}
          onChange={(e) => updatePageMeta({ menu_title: e.target.value })}
          fullWidth
        />
        <TextField
          label={t("manager.visualBuilder.pages.settings.fields.sortOrder")}
          size="small"
          type="number"
          value={Number(editing.sort_order ?? 0)}
          onChange={(e) =>
            updatePageMeta({ sort_order: Number(e.target.value || 0) })
          }
          fullWidth
        />

        {/* Layout selector (boxed vs full) */}
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {t("manager.visualBuilder.pages.settings.layout.label")}
          </Typography>
          <Select
            size="small"
            fullWidth
            value={editing.layout || "boxed"}
            onChange={(e) => updatePageMeta({ layout: e.target.value })}
          >
            <MenuItem value="boxed">{t("manager.visualBuilder.pages.settings.layout.boxed")}</MenuItem>
            <MenuItem value="full">{t("manager.visualBuilder.pages.settings.layout.full")}</MenuItem>
          </Select>
        </Box>

        {/* Global section spacing (space between blocks) */}
        
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {t("manager.visualBuilder.pages.settings.sectionSpacing.label")}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Slider
              size="small"
              min={0}
              max={12}
              step={1}
              value={Number(editing?.content?.meta?.sectionSpacing ?? 6)}
              valueLabelDisplay="auto"
              onChange={(_, v) =>
                setEditing((cur) => {
                  const content = cur.content || {};
                  const meta = content.meta || {};
                  return withLiftedLayout({
                    ...cur,
                    content: { ...content, meta: { ...meta, sectionSpacing: Number(v) } },
                  });
                })
              }
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              type="number"
              inputProps={{ min: 0, max: 12 }}
              value={Number(editing?.content?.meta?.sectionSpacing ?? 6)}
              onChange={(e) => {
                const v = Math.max(0, Math.min(12, Number(e.target.value || 0)));
                setEditing((cur) => {
                  const content = cur.content || {};
                  const meta = content.meta || {};
                  return withLiftedLayout({
                    ...cur,
                    content: { ...content, meta: { ...meta, sectionSpacing: v } },
                  });
                });
              }}
              sx={{ width: 72 }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t("manager.visualBuilder.pages.settings.sectionSpacing.hint")}
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={Boolean(editing.show_in_menu ?? true)}
              onChange={(_, v) => updatePageMeta({ show_in_menu: v })}
            />
          }
          label={t("manager.visualBuilder.pages.settings.toggles.showInMenu")}
        />
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(editing.published ?? true)}
              onChange={(_, v) => updatePageMeta({ published: v })}
            />
          }
          label={t("manager.visualBuilder.pages.settings.toggles.published")}
        />
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(editing.is_homepage ?? false)}
              onChange={(_, v) => updatePageMeta({ is_homepage: v })}
            />
          }
          label={t("manager.visualBuilder.pages.settings.toggles.homepage")}
        />
        <FormControlLabel
          control={
            <Switch
              checked={autosaveEnabled}
              onChange={(_, v) => setAutosaveEnabled(v)}
            />
          }
          label={t("manager.visualBuilder.pages.settings.toggles.autosave")}
        />
      </Stack>
    </SectionCard>


      {/* Simple enterprise controls for non-technical managers */}
      {/*
<SectionCard
  title="Enterprise Controls (Easy)"
  description="One-click width and polish for the selected block"
>
  <EnterpriseEditorExtras
    page={editing}
    onUpdatePage={(patch) => updatePageMeta(patch)}
    selectedBlock={safeSections(editing)[selectedBlock]}
    onChangeProp={(k, v) => setBlockProp(selectedBlock, k, v)}
    onChangeProps={(np) => setBlockPropsAll(selectedBlock, np)}
  />
</SectionCard>
*/}


      {/*
{settings && (
  <SectionCard id="nav-settings-card" title="Navigation (Services / Reviews)">
    <WebsiteNavSettingsCard
      companyId={companyId}
      pages={pages}
      initialSettings={settings}
      onSaved={(data) => {
        setSettings(data);
        setMsg(t("manager.visualBuilder.messages.navSaved"));
      }}
    />
  </SectionCard>
)}
*/}


      <SectionCard 
  title={t("manager.visualBuilder.sections.title")}
  description={t("manager.visualBuilder.sections.description")}
>
  {/* Section list (pageStyle hidden) */}
  <Stack spacing={1}>
    {(() => {
      const all = safeSections(editing);
      const visible = all.filter((s) => s.type !== "pageStyle"); // hide pageStyle from the list
      return visible.map((blk, i) => {
        // find its real index in the full sections array so selection stays correct
        const realIndex = all.findIndex((s) => s.id === blk.id);
        return (
          <Tooltip
            key={blk.id || i}
            title={t("manager.visualBuilder.sections.tooltip")}
            placement="right"
          >
            <Button
              size="small"
              variant={realIndex === selectedBlock ? "contained" : "outlined"}
              onClick={() => setSelectedBlock(realIndex)}
              sx={{ justifyContent: "flex-start" }}
              fullWidth
            >
              {i + 1}. {t(`manager.visualBuilder.sections.types.${blk.type}`, { defaultValue: blk.type })}
            </Button>
          </Tooltip>
        );
      });
    })()}
  </Stack>

  <Divider sx={{ my: 2 }} />

  {/* Add new blocks */}
  <Stack direction="row" spacing={1} flexWrap="wrap">
    <Button size="small" startIcon={<AddIcon />} onClick={() => addBlock("hero")}>
      {t("manager.visualBuilder.sections.add.hero")}
    </Button>
    <Button size="small" startIcon={<AddIcon />} onClick={() => addBlock("text")}>
      {t("manager.visualBuilder.sections.add.text")}
    </Button>
    <Button size="small" startIcon={<AddIcon />} onClick={() => addBlock("gallery")}>
      {t("manager.visualBuilder.sections.add.gallery")}
    </Button>
    <Button size="small" startIcon={<AddIcon />} onClick={() => addBlock("textFree")}>
      {t("manager.visualBuilder.sections.add.textFree")}
    </Button>
    <Button size="small" startIcon={<AddIcon />} onClick={() => addBlock("galleryCarousel")}>
      {t("manager.visualBuilder.sections.add.carousel")}
    </Button>
    <Button size="small" startIcon={<AddIcon />} onClick={() => addBlock("faq")}>
      {t("manager.visualBuilder.sections.add.faq")}
    </Button>
    <Button size="small" startIcon={<AddIcon />} onClick={() => addBlock("serviceGrid")}>
      {t("manager.visualBuilder.sections.add.services")}
    </Button>
    <Button size="small" startIcon={<AddIcon />} onClick={() => addBlock("contact")}>
      {t("manager.visualBuilder.sections.add.contact")}
    </Button>
    <Button size="small" startIcon={<AddIcon />} onClick={() => addBlock("contactForm")}>{t("manager.visualBuilder.sections.add.contactForm")}</Button>
    <Button size="small" startIcon={<AddIcon />} onClick={() => addBlock("footer")}>
      {t("manager.visualBuilder.sections.add.footer")}
    </Button>
  </Stack>
</SectionCard>

    </Stack>
  );

  // Defer canvas updates to keep typing smooth in the inspector
 // Defer canvas updates to keep typing smooth in preview mode
const editingPreview = useDeferredValue(editing);

// Use non-deferred state while editing (preview OFF) so changes feel instant
// Compute page style once for the canvas
// Prefer meta.pageStyle (Inspector edits) -> content.style (older) -> section-based style (if present)
const livePageStyle =
  editing?.content?.meta?.pageStyle ||
  editing?.content?.style ||
  readPageStyleProps(editing) ||
  {};

const pageVars  = styleToCssVars(livePageStyle);
const bgColor   = livePageStyle.backgroundColor || "#ffffff";
const bgImage   = livePageStyle.backgroundImage || "";
const bgOpacity =
  livePageStyle.backgroundImageOpacity == null
    ? 1
    : livePageStyle.backgroundImageOpacity;
const ovColor   = livePageStyle.overlayColor || "";
const ovOpacity = Number.isFinite(livePageStyle.overlayOpacity)
  ? livePageStyle.overlayOpacity
  : 0;


// --- Drag helpers for section spacing ---
const UNIT_PX = 8;                 // MUI spacing unit (1 = 8px)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function startSectionDrag(e, i, kind) {
  e.preventDefault();
  e.stopPropagation();

  const start = { x: e.clientX, y: e.clientY };
  const s = safeSections(editing)[i] || {};
  const startVals = {
    spaceAbove: Number(s?.props?.spaceAbove ?? 0),  // theme units
    spaceBelow: Number(s?.props?.spaceBelow ?? 0),  // theme units
    gutterX:    Number(s?.props?.gutterX    ?? (s?.type === "hero" ? 24 : 16)), // px
  };

  // Show appropriate cursor while dragging
  document.body.style.cursor =
    kind === "gutterX" ? "ew-resize" : "ns-resize";

  const onMove = (ev) => {
    const dy = ev.clientY - start.y;
    const dx = ev.clientX - start.x;

    if (kind === "spaceAbove") {
      const nextUnits = clamp(startVals.spaceAbove + Math.round(dy / UNIT_PX), 0, 40);
      setBlockProp(i, "spaceAbove", nextUnits);
    } else if (kind === "spaceBelow") {
      const nextUnits = clamp(startVals.spaceBelow + Math.round(dy / UNIT_PX), 0, 40);
      setBlockProp(i, "spaceBelow", nextUnits);
    } else if (kind === "gutterX") {
      const nextPx = clamp(startVals.gutterX + Math.round(dx / 2), 0, 160);
      setBlockProp(i, "gutterX", nextPx);
    }
  };

  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.body.style.cursor = "";
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}


const CanvasColumn = (
  <SectionCard
    title={t("manager.visualBuilder.canvas.title")}
    description={fullPreview ? t("manager.visualBuilder.canvas.description.full") : t("manager.visualBuilder.canvas.description.block")}
    actions={
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControlLabel
          sx={{ m: 0 }}
          label={t("manager.visualBuilder.canvas.toggles.fullPage")}
          control={
            <Switch
              size="small"
              checked={fullPreview}
              onChange={(_, v) => setFullPreview(v)}
            />
          }
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={canvasHeightMode}
          onChange={(_, v) => v && setCanvasHeightMode(v)}
        >
          <ToggleButton value="short" title={t("manager.visualBuilder.canvas.toggles.titles.short")}>{t("manager.visualBuilder.canvas.toggles.height.short")}</ToggleButton>
          <ToggleButton value="medium" title={t("manager.visualBuilder.canvas.toggles.titles.medium")}>{t("manager.visualBuilder.canvas.toggles.height.medium")}</ToggleButton>
          <ToggleButton value="tall" title={t("manager.visualBuilder.canvas.toggles.titles.tall")}>{t("manager.visualBuilder.canvas.toggles.height.tall")}</ToggleButton>
          <ToggleButton value="auto" title={t("manager.visualBuilder.canvas.toggles.titles.auto")}>{t("manager.visualBuilder.canvas.toggles.height.auto")}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    }
  >

    <ThemeRuntimeProvider overrides={themeOverrides}>
  {/* height-limiter: keeps the canvas compact unless “Auto” */}
  <Box
    sx={{
      maxHeight: fullPreview ? "none" : "60vh",
      overflow: fullPreview ? "visible" : "auto",
      borderRadius: 1,
      border: "1px solid",
      borderColor: "divider",
    }}
  >
    {/* one wrapper for both modes so CSS vars + button rules apply consistently */}
    <Box
      className="page-scope"
      // CSS variables (colors, fonts, buttons, cards, etc.)
      style={pageVars}
      sx={{
        // page background
        position: "relative",
        backgroundColor: bgColor,
        backgroundImage: bgImage
          ? `linear-gradient(rgba(0,0,0,${1 - bgOpacity}), rgba(0,0,0,${1 - bgOpacity})), url(${bgImage})`
          : "none",
        backgroundRepeat: livePageStyle.backgroundRepeat || "no-repeat",
        backgroundSize: livePageStyle.backgroundSize || "cover",
        backgroundPosition: livePageStyle.backgroundPosition || "center",
        backgroundAttachment: livePageStyle.backgroundAttachment || "fixed",

        // overlay on top of background image
        "&::before": bgImage
          ? {
              content: '""',
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundColor: ovColor || "transparent",
              opacity: ovOpacity,
            }
          : undefined,

        // Text uses the CSS vars
        color: "var(--page-body-color)",
        "& .page-scope, &": {
          "--heading-color": "var(--page-heading-color)",
          "--body-color": "var(--page-body-color)",
          "--link-color": "var(--page-link-color)",
          fontFamily: "var(--page-body-font)",
        },

        // Cards read the CSS vars too
        "& .MuiPaper-root": {
          backgroundColor: "var(--page-card-bg)",
          borderRadius: "var(--page-card-radius)",
        },

        /* Buttons (builder + runtime) read our CSS vars */
        "& .MuiButton-root": {
          borderRadius: "var(--page-btn-radius)",
          textTransform: "none",
        },
        "& .MuiButton-contained": {
          backgroundColor: "var(--page-btn-bg)",
          color: "var(--page-btn-color)",
          "&:hover": { filter: "brightness(0.95)" },
        },
        "& .MuiButton-outlined": {
          borderColor: "var(--page-btn-bg)",
          color: "var(--page-btn-bg)",
          backgroundColor: "transparent",
          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.03)",
            borderColor: "var(--page-btn-bg)",
            color: "var(--page-btn-bg)",
          },
        },
        "& .MuiButton-text": { color: "var(--page-btn-bg)" },
      }}
    >
      {/* Full page (single pass) vs block-by-block */}
      {fullPreview ? (
        <RenderSections
          sections={safeSections(editing)}
          layout={editingPreview.layout || "boxed"}
          sectionSpacing={editingPreview?.content?.meta?.sectionSpacing ?? 6}
          defaultGutterX={editingPreview?.content?.meta?.defaultGutterX}
        />
      ) : (
        <Box
          sx={{
            position: "relative",
            // Avoid page-wide gutter so section cards can preview true widths
            px: 0,
          }}
        >
          {/* Drag overlay for section spacing, selection rings, etc. */}
          {safeSections(editing).map((blk, i) => (
            <React.Fragment key={i}>
              {/* Per-section wrapper with selection ring */}
              <Box
                id={`blk-${i}`}
                sx={{
                  position: "relative",
                  outline:
                    selectedBlock === i ? "2px solid rgba(25, 118, 210, 0.8)" : "2px dashed transparent",
                  outlineOffset: 2,
                  borderRadius: 1,
                  transition: "outline-color 120ms ease",
                  mt:
                    blk?.props?.spaceAbove ??
                    (editingPreview?.content?.meta?.sectionSpacing ?? 6),
                  mb:
                    blk?.props?.spaceBelow ??
                    (editingPreview?.content?.meta?.sectionSpacing ?? 6),
                  p: 1,
                  "&:hover": {
                    outline: "2px solid",
                    outlineColor: "primary.light",
                  },
                }}
                
                role="button"
   tabIndex={0}
   onMouseDownCapture={() => {
   // Select in capture phase so inner elements can't swallow the event.
   setSelectedBlock(i);
 }}
onClickCapture={(e) => {
   // If user clicks a real link inside the canvas, don’t leave the builder.
   const anchor = e.target.closest?.("a[href]");
   if (anchor && anchor.getAttribute("href") && !anchor.getAttribute("target")) {
     e.preventDefault();
   }
 }}
              >
                {/* Render the section content */}
                <RenderSections
                  sections={[blk]}
                  layout={editingPreview.layout || "boxed"}
                  sectionSpacing={editingPreview?.content?.meta?.sectionSpacing ?? 6}
                  defaultGutterX={editingPreview?.content?.meta?.defaultGutterX}
                />

                {/* Resizer bars — only when not in full preview and not for the pageStyle block */}
                {!fullPreview && blk?.type !== "pageStyle" && (
                  <>
                    {/* TOP: drag to set spaceAbove (theme units) */}
                    <Box
                      title={t("manager.visualBuilder.canvas.drag.spaceAbove")}
                      onMouseDown={(e) => startSectionDrag(e, i, "spaceAbove")}
                      sx={{
                        position: "absolute",
                        top: -6,
                        left: 12,
                        right: 12,
                        height: 6,
                        borderTop: "2px dashed",
                        borderColor: "primary.light",
                        cursor: "ns-resize",
                        opacity: 0.6,
                        "&:hover": { opacity: 1 },
                        pointerEvents: "auto",
                      }}
                    />
                    {/* BOTTOM: drag to set spaceBelow (theme units) */}
                    <Box
                      title={t("manager.visualBuilder.canvas.drag.spaceBelow")}
                      onMouseDown={(e) => startSectionDrag(e, i, "spaceBelow")}
                      sx={{
                        position: "absolute",
                        bottom: -6,
                        left: 12,
                        right: 12,
                        height: 6,
                        borderBottom: "2px dashed",
                        borderColor: "primary.light",
                        cursor: "ns-resize",
                        opacity: 0.6,
                        "&:hover": { opacity: 1 },
                        pointerEvents: "auto",
                      }}
                    />
                  </>
                )}

                {/* Floating block controls (duplicate / delete) */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 6,
                    display: "flex",
                    gap: 0.5,
                    zIndex: 2,
                  }}
                >
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      size="small"
                      onClick={() => moveBlock(i, "up")}
                      sx={{ color: "white" }}
                      title={t("manager.visualBuilder.canvas.controls.moveUp")}
                    >
                      <ArrowUpwardIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => moveBlock(i, "down")}
                      sx={{ color: "white" }}
                      title={t("manager.visualBuilder.canvas.controls.moveDown")}
                    >
                      <ArrowDownwardIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => duplicateBlock(i)}
                      sx={{ color: "white" }}
                      title={t("manager.visualBuilder.canvas.controls.duplicate")}
                    >
                      <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => deleteBlock(i)}
                      sx={{ color: "white" }}
                      title={t("manager.visualBuilder.canvas.controls.delete")}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </Box>

                {/* Inline sticky inspector slot between blocks */}
                <InlineStickyInspector.Slot
                  index={i}
                  selectedIndex={selectedBlock}
                  block={blk}
                  fi={fi}
                  mode={mode}
                  companyId={companyId}
                  onChangeProps={(np) => setBlockPropsAll(i, np)}
                  onChangeProp={(k, v) => setBlockProp(i, k, v)}
                  renderAdvancedEditor={({ block, onChangeProps, onChangeProp }) => (
                    <SectionInspector
                      block={block}
                      onChangeProp={onChangeProp}
                      onChangeProps={onChangeProps}
                      companyId={companyId}
                    />
                  )}
                />
              </Box>
            </React.Fragment>
          ))}

          {!safeSections(editing).length && !suppressEmptyState && (
            <SectionCard title={t("manager.visualBuilder.canvas.empty.title")} description={t("manager.visualBuilder.canvas.empty.description")}>
              <Typography variant="body1" color="text.secondary">
                {t("manager.visualBuilder.canvas.empty.body")}
              </Typography>
              <Button
                sx={{ mt: 1.5 }}
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => addBlock("hero")}
              >
                {t("manager.visualBuilder.sections.add.hero")}
              </Button>
            </SectionCard>
          )}
        </Box>
      )}
    </Box>
  </Box>
</ThemeRuntimeProvider>

</SectionCard>
);



const InspectorColumn = (
  <SectionCard title={t("manager.visualBuilder.inspector.title")} description={t("manager.visualBuilder.inspector.description")}>
    {/* Theme (Design) palette */}
    <Accordion defaultExpanded>
      <AccordionSummary>{t("manager.visualBuilder.inspector.design")}</AccordionSummary>
      <AccordionDetails>
        <ThemePalettePanel
          value={themeOverrides || {}}
          onChange={setThemeOverrides}
          onSave={saveTheme}
          saving={themeSaving}
          message={themeMsg}
          error={themeErr}
        />
      </AccordionDetails>
    </Accordion>

    {/* NEW — Page Style card always visible above per-section inspector */}
    <PageStyleCard
  value={
    readPageStyleProps(editing) ||
    editing?.content?.meta?.pageStyle ||
    editing?.content?.style ||
    {}
  }
  onChange={(next) => {
    setEditing((cur) => {
      // 1) keep meta.pageStyle
      const content = { ...(cur.content || {}) };
      content.meta  = { ...(content.meta || {}), pageStyle: next };
      // 2) mirror into content.style
      content.style = { ...(content.style || {}), ...next };
      // 3) sync the SECTION so preview & public are consistent
      let updated = { ...cur, content };
      updated = writePageStyleProps(updated, next);
      return withLiftedLayout(updated);
    });
  }}
  onPickImage={(url) => {
    const next = {
      ...(readPageStyleProps(editing) ||
        editing?.content?.meta?.pageStyle ||
        editing?.content?.style ||
        {}),
      backgroundImage: url,
    };
    setEditing((cur) => {
      const content = { ...(cur.content || {}) };
      content.meta  = { ...(content.meta || {}), pageStyle: next };
      content.style = { ...(content.style || {}), ...next };
      let updated = { ...cur, content };
      updated = writePageStyleProps(updated, next);
      return withLiftedLayout(updated);
    });
  }}
  applyToAll={applyPageStyleToAll}
  onToggleApplyToAll={setApplyPageStyleToAll}
  onApplyNow={applyStyleToAllPagesNow}
  companyId={companyId}
  onOpenAdvanced={() => {
    addSection("pageStyle");
    setTimeout(() => {
      document.getElementById("page-style-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }}
/>





    {selectedBlock < 0 ? (
      <Box sx={{ color: "text.secondary" }}>
        <Typography variant="body2">
          {t("manager.visualBuilder.sections.hint")}
        </Typography>
      </Box>
    ) : fi.inspectorMode === "inline" ? (
      <Alert severity="info" sx={{ mt: 2 }}>
        Inline inspector is active — edit controls are shown directly below the
        selected section on the canvas.
      </Alert>
    ) : (
      <>
        {/* Prefer the schema-based editor (TipTap) when a schema exists */}
        {schemaForBlock ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>
              Content
            </Typography>
            <SchemaInspector
              schema={schemaForBlock}
              value={safeSections(editing)[selectedBlock]?.props || {}}
              onChange={(props) => setBlockPropsAll(selectedBlock, props)}
              companyId={companyId}
            />
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            This section type isn’t mapped to a visual inspector yet. You can
            still edit its props below.
          </Alert>
        )}
{/* Quick size & spacing for the selected section */}
{/* Quick size & spacing for the selected section (enterprise-grade) */}
<Box sx={{ mt: 2 }}>
  <Stack direction="row" alignItems="center" spacing={1}>
    <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
      {t("manager.visualBuilder.inspector.sizeSpacing")}
    </Typography>
    <Tooltip title={t("manager.visualBuilder.inspector.resetTooltip")}>
      <Button
        size="small"
        onClick={() => {
          const all = safeSections(editing);
          const blk = all[selectedBlock];
          if (!blk) return;

          // Default paddingY: heroes are usually tighter
          const defaultPy = blk.type === "hero" ? 0 : 32;

          setEditing((cur) => {
            const sections = [...safeSections(cur)];
            const b = { ...sections[selectedBlock] };
            b.sx = { ...(b.sx || {}), py: defaultPy };
            // Optional: clear local overrides so page-wide spacing applies
            b.props = { ...(b.props || {}) };
            delete b.props.spaceAbove;
            delete b.props.spaceBelow;
            sections[selectedBlock] = b;
            return withLiftedLayout({
              ...cur,
              content: { ...(cur.content || {}), sections },
            });
          });
        }}
      >
        {t("manager.visualBuilder.inspector.reset")}
      </Button>
    </Tooltip>
  </Stack>

  {(() => {
    const blk = safeSections(editing)[selectedBlock] || {};
    const currentPy =
      Number(blk?.sx?.py ?? (blk?.type === "hero" ? 0 : 32));
    const spaceAboveUnits =
      Number.isFinite(blk?.props?.spaceAbove) ? Number(blk.props.spaceAbove) : 0;
    const spaceBelowUnits =
      Number.isFinite(blk?.props?.spaceBelow) ? Number(blk.props.spaceBelow) : 0;

    return (
      <Stack spacing={2} sx={{ mt: 1.5 }}>
        {/* Internal padding (top+bottom) */}
        <Box>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">{t("manager.visualBuilder.inspector.sectionPadding")}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {currentPy}px
            </Typography>
          </Stack>
          <Slider
            size="small"
            min={0}
            max={200}
            step={4}
            value={currentPy}
            valueLabelDisplay="auto"
            marks={[
              { value: 0, label: "0" },
              { value: 16, label: "16" },
              { value: 32, label: "32" },
              { value: 64, label: "64" },
              { value: 96, label: "96" },
              { value: 128, label: "128" },
            ]}
            onChange={(_, v) => {
              const py = Number(v || 0);
              setEditing((cur) => {
                const sections = [...safeSections(cur)];
                const b = { ...sections[selectedBlock] };
                b.sx = { ...(b.sx || {}), py };
                sections[selectedBlock] = b;
                return withLiftedLayout({
                  ...cur,
                  content: { ...(cur.content || {}), sections },
                });
              });
            }}
          />
        </Box>

        {/* Gap ABOVE this section (theme units) */}
        <Box>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">
              {t("manager.visualBuilder.inspector.spaceAbove")}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {spaceAboveUnits}u
            </Typography>
          </Stack>
          <Slider
            size="small"
            min={0}
            max={12}
            step={1}
            value={spaceAboveUnits}
            valueLabelDisplay="auto"
            marks={[0,2,4,6,8,10,12].map(v => ({ value: v, label: String(v) }))}
            onChange={(_, v) =>
              setBlockProp(selectedBlock, "spaceAbove", Number(v))
            }
          />
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Tip: {t("manager.visualBuilder.pages.settings.sectionSpacing.hint")}
          </Typography>
        </Box>

        {/* Gap BELOW (optional but handy) */}
        <Box>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">
              {t("manager.visualBuilder.inspector.spaceBelow")}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {spaceBelowUnits}u
            </Typography>
          </Stack>
          <Slider
            size="small"
            min={0}
            max={12}
            step={1}
            value={spaceBelowUnits}
            valueLabelDisplay="auto"
            marks={[0,2,4,6,8,10,12].map(v => ({ value: v, label: String(v) }))}
            onChange={(_, v) =>
              setBlockProp(selectedBlock, "spaceBelow", Number(v))
            }
          />
        </Box>
      </Stack>
    );
  })()}
</Box>

                {/* {t("manager.visualBuilder.inspector.advanced")} — visible inline in Advanced mode, collapsible in {t("manager.visualBuilder.controls.toggles.simpleMode")} */}
        {mode === "advanced" ? (
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>
              {t("manager.visualBuilder.inspector.advanced")}
            </Typography>
            <SectionInspector
              block={safeSections(editing)[selectedBlock]}
              onChangeProp={(k, v) => setBlockProp(selectedBlock, k, v)}
              onChangeProps={(np) => setBlockPropsAll(selectedBlock, np)}
              companyId={companyId}
            />
          </Box>
        ) : (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary>{t("manager.visualBuilder.inspector.advanced")}</AccordionSummary>
            <AccordionDetails>
              <SectionInspector
                block={safeSections(editing)[selectedBlock]}
                onChangeProp={(k, v) => setBlockProp(selectedBlock, k, v)}
                onChangeProps={(np) => setBlockPropsAll(selectedBlock, np)}
                companyId={companyId}
              />
            </AccordionDetails>
          </Accordion>
        )}
      </>
    )}
  </SectionCard>
);

const tabs = [
  {
    label: t("manager.visualBuilder.tabs.build"),
    content: (
      <Stack spacing={2}>
        {ControlsCard}
        {AlertsCard}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            {LeftColumn}
          </Grid>
          <Grid item xs={12} md={6}>
            {CanvasColumn}
          </Grid>
          <Grid item xs={12} md={3}>
            {InspectorColumn}
          </Grid>
        </Grid>
      </Stack>
    ),
  },
];

// ---------- Step 4: loading gate ----------
if (loading) {
  return <div className="p-6 text-sm text-gray-500">{t("manager.visualBuilder.load.loading")}</div>;
}

// ---------- Step 5: auth error panel ----------
if (authError) {
  const next = `/manage/website/builder?company_id=${encodeURIComponent(authError.cid)}&site=${encodeURIComponent(authError.slug)}`;
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">{t("manager.visualBuilder.auth.title")}</h2>
      <p className="text-sm text-gray-600 mb-4">
        {t("manager.visualBuilder.auth.body", { code: authError.code })}
      </p>
      <a
        href={`/login?next=${encodeURIComponent(next)}`}
        className="inline-block px-4 py-2 rounded bg-blue-600 text-white"
      >
        {t("manager.visualBuilder.auth.login")}
      </a>
      <div className="mt-3 text-xs text-gray-500">
        <Trans
          i18nKey="manager.visualBuilder.auth.tip"
          values={{ companyId: String(authError.cid) }}
          components={{ code: <code className="ml-1" /> }}
        />
      </div>
    </div>
  );
}

return (
  <>
    <TabShell
      title={t("manager.visualBuilder.shell.title")}
      description={t("manager.visualBuilder.shell.description")}
      tabs={tabs}
      defaultIndex={0}
    />

    {/* Floating panel (single instance) */}
    <FloatingInspector.Panel
      fi={fi}
      selectedIndex={selectedBlock}
      selectedBlockObj={selectedBlockObj}
      schemaForBlock={schemaForBlock}
      companyId={companyId}
      onChangeProps={(np) => setBlockPropsAll(selectedBlock, np)}
      onChangeProp={(k, v) => setBlockProp(selectedBlock, k, v)}
      renderAdvancedEditor={({ block, onChangeProps, onChangeProp }) => (
        <SectionInspector
          block={block}
          onChangeProp={onChangeProp}
          onChangeProps={onChangeProps}
          companyId={companyId}
        />
      )}
    />

    {/* THEME DRAWER */}
    <Drawer
      anchor="right"
      open={themeOpen}
      onClose={() => {
        setThemeOpen(false);
        if (companyId) {
          wb
            .getSettings(companyId)
            .then((s) => {
              setSettings(s?.data || null);
            })
            .catch(() => {});
        }
      }}
    >
      <Box sx={{ width: { xs: 360, md: 420 }, p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          {t("manager.visualBuilder.drawer.themeDesignerTitle")}
        </Typography>
        <ThemeDesigner companyId={companyId} page="home" />
      </Box>
    </Drawer>

    {/* HELP DRAWER (left) — NEW */}
    <WebsiteBuilderHelpDrawer
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      anchor="left" // keep right side free for the inspector
      onJumpToPageStyle={handleJumpToPageStyle}
      onJumpToNavSettings={handleJumpToNav}
      onJumpToAssets={handleJumpToAssets}
    />
  </>
);
}
