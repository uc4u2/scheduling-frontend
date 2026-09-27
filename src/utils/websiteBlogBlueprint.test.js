import {
  canDeleteWebsiteBlogArticle,
  createWebsiteBlogPostPage,
  getWebsiteBlogArticleChecklist,
  isWebsiteBlogArticlePage,
  isWebsiteBlogIndexPage,
  withWebsiteBlogReviewFlag,
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

  it("creates a draft with an incomplete, persisted review workflow", () => {
    const article = createWebsiteBlogPostPage([], {
      title: "A useful guide",
      description: "A direct description for readers and search results.",
    });
    const checklist = getWebsiteBlogArticleChecklist(article);

    expect(article.published).toBe(false);
    expect(article.content.meta.articleWorkflow).toEqual({
      seoReviewed: false,
      mobilePreviewReviewed: false,
    });
    expect(checklist.complete).toBe(false);
    expect(
      checklist.items.find((item) => item.key === "content").complete
    ).toBe(false);
    expect(
      checklist.items.find((item) => item.key === "seoReviewed").complete
    ).toBe(false);
  });

  it("marks an article ready only after content, media, and both reviews are complete", () => {
    let article = createWebsiteBlogPostPage([], {
      title: "A useful guide",
      description: "A direct description for readers and search results.",
    });
    article.content.modules = article.content.modules.map((module) => {
      if (module.type === "hero") {
        return {
          ...module,
          content: {
            ...module.content,
            image: "https://example.com/cover.jpg",
            imageAlt: "A technician reviewing a service schedule.",
          },
        };
      }
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
    article = withWebsiteBlogReviewFlag(article, "seoReviewed", true);
    article = withWebsiteBlogReviewFlag(
      article,
      "mobilePreviewReviewed",
      true
    );

    const checklist = getWebsiteBlogArticleChecklist(article);
    expect(checklist.complete).toBe(true);
    expect(checklist.completedCount).toBe(checklist.totalCount);
  });
});
