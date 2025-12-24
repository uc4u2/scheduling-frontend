// src/candidateForms/defaultFormBlueprints.js
import { PROFESSION_OPTIONS } from "../constants/professions";

const BASE_CONTACT_FIELDS = [
  { key: "full_name", label: "Full Name", type: "text", is_required: true },
  { key: "email", label: "Email Address", type: "email", is_required: true },
  { key: "phone", label: "Phone Number", type: "phone", is_required: false },
];

const BASE_BACKGROUND_FIELDS = [
  { key: "years_experience", label: "Years of Experience", type: "number", is_required: false },
  { key: "experience_summary", label: "Professional Summary", type: "textarea", is_required: false },
  { key: "availability", label: "Availability / Schedule Preferences", type: "textarea", is_required: false },
  { key: "supporting_links", label: "Links to resume, portfolio or profiles", type: "text", is_required: false },
];

const HR_RECRUITING_SECTIONS = [
  {
    key: "contact",
    title: "Contact information",
    description: "Tell us how we can reach you.",
    fields: [
      { key: "full_name", label: "Full Name", type: "text", is_required: true },
      { key: "email", label: "Email Address", type: "email", is_required: true },
      { key: "phone", label: "Phone Number", type: "phone", is_required: false },
      { key: "location", label: "Location", type: "text", is_required: false },
    ],
  },
  {
    key: "eligibility",
    title: "Work authorization",
    description: "Let us know your current work authorization status.",
    fields: [
      {
        key: "work_authorization",
        label: "Work authorization",
        type: "select",
        is_required: true,
        config: {
          options: [
            "Citizen/PR",
            "Open WP",
            "Employer-specific WP",
            "Requires sponsorship",
          ],
        },
      },
    ],
  },
  {
    key: "experience",
    title: "Experience overview",
    description: "Share a quick snapshot of your background.",
    fields: [
      { key: "years_experience", label: "Years of Experience", type: "number", is_required: false },
      { key: "relevant_experience", label: "Relevant experience summary", type: "textarea", is_required: false },
    ],
  },
  {
    key: "skills",
    title: "Skills",
    description: "Highlight your core skills and tools.",
    fields: [
      { key: "primary_skills", label: "Primary skills (comma-separated)", type: "text", is_required: true },
      { key: "tools_technologies", label: "Tools or technologies", type: "text", is_required: false },
    ],
  },
  {
    key: "preferences",
    title: "Preferences",
    description: "Share your availability and work preferences.",
    fields: [
      {
        key: "availability",
        label: "Availability",
        type: "select",
        is_required: true,
        config: {
          options: [
            "Immediately",
            "1-2 weeks",
            "1 month",
            "Flexible",
          ],
        },
      },
      {
        key: "employment_type_preference",
        label: "Employment type preference",
        type: "multi_select",
        is_required: true,
        config: {
          options: [
            "Full-time",
            "Part-time",
            "Contract",
            "Temporary",
            "Casual/On-call",
            "Seasonal",
          ],
        },
      },
      {
        key: "work_arrangement_preference",
        label: "Work arrangement preference",
        type: "select",
        is_required: true,
        config: {
          options: [
            "On-site",
            "Hybrid",
            "Remote",
          ],
        },
      },
    ],
  },
  {
    key: "compensation",
    title: "Compensation",
    description: "Optional compensation expectations.",
    fields: [
      { key: "expected_pay", label: "Expected pay", type: "text", is_required: false },
    ],
  },
  {
    key: "links",
    title: "Links",
    description: "Share a profile or portfolio link.",
    fields: [
      { key: "linkedin_or_portfolio", label: "LinkedIn or portfolio link", type: "text", is_required: false },
    ],
  },
];

