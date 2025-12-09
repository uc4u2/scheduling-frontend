// src/landing/pages/HomePage.js
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Paper,
  Divider,
  Button,
  Avatar,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import LanguageIcon from "@mui/icons-material/Language";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Meta from "../../components/Meta";
import JsonLd from "../../components/seo/JsonLd";
import FeatureCardShowcase from "../components/FeatureCardShowcase";
import FeatureShowcase from "../components/FeatureShowcase";
import InsightHighlight from "../components/InsightHighlight";
import Testimonials from "../components/Testimonials";
import CTASection from "../components/CTASection";
import FloatingBlob from "../../components/ui/FloatingBlob";

import { featurePillars, homeFeatureSections } from "../data/features";
import { testimonials } from "../data/testimonials";

const HERO_BACKGROUND =
  "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=1600&q=80";
const HERO_META_IMAGE = HERO_BACKGROUND;
const TRUSTED_LOGOS = [
  "Photo Artisto",
  "Urban Brush",
  "Studio Bloom",
  "Pixel Parlor",
  "Digital Pixel Tech",
];
const FEATURE_ACCENTS = [
  "#0ea5e9",
  "#34d399",
  "#6366f1",
  "#f97316",
  "#facc15",
  "#a855f7",
  "#14b8a6",
];

const HERO_MODULE_BASE = [
  { key: "scheduling", accent: "#6366f1" },
  { key: "payroll", accent: "#10b981" },
  { key: "commerce", accent: "#f97316" },
];

const HERO_MODULE_ICON_MAP = {
  scheduling: EventAvailableIcon,
  payroll: PaymentsRoundedIcon,
  commerce: LanguageIcon,
};

const HIGHLIGHT_CARD_CONFIG = [
  { key: "scheduling", Icon: EventAvailableIcon },
  { key: "commerce", Icon: PaymentsRoundedIcon },
  { key: "analytics", Icon: LanguageIcon },
];


const GUIDE_ITEM_CONFIG = [
  {
    key: "briefing",
    href: "https://www.schedulaa.com/blog/client-journey",
  },
  {
    key: "playbook",
    href: "https://www.schedulaa.com/resources/staffing-formulas",
  },
  {
    key: "webinar",
    href: "https://www.schedulaa.com/webinars/payroll-compliance",
  },
];

const HIGHLIGHT_SLIDER_CONFIG = [
  {
    key: "instantSite",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg",
  },
  {
    key: "stripeCheckout",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/41/Stripe_Logo%2C_revised_2016.svg",
  },
  {
    key: "schedulingPayroll",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Material_UI_logo.svg",
  },
];

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Schedulaa",
  url: "https://www.schedulaa.com/",
  logo: "https://www.schedulaa.com/og/logo.png",
  sameAs: [
    "https://www.linkedin.com/company/schedulaa",
    "https://twitter.com/schedulaa",
  ],
};

const SPOTLIGHT_CONFIG = [
  { key: "workspace", imageIndex: 1 },
  { key: "marketing", imageIndex: 2 },
  { key: "analytics", imageIndex: 0 },
];

const TrustedSlider = ({ accent, title }) => (
  <Box
    sx={{
      position: "relative",
      overflow: "hidden",
      py: { xs: 6, md: 8 },
      px: { xs: 2, md: 6 },
    }}
  >
    <FloatingBlob
      enableMotion
      color={accent}
      size={1040}
      opacity={0.14}
      duration={28}
      sx={{ top: -220, left: -240 }}
    />
    <FloatingBlob
      enableMotion
      color={alpha(accent, 0.65)}
      size={880}
      opacity={0.12}
      duration={26}
      sx={{ bottom: -220, right: -240 }}
    />
    <Stack spacing={3} alignItems="center" position="relative" zIndex={1} sx={{ width: "100%" }}>
      <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={6} textAlign="center">
        {title}
      </Typography>
      <Box sx={{ width: "100%", maxWidth: 980, overflow: "hidden" }}>
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          style={{ display: "flex" }}
        >
          {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((logo, index) => (
            <Box
              key={`${logo}-${index}`}
              sx={{
                px: { xs: 1.75, md: 2.75 },
                py: 0.75,
                mr: { xs: 1.5, md: 2 },
                borderRadius: 999,
                backgroundColor: alpha(accent, 0.06),
                border: `1px solid ${alpha(accent, 0.2)}`,
                fontSize: { xs: 13, md: 14 },
                fontWeight: 600,
                color: alpha(accent, 0.9),
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: alpha(accent, 0.12),
                  transform: "translateY(-1px)",
                },
              }}
            >
              {logo}
            </Box>
          ))}
        </motion.div>
      </Box>
    </Stack>
  </Box>
);

