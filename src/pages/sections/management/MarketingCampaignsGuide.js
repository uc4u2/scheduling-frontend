import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Divider,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Trans, useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

export default function MarketingCampaignsGuide({ onClose }) {
  const { t } = useTranslation();
  const richComponents = { strong: <strong />, em: <em />, code: <code /> };
  const customizeFields = t("help.marketing.customize.fields", { returnObjects: true }) || [];

  const primaryCampaigns = [
    {
      key: "broadcast",
      title: t("help.marketing.campaigns.broadcast.title"),
      goalKey: "help.marketing.campaigns.broadcast.goal",
      audienceKeys: [
        "help.marketing.campaigns.broadcast.audience.0",
        "help.marketing.campaigns.broadcast.audience.1",
      ],
      highlightKeys: [
        "help.marketing.campaigns.broadcast.highlights.0",
        "help.marketing.campaigns.broadcast.highlights.1",
        "help.marketing.campaigns.broadcast.highlights.2",
        "help.marketing.campaigns.broadcast.highlights.3",
      ],
      bestUseKey: "help.marketing.campaigns.broadcast.bestUse",
    },
    {
      key: "winback",
      title: t("help.marketing.campaigns.winback.title"),
      goalKey: "help.marketing.campaigns.winback.goal",
      audienceKeys: [],
      highlightKeys: [
        "help.marketing.campaigns.winback.highlights.0",
        "help.marketing.campaigns.winback.highlights.1",
        "help.marketing.campaigns.winback.highlights.2",
        "help.marketing.campaigns.winback.highlights.3",
        "help.marketing.campaigns.winback.highlights.4",
        "help.marketing.campaigns.winback.highlights.5",
        "help.marketing.campaigns.winback.highlights.6",
      ],
      bestUseKey: "help.marketing.campaigns.winback.bestUse",
    },
    {
      key: "skipped",
      title: t("help.marketing.campaigns.skipped.title"),
      goalKey: "help.marketing.campaigns.skipped.goal",
      audienceKeys: [],
      highlightKeys: [
        "help.marketing.campaigns.skipped.highlights.0",
        "help.marketing.campaigns.skipped.highlights.1",
        "help.marketing.campaigns.skipped.highlights.2",
        "help.marketing.campaigns.skipped.highlights.3",
      ],
      bestUseKey: "help.marketing.campaigns.skipped.bestUse",
    },
    {
      key: "vip",
      title: t("help.marketing.campaigns.vip.title"),
      goalKey: "help.marketing.campaigns.vip.goal",
      audienceKeys: [],
      highlightKeys: [
        "help.marketing.campaigns.vip.highlights.0",
        "help.marketing.campaigns.vip.highlights.1",
        "help.marketing.campaigns.vip.highlights.2",
        "help.marketing.campaigns.vip.highlights.3",
        "help.marketing.campaigns.vip.highlights.4",
      ],
      bestUseKey: "help.marketing.campaigns.vip.bestUse",
    },
    {
      key: "anniversary",
      title: t("help.marketing.campaigns.anniversary.title"),
      goalKey: "help.marketing.campaigns.anniversary.goal",
      audienceKeys: [],
      highlightKeys: [
        "help.marketing.campaigns.anniversary.highlights.0",
        "help.marketing.campaigns.anniversary.highlights.1",
        "help.marketing.campaigns.anniversary.highlights.2",
        "help.marketing.campaigns.anniversary.highlights.3",
        "help.marketing.campaigns.anniversary.highlights.4",
        "help.marketing.campaigns.anniversary.highlights.5",
      ],
      bestUseKey: "help.marketing.campaigns.anniversary.bestUse",
    },
  ];

  const optionalCampaigns = [
    {
      key: "newService",
      title: t("help.marketing.campaigns.newService.title"),
      goalKey: "help.marketing.campaigns.newService.goal",
      highlightKeys: [
        "help.marketing.campaigns.newService.highlights.0",
        "help.marketing.campaigns.newService.highlights.1",
      ],
      noteKey: "help.marketing.campaigns.newService.note",
    },
    {
      key: "noShow",
      title: t("help.marketing.campaigns.noShow.title"),
      goalKey: "help.marketing.campaigns.noShow.goal",
      highlightKeys: [
        "help.marketing.campaigns.noShow.highlights.0",
        "help.marketing.campaigns.noShow.highlights.1",
      ],
      noteKey: null,
    },
    {
      key: "addon",
      title: t("help.marketing.campaigns.addon.title"),
      goalKey: "help.marketing.campaigns.addon.goal",
      highlightKeys: [
        "help.marketing.campaigns.addon.highlights.0",
        "help.marketing.campaigns.addon.highlights.1",
      ],
      noteKey: "help.marketing.campaigns.addon.note",
    },
  ];

  const managedScenarioSteps = [
    "The manager chooses a campaign type.",
    "Schedulaa checks the audience server-side.",
    "The page may show 2,000 total clients, 1,842 eligible, 37 manually excluded, and 1,805 selected to receive the campaign.",
    "If the company maximum recipients per campaign is lower than 1,805, the system prevents sending until the audience is reduced or split into multiple campaigns.",
    "The page calculates the required credits for the final selected audience.",
    "If credits are insufficient, no campaign starts and no partial emails are sent.",
    "The manager buys a credit pack when needed.",
    "Returning from Stripe does not automatically send the campaign.",
    "Credits appear only after payment confirmation is processed.",
    "The manager reviews the campaign again and confirms Send.",
    "The complete required credit amount is reserved before sending begins.",
    "Sending continues gradually in the background.",
    "The manager may leave the page and return later to view progress.",
    "Accepted emails consume credits.",
    "Unsent or terminally rejected emails release their reserved credits.",
    "Sent emails are never resent merely because more credits were purchased.",
  ];

  const managedVsByo = [
    {
      title: "Managed by Schedulaa",
      bullets: [
        "No SendGrid setup required.",
        "Purchase prepaid email credits.",
        "Schedulaa manages sending, pacing, retries, and delivery events.",
        "One provider-accepted recipient uses one credit.",
        "Buy email credits appears only for eligible managed companies.",
      ],
    },
    {
      title: "Your own SendGrid connection",
      bullets: [
        "Connect and activate your own SendGrid account.",
        "Pay SendGrid directly.",
        "No Schedulaa email credits are required.",
        "Campaigns still use the same Review and Confirm workflow.",
      ],
    },
  ];

  const practicalExamples = [
    {
      title: "Enough credits",
      body: "850 recipients selected, 1,200 credits available, 850 credits reserved, and an estimated balance after sending of 350. The manager confirms and sending begins.",
    },
    {
      title: "Not enough credits",
      body: "920 recipients selected, 499 credits available, and 421 more credits required. Send campaign remains disabled. The manager purchases credits, then reviews and confirms the campaign manually.",
    },
    {
      title: "Cancel during sending",
      body: "600 emails have already been accepted and 320 are still waiting. The manager cancels the remaining emails. Accepted emails remain sent, consumed credits remain consumed, and reserved credits for the 320 unsent emails are returned.",
    },
  ];

  const statusItems = [
    "Draft",
    "Queued",
    "Sending",
    "Temporarily deferred",
    "Paused",
    "Completed",
    "Failed",
    "Cancelled",
  ];

  const creditItems = [
    "Available credits: ready to use.",
    "Reserved credits: held for active campaigns.",
    "Used credits: consumed after provider acceptance.",
    "Released credits: returned because an email was not accepted or remained unsent after cancellation.",
    "Purchased credits currently do not expire.",
    "Purchasing credits does not automatically send or resume a campaign.",
  ];

  const faqItems = [
    {
      question: "Why is Buy email credits not visible?",
      answer: "It appears only when Managed by Schedulaa and credit purchasing are enabled for your company.",
    },
    {
      question: "Why is the eligible count lower than my client count?",
      answer: "Some clients may have invalid email addresses, duplicates, unsubscribed, suppressed, filtered, or manually excluded.",
    },
    {
      question: "Can I send only to certain clients?",
      answer: "Yes. Use campaign filters, Selected only, or exclude individual clients during Review.",
    },
    {
      question: "Will 1,000 emails be sent immediately?",
      answer: "No. They are sent gradually in the background according to safe delivery limits.",
    },
    {
      question: "Can I close the page after sending?",
      answer: "Yes. Sending continues in the background.",
    },
    {
      question: "What happens if I do not have enough credits?",
      answer: "Nothing is sent. Purchase credits, wait for them to appear, then confirm the campaign manually.",
    },
    {
      question: "Does buying credits automatically send my campaign?",
      answer: "No.",
    },
    {
      question: "Are already sent emails sent again after I buy credits?",
      answer: "No.",
    },
    {
      question: "What happens if I cancel a campaign?",
      answer: "Only remaining unsent emails are cancelled. Their reserved credits are returned. Sent emails cannot be recalled.",
    },
    {
      question: "What happens if an email fails?",
      answer: "An email accepted by the provider uses a credit. A terminal failure before acceptance releases its reserved credit.",
    },
    {
      question: "Can I pause and resume?",
      answer: "Yes. Pausing stops new unsent emails. Resuming continues only the remaining emails.",
    },
    {
      question: "Do credits expire?",
      answer: "Purchased credits currently do not expire.",
    },
    {
      question: "What is the difference between Managed by Schedulaa and my own SendGrid?",
      answer: "Managed uses Schedulaa credits and infrastructure. BYO uses the tenant’s SendGrid account and SendGrid billing.",
    },
    {
      question: "Why do open and click analytics not appear?",
      answer: "They appear only when those analytics are enabled for the managed email service.",
    },
    {
      question: "Can I send myself a test first?",
      answer: "Yes. Use Send test to myself in Campaign Review. The test sends only one email to your manager email and does not send the full campaign.",
    },
    {
      question: "Can I reuse a previous campaign?",
      answer: "Yes. Use Duplicate campaign in Recent marketing campaigns. It creates a new draft and does not copy recipients or credit usage.",
    },
  ];

  const renderRichList = (keys) => (
    <ul>
      {keys.map((itemKey) => (
        <li key={itemKey}>
          <Trans i18nKey={itemKey} components={richComponents} />
        </li>
      ))}
    </ul>
  );

  return (
    <Box
      sx={{
        width: 720,
        maxWidth: "min(92vw, 820px)",
        height: "100vh",
        p: 3,
        overflowY: "auto",
      }}
    >
      <Typography variant="h5" gutterBottom>{t("help.marketing.title")}</Typography>
      <Typography variant="body1" gutterBottom>{t("help.marketing.intro")}</Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>How it works in real life</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Create the campaign, review the audience and credits, confirm once, then leave the page. Sending continues in the background.
      </Alert>
      <Typography variant="body2" gutterBottom>
        Example: a company has 2,000 clients and sends through <strong>Managed by Schedulaa</strong>.
      </Typography>
      <ol>
        {managedScenarioSteps.map((step) => (
          <li key={step}>
            <Typography variant="body2">{step}</Typography>
          </li>
        ))}
      </ol>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Link component="button" variant="body2" onClick={onClose}>Create campaign</Link>
        <Link component="button" variant="body2" onClick={onClose}>Buy email credits</Link>
        <Link component="button" variant="body2" onClick={onClose}>Recent marketing campaigns</Link>
      </Stack>

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Managed by Schedulaa vs your own SendGrid</Typography>
      <Typography variant="body2" gutterBottom>
        Only one delivery method is active for a company at a time.
      </Typography>
      <Stack spacing={2} sx={{ mb: 2 }}>
        {managedVsByo.map((mode) => (
          <Box key={mode.title} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>{mode.title}</Typography>
            <ul>
              {mode.bullets.map((bullet) => (
                <li key={bullet}>
                  <Typography variant="body2">{bullet}</Typography>
                </li>
              ))}
            </ul>
          </Box>
        ))}
      </Stack>

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Practical examples</Typography>
      <Stack spacing={2} sx={{ mb: 2 }}>
        {practicalExamples.map((example) => (
          <Alert key={example.title} severity="success" sx={{ alignItems: "flex-start" }}>
            <Typography variant="subtitle2" gutterBottom>{example.title}</Typography>
            <Typography variant="body2">{example.body}</Typography>
          </Alert>
        ))}
      </Stack>

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Large audiences</Typography>
      <ul>
        <li><Typography variant="body2">Recipients are shown in pages, not one huge list.</Typography></li>
        <li><Typography variant="body2"><strong>All eligible</strong> selects the complete eligible audience without loading every row.</Typography></li>
        <li><Typography variant="body2">Individual clients may be excluded across different pages.</Typography></li>
        <li><Typography variant="body2"><strong>Selected only</strong> sends only to explicitly selected clients.</Typography></li>
        <li><Typography variant="body2">Search and filters do not bypass eligibility rules.</Typography></li>
        <li><Typography variant="body2">Schedulaa recalculates the final selected count and required credits server-side.</Typography></li>
      </ul>
      <Typography variant="body2" gutterBottom>
        Total clients and eligible clients may differ because of missing or invalid email, duplicate email, unsubscribe, suppression, campaign filters, or manually excluded recipients.
      </Typography>

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Background sending</Typography>
      <ul>
        <li><Typography variant="body2">Campaigns do not necessarily send all emails instantly.</Typography></li>
        <li><Typography variant="body2">Schedulaa sends gradually to protect delivery quality.</Typography></li>
        <li><Typography variant="body2">The estimated duration appears before confirmation.</Typography></li>
        <li><Typography variant="body2">You may safely close the page after sending.</Typography></li>
        <li><Typography variant="body2">Temporary deferral does not mean failure.</Typography></li>
        <li><Typography variant="body2">Status and totals update as sending progresses.</Typography></li>
      </ul>
      <Typography variant="body2" gutterBottom>
        Statuses: {statusItems.join(", ")}.
      </Typography>

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Credits</Typography>
      <ul>
        {creditItems.map((item) => (
          <li key={item}>
            <Typography variant="body2">{item}</Typography>
          </li>
        ))}
      </ul>

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Email branding</Typography>
      <Typography variant="body2" gutterBottom>
        Campaign emails reuse your saved Company Profile details instead of asking you to re-enter them each time. Schedulaa pulls the company name, logo, address, phone, website, contact email, and brand color from the same profile your public site already uses.
      </Typography>
      <ul>
        <li><Typography variant="body2">Use the <strong>Email branding</strong> section in Campaigns to choose independently whether the company name, logo, tagline, address, phone, website, support email, and business number appear in marketing emails.</Typography></li>
        <li><Typography variant="body2">Hiding a detail in Campaigns does not delete it from Company Profile.</Typography></li>
        <li><Typography variant="body2">Support email can be overridden for campaign footers. If you leave it blank, Schedulaa falls back to the contact email saved in Company Profile.</Typography></li>
        <li><Typography variant="body2">Some email clients hide images by default. The email still renders cleanly without a broken logo block.</Typography></li>
        <li><Typography variant="body2">The unsubscribe link remains included automatically, and the plain-text fallback remains available.</Typography></li>
      </ul>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/manager/dashboard?view=company-profile" variant="body2" onClick={onClose}>
          Edit Company Profile
        </Link>
      </Stack>

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Your own SendGrid connection</Typography>
      <Typography variant="body2" gutterBottom>
        If your company uses its own SendGrid connection, keep following the provider setup steps below. Your business pays SendGrid directly, and Schedulaa uses your configured sender identity and limits for campaign delivery.
      </Typography>
      <ol>
        <li><Typography variant="body2">Create or log in to your SendGrid account in Twilio SendGrid.</Typography></li>
        <li><Typography variant="body2">In SendGrid, go to <strong>Settings</strong> → <strong>API Keys</strong>, create a new API key, and give it Mail Send access.</Typography></li>
        <li><Typography variant="body2">Copy that API key and paste it into the <strong>SendGrid API key</strong> field in Schedulaa.</Typography></li>
        <li><Typography variant="body2">Fill in <strong>From email</strong>, <strong>From name</strong>, and optional <strong>Reply-to email</strong>.</Typography></li>
        <li><Typography variant="body2">Click <strong>Save</strong>, then use <strong>Test send</strong> to confirm the provider works.</Typography></li>
        <li><Typography variant="body2">After the test email arrives successfully, click <strong>Activate</strong>. Until you activate it, live campaign sending stays disabled.</Typography></li>
      </ol>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.customize.title")}</Typography>
      <Typography variant="body2" gutterBottom>{t("help.marketing.customize.description")}</Typography>
      {customizeFields.length > 0 && (
        <ul>
          {customizeFields.map((field, idx) => (
            <li key={idx}>{field}</li>
          ))}
        </ul>
      )}
      <Typography variant="body2" gutterBottom>{t("help.marketing.customize.note")}</Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.primaryTitle")}</Typography>
      {primaryCampaigns.map((campaign) => (
        <Box key={campaign.key} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>{campaign.title}</Typography>
          <Typography variant="body2" gutterBottom>
            <strong>{t("help.marketing.labels.goal")}</strong>{" "}
            <Trans i18nKey={campaign.goalKey} components={richComponents} />
          </Typography>
          {campaign.audienceKeys.length > 0 && (
            <>
              <Typography variant="body2" gutterBottom>
                <strong>{t("help.marketing.labels.audience")}</strong>
              </Typography>
              {renderRichList(campaign.audienceKeys)}
            </>
          )}
          <Typography variant="body2" gutterBottom>
            <strong>{t("help.marketing.labels.highlights")}</strong>
          </Typography>
          {renderRichList(campaign.highlightKeys)}
          <Typography variant="body2" gutterBottom>
            <em>{t("help.marketing.labels.bestUse")}</em>{" "}
            <Trans i18nKey={campaign.bestUseKey} components={richComponents} />
          </Typography>
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.optionalTitle")}</Typography>
      {optionalCampaigns.map((campaign) => (
        <Box key={campaign.key} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>{campaign.title}</Typography>
          <Typography variant="body2" gutterBottom>
            <strong>{t("help.marketing.labels.goal")}</strong>{" "}
            <Trans i18nKey={campaign.goalKey} components={richComponents} />
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>{t("help.marketing.labels.highlights")}</strong>
          </Typography>
          {renderRichList(campaign.highlightKeys)}
          {campaign.noteKey && (
            <Typography variant="body2" gutterBottom>
              <Trans i18nKey={campaign.noteKey} components={richComponents} />
            </Typography>
          )}
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>Coupons, expiry, links, and tracking</Typography>
      <ul>
        <li><Typography variant="body2">Coupons and expiry fields remain available when a campaign type supports them.</Typography></li>
        <li><Typography variant="body2">CTA links can point to a page on your site or a full URL.</Typography></li>
        <li><Typography variant="body2">UTM tracking is appended automatically so campaign traffic can be attributed correctly.</Typography></li>
        <li><Typography variant="body2">Audience filters help narrow the campaign before Review, but the final audience is still recalculated server-side.</Typography></li>
        <li><Typography variant="body2">Company Profile branding stays reusable across all eight campaign types.</Typography></li>
      </ul>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>FAQ</Typography>
      {faqItems.map((item) => (
        <Accordion key={item.question} disableGutters sx={{ boxShadow: "none", borderTop: "1px solid", borderColor: "divider" }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">{item.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">{item.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      <Box textAlign="center" sx={{ mt: 3, mb: 1 }}>
        <Button onClick={onClose} variant="contained">{t("buttons.closeGuide")}</Button>
      </Box>

      <Typography variant="caption" color="text.secondary">
        {t("help.marketing.editorTip")}
      </Typography>
    </Box>
  );
}
