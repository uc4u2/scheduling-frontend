const BASE_URL = "https://www.schedulaa.com";
const REGISTER_URL = "/register";
const CONTACT_URL = "/contact";

const sharedCta = {
  overline: "Payroll + HR in one hub",
  title: "Run payroll, issue slips, and publish portals in minutes",
  body: "Schedulaa unifies payroll calculations, compliance exports, and employee self-serve tools so finance and operations can work from the same dashboard.",
  primary: { label: "Start free", href: REGISTER_URL },
  secondary: { label: "Talk to us", href: CONTACT_URL },
};

const sharedSecondaryLinks = [
  { label: "Canada payroll", href: "/payroll/canada" },
  { label: "USA payroll", href: "/payroll/usa" },
  { label: "ROE generator", href: "/payroll/tools/roe" },
  { label: "T4 generator", href: "/payroll/tools/t4" },
  { label: "W-2 generator", href: "/payroll/tools/w2" },
  { label: "Employee payslips", href: "/payslips" },
];

const canadaConfig = {
  meta: {
    title: "Canada Payroll Calculator & Software (CPP, EI, BPA) | Schedulaa",
    description:
      "Run Canadian payroll with CPP, EI, federal and provincial tax, vacation pay, bonuses, tips, and employer matches. Finalize payslips as PDF, CSV, or Excel and email employees automatically.",
    canonical: `${BASE_URL}/payroll/canada`,
    og: {
      title: "Canada Payroll Calculator for Small Businesses | Schedulaa",
      description:
        "Preview and finalize Canadian payroll with CPP, EI, provincial tax, bonuses, and tips. Export payslips, email staff, and provide a self-serve portal.",
      image: `${BASE_URL}/images/payroll-canada-preview.png`,
      url: `${BASE_URL}/payroll/canada`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Canada Payroll Calculator for Small Businesses | Schedulaa",
      description:
        "Automate Canadian payroll with CPP, EI, provincial tax, vacation pay, and employee portals in one platform.",
      image: `${BASE_URL}/images/payroll-canada-preview.png`,
    },
  },
  schema: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Schedulaa Canada Payroll",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "CAD",
    },
    featureList: [
      "CPP and EI calculations",
      "Federal and provincial income tax deductions",
      "Vacation pay automation",
      "Bonuses, tips, and commissions support",
      "Payslip PDF, CSV, and Excel export",
      "Employee self-service payslip portal",
    ],
    url: `${BASE_URL}/payroll/canada`,
    provider: {
      "@type": "Organization",
      name: "Schedulaa",
      url: BASE_URL,
    },
  },
  hero: {
    badge: "CPP, EI, BPA tracking",
    title: "Canada Payroll Calculator for Small Businesses",
    subtitle:
      "Calculate gross-to-net with CPP, EI, federal and provincial tax, vacation pay, bonuses, tips, and employer matches in one dashboard.",
    bullets: [
      "Preview deductions line by line before finalizing payroll.",
      "Automate BPA pro-rating, CPP/EI ceilings, and YTD breakouts.",
      "Export payslips as PDF, CSV, or Excel and email employees instantly.",
    ],
    primaryCta: { label: "Run Canadian payroll", href: REGISTER_URL },
    secondaryCta: { label: "Book a walkthrough", href: CONTACT_URL },
  },
  featuresHeading: "Features",
  featuresTitle: "Everything Canadian payroll teams expect",
  featuresIntro:
    "Schedulaa aligns with CRA guidance for CPP, EI, and federal/provincial tax brackets so you can trust every pay cycle.",
  features: [
    {
      icon: "compliance",
      label: "Compliance",
      title: "CPP, EI, and tax automation",
      description:
        "Calculate CPP, EI, and federal/provincial income tax with BPA pro-rating per employee. YTD ceilings and clawbacks are tracked automatically.",
    },
    {
      icon: "document",
      label: "Payslips",
      title: "Finalize and export slips",
      description:
        "Finalize payroll and export slips as PDF, CSV, or Excel. Email documents to each employee directly from the pay run.",
      link: "/payslips",
      linkLabel: "See the payslip portal",
    },
    {
      icon: "timeline",
      label: "Workflow",
      title: "Preview, adjust, finalize",
      description:
        "Preview every deduction, edit overtime, bonuses, tips, commissions, and employer contributions, then finalize once amounts look right.",
    },
  ],
  highlights: [
    {
      overline: "Preview and finalize",
      title: "Line-item preview with BPA and YTD context",
      body:
        "See how federal, provincial, CPP, and EI deductions apply before committing a pay run. Every employee view includes BPA usage, vacation pay, and net pay totals.",
      points: [
        "Override hours, rates, and taxable benefits on the fly.",
        "Break out employer contributions alongside employee deductions.",
        "Keep an audit trail of each recalculation before finalizing.",
      ],
      links: [
        { label: "View payroll workflow", href: "/payroll/usa" },
      ],
      image: {
        src: "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?q=80&w=1200&auto=format&fit=crop",
        alt: "Schedulaa payroll preview showing Canadian deductions",
      },
    },
    {
      overline: "Exports",
      title: "Deliver payslips and compliance files in one click",
      body:
        "Finalize a run, export slips as PDF, CSV, or Excel, and send them to staff instantly. Need year-end filings? Jump straight into T4 or ROE generation with prefilled data.",
      points: [
        "One-click email of finalized PDF slips to each employee.",
        "Batch downloads for accounting and year-end review.",
      ],
      links: [
        { label: "Generate T4 slips", href: "/payroll/tools/t4" },
        { label: "Create ROEs", href: "/payroll/tools/roe" },
      ],
      image: {
        src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200&auto=format&fit=crop",
        alt: "Schedulaa payroll export options",
      },
    },
  ],
  stepsHeading: "Process",
  stepsTitle: "Run a Canadian pay cycle in three steps",
  stepsIntro:
    "Schedulaa connects scheduling, timesheets, and payroll data so finance teams can close each pay period quickly.",
  steps: [
    {
      title: "Import hours or enter earnings",
      description:
        "Bring in hours from scheduling or upload CSV data. Add bonuses, tips, commissions, and employer contributions before calculating.",
    },
    {
      title: "Preview deductions and adjust",
      description:
        "Review CPP, EI, and tax amounts with BPA context. Override vacation pay, taxable benefits, or RRSP/401k matches as needed.",
    },
    {
      title: "Finalize and deliver payslips",
      description:
        "Lock the pay run, email PDF slips to employees, download CSV or Excel exports, and queue T4/ROE filings directly.",
    },
  ],
  callouts: [
    {
      icon: "compliance",
      label: "Employee access",
      title: "Self-serve payslip portal",
      body:
        "Employees can sign in to Schedulaa and download their finalized PDF payslips any time. Filters make it easy to locate past periods without asking payroll staff.",
      links: [{ label: "See the portal", href: "/payslips" }],
    },
    {
      icon: "document",
      label: "Year-end filings",
      title: "T4 and ROE tooling included",
      body:
        "Generate CRA-compliant T4 slips and XML files, plus Records of Employment with PDF and XML exports. Prefilled data comes straight from the latest pay runs.",
      links: [
        { label: "Open the T4 generator", href: "/payroll/tools/t4" },
        { label: "Open the ROE generator", href: "/payroll/tools/roe" },
      ],
    },
  ],
  faqHeading: "FAQ",
  faqTitle: "Canadian payroll questions",
  faqIntro: "Honest answers based on what Schedulaa already powers for Canadian teams.",
  faq: [
    {
      question: "Do you support Québec payroll?",
      answer:
        "Schedulaa's standard payroll flow covers every province except Québec. We maintain a dedicated Québec path to handle QPP and RQAP; contact us so we can review your setup and enable the correct configuration.",
    },
    {
      question: "Can employees download their own payslips?",
      answer:
        "Yes. Once you finalize payroll, Schedulaa can email PDF slips to employees and surfaces the same documents inside the Employee Payslip Portal for self-serve downloads.",
    },
    {
      question: "How are CPP and EI ceilings handled?",
      answer:
        "Schedulaa tracks CPP and EI year-to-date totals per employee. When annual maximums are reached, deductions automatically stop and employer portions adjust accordingly.",
    },
  ],
  cta: sharedCta,
  secondaryLinks: sharedSecondaryLinks,
  notice:
    "Note: Local provincial programs such as health premiums or workers' compensation remittances remain manager-configured outside the core payroll engine.",
};

