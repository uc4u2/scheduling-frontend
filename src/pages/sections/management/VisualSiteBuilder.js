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
  Checkbox,
  Divider,
  Drawer,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
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
  FormHelperText,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ButtonBase,
  Menu,
  Slider,
  Tab,
  Tabs,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import PublishIcon from "@mui/icons-material/Publish";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import ViewCarouselIcon from "@mui/icons-material/ViewCarousel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"; // NEW
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PaletteIcon from "@mui/icons-material/Palette";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";

import { nanoid } from "nanoid";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { useTranslation, Trans } from "react-i18next";
import { useTheme } from "@mui/material/styles";

import { api, wb, navSettings, publicSite } from "../../../utils/api";
import { normalizeNavStyle } from "../../../utils/navStyle";
import { RenderSections } from "../../../components/website/RenderSections";
import SiteFrame from "../../../components/website/SiteFrame";
import useCompanyId from "../../../hooks/useCompanyId";
import useHistory from "../../../hooks/useHistory";
import WebsiteNavSettingsCard from "../../../components/website/WebsiteNavSettingsCard";
import WebsiteBrandingCard from "../../../components/website/WebsiteBrandingCard";
import NavStyleHydrator from "../../../components/website/NavStyleHydrator";

/** Floating + Inline inspectors and schema registry */
import {
  FloatingInspector,
  useFloatingInspector,
} from "../../../components/website/FloatingInspector";
import { InlineStickyInspector } from "../../../components/website/InlineStickyInspector";
import { SCHEMA_REGISTRY } from "../../../components/website/schemas";
import SchemaInspector from "../../../components/website/SchemaInspector";

/** Moved out pieces */
import SectionInspector, { ImageField } from "../../../components/website/BuilderInspectorParts";
import { NEW_BLOCKS } from "../../../components/website/BuilderBlockTemplates";
import {
  emptyPage,
  normalizePage,
  safeSections,
} from "../../../components/website/BuilderPageUtils";
import {
  defaultHeaderConfig,
  defaultFooterConfig,
  normalizeHeaderConfig,
  normalizeFooterConfig,
} from "../../../utils/headerFooter";

/** Theme designer (drawer content) */
import ThemeDesigner from "../../../components/website/ThemeDesigner";
import { SearchSnippetPreview, SocialCardPreview } from "../../../components/seo/SeoPreview";

/** UI wrappers per design system */
import SectionCard from "../../../components/ui/SectionCard";
import TabShell from "../../../components/ui/TabShell";

/** Enterprise “Easy” panel – default export only */
 //import EnterpriseEditorExtras from "../../../components/website/EnterpriseEditorExtras";

import WebsiteBuilderHelpDrawer from "./WebsiteBuilderHelpDrawer"; // NEW

const BLOCK_PREVIEWS = {
  hero: "/block-previews/hero.png",
  heroCarousel: "/block-previews/heroCarousel.png",
  heroSplit: "/block-previews/heroSplit.png",
  text: "/block-previews/text.png",
  richText: "/block-previews/richText.png",
  gallery: "/block-previews/gallery.png",
  photoGallery: "/block-previews/photoGallery.png",
  collectionShowcase: "/block-previews/collectionShowcase.png",
  featureZigzagModern: "/block-previews/featureZigzagModern.png",
  discoverStory: "/block-previews/discoverStory.png",
  logoCloud: "/block-previews/logoCloud.png",
  workshopsCommissions: "/block-previews/workshopsCommissions.png",
  textFree: "/block-previews/textFree.png",
  galleryCarousel: "/block-previews/galleryCarousel.png",
  faq: "/block-previews/faq.png",
  serviceGrid: "/block-previews/serviceGrid.png",
  teamGrid: "/block-previews/teamGrid.png",
  contact: "/block-previews/contact.png",
  contactForm: "/block-previews/contactForm.png",
  cta: "/block-previews/cta.png",
  bookingCtaBar: "/block-previews/bookingCtaBar.png",
  footer: "/block-previews/footer.png",
};
/** Local shims so the app renders even if helpers aren’t exported yet */
const CollapsibleSection = ({
  id,
  title,
  description,
  actions,
  children,
  defaultExpanded = false,
  expanded,
  onChange,
}) => {
  const accordionProps =
    typeof expanded === "boolean"
      ? { expanded }
      : { defaultExpanded };

  return (
  <Accordion
    disableGutters
    id={id}
    {...accordionProps}
    sx={{
      borderRadius: 3,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      boxShadow: "none",
      overflow: "hidden",
      "&:before": { display: "none" },
    }}
    onChange={(event, next) => onChange?.(next, event)}
  >
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      sx={{ px: 3, py: 2 }}
    >
      <Box sx={{ flexGrow: 1, pr: actions ? 2 : 0 }}>
        {title ? (
          typeof title === "string" ? (
            <Typography variant="h6" fontWeight={700}>
              {title}
            </Typography>
          ) : (
            title
          )
        ) : null}
        {description ? (
          typeof description === "string" ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : (
            description
          )
        ) : null}
      </Box>
      {actions ? (
        <Box
          sx={{ ml: 2, display: "flex", alignItems: "center", gap: 1 }}
          onClick={(event) => event.stopPropagation()}
          onFocus={(event) => event.stopPropagation()}
        >
          {actions}
        </Box>
      ) : null}
    </AccordionSummary>
    <AccordionDetails sx={{ px: 3, py: 2 }}>
      {children}
    </AccordionDetails>
  </Accordion>
  );
};

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

