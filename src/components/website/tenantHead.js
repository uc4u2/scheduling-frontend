export function resolveTenantAssetUrl(asset, fallback = "") {
  const candidate =
    asset?.url_public ||
    asset?.url ||
    asset?.file_url ||
    asset?.href ||
    asset?.src ||
    fallback;
  return typeof candidate === "string" ? candidate.trim() : "";
}

export function resolveTenantFavicon(sitePayload = {}) {
  const resolvedFavicon =
    sitePayload?.favicon_url ||
    sitePayload?.effective_favicon_url ||
    sitePayload?.website_setting?.favicon_url ||
    sitePayload?.settings?.favicon_url ||
    "";
  return typeof resolvedFavicon === "string" ? resolvedFavicon.trim() : "";
}

export function setTenantFavicon(href) {
  if (typeof document === "undefined") return;
  const next = (href || "").trim();
  const rels = ["icon", "shortcut icon"];

  rels.forEach((rel) => {
    const existing = Array.from(
      document.querySelectorAll(`link[rel='${rel}']`)
    );
    if (!next) {
      existing.forEach((node) => node.parentNode?.removeChild(node));
      return;
    }
    let link = existing[0];
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = next;
    link.setAttribute("data-tenant-favicon", "true");
    existing.slice(1).forEach((node) => node.parentNode?.removeChild(node));
  });
}
