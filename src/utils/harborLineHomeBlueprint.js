const moduleRecord = (id, type, slot, order, content, settings = {}) => ({
  id,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "harbor-line-original",
    source: "harbor-line-original",
    ...settings,
  },
});

const media = (imageAlt) => ({ image: "", imageUrl: "", imageAlt });

/**
 * Canonical, tenant-owned seed for Harbor Line's original property-led home.
 * The standalone template defines image roles; Website Media supplies assets.
 * Services and published reviews remain operational records.
 */
export function createHarborLineOriginalHomeModules() {
  return [
    moduleRecord("harbor-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Real Estate / Advisory",
      heading: "Find your next place to belong.",
      subheading: "Waterfront, urban, and investment guidance shaped around clearer decisions and a more considered property story.",
      ...media("A premium waterfront home framed against the city and shoreline."),
      primaryCta: { label: "Schedule a consultation", href: "/contact" },
      secondaryCta: { label: "View services", href: "/services" },
      signaturePanelEnabled: true,
      signaturePanelEyebrow: "Featured search",
      signaturePanelBody: "Use the first four top-row highlights as editable search focuses.",
      marqueeTopItems: ["Waterfront living", "Luxury resale", "Investment guidance", "Listing strategy", "Neighbourhood insight"],
      marqueeBottomItems: ["Concierge staging", "Buyer advisory", "Private tours", "Market clarity", "Offer pacing"],
    }),
    moduleRecord("harbor-home-listings", "portfolio", "home.primaryContent", 1, {
      eyebrow: "Featured listings",
      heading: "Properties that lead with image and pace.",
      intro: "Use this editorial rail for featured homes, launches, or market opportunities.",
      items: [
        { id: "harbor-listing-1", title: "Harbourfront residence", label: "Waterfront / Lake views", body: "A considered waterfront listing with room for property-specific context.", ...media("Waterfront residence with expansive lake views.") },
        { id: "harbor-listing-2", title: "City townhome", label: "Urban / Rooftop terrace", body: "A design-led city property presented with a deliberate editorial pace.", ...media("Bright interior of a premium city townhome.") },
        { id: "harbor-listing-3", title: "Investment loft", label: "Income-ready / Long view", body: "An investment opportunity framed around fit, positioning, and the longer horizon.", ...media("Design-led residential loft prepared for an investment listing.") },
      ],
      primaryCta: { label: "Buyer and seller services", href: "/services" },
    }, { presentation: "property-rail" }),
    moduleRecord("harbor-home-proof", "stats", "home.afterServices", 2, {
      eyebrow: "Market proof",
      heading: "Measured guidance, visible results.",
      items: [
        { id: "harbor-stat-1", value: "$186M", title: "Annual listing volume advised", body: "Edit this marketing proof to match verified business context." },
        { id: "harbor-stat-2", value: "42", title: "Waterfront and city launches", body: "A concise presentation metric." },
        { id: "harbor-stat-3", value: "11", title: "Years of advisory experience", body: "A concise experience metric." },
        { id: "harbor-stat-4", value: "4.9/5", title: "Client satisfaction", body: "Use only a rating the business can substantiate." },
      ],
    }),
    moduleRecord("harbor-home-advisory", "featureStory", "home.afterServices", 3, {
      eyebrow: "Advisory story",
      heading: "A calmer real estate advisory model.",
      body: "Market positioning, property storytelling, and steady decision support come together in one high-attention advisory flow.",
      ...media("Principal property advisor reviewing a waterfront listing."),
      primaryCta: { label: "Meet the advisory team", href: "/about" },
    }, { presentation: "advisory-split" }),
    moduleRecord("harbor-home-team", "team", "home.afterServices", 4, {
      eyebrow: "The advisors",
      heading: "Experience with an editorial eye.",
      intro: "Edit names, roles, biographies, portraits, and useful alt text.",
      items: [
        { id: "harbor-advisor-1", title: "Principal broker", role: "Valuation / Waterfront", bio: "Leads valuation strategy and higher-consideration property moves.", ...media("Portrait of Harbor Line's principal broker.") },
        { id: "harbor-advisor-2", title: "Listing advisor", role: "Launch / Presentation", bio: "Supports preparation, launch planning, and buyer communication.", ...media("Portrait of Harbor Line's listing advisor.") },
      ],
    }),
    moduleRecord("harbor-home-property-story", "featureStory", "home.afterServices", 5, {
      eyebrow: "Property stories",
      heading: "Listings that unfold with cinematic clarity.",
      intro: "Three editable chapters preserve the original scroll-led property narrative.",
      items: [
        { id: "harbor-story-1", kicker: "Launch", title: "Position the property before it enters the market.", body: "A deliberate opening image and clear point of view set the launch pace.", ...media("Luxury residence presented for a waterfront launch.") },
        { id: "harbor-story-2", kicker: "Interior", title: "Let detail carry the property story.", body: "Interior photography and written context help buyers understand the home.", ...media("Bright premium interior photographed with calm editorial detail.") },
        { id: "harbor-story-3", kicker: "Long view", title: "Frame investment opportunities with context.", body: "Acquisition fit and positioning are presented beyond the first impression.", ...media("Residential investment property viewed within its neighbourhood.") },
      ],
    }, { presentation: "property-story" }),
    moduleRecord("harbor-home-buyer-seller", "serviceAreas", "home.afterServices", 6, {
      eyebrow: "Two considered paths",
      heading: "Guidance for both sides of the move.",
      items: [
        { id: "harbor-sellers", title: "For sellers", body: "Positioning, launch pacing, pricing context, and buyer communication that feel deliberate." },
        { id: "harbor-buyers", title: "For buyers", body: "Search strategy that keeps shortlists, touring, and offers more measured." },
      ],
    }, { presentation: "buyer-seller" }),
    moduleRecord("harbor-home-reviews", "reviews", "home.afterServices", 7, {
      eyebrow: "Client stories",
      heading: "Trust built through presentation and guidance.",
      intro: "Published client reviews remain management-owned and flow into this property-native story rail.",
      source: "operational",
      items: [],
    }, { dataSource: "published-reviews" }),
    moduleRecord("harbor-home-faq", "faq", "home.afterServices", 8, {
      eyebrow: "Questions",
      heading: "Property conversations before guesswork.",
      items: [
        { id: "harbor-faq-1", title: "Can I reach out before I know whether I am buying or selling?", body: "Yes. A first consultation can clarify the strongest path before a formal search or listing begins." },
        { id: "harbor-faq-2", title: "Do you support investment conversations?", body: "Yes. Investment planning can cover acquisition fit, positioning, and longer-view context." },
        { id: "harbor-faq-3", title: "Can you help with listing presentation?", body: "Yes. Seller guidance can include preparation, staging context, and launch presentation." },
      ],
    }),
    moduleRecord("harbor-home-contact-intro", "contactIntro", "home.beforeContact", 9, {
      eyebrow: "Private inquiry",
      heading: "Start the right property conversation.",
      body: "Share whether you are buying, selling, or investing and the team will guide the next useful step.",
      ...media("Waterfront property viewed in the warm light of early evening."),
    }),
    moduleRecord("harbor-home-contact-details", "contactDetails", "home.beforeContact", 10, {
      heading: "Advisory details",
      items: [
        { id: "harbor-detail-office", title: "Office", body: "Add the advisory office location" },
        { id: "harbor-detail-phone", title: "Phone", body: "Add the advisory phone" },
        { id: "harbor-detail-email", title: "Email", body: "Add the advisory email" },
      ],
    }),
    moduleRecord("harbor-home-hours", "hoursLocation", "home.beforeContact", 11, {
      eyebrow: "Availability",
      heading: "Consultation and tour rhythm.",
      items: [
        { id: "harbor-hours-mon", title: "Monday", body: "Consultations 10:00 – 18:00" },
        { id: "harbor-hours-tue", title: "Tuesday", body: "Property tours 09:00 – 19:00" },
        { id: "harbor-hours-wed", title: "Wednesday", body: "Listing preparation 10:00 – 18:00" },
        { id: "harbor-hours-thu", title: "Thursday", body: "Buyer calls 09:00 – 19:00" },
        { id: "harbor-hours-fri", title: "Friday", body: "Offer review 10:00 – 17:00" },
      ],
    }),
    moduleRecord("harbor-home-map", "map", "home.beforeContact", 12, {
      eyebrow: "Location",
      heading: "Meet by appointment.",
      intro: "Add the office address or a supported map embed.",
      query: "Add your advisory office address",
      address: "Add your advisory office address",
      embedUrl: "",
    }),
    moduleRecord("harbor-home-contact-form", "contactForm", "home.beforeContact", 13, {
      heading: "Tell us about the move.",
      intro: "The existing Website Form handles this inquiry without creating another form model.",
      formKey: "contact",
      submitLabel: "Send inquiry",
    }),
    moduleRecord("harbor-home-cta", "bookingCta", "home.finalCta", 14, {
      eyebrow: "List with Harbor Line",
      heading: "Ready to position your property?",
      body: "Begin with timing, valuation, and how the property should be presented before it reaches the market.",
      ...media("Premium residence prepared for its market launch."),
      primaryCta: { label: "Contact Harbor Line", href: "/contact" },
    }),
  ];
}
