import React from "react";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getPredictionDerivedStatusLabel, getPredictionStatusLabel, predictionStatusChipColor } from "../predictionViewUtils";
import PredictionEmptyState from "./PredictionEmptyState";
import PredictionMatchHeader from "./PredictionMatchHeader";

export default function PredictionTodayMatchesCard({
  title = "Today's Matches",
  helperText = "",
  items = [],
  onOpenWeekly,
  emptyLabel = "No matches on this Challenge day UTC yet.",
  upcomingMode = false,
  serverNowUtc,
  emptyActionLabel,
  onEmptyAction,
}) {
  const { t } = useTranslation();
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>{title}</Typography>
      {helperText ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {helperText}
        </Typography>
      ) : null}
      <Stack spacing={1.25}>
        {items.length ? items.map(({ match, my_pick: myPick, derived_status: derivedStatus }) => (
          <Paper key={match.id} variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1}>
              <PredictionMatchHeader
                match={match}
                serverNowUtc={serverNowUtc}
                showVenue={false}
                showWeek={false}
                showCountdown
                compact
                headerAside={<Chip label={getPredictionDerivedStatusLabel(derivedStatus, t)} color={predictionStatusChipColor(derivedStatus)} variant="outlined" />}
              />
              <Typography variant="body2" color="text.secondary">
                {getPredictionStatusLabel({ match, myPick, derivedStatus, t })}
              </Typography>
              <Button variant="outlined" onClick={() => onOpenWeekly?.(match.week_key)}>
                {upcomingMode
                  ? (myPick && derivedStatus === "pending"
                    ? t("prediction.actions.editPrediction", "Edit Prediction")
                    : t("prediction.actions.preparePrediction", "Prepare Prediction"))
                  : (myPick && derivedStatus === "pending"
                    ? t("prediction.actions.editPrediction", "Edit Prediction")
                    : t("prediction.actions.predict", "Predict"))}
              </Button>
            </Stack>
          </Paper>
        )) : (
          <PredictionEmptyState
            title={title}
            body={emptyLabel}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        )}
      </Stack>
    </Paper>
  );
}
