import React from "react";
import { Chip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const STATUS_MAP = {
  new: { label: "New", color: "warning" },
  reviewed: { label: "Reviewed", color: "info" },
  estimate_created: { label: "Estimate Created", color: "success", emphasis: "strong" },
  closed: { label: "Closed", color: "default" },
  rejected: { label: "Rejected", color: "error" },
  draft: { label: "Draft", color: "default" },
  sent: { label: "Sent", color: "info", emphasis: "strong" },
  viewed: { label: "Viewed", color: "secondary" },
  approved: { label: "Approved", color: "success" },
  submitted: { label: "Submitted", color: "info" },
  clarification_requested: { label: "Clarification Requested", color: "warning" },
  scheduled: { label: "Scheduled", color: "info" },
  in_progress: { label: "In Progress", color: "warning" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
  converted_to_invoice: { label: "Converted to Invoice", color: "success", emphasis: "strong" },
  converted_to_work_order: { label: "Converted to Work", color: "success" },
};

const titleize = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function FinanceStatusChip({ status, size = "small", variant = "soft" }) {
  const theme = useTheme();
  const key = String(status || "").toLowerCase();
  const meta = STATUS_MAP[key] || { label: titleize(key) || "Unknown", color: "default" };
  const paletteKey = meta.color || "default";
  const palette =
    paletteKey === "default"
      ? {
          main: theme.palette.text.secondary,
          contrastText: theme.palette.text.primary,
        }
      : theme.palette[paletteKey] || theme.palette.primary;

  const isOutlined = variant === "outlined";
  const isStrong = meta.emphasis === "strong";

  return (
    <Chip
      size={size}
      label={meta.label}
      color={isOutlined ? meta.color : undefined}
      variant={isOutlined ? "outlined" : "filled"}
      sx={
        isOutlined
          ? {
              height: 24,
              borderRadius: 1.5,
              "& .MuiChip-label": {
                px: 1,
                fontWeight: 600,
              },
            }
          : {
              height: 24,
              fontWeight: 700,
              borderRadius: 1.5,
              backgroundColor: isStrong ? alpha(palette.main, 0.2) : alpha(palette.main, 0.14),
              color: palette.main,
              border: `1px solid ${alpha(palette.main, isStrong ? 0.28 : 0.18)}`,
              "& .MuiChip-label": {
                px: 1,
              },
            }
      }
    />
  );
}
