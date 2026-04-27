import React from "react";
import { Chip } from "@mui/material";

const STATUS_MAP = {
  new: { label: "New", color: "warning" },
  reviewed: { label: "Reviewed", color: "info" },
  estimate_created: { label: "Estimate Created", color: "success" },
  closed: { label: "Closed", color: "default" },
  rejected: { label: "Rejected", color: "error" },
  draft: { label: "Draft", color: "default" },
  sent: { label: "Sent", color: "info" },
  viewed: { label: "Viewed", color: "secondary" },
  approved: { label: "Approved", color: "success" },
  scheduled: { label: "Scheduled", color: "info" },
  in_progress: { label: "In Progress", color: "warning" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
  converted_to_invoice: { label: "Converted to Invoice", color: "success" },
  converted_to_work_order: { label: "Converted to Work", color: "success" },
};

const titleize = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function FinanceStatusChip({ status, size = "small", variant = "soft" }) {
  const key = String(status || "").toLowerCase();
  const meta = STATUS_MAP[key] || { label: titleize(key) || "Unknown", color: "default" };
  return <Chip size={size} label={meta.label} color={meta.color} variant={variant === "outlined" ? "outlined" : "filled"} />;
}
