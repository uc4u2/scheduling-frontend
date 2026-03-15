import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Divider, Grid, Snackbar, Stack, Typography } from "@mui/material";
import LeadProgressCards from "../../components/salesRep/LeadProgressCards";
import LeadCurrentCard from "../../components/salesRep/LeadCurrentCard";
import LeadOutcomeForm from "../../components/salesRep/LeadOutcomeForm";
import LeadCallbacksPanel from "../../components/salesRep/LeadCallbacksPanel";
import LeadHistoryPanel from "../../components/salesRep/LeadHistoryPanel";
import TwilioDevicePanel from "../../components/salesRep/TwilioDevicePanel";
import {
  getCurrentLead,
  getLeadHistory,
  getLeadProgress,
  getNextLead,
  getTodayCallbacks,
  getTwilioDeviceStatus,
  getTwilioToken,
  skipLead,
  submitLeadOutcome,
  triggerTwilioCall,
} from "../../api/salesRepCRM";

const emptyForm = {
  outcome: "",
  note: "",
  callback_at: "",
  registration_link_sent: false,
  deal_id: "",
};

const DEVICE_STATUS = {
  NOT_INITIALIZED: "not_initialized",
  INITIALIZING: "initializing",
  READY: "ready",
  MICROPHONE_DENIED: "microphone_denied",
  DEVICE_ERROR: "device_error",
  CONNECTING: "connecting",
  RINGING: "ringing",
  IN_CALL: "in_call",
  COMPLETED: "completed",
  BUSY: "busy",
  NO_ANSWER: "no_answer",
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

function toUtcIso(value) {
  if (!value) return undefined;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString();
}

function getDisabledReasonCopy(reason) {
  const messages = {
    twilio_browser_not_configured: "Browser softphone setup is incomplete. Contact a platform admin.",
    twilio_not_configured: "Twilio is not configured yet. Contact a platform admin.",
    lead_phone_missing: "This lead does not have a callable phone number.",
    locked_lead_required: "Only your current locked lead can be called through Twilio.",
    protected_twilio_mode_required: "Protected Twilio mode must be enabled before browser calling is available.",
    sales_rep_phone_missing: "Bridge fallback still needs a rep phone number. Browser mode does not.",
    lead_attempt_limit_reached: "This lead reached the daily call-attempt limit. Try again tomorrow or ask an admin to review the lead.",
    lead_retry_cooldown_active: "This lead is in a retry cooldown window. Wait for the cooldown to expire before calling again.",
  };
  return messages[reason] || "Calling is not available for this lead right now.";
}

function getHistoryStatus(history) {
  const latestCallEvent = (history || []).find((item) => String(item.action_type || "").startsWith("twilio_call_"));
  switch (latestCallEvent?.action_type) {
    case "twilio_call_ringing":
      return DEVICE_STATUS.RINGING;
    case "twilio_call_answered":
      return DEVICE_STATUS.IN_CALL;
    case "twilio_call_completed":
      return DEVICE_STATUS.COMPLETED;
    case "twilio_call_busy":
      return DEVICE_STATUS.BUSY;
    case "twilio_call_no_answer":
      return DEVICE_STATUS.NO_ANSWER;
    case "twilio_call_failed":
    case "twilio_call_canceled":
      return DEVICE_STATUS.FAILED;
    default:
      return null;
  }
}

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

export default function SalesLeadQueuePage() {
  const [progress, setProgress] = useState({});
  const [lead, setLead] = useState(null);
  const [callbacks, setCallbacks] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loadingLead, setLoadingLead] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calling, setCalling] = useState(false);
  const [banner, setBanner] = useState({ type: "success", message: "" });
  const [deviceStatusSummary, setDeviceStatusSummary] = useState(null);
  const [initializingDevice, setInitializingDevice] = useState(false);
  const [softphoneState, setSoftphoneState] = useState({ status: DEVICE_STATUS.NOT_INITIALIZED, helperText: "" });
  const [audioDiagnostics, setAudioDiagnostics] = useState(emptyAudioDiagnostics);

  const deviceRef = useRef(null);
  const activeCallRef = useRef(null);
  const inputVolumeHandlerRef = useRef(null);
  const mediaDeviceChangeHandlerRef = useRef(null);

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
      activeCallRef.current?.disconnect?.();
    } catch (error) {
      // noop
    }
    activeCallRef.current = null;
    try {
      deviceRef.current?.destroy?.();
    } catch (error) {
      // noop
    }
    deviceRef.current = null;
    setAudioDiagnostics(emptyAudioDiagnostics);
  }, []);

  const loadPage = useCallback(async () => {
    try {
      const [progressResp, currentLead, callbacksResp, historyResp, deviceResp] = await Promise.all([
        getLeadProgress(),
        getCurrentLead(),
        getTodayCallbacks(),
        getLeadHistory({ limit: 20 }),
        getTwilioDeviceStatus().catch(() => null),
      ]);
      setProgress(progressResp || {});
      setLead(currentLead || null);
      setCallbacks(callbacksResp || []);
      setHistory(historyResp || []);
      setDeviceStatusSummary(deviceResp);
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to load lead queue." });
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => () => destroyDevice(), [destroyDevice]);

  const softphoneVisible = useMemo(
    () => deviceStatusSummary?.call_mode === "protected_twilio" && deviceStatusSummary?.call_flow === "twilio_browser",
    [deviceStatusSummary]
  );

  const callDisabledCopy = useMemo(() => getDisabledReasonCopy(lead?.call_disabled_reason), [lead?.call_disabled_reason]);

  useEffect(() => {
    if (!softphoneVisible) {
      setSoftphoneState({ status: DEVICE_STATUS.NOT_INITIALIZED, helperText: "" });
      destroyDevice();
      return;
    }
    if (lead?.lead_access_mode !== "protected_twilio") {
      setSoftphoneState({ status: DEVICE_STATUS.NOT_INITIALIZED, helperText: "Protected mode is active, but there is no current locked lead yet." });
      return;
    }
    if (deviceRef.current) return;
    if (!deviceStatusSummary?.can_initialize_device) {
      setSoftphoneState({
        status: DEVICE_STATUS.NOT_INITIALIZED,
        helperText: getDisabledReasonCopy(deviceStatusSummary?.blocking_reason) || "Browser calling is not ready yet.",
      });
      return;
    }
      setSoftphoneState({ status: DEVICE_STATUS.NOT_INITIALIZED, helperText: "Enable calling when you are ready to connect your browser headset." });
  }, [destroyDevice, deviceStatusSummary, lead?.lead_access_mode, softphoneVisible]);

  useEffect(() => {
    if (!softphoneVisible || activeCallRef.current || !deviceRef.current) return;
    const historyState = getHistoryStatus(history);
    if (!historyState) return;
    setSoftphoneState((prev) => {
      if ([DEVICE_STATUS.CONNECTING, DEVICE_STATUS.RINGING, DEVICE_STATUS.IN_CALL].includes(prev.status)) {
        return prev;
      }
      return { status: historyState, helperText: prev.helperText };
    });
  }, [history, softphoneVisible]);

  const refreshAfterCall = useCallback(async () => {
    await loadPage();
  }, [loadPage]);

  const attachCallListeners = useCallback((call) => {
    if (!call) return;
    call.on?.("ringing", () => {
      setSoftphoneState({ status: DEVICE_STATUS.RINGING, helperText: "The lead is ringing through Twilio." });
    });
    call.on?.("accept", () => {
      setSoftphoneState({ status: DEVICE_STATUS.IN_CALL, helperText: "Call connected. Use your headset and record the outcome when finished." });
    });
    call.on?.("disconnect", async () => {
      activeCallRef.current = null;
      setCalling(false);
      setSoftphoneState({ status: DEVICE_STATUS.DISCONNECTED, helperText: "Call disconnected. Refreshing lead activity now." });
      await refreshAfterCall();
    });
    call.on?.("cancel", async () => {
      activeCallRef.current = null;
      setCalling(false);
      setSoftphoneState({ status: DEVICE_STATUS.NO_ANSWER, helperText: "The call was canceled before the lead connected." });
      await refreshAfterCall();
    });
    call.on?.("reject", async () => {
      activeCallRef.current = null;
      setCalling(false);
      setSoftphoneState({ status: DEVICE_STATUS.BUSY, helperText: "The lead rejected the call or the line was unavailable." });
      await refreshAfterCall();
    });
    call.on?.("error", async (error) => {
      activeCallRef.current = null;
      setCalling(false);
      setSoftphoneState({ status: DEVICE_STATUS.FAILED, helperText: error?.message || "The browser call failed." });
      await refreshAfterCall();
    });
    call.on?.("warning", (warning) => {
      setSoftphoneState((prev) => ({ ...prev, helperText: warning?.message || prev.helperText }));
    });
  }, [refreshAfterCall]);

  const handleInitializeDevice = async () => {
    if (!softphoneVisible) return;
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
          helperText: "Audio devices changed. Re-enable calling if you switched headset, earbuds, or microphone.",
        }));
      };
      if (navigator?.mediaDevices?.addEventListener) {
        navigator.mediaDevices.addEventListener("devicechange", mediaDeviceChangeHandlerRef.current);
      }

      device.on?.("registering", () => {
        setSoftphoneState({ status: DEVICE_STATUS.INITIALIZING, helperText: "Registering the browser softphone with Twilio." });
      });
      device.on?.("registered", () => {
        syncAudioDiagnostics(device, { preserveInputLevel: true });
        setSoftphoneState({ status: DEVICE_STATUS.READY, helperText: "Browser calling is ready for the current locked lead." });
      });
      device.on?.("unregistered", () => {
        if (!activeCallRef.current) {
          setSoftphoneState({ status: DEVICE_STATUS.DISCONNECTED, helperText: "The browser device was disconnected. Re-enable calling if needed." });
        }
      });
      device.on?.("error", (error) => {
        setSoftphoneState({ status: DEVICE_STATUS.DEVICE_ERROR, helperText: error?.message || "Twilio device error." });
      });

      await device.register();
    } catch (error) {
      const denied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
      setSoftphoneState({
        status: denied ? DEVICE_STATUS.MICROPHONE_DENIED : DEVICE_STATUS.DEVICE_ERROR,
        helperText: error?.message || (denied ? "Microphone permission was denied." : "Failed to initialize browser calling."),
      });
      setBanner({ type: "error", message: error?.response?.data?.error || error?.message || "Failed to enable browser calling." });
    } finally {
      setInitializingDevice(false);
    }
  };

  const handleSelectInputDevice = async (deviceId) => {
    if (!deviceRef.current?.audio?.setInputDevice || !deviceId) return;
    try {
      await deviceRef.current.audio.setInputDevice(deviceId);
      syncAudioDiagnostics(deviceRef.current, { preserveInputLevel: true });
      setSoftphoneState((prev) => ({
        ...prev,
        helperText: "Microphone updated. Re-enable calling if you changed hardware after the device was already active.",
      }));
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
      setSoftphoneState((prev) => ({
        ...prev,
        helperText: "Speaker updated. Re-enable calling if you changed headsets after browser calling was already active.",
      }));
    } catch (error) {
      setBanner({ type: "error", message: error?.message || "Failed to switch the output device." });
    }
  };

  const handleNextLead = async () => {
    setLoadingLead(true);
    try {
      const nextLead = await getNextLead();
      setLead(nextLead || null);
      if (!nextLead) {
        setBanner({ type: "info", message: "No lead is available right now." });
      }
      await loadPage();
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to fetch the next lead." });
    } finally {
      setLoadingLead(false);
    }
  };

  const handleSubmit = async () => {
    if (!lead || !form.outcome) return;
    if (form.outcome === "call_back_later" && !form.callback_at) {
      setBanner({ type: "warning", message: "Set a callback time before submitting call_back_later." });
      return;
    }
    if (form.outcome === "interested" && !form.callback_at && !form.deal_id) {
      setBanner({ type: "warning", message: "Interested leads need a callback time or an existing deal ID so ownership stays protected." });
      return;
    }
    if (form.outcome === "booked_demo" && !form.deal_id) {
      setBanner({ type: "warning", message: "Booked demo requires an existing deal ID so commission attribution stays linked to you." });
      return;
    }
    setSubmitting(true);
    try {
      await submitLeadOutcome(lead.id, {
        outcome: form.outcome,
        note: form.note || undefined,
        callback_at: form.callback_at ? toUtcIso(form.callback_at) : undefined,
        registration_link_sent: form.registration_link_sent,
        deal_id: form.deal_id ? Number(form.deal_id) : undefined,
      });
      setForm(emptyForm);
      setBanner({ type: "success", message: "Outcome submitted." });
      await loadPage();
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to submit outcome." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!lead) return;
    setSubmitting(true);
    try {
      await skipLead(lead.id, {});
      setBanner({ type: "success", message: "Lead skipped." });
      await loadPage();
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to skip lead." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBrowserCall = async () => {
    if (!lead?.id || !deviceRef.current) return;
    setCalling(true);
    setSoftphoneState({ status: DEVICE_STATUS.CONNECTING, helperText: "Starting the browser call for your current locked lead." });
    try {
      const call = await deviceRef.current.connect({ params: { lead_id: String(lead.id) } });
      activeCallRef.current = call;
      attachCallListeners(call);
    } catch (error) {
      setCalling(false);
      setSoftphoneState({ status: DEVICE_STATUS.FAILED, helperText: error?.message || "Failed to connect the Twilio browser call." });
      setBanner({ type: "error", message: error?.message || "Failed to start browser call." });
    }
  };

  const handleTwilioCall = async () => {
    if (!lead?.id) return;
    setCalling(true);
    try {
      const result = await triggerTwilioCall(lead.id);
      setBanner({
        type: "success",
        message: result?.call_status === "initiated" ? "Twilio bridge call started. Answer your phone to connect." : "Call request sent.",
      });
      await loadPage();
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to start Twilio call." });
    } finally {
      setCalling(false);
    }
  };

  const handleHangup = async () => {
    try {
      activeCallRef.current?.disconnect?.();
      deviceRef.current?.disconnectAll?.();
    } catch (error) {
      setBanner({ type: "error", message: "Failed to hang up the current call." });
    }
  };

  const statusSummary = useMemo(() => {
    const byStatus = progress?.by_status || {};
    const entries = Object.entries(byStatus);
    if (!entries.length) return "No assigned statuses yet.";
    return entries.map(([key, value]) => `${key}: ${value}`).join(" • ");
  }, [progress]);

  const activeCallFlow = deviceStatusSummary?.call_flow || (softphoneVisible ? "twilio_browser" : "manual");
  const canInitializeDevice = softphoneVisible && Boolean(deviceStatusSummary?.can_initialize_device) && !deviceRef.current;
  const canCallInBrowser = softphoneVisible && Boolean(deviceRef.current) && Boolean(lead?.can_call_via_twilio) && !calling;
  const softphoneHelper = softphoneState.helperText || (!lead?.can_call_via_twilio && lead?.lead_access_mode === "protected_twilio" ? callDisabledCopy : "");

  return (
    <Box>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Lead Queue</Typography>
          <Typography variant="body2" color="text.secondary">
            Work one lead at a time, record the outcome, and move to the next call without browsing the full database.
          </Typography>
        </Stack>

        <LeadProgressCards progress={progress} />

        <Alert severity="info" variant="outlined">{statusSummary}</Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <Stack spacing={3}>
              <TwilioDevicePanel
                visible={softphoneVisible}
                status={softphoneState.status}
                helperText={softphoneHelper}
                loading={initializingDevice}
                calling={calling}
                canInitialize={canInitializeDevice}
                onInitialize={handleInitializeDevice}
                canCall={canCallInBrowser}
                onCall={handleBrowserCall}
                onHangup={handleHangup}
                leadName={lead?.company_name || null}
                diagnostics={audioDiagnostics}
                onSelectInputDevice={handleSelectInputDevice}
                onSelectOutputDevice={handleSelectOutputDevice}
              />
              <LeadCurrentCard
                lead={lead}
                loading={loadingLead}
                onNext={handleNextLead}
                onSkip={handleSkip}
                skipDisabled={!lead || submitting || calling}
                onCall={handleTwilioCall}
                callLoading={calling}
                callUiMode={activeCallFlow === "twilio_browser" ? "browser" : "bridge"}
              />
              <LeadOutcomeForm
                lead={lead}
                form={form}
                onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              <LeadCallbacksPanel callbacks={callbacks} />
              <Divider />
              <LeadHistoryPanel history={history} />
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Snackbar open={Boolean(banner.message)} autoHideDuration={4000} onClose={() => setBanner({ type: "success", message: "" })}>
        <Alert severity={banner.type} onClose={() => setBanner({ type: "success", message: "" })} sx={{ width: "100%" }}>
          {banner.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
