import {
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
});
