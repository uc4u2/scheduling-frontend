export const CLIENT_SESSION_MESSAGE_TYPE = "schedulaa:client-session";
export const CLIENT_SESSION_STATE_EVENT = "schedulaa:client-session-state";
const CLIENT_SESSION_REQUEST_TOKEN = "__schedulaaClientSessionToken";

const readStorage = (key) => {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) || "" : "";
  } catch {
    return "";
  }
};

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

export const buildClientLoginTarget = (tenantSlug, search = "") => {
  const source = new URLSearchParams(search || "");
  const query = new URLSearchParams();
  ["mode", "dialog", "primary", "text", "return_to", "returnTo"].forEach((key) => {
    if (source.has(key)) query.set(key, source.get(key));
  });
  const siteSlug = source.get("site") || String(tenantSlug || "").trim();
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
  const token = readStorage("token");
  if (role === "client" && token) config[CLIENT_SESSION_REQUEST_TOKEN] = token;
  return config;
};

const isAccountDisabledResponse = (error) => {
  const data = error?.response?.data || {};
  const code = data.code || data.error || data.error_code;
  return (
    code === "TENANT_DISABLED" ||
    code === "USER_DISABLED" ||
    data.error === "account_access_denied"
  );
};

export const isActiveClientAuthenticationRejection = (error) => {
  const requestToken = error?.config?.[CLIENT_SESSION_REQUEST_TOKEN];
  if (!requestToken || error?.config?.noAuth) return false;
  if (readStorage("role").toLowerCase() !== "client") return false;
  if (readStorage("token") !== requestToken) return false;
  return error?.response?.status === 401 || isAccountDisabledResponse(error);
};

export const invalidateActiveClientSession = (error, detail = {}) => {
  if (!isActiveClientAuthenticationRejection(error)) return false;
  // Re-check immediately before clearing so a response that lost a race with
  // a fresh login cannot remove the newly established client session.
  const requestToken = error.config[CLIENT_SESSION_REQUEST_TOKEN];
  if (readStorage("role").toLowerCase() !== "client" || readStorage("token") !== requestToken) {
    return false;
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
