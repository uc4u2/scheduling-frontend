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
];

export default blogPosts;
