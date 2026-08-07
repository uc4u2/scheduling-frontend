import { adaptSectionForRole } from "../../adapters/sectionAdapters";
import { resolveSectionRole } from "../../roles/sectionRoleResolver";

const HERO_TYPES = ["hero", "heroCarousel", "heroSplit"];
const TRUST_TYPES = ["logoCloud"];
const SERVICES_TYPES = ["collectionShowcase", "serviceGrid", "serviceGridSmart"];
const PROBLEM_TYPES = ["serviceHoverSlider"];
const FEATURE_TYPES = ["featureShowcaseSlider"];
const STATS_TYPES = ["teamMetrics"];
const PLANS_TYPES = ["pricingTable"];
const PROJECT_TYPES = ["videoStorySplit"];
const PROCESS_TYPES = ["featureZigzagModern", "featureZigzag", "processSteps"];
const GALLERY_TYPES = ["gallery", "galleryCarousel", "videoGallery"];
const REVIEWS_TYPES = [
  "testimonials",
  "reviewEditorialGrid",
  "testimonialTiles",
  "testimonialCarousel",
];
const FAQ_TYPES = ["faq"];
const CONTACT_TYPES = ["contactForm", "contact"];
const MAP_TYPES = ["mapEmbed"];
const CTA_TYPES = ["bookingCtaBar", "cta"];
const RICH_TEXT_TYPES = ["richText", "teamGrid", "blogList", "cultureValues"];

const HOME_SLUGS = new Set(["home"]);
const SERVICES_SLUGS = new Set(["services", "services-classic", "pricing", "products"]);
const ABOUT_SLUGS = new Set(["about", "our-team"]);
const PROJECT_SLUGS = new Set(["gallery", "projects", "projects-gallery"]);
const REVIEWS_SLUGS = new Set(["reviews"]);
const CONTACT_SLUGS = new Set(["contact", "request-quote", "locations"]);
const NON_FLAGSHIP_SLUGS = new Set([
  "privacy",
  "terms",
  "cookies",
  "faq",
  "blog",
  "basket",
  "my-bookings",
  "policies",
]);

function createSectionRecord(section, index) {
  return {
    id: section?.id || `${section?.type || "section"}-${index}`,
    raw: section,
    adapted: adaptSectionForRole(section),
    role: resolveSectionRole(section),
    type: section?.type || "",
    props: section?.props || {},
    index,
  };
}

function assignSlotsFromPool(pool) {
  const work = [...pool];
  return {
    hero: takeFirst(work, HERO_TYPES),
    trustRail: takeFirst(work, TRUST_TYPES),
    services: takeFirst(work, SERVICES_TYPES),
    problemSelector: takeFirst(work, PROBLEM_TYPES),
    featureSlider: takeFirst(work, FEATURE_TYPES),
    stats: takeFirst(work, STATS_TYPES),
    plans: takeFirst(work, PLANS_TYPES),
    project: takeFirst(work, PROJECT_TYPES),
    process: takeFirst(work, PROCESS_TYPES),
    reviews: takeFirst(work, REVIEWS_TYPES),
    faq: takeFirst(work, FAQ_TYPES),
    contact: takeFirst(work, CONTACT_TYPES),
    map: takeFirst(work, MAP_TYPES),
    finalCta: takeFirst(work, CTA_TYPES),
    richTextBlocks: takeAll(work, RICH_TEXT_TYPES),
    galleries: takeAll(work, GALLERY_TYPES),
    extras: work,
  };
}

function takeFirst(pool, types) {
  const idx = pool.findIndex((item) => types.includes(item.type));
  if (idx === -1) return null;
  const [item] = pool.splice(idx, 1);
  return item;
}

function takeAll(pool, types) {
  const found = [];
  for (let i = pool.length - 1; i >= 0; i -= 1) {
    if (types.includes(pool[i].type)) {
      found.unshift(pool[i]);
      pool.splice(i, 1);
    }
  }
  return found;
}

