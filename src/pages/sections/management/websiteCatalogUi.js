import { normalizeLoopbackBaseUrl } from "../../../utils/publicWebsite";

const configuredNextBaseUrl = process.env.REACT_APP_TENANT_WEB_NEXT_URL || "";

export const TENANT_WEB_NEXT_BASE_URL = normalizeLoopbackBaseUrl(configuredNextBaseUrl);
export const NEXTJS_THEME_PREVIEW_CONFIG_ERROR =
  "Next.js website preview service is not configured.";

export function hasConfiguredNextJsThemeBaseUrl() {
  return Boolean(TENANT_WEB_NEXT_BASE_URL);
}

function absolutizeThemePreview(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(String(path))) return String(path);
  if (String(path).startsWith("/")) {
    return String(path);
  }
  return `/${String(path).replace(/^\/+/, "")}`;
}

// Signed preview tokens currently begin with a dot. Next normalizes that raw
// path segment away (`/preview/.token/services` becomes `/preview/services`).
// A stable route prefix keeps the dynamic segment non-dot-prefixed; the Next
// preview route removes it before using the signed token with the backend.
export function encodePreviewPathToken(token) {
  return `t-${encodeURIComponent(String(token || ""))}`;
}

export function buildWebsiteStyleChoices({
  catalog = null,
  status = null,
} = {}) {
  const currentContentPackKey = status?.current_content_pack_key || null;
  const compatibleThemes = Array.isArray(catalog?.compatible_visual_themes)
    ? catalog.compatible_visual_themes
    : [];

  const styles = [
    {
      key: "classic",
      version: 1,
      renderer_engine: "legacy-react",
      name: "Keep Current Classic Design",
      description: "Stay on the current React/MUI public website renderer and legacy template path.",
      selectable: true,
      currentContentPackKey,
    },
  ];

  compatibleThemes.forEach((theme) => {
    const key = String(theme?.key || "").trim();
    if (!key || key === "classic") return;
    if (theme?.renderer_engine !== "nextjs") return;
    if (theme?.approved_product_theme === false) return;
    if (theme?.status === "deprecated" || theme?.status === "hidden") return;
    if (theme?.hidden) return;
    styles.push({
      key,
      version: Number(theme.version || 1),
      renderer_engine: "nextjs",
      name: theme.label || key,
      description:
        theme.description ||
        `${theme.label || key} rendered through the standalone Next.js public renderer.`,
      selectable: true,
      beta: theme.status === "beta",
      badgeLabel:
        theme.status === "beta"
          ? "Beta"
          : null,
      previewAssets:
        typeof theme.preview_assets === "object" && theme.preview_assets
          ? {
              desktop: absolutizeThemePreview(theme.preview_assets.desktop || null),
              mobile: absolutizeThemePreview(theme.preview_assets.mobile || null),
            }
          : {},
      recommended: Boolean(theme.recommended_for_profession),
      recommendedProfessions: Array.isArray(theme.recommended_professions)
        ? theme.recommended_professions
        : [],
      recommendedProfessionLabels: Array.isArray(theme.recommended_profession_labels)
        ? theme.recommended_profession_labels
        : [],
      designTags: Array.isArray(theme.design_tags) ? theme.design_tags : [],
      sourceFamily: theme.source_family || null,
      starterMediaPolicy: theme.starter_media_policy || null,
      supportedPages: Array.isArray(theme.supported_pages) ? theme.supported_pages : [],
      supportedSemanticModules: Array.isArray(theme.supported_semantic_modules)
        ? theme.supported_semantic_modules
        : [],
      readiness: theme.readiness || null,
      approvedProductTheme: theme.approved_product_theme !== false,
      currentContentPackKey,
      starterContentPackKey: theme.starter_content_pack_key || currentContentPackKey || null,
    });
  });

  return styles;
}

export function isNextJsStyle(style) {
  return style?.renderer_engine === "nextjs";
}

export function buildNextJsPreviewUrl({ token, pagePath = [] }) {
  if (!hasConfiguredNextJsThemeBaseUrl()) {
    throw new Error(NEXTJS_THEME_PREVIEW_CONFIG_ERROR);
  }
  const cleanPath = Array.isArray(pagePath)
    ? pagePath.filter(Boolean).map((item) => String(item).replace(/^\/+|\/+$/g, ""))
    : [];
  const suffix = cleanPath.length ? `/${cleanPath.join("/")}` : "";
  return `${TENANT_WEB_NEXT_BASE_URL}/preview/${encodePreviewPathToken(token)}${suffix}`;
}
