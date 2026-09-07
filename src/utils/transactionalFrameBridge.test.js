import {
  measureTransactionalContent,
  normalizeTransactionalReturnPath,
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
});
