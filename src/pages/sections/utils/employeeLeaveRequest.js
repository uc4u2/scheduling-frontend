import { differenceInCalendarDays, differenceInMinutes, format, parseISO } from "date-fns";
import { normalizeLeaveAttachment } from "./leaveAttachments";

const isoDate = (value, fallback = "") => {
  if (!value) return fallback;
  try {
    return format(parseISO(value), "yyyy-MM-dd");
  } catch {
    return String(value).slice(0, 10) || fallback;
  }
};

export const defaultEmployeeLeaveForm = (shift = null, today = new Date()) => {
  const todayStr = format(today, "yyyy-MM-dd");
  const shiftDate = shift?.date || isoDate(shift?.clock_in, todayStr);
  return {
    leave_type: "sick",
    leave_subtype: "",
    reason: "",
    duration_mode: shift?.id ? "shift_linked" : "full_day",
    start_date: shiftDate,
    end_date: shiftDate,
    requested_hours: "",
    start_time: "",
    end_time: "",
    is_paid_leave: true,
  };
};

export const normalizeEmployeeLeaveRequest = (request = {}) => ({
  id: request.id || request.leave_id,
  leave_type: request.leave_type || "Leave",
  leave_subtype: request.leave_subtype || "",
  reason: request.reason || "",
  status: String(request.status || "pending").toLowerCase(),
  duration_mode: request.duration_mode || "full_day",
  start_date: request.start_date || "",
  end_date: request.end_date || request.start_date || "",
  start_time: request.start_time || null,
  end_time: request.end_time || null,
  requested_hours: request.requested_hours ?? request.override_hours ?? null,
  approved_hours: request.approved_hours ?? null,
  is_paid_leave: Boolean(request.is_paid_leave ?? request.paid_flag ?? true),
  review_comment: request.review_comment || "",
  payroll_ready: Boolean(request.payroll_ready ?? request.leave_approved_for_payroll ?? false),
  created_at: request.created_at || null,
  updated_at: request.updated_at || null,
  reviewed_at: request.reviewed_at || null,
  reviewer_name: request.reviewer_name || request.reviewed_by_name || "",
  withdrawn_at: request.withdrawn_at || null,
  cancelled_at: request.cancelled_at || null,
  cancel_reason: request.cancel_reason || "",
  shift_id: request.shift_id || request.linked_shift_id || null,
  attachment: normalizeLeaveAttachment(request),
  balance_impact: request.balance_impact || null,
});

export const applyEmployeeLeaveDurationMode = (form = {}, nextMode = "full_day") => {
  const startDate = form.start_date || form.end_date || "";
  return {
    ...form,
    duration_mode: nextMode,
    end_date: nextMode === "partial_day" || nextMode === "hourly" ? startDate : (form.end_date || startDate),
    requested_hours: nextMode === "full_day" ? "" : form.requested_hours || "",
    start_time: nextMode === "partial_day" ? form.start_time || "" : "",
    end_time: nextMode === "partial_day" ? form.end_time || "" : "",
  };
};

export const applyEmployeeLeaveStartDate = (form = {}, startDate = "") => ({
  ...form,
  start_date: startDate,
  end_date:
    form.duration_mode === "partial_day" || form.duration_mode === "hourly" || !form.end_date
      ? startDate
      : form.end_date,
});

export const validateEmployeeLeaveForm = (form = {}, selectedShift = null) => {
  if (!form.leave_type) return "Leave type is required.";
  if (form.duration_mode === "shift_linked") {
    if (!selectedShift?.id) return "Select a shift for shift-linked leave.";
    return "";
  }
  if (!form.start_date) return "Start date is required.";
  if (!form.end_date) return "End date is required.";
  if (form.end_date < form.start_date) return "End date must be on or after start date.";
  if (form.duration_mode === "hourly" && !form.requested_hours) {
    return "Hourly leave requires requested hours.";
  }
  if (form.requested_hours && Number(form.requested_hours) <= 0) {
    return "Requested hours must be greater than 0.";
  }
  if (form.duration_mode === "partial_day") {
    if (form.end_date !== form.start_date) return "Partial-day leave must be same-day.";
    if (!form.requested_hours && !(form.start_time && form.end_time)) {
      return "Partial-day leave requires hours or start/end time.";
    }
  }
  return "";
};

const optionalNumber = (value) => (value === "" || value === null || value === undefined ? null : Number(value));

const positiveNumberOrZero = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const hoursBetween = (start, end) => {
  if (!start || !end) return 0;
  try {
    const minutes = differenceInMinutes(new Date(end), new Date(start));
    return minutes > 0 ? Math.round((minutes / 60) * 100) / 100 : 0;
  } catch {
    return 0;
  }
};

export const estimateEmployeeLeaveRequestedHours = (form = {}, selectedShift = null, selectedBalance = null) => {
  const explicitHours = positiveNumberOrZero(form.requested_hours);
  if (explicitHours) return explicitHours;

  if (form.duration_mode === "shift_linked" && selectedShift) {
    return hoursBetween(selectedShift.clock_in, selectedShift.clock_out);
  }

  if (form.duration_mode === "partial_day" && form.start_date && form.start_time && form.end_time) {
    return hoursBetween(
      `${form.start_date}T${form.start_time}`,
      `${form.start_date}T${form.end_time}`
    );
  }

  if (form.duration_mode === "full_day" && form.start_date && form.end_date) {
    try {
      const days = Math.max(1, differenceInCalendarDays(parseISO(form.end_date), parseISO(form.start_date)) + 1);
      const workdayHours = positiveNumberOrZero(selectedBalance?.policy_summary?.workday_hours) || 8;
      return Math.round(days * workdayHours * 100) / 100;
    } catch {
      return 0;
    }
  }

  return 0;
};

export const canWithdrawEmployeeLeave = (request = {}) => (
  String(request.status || "").toLowerCase() === "pending" && !request.withdrawn_at && !request.cancelled_at
);

export const buildEmployeeLeaveRequestSubmission = (form = {}, selectedShift = null) => {
  const validationError = validateEmployeeLeaveForm(form, selectedShift);
  if (validationError) {
    return { error: validationError };
  }

  const basePayload = {
    leave_type: form.leave_type,
    leave_subtype: form.leave_subtype || null,
    reason: form.reason || "",
    duration_mode: form.duration_mode || "full_day",
    requested_hours: optionalNumber(form.requested_hours),
    start_time: form.start_time || null,
    end_time: form.end_time || null,
    is_paid_leave: Boolean(form.is_paid_leave),
  };

  if (form.duration_mode === "shift_linked") {
    return {
      endpoint: "/employee/leave-request",
      payload: {
        ...basePayload,
        shift_id: selectedShift.id,
        start: selectedShift.clock_in,
        end: selectedShift.clock_out,
      },
    };
  }

  return {
    endpoint: "/leave/request",
    payload: {
      ...basePayload,
      start_date: form.start_date,
      end_date: form.end_date,
    },
  };
};
