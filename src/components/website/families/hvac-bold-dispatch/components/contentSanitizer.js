const HVAC_FALLBACK_IMAGES = {
  hero: [
    "/website/enterprise-trades-forgeworks/hero-01.jpg",
    "/website/enterprise-trades-forgeworks/hero-02.jpg",
    "/website/enterprise-trades-forgeworks/hero-03.jpg",
  ],
  service: [
    "/website/enterprise-trades-forgeworks/service-01.jpg",
    "/website/enterprise-trades-forgeworks/service-02.jpg",
    "/website/enterprise-trades-forgeworks/service-03.jpg",
    "/website/enterprise-trades-forgeworks/service-04.jpg",
    "/website/enterprise-trades-forgeworks/service-05.jpg",
    "/website/enterprise-trades-forgeworks/service-06.jpg",
  ],
  project: [
    "/website/enterprise-trades-forgeworks/showcase-01.jpg",
    "/website/enterprise-trades-forgeworks/showcase-02.jpg",
    "/website/enterprise-trades-forgeworks/showcase-03.jpg",
    "/website/enterprise-trades-forgeworks/showcase-04.jpg",
  ],
};

const NON_HVAC_TEXT = [
  /shop\s*now/i,
  /want\s+to\s+see\s+more/i,
  /featured\s+across/i,
  /service\s+networks/i,
  /gift\s*card/i,
  /best\s*seller/i,
  /seasonal\s*favorite/i,
  /signature\s+services/i,
  /popular\s+services/i,
  /showcases?/i,
  /highlights?/i,
  /creative/i,
  /coach/i,
  /recruit/i,
  /recovery/i,
  /intelligence/i,
  /operational\s+clarity/i,
  /creative\s+teams?/i,
  /studio/i,
  /payroll/i,
  /quickbooks/i,
  /stripe/i,
  /invoice/i,
  /bookings?/i,
  /studi(os|o)/i,
  /auto\s*care/i,
  /autocare/i,
  /motor\s*city/i,
  /fleet/i,
  /brakes?/i,
  /oil\s*&?\s*filters?/i,
  /tires?/i,
  /rotors?/i,
  /mclaren/i,
  /mercedes/i,
  /expo/i,
  /summit/i,
  /pulse/i,
  /weekly/i,
  /recruitly/i,
];

const SUSPICIOUS_IMAGE = [
  /enterprise-physio/i,
  /automotive/i,
  /autocare/i,
  /events/i,
  /beauty/i,
  /wedding/i,
  /jewelry/i,
  /car/i,
  /mercedes/i,
  /mclaren/i,
];

const SERVICE_TITLE_FALLBACKS = [
  "Air conditioning repair",
  "Heating and furnace service",
  "Heat pump maintenance",
  "Indoor air quality upgrades",
  "Commercial HVAC support",
  "Maintenance plan visits",
];

const SERVICE_BODY_FALLBACKS = [
  "Diagnostics, repair planning, and service visits for systems that stop cooling when the load is high.",
  "Tune-ups, safety checks, airflow troubleshooting, and repair guidance for heating season.",
  "Performance checks, seasonal care, and comfort troubleshooting for year-round heat pump systems.",
  "Filtration, humidity control, and airflow improvements that make indoor comfort easier to manage.",
  "Service workflows, rooftop-unit care, and documented next steps for commercial sites.",
  "Preseason tune-ups and repeat-client service planning that reduce surprise breakdowns.",
];

const FEATURE_TITLE_FALLBACKS = [
  "Cooling repair and diagnostics",
  "Seasonal maintenance planning",
  "Commercial HVAC response",
  "Replacement guidance",
];

const FEATURE_BODY_FALLBACKS = [
  "For no-cooling calls, weak airflow, unusual noises, frozen coils, or performance issues that need a clear diagnosis.",
  "Tune-up visits and recurring care plans that help keep heating and cooling systems more predictable.",
  "For managed properties, rooftop units, and service documentation that needs to stay organized.",
  "Compare repair versus replacement with a clearer next step for aging systems and comfort complaints.",
];

