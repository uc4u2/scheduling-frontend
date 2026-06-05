import api, { API_BASE_URL } from "../../utils/api";
import { getAuthedCompanyId } from "../../utils/authedCompany";

const unwrap = async (promise) => {
  const res = await promise;
  return res.data;
};

const fetchBinary = async (path) => {
  const token =
    typeof localStorage !== "undefined" ? localStorage.getItem("token") || "" : "";
  const companyId = getAuthedCompanyId?.();
  const response = await fetch(`${String(API_BASE_URL).replace(/\/$/, "")}${path}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(companyId ? { "X-Company-Id": String(companyId) } : {}),
    },
    credentials: "omit",
  });

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const payload = await response.json();
        message =
          payload?.message ||
          payload?.error_description ||
          payload?.error ||
          payload?.error_code ||
          message;
      } else {
        const text = await response.text();
        if (text) message = text;
      }
    } catch {}
    const error = new Error(message);
    throw error;
  }

  const blob = await response.blob();
  const headers = {
    "content-type": response.headers.get("content-type") || blob.type || "application/octet-stream",
    "content-disposition": response.headers.get("content-disposition") || "",
    "content-length": response.headers.get("content-length") || "",
  };
  return { data: blob, headers, status: response.status };
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
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
export const getFinanceSummary = (params = {}) => unwrap(api.get("/finance/reports/summary", { params }));
export const getFinanceTaxContext = () => unwrap(api.get("/finance/tax-context"));
export const getFinanceSalesTaxProfile = () => unwrap(api.get("/finance/sales-tax-profile"));
export const updateFinanceSalesTaxProfile = (payload) =>
  unwrap(api.patch("/finance/sales-tax-profile", payload));
export const getFinanceDocumentSettings = () => unwrap(api.get("/finance/document-settings"));
export const updateFinanceDocumentSettings = (payload) =>
  unwrap(api.patch("/finance/document-settings", payload));
export const getFinanceAuditLogs = (params = {}) =>
  unwrap(api.get("/finance/audit-logs", { params }));
export const getFinanceOwnerSnapshot = (params = {}) =>
  unwrap(api.get("/finance/reports/owner-snapshot", { params }));

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
export const createEstimateShareLink = (id) =>
  unwrap(api.post(`/finance/estimates/${id}/share-link`));
export const sendEstimateEmail = (id, payload) =>
  unwrap(api.post(`/finance/estimates/${id}/send-email`, payload));
export const duplicateEstimate = (id) => unwrap(api.post(`/finance/estimates/${id}/duplicate`));
export const convertEstimateToInvoice = (id) => unwrap(api.post(`/finance/estimates/${id}/convert-to-invoice`));
export const reopenEstimateResponse = (id) =>
  unwrap(api.post(`/finance/estimates/${id}/reopen-response`));
export const downloadFinanceEstimatePdf = (id) =>
  fetchBinary(`/finance/estimates/${id}/pdf`);
export const createFinanceInvoicePaymentLink = (id) =>
  unwrap(api.post(`/finance/invoices/${id}/create-payment-link`));
export const createSimilarFinanceInvoice = (id) =>
  unwrap(api.post(`/finance/invoices/${id}/create-similar`));
export const listFinanceInvoices = (params = {}) =>
  unwrap(api.get("/finance/invoices", { params }));
export const getFinanceInvoice = (id) => unwrap(api.get(`/finance/invoices/${id}`));
export const downloadFinanceInvoicePdf = (id) =>
  fetchBinary(`/finance/invoices/${id}/pdf`);
export const getFinanceInvoicePrintHtml = async (id) => {
  const res = await api.get(`/finance/invoices/${id}/print`, {
    responseType: "text",
    transformResponse: [(data) => data],
  });
  return res.data;
};
export const updateFinanceInvoice = (id, payload) =>
  unwrap(api.patch(`/finance/invoices/${id}`, payload));
export const recordFinanceInvoiceOfflinePayment = (id, payload) =>
  unwrap(api.post(`/finance/invoices/${id}/offline-payments`, payload));
export const refundFinanceInvoice = (id, payload) =>
  unwrap(api.post(`/finance/invoices/${id}/refund`, payload));
export const getPublicEstimate = (token) =>
  unwrap(api.get(`/public/estimates/${encodeURIComponent(token)}`, { noAuth: true, noCompanyHeader: true }));
export const respondPublicEstimate = (token, payload) =>
  unwrap(api.post(`/public/estimates/${encodeURIComponent(token)}/respond`, payload, { noAuth: true, noCompanyHeader: true }));

export const listEstimateTemplates = (params = {}) =>
  unwrap(api.get("/finance/estimate-templates", { params }));
export const createEstimateTemplate = (payload) =>
  unwrap(api.post("/finance/estimate-templates", payload));
export const getEstimateTemplate = (id) =>
  unwrap(api.get(`/finance/estimate-templates/${id}`));
export const updateEstimateTemplate = (id, payload) =>
  unwrap(api.patch(`/finance/estimate-templates/${id}`, payload));
export const deleteEstimateTemplate = (id) =>
  unwrap(api.delete(`/finance/estimate-templates/${id}`));

export const listWorkOrders = (params = {}) => unwrap(api.get("/finance/work-orders", { params }));
export const getWorkOrder = (id) => unwrap(api.get(`/finance/work-orders/${id}`));
export const createWorkOrder = (payload) => unwrap(api.post("/finance/work-orders", payload));
export const updateWorkOrder = (id, payload) => unwrap(api.patch(`/finance/work-orders/${id}`, payload));
export const cancelWorkOrder = (id) => unwrap(api.delete(`/finance/work-orders/${id}`));
export const updateWorkOrderStatus = (id, status) =>
  unwrap(api.post(`/finance/work-orders/${id}/status`, { status }));
export const getWorkOrdersSummary = () => unwrap(api.get("/finance/work-orders/summary"));

export const listWorkOrderAssignments = (workOrderId, params = {}) =>
  unwrap(api.get(`/finance/work-orders/${workOrderId}/assignments`, { params }));
export const createWorkOrderAssignment = (workOrderId, payload) =>
  unwrap(api.post(`/finance/work-orders/${workOrderId}/assignments`, payload));
export const getWorkOrderAssignment = (id) => unwrap(api.get(`/finance/work-order-assignments/${id}`));
export const updateWorkOrderAssignment = (id, payload) =>
  unwrap(api.patch(`/finance/work-order-assignments/${id}`, payload));
export const deleteWorkOrderAssignment = (id) => unwrap(api.delete(`/finance/work-order-assignments/${id}`));

export const listWorkOrderMaterials = (workOrderId, params = {}) =>
  unwrap(api.get(`/finance/work-orders/${workOrderId}/materials`, { params }));
export const createWorkOrderMaterial = (workOrderId, payload) =>
  unwrap(api.post(`/finance/work-orders/${workOrderId}/materials`, payload));
export const updateWorkOrderMaterial = (id, payload) =>
  unwrap(api.patch(`/finance/work-order-materials/${id}`, payload));
export const deleteWorkOrderMaterial = (id) => unwrap(api.delete(`/finance/work-order-materials/${id}`));

export const listInventoryCategories = (params = {}) => unwrap(api.get("/finance/inventory/categories", { params }));
export const createInventoryCategory = (payload) =>
  unwrap(api.post("/finance/inventory/categories", payload));
export const updateInventoryCategory = (id, payload) =>
  unwrap(api.patch(`/finance/inventory/categories/${id}`, payload));
export const deleteInventoryCategory = (id) =>
  unwrap(api.delete(`/finance/inventory/categories/${id}`));

export const listInventoryItems = (params = {}) =>
  unwrap(api.get("/finance/inventory/items", { params }));
export const createInventoryItem = (payload) =>
  unwrap(api.post("/finance/inventory/items", payload));
export const updateInventoryItem = (id, payload) =>
  unwrap(api.patch(`/finance/inventory/items/${id}`, payload));
export const deleteInventoryItem = (id) =>
  unwrap(api.delete(`/finance/inventory/items/${id}`));
export const adjustInventoryItem = (id, payload) =>
  unwrap(api.post(`/finance/inventory/items/${id}/adjust`, payload));
export const listInventoryTransactions = (params = {}) =>
  unwrap(api.get("/finance/inventory/transactions", { params }));
export const exportFinanceInventoryItems = (params = {}) =>
  fetchBinary(`/finance/inventory/items/export${buildQueryString(params)}`);
export const downloadFinanceInventoryItemImportTemplate = () =>
  api.get("/finance/imports/templates/inventory-items", { responseType: "blob" });
export const previewFinanceInventoryItemImport = (file, options = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.mode) formData.append("mode", options.mode);
  return unwrap(
    api.post("/finance/imports/inventory-items/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};
export const commitFinanceInventoryItemImport = (file, options = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.mode) formData.append("mode", options.mode);
  return unwrap(
    api.post("/finance/imports/inventory-items/commit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const listVendors = (params = {}) => unwrap(api.get("/finance/vendors", { params }));
export const createVendor = (payload) => unwrap(api.post("/finance/vendors", payload));
export const updateVendor = (id, payload) => unwrap(api.patch(`/finance/vendors/${id}`, payload));
export const deleteVendor = (id) => unwrap(api.delete(`/finance/vendors/${id}`));
export const downloadFinanceVendorImportTemplate = () =>
  api.get("/finance/imports/templates/vendors", { responseType: "blob" });
export const previewFinanceVendorImport = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return unwrap(
    api.post("/finance/imports/vendors/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};
export const commitFinanceVendorImport = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return unwrap(
    api.post("/finance/imports/vendors/commit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const listPurchases = (params = {}) => unwrap(api.get("/finance/purchases", { params }));
export const createPurchase = (payload) => unwrap(api.post("/finance/purchases", payload));
export const updatePurchase = (id, payload) => unwrap(api.patch(`/finance/purchases/${id}`, payload));
export const deletePurchase = (id) => unwrap(api.delete(`/finance/purchases/${id}`));
export const voidPurchase = (id, payload = {}) =>
  unwrap(api.post(`/finance/purchases/${id}/void`, payload));

export const listMyWorkOrders = (params = {}) => unwrap(api.get("/finance/my-work-orders", { params }));
export const getMyWorkOrder = (id) => unwrap(api.get(`/finance/my-work-orders/${id}`));
export const submitMyFieldReport = (id, payload) =>
  unwrap(api.post(`/finance/my-work-orders/${id}/field-report`, payload));
export const listMyFieldReports = (params = {}) => unwrap(api.get("/finance/my-field-reports", { params }));
export const getFieldReport = (id) => unwrap(api.get(`/finance/field-reports/${id}`));
export const listWorkOrderFieldReports = (workOrderId, params = {}) =>
  unwrap(api.get(`/finance/work-orders/${workOrderId}/field-reports`, { params }));
export const getPlanVsReported = (fieldReportId) =>
  unwrap(api.get(`/finance/field-reports/${fieldReportId}/plan-vs-reported`));
export const requestFieldReportClarification = (fieldReportId) =>
  unwrap(api.post(`/finance/field-reports/${fieldReportId}/clarification`));
export const rejectFieldReport = (fieldReportId) =>
  unwrap(api.post(`/finance/field-reports/${fieldReportId}/reject`));

export const listWorkOrderReviews = (workOrderId, params = {}) =>
  unwrap(api.get(`/finance/work-orders/${workOrderId}/reviews`, { params }));
export const createWorkOrderReview = (workOrderId, payload) =>
  unwrap(api.post(`/finance/work-orders/${workOrderId}/reviews`, payload));
export const getWorkOrderReview = (reviewId) =>
  unwrap(api.get(`/finance/work-order-reviews/${reviewId}`));
export const updateWorkOrderReview = (reviewId, payload) =>
  unwrap(api.patch(`/finance/work-order-reviews/${reviewId}`, payload));
export const approveWorkOrderReview = (reviewId, payload) =>
  unwrap(api.post(`/finance/work-order-reviews/${reviewId}/approve`, payload));
export const requestReviewClarification = (reviewId) =>
  unwrap(api.post(`/finance/work-order-reviews/${reviewId}/request-clarification`));
export const rejectWorkOrderReview = (reviewId) =>
  unwrap(api.post(`/finance/work-order-reviews/${reviewId}/reject`));

export const getWorkOrderProfitability = (workOrderId) =>
  unwrap(api.get(`/finance/work-orders/${workOrderId}/profitability`));
export const getFinanceProfitabilityReport = (params = {}) =>
  unwrap(api.get("/finance/reports/profitability", { params }));
export const getFinanceTaxSummary = (params = {}) =>
  unwrap(api.get("/finance/reports/tax-summary", { params }));
export const getFinanceMissingData = (params = {}) =>
  unwrap(api.get("/finance/reports/missing-data", { params }));
export const getFinanceMonthEnd = (params = {}) =>
  unwrap(api.get("/finance/month-end", { params }));
export const exportFinanceMonthEndCsv = (payload) =>
  api.post("/finance/month-end/export", payload, { responseType: "blob" });
export const downloadFinanceAccountantPackage = (payload) =>
  api.post("/finance/month-end/accountant-package", payload, { responseType: "blob" });
export const listFinanceAccountantPackageHistory = (params = {}) =>
  unwrap(api.get("/finance/month-end/accountant-package/history", { params }));

export const listExpenseCategories = () => unwrap(api.get("/finance/expense-categories"));
export const getExpenseCategory = (id) => unwrap(api.get(`/finance/expense-categories/${id}`));
export const createExpenseCategory = (payload) => unwrap(api.post("/finance/expense-categories", payload));

export const listExpenses = (params = {}) => unwrap(api.get("/finance/expenses", { params }));
export const createExpense = (payload) => unwrap(api.post("/finance/expenses", payload));
export const getExpense = (id) => unwrap(api.get(`/finance/expenses/${id}`));
export const updateExpense = (id, payload) => unwrap(api.patch(`/finance/expenses/${id}`, payload));
export const deleteExpense = (id) => unwrap(api.delete(`/finance/expenses/${id}`));
export const bulkUpdateExpenseReviewStatus = (payload) =>
  unwrap(api.post("/finance/expenses/bulk-review-status", payload));
export const listReceiptInbox = (params = {}) =>
  unwrap(api.get("/finance/receipt-inbox", { params }));
export const getReceiptInboxItem = (id) =>
  unwrap(api.get(`/finance/receipt-inbox/${id}`));
export const updateReceiptInboxItem = (id, payload) =>
  unwrap(api.patch(`/finance/receipt-inbox/${id}`, payload));
export const uploadReceiptInbox = async (file, note = "") => {
  const formData = new FormData();
  formData.append("file", file);
  if (note) formData.append("note", note);
  const res = await api.post("/finance/receipt-inbox", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
export const linkReceiptInboxExpense = (id, payload) =>
  unwrap(api.post(`/finance/receipt-inbox/${id}/link-expense`, payload));
export const createExpenseFromReceiptInbox = (id, payload) =>
  unwrap(api.post(`/finance/receipt-inbox/${id}/create-expense`, payload));
export const previewRecurringExpenses = (params = {}) =>
  unwrap(api.get("/finance/expenses/recurring/due", { params }));
export const generateRecurringExpenseDrafts = (payload) =>
  unwrap(api.post("/finance/expenses/recurring/generate", payload));
export const uploadExpenseReceipt = async (id, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post(`/finance/expenses/${id}/receipt`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
export const deleteExpenseReceipt = (expenseId, receiptId) =>
  unwrap(api.delete(`/finance/expenses/${expenseId}/receipts/${encodeURIComponent(receiptId)}`));

export const exportAccountantCsv = (payload) =>
  api.post("/finance/reports/accountant-export", payload, { responseType: "blob" });

export const listFinanceClients = (params = {}) =>
  unwrap(api.get("/finance/clients", { params }));
export const getFinanceClient = (id) =>
  unwrap(api.get(`/finance/clients/${id}`));
export const createFinanceClient = (payload) =>
  unwrap(api.post("/finance/clients", payload));
export const updateFinanceClient = (id, payload) =>
  unwrap(api.patch(`/finance/clients/${id}`, payload));
export const archiveFinanceClient = (id) =>
  unwrap(api.delete(`/finance/clients/${id}`));
export const downloadFinanceClientImportTemplate = () =>
  api.get("/finance/imports/templates/clients", { responseType: "blob" });
export const previewFinanceClientImport = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return unwrap(
    api.post("/finance/imports/clients/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};
export const commitFinanceClientImport = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return unwrap(
    api.post("/finance/imports/clients/commit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};
export const listFinanceImportHistory = (type) =>
  unwrap(api.get("/finance/imports/history", { params: type ? { type } : {} }));

export const listManagerClients = async (params = {}) => {
  const payload = await listFinanceClients(params);
  return pickArray(payload, ["items", "data"]);
};

export const createManagerClient = async (payload) => {
  const created = await createFinanceClient(payload);
  return created?.client || created;
};

export const getManagerClient = async (id) => {
  const payload = await getFinanceClient(id);
  return payload?.client || payload;
};

export const listBillingRecipients = async (params = {}) => {
  const res = await api.get("/manager/billing-recipients", { params });
  return pickArray(res.data?.recipients || res.data, ["recipients", "items", "data"]);
};

export const createBillingRecipient = async (payload) => {
  const res = await api.post("/manager/billing-recipients", payload);
  return res.data?.recipient || res.data;
};

export const listRecruitersForAssignment = async () => {
  const res = await api.get("/manager/recruiters");
  return pickArray(res.data, ["recruiters", "items", "data"]).map(normalizeRecruiterRow);
};
