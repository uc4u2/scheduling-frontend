// src/utils/jobOpenings.js
import { api } from "./api";

export const jobOpeningsApi = {
  list: async (params = {}) => {
    const res = await api.get("/manager/job-openings", { params });
    return res.data;
  },

  detail: async (id) => {
    const res = await api.get(`/manager/job-openings/${id}`);
    return res.data;
  },

  create: async (payload) => {
    const res = await api.post("/manager/job-openings", payload || {});
    return res.data;
  },

  update: async (id, payload) => {
    const res = await api.put(`/manager/job-openings/${id}`, payload || {});
    return res.data;
  },

  publish: async (id) => {
    const res = await api.post(`/manager/job-openings/${id}/publish`, {});
    return res.data;
  },

  close: async (id) => {
    const res = await api.post(`/manager/job-openings/${id}/close`, {});
    return res.data;
  },

  remove: async (id) => {
    const res = await api.delete(`/manager/job-openings/${id}`);
    return res.data;
  },

  statusHistory: async (id) => {
    const res = await api.get(`/manager/job-openings/${id}/status-history`);
    return res.data;
  },
  applications: async (id, params = {}) => {
    const res = await api.get(`/manager/job-openings/${id}/applications`, { params });
    return res.data;
  },
  aiRank: async (id, payload = {}) => {
    const res = await api.post(`/manager/job-openings/${id}/ai-rank`, payload || {});
    return res.data;
  },
  aiRankings: async (id, params = {}) => {
    const res = await api.get(`/manager/job-openings/${id}/ai-rankings`, { params });
    return res.data;
  },
  exportApplications: async (id, params = {}, config = {}) => {
    const res = await api.get(`/manager/job-openings/${id}/applications/export`, {
      params,
      responseType: "blob",
      ...config,
    });
    return res;
  },
  updateApplication: async (applicationId, payload = {}) => {
    const res = await api.patch(`/manager/job-applications/${applicationId}`, payload);
    return res.data;
  },
};

export default jobOpeningsApi;
