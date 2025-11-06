// src/components/website/BuilderBlockTemplates.js
export const NEW_BLOCKS = {
  
  hero: () => ({
    type: "hero",
    props: {
      heading: "Relax. Recharge. Renew.",
      subheading: "Personalized spa treatments for body and mind.",
      ctaText: "Book now",
      ctaLink: "?page=services-classic",
      backgroundUrl:
       "https://images.unsplash.com/photo-1556229010-aa3f7ff66c6e?q=80&w=1200&auto=format&fit=crop",
       backgroundPosition: "center",
     overlay: 0.28

    },
  }),
  text: () => ({
    type: "text",
    props: {
      title: "About us",
      body:
        "Write a short introduction here. You can talk about your values, your team, and what makes you different.",
    },
  }),
  gallery: () => ({
    type: "gallery",
    props: {
      title: "Our work",
      images: [
        "https://images.unsplash.com/photo-1519827119039-d53d2d2a4389?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
      ],
    },
  }),
  galleryCarousel: () => ({
    type: "galleryCarousel",
    props: {
      title: "Highlights",
      autoplay: true,
      intervalMs: 3500,
      images: [
        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?q=80&w=1200&auto=format&fit=crop",
      ],
    },
  }),
  logoCarousel: () => ({
    type: "logoCarousel",
    props: {
      title: "Trusted by teams like",
      logos: [
        { label: "Photo Artisto" },
        { label: "Urban Brush" },
        { label: "Studio Bloom" },
      ],
      intervalMs: 3500,
      showDots: true,
    },
  }),
  featurePillars: () => ({
    type: "featurePillars",
    props: {
      title: "Choose your command center",
      caption: "Connect scheduling, payroll, and commerce with one dashboard.",
      layout: "dense",
      maxWidth: "xl",
      badge: "Why teams upgrade",
      card: {
        padding: 24,
        gap: 12,
        radius: 24,
        gridGap: 32,
        iconSize: 48,
        surface: "rgba(255,255,255,0.92)",
        hoverSurface: "rgba(255,255,255,1)",
        shadow: "0 16px 40px rgba(15,23,42,0.18)",
        ringColor: "rgba(15,23,42,0.08)",
        badgeBg: "rgba(37,99,235,0.12)",
        badgeColor: "#2563eb",
        badgeSurface: "rgba(37,99,235,0.12)",
        badgeText: "rgba(37,99,235,0.95)",
        iconBg: "rgba(37,99,235,0.12)",
        iconColor: "#2563eb",
        chipBg: "rgba(191,219,254,0.45)",
        chipColor: "#1d4ed8",
        chipBorder: "rgba(37,99,235,0.35)",
        sectionBackground: "linear-gradient(90deg, #2DC8FF 0%, #2FE6C8 100%)"
      },
      pillars: [
        {
          icon: "S",
          label: "Scheduling",
          heading: "Smarter scheduling",
          summary: "Templates, availability, and booking flows that embed anywhere.",
          bullets: [
            "Availability rules with cooldown buffers",
            "Self-serve reschedules and cancellations",
            "Shift swaps and compliance approvals",
          ],
          metrics: [
            { label: "Recurring slots", value: "Yes" },
            { label: "Calendar accuracy", value: "99.7%" },
            { label: "Multi-provider", value: "Live" },
          ],
        },
        {
          icon: "P",
          label: "Payroll",
          heading: "Payroll without spreadsheets",
          summary: "Automate cross-region pay, overtime, and taxes with audit-ready exports.",
          bullets: [
            "US & Canada filing exports built-in",
            "Auto-calculate OT, premiums, and tips",
            "Employee self-serve updates and payslips",
          ],
          metrics: [
            { label: "Regions", value: "45 US + CA" },
            { label: "Accuracy", value: "99.8%" },
            { label: "Time saved", value: "-72%" },
          ],
        },
        {
          icon: "C",
          label: "Commerce",
          heading: "Commerce that converts",
          summary: "Sell services, memberships, and products with Stripe-powered checkout.",
          bullets: [
            "Mixed carts with add-ons and gift cards",
            "Automatic and partial refunds with tips",
            "Inventory and analytics synced globally",
          ],
          metrics: [
            { label: "Stripe uptime", value: "99.99%" },
            { label: "Refund automation", value: "Enabled" },
            { label: "Catalog", value: "Unlimited" },
          ],
        },
      ],
    },
  }),
featureStories: () => ({
  type: "featureStories",
  props: {
    title: "Command centers for every crew",
    caption: "Preview the scheduling, payroll, and commerce hubs teams activate on day one.",
    badge: "Why teams upgrade",
    legend: ["Scheduling", "Payroll", "Commerce"],
    stories: [
      {
        icon: "📅",
        title: "Scheduling Ops",
        description: "Layer templates, availability rules, and auto-buffering into one connected calendar.",
        bullets: [
          "Availability rules with cooldown buffers",
          "Clients reschedule/cancel without calling",
          "Shift swaps, leave, compliance approvals",
        ],
        statLabel: "Calendar accuracy",
        statValue: "99.7%",
        feature: "Scheduling",
        ctaText: "View playbook",
        ctaLink: "/scheduling"
      },
      {
        icon: "💸",
        title: "Payroll Control",
        description: "Automate cross-border pay, tips, and audits without spreadsheets or exports.",
        bullets: [
          "US & Canada filing exports (W-2, T4, ROE)",
          "Auto-calc OT, holiday premiums, tips",
          "Employee self-serve portals and updates",
        ],
        statLabel: "Payroll run time",
        statValue: "-72%",
        feature: "Payroll",
        ctaText: "See payroll",
        ctaLink: "/payroll"
      },
      {
        icon: "🛒",
        title: "Commerce Flows",
        description: "Bundle memberships, services, and digital offers in one checkout that syncs everywhere.",
        bullets: [
          "Mixed carts with add-ons and gift cards",
          "Automatic & partial refunds with tip payouts",
          "Inventory and analytics synced to calendars",
        ],
        statLabel: "Conversion lift",
        statValue: "+28%",
        feature: "Commerce",
        ctaText: "Explore commerce",
        ctaLink: "/commerce"
      }
    ],
    metrics: [
      "Scheduling automation · 48 playbooks",
      "Payroll jurisdictions · 45",
      "Average go-live · 12 days"
    ],
    legendAlign: "center",
    card: {
      padding: 24,
      radius: 16,
      gap: 32,
      maxWidth: 1160,
      sectionBackground: "linear-gradient(135deg, #1d4ed8 0%, #14b8a6 100%)",
      surface: "rgba(255,255,255,0.96)",
      borderColor: "rgba(15,23,42,0.12)",
      shadow: "0 16px 32px rgba(15,23,42,0.12)",
      headingColor: "#0f172a",
      bodyColor: "rgba(30,41,59,0.75)",
      badgeColor: "#2563eb",
      statColor: "#2563eb",
      chipBg: "rgba(37,99,235,0.12)",
      chipColor: "#1d4ed8",
      chipBorder: "rgba(37,99,235,0.28)"
    }
  }
}),
  testimonialTiles: () => ({
    type: "testimonialTiles",
    props: {
      title: "Teams scaling with Schedulaa",
      caption: "Enterprise operators replace stitched tools with one modern platform.",
      style: "grid",
      maxWidth: "xl",
      card: { padding: 16, gap: 10, radius: 18, avatarSize: 32 },
      testimonials: [
        {
          brand: "Photo Artisto",
          badge: "-3 tools",
          quote: "Schedulaa replaced three tools we glued together. Shifts, payroll, and booking now run from one place.",
          author: "UC Sam",
          role: "Founder, Photo Artisto",
        },
        {
          brand: "BeautyBar Collective",
          badge: "Launch in 1 day",
          quote: "I launch new stylists in a morning. Booking links, portfolios, and payroll are instantly in sync.",
          author: "Maya Chen",
          role: "Owner, BeautyBar Collective",
        },
        {
          brand: "TalentOps Collective",
          badge: "Payroll-ready",
          quote: "We onboard contractors, schedule interviews, and handle payroll without spreadsheets or manual exports.",
          author: "Liam Ortiz",
          role: "Talent Operations Manager",
        },
      ],
    },
  }),
  faq: () => ({
    type: "faq",
    props: {
      title: "Frequently asked questions",
      items: [
        { q: "How do I book?", a: "Use the Book button or call us." },
        { q: "Do you accept walk-ins?", a: "We recommend booking to guarantee a slot." },
      ],
    },
  }),
  serviceGrid: () => ({
    type: "serviceGrid",
    props: {
      title: "Popular services",
      subtitle: "Transparent pricing, expert care.",
      services: [
        { name: "Haircut", price: "$45", duration: "45m", description: "Classic or modern styles." },
        { name: "Color", price: "$95", duration: "90m", description: "Single process color." },
      ],
    },
  }),
  contact: () => ({
    type: "contact",
    props: {
      title: "Get in touch",
      intro: "Questions? We'd love to hear from you.",
      address: "123 Main St, Your City",
      phone: "+1 (555) 123-4567",
      email: "hello@example.com",
      mapEmbedUrl: "",
      showForm: false,
    },

    
  }),
  contactForm: () => ({
    type: "contactForm",
    props: {
      title: "Send a message",
      intro: "We typically reply within one business day.",
      formKey: "contact",
      fields: [
        { name: "name",    label: "Full name", required: true },
        { name: "email",   label: "Email",     required: true },
        { name: "phone",   label: "Phone" },
        { name: "subject", label: "Subject" },
        { name: "message", label: "Message",   required: true }
      ]
    }
  }),
  footer: () => ({
    type: "footer",
    props: {
      text: "© Your Company",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
      social: [
        { label: "Instagram", href: "https://instagram.com/" },
        { label: "Facebook", href: "https://facebook.com/" },
      ],
    },
  }),
};
