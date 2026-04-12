import { formatLeaveWarningReason, getLeaveReviewVisibility } from "../leaveReviewVisibility";

describe("leave review visibility", () => {
  it("normalizes payroll-ready paid leave fields", () => {
    const meta = getLeaveReviewVisibility({
      status: "approved",
      is_paid_leave: true,
      leave_payroll_ready: true,
      approved_hours: 6,
    });

    expect(meta.payShortLabel).toBe("Paid PTO");
    expect(meta.payrollReady).toBe(true);
    expect(meta.payrollLabel).toBe("Payroll-ready");
    expect(meta.computedHours).toBe(6);
    expect(meta.actionNeeded).toBe(false);
  });

  it("marks estimated or overlapping leave as needing manager attention", () => {
    const meta = getLeaveReviewVisibility({
      status: "approved",
      is_paid_leave: false,
      leave_hours_estimated: true,
      leave_preview_warnings: [{ code: "approved_leave_overlaps_worked_time" }],
    });

    expect(meta.payShortLabel).toBe("Unpaid TO");
    expect(meta.estimated).toBe(true);
    expect(meta.hasWorkedOverlap).toBe(true);
    expect(meta.actionNeeded).toBe(true);
    expect(formatLeaveWarningReason(meta.warningCodes[0])).toBe("Leave overlaps worked time");
  });
});
