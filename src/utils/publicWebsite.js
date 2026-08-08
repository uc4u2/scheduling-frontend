const configuredNextBaseUrl = process.env.REACT_APP_TENANT_WEB_NEXT_URL || "";

export const TENANT_WEB_NEXT_PUBLIC_BASE_URL = String(configuredNextBaseUrl || "").replace(/\/$/, "");

const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1)$/i;

export function isLocalHostname(hostname = "") {
  return LOCAL_HOST_PATTERN.test(String(hostname || "").trim());
}

export function normalizeWebsitePath(pathValue = "") {
  const raw = String(pathValue || "").trim();
  if (!raw || raw === "/") return "";
  return raw.replace(/^\/+|\/+$/g, "");
}

export function inferPagePathFromLocation({
  pathname = "",
  search = "",
  slug = "",
  isCustomDomain = false,
} = {}) {
  const normalizedSlug = String(slug || "").trim().replace(/^\/+|\/+$/g, "");
  let trimmedPath = String(pathname || "").trim();
  if (!trimmedPath) trimmedPath = "/";
  if (!isCustomDomain && normalizedSlug) {
    const prefix = `/${normalizedSlug}`;
    if (trimmedPath === prefix) {
      trimmedPath = "/";
    } else if (trimmedPath.startsWith(`${prefix}/`)) {
      trimmedPath = trimmedPath.slice(prefix.length) || "/";
    }
  }
  let normalized = normalizeWebsitePath(trimmedPath);
  if (normalized) return normalized;

  try {
    const params = new URLSearchParams(search || "");
    const page = normalizeWebsitePath(params.get("page") || "");
    if (!page || page === "home") return "";
    return page;
  } catch {
    return "";
  }
}

export function getPublishedRendererSelection(status = {}) {
  const rendererEngine =
    String(
      status?.published_renderer_engine ||
        status?.current_renderer_engine ||
        "legacy-react"
    ).trim().toLowerCase() || "legacy-react";

  return {
    rendererEngine,
    visualThemeKey:
      status?.published_visual_theme_key ||
      (rendererEngine === "nextjs" ? status?.current_visual_theme_key || null : null),
    visualThemeVersion:
      status?.published_visual_theme_version ||
      (rendererEngine === "nextjs" ? status?.current_visual_theme_version || null : null),
    legacyDesignFamily:
      status?.published_legacy_design_family ||
      (rendererEngine === "legacy-react"
        ? status?.current_legacy_design_family || "classic"
        : null),
  };
}

export function buildPublishedWebsiteUrl({
  status = {},
  pagePath = "",
  currentOrigin = "",
  search = "",
  nextBaseUrl = TENANT_WEB_NEXT_PUBLIC_BASE_URL,
} = {}) {
  const slug = String(status?.company_slug || "").trim();
  if (!slug) return null;
  const normalizedPath = normalizeWebsitePath(pagePath);
  const suffix = normalizedPath ? `/${normalizedPath}` : "";
  const query = String(search || "").trim();
  const customDomain = String(status?.custom_domain || "").trim().replace(/^https?:\/\//i, "");
  const live = Boolean(status?.is_live);
  if (!live) return null;

  const selection = getPublishedRendererSelection(status);
  if (selection.rendererEngine === "nextjs") {
    if (nextBaseUrl) {
      return `${String(nextBaseUrl || "").replace(/\/$/, "")}/site/${encodeURIComponent(slug)}${suffix}${query}`;
    }
    if (customDomain && !isLocalHostname(customDomain)) {
      return `https://${customDomain}${suffix}${query}`;
    }
    return null;
  }

  if (customDomain && !isLocalHostname(customDomain)) {
    return `https://${customDomain}${suffix}${query}`;
  }

  const safeOrigin = String(currentOrigin || "").replace(/\/$/, "");
  if (!safeOrigin) return slug ? `/${slug}${suffix}${query}` : null;
  return `${safeOrigin}/${encodeURIComponent(slug)}${suffix}${query}`;
}

export function shouldUseNextJsPublicRenderer(status = {}) {
  if (!status || !status.is_live) return false;
  const selection = getPublishedRendererSelection(status);
  return selection.rendererEngine === "nextjs" && Boolean(selection.visualThemeKey);
}
