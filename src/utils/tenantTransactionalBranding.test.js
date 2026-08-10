import {
  buildTenantTransactionalBrandingContract,
  resolveTransactionalReturnTo,
  resolveTransactionalThemeTokens,
} from "./tenantTransactionalBranding";

describe("tenantTransactionalBranding", () => {
  it("maps nextjs shell payload into a transactional branding contract", () => {
    const contract = buildTenantTransactionalBrandingContract(
      {
        slug: "uc-jalali",
        renderer_engine: "nextjs",
        visual_theme_key: "modern-gradient",
        company: {
          name: "Uc Jalali",
          phone: "555-1212",
          contact_email: "hello@example.com",
        },
        header: {
          logo_url: "https://cdn.example.com/logo.png",
        },
        website_setting: {
          custom_domain: "spa.example.com",
        },
        theme_overrides: {
          brandPrimaryColor: "#112233",
          accentColor: "#abcdef",
          buttonRadius: 20,
        },
      },
      {
        pagePath: "services",
        currentOrigin: "https://app.example.com",
      }
    );

    expect(contract).toMatchObject({
      rendererEngine: "nextjs",
      isNextJsTenant: true,
      visualThemeKey: "modern-gradient",
      tenantSlug: "uc-jalali",
      companyName: "Uc Jalali",
      logoUrl: "https://cdn.example.com/logo.png",
      contactPhone: "555-1212",
      contactEmail: "hello@example.com",
    });
    expect(contract.publicSiteUrl).toBe("https://spa.example.com/services");
    expect(contract.tokens.primary).toBe("#112233");
    expect(contract.tokens.accent).toBe("#abcdef");
    expect(contract.tokens.radius).toBe(20);
  });

  it("prefers safe relative return targets", () => {
    const contract = {
      rootSiteUrl: "https://next.example.com/site/uc-jalali",
    };

    expect(
      resolveTransactionalReturnTo({
        brandingContract: contract,
        returnTo: "/services/facial",
      })
    ).toBe("https://next.example.com/services/facial");
  });

  it("falls back to themed website paths when return targets are absent", () => {
    const contract = {
      rootSiteUrl: "https://next.example.com/site/uc-jalali",
    };

    expect(
      resolveTransactionalReturnTo({
        brandingContract: contract,
        fallbackPagePath: "products",
      })
    ).toBe("https://next.example.com/products");
  });

  it("keeps unsafe return targets out of the shell", () => {
    const contract = {
      rootSiteUrl: "https://next.example.com/site/uc-jalali",
    };

    expect(
      resolveTransactionalReturnTo({
        brandingContract: contract,
        returnTo: "https://evil.example.com/phish",
        fallbackPagePath: "services",
      })
    ).toBe("https://next.example.com/services");
  });

  it("resolves theme tokens for known integrated themes", () => {
    expect(resolveTransactionalThemeTokens("eldora-dark")).toMatchObject({
      primary: "#d4a95f",
      buttonText: "#0f1117",
    });
    expect(resolveTransactionalThemeTokens("finwise")).toMatchObject({
      primary: "#1b4ddb",
      radius: 12,
    });
  });
});
