import { isNativeRuntime } from "./runtime";

export const APP_WEB_ORIGIN =
  process.env.REACT_APP_APP_ORIGIN || "https://app.schedulaa.com";

export const MOBILE_PAYMENTS_MESSAGE =
  "Payments & subscriptions are managed on the web. Please open schedulaa.com on desktop.";

export const isMobileComplianceMode = () => isNativeRuntime();

export const toWebAppUrl = (path = "/manager/dashboard") => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${APP_WEB_ORIGIN}${normalized}`;
};
