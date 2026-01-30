// src/utils/api.js
import axios from "axios";
import { clearCachedCompanyId, getAuthedCompanyId } from "./authedCompany";
import { captureCurrencyFromResponse } from "./currency";

/* ------------------------------ Base URL ------------------------------ */
const viteBase =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "";

const procEnv =
  typeof process !== "undefined" && process.env ? process.env : {};

const envBase =
  viteBase ||
  procEnv.VITE_API_BASE_URL ||
  procEnv.REACT_APP_API_URL ||
  "";

const inferBase = () => {
  try {
    if (
      typeof window !== "undefined" &&
      (/^localhost$|^127\.0\.0\.1$/.test(window.location.hostname) ||
        window.location.hostname.endsWith(".local"))
    ) {
      return "http://localhost:5000";
    }
    if (
      typeof window !== "undefined" &&
      window.location &&
      typeof window.location.hostname === "string"
    ) {
      const host = window.location.hostname.toLowerCase();
      if (
        host === "schedulaa.com" ||
        host === "www.schedulaa.com" ||
        host.endsWith(".schedulaa.com")
      ) {
        return "https://scheduling-application.onrender.com";
      }
      // Custom domains should still call the shared backend.
      return "https://scheduling-application.onrender.com";
    }
  } catch {}
  return "/";
};

export const API_BASE_URL = envBase || inferBase();

const normalizeMediaAsset = (asset, companyId) => {
  if (!asset) return null;
  const stored =
    asset.stored_name ||
    (asset.key ? String(asset.key).split("/").slice(-1)[0] : undefined);
  const variantList = Array.isArray(asset.variants)
    ? asset.variants
    : Array.isArray(asset.variant_urls)
    ? asset.variant_urls
    : [];
  const variantUrl =
    variantList.find((v) => v?.url)?.url ||
    variantList.find((v) => v?.href)?.href ||
    null;
  const absolutize = (value) => {
    if (!value || typeof value !== "string") return value;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/")) {
      return `${String(API_BASE_URL).replace(/\/$/, "")}${value}`;
    }
    return value;
  };
  const fallbackUrl = stored
    ? `/api/website/media/file/${companyId || "company"}/${stored}`
    : undefined;
  const finalUrl = absolutize(
    asset.url ||
      asset.url_public ||
      variantUrl ||
      fallbackUrl
  );
  return {
    ...asset,
    stored_name: stored,
    url: finalUrl,
  };
};

/* ------------------------------ Axios ------------------------------ */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});
export { api };

/* -------------------- Auth + Company header injector -------------------- */
api.interceptors.response.use(
  (resp) => {
    try {
      captureCurrencyFromResponse(resp?.data);
    } catch {}
    return resp;
  },
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data || {};
    const code = data.code || data.error || data.error_code;
    const userMessage = data.user_message || data.message || data.detail;
    const skipBillingModal = Boolean(error?.config?.skipBillingModal);
    const companyError = typeof data?.error === "string" ? data.error : null;

    if (
      (status === 403 || status === 400) &&
      (companyError === "Company mismatch" || companyError === "X-Company-Id required")
    ) {
      try { clearCachedCompanyId(); } catch {}
      error.companyIdReset = true;
    }

    if (status === 412 || code === 'STRIPE_ONBOARDING_INCOMPLETE') {
      error.code = code || 'STRIPE_ONBOARDING_INCOMPLETE';
      error.stripeOnboardingIncomplete = true;
    }

    if (userMessage && !error.displayMessage) {
      error.displayMessage = userMessage;
    }

    if (!skipBillingModal && status === 402 && data?.error === "subscription_required") {
      if (typeof window !== "undefined") {
        const audience = data?.audience || "manager";
        if (audience === "public") {
          window.dispatchEvent(
            new CustomEvent("billing:public-unavailable", {
              detail: {
                message: data?.message || "",
              },
            })
          );
        } else {
          window.dispatchEvent(
            new CustomEvent("billing:upgrade-required", {
              detail: {
                requiredPlan: data?.required_plan || null,
                message: data?.message || "",
                action: data?.action || "",
                audience,
              },
            })
          );
        }
      }
    }

    if (!skipBillingModal && status === 409 && data?.error === "limit_exceeded" && data?.limit === "seats") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("billing:seats-required", {
            detail: {
              allowed: data?.allowed,
              current: data?.current,
            },
          })
        );
      }
    }

    if (!skipBillingModal && status === 409 && data?.error === "limit_exceeded" && data?.limit !== "seats") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("billing:upgrade-required", {
            detail: {
              requiredPlan: data?.required_plan || null,
              message: data?.message || "",
              action: data?.action || "upgrade",
            },
          })
        );
      }
    }

    return Promise.reject(error);
  }
);

api.interceptors.request.use((config) => {
  // Bearer token
  const token =
    typeof localStorage !== "undefined" && localStorage.getItem("token");
  if (token && !config.noAuth) config.headers.Authorization = `Bearer ${token}`;

  // Don’t attach company for public routes or when explicitly disabled
  const fullUrl =
    (config.baseURL ? String(config.baseURL).replace(/\/$/, "") : "") +
    String(config.url || "");
  const isPublic = /\/public\//.test(fullUrl) || config.noCompanyHeader;

  if (!isPublic && !config?.headers?.["X-Company-Id"] && !config?.noCompanyHeader) {
    const cid = getAuthedCompanyId?.();
    if (cid) config.headers["X-Company-Id"] = Number(cid);
  }

  return config;
});

