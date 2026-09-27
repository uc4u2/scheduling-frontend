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
  return (
    modules.find(
      (module) => module?.type === type && module?.enabled !== false
    ) || null
  );
};

export const getWebsiteBlogArticleChecklist = (page) => {
  const heroModule = findArticleModule(page, "hero");
  const richTextModule = findArticleModule(page, "richText");
  const hero = heroModule?.content || {};
  const richText = richTextModule?.content || {};
  const title = normalizeText(hero.heading);
  const description = normalizeText(
    hero.subheading || hero.intro || hero.body
  );
  const coverImage = normalizeText(
    hero.image || hero.imageUrl || hero.backgroundImage
  );
  const imageAlt = normalizeText(
    hero.imageAlt || hero.backgroundImageAlt
  );
  const articleBody = normalizeText(richText.body);

  const items = [
    {
      key: "title",
      label: "Title",
      complete: Boolean(heroModule && title),
      required: true,
    },
    {
      key: "description",
      label: "Summary",
      complete:
        Boolean(heroModule && description) &&
        description !== STARTER_DESCRIPTION,
      required: true,
    },
    {
      key: "content",
      label: "Article text",
      complete:
        Boolean(richTextModule) &&
        articleBody.length >= 20 &&
        !articleBody.includes(STARTER_BODY_MARKER),
      required: true,
    },
    {
      key: "coverImage",
      label: "Cover image",
      complete: Boolean(coverImage),
      required: false,
    },
    {
      key: "imageAlt",
      label: "Image alt text",
      complete: !coverImage || Boolean(imageAlt),
      required: false,
    },
  ];

  const requiredItems = items.filter((item) => item.required);

  return {
    items,
    complete: requiredItems.every((item) => item.complete),
    completedCount: requiredItems.filter((item) => item.complete).length,
    totalCount: requiredItems.length,
  };
};

/**
 * Article authors edit the visible hero title/summary. Keep search and social
 * metadata in sync automatically so ordinary publishing never requires a
 * second SEO form. Advanced users can still manage canonical/noindex fields
 * through the dedicated website SEO tools.
 */
export const withSyncedWebsiteBlogArticleMetadata = (page) => {
  if (!isWebsiteBlogArticlePage(page)) return page;
  const hero = findArticleModule(page, "hero")?.content || {};
  const title = normalizeText(hero.heading || page?.title);
  const description = normalizeText(
    hero.subheading || page?.seo_description || STARTER_DESCRIPTION
  );
  const coverImage = normalizeText(
    hero.image || hero.imageUrl || hero.backgroundImage || page?.og_image_url
  );
  return {
    ...page,
    title: title || page?.title,
    menu_title: title || page?.menu_title || page?.title,
    seo_title: title || page?.seo_title,
    seo_description: description,
    og_title: title || page?.og_title,
    og_description: description,
    og_image_url: coverImage,
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
  // A new story starts without media. Reusing a homepage image made unrelated
  // photos look intentionally attached to a new article and falsely marked
  // the media checklist complete.
  const media = { image: "", imageAlt: "", posterImage: "" };

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
          imageAlt: "",
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
        articleWorkflow: {},
      },
    },
  };
}
