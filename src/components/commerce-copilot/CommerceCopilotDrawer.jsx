import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../utils/api";

const QUICK_STARTS = [
  {
    workflow: "create_physical_product",
    title: "Create a physical product",
    description: "Start a product draft for something customers receive by shipping, pickup, or local delivery.",
    example: "Example: I sell handmade silver necklaces for $85 and want to ship them across Canada.",
  },
  {
    workflow: "create_digital_product",
    title: "Create a digital product",
    description: "Prepare a draft for files, links, or license-based delivery.",
  },
  {
    workflow: "repair_product",
    title: "Make a product ready to ship",
    description: "Review what is missing and prepare a safer product draft.",
  },
  {
    workflow: "prepare_international_shipping",
    title: "Prepare a product for international sales",
    description: "Review customs and destination readiness without applying changes.",
  },
  {
    workflow: "review_shipping_setup",
    title: "Review my shipping setup",
    description: "Explain what is configured and what is still missing for shipping.",
  },
  {
    workflow: "explain_order",
    title: "Explain a product order",
    description: "Read the order state and explain the safest next manual step.",
  },
];

const COPILOT_OVERLAY_Z_INDEX = (theme) => theme.zIndex.modal + 3000;
const FACT_CONFIRMATION_KEYS = new Set([
  "price",
  "cost",
  "qty_on_hand",
  "shipping_weight_grams",
  "shipping_length_mm",
  "shipping_width_mm",
  "shipping_height_mm",
  "shipping_country_of_origin",
  "shipping_hs_code",
  "shipping_declared_value_cents",
  "shipping_declared_value_currency",
  "length_mm",
  "width_mm",
  "height_mm",
  "tare_weight_grams",
  "destination_countries",
  "digital_access_days",
  "digital_max_downloads",
]);

const STATUS_LABELS = {
  global_feature_disabled: "Commerce Copilot is currently disabled.",
  tenant_access_disabled: "Commerce Copilot is disabled by platform settings.",
  openai_not_configured: "Commerce Copilot setup is incomplete. Ask a platform administrator to configure the AI provider.",
  openai_model_not_configured: "Commerce Copilot setup is incomplete. Ask a platform administrator to configure the AI provider model.",
  subscription_inactive: "An active subscription is required to use Schedulaa Commerce Copilot.",
  risk_hold: "Commerce Copilot is unavailable while this account is under billing review or suspension.",
  addon_required: "AI Commerce Copilot add-on required.",
  monthly_allowance_exhausted: "Monthly AI action allowance used for this billing period.",
  starter_upgrade_required: "Pro or Business is required before Commerce Copilot can be used in paid mode.",
};

const workflowLabel = (workflow) => {
  const row = QUICK_STARTS.find((item) => item.workflow === workflow);
  return row?.title || "Commerce Copilot";
};

const humanizeStatus = (value, fallback = "draft") => String(value || fallback).replace(/_/g, " ");

const flattenActionValues = (values) => {
  if (!values || typeof values !== "object" || Array.isArray(values)) return {};
  const flattened = {};
  Object.entries(values).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        flattened[`${key}.${nestedKey}`] = nestedValue;
      });
      return;
    }
    flattened[key] = value;
  });
  return flattened;
};

const FieldEditor = ({ sectionTitle, values, onChange }) => {
  const entries = Object.entries(values || {});
  if (!entries.length) return null;
  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{sectionTitle}</Typography>
      {entries.map(([key, value]) => (
        <TextField
          key={key}
          label={key.replace(/_/g, " ")}
          value={value == null ? "" : String(value)}
          onChange={(event) => onChange(key, event.target.value)}
          fullWidth
          size="small"
        />
      ))}
    </Stack>
  );
};

