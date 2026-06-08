import React, { useMemo, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import PredictionTeamBadge from "./PredictionTeamBadge";
import { formatViewerDateTimeLabel } from "../predictionViewUtils";

const outcomeOptions = ["home", "draw", "away"];

const outcomeButtonLabel = (key, t) => {
  switch (key) {
    case "home":
      return t("prediction.multipick.outcomes.home", "Home");
    case "draw":
      return t("prediction.multipick.outcomes.draw", "Draw");
    case "away":
      return t("prediction.multipick.outcomes.away", "Away");
    default:
      return key;
  }
};

const outcomeStatusLabel = (correct, t) => {
  if (correct === true) return t("prediction.multipick.status.correct", "Correct");
  if (correct === false) return t("prediction.multipick.status.wrong", "Wrong");
  return "";
};

const cardStatusLabel = (status, t) => {
  if (!status) return "";
  return t(`prediction.multipick.statusValues.${status}`, status);
};

export default function PredictionMultiPickCardEditor({
  card,
  cardNumber,
  matches = [],
  onSave,
  onCancel,
  readOnly = false,
  isNew = false,
  isBestCard = false,
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedOutcomes, setSelectedOutcomes] = useState(() => {
    const next = {};
    (card?.picks || []).forEach((pick) => {
      if (pick?.match_id) next[pick.match_id] = pick.predicted_outcome;
    });
    return next;
  });

  const picksByMatchId = useMemo(() => {
    const map = new Map();
    (card?.picks || []).forEach((pick) => map.set(pick.match_id, pick));
    return map;
  }, [card]);

  const isComplete = matches.length > 0 && matches.every((match) => selectedOutcomes[match.id]);

  const handleSave = async () => {
    if (!isComplete) {
      setError(t("prediction.multipick.card.complete", "Choose Home, Draw, or Away for every match before saving."));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        picks: matches.map((match) => ({
          match_id: match.id,
          predicted_outcome: selectedOutcomes[match.id],
        })),
      });
    } catch (saveError) {
      setError(
        saveError?.response?.data?.message ||
          saveError?.response?.data?.error ||
          saveError?.message ||
          t("prediction.multipick.card.saveError", "Unable to save this card.")
      );
    } finally {
      setSaving(false);
    }
  };

  const totalMatches = matches.length || (card?.picks || []).length || 0;

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
          <Stack spacing={0.35}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("prediction.multipick.card.title", { number: cardNumber, defaultValue: "Card {{number}}" })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("prediction.multipick.card.helper", "Pick Home, Draw, or Away. Your best card counts.")}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {isBestCard ? (
              <Chip size="small" color="primary" variant="filled" label={t("prediction.multipick.card.bestBadge", "Your best card")} />
            ) : null}
            {card?.status ? <Chip size="small" variant="outlined" label={cardStatusLabel(card.status, t)} /> : null}
            {card?.status === "scored" ? (
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={t("prediction.multipick.card.scored", {
                  count: card.correct_count || 0,
                  total: totalMatches,
                  points: card.score_points || 0,
                  defaultValue: "{{count}}/{{total}} correct · {{points}} pts",
                })}
              />
            ) : null}
            {readOnly ? <Chip size="small" color="warning" variant="outlined" label={t("prediction.multipick.card.locked", "This block is locked. Submitted cards are waiting for results and scoring.")} /> : null}
          </Stack>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack spacing={1.25}>
          {matches.map((match) => {
            const selected = selectedOutcomes[match.id] || "";
            const scoredPick = picksByMatchId.get(match.id);
            return (
              <Paper
                key={`multipick-card-${card?.id || "new"}-${match.id}`}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  borderColor: selected ? alpha(theme.palette.primary.main, 0.34) : "divider",
                  bgcolor: selected ? alpha(theme.palette.primary.main, 0.03) : "background.paper",
                }}
              >
                <Stack spacing={1}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between">
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <PredictionTeamBadge teamName={match.home_team_name} shortName={match.home_team_code} compact />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: "0.12em" }}>
                        VS
                      </Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <PredictionTeamBadge teamName={match.away_team_name} shortName={match.away_team_code} compact align="right" />
                      </Box>
                    </Stack>
                    <Stack spacing={0.35} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                      <Typography variant="caption" color="text.secondary">
                        {t("prediction.multipick.match.kickoff", { value: formatViewerDateTimeLabel(match.kickoff_at_utc), defaultValue: "Kickoff: {{value}}" })}
                      </Typography>
                      {scoredPick?.correct != null ? (
                        <Chip
                          size="small"
                          color={scoredPick.correct ? "success" : "default"}
                          variant="outlined"
                          label={outcomeStatusLabel(scoredPick.correct, t)}
                        />
                      ) : null}
                    </Stack>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    {outcomeOptions.map((option) => {
                      const isSelected = selected === option;
                      return (
                        <Button
                          key={`${match.id}-${option}`}
                          variant={isSelected ? "contained" : "outlined"}
                          color={isSelected ? "primary" : "inherit"}
                          disabled={readOnly}
                          onClick={() => setSelectedOutcomes((prev) => ({ ...prev, [match.id]: option }))}
                          sx={{ minWidth: { xs: "100%", sm: 108 } }}
                        >
                          {outcomeButtonLabel(option, t)}
                        </Button>
                      );
                    })}
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        {!readOnly ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {isNew
                ? t("prediction.multipick.actions.saveCard", "Save Card")
                : t("prediction.multipick.actions.updateCard", "Update Card")}
            </Button>
            {isNew && onCancel ? (
              <Button variant="outlined" onClick={onCancel} disabled={saving}>
                {t("prediction.multipick.actions.cancel", "Cancel")}
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
