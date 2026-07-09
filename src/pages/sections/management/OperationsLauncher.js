import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import DesignServicesOutlinedIcon from "@mui/icons-material/DesignServicesOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import SettingsSuggestOutlinedIcon from "@mui/icons-material/SettingsSuggestOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { useNavigate } from "react-router-dom";

import ProfessionSettings from "../ProfessionSetting";
import { PROFESSION_OPTIONS } from "../../../constants/professions";
import { ensureCompanyId } from "../../../utils/company";
import api, { settingsApi, website } from "../../../utils/api";
import {
  PROFESSION_TEMPLATE_MAP,
  getFriendlyTemplateName,
} from "./operationsLauncherTemplateMap";

const TEAM_SIZE_OPTIONS = [
  { value: "solo", label: "Just me" },
  { value: "2_5", label: "2 to 5" },
  { value: "6_20", label: "6 to 20" },
  { value: "20_plus", label: "20+" },
];

const PRIMARY_GOAL_OPTIONS = [
  { value: "online_bookings", label: "Online bookings" },
  { value: "quotes_invoices", label: "Quotes & invoices" },
  { value: "products", label: "Products" },
  { value: "website", label: "Website" },
  { value: "staff_scheduling", label: "Staff scheduling" },
];

const BOOLEAN_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "Not yet" },
];

const PROFESSION_TEMPLATE_HINTS = {
  salon: ["beauty", "salon", "spa"],
  spa_medspa: ["spa", "medspa", "beauty"],
  barbershop: ["beauty", "salon"],
  wellness: ["wellness", "therapy", "clinic"],
  therapy: ["therapy", "clinic", "wellness"],
  medical_clinic: ["clinic", "medical", "wellness"],
  dental: ["dental", "clinic", "medical"],
  chiropractic: ["clinic", "wellness", "therapy"],
  physiotherapy: ["clinic", "wellness", "therapy"],
  cleaning: ["clean", "service", "home"],
  home_services: ["hvac", "plumbing", "electrical", "trades", "contractor"],
  auto_services: ["auto", "service", "business"],
  pet_care: ["pet", "grooming", "spa"],
  hospitality: ["hospitality", "business"],
  general: ["business", "service"],
};

const HEALTH_LABELS = {
  solo: "Solo-friendly setup",
  "2_5": "Small team setup",
  "6_20": "Growing team setup",
  "20_plus": "Multi-staff setup",
};

const launcherChipSx = {
  color: "#4a2b1a",
  bgcolor: "rgba(255, 255, 255, 0.78)",
  borderColor: "rgba(233, 109, 64, 0.28)",
  fontWeight: 700,
  "& .MuiChip-label": {
    color: "#4a2b1a",
  },
};

const launcherChipSelectedSx = {
  color: "#ffffff",
  bgcolor: "#ef5b2e",
  borderColor: "#ef5b2e",
  fontWeight: 700,
  "& .MuiChip-label": {
    color: "#ffffff",
  },
};

const launcherChipSuccessSx = {
  color: "#155724",
  bgcolor: "rgba(34, 197, 94, 0.18)",
  borderColor: "rgba(34, 197, 94, 0.3)",
  fontWeight: 700,
  "& .MuiChip-label": {
    color: "#155724",
  },
};

const launcherProgressChipSx = {
  minHeight: 32,
  width: "100%",
  justifyContent: "center",
  "& .MuiChip-label": {
    width: "100%",
    textAlign: "center",
    whiteSpace: "normal",
    lineHeight: 1.2,
    paddingInline: 10,
  },
};

