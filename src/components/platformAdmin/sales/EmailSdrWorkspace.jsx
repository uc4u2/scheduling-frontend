import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  activateEmailAgent,
  activateEmailProviderConnection,
  applyEmailSegmentToCampaign,
  approveEmailCampaign,
  assignEmailHotLeadToYousef,
  classifyEmailInboundEvent,
  classifyEmailReply,
  createEmailAgent,
  createEmailCampaign,
  createEmailProviderConnection,
  createEmailSegment,
  createEmailTemplate,
  createEmailSuppression,
  createSalesDealFromEmailHotLead,
  getEmailCampaignAnalytics,
  getEmailSdrAnalytics,
  generateEmailCampaignDrafts,
  generateEmailCampaignFollowUps,
  getEmailSdrOverview,
  listEmailAgents,
  listEmailProviderConnections,
  listEmailSegments,
  listEmailTemplates,
  listEmailAgentLimitsToday,
  listEmailCampaigns,
  listEmailHotLeads,
  listEmailInboundEvents,
  listEmailMessages,
  listEmailSuppression,
  markEmailHotLeadContacted,
  pauseEmailAgent,
  pauseEmailCampaign,
  pauseEmailProviderConnection,
  prepareEmailCampaignForSending,
  previewEmailTemplate,
  previewEmailSegment,
  previewEmailCampaignLeads,
  quickStartEmailCampaign,
  runEmailSdrDueSend,
  sendEmailCampaign,
  testEmailProviderConnection,
  updateEmailAgent,
  updateEmailAgentLimitToday,
  updateEmailCampaignAutomationSettings,
  updateEmailMessage,
  updateEmailProviderConnection,
  updateEmailSegment,
  updateEmailTemplate,
  archiveEmailTemplate,
} from "../../../api/platformAdminSales";

const emptyCampaignForm = {
  name: "",
  business_type: "",
  city: "",
  daily_limit_per_agent: 10,
  send_window_start: "09:00",
  send_window_end: "17:00",
  timezone: "America/Toronto",
  follow_up_mode: "manual",
  provider_connection_id: "",
};

const emptyProviderForm = {
  provider: "smtp",
  name: "",
  from_email: "",
  from_name: "",
  reply_to_email: "",
  daily_limit: 10,
  warmup_stage: "",
};

const emptySegmentForm = {
  name: "",
  business_type: "",
  city: "",
  source_type: "",
  email_consent_basis: "",
  email_publicly_listed: "",
  exclude_do_not_contact: true,
  exclude_suppressed: true,
  only_uncontacted: true,
  only_not_replied: true,
};

const emptyAgentForm = {
  sales_rep_id: "",
  display_name: "",
  from_name: "",
  from_email: "",
  reply_to_email: "",
  role_type: "general",
  status: "draft",
  daily_limit: 10,
  warmup_stage: "new",
  provider_connection_id: "",
  signature: "",
  timezone: "America/Toronto",
  send_window_start: "09:00",
  send_window_end: "17:00",
};

const emptyTemplateForm = {
  name: "",
  category: "cold_initial",
  business_type: "",
  tone: "professional",
  subject: "",
  body: "",
  is_default: false,
};

const classificationOptions = [
  "positive_interested",
  "asked_for_demo",
  "asked_for_price",
  "asked_question",
  "not_now",
  "not_interested",
  "stop_unsubscribe",
  "wrong_contact",
  "auto_reply",
  "bounce",
];

const editableStatuses = new Set(["draft", "approved", "scheduled"]);

