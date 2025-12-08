import React from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import TimelineIcon from "@mui/icons-material/Timeline";
import ShieldIcon from "@mui/icons-material/Shield";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import StorageIcon from "@mui/icons-material/Storage";
import LinkIcon from "@mui/icons-material/Link";
import { Link as RouterLink } from "react-router-dom";
import Meta from "../../components/Meta";
import JsonLd from "../../components/seo/JsonLd";

const triggerGroups = [
  {
    title: "Booking events",
    emoji: "📅",
    items: [
      "booking.created",
      "booking.updated",
      "booking.cancelled",
      "booking.no_show",
      "public_booking.created",
    ],
    body:
      'Send new bookings, reschedules, cancellations, no-shows, and public "Book With Me" links straight into Slack, Sheets, CRMs, or calendars.',
  },
  {
    title: "Scheduling & shifts",
    emoji: "👥",
    items: ["shift.published", "shift.updated", "swap.requested", "swap.approved", "swap.rejected"],
    body: "Publish/adjust shifts and swaps once, then let Zapier notify staff, update calendars, or push tasks to project tools.",
  },
  {
    title: "Timeclock & break compliance",
    emoji: "⏱",
    items: ["timeclock.clock_in", "timeclock.clock_out", "break.started", "break.ended", "break.missed", "break.enforced", "break.compliant"],
    body: "Every punch and break flows out with anomaly hints so you can alert managers, log compliance, or feed hours into reporting.",
  },
  {
    title: "Leave, onboarding, documents",
    emoji: "🌿",
    items: ["leave.requested", "leave.approved", "leave.denied", "leave.status_changed", "onboarding.started", "onboarding.document_signed"],
    body: "Keep HR systems, task boards, and email cadences aligned when time off is requested or onboarding paperwork is signed.",
  },
  {
    title: "Payroll (including raw detail)",
    emoji: "💰",
    items: ["payroll.ready", "payroll.finalized", "payroll.details"],
    body:
      "Notify finance when payroll is ready/finalized and send full payroll rows (regular/OT hours, gross, net, taxes, deductions) to Sheets, BI, or accounting.",
  },
];

const actions = [
  {
    title: "create_booking",
    desc: "Create Schedulaa bookings from any form, CRM, chatbot, or lead ad.",
  },
  {
    title: "create_employee",
    desc: "Add new staff from HR/recruiting tools with role, department, branch, and timezone.",
  },
  {
    title: "create_shift / update_shift",
    desc: "Generate or adjust shifts automatically from forecasting or HR workflows.",
  },
  {
    title: "attach_document",
    desc: "Send signed PDFs from SignWell/DocuSign/etc. directly into employee profiles.",
  },
];

const automations = [
  {
    icon: <NotificationsActiveIcon color="primary" />,
    title: "Instant break + shift alerts",
    bullets: [
      "Send break.missed and break.enforced events to Slack/Teams for compliance follow-up.",
      "Push shift.published/shift.updated to calendars so coverage stays accurate.",
    ],
  },
  {
    icon: <StorageIcon color="primary" />,
    title: "Build your own payroll lake",
    bullets: [
      "Use payroll.details to stream per-employee rows (hours, taxes, net) into Sheets, PowerBI, or QuickBooks Desktop bridges.",
      "Keep an external audit trail without manual exports.",
    ],
  },
  {
    icon: <SyncAltIcon color="primary" />,
    title: "HR + onboarding sync",
    bullets: [
      "onboarding.started triggers e-sign templates; onboarding.document_signed reattaches PDFs in Schedulaa automatically.",
      "leave.approved/denied/status_changed keep HRIS balances current.",
    ],
  },
  {
    icon: <IntegrationInstructionsIcon color="primary" />,
    title: "Lead-to-booking automation",
    bullets: [
      "Create bookings from HubSpot/Pipedrive stages or Typeform leads using create_booking.",
      "Pipe booking.created / public_booking.created to CRMs or marketing lists.",
    ],
  },
];

