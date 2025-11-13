import React from "react";
import { Box, Stack, Typography, Paper, Grid, Button, Chip, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";

const cardMotionProps = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" },
  viewport: { once: true, amount: 0.35 },
};

const FeatureCardShowcase = ({
  eyebrow,
  title,
  subtitle,
  cards = [],
  background,
  invert = false,
  sx,
  cardContentAlign = "left",
}) => {
  const theme = useTheme();
  const marketing = theme.marketing || {};
  const surfaceGradient = background || marketing.gradients?.primary ||
    (theme.palette.mode === "dark"
      ? "linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(22,78,99,0.78) 100%)"
      : "linear-gradient(135deg, #0ea5e9 0%, #34d399 100%)");

  const cardRadius = Number.isFinite(marketing.radius?.sm) ? marketing.radius.sm : 8;

  if (!Array.isArray(cards) || cards.length === 0) return null;

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        px: { xs: 2, md: 6 },
        py: { xs: 8, md: 12 },
        background: surfaceGradient,
        color: invert ? theme.palette.text.primary : theme.palette.common.white,
        ...sx,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: invert ? 0.1 : 0.16,
          background: invert
            ? marketing.gradients?.surface || theme.palette.background.default
            : "radial-gradient(circle at top left, rgba(255,255,255,0.28), transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <Stack spacing={2} maxWidth={960} mx="auto" position="relative" zIndex={1} textAlign="center" mb={{ xs: 6, md: 8 }}>
        {eyebrow && (
          <Chip
            label={eyebrow}
            color={invert ? "primary" : "default"}
            variant={invert ? "filled" : "outlined"}
            sx={{
              alignSelf: "center",
              fontWeight: 600,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: invert ? theme.palette.primary.contrastText : theme.palette.common.white,
              borderColor: alpha(theme.palette.common.white, 0.65),
              backgroundColor: invert ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.common.black, 0.15),
            }}
          />
        )}
        {title && (
          <Typography component="h2" sx={{ ...marketing.typography?.sectionTitle, color: theme.palette.common.white }}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="subtitle1" sx={{ color: alpha(theme.palette.common.white, 0.74) }}>
            {subtitle}
          </Typography>
        )}
      </Stack>

      <Grid container spacing={{ xs: 3, md: 4 }} position="relative" zIndex={1}>
        {cards.map((card, index) => {
          const motionDelay = 0.1 * index;
          const palette = card.palette || {};
          const iconBg = palette.iconBg || alpha(theme.palette.common.white, invert ? 0.08 : 0.18);
          const cardBg = palette.background || alpha(theme.palette.common.white, invert ? 0.9 : 0.14);
          const textColor = palette.text || (invert ? theme.palette.text.primary : theme.palette.common.white);

          return (
            <Grid item xs={12} sm={6} md={4} key={card.title || index}>
              <motion.div
                {...cardMotionProps}
                transition={{ ...cardMotionProps.transition, delay: motionDelay }}
                whileHover={{ translateY: -6, scale: 1.01 }}
                style={{ height: "100%" }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: cardRadius,
                    backdropFilter: "blur(12px)",
                    background: cardBg,
                    color: textColor,
                    border: `1px solid ${alpha(textColor, invert ? 0.12 : 0.18)}`,
                    boxShadow: marketing.shadows?.md || theme.shadows[8],
                    p: { xs: 3, md: 4 },
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    textAlign: cardContentAlign,
                    alignItems: cardContentAlign === "center" ? "center" : "flex-start",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {card.icon && (
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 999,
                        background: iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: palette.iconColor || theme.palette.primary.contrastText,
                        fontSize: 28,
                        mx: cardContentAlign === "center" ? "auto" : 0,
                        boxShadow: marketing.shadows?.sm || theme.shadows[4],
                      }}
                    >
                      {card.icon}
                    </Box>
                  )}
                  {card.title && (
                    <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.24, textAlign: cardContentAlign, width: "100%" }}>
                      {card.title}
                    </Typography>
                  )}
                  {card.description && (
                    <Typography
                      variant="body1"
                      sx={{
                        color: alpha(textColor, 0.8),
                        textAlign: cardContentAlign,
                        wordBreak: "break-word",
                      }}
                    >
                      {card.description}
                    </Typography>
                  )}
                  {Array.isArray(card.points) && card.points.length > 0 && (
                    <Stack
                      component="ul"
                      spacing={1.25}
                      sx={{
                        pl: cardContentAlign === "center" ? 0 : 2,
                        m: 0,
                        color: alpha(textColor, 0.85),
                        listStylePosition: cardContentAlign === "center" ? "inside" : "outside",
                        alignItems: cardContentAlign === "center" ? "center" : "flex-start",
                        width: "100%",
                      }}
                    >
                      {card.points.map((point) => (
                        <Typography
                          component="li"
                          key={point}
                          variant="body2"
                          sx={{ textAlign: cardContentAlign, width: "100%", wordBreak: "break-word" }}
                        >
                          {point}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                  {card.cta?.label && (
                    <Button
                      {...(card.cta.to ? { component: RouterLink, to: card.cta.to } : card.cta.href ? { component: "a", href: card.cta.href, target: card.cta.target || "_blank", rel: card.cta.rel || "noreferrer" } : {})}
                      variant={card.cta.variant || "text"}
                      color={card.cta.color || "inherit"}
                      sx={{
                        alignSelf: cardContentAlign === "center" ? "center" : "flex-start",
                        mt: "auto",
                        fontWeight: 600,
                        color: card.cta.color ? undefined : textColor,
                        textTransform: "none",
                      }}
                    >
                      {card.cta.label}
                    </Button>
                  )}
                </Paper>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default FeatureCardShowcase;
