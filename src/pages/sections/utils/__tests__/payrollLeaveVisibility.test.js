import { formatLeaveBlockerReason, getPayrollLeaveVisibility } from "../payrollLeaveVisibility";

describe("getPayrollLeaveVisibility", () => {
  it("handles missing additive payroll leave fields safely", () => {
    const meta = getPayrollLeaveVisibility({});
    expect(meta.hasLeaveData).toBe(false);
    expect(meta.finalizationBlocked).toBe(false);
    expect(meta.blockers).toEqual([]);
    expect(meta.payrollReadyLeaveCount).toBe(0);
  });

  it("summarizes payroll-ready and preview-only leave", () => {
    const meta = getPayrollLeaveVisibility({
      payroll_leave_visibility: {
        summary: {
          payroll_ready_leave_count: 1,
          preview_only_leave_count: 2,
          paid_leave_ready_hours: 6,
          unpaid_leave_ready_hours: 3,
          preview_unpaid_leave_hours: 5,
        },
      },
    });

    expect(meta.hasLeaveData).toBe(true);
    expect(meta.payrollReadyLeaveCount).toBe(1);
    expect(meta.previewOnlyLeaveCount).toBe(2);
    expect(meta.paidLeaveReadyHours).toBe(6);
    expect(meta.unpaidLeaveReadyHours).toBe(3);
    expect(meta.previewUnpaidLeaveHours).toBe(5);
  });

  it("detects finalization blockers from payroll preview payload", () => {
    const meta = getPayrollLeaveVisibility({
      payroll_leave_preview: {
        finalization_blockers: [
          { reason_code: "payroll_leave_worked_time_overlap", leave_id: 10 },
        ],
      },
    });

    expect(meta.finalizationBlocked).toBe(true);
    expect(meta.blockers[0].leave_id).toBe(10);
    expect(formatLeaveBlockerReason(meta.blockers[0].reason_code)).toBe(
      "Leave overlaps worked time"
    );
  });
});
