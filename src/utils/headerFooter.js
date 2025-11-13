// src/utils/headerFooter.js
import { DEFAULT_COPYRIGHT_TEXT } from "./footerDefaults";
export const SOCIAL_ICON_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "Twitter / X" },
  { value: "threads", label: "Threads" },
  { value: "pinterest", label: "Pinterest" },
];

const clampNumber = (value, min, max, fallback) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  let clamped = num;
  if (typeof min === "number") clamped = Math.max(min, clamped);
  if (typeof max === "number") clamped = Math.min(max, clamped);
  return clamped;
};

const alignChoice = (value, fallback = "left") => {
  const allowed = new Set([
    "far-left",
    "left",
    "center",
    "right",
    "far-right",
  ]);
  if (typeof value === "string") {
    const candidate = value.trim().toLowerCase();
    if (allowed.has(candidate)) return candidate;
  }
  return fallback;
};

const socialPositionChoice = (value, fallback = "inline") => {
  const allowed = new Set(["inline", "above", "below", "after"]);
  if (typeof value === "string") {
    const candidate = value.trim().toLowerCase();
    if (allowed.has(candidate)) return candidate;
  }
  return fallback;
};

const cleanLinks = (items = [], limit = 8) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      label: (item?.label || "").trim(),
      href: normalizeLegacyHref(item?.href || ""),
    }))
    .filter((item) => item.label || item.href)
    .slice(0, limit);

const cleanSocial = (items = [], limit = 8) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      icon: (item?.icon || "").toLowerCase().trim(),
      href: (item?.href || "").trim(),
      label: (item?.label || "").trim(),
    }))
    .filter((item) => item.icon && item.href)
    .slice(0, limit);

const cleanColumns = (columns = [], columnLimit = 4, linksLimit = 6) =>
  (Array.isArray(columns) ? columns : [])
    .map((col) => ({
      title: (col?.title || "").trim(),
      links: cleanLinks(col?.links || [], linksLimit),
    }))
    .filter((col) => col.title || col.links.length)
    .slice(0, columnLimit);

export const defaultHeaderConfig = () => ({
  logo_asset_id: null,
  logo_asset: null,
  layout: "simple",
  sticky: true,
  full_width: true,
  bg: "",
  text: "",
  nav_items: [],
  social_links: [],
  logo_width: 140,
  logo_height: null,
  logo_alignment: "left",
  nav_alignment: "right",
  social_alignment: "right",
  social_position: "inline",
  padding_y: 20,
  show_brand_text: true,
});

export const defaultFooterConfig = () => ({
  logo_asset_id: null,
  logo_asset: null,
  bg: "",
  text: "",
  columns: [],
  legal_links: [],
  social_links: [],
  show_copyright: true,
  copyright_text: DEFAULT_COPYRIGHT_TEXT,
});

export const normalizeHeaderConfig = (value, { preserveAssets = true } = {}) => {
  const base = defaultHeaderConfig();
  if (!value || typeof value !== "object") return base;
  return {
    ...base,
    ...value,
    logo_asset_id: value.logo_asset_id ?? base.logo_asset_id,
    logo_asset: preserveAssets ? value.logo_asset || null : null,
    layout: value.layout || base.layout,
    sticky: value.sticky !== undefined ? Boolean(value.sticky) : base.sticky,
    bg: value.bg ?? base.bg,
    text: value.text ?? base.text,
    nav_items: cleanLinks(value.nav_items, 8),
    social_links: cleanSocial(value.social_links, 6),
    logo_width: clampNumber(value.logo_width, 40, 360, base.logo_width),
    logo_height: value.logo_height != null
      ? clampNumber(value.logo_height, 20, 200, base.logo_height)
      : base.logo_height,
    logo_alignment: alignChoice(value.logo_alignment, base.logo_alignment),
    nav_alignment: alignChoice(value.nav_alignment, base.nav_alignment),
    social_alignment: alignChoice(value.social_alignment, base.social_alignment),
    social_position: socialPositionChoice(value.social_position, base.social_position),
    padding_y: clampNumber(value.padding_y, 4, 160, base.padding_y),
    show_brand_text:
      value.show_brand_text === undefined
        ? base.show_brand_text
        : Boolean(value.show_brand_text),
    full_width:
      value.full_width === undefined
        ? base.full_width
        : Boolean(value.full_width),
  };
};

export const normalizeFooterConfig = (value, { preserveAssets = true } = {}) => {
  const base = defaultFooterConfig();
  if (!value || typeof value !== "object") return base;
  return {
    ...base,
    ...value,
    logo_asset_id: value.logo_asset_id ?? base.logo_asset_id,
    logo_asset: preserveAssets ? value.logo_asset || null : null,
    bg: value.bg ?? base.bg,
    text: value.text ?? base.text,
    columns: cleanColumns(value.columns, 4, 6),
    legal_links: cleanLinks(value.legal_links, 6),
    social_links: cleanSocial(value.social_links, 6),
    show_copyright:
      value.show_copyright === undefined
        ? base.show_copyright
        : Boolean(value.show_copyright),
    copyright_text:
      typeof value.copyright_text === "string"
        ? value.copyright_text
        : base.copyright_text,
  };
};

export const mergeHeaderFooterIntoSettings = (settings = {}, header, footer) => ({
  ...settings,
  header: normalizeHeaderConfig(header || settings.header || {}),
  footer: normalizeFooterConfig(footer || settings.footer || {}),
});
const LEGAL_PATH_MAP = {
  "/terms": "?page=terms",
  "/terms-of-service": "?page=terms",
  "/privacy": "?page=privacy",
  "/privacy-policy": "?page=privacy",
  "/policies": "?page=policies",
  "/policy": "?page=policies",
  "/cookies": "?page=cookies",
  "/cookie-policy": "?page=cookies",
};

const normalizeLegacyHref = (value) => {
  if (!value || typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "schedulaa.com") {
      const mapped = LEGAL_PATH_MAP[url.pathname.toLowerCase()];
      if (mapped) return mapped;
    }
  } catch (err) {
    const lower = trimmed.toLowerCase();
    const plain = LEGAL_PATH_MAP[lower];
    if (plain) return plain;
  }
  return trimmed;
};
