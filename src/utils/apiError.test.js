import { extractApiErrorMessage, parseApiErrorPayload } from "./apiError";

describe("apiError helpers", () => {
  it("extracts message from JSON blob error responses", async () => {
    const blob = {
      text: async () => JSON.stringify({ message: "Payroll-ready leave overlaps actual worked time." }),
    };

    await expect(extractApiErrorMessage({ response: { data: blob } })).resolves.toBe(
      "Payroll-ready leave overlaps actual worked time."
    );
  });

  it("parses object payloads and falls back safely", async () => {
    await expect(parseApiErrorPayload({ error_code: "payroll_leave_worked_time_overlap" })).resolves.toEqual({
      error_code: "payroll_leave_worked_time_overlap",
    });
    await expect(extractApiErrorMessage({}, "Fallback message")).resolves.toBe("Fallback message");
  });
});
