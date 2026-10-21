import { jwtDecode } from "jwt-decode";
import { normalizeTenantSlug, persistTenantSlug } from "./clientTenant";
import { getTenantHostMode } from "./tenant";
import {
  buildClientOrderDashboardReturnPath,
  normalizeClientOrderReturnPath,
  normalizePackageCheckoutReturnPath,
} from "./transactionalFrameBridge";

export const CLIENT_SESSION_MESSAGE_TYPE = "schedulaa:client-session";
export const CLIENT_SESSION_REQUEST_TYPE = "schedulaa:client-session-request";
export const CLIENT_SESSION_HANDOFF_TYPE = "schedulaa:client-session-handoff";
export const CLIENT_SESSION_HANDOFF_REQUEST_TYPE = "schedulaa:client-session-handoff-request";
export const CLIENT_SESSION_HANDOFF_ACK_TYPE = "schedulaa:client-session-handoff-ack";
export const CLIENT_SESSION_LOGOUT_TYPE = "schedulaa:client-session-logout";
export const CLIENT_SESSION_STATE_EVENT = "schedulaa:client-session-state";
const HANDOFF_CODE_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const PKCE_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;
const PRESENTATION_DETAIL_BLOCKLIST = new Set([
  "token",
  "access_token",
  "authorization",
  "clientToken",
  "password",
  "email",
  "phone",
  "profile",
  "headers",
  "handoff_code",
  "handoffCode",
]);
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

const parentPresentationOrigin = () => {
  if (typeof window === "undefined" || !window.parent || window.parent === window) return "";
  try {
    return new URL(document.referrer).origin;
  } catch {
    return "";
  }
};

const presentationDetail = (detail = {}) => {
  const safe = {};
  if (!detail || typeof detail !== "object") return safe;
  Object.entries(detail).forEach(([key, value]) => {
    if (PRESENTATION_DETAIL_BLOCKLIST.has(key)) return;
    if (typeof value === "string" && HANDOFF_CODE_PATTERN.test(value)) return;
    safe[key] = value;
  });
  return safe;
};

export const publishClientSessionState = (signedIn, detail = {}) => {
  if (typeof window === "undefined" || typeof signedIn !== "boolean") return false;
  const payload = {
    ...presentationDetail(detail),
    type: CLIENT_SESSION_MESSAGE_TYPE,
    signedIn,
  };
  // A top-level legacy checkout has no Next shell listening to its event.
  // Persist the same presentation hint the Next navbar reads after navigation.
  // This hint must never authorize requests or trigger account redirects.
  const slug = normalizeTenantSlug(payload.tenantSlug);
  if (slug) {
    try {
      const key = `schedulaa:client-session:${slug}`;
      if (signedIn) localStorage.setItem(key, "1");
      else localStorage.removeItem(key);
    } catch {}
  }
  window.dispatchEvent(
    new CustomEvent(CLIENT_SESSION_STATE_EVENT, { detail: payload })
  );
  const targetOrigin = parentPresentationOrigin();
  if (targetOrigin) {
    try {
      window.parent.postMessage(payload, targetOrigin);
    } catch {}
  }
  return true;
};

const NON_CLIENT_ROLES = new Set([
  "manager",
  "employee",
  "admin",
  "platform",
  "recruiter",
  "owner",
]);

export const readClientCredential = (token = readStorage("token")) => {
  const storedRole = readStorage("role").toLowerCase();
  const credential = String(token || "").trim();
  let claims = null;
  if (credential) {
    try {
      claims = jwtDecode(credential);
    } catch {
      claims = null;
    }
  }
  const claimRole = String(claims?.role || "").toLowerCase();
  const identity = String(claims?.identity || claims?.sub || "");
  const clientClaim = claimRole === "client" || identity.startsWith("client:");
  const otherClaim = (Boolean(claimRole) && claimRole !== "client") || NON_CLIENT_ROLES.has(storedRole);
  let kind = "missing";
  if (!credential) kind = "missing";
  else if (clientClaim) kind = "client";
  else if (otherClaim || NON_CLIENT_ROLES.has(claimRole)) kind = "other";
  else if (storedRole === "client") kind = "client";
  else kind = "unknown";
  return { kind, token: credential, claims, storedRole, clientClaim };
};

