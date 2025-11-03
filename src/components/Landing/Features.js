import React from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PaidIcon from "@mui/icons-material/Paid";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { motion } from "framer-motion";
import FloatingBlob from "../ui/FloatingBlob";

const features = [
  {
    icon: <CalendarTodayIcon sx={{ fontSize: 50, color: "primary.main" }} />,
    title: "Smart Shift Scheduling",
    text: (
      <>
        Assign and track shifts with drag-and-drop. <span style={{ color: "#1976d2", fontWeight: 500 }}>Real-time updates</span> keep your team in sync.
      </>
    ),
    blobs: [
      { color: "#1976d2", size: 150, top: -20, left: -20, duration: 10, opacity: 0.25 },
      { color: "#64b5f6", size: 100, bottom: -30, right: -15, duration: 12, opacity: 0.15 },
    ],
  },
  {
    icon: <PaidIcon sx={{ fontSize: 50, color: "primary.main" }} />,
    title: "Automated Payroll",
    text: (
      <>
        Run payroll for hourly and salaried staff. <span style={{ color: "#00bfa5", fontWeight: 500 }}>Gross, net, YTD</span>—all calculated instantly.
      </>
    ),
    blobs: [
      { color: "#00bfa5", size: 160, top: -30, right: -20, duration: 9, opacity: 0.25 },
      { color: "#80cbc4", size: 90, bottom: -20, left: -15, duration: 11, opacity: 0.12 },
    ],
  },
  {
    icon: <ReceiptLongIcon sx={{ fontSize: 50, color: "primary.main" }} />,
    title: "ROE, T4 & W-2 Exports",
    text: (
      <>
        <span style={{ color: "#ff4081", fontWeight: 500 }}>One click</span> to generate government forms for Canada & US (ROE, T4, W-2).
      </>
    ),
    blobs: [
      { color: "#ff4081", size: 170, top: -40, left: -30, duration: 10, opacity: 0.3 },
      { color: "#f48fb1", size: 80, bottom: -10, right: -10, duration: 13, opacity: 0.18 },
    ],
  },
  {
    icon: <GroupAddIcon sx={{ fontSize: 50, color: "primary.main" }} />,
    title: "Employee Onboarding",
    text: (
      <>
        Send e-sign docs, assign departments, and onboard <span style={{ color: "#1976d2", fontWeight: 500 }}>in minutes</span>.
      </>
    ),
    blobs: [
      { color: "#1976d2", size: 130, top: -25, left: -20, duration: 12, opacity: 0.21 },
      { color: "#00bfa5", size: 80, bottom: -15, right: -8, duration: 10, opacity: 0.14 },
    ],
  },
  {
    icon: <VerifiedUserIcon sx={{ fontSize: 50, color: "primary.main" }} />,
    title: "Direct Deposit & Compliance",
    text: (
      <>
        Export payroll for <span style={{ color: "#00bfa5", fontWeight: 500 }}>direct deposit</span> and stay compliant with every pay run.
      </>
    ),
    blobs: [
      { color: "#00bfa5", size: 120, top: -18, right: -20, duration: 13, opacity: 0.19 },
      { color: "#f48fb1", size: 100, bottom: -18, left: -20, duration: 9, opacity: 0.12 },
    ],
  },
  {
    icon: <AccessTimeIcon sx={{ fontSize: 50, color: "primary.main" }} />,
    title: "All-in-One Dashboard",
    text: (
      <>
        One modern dashboard for <span style={{ color: "#1976d2", fontWeight: 500 }}>managers, recruiters, and business owners</span>.
      </>
    ),
    blobs: [
      { color: "#1976d2", size: 100, top: -20, left: -15, duration: 14, opacity: 0.22 },
      { color: "#64b5f6", size: 80, bottom: -18, right: -12, duration: 13, opacity: 0.14 },
    ],
  },
];

const Features = () => (
  <Box
    id="features"
    sx={{
      py: 10,
      backgroundColor: (theme) => theme.palette.background.default,
    }}
  >
    <Box sx={{ maxWidth: "1200px", mx: "auto", px: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{
            fontWeight: 600,
            mb: 1,
            color: (theme) => theme.palette.text.primary,
          }}
        >
          Everything You Need, All in One Place
        </Typography>
        <Typography
          align="center"
          sx={{
            color: (theme) => theme.palette.text.secondary,
            mb: 6,
          }}
        >
          Shift management, payroll, onboarding, compliance, and more—for modern teams and growing businesses.
        </Typography>
      </motion.div>

      <Grid container spacing={4}>
        {features.map((item, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <motion.div
              whileHover={{ scale: 1.04 }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 4,
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  backgroundColor: (theme) => theme.palette.background.paper,
                }}
              >
                {/* Animated Blobs */}
                {item.blobs.map((blob, bIdx) => (
                  <FloatingBlob
                    key={bIdx}
                    color={blob.color}
                    size={blob.size}
                    duration={blob.duration}
                    opacity={blob.opacity}
                    sx={{
                      position: "absolute",
                      ...(blob.top !== undefined && { top: blob.top }),
                      ...(blob.bottom !== undefined && { bottom: blob.bottom }),
                      ...(blob.left !== undefined && { left: blob.left }),
                      ...(blob.right !== undefined && { right: blob.right }),
                    }}
                  />
                ))}

                <Box sx={{ mb: 2, position: "relative", zIndex: 1 }}>
                  {item.icon}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: (theme) => theme.palette.text.primary,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: (theme) => theme.palette.text.secondary,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {item.text}
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  </Box>
);

export default Features;
