import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CallStatusChip from "../../components/salesRep/CallStatusChip";
import SoftphoneStatusBar from "../../components/salesRep/SoftphoneStatusBar";
import {
  getInboundWorkspace,
  getTwilioDeviceStatus,
  getTwilioToken,
  updatePhoneAvailability,
} from "../../api/salesRepCRM";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";

const DEVICE_STATUS = {
  NOT_INITIALIZED: "not_initialized",
  INITIALIZING: "initializing",
  READY: "ready",
  MICROPHONE_DENIED: "microphone_denied",
  DEVICE_ERROR: "device_error",
  RINGING: "ringing",
  IN_CALL: "in_call",
  COMPLETED: "completed",
  FAILED: "failed",
  DISCONNECTED: "disconnected",
};

const emptyAudioDiagnostics = {
  initialized: false,
  inputDevices: [],
  outputDevices: [],
  selectedInputId: "",
  selectedInputLabel: "",
  selectedOutputId: "",
  selectedOutputLabel: "",
  supportsOutputSelection: false,
  inputLevel: 0,
  deviceChangeDetected: false,
};

function labelAudioDevice(device, fallback) {
  if (!device) return fallback;
  if (device.label) return device.label;
  if (device.deviceId === "default") return `${fallback} (Default)`;
  return fallback;
}

function listMediaDevices(devicesMap, fallback) {
  return Array.from(devicesMap?.values?.() || []).map((device, index) => ({
    id: device.deviceId,
    label: labelAudioDevice(device, `${fallback} ${index + 1}`),
  }));
}

function getActiveOutputDevice(device) {
  const active = Array.from(device?.audio?.speakerDevices?.get?.() || []);
  return active[0] || null;
}

function getCallerLabel(call, session) {
  return call?.parameters?.From || session?.from_phone || session?.from_phone_normalized || "Unknown caller";
}

function getDeviceBlockingCopy(reason) {
  const messages = {
    twilio_browser_mode_required: "Browser softphone mode is not active for sales reps right now.",
    twilio_browser_not_configured: "Browser softphone setup is incomplete. Contact a platform admin.",
    protected_twilio_mode_required: "Protected Twilio mode must be enabled before inbound browser answering is available.",
  };
  return messages[reason] || "Enable the browser phone when the Twilio browser setup is ready.";
}

