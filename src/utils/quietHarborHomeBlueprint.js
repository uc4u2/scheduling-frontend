const record = (id, type, slot, order, content, settings = {}) => ({ id, type, slot, order, enabled: true, content, settings: { createdInBuilder: true, starterBlueprint: "quiet-harbor-original", source: "quiet-harbor-original", ...settings } });
const media = (imageAlt) => ({ image: "", imageUrl: "", imageAlt });

export function createQuietHarborOriginalHomeModules() {
  return [
    record("quiet-home-hero", "hero", "home.hero", 0, { eyebrow: "Therapy & Counseling", heading: "Private support for clearer inner ground.", subheading: "Thoughtful, structured support for anxiety, relationship strain, burnout, and life transitions.", ...media("Therapist portrait in a calm private practice."), secondaryImages: [""], secondaryImageAlts: ["Quiet counseling room with soft seating and natural light."], primaryCta: { label: "Request a private consultation", href: "/contact" }, secondaryCta: { label: "Explore specialties", href: "/services" }, marqueeTopItems: ["Anxiety support", "Relationship repair", "Burnout recovery", "Private sessions", "Virtual care"], marqueeBottomItems: ["Measured intake", "Trauma-aware support", "Emotional regulation", "Safer conversations", "First-session pacing"] }),
    record("quiet-home-trust", "trustRail", "home.afterHero", 1, { eyebrow: "Support paths", heading: "A steadier place to begin.", items: [
      { id: "quiet-trust-1", title: "Individual therapy", body: "Private sessions for adults moving through anxiety, grief, burnout, and harder transitions." },
      { id: "quiet-trust-2", title: "Couples counseling", body: "Support for communication repair, recurring conflict, and relationships needing more useful conversation." },
      { id: "quiet-trust-3", title: "Burnout support", body: "A private setting for leaders and high-responsibility professionals to think more clearly under pressure." },
    ] }),
    record("quiet-home-services", "services", "home.primaryContent", 2, { eyebrow: "Support paths", heading: "Specialties with a clearer first step.", intro: "Current specialties remain managed in Services.", source: "operational", items: [] }, { dataSource: "operational-services", presentation: "specialty-selector" }),
    record("quiet-home-team", "team", "home.primaryContent", 3, { eyebrow: "Meet the therapists", heading: "People who work slowly enough to be useful.", intro: "Introduce the real practice team and their areas of focus.", items: [
      { id: "quiet-team-1", title: "Clinical director", role: "Individual therapy", body: "Add the therapist's real biography and focus.", ...media("Portrait of the clinical director.") },
      { id: "quiet-team-2", title: "Couples therapist", role: "Relationships & repair", body: "Add the therapist's real biography and focus.", ...media("Portrait of a couples therapist.") },
      { id: "quiet-team-3", title: "Recovery specialist", role: "Trauma & recovery", body: "Add the therapist's real biography and focus.", ...media("Portrait of a trauma recovery specialist.") },
    ] }),
    record("quiet-home-process", "process", "home.afterHero", 4, { eyebrow: "First session", heading: "What the first session feels like.", items: [
      { id: "quiet-step-1", title: "Quiet consultation", body: "Begin with what is happening now and what would make support feel safe enough to continue." },
      { id: "quiet-step-2", title: "Context and patterns", body: "Clarify history, stressors, coping patterns, and relationships without pushing too quickly." },
      { id: "quiet-step-3", title: "Shared direction", body: "Choose a useful first pace and support path together." },
    ] }),
    record("quiet-home-approach", "featureStory", "home.afterHero", 5, { eyebrow: "Approach", heading: "Therapy that stays structured, not cold.", intro: "Explain how the practice holds private conversations with clarity and care.", body: "Use this section for the real practice philosophy and what clients can expect from the therapeutic relationship.", ...media("Private counseling room prepared for a measured conversation."), items: [
      { id: "quiet-approach-1", title: "Private by design", body: "Describe the practice's real approach to discretion and emotional safety." },
      { id: "quiet-approach-2", title: "Structured, not cold", body: "Explain how sessions balance emotional depth with clear progression." },
      { id: "quiet-approach-3", title: "Fit matters", body: "Explain how therapist fit and session pacing are handled." },
    ] }),
    record("quiet-home-guidance", "richText", "home.afterHero", 6, { eyebrow: "Therapy guidance", heading: "Resources for starting more privately.", intro: "Editable guidance, not a separate blog.", items: [
      { id: "quiet-guide-1", title: "Choosing a first support path", body: "Help clients begin with the concern that feels most present right now." },
      { id: "quiet-guide-2", title: "When in-person matters", body: "Describe the actual in-person and virtual options offered by the practice." },
      { id: "quiet-guide-3", title: "What a useful consultation should do", body: "Clarify fit, pace, and the most useful next support path." },
    ] }),
    record("quiet-home-faq", "faq", "home.afterServices", 7, { eyebrow: "Questions", heading: "Questions before starting.", items: [
      { id: "quiet-faq-1", question: "What does the first session look like?", answer: "Describe the practice's actual first-session process." },
      { id: "quiet-faq-2", question: "Are virtual sessions available?", answer: "Explain the current in-person and virtual options." },
      { id: "quiet-faq-3", question: "How is privacy handled?", answer: "Explain the practice's real privacy and intake expectations." },
    ] }),
    record("quiet-home-reviews", "reviews", "home.afterServices", 8, { eyebrow: "Client stories", heading: "Steadier conversations, reflected carefully.", intro: "Published Reviews remain management-owned.", source: "operational", items: [] }, { dataSource: "published-reviews", presentation: "private-stories" }),
    record("quiet-home-contact-intro", "contactIntro", "home.beforeContact", 9, { eyebrow: "Private intake", heading: "Start with a measured first conversation.", body: "Explain how a prospective client can begin and what information is useful in a first inquiry.", ...media("Private consultation space with calm natural light.") }),
    record("quiet-home-contact-details", "contactDetails", "home.beforeContact", 10, { heading: "Practice details", items: [{ id: "quiet-detail-office", title: "Office", body: "Add the practice location" }, { id: "quiet-detail-phone", title: "Phone", body: "Add the practice phone" }, { id: "quiet-detail-email", title: "Email", body: "Add the practice email" }] }),
    record("quiet-home-contact-form", "contactForm", "home.beforeContact", 11, { heading: "Request a private consultation.", intro: "The existing Website Form handles this inquiry.", formKey: "contact", submitLabel: "Send private inquiry" }),
    record("quiet-home-cta", "bookingCta", "home.finalCta", 12, { eyebrow: "A private next step", heading: "Bring the concern forward carefully.", body: "Begin with the support need, preferred pace, and whether in-person or virtual care is most useful.", primaryCta: { label: "Request consultation", href: "/contact" } }),
  ];
}
