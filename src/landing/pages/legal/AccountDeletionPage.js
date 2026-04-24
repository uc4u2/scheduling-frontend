import React from "react";
import { Box, Stack, Typography, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";
import Meta from "../../../components/Meta";

const AccountDeletionPage = () => (
  <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 10, md: 12 }, maxWidth: 900, mx: "auto" }}>
    <Meta
      title="Schedulaa Account and Data Deletion"
      description="Learn how to request account deletion or personal data deletion for Schedulaa."
      canonical="https://www.schedulaa.com/account-deletion"
    />
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h3" component="h1" fontWeight={800}>
          Account and Data Deletion
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last updated: April 23, 2026
        </Typography>
      </Stack>

      <Typography variant="body1" color="text.secondary">
        This page explains how users of the Schedulaa app and platform can request account deletion or personal
        data deletion. Schedulaa is operated by Photo Artisto Corp.
      </Typography>

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          1. How to request deletion
        </Typography>
        <Typography variant="body1" color="text.secondary">
          To request account deletion or personal data deletion, email{" "}
          <MuiLink href="mailto:admin@schedulaa.com">admin@schedulaa.com</MuiLink>.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Suggested email subjects:
        </Typography>
        <Typography variant="body1" color="text.secondary">
          • Account deletion request
        </Typography>
        <Typography variant="body1" color="text.secondary">
          • Personal data deletion request
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          2. What to include in your request
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please include the email address associated with your account, your workspace or company name if applicable,
          and whether you want full account deletion or deletion of specific personal data only.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          3. What may be deleted
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Where legally possible, Schedulaa may delete account profile data, workspace or user records, uploaded
          files and images, and operational records that are no longer required for service delivery, security,
          compliance, or legal obligations.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          4. What may be retained
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Schedulaa may retain billing records, security and fraud logs, audit and compliance records, invoices,
          dispute or legal records, and backup data for a limited retention period where required by law, contract,
          security practice, or legitimate business obligations.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          5. Processing timeframe
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Schedulaa will review deletion requests and respond within a reasonable timeframe, normally within 30 days
          where applicable law allows.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          6. Service impact
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Deleting account data or personal data may reduce or remove access to Schedulaa services, including account
          login, workspace records, bookings, payroll-related workflows, support history, and other platform features.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          7. Related pages
        </Typography>
        <Typography variant="body1" color="text.secondary">
          For more information, review our{" "}
          <MuiLink component={Link} to="/privacy">
            Privacy Policy
          </MuiLink>{" "}
          or{" "}
          <MuiLink component={Link} to="/contact">
            Contact page
          </MuiLink>
          .
        </Typography>
      </Stack>
    </Stack>
  </Box>
);

export default AccountDeletionPage;
