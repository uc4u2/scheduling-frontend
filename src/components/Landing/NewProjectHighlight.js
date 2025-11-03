import React from "react";
import { Box, Typography, Paper, Chip, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import Slider from "react-slick";
import Bubble from "../ui/Bubble";

// Updated feature chips!
const features = [
  "Shift Scheduling",
  "Automated Payroll",
  "Direct Deposit",
  "Employee Onboarding",
  "ROE/T4/W-2 Generation",
  "Team Management",
  "Department & Role Tracking",
  "Interview Booking",
  "Calendar Sync",
  "Smart Availability",
  "Instant Notifications",
  "HR Automation",
  "Compliance & Exports",
  "Mobile Ready",
  "Time Off Requests",
  "Performance Tracking",
  "Marketplace/Booking Links",
  "Stripe Billing Integration",
  "Healthcare Scheduling",
  "Multi-location Support",
];

const colors = [
  "#1976d2",
  "#d32f2f",
  "#388e3c",
  "#f57c00",
  "#7b1fa2",
  "#0288d1",
  "#c2185b",
  "#00796b",
];

const sliderSettings = {
  dots: false,
  infinite: true,
  speed: 2000,
  autoplay: true,
  autoplaySpeed: 0,
  cssEase: "linear",
  slidesToShow: 5,
  slidesToScroll: 1,
  arrows: false,
  pauseOnHover: false,
  responsive: [
    {
      breakpoint: 960,
      settings: { slidesToShow: 3 },
    },
    {
      breakpoint: 600,
      settings: { slidesToShow: 2 },
    },
  ],
};

const NewProjectHighlight = () => {
  const theme = useTheme();

  return (
    <Box
      id="highlight"
      sx={{
        py: 12,
        px: 2,
        background: theme.palette.background.default,
        position: "relative",
      }}
    >
      <Bubble size={100} opacity={0.05} duration={18} sx={{ top: 20, left: 40 }} />
      <Bubble size={80} opacity={0.08} duration={12} sx={{ bottom: 30, right: 50 }} />

      <Paper
        elevation={6}
        sx={{
          borderRadius: 6,
          p: { xs: 3, md: 6 },
          mx: "auto",
          maxWidth: 1000,
          textAlign: "center",
          background: theme.palette.background.paper,
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Schedulaa: The All-in-One Platform for Modern Teams
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", mb: 4, maxWidth: 700, mx: "auto" }}
          >
            From shift scheduling to payroll, onboarding, and HR—Schedulaa automates it all so you can focus on growth, not admin.
          </Typography>

          <Box sx={{ overflow: "hidden", width: "100%" }}>
            <Slider {...sliderSettings}>
              {features.map((feature, index) => (
                <Box key={index} px={1}>
                  <Chip
                    label={feature}
                    sx={{
                      fontSize: "0.89rem",
                      fontWeight: 600,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      backgroundColor: colors[index % colors.length],
                      color: "#fff",
                    }}
                  />
                </Box>
              ))}
            </Slider>
          </Box>
        </motion.div>
      </Paper>
    </Box>
  );
};

export default NewProjectHighlight;
