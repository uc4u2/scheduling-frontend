import api from "../../utils/api";

const unwrap = async (promise) => {
  const res = await promise;
  return res.data;
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
  const raw = Array.isArray(res.data)
    ? res.data
    : Array.isArray(res.data?.items)
    ? res.data.items
    : [];
  return raw;
};
