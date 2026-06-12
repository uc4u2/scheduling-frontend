import React, { useEffect, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getPredictionPrizes, getPredictionToday } from "./predictionApi";
import PredictionDailyBonusCard from "./components/PredictionDailyBonusCard";
import PredictionActivityFeed from "./components/PredictionActivityFeed";
import PredictionTodayMatchesCard from "./components/PredictionTodayMatchesCard";
import PredictionRecentResultsCard from "./components/PredictionRecentResultsCard";
import PredictionStatCard from "./components/PredictionStatCard";
import PredictionCountdownChip from "./components/PredictionCountdownChip";
import PredictionEmptyState from "./components/PredictionEmptyState";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import todayCover from "../../assets/prediction/today-cover.png";

const getDailyPrizeHeadline = (draw, t) => {
  const prizeName = String(draw?.prize_name || "").trim();
  if (!prizeName || prizeName === "$25 Gift Card") return t("prediction.prizes.dailyStart", "Daily prizes start at $25");
  return prizeName;
};

export default function PredictionTodayPage({ onOpenWeekly }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true, error: "", data: null, prizes: null });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const [data, prizes] = await Promise.all([getPredictionToday(), getPredictionPrizes().catch(() => null)]);
      setState({ loading: false, error: "", data, prizes });
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.error || error?.message || "Failed to load today view.",
        data: null,
        prizes: null,
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (state.loading) return <Skeleton variant="rounded" height={320} />;
  if (state.error) return <Alert severity="error">{state.error}</Alert>;

  const data = state.data || {};
  const dailyDraw = (state.prizes?.draws || []).find((row) => row.draw_type === "daily_active");
  const dailyEligibility = (state.prizes?.eligibility || []).find((row) => row.draw?.id === dailyDraw?.id);
  const todayMatches = data.today_matches || [];
  const nextMatches = data.next_matches || [];
  const firstUpcomingDailyKey = nextMatches[0]?.kickoff_at_utc ? String(nextMatches[0].kickoff_at_utc).slice(0, 10) : "";
  const tournamentNotStartedYet = !todayMatches.length && !!firstUpcomingDailyKey && !!data.daily_key && data.daily_key < firstUpcomingDailyKey;

  return (
    <Stack spacing={2}>
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.14),
          minHeight: { xs: 220, md: 250 },
          display: "flex",
          alignItems: "center",
          backgroundImage: `
            linear-gradient(90deg, ${alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.94 : 0.9)} 0%, ${alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.86 : 0.76)} 28%, ${alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.24 : 0.1)} 56%, ${alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.18 : 0.06)} 100%),
            linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.success.main, 0.08)} 44%, ${alpha(theme.palette.warning.main, 0.08)} 100%),
            url(${todayCover})
          `,
          backgroundSize: "cover, cover, cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: {
            xs: "center center, center center, center center",
            md: "center center, center center, center 38%",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: { xs: "100%", md: 520 },
            p: { xs: 0, md: 0 },
          }}
        >
          <Stack
            spacing={0.85}
            sx={{
              p: { xs: 0, md: 0 },
              borderRadius: 2.5,
            }}
          >
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                {t("prediction.today.header.title", "Today's Challenge")}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t("prediction.today.header.subtitle", "Complete today's bonus or predict today's matches to qualify for today's prize.")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("prediction.today.header.challengeDay", { day: data.daily_key || "-", defaultValue: "Challenge day: {{day}} UTC" })}
              </Typography>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <PredictionStatCard
            label={t("prediction.today.cards.summary", "Today summary")}
            value={`${data.daily_completion?.predicted_today_count ?? 0}/${data.daily_completion?.matches_today_count ?? 0}`}
            helper={data.daily_completion?.daily_complete
              ? t("prediction.today.cards.summaryComplete", "You have completed today’s required activity.")
              : data.daily_completion?.daily_bonus_answered
                ? t("prediction.today.cards.summaryAnswered", "Daily bonus answered. Match picks can still improve your coverage.")
                : t("prediction.today.cards.summaryPending", "You still have daily activity to finish.")}
            tone="primary"
            icon={<CalendarTodayOutlinedIcon fontSize="small" />}
            actionLabel={t("prediction.today.cards.openWeekly", "Open Weekly Challenge")}
            onAction={() => onOpenWeekly?.(todayMatches[0]?.match?.week_key || nextMatches[0]?.week_key || "")}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <PredictionStatCard
            label={t("prediction.home.stats.currentStreak", "Current streak")}
            value={data.streak?.current_streak ?? 0}
            helper={data.streak?.label || "No active streak yet"}
            tone="warning"
            icon={<LocalFireDepartmentOutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <Stack spacing={1.25}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Typography variant="overline" color="text.secondary">{t("prediction.today.prize.title", "Today's Prize")}</Typography>
                <CardGiftcardOutlinedIcon fontSize="small" color="primary" />
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{getDailyPrizeHeadline(dailyDraw, t)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {dailyEligibility?.eligible_now
                  ? t("prediction.today.prize.qualified", "You are currently qualified for today’s prize window.")
                  : t("prediction.today.prize.body", "Complete today’s bonus or predict today’s matches before cutoff to qualify. Sponsor-supported prize upgrades may be announced during the tournament.")}
              </Typography>
              {dailyDraw?.cutoff_at_utc ? (
                <PredictionCountdownChip
                  targetUtc={dailyDraw.cutoff_at_utc}
                  serverNowUtc={data.server_now_utc}
                  prefix={t("prediction.today.prize.cutoff", "Prize cutoff UTC")}
                  closedLabel={t("prediction.today.prize.closed", "Prize closed")}
                />
              ) : null}
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {t("prediction.today.prize.note", "Daily prize eligibility is based on the Challenge day UTC shown above.")}
              </Typography>
              <Button sx={{ mt: 0.5 }} variant="contained" onClick={() => onOpenWeekly?.(todayMatches[0]?.match?.week_key || nextMatches[0]?.week_key || "")}>{t("prediction.actions.predictToday", "Predict Today")}</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <PredictionDailyBonusCard data={data.daily_bonus} onSaved={load} />

      {todayMatches.length ? (
        <PredictionTodayMatchesCard
          title={t("prediction.today.matches.title", "Today's Matches")}
          items={todayMatches}
          onOpenWeekly={onOpenWeekly}
          emptyLabel=""
          serverNowUtc={data.server_now_utc}
        />
      ) : (
        <PredictionEmptyState
          title={t("prediction.today.empty.title", "No matches today")}
          body={tournamentNotStartedYet
            ? t("prediction.today.empty.beforeStart", "The tournament has not started yet. You can browse upcoming fixtures and prepare your predictions.")
            : t("prediction.today.empty.noMatches", "The tournament has not started yet, or there are no fixtures on this Challenge day UTC.")}
          actionLabel={nextMatches.length ? t("prediction.today.empty.prepareUpcoming", "Prepare for Upcoming Matches") : undefined}
          onAction={nextMatches.length ? (() => onOpenWeekly?.(nextMatches[0]?.week_key || "")) : undefined}
        />
      )}

      {!todayMatches.length && nextMatches.length ? (
        <PredictionTodayMatchesCard
          title={t("prediction.today.upcoming.title", "Next Upcoming Matches")}
          helperText={t("prediction.today.upcoming.helper", "These matches are not counted toward today’s completion or today’s daily prize unless they belong to the Challenge day UTC shown above.")}
          items={nextMatches.map((match) => ({ match, my_pick: match.my_pick, derived_status: match.derived_status || (match.my_pick ? "pending" : "pending") }))}
          onOpenWeekly={onOpenWeekly}
          emptyLabel=""
          upcomingMode
          serverNowUtc={data.server_now_utc}
        />
      ) : null}

      <PredictionRecentResultsCard items={data.recent_results || []} />
      <PredictionActivityFeed items={data.activity_feed || []} />
    </Stack>
  );
}