const TRUST_LABEL_FALLBACKS = [
  ["Cooling systems", "Repair and replacement"],
  ["Heating systems", "Tune-ups and safety checks"],
  ["Heat pumps", "Install and seasonal care"],
  ["Indoor air quality", "Filtration and airflow"],
];

export function looksNonHvacText(value = "") {
  const text = String(value || "").trim();
  if (!text) return false;
  return NON_HVAC_TEXT.some((pattern) => pattern.test(text));
}

export function sanitizeDispatchText(value = "", fallback = "") {
  const text = String(value || "").trim();
  if (!text || looksNonHvacText(text)) {
    return fallback;
  }
  return text;
}

export function sanitizeDispatchCta(value = "", fallback = "Request service") {
  const text = String(value || "").trim();
  if (!text || looksNonHvacText(text)) {
    return fallback;
  }
  return text;
}

export function sanitizeDispatchImage(url = "", kind = "service", index = 0) {
  const raw = String(url || "").trim();
  const source = HVAC_FALLBACK_IMAGES[kind] || HVAC_FALLBACK_IMAGES.service;
  const fallback = source[index % source.length];
  if (!raw) return fallback;
  if (SUSPICIOUS_IMAGE.some((pattern) => pattern.test(raw))) {
    return fallback;
  }
  return raw;
}

export function sanitizeDispatchHero(slide = {}) {
  return {
    ...slide,
    eyebrow: sanitizeDispatchText(
      slide.eyebrow,
      "Heating and cooling support"
    ),
    heading: sanitizeDispatchText(
      slide.heading,
      "Fast HVAC response for homes and properties"
    ),
    subheading: sanitizeDispatchText(
      slide.subheading,
      "Use this hero for urgent service calls, estimate requests, or planned heating and cooling work that needs a clearer first step."
    ),
    image: sanitizeDispatchImage(slide.image, "hero", 0),
    ctaText: sanitizeDispatchCta(slide.ctaText, "Request service"),
    secondaryCtaText: sanitizeDispatchCta(
      slide.secondaryCtaText,
      "Request estimate"
    ),
    supportCardTitle: sanitizeDispatchText(
      slide.supportCardTitle,
      "Fast quote request"
    ),
    supportCardBody: sanitizeDispatchText(
      slide.supportCardBody,
      "Use this panel for an estimate request, a service visit, or a comfort issue that needs a clearer next step."
    ),
  };
}

export function sanitizeDispatchServices(items = []) {
  return items.map((item, idx) => ({
    ...item,
    title: sanitizeDispatchText(item.title, SERVICE_TITLE_FALLBACKS[idx % SERVICE_TITLE_FALLBACKS.length]),
    description: sanitizeDispatchText(item.description, SERVICE_BODY_FALLBACKS[idx % SERVICE_BODY_FALLBACKS.length]),
    image: sanitizeDispatchImage(item.image, idx < 3 ? "service" : "project", idx),
    linkText: sanitizeDispatchCta(item.linkText || item.ctaText, "View service"),
    ctaText: sanitizeDispatchCta(item.ctaText, "View service"),
    badge: sanitizeDispatchText(item.badge, idx === 0 ? "Priority service" : ""),
    meta: sanitizeDispatchText(item.meta, ""),
  }));
}

export function sanitizeDispatchFeatures(items = []) {
  return items.map((item, idx) => ({
    ...item,
    title: sanitizeDispatchText(item.title, FEATURE_TITLE_FALLBACKS[idx % FEATURE_TITLE_FALLBACKS.length]),
    description: sanitizeDispatchText(item.description, FEATURE_BODY_FALLBACKS[idx % FEATURE_BODY_FALLBACKS.length]),
    image: sanitizeDispatchImage(item.image, idx < 2 ? "service" : "project", idx),
    badge: sanitizeDispatchText(item.badge, idx === 0 ? "Popular path" : ""),
    ctaText: sanitizeDispatchCta(item.ctaText, idx === 0 ? "Request estimate" : "Learn more"),
  }));
}