export default function SalesInboundWorkspacePage() {
  const timezone = useMemo(() => getUserTimezone(), []);
  const [workspace, setWorkspace] = useState({ availability: null, departments: [], current_inbound_session: null });
  const [deviceStatusSummary, setDeviceStatusSummary] = useState(null);
  const [softphoneState, setSoftphoneState] = useState({ status: DEVICE_STATUS.NOT_INITIALIZED, helperText: "" });
  const [initializingDevice, setInitializingDevice] = useState(false);
  const [audioDiagnostics, setAudioDiagnostics] = useState(emptyAudioDiagnostics);
  const [availabilityForm, setAvailabilityForm] = useState({ status: "offline", department_key: "", manual_pause_reason: "" });
  const [submittingAvailability, setSubmittingAvailability] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [muted, setMuted] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState(null);
  const [banner, setBanner] = useState({ type: "success", message: "" });
  const [callSeconds, setCallSeconds] = useState(0);

  const deviceRef = useRef(null);
  const currentCallRef = useRef(null);
  const inputVolumeHandlerRef = useRef(null);
  const mediaDeviceChangeHandlerRef = useRef(null);
  const workspaceRef = useRef(workspace);

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  const syncAudioDiagnostics = useCallback((device, options = {}) => {
    const inputDevices = listMediaDevices(device?.audio?.availableInputDevices, "Microphone");
    const outputDevices = listMediaDevices(device?.audio?.availableOutputDevices, "Speaker");
    const selectedInput = device?.audio?.inputDevice || null;
    const selectedOutput = getActiveOutputDevice(device);
    setAudioDiagnostics((prev) => ({
      initialized: Boolean(device),
      inputDevices,
      outputDevices,
      selectedInputId: selectedInput?.deviceId || "",
      selectedInputLabel: labelAudioDevice(selectedInput, "Default microphone"),
      selectedOutputId: selectedOutput?.deviceId || "",
      selectedOutputLabel: labelAudioDevice(selectedOutput, "Default speaker"),
      supportsOutputSelection: Boolean(device?.audio?.isOutputSelectionSupported),
      inputLevel: options.preserveInputLevel ? prev.inputLevel : 0,
      deviceChangeDetected: options.deviceChangeDetected ? true : prev.deviceChangeDetected,
    }));
  }, []);

  const syncDeviceRegistration = useCallback(async (deviceRegistered) => {
    const currentAvailability = workspaceRef.current?.availability || {};
    try {
      const nextAvailability = await updatePhoneAvailability({
        status: currentAvailability.status || "offline",
        department_key: currentAvailability.department_key || availabilityForm.department_key || undefined,
        manual_pause_reason: currentAvailability.manual_pause_reason || undefined,
        device_registered: deviceRegistered,
      });
      setWorkspace((prev) => ({ ...prev, availability: nextAvailability }));
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to sync inbound device registration." });
    }
  }, [availabilityForm.department_key]);

  const destroyDevice = useCallback(() => {
    if (deviceRef.current && inputVolumeHandlerRef.current) {
      deviceRef.current.audio?.off?.("inputVolume", inputVolumeHandlerRef.current);
    }
    if (mediaDeviceChangeHandlerRef.current && navigator?.mediaDevices?.removeEventListener) {
      navigator.mediaDevices.removeEventListener("devicechange", mediaDeviceChangeHandlerRef.current);
    }
    inputVolumeHandlerRef.current = null;
    mediaDeviceChangeHandlerRef.current = null;
    try {
      currentCallRef.current?.disconnect?.();
    } catch (error) {
      // noop
    }
    currentCallRef.current = null;
    try {
      deviceRef.current?.destroy?.();
    } catch (error) {
      // noop
    }
    deviceRef.current = null;
    setIncomingCall(null);
    setActiveCall(null);
    setCallStartedAt(null);
    setMuted(false);
    setAudioDiagnostics(emptyAudioDiagnostics);
  }, []);

  const loadWorkspace = useCallback(async () => {
    try {
      const [workspaceResp, deviceResp] = await Promise.all([
        getInboundWorkspace(),
        getTwilioDeviceStatus().catch(() => null),
      ]);
      setWorkspace(workspaceResp || { availability: null, departments: [], current_inbound_session: null });
      setDeviceStatusSummary(deviceResp);
      setAvailabilityForm((prev) => ({
        status: workspaceResp?.availability?.status || prev.status || "offline",
        department_key: workspaceResp?.availability?.department_key || workspaceResp?.departments?.[0]?.department_key || prev.department_key || "",
        manual_pause_reason: workspaceResp?.availability?.manual_pause_reason || prev.manual_pause_reason || "",
      }));
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to load inbound workspace." });
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadWorkspace();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadWorkspace]);

  const hasInboundMappings = Boolean(workspace?.departments?.length);
  const canInitialize = Boolean(deviceStatusSummary?.can_initialize_device) && !deviceRef.current;
  const currentSession = workspace?.current_inbound_session || null;
  const currentCaller = getCallerLabel(incomingCall, currentSession);
  const formatDateTime = useCallback((value) => (value ? formatDateTimeInTz(value, timezone) || "-" : "-"), [timezone]);

  useEffect(() => () => destroyDevice(), [destroyDevice]);

  useEffect(() => {
    if (deviceRef.current) return;
    if (!hasInboundMappings) {
      setSoftphoneState({
        status: DEVICE_STATUS.NOT_INITIALIZED,
        helperText: "No inbound department mapping is active for your account yet.",
      });
      return;
    }
    if (deviceStatusSummary?.can_initialize_device) {
      setSoftphoneState({
        status: DEVICE_STATUS.NOT_INITIALIZED,
        helperText: "Enable phone when you are ready to receive inbound calls in the browser.",
      });
      return;
    }
    setSoftphoneState({
      status: DEVICE_STATUS.NOT_INITIALIZED,
      helperText: getDeviceBlockingCopy(deviceStatusSummary?.blocking_reason),
    });
  }, [deviceStatusSummary, hasInboundMappings]);

  useEffect(() => {
    if (!callStartedAt) {
      setCallSeconds(0);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setCallSeconds(Math.max(0, Math.floor((Date.now() - callStartedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [callStartedAt]);

  const attachCallListeners = useCallback((call) => {
    if (!call) return;
    currentCallRef.current = call;
    call.on?.("accept", async () => {
      setIncomingCall(null);
      setActiveCall(call);
      setMuted(false);
      setCallStartedAt(Date.now());
      setSoftphoneState({ status: DEVICE_STATUS.IN_CALL, helperText: "Inbound call connected through the browser softphone." });
      await loadWorkspace();
    });
    call.on?.("disconnect", async () => {
      currentCallRef.current = null;
      setIncomingCall(null);
      setActiveCall(null);
      setMuted(false);
      setCallStartedAt(null);
      setSoftphoneState({ status: DEVICE_STATUS.DISCONNECTED, helperText: "Inbound call ended. Refreshing workspace state." });
      await loadWorkspace();
    });
    call.on?.("cancel", async () => {
      currentCallRef.current = null;
      setIncomingCall(null);
      setActiveCall(null);
      setMuted(false);
      setCallStartedAt(null);
      setSoftphoneState({ status: DEVICE_STATUS.COMPLETED, helperText: "Caller hung up before the connection completed." });
      await loadWorkspace();
    });
    call.on?.("reject", async () => {
      currentCallRef.current = null;
      setIncomingCall(null);
      setActiveCall(null);
      setMuted(false);
      setCallStartedAt(null);
      setSoftphoneState({ status: DEVICE_STATUS.COMPLETED, helperText: "Inbound call was rejected." });
      await loadWorkspace();
    });
    call.on?.("error", async (error) => {
      currentCallRef.current = null;
      setIncomingCall(null);
      setActiveCall(null);
      setMuted(false);
      setCallStartedAt(null);
      setSoftphoneState({ status: DEVICE_STATUS.FAILED, helperText: error?.message || "Inbound call failed." });
      await loadWorkspace();
    });
  }, [loadWorkspace]);

  const handleInitializeDevice = async () => {
    setInitializingDevice(true);
    setSoftphoneState({ status: DEVICE_STATUS.INITIALIZING, helperText: "Allow microphone access when your browser prompts you." });
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support microphone access for Twilio browser calling.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      const tokenPayload = await getTwilioToken();
      const sdk = await import("@twilio/voice-sdk");
      const Device = sdk?.Device;
      if (!Device) throw new Error("Twilio Voice SDK failed to load.");

      destroyDevice();
      const device = new Device(tokenPayload.token, {
        logLevel: 1,
        closeProtection: true,
      });
      deviceRef.current = device;
      syncAudioDiagnostics(device);

      inputVolumeHandlerRef.current = (inputLevel) => {
        setAudioDiagnostics((prev) => ({ ...prev, inputLevel }));
      };
      device.audio?.on?.("inputVolume", inputVolumeHandlerRef.current);

      mediaDeviceChangeHandlerRef.current = async () => {
        syncAudioDiagnostics(device, { preserveInputLevel: true, deviceChangeDetected: true });
        setSoftphoneState((prev) => ({
          ...prev,
          helperText: "Audio devices changed. Re-enable the phone workspace if you switched headset, earbuds, or microphone.",
        }));
      };
      if (navigator?.mediaDevices?.addEventListener) {
        navigator.mediaDevices.addEventListener("devicechange", mediaDeviceChangeHandlerRef.current);
      }

      device.on?.("registering", () => {
        setSoftphoneState({ status: DEVICE_STATUS.INITIALIZING, helperText: "Registering the browser phone workspace with Twilio." });
      });
      device.on?.("registered", async () => {
        syncAudioDiagnostics(device, { preserveInputLevel: true });
        setSoftphoneState({ status: DEVICE_STATUS.READY, helperText: "Browser phone workspace is ready to receive inbound calls." });
        await syncDeviceRegistration(true);
      });
      device.on?.("unregistered", async () => {
        if (!currentCallRef.current) {
          setSoftphoneState({ status: DEVICE_STATUS.DISCONNECTED, helperText: "The browser phone workspace was disconnected." });
        }
        await syncDeviceRegistration(false);
      });
      device.on?.("incoming", (call) => {
        setIncomingCall(call);
        setActiveCall(null);
        setSoftphoneState({ status: DEVICE_STATUS.RINGING, helperText: "An inbound caller is waiting. Answer or reject the call." });
        attachCallListeners(call);
      });
      device.on?.("error", (error) => {
        setSoftphoneState({ status: DEVICE_STATUS.DEVICE_ERROR, helperText: error?.message || "Twilio device error." });
      });

      await device.register();
    } catch (error) {
      const denied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
      setSoftphoneState({
        status: denied ? DEVICE_STATUS.MICROPHONE_DENIED : DEVICE_STATUS.DEVICE_ERROR,
        helperText: error?.message || (denied ? "Microphone permission was denied." : "Failed to initialize browser phone workspace."),
      });
      setBanner({ type: "error", message: error?.response?.data?.error || error?.message || "Failed to enable inbound phone workspace." });
    } finally {
      setInitializingDevice(false);
    }
  };

  const handleSelectInputDevice = async (deviceId) => {
    if (!deviceRef.current?.audio?.setInputDevice || !deviceId) return;
    try {
      await deviceRef.current.audio.setInputDevice(deviceId);
      syncAudioDiagnostics(deviceRef.current, { preserveInputLevel: true });
    } catch (error) {
      setBanner({ type: "error", message: error?.message || "Failed to switch the microphone device." });
    }
  };

  const handleSelectOutputDevice = async (deviceId) => {
    if (!deviceRef.current?.audio?.speakerDevices?.set || !deviceId) return;
    try {
      await Promise.all([
        deviceRef.current.audio.speakerDevices.set(deviceId),
        deviceRef.current.audio.ringtoneDevices?.set?.(deviceId),
      ]);
      syncAudioDiagnostics(deviceRef.current, { preserveInputLevel: true });
    } catch (error) {
      setBanner({ type: "error", message: error?.message || "Failed to switch the output device." });
    }
  };

  const handleAvailabilitySave = async () => {
    setSubmittingAvailability(true);
    try {
      const nextAvailability = await updatePhoneAvailability({
        status: availabilityForm.status,
        department_key: availabilityForm.department_key || undefined,
        manual_pause_reason: availabilityForm.status === "paused" ? availabilityForm.manual_pause_reason || undefined : undefined,
        device_registered: Boolean(workspace?.availability?.device_registered),
      });
      setWorkspace((prev) => ({ ...prev, availability: nextAvailability }));
      setBanner({ type: "success", message: "Inbound availability updated." });
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to update inbound availability." });
    } finally {
      setSubmittingAvailability(false);
    }
  };

  const handleAnswer = async () => {
    try {
      await incomingCall?.accept?.();
    } catch (error) {
      setBanner({ type: "error", message: error?.message || "Failed to answer inbound call." });
    }
  };

  const handleReject = async () => {
    try {
      incomingCall?.reject?.();
      currentCallRef.current = null;
      setIncomingCall(null);
      setActiveCall(null);
      setMuted(false);
      setCallStartedAt(null);
      setSoftphoneState({ status: DEVICE_STATUS.COMPLETED, helperText: "Inbound call was rejected." });
    } catch (error) {
      setBanner({ type: "error", message: error?.message || "Failed to reject inbound call." });
    }
  };

  const handleHangup = async () => {
    try {
      currentCallRef.current?.disconnect?.();
      deviceRef.current?.disconnectAll?.();
    } catch (error) {
      setBanner({ type: "error", message: error?.message || "Failed to hang up inbound call." });
    }
  };

  const handleToggleMute = async () => {
    try {
      const nextMuted = !muted;
      currentCallRef.current?.mute?.(nextMuted);
      setMuted(nextMuted);
    } catch (error) {
      setBanner({ type: "error", message: error?.message || "Failed to update mute state." });
    }
  };

  return (
    <Box>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Inbound Phone</Typography>
          <Typography variant="body2" color="text.secondary">
            Separate live-call workspace for inbound phone handling. Outbound lead queue behavior remains unchanged.
          </Typography>
        </Stack>

        {!hasInboundMappings ? (
          <Alert severity="info" variant="outlined">
            You do not have any active inbound department mappings yet. Admin setup is required before this workspace can receive inbound calls.
          </Alert>
        ) : null}

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between">
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">Inbound Browser Phone</Typography>
                  <Chip size="small" color="primary" label="Twilio browser" />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Register the browser device to receive inbound calls on your assigned departments.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CallStatusChip status={softphoneState.status} />
                <Button variant="outlined" onClick={loadWorkspace}>Refresh</Button>
              </Stack>
            </Stack>

            <SoftphoneStatusBar status={softphoneState.status} helperText={softphoneState.helperText} />

            {audioDiagnostics.deviceChangeDetected ? (
              <Alert severity="warning" variant="outlined">
                Audio devices changed after the browser phone was enabled. Re-enable the phone workspace so Twilio reconnects to the new headset or microphone.
              </Alert>
            ) : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl fullWidth size="small" disabled={!audioDiagnostics.initialized || !audioDiagnostics.inputDevices.length}>
                <InputLabel id="inbound-input-device-label">Input device</InputLabel>
                <Select
                  labelId="inbound-input-device-label"
                  value={audioDiagnostics.selectedInputId || ""}
                  label="Input device"
                  onChange={(event) => handleSelectInputDevice(event.target.value)}
                >
                  {audioDiagnostics.inputDevices.map((device) => (
                    <MenuItem key={device.id} value={device.id}>{device.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                fullWidth
                size="small"
                disabled={!audioDiagnostics.initialized || !audioDiagnostics.supportsOutputSelection || !audioDiagnostics.outputDevices.length}
              >
                <InputLabel id="inbound-output-device-label">Output device</InputLabel>
                <Select
                  labelId="inbound-output-device-label"
                  value={audioDiagnostics.selectedOutputId || ""}
                  label="Output device"
                  onChange={(event) => handleSelectOutputDevice(event.target.value)}
                >
                  {audioDiagnostics.outputDevices.map((device) => (
                    <MenuItem key={device.id} value={device.id}>{device.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Microphone input level
              </Typography>
              <Slider value={Math.round(Math.max(0, Math.min(1, audioDiagnostics.inputLevel || 0)) * 100)} disabled sx={{ mt: 1 }} />
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button variant="contained" disabled={!canInitialize || initializingDevice} onClick={handleInitializeDevice}>
                {initializingDevice ? "Enabling…" : "Enable phone"}
              </Button>
              <Button variant="outlined" disabled={!activeCall && !incomingCall} onClick={handleHangup}>
                Hang up
              </Button>
              <Button variant="outlined" disabled={!activeCall} onClick={handleToggleMute}>
                {muted ? "Unmute" : "Mute"}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Availability</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                select
                label="Status"
                size="small"
                value={availabilityForm.status}
                onChange={(event) => setAvailabilityForm((prev) => ({ ...prev, status: event.target.value }))}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
                <MenuItem value="wrap_up">Wrap up</MenuItem>
              </TextField>
              <TextField
                select
                label="Department"
                size="small"
                value={availabilityForm.department_key}
                onChange={(event) => setAvailabilityForm((prev) => ({ ...prev, department_key: event.target.value }))}
                sx={{ minWidth: 200 }}
              >
                {(workspace?.departments || []).map((row) => (
                  <MenuItem key={row.department_key} value={row.department_key}>
                    {row.department_key}{row.is_primary ? " (Primary)" : ""}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="Pause reason"
                value={availabilityForm.manual_pause_reason}
                disabled={availabilityForm.status !== "paused"}
                onChange={(event) => setAvailabilityForm((prev) => ({ ...prev, manual_pause_reason: event.target.value }))}
                sx={{ minWidth: 240 }}
              />
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Button variant="contained" onClick={handleAvailabilitySave} disabled={submittingAvailability || !hasInboundMappings}>
                  {submittingAvailability ? "Saving…" : "Save availability"}
                </Button>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              <Chip size="small" variant="outlined" label={`Current status: ${workspace?.availability?.status || "offline"}`} />
              <Chip size="small" variant="outlined" label={workspace?.availability?.device_registered ? "Device registered" : "Device not registered"} />
              {workspace?.availability?.last_seen_at ? (
                <Chip size="small" variant="outlined" label={`Last seen: ${formatDateTime(workspace.availability.last_seen_at)}`} />
              ) : null}
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Current Workspace Snapshot</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Department mappings</Typography>
                {workspace?.departments?.length ? (
                  <Stack spacing={0.75}>
                    {workspace.departments.map((row) => (
                      <Chip
                        key={row.department_key}
                        size="small"
                        variant="outlined"
                        label={`${row.department_key} · priority ${row.priority}${row.is_primary ? " · primary" : ""}`}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No active inbound department mappings.</Typography>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Active inbound session</Typography>
                {currentSession ? (
                  <Stack spacing={0.75}>
                    <Typography variant="body2">Caller: {currentSession.from_phone || currentSession.from_phone_normalized || "Unknown"}</Typography>
                    <Typography variant="body2">Department: {currentSession.department_key || "-"}</Typography>
                    <Typography variant="body2">Status: {currentSession.status || "-"}</Typography>
                    {currentSession.matched_preview ? (
                      <Typography variant="body2">
                        Matched: {currentSession.matched_preview.company_name || currentSession.matched_preview.contact_name || currentSession.matched_preview.name || currentSession.matched_preview.type}
                      </Typography>
                    ) : null}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No active inbound session is assigned to you right now.</Typography>
                )}
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {(incomingCall || activeCall || currentSession) ? (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Active Call Panel</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Caller context and live control surface for the current inbound call.
                  </Typography>
                </Box>
                <Chip size="small" color={activeCall ? "success" : incomingCall ? "warning" : "default"} label={activeCall ? "In call" : incomingCall ? "Incoming" : "Waiting"} />
              </Stack>
              <Stack spacing={0.75}>
                <Typography variant="body2">Caller: {currentCaller}</Typography>
                <Typography variant="body2">Department: {currentSession?.department_key || workspace?.availability?.department_key || "-"}</Typography>
                <Typography variant="body2">Call state: {activeCall ? "Connected" : incomingCall ? "Ringing" : currentSession?.status || "Idle"}</Typography>
                <Typography variant="body2">Timer: {callSeconds}s</Typography>
                {currentSession?.matched_preview ? (
                  <Typography variant="body2">
                    Matched context: {currentSession.matched_preview.company_name || currentSession.matched_preview.contact_name || currentSession.matched_preview.name || currentSession.matched_preview.type}
                  </Typography>
                ) : null}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button variant="contained" disabled={!incomingCall} onClick={handleAnswer}>Answer</Button>
                <Button variant="outlined" disabled={!incomingCall} onClick={handleReject}>Reject</Button>
                <Button variant="outlined" disabled={!activeCall && !incomingCall} onClick={handleHangup}>Hang up</Button>
                <Button variant="outlined" disabled={!activeCall} onClick={handleToggleMute}>{muted ? "Unmute" : "Mute"}</Button>
              </Stack>
            </Stack>
          </Paper>
        ) : null}

        <Dialog open={Boolean(incomingCall)} onClose={handleReject} fullWidth maxWidth="sm">
          <DialogTitle>Incoming Call</DialogTitle>
          <DialogContent>
            <Stack spacing={1} sx={{ pt: 0.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{currentCaller}</Typography>
              <Typography variant="body2" color="text.secondary">
                Department: {workspace?.availability?.department_key || currentSession?.department_key || "-"}
              </Typography>
              {currentSession?.matched_preview ? (
                <Typography variant="body2" color="text.secondary">
                  Matched: {currentSession.matched_preview.company_name || currentSession.matched_preview.contact_name || currentSession.matched_preview.name || currentSession.matched_preview.type}
                </Typography>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleReject}>Reject</Button>
            <Button variant="contained" onClick={handleAnswer}>Answer</Button>
          </DialogActions>
        </Dialog>
      </Stack>

      <Snackbar open={Boolean(banner.message)} autoHideDuration={4000} onClose={() => setBanner({ type: "success", message: "" })}>
        <Alert severity={banner.type} onClose={() => setBanner({ type: "success", message: "" })} sx={{ width: "100%" }}>
          {banner.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
