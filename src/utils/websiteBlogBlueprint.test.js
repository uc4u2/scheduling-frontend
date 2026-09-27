import {
  canDeleteWebsiteBlogArticle,
  createWebsiteBlogPostPage,
  getWebsiteBlogArticleChecklist,
  isWebsiteBlogArticlePage,
  isWebsiteBlogIndexPage,
  withSyncedWebsiteBlogArticleMetadata,
} from "./websiteBlogBlueprint";

describe("website blog article workflow", () => {
  it("recognizes articles while protecting the homepage, blog directory, and system pages", () => {
    expect(isWebsiteBlogArticlePage({ slug: "blog/my-article" })).toBe(true);
    expect(isWebsiteBlogIndexPage({ slug: "/blog/" })).toBe(true);

    expect(
      canDeleteWebsiteBlogArticle({
        id: 42,
        slug: "blog/my-article",
        is_homepage: false,
      })
    ).toBe(true);
    expect(canDeleteWebsiteBlogArticle({ id: 1, slug: "blog" })).toBe(false);
    expect(
      canDeleteWebsiteBlogArticle({
        id: 2,
        slug: "blog/home-story",
        is_homepage: true,
      })
    ).toBe(false);
    expect(canDeleteWebsiteBlogArticle({ id: 3, slug: "contact" })).toBe(false);
  });

  it("creates a draft that only requires the visible article essentials", () => {
    const article = createWebsiteBlogPostPage([], {
      title: "A useful guide",
      description: "A direct description for readers and search results.",
    });
    const checklist = getWebsiteBlogArticleChecklist(article);

    expect(article.published).toBe(false);
    expect(article.content.meta.articleWorkflow).toEqual({});
    expect(checklist.complete).toBe(false);
    expect(
      checklist.items.find((item) => item.key === "content").complete
    ).toBe(false);
    expect(checklist.totalCount).toBe(3);
    expect(
      checklist.items.find((item) => item.key === "coverImage").required
    ).toBe(false);
  });

  it("marks an article ready after title, summary, and useful article text", () => {
    let article = createWebsiteBlogPostPage([], {
      title: "A useful guide",
      description: "A direct description for readers and search results.",
    });
    article.content.modules = article.content.modules.map((module) => {
      if (module.type === "richText") {
        return {
          ...module,
          content: {
            ...module.content,
            body: "This original article body gives readers a direct answer and enough supporting detail to complete the publishing readiness check.",
          },
        };
      }
      return module;
    });

    const checklist = getWebsiteBlogArticleChecklist(article);
    expect(checklist.complete).toBe(true);
    expect(checklist.completedCount).toBe(checklist.totalCount);
  });

  it("does not treat a hidden required article section as publish-ready", () => {
    const article = createWebsiteBlogPostPage([], {
      title: "Community visit",
      description: "News from our recent community visit.",
    });
    article.content.modules = article.content.modules.map((module) => {
      if (module.type === "hero") return { ...module, enabled: false };
      if (module.type === "richText") {
        return {
          ...module,
          content: {
            ...module.content,
            body: "We visited the community centre and shared a wonderful afternoon together.",
          },
        };
      }
      return module;
    });

    const checklist = getWebsiteBlogArticleChecklist(article);
    expect(checklist.complete).toBe(false);
    expect(checklist.items.find((item) => item.key === "title").complete).toBe(false);
    expect(checklist.items.find((item) => item.key === "description").complete).toBe(false);
  });

  it("syncs search and social metadata from the visible article hero", () => {
    const article = createWebsiteBlogPostPage([], {
      title: "Original title",
      description: "Original summary.",
    });
    article.content.modules = article.content.modules.map((module) =>
      module.type === "hero"
        ? {
            ...module,
            content: {
              ...module.content,
              heading: "Church visit update",
              subheading: "Photos and news from our community visit.",
            },
          }
        : module
    );

    const synced = withSyncedWebsiteBlogArticleMetadata(article);
    expect(synced.title).toBe("Church visit update");
    expect(synced.seo_title).toBe("Church visit update");
    expect(synced.seo_description).toBe(
      "Photos and news from our community visit."
    );
  });
});
