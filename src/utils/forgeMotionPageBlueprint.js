import {
  forgeMotionStarterRef,
  resolveForgeMotionStarterMedia,
} from "./forgeMotionStarterMedia";

const FORGE_PAGE_MEDIA = {
  about: forgeMotionStarterRef("story"),
  services: forgeMotionStarterRef("hero"),
  reviews: forgeMotionStarterRef("heroSecond"),
  products: forgeMotionStarterRef("products"),
  projects: forgeMotionStarterRef("railOne"),
  jobs: forgeMotionStarterRef("storyDetail"),
  locations: forgeMotionStarterRef("locations"),
  blog: forgeMotionStarterRef("heroDetail"),
  recovery: forgeMotionStarterRef("heroSupport"),
  coaching: forgeMotionStarterRef("coaching"),
  movement: forgeMotionStarterRef("railFour"),
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const text = (value) => String(value || "").trim();
const lower = (value) => text(value).toLowerCase();
const media = (image, imageAlt) => ({ image, imageUrl: image, imageAlt });
const item = (id, title, body, image, imageAlt, extra = {}) => ({
  id,
  title,
  body,
  ...media(image, imageAlt),
  ...extra,
});
const moduleRecord = (pageKey, id, type, slot, order, content, settings = {}) => ({
  id: `forge-${pageKey}-${id}`,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "forge-motion-pages-v1",
    source: "forge-motion-premium-v2",
    ...settings,
  },
});

const hero = (pageKey, eyebrow, heading, subheading, image, imageAlt) =>
  moduleRecord(pageKey, "hero", "hero", `${pageKey}.hero`, 0, {
    eyebrow,
    heading,
    subheading,
    ...media(image, imageAlt),
    posterImage: "",
    primaryCta: { label: "Explore training", href: "/services" },
  });

const cta = (pageKey, order, heading, body = "") =>
  moduleRecord(pageKey, "cta", "bookingCta", `${pageKey}.finalCta`, order, {
    eyebrow: "Next step",
    heading,
    body,
    backgroundImage: FORGE_PAGE_MEDIA.recovery,
    backgroundImageAlt: "A focused training session in a professional fitness studio.",
    primaryCta: { label: "View training services", href: "/services" },
  });

