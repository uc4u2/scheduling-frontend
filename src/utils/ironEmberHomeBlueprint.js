const image = (url) => ({ image: url, imageUrl: url });

const moduleRecord = (id, type, slot, order, content) => ({
  id,
  type,
  enabled: true,
  slot,
  order,
  variant: type === "hero" ? "iron-ember-editorial" : null,
  content,
  settings: { createdInBuilder: true, starterBlueprint: "iron-ember-original" },
});

const HERO_IMAGE = "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1800&q=85";
const TOOLS_IMAGE = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=85";
const FADE_IMAGE = "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1600&q=85";
const BEARD_IMAGE = "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1600&q=85";
const DETAIL_IMAGE = "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1600&q=85";

const SELECTED_CUTS = [
  ["precision-fade", "Precision Fade", "Blend / Graduation", "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1400&q=85", "Barber refining a precise fade on the side of a client's haircut."],
  ["beard-detailing", "Beard Detailing", "Outline / Balance", "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1400&q=85", "Barber carefully shaping a client's beard with close attention to the outline."],
  ["scissor-finish", "Scissor Finish", "Shear Work / Shape", "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1400&q=85", "Barber using scissors to finish the top of a client's haircut in a dark studio."],
  ["consultation", "The Consultation", "Profile / Planning", "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1400&q=85", "Barber and client discussing the haircut shape beside the studio chair."],
  ["between-chairs", "Between Chairs", "Studio / Ritual", "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=85", "Barbershop chair and tools arranged in a warm, low-lit studio moment."],
  ["texture-work", "Texture Work", "Movement / Control", "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=85", "Barber working texture through a client's hair with comb and scissors."],
  ["final-styling", "Final Styling", "Finish / Direction", "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=85", "Barber completing the final styling and direction of a finished haircut."],
  ["craft-at-hand", "Craft at Hand", "Tools / Close Detail", "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1400&q=85", "Close-up of a barber's hands and tools during detailed grooming work."],
].map(([id, title, category, url, imageAlt]) => ({
  id,
  title,
  category,
  ...image(url),
  imageAlt,
  href: "",
}));

/**
 * Canonical, editable module defaults for the original Iron Ember homepage.
 * This is content seed data for WebsitePage.content.modules—not a renderer
 * fallback or a second persistence path. Return a clone so Builder edits never
 * mutate the shared blueprint in memory.
 */
