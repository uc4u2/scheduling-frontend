import { isNextJsStyle } from "./websiteCatalogUi";

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

export function isAcceptedPreviewMessage({
  eventOrigin,
  expectedOrigin,
  eventSource,
  expectedSource,
}) {
  if (!expectedOrigin || eventOrigin !== expectedOrigin) return false;
  if (!expectedSource) return true;
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
