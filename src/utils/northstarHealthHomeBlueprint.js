const media = (imageAlt = "") => ({ image: "", imageUrl: "", imageAlt });
const record = (id, type, slot, order, content, settings = {}) => ({
  id, type, slot, order, enabled: true, content,
  settings: { createdInBuilder: true, starterBlueprint: "northstar-health-original", source: "northstar-health-original", ...settings },
});

export function createNorthstarHealthOriginalHomeModules() {
  return [
    record("northstar-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Healthcare / human clarity",
      heading: "Modern healthcare with human clarity.",
      subheading: "A patient-first clinic experience built around understandable care, thoughtful conversations, and practical next steps.",
      ...media("A healthcare provider speaking with a patient in a bright medical clinic."),
      secondaryImages: ["", ""],
      secondaryImageAlts: ["A provider preparing for a patient consultation.", "A calm patient-care moment inside the Northstar clinic."],
      primaryCta: { label: "Request an appointment", href: "/contact" },
      secondaryCta: { label: "Explore care areas", href: "/services" },
      pills: ["Clear guidance", "Coordinated care", "Patient-first planning"],
    }),
    record("northstar-home-proof", "stats", "home.afterHero", 1, {
      eyebrow: "Clinic commitments", heading: "Care that stays understandable.", intro: "Use honest, tenant-authored proof rather than unsupported patient counts or outcomes.",
      items: [
        { id: "northstar-proof-1", value: "01", title: "Listen", body: "Begin with the patient context and the questions that matter." },
        { id: "northstar-proof-2", value: "02", title: "Explain", body: "Make options, timing, and next steps easier to understand." },
        { id: "northstar-proof-3", value: "03", title: "Coordinate", body: "Keep the care path connected from visit to follow-up." },
      ],
    }),
    record("northstar-home-care-rail", "trustRail", "home.afterHero", 2, {
      eyebrow: "Care areas", heading: "Support for the moments that bring patients in.", intro: "Edit these labels to match the clinic's current scope.",
      items: [
        { id: "northstar-rail-1", title: "Primary care" },
        { id: "northstar-rail-2", title: "Preventive visits" },
        { id: "northstar-rail-3", title: "Ongoing support" },
        { id: "northstar-rail-4", title: "Patient guidance" },
      ],
    }),
    record("northstar-home-services", "services", "home.primaryContent", 3, {
      eyebrow: "Care areas", heading: "Choose the right place to begin.", intro: "Current care areas, descriptions, and pricing remain managed in Services.", source: "operational", items: [],
      primaryCta: { label: "View all care areas", href: "/services" },
    }, { dataSource: "operational-services", presentation: "care-area-selector" }),
    record("northstar-home-team", "team", "home.primaryContent", 4, {
      eyebrow: "Care team", heading: "Meet the people behind the clinic.", intro: "Use verified names, roles, biographies, and credentials only.",
      items: [
        { id: "northstar-team-1", title: "Provider profile", role: "Add verified role", body: "Add a real provider biography.", ...media("Portrait of a healthcare provider at Northstar Health.") },
        { id: "northstar-team-2", title: "Care team profile", role: "Add verified role", body: "Add a real care-team biography.", ...media("Portrait of a care-team member inside the clinic.") },
        { id: "northstar-team-3", title: "Patient support", role: "Add verified role", body: "Add a real patient-support biography.", ...media("Portrait of a patient-support team member at the clinic.") },
      ],
    }),
    record("northstar-home-visit", "process", "home.afterServices", 5, {
      eyebrow: "Your visit", heading: "A clear path through the appointment.", intro: "Describe the clinic's real patient journey.",
      items: [
        { id: "northstar-visit-1", title: "Before the visit", body: "Share current arrival, preparation, and information guidance." },
        { id: "northstar-visit-2", title: "During the conversation", body: "Explain how the clinic listens, assesses, and discusses options." },
        { id: "northstar-visit-3", title: "After the appointment", body: "Clarify how patients receive next steps and follow-up guidance." },
      ],
    }),
    record("northstar-home-care-story", "featureStory", "home.afterServices", 6, {
      eyebrow: "Connected care", heading: "The care story should stay clear from one chapter to the next.", intro: "A source-native scroll story with neutral, editable medical-clinic content.",
      items: [
        { id: "northstar-story-1", category: "Chapter 01", title: "Understand the concern", body: "Start with context, symptoms, history, and the patient's priorities.", ...media("A healthcare provider listening during a patient consultation.") },
        { id: "northstar-story-2", category: "Chapter 02", title: "Build the care path", body: "Explain the available options and agree on a practical next step.", ...media("A provider and patient reviewing a care plan together.") },
        { id: "northstar-story-3", category: "Chapter 03", title: "Keep care connected", body: "Support follow-up with current instructions and coordinated communication.", ...media("A care team coordinating patient follow-up in the clinic.") },
      ],
    }),
    record("northstar-home-reviews", "reviews", "home.afterServices", 7, {
      eyebrow: "Patient stories", heading: "Published experiences from the clinic.", intro: "Published Reviews remain management-owned.", source: "operational", items: [],
    }, { dataSource: "published-reviews", presentation: "patient-story-rail" }),
    record("northstar-home-guidance", "richText", "home.afterServices", 8, {
      eyebrow: "Patient guidance", heading: "Useful information before the visit.", intro: "Editable patient information—not a separate blog or medical-record system.",
      items: [
        { id: "northstar-guide-1", title: "Prepare for your appointment", body: "Explain what patients should bring and how to prepare." },
        { id: "northstar-guide-2", title: "Know where to arrive", body: "Share current arrival, accessibility, and clinic-entry guidance." },
        { id: "northstar-guide-3", title: "Understand follow-up", body: "Describe the clinic's current non-urgent follow-up process." },
      ],
    }),
    record("northstar-home-faq", "faq", "home.afterServices", 9, {
      eyebrow: "Patient questions", heading: "Answers for a clearer first step.",
      items: [
        { id: "northstar-faq-1", question: "How do I choose a care area?", answer: "Contact the clinic for guidance when you are unsure which service is appropriate." },
        { id: "northstar-faq-2", question: "What should I bring?", answer: "Edit this answer with the clinic's current appointment and identification guidance." },
        { id: "northstar-faq-3", question: "How does follow-up work?", answer: "Edit this answer with the clinic's current non-urgent follow-up process." },
      ],
    }),
    record("northstar-home-contact-intro", "contactIntro", "home.beforeContact", 10, { eyebrow: "Clinic & appointments", heading: "A clearer next step starts here.", intro: "Share the best way to reach the clinic and what patients can expect next.", body: "Find the clinic, review current hours, or send a non-urgent inquiry.", ...media("A welcoming reception area inside Northstar Health."), primaryCta: { label: "Contact the clinic", href: "/contact" } }),
    record("northstar-home-contact-details", "contactDetails", "home.beforeContact", 11, { heading: "Clinic details", items: [{ id: "northstar-detail-address", title: "Clinic", body: "Add the clinic address" }, { id: "northstar-detail-phone", title: "Phone", body: "Add the clinic phone" }, { id: "northstar-detail-email", title: "Email", body: "Add the clinic email" }] }),
    record("northstar-home-hours", "hoursLocation", "home.beforeContact", 12, { heading: "Clinic hours", intro: "Keep these hours current.", items: [{ id: "northstar-hours-weekday", title: "Weekdays", body: "Add current weekday hours" }, { id: "northstar-hours-weekend", title: "Weekend", body: "Add current weekend hours" }, { id: "northstar-hours-note", title: "Appointments", body: "Add current arrival guidance" }] }),
    record("northstar-home-map", "map", "home.beforeContact", 13, { eyebrow: "Location", heading: "Find Northstar Health.", intro: "Add a supported address or map embed.", query: "Add the clinic address", address: "Add the clinic address", embedUrl: "" }),
    record("northstar-home-contact-form", "contactForm", "home.beforeContact", 14, { heading: "Send a non-urgent inquiry.", intro: "The existing Website Form handles this inquiry.", formKey: "contact", submitLabel: "Send inquiry" }),
    record("northstar-home-cta", "bookingCta", "home.finalCta", 15, { eyebrow: "Care starts with clarity", heading: "Choose a care area or contact the clinic.", body: "Existing system routes continue to own booking and appointment behavior.", primaryCta: { label: "Request an appointment", href: "/contact" } }),
  ];
}