const usaConfig = {
  meta: {
    title: "USA Payroll Calculator (Federal & State, FICA/Medicare) | Schedulaa",
    description:
      "Calculate US payroll with federal and state income tax, FICA, and Medicare. Finalize payslips, export CSV/Excel, and give employees a self-serve portal.",
    canonical: `${BASE_URL}/payroll/usa`,
    og: {
      title: "USA Payroll Calculator for Teams with Multi-State Workers | Schedulaa",
      description:
        "Preview and finalize US payroll with federal and state tax, FICA, and Medicare. Export payslips and enable employee downloads instantly.",
      image: `${BASE_URL}/images/payroll-usa-preview.png`,
      url: `${BASE_URL}/payroll/usa`,
    },
    twitter: {
      card: "summary_large_image",
      title: "USA Payroll Calculator for Teams with Multi-State Workers | Schedulaa",
      description:
        "Schedulaa automates US payroll calculations, payslip exports, and employee self-serve downloads in one workflow.",
      image: `${BASE_URL}/images/payroll-usa-preview.png`,
    },
  },
  schema: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Schedulaa USA Payroll",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "USD",
    },
    featureList: [
      "Federal income tax withholding",
      "State income tax calculations",
      "FICA and Medicare deductions",
      "Bonuses, tips, and commissions support",
      "Payslip PDF, CSV, and Excel export",
      "Employee self-service portal",
    ],
    url: `${BASE_URL}/payroll/usa`,
    provider: {
      "@type": "Organization",
      name: "Schedulaa",
      url: BASE_URL,
    },
  },
  hero: {
    badge: "Federal + state + FICA",
    title: "USA Payroll Calculator with FICA and Medicare built in",
    subtitle:
      "Handle federal and state income tax, FICA, Medicare, bonuses, tips, commissions, and employer contributions in the same pay run.",
    bullets: [
      "Preview multi-state deductions before you finalize payroll.",
      "Track employer FUTA and SUTA alongside employee withholding.",
      "Email PDF payslips and keep a downloadable archive for staff.",
    ],
    primaryCta: { label: "Run US payroll", href: REGISTER_URL },
    secondaryCta: { label: "See a live demo", href: CONTACT_URL },
  },
  featuresHeading: "Features",
  featuresTitle: "US payroll covered from preview to payslip",
  featuresIntro:
    "Schedulaa keeps the deductions accurate while giving finance teams control over overrides and exceptions.",
  features: [
    {
      icon: "compliance",
      label: "Tax engine",
      title: "Federal and state withholding",
      description:
        "Calculate federal income tax, FICA, and Medicare, plus state income tax for the main jurisdictions. Employer FUTA/SUTA amounts display alongside employee deductions.",
    },
    {
      icon: "timeline",
      label: "Workflow",
      title: "Multi-state previews",
      description:
        "Preview each employee's deductions per jurisdiction before you finalize, edit wages and taxable benefits, and rerun the calculation in seconds.",
    },
    {
      icon: "document",
      label: "Exports",
      title: "Payslips and W-2 outputs",
      description:
        "Finalize payroll, export PDF, CSV, or Excel for accounting, and generate W-2 PDF and EFW2 files at year-end with prefilled data.",
      link: "/payroll/tools/w2",
      linkLabel: "Open the W-2 generator",
    },
  ],
  highlights: [
    {
      overline: "Preview",
      title: "Transparent deductions before you finalize",
      body:
        "See how each tax and contribution will hit net pay, including federal brackets, FICA, Medicare, and state-specific withholding. Override rates or earnings and recalc on demand.",
      points: [
        "Highlight overtime, tips, bonuses, and commissions for every employee.",
        "Record employer 401(k) matches and insurance premiums next to payroll taxes.",
      ],
      image: {
        src: "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?q=80&w=1200&auto=format&fit=crop",
        alt: "Schedulaa payroll preview showing US deductions",
      },
    },
    {
      overline: "Delivery",
      title: "Finalize, export, and notify employees",
      body:
        "Once numbers look correct, finalize the run, email payslips, and archive exports for finance. Employees can log in to download past slips any time.",
      points: [
        "Generated slips stay available in the employee portal.",
        "Accounting teams can download CSV or Excel for journal entries.",
      ],
      links: [
        { label: "See employee portal", href: "/payslips" },
      ],
      image: {
        src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1200&auto=format&fit=crop",
        alt: "Laptop with payroll export confirmation",
      },
    },
  ],
  stepsHeading: "Process",
  stepsTitle: "How teams finish a US pay cycle in Schedulaa",
  stepsIntro:
    "Bring in hours, preview withholding, finalize, and deliver payslips without leaving the platform.",
  steps: [
    {
      title: "Import hours or salaries",
      description:
        "Pull data from scheduling or upload spreadsheets. Enter bonuses, tips, commissions, and employer contributions.",
    },
    {
      title: "Preview deductions per jurisdiction",
      description:
        "Review federal and state withholding, FICA, Medicare, and employer taxes. Adjust wages or overrides and rerun the preview.",
    },
    {
      title: "Finalize and export",
      description:
        "Finalize the payroll, email PDF payslips, download CSV/Excel, and prepare W-2s at year end.",
    },
  ],
  callouts: [
    {
      icon: "compliance",
      label: "Limitations",
      title: "Local and city taxes",
      body:
        "Local and city income taxes (for example, New York City or county levies) are not automated yet. Track these outside Schedulaa and import adjustments if needed.",
    },
    {
      icon: "document",
      label: "Year-end filing",
      title: "W-2 outputs included",
      body:
        "Generate six-copy IRS W-2 PDFs, flattened forms for e-delivery, and EFW2 text files. Multi-state wages are supported with per-state coding.",
      links: [{ label: "Generate W-2s", href: "/payroll/tools/w2" }],
    },
  ],
  faqHeading: "FAQ",
  faqTitle: "US payroll questions",
  faqIntro: "Answers based on the capabilities shipping in Schedulaa today.",
  faq: [
    {
      question: "Do you handle local or city income taxes?",
      answer:
        "Not yet. Schedulaa calculates federal and state income tax, FICA, and Medicare. Local and city levies (for example, NYC or county surcharges) should be tracked separately and uploaded if needed.",
    },
    {
      question: "Can I run multi-state payroll?",
      answer:
        "Yes. Each employee record can store multiple state configurations. The preview shows deduction splits so you can confirm the correct jurisdictions before finalizing.",
    },
    {
      question: "How do employees get their payslips?",
      answer:
        "Once you finalize payroll you can email PDF payslips directly to recipients. The same documents appear in the Employee Payslip Portal for self-serve downloads.",
    },
  ],
  cta: sharedCta,
  secondaryLinks: sharedSecondaryLinks,
  notice: "Employer FUTA and SUTA contributions are surfaced for reference. Local/city income taxes are not automated yet.",
};

