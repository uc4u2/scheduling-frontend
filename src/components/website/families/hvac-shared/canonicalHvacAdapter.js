import { stripHtml, htmlToParagraphs, toArray } from "./runtime";

export function getHeroData(adapter = {}) {
  const props = adapter?.props || {};
  const slides = toArray(props.slides).map((slide, idx) => ({
    id: `slide-${idx}`,
    eyebrow: slide?.eyebrow || props.eyebrow || "",
    heading: slide?.heading || props.heading || "",
    subheading: slide?.subheading || props.subheading || "",
    image: slide?.image || slide?.backgroundUrl || props.image || props.backgroundUrl || "",
    backgroundPosition: slide?.backgroundPosition || props.backgroundPosition || "center",
    ctaText: slide?.ctaText || props.ctaText || "",
    ctaLink: slide?.ctaLink || props.ctaLink || "",
    secondaryCtaText: slide?.secondaryCtaText || props.secondaryCtaText || "",
    secondaryCtaLink: slide?.secondaryCtaLink || props.secondaryCtaLink || "",
  }));
  if (slides.length) {
    return {
      mode: "carousel",
      slides,
      autoplay: props.autoplay !== false,
      intervalMs: Number(props.intervalMs) || 5600,
    };
  }
  return {
    mode: "single",
    slides: [
      {
        id: "single",
        eyebrow: adapter.eyebrow || props.eyebrow || "",
        heading: adapter.heading || props.heading || props.title || "",
        subheading: adapter.subheading || props.subheading || props.description || "",
        image: adapter?.media?.image || props.backgroundUrl || props.image || "",
        backgroundPosition: props.backgroundPosition || "center",
        ctaText: adapter?.primaryCta?.label || props.ctaText || "",
        ctaLink: adapter?.primaryCta?.href || props.ctaLink || "",
        secondaryCtaText: adapter?.secondaryCta?.label || props.secondaryCtaText || "",
        secondaryCtaLink: adapter?.secondaryCta?.href || props.secondaryCtaLink || "",
      },
    ],
    autoplay: false,
    intervalMs: 0,
  };
}

export function getShowcaseItems(props = {}) {
  return toArray(props.items).map((item, idx) => ({
    id: item?.id || `showcase-${idx}`,
    title: item?.title || item?.name || `Showcase ${idx + 1}`,
    description: stripHtml(item?.description || item?.body || ""),
    image: item?.image || item?.imageUrl || "",
    link: item?.link || item?.href || "",
    linkText: item?.linkText || item?.ctaText || "Explore",
    badge: item?.badge || "",
  }));
}

export function getPerks(props = {}) {
  return toArray(props.perks).map((item, idx) => ({
    id: item?.id || `perk-${idx}`,
    title: item?.title || "",
    subtitle: item?.subtitle || "",
    icon: item?.icon || "",
  }));
}

export function getServiceCards(adapter = {}) {
  const props = adapter?.props || {};
  return toArray(adapter?.items?.length ? adapter.items : props.items).map((item, idx) => ({
    id: item?.id || `service-${idx}`,
    title: item?.title || item?.name || `Service ${idx + 1}`,
    description: stripHtml(item?.description || item?.body || ""),
    image: item?.image || item?.imageUrl || "",
    link: item?.link || item?.href || "",
    badge: item?.badge || item?.price || "",
    meta: item?.meta || item?.subtitle || "",
  }));
}

export function getPricingPlans(props = {}) {
  return toArray(props.plans).map((plan, idx) => ({
    id: `plan-${idx}`,
    name: plan?.name || `Plan ${idx + 1}`,
    price: plan?.price || "",
    ribbon: plan?.ribbon || "",
    featured: Boolean(plan?.featured),
    features: toArray(plan?.features).map((feature) => stripHtml(feature)),
    ctaText: plan?.ctaText || "",
    ctaLink: plan?.ctaLink || "",
  }));
}

