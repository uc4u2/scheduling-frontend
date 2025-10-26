import React from "react";
import { Box, Stack, Typography, Grid, Paper, Button, Chip, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";

const InsightHighlight = ({
  eyebrow,
  title,
  subtitle,
  items = [],
  sx,
  itemAlign = "left",
}) => {
  const theme = useTheme();
  const marketing = theme.marketing || {};
  const radius = marketing.radius?.lg || 24;

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <Box
      component="section"
      sx={{
        px: { xs: 2, md: 6 },
        py: { xs: 8, md: 10 },
        backgroundColor: theme.palette.background.default,
        ...sx,
      }}
    >
      <Stack spacing={2} textAlign="center" maxWidth={800} mx="auto" mb={{ xs: 6, md: 8 }}>
        {eyebrow && (
          <Chip
            label={eyebrow}
            size="small"
            sx={{
              alignSelf: "center",
              fontWeight: 600,
              letterSpacing: 0.18,
              textTransform: "uppercase",
            }}
          />
        )}
        {title && (
          <Typography component="h2" sx={marketing.typography?.sectionTitle || { fontWeight: 700, fontSize: '2.25rem' }}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>

      <Grid container spacing={{ xs: 3, md: 4 }}>
        {items.map((item, index) => (
          <Grid item xs={12} md={4} key={item.headline || index}>
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: radius,
                border: (t) => `1px solid ${alpha(t.palette.divider, 0.6)}`,
                boxShadow: marketing.shadows?.sm || theme.shadows[4],
                p: { xs: 3, md: 4 },
                display: "flex",
                flexDirection: "column",
                gap: 2,
                textAlign: itemAlign,
                alignItems: itemAlign === "center" ? "center" : "flex-start",
              }}
            >
              {item.tag && (
                <Chip
                  label={item.tag}
                  size="small"
                  sx={{
                    alignSelf: itemAlign === "center" ? "center" : "flex-start",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.12,
                  }}
                />
              )}
              {item.headline && (
                <Typography variant="h5" fontWeight={700} sx={{ width: "100%", textAlign: itemAlign }}>
                  {item.headline}
                </Typography>
              )}
              {item.description && (
                <Typography variant="body2" color="text.secondary" sx={{ width: "100%", textAlign: itemAlign }}>
                  {item.description}
                </Typography>
              )}
              {item.cta?.label && (
                <Button
                  {...(item.cta.to
                    ? { component: RouterLink, to: item.cta.to }
                    : item.cta.href
                      ? { component: "a", href: item.cta.href, target: item.cta.target || "_blank", rel: item.cta.rel || "noreferrer" }
                      : {})}
                  variant="text"
                  color={item.cta.color || "primary"}
                  sx={{ mt: "auto", fontWeight: 600, textTransform: "none", alignSelf: itemAlign === "center" ? "center" : "flex-start" }}
                >
                  {item.cta.label}
                </Button>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default InsightHighlight;
