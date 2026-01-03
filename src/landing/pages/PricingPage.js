import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
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
    "Custom domains (TXT/CNAME) with automatic SSL are included on every plan. Start with Starter for website + booking, then add staff, payroll, and automations on Pro and Business.",
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
    "Launch your website and take bookings and payments for solo professionals.",
  trialNote: "14-day free trial • Cancel anytime",
  features: [
    { type: "heading", text: "Core platform" },
    "Unified booking, website, and payments.",
    "Secure client and staff portals.",
    "Website builder with branded pages and templates.",
    "Online booking, confirmations, and client portal.",
    "Public “Book with me” link.",
    "Stripe Checkout with automatic tax compliance.",
    { type: "heading", text: "Operational basics" },
    "Booking notifications and reminders.",
    "Embeddable booking widgets.",
    "Stripe refunds and payment history.",
    "Basic role-based access.",
    { type: "heading", text: "Time & reporting" },
    "Basic time tracking tied to bookings and shifts.",
    "CSV/PDF exports for worked hours and revenue.",
    { type: "heading", text: "Capacity" },
    "1 staff seat and 1 location (department) included.",
    "Custom domain + automatic SSL included.",
    "Onboarding workflows as you grow.",
  ],
    ctaLabel: "Start 14-day free trial",
    ctaTo: HERO_PRIMARY_CTA_TO,
  },
  {
    key: "pro",
    name: "Pro",
    price: "$49.99/mo",
    positioning: "Run daily operations from one system.",
  description:
    "For small teams that need scheduling, automation, and analytics.",
  trialNote: "14-day free trial • Cancel anytime",
  features: [
    "Everything in Starter.",
    { type: "heading", text: "Time & Labor" },
    "Shift-based clock-in and clock-out.",
    "Break enforcement and auto-deductions.",
    "Overtime and anomaly flags.",
    { type: "heading", text: "Payroll" },
    "Full payroll runs included (no per-run fees).",
    "Payroll-ready approvals and audit trails.",
    "Payroll exports to QuickBooks & Xero.",
    "Payroll processing with Employee Payslip Portal (self-serve PDFs).",
    { type: "heading", text: "Access & control" },
    "Role-based access for managers and staff.",
    "Staff permissions and visibility controls.",
    "Department scheduling and shared calendars.",
    "Shift swaps, approvals, and live rosters.",
    { type: "heading", text: "Analytics & marketing" },
    "Email campaigns: Broadcast, Win-Back, VIP, No-Show, Anniversary.",
    "Advanced Analytics (bookings, revenue, client segments).",
    { type: "heading", text: "Capacity" },
    "Up to 5 staff seats and 1 location (department) included.",
    "Automated Canadian stat holiday pay and accruals.",
    "Priority support (business hours).",
    ],
    ctaLabel: "Start 14-day free trial",
    ctaTo: HERO_PRIMARY_CTA_TO,
    highlight: true,
    badge: "Most popular",
  },
  {
    key: "business",
    name: "Business",
    price: "$119.99/mo",
    description:
    "Built for compliance, audits, and multi-location (department) operations.",
    trialNote: "14-day free trial • Cancel anytime",
    features: [
    "Everything in Pro.",
    { type: "heading", text: "Time & Labor" },
    "Shift-based clock-in and clock-out with break enforcement.",
    "Overtime, anomaly flags, and audit-ready time records.",
    { type: "heading", text: "Payroll" },
    "Full payroll runs included (no per-run fees).",
    { type: "heading", text: "Governance & compliance" },
    "Audit-ready payroll and compliance records.",
    "Compliance-ready tax exports (W-2, T4, ROE).",
    "Multi-location (department) payroll and reporting.",
    { type: "heading", text: "Advanced control" },
    "Branch-level permissions.",
    "Bulk scheduling controls (close / keep windows).",
    "Audit-ready operations with reduced compliance risk.",
    { type: "heading", text: "Capacity" },
      "10 staff seats and up to 2 locations (departments) included.",
      "Add seats for $9/mo each.",
      "Free branded website included when using Payroll + Scheduling.",
    ],
    ctaLabel: "Start 14-day free trial",
    ctaTo: HERO_PRIMARY_CTA_TO,
  },
];


const DEFAULT_ADDONS = {
  title: "Popular add-ons",
  headers: { addon: "Add-on", price: "Price" },
  items: [
    { key: "extraSeat", name: "Additional staff seat", price: "$9/mo per seat (prorated)" },
  ],
};

const VALUE_NOTE = `
<strong>Bundle value:</strong> Subscribe to <strong>Payroll + Scheduling</strong> and your branded website on your own domain (with automatic SSL) is included for free.
If you only need Website or Booking, <strong>Starter</strong> covers it; <strong>Pro</strong> adds staff scheduling, payroll, and automations, and <strong>Business</strong> adds full payroll compliance documents and multi-location (department) controls.
`;

