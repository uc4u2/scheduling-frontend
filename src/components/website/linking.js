// src/components/website/linking.js
export function resolveSiteHref(slug, href, pages = [], opts = { pretty: false }) {
  if (!href || typeof href !== "string") return href;

  // external links pass through
  if (/^(https?:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return href;
  }

  // normalize to absolute
  if (!href.startsWith("/")) href = `/${href}`;
  const clean = href.replace(/\/+$/, "");

  if (clean.startsWith("/?page=")) {
    const pageSlug = clean.slice(7);
    if (!pageSlug) return `/${slug}`;
    if (pageSlug.toLowerCase() === "services") {
      return `/${slug}?page=services-classic`;
    }
    return `/${slug}?page=${pageSlug}`;
  }

  // app-level routes that *must* be slug-prefixed
  const appRoots = ["/services", "/reviews", "/book", "/tip", "/review"];
  if (appRoots.some((r) => clean === r || clean.startsWith(`${r}/`))) {
    return `/${slug}${clean}`;
  }

  // website page slugs (home/contact/about etc.) → either ?page= or /site/:slug
  const pageSlugs = new Set(pages.map((p) => `/${p.slug}`));
  if (pageSlugs.has(clean)) {
    const pageSlug = clean.slice(1);
    return opts.pretty ? `/${slug}/site/${pageSlug}` : `/${slug}?page=${pageSlug}`;
  }

  // default internal fallback: treat as website page path
  const asPage = clean.replace(/^\//, "");
  return opts.pretty ? `/${slug}/site/${asPage}` : `/${slug}?page=${asPage}`;
}

/** Deeply walk props and rewrite any key that looks like a link. */
export function transformLinksDeep(obj, resolver) {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map((v) => transformLinksDeep(v, resolver));
  if (typeof obj !== "object") return obj;

  const out = { ...obj };
  for (const k of Object.keys(out)) {
    const v = out[k];
    const looksLikeHref =
      typeof v === "string" && (k === "href" || k === "link" || k === "ctaLink" || /link$/i.test(k));
    if (looksLikeHref) {
      out[k] = resolver(v);
    } else if (v && typeof v === "object") {
      out[k] = transformLinksDeep(v, resolver);
    }
  }
  return out;
}