const ZapierPage = () => {
  const title = "Zapier for Schedulaa — automate bookings, scheduling, break compliance, and payroll";
  const description =
    "Connect Schedulaa to 6,000+ apps with Zapier. Stream bookings, shifts, timeclock, break compliance, PTO, onboarding, and payroll data into Slack, Sheets, CRMs, or BI—and create bookings, employees, and shifts from any workflow.";

  return (
    <>
      <Meta title={title} description={description} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          description,
          url: "https://www.schedulaa.com/zapier",
        }}
      />

      <Box
        sx={(theme) => ({
          background:
            theme.palette.mode === "light"
              ? "linear-gradient(135deg, #fff8f3 0%, #f2f5ff 50%, #fdf2ff 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.08) 100%)",
          pt: { xs: 6, md: 10 },
          pb: { xs: 6, md: 10 },
        })}
      >
        <Container maxWidth="lg">
          <Stack spacing={3}>
            <Chip
              label="New: Zapier for Schedulaa"
              color="primary"
              variant="outlined"
              sx={{ alignSelf: "flex-start", fontWeight: 600 }}
            />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, maxWidth: 860 }}>
              Automate every booking, shift, break, and payroll moment with Zapier
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 860 }}>
              Schedulaa now streams bookings, scheduling, timeclock, break compliance, PTO, onboarding, and full payroll
              detail into Zapier—while Zapier can create bookings, employees, and shifts inside Schedulaa. Connect to
              6,000+ apps without custom builds.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/settings/zapier"
                startIcon={<RocketLaunchIcon />}
              >
                Open Zapier settings
              </Button>
              <Button variant="outlined" component={RouterLink} to="/demo" startIcon={<AutoAwesomeIcon />}>
                See a live demo
              </Button>
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Stack spacing={1} direction="row" alignItems="center">
                <CloudDoneIcon color="primary" />
                <Typography variant="body2" color="text.secondary">
                  6,000+ apps: Slack, Teams, Sheets, HubSpot, QuickBooks, Xero, SignWell, DocuSign, PowerBI, and more.
                </Typography>
              </Stack>
              <Stack spacing={1} direction="row" alignItems="center">
                <ShieldIcon color="primary" />
                <Typography variant="body2" color="text.secondary">
                  API keys, optional HMAC secrets, and non-blocking event delivery.
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: (t) => t.palette.background.default }}>
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              What's live right now
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 900 }}>
              These triggers and actions are already available in your Schedulaa Zapier panel. They mirror the live data
              powering bookings, shift operations, break compliance, PTO, onboarding, and payroll.
            </Typography>
          </Stack>
          <Grid container spacing={3}>
            {triggerGroups.map((group) => (
              <Grid item xs={12} md={6} key={group.title}>
                <Paper
                  variant="outlined"
                  sx={{
                    height: "100%",
                    p: 3,
                    borderRadius: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label="Trigger" size="small" color="primary" variant="outlined" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {group.emoji} {group.title}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {group.body}
                  </Typography>
                  <List dense>
                    {group.items.map((item) => (
                      <ListItem key={item} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>
                          <LinkIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="body2">{item}</Typography>}
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {group.title.includes("Payroll") && item === "payroll.details"
                                ? "Full per-employee payroll rows (hours, gross, net, taxes, deductions)."
                                : undefined}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            ))}
            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 3,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label="Actions" size="small" color="primary" variant="outlined" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Zapier → Schedulaa (live actions)
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Let Zapier create or update core records in Schedulaa. Map your HR, CRM, or form data into these calls
                  using your Zapier API key.
                </Typography>
                <List dense>
                  {actions.map((action) => (
                    <ListItem key={action.title} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>
                        <AutoAwesomeIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2">{action.title}</Typography>}
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {action.desc}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: (t) => t.palette.background.paper }}>
        <Container maxWidth="lg">
          <Stack spacing={2} sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Enterprise-grade automations you can ship today
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 900 }}>
              Connect to Slack/Teams, Google Calendar, Sheets, HubSpot, SignWell/DocuSign, QuickBooks/Xero, PowerBI, and
              more—without custom code.
            </Typography>
          </Stack>
          <Grid container spacing={3}>
            {automations.map((item) => (
              <Grid item xs={12} md={6} key={item.title}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {item.icon}
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {item.title}
                    </Typography>
                  </Stack>
                  <List dense>
                    {item.bullets.map((bullet) => (
                      <ListItem key={bullet} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>
                          <EventAvailableIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="body2">{bullet}</Typography>}
                          secondary={null}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: (t) => t.palette.background.default }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Quick start: from trigger to automation
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Connect a Zapier Catch Hook, pick a Schedulaa event, and add your downstream app. The whole loop takes
                  minutes.
                </Typography>
                <List dense>
                  {[
                    "In Zapier: create a Zap → Webhooks by Zapier → Catch Hook. Copy the URL.",
                    "In Schedulaa: Settings → Zapier → Event hooks. Paste the URL and choose the event.",
                    "Trigger the event once (e.g., create a booking, publish a shift, finalize payroll).",
                    "In Zapier: add actions—Slack/Teams messages, Sheets rows, CRM updates, e-sign sends, or your own API.",
                  ].map((step) => (
                    <ListItem key={step} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>
                        <TimelineIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2">{step}</Typography>} />
                    </ListItem>
                  ))}
                </List>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button variant="contained" color="primary" component={RouterLink} to="/settings/zapier">
                    Add a Zapier hook
                  </Button>
                  <Button variant="text" component={RouterLink} to="/contact">
                    Talk to our team
                  </Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: (t) =>
                    t.palette.mode === "light"
                      ? "linear-gradient(140deg, #fff, #f8fbff)"
                      : "rgba(255,255,255,0.03)",
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LinkIcon color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Popular combos
                    </Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    • booking.created → Slack + Google Calendar + HubSpot contact update
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • break.missed → Slack compliance channel + Sheets log
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • shift.published → Google Calendar + Trello task
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • onboarding.started → SignWell send + attach_document on completion
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • payroll.details → Loop rows to Sheets / PowerBI / accounting bridge
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box
        sx={(theme) => ({
          py: { xs: 6, md: 10 },
          background:
            theme.palette.mode === "light"
              ? "linear-gradient(135deg, #0b1021 0%, #151d33 100%)"
              : "linear-gradient(135deg, #0b1021 0%, #0b0f1f 100%)",
        })}
      >
        <Container maxWidth="lg">
          <Stack spacing={2} alignItems="center" textAlign="center" color="common.white">
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Turn Schedulaa into your automation engine
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 840 }}>
              Keep operations, compliance, and payroll aligned—then let Zapier push every update to the tools your team
              already lives in.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/settings/zapier"
                sx={{ color: "common.white" }}
              >
                Configure Zapier
              </Button>
              <Button variant="outlined" component={RouterLink} to="/demo" sx={{ color: "common.white", borderColor: "rgba(255,255,255,0.4)" }}>
                Request a walkthrough
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default ZapierPage;
