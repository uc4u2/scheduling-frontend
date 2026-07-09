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
  pricingTableModern: () => ({
    type: "pricingTable",
    props: {
      title: "Plans made simple",
      intro:
        "Choose a package or contact us for a tailored recommendation.",
      titleAlign: "center",
      maxWidth: "xl",
      layout: "logo-cards",
      plans: [
        {
          ribbon: "Starter",
          name: "Core service package",
          price: "From $249",
          features: [
            "Focused scope and planning",
            "Clear timeline and deliverables",
            "Best for straightforward bookings",
          ],
          ctaText: "Book now",
          ctaLink: "?page=services-classic",
        },
        {
          ribbon: "Most popular",
          name: "Signature package",
          price: "Custom quote",
          features: [
            "Expanded service coverage",
            "Priority scheduling and support",
            "Ideal for recurring or higher-touch work",
          ],
          ctaText: "Request a quote",
          ctaLink: "?page=request-quote",
          featured: true,
        },
        {
          ribbon: "Custom",
          name: "Project-based package",
          price: "Custom quote",
          features: [
            "Multi-step or specialty requests",
            "Built around your location or scope",
            "Best for larger or unique projects",
          ],
          ctaText: "Discuss the project",
          ctaLink: "?page=request-quote",
        },
      ],
    },
    sx: {
      py: 88,
      background:
        "linear-gradient(180deg, rgba(5,5,5,1) 0%, rgba(13,13,13,1) 100%)",
      color: "var(--page-heading-color, #ffffff)",
      position: "relative",
      overflow: "hidden",
      "& .MuiTypography-root": {
        color: "var(--page-heading-color, #ffffff)",
      },
      "& .MuiTypography-root.MuiTypography-body2": {
        color: "var(--page-body-color, #d4d0c8)",
      },
      "& .pricing-logo-grid": {
        position: "relative",
        paddingTop: "18px",
      },
      "& .pricing-logo-card": {
        background:
          "linear-gradient(180deg, rgba(28,28,28,0.96) 0%, rgba(12,12,12,0.98) 100%)",
        border: "1px solid rgba(196,155,99,0.22)",
        boxShadow: "0 26px 64px rgba(0,0,0,0.45)",
        borderRadius: 4,
        color: "#f8f4ec",
        padding: "42px 28px 30px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflow: "visible",
        backdropFilter: "blur(10px)",
      },
      "& .pricing-logo-card.featured": {
        background:
          "linear-gradient(180deg, rgba(38,30,20,0.98) 0%, rgba(15,15,15,1) 100%)",
        border: "1px solid rgba(196,155,99,0.58)",
      },
      "& .pricing-logo-ribbon": {
        fontSize: "0.72rem",
        letterSpacing: ".18em",
        textTransform: "uppercase",
        background: "linear-gradient(135deg, #c49b63, #e7c797)",
        padding: "7px 18px",
        borderRadius: 999,
        position: "absolute",
        top: "-18px",
        left: "50%",
        transform: "translateX(-50%)",
        color: "#151515",
        fontWeight: 700,
        zIndex: 3,
      },
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
      title: "Photo Gallery",
      titleAlign: "center",
      layout: "grid",
      columns: { xs: 2, sm: 2, md: 3 },
      gap: 18,
      tile: {
        aspectRatio: "4/5",
        borderRadius: 0,
        border: "1px solid rgba(255,255,255,0.35)",
        hoverLift: true
      },
      lightbox: {
        enabled: true,
        loop: true,
        showArrows: true,
        closeOnBackdrop: true
      },
      images: [
        { url: "https://images.unsplash.com/photo-1519827119039-d53d2d2a4389?q=80&w=800&auto=format&fit=crop", alt: "Gallery item 1" },
        { url: "https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?q=80&w=800&auto=format&fit=crop", alt: "Gallery item 2" },
        { url: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop", alt: "Gallery item 3" },
      ],
    },
  }),
  photoGallery: () => ({
    type: "gallery",
    props: {
      title: "Photo Gallery",
      titleAlign: "center",
      layout: "grid",
      columns: { xs: 2, sm: 2, md: 3 },
      gap: 18,
      tile: {
        aspectRatio: "4/5",
        borderRadius: 0,
        border: "1px solid rgba(255,255,255,0.35)",
        hoverLift: true
      },
      lightbox: {
        enabled: true,
        loop: true,
        showArrows: true,
        closeOnBackdrop: true
      },
      images: [
        { url: "/website/enterprise-automotive-autocare-nexus/gallery-01.jpg", alt: "Gallery item 1" },
        { url: "/website/enterprise-automotive-autocare-nexus/gallery-02.jpg", alt: "Gallery item 2" },
        { url: "/website/enterprise-automotive-autocare-nexus/gallery-03.jpg", alt: "Gallery item 3" },
        { url: "/website/enterprise-automotive-autocare-nexus/gallery-04.jpg", alt: "Gallery item 4" },
        { url: "/website/enterprise-automotive-autocare-nexus/gallery-05.jpg", alt: "Gallery item 5" },
        { url: "/website/enterprise-automotive-autocare-nexus/gallery-06.jpg", alt: "Gallery item 6" },
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
  heroCarousel: () => ({
    type: "heroCarousel",
    props: {
      align: "left",
      heroHeight: 72,
      overlay: 0.35,
      overlayColor: "#0f172a",
      brightness: -0.1,
      autoplay: true,
      intervalMs: 6000,
      slides: [
        {
          image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000&auto=format&fit=crop",
          backgroundPosition: "center",
          eyebrow: "Your studio",
          heading: "Tell your story with motion",
          subheading: "Rotate hero slides to highlight workshops, services, and products.",
          ctaText: "Book now",
          ctaLink: "?page=services-classic",
          secondaryCtaText: "Shop products",
          secondaryCtaLink: "?page=products",
        },
      ],
    },
  }),
  heroSplit: () => ({
    type: "heroSplit",
    props: {
      heading: "Real-time availability, without the back-and-forth",
      subheading:
        "Showcase a focused message with a clear CTA and a supporting image.",
      ctaText: "Get started",
      ctaLink: "?page=services-classic",
      image:
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1600&auto=format&fit=crop",
      titleAlign: "left",
      maxWidth: "lg",
    },
  }),
  videoStorySplit: () => ({
    type: "videoStorySplit",
    props: {
      followSiteTheme: true,
      eyebrow: "Watch the platform story",
      title: "See how Schedulaa runs in real life",
      body:
        "Use this section for a founder story, studio intro, or product walkthrough. Pair a YouTube video with supporting copy and one focused CTA without leaving the visual builder.",
      ctaText: "Learn more",
      ctaLink: "?page=about",
      videoUrl: "https://www.youtube.com/embed/y7kygIhnZm8",
      videoPosition: "left",
      mediaAspectRatio: "16 / 9",
      contentPadding: 48,
      maxWidth: "full",
      bleedLeft: true,
      bleedRight: true,
    },
  }),
  collectionShowcase: () => ({
    type: "collectionShowcase",
    props: {
      title: "Want to see more?",
      subtitle: "Browse more highlights and client favorites.",
      items: [
        {
          title: "Signature services",
          linkText: "Shop now",
          link: "?page=services-classic",
          image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop",
          imageAlt: "Signature services",
        },
        {
          title: "Best sellers",
          linkText: "Shop now",
          link: "?page=services-classic",
          image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1400&auto=format&fit=crop",
          imageAlt: "Best sellers",
        },
        {
          title: "Seasonal favorites",
          linkText: "Shop now",
          link: "?page=services-classic",
          image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1400&auto=format&fit=crop",
          imageAlt: "Seasonal favorites",
        },
        {
          title: "Gift cards",
          linkText: "Shop now",
          link: "?page=contact",
          image: "https://images.unsplash.com/photo-1495435229349-e86db7bfa013?q=80&w=1400&auto=format&fit=crop",
          imageAlt: "Gift cards",
        },
      ],
      perks: [
        {
          icon: "Fast",
          title: "Fast booking",
          subtitle: "Reserve in minutes",
        },
        {
          icon: "Flex",
          title: "Flexible options",
          subtitle: "Customizable plans",
        },
        {
          icon: "Secure",
          title: "Secure checkout",
          subtitle: "Trusted payments",
        },
        {
          icon: "Support",
          title: "Dedicated support",
          subtitle: "Here when you need us",
        },
      ],
      copyTitle: "Built for busy teams and loyal clients",
      copyBody:
        "<p>Discover curated offerings, standout services, and seasonal highlights designed to help your clients book faster and return more often.</p><p>Use this space to spotlight what makes your business different and guide visitors toward your most important services.</p><p>Update the copy any time to keep your homepage fresh and aligned with your goals.</p>",
      ctaTitle: "Stay in touch",
      ctaSubtitle: "Reach out now and we will help you plan the next step.",
      ctaButtonText: "Contact us now",
      ctaButtonLink: "?page=contact",
      perView: {
        desktop: 4,
        tablet: 2,
        mobile: 1,
      },
      imageMaxWidth: 280,
      maxWidth: "xl",
    },
  }),
  richText: () => ({
    type: "richText",
    props: {
      title: "Tell your story",
      body:
        "<p>Use this space for longer-form storytelling, studio values, or a detailed service overview.</p>",
      align: "left",
    },
  }),
  featureZigzagModern: () => ({
    type: "featureZigzagModern",
    props: {
      title: "Crafted with intention",
      supportingText: "Modern split cards for storytelling and visuals.",
      items: [
        {
          eyebrow: "Custom commissions",
          title: "Handmade in Vancouver",
          body: "Work one-on-one with our studio to design a piece that fits your story.",
          ctaText: "Start a custom order",
          ctaLink: "?page=contact",
          imageUrl: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1600&auto=format&fit=crop",
          imageAlt: "Handmade jewelry",
          align: "left",
        },
        {
          eyebrow: "Workshops",
          title: "Learn the craft",
          body: "Small-group classes covering soldering, texture, and finishing.",
          ctaText: "View workshops",
          ctaLink: "?page=programs",
          imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
          imageAlt: "Jewelry workshop",
          align: "right",
        },
      ],
    },
  }),
  discoverStory: () => ({
    type: "featureZigzagModern",
    props: {
      title: "Discover our story",
      supportingText: "A closer look at the people and craft behind the brand.",
      items: [
        {
          eyebrow: "Studio story",
          title: "Built around craft",
          body: "Share the origin of your studio and what makes your approach different.",
          ctaText: "About the studio",
          ctaLink: "?page=about",
          imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1600&auto=format&fit=crop",
          imageAlt: "Studio workspace",
          align: "left",
        },
        {
          eyebrow: "Signature process",
          title: "Design-led experiences",
          body: "Explain the process clients can expect from first consult to final delivery.",
          ctaText: "See the process",
          ctaLink: "?page=services-classic",
          imageUrl: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1600&auto=format&fit=crop",
          imageAlt: "Signature process",
          align: "right",
        },
        {
          eyebrow: "Crafted details",
          title: "Material-first quality",
          body: "Highlight the materials, methods, and care that set your work apart.",
          ctaText: "View materials",
          ctaLink: "?page=gallery",
          imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
          imageAlt: "Crafted details",
          align: "left",
        },
        {
          eyebrow: "Client journey",
          title: "Trusted by long-term clients",
          body: "Share why clients return and how you support them long after delivery.",
          ctaText: "Read reviews",
          ctaLink: "?page=reviews",
          imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
          imageAlt: "Client journey",
          align: "right",
        },
      ],
    },
  }),
  logoCloud: () => ({
    type: "logoCloud",
    props: {
      followSiteTheme: true,
      title: "Choose a format that fits",
      caption: "Showcase workshops, commissions, or bundles.",
      supportingText: "Highlight offerings with quick pricing and CTA links.",
      titleAlign: "center",
      supportingTextAlign: "center",
      variant: "cards",
      showLabels: true,
      maxWidth: "xl",
      logos: [
        {
          label: "Intro Workshop",
          meta: "$1,500",
          caption: "Foundations in 4 hours",
          features: ["Tools included", "Take-home piece", "Small group"],
          ctaText: "Book intro",
          ctaLink: "?page=programs",
          highlight: true,
        },
        {
          label: "Advanced Workshop",
          meta: "$2,000",
          caption: "Stone setting & design",
          features: ["Intro required", "Weekend sessions", "Hands-on coaching"],
          ctaText: "Book advanced",
          ctaLink: "?page=programs",
        },
        {
          label: "Custom Commission",
          meta: "From $450",
          caption: "Handmade on request",
          features: ["Design consult", "Custom sizing", "Delivery planning"],
          ctaText: "Start a commission",
          ctaLink: "?page=contact",
        },
      ],
    },
  }),
  workshopsCommissions: () => ({
    type: "pricingTable",
    props: {
      title: "Workshops and commissions",
      intro: "Pick the format that fits your goals.",
      notes: "Weekend workshops plus custom jewelry commissions.",
      titleAlign: "center",
      maxWidth: "lg",
      layout: "logo-cards",
      plans: [
        {
          name: "Intro Workshop",
          price: "$1,500",
          features: [
            "Foundations of handmade jewelry",
            "4-hour weekend session",
            "Materials included",
            "Take-home piece"
          ],
          ctaText: "Book intro",
          ctaLink: "?page=programs",
        },
        {
          name: "Advanced Workshop",
          price: "$2,000",
          features: [
            "Stone setting + advanced build",
            "Requires Intro",
            "Small-group format",
            "Personal coaching"
          ],
          ctaText: "Book advanced",
          ctaLink: "?page=programs",
          featured: true,
        },
        {
          name: "Custom Commission",
          price: "From $450",
          features: [
            "One-of-a-kind piece",
            "Design consult",
            "Handmade finish",
            "Delivery planning"
          ],
          ctaText: "Start a commission",
          ctaLink: "?page=contact",
        }
      ]
    },
  }),
  cta: () => ({
    type: "cta",
    props: {
      heading: "Ready to get started?",
      subheading: "Book a session or reach out with a custom request.",
      ctaText: "Contact us",
      ctaLink: "?page=contact",
      titleAlign: "center",
    },
  }),
  teamGrid: () => ({
    type: "teamGrid",
    props: {
      title: "Meet the team",
      subtitle: "Small, dedicated, and client-focused.",
      titleAlign: "center",
      columnsXs: 1,
      columnsSm: 2,
      columnsMd: 3,
      items: [
        {
          name: "Team member",
          role: "Founder",
          image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop",
          email: "hello@example.com",
          linkedin: "https://www.linkedin.com",
          website: "https://www.example.com",
        },
      ],
    },
  }),
  bookingCtaBar: () => ({
    type: "bookingCtaBar",
    props: {
      text: "Book a slot that fits your schedule in minutes.",
      buttonText: "Book now",
      buttonLink: "?page=services-classic",
    },
  }),
  blogList: () => ({
    type: "blogList",
    props: {
      title: "Latest articles",
      subtitle: "Insights and updates from the team.",
      columnsXs: 1,
      columnsSm: 2,
      columnsMd: 3,
      gap: 18,
      posts: [
        {
          slug: "welcome",
          title: "Welcome to our blog",
          date: "2026-01-09",
          excerpt: "Learn how we deliver consistent, enterprise-grade service experiences.",
          body: "<p>Share product updates, behind-the-scenes stories, or tips for clients here.</p>",
          coverImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop",
        },
      ],
    },
  }),
  logoCarousel: () => ({
    type: "logoCarousel",
    props: {
      followSiteTheme: true,
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
  contactFormEditorialSplit: () => ({
    type: "contactForm",
    props: {
      title: "Contact us",
      intro: "We would love to hear from you and discuss your next photo project.",
      eyebrow: "Start the conversation",
      formKey: "contact",
      layoutVariant: "editorialSplit",
      mediaImage:
        "/website/tenant-photography-ophoto-editorial/side-01.jpg",
      mediaAlt: "Photography contact preview",
      mediaTitle: "Let's create images with character.",
      mediaBody:
        "Share your idea, timeline, or preferred session type and we will come back with a tailored proposal.",
      submitLabel: "Send request",
      fields: [
        { name: "name", label: "Full name", required: true },
        { name: "email", label: "Email", required: true },
        { name: "phone", label: "Phone" },
        { name: "subject", label: "Project type" },
        { name: "message", label: "Tell us about your project", required: true },
      ],
    },
  }),
  testimonialCarousel: () => ({
    type: "testimonialCarousel",
    props: {
      title: "What clients are saying",
      autoplay: true,
      intervalMs: 4000,
      showDots: true,
      showArrows: true,
      maxWidth: "xl",
      perView: { desktop: 3, tablet: 2, mobile: 1 },
      reviews: [
        {
          name: "Albi Berisha",
          rating: 5,
          source: "Google",
          ago: "a year ago",
          text: "My neighbor and I both booked the crew — clean edges, punctual, and they even swept the driveway before leaving. Highly recommend.",
        },
        {
          name: "Antonios Abou Eid",
          rating: 5,
          source: "Google",
          ago: "a year ago",
          text: "Amazing work! Always maintaining high quality and communication through every milestone.",
        },
        {
          name: "Maria S.",
          rating: 5,
          source: "Google",
          ago: "2 months ago",
          text: "Fast, fair, and super professional. They squeezed us in for an urgent repair and handled everything same-day.",
        },
      ],
    },
  }),
  featurePillars: () => ({
    type: "featurePillars",
    props: {
      followSiteTheme: true,
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
    followSiteTheme: true,
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
      followSiteTheme: true,
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
  reviewEditorialGrid: () => ({
    type: "reviewEditorialGrid",
    props: {
      followSiteTheme: true,
      title: "What clients are saying",
      subtitle: "Use this section for review highlights, verified client quotes, and a button that points to your reviews or contact page.",
      reviewCountLabel: "Rated 5 stars by recent clients",
      platformLabel: "Client reviews",
      titleAlign: "center",
      maxWidth: "xl",
      buttonText: "Read more reviews",
      buttonLink: "?page=reviews",
      entries: [
        {
          name: "Alyssa M.",
          badge: "Verified client",
          text: "The team made the process easy from the first conversation through the final handoff. Communication stayed clear and the result matched exactly what we planned for.",
          image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop",
          imageAlt: "Project review image one",
        },
        {
          name: "Daniel R.",
          badge: "Verified client",
          text: "We appreciated the mix of planning detail, responsiveness, and finish quality. It felt organized the whole way through and the final result looks great in the space.",
          image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
          imageAlt: "Project review image two",
        },
        {
          name: "Priya S.",
          badge: "Verified client",
          text: "What stood out most was how carefully the project was scoped before work started. That made the install smooth and helped avoid surprises later.",
          image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop",
          imageAlt: "Project review image three",
        },
        {
          name: "Marcus T.",
          badge: "Verified client",
          text: "The finished work feels intentional and well executed. We would use this section to highlight the kind of feedback that helps future clients feel confident.",
          image: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
          imageAlt: "Project review image four",
        },
      ],
    },
  }),
  faq: () => ({
    type: "faq",
    props: {
      title: "Frequently asked questions",
      titleAlign: "center",
      maxWidth: "lg",
      items: [
        {
          question: "How do I book?",
          answer: "Use the booking button or contact us directly and we will guide you to the right appointment path.",
        },
        {
          question: "Do you accept walk-ins?",
          answer: "We recommend booking ahead so we can confirm availability and prepare the right service or consultation.",
        },
      ],
    },
  }),
  faqModern: () => ({
    type: "faq",
    props: {
      title: "Questions clients ask before booking",
      titleAlign: "center",
      maxWidth: "xl",
      items: [
        {
          question: "How do I know which service or package is right for me?",
          answer:
            "Start with the option that feels closest to your needs. If the scope is still unclear, use the quote or contact page and we will recommend the best-fit next step.",
        },
        {
          question: "Can I request a custom quote before I book?",
          answer:
            "Yes. Use the quote request flow when timing, location, materials, or service details need to be confirmed before final pricing.",
        },
        {
          question: "What happens after I submit a request?",
          answer:
            "We review the details, confirm the best service path, and follow up with the next step for booking, pricing, or scheduling.",
        },
        {
          question: "Can I come back later if I am not ready yet?",
          answer:
            "Absolutely. Clients often start with one service, quote, or consultation and return later for additional work or follow-up bookings.",
        },
      ],
    },
  }),
  stats: () => ({
    type: "stats",
    props: {
      title: "",
      subtitle: "",
      style: "band",
      animateValues: true,
      countDurationMs: 1600,
      columns: 4,
      maxWidth: "xl",
      items: [
        { value: "5☆", label: "Highly rated" },
        { value: "500+", label: "Satisfied clients" },
        { value: "2 cities", label: "Service area" },
        { value: "20.7K", label: "Instagram followers" },
      ],
    },
  }),
  serviceGrid: () => ({
    type: "serviceGrid",
    props: {
      followSiteTheme: true,
      title: "Popular services",
      titleAlign: "center",
      subtitle: "Transparent pricing, expert care.",
      services: [
        { name: "Haircut", price: "$45", duration: "45m", description: "Classic or modern styles." },
        { name: "Color", price: "$95", duration: "90m", description: "Single process color." },
      ],
    },
  }),
  serviceHoverSlider: () => ({
    type: "serviceHoverSlider",
    props: {
      title: "Services we provide",
      subtitle: "",
      cardsDesktop: 4,
      cardsTablet: 2,
      cardsMobile: 1,
      gap: 12,
      imageHeight: 392,
      zoomScale: 1.08,
      showDots: true,
      showArrows: true,
      maxWidth: "xl",
      items: [
        {
          title: "Facials and Peels",
          image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
        {
          title: "Microneedling",
          image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
        {
          title: "Laser Facials",
          image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
        {
          title: "Body Treatments",
          image: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
        {
          title: "Skin Tightening",
          image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
        {
          title: "Wellness Therapy",
          image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
        {
          title: "Skin Rejuvenation",
          image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
        {
          title: "Hydration Therapy",
          image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
        {
          title: "Glow Facials",
          image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
        {
          title: "Brows and Lashes",
          image: "https://images.unsplash.com/photo-1620331311520-246422fd82f9?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
        {
          title: "Relaxation Massage",
          image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
        {
          title: "Reflexology",
          image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop",
          link: "?page=services-classic",
        },
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
  mapEmbed: () => ({
    type: "mapEmbed",
    props: {
      title: "Contact Details",
      eyebrow: "Visit our studio",
      body:
        "We would love to hear from you and meet you in person. Share your address, contact details, hours, and a clear booking path beside the map.",
      ctaText: "Book appointment",
      ctaHref: "?page=contact",
      detailOneTitle: "Main location",
      detailOneText: "123 Main Street\nYour City, ST 12345",
      detailTwoTitle: "Office hours",
      detailTwoText: "Monday - Friday: 9AM - 6PM\nSaturday: 10AM - 4PM",
      detailThreeTitle: "Contact",
      detailThreeText: "Call: +1 (555) 123-4567\nEmail: hello@example.com",
      provider: "google",
      query: "123 Main Street, Your City",
      embedUrl: "",
      height: 380,
      borderRadius: 2,
      titleAlign: "left",
      maxWidth: "xl",
      gutterX: 0,
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
  popupCta: () => ({
    type: "popupCta",
    props: {
      enabled: false,
      triggerMode: "delay",
      delaySeconds: 8,
      scrollPercent: 45,
      showOncePerSession: true,
      dismissDays: 7,
      showCloseButton: true,
      showOnMobile: true,
      showOnDesktop: true,
      themeVariant: "light",
      eyebrow: "Special offer",
      title: "Ready to take the next step?",
      body: "Use this popup to highlight a promotion, a consultation, or a quote request. Update the image, text, and button link to fit the page.",
      ctaText: "Explore services",
      ctaLink: "?page=services-classic",
      image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=1200&auto=format&fit=crop",
      imageAlt: "Popup preview image",
      imagePosition: "top",
      imageHeight: 220,
      maxWidth: "sm",
      overlayOpacity: 0.18,
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
