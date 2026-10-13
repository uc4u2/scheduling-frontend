import {
  beginKioskCustomerHandoff,
  kioskManagerLoginTarget,
} from "./kioskHandoff";

describe("Kiosk same-device handoff", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("removes manager credentials before entering the customer context", () => {
    localStorage.setItem("token", "manager-jwt");
    localStorage.setItem("role", "manager");
    localStorage.setItem("company_id", "36");
    localStorage.setItem("user_id", "8");
    localStorage.setItem("clientToken", "stale-client-jwt");
    localStorage.setItem("userRole", "manager");
    localStorage.setItem("userId", "8");
    const navigateTo = jest.fn();

    beginKioskCustomerHandoff({
      token: "signed.kiosk",
      appointmentId: 44,
      navigateTo,
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
    expect(localStorage.getItem("company_id")).toBeNull();
    expect(localStorage.getItem("user_id")).toBeNull();
    expect(localStorage.getItem("clientToken")).toBeNull();
    expect(localStorage.getItem("userRole")).toBeNull();
    expect(localStorage.getItem("userId")).toBeNull();
    expect(navigateTo).toHaveBeenCalledWith("/kiosk/pay/signed.kiosk");
    expect(kioskManagerLoginTarget()).toBe(
      "/login?next=%2Fmanager%2Fbooking-checkout%3FappointmentId%3D44"
    );
  });
});
