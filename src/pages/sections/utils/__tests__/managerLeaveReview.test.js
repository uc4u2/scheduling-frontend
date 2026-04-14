import {
  buildManagerLeaveRequestQuery,
  buildManagerLeaveCancelPayload,
  buildManagerLeaveReviewPayload,
  canManagerCancelLeave,
  defaultManagerLeaveFilters,
  defaultManagerLeaveReviewDraft,
  normalizeLeavePagination,
} from "../managerLeaveReview";

describe("manager leave review helpers", () => {
  it("defaults adjustment fields from the leave request", () => {
    expect(defaultManagerLeaveReviewDraft({
      requested_hours: 6,
      is_paid_leave: false,
      leave_type: "vacation",
    })).toMatchObject({
      approved_hours: 6,
      is_paid_leave: false,
      leave_type: "vacation",
      leave_subtype: "",
    });
  });

  it("builds approve payload with manager adjustments", () => {
    expect(buildManagerLeaveReviewPayload(
      { id: 9, leave_type: "sick" },
      {
        approved_hours: "4.5",
        is_paid_leave: true,
        leave_type: "compassionate",
        leave_subtype: "parental",
        manager_adjust_reason: "Approved partial hours",
        comment: "OK",
      },
      "approve"
    )).toEqual({
      request_id: 9,
      action: "approve",
      comment: "OK",
      approved_hours: 4.5,
      is_paid_leave: true,
      leave_type: "compassionate",
      leave_subtype: "parental",
      manager_adjust_reason: "Approved partial hours",
    });
  });

  it("keeps reject payload comment-only", () => {
    expect(buildManagerLeaveReviewPayload(
      { id: 9 },
      { approved_hours: "8", is_paid_leave: true, comment: "Not enough coverage" },
      "reject"
    )).toEqual({
      request_id: 9,
      action: "reject",
      comment: "Not enough coverage",
    });
  });

  it("normalizes missing pagination defensively", () => {
    expect(normalizeLeavePagination()).toEqual({
      page: 1,
      page_size: 25,
      total: 0,
      total_pages: 1,
    });
  });

  it("allows manager cancellation only for pending and approved leave", () => {
    expect(canManagerCancelLeave({ status: "pending" })).toBe(true);
    expect(canManagerCancelLeave({ status: "approved" })).toBe(true);
    expect(canManagerCancelLeave({ status: "cancelled" })).toBe(false);
    expect(canManagerCancelLeave({ status: "rejected" })).toBe(false);
  });

  it("requires a cancellation reason", () => {
    expect(buildManagerLeaveCancelPayload({ id: 5 }, "  ")).toEqual({
      error: "Cancellation reason is required.",
    });
    expect(buildManagerLeaveCancelPayload({ id: 5 }, "Employee returned early")).toEqual({
      request_id: 5,
      action: "cancel",
      cancel_reason: "Employee returned early",
    });
    expect(buildManagerLeaveCancelPayload({ id: 5 }, "Employee returned early", { restore_linked_shift: true })).toEqual({
      request_id: 5,
      action: "cancel",
      cancel_reason: "Employee returned early",
      restore_linked_shift: true,
    });
  });

  it("builds leave list query params from active filters only", () => {
    const params = buildManagerLeaveRequestQuery({
      ...defaultManagerLeaveFilters(),
      status: "approved",
      start_date: "2026-04-01",
      end_date: "2026-04-30",
      leave_type: "sick",
      is_paid_leave: "true",
      payroll_ready: "false",
      has_warnings: "true",
      warning_code: "approved_leave_overlaps_shift",
      duration_mode: "full_day",
    }, 2, 50);

    expect(params.toString()).toContain("status=approved");
    expect(params.toString()).toContain("page=2");
    expect(params.toString()).toContain("page_size=50");
    expect(params.toString()).toContain("start_date=2026-04-01");
    expect(params.toString()).toContain("warning_code=approved_leave_overlaps_shift");
    expect(params.toString()).not.toContain("department_id=");
  });
});
