import {
  buildPublishedWebsiteUrl,
  getPublishedRendererSelection,
  inferPagePathFromLocation,
  shouldUseNextJsPublicRenderer,
} from "./publicWebsite";

describe("public website resolver", () => {
  it("builds a legacy live URL for classic sites", () => {
    const url = buildPublishedWebsiteUrl({
      status: {
        company_slug: "acme-spa",
        is_live: true,
        published_renderer_engine: "legacy-react",
      },
      pagePath: "contact",
      currentOrigin: "http://localhost:3000",
    });
    expect(url).toBe("http://localhost:3000/acme-spa/contact");
  });

  it("builds a nextjs live URL for every published nextjs theme", () => {
    for (const visualThemeKey of [
      "modern-gradient",
      "eldora-dark",
      "motion-editorial",
      "finwise",
    ]) {
      const url = buildPublishedWebsiteUrl({
        status: {
          company_slug: "acme-spa",
          is_live: true,
          published_renderer_engine: "nextjs",
          published_visual_theme_key: visualThemeKey,
        },
        pagePath: "services/facials",
        currentOrigin: "http://localhost:3000",
        nextBaseUrl: "http://127.0.0.1:3402",
      });
      expect(url).toMatch(/\/site\/acme-spa\/services\/facials$/);
    }
  });

  it("returns nextjs selection from published metadata", () => {
    expect(
      getPublishedRendererSelection({
        published_renderer_engine: "nextjs",
        published_visual_theme_key: "finwise",
        published_visual_theme_version: 1,
      })
    ).toEqual({
      rendererEngine: "nextjs",
      visualThemeKey: "finwise",
      visualThemeVersion: 1,
      legacyDesignFamily: null,
    });
  });

  it("infers page paths from slug routes and query fallback", () => {
    expect(
      inferPagePathFromLocation({
        pathname: "/acme-spa/services/facials",
        slug: "acme-spa",
        isCustomDomain: false,
      })
    ).toBe("services/facials");
    expect(
      inferPagePathFromLocation({
        pathname: "/acme-spa",
        search: "?page=reviews",
        slug: "acme-spa",
        isCustomDomain: false,
      })
    ).toBe("reviews");
  });

  it("identifies published nextjs sites for public handoff", () => {
    expect(
      shouldUseNextJsPublicRenderer({
        is_live: true,
        published_renderer_engine: "nextjs",
        published_visual_theme_key: "motion-editorial",
      })
    ).toBe(true);
    expect(
      shouldUseNextJsPublicRenderer({
        is_live: true,
        published_renderer_engine: "legacy-react",
      })
    ).toBe(false);
  });
});
