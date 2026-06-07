import React, { useMemo, useState } from "react";
import { Alert, Button, Paper, Radio, RadioGroup, FormControlLabel, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { saveDailyBonusAnswer } from "../predictionApi";
import PredictionEmptyState from "./PredictionEmptyState";

export default function PredictionDailyBonusCard({ data, onSaved }) {
  const { t } = useTranslation();
  const question = data?.question;
  const myAnswer = data?.my_answer;
  const isLocked = data?.is_locked;
  const [selected, setSelected] = useState(myAnswer?.selected_option_key || "");
  const [state, setState] = useState({ saving: false, error: "", success: "" });

  React.useEffect(() => {
    setSelected(myAnswer?.selected_option_key || "");
  }, [myAnswer?.selected_option_key, question?.id]);

  const correctLabels = useMemo(() => {
    if (!question?.correct_option_keys_json?.length) return [];
    const byKey = new Map((question.options_json || []).map((option) => [option.key, option.label]));
    return question.correct_option_keys_json.map((key) => byKey.get(key) || key);
  }, [question]);

  if (!question) {
    return (
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <PredictionEmptyState
          title={t("prediction.dailyBonus.title", "Daily Bonus")}
          body={t("prediction.dailyBonus.empty", "No daily bonus question is open for this Challenge day UTC yet.")}
        />
      </Paper>
    );
  }

  const handleSave = async () => {
    setState({ saving: true, error: "", success: "" });
    try {
      await saveDailyBonusAnswer({ questionId: question.id, selectedOptionKey: selected });
      setState({ saving: false, error: "", success: t("prediction.dailyBonus.success.saved", "Daily bonus answer saved.") });
      onSaved?.();
    } catch (error) {
      setState({ saving: false, error: error?.response?.data?.error || error?.message || t("prediction.dailyBonus.errors.save", "Failed to save daily bonus answer."), success: "" });
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={1.5}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{t("prediction.dailyBonus.title", "Daily Bonus")}</Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{question.title}</Typography>
        {question.description ? <Typography variant="body2" color="text.secondary">{question.description}</Typography> : null}
        {state.error ? <Alert severity="error">{state.error}</Alert> : null}
        {state.success ? <Alert severity="success">{state.success}</Alert> : null}
        <RadioGroup value={selected} onChange={(e) => setSelected(e.target.value)}>
          {(question.options_json || []).map((option) => (
            <FormControlLabel key={option.key} value={option.key} control={<Radio />} label={option.label} disabled={isLocked || question.status === "scored"} />
          ))}
        </RadioGroup>
        {question.status === "scored" ? (
          <Typography variant="body2" color="text.secondary">
            {correctLabels.length > 1
              ? t("prediction.dailyBonus.correctPlural", {
                  labels: correctLabels.join(", "),
                  points: myAnswer?.points_awarded ?? 0,
                  defaultValue: "Correct answers: {{labels}}. You earned {{points}} daily bonus point(s).",
                })
              : t("prediction.dailyBonus.correctSingle", {
                  labels: correctLabels.join(", "),
                  points: myAnswer?.points_awarded ?? 0,
                  defaultValue: "Correct answer: {{labels}}. You earned {{points}} daily bonus point(s).",
                })}
          </Typography>
        ) : null}
        {isLocked && question.status !== "scored" ? <Typography variant="body2" color="text.secondary">{t("prediction.dailyBonus.locked", "Daily bonus is locked for this Challenge day.")}</Typography> : null}
        {!isLocked && question.status !== "scored" ? (
          <Button variant="contained" onClick={handleSave} disabled={!selected || state.saving}>
            {myAnswer ? t("prediction.dailyBonus.actions.update", "Update Answer") : t("prediction.dailyBonus.actions.submit", "Submit Answer")}
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