let suppressClientLogoutHook = false;

const clearClientCredentialStorage = () => {
  suppressClientLogoutHook = true;
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("clientToken");
    localStorage.removeItem("role");
    localStorage.removeItem("company_id");
  } catch {}
  suppressClientLogoutHook = false;
};

const installClientLogoutHook = () => {
  const storagePrototype = typeof window !== "undefined" ? window.Storage?.prototype : null;
  if (!storagePrototype || storagePrototype.__schedulaaClientLogoutHook) return;
  const originalRemoveItem = storagePrototype.removeItem;
  storagePrototype.removeItem = function removeClientSessionItem(key) {
    if (
      !suppressClientLogoutHook
      && this === localStorage
      && key === "token"
      && this.getItem("role") === "client"
    ) {
      const slug = normalizeTenantSlug(this.getItem("site"));
      suppressClientLogoutHook = true;
      try {
        if (slug) {
          this.setItem(logoutStorageKey(slug), String(Date.now()));
          this.removeItem(`schedulaa:client-session:${slug}`);
          sessionStorage.removeItem(handoffStorageKey(slug));
        }
        this.removeItem("clientToken");
        this.removeItem("role");
        this.removeItem("company_id");
      } catch {}
      suppressClientLogoutHook = false;
      if (slug) publishClientSessionState(false, { reason: "logout", tenantSlug: slug });
    }
    return originalRemoveItem.call(this, key);
  };
  try {
    Object.defineProperty(storagePrototype, "__schedulaaClientLogoutHook", { value: true });
  } catch {}
};

const handoffStorageKey = (tenantSlug) =>
  `schedulaa:client-handoff:${normalizeTenantSlug(tenantSlug)}`;

const logoutStorageKey = (tenantSlug) =>
  `schedulaa:client-logout:${normalizeTenantSlug(tenantSlug)}`;

export const clientSessionLoggedOut = (tenantSlug) => {
  const slug = normalizeTenantSlug(tenantSlug);
  if (!slug) return false;
  try {
    return Boolean(localStorage.getItem(logoutStorageKey(slug)));
  } catch {
    return false;
  }
};

export const clearClientSessionLogout = (tenantSlug) => {
  const slug = normalizeTenantSlug(tenantSlug);
  if (!slug) return;
  try {
    localStorage.removeItem(logoutStorageKey(slug));
  } catch {}
};

export const logoutClientSession = (tenantSlug, detail = {}) => {
  const slug = normalizeTenantSlug(tenantSlug);
  const credential = readClientCredential();
  const apiClient = clientSessionBridgeApi;
  if (credential.kind === "client" && credential.token && apiClient?.post) {
    // Best effort: local logout must still complete if a device is offline.
    apiClient.post("/client-session/logout", {}, {
      headers: { Authorization: `Bearer ${credential.token}` },
      noAuth: true,
      noCompanyHeader: true,
    }).catch(() => {});
  }
  clearClientCredentialStorage();
  try {
    sessionStorage.removeItem(handoffStorageKey(slug));
    localStorage.removeItem(`schedulaa:client-session:${slug}`);
    if (slug) localStorage.setItem(logoutStorageKey(slug), String(Date.now()));
  } catch {}
  publishClientSessionState(false, {
    ...detail,
    reason: detail.reason || "logout",
    tenantSlug: slug,
  });
  return true;
};

const appOrigin = () => {
  const configured = String(process.env.REACT_APP_APP_ORIGIN || "https://app.schedulaa.com").trim();
  try { return new URL(configured).origin; } catch { return ""; }
};

/**
 * A custom tenant origin cannot write app.schedulaa.com's storage.  Instead it
 * hosts a short-lived, hidden app iframe.  The iframe owns the PKCE verifier;
 * this page only creates a code after receiving its challenge.
 */
