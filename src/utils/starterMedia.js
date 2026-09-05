const STARTER_MEDIA_SCHEME = "starter-media://";

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const starterMediaRef = (themeKey, role) =>
  `${STARTER_MEDIA_SCHEME}${normalizeKey(themeKey)}/${normalizeKey(role)}`;

export function normalizeStarterMediaReferences(value, themeKey) {
  const normalizedTheme = normalizeKey(themeKey);
  const legacyPrefix = `${normalizedTheme}-starter://`;
  if (typeof value === "string") {
    return value.startsWith(legacyPrefix)
      ? starterMediaRef(normalizedTheme, value.slice(legacyPrefix.length))
      : value;
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const normalized = normalizeStarterMediaReferences(item, normalizedTheme);
      changed = changed || normalized !== item;
      return normalized;
    });
    return changed ? next : value;
  }
  if (value && typeof value === "object") {
    let changed = false;
    const next = Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        (() => {
          const normalized = normalizeStarterMediaReferences(item, normalizedTheme);
          changed = changed || normalized !== item;
          return normalized;
        })(),
      ])
    );
    return changed ? next : value;
  }
  return value;
}
