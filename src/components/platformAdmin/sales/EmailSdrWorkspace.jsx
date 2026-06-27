import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
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
  getEmailSdrOpsSummary,
  generateEmailCampaignDrafts,
  generateEmailCampaignFollowUps,
  getEmailSdrOverview,
  listEmailAgents,
  listEmailProviderConnections,
  listEmailTemplatePacks,
  listEmailSegments,
  listMarketingChatbotLeads,
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
  previewEmailTargets,
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
const launchWizardSteps = [
  "Choose Provider",
  "Choose Email Agent",
  "Choose Template Pack / Templates",
  "Choose Segment",
  "Preview",
  "Generate Drafts",
  "Approve",
  "Send",
];
const wizardSampleLead = {
  name: "John Rivera",
  business_name: "ABC HVAC",
  business_type: "HVAC",
  city: "Toronto",
  email: "john@abchvac.ca",
};

function metricCard(title, value, caption, color = "primary.main") {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, minWidth: 150, flex: 1 }}>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color, lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{caption}</Typography>
    </Paper>
  );
}

function TinySeriesChart({ title, rows = [], metric = "sent", color = "#2563eb" }) {
  const max = Math.max(1, ...rows.map((row) => Number(row?.[metric] || 0)));
  return (
    <Paper variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 220 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
      {!rows.length ? (
        <Typography variant="caption" color="text.secondary">No activity yet.</Typography>
      ) : (
        <Stack direction="row" spacing={0.75} alignItems="flex-end" sx={{ mt: 1.5, minHeight: 96 }}>
          {rows.slice(-10).map((row) => (
            <Stack key={`${title}-${row.date}`} spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
              <Box
                sx={{
                  width: "100%",
                  borderRadius: 1,
                  bgcolor: color,
                  opacity: 0.9,
                  minHeight: 6,
                  height: `${Math.max(6, Math.round((Number(row?.[metric] || 0) / max) * 72))}px`,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {String(row.date || "").slice(5)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function EmailSdrWorkspace({ reps = [], onOpenLead, showBanner }) {
  const [overview, setOverview] = useState({});
  const [opsSummary, setOpsSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [messages, setMessages] = useState([]);
  const [emailAgents, setEmailAgents] = useState([]);
  const [providerConnections, setProviderConnections] = useState([]);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templatePacks, setTemplatePacks] = useState([]);
  const [marketingWidgetLeads, setMarketingWidgetLeads] = useState([]);
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
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardState, setWizardState] = useState({
    provider_connection_id: "",
    email_agent_id: "",
    business_type: "HVAC",
    initial_template_id: "",
    follow_up_1_template_id: "",
    follow_up_2_template_id: "",
    segment_id: "",
    campaign_name: "",
    city: "Toronto",
    source_type: "",
    email_consent_basis: "",
    email_publicly_listed: "",
    exclude_do_not_contact: true,
    exclude_suppressed: true,
    only_uncontacted: true,
    only_not_replied: true,
  });
  const [wizardPreview, setWizardPreview] = useState(null);
  const [wizardResult, setWizardResult] = useState(null);
  const [marketingConsentOnly, setMarketingConsentOnly] = useState(true);
  const providerSectionRef = useRef(null);
  const agentSectionRef = useRef(null);
  const templateSectionRef = useRef(null);

  const aiEmailAgents = useMemo(
    () => reps.filter((rep) => rep.is_ai_agent && rep.is_active && !rep.ai_sdr_paused),
    [reps]
  );

  const wizardTemplateOptions = useMemo(() => {
    const businessType = (wizardState.business_type || "").toLowerCase();
    return templates.filter((row) => {
      const rowType = (row.business_type || "").toLowerCase();
      return !row.business_type || rowType === businessType;
    });
  }, [templates, wizardState.business_type]);

  const visibleMarketingWidgetLeads = useMemo(
    () => marketingWidgetLeads.filter((row) => (marketingConsentOnly ? row.consent_to_contact : true)),
    [marketingWidgetLeads, marketingConsentOnly]
  );

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [
        overviewResp,
        opsSummaryResp,
        analyticsResp,
        campaignRows,
        emailAgentResp,
        providerRows,
        segmentRows,
        templateRows,
        templatePackRows,
        marketingLeadRows,
        messageRows,
        hotRows,
        suppressionRows,
        agentLimitRows,
        inboundReplyRows,
        unmatchedRows,
        bounceRows,
      ] = await Promise.all([
        getEmailSdrOverview(),
        getEmailSdrOpsSummary(),
        getEmailSdrAnalytics(),
        listEmailCampaigns(),
        listEmailAgents(),
        listEmailProviderConnections(),
        listEmailSegments(),
        listEmailTemplates(),
        listEmailTemplatePacks(),
        listMarketingChatbotLeads({ consent_only: false }),
        listEmailMessages(),
        listEmailHotLeads(),
        listEmailSuppression(),
        listEmailAgentLimitsToday(),
        listEmailInboundEvents({ queue: "new_replies", limit: 50 }),
        listEmailInboundEvents({ queue: "unmatched", limit: 50 }),
        listEmailInboundEvents({ queue: "bounces", limit: 50 }),
      ]);
      setOverview(overviewResp || {});
      setOpsSummary(opsSummaryResp || null);
      setAnalytics(analyticsResp || null);
      setCampaigns(campaignRows || []);
      setEmailAgents(emailAgentResp?.agents || []);
      setProviderConnections(providerRows || []);
      setSegments(segmentRows || []);
      setTemplates(templateRows || []);
      setTemplatePacks(templatePackRows || []);
      setMarketingWidgetLeads(marketingLeadRows || []);
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
      const result = await previewEmailTemplate(templateId, { sample_lead: wizardSampleLead });
      setTemplatePreviews((prev) => ({ ...prev, [templateId]: result.preview }));
      showBanner("info", "Template preview loaded.");
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to preview email template.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadTemplatePreviewSilently = useCallback(async (templateId) => {
    if (!templateId) return;
    try {
      const result = await previewEmailTemplate(Number(templateId), { sample_lead: wizardSampleLead });
      setTemplatePreviews((prev) => ({ ...prev, [templateId]: result.preview }));
    } catch {
      // Keep wizard flow usable even if preview fetch fails.
    }
  }, []);

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

  const openWizard = () => {
    const defaultPack = templatePacks.find((row) => row.business_type === "HVAC") || templatePacks[0];
    const initial = defaultPack?.default_template_ids?.cold_initial || defaultPack?.categories?.cold_initial?.[0]?.id || "";
    const follow1 = defaultPack?.default_template_ids?.follow_up_1 || defaultPack?.categories?.follow_up_1?.[0]?.id || "";
    const follow2 = defaultPack?.default_template_ids?.follow_up_2 || defaultPack?.categories?.follow_up_2?.[0]?.id || "";
    setWizardState({
      provider_connection_id: providerConnections.find((row) => row.status === "active")?.id || "",
      email_agent_id: emailAgents.find((row) => row.status === "active")?.sales_rep_id || "",
      business_type: defaultPack?.business_type || "HVAC",
      initial_template_id: initial,
      follow_up_1_template_id: follow1,
      follow_up_2_template_id: follow2,
      segment_id: "",
      campaign_name: `${defaultPack?.business_type || "HVAC"} Launch Campaign`,
      city: "Toronto",
      source_type: "",
      email_consent_basis: "",
      email_publicly_listed: "",
      exclude_do_not_contact: true,
      exclude_suppressed: true,
      only_uncontacted: true,
      only_not_replied: true,
    });
    setWizardPreview(null);
    setWizardResult(null);
    setWizardStep(0);
    setWizardOpen(true);
    loadTemplatePreviewSilently(initial);
  };

  const handleWizardBusinessTypeChange = (value) => {
    const selectedPack = templatePacks.find((row) => row.business_type === value);
    const nextInitialId = selectedPack?.default_template_ids?.cold_initial || selectedPack?.categories?.cold_initial?.[0]?.id || "";
    const nextFollow1Id = selectedPack?.default_template_ids?.follow_up_1 || selectedPack?.categories?.follow_up_1?.[0]?.id || "";
    const nextFollow2Id = selectedPack?.default_template_ids?.follow_up_2 || selectedPack?.categories?.follow_up_2?.[0]?.id || "";
    setWizardState((prev) => ({
      ...prev,
      business_type: value,
      initial_template_id: nextInitialId,
      follow_up_1_template_id: nextFollow1Id,
      follow_up_2_template_id: nextFollow2Id,
      campaign_name: prev.campaign_name || `${value} Launch Campaign`,
    }));
    loadTemplatePreviewSilently(nextInitialId);
  };

  const scrollToSection = (ref) => {
    ref?.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const handleWizardPreview = async () => {
    setSubmitting(true);
    try {
      const result = await previewEmailTargets(
        wizardState.segment_id
          ? { segment_id: Number(wizardState.segment_id) }
          : {
              business_type: wizardState.business_type,
              city: wizardState.city,
              source_type: wizardState.source_type,
              email_consent_basis: wizardState.email_consent_basis,
              email_publicly_listed:
                wizardState.email_publicly_listed === ""
                  ? undefined
                  : wizardState.email_publicly_listed === "true",
              exclude_do_not_contact: wizardState.exclude_do_not_contact,
              exclude_suppressed: wizardState.exclude_suppressed,
              only_uncontacted: wizardState.only_uncontacted,
              only_not_replied: wizardState.only_not_replied,
            }
      );
      setWizardPreview(result || null);
      setWizardStep(4);
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to preview wizard targets.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWizardGenerate = async () => {
    setSubmitting(true);
    try {
      const result = await quickStartEmailCampaign({
        name: wizardState.campaign_name || `${wizardState.business_type} Launch Campaign`,
        business_type: wizardState.business_type,
        city: wizardState.city,
        provider_connection_id: wizardState.provider_connection_id ? Number(wizardState.provider_connection_id) : null,
        initial_template_id: wizardState.initial_template_id ? Number(wizardState.initial_template_id) : null,
        follow_up_1_template_id: wizardState.follow_up_1_template_id ? Number(wizardState.follow_up_1_template_id) : null,
        follow_up_2_template_id: wizardState.follow_up_2_template_id ? Number(wizardState.follow_up_2_template_id) : null,
        segment_id: wizardState.segment_id ? Number(wizardState.segment_id) : null,
        email_agent_ids: wizardState.email_agent_id ? [Number(wizardState.email_agent_id)] : [],
      });
      setWizardResult(result);
      setCampaignPreviews((prev) => ({ ...prev, [result.campaign.id]: result.preview }));
      setWizardStep(5);
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to generate campaign drafts.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWizardApprove = async () => {
    if (!wizardResult?.campaign?.id) return;
    setSubmitting(true);
    try {
      await approveEmailCampaign(wizardResult.campaign.id, {});
      setWizardStep(6);
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to approve wizard campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWizardSend = async (mode = "send") => {
    if (!wizardResult?.campaign?.id) return;
    setSubmitting(true);
    try {
      if (mode === "send") {
        await sendEmailCampaign(wizardResult.campaign.id);
      }
      setWizardStep(7);
      showBanner("success", mode === "send" ? "Wizard campaign sent." : "Wizard campaign ready for worker send.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to finish wizard send step.");
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
      <Paper sx={{ p: 2.5 }} ref={templateSectionRef}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Email SDR</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Admin-approved email-first outreach on top of the existing Sales CRM. Low-volume sends only, with suppression, reply classification, follow-up generation, and a hot-lead handoff queue.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" size="large" onClick={openWizard} disabled={submitting}>
                Launch Email Campaign
              </Button>
              <Button variant="outlined" onClick={handleRunDueSendNow} disabled={submitting}>
                Run due send now
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} useFlexGap>
            {metricCard("Sent Today", opsSummary?.today?.sent || 0, "Outbound delivered from worker or manual send")}
            {metricCard("Replies", opsSummary?.today?.replies || 0, "Inbound replies needing review", "success.main")}
            {metricCard("Positive", opsSummary?.today?.positive || 0, "Manual follow-up queue", "success.dark")}
            {metricCard("Bounce", opsSummary?.today?.bounce || 0, "Watch deliverability", "error.main")}
            {metricCard("Unsubscribe", opsSummary?.today?.unsubscribe || 0, "Compliance / fit signal", "warning.main")}
            {metricCard("Hot Leads", opsSummary?.today?.hot_leads || 0, "Ready for Yousef or deal handoff", "secondary.main")}
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Operations Status</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Worker: {opsSummary?.worker_status?.send_due || "ready"} • Next due send: {opsSummary?.next_due_send_at ? new Date(opsSummary.next_due_send_at).toLocaleString() : "No queued send"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Next follow-up: {opsSummary?.next_due_follow_up_at ? new Date(opsSummary.next_due_follow_up_at).toLocaleString() : "No follow-up queued"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active campaigns: {opsSummary?.active_campaign_count || 0}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Needs Attention</Typography>
              {(opsSummary?.needs_attention || []).length ? (
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {(opsSummary?.needs_attention || []).slice(0, 6).map((warning) => (
                    <Alert key={`ops-${warning.code}`} severity={warning.level === "warning" ? "warning" : "info"} variant="outlined">
                      {warning.message}
                    </Alert>
                  ))}
                </Stack>
              ) : (
                <Alert severity="success" variant="outlined" sx={{ mt: 1 }}>
                  No urgent Email SDR issues detected.
                </Alert>
              )}
            </Paper>
          </Stack>

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
        </Stack>
      </Paper>

      {(!providerConnections.length || !emailAgents.length || !campaigns.length) && (
        <Paper sx={{ p: 2.5 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Start Here</Typography>
            <Typography variant="body2" color="text.secondary">
              First-time setup for Email SDR. Complete these steps in order so the first campaign can launch cleanly.
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
              <Button variant="outlined" onClick={() => scrollToSection(providerSectionRef)}>
                1. Add Provider
              </Button>
              <Button variant="outlined" onClick={() => scrollToSection(agentSectionRef)}>
                2. Add Email Agent
              </Button>
              <Button variant="outlined" onClick={() => scrollToSection(templateSectionRef)}>
                3. Choose Template Pack
              </Button>
              <Button variant="contained" onClick={openWizard}>
                4. Launch Campaign
              </Button>
              <Button variant="outlined" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}>
                5. Review Replies
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Paper sx={{ p: 2.5 }} ref={providerSectionRef}>
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

      <Paper sx={{ p: 2.5 }} ref={agentSectionRef}>
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
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                              Variables: {(preview.variables_used || []).join(", ") || "none"}
                            </Typography>
                            {!!(preview.missing_variables || []).length && (
                              <Typography variant="caption" color="warning.main">
                                Missing sample values: {(preview.missing_variables || []).join(", ")}
                              </Typography>
                            )}
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
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
            <TinySeriesChart title="Sent over time" rows={analytics?.time_series || []} metric="sent" color="#2563eb" />
            <TinySeriesChart title="Replies over time" rows={analytics?.time_series || []} metric="replies" color="#059669" />
            <TinySeriesChart title="Positive replies" rows={analytics?.time_series || []} metric="positive" color="#0f766e" />
            <TinySeriesChart title="Bounces / Unsubs" rows={(analytics?.time_series || []).map((row) => ({ ...row, combined: Number(row.bounces || 0) + Number(row.unsubscribes || 0) }))} metric="combined" color="#dc2626" />
          </Stack>
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
                              {row.provider} • {row.from_email} • Reply-To: {row.reply_to_email || "Not set"} • Status: {row.status}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Health: {row.last_health_check_at ? new Date(row.last_health_check_at).toLocaleString() : "Not checked yet"} {row.last_error ? `• Last error: ${row.last_error}` : ""}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip size="small" variant="outlined" label={`Daily limit: ${row.daily_limit}`} />
                            <Chip size="small" variant="outlined" label={`Warmup: ${row.warmup_stage || "n/a"}`} />
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
                            <Typography variant="caption" color="text.secondary">
                              Provider: {row.provider_connection_name || "Fallback"} • Timezone: {row.timezone || "America/Toronto"} • Window: {row.send_window_start || "--:--"} - {row.send_window_end || "--:--"}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip size="small" variant="outlined" label={`Mailbox: ${row.from_email || "Not set"}`} />
                            <Chip size="small" variant="outlined" label={`Warmup: ${row.warmup_stage || "new"}`} />
                            <Chip size="small" variant="outlined" label={`Limit: ${row.daily_limit || 0}/day`} />
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
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Marketing Chatbot Leads</Typography>
              <Typography variant="body2" color="text.secondary">
                Leads captured from the separate marketing-site lead widget. These can be segmented, added to campaigns, or handled manually.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption">Consent only</Typography>
              <Switch checked={marketingConsentOnly} onChange={(e) => setMarketingConsentOnly(e.target.checked)} />
            </Stack>
          </Stack>
          {!visibleMarketingWidgetLeads.length ? (
            <Alert severity="info" variant="outlined">No marketing widget leads match the current filter.</Alert>
          ) : (
            <List disablePadding>
              {visibleMarketingWidgetLeads.slice(0, 20).map((lead) => (
                <React.Fragment key={`marketing-lead-${lead.id}`}>
                  <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ width: "100%" }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {lead.company_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lead.contact_name || "No contact"} • {lead.business_type || "Unknown type"} • {lead.city || "No city"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lead.email || "No email"}{lead.phone ? ` • ${lead.phone}` : ""} • CRM: {lead.current_crm || "Unknown"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                          Needs: {lead.needs_booking ? "Booking " : ""}{lead.needs_estimates ? "Estimates " : ""}{lead.needs_invoices ? "Invoices" : ""} • Staff: {lead.employees_count || "n/a"} • Consent: {lead.consent_to_contact ? "Yes" : "No"}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip size="small" color={lead.consent_to_contact ? "success" : "default"} label={lead.consent_to_contact ? "Explicit opt-in" : "Stored only"} />
                        <Button variant="outlined" size="small" onClick={() => onOpenLead?.(lead.id)}>
                          Open Lead
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

      <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Launch Email Campaign</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Step {wizardStep + 1} of {launchWizardSteps.length}: {launchWizardSteps[wizardStep]}
            </Typography>
            <LinearProgress variant="determinate" value={((wizardStep + 1) / launchWizardSteps.length) * 100} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
              {launchWizardSteps.map((label, index) => (
                <Chip
                  key={label}
                  size="small"
                  color={index < wizardStep ? "success" : index === wizardStep ? "primary" : "default"}
                  variant={index <= wizardStep ? "filled" : "outlined"}
                  label={label}
                />
              ))}
            </Stack>

            {wizardStep === 0 && (
              <TextField
                select
                label="Provider"
                value={wizardState.provider_connection_id}
                onChange={(e) => setWizardState((prev) => ({ ...prev, provider_connection_id: e.target.value }))}
                helperText="Choose the mailbox/provider connection for this campaign."
              >
                <MenuItem value="">Fallback mail helper</MenuItem>
                {providerConnections.map((row) => (
                  <MenuItem key={row.id} value={row.id}>{row.name} • {row.from_email}</MenuItem>
                ))}
              </TextField>
            )}

            {wizardStep === 1 && (
              <TextField
                select
                label="Email Agent"
                value={wizardState.email_agent_id}
                onChange={(e) => setWizardState((prev) => ({ ...prev, email_agent_id: e.target.value }))}
                helperText="Choose the AI Email Agent identity for the campaign."
              >
                <MenuItem value="">Auto-assign from active agents</MenuItem>
                {emailAgents.map((row) => (
                  <MenuItem key={row.id} value={row.sales_rep_id}>{row.display_name} • {row.from_email}</MenuItem>
                ))}
              </TextField>
            )}

            {wizardStep === 2 && (
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    select
                    label="Template pack"
                    value={wizardState.business_type}
                    onChange={(e) => handleWizardBusinessTypeChange(e.target.value)}
                    sx={{ minWidth: 240 }}
                  >
                    {templatePacks.map((pack) => (
                      <MenuItem key={pack.business_type} value={pack.business_type}>{pack.business_type}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Campaign name"
                    value={wizardState.campaign_name}
                    onChange={(e) => setWizardState((prev) => ({ ...prev, campaign_name: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label="City"
                    value={wizardState.city}
                    onChange={(e) => setWizardState((prev) => ({ ...prev, city: e.target.value }))}
                    sx={{ minWidth: 180 }}
                  />
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
                  {templatePacks.map((pack) => (
                    <Button
                      key={`pack-${pack.business_type}`}
                      variant={wizardState.business_type === pack.business_type ? "contained" : "outlined"}
                      onClick={() => handleWizardBusinessTypeChange(pack.business_type)}
                    >
                      Use {pack.business_type.replace(" service business", "")} defaults
                    </Button>
                  ))}
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    select
                    label="Initial template"
                    value={wizardState.initial_template_id}
                    onChange={(e) => {
                      const value = e.target.value;
                      setWizardState((prev) => ({ ...prev, initial_template_id: value }));
                      loadTemplatePreviewSilently(value);
                    }}
                    fullWidth
                  >
                    {wizardTemplateOptions.filter((row) => row.category === "cold_initial").map((row) => (
                      <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Follow-up 1"
                    value={wizardState.follow_up_1_template_id}
                    onChange={(e) => setWizardState((prev) => ({ ...prev, follow_up_1_template_id: e.target.value }))}
                    fullWidth
                  >
                    {wizardTemplateOptions.filter((row) => row.category === "follow_up_1").map((row) => (
                      <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Final follow-up"
                    value={wizardState.follow_up_2_template_id}
                    onChange={(e) => setWizardState((prev) => ({ ...prev, follow_up_2_template_id: e.target.value }))}
                    fullWidth
                  >
                    {wizardTemplateOptions.filter((row) => row.category === "follow_up_2").map((row) => (
                      <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
                    ))}
                  </TextField>
                </Stack>
                {wizardState.initial_template_id && (
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Sample preview</Typography>
                    <Button
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => handlePreviewTemplate(Number(wizardState.initial_template_id))}
                      disabled={submitting}
                    >
                      Render sample with John / ABC HVAC / Toronto
                    </Button>
                    {templatePreviews[wizardState.initial_template_id] && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {templatePreviews[wizardState.initial_template_id].subject}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
                          {templatePreviews[wizardState.initial_template_id].body}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}
              </Stack>
            )}

            {wizardStep === 3 && (
              <Stack spacing={2}>
                <TextField
                  select
                  label="Segment"
                  value={wizardState.segment_id}
                  onChange={(e) => setWizardState((prev) => ({ ...prev, segment_id: e.target.value }))}
                  helperText="Choose a saved segment or leave blank and use wizard filters below."
                >
                  <MenuItem value="">Use wizard filters</MenuItem>
                  {segments.map((row) => (
                    <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
                  ))}
                </TextField>
                {!wizardState.segment_id && (
                  <>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        label="Business type filter"
                        value={wizardState.business_type}
                        onChange={(e) => setWizardState((prev) => ({ ...prev, business_type: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        label="City filter"
                        value={wizardState.city}
                        onChange={(e) => setWizardState((prev) => ({ ...prev, city: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        label="Source type"
                        value={wizardState.source_type}
                        onChange={(e) => setWizardState((prev) => ({ ...prev, source_type: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        label="Consent basis"
                        value={wizardState.email_consent_basis}
                        onChange={(e) => setWizardState((prev) => ({ ...prev, email_consent_basis: e.target.value }))}
                        fullWidth
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        select
                        label="Public email listed"
                        value={wizardState.email_publicly_listed}
                        onChange={(e) => setWizardState((prev) => ({ ...prev, email_publicly_listed: e.target.value }))}
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="">Any</MenuItem>
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </TextField>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption">Exclude DNC</Typography>
                        <Switch checked={wizardState.exclude_do_not_contact} onChange={(e) => setWizardState((prev) => ({ ...prev, exclude_do_not_contact: e.target.checked }))} />
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption">Exclude suppressed</Typography>
                        <Switch checked={wizardState.exclude_suppressed} onChange={(e) => setWizardState((prev) => ({ ...prev, exclude_suppressed: e.target.checked }))} />
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption">Only uncontacted</Typography>
                        <Switch checked={wizardState.only_uncontacted} onChange={(e) => setWizardState((prev) => ({ ...prev, only_uncontacted: e.target.checked }))} />
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption">Only not replied</Typography>
                        <Switch checked={wizardState.only_not_replied} onChange={(e) => setWizardState((prev) => ({ ...prev, only_not_replied: e.target.checked }))} />
                      </Stack>
                    </Stack>
                  </>
                )}
              </Stack>
            )}

            {wizardStep === 4 && (
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                {!wizardPreview || wizardPreview.error ? (
                  <Alert severity="warning" variant="outlined">
                    {wizardPreview?.error || "Run preview to see eligible and blocked leads."}
                  </Alert>
                ) : (
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      {wizardPreview.mode === "saved_segment" ? "Using saved segment" : "Using wizard filters"}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Preview: {wizardPreview.eligible_count || 0} eligible • {wizardPreview.blocked_count || 0} blocked
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Blocked reasons: {Object.entries(wizardPreview.blocked_reason_counts || {}).map(([key, value]) => `${key} (${value})`).join(", ") || "None"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sample eligible leads: {(wizardPreview.eligible_sample || []).slice(0, 3).map((row) => row.company_name).join(", ") || "None"}
                    </Typography>
                  </Stack>
                )}
              </Paper>
            )}

            {wizardStep >= 5 && wizardResult?.campaign && (
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{wizardResult.campaign.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Ready state: {wizardResult.ready_count || 0} messages • Created drafts: {wizardResult.draft_result?.created_count || 0}
                </Typography>
                {wizardStep >= 6 && (
                  <Typography variant="body2" color="text.secondary">
                    Approved drafts: wizard step complete.
                  </Typography>
                )}
                {wizardStep >= 7 && (
                  <Alert severity="success" variant="outlined" sx={{ mt: 1 }}>
                    Campaign is ready. Positive replies will still stay manual and flow to Hot Leads.
                  </Alert>
                )}
              </Paper>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWizardOpen(false)}>Close</Button>
          {wizardStep > 0 && wizardStep < 5 && (
            <Button onClick={() => setWizardStep((prev) => Math.max(0, prev - 1))}>Back</Button>
          )}
          {wizardStep < 3 && (
            <Button variant="contained" onClick={() => setWizardStep((prev) => prev + 1)}>
              Continue
            </Button>
          )}
          {wizardStep === 3 && (
            <Button variant="contained" onClick={handleWizardPreview} disabled={submitting}>
              Preview
            </Button>
          )}
          {wizardStep === 4 && (
            <Button variant="contained" onClick={handleWizardGenerate} disabled={submitting}>
              Generate drafts
            </Button>
          )}
          {wizardStep === 5 && (
            <Button variant="contained" onClick={handleWizardApprove} disabled={submitting}>
              Approve
            </Button>
          )}
          {wizardStep === 6 && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => handleWizardSend("schedule")} disabled={submitting}>
                Leave for worker send
              </Button>
              <Button variant="contained" onClick={() => handleWizardSend("send")} disabled={submitting}>
                Send now
              </Button>
            </Stack>
          )}
        </DialogActions>
      </Dialog>

      {loading ? (
        <Alert severity="info" variant="outlined">Loading Email SDR workspace…</Alert>
      ) : null}
    </Stack>
  );
}
