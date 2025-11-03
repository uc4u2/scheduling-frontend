import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import Meta from "../../../components/Meta";

const PrivacyPage = () => (
  <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 10, md: 12 }, maxWidth: 900, mx: "auto" }}>
    <Meta
      title="Schedulaa Privacy Policy"
      description="Learn how Photo Artisto Corp. collects, uses, and protects personal information for Schedulaa users."
      canonical="https://www.schedulaa.com/privacy"
    />
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h3" component="h1" fontWeight={800}>
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last updated: October 2025
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">1. Introduction</Typography>
        <Typography variant="body1" color="text.secondary">
          Photo Artisto Corp. ("Schedulaa", "we") is committed to protecting personal data. This policy describes how we collect, use, and store information.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">2. Information we collect</Typography>
        <Typography variant="body1" color="text.secondary">
          Account information (name, email, company details), business data (client bookings, employee schedules, payroll data, uploaded media), payment data processed by Stripe, usage data, and support communications.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">3. How we use information</Typography>
        <Typography variant="body1" color="text.secondary">
          We provide, maintain, and improve Schedulaa features; process bookings, payroll, payments, and website publishing; communicate about services, updates, and marketing (with opt-out); ensure security and compliance; and aggregate analytics for product insights.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">4. Legal bases</Typography>
        <Typography variant="body1" color="text.secondary">
          Contract performance, legitimate interests, consent, and legal obligations as applicable.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">5. Sharing data</Typography>
        <Typography variant="body1" color="text.secondary">
          We share data with service providers (hosting, Imgix, Stripe, support tools), comply with legal processes, and may transfer data in the event of a merger subject to safeguards.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">6. International transfers</Typography>
        <Typography variant="body1" color="text.secondary">
          Data may be stored in the United States or other jurisdictions with safeguards such as Standard Contractual Clauses for EU/UK transfers.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">7. Data retention</Typography>
        <Typography variant="body1" color="text.secondary">
          We retain data as long as necessary for the purposes described. You can delete content or request deletion by contacting support.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">8. Your rights</Typography>
        <Typography variant="body1" color="text.secondary">
          Access, correct, export, or delete personal data; object to processing or withdraw consent; contact privacy@schedulaa.com. EU/UK users can lodge complaints with a supervisory authority.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">9. Cookies & tracking</Typography>
        <Typography variant="body1" color="text.secondary">
          We use cookies for authentication, analytics, and marketing. See the Cookie Policy for details.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">10. Security</Typography>
        <Typography variant="body1" color="text.secondary">
          Encryption at rest and in transit, access controls, monitoring, and breach notification processes. Notify us immediately of any suspected breach.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">11. Children</Typography>
        <Typography variant="body1" color="text.secondary">
          Schedulaa is not intended for children under 16. We do not knowingly collect their data.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">12. Updates</Typography>
        <Typography variant="body1" color="text.secondary">
          We may update this policy and will notify you of significant changes.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Contact: Photo Artisto Corp., 1080 Market Street, Suite 500, San Francisco, CA 94103 USA | privacy@schedulaa.com
        </Typography>
      </Stack>
    </Stack>
  </Box>
);

export default PrivacyPage;
