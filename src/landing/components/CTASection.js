import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { Link } from "react-router-dom";

const CTASection = ({
  title = "Ready to unify booking, payroll, and websites?",
  description = "Start a 14-day free trial or talk to our team about a custom rollout.",
}) => (
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
      <Typography variant="h4" component="h2" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="subtitle1" sx={{ maxWidth: 560 }}>
        {description}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
        <Button
          component={Link}
          to="/register"
          variant="contained"
          color="secondary"
          sx={{ textTransform: "none", borderRadius: 999, px: 4 }}
        >
          Start Free Trial
        </Button>
        <Button
          component={Link}
          to="/contact"
          variant="outlined"
          color="inherit"
          sx={{ textTransform: "none", borderRadius: 999, px: 4, borderColor: "rgba(255,255,255,0.8)", color: "#fff" }}
        >
          Talk to Sales
        </Button>
      </Stack>
    </Stack>
  </Box>
);

export default CTASection;