const pageBlueprints = {
  about: {
    title: "Coaching built for real life",
    menuTitle: "About",
    description: "Meet the coaching practice and learn how assessment, useful progression, and clear communication shape each training plan.",
    modules: [
      hero("about", "The coaching practice", "Coaching built for real life.", "A practical training approach starts with the person, the routine, and the reason for showing up.", FORGE_PAGE_MEDIA.about, "A fitness coach guiding an athlete through a structured studio session."),
      moduleRecord("about", "story", "featureStory", "about.primaryContent", 1, {
        eyebrow: "How we coach",
        heading: "Structure first. Then build with purpose.",
        intro: "Use this page to explain the studio's real coaching philosophy, expectations, and training environment.",
        body: "Good coaching makes the work understandable. It connects assessment, practice, feedback, and recovery without relying on transformation promises.",
        ...media(FORGE_PAGE_MEDIA.coaching, "A coach observing movement and giving clear training guidance."),
        items: [
          { id: "forge-about-story-1", title: "Start where you are", body: "Understand the current routine, training history, and practical priorities." },
          { id: "forge-about-story-2", title: "Build the week", body: "Choose a realistic training rhythm and make each session purposeful." },
          { id: "forge-about-story-3", title: "Review and adjust", body: "Use clear feedback and measured progression as the plan develops." },
        ],
      }),
      moduleRecord("about", "team", "team", "about.team", 2, {
        eyebrow: "Coaching team",
        heading: "Meet the people behind the practice.",
        intro: "Replace the starter records with verified coach names, roles, biographies, imagery, and qualifications.",
        items: [
          item("forge-about-coach-1", "Lead coach", "Add a real biography and only verified experience or qualifications.", FORGE_PAGE_MEDIA.about, "Portrait of the lead fitness coach in the studio.", { role: "Add verified role" }),
          item("forge-about-coach-2", "Movement coach", "Explain the training areas this coach genuinely supports.", FORGE_PAGE_MEDIA.coaching, "Portrait of a movement coach on the training floor.", { role: "Add verified role" }),
          item("forge-about-coach-3", "Performance coach", "Add an accurate biography without invented performance claims.", FORGE_PAGE_MEDIA.movement, "Portrait of a performance coach in a fitness studio.", { role: "Add verified role" }),
        ],
      }),
      moduleRecord("about", "process", "process", "about.process", 3, {
        eyebrow: "The training rhythm",
        heading: "A clear path from first conversation to useful practice.",
        items: [
          { id: "forge-about-process-1", title: "Understand", body: "Discuss context, current routine, and the reason for training." },
          { id: "forge-about-process-2", title: "Plan", body: "Choose a service and schedule that can work in real life." },
          { id: "forge-about-process-3", title: "Coach", body: "Practice, review, and adjust with clear direction." },
        ],
      }),
      cta("about", 4, "Ready to find your training path?"),
    ],
  },
  services: {
    title: "Training services",
    menuTitle: "Services",
    description: "Compare the studio's current coaching services, formats, duration, and booking options.",
    modules: [
      hero("services", "Programs & coaching", "Training services.", "Choose the real service that fits the current goal, preferred format, and weekly routine.", FORGE_PAGE_MEDIA.services, "An athlete training with weights in a professional coaching studio."),
      moduleRecord("services", "directory", "services", "services.primaryContent", 1, {
        eyebrow: "Current training options",
        heading: "Choose a path that fits the goal and the week.",
        intro: "Service names, descriptions, prices, duration, availability, and booking remain managed in Services.",
        source: "operational",
        items: [],
      }, { dataSource: "operational-services", presentation: "fitness-program-selector" }),
      moduleRecord("services", "approach", "featureStory", "services.supporting", 2, {
        eyebrow: "Before you book",
        heading: "Choose the format, then make the plan specific.",
        intro: "Use this editable guidance for accurate context around private coaching, groups, online work, or other formats the business actually provides.",
        ...media(FORGE_PAGE_MEDIA.movement, "A coached movement session focused on controlled technique."),
        items: [
          { id: "forge-services-note-1", title: "Starting point", body: "Clarify who the service is designed to support." },
          { id: "forge-services-note-2", title: "Format", body: "Explain the real session format and what a client should expect." },
          { id: "forge-services-note-3", title: "Next step", body: "Keep live availability and booking inside the existing booking flow." },
        ],
      }),
      moduleRecord("services", "faq", "faq", "services.faq", 3, {
        eyebrow: "Training questions",
        heading: "Useful answers before the first session.",
        items: [
          { id: "forge-services-faq-1", question: "How do I choose a service?", answer: "Compare the current service descriptions and contact the team when the best starting point is unclear." },
          { id: "forge-services-faq-2", question: "Where can I see available times?", answer: "Live availability appears only in the existing booking flow after a service is selected." },
          { id: "forge-services-faq-3", question: "Can I ask a question before booking?", answer: "Yes. Use the contact form to share useful context and ask about the most appropriate next step." },
        ],
      }),
      cta("services", 4, "Choose a service and continue when you are ready."),
    ],
  },
  products: {
    title: "Training essentials",
    menuTitle: "Products",
    description: "Browse the business's current products while keeping inventory, pricing, and checkout in the existing commerce system.",
    modules: [
      hero("products", "Training essentials", "Products for practice and recovery.", "Browse the current collection, then continue through the existing product and checkout flow.", FORGE_PAGE_MEDIA.products, "Training and recovery equipment arranged in a fitness studio."),
      moduleRecord("products", "guide", "richText", "products.primaryContent", 1, {
        eyebrow: "Use with intention",
        heading: "Support the work between sessions.",
        intro: "Use this editable section for accurate product guidance without making unsupported health or performance claims.",
        body: "Product records, price, stock, cart, checkout, and payment remain managed by the existing commerce system.",
        ...media(FORGE_PAGE_MEDIA.recovery, "Fitness equipment prepared for mobility and recovery practice."),
      }),
      cta("products", 2, "Need help choosing the right next step?", "Contact the team for training context or return to the service menu."),
    ],
  },
  reviews: {
    title: "Client feedback",
    menuTitle: "Reviews",
    description: "Read published client feedback about the training and coaching experience.",
    modules: [
      hero("reviews", "Client feedback", "Training stories, in clients' own words.", "Published reviews remain management-owned and appear here without fixture testimonials or invented results.", FORGE_PAGE_MEDIA.reviews, "A client and coach speaking after a training session."),
      moduleRecord("reviews", "rail", "reviews", "reviews.primaryContent", 1, {
        eyebrow: "Published reviews",
        heading: "Real feedback from real training experiences.",
        intro: "Manage review records in the Reviews workspace. Forge controls only their editorial presentation.",
        source: "operational",
        items: [],
      }, { dataSource: "published-reviews", presentation: "fitness-review-rail" }),
      cta("reviews", 2, "Build your own starting point."),
    ],
  },
  projects: {
    title: "Training journal",
    menuTitle: "Gallery",
    description: "Explore coaching moments, movement practice, and the training environment through an editable visual journal.",
    modules: [
      hero("projects", "Training journal", "Movement in practice.", "A visual record of the training floor, coaching detail, and repeatable work.", FORGE_PAGE_MEDIA.projects, "Athletes moving through a structured outdoor training session."),
      moduleRecord("projects", "portfolio", "portfolio", "projects.primaryContent", 1, {
        eyebrow: "Inside the work",
        heading: "Coaching, movement, and the studio in action.",
        intro: "Replace these starter images with real, properly permitted studio media and accurate captions.",
        items: [
          item("forge-gallery-1", "Strength practice", "Controlled work on the training floor.", FORGE_PAGE_MEDIA.services, "A focused strength training session in a professional gym.", { category: "Strength" }),
          item("forge-gallery-2", "Movement session", "Range, control, and useful coaching cues.", FORGE_PAGE_MEDIA.movement, "An athlete completing a coached movement exercise.", { category: "Movement" }),
          item("forge-gallery-3", "Coach detail", "Clear feedback during a working set.", FORGE_PAGE_MEDIA.coaching, "A fitness coach giving guidance during a session.", { category: "Coaching" }),
          item("forge-gallery-4", "Recovery practice", "A quieter part of a repeatable training week.", FORGE_PAGE_MEDIA.recovery, "An athlete completing a guided recovery exercise.", { category: "Recovery" }),
        ],
      }),
      cta("projects", 2, "Ready to move from inspiration to a real plan?"),
    ],
  },
  jobs: {
    title: "Join the coaching team",
    menuTitle: "Careers",
    description: "Learn about the coaching environment and view current roles through the existing Jobs system.",
    modules: [
      hero("jobs", "Careers", "Help build a better training experience.", "Introduce the real working environment, then let current job records and applications remain system-owned.", FORGE_PAGE_MEDIA.jobs, "A fitness team preparing the studio training floor."),
      moduleRecord("jobs", "culture", "richText", "jobs.primaryContent", 1, {
        eyebrow: "The working environment",
        heading: "Clear coaching. Useful collaboration. Real standards.",
        intro: "Replace this section with the studio's genuine culture, expectations, and employment context.",
        body: "Job descriptions, status, and applications remain managed in the Jobs workspace.",
        ...media(FORGE_PAGE_MEDIA.coaching, "Fitness coaches collaborating beside the training floor."),
      }),
      cta("jobs", 2, "Explore the current opportunities.", "Only active roles from the existing Jobs system should be presented as available."),
    ],
  },
  locations: {
    title: "Studio location",
    menuTitle: "Location",
    description: "Find verified studio contact details, staffed hours, and location guidance.",
    modules: [
      hero("locations", "Studio access", "Find the training space.", "Use verified location, contact, and staffed-hour information to plan the first visit.", FORGE_PAGE_MEDIA.locations, "A modern fitness studio prepared for a training session."),
      moduleRecord("locations", "details", "contactDetails", "locations.details", 1, { eyebrow: "Direct contact", heading: "Studio details.", intro: "Shared verified address, phone, and email appear here.", items: [] }),
      moduleRecord("locations", "hours", "hoursLocation", "locations.hours", 2, { eyebrow: "Studio access", heading: "Staffed contact hours.", intro: "These are display hours, not live appointment availability.", items: [
        { id: "forge-location-hours-1", title: "Monday — Friday", body: "Add verified staffed hours" },
        { id: "forge-location-hours-2", title: "Saturday — Sunday", body: "Add verified staffed hours" },
      ] }),
      moduleRecord("locations", "map", "map", "locations.map", 3, { eyebrow: "Location", heading: "Plan the visit.", intro: "Add the verified address or supported map embed.", query: "", address: "", embedUrl: "", primaryCta: { label: "Get directions", href: "" } }),
      cta("locations", 4, "Have a question before you arrive?", "Use the Contact page for a direct training inquiry."),
    ],
  },
  blog: {
    title: "Training notes",
    menuTitle: "Blog",
    description: "Practical coaching notes about strength, mobility, recovery, and building a repeatable training week.",
    modules: [
      hero("blog", "Training notes", "Useful guidance for the work between sessions.", "Publish clear, relevant articles that answer real training questions without unsupported health or performance claims.", FORGE_PAGE_MEDIA.blog, "A coach preparing notes for a structured training session."),
      moduleRecord("blog", "stories", "featureStory", "blog.primaryContent", 1, {
        eyebrow: "From the coaching floor",
        heading: "Start with questions clients actually ask.",
        intro: "These editable topic starters can be replaced with links and summaries for published WebsitePage articles.",
        items: [
          item("forge-blog-topic-1", "How to build a training week you can repeat", "Explain practical frequency, format, and recovery considerations without promising outcomes.", FORGE_PAGE_MEDIA.services, "A coach organizing a practical weekly strength training plan.", { category: "Training structure" }),
          item("forge-blog-topic-2", "What to expect from a first coaching session", "Set clear expectations around conversation, assessment, and choosing an appropriate service.", FORGE_PAGE_MEDIA.coaching, "A coach and client discussing a first personal training session.", { category: "Getting started" }),
          item("forge-blog-topic-3", "Strength, mobility, and recovery in one routine", "Offer useful general education while keeping medical advice and individual claims out of the article.", FORGE_PAGE_MEDIA.recovery, "An athlete practicing mobility and recovery in a training studio.", { category: "Practice notes" }),
        ],
      }),
      cta("blog", 2, "Turn useful guidance into a real training conversation."),
    ],
  },
};

