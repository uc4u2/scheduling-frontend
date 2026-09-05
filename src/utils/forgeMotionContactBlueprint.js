import {
  forgeMotionStarterRef,
  resolveForgeMotionStarterMedia,
} from "./forgeMotionStarterMedia";

const FORGE_CONTACT_HERO_IMAGE = forgeMotionStarterRef("contact");
const FORGE_CONTACT_CTA_IMAGE = forgeMotionStarterRef("hero");

const moduleRecord = (id, type, slot, order, content) => ({
  id,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "forge-motion-contact-v2",
    source: "forge-motion-premium-v2",
  },
});

export const FORGE_MOTION_CONTACT_STARTER_VERSION = 6;

export function createForgeMotionContactModules(companyId) {
  return resolveForgeMotionStarterMedia([
    moduleRecord("forge-contact-hero", "hero", "contact.hero", 0, {
      eyebrow: "Training inquiries",
      heading: "Contact",
      subheading:
        "Tell the coaching team what you want to improve, how you prefer to train, and what a realistic week looks like.",
      image: FORGE_CONTACT_HERO_IMAGE,
      imageUrl: FORGE_CONTACT_HERO_IMAGE,
      imageAlt: "Coach speaking with a client on a professional strength training floor.",
      posterImage: "",
      primaryCta: { label: "Explore training", href: "/services" },
    }),
    moduleRecord("forge-contact-intro", "contactIntro", "contact.intro", 1, {
      eyebrow: "Studio access",
      heading: "Details, location, and a direct line.",
      body: "Hours · location · direct inquiry",
    }),
    moduleRecord("forge-contact-details", "contactDetails", "contact.details", 2, {
      eyebrow: "Direct contact",
      heading: "Train with us.",
      intro:
        "Use the verified studio address, phone, and email below, or send a training inquiry for a clear next step.",
      items: [],
    }),
    moduleRecord("forge-contact-hours", "hoursLocation", "contact.hours", 3, {
      eyebrow: "Studio access",
      heading: "Studio hours.",
      intro:
        "These are staffed contact hours, not live appointment availability. Available sessions remain in the booking flow.",
      items: [
        { id: "forge-contact-hours-weekday", title: "Monday — Friday", body: "9:00 AM — 6:00 PM" },
        { id: "forge-contact-hours-saturday", title: "Saturday", body: "10:00 AM — 4:00 PM" },
        { id: "forge-contact-hours-sunday", title: "Sunday", body: "Closed" },
      ],
    }),
    moduleRecord("forge-contact-map", "map", "contact.map", 4, {
      eyebrow: "Location",
      heading: "Find the studio.",
      intro: "Use the verified studio address to plan the visit.",
      query: "",
      address: "",
      embedUrl: "",
      primaryCta: { label: "Get directions", href: "" },
    }),
    moduleRecord("forge-contact-form", "contactForm", "contact.form", 5, {
      eyebrow: "Training inquiry",
      heading: "Start your training inquiry.",
      intro:
        "Share the goal, preferred training format, and any useful context. This uses the existing Website Form and response flow.",
      formKey: "contact",
      submitLabel: "Send inquiry",
    }),
    moduleRecord("forge-contact-cta", "bookingCta", "contact.booking", 6, {
      eyebrow: "Choose your path",
      heading: "Ready to find the right training service?",
      body: "Compare the current coaching options, then continue through the existing booking flow.",
      backgroundImage: FORGE_CONTACT_CTA_IMAGE,
      backgroundPoster: "",
      backgroundImageAlt: "Strength training equipment prepared in a modern fitness studio.",
      primaryCta: { label: "View training services", href: "/services" },
    }),
  ], companyId);
}

const text = (value) => String(value || "").trim();
const lower = (value) => text(value).toLowerCase();
const isBlankOr = (value, values) => !text(value) || values.includes(lower(value));
const clone = (value) => JSON.parse(JSON.stringify(value));

