import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Paper,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import LanguageIcon from "@mui/icons-material/Language";
import BoltIcon from "@mui/icons-material/Bolt";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import CheckIcon from "@mui/icons-material/CheckCircleOutline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import Meta from "../../components/Meta";
import FeatureShowcase from "../components/FeatureShowcase";
import Testimonials from "../components/Testimonials";
import HeroShowcase from "../components/HeroShowcase";
import FeatureCardShowcase from "../components/FeatureCardShowcase";
import InsightHighlight from "../components/InsightHighlight";
import FloatingBlob from "../../components/ui/FloatingBlob";

import { featurePillars } from "../data/features";
import { testimonials } from "../data/testimonials";

import heroShowcaseMedia from "../../assets/marketing/hero-dashboard.svg";
import platformMap from "../../assets/marketing/platform-map.svg";
import automationJourney from "../../assets/marketing/automation-journey.svg";

const highlightCardConfig = [
  { key: "scheduling", Icon: EventAvailableIcon },
  { key: "payroll", Icon: PaymentsOutlinedIcon },
  { key: "commerce", Icon: LanguageIcon },
];

const platformMapKeys = [
  "branches",
  "analytics",
  "templates",
  "sync",
  "domains",
];

const integrationKeys = [
  "accounting",
  "automation",
  "stripe",
  "domains",
];

const accentPalette = [
  "#0ea5e9",
  "#34d399",
  "#6366f1",
  "#f97316",
  "#facc15",
  "#a855f7",
  "#14b8a6",
];