const buildCanonicalUrl = (page, canonicalBase, fallbackBase) => {
  const base = (canonicalBase || fallbackBase || "").replace(/\/$/, "");
  if (!base) return "";
  const override = (page?.canonical_path || "").trim();
  if (override.startsWith("http://") || override.startsWith("https://")) return override;
  if (override.startsWith("/") || override.startsWith("?")) return `${base}${override}`;
  if (override) return `${base}/${override.replace(/^\/+/, "")}`;
  const slug = (page?.slug || "").trim();
  if (page?.is_homepage || slug.toLowerCase() === "home") return base;
  if (page?.path) {
    const path = page.path.startsWith("/") ? page.path : `/${page.path}`;
    return `${base}${path}`;
  }
  if (!slug) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}page=${encodeURIComponent(slug)}`;
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
    secondaryBackground: "",
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

/* ---------- Navigation settings helpers ---------- */
const deriveNavDraft = (styleSource) => {
  if (!styleSource) return null;
  const style = normalizeNavStyle(styleSource);
  return { nav_style: style };
};

const mergeNavIntoSettings = (current, draft) => {
  if (!draft?.nav_style) return current;
  const style = normalizeNavStyle(draft.nav_style);
  const base = current ? { ...current } : {};
  return {
    ...base,
    nav_style: style,
    settings: {
      ...(base.settings || {}),
      nav_style: style,
    },
  };
};

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
  const cardColor   = style.cardBg || style.cardColor || "rgba(255,255,255,1)";
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

    // secondary background accent
    "--page-secondary-bg":
      style.secondaryBackground ||
      style.secondaryBackgroundColor ||
      "",
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
  const fallbackSecondaryHex = "#1d4ed8";
  const isAdvancedSecondaryValue = (val) => {
    if (!val || typeof val !== "string") return false;
    const s = val.trim().toLowerCase();
    if (!s) return false;
    if (s.startsWith("#")) return false;
    if (s.startsWith("rgb")) return false;
    return true;
  };
  const secondaryColorHex = (() => {
    const raw = v.secondaryBackground;
    if (!raw || typeof raw !== "string") return fallbackSecondaryHex;
    const trimmed = raw.trim();
    if (!trimmed) return fallbackSecondaryHex;
    if (trimmed.startsWith("#")) {
      return normalizeHexColor(trimmed) || fallbackSecondaryHex;
    }
    if (/^rgba?\(/i.test(trimmed)) {
      return parseCssColor(trimmed, 1).hex || fallbackSecondaryHex;
    }
    return fallbackSecondaryHex;
  })();
  const [secondaryAdvanced, setSecondaryAdvanced] = useState(
    isAdvancedSecondaryValue(v.secondaryBackground)
  );
  useEffect(() => {
    setSecondaryAdvanced(isAdvancedSecondaryValue(v.secondaryBackground));
  }, [v.secondaryBackground]);
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

  const shadowPresets = [
    { key: "none", label: "None", value: "" },
    { key: "soft", label: "Soft", value: "0 8px 24px rgba(0,0,0,0.12)" },
    { key: "medium", label: "Medium", value: "0 12px 32px rgba(0,0,0,0.18)" },
    { key: "strong", label: "Strong", value: "0 18px 48px rgba(0,0,0,0.24)" },
    { key: "glass", label: "Glass", value: "0 12px 32px rgba(15,23,42,0.28)" },
  ];
  const matchShadowPreset = (val) =>
    shadowPresets.find((preset) => (val || "").trim() === preset.value) || null;
  const cardShadowPreset = matchShadowPreset(v.cardShadow)?.key || "custom";
  const heroShadowPreset = matchShadowPreset(v.heroHeadingShadow)?.key || "custom";
  const isShadowValid = (val) =>
    !val ||
    /-?\d+px\s+-?\d+px/.test(val) ||
    /rgba?\(/i.test(val) ||
    /#/.test(val);

  const overlayOpacityValue = clamp01(v.overlayOpacity ?? 0);
  const cardOpacityValue = clamp01(cardOpacityInput);
  const cardRadiusValue = Number.isFinite(Number(v.cardRadius)) ? Number(v.cardRadius) : 12;
  const cardBlurValue = Number.isFinite(Number(v.cardBlur)) ? Number(v.cardBlur) : 0;

  const gradientDefaults = {
    angle: 135,
    start: "#1d4ed8",
    end: "#14b8a6",
  };
  const [gradientAngle, setGradientAngle] = useState(gradientDefaults.angle);
  const [gradientStart, setGradientStart] = useState(gradientDefaults.start);
  const [gradientEnd, setGradientEnd] = useState(gradientDefaults.end);

  const colorField = ({
    label,
    value,
    onChange: onColorChange,
    helperText,
    disabled,
  }) => {
    const normalized = normalizeHexColor(value) || "#000000";
    return (
      <TextField
        size="small"
        label={label}
        value={value || ""}
        onChange={(e) => onColorChange(e.target.value)}
        helperText={helperText}
        disabled={disabled}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <ButtonBase
                component="label"
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: normalized,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                <Box
                  component="input"
                  type="color"
                  value={normalized}
                  onChange={(e) => onColorChange(e.target.value)}
                  disabled={disabled}
                  sx={{
                    opacity: 0,
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                />
              </ButtonBase>
            </InputAdornment>
          ),
        }}
      />
    );
  };

  const [pageStyleTab, setPageStyleTab] = useState("style");
  const [cardShadowBuilderOpen, setCardShadowBuilderOpen] = useState(false);
  const [heroShadowBuilderOpen, setHeroShadowBuilderOpen] = useState(false);
  const initialStyleRef = useRef(value || {});
  const isDirty = useMemo(
    () => JSON.stringify(value || {}) !== JSON.stringify(initialStyleRef.current || {}),
    [value]
  );

  const parseBoxShadow = (val) => {
    const fallback = { x: 0, y: 12, blur: 32, spread: 0, color: "#000000", opacity: 0.18 };
    if (!val || typeof val !== "string") return fallback;
    const match =
      /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px(?:\s+(-?\d+(?:\.\d+)?)px)?\s+(.+)/.exec(
        val.trim()
      );
    if (!match) return fallback;
    const parsedColor = parseCssColor(match[5], fallback.opacity);
    return {
      x: Number(match[1]),
      y: Number(match[2]),
      blur: Number(match[3]),
      spread: Number(match[4] || 0),
      color: parsedColor.hex || fallback.color,
      opacity: parsedColor.opacity,
    };
  };

  const parseTextShadow = (val) => {
    const fallback = { x: 0, y: 6, blur: 18, color: "#000000", opacity: 0.25 };
    if (!val || typeof val !== "string") return fallback;
    const match =
      /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px\s+(.+)/.exec(
        val.trim()
      );
    if (!match) return fallback;
    const parsedColor = parseCssColor(match[4], fallback.opacity);
    return {
      x: Number(match[1]),
      y: Number(match[2]),
      blur: Number(match[3]),
      color: parsedColor.hex || fallback.color,
      opacity: parsedColor.opacity,
    };
  };

  const buildBoxShadow = ({ x, y, blur, spread, color, opacity }) =>
    `${x}px ${y}px ${blur}px ${spread}px ${hexToRgba(color, opacity)}`;
  const buildTextShadow = ({ x, y, blur, color, opacity }) =>
    `${x}px ${y}px ${blur}px ${hexToRgba(color, opacity)}`;

  const cardShadowValues = parseBoxShadow(v.cardShadow || "");
  const heroShadowValues = parseTextShadow(v.heroHeadingShadow || "");
  const updateCardShadow = (patch) => {
    const next = { ...cardShadowValues, ...patch };
    set({ cardShadow: buildBoxShadow(next) });
  };
  const updateHeroShadow = (patch) => {
    const next = { ...heroShadowValues, ...patch };
    set({ heroHeadingShadow: buildTextShadow(next) });
  };

  return (
    <Stack id="page-style-card" spacing={1.5}>
      <Tabs
        value={pageStyleTab}
        onChange={(_, v) => setPageStyleTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab value="content" label="Content" />
        <Tab value="style" label="Style" />
        <Tab value="advanced" label="Advanced" />
      </Tabs>

      {pageStyleTab === "content" && (
        <Stack spacing={1.25}>
          <Typography variant="subtitle2">Background image</Typography>
          <ImageField
            label="Background image"
            value={v.backgroundImage || ""}
            onChange={(url) => set({ backgroundImage: url })}
            companyId={companyId}
          />
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
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
            </Grid>
            <Grid item xs={12} sm={6}>
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
            </Grid>
            <Grid item xs={12} sm={6}>
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Controls whether the background scrolls with the page." arrow>
                <Select
                  size="small"
                  value={v.backgroundAttachment || "scroll"}
                  onChange={(e) => set({ backgroundAttachment: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="scroll">{t("manager.visualBuilder.pageStyle.background.attachment.scroll")}</MenuItem>
                  <MenuItem value="fixed">{t("manager.visualBuilder.pageStyle.background.attachment.fixed")}</MenuItem>
                </Select>
              </Tooltip>
            </Grid>
          </Grid>
        </Stack>
      )}

      {pageStyleTab === "style" && (
        <Stack spacing={1.25}>
          <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.background.heading")}</Typography>
          {colorField({
            label: t("manager.visualBuilder.pageStyle.background.color"),
            value: v.backgroundColor || "#ffffff",
            onChange: (val) => set({ backgroundColor: val }),
          })}
          <Stack direction="row" spacing={1}>
            {colorField({
              label: t("manager.visualBuilder.pageStyle.background.secondaryColor", {
                defaultValue: "Secondary background",
              }),
              value: secondaryAdvanced ? fallbackSecondaryHex : secondaryColorHex,
              onChange: (val) => {
                const nextColor = normalizeHexColor(val || fallbackSecondaryHex);
                set({ secondaryBackground: nextColor });
                if (secondaryAdvanced) setSecondaryAdvanced(false);
              },
              disabled: secondaryAdvanced,
            })}
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSecondaryAdvanced(true);
                setPageStyleTab("advanced");
              }}
            >
              {t("manager.visualBuilder.pageStyle.background.customCss", {
                defaultValue: "Custom CSS",
              })}
            </Button>
          </Stack>

          {colorField({
            label: t("manager.visualBuilder.pageStyle.background.overlayColor"),
            value: v.overlayColor || "#000000",
            onChange: (val) => set({ overlayColor: val }),
            helperText: "Use with overlay opacity for readability.",
          })}
          <Stack spacing={1}>
            <Tooltip title="Controls how dark the background overlay appears." arrow>
              <Typography variant="caption" color="text.secondary">
                {t("manager.visualBuilder.pageStyle.background.overlayOpacity")}
              </Typography>
            </Tooltip>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                min={0}
                max={1}
                step={0.05}
                value={overlayOpacityValue}
                valueLabelDisplay="auto"
                onChange={(_, val) =>
                  typeof val === "number" && set({ overlayOpacity: clamp01(val) })
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                value={overlayOpacityValue}
                onChange={(e) =>
                  set({ overlayOpacity: clamp01(Number(e.target.value || 0)) })
                }
                inputProps={{ step: 0.05, min: 0, max: 1 }}
                sx={{ width: 90 }}
              />
            </Stack>
          </Stack>

          <Divider />
          <Typography variant="subtitle2">Typography</Typography>
          <Stack direction="row" spacing={1}>
            {colorField({
              label: "Heading color",
              value: v.headingColor || "#111827",
              onChange: (val) => set({ headingColor: val }),
            })}
            {colorField({
              label: "Body color",
              value: v.bodyColor || "#374151",
              onChange: (val) => set({ bodyColor: val }),
            })}
          </Stack>
          {colorField({
            label: "Link color",
            value: v.linkColor || "#2563eb",
            onChange: (val) => set({ linkColor: val }),
          })}
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Heading font"
              value={v.headingFont || ""}
              onChange={(e) => set({ headingFont: e.target.value })}
              placeholder="e.g. Inter, serif"
              fullWidth
            />
            <TextField
              size="small"
              label="Body font"
              value={v.bodyFont || ""}
              onChange={(e) => set({ bodyFont: e.target.value })}
              placeholder="e.g. Inter, sans-serif"
              fullWidth
            />
          </Stack>

          <Divider />
          <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.card.heading")}</Typography>
          {colorField({
            label: t("manager.visualBuilder.pageStyle.card.backgroundColor"),
            value: cardColorInput,
            onChange: (val) => applyCardValues(val || cardColorInput, cardOpacityValue),
          })}
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {t("manager.visualBuilder.pageStyle.card.opacity")}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                min={0}
                max={1}
                step={0.05}
                value={cardOpacityValue}
                valueLabelDisplay="auto"
                onChange={(_, val) =>
                  typeof val === "number" && applyCardValues(cardColorInput, clamp01(val))
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                value={cardOpacityValue}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (Number.isFinite(num)) applyCardValues(cardColorInput, clamp01(num));
                }}
                inputProps={{ step: 0.05, min: 0, max: 1 }}
                sx={{ width: 90 }}
              />
            </Stack>
            <FormHelperText>Higher opacity makes cards more solid.</FormHelperText>
          </Stack>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {t("manager.visualBuilder.pageStyle.card.radius")}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                min={0}
                max={32}
                step={1}
                value={cardRadiusValue}
                valueLabelDisplay="auto"
                onChange={(_, val) =>
                  typeof val === "number" && set({ cardRadius: val })
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                value={cardRadiusValue}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (Number.isFinite(num)) set({ cardRadius: Math.max(0, Math.min(32, num)) });
                }}
                inputProps={{ step: 1, min: 0, max: 32 }}
                sx={{ width: 90 }}
              />
            </Stack>
          </Stack>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {t("manager.visualBuilder.pageStyle.card.blur")}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                min={0}
                max={30}
                step={1}
                value={cardBlurValue}
                valueLabelDisplay="auto"
                onChange={(_, val) =>
                  typeof val === "number" && set({ cardBlur: val })
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                value={cardBlurValue}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (Number.isFinite(num)) set({ cardBlur: Math.max(0, Math.min(30, num)) });
                }}
                inputProps={{ step: 1, min: 0, max: 30 }}
                sx={{ width: 90 }}
              />
            </Stack>
          </Stack>

          <Divider />
          <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.buttons.heading")}</Typography>
          <Stack direction="row" spacing={1}>
            {colorField({
              label: t("manager.visualBuilder.pageStyle.buttons.background"),
              value: v.btnBg || "#1976d2",
              onChange: (val) => set({ btnBg: val }),
            })}
            {colorField({
              label: t("manager.visualBuilder.pageStyle.buttons.textColor"),
              value: v.btnColor || "#ffffff",
              onChange: (val) => set({ btnColor: val }),
            })}
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

          <Divider />
          <Stack spacing={1}>
            <Typography variant="subtitle2">
              {t("manager.visualBuilder.pageStyle.layout.bottomSpacing", {
                defaultValue: "Page bottom spacing",
              })}
            </Typography>
            <Slider
              size="small"
              min={0}
              max={200}
              value={v.pageBottomSpacing ?? 0}
              valueLabelDisplay="auto"
              onChange={(_, val) =>
                typeof val === "number" && set({ pageBottomSpacing: val })
              }
            />
          </Stack>
        </Stack>
      )}

      {pageStyleTab === "advanced" && (
        <Stack spacing={1.25}>
          <Typography variant="subtitle2">Secondary background (CSS / gradient)</Typography>
          <TextField
            size="small"
            label={t("manager.visualBuilder.pageStyle.background.secondaryAdvanced", {
              defaultValue: "Secondary background (CSS or gradient)",
            })}
            value={v.secondaryBackground || ""}
            onChange={(e) => set({ secondaryBackground: e.target.value })}
            placeholder="linear-gradient(135deg, #1d4ed8 0%, #14b8a6 100%)"
            fullWidth
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Examples</InputLabel>
            <Select
              label="Examples"
              value=""
              onChange={(e) => {
                const next = e.target.value;
                if (!next) return;
                setSecondaryAdvanced(true);
                set({ secondaryBackground: next });
              }}
            >
              <MenuItem value="">
                <em>Choose preset…</em>
              </MenuItem>
              <MenuItem value="linear-gradient(135deg, #1d4ed8 0%, #14b8a6 100%)">
                Sapphire → Teal
              </MenuItem>
              <MenuItem value="linear-gradient(120deg, #0f172a 0%, #1f2937 100%)">
                Midnight Slate
              </MenuItem>
              <MenuItem value="linear-gradient(135deg, #f97316 0%, #fde68a 100%)">
                Amber Sunrise
              </MenuItem>
              <MenuItem value="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)">
                Violet Glass
              </MenuItem>
            </Select>
            <FormHelperText>Fill with a ready-made CSS gradient.</FormHelperText>
          </FormControl>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Quick gradient builder
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                min={0}
                max={360}
                value={gradientAngle}
                valueLabelDisplay="auto"
                onChange={(_, val) => typeof val === "number" && setGradientAngle(val)}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Angle"
                value={gradientAngle}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (Number.isFinite(num)) setGradientAngle(Math.max(0, Math.min(360, num)));
                }}
                sx={{ width: 100 }}
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              {colorField({
                label: "Start color",
                value: gradientStart,
                onChange: (val) => setGradientStart(normalizeHexColor(val) || gradientStart),
              })}
              {colorField({
                label: "End color",
                value: gradientEnd,
                onChange: (val) => setGradientEnd(normalizeHexColor(val) || gradientEnd),
              })}
            </Stack>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSecondaryAdvanced(true);
                set({
                  secondaryBackground: `linear-gradient(${gradientAngle}deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
                });
              }}
            >
              Apply gradient
            </Button>
          </Stack>

          <Divider />
          <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.card.shadow")}</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>Card shadow preset</InputLabel>
            <Select
              label="Card shadow preset"
              value={cardShadowPreset}
              onChange={(e) => {
                const key = e.target.value;
                if (key === "custom") return;
                const preset = shadowPresets.find((p) => p.key === key);
                set({ cardShadow: preset ? preset.value : "" });
              }}
            >
              {shadowPresets.map((preset) => (
                <MenuItem key={preset.key} value={preset.key}>
                  {preset.label}
                </MenuItem>
              ))}
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
            <FormHelperText>Pick a preset or customize with the builder.</FormHelperText>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setCardShadowBuilderOpen((prev) => !prev)}
            >
              {cardShadowBuilderOpen ? "Hide builder" : "Shadow builder"}
            </Button>
            {cardShadowPreset !== "custom" && (
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  const preset = shadowPresets.find((p) => p.key === cardShadowPreset);
                  set({ cardShadow: preset ? preset.value : "" });
                }}
              >
                Reset to preset
              </Button>
            )}
          </Stack>
          {cardShadowBuilderOpen && (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  label="X"
                  type="number"
                  value={cardShadowValues.x}
                  onChange={(e) => updateCardShadow({ x: Number(e.target.value || 0) })}
                />
                <TextField
                  size="small"
                  label="Y"
                  type="number"
                  value={cardShadowValues.y}
                  onChange={(e) => updateCardShadow({ y: Number(e.target.value || 0) })}
                />
                <TextField
                  size="small"
                  label="Blur"
                  type="number"
                  value={cardShadowValues.blur}
                  onChange={(e) => updateCardShadow({ blur: Number(e.target.value || 0) })}
                />
                <TextField
                  size="small"
                  label="Spread"
                  type="number"
                  value={cardShadowValues.spread}
                  onChange={(e) => updateCardShadow({ spread: Number(e.target.value || 0) })}
                />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {colorField({
                  label: "Shadow color",
                  value: cardShadowValues.color,
                  onChange: (val) => updateCardShadow({ color: val }),
                })}
                <Stack spacing={0.5} sx={{ minWidth: 140 }}>
                  <Typography variant="caption">Opacity</Typography>
                  <Slider
                    size="small"
                    min={0}
                    max={1}
                    step={0.05}
                    value={cardShadowValues.opacity}
                    valueLabelDisplay="auto"
                    onChange={(_, val) =>
                      typeof val === "number" && updateCardShadow({ opacity: val })
                    }
                  />
                </Stack>
              </Stack>
            </Stack>
          )}
          {cardShadowPreset === "custom" && (
            <TextField
              size="small"
              label={t("manager.visualBuilder.pageStyle.card.shadow")}
              value={v.cardShadow || ""}
              onChange={(e) => set({ cardShadow: e.target.value })}
              placeholder={t("manager.visualBuilder.pageStyle.card.shadowExample")}
              error={!isShadowValid(v.cardShadow || "")}
              helperText={
                isShadowValid(v.cardShadow || "")
                  ? "Example: 0 8px 24px rgba(0,0,0,0.12)"
                  : "Enter a valid CSS shadow (e.g. 0 8px 24px rgba(0,0,0,0.12))"
              }
              fullWidth
            />
          )}

          <Divider />
          <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.hero.heading")}</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>Hero shadow preset</InputLabel>
            <Select
              label="Hero shadow preset"
              value={heroShadowPreset}
              onChange={(e) => {
                const key = e.target.value;
                if (key === "custom") return;
                const preset = shadowPresets.find((p) => p.key === key);
                set({ heroHeadingShadow: preset ? preset.value : "" });
              }}
            >
              {shadowPresets.map((preset) => (
                <MenuItem key={preset.key} value={preset.key}>
                  {preset.label}
                </MenuItem>
              ))}
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
            <FormHelperText>Pick a preset or customize with the builder.</FormHelperText>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setHeroShadowBuilderOpen((prev) => !prev)}
            >
              {heroShadowBuilderOpen ? "Hide builder" : "Shadow builder"}
            </Button>
            {heroShadowPreset !== "custom" && (
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  const preset = shadowPresets.find((p) => p.key === heroShadowPreset);
                  set({ heroHeadingShadow: preset ? preset.value : "" });
                }}
              >
                Reset to preset
              </Button>
            )}
          </Stack>
          {heroShadowBuilderOpen && (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  label="X"
                  type="number"
                  value={heroShadowValues.x}
                  onChange={(e) => updateHeroShadow({ x: Number(e.target.value || 0) })}
                />
                <TextField
                  size="small"
                  label="Y"
                  type="number"
                  value={heroShadowValues.y}
                  onChange={(e) => updateHeroShadow({ y: Number(e.target.value || 0) })}
                />
                <TextField
                  size="small"
                  label="Blur"
                  type="number"
                  value={heroShadowValues.blur}
                  onChange={(e) => updateHeroShadow({ blur: Number(e.target.value || 0) })}
                />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {colorField({
                  label: "Shadow color",
                  value: heroShadowValues.color,
                  onChange: (val) => updateHeroShadow({ color: val }),
                })}
                <Stack spacing={0.5} sx={{ minWidth: 140 }}>
                  <Typography variant="caption">Opacity</Typography>
                  <Slider
                    size="small"
                    min={0}
                    max={1}
                    step={0.05}
                    value={heroShadowValues.opacity}
                    valueLabelDisplay="auto"
                    onChange={(_, val) =>
                      typeof val === "number" && updateHeroShadow({ opacity: val })
                    }
                  />
                </Stack>
              </Stack>
            </Stack>
          )}
          {heroShadowPreset === "custom" && (
            <TextField
              size="small"
              label={t("manager.visualBuilder.pageStyle.hero.shadow")}
              value={v.heroHeadingShadow || "0 2px 24px rgba(0,0,0,.25)"}
              onChange={(e) => set({ heroHeadingShadow: e.target.value })}
              error={!isShadowValid(v.heroHeadingShadow || "")}
              helperText={
                isShadowValid(v.heroHeadingShadow || "")
                  ? "Example: 0 2px 24px rgba(0,0,0,0.25)"
                  : "Enter a valid CSS shadow."
              }
              fullWidth
            />
          )}
        </Stack>
      )}

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
      </Stack>

      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          pt: 1,
          pb: 1,
          px: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography variant="caption" color={isDirty ? "warning.main" : "text.secondary"}>
          {isDirty ? "Unsaved changes" : "All changes saved"}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onChange?.(initialStyleRef.current || {})}
            disabled={!isDirty}
          >
            Reset
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={onApplyNow}
            disabled={!onApplyNow}
          >
            {t("manager.visualBuilder.pageStyle.applyNow")}
          </Button>
        </Stack>
      </Box>

      <Button
        size="small"
        variant="contained"
        startIcon={<PaletteIcon />}
        onClick={onOpenAdvanced}
      >
        {t("manager.visualBuilder.pageStyle.openAdvanced")}
      </Button>
    </Stack>
  );

}



