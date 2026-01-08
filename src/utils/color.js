const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

let canvasCtx = null;
if (typeof document !== "undefined") {
  try {
    const canvas = document.createElement("canvas");
    canvasCtx = canvas?.getContext("2d") || null;
  } catch {
    canvasCtx = null;
  }
}

const toHex = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (HEX_COLOR_REGEX.test(trimmed)) return trimmed.toLowerCase();
  if (!canvasCtx) return null;
  try {
    canvasCtx.fillStyle = trimmed;
    const normalized = canvasCtx.fillStyle;
    if (HEX_COLOR_REGEX.test(normalized)) {
      return normalized.toLowerCase();
    }
  } catch {
    /* ignore invalid css values */
  }
  return null;
};

export const colorToPickerValue = (value, fallback = "#000000") => {
  const hex = toHex(value);
  return hex || fallback;
};

export const isColorValue = (value) => Boolean(toHex(value));

const hexToRgb = (hex) => {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
};

const parseRgb = (value) => {
  const match = String(value || "").trim().match(/^rgba?\((.+)\)$/i);
  if (!match) return null;
  const parts = match[1]
    .split(",")
    .map((v) => v.trim())
    .map((v) => (v.endsWith("%") ? (parseFloat(v) * 2.55) : parseFloat(v)));
  if (parts.length < 3 || parts.some((v) => Number.isNaN(v))) return null;
  return { r: parts[0], g: parts[1], b: parts[2] };
};

export const parseColorToRgb = (value) => {
  const hex = toHex(value);
  if (hex) return hexToRgb(hex);
  return parseRgb(value);
};

export const getLuminance = (value) => {
  const rgb = parseColorToRgb(value);
  if (!rgb) return null;
  const { r, g, b } = rgb;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

export const pickTextColorForBg = (bg, { light = "#ffffff", dark = "#0f172a" } = {}) => {
  const lum = getLuminance(bg);
  if (lum == null) return dark;
  return lum > 0.6 ? dark : light;
};
