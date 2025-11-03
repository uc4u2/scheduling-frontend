import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Dialog,
  IconButton,
  Fade,
  Stack,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PaidIcon from "@mui/icons-material/Paid";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Slider from "react-slick";
import { motion } from "framer-motion";

import calendarImg from "../../assets/calendar-demo.png";
import payrollImg from "../../assets/payroll-demo.png";
import onboardingImg from "../../assets/onboarding-demo.png";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const screenshots = [
  {
    src: calendarImg,
    alt: "Visual calendar UI",
    caption: "Live scheduling canvas with drag & drop appointments",
  },
  {
    src: payrollImg,
    alt: "Payroll dashboard",
    caption: "Compliance-ready payroll with instant remittance prep",
  },
  {
    src: onboardingImg,
    alt: "Employee onboarding",
    caption: "Self-serve onboarding with approvals, docs, and tasks",
  },
];

const featureSlides = [
  {
    icon: <CalendarMonthIcon sx={{ fontSize: 40 }} color="primary" />,
    title: "Live calendar view",
  },
  {
    icon: <AccessTimeIcon sx={{ fontSize: 40 }} color="primary" />,
    title: "Timezone intelligence",
  },
  {
    icon: <EventAvailableIcon sx={{ fontSize: 40 }} color="primary" />,
    title: "Drag & drop scheduling",
  },
  {
    icon: <PaidIcon sx={{ fontSize: 40 }} color="primary" />,
    title: "Automated payroll sync",
  },
  {
    icon: <GroupAddIcon sx={{ fontSize: 40 }} color="primary" />,
    title: "Role-aware onboarding",
  },
];

const imageSliderSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  autoplay: true,
  autoplaySpeed: 4000,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: true,
  responsive: [
    {
      breakpoint: 900,
      settings: { arrows: false },
    },
  ],
};

const featureSliderSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  autoplay: true,
  autoplaySpeed: 4000,
  slidesToShow: 2,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 900,
      settings: {
        slidesToShow: 1,
      },
    },
  ],
};

const calendarStats = [
  { label: "Shifts scheduled monthly", value: "48K+" },
  { label: "Auto-approved availability", value: "92%" },
  { label: "Payroll accuracy", value: "99.8%" },
];

const calendarAssurances = [
  "Broadcast open shifts to every location in one click.",
  "Availability conflicts resolve automatically as staff update their calendars.",
  "Hourly, tip, and overtime data sync straight into payroll runs.",
];

const calendarBadges = ["Multi-location", "Role aware", "Real-time sync"];

