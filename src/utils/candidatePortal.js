import { api } from "./api";

export const candidatePortal = {
  requestMagicLink: async (companySlug, email) => {
    const slug = encodeURIComponent(companySlug || "");
    const res = await api.post(
      `/api/public/${slug}/candidate-login`,
      { email },
      { noAuth: true }
    );
    return res.data;
  },

  exchangeToken: async (token) => {
    const res = await api.get(`/api/public/candidate-login/${token}`, { noAuth: true });
    return res.data;
  },

  getDashboard: async (token) => {
    const res = await api.get("/api/candidate-portal/dashboard", {
      headers: { "X-Candidate-Token": token },
    });
    return res.data;
  },
};

export default candidatePortal;
