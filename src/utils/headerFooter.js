// src/utils/headerFooter.js
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

const cleanLinks = (items = [], limit = 8) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      label: (item?.label || "").trim(),
      href: (item?.href || "").trim(),
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
  bg: "",
  text: "",
  nav_items: [],
  social_links: [],
});

export const defaultFooterConfig = () => ({
  logo_asset_id: null,
  logo_asset: null,
  bg: "",
  text: "",
  columns: [],
  legal_links: [],
  social_links: [],
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
  };
};

export const mergeHeaderFooterIntoSettings = (settings = {}, header, footer) => ({
  ...settings,
  header: normalizeHeaderConfig(header || settings.header || {}),
  footer: normalizeFooterConfig(footer || settings.footer || {}),
});
