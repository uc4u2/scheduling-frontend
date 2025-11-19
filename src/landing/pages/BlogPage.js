import React from "react";
import {
  Box,
  Typography,
  Stack,
  Divider,
  Button,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PaymentsIcon from "@mui/icons-material/Payments";
import LanguageIcon from "@mui/icons-material/Language";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import InsightsIcon from "@mui/icons-material/Insights";

import { Link } from "react-router-dom";
import Meta from "../../components/Meta";
import JsonLd from "../../components/seo/JsonLd";
import HeroShowcase from "../components/HeroShowcase";
import FeatureCardShowcase from "../components/FeatureCardShowcase";
import FloatingBlob from "../../components/ui/FloatingBlob";
import heroShowcaseMedia from "../../assets/marketing/hero-dashboard.svg";

const highlightItems = [
  {
    title: "Website builder and domains",
    description:
      "Design every page, reuse assets, publish drafts, and generate DNS instructions so your custom domain and SSL go live without third-party builders.",
    icon: <LanguageIcon fontSize="small" />, 
  },
  {
    title: "Marketing automation",
    description:
      "Preview segmented campaigns, personalize copy, track UTMs, and send high-converting win-back, VIP, and broadcast emails in minutes.",
    icon: <TrendingUpIcon fontSize="small" />, 
  },
  {
    title: "Stripe checkout and tax compliance",
    description:
      "Connect Stripe once, enable Automatic Tax, and manage registrations so every invoice respects local rules without manual calculations.",
    icon: <PaymentsIcon fontSize="small" />, 
  },
  {
    title: "Payroll and workforce",
    description:
      "Calculate payroll across supported US states and Canadian provinces, track shifts and leave, and stay ahead of regional requirements in one flow.",
    icon: <ScheduleIcon fontSize="small" />, 
  },
  {
    title: "Client experience and reviews",
    description:
      "Track client feedback, monitor satisfaction, and prepare for automated review requests that keep retention and loyalty high.",
    icon: <SupportAgentIcon fontSize="small" />, 
  },
  {
    title: "Data visibility and analytics",
    description:
      "Unify scheduling, payroll, marketing, and revenue data to understand performance in real time and support leadership decisions.",
    icon: <InsightsIcon fontSize="small" />, 
  },
];

const articleParagraphs = [
  "Businesses burn hours jumping between booking apps, payroll exports, marketing platforms, and website builders. Schedulaa merges those critical systems into one secure command center built for teams that need clarity and control.",
  "Our platform brings enterprise-grade structure to small and mid-sized operators. Scheduling, payroll, reviews, analytics, and your marketing site share the same data foundation so decisions are instant and context stays intact.",
  "Inside the Website Builder you can select any page, edit sections, adjust global styles, reuse uploaded assets, and publish changes when they are ready. DNS instructions are generated automatically so connecting your custom domain and SSL is painless.",
  "Marketing automation is built in. Preview segmented campaigns, personalize copy without touching HTML, track UTM performance, and send broadcast, win-back, VIP, or no-show flows that actually convert.",
  "Checkout stays compliant by design. Connect Stripe, enable Automatic Tax, and manage regional registrations so every transaction reflects the right rules without extra software.",
  "Payroll workflows span the regions we support across the US and Canada, track shifts and leave, flag unsupported local levies, and surface the insights teams need before payday.",
  "All of this runs inside a single platform with auditing, role-aware access, and a support team that lives the same rollout playbooks documented in our help center.",
  "Thousands of operators are already replacing fractured stacks with Schedulaa. Less tab hopping, fewer CSVs, more time spent on clients and growth.",
];

const BLOG_LISTING_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Schedulaa Blog",
  description: "Automation, payroll, and operations playbooks for teams running on the Schedulaa platform.",
  url: "https://www.schedulaa.com/blog",
  publisher: {
    "@type": "Organization",
    name: "Schedulaa",
    logo: {
      "@type": "ImageObject",
      url: "https://www.schedulaa.com/og/logo.png",
    },
  },
  blogPost: [
    {
      "@type": "BlogPosting",
      headline: "Designing a Client Journey with Schedulaa",
      description: "Guide prospects from first visit to loyal customer using Schedulaa’s website builder, booking engine, automation, and analytics.",
      url: "https://www.schedulaa.com/blog/client-journey",
      image: "https://www.schedulaa.com/og/blog.jpg",
      datePublished: "2025-11-04",
      dateModified: "2025-11-04",
      author: { "@type": "Organization", name: "Schedulaa" },
    },
  ],
};

