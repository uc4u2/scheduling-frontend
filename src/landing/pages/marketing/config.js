const BASE_URL = "https://www.schedulaa.com";
const REGISTER_URL = "/register";

const marketingCta = {
  overline: "Ready when you are",
  title: "Launch your next campaign and monitor the results",
  body: "Schedulaa keeps your campaigns, segments, analytics, and exports in one workflow so your team can move fast.",
  primary: { label: "Start a campaign", href: REGISTER_URL },
  secondary: { label: "Log in", href: "/login" },
};

const marketingSecondaryLinks = [
  { label: "Client exports overview", href: "/marketing/clients-360#exports" },
  { label: "View booking features", href: "/booking" },
  { label: "Website builder", href: "/website-builder" },
];

export const marketingPages = {
  hub: {
    meta: {
      title: "Marketing & Analytics for Service Businesses – Campaigns, Segments & KPIs | Schedulaa",
      description:
        "Run targeted email campaigns (win-back, VIP, no-show recovery), export client lists, and track KPIs with Advanced Analytics. Segments like VIP, At-Risk, Dormant and Client 360° built-in.",
      canonical: `${BASE_URL}/marketing`,
      og: {
        title: "Marketing & Analytics for Service Businesses | Schedulaa",
        description:
          "Launch campaigns, auto-build segments, export clients, and monitor KPIs with Advanced Analytics.",
        image: `${BASE_URL}/images/marketing-hub-preview.png`,
        url: `${BASE_URL}/marketing`,
      },
      twitter: {
        card: "summary_large_image",
        title: "Marketing & Analytics for Service Businesses | Schedulaa",
        description:
          "Schedulaa unifies campaigns, lifecycle segments, client exports, and enterprise analytics.",
        image: `${BASE_URL}/images/marketing-hub-preview.png`,
      },
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Schedulaa Marketing & Analytics",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Targeted campaigns, lifecycle segments, client exports, and enterprise analytics for service businesses.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
      url: `${BASE_URL}/marketing`,
    },
    hero: {
      badge: "Lifecycle & KPIs",
      title: "Marketing & Analytics — Grow, retain, and understand your clients",
      subtitle:
          "Schedulaa gives you turnkey campaigns, client exports, lifecycle segments, and an Advanced Analytics suite. Launch win-backs, VIP perks, anniversary notes, and more — then monitor bookings, revenue, no-shows, rebook rates, tip performance, and client value.",
      points: [
        "Prebuilt campaigns for win-back, VIP, anniversary, new service launch, and more.",
        "Lifecycle segments with tunable thresholds (VIP, Loyal, New, Active, At-Risk, Lost).",
        "Enterprise analytics covering bookings, revenue, retention, tips, and card-on-file performance.",
      ],
      primaryCta: { label: "Start a campaign", href: REGISTER_URL },
      secondaryCta: { label: "Log in", href: "/login" },
    },
    sections: [
      {
        overline: "Campaigns",
        title: "Campaigns you can launch today",
        body:
          "Use prebuilt flows with smart limits, segment filters, coupon prefixes, and expiry windows. Every campaign supports dry-run testing and per-recipient limits.",
        points: [
          "Broadcast announcements for closures, holiday hours, or policy updates.",
          "Win-Back targets clients whose days since last visit exceed 1.5× their norm.",
          "Skipped Rebook Nudge follows up when clients skip rebooking after a visit.",
          "VIP perks for top 10% clients with custom coupons and deep links.",
          "Anniversary thank-you notes based on first-visit month.",
          "New Service Launch campaigns for clients who haven’t tried a new offer.",
          "No-Show Recovery and Add-on Upsell sequences with optional discounts.",
        ],
        buttons: [
          { label: "See campaign builder", href: "/marketing/email-campaigns" },
        ],
      },
      {
        overline: "Segments",
        title: "Lifecycle segments ready to use",
        body:
          "Keep retention efforts focused with lifecycle cohorts. Adjust thresholds per cohort to match your business cadence.",
        points: [
          "VIP top % (e.g., 10%), Loyal (min visits ≥ 5), New (≤ 30 days), Active (≤ 90 days).",
          "At-Risk: 1.5× personal gap since last visit; Lost > 180 days inactive.",
          "Segments feed campaigns, analytics, and exports automatically.",
        ],
        buttons: [
          { label: "Explore Client 360°", href: "/marketing/clients-360" },
        ],
      },
    ],
    lists: [
      {
        overline: "Enterprise analytics",
        title: "Highlights from the analytics suite",
        intro:
          "Filter by date range, timezone, and grouping (day/week/month). Refresh in seconds to keep leadership dashboards current.",
        items: [
          {
            icon: "analytics",
            label: "KPIs",
            title: "Core metrics",
            body:
              "Appointments, cancellations, no-shows (rate), active clients, average lead time and ticket. Revenue metrics include gross, tips, refunds, net, and new vs returning mix.",
          },
          {
            icon: "timeline",
            label: "Mix & trends",
            title: "Mixes and trends",
            body:
              "Day-of-week and hour-of-day mix, lifetime value percentiles (P50/P75/P90/P99), bookings and revenue trendlines, provider utilization, and top services by revenue.",
          },
          {
            icon: "insights",
            label: "Reliability",
            title: "Reliability & retention",
            body:
              "Show-up reliability, rebook rates (30/60/90 days), average rebook interval, cancellation window distribution, schedule stability, refunds, and card-on-file success.",
          },
        ],
      },
    ],
    highlights: [
      {
        overline: "Client intelligence",
        title: "Client 360° and geo-insights",
        content:
          "Filter by department and employee, search by name/email/phone, and open a 360 panel with geo/IP, devices, booking behavior, messaging history, and per-client KPIs.",
        actions: [
          { label: "Open Client 360°", href: "/marketing/clients-360", variant: "outlined" },
        ],
      },
      {
        overline: "Exports",
        title: "Export clients to CSV in seconds",
        content:
          "Export company-scoped client lists with filters (seen in last N days, minimum visits, require email, limit). Ideal for external CRM or ad platforms.",
        actions: [
          { label: "See export workflow", href: "/marketing/clients-360#exports", variant: "contained" },
        ],
      },
    ],
    faqHeading: "FAQ",
    faqTitle: "Marketing & Analytics questions",
    faqIntro: "Answers based on the campaigns and analytics shipping in Schedulaa today.",
    faq: [
      {
        question: "Can I limit campaign recipients?",
        answer:
          "Yes. Every campaign supports a Limit field so you can cap how many clients receive the message. Use dry-run to review the list before sending.",
      },
      {
        question: "How do lifecycle segments update?",
        answer:
          "Segments refresh automatically using your booking history. Adjust parameters like VIP percentage or at-risk multiplier to fit your business cadence.",
      },
      {
        question: "Can I export analytics data?",
        answer:
          "Advanced Analytics includes CSV exports for key views, and you can export client cohorts separately using the client export tool.",
      },
    ],
    cta: marketingCta,
    secondaryLinks: marketingSecondaryLinks,
  },
  campaigns: {
    meta: {
      title: "Email Campaigns – Win-Back, VIP, No-Show & Upsell | Schedulaa",
      description:
        "Prebuilt campaigns with filters, coupon prefixes, expiry windows, and deep links to boost rebook and revenue.",
      canonical: `${BASE_URL}/marketing/email-campaigns`,
      og: {
        title: "Email Campaigns for Service Businesses | Schedulaa",
        description:
          "Launch win-back, VIP, no-show recovery, and add-on upsell campaigns with smart filters, coupons, and expiries.",
        image: `${BASE_URL}/images/marketing-campaigns-preview.png`,
        url: `${BASE_URL}/marketing/email-campaigns`,
      },
      twitter: {
        card: "summary_large_image",
        title: "Email Campaigns for Service Businesses | Schedulaa",
        description:
          "Schedulaa gives you ready-made campaigns with coupon prefixes, expiry windows, and deep links.",
        image: `${BASE_URL}/images/marketing-campaigns-preview.png`,
      },
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Schedulaa Marketing Campaigns",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Email campaigns for win-back, VIP, no-show recovery, add-on upsell, and more.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
      url: `${BASE_URL}/marketing/email-campaigns`,
    },
    hero: {
      badge: "Campaign builder",
      title: "Email Campaigns that bring clients back",
      subtitle:
        "Choose a prebuilt strategy, tweak filters, and press send. Every campaign supports limits, coupon prefixes, expiry windows, valid-days, and deep links to your booking pages.",
      primaryCta: { label: "Start a campaign", href: REGISTER_URL },
      secondaryCta: { label: "Return to marketing hub", href: "/marketing" },
    },
    sections: [
      {
        overline: "Compliance",
        title: "Respect consent and deliver reliably",
        body:
          "Every send automatically includes unsubscribe and preferences links. Turn on Send only to consented contacts in Settings to stay aligned with GDPR/CASL and verify SPF/DKIM/DMARC on your sending domain for best inbox placement.",
        points: [
          "Configure From/Reply-To once per company.",
          "Monitor DNS verification status directly in Settings.",
        ],
      },
      {
        overline: "Quality controls",
        title: "Preview, throttle, and QA before you send",
        body:
          "Use Preheader text to boost opens, seed list emails for QA, Send later scheduling, and throttling (e.g., 50 emails/minute) to keep deliverability healthy.",
        points: [
          "Changing any field clears previews—click Preview again before sending.",
          "Dry-run logs would-send counts without emailing anyone.",
          "Send Selected/All works on the rows currently previewed.",
          "Emails don’t create coupons—enable matching codes in Marketing → Coupons first.",
        ],
      },
    ],
    lists: [
      {
        overline: "Campaign strategies",
        title: "Every campaign covers a specific use case",
        columns: 2,
        items: [
          {
            icon: "campaign",
            label: "Broadcast",
            title: "Broadcast (Simple Announcement)",
            body:
              "Update everyone or filtered segments with subject, heading, intro, and optional button (e.g., View details → /services). Ideal for closures, holiday hours, or policy updates.",
            points: [
              "Optional coupon and expiry window.",
              "Button/link text and URL configurable.",
            ],
          },
          {
            icon: "campaign",
            label: "Win-back",
            title: "Win-Back (Likely to Lapse)",
            body:
              "Targets clients whose days since last visit ≥ 1.5× their normal gap. Add discount %, set valid days or an expiry date, limit recipients, define coupon prefix (e.g., WINBACK), and link to /book.",
          },
          {
            icon: "campaign",
            label: "Rebook",
            title: "Skipped Rebook Nudge",
            body:
              "Follows up a few days after a kept visit when the client skipped rebook. Optional discount %, coupon prefix (REBOOK), expiry date, and deep link /rebook.",
          },
          {
            icon: "campaign",
            label: "VIP",
            title: "VIP (Top Clients)",
            body:
              "Rewards top 10% by LTV. Include discount %, limit, coupon prefix (VIP), expiry override, and VIP landing link /vip.",
          },
          {
            icon: "campaign",
            label: "Anniversary",
            title: "Anniversary Thank-You",
            body:
              "Celebrate first-visit month (e.g., Month 11). Set limit, coupon prefix (ANNIV), expiry override, and CTA /book. Works with date range and email filters.",
          },
          {
            icon: "campaign",
            label: "Launch",
            title: "New Service Launch",
            body:
              "Announce a new service to clients who haven’t tried it. Choose lookback window, discount %, coupon prefix (NEW), limit, and deep link /services.",
          },
          {
            icon: "campaign",
            label: "Recovery",
            title: "No-Show Recovery",
            body:
              "Reach recent no-shows. Filter by required no future booking or fee charged. Add discount %, coupon prefix (RECOVER), expiry, landing /.",
          },
          {
            icon: "campaign",
            label: "Upsell",
            title: "Add-on Upsell",
            body:
              "Offer a popular add-on to clients of a base service. Set lookback days, discount %, coupon prefix (ADDON), expiry, and link /services.",
          },
        ],
      },
    ],
    highlights: [
      {
        overline: "Safety controls",
        title: "Dry-run and recipient limits included",
        content:
          "Run a dry-run to preview every recipient and message before going live. Daily send caps and Limit fields prevent over-sending, and seed lists keep stakeholders in the loop.",
      },
    ],
    cta: marketingCta,
    secondaryLinks: marketingSecondaryLinks,
  },
  analytics: {
    meta: {
      title: "Advanced Analytics – Bookings, Revenue, No-Shows & Client Value | Schedulaa",
      description:
        "Full KPI suite with trends, leaderboards and retention metrics. Tune segments and filter by date, timezone and grouping.",
      canonical: `${BASE_URL}/marketing/analytics-dashboard`,
      og: {
        title: "Advanced Analytics Dashboard | Schedulaa",
        description:
          "Track bookings, revenue, no-shows, retention, tip performance, and utilization with Advanced Analytics.",
        image: `${BASE_URL}/images/marketing-analytics-preview.png`,
        url: `${BASE_URL}/marketing/analytics-dashboard`,
      },
      twitter: {
        card: "summary_large_image",
        title: "Advanced Analytics Dashboard | Schedulaa",
        description:
          "Schedulaa's analytics suite covers KPIs, retention, leaderboards, coupon performance, and more.",
        image: `${BASE_URL}/images/marketing-analytics-preview.png`,
      },
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
  name: "Schedulaa Advanced Analytics",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Analytics for bookings, revenue, retention, utilization, and client value.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
      url: `${BASE_URL}/marketing/analytics-dashboard`,
    },
    hero: {
  badge: "Advanced analytics",
  title: "Advanced Analytics — KPIs, trends, and insights",
      subtitle:
        "Pick a date range, timezone, and grouping (day/week/month). Refresh to track bookings, revenue, no-shows, tip performance, card-on-file success, and client value.",
      primaryCta: { label: "Explore analytics", href: REGISTER_URL },
      secondaryCta: { label: "Return to marketing hub", href: "/marketing" },
    },
    sections: [
      {
        overline: "Filters",
        title: "Date, timezone, and grouping filters",
        body:
          "Choose From/To dates, set your timezone (e.g., America/Toronto), and group metrics by day, week, or month. Click Refresh to rebuild the dashboard.",
      },
    ],
    lists: [
      {
        overline: "Metrics",
        title: "Key metrics at a glance",
        items: [
          {
            icon: "analytics",
            label: "Core KPIs",
            title: "Appointments & revenue",
            body:
              "Appointments, cancellations, no-shows (rate), active clients, average lead time, average ticket, gross, tips, refunds, net, and new vs returning.",
          },
          {
            icon: "timeline",
            label: "Mix",
            title: "Mix & distributions",
            body:
              "Day-of-week mix, hour-of-day mix, and lifetime value percentiles (P50/P75/P90/P99).",
          },
          {
            icon: "insights",
            label: "Leaders",
            title: "Leaderboards & effectiveness",
            body:
              "Bookings and revenue trends, provider utilization, top services by revenue, tip leaderboard (payroll-ready), and coupon effectiveness.",
          },
          {
            icon: "insights",
            label: "Retention",
            title: "Reliability & retention",
            body:
              "Show-up reliability, rebook rates (30/60/90 days), average rebook interval, cancellation window distribution, schedule stability, refund rate, card-on-file attempts/success.",
          },
          {
            icon: "lifecycle",
            label: "Segments",
            title: "Lifecycle scan",
            body:
              "VIP, Loyal, New, Active, At-Risk, and Lost segments with tunable thresholds (VIP top %, Loyal min visits, Active ≤ 90 days, Lost > 180 days, At-Risk multiplier 1.5× personal gap).",
          },
        ],
      },
    ],
    cta: marketingCta,
    secondaryLinks: marketingSecondaryLinks,
  },
  clients360: {
    meta: {
      title: "Client 360° & Exports – Segments, Geo-Insights & CSV | Schedulaa",
      description:
        "Search clients, open a 360 panel with geo and behavior, and export CSV with powerful filters for campaigns and reporting.",
      canonical: `${BASE_URL}/marketing/clients-360`,
      og: {
        title: "Client 360° & Exports | Schedulaa",
        description:
          "Filter by department/employee, open 360° insights, and export CSV with filters (seen in last N days, min visits, require email, limit).",
        image: `${BASE_URL}/images/marketing-clients360-preview.png`,
        url: `${BASE_URL}/marketing/clients-360`,
      },
      twitter: {
        card: "summary_large_image",
        title: "Client 360° & Exports | Schedulaa",
        description:
          "Schedulaa gives you client 360° views, lifecycle segments, and CSV exports with advanced filters.",
        image: `${BASE_URL}/images/marketing-clients360-preview.png`,
      },
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Schedulaa Client 360° & Exports",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Client 360° insights, lifecycle segments, and CSV exports.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
      url: `${BASE_URL}/marketing/clients-360`,
    },
    hero: {
      badge: "Client intelligence",
      title: "Client 360° & Exports",
      subtitle:
        "Find clients by department or employee, search by name/email/phone, open a 360° panel with geo insights, and export CSVs with advanced filters.",
      primaryCta: { label: "Open Client 360°", href: "/marketing/clients-360" },
      secondaryCta: { label: "Return to marketing hub", href: "/marketing" },
    },
    sections: [
      {
        overline: "Find a client",
        title: "Search and open insights instantly",
        body:
          "Scope by department → employee, search name/email/phone, and open a 360° panel for geo/IP, device, booking behavior, messaging history, and client KPIs.",
      },
      {
        overline: "Segments overview",
        title: "Lifecycle segments with parameters",
        body:
          "Scan clients as-of a date with Require Email, Limit, and parameters (min_visits, default_gap_days, at_risk_multiplier, dormant_days, new_days, habitual_min_visits, habitual_avg_gap_max, vip_pct). See examples per cohort.",
      },
      {
        overline: "CSV exports",
        title: "Company-scoped exports with filters",
        body:
          "Export clients to CSV with filters: seen in last N days (blank = all), min visits, require email toggle, and limit. Ideal for external marketing tools.",
        id: "exports",
      },
    ],
    cta: marketingCta,
    secondaryLinks: marketingSecondaryLinks,
  },
};
