export const PROFESSION_TEMPLATE_MAP = {
  general: {
    label: "General business",
    recommended: ["minimal-studio", "aurora-atlas-modern", "schedulaa-premium"],
  },
  salon: {
    label: "Salon & beauty",
    recommended: ["modern-salon", "enterprise-beauty-velvetglow", "enterprise-brow-beauty-prime-pro-img"],
  },
  spa_medspa: {
    label: "Spa & medspa",
    recommended: ["enterprise-medspa-elite-pro-with-pro-contact-contact-fix", "enterprise-medspa-ystanbeauty-premium", "enterprise-beauty-velvetglow"],
  },
  barbershop: {
    label: "Barbershop",
    recommended: ["modern-salon", "enterprise-brow-beauty-prime-pro-img", "enterprise-beauty-velvetglow"],
  },
  fitness: {
    label: "Fitness",
    recommended: ["enterprise-fitness-momentum-flow-pro-with-enterprise-contact-contact-fix", "enterprise-gym-coach-pro-minimal"],
  },
  yoga_pilates: {
    label: "Yoga & Pilates",
    recommended: ["enterprise-yoga-pilates-sanctuary-pro", "enterprise-fitness-momentum-flow-pro-with-enterprise-contact-contact-fix", "enterprise-gym-coach-pro-minimal"],
  },
  wellness: {
    label: "Wellness",
    recommended: ["enterprise-therapy-counselor-serene-pro-with-pro-contact-contact-fix", "enterprise-medspa-elite-pro-with-pro-contact-contact-fix", "enterprise-fitness-momentum-flow-pro-with-enterprise-contact-contact-fix"],
  },
  therapy: {
    label: "Therapy & counseling",
    recommended: ["enterprise-therapy-sleek-v2-with-pro-contact-contact-fix", "therapist-calm-strict-v5", "enterprise-therapy-counselor-serene-pro-with-pro-contact-contact-fix"],
  },
  medical_clinic: {
    label: "Medical clinic",
    recommended: ["enterprise-medical-carepoint-pro-with-pro-contact-contact-fix", "enterprise-physio-omnicare"],
  },
  dental: {
    label: "Dental",
    recommended: ["enterprise-dental-smilecraft-pro", "enterprise-medical-carepoint-pro-with-pro-contact-contact-fix", "enterprise-physio-omnicare"],
  },
  chiropractic: {
    label: "Chiropractic",
    recommended: ["enterprise-chiropractic-alignment-pro", "enterprise-physio-omnicare", "enterprise-therapy-sleek-v2-with-pro-contact-contact-fix"],
  },
  physiotherapy: {
    label: "Physiotherapy",
    recommended: ["enterprise-physio-omnicare", "enterprise-medical-carepoint-pro-with-pro-contact-contact-fix"],
  },
  tattoo_piercing: {
    label: "Tattoo & piercing",
    recommended: ["enterprise-inkforge-tattoo", "noir-ink-studio-pro-minimal"],
  },
  photography: {
    label: "Photography & creative",
    recommended: ["photography-lumenstudio-pro-contact-fix", "tenant-photography-gallery-neutral-en-v1", "enterprise-gallery-with-pro-contact-contact-fix"],
  },
  event_planning: {
    label: "Events",
    recommended: ["enterprise-events-aurora-contact-fix", "enterprise-gallery-with-pro-contact-contact-fix"],
  },
  education_tutoring: {
    label: "Education & tutoring",
    recommended: ["enterprise-education-brightpath-contact-fix", "enterprise-tutor-star", "education-bridgeparent-pro-slider-v3"],
  },
  music_lessons: {
    label: "Music & arts lessons",
    recommended: ["enterprise-music-lessons-harmonic-pro", "enterprise-tutor-star", "enterprise-education-brightpath-contact-fix"],
  },
  home_services: {
    label: "Home services & trades",
    recommended: [
      "enterprise-hvac-climateflow-pro",
      "enterprise-plumbing-pipecraft-pro",
      "enterprise-electrical-voltworks-pro",
      "enterprise-trades-forgeworks-contact-fix",
      "enterprise-cabinet-forge-pro",
    ],
  },
  cleaning: {
    label: "Cleaning services",
    recommended: [
      "enterprise-cleaning-purehaven-pro",
      "enterprise-trades-forgeworks-contact-fix",
      "minimal-studio",
    ],
  },
  real_estate: {
    label: "Real estate",
    recommended: ["enterprise-realestate-harborkey-contact-fix"],
  },
  legal: {
    label: "Legal services",
    recommended: ["enterprise-legal-lexon-contact-fix"],
  },
  tax_accounting: {
    label: "Tax & accounting",
    recommended: ["enterprise-tax-ledgerwise-contact-fix", "enterprise-ledger-clarity"],
  },
  finance_advisory: {
    label: "Finance & advisory",
    recommended: ["enterprise-finance-northbridge-contact-fix", "consulting-stratacore-pro-slider-v3"],
  },
  consulting: {
    label: "Consulting",
    recommended: ["consulting-stratacore-pro-slider-v3", "consulting-stratacore-contact-fix"],
  },
  it_services: {
    label: "IT services",
    recommended: ["enterprise-it-services-circuitcore-pro", "consulting-stratacore-pro-slider-v3", "minimal-studio"],
  },
  hr_recruiting: {
    label: "HR & recruiting",
    recommended: ["recruiter-talentforge-pro-contact-fix", "schedulaa-premium-staffing"],
  },
  auto_services: {
    label: "Auto services",
    recommended: ["enterprise-automotive-autocare-nexus-with-enterprise-contact-contact-fix"],
  },
  pet_care: {
    label: "Pet care",
    recommended: ["enterprise-petcare-pawhaven-pro", "enterprise-beauty-velvetglow", "minimal-studio"],
  },
  hospitality: {
    label: "Hospitality",
    recommended: ["enterprise-hospitality-guestflow-pro", "aurora-atlas-modern", "enterprise-gallery"],
  },
  coaching: {
    label: "Coaching",
    recommended: ["enterprise-coaching-elevation-pro", "consulting-stratacore-pro-slider-v3", "enterprise-therapy-counselor-serene-pro-with-pro-contact-contact-fix"],
  },
  notary: {
    label: "Notary & admin",
    recommended: ["enterprise-notary-signature-pro", "enterprise-legal-lexon-contact-fix", "consulting-stratacore-contact-fix"],
  },
};