export function getTestimonials(adapter = {}) {
  const props = adapter?.props || {};
  return toArray(adapter?.items?.length ? adapter.items : props.items).map((item, idx) => ({
    id: `quote-${idx}`,
    quote: stripHtml(item?.quote || item?.text || ""),
    author: item?.author || item?.name || "",
    location: item?.location || item?.meta || "",
    rating: Number(item?.rating || item?.stars || 0),
  }));
}

export function getStoryData(props = {}) {
  return {
    eyebrow: props.eyebrow || "",
    title: props.title || "",
    body: htmlToParagraphs(props.body || props.description || ""),
    ctaText: props.ctaText || "",
    ctaLink: props.ctaLink || "",
    mediaUrl: props.videoUrl || props.mediaImage || props.image || "",
    mediaImage: props.mediaImage || props.image || "",
    mediaTitle: props.mediaTitle || "",
    mediaBody: htmlToParagraphs(props.mediaBody || ""),
  };
}

export function getZigzagItems(props = {}) {
  return toArray(props.items).map((item, idx) => ({
    id: `zigzag-${idx}`,
    eyebrow: item?.eyebrow || "",
    title: item?.title || "",
    body: stripHtml(item?.body || item?.description || ""),
    image: item?.imageUrl || item?.image || "",
    align: item?.align || (idx % 2 === 0 ? "left" : "right"),
    ctaText: item?.ctaText || "",
    ctaLink: item?.ctaLink || "",
  }));
}

export function getContactData(props = {}) {
  return {
    eyebrow: props.eyebrow || "",
    title: props.title || "",
    intro: htmlToParagraphs(props.intro || props.body || ""),
    submitLabel: props.submitLabel || props.ctaText || "Send",
    mediaImage: props.mediaImage || "",
    mediaTitle: props.mediaTitle || "",
    mediaBody: htmlToParagraphs(props.mediaBody || ""),
    fields: toArray(props.fields),
  };
}

export function getFaqItems(props = {}) {
  return toArray(props.items).map((item, idx) => ({
    id: `faq-${idx}`,
    question: item?.question || item?.q || "",
    answer: stripHtml(item?.answer || item?.a || ""),
  }));
}

export function getMapDetails(props = {}) {
  return {
    eyebrow: props.eyebrow || "",
    title: props.title || "",
    body: stripHtml(props.body || ""),
    ctaText: props.ctaText || "",
    ctaHref: props.ctaHref || props.ctaLink || "",
    details: [
      { title: props.detailOneTitle || "", text: props.detailOneText || "" },
      { title: props.detailTwoTitle || "", text: props.detailTwoText || "" },
      { title: props.detailThreeTitle || "", text: props.detailThreeText || "" },
    ].filter((item) => item.title || item.text),
  };
}

export function getGalleryItems(props = {}) {
  const imageItems = toArray(props.images).map((item, idx) => {
    if (typeof item === "string") {
      return { id: `gallery-${idx}`, url: item, alt: `Gallery image ${idx + 1}` };
    }
    return {
      id: item?.id || `gallery-${idx}`,
      url: item?.url || item?.image || "",
      alt: item?.alt || item?.title || `Gallery image ${idx + 1}`,
      title: item?.title || "",
      description: stripHtml(item?.description || ""),
    };
  });

  const videoItems = toArray(props.videos).map((item, idx) => ({
    id: item?.id || `video-${idx}`,
    video: item?.video || item?.url || "",
    poster: item?.poster || "",
    caption: item?.caption || item?.title || "",
  }));

  return { imageItems, videoItems };
}

export function getRichTextBody(props = {}) {
  return {
    title: props.title || "",
    bodyHtml: props.body || "",
    bodyText: stripHtml(props.body || ""),
    paragraphs: htmlToParagraphs(props.body || ""),
  };
}

export function getBookingBarData(adapter = {}) {
  const props = adapter?.props || {};
  return {
    title: props.text || adapter.body || "",
    buttonText: props.buttonText || adapter?.button?.label || "",
    buttonLink: props.buttonLink || adapter?.button?.href || "",
  };
}
