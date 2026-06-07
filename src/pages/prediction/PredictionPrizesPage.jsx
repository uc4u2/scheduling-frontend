import React, { useEffect, useMemo, useState } from "react";
import { Alert, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getPredictionPrizes } from "./predictionApi";
import { formatUtcLabel } from "./predictionViewUtils";
import PredictionPrizeStatusCard from "./components/PredictionPrizeStatusCard";
import PredictionEmptyState from "./components/PredictionEmptyState";

const formatCad = (valueCents, fallbackLabel) => {
  if (valueCents == null || Number.isNaN(Number(valueCents))) return fallbackLabel;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number(valueCents) / 100);
};

const getDailyPrizeLabel = (draw, t) => {
  const prizeName = String(draw?.prize_name || "").trim();
  if (!prizeName || prizeName === "$25 Gift Card") return t("prediction.prizes.daily.startingAt", "Starting at $25");
  return prizeName;
};

const derivePrizeStatus = (draw, eligibility, t) => {
  if (!draw) return t("prediction.prizes.status.comingSoon", "Coming soon");
  if (draw.status === "published") return t("prediction.prizes.status.published", "Published");
  if (draw.status === "drawn") return t("prediction.prizes.status.winnerSelected", "Winner selected");
  if (draw.status === "closed") return t("prediction.prizes.status.closed", "Closed");
  if (eligibility?.eligible_now) return t("prediction.prizes.status.qualified", "Qualified");
  return t("prediction.prizes.status.notQualified", "Not qualified yet");
};

const deriveStatusTone = (draw, eligibility) => {
  if (!draw) return "default";
  if (draw.status === "published") return "success";
  if (draw.status === "drawn") return "info";
  if (draw.status === "closed") return "warning";
  if (eligibility?.eligible_now) return "success";
  return "default";
};

const formatWinnerStatus = (status, t) => {
  const key = String(status || "").toLowerCase();
  const mapping = {
    pending_contact: t("prediction.prizes.winners.statusValues.pendingContact", "Pending contact"),
    contacted: t("prediction.prizes.winners.statusValues.contacted", "Contacted"),
    claimed: t("prediction.prizes.winners.statusValues.claimed", "Claimed"),
    forfeited: t("prediction.prizes.winners.statusValues.forfeited", "Forfeited"),
    disqualified: t("prediction.prizes.winners.statusValues.disqualified", "Disqualified"),
  };
  return mapping[key] || status;
};

const getLatestDrawByType = (draws, type) =>
  (draws || [])
    .filter((row) => row.draw_type === type)
    .sort((a, b) => {
      const aTime = a.cutoff_at_utc || a.draw_at_utc || "";
      const bTime = b.cutoff_at_utc || b.draw_at_utc || "";
      return String(aTime).localeCompare(String(bTime));
    })[0] || null;