/* ------------------------------ Helpers ------------------------------ */
const withCompany = (companyId) =>
  companyId ? { headers: { "X-Company-Id": Number(companyId) } } : {};

const withNoCompany = (config = {}) => ({ ...config, noCompanyHeader: true });

const asJSON = (obj) => {
  try { return JSON.stringify(obj ?? {}); } catch { return "{}"; }
};

// PUT with CORS-safe fallback (X-HTTP-Method-Override)
const putWithFallback = async (url, payload, cfg = {}) => {
  try {

    return await api.put(url, payload, cfg);
  } catch (err) {
    if (!err?.response) {
      const h = { ...(cfg.headers || {}), "X-HTTP-Method-Override": "PUT" };
      return await api.post(url, payload, { ...cfg, headers: h });
    }
    throw err;
  }
};

/* ------------------------------ Questionnaire Templates ------------------------------ */
export const questionnaires = {
  list: (params = {}, config = {}) =>
    api
      .get("/api/questionnaires", { params, ...config })
      .then((r) => r.data),
  available: (params = {}, config = {}) =>
    api
      .get("/api/questionnaires/available", { params, ...config })
      .then((r) => r.data),
  create: (payload, config = {}) =>
    api.post("/api/questionnaires", payload, config).then((r) => r.data),
  update: (id, payload, config = {}) =>
    putWithFallback(`/api/questionnaires/${id}`, payload, config).then((r) => r.data),
  publish: (id, config = {}) =>
    api.post(`/api/questionnaires/${id}/publish`, {}, config).then((r) => r.data),
  archive: (id, config = {}) =>
    api.post(`/api/questionnaires/${id}/archive`, {}, config).then((r) => r.data),
  remove: (id, config = {}) =>
    api.delete(`/api/questionnaires/${id}`, config).then((r) => r.data),
};

/* ------------------------------ Time Tracking ------------------------------ */
export const timeTracking = {
  getSettings: (config = {}) =>
    api.get("/admin/time-tracking-settings", config).then((r) => r.data?.policy || r.data),
  saveSettings: (payload, config = {}) =>
    api.post("/admin/time-tracking-settings", payload, config).then((r) => r.data),
  clockIn: (shiftId, config = {}) =>
    api.post(`/employee/shifts/${shiftId}/clock-in`, {}, config).then((r) => r.data),
  clockOut: (shiftId, config = {}) =>
    api.post(`/employee/shifts/${shiftId}/clock-out`, {}, config).then((r) => r.data),
  startBreak: (shiftId, config = {}) =>
    api.post(`/employee/shifts/${shiftId}/break-start`, {}, config).then((r) => r.data),
  endBreak: (shiftId, config = {}) =>
    api.post(`/employee/shifts/${shiftId}/break-end`, {}, config).then((r) => r.data),
  listEntries: (params = {}, config = {}) =>
    api.get("/manager/time-entries", { params, ...config }).then((r) => r.data),
  managerHistory: (params = {}, config = {}) =>
    api.get("/manager/time-entries/history", { params, ...config }).then((r) => r.data),
  approveEntry: (id, config = {}) =>
    api.post(`/manager/time-entries/${id}/approve`, {}, config).then((r) => r.data),
  rejectEntry: (id, payload = {}, config = {}) =>
    api.post(`/manager/time-entries/${id}/reject`, payload, config).then((r) => r.data),
  forceClockOut: (id, payload = {}, config = {}) =>
    api.post(`/manager/time-entries/${id}/force-clock-out`, payload, config).then((r) => r.data),
  deleteEntry: (id, config = {}) =>
    api.delete(`/manager/time-entries/${id}`, config).then((r) => r.data),
  bulkAdjustEntries: (payload = {}, config = {}) =>
    api.post("/manager/time-entries/bulk-adjust", payload, config).then((r) => r.data),
  employeeSummary: (params = {}, config = {}) =>
    api.get("/employee/time-summary", { params, ...config }).then((r) => r.data),
  employeeHistory: (params = {}, config = {}) =>
    api.get("/employee/time-history", { params, ...config }).then((r) => r.data),
  listTemplates: (config = {}) =>
    api.get("/api/shift-templates", config).then((r) => r.data),
};

/* ------------------------------ Invitation Questionnaire Assignments ------------------------------ */
export const invitationQuestionnaires = {
  list: (invitationId, config = {}) =>
    api
      .get(`/api/invitations/${invitationId}/questionnaires`, config)
      .then((r) => r.data),
  replace: (invitationId, assignments = [], config = {}) =>
    api
      .put(
        `/api/invitations/${invitationId}/questionnaires`,
        Array.isArray(assignments) ? assignments : { questionnaires: assignments },
        config
      )
      .then((r) => r.data),
  remove: (invitationId, templateId, config = {}) =>
    api
      .delete(`/api/invitations/${invitationId}/questionnaires/${templateId}`, config)
      .then((r) => r.data),
  reorder: (invitationId, templateIds = [], config = {}) =>
    api
      .post(
        `/api/invitations/${invitationId}/questionnaires/reorder`,
        Array.isArray(templateIds) ? templateIds : templateIds,
        config
      )
      .then((r) => r.data),
};

