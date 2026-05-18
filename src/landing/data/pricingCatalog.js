export const SUBSCRIPTION_PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "$19.99/mo",
    priceCents: 1999,
    positioning: "Launch your website and booking flow quickly.",
    description:
      "For solo providers and simple service businesses that need website, booking, contact capture, and payments.",
    trialNote: "14-day free trial • Cancel anytime",
    features: [
      { type: "heading", text: "Core platform" },
      "Unified website, booking, and payments.",
      "Secure client and staff portals.",
      "Website builder with branded pages and templates.",
      "Online booking, confirmations, and client portal.",
      "Public “Book with me” link.",
      "Stripe Checkout with automatic tax calculation support.",
      { type: "heading", text: "Operational basics" },
      "Booking notifications and reminders.",
      "Embeddable booking widgets.",
      "Stripe refunds and payment history.",
      "Basic role-based access.",
      { type: "heading", text: "Time & reporting" },
      "Basic time tracking tied to bookings and shifts.",
      "CSV/PDF exports for worked hours and revenue.",
      { type: "heading", text: "Capacity" },
      "1 staff seat and 1 location (department) included.",
      "Custom domain + automatic SSL included.",
      "Upgrade when you need team scheduling or finance workflows.",
    ],
    ctaLabel: "Start 14-day free trial",
    ctaTo: "/register",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$49.99/mo",
    priceCents: 4999,
    positioning: "Run team scheduling and daily operations from one system.",
    description:
      "For small teams that need booking, services/products, staff scheduling, employee visibility, and richer operational control.",
    trialNote: "14-day free trial • Cancel anytime",
    features: [
      "Everything in Starter.",
      { type: "heading", text: "Time & Labor" },
      "Shift-based clock-in and clock-out.",
      "Break enforcement and auto-deductions.",
      "Overtime and anomaly flags.",
      { type: "heading", text: "Payroll workflows" },
      "Payroll-ready approvals and audit trails.",
      "Payroll exports to QuickBooks & Xero.",
      "Employee Payslip Portal (self-serve PDFs).",
      "Payroll preparation workflows for accountant handoff.",
      { type: "heading", text: "Access & control" },
      "Role-based access for managers and staff.",
      "Staff permissions and visibility controls.",
      "Department scheduling and shared calendars.",
      "Shift swaps, approvals, and live rosters.",
      { type: "heading", text: "Analytics & marketing" },
      "Email campaigns: Broadcast, Win-Back, VIP, No-Show, Anniversary.",
      "Advanced analytics for bookings, revenue, and client segments.",
      { type: "heading", text: "Capacity" },
      "Up to 5 staff seats and 1 location (department) included.",
      "Automated Canadian stat holiday pay and accrual logic.",
      "Priority support (business hours).",
    ],
    ctaLabel: "Start 14-day free trial",
    ctaTo: "/register",
    highlight: true,
    badge: "Most popular",
  },
  {
    key: "business",
    name: "Business",
    price: "$119.99/mo",
    priceCents: 11999,
    positioning: "Built for quote-to-invoice operations and finance-ready workflows.",
    description:
      "For service businesses that manage quotes, work orders, invoices, expenses, inventory, and reporting.",
    trialNote: "14-day free trial • Cancel anytime",
    features: [
      "Everything in Pro.",
      { type: "heading", text: "Business Finance" },
      "Quote requests and custom-price intake.",
      "Estimates and client approval workflow.",
      "Work orders and job assignments.",
      "Field reports with manager review.",
      "Invoices, expenses, and purchases.",
      "Materials, inventory, and vendor tracking.",
      "Profitability, tax summary, and month-end review.",
      { type: "heading", text: "Payroll & governance" },
      "Payroll-ready records and accountant-ready handoff.",
      "Compliance-ready documentation and audit trails.",
      "Multi-location (department) reporting and controls.",
      { type: "heading", text: "Advanced control" },
      "Branch-level permissions.",
      "Bulk scheduling controls (close / keep windows).",
      "Operational review flows with reduced reconciliation gaps.",
      { type: "heading", text: "Capacity" },
      "10 staff seats and up to 5 locations (departments) included.",
      "Add seats for $9/mo each.",
      "Free branded website included when using Payroll + Scheduling.",
    ],
    ctaLabel: "Start 14-day free trial",
    ctaTo: "/register",
  },
];

