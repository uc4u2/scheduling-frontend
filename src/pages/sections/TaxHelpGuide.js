// src/pages/sections/TaxHelpGuide.js
import React from "react";
import { Typography, Divider, Button, Alert, Box } from "@mui/material";
import { Trans, useTranslation } from "react-i18next";

export default function TaxHelpGuide({ onClose, onOpenStripe, pricesIncludeTax }) {
  const { t } = useTranslation();

  const priceToggleKey = pricesIncludeTax
    ? "settings.checkout.taxGuide.steps.app.pricesIncludeTax.on"
    : "settings.checkout.taxGuide.steps.app.pricesIncludeTax.off";

  return (
    <>
      <Typography variant="h5" gutterBottom>
        {t("settings.checkout.taxGuide.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t("settings.checkout.taxGuide.intro")}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        {t("settings.checkout.taxGuide.steps.app.heading")}
      </Typography>
      <ul>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.app.country"
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
        {t("settings.checkout.taxGuide.steps.connect.heading")}
      </Typography>
      <ul>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.connect.useButton"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.connect.ready"
            components={{ strong: <strong /> }}
          />
        </li>
      </ul>

      <Typography variant="h6" gutterBottom>
        {t("settings.checkout.taxGuide.steps.stripe.heading")}
      </Typography>
      <ul>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.stripe.openDashboard"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.stripe.navigate"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.stripe.origin"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.stripe.products"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.stripe.includeQuestion"
            components={{ strong: <strong /> }}
          />
        </li>
      </ul>

      <Typography variant="h6" gutterBottom>
        {t("settings.checkout.taxGuide.steps.registrations.heading")}
      </Typography>
      <ul>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.registrations.open"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.registrations.homeRegion"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.registrations.additionalRegions"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.steps.registrations.thresholds"
            components={{ strong: <strong /> }}
          />
        </li>
      </ul>

      <Alert severity="info" sx={{ my: 2 }}>
        <Trans
          i18nKey="settings.checkout.taxGuide.tip"
          components={{ strong: <strong />, em: <em /> }}
        />
      </Alert>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        {t("settings.checkout.taxGuide.faqs.title")}
      </Typography>
      <ul>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.faqs.usRegistration"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.faqs.receipts"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="settings.checkout.taxGuide.faqs.crossBorder"
            components={{ strong: <strong /> }}
          />
        </li>
      </ul>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <Button variant="contained" onClick={onOpenStripe}>
          {t("settings.checkout.taxGuide.buttons.openDashboard")}
        </Button>
        <Button variant="outlined" onClick={onClose}>
          {t("buttons.closeGuide")}
        </Button>
      </Box>
    </>
  );
}
