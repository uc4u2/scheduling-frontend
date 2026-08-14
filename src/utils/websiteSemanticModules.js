import { nanoid } from "nanoid";

export const SEMANTIC_MODULE_LABELS = {
  hero: "Hero",
  richText: "Text",
  services: "Services",
  reviews: "Reviews",
  faq: "FAQ",
  gallery: "Gallery",
  map: "Map",
  contactForm: "Contact Form",
  contactIntro: "Contact Intro",
  contactDetails: "Contact Details",
  hoursLocation: "Hours",
  locations: "Locations",
  cta: "CTA",
  bookingCta: "Booking CTA",
  video: "Video",
  team: "Team",
  pricing: "Pricing / Packages",
  stats: "Stats",
  trustRail: "Trust Logos",
  serviceAreas: "Service Areas",
  beforeAfter: "Before / After",
  portfolio: "Portfolio",
  process: "Process",
  featureStory: "Feature / Story",
  proofBand: "Proof / Results",
  reviewSummary: "Review Summary",
  schedule: "Schedule",
  programs: "Programs",
  results: "Results",
  classes: "Classes",
  memberships: "Memberships",
  treatments: "Treatments",
  providers: "Providers",
  visitProcess: "Visit Process",
  practiceAreas: "Practice Areas",
  attorneys: "Attorneys",
  listings: "Listings",
  propertyGallery: "Property Gallery",
  inquiry: "Inquiry",
  priceMenu: "Price Menu",
};

export const SEMANTIC_MODULE_GROUPS = {
  hero: "ESSENTIAL",
  richText: "ESSENTIAL",
  cta: "ESSENTIAL",
  bookingCta: "ESSENTIAL",
  services: "BUSINESS",
  team: "BUSINESS",
  pricing: "BUSINESS",
  stats: "BUSINESS",
  process: "BUSINESS",
  featureStory: "BUSINESS",
  reviews: "TRUST",
  trustRail: "TRUST",
  faq: "TRUST",
  proofBand: "TRUST",
  reviewSummary: "TRUST",
  gallery: "MEDIA",
  video: "MEDIA",
  beforeAfter: "MEDIA",
  portfolio: "MEDIA",
  contactForm: "LOCATION & CONTACT",
  contactIntro: "LOCATION & CONTACT",
  contactDetails: "LOCATION & CONTACT",
  map: "LOCATION & CONTACT",
  hoursLocation: "LOCATION & CONTACT",
  serviceAreas: "LOCATION & CONTACT",
  locations: "LOCATION & CONTACT",
  schedule: "PROFESSION",
  programs: "PROFESSION",
  treatments: "PROFESSION",
  practiceAreas: "PROFESSION",
  listings: "PROFESSION",
  memberships: "PROFESSION",
  results: "PROFESSION",
  classes: "PROFESSION",
  providers: "PROFESSION",
  visitProcess: "PROFESSION",
  attorneys: "PROFESSION",
  propertyGallery: "PROFESSION",
  inquiry: "PROFESSION",
  priceMenu: "PROFESSION",
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
  processSteps: "normalized",
  bookingCtaBar: "normalized",
  popupCta: "normalized",
  pageStyle: "classic-only",
  footer: "classic-only",
  videoStorySplit: "normalized",
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
  featureZigzag: "featureStory",
  featureZigzagModern: "featureStory",
  featurePillars: "featureStory",
  pricingTable: "pricing",
  team: "team",
  teamGrid: "team",
  teamMetrics: "stats",
  stats: "stats",
  logoCloud: "trustRail",
  logoCarousel: "trustRail",
  processSteps: "process",
  collectionShowcase: "portfolio",
  videoStorySplit: "video",
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
  if (slug.startsWith("service-") && slug !== "service-areas") return "service-detail";
  if (["about", "team", "our-team"].includes(slug)) return "about";
  if (["gallery", "projects", "portfolio", "fleet"].includes(slug)) return "projects";
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

export function normalizeSemanticFieldPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let next = raw.replace(/^content\./, "");
  if (next.startsWith("people.")) {
    next = next.replace(/^people\./, "items.");
  }
  next = next.replace(/^items\.(\d+)\.question$/, "items.$1.title");
  next = next.replace(/^items\.(\d+)\.answer$/, "items.$1.body");
  next = next.replace(/^items\.(\d+)\.name$/, "items.$1.title");
  next = next.replace(/^items\.(\d+)\.bio$/, "items.$1.body");
  return next;
}

