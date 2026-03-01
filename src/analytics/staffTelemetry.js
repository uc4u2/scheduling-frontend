const SESSION_ID_KEY = "staff_telemetry_session_id";
const SESSION_TOKEN_SIG_KEY = "staff_telemetry_token_sig";

const STAFF_ROLES = new Set(["manager", "recruiter", "employee", "owner"]);

function randomSessionId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function tokenSignature(token) {
  if (!token) return "";
  return `${token.slice(0, 12)}:${token.slice(-12)}`;
}

export function isStaffSession() {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token") || "";
  const role = String(localStorage.getItem("role") || "").toLowerCase();
  return Boolean(token) && STAFF_ROLES.has(role);
}

export function getOrCreateTelemetrySessionId() {
  if (typeof window === "undefined") return "";
  const token = localStorage.getItem("token") || "";
  if (!token) return "";
  const currentSig = tokenSignature(token);
  const storedSig = sessionStorage.getItem(SESSION_TOKEN_SIG_KEY) || "";
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY) || "";

  if (!sessionId || storedSig !== currentSig) {
    sessionId = randomSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    sessionStorage.setItem(SESSION_TOKEN_SIG_KEY, currentSig);
  }

  return sessionId;
}
