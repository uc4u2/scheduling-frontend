import React from "react";
import { Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import PredictionEmptyState from "./PredictionEmptyState";

export default function PredictionActivityFeed({ items = [] }) {
  const { t } = useTranslation();
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>{t("prediction.today.activity.title", "Activity Feed")}</Typography>
      <Stack spacing={1.25}>
        {items.length ? items.map((item, index) => (
          <Paper key={`${item.kind}-${index}`} variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
            <Typography variant="body2" color="text.secondary">{item.body}</Typography>
          </Paper>
        )) : (
          <PredictionEmptyState
            title={t("prediction.today.activity.empty.title", "No activity yet")}
            body={t("prediction.today.activity.empty.body", "Activity updates will appear here as the challenge moves closer to kickoff, scoring, prize windows, and published winners.")}
          />
        )}
      </Stack>
    </Paper>
  );
}
