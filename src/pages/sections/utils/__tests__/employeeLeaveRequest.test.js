import {
  applyEmployeeLeaveDurationMode,
  applyEmployeeLeaveStartDate,
  buildEmployeeLeaveRequestSubmission,
  canWithdrawEmployeeLeave,
  defaultEmployeeLeaveForm,
  normalizeEmployeeLeaveRequest,
  validateEmployeeLeaveForm,
} from "../employeeLeaveRequest";

describe("employee leave request helpers", () => {
  it("builds a full-day date-range leave request for the general leave endpoint", () => {
    const result = buildEmployeeLeaveRequestSubmission({
      leave_type: "vacation",
      reason: "Family trip",
      duration_mode: "full_day",
      start_date: "2026-04-13",
      end_date: "2026-04-15",
      is_paid_leave: true,
    });

    expect(result.endpoint).toBe("/leave/request");
    expect(result.payload).toMatchObject({
      leave_type: "vacation",
      duration_mode: "full_day",
      start_date: "2026-04-13",
      end_date: "2026-04-15",
      is_paid_leave: true,
    });
  });

  it("builds an hourly leave request with requested hours", () => {
    const result = buildEmployeeLeaveRequestSubmission({
      leave_type: "compassionate",
      duration_mode: "hourly",
      start_date: "2026-04-13",
      end_date: "2026-04-13",
      requested_hours: "3.5",
      is_paid_leave: true,
    });

    expect(result.endpoint).toBe("/leave/request");
    expect(result.payload.leave_type).toBe("compassionate");
    expect(result.payload.requested_hours).toBe(3.5);
  });

  it("builds a partial-day leave request with start and end time", () => {
    const result = buildEmployeeLeaveRequestSubmission({
      leave_type: "personal",
      duration_mode: "partial_day",
      start_date: "2026-04-13",
      end_date: "2026-04-13",
      start_time: "10:00",
      end_time: "13:00",
      is_paid_leave: false,
    });

    expect(result.endpoint).toBe("/leave/request");
    expect(result.payload).toMatchObject({
      duration_mode: "partial_day",
      start_time: "10:00",
      end_time: "13:00",
      is_paid_leave: false,
    });
  });

  it("keeps shift-linked leave on the shift endpoint", () => {
    const shift = {
      id: 42,
      clock_in: "2026-04-13T09:00:00",
      clock_out: "2026-04-13T17:00:00",
    };
    const result = buildEmployeeLeaveRequestSubmission({
      leave_type: "sick",
      duration_mode: "shift_linked",
      is_paid_leave: true,
    }, shift);

    expect(result.endpoint).toBe("/employee/leave-request");
    expect(result.payload).toMatchObject({
      shift_id: 42,
      start: shift.clock_in,
      end: shift.clock_out,
      duration_mode: "shift_linked",
    });
  });

  it("validates hourly and partial-day required fields", () => {
    expect(validateEmployeeLeaveForm({
      leave_type: "sick",
      duration_mode: "hourly",
      start_date: "2026-04-13",
      end_date: "2026-04-13",
    })).toBe("Hourly leave requires requested hours.");

    expect(validateEmployeeLeaveForm({
      leave_type: "personal",
      duration_mode: "partial_day",
      start_date: "2026-04-13",
      end_date: "2026-04-14",
      requested_hours: "2",
    })).toBe("Partial-day leave must be same-day.");
  });

  it("resets dependent fields when switching duration modes", () => {
    const base = {
      duration_mode: "partial_day",
      start_date: "2026-04-13",
      end_date: "2026-04-13",
      requested_hours: "2",
      start_time: "10:00",
      end_time: "12:00",
    };

    expect(applyEmployeeLeaveDurationMode(base, "full_day")).toMatchObject({
      duration_mode: "full_day",
      end_date: "2026-04-13",
      requested_hours: "",
      start_time: "",
      end_time: "",
    });

    expect(applyEmployeeLeaveDurationMode({ ...base, end_date: "2026-04-15" }, "hourly")).toMatchObject({
      duration_mode: "hourly",
      end_date: "2026-04-13",
      requested_hours: "2",
      start_time: "",
      end_time: "",
    });
  });

  it("keeps hourly and partial-day leave same-day when start date changes", () => {
    expect(applyEmployeeLeaveStartDate({
      duration_mode: "hourly",
      start_date: "2026-04-13",
      end_date: "2026-04-13",
    }, "2026-04-14")).toMatchObject({
      start_date: "2026-04-14",
      end_date: "2026-04-14",
    });

    expect(applyEmployeeLeaveStartDate({
      duration_mode: "full_day",
      start_date: "2026-04-13",
      end_date: "2026-04-15",
    }, "2026-04-14")).toMatchObject({
      start_date: "2026-04-14",
      end_date: "2026-04-15",
    });
  });

  it("normalizes employee leave history rows defensively", () => {
    expect(normalizeEmployeeLeaveRequest({
      leave_id: 7,
      leave_type: "sick",
      reason: "Doctor visit",
      status: "Approved",
      requested_hours: 4,
      approved_hours: 3,
      is_paid_leave: false,
      review_comment: "Adjusted",
      payroll_ready: true,
      created_at: "2026-04-11T10:00:00",
      reviewer_name: "Mina Manager",
    })).toMatchObject({
      id: 7,
      status: "approved",
      reason: "Doctor visit",
      requested_hours: 4,
      approved_hours: 3,
      is_paid_leave: false,
      review_comment: "Adjusted",
      payroll_ready: true,
      created_at: "2026-04-11T10:00:00",
      reviewer_name: "Mina Manager",
    });
  });

  it("defaults shift-linked forms from a selected shift", () => {
    const form = defaultEmployeeLeaveForm({
      id: 10,
      date: "2026-04-13",
      clock_in: "2026-04-13T09:00:00",
    }, new Date("2026-04-11T12:00:00"));

    expect(form.duration_mode).toBe("shift_linked");
    expect(form.start_date).toBe("2026-04-13");
    expect(form.end_date).toBe("2026-04-13");
  });

  it("shows withdraw only for active pending leave requests", () => {
    expect(canWithdrawEmployeeLeave({ status: "pending" })).toBe(true);
    expect(canWithdrawEmployeeLeave({ status: "approved" })).toBe(false);
    expect(canWithdrawEmployeeLeave({ status: "pending", withdrawn_at: "2026-04-13T10:00:00" })).toBe(false);
    expect(canWithdrawEmployeeLeave({ status: "pending", cancelled_at: "2026-04-13T10:00:00" })).toBe(false);
  });
});
