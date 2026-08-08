import {
  createSemanticModule,
  inferPageKind,
  normalizeSemanticModules,
} from "./websiteSemanticModules";
import {
  getCompatibleModuleChoices,
  getThemeModuleManifest,
  resolveFallbackSlot,
} from "./websiteThemeModules";

describe("website semantic modules", () => {
  it("normalizes legacy sections into semantic modules", () => {
    const modules = normalizeSemanticModules({
      slug: "home",
      is_homepage: true,
      content: {
        sections: [
          { id: "hero-1", type: "heroSplit", props: { heading: "Welcome" } },
          { id: "faq-1", type: "faq", props: { items: [{ question: "Q", answer: "A" }] } },
        ],
      },
    });
    expect(modules.map((module) => module.type)).toEqual(expect.arrayContaining(["hero", "faq"]));
  });

  it("creates semantic modules with deterministic default slots", () => {
    const page = { slug: "contact", is_homepage: false };
    const module = createSemanticModule("map", page);
    expect(module.slot).toBe("contact.map");
  });

  it("returns theme-compatible Add Section choices for a Next.js theme", () => {
    const choices = getCompatibleModuleChoices("modern-gradient", "home", []);
    expect(choices.some((choice) => choice.type === "gallery")).toBe(true);
    expect(choices.some((choice) => choice.type === "map")).toBe(true);
    expect(choices.some((choice) => choice.type === "featureStory")).toBe(true);
    expect(choices.some((choice) => choice.group === "BUSINESS")).toBe(true);
  });

  it("resolves fallback slots when a module is moved across theme/page slot contracts", () => {
    expect(resolveFallbackSlot("modern-gradient", "services", "faq", "services.afterList")).toBe("services.afterList");
    expect(resolveFallbackSlot("modern-gradient", "services", "faq", "home.afterServices")).toBe("services.afterList");
  });

  it("exposes manifests for all four live Next.js themes", () => {
    expect(getThemeModuleManifest("modern-gradient")).toBeTruthy();
    expect(getThemeModuleManifest("eldora-dark")).toBeTruthy();
    expect(getThemeModuleManifest("motion-editorial")).toBeTruthy();
    expect(getThemeModuleManifest("finwise")).toBeTruthy();
  });

  it("infers canonical page kinds from legacy page slugs", () => {
    expect(inferPageKind({ slug: "services-classic" })).toBe("services");
    expect(inferPageKind({ slug: "service-areas" })).toBe("service-areas");
    expect(inferPageKind({ slug: "service-detail-facial" })).toBe("service-detail");
  });
});
