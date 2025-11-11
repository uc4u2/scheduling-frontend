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
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import LanguageIcon from "@mui/icons-material/Language";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Meta from "../../components/Meta";
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
  "Recruitly",
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

const SPOTLIGHT_CONFIG = [
  { key: "workspace", imageIndex: 1 },
  { key: "marketing", imageIndex: 2 },
  { key: "analytics", imageIndex: 0 },
];

const TrustedSlider = ({ accent, title }) => {
  const marqueeItems = [...TRUSTED_LOGOS, ...TRUSTED_LOGOS];
  return (
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
      <Stack
        spacing={2}
        alignItems="center"
        position="relative"
        zIndex={1}
        sx={{ width: "100%" }}
      >
        <Typography variant="overline" color="text.secondary" fontWeight={700}>
          {title}
        </Typography>
        <Box sx={{ width: "100%", maxWidth: 960, overflow: "hidden" }}>
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-50%" }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            style={{ display: "flex" }}
          >
            <Stack
              direction="row"
              spacing={{ xs: 4, sm: 6 }}
              alignItems="center"
              sx={{ pr: { xs: 4, sm: 6 } }}
            >
              {marqueeItems.map((logo, index) => (
                <Typography
                  key={`${logo}-${index}`}
                  variant="subtitle1"
                  fontWeight={600}
                  color="text.secondary"
                >
                  {logo}
                </Typography>
              ))}
            </Stack>
          </motion.div>
        </Box>
      </Stack>
    </Box>
  );
};

const Spotlight = ({ sections, accent }) => {
  const theme = useTheme();
  const marketing = theme.marketing || {};

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
                  p: { xs: 2, md: 3 },
                }}
              >
                <motion.img
                  src={section.image}
                  alt={section.alt}
                  style={{ display: "block", width: "100%", height: "auto" }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.4 }}
                />
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
      return {
        title: cardCopy?.title || "",
        description: cardCopy?.description || "",
        icon: <Icon fontSize="medium" />,
        points: cardCopy?.points || [],
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

  const [accent, setAccent] = useState(heroModules[0]?.accent || theme.palette.primary.main);

  const activeModule = useMemo(() => {
    return heroModules.find((module) => module.key === activeModuleKey) || heroModules[0];
  }, [heroModules, activeModuleKey]);

  useEffect(() => {
    if (activeModule?.accent) {
      setAccent(activeModule.accent);
    }
  }, [activeModule]);

  useEffect(() => {
    const scriptId = "schedulaa-organization-jsonld";
    const data = {
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

    document.getElementById(scriptId)?.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = scriptId;
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

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
        keywords="Schedulaa, booking software, payroll platform, website builder, scheduling software, service business SaaS"
        og={{
          title: metaCopy.ogTitle || metaCopy.title,
          description: metaCopy.ogDescription || metaCopy.description,
          image: HERO_META_IMAGE,
        }}
      />

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
              Schedulaa combines booking, payroll, marketing, and website building into a single SaaS platform for service businesses across the US and Canada.
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
