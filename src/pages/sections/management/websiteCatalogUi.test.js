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
});
