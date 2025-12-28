import React from "react";
import { Box, Grid, Paper, Stack, Typography, List, ListItem, ListItemIcon, Button, Divider } from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import InsightsIcon from "@mui/icons-material/Insights";
import ChecklistIcon from "@mui/icons-material/Checklist";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Meta from "../../../components/Meta";
import JsonLd from "../../../components/seo/JsonLd";
import HeroShowcase from "../../components/HeroShowcase";
import CTASection from "../../components/CTASection";

const staffingFormulaGroups = [
  {
    title: "Coverage + capacity planning",
    icon: <CalculateIcon color="primary" />,
    items: [
      "Headcount coverage per day: planned shifts vs required demand.",
      "Service capacity per role: available hours * service rate.",
      "Booking coverage ratio: booked hours / staffed hours.",
      "Peak overlap: peak hour staffing vs expected demand.",
    ],
  },
  {
    title: "Labor cost + payroll readiness",
    icon: <TrendingUpIcon color="primary" />,
    items: [
      "Labor cost percentage: labor spend / revenue.",
      "Overtime exposure: projected OT hours by role.",
      "Premium + tip allocation: adjustments by shift type.",
      "Payroll-ready hours: approved hours / total hours.",
    ],
  },
  {
    title: "Operational compliance checks",
    icon: <ChecklistIcon color="primary" />,
    items: [
      "Break compliance rate: compliant shifts / total shifts.",
      "Late approval rate: unapproved timesheets by cutoff.",
      "Schedule change impact: edits after publish per week.",
      "Missing time entries: shifts without clock events.",
    ],
  },
  {
    title: "Insights for staffing agencies",
    icon: <InsightsIcon color="primary" />,
    items: [
      "Fill rate by client and role.",
      "Time-to-fill from job post to acceptance.",
      "Retention by placement cohort.",
      "Billable vs paid hour delta.",
    ],
  },
];

const staffingFaq = [
  {
    question: "What staffing formulas matter most for payroll accuracy?",
    answer:
      "Start with payroll-ready hours, break compliance rate, and schedule change impact. These three metrics show whether the time data feeding payroll is clean, approved, and policy-compliant before exports.",
  },
  {
    question: "How often should I review staffing formulas?",
    answer:
      "Most service teams review coverage and labor cost weekly, then do a monthly audit of compliance and overtime trends. Staffing agencies usually review fill rate and billable vs paid hours after each client cycle.",
  },
  {
    question: "Do I need a separate analytics tool to use these formulas?",
    answer:
      "Not necessarily. If your scheduling, time tracking, and approvals live in one system, the data is already structured. You can export clean CSVs or use built-in dashboards to compute the ratios.",
  },
  {
    question: "How do these formulas help with hiring decisions?",
    answer:
      "Coverage ratios and peak overlap expose gaps, while overtime exposure and late approvals reveal where staffing levels or policies need adjustment. Together, they create a clear, data-backed case for hiring or rebalancing shifts.",
  },
];

