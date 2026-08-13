import {
  buildWebsiteBuilderUrl,
  buildClassicRestorePayload,
  buildWebsiteStyleApplyPayload,
  getBuilderTabDefaultIndex,
  isAcceptedPreviewMessage,
  isNextJsBuilderMode,
  usesDockedSemanticInspector,
  normalizePreviewPagePath,
  resolveBuilderRendererMode,
} from "./websiteStyleBridge";

describe("websiteStyleBridge", () => {
  it("builds modern-gradient apply payload without touching content metadata", () => {
    expect(
      buildWebsiteStyleApplyPayload({
        key: "modern-gradient",
        version: 1,
        renderer_engine: "nextjs",
      })
    ).toEqual({
      renderer_engine: "nextjs",
      visual_theme_key: "modern-gradient",
      visual_theme_version: 1,
    });
  });

  it("builds classic restore payload that clears nextjs theme metadata", () => {
    expect(buildClassicRestorePayload()).toEqual({
      renderer_engine: "legacy-react",
      visual_theme_key: null,
      visual_theme_version: null,
      design_family: "classic",
      design_family_version: 1,
      motion_profile: "legacy",
    });
  });

  it("normalizes nested page paths from canonical path", () => {
    expect(
      normalizePreviewPagePath({ canonical_path: "/services/air-conditioning/" })
    ).toEqual(["services", "air-conditioning"]);
  });

  it("normalizes empty or home paths to root preview", () => {
    expect(normalizePreviewPagePath({ slug: "home" })).toEqual([]);
    expect(normalizePreviewPagePath({ path: "/" })).toEqual([]);
  });

  it("accepts preview messages from the expected preview origin", () => {
    const iframeWindow = {};
    expect(
      isAcceptedPreviewMessage({
        eventOrigin: "http://127.0.0.1:3402",
        expectedOrigin: "http://127.0.0.1:3402",
        eventSource: iframeWindow,
        expectedSource: iframeWindow,
      })
    ).toBe(true);
    expect(
      isAcceptedPreviewMessage({
        eventOrigin: "http://evil.example",
        expectedOrigin: "http://127.0.0.1:3402",
        eventSource: iframeWindow,
        expectedSource: iframeWindow,
      })
    ).toBe(false);
    expect(
      isAcceptedPreviewMessage({
        eventOrigin: "http://127.0.0.1:3402",
        expectedOrigin: "http://127.0.0.1:3402",
        eventSource: {},
        expectedSource: iframeWindow,
      })
    ).toBe(true);
  });

  it("reads the Website Style builder tab from the URL", () => {
    expect(getBuilderTabDefaultIndex("?builder_tab=style")).toBe(1);
    expect(getBuilderTabDefaultIndex("?builder_tab=content")).toBe(0);
    expect(getBuilderTabDefaultIndex("")).toBe(0);
  });

  it("centralizes Builder renderer mode resolution", () => {
    expect(resolveBuilderRendererMode({ renderer_engine: "nextjs" })).toBe("nextjs");
    expect(resolveBuilderRendererMode({ settings: { renderer_engine: "nextjs" } })).toBe("nextjs");
    expect(resolveBuilderRendererMode({ current_renderer_engine: "nextjs" })).toBe("nextjs");
    expect(resolveBuilderRendererMode({ renderer_engine: "legacy-react" })).toBe("legacy-react");
    expect(isNextJsBuilderMode("nextjs")).toBe(true);
    expect(isNextJsBuilderMode("legacy-react")).toBe(false);
    expect(usesDockedSemanticInspector("nextjs")).toBe(true);
    expect(usesDockedSemanticInspector("legacy-react")).toBe(false);
  });

  it("builds a builder URL with company and style-tab context", () => {
    expect(buildWebsiteBuilderUrl(17, { tab: "style" })).toBe(
      "/manage/website/builder?company_id=17&builder_tab=style"
    );
    expect(buildWebsiteBuilderUrl(17)).toBe(
      "/manage/website/builder?company_id=17"
    );
  });
});
