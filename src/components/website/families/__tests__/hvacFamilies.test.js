jest.mock(
  "react-router-dom",
  () => ({
    Link: "a",
  }),
  { virtual: true }
);

jest.mock("../../ContactFormSection", () => () => null);

import { loadWebsiteFamilyModule } from "../manifest";
import {
  getHeroData,
  getServiceCards,
  getTestimonials,
} from "../hvac-shared/canonicalHvacAdapter";

describe("hvac family modules", () => {
  it("lazy-loads the cinematic family module", async () => {
    const mod = await loadWebsiteFamilyModule("hvac-cinematic-dark");
    expect(mod).toBeTruthy();
    expect(mod.family).toBe("hvac-cinematic-dark");
    expect(mod.familyVersion).toBe(1);
    expect(mod.roleRenderers["hero.primary"]).toBeTruthy();
    expect(mod.roleRenderers["story.video"]).toBeTruthy();
    expect(mod.shell.HeaderComponent).toBeTruthy();
    expect(mod.shell.FooterComponent).toBeTruthy();
  });

  it("lazy-loads the clean corporate family module", async () => {
    const mod = await loadWebsiteFamilyModule("hvac-clean-corporate");
    expect(mod).toBeTruthy();
    expect(mod.family).toBe("hvac-clean-corporate");
    expect(mod.familyVersion).toBe(1);
    expect(mod.roleRenderers["hero.primary"]).toBeTruthy();
    expect(mod.roleRenderers["story.video"]).toBeTruthy();
    expect(mod.shell.HeaderComponent).toBeTruthy();
    expect(mod.shell.FooterComponent).toBeTruthy();
  });

  it("adapts the same canonical content payload for both families", () => {
    const heroSection = {
      props: {
        slides: [
          {
            heading: "Reliable heating and cooling",
            subheading: "Keep the same content while changing the visual style.",
            image: "/hero.jpg",
            ctaText: "Request service",
            ctaLink: "?page=contact",
          },
        ],
      },
    };
    const servicesSection = {
      items: [
        {
          title: "Air conditioning",
          description: "Repairs, maintenance, and installs.",
          image: "/ac.jpg",
          link: "?page=services-classic",
        },
      ],
    };
    const testimonialSection = {
      items: [
        {
          quote: "Fast response and clear communication.",
          author: "Morgan",
          location: "Toronto",
          rating: 5,
        },
      ],
    };

    expect(getHeroData(heroSection)).toEqual(
      expect.objectContaining({
        mode: "carousel",
        slides: expect.arrayContaining([
          expect.objectContaining({
            heading: "Reliable heating and cooling",
            ctaLink: "?page=contact",
          }),
        ]),
      })
    );
    expect(getServiceCards(servicesSection)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Air conditioning",
          link: "?page=services-classic",
        }),
      ])
    );
    expect(getTestimonials(testimonialSection)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          author: "Morgan",
          rating: 5,
        }),
      ])
    );
  });
});
