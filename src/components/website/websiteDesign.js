export const WEBSITE_CLASSIC_FAMILY = "classic";
export const WEBSITE_DESIGN_SCHEMA_VERSION = 1;
export const WEBSITE_DEFAULT_COMPOSITION = "default";

export const WEBSITE_FAMILY_ALLOWLIST = Object.freeze({
  classic: {
    defaultVersion: 1,
    versions: [1],
    defaultMotionProfile: "legacy",
    motionProfiles: ["legacy", "none"],
    compositions: ["default"],
  },
  "industrial-blueprint": {
    defaultVersion: 1,
    versions: [1],
    defaultMotionProfile: "mechanical",
    motionProfiles: ["none", "mechanical"],
    compositions: ["default", "homepage-a", "homepage-b"],
  },
  "hvac-cinematic-dark": {
    defaultVersion: 1,
    versions: [1],
    defaultMotionProfile: "cinematic",
    motionProfiles: ["none", "cinematic"],
    compositions: ["default"],
  },
  "hvac-clean-corporate": {
    defaultVersion: 1,
    versions: [1],
    defaultMotionProfile: "corporate",
    motionProfiles: ["none", "corporate"],
    compositions: ["default"],
  },
  "luxury-editorial": {
    defaultVersion: 1,
    versions: [1],
    defaultMotionProfile: "editorial",
    motionProfiles: ["none", "editorial"],
    compositions: ["default", "homepage-a", "homepage-b"],
  },
  "glass-technology": {
    defaultVersion: 1,
    versions: [1],
    defaultMotionProfile: "none",
    motionProfiles: ["none"],
    compositions: ["default", "homepage-a", "homepage-b"],
  },
  "organic-wellness": {
    defaultVersion: 1,
    versions: [1],
    defaultMotionProfile: "none",
    motionProfiles: ["none"],
    compositions: ["default", "homepage-a", "homepage-b"],
  },
});

export const CLASSIC_DEFAULT_TOKENS = Object.freeze({
  typography: {},
  colors: {},
  layout: {},
  surfaces: {},
  buttons: {},
  cards: {},
  decorations: {},
  motion: {},
});

const cleanText = (value) => String(value || "").trim().toLowerCase();

const safeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const deepMerge = (...sources) => {
  const out = {};
  sources.filter(Boolean).forEach((source) => {
    Object.entries(source).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        out[key] = value.slice();
        return;
      }
      if (isPlainObject(value) && isPlainObject(out[key])) {
        out[key] = deepMerge(out[key], value);
        return;
      }
      if (isPlainObject(value)) {
        out[key] = deepMerge(value);
        return;
      }
      out[key] = value;
    });
  });
  return out;
};

export function normalizeWebsiteDesignMetadata(source) {
  const raw = source || {};
  const featureEnabled = raw.design_family_feature_enabled !== false;

  const requestedFamily = cleanText(raw.design_family) || WEBSITE_CLASSIC_FAMILY;
  let family = WEBSITE_FAMILY_ALLOWLIST[requestedFamily]
    ? requestedFamily
    : WEBSITE_CLASSIC_FAMILY;
  if (!featureEnabled && family !== WEBSITE_CLASSIC_FAMILY) {
    family = WEBSITE_CLASSIC_FAMILY;
  }

  let schemaVersion = safeInt(
    raw.design_schema_version,
    WEBSITE_DESIGN_SCHEMA_VERSION
  );
  if (schemaVersion !== WEBSITE_DESIGN_SCHEMA_VERSION) {
    schemaVersion = WEBSITE_DESIGN_SCHEMA_VERSION;
  }

  let familyMeta =
    WEBSITE_FAMILY_ALLOWLIST[family] ||
    WEBSITE_FAMILY_ALLOWLIST[WEBSITE_CLASSIC_FAMILY];

  let familyVersion = safeInt(
    raw.design_family_version,
    familyMeta.defaultVersion
  );
  if (!familyMeta.versions.includes(familyVersion)) {
    family = WEBSITE_CLASSIC_FAMILY;
    familyMeta = WEBSITE_FAMILY_ALLOWLIST[WEBSITE_CLASSIC_FAMILY];
    familyVersion = familyMeta.defaultVersion;
  }

  let composition = cleanText(raw.composition) || WEBSITE_DEFAULT_COMPOSITION;
  if (!familyMeta.compositions.includes(composition)) {
    composition = WEBSITE_DEFAULT_COMPOSITION;
  }

  let motionProfile =
    cleanText(raw.motion_profile) || familyMeta.defaultMotionProfile;
  if (!familyMeta.motionProfiles.includes(motionProfile)) {
    motionProfile = familyMeta.defaultMotionProfile;
  }

  if (family === WEBSITE_CLASSIC_FAMILY) {
    composition = WEBSITE_DEFAULT_COMPOSITION;
    if (!["legacy", "none"].includes(motionProfile)) {
      motionProfile = "legacy";
    }
  }

  return {
    design_family: family,
    design_schema_version: schemaVersion,
    design_family_version: familyVersion,
    composition,
    motion_profile: motionProfile,
    design_family_feature_enabled: featureEnabled,
  };
}

export function resolveWebsiteDesignTokens({
  section = {},
  site = {},
  familyTokens = {},
  classicDefaults = CLASSIC_DEFAULT_TOKENS,
} = {}) {
  const sectionOverrides = section.design || section.design_overrides || {};
  const siteOverrides =
    site.pageStyle ||
    site.page_style ||
    site.theme_overrides ||
    site.brand ||
    {};

  return deepMerge(
    classicDefaults,
    familyTokens,
    siteOverrides,
    sectionOverrides
  );
}
