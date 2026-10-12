import { payrollPaymentStatusDisplay } from "./PayrollRawPage";

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {},
}));

describe("PayrollRawPage payment status presentation", () => {
  test.each([
    ["paid", "Paid", "success"],
    ["processing", "Processing", "warning"],
    ["failed", "Failed", "error"],
    ["canceled", "Canceled", "error"],
    ["not_requested", "Not requested", "default"],
    ["not_finalized", "Not finalized", "default"],
  ])("displays %s faithfully", (status, label, color) => {
    expect(payrollPaymentStatusDisplay(status)).toEqual({ label, color });
  });

  test.each([undefined, null, ""])("does not turn missing status %p into not requested", (status) => {
    expect(payrollPaymentStatusDisplay(status)).toEqual({
      label: "Unavailable",
      color: "default",
    });
  });

  test("shows unsupported status as unknown", () => {
    expect(payrollPaymentStatusDisplay("provider_new_state")).toEqual({
      label: "Unknown",
      color: "default",
    });
  });
});