/* ---------- Main builder ---------- */

export default function VisualSiteBuilder({ companyId: companyIdProp }) {
  // prefer explicit prop if parent passed one
  const { t } = useTranslation();
  const location = useLocation();                 // ✅ use the hook, not window.location
  const detectedCompanyId = useCompanyId();       // ✅ get it from the hook
  const theme = useTheme();
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [companyId, setCompanyId] = useState(     // ✅ local state
    companyIdProp ?? detectedCompanyId ?? ""
  );
  const supportQuery = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    const supportSession = params.get("support_session");
    if (!supportSession) return "";
    const cid =
      params.get("company_id") ||
      params.get("cid") ||
      companyId ||
      companyIdProp ||
      detectedCompanyId;
    const out = new URLSearchParams();
    out.set("support_session", supportSession);
    if (cid) out.set("company_id", String(cid));
    return `?${out.toString()}`;
  }, [location.search, companyId, companyIdProp, detectedCompanyId]);

  // local state the component already uses elsewhere
  const defaultThemeOverrides = useMemo(
    () => ({
      brandColor: "#6366F1",
      surface: "light",
      header: { background: "#111827", text: "#ffffff" },
      footer: { background: "#0f172a", text: "#e2e8f0" },
      radius: 20,
      shadow: "md",
    }),
    []
  );

  const [siteSettings, setSiteSettings] = useState(null);
  const [companyProfileSlug, setCompanyProfileSlug] = useState("");
  const [pageSettingsDirty, setPageSettingsDirty] = useState(false);
  const [pageMenuAnchor, setPageMenuAnchor] = useState(null);
  const [pageMenuTarget, setPageMenuTarget] = useState(null);
  const [toolsAnchorEl, setToolsAnchorEl] = useState(null);
  const rawNavOverrides = useMemo(
    () =>
      siteSettings?.nav_overrides ||
      siteSettings?.settings?.nav_overrides ||
      {},
    [siteSettings]
  );

  const navOverridesWithDefault = useMemo(() => {
    const base = { ...(rawNavOverrides || {}) };
    if (!base.menu_source) {
      base.menu_source = "pages";
    }
    return base;
  }, [rawNavOverrides]);
  const [navStyleState, setNavStyleState] = useState(null);
  const [themeOverridesDraft, setThemeOverridesDraft] = useState(defaultThemeOverrides);
  const [pages, setPages] = useState([]);
  const [selectedPageIds, setSelectedPageIds] = useState([]);
  const [navDraft, setNavDraft] = useState(null);
  const [navSaving, setNavSaving] = useState(false);
  const [navMsg, setNavMsg] = useState("");
  const [navErr, setNavErr] = useState("");
  const [headerDraft, setHeaderDraft] = useState(() => defaultHeaderConfig());
  const [footerDraft, setFooterDraft] = useState(() => defaultFooterConfig());
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingMsg, setBrandingMsg] = useState("");
const [brandingErr, setBrandingErr] = useState("");

  const applyBrandingFromServer = useCallback(
    (settingsObj) => {
      if (!settingsObj) return;
      const headerFromServer = normalizeHeaderConfig(
        settingsObj.header || settingsObj.settings?.header || defaultHeaderConfig()
      );
      const footerFromServer = normalizeFooterConfig(
        settingsObj.footer || settingsObj.settings?.footer || defaultFooterConfig()
      );
      const themeOverrides =
        settingsObj.theme_overrides ||
        settingsObj.settings?.theme_overrides ||
        defaultThemeOverrides;
      setHeaderDraft(headerFromServer);
      setFooterDraft(footerFromServer);
      setThemeOverridesDraft(themeOverrides || defaultThemeOverrides);
    },
    [defaultThemeOverrides]
  );

  const hasDraftChanges = Boolean(siteSettings?.has_unpublished_changes);
  const lastPublishedLabel = useMemo(() => {
    const ts = siteSettings?.branding_published_at;
    if (!ts) return null;
    try {
      const date = new Date(ts);
      if (Number.isNaN(date.getTime())) return null;
      return `Published ${date.toLocaleString()}`;
    } catch {
      return null;
    }
  }, [siteSettings?.branding_published_at]);

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

useEffect(() => {
    if (!navStyleState) return;
    setNavDraft((prev) => {
      const next = deriveNavDraft(navStyleState);
      const prevHash = prev ? JSON.stringify(prev) : null;
      const nextHash = JSON.stringify(next);
      if (prevHash === nextHash) return prev;
      return next;
    });
  }, [navStyleState]);

  const justImported = Boolean(location.state?.postImportReload);
  const [suppressEmptyState, setSuppressEmptyState] = useState(justImported);

  // UI state (needs to live before effects that reference it)
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
const [pagesListOpen, setPagesListOpen] = useState(false);
const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
const [inspectorOpen, setInspectorOpen] = useState(false);
const [inspectorTab, setInspectorTab] = useState("content");
const [pageStyleOpen, setPageStyleOpen] = useState(false);
const canvasScrollRef = useRef(null);
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);
  const [brandingPanelOpen, setBrandingPanelOpen] = useState(false);

useEffect(() => {
  if (!justImported) return;
  const t = setTimeout(() => setSuppressEmptyState(false), 400);
  return () => clearTimeout(t);
}, [justImported]);

useEffect(() => {
  if (!isLgDown && inspectorDrawerOpen) {
    setInspectorDrawerOpen(false);
  }
}, [isLgDown, inspectorDrawerOpen]);

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
        const [settingsRes, pagesRes, profileRes] = await Promise.all([
          wb.getSettings(companyId),
          wb.listPages(companyId),
          api.get("/admin/company-profile").catch(() => null),
        ]);

        const pagesList =
          Array.isArray(pagesRes?.data) ? pagesRes.data :
          (pagesRes?.data?.items || []);

        const settingsPayload = settingsRes?.data ?? settingsRes ?? null;
        setSiteSettings(settingsPayload);
        const profileSlug =
          profileRes?.data?.slug ||
          profileRes?.data?.company?.slug ||
          "";
        if (profileSlug) setCompanyProfileSlug(String(profileSlug));
        applyBrandingFromServer(settingsPayload);
        setNavDraft(deriveNavDraft(settingsPayload));
        setNavMsg("");
        setNavErr("");

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
  }, [companyId, slug, location?.key, applyBrandingFromServer]);


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
  const [blockPreview, setBlockPreview] = useState({
    open: false,
    src: "",
    label: "",
  });

  useEffect(() => {
    setPageSettingsDirty(false);
  }, [editing?.id]);


useEffect(() => {
  if (selectedBlock >= 0) {
    setInspectorOpen(true);
  }
}, [selectedBlock]);

const handleNavDraftChange = useCallback(
  (draft) => {
    if (!draft) return;
    const normalized = normalizeNavStyle(draft?.nav_style || {});
    setNavDraft({ nav_style: normalized });
    setNavMsg("");
    setNavErr("");
    setNavStyleState(normalized);
    setSiteSettings((prev) => mergeNavIntoSettings(prev, { nav_style: normalized }));
  },
  [setSiteSettings]
);

const openBlockPreview = useCallback((type, label) => {
  const src = BLOCK_PREVIEWS[type];
  if (!src) return;
  setBlockPreview({ open: true, src, label });
}, []);

  const closeBlockPreview = useCallback(() => {
    setBlockPreview((prev) => ({ ...prev, open: false }));
  }, []);

const openToolsMenu = useCallback((event) => {
  event.stopPropagation();
  setToolsAnchorEl(event.currentTarget);
}, []);

const closeToolsMenu = useCallback(() => {
  setToolsAnchorEl(null);
}, []);

const handlePageMenuOpen = useCallback((event, page) => {
  event.stopPropagation();
  setPageMenuAnchor(event.currentTarget);
  setPageMenuTarget(page);
}, []);

const handlePageMenuClose = useCallback(() => {
  setPageMenuAnchor(null);
  setPageMenuTarget(null);
}, []);

const handleHeaderDraftChange = useCallback(
  (draft) => {
    if (!draft) return;
    const normalized = normalizeHeaderConfig(draft);
    setHeaderDraft(normalized);
    setBrandingMsg("");
    setBrandingErr("");
    setSiteSettings((prev) => ({
      ...(prev || {}),
      header: normalized,
      settings: {
        ...(prev?.settings || {}),
        header: normalized,
      },
    }));
  },
  [setSiteSettings]
);

const handleFooterDraftChange = useCallback(
  (draft) => {
    if (!draft) return;
    const normalized = normalizeFooterConfig(draft);
    setFooterDraft(normalized);
    setBrandingMsg("");
    setBrandingErr("");
    setSiteSettings((prev) => ({
      ...(prev || {}),
      footer: normalized,
      settings: {
        ...(prev?.settings || {}),
        footer: normalized,
      },
    }));
  },
  [setSiteSettings]
);

const handleNavOverridesChange = useCallback(
  (nextOverrides) => {
    if (!nextOverrides) return;
    setBrandingMsg("");
    setBrandingErr("");
    setSiteSettings((prev) => ({
      ...(prev || {}),
      nav_overrides: nextOverrides,
      settings: {
        ...(prev?.settings || {}),
        nav_overrides: nextOverrides,
      },
    }));
  },
  [setSiteSettings]
);

const saveNavSettings = useCallback(
  async (draft) => {
    if (!companyId) {
      setNavErr("Company id missing");
      return;
    }

    setNavSaving(true);
    setNavMsg("");
    setNavErr("");
    try {
      const full = normalizeNavStyle(draft?.nav_style || navStyleState || {});
      const saved = await navSettings.updateStyle(companyId, full);
      const normalizedSaved = normalizeNavStyle(saved || full);
      setNavStyleState(normalizedSaved);
      setNavDraft(deriveNavDraft(normalizedSaved));
      setSiteSettings((prev) => mergeNavIntoSettings(prev, { nav_style: normalizedSaved }));
      setNavMsg(t("manager.visualBuilder.messages.navSaved"));
      setMsg(t("manager.visualBuilder.messages.navSaved"));
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to save navigation settings.";
      setNavErr(message);
    } finally {
      setNavSaving(false);
    }
  },
  [companyId, setSiteSettings, navStyleState, t]
);

  const saveBrandingSettings = useCallback(
  async (payload) => {
    if (!companyId) {
      setBrandingErr("Company id missing");
      return;
    }
    const headerPayload = normalizeHeaderConfig(
      payload?.header || headerDraft || defaultHeaderConfig()
    );
    const footerPayload = normalizeFooterConfig(
      payload?.footer || footerDraft || defaultFooterConfig()
    );
    const themePayload = payload?.theme_overrides || themeOverridesDraft || defaultThemeOverrides;
    const navOverridesPayload = payload?.nav_overrides || navOverridesWithDefault || {};
    setBrandingSaving(true);
    setBrandingMsg("");
    setBrandingErr("");
    try {
      await wb.saveSettings(
        companyId,
        {
          header: headerPayload,
          footer: footerPayload,
          theme_overrides: themePayload,
          nav_overrides: navOverridesPayload,
        },
        { publish: false }
      );
      const refreshed = await wb.getSettings(companyId).catch(() => null);
      const root = refreshed?.data || refreshed || {};
      applyBrandingFromServer(root);
      setSiteSettings(root);
      const draftSavedMsg = t(
        "manager.visualBuilder.messages.brandingDraftSaved",
        "Branding draft saved. Publish to go live."
      );
      setBrandingMsg(draftSavedMsg);
      setMsg(draftSavedMsg);
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to save branding.";
      setBrandingErr(message);
    } finally {
      setBrandingSaving(false);
    }
  },
  [
    companyId,
    headerDraft,
    footerDraft,
    themeOverridesDraft,
    defaultThemeOverrides,
    t,
    applyBrandingFromServer,
    navOverridesWithDefault,
  ]
);

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