export const bootstrapClientSessionAtAppOrigin = (tenantSlug, { apiClient } = {}) => {
  const slug = normalizeTenantSlug(tenantSlug);
  const targetOrigin = appOrigin();
  const credential = readClientCredential();
  if (!slug || getTenantHostMode() !== "custom" || !targetOrigin || !credential.token || credential.kind !== "client" || typeof document === "undefined") return false;
  const iframe = document.createElement("iframe");
  iframe.hidden = true;
  iframe.tabIndex = -1;
  iframe.setAttribute("aria-hidden", "true");
  iframe.src = `${targetOrigin}/login?site=${encodeURIComponent(slug)}&client=1&embed=1&bootstrap=1`;
  let complete = false;
  let deliveryTimer = null;
  const finish = () => {
    if (complete) return;
    complete = true;
    window.removeEventListener("message", onMessage);
    if (deliveryTimer) window.clearInterval(deliveryTimer);
    window.clearTimeout(timeout);
    iframe.remove();
  };
  const onMessage = async (event) => {
    if (event.origin !== targetOrigin || event.source !== iframe.contentWindow || !event.data || typeof event.data !== "object") return;
    if (event.data.type === CLIENT_SESSION_MESSAGE_TYPE && event.data.tenantSlug === slug && event.data.signedIn === true && event.data.reason === "authenticated") {
      finish();
      return;
    }
    if (event.data.type === CLIENT_SESSION_HANDOFF_ACK_TYPE && event.data.tenantSlug === slug) {
      if (deliveryTimer) window.clearInterval(deliveryTimer);
      return;
    }
    if (event.data.type !== CLIENT_SESSION_HANDOFF_REQUEST_TYPE || event.data.tenantSlug !== slug) return;
    const challenge = String(event.data.codeChallenge || "").trim();
    if (!PKCE_PATTERN.test(challenge) || !apiClient?.post) return finish();
    try {
      const response = await apiClient.post("/client-session/handoff", { slug, code_challenge: challenge }, {
        headers: { Authorization: `Bearer ${credential.token}` }, noAuth: true, noCompanyHeader: true,
      });
      const code = String(response?.data?.handoff_code || "").trim();
      if (complete) return;
      if (!HANDOFF_CODE_PATTERN.test(code)) return finish();
      const deliver = () => iframe.contentWindow?.postMessage(
        { type: CLIENT_SESSION_HANDOFF_TYPE, tenantSlug: slug, code }, targetOrigin,
      );
      // A static app deploy can replace the iframe document just after it
      // requests the challenge. Retry delivery until that document confirms it
      // has received the one-time code; the code remains verifier-bound.
      deliver();
      deliveryTimer = window.setInterval(deliver, 300);
    } catch { finish(); }
  };
  const timeout = window.setTimeout(finish, 70_000);
  window.addEventListener("message", onMessage);
  document.body.appendChild(iframe);
  return true;
};

installClientLogoutHook();

export const CLIENT_MEMBERSHIP_CONFIRMATION_MESSAGE =
  "We could not confirm this account for this business. Please sign in again.";

const isNonClientJwt = (credential) => {
  const claimRole = String(credential?.claims?.role || "").toLowerCase();
  const identity = String(credential?.claims?.identity || "");
  return Boolean(claimRole) && claimRole !== "client" && !identity.startsWith("client:");
};

export const persistVerifiedClientSession = (token, tenantSlug) => {
  const credential = String(token || "").trim();
  const slug = normalizeTenantSlug(tenantSlug);
  if (!credential || typeof localStorage === "undefined") return "";
  localStorage.setItem("token", credential);
  localStorage.setItem("clientToken", credential);
  localStorage.setItem("role", "client");
  if (slug) {
    persistTenantSlug(slug);
    clearClientSessionLogout(slug);
  }
  return slug;
};

const profileFromMe = (data = {}) => {
  const name = data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim();
  return { ...data, name, email: data.email || "" };
};

