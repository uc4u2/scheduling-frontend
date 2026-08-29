const moduleRecord = (id, type, slot, order, content, settings = {}) => ({
  id,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "circuit-north-original",
    source: "circuit-north-original",
    ...settings,
  },
});

const media = (imageAlt) => ({ image: "", imageUrl: "", imageAlt });

/** Source-native marketing seed. It intentionally contains no live telemetry. */
export function createCircuitNorthOriginalHomeModules() {
  return [
    moduleRecord("circuit-home-hero", "hero", "home.hero", 0, {
      eyebrow: "IT services / Managed systems",
      heading: "Systems that stay understandable.",
      subheading: "Technical planning, implementation, and support built around a clearer operating model for growing teams.",
      ...media("Technical team reviewing a systems architecture plan."),
      primaryCta: { label: "Request a systems review", href: "/contact" },
      secondaryCta: { label: "Explore services", href: "/services" },
      signaturePanelEnabled: true,
      signaturePanelEyebrow: "Review scope",
      signaturePanelBody: "Static planning indicators only — edit these labels to describe the review, not live telemetry.",
      marqueeTopItems: ["Environment inventory", "Access review", "Continuity planning", "Support model"],
      marqueeBottomItems: ["Assess", "Architect", "Implement", "Support", "Document"],
    }),
    moduleRecord("circuit-home-proof", "stats", "home.afterHero", 1, {
      eyebrow: "Review framework",
      heading: "Four visible checkpoints before complexity.",
      intro: "These are editable process signals, not uptime, incident, SLA, or security claims.",
      items: [
        { id: "circuit-signal-1", value: "MAP", title: "Environment context", body: "Document the systems, dependencies, and responsibilities in scope." },
        { id: "circuit-signal-2", value: "PLAN", title: "Architecture path", body: "Define the intended operating model before implementation begins." },
        { id: "circuit-signal-3", value: "BUILD", title: "Controlled rollout", body: "Sequence changes with ownership, testing, and rollback context." },
        { id: "circuit-signal-4", value: "RUN", title: "Support rhythm", body: "Make escalation, documentation, and review cadence explicit." },
      ],
    }, { presentation: "system-signals" }),
    moduleRecord("circuit-home-services", "services", "home.primaryContent", 2, {
      eyebrow: "Service architecture",
      heading: "A technical operating model built in clear layers.",
      intro: "Service names, descriptions, prices, and availability remain managed in the Services workspace.",
      source: "operational",
      items: [],
    }, { dataSource: "operational-services", presentation: "service-architecture" }),
    moduleRecord("circuit-home-advisory", "featureStory", "home.afterServices", 3, {
      eyebrow: "Technical advisory",
      heading: "Translate technical decisions into an operating plan.",
      body: "Architecture should show what changes, who owns it, how it is verified, and how the team gets support after rollout.",
      ...media("Technical advisor presenting a structured systems plan."),
      primaryCta: { label: "About the team", href: "/about" },
    }, { presentation: "technical-advisory" }),
    moduleRecord("circuit-home-team", "team", "home.afterServices", 4, {
      eyebrow: "The team",
      heading: "Technical depth with a direct communication layer.",
      intro: "Edit names, roles, biographies, portraits, and useful alt text.",
      items: [
        { id: "circuit-team-1", title: "Solutions lead", role: "Architecture / Planning", bio: "Add a concise, verifiable team biography.", ...media("Portrait of the solutions architecture lead.") },
        { id: "circuit-team-2", title: "Systems engineer", role: "Implementation / Support", bio: "Add a concise, verifiable team biography.", ...media("Portrait of the systems implementation engineer.") },
        { id: "circuit-team-3", title: "Client operations lead", role: "Delivery / Communication", bio: "Add a concise, verifiable team biography.", ...media("Portrait of the client operations lead.") },
      ],
    }),
    moduleRecord("circuit-home-reviews", "reviews", "home.afterServices", 5, {
      eyebrow: "Case stories",
      heading: "Proof belongs in the client record.",
      intro: "Published reviews remain management-owned and flow into this technical proof rail without invented outcomes.",
      source: "operational",
      items: [],
    }, { dataSource: "published-reviews", presentation: "proof-rail" }),
    moduleRecord("circuit-home-process", "process", "home.afterServices", 6, {
      eyebrow: "Delivery process",
      heading: "Implementation in explicit stages.",
      items: [
        { id: "circuit-process-1", title: "Assess", body: "Map the current environment, ownership, constraints, and decision points." },
        { id: "circuit-process-2", title: "Architect", body: "Define the target state, dependencies, rollout plan, and verification steps." },
        { id: "circuit-process-3", title: "Implement", body: "Deliver changes in controlled increments with clear communication." },
        { id: "circuit-process-4", title: "Support", body: "Maintain documentation, escalation paths, and an agreed review rhythm." },
      ],
    }),
    moduleRecord("circuit-home-briefs", "richText", "home.afterServices", 7, {
      eyebrow: "Technology briefs",
      heading: "Compact guidance for systems decisions.",
      intro: "Editable marketing notes only; this does not create another blog system.",
      items: [
        { id: "circuit-brief-1", title: "Inventory before tooling", body: "Why ownership and dependency context should precede a platform recommendation." },
        { id: "circuit-brief-2", title: "Rollout with rollback context", body: "A useful implementation plan explains verification and what happens when a step needs to be reversed." },
        { id: "circuit-brief-3", title: "Support as an operating model", body: "Escalation paths and documentation matter as much as the selected technology." },
      ],
    }, { presentation: "technology-briefs" }),
    moduleRecord("circuit-home-faq", "faq", "home.afterServices", 8, {
      eyebrow: "System questions",
      heading: "Start with clarity before a recommendation.",
      items: [
        { id: "circuit-faq-1", title: "What happens during a systems review?", body: "The review can document the current environment, priorities, constraints, ownership, and useful next decisions." },
        { id: "circuit-faq-2", title: "Can implementation be phased?", body: "Yes. A phased plan can make dependencies, testing, communication, and rollback context easier to manage." },
        { id: "circuit-faq-3", title: "How is ongoing support defined?", body: "Use this answer to describe the business's actual support hours, escalation model, and response commitments." },
      ],
    }),
    moduleRecord("circuit-home-contact-intro", "contactIntro", "home.beforeContact", 9, {
      eyebrow: "Systems review",
      heading: "Start with the environment in front of you.",
      body: "Share the current systems, the pressure point, and the decision your team needs to make next.",
      ...media("Technical consultation workspace prepared for a systems review."),
    }),
    moduleRecord("circuit-home-coverage", "serviceAreas", "home.beforeContact", 10, {
      eyebrow: "Coverage context",
      heading: "Describe the service model honestly.",
      items: [
        { id: "circuit-coverage-1", title: "Remote support", body: "Add the actual remote support scope and regions." },
        { id: "circuit-coverage-2", title: "On-site coverage", body: "Add the actual on-site coverage area and conditions." },
        { id: "circuit-coverage-3", title: "Project delivery", body: "Add the actual project and advisory delivery context." },
      ],
    }),
    moduleRecord("circuit-home-contact-details", "contactDetails", "home.beforeContact", 11, {
      heading: "Operations contact",
      items: [
        { id: "circuit-detail-office", title: "Office", body: "Add the technical team's office address" },
        { id: "circuit-detail-phone", title: "Phone", body: "Add the support or consultation phone" },
        { id: "circuit-detail-email", title: "Email", body: "Add the consultation email" },
      ],
    }),
    moduleRecord("circuit-home-hours", "hoursLocation", "home.beforeContact", 12, {
      eyebrow: "Availability",
      heading: "Published operating hours.",
      items: [
        { id: "circuit-hours-weekday", title: "Monday – Friday", body: "Add actual consultation or support hours" },
        { id: "circuit-hours-after", title: "After hours", body: "Add verified after-hours guidance if offered" },
        { id: "circuit-hours-project", title: "Project windows", body: "Add actual implementation scheduling context" },
      ],
    }),
    moduleRecord("circuit-home-map", "map", "home.beforeContact", 13, {
      eyebrow: "Location",
      heading: "Office and coverage base.",
      intro: "Add an office address or supported map embed when location is relevant.",
      query: "Add the technical office address",
      address: "Add the technical office address",
      embedUrl: "",
    }),
    moduleRecord("circuit-home-contact-form", "contactForm", "home.beforeContact", 14, {
      heading: "Request a systems review.",
      intro: "The existing Website Form handles this request without creating another form model.",
      formKey: "contact",
      submitLabel: "Send request",
    }),
    moduleRecord("circuit-home-cta", "bookingCta", "home.finalCta", 15, {
      eyebrow: "Next decision",
      heading: "Make the system easier to explain and operate.",
      body: "Begin with the environment, the constraint, and the operating outcome your team needs.",
      ...media("Technical architecture plan displayed during a client review."),
      primaryCta: { label: "Request a systems review", href: "/contact" },
    }),
  ];
}
