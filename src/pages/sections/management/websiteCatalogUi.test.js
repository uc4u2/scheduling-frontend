import {
  buildWebsiteStyleChoices,
  buildWebsiteStylePreviewPages,
  encodePreviewPathToken,
  shouldProvisionNextPublicBuilderPages,
} from "./websiteCatalogUi";

describe("website catalog UI helpers", () => {
  it("makes dot-prefixed preview tokens safe for Next path segments", () => {
    const token = ".signed.preview-token";
    expect(encodePreviewPathToken(token)).toBe("t-.signed.preview-token");
  });

  it("does not expose deprecated experimental families in the normal builder style chooser", () => {
    const keys = buildWebsiteStyleChoices().map((item) => item.key);
    expect(keys).not.toContain("industrial-blueprint");
    expect(keys).not.toContain("hvac-cinematic-dark");
    expect(keys).not.toContain("hvac-clean-corporate");
    expect(keys).not.toContain("hvac-bold-dispatch");
    expect(keys).not.toContain("hvac-home-comfort-modern");
  });

  it("shows all tenant-selectable nextjs themes for compatible companies", () => {
    const keys = buildWebsiteStyleChoices({
      catalog: {
        compatible_visual_themes: [
          { key: "classic", renderer_engine: "legacy-react", status: "production" },
          { key: "modern-gradient", renderer_engine: "nextjs", status: "beta", label: "Modern Gradient" },
          { key: "eldora-dark", renderer_engine: "nextjs", status: "beta", label: "Eldora Dark" },
          { key: "motion-editorial", renderer_engine: "nextjs", status: "beta", label: "Motion Editorial" },
          { key: "finwise", renderer_engine: "nextjs", status: "beta", label: "Finwise" },
          { key: "iron-ember", renderer_engine: "nextjs", status: "beta", label: "Iron Ember" },
          { key: "clear-clinic", renderer_engine: "nextjs", status: "beta", label: "Clear Clinic" },
          { key: "harbor-line", renderer_engine: "nextjs", status: "beta", label: "Harbor Line" },
          { key: "still-bloom", renderer_engine: "nextjs", status: "beta", label: "Still Bloom" },
          { key: "black-letter", renderer_engine: "nextjs", status: "beta", label: "Black Letter" },
          { key: "circuit-north", renderer_engine: "nextjs", status: "beta", label: "Circuit North" },
          { key: "solara-stay", renderer_engine: "nextjs", status: "beta", label: "Solara Stay" },
          { key: "paw-and-pine", renderer_engine: "nextjs", status: "beta", label: "Paw & Pine" },
          { key: "quiet-harbor", renderer_engine: "nextjs", status: "beta", label: "Quiet Harbor" },
          { key: "frame-and-field", renderer_engine: "nextjs", status: "beta", label: "Frame & Field" },
          { key: "fieldcraft", renderer_engine: "nextjs", status: "beta", label: "Fieldcraft" },
        ],
      },
    }).map((item) => item.key);
    expect(keys).toEqual(["classic", "modern-gradient", "eldora-dark", "motion-editorial", "finwise", "iron-ember", "clear-clinic", "harbor-line", "still-bloom", "black-letter", "circuit-north", "solara-stay", "paw-and-pine", "quiet-harbor", "frame-and-field", "fieldcraft"]);
  });

  it("hydrates preview thumbnails and beta badges for registered nextjs themes", () => {
    const choices = buildWebsiteStyleChoices({
      catalog: {
        compatible_visual_themes: [
          {
            key: "finwise",
            renderer_engine: "nextjs",
            status: "beta",
            label: "Finwise",
            preview_assets: {
              desktop: "/theme-previews/finwise-desktop.png",
              mobile: "/theme-previews/finwise-mobile.png",
            },
          },
        ],
      },
    });
    expect(choices.map((item) => item.key)).toContain("finwise");
    expect(choices.find((item) => item.key === "finwise")?.badgeLabel).toBe("Beta");
    expect(choices.find((item) => item.key === "finwise")?.previewAssets?.card).toMatch(/finwise-card\.webp$/);
    expect(choices.find((item) => item.key === "finwise")?.previewAssets?.desktop).toMatch(/finwise-desktop\.png$/);
  });

  it("preserves optimized card previews independently from full device screenshots", () => {
    const choices = buildWebsiteStyleChoices({
      catalog: {
        compatible_visual_themes: [
          {
            key: "finwise",
            renderer_engine: "nextjs",
            status: "production",
            label: "Finwise",
            preview_assets: {
              card: "/theme-previews/finwise-card.webp",
              desktop: "/theme-previews/finwise-desktop.png",
              mobile: "/theme-previews/finwise-mobile.png",
            },
          },
        ],
      },
    });

    expect(choices.find((item) => item.key === "finwise")?.previewAssets).toEqual({
      card: "/theme-previews/finwise-card.webp",
      desktop: "/theme-previews/finwise-desktop.png",
      mobile: "/theme-previews/finwise-mobile.png",
    });
  });

  it("builds safe live-preview navigation without detail routes that require record slugs", () => {
    expect(
      buildWebsiteStylePreviewPages([
        "home",
        "about",
        "services",
        "service-detail",
        "gallery",
        "products",
        "product-detail",
        "contact",
      ])
    ).toEqual([
      { key: "home", label: "Home", path: [] },
      { key: "about", label: "About", path: ["about"] },
      { key: "services", label: "Services", path: ["services"] },
      { key: "contact", label: "Contact", path: ["contact"] },
      { key: "gallery", label: "Gallery / Work", path: ["projects"] },
      { key: "products", label: "Products", path: ["products"] },
    ]);
  });

  it("provisions backend-driven directory pages for every selected Next theme", () => {
    expect(shouldProvisionNextPublicBuilderPages("iron-ember")).toBe(true);
    expect(shouldProvisionNextPublicBuilderPages("modern-gradient")).toBe(true);
    expect(shouldProvisionNextPublicBuilderPages("forge-motion")).toBe(true);
    expect(shouldProvisionNextPublicBuilderPages("")).toBe(false);
  });

  it("preserves recommendation metadata for builder grouping", () => {
    const choices = buildWebsiteStyleChoices({
      catalog: {
        compatible_visual_themes: [
          {
            key: "clear-clinic",
            renderer_engine: "nextjs",
            status: "beta",
            label: "Clear Clinic",
            recommended_for_profession: true,
            recommended_professions: ["dental", "medical_clinic"],
            design_tags: ["clinical", "clean"],
          },
        ],
      },
    });
    expect(choices.find((item) => item.key === "clear-clinic")?.recommended).toBe(true);
    expect(choices.find((item) => item.key === "clear-clinic")?.recommendedProfessions).toContain("dental");
    expect(choices.find((item) => item.key === "clear-clinic")?.designTags).toContain("clinical");
  });

  it("preserves Batch 2 recommendation metadata and preview assets", () => {
    const choices = buildWebsiteStyleChoices({
      catalog: {
        compatible_visual_themes: [
          {
            key: "still-bloom",
            renderer_engine: "nextjs",
            status: "beta",
            label: "Still Bloom",
            recommended_for_profession: true,
            recommended_professions: ["yoga_pilates", "wellness"],
            design_tags: ["soft", "wellness"],
            preview_assets: {
              desktop: "/theme-previews/still-bloom-desktop.svg",
              mobile: "/theme-previews/still-bloom-mobile.svg",
            },
          },
        ],
      },
    });
    expect(choices.find((item) => item.key === "still-bloom")?.recommended).toBe(true);
    expect(choices.find((item) => item.key === "still-bloom")?.recommendedProfessions).toContain("yoga_pilates");
    expect(choices.find((item) => item.key === "still-bloom")?.previewAssets?.desktop).toMatch(/still-bloom-desktop\.svg$/);
  });

  it("preserves approved source mapping and readiness metadata for the builder cards", () => {
    const choices = buildWebsiteStyleChoices({
      catalog: {
        compatible_visual_themes: [
          {
            key: "iron-ember",
            renderer_engine: "nextjs",
            status: "beta",
            label: "Iron Ember",
            recommended_for_profession: true,
            recommended_professions: ["barbershop"],
            recommended_profession_labels: ["Barbershop"],
            design_tags: ["dark", "craft"],
            source_family: "profession-next-template-lab",
            starter_media_policy: "source-fixture-to-tenant-website-media",
            supported_pages: ["home", "about", "services", "contact", "gallery"],
            supported_semantic_modules: ["hero", "featureStory", "gallery"],
            starter_content_pack_key: "barbershop-starter",
            readiness: {
              source_exists: true,
              integrated: true,
              catalog_visible: true,
              builder_editable: true,
              preview_ready: true,
            },
            preview_assets: {
              desktop: "/theme-previews/iron-ember-desktop.png",
              mobile: "/theme-previews/iron-ember-mobile.png",
            },
          },
        ],
      },
    });
    const ironEmber = choices.find((item) => item.key === "iron-ember");
    expect(ironEmber?.recommendedProfessionLabels).toContain("Barbershop");
    expect(ironEmber?.sourceFamily).toBe("profession-next-template-lab");
    expect(ironEmber?.starterMediaPolicy).toBe("source-fixture-to-tenant-website-media");
    expect(ironEmber?.supportedPages).toContain("gallery");
    expect(ironEmber?.supportedSemanticModules).toContain("featureStory");
    expect(ironEmber?.readiness?.builder_editable).toBe(true);
    expect(ironEmber?.starterContentPackKey).toBe("barbershop-starter");
    expect(ironEmber?.previewAssets?.desktop).toMatch(/iron-ember-desktop\.png$/);
  });
});
