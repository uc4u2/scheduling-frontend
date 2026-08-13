import { canonicalWebsitePagePath } from "./websitePageApi";
import { withNormalizedModules } from "./websiteSemanticModules";

describe("canonical WebsitePage saves", () => {
  const page = {
    id: 42,
    slug: "home",
    is_homepage: true,
    content: {
      sections: [],
      modules: [
        {
          id: "hero-qa",
          type: "hero",
          slot: "home.hero",
          enabled: true,
          content: {
            heading: "QA heading",
            image: "https://cdn.example.test/hero.jpg",
            imageAlt: "QA hero alt",
          },
        },
        {
          id: "faq-qa",
          type: "faq",
          slot: "home.afterServices",
          enabled: true,
          content: { items: [{ id: "question-1", title: "Question", body: "Answer" }] },
        },
      ],
    },
  };

  afterEach(() => jest.restoreAllMocks());

  it("uses the canonical page endpoint and retains semantic text, media, and repeater fields", async () => {
    const normalized = withNormalizedModules(page);
    const hero = normalized.content.modules.find((module) => module.id === "hero-qa");
    const faq = normalized.content.modules.find((module) => module.id === "faq-qa");

    expect(canonicalWebsitePagePath(page.id)).toBe("/api/website/pages/42");
    expect(canonicalWebsitePagePath(page.id)).not.toContain("/admin/pages/");
    expect(hero.content).toMatchObject({
      heading: "QA heading",
      image: "https://cdn.example.test/hero.jpg",
      imageAlt: "QA hero alt",
    });
    expect(faq.content.items[0]).toMatchObject({ title: "Question", body: "Answer" });
  });
});
