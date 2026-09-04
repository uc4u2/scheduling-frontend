const FORGE_MEDIA = {
  hero: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=85",
  heroDetail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85",
  heroSupport: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
  heroSecond: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=2000&q=85",
  story: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=85",
  storyDetail: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=85",
  coachOne: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=85",
  coachTwo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=85",
  coachThree: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=85",
  railOne: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=85",
  railTwo: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=85",
  railThree: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85",
  railFour: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=85",
  railFive: "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=1200&q=85",
  railSix: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
  railSeven: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=85",
  railEight: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85",
};

const media = (imageAlt = "", image = "") => ({ image, imageUrl: image, imageAlt });
const record = (id, type, slot, order, content, settings = {}) => ({
  id,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "forge-motion-original",
    source: "forge-motion-original",
    ...settings,
  },
});

export function createForgeMotionOriginalHomeModules() {
  return [
    record("forge-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Fitness & personal training",
      heading: "Build strength that holds up in real life.",
      subheading: "A focused coaching environment for strength, mobility, conditioning, and a routine you can keep using.",
      ...media("A coach supporting a client during a focused strength training session.", FORGE_MEDIA.hero),
      imagePosition: { x: 50, y: 45 },
      posterImage: "",
      secondaryImages: [FORGE_MEDIA.heroDetail, FORGE_MEDIA.heroSupport],
      secondaryImagePositions: [{ x: 50, y: 42 }, { x: 50, y: 38 }],
      secondaryImageAlts: [
        "An athlete training with focused effort in a professional fitness studio.",
        "A coached movement session showing control and training detail.",
      ],
      layerPanelEnabled: true,
      layerPanelEyebrow: "Training structure",
      layerPanelBody: "Strength · movement · repeatable progress",
      primaryCta: { label: "Explore training", href: "/services" },
      secondaryCta: { label: "Start a conversation", href: "/contact" },
      slides: [
        {
          id: "forge-hero-slide-2",
          eyebrow: "Coached movement",
          heading: "Train with purpose. Move with confidence.",
          subheading: "A second cinematic story for another training path, coach, or studio atmosphere.",
          ...media("A cinematic second training scene featuring purposeful coached movement.", FORGE_MEDIA.heroSecond),
          imagePosition: { x: 50, y: 42 },
          posterImage: "",
          primaryCta: { label: "View training options", href: "/services" },
          secondaryCta: { label: "Meet the coaches", href: "/about" },
        },
      ],
    }),
    record("forge-home-story", "featureStory", "home.afterHero", 1, {
      eyebrow: "Training philosophy",
      heading: "Coaching built around strength, consistency, and real life.",
      intro: "Explain the studio's real approach to assessment, progression, communication, and recovery.",
      body: "The strongest training plan is one the client understands and can continue. Use this space for the practice's verified philosophy rather than transformation promises.",
      ...media("A coach observing a client's movement during a structured training session.", FORGE_MEDIA.story),
      secondaryImage: FORGE_MEDIA.storyDetail,
      secondaryImageAlt: "A close training detail showing movement quality and coaching attention.",
      items: [
        { id: "forge-story-1", title: "Assess the starting point", body: "Begin with the client's current routine, movement confidence, and practical goals." },
        { id: "forge-story-2", title: "Build a repeatable plan", body: "Shape the training week around realistic frequency, support, and recovery." },
        { id: "forge-story-3", title: "Coach the details", body: "Use clear feedback and appropriate progression without unsupported outcome claims." },
      ],
      primaryCta: { label: "About the approach", href: "/about" },
    }),
    record("forge-home-team", "team", "home.primaryContent", 2, {
      eyebrow: "Coaching team",
      heading: "Introduce the people behind the training experience.",
      intro: "Replace these placeholders with verified names, roles, biographies, images, and qualifications.",
      items: [
        { id: "forge-team-1", title: "Lead coach", role: "Add verified role", body: "Add a real coach biography and only verified qualifications.", ...media("Portrait of the lead fitness coach in the training studio.", FORGE_MEDIA.coachOne) },
        { id: "forge-team-2", title: "Movement coach", role: "Add verified role", body: "Add a real coach biography and the training areas they actually support.", ...media("Portrait of a movement coach beside the studio training floor.", FORGE_MEDIA.coachTwo) },
        { id: "forge-team-3", title: "Performance coach", role: "Add verified role", body: "Add a real coach biography without invented credentials or competition history.", ...media("Portrait of a performance coach in a professional training environment.", FORGE_MEDIA.coachThree) },
      ],
    }),
    record("forge-home-services", "services", "home.primaryContent", 3, {
      eyebrow: "Training paths",
      heading: "Choose the service that fits the current goal and routine.",
      intro: "Names, descriptions, duration, pricing, availability, and booking configuration remain managed in Services.",
      source: "operational",
      items: [],
      primaryCta: { label: "View all training services", href: "/services" },
    }, { dataSource: "operational-services", presentation: "fitness-program-selector" }),
    record("forge-home-schedule", "schedule", "home.afterServices", 4, {
      eyebrow: "Displayed weekly rhythm",
      heading: "Show how a typical training week can be structured.",
      intro: "This editable marketing schedule is illustrative. Live appointment availability remains in the Schedulaa booking system.",
      items: [
        { id: "forge-schedule-1", day: "Monday", time: "07:00", title: "Strength training", format: "Studio", note: "Small group" },
        { id: "forge-schedule-2", day: "Tuesday", time: "12:00", title: "Private coaching", format: "Studio", note: "One-to-one" },
        { id: "forge-schedule-3", day: "Wednesday", time: "18:00", title: "Conditioning", format: "Studio", note: "Group" },
        { id: "forge-schedule-4", day: "Thursday", time: "08:00", title: "Mobility session", format: "Online", note: "Guided" },
        { id: "forge-schedule-5", day: "Friday", time: "17:30", title: "Performance training", format: "Studio", note: "Coached" },
        { id: "forge-schedule-6", day: "Saturday", time: "09:00", title: "Return to training", format: "Studio", note: "Small group" },
      ],
      primaryCta: { label: "Ask about training times", href: "/contact" },
    }, { presentation: "fitness-weekly-schedule", availabilityMode: "marketing-display-only" }),
    record("forge-home-proof", "stats", "home.afterServices", 5, {
      eyebrow: "Coaching standard",
      heading: "A clear structure without fabricated performance claims.",
      intro: "These indexed principles are editable. Replace them only with accurate, supportable information.",
      items: [
        { id: "forge-proof-1", value: "01", title: "Assessment", body: "Understand the starting point before selecting the training path." },
        { id: "forge-proof-2", value: "02", title: "Progression", body: "Adjust the work using the studio's real coaching approach." },
        { id: "forge-proof-3", value: "03", title: "Communication", body: "Keep expectations, feedback, and the next session understandable." },
        { id: "forge-proof-4", value: "04", title: "Consistency", body: "Build a schedule that can work beyond an ideal week." },
      ],
    }, { claimsMode: "indexed-coaching-principles" }),
    record("forge-home-portfolio", "portfolio", "home.afterServices", 6, {
      eyebrow: "Training journal",
      heading: "Movement, coaching detail, and the studio in action.",
      intro: "Replace these editable records with genuine studio media and accurate, non-transformational context.",
      items: [
        { id: "forge-work-1", title: "Strength session", category: "Studio", caption: "Studio", body: "A sample editorial record for focused strength coaching.", ...media("A client completing a controlled strength exercise with coach support.", FORGE_MEDIA.railOne) },
        { id: "forge-work-2", title: "Movement detail", category: "Mobility", caption: "Mobility", body: "A sample record focused on range, control, and coaching cues.", ...media("A close view of a guided mobility exercise in the studio.", FORGE_MEDIA.railTwo) },
        { id: "forge-work-3", title: "Conditioning rhythm", category: "Conditioning", caption: "Conditioning", body: "A sample record for a structured conditioning session.", ...media("A coached conditioning exercise in progress on a training floor.", FORGE_MEDIA.railThree) },
        { id: "forge-work-4", title: "Coaching notes", category: "Practice", caption: "Practice", body: "A sample editorial record about preparation and communication.", ...media("A coach reviewing training notes beside the studio floor.", FORGE_MEDIA.railFour) },
        { id: "forge-work-5", title: "Return to training", category: "Progression", caption: "Progression", body: "A neutral sample story about rebuilding a repeatable routine.", ...media("A client returning to structured exercise with measured coach guidance.", FORGE_MEDIA.railFive) },
        { id: "forge-work-6", title: "Studio focus", category: "Environment", caption: "Environment", body: "A sample record showing the real atmosphere of the training space.", ...media("A professional fitness studio prepared for a coaching session.", FORGE_MEDIA.railSix) },
        { id: "forge-work-7", title: "Coach in motion", category: "Coaching", caption: "Coaching", body: "A sample record for attentive coaching during a working session.", ...media("A fitness coach demonstrating a movement on the training floor.", FORGE_MEDIA.railSeven) },
        { id: "forge-work-8", title: "Recovery detail", category: "Recovery", caption: "Recovery", body: "A sample editorial record for recovery, preparation, and repeatable practice.", ...media("A quiet recovery and mobility moment inside a professional fitness studio.", FORGE_MEDIA.railEight) },
      ],
    }, { presentation: "fitness-editorial-wall" }),
    record("forge-home-cta", "bookingCta", "home.finalCta", 7, {
      eyebrow: "Next step",
      heading: "Ready to train with more intention?",
      body: "Choose a real Service or start a conversation. Availability, provider selection, review, checkout, payment, and confirmation remain system-owned.",
      backgroundImage: FORGE_MEDIA.heroDetail,
      backgroundPoster: "",
      backgroundImageAlt: "A coach demonstrating a training movement in a full-width fitness setting.",
      primaryCta: { label: "Choose a training service", href: "/services" },
    }, { presentation: "fitness-split-cta" }),
    record("forge-home-reviews", "reviews", "home.afterServices", 8, {
      eyebrow: "Client feedback",
      heading: "Published reviews from real training experiences.",
      intro: "Published Reviews remain management-owned. No fixture testimonials are stored in this module.",
      source: "operational",
      items: [],
    }, { dataSource: "published-reviews", presentation: "fitness-review-rail" }),
    record("forge-home-contact-details", "contactDetails", "home.beforeContact", 9, {
      eyebrow: "Studio details",
      heading: "Make the first training conversation specific.",
      items: [
        { id: "forge-detail-location", title: "Training location", body: "Add the studio address or service-area guidance" },
        { id: "forge-detail-phone", title: "Phone", body: "Add the studio phone" },
        { id: "forge-detail-email", title: "Email", body: "Add the studio email" },
      ],
    }),
    record("forge-home-hours", "hoursLocation", "home.beforeContact", 10, {
      eyebrow: "Studio hours",
      heading: "Share the real contact and training window.",
      items: [
        { id: "forge-hours-weekday", title: "Weekdays", body: "Add real staffed or contact hours" },
        { id: "forge-hours-weekend", title: "Weekend", body: "Add real staffed or contact hours" },
        { id: "forge-hours-note", title: "Session guidance", body: "Clarify that live availability appears only in the booking flow" },
      ],
    }),
    record("forge-home-map", "map", "home.beforeContact", 11, {
      eyebrow: "Location",
      heading: "Find the training space.",
      intro: "Add the supported studio address or map embed.",
      query: "Add the studio address",
      address: "Add the studio address",
      embedUrl: "",
    }),
    record("forge-home-contact-form", "contactForm", "home.beforeContact", 12, {
      eyebrow: "Training inquiry",
      heading: "Tell the team what you want to build.",
      intro: "The existing Website Form handles this inquiry. No newsletter or lead store is created by the theme.",
      formKey: "contact",
      submitLabel: "Send training inquiry",
    }),
  ];
}

