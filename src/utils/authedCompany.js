// src/utils/authedCompany.js

/** Base64URL decode with padding fix (safe for JWT parts) */
function b64urlDecode(input = "") {
  try {
    const pad = "=".repeat((4 - (input.length % 4)) % 4);
    const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
    // atob is browser-only; guard for SSR/tests
    if (typeof atob !== "function") return "";
    return atob(base64);
  } catch {
    return "";
  }
}

export function decodeJwt(token = "") {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return {};
    const json = b64urlDecode(parts[1]);
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}

/** Cache helpers (used by hook & axios interceptor) */
export function setCachedCompanyId(id) {
  const n = Number(id);
  if (Number.isFinite(n) && n > 0 && typeof localStorage !== "undefined") {
    localStorage.setItem("company_id", String(n));
  }
}
export function getCachedCompanyId() {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem("company_id");
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}
export function clearCachedCompanyId() {
  try { localStorage.removeItem("company_id"); } catch {}
}

/**
 * Resolve the current company id.
 * Precedence:
 *   1) ?company_id= in URL (if allowQuery)
 *   2) cached localStorage "company_id"
 *   3) JWT payload common keys (company_id | companyId | company.id | cid)
 *   4) (optional) dev default = 1 when on localhost
 */
export function getAuthedCompanyId(opts = {}) {
  const {
    allowQuery = true,
    preferCache = true,
    preferJwt = true,
    devDefault = 1,
  } = opts;

  // 1) URL param (optional)
  try {
    if (allowQuery && typeof window !== "undefined" && window.location?.search) {
      const q = new URLSearchParams(window.location.search);
      const fromQ = q.get("company_id") || q.get("cid");
      const n = Number(fromQ);
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch {}

  // 2) cached
  if (preferCache) {
    const cached = getCachedCompanyId();
    if (cached) return cached;
  }

  // 3) JWT
  try {
    if (preferJwt && typeof localStorage !== "undefined") {
      const token = localStorage.getItem("token") || "";
      if (token) {
        const p = decodeJwt(token);
        const guess =
          p.company_id ??
          p.companyId ??
          p.company?.id ??
          p.cid ??
          null;
        const n = Number(guess);
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
  } catch {}

  // 4) Dev default only on localhost / .local
  try {
    if (
      typeof window !== "undefined" &&
      (/^localhost$|^127\.0\.0\.1$/.test(window.location.hostname) ||
        window.location.hostname.endsWith(".local"))
    ) {
      return devDefault; // usually 1
    }
  } catch {}

  return null;
}

/**
 * Listen for cross-tab company_id changes.
 * Returns an unsubscribe() function.
 */
export function onCompanyIdChange(handler) {
  if (typeof window === "undefined") return () => {};
  const fn = (e) => {
    if (e.key === "company_id") {
      const n = e.newValue ? Number(e.newValue) : null;
      handler(Number.isFinite(n) && n > 0 ? n : null);
    }
  };
  window.addEventListener("storage", fn);
  return () => window.removeEventListener("storage", fn);
}
