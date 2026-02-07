import React, { useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Avatar,
} from "@mui/material";
import { styled, useTheme, alpha } from "@mui/material/styles";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import SecurityIcon from "@mui/icons-material/Security";
import LanguageIcon from "@mui/icons-material/Language";
import DevicesIcon from "@mui/icons-material/Devices";
import InsightsIcon from "@mui/icons-material/Insights";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PaymentIcon from "@mui/icons-material/Payment";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import { Link } from "react-router-dom";

import Meta from "../../components/Meta";
import JsonLd from "../../components/seo/JsonLd";

const PAGE_URL = "https://www.schedulaa.com/website-builder";
const CTA_URL = "/register";

const breadcrumbItems = [
  { name: "Schedulaa", href: "https://www.schedulaa.com/" },
  { name: "Website builder", href: PAGE_URL },
];

const featureCards = [
  {
    icon: <BoltIcon fontSize="large" />,
    title: "Drag-and-drop builder",
    description:
      "Launch a polished site in minutes with sections, galleries, testimonials, and bookings - no coding required.",
    keyword: "no-code website builder",
  },
  {
    icon: <PaymentIcon fontSize="large" />,
    title: "Stripe payments built-in",
    description:
      "Collect deposits, take full payments, and save cards on file with Stripe from day one.",
    keyword: "website builder with Stripe integration",
  },
  {
    icon: <LanguageIcon fontSize="large" />,
    title: "Free domain + SSL hosting",
    description:
      "Map your own domain or use a schedulaa.site address. Automatic SSL keeps every page secure.",
    keyword: "website builder with free domain and hosting",
  },
  {
    icon: <InsightsIcon fontSize="large" />,
    title: "Analytics that make sense",
    description:
      "See visits, bookings, and revenue in a single dashboard. Connect Google Analytics or use our native insights.",
    keyword: "SEO-friendly website builder",
  },
  {
    icon: <DevicesIcon fontSize="large" />,
    title: "Responsive templates",
    description:
      "Choose from industry-ready templates for salons, coaches, tutors, clinics, and more.",
    keyword: "responsive website templates",
  },
  {
    icon: <SecurityIcon fontSize="large" />,
    title: "Secure customer data",
    description:
      "SOC 2-ready policies, role-based access, and encrypted storage keep client data protected.",
    keyword: "secure SSL website builder",
  },
];

const industries = [
  { label: "Salons & spas", href: "/booking?vertical=salon" },
  { label: "Coaches & consultants", href: "/booking?vertical=coach" },
  { label: "Tutors & educators", href: "/booking?vertical=tutor" },
  { label: "Healthcare clinics", href: "/booking?vertical=clinic" },
  { label: "Multi-location teams", href: "/booking?vertical=multi-location" },
  { label: "Creative studios", href: "/booking?vertical=creative" },
];

const howToSteps = [
  {
    title: "Create your Schedulaa account",
    text: "Start for free in less than two minutes. No credit card required to publish your first site.",
  },
  {
    title: "Pick a template that matches your brand",
    text: "Choose from modern designs for salons, coaches, fitness studios, trades, and more - all fully responsive.",
  },
  {
    title: "Customize pages with drag-and-drop blocks",
    text: "Edit copy, swap hero images, add services, and surface testimonials without touching code.",
  },
  {
    title: "Connect Stripe and booking flows",
    text: "Enable checkout, card-on-file, and scheduling so clients can book and pay in one visit.",
  },
  {
    title: "Publish with your domain and monitor analytics",
    text: "Go live with free SSL, view analytics, and keep improving with built-in SEO recommendations.",
  },
];

const faqs = [
  {
    question: "Is Schedulaa a free website builder for small businesses?",
    answer:
      "Yes. You can design, preview, and publish your first site for free on a schedulaa.site domain. Upgrade only when you need advanced automation or multiple locations.",
  },
  {
    question: "Can I keep my website if I haven’t subscribed yet?",
    answer:
      "Yes. Every account includes a free website at www.schedulaa.com/your-company-slug. You can publish and keep it before subscribing, then upgrade when you’re ready.",
  },
  {
    question: "Can clients book appointments on my site?",
    answer:
      "Absolutely. The booking widget is built into every template, so visitors can reserve appointments, select staff, and pay deposits in real time.",
  },
  {
    question: "Does the website builder include Stripe integration?",
    answer:
      "Yes. Connect Stripe in one click to accept cards, store payment methods, and sync payouts with your Schedulaa dashboard.",
  },
  {
    question: "Can I bring my own domain name?",
    answer:
      "You can map any domain you own. Schedulaa provisions SSL certificates automatically, so your site stays secure with zero maintenance.",
  },
  {
    question: "Is the builder suitable for salons, tutors, and coaches?",
    answer:
      "Schedulaa ships with industry-ready templates and copy blocks for salons, spas, tutors, coaches, clinics, and more. Customize anything in minutes.",
  },
  {
    question: "Do you offer a done-for-you website design service?",
    answer:
      "Yes. Our Website Design Service is a one-time add-on where our team collects your requirements, designs your site, and publishes it for you.",
  },
];

