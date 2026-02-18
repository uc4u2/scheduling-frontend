import api from "../../utils/api";

export const openBillingPortal = async () => {
  const res = await api.post("/billing/portal");
  const url = res?.data?.url;
  if (!url) {
    throw new Error("Billing portal URL missing.");
  }
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
  return url;
};
