// src/utils/tenant.js
const DEFAULT_PRIMARY_HOST = "schedulaa.com";
const FQDN_REGEX = /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$/i;

export const normalizeDomain = (host = "") => {
  if (!host) return "";
  return String(host).trim().replace(/\.$/, "").toLowerCase();
};

export const isValidHostname = (host) => FQDN_REGEX.test(normalizeDomain(host));


export function tenantBaseUrl(
  { customDomain, slug, primaryHost = DEFAULT_PRIMARY_HOST, protocol = "https", frontendBase } = {}
) {
  const safeProtocol = protocol?.replace(/:$/, "") || "https";

  if (customDomain && isValidHostname(customDomain)) {
    return `${safeProtocol}://${normalizeDomain(customDomain)}`;
  }

  const cleanedSlug = String(slug || "").trim().replace(/^\/+|\/+$/g, "");

  const normalizedFrontend = (() => {
    if (!frontendBase) return "";
    try {
      const candidate = frontendBase.includes("://")
        ? new URL(frontendBase)
        : new URL(`${safeProtocol}://${frontendBase}`);
      const base = `${candidate.protocol}//${candidate.host}`;
      const path = candidate.pathname && candidate.pathname !== "/"
        ? candidate.pathname.replace(/\/$/, "")
        : "";
      return path ? `${base}${path}` : base;
    } catch {
      return "";
    }
  })();

  if (cleanedSlug && normalizedFrontend) {
    return `${normalizedFrontend}/${cleanedSlug}`;
  }

  const normalizedHost = normalizeDomain(primaryHost) || DEFAULT_PRIMARY_HOST;

  if (cleanedSlug) {
    return `${safeProtocol}://${normalizedHost}/${cleanedSlug}`;
  }

  return `${safeProtocol}://${normalizedHost}`;
}

export function getTenantHostMode(
  host = (typeof window !== "undefined" ? window.location.host : ""),
  primaryHost = DEFAULT_PRIMARY_HOST
) {
  const normalizedHost = normalizeDomain(host);
  const normalizedPrimary = normalizeDomain(primaryHost);

  if (!normalizedHost) return "unknown";
  if (!normalizedPrimary) return "custom";

  if (
    normalizedHost === normalizedPrimary ||
    normalizedHost.endsWith(`.${normalizedPrimary}`)
  ) {
    return "primary";
  }
  return "custom";
}

export function isCustomDomainHost(host, primaryHost = DEFAULT_PRIMARY_HOST) {
  return getTenantHostMode(host, primaryHost) === "custom";
}

export function resolveTenantPreview({ company, domainSnapshot, primaryHost } = {}) {
  const customDomain = domainSnapshot?.domain || company?.custom_domain || null;
  const slug = company?.slug || domainSnapshot?.slug || "";
  return tenantBaseUrl({ customDomain, slug, primaryHost });
}