const PROFESSION_SPECIFIC_FIELDS = {
  recruiter: [
    { key: "recruiting_focus", label: "Recruiting focus (industries, functions)", type: "textarea" },
    { key: "ats_tools", label: "ATS / HR tools you have used", type: "text" },
  ],
  teacher: [
    { key: "preferred_grade_levels", label: "Preferred grade levels", type: "text" },
    { key: "teaching_certifications", label: "Teaching certifications / licenses", type: "textarea", is_required: true },
    { key: "classroom_experience", label: "Classroom or special education experience", type: "textarea" },
  ],
  fitness_coach: [
    { key: "training_focus", label: "Training focus or modalities", type: "textarea" },
    { key: "fitness_certifications", label: "Fitness certifications", type: "textarea" },
    { key: "session_preferences", label: "In-person / virtual session preferences", type: "text" },
  ],
  therapist: [
    { key: "license_details", label: "License(s) and jurisdiction", type: "textarea", is_required: true },
    { key: "therapy_modalities", label: "Therapy modalities practiced", type: "textarea" },
    { key: "client_focus", label: "Client focus (age groups, specialties)", type: "text" },
  ],
  doctor: [
    { key: "medical_specialty", label: "Medical specialty", type: "text", is_required: true },
    { key: "license_details", label: "Medical license(s) and jurisdiction", type: "textarea", is_required: true },
    { key: "practice_preferences", label: "Practice preferences or patient types", type: "textarea" },
  ],
  photographer: [
    { key: "shoot_styles", label: "Primary shoot styles", type: "text" },
    { key: "equipment_setup", label: "Equipment or studio setup", type: "textarea" },
    { key: "editing_workflow", label: "Editing workflow or turnaround time", type: "textarea" },
  ],
  consultant: [
    { key: "consulting_focus", label: "Consulting focus areas", type: "textarea" },
    { key: "industries_served", label: "Industries served", type: "text" },
    { key: "engagement_preferences", label: "Engagement preferences (onsite, remote, contract length)", type: "textarea" },
  ],
  lawyer: [
    { key: "practice_areas", label: "Practice areas", type: "text", is_required: true },
    { key: "bar_admissions", label: "Bar admissions", type: "textarea", is_required: true },
    { key: "representative_work", label: "Representative matters or case experience", type: "textarea" },
  ],
  real_estate: [
    { key: "license_details", label: "Real estate license(s) and markets", type: "textarea", is_required: true },
    { key: "property_focus", label: "Property focus (residential, commercial, etc.)", type: "text" },
    { key: "volume_summary", label: "Recent sales / leasing volume", type: "textarea" },
  ],
  salon: [
    { key: "service_menu", label: "Service specialties", type: "textarea" },
    { key: "licenses_certifications", label: "Licenses or certifications", type: "textarea", is_required: true },
    { key: "product_preferences", label: "Preferred product lines", type: "text" },
  ],
  tax_advisor: [
    { key: "professional_designation", label: "Professional designation (CPA, EA, etc.)", type: "text", is_required: true },
    { key: "industry_focus", label: "Industry focus", type: "text" },
    { key: "software_experience", label: "Tax software experience", type: "textarea" },
  ],
  financial_advisor: [
    { key: "licenses_certifications", label: "Licenses and certifications", type: "textarea", is_required: true },
    { key: "client_focus", label: "Client focus (individuals, SMB, enterprise)", type: "text" },
    { key: "investment_philosophy", label: "Investment philosophy", type: "textarea" },
  ],
  tutor: [
    { key: "subjects_tutored", label: "Subjects tutored", type: "text" },
    { key: "grade_levels", label: "Grade levels supported", type: "text" },
    { key: "test_prep_experience", label: "Test preparation experience", type: "textarea" },
  ],
  event_planner: [
    { key: "event_types", label: "Event types planned", type: "text" },
    { key: "budget_range", label: "Typical budget range", type: "text" },
    { key: "vendor_network", label: "Vendor relationships or partners", type: "textarea" },
  ],
  contractor: [
    { key: "trade_specialties", label: "Trade specialties", type: "text", is_required: true },
    { key: "licenses_insurance", label: "Licenses and insurance", type: "textarea", is_required: true },
    { key: "service_area", label: "Service area", type: "text" },
  ],
  coach_life: [
    { key: "coaching_focus", label: "Coaching focus areas", type: "textarea" },
    { key: "credentials", label: "Credentials or certifications", type: "textarea" },
    { key: "session_format", label: "Preferred session format", type: "text" },
  ],
  it_support: [
    { key: "technical_skills", label: "Technical skills and platforms", type: "textarea", is_required: true },
    { key: "certifications", label: "Certifications", type: "textarea" },
    { key: "ticketing_tools", label: "Ticketing / support tools used", type: "text" },
  ],
  repair_service: [
    { key: "repair_specialties", label: "Repair specialties", type: "text", is_required: true },
    { key: "certifications", label: "Certifications", type: "textarea" },
    { key: "service_area", label: "Service area", type: "text" },
  ],
  counselor: [
    { key: "license_details", label: "License(s) and jurisdiction", type: "textarea", is_required: true },
    { key: "client_focus", label: "Client focus", type: "text" },
    { key: "modalities", label: "Counseling modalities", type: "textarea" },
  ],
  notary: [
    { key: "commission_details", label: "Commission details", type: "textarea", is_required: true },
    { key: "service_area", label: "Service area", type: "text" },
    { key: "special_services", label: "Special services (loan signings, etc.)", type: "textarea" },
  ],
  custom: [],
};

