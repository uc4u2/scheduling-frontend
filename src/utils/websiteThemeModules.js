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
      "contact.intro": { allowedModuleTypes: ["contactIntro", "richText", "cta"], maxInstances: 2 },
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
      "reviews.primaryContent": { allowedModuleTypes: ["reviews"], maxInstances: 2, required: true },
      "reviews.supporting": { allowedModuleTypes: ["stats", "trustRail", "cta", "reviewSummary"], maxInstances: 4, fallbackSlot: "reviews.primaryContent" },
    },
  },
  projects: {
    slotRules: {
      "projects.primaryContent": { allowedModuleTypes: ["portfolio"], maxInstances: 2, required: true },
      "projects.supporting": { allowedModuleTypes: ["reviews", "gallery", "cta"], maxInstances: 4, fallbackSlot: "projects.primaryContent" },
    },
  },
  generic: {
    slotRules: {
      "generic.primaryContent": { allowedModuleTypes: ["richText", "faq", "gallery", "map", "cta", "reviews", "contactForm", "featureStory"], maxInstances: 8, required: true },
    },
  },
};

export const WEBSITE_THEME_MODULE_MANIFESTS = {
  "modern-gradient": { themeKey: "modern-gradient", pages: SHARED_PAGES },
  "eldora-dark": { themeKey: "eldora-dark", pages: SHARED_PAGES },
  "motion-editorial": { themeKey: "motion-editorial", pages: SHARED_PAGES },
  finwise: { themeKey: "finwise", pages: SHARED_PAGES },
  "iron-ember": { themeKey: "iron-ember", pages: SHARED_PAGES },
  "clear-clinic": { themeKey: "clear-clinic", pages: SHARED_PAGES },
  "harbor-line": { themeKey: "harbor-line", pages: SHARED_PAGES },
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
        label: SEMANTIC_MODULE_LABELS[moduleType] || moduleType,
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