const roeConfig = {
  meta: {
    title: "ROE Generator (Record of Employment) – Canada | Schedulaa",
    description:
      "Generate Canadian ROEs with prefilled insurable hours and earnings, approval workflow, and PDF/XML exports ready for Service Canada.",
    canonical: `${BASE_URL}/payroll/tools/roe`,
    og: {
      title: "ROE Generator with PDF & XML Export | Schedulaa",
      description:
        "Create, review, and export Records of Employment with prefilled data from your latest pay runs, plus approvals and audit trail.",
      image: `${BASE_URL}/images/payroll-roe-preview.png`,
      url: `${BASE_URL}/payroll/tools/roe`,
    },
    twitter: {
      card: "summary_large_image",
      title: "ROE Generator with PDF & XML Export | Schedulaa",
      description:
        "Schedulaa automates ROEs with prefilled insurable earnings, approvals, and CRA-compliant PDF/XML exports.",
      image: `${BASE_URL}/images/payroll-roe-preview.png`,
    },
  },
  schema: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Schedulaa ROE Generator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0.00", priceCurrency: "CAD" },
    featureList: [
      "Prefill insurable hours and earnings from payroll",
      "Approval workflow with audit trail",
      "PDF and XML export for Service Canada",
      "Department and employee filters",
    ],
    url: `${BASE_URL}/payroll/tools/roe`,
  },
  hero: {
    badge: "Record of Employment",
    title: "ROE Generator with PDF and XML export",
    subtitle:
      "Prefill insurable hours and earnings from your latest pay runs, review in-app, and export CRA-compliant PDF and XML files.",
    bullets: [
      "Prefill ROEs using finalized payroll data.",
      "Route submissions through approve or reject workflow.",
      "Export PDF or XML packages for Service Canada.",
    ],
    primaryCta: { label: "Generate an ROE", href: REGISTER_URL },
    secondaryCta: { label: "Talk to compliance", href: CONTACT_URL },
  },
  featuresHeading: "Capabilities",
  featuresTitle: "Everything needed for compliant ROEs",
  featuresIntro: "Schedulaa keeps your ROE workflow fast, auditable, and ready for Service Canada.",
  features: [
    {
      icon: "document",
      label: "Prefill",
      title: "Auto-complete with payroll data",
      description:
        "Pull insurable hours and earnings from the latest paystub for each employee, including vacation pay and separation pay.",
    },
    {
      icon: "timeline",
      label: "Workflow",
      title: "Approve or reject submissions",
      description:
        "Route drafted ROEs through approvals. Capture comments and maintain an audit trail before exporting.",
    },
    {
      icon: "compliance",
      label: "Export",
      title: "PDF and XML packages",
      description:
        "Generate PDF copies for internal records and XML submissions compatible with Service Canada portals.",
    },
  ],
  highlights: [
    {
      overline: "Audit trail",
      title: "Track every change and approval",
      body:
        "Schedulaa keeps a detailed log for each ROE. See who prepared, approved, or rejected the form, with timestamps for compliance reviews.",
      image: {
        src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200&auto=format&fit=crop",
        alt: "ROE approval audit trail",
      },
    },
  ],
  stepsHeading: "Workflow",
  stepsTitle: "How the ROE generator works",
  steps: [
    {
      title: "Create from payroll history",
      description:
        "Choose an employee and pull their latest pay runs to prefill insurable hours, earnings, and separation details.",
    },
    {
      title: "Review and approve",
      description:
        "Validate the data, capture comments, and approve or reject. All changes are logged for auditing.",
    },
    {
      title: "Export and submit",
      description:
        "Download PDF for records or XML for Service Canada upload. Batch exports help you keep filings organized.",
    },
  ],
  callouts: [
    {
      icon: "document",
      label: "Related tools",
      title: "Need T4 slips too?",
      body:
        "Schedulaa links ROE data to year-end filings. Generate T4s from the same payroll data set and stay compliant without duplicating work.",
      links: [{ label: "Generate T4s", href: "/payroll/tools/t4" }],
    },
  ],
  faqHeading: "FAQ",
  faqTitle: "ROE questions",
  faq: [
    {
      question: "Which fields are prefilled automatically?",
      answer:
        "Schedulaa pulls insurable hours, earnings, vacation pay, and separation pay from the latest finalized pay runs so you only confirm details before exporting.",
    },
    {
      question: "Can I export XML for bulk upload?",
      answer:
        "Yes. The generator creates XML files ready for upload to the Service Canada portal, alongside PDF copies for internal records.",
    },
  ],
  cta: sharedCta,
  secondaryLinks: sharedSecondaryLinks,
};

