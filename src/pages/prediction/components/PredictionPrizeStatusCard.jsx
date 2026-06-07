import React from "react";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import PredictionCountdownChip from "./PredictionCountdownChip";
import PredictionProgressBar from "./PredictionProgressBar";
import PredictionSponsorBadge from "./PredictionSponsorBadge";

export default function PredictionPrizeStatusCard({
  title,
  description,
  prizeLabel,
  statusLabel,
  statusTone = "default",
  progressRows = [],
  cutoffUtc,
  serverNowUtc,
  sponsors = [],
  publicNote,
  footer,
  ctaLabel,
  onCta,
}) {
  const { t } = useTranslation();
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={1.25}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Chip label={statusLabel} color={statusTone} size="small" />
        </Stack>

        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}

        {prizeLabel ? (
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {prizeLabel}
          </Typography>
        ) : null}

        {progressRows.map((row, index) => (
          typeof row === "string" ? (
            <Typography key={`${row}-${index}`} variant="body2" color="text.secondary">
              {row}
            </Typography>
          ) : (
            <PredictionProgressBar
              key={`${row.label}-${index}`}
              current={row.current}
              target={row.target}
              label={row.label}
              helper={row.helper}
              tone={row.tone}
              showNumbers={row.showNumbers}
            />
          )
        ))}

        {cutoffUtc ? (
          <PredictionCountdownChip
            targetUtc={cutoffUtc}
            serverNowUtc={serverNowUtc}
            prefix={t("prediction.prizes.cutoff", "Prize cutoff")}
            closedLabel={t("prediction.prizes.cutoffClosed", "Prize window closed")}
          />
        ) : null}

        {publicNote ? (
          <Typography variant="body2" color="text.secondary">
            {publicNote}
          </Typography>
        ) : null}

        <PredictionSponsorBadge sponsors={sponsors} />

        {footer ? (
          <Typography variant="caption" color="text.secondary">
            {footer}
          </Typography>
        ) : null}

        {ctaLabel && onCta ? (
          <Button variant="outlined" onClick={onCta}>
            {ctaLabel}
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
