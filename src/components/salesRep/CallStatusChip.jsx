import React from "react";
import { Chip } from "@mui/material";

const STATUS_PROPS = {
  not_initialized: { color: "default", label: "Not initialized" },
  initializing: { color: "info", label: "Initializing" },
  ready: { color: "success", label: "Ready" },
  microphone_denied: { color: "warning", label: "Mic denied" },
  device_error: { color: "error", label: "Device error" },
  connecting: { color: "info", label: "Connecting" },
  ringing: { color: "warning", label: "Ringing" },
  in_call: { color: "success", label: "In call" },
  completed: { color: "success", label: "Completed" },
  busy: { color: "warning", label: "Busy" },
  no_answer: { color: "warning", label: "No answer" },
  failed: { color: "error", label: "Failed" },
  disconnected: { color: "default", label: "Disconnected" },
};

export default function CallStatusChip({ status }) {
  const props = STATUS_PROPS[status] || STATUS_PROPS.not_initialized;
  return <Chip size="small" variant="outlined" color={props.color} label={props.label} />;
}