const supportLinks = [
  { label: "Explore templates", href: "/website-builder/templates" },
  { label: "Connect Stripe payments", href: "/website-builder/stripe" },
  { label: "Set up domains + SSL", href: "/website-builder/domain" },
  { label: "See booking in action", href: "/booking" },
];

const resourceHighlights = [
  {
    overline: "Docs & onboarding",
    title: "Step-by-step guides",
    body: "Access detailed launch guides that cover page creation, booking flows, Stripe activation, and DNS/domain cutovers.",
    links: [
      { label: "Read the docs", href: "/docs#website-builder" },
      { label: "Download sitemap", href: "/sitemap.xml" },
    ],
  },
  {
    overline: "SEO resources",
    title: "Index-ready structure",
    body: "Schedulaa publishes canonical URLs, Open Graph tags, and sitemap updates automatically so Google can crawl every template.",
    links: [
      { label: "View SEO checklist", href: "/docs#seo" },
      { label: "Contact rollout team", href: "/contact" },
    ],
  },
  {
    overline: "Customer stories",
    title: "Templates that convert",
    body: "Studios, clinics, and recruiters ship new landing pages without developers, then monitor conversions from the analytics hub.",
    links: [
      { label: "Explore industries", href: "/booking" },
      { label: "Schedule a walkthrough", href: "/contact" },
    ],
  },
];

