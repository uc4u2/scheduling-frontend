import {
  buildClientOrderDashboardReturnPath,
  normalizeClientOrderReturnPath,
  normalizePackageCheckoutReturnPath,
} from "./transactionalFrameBridge";

export const CLIENT_SESSION_MESSAGE_TYPE = "schedulaa:client-session";
export const CLIENT_SESSION_STATE_EVENT = "schedulaa:client-session-state";
const CLIENT_SESSION_REQUEST_TOKEN = "__schedulaaClientSessionToken";
const AUTHENTICATED_REQUEST_CONTEXT = "__schedulaaAuthenticatedRequestContext";
const TRUSTED_AUTHENTICATION_REJECTION_CODES = new Set([
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
  "TOKEN_REVOKED",
  "TOKEN_SUBJECT_NOT_FOUND",
  "TOKEN_VERIFICATION_FAILED",
  "CLIENT_MEMBERSHIP_NOT_FOUND",
]);
const TRUSTED_ACCOUNT_ACCESS_CODES = new Set([
  "USER_DISABLED",
  "TENANT_DISABLED",
]);
const TENANT_SCOPED_CLIENT_REJECTION_CODES = new Set([
  "TENANT_DISABLED",
  "CLIENT_MEMBERSHIP_NOT_FOUND",
]);

const readStorage = (key) => {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) || "" : "";
  } catch {
    return "";
  }
};

const readHeader = (headers, name) => {
  if (!headers) return "";
  if (typeof headers.get === "function") {
    return String(headers.get(name) || "").trim();
  }
  const match = Object.keys(headers).find(
    (key) => key.toLowerCase() === name.toLowerCase()
  );
  return match ? String(headers[match] || "").trim() : "";
};

const requestBearerToken = (config = {}) => {
  const authorization = readHeader(config.headers, "Authorization");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return String(match?.[1] || readStorage("token")).trim();
};

const requestCompanyId = (config = {}) =>
  readHeader(config.headers, "X-Company-Id") || readStorage("company_id");

export const publishClientSessionState = (signedIn, detail = {}) => {
  if (typeof window === "undefined" || typeof signedIn !== "boolean") return false;
  const payload = { type: CLIENT_SESSION_MESSAGE_TYPE, ...detail, signedIn };
  window.dispatchEvent(
    new CustomEvent(CLIENT_SESSION_STATE_EVENT, { detail: payload })
  );
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(payload, "*");
  }
  return true;
};

export const buildClientLoginTarget = (tenantSlug, search = "", returnTo = "") => {
  const source = new URLSearchParams(search || "");
  const query = new URLSearchParams();
  ["mode", "dialog", "primary", "text"].forEach((key) => {
    if (source.has(key)) query.set(key, source.get(key));
  });
  const siteSlug = source.get("site") || String(tenantSlug || "").trim();
  const requestedReturnTo = returnTo || source.get("return_to") || source.get("returnTo") || "";
  const safeReturnTo =
    normalizePackageCheckoutReturnPath(requestedReturnTo, siteSlug) ||
    normalizeClientOrderReturnPath(requestedReturnTo, siteSlug) ||
    buildClientOrderDashboardReturnPath(search, siteSlug);
  if (safeReturnTo) query.set("return_to", safeReturnTo);
  if (siteSlug) query.set("site", siteSlug);
  query.set("client", "1");
  if (source.get("embed") === "1") {
    query.set("embed", "1");
    query.set("dialog", "1");
  }
  return `/login?${query.toString()}`;
};

export const markActiveClientSessionRequest = (config = {}) => {
  if (config.noAuth) return config;
  const role = readStorage("role").toLowerCase();
  const token = requestBearerToken(config);
  if (role && token) {
    config[AUTHENTICATED_REQUEST_CONTEXT] = {
      role,
      token,
      companyId: requestCompanyId(config),
    };
  }
  if (role === "client" && token) config[CLIENT_SESSION_REQUEST_TOKEN] = token;
  return config;
};

export const wasClientSessionRequest = (error) =>
  Boolean(error?.config?.[CLIENT_SESSION_REQUEST_TOKEN]);

export const isActiveAuthenticatedSessionRequest = (error) => {
  if (error?.config?.noAuth) return false;
  const context = error?.config?.[AUTHENTICATED_REQUEST_CONTEXT];
  if (!context?.role || !context?.token) return false;
  if (readStorage("role").toLowerCase() !== context.role) return false;
  if (readStorage("token") !== context.token) return false;
  if (readStorage("company_id") !== String(context.companyId || "")) return false;
  return true;
};

const isTrustedClientAuthenticationRejection = (error) => {
  const data = error?.response?.data || {};
  const code = data.code || data.error || data.error_code;
  const status = error?.response?.status;
  const isAuthenticationRejection =
    data.error === "authentication_rejected" &&
    TRUSTED_AUTHENTICATION_REJECTION_CODES.has(code) &&
    (status === 401 || status === 422);
  const isAccountAccessRejection =
    data.error === "account_access_denied" &&
    (TRUSTED_ACCOUNT_ACCESS_CODES.has(code) ||
      TRUSTED_AUTHENTICATION_REJECTION_CODES.has(code)) &&
    (status === 401 || status === 403);
  return isAuthenticationRejection || isAccountAccessRejection;
};

export const isAccountDisabledResponse = (error) => {
  const data = error?.response?.data || {};
  const code = data.code || data.error_code;
  return (
    data.error === "account_access_denied" &&
    TRUSTED_ACCOUNT_ACCESS_CODES.has(code) &&
    error?.response?.status === 403
  );
};

export const isActiveClientAuthenticationRejection = (error) => {
  const requestToken = error?.config?.[CLIENT_SESSION_REQUEST_TOKEN];
  if (!requestToken || error?.config?.noAuth) return false;
  if (readStorage("role").toLowerCase() !== "client") return false;
  if (readStorage("token") !== requestToken) return false;
  const data = error?.response?.data || {};
  const code = data.code || data.error || data.error_code;
  if (TENANT_SCOPED_CLIENT_REJECTION_CODES.has(code)) {
    const requestContext = error?.config?.[AUTHENTICATED_REQUEST_CONTEXT];
    if (readStorage("company_id") !== String(requestContext?.companyId || "")) {
      return false;
    }
  }
  return isTrustedClientAuthenticationRejection(error);
};

export const invalidateActiveClientSession = (error, detail = {}) => {
  if (!isActiveClientAuthenticationRejection(error)) return false;
  // Re-check immediately before clearing so a response that lost a race with
  // a fresh login cannot remove the newly established client session.
  const requestToken = error.config[CLIENT_SESSION_REQUEST_TOKEN];
  if (readStorage("role").toLowerCase() !== "client" || readStorage("token") !== requestToken) {
    return false;
  }
  const data = error?.response?.data || {};
  const code = data.code || data.error || data.error_code;
  if (TENANT_SCOPED_CLIENT_REJECTION_CODES.has(code)) {
    const requestContext = error?.config?.[AUTHENTICATED_REQUEST_CONTEXT];
    if (readStorage("company_id") !== String(requestContext?.companyId || "")) {
      return false;
    }
  }
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("clientToken");
    localStorage.removeItem("role");
    localStorage.removeItem("company_id");
  } catch {}
  publishClientSessionState(false, detail);
  return true;
};
