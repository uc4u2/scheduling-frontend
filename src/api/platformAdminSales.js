import platformAdminApi from "./platformAdminApi";

export const getSalesCallSettings = async () => {
  const { data } = await platformAdminApi.get("/sales/call-settings");
  return data || { settings: null, twilio_status: null };
};

export const saveSalesCallSettings = async (payload) => {
  const { data } = await platformAdminApi.post("/sales/call-settings", payload);
  return data || { settings: null, twilio_status: null };
};

export const getSalesTwilioStatus = async () => {
  const { data } = await platformAdminApi.get("/sales/twilio-status");
  return data || { configured: false, provider: "twilio", missing_config_fields: [] };
};

export const listSalesReps = async () => {
  const { data } = await platformAdminApi.get("/sales/reps");
  return data?.reps || [];
};

export const listSalesDeals = async () => {
  const { data } = await platformAdminApi.get("/sales/deals");
  return data?.deals || [];
};

export const getLeadSummary = async () => {
  const { data } = await platformAdminApi.get("/sales/leads/summary");
  return data || {};
};

export const listLeads = async (params = {}) => {
  const { data } = await platformAdminApi.get("/sales/leads", { params });
  return data || { total: 0, leads: [] };
};

export const getLead = async (leadId) => {
  const { data } = await platformAdminApi.get(`/sales/leads/${leadId}`);
  return data || { lead: null, assignments: [], lock: null };
};

export const updateLead = async (leadId, payload) => {
  const { data } = await platformAdminApi.patch(`/sales/leads/${leadId}`, payload);
  return data || null;
};

export const deleteLead = async (leadId) => {
  const { data } = await platformAdminApi.delete(`/sales/leads/${leadId}`);
  return data || { ok: false };
};

export const createLead = async (payload) => {
  const { data } = await platformAdminApi.post("/sales/leads", payload);
  return data?.lead || null;
};

export const assignLead = async (leadId, payload) => {
  const { data } = await platformAdminApi.post(`/sales/leads/${leadId}/assign`, payload);
  return data?.lead || null;
};

export const unassignLead = async (leadId, payload = {}) => {
  const { data } = await platformAdminApi.post(`/sales/leads/${leadId}/unassign`, payload);
  return data?.lead || null;
};

export const unlockLead = async (leadId, payload = {}) => {
  const { data } = await platformAdminApi.post(`/sales/leads/${leadId}/unlock`, payload);
  return data?.lead || null;
};

export const bulkAssignLeads = async (payload) => {
  const { data } = await platformAdminApi.post("/sales/leads/bulk-assign", payload);
  return data || { updated: 0 };
};

export const bulkDeleteLeads = async (payload) => {
  const { data } = await platformAdminApi.post("/sales/leads/bulk-delete", payload);
  return data || { deleted_ids: [], blocked: [] };
};

export const suppressLead = async (leadId, payload = {}) => {
  const { data } = await platformAdminApi.post(`/sales/leads/${leadId}/suppress`, payload);
  return data?.lead || null;
};

export const restoreLead = async (leadId, payload = {}) => {
  const { data } = await platformAdminApi.post(`/sales/leads/${leadId}/restore`, payload);
  return data?.lead || null;
};

export const markLeadDuplicate = async (leadId, payload = {}) => {
  const { data } = await platformAdminApi.post(`/sales/leads/${leadId}/mark-duplicate`, payload);
  return data?.lead || null;
};

export const convertLead = async (leadId, payload = {}) => {
  const { data } = await platformAdminApi.post(`/sales/leads/${leadId}/convert`, payload);
  return data?.lead || null;
};

export const getLeadActivity = async (params = {}) => {
  const { data } = await platformAdminApi.get("/sales/leads/activity", { params });
  return data?.activity || [];
};

export const getLeadActivityById = async (leadId, params = {}) => {
  const { data } = await platformAdminApi.get(`/sales/leads/${leadId}/activity`, { params });
  return data?.activity || [];
};

export const getLeadCallbacks = async (params = {}) => {
  const { data } = await platformAdminApi.get("/sales/leads/callbacks", { params });
  return data?.callbacks || [];
};

export const getRepLeadStats = async (repId) => {
  const { data } = await platformAdminApi.get(`/sales/reps/${repId}/lead-stats`);
  return data || null;
};

export const importLeads = async (payload) => {
  const formData = new FormData();
  formData.append("file", payload.file);
  if (payload.sales_rep_id) formData.append("sales_rep_id", payload.sales_rep_id);
  if (payload.source) formData.append("source", payload.source);
  if (payload.assign_reason) formData.append("assign_reason", payload.assign_reason);
  const { data } = await platformAdminApi.post("/sales/leads/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data || null;
};

export const listLeadImportBatches = async () => {
  const { data } = await platformAdminApi.get("/sales/leads/import-batches");
  return data?.batches || [];
};