// v5 repairs the final cross-profession Forge demo copy/media and page-level
// SEO that could
// remain after the premium visual upgrade. Authored fitness content is still
// preserved by upgradeLegacyForgeMotionHomeModules.
export const FORGE_MOTION_HOME_STARTER_VERSION = 5;

const clone = (value) => JSON.parse(JSON.stringify(value));
const normalized = (value) => String(value || "").trim().toLowerCase();

/**
 * Replaces the known Iron Ember/demo homepage that pre-dates Forge's own
 * starter composition. Authored Forge homepages are left alone; this is a
 * one-time content correction for the stale cross-profession starter only.
 */
export function upgradeLegacyForgeMotionHomeModules(modules = []) {
  const current = Array.isArray(modules) ? modules : [];
  const hero = current.find((module) => module?.type === "hero");
  const heroHeading = normalized(hero?.content?.heading || hero?.content?.title);
  const heroEyebrow = normalized(hero?.content?.eyebrow);
  const hasIronEmberBlueprint = current.some((module) =>
    String(module?.id || "").startsWith("iron-home-") ||
    normalized(module?.settings?.starterBlueprint).includes("iron-ember")
  );
  const hasKnownBarbershopStarter =
    ["cut with character.", "cut with character"].includes(heroHeading) ||
    heroEyebrow === "barbershop / grooming studio";

  if (!hasIronEmberBlueprint && !hasKnownBarbershopStarter) {
    const serialized = JSON.stringify(current);
    const repaired = serialized.replaceAll(
      "photo-1517837016564-bfc5ec3ca4d0",
      "photo-1571019614242-c5c5dee9f50b"
    );
    return repaired === serialized ? current : JSON.parse(repaired);
  }
  return clone(createForgeMotionOriginalHomeModules());
}
