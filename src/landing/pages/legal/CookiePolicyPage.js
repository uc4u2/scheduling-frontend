import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import Meta from "../../../components/Meta";

const CookiePolicyPage = () => (
  <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 10, md: 12 }, maxWidth: 900, mx: "auto" }}>
    <Meta
      title="Schedulaa Cookie Policy"
      description="Understand how Schedulaa uses cookies for authentication, analytics, and marketing."
      canonical="https://www.schedulaa.com/cookie"
    />
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h3" component="h1" fontWeight={800}>
          Cookie Policy
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last updated: October 2025
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">1. What are cookies?</Typography>
        <Typography variant="body1" color="text.secondary">
          Cookies are small files stored on your device to remember preferences and logins.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">2. Cookies we use</Typography>
        <Typography variant="body1" color="text.secondary">
          We use strictly necessary cookies for authentication, preference cookies for language and timezone, analytics cookies for usage metrics via Google Analytics, and marketing cookies only if you opt in.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">3. Managing cookies</Typography>
        <Typography variant="body1" color="text.secondary">
          Most browsers let you control or block cookies. Disabling essential cookies may impact functionality. If required by law, we present a cookie consent banner.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">4. Updates</Typography>
        <Typography variant="body1" color="text.secondary">
          We may revise this policy as cookie usage evolves. Contact privacy@schedulaa.com with questions.
        </Typography>
      </Stack>
    </Stack>
  </Box>
);

export default CookiePolicyPage;
