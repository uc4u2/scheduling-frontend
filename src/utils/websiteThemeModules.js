import { SEMANTIC_MODULE_GROUPS, SEMANTIC_MODULE_LABELS } from "./websiteSemanticModules";

const SHARED_PAGES = {
  home: {
    slotRules: {
      "home.hero": { allowedModuleTypes: ["hero"], maxInstances: 1, required: true },
      "home.afterHero": { allowedModuleTypes: ["richText", "stats", "trustRail", "process", "featureStory", "cta"], maxInstances: 4, fallbackSlot: "home.primaryContent" },
      "home.primaryContent": { allowedModuleTypes: ["services", "reviews", "pricing", "team", "stats", "trustRail"], maxInstances: 6, required: true },
      "home.afterServices": { allowedModuleTypes: ["reviews", "faq", "gallery", "portfolio", "beforeAfter", "serviceAreas", "proofBand", "reviewSummary"], maxInstances: 6, fallbackSlot: "home.primaryContent" },
      "home.beforeContact": { allowedModuleTypes: ["contactIntro", "contactDetails", "map", "hoursLocation", "locations", "contactForm", "bookingCta", "cta"], maxInstances: 6, fallbackSlot: "home.afterServices" },
      "home.finalCta": { allowedModuleTypes: ["cta", "contactForm", "bookingCta"], maxInstances: 2, fallbackSlot: "home.beforeContact" },
    },
  },
  about: {
    slotRules: {
      "about.intro": { allowedModuleTypes: ["hero", "richText", "featureStory"], maxInstances: 1 },
      "about.story": { allowedModuleTypes: ["richText", "featureStory", "gallery", "process", "stats"], maxInstances: 4, required: true },
      "about.team": { allowedModuleTypes: ["team", "trustRail", "serviceAreas"], maxInstances: 3, fallbackSlot: "about.story" },
      "about.reviews": { allowedModuleTypes: ["reviews", "faq", "cta"], maxInstances: 3, fallbackSlot: "about.story" },
    },
  },
  services: {
    slotRules: {
      "services.intro": { allowedModuleTypes: ["richText", "featureStory", "hero"], maxInstances: 2 },
      "services.list": { allowedModuleTypes: ["services"], maxInstances: 2, required: true },
      "services.afterList": { allowedModuleTypes: ["pricing", "reviews", "faq", "cta", "process", "featureStory", "gallery", "trustRail"], maxInstances: 6, fallbackSlot: "services.intro" },
    },
  },
  "service-detail": {
    slotRules: {
      "service-detail.primaryContent": { allowedModuleTypes: ["richText", "featureStory", "process"], maxInstances: 3, required: true },
      "service-detail.afterContent": { allowedModuleTypes: ["reviews", "faq", "cta", "gallery", "beforeAfter", "team"], maxInstances: 5, fallbackSlot: "service-detail.primaryContent" },
    },
  },
  contact: {
    slotRules: {
      "contact.intro": { allowedModuleTypes: ["hero", "contactIntro", "richText", "cta"], maxInstances: 2 },
      "contact.details": { allowedModuleTypes: ["contactDetails"], maxInstances: 2, fallbackSlot: "contact.intro" },
      "contact.form": { allowedModuleTypes: ["contactForm"], maxInstances: 1, required: true, fallbackSlot: "contact.intro" },
      "contact.map": { allowedModuleTypes: ["map"], maxInstances: 1, fallbackSlot: "contact.form" },
      "contact.hours": { allowedModuleTypes: ["hoursLocation"], maxInstances: 1, fallbackSlot: "contact.details" },
      "contact.locations": { allowedModuleTypes: ["locations", "serviceAreas"], maxInstances: 2, fallbackSlot: "contact.map" },
      "contact.booking": { allowedModuleTypes: ["bookingCta", "faq"], maxInstances: 2, fallbackSlot: "contact.form" },
    },
  },
  reviews: {
    slotRules: {
      "reviews.intro": { allowedModuleTypes: ["richText", "featureStory", "hero"], maxInstances: 2 },
      // Keep primaryContent for older WebsitePage rows. The published review
      // rail deliberately has its own slot so selecting it never opens an
      // unrelated legacy content module.
      "reviews.primaryContent": { allowedModuleTypes: ["richText", "featureStory", "hero"], maxInstances: 2 },
      "reviews.list": { allowedModuleTypes: ["reviews", "reviewSummary"], maxInstances: 2, required: true },
      "reviews.supporting": { allowedModuleTypes: ["stats", "trustRail", "cta"], maxInstances: 4, fallbackSlot: "reviews.list" },
    },
  },
  projects: {
    slotRules: {
      "projects.intro": { allowedModuleTypes: ["hero", "richText", "featureStory"], maxInstances: 1 },
      "projects.primaryContent": { allowedModuleTypes: ["portfolio"], maxInstances: 2, required: true },
      "projects.supporting": { allowedModuleTypes: ["reviews", "gallery", "cta"], maxInstances: 4, fallbackSlot: "projects.primaryContent" },
    },
  },
  blog: {
    slotRules: {
      "blog.intro": { allowedModuleTypes: ["hero", "richText", "featureStory"], maxInstances: 1 },
      "blog.primaryContent": { allowedModuleTypes: ["richText", "featureStory", "gallery"], maxInstances: 8, required: true },
      "blog.supporting": { allowedModuleTypes: ["faq", "reviews", "gallery", "cta"], maxInstances: 4, fallbackSlot: "blog.primaryContent" },
      "blog.finalCta": { allowedModuleTypes: ["cta", "bookingCta"], maxInstances: 2, fallbackSlot: "blog.supporting" },
    },
  },
  generic: {
    slotRules: {
      "generic.primaryContent": { allowedModuleTypes: ["richText", "faq", "gallery", "map", "cta", "reviews", "contactForm", "featureStory"], maxInstances: 8, required: true },
    },
  },
};

