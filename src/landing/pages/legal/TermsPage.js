import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import Meta from "../../../components/Meta";

const TermsPage = () => (
  <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 10, md: 12 }, maxWidth: 900, mx: "auto" }}>
    <Meta
      title="Schedulaa Terms of Service"
      description="Terms of Service governing access to schedulaa.com and related services operated by Photo Artisto Corp."
      canonical="https://www.schedulaa.com/terms"
    />
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h3" component="h1" fontWeight={800}>
          Terms of Service
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last updated: December 2025
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">1. Overview</Typography>
        <Typography variant="body1" color="text.secondary">
          These Terms of Service ("Terms") govern access to and use of schedulaa.com, the Schedulaa web app, APIs, and any related services operated by Photo Artisto Corp. ("Schedulaa", "we", "us"). By using the Services you agree to these Terms and to our Privacy Policy.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">2. Account registration</Typography>
        <Typography variant="body1" color="text.secondary">
          Provide accurate account information. You are responsible for maintaining confidentiality of login credentials. You must be at least 18 years old or of legal age in your jurisdiction.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">3. Use of the Services</Typography>
        <Typography variant="body1" color="text.secondary">
          You may use Schedulaa to run scheduling, payroll, website, and commerce workflows for your business. Prohibited activities include illegal content, harassment, spam, infringement, reverse engineering, or circumventing security. We may suspend or terminate accounts that violate these Terms or applicable law.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You may not impersonate Schedulaa or any official entity, use misleading company names, slugs, public URLs, or domains, or engage in activity that could reasonably harm Schedulaa's brand, reputation, or search visibility.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">4. Subscription and payment</Typography>
        <Typography variant="body1" color="text.secondary">
          Plans are billed monthly or annually in advance. Fees are non-refundable unless otherwise stated. Add-ons are charged according to current rates. You authorize us or our payment processor to charge subscription fees to your payment method.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">5. Payroll & taxation</Typography>
        <Typography variant="body1" color="text.secondary">
          Schedulaa provides tools to help generate payroll reports and filings but does not guarantee compliance. You remain responsible for accuracy, filings, and remittances in your jurisdiction.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">6. Content & intellectual property</Typography>
        <Typography variant="body1" color="text.secondary">
          You retain ownership of content you upload. By using Schedulaa you grant us a limited license to host, store, and display that content for the purpose of operating the Services. You are solely responsible for all content you publish, including public-facing pages and websites. Schedulaa, logos, designs, documentation, and software are owned by Photo Artisto Corp.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          We do not guarantee search indexing, ranking, or visibility; search engines decide independently.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">6A. Company Pages, URLs, and Domains</Typography>
        <Typography variant="body1" color="text.secondary">
          Company pages, public URLs, hosted websites, and connected custom domains are user-generated and are not reviewed, monitored, or endorsed by Schedulaa. We may disable, remove, de-index, block, or restrict any company page, URL, slug, or domain at our sole discretion.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">7. Service availability</Typography>
        <Typography variant="body1" color="text.secondary">
          We aim for high availability but do not guarantee uninterrupted service. Scheduled maintenance and unscheduled outages may occur. For enterprise SLAs, contact support@schedulaa.com.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">8. Third-party services</Typography>
        <Typography variant="body1" color="text.secondary">
          Schedulaa integrates with services such as Stripe, Imgix, calendar platforms, and video providers. Your use of those services may be governed by their own terms.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">9. Limitation of liability</Typography>
        <Typography variant="body1" color="text.secondary">
          To the maximum extent allowed by law, Photo Artisto Corp. is not liable for indirect, incidental, or consequential damages arising from use of the Services. Our total liability is limited to the amount paid to Schedulaa in the 12 months prior to the claim.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">10. Indemnification</Typography>
        <Typography variant="body1" color="text.secondary">
          You agree to indemnify Photo Artisto Corp. from claims arising out of your use of the Services, breach of these Terms, or violation of law.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">11. Termination</Typography>
        <Typography variant="body1" color="text.secondary">
          You may cancel at any time. Fees already paid remain due. We may suspend or terminate access for violations of these Terms.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          We may take immediate action without notice, including removing content, disabling public pages or domains, or terminating accounts, when necessary to protect users, the platform, our SEO/brand, or to comply with law.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">12. Changes to Terms</Typography>
        <Typography variant="body1" color="text.secondary">
          We may update these Terms from time to time. Continued use of Schedulaa after changes constitutes acceptance of the updated Terms.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">13. Governing law</Typography>
        <Typography variant="body1" color="text.secondary">
          These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada. Disputes will be handled exclusively in the courts of Toronto, Ontario unless otherwise required by law.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">14. Contact</Typography>
        <Typography variant="body1" color="text.secondary">
          Photo Artisto Corp., 171 Harbord Street, Toronto, Ontario M5S 1H3 Canada | admin@schedulaa.com
        </Typography>
      </Stack>
    </Stack>
  </Box>
);

export default TermsPage;
