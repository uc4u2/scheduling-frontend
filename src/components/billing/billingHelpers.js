import api from "../../utils/api";
import { isMobileComplianceMode, MOBILE_PAYMENTS_MESSAGE } from "../../utils/mobileCompliance";

export const openBillingPortal = async () => {
  if (isMobileComplianceMode()) {
    throw new Error(MOBILE_PAYMENTS_MESSAGE);
  }
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