export function createIronEmberOriginalHomeModules() {
  const modules = [
    moduleRecord("iron-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Barbershop / Grooming Studio",
      heading: "Cut With Character.",
      subheading: "A premium neighborhood barbershop for fades, beard shaping, texture work, and steady client routines.",
      signaturePanelEnabled: true,
      signaturePanelServiceLimit: 4,
      signaturePanelEyebrow: "Signature services",
      signaturePanelBody: "A considered menu — choose a service to begin.",
      marqueeTopItems: ["Cut Rituals", "Fade Detail", "Beard Architecture", "Consultation First", "Queen West Studio"],
      marqueeBottomItems: ["Measured barbering", "Sharp finishing", "Texture work", "Low-noise appointments", "Routine-ready shape"],
      ...image(HERO_IMAGE),
      imageAlt: "Barber cutting a client's hair in a dark studio.",
      secondaryImages: [],
      primaryCta: { label: "Book a Cut", href: "/services" },
      secondaryCta: { label: "View Services", href: "/services" },
    }),
    moduleRecord("iron-home-proof", "stats", "home.primaryContent", 1, {
      eyebrow: "The standard",
      heading: "Measured barbering. Sharp finishing.",
      intro: "Iron Ember is built for clients who want a routine that keeps working between visits.",
      items: [
        { id: "craft-years", value: "12+", title: "Years craft experience" },
        { id: "repeat-visits", value: "2k+", title: "Repeat appointments" },
        { id: "weekly-days", value: "6", title: "Days open weekly" },
      ],
    }),
    moduleRecord("iron-home-services", "services", "home.primaryContent", 2, {
      eyebrow: "Service menu",
      heading: "Signature cuts, fades, and beard work.",
      intro: "The menu is tight on purpose. Each service is designed around better shape, better grow-out, and a cleaner conversation about maintenance.",
      source: "operational",
      items: [],
    }),
    moduleRecord("iron-home-studio-story", "richText", "home.afterServices", 3, {
      eyebrow: "The studio",
      heading: "Built for clients who want precision without the theatre.",
      intro: "Classic discipline. Contemporary rhythm.",
      body: "Every appointment is built around shape, growth pattern, and maintenance rhythm. The goal is simple: cuts that settle well, grow out cleanly, and feel intentional in real life instead of only in the mirror chair.",
      ...image(TOOLS_IMAGE),
      imageAlt: "Barber tools arranged carefully on a dark wooden surface.",
      primaryCta: { label: "Explore the studio", href: "/about" },
    }),
    moduleRecord("iron-home-team", "team", "home.afterServices", 4, {
      eyebrow: "The studio",
      heading: "Meet the barbers.",
      intro: "A small team with a deliberate chair-side rhythm.",
      items: [
        { id: "marcus-vale", title: "Marcus Vale", role: "Founder / Lead Barber", bio: "Skin fades, textured scissor work, and beard architecture with a quiet, appointment-led experience.", ...image("https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=1000&q=85"), imageAlt: "Portrait of the lead barber." },
        { id: "nate-hsu", title: "Nate Hsu", role: "Barber", bio: "Known for consistent lineups, thoughtful consultation, and low-maintenance styling plans.", ...image("https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=85"), imageAlt: "Portrait of a barber." },
      ],
    }),
    moduleRecord("iron-home-craft-story", "featureStory", "home.afterServices", 5, {
      eyebrow: "The craft",
      heading: "Craft in three acts.",
      intro: "Scroll through the station, the detail, and the finish.",
      items: [
        { id: "craft-tools", kicker: "Tools", title: "Every service starts with the station set for a cleaner, more deliberate pace.", body: "The tools, consultation notes, and service rhythm are prepared before the first line is cut.", ...image(TOOLS_IMAGE), imageAlt: "Barber tools arranged carefully on a dark wooden surface." },
        { id: "craft-detail", kicker: "Detail", title: "Clipper and shear work move from structure to detail instead of racing toward the finish.", body: "Graduation, balance, and texture are developed in sequence so the shape lasts beyond the appointment.", ...image(FADE_IMAGE), imageAlt: "Precision haircut in progress." },
        { id: "craft-finish", kicker: "Finish", title: "The final lines, beard shape, and product guidance keep working after you leave.", body: "Every visit closes with practical finish and maintenance guidance for the weeks between chair times.", ...image(BEARD_IMAGE), imageAlt: "Beard shaping and finishing work in the chair." },
      ],
    }),
    moduleRecord("iron-home-selected-cuts", "selectedCuts", "home.selectedCuts", 6, {
      eyebrow: "Selected Cuts",
      heading: "Fresh from the chair.",
      intro: "Eight studies in shape, texture, restraint, and the small finishing decisions that make a cut hold together beyond day one.",
      items: SELECTED_CUTS,
    }),
    moduleRecord("iron-home-chair-time", "richText", "home.afterServices", 7, {
      eyebrow: "Chair Time, Elevated",
      heading: "Precision without noise.",
      intro: "A stronger chair-side rhythm.",
      body: "Every visit is paced around consultation, shape, and a stronger finish instead of a rushed rotation. One-chair rhythm, maintenance guidance, and deliberate finishing are built into the visit.",
      ...image(FADE_IMAGE),
      imageAlt: "Precision barber work during a measured chair-time appointment.",
      primaryCta: { label: "Request a consultation", href: "/contact" },
    }),
    moduleRecord("iron-home-gallery", "gallery", "home.afterServices", 8, {
      eyebrow: "Shop Gallery",
      heading: "Full-width craft, not clutter.",
      intro: "Warm light, sharp tools, and enough quiet to keep the chair experience measured.",
      items: [
        { id: "gallery-tools", title: "The station", caption: "Tools set for a deliberate service.", ...image(TOOLS_IMAGE), imageAlt: "Barber tools arranged on a dark wooden surface." },
        { id: "gallery-fade", title: "Precision work", caption: "A fade taking shape in the chair.", ...image(FADE_IMAGE), imageAlt: "Precision haircut in progress." },
        { id: "gallery-beard", title: "The finish", caption: "Beard shaping and finishing detail.", ...image(BEARD_IMAGE), imageAlt: "Client receiving beard shaping service." },
        { id: "gallery-detail", title: "Craft at hand", caption: "Close work that holds the whole shape together.", ...image(DETAIL_IMAGE), imageAlt: "Barber hands and tools during detailed grooming work." },
      ],
    }),
    moduleRecord("iron-home-process", "process", "home.afterServices", 9, {
      eyebrow: "The Process",
      heading: "Consultation to finish.",
      intro: "Three measured stages, one clean result.",
      items: [
        { id: "process-consultation", title: "Consultation", body: "Every visit starts with growth pattern, density, routine, and finish preference so the cut is shaped for real life rather than only the first day." },
        { id: "process-detail", title: "Cut & Detail", body: "Clipper, shear, taper, and beard detailing are paced around the service rather than rushed into a one-size routine." },
        { id: "process-finish", title: "Finish & Maintenance", body: "We close with product, grow-out, and rebooking guidance so the result keeps working after the chair time ends." },
      ],
    }),
    moduleRecord("iron-home-reviews", "reviews", "home.afterServices", 10, {
      eyebrow: "Client stories",
      heading: "Local trust, earned in the chair.",
      intro: "Clients come back for stronger shape, steadier pacing, and a result that still looks right long after the appointment ends.",
      source: "marketing",
      items: [
        { id: "review-adrian", title: "Adrian Cole", author: "Adrian Cole", role: "Creative Director", rating: 5, body: "The consultation is direct, the fade work is exact, and the cut still looks right three weeks later." },
        { id: "review-lewis", title: "Lewis Grant", author: "Lewis Grant", role: "Product Lead", rating: 5, body: "It feels premium without being performative. I know exactly what I’m getting every visit." },
        { id: "review-micah", title: "Micah Stone", author: "Micah Stone", role: "Photographer", rating: 5, body: "Best beard cleanup I’ve had in the city. Sharp lines, no over-trimming, and a better maintenance plan." },
      ],
    }),
    moduleRecord("iron-home-faq", "faq", "home.afterServices", 11, {
      eyebrow: "Questions",
      heading: "Cut talk before confusion.",
      intro: "The practical details before your first chair time.",
      items: [
        { id: "faq-walkins", question: "Do you take walk-ins?", answer: "The studio is appointment-led. Contact us and we will guide you to the next opening." },
        { id: "faq-new", question: "What should I book if I am new?", answer: "Start with the Signature Cut so we can assess your hair pattern, routine, and desired finish." },
        { id: "faq-products", question: "Can I ask for product guidance?", answer: "Yes. Product and styling guidance are included when relevant to the service." },
      ],
    }),
    moduleRecord("iron-home-contact-intro", "contactIntro", "home.beforeContact", 12, {
      eyebrow: "Studio details",
      heading: "Plan the visit before you arrive.",
      intro: "Request your chair time.",
      body: "Reach out with the service you want, how you wear your hair now, and whether you need a sharp clean-up or a full refresh.",
      image: "",
      imageUrl: "",
      imageAlt: "",
      primaryCta: { label: "Book a chair", href: "/contact" },
    }),
    moduleRecord("iron-home-contact-details", "contactDetails", "home.beforeContact", 13, {
      heading: "Studio details",
      intro: "",
      items: [
        { id: "detail-studio", title: "Studio", body: "Queen West, Toronto" },
        { id: "detail-phone", title: "Phone", body: "+1 (647) 555-2081", href: "tel:+16475552081" },
        { id: "detail-email", title: "Email", body: "hello@ironember.co", href: "mailto:hello@ironember.co" },
      ],
    }),
    moduleRecord("iron-home-hours", "hoursLocation", "home.beforeContact", 14, {
      heading: "Studio hours",
      intro: "",
      items: [
        ["Mon", "11:00 - 19:00"], ["Tue", "11:00 - 19:00"], ["Wed", "10:00 - 20:00"], ["Thu", "10:00 - 20:00"],
        ["Fri", "10:00 - 19:00"], ["Sat", "09:00 - 18:00"], ["Sun", "Closed"],
      ].map(([title, body]) => ({ id: `hours-${title.toLowerCase()}`, title, body })),
    }),
    moduleRecord("iron-home-map", "map", "home.beforeContact", 15, {
      heading: "Iron Ember location",
      intro: "Queen West, Toronto",
      query: "Queen West, Toronto",
      address: "Queen West, Toronto",
      embedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=-79.426%2C43.639%2C-79.401%2C43.652&layer=mapnik&marker=43.6465%2C-79.4135",
      primaryCta: { label: "Open studio map", href: "https://maps.google.com/?q=Queen+West+Toronto" },
    }),
  ];

  return JSON.parse(JSON.stringify(modules));
}
