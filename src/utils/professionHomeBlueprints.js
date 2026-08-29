import { createClearClinicOriginalHomeModules } from "./clearClinicHomeBlueprint";
import { createHarborLineOriginalHomeModules } from "./harborLineHomeBlueprint";
import { createIronEmberOriginalHomeModules } from "./ironEmberHomeBlueprint";
import { createStillBloomOriginalHomeModules } from "./stillBloomHomeBlueprint";

const BLUEPRINTS = {
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