const BlogPage = () => {
  const theme = useTheme();

  const heroBadge = (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.88)}, ${alpha(theme.palette.secondary.main, 0.6)})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.common.white,
          boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.35)}`,
        }}
      >
        <TrendingUpIcon fontSize="small" />
      </Box>
      <Stack spacing={0.25}>
        <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: 0.18, color: alpha(theme.palette.primary.main, 0.85) }}>
          Blog insight
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
          How Schedulaa redefines all-in-one management
        </Typography>
      </Stack>
    </Stack>
  );

  const highlightCards = highlightItems.map((item) => ({
    title: item.title,
    description: item.description,
    icon: item.icon,
  }));

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title="The Future of Business Automation | Schedulaa Blog"
        description="How Schedulaa is redefining all-in-one management for modern teams with unified booking, payroll, websites, and analytics."
        canonical="https://www.schedulaa.com/blog"
        og={{
          title: "The Future of Business Automation",
          description: "Schedulaa brings booking, payroll, websites, and analytics together so teams can scale without the chaos of disconnected tools.",
          image: "https://www.schedulaa.com/og/blog.jpg",
        }}
      />
      <JsonLd data={BLOG_LISTING_SCHEMA} />

      <HeroShowcase
        eyebrow="Blog"
        title={["The future of", "business automation."]}
        subtitle="How Schedulaa is redefining all-in-one management for modern teams with unified booking, payroll, websites, and analytics."
        primaryCTA={{ label: "Start free", to: "/register" }}
        secondaryCTA={{ label: "Talk to sales", to: "/contact", variant: "outlined" }}
        media={{ src: heroShowcaseMedia, alt: "Schedulaa product hero" }}
        titleBadge={heroBadge}
        blobs={[
          { key: "blog-primary", color: theme.palette.primary.main, size: 1280, opacity: 0.22, sx: { top: -260, left: -240 } },
          { key: "blog-accent", color: theme.palette.secondary.main, size: 920, opacity: 0.18, sx: { bottom: -260, right: -220 } },
        ]}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ px: { xs: 2, md: 6 }, pt: { xs: 4, md: 6 } }}>
        <Button component={Link} to="/blog/category/automation" variant="contained" color="secondary" sx={{ textTransform: "none", borderRadius: 999 }}>
          Automation insights
        </Button>
        <Button component={Link} to="/blog/category/payroll" variant="outlined" color="primary" sx={{ textTransform: "none", borderRadius: 999 }}>
          Payroll operations
        </Button>
        <Button component={Link} to="/blog/client-journey" variant="text" color="primary" sx={{ textTransform: "none", borderRadius: 999 }}>
          Client journey guide
        </Button>
      </Stack>

      <FeatureCardShowcase
        eyebrow="What's inside"
        title="One platform, endless possibilities"
        subtitle="Schedulaa unites booking, payroll, websites, analytics, and automation so your team can operate from one command center."
        cards={highlightCards}
        cardContentAlign="center"
      />

      <Box component="article" sx={{ px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 }, maxWidth: 960, mx: "auto" }}>
        <Stack spacing={4}>
          {articleParagraphs.map((paragraph, index) => (
            <Typography key={index} variant="body1" color="text.secondary">
              {paragraph}
            </Typography>
          ))}

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h5" component="h2" fontWeight={700}>
              Ready to simplify your business operations?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Start free today and run booking, payroll, marketing, and websites from a single platform.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
              <Button component={Link} to="/register" variant="contained" color="primary" sx={{ textTransform: "none", borderRadius: 999, px: 4 }}>
                Start your free trial
              </Button>
              <Button component={Link} to="/contact" variant="outlined" color="primary" sx={{ textTransform: "none", borderRadius: 999, px: 4 }}>
                Talk to sales
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ position: "relative", py: { xs: 8, md: 10 } }}>
        <FloatingBlob enableMotion color={theme.palette.primary.main} size={960} opacity={0.14} duration={28} sx={{ top: -200, right: -200 }} />
      </Box>
    </Box>
  );
};

export default BlogPage;
