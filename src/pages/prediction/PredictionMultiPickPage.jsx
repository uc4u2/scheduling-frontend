import React, { useEffect, useMemo, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Chip, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import PredictionHero from "./components/PredictionHero";
import PredictionStatCard from "./components/PredictionStatCard";
import PredictionCountdownChip from "./components/PredictionCountdownChip";
import PredictionEmptyState from "./components/PredictionEmptyState";
import PredictionMatchHeader from "./components/PredictionMatchHeader";
import PredictionMultiPickCardEditor from "./components/PredictionMultiPickCardEditor";
import PredictionMultiPickLeaderboard from "./components/PredictionMultiPickLeaderboard";
import PredictionMultiPickWinners from "./components/PredictionMultiPickWinners";
import {
  createPredictionMultiPickCard,
  getCurrentPredictionMultiPickChallenge,
  getPredictionMultiPickChallenge,
  getPredictionMultiPickLeaderboard,
  getPredictionMultiPickWinners,
  updatePredictionMultiPickCard,
} from "./predictionApi";

const isLeaderboardStatus = (status) => ["scored", "published"].includes(status);

const multipickStatusLabel = (status, t) => {
  if (!status) return "";
  return t(`prediction.multipick.statusValues.${status}`, status);
};

const buildHeroStats = (challenge, summary, t) => {
  if (!challenge) return [];
  return [
    {
      label: t("prediction.multipick.hero.status", "Status"),
      value: challenge.status || "open",
    },
    {
      label: t("prediction.multipick.hero.cards", "Cards"),
      value: `${summary?.card_count || 0}/${challenge.max_cards_per_user || 5}`,
    },
    {
      label: t("prediction.multipick.hero.matches", "Matches"),
      value: challenge.match_count || 0,
    },
  ];
};

export default function PredictionMultiPickPage() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [state, setState] = useState({
    loading: true,
    error: "",
    challengeData: null,
    leaderboard: null,
    winners: [],
  });
  const [creatingNewCard, setCreatingNewCard] = useState(false);

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const [challengeData, winnersData] = await Promise.all([
        getCurrentPredictionMultiPickChallenge(),
        getPredictionMultiPickWinners().catch(() => ({ items: [] })),
      ]);
      let leaderboard = null;
      if (challengeData?.challenge?.id && isLeaderboardStatus(challengeData.challenge.status)) {
        try {
          leaderboard = await getPredictionMultiPickLeaderboard(challengeData.challenge.id);
        } catch (_error) {
          leaderboard = null;
        }
      }
      setState({
        loading: false,
        error: "",
        challengeData,
        leaderboard,
        winners: winnersData?.items || [],
      });
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.error || error?.message || "Failed to load Multi-Pick Challenge.",
        challengeData: null,
        leaderboard: null,
        winners: [],
      });
    }
  };

  const refreshChallenge = async (challengeId) => {
    const [detail, winnersData] = await Promise.all([
      getPredictionMultiPickChallenge(challengeId),
      getPredictionMultiPickWinners().catch(() => ({ items: [] })),
    ]);
    let leaderboard = null;
    if (detail?.challenge?.id && isLeaderboardStatus(detail.challenge.status)) {
      try {
        leaderboard = await getPredictionMultiPickLeaderboard(detail.challenge.id);
      } catch (_error) {
        leaderboard = null;
      }
    }
    setState((prev) => ({
      ...prev,
      loading: false,
      error: "",
      challengeData: {
        ...detail,
        my_summary: {
          card_count: (detail?.cards || []).length,
          best_card: detail?.me || null,
        },
      },
      leaderboard,
      winners: winnersData?.items || prev.winners,
    }));
  };

  useEffect(() => {
    load();
  }, []);

  const challenge = state.challengeData?.challenge || null;
  const matches = state.challengeData?.matches || [];
  const cards = state.challengeData?.cards || [];
  const mySummary = state.challengeData?.my_summary || {};
  const serverNowUtc = state.challengeData?.server_now_utc || state.leaderboard?.server_now_utc;
  const isLocked = !!challenge?.is_locked || ["locked", "scored", "published"].includes(challenge?.status);
  const canCreateCard = !!challenge && !isLocked && cards.length < Number(challenge.max_cards_per_user || 5);
  const nextCardNumber = cards.length + 1;

  const heroStats = useMemo(() => buildHeroStats(challenge, mySummary, t), [challenge, mySummary, t]);

  const handleCreateCard = async (payload) => {
    if (!challenge?.id) return;
    await createPredictionMultiPickCard(challenge.id, payload);
    setCreatingNewCard(false);
    await refreshChallenge(challenge.id);
  };

  const handleUpdateCard = async (cardId, payload) => {
    if (!challenge?.id) return;
    await updatePredictionMultiPickCard(cardId, payload);
    await refreshChallenge(challenge.id);
  };

  if (state.loading) return <Skeleton variant="rounded" height={360} />;
  if (state.error) return <Alert severity="error">{state.error}</Alert>;

  return (
    <Stack spacing={2}>
      <PredictionHero
        title={t("prediction.multipick.title", "Multi-Pick Challenge")}
        subtitle={t(
          "prediction.multipick.subtitle",
          "Submit up to 5 prediction cards for each match block. Pick Home, Draw, or Away. Your best card counts."
        )}
        primaryActionLabel={null}
        secondaryActionLabel={null}
        tertiaryActionLabel={null}
        stats={heroStats}
      />

      {!challenge ? (
        <>
          <PredictionEmptyState
            title={t("prediction.multipick.empty.currentTitle", "No Multi-Pick block open yet")}
            body={t(
              "prediction.multipick.empty.currentBody",
              "Platform Admin will open Multi-Pick blocks before the tournament starts."
            )}
          />
          <PredictionMultiPickWinners items={state.winners} />
        </>
      ) : (
        <>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={1.25}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} alignItems={{ md: "center" }}>
                <Stack spacing={0.4}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {challenge.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("prediction.multipick.summary", {
                      matchCount: challenge.match_count || matches.length || 0,
                      cardCount: mySummary.card_count || cards.length,
                      maxCards: challenge.max_cards_per_user || 5,
                      defaultValue: "{{matchCount}} matches · {{cardCount}}/{{maxCards}} cards submitted",
                    })}
                  </Typography>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                  <Chip variant="outlined" label={multipickStatusLabel(challenge.status, t)} />
                  {challenge.locks_at_utc ? (
                    <PredictionCountdownChip
                      targetUtc={challenge.locks_at_utc}
                      serverNowUtc={serverNowUtc}
                      prefix={t("prediction.multipick.lockPrefix", "Locks in")}
                      closedLabel={t("prediction.multipick.locked", "This block is locked.")}
                    />
                  ) : null}
                </Stack>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {t(
                  "prediction.multipick.helper",
                  "This mode is separate from Weekly Challenge. It does not affect prize draws."
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("prediction.multipick.mvpNote", "Top players are featured after scoring. No prize draw is attached to Multi-Pick in this MVP.")}
              </Typography>
              {isLocked ? <Alert severity="info">{t("prediction.multipick.lockMessage", "This block is locked.")}</Alert> : null}
            </Stack>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <PredictionStatCard
                label={t("prediction.multipick.stats.matches", "Matches in block")}
                value={challenge.match_count || matches.length || 0}
                helper={t("prediction.multipick.stats.matchesHelper", "Each card must include a pick for every match in this block.")}
                tone="primary"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <PredictionStatCard
                label={t("prediction.multipick.stats.cards", "Cards submitted")}
                value={`${mySummary.card_count || cards.length}/${challenge.max_cards_per_user || 5}`}
                helper={t("prediction.multipick.stats.cardsHelper", "Submit up to 5 cards. Your best card counts.")}
                tone="info"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <PredictionStatCard
                label={t("prediction.multipick.stats.best", "Best card")}
                value={mySummary?.best_card?.correct_count ?? "TBD"}
                helper={mySummary?.best_card
                  ? t("prediction.multipick.stats.bestHelper", {
                      cardNumber: mySummary.best_card.card_number,
                      defaultValue: "Current best: Card {{cardNumber}}",
                    })
                  : t("prediction.multipick.stats.bestEmpty", "Your best card appears after scoring.")}
                tone="success"
              />
            </Grid>
          </Grid>

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t("prediction.multipick.matches.title", "Match block")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("prediction.multipick.matches.subtitle", "Pick Home, Draw, or Away for every match in this block.")}
              </Typography>
              <Stack spacing={1.25}>
                {matches.map((match) => (
                  <Paper key={`multipick-preview-${match.id}`} variant="outlined" sx={{ p: 1.5 }}>
                    <PredictionMatchHeader
                      match={match}
                      serverNowUtc={serverNowUtc}
                      showVenue={false}
                      showWeek={false}
                      showCountdown={false}
                      compact
                    />
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ sm: "center" }}>
                <Stack spacing={0.4}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("prediction.multipick.cards.title", "Your cards")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("prediction.multipick.cards.subtitle", "Submit up to 5 cards. Your best card counts.")}
                  </Typography>
                </Stack>
                {canCreateCard && !creatingNewCard ? (
                  <Button variant="contained" onClick={() => setCreatingNewCard(true)}>
                    {t("prediction.multipick.actions.createCard", { number: nextCardNumber, defaultValue: "Create Card {{number}}" })}
                  </Button>
                ) : null}
              </Stack>

              {!cards.length && !creatingNewCard ? (
                <PredictionEmptyState
                  title={t("prediction.multipick.cards.empty.title", "No cards saved yet")}
                  body={t("prediction.multipick.cards.empty.body", "Create your first Multi-Pick card to start tracking this block.")}
                  actionLabel={canCreateCard ? t("prediction.multipick.actions.createFirst", "Create Card 1") : undefined}
                  onAction={canCreateCard ? (() => setCreatingNewCard(true)) : undefined}
                />
              ) : null}

              <Stack spacing={1.5}>
                {cards.map((card) => (
                  <PredictionMultiPickCardEditor
                    key={`multipick-card-${card.id}`}
                    card={card}
                    cardNumber={card.card_number}
                    matches={matches}
                    readOnly={isLocked}
                    onSave={(payload) => handleUpdateCard(card.id, payload)}
                  />
                ))}

                {creatingNewCard ? (
                  <PredictionMultiPickCardEditor
                    key="multipick-card-new"
                    card={null}
                    cardNumber={nextCardNumber}
                    matches={matches}
                    readOnly={false}
                    isNew
                    onSave={handleCreateCard}
                    onCancel={() => setCreatingNewCard(false)}
                  />
                ) : null}
              </Stack>

              {canCreateCard && !creatingNewCard ? (
                <Box
                  sx={{
                    position: "sticky",
                    bottom: 12,
                    display: "flex",
                    justifyContent: "flex-end",
                    pt: 0.5,
                    mt: 0.5,
                    zIndex: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={() => setCreatingNewCard(true)}
                    sx={{
                      boxShadow: theme.shadows[8],
                      borderRadius: 999,
                      px: 2.25,
                    }}
                  >
                    {t("prediction.multipick.actions.createCard", { number: nextCardNumber, defaultValue: "Create Card {{number}}" })}
                  </Button>
                </Box>
              ) : null}
            </Stack>
          </Paper>

          <PredictionMultiPickLeaderboard
            challenge={challenge}
            top={state.leaderboard?.top || state.challengeData?.top || []}
            me={state.leaderboard?.me || state.challengeData?.me || mySummary?.best_card || null}
            available={isLeaderboardStatus(challenge.status)}
          />

          <PredictionMultiPickWinners items={state.winners} />
        </>
      )}
    </Stack>
  );
}