/* ------------------------------ Xero Integration ------------------------------ */
export const xeroIntegration = {
  status: (config = {}) => api.get("/integrations/xero/status", config).then((r) => r.data),
  connect: (config = {}) => api.post("/integrations/xero/connect", {}, config).then((r) => r.data),
  disconnect: (config = {}) => api.post("/integrations/xero/disconnect", {}, config).then((r) => r.data),
  accounts: (config = {}) => api.get("/integrations/xero/accounts", config).then((r) => r.data),
  presets: (config = {}) => api.get("/integrations/xero/presets", config).then((r) => r.data),
  saveSettings: (payload, config = {}) =>
    api.post("/integrations/xero/settings", payload, config).then((r) => r.data),
  listAccountMap: (config = {}) => api.get("/integrations/xero/account-map", config).then((r) => r.data),
  upsertAccountMap: (payload, config = {}) =>
    api.post("/integrations/xero/account-map", payload, config).then((r) => r.data),
  deleteAccountMap: (id, config = {}) =>
    api.delete(`/integrations/xero/account-map/${id}`, config).then((r) => r.data),
  listTrackingMap: (config = {}) => api.get("/integrations/xero/tracking-map", config).then((r) => r.data),
  upsertTrackingMap: (payload, config = {}) =>
    api.post("/integrations/xero/tracking-map", payload, config).then((r) => r.data),
  deleteTrackingMap: (id, config = {}) =>
    api.delete(`/integrations/xero/tracking-map/${id}`, config).then((r) => r.data),
  validate: (config = {}) => api.get("/integrations/xero/validate", config).then((r) => r.data),
  preview: (payload, config = {}) =>
    api.post("/integrations/xero/export-preview", payload, config).then((r) => r.data),
  exportPayroll: (payload, config = {}) =>
    api.post("/integrations/xero/export-payroll", payload, config).then((r) => r.data),
  exportRevenue: (payload, config = {}) =>
    api.post("/integrations/xero/export-revenue", payload, config).then((r) => r.data),
};

/* ------------------------------ QuickBooks Integration ------------------------------ */
export const quickbooksIntegration = {
  status: (config = {}) => api.get("/integrations/quickbooks/status", config).then((r) => r.data),
  connect: (config = {}) => api.post("/integrations/quickbooks/connect", {}, config).then((r) => r.data),
  disconnect: (config = {}) =>
    api.post("/integrations/quickbooks/disconnect", {}, config).then((r) => r.data),
  accounts: (config = {}) => api.get("/integrations/quickbooks/accounts", config).then((r) => r.data),
  presets: (config = {}) => api.get("/integrations/quickbooks/presets", config).then((r) => r.data),
  saveSettings: (payload, config = {}) =>
    api.post("/integrations/quickbooks/settings", payload, config).then((r) => r.data),
  listAccountMap: (config = {}) =>
    api.get("/integrations/quickbooks/account-map", config).then((r) => r.data),
  upsertAccountMap: (payload, config = {}) =>
    api.post("/integrations/quickbooks/account-map", payload, config).then((r) => r.data),
  deleteAccountMap: (id, config = {}) =>
    api.delete(`/integrations/quickbooks/account-map/${id}`, config).then((r) => r.data),
  listTrackingMap: (config = {}) =>
    api.get("/integrations/quickbooks/tracking-map", config).then((r) => r.data),
  upsertTrackingMap: (payload, config = {}) =>
    api.post("/integrations/quickbooks/tracking-map", payload, config).then((r) => r.data),
  deleteTrackingMap: (id, config = {}) =>
    api.delete(`/integrations/quickbooks/tracking-map/${id}`, config).then((r) => r.data),
  validate: (config = {}) => api.get("/integrations/quickbooks/validate", config).then((r) => r.data),
  preview: (payload, config = {}) =>
    api.post("/integrations/quickbooks/export-preview", payload, config).then((r) => r.data),
  exportPayroll: (payload, config = {}) =>
    api.post("/integrations/quickbooks/export-payroll", payload, config).then((r) => r.data),
  exportRevenue: (payload, config = {}) =>
    api.post("/integrations/quickbooks/export-revenue", payload, config).then((r) => r.data),
  exportInvoices: (payload, config = {}) =>
    api.post("/integrations/quickbooks/export-invoices", payload, config).then((r) => r.data),
};

export const integrationActivity = {
  list: (params = {}, config = {}) =>
    api
      .get("/integrations/activity", { params, ...config })
      .then((r) => r.data),
};

/* ------------------------------ Questionnaire Uploads ------------------------------ */
export const questionnaireUploadsApi = {
  reserveRecruiter: (payload, config = {}) =>
    api.post("/api/questionnaires/uploads", payload, config).then((r) => r.data),
  reserveCandidate: (token, payload, config = {}) =>
    api
      .post(
        `/api/candidate-form-submissions/${encodeURIComponent(token)}/uploads`,
        payload,
        withNoCompany(config)
      )
      .then((r) => r.data),
  completeRecruiter: (fileId, config = {}) =>
    api.post(`/api/questionnaires/uploads/${fileId}/complete`, {}, config).then((r) => r.data),
  completeCandidate: (token, fileId, config = {}) =>
    api
      .post(
        `/api/candidate-form-submissions/${encodeURIComponent(token)}/uploads/${fileId}/complete`,
        {},
        withNoCompany(config)
      )
      .then((r) => r.data),
  downloadRecruiter: (fileId, config = {}) =>
    api.get(`/api/questionnaires/uploads/${fileId}/download`, config),
  downloadCandidate: (token, fileId, config = {}) =>
    api.get(
      `/api/candidate-form-submissions/${encodeURIComponent(token)}/uploads/${fileId}/download`,
      withNoCompany(config)
    ),
};

