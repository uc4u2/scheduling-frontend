import {
  buildThemeOverridesFromPreset,
  buildNextJsPageStyleFromDraft,
  getSupportedThemeOverrideFields,
  getThemeOverrideContract,
  isThemeOverrideFieldSupported,
  NEXTJS_PAGE_STYLE_BASE_FIELDS,
  NEXTJS_PAGE_STYLE_PRESET_KEYS,
  resolveNextJsPageStyleCapabilities,
  sanitizeThemeOverrideDraft,
} from "./websiteThemeOverrides";

describe("website theme overrides", () => {
  const registeredNextThemeKeys = [
    "modern-gradient",
    "eldora-dark",
    "motion-editorial",
    "finwise",
    "iron-ember",
    "clear-clinic",
    "harbor-line",
    "still-bloom",
    "black-letter",
    "circuit-north",
    "solara-stay",
    "paw-and-pine",
    "quiet-harbor",
    "frame-and-field",
    "fieldcraft",
    "lumea-clinic",
    "northstar-health",
    "axis-and-co",
    "torque-house",
    "velora-house",
    "forge-motion",
  ];

  it.each(registeredNextThemeKeys)("exposes the base palette and preset gallery for %s", (themeKey) => {
    const capability = resolveNextJsPageStyleCapabilities({
      rendererEngine: "nextjs",
      visualThemeKey: themeKey,
    });

    expect(getThemeOverrideContract(themeKey)).toBeTruthy();
    expect(capability).toBeTruthy();
    expect(capability.supportedFields).toEqual(expect.arrayContaining(NEXTJS_PAGE_STYLE_BASE_FIELDS));
    expect(capability.presetKeys).toEqual(NEXTJS_PAGE_STYLE_PRESET_KEYS);
  });

  it("filters unsupported fields from a draft", () => {
    const sanitized = sanitizeThemeOverrideDraft("eldora-dark", {
      brandPrimaryColor: "#ffffff",
      accentColor: "#111111",
      buttonRadius: 3,
      lightDarkPreference: "dark",
      gradientAccent: true,
    });
    expect(sanitized.brandPrimaryColor).toBe("#ffffff");
    expect(sanitized.accentColor).toBe("#111111");
    expect(sanitized.buttonRadius).toBe(3);
    expect(sanitized.gradientAccent).toBeUndefined();
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
    expect(isThemeOverrideFieldSupported("eldora-dark", "buttonTreatment")).toBe(true);
    expect(getSupportedThemeOverrideFields("modern-gradient")).toContain("gradientAccent");
  });

  it("keeps special fields theme-specific", () => {
    expect(isThemeOverrideFieldSupported("modern-gradient", "gradientAccent")).toBe(true);
    expect(isThemeOverrideFieldSupported("iron-ember", "gradientAccent")).toBe(false);
    expect(isThemeOverrideFieldSupported("motion-editorial", "typographyScale")).toBe(true);
    expect(isThemeOverrideFieldSupported("still-bloom", "typographyScale")).toBe(true);
    expect(isThemeOverrideFieldSupported("eldora-dark", "typographyScale")).toBe(false);
  });

  it("does not route legacy JSON templates through the Next Page Style catalog", () => {
    expect(resolveNextJsPageStyleCapabilities({
      rendererEngine: "legacy-react",
      visualThemeKey: "iron-ember",
    })).toBeNull();
    expect(resolveNextJsPageStyleCapabilities({
      rendererEngine: "nextjs",
      visualThemeKey: "unknown-json-template",
    })).toBeNull();
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

  it("stores the selected Next preset identity inside the existing theme_overrides contract", () => {
    const overrides = buildThemeOverridesFromPreset({
      key: "blush-spa",
      pageStyle: { backgroundColor: "#fff7f8" },
    });

    expect(sanitizeThemeOverrideDraft("clear-clinic", overrides)).toMatchObject({
      themePresetKey: "blush-spa",
      pageBackground: "#fff7f8",
    });
    expect(sanitizeThemeOverrideDraft("clear-clinic", {
      ...overrides,
      themePresetKey: "unsupported-preset",
    }).themePresetKey).toBeUndefined();
  });
});
