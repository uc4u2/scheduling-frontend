import {
  buildThemeOverridesFromPreset,
  buildNextJsPageStyleFromDraft,
  getSupportedThemeOverrideFields,
  getThemeOverrideContract,
  isThemeOverrideFieldSupported,
  sanitizeThemeOverrideDraft,
} from "./websiteThemeOverrides";

describe("website theme overrides", () => {
  it("exposes a safe contract for each live nextjs theme", () => {
    expect(getThemeOverrideContract("modern-gradient")).toBeTruthy();
    expect(getThemeOverrideContract("eldora-dark")).toBeTruthy();
    expect(getThemeOverrideContract("motion-editorial")).toBeTruthy();
    expect(getThemeOverrideContract("finwise")).toBeTruthy();
  });

  it("filters unsupported fields from a draft", () => {
    const sanitized = sanitizeThemeOverrideDraft("eldora-dark", {
      brandPrimaryColor: "#ffffff",
      accentColor: "#111111",
      buttonRadius: 3,
      lightDarkPreference: "dark",
    });
    expect(sanitized.brandPrimaryColor).toBeUndefined();
    expect(sanitized.accentColor).toBe("#111111");
    expect(sanitized.buttonRadius).toBe(3);
  });

  it("normalizes values into the accepted nextjs page-style contract", () => {
    const pageStyle = buildNextJsPageStyleFromDraft("motion-editorial", {
      accentColor: "#ABCDEF",
      typographyScale: 1.4,
      heroMediaUrl: " /hero.jpg ",
    });
    expect(pageStyle.themeOverrides.accentColor).toBe("#abcdef");
    expect(pageStyle.themeOverrides.typographyScale).toBe(1.2);
    expect(pageStyle.themeOverrides.heroMediaUrl).toBe("/hero.jpg");
  });

  it("answers support checks for Builder field gating", () => {
    expect(isThemeOverrideFieldSupported("finwise", "buttonTreatment")).toBe(true);
    expect(isThemeOverrideFieldSupported("eldora-dark", "buttonTreatment")).toBe(false);
    expect(getSupportedThemeOverrideFields("modern-gradient")).toContain("gradientAccent");
  });

  it.each([
    ["Modern Noir", "#111113", "#d2a858", "#f5f1e8", "#1c1c20"],
    ["Blush Spa", "#fff7f8", "#c85d7c", "#4a2331", "#fff0f4"],
    ["Forest Calm", "#f5fbf7", "#4f8b72", "#234437", "#eef8f0"],
    ["Champagne Luxe", "#fffaf2", "#b98a50", "#4f3422", "#fff3df"],
    ["Ocean Clean", "#f4fbff", "#238eb2", "#173c4b", "#eaf8ff"],
  ])("maps the %s Builder palette into Iron Ember semantic fields", (_label, backgroundColor, accent, headingColor, cardColor) => {
    const preset = {
      accent,
      pageStyle: {
        backgroundColor,
        overlayColor: backgroundColor,
        headingColor,
        linkColor: accent,
        cardColor,
        btnBg: accent,
        btnColor: backgroundColor,
        btnRadius: 12,
      },
      header: { bg: backgroundColor, text_color: headingColor },
    };

    const overrides = buildThemeOverridesFromPreset(preset);
    const sanitized = sanitizeThemeOverrideDraft("iron-ember", overrides);

    expect(overrides).toMatchObject({
      pageBackground: backgroundColor,
      accentColor: accent,
      brandPrimaryColor: accent,
      foregroundColor: headingColor,
      cardColor,
      buttonForegroundColor: backgroundColor,
      buttonRadius: 3,
    });
    expect(sanitized).toMatchObject({
      pageBackground: backgroundColor,
      accentColor: accent,
      foregroundColor: headingColor,
      cardColor,
      buttonForegroundColor: backgroundColor,
    });
  });
});
