// src/utils/publicJobs.js
import { api } from "./api";

export const publicJobs = {
  list: async (companySlug, params = {}) => {
    const slug = encodeURIComponent(companySlug || "");
    const res = await api.get(`/api/public/${slug}/jobs`, { noAuth: true, params });
    return res.data;
  },

  detail: async (companySlug, jobSlug) => {
    const slug = encodeURIComponent(companySlug || "");
    const js = encodeURIComponent(jobSlug || "");
    const res = await api.get(`/public/${slug}/jobs/${js}`, { noAuth: true });
    return res.data;
  },

  apply: async (companySlug, jobSlug, payload) => {
    const slug = encodeURIComponent(companySlug || "");
    const js = encodeURIComponent(jobSlug || "");
    const res = await api.post(`/public/${slug}/jobs/${js}/apply`, payload || {}, {
      noAuth: true,
    });
    return res.data;
  },
};

export default publicJobs;
