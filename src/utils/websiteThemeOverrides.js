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

export const NEXTJS_THEME_OVERRIDE_CONTRACT = {
  "modern-gradient": {
    acceptedFields: [
      "brandPrimaryColor",
      "accentColor",
      "pageBackground",
      "sectionSpacing",
      "buttonRadius",
      "lightDarkPreference",
      "heroMediaUrl",
      "gradientAccent",
    ],
    defaults: {
      ...SHARED_FIELD_DEFAULTS,
      lightDarkPreference: "light",
      gradientAccent: true,
    },
  },
  "eldora-dark": {
    acceptedFields: [
      "accentColor",
      "sectionSpacing",
      "buttonRadius",
      "heroMediaUrl",
      "lightDarkPreference",
    ],
    defaults: {
      ...SHARED_FIELD_DEFAULTS,
      lightDarkPreference: "dark",
    },
  },
  "motion-editorial": {
    acceptedFields: [
      "accentColor",
      "typographyScale",
      "heroMediaUrl",
      "sectionSpacing",
      "lightDarkPreference",
    ],
    defaults: {
      ...SHARED_FIELD_DEFAULTS,
      typographyScale: 1.05,
      lightDarkPreference: "dark",
    },
  },
  finwise: {
    acceptedFields: [
      "brandPrimaryColor",
      "accentColor",
      "pageBackground",
      "sectionSpacing",
      "buttonRadius",
      "buttonTreatment",
      "lightDarkPreference",
      "heroMediaUrl",
    ],
    defaults: {
      ...SHARED_FIELD_DEFAULTS,
      lightDarkPreference: "light",
      buttonTreatment: "soft",
    },
  },
};

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

export function getThemeOverrideContract(themeKey) {
  return NEXTJS_THEME_OVERRIDE_CONTRACT[String(themeKey || "").trim().toLowerCase()] || null;
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
  return next;
}

export function buildNextJsPageStyleFromDraft(themeKey, draft = {}) {
  const next = sanitizeThemeOverrideDraft(themeKey, draft);
  return {
    themeOverrides: next,
  };
}
