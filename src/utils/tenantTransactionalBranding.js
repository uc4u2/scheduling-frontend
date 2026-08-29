import { buildPublishedWebsiteUrl, normalizeWebsitePath } from "./publicWebsite";

const DARK_THEME_KEYS = new Set(["eldora-dark", "iron-ember", "harbor-line"]);

const MODE_FALLBACK_TOKENS = {
  light: {
    background: "#f7f7f8",
    surface: "#ffffff",
    surfaceAlt: "#f0f2f5",
    text: "#1f2937",
    textMuted: "#6b7280",
    border: "rgba(31,41,55,0.12)",
    buttonText: "#ffffff",
  },
  dark: {
    background: "#0f1117",
    surface: "#171b25",
    surfaceAlt: "#212736",
    text: "#f6f0e8",
    textMuted: "#c7bea9",
    border: "rgba(246,240,232,0.12)",
    buttonText: "#0f1117",
  },
};

const DEFAULT_THEME_TOKENS = {
  "modern-gradient": {
    background: "#f5f7ff",
    surface: "#ffffff",
    surfaceAlt: "#eef2ff",
    text: "#12192f",
    textMuted: "#5b6478",
    border: "rgba(18,25,47,0.12)",
    primary: "#4554ff",
    accent: "#ffd446",
    buttonText: "#ffffff",
    radius: 18,
  },
  "eldora-dark": {
    background: "#0f1117",
    surface: "#171b25",
    surfaceAlt: "#212736",
    text: "#f6f0e8",
    textMuted: "#c7bea9",
    border: "rgba(246,240,232,0.12)",
    primary: "#d4a95f",
    accent: "#f3d9a4",
    buttonText: "#0f1117",
    radius: 18,
  },
  "motion-editorial": {
    background: "#f4f1ea",
    surface: "#fffdf8",
    surfaceAlt: "#ebe5d8",
    text: "#171717",
    textMuted: "#5d564e",
    border: "rgba(23,23,23,0.14)",
    primary: "#171717",
    accent: "#a66a2c",
    buttonText: "#fffdf8",
    radius: 8,
  },
  finwise: {
    background: "#f4f7fb",
    surface: "#ffffff",
    surfaceAlt: "#edf2f7",
    text: "#10233a",
    textMuted: "#5a6b80",
    border: "rgba(16,35,58,0.12)",
    primary: "#1b4ddb",
    accent: "#13b1a8",
    buttonText: "#ffffff",
    radius: 12,
  },
  "iron-ember": {
    background: "#120d0b",
    surface: "#1a1411",
    surfaceAlt: "#241b17",
    text: "#f5ead8",
    textMuted: "#c8b7a1",
    border: "rgba(215,171,126,0.16)",
    primary: "#b77947",
    accent: "#d39a68",
    buttonText: "#120d0b",
    radius: 8,
  },
  "clear-clinic": {
    background: "#eef7fb",
    surface: "#ffffff",
    surfaceAlt: "#f5fbff",
    text: "#163049",
    textMuted: "#5d748c",
    border: "rgba(22,48,73,0.10)",
    primary: "#1b5f93",
    accent: "#74b8de",
    buttonText: "#ffffff",
    radius: 18,
  },
  "harbor-line": {
    background: "#0c1014",
    surface: "#121820",
    surfaceAlt: "#1b222b",
    text: "#f6f1ea",
    textMuted: "#c8bfb3",
    border: "rgba(246,241,234,0.12)",
    primary: "#b99a6b",
    accent: "#e7d2ae",
    buttonText: "#0c1014",
    radius: 10,
  },
  classic: {
    background: "#f7f7f8",
    surface: "#ffffff",
    surfaceAlt: "#f0f2f5",
    text: "#1f2937",
    textMuted: "#6b7280",
    border: "rgba(31,41,55,0.12)",
    primary: "#2563eb",
    accent: "#0ea5e9",
    buttonText: "#ffffff",
    radius: 12,
  },
};

const cleanText = (value) => {
  const raw = String(value || "").trim();
  return raw || "";
};

