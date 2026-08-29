const media = (url = "") => ({ image: url, imageUrl: url });

const moduleRecord = (id, type, slot, order, content) => ({
  id,
  type,
  enabled: true,
  slot,
  order,
  variant: type === "hero" ? "clear-clinic-original" : null,
  content,
  settings: { createdInBuilder: true, starterBlueprint: "clear-clinic-original" },
});

/**
 * Editable canonical seed for the source-faithful Clear Clinic homepage.
 *
 * Images intentionally begin empty. The standalone profession template defines
 * their visual roles, while tenant-owned Website Media supplies the production
 * assets. Operational services and published reviews remain management-owned.
 */
export function createClearClinicOriginalHomeModules() {
  const modules = [
    moduleRecord("clear-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Modern dentistry / considered care",
      heading: "Feel clear about your care.",
      subheading: "Thoughtful dentistry, explained plainly and planned around the person in the chair.",
      signaturePanelEnabled: true,
      signaturePanelServiceLimit: 3,
      signaturePanelEyebrow: "Care, made clearer",
      signaturePanelBody: "A calm first conversation, a transparent plan, and a team that keeps every next step understandable.",
      marqueeTopItems: ["Preventive care", "Restorative dentistry", "Cosmetic planning", "Family appointments", "Clear guidance"],
      marqueeBottomItems: ["Comfort first", "Transparent plans", "Modern diagnostics", "Thoughtful follow-up", "Your pace"],
      ...media(),
      imageAlt: "Dentist speaking with a patient in a bright, calm treatment room.",
      secondaryImages: [""],
      primaryCta: { label: "Plan a visit", href: "/contact" },
      secondaryCta: { label: "Explore treatments", href: "/services" },
    }),
    moduleRecord("clear-home-proof", "trustRail", "home.afterHero", 1, {
      eyebrow: "The clinic standard",
      heading: "Care that earns trust before treatment begins.",
      intro: "Clear explanations, careful planning, and continuity at every visit.",
      items: [
        { id: "clear-proof-01", value: "01", title: "Plain-language plans", body: "Understand the recommendation, timing, and options before deciding." },
        { id: "clear-proof-02", value: "02", title: "Comfort-led visits", body: "A measured pace with room for questions and adjustments." },
        { id: "clear-proof-03", value: "03", title: "Consistent follow-up", body: "Guidance that continues after you leave the clinic." },
      ],
    }),
    moduleRecord("clear-home-treatments", "services", "home.primaryContent", 2, {
      eyebrow: "Treatment navigation",
      heading: "Find the right care path.",
      intro: "Choose a treatment area to understand the purpose, approach, and next step.",
      source: "operational",
      items: [],
      primaryCta: { label: "View all treatments", href: "/services" },
    }),
    moduleRecord("clear-home-team", "team", "home.primaryContent", 3, {
      eyebrow: "Your care team",
      heading: "People who explain before they proceed.",
      intro: "A small clinical team focused on calm communication and considered outcomes.",
      items: [
        { id: "clear-team-01", title: "Clinical lead", role: "Dentist", bio: "Preventive, restorative, and long-term care planning.", ...media(), imageAlt: "Portrait of the clinic's lead dentist." },
        { id: "clear-team-02", title: "Patient care lead", role: "Hygienist", bio: "Comfort-led preventive care and practical home guidance.", ...media(), imageAlt: "Portrait of the clinic's patient care hygienist." },
      ],
    }),
    moduleRecord("clear-home-visit", "process", "home.afterHero", 4, {
      eyebrow: "Your visit",
      heading: "A clear path from question to care.",
      intro: "Each stage is designed to make the next one easier to understand.",
      items: [
        { id: "clear-visit-01", title: "Listen and understand", body: "We begin with your goals, history, and the questions you want answered." },
        { id: "clear-visit-02", title: "Assess and explain", body: "Findings are shared in plain language with the available options." },
        { id: "clear-visit-03", title: "Plan together", body: "Choose a pace and care plan that fits your priorities." },
      ],
    }),
    moduleRecord("clear-home-care-story", "featureStory", "home.afterHero", 5, {
      eyebrow: "A considered approach",
      heading: "Care in three connected moments.",
      intro: "From the first conversation through the final follow-up, clarity stays part of the treatment.",
      items: [
        { id: "clear-story-01", kicker: "Understand", title: "Start with the whole picture.", body: "Your priorities and comfort shape the clinical conversation.", ...media(), imageAlt: "Dentist listening to a patient during a consultation." },
        { id: "clear-story-02", kicker: "Plan", title: "See the path before treatment.", body: "Options, timing, and expectations are explained before the next step.", ...media(), imageAlt: "Dentist reviewing a clear care plan with a patient." },
        { id: "clear-story-03", kicker: "Continue", title: "Leave with useful guidance.", body: "Follow-up and practical advice help the result keep working at home.", ...media(), imageAlt: "Patient receiving after-care guidance from the clinic team." },
      ],
    }),
    moduleRecord("clear-home-reviews", "reviews", "home.afterServices", 6, {
      eyebrow: "Patient stories",
      heading: "Care people can feel.",
      intro: "Published patient experiences remain the authoritative source for this section.",
      source: "operational",
      items: [],
    }),
    moduleRecord("clear-home-guidance", "serviceAreas", "home.afterServices", 7, {
      eyebrow: "Patient guidance",
      heading: "Useful context before your appointment.",
      intro: "A few practical notes to make planning the visit easier.",
      items: [
        { id: "clear-guide-01", title: "New patients", body: "Bring any recent records and a short list of questions or priorities." },
        { id: "clear-guide-02", title: "Comfort needs", body: "Tell the team what helps you feel at ease before treatment begins." },
        { id: "clear-guide-03", title: "After your visit", body: "You will leave with clear care instructions and follow-up context." },
      ],
    }),
    moduleRecord("clear-home-faq", "faq", "home.afterServices", 8, {
      eyebrow: "Questions and planning",
      heading: "Clear answers before you arrive.",
      intro: "The practical details patients ask most often.",
      items: [
        { id: "clear-faq-01", title: "Are you accepting new patients?", question: "Are you accepting new patients?", body: "Contact the clinic and the team will confirm current availability and the best first appointment.", answer: "Contact the clinic and the team will confirm current availability and the best first appointment." },
        { id: "clear-faq-02", title: "What should I book first?", question: "What should I book first?", body: "A new-patient consultation is the clearest starting point when you are unsure.", answer: "A new-patient consultation is the clearest starting point when you are unsure." },
        { id: "clear-faq-03", title: "Can I discuss comfort or anxiety?", question: "Can I discuss comfort or anxiety?", body: "Yes. Share your needs before the visit so the appointment can be paced appropriately.", answer: "Yes. Share your needs before the visit so the appointment can be paced appropriately." },
      ],
    }),
    moduleRecord("clear-home-contact-intro", "contactIntro", "home.beforeContact", 9, {
      eyebrow: "Clinic details",
      heading: "Plan the visit with confidence.",
      intro: "Everything you need before arriving.",
      body: "Find the clinic, review opening hours, or send the care team a question.",
      ...media(),
      imageAlt: "Bright and welcoming Clear Clinic reception area.",
      primaryCta: { label: "Contact the clinic", href: "/contact" },
    }),
    moduleRecord("clear-home-contact-details", "contactDetails", "home.beforeContact", 10, {
      heading: "Contact details",
      intro: "Use the shared business details or customize this presentation.",
      items: [
        { id: "clear-contact-phone", title: "Phone", body: "Call the clinic", href: "" },
        { id: "clear-contact-email", title: "Email", body: "Send a care question", href: "" },
        { id: "clear-contact-address", title: "Clinic", body: "Add the clinic address", href: "" },
      ],
    }),
    moduleRecord("clear-home-hours", "hoursLocation", "home.beforeContact", 11, {
      heading: "Clinic hours",
      intro: "Edit the schedule to match your current opening hours.",
      items: [
        { id: "clear-hours-weekdays", title: "Monday – Friday", body: "8:00 – 18:00" },
        { id: "clear-hours-saturday", title: "Saturday", body: "9:00 – 14:00" },
        { id: "clear-hours-sunday", title: "Sunday", body: "Closed" },
      ],
    }),
    moduleRecord("clear-home-map", "map", "home.beforeContact", 12, {
      heading: "Find the clinic",
      intro: "Use an address, map query, or supported embed URL.",
      query: "Add your clinic address",
      address: "Add your clinic address",
      embedUrl: "",
      primaryCta: { label: "Get directions", href: "" },
    }),
    moduleRecord("clear-home-contact-form", "contactForm", "home.beforeContact", 13, {
      heading: "Ask the care team",
      intro: "Use the existing Website Form to send a non-urgent question.",
      formKey: "contact",
      submitLabel: "Send request",
    }),
    moduleRecord("clear-home-booking-cta", "bookingCta", "home.finalCta", 14, {
      eyebrow: "Ready when you are",
      heading: "Take the next clear step.",
      intro: "Choose a care path or contact the clinic for guidance.",
      primaryCta: { label: "Plan a visit", href: "/contact" },
    }),
  ];

  return JSON.parse(JSON.stringify(modules));
}