/** Apply current page's PageStyle to every other page */
// Replace BOTH earlier applyStyleToAllPagesNow() definitions with this one:
// Apply the current page's Page Style (SECTION) to all other pages
const applyStyleToAllPagesNow = useCallback(async () => {
  if (!companyId) return;

  const srcProps =
    editing?.content?.meta?.pageStyle ||
    readPageStyleProps(editing) ||
    null;

  if (!srcProps) {
    setErr(t("manager.visualBuilder.pageStyle.applyAll.none"));
    return;
  }

  setBusy(true);
  setErr("");
  setMsg("");
  try {
    const list = await wb.listPages(companyId);
    const pagesList = Array.isArray(list?.data) ? list.data : list || [];

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
    setErr(
      e?.response?.data?.error ||
        e.message ||
        t("manager.visualBuilder.pageStyle.applyAll.failed")
    );
  } finally {
    setBusy(false);
  }
}, [companyId, editing, t]);




  // NEW — Help drawer state and jump helpers  (keep this below your new block)
  const [helpOpen, setHelpOpen] = useState(false);
  const jumpToById = (id) => {
    if (id === "builder-page-settings") {
      setPageSettingsOpen(true);
    }
    const el = document.getElementById(id);
    if (!el) return;

    const summary = el.querySelector('[role="button"][aria-expanded]');
    if (summary && summary.getAttribute("aria-expanded") === "false") {
      summary.click();
    }

    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setHelpOpen(false), 250);
  };
  const handleJumpToPageStyle = () => jumpToById("page-style-card");
  const handleJumpToNav = () => jumpToById("nav-settings-card");
  const handleJumpToAssets = () => jumpToById("assets-manager-card");
  const handleJumpToPageSettings = () => jumpToById("builder-page-settings");

  const siteSeoDefaults = useMemo(() => {
    if (siteSettings?.seo) return siteSettings.seo;
    if (siteSettings?.settings?.seo) return siteSettings.settings.seo;
    return {};
  }, [siteSettings]);

  const canonicalBase = useMemo(
    () => siteSeoDefaults.canonicalUrl || siteSeoDefaults.slugBaseUrl || "",
    [siteSeoDefaults]
  );
  const slugBase = useMemo(
    () => siteSeoDefaults.slugBaseUrl || canonicalBase,
    [siteSeoDefaults, canonicalBase]
  );
  const previewSlug = useMemo(() => {
    const slugFromSettings =
      siteSettings?.company?.slug ||
      companyProfileSlug ||
      siteSettings?.company_slug ||
      siteSettings?.slug ||
      siteSettings?.settings?.slug;
    if (slugFromSettings) return slugFromSettings;
    if (companyId) return `preview-${companyId}`;
    return "preview";
  }, [siteSettings, companyProfileSlug, companyId]);

  const liveSlug = useMemo(() => {
    const slugFromSettings =
      siteSettings?.company?.slug ||
      companyProfileSlug ||
      siteSettings?.company_slug ||
      siteSettings?.slug ||
      siteSettings?.settings?.slug;
    return (slugFromSettings || "").trim();
  }, [siteSettings, companyProfileSlug]);

  const liveSiteUrl = useMemo(() => {
    const rawDomain =
      siteSettings?.custom_domain ||
      siteSettings?.settings?.custom_domain ||
      "";
    const domain = String(rawDomain || "").trim();
    if (domain) {
      if (domain.startsWith("http://") || domain.startsWith("https://")) {
        return domain;
      }
      return `https://${domain}`;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (liveSlug) return `${origin}/${liveSlug}`;
    return previewSlug ? `${origin}/${previewSlug}` : origin;
  }, [siteSettings, liveSlug, previewSlug]);

  const seoPreviewTitle = useMemo(() => {
    return (
      editing?.seo_title ||
      editing?.title ||
      siteSeoDefaults.metaTitle ||
      (editing?.slug ? editing.slug.replace(/-/g, " ") : previewSlug)
    );
  }, [editing, siteSeoDefaults, previewSlug]);
  const seoPreviewDescription = useMemo(() => {
    return (
      editing?.seo_description ||
      siteSeoDefaults.metaDescription ||
      t("manager.visualBuilder.pages.seo.descriptionFallback")
    );
  }, [editing, siteSeoDefaults, t]);
  const socialPreviewTitle = useMemo(() => {
    return editing?.og_title || seoPreviewTitle;
  }, [editing, seoPreviewTitle]);
  const socialPreviewDescription = useMemo(() => {
    return (
      editing?.og_description ||
      editing?.seo_description ||
      siteSeoDefaults.ogDescription ||
      siteSeoDefaults.metaDescription ||
      seoPreviewDescription
    );
  }, [editing, siteSeoDefaults, seoPreviewDescription]);
  const socialPreviewImage = useMemo(() => {
    return editing?.og_image_url || siteSeoDefaults.ogImage || "";
  }, [editing, siteSeoDefaults]);

  const pageCanonicalPreview = useMemo(
    () => buildCanonicalUrl(editing, canonicalBase, slugBase),
    [editing, canonicalBase, slugBase]
  );

  const previewPagesMeta = useMemo(() => {
    if (!Array.isArray(pages) || !pages.length) {
      return [];
    }
    return pages.map((p) => ({
      slug: p.slug,
      menu_title: p.menu_title || p.title || p.slug,
      title: p.title || p.slug,
      show_in_menu: p.show_in_menu !== false,
      sort_order: p.sort_order ?? 0,
      is_homepage: Boolean(p.is_homepage),
    }));
  }, [pages]);

  const previewSite = useMemo(() => {
    const navStyle =
      siteSettings?.nav_style || siteSettings?.settings?.nav_style || {};
    const themeOverrides =
      siteSettings?.theme_overrides ||
      siteSettings?.settings?.theme_overrides ||
      {};
    const companyName =
      siteSettings?.site_title ||
      siteSettings?.company?.name ||
      headerDraft?.text ||
      "Preview Company";
    const fallbackPage = {
      slug: editing?.slug || "preview",
      menu_title: editing?.menu_title || editing?.title || "Preview",
      title: editing?.title || "Preview",
      show_in_menu: true,
      sort_order: 0,
      is_homepage: true,
    };
    return {
      slug: previewSlug,
      nav_overrides: navOverridesWithDefault,
      nav_style: navStyle,
      theme_overrides: themeOverrides,
      header: headerDraft,
      footer: footerDraft,
      pages: previewPagesMeta.length ? previewPagesMeta : [fallbackPage],
      company: {
        id:
          siteSettings?.company?.id ||
          siteSettings?.company_id ||
          companyId ||
          0,
        name: companyName,
        slug: previewSlug,
        logo_url:
          headerDraft?.logo_asset?.url ||
          siteSettings?.company?.logo_url ||
          null,
        contact_email: siteSettings?.company?.contact_email || null,
      },
    };
  }, [
    siteSettings,
    companyId,
    headerDraft,
    footerDraft,
    previewPagesMeta,
    previewSlug,
    editing,
    navOverridesWithDefault,
  ]);


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
    } catch (e) {
      console.warn("Settings load failed", e?.response?.data || e);
    }

    try {
      const styleRes = await navSettings.getStyle(cid);
      if (styleRes) {
        const normalizedStyle = normalizeNavStyle(styleRes);
        setNavStyleState(normalizedStyle);
        settingsObj = mergeNavIntoSettings(settingsObj, { nav_style: styleRes });
      }
    } catch (e) {
      console.warn("Nav style load failed", e?.response?.data || e);
    }

    if (!navStyleState && (settingsObj?.nav_style || settingsObj?.settings?.nav_style)) {
      setNavStyleState(
        normalizeNavStyle(settingsObj.nav_style || settingsObj.settings?.nav_style || {})
      );
    }

    applyBrandingFromServer(settingsObj);
    setSiteSettings(settingsObj);

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

  /* ----- save & publish (HOISTED) ----- */
  const onSavePage = useCallback(async () => {
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
  }, [
    applyPageStyleToAll,
    applyStyleToAllPagesNow,
    companyId,
    editing,
    setEditing,
    setPages,
    setSelectedId,
    t,
  ]);

  const importLabSettingsFromServer = useCallback(async () => {
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
      setErr(
        detail
          ? t("manager.visualBuilder.errors.importPresetDetail", { detail })
          : t("manager.visualBuilder.errors.importPreset")
      );
    }
  }, [companyId, editing, setEditing, t]);

  useEffect(() => {
    try {
      const currentSearch =
        location?.search ?? window.location.search ?? "";
      const qs = new URLSearchParams(currentSearch);
      if (qs.get("importLabPresetOnce") === "1") {
        (async () => {
          try {
            await importLabSettingsFromServer();
          } finally {
            qs.delete("importLabPresetOnce");
            const nextSearch = qs.toString();
            const nextPath =
              location?.pathname ?? window.location.pathname ?? "";
            const nextUrl = `${nextPath}${nextSearch ? `?${nextSearch}` : ""}`;
            window.history.replaceState({}, "", nextUrl);
          }
        })();
      }
    } catch (e) {
      console.warn("Auto-import from Lab failed:", e?.message || e);
    }
  }, [importLabSettingsFromServer, location?.pathname, location?.search]);

  // --- Publish (no auto-apply of Lab; save current page then publish) ---
  const onPublish = useCallback(async () => {
    if (!companyId) return;
    setBusy(true);
    setErr("");
    setMsg("");

    try {
      const snapshot = withLiftedLayout(
        ensureSectionIds({ ...editing })
      );
      const payload = serializePage(snapshot);

      if (payload.id) {
        await wb.updatePage(companyId, payload.id, payload);
        setEditing(snapshot);
        setPages((prev) => prev.map((p) => (p.id === payload.id ? snapshot : p)));
      } else {
        const r = await wb.createPage(companyId, payload);
        const created = ensureSectionIds(withLiftedLayout(normalizePage(r.data)));
        setPages((prev) => [created, ...prev]);
        setSelectedId(created.id);
        setEditing(created);
      }

      const latestSettings = await wb.getSettings(companyId).catch(() => null);
      const latestPayload = latestSettings?.data || latestSettings || {};
      const draftSettings = latestPayload?.settings || {};
      const publishPayload = {
        ...draftSettings,
        header: draftSettings.header || headerDraft,
        footer: draftSettings.footer || footerDraft,
        theme_overrides: draftSettings.theme_overrides || themeOverridesDraft,
        nav_overrides: draftSettings.nav_overrides || navOverridesWithDefault,
      };
      const brandingRes = await wb.saveSettings(companyId, publishPayload, {
        publish: true,
      });
      const brandingPayload = brandingRes?.data || brandingRes || {};
      if (brandingPayload?.branding_published_at) {
        publicSite.setVersion(
          siteSettings?.company?.slug || previewSlug,
          brandingPayload.branding_published_at,
          "publish"
        );
      }
      applyBrandingFromServer(brandingPayload);
      setSiteSettings(brandingPayload);

      await wb.publish(companyId, true);
      publicSite.invalidate(
        (siteSettings?.company?.slug || previewSlug || "").toString()
      );
      const publishedMsg = `${
        t("manager.visualBuilder.messages.sitePublished") || "Site published"
      } ✔`;
      setMsg(publishedMsg);
    } catch (e) {
      setErr(
        t("manager.visualBuilder.errors.publishFailed", {
          reason:
            e?.response?.data?.message ||
            e.message ||
            t("manager.visualBuilder.errors.unknown"),
        })
      );
    } finally {
      setBusy(false);
    }
  }, [applyBrandingFromServer, companyId, editing, setEditing, setPages, setSelectedId, setSiteSettings, t]);


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

  const discardPageSettings = useCallback(async () => {
    if (!companyId) return;
    setPageSettingsDirty(false);
    await loadAll(companyId);
  }, [companyId, loadAll]);
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
    [companyId, autosaveEnabled, t]
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

  const renderAddBlockButton = (type, labelKey) => {
    const label = t(labelKey, { defaultValue: type });
    const previewSrc = BLOCK_PREVIEWS[type];
    return (
      <Box
        key={type}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.75,
          minWidth: 140,
        }}
      >
        {previewSrc ? (
          <ButtonBase
            onClick={() => openBlockPreview(type, label)}
            sx={{
              width: 104,
              height: 68,
              borderRadius: 1.5,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: 1,
              bgcolor: "background.paper",
            }}
          >
            <Box
              component="img"
              src={previewSrc}
              alt={`${label} preview`}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              loading="lazy"
            />
          </ButtonBase>
        ) : null}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => addBlock(type)}
        >
          {label}
        </Button>
      </Box>
    );
  };

  /* ----- Page meta helpers ----- */
  const updatePageMeta = (patch) => {
    setPageSettingsDirty(true);
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
      if ("canonical_path" in patch && typeof patch.canonical_path === "string") {
        next.canonical_path = patch.canonical_path.trim();
      }
      return withLiftedLayout(next);
    });
  };

  const applyPageActionPatch = useCallback(
    (pageId, patch, { setHomepage = false } = {}) => {
      if (!pageId) return;
      const persistPatch = async () => {
        try {
          if (!companyId) return;
          let source =
            (editing?.id === pageId ? editing : null) ||
            pages.find((p) => p.id === pageId);
          if (!source) return;
          if (
            source?.id !== editing?.id &&
            (!source?.content || !Array.isArray(source?.content?.sections))
          ) {
            const full = await wb.getPage(companyId, pageId);
            source = full?.data || full || source;
          }
          const base = setHomepage
            ? { ...source, is_homepage: true }
            : { ...source, ...patch };
          const payload = serializePage(ensureSectionIds(withLiftedLayout(base)));
          const r = await wb.updatePage(companyId, payload.id, payload);
          const updated = ensureSectionIds(
            withLiftedLayout(normalizePage(r.data || payload))
          );
          setPages((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          if (editing?.id === updated.id) {
            setEditing(updated);
          }
        } catch (e) {
          console.error(e);
        }
      };
      setPageSettingsDirty(true);
      setSelectedPageIds((prev) => (prev.includes(pageId) ? prev : [pageId]));
      setPages((prev) =>
        prev.map((p) => {
          if (setHomepage) {
            const isHome = p.id === pageId;
            return p.is_homepage === isHome ? p : { ...p, is_homepage: isHome };
          }
          if (p.id !== pageId) return p;
          return { ...p, ...patch };
        })
      );

      if (setHomepage) {
        setEditing((cur) => {
          if (!cur) return cur;
          const isHome = cur.id === pageId;
          if (cur.is_homepage === isHome) return cur;
          return withLiftedLayout({ ...cur, is_homepage: isHome });
        });
      } else if (editing?.id === pageId) {
        updatePageMeta(patch);
      }

      if (patch && Object.prototype.hasOwnProperty.call(patch, "autosave")) {
        if (editing?.id === pageId) {
          setAutosaveEnabled(Boolean(patch.autosave));
        }
      }
      if (
        (patch &&
          (Object.prototype.hasOwnProperty.call(patch, "published") ||
            Object.prototype.hasOwnProperty.call(patch, "show_in_menu") ||
            Object.prototype.hasOwnProperty.call(patch, "autosave"))) ||
        setHomepage
      ) {
        persistPatch();
      }
    },
    [
      companyId,
      editing,
      pages,
      updatePageMeta,
      setAutosaveEnabled,
      setPages,
      setSelectedPageIds,
    ]
  );

  const savePageMeta = async () => {
    if (!companyId) return;
    try {
      setBusy(true);
      if (editing?.id) {
        const targets = selectedPageIds.length
          ? selectedPageIds
          : [editing.id];
        const updated = await Promise.all(
          targets.map(async (id) => {
            const isEditing = id === editing.id;
            const base = isEditing
              ? { ...editing }
              : { ...(pages.find((p) => p.id === id) || {}) };
            const bulkPatch = {
              show_in_menu: Boolean(base.show_in_menu ?? true),
              published: Boolean(base.published ?? true),
              autosave: Boolean(base.autosave ?? true),
              is_homepage: Boolean(base.is_homepage ?? false),
            };
            const merged = { ...base, ...bulkPatch };
            const payload = serializePage(ensureSectionIds(withLiftedLayout(merged)));
            const r = await wb.updatePage(companyId, payload.id, payload);
            return ensureSectionIds(
              withLiftedLayout(normalizePage(r.data || payload))
            );
          })
        );
        setPages((prev) =>
          prev.map((p) => updated.find((u) => u.id === p.id) || p)
        );
        const match = updated.find((u) => u.id === editing.id);
        if (match) setEditing(match);
        setSelectedPageIds([]);
        setMsg(t("manager.visualBuilder.messages.pageSettingsSaved"));
        setPageSettingsDirty(false);
      } else {
        await onSavePage();
        setPageSettingsDirty(false);
      }
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.savePageSettings"));
    } finally {
      setBusy(false);
    }
  };

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-");

  const buildDuplicateSlug = (base, existing) => {
    const cleanBase = slugify(base) || "page";
    const baseSlug = `duplicated${cleanBase}`;
    let candidate = baseSlug;
    let idx = 2;
    while (existing.has(candidate)) {
      candidate = `${baseSlug}-${idx}`;
      idx += 1;
    }
    existing.add(candidate);
    return candidate;
  };

  const prefixDuplicate = (value, fallback = "Page") => {
    const trimmed = String(value || "").trim();
    return trimmed ? `Duplicated ${trimmed}` : `Duplicated ${fallback}`;
  };

  const duplicateSelectedPages = async () => {
    if (!companyId) return;
    const targets = selectedPageIds.length
      ? selectedPageIds
      : editing?.id
        ? [editing.id]
        : [];
    if (!targets.length) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const existingSlugs = new Set(
        pages.map((p) => String(p.slug || "").toLowerCase())
      );
      const createdPages = [];
      for (const id of targets) {
        const source =
          id === editing?.id ? editing : pages.find((p) => p.id === id);
        if (!source) continue;
        const next = JSON.parse(JSON.stringify(source));
        delete next.id;
        next.slug = buildDuplicateSlug(next.slug || next.title || "page", existingSlugs);
        next.title = prefixDuplicate(next.title || next.slug, "Page");
        next.menu_title = prefixDuplicate(next.menu_title || next.title, "Page");
        if (next.seo_title) next.seo_title = prefixDuplicate(next.seo_title, "Page");
        if (next.og_title) next.og_title = prefixDuplicate(next.og_title, "Page");
        next.canonical_path = "";
        const payload = serializePage(ensureSectionIds(withLiftedLayout(next)));
        const r = await wb.createPage(companyId, payload);
        const created = ensureSectionIds(
          withLiftedLayout(normalizePage(r.data || payload))
        );
        createdPages.push(created);
      }
      if (createdPages.length) {
        setPages((prev) => [...createdPages, ...prev]);
        setSelectedId(createdPages[0].id);
        setEditing(createdPages[0]);
        setSelectedBlock(-1);
        setSelectedPageIds([]);
        setMsg(t("manager.visualBuilder.messages.created"));
      }
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.savePage"));
    } finally {
      setBusy(false);
    }
  };

  const duplicatePageById = async (id) => {
    if (!companyId || !id) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const existingSlugs = new Set(
        pages.map((p) => String(p.slug || "").toLowerCase())
      );
      const source =
        id === editing?.id ? editing : pages.find((p) => p.id === id);
      if (!source) return;
      const next = JSON.parse(JSON.stringify(source));
      delete next.id;
      next.slug = buildDuplicateSlug(next.slug || next.title || "page", existingSlugs);
      next.title = prefixDuplicate(next.title || next.slug, "Page");
      next.menu_title = prefixDuplicate(next.menu_title || next.title, "Page");
      if (next.seo_title) next.seo_title = prefixDuplicate(next.seo_title, "Page");
      if (next.og_title) next.og_title = prefixDuplicate(next.og_title, "Page");
      next.canonical_path = "";
      const payload = serializePage(ensureSectionIds(withLiftedLayout(next)));
      const r = await wb.createPage(companyId, payload);
      const created = ensureSectionIds(
        withLiftedLayout(normalizePage(r.data || payload))
      );
      setPages((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setEditing(created);
      setSelectedBlock(-1);
      setSelectedPageIds([]);
      setMsg(t("manager.visualBuilder.messages.created"));
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.savePage"));
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
  const normalizedSchemaKey = blockType
    ? blockType.replace(/[^a-z0-9]/gi, "").toLowerCase()
    : "";
  const normalizedSchemaMatch = normalizedSchemaKey
    ? Object.keys(SCHEMA_REGISTRY).find(
        (key) => key.replace(/[^a-z0-9]/gi, "").toLowerCase() === normalizedSchemaKey
      )
    : null;
  const schemaForBlock =
    (blockType && SCHEMA_REGISTRY[blockType]) ||
    (normalizedSchemaMatch ? SCHEMA_REGISTRY[normalizedSchemaMatch] : null) ||
    selectedBlockObj?.schema ||
    null;

  const ControlsCard = (
    <SectionCard
      title={null}
      description={null}
      actions={
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {hasDraftChanges && (
            <Chip
              size="small"
              color="warning"
              label={t("manager.visualBuilder.draftChip", "Draft changes pending")}
            />
          )}
          <Tooltip
            title={
              lastPublishedLabel ||
              t("manager.visualBuilder.controls.publishFloatingReady", "Publish site")
            }
          >
            <IconButton size="small" aria-label={lastPublishedLabel ? "Published" : "Draft"}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("manager.visualBuilder.controls.tooltips.guide")}>
            <IconButton onClick={() => setHelpOpen(true)} size="small">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            startIcon={<ViewCarouselIcon />}
            component={RouterLink}
            to={`/manager/website/templates${supportQuery}`}
          >
            {t("manager.visualBuilder.controls.buttons.chooseTemplate")}
          </Button>
          <IconButton size="small" onClick={openToolsMenu}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={toolsAnchorEl}
            open={Boolean(toolsAnchorEl)}
            onClose={closeToolsMenu}
          >
            <MenuItem component={RouterLink} to="/manage/website/layout-lab" onClick={closeToolsMenu}>
              {t("manager.visualBuilder.controls.buttons.layoutLab")}
            </MenuItem>
            <MenuItem onClick={() => { closeToolsMenu(); importLabSettingsFromServer(); }}>
              {t("manager.visualBuilder.controls.buttons.importServer")}
            </MenuItem>
            <MenuItem onClick={() => { closeToolsMenu(); importLabSettings(); }}>
              {t("manager.visualBuilder.controls.buttons.importSettings")}
            </MenuItem>
            <MenuItem onClick={() => { closeToolsMenu(); importLabSettingsAll(); }}>
              {t("manager.visualBuilder.controls.buttons.importAll")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeToolsMenu();
                if (!busy && companyId) loadAll(companyId);
              }}
            >
              {t("manager.visualBuilder.controls.buttons.refresh")}
            </MenuItem>
          </Menu>

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

        <FloatingInspector.Controls fi={fi} />

        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => {
            if (!v) return;
            fi.setInspectorMode(v);
            fi.setEnabled?.(v !== "dock");

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
    <Stack spacing={1.5}>
      <InspectorColumn />
      <CollapsibleSection
        id="builder-pages-list"
        title={t("manager.visualBuilder.pages.title")}
        expanded={pagesListOpen}
        onChange={(next) => {
          setPagesListOpen(next);
          setPageSettingsOpen(next);
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {selectedPageIds.length
              ? `${selectedPageIds.length} selected`
              : "Select pages to bulk update"}
          </Typography>
          <Button
            size="small"
            variant="text"
            disabled={!selectedPageIds.length}
            onClick={() => setSelectedPageIds([])}
          >
            Clear selection
          </Button>
        </Stack>
        <List dense sx={{ mb: 1 }}>
          {pages.map((p) => (
            <ListItem key={p.id} disablePadding>
              <Checkbox
                size="small"
                checked={selectedPageIds.includes(p.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={(_, checked) => {
                  setSelectedPageIds((prev) =>
                    checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                  );
                }}
                sx={{ ml: 0.5, mr: 0.5 }}
              />
              <ListItemButton
                selected={selectedId === p.id}
              onClick={() => {
                const lifted = withLiftedLayout(p);
                setSelectedId(lifted.id);
                setEditing(lifted);
                setSelectedBlock(-1);
                setPagesListOpen(true);
                setPageSettingsOpen(true);
              }}
            >
              <ListItemText primary={p.title || p.slug} secondary={p.slug} />
            </ListItemButton>
            <IconButton
              size="small"
              onClick={(e) => handlePageMenuOpen(e, p)}
              sx={{ ml: 0.5 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </ListItem>
        ))}
      </List>
      <Menu
        anchorEl={pageMenuAnchor}
        open={Boolean(pageMenuAnchor)}
        onClose={handlePageMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (!pageMenuTarget) return;
            const current = Boolean(pageMenuTarget.published ?? true);
            applyPageActionPatch(pageMenuTarget.id, { published: !current });
            handlePageMenuClose();
          }}
        >
          {pageMenuTarget?.published ?? true ? "Unpublish" : "Publish"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!pageMenuTarget) return;
            const current = Boolean(pageMenuTarget.show_in_menu ?? true);
            applyPageActionPatch(pageMenuTarget.id, { show_in_menu: !current });
            handlePageMenuClose();
          }}
        >
          {pageMenuTarget?.show_in_menu ?? true ? "Hide from menu" : "Show in menu"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!pageMenuTarget) return;
            if (pageMenuTarget.is_homepage) {
              applyPageActionPatch(pageMenuTarget.id, { is_homepage: false });
            } else {
              applyPageActionPatch(pageMenuTarget.id, {}, { setHomepage: true });
            }
            handlePageMenuClose();
          }}
        >
          {pageMenuTarget?.is_homepage ? "Unset homepage" : "Set as homepage"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!pageMenuTarget) return;
            const current = Boolean(pageMenuTarget.autosave ?? true);
            applyPageActionPatch(pageMenuTarget.id, { autosave: !current });
            handlePageMenuClose();
          }}
        >
          {pageMenuTarget?.autosave ?? true ? "Disable autosave" : "Enable autosave"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!pageMenuTarget) return;
            duplicatePageById(pageMenuTarget.id);
            handlePageMenuClose();
          }}
        >
          Duplicate
        </MenuItem>
      </Menu>
      <Alert severity="info" sx={{ mt: 1 }}>
        Need another page? Visit the {" "}
        <Link component={RouterLink} to="/manager/website" underline="hover">
          Website Manager
        </Link>{" "}
        to create pages, then return here to design them.
      </Alert>
      <Alert severity="info" sx={{ mt: 1 }}>
        <Trans
          i18nKey="manager.visualBuilder.pages.seoPrompt"
          components={{
            seoLink: (
              <Link component={RouterLink} to="/manager/website#seo" underline="hover" />
            ),
          }}
        />
      </Alert>
    </CollapsibleSection>

      <CollapsibleSection
        id="builder-page-settings"
        title={t("manager.visualBuilder.pages.settings.title")}
        expanded={pageSettingsOpen}
        onChange={(next) => setPageSettingsOpen(next)}
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
          {String(editing.slug || "").toLowerCase() === "services-classic" && (
            <TextField
              label="Services heading"
              size="small"
              value={editing?.content?.meta?.servicesHeading || ""}
              onChange={(e) => {
                const value = e.target.value;
                setEditing((cur) => {
                  const content = cur.content || {};
                  const meta = content.meta || {};
                  return withLiftedLayout({
                    ...cur,
                    content: { ...content, meta: { ...meta, servicesHeading: value } },
                  });
                });
              }}
              helperText="Shown as the title on the Services page."
              fullWidth
            />
          )}
          {["products", "products-classic"].includes(String(editing.slug || "").toLowerCase()) && (
            <>
              <TextField
                label="Products heading"
                size="small"
                value={editing?.content?.meta?.productsHeading || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditing((cur) => {
                    const content = cur.content || {};
                    const meta = content.meta || {};
                    return withLiftedLayout({
                      ...cur,
                      content: { ...content, meta: { ...meta, productsHeading: value } },
                    });
                  });
                }}
                helperText="Shown as the title on the Products page."
                fullWidth
              />
              <TextField
                label="Products subheading"
                size="small"
                value={editing?.content?.meta?.productsSubheading || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditing((cur) => {
                    const content = cur.content || {};
                    const meta = content.meta || {};
                    return withLiftedLayout({
                      ...cur,
                      content: { ...content, meta: { ...meta, productsSubheading: value } },
                    });
                  });
                }}
                helperText="Shown below the Products heading."
                fullWidth
                multiline
                minRows={2}
              />
            </>
          )}
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
                onChange={(_, v) => {
                  setAutosaveEnabled(v);
                  updatePageMeta({ autosave: v });
                }}
              />
            }
            label={t("manager.visualBuilder.pages.settings.toggles.autosave")}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={duplicateSelectedPages}
              disabled={busy || !companyId || !selectedPageIds.length}
            >
              Duplicate selected
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => loadAll(companyId)}
              disabled={busy || !companyId}
            >
              {t("manager.visualBuilder.pages.settings.reload")}
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={savePageMeta}
              disabled={busy || !companyId}
            >
              {t("manager.visualBuilder.pages.settings.save")}
            </Button>
          </Stack>
        </Stack>
      </CollapsibleSection>

      <CollapsibleSection
        id="builder-page-seo"
        title={t("manager.visualBuilder.pages.seo.cardTitle")}
        description={t("manager.visualBuilder.pages.seo.cardDescription")}
      >
        <Stack spacing={1.5}>
          <TextField
            label={t("manager.visualBuilder.pages.seo.fields.title")}
            size="small"
            fullWidth
            value={editing.seo_title || ""}
            onChange={(e) => setEditing((s) => ({ ...s, seo_title: e.target.value }))}
            helperText={t("manager.visualBuilder.pages.seo.helpers.title")}
          />
          <TextField
            label={t("manager.visualBuilder.pages.seo.fields.description")}
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={editing.seo_description || ""}
            onChange={(e) => setEditing((s) => ({ ...s, seo_description: e.target.value }))}
            helperText={t("manager.visualBuilder.pages.seo.helpers.description")}
          />
          <TextField
            label={t("manager.visualBuilder.pages.seo.fields.keywords")}
            size="small"
            fullWidth
            value={editing.seo_keywords || ""}
            onChange={(e) => setEditing((s) => ({ ...s, seo_keywords: e.target.value }))}
            helperText={t("manager.visualBuilder.pages.seo.helpers.keywords")}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              label={t("manager.visualBuilder.pages.seo.fields.ogTitle")}
              size="small"
              fullWidth
              value={editing.og_title || ""}
              onChange={(e) => setEditing((s) => ({ ...s, og_title: e.target.value }))}
            />
            <TextField
              label={t("manager.visualBuilder.pages.seo.fields.ogDescription")}
              size="small"
              fullWidth
              value={editing.og_description || ""}
              onChange={(e) => setEditing((s) => ({ ...s, og_description: e.target.value }))}
            />
          </Stack>
          <TextField
            label={t("manager.visualBuilder.pages.seo.fields.ogImage")}
            size="small"
            fullWidth
            value={editing.og_image_url || ""}
            onChange={(e) => setEditing((s) => ({ ...s, og_image_url: e.target.value }))}
          />
          <TextField
            label={t("manager.visualBuilder.pages.seo.fields.canonicalPath")}
            size="small"
            fullWidth
            value={editing.canonical_path || ""}
            onChange={(e) => updatePageMeta({ canonical_path: e.target.value })}
            helperText={slugBase ? t("manager.visualBuilder.pages.seo.helpers.canonicalPath", { base: slugBase }) : undefined}
          />
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(editing.noindex)}
                onChange={(_, v) => setEditing((s) => ({ ...s, noindex: v }))}
              />
            }
            label={t("manager.visualBuilder.pages.seo.fields.noindex")}
          />
          <SearchSnippetPreview
            title={seoPreviewTitle}
            url={pageCanonicalPreview || slugBase || canonicalBase || "https://example.com"}
            description={seoPreviewDescription}
          />
          <SocialCardPreview
            title={socialPreviewTitle}
            description={socialPreviewDescription}
            image={socialPreviewImage}
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="flex-end"
            sx={{ pt: 0.5 }}
          >
            <Button
              size="small"
              variant="contained"
              startIcon={<SaveIcon fontSize="small" />}
              onClick={onSavePage}
              disabled={busy || !companyId}
            >
              {t("management.domainSettings.seo.buttons.save", "Save SEO")}
            </Button>
          </Stack>
        </Stack>
      </CollapsibleSection>

      <CollapsibleSection
        id="nav-settings-card"
        title={t("manager.visualBuilder.nav.title", "Navigation & Menu")}
        description={t(
          "manager.visualBuilder.nav.description",
          "Control navigation details like site title and menu styling."
        )}
        actions={
          <Tooltip title={t("manager.visualBuilder.canvas.locate", "Locate on canvas")}>
            <IconButton size="small" onClick={scrollCanvasToTop}>
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
        onChange={(open) => {
          if (open) scrollCanvasToTop();
        }}
      >
        <WebsiteNavSettingsCard
          companyId={companyId}
          value={navDraft || { nav_style: navStyleState }}
          onChange={handleNavDraftChange}
          onSave={saveNavSettings}
          saving={navSaving}
          message={navMsg}
          error={navErr}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="branding-settings-card"
        title={t("manager.visualBuilder.branding.title", "Header & Footer")}
        description={t(
          "manager.visualBuilder.branding.description",
          "Upload logos, configure sticky header links, and add footer columns."
        )}
        expanded={brandingPanelOpen}
        onChange={(open) => {
          setBrandingPanelOpen(open);
          if (open) scrollCanvasToTop();
        }}
        actions={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title={t("manager.visualBuilder.canvas.locateHeader", "Locate header")}>
              <IconButton size="small" onClick={scrollCanvasToTop}>
                <CenterFocusStrongIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("manager.visualBuilder.canvas.locateFooter", "Locate footer")}>
              <IconButton size="small" onClick={scrollCanvasToBottom}>
                <CenterFocusStrongIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      >
        <WebsiteBrandingCard
          companyId={companyId}
          companySlug={
            siteSettings?.company?.slug ||
            siteSettings?.company?.name ||
            previewSlug
          }
          headerValue={headerDraft}
          footerValue={footerDraft}
          themeOverridesValue={themeOverridesDraft}
          defaultThemeOverrides={defaultThemeOverrides}
          onChangeHeader={handleHeaderDraftChange}
          onChangeFooter={handleFooterDraftChange}
          onChangeThemeOverrides={setThemeOverridesDraft}
          onSave={saveBrandingSettings}
          saving={brandingSaving}
          message={brandingMsg}
          error={brandingErr}
          navOverridesValue={navOverridesWithDefault}
          onChangeNavOverrides={handleNavOverridesChange}
          pagesMeta={previewPagesMeta}
          onRequestPagesJump={handleJumpToPageSettings}
          floatingSaveVisible={brandingPanelOpen}
          floatingSavePlacement="top-left"
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="builder-sections-panel"
        title={t("manager.visualBuilder.sections.title")}
        description={t("manager.visualBuilder.sections.description")}
        actions={
          <Tooltip title={t("manager.visualBuilder.canvas.locate", "Locate on canvas")}>
            <IconButton
              size="small"
              onClick={() => {
                if (selectedBlock >= 0) {
                  scrollCanvasToSection(selectedBlock);
                }
              }}
            >
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
        onChange={(open) => {
          if (open && selectedBlock >= 0) {
            scrollCanvasToSection(selectedBlock);
          }
        }}
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
                    onClick={() => {
                      setSelectedBlock(realIndex);
                      requestAnimationFrame(() => scrollCanvasToSection(realIndex));
                    }}
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

        <CollapsibleSection
          id="builder-add-blocks"
          title="Add new blocks"
          description="Click a preview to see the block, then add it to the page."
          defaultExpanded={false}
        >
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {renderAddBlockButton("hero", "manager.visualBuilder.sections.add.hero")}
            {renderAddBlockButton("heroCarousel", "manager.visualBuilder.sections.add.heroCarousel")}
            {renderAddBlockButton("heroSplit", "manager.visualBuilder.sections.add.heroSplit")}
            {renderAddBlockButton("text", "manager.visualBuilder.sections.add.text")}
            {renderAddBlockButton("richText", "manager.visualBuilder.sections.add.richText")}
            {renderAddBlockButton("gallery", "manager.visualBuilder.sections.add.gallery")}
            {renderAddBlockButton("photoGallery", "manager.visualBuilder.sections.add.photoGallery")}
            {renderAddBlockButton("collectionShowcase", "manager.visualBuilder.sections.add.collectionShowcase")}
            {renderAddBlockButton("featureZigzagModern", "manager.visualBuilder.sections.add.featureZigzagModern")}
            {renderAddBlockButton("discoverStory", "manager.visualBuilder.sections.add.discoverStory")}
            {renderAddBlockButton("logoCloud", "manager.visualBuilder.sections.add.logoCloud")}
            {renderAddBlockButton("workshopsCommissions", "manager.visualBuilder.sections.add.workshopsCommissions")}
            {renderAddBlockButton("textFree", "manager.visualBuilder.sections.add.textFree")}
            {renderAddBlockButton("galleryCarousel", "manager.visualBuilder.sections.add.carousel")}
            {renderAddBlockButton("faq", "manager.visualBuilder.sections.add.faq")}
            {renderAddBlockButton("serviceGrid", "manager.visualBuilder.sections.add.services")}
            {renderAddBlockButton("teamGrid", "manager.visualBuilder.sections.add.teamGrid")}
            {renderAddBlockButton("contact", "manager.visualBuilder.sections.add.contact")}
            {renderAddBlockButton("contactForm", "manager.visualBuilder.sections.add.contactForm")}
            {renderAddBlockButton("cta", "manager.visualBuilder.sections.add.cta")}
            {renderAddBlockButton("bookingCtaBar", "manager.visualBuilder.sections.add.bookingCtaBar")}
            {renderAddBlockButton("footer", "manager.visualBuilder.sections.add.footer")}
          </Stack>
        </CollapsibleSection>
      </CollapsibleSection>
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

function scrollCanvasToTop() {
  const container = canvasScrollRef.current;
  if (!container) return;
  container.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollCanvasToBottom() {
  const container = canvasScrollRef.current;
  if (!container) return;
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
}

function scrollCanvasToSection(idx) {
  const container = canvasScrollRef.current;
  if (!container && idx !== 0) return;
  if (!container) return;
  const target = container.querySelector(
    `[data-canvas-section-idx="${idx}"]`
  );
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

const renderableSections = safeSections(editing)
  .map((section, idx) => ({ section, idx }))
  .filter(({ section }) => section.type !== "pageStyle");

const CanvasColumn = (
  <SectionCard
    title={t("manager.visualBuilder.canvas.title")}
    description={
      fullPreview
        ? t("manager.visualBuilder.canvas.description.full")
        : t("manager.visualBuilder.canvas.description.block")
    }
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
          <ToggleButton value="short" title={t("manager.visualBuilder.canvas.toggles.titles.short")}>
            {t("manager.visualBuilder.canvas.toggles.height.short")}
          </ToggleButton>
          <ToggleButton value="medium" title={t("manager.visualBuilder.canvas.toggles.titles.medium")}>
            {t("manager.visualBuilder.canvas.toggles.height.medium")}
          </ToggleButton>
          <ToggleButton value="tall" title={t("manager.visualBuilder.canvas.toggles.titles.tall")}>
            {t("manager.visualBuilder.canvas.toggles.height.tall")}
          </ToggleButton>
          <ToggleButton value="auto" title={t("manager.visualBuilder.canvas.toggles.titles.auto")}>
            {t("manager.visualBuilder.canvas.toggles.height.auto")}
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    }
  >
    <SiteFrame
      slug={previewSite.slug}
      activeKey={editing?.slug}
      initialSite={previewSite}
      disableFetch
      wrapChildrenInContainer={fullPreview}
    >
      <Box
        sx={{
          maxHeight:
            fullPreview || canvasMaxHeight === "none" ? "none" : canvasMaxHeight,
          overflow:
            fullPreview || canvasMaxHeight === "none" ? "visible" : "auto",
          transition: "max-height 0.2s ease",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
        ref={canvasScrollRef}
      >
        <NavStyleHydrator website={siteSettings} scopeSelector=".page-scope .site-nav" />

        <Box
          className="page-scope"
          style={pageVars}
          sx={{
            position: "relative",
            backgroundColor: bgColor,
            backgroundImage: bgImage
              ? `linear-gradient(rgba(0,0,0,${1 - bgOpacity}), rgba(0,0,0,${1 - bgOpacity})), url(${bgImage})`
              : "none",
            backgroundRepeat: livePageStyle.backgroundRepeat || "no-repeat",
            backgroundSize: livePageStyle.backgroundSize || "cover",
            backgroundPosition: livePageStyle.backgroundPosition || "center",
            backgroundAttachment: livePageStyle.backgroundAttachment || "fixed",
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
            color: "var(--page-body-color)",
            "& .page-scope, &": {
              "--heading-color": "var(--page-heading-color)",
              "--body-color": "var(--page-body-color)",
              "--link-color": "var(--page-link-color)",
              fontFamily: "var(--page-body-font)",
            },
            "& .MuiPaper-root": {
              backgroundColor: "var(--page-card-bg)",
              borderRadius: "var(--page-card-radius)",
            },
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
                px: { xs: 0, md: 1 },
                pt: 2,
                pb: 0,
                backgroundColor: bgColor,
              }}
            >
              <Box>
                {renderableSections.map(({ section: blk, idx }) => {
                  const key = blk.id || `${blk.type}-${idx}`;
                  const isSelected = selectedBlock === idx;
                  const isFooterBlock = blk?.type === "footer";
                  const nextIsFooter =
                    renderableSections[idx + 1]?.section?.type === "footer";
                  const mb = nextIsFooter ? 0 : 2;
                  return (
                    <React.Fragment key={key}>
                      <Box
                        sx={{
                          position: "relative",
                          borderRadius: 2,
                          border: "1px dashed",
                          borderColor: isSelected ? "primary.main" : "divider",
                          backgroundColor: "transparent",
                          overflow: "hidden",
                          transition: "border-color 0.2s, box-shadow 0.2s",
                          boxShadow: isSelected
                            ? "0 0 0 2px rgba(25,118,210,0.18)"
                            : "none",
                          mt: isFooterBlock ? 0 : undefined,
                          mb,
                          display: "flex",
                          flexDirection: "column",
                        }}
                        data-canvas-section-idx={idx}
                        onClick={() => setSelectedBlock(idx)}
                      >
                        <Box
                          title={t(
                            "manager.visualBuilder.canvas.drag.spaceAbove",
                            "Adjust space above"
                          )}
                          onMouseDown={(e) => startSectionDrag(e, idx, "spaceAbove")}
                          sx={{
                            position: "absolute",
                            top: -8,
                            left: 12,
                            right: 12,
                            height: 8,
                            borderTop: "2px dashed",
                            borderColor: "primary.light",
                            cursor: "ns-resize",
                            opacity: 0.4,
                            "&:hover": { opacity: 1 },
                            pointerEvents: "auto",
                          }}
                        />
                        <Box
                          title={t(
                            "manager.visualBuilder.canvas.drag.gutter",
                            "Adjust horizontal padding"
                          )}
                          onMouseDown={(e) => startSectionDrag(e, idx, "gutterX")}
                          sx={{
                            position: "absolute",
                            top: "25%",
                            bottom: "25%",
                            right: 4,
                            width: 8,
                            borderRight: "2px dashed",
                            borderColor: "primary.light",
                            cursor: "ew-resize",
                            opacity: 0.3,
                            "&:hover": { opacity: 1 },
                            pointerEvents: "auto",
                          }}
                        />

                        <Box
                          sx={{
                            pointerEvents: "none",
                            "& *": { pointerEvents: "none" },
                            flex: 1,
                          }}
                        >
                          <RenderSections
                            sections={[blk]}
                            layout={editingPreview.layout || "boxed"}
                            sectionSpacing={
                              editingPreview?.content?.meta?.sectionSpacing ??
                              6
                            }
                            defaultGutterX={
                              editingPreview?.content?.meta?.defaultGutterX
                            }
                          />
                        </Box>

                        <Box
                          title={t(
                            "manager.visualBuilder.canvas.drag.spaceBelow",
                            "Adjust space below"
                          )}
                          onMouseDown={(e) => startSectionDrag(e, idx, "spaceBelow")}
                          sx={{
                            position: "absolute",
                            bottom: -8,
                            left: 12,
                            right: 12,
                            height: 8,
                            borderBottom: "2px dashed",
                            borderColor: "primary.light",
                            cursor: "ns-resize",
                            opacity: 0.4,
                            "&:hover": { opacity: 1 },
                            pointerEvents: "auto",
                          }}
                        />

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
                              onClick={() => moveBlock(idx, "up")}
                              sx={{ color: "white" }}
                              title={t("manager.visualBuilder.canvas.controls.moveUp")}
                            >
                              <ArrowUpwardIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => moveBlock(idx, "down")}
                              sx={{ color: "white" }}
                              title={t("manager.visualBuilder.canvas.controls.moveDown")}
                            >
                              <ArrowDownwardIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => duplicateBlock(idx)}
                              sx={{ color: "white" }}
                              title={t("manager.visualBuilder.canvas.controls.duplicate")}
                            >
                              <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteBlock(idx)}
                              sx={{ color: "white" }}
                              title={t("manager.visualBuilder.canvas.controls.delete")}
                            >
                              <DeleteIcon fontSize="inherit" />
                            </IconButton>
                          </Stack>
                        </Box>
                      </Box>

                      <InlineStickyInspector.Slot
                        index={idx}
                        selectedIndex={selectedBlock}
                        block={blk}
                        fi={fi}
                        mode={mode}
                        companyId={companyId}
                        onChangeProps={(np) => setBlockPropsAll(idx, np)}
                        onChangeProp={(k, v) => setBlockProp(idx, k, v)}
                        renderAdvancedEditor={({ block, onChangeProps, onChangeProp }) => (
                          <SectionInspector
                            block={block}
                            onChangeProp={onChangeProp}
                            onChangeProps={onChangeProps}
                            companyId={companyId}
                          />
                        )}
                      />
                    </React.Fragment>
                  );
                })}
              </Box>
            </Box>
          )}

          {!safeSections(editing).length && !suppressEmptyState && (
            <SectionCard
              title={t("manager.visualBuilder.canvas.empty.title")}
              description={t("manager.visualBuilder.canvas.empty.description")}
            >
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
      </Box>
    </SiteFrame>
  </SectionCard>
);



function InspectorColumn() {
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
  const shadowPresets = [
    { key: "none", label: "None", value: "" },
    { key: "soft", label: "Soft", value: "0 8px 24px rgba(0,0,0,0.12)" },
    { key: "medium", label: "Medium", value: "0 12px 32px rgba(0,0,0,0.18)" },
    { key: "strong", label: "Strong", value: "0 18px 48px rgba(0,0,0,0.24)" },
    { key: "glass", label: "Glass", value: "0 12px 32px rgba(15,23,42,0.28)" },
  ];
  const matchShadowPreset = (val) =>
    shadowPresets.find((preset) => (val || "").trim() === preset.value) || null;
  const isShadowValid = (val) =>
    !val ||
    /-?\d+px\s+-?\d+px/.test(val) ||
    /rgba?\(/i.test(val) ||
    /#/.test(val);
  const parseBoxShadow = (val) => {
    const fallback = { x: 0, y: 12, blur: 32, spread: 0, color: "#000000", opacity: 0.18 };
    if (!val || typeof val !== "string") return fallback;
    const match =
      /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px(?:\s+(-?\d+(?:\.\d+)?)px)?\s+(.+)/.exec(
        val.trim()
      );
    if (!match) return fallback;
    const parsedColor = parseCssColor(match[5], fallback.opacity);
    return {
      x: Number(match[1]),
      y: Number(match[2]),
      blur: Number(match[3]),
      spread: Number(match[4] || 0),
      color: parsedColor.hex || fallback.color,
      opacity: parsedColor.opacity,
    };
  };
  const parseTextShadow = (val) => {
    const fallback = { x: 0, y: 6, blur: 18, color: "#000000", opacity: 0.25 };
    if (!val || typeof val !== "string") return fallback;
    const match =
      /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px\s+(.+)/.exec(
        val.trim()
      );
    if (!match) return fallback;
    const parsedColor = parseCssColor(match[4], fallback.opacity);
    return {
      x: Number(match[1]),
      y: Number(match[2]),
      blur: Number(match[3]),
      color: parsedColor.hex || fallback.color,
      opacity: parsedColor.opacity,
    };
  };
  const buildBoxShadow = ({ x, y, blur, spread, color, opacity }) =>
    `${x}px ${y}px ${blur}px ${spread}px ${hexToRgba(color, opacity)}`;
  const buildTextShadow = ({ x, y, blur, color, opacity }) =>
    `${x}px ${y}px ${blur}px ${hexToRgba(color, opacity)}`;
  const colorField = ({ label, value, onChange: onColorChange, helperText }) => {
    const normalized = normalizeHexColor(value) || "#000000";
    return (
      <TextField
        size="small"
        label={label}
        value={value || ""}
        onChange={(e) => onColorChange(e.target.value)}
        helperText={helperText}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <ButtonBase
                component="label"
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: normalized,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Box
                  component="input"
                  type="color"
                  value={normalized}
                  onChange={(e) => onColorChange(e.target.value)}
                  sx={{ opacity: 0, position: "absolute", width: "100%", height: "100%" }}
                />
              </ButtonBase>
            </InputAdornment>
          ),
        }}
      />
    );
  };

  const selectedBlockObj = safeSections(editing)[selectedBlock] || {};
  const selectedProps = selectedBlockObj?.props || {};
  const filteredSchemaForBlock = useMemo(() => {
    if (!schemaForBlock || !schemaForBlock.fields) return schemaForBlock;
    const filteredFields = schemaForBlock.fields.filter(
      (field) => !["overlayGradient", "brightness"].includes(field.name)
    );
    return { ...schemaForBlock, fields: filteredFields };
  }, [schemaForBlock]);
  const hasBackgroundImage =
    selectedProps.backgroundUrl || selectedProps.image || selectedProps.backgroundImage;
  const cardShadowPreset = matchShadowPreset(selectedProps.cardShadow)?.key || "custom";
  const heroShadowPreset =
    matchShadowPreset(selectedProps.heroHeadingShadow)?.key || "custom";
  const cardShadowValues = parseBoxShadow(selectedProps.cardShadow || "");
  const heroShadowValues = parseTextShadow(selectedProps.heroHeadingShadow || "");
  const updateCardShadow = (patch) => {
    const next = { ...cardShadowValues, ...patch };
    setBlockProp(selectedBlock, "cardShadow", buildBoxShadow(next));
  };
  const updateHeroShadow = (patch) => {
    const next = { ...heroShadowValues, ...patch };
    setBlockProp(selectedBlock, "heroHeadingShadow", buildTextShadow(next));
  };
  const [cardShadowBuilderOpen, setCardShadowBuilderOpen] = useState(false);
  const [heroShadowBuilderOpen, setHeroShadowBuilderOpen] = useState(false);
  const overlayGradientPresets = [
    { key: "none", label: "None", value: "" },
    {
      key: "subtle-dark",
      label: "Subtle Dark",
      value: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%)",
    },
    {
      key: "strong-dark",
      label: "Strong Dark",
      value: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 100%)",
    },
    {
      key: "soft-light",
      label: "Soft Light",
      value: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)",
    },
    {
      key: "brand-tint",
      label: "Brand Tint",
      value: "linear-gradient(180deg, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.05) 100%)",
    },
  ];
  const overlayGradientValue = selectedProps.overlayGradient || "";
  const overlayGradientPreset =
    overlayGradientPresets.find((p) => p.value === overlayGradientValue)?.key || "custom";
  const isGradientValid = (val) =>
    !val || /^linear-gradient\(/i.test(val.trim());
  const parseGradient = (val) => {
    const fallback = {
      angle: 180,
      stops: [
        { color: "#000000", stop: 15, opacity: 0.35 },
        { color: "#000000", stop: 100, opacity: 0.6 },
      ],
    };
    if (!val || typeof val !== "string") return fallback;
    const match = /linear-gradient\(([^,]+),(.+)\)/i.exec(val);
    if (!match) return fallback;
    const angle = Number(String(match[1]).replace("deg", "").trim());
    const parts = match[2]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const stops = parts.slice(0, 3).map((p, idx) => {
      const seg = p.split(/\s+/);
      const colorStr = seg[0];
      const stop = seg[1] ? Number(seg[1].replace("%", "")) : idx === 0 ? 0 : 100;
      const parsed = parseCssColor(colorStr, 0.35);
      return {
        color: parsed.hex || "#000000",
        opacity: parsed.opacity,
        stop: Number.isFinite(stop) ? stop : idx === 0 ? 0 : 100,
      };
    });
    return {
      angle: Number.isFinite(angle) ? angle : fallback.angle,
      stops: stops.length >= 2 ? stops : fallback.stops,
    };
  };
  const [overlayAngle, setOverlayAngle] = useState(180);
  const [overlayStops, setOverlayStops] = useState([
    { color: "#000000", stop: 0, opacity: 0.35 },
    { color: "#000000", stop: 100, opacity: 0.6 },
  ]);
  useEffect(() => {
    const parsed = parseGradient(overlayGradientValue);
    setOverlayAngle(parsed.angle);
    setOverlayStops(parsed.stops);
  }, [overlayGradientValue]);
  const buildOverlayGradient = (angle, stops) => {
    const parts = stops
      .filter((s) => s.color)
      .map((s) => `${hexToRgba(s.color, s.opacity)} ${s.stop}%`);
    return `linear-gradient(${angle}deg, ${parts.join(", ")})`;
  };
  const updateOverlayStop = (index, patch) => {
    const next = overlayStops.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setOverlayStops(next);
    setBlockProp(selectedBlock, "overlayGradient", buildOverlayGradient(overlayAngle, next));
  };
  const updateOverlayAngle = (nextAngle) => {
    setOverlayAngle(nextAngle);
    setBlockProp(selectedBlock, "overlayGradient", buildOverlayGradient(nextAngle, overlayStops));
  };
  const hasOverlayGradient = overlayGradientValue !== "";
  const brightnessValue = Number.isFinite(Number(selectedProps.brightness))
    ? Number(selectedProps.brightness)
    : 1;

  return (
    <Stack spacing={1.5}>
    <CollapsibleSection
      id="page-style-card-wrapper"
      title={t("manager.visualBuilder.pageStyle.title")}
      description={t("manager.visualBuilder.pageStyle.description")}
      expanded={pageStyleOpen}
      onChange={(next) => setPageStyleOpen(next)}
      defaultExpanded={false}
    >
      <PageStyleCard
        value={
          readPageStyleProps(editing) ||
          editing?.content?.meta?.pageStyle ||
          editing?.content?.style ||
          {}
        }
        onChange={(next) => {
          setEditing((cur) => {
            const content = { ...(cur.content || {}) };
            content.meta = { ...(content.meta || {}), pageStyle: next };
            content.style = { ...(content.style || {}), ...next };
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
            content.meta = { ...(content.meta || {}), pageStyle: next };
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
    </CollapsibleSection>

    <CollapsibleSection
      id="inspector-block"
      title={t("manager.visualBuilder.inspector.title")}
      description={t("manager.visualBuilder.inspector.description")}
      expanded={inspectorOpen}
      onChange={(next) => setInspectorOpen(next)}
      defaultExpanded={false}
      actions={
        <Tooltip title={t("manager.visualBuilder.sections.hint")}>
          <IconButton size="small" edge="end">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      }
    >
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
          <Tabs
            value={inspectorTab}
            onChange={(_, v) => setInspectorTab(v)}
            variant="fullWidth"
            sx={{ mb: 1 }}
          >
            <Tab value="content" label="Content" />
            <Tab value="style" label="Style" />
            <Tab value="advanced" label="Advanced" />
          </Tabs>

          {inspectorTab === "content" && (
            <>
              {schemaForBlock ? (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>
                    Content
                  </Typography>
                  <SchemaInspector
                    schema={filteredSchemaForBlock}
                    value={safeSections(editing)[selectedBlock]?.props || {}}
                    onChange={(props) => setBlockPropsAll(selectedBlock, props)}
                    companyId={companyId}
                  />
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This section type isn’t mapped to a visual inspector yet.
                  {blockType ? (
                    <>
                      {" "}
                      Current type: <strong>{blockType}</strong>
                    </>
                  ) : null}{" "}
                  You can still edit its props below.
                </Alert>
              )}
            </>
          )}

          {inspectorTab === "style" && (
            <Box sx={{ mt: 1 }}>
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
                      const defaultPy = blk.type === "hero" ? 0 : 32;
                      setEditing((cur) => {
                        const sections = [...safeSections(cur)];
                        const b = { ...sections[selectedBlock] };
                        b.sx = { ...(b.sx || {}), py: defaultPy };
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
                    {(hasBackgroundImage || selectedProps.backgroundColor) && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Background
                        </Typography>
                        {hasBackgroundImage && (
                          <ImageField
                            label="Background image"
                            value={
                              selectedProps.backgroundUrl ||
                              selectedProps.image ||
                              selectedProps.backgroundImage ||
                              ""
                            }
                            onChange={(url) =>
                              setBlockProp(
                                selectedBlock,
                                selectedProps.backgroundUrl ? "backgroundUrl" : "backgroundImage",
                                url
                              )
                            }
                            companyId={companyId}
                          />
                        )}
                        {selectedProps.backgroundColor && (
                          <Box sx={{ mt: 1 }}>
                            {colorField({
                              label: "Background color",
                              value: selectedProps.backgroundColor,
                              onChange: (val) =>
                                setBlockProp(selectedBlock, "backgroundColor", val),
                            })}
                          </Box>
                        )}
                      </Box>
                    )}

                    {(selectedProps.headingColor || selectedProps.bodyColor || selectedProps.linkColor) && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Typography
                        </Typography>
                        <Stack spacing={1}>
                          {selectedProps.headingColor &&
                            colorField({
                              label: "Heading color",
                              value: selectedProps.headingColor,
                              onChange: (val) =>
                                setBlockProp(selectedBlock, "headingColor", val),
                            })}
                          {selectedProps.bodyColor &&
                            colorField({
                              label: "Body color",
                              value: selectedProps.bodyColor,
                              onChange: (val) =>
                                setBlockProp(selectedBlock, "bodyColor", val),
                            })}
                          {selectedProps.linkColor &&
                            colorField({
                              label: "Link color",
                              value: selectedProps.linkColor,
                              onChange: (val) =>
                                setBlockProp(selectedBlock, "linkColor", val),
                            })}
                        </Stack>
                      </Box>
                    )}

                    {(selectedProps.cardShadow || selectedProps.cardRadius || selectedProps.cardBlur) && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Card / Container
                        </Typography>
                        {selectedProps.cardRadius != null && (
                          <Stack spacing={1}>
                            <Typography variant="caption" color="text.secondary">
                              Card radius (px)
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Slider
                                size="small"
                                min={0}
                                max={32}
                                step={1}
                                value={Number(selectedProps.cardRadius) || 0}
                                valueLabelDisplay="auto"
                                onChange={(_, val) =>
                                  typeof val === "number" &&
                                  setBlockProp(selectedBlock, "cardRadius", val)
                                }
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                size="small"
                                value={Number(selectedProps.cardRadius) || 0}
                                onChange={(e) =>
                                  setBlockProp(
                                    selectedBlock,
                                    "cardRadius",
                                    Number(e.target.value || 0)
                                  )
                                }
                                inputProps={{ step: 1, min: 0, max: 32 }}
                                sx={{ width: 90 }}
                              />
                            </Stack>
                          </Stack>
                        )}
                        {selectedProps.cardBlur != null && (
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Card blur (px)
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Slider
                                size="small"
                                min={0}
                                max={30}
                                step={1}
                                value={Number(selectedProps.cardBlur) || 0}
                                valueLabelDisplay="auto"
                                onChange={(_, val) =>
                                  typeof val === "number" &&
                                  setBlockProp(selectedBlock, "cardBlur", val)
                                }
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                size="small"
                                value={Number(selectedProps.cardBlur) || 0}
                                onChange={(e) =>
                                  setBlockProp(
                                    selectedBlock,
                                    "cardBlur",
                                    Number(e.target.value || 0)
                                  )
                                }
                                inputProps={{ step: 1, min: 0, max: 30 }}
                                sx={{ width: 90 }}
                              />
                            </Stack>
                          </Stack>
                        )}
                        {selectedProps.cardShadow != null && (
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            <FormControl size="small" fullWidth>
                              <InputLabel>Card shadow preset</InputLabel>
                              <Select
                                label="Card shadow preset"
                                value={cardShadowPreset}
                                onChange={(e) => {
                                  const key = e.target.value;
                                  if (key === "custom") return;
                                  const preset = shadowPresets.find((p) => p.key === key);
                                  setBlockProp(selectedBlock, "cardShadow", preset ? preset.value : "");
                                }}
                              >
                                {shadowPresets.map((preset) => (
                                  <MenuItem key={preset.key} value={preset.key}>
                                    {preset.label}
                                  </MenuItem>
                                ))}
                                <MenuItem value="custom">Custom</MenuItem>
                              </Select>
                              <FormHelperText>Pick a preset or customize with the builder.</FormHelperText>
                            </FormControl>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setCardShadowBuilderOpen((prev) => !prev)}
                              >
                                {cardShadowBuilderOpen ? "Hide builder" : "Shadow builder"}
                              </Button>
                            </Stack>
                            {cardShadowBuilderOpen && (
                              <Stack spacing={1}>
                                <Stack direction="row" spacing={1}>
                                  <TextField
                                    size="small"
                                    label="X"
                                    type="number"
                                    value={cardShadowValues.x}
                                    onChange={(e) => updateCardShadow({ x: Number(e.target.value || 0) })}
                                  />
                                  <TextField
                                    size="small"
                                    label="Y"
                                    type="number"
                                    value={cardShadowValues.y}
                                    onChange={(e) => updateCardShadow({ y: Number(e.target.value || 0) })}
                                  />
                                  <TextField
                                    size="small"
                                    label="Blur"
                                    type="number"
                                    value={cardShadowValues.blur}
                                    onChange={(e) => updateCardShadow({ blur: Number(e.target.value || 0) })}
                                  />
                                  <TextField
                                    size="small"
                                    label="Spread"
                                    type="number"
                                    value={cardShadowValues.spread}
                                    onChange={(e) => updateCardShadow({ spread: Number(e.target.value || 0) })}
                                  />
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {colorField({
                                    label: "Shadow color",
                                    value: cardShadowValues.color,
                                    onChange: (val) => updateCardShadow({ color: val }),
                                  })}
                                  <Stack spacing={0.5} sx={{ minWidth: 140 }}>
                                    <Typography variant="caption">Opacity</Typography>
                                    <Slider
                                      size="small"
                                      min={0}
                                      max={1}
                                      step={0.05}
                                      value={cardShadowValues.opacity}
                                      valueLabelDisplay="auto"
                                      onChange={(_, val) =>
                                        typeof val === "number" && updateCardShadow({ opacity: val })
                                      }
                                    />
                                  </Stack>
                                </Stack>
                              </Stack>
                            )}
                            {cardShadowPreset === "custom" && (
                              <TextField
                                size="small"
                                label="Card shadow (CSS)"
                                value={selectedProps.cardShadow || ""}
                                onChange={(e) =>
                                  setBlockProp(selectedBlock, "cardShadow", e.target.value)
                                }
                                placeholder="0 8px 24px rgba(0,0,0,0.12)"
                                error={!isShadowValid(selectedProps.cardShadow || "")}
                                helperText={
                                  isShadowValid(selectedProps.cardShadow || "")
                                    ? "Example: 0 8px 24px rgba(0,0,0,0.12)"
                                    : "Enter a valid CSS shadow."
                                }
                                fullWidth
                              />
                            )}
                          </Stack>
                        )}
                      </Box>
                    )}

                    {selectedProps.heroHeadingShadow != null && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Hero heading shadow
                        </Typography>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Hero shadow preset</InputLabel>
                          <Select
                            label="Hero shadow preset"
                            value={heroShadowPreset}
                            onChange={(e) => {
                              const key = e.target.value;
                              if (key === "custom") return;
                              const preset = shadowPresets.find((p) => p.key === key);
                              setBlockProp(
                                selectedBlock,
                                "heroHeadingShadow",
                                preset ? preset.value : ""
                              );
                            }}
                          >
                            {shadowPresets.map((preset) => (
                              <MenuItem key={preset.key} value={preset.key}>
                                {preset.label}
                              </MenuItem>
                            ))}
                            <MenuItem value="custom">Custom</MenuItem>
                          </Select>
                          <FormHelperText>Pick a preset or customize with the builder.</FormHelperText>
                        </FormControl>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setHeroShadowBuilderOpen((prev) => !prev)}
                          >
                            {heroShadowBuilderOpen ? "Hide builder" : "Shadow builder"}
                          </Button>
                        </Stack>
                        {heroShadowBuilderOpen && (
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1}>
                              <TextField
                                size="small"
                                label="X"
                                type="number"
                                value={heroShadowValues.x}
                                onChange={(e) => updateHeroShadow({ x: Number(e.target.value || 0) })}
                              />
                              <TextField
                                size="small"
                                label="Y"
                                type="number"
                                value={heroShadowValues.y}
                                onChange={(e) => updateHeroShadow({ y: Number(e.target.value || 0) })}
                              />
                              <TextField
                                size="small"
                                label="Blur"
                                type="number"
                                value={heroShadowValues.blur}
                                onChange={(e) => updateHeroShadow({ blur: Number(e.target.value || 0) })}
                              />
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {colorField({
                                label: "Shadow color",
                                value: heroShadowValues.color,
                                onChange: (val) => updateHeroShadow({ color: val }),
                              })}
                              <Stack spacing={0.5} sx={{ minWidth: 140 }}>
                                <Typography variant="caption">Opacity</Typography>
                                <Slider
                                  size="small"
                                  min={0}
                                  max={1}
                                  step={0.05}
                                  value={heroShadowValues.opacity}
                                  valueLabelDisplay="auto"
                                  onChange={(_, val) =>
                                    typeof val === "number" && updateHeroShadow({ opacity: val })
                                  }
                                />
                              </Stack>
                            </Stack>
                            <Paper variant="outlined" sx={{ p: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{ textShadow: selectedProps.heroHeadingShadow || "none" }}
                              >
                                Shadow preview text
                              </Typography>
                            </Paper>
                          </Stack>
                        )}
                        {heroShadowPreset === "custom" && (
                          <TextField
                            size="small"
                            label="Hero heading shadow (CSS)"
                            value={selectedProps.heroHeadingShadow || ""}
                            onChange={(e) =>
                              setBlockProp(selectedBlock, "heroHeadingShadow", e.target.value)
                            }
                            error={!isShadowValid(selectedProps.heroHeadingShadow || "")}
                            helperText={
                              isShadowValid(selectedProps.heroHeadingShadow || "")
                                ? "Example: 0 2px 24px rgba(0,0,0,0.25)"
                                : "Enter a valid CSS shadow."
                            }
                            fullWidth
                          />
                        )}
                      </Box>
                    )}

                    {(selectedProps.overlayGradient != null ||
                      selectedProps.brightness != null) && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Background overlay
                        </Typography>
                        <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                          <InputLabel>Overlay preset</InputLabel>
                          <Select
                            label="Overlay preset"
                            value={overlayGradientPreset}
                            onChange={(e) => {
                              const key = e.target.value;
                              if (key === "custom") return;
                              const preset = overlayGradientPresets.find((p) => p.key === key);
                              setBlockProp(
                                selectedBlock,
                                "overlayGradient",
                                preset ? preset.value : ""
                              );
                            }}
                          >
                            {overlayGradientPresets.map((preset) => (
                              <MenuItem key={preset.key} value={preset.key}>
                                {preset.label}
                              </MenuItem>
                            ))}
                            <MenuItem value="custom">Custom</MenuItem>
                          </Select>
                          <FormHelperText>Choose a preset or build your own gradient.</FormHelperText>
                        </FormControl>

                        <Stack spacing={1}>
                          <Typography variant="caption" color="text.secondary">
                            Angle
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Slider
                              size="small"
                              min={0}
                              max={360}
                              value={overlayAngle}
                              valueLabelDisplay="auto"
                              onChange={(_, val) =>
                                typeof val === "number" && updateOverlayAngle(val)
                              }
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              size="small"
                              value={overlayAngle}
                              onChange={(e) => {
                                const num = Number(e.target.value);
                                if (Number.isFinite(num)) updateOverlayAngle(Math.max(0, Math.min(360, num)));
                              }}
                              sx={{ width: 90 }}
                            />
                          </Stack>
                        </Stack>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          {overlayStops.map((stop, idx) => (
                            <Stack key={idx} direction="row" spacing={1} alignItems="center">
                              {colorField({
                                label: `Stop ${idx + 1}`,
                                value: stop.color,
                                onChange: (val) => updateOverlayStop(idx, { color: val }),
                              })}
                              <TextField
                                size="small"
                                label="%"
                                value={stop.stop}
                                onChange={(e) =>
                                  updateOverlayStop(idx, {
                                    stop: Math.max(0, Math.min(100, Number(e.target.value || 0))),
                                  })
                                }
                                sx={{ width: 80 }}
                              />
                              <Stack spacing={0.5} sx={{ minWidth: 120 }}>
                                <Typography variant="caption">Opacity</Typography>
                                <Slider
                                  size="small"
                                  min={0}
                                  max={1}
                                  step={0.05}
                                  value={stop.opacity}
                                  valueLabelDisplay="auto"
                                  onChange={(_, val) =>
                                    typeof val === "number" && updateOverlayStop(idx, { opacity: val })
                                  }
                                />
                              </Stack>
                            </Stack>
                          ))}
                        </Stack>

                        {overlayGradientPreset === "custom" && (
                          <TextField
                            size="small"
                            label="Overlay gradient CSS"
                            value={overlayGradientValue}
                            onChange={(e) =>
                              setBlockProp(selectedBlock, "overlayGradient", e.target.value)
                            }
                            placeholder="linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.6))"
                            error={!isGradientValid(overlayGradientValue)}
                            helperText={
                              isGradientValid(overlayGradientValue)
                                ? "Example: linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.6))"
                                : "Enter a valid linear-gradient(...) string."
                            }
                            fullWidth
                          />
                        )}

                        {selectedProps.brightness != null && (
                          <Stack spacing={1} sx={{ mt: 2 }}>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="caption" color="text.secondary">
                                Background brightness
                              </Typography>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => setBlockProp(selectedBlock, "brightness", 1)}
                              >
                                Reset
                              </Button>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Slider
                                size="small"
                                min={0.5}
                                max={1.5}
                                step={0.05}
                                value={brightnessValue}
                                valueLabelDisplay="auto"
                                onChange={(_, val) =>
                                  typeof val === "number" &&
                                  setBlockProp(selectedBlock, "brightness", Math.max(0.5, Math.min(1.5, val)))
                                }
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                size="small"
                                value={brightnessValue}
                                onChange={(e) =>
                                  setBlockProp(
                                    selectedBlock,
                                    "brightness",
                                    Math.max(0.5, Math.min(1.5, Number(e.target.value || 1)))
                                  )
                                }
                                sx={{ width: 90 }}
                              />
                            </Stack>
                            <FormHelperText>1.0 = original brightness</FormHelperText>
                          </Stack>
                        )}

                        <Paper
                          variant="outlined"
                          sx={{
                            mt: 2,
                            p: 1,
                            height: 80,
                            borderRadius: 1.5,
                            background:
                              overlayGradientValue ||
                              "linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6))",
                            filter: `brightness(${brightnessValue})`,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: "#fff" }}>
                            Overlay preview
                          </Typography>
                        </Paper>
                      </Box>
                    )}

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
                        marks={[0, 2, 4, 6, 8, 10, 12].map((v) => ({ value: v, label: String(v) }))}
                        onChange={(_, v) =>
                          setBlockProp(selectedBlock, "spaceAbove", Number(v))
                        }
                      />
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        Tip: {t("manager.visualBuilder.pages.settings.sectionSpacing.hint")}
                      </Typography>
                    </Box>

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
                        marks={[0, 2, 4, 6, 8, 10, 12].map((v) => ({ value: v, label: String(v) }))}
                        onChange={(_, v) =>
                          setBlockProp(selectedBlock, "spaceBelow", Number(v))
                        }
                      />
                    </Box>
                  </Stack>
                );
              })()}
            </Box>
          )}

          {inspectorTab === "advanced" && (
            <Box sx={{ mt: 1 }}>
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
          )}
        </>
      )}
    </CollapsibleSection>
    </Stack>
  );
}


  const builderColumns = isLgDown ? (
    <Stack spacing={2}>
      <Box>{LeftColumn}</Box>
      <Box>{CanvasColumn}</Box>
    </Stack>
  ) : (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={4}>
        <Box
          sx={{
            position: "sticky",
            top: 16,
            maxHeight: "calc(100vh - 180px)",
            overflowY: "auto",
            pr: 1,
          }}
        >
          {LeftColumn}
        </Box>
      </Grid>
      <Grid item xs={12} lg={8}>
        {CanvasColumn}
      </Grid>
    </Grid>
  );