const DEFAULT_CTA = {
  eyebrow: "Launch today",
  title: "Start your free trial - no credit card required",
  description:
    "Bring scheduling, payments, and payroll into one workspace with automatic SSL on your domain.",
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
      "Custom domains with TXT/CNAME verification and automatic SSL on every plan.",
  },
  {
    key: "enterpriseOnboarding",
    title: "Enterprise onboarding",
    description:
      "Guided setup for multi-location brands (departments as locations) with tax and payroll mapping.",
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
    "<strong>New:</strong> Custom domains (TXT/CNAME) with automatic SSL are included on every plan.",
  buttonLabel: "Connect domain",
  buttonTo: "/manager/dashboard",
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
        description: "Scheduling, marketing campaigns, advanced analytics; up to 5 staff, 1 location (department).",
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
        description: "Advanced payroll exports, audits, compliance docs; 10 staff, 2 locations (departments) included.",
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
        <Paper
          elevation={0}
          sx={{
            mt: { xs: 3, md: 4 },
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Included in every plan
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Custom domains with automatic SSL.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role-based access and staff permissions.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email and booking notifications.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Secure Stripe payments with refunds.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Continuous feature updates.
            </Typography>
          </Stack>
        </Paper>
        <Box
          sx={{
            mt: { xs: 4, md: 5 },
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Schedulaa Feature Comparison
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Compare plans at a glance.
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Feature</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Starter</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pro</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Business</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Price</TableCell>
                  <TableCell>$19.99 / mo</TableCell>
                  <TableCell>$49.99 / mo</TableCell>
                  <TableCell>$119.99 / mo</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Best for</TableCell>
                  <TableCell>Solo professionals</TableCell>
                  <TableCell>Growing teams</TableCell>
                  <TableCell>Compliance & multi-location (department) teams</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                    Website & Online Presence
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Branded website builder & templates</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Custom domain + automatic SSL</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Public booking pages</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Embedded booking widgets</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Company-level branding</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                    Booking & Scheduling
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Online booking & confirmations</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Client self-serve rescheduling</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Multi-service & add-on bookings</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Staff scheduling & shift management</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Shift swaps & leave approvals</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Bulk scheduling controls</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                    Time Tracking
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Shift-based clock-in / clock-out</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Break policy enforcement</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Staggered & windowed breaks</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>IP / device audit hints</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Overtime & anomaly flags</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                    Payroll
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Payroll processing (US & Canada)</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Automated stat holiday pay & accruals</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Employee payslip portal (PDF)</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Advanced payroll exports & audits</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Payroll-linked invoicing</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                    Compliance
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Revenue & appointment reports</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>CSV / PDF exports</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>W-2 (US) generation</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>T4 & ROE (Canada)</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Compliance-ready audit trails</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                    Analytics
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Revenue & booking dashboards</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Utilization & productivity analytics</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Client segmentation & trends</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Multi-location (department) analytics</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                    Automation
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Email notifications & reminders</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Email campaigns (VIP, Win-back, No-show)</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Zapier automation</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Workflow automations</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                    Hiring
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Job postings & public apply links</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Resume uploads & tracking</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Onboarding workflows</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Hiring → payroll handoff</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                    Scale
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Staff seats included</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>Up to 5</TableCell>
                  <TableCell>10</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Additional staff seats</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>$9 / seat</TableCell>
                  <TableCell>$9 / seat</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Multi-location support (use departments as locations)</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>Up to 2</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Role-based access & permissions</TableCell>
                  <TableCell>Basic</TableCell>
                  <TableCell>Advanced</TableCell>
                  <TableCell>Advanced</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Branch-level permissions</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                    Support
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Standard support</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Priority support</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Business hours</TableCell>
                  <TableCell>24 / 7</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Audit & compliance support</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>
        <Stack
          spacing={3}
          sx={{
            mt: { xs: 4, md: 5 },
            mb: { xs: 2, md: 3 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Why teams choose Schedulaa
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Booking, payroll, time tracking, and websites share one data model.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No syncing errors between shifts, hours, and pay.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fewer compliance gaps from disconnected tools.
              </Typography>
            </Stack>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              dangerouslySetInnerHTML={{ __html: VALUE_NOTE }}
            />
          </Paper>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, md: 6 }, pb: { xs: 8, md: 10 }, textAlign: "center" }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Need more scale?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mx: "auto", mb: 3 }}>
          Enterprise plans are built for multi-location operators and compliance-heavy teams.
          Example configurations: <strong>Enterprise</strong> (up to 300 staff, unlimited locations/departments).
        </Typography>
        <Stack component="ul" spacing={1} sx={{ maxWidth: 720, mx: "auto", mb: 3, pl: 2, color: "text.secondary" }}>
          <Typography component="li" variant="body2">
            Common fits: multi-location service brands, staffing teams, and high-volume payroll.
          </Typography>
          <Typography component="li" variant="body2">
            Extended audit logs and data retention policies.
          </Typography>
          <Typography component="li" variant="body2">
            Contracted SLAs, account ownership, and billing coordination.
          </Typography>
          <Typography component="li" variant="body2">
            SOC2-aligned controls (in progress).
          </Typography>
        </Stack>
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