const Spotlight = ({ sections, accent }) => {
  const theme = useTheme();
  const marketing = theme.marketing || {};

  const SpotlightGallery = ({ images }) => {
    const [active, setActive] = useState(0);

    useEffect(() => {
      if (images.length <= 1) return;
      const id = setInterval(() => {
        setActive((prev) => (prev + 1) % images.length);
      }, 3500);
      return () => clearInterval(id);
    }, [images.length]);

    if (!images.length) return null;

    return (
      <Box position="relative">
        <motion.img
          key={images[active]}
          src={images[active]}
          alt="Automation & Integrations"
          style={{ display: "block", width: "100%", height: "auto" }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {images.length > 1 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {images.map((img, index) => (
              <Box
                key={img}
                onClick={() => setActive(index)}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  bgcolor:
                    index === active
                      ? theme.palette.primary.main
                      : alpha(theme.palette.common.white, 0.7),
                }}
              />
            ))}
          </Stack>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        position: "relative",
        px: { xs: 2, md: 6 },
        py: { xs: 8, md: 12 },
        overflow: "hidden",
      }}
    >
      <FloatingBlob
        enableMotion
        color={accent}
        size={1280}
        opacity={0.14}
        duration={30}
        sx={{ top: -260, left: -220 }}
      />
      <FloatingBlob
        enableMotion
        color={alpha(accent, 0.4)}
        size={1140}
        opacity={0.12}
        duration={28}
        sx={{ bottom: -240, right: -220 }}
      />
      <Stack spacing={{ xs: 6, md: 8 }}>
        {sections.map((section, index) => (
          <Grid
            key={section.title}
            container
            spacing={{ xs: 3, md: 6 }}
            direction={{
              xs: "column-reverse",
              md: index % 2 ? "row-reverse" : "row",
            }}
            alignItems="center"
          >
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Typography
                  component="h3"
                  sx={
                    marketing.typography?.sectionTitle || {
                      fontSize: "2.5rem",
                      fontWeight: 700,
                    }
                  }
                >
                  {section.title}
                </Typography>
                <Stack component="ul" spacing={1.2} sx={{ pl: 2, m: 0 }}>
                  {section.bullets.map((bullet) => (
                    <Typography
                      key={bullet}
                      component="li"
                      variant="body1"
                      color="text.secondary"
                    >
                      {bullet}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: marketing.radius?.xl || 32,
                  overflow: "hidden",
                  background:
                    marketing.gradients?.surface ||
                    alpha(theme.palette.background.paper, 0.9),
                  boxShadow: marketing.shadows?.lg || theme.shadows[12],
                  border: (t) =>
                    `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                  position: "relative",
                }}
              >
                <SpotlightGallery images={section.gallery.length ? section.gallery : [section.image]} />
              </Paper>
            </Grid>
          </Grid>
        ))}
      </Stack>
    </Box>
  );
};

const HighlightsSlider = ({ items = [], intervalMs = 2500 }) => {
  const [idx, setIdx] = React.useState(0);
  const theme = useTheme();

  useEffect(() => {
    if (!items.length) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), intervalMs);
    return () => clearInterval(id);
  }, [items.length, intervalMs]);

  if (!items.length) return null;

  return (
    <Box
      sx={{
        mt: 3,
        width: "100%",
        maxWidth: 960,
        mx: "auto",
        px: { xs: 2, md: 0 },
        overflow: "hidden",
        borderRadius: 3,
        border: (t) => `1px solid ${alpha(t.palette.common.white, 0.12)}`,
        backdropFilter: "blur(6px)",
        bgcolor: alpha(theme.palette.background.paper, 0.08),
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: `${items.length * 100}%`,
          transform: `translateX(-${(idx * 100) / items.length}%)`,
          transition: "transform 600ms ease",
        }}
      >
        {items.map((slide, i) => (
          <Box
            key={i}
            sx={{
              width: `${100 / items.length}%`,
              p: { xs: 2.5, md: 3 },
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "64px 1fr" },
              gap: 2,
              alignItems: "center",
              justifyItems: "center",
              textAlign: "center",
            }}
          >
            <Avatar
              src={slide.logo}
              alt={slide.title}
              sx={{
                width: 56,
                height: 56,
                bgcolor: "transparent",
                display: { xs: "none", sm: "inline-flex" },
              }}
              variant="rounded"
            />
            <Box>
              <Typography fontWeight={700} textAlign="center">
                {slide.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {slide.caption}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const HomePage = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  const heroModules = useMemo(() => {
    return HERO_MODULE_BASE.map(({ key, accent }) => {
      const moduleCopy = t(`landing.home.hero.modules.${key}`, {
        returnObjects: true,
      });
      return {
        key,
        accent,
        label: moduleCopy?.label || "",
        summary: moduleCopy?.summary || "",
        stats: moduleCopy?.stats || [],
        bullets: moduleCopy?.bullets || [],
      };
    });
  }, [t]);

  const [activeModuleKey, setActiveModuleKey] = useState(
    () => heroModules[0]?.key ?? HERO_MODULE_BASE[0].key
  );

  useEffect(() => {
    if (!heroModules.length) return;
    if (!heroModules.some((module) => module.key === activeModuleKey)) {
      setActiveModuleKey(heroModules[0].key);
    }
  }, [heroModules, activeModuleKey]);

  const highlightCards = useMemo(() => {
    return HIGHLIGHT_CARD_CONFIG.map(({ key, Icon }) => {
      const cardCopy = t(`landing.home.highlightCards.${key}`, {
        returnObjects: true,
      });
      const defaults =
        key === "commerce"
          ? {
              title: "Commerce that converts",
              description: "Sell products, services, and add-ons in one cart — powered by Stripe Checkout.",
              points: [
                "Mixed carts with secure Stripe sessions",
                "Coupons, refunds, and saved cards included",
                "Easy tax setup via Stripe Tax toggle",
              ],
            }
          : {};
      return {
        title: cardCopy?.title || defaults.title || "",
        description: cardCopy?.description || defaults.description || "",
        icon: <Icon fontSize="medium" />,
        points: cardCopy?.points || defaults.points || [],
      };
    });
  }, [t]);

  const guideItems = useMemo(() => {
    return GUIDE_ITEM_CONFIG.map(({ key, href }) => {
      const itemCopy = t(`landing.home.guides.${key}`, { returnObjects: true });
      return {
        tag: itemCopy?.tag || "",
        headline: itemCopy?.headline || "",
        description: itemCopy?.description || "",
        cta: {
          label: itemCopy?.ctaLabel || "",
          href,
        },
      };
    });
  }, [t]);

  const highlightSliderItems = useMemo(() => {
    return HIGHLIGHT_SLIDER_CONFIG.map(({ key, logo }) => {
      const copy = t(`landing.home.highlightSlider.${key}`, { returnObjects: true });
      return {
        logo,
        title: copy?.title || "",
        caption: copy?.caption || "",
      };
    });
  }, [t]);

  const spotlightSections = useMemo(() => {
    return SPOTLIGHT_CONFIG.map(({ key, imageIndex }) => {
      const sectionCopy = t(`landing.home.spotlight.${key}`, { returnObjects: true });
      return {
        title: sectionCopy?.title || "",
        bullets: sectionCopy?.bullets || [],
        image: homeFeatureSections[imageIndex]?.imageUrl,
        alt: sectionCopy?.alt || "",
        gallery: homeFeatureSections[imageIndex]?.gallery || [],
      };
    });
  }, [t]);

  const metaCopy = useMemo(
    () => t("landing.home.meta", { returnObjects: true }) || {},
    [t]
  );

  const heroCopy = useMemo(
    () => t("landing.home.hero.copy", { returnObjects: true }) || {},
    [t]
  );

  const featureCardCopy = useMemo(
    () => t("landing.home.featureCard", { returnObjects: true }) || {},
    [t]
  );

  const featureShowcaseCopy = useMemo(
    () => t("landing.home.featureShowcase", { returnObjects: true }) || {},
    [t]
  );

  const insightCopy = useMemo(
    () => t("landing.home.insight", { returnObjects: true }) || {},
    [t]
  );

  const ctaCopy = useMemo(
    () => t("landing.home.cta", { returnObjects: true }) || {},
    [t]
  );

  const trustedTitle = t("landing.home.trustedBy");
  const comingSoon = t("landing.home.comingSoon");
  const testimonialsTitle = t("landing.home.testimonials.title");
  const seoSection = useMemo(
    () => t("landing.home.seoSection", { returnObjects: true }) || {},
    [t]
  );
  const seoCards = useMemo(() => {
    const cards = Array.isArray(seoSection.cards) ? seoSection.cards : [];
    return [
      ...cards,
      {
        heading: "Send profession-aware invites",
        body: "Employees pick a profession template (20+ options), inject client name and booking link, and send invites that unlock any available slot—no back-and-forth.",
        link: { label: "Open invitations (login)", to: "/employee/invitations" },
      },
      {
        heading: "Public booking links",
        body: "Staff share a “Book with me” link backed by live availability. Confirmations include host/client time labels, Jitsi link, and cancel/reschedule controls.",
        link: { label: "Enable public link (login)", to: "/employee/public-link" },
      },
      {
        heading: "Automation & integrations",
        body: "Stream bookings, shifts, timeclock events, break compliance, PTO, and payroll data from Schedulaa into 6,000+ Zapier apps while posting balanced payroll and revenue journals to QuickBooks and Xero.",
        link: {
          label: "View Zapier & accounting integrations",
          to: "/docs#integrations",
        },
      },
    ];
  }, [seoSection.cards]);

  const [accent, setAccent] = useState(heroModules[0]?.accent || theme.palette.primary.main);

  const activeModule = useMemo(() => {
    return heroModules.find((module) => module.key === activeModuleKey) || heroModules[0];
  }, [heroModules, activeModuleKey]);

  useEffect(() => {
    if (activeModule?.accent) {
      setAccent(activeModule.accent);
    }
  }, [activeModule]);

  const handleAccentChange = useCallback((_, index, nextAccent) => {
    if (nextAccent) {
      setAccent(nextAccent);
      return;
    }
    const next = FEATURE_ACCENTS[index % FEATURE_ACCENTS.length];
    setAccent(next);
  }, []);

  const heroModuleIconMap = HERO_MODULE_ICON_MAP;

  return (
    <Box>
      <Meta
        title={metaCopy.title}
        description={metaCopy.description}
        canonical="https://www.schedulaa.com/"
        og={{
          title: metaCopy.ogTitle || metaCopy.title,
          description: metaCopy.ogDescription || metaCopy.description,
          image: HERO_META_IMAGE,
        }}
      />
      <JsonLd data={ORGANIZATION_SCHEMA} />

      <Box
        component="section"
        sx={{
          position: "relative",
          overflow: "hidden",
          py: { xs: 10, md: 16 },
          px: { xs: 3, md: 6 },
          backgroundImage: `linear-gradient(135deg, rgba(6, 12, 30, 0.65), rgba(4, 47, 46, 0.52)), url(${HERO_BACKGROUND})`,
          backgroundSize: "cover",
          backgroundPosition: "center 58%",
          color: theme.palette.common.white,
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 6, md: 10 },
            alignItems: "center",
          }}
        >
          <Stack spacing={3}>
            <Typography variant="overline" fontWeight={700} letterSpacing={0.4}>
              {heroCopy.eyebrow}
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, letterSpacing: "-0.4px" }}
            >
              {heroCopy.heading}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                lineHeight: 1.85,
                maxWidth: 520,
                color: alpha(theme.palette.common.white, 0.85),
              }}
            >
              {heroCopy.body}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.8,
                maxWidth: 520,
                color: alpha(theme.palette.common.white, 0.78),
              }}
            >
              Schedulaa combines scheduling, time tracking, payroll, marketing, and website building into a single platform—then connects it to 6,000+ apps via Zapier plus native QuickBooks and Xero exports so finance, HR, and operations share one source of truth.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              flexWrap="wrap"
            >
              {heroModules.map((module) => {
                const IconComponent = heroModuleIconMap[module.key] || EventAvailableIcon;
                const isActive = module.key === activeModuleKey;
                return (
                  <Button
                    key={module.key}
                    onClick={() => setActiveModuleKey(module.key)}
                    variant={isActive ? "contained" : "outlined"}
                    color="primary"
                    startIcon={<IconComponent sx={{ fontSize: 20 }} />}
                    sx={{ borderRadius: 999, textTransform: "none", px: 3.5 }}
                  >
                    {module.label}
                  </Button>
                );
              })}
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap">
              <Button
                component={Link}
                to="/features"
                variant="contained"
                color="secondary"
                sx={{ textTransform: "none", borderRadius: 999, px: 3.5 }}
              >
                Explore features
              </Button>
              <Button
                component={Link}
                to="/pricing"
                variant="outlined"
                color="inherit"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  px: 3.5,
                  borderColor: alpha(theme.palette.common.white, 0.65),
                  "&:hover": {
                    borderColor: theme.palette.common.white,
                    backgroundColor: alpha(theme.palette.common.white, 0.08),
                  },
                }}
              >
                Compare plans
              </Button>
              <Button
                component={Link}
                to="/docs"
                variant="text"
                color="inherit"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  px: 3.5,
                  color: alpha(theme.palette.common.white, 0.85),
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.common.white, 0.08),
                  },
                }}
              >
                Read the docs
              </Button>
            </Stack>
          </Stack>

          {activeModule && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 5,
                px: { xs: 2.5, md: 3.5 },
                py: { xs: 3, md: 4 },
                background: `linear-gradient(145deg, ${alpha(
                  activeModule.accent,
                  theme.palette.mode === "dark" ? 0.24 : 0.18
                )}, ${alpha(
                  theme.palette.background.paper,
                  theme.palette.mode === "dark" ? 0.58 : 0.96
                )})`,
                border: `1px solid ${alpha(activeModule.accent, 0.26)}`,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? theme.shadows[12]
                    : theme.shadows[8],
              }}
            >
              <Stack spacing={2.5}>
                <Stack>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ color: activeModule.accent }}
                  >
                    {activeModule.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ color: alpha(theme.palette.text.primary, 0.72) }}
                  >
                    {activeModule.summary}
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(auto-fit, minmax(220px, 1fr))",
                      sm: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 2,
                    width: "100%",
                  }}
                >
                  {activeModule.stats.map((stat) => (
                    <Paper
                      key={`${stat.label}-${stat.value}`}
                      elevation={0}
                      sx={{
                        p: 1.75,
                        borderRadius: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        minHeight: 136,
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        textAlign: "left",
                        backgroundColor: alpha(
                          theme.palette.background.default,
                          theme.palette.mode === "dark" ? 0.76 : 0.92
                        ),
                        border: `1px solid ${alpha(activeModule.accent, 0.22)}`,
                        width: "100%",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          letterSpacing: 0.45,
                          textTransform: "uppercase",
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {stat.value}
                      </Typography>
                      {stat.helper && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.35 }}
                        >
                          {stat.helper}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>

                <Divider
                  sx={{
                    borderColor: alpha(
                      theme.palette.text.primary,
                      theme.palette.mode === "dark" ? 0.1 : 0.18
                    ),
                  }}
                />

                <Stack spacing={1.1}>
                  {activeModule.bullets.map((point) => (
                    <Stack
                      direction="row"
                      spacing={1.2}
                      alignItems="center"
                      key={point}
                    >
                      <CheckCircleRoundedIcon
                        sx={{ fontSize: 18, color: activeModule.accent }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {point}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          )}
        </Box>
      </Box>

      <HighlightsSlider items={highlightSliderItems} />
      <TrustedSlider accent={accent} title={trustedTitle} />

      <Box
        component="section"
        sx={{
          px: { xs: 3, md: 6 },
          py: { xs: 8, md: 10 },
          backgroundColor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.6 : 0.85),
        }}
      >
        <Stack spacing={3} maxWidth={960} mx="auto" textAlign="center">
          {seoSection.eyebrow && (
            <Typography variant="overline" fontWeight={700} letterSpacing={0.4} color="primary">
              {seoSection.eyebrow}
            </Typography>
          )}
          {seoSection.title && (
            <Typography variant="h3" fontWeight={800}>
              {seoSection.title}
            </Typography>
          )}
          {seoSection.description && (
            <Typography variant="body1" color="text.secondary">
              {seoSection.description}
            </Typography>
          )}
        </Stack>

        <Grid container spacing={4} mt={{ xs: 4, md: 6 }}>
          {seoCards.map((item) => {
            const linkProps = item.link || {};
            const buttonRoutingProps = linkProps.to
              ? { component: Link, to: linkProps.to }
              : linkProps.href
                ? { component: "a", href: linkProps.href, target: linkProps.target, rel: linkProps.rel }
                : null;
            return (
              <Grid item xs={12} md={4} key={item.heading}>
                <Paper
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    p: { xs: 3, md: 4 },
                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    backgroundColor: (theme) => alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.7 : 1),
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  <Typography variant="h5" fontWeight={700}>
                    {item.heading}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.body}
                  </Typography>
                  {linkProps.label && buttonRoutingProps && (
                    <Button
                      {...buttonRoutingProps}
                      variant="text"
                      color="primary"
                      sx={{ mt: "auto", alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
                    >
                      {linkProps.label}
                    </Button>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <FeatureCardShowcase
        eyebrow={featureCardCopy.eyebrow}
        title={featureCardCopy.title}
        subtitle={featureCardCopy.subtitle}
        cards={highlightCards}
        cardContentAlign="center"
      />

      {comingSoon ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", mt: 6 }}
        >
          {comingSoon}
        </Typography>
      ) : null}

      <Box component="section" sx={{ position: "relative", overflow: "hidden" }}>
        <FloatingBlob
          enableMotion
          color={accent}
          size={960}
          opacity={0.16}
          duration={28}
          sx={{ top: -240, right: -220 }}
        />
        <FloatingBlob
          enableMotion
          color={alpha(accent, 0.4)}
          size={1280}
          opacity={0.12}
          duration={32}
          sx={{ bottom: -260, left: -240 }}
        />
      <FeatureShowcase
        eyebrow={featureShowcaseCopy.eyebrow}
        title={featureShowcaseCopy.title}
        subtitle={featureShowcaseCopy.subtitle}
        features={featurePillars}
        onActiveChange={handleAccentChange}
      />
    </Box>

      <Box
        sx={{
          mt: { xs: 6, md: 8 },
          mb: { xs: 8, md: 10 },
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.primary.light, 0.12),
        }}
      >
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Chip label="New" color="primary" />
          <Typography variant="h4" fontWeight={800}>
            Workforce command center with policy-aware time tracking
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Clock-in/out policies, break enforcement, approvals, and payroll-ready exports now live alongside scheduling, payroll, websites, and analytics. IP/device hints, mid-shift approvals, and template-driven corrections keep compliance tight—without spreadsheets or copy/paste.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button component={Link} to="/workforce" variant="contained" color="primary">
              Explore Workforce
            </Button>
            <Button component={Link} to="/register" variant="outlined" color="primary" sx={{ textTransform: "none" }}>
              Start free
            </Button>
            <Button component={Link} to="/features#time-tracking-smart-breaks" variant="text" color="primary">
              See time tracking & breaks
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Spotlight sections={spotlightSections} accent={accent} />

      <InsightHighlight
        eyebrow={insightCopy.eyebrow}
        title={insightCopy.title}
        subtitle={insightCopy.subtitle}
        items={guideItems}
        itemAlign="center"
      />

      <Testimonials
        testimonials={testimonials}
        title={testimonialsTitle}
      />

      <CTASection
        eyebrow={ctaCopy.eyebrow}
        title={ctaCopy.title}
        description={ctaCopy.description}
        primaryCTA={{ label: ctaCopy.primaryLabel, to: "/register" }}
        secondaryCTA={{ label: ctaCopy.secondaryLabel, to: "/contact" }}
      />
    </Box>
  );
};

export default HomePage;