function ironEmberContentPage(introSlot) {
  return {
    slotRules: {
      [introSlot]: { allowedModuleTypes: ["hero", "richText", "featureStory"], maxInstances: 1 },
      "generic.primaryContent": { allowedModuleTypes: ["richText", "faq", "gallery", "map", "cta", "reviews", "contactForm", "featureStory"], maxInstances: 8 },
    },
  };
}

// Iron Ember's Journal is a normal canonical WebsitePage, not a separate
// blog CMS. Keep its supported Add Section choices explicit so the Builder
// presents the same page-specific editing contract as About or Contact.
const IRON_EMBER_PAGES = {
  ...SHARED_PAGES,
  home: {
    ...SHARED_PAGES.home,
    slotRules: {
      ...SHARED_PAGES.home.slotRules,
      "home.selectedCuts": { allowedModuleTypes: ["selectedCuts"], maxInstances: 1, fallbackSlot: "home.afterServices" },
    },
  },
  products: {
    slotRules: {
      "products.intro": { allowedModuleTypes: ["richText", "featureStory", "hero"], maxInstances: 2 },
      "products.supporting": { allowedModuleTypes: ["faq", "reviews", "cta", "trustRail"], maxInstances: 4, fallbackSlot: "products.intro" },
    },
  },
  jobs: {
    slotRules: {
      "jobs.intro": { allowedModuleTypes: ["richText", "featureStory", "hero"], maxInstances: 2 },
      "jobs.supporting": { allowedModuleTypes: ["faq", "reviews", "cta", "trustRail"], maxInstances: 4, fallbackSlot: "jobs.intro" },
    },
  },
  blog: {
    slotRules: {
      "blog.intro": { allowedModuleTypes: ["hero", "richText", "featureStory"], maxInstances: 1 },
      "blog.primaryContent": { allowedModuleTypes: ["richText", "featureStory", "gallery"], maxInstances: 4, required: true },
      "blog.supporting": { allowedModuleTypes: ["faq", "reviews", "cta"], maxInstances: 3, fallbackSlot: "blog.primaryContent" },
      "blog.finalCta": { allowedModuleTypes: ["cta", "bookingCta"], maxInstances: 2, fallbackSlot: "blog.supporting" },
    },
  },
  "service-areas": ironEmberContentPage("service-areas.intro"),
  faq: ironEmberContentPage("faq.intro"),
  legal: ironEmberContentPage("legal.intro"),
  generic: ironEmberContentPage("generic.intro"),
};

// Schedule is a reusable semantic concept, but only Forge Motion advertises a
// renderer for it in this campaign. Other frozen themes can opt in later
// without inheriting a section they do not yet render.
const FORGE_MOTION_PAGES = {
  ...SHARED_PAGES,
  home: {
    ...SHARED_PAGES.home,
    slotRules: {
      ...SHARED_PAGES.home.slotRules,
      "home.afterServices": {
        ...SHARED_PAGES.home.slotRules["home.afterServices"],
        allowedModuleTypes: [...SHARED_PAGES.home.slotRules["home.afterServices"].allowedModuleTypes, "schedule"],
      },
    },
  },
  generic: {
    ...SHARED_PAGES.generic,
    slotRules: {
      ...SHARED_PAGES.generic.slotRules,
      "generic.primaryContent": {
        ...SHARED_PAGES.generic.slotRules["generic.primaryContent"],
        allowedModuleTypes: [...SHARED_PAGES.generic.slotRules["generic.primaryContent"].allowedModuleTypes, "schedule"],
      },
    },
  },
};

