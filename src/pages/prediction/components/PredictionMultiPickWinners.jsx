import React from "react";
import { Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import PredictionEmptyState from "./PredictionEmptyState";
import { formatViewerDateTimeLabel } from "../predictionViewUtils";

export default function PredictionMultiPickWinners({ items = [] }) {
  const { t } = useTranslation();

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={1.5}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t("prediction.multipick.winners.title", "Recent winners")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.multipick.winners.subtitle", "Top players are featured after scoring. No prize draw is attached to Multi-Pick in this MVP.")}
        </Typography>

        {!items.length ? (
          <PredictionEmptyState
            title={t("prediction.multipick.winners.empty.title", "No Multi-Pick winners yet")}
            body={t("prediction.multipick.winners.empty.body", "Published winners will appear here after a block is scored and published.")}
          />
        ) : (
          <Stack spacing={1.5}>
            {items.map((item) => (
              <Paper key={`multipick-winners-${item.challenge?.id || item.challenge?.title}`} variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={1}>
                  <Stack spacing={0.35}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {item.challenge?.title || t("prediction.multipick.winners.challengeFallback", "Published block")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.challenge?.ends_at_utc
                        ? t("prediction.multipick.winners.publishedAt", {
                            value: formatViewerDateTimeLabel(item.challenge.ends_at_utc),
                            defaultValue: "Latest block end: {{value}}",
                          })
                        : t("prediction.multipick.winners.latest", "Latest published winners")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.participant_count > 0
                        ? t("prediction.multipick.winners.participants", {
                            count: item.participant_count,
                            defaultValue: "Top players from this block · {{count}} players scored",
                          })
                        : t("prediction.multipick.winners.participantsFallback", "Top players from this block")}
                    </Typography>
                  </Stack>
                  <Stack spacing={0.8}>
                    {(item.top || []).slice(0, 5).map((row) => (
                      <Typography key={`multipick-winner-${item.challenge?.id}-${row.recruiter_id}`} variant="body2" color="text.secondary">
                        {t("prediction.multipick.winners.row", {
                          rank: row.rank,
                          emoji: row.emoji_avatar ? `${row.emoji_avatar} ` : "",
                          name: row.display_name,
                          cardNumber: row.card_number,
                          correctCount: row.correct_count,
                          totalMatches: item.challenge?.match_count || 0,
                          defaultValue: "#{{rank}} {{emoji}}{{name}} · Best card {{cardNumber}} · {{correctCount}}/{{totalMatches}} correct",
                        })}
                      </Typography>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
