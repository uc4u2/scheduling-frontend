export const PREDICTION_REFERRAL_STORAGE_KEY = "prediction_pending_referral";

export const capturePredictionReferralFromSearch = (search) => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(search || "");
  const ref = String(params.get("ref") || "").trim();
  const campaign = String(params.get("campaign") || "world_cup_2026").trim() || "world_cup_2026";
  if (!ref) return null;
  const payload = {
    campaign,
    ref: ref.toUpperCase(),
    capturedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(PREDICTION_REFERRAL_STORAGE_KEY, JSON.stringify(payload));
  return payload;
};

export const getStoredPredictionReferral = () => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PREDICTION_REFERRAL_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.ref) return null;
    return parsed;
  } catch (_error) {
    return null;
  }
};

export const clearStoredPredictionReferral = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PREDICTION_REFERRAL_STORAGE_KEY);
};
