import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { Link } from "react-router-dom";

const CTASection = ({
  eyebrow,
  title = "Ready to unify booking, payroll, and websites?",
  description = "Start a 14-day free trial or talk to our team about a custom rollout.",
  primaryCTA = { label: "Start Free Trial", to: "/register" },
  secondaryCTA = { label: "Talk to Sales", to: "/contact" },
}) => {
  const renderDescription = () => {
    if (Array.isArray(description)) {
      return description.map((line) => (
        <Typography key={line} variant="subtitle1" sx={{ maxWidth: 560 }}>
          {line}
        </Typography>
      ));
    }
    return (
      <Typography variant="subtitle1" sx={{ maxWidth: 560 }}>
        {description}
      </Typography>
    );
  };

  return (
  <Box
    component="section"
    sx={{
      py: { xs: 8, md: 10 },
      px: { xs: 2, md: 6 },
      background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
      color: "#fff",
      borderRadius: { xs: 0, md: 4 },
      mt: { xs: 8, md: 12 },
    }}
  >
    <Stack spacing={2} alignItems="center" textAlign="center">
      {eyebrow && (
        <Typography variant="overline" sx={{ letterSpacing: 1, opacity: 0.8 }}>
          {eyebrow}
        </Typography>
      )}
      <Typography variant="h4" component="h2" fontWeight={700}>
        {title}
      </Typography>
      {renderDescription()}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
        <Button
          component={Link}
          to={primaryCTA?.to || "/register"}
          variant="contained"
          color="secondary"
          sx={{ textTransform: "none", borderRadius: 999, px: 4 }}
        >
          {primaryCTA?.label || "Start Free Trial"}
        </Button>
        <Button
          component={Link}
          to={secondaryCTA?.to || "/contact"}
          variant="outlined"
          color="inherit"
          sx={{ textTransform: "none", borderRadius: 999, px: 4, borderColor: "rgba(255,255,255,0.8)", color: "#fff" }}
        >
          {secondaryCTA?.label || "Talk to Sales"}
        </Button>
      </Stack>
    </Stack>
  </Box>
  );
};

export default CTASection;