const upgradeContent = (type, current, starter) => {
  const content = { ...(current || {}) };
  const setIfGeneric = (key, genericValues = []) => {
    if (isBlankOr(content[key], genericValues)) content[key] = starter[key];
  };

  if (type === "hero") {
    setIfGeneric("eyebrow", ["contact", "start the conversation"]);
    setIfGeneric("heading", ["contact"]);
    setIfGeneric("subheading", [
      "we would love to hear from you and meet you in person. share your address, contact details, hours, and a clear booking path beside the map.",
    ]);
    const image = text(content.image || content.imageUrl || content.backgroundImage);
    const legacyImage = image.includes("/website/enterprise-events-aurora/");
    if (!image || legacyImage) {
      content.image = starter.image;
      content.imageUrl = starter.imageUrl;
      delete content.backgroundImage;
    }
    if (isBlankOr(content.imageAlt, ["barber cutting a client's hair in a dark studio."])) {
      content.imageAlt = starter.imageAlt;
    }
    if (!content.posterImage) content.posterImage = starter.posterImage;
    if (
      !content.primaryCta?.label ||
      content.primaryCta?.href === "#" ||
      ["view services", "book appointment"].includes(lower(content.primaryCta?.label))
    ) {
      content.primaryCta = clone(starter.primaryCta);
    }
  }

  if (type === "contactDetails") {
    setIfGeneric("eyebrow", ["contact"]);
    setIfGeneric("heading", ["contact details", "studio details."]);
    setIfGeneric("intro", [
      "we would love to hear from you and meet you in person. share your address, contact details, hours, and a clear booking path beside the map.",
      "phone, email, and address continue to use the shared business contact settings.",
    ]);
    if (Array.isArray(content.items)) {
      content.items = content.items.map((item) => ({
        ...item,
        title:
          lower(item?.title) === "main location"
            ? "Studio location"
            : lower(item?.title) === "contact"
              ? "Phone & email"
              : item?.title,
      }));
    }
  }

  if (type === "hoursLocation") {
    setIfGeneric("eyebrow", ["hours"]);
    setIfGeneric("heading", ["office hours", "studio rhythm."]);
    setIfGeneric("intro", []);
    const items = Array.isArray(content.items) ? content.items : [];
    const denseLegacyRow = items.length === 1 && /monday\s*-\s*friday/i.test(text(items[0]?.body));
    if (!items.length || denseLegacyRow) content.items = clone(starter.items);
  }

  if (type === "map") {
    setIfGeneric("eyebrow", ["map"]);
    setIfGeneric("heading", ["contact details", "map"]);
    setIfGeneric("intro", []);
    const query = text(content.query || content.address);
    const directionsHref = query
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
      : "";
    if (!content.primaryCta?.label || content.primaryCta?.href === "#") {
      content.primaryCta = { ...starter.primaryCta, href: directionsHref };
    }
  }

  if (type === "contactForm") {
    setIfGeneric("eyebrow", ["contact form", "inquiry"]);
    setIfGeneric("heading", ["get in touch", "send a studio note.", "start a conversation", "request an event consultation"]);
    setIfGeneric("intro", ["the existing website form below controls the actual fields and success response."]);
    setIfGeneric("submitLabel", ["send", "send message", "send training inquiry"]);
    if (!text(content.formKey)) content.formKey = "contact";
  }

  if (type === "contactIntro") {
    setIfGeneric("eyebrow", ["contact", "studio access"]);
    setIfGeneric("heading", ["contact", "details, location, and a direct line."]);
    setIfGeneric("body", ["hours · location · direct inquiry"]);
  }

  if (["cta", "bookingCta"].includes(type)) {
    setIfGeneric("eyebrow", ["next step"]);
    setIfGeneric("heading", ["prefer to choose a service first?"]);
    setIfGeneric("body", ["browse the service menu and continue through the existing booking flow."]);
    if (!text(content.backgroundImage)) content.backgroundImage = starter.backgroundImage;
    if (!text(content.backgroundImageAlt)) content.backgroundImageAlt = starter.backgroundImageAlt;
    if (
      !content.primaryCta?.label ||
      content.primaryCta?.href === "#" ||
      ["view services", "book appointment"].includes(lower(content.primaryCta?.label))
    ) {
      content.primaryCta = clone(starter.primaryCta);
    }
  }

  return content;
};

/**
 * One-time, conservative repair for Contact pages created before Forge had a
 * theme-native Contact blueprint. Known generic/demo values are upgraded;
 * authored copy, media, repeaters, and module ids are preserved.
 */
export function upgradeForgeMotionContactModules(modules = [], companyId) {
  const starters = createForgeMotionContactModules(companyId);
  const next = clone(resolveForgeMotionStarterMedia(Array.isArray(modules) ? modules : [], companyId));

  for (const starter of starters) {
    const index = next.findIndex((module) => {
      if (starter.type === "hero") return module?.type === "hero" && (module?.slot === "contact.hero" || !module?.slot);
      if (starter.type === "contactIntro") return module?.type === "contactIntro" && module?.slot === "contact.intro";
      return module?.type === starter.type;
    });
    if (index < 0) {
      next.push(clone(starter));
      continue;
    }
    const current = next[index];
    next[index] = {
      ...current,
      slot: current.slot || starter.slot,
      order: Number.isFinite(Number(current.order)) ? current.order : starter.order,
      content: upgradeContent(starter.type, current.content, starter.content),
    };
  }

  return next.sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));
}
