import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { getPredictionWeeklyMatches, savePredictionPicksBulk } from "./predictionApi";
import {
  formatWeekLabel,
  getWeekHelperLabelT,
} from "./predictionViewUtils";
import PredictionProgressBar from "./components/PredictionProgressBar";
import PredictionEmptyState from "./components/PredictionEmptyState";
import PredictionMatchPredictionCard from "./components/PredictionMatchPredictionCard";

const normalizeDrafts = (matches) =>
  Object.fromEntries(
    (matches || []).map((match) => [
      match.id,
      {
        home: match.my_pick ? String(match.my_pick.home_score_predicted ?? "") : "",
        away: match.my_pick ? String(match.my_pick.away_score_predicted ?? "") : "",
      },
    ])
  );

const isDigitsOrEmpty = (value) => value === "" || /^\d{0,2}$/.test(value);

const draftDiffersFromSaved = (draft, match) => {
  const savedHome = match.my_pick ? String(match.my_pick.home_score_predicted ?? "") : "";
  const savedAway = match.my_pick ? String(match.my_pick.away_score_predicted ?? "") : "";
  return draft.home !== savedHome || draft.away !== savedAway;
};

const PredictionWeeklyPage = ({ selectedWeekKey, onSelectedWeekKeyChange }) => {
  const { t } = useTranslation();
  const [weekKey, setWeekKey] = useState(selectedWeekKey || "");
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [drafts, setDrafts] = useState({});
  const [flash, setFlash] = useState({ type: "", message: "", rejected: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedWeekKey && selectedWeekKey !== weekKey) {
      setWeekKey(selectedWeekKey);
    }
  }, [selectedWeekKey]);

  const load = async (requestedWeekKey = weekKey) => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await getPredictionWeeklyMatches({ weekKey: requestedWeekKey || undefined });
      const resolvedWeekKey = requestedWeekKey || data?.week_key || "";
      setWeekKey(resolvedWeekKey);
      onSelectedWeekKeyChange?.(resolvedWeekKey);
      setDrafts(normalizeDrafts(data?.matches || []));
      setState({ loading: false, error: "", data });
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.error || error?.message || t("prediction.weekly.errors.load", "Failed to load weekly matches."),
        data: null,
      });
    }
  };

  useEffect(() => {
    load(weekKey);
  }, [weekKey]);

  const matches = state.data?.matches || [];
  const progress = useMemo(() => {
    const savedCount = matches.filter((match) => match.my_pick).length;
    const completeDrafts = matches.filter((match) => {
      const draft = drafts[match.id] || { home: "", away: "" };
      return draft.home !== "" && draft.away !== "";
    }).length;
    return {
      savedCount,
      total: matches.length,
      displayCount: Math.max(savedCount, completeDrafts),
    };
  }, [matches, drafts]);

  const dirtyMatches = useMemo(
    () =>
      matches.filter((match) => {
        const draft = drafts[match.id] || { home: "", away: "" };
        return draftDiffersFromSaved(draft, match);
      }),
    [matches, drafts]
  );

  const handleDraftChange = (matchId, field, value) => {
    if (!isDigitsOrEmpty(value)) return;
    setDrafts((prev) => ({
      ...prev,
      [matchId]: {
        home: prev[matchId]?.home ?? "",
        away: prev[matchId]?.away ?? "",
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    const incompleteDirty = dirtyMatches.filter((match) => {
      const draft = drafts[match.id] || { home: "", away: "" };
      const anyValue = draft.home !== "" || draft.away !== "";
      const bothValues = draft.home !== "" && draft.away !== "";
      return anyValue && !bothValues;
    });
    if (incompleteDirty.length) {
      setFlash({
        type: "error",
        message: t("prediction.weekly.errors.completeBoth", "Complete both scores for any edited match before saving."),
        rejected: [],
      });
      return;
    }

    const picks = dirtyMatches
      .filter((match) => {
        const draft = drafts[match.id] || { home: "", away: "" };
        return draft.home !== "" && draft.away !== "";
      })
      .map((match) => ({
        match_id: match.id,
        home_score_predicted: Number(drafts[match.id].home),
        away_score_predicted: Number(drafts[match.id].away),
      }));

    if (!picks.length) {
      setFlash({
        type: "info",
        message: t("prediction.weekly.info.noChanges", "No completed changes to save for this week."),
        rejected: [],
      });
      return;
    }

    setSaving(true);
    try {
      const data = await savePredictionPicksBulk({ picks });
      const saveSummary = data.rejected_count
        ? t("prediction.weekly.success.savedWithRejected", {
            saved: data.saved_count,
            rejected: data.rejected_count,
            defaultValue: "{{saved}} pick(s) saved. {{rejected}} pick(s) were rejected.",
          })
        : t("prediction.weekly.success.savedOnly", {
            saved: data.saved_count,
            defaultValue: "{{saved}} pick(s) saved.",
          });
      setFlash({
        type: data.rejected_count ? "warning" : "success",
        message: saveSummary,
        rejected: data.rejected || [],
      });
      await load(weekKey);
    } catch (error) {
      setFlash({
        type: "error",
        message: error?.response?.data?.error || error?.message || t("prediction.weekly.errors.save", "Failed to save predictions."),
        rejected: [],
      });
    } finally {
      setSaving(false);
    }
  };

  if (state.loading) return <Skeleton variant="rounded" height={320} />;
  if (state.error) return <Alert severity="error">{state.error}</Alert>;

  const hasUnsavedChanges = dirtyMatches.length > 0;

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t("prediction.weekly.title", "Weekly Challenge")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.weekly.subtitle", "Predict match scores before they lock. You can save one match or save the full week at once.")}
        </Typography>
      </Stack>

      {flash.message ? (
        <Alert severity={flash.type || "info"}>
          <Stack spacing={0.5}>
            <Typography variant="body2">{flash.message}</Typography>
            {flash.rejected?.length ? (
              <Typography variant="caption">
                {t("prediction.weekly.rejected", "Rejected")}: {flash.rejected.map((item) => `#${item.match_id} ${item.reason}`).join(" | ")}
              </Typography>
            ) : null}
          </Stack>
        </Alert>
      ) : null}

      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "center" }}>
          <Stack spacing={0.5}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {t("prediction.weekly.progressTitle", { count: progress.displayCount, total: progress.total, defaultValue: "You predicted {{count}} of {{total}} matches this week" })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasUnsavedChanges
                ? t("prediction.weekly.unsaved", "You have unsaved prediction changes.")
                : t("prediction.weekly.saved", "All visible changes are saved.")}
            </Typography>
            {getWeekHelperLabelT(weekKey || state.data?.week_key, t) ? (
              <Typography variant="caption" color="text.secondary">
                {getWeekHelperLabelT(weekKey || state.data?.week_key, t)}
              </Typography>
            ) : null}
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              select
              label={t("prediction.filters.week", "Week")}
              size="small"
              value={weekKey || state.data?.week_key || ""}
              onChange={(event) => {
                setFlash({ type: "", message: "", rejected: [] });
                setWeekKey(event.target.value);
                onSelectedWeekKeyChange?.(event.target.value);
              }}
              sx={{ minWidth: { md: 240 }, width: { xs: "100%", sm: 240 } }}
            >
              {(state.data?.available_week_keys || []).map((key) => (
                <MenuItem key={key} value={key}>
                  {formatWeekLabel(key)}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" size="large" disabled={saving} onClick={handleSaveAll} sx={{ width: { xs: "100%", sm: "auto" } }}>
              {t("prediction.actions.saveAllPredictions", "Save All Predictions")}
            </Button>
          </Stack>
        </Stack>
        <Stack sx={{ mt: 2 }}>
          <PredictionProgressBar
            current={progress.displayCount}
            target={progress.total}
            label={t("prediction.weekly.completionLabel", "Weekly completion")}
            helper={t("prediction.weekly.completionHelper", "Complete this week’s predictions before matches lock.")}
            tone="primary"
          />
        </Stack>
      </Paper>

      {matches.length ? (
        matches.map((match) => (
          <PredictionMatchPredictionCard
            key={match.id}
            match={match}
            draft={drafts[match.id] || { home: "", away: "" }}
            onDraftChange={handleDraftChange}
            serverNowUtc={state.data?.server_now_utc}
            mode="weekly"
            hasUnsavedChanges={dirtyMatches.some((dirtyMatch) => dirtyMatch.id === match.id)}
          />
        ))
      ) : (
        <PredictionEmptyState
          title={t("prediction.weekly.empty.title", "No matches in this week yet")}
          body={t("prediction.weekly.empty.body", "Fixtures will appear here once the campaign schedule is available.")}
        />
      )}
    </Stack>
  );
};

export default PredictionWeeklyPage;
