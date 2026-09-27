const normalizeText = (value) => String(value || "").trim();

const STARTER_DESCRIPTION =
  "Add a concise introduction that tells readers what this article explains.";
const STARTER_BODY_MARKER = "Replace this starter copy";

export const normalizeWebsitePagePath = (page) =>
  normalizeText(page?.slug || page?.path)
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();

export const isWebsiteBlogIndexPage = (page) =>
  normalizeWebsitePagePath(page) === "blog";

export const isWebsiteBlogArticlePage = (page) => {
  const path = normalizeWebsitePagePath(page);
  return path.startsWith("blog/") && path.length > "blog/".length;
};

/**
 * The Visual Site Builder only exposes destructive article actions for true
 * nested blog pages. This keeps home, the blog directory, and all system pages
 * out of the deletion workflow even if the handler is called directly.
 */
export const canDeleteWebsiteBlogArticle = (page) =>
  Boolean(page?.id) && !page?.is_homepage && isWebsiteBlogArticlePage(page);

const findArticleModule = (page, type) => {
  const modules = Array.isArray(page?.content?.modules)
    ? page.content.modules
    : [];
  return modules.find((module) => module?.type === type) || null;
};

export const getWebsiteBlogArticleChecklist = (page) => {
  const hero = findArticleModule(page, "hero")?.content || {};
  const richText = findArticleModule(page, "richText")?.content || {};
  const workflow = page?.content?.meta?.articleWorkflow || {};
  const title = normalizeText(page?.title || hero.heading);
  const description = normalizeText(
    page?.seo_description || hero.subheading || richText.intro
  );
  const coverImage = normalizeText(
    hero.image || hero.imageUrl || hero.backgroundImage
  );
  const imageAlt = normalizeText(
    hero.imageAlt || hero.backgroundImageAlt
  );
  const articleBody = normalizeText(richText.body);

  const items = [
    { key: "title", label: "Title", complete: Boolean(title) },
    {
      key: "description",
      label: "Description",
      complete: Boolean(description) && description !== STARTER_DESCRIPTION,
    },
    { key: "coverImage", label: "Cover image", complete: Boolean(coverImage) },
    {
      key: "imageAlt",
      label: "Image alt text",
      complete: Boolean(coverImage && imageAlt),
    },
    {
      key: "content",
      label: "Article content",
      complete:
        articleBody.length >= 80 && !articleBody.includes(STARTER_BODY_MARKER),
    },
    {
      key: "seoReviewed",
      label: "SEO reviewed",
      complete: workflow.seoReviewed === true,
      manual: true,
    },
    {
      key: "mobilePreviewReviewed",
      label: "Mobile preview reviewed",
      complete: workflow.mobilePreviewReviewed === true,
      manual: true,
    },
  ];

  return {
    items,
    complete: items.every((item) => item.complete),
    completedCount: items.filter((item) => item.complete).length,
    totalCount: items.length,
  };
};

export const withWebsiteBlogReviewFlag = (page, flag, complete) => {
  if (!["seoReviewed", "mobilePreviewReviewed"].includes(flag)) return page;
  const content = page?.content || {};
  const meta = content.meta || {};
  return {
    ...page,
    content: {
      ...content,
      meta: {
        ...meta,
        articleWorkflow: {
          ...(meta.articleWorkflow || {}),
          [flag]: Boolean(complete),
        },
      },
    },
  };
};

export const slugifyWebsiteArticle = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

const normalizeArticleSlug = (value, title) => {
  const raw = normalizeText(value).replace(/^\/+|\/+$/g, "");
  const withoutBlogPrefix = raw.toLowerCase().startsWith("blog/")
    ? raw.slice("blog/".length)
    : raw;
  return slugifyWebsiteArticle(withoutBlogPrefix || title) || "new-article";
};

const uniqueArticleSlug = (existingPages, requestedSlug, title) => {
  const existing = new Set(
    (existingPages || []).map((page) =>
      normalizeText(page?.slug || page?.path).replace(/^\/+|\/+$/g, "").toLowerCase()
    )
  );
  const base = normalizeArticleSlug(requestedSlug, title);
  let candidate = `blog/${base}`;
  let suffix = 2;
  while (existing.has(candidate)) {
    candidate = `blog/${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

const findTenantHeroMedia = (pages) => {
  const home =
    (pages || []).find((page) => page?.is_homepage) ||
    (pages || []).find((page) => ["home", ""].includes(normalizeText(page?.slug || page?.path).toLowerCase()));
  const modules = Array.isArray(home?.content?.modules) ? home.content.modules : [];
  const hero = modules.find((module) => module?.type === "hero");
  const content = hero?.content || {};
  return {
    image: normalizeText(content.image || content.imageUrl || content.backgroundImage),
    imageAlt: normalizeText(content.imageAlt || content.backgroundImageAlt),
    posterImage: normalizeText(content.posterImage || content.backgroundPoster),
  };
};

const moduleRecord = (articleKey, id, type, slot, order, content) => ({
  id: `article-${articleKey}-${id}`,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "website-blog-v1",
    source: "visual-site-builder",
  },
});

/**
 * Create a neutral WebsitePage article that every registered Next.js theme can
 * render through the shared semantic page contract. The article inherits an
 * existing tenant-owned hero asset when one is available; it never imports a
 * theme fixture or creates a second blog/CMS store.
 */
export function createWebsiteBlogPostPage(existingPages = [], options = {}) {
  const title = normalizeText(options.title) || "New article";
  const description =
    normalizeText(options.description) ||
    "Add a concise introduction that tells readers what this article explains.";
  const slug = uniqueArticleSlug(existingPages, options.slug, title);
  const articleKey = slug.slice("blog/".length);
  const media = findTenantHeroMedia(existingPages);
  const inheritedAlt = media.imageAlt || `Cover image for ${title}.`;

  return {
    slug,
    path: slug,
    title,
    menu_title: title,
    show_in_menu: false,
    published: false,
    is_homepage: false,
    noindex: false,
    seo_title: title,
    seo_description: description,
    og_title: title,
    og_description: description,
    og_image_url: media.image || media.posterImage || "",
    canonical_path: `/${slug}`,
    content: {
      sections: [],
      modules: [
        moduleRecord(articleKey, "hero", "hero", "blog.intro", 0, {
          eyebrow: "Insights",
          heading: title,
          subheading: description,
          image: media.image,
          imageUrl: media.image,
          imageAlt: inheritedAlt,
          imagePosition: { x: 50, y: 50 },
          posterImage: media.posterImage,
        }),
        moduleRecord(articleKey, "body", "richText", "blog.primaryContent", 1, {
          eyebrow: "Article",
          heading: "Start with a clear, useful heading.",
          intro: "Lead with the answer your reader needs, then add the supporting context.",
          body: "Replace this starter copy with original, accurate information. Use descriptive headings, useful internal links, and media alt text so people and search engines can understand the page.",
          image: "",
          imageUrl: "",
          imageAlt: "",
        }),
        moduleRecord(articleKey, "cta", "cta", "blog.finalCta", 2, {
          eyebrow: "Next step",
          heading: "Ready to learn more?",
          body: "Connect this article to the most relevant service or next step.",
          primaryCta: { label: "Explore services", href: "/services" },
        }),
      ],
      meta: {
        layout: "full",
        websiteBlogStarterVersion: 1,
        websiteBlogPost: true,
        articleWorkflow: {
          seoReviewed: false,
          mobilePreviewReviewed: false,
        },
      },
    },
  };
}
