const moduleRecord = (id, type, slot, order, content, settings = {}) => ({
  id,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "black-letter-original",
    source: "black-letter-original",
    ...settings,
  },
});

const media = (imageAlt) => ({ image: "", imageUrl: "", imageAlt });

/**
 * Canonical, tenant-owned seed for Black Letter's original legal homepage.
 * The standalone template defines composition and media roles only. Services
 * and published reviews remain operational records.
 */
export function createBlackLetterOriginalHomeModules() {
  return [
    moduleRecord("black-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Legal counsel / Clear next steps",
      heading: "Counsel with clarity.",
      subheading: "Measured legal guidance for consequential decisions, presented with a direct point of view and a disciplined process.",
      ...media("Counsel reviewing case materials in a restrained editorial office setting."),
      primaryCta: { label: "Request a consultation", href: "/contact" },
      secondaryCta: { label: "Explore practice areas", href: "/services" },
      signaturePanelEnabled: true,
      signaturePanelEyebrow: "A disciplined brief",
      signaturePanelBody: "Every matter begins with context, priorities, and a clearly defined next step.",
      marqueeTopItems: ["Plain-language guidance", "Strategic preparation", "Direct communication"],
      marqueeBottomItems: ["Consultation", "Strategy", "Representation", "Resolution"],
    }),
    moduleRecord("black-home-authority", "trustRail", "home.afterHero", 1, {
      eyebrow: "Working principles",
      heading: "Authority without unnecessary noise.",
      intro: "Edit these supporting points to reflect the firm's verified working principles.",
      items: [
        { id: "black-authority-1", value: "01", title: "Clear assessment", body: "Understand the position, the pressure points, and the available paths." },
        { id: "black-authority-2", value: "02", title: "Prepared strategy", body: "Build the matter around evidence, timing, and practical objectives." },
        { id: "black-authority-3", value: "03", title: "Direct counsel", body: "Keep communication useful, measured, and connected to the decision." },
      ],
    }),
    moduleRecord("black-home-practice-areas", "services", "home.primaryContent", 2, {
      eyebrow: "Practice areas",
      heading: "A numbered directory of focused counsel.",
      intro: "Service names, descriptions, prices, and availability remain managed in the Services workspace.",
      source: "operational",
      items: [],
    }, { dataSource: "operational-services", presentation: "practice-directory" }),
    moduleRecord("black-home-firm-story", "richText", "home.afterServices", 3, {
      eyebrow: "The firm",
      heading: "Judgment shaped by preparation.",
      body: "The firm pairs close attention with a steady editorial approach: understand the matter, define the objective, and communicate the path plainly.",
      ...media("A quiet legal office with case materials arranged for review."),
      secondaryImage: "",
      secondaryImageAlt: "Close detail of annotated legal documents and counsel notes.",
      primaryCta: { label: "About the firm", href: "/about" },
    }, { presentation: "firm-story" }),
    moduleRecord("black-home-team", "team", "home.afterServices", 4, {
      eyebrow: "Counsel",
      heading: "Experience presented with restraint.",
      intro: "Edit names, roles, biographies, portraits, and useful alt text.",
      items: [
        { id: "black-counsel-1", title: "Principal counsel", role: "Strategy / Representation", bio: "Add a concise principal counsel biography.", ...media("Portrait of the firm's principal counsel.") },
        { id: "black-counsel-2", title: "Associate counsel", role: "Research / Advisory", bio: "Add a concise associate counsel biography.", ...media("Portrait of the firm's associate counsel.") },
      ],
    }),
    moduleRecord("black-home-counsel-story", "featureStory", "home.afterServices", 5, {
      eyebrow: "The counsel story",
      heading: "From first review to a prepared position.",
      intro: "Three editable chapters preserve the original horizontal legal narrative.",
      items: [
        { id: "black-story-review", kicker: "Review", title: "Begin with the record.", body: "Gather the relevant history, documents, and immediate constraints before defining a response.", ...media("Counsel reviewing an organized legal record.") },
        { id: "black-story-strategy", kicker: "Strategy", title: "Define the useful objective.", body: "Separate urgency from importance and shape a strategy around evidence and timing.", ...media("Legal strategy notes prepared for a client meeting.") },
        { id: "black-story-representation", kicker: "Representation", title: "Move with a clear position.", body: "Communicate the case with discipline while keeping the client informed about each next step.", ...media("Counsel presenting a prepared legal position.") },
      ],
    }, { presentation: "counsel-story" }),
    moduleRecord("black-home-process", "process", "home.afterServices", 6, {
      eyebrow: "The process",
      heading: "A formal sequence with practical checkpoints.",
      items: [
        { id: "black-process-1", title: "Initial consultation", body: "Clarify the matter, urgency, and the decision immediately ahead." },
        { id: "black-process-2", title: "Document review", body: "Organize the record and identify the facts that shape available options." },
        { id: "black-process-3", title: "Strategy brief", body: "Set out the recommended path, responsibilities, and likely next steps." },
        { id: "black-process-4", title: "Representation", body: "Proceed with direct communication and regular decision checkpoints." },
      ],
    }),
    moduleRecord("black-home-insights", "richText", "home.afterServices", 7, {
      eyebrow: "Legal insights",
      heading: "Notes for decisions that benefit from preparation.",
      intro: "These are editable marketing resources, not a second blog system.",
      items: [
        { id: "black-insight-1", title: "Before the first consultation", body: "A concise guide to organizing dates, documents, and the questions that matter most." },
        { id: "black-insight-2", title: "Reading a legal timeline", body: "How deadlines, response windows, and dependencies can shape the next decision." },
        { id: "black-insight-3", title: "What useful counsel sounds like", body: "Clear options, explicit tradeoffs, and communication connected to the objective." },
      ],
    }, { presentation: "legal-insights" }),
    moduleRecord("black-home-reviews", "reviews", "home.afterServices", 8, {
      eyebrow: "Client perspectives",
      heading: "Confidence built through clarity.",
      intro: "Published reviews remain management-owned and flow into this restrained editorial treatment.",
      source: "operational",
      items: [],
    }, { dataSource: "published-reviews" }),
    moduleRecord("black-home-faq", "faq", "home.afterServices", 9, {
      eyebrow: "Questions",
      heading: "A measured answer before the next step.",
      items: [
        { id: "black-faq-1", title: "What should I prepare for an initial consultation?", body: "Bring the relevant timeline, documents, correspondence, and the immediate decision you are facing." },
        { id: "black-faq-2", title: "Will the first conversation define possible next steps?", body: "The consultation is designed to clarify context, constraints, and the most useful next action." },
        { id: "black-faq-3", title: "How will updates be communicated?", body: "Use this answer to state the firm's actual communication cadence and channels." },
      ],
    }),
    moduleRecord("black-home-contact-intro", "contactIntro", "home.beforeContact", 10, {
      eyebrow: "Consultation",
      heading: "Begin with a considered conversation.",
      body: "Share the immediate issue, the relevant timing, and what you need to understand next.",
      ...media("A formal consultation room prepared for a client conversation."),
    }),
    moduleRecord("black-home-contact-details", "contactDetails", "home.beforeContact", 11, {
      heading: "Office details",
      items: [
        { id: "black-detail-office", title: "Office", body: "Add the firm's office address" },
        { id: "black-detail-phone", title: "Phone", body: "Add the firm's phone number" },
        { id: "black-detail-email", title: "Email", body: "Add the firm's email address" },
      ],
    }),
    moduleRecord("black-home-hours", "hoursLocation", "home.beforeContact", 12, {
      eyebrow: "Availability",
      heading: "Consultation hours.",
      items: [
        { id: "black-hours-weekday", title: "Monday – Friday", body: "Consultations by appointment" },
        { id: "black-hours-evening", title: "Evening", body: "Add actual evening availability" },
        { id: "black-hours-urgent", title: "Time-sensitive matters", body: "Add the firm's verified intake guidance" },
      ],
    }),
    moduleRecord("black-home-map", "map", "home.beforeContact", 13, {
      eyebrow: "Office",
      heading: "Meet by appointment.",
      intro: "Add the office address or a supported map embed.",
      query: "Add the firm's office address",
      address: "Add the firm's office address",
      embedUrl: "",
    }),
    moduleRecord("black-home-contact-form", "contactForm", "home.beforeContact", 14, {
      heading: "Request a consultation.",
      intro: "The existing Website Form handles this inquiry without creating another form model.",
      formKey: "contact",
      submitLabel: "Send request",
    }),
    moduleRecord("black-home-cta", "bookingCta", "home.finalCta", 15, {
      eyebrow: "Prepared counsel",
      heading: "Make the next decision with a clearer view.",
      body: "Start with context, timing, and the question that needs an answer.",
      ...media("Counsel preparing for a formal client consultation."),
      primaryCta: { label: "Request a consultation", href: "/contact" },
    }),
  ];
}