export const verifyClientSessionForTenant = async (
  tenantSlug,
  { apiClient, token, issuedClientCredential = false } = {},
) => {
  const slug = normalizeTenantSlug(tenantSlug);
  const credential = readClientCredential(token);
  if (issuedClientCredential && credential.token && !isNonClientJwt(credential)) {
    credential.kind = "client";
  }
  if (!credential.token) {
    return { signedIn: false, reason: "missing-token", tenantSlug: slug };
  }
  if (credential.kind !== "client") {
    return {
      signedIn: false,
      reason: credential.kind === "unknown" ? "missing-role" : "non-client-token",
      tenantSlug: slug,
    };
  }
  if (!slug) {
    return { signedIn: false, reason: "missing-tenant", tenantSlug: slug };
  }
  if (!apiClient?.get) {
    return { signedIn: false, reason: "verification-unavailable", tenantSlug: slug };
  }
  try {
    const { data } = await apiClient.get("/me", {
      params: { slug },
      headers: { Authorization: `Bearer ${credential.token}` },
      noCompanyHeader: true,
      noAuth: true,
    });
    if (!data?.email) {
      return { signedIn: false, reason: "verification-failed", tenantSlug: slug };
    }
    return {
      signedIn: true,
      reason: "verified-client-session",
      tenantSlug: slug,
      profile: profileFromMe(data),
    };
  } catch (error) {
    const status = error?.response?.status;
    if ((status === 401 || status === 422) && credential.clientClaim) {
      if (readStorage("token") === credential.token) clearClientCredentialStorage();
      return { signedIn: false, reason: "expired", tenantSlug: slug, cleared: true };
    }
    if ((status === 401 || status === 422) && credential.storedRole === "client" && !credential.claims?.role) {
      if (readStorage("token") === credential.token) clearClientCredentialStorage();
      return { signedIn: false, reason: "expired", tenantSlug: slug, cleared: true };
    }
    return {
      signedIn: false,
      reason: status === 404 ? "wrong-tenant" : "verification-failed",
      tenantSlug: slug,
    };
  }
};

const restoreStoredSession = (prior) => {
  if (typeof localStorage === "undefined") return;
  const write = (key, value) => {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  };
  write("token", prior.token);
  write("clientToken", prior.clientToken);
  write("role", prior.role);
  write("site", prior.site);
  write("company_id", prior.companyId);
};

export const confirmIssuedClientSession = async (token, tenantSlug, { apiClient } = {}) => {
  const slug = normalizeTenantSlug(tenantSlug);
  const issuedToken = String(token || "").trim();
  const prior = {
    token: readStorage("token"),
    clientToken: readStorage("clientToken"),
    role: readStorage("role"),
    site: readStorage("site"),
    companyId: readStorage("company_id"),
  };
  const failed = (reason) => {
    const storageToken = readStorage("token");
    const newerSessionWon = Boolean(storageToken) && storageToken !== issuedToken && storageToken !== prior.token;
    if (!newerSessionWon) {
      publishClientSessionState(false, { reason, tenantSlug: slug });
      if (storageToken === issuedToken && issuedToken !== prior.token) {
        restoreStoredSession(prior);
      }
    }
    return {
      signedIn: false,
      reason,
      tenantSlug: slug,
      message: CLIENT_MEMBERSHIP_CONFIRMATION_MESSAGE,
    };
  };

  if (!issuedToken || !slug || isNonClientJwt(readClientCredential(issuedToken))) {
    return failed(!issuedToken ? "missing-token" : !slug ? "missing-tenant" : "non-client-token");
  }

  const result = await verifyClientSessionForTenant(slug, {
    apiClient,
    token: issuedToken,
    issuedClientCredential: true,
  });
  const storageToken = readStorage("token");
  const newerSessionWon = Boolean(storageToken) && storageToken !== issuedToken && storageToken !== prior.token;
  if (newerSessionWon) {
    return {
      signedIn: false,
      reason: "superseded",
      tenantSlug: slug,
      message: CLIENT_MEMBERSHIP_CONFIRMATION_MESSAGE,
    };
  }
  if (result.signedIn === true) {
    persistVerifiedClientSession(issuedToken, slug);
    publishClientSessionState(true, { reason: "authenticated", tenantSlug: slug });
    return { ...result, signedIn: true, tenantSlug: slug };
  }
  return failed(result.reason || "verification-failed");
};

