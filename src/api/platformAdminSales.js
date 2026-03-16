import platformAdminApi from "./platformAdminApi";

export const getSalesCallSettings = async () => {
  const { data } = await platformAdminApi.get("/sales/call-settings");
  return data || {
    settings: null,
    twilio_status: {
      configured: false,
      provider: "twilio",
      missing_config_fields: [],
      missing_browser_config_fields: [],
      bridge_ready: false,
      browser_softphone_ready: false,
    },
  };
};

export const saveSalesCallSettings = async (payload) => {
  const { data } = await platformAdminApi.post("/sales/call-settings", payload);
  return data || { settings: null, twilio_status: null };
};

export const getSalesTwilioStatus = async () => {
  const { data } = await platformAdminApi.get("/sales/twilio-status");
  return data || {
    configured: false,
    provider: "twilio",
    missing_config_fields: [],
    missing_browser_config_fields: [],
    bridge_ready: false,
    browser_softphone_ready: false,
    twiml_app_sid_present: false,
    api_key_present: false,
    api_secret_present: false,
  };
};

export const listSalesReps = async () => {
  const { data } = await platformAdminApi.get("/sales/reps");
  return data?.reps || [];
};

export const getSalesRepProductivity = async () => {
  const { data } = await platformAdminApi.get("/sales/reps/productivity");
  return data || { rep_productivity: [], generated_at: null };
};

export const getSalesSupervisorQueue = async () => {
  const { data } = await platformAdminApi.get("/sales/supervisor-queue");
  return data || {
    generated_at: null,
    queue: {
      overdue_callbacks: [],
      stale_assigned: [],
      attempt_limited: [],
      retry_cooldown_blocked: [],
      company_throttle_active: [],
      qa_unresolved: [],
      overloaded_rep_leads: [],
    },
  };
};

export const getInboundOverview = async () => {
  const { data } = await platformAdminApi.get("/inbound/overview");
  return data || {
    answered_today: 0,
    missed_today: 0,
    abandoned_today: 0,
    voicemail_today: 0,
    avg_wait_seconds_today: 0,
  };
};

export const listInboundCalls = async (params = {}) => {
  const { data } = await platformAdminApi.get("/inbound/calls", { params });
  return data || { calls: [], count: 0 };
};

export const getInboundCall = async (sessionId) => {
  const { data } = await platformAdminApi.get(`/inbound/calls/${sessionId}`);
  return data || { call: null };
};

export const getInboundLiveReps = async () => {
  const { data } = await platformAdminApi.get("/inbound/reps/live");
  return data || { rows: [] };
};

export const listInboundDepartments = async () => {
  const { data } = await platformAdminApi.get("/inbound/departments");
  return data || { departments: [] };
};

export const updateInboundDepartment = async (departmentId, payload) => {
  const { data } = await platformAdminApi.patch(`/inbound/departments/${departmentId}`, payload);
  return data || { department: null };
};

export const listInboundRepMappings = async (params = {}) => {
  const { data } = await platformAdminApi.get("/inbound/rep-mappings", { params });
  return data || { mappings: [] };
};

export const createInboundRepMapping = async (payload) => {
  const { data } = await platformAdminApi.post("/inbound/rep-mappings", payload);
  return data || { mapping: null };
};

export const updateInboundRepMapping = async (mappingId, payload) => {
  const { data } = await platformAdminApi.patch(`/inbound/rep-mappings/${mappingId}`, payload);
  return data || { mapping: null };
};

export const deleteInboundRepMapping = async (mappingId) => {
  const { data } = await platformAdminApi.delete(`/inbound/rep-mappings/${mappingId}`);
  return data || { mapping: null };
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

export const updateLeadQaReview = async (leadId, payload = {}) => {
  const { data } = await platformAdminApi.post(`/sales/leads/${leadId}/qa-review`, payload);
  return data?.lead || null;
};

export const bulkUpdateLeadQaReview = async (payload = {}) => {
  const { data } = await platformAdminApi.post("/sales/leads/qa-review/bulk", payload);
  return data || { review_state: null, processed: [], blocked: [], updated_count: 0 };
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