export default function EmailSdrWorkspace({ reps = [], onOpenLead, showBanner }) {
  const [overview, setOverview] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [messages, setMessages] = useState([]);
  const [emailAgents, setEmailAgents] = useState([]);
  const [providerConnections, setProviderConnections] = useState([]);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [hotLeads, setHotLeads] = useState([]);
  const [suppression, setSuppression] = useState([]);
  const [agentLimits, setAgentLimits] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [campaignAnalytics, setCampaignAnalytics] = useState({});
  const [newReplyEvents, setNewReplyEvents] = useState([]);
  const [unmatchedEvents, setUnmatchedEvents] = useState([]);
  const [bounceEvents, setBounceEvents] = useState([]);
  const [campaignPreviews, setCampaignPreviews] = useState({});
  const [segmentPreviews, setSegmentPreviews] = useState({});
  const [templatePreviews, setTemplatePreviews] = useState({});
  const [campaignSegmentSelections, setCampaignSegmentSelections] = useState({});
  const [campaignForm, setCampaignForm] = useState(emptyCampaignForm);
  const [quickStartForm, setQuickStartForm] = useState({
    name: "",
    business_type: "",
    city: "",
    provider_connection_id: "",
    initial_template_id: "",
    follow_up_1_template_id: "",
    follow_up_2_template_id: "",
    segment_id: "",
  });
  const [providerForm, setProviderForm] = useState(emptyProviderForm);
  const [segmentForm, setSegmentForm] = useState(emptySegmentForm);
  const [agentForm, setAgentForm] = useState(emptyAgentForm);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [messageReplyText, setMessageReplyText] = useState({});
  const [messageReplyClass, setMessageReplyClass] = useState({});
  const [inboundReplyText, setInboundReplyText] = useState({});
  const [inboundReplyClass, setInboundReplyClass] = useState({});
  const [messageDraftState, setMessageDraftState] = useState({});
  const [agentLimitDrafts, setAgentLimitDrafts] = useState({});
  const [agentDrafts, setAgentDrafts] = useState({});
  const [providerDrafts, setProviderDrafts] = useState({});
  const [segmentDrafts, setSegmentDrafts] = useState({});
  const [templateDrafts, setTemplateDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const aiEmailAgents = useMemo(
    () => reps.filter((rep) => rep.is_ai_agent && rep.is_active && !rep.ai_sdr_paused),
    [reps]
  );

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [
        overviewResp,
        analyticsResp,
        campaignRows,
        emailAgentResp,
        providerRows,
        segmentRows,
        templateRows,
        messageRows,
        hotRows,
        suppressionRows,
        agentLimitRows,
        inboundReplyRows,
        unmatchedRows,
        bounceRows,
      ] = await Promise.all([
        getEmailSdrOverview(),
        getEmailSdrAnalytics(),
        listEmailCampaigns(),
        listEmailAgents(),
        listEmailProviderConnections(),
        listEmailSegments(),
        listEmailTemplates(),
        listEmailMessages(),
        listEmailHotLeads(),
        listEmailSuppression(),
        listEmailAgentLimitsToday(),
        listEmailInboundEvents({ queue: "new_replies", limit: 50 }),
        listEmailInboundEvents({ queue: "unmatched", limit: 50 }),
        listEmailInboundEvents({ queue: "bounces", limit: 50 }),
      ]);
      setOverview(overviewResp || {});
      setAnalytics(analyticsResp || null);
      setCampaigns(campaignRows || []);
      setEmailAgents(emailAgentResp?.agents || []);
      setProviderConnections(providerRows || []);
      setSegments(segmentRows || []);
      setTemplates(templateRows || []);
      setMessages(messageRows || []);
      setHotLeads(hotRows || []);
      setSuppression(suppressionRows || []);
      setAgentLimits(agentLimitRows || []);
      setNewReplyEvents(inboundReplyRows || []);
      setUnmatchedEvents(unmatchedRows || []);
      setBounceEvents(bounceRows || []);
      setProviderDrafts((prev) => {
        const next = { ...prev };
        (providerRows || []).forEach((row) => {
          next[row.id] = next[row.id] || {
            provider: row.provider,
            name: row.name,
            from_email: row.from_email,
            from_name: row.from_name || "",
            reply_to_email: row.reply_to_email || "",
            daily_limit: row.daily_limit,
            warmup_stage: row.warmup_stage || "",
          };
        });
        return next;
      });
      setAgentDrafts((prev) => {
        const next = { ...prev };
        (emailAgentResp?.agents || []).forEach((row) => {
          next[row.id] = next[row.id] || {
            display_name: row.display_name || "",
            from_name: row.from_name || "",
            from_email: row.from_email || "",
            reply_to_email: row.reply_to_email || "",
            role_type: row.role_type || "general",
            status: row.status || "draft",
            daily_limit: row.daily_limit || 10,
            warmup_stage: row.warmup_stage || "new",
            provider_connection_id: row.provider_connection_id || "",
            signature: row.signature || "",
            timezone: row.timezone || "America/Toronto",
            send_window_start: row.send_window_start || "",
            send_window_end: row.send_window_end || "",
          };
        });
        return next;
      });
      setSegmentDrafts((prev) => {
        const next = { ...prev };
        (segmentRows || []).forEach((row) => {
          next[row.id] = next[row.id] || {
            name: row.name,
            business_type: row.business_type || "",
            city: row.city || "",
            source_type: row.source_type || "",
            email_consent_basis: row.email_consent_basis || "",
            email_publicly_listed: row.email_publicly_listed === null || row.email_publicly_listed === undefined ? "" : String(Boolean(row.email_publicly_listed)),
            exclude_do_not_contact: Boolean(row.exclude_do_not_contact),
            exclude_suppressed: Boolean(row.exclude_suppressed),
            only_uncontacted: Boolean(row.only_uncontacted),
            only_not_replied: Boolean(row.only_not_replied),
          };
        });
        return next;
      });
      setTemplateDrafts((prev) => {
        const next = { ...prev };
        (templateRows || []).forEach((row) => {
          next[row.id] = next[row.id] || {
            name: row.name || "",
            category: row.category || "cold_initial",
            business_type: row.business_type || "",
            tone: row.tone || "professional",
            subject: row.subject || "",
            body: row.body || "",
            is_default: Boolean(row.is_default),
            status: row.status || "draft",
          };
        });
        return next;
      });
      setAgentLimitDrafts((prev) => {
        const next = { ...prev };
        (agentLimitRows || []).forEach((row) => {
          next[row.sales_rep_id] = next[row.sales_rep_id] || {
            daily_limit: row.daily_limit,
            paused: Boolean(row.paused),
            warmup_stage: row.warmup_stage || "",
          };
        });
        return next;
      });
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to load Email SDR.");
    } finally {
      setLoading(false);
    }
  }, [showBanner]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleCreateCampaign = async () => {
    setSubmitting(true);
    try {
      const campaign = await createEmailCampaign({
        ...campaignForm,
        daily_limit_per_agent: Number(campaignForm.daily_limit_per_agent || 10),
        provider_connection_id: campaignForm.provider_connection_id ? Number(campaignForm.provider_connection_id) : null,
      });
      setCampaignForm(emptyCampaignForm);
      showBanner("success", `Campaign "${campaign?.name || "created"}" created.`);
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to create email campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProviderConnection = async () => {
    setSubmitting(true);
    try {
      await createEmailProviderConnection({
        ...providerForm,
        daily_limit: Number(providerForm.daily_limit || 10),
      });
      setProviderForm(emptyProviderForm);
      showBanner("success", "Provider connection created.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to create provider connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEmailAgent = async () => {
    setSubmitting(true);
    try {
      await createEmailAgent({
        ...agentForm,
        sales_rep_id: Number(agentForm.sales_rep_id),
        daily_limit: Number(agentForm.daily_limit || 10),
        provider_connection_id: agentForm.provider_connection_id ? Number(agentForm.provider_connection_id) : null,
      });
      setAgentForm(emptyAgentForm);
      showBanner("success", "Email agent created.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to create email agent.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEmailAgent = async (agentId) => {
    const draft = agentDrafts[agentId];
    if (!draft) return;
    setSubmitting(true);
    try {
      await updateEmailAgent(agentId, {
        ...draft,
        daily_limit: Number(draft.daily_limit || 10),
        provider_connection_id: draft.provider_connection_id ? Number(draft.provider_connection_id) : null,
      });
      showBanner("success", "Email agent updated.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to update email agent.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAgentAction = async (agentId, action) => {
    setSubmitting(true);
    try {
      if (action === "pause") {
        await pauseEmailAgent(agentId);
        showBanner("success", "Email agent paused.");
      } else {
        await activateEmailAgent(agentId);
        showBanner("success", "Email agent activated.");
      }
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Email agent action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProviderConnection = async (connectionId) => {
    const draft = providerDrafts[connectionId];
    if (!draft) return;
    setSubmitting(true);
    try {
      await updateEmailProviderConnection(connectionId, {
        ...draft,
        daily_limit: Number(draft.daily_limit || 10),
      });
      showBanner("success", "Provider connection updated.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to update provider connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProviderAction = async (connectionId, action) => {
    setSubmitting(true);
    try {
      if (action === "test") {
        await testEmailProviderConnection(connectionId, {});
        showBanner("success", "Provider test email sent.");
      } else if (action === "pause") {
        await pauseEmailProviderConnection(connectionId);
        showBanner("success", "Provider connection paused.");
      } else if (action === "activate") {
        await activateEmailProviderConnection(connectionId);
        showBanner("success", "Provider connection activated.");
      }
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Provider action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSegment = async () => {
    setSubmitting(true);
    try {
      await createEmailSegment({
        ...segmentForm,
        email_publicly_listed:
          segmentForm.email_publicly_listed === ""
            ? null
            : segmentForm.email_publicly_listed === "true",
      });
      setSegmentForm(emptySegmentForm);
      showBanner("success", "Segment created.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to create segment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTemplate = async () => {
    setSubmitting(true);
    try {
      await createEmailTemplate(templateForm);
      setTemplateForm(emptyTemplateForm);
      showBanner("success", "Email template created.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to create email template.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveTemplate = async (templateId) => {
    const draft = templateDrafts[templateId];
    if (!draft) return;
    setSubmitting(true);
    try {
      await updateEmailTemplate(templateId, draft);
      showBanner("success", "Email template updated.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to update email template.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveTemplate = async (templateId) => {
    setSubmitting(true);
    try {
      await archiveEmailTemplate(templateId);
      showBanner("success", "Email template archived.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to archive email template.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewTemplate = async (templateId) => {
    setSubmitting(true);
    try {
      const result = await previewEmailTemplate(templateId, {});
      setTemplatePreviews((prev) => ({ ...prev, [templateId]: result.preview }));
      showBanner("info", "Template preview loaded.");
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to preview email template.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSegment = async (segmentId) => {
    const draft = segmentDrafts[segmentId];
    if (!draft) return;
    setSubmitting(true);
    try {
      await updateEmailSegment(segmentId, {
        ...draft,
        email_publicly_listed:
          draft.email_publicly_listed === ""
            ? null
            : draft.email_publicly_listed === "true",
      });
      showBanner("success", "Segment updated.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to update segment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewSegment = async (segmentId) => {
    setSubmitting(true);
    try {
      const result = await previewEmailSegment(segmentId);
      setSegmentPreviews((prev) => ({ ...prev, [segmentId]: result.preview }));
      showBanner("info", `Segment preview loaded: ${result?.preview?.eligible_count || 0} eligible.`);
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to preview segment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplySegmentToCampaign = async (campaignId, segmentId) => {
    setSubmitting(true);
    try {
      const result = await applyEmailSegmentToCampaign(campaignId, { segment_id: segmentId });
      setCampaignPreviews((prev) => ({ ...prev, [campaignId]: result.preview }));
      showBanner("success", `Applied segment "${result?.segment?.name || segmentId}" to campaign.`);
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to apply segment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadCampaignAnalytics = async (campaignId) => {
    setSubmitting(true);
    try {
      const result = await getEmailCampaignAnalytics(campaignId);
      setCampaignAnalytics((prev) => ({ ...prev, [campaignId]: result }));
      showBanner("info", "Campaign analytics loaded.");
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to load campaign analytics.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCampaignAutomation = async (campaignId, payload = {}) => {
    setSubmitting(true);
    try {
      await updateEmailCampaignAutomationSettings(campaignId, payload);
      showBanner("success", "Campaign automation updated.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to update campaign automation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrepareCampaign = async (campaignId) => {
    setSubmitting(true);
    try {
      const result = await prepareEmailCampaignForSending(campaignId);
      setCampaignPreviews((prev) => ({ ...prev, [campaignId]: result.preview }));
      showBanner("success", `Prepared campaign. Ready messages: ${result.ready_count || 0}.`);
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to prepare campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStartCampaign = async () => {
    setSubmitting(true);
    try {
      const result = await quickStartEmailCampaign({
        ...quickStartForm,
        provider_connection_id: quickStartForm.provider_connection_id ? Number(quickStartForm.provider_connection_id) : null,
        initial_template_id: quickStartForm.initial_template_id ? Number(quickStartForm.initial_template_id) : null,
        follow_up_1_template_id: quickStartForm.follow_up_1_template_id ? Number(quickStartForm.follow_up_1_template_id) : null,
        follow_up_2_template_id: quickStartForm.follow_up_2_template_id ? Number(quickStartForm.follow_up_2_template_id) : null,
        segment_id: quickStartForm.segment_id ? Number(quickStartForm.segment_id) : null,
      });
      setCampaignPreviews((prev) => ({ ...prev, [result.campaign.id]: result.preview }));
      showBanner("success", `Quick-start created campaign "${result.campaign.name}".`);
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to quick-start campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCampaignAction = async (campaignId, action) => {
    setSubmitting(true);
    try {
      if (action === "preview") {
        const result = await previewEmailCampaignLeads(campaignId);
        setCampaignPreviews((prev) => ({ ...prev, [campaignId]: result }));
        showBanner("info", `Preview loaded: ${result?.eligible_count || 0} eligible, ${result?.blocked_count || 0} blocked.`);
      } else if (action === "drafts") {
        const result = await generateEmailCampaignDrafts(campaignId, {});
        showBanner("success", `Generated ${result?.created_count || 0} draft(s).`);
      } else if (action === "followups") {
        const result = await generateEmailCampaignFollowUps(campaignId);
        showBanner("success", `Generated ${result?.created_count || 0} follow-up draft(s).`);
      } else if (action === "approve") {
        const result = await approveEmailCampaign(campaignId, {});
        showBanner("success", `Approved ${result?.approved_count || 0} draft(s).`);
      } else if (action === "send") {
        const result = await sendEmailCampaign(campaignId);
        if (result?.blocked?.length) {
          showBanner("warning", `Sent ${result?.sent_count || 0} email(s). ${result.blocked.length} blocked.`);
        } else {
          showBanner("success", `Sent ${result?.sent_count || 0} email(s).`);
        }
      } else if (action === "pause") {
        await pauseEmailCampaign(campaignId);
        showBanner("success", "Campaign paused.");
      }
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Campaign action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunDueSendNow = async () => {
    setSubmitting(true);
    try {
      const result = await runEmailSdrDueSend();
      if (result?.blocked?.length) {
        showBanner("warning", `Sent ${result?.sent_count || 0} due email(s). ${result.blocked.length} blocked.`);
      } else {
        showBanner("success", `Sent ${result?.sent_count || 0} due email(s).`);
      }
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to run due send.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraftMessage = async (messageId) => {
    const draft = messageDraftState[messageId];
    if (!draft) return;
    setSubmitting(true);
    try {
      const result = await updateEmailMessage(messageId, draft);
      setMessageDraftState((prev) => ({ ...prev, [messageId]: undefined }));
      showBanner("success", `Updated message fields: ${(result?.changed_fields || []).join(", ") || "none"}.`);
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to update email draft.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClassifyReply = async (messageId) => {
    const classification = messageReplyClass[messageId];
    if (!classification) return;
    setSubmitting(true);
    try {
      const result = await classifyEmailReply(messageId, {
        classification,
        reply_text: messageReplyText[messageId] || "",
      });
      showBanner("success", `Reply classified as ${result?.classification?.classification || classification}.`);
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to classify reply.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClassifyInboundReply = async (eventId) => {
    const classification = inboundReplyClass[eventId];
    if (!classification) return;
    setSubmitting(true);
    try {
      const result = await classifyEmailInboundEvent(eventId, {
        classification,
        reply_text: inboundReplyText[eventId] || "",
      });
      showBanner("success", `Inbound reply classified as ${result?.classification?.classification || classification}.`);
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to classify inbound reply.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuppressLead = async (lead) => {
    setSubmitting(true);
    try {
      await createEmailSuppression({
        lead_id: lead.id,
        email: lead.email,
        reason: "manual_block",
        notes: "Added from Hot Leads / Email SDR workspace",
      });
      showBanner("success", `${lead.email || "Lead"} added to suppression.`);
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to suppress email.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAgentLimit = async (repId) => {
    const draft = agentLimitDrafts[repId];
    if (!draft) return;
    setSubmitting(true);
    try {
      await updateEmailAgentLimitToday(repId, {
        daily_limit: Number(draft.daily_limit || 0),
        paused: Boolean(draft.paused),
        warmup_stage: draft.warmup_stage || "",
      });
      showBanner("success", "Agent daily limit updated.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to update agent daily limit.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHotLeadAction = async (leadId, action) => {
    setSubmitting(true);
    try {
      if (action === "assign") {
        await assignEmailHotLeadToYousef(leadId);
        showBanner("success", "Hot lead assigned to Yousef.");
      } else if (action === "contacted") {
        await markEmailHotLeadContacted(leadId, {});
        showBanner("success", "Hot lead marked contacted.");
      } else if (action === "deal") {
        await createSalesDealFromEmailHotLead(leadId);
        showBanner("success", "Sales deal created from hot lead.");
      }
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Hot lead action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Email SDR</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Admin-approved email-first outreach on top of the existing Sales CRM. Low-volume sends only, with suppression, reply classification, follow-up generation, and a hot-lead handoff queue.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
            <Chip size="small" variant="outlined" label={`Campaigns: ${overview.campaigns_total || 0}`} />
            <Chip size="small" variant="outlined" label={`Drafts: ${overview.draft_messages || 0}`} />
            <Chip size="small" variant="outlined" label={`Approved: ${overview.approved_messages || 0}`} />
            <Chip size="small" variant="outlined" label={`Scheduled: ${overview.scheduled_messages || 0}`} />
            <Chip size="small" color="error" variant="outlined" label={`Cancelled: ${overview.cancelled_messages || 0}`} />
            <Chip size="small" variant="outlined" label={`Sent today: ${overview.sent_today || 0}`} />
            <Chip size="small" color="warning" variant="outlined" label={`Suppressed: ${overview.suppressed_total || 0}`} />
            <Chip size="small" color="success" variant="outlined" label={`Hot leads: ${overview.hot_leads || 0}`} />
            <Chip size="small" color="info" variant="outlined" label={`New replies: ${overview.new_reply_events || 0}`} />
            <Chip size="small" color="warning" variant="outlined" label={`Unmatched: ${overview.unmatched_events || 0}`} />
            <Chip size="small" color="error" variant="outlined" label={`Bounces/unsubs: ${overview.bounce_events || 0}`} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <Button variant="contained" onClick={handleRunDueSendNow} disabled={submitting}>
              Run due send now
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Saved Segments</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="Segment name" value={segmentForm.name} onChange={(e) => setSegmentForm((prev) => ({ ...prev, name: e.target.value }))} />
            <TextField fullWidth label="Business type" value={segmentForm.business_type} onChange={(e) => setSegmentForm((prev) => ({ ...prev, business_type: e.target.value }))} />
            <TextField fullWidth label="City" value={segmentForm.city} onChange={(e) => setSegmentForm((prev) => ({ ...prev, city: e.target.value }))} />
            <TextField fullWidth label="Source type" value={segmentForm.source_type} onChange={(e) => setSegmentForm((prev) => ({ ...prev, source_type: e.target.value }))} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="Consent basis" value={segmentForm.email_consent_basis} onChange={(e) => setSegmentForm((prev) => ({ ...prev, email_consent_basis: e.target.value }))} />
            <TextField
              select
              label="Public email listed"
              value={segmentForm.email_publicly_listed}
              onChange={(e) => setSegmentForm((prev) => ({ ...prev, email_publicly_listed: e.target.value }))}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </TextField>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption">Exclude DNC</Typography>
              <Switch checked={segmentForm.exclude_do_not_contact} onChange={(e) => setSegmentForm((prev) => ({ ...prev, exclude_do_not_contact: e.target.checked }))} />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption">Exclude suppressed</Typography>
              <Switch checked={segmentForm.exclude_suppressed} onChange={(e) => setSegmentForm((prev) => ({ ...prev, exclude_suppressed: e.target.checked }))} />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption">Only uncontacted</Typography>
              <Switch checked={segmentForm.only_uncontacted} onChange={(e) => setSegmentForm((prev) => ({ ...prev, only_uncontacted: e.target.checked }))} />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption">Only not replied</Typography>
              <Switch checked={segmentForm.only_not_replied} onChange={(e) => setSegmentForm((prev) => ({ ...prev, only_not_replied: e.target.checked }))} />
            </Stack>
            <Button variant="contained" onClick={handleCreateSegment} disabled={submitting || !segmentForm.name}>Save segment</Button>
          </Stack>
          {!segments.length ? (
            <Alert severity="info" variant="outlined">No saved segments yet.</Alert>
          ) : (
            <List disablePadding>
              {segments.map((segment) => {
                const draft = segmentDrafts[segment.id] || {};
                const preview = segmentPreviews[segment.id];
                return (
                  <React.Fragment key={segment.id}>
                    <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                      <Stack spacing={1} sx={{ width: "100%" }}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{segment.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {segment.business_type || "Any type"}{segment.city ? ` • ${segment.city}` : ""}{segment.source_type ? ` • ${segment.source_type}` : ""}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button size="small" variant="outlined" onClick={() => handlePreviewSegment(segment.id)} disabled={submitting}>Preview</Button>
                            <Button size="small" variant="outlined" onClick={() => handleSaveSegment(segment.id)} disabled={submitting}>Save</Button>
                          </Stack>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                          <TextField size="small" label="Name" value={draft.name || ""} onChange={(e) => setSegmentDrafts((prev) => ({ ...prev, [segment.id]: { ...draft, name: e.target.value } }))} />
                          <TextField size="small" label="Business type" value={draft.business_type || ""} onChange={(e) => setSegmentDrafts((prev) => ({ ...prev, [segment.id]: { ...draft, business_type: e.target.value } }))} />
                          <TextField size="small" label="City" value={draft.city || ""} onChange={(e) => setSegmentDrafts((prev) => ({ ...prev, [segment.id]: { ...draft, city: e.target.value } }))} />
                          <TextField size="small" label="Source type" value={draft.source_type || ""} onChange={(e) => setSegmentDrafts((prev) => ({ ...prev, [segment.id]: { ...draft, source_type: e.target.value } }))} />
                        </Stack>
                        {preview ? (
                          <Typography variant="caption" color="text.secondary">
                            Eligible: {preview.eligible_count || 0} • Blocked: {preview.blocked_count || 0}
                          </Typography>
                        ) : null}
                      </Stack>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Email Templates</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="Template name" value={templateForm.name} onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))} />
            <TextField select label="Category" value={templateForm.category} onChange={(e) => setTemplateForm((prev) => ({ ...prev, category: e.target.value }))} sx={{ minWidth: 180 }}>
              {["cold_initial", "follow_up_1", "follow_up_2", "demo_offer", "price_reply", "question_reply", "not_now_reply", "chatbot_followup"].map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="Business type" value={templateForm.business_type} onChange={(e) => setTemplateForm((prev) => ({ ...prev, business_type: e.target.value }))} />
            <TextField select label="Tone" value={templateForm.tone} onChange={(e) => setTemplateForm((prev) => ({ ...prev, tone: e.target.value }))} sx={{ minWidth: 160 }}>
              {["professional", "friendly", "direct", "premium"].map((tone) => (
                <MenuItem key={tone} value={tone}>{tone}</MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField fullWidth label="Subject" value={templateForm.subject} onChange={(e) => setTemplateForm((prev) => ({ ...prev, subject: e.target.value }))} />
          <TextField fullWidth multiline minRows={4} label="Body" value={templateForm.body} onChange={(e) => setTemplateForm((prev) => ({ ...prev, body: e.target.value }))} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption">Default</Typography>
            <Switch checked={templateForm.is_default} onChange={(e) => setTemplateForm((prev) => ({ ...prev, is_default: e.target.checked }))} />
            <Button variant="contained" onClick={handleCreateTemplate} disabled={submitting || !templateForm.name || !templateForm.subject || !templateForm.body}>
              Add template
            </Button>
          </Stack>
          {!templates.length ? (
            <Alert severity="info" variant="outlined">No templates available.</Alert>
          ) : (
            <List disablePadding>
              {templates.map((row) => {
                const draft = templateDrafts[row.id] || {};
                const preview = templatePreviews[row.id];
                return (
                  <React.Fragment key={row.id}>
                    <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                      <Stack spacing={1} sx={{ width: "100%" }}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {row.category} {row.business_type ? `• ${row.business_type}` : ""} • {row.status} {row.is_default ? "• default" : ""}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="outlined" onClick={() => handlePreviewTemplate(row.id)} disabled={submitting}>Preview</Button>
                            <Button size="small" variant="outlined" onClick={() => handleSaveTemplate(row.id)} disabled={submitting}>Save</Button>
                            <Button size="small" variant="outlined" onClick={() => handleArchiveTemplate(row.id)} disabled={submitting || row.status === "archived"}>Archive</Button>
                          </Stack>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                          <TextField size="small" label="Name" value={draft.name || ""} onChange={(e) => setTemplateDrafts((prev) => ({ ...prev, [row.id]: { ...draft, name: e.target.value } }))} />
                          <TextField size="small" label="Subject" value={draft.subject || ""} onChange={(e) => setTemplateDrafts((prev) => ({ ...prev, [row.id]: { ...draft, subject: e.target.value } }))} sx={{ flex: 1 }} />
                        </Stack>
                        {preview ? (
                          <Paper variant="outlined" sx={{ p: 1.25 }}>
                            <Typography variant="caption" color="text.secondary">{preview.subject}</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>{preview.body}</Typography>
                          </Paper>
                        ) : null}
                      </Stack>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Email SDR Analytics</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" variant="outlined" label={`Sent: ${analytics?.totals?.sent || 0}`} />
            <Chip size="small" variant="outlined" label={`Replies: ${analytics?.totals?.replied || 0}`} />
            <Chip size="small" color="success" variant="outlined" label={`Positive: ${analytics?.totals?.positive_replies || 0}`} />
            <Chip size="small" color="warning" variant="outlined" label={`Unsubs: ${analytics?.totals?.unsubscribed || 0}`} />
            <Chip size="small" color="error" variant="outlined" label={`Bounces: ${analytics?.totals?.bounced || 0}`} />
            <Chip size="small" variant="outlined" label={`Reply rate: ${analytics?.totals?.reply_rate || 0}%`} />
            <Chip size="small" variant="outlined" label={`Positive reply rate: ${analytics?.totals?.positive_reply_rate || 0}%`} />
          </Stack>
          {(analytics?.warnings || []).length ? (
            <Stack spacing={1}>
              {(analytics.warnings || []).map((warning) => (
                <Alert key={warning.code} severity={warning.level === "warning" ? "warning" : "info"} variant="outlined">
                  {warning.message}
                </Alert>
              ))}
            </Stack>
          ) : (
            <Alert severity="success" variant="outlined">No global Email SDR warning thresholds are currently triggered.</Alert>
          )}
          <Typography variant="caption" color="text.secondary">
            Last 7 days: {analytics?.last_7_days?.sent || 0} sent / {analytics?.last_7_days?.replied || 0} replies. Last 30 days: {analytics?.last_30_days?.sent || 0} sent / {analytics?.last_30_days?.replied || 0} replies.
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Safety Warnings</Typography>
          {(analytics?.warnings || []).length ? (
            <Stack spacing={1}>
              {(analytics.warnings || []).map((warning) => (
                <Alert key={`global-warning-${warning.code}`} severity="warning" variant="outlined">
                  {warning.message}
                </Alert>
              ))}
            </Stack>
          ) : (
            <Alert severity="success" variant="outlined">No global Email SDR warning thresholds are currently triggered.</Alert>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Campaign Quick Start</Typography>
          <Typography variant="body2" color="text.secondary">
            Create a campaign, attach segment/provider/templates, and generate the first ready state without sending.
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="Campaign name" value={quickStartForm.name} onChange={(e) => setQuickStartForm((prev) => ({ ...prev, name: e.target.value }))} />
            <TextField fullWidth label="Business type" value={quickStartForm.business_type} onChange={(e) => setQuickStartForm((prev) => ({ ...prev, business_type: e.target.value }))} />
            <TextField fullWidth label="City" value={quickStartForm.city} onChange={(e) => setQuickStartForm((prev) => ({ ...prev, city: e.target.value }))} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Provider"
              value={quickStartForm.provider_connection_id}
              onChange={(e) => setQuickStartForm((prev) => ({ ...prev, provider_connection_id: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Fallback mail helper</MenuItem>
              {providerConnections.map((row) => (
                <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Initial template"
              value={quickStartForm.initial_template_id}
              onChange={(e) => setQuickStartForm((prev) => ({ ...prev, initial_template_id: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Default</MenuItem>
              {templates.filter((row) => row.category === "cold_initial").map((row) => (
                <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Follow-up 1"
              value={quickStartForm.follow_up_1_template_id}
              onChange={(e) => setQuickStartForm((prev) => ({ ...prev, follow_up_1_template_id: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Default</MenuItem>
              {templates.filter((row) => row.category === "follow_up_1").map((row) => (
                <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Final follow-up"
              value={quickStartForm.follow_up_2_template_id}
              onChange={(e) => setQuickStartForm((prev) => ({ ...prev, follow_up_2_template_id: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Default</MenuItem>
              {templates.filter((row) => row.category === "follow_up_2").map((row) => (
                <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Segment"
              value={quickStartForm.segment_id}
              onChange={(e) => setQuickStartForm((prev) => ({ ...prev, segment_id: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">None</MenuItem>
              {segments.map((row) => (
                <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={handleQuickStartCampaign} disabled={submitting || !quickStartForm.name}>
              Quick start
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Provider Connections</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Provider"
              value={providerForm.provider}
              onChange={(e) => setProviderForm((prev) => ({ ...prev, provider: e.target.value }))}
              sx={{ minWidth: 180 }}
            >
              {["smtp", "sendgrid", "mailgun", "postmark", "resend", "gmail_manual", "custom"].map((provider) => (
                <MenuItem key={provider} value={provider}>{provider}</MenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="Connection name" value={providerForm.name} onChange={(e) => setProviderForm((prev) => ({ ...prev, name: e.target.value }))} />
            <TextField fullWidth label="From email" value={providerForm.from_email} onChange={(e) => setProviderForm((prev) => ({ ...prev, from_email: e.target.value }))} />
            <TextField fullWidth label="From name" value={providerForm.from_name} onChange={(e) => setProviderForm((prev) => ({ ...prev, from_name: e.target.value }))} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="Reply-To email" value={providerForm.reply_to_email} onChange={(e) => setProviderForm((prev) => ({ ...prev, reply_to_email: e.target.value }))} />
            <TextField label="Daily limit" type="number" value={providerForm.daily_limit} onChange={(e) => setProviderForm((prev) => ({ ...prev, daily_limit: e.target.value }))} sx={{ minWidth: 140 }} />
            <TextField label="Warmup stage" value={providerForm.warmup_stage} onChange={(e) => setProviderForm((prev) => ({ ...prev, warmup_stage: e.target.value }))} sx={{ minWidth: 180 }} />
            <Button variant="contained" onClick={handleCreateProviderConnection} disabled={submitting || !providerForm.name || !providerForm.from_email}>
              Add provider
            </Button>
          </Stack>
          {!providerConnections.length ? (
            <Alert severity="info" variant="outlined">No provider connections yet. Campaigns will use the fallback mail helper until a provider is selected.</Alert>
          ) : (
            <List disablePadding>
              {providerConnections.map((row) => {
                const draft = providerDrafts[row.id] || {};
                return (
                  <React.Fragment key={row.id}>
                    <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                      <Stack spacing={1} sx={{ width: "100%" }}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {row.provider} • {row.from_email} • Status: {row.status}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip size="small" variant="outlined" label={`Daily limit: ${row.daily_limit}`} />
                            <Chip size="small" color={row.webhook_setup?.webhook_secret_configured ? "success" : "warning"} variant="outlined" label={row.webhook_setup?.webhook_secret_configured ? "Webhook secret ready" : "Webhook secret missing"} />
                          </Stack>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                          <TextField size="small" label="Name" value={draft.name || ""} onChange={(e) => setProviderDrafts((prev) => ({ ...prev, [row.id]: { ...draft, name: e.target.value } }))} />
                          <TextField size="small" label="From email" value={draft.from_email || ""} onChange={(e) => setProviderDrafts((prev) => ({ ...prev, [row.id]: { ...draft, from_email: e.target.value } }))} />
                          <TextField size="small" label="Reply-To" value={draft.reply_to_email || ""} onChange={(e) => setProviderDrafts((prev) => ({ ...prev, [row.id]: { ...draft, reply_to_email: e.target.value } }))} />
                          <TextField size="small" label="Daily limit" type="number" value={draft.daily_limit || ""} onChange={(e) => setProviderDrafts((prev) => ({ ...prev, [row.id]: { ...draft, daily_limit: e.target.value } }))} sx={{ width: 120 }} />
                          <Button size="small" variant="outlined" onClick={() => handleSaveProviderConnection(row.id)} disabled={submitting}>Save</Button>
                          <Button size="small" variant="outlined" onClick={() => handleProviderAction(row.id, "test")} disabled={submitting}>Test send</Button>
                          <Button size="small" variant="outlined" onClick={() => handleProviderAction(row.id, row.status === "active" ? "pause" : "activate")} disabled={submitting}>
                            {row.status === "active" ? "Pause" : "Activate"}
                          </Button>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Webhook: {row.webhook_setup?.webhook_url} • Header: {row.webhook_setup?.required_header_name}
                        </Typography>
                      </Stack>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Email Agents</Typography>
          <Typography variant="body2" color="text.secondary">
            AI Email Agents are separate from AI calling reps. They control mailbox identity, warmup, and send windows.
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Sales rep"
              value={agentForm.sales_rep_id}
              onChange={(e) => setAgentForm((prev) => ({ ...prev, sales_rep_id: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Select rep</MenuItem>
              {reps.filter((rep) => rep.is_ai_agent && rep.is_active).map((rep) => (
                <MenuItem key={rep.id} value={rep.id}>{rep.full_name}</MenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="Display name" value={agentForm.display_name} onChange={(e) => setAgentForm((prev) => ({ ...prev, display_name: e.target.value }))} />
            <TextField fullWidth label="From email" value={agentForm.from_email} onChange={(e) => setAgentForm((prev) => ({ ...prev, from_email: e.target.value }))} />
            <TextField fullWidth label="Reply-To email" value={agentForm.reply_to_email} onChange={(e) => setAgentForm((prev) => ({ ...prev, reply_to_email: e.target.value }))} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Role"
              value={agentForm.role_type}
              onChange={(e) => setAgentForm((prev) => ({ ...prev, role_type: e.target.value }))}
              sx={{ minWidth: 180 }}
            >
              {["hvac", "cleaning", "plumbing", "roofing", "general", "custom"].map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Provider"
              value={agentForm.provider_connection_id}
              onChange={(e) => setAgentForm((prev) => ({ ...prev, provider_connection_id: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">None</MenuItem>
              {providerConnections.map((row) => (
                <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Daily limit" type="number" value={agentForm.daily_limit} onChange={(e) => setAgentForm((prev) => ({ ...prev, daily_limit: e.target.value }))} sx={{ minWidth: 120 }} />
            <TextField label="Timezone" value={agentForm.timezone} onChange={(e) => setAgentForm((prev) => ({ ...prev, timezone: e.target.value }))} sx={{ minWidth: 180 }} />
            <TextField label="Window start" type="time" value={agentForm.send_window_start} onChange={(e) => setAgentForm((prev) => ({ ...prev, send_window_start: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
            <TextField label="Window end" type="time" value={agentForm.send_window_end} onChange={(e) => setAgentForm((prev) => ({ ...prev, send_window_end: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
            <Button variant="contained" onClick={handleCreateEmailAgent} disabled={submitting || !agentForm.sales_rep_id || !agentForm.from_email}>
              Add agent
            </Button>
          </Stack>
          {!emailAgents.length ? (
            <Alert severity="info" variant="outlined">No Email Agents configured yet.</Alert>
          ) : (
            <List disablePadding>
              {emailAgents.map((row) => {
                const draft = agentDrafts[row.id] || {};
                return (
                  <React.Fragment key={row.id}>
                    <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                      <Stack spacing={1} sx={{ width: "100%" }}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.display_name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {row.sales_rep_name} • {row.role_type} • {row.from_email} • Status: {row.status}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="outlined" onClick={() => handleSaveEmailAgent(row.id)} disabled={submitting}>Save</Button>
                            <Button size="small" variant="outlined" onClick={() => handleEmailAgentAction(row.id, row.status === "active" ? "pause" : "activate")} disabled={submitting}>
                              {row.status === "active" ? "Pause" : "Activate"}
                            </Button>
                          </Stack>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                          <TextField size="small" label="Display" value={draft.display_name || ""} onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, display_name: e.target.value } }))} />
                          <TextField size="small" label="From email" value={draft.from_email || ""} onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, from_email: e.target.value } }))} />
                          <TextField size="small" label="Reply-To" value={draft.reply_to_email || ""} onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, reply_to_email: e.target.value } }))} />
                          <TextField size="small" label="Daily limit" type="number" value={draft.daily_limit || ""} onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, daily_limit: e.target.value } }))} sx={{ width: 120 }} />
                        </Stack>
                      </Stack>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Operations Checklist</Typography>
          <Typography variant="body2" color="text.secondary">
            Production readiness for Email SDR Phase 2/3 before enabling scheduled sends and provider webhooks.
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label="Run DB migration: flask db upgrade heads"
            />
            <Chip
              size="small"
              color={overview.webhook_secret_configured ? "success" : "warning"}
              variant="outlined"
              label={overview.webhook_secret_configured ? "Webhook secret configured" : "Webhook secret missing"}
            />
            <Chip
              size="small"
              color={overview.campaigns_with_send_window ? "success" : "warning"}
              variant="outlined"
              label={overview.campaigns_with_send_window ? "Send window configured" : "Set campaign send window"}
            />
            <Chip
              size="small"
              color={agentLimits.length ? "success" : "warning"}
              variant="outlined"
              label={agentLimits.length ? "Daily limits configured" : "Configure daily limits"}
            />
            <Chip
              size="small"
              color={overview.unsubscribe_enabled_messages ? "success" : "warning"}
              variant="outlined"
              label={overview.unsubscribe_enabled_messages ? "Unsubscribe links active" : "Send a test message to verify unsubscribe"}
            />
            <Chip
              size="small"
              color="info"
              variant="outlined"
              label="Webhook endpoints ready /integrations/email-sdr/*"
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Create Email Campaign</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Campaign name"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Business type"
              value={campaignForm.business_type}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, business_type: e.target.value }))}
              placeholder="HVAC, Cleaning, Plumbing"
            />
            <TextField
              fullWidth
              label="City"
              value={campaignForm.city}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="Toronto"
            />
            <TextField
              label="Daily limit / agent"
              type="number"
              value={campaignForm.daily_limit_per_agent}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, daily_limit_per_agent: e.target.value }))}
              sx={{ minWidth: 180 }}
            />
            <TextField
              select
              label="Provider connection"
              value={campaignForm.provider_connection_id}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, provider_connection_id: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Fallback mail helper</MenuItem>
              {providerConnections.map((row) => (
                <MenuItem key={row.id} value={row.id}>{row.name} ({row.provider})</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={handleCreateCampaign} disabled={submitting || !campaignForm.name}>
              Create
            </Button>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Send window start"
              type="time"
              value={campaignForm.send_window_start}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, send_window_start: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <TextField
              label="Send window end"
              type="time"
              value={campaignForm.send_window_end}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, send_window_end: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <TextField
              fullWidth
              label="Timezone"
              value={campaignForm.timezone}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, timezone: e.target.value }))}
              placeholder="America/Toronto"
            />
            <TextField
              select
              label="Follow-up mode"
              value={campaignForm.follow_up_mode}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, follow_up_mode: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="manual">Manual approval only</MenuItem>
            </TextField>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Active AI email agents available: {aiEmailAgents.length ? aiEmailAgents.map((row) => row.full_name).join(", ") : "none"}
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Campaign Queue</Typography>
          {!campaigns.length ? (
            <Alert severity="info" variant="outlined">No email campaigns yet.</Alert>
          ) : (
            <List disablePadding>
              {campaigns.map((campaign) => {
                const preview = campaignPreviews[campaign.id];
                const analyticsRow = campaignAnalytics[campaign.id];
                return (
                  <React.Fragment key={campaign.id}>
                    <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                      <Stack spacing={1.25} sx={{ width: "100%" }}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{campaign.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {campaign.business_type || "Any business type"}{campaign.city ? ` • ${campaign.city}` : ""} • Status: {campaign.status}
                              {campaign.send_window_start && campaign.send_window_end ? ` • Window: ${campaign.send_window_start}-${campaign.send_window_end}` : ""}
                              {campaign.timezone ? ` • ${campaign.timezone}` : ""}
                              {campaign.provider_connection_name ? ` • Provider: ${campaign.provider_connection_name}` : " • Provider: fallback"}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip size="small" variant="outlined" label={`Drafts: ${campaign.message_counts?.draft || 0}`} />
                            <Chip size="small" variant="outlined" label={`Approved: ${campaign.message_counts?.approved || 0}`} />
                            <Chip size="small" variant="outlined" label={`Sent: ${campaign.message_counts?.sent || 0}`} />
                            <Chip size="small" variant="outlined" label={`Agents: ${(campaign.email_agent_ids || []).length || "auto"}`} />
                          </Stack>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleCampaignAction(campaign.id, "preview")}>
                            Preview targets
                          </Button>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handlePrepareCampaign(campaign.id)}>
                            Prepare
                          </Button>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleCampaignAction(campaign.id, "drafts")}>
                            Generate drafts
                          </Button>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleLoadCampaignAnalytics(campaign.id)}>
                            Analytics
                          </Button>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleCampaignAction(campaign.id, "followups")}>
                            Generate due follow-ups
                          </Button>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleCampaignAction(campaign.id, "approve")}>
                            Approve drafts
                          </Button>
                          <Button variant="contained" size="small" disabled={submitting} onClick={() => handleCampaignAction(campaign.id, "send")}>
                            Run due send now
                          </Button>
                          <Button variant="text" size="small" disabled={submitting} onClick={() => handleCampaignAction(campaign.id, "pause")}>
                            Pause
                          </Button>
                          <Button
                            variant="text"
                            size="small"
                            disabled={submitting}
                            onClick={() =>
                              handleSaveCampaignAutomation(campaign.id, {
                                auto_approve_drafts: !campaign.auto_approve_drafts,
                                auto_send_approved: campaign.auto_send_approved,
                                follow_up_mode: campaign.follow_up_mode,
                                max_sequence_steps: campaign.max_sequence_steps,
                              })
                            }
                          >
                            {campaign.auto_approve_drafts ? "Auto-approve on" : "Auto-approve off"}
                          </Button>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
                          <TextField
                            select
                            size="small"
                            label="Apply segment"
                            value={campaignSegmentSelections[campaign.id] || campaign.segment_id || ""}
                            onChange={(e) => setCampaignSegmentSelections((prev) => ({ ...prev, [campaign.id]: e.target.value }))}
                            sx={{ minWidth: 220 }}
                          >
                            <MenuItem value="">None</MenuItem>
                            {segments.map((segment) => (
                              <MenuItem key={segment.id} value={segment.id}>{segment.name}</MenuItem>
                            ))}
                          </TextField>
                          <Button
                            variant="outlined"
                            size="small"
                            disabled={submitting || !Number(campaignSegmentSelections[campaign.id] || campaign.segment_id || 0)}
                            onClick={() => handleApplySegmentToCampaign(campaign.id, Number(campaignSegmentSelections[campaign.id] || campaign.segment_id))}
                          >
                            Apply segment
                          </Button>
                        </Stack>
                        {preview ? (
                          <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: "grey.50" }}>
                            <Stack spacing={1}>
                              <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
                                <Chip size="small" variant="outlined" label={`Eligible: ${preview.eligible_count || 0}`} />
                                <Chip size="small" color="warning" variant="outlined" label={`Blocked: ${preview.blocked_count || 0}`} />
                                {Object.entries(preview.blocked_reason_counts || {}).map(([reason, count]) => (
                                  <Chip key={reason} size="small" variant="outlined" label={`${reason}: ${count}`} />
                                ))}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                Sample eligible leads: {(preview.eligible_sample || []).slice(0, 3).map((row) => row.company_name).join(", ") || "none"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Sample blocked leads: {(preview.blocked_sample || []).slice(0, 3).map((row) => `${row.company_name} (${row.reason})`).join(", ") || "none"}
                              </Typography>
                            </Stack>
                          </Paper>
                        ) : null}
                        {analyticsRow ? (
                          <Paper variant="outlined" sx={{ p: 1.5 }}>
                            <Stack spacing={1}>
                              <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
                                <Chip size="small" variant="outlined" label={`Sent: ${analyticsRow.sent || 0}`} />
                                <Chip size="small" variant="outlined" label={`Replies: ${analyticsRow.replied || 0}`} />
                                <Chip size="small" color="success" variant="outlined" label={`Positive: ${analyticsRow.positive_replies || 0}`} />
                                <Chip size="small" color="warning" variant="outlined" label={`Unsubs: ${analyticsRow.unsubscribed || 0}`} />
                                <Chip size="small" color="error" variant="outlined" label={`Bounces: ${analyticsRow.bounced || 0}`} />
                                <Chip size="small" variant="outlined" label={`Reply rate: ${analyticsRow.reply_rate || 0}%`} />
                              </Stack>
                              {(analyticsRow.warnings || []).length ? (
                                (analyticsRow.warnings || []).map((warning) => (
                                  <Alert key={`${campaign.id}-${warning.code}`} severity="warning" variant="outlined">
                                    {warning.message}
                                  </Alert>
                                ))
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  No campaign warning thresholds are currently triggered.
                                </Typography>
                              )}
                            </Stack>
                          </Paper>
                        ) : null}
                      </Stack>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>AI Email Agent Limits</Typography>
          {!agentLimits.length ? (
            <Alert severity="info" variant="outlined">No AI email agents configured.</Alert>
          ) : (
            <List disablePadding>
              {agentLimits.map((row) => {
                const draft = agentLimitDrafts[row.sales_rep_id] || {
                  daily_limit: row.daily_limit,
                  paused: Boolean(row.paused),
                  warmup_stage: row.warmup_stage || "",
                };
                return (
                  <React.Fragment key={row.sales_rep_id}>
                    <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                      <Stack spacing={1} sx={{ width: "100%" }}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.sales_rep_name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {row.sales_rep_email} • Sent today: {row.sent_count} • Replies: {row.reply_count} • Bounces: {row.bounce_count}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                              size="small"
                              type="number"
                              label="Daily limit"
                              value={draft.daily_limit}
                              onChange={(e) => setAgentLimitDrafts((prev) => ({ ...prev, [row.sales_rep_id]: { ...draft, daily_limit: e.target.value } }))}
                              sx={{ width: 120 }}
                            />
                            <TextField
                              size="small"
                              label="Warmup stage"
                              value={draft.warmup_stage}
                              onChange={(e) => setAgentLimitDrafts((prev) => ({ ...prev, [row.sales_rep_id]: { ...draft, warmup_stage: e.target.value } }))}
                              sx={{ width: 140 }}
                            />
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Typography variant="caption">Paused</Typography>
                              <Switch
                                checked={Boolean(draft.paused)}
                                onChange={(e) => setAgentLimitDrafts((prev) => ({ ...prev, [row.sales_rep_id]: { ...draft, paused: e.target.checked } }))}
                              />
                            </Stack>
                            <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleSaveAgentLimit(row.sales_rep_id)}>
                              Save
                            </Button>
                          </Stack>
                        </Stack>
                      </Stack>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Email Messages</Typography>
          {!messages.length ? (
            <Alert severity="info" variant="outlined">No email messages yet.</Alert>
          ) : (
            <List disablePadding>
              {messages.slice(0, 16).map((message) => {
                const draft = messageDraftState[message.id] || {
                  subject: message.subject,
                  body: message.body,
                  scheduled_for: message.scheduled_for || "",
                  status: message.status,
                };
                const editable = editableStatuses.has(message.status);
                return (
                  <React.Fragment key={message.id}>
                    <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                      <Stack spacing={1.25} sx={{ width: "100%" }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {message.lead?.company_name || "Unknown company"} • {message.lead?.email || "No email"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {message.email_agent_name || "No agent"} • step {message.sequence_step} • {message.status}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
                            <Chip
                              size="small"
                              color={message.unsubscribe_enabled ? "success" : "default"}
                              variant="outlined"
                              label={message.unsubscribe_enabled ? "Unsubscribe enabled" : "Unsubscribe pending"}
                            />
                            {message.error_code ? (
                              <Chip size="small" color="warning" variant="outlined" label={`Reason: ${message.error_code}`} />
                            ) : null}
                            {message.unsubscribe_used_at ? (
                              <Chip size="small" color="error" variant="outlined" label="Lead unsubscribed" />
                            ) : null}
                          </Stack>
                        </Box>
                        <TextField
                          size="small"
                          fullWidth
                          label="Subject"
                          value={draft.subject}
                          disabled={!editable}
                          onChange={(e) => setMessageDraftState((prev) => ({ ...prev, [message.id]: { ...draft, subject: e.target.value } }))}
                        />
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          minRows={4}
                          label="Body"
                          value={draft.body}
                          disabled={!editable}
                          onChange={(e) => setMessageDraftState((prev) => ({ ...prev, [message.id]: { ...draft, body: e.target.value } }))}
                        />
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                          <TextField
                            size="small"
                            type="datetime-local"
                            label="Scheduled"
                            value={draft.scheduled_for ? String(draft.scheduled_for).replace("Z", "").slice(0, 16) : ""}
                            disabled={!editable}
                            onChange={(e) => setMessageDraftState((prev) => ({ ...prev, [message.id]: { ...draft, scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : "" } }))}
                            InputLabelProps={{ shrink: true }}
                          />
                          <TextField
                            select
                            size="small"
                            label="Status"
                            value={draft.status}
                            disabled={!editable}
                            onChange={(e) => setMessageDraftState((prev) => ({ ...prev, [message.id]: { ...draft, status: e.target.value } }))}
                            sx={{ minWidth: 160 }}
                          >
                            <MenuItem value="draft">draft</MenuItem>
                            <MenuItem value="approved">approved</MenuItem>
                            <MenuItem value="scheduled">scheduled</MenuItem>
                          </TextField>
                          <Button variant="outlined" size="small" disabled={submitting || !editable} onClick={() => handleSaveDraftMessage(message.id)}>
                            Save draft
                          </Button>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                          <TextField
                            select
                            size="small"
                            label="Reply class"
                            value={messageReplyClass[message.id] || ""}
                            onChange={(e) => setMessageReplyClass((prev) => ({ ...prev, [message.id]: e.target.value }))}
                            sx={{ minWidth: 220 }}
                          >
                            <MenuItem value="">Select</MenuItem>
                            {classificationOptions.map((option) => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            size="small"
                            fullWidth
                            label="Reply text / note"
                            value={messageReplyText[message.id] || ""}
                            onChange={(e) => setMessageReplyText((prev) => ({ ...prev, [message.id]: e.target.value }))}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            disabled={submitting || !messageReplyClass[message.id]}
                            onClick={() => handleClassifyReply(message.id)}
                          >
                            Classify
                          </Button>
                        </Stack>
                      </Stack>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>New Replies Review Queue</Typography>
          {!newReplyEvents.length ? (
            <Alert severity="info" variant="outlined">No new reply events waiting for review.</Alert>
          ) : (
            <List disablePadding>
              {newReplyEvents.map((event) => (
                <React.Fragment key={event.id}>
                  <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                    <Stack spacing={1.25} sx={{ width: "100%" }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {event.matched_lead?.company_name || event.from_email || "Inbound reply"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {event.from_email || "Unknown sender"} • {event.subject || "No subject"} • match: {event.raw_payload?.match_reason || "unknown"}
                        </Typography>
                      </Box>
                      <TextField size="small" fullWidth multiline minRows={3} label="Inbound reply" value={event.body_text || ""} disabled />
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                        <TextField
                          select
                          size="small"
                          label="Classification"
                          value={inboundReplyClass[event.id] || ""}
                          onChange={(e) => setInboundReplyClass((prev) => ({ ...prev, [event.id]: e.target.value }))}
                          sx={{ minWidth: 220 }}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {classificationOptions.map((option) => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          size="small"
                          fullWidth
                          label="Admin note / override reply text"
                          value={inboundReplyText[event.id] || ""}
                          onChange={(e) => setInboundReplyText((prev) => ({ ...prev, [event.id]: e.target.value }))}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={submitting || !event.matched_message_id || !inboundReplyClass[event.id]}
                          onClick={() => handleClassifyInboundReply(event.id)}
                        >
                          Classify inbound reply
                        </Button>
                      </Stack>
                    </Stack>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Unmatched Inbound Events</Typography>
          {!unmatchedEvents.length ? (
            <Alert severity="info" variant="outlined">No unmatched inbound events.</Alert>
          ) : (
            <List disablePadding>
              {unmatchedEvents.map((event) => (
                <React.Fragment key={event.id}>
                  <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                    <ListItemText
                      primary={`${event.event_type} • ${event.from_email || "Unknown sender"} • ${event.subject || "No subject"}`}
                      secondary={`${event.raw_payload?.match_reason || "unmatched"}${event.body_text ? ` • ${event.body_text.slice(0, 180)}` : ""}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Bounces & Unsubscribes</Typography>
          {!bounceEvents.length ? (
            <Alert severity="info" variant="outlined">No bounce or unsubscribe events recorded.</Alert>
          ) : (
            <List disablePadding>
              {bounceEvents.map((event) => (
                <React.Fragment key={event.id}>
                  <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                    <ListItemText
                      primary={`${event.event_type} • ${event.matched_lead?.company_name || event.from_email || "Unknown sender"}`}
                      secondary={`${event.from_email || "Unknown sender"}${event.matched_message ? ` • message ${event.matched_message.id}` : ""}${event.processed_at ? ` • processed ${event.processed_at}` : ""}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Hot Leads Queue</Typography>
          {!hotLeads.length ? (
            <Alert severity="info" variant="outlined">No hot leads yet. Positive replies will surface here for Yousef/manual follow-up.</Alert>
          ) : (
            <List disablePadding>
              {hotLeads.map((lead) => (
                <React.Fragment key={lead.id}>
                  <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ width: "100%" }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {lead.company_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lead.contact_name || "No contact"} • {lead.email || "No email"} • {lead.reply_status || lead.email_outreach_status}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button variant="outlined" size="small" onClick={() => onOpenLead?.(lead.id)}>
                          Open lead
                        </Button>
                        <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleHotLeadAction(lead.id, "assign")}>
                          Assign to Yousef
                        </Button>
                        <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleHotLeadAction(lead.id, "contacted")}>
                          Mark contacted
                        </Button>
                        <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleHotLeadAction(lead.id, "deal")}>
                          Create deal
                        </Button>
                        <Button variant="text" size="small" disabled={submitting || !lead.email} onClick={() => handleSuppressLead(lead)}>
                          Suppress
                        </Button>
                      </Stack>
                    </Stack>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Suppression List</Typography>
          {!suppression.length ? (
            <Alert severity="info" variant="outlined">No suppressed emails yet.</Alert>
          ) : (
            <List dense disablePadding>
              {suppression.slice(0, 10).map((row) => (
                <ListItem key={row.id} disableGutters sx={{ py: 0.75 }}>
                  <ListItemText
                    primary={row.email_normalized}
                    secondary={`${row.reason} • ${row.source}${row.created_at ? ` • ${row.created_at}` : ""}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </Paper>

      {loading ? (
        <Alert severity="info" variant="outlined">Loading Email SDR workspace…</Alert>
      ) : null}
    </Stack>
  );
}
