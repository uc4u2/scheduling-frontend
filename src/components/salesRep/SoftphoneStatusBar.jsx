import React from "react";
import { Alert, Stack, Typography } from "@mui/material";
import CallStatusChip from "./CallStatusChip";

const STATUS_COPY = {
  not_initialized: {
    severity: "info",
    title: "Browser calling is not enabled yet.",
    body: "Click Enable calling when you are ready to connect your headset or earbuds.",
  },
  initializing: {
    severity: "info",
    title: "Initializing Twilio device.",
    body: "Allow microphone access in the browser if prompted.",
  },
  ready: {
    severity: "success",
    title: "Browser calling is ready.",
    body: "You can now place a call for the current locked lead.",
  },
  microphone_denied: {
    severity: "warning",
    title: "Microphone permission is blocked.",
    body: "Allow microphone access in your browser settings before trying again.",
  },
  device_error: {
    severity: "error",
    title: "Twilio device failed to initialize.",
    body: "Refresh the page or re-enable calling after checking microphone and Twilio setup.",
  },
  connecting: {
    severity: "info",
    title: "Starting call.",
    body: "Keep this tab open while Twilio connects the call.",
  },
  ringing: {
    severity: "warning",
    title: "Lead is ringing.",
    body: "Wait for the lead to answer. You are connected through the browser softphone.",
  },
  in_call: {
    severity: "success",
    title: "Call connected.",
    body: "Use your headset or earbuds and record the result when the call ends.",
  },
  completed: {
    severity: "success",
    title: "Call completed.",
    body: "Refresh your notes or submit the outcome for this lead.",
  },
  busy: {
    severity: "warning",
    title: "Lead line is busy.",
    body: "Set the correct outcome and callback plan before moving on.",
  },
  no_answer: {
    severity: "warning",
    title: "Lead did not answer.",
    body: "Use a callback outcome if you need to retry later.",
  },
  failed: {
    severity: "error",
    title: "Call failed.",
    body: "Check your device readiness and Twilio status, then try again.",
  },
  disconnected: {
    severity: "info",
    title: "Call disconnected.",
    body: "You can place another call for the current lead if the lock is still valid.",
  },
};

export default function SoftphoneStatusBar({ status, helperText }) {
  const copy = STATUS_COPY[status] || STATUS_COPY.not_initialized;
  return (
    <Alert severity={copy.severity} variant="outlined">
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CallStatusChip status={status} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{copy.title}</Typography>
        </Stack>
        <Typography variant="body2">{helperText || copy.body}</Typography>
      </Stack>
    </Alert>
  );
}
