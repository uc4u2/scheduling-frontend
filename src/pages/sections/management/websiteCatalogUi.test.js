import { buildWebsiteStyleChoices } from "./websiteCatalogUi";

describe("website catalog UI helpers", () => {
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
        ],
      },
    }).map((item) => item.key);
    expect(keys).toEqual(["classic", "modern-gradient", "eldora-dark", "motion-editorial", "finwise", "iron-ember", "clear-clinic", "harbor-line"]);
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
    expect(choices.find((item) => item.key === "finwise")?.previewAssets?.desktop).toMatch(/finwise-desktop\.png$/);
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
});
