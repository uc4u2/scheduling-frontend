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
import JsonLd from "../../../components/seo/JsonLd";

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

const ComparisonPage = ({ pageType = "compare" }) => {
  const { vendor } = useParams();
  const rawSlug = vendor?.toLowerCase();
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

  const resolveComparisonKey = (slug) => {
    if (!slug) return null;
    const direct = fallbackT(`landing.compare.${slug}`, {
      returnObjects: true,
      defaultValue: null,
    });
    if (direct) return slug;
    if (pageType === "alternatives") {
      const prefixed = `schedulaa-vs-${slug}`;
      const prefixedData = fallbackT(`landing.compare.${prefixed}`, {
        returnObjects: true,
        defaultValue: null,
      });
      if (prefixedData) return prefixed;
    }
    return null;
  };

  const comparisonKey = useMemo(() => resolveComparisonKey(rawSlug), [rawSlug, pageType, fallbackT]);

  const comparison = useMemo(() => {
    if (!comparisonKey) return null;
    const english = fallbackT(`landing.compare.${comparisonKey}`, {
      returnObjects: true,
      defaultValue: null,
    });
    if (!english) return null;
    const localized = t(`landing.compare.${comparisonKey}`, {
      returnObjects: true,
      defaultValue: null,
    });
    return mergeData(english, localized);
  }, [comparisonKey, t, fallbackT, currentLanguage]);

  const pageUrl = comparisonKey
    ? `https://www.schedulaa.com/${pageType}/${pageType === "alternatives" ? rawSlug : comparisonKey}`
    : `https://www.schedulaa.com/${pageType}`;
  const comparisonData = comparison || {};
  const {
    metaTitle = "",
    metaDescription = "",
    heroTitle = "",
    heroSubtitle = "",
    intro = [],
    executiveOverview,
    differentiators = [],
    contextBlock,
    summaryTable,
    complianceSafeguards,
    bridgeSection,
    featureGrid,
    fitMatrix = [],
    testimonial,
    conclusion,
    competitor,
    competitorName,
  } = comparisonData;
  const displayCompetitor = competitorName || competitor;
  const isAlternatives = pageType === "alternatives";
  const alternativeSlug = comparisonKey?.startsWith("schedulaa-vs-")
    ? comparisonKey.replace(/^schedulaa-vs-/, "")
    : comparisonKey;
  const alternativesOverrides = useMemo(() => {
    if (!isAlternatives || !alternativeSlug) return null;
    const direct = fallbackT(`landing.alternatives.${alternativeSlug}`, {
      returnObjects: true,
      defaultValue: null,
    });
    if (direct) return direct;
    return fallbackT(`landing.compare.${comparisonKey}.alternatives`, {
      returnObjects: true,
      defaultValue: null,
    });
  }, [alternativeSlug, comparisonKey, fallbackT, isAlternatives]);
  const altMetaTitle = displayCompetitor
    ? alternativesOverrides?.metaTitle || `Best ${displayCompetitor} alternatives for service teams | Schedulaa`
    : metaTitle;
  const altMetaDescription = displayCompetitor
    ? alternativesOverrides?.metaDescription || `Looking for ${displayCompetitor} alternatives? Compare Schedulaa with ${displayCompetitor} and see which platform fits operations, payroll, and compliance for service teams.`
    : metaDescription;
  const altHeroTitle = displayCompetitor
    ? alternativesOverrides?.heroTitle || `${displayCompetitor} alternatives for modern service teams`
    : heroTitle;
  const altHeroSubtitle = displayCompetitor
    ? alternativesOverrides?.heroSubtitle || `Compare Schedulaa with ${displayCompetitor} and see why service teams choose an operations-first platform.`
    : heroSubtitle;
  const altIntro = displayCompetitor
    ? [
        `Looking for ${displayCompetitor} alternatives? This guide compares Schedulaa and ${displayCompetitor} across booking, scheduling, payroll, and compliance for service teams.`,
        "Schedulaa replaces disconnected tools with an operations OS that unifies service delivery, payroll, and billing in one workflow.",
        ...(alternativesOverrides?.whySwitch
          ? [`Why teams switch from ${displayCompetitor}: ${alternativesOverrides.whySwitch}`]
          : []),
      ]
    : intro;
  const schemaEntries = useMemo(() => {
    const base = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: isAlternatives ? altMetaTitle : metaTitle,
      description: isAlternatives ? altMetaDescription : metaDescription,
      url: pageUrl,
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.schedulaa.com/" },
        {
          "@type": "ListItem",
          position: 2,
          name: isAlternatives ? "Alternatives" : "Compare",
          item: `https://www.schedulaa.com/${pageType}`,
        },
        { "@type": "ListItem", position: 3, name: isAlternatives ? altHeroTitle : heroTitle, item: pageUrl },
      ],
    };
    return [base, breadcrumb];
  }, [altHeroTitle, altMetaDescription, altMetaTitle, heroTitle, isAlternatives, metaDescription, metaTitle, pageType, pageUrl]);
  const defaultOgImage = "https://www.schedulaa.com/og/compare.jpg";
  const pageOg = {
    title: isAlternatives ? altMetaTitle : metaTitle,
    description: isAlternatives ? altMetaDescription : metaDescription,
    image: comparison?.metaOgImage || defaultOgImage,
  };

  if (!comparison) {
    if (pageType === "alternatives") {
      return (
        <Box sx={{ py: 12, textAlign: "center" }}>
          <Meta title="Page not found | Schedulaa" robots="noindex, nofollow" />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Page not found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We could not find that alternatives page.
          </Typography>
          <Button component={RouterLink} to="/compare" sx={{ mt: 3 }} variant="contained">
            View comparisons
          </Button>
        </Box>
      );
    }
    return <Navigate to="/pricing" replace />;
  }

  const downloadUrl =
    comparisonKey === "quickbooks-payroll"
      ? "https://www.schedulaa.com/resources/schedulaa-vs-quickbooks-payroll.doc"
      : null;
  const downloadLabel =
    comparisonKey === "quickbooks-payroll"
      ? "Download comparison (DOC)"
      : null;

  const faqSchema = isAlternatives && displayCompetitor ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What are the best ${displayCompetitor} alternatives?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Schedulaa is a top ${displayCompetitor} alternative for service teams that need booking, scheduling, payroll, and compliance in one workflow.`,
        },
      },
      {
        "@type": "Question",
        name: `Is Schedulaa a good alternative to ${displayCompetitor}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Schedulaa connects operations, payroll, and billing so teams avoid disconnected tools and manual reconciliation.",
        },
      },
      {
        "@type": "Question",
        name: `${displayCompetitor} vs Schedulaa — what is the difference?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Schedulaa is an operations OS with scheduling, payroll, compliance, and analytics, while most competitors focus on a narrower part of the workflow.",
        },
      },
      {
        "@type": "Question",
        name: `Which teams choose ${displayCompetitor} alternatives?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Service businesses, staffing teams, and multi-location operators that need verified payroll data tied to scheduling and billing.",
        },
      },
    ],
  } : null;

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title={isAlternatives ? altMetaTitle : metaTitle}
        description={isAlternatives ? altMetaDescription : metaDescription}
        canonical={pageUrl}
        og={pageOg}
        twitter={pageOg}
      />
      {schemaEntries.map((schema, idx) => (
        <JsonLd key={idx} data={schema} />
      ))}
      {faqSchema ? <JsonLd data={faqSchema} /> : null}

      <FloatingBlob enableMotion color="#0ea5e9" size={1040} opacity={0.1} duration={32} sx={{ top: -220, left: -200 }} />
      <FloatingBlob enableMotion color="#34d399" size={960} opacity={0.08} duration={30} sx={{ bottom: -260, right: -220 }} />

      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 }, position: "relative", zIndex: 1 }}>
        <Stack spacing={2} textAlign="center">
          <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={0.4}>
            {isAlternatives ? "Alternatives guide" : "Comparison guide"}
          </Typography>
          <Typography variant="h3" fontWeight={800}>
            {isAlternatives ? altHeroTitle : heroTitle}
          </Typography>
          {comparisonKey !== "paychex" && heroSubtitle ? (
            <Typography variant="subtitle1" color="text.secondary" maxWidth={760} mx="auto">
              {isAlternatives ? altHeroSubtitle : heroSubtitle}
            </Typography>
          ) : null}
        </Stack>

        <Stack spacing={2.5} mt={4}>
          {[
            ...(comparisonKey === "paychex" && heroSubtitle ? [heroSubtitle] : []),
            ...(isAlternatives ? altIntro : intro),
          ].map((paragraph) => (
            <Typography key={paragraph} variant="body1" color="text.secondary" textAlign="left">
              {paragraph}
            </Typography>
          ))}
          {contextBlock?.title ? (
            <Typography variant="h5" fontWeight={800} sx={{ pt: 2 }}>
              {contextBlock.title}
            </Typography>
          ) : null}
          {(contextBlock?.paragraphs || []).map((paragraph) => (
            <Typography key={paragraph} variant="body1" color="text.secondary" textAlign="left">
              {paragraph}
            </Typography>
          ))}
          <Typography variant="body2" color="text.secondary" textAlign="left">
            {isAlternatives ? (
              <>
                Prefer side-by-side?{" "}
                <MuiLink component={RouterLink} to={`/compare/${comparisonKey}`} underline="hover">
                  View the comparison page.
                </MuiLink>
              </>
            ) : (
              <>
                Looking for alternatives?{" "}
                <MuiLink component={RouterLink} to={`/alternatives/${alternativeSlug}`} underline="hover">
                  Explore alternatives.
                </MuiLink>
              </>
            )}
          </Typography>
          {downloadUrl && (
            <Button
              component="a"
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              color="primary"
              sx={{ alignSelf: "center", borderRadius: 999, px: 4 }}
            >
              {downloadLabel}
            </Button>
          )}
        </Stack>

        <ComparisonTable
          headers={(executiveOverview && executiveOverview.headers) || []}
          rows={(executiveOverview && executiveOverview.rows) || []}
        />

        <Box component="section" sx={{ mt: 6 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {isAlternatives ? "Why teams choose Schedulaa" : "Key differentiators"}
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

        {bridgeSection?.title ? (
          <Box component="section" sx={{ mt: 6 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              {bridgeSection.title}
            </Typography>
            <Stack spacing={2}>
              {(bridgeSection.paragraphs || []).map((paragraph) => (
                <Typography key={paragraph} variant="body1" color="text.secondary">
                  {paragraph}
                </Typography>
              ))}
            </Stack>
          </Box>
        ) : null}

        {summaryTable?.headers?.length ? (
          <ComparisonTable headers={summaryTable.headers} rows={summaryTable.rows || []} />
        ) : null}

        {complianceSafeguards?.headers?.length ? (
          <Box component="section" sx={{ mt: 6 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Compliance & HR safeguards
            </Typography>
            <ComparisonTable headers={complianceSafeguards.headers} rows={complianceSafeguards.rows || []} />
          </Box>
        ) : null}

        {featureGrid?.headers?.length ? (
          <Box component="section" sx={{ mt: 6 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              At-a-glance feature comparison
            </Typography>
            <ComparisonTable headers={featureGrid.headers} rows={featureGrid.rows || []} />
          </Box>
        ) : null}

        <Box component="section" sx={{ mt: 6 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {isAlternatives ? "Which alternative fits you best?" : "Which platform fits you best?"}
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
              {(fitMatrix || []).map((row) => (
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

        {testimonial?.quote ? (
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
              {testimonial.attribution && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  — {testimonial.attribution}
                </Typography>
              )}
            </Paper>
          </Box>
        ) : null}

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