let clientSessionBridgeInstalled = false;
let clientSessionBridgeApi = null;

const base64Url = (bytes) => {
  let binary = "";
  bytes.forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const createPkcePair = async () => {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const verifier = base64Url(bytes);
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
};

const bootstrapRequest = async (apiClient) => {
  const query = new URLSearchParams(window.location.search);
  if (query.get("bootstrap") !== "1") return;
  const tenantSlug = normalizeTenantSlug(query.get("site"));
  const origin = parentPresentationOrigin();
  if (!tenantSlug || !origin || !window.crypto?.subtle) return;
  try {
    const { verifier, challenge } = await createPkcePair();
    const handler = (event) => {
      const data = trustedParentData(event);
      if (!data || data.type !== CLIENT_SESSION_HANDOFF_TYPE || data.tenantSlug !== tenantSlug) return;
      const code = String(data.code || "").trim();
      if (!HANDOFF_CODE_PATTERN.test(code) || !apiClient?.post) return;
      window.removeEventListener("message", handler);
      event.source.postMessage({ type: CLIENT_SESSION_HANDOFF_ACK_TYPE, tenantSlug }, event.origin);
      apiClient.post("/client-session/handoff/redeem", { code, slug: tenantSlug, code_verifier: verifier }, { noAuth: true, noCompanyHeader: true })
        .then((response) => confirmIssuedClientSession(String(response?.data?.access_token || ""), tenantSlug, { apiClient }))
        .catch(() => publishClientSessionState(false, { reason: "handoff-rejected", tenantSlug }));
    };
    window.addEventListener("message", handler);
    window.parent.postMessage({ type: CLIENT_SESSION_HANDOFF_REQUEST_TYPE, tenantSlug, codeChallenge: challenge }, origin);
    window.setTimeout(() => window.removeEventListener("message", handler), 65_000);
  } catch {
    publishClientSessionState(false, { reason: "handoff-rejected", tenantSlug });
  }
};

const trustedParentData = (event) => {
  const expectedOrigin = parentPresentationOrigin();
  if (!expectedOrigin || event.source !== window.parent || event.origin !== expectedOrigin) return null;
  const data = event.data;
  if (!data || typeof data !== "object") return null;
  return data;
};

export const installClientSessionBridge = (apiClient) => {
  clientSessionBridgeApi = apiClient || null;
  if (clientSessionBridgeInstalled || typeof window === "undefined") return () => {};
  clientSessionBridgeInstalled = true;
  void bootstrapRequest(apiClient);
  const onMessage = (event) => {
    const data = trustedParentData(event);
    if (!data) return;
    const tenantSlug = normalizeTenantSlug(data.tenantSlug);
    if (!tenantSlug) return;
    const apiClient = clientSessionBridgeApi;
    if (data.type === CLIENT_SESSION_LOGOUT_TYPE) {
      logoutClientSession(tenantSlug, { reason: "parent-logout" });
      return;
    }
    // Only bootstrapRequest owns a PKCE verifier. Never redeem codes from
    // generic presentation messages, including messages on normal login pages.
    if (data.type === CLIENT_SESSION_HANDOFF_TYPE) return;
    if (data.type !== CLIENT_SESSION_REQUEST_TYPE) return;
    verifyClientSessionForTenant(tenantSlug, { apiClient }).then((result) => {
      const reply = {
        type: CLIENT_SESSION_MESSAGE_TYPE,
        signedIn: result.signedIn === true,
        tenantSlug,
        reason: result.reason || "signed-out",
      };
      try {
        event.source.postMessage(reply, event.origin);
      } catch {}
    });
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
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
  const tenantSlug = normalizeTenantSlug(detail.tenantSlug) || readStorage("site");
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("clientToken");
    localStorage.removeItem("role");
    localStorage.removeItem("company_id");
  } catch {}
  publishClientSessionState(false, { ...detail, tenantSlug });
  return true;
};
