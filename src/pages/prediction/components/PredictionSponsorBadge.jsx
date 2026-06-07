import React from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function PredictionSponsorBadge({ sponsors = [] }) {
  const { t } = useTranslation();
  if (!sponsors.length) return null;

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t("prediction.prizes.sponsors.title", "Sponsored by")}
        </Typography>
        {sponsors.map((sponsor, index) => (
          <Stack
            key={`${sponsor.name || "sponsor"}-${index}`}
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Typography variant="body2" color="text.secondary">
              {sponsor.name}
              {sponsor.contribution_label ? ` · ${sponsor.contribution_label}` : ""}
            </Typography>
            {sponsor.website_url ? (
              <Button size="small" variant="outlined" component="a" href={sponsor.website_url} target="_blank" rel="noreferrer">
                {t("prediction.prizes.sponsors.visit", "Visit Sponsor")}
              </Button>
            ) : null}
            {sponsor.instagram_url ? (
              <Button size="small" variant="outlined" component="a" href={sponsor.instagram_url} target="_blank" rel="noreferrer">
                {t("prediction.prizes.sponsors.follow", "Follow Sponsor")}
              </Button>
            ) : null}
          </Stack>
        ))}
        <Typography variant="caption" color="text.secondary">
          {t("prediction.prizes.sponsors.note", "Following is optional and not required to win.")}
        </Typography>
      </Stack>
    </Paper>
  );
}
