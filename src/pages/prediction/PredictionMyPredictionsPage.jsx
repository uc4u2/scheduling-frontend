import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { getMyPredictions } from "./predictionApi";
import {
  formatStageLabel,
  formatWeekLabel,
  getPredictionDerivedStatusLabel,
  predictionStatusChipColor,
} from "./predictionViewUtils";
import PredictionMatchHeader from "./components/PredictionMatchHeader";
import PredictionEmptyState from "./components/PredictionEmptyState";

const PredictionMyPredictionsPage = ({ onOpenWeekly }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState("all");
  const [filters, setFilters] = useState({ weekKey: "", stageKey: "" });
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    getMyPredictions({
      status,
      weekKey: filters.weekKey || undefined,
      stageKey: filters.stageKey || undefined,
    })
      .then((data) => {
        if (active) {
          setState({ loading: false, error: "", data });
        }
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            error: error?.response?.data?.error || error?.message || t("prediction.myPredictions.errors.load", "Failed to load saved predictions."),
            data: null,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [status, filters.weekKey, filters.stageKey]);

  if (state.loading) return <Skeleton variant="rounded" height={260} />;
  if (state.error) return <Alert severity="error">{state.error}</Alert>;

  const items = state.data?.items || [];
  const availableWeekKeys = state.data?.available_week_keys || [];
  const availableStageKeys = state.data?.available_stage_keys || [];

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t("prediction.myPredictions.title", "My Predictions")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.myPredictions.subtitle", "Review saved picks, lock state, and entered results as they become available.")}
        </Typography>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Tabs
          value={status}
          onChange={(_event, next) => setStatus(next)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="all" label={t("prediction.filters.all", "All")} />
          <Tab value="pending" label={t("prediction.status.pending", "Pending")} />
          <Tab value="locked" label={t("prediction.status.locked", "Locked")} />
          <Tab value="scored" label={t("prediction.status.scored", "Scored")} />
        </Tabs>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            label={t("prediction.filters.week", "Week")}
            value={filters.weekKey}
            onChange={(event) => setFilters((prev) => ({ ...prev, weekKey: event.target.value }))}
            sx={{ minWidth: { md: 220 }, width: { xs: "100%", md: "auto" } }}
          >
            <MenuItem value="">{t("prediction.filters.all", "All")}</MenuItem>
            {availableWeekKeys.map((key) => (
              <MenuItem key={key} value={key}>
                {formatWeekLabel(key)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t("prediction.filters.stage", "Stage")}
            value={filters.stageKey}
            onChange={(event) => setFilters((prev) => ({ ...prev, stageKey: event.target.value }))}
            sx={{ minWidth: { md: 220 }, width: { xs: "100%", md: "auto" } }}
          >
            <MenuItem value="">{t("prediction.filters.all", "All")}</MenuItem>
            {availableStageKeys.map((key) => (
              <MenuItem key={key} value={key}>
                {formatStageLabel(key)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {items.length ? (
        items.map(({ pick, match, derived_status: derivedStatus }) => (
          <Paper key={pick.id} elevation={0} sx={{ p: 2, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={1.25}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                <Stack spacing={0.5} flex={1} minWidth={0}>
                  <PredictionMatchHeader match={match} serverNowUtc={state.data?.server_now_utc} showVenue={false} showWeek showCountdown compact />
                </Stack>
                <Chip label={getPredictionDerivedStatusLabel(derivedStatus, t)} color={predictionStatusChipColor(derivedStatus)} variant="outlined" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {t("prediction.myPredictions.predictedScore", "Predicted score")}: {pick.home_score_predicted}-{pick.away_score_predicted}
              </Typography>
              {match.home_score_actual != null && match.away_score_actual != null ? (
                <Typography variant="body2" color="text.secondary">
                  {t("prediction.match.actualScore", "Actual score")}: {match.home_score_actual}-{match.away_score_actual}
                </Typography>
              ) : null}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {t("prediction.myPredictions.pointsAwarded", "Points awarded")}: {pick.points_awarded ?? 0}
                </Typography>
                {derivedStatus === "scored" ? <Chip size="small" color="success" label={`+${pick.points_awarded ?? 0} ${t("prediction.points.short", "pts")}`} /> : null}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                {derivedStatus === "pending" ? (
                  <Button variant="contained" onClick={() => onOpenWeekly?.(match.week_key)}>
                    {t("prediction.actions.editPrediction", "Edit Prediction")}
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        ))
      ) : (
        <PredictionEmptyState
          title={t("prediction.myPredictions.empty.title", "No predictions found")}
          body={t("prediction.myPredictions.empty.body", "Save predictions from Weekly Challenge to populate this view.")}
          actionLabel={t("prediction.tabs.weekly", "Weekly Challenge")}
          onAction={() => onOpenWeekly?.(filters.weekKey || state.data?.available_week_keys?.[0] || "")}
        />
      )}
    </Stack>
  );
};

export default PredictionMyPredictionsPage;
