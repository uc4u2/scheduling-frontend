import React from "react";
import {
  Box,
  Button,
  Divider,
  Typography,
} from "@mui/material";
import { Trans, useTranslation } from "react-i18next";

export default function MarketingCampaignsGuide({ onClose }) {
  const { t } = useTranslation();
  const richComponents = { strong: <strong />, em: <em />, code: <code /> };

  const quickStartSteps = t("help.marketing.quickStartSteps", { returnObjects: true }) || [];
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

  const controls = [
    "discountPercent",
    "coupon",
    "expires",
    "links",
  ];

  const previewItems = [
    "preview",
    "dryRun",
    "send",
  ];

  const troubleshootingItems = [
    {
      key: "noRows",
      listKeys: [
        "help.marketing.troubleshooting.noRows.0",
        "help.marketing.troubleshooting.noRows.1",
        "help.marketing.troubleshooting.noRows.2",
        "help.marketing.troubleshooting.noRows.3",
        "help.marketing.troubleshooting.noRows.4",
        "help.marketing.troubleshooting.noRows.5",
      ],
    },
    {
      key: "sentZero",
      listKeys: [
        "help.marketing.troubleshooting.sentZero.0",
        "help.marketing.troubleshooting.sentZero.1",
      ],
    },
    { key: "duplicates" },
    { key: "coupon" },
    { key: "button" },
  ];

  const copyTips = [
    "vip",
    "winback",
    "skipped",
    "anniversary",
    "broadcast",
  ];

  const dataNotes = [
    "emailsOnly",
    "consent",
    "utm",
    "tenant",
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

      <Typography variant="h6" gutterBottom>Email delivery setup</Typography>
      <Typography variant="body2" gutterBottom>
        Schedulaa supports two marketing delivery modes. Some internal pilot companies use managed delivery through Schedulaa. Other companies keep using their own SendGrid connection. Transactional Schedulaa emails remain separate from campaign delivery.
      </Typography>
      <Typography variant="body2" gutterBottom>
        If your page shows <strong>Managed by Schedulaa</strong>, the platform chooses the delivery path automatically and shows the available credits, From name, and Reply-To in the campaign review step.
      </Typography>
      <Typography variant="body2" gutterBottom>
        If your page shows the SendGrid provider setup card instead, follow the steps below to enable live campaign sending with your own SendGrid account.
      </Typography>
      <ol>
        <li>
          <Typography variant="body2">
            Create or log in to your SendGrid account in Twilio SendGrid.
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            In SendGrid, go to <strong>Settings</strong> → <strong>API Keys</strong>, create a new API key, and give it Mail Send access.
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Copy that API key and paste it into the <strong>SendGrid API key</strong> field in Schedulaa.
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Fill in the sender details exactly how you want clients to see them:
            <strong> From email</strong>, <strong>From name</strong>, and optional <strong>Reply-to email</strong>.
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Click <strong>Save</strong>, then use <strong>Test send</strong> to confirm the provider works.
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            After the test email arrives successfully, click <strong>Activate</strong>. Until you activate it, live campaign sending stays disabled.
          </Typography>
        </li>
      </ol>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Recommended SendGrid setup: authenticate your sender domain in SendGrid before large campaigns so Gmail, Yahoo, and Outlook are less likely to spam your emails. Managed-delivery tenants do not need to enter a SendGrid API key in the campaign page.
      </Typography>

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Managed by Schedulaa</Typography>
      <Typography variant="body2" gutterBottom>
        When your company uses <strong>Managed by Schedulaa</strong>, you do not need to connect your own SendGrid account. Schedulaa manages the sending path, shows your available email credits, and calculates the required credits before you confirm the campaign.
      </Typography>
      <Typography variant="body2" gutterBottom>
        Normal workflow: choose the campaign, review the audience, buy credits if needed, confirm the send once, then leave the page. Sending continues gradually in the background and campaign progress updates over time.
      </Typography>
      <ul>
        <li><Typography variant="body2">Large audiences are reviewed in pages of recipients instead of loading every client at once.</Typography></li>
        <li><Typography variant="body2">All eligible recipients are selected by default, and you can exclude specific clients before sending.</Typography></li>
        <li><Typography variant="body2">The review step shows available credits, credits already reserved by active campaigns, the credits needed for the current campaign, and any missing amount before you can send.</Typography></li>
        <li><Typography variant="body2">A managed campaign must be fully covered before it can start. If you need more credits, Buy email credits first, then return to the review step and confirm the send.</Typography></li>
        <li><Typography variant="body2">Credits are reserved when the campaign is queued, consumed after provider acceptance, and released for recipients that are cancelled or rejected before sending.</Typography></li>
        <li><Typography variant="body2">If you return from Stripe, the campaign review stays in place, shows payment processing until the webhook confirms the grant, and never sends automatically.</Typography></li>
        <li><Typography variant="body2">If a payment is refunded or disputed, the purchase is placed under review instead of silently removing already-used credits.</Typography></li>
        <li><Typography variant="body2">You can pause, resume, or cancel remaining unsent emails later. Emails already sent cannot be recalled.</Typography></li>
      </ul>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Statuses are manager-friendly: <strong>Queued</strong>, <strong>Sending</strong>, <strong>Temporarily deferred</strong>, <strong>Paused</strong>, <strong>Completed</strong>, <strong>Failed</strong>, and <strong>Cancelled</strong>. Deferred sending simply means Schedulaa is pacing the campaign to protect delivery quality. Buying credits later does not automatically resume a paused campaign; a manager must review and resume the remaining emails explicitly.
      </Typography>

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Email branding</Typography>
      <Typography variant="body2" gutterBottom>
        Campaign emails reuse your saved Company Profile details instead of asking you to re-enter them each time. Schedulaa pulls the company name, logo, address, phone, website, contact email, and brand color from the same profile your public site already uses.
      </Typography>
      <ul>
        <li><Typography variant="body2">Use the <strong>Email branding</strong> section in Campaigns to choose independently whether the company name, logo, tagline, address, phone, website, support email, and business number appear in marketing emails.</Typography></li>
        <li><Typography variant="body2">Hiding a detail in Campaigns does not delete it from Company Profile. Company Profile remains the source of truth.</Typography></li>
        <li><Typography variant="body2">Support email can be overridden for campaign footers. If you leave it blank, Schedulaa falls back to the contact email saved in Company Profile.</Typography></li>
        <li><Typography variant="body2">Schedulaa may show a reminder when key sender details are hidden, but it does not force optional profile information into the email layout.</Typography></li>
        <li><Typography variant="body2">If a profile value is missing, the email hides that field cleanly. You will not see blank phone, website, address, or business-number placeholders.</Typography></li>
        <li><Typography variant="body2">The unsubscribe link remains included automatically, and the plain-text fallback remains available.</Typography></li>
        <li><Typography variant="body2">Some email clients hide images by default. When that happens, the email still renders cleanly without a broken logo block.</Typography></li>
      </ul>

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Your own SendGrid connection</Typography>
      <Typography variant="body2" gutterBottom>
        If your company uses its own SendGrid connection, keep following the provider setup steps below. Your business pays SendGrid directly, and Schedulaa uses your configured sender identity and limits for campaign delivery.
      </Typography>

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>{t("help.marketing.quickStartTitle")}</Typography>
      <ol>
        {quickStartSteps.map((step, idx) => (<li key={idx}>{step}</li>))}
      </ol>
      <Typography variant="body2" sx={{ mb: 2 }}>{t("help.marketing.quickStartTip")}</Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.customize.title")}</Typography>
      <Typography variant="body2" gutterBottom>{t("help.marketing.customize.description")}</Typography>
      {customizeFields.length > 0 && (
        <ul>
          {customizeFields.map((field, idx) => (<li key={idx}>{field}</li>))}
        </ul>
      )}
      <Typography variant="body2" gutterBottom>{t("help.marketing.customize.note")}</Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.primaryTitle")}</Typography>
      {primaryCampaigns.map((campaign) => (
        <Box key={campaign.key} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>{campaign.title}</Typography>
          <Typography variant="body2" gutterBottom>
            <strong>{t("help.marketing.labels.goal")}</strong> <Trans i18nKey={campaign.goalKey} components={richComponents} />
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
            <em>{t("help.marketing.labels.bestUse")}</em> <Trans i18nKey={campaign.bestUseKey} components={richComponents} />
          </Typography>
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.optionalTitle")}</Typography>
      {optionalCampaigns.map((campaign) => (
        <Box key={campaign.key} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>{campaign.title}</Typography>
          <Typography variant="body2" gutterBottom>
            <strong>{t("help.marketing.labels.goal")}</strong> <Trans i18nKey={campaign.goalKey} components={richComponents} />
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>{t("help.marketing.labels.highlights")}</strong>
          </Typography>
          {renderRichList(campaign.highlightKeys)}
          {campaign.noteKey && (
            <Typography variant="body2" gutterBottom><Trans i18nKey={campaign.noteKey} components={richComponents} /></Typography>
          )}
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.controls.title")}</Typography>
      {controls.map((itemKey) => (
        <Box key={itemKey} sx={{ mb: 2 }}>
          <Typography variant="subtitle2">{t(`help.marketing.controls.items.${itemKey}.label`)}</Typography>
          <Typography variant="body2" gutterBottom>
            <Trans i18nKey={`help.marketing.controls.items.${itemKey}.description`} components={richComponents} />
          </Typography>
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.preview.title")}</Typography>
      {previewItems.map((itemKey) => (
        <Box key={itemKey} sx={{ mb: 2 }}>
          <Typography variant="subtitle2">{t(`help.marketing.preview.items.${itemKey}.label`)}</Typography>
          <Typography variant="body2" gutterBottom>
            <Trans i18nKey={`help.marketing.preview.items.${itemKey}.description`} components={richComponents} />
          </Typography>
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.export.title")}</Typography>
      <Typography variant="body2" gutterBottom>
        <Trans i18nKey="help.marketing.export.description" components={richComponents} />
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.troubleshooting.title")}</Typography>
      {troubleshootingItems.map((item) => (
        <Box key={item.key} sx={{ mb: 2 }}>
          <Typography variant="subtitle2">{t(`help.marketing.troubleshooting.items.${item.key}.label`)}</Typography>
          <Typography variant="body2" gutterBottom>
            <Trans i18nKey={`help.marketing.troubleshooting.items.${item.key}.description`} components={richComponents} />
          </Typography>
          {item.listKeys && renderRichList(item.listKeys)}
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.copyTips.title")}</Typography>
      <ul>
        {copyTips.map((tipKey) => (
          <li key={tipKey}>
            <Trans i18nKey={`help.marketing.copyTips.items.${tipKey}`} components={richComponents} />
          </li>
        ))}
      </ul>
      <Typography variant="body2" gutterBottom>
        <Trans i18nKey="help.marketing.copyTips.subject" components={richComponents} />
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>{t("help.marketing.dataNotes.title")}</Typography>
      <ul>
        {dataNotes.map((noteKey) => (
          <li key={noteKey}>
            <Trans i18nKey={`help.marketing.dataNotes.items.${noteKey}`} components={richComponents} />
          </li>
        ))}
      </ul>

      <Box textAlign="center" sx={{ mt: 3, mb: 1 }}>
        <Button onClick={onClose} variant="contained">{t("buttons.closeGuide")}</Button>
      </Box>

      <Typography variant="caption" color="text.secondary">
        {t("help.marketing.editorTip")}
      </Typography>
    </Box>
  );
}
