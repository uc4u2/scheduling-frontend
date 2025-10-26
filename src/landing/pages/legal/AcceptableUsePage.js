import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import Meta from "../../../components/Meta";

const AcceptableUsePage = () => (
  <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 10, md: 12 }, maxWidth: 900, mx: "auto" }}>
    <Meta
      title="Schedulaa Acceptable Use Policy"
      description="Guidelines for using Schedulaa services responsibly."
      canonical="https://www.schedulaa.com/acceptable-use"
    />
    <Stack spacing={3}>
      <Typography variant="h3" component="h1" fontWeight={800}>
        Acceptable Use Policy
      </Typography>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">1. Prohibited content</Typography>
        <Typography variant="body1" color="text.secondary">
          No illegal, infringing, hateful, or pornographic material is permitted. Do not share personal data without consent.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">2. Prohibited behavior</Typography>
        <Typography variant="body1" color="text.secondary">
          Spamming, phishing, abusing APIs, interfering with others, bypassing security, reverse engineering, or overloading systems is prohibited.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">3. Violations</Typography>
        <Typography variant="body1" color="text.secondary">
          We may suspend or terminate accounts that violate these rules. Report abuses to abuse@schedulaa.com.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">4. Enforcement</Typography>
        <Typography variant="body1" color="text.secondary">
          We reserve the right to remove content and cooperate with law enforcement.
        </Typography>
      </Stack>
    </Stack>
  </Box>
);

export default AcceptableUsePage;