const cleanUrl = (value) => {
  const raw = cleanText(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  return "";
};

const clampRadius = (value, fallback) => {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  // The shared Page Style contract stores the Builder's 0–4 radius scale.
  // Keep accepting older direct pixel values so legacy-only settings remain stable.
  const pixels = next >= 0 && next <= 4 ? next * 8 : next;
  return Math.max(0, Math.min(28, pixels));
};

const hexLuminance = (value) => {
  const match = cleanText(value).match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  const channels = match[1].match(/.{2}/g).map((channel) => parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const resolveColorMode = (themeKey, themeOverrides) => {
  const preference = cleanText(themeOverrides?.lightDarkPreference).toLowerCase();
  if (preference === "light" || preference === "dark") return preference;
  const luminance = hexLuminance(themeOverrides?.pageBackground);
  if (luminance !== null) return luminance < 0.36 ? "dark" : "light";
  if (DARK_THEME_KEYS.has(themeKey)) return "dark";
  return "light";
};

const normalizeRelativePath = (value = "") => {
  const raw = cleanText(value);
  if (!raw) return "";
  if (!raw.startsWith("/")) return "";
  try {
    const parsed = new URL(raw, "https://schedulaa.local");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "";
  }
};

const pick = (...values) => {
  for (const value of values) {
    const next = cleanText(value);
    if (next) return next;
  }
  return "";
};

export function resolveTransactionalThemeTokens(themeKey, themeOverrides = {}) {
  const normalizedThemeKey = cleanText(themeKey).toLowerCase() || "classic";
  const themeDefaults =
    DEFAULT_THEME_TOKENS[normalizedThemeKey] || DEFAULT_THEME_TOKENS.classic;
  const palette = themeOverrides?.palette || {};
  const palettePrimary = palette?.primary?.main || palette?.primary;
  const paletteAccent = palette?.accent?.main || palette?.accent;
  const surfaceTone = cleanText(themeOverrides?.surfaceTone).toLowerCase();
  const pageBackground = cleanText(themeOverrides?.pageBackground);
  const buttonTreatment = cleanText(themeOverrides?.buttonTreatment).toLowerCase();
  const mode = resolveColorMode(normalizedThemeKey, themeOverrides);
  const themeDefaultMode = DARK_THEME_KEYS.has(normalizedThemeKey) ? "dark" : "light";
  const modeDefaults = mode === themeDefaultMode ? themeDefaults : MODE_FALLBACK_TOKENS[mode];

  const tokens = {
    ...themeDefaults,
    ...modeDefaults,
    mode,
    primary: pick(themeOverrides?.brandPrimaryColor, palettePrimary) || themeDefaults.primary,
    accent: pick(themeOverrides?.accentColor, paletteAccent) || themeDefaults.accent,
    background: pageBackground || modeDefaults.background,
    surface:
      pick(themeOverrides?.surfaceColor, themeOverrides?.cardColor) || modeDefaults.surface,
    surfaceAlt:
      pick(themeOverrides?.surfaceColor, themeOverrides?.cardColor) || modeDefaults.surfaceAlt,
    card:
      pick(themeOverrides?.cardColor, themeOverrides?.surfaceColor) || modeDefaults.surface,
    text: pick(themeOverrides?.foregroundColor) || modeDefaults.text,
    textMuted: pick(themeOverrides?.mutedForegroundColor) || modeDefaults.textMuted,
    border: pick(themeOverrides?.borderColor) || modeDefaults.border,
    buttonText: pick(themeOverrides?.buttonForegroundColor) || modeDefaults.buttonText,
    radius: clampRadius(themeOverrides?.buttonRadius, themeDefaults.radius),
    buttonTreatment: ["solid", "outline", "soft", "minimal"].includes(buttonTreatment)
      ? buttonTreatment
      : "solid",
  };

  if (surfaceTone === "soft" && !pick(themeOverrides?.surfaceColor, themeOverrides?.cardColor)) {
    tokens.surface = themeDefaults.surfaceAlt;
  } else if (surfaceTone === "contrast" && !pick(themeOverrides?.surfaceColor, themeOverrides?.cardColor)) {
    tokens.surfaceAlt = themeDefaults.surface;
  }


  tokens.buttonBackground = tokens.primary;
  tokens.buttonHover = tokens.accent;
  tokens.buttonBorder = tokens.primary;
  if (tokens.buttonTreatment === "outline" || tokens.buttonTreatment === "minimal") {
    tokens.buttonBackground = "transparent";
    tokens.buttonHover = tokens.surfaceAlt;
    tokens.buttonText = tokens.primary;
  } else if (tokens.buttonTreatment === "soft") {
    tokens.buttonBackground = tokens.surfaceAlt;
    tokens.buttonHover = tokens.surface;
    tokens.buttonText = tokens.primary;
  }
  if (tokens.buttonTreatment === "minimal") tokens.buttonBorder = "transparent";

  return tokens;
}

export function buildTenantTransactionalBrandingContract(
  shellPayload,
  { pagePath = "", currentOrigin = "", search = "" } = {}
) {
  if (!shellPayload || typeof shellPayload !== "object") return null;

  const slug = cleanText(shellPayload.slug);
  const rendererEngine = cleanText(shellPayload.renderer_engine).toLowerCase() || "legacy-react";
  const visualThemeKey = cleanText(shellPayload.visual_theme_key).toLowerCase() || null;
  const company = shellPayload.company || {};
  const header = shellPayload.header || {};
  const footer = shellPayload.footer || {};
  const websiteSetting = shellPayload.website_setting || {};
  const customDomain = cleanText(
    websiteSetting?.custom_domain ||
      shellPayload?.public_host_resolution?.matched_host
  ).replace(/^https?:\/\//i, "");

  const statusLike = {
    company_slug: slug,
    is_live: true,
    custom_domain: customDomain || null,
    published_renderer_engine: rendererEngine,
    current_renderer_engine: rendererEngine,
    published_visual_theme_key: visualThemeKey,
    current_visual_theme_key: visualThemeKey,
    published_visual_theme_version: shellPayload.visual_theme_version || null,
    current_visual_theme_version: shellPayload.visual_theme_version || null,
  };

  const normalizedPagePath = normalizeWebsitePath(pagePath);
  const publicSiteUrl =
    buildPublishedWebsiteUrl({
      status: statusLike,
      pagePath: normalizedPagePath,
      currentOrigin,
      search,
    }) || (slug ? `/${slug}${normalizedPagePath ? `/${normalizedPagePath}` : ""}` : "/");

  const tokens = resolveTransactionalThemeTokens(
    visualThemeKey || "classic",
    shellPayload.theme_overrides || {}
  );

  return {
    rendererEngine,
    isNextJsTenant: rendererEngine === "nextjs" && Boolean(visualThemeKey),
    visualThemeKey,
    tenantSlug: slug,
    companyName: pick(shellPayload.title, shellPayload.company_name, company.name) || slug,
    logoUrl: cleanUrl(header.logo_url || company.logo_url),
    contactEmail: pick(company.contact_email, header.contact_email, footer.contact_email),
    contactPhone: pick(company.phone, header.contact_phone, footer.contact_phone),
    supportHref: cleanUrl(header.primary_cta_link || footer.contact_link),
    customDomain: customDomain || null,
    publicSiteUrl,
    rootSiteUrl:
      buildPublishedWebsiteUrl({
        status: statusLike,
        pagePath: "",
        currentOrigin,
      }) || publicSiteUrl,
    tokens,
  };
}

export function resolveTransactionalReturnTo({
  brandingContract,
  returnTo = "",
  fallbackPagePath = "",
} = {}) {
  if (!brandingContract) return "/";

  const safeReturnTo = normalizeRelativePath(returnTo);
  if (safeReturnTo) {
    try {
      const candidate = new URL(safeReturnTo, brandingContract.rootSiteUrl);
      return candidate.toString();
    } catch {
      // fall through to fallback
    }
  }

  if (fallbackPagePath) {
    const fallback = normalizeWebsitePath(fallbackPagePath);
    if (fallback) {
      try {
        const base = String(brandingContract.rootSiteUrl || "").replace(/\/?$/, "/");
        return new URL(fallback, base).toString();
      } catch {
        // ignore
      }
    }
  }

  return brandingContract.rootSiteUrl || "/";
}
