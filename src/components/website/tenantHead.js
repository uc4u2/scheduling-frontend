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
  const explicitFavicon =
    sitePayload?.favicon_url ||
    sitePayload?.website_setting?.favicon_url ||
    sitePayload?.settings?.favicon_url ||
    "";
  if (explicitFavicon) return String(explicitFavicon).trim();

  const headerLogo =
    resolveTenantAssetUrl(
      sitePayload?.header?.logo_asset,
      sitePayload?.header?.logo_url ||
        sitePayload?.header?.logo_asset_url ||
        sitePayload?.header?.logo ||
        ""
    ) || "";
  if (headerLogo) return headerLogo;

  const companyLogo = sitePayload?.company?.logo_url || "";
  return typeof companyLogo === "string" ? companyLogo.trim() : "";
}

export function setTenantFavicon(href) {
  if (typeof document === "undefined") return;
  const next = (href || "").trim();
  const value = next || "/favicon.ico";
  const rels = ["icon", "shortcut icon"];

  rels.forEach((rel) => {
    const existing = Array.from(
      document.querySelectorAll(`link[rel='${rel}']`)
    );
    let link = existing[0];
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = value;
    link.setAttribute("data-tenant-favicon", "true");
    existing.slice(1).forEach((node) => node.parentNode?.removeChild(node));
  });
}
