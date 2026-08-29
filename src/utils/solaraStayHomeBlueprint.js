const moduleRecord = (id, type, slot, order, content, settings = {}) => ({
  id, type, slot, order, enabled: true, content,
  settings: { createdInBuilder: true, starterBlueprint: "solara-stay-original", source: "solara-stay-original", ...settings },
});
const media = (imageAlt) => ({ image: "", imageUrl: "", imageAlt });

export function createSolaraStayOriginalHomeModules() {
  return [
    moduleRecord("solara-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Hospitality / Destination stay", heading: "Stay longer in warmer light.",
      subheading: "A destination-led stay shaped around atmosphere, local rhythm, and thoughtful hospitality.",
      ...media("Warm destination accommodation photographed in evening light."),
      primaryCta: { label: "Plan a stay", href: "/contact" }, secondaryCta: { label: "Explore experiences", href: "/services" },
      marqueeTopItems: ["Ocean-view stays", "Late breakfast pacing", "Local dining", "Sunset arrivals"],
      marqueeBottomItems: ["Boutique interiors", "Local routes", "Curated extras", "Arrival ease"],
    }),
    moduleRecord("solara-home-stays", "services", "home.primaryContent", 1, {
      eyebrow: "Stay collection", heading: "Rooms and experiences with more atmosphere.",
      intro: "Current services and stay offerings remain managed in the Services workspace.", source: "operational", items: [],
    }, { dataSource: "operational-services", presentation: "stay-rail" }),
    moduleRecord("solara-home-destination-story", "featureStory", "home.afterHero", 2, {
      eyebrow: "Destination notes", heading: "Editorial hospitality, not generic rooms.",
      body: "Shape the story of the stay, the surrounding place, and the slower rhythm guests can expect before they arrive.",
      ...media("Warm suite interior showing the atmosphere of the destination stay."), secondaryImage: "",
      secondaryImageAlt: "Landscape or local detail supporting the destination story.", primaryCta: { label: "About the stay", href: "/about" },
    }, { presentation: "destination-story" }),
    moduleRecord("solara-home-local-guide", "richText", "home.afterServices", 3, {
      eyebrow: "Local guide", heading: "Notes that shape a slower destination weekend.",
      intro: "Editable hospitality guidance only; this does not create another blog system.", items: [
        { id: "solara-guide-1", title: "Where guests linger", body: "Describe a real local ritual, route, or moment guests often enjoy.", ...media("A quiet local morning ritual near the destination.") },
        { id: "solara-guide-2", title: "A useful first route", body: "Share a considered local route without inventing partner offers or availability.", ...media("A local destination route photographed in warm light.") },
        { id: "solara-guide-3", title: "Plan before arrival", body: "Explain which real details are easiest to arrange before a guest arrives.", ...media("Travel notes and arrival details prepared before a stay.") },
      ],
    }, { presentation: "local-guide" }),
    moduleRecord("solara-home-reviews", "reviews", "home.afterServices", 4, {
      eyebrow: "Guest stories", heading: "Guests remember the pacing.", intro: "Published Reviews remain management-owned.", source: "operational", items: [],
    }, { dataSource: "published-reviews", presentation: "guest-stories" }),
    moduleRecord("solara-home-faq", "faq", "home.afterServices", 5, {
      eyebrow: "Planning questions", heading: "Stay planning before guesswork.", items: [
        { id: "solara-faq-1", title: "Can we ask questions before choosing an offering?", body: "Use this answer to explain the real inquiry and planning process." },
        { id: "solara-faq-2", title: "What can be planned before arrival?", body: "Describe actual pre-arrival support without promising unavailable services." },
        { id: "solara-faq-3", title: "Do offerings change seasonally?", body: "State how guests can confirm current services and seasonal options." },
      ],
    }),
    moduleRecord("solara-home-contact-intro", "contactIntro", "home.beforeContact", 6, {
      eyebrow: "Destination location", heading: "Arrive with the place already in mind.",
      body: "Introduce the destination, travel context, and the best way to begin a stay inquiry.", ...media("Destination landscape near the stay location."),
    }),
    moduleRecord("solara-home-contact-details", "contactDetails", "home.beforeContact", 7, {
      heading: "Stay and destination details", items: [
        { id: "solara-detail-location", title: "Destination", body: "Add the destination or address" },
        { id: "solara-detail-phone", title: "Phone", body: "Add the inquiry phone" },
        { id: "solara-detail-email", title: "Email", body: "Add the inquiry email" },
      ],
    }),
    moduleRecord("solara-home-hours", "hoursLocation", "home.beforeContact", 8, {
      eyebrow: "Guest planning", heading: "Arrival and inquiry hours.", items: [
        { id: "solara-hours-inquiry", title: "Inquiries", body: "Add real response hours" },
        { id: "solara-hours-arrival", title: "Arrival", body: "Add actual arrival guidance" },
        { id: "solara-hours-location", title: "Destination", body: "Add current location context" },
      ],
    }),
    moduleRecord("solara-home-map", "map", "home.beforeContact", 9, { eyebrow: "Location", heading: "Find the destination.", intro: "Add an address or supported map embed.", query: "Add the destination address", address: "Add the destination address", embedUrl: "" }),
    moduleRecord("solara-home-contact-form", "contactForm", "home.beforeContact", 10, { heading: "Start the right stay conversation.", intro: "The existing Website Form handles this inquiry.", formKey: "contact", submitLabel: "Send inquiry" }),
    moduleRecord("solara-home-cta", "bookingCta", "home.finalCta", 11, { eyebrow: "Plan the stay", heading: "Begin with dates, pace, and place.", body: "Share what you are planning and use the existing inquiry route for the next step.", ...media("Warm destination detail at the close of a guest stay."), primaryCta: { label: "Plan a stay", href: "/contact" } }),
  ];
}
