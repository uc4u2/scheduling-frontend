import React from "react";
import { Box, Grid, Paper, Stack, Typography, List, ListItem, ListItemIcon, Button } from "@mui/material";
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

const StaffingFormulasPage = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Staffing Formulas & Planning Guide",
    description:
      "A concise staffing formulas guide for coverage, labor cost, compliance, and payroll readiness built for service teams and staffing agencies.",
    url: "https://www.schedulaa.com/resources/staffing-formulas",
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
          image: "https://www.schedulaa.com/og/resources.jpg",
        }}
      />
      <JsonLd data={schema} />

      <HeroShowcase
        eyebrow="Resource guide"
        title="Staffing formulas that keep schedules, payroll, and compliance aligned."
        subtitle="Use these formulas to forecast staffing coverage, measure labor efficiency, and keep payroll-ready hours clean before payday. Built for service teams and staffing agencies operating in the US and Canada."
        primaryCTA={{ label: "Explore workforce tools", to: "/workforce", variant: "contained" }}
        secondaryCTA={{ label: "See payroll workflows", to: "/payroll", variant: "outlined" }}
      />

      <Box sx={{ px: { xs: 2, md: 6 }, pb: { xs: 8, md: 12 } }}>
        <Stack spacing={4} sx={{ maxWidth: 1100, mx: "auto" }}>
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
              <Typography variant="h6" fontWeight={700}>
                How Schedulaa puts these formulas to work
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Schedulaa connects scheduling, time tracking, approvals, and payroll exports so staffing data stays clean
                throughout the week. Managers can see overtime risk, break compliance, and time approval status before payroll
                runs, and staffing agencies can export structured data for client reporting or payroll reconciliation.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button variant="contained" href="/features">
                  See the platform overview
                </Button>
                <Button variant="outlined" href="/contact">
                  Request a staffing walkthrough
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Box>

      <CTASection
        eyebrow="Ready to put formulas into action?"
        title="Keep staffing, compliance, and payroll in sync from one system."
        description="Schedulaa links schedules, time tracking, approvals, and exports so your staffing plan matches what payroll actually pays."
        primaryLabel="Start free"
        primaryHref="/register"
        secondaryLabel="Talk to sales"
        secondaryHref="/contact"
      />
    </Box>
  );
};

export default StaffingFormulasPage;