const CalendarShowcase = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const closeBtnRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (!open) return;
      if (e.key === "ArrowRight") {
        setSelectedIdx((idx) => (idx + 1) % screenshots.length);
      } else if (e.key === "ArrowLeft") {
        setSelectedIdx((idx) => (idx - 1 + screenshots.length) % screenshots.length);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [open]
  );

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  const handleOpen = (idx) => {
    setSelectedIdx(idx);
    setOpen(true);
    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 180);
  };

  const handleClose = () => setOpen(false);
  const goNext = () => setSelectedIdx((idx) => (idx + 1) % screenshots.length);
  const goPrev = () => setSelectedIdx((idx) => (idx - 1 + screenshots.length) % screenshots.length);

  return (
    <Box
      id="calendar"
      sx={{
        py: { xs: 10, md: 14 },
        background: (t) =>
          t.palette.mode === "dark"
            ? "linear-gradient(135deg, #0f172a, #111c34)"
            : "linear-gradient(130deg, #f7fbff 0%, #ffffff 40%, #f0f5ff 100%)",
        borderTop: (t) => `2px solid ${t.palette.mode === "dark" ? alpha(t.palette.primary.dark, 0.4) : alpha(t.palette.primary.light, 0.35)}`,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
            >
              <Box sx={{ position: "relative" }}>
                <Box
                  sx={{
                    position: "absolute",
                    inset: { xs: "-18% -28% 26% -18%", md: "-22% -34% 20% -14%" },
                    borderRadius: "48% / 38%",
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.22)}, ${alpha(theme.palette.secondary.main, 0.18)})`,
                    filter: "blur(38px)",
                    opacity: theme.palette.mode === "dark" ? 0.42 : 0.55,
                  }}
                />

                <Paper
                  elevation={0}
                  sx={{
                    position: "relative",
                    borderRadius: 5,
                    px: { xs: 2.5, md: 3.5 },
                    py: { xs: 3, md: 4 },
                    background: theme.palette.mode === "dark"
                      ? `linear-gradient(150deg, ${alpha(theme.palette.background.paper, 0.78)}, ${alpha(theme.palette.primary.main, 0.22)})`
                      : `linear-gradient(150deg, ${alpha(theme.palette.common.white, 0.96)}, ${alpha(theme.palette.primary.light, 0.18)})`,
                    border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.25)}`,
                    boxShadow: theme.shadows[10],
                  }}
                >
                  <Box
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                      backgroundColor: theme.palette.mode === "dark"
                        ? alpha(theme.palette.background.default, 0.85)
                        : alpha(theme.palette.common.white, 0.95),
                    }}
                  >
                    <Slider {...imageSliderSettings}>
                      {screenshots.map((img, idx) => (
                        <Box key={img.alt + idx} sx={{ textAlign: "center", px: { xs: 0.5, md: 1.5 }, py: 2 }}>
                          <Fade in>
                            <img
                              src={img.src}
                              alt={img.alt}
                              style={{
                                width: "100%",
                                borderRadius: 24,
                                boxShadow: theme.palette.mode === "dark"
                                  ? "0 18px 38px rgba(15,23,42,0.55)"
                                  : "0 18px 42px rgba(15,23,42,0.14)",
                                cursor: "pointer",
                                transition: "transform 0.18s ease, box-shadow 0.18s ease",
                              }}
                              tabIndex={0}
                              onClick={() => handleOpen(idx)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") handleOpen(idx);
                              }}
                            />
                          </Fade>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                            {img.caption}
                          </Typography>
                        </Box>
                      ))}
                    </Slider>
                  </Box>

                  <Grid container spacing={1.5} mt={{ xs: 2.5, md: 3 }}>
                    {calendarStats.map((stat) => (
                      <Grid item xs={12} sm={4} key={stat.label}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.75,
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.72 : 0.92),
                            border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.4, textTransform: "uppercase" }}>
                            {stat.label}
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {stat.value}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>

                  <Stack direction="row" spacing={1} flexWrap="wrap" mt={3}>
                    {calendarBadges.map((badge) => (
                      <Chip
                        key={badge}
                        label={badge}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderRadius: 999,
                          letterSpacing: 0.2,
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                        }}
                      />
                    ))}
                  </Stack>
                </Paper>
              </Box>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={0.4}>
                Orchestrate every schedule
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, mb: 2, letterSpacing: "-0.4px" }}>
                Visual scheduling & workforce management in one view
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Instantly see who is booked, who is available, and which shifts need coverage. Calendar data flows straight into payroll, onboarding, and client experiences—no exports, no patchwork tools.
              </Typography>

              <Divider sx={{ my: 3, borderColor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.08 : 0.12) }} />

              <Stack spacing={1.4}>
                {calendarAssurances.map((point) => (
                  <Stack direction="row" spacing={1.2} alignItems="center" key={point}>
                    <CheckCircleRoundedIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                    <Typography variant="body2" color="text.secondary">
                      {point}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Stack direction="row" spacing={1.2} mt={3} alignItems="center">
                <Button variant="contained" color="primary" size="large" sx={{ borderRadius: 999, textTransform: "none", px: 3.5 }}>
                  See the calendar in action
                </Button>
                <Button variant="text" color="primary" size="large" sx={{ textTransform: "none", fontWeight: 600 }}>
                  Download playbook
                </Button>
              </Stack>
            </motion.div>
          </Grid>
        </Grid>

        <Box sx={{ mt: 10 }}>
          <Typography variant="h5" align="center" sx={{ fontWeight: 700, mb: 4 }}>
            Built-in tools teams love
          </Typography>

          <Slider {...featureSliderSettings}>
            {featureSlides.map((feat, idx) => (
              <Box key={feat.title + idx} px={1.5}>
                <motion.div
                  whileHover={{ y: -6 }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      textAlign: "center",
                      borderRadius: 4,
                      minHeight: 190,
                      background: theme.palette.mode === "dark"
                        ? alpha(theme.palette.background.paper, 0.78)
                        : alpha(theme.palette.common.white, 0.96),
                      border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.15)}`,
                      boxShadow: theme.palette.mode === "dark" ? theme.shadows[12] : theme.shadows[6],
                    }}
                  >
                    <Box sx={{
                      mx: "auto",
                      mb: 2.5,
                      width: 56,
                      height: 56,
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: alpha(theme.palette.primary.main, 0.12),
                    }}>
                      {feat.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {feat.title}
                    </Typography>
                  </Paper>
                </motion.div>
              </Box>
            ))}
          </Slider>
        </Box>

        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="lg"
          PaperProps={{
            sx: {
              borderRadius: 3,
              bgcolor: "background.paper",
              boxShadow: theme.shadows[12],
              p: 0,
              overflow: "hidden",
              position: "relative",
            },
          }}
        >
          {open && (
            <Box sx={{ textAlign: "center", bgcolor: "background.paper", minWidth: { xs: "82vw", md: "740px" } }}>
              <IconButton
                ref={closeBtnRef}
                aria-label="Close"
                onClick={handleClose}
                sx={{ position: "absolute", top: 12, right: 12, bgcolor: "background.default", zIndex: 20 }}
              >
                <CloseIcon fontSize="medium" />
              </IconButton>

              <IconButton
                aria-label="Previous"
                onClick={goPrev}
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: 8,
                  transform: "translateY(-50%)",
                  bgcolor: "background.default",
                  zIndex: 10,
                  display: { xs: screenshots.length > 1 ? "flex" : "none", md: "flex" },
                }}
              >
                <ArrowBackIosNewIcon />
              </IconButton>

              <IconButton
                aria-label="Next"
                onClick={goNext}
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: 8,
                  transform: "translateY(-50%)",
                  bgcolor: "background.default",
                  zIndex: 10,
                  display: { xs: screenshots.length > 1 ? "flex" : "none", md: "flex" },
                }}
              >
                <ArrowForwardIosIcon />
              </IconButton>

              <Box sx={{ p: { xs: 1.5, md: 4 }, pb: 3 }}>
                <Fade in>
                  <img
                    src={screenshots[selectedIdx].src}
                    alt={screenshots[selectedIdx].alt}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "72vh",
                      borderRadius: 18,
                      margin: "0 auto",
                      boxShadow: "0 16px 46px rgba(15,23,42,0.32)",
                      background: theme.palette.common.white,
                      display: "block",
                    }}
                  />
                </Fade>
                <Typography variant="subtitle1" color="text.secondary" sx={{ fontStyle: "italic", mt: 2.5 }}>
                  {screenshots[selectedIdx].caption}
                </Typography>
              </Box>
            </Box>
          )}
        </Dialog>
      </Box>
    </Box>
  );
};

export default CalendarShowcase;
