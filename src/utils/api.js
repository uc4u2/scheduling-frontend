// src/utils/api.js
import axios from "axios";
import { getAuthedCompanyId } from "./authedCompany";
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
    }
  } catch {}
  return "/";
};

export const API_BASE_URL = envBase || inferBase();

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

    if (status === 412 || code === 'STRIPE_ONBOARDING_INCOMPLETE') {
      error.code = code || 'STRIPE_ONBOARDING_INCOMPLETE';
      error.stripeOnboardingIncomplete = true;
    }

    if (userMessage && !error.displayMessage) {
      error.displayMessage = userMessage;
    }

    return Promise.reject(error);
  }
);

api.interceptors.request.use((config) => {
  // Bearer token
  const token =
    typeof localStorage !== "undefined" && localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

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

  // Media library
  listMedia: ({ offset = 0, limit = 30, companyId } = {}) =>
    api
      .get("/api/website/media", {
        params: { offset, limit },
        ...withCompany(companyId),
      })
      .then((r) => r.data),

  uploadMedia: async (files, { companyId } = {}) => {
    const fd = new FormData();
    (Array.isArray(files) ? files : [files])
      .filter(Boolean)
      .forEach((f) => fd.append("files", f));

    // Try primary route
    const tryUpload = async (url) =>
      api.post(url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        ...withCompany(companyId),
      });

    let data;
    try {
      const res = await tryUpload("/api/website/media");
      data = res.data;
    } catch {
      // Fallback alias
      const res2 = await tryUpload("/api/website/media/upload");
      data = res2.data;
    }

    // Normalize to { items: [...] } with .url present
    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (Array.isArray(data?.items)) {
      items = data.items;
    } else if (Array.isArray(data?.uploaded)) {
      items = data.uploaded;
    } else if (data?.item) {
      items = [data.item];
    }

    const norm = (it) => {
      const fileUrl = it?.url || it?.file_url;
      const stored = it?.stored_name || (fileUrl ? String(fileUrl).split("/").slice(-1)[0] : undefined);
      const finalUrl =
        it?.url ||
        it?.file_url ||
        (stored ? website.mediaFileUrl(companyId, stored) : undefined);
      return {
        ...it,
        url: finalUrl,
        stored_name: stored,
        variants: Array.isArray(it?.variants) ? it.variants : [],
      };
    };

    return { items: items.map(norm) };
  },

  deleteMedia: (mediaId, { companyId } = {}) =>
    api
      .delete(`/api/website/media/${mediaId}`, withCompany(companyId))
      .then((r) => r.data),

  mediaFileUrl: (companyId, storedName) =>
    `${String(API_BASE_URL).replace(/\/$/, "")}/api/website/media/file/${companyId}/${storedName}`,

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

  publish: (is_live, { companyId } = {}) =>
    putWithFallback(`/api/website/settings`, { is_live }, withCompany(companyId)),

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
};

// Public JSON (no company header)
export const publicSite = {
  getBySlug: (slug) =>
    api
      .get(`/api/public/${encodeURIComponent(slug)}/website`, { noCompanyHeader: true })
      .then((r) => r.data),

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
  sendCorporateContact: async (payload) => {
    const url = `/api/contact`;
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
    return api.post(url, payload, config).then((r) => r.data);
  },
};

/* ------------------------------ WEBSITE (builder/Lab convenience) ------------------------------ */
export const wb = {
  // SETTINGS (admin-first with fallback handled by the backend routes; we polyfill shapes here)
  async getSettings(companyId) {
    const headers = { ...(companyId ? { "X-Company-Id": String(companyId) } : {}) };
    try {
      return await api.get("/admin/website/settings", { headers, params: { _ts: Date.now() } });
    } catch (e) {
      if (e?.response?.status === 404 || e?.response?.status === 405) {
        return await api.get("/api/website/settings", { headers, params: { _ts: Date.now() } });
      }
      throw e;
    }
  },

  async saveSettings(companyId, payload) {
    const headers = {
      "Content-Type": "application/json",
      ...(companyId ? { "X-Company-Id": String(companyId) } : {}),
    };

    // 🔧 Polyfill common shapes so backends with different schemas accept it
    const merged = {
      ...payload,
      settings: { ...(payload.settings || {}), ...payload },
      website:  { ...(payload.website  || {}), ...payload },
    };

    try {
      return await api.put("/admin/website/settings", merged, { headers });
    } catch (e) {
      if (e?.response?.status === 404 || e?.response?.status === 405) {
        return await api.put("/api/website/settings", merged, { headers });
      }
      throw e;
    }
  },

  publish: (companyId, is_live) =>
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
  listThemes: async (companyId) => {
    const hasStorage = typeof localStorage !== "undefined";
    const hasToken = !hasStorage || Boolean(localStorage.getItem("token"));
    if (!hasToken) {
      return { data: [] };
    }
    try {
      return await websiteAdmin.listThemes({ companyId });
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        return { data: [] };
      }
      throw err;
    }
  },
};

// Default namespace export
export const apiHelpers = { api, website, websiteAdmin, publicSite, wb, websiteDomains, stripeConnect, isStripeOnboardingIncomplete, questionnaires, invitationQuestionnaires, questionnaireUploadsApi, candidateIntakeApi, settingsApi };

export default api;