const FeaturePage = () => {
  const theme = useTheme();
  const marketing = theme.marketing || {};
  const { t } = useTranslation();
  const [activeAccent, setActiveAccent] = useState(theme.palette.primary.main);

  const metaCopy = useMemo(
    () => t("landing.features.meta", { returnObjects: true }) || {},
    [t]
  );

  const heroCopy = useMemo(
    () => t("landing.features.hero", { returnObjects: true }) || {},
    [t]
  );

  const highlightCards = useMemo(
    () =>
      highlightCardConfig.map(({ key, Icon }) => {
        const copy = t(`landing.features.highlightCards.${key}`, {
          returnObjects: true,
        });
        return {
          title: copy?.title || "",
          description: copy?.description || "",
          icon: <Icon fontSize="medium" />,
          points: copy?.points || [],
        };
      }),
    [t]
  );

  const featureShowcaseCopy = useMemo(
    () => t("landing.features.featureShowcase", { returnObjects: true }) || {},
    [t]
  );

  const featuresList = useMemo(
    () => featureShowcaseCopy.features || featurePillars,
    [featureShowcaseCopy]
  );

  const platformMapCopy = useMemo(
    () => t("landing.features.platformMap", { returnObjects: true }) || {},
    [t]
  );

  const platformHighlights = useMemo(
    () => platformMapKeys.map((key) => t(`landing.features.platformMap.points.${key}`)),
    [t]
  );

  const integrationCopy = useMemo(
    () => t("landing.features.integrations", { returnObjects: true }) || {},
    [t]
  );

  const integrationPoints = useMemo(
    () => integrationKeys.map((key) => t(`landing.features.integrations.points.${key}`)),
    [t]
  );

  const insightCopy = useMemo(
    () => t("landing.features.insight", { returnObjects: true }) || {},
    [t]
  );

  const testimonialsTitle = t("landing.features.testimonials.title");

  const insightItems = useMemo(
    () =>
      (insightCopy.items || []).map((item) => ({
        tag: item.tag,
        headline: item.headline,
        description: item.description,
        cta: { label: item.ctaLabel, href: item.ctaHref },
      })),
    [insightCopy]
  );

  const ctaCopy = useMemo(
    () => t("landing.features.cta", { returnObjects: true }) || {},
    [t]
  );

  const handleFeatureAccent = useCallback((_, index, accentOverride) => {
    if (accentOverride) {
      setActiveAccent(accentOverride);
      return;
    }
    const next = accentPalette[index % accentPalette.length];
    setActiveAccent(next);
  }, []);

  const heroBadge = useMemo(() => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${alpha(activeAccent, 0.85)}, ${alpha(
            theme.palette.secondary.main,
            0.6
          )})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.common.white,
          boxShadow: `0 12px 28px ${alpha(activeAccent, 0.35)}`,
        }}
      >
        <AutoAwesomeIcon fontSize="small" />
      </Box>
      <Stack spacing={0.25}>
        <Typography
          variant="overline"
          sx={{ fontWeight: 600, letterSpacing: 0.18, color: alpha(activeAccent, 0.85) }}
        >
          {heroCopy.badge?.title}
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
        >
          {heroCopy.badge?.subtitle}
        </Typography>
      </Stack>
    </Stack>
  ), [activeAccent, theme, heroCopy]);

  return (
    <>
      <Meta
        title={metaCopy.title}
        description={metaCopy.description}
        canonical="https://www.schedulaa.com/features"
        og={{
          title: metaCopy.ogTitle || metaCopy.title,
          description: metaCopy.ogDescription || metaCopy.description,
          image: "https://www.schedulaa.com/og/features.jpg",
        }}
      />

      <HeroShowcase
        eyebrow={heroCopy.eyebrow}
        title={[heroCopy.title?.line1, heroCopy.title?.line2]}
        subtitle={heroCopy.subtitle}
        primaryCTA={{
          label: heroCopy.primaryCta?.label,
          to: heroCopy.primaryCta?.to || "/register",
          supportingText: heroCopy.primaryCta?.supporting,
        }}
        secondaryCTA={{
          label: heroCopy.secondaryCta?.label,
          to: heroCopy.secondaryCta?.to || "/pricing",
          variant: "outlined",
        }}
        media={{ src: heroShowcaseMedia, alt: heroCopy.mediaAlt }}
        titleBadge={heroBadge}
        blobs={[
          { key: "hero-primary", color: activeAccent, size: 1200, opacity: 0.22, sx: { top: -280, left: -240 } },
          { key: "hero-accent", color: theme.palette.secondary.main, size: 880, opacity: 0.18, sx: { bottom: -260, right: -200 } },
        ]}
      />

      <Box sx={{ px: { xs: 2, md: 6 }, mt: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: (t) => `1px solid ${t.palette.divider}`,
            backgroundColor: (t) => t.palette.action.hover,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="body2" color="text.secondary">
              <strong>{heroCopy.banner?.title}</strong> {heroCopy.banner?.body}
            </Typography>
            <Button
              component={Link}
              to={heroCopy.banner?.ctaTo || "/manager/dashboard"}
              size="small"
              variant="contained"
            >
              {heroCopy.banner?.ctaLabel}
            </Button>
          </Stack>
        </Paper>
      </Box>

      <FeatureCardShowcase
        eyebrow={heroCopy.featureCard?.eyebrow}
        title={heroCopy.featureCard?.title}
        subtitle={heroCopy.featureCard?.subtitle}
        cards={highlightCards}
        cardContentAlign="center"
      />

      <Box component="section" sx={{ position: "relative", overflow: "hidden" }}>
        <FloatingBlob
          enableMotion
          color={activeAccent}
          size={920}
          opacity={0.16}
          duration={26}
          sx={{ top: -240, right: -200 }}
        />
        <FloatingBlob
          enableMotion
          color={
            theme.palette.mode === "dark"
              ? alpha(activeAccent, 0.45)
              : alpha(activeAccent, 0.32)
          }
          size={1280}
          opacity={0.12}
          duration={32}
          sx={{ bottom: -260, left: -240 }}
        />
        <FeatureShowcase
          eyebrow={featureShowcaseCopy.eyebrow}
          title={featureShowcaseCopy.title}
          subtitle={featureShowcaseCopy.subtitle}
          features={featuresList}
          onActiveChange={handleFeatureAccent}
        />
      </Box>

      <Box
        component="section"
        sx={{
          position: "relative",
          px: { xs: 2, md: 6 },
          py: { xs: 8, md: 12 },
          backgroundColor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.primary.light, 0.08),
          overflow: "hidden",
        }}
      >
        <FloatingBlob
          enableMotion
          color={theme.palette.secondary.main}
          size={1024}
          opacity={0.18}
          duration={28}
          sx={{ top: -280, right: -220 }}
        />
        <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center" position="relative" zIndex={1}>
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              <Typography
                component="h2"
                sx={
                  marketing.typography?.sectionTitle || {
                    fontSize: "2.5rem",
                    fontWeight: 700,
                  }
                }
              >
                {platformMapCopy.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary"
              >
                {platformMapCopy.subtitle}
              </Typography>
              <List dense sx={{ p: 0 }}>
                {platformHighlights.map((item) => (
                  <ListItem key={item} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36, color: activeAccent }}>
                      <CheckIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item}
                      primaryTypographyProps={{ variant: "body1", color: "text.secondary" }}
                    />
                  </ListItem>
                ))}
              </List>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ ml: { xs: 0, md: 2, lg: 4 } }}
              >
                <Button
                  component={Link}
                  to={platformMapCopy.primaryCta?.to || "/contact"}
                  variant="contained"
                  color="primary"
                  sx={{ borderRadius: 999, textTransform: "none", px: 4 }}
                >
                  {platformMapCopy.primaryCta?.label}
                </Button>
                <Button
                  component={Link}
                  to={platformMapCopy.secondaryCta?.to || "/docs"}
                  variant="text"
                  color="primary"
                  sx={{ textTransform: "none" }}
                >
                  {platformMapCopy.secondaryCta?.label}
                </Button>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: marketing.radius?.xl || 32,
                overflow: "hidden",
                p: { xs: 2, md: 3 },
                background:
                  marketing.gradients?.surface || alpha(theme.palette.background.paper, 0.9),
                boxShadow: marketing.shadows?.lg || theme.shadows[12],
                border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
              }}
            >
              <motion.img
                src={platformMap}
                alt={platformMapCopy.mediaAlt}
                style={{ display: "block", width: "100%", height: "auto" }}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.4 }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Box component="section" sx={{ px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 } }}>
        <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.img
              src={automationJourney}
              alt={integrationCopy.mediaAlt}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                borderRadius: marketing.radius?.lg || 24,
                boxShadow: marketing.shadows?.lg || theme.shadows[12],
              }}
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.4 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Typography
                component="h2"
                sx={
                  marketing.typography?.sectionTitle || {
                    fontSize: "2.5rem",
                    fontWeight: 700,
                  }
                }
              >
                {integrationCopy.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {integrationCopy.subtitle}
              </Typography>
              <Stack spacing={1.5}>
                {integrationPoints.map((bullet) => (
                  <Stack direction="row" spacing={1.5} alignItems="center" key={bullet}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: alpha(activeAccent, 0.16),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: activeAccent,
                      }}
                    >
                      <BoltIcon fontSize="small" />
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      {bullet}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, flex: 1 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {integrationCopy.blocks?.payments?.title}
                    </Typography>
                    <Stack spacing={0.75}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HubOutlinedIcon fontSize="small" color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          {integrationCopy.blocks?.payments?.items?.[0]}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SecurityOutlinedIcon fontSize="small" color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          {integrationCopy.blocks?.payments?.items?.[1]}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, flex: 1 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {integrationCopy.blocks?.compliance?.title}
                    </Typography>
                    <Stack spacing={0.75}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HubOutlinedIcon fontSize="small" color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          {integrationCopy.blocks?.compliance?.items?.[0]}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SecurityOutlinedIcon fontSize="small" color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          {integrationCopy.blocks?.compliance?.items?.[1]}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <InsightHighlight
        eyebrow={insightCopy.eyebrow}
        title={insightCopy.title}
        subtitle={insightCopy.subtitle}
        itemAlign="center"
        items={insightItems.map((entry) => ({
          tag: entry.tag,
          headline: entry.headline,
          description: entry.description,
          cta: entry.cta,
        }))}
      />

      <Testimonials testimonials={testimonials} title={testimonialsTitle} />

      <Divider sx={{ my: { xs: 8, md: 12 }, mx: { xs: 2, md: 6 }, opacity: 0.25 }} />

      <Box
        component="section"
        sx={{
          px: { xs: 2, md: 6 },
          pb: { xs: 10, md: 14 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: marketing.radius?.xl || 32,
            background:
              marketing.gradients?.primary ||
              `linear-gradient(135deg, ${activeAccent} 0%, ${theme.palette.secondary.main} 100%)`,
            color: theme.palette.common.white,
            p: { xs: 4, md: 6 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: { xs: 4, md: 6 },
            boxShadow: marketing.shadows?.xl || theme.shadows[16],
          }}
        >
          <Stack spacing={2} maxWidth={520} sx={{ ml: { xs: 0, md: 2, lg: 4 } }}>
            <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
              {ctaCopy.eyebrow}
            </Typography>
            <Typography
              component="h2"
              sx={{ fontWeight: 800, fontSize: { xs: "2rem", md: "2.75rem" }, lineHeight: 1.1 }}
            >
              {ctaCopy.title}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: alpha(theme.palette.common.white, 0.82) }}
            >
              {ctaCopy.description}
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              component={Link}
              to={ctaCopy.primaryCta?.to || "/register"}
              variant="contained"
              color="primary"
              sx={{ borderRadius: 999, textTransform: "none", px: 4 }}
            >
              {ctaCopy.primaryCta?.label}
            </Button>
            <Button
              component={Link}
              to={ctaCopy.secondaryCta?.to || "/contact"}
              variant="outlined"
              color="inherit"
              sx={{ borderRadius: 999, textTransform: "none", px: 4 }}
            >
              {ctaCopy.secondaryCta?.label}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </>
  );
};

export default FeaturePage;
