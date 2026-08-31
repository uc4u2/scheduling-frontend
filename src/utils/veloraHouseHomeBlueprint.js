const media = (imageAlt = "") => ({ image: "", imageUrl: "", imageAlt });
const record = (id, type, slot, order, content, settings = {}) => ({
  id,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "velora-house-original",
    source: "velora-house-original",
    ...settings,
  },
});

const portfolioItems = [
  ["velora-work-1", "Signature finish", "Styling", "A polished salon finish shaped around the client's own texture.", "A polished salon styling result photographed in soft editorial light."],
  ["velora-work-2", "Occasion direction", "Occasion", "An event-ready look planned around timing, comfort, and the full outfit.", "An occasion beauty look with refined hair and finishing details."],
  ["velora-work-3", "Natural texture", "Hair artistry", "A texture-led service that keeps movement and personality visible.", "Natural hair texture styled with definition and movement."],
  ["velora-work-4", "Bridal morning", "Bridal", "A calm, timeline-aware beauty direction for the ceremony morning.", "A bridal beauty look prepared in a calm salon setting."],
  ["velora-work-5", "Studio polish", "Editorial", "A camera-aware finish for portraits, launches, and creative work.", "Editorial salon styling prepared for a portrait session."],
  ["velora-work-6", "Soft detail", "Finishing", "Considered detail that looks composed without feeling overworked.", "Close detail of a softly finished salon look."],
  ["velora-work-7", "Salon atmosphere", "Studio", "A glimpse of the real setting, pace, and materials behind the appointment.", "A refined salon interior prepared for a client appointment."],
  ["velora-work-8", "Color story", "Color", "A color direction presented as inspiration rather than a promised result.", "Hair color detail photographed under balanced salon lighting."],
  ["velora-work-9", "Final look", "Portrait", "The finished service seen as a complete, personal portrait.", "A salon client portrait showing a completed styling service."],
].map(([id, title, category, body, imageAlt]) => ({ id, title, category, caption: category, body, ...media(imageAlt) }));

export function createVeloraHouseOriginalHomeModules() {
  return [
    record("velora-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Salon & Beauty / private appointments",
      heading: "Elevated beauty rituals, shaped around you.",
      subheading: "A darker salon experience for considered styling, occasion preparation, and personal beauty direction.",
      ...media("A salon client portrait framed in Velora House's dark editorial setting."),
      secondaryImages: [""],
      secondaryImageAlts: ["A close beauty or product detail supporting the main salon portrait."],
      primaryCta: { label: "Choose a service", href: "/services" },
      secondaryCta: { label: "Explore the portfolio", href: "/projects" },
    }),
    record("velora-home-story", "featureStory", "home.afterHero", 1, {
      eyebrow: "About the studio",
      heading: "Beauty experiences built around pace, polish, and personal attention.",
      intro: "Use this story to explain the salon's real approach, atmosphere, and preparation.",
      body: "Every appointment can feel composed without becoming impersonal. Share what clients should expect from the first conversation through the final look.",
      ...media("A salon portrait showing the studio's personal, editorial approach."),
      secondaryImage: "",
      secondaryImageAlt: "A supporting salon or beauty detail inside the studio.",
      items: [
        { id: "velora-story-1", title: "Personal direction", body: "Begin with the client's routine, references, comfort, and the occasion ahead." },
        { id: "velora-story-2", title: "Considered preparation", body: "Explain the real preparation and timing that help an appointment run smoothly." },
        { id: "velora-story-3", title: "Refined finishing", body: "Describe the studio's approach to detail without making unsupported outcome claims." },
        { id: "velora-story-4", title: "A calmer handoff", body: "Share practical care or maintenance guidance for after the visit." },
      ],
      primaryCta: { label: "Read our story", href: "/about" },
      secondaryCta: { label: "View services", href: "/services" },
    }),
    record("velora-home-proof", "proofBand", "home.afterHero", 2, {
      eyebrow: "The studio approach",
      heading: "Luxury is also how the appointment feels.",
      intro: "Editable, non-numeric service principles—never invented ratings or customer counts.",
      items: [
        { id: "velora-proof-1", title: "Unhurried consultation", label: "Consultation", body: "Start with useful context before deciding on the service direction." },
        { id: "velora-proof-2", title: "Personal beauty planning", label: "Planning", body: "Connect the finish to the client's routine, timing, and comfort." },
        { id: "velora-proof-3", title: "Considered final detail", label: "Finishing", body: "Review the complete look and share appropriate maintenance guidance." },
      ],
    }, { claimsMode: "service-principles" }),
    record("velora-home-services", "services", "home.primaryContent", 3, {
      eyebrow: "Beauty services",
      heading: "A service menu with a more editorial rhythm.",
      intro: "Current service names, descriptions, durations, images, and prices remain managed in Services.",
      source: "operational",
      items: [],
      primaryCta: { label: "View all services", href: "/services" },
    }, { dataSource: "operational-services", presentation: "beauty-directory" }),
    record("velora-home-portfolio", "portfolio", "home.afterServices", 4, {
      eyebrow: "Portfolio",
      heading: "Beauty work with a darker editorial rhythm.",
      intro: "Replace these nine editable media records with genuine salon, styling, bridal, and studio imagery.",
      items: portfolioItems,
      primaryCta: { label: "View the portfolio", href: "/projects" },
    }, { presentation: "beauty-masonry" }),
    record("velora-home-reviews", "reviews", "home.afterServices", 5, {
      eyebrow: "Client reflections",
      heading: "Published experiences, presented with a quieter beauty cadence.",
      intro: "Published Reviews remain management-owned. No fixture testimonials are stored here.",
      source: "operational",
      items: [],
    }, { dataSource: "published-reviews", presentation: "beauty-editorial" }),
    record("velora-home-contact-intro", "contactIntro", "home.beforeContact", 6, {
      eyebrow: "Appointments & inquiries",
      heading: "Let's shape the next beauty story.",
      intro: "Share the service, occasion, timing, or styling direction you have in mind.",
      body: "Use the studio's current contact details and existing Website Form for a non-urgent inquiry.",
      ...media("A refined salon workspace prepared for a beauty consultation."),
      primaryCta: { label: "Contact the studio", href: "/contact" },
    }),
    record("velora-home-contact-details", "contactDetails", "home.beforeContact", 7, {
      heading: "Studio details",
      intro: "Keep these details aligned with the business contact settings.",
      items: [
        { id: "velora-detail-studio", title: "Visit the studio", body: "Add the salon address or appointment-area guidance" },
        { id: "velora-detail-email", title: "Email", body: "Add the salon email" },
        { id: "velora-detail-phone", title: "Call", body: "Add the salon phone" },
      ],
    }),
    record("velora-home-contact-form", "contactForm", "home.beforeContact", 8, {
      eyebrow: "Send an inquiry",
      heading: "Tell the studio what you are planning.",
      intro: "The existing Website Form handles this inquiry.",
      formKey: "contact",
      submitLabel: "Send inquiry",
    }),
    record("velora-home-cta", "bookingCta", "home.finalCta", 9, {
      eyebrow: "Ready when you are",
      heading: "Choose a real service, then continue through the existing booking path.",
      body: "Service availability, provider matching, review, checkout, payment, and confirmation remain system-owned.",
      primaryCta: { label: "Choose a service", href: "/services" },
    }),
  ];
}
