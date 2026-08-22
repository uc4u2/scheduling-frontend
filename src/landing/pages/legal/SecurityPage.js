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
      <Stack spacing={1}>
        <Typography variant="h3" component="h1" fontWeight={800}>
          Security at Schedulaa
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last updated: August 22, 2026
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">1. Infrastructure</Typography>
        <Typography variant="body1" color="text.secondary">
          Schedulaa runs on managed cloud infrastructure and uses layered network and access controls appropriate to the service. We use encryption in transit and apply encryption-at-rest protections where supported by the relevant storage or infrastructure layer.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">2. Application security</Typography>
        <Typography variant="body1" color="text.secondary">
          Security controls may include role-based access controls, authentication controls, logging, dependency maintenance, administrative review workflows, and vulnerability-management practices appropriate to the product and environment.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">3. Data protection</Typography>
        <Typography variant="body1" color="text.secondary">
          We use backup, logging, monitoring, and operational recovery measures designed to support service continuity and incident investigation. Backup scope, retention, recovery objectives, and recovery methods may vary by system, environment, and subscription context.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">4. Compliance</Typography>
        <Typography variant="body1" color="text.secondary">
          Schedulaa is designed to support privacy, security, payroll, and recordkeeping workflows, but this page is descriptive only and is not a certification, guarantee, legal opinion, or commitment that your use of the service will satisfy every regulatory obligation. Formal compliance commitments, if any, are governed by your contract and the applicable legal terms.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">5. Incident response</Typography>
        <Typography variant="body1" color="text.secondary">
          We maintain incident-response and escalation processes for security events and operational issues. Where applicable law requires notice, we aim to provide breach or incident notifications within the legally required timeframe after confirming the relevant facts. Security concerns can be reported to security@schedulaa.com.
        </Typography>
      </Stack>
    </Stack>
  </Box>
);

export default SecurityPage;
