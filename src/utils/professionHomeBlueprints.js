import { createBlackLetterOriginalHomeModules } from "./blackLetterHomeBlueprint";
import { createCircuitNorthOriginalHomeModules } from "./circuitNorthHomeBlueprint";
import { createFrameAndFieldOriginalHomeModules } from "./frameAndFieldHomeBlueprint";
import { createSolaraStayOriginalHomeModules } from "./solaraStayHomeBlueprint";
import { createPawAndPineOriginalHomeModules } from "./pawAndPineHomeBlueprint";
import { createQuietHarborOriginalHomeModules } from "./quietHarborHomeBlueprint";
import { createFieldcraftOriginalHomeModules } from "./fieldcraftHomeBlueprint";
import { createMotionEditorialOriginalHomeModules } from "./motionEditorialHomeBlueprint";
import { createEldoraDarkOriginalHomeModules } from "./eldoraDarkHomeBlueprint";
import { createAeroGridHvacHomeModules } from "./aeroGridHvacHomeBlueprint";
import { createModernGradientOriginalHomeModules } from "./modernGradientHomeBlueprint";
import { createFinwiseOriginalHomeModules } from "./finwiseHomeBlueprint";
import { createClearClinicOriginalHomeModules } from "./clearClinicHomeBlueprint";
import { createHarborLineOriginalHomeModules } from "./harborLineHomeBlueprint";
import { createIronEmberOriginalHomeModules } from "./ironEmberHomeBlueprint";
import { createStillBloomOriginalHomeModules } from "./stillBloomHomeBlueprint";
import { createLumeaClinicOriginalHomeModules } from "./lumeaClinicHomeBlueprint";
import { createNorthstarHealthOriginalHomeModules } from "./northstarHealthHomeBlueprint";
import { createAxisAndCoOriginalHomeModules } from "./axisAndCoHomeBlueprint";
import { createTorqueHouseOriginalHomeModules } from "./torqueHouseHomeBlueprint";
import { createVeloraHouseOriginalHomeModules } from "./veloraHouseHomeBlueprint";
import { createForgeMotionOriginalHomeModules } from "./forgeMotionHomeBlueprint";
import { createTouchlineClubOriginalHomeModules } from "./touchlineClubHomeBlueprint";

