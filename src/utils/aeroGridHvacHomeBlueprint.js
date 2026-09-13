import { createEldoraDarkOriginalHomeModules } from "./eldoraDarkHomeBlueprint";

const servicePaths = [
  { id: "aerogrid-heating", title: "Heating service", body: "A clear starting point for furnace, boiler, and no-heat concerns when comfort changes.", image: "starter-media://eldora-dark/winter-home", imageUrl: "starter-media://eldora-dark/winter-home", imageAlt: "Canadian home during the heating season.", cta: { label: "Ask about heating", href: "#contact" } },
  { id: "aerogrid-cooling", title: "Cooling service", body: "Describe cooling, airflow, or uneven-temperature concerns and find the right next step.", image: "starter-media://eldora-dark/hero", imageUrl: "starter-media://eldora-dark/hero", imageAlt: "Technician inspecting residential comfort equipment.", cta: { label: "Ask about cooling", href: "#contact" } },
  { id: "aerogrid-maintenance", title: "Maintenance planning", body: "Explore a more organized approach to seasonal system care and ongoing comfort planning.", image: "starter-media://eldora-dark/maintenance", imageUrl: "starter-media://eldora-dark/maintenance", imageAlt: "Technician checking gauges during system maintenance.", cta: { label: "Ask about maintenance", href: "#contact" } },
  { id: "aerogrid-heat-pumps", title: "Heat-pump guidance", body: "Start a conversation about heat-pump performance, assessment, or replacement options.", image: "starter-media://eldora-dark/service-area", imageUrl: "starter-media://eldora-dark/service-area", imageAlt: "Residential exterior with comfort equipment.", cta: { label: "Start a conversation", href: "#contact" } },
  { id: "aerogrid-air-quality", title: "Indoor-air questions", body: "Ask about filtration, humidity, ventilation, and the way air moves through your space.", image: "starter-media://eldora-dark/controls", imageUrl: "starter-media://eldora-dark/controls", imageAlt: "Wall-mounted home comfort control.", cta: { label: "Ask the team", href: "#contact" } },
  { id: "aerogrid-diagnostics", title: "System diagnostics", body: "Share what changed and help the team understand the system concern before the next step.", image: "starter-media://eldora-dark/diagnostics", imageUrl: "starter-media://eldora-dark/diagnostics", imageAlt: "Technician using diagnostic equipment.", cta: { label: "Describe the issue", href: "#contact" } },
];

export function createAeroGridHvacHomeModules() {
  const modules = createEldoraDarkOriginalHomeModules().map((source) => {
    const module = JSON.parse(JSON.stringify(source));
    module.id = String(module.id || "").replace(/^eldora-/, "aerogrid-");
    module.settings = {
      ...(module.settings || {}),
      starterBlueprint: "aerogrid-hvac-original",
      source: "aerogrid-hvac-original",
    };
    if (module.type === "hero") {
      module.content = {
        ...module.content,
        eyebrow: "Heating and cooling, clearly coordinated",
        heading: "Comfort service without the runaround.",
        subheading: "Give homeowners one confident place to understand services, request help, and move from the first concern to the right next step.",
        quickPoints: ["Describe the comfort concern", "Confirm the appropriate service path", "Keep the next step visible"],
        primaryCta: { label: "Request service", href: "#contact" },
        secondaryCta: { label: "Explore services", href: "/services" },
      };
    }
    if (module.type === "trustRail") {
      module.content = {
        ...module.content,
        intro: "One connected path from the first question to follow-up.",
        items: ["Clear customer requests", "Service-ready scheduling", "Documented next steps", "Consistent follow-up"].map((title, index) => ({ id: `aerogrid-trust-${index + 1}`, title })),
      };
    }
    if (module.type === "services") {
      module.content = {
        eyebrow: "How we can help",
        heading: "Start with the service you need.",
        intro: "Heating, cooling, airflow, maintenance, and system questions—organized around a clear next step.",
        source: "authored",
        items: servicePaths,
      };
      module.settings = { ...module.settings, dataSource: "authored", presentation: "aerogrid-service-grid" };
    }
    if (module.type === "process") {
      module.content = { ...module.content, eyebrow: "A better service journey", heading: "From first question to a clear plan.", intro: "Show customers what happens next, using the business's real workflow." };
    }
    if (module.type === "featureStory") {
      module.content = { ...module.content, body: "A thoughtful service plan starts with understanding the equipment, the space, and what has changed.", videoUrl: "" };
    }
    if (module.type === "gallery") module.content = { ...module.content, intro: "A closer view of the equipment, controls, and careful work behind home comfort." };
    if (module.type === "serviceAreas") module.content = { ...module.content, intro: "Tell us where the property is located and the team can confirm the appropriate service path.", items: [{ id: "aerogrid-area", title: "Service-area details", body: "Share the property location and the team will confirm current coverage." }] };
    if (module.type === "reviews") module.content = { ...module.content, intro: "Clear feedback from customers who have worked with the team." };
    if (module.type === "faq") module.content = { ...module.content, intro: "Useful answers to common questions before you contact the team." };
    if (module.type === "contactForm") module.content = { ...module.content, intro: "Share the comfort concern, property type, and any equipment details you can safely identify." };
    if (module.type === "cta") module.content = { ...module.content, body: "Choose a service or tell the team what is happening to begin." };
    return module;
  });
  modules.forEach((module, index) => { module.order = index; });
  return modules;
}