export const TEMPLATE_DISPLAY_NAME_OVERRIDES = {
  "enterprise-dental-smilecraft-pro": "Dental clinic business",
  "enterprise-chiropractic-alignment-pro": "Chiropractic clinic business",
  "enterprise-yoga-pilates-sanctuary-pro": "Yoga & pilates studio",
  "enterprise-music-lessons-harmonic-pro": "Music lessons studio",
  "enterprise-it-services-circuitcore-pro": "IT services business",
  "enterprise-hospitality-guestflow-pro": "Hospitality business",
  "enterprise-coaching-elevation-pro": "Coaching business",
  "enterprise-notary-signature-pro": "Notary services business",
  "enterprise-hvac-climateflow-pro": "HVAC service business",
  "enterprise-cleaning-purehaven-pro": "Cleaning service business",
  "enterprise-plumbing-pipecraft-pro": "Plumbing service business",
  "enterprise-electrical-voltworks-pro": "Electrical service business",
  "enterprise-petcare-pawhaven-pro": "Pet care business",
  "enterprise-trades-forgeworks": "General trades contractor",
  "enterprise-cabinet-forge-pro": "Cabinetry & interiors",
  "enterprise-automotive-autocare-nexus": "Auto service business",
  "enterprise-beauty-velvetglow": "Beauty business",
  "enterprise-brow-beauty-prime-pro-img": "Brows & beauty studio",
  "enterprise-medspa-elite-pro": "Medspa & aesthetics",
  "enterprise-medspa-ystanbeauty-premium": "Premium medspa",
  "enterprise-therapy-counselor-serene-pro": "Therapy & counseling",
  "enterprise-therapy-sleek-v2": "Therapy practice",
  "therapist-calm-strict-v5": "Therapist multi-page site",
  "enterprise-medical-carepoint-pro": "Clinic / dental / medical",
  "enterprise-physio-omnicare": "Physio clinic",
  "enterprise-photography-lumenstudio-v2": "Photography studio",
  "tenant-photography-gallery-neutral-en-v1": "Photography gallery",
  "enterprise-gallery": "Creative portfolio",
  "enterprise-events-aurora": "Events business",
  "enterprise-education-brightpath": "Tutoring business",
  "enterprise-education-bridgeparent-v2": "Education meetings",
  "enterprise-tutor-star": "Tutoring collective",
  "enterprise-realestate-harborkey": "Real estate business",
  "enterprise-legal-lexon": "Legal services",
  "enterprise-tax-ledgerwise": "Tax services",
  "enterprise-ledger-clarity": "Accounting firm",
  "enterprise-finance-northbridge": "Finance advisory",
  "enterprise-consulting-stratacore": "Consulting business",
  "enterprise-consulting-stratacore-v2": "Consulting business v2",
  "enterprise-recruiter-talentforge-v2": "Recruiting firm",
  "schedulaa-premium-staffing": "Staffing business",
  "modern-salon": "Modern salon",
  "minimal-studio": "Minimal business site",
  "aurora-atlas-modern": "Modern service business",
};

export function getFriendlyTemplateName(templateOrKey, fallbackName = "") {
  const key =
    typeof templateOrKey === "string"
      ? templateOrKey
      : String(templateOrKey?.key || "").trim();
  const explicit = TEMPLATE_DISPLAY_NAME_OVERRIDES[key];
  if (explicit) return explicit;
  const rawName =
    (typeof templateOrKey === "object" && templateOrKey?.name) || fallbackName || key || "";
  const cleaned = String(rawName)
    .replace(/\benterprise\b/gi, "")
    .replace(/\btenant\b/gi, "")
    .replace(/\bpro\b/gi, "")
    .replace(/\bpremium\b/gi, "")
    .replace(/\bwith enterprise contact\b/gi, "")
    .replace(/\bwith pro contact\b/gi, "")
    .replace(/\bcontact fix\b/gi, "")
    .replace(/\bv\d+(\.\d+)?\b/gi, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return key
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}