/* ------------------------------ Candidate Intake ------------------------------ */
export const candidateIntakeApi = {
  get: (token, config = {}) =>
    api
      .get(
        `/api/candidate-forms/intake/${encodeURIComponent(token)}`,
        withNoCompany(config)
      )
      .then((r) => r.data),
  save: (token, payload, config = {}) =>
    api
      .patch(
        `/api/candidate-forms/intake/${encodeURIComponent(token)}`,
        payload,
        withNoCompany(config)
      )
      .then((r) => r.data),
  submit: (token, payload, config = {}) =>
    api
      .post(
        `/api/candidate-forms/intake/${encodeURIComponent(token)}/submit`,
        payload,
        withNoCompany(config)
      )
      .then((r) => r.data),
  bookSlot: (token, payload, config = {}) =>
    api
      .post(
        `/api/candidate-forms/intake/${encodeURIComponent(token)}/book-slot`,
        payload,
        withNoCompany(config)
      )
      .then((r) => r.data),
  listSubmissions: (params = {}, config = {}) =>
    api
      .get(`/api/candidate-forms/submissions`, { params, ...config })
      .then((r) => r.data),
};
export const settingsApi = {
  get: (config = {}) => api.get("/settings", config).then((r) => r.data),
  update: (payload = {}, config = {}) => api.post("/settings", payload, config).then((r) => r.data),
};



/* ------------------------------ Stripe Connect ------------------------------ */
export const stripeConnect = {
  getStatus: (config = {}) => api.get('/connect/status', config).then((r) => r.data),
  startOnboarding: (body = {}, config = {}) =>
    api.post('/connect/start', body, config).then((r) => r.data),
  refreshOnboardingLink: (body = {}, config = {}) =>
    api.post('/connect/refresh-link', body, config).then((r) => r.data),
  reset: (body = {}, config = {}) =>
    api.post('/connect/reset', body, config).then((r) => r.data),
  dashboardLogin: (body = {}, config = {}) =>
    api.post('/connect/dashboard-login', body, config).then((r) => r.data),
};

export const isStripeOnboardingIncomplete = (err) =>
  Boolean(
    err?.stripeOnboardingIncomplete ||
      err?.code === 'STRIPE_ONBOARDING_INCOMPLETE' ||
      err?.response?.status === 412
  );

/* ------------------------------ WEBSITE (public/admin) ------------------------------ */
export const website = {
  listTemplates: () => api.get("/api/website/templates").then((r) => r.data),

  getTemplate: (key, version) =>
    api
      .get(`/api/website/templates/${encodeURIComponent(key)}`, {
        params: version ? { version } : {},
      })
      .then((r) => r.data),

  importTemplate: (body, { companyId } = {}) =>
    api
      .post(
        "/api/website/templates/import",
        body,
        {
          ...withCompany(companyId),
          params: companyId ? { company_id: companyId } : {},
        }
      )
      .then((r) => r.data),

  // Media library (WebsiteMedia-backed)
  listMedia: ({ offset = 0, limit = 30, companyId } = {}) =>
    api
      .get("/api/website/media", {
        params: { offset, limit },
        ...withCompany(companyId),
      })
      .then((r) => {
        const items = Array.isArray(r?.data?.items) ? r.data.items : [];
        return {
          ...(r?.data || {}),
          items: items.map((item) => normalizeMediaAsset(item, companyId)),
        };
      }),

  uploadMedia: async (files, { companyId } = {}) => {
    const fd = new FormData();
    const list = Array.isArray(files) ? files : [files];
    if (!list.length) {
      return { items: [] };
    }
    fd.append("file", list[0]);
    const res = await api.post("/api/website/media", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      ...withCompany(companyId),
    });
    const items = Array.isArray(res?.data?.items) ? res.data.items : [];
    return {
      items: items.map((item) => normalizeMediaAsset(item, companyId)).filter(Boolean),
    };
  },

  deleteMedia: (mediaId, { companyId } = {}) =>
    api
      .delete(`/api/website/media/${mediaId}`, withCompany(companyId))
      .then((r) => r.data),

  mediaFileUrl: (companyId, storedNameOrUrl) => {
    if (!storedNameOrUrl) return "";
    if (/^https?:\/\//i.test(storedNameOrUrl)) return storedNameOrUrl;
    const base = String(API_BASE_URL).replace(/\/$/, "");
    if (storedNameOrUrl.startsWith("/")) {
      return `${base}${storedNameOrUrl}`;
    }
    return `${base}/api/website/media/file/${companyId}/${storedNameOrUrl}`;
  },

  // Server-side preview
  preview: ({ page, theme_overrides, companyId } = {}) =>
    api
      .get("/api/website/preview", {
        params: {
          ...(page ? { page } : {}),
          ...(theme_overrides ? { theme_overrides: asJSON(theme_overrides) } : {}),
        },
        ...withCompany(companyId),
      })
      .then((r) => r.data),

  /* ---------- NEW: Site-wide page style helpers ---------- */

  // GET default page style (for editor display/merge)
  getSitePageStyleDefault: () =>
    api.get("/api/website/style/default").then((r) => r.data),

  // PUT default page style
  putSitePageStyleDefault: (pageStyle) =>
    putWithFallback("/api/website/style/default", { pageStyle }).then(
      (r) => r.data
    ),

  // POST apply default style to all pages
  applyStyleToAllPages: (opts = {}) =>
    api
      .post("/api/website/style/apply", {
        mode: opts.mode || "merge",
        includeBackground: opts.includeBackground ?? true,
        includeFonts: opts.includeFonts ?? true,
        includeCards: opts.includeCards ?? true,
        includeHero: opts.includeHero ?? true,
      })
      .then((r) => r.data),
};

