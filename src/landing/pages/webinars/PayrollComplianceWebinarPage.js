import React from "react";
import { Box, Grid, Paper, Stack, Typography, List, ListItem, ListItemIcon, Button, Chip } from "@mui/material";
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

const PayrollComplianceWebinarPage = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Payroll Compliance Webinar",
    description:
      "On-demand walkthrough of payroll compliance for service businesses, covering break rules, approvals, audit logs, and payroll-ready exports.",
    url: "https://www.schedulaa.com/webinars/payroll-compliance",
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
          image: "https://www.schedulaa.com/og/webinar.jpg",
        }}
      />
      <JsonLd data={schema} />

      <HeroShowcase
        eyebrow="On-demand webinar"
        title="Payroll compliance for service teams, explained end-to-end."
        subtitle="See how Schedulaa keeps time tracking, break enforcement, approvals, and payroll exports aligned so compliance stays audit-ready and payroll stays accurate."
        primaryCTA={{ label: "Request access", to: "/contact", variant: "contained" }}
        secondaryCTA={{ label: "See workforce tools", to: "/workforce", variant: "outlined" }}
      />

      <Box sx={{ px: { xs: 2, md: 6 }, pb: { xs: 8, md: 12 } }}>
        <Stack spacing={4} sx={{ maxWidth: 1100, mx: "auto" }}>
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
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button variant="contained" href="/contact">
                  Book a walkthrough
                </Button>
                <Button variant="outlined" href="/payroll">
                  Explore payroll workflows
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Box>

      <CTASection
        eyebrow="Keep payroll compliant"
        title="Audit-ready approvals, break enforcement, and clean exports."
        description="Schedulaa connects the operations that drive payroll so compliance never lags behind."
        primaryLabel="Start free"
        primaryHref="/register"
        secondaryLabel="Talk to sales"
        secondaryHref="/contact"
      />
    </Box>
  );
};

export default PayrollComplianceWebinarPage;
