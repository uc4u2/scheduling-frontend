import React, { useEffect, useState } from "react";
import { Alert, Button, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import { getPredictionHome, getPredictionPrizes, getPredictionToday } from "./predictionApi";
import { formatWeekLabel } from "./predictionViewUtils";
import PredictionHero from "./components/PredictionHero";
import PredictionStatCard from "./components/PredictionStatCard";
import PredictionProgressBar from "./components/PredictionProgressBar";
import PredictionCountdownChip from "./components/PredictionCountdownChip";
import PredictionEmptyState from "./components/PredictionEmptyState";
import PredictionProfileCard from "./components/PredictionProfileCard";
import { getWeekHelperLabelT } from "./predictionViewUtils";

const getDailyPrizeHeadline = (draw, t) => {
  const prizeName = String(draw?.prize_name || "").trim();
  if (!prizeName || prizeName === "$25 Gift Card") return t("prediction.prizes.dailyStart", "Daily prizes start at $25");
  return prizeName;
};

const PredictionHomePage = ({ onOpenWeekly, onOpenFixtures, onOpenMyPredictions, onOpenReferrals, onOpenPrizes, onOpenToday }) => {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true, error: "", data: null, today: null, prizes: null });

  useEffect(() => {
    let active = true;
    Promise.all([getPredictionHome(), getPredictionToday().catch(() => null), getPredictionPrizes().catch(() => null)])
      .then(([data, today, prizes]) => {
        if (active) setState({ loading: false, error: "", data, today, prizes });
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            error: error?.response?.data?.error || error?.message || "Failed to load prediction home.",
            data: null,
            today: null,
            prizes: null,
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return <Skeleton variant="rounded" height={220} />;
  }

  if (state.error) {
    return <Alert severity="error">{state.error}</Alert>;
  }

  const stats = state.data?.stats || {};
  const today = state.today || {};
  const prizes = state.prizes || {};
  const dailyDraw = (prizes.draws || []).find((row) => row.draw_type === "daily_active");
  const dailyEligibility = (prizes.eligibility || []).find((row) => row.draw?.id === dailyDraw?.id);
  const grandDraw = (prizes.draws || []).find((row) => row.draw_type === "grand_referral");
  const grandEligibility = (prizes.eligibility || []).find((row) => row.draw?.id === grandDraw?.id);
  const currentWeekLabel = getWeekHelperLabelT(stats.current_week_key, t) || t("prediction.home.campaignWeek", "Campaign Week");

  return (
    <Stack spacing={2}>
      <PredictionHero
        title={t("prediction.home.hero.title", "Football Prediction Challenge 2026")}
        primaryActionLabel={t("prediction.actions.predictToday", "Predict Today")}
        secondaryActionLabel={t("prediction.actions.inviteFriends", "Invite Friends")}
        tertiaryActionLabel={t("prediction.actions.viewPrizes", "View Prizes")}
        onPrimaryAction={() => onOpenToday?.()}
        onSecondaryAction={() => onOpenReferrals?.()}
        onTertiaryAction={() => onOpenPrizes?.()}
        stats={[
          { label: t("prediction.home.hero.points", "Points"), value: stats.total_points ?? 0 },
          { label: t("prediction.home.hero.rank", "Rank"), value: stats.overall_rank ?? "TBD" },
          { label: t("prediction.home.hero.streak", "Streak"), value: today.streak?.current_streak ?? 0 },
        ]}
      />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <PredictionStatCard
            label={t("prediction.home.stats.totalPoints", "Total points")}
            value={stats.total_points ?? 0}
            helper={t("prediction.home.stats.totalPointsHelper", { count: stats.exact_score_count ?? 0, defaultValue: "{{count}} exact scores recorded." })}
            tone="primary"
            icon={<EmojiEventsOutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <PredictionStatCard
            label={t("prediction.home.stats.overallRank", "Overall rank")}
            value={stats.overall_rank ?? "TBD"}
            helper={t("prediction.home.stats.overallRankHelper", { count: stats.correct_outcome_count ?? 0, defaultValue: "{{count}} correct outcomes so far." })}
            tone="success"
            icon={<WorkspacePremiumOutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
            <PredictionStatCard
              label={t("prediction.home.stats.currentWeek", "Current week")}
              value={formatWeekLabel(stats.current_week_key)}
              helper={t("prediction.home.stats.currentWeekHelper", {
                saved: stats.weekly_predictions ?? 0,
                total: stats.weekly_total_matches ?? 0,
                rank: stats.weekly_rank ?? "TBD",
                defaultValue: "{{saved}} of {{total}} predictions saved. Weekly rank: {{rank}}.",
              })}
              tone="info"
              icon={<CalendarMonthOutlinedIcon fontSize="small" />}
            />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <PredictionStatCard
            label={t("prediction.home.stats.currentStreak", "Current streak")}
            value={today.streak?.current_streak ?? 0}
            helper={today.streak?.label || `Server UTC: ${state.data?.server_now_utc || "-"}`}
            tone="warning"
            icon={<LocalFireDepartmentOutlinedIcon fontSize="small" />}
          />
        </Grid>
      </Grid>
      <PredictionProfileCard />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("prediction.home.todayPrize.title", "Today's Prize")}
                </Typography>
                <EmojiEventsOutlinedIcon fontSize="small" color="primary" />
              </Stack>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {getDailyPrizeHeadline(dailyDraw, t)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dailyEligibility?.eligible_now
                  ? t("prediction.home.todayPrize.qualified", "You are currently qualified for today’s prize window.")
                  : t("prediction.home.todayPrize.body", "Complete today’s bonus or predict today’s matches before cutoff to qualify. Sponsor-supported prize upgrades may be announced during the tournament.")}
              </Typography>
              {dailyDraw?.cutoff_at_utc ? (
                <PredictionCountdownChip
                  targetUtc={dailyDraw.cutoff_at_utc}
                  serverNowUtc={state.data?.server_now_utc}
                  prefix={t("prediction.home.todayPrize.cutoff", "Prize cutoff UTC")}
                  closedLabel={t("prediction.home.todayPrize.closed", "Prize closed")}
                />
              ) : null}
              <Button variant="contained" onClick={() => onOpenPrizes?.()}>
                {t("prediction.actions.viewPrizes", "View Prizes")}
              </Button>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("prediction.home.dailyBonus.title", "Daily Bonus")}
                </Typography>
                <CardGiftcardOutlinedIcon fontSize="small" color="primary" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {t("prediction.home.dailyBonus.body", "Answer the bonus question for the Challenge day UTC or confirm your match picks to stay active.")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {state.data?.daily_bonus_available
                  ? t("prediction.home.dailyBonus.available", "Today’s daily bonus is available.")
                  : t("prediction.home.dailyBonus.unavailable", "No daily bonus question is open right now.")}
              </Typography>
              <Button variant="outlined" onClick={() => onOpenToday?.()}>
                {t("prediction.actions.predictToday", "Predict Today")}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("prediction.home.finishActions.title", "Finish your daily and weekly actions")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("prediction.home.finishActions.body", "Keep the habit going: complete today’s activity, finish the week, and review your saved picks.")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" onClick={() => onOpenToday?.()}>
              {t("prediction.actions.predictToday", "Predict Today")}
            </Button>
            <Button variant="contained" onClick={() => onOpenWeekly?.(stats.current_week_key || "")}>
              {t("prediction.actions.saveAllPredictions", "Save All Predictions")}
            </Button>
            <Button variant="outlined" onClick={() => onOpenFixtures?.()}>
              {t("prediction.actions.browseFixtures", "Browse Fixtures")}
            </Button>
            <Button variant="outlined" onClick={() => onOpenMyPredictions?.()}>
              {t("prediction.actions.viewMyPredictions", "View My Predictions")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("prediction.home.inviteFriends.title", "Invite Friends")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("prediction.home.inviteFriends.body", "Invite friends. When they register and submit at least one prediction before the cutoff, your referral counts toward weekly prizes and the grand prize draw.")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" onClick={() => onOpenReferrals?.()}>
              {t("prediction.actions.inviteFriends", "Invite Friends")}
            </Button>
            <Button variant="outlined" onClick={() => onOpenPrizes?.()}>
              {t("prediction.actions.viewPrizes", "View Prizes")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("prediction.home.grandPrize.title", "Grand Prize Progress")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {grandDraw?.prize_name || t("prediction.home.grandPrize.name", "Sponsor-supported grand prize")}.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {grandDraw?.prize_value_cents != null
              ? t("prediction.home.grandPrize.valueAnnounced", {
                  value: new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(grandDraw.prize_value_cents) / 100),
                  defaultValue: "{{value}} value announced.",
                })
              : t("prediction.home.grandPrize.valueFallback", "Approx. $500-$1,000 CAD value.")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("prediction.home.grandPrize.body", "Reach the referral and prediction targets before the grand cutoff to enter the final prize window.")}
          </Typography>
          <PredictionProgressBar
            current={grandEligibility?.current_qualified_referrals ?? 0}
            target={grandEligibility?.required_qualified_referrals ?? grandDraw?.required_qualified_referrals ?? 5}
            label={t("prediction.home.grandPrize.qualifiedReferrals", "Qualified referrals")}
            helper={t("prediction.home.grandPrize.qualifiedReferralsHelper", "Invite friends who register and save at least one prediction before the cutoff.")}
            tone="primary"
          />
          <PredictionProgressBar
            current={grandEligibility?.current_predictions ?? 0}
            target={grandEligibility?.required_predictions ?? grandDraw?.required_predictions ?? 10}
            label={t("prediction.home.grandPrize.predictionsSaved", "Predictions saved")}
            helper={t("prediction.home.grandPrize.predictionsSavedHelper", "Keep your match picks active across the campaign to stay on track.")}
            tone="success"
          />
          <Button variant="outlined" onClick={() => onOpenPrizes?.()}>
            {t("prediction.home.grandPrize.action", "View Grand Prize")}
          </Button>
        </Stack>
      </Paper>
      {state.data?.latest_result?.match && state.data?.latest_result?.pick ? (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {t("prediction.home.latestResult.title", "Latest Result")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {state.data.latest_result.match.home_team_name} vs {state.data.latest_result.match.away_team_name} · Actual {state.data.latest_result.match.home_score_actual}-{state.data.latest_result.match.away_score_actual} · Your pick {state.data.latest_result.pick.home_score_predicted}-{state.data.latest_result.pick.away_score_predicted} · {state.data.latest_result.pick.points_awarded} pts
          </Typography>
        </Paper>
      ) : (
        <PredictionEmptyState
          title={t("prediction.home.latestResult.title", "Latest Result")}
          body={t("prediction.home.latestResult.empty", {
            weekLabel: currentWeekLabel,
            week: formatWeekLabel(stats.current_week_key),
            defaultValue: "Your scored prediction highlights will appear here after match results are posted. {{weekLabel}}: {{week}}.",
          })}
          actionLabel={t("prediction.actions.viewMyPredictions", "View My Predictions")}
          onAction={() => onOpenMyPredictions?.()}
        />
      )}
    </Stack>
  );
};

export default PredictionHomePage;