export const websiteAdmin = {
  // Themes
  listThemes: async ({ companyId } = {}) => {
    const res = await api.get(`/admin/website/themes`, withCompany(companyId));
    const raw = res?.data;
    const items = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return { data: items };
  },

  // Settings
  getSettings: ({ companyId } = {}) =>
    api.get(`/api/website/settings`, withCompany(companyId)),

  saveSettings: (payload, { companyId } = {}) =>
    putWithFallback(`/api/website/settings`, payload, withCompany(companyId)),

  publish: (is_live = true, { companyId } = {}) => {
    if (is_live) {
      return api.post(`/admin/website/publish`, {}, withCompany(companyId));
    }
    const body = { is_live: false, _draft_only: true, _publish_now: false };
    return api.put(`/api/website/settings`, body, withCompany(companyId));
  },

  connectDomain: (custom_domain, { companyId } = {}) =>
    api.post(`/admin/website/connect-domain`, { custom_domain }, withCompany(companyId)),
  verifyDomain: ({ companyId } = {}) =>
    api.get(`/admin/website/verify-domain`, withCompany(companyId)),
};


export const websiteDomains = {
  status: (companyId) =>
    api
      .get('/api/domains/status', {
        params: { company_id: companyId },
        ...withCompany(companyId),
      })
      .then((r) => r.data),

  request: (companyId, domain, options = {}) =>
    api
      .post(
        '/api/domains/request',
        { company_id: companyId, domain, ...(options || {}) },
        withCompany(companyId)
      )
      .then((r) => r.data),

  verify: (companyId) =>
    api
      .post(
        '/api/domains/verify',
        { company_id: companyId },
        withCompany(companyId)
      )
      .then((r) => r.data),

  remove: (companyId) =>
    api
      .delete('/api/domains', {
        data: { company_id: companyId },
        ...withCompany(companyId),
      })
      .then((r) => r.data),

  connectStart: (companyId, payload = {}) =>
    api
      .post(
        '/api/domains/connect/start',
        { company_id: companyId, ...(payload || {}) },
        withCompany(companyId)
      )
      .then((r) => r.data),

  connectSession: (companyId, sessionId) =>
    api
      .get(`/api/domains/connect/session/${sessionId}`, {
        params: { company_id: companyId },
        ...withCompany(companyId),
      })
      .then((r) => r.data),

  notify: (companyId, enabled) =>
    api
      .post(
        '/api/domains/notify',
        { company_id: companyId, notify_email_enabled: Boolean(enabled) },
        withCompany(companyId)
      )
      .then((r) => r.data),
};

// Public JSON (no company header)
const _publicShellCache = new Map();
const _publicPageCache = new Map();
const _publicChatbotCache = new Map();
const _publicServiceCache = new Map();
const _publicServiceEmployeesCache = new Map();
const _PUBLIC_CACHE_TTL = 5 * 60 * 1000;
const _PUBLIC_VERSION_KEY = "sched_public_site_version";
const _PUBLIC_CACHE_DEBUG =
  typeof window !== "undefined" &&
  (!process.env.NODE_ENV || process.env.NODE_ENV !== "production");

