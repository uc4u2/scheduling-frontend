import React from "react";
import { Chip, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import PredictionEmptyState from "./PredictionEmptyState";
import PredictionMatchHeader from "./PredictionMatchHeader";

export default function PredictionRecentResultsCard({ items = [] }) {
  const { t } = useTranslation();
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>{t("prediction.today.recent.title", "Latest Results")}</Typography>
      <Stack spacing={1.25}>
        {items.length ? items.map((row) => (
          <Paper key={`recent-${row.pick?.id || row.match?.id}`} variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={0.75}>
              <PredictionMatchHeader match={row.match} showVenue={false} showWeek={false} showCountdown={false} compact />
              <Typography variant="body2" color="text.secondary">
                {t("prediction.today.recent.actual", "Actual")}: {row.match?.home_score_actual}-{row.match?.away_score_actual} · {t("prediction.today.recent.yourPick", "Your pick")}: {row.pick?.home_score_predicted}-{row.pick?.away_score_predicted}
              </Typography>
              <Chip size="small" color="success" label={`+${row.points_awarded ?? 0} ${t("prediction.points.short", "pts")}`} sx={{ alignSelf: "flex-start" }} />
            </Stack>
          </Paper>
        )) : (
          <PredictionEmptyState
            title={t("prediction.today.recent.empty.title", "No results yet")}
            body={t("prediction.today.recent.empty.body", "Your recently scored predictions will appear here after match results are posted.")}
          />
        )}
      </Stack>
    </Paper>
  );
}
