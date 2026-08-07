const NEXTJS_THEME_BASE_URL =
  (typeof process !== "undefined" && process.env?.REACT_APP_TENANT_WEB_NEXT_URL) ||
  "http://127.0.0.1:3401";

export const TENANT_WEB_NEXT_BASE_URL = String(NEXTJS_THEME_BASE_URL).replace(/\/$/, "");

export function buildWebsiteStyleChoices({
  catalog = null,
  status = null,
} = {}) {
  const currentContentPackKey =
    status?.current_content_pack_key ||
    null;

  const compatibleThemes = Array.isArray(catalog?.compatible_visual_themes)
    ? catalog.compatible_visual_themes
    : [];

  const modernGradient = compatibleThemes.find(
    (theme) =>
      theme?.key === "modern-gradient" &&
      theme?.renderer_engine === "nextjs" &&
      theme?.status !== "deprecated" &&
      theme?.status !== "hidden"
  );

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

  if (modernGradient) {
    styles.push({
      key: "modern-gradient",
      version: Number(modernGradient.version || 1),
      renderer_engine: "nextjs",
      name: modernGradient.label || "Modern Gradient",
      description:
        modernGradient.description ||
        "Modern Gradient beta theme rendered through the standalone Next.js public renderer.",
      selectable: true,
      beta: true,
      currentContentPackKey,
    });
  }

  return styles;
}

export function isNextJsStyle(style) {
  return style?.renderer_engine === "nextjs";
}

export function buildNextJsPreviewUrl({ token, pagePath = [] }) {
  const cleanPath = Array.isArray(pagePath)
    ? pagePath.filter(Boolean).map((item) => String(item).replace(/^\/+|\/+$/g, ""))
    : [];
  const suffix = cleanPath.length ? `/${cleanPath.join("/")}` : "";
  return `${TENANT_WEB_NEXT_BASE_URL}/preview/${encodeURIComponent(token)}${suffix}`;
}
