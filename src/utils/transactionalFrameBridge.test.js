import {
  buildClientOrderDashboardReturnPath,
  measureTransactionalContent,
  normalizeClientOrderReturnPath,
  normalizePackageCheckoutReturnPath,
  normalizeTransactionalReturnPath,
  parseClientOrderDestination,
  publishTransactionalMeasurement,
  requestTransactionalNavigation,
} from "./transactionalFrameBridge";

describe("transactionalFrameBridge", () => {
  it("reports the complete embedded content height to the Next presentation shell", () => {
    const node = {
      scrollHeight: 1120,
      getBoundingClientRect: () => ({ height: 940.4 }),
    };
    const targetWindow = { postMessage: jest.fn() };

    expect(measureTransactionalContent(node)).toBe(1120);
    expect(publishTransactionalMeasurement(targetWindow, node)).toBe(1122);
    expect(targetWindow.postMessage).toHaveBeenNthCalledWith(
      1,
      { type: "schedulaa:transactional-ready" },
      "*"
    );
    expect(targetWindow.postMessage).toHaveBeenNthCalledWith(
      2,
      { type: "schedulaa:transactional-resize", height: 1122 },
      "*"
    );
  });

  it("expands an embedded frame to the full checkout dialog content height", () => {
    const title = {
      scrollHeight: 56,
      getBoundingClientRect: () => ({ height: 56 }),
    };
    const content = {
      scrollHeight: 1280,
      getBoundingClientRect: () => ({ height: 360 }),
    };
    const paper = {
      children: [title, content],
      querySelector: (selector) => selector === ".MuiDialogContent-root" ? content : null,
    };
    const dialog = {
      querySelector: (selector) => selector === ".MuiDialog-paper" ? paper : null,
    };
    const basket = {
      scrollHeight: 430,
      getBoundingClientRect: () => ({ height: 430 }),
    };

    expect(measureTransactionalContent(basket, [dialog])).toBe(1400);
  });

  it("only requests parent navigation for safe tenant-relative return paths", () => {
    const targetWindow = { postMessage: jest.fn() };

    expect(normalizeTransactionalReturnPath("/web-design/products?from=basket")).toBe(
      "/web-design/products?from=basket"
    );
    expect(normalizeTransactionalReturnPath("https://evil.example/products")).toBe("");
    expect(normalizeTransactionalReturnPath("//evil.example/products")).toBe("");
    expect(requestTransactionalNavigation(targetWindow, "/web-design/products")).toBe(true);
    expect(targetWindow.postMessage).toHaveBeenCalledWith(
      {
        type: "schedulaa:transactional-navigate",
        href: "/web-design/products",
      },
      "*"
    );
  });

  it("accepts only tenant-scoped package checkout continuations", () => {
    expect(normalizePackageCheckoutReturnPath(
      "/studio/packages/return?session_id=cs_test_1&site=studio",
      "studio",
    )).toBe("/studio/packages/return?session_id=cs_test_1&site=studio");
    expect(normalizePackageCheckoutReturnPath(
      "/packages/return?session_id=cs_custom_1&site=studio",
      "studio",
    )).toBe("/packages/return?session_id=cs_custom_1&site=studio");
    expect(normalizePackageCheckoutReturnPath(
      "/dashboard?package_return=1&session_id=cs_direct_1&site=studio",
      "studio",
    )).toBe("/dashboard?package_return=1&session_id=cs_direct_1&site=studio");
    expect(normalizePackageCheckoutReturnPath(
      "/dashboard?package_return=1&session_id=cs_unscoped_1",
      "studio",
    )).toBe("");
    expect(normalizePackageCheckoutReturnPath(
      "/other/packages/return?session_id=cs_wrong_1",
      "studio",
    )).toBe("");
    expect(normalizePackageCheckoutReturnPath(
      "/studio/packages/return?session_id=cs_wrong_2&site=other",
      "studio",
    )).toBe("");
    expect(normalizePackageCheckoutReturnPath(
      "/studio/packages/return?session_id={CHECKOUT_SESSION_ID}",
      "studio",
    )).toBe("");
  });

  it("accepts only tenant-scoped positive order destinations", () => {
    expect(parseClientOrderDestination("?view=orders&order_id=51", "studio"))
      .toEqual({ requested: true, valid: true, orderId: 51 });
    expect(parseClientOrderDestination("?view=orders&order_id=0", "studio"))
      .toEqual({ requested: true, valid: false, orderId: null });
    expect(parseClientOrderDestination("?view=orders&order_id=999999999999999999999", "studio"))
      .toEqual({ requested: true, valid: false, orderId: null });
    expect(parseClientOrderDestination("?view=orders&order_id=51&site=other", "studio"))
      .toEqual({ requested: true, valid: false, orderId: 51 });
    expect(parseClientOrderDestination("?order_id=51", "studio"))
      .toEqual({ requested: false, valid: false, orderId: null });

    expect(normalizeClientOrderReturnPath(
      "/studio/my-bookings?view=orders&order_id=51&site=studio&unsafe=secret",
      "studio",
    )).toBe("/studio/my-bookings?view=orders&order_id=51");
    expect(normalizeClientOrderReturnPath(
      "/dashboard?site=studio&view=orders&order_id=51&embed=1",
      "studio",
    )).toBe("/dashboard?site=studio&view=orders&order_id=51&embed=1");
    expect(normalizeClientOrderReturnPath(
      "/other/my-bookings?view=orders&order_id=51",
      "studio",
    )).toBe("");
    expect(normalizeClientOrderReturnPath(
      "/studio/my-bookings?view=orders&order_id=-1",
      "studio",
    )).toBe("");
  });

  it("builds a direct dashboard continuation only from a valid scoped order query", () => {
    expect(buildClientOrderDashboardReturnPath(
      "?site=studio&view=orders&order_id=91&embed=1",
      "studio",
    )).toBe("/dashboard?site=studio&view=orders&order_id=91&embed=1");
    expect(buildClientOrderDashboardReturnPath(
      "?site=other&view=orders&order_id=91",
      "studio",
    )).toBe("");
  });
});
