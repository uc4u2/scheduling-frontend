import api from "./api";

const EMPLOYEE_ROLES = new Set(["employee", "recruiter"]);
const CLIENT_ROLES = new Set(["client", "customer"]);

const normalizeRole = (rawRole) => {
  const role = String(rawRole || "").toLowerCase();
  if (role === "manager" || role === "owner") return "manager";
  if (EMPLOYEE_ROLES.has(role)) return "employee";
  if (CLIENT_ROLES.has(role)) return "client";
  return "";
};

const extractSessionUser = (data) => {
  if (!data || typeof data !== "object") return null;
  const rawRole =
    data.role ??
    data.user?.role ??
    data.account?.role ??
    (data.is_manager ? "manager" : "");
  const role = normalizeRole(rawRole);
  const companyId =
    data.company_id ?? data.companyId ?? data.company?.id ?? data.user?.company_id ?? null;
  return {
    ...data,
    role,
    companyId,
  };
};

export const getSessionUser = async () => {
  const token =
    typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return null;

  const endpoints = ["/auth/me", "/me", "/api/auth/me"];
  for (const endpoint of endpoints) {
    try {
      const res = await api.get(endpoint, { noCompanyHeader: true });
      const user = extractSessionUser(res?.data);
      if (!user) continue;
      if (user.role) localStorage.setItem("role", user.role);
      if (user.companyId) localStorage.setItem("company_id", String(user.companyId));
      return user;
    } catch {
      // Try fallback endpoint.
    }
  }

  return null;
};

export const getAuthRedirectTarget = ({ user, searchParams }) => {
  const qs =
    searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams(searchParams || "");
  const tab = String(qs.get("tab") || "").toLowerCase();
  const plan = String(qs.get("plan") || "").toLowerCase();
  const interval = String(qs.get("interval") || "").toLowerCase();
  const returnTo = String(qs.get("returnTo") || "").trim();

  if (tab === "billing" || plan) {
    const billingParams = new URLSearchParams();
    billingParams.set("tab", "billing");
    if (plan) billingParams.set("plan", plan);
    if (interval) billingParams.set("interval", interval);
    if (returnTo) billingParams.set("returnTo", returnTo);
    return `/manager/settings?${billingParams.toString()}`;
  }

  const role = normalizeRole(user?.role);
  if (role === "manager") return "/manager/dashboard";
  if (role === "employee") return "/employee";
  if (role === "client") return "/dashboard";
  return "/manager/dashboard";
};
