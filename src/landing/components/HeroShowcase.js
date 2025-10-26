import React from "react";
import { Box, Stack, Typography, Button, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import FloatingBlob from "../../components/ui/FloatingBlob";

const lineify = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((item) => String(item).split(/\n+/));
  return String(value).split(/\n+/);
};

const resolveCTATarget = (cta) => {
  if (!cta) return undefined;
  if (cta.to) {
    return { component: RouterLink, to: cta.to };
  }
  if (cta.href) {
    return { component: "a", href: cta.href, target: cta.target || "_blank", rel: cta.rel || "noreferrer" };
  }
  return {};
};

const HeroShowcase = ({
  eyebrow,
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  media,
  mediaBackground,
  blobs,
  align = "right",
  sx,
  titleBadge,
}) => {
  const theme = useTheme();
  const marketing = theme.marketing || {};
  const radius = marketing.radius?.xl || 32;
  const heroGradient = marketing.gradients?.surface ||
    (theme.palette.mode === "dark"
      ? "linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(17,94,89,0.65) 55%, rgba(15,118,110,0.6) 100%)"
      : "linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 45%, #fefce8 100%)");

  const defaultBlobs = [
    {
      key: "primary",
      color: theme.palette.primary.main,
      size: 1040,
      opacity: theme.palette.mode === "dark" ? 0.22 : 0.18,
      sx: { top: -260, left: -220 },
    },
    {
      key: "accent",
      color: theme.palette.secondary.main,
      size: 880,
      opacity: theme.palette.mode === "dark" ? 0.18 : 0.14,
      sx: { bottom: -260, right: -200 },
    },
  ];
  const blobList = Array.isArray(blobs) && blobs.length ? blobs : defaultBlobs;

  const titleLines = lineify(title);
  const heroTypography = marketing.typography?.heroTitle || {};
  const heroSubtitle = marketing.typography?.heroSubtitle || {};

  const renderCTAButton = (cta, variant) => {
    if (!cta?.label) return null;
    const targetProps = resolveCTATarget(cta);
    return (
      <Button
        {...targetProps}
        onClick={cta.onClick}
        color={cta.color || "primary"}
        variant={cta.variant || variant}
        size="large"
        sx={{
          borderRadius: 999,
          textTransform: "none",
          px: 4,
          fontWeight: 600,
        }}
      >
        {cta.label}
      </Button>
    );
  };

  const mediaCardBackground = mediaBackground || alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.75 : 0.9);

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        px: { xs: 2, md: 6 },
        py: { xs: 10, md: 16 },
        background: heroGradient,
        borderBottom: (t) => `1px solid ${alpha(t.palette.common.black, t.palette.mode === "dark" ? 0.35 : 0.08)}`,
        ...sx,
      }}
    >
      {blobList.map((blob) => (
        <FloatingBlob
          key={blob.key || `${blob.color}-${blob.size}`}
          enableMotion
          color={blob.color}
          size={blob.size}
          opacity={blob.opacity}
          duration={blob.duration || 24}
          sx={{ pointerEvents: "none", ...blob.sx }}
        />
      ))}

      <Stack
        direction={{ xs: "column", md: align === "right" ? "row" : "row-reverse" }}
        spacing={{ xs: 6, md: 8 }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        maxWidth={1200}
        mx="auto"
        position="relative"
        zIndex={1}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ width: "100%" }}
        >
          <Stack spacing={3} maxWidth={560}>
            {titleBadge && (
              <Box sx={{ display: "inline-flex" }}>
                {titleBadge}
              </Box>
            )}
            {eyebrow && (
              <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={0.24}>
                {eyebrow}
              </Typography>
            )}
            {titleLines.length > 0 && (
              <Typography
                component="h1"
                sx={{
                  ...heroTypography,
                  color: theme.palette.text.primary,
                  fontSize: heroTypography.fontSize || theme.typography.h1.fontSize,
                }}
              >
                {titleLines.map((line, index) => (
                  <Box key={line + index} component="span" sx={{ display: "block" }}>
                    {line}
                  </Box>
                ))}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{
                  maxWidth: heroSubtitle.maxWidth || 600,
                  fontSize: heroSubtitle.fontSize || theme.typography.heroSubtitle?.fontSize || theme.typography.subtitle1.fontSize,
                  lineHeight: heroSubtitle.lineHeight || theme.typography.heroSubtitle?.lineHeight || theme.typography.subtitle1.lineHeight,
                }}
              >
                {subtitle}
              </Typography>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
              {renderCTAButton(primaryCTA, "contained")}
              {renderCTAButton(secondaryCTA, "outlined")}
            </Stack>
            {primaryCTA?.supportingText && (
              <Typography variant="body2" color="text.secondary">
                {primaryCTA.supportingText}
              </Typography>
            )}
          </Stack>
        </motion.div>

        {media && (
          <motion.div
            initial={{ opacity: 0, x: align === "right" ? 32 : -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            style={{ width: "100%" }}
          >
            <Box
              sx={{
                position: "relative",
                borderRadius: radius,
                overflow: "hidden",
                background: mediaCardBackground,
                boxShadow: marketing.shadows?.lg || theme.shadows[8],
                border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
                p: { xs: 2, md: 3 },
              }}
            >
              {React.isValidElement(media) ? (
                media
              ) : (
                <Box
                  component="img"
                  src={media?.src || media}
                  alt={media?.alt || "Schedulaa feature preview"}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    borderRadius: radius - 4,
                    boxShadow: marketing.shadows?.md || theme.shadows[6],
                  }}
                />
              )}
            </Box>
          </motion.div>
        )}
      </Stack>
    </Box>
  );
};

export default HeroShowcase;
