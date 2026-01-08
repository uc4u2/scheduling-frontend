// src/utils/navStyle.js
export const NAV_STYLE_DEFAULT = Object.freeze({
  variant: "pill",
  font_weight: 600,
  text_transform: "none",
  item_spacing: 12,
  padding_x: 20,
  padding_y: 10,
  border_radius: 999,
  // Default to the page link colour first so builders can change nav colour
  // without hunting for theme overrides. Falls back to the primary token.
  bg: "var(--page-link-color, var(--sched-primary, #6366F1))",
  bg_hover: "var(--page-link-color, var(--sched-primary, #6366F1))",
  text: "#ffffff",
  text_hover: "#ffffff",
  active_bg: "rgba(255,255,255,0.18)",
  active_text: "var(--page-link-color, var(--sched-primary, #6366F1))",
  shadow: "0 20px 34px rgba(15,23,42,0.18)",
  divider: null,
  brand_font_family: "inherit",
  brand_font_size: 20,
});

const CLAMP = (value, min, max) => Math.min(Math.max(value, min), max);

export const normalizeNavStyle = (raw = {}) => {
  const base = { ...NAV_STYLE_DEFAULT };
  const src = typeof raw === "object" && raw !== null ? raw : {};

  const variant = String(src.variant || base.variant || "").trim().toLowerCase();
  base.variant = ["pill", "underline", "overline", "ghost", "link", "text", "button"].includes(variant)
    ? variant
    : base.variant;

  const transform = String(src.text_transform || base.text_transform || "").trim().toLowerCase();
  base.text_transform = ["none", "uppercase", "capitalize", "lowercase"].includes(transform)
    ? transform
    : base.text_transform;

  const strings = ["bg", "bg_hover", "text", "text_hover", "active_bg", "active_text", "shadow", "divider", "brand_font_family"];
  for (const key of strings) {
    const val = src[key];
    if (typeof val === "string") {
      const trimmed = val.trim();
      base[key] = trimmed ? trimmed : base[key];
    } else if (val === null) {
      base[key] = null;
    }
  }

  const numeric = (key, def, min, max) => {
    const val = src[key];
    if (val === undefined || val === null || val === "") return def;
    const num = Number(val);
    if (Number.isNaN(num)) return def;
    return Math.round(CLAMP(num, min, max));
  };

  base.font_weight = numeric("font_weight", base.font_weight, 100, 900);
  base.item_spacing = numeric("item_spacing", base.item_spacing, 0, 160);
  base.padding_x = numeric("padding_x", base.padding_x, 0, 200);
  base.padding_y = numeric("padding_y", base.padding_y, 0, 200);
  base.border_radius = numeric("border_radius", base.border_radius, 0, 9999);
  base.brand_font_size = numeric("brand_font_size", base.brand_font_size, 10, 64);

  return base;
};

export const navStyleToCssVars = (style) => {
  const normalized = normalizeNavStyle(style);
  return {
    "--nav-btn-variant": normalized.variant,
    "--nav-btn-font-weight": normalized.font_weight,
    "--nav-btn-text-transform": normalized.text_transform,
    "--nav-btn-item-spacing": `${normalized.item_spacing}px`,
    "--nav-btn-padding-x": `${normalized.padding_x}px`,
    "--nav-btn-padding-y": `${normalized.padding_y}px`,
    "--nav-btn-border-radius": `${normalized.border_radius}px`,
    "--nav-btn-bg": normalized.bg,
    "--nav-btn-bg-hover": normalized.bg_hover,
    "--nav-btn-text": normalized.text,
    "--nav-btn-text-hover": normalized.text_hover,
    "--nav-btn-active-bg": normalized.active_bg,
    "--nav-btn-active-text": normalized.active_text,
    "--nav-btn-shadow": normalized.shadow,
    "--nav-btn-divider": normalized.divider,
    "--nav-brand-font-family": normalized.brand_font_family || "inherit",
    "--nav-brand-font-size": `${normalized.brand_font_size || 20}px`,
  };
};

export const compressNavStyle = (style) => {
  const normalized = normalizeNavStyle(style);
  const compact = {};
  Object.entries(normalized).forEach(([key, value]) => {
    if (value === NAV_STYLE_DEFAULT[key] || value === null) return;
    compact[key] = value;
  });
  return compact;
};

export const createNavButtonStyles = (style) => {
  const tokens = normalizeNavStyle(style);
  const variant = tokens.variant;
  const colors = {
    bg: tokens.bg || "transparent",
    bgHover: tokens.bg_hover || tokens.bg || "transparent",
    text: tokens.text || "inherit",
    textHover: tokens.text_hover || tokens.text || "inherit",
    activeBg: tokens.active_bg || tokens.bg || "transparent",
    activeText: tokens.active_text || tokens.text || "inherit",
  };

  return (active) => {
    const base = {
      fontWeight: tokens.font_weight,
      textTransform:
        tokens.text_transform === "none" ? "none" : tokens.text_transform,
      paddingX: `${tokens.padding_x}px`,
      paddingY: `${tokens.padding_y}px`,
      borderRadius: `${tokens.border_radius}px`,
      transition: "all 0.2s ease",
      minHeight: 0,
      lineHeight: 1.2,
      boxShadow: "none",
      border: "1px solid transparent",
    };

    if (variant === "pill" || variant === "button") {
      base.backgroundColor = active ? colors.activeBg : colors.bg;
      base.color = active ? colors.activeText : colors.text;
      base.boxShadow = tokens.shadow || "none";
      base.border =
        variant === "button"
          ? `1px solid ${
              colors.bg === "transparent"
                ? "rgba(148,163,184,0.45)"
                : colors.bg
            }`
          : "1px solid transparent";
    } else if (variant === "ghost") {
      base.backgroundColor = active ? colors.activeBg : "transparent";
      base.color = active ? colors.activeText : colors.text;
      base.border = `1px solid ${
        colors.bg || colors.text || "rgba(148,163,184,0.45)"
      }`;
      base.boxShadow = "none";
    } else if (variant === "underline" || variant === "overline") {
      base.backgroundColor = "transparent";
      base.color = active ? colors.activeText : colors.text;
      base.borderRadius = 0;
      base.boxShadow = "none";
      const lineColor = colors.activeBg || colors.bg || "currentColor";
      const lineProp = variant === "overline" ? "borderTop" : "borderBottom";
      base[lineProp] = active ? `3px solid ${lineColor}` : "3px solid transparent";
      if (variant === "overline") {
        base.paddingTop = `${tokens.padding_y + 2}px`;
      } else {
        base.paddingBottom = `${tokens.padding_y + 2}px`;
      }
    } else {
      base.backgroundColor = "transparent";
      base.color = active ? colors.activeText : colors.text;
    }

    base["&:hover"] =
      variant === "underline" || variant === "overline"
        ? {
            color: colors.textHover,
            ...(variant === "overline"
              ? {
                  borderTop: `3px solid ${colors.bgHover || colors.bg || "currentColor"}`,
                }
              : {
                  borderBottom: `3px solid ${colors.bgHover || colors.bg || "currentColor"}`,
                }),
          }
        : {
            backgroundColor: colors.bgHover,
            color: colors.textHover,
          };

    base["&:focus-visible"] = {
      outline: `2px solid ${
        colors.activeBg || colors.bg || colors.text || "currentColor"
      }`,
      outlineOffset: 2,
    };

    return base;
  };
};