export default function PredictionPrizesPage() {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let active = true;
    getPredictionPrizes()
      .then((data) => {
        if (active) setState({ loading: false, error: "", data });
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            error: error?.response?.data?.error || error?.message || t("prediction.prizes.errors.load", "Failed to load prediction prizes."),
            data: null,
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const draws = state.data?.draws || [];
  const eligibilityRows = state.data?.eligibility || [];
  const eligibilityByDrawId = useMemo(
    () => new Map(eligibilityRows.map((row) => [row.draw?.id, row])),
    [eligibilityRows]
  );

  const dailyPrize = useMemo(() => getLatestDrawByType(draws, "daily_active"), [draws]);
  const weeklyPrize = useMemo(() => getLatestDrawByType(draws, "weekly_share"), [draws]);
  const grandPrize = useMemo(() => getLatestDrawByType(draws, "grand_referral"), [draws]);
  const dailyEligibility = dailyPrize ? eligibilityByDrawId.get(dailyPrize.id) : null;
  const weeklyEligibility = weeklyPrize ? eligibilityByDrawId.get(weeklyPrize.id) : null;
  const grandEligibility = grandPrize ? eligibilityByDrawId.get(grandPrize.id) : null;

  if (state.loading) return <Skeleton variant="rounded" height={420} />;
  if (state.error && !state.data) return <Alert severity="error">{state.error}</Alert>;

  return (
    <Stack spacing={2}>
      {state.error ? <Alert severity="warning">{state.error}</Alert> : null}

      <Stack spacing={0.5}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t("prediction.prizes.title", "Prizes")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.prizes.subtitle", "Daily, weekly, and grand prizes use fixed cutoff times. Winners are selected only after the prize window closes.")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.prizes.sponsorNote", "Selected prize days may be supported by local businesses. Sponsors may be featured on the challenge page, prize cards, and winner announcements.")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.prizes.sponsorCta", "Interested in sponsoring a prize day? Contact Schedulaa to learn about featured sponsorship opportunities.")}
        </Typography>
      </Stack>

      <PredictionPrizeStatusCard
        title={t("prediction.prizes.daily.title", "Daily Prize")}
        description={t("prediction.prizes.daily.description", "Complete today’s Daily Bonus or predict today’s matches before cutoff to qualify. Some matchdays may feature larger sponsor-supported prizes.")}
        prizeLabel={getDailyPrizeLabel(dailyPrize, t)}
        statusLabel={derivePrizeStatus(dailyPrize, dailyEligibility, t)}
        statusTone={deriveStatusTone(dailyPrize, dailyEligibility)}
        progressRows={[
          dailyPrize
            ? dailyEligibility?.current_daily_activity
              ? t("prediction.prizes.daily.progressQualified", "Qualified activity recorded for this prize window.")
              : t("prediction.prizes.daily.progressPending", "Complete today’s Daily Bonus or predict today’s matches before the cutoff.")
            : t("prediction.prizes.daily.progressEmpty", "The daily prize schedule will appear here when the next prize window is announced."),
        ]}
        cutoffUtc={dailyPrize?.cutoff_at_utc}
        serverNowUtc={state.data?.server_now_utc}
        sponsors={(dailyPrize?.rules_snapshot_json || {}).sponsors || []}
        publicNote={(dailyPrize?.rules_snapshot_json || {}).admin_public_note || ""}
      />

      <PredictionPrizeStatusCard
        title={t("prediction.prizes.weekly.title", "Weekly Share Prize")}
        description={t("prediction.prizes.weekly.description", "Invite friends and make weekly predictions to qualify for the weekly gift card draw.")}
        prizeLabel={weeklyPrize?.prize_name || t("prediction.prizes.weekly.defaultPrize", "$25-$100 Gift Card")}
        statusLabel={derivePrizeStatus(weeklyPrize, weeklyEligibility, t)}
        statusTone={deriveStatusTone(weeklyPrize, weeklyEligibility)}
        progressRows={[
          {
            label: t("prediction.prizes.progress.qualifiedReferrals", "Qualified referrals"),
            current: weeklyEligibility?.current_qualified_referrals ?? 0,
            target: weeklyEligibility?.required_qualified_referrals ?? weeklyPrize?.required_qualified_referrals ?? 1,
            helper: t("prediction.prizes.weekly.qualifiedHelper", "Friends count after they register and save at least one prediction before the weekly prize cutoff."),
            tone: "primary",
          },
          {
            label: t("prediction.prizes.progress.predictionsSaved", "Predictions saved"),
            current: weeklyEligibility?.current_predictions ?? 0,
            target: weeklyEligibility?.required_predictions ?? weeklyPrize?.required_predictions ?? 3,
            helper: t("prediction.prizes.weekly.predictionsHelper", "Keep your weekly picks active before the prize cutoff."),
            tone: "success",
          },
        ]}
        cutoffUtc={weeklyPrize?.cutoff_at_utc}
        serverNowUtc={state.data?.server_now_utc}
        sponsors={(weeklyPrize?.rules_snapshot_json || {}).sponsors || []}
        publicNote={(weeklyPrize?.rules_snapshot_json || {}).admin_public_note || ""}
      />

      <PredictionPrizeStatusCard
        title={t("prediction.prizes.grand.title", "Grand Prize")}
        description={t("prediction.prizes.grand.description", "Invite qualified friends and keep predicting to qualify for the grand prize. The final prize may be a drone, gift card, or equivalent sponsor-supported prize announced before the draw.")}
        prizeLabel={grandPrize?.prize_value_cents != null ? formatCad(grandPrize.prize_value_cents, t("prediction.prizes.grand.valueFallback", "Sponsor-supported prize valued at approx. $500-$1,000 CAD")) : t("prediction.prizes.grand.valueFallback", "Sponsor-supported prize valued at approx. $500-$1,000 CAD")}
        statusLabel={derivePrizeStatus(grandPrize, grandEligibility, t)}
        statusTone={deriveStatusTone(grandPrize, grandEligibility)}
        progressRows={[
          {
            label: t("prediction.prizes.progress.qualifiedFriends", "Qualified friends"),
            current: grandEligibility?.current_qualified_referrals ?? 0,
            target: grandEligibility?.required_qualified_referrals ?? grandPrize?.required_qualified_referrals ?? 5,
            helper: t("prediction.prizes.grand.qualifiedHelper", "Invite friends who register and save at least one prediction before the grand prize cutoff."),
            tone: "primary",
          },
          {
            label: t("prediction.prizes.progress.predictionsSaved", "Predictions saved"),
            current: grandEligibility?.current_predictions ?? 0,
            target: grandEligibility?.required_predictions ?? grandPrize?.required_predictions ?? 10,
            helper: t("prediction.prizes.grand.predictionsHelper", "Keep predicting across the campaign to stay in the grand prize window."),
            tone: "success",
          },
        ]}
        cutoffUtc={grandPrize?.cutoff_at_utc}
        serverNowUtc={state.data?.server_now_utc}
        sponsors={(grandPrize?.rules_snapshot_json || {}).sponsors || []}
        publicNote={(grandPrize?.rules_snapshot_json || {}).admin_public_note || ""}
        footer={t("prediction.prizes.grand.footer", "Schedulaa may substitute an equivalent gift card if shipping, availability, sponsor contribution, or local rules prevent delivery of the original prize.")}
      />

      <PredictionPrizeStatusCard
        title={t("prediction.prizes.schedulaa.title", "Schedulaa 6 Months Free")}
        description={t("prediction.prizes.schedulaa.description", "Selected business users may win 6 months of Schedulaa free.")}
        prizeLabel={t("prediction.prizes.status.comingSoon", "Coming soon")}
        statusLabel={t("prediction.prizes.schedulaa.status", "Admin announcement pending")}
        statusTone="default"
        progressRows={[t("prediction.prizes.schedulaa.progress", "Qualification rules for this category will be announced by Schedulaa.")]}
      />

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t("prediction.prizes.winners.title", "Published Winners")}
        </Typography>
        {(state.data?.published_winners || []).length ? (
          <Stack spacing={1.25}>
            {state.data.published_winners.map((row) => (
              <Paper key={row.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {row.emoji_avatar ? `${row.emoji_avatar} ` : ""}{row.display_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {row.draw_title || row.prize_name}
                  </Typography>
                  {row.favorite_team_name ? (
                    <Typography variant="caption" color="text.secondary">
                      {t("prediction.profile.fields.favoriteTeam", "Favorite team")}: {row.favorite_team_name}
                    </Typography>
                  ) : null}
                  <Typography variant="body2" color="text.secondary">
                    {t("prediction.prizes.winners.status", "Prize status")}: {formatWinnerStatus(row.status, t)}
                  </Typography>
                  {(row.selected_at_utc || row.created_at) ? (
                    <Typography variant="caption" color="text.secondary">
                      {t("prediction.prizes.winners.published", "Published")}: {formatUtcLabel(row.selected_at_utc || row.created_at)}
                    </Typography>
                  ) : null}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <PredictionEmptyState
            title={t("prediction.prizes.winners.empty.title", "No winners published yet")}
            body={t("prediction.prizes.winners.empty.body", "Published winners will appear here after a prize draw is completed and winners are announced.")}
          />
        )}
      </Paper>
    </Stack>
  );
}
