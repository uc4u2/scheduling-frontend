import React, { useMemo, useEffect, useCallback, useState, useRef } from "react";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Paper,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Link as MuiLink,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import ApiIcon from "@mui/icons-material/Api";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useTheme, alpha } from "@mui/material/styles";
import { useTranslation, Trans } from "react-i18next";
import Meta from "../../components/Meta";
import HeroShowcase from "../components/HeroShowcase";
import FeatureCardShowcase from "../components/FeatureCardShowcase";
import FloatingBlob from "../../components/ui/FloatingBlob";
import automationJourney from "../../assets/marketing/automation-journey.png";

const HERO_PRIMARY_CTA_TARGET = "#search";
const HERO_SECONDARY_CTA_TARGET = "#api-reference";
const QUICK_LINK_TOPICS_COUNT = 3;
const QUICK_LINK_CONFIG = [
  { key: "gettingStarted", anchor: "getting-started" },
  { key: "userGuides", anchor: "user-guides" },
  { key: "apiReference", anchor: "api-reference" },
  { key: "integrations", anchor: "integrations" },
  { key: "faq", anchor: "faq" },
  { key: "changelog", anchor: "changelog" },
];
const QUICK_LINK_ICON_MAP = {
  apiReference: ApiIcon,
  integrations: IntegrationInstructionsIcon,
};
const DEFAULT_QUICK_LINK_ICON = AutoStoriesIcon;
const INTEGRATION_STATUS_COLORS = {
  available: "success",
  beta: "warning",
};
const SUPPORT_LINK_PATH = "/client/support";
const SUPPORT_EMAIL = "support@schedulaa.com";
const STATUS_PAGE_HREF = "/status";
const PRIVACY_PAGE_HREF = "/privacy";
const TERMS_PAGE_HREF = "/terms";

const ACCOUNTING_GUIDE_CONFIG = [
  {
    id: "quickbooks-onboarding",
    translationKey: "quickbooks",
    ctaHref: "/manager/dashboard?view=settings&tab=quickbooks",
  },
  {
    id: "xero-onboarding",
    translationKey: "xero",
    ctaHref: "/manager/dashboard?view=settings&tab=xero",
  },
];

const DocsPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const marketing = theme.marketing || {};

  const metaContent = useMemo(() => t("landing.docsPage.meta", { returnObjects: true }), [t]);
  const heroContent = useMemo(() => t("landing.docsPage.hero", { returnObjects: true }), [t]);
  const quickLinksContent = useMemo(() => t("landing.docsPage.quickLinks", { returnObjects: true }), [t]);
  const searchContent = useMemo(() => t("landing.docsPage.search", { returnObjects: true }), [t]);
  const gettingStartedContent = useMemo(() => t("landing.docsPage.gettingStarted", { returnObjects: true }), [t]);
  const productGuidesContent = useMemo(() => t("landing.docsPage.productGuides", { returnObjects: true }), [t]);
  const apiReferenceContent = useMemo(() => t("landing.docsPage.apiReference", { returnObjects: true }), [t]);
  const integrationsContent = useMemo(() => t("landing.docsPage.integrations", { returnObjects: true }), [t]);
  const faqContent = useMemo(() => t("landing.docsPage.faq", { returnObjects: true }), [t]);
  const changelogContent = useMemo(() => t("landing.docsPage.changelog", { returnObjects: true }), [t]);
  const footerContent = useMemo(() => t("landing.docsPage.footer", { returnObjects: true }), [t]);
  const accountingGuidesContent = useMemo(() => t("landing.docsPage.accountingGuides", { returnObjects: true }), [t]);
  const accountingGuideEntries = useMemo(() => accountingGuidesContent?.guides || {}, [accountingGuidesContent]);
  const accountingGuides = useMemo(() => {
    return ACCOUNTING_GUIDE_CONFIG.map((guide) => {
      const guideCopy = accountingGuideEntries?.[guide.translationKey] || {};
      const fallbackTitle = guideCopy.title || guide.id.replace(/-/g, " ");
      const summary = guideCopy.summary || "";
      return {
        ...guide,
        eyebrow: guideCopy.eyebrow || "",
        title: fallbackTitle,
        summary,
        quickLinkLabel: guideCopy.quickLinkLabel || fallbackTitle,
        quickLinkDescription: guideCopy.quickLinkDescription || summary || fallbackTitle,
        sections: Array.isArray(guideCopy.sections) ? guideCopy.sections : [],
        cta: {
          label: guideCopy.ctaLabel || "",
          href: guide.ctaHref,
        },
      };
    });
  }, [accountingGuideEntries]);

  const heroTitle = useMemo(() => {
    const title = heroContent?.title;
    if (Array.isArray(title)) {
      return title;
    }
    return title ? [title] : [];
  }, [heroContent]);

  const quickLinkItems = useMemo(() => {
    return QUICK_LINK_CONFIG.map((config) => {
      const item = quickLinksContent?.items?.[config.key] || {};
      return {
        ...config,
        label: item.label || "",
        description: item.description || "",
      };
    });
  }, [quickLinksContent]);

  const accountingQuickLinks = useMemo(
    () =>
      accountingGuides.map((guide) => ({
        key: guide.id,
        anchor: `accounting-guide-${guide.id}`,
        label: guide.quickLinkLabel || guide.title,
        description: guide.quickLinkDescription || guide.summary,
      })),
    [accountingGuides]
  );

  const combinedQuickLinkItems = useMemo(() => [...quickLinkItems, ...accountingQuickLinks], [quickLinkItems, accountingQuickLinks]);
  const prioritizedChipTopics = useMemo(() => {
    return [...accountingQuickLinks, ...quickLinkItems].slice(0, QUICK_LINK_TOPICS_COUNT);
  }, [accountingQuickLinks, quickLinkItems]);

  const highlightCards = useMemo(() => {
    return combinedQuickLinkItems.map((link) => {
      const IconComponent = QUICK_LINK_ICON_MAP[link.key] || DEFAULT_QUICK_LINK_ICON;
      return {
        title: link.label,
        description: link.description,
        icon: <IconComponent fontSize="small" />,
        cta: {
          label: quickLinksContent?.ctaLabel || "",
          href: `#${link.anchor}`,
        },
      };
    });
  }, [combinedQuickLinkItems, quickLinksContent]);

  const onboardingCards = useMemo(() => gettingStartedContent?.cards || [], [gettingStartedContent]);
  const guideSections = useMemo(() => productGuidesContent?.cards || [], [productGuidesContent]);
  const apiEndpoints = useMemo(() => apiReferenceContent?.endpoints || [], [apiReferenceContent]);
  const hasApiEndpoints = apiEndpoints.length > 0;
  const integrationItems = useMemo(() => integrationsContent?.items || [], [integrationsContent]);
  const integrationStatusLabels = useMemo(() => integrationsContent?.statusLabels || {}, [integrationsContent]);
  const faqItems = useMemo(() => faqContent?.items || [], [faqContent]);
  const faqSchemaItems = useMemo(() => faqContent?.schema || [], [faqContent]);
  const changelogReleases = useMemo(() => changelogContent?.releases || [], [changelogContent]);

  const scrollToAnchor = useCallback((anchorId) => {
    if (!anchorId) return;
    const element = document.getElementById(anchorId);
    if (element) {
      const offset = window.innerWidth < 960 ? 120 : 160;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    }
  }, []);

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const topicParam = searchParams.get("topic");
  const pendingGuideScrollRef = useRef(null);
  const [expandedGuideId, setExpandedGuideId] = useState(null);

  useEffect(() => {
    if (location.hash) {
      scrollToAnchor(location.hash.replace("#", ""));
    }
  }, [location.hash, scrollToAnchor]);

  useEffect(() => {
    if (topicParam) {
      const targetId = `accounting-guide-${topicParam}`;
      pendingGuideScrollRef.current = targetId;
      scrollToAnchor(targetId);
      setExpandedGuideId(topicParam);
    }
  }, [topicParam, scrollToAnchor]);

  useEffect(() => {
    if (!expandedGuideId && accountingGuides.length) {
      setExpandedGuideId(accountingGuides[0].id);
    }
  }, [accountingGuides, expandedGuideId]);

  useEffect(() => {
    if (pendingGuideScrollRef.current && expandedGuideId && pendingGuideScrollRef.current.endsWith(expandedGuideId)) {
      scrollToAnchor(pendingGuideScrollRef.current);
      pendingGuideScrollRef.current = null;
    }
  }, [expandedGuideId, scrollToAnchor]);

  const handleGuideChange = useCallback(
    (guideId) => (_, isExpanded) => {
      setExpandedGuideId(isExpanded ? guideId : null);
    },
    []
  );

  useEffect(() => {
    const scriptId = "schedulaa-docs-faq-jsonld";
    const existing = document.getElementById(scriptId);

    if (!faqSchemaItems.length) {
      if (existing) {
        existing.remove();
      }
      return;
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqSchemaItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = scriptId;
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [faqSchemaItems]);

  const heroBadge = useMemo(
    () => (
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.88)}, ${alpha(theme.palette.secondary.main, 0.6)})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.palette.common.white,
            boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.35)}`,
          }}
        >
          <AutoStoriesIcon fontSize="small" />
        </Box>
        <Stack spacing={0.25}>
          <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: 0.18, color: alpha(theme.palette.primary.main, 0.85) }}>
            {heroContent?.badge?.overline || ""}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
            {heroContent?.badge?.title || ""}
          </Typography>
        </Stack>
      </Stack>
    ),
    [heroContent, theme]
  );

  const metaOg = metaContent?.og || {};

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title={metaContent?.title || ""}
        description={metaContent?.description || ""}
        canonical={metaContent?.canonical || ""}
        og={{
          title: metaOg.title || "",
          description: metaOg.description || "",
          image: metaOg.image || "",
        }}
      />

      <HeroShowcase
        eyebrow={heroContent?.eyebrow || ""}
        title={heroTitle}
        subtitle={heroContent?.subtitle || ""}
        primaryCTA={{ label: heroContent?.primaryCta?.label || "", to: HERO_PRIMARY_CTA_TARGET }}
        secondaryCTA={{ label: heroContent?.secondaryCta?.label || "", to: HERO_SECONDARY_CTA_TARGET, variant: "outlined" }}
        media={{ src: automationJourney, alt: heroContent?.mediaAlt || "" }}
        titleBadge={heroBadge}
        blobs={[
          { key: "docs-primary", color: theme.palette.primary.main, size: 1280, opacity: 0.22, sx: { top: -260, left: -240 } },
          { key: "docs-accent", color: theme.palette.secondary.main, size: 920, opacity: 0.18, sx: { bottom: -260, right: -220 } },
        ]}
      />

      <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 4, md: 6 } }}>
        <Stack spacing={2} maxWidth={840}>
          <Typography variant="body1" color="text.secondary">
            Schedulaa documentation covers everything from website setup and Stripe payments to payroll exports and analytics. It also outlines the upcoming public API and SSO integrations so you know what's on the roadmap.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button component={Link} to="/features" variant="contained" color="primary" sx={{ textTransform: "none", borderRadius: 999 }}>
              Explore features
            </Button>
            <Button component={Link} to="/marketing/analytics-dashboard" variant="outlined" color="primary" sx={{ textTransform: "none", borderRadius: 999 }}>
              View analytics suite
            </Button>
          </Stack>
        </Stack>
      </Box>

      <FeatureCardShowcase
        eyebrow={quickLinksContent?.eyebrow || ""}
        title={quickLinksContent?.title || ""}
        subtitle={quickLinksContent?.subtitle || ""}
        cards={highlightCards}
        cardContentAlign="center"
      />

      <Box sx={{ px: { xs: 2, md: 6 }, pb: { xs: 10, md: 14 } }}>
          <Stack spacing={8}>
            <Stack id="payroll-coverage" spacing={3}>
              <Typography variant="h4" component="h2" fontWeight={700}>
                Payroll coverage (2025)
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  px: { xs: 4, md: 6 },
                  py: { xs: 4, md: 6 },
                  borderRadius: marketing.radius?.lg || 24,
                  border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 2.5, md: 3 },
                  ml: { xs: 0, md: 3, lg: 5 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "1.4rem", md: "1.6rem" },
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                  gutterBottom
                >
                  🇺🇸 U.S. payroll coverage
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ textAlign: "center" }}
                >
                  Our payroll engine calculates core federal and state payroll items for most U.S. states.
                </Typography>
                <Typography variant="subtitle2" gutterBottom>Supported</Typography>
                <List
                  dense
                  sx={{
                    pl: 0,
                    ml: { xs: 0, md: 1.5 },
                    "& .MuiListItem-root": { alignItems: "flex-start", py: 0.75 },
                    "& .MuiListItemText-root": { m: 0, "& .MuiTypography-root": { lineHeight: 1.6 } },
                  }}
                >
                  {[
                    "Federal income tax (IRS brackets)",
                    "State income tax (where applicable)",
                    "FICA (Social Security & Medicare)",
                    "Employer unemployment: SUI/SUTA reporting",
                    "PTO & basic leave tracking",
                    "Payroll exports (PDF / CSV / XLSX)",
                    "Year-end forms: W-2 generation / export",
                  ].map((item) => (
                    <ListItem key={item} sx={{ pl: 0 }}>
                      <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={`✅ ${item}`} />
                    </ListItem>
                  ))}
                </List>
                <Typography variant="subtitle2" gutterBottom>Not supported / not automated</Typography>
                <List
                  dense
                  sx={{
                    pl: 0,
                    mb: 1,
                    "& .MuiListItem-root": { alignItems: "flex-start", py: 0.75 },
                    "& .MuiListItemText-root": { m: 0, "& .MuiTypography-root": { lineHeight: 1.6 } },
                  }}
                >
                  {[
                    "Local or city income taxes",
                    "State disability / paid family programs",
                    "Wage garnishments & legal holds",
                  ].map((item) => (
                    <ListItem key={item} sx={{ pl: 0 }}>
                      <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={`❌ ${item}`} />
                    </ListItem>
                  ))}
                </List>
                <Typography variant="body2" color="text.secondary">
                  Fully supported states (2025): Alabama, Arizona, Arkansas, California***, Colorado, Connecticut, Delaware, District of Columbia (DC), Florida, Georgia, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland**, Massachusetts, Michigan, Minnesota, Mississippi, Missouri**, Montana, Nebraska, Nevada, New Hampshire*, New Jersey**, New Mexico, North Carolina, North Dakota, Ohio**, Oklahoma, Oregon**, Pennsylvania**, South Carolina, South Dakota, Tennessee*, Texas, Utah, Vermont, Virginia, Washington**, West Virginia, Wisconsin, Wyoming.
                </Typography>

                <Typography variant="caption" color="text.secondary" component="div"
                  sx={{ mt: 2, textAlign: 'left', ml: { xs: 0, md: 1.5 } }}
                >
                  * TN & NH: No earned income tax (only dividend/interest).<br />
                  ** Local/city levies may apply and are not automated.<br />
                  *** CA SDI must be handled externally when required.
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="div"
                  sx={{ mt: 1.5, pb: 1, pl: { xs: 0, md: 2 } }}
                >
                  
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  px: { xs: 4, md: 6 },
                  py: { xs: 4, md: 6 },
                  borderRadius: marketing.radius?.lg || 24,
                  border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 2.5, md: 3 },
                  ml: { xs: 0, md: 3, lg: 5 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "1.4rem", md: "1.6rem" },
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                  gutterBottom
                >
                  🇨🇦 Canadian payroll coverage
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ textAlign: "center" }}
                >
                  Schedulaa’s CRA-compliant engine covers all provinces except Québec.
                </Typography>
                <Typography variant="subtitle2" gutterBottom>Supported</Typography>
                <List
                  dense
                  sx={{
                    pl: 0,
                    ml: { xs: 0, md: 1.5 },
                    "& .MuiListItem-root": { alignItems: "flex-start", py: 0.75 },
                    "& .MuiListItemText-root": { m: 0, "& .MuiTypography-root": { lineHeight: 1.6 } },
                  }}
                >
                  {[
                    "Federal & provincial income tax (outside QC)",
                    "CPP (Canada Pension Plan)",
                    "EI (Employment Insurance)",
                    "Vacation pay & accrual logic",
                    "Automated stat holiday pay calculation",
                    "Paid vs unpaid leave tracking",
                    "BPA (Basic Personal Amount) with pro-rata and YTD",
                    "T4 generation / export",
                    "ROE (Record of Employment) creation / export",
                  ].map((item) => (
                    <ListItem key={item} sx={{ pl: 0 }}>
                      <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={`✅ ${item}`} />
                    </ListItem>
                  ))}
                </List>
                <Typography variant="subtitle2" gutterBottom>Not supported / not automated</Typography>
                <List
                  dense
                  sx={{
                    pl: 0,
                    mb: 1,
                    "& .MuiListItem-root": { alignItems: "flex-start", py: 0.75 },
                    "& .MuiListItemText-root": { m: 0, "& .MuiTypography-root": { lineHeight: 1.6 } },
                  }}
                >
                  {[
                    "Québec payroll (QPP, RQAP/QPIP)",
                  ].map((item) => (
                    <ListItem key={item} sx={{ pl: 0 }}>
                      <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={`❌ ${item}`} />
                    </ListItem>
                  ))}
                </List>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  px: { xs: 4, md: 5 },
                  py: { xs: 3.5, md: 5 },
                  borderRadius: marketing.radius?.lg || 24,
                  border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
                  ml: { xs: 0, md: 3, lg: 5 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontSize: { xs: "1.2rem", md: "1.4rem" }, fontWeight: 700 }}
                  gutterBottom
                >
                  ⚠️ Known limitations
                </Typography>
                <List
                  dense
                  sx={{
                    pl: 0,
                    ml: { xs: 0, md: 1.5 },
                    "& .MuiListItem-root": { alignItems: "flex-start", py: 0.75 },
                    "& .MuiListItemText-root": { m: 0, "& .MuiTypography-root": { lineHeight: 1.6 } },
                  }}
                >
                  {[
                    "Local / city taxes (U.S.)",
                    "Garnishments & legal holds",
                    "Fringe benefit taxation",
                    "Québec payroll",
                  ].map((item) => (
                    <ListItem key={item} sx={{ pl: 0 }}>
                      <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={`❌ ${item}`} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Stack>
          <Paper id="search" elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: marketing.radius?.lg || 24, border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}` }}>
            <Stack spacing={2}>
              <Typography variant="h5" component="h2" fontWeight={700}>
                {searchContent?.title || ""}
              </Typography>
              <TextField
                placeholder={searchContent?.placeholder || ""}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.disabled' }} /> }}
                fullWidth
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} color="text.secondary">
                <Typography variant="body2">{searchContent?.commonTopicsLabel || ""}</Typography>
                <Stack direction="row" spacing={1}>
                  {prioritizedChipTopics.map((link) => (
                    <Chip key={link.anchor} label={link.label} component="a" href={`#${link.anchor}`} clickable size="small" />
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          <Stack id="getting-started" spacing={3}>
            <Typography variant="h4" component="h2" fontWeight={700}>
              {gettingStartedContent?.title || ""}
            </Typography>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {onboardingCards.map((card) => (
                <Grid item xs={12} md={4} key={card.title}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      borderRadius: marketing.radius?.lg || 24,
                      border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ width: '100%', textAlign: 'center' }}>
                      {card.title}
                    </Typography>
                    <List dense sx={{ width: '100%', textAlign: 'center', py: 0 }}>
                      {(card.items || []).map((item) => (
                        <ListItem key={item} sx={{ pl: 0, justifyContent: 'center' }}>
                          <ListItemText
                            primaryTypographyProps={{ variant: "body2", color: "text.secondary", textAlign: "center" }}
                            primary={item}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>

          <Stack id="user-guides" spacing={3}>
            <Typography variant="h4" component="h2" fontWeight={700}>
              {productGuidesContent?.title || ""}
            </Typography>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {guideSections.map((section) => (
                <Grid item xs={12} md={4} key={section.title}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      borderRadius: marketing.radius?.lg || 24,
                      border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      {section.title}
                    </Typography>
                    <List dense sx={{ width: '100%', textAlign: 'center', py: 0 }}>
                      {(section.highlights || []).map((highlight) => (
                        <ListItem key={highlight} sx={{ pl: 0, justifyContent: 'center' }}>
                          <ListItemText
                            primaryTypographyProps={{ variant: "body2", color: "text.secondary", textAlign: "center" }}
                            primary={highlight}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>

          <Stack id="accounting-guides" spacing={3}>
            <Stack spacing={1}>
              <Typography variant="h4" component="h2" fontWeight={700}>
                {accountingGuidesContent?.title || "Accounting guides"}
              </Typography>
              {accountingGuidesContent?.subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {accountingGuidesContent.subtitle}
                </Typography>
              )}
            </Stack>
            <Stack spacing={2}>
              {accountingGuides.map((guide) => (
                <Accordion
                  key={guide.id}
                  id={`accounting-guide-${guide.id}`}
                  expanded={expandedGuideId === guide.id}
                  onChange={handleGuideChange(guide.id)}
                  disableGutters
                  square={false}
                  sx={{
                    borderRadius: marketing.radius?.lg || 24,
                    border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
                    scrollMarginTop: { xs: 96, md: 140 },
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`${guide.id}-content`}
                    id={`${guide.id}-header`}
                    sx={{
                      px: { xs: 2, md: 3 },
                      py: { xs: 2, md: 2.5 },
                      "& .MuiAccordionSummary-content": { margin: 0 },
                    }}
                  >
                    <Stack spacing={0.5}>
                      {guide.eyebrow ? (
                        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.3, textTransform: "uppercase" }}>
                          {guide.eyebrow}
                        </Typography>
                      ) : null}
                      <Typography variant="h6" component="h3" fontWeight={700}>
                        {guide.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {guide.summary}
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2.5, md: 3 } }}>
                    <Stack spacing={2.5}>
                      {guide.sections.map((section) => (
                        <Box key={`${guide.id}-${section.heading}`}>
                          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                            {section.heading}
                          </Typography>
                          <List dense sx={{ pl: 0, "& .MuiListItem-root": { pl: 0 } }}>
                            {(section.items || []).map((item) => (
                              <ListItem key={item} sx={{ pl: 0 }}>
                                <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={item} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      ))}
                      {guide.cta?.label ? (
                        <Box>
                          <Button component={Link} to={guide.cta.href} variant="contained" color="primary" sx={{ textTransform: "none" }}>
                            {guide.cta.label}
                          </Button>
                        </Box>
                      ) : null}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </Stack>

          <Stack id="api-reference" spacing={3}>
            <Typography variant="h4" component="h2" fontWeight={700}>
              {apiReferenceContent?.title || ""}
            </Typography>
            {hasApiEndpoints ? (
              <>
                <TableContainer
                  component={Paper}
                  sx={{
                    borderRadius: marketing.radius?.lg || 24,
                    border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
                    overflowX: 'auto',
                    px: { xs: 3, md: 9 },
                    py: { xs: 3.5, md: 5 },
                    ml: { xs: 1.5, md: 2.5 },
                  }}
                >
                  <Table sx={{ minWidth: 860, '& th': { pl: 3 }, '& td': { pl: 3 }, '& th:first-of-type, & td:first-of-type': { pl: { xs: 6, md: 9 } } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 140 }}>{apiReferenceContent?.tableHeaders?.category || ""}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 120 }}>{apiReferenceContent?.tableHeaders?.method || ""}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 200 }}>{apiReferenceContent?.tableHeaders?.path || ""}</TableCell>
                        <TableCell>{apiReferenceContent?.tableHeaders?.summary || ""}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {apiEndpoints.map((row, index) => (
                        <TableRow key={`${row.key || row.path}-${index}`}>
                          <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.category}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.method}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <code>{row.path}</code>
                          </TableCell>
                          <TableCell>{row.summary}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="body2" color="text.secondary">
                  {apiReferenceContent?.tip || ""}
                </Typography>
              </>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: marketing.radius?.lg || 24,
                  border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
                  px: { xs: 3, md: 6 },
                  py: { xs: 3.5, md: 4 },
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {apiReferenceContent?.comingSoon || "Public API and SSO documentation will be published closer to launch."}
                </Typography>
              </Paper>
            )}
          </Stack>

          <Stack id="integrations" spacing={3}>
            <Typography variant="h4" component="h2" fontWeight={700}>
              {integrationsContent?.title || ""}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {integrationsContent?.description || ""}
            </Typography>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {integrationItems.map((integration) => (
                <Grid item xs={12} md={4} key={integration.name}>
                  <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: marketing.radius?.lg || 24, border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}` }}>
                    <Stack spacing={1} sx={{ ml: { xs: 0, md: 3, lg: 5 } }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" fontWeight={700}>
                          {integration.name}
                        </Typography>
                        <Chip
                          label={integrationStatusLabels[integration.status] || integration.status}
                          size="small"
                          color={INTEGRATION_STATUS_COLORS[integration.status] || "default"}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {integration.details}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>

          <Stack id="faq" spacing={3}>
            <Typography variant="h4" component="h2" fontWeight={700}>
              {faqContent?.title || ""}
            </Typography>
            <Stack spacing={2.5}>
              {faqItems.map((faq) => (
                <Paper key={faq.question} elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: marketing.radius?.lg || 24, border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}` }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    {faq.question}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Stack>

          <Stack id="changelog" spacing={3}>
            <Typography variant="h4" component="h2" fontWeight={700}>
              {changelogContent?.title || ""}
            </Typography>
            <Stack spacing={3}>
              {changelogReleases.map((release) => (
                <Paper key={release.version} elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: marketing.radius?.lg || 24, border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}` }}>
                  <Stack spacing={1} sx={{ ml: { xs: 0, md: 3, lg: 5 } }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="subtitle1" fontWeight={700}>
                        {release.version}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {release.date}
                      </Typography>
                    </Stack>
                    <List dense>
                      {(release.entries || []).map((entry, entryIndex) => (
                        <ListItem key={`${release.version}-${entryIndex}`} sx={{ pl: 0 }}>
                          <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={entry} />
                        </ListItem>
                      ))}
                    </List>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>

          <Divider />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <Trans
                  i18nKey="landing.docsPage.footer.helpText"
                  components={{
                    supportLink: <MuiLink component={Link} to={SUPPORT_LINK_PATH} />,
                    supportEmail: <MuiLink href={`mailto:${SUPPORT_EMAIL}`} />,
                  }}
                />
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" justifyContent={{ xs: "flex-start", md: "flex-end" }} spacing={2}>
                <MuiLink href={STATUS_PAGE_HREF} underline="hover">
                  {footerContent?.links?.status || ""}
                </MuiLink>
                <MuiLink href={PRIVACY_PAGE_HREF} underline="hover">
                  {footerContent?.links?.privacy || ""}
                </MuiLink>
                <MuiLink href={TERMS_PAGE_HREF} underline="hover">
                  {footerContent?.links?.terms || ""}
                </MuiLink>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Box>

      <Box sx={{ position: "relative", py: { xs: 8, md: 10 } }}>
        <FloatingBlob enableMotion color={theme.palette.primary.main} size={960} opacity={0.14} duration={28} sx={{ top: -200, right: -200 }} />
      </Box>
    </Box>
  );
};

export default DocsPage;
