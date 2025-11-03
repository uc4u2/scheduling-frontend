// src/pages/sections/TaxHelpGuide.js
import React from "react";
import { Typography, Divider, Button, Alert, Box } from "@mui/material";
import { Trans, useTranslation } from "react-i18next";

export default function TaxHelpGuide({
  onClose,
  onOpenStripe,
  pricesIncludeTax,
  translationBase = "settings.checkout",
}) {
  const { t } = useTranslation();

  const guideBase = `${translationBase}.taxGuide`;
  const priceToggleKey = pricesIncludeTax
    ? `${guideBase}.steps.app.pricesIncludeTax.on`
    : `${guideBase}.steps.app.pricesIncludeTax.off`;

  return (
    <>
      <Typography variant="h5" gutterBottom>
        {t(`${guideBase}.title`)}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t(`${guideBase}.intro`)}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        {t(`${guideBase}.steps.app.heading`)}
      </Typography>
      <ul>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.app.country`}
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey={priceToggleKey}
            components={{ strong: <strong />, em: <em /> }}
          />
        </li>
      </ul>

      <Typography variant="h6" gutterBottom>
        {t(`${guideBase}.steps.connect.heading`)}
      </Typography>
      <ul>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.connect.useButton`}
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.connect.ready`}
            components={{ strong: <strong /> }}
          />
        </li>
      </ul>

      <Typography variant="h6" gutterBottom>
        {t(`${guideBase}.steps.stripe.heading`)}
      </Typography>
      <ul>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.stripe.openDashboard`}
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.stripe.navigate`}
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.stripe.origin`}
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.stripe.products`}
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.stripe.includeQuestion`}
            components={{ strong: <strong /> }}
          />
        </li>
      </ul>

      <Typography variant="h6" gutterBottom>
        {t(`${guideBase}.steps.registrations.heading`)}
      </Typography>
      <ul>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.registrations.open`}
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.registrations.homeRegion`}
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.registrations.additionalRegions`}
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey={`${guideBase}.steps.registrations.thresholds`}
            components={{ strong: <strong /> }}
          />
        </li>
      </ul>

      <Alert severity="info" sx={{ my: 2 }}>
        <Trans
          i18nKey={`${guideBase}.tip`}
          components={{ strong: <strong />, em: <em /> }}
        />
      </Alert>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        {t(`${guideBase}.faqs.title`)}
      </Typography>
      <ul>
        <li>
          <Trans
            i18nKey={`${guideBase}.faqs.usRegistration`}
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey={`${guideBase}.faqs.receipts`}
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey={`${guideBase}.faqs.crossBorder`}
            components={{ strong: <strong /> }}
          />
        </li>
      </ul>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <Button variant="contained" onClick={onOpenStripe}>
          {t(`${guideBase}.buttons.openDashboard`)}
        </Button>
        <Button variant="outlined" onClick={onClose}>
          {t("buttons.closeGuide")}
        </Button>
      </Box>
    </>
  );
}
