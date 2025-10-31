import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link } from "react-router-dom";
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

const SITE_BASE_URL = "https://www.schedulaa.com";
const BRAND_NAME = "Schedulaa";
const DEFAULT_CURRENCY = "CAD";

const DEFAULT_META = {
  title: "Schedulaa Pricing | Launch on your own domain with automatic SSL",
  description:
    "Compare Starter, Pro, and Business plans. Custom domains with automatic SSL are included on Pro and Business; Starter can add it for $5/month.",
  canonical: `${SITE_BASE_URL}/pricing`,
  og: {
    title: "Schedulaa Pricing",
    description:
      "Plans for every stage. Launch on your own domain with automatic SSL included on Pro and Business.",
    image: `${SITE_BASE_URL}/og/pricing.jpg`,
  },
};

const DEFAULT_HERO = {
  eyebrow: "Pricing that scales",
  title: [
    "Pricing that grows with you.",
    "Launch on your own domain with automatic SSL.",
  ],
  subtitle:
    "Custom domains (TXT/CNAME) with automatic SSL are now included on Pro and Business. Starter can add it as an add-on for $5/month.",
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
    price: "$9/mo",
    currency: DEFAULT_CURRENCY,
    description:
      "Solo operators who need scheduling, payments, and branded booking pages.",
    features: [
      "Scheduling with reminders and SMS add-ons.",
      "Stripe Checkout for payments and refunds.",
      "One staff seat and one location included.",
      "Email confirmations and client portal.",
      "Custom domain + automatic SSL (add-on $5/mo).",
    ],
    ctaLabel: "Start free trial",
    ctaTo: HERO_PRIMARY_CTA_TO,
  },
  {
    key: "pro",
    name: "Pro",
    price: "$39/mo",
    currency: DEFAULT_CURRENCY,
    description:
      "Growing teams that need multiple staff, branded communications, and analytics.",
    features: [
      "Everything in Starter.",
      "Custom domain + automatic SSL included.",
      "Up to five staff seats and five locations.",
      "Branded email and SMS templates.",
      "Reports and revenue analytics.",
      "Priority support (business hours).",
    ],
    ctaLabel: "Start Pro",
    ctaTo: HERO_PRIMARY_CTA_TO,
    highlight: true,
  },
  {
    key: "business",
    name: "Business",
    price: "$99/mo",
    currency: DEFAULT_CURRENCY,
    description:
      "Multi-location brands that need unlimited staff, audit trails, and enterprise controls.",
    features: [
      "Everything in Pro.",
      "Multiple custom domains (one included, $5 per additional).",
      "Unlimited staff seats and locations.",
      "Advanced payroll exports and tax reports.",
      "Role-based access with audit logging.",
      "24/7 priority support.",
    ],
    ctaLabel: "Start Business",
    ctaTo: HERO_PRIMARY_CTA_TO,
  },
];

const DEFAULT_ADDONS = {
  title: "Popular add-ons",
  headers: { addon: "Add-on", price: "Price" },
  items: [
    { key: "customDomain", name: "Custom domain + automatic SSL", price: "$5/mo" },
    { key: "extraSeat", name: "Additional staff seat", price: "$10/mo" },
  ],
};

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

const toAbsoluteUrl = (path = "") => {
  if (!path) return SITE_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_BASE_URL}${normalized}`;
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || undefined;

const extractPriceValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const match = value.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  return Number.parseFloat(match[1]);
};

const PricingPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const marketing = theme.marketing || {};

  const content = useMemo(() => t("landing.pricingPage", { returnObjects: true }), [t]);
  const metaContent = content?.meta || DEFAULT_META;
  const heroContent = content?.hero || DEFAULT_HERO;
  const plansContent = content?.plans?.table || {};
  const assurancesContent = content?.assurances || {};
  const ribbonContent = content?.ribbon || DEFAULT_RIBBON;
  const footnoteContent = content?.footnote || DEFAULT_FOOTNOTE;
  const ctaContent = content?.ctaBanner || DEFAULT_CTA;

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
      currency: plan.currency || plansContent?.currency || DEFAULT_CURRENCY,
      description: plan.description,
      features: Array.isArray(plan.features) ? plan.features : [],
      ctaLabel: plan.ctaLabel || heroContent?.primaryCta?.label || DEFAULT_HERO.primaryCta.label,
      ctaTo: plan.ctaTo || HERO_PRIMARY_CTA_TO,
      highlight: Boolean(plan.highlight),
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

  const productSchema = useMemo(() => {
    if (!plans.length) return null;
    const contentCurrency = plansContent?.currency;

    const items = plans
      .map((plan) => {
        const amount = extractPriceValue(plan.price);
        if (!Number.isFinite(amount)) return null;

        const currency = plan.currency || contentCurrency || DEFAULT_CURRENCY;
        const slug = slugify(plan.key || plan.name);
        const planAnchor = slug ? `#${slug}` : "";
        const productUrl = `${SITE_BASE_URL}/pricing${planAnchor}`;

        const ctaTarget = plan.ctaTo || CTA_PRIMARY_TO;
        const offerBase = toAbsoluteUrl(ctaTarget || CTA_PRIMARY_TO);
        const offerUrl =
          slug && offerBase
            ? `${offerBase}${offerBase.includes("?") ? "&" : "?"}plan=${encodeURIComponent(slug)}`
            : offerBase;

        return {
          "@type": "Product",
          "@id": productUrl,
          name: plan.name,
          description: plan.description,
          sku: slug || plan.key || plan.name,
          brand: { "@type": "Brand", name: BRAND_NAME },
          url: productUrl,
          offers: {
            "@type": "Offer",
            price: amount.toFixed(2),
            priceCurrency: currency,
            availability: "https://schema.org/InStock",
            url: offerUrl,
          },
        };
      })
      .filter(Boolean);

    if (!items.length) return null;

    return {
      "@context": "https://schema.org",
      "@graph": items,
    };
  }, [plans, plansContent]);

  const metaOg = metaContent?.og || DEFAULT_META.og;

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
      <JsonLd data={productSchema} />

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
        <PricingTable
          plans={plans}
          addons={addons.items}
          addonsTitle={addons.title}
          addonHeaders={addons.headers}
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
