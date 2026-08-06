const TYPE_TO_ROLE = Object.freeze({
  hero: "hero.primary",
  heroSplit: "hero.primary",
  heroCarousel: "hero.carousel",
  serviceGrid: "services.grid",
  serviceGridSmart: "services.grid",
  serviceHoverSlider: "services.slider",
  testimonials: "social_proof.testimonials",
  testimonialCarousel: "social_proof.testimonials",
  testimonialTiles: "social_proof.testimonials",
  reviewEditorialGrid: "social_proof.reviews",
  cta: "cta.inline",
  bookingCtaBar: "cta.booking_bar",
  popupCta: "cta.popup",
  contact: "contact.info",
  contactForm: "contact.form",
  mapEmbed: "contact.map",
  gallery: "gallery.grid",
  galleryCarousel: "gallery.carousel",
  videoGallery: "gallery.video",
  videoStorySplit: "story.video",
  featureZigzag: "story.zigzag",
  featureZigzagModern: "story.zigzag",
});

export function resolveSectionRole(section = {}) {
  const explicitRole = String(section.role || "").trim();
  if (explicitRole) {
    return explicitRole;
  }
  return TYPE_TO_ROLE[section.type] || "";
}
