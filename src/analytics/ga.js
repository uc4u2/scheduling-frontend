import ReactGA from "react-ga4";

const measurementId =
  process.env.REACT_APP_GA_MEASUREMENT_ID ||
  (typeof window !== "undefined" && window.__ENV__?.GA_MEASUREMENT_ID) ||
  "";

let initialized = false;

const SAFE_CONVERSION_EVENTS = new Set([
  "registration_start",
  "registration_complete",
  "contact_submit",
  "trial_activated",
  "checkout_started",
  "subscription_activated",
]);

const SAFE_CONVERSION_PARAMETERS = new Set([
  "account_role",
  "selected_plan",
  "page_path",
  "form_name",
  "checkout_type",
  "plan_key",
  "billing_interval",
  "subscription_status",
]);

const sanitizeConversionParameters = (parameters = {}) =>
  Object.fromEntries(
    Object.entries(parameters)
      .filter(([key]) => SAFE_CONVERSION_PARAMETERS.has(key))
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.replace(/[\r\n\t]+/g, " ").trim().slice(0, 200) : value,
      ])
      .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value) && value !== "")
  );

export const initGA = () => {
  if (!measurementId || initialized) return;
  ReactGA.initialize(measurementId);
  initialized = true;
};

export const isGAEnabled = () => Boolean(measurementId) && initialized;

export const trackPageview = ({ path, title }) => {
  if (!isGAEnabled()) return;
  const safePath = String(path || "/").split(/[?#]/, 1)[0] || "/";
  ReactGA.send({
    hitType: "pageview",
    page: safePath,
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

export const trackGAEvent = (eventName, parameters = {}) => {
  if (!isGAEnabled() || !SAFE_CONVERSION_EVENTS.has(eventName)) return;
  ReactGA.event(eventName, sanitizeConversionParameters(parameters));
};

export const trackGAEventOnce = (dedupeKey, eventName, parameters = {}) => {
  if (typeof window === "undefined" || !dedupeKey) return;
  const storageKey = `ga_event:${dedupeKey}`;
  if (window.sessionStorage.getItem(storageKey)) return;
  trackGAEvent(eventName, parameters);
  if (isGAEnabled()) window.sessionStorage.setItem(storageKey, "1");
};