const ACTION_CATALOG = {
  add_services: {
    title: "Add services",
    description: "Create the services clients can book or request.",
    icon: <DesignServicesOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "services",
  },
  add_employee: {
    title: "Add employee",
    description: "Create staff profiles before scheduling and assignments.",
    icon: <PeopleOutlineIcon fontSize="small" />,
    kind: "dashboard-view",
    view: "add-member",
  },
  employee_profiles: {
    title: "Employee profiles",
    description: "Manage staff details, permissions, and booking settings.",
    icon: <PeopleOutlineIcon fontSize="small" />,
    kind: "dashboard-view",
    view: "employee-profiles",
  },
  employee_availability: {
    title: "Employee availability",
    description: "Open the existing availability manager directly.",
    icon: <EventAvailableOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "employee-availability",
  },
  service_slot_assignment: {
    title: "Service slot assignment",
    description: "Open the booking setup tab that assigns service slots to employees.",
    icon: <SettingsSuggestOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "employee-availability",
    availabilityTab: "service-slot-assignment",
  },
  assign_services: {
    title: "Assign services to employees",
    description: "Map bookable services to the right staff and time slots.",
    icon: <SettingsSuggestOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "assign-services",
  },
  shift_templates: {
    title: "Shift templates",
    description: "Create reusable availability templates for faster setup.",
    icon: <SettingsSuggestOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "shift-templates",
  },
  booking_link: {
    title: "Public booking page",
    description: "Open the public booking setup flow and shareable booking experience.",
    icon: <OpenInNewOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "client-bookings",
  },
  manager_bookings: {
    title: "Manage bookings",
    description: "Review live bookings, client records, and booking operations.",
    icon: <EventAvailableOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "manager-bookings",
  },
  booking_checkout: {
    title: "Booking checkout",
    description: "Open the booking checkout and payment workflow.",
    icon: <ReceiptLongOutlinedIcon fontSize="small" />,
    kind: "dashboard-view",
    view: "booking-checkout",
  },
  create_estimate: {
    title: "Create estimate",
    description: "Start quotes and estimate approvals for clients.",
    icon: <ReceiptLongOutlinedIcon fontSize="small" />,
    kind: "dashboard-view",
    view: "finance-estimates",
  },
  create_invoice: {
    title: "Create invoice",
    description: "Open the invoice workflow from Business Finance.",
    icon: <ReceiptLongOutlinedIcon fontSize="small" />,
    kind: "dashboard-view",
    view: "finance-invoices",
  },
  payment_link: {
    title: "Payment link / manual invoice",
    description: "Collect deposits or send hosted manual invoice links.",
    icon: <ReceiptLongOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "manual-payments",
  },
  work_orders: {
    title: "Work orders",
    description: "Manage work orders, field execution, and follow-through.",
    icon: <ReceiptLongOutlinedIcon fontSize="small" />,
    kind: "dashboard-view",
    view: "finance-work-orders",
  },
  finance_reports: {
    title: "Finance reports",
    description: "Review business finance reporting and summaries.",
    icon: <ReceiptLongOutlinedIcon fontSize="small" />,
    kind: "dashboard-view",
    view: "finance-reports",
  },
  profitability: {
    title: "Profitability",
    description: "See margin and profitability once jobs are flowing.",
    icon: <ReceiptLongOutlinedIcon fontSize="small" />,
    kind: "dashboard-view",
    view: "finance-profitability",
  },
  add_product: {
    title: "Add product",
    description: "Create products or add-ons to sell with services.",
    icon: <ShoppingBagOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "products",
  },
  manage_orders: {
    title: "Product orders",
    description: "Review product orders tied to the existing product flow.",
    icon: <ShoppingBagOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "product-orders",
  },
  digital_products: {
    title: "Digital products",
    description: "Manage digital products without leaving the launcher.",
    icon: <ShoppingBagOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "digital-products",
  },
  shipping: {
    title: "Shipping settings",
    description: "Open the existing EasyPost shipping setup panel.",
    icon: <ShoppingBagOutlinedIcon fontSize="small" />,
    kind: "advanced-panel",
    panel: "easypost-shipping",
  },
  website_templates: {
    title: "Template gallery",
    description: "Open the existing website template gallery.",
    icon: <PublicOutlinedIcon fontSize="small" />,
    kind: "route",
    path: "/manager/website/templates",
  },
  website_builder: {
    title: "Visual builder",
    description: "Open the visual builder for page-level edits.",
    icon: <PublicOutlinedIcon fontSize="small" />,
    kind: "route",
    path: "/manage/website/builder",
  },
  website_manager: {
    title: "Website manager",
    description: "Open pages, publish status, and website settings.",
    icon: <PublicOutlinedIcon fontSize="small" />,
    kind: "route",
    path: "/manager/website",
  },
  settings_profession: {
    title: "Company industry settings",
    description: "Open the real settings tab that controls the default industry.",
    icon: <SettingsSuggestOutlinedIcon fontSize="small" />,
    kind: "dashboard-view",
    view: "settings",
    tab: "profession",
  },
  company_profile: {
    title: "Company profile",
    description: "Open company profile and public business details.",
    icon: <SettingsSuggestOutlinedIcon fontSize="small" />,
    kind: "dashboard-view",
    view: "CompanyProfile",
  },
  view_public_site: {
    title: "View public website",
    description: "Open the current public website using your existing company slug.",
    icon: <PublicOutlinedIcon fontSize="small" />,
    kind: "external",
  },
};

const DEFAULT_ANSWERS = {
  team_size: "solo",
  primary_goal: "online_bookings",
  booking_now: "yes",
  sells_products: "no",
};

const getProfessionLabel = (value) =>
  PROFESSION_OPTIONS.find((option) => option.value === value)?.label || "General / Other";

const storageKeyForCompany = (companyId) =>
  `operations_launcher_answers_v1:${companyId || "default"}`;

const loadStoredAnswers = (companyId) => {
  if (typeof window === "undefined") return DEFAULT_ANSWERS;
  try {
    const raw = window.localStorage.getItem(storageKeyForCompany(companyId));
    if (!raw) return DEFAULT_ANSWERS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ANSWERS, ...(parsed || {}) };
  } catch {
    return DEFAULT_ANSWERS;
  }
};

const saveStoredAnswers = (companyId, answers) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKeyForCompany(companyId), JSON.stringify(answers));
  } catch {
    // Ignore storage failures and keep launcher usable.
  }
};