export const WEBSITE_SETUP_SERVICES = {
  title: "Optional Website Setup Services",
  subtitle:
    "Every Schedulaa plan includes the website builder. Build it yourself, or let our team set up your site for you.",
  note:
    "Requires an active Schedulaa subscription. Domain purchase is not included. We can help connect your domain.",
  items: [
    {
      key: "basic",
      name: "Basic Website Setup",
      price: "$500 USD",
      priceNote: "One-time",
      bestFor: "Best for simple websites up to 5 pages.",
      description:
        "A fast branded setup for businesses that want our team to prepare the site instead of building it themselves.",
      includes: [
        "Template setup",
        "Logo, colors, and branding applied",
        "Up to 5 pages",
        "Booking, contact, or quote form setup",
        "Publish support",
        "1 revision round",
      ],
      ctaLabel: "Buy Basic Setup",
      ctaMode: "checkout",
    },
    {
      key: "growth",
      name: "Growth Website Setup",
      price: "$1,500 USD",
      priceNote: "One-time",
      bestFor:
        "Best for service businesses that need services, products, galleries, reviews, and quote request pages.",
      description:
        "Our recommended setup for businesses that want a stronger sales website, richer content, and better lead capture.",
      includes: [
        "Branded website setup",
        "Up to 10 pages",
        "Services and products setup",
        "Gallery, projects, reviews, and contact pages",
        "Quote request or lead capture flow",
        "Basic SEO and social sharing setup",
        "Domain connection support",
        "2 revision rounds",
      ],
      ctaLabel: "Talk to Sales",
      ctaMode: "contact",
    },
    {
      key: "premium",
      name: "Premium Website Setup",
      price: "From $2,500 USD",
      priceNote: "Scoped",
      bestFor:
        "Best for larger websites, content migration, custom layouts, and heavier portfolio or gallery setups.",
      description:
        "For businesses with larger content libraries, more pages, and more hands-on setup needs.",
      includes: [
        "Everything in Growth",
        "Larger content migration",
        "Additional landing pages",
        "More layout customization",
        "Copy refinement support",
        "3 revision rounds",
      ],
      ctaLabel: "Talk to Sales",
      ctaMode: "contact",
    },
  ],
};

export const PLAN_FINDER_CONFIG = {
  title: "Find the Right Plan",
  subtitle:
    "Not sure which plan fits? Choose based on how your business runs, not just your industry.",
  intro:
    "Answer a few quick questions and we’ll recommend the right Schedulaa plan and optional website setup.",
  questions: {
    businessType: {
      label: "What type of business do you run?",
      options: [
        "Appointment-based service business",
        "Project-based service business",
        "Field service business",
        "Home service business",
        "Installation / repair business",
        "Professional services",
        "Health / wellness business",
        "Education / training business",
        "Events / staffing business",
        "Cabinet / Millwork",
        "Renovation",
        "Medspa",
        "Tattoo / PMU Studio",
        "Cleaning Company",
        "HVAC / Plumbing / Electrical",
        "Training Center",
        "Tutoring Center",
        "Staffing Agency",
        "Wellness Clinic",
        "Consultant",
        "Other service business",
      ],
    },
    teamSize: {
      label: "How many people are on your team?",
      options: [
        { key: "just_me", label: "Just me" },
        { key: "2_5", label: "2-5 people" },
        { key: "6_15", label: "6-15 people" },
        { key: "16_40", label: "16-40 people" },
        { key: "40_plus", label: "40+ people" },
      ],
    },
    needs: {
      label: "What do you need to manage?",
      sections: [
        {
          title: "Website & Leads",
          options: [
            "Website only",
            "Online booking",
            "Contact / lead forms",
            "Services",
            "Products",
          ],
        },
        {
          title: "Team Operations",
          options: ["Staff scheduling", "Employee portal"],
        },
        {
          title: "Quote-to-Invoice Operations",
          options: [
            "Quote requests",
            "Estimates",
            "Work orders",
            "Field reports",
            "Invoices",
          ],
        },
        {
          title: "Finance & Reporting",
          options: [
            "Expenses / purchases",
            "Inventory / materials",
            "Vendors",
            "Profitability",
            "Tax summary",
            "Month-end review",
            "Payroll-ready reports",
          ],
        },
      ],
    },
    websiteNeed: {
      label: "Do you need a website?",
      options: [
        {
          key: "new",
          label: "Yes, I need a new website",
        },
        {
          key: "improve",
          label: "Yes, I already have a website but want to improve or move it",
        },
        {
          key: "internal_only",
          label: "No, I only need internal operations",
        },
        {
          key: "not_sure",
          label: "Not sure",
        },
      ],
    },
    setupPreference: {
      label: "Do you want to build the website yourself or have Schedulaa set it up?",
      options: [
        { key: "diy", label: "I will build it myself" },
        { key: "done_for_you", label: "I want Schedulaa to set it up for me" },
        { key: "not_sure", label: "Not sure yet" },
      ],
    },
    pageCount: {
      label: "How many website pages do you need?",
      options: [
        {
          key: "1_5",
          label: "1-5 pages",
          description:
            "Simple website: Home, Services, Contact, Booking/Quote, About or Gallery.",
        },
        {
          key: "6_10",
          label: "6-10 pages",
          description:
            "Fuller sales site: services, products, gallery, reviews, quote/contact pages.",
        },
        {
          key: "11_15",
          label: "11-15 pages",
          description:
            "Larger site: multiple service pages, project pages, location pages, or richer content.",
        },
        {
          key: "15_plus",
          label: "15+ pages",
          description:
            "Usually custom scope. Best handled through Premium or sales review.",
        },
        {
          key: "unknown",
          label: "I don’t know",
          description:
            "We’ll usually recommend Growth, then confirm the scope before setup starts.",
        },
      ],
    },
    contentComplexity: {
      label: "Do you need content migration or lots of galleries/projects/products?",
      options: [
        {
          key: "simple",
          label: "No, simple content",
          description:
            "Logo, contact info, basic text, a few images, and normal service/product entries.",
        },
        {
          key: "many_assets",
          label: "Yes, I have many images/projects/products",
          description:
            "Large gallery, many portfolio items, many services/products, or heavy manual uploads. Usually Premium.",
        },
        {
          key: "migration",
          label: "Yes, I need content moved from my old website",
          description:
            "Migration from an existing website. Scope depends on how much content must be moved. Usually Premium.",
        },
        {
          key: "not_sure",
          label: "Not sure",
          description:
            "We’ll recommend based on page count and confirm the setup scope before work begins.",
        },
      ],
    },
  },
};

