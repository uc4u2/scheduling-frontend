import React, { useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import LaunchIcon from "@mui/icons-material/Launch";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DomainIcon from "@mui/icons-material/Domain";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Meta from "../../../components/Meta";
import JsonLd from "../../../components/seo/JsonLd";
import { Link } from "react-router-dom";

const STEPS = [
  {
    title: "Locate your Schedulaa slug",
    description:
      "Open Manager → Website → Public Site. Copy the Company slug shown there. Your live URL always follows https://www.schedulaa.com/{slug}.",
  },
  {
    title: "Open GoDaddy domain forwarding",
    description:
      "In GoDaddy go to Domains → Manage DNS → Forwarding → Add Domain Forwarding. No DNS A/CNAME changes are required.",
  },
  {
    title: "Forward with masking",
    description:
      "Choose Permanent (301), enter the Schedulaa URL with your slug, and set Forward WITH masking so visitors keep seeing your domain.",
  },
  {
    title: "Save & test",
    description:
      "Save the forwarding rule, wait a few minutes, then load your domain. It should now display your Schedulaa site with your domain in the bar.",
  },
];

const DOMAIN_FAQ = [
  {
    question: "Why can’t I point DNS records directly to Schedulaa?",
    answer:
      "Schedulaa routes public sites strictly by slug and does not currently issue SSL certificates per external domain. Forwarding keeps traffic secure on Schedulaa’s certificates while showing your domain.",
  },
  {
    question: "Do I need TXT, A, or CNAME records?",
    answer:
      "No. Forwarding with masking is the supported approach today. DNS changes would fail because Schedulaa does not terminate SSL for custom hosts yet.",
  },
  {
    question: "Can I use registrars other than GoDaddy?",
    answer:
      "Yes—choose the equivalent forwarding + masking option your registrar provides and point it to https://www.schedulaa.com/{slug}.",
  },
];

const DOMAIN_CONNECT_STEPS = [
  {
    title: "Start from Schedulaa",
    description:
      "Go to Manager → Website → Domain Settings, enter your domain (example.com), and click Connect Automatically (GoDaddy). We detect GoDaddy accounts automatically.",
  },
  {
    title: "Approve the GoDaddy prompt",
    description:
      "GoDaddy will ask you to authorize Schedulaa to manage DNS for that domain. Click Allow/Approve so we can create the TXT + CNAME records for you.",
  },
  {
    title: "Stay on the GoDaddy tab until it completes",
    description:
      "Once the authorization succeeds, GoDaddy redirects back to Schedulaa. We immediately start polling DNS, verifying TXT ownership, and checking the CNAME target.",
  },
  {
    title: "Let Schedulaa issue SSL automatically",
    description:
      "After verification succeeds, Schedulaa requests an SSL certificate, so your custom domain serves the site over HTTPS without any manual work.",
  },
];

const TROUBLESHOOTING = [
  {
    title: "No GoDaddy prompt",
    body: "Confirm you are logged into the correct GoDaddy account and the domain is active. Reopen Domain Settings → Connect Automatically.",
  },
  {
    title: "SSL stuck on “Pending”",
    body: "DNS might still be propagating. Give it 5–15 minutes; we check automatically and email you once SSL is active.",
  },
  {
    title: "Old DNS records",
    body: "Legacy A/CNAME/TXT entries can conflict. Remove outdated records for the same host (for example, www) before retrying or let Schedulaa clean them up when prompted.",
  },
];

const DomainHelpPage = () => {
  const theme = useTheme();
  const meta = {
    title: "Connect Your GoDaddy Domain to Schedulaa | Help Center",
    description:
      "Follow these steps to forward any GoDaddy domain to your Schedulaa public site using your company slug. No DNS edits required—just forwarding with masking.",
    canonical: "https://www.schedulaa.com/help/domains",
    og: {
      title: "GoDaddy Domain Forwarding Guide | Schedulaa",
      description:
        "Schedulaa public sites are routed by slug. Forward your GoDaddy domain with masking to https://www.schedulaa.com/{slug} for instant setup.",
      image: "https://www.schedulaa.com/og/domains-help.jpg",
    },
  };

  const howToSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "Connect a GoDaddy domain to a Schedulaa site",
      description: meta.description,
      totalTime: "PT10M",
      supply: [
        { "@type": "HowToSupply", name: "Schedulaa company slug (https://www.schedulaa.com/{slug})" },
        { "@type": "HowToSupply", name: "GoDaddy domain" },
      ],
      step: STEPS.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        itemListElement: [
          {
            "@type": "HowToDirection",
            text: step.description,
          },
        ],
      })),
    }),
    [meta.description]
  );

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, pb: { xs: 10, md: 14 } }}>
      <Meta {...meta} />
      <JsonLd data={howToSchema} />

      <Container maxWidth="md" sx={{ pt: { xs: 8, md: 12 } }}>
        <Stack spacing={3} textAlign="center" alignItems="center">
          <Chip icon={<DomainIcon />} label="Domains" color="primary" sx={{ fontWeight: 600 }} />
          <Typography variant="h2" fontWeight={800}>
            Connect Your GoDaddy Domain to Schedulaa
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth={720}>
            Schedulaa hosts every public site at https://schedulaa.com/&lbrace;slug&rbrace;. Use GoDaddy forwarding with masking to point any domain to your
            business page without DNS records.
          </Typography>
          <Button
            component={Link}
            to="/manager/website"
            variant="contained"
            color="primary"
            endIcon={<LaunchIcon />}
            sx={{ borderRadius: 999, px: 4 }}
          >
            Open Website Settings
          </Button>
        </Stack>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 10 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: "100%", borderRadius: 4, p: 3 }}>
              <Typography variant="overline" color="text.secondary" letterSpacing={2}>
                Step 1
              </Typography>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Find your slug
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Go to Manager → Website → Public Site. Copy the slug under “Schedulaa URL”. Your link will look like:
                <Box
                  component="code"
                  sx={{
                    display: "block",
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    fontFamily: "monospace",
                  }}
                >
                  https://www.schedulaa.com/&lt;your-slug&gt;
                </Box>
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: "100%", borderRadius: 4, p: 3 }}>
              <Typography variant="overline" color="text.secondary" letterSpacing={2}>
                Step 2
              </Typography>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Configure GoDaddy forwarding
              </Typography>
              <Stack spacing={1.5}>
                {[
                  "Log in to GoDaddy → Domains → Manage DNS.",
                  "Scroll to Forwarding → Add Domain Forwarding.",
                  "Paste your Schedulaa URL (with slug).",
                  "Select Permanent (301) and Forward WITH masking.",
                ].map((item) => (
                  <Stack direction="row" spacing={1} alignItems="center" key={item}>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                    <Typography variant="body1" color="text.secondary">
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 } }}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            backgroundColor: alpha(theme.palette.secondary.main, 0.06),
          }}
        >
          <Typography variant="overline" color="text.secondary" letterSpacing={2}>
            Automatic setup
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
            GoDaddy Domain Connect (no manual DNS)
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5 }}>
            If your registrar is GoDaddy, Schedulaa can create the TXT + CNAME records for you and start SSL automatically. Use the “Connect Automatically” button inside
            Domain Settings and follow the steps below.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 3 }}>
            {DOMAIN_CONNECT_STEPS.map((step, index) => (
              <Grid item xs={12} md={6} key={step.title}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    p: 3,
                  }}
                >
                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={`Step ${index + 1}`} size="small" color="primary" />
                      <Typography variant="subtitle2" fontWeight={700}>
                        {step.title}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Card>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 } }}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Typography variant="overline" letterSpacing={2} color="text.secondary">
            Why forwarding?
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {[
              {
                title: "Schedulaa routes by slug",
                body: "Every public site is resolved using CompanyProfile.slug. Pointing a domain to that slug is enough for routing.",
              },
              {
                title: "SSL stays on schedulaa.com",
                body: "Schedulaa issues SSL for its own host. Domain forwarding keeps traffic secure without custom certificates.",
              },
              {
                title: "No DNS downtime",
                body: "You avoid A/CNAME edits and DNS propagation. Changes in GoDaddy forwarding apply in minutes.",
              },
            ].map((block) => (
              <Grid item xs={12} md={4} key={block.title}>
                <Stack spacing={1.5} sx={{ height: "100%" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <InfoOutlinedIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>
                      {block.title}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {block.body}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Card>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 } }}>
        <Grid container spacing={3}>
          {TROUBLESHOOTING.map((tip) => (
            <Grid item xs={12} md={4} key={tip.title}>
              <Card variant="outlined" sx={{ borderRadius: 3, p: 3, height: "100%" }}>
                <Stack spacing={1.25}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {tip.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tip.body}
                  </Typography>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="md" sx={{ mt: { xs: 8, md: 12 } }}>
        <Stack spacing={3} textAlign="center">
          <Typography variant="overline" color="text.secondary" letterSpacing={2}>
            FAQs
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            Common domain questions
          </Typography>
        </Stack>
        <Stack spacing={3} sx={{ mt: { xs: 4, md: 6 } }}>
          {DOMAIN_FAQ.map((item) => (
            <Card key={item.question} variant="outlined" sx={{ borderRadius: 3, p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" fontWeight={700}>
                {item.question}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                {item.answer}
              </Typography>
            </Card>
          ))}
        </Stack>
      </Container>

      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            background: `linear-gradient(130deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(
              theme.palette.secondary.main,
              0.8
            )})`,
            color: theme.palette.common.white,
            textAlign: "center",
          }}
        >
          <Typography variant="h4" fontWeight={800}>
            Need hands-on help?
          </Typography>
          <Typography variant="body1" sx={{ mt: 1.5, opacity: 0.9 }}>
            Our rollout team can confirm your slug, walk you through GoDaddy, or scope fully custom domain/SSL support when you’re ready.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button component={Link} to="/contact" variant="contained" color="secondary" endIcon={<ArrowForwardIcon />} sx={{ px: 4 }}>
              Talk to support
            </Button>
            <Button component={Link} to="/docs#domains" variant="outlined" color="inherit" sx={{ px: 4 }}>
              Open documentation
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default DomainHelpPage;
