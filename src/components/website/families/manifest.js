import {
  WEBSITE_CLASSIC_FAMILY,
  WEBSITE_FAMILY_ALLOWLIST,
} from "../websiteDesign";

const PLACEHOLDER_LOADER = () => import("./nonClassicPlaceholder");
const INDUSTRIAL_BLUEPRINT_LOADER = () => import("./industrial-blueprint");

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
