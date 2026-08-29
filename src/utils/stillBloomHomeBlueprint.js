const moduleRecord = (id, type, slot, order, content, settings = {}) => ({
  id,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: { createdInBuilder: true, starterBlueprint: "still-bloom-original", source: "still-bloom-original", ...settings },
});

export function createStillBloomOriginalHomeModules() {
  return [
    moduleRecord("bloom-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Yoga / Pilates Studio",
      heading: "Practice with breath, steadiness, and range.",
      subheading: "Intelligent class planning with a calmer studio rhythm for people who want consistency without pressure.",
      imageUrl: "",
      imageAlt: "A guided movement practice in a calm, light-filled studio.",
      secondaryImages: ["", ""],
      secondaryImageAlts: ["An instructor supporting a mindful stretch.", "A quiet Pilates practice in the studio."],
      primaryCta: { label: "Plan my practice", href: "/contact" },
      secondaryCta: { label: "View classes", href: "/services" },
      marqueeTopItems: ["Breath work", "Pilates flow", "Mobility reset", "Quiet strength", "Mat foundations"],
      marqueeBottomItems: ["Studio rhythm", "Posture support", "Private sessions", "Calm progression", "Mindful range"],
    }),
    moduleRecord("bloom-home-philosophy", "richText", "home.afterHero", 1, {
      eyebrow: "Practice philosophy",
      heading: "Coaching built around strength, consistency, and real life.",
      body: "Movement teaching that respects the body you bring in that day, with clear progressions and enough space to listen.",
      imageUrl: "",
      imageAlt: "A quiet studio moment focused on breath and alignment.",
      primaryCta: { label: "Meet the instructors", href: "/about" },
    }),
    moduleRecord("bloom-home-classes", "services", "home.primaryContent", 2, {
      eyebrow: "Class paths",
      heading: "Choose the class rhythm that fits this season.",
      intro: "Class records, prices, and booking remain managed by the Services workspace.",
      source: "operational",
      items: [],
    }, { dataSource: "operational-services" }),
    moduleRecord("bloom-home-schedule", "hoursLocation", "home.afterServices", 3, {
      eyebrow: "Weekly schedule",
      heading: "A week with room to return.",
      intro: "Edit days and class times as one canonical schedule repeater.",
      items: [
        { id: "bloom-day-mon", title: "Monday", body: "07:00 Mat Foundations · 18:30 Mobility Reset" },
        { id: "bloom-day-tue", title: "Tuesday", body: "08:00 Reformer Private · 17:30 Mat Foundations" },
        { id: "bloom-day-wed", title: "Wednesday", body: "07:30 Breath & Reset · 19:00 Mobility Reset" },
        { id: "bloom-day-thu", title: "Thursday", body: "08:00 Reformer Private · 18:30 Foundations Flow" },
        { id: "bloom-day-sat", title: "Saturday", body: "09:00 Mat Foundations · 11:00 Mobility Reset" },
      ],
    }, { presentation: "weekly-schedule" }),
    moduleRecord("bloom-home-movement-story", "featureStory", "home.afterServices", 4, {
      eyebrow: "Movement story",
      heading: "A practice that unfolds at a human pace.",
      intro: "Three editable chapters hold the source template's horizontal movement narrative.",
      items: [
        { id: "bloom-story-1", kicker: "Arrive", title: "Begin with the body you brought today.", body: "A grounded check-in sets the pace before movement begins.", image: "", imageAlt: "A practitioner arriving and settling into the studio." },
        { id: "bloom-story-2", kicker: "Build", title: "Strength grows through clear repetition.", body: "Thoughtful progressions make challenge feel understandable.", image: "", imageAlt: "A controlled strength sequence during class." },
        { id: "bloom-story-3", kicker: "Return", title: "Leave with a rhythm you can repeat.", body: "The final reset connects studio practice to the rest of the week.", image: "", imageAlt: "A calm closing stretch at the end of practice." },
      ],
    }, { presentation: "movement-story" }),
    moduleRecord("bloom-home-team", "team", "home.afterServices", 5, {
      eyebrow: "Instructors",
      heading: "Teaching that stays attentive.",
      intro: "Edit instructor names, roles, biographies, images, and alt text.",
      items: [
        { id: "bloom-teacher-1", title: "Lead instructor", role: "Pilates / controlled strength", bio: "Add the instructor biography.", image: "", imageAlt: "Portrait of the lead movement instructor." },
        { id: "bloom-teacher-2", title: "Movement coach", role: "Mobility / recovery", bio: "Add the instructor biography.", image: "", imageAlt: "Portrait of the mobility coach." },
      ],
    }),
    moduleRecord("bloom-home-memberships", "pricing", "home.afterServices", 6, {
      eyebrow: "Membership rhythm",
      heading: "Choose enough structure to keep returning.",
      items: [
        { id: "bloom-pass-1", title: "Studio intro", price: "3 classes / first month", body: "A gentle entry point for new members." },
        { id: "bloom-pass-2", title: "Weekly rhythm", price: "8 classes / month", body: "Balance one stronger class with one slower reset." },
        { id: "bloom-pass-3", title: "Private path", price: "1:1 support", body: "Direct guidance for a more personal practice." },
      ],
    }),
    moduleRecord("bloom-home-reviews", "reviews", "home.afterServices", 7, {
      eyebrow: "Member notes",
      heading: "A quieter kind of progress.",
      intro: "Published reviews remain management-owned and flow into this studio-native rail.",
      source: "operational",
      items: [],
    }, { dataSource: "published-reviews" }),
    moduleRecord("bloom-home-faq", "faq", "home.afterServices", 8, {
      eyebrow: "Questions",
      heading: "A little clarity before class.",
      items: [
        { id: "bloom-faq-1", title: "Do I need previous yoga or Pilates experience?", body: "No. New clients can begin with a foundations class or private session." },
        { id: "bloom-faq-2", title: "Can I mix class types?", body: "Yes. Many members combine a stronger class with a gentler mobility session." },
        { id: "bloom-faq-3", title: "What if I am not sure where to begin?", body: "Send a note and the studio can recommend a useful starting point." },
      ],
    }),
    moduleRecord("bloom-home-contact-intro", "contactIntro", "home.beforeContact", 9, { eyebrow: "The studio", heading: "Plan your next class or private session.", body: "Share how you move now and what you want from practice." }),
    moduleRecord("bloom-home-contact-details", "contactDetails", "home.beforeContact", 10, { heading: "Studio details", items: [
      { id: "bloom-contact-location", title: "Studio", body: "Add the studio location" },
      { id: "bloom-contact-phone", title: "Phone", body: "Add the studio phone" },
      { id: "bloom-contact-email", title: "Email", body: "Add the studio email" },
    ] }),
    moduleRecord("bloom-home-map", "map", "home.beforeContact", 11, { heading: "Find the studio", intro: "Add an address or supported map embed.", query: "Add your studio address", address: "Add your studio address", embedUrl: "" }),
    moduleRecord("bloom-home-contact-form", "contactForm", "home.beforeContact", 12, { heading: "Start the conversation", intro: "The existing Website Form handles submissions.", formKey: "contact", submitLabel: "Send request" }),
    moduleRecord("bloom-home-cta", "bookingCta", "home.finalCta", 13, { eyebrow: "Begin gently", heading: "Make room for the next practice.", body: "Choose a class or ask the studio for a starting point.", primaryCta: { label: "Plan my practice", href: "/contact" } }),
  ];
}
