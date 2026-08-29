const moduleRecord = (id, type, slot, order, content, settings = {}) => ({
  id,
  type,
  slot,
  order,
  enabled: true,
  content,
  settings: {
    createdInBuilder: true,
    starterBlueprint: "frame-and-field-original",
    source: "frame-and-field-original",
    ...settings,
  },
});

const media = (imageAlt) => ({ image: "", imageUrl: "", imageAlt });

export function createFrameAndFieldOriginalHomeModules() {
  return [
    moduleRecord("frame-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Photography / Creative studio",
      heading: "We frame stories.",
      subheading: "Cinematic image-making for people, places, campaigns, and considered creative work.",
      ...media("A cinematic editorial photograph anchoring the Frame and Field studio homepage."),
      secondaryImages: ["", ""],
      secondaryImageAlts: ["Supporting editorial photograph layered beside the main hero image.", "A second supporting frame from a recent creative production."],
      primaryCta: { label: "Start an inquiry", href: "/contact" },
      secondaryCta: { label: "View the work", href: "/work" },
      marqueeTopItems: ["Portrait", "Editorial", "Campaign", "Place", "Story"],
      marqueeBottomItems: ["Direction", "Light", "Movement", "Detail", "Sequence"],
    }),
    moduleRecord("frame-home-studio", "featureStory", "home.afterHero", 1, {
      eyebrow: "About the studio",
      heading: "An image practice built around attention.",
      body: "Frame & Field develops visual stories through preparation, direction, natural movement, and a final sequence that feels specific to the subject.",
      ...media("Photographer directing an editorial scene in the studio."),
      secondaryImage: "",
      secondaryImageAlt: "Close detail of a camera, set, and working studio notes.",
      primaryCta: { label: "About the studio", href: "/about" },
    }, { presentation: "studio-intro" }),
    moduleRecord("frame-home-selected-frames", "gallery", "home.primaryContent", 2, {
      eyebrow: "Selected frames",
      heading: "Work arranged as an editorial wall.",
      intro: "Six editable frames preserve the source template's staggered image rhythm.",
      items: [
        { id: "frame-work-1", title: "Editorial portrait", category: "Portrait / Direction", caption: "Portrait / Direction", ...media("Editorial portrait shaped with controlled natural light.") },
        { id: "frame-work-2", title: "Campaign still", category: "Campaign / Story", caption: "Campaign / Story", ...media("Campaign image with a cinematic sense of place.") },
        { id: "frame-work-3", title: "Quiet interior", category: "Place / Detail", caption: "Place / Detail", ...media("Architectural interior photographed with quiet editorial detail.") },
        { id: "frame-work-4", title: "Field study", category: "Landscape / Movement", caption: "Landscape / Movement", ...media("Landscape study photographed with movement and atmosphere.") },
        { id: "frame-work-5", title: "Studio character", category: "People / Process", caption: "People / Process", ...media("Studio portrait showing character and working process.") },
        { id: "frame-work-6", title: "Object narrative", category: "Still life / Craft", caption: "Still life / Craft", ...media("Still-life composition focused on material and craft.") },
      ],
    }, { presentation: "selected-frames" }),
    moduleRecord("frame-home-packages", "services", "home.afterServices", 3, {
      eyebrow: "Packages",
      heading: "Ways to work together.",
      intro: "Service names, descriptions, pricing, and availability remain managed in the Services workspace.",
      source: "operational",
      items: [],
    }, { dataSource: "operational-services", presentation: "editorial-packages" }),
    moduleRecord("frame-home-reviews", "reviews", "home.afterServices", 4, {
      eyebrow: "Client notes",
      heading: "What the work felt like from the other side of the lens.",
      intro: "Published reviews remain management-owned and flow into this editorial story rail.",
      source: "operational",
      items: [],
    }, { dataSource: "published-reviews", presentation: "client-notes" }),
    moduleRecord("frame-home-assignments", "portfolio", "home.afterServices", 5, {
      eyebrow: "Selected assignments",
      heading: "Stories in motion.",
      intro: "Eight editable assignments move as one continuous visual sequence on desktop.",
      items: [
        { id: "frame-assignment-1", title: "The maker", category: "Portrait / Process", caption: "Portrait / Process", body: "A portrait-led study of hands, tools, and working rhythm.", ...media("Environmental portrait of a maker at work.") },
        { id: "frame-assignment-2", title: "After the rain", category: "Place / Atmosphere", caption: "Place / Atmosphere", body: "A location story built from weather, reflection, and quiet scale.", ...media("Atmospheric location photograph just after rainfall.") },
        { id: "frame-assignment-3", title: "New collection", category: "Campaign / Direction", caption: "Campaign / Direction", body: "A concise campaign sequence with a clear visual point of view.", ...media("Fashion campaign image from a new collection.") },
        { id: "frame-assignment-4", title: "Open studio", category: "Editorial / Culture", caption: "Editorial / Culture", body: "A studio story balancing people, objects, and the room between them.", ...media("Editorial photograph inside an active creative studio.") },
        { id: "frame-assignment-5", title: "Daylight study", category: "Portrait / Light", caption: "Portrait / Light", body: "A portrait sequence guided by available light and small gestures.", ...media("Daylight portrait with a quiet editorial mood.") },
        { id: "frame-assignment-6", title: "Table for twelve", category: "Hospitality / Story", caption: "Hospitality / Story", body: "A gathering photographed through preparation, detail, and connection.", ...media("Editorial hospitality scene arranged for a long table gathering.") },
        { id: "frame-assignment-7", title: "North road", category: "Travel / Place", caption: "Travel / Place", body: "A road story where landscape and movement carry the sequence.", ...media("Cinematic travel photograph along a northern road.") },
        { id: "frame-assignment-8", title: "Form and material", category: "Still life / Craft", caption: "Still life / Craft", body: "A close study of shape, surface, and carefully made objects.", ...media("Still-life photograph studying form, material, and craft.") },
      ],
    }, { presentation: "selected-assignments", loopDurationSeconds: 34 }),
    moduleRecord("frame-home-studio-notes", "richText", "home.afterServices", 6, {
      eyebrow: "Studio notes",
      heading: "Small observations from the working practice.",
      intro: "Editable studio guidance only; this does not create another blog system.",
      items: [
        { id: "frame-note-1", title: "Prepare the frame", category: "Direction", caption: "Direction", body: "A useful session begins with intention, references, and enough room for the unexpected.", ...media("Printed references and camera notes prepared before a shoot.") },
        { id: "frame-note-2", title: "Follow the light", category: "Process", caption: "Process", body: "Light can set the pace, simplify the set, and give the final sequence its continuity.", ...media("Natural light moving across an editorial studio set.") },
        { id: "frame-note-3", title: "Edit for rhythm", category: "Sequence", caption: "Sequence", body: "The final story lives in the relationship between wide frames, details, and pauses.", ...media("Photograph edit arranged as a considered visual sequence.") },
      ],
    }, { presentation: "studio-notes" }),
    moduleRecord("frame-home-contact-intro", "contactIntro", "home.beforeContact", 7, {
      eyebrow: "Visit the studio",
      heading: "Find the studio, then start with the story.",
      body: "Use the map and studio details for visits; use the inquiry form to share the project, timing, and intended use.",
      ...media("Dark editorial studio exterior at the end of the day."),
    }),
    moduleRecord("frame-home-contact-details", "contactDetails", "home.beforeContact", 8, {
      heading: "Studio details",
      items: [
        { id: "frame-detail-studio", title: "Studio", body: "Add the studio address" },
        { id: "frame-detail-phone", title: "Phone", body: "Add the studio phone" },
        { id: "frame-detail-email", title: "Email", body: "Add the inquiry email" },
      ],
    }),
    moduleRecord("frame-home-hours", "hoursLocation", "home.beforeContact", 9, {
      eyebrow: "Studio rhythm",
      heading: "Visits and production hours.",
      items: [
        { id: "frame-hours-weekday", title: "Studio visits", body: "Add actual appointment hours" },
        { id: "frame-hours-production", title: "Production", body: "Add actual production availability" },
        { id: "frame-hours-location", title: "Location work", body: "Add actual travel or location context" },
      ],
    }),
    moduleRecord("frame-home-map", "map", "home.beforeContact", 10, {
      eyebrow: "Location",
      heading: "Visit by appointment.",
      intro: "Add the studio address or a supported map embed.",
      query: "Add the studio address",
      address: "Add the studio address",
      embedUrl: "",
    }),
    moduleRecord("frame-home-faq", "faq", "home.afterServices", 11, {
      eyebrow: "Before the shoot",
      heading: "A few useful details before we begin.",
      items: [
        { id: "frame-faq-1", title: "What should an inquiry include?", body: "Share the intended use, timing, location, people involved, and any existing creative direction." },
        { id: "frame-faq-2", title: "Can the studio help shape creative direction?", body: "Use this answer to describe the studio's actual planning, art direction, and production support." },
        { id: "frame-faq-3", title: "Do you work on location?", body: "Use this answer to state the studio's actual travel area and location-production approach." },
      ],
    }),
    moduleRecord("frame-home-contact-form", "contactForm", "home.beforeContact", 12, {
      heading: "Tell us what you want to make.",
      intro: "The existing Website Form handles this inquiry without creating another form model.",
      formKey: "contact",
      submitLabel: "Send inquiry",
    }),
    moduleRecord("frame-home-cta", "bookingCta", "home.finalCta", 13, {
      eyebrow: "Begin the project",
      heading: "Bring the story into focus.",
      body: "Share the brief, intended audience, timing, and the feeling the work should carry.",
      ...media("Cinematic production still from a collaborative creative shoot."),
      primaryCta: { label: "Start an inquiry", href: "/contact" },
    }),
  ];
}