const BLUEPRINTS = {
  "forge-motion": {
    label: "Forge Motion",
    description: "its original full-bleed fitness hero, coaching story, team, operational program selector, displayed weekly schedule, honest proof, training journal, client rail, and inquiry ending",
    pageTitle: "Build strength that holds up in real life.",
    createModules: createForgeMotionOriginalHomeModules,
  },
  "velora-house": {
    label: "Velora House",
    description: "its original layered beauty hero, image-led studio story, honest proof principles, service directory, nine-item masonry portfolio, and premium inquiry ending",
    pageTitle: "Elevated beauty rituals, shaped around you.",
    createModules: createVeloraHouseOriginalHomeModules,
  },
  "torque-house": {
    label: "Torque House",
    description: "its industrial workshop hero, service selector, before-and-after proof, projects, service process, and grouped shop ending",
    pageTitle: "Vehicle service with a sharper workshop rhythm.",
    createModules: createTorqueHouseOriginalHomeModules,
  },
  "axis-and-co": {
    label: "Axis & Co.",
    description: "its original executive hero, expertise selector, client tensions, case stories, strategic framework, guidance, and consultation ending",
    pageTitle: "Sharper operating strategy.",
    createModules: createAxisAndCoOriginalHomeModules,
  },
  "northstar-health": {
    label: "Northstar Health",
    description: "its original layered healthcare hero, patient proof, care selector, provider story, visit journey, guidance, and grouped clinic ending",
    pageTitle: "Modern healthcare with human clarity.",
    createModules: createNorthstarHealthOriginalHomeModules,
  },
  "lumea-clinic": {
    label: "Lumea Clinic",
    description: "its original layered clinical-luxury hero, treatment selector, comparison, care journey, facility story, and grouped consultation ending",
    pageTitle: "Luxury care with softer clinical precision.",
    createModules: createLumeaClinicOriginalHomeModules,
  },
  "black-letter": {
    label: "Black Letter Counsel",
    description: "its original authority-led legal hero, practice directory, counsel story, legal process, and formal consultation ending",
    pageTitle: "Counsel with clarity.",
    createModules: createBlackLetterOriginalHomeModules,
  },
  "circuit-north": {
    label: "Circuit North",
    description: "its original system hero, technical architecture, proof rail, delivery process, technology briefs, and operations ending",
    pageTitle: "Systems that stay understandable.",
    createModules: createCircuitNorthOriginalHomeModules,
  },
  "frame-and-field": {
    label: "Frame & Field",
    description: "its current cinematic hero, editorial work wall, packages, eight-item Selected Assignments rail, Studio Notes, and studio inquiry ending",
    pageTitle: "We frame stories.",
    createModules: createFrameAndFieldOriginalHomeModules,
  },
  "solara-stay": {
    label: "Solara Stay",
    description: "its immersive destination hero, stay rail, local guide, guest stories, and grouped hospitality inquiry ending",
    pageTitle: "Stay longer in warmer light.",
    createModules: createSolaraStayOriginalHomeModules,
  },
  "paw-and-pine": {
    label: "Paw & Pine",
    description: "its layered pet hero, grooming selector, studio rail, care notes, team, process, and grouped studio ending",
    pageTitle: "Calmer care for pets and people.",
    createModules: createPawAndPineOriginalHomeModules,
  },
  "quiet-harbor": {
    label: "Quiet Harbor",
    description: "its private editorial hero, specialty paths, therapists, first-session rhythm, guidance, and grouped intake ending",
    pageTitle: "Private support for clearer inner ground.",
    createModules: createQuietHarborOriginalHomeModules,
  },
  fieldcraft: {
    label: "Fieldcraft",
    description: "its original utility hero, practical service selector, before-and-after proof, project rhythm, homeowner guidance, and grouped estimate ending",
    pageTitle: "Built to show up and finish right.",
    createModules: createFieldcraftOriginalHomeModules,
  },
  "motion-editorial": {
    label: "Motion Editorial",
    description: "its original full-screen editorial hero, pinned story, service directory, hours treatment, client stories, and grouped contact ending",
    pageTitle: "Comfort, considered in motion.",
    createModules: createMotionEditorialOriginalHomeModules,
  },
  "eldora-dark": {
    label: "Eldora Dark",
    description: "its v2 thermal-field hero, operational comfort selector, diagnosis sequence, maintenance story, project media, service areas, verified reviews, FAQ, and shared inquiry ending",
    pageTitle: "Clarity for every season at home.",
    createModules: createEldoraDarkOriginalHomeModules,
  },
  "aerogrid-hvac": {
    label: "AeroGrid HVAC",
    description: "its conversion-led video-ready hero, HVAC service paths, customer journey, verified review wall, and combined contact and map ending",
    pageTitle: "Comfort service without the runaround.",
    createModules: createAeroGridHvacHomeModules,
  },
  "modern-gradient": {
    label: "Modern Gradient",
    description: "its approved website design sales homepage with motion hero, service paths, portfolio, six-step process, pricing, articles, and quote ending",
    pageTitle: "Home",
    createModules: createModernGradientOriginalHomeModules,
  },
  finwise: {
    label: "Finwise",
    description: "its original corporate hero, honest trust field, alternating benefit stories, package comparison, client proof, split FAQ, stats, and dark request ending",
    pageTitle: "A better way to plan the work ahead.",
    createModules: createFinwiseOriginalHomeModules,
  },
  "clear-clinic": {
    label: "Clear Clinic",
    description: "its original clinical care journey, treatment selector, care story, patient guidance, and grouped clinic ending",
    pageTitle: "Feel clear about your care.",
    createModules: createClearClinicOriginalHomeModules,
  },
  "iron-ember": {
    label: "Iron Ember",
    description: "its original editorial homepage, including the scroll story and Selected Cuts rail",
    pageTitle: "Cut With Character.",
    createModules: createIronEmberOriginalHomeModules,
  },
  "harbor-line": {
    label: "Harbor Line",
    description: "its original property-led hero, listing rail, market proof, property story, and grouped inquiry ending",
    pageTitle: "Find your next place to belong.",
    createModules: createHarborLineOriginalHomeModules,
  },
  "still-bloom": {
    label: "Still Bloom",
    description: "its original layered studio journey, class rhythm, movement story, memberships, and grouped studio ending",
    pageTitle: "Practice with breath, steadiness, and range.",
    createModules: createStillBloomOriginalHomeModules,
  },
  "touchline-club": {
    label: "Touchline Club",
    description: "its community-sport hero, participation pathways, field journey, community gallery, published feedback, and contact ending",
    pageTitle: "A place to play, learn, and belong.",
    createModules: createTouchlineClubOriginalHomeModules,
  },
};

