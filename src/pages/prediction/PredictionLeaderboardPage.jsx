import React, { useEffect, useState } from "react";
import {
  Alert,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { getPredictionLeaderboard } from "./predictionApi";
import PredictionEmptyState from "./components/PredictionEmptyState";
import PredictionProfileCard from "./components/PredictionProfileCard";

const LeaderboardRow = ({ row, highlight = false, t }) => (
  <Paper
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
          {row.total_points} {t("prediction.points.short", "pts")} · {t("prediction.leaderboard.exact", "exact")} {row.exact_score_count} · {t("prediction.leaderboard.outcomes", "outcomes")} {row.correct_outcome_count}
        </Typography>
        {row.favorite_team_name ? (
          <Typography variant="caption" color="text.secondary">
            {t("prediction.profile.fields.favoriteTeam", "Favorite team")}: {row.favorite_team_name}
          </Typography>
        ) : null}
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {t("prediction.leaderboard.scoredPicks", { count: row.scored_prediction_count ?? 0, defaultValue: "{{count}} scored picks" })}
      </Typography>
    </Stack>
  </Paper>
);

const PredictionLeaderboardPage = () => {
  const { t } = useTranslation();
  const [scope, setScope] = useState("overall");
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    getPredictionLeaderboard({ scope })
      .then((data) => {
        if (active) setState({ loading: false, error: "", data });
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            error: error?.response?.data?.error || error?.message || t("prediction.leaderboard.errors.load", "Failed to load leaderboard."),
            data: null,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [scope]);

  if (state.loading) return <Skeleton variant="rounded" height={260} />;
  if (state.error) return <Alert severity="error">{state.error}</Alert>;

  const top = state.data?.top || [];
  const me = state.data?.me;
  const aroundMe = state.data?.around_me || [];

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t("prediction.leaderboard.title", "Leaderboard")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.leaderboard.subtitle", "Overall standings update after scored match results are posted.")}
        </Typography>
      </Stack>

      <PredictionProfileCard
        onSaved={async () => {
          const refreshed = await getPredictionLeaderboard({ scope });
          setState({ loading: false, error: "", data: refreshed });
        }}
      />

      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Tabs value={scope} onChange={(_event, next) => setScope(next)} variant="fullWidth">
          <Tab value="overall" label={t("prediction.leaderboard.tabs.overall", "Overall")} />
          <Tab value="weekly" label={t("prediction.leaderboard.tabs.weekly", "This Week")} />
        </Tabs>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t("prediction.leaderboard.top", "Top 10")}
        </Typography>
        <Stack spacing={1.25}>
          {top.length ? top.map((row) => <LeaderboardRow key={`${scope}-top-${row.recruiter_id}`} row={row} highlight={me?.recruiter_id === row.recruiter_id} t={t} />) : (
            <PredictionEmptyState
              title={t("prediction.leaderboard.empty.topTitle", "No leaderboard yet")}
              body={t("prediction.leaderboard.empty.topBody", "Standings will appear here after scored results are posted for this view.")}
            />
          )}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t("prediction.leaderboard.myRank", "My Rank")}
        </Typography>
        {me ? <LeaderboardRow row={me} highlight t={t} /> : (
          <PredictionEmptyState
            title={t("prediction.leaderboard.empty.rankTitle", "No rank yet")}
            body={t("prediction.leaderboard.empty.rankBody", "Your rank appears after at least one of your saved predictions is scored.")}
          />
        )}
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t("prediction.leaderboard.aroundMe", "Around Me")}
        </Typography>
        <Stack spacing={1.25}>
          {aroundMe.length ? aroundMe.map((row) => <LeaderboardRow key={`${scope}-around-${row.recruiter_id}`} row={row} highlight={me?.recruiter_id === row.recruiter_id} t={t} />) : (
            <PredictionEmptyState
              title={t("prediction.leaderboard.empty.aroundTitle", "No nearby standings yet")}
              body={t("prediction.leaderboard.empty.aroundBody", "Nearby ranking positions will appear after you have a scored prediction.")}
            />
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default PredictionLeaderboardPage;
