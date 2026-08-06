jest.mock(
  "react-router-dom",
  () => ({
    Link: "a",
  }),
  { virtual: true }
);

import { loadWebsiteFamilyModule } from "../manifest";

describe("industrial blueprint family module", () => {
  it("lazy-loads the industrial blueprint family module", async () => {
    const mod = await loadWebsiteFamilyModule("industrial-blueprint");
    expect(mod).toBeTruthy();
    expect(mod.family).toBe("industrial-blueprint");
    expect(mod.familyVersion).toBe(1);
    expect(mod.roleRenderers["hero.primary"]).toBeTruthy();
    expect(mod.roleRenderers["services.grid"]).toBeTruthy();
    expect(mod.roleRenderers["social_proof.testimonials"]).toBeTruthy();
    expect(mod.roleRenderers["cta.inline"]).toBeTruthy();
    expect(mod.typeRenderers.industrialTrustMarquee).toBeTruthy();
    expect(mod.typeRenderers.industrialServiceSelector).toBeTruthy();
    expect(mod.typeRenderers.industrialProjectShowcase).toBeTruthy();
    expect(mod.typeRenderers.industrialMembershipPlans).toBeTruthy();
    expect(mod.shell.HeaderComponent).toBeTruthy();
    expect(mod.shell.FooterComponent).toBeTruthy();
  });

  it("does not lazy-load a module for classic", async () => {
    const mod = await loadWebsiteFamilyModule("classic");
    expect(mod).toBeNull();
  });
});