export function sanitizeDispatchTrustRail(data = {}) {
  const logos = Array.isArray(data.logos) ? data.logos : [];
  const safeLogos = logos.length
    ? logos.map((item, idx) => {
        const fallback = TRUST_LABEL_FALLBACKS[idx % TRUST_LABEL_FALLBACKS.length];
        const safeSrc =
          item?.src && !SUSPICIOUS_IMAGE.some((pattern) => pattern.test(String(item.src)))
            ? item.src
            : "";
        return {
          ...item,
          src: safeSrc,
          label: sanitizeDispatchText(item.label || item.alt, fallback[0]),
          caption: sanitizeDispatchText(item.caption, fallback[1]),
        };
      })
    : TRUST_LABEL_FALLBACKS.map((fallback, idx) => ({
        id: `trust-${idx}`,
        src: "",
        label: fallback[0],
        caption: fallback[1],
        highlight: idx === 2,
      }));
  return {
    ...data,
    title: sanitizeDispatchText(
      data.title,
      "Trusted brands, systems, and comfort categories we support"
    ),
    caption: sanitizeDispatchText(
      data.caption,
      "Use this rail for manufacturer lines, service badges, associations, or text-only trust labels that fit the business."
    ),
    supportingText: sanitizeDispatchText(
      data.supportingText,
      "Everything in this rail is editable."
    ),
    logos: safeLogos,
  };
}

export function sanitizeDispatchReview(item = {}, index = 0) {
  const quotes = [
    "The issue was diagnosed clearly, the options made sense, and the system was back online without confusion.",
    "The service team communicated well, showed up prepared, and left a clear next-step plan.",
    "The maintenance visit helped us catch a comfort issue before it became a bigger problem.",
  ];
  return {
    ...item,
    quote: sanitizeDispatchText(item.quote, quotes[index % quotes.length]),
    author: sanitizeDispatchText(item.author, index === 0 ? "Homeowner" : "Client"),
    location: sanitizeDispatchText(item.location, ""),
  };
}

export function sanitizeDispatchProject(data = {}) {
  return {
    ...data,
    eyebrow: sanitizeDispatchText(data.eyebrow, "Featured service story"),
    title: sanitizeDispatchText(
      data.title,
      "A clearer path from first diagnosis to the final repair plan"
    ),
    body: Array.isArray(data.body)
      ? data.body.map((paragraph, idx) =>
          sanitizeDispatchText(
            paragraph,
            idx === 0
              ? "Use this project section for the service story, the problem that was solved, and the decisions that helped move the job forward."
              : "Keep the copy practical: what was diagnosed, what changed, and what the client gained from the repair or replacement path."
          )
        )
      : [],
    mediaImage: sanitizeDispatchImage(data.mediaImage || data.mediaUrl, "project", 0),
    ctaText: sanitizeDispatchCta(data.ctaText, "View project"),
  };
}

export function sanitizeDispatchProcess(items = []) {
  const titleFallbacks = [
    "Request and triage",
    "On-site diagnosis",
    "Repair or estimate path",
    "Follow-up and ongoing care",
  ];
  const bodyFallbacks = [
    "Start with the symptom, the system type, and the urgency so the team can route the request correctly.",
    "Use the visit to confirm the issue, document the findings, and explain the best next step before work begins.",
    "Show the repair, replacement, or maintenance path with the key costs, timing, and decision points laid out clearly.",
    "Close with the service summary, any maintenance notes, and the next recommended visit so nothing gets lost after the appointment.",
  ];
  return items.map((item, idx) => ({
    ...item,
    title: sanitizeDispatchText(item.title, titleFallbacks[idx % titleFallbacks.length]),
    body: sanitizeDispatchText(item.body, bodyFallbacks[idx % bodyFallbacks.length]),
    eyebrow: sanitizeDispatchText(item.eyebrow, ""),
    image: sanitizeDispatchImage(item.image, "service", idx),
    ctaText: sanitizeDispatchCta(item.ctaText, "Learn more"),
  }));
}