function dedupePages(pages = []) {
  const seen = new Set();
  return pages.filter((page) => {
    const slug = String(page?.slug || "").trim().toLowerCase();
    if (!slug || seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });
}

function getPageKind(slug = "") {
  const key = String(slug || "").trim().toLowerCase();
  if (HOME_SLUGS.has(key)) return "home";
  if (SERVICES_SLUGS.has(key)) return "services";
  if (ABOUT_SLUGS.has(key)) return "about";
  if (PROJECT_SLUGS.has(key)) return "projects";
  if (REVIEWS_SLUGS.has(key)) return "reviews";
  if (CONTACT_SLUGS.has(key)) return "contact";
  if (NON_FLAGSHIP_SLUGS.has(key)) return "legacy";
  return "service-detail";
}

export function isCorporateFlagshipSlug(slug = "") {
  return getPageKind(slug) !== "legacy";
}

export function buildCanonicalHvacPageModel({ page = null, site = null } = {}) {
  if (!page) return null;
  const sections = Array.isArray(page?.content?.sections)
    ? page.content.sections
    : [];
  const records = sections
    .filter((section) => section?.type !== "pageStyle" && section?.type !== "popupCta" && section?.type !== "footer")
    .map(createSectionRecord);
  const assigned = assignSlotsFromPool(records);

  const pages = dedupePages(Array.isArray(site?.pages) ? site.pages : site?.pages_meta || []);
  const slug = String(page?.slug || "").trim().toLowerCase();
  const pageKind = getPageKind(slug);
  const homePage = pages.find((item) => String(item?.slug || "").toLowerCase() === "home");
  const homeRecords = Array.isArray(homePage?.content?.sections)
    ? homePage.content.sections
        .filter((section) => section?.type !== "pageStyle" && section?.type !== "popupCta" && section?.type !== "footer")
        .map(createSectionRecord)
    : [];
  const homeAssigned = homeRecords.length ? assignSlotsFromPool(homeRecords) : null;
  const withHomeFallback = (slotName) =>
    assigned[slotName] ||
    (pageKind !== "home" ? homeAssigned?.[slotName] || null : null);
  const withHomeFallbackArray = (slotName) =>
    assigned[slotName]?.length
      ? assigned[slotName]
      : pageKind !== "home" && homeAssigned?.[slotName]?.length
      ? homeAssigned[slotName]
      : [];

  return {
    page,
    slug,
    pageKind,
    title: page?.title || page?.menu_title || slug,
    sections: records,
    slots: {
      hero: withHomeFallback("hero"),
      trustRail: withHomeFallback("trustRail"),
      services: withHomeFallback("services"),
      problemSelector: withHomeFallback("problemSelector"),
      featureSlider: withHomeFallback("featureSlider"),
      stats: withHomeFallback("stats"),
      plans: withHomeFallback("plans"),
      project: withHomeFallback("project"),
      process: withHomeFallback("process"),
      reviews: withHomeFallback("reviews"),
      faq: withHomeFallback("faq"),
      contact: withHomeFallback("contact"),
      map: withHomeFallback("map"),
      finalCta: withHomeFallback("finalCta"),
      richTextBlocks: withHomeFallbackArray("richTextBlocks"),
      galleries: withHomeFallbackArray("galleries"),
    },
    relatedPages: {
      all: pages,
      services: pages.filter((item) => SERVICES_SLUGS.has(String(item?.slug || "").toLowerCase())),
      about: pages.filter((item) => ABOUT_SLUGS.has(String(item?.slug || "").toLowerCase())),
      projects: pages.filter((item) => PROJECT_SLUGS.has(String(item?.slug || "").toLowerCase())),
      reviews: pages.filter((item) => REVIEWS_SLUGS.has(String(item?.slug || "").toLowerCase())),
      contact: pages.filter((item) => CONTACT_SLUGS.has(String(item?.slug || "").toLowerCase())),
    },
    extras: assigned.extras,
  };
}
