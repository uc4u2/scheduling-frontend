// src/landing/pages/FAQPage.js
import React, { useMemo } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import PublicIcon from "@mui/icons-material/Public";
import CampaignIcon from "@mui/icons-material/Campaign";
import PaletteIcon from "@mui/icons-material/Palette";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import PaymentsIcon from "@mui/icons-material/Payments";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";

import Meta from "../../components/Meta";
import JsonLd from "../../components/seo/JsonLd";

const HERO_META = {
  title: "Schedulaa FAQ",
  description:
    "Answers to the most common Schedulaa questions covering the website builder, domains, marketing automation, Stripe tax, and payroll coverage.",
  canonical: "https://www.schedulaa.com/faq",
  keywords: "Schedulaa FAQ, website builder help, DNS setup, payroll coverage, Stripe tax automation",
};

const FAQ_SECTIONS = [
  {
    key: "website",
    title: "Website & branding",
    icon: PaletteIcon,
    description:
      "Everything you need to know about updating content, media, and styles inside the Website Builder.",
    cta: { label: "Learn more about Website Builder", to: "/website-builder" },
    items: [
      {
        question: "How do I edit different pages or sections of my site?",
        answer:
          "Open the Website Builder, choose the page from the sidebar, then click any section card (Hero, Gallery, FAQ, etc.). The editor on the right exposes text, layout, and advanced JSON props for that section.",
      },
      {
        question: "Can I preview a draft before it goes live?",
        answer:
          "Yes. Use Save Draft as often as you like, click Preview to see the visitor view, and only publish when you're ready. Draft changes stay private until you press Publish.",
      },
      {
        question: "My fonts or images aren't appearing-what should I check?",
        answer:
          "Confirm the file uploaded to Assets, that external fonts are actually loaded in your theme, and that you published the page. If an external host blocks hotlinking, upload the asset directly to Schedulaa instead.",
      },
      {
        question: "Where are uploads stored and can I reuse them?",
        answer:
          "Every image you upload lands in Assets. Reuse them across sections, organise with folders and tags, and remove duplicates later without breaking published pages.",
      },
    ],
  },
  {
    key: "marketing",
    title: "Marketing automation",
    icon: CampaignIcon,
    description:
      "Guidance for creating, previewing, and sending email campaigns to your clients.",
    cta: { label: "See marketing tools", to: "/marketing/email-campaigns" },
    items: [
      {
        question: "What's the quickest way to send a campaign?",
        answer:
          "Pick a campaign card, fill in the discount/coupon/dates, click Preview, review the rows, then Send Selected or Send All. Turn Dry-run off when you're ready for the real send.",
      },
      {
        question: "Why did my preview disappear when I edited a field?",
        answer:
          "Preview results clear each time you change a control so you don't send stale copy. Simply click Preview again to refresh the list.",
      },
      {
        question: "Any tips for subject lines and copy?",
        answer:
          "Keep subjects under ~45 characters (e.g., \"VIP early access\" or \"We miss you - book by Friday\"). Use the provided highlights for each campaign and personalise CTA links for faster clicks.",
      },
      {
        question: "Who receives the emails and how is tracking handled?",
        answer:
          "Only clients with valid emails are included. Built-in UTM tags (utm_source=broadcast|vip|...) keep analytics consistent, and exports stay tenant-scoped for privacy.",
      },
    ],
  },
  {
    key: "domains",
    title: "Domains & DNS",
    icon: PublicIcon,
    description:
      "Steps for connecting your marketing site or booking experience to a custom domain.",
    cta: { label: "View domain setup guide", to: "/website-builder/domain" },
    items: [
      {
        question: "What are the steps to connect a custom domain?",
        answer: [
          "Buy or choose a domain (GoDaddy, Namecheap, Cloudflare, etc.).",
          "In Schedulaa click Generate DNS Instructions to create the TXT (ownership) and CNAME (www) records.",
          "Add those records at your registrar, save, then click Verify DNS.",
          "Wait for SSL to activate - once live, your marketing site and booking links use the new domain."
        ].join("\n\n"),
      },
      {
        question: "What does \"DNS instructions generated\" mean\?",
        answer: [
          "Schedulaa already prepared the exact DNS host and value pairs you need.",
          "TXT host: _schedulaa (or _schedulaa.www) with the verification token we display.",
          "CNAME host: www pointing to schedulaa.com so visitors reach your site.",
          "Copy them into your registrar's DNS panel, save, and then verify in Schedulaa."
        ].join("\n\n"),
      },
      {
        question: "How long does DNS verification usually take?",
        answer: [
          "Most registrars update within 5-15 minutes.",
          "Some can take up to an hour; Schedulaa automatically checks every few minutes.",
          "You can click Refresh Status to poll again if things look stuck."
        ].join("\n\n"),
      },
      {
        question: "Do I need to worry about SSL certificates?",
        answer:
          "No. After verification we automatically issue and renew the TLS certificate. You will briefly see SSL Pending followed by SSL Active - no manual install or renewals required.",
      },
      {
        question: "Can I connect my GoDaddy domain automatically?",
        answer:
          "Yes. Choose Connect automatically to authorise Domain Connect so Schedulaa can add the TXT _schedulaa and CNAME www → schedulaa.com entries. If it fails, fall back to manual entries and click Verify DNS again.",
      },
      {
        question: "What are the manual steps if I need to add records myself?",
        answer: [
          "GoDaddy fallback: add TXT _schedulaa with the token and CNAME www pointing to schedulaa.com, then verify.",
          "Namecheap: Domain List > Manage > Advanced DNS. Add the TXT and CNAME with TTL Automatic, save, and verify.",
          "Cloudflare: add the TXT and CNAME in DNS > Records. Turn the orange cloud off while verifying, then re-enable after SSL is active."
        ].join("\n\n"),
      },
      {
        question: "Using Cloudflare orange-cloud proxy?",
        answer:
          "Temporarily switch the orange cloud off for the www CNAME so DNS verification succeeds. Once SSL shows Active inside Schedulaa you can turn the proxy back on.",
      },
      {
        question: "Troubleshooting tips for verification errors?",
        answer: [
          "TXT not found: double-check the host (_schedulaa vs _schedulaa.www).",
          "CNAME ignored: remove any existing A record for www before adding the CNAME.",
          "Still pending: DNS may be cached - wait about 30 minutes and click Verify DNS again.",
          "Domain already in use: contact admin@schedulaa.com so we can transfer ownership inside Schedulaa."
        ].join("\n\n"),
      },
      {
        question: "Does Schedulaa take control of my domain?",
        answer:
          "No. You keep full ownership at your registrar. Schedulaa only verifies the records so we can serve your site securely; we never transfer, renew, or bill for your domain.",
      },
      {
        question: "Can I double-check the records with command-line tools?",
        answer:
          "Yes. Run nslookup -type=txt _schedulaa.www.yourdomain.com and nslookup -type=cname www.yourdomain.com. Once both commands show the expected values, click Verify DNS in Schedulaa.",
      },
    ],
  },
  {
    key: "tax",
    title: "Checkout & tax",
    icon: RequestQuoteIcon,
    description:
      "Configure Stripe Automatic Tax and understand how Schedulaa handles regional pricing.",
    cta: { label: "Review checkout settings", to: "/marketing/analytics-dashboard" },
    items: [
      {
        question: "How do I enable Automatic Tax for Stripe payments?",
        answer: [
          "1) In Schedulaa: open Company Profile, set Country and Province/State, and decide whether Prices include tax should be ON or OFF.",
          "2) Connect Stripe: click Connect with Stripe, finish onboarding, and wait until the banner says Ready to accept payments.",
          "3) In Stripe: open the dashboard from Schedulaa, go to Tax > Overview, enable Automatic tax, set Business information > Origin address, and choose a default tax category (start with General - Services).",
          "4) Registrations: in Stripe Tax > Registrations add your home region first, then add other regions only after you register or Stripe flags a threshold."
        ].join("\n\n"),
      },
      {
        question: "What does the 'Prices include tax' toggle change?",
        answer:
          "When it is ON, the price customers see already includes tax (for example, $40 stays $40 and Stripe backs the tax out). When it is OFF, checkout shows the base price plus tax so $40 becomes $40 + tax.",
      },
      {
        question: "Do I need to register in every state or province?",
        answer:
          "Start with your home region. Add extra registrations in Stripe only where you're legally obligated or once a threshold alert fires. Stripe's threshold monitoring helps you grow responsibly.",
      },
      {
        question: "Who sends receipts and how are cross-border orders handled?",
        answer:
          "Stripe issues branded receipts automatically. Taxes are calculated based on the buyer location and the regions you registered-if you aren't registered somewhere, Stripe won't collect there.",
      },
    ],
  },
  {
    key: "payroll",
    title: "Payroll coverage",
    icon: PaymentsIcon,
    description:
      "Clarity on which regions we support today and the items you still need to process manually.",
    cta: { label: "Check payroll coverage", to: "/payroll" },
    items: [
      {
        question: "Which regions are fully supported?",
        answer:
          "Schedulaa covers US federal tax plus most states, and Canadian provinces outside Québec. Local/city levies and Québec programs (QPP, RQAP/QPIP) still require external handling; see the Docs for the full state list.",
      },
      {
        question: "What payroll features are automated?",
        answer:
          "We calculate federal/state taxes, FICA, FUTA/SUI, vacation accruals, automated statutory holiday pay (Canada), PTO tracking, and provide payroll exports. Year-end forms (W-2 / T4) and Canadian ROE creation/export are included.",
      },
      {
        question: "Are local or city taxes calculated automatically?",
        answer:
          "Not yet. Municipal levies (NYC, STL, WA paid family leave, etc.) still need to be processed externally and reconciled in your accounting system.",
      },
      {
        question: "Can Schedulaa manage wage garnishments or ROEs?",
        answer:
          "Garnishments and legal holds still require external handling. Canadian ROE creation, review, and export (PDF / XML) are fully supported.",
      },
      {
        question: "What should I do if my province or state isn't listed?",
        answer:
          "Reach out to admin@schedulaa.com with your region. We prioritise roadmap work based on demand and can share timelines for upcoming tax tables.",
      },
    ],
  },
];

