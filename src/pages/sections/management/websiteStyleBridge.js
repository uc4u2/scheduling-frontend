import { isNextJsStyle } from "./websiteCatalogUi";
import { inferPageKind } from "../../../utils/websiteSemanticModules";

export function buildClassicRestorePayload() {
  return {
    renderer_engine: "legacy-react",
    visual_theme_key: null,
    visual_theme_version: null,
    design_family: "classic",
    design_family_version: 1,
    motion_profile: "legacy",
  };
}

export function buildWebsiteStyleApplyPayload(style) {
  if (isNextJsStyle(style)) {
    return {
      renderer_engine: "nextjs",
      visual_theme_key: style.key,
      visual_theme_version: style.version,
    };
  }
  return buildClassicRestorePayload();
}

export function resolveBuilderRendererMode(input = null) {
  const renderer =
    (typeof input === "string" ? input : null) ||
    input?.rendererEngine ||
    input?.renderer_engine ||
    input?.current_renderer_engine ||
    input?.settings?.renderer_engine ||
    "";
  return String(renderer).trim().toLowerCase() === "nextjs"
    ? "nextjs"
    : "legacy-react";
}

export function isNextJsBuilderMode(mode) {
  return resolveBuilderRendererMode(mode) === "nextjs";
}

// Classic retains its floating/inline inspector modes. Semantic Next.js editing
// always belongs in the Builder's contextual left inspector.
export function usesDockedSemanticInspector(mode) {
  return isNextJsBuilderMode(mode);
}

export function normalizePreviewPagePath(editing) {
  const pathValue = String(
    editing?.path || editing?.canonical_path || editing?.slug || ""
  )
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (!pathValue || pathValue === "home") return [];
  return pathValue.split("/").filter(Boolean);
}

// WebsitePage slugs remain backward-compatible with Classic (for example
// `services-classic` and `gallery`). Next exposes one semantic public route
// for those aliases. Keep this translation limited to the Next preview/live
// bridge so the persisted page and legacy public renderer are not migrated.
export function normalizeNextJsPreviewPagePath(editing) {
  const pagePath = normalizePreviewPagePath(editing);
  if (pagePath.length !== 1) return pagePath;
  const canonicalByKind = {
    services: "services",
    products: "products",
    projects: "projects",
    blog: "blog",
    contact: "contact",
    "service-areas": "service-areas",
  };
  const canonical = canonicalByKind[inferPageKind(editing)];
  return canonical ? [canonical] : pagePath;
}

export function isAcceptedPreviewMessage({
  eventOrigin,
  expectedOrigin,
  eventSource,
  expectedSource,
}) {
  // The local stack legitimately uses both localhost and 127.0.0.1 (the
  // public renderer, backend and Builder can each be started independently).
  // Treat only those loopback aliases as equivalent; every other origin still
  // requires an exact match.
  const normalizeLoopbackOrigin = (value) => {
    try {
      const url = new URL(value);
      const host = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)
        ? "local-loopback"
        : url.hostname;
      return `${url.protocol}//${host}${url.port ? `:${url.port}` : ""}`;
    } catch {
      return String(value || "");
    }
  };
  if (!expectedOrigin || normalizeLoopbackOrigin(eventOrigin) !== normalizeLoopbackOrigin(expectedOrigin)) return false;
  if (!expectedSource) return true;
  // Sandboxed iframe WindowProxy identities are not stable across a local
  // renderer reload. Origin is the security boundary here; accept a real
  // source window after that check so an editable Canvas does not lose clicks
  // whenever Next refreshes its signed preview document.
  return eventSource === expectedSource || Boolean(eventSource);
}

export function getBuilderTabDefaultIndex(search = "") {
  try {
    const value = new URLSearchParams(search || "").get("builder_tab");
    return String(value || "").trim().toLowerCase() === "style" ? 1 : 0;
  } catch {
    return 0;
  }
}

export function buildWebsiteBuilderUrl(companyId, { tab } = {}) {
  const params = new URLSearchParams();
  if (companyId) params.set("company_id", String(companyId));
  if (tab === "style") params.set("builder_tab", "style");
  const query = params.toString();
  return `/manage/website/builder${query ? `?${query}` : ""}`;
}
