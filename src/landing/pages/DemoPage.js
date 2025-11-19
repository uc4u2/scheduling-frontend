import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Grid,
  Paper,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockIcon from "@mui/icons-material/Lock";
import QrCodeIcon from "@mui/icons-material/QrCode2";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LaunchIcon from "@mui/icons-material/Launch";
import { Link as RouterLink } from "react-router-dom";
import Meta from "../../components/Meta";
import FloatingBlob from "../../components/ui/FloatingBlob";
import JsonLd from "../../components/seo/JsonLd";

// Update these values via environment variables if you rotate demo access.
const DEMO_EMAIL = process.env.REACT_APP_DEMO_EMAIL || "testschedulaa@gmail.com";
const DEMO_PASSWORD = process.env.REACT_APP_DEMO_PASSWORD || "Test!12345";
const DEMO_OTP = process.env.REACT_APP_DEMO_OTP || "0000";
const DEMO_ENV = process.env.REACT_APP_DEMO_ENV || "Staging";
// To swap the video, upload a file to public/assets/videos/manager-demo.mp4 (or host on your CDN)
// and set REACT_APP_DEMO_VIDEO to that URL during build.
const DEMO_VIDEO_SRC = process.env.REACT_APP_DEMO_VIDEO || "https://www.w3schools.com/html/mov_bbb.mp4";

const QUICK_ACTIONS = [
  {
    title: "Review live scheduling",
    body: "Load the Calendar view, create a demo shift, and approve a staff swap request.",
  },
  {
    title: "Verify payroll handoff",
    body: "Export a payroll preview, inspect stat holiday logic, and download a sample W-2/T4 report.",
  },
  {
    title: "Trigger automations",
    body: "Send a win-back campaign, update a landing page, and watch analytics refresh in real time.",
  },
];

const DemoPage = () => {
  const theme = useTheme();
  const loginDetails = useMemo(
    () => [
      { label: "Email", value: DEMO_EMAIL, icon: <MailOutlineIcon fontSize="small" /> },
      { label: "Password", value: DEMO_PASSWORD, icon: <LockIcon fontSize="small" /> },
      { label: "OTP code", value: DEMO_OTP, icon: <QrCodeIcon fontSize="small" /> },
    ],
    []
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Schedulaa Demo Login",
    description: "Step-by-step guide to test drive the Schedulaa manager dashboard with a preconfigured staging account.",
    url: "https://www.schedulaa.com/demo",
  };

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title="Schedulaa Demo Login | Test the Manager Dashboard"
        description="Use the shared manager credentials to explore scheduling, payroll, and automation inside the Schedulaa staging environment."
        canonical="https://www.schedulaa.com/demo"
        og={{
          title: "Schedulaa Demo Login",
          description: "Follow the quick-start guide to try the manager dashboard with live data and automations.",
          image: "https://www.schedulaa.com/og/demo.jpg",
        }}
      />
      <JsonLd data={schema} />

      <FloatingBlob
        enableMotion
        color={alpha(theme.palette.primary.main, 0.6)}
        size={1200}
        opacity={0.12}
        duration={32}
        sx={{ top: -260, left: -240 }}
      />
      <FloatingBlob
        enableMotion
        color={alpha(theme.palette.secondary.main, 0.6)}
        size={960}
        opacity={0.1}
        duration={28}
        sx={{ bottom: -280, right: -180 }}
      />

      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 }, position: "relative", zIndex: 1 }}>
        <Stack spacing={4}>
          <Stack spacing={2} alignItems={{ xs: "flex-start", md: "center" }} textAlign={{ xs: "left", md: "center" }}>
            <Chip
              color="primary"
              label={`Test drive · ${DEMO_ENV}`}
              sx={{ alignSelf: { xs: "flex-start", md: "center" }, textTransform: "uppercase", letterSpacing: 0.6 }}
            />
            <Typography variant="h3" fontWeight={800}>
              Experience the Schedulaa manager dashboard in minutes
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={760}>
              Use the shared staging login to explore scheduling, payroll, compliance, and automation workflows end-to-end. OTP checks are bypassed
              for the demo inbox so you can jump straight into the product.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                color="primary"
                startIcon={<LaunchIcon />}
                sx={{ borderRadius: 999, px: 4 }}
              >
                Go to login
              </Button>
              <Button component={RouterLink} to="/contact" variant="outlined" color="primary" sx={{ borderRadius: 999, px: 4 }}>
                Talk to our rollout team
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.25)}`,
                }}
              >
                <Stack spacing={2}>
                  <Typography variant="h5" fontWeight={700}>
                    Demo credentials
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update these values via <code>REACT_APP_DEMO_*</code> environment variables before building if you rotate the shared login.
                  </Typography>
                  <Divider />
                  <List disablePadding>
                    {loginDetails.map((item) => (
                      <ListItem key={item.label} disableGutters sx={{ py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 40, color: theme.palette.primary.main }}>{item.icon}</ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight={600}>
                              {item.label}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.primary" sx={{ fontFamily: "var(--font-mono, 'Space Mono', monospace)" }}>
                              {item.value}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  border: (t) => `1px solid ${alpha(t.palette.divider, 0.4)}`,
                  height: "100%",
                }}
              >
                <Stack spacing={2}>
                  <Typography variant="h5" fontWeight={700}>
                    3-step quick start
                  </Typography>
                  <List disablePadding>
                    <ListItem sx={{ pb: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircleOutlineIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="1. Login at schedulaa.com/login"
                        secondary="Enter the demo email + password above."
                      />
                    </ListItem>
                    <ListItem sx={{ pb: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircleOutlineIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`2. Use OTP code ${DEMO_OTP}`}
                        secondary="The test inbox is allowlisted in staging so the fixed code signs you in instantly."
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircleOutlineIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="3. Explore manager workflows"
                        secondary="Open Scheduling, Payroll, Websites, and Analytics to see connected data."
                      />
                    </ListItem>
                  </List>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  border: (t) => `1px solid ${alpha(t.palette.divider, 0.4)}`,
                  height: "100%",
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <PlayCircleOutlineIcon color="primary" />
                    <Typography variant="h5" fontWeight={700}>
                      Watch the 4-minute walkthrough
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Replace this video by uploading your final MP4 to <code>public/assets/videos/manager-demo.mp4</code> or by setting{" "}
                    <code>REACT_APP_DEMO_VIDEO</code> during build.
                  </Typography>
                  <Box
                    component="video"
                    src={DEMO_VIDEO_SRC}
                    controls
                    preload="metadata"
                    sx={{
                      width: "100%",
                      borderRadius: 3,
                      border: (t) => `1px solid ${alpha(t.palette.divider, 0.4)}`,
                    }}
                  >
                    Your browser does not support the video tag.
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.2)}`,
                  height: "100%",
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <RocketLaunchIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      Suggested demo flows
                    </Typography>
                  </Stack>
                  {QUICK_ACTIONS.map((action) => (
                    <Box key={action.title} sx={{ py: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.body}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Box>

      <Button
        component={RouterLink}
        to="/login"
        variant="contained"
        color="secondary"
        sx={{
          position: "fixed",
          right: { xs: 16, md: 32 },
          bottom: { xs: 20, md: 32 },
          borderRadius: 999,
          px: 4,
          py: 1.25,
          fontWeight: 700,
          boxShadow: `0 18px 32px ${alpha(theme.palette.secondary.main, 0.35)}`,
          zIndex: 10,
        }}
      >
        Try the demo
      </Button>
    </Box>
  );
};

export default DemoPage;
