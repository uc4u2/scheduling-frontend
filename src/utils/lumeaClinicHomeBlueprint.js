const media = (imageAlt = "") => ({ image: "", imageUrl: "", imageAlt });
const record = (id, type, slot, order, content, settings = {}) => ({
  id, type, slot, order, enabled: true, content,
  settings: { createdInBuilder: true, starterBlueprint: "lumea-clinic-original", source: "lumea-clinic-original", ...settings },
});

export function createLumeaClinicOriginalHomeModules() {
  return [
    record("lumea-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Clinical luxury / considered care",
      heading: "Luxury care with softer clinical precision.",
      subheading: "A refined treatment experience shaped around clear guidance, thoughtful pacing, and care that feels personal.",
      ...media("A calm treatment moment inside a refined light-filled clinic."),
      secondaryImages: ["", ""],
      secondaryImageAlts: ["A refined consultation setting inside the clinic.", "Close-up of thoughtful treatment preparation."],
      primaryCta: { label: "Plan a consultation", href: "/contact" },
      secondaryCta: { label: "Explore treatments", href: "/services" },
    }),
    record("lumea-home-care-rail", "trustRail", "home.afterHero", 1, {
      eyebrow: "Care, considered",
      heading: "A treatment rhythm built around clarity.",
      intro: "Edit these care principles to reflect the clinic's real approach.",
      items: [
        { id: "lumea-care-1", title: "Consultation first", body: "Begin with goals, context, and an honest conversation about the available paths." },
        { id: "lumea-care-2", title: "Thoughtful planning", body: "Understand the preparation, pacing, and after-care before deciding." },
        { id: "lumea-care-3", title: "Measured follow-through", body: "Leave with practical guidance and a clear next step." },
      ],
    }),
    record("lumea-home-treatments", "services", "home.primaryContent", 2, {
      eyebrow: "Featured treatments", heading: "Choose the care path that fits the conversation.", intro: "Current treatments and prices remain managed in Services.", source: "operational", items: [], primaryCta: { label: "View all treatments", href: "/services" },
    }, { dataSource: "operational-services", presentation: "treatment-selector" }),
    record("lumea-home-philosophy", "featureStory", "home.afterHero", 3, {
      eyebrow: "Clinic philosophy", heading: "Refined care is also transparent care.", intro: "Three editable principles for the clinic's own point of view.", items: [
        { id: "lumea-philosophy-1", title: "Listen before planning", body: "Make space for the real priorities behind the inquiry." },
        { id: "lumea-philosophy-2", title: "Explain every option", body: "Share useful context without pressure or unsupported promises." },
        { id: "lumea-philosophy-3", title: "Keep care connected", body: "Pair each appointment with preparation and follow-up guidance." },
      ],
    }),
    record("lumea-home-before-after", "beforeAfter", "home.afterServices", 4, {
      eyebrow: "Treatment perspective", heading: "Compare the visual approach.", intro: "Use appropriate clinic imagery to explain a capability—not to promise a patient result.", items: [
        { id: "lumea-comparison-1", title: "Treatment capability", beforeImage: "", beforeLabel: "Before view", beforeAlt: "Editable before-view treatment reference.", afterImage: "", afterLabel: "After view", afterAlt: "Editable after-view treatment reference.", body: "Add factual, consented context for this comparison." },
      ],
    }),
    record("lumea-home-team", "team", "home.primaryContent", 5, {
      eyebrow: "The care team", heading: "Introduce the people behind the experience.", intro: "Use real names, roles, biographies, and credentials only when verified.", items: [
        { id: "lumea-team-1", title: "Provider profile", role: "Add verified role", body: "Add a real provider biography.", ...media("Portrait of a clinic provider in the Lumea treatment space.") },
        { id: "lumea-team-2", title: "Treatment team", role: "Add verified role", body: "Add a real team biography.", ...media("Portrait of a treatment-team member in the clinic.") },
        { id: "lumea-team-3", title: "Guest care", role: "Add verified role", body: "Add a real guest-care biography.", ...media("Portrait of a guest-care team member at the clinic.") },
      ],
    }),
    record("lumea-home-journey", "process", "home.afterHero", 6, {
      eyebrow: "Treatment journey", heading: "A calm path from question to after-care.", intro: "Describe the clinic's actual process.", items: [
        { id: "lumea-step-1", title: "Consult", body: "Share goals, history, and the questions that matter before choosing a path." },
        { id: "lumea-step-2", title: "Plan", body: "Review timing, preparation, alternatives, and what the appointment involves." },
        { id: "lumea-step-3", title: "Continue", body: "Leave with current after-care guidance and an appropriate next step." },
      ],
    }),
    record("lumea-home-facility", "gallery", "home.afterServices", 7, {
      eyebrow: "Inside the clinic", heading: "A setting designed for considered care.", intro: "Add genuine clinic and treatment-space photography.", items: [
        { id: "lumea-facility-1", title: "Consultation space", category: "Clinic", ...media("A private and refined clinic consultation space.") },
        { id: "lumea-facility-2", title: "Treatment room", category: "Clinic", ...media("A prepared treatment room inside the Lumea clinic.") },
      ],
    }),
    record("lumea-home-reviews", "reviews", "home.afterServices", 8, {
      eyebrow: "Client stories", heading: "Published experiences, presented with care.", intro: "Published Reviews remain management-owned.", source: "operational", items: [],
    }, { dataSource: "published-reviews", presentation: "client-story-rail" }),
    record("lumea-home-guidance", "richText", "home.afterServices", 9, {
      eyebrow: "Treatment guidance", heading: "Useful context before the consultation.", intro: "Editable clinic guidance—not a separate blog.", items: [
        { id: "lumea-guide-1", title: "Prepare your questions", body: "Explain what clients should bring or consider before the first conversation." },
        { id: "lumea-guide-2", title: "Understand the appointment", body: "Describe realistic timing, preparation, and what the clinic can discuss." },
        { id: "lumea-guide-3", title: "Plan for after-care", body: "Share the clinic's factual approach to support after an appointment." },
      ],
    }),
    record("lumea-home-faq", "faq", "home.afterServices", 10, {
      eyebrow: "Treatment questions", heading: "Clear answers before you decide.", items: [
        { id: "lumea-faq-1", question: "Where should I begin?", answer: "Contact the clinic for guidance on the most appropriate first conversation." },
        { id: "lumea-faq-2", question: "How do I prepare?", answer: "Edit this answer with the clinic's current, treatment-appropriate preparation guidance." },
        { id: "lumea-faq-3", question: "What happens after a visit?", answer: "Edit this answer with the clinic's current follow-up and after-care process." },
      ],
    }),
    record("lumea-home-contact-intro", "contactIntro", "home.beforeContact", 11, { eyebrow: "Consultation & clinic", heading: "Begin with a considered conversation.", intro: "Share the best way to contact the clinic and what clients can expect next.", body: "Find the clinic, review current hours, or send a non-urgent inquiry.", ...media("A light-filled clinic reception prepared to welcome a client."), primaryCta: { label: "Contact the clinic", href: "/contact" } }),
    record("lumea-home-contact-details", "contactDetails", "home.beforeContact", 12, { heading: "Clinic details", items: [{ id: "lumea-detail-address", title: "Clinic", body: "Add the clinic address" }, { id: "lumea-detail-phone", title: "Phone", body: "Add the clinic phone" }, { id: "lumea-detail-email", title: "Email", body: "Add the clinic email" }] }),
    record("lumea-home-hours", "hoursLocation", "home.beforeContact", 13, { heading: "Clinic hours", intro: "Keep these hours current.", items: [{ id: "lumea-hours-weekday", title: "Weekdays", body: "Add current weekday hours" }, { id: "lumea-hours-weekend", title: "Weekend", body: "Add current weekend hours" }, { id: "lumea-hours-note", title: "Appointments", body: "Add current arrival guidance" }] }),
    record("lumea-home-map", "map", "home.beforeContact", 14, { eyebrow: "Location", heading: "Find the clinic.", intro: "Add a supported address or map embed.", query: "Add the clinic address", address: "Add the clinic address", embedUrl: "" }),
    record("lumea-home-contact-form", "contactForm", "home.beforeContact", 15, { heading: "Request a consultation.", intro: "The existing Website Form handles this non-urgent inquiry.", formKey: "contact", submitLabel: "Send inquiry" }),
    record("lumea-home-cta", "bookingCta", "home.finalCta", 16, { eyebrow: "A thoughtful next step", heading: "Start with clarity, not pressure.", body: "Choose a treatment path or contact the clinic for guidance.", primaryCta: { label: "Plan a consultation", href: "/contact" } }),
  ];
}
