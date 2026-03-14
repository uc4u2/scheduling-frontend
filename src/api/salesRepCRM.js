import salesRepApi from "./salesRepApi";

export const getCurrentLead = async () => {
  const { data } = await salesRepApi.get("/leads/current");
  return data?.lead || null;
};

export const getNextLead = async () => {
  const { data } = await salesRepApi.post("/leads/next");
  return data?.lead || null;
};

export const submitLeadOutcome = async (leadId, payload) => {
  const { data } = await salesRepApi.post(`/leads/${leadId}/submit`, payload);
  return data?.lead || null;
};

export const skipLead = async (leadId, payload = {}) => {
  const { data } = await salesRepApi.post(`/leads/${leadId}/skip`, payload);
  return data?.lead || null;
};

export const getTodayCallbacks = async () => {
  const { data } = await salesRepApi.get("/leads/callbacks/today");
  return data?.callbacks || [];
};

export const getLeadProgress = async () => {
  const { data } = await salesRepApi.get("/leads/progress");
  return data || {};
};

export const getLeadHistory = async (params = {}) => {
  const { data } = await salesRepApi.get("/leads/history", { params });
  return data?.history || [];
};