const t4Config = {
  meta: {
    title: "T4 Generator – Canada Year-End Slips (PDF & XML) | Schedulaa",
    description:
      "Generate CRA-compliant T4 slips with PDF, XML, and ZIP packages. Prefill boxes from payroll runs and batch deliver to employees.",
    canonical: `${BASE_URL}/payroll/tools/t4`,
    og: {
      title: "T4 Generator with CRA XML Export | Schedulaa",
      description:
        "Create T4 slips, render PDF copies, export CRA XML, and bundle everything in a ZIP with a single workflow.",
      image: `${BASE_URL}/images/payroll-t4-preview.png`,
      url: `${BASE_URL}/payroll/tools/t4`,
    },
    twitter: {
      card: "summary_large_image",
      title: "T4 Generator with CRA XML Export | Schedulaa",
      description:
        "Schedulaa fills T4 boxes from payroll data, renders PDF, builds CRA XML, and bundles slips in one workflow.",
      image: `${BASE_URL}/images/payroll-t4-preview.png`,
    },
  },
  schema: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Schedulaa T4 Generator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0.00", priceCurrency: "CAD" },
    featureList: [
      "Prefill CRA boxes from payroll",
      "Render PDF copies",
      "Generate CRA XML",
      "Batch ZIP download",
      "Delivery-ready slip packages",
    ],
    url: `${BASE_URL}/payroll/tools/t4`,
  },
  hero: {
    badge: "Year-end payroll",
    title: "T4 Generator with PDF and CRA XML exports",
    subtitle:
      "Prefill CRA boxes from your Schedulaa payroll history, render PDF slips for employees, and export CRA XML with one click.",
    bullets: [
      "Prefill T4 boxes from finalized payroll data.",
      "Render employee-ready PDF slips.",
      "Export CRA XML and batch ZIP for filing.",
    ],
    primaryCta: { label: "Generate T4 slips", href: REGISTER_URL },
    secondaryCta: { label: "Get help with filings", href: CONTACT_URL },
  },
  featuresHeading: "Capabilities",
  featuresTitle: "Year-end slips without manual data entry",
  features: [
    {
      icon: "document",
      label: "Prefill",
      title: "Auto-populated CRA boxes",
      description:
        "Schedulaa maps payroll earnings, deductions, and taxable benefits into the correct CRA boxes so you spend time reviewing, not retyping.",
    },
    {
      icon: "compliance",
      label: "Compliance",
      title: "XML ready for CRA upload",
      description:
        "Produce CRA XML files that align with the latest specifications. Keep archives organized with batch ZIP exports.",
    },
    {
      icon: "timeline",
      label: "Workflow",
      title: "Batch delivery",
      description:
        "Bundle PDF, XML, and CSV summaries in a single ZIP file for safe storage or delivery to your compliance team.",
    },
  ],
  highlights: [
    {
      overline: "Prefill accuracy",
      title: "CRA boxes filled straight from payroll",
      body:
        "Every T4 uses the same data you finalized in payroll. Review employment income, CPP/EI, taxable benefits, and pension adjustments before exporting.",
      image: {
        src: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1200&auto=format&fit=crop",
        alt: "T4 generator showing CRA boxes",
      },
    },
  ],
  stepsHeading: "Process",
  stepsTitle: "From payroll history to T4 packages",
  steps: [
    {
      title: "Select the tax year",
      description:
        "Choose the year you need slips for and let Schedulaa fetch the payroll history.",
    },
    {
      title: "Review prefilled data",
      description:
        "Confirm CRA boxes, employer information, and footnotes before exporting.",
    },
    {
      title: "Export PDF, XML, ZIP",
      description:
        "Download employee PDFs, CRA XML, and a ZIP archive to share with stakeholders or upload to the CRA portal.",
    },
  ],
  callouts: [
    {
      icon: "document",
      label: "Connected tools",
      title: "ROE generator included",
      body: "Need Records of Employment as well? Switch to the ROE generator without leaving your workflow.",
      links: [{ label: "Open ROE generator", href: "/payroll/tools/roe" }],
    },
  ],
  faqHeading: "FAQ",
  faqTitle: "T4 generator questions",
  faq: [
    {
      question: "Do you generate CRA XML automatically?",
      answer:
        "Yes. The T4 generator produces XML files ready for CRA submission along with PDF copies for employees.",
    },
    {
      question: "Can employees receive their T4 online?",
      answer:
        "After you generate T4 slips, you can distribute the PDF copies through the payslip portal or your preferred delivery channel.",
    },
  ],
  cta: sharedCta,
  secondaryLinks: sharedSecondaryLinks,
};

