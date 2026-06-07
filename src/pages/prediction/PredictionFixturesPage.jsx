import React, { useEffect, useState } from "react";
import {
  Alert,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { getPredictionFixtures } from "./predictionApi";
import {
  formatStageLabel,
  formatWeekLabel,
  getWeekHelperLabelT,
} from "./predictionViewUtils";
import PredictionEmptyState from "./components/PredictionEmptyState";
import PredictionMatchPredictionCard from "./components/PredictionMatchPredictionCard";

const PredictionFixturesPage = ({ onOpenWeekly }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    weekKey: "",
    stageKey: "",
    status: "",
    q: "",
  });
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    getPredictionFixtures({
      weekKey: filters.weekKey || undefined,
      stageKey: filters.stageKey || undefined,
      status: filters.status || undefined,
      q: filters.q || undefined,
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
            error: error?.response?.data?.error || error?.message || t("prediction.fixtures.errors.load", "Failed to load fixtures."),
            data: null,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [filters.weekKey, filters.stageKey, filters.status, filters.q]);

  if (state.loading) return <Skeleton variant="rounded" height={260} />;
  if (state.error) return <Alert severity="error">{state.error}</Alert>;

  const items = state.data?.items || [];
  const availableWeekKeys = state.data?.available_week_keys || [];
  const availableStageKeys = state.data?.available_stage_keys || [];

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t("prediction.fixtures.title", "Fixtures")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.fixtures.subtitle", "Browse upcoming matches, check your prediction status, and jump into the right weekly challenge.")}
        </Typography>
      </Stack>

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
          <TextField
            select
            label={t("prediction.filters.status", "Status")}
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            sx={{ minWidth: { md: 180 }, width: { xs: "100%", md: "auto" } }}
          >
            <MenuItem value="">{t("prediction.filters.all", "All")}</MenuItem>
            <MenuItem value="upcoming">{t("prediction.status.upcoming", "Upcoming")}</MenuItem>
            <MenuItem value="locked">{t("prediction.status.locked", "Locked")}</MenuItem>
            <MenuItem value="live">{t("prediction.status.live", "Live")}</MenuItem>
            <MenuItem value="finished">{t("prediction.status.finished", "Finished")}</MenuItem>
            <MenuItem value="scored">{t("prediction.status.scored", "Scored")}</MenuItem>
          </TextField>
          <TextField
            label={t("prediction.filters.search", "Search")}
            value={filters.q}
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            placeholder={t("prediction.fixtures.searchPlaceholder", "Team, venue, match #")}
            sx={{ minWidth: { md: 220 }, width: { xs: "100%", md: "auto" } }}
          />
        </Stack>
        {filters.weekKey && getWeekHelperLabelT(filters.weekKey, t) ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
            {getWeekHelperLabelT(filters.weekKey, t)}
          </Typography>
        ) : null}
      </Paper>

      {items.length ? (
        items.map(({ match, my_pick: myPick, derived_status: derivedStatus }) => (
          <PredictionMatchPredictionCard
            key={match.id}
            match={{ ...match, my_pick: myPick, derived_status: derivedStatus }}
            serverNowUtc={state.data?.server_now_utc}
            onOpenWeekly={onOpenWeekly}
            mode="fixtures"
            upcomingMode={match.week_key === "group_week_2" || match.week_key === "group_week_3"}
          />
        ))
      ) : (
        <PredictionEmptyState
          title={t("prediction.fixtures.empty.title", "No fixtures found")}
          body={t("prediction.fixtures.empty.body", "Try clearing filters or choosing another week.")}
          actionLabel={t("prediction.fixtures.empty.action", "Clear Filters")}
          onAction={() => setFilters({ weekKey: "", stageKey: "", status: "", q: "" })}
        />
      )}
    </Stack>
  );
};

export default PredictionFixturesPage;
