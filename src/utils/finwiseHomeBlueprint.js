const record = (id, type, slot, order, content, settings = {}) => ({
  id,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "finwise-original",
    source: "finwise-original",
    ...settings,
  },
});

const media = (imageAlt) => ({ image: "", imageUrl: "", imageAlt });

export function createFinwiseOriginalHomeModules() {
  return [
    record("finwise-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Professional service / clear decisions",
      heading: "A better way to plan the work ahead.",
      subheading: "Use this corporate introduction for the real service promise, supporting proof, and strongest next step.",
      ...media("A wide image showing the team or service in a professional setting."),
      videoUrl: "",
      posterImage: "",
      primaryCta: { label: "Request service", href: "/contact" },
      secondaryCta: { label: "View services", href: "/services" },
    }),
    record("finwise-home-trust", "trustRail", "home.afterHero", 1, {
      eyebrow: "Built for real service needs",
      heading: "The contexts the team is prepared to support.",
      intro: "Use honest customer contexts or capabilities here—not invented companies or logos.",
      items: [
        "Homeowners",
        "Property managers",
        "Small businesses",
        "Project planning",
        "Ongoing support",
        "Clear follow-through",
      ].map((title, index) => ({ id: `finwise-trust-${index + 1}`, title, body: "Editable service context" })),
    }, { presentation: "source-marks", claimsMode: "capabilities" }),
    record("finwise-home-services", "services", "home.primaryContent", 2, {
      eyebrow: "Services",
      heading: "Professional support, organized around the real need.",
      intro: "Current Services and authoritative prices remain management-owned.",
      source: "operational",
      items: [],
    }, { dataSource: "operational-services", presentation: "corporate-directory" }),
    record("finwise-home-benefit-one", "featureStory", "home.primaryContent", 3, {
      eyebrow: "A clearer process",
      heading: "Understand the options before choosing the next step.",
      body: "Explain how the team gathers context, communicates tradeoffs, and makes the real process easier to follow.",
      ...media("A professional team member reviewing options with a client."),
      items: [
        { id: "finwise-benefit-1-1", title: "Useful context", body: "Describe what the team learns first." },
        { id: "finwise-benefit-1-2", title: "Clear options", body: "Explain how choices are presented." },
        { id: "finwise-benefit-1-3", title: "Practical next step", body: "Describe how work moves forward." },
      ],
      primaryCta: { label: "How we work", href: "/about" },
    }, { presentation: "benefit-left" }),
    record("finwise-home-benefit-two", "featureStory", "home.primaryContent", 4, {
      eyebrow: "Built for follow-through",
      heading: "Keep communication useful from request to completion.",
      body: "Use this story for a second real service principle, workflow, or area of expertise.",
      ...media("A wide image showing completed work or a professional service setting."),
      items: [
        { id: "finwise-benefit-2-1", title: "Current timing", body: "Set realistic timing expectations." },
        { id: "finwise-benefit-2-2", title: "Visible progress", body: "Explain how updates are shared." },
        { id: "finwise-benefit-2-3", title: "Documented finish", body: "Describe the completion or follow-up step." },
      ],
      primaryCta: { label: "Explore services", href: "/services" },
    }, { presentation: "benefit-right" }),
    record("finwise-home-pricing", "pricing", "home.afterServices", 5, {
      eyebrow: "Ways to begin",
      heading: "Simple options for the first conversation.",
      intro: "These are editable marketing packages. Authoritative Service prices remain management-owned.",
      items: [
        { id: "finwise-plan-1", title: "Focused request", price: "Current quote", body: "A clear starting point for one immediate need.", features: ["Initial context", "Current-condition review", "Recommended next step"], primaryCta: { label: "Ask about a visit", href: "/contact" } },
        { id: "finwise-plan-2", title: "Ongoing support", price: "Ask the team", body: "Recurring support where the business actually offers it.", features: ["Editable service rhythm", "Current scheduling terms", "Useful follow-through"], primaryCta: { label: "Start a conversation", href: "/contact" } },
        { id: "finwise-plan-3", title: "Project planning", price: "Custom", body: "A scoped conversation for a larger body of work.", features: ["Options review", "Scope discussion", "Written next steps"], primaryCta: { label: "Plan a project", href: "/contact" } },
      ],
    }, { ownership: "marketing-packages" }),
    record("finwise-home-reviews", "reviews", "home.afterServices", 6, {
      eyebrow: "Client perspective",
      heading: "What clients say about the experience.",
      intro: "Published Reviews remain management-owned and appear here automatically.",
      source: "operational",
      items: [],
    }, { dataSource: "published-reviews", presentation: "corporate-stories" }),
    record("finwise-home-faq", "faq", "home.afterServices", 7, {
      eyebrow: "FAQ",
      heading: "Frequently asked questions.",
      intro: "Keep answers current and specific to the real service process.",
      items: [
        { id: "finwise-faq-1", question: "What happens after I get in touch?", answer: "Describe the real response, consultation, or intake process." },
        { id: "finwise-faq-2", question: "How should I prepare?", answer: "Add the practical information clients should have ready." },
        { id: "finwise-faq-3", question: "How are options and prices explained?", answer: "Describe how current scope, timing, and operational prices are communicated." },
        { id: "finwise-faq-4", question: "Which areas do you support?", answer: "List only the real service area or supported locations." },
      ],
    }),
    record("finwise-home-stats", "stats", "home.afterServices", 8, {
      eyebrow: "Working principles",
      heading: "Proof without inflated claims.",
      intro: "Use real, verifiable facts or capability statements.",
      items: [
        { id: "finwise-stat-1", value: "01", title: "Clear scope", body: "Define the real need before work begins." },
        { id: "finwise-stat-2", value: "02", title: "Current options", body: "Present options that are actually available." },
        { id: "finwise-stat-3", value: "03", title: "Useful follow-up", body: "Keep next steps understandable after the visit." },
      ],
    }, { claimsMode: "capabilities" }),
    record("finwise-home-contact-intro", "contactIntro", "home.beforeContact", 9, {
      eyebrow: "Start a request",
      heading: "Bring the next service need into focus.",
      body: "Share the current need, timing, and the best way for the team to follow up.",
      ...media("A professional image introducing the request process."),
    }),
    record("finwise-home-contact-details", "contactDetails", "home.beforeContact", 10, {
      heading: "Contact details",
      items: [
        { id: "finwise-detail-phone", title: "Phone", body: "Add the business phone" },
        { id: "finwise-detail-email", title: "Email", body: "Add the business email" },
        { id: "finwise-detail-location", title: "Location", body: "Add the business address or service context" },
      ],
    }),
    record("finwise-home-contact-form", "contactForm", "home.beforeContact", 11, {
      eyebrow: "Request",
      heading: "Start the conversation.",
      intro: "The existing Website Form handles this inquiry.",
      formKey: "contact",
      submitLabel: "Send request",
    }),
    record("finwise-home-cta", "bookingCta", "home.finalCta", 12, {
      eyebrow: "Next step",
      heading: "Make the next decision with better context.",
      body: "Use the existing service and contact routes—no new lead or transaction backend is introduced.",
      primaryCta: { label: "Request service", href: "/contact" },
      secondaryCta: { label: "View services", href: "/services" },
    }),
  ];
}
