import React from "react";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  Chip,
  Button,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RuleIcon from "@mui/icons-material/Rule";
import CheckIcon from "@mui/icons-material/CheckCircleOutline";
import TimelineIcon from "@mui/icons-material/Timeline";
import InsightsIcon from "@mui/icons-material/Insights";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

import Meta from "../../components/Meta";
import CTASection from "../components/CTASection";
import JsonLd from "../../components/seo/JsonLd";

const workforceHero = {
  title: "All-in-one workforce command center",
  subtitle:
    "Schedulaa already unified online scheduling, payroll, and website pages. Now we’ve closed the loop on time tracking so hours, templates, policy audits, and payroll-ready approvals live in one dashboard—with IP/device hints captured automatically for every punch.",
};

const workforceHighlights = [
  {
    icon: <AccessTimeIcon color="primary" />,
    title: "Real-time clocking with policy enforcement",
    bullets: [
      "Employees clock in/out from the streamlined My Time workspace with a live timer that subtracts break minutes, shows hours worked, and visualizes the shift timeline.",
      "Break controls respect company policy—managers define default windows inside shift templates and the employee UI enforces them for payroll, flagging missed or overdue breaks instantly.",
      "Personal weekly insights (for example “32h worked • 2h overtime • 3 breaks taken”) keep the process transparent.",
    ],
  },
  {
    icon: <RuleIcon color="primary" />,
    title: "Manager-grade oversight",
    bullets: [
      "Every time entry flows into the approvals page where supervisors filter by department, employee, or status before approving or rejecting—even mid-shift if something looks off.",
      "IP/device hints expose unusual punch locations while compliance chips surface shifts missing breaks or trending toward overtime.",
      "Need to correct multiple entries? Apply a break or shift template across selected rows and update everything at once.",
    ],
  },
  {
    icon: <TimelineIcon color="primary" />,
    title: "Shift templates with compliance baked in",
    bullets: [
      "Templates capture break start/end times, duration, paid/unpaid flags, and availability links.",
      "Applying a template pushes those rules into every shift assignment and the employee clock UI automatically—no manual edits.",
      "Force clock-out and annotate overdue shifts so approvals stay clean for payroll.",
    ],
  },
  {
    icon: <InsightsIcon color="primary" />,
    title: "Availability + shift sync",
    bullets: [
      "Managers see each employee’s upcoming shifts, availability conflicts, and overtime risk inside the Availability pane.",
      "Assignments inherit template break settings so double entry disappears, and linked availability slots stay locked until the shift is cleared.",
      "Live roster shows who is on-break vs. on-shift, with anomaly flags for unusual IP/device.",
    ],
  },
  {
    icon: <AssignmentTurnedInIcon color="primary" />,
    title: "Payroll-ready exports",
    bullets: [
      "Approved entries carry metadata for both supervisors and payroll teams (who approved, when, policy references, and punch location hints).",
      "Exports stay clean, audits stay simple, and payroll files ingest directly into accounting.",
    ],
  },
];

const workforceCTA = {
  eyebrow: "Workforce + payroll together",
  title: "Booking, scheduling, payroll, websites… and now policy-aware time tracking in the same platform.",
  description: [
    "No spreadsheets, no copy/paste, and no compliance surprises.",
    "Clocking, approvals, templates, and payroll exports all stay in sync.",
  ],
  primaryLabel: "See the time tracking workspace",
  secondaryLabel: "Talk to sales",
};

const WorkforcePage = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Schedulaa Workforce Command Center",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://www.schedulaa.com/workforce",
    description:
      "Schedulaa unifies booking, scheduling, payroll, websites, and workforce time tracking—from clock-in/out policies to payroll-ready approvals.",
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "USD",
    },
    provider: {
      "@type": "Organization",
      name: "Schedulaa",
      url: "https://www.schedulaa.com",
    },
  };

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 } }}>
      <Meta
        title="Workforce Command Center | Time Tracking, Scheduling & Payroll"
        description="Close the loop with Schedulaa’s workforce command center—clock-in/out policies, approvals, availability, and payroll-ready exports in one dashboard."
        canonical="https://www.schedulaa.com/workforce"
        og={{ title: "Schedulaa Workforce Command Center", description: workforceHero.subtitle }}
      />
      <JsonLd data={schema} />

      <Stack spacing={3} alignItems="flex-start" mb={8}>
        <Chip label="Workforce" color="primary" />
        <Typography component="h1" variant="h2" fontWeight={800}>
          {workforceHero.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" maxWidth={720}>
          {workforceHero.subtitle}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button component="a" href="/register" variant="contained" size="large">
            Start free
          </Button>
          <Button component="a" href="/contact" variant="outlined" size="large">
            Request a walkthrough
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} mb={10}>
        {workforceHighlights.map((item) => (
          <Grid item xs={12} md={6} key={item.title}>
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: 4,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                p: 3,
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {item.icon}
                  <Typography variant="h6" fontWeight={700}>
                    {item.title}
                  </Typography>
                </Stack>
                <List dense>
                  {item.bullets.map((bullet) => (
                    <ListItem key={bullet} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="body2" color="text.secondary">
                        {bullet}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <CTASection
        eyebrow={workforceCTA.eyebrow}
        title={workforceCTA.title}
        description={workforceCTA.description}
        primaryCTA={{ label: workforceCTA.primaryLabel, to: "/register" }}
        secondaryCTA={{ label: workforceCTA.secondaryLabel, to: "/contact" }}
      />
    </Box>
  );
};

export default WorkforcePage;
