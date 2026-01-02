import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  Alert,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BoltIcon from "@mui/icons-material/Bolt";
import HubIcon from "@mui/icons-material/Hub";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PublicIcon from "@mui/icons-material/Public";

import Meta from "../../components/Meta";
import HeroShowcase from "../components/HeroShowcase";
import FeatureCardShowcase from "../components/FeatureCardShowcase";
import PricingTable from "../components/PricingTable";
import platformMap from "../../assets/marketing/platform-map.svg";
import JsonLd from "../../components/seo/JsonLd";
import api from "../../utils/api";

const HERO_PRIMARY_CTA_TO = "/register";
const HERO_SECONDARY_CTA_TO = "#plans";
const CTA_PRIMARY_TO = "/register";
const CTA_SECONDARY_TO = "/contact";

const ASSURANCE_ICON_MAP = {
  noHiddenFees: BoltIcon,
  switchPlans: HubIcon,
  professionReady: AutoAwesomeIcon,
  enterpriseOnboarding: SecurityOutlinedIcon,
  roleAccess: ManageAccountsIcon,
  globalPayments: PublicIcon,
};

const DEFAULT_META = {
  title: "Schedulaa Pricing | Launch on your own domain with automatic SSL",
  description:
    "Compare Starter, Pro, and Business plans. All plans include a custom domain with automatic SSL, plus unified booking, scheduling, payroll, and automation.",
  canonical: "https://www.schedulaa.com/pricing",
  keywords: "Schedulaa pricing, booking software pricing, payroll SaaS pricing, website builder plans",
  og: {
    title: "Schedulaa Pricing",
    description:
      "Plans for every stage. Launch on your own domain with automatic SSL included on every plan.",
    image: "https://www.schedulaa.com/og/pricing.jpg",
  },
};

const DEFAULT_HERO = {
  eyebrow: "Pricing that scales",
  title: [
    "Pricing that grows with you.",
    "Launch on your own domain with automatic SSL.",
  ],
  subtitle:
    "Custom domains (TXT/CNAME) with automatic SSL are now included on every plan. Start with Starter for website + booking, then add staff, payroll, and automations on Pro and Business.",
  primaryCta: { label: "Start free trial" },
  secondaryCta: { label: "Compare plans" },
  badge: {
    overline: "New capability",
    title: "Custom domains + automatic SSL",
  },
  mediaAlt: "Schedulaa pricing overview showing plans and platform map",
};

const DEFAULT_PLANS = [
  {
    key: "starter",
  name: "Starter",
  price: "$19.99/mo",
  description:
    "Launch your website and start taking bookings and payments — perfect for solo professionals.",
  features: [
    "Website builder with branded pages and templates.",
    "Online booking, confirmations, and client portal.",
    "Public “Book with me” link for solo professionals.",
    "Stripe Checkout with Automatic Tax compliance.",
    "1 staff seat and 1 location included.",
    "CSV and PDF reports for revenue and appointments.",
    "Custom domain + automatic SSL included on this plan.",
    "Onboarding workflows available as your team grows.",
  ],
    ctaLabel: "Start free trial",
    ctaTo: HERO_PRIMARY_CTA_TO,
  },
  {
    key: "pro",
    name: "Pro",
    price: "$49.99/mo",
  description:
    "For small teams that need staff scheduling, marketing automation, and analytics.",
  features: [
    "Everything in Starter.",
    "Custom domain + automatic SSL included.",
    "Up to 5 staff seats and 1 location included.",
    "Zapier automation for bookings, shifts, timeclock, breaks, PTO, onboarding, and payroll events.",
    "QuickBooks and Xero exports for payroll and revenue.",
    "Payroll processing included with Employee Payslip Portal (self-serve PDF downloads).",
    "Email campaigns: Broadcast, Win-Back, VIP, No-Show, Anniversary.",
    "Advanced Analytics (bookings, revenue, client segments).",
    "Automated Canadian stat holiday pay and accruals.",
    "Priority support (business hours).",
    ],
    ctaLabel: "Start Pro",
    ctaTo: HERO_PRIMARY_CTA_TO,
    highlight: true,
    badge: "Most popular",
  },
  {
    key: "business",
    name: "Business",
    price: "$119.99/mo",
    description:
      "For established teams managing advanced payroll, compliance, and analytics.",
    features: [
      "Everything in Pro.",
      "10 staff seats and up to 2 locations included.",
      "Add additional staff seats for $9/mo each (scales with your team).",
      "Compliance Documents Pack: W-2 (US), T4 (CA), ROE (CA) creation & export (PDF/XML).",
      "Advanced payroll exports, audits, and tax reports.",
      "Team scheduling controls (bulk close / keep windows).",
      "24/7 priority support.",
      "Free branded website included when using Payroll + Scheduling.",
    ],
    ctaLabel: "Start Business",
    ctaTo: HERO_PRIMARY_CTA_TO,
  },
];


