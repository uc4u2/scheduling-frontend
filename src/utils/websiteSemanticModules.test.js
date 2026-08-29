import {
  candidateSemanticFieldPaths,
  createIronEmberProjectGalleryModule,
  createSemanticModule,
  inferPageKind,
  isWebsiteVideoReference,
  normalizeSemanticModuleMediaReferences,
  normalizeSemanticFieldPath,
  normalizeSemanticModules,
  sanitizeNextJsEditableText,
  upgradeLegacyIronEmberProjectGallery,
} from "./websiteSemanticModules";
import { createIronEmberOriginalHomeModules } from "./ironEmberHomeBlueprint";
import { createClearClinicOriginalHomeModules } from "./clearClinicHomeBlueprint";
import { createStillBloomOriginalHomeModules } from "./stillBloomHomeBlueprint";
import { getProfessionHomeBlueprint, getProfessionHomeBlueprintKeys } from "./professionHomeBlueprints";
import { normalizeFooterConfig } from "./headerFooter";
import { getCompatibleSlots } from "./websiteThemeModules";
import {
  getCompatibleModuleChoices,
  getThemeModuleDisplayLabel,
  getThemeModuleManifest,
  resolveFallbackSlot,
} from "./websiteThemeModules";

describe("website semantic modules", () => {
  it("preserves the independent footer page-navigation visibility setting", () => {
    expect(normalizeFooterConfig({ show_navigation: false }).show_navigation).toBe(false);
    expect(normalizeFooterConfig({}).show_navigation).toBe(true);
  });
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

  it("seeds Iron Ember Projects with six barber-specific editable gallery items", () => {
    const module = createIronEmberProjectGalleryModule({ slug: "gallery", title: "Gallery" });
    expect(module.type).toBe("gallery");
    expect(module.slot).toBe("projects.primaryContent");
    expect(module.content.items).toHaveLength(6);
    expect(new Set(module.content.items.map((item) => item.imageUrl)).size).toBe(6);
    expect(module.content.items.every((item) => item.imageAlt && item.caption)).toBe(true);
  });

  it("upgrades only the untouched legacy events gallery used by Iron Ember Projects", () => {
    const legacyPage = {
      slug: "gallery",
      content: {
        modules: [
          {
            id: "events-gallery",
            type: "gallery",
            enabled: true,
            slot: "projects.primaryContent",
            content: {
              items: [1, 2, 3, 4, 5, 6].map((index) => ({
                image: `/website/enterprise-events-aurora/carousel-0${index}.jpg`,
                imageUrl: `/website/enterprise-events-aurora/carousel-0${index}.jpg`,
              })),
            },
          },
        ],
      },
    };
    const upgraded = upgradeLegacyIronEmberProjectGallery(legacyPage);
    expect(upgraded).not.toBe(legacyPage);
    expect(upgraded.content.modules[0].content.items).toHaveLength(6);
    expect(upgraded.content.modules[0].content.items[0].title).toBe("Studio Ritual");

    const authored = {
      ...legacyPage,
      content: {
        modules: [{ ...legacyPage.content.modules[0], content: { items: [{ image: "https://example.com/authored.jpg", imageUrl: "https://example.com/authored.jpg" }] } }],
      },
    };
    expect(upgradeLegacyIronEmberProjectGallery(authored)).toBe(authored);
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
    expect(inferPageKind({ slug: "projects-gallery" })).toBe("projects");
    expect(inferPageKind({ slug: "service-areas" })).toBe("service-areas");
    expect(inferPageKind({ slug: "service-detail-facial" })).toBe("service-detail");
    expect(inferPageKind({ slug: "products" })).toBe("products");
    expect(inferPageKind({ slug: "products-classic" })).toBe("products");
    expect(inferPageKind({ slug: "product-detail" })).toBe("product-detail");
    expect(inferPageKind({ slug: "jobs" })).toBe("jobs");
    expect(inferPageKind({ slug: "job-detail" })).toBe("job-detail");
    expect(inferPageKind({ slug: "blog" })).toBe("blog");
  });

  it("keeps Classic public iframe markup out of a newly editable Next hero", () => {
    expect(sanitizeNextJsEditableText('<iframe src="/{{slug}}/products?embed=1&mode=modal"></iframe>')).toBe("");
    expect(sanitizeNextJsEditableText("Browse the current product collection.")).toBe("Browse the current product collection.");
  });

  it("gives Iron Ember's canonical Journal page an explicit Builder module manifest", () => {
    const slots = getCompatibleSlots("iron-ember", "blog");
    expect(slots["blog.primaryContent"].allowedModuleTypes).toContain("richText");
    expect(slots["blog.finalCta"].allowedModuleTypes).toContain("cta");
  });

  it("offers an Iron Ember-only Selected Cuts module with eight editable canonical defaults", () => {
    const ironChoices = getCompatibleModuleChoices("iron-ember", "home", []);
    const otherChoices = getCompatibleModuleChoices("modern-gradient", "home", []);
    expect(ironChoices).toEqual(expect.arrayContaining([expect.objectContaining({ type: "selectedCuts", slot: "home.selectedCuts", label: "Selected Cuts" })]));
    expect(otherChoices.some((choice) => choice.type === "selectedCuts")).toBe(false);

    const module = createSemanticModule("selectedCuts", { slug: "home", is_homepage: true });
    expect(module.slot).toBe("home.selectedCuts");
    expect(module.content.items).toHaveLength(8);
    expect(new Set(module.content.items.map((item) => item.image))).toHaveProperty("size", 8);
    module.content.items.forEach((item) => {
      expect(item).toEqual(expect.objectContaining({ title: expect.any(String), category: expect.any(String), imageAlt: expect.any(String) }));
    });
  });

  it("provides the complete original Iron Ember homepage as canonical editable modules", () => {
    const modules = createIronEmberOriginalHomeModules();
    const selectedCuts = modules.find((module) => module.type === "selectedCuts");
    const craftStory = modules.find((module) => module.type === "featureStory");
    const hero = modules.find((module) => module.type === "hero");

    expect(modules.map((module) => module.type)).toEqual([
      "hero", "stats", "services", "richText", "team", "featureStory",
      "selectedCuts", "richText", "gallery", "process", "reviews", "faq",
      "contactIntro", "contactDetails", "hoursLocation", "map",
    ]);
    expect(new Set(modules.map((module) => module.id)).size).toBe(modules.length);
    expect(selectedCuts.content.items).toHaveLength(8);
    expect(new Set(selectedCuts.content.items.map((item) => item.image)).size).toBe(8);
    expect(craftStory.content.items).toHaveLength(3);
    expect(hero.content.signaturePanelEnabled).toBe(true);
    expect(hero.content.signaturePanelServiceLimit).toBe(4);
    expect(hero.content.signaturePanelEyebrow).toBe("Signature services");
    modules.forEach((module, index) => expect(module.order).toBe(index));

    const second = createIronEmberOriginalHomeModules();
    second[0].content.heading = "Changed in one draft";
    expect(modules[0].content.heading).toBe("Cut With Character.");
  });

  it("provides the complete source-native Clear Clinic homepage as canonical editable modules", () => {
    const modules = createClearClinicOriginalHomeModules();
    expect(modules.map((module) => module.type)).toEqual([
      "hero", "trustRail", "services", "team", "process", "featureStory",
      "reviews", "serviceAreas", "faq", "contactIntro", "contactDetails",
      "hoursLocation", "map", "contactForm", "bookingCta",
    ]);
    expect(new Set(modules.map((module) => module.id)).size).toBe(modules.length);
    expect(modules.find((module) => module.type === "featureStory").content.items).toHaveLength(3);
    expect(modules.find((module) => module.type === "hero").content.secondaryImages).toHaveLength(1);
    expect(modules.find((module) => module.type === "services").content.source).toBe("operational");
    expect(modules.find((module) => module.type === "reviews").content.source).toBe("operational");
    modules.forEach((module, index) => expect(module.order).toBe(index));
    expect(modules.every((module) => module.settings.starterBlueprint === "clear-clinic-original")).toBe(true);
  });

  it("resolves source-faithful profession homepage blueprints without affecting legacy templates", () => {
    expect(getProfessionHomeBlueprintKeys()).toEqual(expect.arrayContaining(["iron-ember", "clear-clinic", "still-bloom"]));
    expect(getProfessionHomeBlueprint("clear-clinic")).toEqual(expect.objectContaining({ label: "Clear Clinic", createModules: expect.any(Function) }));
    expect(getProfessionHomeBlueprint("classic")).toBeNull();
    expect(getProfessionHomeBlueprint("")).toBeNull();
  });

  it("provides Still Bloom's complete editable studio rhythm", () => {
    const modules = createStillBloomOriginalHomeModules();
    expect(modules.map((module) => module.type)).toEqual([
      "hero", "richText", "services", "hoursLocation", "featureStory", "team",
      "pricing", "reviews", "faq", "contactIntro", "contactDetails", "map",
      "contactForm", "bookingCta",
    ]);
    expect(new Set(modules.map((module) => module.id)).size).toBe(modules.length);
    expect(modules.find((module) => module.id === "bloom-home-hero").content.secondaryImages).toHaveLength(2);
    expect(modules.find((module) => module.id === "bloom-home-schedule").content.items).toHaveLength(5);
    expect(modules.find((module) => module.id === "bloom-home-movement-story").content.items).toHaveLength(3);
    expect(modules.every((module) => module.settings.starterBlueprint === "still-bloom-original")).toBe(true);
  });

  it("keeps legacy JSON stored but out of a complete Next starter blueprint", () => {
    const modules = createIronEmberOriginalHomeModules();
    const normalized = normalizeSemanticModules({
      slug: "home",
      is_homepage: true,
      content: {
        modules,
        sections: [
          { id: "legacy-pricing", type: "pricingTable", props: { heading: "Event packages" } },
          { id: "legacy-team", type: "teamGrid", props: { heading: "Event team" } },
        ],
      },
    });

    expect(normalized).toHaveLength(16);
    expect(normalized.some((module) => module.id === "legacy-pricing")).toBe(false);
    expect(normalized.some((module) => module.id === "legacy-team")).toBe(false);
  });

  it("gives Iron Ember Products and Jobs editable intro slots", () => {
    const productSlots = getCompatibleSlots("iron-ember", "products");
    const jobSlots = getCompatibleSlots("iron-ember", "jobs");
    expect(productSlots["products.intro"].allowedModuleTypes).toContain("richText");
    expect(jobSlots["jobs.intro"].allowedModuleTypes).toContain("richText");
    expect(createSemanticModule("richText", { slug: "products" }).slot).toBe("products.intro");
    expect(createSemanticModule("richText", { slug: "jobs" }).slot).toBe("jobs.intro");
  });

  it("declares a dedicated editable upper-section slot across Iron Ember listing pages", () => {
    for (const [pageKind, slot] of [
      ["about", "about.intro"],
      ["services", "services.intro"],
      ["products", "products.intro"],
      ["projects", "projects.intro"],
      ["reviews", "reviews.intro"],
      ["contact", "contact.intro"],
      ["jobs", "jobs.intro"],
      ["blog", "blog.intro"],
      ["service-areas", "service-areas.intro"],
      ["faq", "faq.intro"],
      ["legal", "legal.intro"],
      ["generic", "generic.intro"],
    ]) {
      const slots = getCompatibleSlots("iron-ember", pageKind);
      expect(slots[slot]?.allowedModuleTypes).toEqual(expect.arrayContaining(["hero"]));
    }
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

  it("recognizes only the existing MP4/WebM WebsiteMedia video contract", () => {
    expect(isWebsiteVideoReference("/api/website/media/file/7/hero.mp4?cache=1")).toBe(true);
    expect(isWebsiteVideoReference({ url: "/api/website/media/file/7/rail.webm", file_type: "file" })).toBe(true);
    expect(isWebsiteVideoReference({ url: "/opaque/media", file_type: "video/mp4" })).toBe(true);
    expect(isWebsiteVideoReference("/api/website/media/file/7/hero.webp")).toBe(false);
    expect(isWebsiteVideoReference("/api/website/media/file/7/unsupported.mov")).toBe(false);
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
