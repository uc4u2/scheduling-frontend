import {
  executeTemplateInstallAction,
  resolveSelectedContentPack,
} from "./operationsLauncherInstall";

describe("operationsLauncherInstall", () => {
  it("resolves the selected content pack from the catalog seed mapping", () => {
    const catalog = {
      available_content_packs: [
        { key: "spa-medspa-starter", seed_template_key: "enterprise-medspa-elite-pro", version: "1" },
      ],
    };
    expect(resolveSelectedContentPack(catalog, "enterprise-medspa-elite-pro")).toEqual(
      expect.objectContaining({ key: "spa-medspa-starter" })
    );
  });

  it("calls only content-pack install when a selected content pack exists", async () => {
    const websiteApi = {
      installContentPack: jest.fn().mockResolvedValue({ ok: true }),
      importTemplate: jest.fn().mockResolvedValue({ ok: true }),
    };
    await executeTemplateInstallAction({
      companyId: 42,
      selectedTemplateKey: "enterprise-medspa-elite-pro",
      websiteCatalog: {
        available_content_packs: [
          { key: "spa-medspa-starter", seed_template_key: "enterprise-medspa-elite-pro", version: "1" },
        ],
      },
      websiteApi,
    });
    expect(websiteApi.installContentPack).toHaveBeenCalledTimes(1);
    expect(websiteApi.importTemplate).not.toHaveBeenCalled();
  });

  it("falls back to legacy template import when no content pack matches", async () => {
    const websiteApi = {
      installContentPack: jest.fn().mockResolvedValue({ ok: true }),
      importTemplate: jest.fn().mockResolvedValue({ ok: true }),
    };
    await executeTemplateInstallAction({
      companyId: 42,
      selectedTemplateKey: "legacy-template-key",
      websiteCatalog: { available_content_packs: [] },
      websiteApi,
    });
    expect(websiteApi.installContentPack).not.toHaveBeenCalled();
    expect(websiteApi.importTemplate).toHaveBeenCalledTimes(1);
  });
});