const w2Config = {
  meta: {
    title: "W-2 Generator – US Year-End (IRS Fillable PDF & EFW2) | Schedulaa",
    description:
      "Generate IRS W-2 forms with fillable multi-copy PDFs, flattened employee copies, and EFW2 text files ready for SSA submission.",
    canonical: `${BASE_URL}/payroll/tools/w2`,
    og: {
      title: "W-2 Generator with IRS PDF and EFW2 Export | Schedulaa",
      description:
        "Prefill W-2 boxes from Schedulaa payroll data, render six-copy PDFs, flatten for e-delivery, and export EFW2 files.",
      image: `${BASE_URL}/images/payroll-w2-preview.png`,
      url: `${BASE_URL}/payroll/tools/w2`,
    },
    twitter: {
      card: "summary_large_image",
      title: "W-2 Generator with IRS PDF and EFW2 Export | Schedulaa",
      description:
        "Schedulaa fills W-2 boxes, renders IRS-compliant PDFs, and builds EFW2 text files for SSA reporting.",
      image: `${BASE_URL}/images/payroll-w2-preview.png`,
    },
  },
  schema: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Schedulaa W-2 Generator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0.00", priceCurrency: "USD" },
    featureList: [
      "Prefill IRS W-2 boxes from payroll",
      "Render six-copy IRS PDF",
      "Flatten employee copies",
      "Generate EFW2 text files",
      "Support for multi-state wages",
    ],
    url: `${BASE_URL}/payroll/tools/w2`,
  },
  hero: {
    badge: "Year-end payroll",
    title: "W-2 Generator with IRS PDF and EFW2 export",
    subtitle:
      "Fill every W-2 box automatically, render the official six-copy PDF, flatten employee copies, and generate EFW2 text in one workflow.",
    bullets: [
      "Prefill wages, withholding, and benefits from Schedulaa payroll.",
      "Render multi-copy IRS PDF forms and flattened employee versions.",
      "Generate SSA EFW2 text files for electronic submission.",
    ],
    primaryCta: { label: "Generate W-2 forms", href: REGISTER_URL },
    secondaryCta: { label: "Request onboarding", href: CONTACT_URL },
  },
  featuresHeading: "Capabilities",
  featuresTitle: "Accurate W-2 filing without manual edits",
  features: [
    {
      icon: "document",
      label: "Prefill",
      title: "W-2 boxes filled from payroll history",
      description:
        "Schedulaa maps wages, withholding, tips, and deferred compensation right into the correct W-2 boxes.",
    },
    {
      icon: "compliance",
      label: "Compliance",
      title: "IRS PDF and EFW2 outputs",
      description:
        "Generate the official six-copy W-2 PDF, flattened employee copies for e-delivery, and EFW2 text files for SSA.",
    },
    {
      icon: "timeline",
      label: "Multi-state",
      title: "Support for multi-state wages",
      description:
        "Track wages across multiple states and ensure the correct locality codes are included in the exported forms.",
    },
  ],
  highlights: [
    {
      overline: "Ready for SSA",
      title: "EFW2 export in one click",
      body:
        "Generate the EFW2 text file using your finalized payroll data. Keep employer and employee copies synced without duplicate data entry.",
      image: {
        src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
        alt: "W-2 generator export options",
      },
    },
  ],
  stepsHeading: "Process",
  stepsTitle: "From payroll to filed W-2s",
  steps: [
    {
      title: "Select tax year and employees",
      description:
        "Pick the tax year, filter the employees you need, and let Schedulaa prefill their data.",
    },
    {
      title: "Review and approve forms",
      description:
        "Confirm each box, adjust if necessary, and approve the batch prior to export.",
    },
    {
      title: "Export PDF and EFW2",
      description:
        "Download the six-copy PDF and flattened versions for employees, plus the EFW2 file for SSA submission.",
    },
  ],
  callouts: [
    {
      icon: "document",
      label: "Connected tools",
      title: "Need live payroll runs?",
      body:
        "W-2 forms are built on the same payroll engine that handles federal, state, FICA, and Medicare calculations.",
      links: [{ label: "Run US payroll", href: "/payroll/usa" }],
    },
  ],
  faqHeading: "FAQ",
  faqTitle: "W-2 generator questions",
  faq: [
    {
      question: "Do you support multi-state wages?",
      answer:
        "Yes. W-2 exports include per-state wage totals and codes so employees with multiple work locations are supported.",
    },
    {
      question: "Can I deliver W-2s electronically?",
      answer:
        "Schedulaa renders flattened PDF copies you can distribute electronically alongside the employee portal.",
    },
  ],
  cta: sharedCta,
  secondaryLinks: sharedSecondaryLinks,
};

