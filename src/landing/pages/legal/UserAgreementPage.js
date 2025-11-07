import React from "react";
import { Box, Typography, Stack, List, ListItem, ListItemText } from "@mui/material";
import Meta from "../../../components/Meta";

const bullets = (items) => (
  <List dense disablePadding sx={{ pl: 3 }}>
    {items.map((text) => (
      <ListItem key={text} sx={{ py: 0 }}>
        <ListItemText
          primaryTypographyProps={{ variant: "body1", color: "text.secondary" }}
          primary={text}
        />
      </ListItem>
    ))}
  </List>
);

const UserAgreementPage = () => (
  <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 10, md: 12 }, maxWidth: 900, mx: "auto" }}>
    <Meta
      title="Schedulaa User Agreement"
      description="Enterprise-grade user agreement governing access to Schedulaa, operated by Photo Artisto Corp."
      canonical="https://www.schedulaa.com/user-agreement"
    />
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h3" component="h1" fontWeight={800}>
          Schedulaa User Agreement
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last updated: November 2025
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This User Agreement (“Agreement”) governs your access to and use of Schedulaa, operated by Photo Artisto Corp.,
          171 Harbord Street, Toronto, Ontario M5S 1H3 (“Schedulaa,” “we,” “our,” “us”). By creating an account or using
          the Services, you agree to this Agreement and to our Terms of Service, Privacy Policy, Cookie Policy, and Data
          Processing Addendum (collectively, the “Policies”).
        </Typography>
      </Stack>

      {[
        {
          title: "1. Overview of the Services",
          body:
            "Schedulaa provides software for booking, scheduling, payroll, website publishing, marketing, domain management, and payment processing through partners such as Stripe. The Services are subscription-based with optional add-ons.",
        },
        {
          title: "2. Account Registration",
          list: [
            "Provide accurate, complete information and keep your credentials secure.",
            "You must be 18+ or the legal age of majority in your jurisdiction.",
            "If registering on behalf of an organization, you confirm you have authority to bind that entity.",
          ],
        },
        {
          title: "3. Acceptable Use",
          list: [
            "Use the Services only for lawful business purposes.",
            "Do not upload malicious code, violate privacy, infringe IP, or try to bypass security.",
            "Schedulaa may suspend or terminate access for misuse or non-compliance.",
          ],
        },
        {
          title: "4. Subscriptions, Billing & Taxes",
          list: [
            "Plans are billed monthly or annually through Stripe; fees are non-refundable except where required by law.",
            "You authorize recurring charges and remain responsible for applicable sales/HST/GST/PST or U.S. state taxes.",
            "Non-payment may lead to suspension or deletion of data.",
          ],
        },
        {
          title: "5. Payroll & Compliance Disclaimer",
          body:
            "Schedulaa provides tools for payroll calculations and compliance documents (e.g., T4, ROE, W-2) but is not your employer, accountant, or tax agent. You are solely responsible for the accuracy of pay data, remitting payroll taxes, and complying with labour and employment laws. Schedulaa disclaims liability for payroll errors, remittance failures, or penalties.",
        },
        {
          title: "6. Ownership of Content & Intellectual Property",
          list: [
            "You own the content and data you upload.",
            "You grant Schedulaa a limited, worldwide, royalty-free licence to host/process that content to operate the Services.",
            "Schedulaa software, documentation, and trademarks remain the property of Photo Artisto Corp. and may not be copied, modified, or reverse-engineered.",
          ],
        },
        {
          title: "7. Data Protection & Privacy",
          list: [
            "Schedulaa uses industry safeguards (AES-256/TLS 1.2+, access controls, backups, breach procedures).",
            "Data may be stored in Canada, the U.S., or other regions under appropriate safeguards.",
            "You must have a lawful basis for personal data uploaded to Schedulaa. When processing such data, we act as a Processor under the Data Processing Addendum.",
          ],
        },
        {
          title: "8. Communications & Consent",
          list: [
            "If you send SMS, email, or push communications through Schedulaa, you are responsible for obtaining and documenting the recipient’s consent under CASL, CAN-SPAM, TCPA, and other anti-spam, privacy, or telecom laws.",
            "You must honor opt-outs immediately and configure messaging settings to comply with local content, quiet hours, and sender-ID requirements.",
            "Schedulaa may throttle, block, or suspend messaging that appears abusive, unlawful, or likely to trigger telecom carrier filtering.",
          ],
        },
        {
          title: "9. Third-Party Services",
          body:
            "Schedulaa integrates with services such as Stripe, QuickBooks, Xero, Imgix, Slack, SMS/email gateways, and calendar providers. Their own terms govern those services. Schedulaa is not responsible for downtime, data loss, or errors arising from third-party providers.",
        },
        {
          title: "10. Service Availability & Maintenance",
          body:
            "Schedulaa aims for high availability but provides the Services “as is” and “as available.” Maintenance, updates, or outages may occur without liability. Enterprise customers may request specific SLAs.",
        },
        {
          title: "11. No Professional Advice",
          body:
            "Schedulaa does not provide legal, tax, accounting, payroll, HR, or employment advice. Outputs, templates, or calculations are informational only. Consult qualified professionals before relying on them.",
        },
        {
          title: "12. No Warranties",
          body:
            "To the fullest extent permitted by law, the Services are provided without warranties of any kind, including merchantability, fitness for a particular purpose, accuracy, or non-infringement. We do not warrant that the Services will be uninterrupted, error-free, secure, or defect-free. You assume all risk.",
        },
        {
          title: "13. Limitation of Liability",
          body:
            "To the maximum extent permitted under Canadian law, Schedulaa’s total liability for any claim is limited to the fees you paid in the 12 months preceding the claim. We are not liable for indirect, incidental, special, consequential, or punitive damages (including lost profits, data, business, or goodwill), whether in contract, tort, negligence, or statute.",
        },
        {
          title: "14. Data Loss & System Failures",
          body:
            "Cloud systems carry inherent risks. Although Schedulaa uses redundant storage and backups, we cannot guarantee against data loss. You are responsible for maintaining independent backups of critical information.",
        },
        {
          title: "15. Force Majeure",
          body:
            "Schedulaa is not liable for delays or failures beyond its reasonable control, including natural disasters, internet outages, labour disputes, governmental actions, cyberattacks, or failures of hosting/cloud providers.",
        },
        {
          title: "16. Indemnification",
          list: [
            "You will indemnify Photo Artisto Corp., its directors, officers, and employees against claims, damages, losses, or costs (including legal fees) arising from:",
            "• your use or misuse of the Services;",
            "• your breach of this Agreement or applicable law; or",
            "• employment, payroll, or tax disputes related to your business.",
          ],
        },
        {
          title: "17. Website Content Responsibility",
          list: [
            "You are responsible for the accuracy, legality, and licensing of all copy, media, templates, and domains you publish via Schedulaa.",
            "Do not upload content that infringes third-party IP, violates privacy or publicity rights, or contains regulated advice without proper credentials.",
            "Schedulaa may remove or disable content that violates this Agreement or receives credible legal complaints, and may request proof of licensing for logos, photos, or fonts.",
          ],
        },
        {
          title: "18. Beta & Experimental Features",
          list: [
            "From time to time Schedulaa may offer beta, labs, AI, or preview functionality. Such features are provided “as is,” may be rate-limited, and may be modified or discontinued without notice.",
            "Outputs generated by experimental features (including analytics forecasts or AI-generated text) are not guaranteed accurate; you must validate results before relying on them.",
            "Usage feedback may be collected to improve these features, and normal support SLAs do not apply.",
          ],
        },
        {
          title: "19. Termination",
          list: [
            "You may cancel your subscription at any time; fees already paid remain non-refundable.",
            "Schedulaa may suspend or terminate access for non-payment, misuse, or violations of this Agreement.",
            "Data may be deleted after a reasonable retention period per our Privacy Policy.",
          ],
        },
        {
          title: "20. Intellectual Property & Feedback",
          body:
            "Schedulaa logos, designs, and software belong to Photo Artisto Corp. Any feedback you provide may be used to improve the Services without obligation or compensation.",
        },
        {
          title: "21. Governing Law & Jurisdiction",
          body:
            "This Agreement is governed by the laws of the Province of Ontario and the federal laws of Canada. Disputes will be resolved exclusively in the courts of Toronto, Ontario. Both parties waive jury trial and class-action rights to the extent permitted by law.",
        },
        {
          title: "22. Modifications",
          body:
            "Schedulaa may update this Agreement periodically. The current version is posted at https://www.schedulaa.com/user-agreement. Continued use after changes constitutes acceptance of the revised terms.",
        },
        {
          title: "23. Contact",
          body:
            "Photo Artisto Corp., 171 Harbord Street, Toronto, ON M5S 1H3 • admin@schedulaa.com",
        },
      ].map((section) => (
        <Stack spacing={1.5} key={section.title}>
          <Typography variant="h5" component="h2" fontWeight={700}>
            {section.title}
          </Typography>
          {section.body && (
            <Typography variant="body1" color="text.secondary">
              {section.body}
            </Typography>
          )}
          {section.list && bullets(section.list)}
        </Stack>
      ))}
    </Stack>
  </Box>
);

export default UserAgreementPage;