const FAQPage = () => {
  const theme = useTheme();
  const meta = useMemo(() => HERO_META, []);
  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_SECTIONS.flatMap((section) =>
        section.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        }))
      ),
    }),
    []
  );

  return (
    <>
      <Meta {...meta} />
      <JsonLd data={faqSchema} />
      <Box
        sx={{
          position: "relative",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Chip
              icon={<HelpOutlineIcon />}
              label="Frequently Asked Questions"
              color="primary"
              sx={{ fontWeight: 600, letterSpacing: 0.4 }}
            />
            <Typography variant="h2" fontWeight={800} sx={{ fontSize: { xs: 36, md: 48 } }}>
              Answers for every Schedulaa rollout
            </Typography>
            <Typography variant="h6" color="text.secondary" maxWidth={720}>
              Browse quick answers for website updates, domain setup, marketing automation, Stripe tax configuration, and payroll coverage-all in one place.
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack spacing={{ xs: 6, md: 8 }}>
          {FAQ_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Box key={section.key}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main,
                    }}
                  >
                    <Icon />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {section.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {section.description}
                    </Typography>
                  </Box>
                </Stack>
                <Stack spacing={1.5}>
                  {section.items.map((item, idx) => (
                    <Accordion key={idx} disableGutters elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.8)}`, borderRadius: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {item.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, whiteSpace: "pre-line" }}>
                          {item.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
                {section.cta && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      component={Link}
                      to={section.cta.to}
                      variant="text"
                      endIcon={<ArrowForwardIcon fontSize="small" />}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      {section.cta.label}
                    </Button>
                  </Box>
                )}
              </Box>
            );
          })}

          <Divider />

          <Box
            sx={{
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              p: { xs: 4, md: 6 },
            }}
          >
            <Stack spacing={2} alignItems={{ xs: "flex-start", md: "center" }} direction={{ xs: "column", md: "row" }} justifyContent="space-between">
              <Stack spacing={1}>
                <Typography variant="h5" fontWeight={700}>
                  Still need help?
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Our rollout specialists and support engineers can walk you through DNS changes, marketing campaigns, tax setup, or payroll edge cases.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Chip icon={<SupportAgentIcon />} label="Email admin@schedulaa.com" component="a" clickable href="mailto:admin@schedulaa.com" color="primary" />
                <Chip icon={<PublicIcon />} label="Visit the Help Center" component="a" clickable href="/client/support" variant="outlined" />
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </>
  );
};

export default FAQPage;
