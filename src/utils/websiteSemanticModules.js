import { nanoid } from "nanoid";

export const SEMANTIC_MODULE_LABELS = {
  hero: "Hero",
  richText: "Text",
  services: "Services",
  reviews: "Reviews",
  faq: "FAQ",
  gallery: "Gallery",
  selectedCuts: "Selected Cuts",
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
  selectedCuts: "MEDIA",
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

export const IRON_EMBER_PROJECT_GALLERY_ITEMS = [
  { id: "studio-ritual", title: "Studio Ritual", caption: "The chair, tools, and measured pace before the first cut.", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=85", imageAlt: "A warm, low-lit barbershop chair and tools prepared for an appointment.", href: "", link: "" },
  { id: "precision-fade", title: "Precision Fade", caption: "Controlled graduation shaped to settle cleanly between visits.", image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1400&q=85", imageAlt: "Barber refining a precise fade on the side of a client's haircut.", href: "", link: "" },
  { id: "beard-balance", title: "Beard Balance", caption: "Outline, density, and proportion brought back into balance.", image: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1400&q=85", imageAlt: "Barber carefully shaping a client's beard and refining its outline.", href: "", link: "" },
  { id: "craft-detail", title: "Craft Detail", caption: "Close finishing work that holds the whole shape together.", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1400&q=85", imageAlt: "Close-up of barber hands and tools during detailed grooming work.", href: "", link: "" },
  { id: "texture-work", title: "Texture Work", caption: "Movement and weight refined with comb and shear work.", image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=85", imageAlt: "Barber working texture through a client's hair with a comb and scissors.", href: "", link: "" },
  { id: "final-direction", title: "Final Direction", caption: "The finishing pass, styled for an easier everyday routine.", image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=85", imageAlt: "Barber completing the final styling of a finished haircut.", href: "", link: "" },
];

const isLegacyEventGalleryModule = (module) => {
  if (!["gallery", "portfolio"].includes(String(module?.type || ""))) return false;
  const items = Array.isArray(module?.content?.items) ? module.content.items : [];
  return items.length >= 4 && items.every((item) =>
    String(item?.imageUrl || item?.image || "").includes("/website/enterprise-events-aurora/")
  );
};

export function createIronEmberProjectGalleryModule(page = {}) {
  const module = createSemanticModule("gallery", page, "projects.primaryContent");
  return {
    ...module,
    content: {
      heading: "Selected work.",
      intro: "Six studio studies in shape, texture, detail, and finish.",
      items: IRON_EMBER_PROJECT_GALLERY_ITEMS.map((item) => ({ ...item })),
    },
    settings: { ...module.settings, starterBlueprint: "iron-ember-projects-gallery-v1" },
  };
}

// A legacy events template could leave two generic gallery modules on an Iron
// Ember Projects page. Upgrade only that exact untouched asset family; any
// manager-authored gallery is preserved byte-for-byte.
export function upgradeLegacyIronEmberProjectGallery(page = {}) {
  const modules = normalizeSemanticModules(page);
  const legacyModules = modules.filter(isLegacyEventGalleryModule);
  if (!legacyModules.length) return page;
  const target = legacyModules.find((module) => module.type === "gallery") || legacyModules[0];
  const starter = createIronEmberProjectGalleryModule(page);
  const legacyIds = new Set(legacyModules.map((module) => String(module.id)));
  const nextModules = modules
    .filter((module) => !legacyIds.has(String(module.id)) || String(module.id) === String(target.id))
    .map((module) => String(module.id) === String(target.id)
      ? {
          ...module,
          type: "gallery",
          slot: "projects.primaryContent",
          content: starter.content,
          settings: { ...module.settings, starterBlueprint: "iron-ember-projects-gallery-v1" },
        }
      : module);
  return {
    ...page,
    content: {
      ...normalizePageContent(page.content || {}),
      modules: nextModules,
    },
  };
}

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
  if (["products", "products-classic"].includes(slug)) return "products";
  if (slug === "product-detail") return "product-detail";
  if (slug.startsWith("service-") && slug !== "service-areas") return "service-detail";
  if (["about", "team", "our-team"].includes(slug)) return "about";
  if (["gallery", "projects", "projects-gallery", "portfolio", "fleet"].includes(slug)) return "projects";
  if (["blog", "journal", "news"].includes(slug)) return "blog";
  if (slug === "reviews") return "reviews";
  if (slug === "jobs") return "jobs";
  if (slug === "job-detail") return "job-detail";
  if (["contact", "request-quote", "request-service"].includes(slug)) return "contact";
  if (["locations", "service-areas"].includes(slug)) return "service-areas";
  if (slug === "faq") return "faq";
  if (["privacy", "terms", "cookies", "policies"].includes(slug)) return "legal";
  return "generic";
}

// Classic pages can store an iframe string as their hero/body because the old
// renderer mounted an entire catalogue page there. It remains valid Classic
// data, but it is not editable public copy for a Next semantic hero.
export function sanitizeNextJsEditableText(value) {
  const text = String(value || "").trim();
  const normalized = text.toLowerCase();
  if (
    normalized.includes("<iframe") &&
    (
      /[?&](?:embed=1|mode=modal|dialog=1)(?:[&#"']|$)/.test(normalized) ||
      ["/{{slug}}/services", "/{{slug}}/products", "/{{slug}}/reviews", "/{{slug}}/jobs"].some((marker) => normalized.includes(marker))
    )
  ) {
    return "";
  }
  return text;
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

/**
 * WebsiteMedia is owned by the existing backend/media library.  The media
 * picker returns an absolute URL for immediate browser preview, but storing a
 * local origin in canonical Next.js page content makes that content portable
 * only to that one machine.  Keep the established stable media-file reference
 * in semantic modules; tenant-web-next resolves it against its configured
 * backend origin at render time.
 *
 * This intentionally leaves external starter/CDN URLs untouched and is used
 * only by the Next.js semantic editing path (not the Classic section model).
 */
export function normalizeWebsiteMediaReference(value) {
  if (typeof value !== "string") return value;
  const raw = value.trim();
  if (!raw) return value;

  const canonicalizeMediaPath = (pathname, suffix = "") => {
    const directMatch = pathname.match(/^\/api\/website\/media\/file\/(\d+)\/(.+)$/i);
    if (directMatch) {
      const [, companyId, storedNamePath] = directMatch;
      const nestedMatch = String(storedNamePath || "").match(
        /(?:^|\/)company\/\d+\/website-media\/([^/?#]+)$/i
      );
      const storedName = nestedMatch ? nestedMatch[1] : storedNamePath;
      return `/api/website/media/file/${companyId}/${storedName}${suffix}`;
    }

    const legacyMatch = pathname.match(
      /(?:^|\/)company\/(\d+)\/website-media\/([^/?#]+)$/i
    );
    if (legacyMatch) {
      const [, companyId, storedName] = legacyMatch;
      return `/api/website/media/file/${companyId}/${storedName}${suffix}`;
    }

    return `${pathname}${suffix}`;
  };

  try {
    const url = new URL(raw);
    if (
      url.pathname.startsWith("/api/website/media/file/") ||
      /(?:^|\/)company\/\d+\/website-media\//i.test(url.pathname)
    ) {
      return canonicalizeMediaPath(url.pathname, `${url.search}${url.hash}`);
    }
  } catch (_) {
    if (
      raw.startsWith("/api/website/media/file/") ||
      /(?:^|\/)company\/\d+\/website-media\//i.test(raw)
    ) {
      return canonicalizeMediaPath(raw);
    }
    // Relative media references and non-URL text are already canonical.
  }
  return value;
}

/**
 * The existing Website Media endpoint stores both images and uploaded video
 * files. Semantic Next.js modules persist the same stable URL string for
 * either kind, so the Builder must determine which preview element to use
 * without introducing a second media record or persistence field.
 *
 * Keep this deliberately aligned with the legacy video controls: MP4 and
 * WebM are the supported uploaded formats. Query strings and URL fragments
 * are ignored when checking the extension.
 */
export function isWebsiteVideoReference(value) {
  const candidate = value && typeof value === "object"
    ? value.url || value.url_public || value.file_url || value.src || value.stored_name
    : value;
  const declaredType = value && typeof value === "object"
    ? String(value.file_type || value.mime_type || value.content_type || "").toLowerCase()
    : "";
  if (declaredType === "video" || declaredType.startsWith("video/")) return true;
  const clean = String(candidate || "").trim().split(/[?#]/, 1)[0].toLowerCase();
  return /\.(?:mp4|webm)$/.test(clean);
}

export function normalizeSemanticModuleMediaReferences(value) {
  if (typeof value === "string") return normalizeWebsiteMediaReference(value);
  if (Array.isArray(value)) return value.map(normalizeSemanticModuleMediaReferences);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, normalizeSemanticModuleMediaReferences(entry)])
  );
}

export function normalizeSemanticFieldPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let next = raw.replace(/^content\./, "");
  if (next.startsWith("people.")) {
    next = next.replace(/^people\./, "items.");
  }
  return next;
}

export function candidateSemanticFieldPaths(value) {
  const normalized = normalizeSemanticFieldPath(value);
  if (!normalized) return [];
  const candidates = new Set([normalized, `content.${normalized}`]);
  const match = normalized.match(/^items\.(\d+)\.(.+)$/);
  if (match) {
    const [, index, field] = match;
    if (field === "title" || field === "question" || field === "name") {
      candidates.add(`content.items.${index}.title`);
      candidates.add(`content.items.${index}.question`);
      candidates.add(`content.items.${index}.name`);
      candidates.add(`content.people.${index}.name`);
    }
    if (field === "body" || field === "answer" || field === "bio") {
      candidates.add(`content.items.${index}.body`);
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
  if (page === "products") {
    if (["faq", "reviews", "cta", "trustRail"].includes(moduleType)) return "products.supporting";
    return "products.intro";
  }
  if (page === "jobs") {
    if (["faq", "reviews", "cta", "trustRail"].includes(moduleType)) return "jobs.supporting";
    return "jobs.intro";
  }
  if (page === "reviews") {
    if (moduleType === "reviews" || moduleType === "reviewSummary") return "reviews.list";
    if (["stats", "trustRail", "cta"].includes(moduleType)) return "reviews.supporting";
    return "reviews.intro";
  }
  if (page === "about") {
    if (moduleType === "team") return "about.team";
    return "about.story";
  }
  if (page === "home") {
    if (moduleType === "selectedCuts") return "home.selectedCuts";
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
      body: item.body || item.description || item.answer || item.quote || item.text || item.caption || "",
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
      badge: item.badge || "",
      ratingLabel: item.ratingLabel || "",
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
        signaturePanelEnabled: props.signaturePanelEnabled !== false,
        signaturePanelServiceLimit: Math.max(1, Math.min(10, Number(props.signaturePanelServiceLimit) || 4)),
        signaturePanelEyebrow: props.signaturePanelEyebrow || "",
        signaturePanelBody: props.signaturePanelBody || "",
        marqueeTopItems: Array.isArray(props.marqueeTopItems) ? props.marqueeTopItems : [],
        marqueeBottomItems: Array.isArray(props.marqueeBottomItems) ? props.marqueeBottomItems : [],
        image,
        imageUrl: image,
        imageAlt: props.imageAlt || props.alt || "",
        secondaryImages,
        ...normalizeCta(props, true),
      };
      }
      break;
    case "services":
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
    case "reviews":
      base.content = {
        heading: props.title || props.heading || "",
        intro: props.subtitle || props.description || "",
        // reviewEditorialGrid uses entries rather than items. Retain those
        // existing WebsitePage-owned testimonials during semantic conversion.
        items: normalizeRepeaterItems(props.items || props.entries || props.testimonials || []),
        source: "marketing",
        reviewCountLabel: props.reviewCountLabel || "",
        platformLabel: props.platformLabel || "",
        titleAlign: props.titleAlign || "center",
        maxWidth: props.maxWidth || "xl",
        ...normalizeCta(props),
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
        ...normalizeCta(props),
      };
      break;
    case "contactForm":
      base.content = {
        heading: props.title || props.heading || "",
        intro: props.subtitle || props.description || "",
        formKey: props.formKey || props.key || "contact",
        submitLabel: props.submitLabel || props.buttonLabel || "Send",
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
        ...normalizeCta(props),
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
      content:
        module.content && typeof module.content === "object"
          ? normalizeSemanticModuleMediaReferences(module.content)
          : {},
      settings: module.settings && typeof module.settings === "object" ? module.settings : {},
    });
  });

  const hasCanonicalStarterBlueprint = modules.some((module) =>
    String(module?.settings?.starterBlueprint || "").trim()
  );
  // A marked Next starter blueprint is the complete Builder composition.
  // Legacy JSON remains persisted for Classic compatibility and rollback, but
  // must not leak old template blocks back into the modern preview on save.
  if (hasCanonicalStarterBlueprint) return modules;

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
        signaturePanelEnabled: true,
        signaturePanelServiceLimit: 4,
        signaturePanelEyebrow: "",
        signaturePanelBody: "",
        marqueeTopItems: [
          "Cut Rituals",
          "Fade Detail",
          "Beard Architecture",
          "Consultation First",
          "Queen West Studio",
        ],
        marqueeBottomItems: [
          "Measured barbering",
          "Sharp finishing",
          "Texture work",
          "Low-noise appointments",
          "Routine-ready shape",
        ],
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
        primaryCta: { label: "Contact us", href: "/contact" },
      };
      break;
    case "contactForm":
      base.content = { heading: "Contact us", intro: "", formKey: "contact", submitLabel: "Send" };
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
      base.content = { heading: "Find us", intro: "", query: "", address: "", embedUrl: "", zoom: "", primaryCta: { label: "Open map", href: "" } };
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
    case "selectedCuts":
      base.content = {
        eyebrow: "Selected cuts",
        heading: "Fresh from the chair.",
        intro: "Eight studies in shape, texture, detail, and finish.",
        items: [
          { id: "precision-fade", title: "Precision Fade", category: "Blend / Graduation", image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1400&q=85", imageAlt: "Barber shaping a precise fade with clippers", href: "" },
          { id: "beard-detailing", title: "Beard Detailing", category: "Outline / Balance", image: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1400&q=85", imageAlt: "Close beard detailing during a barber service", href: "" },
          { id: "scissor-finish", title: "Scissor Finish", category: "Shear Work / Shape", image: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1400&q=85", imageAlt: "Barber finishing a haircut with scissors", href: "" },
          { id: "consultation", title: "The Consultation", category: "Profile / Planning", image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1400&q=85", imageAlt: "Barber consulting with a client in the chair", href: "" },
          { id: "between-chairs", title: "Between Chairs", category: "Studio / Ritual", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=85", imageAlt: "Classic barber chair in a working studio", href: "" },
          { id: "texture-work", title: "Texture Work", category: "Movement / Control", image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=85", imageAlt: "Barber working texture into a modern haircut", href: "" },
          { id: "final-styling", title: "Final Styling", category: "Finish / Direction", image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=85", imageAlt: "Final styling and finishing touches in a barbershop", href: "" },
          { id: "craft-at-hand", title: "Craft at Hand", category: "Tools / Close Detail", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1400&q=85", imageAlt: "Barber tools and careful close-up craft detail", href: "" },
        ],
      };
      break;
    case "services":
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
      break;
    case "reviews":
      base.content = {
        heading: SEMANTIC_MODULE_LABELS[moduleType],
        intro: "",
        items: [],
        source: "marketing",
        reviewCountLabel: "",
        platformLabel: "",
        titleAlign: "center",
        maxWidth: "xl",
        primaryCta: { label: "", href: "" },
      };
      break;
    default:
      break;
  }

  return base;
}
