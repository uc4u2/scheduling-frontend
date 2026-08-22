const trimOrigin = (value, fallback) => {
  const source = typeof value === "string" && value.trim() ? value.trim() : fallback;
  return String(source).replace(/\/+$/, "");
};

const resolveMarketingOriginFallback = () => {
  if (typeof window !== "undefined") {
    const host = (window.location.hostname || "").toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return `${window.location.protocol}//${host}:3001`;
    }
  }
  return "https://www.schedulaa.com";
};

export const MARKETING_ORIGIN = trimOrigin(
  process.env.REACT_APP_MARKETING_ORIGIN,
  resolveMarketingOriginFallback()
);

export const APP_ORIGIN = trimOrigin(
  process.env.REACT_APP_APP_ORIGIN,
  "https://app.schedulaa.com"
);

export const buildMarketingUrl = (path = "/") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${MARKETING_ORIGIN}${cleanPath}`;
};

export const buildMarketingLegalUrl = (path = "/") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return buildMarketingUrl(`/en${cleanPath}`);
};
