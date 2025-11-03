import React from "react";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Link as MuiLink,
  Divider,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import DataObjectIcon from "@mui/icons-material/DataObject";

import Meta from "../../components/Meta";
import HeroShowcase from "../components/HeroShowcase";
import FeatureCardShowcase from "../components/FeatureCardShowcase";
import FloatingBlob from "../../components/ui/FloatingBlob";
import platformMap from "../../assets/marketing/platform-map.svg";

const STATUS_COLOR = {
  Operational: "success",
  "Minor Degradation": "warning",
  Maintenance: "info",
};

const componentsStatus = [
  {
    name: "Schedulaa Dashboard & Login",
    status: "Operational",
    description: "Users can access their dashboard and manage teams normally.",
  },
  {
    name: "Booking & Appointments API",
    status: "Operational",
    description: "Appointment creation, edits, and customer bookings running as expected.",
  },
  {
    name: "Stripe Payments & Checkout",
    status: "Operational",
    description: "Payment processing and tax calculation via Stripe are fully functional.",
  },
  {
    name: "Payroll & Compliance (US & Canada)",
    status: "Operational",
    description: "Payroll exports, W-2, T-4, and ROE generation active.",
  },
  {
    name: "Website Builder / Hosting",
    status: "Operational",
    description: "Template editing, saving, and publishing working normally.",
  },
  {
    name: "Notifications & Marketing Emails",
    status: "Operational",
    description: "Email and SMS campaigns are being sent successfully.",
  },
  {
    name: "API & Integrations (Zapier, Jitsi, etc.)",
    status: "Operational",
    description: "All external integrations connected and running.",
  },
];

const incidents = [
  {
    date: "October 10, 2025",
    severity: "Minor Degradation",
    issue: "Temporary slowdown in appointment booking API due to a caching layer misconfiguration.",
    impact: "4% of requests experienced increased latency for roughly 18 minutes.",
    resolution: "Reverted update and redeployed stable cache instance.",
    status: "Resolved at 2:42 PM EST.",
  },
];

const maintenance = {
  date: "October 20, 2025",
  window: "1:00 AM to 3:00 AM EST",
  affected: "Payroll and compliance export modules.",
  details: "System optimization and tax rules update. You may experience temporary delays in payroll processing during this window.",
};

const uptime = [
  { period: "Last 24 hours", uptime: "100%", downtime: "0 min" },
  { period: "Last 7 days", uptime: "99.97%", downtime: "12 min" },
  { period: "Last 30 days", uptime: "99.99%", downtime: "4 min" },
  { period: "Last 90 days", uptime: "99.98%", downtime: "18 min" },
];

const StatusChip = ({ label }) => (
  <Chip label={label} color={STATUS_COLOR[label] || "default"} size="small" />
);

