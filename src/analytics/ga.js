import ReactGA from "react-ga4";

const measurementId =
  process.env.REACT_APP_GA_MEASUREMENT_ID ||
  (typeof window !== "undefined" && window.__ENV__?.GA_MEASUREMENT_ID) ||
  "";

let initialized = false;

export const initGA = () => {
  if (!measurementId || initialized) return;
  ReactGA.initialize(measurementId);
  initialized = true;
};

export const isGAEnabled = () => Boolean(measurementId) && initialized;

export const trackPageview = ({ path, title }) => {
  if (!isGAEnabled()) return;
  ReactGA.send({
    hitType: "pageview",
    page: path,
    title,
  });
};

export const trackEvent = ({ action, category = "engagement", label, value }) => {
  if (!isGAEnabled() || !action) return;
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

