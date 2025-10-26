import React from "react";
import { Box, Typography, Button, Grid } from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CTA = () => {
  return (
    <Box
      id="cta"
      sx={(theme) => ({
        py: { xs: 10, md: 14 },
        px: 2,
        background:
          theme.palette.mode === "dark"
            ? theme.palette.background.default
            : "linear-gradient(to right, #f0f4ff, #ffffff)",
        borderTop: `2px solid ${theme.palette.divider}`,
        textAlign: "center",
      })}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 2,
            fontSize: { xs: "2rem", md: "2.5rem" },
            background: "linear-gradient(to right, #1976d2, #00bfa5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Ready to Simplify Your Shifts, Payroll & HR?
        </Typography>

        <Typography
          variant="body1"
          sx={(theme) => ({
            mb: 5,
            color: theme.palette.text.secondary,
            maxWidth: "600px",
            mx: "auto",
            fontSize: { xs: "1rem", md: "1.1rem" },
            lineHeight: 1.8,
          })}
        >
          Get started in minutes—automate everything from staff scheduling to pay runs and compliance. Schedulaa saves managers and teams hours every week.
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
              sx={(theme) => ({
                px: 4,
                py: 1.5,
                fontWeight: 600,
                borderRadius: 8,
                color: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              })}
            >
              Log In
            </Button>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default CTA;
