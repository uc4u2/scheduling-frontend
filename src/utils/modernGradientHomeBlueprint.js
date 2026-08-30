const record = (id, type, slot, order, content, settings = {}) => ({
  id,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "modern-gradient-original",
    source: "modern-gradient-original",
    ...settings,
  },
});

const media = (imageAlt) => ({ image: "", imageUrl: "", imageAlt });

export function createModernGradientOriginalHomeModules() {
  return [
    record("modern-home-hero", "hero", "home.hero", 0, {
      eyebrow: "A clearer way forward",
      heading: "Modern service, thoughtfully delivered.",
      subheading: "Use this spacious introduction for the real promise, service context, and strongest next step.",
      ...media("A wide editorial image representing the company's work."),
      videoUrl: "",
      posterImage: "",
      primaryCta: { label: "Request service", href: "/contact" },
      secondaryCta: { label: "Explore services", href: "/services" },
    }),
    record("modern-home-trust", "trustRail", "home.afterHero", 1, {
      eyebrow: "What clients can expect",
      heading: "A service experience designed around clarity.",
      intro: "Use honest capabilities or service principles here—not invented customer logos.",
      items: [
        "Clear next steps",
        "Thoughtful planning",
        "Responsive support",
        "Current options",
        "Practical guidance",
        "Careful follow-through",
      ].map((title, index) => ({ id: `modern-trust-${index + 1}`, title, body: "Editable capability label" })),
    }, { presentation: "source-marks", claimsMode: "capabilities" }),
    record("modern-home-feature", "featureStory", "home.primaryContent", 2, {
      eyebrow: "The approach",
      heading: "Room to understand the work before choosing the next step.",
      body: "Explain the real process, expertise, or point of view that makes this service experience distinctive.",
      ...media("A premium editorial image showing the team, process, or finished work."),
      primaryCta: { label: "Our approach", href: "/about" },
    }, { presentation: "asymmetric-feature" }),
    record("modern-home-gallery", "gallery", "home.primaryContent", 3, {
      eyebrow: "Selected work",
      heading: "A closer look at the work.",
      intro: "Add current, relevant images with useful alternative text.",
      items: [
        { id: "modern-gallery-1", title: "Project detail", caption: "Project detail", ...media("A detailed view of completed work.") },
        { id: "modern-gallery-2", title: "In progress", caption: "In progress", ...media("The team carrying out work on site.") },
        { id: "modern-gallery-3", title: "Finished result", caption: "Finished result", ...media("A wide view of a finished project.") },
        { id: "modern-gallery-4", title: "Service context", caption: "Service context", ...media("The property or environment where the service is delivered.") },
        { id: "modern-gallery-5", title: "Team perspective", caption: "Team perspective", ...media("A team member reviewing the work.") },
      ],
    }, { presentation: "editorial-wall" }),
    record("modern-home-reviews", "reviews", "home.afterServices", 4, {
      eyebrow: "Client perspective",
      heading: "What the experience felt like.",
      intro: "Published Reviews remain management-owned and appear here automatically.",
      source: "operational",
      items: [],
    }, { dataSource: "published-reviews", presentation: "masonry-wall" }),
    record("modern-home-stats", "stats", "home.afterServices", 5, {
      eyebrow: "How we work",
      heading: "Proof without inflated claims.",
      intro: "Use real, verifiable facts or capability statements.",
      items: [
        { id: "modern-stat-1", value: "01", title: "Listen first", body: "Start with the real need and current context." },
        { id: "modern-stat-2", value: "02", title: "Explain clearly", body: "Make options, timing, and tradeoffs understandable." },
        { id: "modern-stat-3", value: "03", title: "Plan carefully", body: "Agree on the practical next step before work begins." },
        { id: "modern-stat-4", value: "04", title: "Follow through", body: "Keep communication useful through completion." },
      ],
    }, { claimsMode: "capabilities" }),
    record("modern-home-pricing", "pricing", "home.afterServices", 6, {
      eyebrow: "Ways to begin",
      heading: "Choose the right level of conversation.",
      intro: "These are editable marketing packages. Authoritative Service prices remain in management-owned Services.",
      items: [
        { id: "modern-plan-1", title: "Focused visit", price: "Current quote", body: "A clear starting point for one immediate need.", features: ["Initial context", "Current-condition review", "Recommended next step"], primaryCta: { label: "Ask about a visit", href: "/contact" } },
        { id: "modern-plan-2", title: "Ongoing support", price: "Ask the team", body: "A recurring relationship where the business actually offers it.", features: ["Editable service rhythm", "Current scheduling terms", "Useful follow-through"], primaryCta: { label: "Start a conversation", href: "/contact" } },
        { id: "modern-plan-3", title: "Project planning", price: "Custom", body: "A scoped conversation for a larger body of work.", features: ["Options review", "Scope discussion", "Written next steps"], primaryCta: { label: "Plan a project", href: "/contact" } },
      ],
    }, { ownership: "marketing-packages" }),
    record("modern-home-faq", "faq", "home.afterServices", 7, {
      eyebrow: "FAQ",
      heading: "Questions before the next step.",
      intro: "Keep answers current and specific to the real service process.",
      items: [
        { id: "modern-faq-1", question: "What happens after I get in touch?", answer: "Describe the real response, consultation, or intake process." },
        { id: "modern-faq-2", question: "How should I prepare?", answer: "Add the practical information clients should have ready." },
        { id: "modern-faq-3", question: "How are options explained?", answer: "Describe how scope, timing, and pricing are communicated." },
        { id: "modern-faq-4", question: "Which areas do you support?", answer: "List only the real service area or supported locations." },
      ],
    }),
    record("modern-home-contact-intro", "contactIntro", "home.beforeContact", 8, {
      eyebrow: "Start a request",
      heading: "Tell us what would make the next step easier.",
      body: "Share the current need, timing, and the best way for the team to follow up.",
      ...media("A bright editorial image introducing the request process."),
    }),
    record("modern-home-contact-details", "contactDetails", "home.beforeContact", 9, {
      heading: "Contact details",
      items: [
        { id: "modern-detail-phone", title: "Phone", body: "Add the business phone" },
        { id: "modern-detail-email", title: "Email", body: "Add the business email" },
        { id: "modern-detail-location", title: "Location", body: "Add the business address or service context" },
      ],
    }),
    record("modern-home-contact-form", "contactForm", "home.beforeContact", 10, {
      eyebrow: "Request",
      heading: "Start the conversation.",
      intro: "The existing Website Form handles this inquiry.",
      formKey: "contact",
      submitLabel: "Send request",
    }),
    record("modern-home-cta", "bookingCta", "home.finalCta", 11, {
      eyebrow: "Next step",
      heading: "Make the next decision feel clearer.",
      body: "Use the existing service and contact routes—no new transaction or lead backend is introduced.",
      primaryCta: { label: "Request service", href: "/contact" },
    }),
  ];
}
