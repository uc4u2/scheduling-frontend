const media = (imageAlt = "") => ({ image: "", imageUrl: "", imageAlt });
const record = (id, type, slot, order, content, settings = {}) => ({
  id, type, slot, order, enabled: true, content,
  settings: { createdInBuilder: true, starterBlueprint: "torque-house-original", source: "torque-house-original", ...settings },
});

export function createTorqueHouseOriginalHomeModules() {
  return [
    record("torque-home-hero", "hero", "home.hero", 0, {
      eyebrow: "Auto services / workshop care",
      heading: "Vehicle service with a sharper workshop rhythm.",
      subheading: "Bring diagnostics, maintenance, brake, tire, and finish work into a clearer drop-off, approval, and pickup experience.",
      ...media("A vehicle being serviced in a clean, performance-minded automotive workshop."),
      primaryCta: { label: "Book service", href: "/contact" },
      secondaryCta: { label: "Explore services", href: "/services" },
      supportCards: [
        { id: "torque-hero-scope", title: "Workshop scope", body: "Diagnostics, maintenance, brake and tire work, and finish care." },
        { id: "torque-hero-flow", title: "Service flow", body: "Clearer intake, approval context, status updates, and final handoff." },
      ],
    }),
    record("torque-home-proof", "stats", "home.afterHero", 1, {
      eyebrow: "Workshop standard", heading: "Useful proof without unsupported promises.", items: [
        { id: "torque-proof-1", value: "01", title: "Intake", body: "Start with the symptom, maintenance need, or service request." },
        { id: "torque-proof-2", value: "02", title: "Diagnosis", body: "Clarify the service path before work expands." },
        { id: "torque-proof-3", value: "03", title: "Approval", body: "Keep decisions connected to understandable context." },
        { id: "torque-proof-4", value: "04", title: "Handoff", body: "Close with useful notes and the real next step." },
      ],
    }),
    record("torque-home-service-rail", "trustRail", "home.afterHero", 2, {
      eyebrow: "Workshop capabilities", heading: "A performance-minded service vocabulary.", items: [
        { id: "torque-rail-1", title: "Maintenance" }, { id: "torque-rail-2", title: "Diagnostics" },
        { id: "torque-rail-3", title: "Brake service" }, { id: "torque-rail-4", title: "Tire care" },
        { id: "torque-rail-5", title: "Finish detailing" }, { id: "torque-rail-6", title: "Clearer pickup" },
      ],
    }, { presentation: "workshop-marquee" }),
    record("torque-home-services", "services", "home.primaryContent", 3, {
      eyebrow: "Service selector", heading: "Choose the vehicle need, then open the right service path.",
      intro: "Current services and prices remain managed in Services.", source: "operational", items: [],
      primaryCta: { label: "View all services", href: "/services" },
    }, { dataSource: "operational-services", presentation: "automotive-selector" }),
    record("torque-home-before-after", "gallery", "home.afterServices", 4, {
      eyebrow: "Before / After", heading: "Compare the starting condition with the finished handoff.",
      intro: "Use two related, truthful workshop images. Do not imply a result the business cannot substantiate.", items: [
        { id: "torque-before", title: "Before", category: "Starting condition", ...media("Vehicle or component before the documented service work.") },
        { id: "torque-after", title: "After", category: "Finished handoff", ...media("The same vehicle or component after the documented service work.") },
      ],
    }, { presentation: "comparison-slider" }),
    record("torque-home-guidance", "richText", "home.afterServices", 5, {
      eyebrow: "Driver notes", heading: "Guidance that makes the service visit clearer.", intro: "Editable automotive guidance—not a separate blog.", items: [
        { id: "torque-guide-1", title: "Describe the symptom clearly", body: "Note when it appears, what changed, and any warning indicators before the visit." },
        { id: "torque-guide-2", title: "Separate urgent from planned work", body: "Ask the shop to explain what matters now and what can be scheduled later." },
        { id: "torque-guide-3", title: "Keep service history useful", body: "Record completed work and recommended next steps for a steadier maintenance plan." },
      ],
    }),
    record("torque-home-projects", "portfolio", "home.afterServices", 6, {
      eyebrow: "Workshop proof", heading: "Service stories with strong mechanical context.",
      intro: "Use genuine workshop media and concise, accurate service context.", items: [
        { id: "torque-project-1", title: "Seasonal service day", category: "Sample / tires & inspection", body: "An editable example showing service-day sequencing without claiming a customer result.", ...media("A vehicle receiving seasonal tire and inspection service in a workshop.") },
        { id: "torque-project-2", title: "Diagnostic intake", category: "Sample / diagnostics", body: "An editable example focused on a structured diagnosis and clearer repair context.", ...media("A technician using diagnostic equipment beside a vehicle.") },
        { id: "torque-project-3", title: "Finish and pickup", category: "Sample / detailing", body: "An editable example about final presentation and the vehicle handoff.", ...media("A freshly detailed vehicle prepared for pickup.") },
      ],
    }, { presentation: "workshop-proof" }),
    record("torque-home-process", "process", "home.afterServices", 7, {
      eyebrow: "Service flow", heading: "From vehicle concern to finished handoff.", items: [
        { id: "torque-step-1", title: "Describe the need", body: "Start with the symptom, maintenance request, or service goal." },
        { id: "torque-step-2", title: "Inspect and clarify", body: "Review the vehicle and establish the service path." },
        { id: "torque-step-3", title: "Approve the work", body: "Confirm the scope using the shop's real communication process." },
        { id: "torque-step-4", title: "Service and handoff", body: "Complete the work and share practical pickup and next-step notes." },
      ],
    }),
    record("torque-home-team", "team", "home.primaryContent", 8, {
      eyebrow: "Workshop team", heading: "Introduce the people behind the service experience.",
      intro: "Use real names, roles, biographies, and certifications only when supplied.", items: [
        { id: "torque-team-1", title: "Shop lead", role: "Add verified role", body: "Add a real team biography.", ...media("Portrait of the automotive shop lead in the workshop.") },
        { id: "torque-team-2", title: "Service advisor", role: "Add verified role", body: "Add a real service advisor biography.", ...media("Portrait of an automotive service advisor at the shop.") },
        { id: "torque-team-3", title: "Technician", role: "Add verified role", body: "Add a real technician biography.", ...media("Portrait of an automotive technician beside a service bay.") },
      ],
    }),
    record("torque-home-reviews", "reviews", "home.afterServices", 9, {
      eyebrow: "Driver reviews", heading: "Published feedback from real service visits.",
      intro: "Published Reviews remain management-owned.", source: "operational", items: [],
    }, { dataSource: "published-reviews", presentation: "automotive-proof" }),
    record("torque-home-faq", "faq", "home.afterServices", 10, {
      eyebrow: "Questions", heading: "Start with the real vehicle need.", items: [
        { id: "torque-faq-1", question: "Can I request service if I am not sure what is wrong?", answer: "Describe the symptom and edit this answer to match the shop's actual diagnostic intake process." },
        { id: "torque-faq-2", question: "Will I approve work before the scope changes?", answer: "Describe the shop's real estimate and approval policy." },
        { id: "torque-faq-3", question: "Which vehicles and services do you accept?", answer: "List only the current vehicle and service boundaries." },
      ],
    }),
    record("torque-home-contact-details", "contactDetails", "home.beforeContact", 11, {
      eyebrow: "Shop details", heading: "Plan the service visit.", items: [
        { id: "torque-detail-address", title: "Shop", body: "Add the shop address" },
        { id: "torque-detail-phone", title: "Phone", body: "Add the shop phone" },
        { id: "torque-detail-email", title: "Email", body: "Add the shop email" },
      ],
    }),
    record("torque-home-hours", "hoursLocation", "home.beforeContact", 12, {
      eyebrow: "Hours", heading: "Know when the workshop is available.", items: [
        { id: "torque-hours-weekday", title: "Weekdays", body: "Add real weekday hours" },
        { id: "torque-hours-weekend", title: "Weekend", body: "Add real weekend hours" },
        { id: "torque-hours-note", title: "Drop-off guidance", body: "Add the current drop-off policy" },
      ],
    }),
    record("torque-home-map", "map", "home.beforeContact", 13, {
      eyebrow: "Location", heading: "Find the workshop.", intro: "Add the supported shop address or map embed.",
      query: "Add the shop address", address: "Add the shop address", embedUrl: "",
    }),
    record("torque-home-contact-form", "contactForm", "home.beforeContact", 14, {
      eyebrow: "Service request", heading: "Tell the shop what needs attention.",
      intro: "The existing Website Form handles this request; no service-order system is created here.", formKey: "contact", submitLabel: "Send service request",
    }),
    record("torque-home-cta", "bookingCta", "home.finalCta", 15, {
      eyebrow: "A clearer next step", heading: "Bring the vehicle concern into a cleaner service conversation.",
      body: "Choose a service path or contact the shop for guidance.", primaryCta: { label: "Book service", href: "/contact" },
    }),
  ];
}