// These are presentation labels only.  The module types and slots remain the
// shared semantic contract; Iron Ember simply uses more useful studio language
// for its deliberately composed Contact page.
const THEME_SLOT_LABELS = {
  "iron-ember": {
    "home.selectedcuts": "Selected Cuts",
    "contact.intro": "Contact Intro",
    "contact.details": "Studio Details",
    "contact.hours": "Studio Hours",
    "contact.map": "Studio Map",
    "contact.form": "Contact Form",
    "contact.booking": "Contact CTA",
  },
};

export function getThemeModuleDisplayLabel(themeKey, moduleType, slot) {
  const normalizedThemeKey = String(themeKey || "").trim().toLowerCase();
  const normalizedSlot = String(slot || "").trim().toLowerCase();
  const themeLabel = THEME_SLOT_LABELS[normalizedThemeKey]?.[normalizedSlot];
  return themeLabel || SEMANTIC_MODULE_LABELS[moduleType] || moduleType;
}

export const WEBSITE_THEME_MODULE_MANIFESTS = {
  "modern-gradient": { themeKey: "modern-gradient", pages: SHARED_PAGES },
  "eldora-dark": { themeKey: "eldora-dark", pages: SHARED_PAGES },
  "motion-editorial": { themeKey: "motion-editorial", pages: SHARED_PAGES },
  finwise: { themeKey: "finwise", pages: SHARED_PAGES },
  "iron-ember": { themeKey: "iron-ember", pages: IRON_EMBER_PAGES },
  "clear-clinic": { themeKey: "clear-clinic", pages: SHARED_PAGES },
  "harbor-line": { themeKey: "harbor-line", pages: SHARED_PAGES },
  "still-bloom": { themeKey: "still-bloom", pages: SHARED_PAGES },
  "black-letter": { themeKey: "black-letter", pages: SHARED_PAGES },
  "circuit-north": { themeKey: "circuit-north", pages: SHARED_PAGES },
  "solara-stay": { themeKey: "solara-stay", pages: SHARED_PAGES },
  "paw-and-pine": { themeKey: "paw-and-pine", pages: SHARED_PAGES },
  "quiet-harbor": { themeKey: "quiet-harbor", pages: SHARED_PAGES },
  "frame-and-field": { themeKey: "frame-and-field", pages: SHARED_PAGES },
  fieldcraft: { themeKey: "fieldcraft", pages: SHARED_PAGES },
  "lumea-clinic": { themeKey: "lumea-clinic", pages: SHARED_PAGES },
  "northstar-health": { themeKey: "northstar-health", pages: SHARED_PAGES },
  "axis-and-co": { themeKey: "axis-and-co", pages: SHARED_PAGES },
  "torque-house": { themeKey: "torque-house", pages: SHARED_PAGES },
  "velora-house": { themeKey: "velora-house", pages: SHARED_PAGES },
  "forge-motion": { themeKey: "forge-motion", pages: FORGE_MOTION_PAGES },
  "touchline-club": { themeKey: "touchline-club", pages: SHARED_PAGES },
};

export function getThemeModuleManifest(themeKey) {
  return WEBSITE_THEME_MODULE_MANIFESTS[String(themeKey || "").trim().toLowerCase()] || null;
}

export function getPageManifest(themeKey, pageKind) {
  const manifest = getThemeModuleManifest(themeKey);
  if (!manifest) return null;
  return manifest.pages[pageKind] || manifest.pages.generic || null;
}

export function getCompatibleSlots(themeKey, pageKind) {
  const pageManifest = getPageManifest(themeKey, pageKind);
  return pageManifest?.slotRules || {};
}

export function getCompatibleModuleChoices(themeKey, pageKind, modules = []) {
  const slotRules = getCompatibleSlots(themeKey, pageKind);
  const counts = {};
  (modules || []).forEach((module) => {
    const key = `${module.slot || ""}:${module.type || ""}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  const choices = [];
  Object.entries(slotRules).forEach(([slot, rule]) => {
    (rule.allowedModuleTypes || []).forEach((moduleType) => {
      const currentCount = counts[`${slot}:${moduleType}`] || 0;
      if (rule.maxInstances && currentCount >= rule.maxInstances) return;
      choices.push({
        slot,
        type: moduleType,
        label: getThemeModuleDisplayLabel(themeKey, moduleType, slot),
        group: SEMANTIC_MODULE_GROUPS[moduleType] || "OTHER",
      });
    });
  });
  return choices.sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
}

export function resolveFallbackSlot(themeKey, pageKind, moduleType, currentSlot) {
  const slotRules = getCompatibleSlots(themeKey, pageKind);
  if (slotRules[currentSlot]?.allowedModuleTypes?.includes(moduleType)) {
    return currentSlot;
  }
  const direct = Object.entries(slotRules).find(([, rule]) => (rule.allowedModuleTypes || []).includes(moduleType));
  return direct?.[0] || null;
}