const buildRecommendedActions = ({ profession, answers }) => {
  const actions = [];
  const push = (key) => {
    if (!actions.includes(key)) actions.push(key);
  };

  const teamSize = answers.team_size;
  const primaryGoal = answers.primary_goal;
  const bookingNow = answers.booking_now === "yes";
  const sellsProducts = answers.sells_products === "yes";

  const isHomeServices = profession === "home_services";
  const isCleaning = profession === "cleaning";
  const isServiceFieldBusiness = isHomeServices || isCleaning || profession === "auto_services";

  if (teamSize === "solo") {
    push("add_services");
    push("employee_availability");
    if (isServiceFieldBusiness) push("create_estimate");
  } else {
    if (isHomeServices) {
      push("add_employee");
      push("employee_availability");
      push("service_slot_assignment");
    } else if (isCleaning) {
      push("employee_availability");
      push("add_employee");
      push("service_slot_assignment");
    } else {
      push("add_employee");
      push("employee_availability");
      push("assign_services");
    }
  }

  if (primaryGoal === "online_bookings") {
    push("add_services");
    if (isServiceFieldBusiness) {
      push("employee_availability");
      if (teamSize !== "solo") push("service_slot_assignment");
      push("booking_link");
    } else {
      push("booking_link");
      push("manager_bookings");
      if (teamSize !== "solo") push("assign_services");
    }
  }

  if (primaryGoal === "quotes_invoices") {
    push("create_estimate");
    push("create_invoice");
    push("payment_link");
  }

  if (primaryGoal === "products") {
    push("add_product");
    push("manage_orders");
  }

  if (primaryGoal === "website") {
    push("website_templates");
    push("website_builder");
    push("website_manager");
  }

  if (primaryGoal === "staff_scheduling") {
    push("add_employee");
    push("employee_availability");
    push("shift_templates");
  }

  if (bookingNow) {
    push("booking_checkout");
  }

  if (sellsProducts) {
    push("add_product");
  }

  if (isServiceFieldBusiness) {
    push("create_estimate");
    push("payment_link");
    if (teamSize !== "solo") push("service_slot_assignment");
    if (primaryGoal !== "website") push("booking_link");
  }

  if (
    profession === "salon" ||
    profession === "spa_medspa" ||
    profession === "barbershop" ||
    profession === "wellness"
  ) {
    push("booking_link");
    push("website_templates");
  }

  return actions.slice(0, 5);
};

const getIndustryLauncherCopy = (profession, answers) => {
  const solo = answers.team_size === "solo";
  if (profession === "home_services") {
    return {
      summaryLabel: solo ? "Solo trade setup" : "Field team setup",
      recommendedDescription:
        "For trades and home-service teams, start with services, quotes, availability, and service-slot assignment before sharing booking links.",
      bookingsDescription:
        "Home-service bookings work best after staff availability and service-slot assignment are in place for dispatch-ready scheduling.",
      websiteDescription:
        "Keep website setup secondary to job intake. Choose a service-business template, then connect booking and quote actions from the existing builder.",
    };
  }
  if (profession === "cleaning") {
    return {
      summaryLabel: solo ? "Solo cleaning setup" : "Cleaning team setup",
      recommendedDescription:
        "Cleaning teams usually need recurring availability, service-slot assignment, and quick quote/payment actions before publishing client booking links.",
      bookingsDescription:
        "Set recurring staff availability and service-slot assignment first so clients book the right cleaning service window without back-and-forth.",
      websiteDescription:
        "Use a service-focused template, then highlight booking and quote requests without rebuilding your current operating workflow.",
    };
  }
  return {
    summaryLabel: HEALTH_LABELS[answers.team_size] || "Setup in progress",
    recommendedDescription:
      "These actions are reordered from your current company industry and setup answers. You can still use the full operations tabs below at any time.",
    bookingsDescription:
      "Open the existing screens and dialogs directly. Nothing here replaces the working system you already use.",
    websiteDescription:
      "Open the existing website tools directly from one place.",
  };
};

const getSetupShortcutLabels = (answers) => {
  if (answers.team_size === "solo") {
    return {
      profilesLabel: "Your staff profile",
      profilesDescription: "Open your current profile and booking settings.",
      availabilityLabel: "Your availability",
      availabilityDescription: "Set the hours clients can book you.",
      serviceSlotsLabel: "Your service slot setup",
      serviceSlotsDescription: "Map your services to your own booking slots.",
      assignServicesLabel: "Service booking setup",
      assignServicesDescription: "Review how your services connect to booking availability.",
    };
  }
  return {
    profilesLabel: "Employee profiles",
    profilesDescription: "Manage staff details, permissions, and booking settings.",
    availabilityLabel: "Employee availability",
    availabilityDescription: "Open the existing availability manager directly.",
    serviceSlotsLabel: "Service slot assignment",
    serviceSlotsDescription: "Open the booking setup tab that assigns service slots to employees.",
    assignServicesLabel: "Assign services to employees",
    assignServicesDescription: "Map bookable services to the right staff and time slots.",
  };
};

