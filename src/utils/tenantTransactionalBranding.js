import { buildPublishedWebsiteUrl, normalizeWebsitePath } from "./publicWebsite";

const LIGHT_THEME_KEYS = new Set(["modern-gradient", "finwise", "clear-clinic"]);
const DARK_THEME_KEYS = new Set(["eldora-dark", "iron-ember", "harbor-line"]);

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
  return Math.max(0, Math.min(28, next));
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
  const pageBackground = cleanUrl(themeOverrides?.pageBackground) || cleanText(themeOverrides?.pageBackground);
  const lightDarkPreference = cleanText(themeOverrides?.lightDarkPreference).toLowerCase();
  const buttonTreatment = cleanText(themeOverrides?.buttonTreatment).toLowerCase();
  const backgroundMode =
    lightDarkPreference ||
    (DARK_THEME_KEYS.has(normalizedThemeKey) ? "dark" : LIGHT_THEME_KEYS.has(normalizedThemeKey) ? "light" : "");

  const tokens = {
    ...themeDefaults,
    primary: pick(themeOverrides?.brandPrimaryColor, palettePrimary) || themeDefaults.primary,
    accent: pick(themeOverrides?.accentColor, paletteAccent) || themeDefaults.accent,
    radius: clampRadius(themeOverrides?.buttonRadius, themeDefaults.radius),
  };

  if (backgroundMode === "dark") {
    tokens.background = themeDefaults.background;
    tokens.surface = themeDefaults.surface;
    tokens.surfaceAlt = themeDefaults.surfaceAlt;
    tokens.text = themeDefaults.text;
    tokens.textMuted = themeDefaults.textMuted;
    tokens.border = themeDefaults.border;
  }

  if (backgroundMode === "light") {
    tokens.background = themeDefaults.background;
    tokens.surface = themeDefaults.surface;
    tokens.surfaceAlt = themeDefaults.surfaceAlt;
    tokens.text = themeDefaults.text;
    tokens.textMuted = themeDefaults.textMuted;
    tokens.border = themeDefaults.border;
  }

  if (surfaceTone === "soft") {
    tokens.surface = themeDefaults.surfaceAlt;
  } else if (surfaceTone === "contrast") {
    tokens.surfaceAlt = themeDefaults.surface;
  }

  if (cleanText(pageBackground) && !/^https?:\/\//i.test(pageBackground)) {
    tokens.background = pageBackground;
  }

  if (buttonTreatment === "outline") {
    tokens.buttonText = tokens.primary;
  }

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
