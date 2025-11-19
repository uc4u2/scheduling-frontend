import React from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Divider,
  Button,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Link } from "react-router-dom";
import Meta from "../../../components/Meta";
import JsonLd from "../../../components/seo/JsonLd";

const ARTICLE_SECTIONS = [
  {
    title: "1. First impressions start with your website",
    paragraphs: [
      "Every client journey begins with a search. When prospects land on your Schedulaa site they see a polished, branded experience that mirrors the in-person service. Choose a template, drop in hero copy, gallery blocks, and testimonials without worrying about code. Custom domains and SSL are handled for you so trust is earned immediately.",
      "Because the website builder and booking engine live together, every CTA, price, and gallery links to a real service. Visitors never hit a dead end or a “Call to book” message—they convert on the spot.",
    ],
  },
  {
    title: "2. Convert interest into confirmed bookings",
    paragraphs: [
      "Once someone clicks “Book now,” Schedulaa guides them through intelligent scheduling. Clients can choose locations, staff, add-ons, and even multiple services in one flow. Automated reminders, confirmations, and card-on-file capture keep no-shows low and secure revenue before the visit.",
      "For returning customers, saved preferences mean repeat bookings take seconds. This is where the digital experience meets operational efficiency—the second step of the customer journey feels effortless for both sides.",
    ],
  },
  {
    title: "3. Deliver memorable experiences on-site",
    paragraphs: [
      "With shift planning, workloads, and payroll data in the same system, teams are ready for the day’s appointments. Managers know who is working, staff see their schedules on mobile, and owners track KPIs like utilization, ticket size, tips, and rebook rate from one dashboard.",
      "The result: clients feel welcomed, providers are prepared, and every touchpoint—from intake forms to checkout—runs smoothly.",
    ],
  },
  {
    title: "4. Follow up automatically and build loyalty",
    paragraphs: [
      "The journey doesn’t end after a visit. Schedulaa automates win-back, VIP, no-show, and anniversary campaigns that feel personal because they use live booking history. Client 360° shows lifetime value, visit cadence, and retention risk so you can prioritise outreach.",
      "Pair campaigns with analytics to see which cohorts respond. You’ll know exactly which offers convert, which staff retain best, and where to invest next.",
    ],
  },
  {
    title: "5. Close the loop with payroll and compliance",
    paragraphs: [
      "Once the week wraps up, payroll, ROEs, T4s, and W-2s pull straight from timesheets and booking data. No exporting CSVs, no manual tax lookups. Reports, tip tracking, and stat holiday automation complete the customer journey by rewarding the team that delivered the experience.",
      "When customers, staff, and managers trust the system, you free up time to focus on referrals, campaigns, and higher-value services that expand your brand.",
    ],
  },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: "Designing a Client Journey with Schedulaa",
  description:
    "How to guide prospects from first visit to loyal customer using Schedulaa’s website builder, booking engine, automation, and analytics.",
  author: {
    "@type": "Organization",
    name: "Schedulaa",
  },
  publisher: {
    "@type": "Organization",
    name: "Schedulaa",
    logo: {
      "@type": "ImageObject",
      url: "https://www.schedulaa.com/og/logo.png",
    },
  },
  datePublished: "2025-11-04",
  dateModified: "2025-11-04",
  url: "https://www.schedulaa.com/blog/client-journey",
  articleSection: ["Client Journey", "Automation"],
};

const ClientJourneyPage = () => {
  const theme = useTheme();

  return (
    <Box sx={{ position: "relative", overflow: "hidden", pb: { xs: 8, md: 12 } }}>
      <Meta
        title="Designing a Client Journey — From Search to Loyalty | Schedulaa"
        description="Guide customers from their first impression to loyal advocate using Schedulaa's unified website, booking, marketing, and payroll platform."
        canonical="https://www.schedulaa.com/blog/client-journey"
        og={{
          title: "Designing a Client Journey with Schedulaa",
          description:
            "See how Schedulaa unifies website, booking, analytics, and campaigns to turn prospects into loyal customers.",
          image: "https://www.schedulaa.com/og/blog.jpg",
        }}
      />
      <JsonLd data={articleJsonLd} />

      <Box
        sx={{
          position: "absolute",
          top: -240,
          left: -260,
          width: 960,
          height: 960,
          borderRadius: "50%",
          background: alpha(theme.palette.primary.main, 0.16),
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="md" sx={{ pt: { xs: 8, md: 10 } }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.88)}, ${alpha(
                  theme.palette.secondary.main,
                  0.6
                )})`,
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
              <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: 0.2, color: alpha(theme.palette.primary.main, 0.85) }}>
                Blog: Growth Playbooks
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                Designing a client journey with Schedulaa
              </Typography>
            </Stack>
          </Stack>

          <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: "2.4rem", md: "3rem" }, lineHeight: 1.1 }}>
            From first impression to loyal fan: building client journeys that convert
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Converting casual visitors into loyal advocates takes more than a booking link. It requires a cohesive journey that carries the client
            from discovery to their next appointment without friction. Schedulaa gives you the playbook by merging website, booking, marketing,
            analytics, and payroll in one platform. Here’s how to design that journey step by step.
          </Typography>
        </Stack>

        <Stack spacing={5} sx={{ mt: { xs: 5, md: 7 } }}>
          {ARTICLE_SECTIONS.map((section) => (
            <Box key={section.title}>
              <Typography variant="h5" component="h2" fontWeight={700} sx={{ mb: 2 }}>
                {section.title}
              </Typography>
              <Stack spacing={2.25}>
                {section.paragraphs.map((paragraph, index) => (
                  <Typography key={index} variant="body1" color="text.secondary">
                    {paragraph}
                  </Typography>
                ))}
              </Stack>
              <Divider sx={{ mt: 4, opacity: 0.18 }} />
            </Box>
          ))}
        </Stack>

        <Box sx={{ mt: { xs: 6, md: 8 }, textAlign: "center" }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Ready to map your own client journey?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto", mb: 3 }}>
            Launch your branded site, streamline booking, and automate follow-up campaigns in one place. Your next loyal customer is only a journey
            away.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button component={Link} to="/register" variant="contained" size="large" sx={{ textTransform: "none", borderRadius: 999 }}>
              Start free
            </Button>
            <Button component={Link} to="/contact" variant="outlined" size="large" sx={{ textTransform: "none", borderRadius: 999 }}>
              Talk to sales
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default ClientJourneyPage;
