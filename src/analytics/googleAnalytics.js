let cachedMeasurementId = null;
let scriptInjected = false;

const isValidMeasurementId = (value) =>
  typeof value === "string" && /^G-[A-Z0-9]+/i.test(value.trim());

const readMeasurementId = () => {
  if (cachedMeasurementId) return cachedMeasurementId;

  let value = null;

  if (typeof window !== "undefined") {
    const fromWindow =
      window.__ENV__?.GA_MEASUREMENT_ID || window.GA_MEASUREMENT_ID || null;
    if (isValidMeasurementId(fromWindow)) {
      cachedMeasurementId = fromWindow.trim();
      return cachedMeasurementId;
    }
  }

  if (typeof process !== "undefined" && process && process.env) {
    const fromEnv = process.env.REACT_APP_GA_MEASUREMENT_ID;
    if (isValidMeasurementId(fromEnv)) {
      cachedMeasurementId = fromEnv.trim();
      return cachedMeasurementId;
    }
  }

  cachedMeasurementId = null;
  return cachedMeasurementId;
};

export const getMeasurementId = () => readMeasurementId();

export const initAnalytics = () => {
  if (typeof document === "undefined") return null;

  const measurementId = readMeasurementId();
  if (!measurementId) return null;

  if (!scriptInjected) {
    const existingScript = document.querySelector('script[data-ga-loader="true"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      script.setAttribute("data-ga-loader", "true");
      document.head.appendChild(script);
    }

    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.gtag =
        window.gtag ||
        function gtag() {
          window.dataLayer.push(arguments);
        };
      window.gtag("js", new Date());
    }

    scriptInjected = true;
  }

  return measurementId;
};

export const trackPageView = (path) => {
  const measurementId = initAnalytics();
  if (!measurementId) return;
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  const pagePath =
    typeof path === "string" && path.length
      ? path
      : window.location?.pathname || "/";

  const payload = { page_path: pagePath };
  const isDev =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "development";
  if (isDev) payload.debug_mode = true;

  window.gtag("config", measurementId, payload);
};
