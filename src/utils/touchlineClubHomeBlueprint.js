const starter = (role) => `starter-media://touchline-club/${role}`;

const record = (id, type, slot, order, content, settings = {}) => ({
  id,
  type,
  slot,
  order,
  enabled: true,
  variant: null,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "touchline-club-original",
    source: "touchline-club-original",
    ...settings,
  },
});

export function createTouchlineClubOriginalHomeModules() {
  return [
    record("touchline-home-hero", "hero", "home.hero", 0, {
      contextLabel: "Community soccer • play • belonging",
      heading: "A place to play, learn, and belong.",
      subheading: "A welcoming starting point for players, families, volunteers, and community supporters.",
      image: starter("hero"),
      imageUrl: starter("hero"),
      imageAlt: "A fictional group of young soccer players running together on a sunny community field.",
      primaryCta: { label: "Explore programs", href: "/services" },
      secondaryCta: { label: "Get involved", href: "/get-involved" },
    }),
    record("touchline-home-story", "featureStory", "home.afterHero", 1, {
      eyebrow: "More than a game",
      heading: "Soccer can bring a community together.",
      body: "A strong club experience makes room for learning, friendship, confidence, and fun.",
      image: starter("friendship"),
      imageUrl: starter("friendship"),
      imageAlt: "Fictional young soccer players sharing a happy moment after playing together.",
      primaryCta: { label: "About the club", href: "/about" },
    }),
    record("touchline-home-pathways", "trustRail", "home.primaryContent", 2, {
      eyebrow: "Community pathways",
      heading: "Play. Learn. Belong.",
      intro: "Clear, welcoming paths can help every visitor understand where they fit.",
      items: [
        { id: "touchline-play", title: "Play", body: "Find an appropriate way to participate.", image: starter("hero") },
        { id: "touchline-learn", title: "Learn", body: "Explore coaching and development opportunities.", image: starter("training") },
        { id: "touchline-belong", title: "Belong", body: "Build friendship and community connection.", image: starter("friendship") },
      ],
    }, { presentation: "interactive-list" }),
    record("touchline-home-journey", "process", "home.afterServices", 3, {
      eyebrow: "A clear next step",
      heading: "From interest to the field.",
      items: [
        { id: "touchline-step-1", title: "Explore confirmed options", body: "Review the programs the club has approved." },
        { id: "touchline-step-2", title: "Check the details", body: "Confirm dates, fees, equipment, and location." },
        { id: "touchline-step-3", title: "Use the verified next step", body: "Continue to the approved registration destination." },
      ],
    }),
    record("touchline-home-gallery", "gallery", "home.afterServices", 4, {
      eyebrow: "Community moments",
      heading: "The energy around the game.",
      intro: "Replace these fictional starter images with approved club photography.",
      items: [
        { id: "touchline-moment-1", caption: "Learning together", image: starter("training"), imageAlt: "A fictional coach guiding young soccer players." },
        { id: "touchline-moment-2", caption: "Families on the touchline", image: starter("families"), imageAlt: "Fictional families enjoying a community soccer activity." },
        { id: "touchline-moment-3", caption: "Community support", image: starter("volunteers"), imageAlt: "Fictional volunteers preparing soccer equipment." },
      ],
    }),
    record("touchline-home-reviews", "reviews", "home.afterServices", 5, {
      eyebrow: "Published feedback",
      heading: "What the community shares.",
      intro: "Only published customer reviews appear here.",
      source: "operational",
      items: [],
    }, { dataSource: "published-reviews", presentation: "community-stories" }),
    record("touchline-home-contact", "contactForm", "home.beforeContact", 6, {
      eyebrow: "Contact",
      heading: "Start the conversation.",
      intro: "Ask about programs, registration, volunteering, coaching, or community support.",
      mediaImage: starter("contact"),
      mediaAlt: "A fictional parent and community sport organizer having a welcoming conversation.",
      formKey: "contact",
      submitLabel: "Send message",
    }),
    record("touchline-home-cta", "cta", "home.finalCta", 7, {
      eyebrow: "Ready when the details are",
      heading: "Find your place in the game.",
      body: "Explore confirmed opportunities or contact the club for the information you need.",
      image: starter("field"),
      imageAlt: "A sunny community soccer field prepared for a local activity.",
      primaryCta: { label: "Explore programs", href: "/services" },
    }),
  ];
}
