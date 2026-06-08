import platformAdminApi from "../../api/platformAdminApi";

export const PREDICTION_DEFAULT_CAMPAIGN_KEY = "world_cup_2026";

const withCampaign = (params = {}, campaignKey = PREDICTION_DEFAULT_CAMPAIGN_KEY) => ({
  ...params,
  campaign: params.campaign || campaignKey,
});

export const getPredictionCampaigns = async () => {
  const { data } = await platformAdminApi.get("/prediction/campaigns");
  return data;
};

export const getPredictionAdminMatches = async ({ campaign, weekKey, stageKey, status, q } = {}) => {
  const params = withCampaign({}, campaign);
  if (weekKey) params.week_key = weekKey;
  if (stageKey) params.stage_key = stageKey;
  if (status) params.status = status;
  if (q) params.q = q;
  const { data } = await platformAdminApi.get("/prediction/matches", { params });
  return data;
};

export const getPredictionFixtureSeedPreview = async ({ campaign } = {}) => {
  const { data } = await platformAdminApi.get("/prediction/fixtures/seed-preview", {
    params: withCampaign({}, campaign),
  });
  return data;
};

export const importPredictionFixtureSeed = async ({ campaign, dryRun = true, replace = false } = {}) => {
  const { data } = await platformAdminApi.post("/prediction/fixtures/import-seed", {
    campaign: campaign || PREDICTION_DEFAULT_CAMPAIGN_KEY,
    dry_run: dryRun,
    replace,
  });
  return data;
};

export const createPredictionAdminMatch = async (payload) => {
  const { data } = await platformAdminApi.post("/prediction/matches", {
    campaign: PREDICTION_DEFAULT_CAMPAIGN_KEY,
    ...payload,
  });
  return data;
};

export const updatePredictionAdminMatch = async (matchId, payload) => {
  const { data } = await platformAdminApi.patch(`/prediction/matches/${matchId}`, payload, {
    params: { campaign: PREDICTION_DEFAULT_CAMPAIGN_KEY },
  });
  return data;
};

export const setPredictionAdminMatchResult = async (matchId, payload) => {
  const { data } = await platformAdminApi.post(`/prediction/matches/${matchId}/set-result`, payload, {
    params: { campaign: PREDICTION_DEFAULT_CAMPAIGN_KEY },
  });
  return data;
};

export const recalculatePredictionAdmin = async (payload) => {
  const { data } = await platformAdminApi.post("/prediction/recalculate", {
    campaign: PREDICTION_DEFAULT_CAMPAIGN_KEY,
    ...payload,
  });
  return data;
};

export const getPredictionAdminLeaderboard = async ({ campaign, scope = "overall", weekKey, limit = 10 } = {}) => {
  const params = withCampaign({ scope, limit }, campaign);
  if (weekKey) params.week_key = weekKey;
  const { data } = await platformAdminApi.get("/prediction/leaderboard", { params });
  return data;
};

export const getPredictionAuditLogs = async ({ campaign, q, actionType, entityType } = {}) => {
  const params = withCampaign({}, campaign);
  if (q) params.q = q;
  if (actionType) params.action_type = actionType;
  if (entityType) params.entity_type = entityType;
  const { data } = await platformAdminApi.get("/prediction/audit-logs", { params });
  return data;
};

export const getPredictionAdminDraws = async ({ campaign } = {}) => {
  const { data } = await platformAdminApi.get("/prediction/draws", { params: withCampaign({}, campaign) });
  return data;
};

export const createPredictionAdminDraw = async (payload) => {
  const { data } = await platformAdminApi.post("/prediction/draws", {
    campaign: PREDICTION_DEFAULT_CAMPAIGN_KEY,
    ...payload,
  });
  return data;
};

export const updatePredictionAdminDraw = async (drawId, payload) => {
  const { data } = await platformAdminApi.patch(`/prediction/draws/${drawId}`, payload);
  return data;
};

export const seedPredictionAdminDefaultDraws = async ({ campaign } = {}) => {
  const { data } = await platformAdminApi.post("/prediction/draws/seed-defaults", {
    campaign: campaign || PREDICTION_DEFAULT_CAMPAIGN_KEY,
  });
  return data;
};

export const seedPredictionAdminDailyActiveDraws = async ({ campaign } = {}) => {
  const { data } = await platformAdminApi.post("/prediction/draws/seed-daily-active", {
    campaign: campaign || PREDICTION_DEFAULT_CAMPAIGN_KEY,
  });
  return data;
};

export const generatePredictionAdminDrawEntries = async (drawId) => {
  const { data } = await platformAdminApi.post(`/prediction/draws/${drawId}/generate-entries`);
  return data;
};