export function createPublishedFeedbackModule(themeKey = "nextjs", order = null) {
  const normalizedThemeKey = String(themeKey || "nextjs").trim().toLowerCase() || "nextjs";
  return {
    id: `${normalizedThemeKey}-home-published-feedback`,
    type: "reviews",
    slot: "home.afterServices",
    order,
    enabled: true,
    variant: null,
    content: {
      eyebrow: "Published feedback",
      heading: "What customers share.",
      intro: "Only published customer reviews appear here.",
      source: "operational",
      items: [],
    },
    settings: {
      createdInBuilder: true,
      starterBlueprint: `${normalizedThemeKey}-original`,
      source: `${normalizedThemeKey}-original`,
      dataSource: "published-reviews",
    },
  };
}

export function ensurePublishedFeedbackModules(modules = [], themeKey = "nextjs") {
  const prepared = Array.isArray(modules)
    ? modules.map((module) => ({
        ...module,
        content: module?.content ? { ...module.content } : {},
        settings: module?.settings ? { ...module.settings } : {},
      }))
    : [];
  const reviewIndex = prepared.findIndex((module) => module?.type === "reviews");

  if (reviewIndex >= 0) {
    const review = prepared[reviewIndex];
    prepared[reviewIndex] = {
      ...review,
      slot: review.slot || "home.afterServices",
      content: {
        ...review.content,
        eyebrow: "Published feedback",
        heading: review.content?.heading || "What customers share.",
        intro: review.content?.intro || "Only published customer reviews appear here.",
        source: "operational",
        items: [],
      },
      settings: {
        ...review.settings,
        dataSource: "published-reviews",
      },
    };
  } else {
    const contactTypes = new Set(["contactIntro", "contactDetails", "hoursLocation", "locations", "map", "contactForm", "cta", "bookingCta"]);
    const insertAt = prepared.findIndex((module) => contactTypes.has(module?.type));
    prepared.splice(insertAt >= 0 ? insertAt : prepared.length, 0, createPublishedFeedbackModule(themeKey));
  }

  return prepared.map((module, order) => ({ ...module, order }));
}

export function getProfessionHomeBlueprint(themeKey) {
  const normalizedThemeKey = String(themeKey || "").trim().toLowerCase();
  const blueprint = BLUEPRINTS[normalizedThemeKey];
  if (!blueprint) return null;
  return {
    ...blueprint,
    createModules: (...args) => ensurePublishedFeedbackModules(blueprint.createModules(...args), normalizedThemeKey),
  };
}

export function getProfessionHomeBlueprintKeys() {
  return Object.keys(BLUEPRINTS);
}
