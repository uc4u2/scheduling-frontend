import { parseApiErrorPayload } from "../../../utils/apiError";

export const formatLeaveApiError = async (err, fallback = "Leave action failed.") => {
  const payload = await parseApiErrorPayload(err?.response?.data);
  const code = payload?.error_code || payload?.error;

  if (code === "leave_attachment_locked_by_finalized_payroll") {
    const period = payload?.finalized_payroll?.start_date && payload?.finalized_payroll?.end_date
      ? ` Payroll period: ${payload.finalized_payroll.start_date} to ${payload.finalized_payroll.end_date}.`
      : "";
    return `This leave is locked because payroll has already been finalized.${period} Ask your manager or payroll admin if the document still needs to be added to records.`;
  }

  if (code === "leave_attachment_delete_locked") {
    return "This document cannot be removed after the leave is approved. You can replace the document if proof needs to be corrected.";
  }

  if (code === "leave_attachment_locked") {
    return "This leave no longer accepts document changes. Only pending or approved leave can receive supporting documents.";
  }

  if (code === "file_type_not_allowed") {
    return "This file type is not supported. Upload a PDF, Word document, PNG, or JPG file.";
  }

  if (code === "file_too_large") {
    return "This file is too large. Upload a smaller supporting document.";
  }

  if (code === "file_missing") {
    return "Choose a supporting document before uploading.";
  }

  return payload?.message || payload?.error_description || payload?.error || err?.message || fallback;
};