const StaffingFormulasPage = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Staffing Formulas & Planning Guide",
    description:
      "A concise staffing formulas guide for coverage, labor cost, compliance, and payroll readiness built for service teams and staffing agencies.",
    url: "https://www.schedulaa.com/resources/staffing-formulas",
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: staffingFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title="Staffing Formulas & Workforce Planning Guide | Schedulaa"
        description="Use these staffing formulas to balance coverage, labor costs, compliance, and payroll readiness for service teams and staffing agencies."
        canonical="https://www.schedulaa.com/resources/staffing-formulas"
        og={{
          title: "Staffing Formulas & Workforce Planning Guide",
          description:
            "A practical checklist of staffing formulas to keep schedules, payroll, and compliance aligned.",
          image: "https://www.schedulaa.com/og/default.jpg",
        }}
      />
      <JsonLd data={schema} />
      <JsonLd data={faqSchema} />

      <HeroShowcase
        eyebrow="Resource guide"
        title="Staffing formulas that keep schedules, payroll, and compliance aligned."
        subtitle="Use these formulas to forecast staffing coverage, measure labor efficiency, and keep payroll-ready hours clean before payday. Built for service teams and staffing agencies operating in the US and Canada."
        primaryCTA={{ label: "See pricing", to: "/pricing", variant: "contained" }}
        secondaryCTA={{ label: "Book a demo", to: "/demo", variant: "outlined" }}
      />

      <Box sx={{ px: { xs: 2, md: 6 }, pb: { xs: 8, md: 12 } }}>
        <Stack spacing={4} sx={{ maxWidth: 1100, mx: "auto" }}>
          <Stack spacing={2}>
            <Typography component="h2" variant="h5" fontWeight={800}>
              Why staffing formulas matter
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Staffing decisions are only as good as the data behind them. Service teams deal with shift changes, real-time
              coverage needs, break rules, and payroll approvals that can shift by the hour. When the inputs are messy, payroll
              exports are messy, and managers spend their week reconciling exceptions instead of improving operations. A simple
              set of formulas keeps the picture clear: what coverage you planned, what actually happened, and whether payroll is
              ready without manual fixes.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The formulas below are built for operations-first businesses like salons, clinics, staffing agencies, field teams,
              and multi-location service brands. They are designed to work with real-world signals: approved hours, break
              compliance, overtime exposure, and staffing utilization. Use them weekly to stabilize your schedules and monthly to
              reveal trends that impact hiring, retention, and labor spend.
            </Typography>
          </Stack>

          <Typography variant="h5" fontWeight={800}>
            What is included
          </Typography>
          <Grid container spacing={3}>
            {staffingFormulaGroups.map((group) => (
              <Grid item xs={12} md={6} key={group.title}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {group.icon}
                      <Typography variant="h6" fontWeight={700}>
                        {group.title}
                      </Typography>
                    </Stack>
                    <List dense sx={{ pl: 2 }}>
                      {group.items.map((item) => (
                        <ListItem key={item} sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main" }} />
                          </ListItemIcon>
                          <Typography variant="body2" color="text.secondary">
                            {item}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
            <Stack spacing={2}>
              <Typography component="h2" variant="h6" fontWeight={700}>
                How to apply the formulas every week
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Start with coverage and capacity planning on Monday. Compare planned staffing hours to expected demand and
                identify where your schedule is under-covered before clients or projects pile up. Mid-week, review break
                compliance and schedule change impact to ensure your team stays compliant and the schedule you published still
                matches reality. At the end of the week, focus on payroll-ready hours and overtime exposure so payroll exports
                stay clean and predictable.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Staffing agencies should layer in fill rate, time-to-fill, and billable vs paid hours after each client cycle.
                These reveal whether the placement pipeline is healthy and where margins are leaking. Keep a running baseline for
                each client or location, then compare week-over-week to spot changes in demand or staffing efficiency.
              </Typography>
              <Divider />
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Data checklist before you calculate
                </Typography>
                <List dense sx={{ pl: 2 }}>
                  {[
                    "Published schedules with shift templates and break rules.",
                    "Approved time entries with manager sign-off.",
                    "Overtime and premium flags by role or location.",
                    "Tip or incentive allocations tied to shifts.",
                    "Exports or CSVs grouped by client, department, or job.",
                  ].map((item) => (
                    <ListItem key={item} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main" }} />
                      </ListItemIcon>
                      <Typography variant="body2" color="text.secondary">
                        {item}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                How Schedulaa puts these formulas to work
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Schedulaa connects scheduling, time tracking, approvals, and payroll exports so staffing data stays clean
                throughout the week. Managers can see overtime risk, break compliance, and time approval status before payroll
                runs, and staffing agencies can export structured data for client reporting or payroll reconciliation.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Because staffing formulas rely on consistent, structured inputs, Schedulaa standardizes the data at the source.
                Shift templates define break policies, approvals lock time entries, and exports stay tied to the operational
                events that created them. That means every formula here can be computed without manual cleanup, and every
                manager sees the same source of truth.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button variant="contained" href="/pricing">
                  See pricing
                </Button>
                <Button variant="outlined" href="/demo">
                  Watch the demo
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
            <Stack spacing={2}>
              <Typography component="h2" variant="h6" fontWeight={700}>
                Staffing formulas FAQ
              </Typography>
              {staffingFaq.map((item) => (
                <Box key={item.question}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {item.question}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.answer}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Box>

      <CTASection
        eyebrow="Ready to put formulas into action?"
        title="Keep staffing, compliance, and payroll in sync from one system."
        description="Schedulaa links schedules, time tracking, approvals, and exports so your staffing plan matches what payroll actually pays."
        primaryLabel="See pricing"
        primaryHref="/pricing"
        secondaryLabel="Book a demo"
        secondaryHref="/demo"
      />
    </Box>
  );
};

export default StaffingFormulasPage;
