const configuredNextBaseUrl = process.env.REACT_APP_TENANT_WEB_NEXT_URL || "";
const configuredGatewayEnabled = /^(1|true|yes|on)$/i.test(
  String(process.env.REACT_APP_PUBLIC_TENANT_GATEWAY_ENABLED || "")
);
const configuredGatewayCohortSlugs = process.env.REACT_APP_PUBLIC_TENANT_GATEWAY_COHORT_SLUGS || "";
const configuredGatewayCustomHosts = process.env.REACT_APP_PUBLIC_TENANT_GATEWAY_CUSTOM_HOSTS || "";

const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1)$/i;

export function isLocalHostname(hostname = "") {
  return LOCAL_HOST_PATTERN.test(String(hostname || "").trim());
}

export function normalizeLoopbackBaseUrl(baseUrl = "") {
  const trimmed = String(baseUrl || "").trim().replace(/\/$/, "");
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (isLocalHostname(parsed.hostname)) {
      parsed.hostname = "localhost";
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}

export const TENANT_WEB_NEXT_PUBLIC_BASE_URL =
  normalizeLoopbackBaseUrl(configuredNextBaseUrl);

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
  const contract =
    status?.public_url_contract ||
    status?.website_setting?.public_url_contract ||
    status?.website?.public_url_contract ||
    null;
  const rendererEngine =
    String(
      status?.published_renderer_engine ||
        contract?.renderer_engine ||
        status?.current_renderer_engine ||
        "legacy-react"
    ).trim().toLowerCase() || "legacy-react";

  return {
    rendererEngine,
    visualThemeKey:
      status?.published_visual_theme_key ||
      contract?.visual_theme_key ||
      (rendererEngine === "nextjs" ? status?.current_visual_theme_key || null : null),
    visualThemeVersion:
      status?.published_visual_theme_version ||
      contract?.visual_theme_version ||
      (rendererEngine === "nextjs" ? status?.current_visual_theme_version || null : null),
    legacyDesignFamily:
      status?.published_legacy_design_family ||
      (rendererEngine === "legacy-react"
        ? status?.current_legacy_design_family || "classic"
        : null),
  };
}

const csvSet = (value = "") => new Set(
  String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
);

export function getPublicUrlContract(status = {}) {
  const contract =
    status?.public_url_contract ||
    status?.website_setting?.public_url_contract ||
    status?.website?.public_url_contract ||
    null;
  return contract && typeof contract === "object" ? contract : null;
}

export function isPublicTenantGatewayEnabled(
  status = {},
  {
    enabled = configuredGatewayEnabled,
    cohortSlugs = configuredGatewayCohortSlugs,
    customHosts = configuredGatewayCustomHosts,
  } = {}
) {
  if (!enabled) return false;
  const contract = getPublicUrlContract(status);
  const slug = String(status?.company_slug || contract?.company_slug || "").trim().toLowerCase();
  if (slug && csvSet(cohortSlugs).has(slug)) return true;
  const customUrl = String(contract?.custom_domain_url || "").trim();
  try {
    return Boolean(customUrl) && csvSet(customHosts).has(new URL(customUrl).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function appendPublicWebsitePath(baseUrl, pagePath, search = "") {
  const normalizedPath = normalizeWebsitePath(pagePath);
  const base = String(baseUrl || "").trim().replace(/\/$/, "");
  if (!base) return null;
  return `${base}${normalizedPath ? `/${normalizedPath}` : ""}${String(search || "")}`;
}

function sameHostPublicContractUrl(contract, currentOrigin) {
  const origin = String(currentOrigin || "").trim().replace(/\/$/, "");
  if (!contract || !origin) return "";
  const candidates = [
    contract.primary_public_url,
    contract.schedulaa_url,
    contract.custom_domain_url,
  ];
  for (const candidate of candidates) {
    try {
      const parsed = new URL(String(candidate || ""));
      if (parsed.origin === origin) return parsed.toString().replace(/\/$/, "");
    } catch {
      // Ignore malformed compatibility fields and continue to the next one.
    }
  }
  return "";
}

export function buildPublishedWebsiteUrl({
  status = {},
  pagePath = "",
  currentOrigin = "",
  search = "",
  nextBaseUrl = TENANT_WEB_NEXT_PUBLIC_BASE_URL,
  gateway = undefined,
} = {}) {
  const contract = getPublicUrlContract(status);
  const slug = String(status?.company_slug || contract?.company_slug || "").trim();
  if (!slug) return null;
  const normalizedPath = normalizeWebsitePath(pagePath);
  const suffix = normalizedPath ? `/${normalizedPath}` : "";
  const query = String(search || "").trim();
  const customDomain = String(status?.custom_domain || "").trim().replace(/^https?:\/\//i, "");
  const live = Boolean(status?.is_live);
  const normalizedNextBaseUrl = normalizeLoopbackBaseUrl(nextBaseUrl);
  if (!live) return null;
  const safeOrigin = String(currentOrigin || "").replace(/\/$/, "");
  let isLocalCurrentOrigin = false;
  try {
    isLocalCurrentOrigin = Boolean(safeOrigin) && isLocalHostname(new URL(safeOrigin).hostname);
  } catch {
    isLocalCurrentOrigin = false;
  }

  const selection = getPublishedRendererSelection(status);
  if (selection.rendererEngine === "nextjs") {
    // When a transactional page is already being served on a verified public
    // tenant host, keep every return link on that same host. This is safe even
    // if an older frontend deployment lacks the cohort environment flag: the
    // successful current request proves that the gateway/public host is live.
    const currentPublicBase = !isLocalCurrentOrigin
      ? sameHostPublicContractUrl(contract, safeOrigin)
      : "";
    if (currentPublicBase) {
      return appendPublicWebsitePath(currentPublicBase, normalizedPath, query);
    }
    const gatewayActive = isPublicTenantGatewayEnabled(status, gateway);
    if (!isLocalCurrentOrigin && gatewayActive && contract?.primary_public_url) {
      return appendPublicWebsitePath(contract.primary_public_url, normalizedPath, query);
    }
    if (normalizedNextBaseUrl) {
      return `${normalizedNextBaseUrl}/site/${encodeURIComponent(slug)}${suffix}${query}`;
    }
    if (customDomain && !isLocalHostname(customDomain)) {
      return `https://${customDomain}${suffix}${query}`;
    }
    return null;
  }

  // A local manager frontend must stay on its local Classic renderer even when
  // the tenant has a production custom domain saved in its website settings.
  if (isLocalCurrentOrigin) {
    return `${safeOrigin}/${encodeURIComponent(slug)}${suffix}${query}`;
  }

  if (contract?.primary_public_url) {
    return appendPublicWebsitePath(contract.primary_public_url, normalizedPath, query);
  }

  if (customDomain && !isLocalHostname(customDomain)) {
    return `https://${customDomain}${suffix}${query}`;
  }

  if (!safeOrigin) return slug ? `/${slug}${suffix}${query}` : null;
  return `${safeOrigin}/${encodeURIComponent(slug)}${suffix}${query}`;
}

export function shouldUseNextJsPublicRenderer(status = {}) {
  if (!status || !status.is_live) return false;
  const selection = getPublishedRendererSelection(status);
  return selection.rendererEngine === "nextjs" && Boolean(selection.visualThemeKey);
}
