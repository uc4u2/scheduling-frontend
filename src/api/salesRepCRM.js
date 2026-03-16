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

export const triggerTwilioCall = async (leadId) => {
  const { data } = await salesRepApi.post(`/leads/${leadId}/twilio-call`);
  return data || { ok: false, call_status: "failed", provider: "twilio" };
};

export const getTwilioToken = async () => {
  const { data } = await salesRepApi.post("/twilio/token");
  return data || null;
};

export const getTwilioDeviceStatus = async () => {
  const { data } = await salesRepApi.get("/twilio/device-status");
  return data || {
    can_initialize_device: false,
    provider: "twilio",
    call_mode: "legacy",
    call_flow: "manual",
    identity: null,
    blocking_reason: "unknown",
    twilio_status: null,
  };
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

export const getInboundWorkspace = async () => {
  const { data } = await salesRepApi.get("/phone/workspace");
  return data || { availability: null, departments: [], current_inbound_session: null };
};

export const updatePhoneAvailability = async (payload) => {
  const { data } = await salesRepApi.post("/phone/availability", payload);
  return data || {
    sales_rep_id: null,
    department_key: null,
    status: "offline",
    device_registered: false,
    current_call_sid: null,
    last_seen_at: null,
    manual_pause_reason: null,
    last_status_changed_at: null,
  };
};
