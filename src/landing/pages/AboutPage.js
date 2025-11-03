import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Paper,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import TimelineIcon from "@mui/icons-material/Timeline";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PublicIcon from "@mui/icons-material/Public";
import VerifiedIcon from "@mui/icons-material/Verified";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

import Meta from "../../components/Meta";
import HeroShowcase from "../components/HeroShowcase";
import FeatureCardShowcase from "../components/FeatureCardShowcase";
import FloatingBlob from "../../components/ui/FloatingBlob";

import teamCollage from "../../assets/marketing/team-collage.svg";

const DEFAULT_CONTENT = {
  meta: {
    title: "About Photo Artisto Corp. | Makers of Schedulaa",
    description:
      "Learn how Photo Artisto Corp. built Schedulaa to give creative teams a single operating system for booking, payroll, HR, and commerce.",
    canonical: "https://www.schedulaa.com/about",
    og: {
      title: "About Photo Artisto Corp.",
      description: "We built Schedulaa to free creatives from juggling disjointed software.",
      image: "https://www.schedulaa.com/og/about.jpg",
    },
  },
  hero: {
    eyebrow: "Our story",
    title: ["The team behind", "Schedulaa."],
    subtitle:
      "Schedulaa started inside Photo Artisto Corp. as the all-in-one platform our stylists, photographers, recruiters, and studios needed to run bookings, payroll, campaigns, and HR without juggling tools.",
    badge: {
      overline: "Team first",
      title: "Built by creatives for creatives",
    },
    primaryCta: { label: "Meet the team", to: "#leadership" },
    secondaryCta: { label: "Join our mission", to: "#careers" },
    mediaAlt: "Schedulaa team collaboration",
  },
  intro: {
    eyebrow: "Why we built Schedulaa",
    title: "A single operating system for creative teams",
    subtitle:
      "Every feature and workflow ships to remove friction for teams who create unforgettable client experiences.",
    values: [
      {
        key: "design",
        title: "Design for busy creatives",
        description:
          "Every workflow trims clicks so stylists, recruiters, and staff can focus on clients.",
      },
      {
        key: "unify",
        title: "Unify the toolset",
        description:
          "Scheduling, payroll, websites, commerce, and analytics live in one system.",
      },
      {
        key: "trust",
        title: "Earn trust every payday",
        description:
          "Compliance-ready payroll and audit trails keep teams confident on every run.",
      },
      {
        key: "global",
        title: "Build for global teams",
        description:
          "Local currencies, languages, and regulations are first-class citizens in Schedulaa.",
      },
      {
        key: "secure",
        title: "Keep data secure",
        description:
          "Role-based permissions, audit logging, and encryption standards protect every client touchpoint.",
      },
      {
        key: "partner",
        title: "Partner with your team",
        description:
          "Dedicated onboarding, live chat, and success managers help every location launch smoothly.",
      },
    ],
  },
  timeline: {
    title: "Our timeline",
    items: [
      {
        year: "2018",
        description: "Photo Artisto Corp. launched to help stylists solve booking chaos.",
      },
      {
        year: "2022",
        description:
          "Internal tool evolved into Schedulaa, integrating scheduling, payroll, and storefront.",
      },
      {
        year: "2023-24",
        description:
          "Added HR, interviews, website builder, custom domains, and payroll in CA/US.",
      },
    ],
  },
  mission: {
    title: "Mission",
    body:
      "We give every creative team, salon, studio, and recruiter a single operating system for booking, payroll, marketing, HR, and commerce so they can focus on clients instead of juggling software.",
  },
  leadership: {
    title: "Leadership",
    people: [
      { name: "UC Sam", title: "CEO & Co-Founder" },
      { name: "Anna Lee", title: "COO & Product" },
      { name: "Marcus Patel", title: "CTO & Infrastructure" },
    ],
  },
  coreValues: {
    title: "Core values",
    items: [
      "Design for busy creatives",
      "Unify the toolset",
      "Earn trust every payday",
      "Build for global teams",
      "Keep data secure",
      "Partner with your team",
    ],
  },
  contact: {
    title: "Contact",
    company:
      "Photo Artisto Corp., 1080 Market Street, Suite 500, San Francisco, CA 94103, USA.",
    details:
      "Email: hello@schedulaa.com | Support: support@schedulaa.com | Press: press@schedulaa.com",
  },
};

