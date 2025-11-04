import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Divider,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PaymentsIcon from "@mui/icons-material/Payments";
import LanguageIcon from "@mui/icons-material/Language";
import ScheduleIcon from "@mui/icons-material/Schedule";
import InsightsIcon from "@mui/icons-material/Insights";
import { Link, useParams } from "react-router-dom";

import Meta from "../../../components/Meta";
import HeroShowcase from "../../components/HeroShowcase";
import FeatureCardShowcase from "../../components/FeatureCardShowcase";
import FloatingBlob from "../../../components/ui/FloatingBlob";
import heroShowcaseMedia from "../../../assets/marketing/hero-dashboard.svg";

const CATEGORY_CONTENT = {
  automation: {
    title: ["Automation", "playbooks."],
    subtitle:
      "Use these guides to connect scheduling, marketing, analytics, and websites into a single automated flow.",
    meta: {
      title: "Automation Guides | Schedulaa Blog",
      description:
        "Automation strategies for unifying booking, marketing, analytics, and websites so teams operate from one platform.",
      canonical: "https://www.schedulaa.com/blog/category/automation",
      keywords: "Schedulaa automation, business automation guides, scheduling automation, marketing automation playbook",
    },
    highlights: [
      {
        title: "Connect booking with marketing",
        description:
          "Trigger campaigns automatically when someone skips rebook, hits a milestone, or lapses beyond their typical cadence.",
        icon: <TrendingUpIcon fontSize="small" />,
      },
      {
        title: "Surface analytics automatically",
        description:
          "Automate KPI refreshes so leadership views bookings, revenue, tips, and card-on-file metrics without manual exports.",
        icon: <InsightsIcon fontSize="small" />,
      },
      {
        title: "Publish once, syndicate everywhere",
        description:
          "Push website updates, booking links, and checkout flows live in one click so clients see the latest offers instantly.",
        icon: <LanguageIcon fontSize="small" />,
      },
    ],
    paragraphs: [
      "Our automation content dives into how Schedulaa keeps marketing, analytics, and customer communications in sync with your scheduling data.",
      "Every workflow uses the same data foundation as your booking site, payroll exports, and client messaging so configuration stays simple and powerful.",
    ],
  },
  payroll: {
    title: ["Payroll &", "compliance."],
    subtitle:
      "Deep dives on US and Canadian payroll, ROE workflows, tax automations, and card-on-file best practices.",
    meta: {
      title: "Payroll Operations | Schedulaa Blog",
      description:
        "US and Canadian payroll best practices, tax automation tips, and how Schedulaa streamlines compliance.",
      canonical: "https://www.schedulaa.com/blog/category/payroll",
      keywords: "Schedulaa payroll, Canada payroll software, US payroll automation, ROE generator tips",
    },
    highlights: [
      {
        title: "Federal and regional coverage",
        description:
          "Understand which US states and Canadian provinces are automated today and how to handle remaining local levies.",
        icon: <PaymentsIcon fontSize="small" />,
      },
      {
        title: "Scheduling → payroll handoff",
        description:
          "Use shift data and leave requests to prep payroll quickly, highlight overtime, and flag missing information.",
        icon: <ScheduleIcon fontSize="small" />,
      },
      {
        title: "Card-on-file and tax tips",
        description:
          "Collect deposits, save cards for future charges, and enable Stripe Automatic Tax so invoices stay compliant.",
        icon: <LanguageIcon fontSize="small" />,
      },
    ],
    paragraphs: [
      "Payroll content focuses on using Schedulaa to manage US and Canadian workflows, from Automatic Tax setup to ROE generation.",
      "We cover best practices for deposits, tips, refunds, and reconciling card-on-file charges so finance teams always have the right context.",
    ],
  },
};

const BlogCategoryPage = () => {
  const { slug = "automation" } = useParams();
  const theme = useTheme();

  const config = CATEGORY_CONTENT[slug] || CATEGORY_CONTENT.automation;
  const highlightCards = useMemo(
    () =>
      config.highlights.map((item) => ({
        title: item.title,
        description: item.description,
        icon: item.icon,
      })),
    [config.highlights]
  );

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title={config.meta.title}
        description={config.meta.description}
        canonical={config.meta.canonical}
        keywords={config.meta.keywords}
        og={{
          title: config.meta.title,
          description: config.meta.description,
          image: "https://www.schedulaa.com/og/blog.jpg",
        }}
      />

      <HeroShowcase
        eyebrow="Blog"
        title={config.title}
        subtitle={config.subtitle}
        primaryCTA={{ label: "Start free", to: "/register" }}
        secondaryCTA={{ label: "Talk to sales", to: "/contact", variant: "outlined" }}
        media={{ src: heroShowcaseMedia, alt: "Schedulaa platform hero" }}
        blobs={[
          { key: `${slug}-primary`, color: theme.palette.primary.main, size: 1280, opacity: 0.22, sx: { top: -260, left: -240 } },
          { key: `${slug}-accent`, color: theme.palette.secondary.main, size: 920, opacity: 0.18, sx: { bottom: -260, right: -220 } },
        ]}
        titleBadge={
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
              <InsightsIcon fontSize="small" />
            </Box>
            <Stack spacing={0.25}>
              <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: 0.18, color: alpha(theme.palette.primary.main, 0.85) }}>
                Category
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                {slug === "payroll" ? "Payroll operations" : "Automation"} insights
              </Typography>
            </Stack>
          </Stack>
        }
      />

      <FeatureCardShowcase
        eyebrow="Featured topics"
        title="What you will learn"
        subtitle="We curate the best practices teams rely on when rolling Schedulaa out to every department."
        cards={highlightCards}
        cardContentAlign="center"
      />

      <Box component="article" sx={{ px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 }, maxWidth: 960, mx: "auto" }}>
        <Stack spacing={4}>
          {config.paragraphs.map((paragraph, index) => (
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
              <Button component={Link} to="/pricing" variant="outlined" color="primary" sx={{ textTransform: "none", borderRadius: 999, px: 4 }}>
                Compare plans
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

export default BlogCategoryPage;
