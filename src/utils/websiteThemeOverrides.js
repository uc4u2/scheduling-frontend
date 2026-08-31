export const NEXTJS_THEME_OVERRIDE_FIELDS = {
  brandPrimaryColor: {
    label: "Brand primary color",
    category: "color",
  },
  accentColor: {
    label: "Accent color",
    category: "color",
  },
  surfaceTone: {
    label: "Surface tone",
    category: "select",
    options: ["light", "dark", "auto"],
  },
  pageBackground: {
    label: "Page background",
    category: "color",
  },
  surfaceColor: {
    label: "Surface color",
    category: "color",
  },
  foregroundColor: {
    label: "Primary text color",
    category: "color",
  },
  mutedForegroundColor: {
    label: "Muted text color",
    category: "color",
  },
  cardColor: {
    label: "Card surface color",
    category: "color",
  },
  borderColor: {
    label: "Border color",
    category: "color",
  },
  buttonForegroundColor: {
    label: "Button text color",
    category: "color",
  },
  sectionSpacing: {
    label: "Section spacing",
    category: "range",
    min: 0,
    max: 5,
  },
  buttonRadius: {
    label: "Button radius",
    category: "range",
    min: 0,
    max: 4,
  },
  buttonTreatment: {
    label: "Button treatment",
    category: "select",
    options: ["soft", "outline", "solid", "minimal"],
  },
  typographyScale: {
    label: "Typography scale",
    category: "range",
    min: 0.9,
    max: 1.2,
    step: 0.05,
  },
  heroMediaUrl: {
    label: "Hero media",
    category: "media",
  },
  lightDarkPreference: {
    label: "Light / dark preference",
    category: "select",
    options: ["light", "dark", "auto"],
  },
  gradientAccent: {
    label: "Gradient accent",
    category: "toggle",
  },
};

const SHARED_FIELD_DEFAULTS = {
  sectionSpacing: 3,
  buttonRadius: 2,
  buttonTreatment: "solid",
  typographyScale: 1,
  surfaceTone: "auto",
  lightDarkPreference: "auto",
  gradientAccent: false,
};

export const NEXTJS_PAGE_STYLE_BASE_FIELDS = [
  "brandPrimaryColor",
  "accentColor",
  "pageBackground",
  "surfaceColor",
  "foregroundColor",
  "mutedForegroundColor",
  "cardColor",
  "borderColor",
  "buttonForegroundColor",
  "lightDarkPreference",
  "buttonTreatment",
  "buttonRadius",
  "sectionSpacing",
  "heroMediaUrl",
];

export const NEXTJS_PAGE_STYLE_PRESET_KEYS = [
  "modern-noir",
  "blush-spa",
  "forest-calm",
  "champagne-luxe",
  "ocean-clean",
];

// This capability map is the Builder's single registry for Next Page Style.
// Visible UI derives both theme recognition and special-field gating from it;
// legacy JSON templates never enter this catalog.
const NEXTJS_PAGE_STYLE_THEME_CAPABILITIES = {
  "modern-gradient": { lightDarkPreference: "light", specialFields: ["gradientAccent"], gradientAccent: true },
  "eldora-dark": { lightDarkPreference: "dark" },
  "motion-editorial": { lightDarkPreference: "dark", specialFields: ["typographyScale"], typographyScale: 1.05 },
  finwise: { lightDarkPreference: "light", buttonTreatment: "soft" },
  "iron-ember": { lightDarkPreference: "dark" },
  "clear-clinic": { lightDarkPreference: "light" },
  "harbor-line": { lightDarkPreference: "dark", specialFields: ["typographyScale"], typographyScale: 1.05 },
  "still-bloom": { lightDarkPreference: "light", specialFields: ["typographyScale"], typographyScale: 1.05 },
  "black-letter": { lightDarkPreference: "dark" },
  "circuit-north": { lightDarkPreference: "dark", specialFields: ["typographyScale"], typographyScale: 1.05 },
  "solara-stay": { lightDarkPreference: "light", specialFields: ["typographyScale"], typographyScale: 1.05 },
  "paw-and-pine": { lightDarkPreference: "light" },
  "quiet-harbor": { lightDarkPreference: "light", specialFields: ["typographyScale"], typographyScale: 1.05 },
  "frame-and-field": { lightDarkPreference: "light", specialFields: ["typographyScale"], typographyScale: 1.05 },
  fieldcraft: { lightDarkPreference: "light" },
  "lumea-clinic": { lightDarkPreference: "light", specialFields: ["typographyScale"], typographyScale: 1.05 },
  "northstar-health": { lightDarkPreference: "light", specialFields: ["typographyScale"], typographyScale: 1.05 },
  "axis-and-co": { lightDarkPreference: "light", specialFields: ["typographyScale"], typographyScale: 1.05 },
  "torque-house": { lightDarkPreference: "dark" },
};

export const NEXTJS_THEME_OVERRIDE_CONTRACT = Object.fromEntries(
  Object.entries(NEXTJS_PAGE_STYLE_THEME_CAPABILITIES).map(([themeKey, capability]) => {
    const { specialFields = [], ...defaultOverrides } = capability;
    return [themeKey, {
      acceptedFields: [...NEXTJS_PAGE_STYLE_BASE_FIELDS, ...specialFields],
      defaults: {
        ...SHARED_FIELD_DEFAULTS,
        ...defaultOverrides,
      },
    }];
  })
);

function clampNumber(value, min, max, fallback) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function normalizeHex(value, fallback = "") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (!raw.startsWith("#")) return raw;
  let body = raw.slice(1);
  if (body.length === 3) {
    body = body
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (!/^[a-f0-9]{6}$/i.test(body)) return fallback;
  return `#${body.toLowerCase()}`;
}

