import { nanoid } from "nanoid";

export const SEMANTIC_MODULE_LABELS = {
  hero: "Hero",
  richText: "Rich Text",
  services: "Services",
  reviews: "Reviews",
  faq: "FAQ",
  gallery: "Gallery",
  map: "Map",
  contactForm: "Contact Form",
  cta: "Call To Action",
  video: "Video",
  team: "Team",
  pricing: "Pricing",
  stats: "Stats",
  trustRail: "Trust Rail",
  serviceAreas: "Service Areas",
  beforeAfter: "Before / After",
  portfolio: "Portfolio",
};

export const OLD_BLOCK_MIGRATION_STATUS = {
  hero: "normalized",
  heroCarousel: "normalized",
  heroSplit: "normalized",
  serviceGrid: "normalized",
  serviceHoverSlider: "normalized",
  testimonials: "normalized",
  reviewEditorialGrid: "normalized",
  faq: "normalized",
  gallery: "normalized",
  galleryCarousel: "normalized",
  mapEmbed: "normalized",
  contactForm: "normalized",
  contact: "normalized",
  richText: "normalized",
  featureZigzag: "normalized",
  featureZigzagModern: "normalized",
  featurePillars: "normalized",
  pricingTable: "normalized",
  team: "normalized",
  teamGrid: "normalized",
  teamMetrics: "normalized",
  stats: "normalized",
  logoCloud: "normalized",
  logoCarousel: "normalized",
  bookingCtaBar: "normalized",
  popupCta: "normalized",
  pageStyle: "classic-only",
  footer: "classic-only",
  videoStorySplit: "unsupported",
  videoGallery: "unsupported",
  blogList: "deprecated",
};

export const OLD_BLOCK_TO_MODULE = {
  hero: "hero",
  heroCarousel: "hero",
  heroSplit: "hero",
  serviceGrid: "services",
  serviceHoverSlider: "services",
  testimonials: "reviews",
  reviewEditorialGrid: "reviews",
  faq: "faq",
  gallery: "gallery",
  galleryCarousel: "gallery",
  mapEmbed: "map",
  contact: "contactForm",
  contactForm: "contactForm",
  richText: "richText",
  featureZigzag: "richText",
  featureZigzagModern: "richText",
  featurePillars: "richText",
  pricingTable: "pricing",
  team: "team",
  teamGrid: "team",
  teamMetrics: "stats",
  stats: "stats",
  logoCloud: "trustRail",
  logoCarousel: "trustRail",
};

export const GLOBAL_FEATURE_TYPES = {
  popupCta: true,
  bookingCtaBar: true,
  googleReviewCta: true,
  chatbot: true,
  announcement: true,
  cookieNotice: true,
  floatingContactActions: true,
  socials: true,
};

export function inferPageKind(page = {}) {
  const slug = String(page?.slug || "").trim().toLowerCase();
  if (page?.is_homepage || slug === "home") return "home";
  if (["services", "services-classic", "pricing"].includes(slug)) return "services";
  if (["about", "team", "our-team"].includes(slug)) return "about";
  if (["gallery", "projects", "fleet"].includes(slug)) return "projects";
  if (slug === "reviews") return "reviews";
  if (["contact", "request-quote", "request-service"].includes(slug)) return "contact";
  if (["locations", "service-areas"].includes(slug)) return "service-areas";
  if (slug === "faq") return "faq";
  if (["privacy", "terms", "cookies", "policies"].includes(slug)) return "legal";
  return "generic";
}

export function normalizePageContent(content = {}) {
  if (!content || typeof content !== "object") {
    return { sections: [], modules: [], meta: {} };
  }
  return {
    ...content,
    sections: Array.isArray(content.sections) ? content.sections : [],
    modules: Array.isArray(content.modules) ? content.modules : [],
    meta: content.meta && typeof content.meta === "object" ? content.meta : {},
  };
}