const getTemplateRank = (template, profession) => {
  const explicit = PROFESSION_TEMPLATE_MAP[profession]?.recommended || [];
  const explicitIndex = explicit.indexOf(template?.key);
  if (explicitIndex >= 0) return 1000 - explicitIndex * 20;
  const hintTerms = PROFESSION_TEMPLATE_HINTS[profession] || PROFESSION_TEMPLATE_HINTS.general;
  const haystack = [
    template?.name,
    template?.description,
    ...(template?.tags || []),
    ...(template?.categories || []),
    template?.key,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;
  hintTerms.forEach((term) => {
    if (haystack.includes(term)) score += 5;
  });
  if (haystack.includes("service")) score += 2;
  if (haystack.includes("business")) score += 1;
  return score;
};

const getTemplateDisplayName = (template) =>
  getFriendlyTemplateName(template, template?.name || template?.key || "Template");

const getTemplateRecommendationLabel = (profession) => {
  const mappedLabel = PROFESSION_TEMPLATE_MAP[profession]?.label;
  if (mappedLabel) return `Recommended for ${mappedLabel.toLowerCase()}`;
  switch (profession) {
    case "cleaning":
      return "Recommended for cleaning teams";
    case "home_services":
      return "Recommended for trades and home services";
    case "salon":
    case "spa_medspa":
    case "barbershop":
      return "Recommended for beauty businesses";
    case "wellness":
    case "therapy":
    case "medical_clinic":
    case "dental":
    case "chiropractic":
    case "physiotherapy":
      return "Recommended for clinics and wellness teams";
    default:
      return "Recommended for your current industry";
  }
};

const getBusinessMode = (profession, answers) => {
  const teamLabel =
    answers.team_size === "solo"
      ? "Solo"
      : answers.team_size === "2_5"
        ? "Small team"
        : answers.team_size === "6_20"
          ? "Growing team"
          : "Multi-staff";
  const goalLabel =
    answers.primary_goal === "online_bookings"
      ? "booking-first"
      : answers.primary_goal === "quotes_invoices"
        ? "quote-first"
        : answers.primary_goal === "products"
          ? "products-first"
          : answers.primary_goal === "website"
            ? "website-first"
            : "staff-setup";
  const industryLabel =
    profession === "home_services"
      ? "service business"
      : profession === "cleaning"
        ? "cleaning business"
        : profession === "dental"
          ? "dental practice"
          : profession === "medical_clinic"
            ? "clinic"
            : profession === "coaching"
              ? "coaching business"
              : profession === "hospitality"
                ? "hospitality business"
                : profession === "pet_care"
                  ? "pet care business"
                  : getProfessionLabel(profession).toLowerCase();
  return {
    title: `${teamLabel} ${industryLabel}`,
    subtitle: `Current mode: ${goalLabel.replace("-", " ")}`,
    description:
      answers.primary_goal === "quotes_invoices"
        ? "Prioritize estimates, invoices, and payment flow before polishing the rest."
        : answers.primary_goal === "online_bookings"
          ? "Prioritize services, availability, and booking readiness first."
          : answers.primary_goal === "products"
            ? "Prioritize product setup, checkout, and add-on sales first."
            : answers.primary_goal === "website"
              ? "Prioritize template choice and public website polish first."
              : "Prioritize staff setup and operational readiness first.",
  };
};

const buildProgressChecklist = ({ profession, answers, selectedTemplateKey, companySlug }) => {
  const items = [
    {
      key: "industry",
      label: "Company industry chosen",
      done: profession && profession !== "general",
    },
    {
      key: "team",
      label: "Team mode chosen",
      done: Boolean(answers.team_size),
    },
    {
      key: "goal",
      label: "Main workflow chosen",
      done: Boolean(answers.primary_goal),
    },
    {
      key: "booking",
      label: "Booking plan decided",
      done: answers.booking_now === "yes" || answers.booking_now === "no",
    },
    {
      key: "products",
      label: "Product mode decided",
      done: answers.sells_products === "yes" || answers.sells_products === "no",
    },
    {
      key: "template",
      label: "Website template selected",
      done: Boolean(selectedTemplateKey),
    },
    {
      key: "public_site",
      label: "Public website link available",
      done: Boolean(companySlug),
    },
  ];
  const doneCount = items.filter((item) => item.done).length;
  const score = Math.round((doneCount / items.length) * 100);
  let label = "Getting started";
  if (score >= 85) label = "Launch-ready";
  else if (score >= 60) label = "Strong setup";
  else if (score >= 40) label = "Setup in progress";
  return { items, doneCount, total: items.length, score, label };
};

const getPriorityStrip = ({ recommendedActionKeys, profession }) => {
  const intro =
    profession === "home_services"
      ? "Best next steps for a service team"
      : profession === "cleaning"
        ? "Best next steps for a cleaning business"
        : profession === "dental"
          ? "Best next steps for a clinic team"
          : "Best next steps today";
  return {
    intro,
    items: recommendedActionKeys.slice(0, 3),
  };
};

const getActionPresentation = (actionKey, action, profession, answers) => {
  const base = {
    ...action,
    buttonLabel: "Open",
  };
  if (profession === "dental") {
    if (actionKey === "create_estimate") return { ...base, title: "Create treatment estimate", description: "Start treatment quotes and estimate approvals for clients.", buttonLabel: "Open estimate tools" };
    if (actionKey === "booking_link") return { ...base, title: "Open appointment page", description: "Open the public appointment flow patients can use online.", buttonLabel: "Open booking page" };
    if (actionKey === "add_services") return { ...base, title: "Add care services", description: "Create the visit and care services patients can request or book." };
  }
  if (profession === "cleaning") {
    if (actionKey === "create_estimate") return { ...base, title: "Create cleaning quote", description: "Start residential or commercial cleaning quotes for clients.", buttonLabel: "Open quote tools" };
    if (actionKey === "add_services") return { ...base, title: "Add cleaning services", description: "Create the cleaning services clients can book or request." };
    if (actionKey === "booking_link") return { ...base, title: "Open booking page", description: "Open the public booking page for cleaning requests and repeat clients." };
  }
  if (profession === "home_services") {
    if (actionKey === "create_estimate") return { ...base, title: "Send service estimate", description: "Start field-service estimates and estimate approvals for clients.", buttonLabel: "Open estimate tools" };
    if (actionKey === "payment_link") return { ...base, title: "Send payment link", description: "Collect deposits or send a manual invoice link before or after the job.", buttonLabel: "Open payment tools" };
    if (actionKey === "booking_link") return { ...base, title: "Open service booking page", description: "Open the public booking flow for service calls and appointment requests." };
    if (actionKey === "add_services") return { ...base, title: "Add service types", description: "Create the services clients can book or request from your team." };
  }
  if (profession === "coaching") {
    if (actionKey === "booking_link") return { ...base, title: "Open discovery booking page", description: "Open the public booking flow for discovery calls and sessions." };
    if (actionKey === "create_estimate") return { ...base, title: "Create coaching proposal", description: "Start custom coaching quotes, program proposals, or approval-ready estimates." };
  }
  if (profession === "hospitality") {
    if (actionKey === "booking_link") return { ...base, title: "Open stay booking page", description: "Open the public booking flow for stays, visits, or hospitality requests." };
    if (actionKey === "create_estimate") return { ...base, title: "Create package quote", description: "Start quotes for hospitality packages, retreats, or custom guest requests." };
  }
  if (profession === "pet_care") {
    if (actionKey === "booking_link") return { ...base, title: "Open pet booking page", description: "Open the public booking flow for grooming, daycare, and care visits." };
    if (actionKey === "create_estimate") return { ...base, title: "Create care quote", description: "Start custom pet-care estimates and intake approvals." };
  }
  if (profession === "music_lessons") {
    if (actionKey === "booking_link") return { ...base, title: "Open lesson booking page", description: "Open the public booking flow for classes, lessons, and consultations." };
    if (actionKey === "create_estimate") return { ...base, title: "Create lesson quote", description: "Start private lesson or program estimates for students." };
  }
  if (answers.team_size === "solo" && actionKey === "add_employee") {
    return { ...base, title: "Add staff later", description: "You can skip this for now if you are the only person being booked.", buttonLabel: "Open staff setup" };
  }
  return base;
};

const ActionCard = ({ action, onOpen }) => (
  <Card variant="outlined" sx={{ height: "100%" }}>
    <CardContent>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>{action.icon}</Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {action.title}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {action.description}
        </Typography>
        <Button variant="contained" size="small" onClick={() => onOpen(action)}>
          {action.buttonLabel || "Open"}
        </Button>
      </Stack>
    </CardContent>
  </Card>
);

export default function OperationsLauncher() {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState(null);
  const [settings, setSettings] = useState(null);
  const [companySlug, setCompanySlug] = useState("");
  const [answers, setAnswers] = useState(DEFAULT_ANSWERS);
  const [activeTab, setActiveTab] = useState("setup");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateApplying, setTemplateApplying] = useState(false);
  const [banner, setBanner] = useState({ type: "", message: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [settingsData, resolvedCompanyId, companyProfileResponse] = await Promise.all([
          settingsApi.get(),
          ensureCompanyId(),
          api.get("/admin/company-profile").catch(() => null),
        ]);
        if (!mounted) return;
        setSettings(settingsData || null);
        setCompanyId(resolvedCompanyId || null);
        setCompanySlug(String(companyProfileResponse?.data?.slug || "").trim());
        setAnswers(loadStoredAnswers(resolvedCompanyId || null));
      } catch (error) {
        if (!mounted) return;
        setBanner({
          type: "error",
          message:
            error?.response?.data?.error ||
            error?.displayMessage ||
            "Unable to load Operations Launcher settings.",
        });
      } finally {
        if (mounted) setLoadingSettings(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    saveStoredAnswers(companyId, answers);
  }, [companyId, answers]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingTemplates(true);
      try {
        const data = await website.listTemplates();
        const list = Array.isArray(data) ? data : [];
        if (!mounted) return;
        setTemplates(list);
      } catch (error) {
        if (!mounted) return;
        setBanner({
          type: "error",
          message:
            error?.response?.data?.error ||
            "Unable to load website templates.",
        });
      } finally {
        if (mounted) setLoadingTemplates(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const effectiveProfession = useMemo(
    () => settings?.default_profession || settings?.effective_profession || "general",
    [settings]
  );

  const rankedTemplates = useMemo(() => {
    const list = [...templates];
    list.sort((a, b) => getTemplateRank(b, effectiveProfession) - getTemplateRank(a, effectiveProfession));
    return list;
  }, [templates, effectiveProfession]);

  const topRecommendedTemplates = useMemo(() => rankedTemplates.slice(0, 3), [rankedTemplates]);
  const secondaryTemplates = useMemo(() => rankedTemplates.slice(3, 8), [rankedTemplates]);

  useEffect(() => {
    if (!selectedTemplateKey && rankedTemplates.length) {
      setSelectedTemplateKey(rankedTemplates[0].key);
    }
  }, [rankedTemplates, selectedTemplateKey]);

  const recommendedActionKeys = useMemo(
    () =>
      buildRecommendedActions({
        profession: effectiveProfession,
        answers,
      }).filter((key) => Boolean(ACTION_CATALOG[key])),
    [answers, effectiveProfession]
  );
  const industryCopy = useMemo(
    () => getIndustryLauncherCopy(effectiveProfession, answers),
    [effectiveProfession, answers]
  );
  const setupShortcutLabels = useMemo(
    () => getSetupShortcutLabels(answers),
    [answers]
  );
  const businessMode = useMemo(
    () => getBusinessMode(effectiveProfession, answers),
    [effectiveProfession, answers]
  );
  const setupProgress = useMemo(
    () =>
      buildProgressChecklist({
        profession: effectiveProfession,
        answers,
        selectedTemplateKey,
        companySlug,
      }),
    [effectiveProfession, answers, selectedTemplateKey, companySlug]
  );
  const priorityStrip = useMemo(
    () =>
      getPriorityStrip({
        recommendedActionKeys,
        profession: effectiveProfession,
      }),
    [recommendedActionKeys, effectiveProfession]
  );

  const openAction = (action) => {
    if (!action) return;
    if (action.kind === "external") {
      if (companySlug && typeof window !== "undefined") {
        window.open(`/${companySlug}`, "_blank", "noopener,noreferrer");
      } else {
        setBanner({
          type: "error",
          message: "Set a company slug in Company Profile before opening the public website.",
        });
      }
      return;
    }
    if (action.kind === "advanced-panel") {
      const params = new URLSearchParams({ panel: action.panel });
      if (action.availabilityTab) params.set("availabilityTab", action.availabilityTab);
      navigate(`/manager/advanced-management?${params.toString()}`);
      return;
    }
    if (action.kind === "dashboard-view") {
      const params = new URLSearchParams({ view: action.view });
      if (action.tab) params.set("tab", action.tab);
      navigate(`/manager/dashboard?${params.toString()}`);
      return;
    }
    if (action.kind === "route") {
      navigate(action.path);
    }
  };

  const handleAnswerChange = (field) => (event) => {
    setAnswers((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleResetAnswers = () => {
    setAnswers(DEFAULT_ANSWERS);
    setBanner({ type: "success", message: "Launcher recommendations reset." });
  };

  const handleApplyTemplate = async () => {
    if (!companyId || !selectedTemplateKey) {
      setBanner({
        type: "error",
        message: "Company context or selected template is missing.",
      });
      return;
    }
    setTemplateApplying(true);
    try {
      await website.importTemplate(
        {
          key: selectedTemplateKey,
          template_key: selectedTemplateKey,
          clear_existing: true,
          publish: false,
          set_theme_from_template: true,
        },
        { companyId }
      );
      setBanner({
        type: "success",
        message: "Template applied to your website draft. Review it in the visual builder before publishing.",
      });
      navigate(`/manage/website/builder?company_id=${encodeURIComponent(companyId)}`);
    } catch (error) {
      setBanner({
        type: "error",
        message:
          error?.response?.data?.error ||
          error?.displayMessage ||
          "Unable to apply the selected template.",
      });
    } finally {
      setTemplateApplying(false);
    }
  };

  const renderActionGrid = (actionKeys) => (
    <Grid container spacing={2}>
      {actionKeys.map((actionKey) => {
        const action = getActionPresentation(
          actionKey,
          ACTION_CATALOG[actionKey],
          effectiveProfession,
          answers
        );
        if (!action) return null;
        return (
          <Grid key={actionKey} item xs={12} md={6} xl={4}>
            <ActionCard action={action} onOpen={openAction} />
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Stack spacing={3}>
        <Box>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <RocketLaunchOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="h5" fontWeight={800}>
                  Operations Launcher
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Start with what your business needs first, then jump into the real Schedulaa pages and popups without hunting through multiple sections.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Industry: ${getProfessionLabel(effectiveProfession)}`} color="primary" variant="outlined" />
              <Chip label={industryCopy.summaryLabel} variant="outlined" />
            </Stack>
          </Stack>
        </Box>

        <Alert severity="info">
          This launcher only opens the current source-of-truth tools. It does not replace your existing booking, website, product, or finance workflows.
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Business mode
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {businessMode.title}
                  </Typography>
                  <Typography variant="body2" color="primary.main" fontWeight={700}>
                    {businessMode.subtitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {businessMode.description}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Setup progress
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {setupProgress.doneCount}/{setupProgress.total} ready
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={setupProgress.label}
                      color="primary"
                      variant="outlined"
                      sx={launcherChipSx}
                    />
                    <Chip label={`${setupProgress.score}%`} variant="outlined" sx={launcherChipSx} />
                  </Stack>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                      },
                      gap: 1,
                    }}
                  >
                    {setupProgress.items.map((item) => (
                      <Chip
                        key={item.key}
                        size="small"
                        color={item.done ? "success" : "default"}
                        variant={item.done ? "filled" : "outlined"}
                        label={item.label}
                        sx={{
                          ...launcherProgressChipSx,
                          ...(item.done ? launcherChipSuccessSx : launcherChipSx),
                        }}
                      />
                    ))}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Today&apos;s priorities
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {priorityStrip.intro}
                  </Typography>
                  <Stack spacing={1}>
                    {priorityStrip.items.map((actionKey, index) => {
                      const action = getActionPresentation(
                        actionKey,
                        ACTION_CATALOG[actionKey],
                        effectiveProfession,
                        answers
                      );
                      if (!action) return null;
                      return (
                        <Box
                          key={actionKey}
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.default",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Step {index + 1}
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {action.title}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Quick setup questions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We use your existing company industry plus a few lightweight answers to prioritize the right actions first.
                  </Typography>
                </Box>
                <Button size="small" onClick={handleResetAnswers}>
                  Reset recommendations
                </Button>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6} xl={3}>
                  <FormControl fullWidth>
                    <InputLabel>Team size</InputLabel>
                    <Select
                      label="Team size"
                      value={answers.team_size}
                      onChange={handleAnswerChange("team_size")}
                    >
                      {TEAM_SIZE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <FormControl fullWidth>
                    <InputLabel>Main goal</InputLabel>
                    <Select
                      label="Main goal"
                      value={answers.primary_goal}
                      onChange={handleAnswerChange("primary_goal")}
                    >
                      {PRIMARY_GOAL_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <FormControl fullWidth>
                    <InputLabel>Need online booking now?</InputLabel>
                    <Select
                      label="Need online booking now?"
                      value={answers.booking_now}
                      onChange={handleAnswerChange("booking_now")}
                    >
                      {BOOLEAN_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sell products or add-ons?</InputLabel>
                    <Select
                      label="Sell products or add-ons?"
                      value={answers.sells_products}
                      onChange={handleAnswerChange("sells_products")}
                    >
                      {BOOLEAN_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Recommended next actions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {industryCopy.recommendedDescription}
                </Typography>
              </Box>
              {renderActionGrid(recommendedActionKeys)}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  All operations
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Open the existing screens and dialogs directly. Nothing here replaces the working system you already use.
                </Typography>
              </Box>

              <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab value="setup" label="Setup" />
                <Tab value="bookings" label="Bookings" />
                <Tab value="finance" label="Finance" />
                <Tab value="products" label="Products" />
                <Tab value="website" label="Website" />
              </Tabs>

              <Divider />

              {activeTab === "setup" && (
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} xl={7}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack spacing={2}>
                            <Typography variant="subtitle1" fontWeight={700}>
                              Company industry
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              This is the same Company Default Industry setting you already use in Workspace Settings. The launcher reads from it and recommends the closest website templates and workflows.
                            </Typography>
                            {!loadingSettings && (
                              <ProfessionSettings
                                variant="embedded"
                                onSaved={(nextSettings) => setSettings((current) => ({ ...(current || {}), ...(nextSettings || {}) }))}
                              />
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} xl={5}>
                      <Card variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                          <Stack spacing={2}>
                            <Typography variant="subtitle1" fontWeight={700}>
                              Setup shortcuts
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Open the current staff and service setup tools right away.
                            </Typography>
                            <Stack spacing={1.5}>
                              {answers.team_size === "solo" ? (
                                <Alert severity="info">
                                  Solo setup detected. You can skip staff profiles for now and focus on services, availability, booking, and finance.
                                </Alert>
                              ) : (
                                <Button variant="contained" onClick={() => openAction(ACTION_CATALOG.add_employee)}>
                                  Add employee
                                </Button>
                              )}
                              <Button
                                variant="outlined"
                                onClick={() =>
                                  openAction({
                                    ...ACTION_CATALOG.employee_profiles,
                                    title: setupShortcutLabels.profilesLabel,
                                    description: setupShortcutLabels.profilesDescription,
                                  })
                                }
                              >
                                {setupShortcutLabels.profilesLabel}
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() =>
                                  openAction({
                                    ...ACTION_CATALOG.employee_availability,
                                    title: setupShortcutLabels.availabilityLabel,
                                    description: setupShortcutLabels.availabilityDescription,
                                  })
                                }
                              >
                                {setupShortcutLabels.availabilityLabel}
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() =>
                                  openAction({
                                    ...ACTION_CATALOG.service_slot_assignment,
                                    title: setupShortcutLabels.serviceSlotsLabel,
                                    description: setupShortcutLabels.serviceSlotsDescription,
                                  })
                                }
                              >
                                {setupShortcutLabels.serviceSlotsLabel}
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() =>
                                  openAction({
                                    ...ACTION_CATALOG.assign_services,
                                    title: setupShortcutLabels.assignServicesLabel,
                                    description: setupShortcutLabels.assignServicesDescription,
                                  })
                                }
                              >
                                {setupShortcutLabels.assignServicesLabel}
                              </Button>
                              <Button variant="outlined" onClick={() => openAction(ACTION_CATALOG.company_profile)}>
                                Company profile
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Stack>
              )}

              {activeTab === "bookings" && (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    {industryCopy.bookingsDescription}
                  </Typography>
                  {renderActionGrid([
                "add_services",
                "employee_availability",
                "service_slot_assignment",
                "assign_services",
                "shift_templates",
                "booking_link",
                "manager_bookings",
                "booking_checkout",
                  ])}
                </Stack>
              )}

              {activeTab === "finance" && renderActionGrid([
                "create_estimate",
                "create_invoice",
                "payment_link",
                "work_orders",
                "profitability",
                "finance_reports",
              ])}

              {activeTab === "products" && renderActionGrid([
                "add_product",
                "manage_orders",
                "digital_products",
                "shipping",
              ])}

              {activeTab === "website" && (
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} xl={7}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack spacing={2}>
                            <Typography variant="subtitle1" fontWeight={700}>
                              Template shortcut
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              This uses the existing website template system. We surface the closest template choices here so managers do not need to hunt through separate pages first.
                            </Typography>
                            {topRecommendedTemplates.length ? (
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Chip
                                  color="primary"
                                  variant="outlined"
                                  label={getTemplateRecommendationLabel(effectiveProfession)}
                                  sx={launcherChipSx}
                                />
                                {topRecommendedTemplates.map((template) => (
                                  <Chip
                                    key={template.key}
                                    label={getTemplateDisplayName(template)}
                                    onClick={() => setSelectedTemplateKey(template.key)}
                                    color={selectedTemplateKey === template.key ? "primary" : "default"}
                                    variant={selectedTemplateKey === template.key ? "filled" : "outlined"}
                                    sx={
                                      selectedTemplateKey === template.key
                                        ? launcherChipSelectedSx
                                        : launcherChipSx
                                    }
                                  />
                                ))}
                              </Stack>
                            ) : null}
                            {secondaryTemplates.length ? (
                              <Stack spacing={1}>
                                <Typography variant="caption" color="text.secondary">
                                  Good alternatives for this industry
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  {secondaryTemplates.map((template) => (
                                    <Chip
                                      key={template.key}
                                      label={getTemplateDisplayName(template)}
                                      onClick={() => setSelectedTemplateKey(template.key)}
                                      variant="outlined"
                                      sx={launcherChipSx}
                                    />
                                  ))}
                                </Stack>
                              </Stack>
                            ) : null}
                            <FormControl fullWidth disabled={loadingTemplates || !templates.length}>
                              <InputLabel>Recommended template</InputLabel>
                              <Select
                                label="Recommended template"
                                value={selectedTemplateKey}
                                onChange={(event) => setSelectedTemplateKey(event.target.value)}
                              >
                                {rankedTemplates.map((template) => (
                                  <MenuItem key={template.key} value={template.key}>
                                    {getTemplateDisplayName(template)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {selectedTemplateKey ? (
                              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "background.default", border: "1px solid", borderColor: "divider" }}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                  {getTemplateDisplayName(rankedTemplates.find((template) => template.key === selectedTemplateKey) || { key: selectedTemplateKey })}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {rankedTemplates.find((template) => template.key === selectedTemplateKey)?.description || "This template can be applied to your website draft and then adjusted in the builder."}
                                </Typography>
                              </Box>
                            ) : null}
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                              <Button
                                variant="contained"
                                startIcon={<AutoFixHighOutlinedIcon />}
                                disabled={!selectedTemplateKey || templateApplying}
                                onClick={handleApplyTemplate}
                              >
                                {templateApplying ? "Applying..." : "Apply to website draft"}
                              </Button>
                              <Button variant="outlined" onClick={() => openAction(ACTION_CATALOG.website_templates)}>
                                Open full template gallery
                              </Button>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              Applying here uses the same existing template import flow, but keeps the change in your draft so you can review it before publishing.
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} xl={5}>
                      <Card variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                          <Stack spacing={2}>
                            <Typography variant="subtitle1" fontWeight={700}>
                              Website shortcuts
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {industryCopy.websiteDescription}
                            </Typography>
                            <Stack spacing={1.5}>
                              <Button variant="contained" onClick={() => openAction(ACTION_CATALOG.website_builder)}>
                                Open visual builder
                              </Button>
                              <Button variant="outlined" onClick={() => openAction(ACTION_CATALOG.view_public_site)}>
                                View public website
                              </Button>
                              <Button variant="outlined" onClick={() => openAction(ACTION_CATALOG.website_manager)}>
                                Open website manager
                              </Button>
                              <Button variant="outlined" onClick={() => openAction(ACTION_CATALOG.website_templates)}>
                                Open template gallery
                              </Button>
                              <Button variant="outlined" onClick={() => openAction(ACTION_CATALOG.settings_profession)}>
                                Industry settings
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Snackbar
        open={Boolean(banner.message)}
        autoHideDuration={5000}
        onClose={() => setBanner({ type: "", message: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setBanner({ type: "", message: "" })}
          severity={banner.type === "error" ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {banner.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