export const FORGE_MOTION_PAGE_STARTER_VERSION = 5;

export function forgeMotionPageKey(page = {}) {
  const slug = lower(page.slug || page.path);
  if (["services", "services-classic", "pricing"].includes(slug)) return "services";
  if (["about", "team", "our-team"].includes(slug)) return "about";
  if (["gallery", "projects", "projects-gallery", "portfolio"].includes(slug)) return "projects";
  if (["locations", "service-areas"].includes(slug)) return "locations";
  if (["blog", "journal", "news"].includes(slug)) return "blog";
  if (["products", "products-classic"].includes(slug)) return "products";
  if (["reviews", "jobs"].includes(slug)) return slug;
  return "";
}

export function createForgeMotionPageModules(pageOrKey = {}, companyId) {
  const key = typeof pageOrKey === "string" ? pageOrKey : forgeMotionPageKey(pageOrKey);
  return resolveForgeMotionStarterMedia(clone(pageBlueprints[key]?.modules || []), companyId);
}

export function createForgeMotionBlogPostPage(existingPages = [], companyId) {
  const existing = new Set((existingPages || []).map((page) => lower(page.slug || page.path)));
  let suffix = "new-training-article";
  let index = 2;
  while (existing.has(`blog/${suffix}`)) {
    suffix = `new-training-article-${index}`;
    index += 1;
  }
  const slug = `blog/${suffix}`;
  const pageKey = suffix.replace(/[^a-z0-9-]+/g, "-");
  const modules = [
    hero(pageKey, "Training notes", "New training article.", "Write a concise introduction that answers a real client question and accurately describes what the article covers.", FORGE_PAGE_MEDIA.blog, "Replace with a descriptive image for this training article."),
    moduleRecord(pageKey, "article", "richText", "blog.primaryContent", 1, {
      eyebrow: "Practical guidance",
      heading: "Use a clear, specific article heading.",
      intro: "Lead with the answer, then organize the useful context into readable sections.",
      body: "Replace this starter with original, accurate guidance. Avoid unsupported health, transformation, or performance claims. Add descriptive image alt text and link to relevant services when it genuinely helps the reader.",
      ...media(FORGE_PAGE_MEDIA.movement, "Replace with descriptive alt text for the article image."),
    }),
    cta(pageKey, 2, "Need help choosing a training service?"),
  ];
  return resolveForgeMotionStarterMedia({
    slug,
    path: slug,
    title: "New training article",
    menu_title: "New training article",
    show_in_menu: false,
    published: false,
    is_homepage: false,
    noindex: false,
    seo_title: "New training article",
    seo_description: "Add a concise search description that explains the specific training question this article answers.",
    og_title: "New training article",
    og_description: "Add a clear social description for this training article.",
    og_image_url: FORGE_PAGE_MEDIA.blog,
    canonical_path: `/${slug}`,
    content: {
      sections: [],
      modules,
      meta: { layout: "full", forgeMotionPageStarterVersion: FORGE_MOTION_PAGE_STARTER_VERSION, forgeMotionBlogPost: true },
    },
  }, companyId);
}

