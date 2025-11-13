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
