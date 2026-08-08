import { SEMANTIC_MODULE_LABELS } from "./websiteSemanticModules";

const SHARED_PAGES = {
  home: {
    slotRules: {
      "home.hero": { allowedModuleTypes: ["hero"], maxInstances: 1, required: true },
      "home.afterHero": { allowedModuleTypes: ["richText", "stats", "trustRail", "cta"], maxInstances: 2, fallbackSlot: "home.primaryContent" },
      "home.primaryContent": { allowedModuleTypes: ["services", "reviews", "gallery", "faq", "stats", "trustRail", "team", "pricing"], maxInstances: 6, required: true },
      "home.afterServices": { allowedModuleTypes: ["reviews", "gallery", "faq", "serviceAreas", "beforeAfter", "portfolio", "richText"], maxInstances: 6, fallbackSlot: "home.primaryContent" },
      "home.beforeContact": { allowedModuleTypes: ["map", "contactForm", "cta", "richText"], maxInstances: 4, fallbackSlot: "home.afterServices" },
      "home.finalCta": { allowedModuleTypes: ["cta", "contactForm"], maxInstances: 2, fallbackSlot: "home.beforeContact" },
    },
  },
  about: {
    slotRules: {
      "about.story": { allowedModuleTypes: ["hero", "richText", "gallery", "stats"], maxInstances: 4 },
      "about.team": { allowedModuleTypes: ["team", "trustRail", "serviceAreas"], maxInstances: 3, fallbackSlot: "about.story" },
      "about.reviews": { allowedModuleTypes: ["reviews", "cta"], maxInstances: 3, fallbackSlot: "about.story" },
    },
  },
  services: {
    slotRules: {
      "services.intro": { allowedModuleTypes: ["hero", "richText"], maxInstances: 2 },
      "services.list": { allowedModuleTypes: ["services", "pricing", "trustRail"], maxInstances: 4, fallbackSlot: "services.intro" },
      "services.afterList": { allowedModuleTypes: ["faq", "reviews", "gallery", "cta", "serviceAreas"], maxInstances: 5, fallbackSlot: "services.list" },
    },
  },
  contact: {
    slotRules: {
      "contact.intro": { allowedModuleTypes: ["hero", "richText", "cta"], maxInstances: 3 },
      "contact.form": { allowedModuleTypes: ["contactForm"], maxInstances: 1, fallbackSlot: "contact.intro" },
      "contact.map": { allowedModuleTypes: ["map", "serviceAreas"], maxInstances: 2, fallbackSlot: "contact.form" },
    },
  },
  reviews: { slotRules: { "reviews.primaryContent": { allowedModuleTypes: ["reviews", "cta", "richText"], maxInstances: 4 } } },
  faq: { slotRules: { "faq.primaryContent": { allowedModuleTypes: ["faq", "cta", "richText"], maxInstances: 4 } } },
  "service-areas": {
    slotRules: { "service-areas.primaryContent": { allowedModuleTypes: ["serviceAreas", "map", "cta", "richText"], maxInstances: 4 } },
  },
  projects: {
    slotRules: { "projects.primaryContent": { allowedModuleTypes: ["gallery", "portfolio", "reviews", "cta", "richText"], maxInstances: 5 } },
  },
  generic: {
    slotRules: {
      "generic.primaryContent": {
        allowedModuleTypes: ["hero", "richText", "gallery", "faq", "reviews", "cta", "map", "contactForm", "stats", "trustRail", "team", "pricing"],
        maxInstances: 8,
      },
    },
  },
};

export const WEBSITE_THEME_MODULE_MANIFESTS = {
  "modern-gradient": { themeKey: "modern-gradient", pages: SHARED_PAGES },
  "eldora-dark": { themeKey: "eldora-dark", pages: SHARED_PAGES },
  "motion-editorial": { themeKey: "motion-editorial", pages: SHARED_PAGES },
  finwise: { themeKey: "finwise", pages: SHARED_PAGES },
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
      });
    });
  });
  return choices.sort((a, b) => a.label.localeCompare(b.label));
}

export function resolveFallbackSlot(themeKey, pageKind, moduleType, currentSlot) {
  const slotRules = getCompatibleSlots(themeKey, pageKind);
  if (slotRules[currentSlot]?.allowedModuleTypes?.includes(moduleType)) {
    return currentSlot;
  }
  const direct = Object.entries(slotRules).find(([, rule]) => (rule.allowedModuleTypes || []).includes(moduleType));
  return direct?.[0] || null;
}