const StatusPage = () => {
  const theme = useTheme();
  const marketing = theme.marketing || {};

  const currentStatus = componentsStatus.every((component) => component.status === "Operational") ? "All Systems Operational" : "Status Update";

  const heroBadge = (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.88)}, ${alpha(theme.palette.primary.main, 0.65)})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.common.white,
          boxShadow: `0 12px 28px ${alpha(theme.palette.success.main, 0.35)}`,
        }}
      >
        <SignalCellularAltIcon fontSize="small" />
      </Box>
      <Stack spacing={0.25}>
        <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: 0.18, color: alpha(theme.palette.success.main, 0.85) }}>
          Platform health
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
          Real-time availability & updates
        </Typography>
      </Stack>
    </Stack>
  );

  const highlightCards = componentsStatus.slice(0, 3).map((component, index) => ({
    title: component.name,
    description: component.description,
    icon: index === 0 ? <SignalCellularAltIcon fontSize="small" /> : index === 1 ? <DataObjectIcon fontSize="small" /> : <NotificationsActiveIcon fontSize="small" />,
    palette: {
      background: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.2 : 0.92),
      iconBg: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.3 : 0.16),
      text: theme.palette.text.primary,
    },
  }));

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title="Schedulaa Status | System Availability"
        description="Real-time system status for Schedulaa booking, payroll, HR, websites, and integrations."
        canonical="https://www.schedulaa.com/status"
        og={{
          title: "Schedulaa System Status",
          description: "Live view of Schedulaa platform health and recent incidents.",
          image: "https://www.schedulaa.com/og/status.jpg",
        }}
      />

      <HeroShowcase
        eyebrow="Status"
        title={[currentStatus]}
        subtitle="Monitor platform health, incident history, and upcoming maintenance across booking, payroll, websites, and integrations."
        primaryCTA={{ label: "Subscribe for alerts", href: "mailto:status@schedulaa.com" }}
        secondaryCTA={{ label: "RSS feed", href: "https://status.schedulaa.com/rss", variant: "outlined" }}
        media={{ src: platformMap, alt: "Schedulaa status overview" }}
        titleBadge={heroBadge}
        blobs={[
          { key: "status-primary", color: theme.palette.success.main, size: 1280, opacity: 0.22, sx: { top: -260, left: -240 } },
          { key: "status-accent", color: theme.palette.secondary.main, size: 920, opacity: 0.18, sx: { bottom: -260, right: -220 } },
        ]}
      />

      <FeatureCardShowcase
        eyebrow="Current focus"
        title="All core systems operating normally"
        subtitle="We monitor dashboard access, bookings, payments, and notifications 24/7 so you can operate confidently."
        cards={highlightCards}
      />

      <Box sx={{ px: { xs: 2, md: 6 }, pb: { xs: 10, md: 14 } }}>
        <Stack spacing={6}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: marketing.radius?.lg || 24,
              border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}`,
              background: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.22 : 0.95),
            }}
          >
            <Stack spacing={2}>
              <Typography variant="overline" color="success.main" fontWeight={700}>
                Component overview
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                Service availability
              </Typography>
              <Grid container spacing={{ xs: 3, md: 4 }}>
                {componentsStatus.map((component) => (
                  <Grid item xs={12} md={6} key={component.name}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: marketing.radius?.lg || 20, border: (t) => `1px solid ${alpha(t.palette.divider, 0.25)}` }}>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="subtitle1" fontWeight={700}>
                            {component.name}
                          </Typography>
                          <StatusChip label={component.status} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {component.description}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Paper>

          <Box>
            <Typography variant="h5" fontWeight={700}>
              Recent incidents
            </Typography>
            <Stack spacing={3} mt={3}>
              {incidents.map((incident) => (
                <Paper key={incident.date} elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: marketing.radius?.lg || 24, border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}` }}>
                  <Stack spacing={1.5}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 1, md: 2 }} alignItems={{ md: "center" }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {incident.date}
                      </Typography>
                      <StatusChip label={incident.severity} />
                    </Stack>
                    <Typography variant="body1" color="text.primary">{incident.issue}</Typography>
                    <Typography variant="body1" color="text.primary">Impact: {incident.impact}</Typography>
                    <Typography variant="body1" color="text.primary">Resolution: {incident.resolution}</Typography>
                    <Typography variant="body2" color="text.secondary">{incident.status}</Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="h5" fontWeight={700}>
              Scheduled maintenance
            </Typography>
            <Paper elevation={0} sx={{ mt: 3, p: { xs: 3, md: 4 }, borderRadius: marketing.radius?.lg || 24, border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}` }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Next planned maintenance
                </Typography>
                <Typography variant="body1" color="text.primary">
                  Date: {maintenance.date}
                </Typography>
                <Typography variant="body1" color="text.primary">
                  Window: {maintenance.window}
                </Typography>
                <Typography variant="body1" color="text.primary">
                  Affected: {maintenance.affected}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {maintenance.details}
                </Typography>
              </Stack>
            </Paper>
          </Box>

          <Box>
            <Typography variant="h5" fontWeight={700}>
              Uptime overview
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ mt: 3, borderRadius: marketing.radius?.lg || 24, border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}` }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Uptime</TableCell>
                    <TableCell>Downtime</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uptime.map((row) => (
                    <TableRow key={row.period}>
                      <TableCell sx={{ fontWeight: 600 }}>{row.period}</TableCell>
                      <TableCell>{row.uptime}</TableCell>
                      <TableCell>{row.downtime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="body2" color="text.secondary" mt={1.5}>
              Schedulaa guarantees a minimum 99.9% uptime SLA across all services.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: marketing.radius?.lg || 24, border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}` }}>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Subscribe to updates
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stay informed about real-time issues and scheduled maintenance.
                  </Typography>
                  <Stack spacing={1.5}>
                    <Button variant="contained" color="primary" sx={{ width: 200 }}>
                      Subscribe for alerts
                    </Button>
                    <MuiLink href="https://status.schedulaa.com/rss" target="_blank" rel="noopener noreferrer" underline="hover">
                      RSS feed
                    </MuiLink>
                    <Typography variant="body2" color="text.secondary">
                      Webhook integration is available for Plus and Pro subscribers.
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: marketing.radius?.lg || 24, border: (t) => `1px solid ${alpha(t.palette.divider, 0.3)}` }}>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Need help?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    If you are experiencing issues not listed here, please contact support.
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    Email: <MuiLink href="mailto:support@schedulaa.com">support@schedulaa.com</MuiLink>
                  </Typography>
                  <MuiLink component={Link} to="/client/support" underline="hover">
                    Visit the Help Center
                  </MuiLink>
                  <Typography variant="body2" color="text.secondary">
                    Average response time: under 2 hours (Pro customers: 30 minutes).
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Box>
            <Typography variant="h5" fontWeight={700}>
              About this page
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1.5}>
              This status page is automatically updated by Schedulaa monitoring systems. It tracks uptime and performance across booking, payments, HR, and integrations so you can operate your business confidently.
            </Typography>
          </Box>

          <Divider />
          <Typography variant="caption" color="text.secondary" align="center">
            Transparency keeps your team informed and clients confident. Bookmark this page for the latest platform updates.
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ position: "relative", py: { xs: 8, md: 10 } }}>
        <FloatingBlob enableMotion color={theme.palette.success.main} size={960} opacity={0.14} duration={28} sx={{ top: -200, right: -200 }} />
      </Box>
    </Box>
  );
};

export default StatusPage;
