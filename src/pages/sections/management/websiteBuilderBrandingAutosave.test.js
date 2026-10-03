import fs from "fs";
import path from "path";

const builderSource = fs.readFileSync(
  path.join(__dirname, "VisualSiteBuilder.js"),
  "utf8"
);

describe("Visual Site Builder branding autosave safety", () => {
  test("does not autosave page-style defaults before server branding is hydrated", () => {
    expect(builderSource).toContain("const brandingHydratedRef = useRef(false)");
    expect(builderSource).toContain("brandingHydratedRef.current = true");
    expect(builderSource).toContain("if (!brandingHydratedRef.current) return undefined");
  });

  test("normalizes the persisted comparison key after loading server settings", () => {
    expect(builderSource).toContain("sanitizeThemeOverrideDraft(");
    expect(builderSource).toContain("hydratedThemeKey");
  });

  test("autosaves only theme overrides and cannot replace header, footer, or navigation", () => {
    expect(builderSource).toContain("{ themeOverridesOnly: true }");
    expect(builderSource).toContain("themeOverridesOnly\n        ? { theme_overrides: themePayload }");
  });
});
