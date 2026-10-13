const RETURN_KEY = "schedulaa:kiosk-manager-return";

const normalizeManagerReturn = (appointmentId) => {
  const id = Number(appointmentId);
  return Number.isInteger(id) && id > 0
    ? `/manager/booking-checkout?appointmentId=${id}`
    : "/manager/booking-checkout";
};

export const beginKioskCustomerHandoff = ({
  token,
  appointmentId,
  navigateTo = (url) => window.location.assign(url),
}) => {
  if (!token) throw new Error("Kiosk token is required.");
  const returnPath = normalizeManagerReturn(appointmentId);
  sessionStorage.setItem(RETURN_KEY, returnPath);

  // Kiosk is a customer handoff on the same device. A full navigation after
  // clearing staff credentials is deliberate: hiding manager chrome alone
  // would leave direct manager routes authenticated in this browser.
  ["token", "clientToken", "role", "userRole", "company_id", "user_id", "userId"].forEach((key) => {
    localStorage.removeItem(key);
  });
  navigateTo(`/kiosk/pay/${encodeURIComponent(token)}`);
};

export const kioskManagerLoginTarget = () => {
  const returnPath = sessionStorage.getItem(RETURN_KEY) || "/manager/booking-checkout";
  return `/login?next=${encodeURIComponent(returnPath)}`;
};

export const clearKioskManagerReturn = () => {
  sessionStorage.removeItem(RETURN_KEY);
};
