import api from "../../utils/api";

const unwrap = async (promise) => {
  const res = await promise;
  return res.data;
};

const pickArray = (payload, keys = ["items", "data", "recruiters"]) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const normalizeRecruiterRow = (row = {}) => {
  const id = row?.id;
  const firstName = row?.first_name || row?.firstName || "";
  const lastName = row?.last_name || row?.lastName || "";
  const email = row?.email || row?.user_email || "";
  const fullName = `${firstName} ${lastName}`.trim();
  return {
    ...row,
    id,
    first_name: firstName,
    last_name: lastName,
    email,
    name: fullName || email || (id ? `Team member #${id}` : "Team member"),
    hourly_rate: row?.hourly_rate ?? row?.hourlyRate ?? null,
    timezone: row?.timezone || row?.tz || null,
    archived_at: row?.archived_at || row?.archivedAt || null,
  };
};

export const getFinanceOverview = () => unwrap(api.get("/finance/overview"));
export const getFinanceSummary = () => unwrap(api.get("/finance/reports/summary"));

export const listQuoteRequests = (params = {}) => unwrap(api.get("/finance/quote-requests", { params }));
export const createQuoteRequest = (payload) => unwrap(api.post("/finance/quote-requests", payload));
export const getQuoteRequest = (id) => unwrap(api.get(`/finance/quote-requests/${id}`));
export const updateQuoteRequest = (id, payload) => unwrap(api.patch(`/finance/quote-requests/${id}`, payload));
export const linkQuoteClient = (id, payload) => unwrap(api.post(`/finance/quote-requests/${id}/link-client`, payload));
export const createEstimateFromQuote = (id, payload = {}) =>
  unwrap(api.post(`/finance/quote-requests/${id}/create-estimate`, payload));

export const listEstimates = (params = {}) => unwrap(api.get("/finance/estimates", { params }));
export const createEstimate = (payload) => unwrap(api.post("/finance/estimates", payload));
export const getEstimate = (id) => unwrap(api.get(`/finance/estimates/${id}`));
export const updateEstimate = (id, payload) => unwrap(api.patch(`/finance/estimates/${id}`, payload));
export const sendEstimate = (id) => unwrap(api.post(`/finance/estimates/${id}/send`));
export const duplicateEstimate = (id) => unwrap(api.post(`/finance/estimates/${id}/duplicate`));
export const convertEstimateToInvoice = (id) => unwrap(api.post(`/finance/estimates/${id}/convert-to-invoice`));

export const listEstimateTemplates = (params = {}) =>
  unwrap(api.get("/finance/estimate-templates", { params }));
export const createEstimateTemplate = (payload) =>
  unwrap(api.post("/finance/estimate-templates", payload));

export const listWorkOrders = (params = {}) => unwrap(api.get("/finance/work-orders", { params }));
export const getWorkOrder = (id) => unwrap(api.get(`/finance/work-orders/${id}`));
export const createWorkOrder = (payload) => unwrap(api.post("/finance/work-orders", payload));
export const updateWorkOrder = (id, payload) => unwrap(api.patch(`/finance/work-orders/${id}`, payload));
export const cancelWorkOrder = (id) => unwrap(api.delete(`/finance/work-orders/${id}`));
export const updateWorkOrderStatus = (id, status) =>
  unwrap(api.post(`/finance/work-orders/${id}/status`, { status }));
export const getWorkOrdersSummary = () => unwrap(api.get("/finance/work-orders/summary"));

export const listWorkOrderAssignments = (workOrderId) =>
  unwrap(api.get(`/finance/work-orders/${workOrderId}/assignments`));
export const createWorkOrderAssignment = (workOrderId, payload) =>
  unwrap(api.post(`/finance/work-orders/${workOrderId}/assignments`, payload));
export const getWorkOrderAssignment = (id) => unwrap(api.get(`/finance/work-order-assignments/${id}`));
export const updateWorkOrderAssignment = (id, payload) =>
  unwrap(api.patch(`/finance/work-order-assignments/${id}`, payload));
export const deleteWorkOrderAssignment = (id) => unwrap(api.delete(`/finance/work-order-assignments/${id}`));

export const listWorkOrderMaterials = (workOrderId) =>
  unwrap(api.get(`/finance/work-orders/${workOrderId}/materials`));
export const createWorkOrderMaterial = (workOrderId, payload) =>
  unwrap(api.post(`/finance/work-orders/${workOrderId}/materials`, payload));
export const updateWorkOrderMaterial = (id, payload) =>
  unwrap(api.patch(`/finance/work-order-materials/${id}`, payload));
export const deleteWorkOrderMaterial = (id) => unwrap(api.delete(`/finance/work-order-materials/${id}`));

export const listExpenseCategories = () => unwrap(api.get("/finance/expense-categories"));
export const getExpenseCategory = (id) => unwrap(api.get(`/finance/expense-categories/${id}`));
export const createExpenseCategory = (payload) => unwrap(api.post("/finance/expense-categories", payload));

export const listExpenses = (params = {}) => unwrap(api.get("/finance/expenses", { params }));
export const createExpense = (payload) => unwrap(api.post("/finance/expenses", payload));
export const getExpense = (id) => unwrap(api.get(`/finance/expenses/${id}`));
export const updateExpense = (id, payload) => unwrap(api.patch(`/finance/expenses/${id}`, payload));
export const deleteExpense = (id) => unwrap(api.delete(`/finance/expenses/${id}`));

export const exportAccountantCsv = (payload) =>
  api.post("/finance/reports/accountant-export", payload, { responseType: "blob" });

export const listManagerClients = async () => {
  const res = await api.get("/booking/clients");
  return pickArray(res.data, ["items", "data"]);
};

export const listRecruitersForAssignment = async () => {
  const res = await api.get("/manager/recruiters");
  return pickArray(res.data, ["recruiters", "items", "data"]).map(normalizeRecruiterRow);
};
