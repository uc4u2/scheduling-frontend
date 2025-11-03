import React from "react";
import { Box, Typography, Button, Grid } from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MorphingBlob from "../ui/MorphingBlob"; // ⬅️ blob backgrounds

const Hero = () => {
  return (
    <Box
      id="hero"
      sx={{
        position: "relative",
        overflow: "hidden",
        py: { xs: 8, md: 12 },
        px: 2,
        textAlign: "center",
        backgroundColor: (theme) => theme.palette.background.default,
      }}
    >
      {/* Decorative blobs */}
      <MorphingBlob
        color="#ff4081"
        size={320}
        opacity={0.15}
        sx={{ top: 20, left: -80 }}
        duration={16}
      />
      <MorphingBlob
        color="#00bfa5"
        size={420}
        opacity={0.2}
        sx={{ bottom: -100, right: -70 }}
        duration={18}
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "2.1rem", sm: "2.6rem", md: "3.1rem" },
            background: "linear-gradient(to right, #1976d2, #00bfa5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 2,
          }}
        >
          Shift Scheduling, Payroll & HR—All in One Place
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            maxWidth: "700px",
            mx: "auto",
            fontWeight: 400,
            fontSize: { xs: "1rem", md: "1.18rem" },
            lineHeight: 1.7,
            mb: 4,
          }}
        >
          Assign shifts, run payroll, onboard employees, and let candidates or staff book with you—without the manual busywork. Schedulaa automates it all for SMB teams.
        </Typography>

        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1.5, fontWeight: 600, borderRadius: 8 }}
            >
              Get Started Free
            </Button>
          </Grid>
          <Grid item>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5, fontWeight: 600, borderRadius: 8 }}
            >
              Log In
            </Button>
          </Grid>
        </Grid>

        <Typography
          variant="body2"
          sx={{
            mt: 3,
            color: "text.secondary",
            fontStyle: "italic",
            opacity: 0.8,
            fontSize: { xs: "0.95rem", md: "1.04rem" },
          }}
        >
          From shift to payroll—Schedulaa saves you hours every week.
        </Typography>
      </motion.div>
    </Box>
  );
};

export default Hero;
