// src/pages/client/ClientSupport.js
import React from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import PaymentsIcon from "@mui/icons-material/Payments";
import LanguageIcon from "@mui/icons-material/Language";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import { Link } from "react-router-dom";

const quickActions = [
  {
    title: "Manage Bookings",
    description: "Adjust or cancel upcoming appointments and review confirmation emails.",
    to: "/client/bookings",
    icon: <BookOnlineIcon fontSize="small" />,
  },
  {
    title: "Update Payment Methods",
    description: "Refresh saved cards, view invoices, or manage autopay settings.",
    to: "/client/payments",
    icon: <PaymentsIcon fontSize="small" />,
  },
  {
    title: "Edit Website Content",
    description: "Update business details, services, and landing pages in minutes.",
    to: "/manager/website/templates",
    icon: <LanguageIcon fontSize="small" />,
  },
  {
    title: "Review Reports",
    description: "Track revenue, payroll exports, and team performance dashboards.",
    to: "/dashboard",
    icon: <AssessmentIcon fontSize="small" />,
  },
];

const knowledgeCategories = [
  {
    title: "Scheduling and Booking",
    articles: [
      "Create services, add-ons, and customer booking rules",
      "Publish availability templates and shift rotations",
      "Handle cancellations, reschedules, and waitlists",
    ],
    docsLink: "/docs#user-guides",
  },
  {
    title: "Payroll and Compliance",
    articles: [
      "Configure pay rates, overtime, and holiday pay",
      "Approve timesheets and export payroll records",
      "Generate W-2, T4, and ROE files for accountants",
    ],
    docsLink: "/docs#user-guides",
  },
  {
    title: "Website and Branding",
    articles: [
      "Customize themes, navigation, and page layouts",
      "Connect an existing domain (purchase flow coming soon)",
      "Optimize SEO settings and social previews",
    ],
    docsLink: "/docs#user-guides",
  },
  {
    title: "Integrations and Automations",
    articles: [
      "Enable Stripe webhooks for payouts and refunds",
      "Configure Jitsi interviews and Mailchimp marketing",
      "Set up outbound webhooks; Zapier templates are planned",
    ],
    docsLink: "/docs#integrations",
  },
];

const faqItems = [
  {
    question: "How do I transition a booking to payroll?",
    answer: "Approve the timesheet entry, then generate a payroll batch under Payroll > Exports. All associated bookings, tips, and taxes are summarised there.",
  },
  {
    question: "Why is my custom domain not live?",
    answer: "Confirm DNS records point to Schedulaa and that the domain is connected under Website Builder > Domains. In-app domain purchasing is coming soon - for now use your registrar.",
  },
  {
    question: "How can I resend customer notifications?",
    answer: "Open the booking record and choose Resend Confirmation or SMS Reminder. Messages respect your notification template settings.",
  },
  {
    question: "Which reports show payouts and taxes?",
    answer: "Navigate to Analytics > Financials for payout summaries, and Payroll > Exports for tax-ready CSVs including Stripe fees and adjustments.",
  },
];

const resourceLinks = [
  { label: "Schedulaa Documentation", to: "/docs" },
  { label: "System Status", to: "/status" },
  { label: "Pricing and Plans", to: "/pricing" },
  { label: "Contact Sales", to: "/contact" },
];

const ClientSupport = () => (
  <Box sx={{ minHeight: "100vh", backgroundColor: (theme) => theme.palette.background.default }}>
    <Box component="section" sx={{ px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 } }}>
      <Stack spacing={8}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.92))"
                : "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(236,252,255,0.94))",
          }}
        >
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Chip label="Help Center" color="primary" icon={<HelpOutlineIcon />} />
              <Typography variant="h4" component="h1" fontWeight={800}>
                How can we help you today?
              </Typography>
            </Stack>
            <Typography variant="subtitle1" color="text.secondary">
              Search guides, review best practices, or jump into the area you manage most.
            </Typography>
            <TextField
              fullWidth
              placeholder="Search the help center"
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
            />
            <Typography variant="body2" color="text.secondary">
              Tip: Managers have access to the full knowledge base at <MuiLink component={Link} to="/docs">schedulaa.com/docs</MuiLink>.
            </Typography>
          </Stack>
        </Paper>

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((item) => (
              <Grid item xs={12} md={6} key={item.title}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: (theme) => `1px solid ${theme.palette.divider}`, height: "100%" }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip icon={item.icon} label={item.title} color="secondary" size="small" sx={{ fontWeight: 600 }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                    <Button component={Link} to={item.to} variant="outlined" size="small" sx={{ alignSelf: "flex-start" }}>
                      Go there
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Knowledge Base Categories
          </Typography>
          <Grid container spacing={3}>
            {knowledgeCategories.map((category) => (
              <Grid item xs={12} md={6} key={category.title}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {category.title}
                  </Typography>
                  <List dense>
                    {category.articles.map((article) => (
                      <ListItem key={article} sx={{ pl: 0 }}>
                        <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={article} />
                      </ListItem>
                    ))}
                  </List>
                  <Button component={Link} to={category.docsLink} size="small" variant="text">
                    Read in documentation
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            FAQs
          </Typography>
          <Stack spacing={2.5}>
            {faqItems.map((faq) => (
              <Paper key={faq.question} elevation={0} sx={{ p: 3, borderRadius: 4, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  {faq.question}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Additional Resources
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SupportAgentIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Contact the Schedulaa team
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Need tailored assistance or want to escalate an issue? Reach our specialists.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button component={Link} to="/contact" variant="contained" color="primary">
                      Contact us
                    </Button>
                    <Button component="a" href="mailto:support@schedulaa.com" variant="outlined" color="primary">
                      Email support@schedulaa.com
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Key links
                  </Typography>
                  <List dense>
                    {resourceLinks.map((link) => (
                      <ListItem key={link.label} sx={{ pl: 0 }}>
                        <MuiLink component={Link} to={link.to} underline="hover">
                          {link.label}
                        </MuiLink>
                      </ListItem>
                    ))}
                  </List>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    Average response time: within 2 hours. Priority support for Pro plans responds in 30 minutes or less.
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Box>
  </Box>
);

export default ClientSupport;