export function candidateSemanticFieldPaths(value) {
  const normalized = normalizeSemanticFieldPath(value);
  if (!normalized) return [];
  const candidates = new Set([normalized, `content.${normalized}`]);
  const match = normalized.match(/^items\.(\d+)\.(.+)$/);
  if (match) {
    const [, index, field] = match;
    if (field === "title") {
      candidates.add(`content.items.${index}.question`);
      candidates.add(`content.items.${index}.name`);
      candidates.add(`content.people.${index}.name`);
    }
    if (field === "body") {
      candidates.add(`content.items.${index}.answer`);
      candidates.add(`content.items.${index}.bio`);
      candidates.add(`content.people.${index}.bio`);
    }
    if (field === "image") {
      candidates.add(`content.people.${index}.image`);
    }
    if (field === "role") {
      candidates.add(`content.people.${index}.role`);
    }
  }
  return Array.from(candidates);
}

export function defaultSlotForModule(pageKind, moduleType) {
  const page = String(pageKind || "generic");
  if (moduleType === "hero") return `${page}.hero`;
  if (page === "contact") {
    if (moduleType === "contactIntro") return "contact.intro";
    if (moduleType === "contactDetails") return "contact.details";
    if (moduleType === "contactForm") return "contact.form";
    if (moduleType === "map") return "contact.map";
    if (moduleType === "hoursLocation") return "contact.hours";
    if (moduleType === "locations") return "contact.locations";
    if (moduleType === "serviceAreas") return "contact.serviceAreas";
    if (moduleType === "bookingCta") return "contact.booking";
    return "contact.afterIntro";
  }
  if (page === "services") {
    if (moduleType === "services") return "services.list";
    if (["pricing", "trustRail", "process", "featureStory"].includes(moduleType)) return "services.afterList";
    return "services.intro";
  }
  if (page === "service-detail") {
    if (["richText", "featureStory", "process"].includes(moduleType)) return "service-detail.primaryContent";
    if (["reviews", "faq", "cta", "gallery", "beforeAfter", "team"].includes(moduleType)) return "service-detail.afterContent";
    return "service-detail.primaryContent";
  }
  if (page === "about") {
    if (moduleType === "team") return "about.team";
    return "about.story";
  }
  if (page === "home") {
    if (["services", "stats", "trustRail", "pricing"].includes(moduleType)) return "home.primaryContent";
    if (["reviews", "gallery", "faq", "serviceAreas", "beforeAfter", "portfolio", "proofBand", "reviewSummary"].includes(moduleType)) return "home.afterServices";
    if (["cta", "contactForm", "contactIntro", "contactDetails", "map", "hoursLocation", "locations", "bookingCta"].includes(moduleType)) return "home.beforeContact";
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

function pickMediaUrl(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeMediaItem(item = {}) {
  const image = pickMediaUrl(item.image, item.imageUrl, item.src, item.url);
  const avatar = pickMediaUrl(item.avatar, item.avatarUrl);
  const beforeImage = pickMediaUrl(item.beforeImage, item.beforeImageUrl, item.before, item.beforeUrl);
  const afterImage = pickMediaUrl(item.afterImage, item.afterImageUrl, item.after, item.afterUrl);
  const secondaryImage = pickMediaUrl(item.secondaryImage, item.secondaryImageUrl);
  return {
    image,
    imageUrl: image,
    imageAlt: item.imageAlt || item.alt || "",
    avatar,
    avatarAlt: item.avatarAlt || "",
    beforeImage,
    afterImage,
    beforeLabel: item.beforeLabel || item.beforeText || "",
    afterLabel: item.afterLabel || item.afterText || "",
    secondaryImage,
    secondaryImageAlt: item.secondaryImageAlt || "",
    backgroundImage: pickMediaUrl(item.backgroundImage, item.backgroundImageUrl, item.backgroundUrl),
  };
}

function normalizeRepeaterItems(items = []) {
  return (Array.isArray(items) ? items : []).flatMap((item, index) => {
    if (typeof item === "string" && item.trim()) {
      return [{ id: nanoid(10), title: item.trim(), body: "" }];
    }
    if (!item || typeof item !== "object") return [];
    const media = normalizeMediaItem(item);
    return [{
      id: String(item.id || nanoid(10)),
      title: item.title || item.name || item.label || item.question || item.author || "",
      body: item.body || item.description || item.answer || item.quote || item.caption || "",
      image: media.image,
      imageUrl: media.imageUrl,
      imageAlt: media.imageAlt,
      avatar: media.avatar,
      avatarAlt: media.avatarAlt,
      beforeImage: media.beforeImage,
      afterImage: media.afterImage,
      beforeLabel: media.beforeLabel,
      afterLabel: media.afterLabel,
      secondaryImage: media.secondaryImage,
      secondaryImageAlt: media.secondaryImageAlt,
      backgroundImage: media.backgroundImage,
      quote: item.quote || "",
      author: item.author || "",
      role: item.role || "",
      rating: item.rating ?? "",
      price: item.price || "",
      value: item.value || "",
      features: Array.isArray(item.features) ? item.features : [],
      href: item.href || item.link || "",
      link: item.link || item.href || "",
      location: item.location || "",
      tagline: item.tagline || "",
      caption: item.caption || "",
      name: item.name || "",
      order: index,
    }];
  });
}

function normalizeGalleryItems(items = []) {
  return (Array.isArray(items) ? items : []).flatMap((item) => {
    if (typeof item === "string" && item.trim()) {
      return [{ id: nanoid(10), image: item.trim(), imageUrl: item.trim(), imageAlt: "", caption: "", href: "", link: "" }];
    }
    if (!item || typeof item !== "object") return [];
    const media = normalizeMediaItem(item);
    const imageUrl = media.imageUrl;
    if (!imageUrl) return [];
    return [{
      id: String(item.id || nanoid(10)),
      image: media.image,
      imageUrl,
      imageAlt: media.imageAlt,
      caption: item.caption || item.title || item.label || "",
      href: item.href || item.link || "",
      link: item.link || item.href || "",
      title: item.title || item.label || "",
      body: item.body || item.description || "",
    }];
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
      {
        const image = pickMediaUrl(props.image, props.imageUrl, props.backgroundUrl);
        const secondaryImages = Array.isArray(props.secondaryImages)
          ? props.secondaryImages
              .map((value) => (typeof value === "string" ? value.trim() : ""))
              .filter(Boolean)
          : [];
      base.content = {
        eyebrow: props.eyebrow || "",
        heading: props.heading || props.title || "",
        subheading: props.subheading || props.description || "",
        image,
        imageUrl: image,
        imageAlt: props.imageAlt || props.alt || "",
        secondaryImages,
        ...normalizeCta(props, true),
      };
      }
      break;
    case "services":
    case "reviews":
    case "faq":
    case "pricing":
    case "team":
    case "stats":
    case "trustRail":
    case "serviceAreas":
    case "process":
    case "contactDetails":
    case "hoursLocation":
    case "locations":
    case "proofBand":
    case "reviewSummary":
    case "beforeAfter":
      base.content = {
        heading: props.title || props.heading || "",
        intro: props.subtitle || props.description || "",
        items: normalizeRepeaterItems(props.items || props.plans || props.logos || props.members || props.team || props.steps || props.locations || []),
        source: type === "reviews" ? "marketing" : undefined,
      };
      break;
    case "gallery":
    case "portfolio":
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
        address: props.address || "",
      };
      break;
    case "contactForm":
      base.content = {
        heading: props.title || props.heading || "",
        intro: props.subtitle || props.description || "",
        formKey: props.formKey || props.key || "contact",
      };
      break;
    case "contactIntro":
      base.content = {
        heading: props.title || props.heading || "",
        intro: props.subtitle || props.description || "",
        body: props.body || props.text || "",
        image: pickMediaUrl(props.image, props.imageUrl),
        imageUrl: pickMediaUrl(props.image, props.imageUrl),
        imageAlt: props.imageAlt || props.alt || "",
      };
      break;
    case "featureStory":
    case "richText":
      {
        const image = pickMediaUrl(props.image, props.imageUrl);
        const secondaryImage = pickMediaUrl(props.secondaryImage, props.secondaryImageUrl);
      base.content = {
        heading: props.title || props.heading || "",
        intro: props.subtitle || props.description || "",
        body: props.body || props.description || props.text || "",
        image,
        imageUrl: image,
        imageAlt: props.imageAlt || props.alt || "",
        secondaryImage,
        secondaryImageAlt: props.secondaryImageAlt || "",
        ...normalizeCta(props, false),
      };
      }
      break;
    case "video":
      {
        const poster = pickMediaUrl(props.poster, props.posterUrl, props.image, props.imageUrl);
        base.content = {
          heading: props.title || props.heading || "",
          intro: props.subtitle || props.description || "",
          body: props.body || props.text || props.description || "",
          videoUrl: props.videoUrl || props.video || props.url || props.embedUrl || "",
          embedUrl: props.videoUrl || props.video || props.url || props.embedUrl || "",
          posterImage: poster,
          posterUrl: poster,
          posterAlt: props.posterAlt || props.imageAlt || props.alt || "",
          ...normalizeCta(props, false),
        };
      }
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
        image: "",
        imageUrl: "",
        imageAlt: "",
        secondaryImages: [],
        primaryCta: { label: "Learn more", href: "#" },
        secondaryCta: { label: "", href: "" },
      };
      break;
    case "richText":
      base.content = {
        heading: "Section heading",
        body: "Add supporting copy here.",
        image: "",
        imageUrl: "",
        imageAlt: "",
        primaryCta: { label: "", href: "" },
      };
      break;
    case "contactIntro":
      base.content = {
        heading: "Get in touch",
        intro: "Introduce this page.",
        body: "",
        image: "",
        imageUrl: "",
        imageAlt: "",
      };
      break;
    case "contactForm":
      base.content = { heading: "Contact us", intro: "", formKey: "contact" };
      break;
    case "cta":
      base.content = {
        heading: "Ready to get started?",
        body: "",
        backgroundImage: "",
        primaryCta: { label: "Get in touch", href: "/contact" },
      };
      break;
    case "bookingCta":
      base.content = {
        heading: "Book now",
        body: "",
        backgroundImage: "",
        primaryCta: { label: "Book an appointment", href: "/contact" },
      };
      break;
    case "map":
      base.content = { heading: "Find us", intro: "", query: "", address: "", embedUrl: "", zoom: "" };
      break;
    case "video":
      base.content = { heading: "Video", body: "", videoUrl: "", embedUrl: "", posterImage: "", posterUrl: "", posterAlt: "" };
      break;
    case "featureStory":
      base.content = {
        heading: "Feature story",
        intro: "",
        body: "",
        image: "",
        imageUrl: "",
        imageAlt: "",
        secondaryImage: "",
        secondaryImageAlt: "",
        primaryCta: { label: "", href: "" },
      };
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
    case "process":
    case "contactDetails":
    case "hoursLocation":
    case "locations":
    case "proofBand":
    case "reviewSummary":
      base.content = { heading: SEMANTIC_MODULE_LABELS[moduleType], intro: "", items: [] };
      if (moduleType === "reviews") base.content.source = "marketing";
      break;
    default:
      break;
  }

  return base;
}
