import React from "react";
import {
  Alert,
  Button,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
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
  diagnostics,
  onSelectInputDevice,
  onSelectOutputDevice,
}) {
  if (!visible) return null;

  const showEnable = status === "not_initialized" || status === "device_error" || status === "microphone_denied";
  const showHangup = calling || status === "connecting" || status === "ringing" || status === "in_call";
  const inputLevelValue = Math.round(Math.max(0, Math.min(1, diagnostics?.inputLevel || 0)) * 100);
  const canShowAudioControls = Boolean(diagnostics?.initialized);

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

        {diagnostics?.deviceChangeDetected ? (
          <Alert severity="warning" variant="outlined">
            Audio devices changed after browser calling was enabled. Re-enable calling so Twilio reconnects to the new headset,
            earbuds, or microphone.
          </Alert>
        ) : null}

        <Stack spacing={1}>
          <Typography variant="subtitle2">Audio diagnostics</Typography>
          <Typography variant="body2" color="text.secondary">
            Confirm the browser is using the correct microphone before calling. Device names appear after microphone access is allowed.
          </Typography>

          <Stack spacing={0.75}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Microphone input level
            </Typography>
            <LinearProgress
              variant="determinate"
              value={inputLevelValue}
              color={inputLevelValue > 15 ? "success" : "inherit"}
              sx={{ height: 10, borderRadius: 999 }}
            />
            <Typography variant="caption" color="text.secondary">
              {canShowAudioControls
                ? inputLevelValue > 5
                  ? "Microphone activity detected."
                  : "Speak into the microphone to verify the browser is hearing you."
                : "Enable calling first to start the microphone test and show the live level meter."}
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth size="small" disabled={!canShowAudioControls || !diagnostics?.inputDevices?.length}>
              <InputLabel id="softphone-input-device-label">Input device</InputLabel>
              <Select
                labelId="softphone-input-device-label"
                value={diagnostics?.selectedInputId || ""}
                label="Input device"
                onChange={(event) => onSelectInputDevice?.(event.target.value)}
              >
                {(diagnostics?.inputDevices || []).map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              fullWidth
              size="small"
              disabled={!canShowAudioControls || !diagnostics?.supportsOutputSelection || !diagnostics?.outputDevices?.length}
            >
              <InputLabel id="softphone-output-device-label">Output device</InputLabel>
              <Select
                labelId="softphone-output-device-label"
                value={diagnostics?.selectedOutputId || ""}
                label="Output device"
                onChange={(event) => onSelectOutputDevice?.(event.target.value)}
              >
                {(diagnostics?.outputDevices || []).map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Selected input: {diagnostics?.selectedInputLabel || "Not selected yet"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Selected output:{" "}
              {diagnostics?.supportsOutputSelection
                ? diagnostics?.selectedOutputLabel || "Not selected yet"
                : "Browser output selection is not supported in this browser"}
            </Typography>
          </Stack>
        </Stack>

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
