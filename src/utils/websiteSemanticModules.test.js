import {
  candidateSemanticFieldPaths,
  createSemanticModule,
  inferPageKind,
  normalizeSemanticModuleMediaReferences,
  normalizeSemanticFieldPath,
  normalizeSemanticModules,
} from "./websiteSemanticModules";
import { getCompatibleSlots } from "./websiteThemeModules";
import {
  getCompatibleModuleChoices,
  getThemeModuleDisplayLabel,
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

  it("exposes manifests for all integrated Next.js themes", () => {
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
    expect(getThemeModuleManifest("solara-stay")).toBeTruthy();
    expect(getThemeModuleManifest("paw-and-pine")).toBeTruthy();
    expect(getThemeModuleManifest("quiet-harbor")).toBeTruthy();
    expect(getThemeModuleManifest("frame-and-field")).toBeTruthy();
    expect(getThemeModuleManifest("fieldcraft")).toBeTruthy();
  });

  it("infers canonical page kinds from legacy page slugs", () => {
    expect(inferPageKind({ slug: "services-classic" })).toBe("services");
    expect(inferPageKind({ slug: "service-areas" })).toBe("service-areas");
    expect(inferPageKind({ slug: "service-detail-facial" })).toBe("service-detail");
    expect(inferPageKind({ slug: "products" })).toBe("products");
    expect(inferPageKind({ slug: "products-classic" })).toBe("products");
    expect(inferPageKind({ slug: "product-detail" })).toBe("product-detail");
    expect(inferPageKind({ slug: "jobs" })).toBe("jobs");
    expect(inferPageKind({ slug: "job-detail" })).toBe("job-detail");
    expect(inferPageKind({ slug: "blog" })).toBe("blog");
  });

  it("gives Iron Ember's canonical Journal page an explicit Builder module manifest", () => {
    const slots = getCompatibleSlots("iron-ember", "blog");
    expect(slots["blog.primaryContent"].allowedModuleTypes).toContain("richText");
    expect(slots["blog.finalCta"].allowedModuleTypes).toContain("cta");
  });

  it("gives Iron Ember Products and Jobs editable intro slots", () => {
    const productSlots = getCompatibleSlots("iron-ember", "products");
    const jobSlots = getCompatibleSlots("iron-ember", "jobs");
    expect(productSlots["products.intro"].allowedModuleTypes).toContain("richText");
    expect(jobSlots["jobs.intro"].allowedModuleTypes).toContain("richText");
    expect(createSemanticModule("richText", { slug: "products" }).slot).toBe("products.intro");
    expect(createSemanticModule("richText", { slug: "jobs" }).slot).toBe("jobs.intro");
  });

  it("uses Iron Ember Contact page labels without changing its shared semantic slots", () => {
    expect(getThemeModuleDisplayLabel("iron-ember", "contactDetails", "contact.details")).toBe("Studio Details");
    expect(getThemeModuleDisplayLabel("iron-ember", "hoursLocation", "contact.hours")).toBe("Studio Hours");
    expect(getThemeModuleDisplayLabel("iron-ember", "map", "contact.map")).toBe("Studio Map");
    expect(getThemeModuleDisplayLabel("iron-ember", "contactForm", "contact.form")).toBe("Contact Form");
    expect(getThemeModuleDisplayLabel("modern-gradient", "map", "contact.map")).toBe("Map");
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

  it("normalizes legacy collection and video story content into existing semantic schemas", () => {
    const modules = normalizeSemanticModules({
      slug: "home",
      is_homepage: true,
      content: {
        sections: [
          { id: "collection", type: "collectionShowcase", props: { title: "Work", items: [{ title: "Project", image: "https://cdn.example.com/project.jpg" }] } },
          { id: "video", type: "videoStorySplit", props: { title: "Watch", videoUrl: "https://video.example/embed", poster: "https://cdn.example.com/poster.jpg" } },
        ],
      },
    });
    const portfolio = modules.find((module) => module.type === "portfolio");
    const video = modules.find((module) => module.type === "video");
    expect(portfolio.content.items[0].image).toBe("https://cdn.example.com/project.jpg");
    expect(video.content.videoUrl).toBe("https://video.example/embed");
    expect(video.content.posterUrl).toBe("https://cdn.example.com/poster.jpg");
  });

  it("preserves legacy editorial-review entries as page-owned testimonial content", () => {
    const modules = normalizeSemanticModules({
      slug: "reviews",
      content: {
        sections: [{
          id: "reviews-grid",
          type: "reviewEditorialGrid",
          props: {
            title: "What clients are saying",
            subtitle: "Recent client feedback",
            reviewCountLabel: "Rated 5 stars by recent clients",
            platformLabel: "Client reviews",
            buttonText: "Read more reviews",
            buttonLink: "/reviews",
            entries: [{
              name: "Alyssa M.",
              badge: "Verified client",
              text: "A thoughtful and well managed experience.",
              image: "https://cdn.example.com/review.jpg",
              imageAlt: "Review image",
            }],
          },
        }],
      },
    });
    const reviews = modules.find((module) => module.type === "reviews");
    expect(reviews.content.items).toHaveLength(1);
    expect(reviews.content.items[0]).toMatchObject({
      title: "Alyssa M.",
      body: "A thoughtful and well managed experience.",
      badge: "Verified client",
      image: "https://cdn.example.com/review.jpg",
    });
    expect(reviews.content).toMatchObject({
      reviewCountLabel: "Rated 5 stars by recent clients",
      platformLabel: "Client reviews",
      primaryCta: { label: "Read more reviews", href: "/reviews" },
    });
  });

  it("normalizes canonical and aliased semantic field paths for builder focus", () => {
    expect(normalizeSemanticFieldPath("content.heading")).toBe("heading");
    expect(normalizeSemanticFieldPath("content.items.0.question")).toBe("items.0.question");
    expect(normalizeSemanticFieldPath("content.items.0.answer")).toBe("items.0.answer");
    expect(normalizeSemanticFieldPath("content.people.0.name")).toBe("items.0.name");
    expect(normalizeSemanticFieldPath("content.people.0.bio")).toBe("items.0.bio");
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
        "items.0.question",
        "content.items.0.question",
        "content.items.0.title",
        "content.items.0.question",
        "content.items.0.name",
        "content.people.0.name",
      ]),
    );
    expect(candidateSemanticFieldPaths("content.items.0.answer")).toEqual(
      expect.arrayContaining([
        "items.0.answer",
        "content.items.0.answer",
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

  it("stores WebsiteMedia file URLs as portable canonical references without changing external URLs", () => {
    const modules = normalizeSemanticModuleMediaReferences([
      {
        type: "hero",
        content: {
          image: "http://127.0.0.1:5000/api/website/media/file/8/hero.webp?variant=1200",
          secondaryImage: "https://images.example.com/story.jpg",
          items: [{ image: "https://api.example.test/api/website/media/file/8/team.webp" }],
        },
      },
    ]);

    expect(modules[0].content.image).toBe("/api/website/media/file/8/hero.webp?variant=1200");
    expect(modules[0].content.secondaryImage).toBe("https://images.example.com/story.jpg");
    expect(modules[0].content.items[0].image).toBe("/api/website/media/file/8/team.webp");
  });

  it("repairs malformed WebsiteMedia URLs that still include company/website-media path segments", () => {
    const modules = normalizeSemanticModuleMediaReferences([
      {
        type: "hero",
        content: {
          image: "http://127.0.0.1:5000/api/website/media/file/7/company/7/website-media/1786832726_download.png",
          secondaryImages: [
            "/api/website/media/file/7/company/7/website-media/1786853226_download.png",
          ],
        },
      },
    ]);

    expect(modules[0].content.image).toBe("/api/website/media/file/7/1786832726_download.png");
    expect(modules[0].content.secondaryImages).toEqual([
      "/api/website/media/file/7/1786853226_download.png",
    ]);
  });
});
