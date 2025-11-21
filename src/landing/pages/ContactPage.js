import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
  Alert,
  Paper,
  CircularProgress,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import HandshakeIcon from "@mui/icons-material/Handshake";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SettingsBackupRestoreIcon from "@mui/icons-material/SettingsBackupRestore";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

import Meta from "../../components/Meta";
import JsonLd from "../../components/seo/JsonLd";
import HeroShowcase from "../components/HeroShowcase";
import FeatureCardShowcase from "../components/FeatureCardShowcase";
import FloatingBlob from "../../components/ui/FloatingBlob";
import { publicSite } from "../../utils/api";
import automationJourney from "../../assets/marketing/automation-journey.png";

const DEFAULT_CONTACT_EMAIL =
  process.env.REACT_APP_CONTACT_ADMIN_EMAIL ||
  (typeof window !== "undefined" && window.__ENV__?.CONTACT_EMAIL) ||
  "support@schedulaa.com";
const DEFAULT_DIRECT_LINES = [
  `Sales: +1 (415) 555-0198`,
  `Admin: ${DEFAULT_CONTACT_EMAIL}`,
];

const FALLBACK_CONTACT_SLUGS = ["photo-artisto", "photo-artisto-corp", "schedulaa"];

const COMPANY_ADDRESS = {
  streetAddress: "171 Harbord Street",
  addressLocality: "Toronto",
  addressRegion: "Ontario",
  postalCode: "M5S 1H3",
  addressCountry: "CA",
};

const createLocalBusinessSchema = (email = DEFAULT_CONTACT_EMAIL) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Schedulaa",
  url: "https://www.schedulaa.com/contact",
  image: "https://www.schedulaa.com/og/contact.jpg",
  telephone: "+1-415-555-0198",
  email,
  address: {
    "@type": "PostalAddress",
    ...COMPANY_ADDRESS,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  sameAs: [
    "https://www.linkedin.com/company/schedulaa/",
    "https://twitter.com/schedulaa",
    "https://www.instagram.com/schedulaa.app",
  ],
});

const DEFAULT_CONTENT = {
  meta: {
    title: "Contact Schedulaa",
    description:
      "Talk to the Schedulaa team about custom rollouts, partnerships, or migration support.",
    canonical: "https://www.schedulaa.com/contact",
    og: {
      title: "Contact Schedulaa",
      description: "Send us a note about your rollout, partnership, or migration questions.",
      image: "https://www.schedulaa.com/og/contact.jpg",
    },
  },
  hero: {
    eyebrow: "Contact",
    title: ["Let's talk", "about your rollout."],
    subtitle:
      "Looking for a custom implementation, partner program, or migration help? Our specialists respond within one business day.",
    badge: {
      overline: "Here to help",
      title: "Reach our rollout specialists in one business day",
    },
    primaryCta: { label: "Email sales", href: "mailto:sales@schedulaa.com" },
    secondaryCta: {
      label: "Call +1 (415) 555-0198",
      href: "tel:+14155550198",
      variant: "outlined",
    },
    mediaAlt: "Schedulaa support workflow",
  },
  highlights: {
    eyebrow: "How we help",
    title: "Connect with the right team",
    subtitle:
      "Sales engineers, partner managers, and support leads collaborate so your rollout is effortless.",
    items: [
      {
        key: "sales",
        title: "Sales & demos",
        description: "Plan walkthroughs, pricing guidance, and migration timelines tailored to your team.",
      },
      {
        key: "partnerships",
        title: "Partnerships",
        description: "Reseller, integration, and co-marketing opportunities for platforms serving creatives.",
      },
      {
        key: "support",
        title: "Support",
        description: "24-hour ticket response, enterprise onboarding, and dedicated success managers on Pro.",
      },
      {
        key: "migration",
        title: "Migration support",
        description: "Data imports, template mapping, and sandbox reviews that de-risk your launch.",
      },
      {
        key: "success",
        title: "Customer success",
        description: "Quarterly reviews, roadmap previews, and best-practice workshops keep teams ahead.",
      },
    ],
  },
  form: {
    title: "Send a message",
    nameLabel: "Name",
    emailLabel: "Email",
    companyLabel: "Company",
    planLabel: "Plan or interest",
    messageLabel: "Message",
    submit: "Submit",
    success: "Thanks! Our team will get in touch within one business day.",
    planOptions: [
      "Starter",
      "Plus",
      "Pro",
      "Enterprise",
      "Partnership",
      "Migration Support",
    ],
  },
  direct: {
    title: "Direct lines",
    lines: DEFAULT_DIRECT_LINES,
  },
};