export const runPredictionAdminDraw = async (drawId) => {
  const { data } = await platformAdminApi.post(`/prediction/draws/${drawId}/run`);
  return data;
};

export const publishPredictionAdminDraw = async (drawId) => {
  const { data } = await platformAdminApi.post(`/prediction/draws/${drawId}/publish`);
  return data;
};

export const getPredictionAdminDrawEntries = async (drawId) => {
  const { data } = await platformAdminApi.get(`/prediction/draws/${drawId}/entries`);
  return data;
};

export const getPredictionAdminDrawAwards = async (drawId) => {
  const { data } = await platformAdminApi.get(`/prediction/draws/${drawId}/awards`);
  return data;
};

export const updatePredictionAdminAwardStatus = async (awardId, payload) => {
  const { data } = await platformAdminApi.post(`/prediction/awards/${awardId}/status`, payload);
  return data;
};

export const getPredictionAdminReferrals = async ({ campaign, status, q } = {}) => {
  const params = withCampaign({}, campaign);
  if (status) params.status = status;
  if (q) params.q = q;
  const { data } = await platformAdminApi.get("/prediction/referrals", { params });
  return data;
};

export const disqualifyPredictionAdminReferral = async (referralId, reason) => {
  const { data } = await platformAdminApi.post(`/prediction/referrals/${referralId}/disqualify`, { reason });
  return data;
};

export const getPredictionAdminDailyBonus = async ({ campaign, dailyKey, status, questionType } = {}) => {
  const params = withCampaign({}, campaign);
  if (dailyKey) params.daily_key = dailyKey;
  if (status) params.status = status;
  if (questionType) params.question_type = questionType;
  const { data } = await platformAdminApi.get("/prediction/daily-bonus", { params });
  return data;
};

export const createPredictionAdminDailyBonus = async (payload) => {
  const { data } = await platformAdminApi.post("/prediction/daily-bonus", {
    campaign: PREDICTION_DEFAULT_CAMPAIGN_KEY,
    ...payload,
  });
  return data;
};

export const updatePredictionAdminDailyBonus = async (questionId, payload) => {
  const { data } = await platformAdminApi.patch(`/prediction/daily-bonus/${questionId}`, payload);
  return data;
};

export const scorePredictionAdminDailyBonus = async (questionId) => {
  const { data } = await platformAdminApi.post(`/prediction/daily-bonus/${questionId}/score`);
  return data;
};

export const scoreReadyPredictionAdminDailyBonus = async ({ campaign } = {}) => {
  const { data } = await platformAdminApi.post("/prediction/daily-bonus/score-ready", {
    campaign: campaign || PREDICTION_DEFAULT_CAMPAIGN_KEY,
  });
  return data;
};

export const seedDailyBonusFromFixtures = async ({ campaign } = {}) => {
  const { data } = await platformAdminApi.post("/prediction/daily-bonus/seed-from-fixtures", {
    campaign: campaign || PREDICTION_DEFAULT_CAMPAIGN_KEY,
  });
  return data;
};

export const getPredictionAdminMultiPickChallenges = async ({ campaign } = {}) => {
  const { data } = await platformAdminApi.get("/prediction/multipick/challenges", {
    params: withCampaign({}, campaign),
  });
  return data;
};

export const seedPredictionAdminMultiPickFromFixtures = async ({
  campaign,
  stageKey = "group_stage",
  replace = false,
} = {}) => {
  const { data } = await platformAdminApi.post("/prediction/multipick/seed-from-fixtures", {
    campaign: campaign || PREDICTION_DEFAULT_CAMPAIGN_KEY,
    stage_key: stageKey,
    replace,
  });
  return data;
};

export const createPredictionAdminMultiPickChallenge = async (payload) => {
  const { data } = await platformAdminApi.post("/prediction/multipick/challenges", {
    campaign: PREDICTION_DEFAULT_CAMPAIGN_KEY,
    ...payload,
  });
  return data;
};

export const updatePredictionAdminMultiPickChallenge = async (challengeId, payload) => {
  const { data } = await platformAdminApi.patch(`/prediction/multipick/challenges/${challengeId}`, payload);
  return data;
};

export const scorePredictionAdminMultiPickChallenge = async (challengeId) => {
  const { data } = await platformAdminApi.post(`/prediction/multipick/challenges/${challengeId}/score`);
  return data;
};

export const publishPredictionAdminMultiPickChallenge = async (challengeId) => {
  const { data } = await platformAdminApi.post(`/prediction/multipick/challenges/${challengeId}/publish`);
  return data;
};

export const getPredictionAdminMultiPickLeaderboard = async (challengeId) => {
  const { data } = await platformAdminApi.get(`/prediction/multipick/challenges/${challengeId}/leaderboard`);
  return data;
};
