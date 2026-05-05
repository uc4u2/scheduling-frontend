const DEFAULT_MIN_RADIUS = 2;
const DEFAULT_MAX_RADIUS = 4;
const DEFAULT_FALLBACK_RADIUS = 4;

export function clampWebsiteRadius(
  value,
  {
    min = DEFAULT_MIN_RADIUS,
    max = DEFAULT_MAX_RADIUS,
    fallback = DEFAULT_FALLBACK_RADIUS,
  } = {}
) {
  const num = Number(value);
  const safeFallback = Number.isFinite(Number(fallback))
    ? Number(fallback)
    : DEFAULT_FALLBACK_RADIUS;
  if (!Number.isFinite(num)) return safeFallback;
  return Math.min(Math.max(num, min), max);
}

export function toWebsiteRadiusPx(value, options) {
  return `${clampWebsiteRadius(value, options)}px`;
}