const staleForgePage = (page) => {
  const haystack = JSON.stringify(page || {}).toLowerCase();
  return [
    "barber", "grooming studio", "studio journal", "engagement tier", "event consultation",
    "vanda orchid", "selected work", "join the team", "the product collection",
    "put the notes into practice", '"heading":"2"', "browse more highlights and client favorites",
    "what clients are saying", '"heading":"products"', '"title":"our team"', "where to find us",
  ].some((marker) => haystack.includes(marker));
};

/**
 * Conservative one-time repair for pre-Forge generic/cross-profession pages.
 * Authored pages are retained; pages carrying known starter/demo signatures are
 * replaced with the fitness-native canonical composition.
 */
export function upgradeForgeMotionMarketingPage(page = {}, companyId) {
  const key = forgeMotionPageKey(page);
  const blueprint = resolveForgeMotionStarterMedia(pageBlueprints[key], companyId);
  if (!blueprint) return page;
  const content = page.content && typeof page.content === "object" ? page.content : {};
  const meta = content.meta && typeof content.meta === "object" ? content.meta : {};
  if (Number(meta.forgeMotionPageStarterVersion || 0) >= FORGE_MOTION_PAGE_STARTER_VERSION) return page;
  const modules = Array.isArray(content.modules) ? content.modules : [];
  const alreadyForge = modules.some((module) => lower(module?.settings?.starterBlueprint).startsWith("forge-motion"));
  const shouldReplace = !modules.length || staleForgePage(page);
  const nextModules = shouldReplace
    ? clone(blueprint.modules)
    : resolveForgeMotionStarterMedia(modules, companyId);
  const canonicalPath = key === "services"
    ? "/services"
    : key === "projects"
      ? "/projects"
      : key === "about" && ["team", "our-team"].includes(lower(page.slug || page.path))
        ? "/about"
        : `/${text(page.path || page.slug)}`;
  return {
    ...page,
    title: shouldReplace || !text(page.title) ? blueprint.title : page.title,
    menu_title: shouldReplace || !text(page.menu_title) ? blueprint.menuTitle : page.menu_title,
    path: text(page.path) || lower(page.slug),
    seo_title: text(page.seo_title) || blueprint.title,
    seo_description: text(page.seo_description) || blueprint.description,
    og_title: text(page.og_title) || blueprint.title,
    og_description: text(page.og_description) || blueprint.description,
    og_image_url:
      resolveForgeMotionStarterMedia(text(page.og_image_url), companyId) ||
      blueprint.modules[0]?.content?.image ||
      "",
    // Known legacy aliases intentionally converge on one public canonical URL
    // (for example services-classic/pricing -> /services). Preserve authored
    // canonicals only for pages that do not have an alias mapping.
    canonical_path:
      ["services", "projects"].includes(key) ||
      (key === "about" && ["team", "our-team"].includes(lower(page.slug || page.path)))
        ? canonicalPath
        : shouldReplace
          ? canonicalPath
          : text(page.canonical_path) || canonicalPath,
    content: {
      ...content,
      meta: {
        ...meta,
        forgeMotionPageStarterVersion: FORGE_MOTION_PAGE_STARTER_VERSION,
        forgeMotionPageBlueprintPreserved: Boolean(alreadyForge && !shouldReplace),
      },
      modules: nextModules,
    },
  };
}
