import React, { useMemo } from "react";
import { useParams, Link as RouterLink, Navigate } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Grid,
  Divider,
  Link as MuiLink,
  Button,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import Meta from "../../../components/Meta";
import FloatingBlob from "../../../components/ui/FloatingBlob";

const ComparisonTable = ({ headers, rows }) => (
  <Box component="section" sx={{ mt: 4 }}>
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        borderColor: (theme) => alpha(theme.palette.divider, 0.6),
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: `200px repeat(${headers.length - 1}, 1fr)` },
          bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.2 : 0.08),
          px: { xs: 2, md: 3 },
          py: 2,
        }}
      >
        {headers.map((header) => (
          <Typography key={header} variant="subtitle2" fontWeight={700} textTransform="uppercase">
            {header}
          </Typography>
        ))}
      </Box>

      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: `200px repeat(${headers.length - 1}, 1fr)` },
            borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 2.5 },
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: { xs: 1, md: 0 } }}>
            {row.label}
          </Typography>
          <Typography variant="body2" sx={{ mb: { xs: 1, md: 0 } }}>
            {row.schedulaa}
          </Typography>
          <Typography variant="body2">
            {row.competitor}
          </Typography>
        </Box>
      ))}
    </Paper>
  </Box>
);

const ComparisonPage = () => {
  const { vendor } = useParams();
  const normalizedSlug = vendor?.toLowerCase();
  const { t, i18n } = useTranslation();
  const fallbackT = useMemo(() => i18n.getFixedT("en"), [i18n]);
  const currentLanguage = i18n.language;

  const mergeData = (base, overrides) => {
    if (Array.isArray(base)) {
      return overrides && Array.isArray(overrides) ? overrides : base;
    }
    if (base && typeof base === "object") {
      const result = { ...base };
      if (overrides && typeof overrides === "object") {
        Object.keys(overrides).forEach((key) => {
          result[key] =
            key in base
              ? mergeData(base[key], overrides[key])
              : overrides[key];
        });
      }
      return result;
    }
    return overrides === undefined ? base : overrides;
  };

  const comparison = useMemo(() => {
    if (!normalizedSlug) return null;
    const english = fallbackT(`landing.compare.${normalizedSlug}`, {
      returnObjects: true,
      defaultValue: null,
    });
    if (!english) return null;
    const localized = t(`landing.compare.${normalizedSlug}`, {
      returnObjects: true,
      defaultValue: null,
    });
    return mergeData(english, localized);
  }, [normalizedSlug, t, fallbackT, currentLanguage]);

  if (!comparison) {
    return <Navigate to="/pricing" replace />;
  }

  const {
    metaTitle,
    metaDescription,
    heroTitle,
    heroSubtitle,
    intro,
    executiveOverview,
    differentiators,
    summaryTable,
    fitMatrix,
    testimonial,
    conclusion,
  } = comparison;

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title={metaTitle}
        description={metaDescription}
        canonical={`https://www.schedulaa.com/compare/${normalizedSlug}`}
      />

      <FloatingBlob enableMotion color="#0ea5e9" size={1040} opacity={0.1} duration={32} sx={{ top: -220, left: -200 }} />
      <FloatingBlob enableMotion color="#34d399" size={960} opacity={0.08} duration={30} sx={{ bottom: -260, right: -220 }} />

      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 }, position: "relative", zIndex: 1 }}>
        <Stack spacing={2} textAlign="center">
          <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={0.4}>
            Comparison guide
          </Typography>
          <Typography variant="h3" fontWeight={800}>
            {heroTitle}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" maxWidth={760} mx="auto">
            {heroSubtitle}
          </Typography>
        </Stack>

        <Stack spacing={2.5} mt={4}>
          {intro.map((paragraph) => (
            <Typography key={paragraph} variant="body1" color="text.secondary">
              {paragraph}
            </Typography>
          ))}
        </Stack>

        <ComparisonTable headers={executiveOverview.headers} rows={executiveOverview.rows} />

        <Box component="section" sx={{ mt: 6 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Key differentiators
          </Typography>
          <Grid container spacing={3}>
            {differentiators.map((item) => (
              <Grid item xs={12} md={6} key={item.title}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 4,
                    height: "100%",
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.body}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <ComparisonTable headers={summaryTable.headers} rows={summaryTable.rows} />

        <Box component="section" sx={{ mt: 6 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Which platform fits you best?
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 4,
              p: { xs: 2.5, md: 3 },
              borderColor: (theme) => alpha(theme.palette.divider, 0.8),
            }}
          >
            <Stack spacing={2}>
              {fitMatrix.map((row) => (
                <Box key={row.scenario}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    If you are…
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {row.scenario}
                  </Typography>
                  <Typography variant="subtitle2" color="primary" sx={{ mt: 0.5 }}>
                    Choose {row.recommendation}.
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Box>

        <Box component="section" sx={{ mt: 6 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 5,
              p: { xs: 3, md: 4 },
              background: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.25 : 0.08),
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Real-world perspective
            </Typography>
            <Typography variant="h5" fontWeight={600} sx={{ mt: 1 }}>
              “{testimonial.quote}”
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              — {testimonial.attribution}
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ my: 6 }} />

        <Box component="section">
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Conclusion
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {conclusion}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button component={RouterLink} to="/features" variant="contained" color="primary" sx={{ borderRadius: 999, px: 4 }}>
              Explore Schedulaa features
            </Button>
            <Button component={RouterLink} to="/pricing" variant="outlined" color="primary" sx={{ borderRadius: 999, px: 4 }}>
              View pricing
            </Button>
            <Button component={RouterLink} to="/register" variant="text" color="primary" sx={{ borderRadius: 999, px: 4 }}>
              Start free trial
            </Button>
          </Stack>
        </Box>

        <Box component="section" sx={{ mt: 8 }}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Looking for more comparisons? Visit{" "}
            <MuiLink component={RouterLink} to="/pricing" color="primary" underline="hover">
              our pricing page
            </MuiLink>{" "}
            for plan breakdowns or browse the footer links for legal and help documentation.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ComparisonPage;
