import React from "react";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import SoftphoneStatusBar from "./SoftphoneStatusBar";

export default function TwilioDevicePanel({
  visible,
  status,
  helperText,
  loading,
  calling,
  canInitialize,
  onInitialize,
  canCall,
  onCall,
  onHangup,
  leadName,
}) {
  if (!visible) return null;

  const showEnable = status === "not_initialized" || status === "device_error" || status === "microphone_denied";
  const showHangup = calling || status === "connecting" || status === "ringing" || status === "in_call";

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6">Browser Softphone</Typography>
              <Chip size="small" color="primary" label="Twilio-protected" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Use your browser audio device to call the current locked lead without exposing the raw phone number.
            </Typography>
          </Stack>
          {leadName ? <Typography variant="body2" color="text.secondary">Current lead: {leadName}</Typography> : null}
        </Stack>

        <SoftphoneStatusBar status={status} helperText={helperText} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {showEnable ? (
            <Button variant="contained" onClick={onInitialize} disabled={!canInitialize || loading || calling}>
              {loading ? "Enabling…" : "Enable calling"}
            </Button>
          ) : null}
          <Button variant="contained" color="success" onClick={onCall} disabled={!canCall || loading || calling}>
            {calling ? "Calling…" : "Call via Twilio"}
          </Button>
          <Button variant="outlined" color="inherit" onClick={onHangup} disabled={!showHangup}>
            Hang up
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
