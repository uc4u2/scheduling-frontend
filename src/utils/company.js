// src/utils/company.js
import api from "./api";

/** Base64URL decode (no padding) */
function b64urlDecode(input = "") {
  try {
    const pad = "=".repeat((4 - (input.length % 4)) % 4);
    const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
    return atob(base64);
  } catch {
    return "";
  }
}

function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(b64urlDecode(payload) || "{}");
  } catch {
    return {};
  }
}

export function setCachedCompanyId(id) {
  if (id && Number(id) > 0) localStorage.setItem("company_id", String(id));
}
export function getCachedCompanyId() {
  const raw = localStorage.getItem("company_id");
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Try multiple sources to determine company id, cache, and return it.
 * Safe to call anywhere in the app.
 */
export async function ensureCompanyId() {
  // 1) cached
  const cached = getCachedCompanyId();
  if (cached) return cached;

  // 2) from JWT payload, common keys
  const token = localStorage.getItem("token");
  if (token) {
    const payload = decodeJwt(token);
    const guess =
      payload.company_id ||
      payload.companyId ||
      payload.company?.id ||
      payload.cid ||
      null;
    if (guess && Number(guess) > 0) {
      setCachedCompanyId(guess);
      return Number(guess);
    }
  }

  // 3) ask backend via a few likely endpoints (any that respond will do)
  const candidates = [
    "/manager/company-id",
    "/manager/company",
    "/api/company/me",
    "/admin/company-profile", // often returns the current company
    "/api/me",
  ];

  for (const path of candidates) {
    try {
      const { data } = await api.get(path);
      // try a handful of shapes
      const id =
        data?.company_id ??
        data?.id ??
        data?.company?.id ??
        data?.profile?.company_id ??
        null;

      if (id && Number(id) > 0) {
        setCachedCompanyId(id);
        return Number(id);
      }
    } catch {
      // ignore and continue to next candidate
    }
  }

  // 4) last resort: null (caller can still pass an explicit id)
  return null;
}