export const STARTER_COMPATIBLE_NEEDS = new Set([
  "Website only",
  "Online booking",
  "Contact / lead forms",
  "Services",
  "Products",
]);

export const TEAM_WORKFLOW_NEEDS = new Set([
  "Staff scheduling",
  "Employee portal",
]);

export const BUSINESS_FINANCE_NEEDS = new Set([
  "Quote requests",
  "Estimates",
  "Work orders",
  "Field reports",
  "Invoices",
  "Expenses / purchases",
  "Inventory / materials",
  "Vendors",
  "Profitability",
  "Tax summary",
  "Month-end review",
  "Payroll-ready reports",
]);

const TEAM_SERVICE_BUSINESS_NEEDS = new Set([
  "Online booking",
  "Contact / lead forms",
  "Services",
  "Products",
]);

export const QUOTE_TO_INVOICE_SECTION = {
  title: "Built for Quote-to-Invoice Operations",
  subtitle:
    "Schedulaa Business helps service businesses manage custom-price work from first request to estimate, work order, field report, invoice, and month-end reporting.",
  bullets: [
    "Capture quote requests for custom-price jobs",
    "Turn requests into estimates and invoices",
    "Create work orders and assign jobs",
    "Review field reports before materials or billing become final",
    "Track expenses, purchases, inventory, and vendors",
    "Prepare profitability, tax summary, and month-end reports",
  ],
};

export const BUSINESS_FINANCE_COMPARISON = {
  section: "Business Finance",
  rows: [
    { key: "quoteRequests", label: "Quote requests" },
    { key: "estimates", label: "Estimates" },
    { key: "workOrders", label: "Work orders" },
    { key: "fieldReports", label: "Field reports" },
    { key: "managerReviewApprovals", label: "Manager review approvals" },
    { key: "expensesPurchases", label: "Expenses & purchases" },
    { key: "inventoryMaterials", label: "Inventory / materials" },
    { key: "vendors", label: "Vendors" },
    { key: "profitabilityReports", label: "Profitability reports" },
    { key: "taxSummary", label: "Tax summary" },
    { key: "monthEndReview", label: "Month-end review" },
  ],
};

export const PRICING_FAQS = [
  {
    question: "Is Business Finance a replacement for accounting software?",
    answer:
      "No. Schedulaa Business Finance helps manage operational workflow such as quote requests, estimates, work orders, field reports, expenses, inventory, and finance-ready reporting. It supports accountant-ready handoff, but it does not replace formal accounting or tax filing software.",
  },
  {
    question: "Which plan is best for quotes, invoices, and job tracking?",
    answer:
      "Business is the best fit for workflows that involve quotes, estimates, work orders, invoices, expenses, inventory, and month-end reporting.",
  },
];

