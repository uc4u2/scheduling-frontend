export const normalizeTenantSlug = (value) => {
  const raw = String(value || "").trim();
  return raw || "";
};

export const getStoredTenantSlug = () => {
  if (typeof localStorage === "undefined") return "";
  return normalizeTenantSlug(localStorage.getItem("site"));
};

export const persistTenantSlug = (value) => {
  const slug = normalizeTenantSlug(value);
  if (!slug || typeof localStorage === "undefined") return "";
  localStorage.setItem("site", slug);
  return slug;
};

export const resolveTenantSlug = ({
  explicitSlug = "",
  routeSlug = "",
  search = "",
  fallbackToStored = true,
} = {}) => {
  const direct = normalizeTenantSlug(explicitSlug) || normalizeTenantSlug(routeSlug);
  if (direct) return direct;

  try {
    const qs = new URLSearchParams(search || "");
    const fromQuery = normalizeTenantSlug(qs.get("site"));
    if (fromQuery) return fromQuery;
  } catch {}

  return fallbackToStored ? getStoredTenantSlug() : "";
};

export const tenantParams = (slug) => {
  const normalized = normalizeTenantSlug(slug);
  return normalized ? { slug: normalized } : {};
};

export const buildTenantLoginPath = (slug) => {
  const normalized = normalizeTenantSlug(slug);
  return normalized ? `/login?site=${encodeURIComponent(normalized)}` : "/login";
};

export const buildTenantDashboardPath = (slug, extra = {}) => {
  const params = new URLSearchParams();
  const normalized = normalizeTenantSlug(slug);
  if (normalized) params.set("site", normalized);
  Object.entries(extra || {}).forEach(([key, value]) => {
    if (value == null || value === "") return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
};
