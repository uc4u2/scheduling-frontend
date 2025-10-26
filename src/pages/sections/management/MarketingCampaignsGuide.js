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
