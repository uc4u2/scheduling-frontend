import api from "../../utils/api";

export const PREDICTION_DEFAULT_CAMPAIGN_KEY = "world_cup_2026";

const withCampaign = (params = {}, campaignKey = PREDICTION_DEFAULT_CAMPAIGN_KEY) => ({
  ...params,
  campaign: params.campaign || campaignKey,
});

export const getPredictionHome = async (campaignKey = PREDICTION_DEFAULT_CAMPAIGN_KEY) => {
  const { data } = await api.get("/prediction/home", { params: withCampaign({}, campaignKey) });
  return data;
};

export const getPredictionToday = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
  dailyKey,
} = {}) => {
  const params = withCampaign({}, campaign);
  if (dailyKey) params.daily_key = dailyKey;
  const { data } = await api.get("/prediction/today", { params });
  return data;
};

export const getPredictionWeeklyMatches = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
  weekKey,
} = {}) => {
  const params = withCampaign({}, campaign);
  if (weekKey) params.week_key = weekKey;
  const { data } = await api.get("/prediction/matches/weekly", { params });
  return data;
};

export const savePredictionPicksBulk = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
  picks,
}) => {
  const { data } = await api.post("/prediction/picks/bulk-save", {
    campaign,
    picks,
  });
  return data;
};

export const getMyPredictions = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
  status,
  weekKey,
  stageKey,
} = {}) => {
  const params = withCampaign({}, campaign);
  if (status && status !== "all") params.status = status;
  if (weekKey) params.week_key = weekKey;
  if (stageKey) params.stage_key = stageKey;
  const { data } = await api.get("/prediction/my-predictions", { params });
  return data;
};

export const getPredictionFixtures = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
  weekKey,
  stageKey,
  status,
  q,
  includePlaceholders = false,
} = {}) => {
  const params = withCampaign({}, campaign);
  if (weekKey) params.week_key = weekKey;
  if (stageKey) params.stage_key = stageKey;
  if (status && status !== "all") params.status = status;
  if (q) params.q = q;
  if (includePlaceholders) params.include_placeholders = "true";
  const { data } = await api.get("/prediction/fixtures", { params });
  return data;
};

export const getPredictionLeaderboard = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
  scope = "overall",
  weekKey,
  limit = 10,
} = {}) => {
  const params = withCampaign({}, campaign);
  params.scope = scope;
  params.limit = limit;
  if (weekKey) params.week_key = weekKey;
  const { data } = await api.get("/prediction/leaderboard", { params });
  return data;
};

export const getPredictionProfile = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
} = {}) => {
  const { data } = await api.get("/prediction/profile", { params: withCampaign({}, campaign) });
  return data;
};

export const savePredictionProfile = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
  displayName,
  emojiAvatar,
  favoriteTeamName,
}) => {
  const payload = { campaign };
  if (displayName !== undefined) payload.display_name = displayName;
  if (emojiAvatar !== undefined) payload.emoji_avatar = emojiAvatar;
  if (favoriteTeamName !== undefined) payload.favorite_team_name = favoriteTeamName;
  const { data } = await api.post("/prediction/profile", payload);
  return data;
};

export const getPredictionRules = async (campaignKey = PREDICTION_DEFAULT_CAMPAIGN_KEY) => {
  const { data } = await api.get("/prediction/rules", { params: withCampaign({}, campaignKey) });
  return data;
};

export const getDailyBonusToday = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
  dailyKey,
} = {}) => {
  const params = withCampaign({}, campaign);
  if (dailyKey) params.daily_key = dailyKey;
  const { data } = await api.get("/prediction/daily-bonus/today", { params });
  return data;
};

export const saveDailyBonusAnswer = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
  questionId,
  selectedOptionKey,
}) => {
  const { data } = await api.post("/prediction/daily-bonus/answers", {
    campaign,
    question_id: questionId,
    selected_option_key: selectedOptionKey,
  });
  return data;
};

export const getPredictionActivityFeed = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
  dailyKey,
} = {}) => {
  const params = withCampaign({}, campaign);
  if (dailyKey) params.daily_key = dailyKey;
  const { data } = await api.get("/prediction/activity-feed", { params });
  return data;
};

export const getPredictionReferralsMe = async (campaignKey = PREDICTION_DEFAULT_CAMPAIGN_KEY) => {
  const { data } = await api.get("/prediction/referrals/me", { params: withCampaign({}, campaignKey) });
  return data;
};

export const getPredictionPrizes = async (campaignKey = PREDICTION_DEFAULT_CAMPAIGN_KEY) => {
  const { data } = await api.get("/prediction/prizes", { params: withCampaign({}, campaignKey) });
  return data;
};

export const getPredictionDrawEligibilityMe = async (campaignKey = PREDICTION_DEFAULT_CAMPAIGN_KEY) => {
  const { data } = await api.get("/prediction/draws/eligibility/me", { params: withCampaign({}, campaignKey) });
  return data;
};

export const resolvePredictionReferral = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
  ref,
}) => {
  const { data } = await api.post("/prediction/referrals/resolve", { campaign, ref });
  return data;
};

export const getPredictionMultiPickChallenges = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
} = {}) => {
  const { data } = await api.get("/prediction/multipick/challenges", {
    params: withCampaign({}, campaign),
  });
  return data;
};

export const getCurrentPredictionMultiPickChallenge = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
} = {}) => {
  const { data } = await api.get("/prediction/multipick/challenges/current", {
    params: withCampaign({}, campaign),
  });
  return data;
};

export const getPredictionMultiPickChallenge = async (
  challengeId,
  { campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY } = {}
) => {
  const { data } = await api.get(`/prediction/multipick/challenges/${challengeId}`, {
    params: withCampaign({}, campaign),
  });
  return data;
};

export const getPredictionMultiPickCards = async (
  challengeId,
  { campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY } = {}
) => {
  const { data } = await api.get(`/prediction/multipick/challenges/${challengeId}/cards`, {
    params: withCampaign({}, campaign),
  });
  return data;
};

export const createPredictionMultiPickCard = async (
  challengeId,
  { campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY, ...payload }
) => {
  const { data } = await api.post(`/prediction/multipick/challenges/${challengeId}/cards`, {
    campaign,
    ...payload,
  });
  return data;
};

export const updatePredictionMultiPickCard = async (
  cardId,
  { campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY, ...payload }
) => {
  const { data } = await api.patch(`/prediction/multipick/cards/${cardId}`, {
    campaign,
    ...payload,
  });
  return data;
};

export const getPredictionMultiPickLeaderboard = async (
  challengeId,
  { campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY } = {}
) => {
  const { data } = await api.get(`/prediction/multipick/challenges/${challengeId}/leaderboard`, {
    params: withCampaign({}, campaign),
  });
  return data;
};

export const getPredictionMultiPickWinners = async ({
  campaign = PREDICTION_DEFAULT_CAMPAIGN_KEY,
} = {}) => {
  const { data } = await api.get("/prediction/multipick/winners", {
    params: withCampaign({}, campaign),
  });
  return data;
};