const VALUE_ICON_MAP = {
  design: Diversity3Icon,
  unify: TimelineIcon,
  trust: FavoriteBorderIcon,
  global: PublicIcon,
  secure: VerifiedIcon,
  partner: SupportAgentIcon,
};

const getArray = (value, fallback) => (Array.isArray(value) && value.length ? value : fallback);

const AboutPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const marketing = theme.marketing || {};

  const content = useMemo(() => t("landing.aboutPage", { returnObjects: true }), [t]);

  const metaContent = content?.meta || DEFAULT_CONTENT.meta;
  const heroContent = content?.hero || DEFAULT_CONTENT.hero;
  const introContent = content?.intro || DEFAULT_CONTENT.intro;
  const timelineContent = content?.timeline || DEFAULT_CONTENT.timeline;
  const missionContent = content?.mission || DEFAULT_CONTENT.mission;
  const leadershipContent = content?.leadership || DEFAULT_CONTENT.leadership;
  const coreValuesContent = content?.coreValues || DEFAULT_CONTENT.coreValues;
  const contactContent = content?.contact || DEFAULT_CONTENT.contact;

  const heroTitle = getArray(heroContent.title, DEFAULT_CONTENT.hero.title);
  const heroBadge = heroContent.badge || DEFAULT_CONTENT.hero.badge;
  const heroPrimaryCta = {
    ...DEFAULT_CONTENT.hero.primaryCta,
    ...(heroContent.primaryCta || {}),
  };
  const heroSecondaryCta = {
    ...DEFAULT_CONTENT.hero.secondaryCta,
    ...(heroContent.secondaryCta || {}),
  };
  const heroMediaAlt = heroContent.mediaAlt || DEFAULT_CONTENT.hero.mediaAlt;

  const introValues = getArray(introContent.values, DEFAULT_CONTENT.intro.values);
  const valueCards = useMemo(
    () =>
      introValues.map((value, index) => {
        const fallbackValue = DEFAULT_CONTENT.intro.values[index] || {};
        const key = value.key || fallbackValue.key;
        const IconComponent = (key && VALUE_ICON_MAP[key]) || AutoAwesomeIcon;
        return {
          title: value.title || fallbackValue.title || "",
          description: value.description || fallbackValue.description || "",
          icon: <IconComponent fontSize="small" />,
          palette: {
            background: alpha(
              theme.palette.background.paper,
              theme.palette.mode === "dark" ? 0.22 : 0.92
            ),
            iconBg: alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.3 : 0.18
            ),
            text: theme.palette.text.primary,
          },
        };
      }),
    [introValues, theme]
  );

  const timelineItems = getArray(
    timelineContent.items,
    DEFAULT_CONTENT.timeline.items
  );
  const leaders = getArray(
    leadershipContent.people,
    DEFAULT_CONTENT.leadership.people
  );
  const coreValues = getArray(
    coreValuesContent.items,
    DEFAULT_CONTENT.coreValues.items
  );

  const metaOg = metaContent?.og || DEFAULT_CONTENT.meta.og;

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title={metaContent?.title || DEFAULT_CONTENT.meta.title}
        description={metaContent?.description || DEFAULT_CONTENT.meta.description}
        canonical={metaContent?.canonical || DEFAULT_CONTENT.meta.canonical}
        og={{
          title: metaOg.title || DEFAULT_CONTENT.meta.og.title,
          description: metaOg.description || DEFAULT_CONTENT.meta.og.description,
          image: metaOg.image || DEFAULT_CONTENT.meta.og.image,
        }}
      />

      <HeroShowcase
        eyebrow={heroContent?.eyebrow || DEFAULT_CONTENT.hero.eyebrow}
        title={heroTitle}
        subtitle={heroContent?.subtitle || DEFAULT_CONTENT.hero.subtitle}
        primaryCTA={{
          label: heroPrimaryCta.label,
          to: heroPrimaryCta.to || "#leadership",
          variant: "contained",
        }}
        secondaryCTA={{
          label: heroSecondaryCta.label,
          to: heroSecondaryCta.to || "#careers",
          variant: "outlined",
        }}
        media={{ src: teamCollage, alt: heroMediaAlt }}
        titleBadge={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.88
                )}, ${alpha(theme.palette.secondary.main, 0.6)})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.palette.common.white,
                boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              <AutoAwesomeIcon fontSize="small" />
            </Box>
            <Stack spacing={0.25}>
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 600,
                  letterSpacing: 0.18,
                  color: alpha(theme.palette.primary.main, 0.85),
                }}
              >
                {heroBadge?.overline || DEFAULT_CONTENT.hero.badge.overline}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
              >
                {heroBadge?.title || DEFAULT_CONTENT.hero.badge.title}
              </Typography>
            </Stack>
          </Stack>
        }
        blobs={[
          {
            key: "about-primary",
            color: theme.palette.primary.main,
            size: 1280,
            opacity: 0.22,
            sx: { top: -260, left: -240 },
          },
          {
            key: "about-accent",
            color: theme.palette.secondary.main,
            size: 960,
            opacity: 0.18,
            sx: { bottom: -260, right: -200 },
          },
        ]}
      />

      <FeatureCardShowcase
        eyebrow={introContent?.eyebrow || DEFAULT_CONTENT.intro.eyebrow}
        title={introContent?.title || DEFAULT_CONTENT.intro.title}
        subtitle={introContent?.subtitle || DEFAULT_CONTENT.intro.subtitle}
        cards={valueCards}
        background={marketing.gradients?.primary}
        cardContentAlign="center"
      />

      <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 } }}>
        <Stack spacing={{ xs: 6, md: 8 }}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h2" fontWeight={700}>
              {timelineContent?.title || DEFAULT_CONTENT.timeline.title}
            </Typography>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {timelineItems.map((item) => (
                <Grid item xs={12} md={4} key={`${item.year}-${item.description}`}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      borderRadius: marketing.radius?.lg || 24,
                      border: (t) => `1px solid ${alpha(t.palette.divider, 0.35)}`,
                      boxShadow:
                        marketing.shadows?.sm || "0 18px 40px rgba(15,23,42,0.12)",
                      background: alpha(
                        theme.palette.background.paper,
                        theme.palette.mode === "dark" ? 0.22 : 0.92
                      ),
                    }}
                  >
                    <Typography variant="overline" color="primary" fontWeight={700}>
                      {item.year}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>

          <Stack spacing={3}>
            <Typography variant="h4" component="h2" fontWeight={700}>
              {missionContent?.title || DEFAULT_CONTENT.mission.title}
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: marketing.radius?.lg || 24,
                border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
                background: alpha(
                  theme.palette.background.paper,
                  theme.palette.mode === "dark" ? 0.18 : 0.95
                ),
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {missionContent?.body || DEFAULT_CONTENT.mission.body}
              </Typography>
            </Paper>
          </Stack>

          <Stack spacing={3} id="leadership">
            <Typography variant="h4" component="h2" fontWeight={700}>
              {leadershipContent?.title || DEFAULT_CONTENT.leadership.title}
            </Typography>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {leaders.map((leader) => (
                <Grid item xs={12} sm={4} key={`${leader.name}-${leader.title}`}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      borderRadius: marketing.radius?.lg || 24,
                      border: (t) => `1px solid ${alpha(t.palette.divider, 0.35)}`,
                      textAlign: "center",
                      boxShadow:
                        marketing.shadows?.sm || "0 14px 32px rgba(15,23,42,0.1)",
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      {leader.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {leader.title}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>

          <Stack spacing={3} id="careers">
            <Typography variant="h4" component="h2" fontWeight={700}>
              {coreValuesContent?.title || DEFAULT_CONTENT.coreValues.title}
            </Typography>
            <Stack spacing={1.5} component="ul" sx={{ pl: 2, m: 0 }}>
              {coreValues.map((value) => (
                <Typography key={value} component="li" variant="body1" color="text.secondary">
                  {value}
                </Typography>
              ))}
            </Stack>
          </Stack>

          <Stack spacing={3} id="contact">
            <Typography variant="h4" component="h2" fontWeight={700}>
              {contactContent?.title || DEFAULT_CONTENT.contact.title}
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: marketing.radius?.lg || 24,
                border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {contactContent?.company || DEFAULT_CONTENT.contact.company}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {contactContent?.details || DEFAULT_CONTENT.contact.details}
              </Typography>
            </Paper>
          </Stack>

          <Box sx={{ position: "relative", overflow: "hidden" }}>
            <FloatingBlob
              enableMotion
              color={theme.palette.primary.main}
              size={960}
              opacity={0.14}
              duration={28}
              sx={{ top: -220, right: -200 }}
            />
            <FloatingBlob
              enableMotion
              color={theme.palette.secondary.main}
              size={1040}
              opacity={0.12}
              duration={32}
              sx={{ bottom: -220, left: -200 }}
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default AboutPage;
