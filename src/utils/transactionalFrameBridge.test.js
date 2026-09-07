import {
  measureTransactionalContent,
  publishTransactionalMeasurement,
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
});
