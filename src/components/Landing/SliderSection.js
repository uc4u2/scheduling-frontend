import React from "react";
import { Box, Typography, Card, CardContent, Grid } from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PaidIcon from "@mui/icons-material/Paid";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { motion } from "framer-motion";
import Bubble from "../ui/Bubble";

const slides = [
  {
    title: "Zero Payroll Headaches",
    description: "Gross, net, and YTD payroll—calculated instantly and ready for export. No spreadsheets, no mistakes.",
    icon: PaidIcon,
  },
  {
    title: "Effortless Shift Management",
    description: "Assign, swap, and track shifts with one drag & drop. Staff always know where and when to work.",
    icon: EventAvailableIcon,
  },
  {
    title: "Government-Ready Compliance",
    description: "Generate ROE, T4, W-2, and statutory holiday reports in seconds. Stay audit-ready without extra work.",
    icon: ReceiptLongIcon,
  },
  {
    title: "Faster Employee Onboarding",
    description: "Send e-sign docs, onboard in minutes, and add team members to the right department automatically.",
    icon: GroupAddIcon,
  },
  {
    title: "All Your HR in One Dashboard",
    description: "One login for everything—scheduling, payroll, HR. Perfect for busy managers and growing teams.",
    icon: AssignmentTurnedInIcon,
  },
];

const SliderSection = () => (
  <Box
    id="why"
    sx={(theme) => ({
      py: 12,
      background: theme.palette.mode === "dark"
        ? theme.palette.background.default
        : "linear-gradient(to right, #f0f4ff, #ffffff)",
      borderTop: `2px solid ${theme.palette.divider}`,
    })}
  >
    <Box sx={{ maxWidth: "1200px", mx: "auto", px: 3 }}>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={(theme) => ({
          fontWeight: 700,
          color: theme.palette.primary.main,
          mb: 2,
        })}
      >
        Why Teams Love Schedulaa
      </Typography>
      <Typography
        align="center"
        sx={(theme) => ({
          mb: 6,
          color: theme.palette.text.secondary,
          fontSize: "1.1rem",
        })}
      >
        Built for SMBs who want to save time, cut payroll errors, and grow with confidence.
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {slides.map((slide, idx) => {
          const Icon = slide.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                style={{ position: "relative" }}
              >
                <Card
                  sx={(theme) => ({
                    height: "100%",
                    borderRadius: 5,
                    p: 3,
                    textAlign: "center",
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.shadows[4],
                    overflow: "hidden",
                    position: "relative",
                  })}
                >
                  {/* Bubbles */}
                  <Bubble
                    color="#1976d2"
                    size={80}
                    duration={8}
                    opacity={0.1}
                    sx={{ top: 10, right: 10 }}
                  />
                  <Bubble
                    color="#1976d2"
                    size={60}
                    duration={10}
                    opacity={0.1}
                    sx={{ bottom: 10, left: 20 }}
                  />

                  <Box sx={{ mb: 2, position: "relative", zIndex: 1 }}>
                    <Icon sx={{ fontSize: 40, color: (theme) => theme.palette.primary.main }} />
                  </Box>

                  <CardContent sx={{ position: "relative", zIndex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={(theme) => ({
                        fontWeight: 600,
                        mb: 1,
                        color: theme.palette.text.primary,
                      })}
                    >
                      {slide.title}
                    </Typography>
                    <Typography
                      sx={(theme) => ({
                        color: theme.palette.text.secondary,
                      })}
                    >
                      {slide.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  </Box>
);

export default SliderSection;
