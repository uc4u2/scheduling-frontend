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

  it("uses the backend public URL contract for public-host transaction returns", () => {
    const contract = buildTenantTransactionalBrandingContract(
      {
        slug: "web-design",
        renderer_engine: "nextjs",
        visual_theme_key: "frame-and-field",
        public_url_contract: {
          primary_public_url: "https://app.schedulaa.com/web-design",
          schedulaa_url: "https://app.schedulaa.com/web-design",
        },
      },
      { pagePath: "products", currentOrigin: "https://app.schedulaa.com" },
    );

    expect(contract.publicSiteUrl).toBe("https://app.schedulaa.com/web-design/products");
    expect(contract.rootSiteUrl).toBe("https://app.schedulaa.com/web-design");
    expect(contract.tokens).toMatchObject({
      background: "#f2eee8",
      primary: "#11100f",
      accent: "#a65e35",
    });
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
    ).toBe("https://next.example.com/site/uc-jalali/products");
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
    ).toBe("https://next.example.com/site/uc-jalali/services");
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
    expect(resolveTransactionalThemeTokens("forge-motion")).toMatchObject({
      background: "#080808",
      primary: "#c7ff3d",
      mode: "dark",
    });
  });

  it.each([
    ["Modern Noir", "#111113", "#0f1012", "#1a1b20", "#f5efe3", "#d1a257", "#18171a", "dark", 8],
    ["Blush Spa", "#fff7f8", "#f0e6e9", "#ffffff", "#4a2331", "#c85d7c", "#fffafc", "light", 16],
    ["Forest Calm", "#f5fbf7", "#e7f1ea", "#ffffff", "#234437", "#4f8b72", "#f7fdf9", "light", 16],
    ["Champagne Luxe", "#fffaf2", "#f3eadf", "#ffffff", "#4f3422", "#b98a50", "#fffaf2", "light", 16],
    ["Ocean Clean", "#f7fbfd", "#edf5fa", "#ffffff", "#1f4254", "#2e8ca6", "#f7fbfd", "light", 16],
  ])("resolves the complete %s Page Style palette", (_name, background, surface, card, text, primary, buttonText, mode, radius) => {
    const tokens = resolveTransactionalThemeTokens("iron-ember", {
      pageBackground: background,
      surfaceColor: surface,
      cardColor: card,
      foregroundColor: text,
      mutedForegroundColor: text,
      borderColor: text,
      brandPrimaryColor: primary,
      accentColor: primary,
      buttonForegroundColor: buttonText,
      lightDarkPreference: mode,
      buttonRadius: radius / 8,
      buttonTreatment: "solid",
    });

    expect(tokens).toMatchObject({
      background,
      surface,
      card,
      text,
      textMuted: text,
      border: text,
      primary,
      accent: primary,
      buttonText,
      buttonBackground: primary,
      mode,
      radius,
    });
  });

  it("keeps button treatment visual-only while honoring the shared radius scale", () => {
    expect(resolveTransactionalThemeTokens("iron-ember", {
      brandPrimaryColor: "#c85d7c",
      surfaceColor: "#f0e6e9",
      buttonRadius: 3,
      buttonTreatment: "outline",
    })).toMatchObject({
      buttonBackground: "transparent",
      buttonBorder: "#c85d7c",
      buttonText: "#c85d7c",
      radius: 24,
    });
  });
});
