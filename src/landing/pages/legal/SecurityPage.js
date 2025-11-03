import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import Meta from "../../../components/Meta";

const SecurityPage = () => (
  <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 10, md: 12 }, maxWidth: 900, mx: "auto" }}>
    <Meta
      title="Security at Schedulaa"
      description="Learn how Schedulaa protects infrastructure, applications, and customer data."
      canonical="https://www.schedulaa.com/security"
    />
    <Stack spacing={3}>
      <Typography variant="h3" component="h1" fontWeight={800}>
        Security at Schedulaa
      </Typography>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">1. Infrastructure</Typography>
        <Typography variant="body1" color="text.secondary">
          Hosted on AWS with network segmentation and firewalls. Data encryption at rest (AES-256) and in transit (TLS 1.2+).
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">2. Application security</Typography>
        <Typography variant="body1" color="text.secondary">
          Role-based access control, optional multi-factor authentication, and regular vulnerability scanning and dependency patching.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">3. Data protection</Typography>
        <Typography variant="body1" color="text.secondary">
          Automated backups with point-in-time recovery, logging and monitoring for unusual activity, and secure handling of payroll and PII data.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">4. Compliance</Typography>
        <Typography variant="body1" color="text.secondary">
          Aligns with GDPR principles, SOC 2 controls (roadmap), and local payroll regulations.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">5. Incident response</Typography>
        <Typography variant="body1" color="text.secondary">
          24/7 monitoring, breach notifications within 72 hours where required, and dedicated security@schedulaa.com reporting channel.
        </Typography>
      </Stack>
    </Stack>
  </Box>
);

export default SecurityPage;