const _getVersionMap = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(_PUBLIC_VERSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const _setVersionMap = (map) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(_PUBLIC_VERSION_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
};

const _getPublicVersion = (slug) => {
  const keySlug = String(slug || "").trim().toLowerCase();
  if (!keySlug) return "";
  const map = _getVersionMap();
  return map[keySlug] || "";
};

const _setPublicVersion = (slug, version, source = "") => {
  const keySlug = String(slug || "").trim().toLowerCase();
  if (!keySlug) return;
  const v = version ? String(version) : "";
  const map = _getVersionMap();
  if (v) {
    map[keySlug] = v;
    if (_PUBLIC_CACHE_DEBUG) {
      console.debug(
        "[publicSite] cache version set",
        { slug: keySlug, version: v, source: source || "unknown" }
      );
    }
  } else {
    delete map[keySlug];
  }
  _setVersionMap(map);
};

const _keyWithVersion = (key, slug) => {
  const v = _getPublicVersion(slug);
  return v ? `${key}:v=${v}` : key;
};

const _versionParam = (slug) => {
  const v = _getPublicVersion(slug);
  return v ? { v } : {};
};
const _publicCacheStores = [
  _publicShellCache,
  _publicPageCache,
  _publicChatbotCache,
  _publicServiceCache,
  _publicServiceEmployeesCache,
];

const _getCached = (store, key) => {
  const cached = store.get(key);
  if (!cached) return null;
  const [expiresAt, promise] = cached;
  if (Date.now() > expiresAt) {
    store.delete(key);
    return null;
  }
  return promise;
};

const _setCached = (store, key, promise) => {
  store.set(key, [Date.now() + _PUBLIC_CACHE_TTL, promise]);
};

export const publicSite = {
  setVersion: (slug, version) => {
    _setPublicVersion(slug, version);
  },
  invalidate: (slug) => {
    const keySlug = String(slug || "").trim().toLowerCase();
    _publicCacheStores.forEach((store) => {
      if (!keySlug) {
        store.clear();
        return;
      }
      for (const key of Array.from(store.keys())) {
        if (
          key === `shell:${keySlug}` ||
          key.startsWith(`page:${keySlug}:`) ||
          key.startsWith(`bootstrap:${keySlug}:`) ||
          key.startsWith(`service:${keySlug}:`) ||
          key.startsWith(`service_employees:${keySlug}:`) ||
          key.startsWith(`chatbot:${keySlug}`)
        ) {
          store.delete(key);
        }
      }
    });
  },
  getBySlug: (slug) => {
    const keySlug = String(slug || "").trim().toLowerCase();
    return api
      .get(`/api/public/${encodeURIComponent(keySlug)}/website`, { noCompanyHeader: true })
      .then((r) => r.data);
  },
  getWebsiteShell: (slug) => {
    const keySlug = String(slug || "").trim().toLowerCase();
    const key = _keyWithVersion(`shell:${keySlug}`, keySlug);
    const cached = _getCached(_publicShellCache, key);
    if (cached) return cached;
    const req = api
      .get(`/api/public/${encodeURIComponent(keySlug)}/website-shell`, {
        noCompanyHeader: true,
        params: _versionParam(keySlug),
      })
      .then((r) => {
        const data = r.data;
        const publishedAt =
          data?.branding_published_at ||
          data?.published_at ||
          data?.settings?.branding_published_at ||
          data?.settings?.published_at;
        if (publishedAt) _setPublicVersion(keySlug, publishedAt, "website-shell");
        return data;
      })
      .catch((err) => {
        _publicShellCache.delete(key);
        throw err;
      });
    _setCached(_publicShellCache, key, req);
    return req;
  },
  getPage: (slug, pageSlug) => {
    const keySlug = String(slug || "").trim().toLowerCase();
    const keyPage = String(pageSlug || "").trim().toLowerCase();
    const key = _keyWithVersion(`page:${keySlug}:${keyPage}`, keySlug);
    const cached = _getCached(_publicPageCache, key);
    if (cached) return cached;
    const req = api
      .get(`/api/public/${encodeURIComponent(keySlug)}/page/${encodeURIComponent(keyPage)}`, {
        noCompanyHeader: true,
        params: _versionParam(keySlug),
      })
      .then((r) => r.data)
      .catch((err) => {
        _publicPageCache.delete(key);
        throw err;
      });
    _setCached(_publicPageCache, key, req);
    return req;
  },
  getBootstrap: (slug, include = "services,departments,packages,website_shell") => {
    const keySlug = String(slug || "").trim().toLowerCase();
    const keyInclude = String(include || "").trim().toLowerCase();
    const key = _keyWithVersion(`bootstrap:${keySlug}:${keyInclude}`, keySlug);
    const cached = _getCached(_publicShellCache, key);
    if (cached) return cached;
    const req = api
      .get(`/api/public/${encodeURIComponent(keySlug)}/bootstrap`, {
        noCompanyHeader: true,
        params: { include: keyInclude, ..._versionParam(keySlug) },
      })
      .then((r) => r.data)
      .catch((err) => {
        _publicShellCache.delete(key);
        throw err;
      });
    _setCached(_publicShellCache, key, req);
    return req;
  },
  getService: (slug, serviceId, departmentId) => {
    const keySlug = String(slug || "").trim().toLowerCase();
    const keyService = String(serviceId || "").trim();
    const keyDept = String(departmentId || "").trim() || "all";
    const key = `service:${keySlug}:${keyService}:${keyDept}`;
    const cached = _getCached(_publicServiceCache, key);
    if (cached) return cached;
    const deptQuery = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : "";
    const req = api
      .get(`/public/${encodeURIComponent(keySlug)}/service/${encodeURIComponent(keyService)}${deptQuery}`, {
        noCompanyHeader: true,
        noAuth: true,
      })
      .then((r) => r.data)
      .catch((err) => {
        _publicServiceCache.delete(key);
        throw err;
      });
    _setCached(_publicServiceCache, key, req);
    return req;
  },
  getServiceEmployees: (slug, serviceId, departmentId) => {
    const keySlug = String(slug || "").trim().toLowerCase();
    const keyService = String(serviceId || "").trim();
    const keyDept = String(departmentId || "").trim() || "all";
    const key = `service_employees:${keySlug}:${keyService}:${keyDept}`;
    const cached = _getCached(_publicServiceEmployeesCache, key);
    if (cached) return cached;
    const deptQuery = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : "";
    const req = api
      .get(`/public/${encodeURIComponent(keySlug)}/service/${encodeURIComponent(keyService)}/employees${deptQuery}`, {
        noCompanyHeader: true,
        noAuth: true,
      })
      .then((r) => r.data)
      .catch((err) => {
        _publicServiceEmployeesCache.delete(key);
        throw err;
      });
    _setCached(_publicServiceEmployeesCache, key, req);
    return req;
  },
  getChatbotConfig: (slug) => {
    const keySlug = String(slug || "").trim().toLowerCase();
    if (!keySlug) return Promise.resolve(null);
    const key = `chatbot:${keySlug}`;
    const cached = _getCached(_publicChatbotCache, key);
    if (cached) return cached;
    const req = api
      .get(`/api/public/${encodeURIComponent(keySlug)}/chatbot-config`, {
        noAuth: true,
        noCompanyHeader: true,
      })
      .then((r) => r.data)
      .catch((err) => {
        _publicChatbotCache.delete(key);
        throw err;
      });
    _setCached(_publicChatbotCache, key, req);
    return req;
  },

  getArtist: (slug, artistIdOrToken) => {
    const key = String(artistIdOrToken || "").trim();
    const isId = /^[0-9]+$/.test(key);
    const path = isId
      ? `/public/${encodeURIComponent(slug)}/artists/${key}`
      : `/public/${encodeURIComponent(slug)}/artists/by-token/${encodeURIComponent(key)}`;
    return api
      .get(path, { noCompanyHeader: true, noAuth: true })
      .then((r) => r.data);
  },

  getArtistAvailability: (slug, artistIdOrToken) => {
    const key = String(artistIdOrToken || "").trim();
    const isId = /^[0-9]+$/.test(key);
    const path = isId
      ? `/public/${encodeURIComponent(slug)}/availability-by-artist/${key}`
      : `/public/${encodeURIComponent(slug)}/availability-by-token/${encodeURIComponent(key)}`;
    return api
      .get(path, { noCompanyHeader: true, noAuth: true })
      .then((r) => r.data);
  },

  bookArtistMeeting: (slug, artistIdOrToken, payload) => {
    const key = String(artistIdOrToken || "").trim();
    const isId = /^[0-9]+$/.test(key);
    const path = isId
      ? `/api/public/${encodeURIComponent(slug)}/artists/${key}/appointments`
      : `/api/public/${encodeURIComponent(slug)}/artists/by-token/${encodeURIComponent(key)}/appointments`;
    return api
      .post(path, payload, {
        noCompanyHeader: true,
        noAuth: true,
      })
      .then((r) => r.data);
  },

  sendContact: async (slug, payload, formKey = (process.env.REACT_APP_CONTACT_FORM_KEY || 'contact')) => {
    const key = encodeURIComponent(formKey || 'contact');
    const url = `/api/public/${encodeURIComponent(slug)}/form/${key}`;
    const config = { noCompanyHeader: true };

    try {
      if (typeof window !== 'undefined') {
        const host = window.location.host || '';
        const isLocalFrontend = /localhost:3\d{3}$/.test(host) || host.endsWith('.local');
        if (isLocalFrontend && /^https?:\/\/localhost:5000/.test(API_BASE_URL)) {
          config.baseURL = '';
        }
      }
    } catch {
      /* noop */
    }

    const { name, email, message } = payload;
    return api.post(url, { name, email, message }, config).then((r) => r.data);
  },
};

/* ------------------------------ WEBSITE (builder/Lab convenience) ------------------------------ */
export const wb = {
  // SETTINGS (admin-first with fallback handled by the backend routes; we polyfill shapes here)
  async getSettings(companyId) {
    const fallback = getAuthedCompanyId?.();
    const cid = companyId ?? fallback;
    const headers = cid ? { "X-Company-Id": String(cid) } : {};
    try {
      return await api.get("/admin/website/settings", { headers, params: { _ts: Date.now() } });
    } catch (e) {
      if (e?.response?.status === 404 || e?.response?.status === 405) {
        return await api.get("/api/website/settings", { headers, params: { _ts: Date.now() } });
      }
      throw e;
    }
  },

  async saveSettings(companyId, payload, options = {}) {
    const fallback = getAuthedCompanyId?.();
    const cid = companyId ?? fallback;
    const headers = {
      "Content-Type": "application/json",
      ...(cid ? { "X-Company-Id": String(cid) } : {}),
    };
    const publishFlag = options.publish ?? true;
    const draftOnly =
      options.draftOnly !== undefined
        ? Boolean(options.draftOnly)
        : !publishFlag;
    const schemaVersion = options.schemaVersion;

    // 🔧 Polyfill common shapes so backends with different schemas accept it
    const flatPayload = Object.fromEntries(
      Object.entries(payload || {}).filter(
        ([key]) => key !== "settings" && key !== "website"
      )
    );
    const merged = {
      ...payload,
      settings: {
        ...(payload.settings || {}),
        ...flatPayload,
      },
      website: {
        ...(payload.website || {}),
        ...flatPayload,
      },
    };

    if (merged?.settings?.nav_style) {
      // DEBUG: confirm the *outgoing* tokens
      console.log('[wb.saveSettings] sending nav_style:', merged.settings.nav_style);
    }

    const hoistKeys = [
      'nav_style',
      'nav_overrides',
      'layout_lab_preset',
      'theme_overrides',
      'is_live',
      'theme_id',
      'header',
      'footer',
    ];
    const settingsBag = merged.settings || {};
    hoistKeys.forEach((key) => {
      if (settingsBag[key] === undefined) return;
      if (merged[key] === undefined) {
        merged[key] = settingsBag[key];
      }
      if (!merged.website) merged.website = {};
      if (merged.website[key] === undefined) {
        merged.website[key] = settingsBag[key];
      }
    });


    const requestPayload = {
      ...merged,
      _publish_now: Boolean(publishFlag),
      _draft_only: Boolean(draftOnly),
      ...(schemaVersion != null ? { _schema_version: schemaVersion } : {}),
    };

    try {
      return await api.put("/admin/website/settings", requestPayload, { headers });
    } catch (e) {
      if (e?.response?.status === 404 || e?.response?.status === 405) {
        return await api.put("/api/website/settings", requestPayload, { headers });
      }
      throw e;
    }
  },

  publish: (companyId, is_live = true) =>
    websiteAdmin.publish(is_live, { companyId }),

  // PAGES (CRUD)
  listPages: (companyId, { locale } = {}) =>
    api.get(`/api/website/pages`, {
      params: { ...(locale ? { locale } : {}), _ts: Date.now(), company_id: companyId }, // cache-bust + explicit company param
      headers: { "X-Company-Id": companyId },
    }),

  getPage: (companyId, id) =>
    api.get(`/api/website/pages/${id}`, { headers: { "X-Company-Id": companyId } }),

  createPage: (companyId, body) =>
    api.post(`/api/website/pages`, body, { headers: { "X-Company-Id": companyId } }),

  updatePage: (companyId, id, body) =>
    api.put(`/api/website/pages/${id}`, body, { headers: { "X-Company-Id": companyId } }),
    // Bulk-apply page style to all pages
  applyPageStyleToAll: (companyId, body) =>
    api.post(`/api/website/pages/apply-style`, body, {
      headers: { "X-Company-Id": companyId },
    }),

  deletePage: (companyId, id) =>
    api.delete(`/api/website/pages/${id}`, { headers: { "X-Company-Id": companyId } }),

  // TEMPLATES
  listTemplates: async () => ({ data: await website.listTemplates() }),
  getTemplate:   async (key, version) => ({ data: await website.getTemplate(key, version) }),
  importTemplate: async (companyId, body) => ({ data: await website.importTemplate(body, { companyId }) }),

  // MEDIA
  mediaList:   async (companyId, { offset = 0, limit = 50 } = {}) => ({ data: await website.listMedia({ offset, limit, companyId }) }),
  mediaUpload: async (companyId, fileOrFiles) => ({ data: await website.uploadMedia(fileOrFiles, { companyId }) }),

  // PUBLIC convenience
  publicBySlug: async (slug) => ({ data: await publicSite.getBySlug(slug) }),

  // Themes convenience
  listThemes: async (companyId) => websiteAdmin.listThemes({ companyId }),
};

export const chatbot = {
  async getSettings(companyId) {
    const fallback = getAuthedCompanyId?.();
    const cid = companyId ?? fallback;
    const headers = cid ? { "X-Company-Id": String(cid) } : {};
    return api.get("/api/chatbot/settings", { headers, params: { _ts: Date.now() } });
  },

  async saveSettings(companyId, payload) {
    const fallback = getAuthedCompanyId?.();
    const cid = companyId ?? fallback;
    const headers = {
      "Content-Type": "application/json",
      ...(cid ? { "X-Company-Id": String(cid) } : {}),
    };
    return api.put("/api/chatbot/settings", payload, { headers });
  },
};

export const navSettings = {
  async getStyle(companyId, config = {}) {
    const res = await api.get("/admin/website/nav-style", {
      ...withCompany(companyId),
      ...config,
    });
    return res.data;
  },

  async updateStyle(companyId, style, config = {}) {
    const payload = style?.style ? style : { style };
    const res = await putWithFallback(
      "/admin/website/nav-style",
      payload,
      {
        ...withCompany(companyId),
        ...config,
      }
    );
    return res.data;
  },

  async getOverrides(companyId, config = {}) {
    const res = await api.get("/admin/website/nav-overrides", {
      ...withCompany(companyId),
      ...config,
    });
    return res.data;
  },

  async updateOverrides(companyId, overrides, config = {}) {
    const payload = overrides?.overrides ? overrides : { overrides };
    const res = await putWithFallback(
      "/admin/website/nav-overrides",
      payload,
      {
        ...withCompany(companyId),
        ...config,
      }
    );
    return res.data;
  },

  async listPages(companyId, config = {}) {
    const res = await api.get("/admin/pages/nav", {
      ...withCompany(companyId),
      ...config,
    });
    return res.data;
  },

  async updatePage(companyId, pageId, payload, config = {}) {
    const res = await putWithFallback(
      `/admin/pages/${pageId}/nav`,
      payload,
      {
        ...withCompany(companyId),
        ...config,
      }
    );
    return res.data;
  },
};

// Default namespace export
export const apiHelpers = { api, website, websiteAdmin, publicSite, wb, websiteDomains, stripeConnect, isStripeOnboardingIncomplete, questionnaires, invitationQuestionnaires, questionnaireUploadsApi, candidateIntakeApi, settingsApi };

export default api;