function arrayHasIntersection(values = [], allowedSet) {
  return values.some((value) => allowedSet.has(value));
}

export function getPlanFinderRecommendation(answers = {}) {
  const needs = Array.isArray(answers.needs) ? answers.needs : [];
  const financeHeavy = arrayHasIntersection(needs, BUSINESS_FINANCE_NEEDS);
  const hasStaffScheduling = needs.includes("Staff scheduling");
  const hasEmployeePortal = needs.includes("Employee portal");
  const hasServiceBusinessNeeds = arrayHasIntersection(
    needs,
    TEAM_SERVICE_BUSINESS_NEEDS
  );
  const starterCompatibleOnly =
    needs.length > 0 && needs.every((value) => STARTER_COMPATIBLE_NEEDS.has(value));
  const websiteOnlyOnly =
    needs.length === 1 && needs[0] === "Website only";
  const hasTeam = Boolean(answers.teamSize && answers.teamSize !== "just_me");

  let planKey = "starter";
  let planReason =
    "Starter is recommended because you mainly need a website, online booking, contact forms, services, and products without staff scheduling or finance workflows.";

  if (financeHeavy) {
    planKey = "business";
    planReason =
      "Business is recommended because you selected quote-to-invoice or finance-ready workflows such as quotes, work orders, invoices, inventory, reporting, or month-end review.";
  } else if (hasStaffScheduling && hasEmployeePortal) {
    planKey = "pro";
    planReason =
      "Pro is recommended because you selected staff scheduling, employee portal, and team workflows.";
  } else if (hasStaffScheduling) {
    planKey = "pro";
    planReason =
      "Pro is recommended because you selected staff scheduling and team visibility workflows.";
  } else if (hasEmployeePortal) {
    planKey = "pro";
    planReason =
      "Pro is recommended because you selected employee portal and team workflows.";
  } else if (hasTeam && hasServiceBusinessNeeds) {
    planKey = "pro";
    planReason =
      "Pro is recommended because you have a team and selected service-business needs like online booking, contact forms, services, or products. Starter may be enough if one person manages everything and you do not need staff workflows.";
  } else if (starterCompatibleOnly) {
    planKey = "starter";
    planReason = websiteOnlyOnly
      ? "Starter is recommended because you mainly need a simple website presence without staff scheduling or finance workflows."
      : "Starter is recommended because you mainly need a website, online booking, contact forms, services, and products without staff scheduling or finance workflows.";
  } else if (!hasTeam) {
    planKey = "starter";
    planReason =
      "Starter is recommended because your current needs do not require team workflows or finance-ready operations.";
  } else {
    planKey = "pro";
    planReason =
      "Pro is recommended because you have a team. Starter may be enough if one person manages everything and you do not need staff workflows.";
  }

  let setupKey = null;
  let setupLabel = "No setup required";
  let setupReason =
    "You can use the included website builder and add setup help later if needed.";

  const websiteRelevant =
    answers.websiteNeed !== "internal_only" && answers.websiteNeed !== undefined;

  if (websiteRelevant && answers.setupPreference === "done_for_you") {
    if (
      ["11_15", "15_plus"].includes(answers.pageCount) ||
      ["many_assets", "migration"].includes(answers.contentComplexity)
    ) {
      setupKey = "premium";
      setupLabel = "Premium Website Setup";
      setupReason =
        "Premium is recommended because your site scope includes larger page count, migration, or heavier content complexity.";
    } else if (
      answers.pageCount === "1_5" &&
      answers.contentComplexity === "simple"
    ) {
      setupKey = "basic";
      setupLabel = "Basic Website Setup";
      setupReason =
        "Basic is recommended because you want a simple site with a small page count and light content scope.";
    } else {
      setupKey = "growth";
      setupLabel = "Growth Website Setup";
      setupReason =
        "Growth is recommended because your site needs a fuller structure with services, content, and lead capture.";
    }
  } else if (websiteRelevant && answers.setupPreference === "not_sure") {
    if (
      ["11_15", "15_plus"].includes(answers.pageCount) ||
      ["many_assets", "migration"].includes(answers.contentComplexity)
    ) {
      setupKey = "premium";
      setupLabel = "Premium Website Setup";
      setupReason =
        "Premium is the safer fit if you expect a larger site, migration, or a heavy portfolio/gallery setup.";
    } else {
      setupKey = "growth";
      setupLabel = "Growth Website Setup";
      setupReason =
        "Growth is a safe default when you want setup help but are still defining the exact scope.";
    }
  }

  return {
    planKey,
    setupKey,
    setupLabel,
    planReason,
    setupReason,
  };
}
