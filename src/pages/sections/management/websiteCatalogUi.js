const configuredNextBaseUrl = process.env.REACT_APP_TENANT_WEB_NEXT_URL || "";

export const TENANT_WEB_NEXT_BASE_URL = String(configuredNextBaseUrl || "").replace(/\/$/, "");
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
      designTags: Array.isArray(theme.design_tags) ? theme.design_tags : [],
      currentContentPackKey,
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
  return `${TENANT_WEB_NEXT_BASE_URL}/preview/${encodeURIComponent(token)}${suffix}`;
}
