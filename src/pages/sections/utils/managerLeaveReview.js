const optionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

export const defaultManagerLeaveReviewDraft = (leave = {}) => ({
  approved_hours: firstDefined(leave.approved_hours, leave.requested_hours, leave.override_hours, ""),
  is_paid_leave: Boolean(firstDefined(leave.is_paid_leave, leave.paid_flag, true)),
  leave_type: leave.leave_type || "sick",
  leave_subtype: leave.leave_subtype || "",
  manager_adjust_reason: leave.manager_adjust_reason || "",
  comment: leave.review_comment || "",
});

export const buildManagerLeaveReviewPayload = (leave = {}, draft = {}, action = "approve") => {
  const payload = {
    request_id: leave.id || leave.leave_id,
    action,
    comment: draft.comment || "",
  };

  if (action !== "approve") {
    return payload;
  }

  const approvedHours = optionalNumber(draft.approved_hours);
  if (approvedHours !== undefined) payload.approved_hours = approvedHours;
  payload.is_paid_leave = Boolean(draft.is_paid_leave);
  payload.leave_type = draft.leave_type || leave.leave_type || "sick";
  payload.leave_subtype = draft.leave_subtype || null;
  if (draft.manager_adjust_reason) {
    payload.manager_adjust_reason = draft.manager_adjust_reason;
  }
  return payload;
};

export const canManagerCancelLeave = (leave = {}) => {
  const status = String(leave.status || "").toLowerCase();
  return status === "pending" || status === "approved";
};

export const buildManagerLeaveCancelPayload = (leave = {}, reason = "") => {
  const cleanedReason = String(reason || "").trim();
  if (!cleanedReason) {
    return { error: "Cancellation reason is required." };
  }
  return {
    request_id: leave.id || leave.leave_id,
    action: "cancel",
    cancel_reason: cleanedReason,
  };
};

export const normalizeLeavePagination = (value = {}) => ({
  page: Number(value.page || 1),
  page_size: Number(value.page_size || 25),
  total: Number(value.total || 0),
  total_pages: Number(value.total_pages || 1),
});

export const defaultManagerLeaveFilters = () => ({
  status: "pending",
  department_id: "",
  recruiter_id: "",
  start_date: "",
  end_date: "",
  leave_type: "",
  is_paid_leave: "",
  payroll_ready: "",
  has_warnings: "",
  warning_code: "",
  duration_mode: "",
});

export const buildManagerLeaveRequestQuery = (filters = {}, page = 1, pageSize = 25) => {
  const params = new URLSearchParams({
    status: filters.status || "pending",
    page: String(page || 1),
    page_size: String(pageSize || 25),
  });
  [
    "department_id",
    "recruiter_id",
    "start_date",
    "end_date",
    "leave_type",
    "is_paid_leave",
    "payroll_ready",
    "has_warnings",
    "warning_code",
    "duration_mode",
  ].forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
      params.set(key, String(filters[key]));
    }
  });
  return params;
};