const tabs = [
  {
    label: t("manager.visualBuilder.tabs.build"),
    content: (
      <Stack spacing={2}>
        {ControlsCard}
        {AlertsCard}
        {builderColumns}
      </Stack>
    ),
  },
];

const disablePublish = busy || !companyId;
const floatingPublishText = hasDraftChanges
  ? t(
      "manager.visualBuilder.controls.publishFloatingPending",
      "Publish your latest edits"
    )
  : t(
      "manager.visualBuilder.controls.publishFloatingReady",
      "Publish site"
    );

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

      {pageSettingsDirty && (
        <Box
          sx={{
            position: "fixed",
            bottom: { xs: 88, md: 110 },
            right: { xs: 16, md: 40 },
            zIndex: (theme) => theme.zIndex.tooltip + 2,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              borderRadius: 999,
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography
              variant="body2"
              sx={{ display: { xs: "none", sm: "block" }, fontWeight: 600 }}
            >
              Unsaved page settings
            </Typography>
            <Button
              size="small"
              variant="outlined"
              disabled={busy || !companyId}
              onClick={discardPageSettings}
            >
              Discard
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={busy || !companyId}
              onClick={savePageMeta}
            >
              Save
            </Button>
          </Paper>
        </Box>
      )}

      {companyId && (
        <Box
          sx={{
            position: "fixed",
            bottom: { xs: 24, md: 36 },
            right: { xs: 16, md: 40 },
            zIndex: (theme) => theme.zIndex.tooltip + 1,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              borderRadius: 999,
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.18)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography
              variant="body2"
              sx={{ display: { xs: "none", sm: "block" }, fontWeight: 600 }}
            >
              {floatingPublishText}
            </Typography>
            <Tooltip title={t("manager.visualBuilder.controls.tooltips.publish")}>
              <span>
                <Button
                  size="small"
                  startIcon={<PublishIcon />}
                  variant="contained"
                  disabled={disablePublish}
                  onClick={onPublish}
                >
                  {t("manager.visualBuilder.controls.buttons.publish")}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={t("manager.visualBuilder.controls.tooltips.viewLive", "View live site")}>
              <span>
                <Button
                  size="small"
                  startIcon={<OpenInNewIcon />}
                  variant="outlined"
                  disabled={!liveSiteUrl}
                  onClick={() => {
                    if (!liveSiteUrl) return;
                    window.open(liveSiteUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  {t("manager.visualBuilder.controls.buttons.viewLive", "View live")}
                </Button>
              </span>
            </Tooltip>
          </Paper>
        </Box>
      )}

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

      <Drawer
        anchor="right"
        open={isLgDown && inspectorDrawerOpen}
        onClose={() => setInspectorDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { lg: "none" } }}
      >
        <Box sx={{ width: { xs: "90vw", sm: 420 }, maxWidth: 480, p: 2 }}>
          <InspectorColumn />
        </Box>
      </Drawer>

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
                setSiteSettings(s?.data || null);
              })
              .catch(() => {});
          }
        }}
      >
        <Box sx={{ width: { xs: "90vw", sm: 420, md: 480 }, maxWidth: 520, p: 2 }}>
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

      <Dialog
        open={blockPreview.open}
        onClose={closeBlockPreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          {blockPreview.label || "Block preview"}
          <IconButton
            onClick={closeBlockPreview}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {blockPreview.src ? (
            <Box
              component="img"
              src={blockPreview.src}
              alt={`${blockPreview.label || "Block"} preview`}
              sx={{
                width: "100%",
                height: "auto",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
