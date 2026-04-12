import { formatLeaveApiError } from "../leaveErrors";

describe("leave error formatting", () => {
  test("explains finalized payroll attachment lock in employee-friendly language", async () => {
    const err = {
      response: {
        data: {
          error_code: "leave_attachment_locked_by_finalized_payroll",
          finalized_payroll: {
            start_date: "2026-04-01",
            end_date: "2026-04-15",
          },
        },
      },
    };

    await expect(formatLeaveApiError(err)).resolves.toBe(
      "This leave is locked because payroll has already been finalized. Payroll period: 2026-04-01 to 2026-04-15. Ask your manager or payroll admin if the document still needs to be added to records."
    );
  });

  test("explains attachment file validation errors", async () => {
    await expect(formatLeaveApiError({ response: { data: { error_code: "file_type_not_allowed" } } })).resolves.toBe(
      "This file type is not supported. Upload a PDF, Word document, PNG, or JPG file."
    );
    await expect(formatLeaveApiError({ response: { data: { error_code: "file_missing" } } })).resolves.toBe(
      "Choose a supporting document before uploading."
    );
  });
});