function isDarkHex(value) {
  const normalized = normalizeHex(value, "");
  if (!/^#[a-f0-9]{6}$/i.test(normalized)) return false;
  const numeric = Number.parseInt(normalized.slice(1), 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;
  return red * 0.299 + green * 0.587 + blue * 0.114 < 150;
}

export function getThemeOverrideContract(themeKey) {
  return NEXTJS_THEME_OVERRIDE_CONTRACT[String(themeKey || "").trim().toLowerCase()] || null;
}

export function resolveNextJsPageStyleCapabilities({
  rendererEngine,
  visualThemeKey,
} = {}) {
  if (String(rendererEngine || "").trim().toLowerCase() !== "nextjs") return null;
  const themeKey = String(visualThemeKey || "").trim().toLowerCase();
  const contract = getThemeOverrideContract(themeKey);
  if (!contract) return null;
  return {
    themeKey,
    supportedFields: [...contract.acceptedFields],
    presetKeys: [...NEXTJS_PAGE_STYLE_PRESET_KEYS],
  };
}

export function getSupportedThemeOverrideFields(themeKey) {
  return getThemeOverrideContract(themeKey)?.acceptedFields || [];
}

export function isThemeOverrideFieldSupported(themeKey, fieldKey) {
  return getSupportedThemeOverrideFields(themeKey).includes(fieldKey);
}

export function sanitizeThemeOverrideValue(fieldKey, value, fallback = undefined) {
  switch (fieldKey) {
    case "brandPrimaryColor":
    case "accentColor":
    case "pageBackground":
    case "surfaceColor":
    case "foregroundColor":
    case "mutedForegroundColor":
    case "cardColor":
    case "borderColor":
    case "buttonForegroundColor":
      return normalizeHex(value, fallback || "");
    case "heroMediaUrl":
      return String(value || "").trim();
    case "surfaceTone":
    case "buttonTreatment":
    case "lightDarkPreference": {
      const options = NEXTJS_THEME_OVERRIDE_FIELDS[fieldKey]?.options || [];
      return options.includes(value) ? value : fallback;
    }
    case "sectionSpacing":
      return clampNumber(value, 0, 5, fallback ?? 3);
    case "buttonRadius":
      return clampNumber(value, 0, 4, fallback ?? 2);
    case "typographyScale":
      return clampNumber(value, 0.9, 1.2, fallback ?? 1);
    case "gradientAccent":
      return Boolean(value);
    default:
      return value ?? fallback;
  }
}

export function sanitizeThemeOverrideDraft(themeKey, draft = {}) {
  const contract = getThemeOverrideContract(themeKey);
  if (!contract) return {};
  const next = {};
  contract.acceptedFields.forEach((fieldKey) => {
    const fallback = contract.defaults?.[fieldKey];
    next[fieldKey] = sanitizeThemeOverrideValue(fieldKey, draft?.[fieldKey], fallback);
  });
  const themePresetKey = String(draft?.themePresetKey || "").trim().toLowerCase();
  if (NEXTJS_PAGE_STYLE_PRESET_KEYS.includes(themePresetKey)) {
    next.themePresetKey = themePresetKey;
  }
  return next;
}

export function buildNextJsPageStyleFromDraft(themeKey, draft = {}) {
  const next = sanitizeThemeOverrideDraft(themeKey, draft);
  return {
    themeOverrides: next,
  };
}

/**
 * Translate the existing Builder preset payload into the canonical Next
 * theme-override contract.  The preset library predates Next and stores
 * visual values under pageStyle/header/footer keys; keeping that translation
 * here prevents themes from depending on legacy-only payload names.
 */
export function buildThemeOverridesFromPreset(
  preset = {},
  currentThemeOverrides = {},
  defaultThemeOverrides = {}
) {
  const base = {
    ...(defaultThemeOverrides || {}),
    ...(currentThemeOverrides || {}),
  };
  const pageStyle = preset?.pageStyle || {};
  const header = preset?.header || {};
  const pageBackground = pageStyle.backgroundColor || base.pageBackground || "";
  const foregroundColor = pageStyle.headingColor || header.text_color || base.foregroundColor || "";
  const accentColor = pageStyle.linkColor || preset?.accent || pageStyle.btnBg || base.accentColor || "";
  const brandPrimaryColor = pageStyle.btnBg || preset?.accent || accentColor || base.brandPrimaryColor || "";
  const buttonRadiusPx = Number(pageStyle.btnRadius);

  return {
    ...base,
    ...(NEXTJS_PAGE_STYLE_PRESET_KEYS.includes(String(preset?.key || "").trim().toLowerCase())
      ? { themePresetKey: String(preset.key).trim().toLowerCase() }
      : {}),
    brandPrimaryColor,
    accentColor,
    pageBackground,
    surfaceColor: pageStyle.overlayColor || header.bg || pageBackground || base.surfaceColor || "",
    foregroundColor,
    mutedForegroundColor: pageStyle.headingColor || header.text_color || base.mutedForegroundColor || foregroundColor,
    cardColor: pageStyle.cardColor || header.bg || base.cardColor || "",
    borderColor: header.text_color || foregroundColor || base.borderColor || "",
    buttonForegroundColor: pageStyle.btnColor || base.buttonForegroundColor || "",
    surfaceTone: isDarkHex(pageBackground) ? "dark" : "light",
    lightDarkPreference: isDarkHex(pageBackground) ? "dark" : "light",
    buttonRadius: Number.isFinite(buttonRadiusPx)
      ? Math.max(0, Math.min(4, Math.round(buttonRadiusPx / 4)))
      : base.buttonRadius,
    buttonTreatment: "solid",
  };
}