const DEFAULT_ADDONS = {
  title: "Popular add-ons",
  headers: { addon: "Add-on", price: "Price" },
  items: [
    { key: "extraSeat", name: "Additional staff seat", price: "$9/mo" },
  ],
};

const VALUE_NOTE = `
<strong>Bundle value:</strong> Subscribe to <strong>Payroll + Scheduling</strong> and your branded website on your own domain (with automatic SSL) is included for free.
If you only need Website or Booking, <strong>Starter</strong> covers it; <strong>Pro</strong> adds staff scheduling, payroll, and automations, and <strong>Business</strong> adds full payroll compliance documents and multi-location controls.
`;

const DEFAULT_CTA = {
  eyebrow: "Launch today",
  title: "Start your free trial - no credit card required",
  description:
    "Bring scheduling, payments, and payroll into one workspace backed by automatic SSL on your own domain.",
  primaryCta: { label: "Start free trial" },
  secondaryCta: { label: "Talk to sales" },
};

const DEFAULT_ASSURANCES = [
  {
    key: "noHiddenFees",
    title: "No hidden fees",
    description: "Simple Stripe-based pricing with predictable processing rates.",
  },
  {
    key: "switchPlans",
    title: "Switch plans anytime",
    description:
      "Upgrade or downgrade as your team grows; your custom domain follows instantly.",
  },
  {
    key: "professionReady",
    title: "Branded websites",
    description:
      "Custom domains with TXT/CNAME verification and automatic SSL on Pro and Business.",
  },
  {
    key: "enterpriseOnboarding",
    title: "Enterprise onboarding",
    description:
      "Guided setup for multi-location brands with tax and payroll mapping.",
  },
  {
    key: "roleAccess",
    title: "Role-based access",
    description:
      "Managers, staff, and finance roles keep scheduling and payroll secure by default.",
  },
  {
    key: "globalPayments",
    title: "Global payments ready",
    description:
      "Stripe Checkout with refunds, saved cards, and cross-border payouts.",
  },
];

const DEFAULT_RIBBON = {
  message:
    "<strong>New:</strong> Custom domains (TXT/CNAME) with automatic SSL are included on <strong>Pro</strong> and <strong>Business</strong>. Starter can add it as an add-on.",
  buttonLabel: "Connect domain",
  buttonTo: "/manager/dashboard",
};

const DEFAULT_FOOTNOTE = {
  message:
    "<strong>Custom domain + automatic SSL:</strong> included on <strong>Pro</strong> and <strong>Business</strong>. Available on <strong>Starter</strong> as an add-on ($5 / month).",
};

const PricingPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const marketing = theme.marketing || {};
  const [ctaLoadingKey, setCtaLoadingKey] = useState("");
  const [ctaError, setCtaError] = useState("");

  const content = useMemo(() => t("landing.pricingPage", { returnObjects: true }), [t]);
  const metaContent = content?.meta || DEFAULT_META;
  const heroContent = content?.hero || DEFAULT_HERO;
  const plansContent = content?.plans?.table || {};
  const assurancesContent = content?.assurances || {};
  const ribbonContent = content?.ribbon || DEFAULT_RIBBON;
  const footnoteContent = content?.footnote || DEFAULT_FOOTNOTE;
  const ctaContent = content?.ctaBanner || DEFAULT_CTA;
  const pricingSchemas = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Schedulaa Starter",
        brand: { "@type": "Brand", name: "Schedulaa" },
        description: "Website + booking + payments for solo professionals.",
        offers: {
          "@type": "Offer",
          price: "19.99",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://www.schedulaa.com/pricing#starter",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Schedulaa Pro",
        brand: { "@type": "Brand", name: "Schedulaa" },
        description: "Scheduling, marketing campaigns, advanced analytics; up to 5 staff, 1 location.",
        offers: {
          "@type": "Offer",
          price: "49.99",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://www.schedulaa.com/pricing#pro",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Schedulaa Business",
        brand: { "@type": "Brand", name: "Schedulaa" },
        description: "Advanced payroll exports, audits, compliance docs; 10 staff, 2 locations included.",
        offers: {
          "@type": "Offer",
          price: "119.99",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://www.schedulaa.com/pricing#business",
        },
      },
    ],
    []
  );
  const platformSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Schedulaa Platform",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://www.schedulaa.com/pricing",
      description:
        metaContent?.description ||
        DEFAULT_META.description,
      provider: {
        "@type": "Organization",
        name: "Schedulaa",
        url: "https://www.schedulaa.com",
      },
      offers: {
        "@type": "Offer",
        price: "0.00",
        priceCurrency: "USD",
      },
    }),
    [metaContent]
  );

  const heroTitle = useMemo(() => {
    const title = heroContent?.title;
    if (Array.isArray(title) && title.length) {
      return title;
    }
    if (typeof title === "string" && title.trim()) {
      return [title];
    }
    return DEFAULT_HERO.title;
  }, [heroContent]);

  const heroBadge = useMemo(
    () => (
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
            {heroContent?.badge?.overline || DEFAULT_HERO.badge.overline}
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
          >
            {heroContent?.badge?.title || DEFAULT_HERO.badge.title}
          </Typography>
        </Stack>
      </Stack>
    ),
    [heroContent, theme]
  );

  const assuranceCards = useMemo(() => {
    const list = assurancesContent?.items?.length
      ? assurancesContent.items
      : DEFAULT_ASSURANCES;
    return list.map((item) => {
      const IconComponent = ASSURANCE_ICON_MAP[item.key] || AutoAwesomeIcon;
      return {
        key: item.key,
        title: item.title,
        description: item.description,
        icon: <IconComponent fontSize="small" />,
        palette: {
          background: alpha(
            theme.palette.background.paper,
            theme.palette.mode === "dark" ? 0.18 : 0.86
          ),
          iconBg: alpha(
            theme.palette.primary.main,
            theme.palette.mode === "dark" ? 0.3 : 0.22
          ),
          text: theme.palette.text.primary,
        },
      };
    });
  }, [assurancesContent, theme]);

  const plans = useMemo(() => {
    const list = plansContent?.list?.length ? plansContent.list : DEFAULT_PLANS;
    return list.map((plan) => ({
      key: plan.key || plan.name,
      name: plan.name,
      price: plan.price,
      description: plan.description,
      features: Array.isArray(plan.features) ? plan.features : [],
      ctaLabel: plan.ctaLabel || heroContent?.primaryCta?.label || DEFAULT_HERO.primaryCta.label,
      ctaTo: plan.ctaTo || HERO_PRIMARY_CTA_TO,
      highlight: Boolean(plan.highlight),
      badge: plan.badge,
      anchorId: plan.anchorId || plan.key || plan.name,
    }));
  }, [plansContent, heroContent]);

  const addons = useMemo(() => {
    if (plansContent?.addons?.items?.length) {
      return {
        title: plansContent.addons.title,
        headers: plansContent.addons.headers || {},
        items: plansContent.addons.items,
      };
    }
    return DEFAULT_ADDONS;
  }, [plansContent]);

  const metaOg = metaContent?.og || DEFAULT_META.og;

  const handleCheckout = useCallback(async (planKey) => {
    if (!planKey) return;
    setCtaError("");
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (!token) {
      navigate(`/register?plan=${encodeURIComponent(planKey)}`);
      return;
    }
    setCtaLoadingKey(planKey);
    try {
      const res = await api.post("/billing/checkout", { plan_key: planKey });
      const url = res?.data?.url;
      if (url && typeof window !== "undefined") {
        window.location.href = url;
        return;
      }
      throw new Error("Billing checkout URL missing.");
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        navigate(`/register?plan=${encodeURIComponent(planKey)}`);
        return;
      }
      setCtaError(
        error?.displayMessage ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to start checkout."
      );
    } finally {
      setCtaLoadingKey("");
    }
  }, [navigate]);

  React.useEffect(() => {
    const planParam = (searchParams.get("plan") || "").toLowerCase();
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (!planParam || !token) return;
    if (!["starter", "pro", "business"].includes(planParam)) return;
    if (ctaLoadingKey) return;
    handleCheckout(planParam);
  }, [searchParams, handleCheckout, ctaLoadingKey]);

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title={metaContent?.title || DEFAULT_META.title}
        description={metaContent?.description || DEFAULT_META.description}
        canonical={metaContent?.canonical || DEFAULT_META.canonical}
        og={{
          title: metaOg.title || DEFAULT_META.og.title,
          description: metaOg.description || DEFAULT_META.og.description,
          image: metaOg.image || DEFAULT_META.og.image,
        }}
      />
      <JsonLd data={platformSchema} />
      {pricingSchemas.map((schema) => (
        <JsonLd key={schema.name} data={schema} />
      ))}

      <HeroShowcase
        eyebrow={heroContent?.eyebrow || DEFAULT_HERO.eyebrow}
        title={heroTitle}
        subtitle={heroContent?.subtitle || DEFAULT_HERO.subtitle}
        primaryCTA={{
          label: heroContent?.primaryCta?.label || DEFAULT_HERO.primaryCta.label,
          to: HERO_PRIMARY_CTA_TO,
          variant: "contained",
        }}
        secondaryCTA={{
          label: heroContent?.secondaryCta?.label || DEFAULT_HERO.secondaryCta.label,
          to: HERO_SECONDARY_CTA_TO,
          variant: "outlined",
        }}
        media={{ src: platformMap, alt: heroContent?.mediaAlt || DEFAULT_HERO.mediaAlt }}
        titleBadge={heroBadge}
        blobs={[
          {
            key: "pricing-primary",
            color: theme.palette.primary.main,
            size: 1280,
            opacity: 0.22,
            sx: { top: -280, left: -260 },
          },
          {
            key: "pricing-accent",
            color: theme.palette.secondary.main,
            size: 920,
            opacity: 0.18,
            sx: { bottom: -260, right: -220 },
          },
        ]}
      />

      {ribbonContent?.message && (
        <Box sx={{ px: { xs: 2, md: 6 }, mt: 2, mb: 2 }}>
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
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary">
                <Trans
                  i18nKey="landing.pricingPage.ribbon.message"
                  components={{ strong: <strong /> }}
                  defaults={ribbonContent.message}
                />
              </Typography>
              {ribbonContent?.buttonLabel && (
                <Button
                  component={Link}
                  to={ribbonContent.buttonTo || DEFAULT_RIBBON.buttonTo}
                  size="small"
                  variant="contained"
                >
                  {ribbonContent.buttonLabel}
                </Button>
              )}
            </Stack>
          </Paper>
        </Box>
      )}

      <Box id="plans" sx={{ px: { xs: 2, md: 6 }, pb: { xs: 10, md: 12 } }}>
        {ctaError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {ctaError}
          </Alert>
        )}
        <PricingTable
          plans={plans}
          addons={addons.items}
          addonsTitle={addons.title}
          addonHeaders={addons.headers}
          onCtaClick={handleCheckout}
          ctaLoadingKey={ctaLoadingKey}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.5, textAlign: { xs: "left", md: "center" } }}
          dangerouslySetInnerHTML={{ __html: VALUE_NOTE }}
        />
        {footnoteContent?.message && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, textAlign: { xs: "left", md: "center" } }}
          >
            <Trans
              i18nKey="landing.pricingPage.footnote.message"
              components={{ strong: <strong /> }}
              defaults={footnoteContent.message}
            />
          </Typography>
        )}
      </Box>

      <Box sx={{ px: { xs: 2, md: 6 }, pb: { xs: 8, md: 10 }, textAlign: "center" }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Need more scale?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mx: "auto", mb: 3 }}>
          We support larger organizations with increased seat and location limits, premium support, and tailored onboarding.
          Example configurations: <strong>Enterprise</strong> (25 staff, up to 3 locations) and <strong>Corporate</strong> (50 staff, up to 4 locations).
          Tell us what you need and we&apos;ll tailor a quote.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
          <Button component={Link} to="/contact" variant="contained" size="large">
            Contact Sales
          </Button>
          <Button component={Link} to="/pricing#plans" variant="text" size="large">
            Compare plans
          </Button>
        </Stack>
      </Box>

      <FeatureCardShowcase
        eyebrow={assurancesContent?.eyebrow || "Everything you need"}
        title={assurancesContent?.title || "Transparent pricing, enterprise-grade platform"}
        subtitle={
          assurancesContent?.subtitle ||
          "Secure, scalable, and fast: launch branded sites, process payments, and automate payroll from one login."
        }
        cards={assuranceCards}
        background={marketing.gradients?.primary}
        cardContentAlign="center"
      />

      <Box sx={{ px: { xs: 2, md: 6 }, pb: { xs: 12, md: 16 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: marketing.radius?.xl || 32,
            background:
              marketing.gradients?.secondary ||
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.secondary.main, 0.85)})`,
            color: theme.palette.common.white,
            p: { xs: 4, md: 6 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: { xs: 3, md: 4 },
            boxShadow: marketing.shadows?.xl || "0 28px 72px rgba(15,23,42,0.25)",
          }}
        >
          <Stack spacing={2} maxWidth={520} sx={{ ml: { xs: 0, md: 2, lg: 4 } }}>
            <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
              {ctaContent?.eyebrow || DEFAULT_CTA.eyebrow}
            </Typography>
            <Typography
              component="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2rem", md: "2.75rem" },
                lineHeight: 1.1,
              }}
            >
              {ctaContent?.title || DEFAULT_CTA.title}
            </Typography>
            <Typography variant="body1" sx={{ color: alpha(theme.palette.common.white, 0.82) }}>
              {ctaContent?.description || DEFAULT_CTA.description}
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              component={Link}
              to={CTA_PRIMARY_TO}
              variant="contained"
              color="secondary"
              sx={{ textTransform: "none", px: 4, borderRadius: 999 }}
            >
              {ctaContent?.primaryCta?.label || DEFAULT_CTA.primaryCta.label}
            </Button>
            <Button
              component={Link}
              to={CTA_SECONDARY_TO}
              variant="outlined"
              sx={{
                textTransform: "none",
                px: 4,
                borderRadius: 999,
                color: theme.palette.common.white,
                borderColor: alpha(theme.palette.common.white, 0.6),
              }}
            >
              {ctaContent?.secondaryCta?.label || DEFAULT_CTA.secondaryCta.label}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default PricingPage;
