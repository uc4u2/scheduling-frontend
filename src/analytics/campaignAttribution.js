const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
];

const STORAGE_KEY = "schedulaa_campaign_attribution";

const clean = (value) => String(value || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, 300);

export const captureCampaignAttribution = (search = window.location.search) => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(search || "");
  const attribution = {};
  ATTRIBUTION_KEYS.forEach((key) => {
    const value = clean(params.get(key));
    if (value) attribution[key] = value;
  });

  if (Object.keys(attribution).length) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    return attribution;
  }

  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

export const getCampaignAttribution = () => captureCampaignAttribution("");