const HIGHLIGHT_ICON_MAP = {
  sales: RocketLaunchIcon,
  partnerships: HandshakeIcon,
  support: SupportAgentIcon,
  migration: SettingsBackupRestoreIcon,
  success: EmojiEventsIcon,
};

const getArray = (value, fallback) =>
  Array.isArray(value) && value.length ? value : fallback;

const ContactPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const marketing = theme.marketing || {};
  const localBusinessSchema = useMemo(() => createLocalBusinessSchema(DEFAULT_CONTACT_EMAIL), []);

  const content = useMemo(() => t("landing.contactPage", { returnObjects: true }), [t]);

  const metaContent = content?.meta || DEFAULT_CONTENT.meta;
  const heroContent = content?.hero || DEFAULT_CONTENT.hero;
  const highlightsContent = content?.highlights || DEFAULT_CONTENT.highlights;
  const formContent = content?.form || DEFAULT_CONTENT.form;
  const directContent = content?.direct || DEFAULT_CONTENT.direct;
  const directLines = getArray(
    directContent.lines,
    DEFAULT_CONTENT.direct.lines
  );

  const rawSlugEnv =
    process.env.REACT_APP_CONTACT_SLUGS ||
    (typeof window !== "undefined" && window.__ENV__?.CONTACT_SLUGS) ||
    "";

  const marketingContactSlugs = React.useMemo(() => {
    const envList = rawSlugEnv
      ? rawSlugEnv
          .split(",")
          .map((slug) => slug.trim())
          .filter(Boolean)
      : [];
    const combined = [...envList, ...FALLBACK_CONTACT_SLUGS];
    const seen = new Set();
    return combined.filter((slug) => {
      const key = slug.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawSlugEnv]);

  const heroTitle = getArray(heroContent.title, DEFAULT_CONTENT.hero.title);
  const highlightItems = getArray(
    highlightsContent.items,
    DEFAULT_CONTENT.highlights.items
  );
  const planOptions = getArray(
    formContent.planOptions,
    DEFAULT_CONTENT.form.planOptions
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    plan: planOptions[0] || "",
    message: "",
  });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setStatus(null);
    setError(null);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.message.trim()) {
      setError("Please include a short message so we know how to help.");
      return;
    }

    setStatus(null);
    setError(null);
    setIsSubmitting(true);
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedName || !trimmedEmail) {
      setIsSubmitting(false);
      setError("Please include your name and email so we can reach you.");
      return;
    }


    const metaLines = [
      form.company && `Company: ${form.company}`,
      form.plan && `Plan interest: ${form.plan}`,
    ].filter(Boolean);

    const compiledMessage = [
      ...metaLines,
      metaLines.length ? "" : null,
      form.message.trim(),
    ]
      .filter(Boolean)
      .join("\n");
    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      message: compiledMessage,
    };

    try {
      let sent = false;
      let lastError;

      for (const slug of marketingContactSlugs) {
        try {
          await publicSite.sendContact(slug, payload);
          sent = true;
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!sent) {
        throw lastError || new Error("Unable to send message");
      }

      setStatus(formContent.success || DEFAULT_CONTENT.form.success);
      setForm({ name: "", email: "", company: "", plan: planOptions[0] || "", message: "" });
    } catch (err) {
      const fallbackMessage = "We couldn't send your message. Please try again in a moment.";
      const detail = err?.response?.data?.error || err?.message;
      setError(typeof detail === "string" ? detail : fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const highlightCards = useMemo(
    () =>
      highlightItems.map((item, index) => {
        const fallback = DEFAULT_CONTENT.highlights.items[index] || {};
        const key = item.key || fallback.key;
        const IconComponent = (key && HIGHLIGHT_ICON_MAP[key]) || SupportAgentIcon;
        return {
          title: item.title || fallback.title || "",
          description: item.description || fallback.description || "",
          icon: <IconComponent fontSize="small" />,
          palette: {
            background: alpha(
               theme.palette.background.paper,
               theme.palette.mode === "dark" ? 0.24 : 0.92
            ),
            iconBg: alpha(
               theme.palette.primary.main,
               theme.palette.mode === "dark" ? 0.32 : 0.18
            ),
            text: theme.palette.text.primary,
          },
        };
      }),
    [highlightItems, theme]
  );

  const heroPrimaryCta = heroContent.primaryCta || DEFAULT_CONTENT.hero.primaryCta;
  const heroSecondaryCta = heroContent.secondaryCta || DEFAULT_CONTENT.hero.secondaryCta;
  const heroBadge = heroContent.badge || DEFAULT_CONTENT.hero.badge;
  const heroMediaAlt = heroContent.mediaAlt || DEFAULT_CONTENT.hero.mediaAlt;
  const metaOg = metaContent?.og || DEFAULT_CONTENT.meta.og;

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title={metaContent?.title || DEFAULT_CONTENT.meta.title}
        description={metaContent?.description || DEFAULT_CONTENT.meta.description}
        canonical={metaContent?.canonical || DEFAULT_CONTENT.meta.canonical}
        og={{
          title: metaOg.title || DEFAULT_CONTENT.meta.og.title,
          description: metaOg.description || DEFAULT_CONTENT.meta.og.description,
          image: metaOg.image || DEFAULT_CONTENT.meta.og.image,
        }}
      />
      <JsonLd data={localBusinessSchema} />

      <HeroShowcase
        eyebrow={heroContent?.eyebrow || DEFAULT_CONTENT.hero.eyebrow}
        title={heroTitle}
        subtitle={heroContent?.subtitle || DEFAULT_CONTENT.hero.subtitle}
        primaryCTA={{
          label: heroPrimaryCta?.label || DEFAULT_CONTENT.hero.primaryCta.label,
          href: heroPrimaryCta?.href || DEFAULT_CONTENT.hero.primaryCta.href,
          to: heroPrimaryCta?.to,
        }}
        secondaryCTA={{
          label: heroSecondaryCta?.label || DEFAULT_CONTENT.hero.secondaryCta.label,
          href: heroSecondaryCta?.href || DEFAULT_CONTENT.hero.secondaryCta.href,
          to: heroSecondaryCta?.to,
          variant: heroSecondaryCta?.variant || DEFAULT_CONTENT.hero.secondaryCta.variant,
        }}
        media={{ src: automationJourney, alt: heroMediaAlt }}
        titleBadge={
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
               <SupportAgentIcon fontSize="small" />
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
                 {heroBadge?.overline || DEFAULT_CONTENT.hero.badge.overline}
               </Typography>
               <Typography
                 variant="subtitle2"
                 sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
               >
                 {heroBadge?.title || DEFAULT_CONTENT.hero.badge.title}
               </Typography>
            </Stack>
          </Stack>
        }
        blobs={[
          {
            key: "contact-primary",
            color: theme.palette.primary.main,
            size: 1280,
            opacity: 0.22,
            sx: { top: -260, left: -220 },
          },
          {
            key: "contact-accent",
            color: theme.palette.secondary.main,
            size: 920,
            opacity: 0.18,
            sx: { bottom: -260, right: -220 },
          },
        ]}
      />

      <FeatureCardShowcase
        eyebrow={highlightsContent?.eyebrow || DEFAULT_CONTENT.highlights.eyebrow}
        title={highlightsContent?.title || DEFAULT_CONTENT.highlights.title}
        subtitle={highlightsContent?.subtitle || DEFAULT_CONTENT.highlights.subtitle}
        cards={highlightCards}
        cardContentAlign="center"
      />

      <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 8, md: 10 } }}>
        <Stack spacing={4} maxWidth={1040} mx="auto">
          <Paper
            elevation={0}
            sx={{
               maxWidth: 1040,
               mx: "auto",
               p: { xs: 3, md: 5 },
               borderRadius: marketing.radius?.lg || 24,
               border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
               boxShadow: marketing.shadows?.sm || "0 18px 36px rgba(15,23,42,0.12)",
            }}
          >
            <Stack component="form" spacing={3} onSubmit={handleSubmit} sx={{ maxWidth: 720, mx: "auto", width: "100%" }}>
               <Typography variant="h5" component="h2" fontWeight={700} sx={{ textAlign: "center" }}>
                 {formContent?.title || DEFAULT_CONTENT.form.title}
               </Typography>
               <TextField
                 label={formContent?.nameLabel || DEFAULT_CONTENT.form.nameLabel}
                 name="name"
                 value={form.name}
                 onChange={handleChange}
                 required
                 fullWidth
               />
               <TextField
                 label={formContent?.emailLabel || DEFAULT_CONTENT.form.emailLabel}
                 name="email"
                 type="email"
                 value={form.email}
                 onChange={handleChange}
                 required
                 fullWidth
               />
               <TextField
                 label={formContent?.companyLabel || DEFAULT_CONTENT.form.companyLabel}
                 name="company"
                 value={form.company}
                 onChange={handleChange}
                 fullWidth
               />
               <TextField
                 label={formContent?.planLabel || DEFAULT_CONTENT.form.planLabel}
                 name="plan"
                 select
                 value={form.plan}
                 onChange={handleChange}
                 fullWidth
               >
                 {planOptions.map((option) => (
                   <MenuItem key={option} value={option}>
                     {option}
                   </MenuItem>
                 ))}
               </TextField>
               <TextField
                 label={formContent?.messageLabel || DEFAULT_CONTENT.form.messageLabel}
                 name="message"
                 value={form.message}
                 onChange={handleChange}
                 required
                 fullWidth
                 multiline
                 minRows={4}
               />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  color="primary"
                  disabled={isSubmitting}
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    alignSelf: { xs: "stretch", sm: "center" },
                    px: 4,
                  }}
                >
                  {isSubmitting && (
                    <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                  )}
                  {formContent?.submit || DEFAULT_CONTENT.form.submit}
                </Button>
                {error && <Alert severity="error">{error}</Alert>}
                {status && <Alert severity="success">{status}</Alert>}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
               p: { xs: 3, md: 4 },
               borderRadius: marketing.radius?.lg || 24,
               border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ textAlign: "center" }}>
               {directContent?.title || DEFAULT_CONTENT.direct.title}
            </Typography>
            <Stack spacing={1.5} sx={{ maxWidth: 720, mx: "auto" }}>
              {directLines.map((line) => (
                <Typography key={line} variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                  {line}
                </Typography>
              ))}
            </Stack>
</Paper>
        </Stack>
      </Box>

      <Box sx={{ position: "relative", py: { xs: 8, md: 10 } }}>
        <FloatingBlob
          enableMotion
          color={theme.palette.primary.main}
          size={960}
          opacity={0.14}
          duration={28}
          sx={{ top: -200, right: -200 }}
        />
      </Box>
    </Box>
  );
};

export default ContactPage;