export function defaultSlotForModule(pageKind, moduleType) {
  const page = String(pageKind || "generic");
  if (moduleType === "hero") return `${page}.hero`;
  if (page === "contact") {
    if (moduleType === "map") return "contact.map";
    if (moduleType === "contactForm") return "contact.form";
    return "contact.afterIntro";
  }
  if (page === "services") {
    if (moduleType === "services") return "services.list";
    return "services.afterList";
  }
  if (page === "about") {
    if (moduleType === "team") return "about.team";
    return "about.story";
  }
  if (page === "home") {
    if (["services", "stats", "trustRail"].includes(moduleType)) return "home.primaryContent";
    if (["reviews", "gallery", "faq", "serviceAreas", "beforeAfter", "portfolio"].includes(moduleType)) return "home.afterServices";
    if (["cta", "contactForm", "map"].includes(moduleType)) return "home.beforeContact";
    return "home.afterHero";
  }
  return `${page}.primaryContent`;
}

function normalizeCta(props = {}, includeSecondary = false) {
  const primaryLabel = props.ctaText || props.primaryCtaLabel || props.buttonText || "";
  const primaryHref = props.ctaLink || props.primaryCtaHref || props.buttonLink || "";
  const secondaryLabel = props.secondaryCtaText || props.secondaryCtaLabel || "";
  const secondaryHref = props.secondaryCtaLink || props.secondaryCtaHref || "";
  const next = {};
  if (primaryLabel || primaryHref) next.primaryCta = { label: primaryLabel || "Learn more", href: primaryHref || "#" };
  if (includeSecondary && (secondaryLabel || secondaryHref)) {
    next.secondaryCta = { label: secondaryLabel || "Learn more", href: secondaryHref || "#" };
  }
  return next;
}

function normalizeRepeaterItems(items = []) {
  return (Array.isArray(items) ? items : []).flatMap((item, index) => {
    if (typeof item === "string" && item.trim()) {
      return [{ id: nanoid(10), title: item.trim(), body: "" }];
    }
    if (!item || typeof item !== "object") return [];
    return [
      {
        id: String(item.id || nanoid(10)),
        title: item.title || item.name || item.label || item.question || item.author || "",
        body: item.body || item.description || item.answer || item.quote || item.caption || "",
        imageUrl: item.imageUrl || item.image || "",
        quote: item.quote || "",
        author: item.author || "",
        role: item.role || "",
        rating: item.rating ?? "",
        price: item.price || "",
        features: Array.isArray(item.features) ? item.features : [],
        href: item.href || item.link || "",
        order: index,
      },
    ];
  });
}

function normalizeGalleryItems(items = []) {
  return (Array.isArray(items) ? items : []).flatMap((item) => {
    if (typeof item === "string" && item.trim()) {
      return [{ id: nanoid(10), imageUrl: item.trim(), caption: "", href: "" }];
    }
    if (!item || typeof item !== "object") return [];
    const imageUrl = item.imageUrl || item.image || item.src || item.url || "";
    if (!imageUrl) return [];
    return [
      {
        id: String(item.id || nanoid(10)),
        imageUrl,
        caption: item.caption || item.title || item.label || "",
        href: item.href || item.link || "",
      },
    ];
  });
}

function normalizeModuleFromSection(section = {}, pageKind = "generic") {
  const rawType = String(section.type || "").trim();
  const type = OLD_BLOCK_TO_MODULE[rawType];
  if (!type || GLOBAL_FEATURE_TYPES[type]) return null;
  const props = section.props && typeof section.props === "object" ? section.props : {};
  const base = {
    id: String(section.id || nanoid(10)),
    type,
    enabled: section.enabled !== false,
    slot: section.slot || defaultSlotForModule(pageKind, type),
    order: section.order ?? null,
    variant: section.variant || rawType,
    content: {},
    settings: {
      sourceType: rawType,
      legacySectionId: section.id || null,
      normalizationStatus: OLD_BLOCK_MIGRATION_STATUS[rawType] || "deprecated",
    },
  };
  switch (type) {
    case "hero":
      base.content = {
        eyebrow: props.eyebrow || "",
        heading: props.heading || props.title || "",
        subheading: props.subheading || props.description || "",
        imageUrl: props.image || props.backgroundUrl || "",
        ...normalizeCta(props, true),
      };
      break;
    case "services":
    case "reviews":
    case "faq":
    case "pricing":
    case "team":
    case "stats":
    case "trustRail":
      base.content = {
        heading: props.title || props.heading || "",
        intro: props.subtitle || props.description || "",
        items: normalizeRepeaterItems(props.items || props.plans || props.logos || props.members || props.team || []),
        source: type === "reviews" ? "marketing" : undefined,
      };
      break;
    case "gallery":
      base.content = {
        heading: props.title || props.heading || "",
        intro: props.subtitle || props.description || "",
        items: normalizeGalleryItems(props.items || props.images || []),
      };
      break;
    case "map":
      base.content = {
        heading: props.title || props.heading || "",
        intro: props.subtitle || props.description || "",
        query: props.query || props.address || "",
        embedUrl: props.embedUrl || "",
        zoom: props.zoom || "",
      };
      break;
    case "contactForm":
      base.content = {
        heading: props.title || props.heading || "",
        intro: props.subtitle || props.description || "",
        formKey: props.formKey || props.key || "contact",
      };
      break;
    case "richText":
      base.content = {
        heading: props.title || props.heading || "",
        body: props.body || props.description || props.text || "",
        ...normalizeCta(props, false),
      };
      break;
    default:
      break;
  }
  return base;
}