const QuestionControl = ({ question, value, onChange, onUseSuggestion, onShowHelp, onSaveIncomplete, disabled }) => {
  const inputType = String(question?.input_type || "text").toLowerCase();
  const choices = Array.isArray(question?.choices) ? question.choices : [];

  const sharedActions = (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      {question?.show_help_measure || question?.help_text ? (
        <Button size="small" variant="text" onClick={onShowHelp} disabled={disabled}>
          Help me find or measure this
        </Button>
      ) : null}
      {inputType === "choice" && choices.some((choice) => /suggest/i.test(String(choice))) ? (
        <Button size="small" variant="text" onClick={onUseSuggestion} disabled={disabled}>
          Ask AI for a suggestion
        </Button>
      ) : null}
      {question?.allow_unknown ? (
        <Button size="small" variant="text" onClick={onSaveIncomplete} disabled={disabled}>
          I don't know - save incomplete for now
        </Button>
      ) : null}
    </Stack>
  );

  if (inputType === "choice") {
    return (
      <Stack spacing={1}>
        <FormControl fullWidth size="small">
          <InputLabel id={`${question.question_id}-label`}>Choose an option</InputLabel>
          <Select
            labelId={`${question.question_id}-label`}
            value={value ?? ""}
            label="Choose an option"
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
          >
            {choices.map((choice) => (
              <MenuItem key={choice} value={choice}>{choice}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {sharedActions}
      </Stack>
    );
  }

  if (inputType === "boolean" || inputType === "yes_no") {
    return (
      <Stack spacing={1}>
        <Stack direction="row" spacing={1}>
          <Button variant={value === "yes" ? "contained" : "outlined"} onClick={() => onChange("yes")} disabled={disabled}>Yes</Button>
          <Button variant={value === "no" ? "contained" : "outlined"} onClick={() => onChange("no")} disabled={disabled}>No</Button>
        </Stack>
        {sharedActions}
      </Stack>
    );
  }

  const typeMap = {
    number: "number",
    currency: "number",
    country: "text",
    text: "text",
  };

  return (
    <Stack spacing={1}>
      <TextField
        fullWidth
        size="small"
        type={typeMap[inputType] || "text"}
        label={inputType === "currency" ? "Amount" : "Your answer"}
        placeholder={inputType === "country" ? "Example: Canada" : ""}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      {sharedActions}
    </Stack>
  );
};

const inferWorkflowFromText = (message, { targetProductId, targetProductOrderId }) => {
  const text = String(message || "").toLowerCase();
  if (!text.trim()) return null;
  if (targetProductOrderId || /\border\b|\btracking\b|\bpickup\b|\blabel\b/.test(text)) return "explain_order";
  if (/\bpdf\b|\bdownload\b|\bdigital\b|\bebook\b|\bguide\b|\blicense\b|\bfile\b/.test(text)) return "create_digital_product";
  if (targetProductId && /\brepair\b|\bfix\b|\bmissing\b|\bready to ship\b/.test(text)) return "repair_product";
  if (/\bshipping setup\b|\bdelivery setup\b|\beasypost\b|\bshipping policy\b/.test(text)) return "review_shipping_setup";
  if (targetProductId && /\binternational\b|\bcustoms\b|\bworldwide\b|\bunited states\b|\boutside canada\b/.test(text)) return "prepare_international_shipping";
  if (/\bsell\b|\bproduct\b|\bship\b|\bcanada\b|\bunited states\b|\bprice\b/.test(text)) return "create_physical_product";
  return null;
};

const buildQuestionReply = (questions, answers) => {
  const lines = questions
    .map((question) => {
      const value = answers[question.question_id];
      if (value == null || value === "") return null;
      return `- ${question.plain_language_question} ${value}`;
    })
    .filter(Boolean);
  return lines.length ? `Here are my answers:\n${lines.join("\n")}` : "";
};

const CommerceCopilotDrawer = ({
  open,
  onClose,
  token,
  initialWorkflow = "",
  targetProductId = null,
  targetProductOrderId = null,
}) => {
  const auth = useMemo(() => (token ? { headers: { Authorization: `Bearer ${token}` } } : {}), [token]);
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 900 : false;
  const [loadingCapabilities, setLoadingCapabilities] = useState(false);
  const [capabilities, setCapabilities] = useState(null);
  const [capabilityError, setCapabilityError] = useState("");
  const [busy, setBusy] = useState(false);
  const [bootMessage, setBootMessage] = useState("");
  const [messageText, setMessageText] = useState("");
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [sessionData, setSessionData] = useState(null);
  const [draftEdits, setDraftEdits] = useState({});
  const [selectedActions, setSelectedActions] = useState({});
  const [actionValueEdits, setActionValueEdits] = useState({});
  const [confirmationKeys, setConfirmationKeys] = useState({});
  const [approval, setApproval] = useState(null);
  const [execution, setExecution] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const session = sessionData?.session || null;
  const draft = sessionData?.draft || null;
  const plan = sessionData?.plan || null;
  const usageSummary = sessionData?.usage_summary || {};
  const messages = Array.isArray(sessionData?.messages) ? sessionData.messages : [];
  const availability = capabilities?.availability || {};
  const configuration = capabilities?.configuration || {};
  const blockers = Array.isArray(capabilities?.blockers) ? capabilities.blockers : [];
  const copilotBilling = capabilities?.billing?.ai_commerce_copilot || capabilities?.copilot || {};
  const progress = draft?.validation_results_json?.progress_percent ?? session?.context_summary_json?.progress_percent ?? 0;
  const quickStartWorkflow = initialWorkflow || "";
  const monetizationMode = availability?.monetization_mode || copilotBilling?.monetization_mode || "free_launch";
  const accessSource = availability?.access_source || copilotBilling?.access_source || null;
  const writeActionsAvailable = Boolean(availability?.write_actions_available);
  const chatAvailable = Boolean(availability?.chat_available);
  const draftsAvailable = Boolean(availability?.drafts_available);
  const plansAvailable = Boolean(availability?.plans_available);
  const providerReady = Boolean(availability?.provider_ready);
  const overallAvailable = Boolean(availability?.available);
  const addonActive = Boolean(copilotBilling?.addon_active);
  const activationAvailable = Boolean(copilotBilling?.activation_available);
  const allowanceRemaining = copilotBilling?.successful_actions_remaining;
  const generationLocked = !chatAvailable;
  const executionLocked = !writeActionsAvailable || allowanceRemaining === 0;
  const latestAssistantMessage = [...messages].reverse().find((row) => row.role === "assistant");
  const currentQuestions = Array.isArray(latestAssistantMessage?.safe_metadata_json?.questions)
    ? latestAssistantMessage.safe_metadata_json.questions.slice(0, 3)
    : [];

  const resetState = useCallback(() => {
    setSessionData(null);
    setMessageText("");
    setQuestionAnswers({});
    setDraftEdits({});
    setSelectedActions({});
    setActionValueEdits({});
    setConfirmationKeys({});
    setApproval(null);
    setExecution(null);
    setStatusMessage({ type: "", text: "" });
  }, []);

  const loadCapabilities = useCallback(async () => {
    setLoadingCapabilities(true);
    setCapabilityError("");
    try {
      const { data } = await api.get("/inventory/commerce-copilot/capabilities", auth);
      setCapabilities(data);
      if (!data?.availability?.write_actions_available) {
        setExecution((prev) => prev);
      }
    } catch (error) {
      setCapabilityError(error?.response?.data?.message || error?.message || "Unable to load Commerce Copilot.");
      setCapabilities(null);
    } finally {
      setLoadingCapabilities(false);
    }
  }, [auth]);

  const createSession = useCallback(async (workflow) => {
    setBusy(true);
    try {
      const { data } = await api.post(
        "/inventory/commerce-copilot/sessions",
        {
          workflow,
          mode: workflow === "explain_order" ? "guide" : "draft",
          target_product_id: targetProductId,
          target_product_order_id: targetProductOrderId,
        },
        auth
      );
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      return data;
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to start Commerce Copilot." });
      return null;
    } finally {
      setBusy(false);
    }
  }, [auth, targetProductId, targetProductOrderId]);

  const pushSessionTurn = useCallback(async (sessionPublicId, text) => {
    setBusy(true);
    setStatusMessage({ type: "", text: "" });
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/sessions/${sessionPublicId}/messages`, { message: text }, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setQuestionAnswers({});
      return true;
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "AI is temporarily unavailable. Try again." });
      return false;
    } finally {
      setBusy(false);
    }
  }, [auth]);

  const submitFirstMessage = useCallback(async () => {
    const text = String(messageText || "").trim();
    if (!text || busy) return;
    const workflow = quickStartWorkflow || inferWorkflowFromText(text, { targetProductId, targetProductOrderId });
    if (!workflow) {
      setStatusMessage({
        type: "info",
        text: "Tell Commerce Copilot whether you want help creating a product, fixing shipping setup, or explaining an order.",
      });
      return;
    }
    const created = await createSession(workflow);
    if (created?.session?.public_id) {
      setMessageText("");
      await pushSessionTurn(created.session.public_id, text);
    }
  }, [busy, createSession, messageText, pushSessionTurn, quickStartWorkflow, targetProductId, targetProductOrderId]);

  useEffect(() => {
    if (!open) {
      resetState();
      setCapabilities(null);
      setCapabilityError("");
      return;
    }
    loadCapabilities();
  }, [open, loadCapabilities, resetState]);

  useEffect(() => {
    if (!open || !capabilities || !quickStartWorkflow || sessionData || !availability.chat_available) return;
    createSession(quickStartWorkflow);
  }, [open, capabilities, quickStartWorkflow, sessionData, availability.chat_available, createSession]);

  useEffect(() => {
    const bits = [];
    if (availability.available === false && capabilities?.safe_message) bits.push(capabilities.safe_message);
    if (capabilities?.safe_message && availability.available) bits.push(capabilities.safe_message);
    if (capabilities?.copilot?.warning) bits.push(capabilities.copilot.warning);
    setBootMessage(bits.filter(Boolean).join(" "));
  }, [capabilities, availability.available]);

  const submitMessage = async () => {
    if (session?.public_id && String(messageText || "").trim()) {
      const next = String(messageText || "").trim();
      setMessageText("");
      await pushSessionTurn(session.public_id, next);
      return;
    }
    if (!session) {
      await submitFirstMessage();
    }
  };

  const submitQuestionAnswers = async () => {
    if (!session?.public_id || !currentQuestions.length) return;
    const reply = buildQuestionReply(currentQuestions, questionAnswers);
    if (!reply.trim()) {
      setStatusMessage({ type: "warning", text: "Answer at least one question before sending." });
      return;
    }
    await pushSessionTurn(session.public_id, reply);
  };

  const saveIncomplete = async () => {
    if (!session?.public_id) {
      setStatusMessage({ type: "info", text: "Start a conversation first, then you can save an incomplete draft." });
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/sessions/${session.public_id}/save-incomplete`, {}, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "Incomplete draft saved." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to save this draft yet." });
    } finally {
      setBusy(false);
    }
  };

  const cancelSession = async () => {
    if (!session?.public_id) {
      onClose?.();
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/sessions/${session.public_id}/cancel`, {}, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "Commerce Copilot session cancelled." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to cancel this session." });
    } finally {
      setBusy(false);
    }
  };

  const saveDraftEdits = async () => {
    if (!draft?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.patch(`/inventory/commerce-copilot/drafts/${draft.public_id}`, draftEdits, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setDraftEdits({});
      setStatusMessage({ type: "success", text: "Draft changes saved for review." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to save draft edits." });
    } finally {
      setBusy(false);
    }
  };

  const validateDraft = async () => {
    if (!draft?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/drafts/${draft.public_id}/validate`, {}, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "Draft validation updated." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to validate this draft." });
    } finally {
      setBusy(false);
    }
  };

  const updateDraftEditField = (key, value) => setDraftEdits((prev) => ({ ...prev, [key]: value }));

  const updatePlanActionStatus = async (publicId, status) => {
    if (!plan?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.patch(`/inventory/commerce-copilot/plans/${plan.public_id}`, { actions: [{ public_id: publicId, status }] }, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to update this action." });
    } finally {
      setBusy(false);
    }
  };

  const draftPayload = draft?.draft_payload_json || {};
  const confirmedValues = draftPayload.confirmed_values || {};
  const suggestedValues = draftPayload.suggested_values || {};
  const unknownValues = draftPayload.unknown_values || {};
  const planActions = Array.isArray(plan?.actions) ? plan.actions.slice(0, 5) : [];

  useEffect(() => {
    if (!planActions.length) {
      setSelectedActions({});
      setActionValueEdits({});
      setConfirmationKeys({});
      return;
    }
    setSelectedActions((prev) => {
      const next = {};
      planActions.forEach((action) => {
        next[action.public_id] = prev[action.public_id] ?? (action.status !== "rejected" && action.risk_level !== "high_risk_guide_only");
      });
      return next;
    });
  }, [plan?.public_id, planActions.length]);

  const setActionSelected = (publicId, checked) => setSelectedActions((prev) => ({ ...prev, [publicId]: checked }));
  const setActionFieldEdit = (publicId, key, value) =>
    setActionValueEdits((prev) => ({ ...prev, [publicId]: { ...(prev[publicId] || {}), [key]: value } }));
  const toggleConfirmationKey = (key, checked) => setConfirmationKeys((prev) => ({ ...prev, [key]: checked }));

  const confirmableKeys = useMemo(() => {
    const keys = new Set();
    planActions.forEach((action) => {
      Object.keys(flattenActionValues(action?.proposed_input_json)).forEach((key) => {
        const rawKey = key.includes(".") ? key.split(".").slice(-1)[0] : key;
        if (FACT_CONFIRMATION_KEYS.has(rawKey) || FACT_CONFIRMATION_KEYS.has(key)) keys.add(rawKey);
      });
    });
    return Array.from(keys);
  }, [planActions]);

  const approveSelectedChanges = async () => {
    if (!plan?.public_id) return;
    const selectedActionIds = planActions.filter((action) => selectedActions[action.public_id]).map((action) => action.public_id);
    if (!selectedActionIds.length) {
      setStatusMessage({ type: "warning", text: "Select at least one action to approve." });
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(
        `/inventory/commerce-copilot/plans/${plan.public_id}/approve`,
        {
          plan_version: plan.version,
          selected_action_ids: selectedActionIds,
          action_value_edits: actionValueEdits,
          confirmation_keys: Object.keys(confirmationKeys).filter((key) => confirmationKeys[key]),
        },
        auth
      );
      setApproval(data);
      setExecution(null);
      setStatusMessage({ type: "success", text: "Changes approved. Review once more before applying them." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to approve these changes." });
    } finally {
      setBusy(false);
    }
  };

  const applyApprovedChanges = async () => {
    if (!approval?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.post(
        `/inventory/commerce-copilot/approvals/${approval.public_id}/execute`,
        {
          request_idempotency_key: `copilot-ui-${Date.now()}`,
          final_confirmation: true,
        },
        auth
      );
      setExecution(data);
      setStatusMessage({
        type: "success",
        text: data?.status === "completed" ? "Approved changes were applied." : "Execution finished with follow-up items.",
      });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to apply approved changes." });
    } finally {
      setBusy(false);
    }
  };

  const renderPrimaryBanner = () => {
    if (capabilityError) return <Alert severity="warning">{capabilityError}</Alert>;
    if (!capabilities) return null;
    if (!overallAvailable) {
      const primary = blockers[0];
      return <Alert severity="warning">{capabilities.safe_message || STATUS_LABELS[primary] || "Commerce Copilot is not available right now."}</Alert>;
    }
    if (chatAvailable && !writeActionsAvailable) {
      return <Alert severity="info">Commerce Copilot can create drafts and plans. Applying changes is currently disabled.</Alert>;
    }
    if (!chatAvailable && blockers.includes("openai_not_configured")) {
      return <Alert severity="warning">Commerce Copilot setup is incomplete. Ask a platform administrator to configure the AI provider.</Alert>;
    }
    return null;
  };

  const content = (
    <Box sx={{ width: { xs: "100vw", md: 640 }, p: 2.25 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack spacing={0.25}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Schedulaa Commerce Copilot</Typography>
            <Typography variant="body2" color="text.secondary">
              {session ? workflowLabel(session.workflow) : "Ask in plain language. Commerce Copilot will prepare drafts, plans, and approved safe changes when available."}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={loadCapabilities} disabled={loadingCapabilities || busy}>
              Refresh
            </Button>
            <Button size="small" onClick={onClose}>Close</Button>
          </Stack>
        </Stack>

        {loadingCapabilities && !capabilities ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">Loading Commerce Copilot...</Typography>
          </Stack>
        ) : null}

        {renderPrimaryBanner()}

        {monetizationMode === "free_launch" && capabilities ? (
          <Chip label="Included during free launch" color="success" variant="outlined" sx={{ alignSelf: "flex-start" }} />
        ) : null}

        {monetizationMode === "paid_addon_required" && !addonActive && activationAvailable ? (
          <Alert severity="warning">AI Commerce Copilot add-on required. Existing history remains visible, but new sessions and approved changes are locked until billing is activated.</Alert>
        ) : null}

        {copilotBilling?.warning ? <Alert severity="warning">{copilotBilling.warning}</Alert> : null}
        {statusMessage.text ? <Alert severity={statusMessage.type || "info"}>{statusMessage.text}</Alert> : null}

        {!session && capabilities && overallAvailable ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>What would you like help with?</Typography>
              <Typography variant="body2" color="text.secondary">Pick a workflow or describe what you need in plain language.</Typography>
            </Box>
            <Grid container spacing={1.5}>
              {QUICK_STARTS.map((card) => (
                <Grid item xs={12} sm={6} key={card.workflow}>
                  <Card variant="outlined">
                    <CardActionArea onClick={() => (chatAvailable ? createSession(card.workflow) : null)}>
                      <Box sx={{ pointerEvents: chatAvailable ? "auto" : "none", opacity: chatAvailable ? 1 : 0.65 }}>
                        <CardContent>
                          <Stack spacing={0.75}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{card.title}</Typography>
                            <Typography variant="body2" color="text.secondary">{card.description}</Typography>
                            {card.example ? (
                              <Typography variant="caption" color="text.secondary">{card.example}</Typography>
                            ) : null}
                          </Stack>
                        </CardContent>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1.25}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Or describe what you need</Typography>
                  <TextField
                    multiline
                    minRows={3}
                    label="Tell Commerce Copilot what you need"
                    placeholder="Example: I sell handmade bracelets for $45 and want to ship within Canada."
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    disabled={!chatAvailable || busy}
                    fullWidth
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button variant="contained" startIcon={<SmartToyOutlinedIcon />} onClick={submitMessage} disabled={busy || !messageText.trim() || !chatAvailable}>
                      {busy ? "Working..." : "Send"}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : null}

        {!session && capabilities && !overallAvailable && availability.provider_ready === false ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Commerce Copilot setup is incomplete</Typography>
              <Typography variant="body2" color="text.secondary">
                Ask a platform administrator to configure the AI provider, then refresh this drawer.
              </Typography>
            </CardContent>
          </Card>
        ) : null}

        {session ? (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
              <Chip label={`Status: ${humanizeStatus(session.status, "active")}`} color="primary" variant="outlined" />
              <Chip label={`Progress: ${progress}%`} variant="outlined" />
              <Chip label={`Turns: ${usageSummary.requests || 0} AI request${(usageSummary.requests || 0) === 1 ? "" : "s"}`} variant="outlined" />
              {monetizationMode === "paid_addon_required" ? <Chip label={`Actions remaining: ${allowanceRemaining ?? 0}`} variant="outlined" /> : null}
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Conversation</Typography>
                    <Stack spacing={1.25} sx={{ maxHeight: 300, overflowY: "auto", pr: 0.5 }}>
                      {messages.map((row) => (
                        <Box
                          key={row.id}
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            bgcolor: row.role === "manager" ? "action.selected" : row.role === "assistant" ? "background.default" : "action.hover",
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                            {row.role === "manager" ? "You" : row.role === "assistant" ? "Copilot" : "System"}
                          </Typography>
                          <Typography variant="body2">{row.message_text}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    {currentQuestions.length ? (
                      <Card variant="outlined" sx={{ mt: 1.5 }}>
                        <CardContent>
                          <Stack spacing={1.5}>
                            {currentQuestions.map((question) => (
                              <Stack key={question.question_id} spacing={0.75}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{question.plain_language_question}</Typography>
                                <Typography variant="caption" color="text.secondary">{question.why_needed}</Typography>
                                <QuestionControl
                                  question={question}
                                  value={questionAnswers[question.question_id] ?? ""}
                                  onChange={(value) => setQuestionAnswers((prev) => ({ ...prev, [question.question_id]: value }))}
                                  onUseSuggestion={() => setQuestionAnswers((prev) => ({ ...prev, [question.question_id]: "Please suggest one." }))}
                                  onShowHelp={() => setStatusMessage({ type: "info", text: question.help_text || "Use a simple measurement or product reference and Commerce Copilot will normalize it for you." })}
                                  onSaveIncomplete={saveIncomplete}
                                  disabled={busy || generationLocked}
                                />
                              </Stack>
                            ))}
                            <Button variant="outlined" onClick={submitQuestionAnswers} disabled={busy || generationLocked}>
                              Send answers
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    ) : null}
                    <Stack spacing={1} sx={{ mt: 1.5 }}>
                      <TextField
                        multiline
                        minRows={3}
                        label="Tell Commerce Copilot what you need"
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                        placeholder="Example: I sell handmade silver necklaces in Canada and want to ship them internationally later."
                        fullWidth
                        disabled={generationLocked}
                      />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button variant="contained" startIcon={<SmartToyOutlinedIcon />} disabled={busy || !messageText.trim() || generationLocked} onClick={submitMessage}>
                          {busy ? "Working..." : "Send"}
                        </Button>
                        <Button variant="outlined" onClick={saveIncomplete} disabled={busy}>
                          Save incomplete draft
                        </Button>
                        <Button variant="text" color="inherit" onClick={cancelSession} disabled={busy}>
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Progress</Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2"><strong>Known:</strong> {(draft?.validation_results_json?.known || []).length}</Typography>
                        <Typography variant="body2"><strong>Still needed:</strong> {(draft?.validation_results_json?.missing_required || []).length}</Typography>
                        <Typography variant="body2"><strong>Needs your confirmation:</strong> {(draft?.validation_results_json?.needs_confirmation || []).length}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>

                  {draft ? (
                    <Card variant="outlined">
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Draft preview</Typography>
                          <Chip label={humanizeStatus(draft.status, "draft")} variant="outlined" />
                        </Stack>
                        <Stack spacing={1.5}>
                          <FieldEditor sectionTitle="Confirmed" values={confirmedValues} onChange={updateDraftEditField} />
                          <FieldEditor sectionTitle="Suggested" values={suggestedValues} onChange={updateDraftEditField} />
                          <FieldEditor sectionTitle="Missing" values={unknownValues} onChange={updateDraftEditField} />
                          {(draftPayload.activation_blockers || []).length > 0 ? (
                            <Alert severity="warning">Activation blockers: {(draftPayload.activation_blockers || []).join(", ")}</Alert>
                          ) : null}
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <Button variant="outlined" onClick={saveDraftEdits} disabled={busy || !Object.keys(draftEdits).length}>
                              Save draft edits
                            </Button>
                            <Button variant="outlined" onClick={validateDraft} disabled={busy || !draftsAvailable}>
                              Validate draft
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ) : null}
                </Stack>
              </Grid>
            </Grid>

            {plan ? (
              <Card variant="outlined">
                <CardContent>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{writeActionsAvailable ? "Review selected changes" : "Plan preview"}</Typography>
                    {!writeActionsAvailable ? (
                      <Alert severity="info" sx={{ py: 0 }}>Commerce Copilot can create drafts and plans. Applying changes is currently disabled.</Alert>
                    ) : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {plan.summary || "Commerce Copilot prepared a plan based on your current draft."}
                  </Typography>
                  <Stack spacing={1.25}>
                    {planActions.map((action) => (
                      <Card key={action.public_id} variant="outlined">
                        <CardContent>
                          <Stack spacing={1}>
                            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                              <Stack spacing={0.5}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{action.title}</Typography>
                                {writeActionsAvailable ? (
                                  <FormControlLabel
                                    control={(
                                      <Checkbox
                                        checked={Boolean(selectedActions[action.public_id])}
                                        onChange={(event) => setActionSelected(action.public_id, event.target.checked)}
                                        disabled={busy || action.status === "unsupported" || action.risk_level === "high_risk_guide_only"}
                                      />
                                    )}
                                    label="Include this change"
                                  />
                                ) : null}
                              </Stack>
                              <Stack direction="row" spacing={1}>
                                <Chip size="small" label={humanizeStatus(action.risk_level, "preview")} variant="outlined" />
                                <Chip size="small" label={writeActionsAvailable ? "Ready for approval" : "Preview only"} color={writeActionsAvailable ? "success" : "default"} variant="outlined" />
                              </Stack>
                            </Stack>
                            <Typography variant="body2">{action.plain_language_description}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Object.keys(flattenActionValues(action.proposed_input_json)).length} value field{Object.keys(flattenActionValues(action.proposed_input_json)).length === 1 ? "" : "s"} prepared
                            </Typography>
                            <FieldEditor
                              sectionTitle="Proposed values"
                              values={flattenActionValues(action.proposed_input_json)}
                              onChange={(key, value) => setActionFieldEdit(action.public_id, key, value)}
                            />
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                              <Button size="small" variant="outlined" onClick={() => updatePlanActionStatus(action.public_id, "rejected")} disabled={busy}>
                                Reject
                              </Button>
                              <Button size="small" variant="text" onClick={() => setMessageText(`Please change the plan action "${action.title}".`)} disabled={busy}>
                                Ask AI to change
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>

                  {writeActionsAvailable ? (
                    <Stack spacing={1.25} sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Approve selected changes</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Selected actions: {planActions.filter((action) => selectedActions[action.public_id]).length}
                      </Typography>
                      {confirmableKeys.map((key) => (
                        <FormControlLabel
                          key={key}
                          control={<Checkbox checked={Boolean(confirmationKeys[key])} onChange={(event) => toggleConfirmationKey(key, event.target.checked)} disabled={busy} />}
                          label={`I reviewed the ${key.replace(/_/g, " ")} value.`}
                        />
                      ))}
                      <FormControlLabel
                        control={<Checkbox checked={Boolean(confirmationKeys.__account_confirmed__)} onChange={(event) => toggleConfirmationKey("__account_confirmed__", event.target.checked)} disabled={busy} />}
                        label="I understand that these changes will be applied to my Schedulaa account."
                      />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button variant="contained" onClick={approveSelectedChanges} disabled={busy || !confirmationKeys.__account_confirmed__}>
                          Approve selected changes
                        </Button>
                        <Button variant="outlined" onClick={applyApprovedChanges} disabled={busy || !approval?.public_id || executionLocked}>
                          Apply approved changes
                        </Button>
                      </Stack>
                    </Stack>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {approval ? (
              <Alert severity="info">
                Approved {Array.isArray(approval.approved_actions) ? approval.approved_actions.length : 0} change{Array.isArray(approval.approved_actions) && approval.approved_actions.length === 1 ? "" : "s"}.
                {approval.execution_available ? " You can now apply them." : " Changes were reviewed, but applying them is currently disabled."}
              </Alert>
            ) : null}

            {execution ? (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Execution results</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Status: {humanizeStatus(execution.status, "completed")}
                  </Typography>
                  <Stack spacing={1}>
                    {(execution.summary?.actions || []).map((row) => (
                      <Alert
                        key={row.public_id || `${row.action_id}-${row.attempt_number}`}
                        severity={row.status === "succeeded" ? "success" : row.status === "skipped_dependency" ? "info" : "warning"}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{humanizeStatus(row.status, "result")}</Typography>
                        {row.result_summary_json?.deep_link ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Open: {row.result_summary_json.deep_link}
                          </Typography>
                        ) : null}
                        {row.safe_error_message ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {row.safe_error_message}
                          </Typography>
                        ) : null}
                      </Alert>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </Stack>
    </Box>
  );

  if (isMobile) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen
        sx={{ zIndex: COPILOT_OVERLAY_Z_INDEX, "& .MuiDialog-paper": { zIndex: "inherit" } }}
      >
        <DialogTitle sx={{ p: 0 }}><Box /></DialogTitle>
        <DialogContent sx={{ p: 0 }}>{content}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: COPILOT_OVERLAY_Z_INDEX,
        "& .MuiDrawer-paper": {
          zIndex: "inherit",
          width: 640,
          maxWidth: "100vw",
        },
      }}
    >
      {content}
    </Drawer>
  );
};

export default CommerceCopilotDrawer;
