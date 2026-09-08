import {
  buildPublishedWebsiteUrl,
  getPublicUrlContract,
  getPublishedRendererSelection,
  inferPagePathFromLocation,
  normalizeLoopbackBaseUrl,
  shouldUseNextJsPublicRenderer,
  isPublicTenantGatewayEnabled,
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

  it("keeps Classic View live on localhost despite a saved production custom domain", () => {
    const url = buildPublishedWebsiteUrl({
      status: {
        company_slug: "acme-spa",
        is_live: true,
        custom_domain: "www.acme-spa.example",
        published_renderer_engine: "legacy-react",
      },
      currentOrigin: "http://localhost:3000",
    });
    expect(url).toBe("http://localhost:3000/acme-spa");
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

  it("uses the stable public contract for a gateway-enabled Next tenant", () => {
    const status = {
      company_slug: "web-design",
      is_live: true,
      published_renderer_engine: "nextjs",
      published_visual_theme_key: "forge-motion",
      public_url_contract: {
        company_slug: "web-design",
        primary_public_url: "https://app.schedulaa.com/web-design",
      },
    };
    expect(isPublicTenantGatewayEnabled(status, { enabled: true, cohortSlugs: "web-design" })).toBe(true);
    expect(buildPublishedWebsiteUrl({
      status,
      pagePath: "services/strength",
      search: "?ref=manager",
      currentOrigin: "https://app.schedulaa.com",
      nextBaseUrl: "https://scheduling-tenant-web-next.onrender.com",
      gateway: { enabled: true, cohortSlugs: "web-design" },
    })).toBe("https://app.schedulaa.com/web-design/services/strength?ref=manager");
  });

  it("uses a verified custom-domain contract without exposing the company slug", () => {
    const status = {
      company_slug: "vandaorchidjewels",
      is_live: true,
      published_renderer_engine: "nextjs",
      public_url_contract: {
        company_slug: "vandaorchidjewels",
        primary_public_url: "https://www.vandaorchidjewel.com/",
        custom_domain_url: "https://www.vandaorchidjewel.com/",
      },
    };
    expect(buildPublishedWebsiteUrl({
      status,
      pagePath: "contact",
      currentOrigin: "https://app.schedulaa.com",
      nextBaseUrl: "https://renderer.example",
      gateway: { enabled: true, customHosts: "www.vandaorchidjewel.com" },
    })).toBe("https://www.vandaorchidjewel.com/contact");
  });

  it("uses the direct Next renderer for a non-cohort site opened on the app host", () => {
    const status = {
      company_slug: "new-studio",
      is_live: true,
      published_renderer_engine: "nextjs",
      published_visual_theme_key: "iron-ember",
      public_url_contract: {
        primary_public_url: "https://app.schedulaa.com/new-studio",
        schedulaa_url: "https://app.schedulaa.com/new-studio",
      },
    };
    expect(buildPublishedWebsiteUrl({
      status,
      pagePath: "services",
      currentOrigin: "https://app.schedulaa.com",
      nextBaseUrl: "https://scheduling-tenant-web-next.onrender.com",
      gateway: { enabled: false },
    })).toBe("https://scheduling-tenant-web-next.onrender.com/site/new-studio/services");
  });

  it("keeps transactional return links on the current public host when explicitly requested", () => {
    const status = {
      company_slug: "web-design",
      is_live: true,
      published_renderer_engine: "nextjs",
      public_url_contract: {
        primary_public_url: "https://app.schedulaa.com/web-design",
        schedulaa_url: "https://app.schedulaa.com/web-design",
      },
    };
    expect(buildPublishedWebsiteUrl({
      status,
      pagePath: "products",
      currentOrigin: "https://app.schedulaa.com",
      nextBaseUrl: "https://scheduling-tenant-web-next.onrender.com",
      gateway: { enabled: false },
      preferCurrentPublicHost: true,
    })).toBe("https://app.schedulaa.com/web-design/products");
  });

  it("does not switch a custom-domain request onto the canonical platform host", () => {
    const status = {
      company_slug: "salon",
      is_live: true,
      published_renderer_engine: "nextjs",
      public_url_contract: {
        primary_public_url: "https://app.schedulaa.com/salon",
        schedulaa_url: "https://app.schedulaa.com/salon",
        custom_domain_url: "https://www.salon.example/",
      },
    };
    expect(buildPublishedWebsiteUrl({
      status,
      pagePath: "login",
      currentOrigin: "https://www.salon.example",
      nextBaseUrl: "https://renderer.example",
      gateway: { enabled: false },
    })).toBe("https://www.salon.example/login");
  });

  it("reads the additive backend contract without removing legacy fields", () => {
    expect(getPublicUrlContract({ public_url_contract: { contract_version: "1.0" } })).toEqual({ contract_version: "1.0" });
    expect(getPublicUrlContract({ company_slug: "legacy" })).toBeNull();
    expect(getPublishedRendererSelection({
      public_url_contract: {
        renderer_engine: "nextjs",
        visual_theme_key: "forge-motion",
        visual_theme_version: "1.0.0",
      },
    })).toMatchObject({
      rendererEngine: "nextjs",
      visualThemeKey: "forge-motion",
      visualThemeVersion: "1.0.0",
    });
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

  it("normalizes local nextjs loopback bases to localhost", () => {
    expect(normalizeLoopbackBaseUrl("http://localhost:3402")).toBe(
      "http://localhost:3402"
    );
    expect(normalizeLoopbackBaseUrl("http://127.0.0.1:3402")).toBe(
      "http://localhost:3402"
    );
    expect(
      buildPublishedWebsiteUrl({
        status: {
          company_slug: "acme-spa",
          is_live: true,
          published_renderer_engine: "nextjs",
          published_visual_theme_key: "iron-ember",
        },
        currentOrigin: "http://localhost:3001",
        nextBaseUrl: "http://localhost:3402",
      })
    ).toBe("http://localhost:3402/site/acme-spa");
  });
});
