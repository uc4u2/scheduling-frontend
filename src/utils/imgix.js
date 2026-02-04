const DEFAULT_IMGIX_BASE_URL = process.env.REACT_APP_IMGIX_BASE_URL || "https://assets.schedulaa.com";
const DEFAULT_PARAMS = { auto: "format,compress", fit: "crop" };

// Merges query params into Imgix URL. Accepts either full URLs or relative asset keys.
export const buildImgixUrl = (path = "", params = {}) => {
  const raw = `${path}`.trim();
  if (!raw) return "";
  const trimmed = raw.replace(/^\/+/, "");
  const isHttp = /^https?:\/\//i.test(raw);
  const isRootRelative = raw.startsWith("/");
  let baseUrl = "";

  if (isHttp) {
    baseUrl = raw;
  } else if (isRootRelative) {
    const origin = typeof window !== "undefined" && window.location ? window.location.origin : "";
    baseUrl = origin ? `${origin}${raw}` : raw;
  } else {
    baseUrl = `${DEFAULT_IMGIX_BASE_URL}/${trimmed}`;
  }

  if (!baseUrl) return raw;
  if (baseUrl.startsWith("/") && !isHttp) return raw;

  const url = new URL(baseUrl);

  const merged = { ...DEFAULT_PARAMS, ...params };
  Object.entries(merged).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      url.searchParams.set(key, value.join(","));
    } else {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

export const imgix = {
  buildUrl: buildImgixUrl,
};

export default buildImgixUrl;
