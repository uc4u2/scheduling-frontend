import React from "react";
import { Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import PredictionEmptyState from "./PredictionEmptyState";
import { formatViewerDateTimeLabel } from "../predictionViewUtils";

export default function PredictionMultiPickLeaderboard({
  challenge,
  top = [],
  me = null,
  available = false,
  participantCount = 0,
}) {
  const { t } = useTranslation();
  const totalMatches = challenge?.match_count || 0;

  const renderRow = (row, highlight = false) => (
    <Paper
      key={`multipick-row-${row.recruiter_id}-${row.best_card_id || row.card_number || row.rank}`}
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: highlight ? "primary.main" : "divider",
        bgcolor: highlight ? "action.hover" : "background.paper",
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
        <Stack spacing={0.35}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            #{row.rank} {row.emoji_avatar ? `${row.emoji_avatar} ` : ""}{row.display_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("prediction.multipick.leaderboard.row.bestCard", {
              cardNumber: row.card_number,
              correctCount: row.correct_count,
              totalMatches,
              defaultValue: "Best card {{cardNumber}} · {{correctCount}}/{{totalMatches}} correct",
            })}
          </Typography>
          {row.favorite_team_name ? (
            <Typography variant="caption" color="text.secondary">
              {t("prediction.multipick.leaderboard.row.favoriteTeam", {
                team: row.favorite_team_name,
                defaultValue: "Favorite team: {{team}}",
              })}
            </Typography>
          ) : null}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {formatViewerDateTimeLabel(row.submitted_at_utc)}
        </Typography>
      </Stack>
    </Paper>
  );

  if (!available) {
    return (
      <PredictionEmptyState
        title={t("prediction.multipick.leaderboard.empty.title", "Leaderboard appears after scoring")}
        body={t("prediction.multipick.leaderboard.empty.body", "Top players will appear after match results are entered and the Multi-Pick block is scored.")}
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={1.25}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("prediction.multipick.leaderboard.top", "Top 5 players")}
          </Typography>
          {challenge?.title ? (
            <Typography variant="body2" color="text.secondary">
              {challenge.title}
            </Typography>
          ) : null}
          <Typography variant="body2" color="text.secondary">
            {t("prediction.multipick.leaderboard.explainer", "Ranking is based on each player's best card.")}
          </Typography>
          {participantCount > 0 ? (
            <Typography variant="caption" color="text.secondary">
              {t("prediction.multipick.leaderboard.participants", {
                count: participantCount,
                defaultValue: "{{count}} players scored",
              })}
            </Typography>
          ) : null}
          <Stack spacing={1.25}>
            {top.length ? (
              top.map((row) => renderRow(row, me?.recruiter_id === row.recruiter_id))
            ) : (
              <PredictionEmptyState
                title={t("prediction.multipick.leaderboard.none.title", "No scored cards yet")}
                body={t("prediction.multipick.leaderboard.none.body", "The leaderboard will update after submitted cards are scored.")}
              />
            )}
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.25 }}>
          {t("prediction.multipick.leaderboard.me", "My Best Card")}
        </Typography>
        {me ? (
          <Stack spacing={1.25}>
            <Typography variant="body2" color="text.secondary">
              {participantCount > 0
                ? t("prediction.multipick.leaderboard.meSummary", {
                    rank: me.rank,
                    count: participantCount,
                    cardNumber: me.card_number,
                    correctCount: me.correct_count,
                    totalMatches,
                    defaultValue: "Rank #{{rank}} out of {{count}} players · Best Card: Card {{cardNumber}} · Correct Picks: {{correctCount}}/{{totalMatches}}",
                  })
                : t("prediction.multipick.leaderboard.meSummaryNoCount", {
                    rank: me.rank,
                    cardNumber: me.card_number,
                    correctCount: me.correct_count,
                    totalMatches,
                    defaultValue: "Rank #{{rank}} · Best Card: Card {{cardNumber}} · Correct Picks: {{correctCount}}/{{totalMatches}}",
                  })}
            </Typography>
            {renderRow(me, true)}
          </Stack>
        ) : (
          <PredictionEmptyState
            title={t("prediction.multipick.leaderboard.meEmpty.title", "No best card yet")}
            body={t("prediction.multipick.leaderboard.meEmpty.body", "Your best Multi-Pick card will appear here after at least one submitted card is scored.")}
          />
        )}
      </Paper>
    </Stack>
  );
}
