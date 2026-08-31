const media = (imageAlt = "") => ({ image: "", imageUrl: "", imageAlt });
const record = (id, type, slot, order, content, settings = {}) => ({
  id, type, slot, order, enabled: true, content,
  settings: { createdInBuilder: true, starterBlueprint: "axis-and-co-original", source: "axis-and-co-original", ...settings },
});

export function createAxisAndCoOriginalHomeModules() {
  return [
    record("axis-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Business consulting / executive clarity",
      heading: "Sharper operating strategy for teams under real pressure.",
      subheading: "Support leadership with clearer priorities, stronger operating context, and a practical movement path.",
      ...media("An executive strategy workspace prepared for a leadership conversation."),
      primaryCta: { label: "Request a consultation", href: "/contact" },
      secondaryCta: { label: "Explore expertise", href: "/services" },
    }),
    record("axis-home-strategy-rail", "trustRail", "home.afterHero", 1, {
      eyebrow: "Strategic vocabulary", heading: "Strategy that connects direction to movement.",
      items: [
        { id: "axis-rail-1", title: "Strategy design" }, { id: "axis-rail-2", title: "Leadership clarity" },
        { id: "axis-rail-3", title: "Execution pacing" }, { id: "axis-rail-4", title: "Decision architecture" },
        { id: "axis-rail-5", title: "Transformation support" },
      ],
    }),
    record("axis-home-services", "services", "home.primaryContent", 2, {
      eyebrow: "Expertise selector", heading: "Choose the pressure point, then shape the advisory route.",
      intro: "Current consulting services and prices remain managed in Services.", source: "operational", items: [],
      primaryCta: { label: "View all expertise", href: "/services" },
    }, { dataSource: "operational-services", presentation: "expertise-selector" }),
    record("axis-home-problems", "richText", "home.afterServices", 3, {
      eyebrow: "Typical client tensions", heading: "The work often starts where clarity is expensive.",
      intro: "Edit these examples to describe the real strategic context your practice supports.", items: [
        { id: "axis-problem-1", title: "Too many strategic priorities", body: "The plan is crowded, but the leadership team still cannot name the decisions that matter most." },
        { id: "axis-problem-2", title: "Execution drag across teams", body: "Ownership feels diffuse, coordination is expensive, and important work slows between teams." },
        { id: "axis-problem-3", title: "Growth without a steadier rhythm", body: "Leadership conversations have become reactive instead of creating a cleaner operating pace." },
      ],
    }),
    record("axis-home-case-studies", "portfolio", "home.afterServices", 4, {
      eyebrow: "Case stories", heading: "Advisory examples with a stronger operating lens.",
      intro: "Use honest sample or tenant-authored stories; do not imply client results without evidence.", items: [
        { id: "axis-case-1", title: "Planning rhythm reset", category: "Sample / strategy design", body: "An editable example about reducing competing priorities and shaping a clearer planning cadence.", ...media("A leadership workshop and strategic planning wall.") },
        { id: "axis-case-2", title: "Operations decision map", category: "Sample / operations", body: "An editable example focused on ownership, handoffs, and execution pacing.", ...media("A business operations meeting with decision-planning documents.") },
        { id: "axis-case-3", title: "Growth path recalibration", category: "Sample / leadership", body: "An editable example about reframing growth priorities without claiming a result.", ...media("An executive team in a strategy conversation.") },
      ],
    }),
    record("axis-home-proof", "stats", "home.afterServices", 5, {
      eyebrow: "Practice structure", heading: "Honest proof about how the practice works.", items: [
        { id: "axis-proof-1", value: "01", title: "Frame", body: "Clarify the decision or tension that needs work." },
        { id: "axis-proof-2", value: "02", title: "Context", body: "Map people, pacing, and operating constraints." },
        { id: "axis-proof-3", value: "03", title: "Sequence", body: "Design a movement path the team can use." },
        { id: "axis-proof-4", value: "04", title: "Support", body: "Keep execution connected where appropriate." },
      ],
    }),
    record("axis-home-team", "team", "home.primaryContent", 6, {
      eyebrow: "Consulting team", heading: "Introduce the advisors behind the work.",
      intro: "Use real names, roles, biographies, and qualifications only when supplied.", items: [
        { id: "axis-team-1", title: "Consultant profile", role: "Add verified role", body: "Add a real consultant biography.", ...media("Portrait of a business consultant in an executive workspace.") },
        { id: "axis-team-2", title: "Strategy advisor", role: "Add verified role", body: "Add a real advisor biography.", ...media("Portrait of a strategy advisor preparing a workshop.") },
        { id: "axis-team-3", title: "Operations advisor", role: "Add verified role", body: "Add a real advisor biography.", ...media("Portrait of an operations advisor in a professional setting.") },
      ],
    }),
    record("axis-home-process", "process", "home.afterServices", 7, {
      eyebrow: "Framework", heading: "Strategy becomes useful when the sequence is clear.",
      intro: "Describe the real consulting approach.", items: [
        { id: "axis-step-1", title: "Frame the real problem", body: "Begin with the decision, tension, or pressure that actually needs work." },
        { id: "axis-step-2", title: "Shape the operating context", body: "Map the people, pacing, and structural friction around the problem." },
        { id: "axis-step-3", title: "Design a movement path", body: "Create a strategic route or operating pattern the team can use." },
        { id: "axis-step-4", title: "Support execution", body: "Where appropriate, carry the work into implementation without promising outcomes." },
      ],
    }),
    record("axis-home-industries", "serviceAreas", "home.afterServices", 8, {
      eyebrow: "Industries & contexts", heading: "Context matters almost as much as strategy.",
      intro: "List only contexts where the practice genuinely works.", items: [
        { id: "axis-industry-1", title: "Professional services" }, { id: "axis-industry-2", title: "Health & wellness" },
        { id: "axis-industry-3", title: "Hospitality" }, { id: "axis-industry-4", title: "Multi-site services" },
        { id: "axis-industry-5", title: "Founder-led organizations" },
      ],
    }),
    record("axis-home-reviews", "reviews", "home.afterServices", 9, {
      eyebrow: "Client reviews", heading: "Published client perspectives.",
      intro: "Published Reviews remain management-owned.", source: "operational", items: [],
    }, { dataSource: "published-reviews", presentation: "client-story-rail" }),
    record("axis-home-guidance", "featureStory", "home.afterServices", 10, {
      eyebrow: "Strategy notes", heading: "Short guidance for cleaner thinking.",
      intro: "Editable consulting guidance—not a separate blog.", items: [
        { id: "axis-note-1", title: "Activity is not always progress", body: "A crowded plan can still be strategically weak; clearer choices and sequencing may matter more." },
        { id: "axis-note-2", title: "What alignment requires", body: "Alignment can mean a shared frame, cleaner ownership, and a better decision rhythm." },
        { id: "axis-note-3", title: "When operations reveal strategy", body: "Execution friction can point to unresolved prioritization rather than slow work." },
      ],
    }),
    record("axis-home-faq", "faq", "home.afterServices", 11, {
      eyebrow: "Questions", heading: "Clarify the starting conversation.", items: [
        { id: "axis-faq-1", question: "Do we need an exact scope before reaching out?", answer: "No. An initial conversation can begin with a decision, friction point, or growth question." },
        { id: "axis-faq-2", question: "Can the work involve a leadership team?", answer: "Edit this answer to describe the practice's current engagement model." },
        { id: "axis-faq-3", question: "Can strategy and execution be considered together?", answer: "Edit this answer with the practice's actual approach and boundaries." },
      ],
    }),
    record("axis-home-contact-intro", "contactIntro", "home.beforeContact", 12, {
      eyebrow: "Consultation", heading: "Bring the strategic issue into a clearer first conversation.",
      intro: "Describe the decision, growth pressure, or operating issue your team is navigating.", body: "Use the existing Website Form for a non-urgent consultation inquiry.",
      ...media("An executive consultation space prepared for a private strategy conversation."), primaryCta: { label: "Request consultation", href: "/contact" },
    }),
    record("axis-home-contact-details", "contactDetails", "home.beforeContact", 13, {
      heading: "Practice details", items: [
        { id: "axis-detail-office", title: "Office", body: "Add the office location" },
        { id: "axis-detail-phone", title: "Phone", body: "Add the practice phone" },
        { id: "axis-detail-email", title: "Email", body: "Add the practice email" },
      ],
    }),
    record("axis-home-contact-form", "contactForm", "home.beforeContact", 14, {
      heading: "Request a strategy conversation.", intro: "The existing Website Form handles this inquiry.", formKey: "contact", submitLabel: "Send inquiry",
    }),
    record("axis-home-cta", "bookingCta", "home.finalCta", 15, {
      eyebrow: "A clearer starting point", heading: "Turn the pressure into a useful first conversation.",
      body: "Choose an expertise path or contact the practice for guidance.", primaryCta: { label: "Request consultation", href: "/contact" },
    }),
  ];
}