export function normalizeSemanticModules(page = {}) {
  const content = normalizePageContent(page.content);
  const pageKind = inferPageKind(page);
  const modules = [];
  const seen = new Set();

  (Array.isArray(content.modules) ? content.modules : []).forEach((module) => {
    if (!module || typeof module !== "object" || !module.type) return;
    const id = String(module.id || nanoid(10));
    if (seen.has(id)) return;
    seen.add(id);
    modules.push({
      id,
      type: String(module.type),
      enabled: module.enabled !== false,
      slot: module.slot || defaultSlotForModule(pageKind, module.type),
      order: module.order ?? null,
      variant: module.variant || null,
      content: module.content && typeof module.content === "object" ? module.content : {},
      settings: module.settings && typeof module.settings === "object" ? module.settings : {},
    });
  });

  (Array.isArray(content.sections) ? content.sections : []).forEach((section) => {
    const normalized = normalizeModuleFromSection(section, pageKind);
    if (!normalized) return;
    const key = `${normalized.type}:${normalized.slot}`;
    if (modules.some((module) => `${module.type}:${module.slot}` === key)) return;
    modules.push(normalized);
  });

  return modules;
}

export function withNormalizedModules(page = {}) {
  const content = normalizePageContent(page.content);
  return {
    ...page,
    content: {
      ...content,
      modules: normalizeSemanticModules(page),
    },
  };
}

export function createSemanticModule(moduleType, page = {}, slot) {
  const pageKind = inferPageKind(page);
  const base = {
    id: nanoid(10),
    type: moduleType,
    enabled: true,
    slot: slot || defaultSlotForModule(pageKind, moduleType),
    order: null,
    variant: null,
    content: {},
    settings: { createdInBuilder: true },
  };
  switch (moduleType) {
    case "hero":
      base.content = {
        eyebrow: "",
        heading: page?.title || "",
        subheading: "",
        imageUrl: "",
        primaryCta: { label: "Learn more", href: "#" },
        secondaryCta: { label: "", href: "" },
      };
      break;
    case "richText":
      base.content = { heading: "Section heading", body: "Add supporting copy here.", primaryCta: { label: "", href: "" } };
      break;
    case "services":
    case "reviews":
    case "faq":
    case "gallery":
    case "team":
    case "pricing":
    case "stats":
    case "trustRail":
    case "serviceAreas":
    case "beforeAfter":
    case "portfolio":
      base.content = { heading: SEMANTIC_MODULE_LABELS[moduleType], intro: "", items: [] };
      if (moduleType === "reviews") base.content.source = "marketing";
      break;
    case "map":
      base.content = { heading: "Find us", intro: "", query: "", embedUrl: "", zoom: "" };
      break;
    case "contactForm":
      base.content = { heading: "Contact us", intro: "", formKey: "contact" };
      break;
    case "cta":
      base.content = { heading: "Ready to get started?", body: "", primaryCta: { label: "Get in touch", href: "/contact" } };
      break;
    case "video":
      base.content = { heading: "Video", body: "", videoUrl: "" };
      break;
    default:
      break;
  }
  return base;
}