const DEFAULT_DESCRIPTION_SUFFIX = "Complete this form so our team has the details we need to continue the conversation.";

const buildSections = (label, extras) => {
  const sections = [
    {
      key: "contact",
      title: "Contact information",
      description: "Tell us how we can reach you.",
      fields: BASE_CONTACT_FIELDS,
    },
    {
      key: "experience",
      title: "Experience overview",
      description: "Share a quick snapshot of your background.",
      fields: BASE_BACKGROUND_FIELDS,
    },
  ];

  if (extras && extras.length) {
    sections.push({
      key: "role_specific",
      title: `${label} details`,
      description: "A few specifics so we can match you with the right opportunities.",
      fields: extras,
    });
  }
  return sections;
};

const normaliseFields = (sections) => {
  const flattened = [];
  let order = 0;
  sections.forEach((section) => {
    (section.fields || []).forEach((field) => {
      flattened.push({
        section: section.title,
        key: field.key,
        label: field.label,
        field_type: field.type,
        is_required: Boolean(field.is_required),
        order_index: order++,
        config: field.config || {},
      });
    });
  });
  return flattened;
};

const buildEmailCopy = () => ({
  subject: `You're invited to share your {profession_label} profile`,
  body: "Hello {name},\n\nThank you for your interest in our {profession_label} opportunity. To help us move forward, please take a moment to share a few details.\n\nStart your profile here: {link}\n\nWe appreciate your time!\n",
});

const buildBlueprint = (key, label) => {
  if (key === "hr_recruiting") {
    const sections = HR_RECRUITING_SECTIONS;
    const schema = {
      title: `${label} candidate intake`,
      description: `${label}: ${DEFAULT_DESCRIPTION_SUFFIX}`,
      sections: sections.map((section) => ({
        title: section.title,
        description: section.description,
        fields: section.fields,
      })),
    };
    const email = buildEmailCopy();
    return {
      professionKey: key,
      label,
      name: `${label} candidate intake`,
      description: `${label} questionnaire. ${DEFAULT_DESCRIPTION_SUFFIX}`,
      emailSubject: email.subject,
      emailBody: email.body,
      schema,
      fields: normaliseFields(sections),
    };
  }

  const extras = PROFESSION_SPECIFIC_FIELDS[key] || PROFESSION_SPECIFIC_FIELDS.custom;
  const sections = buildSections(label, extras);
  const schema = {
    title: `${label} candidate intake`,
    description: `${label}: ${DEFAULT_DESCRIPTION_SUFFIX}`,
    sections: sections.map((section) => ({
      title: section.title,
      description: section.description,
      fields: section.fields,
    })),
  };
  const email = buildEmailCopy();
  return {
    professionKey: key,
    label,
    name: `${label} candidate intake`,
    description: `${label} questionnaire. ${DEFAULT_DESCRIPTION_SUFFIX}`,
    emailSubject: email.subject,
    emailBody: email.body,
    schema,
    fields: normaliseFields(sections),
  };
};

const buildBlueprintMap = () => {
  const map = {};
  PROFESSION_OPTIONS.forEach(({ value, label }) => {
    map[value] = buildBlueprint(value, label);
  });
  return map;
};

export const DEFAULT_FORM_BLUEPRINTS = buildBlueprintMap();

export const getDefaultBlueprint = (professionKey) => DEFAULT_FORM_BLUEPRINTS[professionKey] || null;
