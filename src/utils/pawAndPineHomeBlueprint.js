const record = (id, type, slot, order, content, settings = {}) => ({ id, type, slot, order, enabled: true, content, settings: { createdInBuilder: true, starterBlueprint: "paw-and-pine-original", source: "paw-and-pine-original", ...settings } });
const media = (imageAlt) => ({ image: "", imageUrl: "", imageAlt });

export function createPawAndPineOriginalHomeModules() {
  return [
    record("paw-home-hero", "hero", "home.hero", 0, { eyebrow: "Pet care / Grooming", heading: "Calmer care for pets and people.", subheading: "Thoughtful grooming, clearer care notes, and a gentler studio rhythm for pets and their people.", ...media("A relaxed pet photographed in a warm grooming studio."), secondaryImages: ["", ""], secondaryImageAlts: ["A pet enjoying a calm grooming environment.", "A polished pet portrait after grooming."], primaryCta: { label: "Start an inquiry", href: "/contact" }, secondaryCta: { label: "View grooming paths", href: "/services" }, marqueeTopItems: ["Gentle handling", "Bath and blowout", "Puppy intro", "Breed-aware trims", "Coat care"], marqueeBottomItems: ["Spa add-ons", "Calmer visits", "Finishing detail", "Owner notes", "Studio care"] }),
    record("paw-home-services", "services", "home.primaryContent", 1, { eyebrow: "Grooming paths", heading: "Choose the care rhythm that fits your pet.", intro: "Current offerings remain managed in Services.", source: "operational", items: [] }, { dataSource: "operational-services", presentation: "grooming-selector" }),
    record("paw-home-gallery", "gallery", "home.afterServices", 2, { eyebrow: "Fresh from the studio", heading: "Care you can see in the details.", intro: "Add genuine grooming and studio proof.", items: ["Coat finish", "Gentle wash", "Puppy introduction", "Breed-aware trim", "Studio moment", "Finishing detail"].map((title, index) => ({ id: `paw-gallery-${index + 1}`, title, category: "Studio care", ...media(["A polished coat after a grooming session.", "A pet receiving a gentle wash.", "A puppy during a calm introductory visit.", "A breed-aware grooming finish.", "A calm moment inside the grooming studio.", "Close-up of careful grooming detail."][index]) })) }, { presentation: "grooming-rail" }),
    record("paw-home-care-notes", "richText", "home.afterHero", 3, { eyebrow: "Care notes", heading: "Guidance that helps between appointments.", intro: "Editable owner guidance, not a separate blog.", items: [
      { id: "paw-note-1", title: "Between-groom coat care", body: "Explain a realistic brushing and bath rhythm for the pets you serve." },
      { id: "paw-note-2", title: "How first visits stay calmer", body: "Describe the studio's real approach to pacing and owner expectations." },
      { id: "paw-note-3", title: "When to book a refresh", body: "Help owners understand when a shorter care visit is appropriate." },
    ] }, { presentation: "care-notes" }),
    record("paw-home-team", "team", "home.primaryContent", 4, { eyebrow: "The studio team", heading: "People who notice comfort as much as finish.", intro: "Introduce the real care team.", items: [
      { id: "paw-team-1", title: "Lead groomer", role: "Grooming & coat care", body: "Add a real team biography.", ...media("Portrait of the lead pet groomer.") },
      { id: "paw-team-2", title: "Care coordinator", role: "Intake & owner guidance", body: "Add a real team biography.", ...media("Portrait of the pet care coordinator.") },
    ] }),
    record("paw-home-process", "process", "home.afterHero", 5, { eyebrow: "A calmer visit", heading: "A grooming journey with fewer surprises.", items: [
      { id: "paw-step-1", title: "Share the context", body: "Discuss coat needs, history, and comfort before the visit." },
      { id: "paw-step-2", title: "Set the pace", body: "Explain how the appointment is shaped around the pet in front of you." },
      { id: "paw-step-3", title: "Leave with notes", body: "Give owners practical next steps for care between appointments." },
    ] }),
    record("paw-home-reviews", "reviews", "home.afterServices", 6, { eyebrow: "Client stories", heading: "The strongest feedback is calm.", intro: "Published Reviews remain management-owned.", source: "operational", items: [] }, { dataSource: "published-reviews", presentation: "pet-stories" }),
    record("paw-home-faq", "faq", "home.afterServices", 7, { eyebrow: "Questions", heading: "Before the appointment.", items: [
      { id: "paw-faq-1", question: "Can we plan a regular grooming rhythm?", answer: "Explain the real rebooking process used by the studio." },
      { id: "paw-faq-2", question: "What if my pet is nervous?", answer: "Describe the studio's actual handling and intake approach." },
      { id: "paw-faq-3", question: "Are care add-ons available?", answer: "Tell owners how to confirm current optional care." },
    ] }),
    record("paw-home-contact-intro", "contactIntro", "home.beforeContact", 8, { eyebrow: "Hours & studio", heading: "Find the right visit.", body: "Introduce the studio and the best way to begin a grooming inquiry.", ...media("Warm pet grooming studio prepared for a calm appointment.") }),
    record("paw-home-contact-details", "contactDetails", "home.beforeContact", 9, { heading: "Studio details", items: [{ id: "paw-detail-studio", title: "Studio", body: "Add the studio address" }, { id: "paw-detail-phone", title: "Phone", body: "Add the studio phone" }, { id: "paw-detail-email", title: "Email", body: "Add the studio email" }] }),
    record("paw-home-hours", "hoursLocation", "home.beforeContact", 10, { eyebrow: "Studio hours", heading: "Plan a calmer arrival.", items: [{ id: "paw-hours-weekday", title: "Weekdays", body: "Add real weekday hours" }, { id: "paw-hours-weekend", title: "Weekend", body: "Add real weekend hours" }, { id: "paw-hours-note", title: "Appointments", body: "Add current arrival guidance" }] }),
    record("paw-home-map", "map", "home.beforeContact", 11, { eyebrow: "Location", heading: "Find the studio.", intro: "Add the supported address or map embed.", query: "Add the studio address", address: "Add the studio address", embedUrl: "" }),
    record("paw-home-contact-form", "contactForm", "home.beforeContact", 12, { heading: "Start a calmer grooming visit.", intro: "The existing Website Form handles this inquiry.", formKey: "contact", submitLabel: "Send inquiry" }),
    record("paw-home-cta", "bookingCta", "home.finalCta", 13, { eyebrow: "Appointment inquiry", heading: "A slower, better first visit.", body: "Tell the studio about the pet, coat needs, and appointment history.", primaryCta: { label: "Contact the studio", href: "/contact" } }),
  ];
}