const payslipConfig = {
  meta: {
    title: "Employee Payslip Portal – Download Payslips Online | Schedulaa",
    description:
      "Employees can access finalized payslips, filter by date, and download secure PDF copies any time. Managers control access and track downloads.",
    canonical: `${BASE_URL}/payslips`,
    og: {
      title: "Employee Payslip Portal | Schedulaa",
      description:
        "Give staff a secure portal to download finalized payslips, track history, and stay compliant with delivery requirements.",
      image: `${BASE_URL}/images/payroll-payslip-portal.png`,
      url: `${BASE_URL}/payslips`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Employee Payslip Portal | Schedulaa",
      description:
        "Schedulaa powers a secure payslip portal so employees can download PDF slips without emailing payroll.",
      image: `${BASE_URL}/images/payroll-payslip-portal.png`,
    },
  },
  schema: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Schedulaa Payslip Portal",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0.00", priceCurrency: "USD" },
    featureList: [
      "Employee self-service payslip access",
      "PDF downloads with date filters",
      "Email notifications on new slips",
      "Manager controls and auditing",
    ],
    url: `${BASE_URL}/payslips`,
  },
  hero: {
    badge: "Employee experience",
    title: "Employee payslip portal with instant downloads",
    subtitle:
      "Give staff a secure, branded portal where they can view and download finalized payslips any time without emailing payroll.",
    bullets: [
      "Search and filter payslips by date or payroll run.",
      "Download PDF copies that match the finalized export.",
      "Control access with role-based permissions.",
    ],
    primaryCta: { label: "Enable the portal", href: REGISTER_URL },
    secondaryCta: { label: "See payroll features", href: "/payroll/canada" },
  },
  featuresHeading: "Highlights",
  featuresTitle: "Keep employees informed without extra tickets",
  features: [
    {
      icon: "timeline",
      label: "Access",
      title: "All finalized payslips in one view",
      description:
        "Employees see their full payslip history with filters by pay period, employment type, or date range.",
    },
    {
      icon: "document",
      label: "Delivery",
      title: "Secure PDF downloads",
      description:
        "Every payslip matches the finalized PDF generated during payroll. Employees can download on desktop or mobile instantly.",
    },
    {
      icon: "compliance",
      label: "Controls",
      title: "Role-based permissions and logging",
      description:
        "Managers control who can access the portal and review logs for auditing. Disable access when employees leave.",
    },
  ],
  highlights: [
    {
      overline: "Experience",
      title: "Branded portal your team trusts",
      body:
        "Customize colors, logos, and links so the portal matches your company brand. Employees log in with their existing Schedulaa credentials.",
      image: {
        src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
        alt: "Schedulaa payslip portal dashboard",
      },
    },
  ],
  stepsHeading: "Process",
  stepsTitle: "How the payslip portal works",
  steps: [
    {
      title: "Finalize payroll",
      description:
        "Run payroll in Schedulaa. Finalized PDF slips automatically sync to the payslip portal.",
    },
    {
      title: "Notify employees",
      description:
        "Send emails from payroll or notify staff through your HR channels that new slips are ready.",
    },
    {
      title: "Employees download securely",
      description:
        "Employees log in, filter by pay period, and download the PDF copies whenever they need them.",
    },
  ],
  callouts: [
    {
      icon: "document",
      label: "Connected",
      title: "Works with Canadian and US payroll",
      body:
        "The payslip portal receives finalized slips from both Canadian and US payroll runs, so multinational teams share the same experience.",
      links: [{ label: "Run a payroll preview", href: "/payroll/canada" }],
    },
  ],
  faqHeading: "FAQ",
  faqTitle: "Payslip portal questions",
  faq: [
    {
      question: "Do employees need a separate login?",
      answer:
        "No. Employees use their existing Schedulaa login. Access is controlled by manager permissions and can be revoked any time.",
    },
    {
      question: "Can we email payslips as well?",
      answer:
        "Yes. When you finalize payroll you can email PDF copies to each employee and still keep the portal enabled as a backup.",
    },
  ],
  cta: sharedCta,
  secondaryLinks: sharedSecondaryLinks,
};

export const payrollPages = {
  canada: canadaConfig,
  usa: usaConfig,
  roe: roeConfig,
  t4: t4Config,
  w2: w2Config,
  payslips: payslipConfig,
};