const HeroShell = styled(Box)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius * 3,
  padding: theme.spacing(6, 6, 8),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.92)}, ${alpha(
    theme.palette.secondary.main,
    0.72
  )})`,
  color: theme.palette.common.white,
  boxShadow: `0 28px 72px ${alpha(theme.palette.primary.main, 0.28)}`
}));

const WebsiteBuilderPage = () => {
  const theme = useTheme();

  const softwareSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Schedulaa Website Builder",
      applicationCategory: "WebsiteBuilder",
      operatingSystem: "Web",
      description:
        "Schedulaa is a free website builder for small businesses with drag-and-drop design, booking, Stripe payments, and secure hosting.",
      offers: {
        "@type": "Offer",
        price: "0.00",
        priceCurrency: "CAD",
        availability: "https://schema.org/InStock",
      },
      featureList: featureCards.map((feature) => feature.keyword),
      url: PAGE_URL,
      brand: {
        "@type": "Brand",
        name: "Schedulaa",
      },
    }),
    []
  );

  const howToSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to build a website in Schedulaa",
      description: "Simple five-step process to design, launch, and monetize a website with Schedulaa.",
      step: howToSteps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: step.text,
      })),
    }),
    []
  );

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    }),
    []
  );

  const breadcrumbSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.href,
      })),
    }),
    []
  );

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, pb: { xs: 10, md: 14 } }}>
      <Meta
        title="Website Builder for Small Business - Free Domain & Hosting | Schedulaa"
        description="Build your business website with Schedulaa's free website builder. Get a free site on a Schedulaa URL, connect your domain, or use our Website Design Service for done-for-you design."
        canonical={PAGE_URL}
        og={{
          title: "Website Builder for Small Business - Schedulaa",
          description:
            "Build and host your business website with booking, Stripe, and analytics. Launch free or choose our Website Design Service for a done-for-you site.",
          image: "https://www.schedulaa.com/images/website-builder-preview.png",
          url: PAGE_URL,
        }}
        twitter={{
          card: "summary_large_image",
          title: "Website Builder for Small Business - Schedulaa",
          description:
            "Create a responsive website with booking, Stripe payments, and analytics in one platform.",
          image: "https://www.schedulaa.com/images/website-builder-preview.png",
        }}
      />
      <JsonLd data={softwareSchema} />
      <JsonLd data={howToSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 } }}>
        <HeroShell>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={2.5}>
                <Chip
                  label="Free Website Builder for Small Business"
                  sx={{
                    alignSelf: "flex-start",
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    backgroundColor: alpha(theme.palette.common.white, 0.12),
                    color: theme.palette.common.white,
                    backdropFilter: "blur(10px)",
                  }}
                />
                <Typography variant="h1" sx={{ fontWeight: 800, fontSize: { xs: "2.5rem", md: "3.4rem" }, lineHeight: 1.1 }}>
                  Website Builder for Small Businesses - Free Hosting Included
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.94, maxWidth: 600 }}>
                  Build a responsive website with booking, Stripe payments, and analytics in one platform.
                  Every account includes a free website at www.schedulaa.com/your-company-slug
                  (even before you subscribe).
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
                  <Button
                    component={Link}
                    to={CTA_URL}
                    variant="contained"
                    color="secondary"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ fontWeight: 700 }}
                  >
                    Start your free website
                  </Button>
                  <Button
                    component={Link}
                    to="/booking"
                    variant="outlined"
                    color="inherit"
                    size="large"
                    sx={{
                      borderColor: alpha(theme.palette.common.white, 0.6),
                      color: theme.palette.common.white,
                      fontWeight: 600,
                      "&:hover": {
                        borderColor: theme.palette.common.white,
                        backgroundColor: alpha(theme.palette.common.white, 0.08),
                      },
                    }}
                  >
                    See booking in action
                  </Button>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ pt: 1 }}>
                  <Avatar
                    variant="rounded"
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=400&auto=format&fit=crop"
                    alt="Schedulaa website builder dashboard preview"
                    sx={{ width: 80, height: 80, borderRadius: 1.5 }}
                  />
                  <Typography variant="body2" sx={{ maxWidth: 360, opacity: 0.86 }}>
                    “We migrated from three different tools. Schedulaa gives us a branded site, booking,
                    and payments under one login.”
                  </Typography>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1200&auto=format&fit=crop"
                alt="Schedulaa drag and drop website builder interface"
                sx={{
                  width: "100%",
                  borderRadius: 4,
                  boxShadow: `0 32px 64px ${alpha(theme.palette.common.black, 0.32)}`,
                  border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
                }}
              />
            </Grid>
          </Grid>
        </HeroShell>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 } }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
            Everything you need to launch
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: "2rem", md: "2.6rem" } }}>
            Drag-and-drop builder with booking & Stripe
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 720, color: theme.palette.text.secondary }}>
            Schedulaa combines a free website builder for small businesses with a booking system, Stripe
            integration, and automated client communication - so you can run your entire customer journey
            in one hub.
          </Typography>
        </Stack>

        <Grid container spacing={3} sx={{ mt: { xs: 4, md: 6 } }}>
          {featureCards.map((feature) => (
            <Grid item xs={12} sm={6} md={4} key={feature.title}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[6],
                  },
                }}
              >
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {feature.description}
                  </Typography>
                  <Chip
                    size="small"
                    label={feature.keyword}
                    sx={{
                      alignSelf: "flex-start",
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      mt: "auto",
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 } }}>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 3,
                borderColor: alpha(theme.palette.primary.main, 0.2),
                p: { xs: 2.5, md: 3 },
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                  Free by default
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  Your website is live right after signup
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Publish instantly on a free Schedulaa URL (www.schedulaa.com/your-company-slug). You can keep
                  the site even before subscribing, then connect a custom domain anytime.
                </Typography>
                <Button component={Link} to={CTA_URL} variant="contained" sx={{ alignSelf: "flex-start" }}>
                  Claim your free site
                </Button>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 3,
                borderColor: alpha(theme.palette.secondary.main, 0.2),
                p: { xs: 2.5, md: 3 },
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                  Done-for-you option
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  Website Design Service
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Prefer a professional team to design it for you? Purchase the Website Design Service and we’ll
                  open a design ticket, collect your requirements, build your site, and publish it.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Includes: design + revisions + publish. Domain purchase not included (we can help you connect it).
                </Typography>
                <Button component={Link} to="/pricing" variant="outlined" sx={{ alignSelf: "flex-start" }}>
                  View pricing
                </Button>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 } }}>
        <Stack spacing={3} textAlign="center" alignItems="center">
          <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
            Resources for crawlers & teams
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: "1.8rem", md: "2.4rem" } }}>
            Everything Google and your staff need to trust the site
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 760, color: theme.palette.text.secondary }}>
            Each website includes structured metadata, sitemap coverage, documentation, and analytics dashboards so search engines
            crawl fast and operators see what’s working.
          </Typography>
        </Stack>
        <Grid container spacing={3} sx={{ mt: { xs: 4, md: 6 } }}>
          {resourceHighlights.map((block) => (
            <Grid item xs={12} md={4} key={block.title}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  borderColor: alpha(theme.palette.secondary.main, 0.2),
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  p: 3,
                }}
              >
                <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.secondary.main }}>
                  {block.overline}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {block.title}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, flexGrow: 1 }}>
                  {block.body}
                </Typography>
                <Stack spacing={1.25}>
                  {block.links.map((link) => (
                    <Button
                      key={link.href}
                      component={Link}
                      to={link.href}
                      size="small"
                      endIcon={<ArrowForwardIcon fontSize="small" />}
                      sx={{ justifyContent: "flex-start", textTransform: "none", fontWeight: 600 }}
                    >
                      {link.label}
                    </Button>
                  ))}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 10, md: 14 } }}>
        <Grid container spacing={6} alignItems="flex-start">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
              Section controls, without code
            </Typography>
            <Typography variant="body1" color="text.secondary">
              For each section (Hero, Gallery, Service Grid, FAQ, and more) adjust alignment, max width, padding, and optional edge-to-edge bleed to get pixel-perfect layouts without touching CSS.
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
              Drafts, Preview & History
            </Typography>
            <Typography variant="body1" color="text.secondary">
              <strong>Save Draft</strong> keeps changes private, <strong>Preview</strong> shows the live visitor view, and <strong>History</strong> lets you restore earlier versions whenever you need to undo or compare updates.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
              Assets & image optimization
            </Typography>
            <Typography variant="body1" color="text.secondary">
              All uploads land in <strong>Assets</strong> so you can reuse graphics across pages, organise with folders and tags, and keep branding consistent. We automatically resize into speed-optimised variants; prefer WEBP/JPG and add descriptive alt text for logos and key imagery.
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
              Navigation styling presets
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Toggle pill, underline, or ghost nav presets, adjust hover and active colours, and tweak spacing while a sticky preview follows your scroll so you never lose context.
            </Typography>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 10, md: 14 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
              Industries we serve
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
              Templates for salons, coaches, tutors, and more
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, color: theme.palette.text.secondary }}>
              Every template is optimized for booking conversions, clear pricing, and mobile performance.
              Start with a pre-built layout and tailor it with your imagery, services, and testimonials -
              no developer required.
            </Typography>
            <List dense sx={{ mt: 2 }}>
              {industries.map((industry) => (
                <ListItem key={industry.label} disableGutters sx={{ alignItems: "flex-start" }}>
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Button
                        component={Link}
                        to={industry.href}
                        sx={{ textTransform: "none", fontWeight: 600, px: 0 }}
                      >
                        {industry.label}
                      </Button>
                    }
                    secondary="Pre-built sections showcase services, pricing, team bios, and reviews."
                  />
                </ListItem>
              ))}
            </List>
            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              {supportLinks.map((link) => (
                <Button
                  key={link.href}
                  component={Link}
                  to={link.href}
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  {link.label}
                </Button>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
              alt="Responsive website templates preview on laptop and phone"
              sx={{
                width: "100%",
                borderRadius: 4,
                boxShadow: theme.shadows[10],
              }}
            />
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 10, md: 14 } }}>
        <Box
          sx={{
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.grey[900], 0.6)
                : alpha(theme.palette.primary.light, 0.09),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="flex-start">
            <Box sx={{ flexBasis: { md: "40%" } }}>
              <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                How it works
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
                Build, connect, and launch in five steps
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                Follow this simple setup checklist to launch an SEO-friendly website with bookings, Stripe,
                and analytics - all powered by Schedulaa.
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Stack spacing={2.5}>
                {howToSteps.map((step, index) => (
                  <Box
                    key={step.title}
                    sx={{
                      display: "flex",
                      gap: 2,
                      alignItems: "flex-start",
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main,
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Stack spacing={0.75}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {step.text}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 10, md: 14 } }}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              <Chip
                icon={<QuestionAnswerIcon />}
                label="Website Builder FAQs"
                sx={{ alignSelf: "flex-start", fontWeight: 600 }}
              />
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                Frequently asked questions
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                Search engines love structured answers. We gathered the most common questions about our
                free website builder with booking and Stripe so your visitors get clarity instantly.
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={7}>
            <Stack spacing={3}>
              {faqs.map((item) => (
                <Box key={item.question}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {item.question}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1.5 }}>
                    {item.answer}
                  </Typography>
                  <Divider sx={{ mt: 3, opacity: 0.18 }} />
                </Box>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 10, md: 14 } }}>
        <Box
          sx={{
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(
              theme.palette.secondary.main,
              0.75
            )})`,
            color: theme.palette.common.white,
            textAlign: "center",
            boxShadow: `0 32px 64px ${alpha(theme.palette.primary.main, 0.28)}`,
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Typography variant="overline" sx={{ letterSpacing: 3, color: alpha(theme.palette.common.white, 0.9) }}>
              Launch in minutes
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              Start your free website today
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 640, opacity: 0.9 }}>
              Join thousands of service businesses that manage their website, booking, payroll, and
              analytics in one platform. Activate Stripe, publish to your domain, and start accepting
              bookings this week.
            </Typography>
            <Button
              component={Link}
              to={CTA_URL}
              variant="contained"
              size="large"
              color="secondary"
              endIcon={<ArrowForwardIcon />}
              sx={{ fontWeight: 700, px: 4 }}
            >
              Build my website
            </Button>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Chip icon={<FormatListNumberedIcon />} label="How-to guide included" />
              <Chip icon={<CloudUploadIcon />} label="Free hosting & SSL" />
              <Chip icon={<SupportAgentIcon />} label="Live onboarding support" />
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default WebsiteBuilderPage;
