import {
  candidateSemanticFieldPaths,
  createSemanticModule,
  inferPageKind,
  normalizeSemanticFieldPath,
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
    expect(getThemeModuleManifest("iron-ember")).toBeTruthy();
    expect(getThemeModuleManifest("clear-clinic")).toBeTruthy();
    expect(getThemeModuleManifest("harbor-line")).toBeTruthy();
    expect(getThemeModuleManifest("still-bloom")).toBeTruthy();
    expect(getThemeModuleManifest("black-letter")).toBeTruthy();
    expect(getThemeModuleManifest("circuit-north")).toBeTruthy();
  });

  it("infers canonical page kinds from legacy page slugs", () => {
    expect(inferPageKind({ slug: "services-classic" })).toBe("services");
    expect(inferPageKind({ slug: "service-areas" })).toBe("service-areas");
    expect(inferPageKind({ slug: "service-detail-facial" })).toBe("service-detail");
  });

  it("preserves richer semantic media fields when normalizing legacy blocks", () => {
    const [hero, team, gallery, story] = normalizeSemanticModules({
      slug: "home",
      is_homepage: true,
      content: {
        sections: [
          {
            id: "hero-1",
            type: "heroSplit",
            props: {
              heading: "Welcome",
              image: "https://cdn.example.com/hero.jpg",
              imageAlt: "Clinic reception",
              secondaryImages: ["https://cdn.example.com/secondary.jpg"],
            },
          },
          {
            id: "team-1",
            type: "team",
            props: {
              items: [{ name: "Dr. Lee", role: "Founder", image: "https://cdn.example.com/team.jpg", imageAlt: "Dr. Lee portrait" }],
            },
          },
          {
            id: "gallery-1",
            type: "gallery",
            props: {
              images: [{ image: "https://cdn.example.com/gallery.jpg", alt: "Waiting room", caption: "Waiting room" }],
            },
          },
          {
            id: "story-1",
            type: "featureZigzag",
            props: {
              title: "Story",
              image: "https://cdn.example.com/story.jpg",
              secondaryImage: "https://cdn.example.com/story-2.jpg",
            },
          },
        ],
      },
    });

    expect(hero.content.image).toBe("https://cdn.example.com/hero.jpg");
    expect(hero.content.imageAlt).toBe("Clinic reception");
    expect(hero.content.secondaryImages).toEqual(["https://cdn.example.com/secondary.jpg"]);
    expect(team.content.items[0].image).toBe("https://cdn.example.com/team.jpg");
    expect(team.content.items[0].imageAlt).toBe("Dr. Lee portrait");
    expect(gallery.content.items[0].image).toBe("https://cdn.example.com/gallery.jpg");
    expect(gallery.content.items[0].imageAlt).toBe("Waiting room");
    expect(story.content.secondaryImage).toBe("https://cdn.example.com/story-2.jpg");
  });

  it("normalizes canonical and aliased semantic field paths for builder focus", () => {
    expect(normalizeSemanticFieldPath("content.heading")).toBe("heading");
    expect(normalizeSemanticFieldPath("content.items.0.question")).toBe("items.0.title");
    expect(normalizeSemanticFieldPath("content.items.0.answer")).toBe("items.0.body");
    expect(normalizeSemanticFieldPath("content.people.0.name")).toBe("items.0.title");
    expect(normalizeSemanticFieldPath("content.people.0.bio")).toBe("items.0.body");
    expect(normalizeSemanticFieldPath("content.people.0.image")).toBe("items.0.image");
    expect(normalizeSemanticFieldPath("content.primaryCta.label")).toBe("primaryCta.label");
    expect(normalizeSemanticFieldPath("content.image")).toBe("image");
  });

  it("builds candidate field paths for exact and aliased builder controls", () => {
    expect(candidateSemanticFieldPaths("content.heading")).toEqual([
      "heading",
      "content.heading",
    ]);
    expect(candidateSemanticFieldPaths("content.items.0.question")).toEqual(
      expect.arrayContaining([
        "items.0.title",
        "content.items.0.title",
        "content.items.0.question",
        "content.items.0.name",
        "content.people.0.name",
      ]),
    );
    expect(candidateSemanticFieldPaths("content.items.0.answer")).toEqual(
      expect.arrayContaining([
        "items.0.body",
        "content.items.0.body",
        "content.items.0.answer",
        "content.items.0.bio",
        "content.people.0.bio",
      ]),
    );
    expect(candidateSemanticFieldPaths("content.people.0.image")).toEqual(
      expect.arrayContaining([
        "items.0.image",
        "content.items.0.image",
        "content.people.0.image",
      ]),
    );
    expect(candidateSemanticFieldPaths("content.primaryCta.label")).toEqual([
      "primaryCta.label",
      "content.primaryCta.label",
    ]);
  });
});
