import { createBlackLetterOriginalHomeModules } from "./blackLetterHomeBlueprint";
import { createCircuitNorthOriginalHomeModules } from "./circuitNorthHomeBlueprint";
import { createFrameAndFieldOriginalHomeModules } from "./frameAndFieldHomeBlueprint";
import { createSolaraStayOriginalHomeModules } from "./solaraStayHomeBlueprint";
import { createPawAndPineOriginalHomeModules } from "./pawAndPineHomeBlueprint";
import { createQuietHarborOriginalHomeModules } from "./quietHarborHomeBlueprint";
import { createFieldcraftOriginalHomeModules } from "./fieldcraftHomeBlueprint";
import { createMotionEditorialOriginalHomeModules } from "./motionEditorialHomeBlueprint";
import { createEldoraDarkOriginalHomeModules } from "./eldoraDarkHomeBlueprint";
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

const BLUEPRINTS = {
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
    description: "its original cinematic hero, capability ticker, service bento, planning showcase, animated FAQ, options, and dark lead ending",
    pageTitle: "Comfort systems, made clearer.",
    createModules: createEldoraDarkOriginalHomeModules,
  },
  "modern-gradient": {
    label: "Modern Gradient",
    description: "its original spacious gradient hero, trust field, editorial media wall, masonry reviews, premium packages, clean FAQ, and rounded request ending",
    pageTitle: "Modern service, thoughtfully delivered.",
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
};

export function getProfessionHomeBlueprint(themeKey) {
  return BLUEPRINTS[String(themeKey || "").trim().toLowerCase()] || null;
}

export function getProfessionHomeBlueprintKeys() {
  return Object.keys(BLUEPRINTS);
}
