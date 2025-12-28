import React from "react";
import { Box, Grid, Paper, Stack, Typography, List, ListItem, ListItemIcon, Button, Chip, Divider } from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ScheduleIcon from "@mui/icons-material/Schedule";
import Meta from "../../../components/Meta";
import JsonLd from "../../../components/seo/JsonLd";
import HeroShowcase from "../../components/HeroShowcase";
import CTASection from "../../components/CTASection";

const agendaItems = [
  "How break enforcement and shift templates reduce payroll disputes.",
  "Time tracking approvals and audit trails that keep payroll clean.",
  "Overtime, premiums, and tips calculated from real shift data.",
  "Payroll exports to QuickBooks/Xero and compliance forms (W-2, T4, ROE).",
  "Common staffing compliance pitfalls and how to avoid them.",
];

const audience = [
  "Service teams running hourly payroll and shift-based schedules.",
  "Staffing agencies managing placements across multiple clients.",
  "HR leaders responsible for time approvals and payroll accuracy.",
  "Operations managers who need audit-ready compliance workflows.",
];

const webinarFaq = [
  {
    question: "Is this webinar only for payroll admins?",
    answer:
      "No. It is designed for operations leaders, HR, and finance teams who need payroll to reflect real schedule activity. Anyone responsible for staffing, time approvals, or compliance will benefit.",
  },
  {
    question: "Do you cover Canada and US payroll compliance?",
    answer:
      "Yes. The workflow includes break enforcement, audit logs, and exports that support W-2, T4, and ROE reporting, plus accounting handoffs to QuickBooks or Xero.",
  },
  {
    question: "Will I see the actual product workflows?",
    answer:
      "Yes. The session walks through shift templates, time tracking approvals, and payroll-ready exports so you can see how data flows end-to-end.",
  },
  {
    question: "Can staffing agencies use the same compliance workflow?",
    answer:
      "Absolutely. The webinar includes guidance on managing placements, exporting client-ready reports, and reconciling billable vs paid hours.",
  },
];

const PayrollComplianceWebinarPage = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Payroll Compliance Webinar",
    description:
      "On-demand walkthrough of payroll compliance for service businesses, covering break rules, approvals, audit logs, and payroll-ready exports.",
    url: "https://www.schedulaa.com/webinars/payroll-compliance",
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: webinarFaq.map((item) => ({
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
        title="Payroll Compliance Webinar | Schedulaa"
        description="Watch the payroll compliance webinar for service teams: break enforcement, audit logs, approvals, and payroll-ready exports."
        canonical="https://www.schedulaa.com/webinars/payroll-compliance"
        og={{
          title: "Payroll Compliance Webinar",
          description: "Break compliance, approvals, audit logs, and payroll exports in one workflow.",
          image: "https://www.schedulaa.com/og/default.jpg",
        }}
      />
      <JsonLd data={schema} />
      <JsonLd data={faqSchema} />

      <HeroShowcase
        eyebrow="On-demand webinar"
        title="Payroll compliance for service teams, explained end-to-end."
        subtitle="See how Schedulaa keeps time tracking, break enforcement, approvals, and payroll exports aligned so compliance stays audit-ready and payroll stays accurate."
        primaryCTA={{ label: "Book a demo", to: "/demo", variant: "contained" }}
        secondaryCTA={{ label: "See pricing", to: "/pricing", variant: "outlined" }}
      />

      <Box sx={{ px: { xs: 2, md: 6 }, pb: { xs: 8, md: 12 } }}>
        <Stack spacing={4} sx={{ maxWidth: 1100, mx: "auto" }}>
          <Stack spacing={2}>
            <Typography component="h2" variant="h5" fontWeight={800}>
              Why payroll compliance breaks down
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Payroll compliance failures rarely start in payroll. They begin upstream when schedules change late, breaks are
              missed, or approvals are rushed at the end of the week. By the time finance receives the data, it is already
              inconsistent and hard to audit. This webinar walks through a practical, operations-first workflow that keeps time
              data accurate before it becomes payroll data.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The goal is simple: make sure every shift, break, and premium is captured once and validated early. When approvals
              are tied to real schedules, you eliminate retroactive fixes, reduce disputes, and keep compliance audits clean.
              Whether you run a service business or a staffing agency, the same structure applies and scales as teams grow.
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <VerifiedUserIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      What you will learn
                    </Typography>
                  </Stack>
                  <List dense sx={{ pl: 2 }}>
                    {agendaItems.map((item) => (
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
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <FactCheckIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      Who it is for
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {audience.map((item) => (
                      <Chip key={item} label={item} variant="outlined" sx={{ justifyContent: "flex-start" }} />
                    ))}
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ScheduleIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      25-minute session + live workflow tour
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Why this matters
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Compliance issues usually start upstream: schedule changes, missed breaks, and unapproved time. This webinar
                shows how Schedulaa keeps approvals, audit logs, and payroll exports connected so finance teams receive clean,
                compliant data on payday.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You will see how policy-aware shift templates define break rules, how managers approve time in real time, and how
                payroll-ready exports retain the audit trail. That means fewer payroll corrections, fewer disputes, and better
                confidence for both managers and employees. The session also covers how to export to QuickBooks or Xero and how
                to prepare compliance forms without rebuilding data each cycle.
              </Typography>
              <Divider />
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Compliance checklist covered in the webinar
                </Typography>
                <List dense sx={{ pl: 2 }}>
                  {[
                    "Break rules enforced at the time of the shift, not after.",
                    "Time approvals locked before payroll processing.",
                    "Audit log visibility for edits, approvals, and exceptions.",
                    "Overtime, premiums, and tips calculated from actual shifts.",
                    "Exports grouped by location, client, or department.",
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
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button variant="contained" href="/demo">
                  Watch the demo
                </Button>
                <Button variant="outlined" href="/pricing">
                  See pricing
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
            <Stack spacing={2}>
              <Typography component="h2" variant="h6" fontWeight={700}>
                Payroll compliance FAQ
              </Typography>
              {webinarFaq.map((item) => (
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
        eyebrow="Keep payroll compliant"
        title="Audit-ready approvals, break enforcement, and clean exports."
        description="Schedulaa connects the operations that drive payroll so compliance never lags behind."
        primaryLabel="See pricing"
        primaryHref="/pricing"
        secondaryLabel="Book a demo"
        secondaryHref="/demo"
      />
    </Box>
  );
};

export default PayrollComplianceWebinarPage;
