const trimOrigin = (value, fallback) => {
  const source = typeof value === "string" && value.trim() ? value.trim() : fallback;
  return String(source).replace(/\/+$/, "");
};

export const MARKETING_ORIGIN = trimOrigin(
  process.env.REACT_APP_MARKETING_ORIGIN,
  "https://www.schedulaa.com"
);

export const APP_ORIGIN = trimOrigin(
  process.env.REACT_APP_APP_ORIGIN,
  "https://app.schedulaa.com"
);

export const buildMarketingUrl = (path = "/") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${MARKETING_ORIGIN}${cleanPath}`;
};
