import api from "../../utils/api";

export const openBillingPortal = async () => {
  try {
    const res = await api.post("/billing/portal");
    const url = res?.data?.url;
    if (url && typeof window !== "undefined") {
      window.location.href = url;
    }
    return url;
  } catch (err) {
    const apiError = err?.response?.data?.error;
    if (apiError === "billing_customer_missing" && typeof window !== "undefined") {
      window.location.href = "/manager/settings?tab=billing";
    }
    throw err;
  }
};
