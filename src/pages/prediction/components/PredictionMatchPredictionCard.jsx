import React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  getPredictionDerivedStatusLabel,
  getPredictionStatusLabel,
  predictionStatusChipColor,
} from "../predictionViewUtils";
import PredictionMatchHeader from "./PredictionMatchHeader";
import PredictionTeamBadge from "./PredictionTeamBadge";

export default function PredictionMatchPredictionCard({
  match,
  draft,
  onDraftChange,
  onOpenWeekly,
  serverNowUtc,
  mode = "weekly",
  upcomingMode = false,
  hasUnsavedChanges = false,
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const myPick = match?.my_pick || null;
  const derivedStatus = match?.derived_status || "pending";
  const isLocked = Boolean(match?.is_locked);
  const canEditScores = mode === "weekly" && !isLocked;
  const statusLabel = getPredictionStatusLabel({ match, myPick, derivedStatus, hasUnsavedChanges, t });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.12),
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.035)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
      }}
    >
      <Stack spacing={1.5}>
        <PredictionMatchHeader
          match={match}
          serverNowUtc={serverNowUtc}
          showVenue
          showWeek
          showCountdown
          compact={false}
          headerAside={<Chip label={getPredictionDerivedStatusLabel(derivedStatus, t)} color={predictionStatusChipColor(derivedStatus)} variant="outlined" />}
        />

        <Typography variant="body2" color="text.secondary">
          {statusLabel}
        </Typography>

        {mode === "weekly" ? (
          <Stack spacing={1.25}>
            <Stack
              sx={{
                p: { xs: 1.25, sm: 1.5 },
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <Stack
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto minmax(0, 1fr)" },
                  gap: { xs: 1.5, md: 3 },
                  alignItems: "center",
                }}
              >
                <Stack minWidth={0} sx={{ pr: { md: 1.5 } }}>
                  <PredictionTeamBadge
                    teamName={match?.home_team_name}
                    shortName={match?.home_team_code}
                    compact
                    align="left"
                  />
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    justifySelf: "center",
                    px: { md: 1 },
                    minWidth: { md: 240 },
                  }}
                >
                  <TextField
                    size="small"
                    label={t("prediction.weekly.score.home", "Home")}
                    value={draft?.home ?? ""}
                    onChange={(event) => onDraftChange?.(match.id, "home", event.target.value)}
                    disabled={!canEditScores}
                    inputProps={{ inputMode: "numeric", min: 0, max: 30 }}
                    sx={{ width: { xs: 104, sm: 96 } }}
                  />
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 700, minWidth: 12, textAlign: "center" }}>
                    -
                  </Typography>
                  <TextField
                    size="small"
                    label={t("prediction.weekly.score.away", "Away")}
                    value={draft?.away ?? ""}
                    onChange={(event) => onDraftChange?.(match.id, "away", event.target.value)}
                    disabled={!canEditScores}
                    inputProps={{ inputMode: "numeric", min: 0, max: 30 }}
                    sx={{ width: { xs: 104, sm: 96 } }}
                  />
                </Stack>
                <Stack minWidth={0} sx={{ pl: { md: 2.5 }, justifySelf: { md: "end" } }}>
                  <PredictionTeamBadge
                    teamName={match?.away_team_name}
                    shortName={match?.away_team_code}
                    compact
                    align="right"
                  />
                </Stack>
              </Stack>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
              sx={{
                px: 0.25,
                flexWrap: "wrap",
              }}
            >
              {derivedStatus === "scored" && myPick ? (
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {t("prediction.match.actualScore", "Actual score")}: {match?.home_score_actual}-{match?.away_score_actual}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("prediction.match.yourPrediction", "Your prediction")}: {myPick.home_score_predicted}-{myPick.away_score_predicted} · {myPick.points_awarded ?? 0} {t("prediction.points.short", "pts")}
                  </Typography>
                </Stack>
              ) : myPick ? (
                <Typography variant="body2" color="text.secondary">
                  {t("prediction.match.savedPrediction", "Saved prediction")}: {myPick.home_score_predicted}-{myPick.away_score_predicted}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("prediction.weekly.enterBoth", "Enter both scores to save this prediction.")}
                </Typography>
              )}

              {isLocked ? (
                <Typography variant="body2" color="text.secondary">
                  {t("prediction.status.locked", "Locked")}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        ) : (
          <>
            {derivedStatus === "scored" && myPick ? (
              <Typography variant="body2" color="text.secondary">
                {t("prediction.match.actualScore", "Actual score")}: {match?.home_score_actual}-{match?.away_score_actual} · {t("prediction.match.yourPrediction", "Your prediction")}: {myPick.home_score_predicted}-{myPick.away_score_predicted} · {myPick.points_awarded ?? 0} {t("prediction.points.short", "pts")}
              </Typography>
            ) : null}
            <Button variant="contained" onClick={() => onOpenWeekly?.(match.week_key)}>
              {upcomingMode
                ? (myPick && derivedStatus === "pending"
                  ? t("prediction.actions.editPrediction", "Edit Prediction")
                  : t("prediction.actions.preparePrediction", "Prepare Prediction"))
                : (myPick && derivedStatus === "pending"
                  ? t("prediction.actions.editPrediction", "Edit Prediction")
                  : t("prediction.actions.predict", "Predict"))}
            </Button>
          </>
        )}
      </Stack>
    </Paper>
  );
}
