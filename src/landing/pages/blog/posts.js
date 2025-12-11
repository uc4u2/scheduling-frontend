// Centralized blog post data for reusable rendering and SEO.
// Each post can be rendered by BlogPostPage via slug.
const blogPosts = [
  {
    slug: "client-journey",
    title: "Designing a Client Journey with Schedulaa",
    description:
      "Guide prospects from first visit to loyal customer using Schedulaa's website builder, booking engine, automation, and analytics.",
    datePublished: "2025-11-04",
    dateModified: "2025-11-04",
    category: "Growth Playbooks",
    tags: ["client journey", "automation", "booking"],
    heroOverline: "Growth Playbooks",
    // Content lives in a dedicated page component; keep metadata here for listings and sitemap.
    sections: [],
  },
  {
    slug: "adp-alternative-canada-us-service-teams",
    title: "An ADP Alternative for Canadian + U.S. Service Teams",
    description:
      "Why service teams with cross-border staff can run payroll, T4/ROE, and W-2 in one operations-first OS instead of an enterprise stack.",
    datePublished: "2025-12-10",
    dateModified: "2025-12-10",
    category: "Payroll",
    tags: ["payroll", "canada", "usa", "comparison"],
    heroOverline: "Payroll",
    sections: [
      {
        heading: "Why ADP became the default",
        paragraphs: [
          "ADP won enterprise payroll because it handles multiple regions, filings, and deep HR modules. For 2,000-person companies with large HR teams, that makes sense. For 50–200 person service teams, it can feel like heavy setup, long contracts, and modules you never use.",
        ],
      },
      {
        heading: "Where Schedulaa is different",
        paragraphs: [
          "Schedulaa is operations-first: shifts, time tracking, and bookings feed payroll. Instead of stitching scheduling + a U.S. payroll app + a separate Canadian provider, you run one OS that understands tips, shift premiums, union dues, garnishments, and reimbursements.",
        ],
      },
      {
        heading: "Cross-border without enterprise overhead",
        paragraphs: [
          "Schedulaa has two built-in engines: Canada (ex-Québec) with CPP/EI/BPA, vacation/holiday rules, T4 (14/16/18/22/24/26/40/44) and ROE exports; and the U.S. with federal/state income tax, FICA, SUI, and W-2 export. Employee work location (country + province/state) drives the right engine automatically.",
        ],
      },
      {
        heading: "Scenario 1: U.S. agency hiring a Canadian designer",
        paragraphs: [
          "A California agency hires a designer in Ontario. The designer’s shifts live in the same calendar as U.S. staff, but payroll runs with the Canadian engine: CPP/EI/BPA, provincial tax, and year-end T4/ROE. U.S. teammates still receive W-2s—same dashboard, two engines.",
        ],
      },
      {
        heading: "Scenario 2: Canadian med-spa with a U.S. receptionist",
        paragraphs: [
          "Clinics in Toronto and Vancouver employ a remote receptionist in Florida. Her hours live in the same schedule as Canadian techs. Payroll applies federal + FICA (no state tax in FL) and produces a W-2 for her, while Canadian staff continue on CPP/EI with T4/ROE.",
        ],
      },
      {
        heading: "Scenario 3: Mixed call center across Canada and the U.S.",
        paragraphs: [
          "Agents in Ontario, BC, Texas, and Georgia share one roster. Break enforcement and overtime rules stay consistent. Canadian agents get T4/ROE from CPP/EI rules; U.S. agents get W-2 from FICA/state rules. Finance downloads one export with all teams included.",
        ],
      },
      {
        heading: "Where ADP is still the better choice",
        paragraphs: [
          "If you have hundreds or thousands of employees, need deep HR and benefits, or want ADP to manage global filings across many countries, ADP is still the safer enterprise option.",
        ],
      },
      {
        heading: "Why Schedulaa is a realistic ADP alternative",
        paragraphs: [
          "Schedulaa fits service teams with 10–250 staff who want cross-border payroll tied to actual shifts, breaks, PTO, and tips. You get CRA + IRS engines, T4/ROE/W-2 exports, and a branded payslip portal without enterprise overhead.",
        ],
      },
      {
        heading: "See Schedulaa in action",
        paragraphs: [
          "Explore payroll: /payroll",
          "Review Canadian coverage (ex-Québec): /payroll/canada",
          "Review U.S. coverage: /payroll/usa",
          "Talk to us: /contact",
        ],
      },
    ],
  },
  {
    slug: "fix-scheduling-chaos",
    title: "How Service Teams Can Finally Fix Scheduling Chaos (Without Using 5 Different Apps)",
    description:
      "When booking, shifts, breaks, and payroll live in different tools, mistakes are guaranteed. Here's how Schedulaa keeps them in one flow.",
    datePublished: "2025-03-01",
    dateModified: "2025-03-01",
    category: "Operations",
    tags: ["scheduling", "operations", "payroll"],
    heroOverline: "Operations",
    sections: [
      {
        heading: "The real root cause of chaos",
        paragraphs: [
          "Most service businesses don't struggle because of bad clients or bad staff--they struggle because information is scattered. Shifts live in spreadsheets, break times in chat threads, PTO in email, and payroll in a separate system. By Friday, everyone is reconciling half-truths.",
          "Schedulaa was built to close that gap. Booking feeds scheduling, scheduling feeds time tracking, and approved time feeds payroll exports. When data is shared across one workspace, managers stop chasing updates and staff stop guessing.",
        ],
      },
      {
        heading: "What unified looks like in practice",
        paragraphs: [
          "One availability source powers both client booking and internal staffing, so clients never see phantom slots. Break windows and PTO approvals are enforced directly on shifts. Live rosters flag late arrivals or missed breaks before the day goes off the rails.",
          "Because everything sits together, payroll becomes a byproduct of clean operations, not a rescue mission. Approved hours and tips roll into exports for QuickBooks or Xero without retyping.",
        ],
      },
      {
        heading: "Signs it's time to consolidate",
        paragraphs: [
          "- You maintain 4-7 tools to get through a week.",
          "- Staff discover conflicts only after clients book.",
          "- Breaks happen in clusters because nothing staggers them.",
          "- Managers spend Mondays fixing timesheets instead of coaching.",
        ],
      },
      {
        heading: "How to start",
        paragraphs: [
          "Publish availability once, let clients book on top of it, and manage breaks/PTO inside the same calendar. Use live rosters to resolve issues early, then export clean hours to payroll. The fewer systems you juggle, the fewer fires you fight.",
        ],
      },
    ],
  },
  {
    slug: "break-enforcement-matters",
    title: "Why Break Enforcement Matters More Than Most Managers Realize",
    description:
      "Uncontrolled breaks ripple into wait times, overtime, and client churn. Staggered, policy-aware breaks keep coverage intact.",
    datePublished: "2025-03-02",
    dateModified: "2025-03-02",
    category: "Scheduling",
    tags: ["breaks", "compliance", "coverage"],
    heroOverline: "Scheduling",
    sections: [
      {
        heading: "Breaks are an operational lever",
        paragraphs: [
          "When everyone steps away at once, a salon line forms, patients wait, or field crews run late. Even a 10-minute pile-up cuts service quality and adds stress.",
          "Many tools ignore break logic entirely. Schedulaa doesn't. Break rules sit alongside scheduling, so coverage stays balanced and managers keep visibility.",
        ],
      },
      {
        heading: "What smart breaks look like",
        paragraphs: [
          "- Staggered break slots so coverage stays intact at peak times.",
          "- Paid vs unpaid break types with auto-deductions based on policy.",
          "- Alerts for opening/closing break windows, plus countdowns for staff.",
          "- Audit history and approvals so you know who took what, when.",
        ],
      },
      {
        heading: "The business impact",
        paragraphs: [
          "Predictable breaks mean predictable operations. Clients wait less, overtime drops, and managers stop policing chat threads to see who stepped away. When break compliance is built-in, you get both healthier teams and smoother days.",
        ],
      },
    ],
  },
  {
    slug: "payroll-errors-cost",
    title: "The Real Cost of Payroll Errors -- And How to Prevent Them Before They Happen",
    description:
      "Payroll mistakes drain time, morale, and trust. Most start with messy operational data. Here's how to stop them upstream.",
    datePublished: "2025-03-03",
    dateModified: "2025-03-03",
    category: "Payroll",
    tags: ["payroll", "compliance", "operations"],
    heroOverline: "Payroll",
    sections: [
      {
        heading: "Why errors happen",
        paragraphs: [
          "Incorrect hours, missing break deductions, and out-of-sync PTO all cascade into the pay run. By the time finance notices, memories are fuzzy and trust erodes.",
        ],
      },
      {
        heading: "Close the gap at the source",
        paragraphs: [
          "Schedulaa links every operational action--shift, break, time punch, PTO approval--directly to payroll outputs. Anomaly flags catch late arrivals or missed breaks before the week ends. Approved time flows straight into exports, reducing manual triage.",
        ],
      },
      {
        heading: "The payoff",
        paragraphs: [
          "Cleaner data means fewer corrections, happier staff, and less accountant time. Payroll accuracy isn't luck; it's the result of scheduling, breaks, and approvals living in one place.",
        ],
      },
    ],
  },
  {
    slug: "booking-app-alone",
    title: "Why Service Businesses Should Not Use a Booking App Alone",
    description:
      "Booking apps help clients book--but they don't manage shifts, PTO, or break rules. That gap creates double-bookings and burnout.",
    datePublished: "2025-03-04",
    dateModified: "2025-03-04",
    category: "Booking",
    tags: ["booking", "scheduling", "staffing"],
    heroOverline: "Booking",
    sections: [
      {
        heading: "Booking != scheduling",
        paragraphs: [
          "A booking-only tool can't coordinate staff availability, enforce breaks, or feed payroll. That's fine for a solo operator--until a team grows beyond three people.",
        ],
      },
      {
        heading: "Link client booking to staff reality",
        paragraphs: [
          "Schedulaa ties client-facing slots to the same availability managers use for shifts and leave. Clients never see a time that isn't staffed, and staff never get assigned to overlapping commitments.",
          "Managers control the master calendar, while employees manage their own availability with guardrails. PTO and break rules are enforced on the same schedule clients book against.",
        ],
      },
      {
        heading: "Result: fewer surprises",
        paragraphs: [
          "No double-booking, no unstaffed slots, and a smoother handoff to payroll. A good booking app helps clients; a great operations platform protects the whole business.",
        ],
      },
    ],
  },
  {
    slug: "too-many-tools-cost",
    title: "The Hidden Cost of Using Too Many Tools to Run a Service Business",
    description:
      "Running on 6-7 disconnected tools creates rework, training overhead, and bad data. Consolidation pays for itself quickly.",
    datePublished: "2025-03-05",
    dateModified: "2025-03-05",
    category: "Operations",
    tags: ["tooling", "consolidation", "efficiency"],
    heroOverline: "Operations",
    sections: [
      {
        heading: "Fragmentation tax",
        paragraphs: [
          "A typical 10-20 person team uses a booking tool, scheduling tool, punch clock, PTO tracker, payroll provider, messenger, and spreadsheets. Information lives everywhere and nowhere.",
        ],
      },
      {
        heading: "What consolidation unlocks",
        paragraphs: [
          "Schedulaa replaces 4-7 tools with one platform: booking, scheduling, break/PTO, attendance, and payroll exports. Fewer apps mean fewer mistakes, faster onboarding, and unified data.",
        ],
      },
      {
        heading: "Measure the gains",
        paragraphs: [
          "Lower subscription spend is nice, but the real win is clean operations: fewer missed breaks, fewer timesheet fixes, and clients seeing accurate availability every time.",
        ],
      },
    ],
  },
  {
    slug: "multi-location-operations",
    title: "Why Multi-Location Service Teams Need a Unified Operations OS",
    description:
      "Managing multiple sites means coordinating availability, travel time, and staffing rules. A unified system keeps locations in sync.",
    datePublished: "2025-03-06",
    dateModified: "2025-03-06",
    category: "Operations",
    tags: ["multi-location", "scheduling", "staffing"],
    heroOverline: "Multi-location",
    sections: [
      {
        heading: "What changes with a second location",
        paragraphs: [
          "Suddenly you're tracking who is where, how travel time impacts coverage, and how local hours or holidays differ. Spreadsheets and standalone booking links can't keep up.",
        ],
      },
      {
        heading: "How Schedulaa handles multi-location",
        paragraphs: [
          "Location-aware schedules, staff counts per site, and master calendars let managers see the whole picture. Close or open windows per location without breaking booked slots. Keep PTO, break rules, and hours consistent--or override them per site when needed.",
        ],
      },
      {
        heading: "Clarity for staff and clients",
        paragraphs: [
          "Staff see where they need to be and when. Clients only see slots that are truly available at the chosen location. Coverage stays predictable, and payroll exports stay clean.",
        ],
      },
    ],
  },
  {
    slug: "employee-self-service",
    title: "How Employee Self-Service Reduces Manager Workload by 40%",
    description:
      "Most manager interruptions are simple requests. Self-service tools and public booking links cut the noise.",
    datePublished: "2025-03-07",
    dateModified: "2025-03-07",
    category: "Workforce",
    tags: ["self-service", "staff", "booking"],
    heroOverline: "Workforce",
    sections: [
      {
        heading: "The questions that burn time",
        paragraphs: [
          "\"Can I swap my shift?\" \"Can I take tomorrow off?\" \"Can you send my client the booking link?\" These interruptions add up.",
        ],
      },
      {
        heading: "What employees can do themselves",
        paragraphs: [
          "- Request leave and swap shifts within manager guardrails.",
          "- View schedules, clock in/out, and see break status.",
          "- Share their public booking link so clients can self-book, or send invite emails when needed.",
          "- Let confirmations handle Jitsi/video details plus cancel/reschedule links automatically.",
        ],
      },
      {
        heading: "Impact on managers",
        paragraphs: [
          "With self-service portals and public booking links, 80-90% of routine questions vanish. Managers stay focused on staffing strategy instead of forwarding links.",
        ],
      },
    ],
  },
  {
    slug: "scheduling-improves-payroll",
    title: "How Better Scheduling Directly Improves Payroll Accuracy",
    description:
      "Payroll assumes clean data. Scheduling that enforces policy delivers it.",
    datePublished: "2025-03-08",
    dateModified: "2025-03-08",
    category: "Payroll",
    tags: ["scheduling", "payroll", "compliance"],
    heroOverline: "Payroll",
    sections: [
      {
        heading: "Reality vs assumptions",
        paragraphs: [
          "Real life includes late arrivals, extended breaks, forgotten punch-ins, and last-minute PTO. If your schedule doesn't enforce policy, payroll inherits the mess.",
        ],
      },
      {
        heading: "Policy-aware scheduling",
        paragraphs: [
          "Schedulaa flags anomalies (late punches, missing breaks) while the shift is still open. Managers approve exceptions in context, then exports carry only clean, approved hours.",
        ],
      },
      {
        heading: "Chain reaction",
        paragraphs: [
          "Fix the schedule, and you fix the timesheet. Fix the timesheet, and payroll runs smoothly. Accuracy starts upstream.",
        ],
      },
    ],
  },
  {
    slug: "scheduling-and-booking-together",
    title: "Why Service Teams Need Both Scheduling AND Booking in One System",
    description:
      "Clients live in a booking experience; staff live in schedules. Connecting them prevents double-booking and burnout.",
    datePublished: "2025-03-09",
    dateModified: "2025-03-09",
    category: "Booking",
    tags: ["booking", "scheduling", "availability"],
    heroOverline: "Booking + Scheduling",
    sections: [
      {
        heading: "Two sides of availability",
        paragraphs: [
          "Client-facing slots must reflect internal staffing. If the systems are separate, clients can book time that no one can cover--or staff get scheduled over existing appointments.",
        ],
      },
      {
        heading: "How Schedulaa links them",
        paragraphs: [
          "Client booking uses the same availability managers set for shifts, PTO, and break rules. Master calendars stay accurate, and staff aren't overworked by surprise bookings.",
        ],
      },
      {
        heading: "Better for everyone",
        paragraphs: [
          "Clients get reliable confirmations. Staff see realistic workloads. Managers plan capacity with confidence and export accurate hours to payroll.",
        ],
      },
    ],
  },
  {
    slug: "quickbooks-xero-integration",
    title: "How QuickBooks/Xero Integration Saves Hours of Accountant Cleanup Every Month",
    description:
      "Clean exports beat manual cleanup. Map accounts once, keep an audit trail, and hand accountants usable data.",
    datePublished: "2025-03-10",
    dateModified: "2025-03-10",
    category: "Accounting",
    tags: ["accounting", "quickbooks", "xero"],
    heroOverline: "Accounting",
    sections: [
      {
        heading: "Why accountants waste time",
        paragraphs: [
          "Scheduling and time tools often export messy data. Accountants spend hours cleaning CSVs before posting to QuickBooks or Xero.",
        ],
      },
      {
        heading: "What Schedulaa provides today",
        paragraphs: [
          "- Hours, tips, and deductions export cleanly for import into QuickBooks or Xero.",
          "- Account/ledger mappings in settings so exports land in the right buckets.",
          "- Audit trails for approvals, so finance trusts the numbers.",
          "It's intentionally light-touch: exports and mappings, not deep bi-directional sync.",
          "For teams that need deeper analysis, Schedulaa also exposes detailed per-employee payroll rows, timeclock punches, and break events via Zapier. The payroll.details event streams the same data you see in Payroll → Payroll Detail / Raw Data into Google Sheets, Excel, BI tools, or custom accounting workflows—while QuickBooks/Xero remain the system of record for journals.",
        ],
      },
      {
        heading: "Result: less cleanup",
        paragraphs: [
          "When ops data is accurate and exports are mapped, accountants spend less time fixing files and more time closing the books.",
        ],
      },
    ],
  },
  {
    slug: "canada-us-payroll-one-system",
    title: "One System for Canadian and U.S. Payroll: CPP/EI and FICA in a Single Workflow",
    description:
      "How Schedulaa runs Canada (ex-Québec) and U.S. payroll in one Operations OS, with scheduling and time tracking as the source of truth.",
    datePublished: "2025-03-11",
    dateModified: "2025-03-11",
    category: "Payroll",
    tags: ["payroll", "canada", "usa", "compliance"],
    heroOverline: "Cross-border payroll",
    sections: [
      {
        heading: "Why cross-border payroll usually hurts",
        paragraphs: [
          "Teams often juggle one tool for Canadian payroll, another for U.S. payroll, plus separate scheduling/time systems and spreadsheets in between. Results: inconsistent tax rules, remote-worker confusion, and no single view of labor cost.",
        ],
      },
      {
        heading: "How Schedulaa keeps two engines in one OS",
        paragraphs: [
          "Employee profiles store country and work location. Payroll Preview loads the correct engine automatically: CPP/EI/BPA with ROE/T4 for Canada (ex-Québec) and IRS/FICA/state logic with W-2 for the U.S. You approve shifts and leave once; the right rules apply per employee.",
        ],
      },
      {
        heading: "Canadian coverage (ex-Québec)",
        paragraphs: [
          "Federal/provincial tax, CPP (with exemptions), EI (with exemptions), vacation/stat holiday pay, BPA with YTD tracking, T4 boxes 14/16/18/22/24/26/40/44, and ROE exports.",
        ],
      },
      {
        heading: "U.S. coverage",
        paragraphs: [
          "Federal income tax, state income tax, FICA (Social Security + Medicare), SUI/SUTA, and W-2 generation. Local/city taxes are not automated.",
        ],
      },
      {
        heading: "Remote workers & examples",
        paragraphs: [
          "Engines follow where staff work: an Ontario stylist runs on CPP/EI; a Texas agent runs on federal + FICA with no state tax. Schedulaa handles mixed teams without duplicate setups.",
          "Links: /payroll, /payroll/canada, /payroll/usa",
        ],
      },
    ],
  },
  {
    slug: "salon-spa-payroll-canada-us",
    title: "Salon & Spa Payroll in Canada and the U.S. (Without Spreadsheets)",
    description:
      "Tips, commissions, shift premiums, vacation, CPP/EI, and FICA handled in one flow for beauty teams.",
    datePublished: "2025-03-12",
    dateModified: "2025-03-12",
    category: "Payroll",
    tags: ["payroll", "salon", "spa", "beauty"],
    heroOverline: "Beauty payroll",
    sections: [
      {
        heading: "Why salons struggle with payroll",
        paragraphs: [
          "Variable hours, tips/commissions, multiple rates, weekend premiums, vacation/holiday rules, and cross-border teams make spreadsheets brittle.",
        ],
      },
      {
        heading: "Schedulaa’s beauty-focused flow",
        paragraphs: [
          "Approved shifts bring regular/OT/holiday hours, breaks, and paid vs unpaid leave. Tips, commissions, and bonuses are first-class taxable earnings. Shift premium is its own field. Non-taxable reimbursements stay out of gross.",
        ],
      },
      {
        heading: "Canada (ex-Québec)",
        paragraphs: [
          "Vacation %, stat holiday pay, CPP/EI (with exemptions), BPA, T4 boxes 14/16/18/22/24/26/40/44, ROE exports.",
        ],
      },
      {
        heading: "United States",
        paragraphs: [
          "Federal + state tax, FICA, SUI/SUTA, W-2 exports. Local/city taxes not automated (rare in most salons).",
        ],
      },
      {
        heading: "Example and next steps",
        paragraphs: [
          "Stylists in Toronto and Miami can be paid from one pipeline: shifts → tips/commission/premiums → CPP/EI or FICA → payslip → T4/W-2.",
          "CTA: /payroll",
        ],
      },
    ],
  },
  {
    slug: "shift-premiums-tips-union-dues",
    title: "Shift Premiums, Tips, and Union Dues: Paying Service Teams Fairly in Schedulaa",
    description:
      "Why extras like tips, shift premiums, and union dues need first-class fields instead of “other” buckets.",
    datePublished: "2025-03-13",
    dateModified: "2025-03-13",
    category: "Payroll",
    tags: ["payroll", "tips", "union", "shift-premium"],
    heroOverline: "Service payroll",
    sections: [
      {
        heading: "Why hourly-only breaks in real life",
        paragraphs: [
          "Night/weekend premiums, tips, commissions, and union dues are everyday realities for service teams. Hiding them in generic boxes hurts audits and morale.",
        ],
      },
      {
        heading: "Shift premium as a first-class earning",
        paragraphs: [
          "Enter the premium total; Schedulaa treats it as taxable, in gross, and in T4/W-2 wages. Staff see it clearly on payslips.",
        ],
      },
      {
        heading: "Tips, commissions, bonuses",
        paragraphs: [
          "Tips flow into gross and W-2/T4 wages. Commission and bonuses stay separate for reporting clarity but are fully taxable.",
        ],
      },
      {
        heading: "Union dues and simple garnishments",
        paragraphs: [
          "Union dues reduce net and map to T4 Box 44. Simple garnishments are flat deductions; remittance stays external by design.",
        ],
      },
      {
        heading: "Allowances vs reimbursements",
        paragraphs: [
          "Travel/allowances are taxable. Non-taxable reimbursements (headsets, uniforms) stay out of gross and are added only to net pay.",
        ],
      },
      {
        heading: "See it in Schedulaa",
        paragraphs: [
          "Use the in-app payroll help/scenarios to see how each field behaves.",
          "Links: /payroll, /docs#payroll",
        ],
      },
    ],
  },
  {
    slug: "roe-t4-w2-year-end-guide",
    title: "ROE, T4, and W-2 in Plain English: A Year-End Guide for Service Businesses",
    description:
      "What ROE, T4, and W-2 mean, and how Schedulaa builds them from finalized payroll without extra spreadsheets.",
    datePublished: "2025-03-14",
    dateModified: "2025-03-14",
    category: "Year-end",
    tags: ["payroll", "roe", "t4", "w2", "year-end"],
    heroOverline: "Year-end",
    sections: [
      {
        heading: "What these forms are",
        paragraphs: [
          "ROE: insurable earnings/hours for Service Canada. T4: CRA slip for Canadian income/CPP/EI/tax/benefits/union dues. W-2: IRS/SSA slip for U.S. wages and taxes.",
        ],
      },
      {
        heading: "Built from FinalizedPayroll",
        paragraphs: [
          "Schedulaa uses finalized runs (hours, tips, premiums, benefits, union dues) to fill ROE/T4/W-2. No retyping.",
        ],
      },
      {
        heading: "Sanity-check before exporting",
        paragraphs: [
          "Review insurable/pensionable earnings, union dues, and taxable benefits in payroll detail. Use the validators in the ROE/T4/W-2 tools.",
        ],
      },
      {
        heading: "Where to generate",
        paragraphs: [
          "Use /payroll/tools for ROE/T4/W-2 exports.",
        ],
      },
    ],
  },
  {
    slug: "call-center-payroll-night-shifts",
    title: "Call Center Payroll: Night Shifts, Overtime, and Remote Agents in Schedulaa",
    description:
      "How to pay call center teams with night premiums, overtime, union dues, garnishments, and remote tax rules.",
    datePublished: "2025-03-15",
    dateModified: "2025-03-15",
    category: "Payroll",
    tags: ["payroll", "call-center", "overtime", "remote-work"],
    heroOverline: "Call center",
    sections: [
      {
        heading: "Why call centers struggle",
        paragraphs: [
          "Night/overnight coverage, overtime, remote staff in multiple states/provinces, and occasional union/garnishment needs make payroll messy without an operations-first system.",
        ],
      },
      {
        heading: "Scheduling + time = source of truth",
        paragraphs: [
          "Schedulaa uses approved shifts to split regular vs OT and track breaks. Shift premiums, tips, and commissions are layered in as taxable earnings.",
        ],
      },
      {
        heading: "Deductions and remittances",
        paragraphs: [
          "Union dues reduce net and map to T4 Box 44 for Canadian agents. Garnishments are flat deductions; remittance remains external.",
        ],
      },
      {
        heading: "Remote agents",
        paragraphs: [
          "Taxes follow the agent’s work location: U.S. federal + state + FICA, or Canadian federal/provincial with CPP/EI. Local/city taxes are not automated.",
        ],
      },
      {
        heading: "Links",
        paragraphs: [
          "See U.S.: /payroll/usa. See Canada: /payroll/canada.",
        ],
      },
    ],
  },
  {
    slug: "non-taxable-reimbursements-vs-allowances",
    title: "Non-Taxable Reimbursements vs Allowances: Paying Staff Back the Right Way",
    description:
      "Avoid over-taxing staff by separating taxable allowances from true reimbursements in Schedulaa.",
    datePublished: "2025-03-16",
    dateModified: "2025-03-16",
    category: "Payroll",
    tags: ["payroll", "reimbursement", "allowance", "tax"],
    heroOverline: "Reimbursements",
    sections: [
      {
        heading: "Allowances vs reimbursements",
        paragraphs: [
          "Allowances (per diems, stipends) are taxable and belong in gross. True reimbursements (receipt-backed expenses) should not increase taxable income.",
        ],
      },
      {
        heading: "How Schedulaa treats allowances",
        paragraphs: [
          "Use Travel Allowance or shift premium/bonus for taxable extras. They flow into gross pay, CPP/EI or FICA bases, and T4/W-2 wages.",
        ],
      },
      {
        heading: "How Schedulaa treats reimbursements",
        paragraphs: [
          "Use Non-taxable Reimbursement for equipment, uniforms, or travel receipts. It does not increase gross or taxes; it is added to net pay only.",
        ],
      },
      {
        heading: "Practical examples",
        paragraphs: [
          "Headsets, uniforms, towels/consumables, parking, small tools. Pay them back without inflating taxable income.",
        ],
      },
      {
        heading: "Links",
        paragraphs: [
          "/payroll, /docs#payroll",
        ],
      },
    ],
  },
  {
    slug: "schedulaa-vs-gusto",
    title: "Schedulaa vs Gusto: When You Need Operations + Payroll, Not Just HR",
    description:
      "Compare an operations-first platform with scheduling/time tracking + cross-border payroll to a U.S.-only payroll/HR provider.",
    datePublished: "2025-03-17",
    dateModified: "2025-03-17",
    category: "Comparison",
    tags: ["comparison", "gusto", "payroll", "operations"],
    heroOverline: "Comparisons",
    sections: [
      {
        heading: "What Gusto does well",
        paragraphs: [
          "U.S. payroll with broad state/local coverage, HR workflows, and benefits marketplace.",
        ],
      },
      {
        heading: "What Schedulaa does differently",
        paragraphs: [
          "Operations-first OS with scheduling, time tracking, tips, shift premium, union dues, simple garnishments, non-taxable reimbursements, and Canada (ex-Québec) + U.S. payroll engines.",
        ],
      },
      {
        heading: "When to choose Schedulaa",
        paragraphs: [
          "Service teams across Canada/U.S. that need shifts, hours, and payroll in one flow; branded portals; ROE/T4/W-2 exports.",
        ],
      },
      {
        heading: "When to choose Gusto",
        paragraphs: [
          "U.S.-only companies that prioritize deep HR and benefits and already use a separate scheduling tool.",
        ],
      },
      {
        heading: "Links",
        paragraphs: [
          "/compare/gusto, /payroll",
        ],
      },
    ],
  },
];

export default blogPosts;
