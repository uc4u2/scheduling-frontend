import { resolveSectionRole } from "../roles/sectionRoleResolver";

const cloneProps = (section) => ({ ...(section?.props || {}) });

export function normalizeHeroSection(section = {}) {
  const props = cloneProps(section);
  return {
    kind: section.type === "heroCarousel" ? "carousel" : "primary",
    role: resolveSectionRole(section),
    heading: props.heading || props.title || "",
    subheading: props.subheading || props.description || "",
    eyebrow: props.eyebrow || "",
    primaryCta: {
      label: props.ctaText || "",
      href: props.ctaLink || "",
    },
    secondaryCta: {
      label: props.secondaryCtaText || "",
      href: props.secondaryCtaLink || "",
    },
    media: {
      image: props.backgroundUrl || props.image || "",
      video: props.backgroundVideo || "",
    },
    align: props.align || "center",
    height: props.heroHeight ?? 0,
    overlay: props.overlay ?? 0,
    variant: section.variant || "",
    props,
  };
}

export function normalizeServicesSection(section = {}) {
  const props = cloneProps(section);
  return {
    kind:
      section.type === "serviceHoverSlider" ? "slider" : "grid",
    role: resolveSectionRole(section),
    title: props.title || "",
    subtitle: props.subtitle || "",
    items: Array.isArray(props.items) ? props.items : [],
    cta: {
      label: props.ctaText || "",
      href: props.ctaLink || "",
    },
    dataMode: props.dataSource ? "bound" : "static",
    variant: section.variant || "",
    props,
  };
}

export function normalizeSocialProofSection(section = {}) {
  const props = cloneProps(section);
  return {
    kind:
      section.type === "reviewEditorialGrid" ? "reviews" : "testimonials",
    role: resolveSectionRole(section),
    title: props.title || "",
    subtitle: props.subtitle || "",
    items: Array.isArray(props.items) ? props.items : [],
    showRatings: Boolean(props.showRatings),
    sourceLabel: props.sourceLabel || "",
    variant: section.variant || "",
    props,
  };
}

export function normalizeCtaSection(section = {}) {
  const props = cloneProps(section);
  const typeToKind = {
    popupCta: "popup",
    bookingCtaBar: "booking_bar",
    cta: "inline",
  };
  return {
    kind: typeToKind[section.type] || "inline",
    role: resolveSectionRole(section),
    title: props.title || props.heading || "",
    body: props.body || props.subtitle || props.subheading || "",
    button: {
      label: props.ctaText || props.buttonText || "",
      href: props.ctaLink || props.buttonLink || "",
    },
    triggerSettings: {
      popupId: section.id || "",
      editorPreview: Boolean(props.editorPreview),
    },
    themeVariant: section.variant || "",
    props,
  };
}

export function adaptSectionForRole(section = {}) {
  const role = resolveSectionRole(section);
  if (role.startsWith("hero.")) {
    return normalizeHeroSection(section);
  }
  if (role.startsWith("services.")) {
    return normalizeServicesSection(section);
  }
  if (role.startsWith("social_proof.")) {
    return normalizeSocialProofSection(section);
  }
  if (role.startsWith("cta.")) {
    return normalizeCtaSection(section);
  }
  return {
    role,
    props: cloneProps(section),
    variant: section.variant || "",
  };
}
