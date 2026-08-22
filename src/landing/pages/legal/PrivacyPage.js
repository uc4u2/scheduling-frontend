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
          Last updated: August 22, 2026
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
        <Typography variant="h5">3B. AI features and automated processing</Typography>
        <Typography variant="body1" color="text.secondary">
          If you use AI-assisted or automated features, we may process prompts, instructions, uploaded files, product facts, website content, lead or contact details, call transcripts, draft messages, and related workspace context to generate, summarize, classify, validate, route, or improve requested outputs and workflows.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This may include AI website-copy generation, commerce or product-draft assistance, AI sales-development or call-flow tools, draft suggestions, and future assistant or copilot features. Depending on the feature, inputs and outputs may be processed by Photo Artisto Corp. and by contracted service providers that supply model, hosting, routing, transcription, or related infrastructure.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Unless we expressly state otherwise in feature-specific documentation or an enterprise agreement, AI-related inputs and outputs are processed to deliver the requested feature and to support safety, abuse prevention, debugging, incident response, customer support, quality assurance, and service reliability. They are not provided as professional advice, and you remain responsible for reviewing and approving AI-generated outputs before publishing, sending, or relying on them.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Unless we expressly state otherwise in writing for a specific feature or customer arrangement, we describe these AI-related uses as supporting inference and service delivery rather than as a general authorization for third-party model providers to use your workspace data for their own general-purpose model improvement. If that position changes for a specific feature, we will address it in the applicable product notice, documentation, or contract.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">3A. Security, fraud prevention, and account integrity</Typography>
        <Typography variant="body1" color="text.secondary">
          To protect users and prevent payment abuse, we process security and risk signals such as login outcomes, IP address, device/user-agent, approximate geo data (when available), billing risk events, payment fraud/dispute events, and related operational telemetry. We may use these signals to trigger additional verification, apply temporary review holds, limit abusive traffic, block suspicious payment patterns, or suspend access when required for safety, legal compliance, or platform integrity.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          For security logs, full IP addresses may be stored in protected internal systems. Most admin interfaces show masked IP values by default. Access to full IP values is restricted to authorized personnel for security/support purposes and is subject to access logging and review.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Approximate geo data may be derived from network/provider signals (for example, proxy/CDN headers or similar infrastructure metadata) and may be unavailable or imprecise in some requests.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          We may maintain audit logs of administrative actions (for example publish/unpublish actions and checkpoint restore events) for security, integrity, and incident investigation.
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
        <Typography variant="body1" color="text.secondary">
          For AI-assisted and automated features, this may include contracted providers that support model inference, transcription, communications delivery, hosting, safety review, abuse prevention, and workflow execution.
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
        <Typography variant="body1" color="text.secondary">
          Security and fraud logs are retained for reasonable operational periods and may be shortened or extended when needed for abuse prevention, legal obligations, dispute handling, and auditability. Some admin interfaces display masked values (for example, masked IP) while protected internal systems may retain full values for authorized support and security investigations.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          As operational defaults, selected risk and telemetry logs are typically retained for limited windows (for example, roughly 30 to 180 days), unless a longer period is required for active investigations, legal holds, billing disputes, or regulatory compliance.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-related prompts, transcripts, generated drafts, and workflow outputs may also be retained for reasonable operational periods when needed to deliver the feature, preserve workspace history, support troubleshooting, review safety or abuse concerns, validate billing, resolve disputes, or satisfy compliance obligations.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">8. Your rights</Typography>
        <Typography variant="body1" color="text.secondary">
          Access, correct, export, or delete personal data; object to processing or withdraw consent; contact admin@schedulaa.com. EU/UK users can lodge complaints with a supervisory authority.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">9. Cookies & tracking</Typography>
        <Typography variant="body1" color="text.secondary">
          We use cookies for authentication, analytics, and marketing. See the Cookie Policy for details.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          We also use first-party operational telemetry for service reliability, abuse prevention, and security diagnostics (for example, authenticated route activity and heartbeat events). This operational telemetry is distinct from advertising or third-party marketing tracking.
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
          Contact: Photo Artisto Corp., 171 Harbord Street, Toronto, Ontario M5S 1H3 Canada | admin@schedulaa.com
        </Typography>
      </Stack>
    </Stack>
  </Box>
);

export default PrivacyPage;
