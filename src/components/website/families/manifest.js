import {
  WEBSITE_CLASSIC_FAMILY,
  WEBSITE_FAMILY_ALLOWLIST,
} from "../websiteDesign";

const PLACEHOLDER_LOADER = () => import("./nonClassicPlaceholder");
const INDUSTRIAL_BLUEPRINT_LOADER = () => import("./industrial-blueprint");
const HVAC_CINEMATIC_DARK_LOADER = () => import("./hvac-cinematic-dark");
const HVAC_CLEAN_CORPORATE_LOADER = () => import("./hvac-clean-corporate");
const HVAC_BOLD_DISPATCH_LOADER = () => import("./hvac-bold-dispatch");
const HVAC_HOME_COMFORT_MODERN_LOADER = () =>
  import("./hvac-home-comfort-modern");

export const WEBSITE_FAMILY_MANIFEST = Object.freeze({
  classic: {
    family: WEBSITE_CLASSIC_FAMILY,
    version: 1,
    load: null,
  },
  "industrial-blueprint": {
    family: "industrial-blueprint",
    version: WEBSITE_FAMILY_ALLOWLIST["industrial-blueprint"].defaultVersion,
    load: INDUSTRIAL_BLUEPRINT_LOADER,
  },
  "hvac-cinematic-dark": {
    family: "hvac-cinematic-dark",
    version: WEBSITE_FAMILY_ALLOWLIST["hvac-cinematic-dark"].defaultVersion,
    load: HVAC_CINEMATIC_DARK_LOADER,
  },
  "hvac-clean-corporate": {
    family: "hvac-clean-corporate",
    version: WEBSITE_FAMILY_ALLOWLIST["hvac-clean-corporate"].defaultVersion,
    load: HVAC_CLEAN_CORPORATE_LOADER,
  },
  "hvac-bold-dispatch": {
    family: "hvac-bold-dispatch",
    version: WEBSITE_FAMILY_ALLOWLIST["hvac-bold-dispatch"].defaultVersion,
    load: HVAC_BOLD_DISPATCH_LOADER,
  },
  "hvac-home-comfort-modern": {
    family: "hvac-home-comfort-modern",
    version:
      WEBSITE_FAMILY_ALLOWLIST["hvac-home-comfort-modern"].defaultVersion,
    load: HVAC_HOME_COMFORT_MODERN_LOADER,
  },
  "luxury-editorial": {
    family: "luxury-editorial",
    version: WEBSITE_FAMILY_ALLOWLIST["luxury-editorial"].defaultVersion,
    load: PLACEHOLDER_LOADER,
  },
  "glass-technology": {
    family: "glass-technology",
    version: WEBSITE_FAMILY_ALLOWLIST["glass-technology"].defaultVersion,
    load: PLACEHOLDER_LOADER,
  },
  "organic-wellness": {
    family: "organic-wellness",
    version: WEBSITE_FAMILY_ALLOWLIST["organic-wellness"].defaultVersion,
    load: PLACEHOLDER_LOADER,
  },
});

const familyCache = new Map();

export function getWebsiteFamilyManifestEntry(family) {
  return (
    WEBSITE_FAMILY_MANIFEST[family] ||
    WEBSITE_FAMILY_MANIFEST[WEBSITE_CLASSIC_FAMILY]
  );
}

export async function loadWebsiteFamilyModule(family) {
  const entry = getWebsiteFamilyManifestEntry(family);
  if (!entry?.load) {
    return null;
  }
  if (familyCache.has(entry.family)) {
    return familyCache.get(entry.family);
  }
  const mod = await entry.load();
  const resolved = mod?.default || mod || null;
  familyCache.set(entry.family, resolved);
  return resolved;
}
