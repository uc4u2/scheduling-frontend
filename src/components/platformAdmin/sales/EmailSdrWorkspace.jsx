import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  activateEmailAgent,
  activateEmailProviderConnection,
  applyEmailSegmentToCampaign,
  approveEmailCampaign,
  assignHotLead,
  classifyEmailInboundEvent,
  classifyEmailReply,
  cloneEmailTemplate,
  closeHotLead,
  copyEmailInboundReply,
  createEmailAgent,
  createEmailCampaign,
  createEmailProviderConnection,
  createEmailRoutingRule,
  createEmailSegment,
  createEmailTemplate,
  createDealFromHotLead,
  getEmailCampaignAnalytics,
  getEmailCampaignWorkspace,
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
  listEmailCampaignReviewQueue,
  listEmailInboundEvents,
  listEmailMessages,
  listEmailReplyReviewQueue,
  listEmailRoutingRules,
  listHotLeads,
  markEmailInboundReplyReplied,
  markHotLeadContacted,
  pauseEmailAgent,
  pauseEmailCampaign,
  pauseEmailProviderConnection,
  pauseEmailRoutingRule,
  prepareEmailCampaignForSending,
  previewEmailTemplate,
  previewEmailSegment,
  previewEmailCampaignLeads,
  previewEmailTargets,
  quickStartEmailCampaign,
  runEmailSdrDueSend,
  sendEmailCampaign,
  deleteEmailCampaign,
  setDefaultEmailTemplate,
  setHotLeadNextAction,
  snoozeHotLead,
  testEmailProviderConnection,
  activateEmailRoutingRule,
  unsubscribeEmailInboundLead,
  updateEmailAgent,
  updateEmailAgentLimitToday,
  updateEmailCampaignAutomationSettings,
  updateEmailMessage,
  updateEmailProviderConnection,
  updateEmailSegment,
  updateEmailTemplate,
  archiveEmailTemplate,
} from "../../../api/platformAdminSales";
import EmailSdrAnalyticsSection from "./emailSdr/EmailSdrAnalyticsSection";
import EmailSdrCampaignReviewSection from "./emailSdr/EmailSdrCampaignReviewSection";
import { EmailSdrCampaignWorkspacePage } from "./emailSdr/EmailSdrCampaignWorkspaceDrawer";
import EmailSdrHotLeadsSection from "./emailSdr/EmailSdrHotLeadsSection";
import EmailSdrLaunchWizard from "./emailSdr/EmailSdrLaunchWizard";
import EmailSdrMarketingLeadsSection from "./emailSdr/EmailSdrMarketingLeadsSection";
import EmailSdrReplyReviewSection from "./emailSdr/EmailSdrReplyReviewSection";
import EmailSdrStartChecklist from "./emailSdr/EmailSdrStartChecklist";

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

const emptyRoutingRuleForm = {
  name: "",
  source_type: "website_chatbot",
  business_type: "",
  city: "",
  consent_required: true,
  target_segment_id: "",
  suggested_campaign_id: "",
  suggested_template_id: "",
  priority: 100,
};

const classificationOptions = [
  "positive_interested",
  "asked_for_demo",
  "asked_for_price",
  "asked_question",
  "call_me",
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
const actionPanels = [
  { key: "replies", label: "Replies" },
  { key: "hot_leads", label: "Hot Leads" },
  { key: "campaigns", label: "Campaigns" },
  { key: "messages", label: "Messages" },
  { key: "marketing", label: "Leads" },
];
const wizardSampleLead = {
  name: "John Rivera",
  business_name: "ABC HVAC",
  business_type: "HVAC",
  city: "Toronto",
  email: "john@abchvac.ca",
};
const templateVariableGuide = [
  {
    key: "agent_name",
    label: "{{agent_name}}",
    description: "Sender name shown inside the email body and signature.",
    source: "Email Agent display name. You can override it for preview only below.",
  },
  {
    key: "first_name",
    label: "{{first_name}}",
    description: "Lead contact first name used in the greeting.",
    source: "Comes from the lead contact name or the preview contact name.",
  },
  {
    key: "business_name",
    label: "{{business_name}}",
    description: "Business or company name used in the email copy.",
    source: "Comes from the lead company name or the preview business name.",
  },
  {
    key: "city",
    label: "{{city}}",
    description: "City used when the template mentions location.",
    source: "Comes from the lead city or the preview city.",
  },
  {
    key: "unsubscribe_link",
    label: "{{unsubscribe_link}}",
    description: "Required unsubscribe URL appended by the system.",
    source: "System-generated. No manual editing needed.",
  },
];
const workspaceViews = [
  {
    key: "setup",
    label: "Preparation",
    title: "Preparation & Setup",
    description: "Create providers, agents, templates, routing, and campaign setup before any sending starts.",
  },
  {
    key: "control",
    label: "Campaigns",
    title: "Campaign Index",
    description: "Open a campaign workspace to work replies, hot leads, messages, and results in one place.",
  },
  {
    key: "action",
    label: "Action Queue",
    title: "Action Queue",
    description: "Handle replies, hot leads, approvals, and unresolved work that needs human attention.",
  },
  {
    key: "results",
    label: "Results",
    title: "Results & Quality",
    description: "Review analytics, delivery outcomes, unmatched events, and suppression quality.",
  },
];

function formatWorkerStatus(workerStatus) {
  if (!workerStatus) return "ready";
  if (typeof workerStatus === "string") return workerStatus;
  if (typeof workerStatus === "object") {
    const sendDue = workerStatus.send_due || "ready";
    const followUps = workerStatus.follow_ups || "ready";
    return `send ${sendDue} • follow-ups ${followUps}`;
  }
  return "ready";
}

function formatCampaignDateLabel(date = new Date()) {
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function buildSuggestedCampaignName({ importBatchName, businessType, city, sourceLabel = "Campaign" }) {
  const parts = [];
  if (importBatchName) {
    parts.push(importBatchName);
  } else {
    parts.push(sourceLabel);
  }
  if (businessType) parts.push(businessType);
  if (city) parts.push(city);
  parts.push(formatCampaignDateLabel());
  return parts.join(" - ");
}

function campaignCount(campaign, status) {
  return Number(campaign?.message_counts?.[status] || 0);
}

function getCampaignAutomationSummary(campaign) {
  return [
    `Drafts: ${campaign.auto_generate_drafts ? "auto planned" : "manual start"}`,
    `Approval: ${campaign.auto_approve_drafts ? "auto" : "manual"}`,
    `Send: ${campaign.auto_send_approved ? "auto" : "manual"}`,
    `Follow-ups: ${campaign.follow_up_mode === "auto_draft" ? "auto draft" : campaign.follow_up_mode === "auto_approved" ? "auto approve" : "manual"}`,
  ];
}

function getCampaignNextStep(campaign, preview) {
  const sentCount = campaignCount(campaign, "sent") + campaignCount(campaign, "delivered") + campaignCount(campaign, "replied");
  const draftCount = campaignCount(campaign, "draft");
  const approvedCount = campaignCount(campaign, "approved") + campaignCount(campaign, "scheduled");
  const eligibleCount = Number(preview?.eligible_count || 0);
  if (campaign.status === "cancelled") return "Archived";
  if (draftCount > 0 && !campaign.auto_approve_drafts) return "Approve drafts";
  if (approvedCount > 0 && !campaign.auto_send_approved) return "Run due send now";
  if (approvedCount > 0 && campaign.auto_send_approved) return "Worker will send approved messages";
  if (draftCount > 0 && campaign.auto_approve_drafts) return "Automation can approve drafts";
  if (sentCount > 0) return "Watch replies and hot leads";
  if (eligibleCount > 0) return "Generate drafts";
  return "Preview targets";
}

function normalizeQueueSearch(value) {
  return String(value || "").toLowerCase();
}

function messageSearchBlob(message) {
  return normalizeQueueSearch([
    message.lead?.company_name,
    message.lead?.email,
    message.subject,
    message.body,
    message.rendered_body,
    message.email_agent_name,
    message.status,
    message.error_code,
  ].filter(Boolean).join(" "));
}

function compactMessageBody(value, max = 240) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "No message body.";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function EmailSdrWorkspace({
  reps = [],
  campaignRouteId = null,
  onOpenLead,
  showBanner,
  importLaunchContext = null,
  onImportLaunchContextHandled = null,
}) {
  const navigate = useNavigate();
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
  const [agentLimits, setAgentLimits] = useState([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState({});
  const [campaignWorkspaceId, setCampaignWorkspaceId] = useState(null);
  const [campaignWorkspaceData, setCampaignWorkspaceData] = useState(null);
  const [campaignWorkspaceLoading, setCampaignWorkspaceLoading] = useState(false);
  const routeCampaignWorkspaceId = Number(campaignRouteId || 0) || null;
  const [routingRules, setRoutingRules] = useState([]);
  const [campaignReviewRows, setCampaignReviewRows] = useState([]);
  const [replyReviewRows, setReplyReviewRows] = useState([]);
  const [newReplyEvents, setNewReplyEvents] = useState([]);
  const [unmatchedEvents, setUnmatchedEvents] = useState([]);
  const [bounceEvents, setBounceEvents] = useState([]);
  const [needsActionEvents, setNeedsActionEvents] = useState([]);
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
  const [routingRuleForm, setRoutingRuleForm] = useState(emptyRoutingRuleForm);
  const [messageReplyText, setMessageReplyText] = useState({});
  const [messageReplyClass, setMessageReplyClass] = useState({});
  const [inboundReplyText, setInboundReplyText] = useState({});
  const [inboundReplyClass, setInboundReplyClass] = useState({});
  const [messageDraftState, setMessageDraftState] = useState({});
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [messageStatusFilter, setMessageStatusFilter] = useState("");
  const [messagePage, setMessagePage] = useState(1);
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
    email_agent_ids: [],
    use_all_active_agents: true,
    import_batch_id: "",
    import_batch_name: "",
    campaign_name_auto: true,
    business_type: "General",
    initial_template_id: "",
    follow_up_1_template_id: "",
    follow_up_2_template_id: "",
    segment_id: "",
    campaign_name: "",
    city: "",
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
  const [pendingImportBatch, setPendingImportBatch] = useState(null);
  const [previewValues, setPreviewValues] = useState({
    contact_name: wizardSampleLead.name,
    business_name: wizardSampleLead.business_name,
    business_type: "General",
    city: wizardSampleLead.city,
    agent_name: "",
  });
  const [marketingConsentOnly, setMarketingConsentOnly] = useState(true);
  const [myHotLeadsOnly, setMyHotLeadsOnly] = useState(false);
  const [workspaceView, setWorkspaceView] = useState("setup");
  const [actionPanel, setActionPanel] = useState("replies");
  const [templateBusinessFilter, setTemplateBusinessFilter] = useState("default");
  const [templateShowAll, setTemplateShowAll] = useState(false);
  const providerSectionRef = useRef(null);
  const agentSectionRef = useRef(null);
  const templateSectionRef = useRef(null);
  const campaignQueueRef = useRef(null);
  const visibleCampaigns = useMemo(
    () => campaigns.filter((row) => row.status !== "cancelled"),
    [campaigns]
  );
  const archivedCampaignCount = Math.max(campaigns.length - visibleCampaigns.length, 0);

  const loadCampaignWorkspaceById = useCallback(async (campaignId, { showLoader = false } = {}) => {
    if (!campaignId) return null;
    if (showLoader) setCampaignWorkspaceLoading(true);
    try {
      const result = await getEmailCampaignWorkspace(campaignId);
      setCampaignWorkspaceData(result);
      setCampaignWorkspaceId(campaignId);
      return result;
    } finally {
      if (showLoader) setCampaignWorkspaceLoading(false);
    }
  }, []);

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
  const availableTemplateBusinessTypes = useMemo(
    () => Array.from(new Set(templates.map((row) => row.business_type).filter(Boolean))).sort(),
    [templates]
  );
  const filteredTemplates = useMemo(() => {
    let rows = templates;
    if (templateBusinessFilter === "default") {
      rows = rows.filter((row) => row.is_default || row.default_for_category);
    } else if (templateBusinessFilter) {
      rows = rows.filter((row) => (row.business_type || "") === templateBusinessFilter);
    }
    if (!templateShowAll) {
      rows = rows.filter((row) => row.status !== "archived").slice(0, 12);
    }
    return rows;
  }, [templateBusinessFilter, templateShowAll, templates]);
  const filteredMessages = useMemo(() => {
    const q = normalizeQueueSearch(messageSearchTerm);
    return messages.filter((message) => {
      if (messageStatusFilter && message.status !== messageStatusFilter) return false;
      if (q && !messageSearchBlob(message).includes(q)) return false;
      return true;
    });
  }, [messages, messageSearchTerm, messageStatusFilter]);
  const messagePageCount = Math.max(1, Math.ceil(filteredMessages.length / 6));
  const visibleMessages = useMemo(
    () => filteredMessages.slice((messagePage - 1) * 6, messagePage * 6),
    [filteredMessages, messagePage]
  );
  const activeCampaignWorkspaceId = routeCampaignWorkspaceId || campaignWorkspaceId || null;
  const leadWorkspaceCampaignMap = useMemo(() => {
    const mapping = {};
    [...needsActionEvents, ...newReplyEvents, ...unmatchedEvents].forEach((event) => {
      const leadId = event?.matched_lead?.id || event?.matched_lead_id;
      const campaignId = event?.matched_message?.campaign_id;
      if (leadId && campaignId && !mapping[leadId]) {
        mapping[leadId] = campaignId;
      }
    });
    messages.forEach((message) => {
      if (message?.lead_id && message?.campaign_id && !mapping[message.lead_id]) {
        mapping[message.lead_id] = message.campaign_id;
      }
    });
    return mapping;
  }, [messages, needsActionEvents, newReplyEvents, unmatchedEvents]);
  const activeWorkspaceView = useMemo(
    () => workspaceViews.find((row) => row.key === workspaceView) || workspaceViews[0],
    [workspaceView]
  );
  const emailAgentByRepId = useMemo(() => {
    const mapping = new Map();
    emailAgents.forEach((row) => {
      if (row?.sales_rep_id != null) {
        mapping.set(Number(row.sales_rep_id), row);
      }
      if (row?.id != null) {
        mapping.set(Number(row.id), row);
      }
    });
    return mapping;
  }, [emailAgents]);
  const campaignReplyEvents = useMemo(
    () => [
      ...newReplyEvents,
      ...unmatchedEvents,
      ...bounceEvents,
      ...needsActionEvents,
      ...replyReviewRows.map((row) => row.event).filter(Boolean),
    ],
    [bounceEvents, needsActionEvents, newReplyEvents, replyReviewRows, unmatchedEvents]
  );
  const campaignConversationSummaryById = useMemo(() => {
    const replyBuckets = new Map();
    campaignReplyEvents.forEach((event) => {
      const campaignId = Number(event?.matched_message?.campaign_id || 0);
      if (!campaignId) return;
      const current = replyBuckets.get(campaignId);
      const repliedAt = Date.parse(event?.received_at || event?.created_at || event?.matched_message?.replied_at || "") || 0;
      if (!current || repliedAt >= current.sortValue) {
        replyBuckets.set(campaignId, {
          type: "reply",
          sortValue: repliedAt,
          senderAgentName: event?.matched_message?.email_agent_name || event?.matched_message?.sender_agent_name || null,
          fromEmail: event?.matched_message?.from_email || null,
          label: event?.matched_lead?.company_name || event?.from_email || "Reply",
          line: String(event?.body_text || "").replace(/\s+/g, " ").trim(),
        });
      }
    });
    messages.forEach((message) => {
      const campaignId = Number(message?.campaign_id || 0);
      if (!campaignId) return;
      const current = replyBuckets.get(campaignId);
      const sentAt = Date.parse(message?.replied_at || message?.sent_at || message?.scheduled_for || "") || 0;
      if (!current || sentAt > current.sortValue) {
        replyBuckets.set(campaignId, {
          type: "message",
          sortValue: sentAt,
          senderAgentName: message?.email_agent_name || null,
          fromEmail: message?.from_email || null,
          label: message?.lead?.company_name || message?.lead?.email || "Message",
          line: String(message?.rendered_body || message?.body || "").replace(/\s+/g, " ").trim(),
        });
      }
    });
    return replyBuckets;
  }, [campaignReplyEvents, messages]);
  const campaignRowSummaryById = useMemo(() => {
    const summary = {};
    campaigns.forEach((campaign) => {
      const selectedAgents = (campaign.email_agent_ids || [])
        .map((id) => emailAgentByRepId.get(Number(id)))
        .filter(Boolean);
      const senderLine = selectedAgents.length
        ? selectedAgents
            .slice(0, 2)
            .map((agent) => `${agent.display_name || agent.from_name || "Agent"}${agent.from_email ? ` <${agent.from_email}>` : ""}`)
            .join(" • ")
        : campaign.provider_connection_name
          ? `Provider: ${campaign.provider_connection_name}`
          : "Provider fallback";
      const latestConversation = campaignConversationSummaryById.get(Number(campaign.id)) || null;
      summary[campaign.id] = {
        senderLine,
        senderAgentsCount: selectedAgents.length,
        latestConversationLabel: latestConversation?.label || null,
        latestConversationLine: latestConversation?.line || "",
        latestConversationType: latestConversation?.type || null,
        latestConversationSender: [latestConversation?.senderAgentName, latestConversation?.fromEmail].filter(Boolean).join(" • "),
      };
    });
    return summary;
  }, [campaignConversationSummaryById, campaigns, emailAgentByRepId]);
  const actionPanelCounts = useMemo(
    () => ({
      replies: (newReplyEvents.length || 0) + (unmatchedEvents.length || 0) + (needsActionEvents.length || 0) + (bounceEvents.length || 0),
      hot_leads: hotLeads.length || 0,
      campaigns: campaignReviewRows.length || 0,
      messages: messages.length || 0,
      marketing: visibleMarketingWidgetLeads.length || 0,
    }),
    [
      bounceEvents.length,
      campaignReviewRows.length,
      hotLeads.length,
      messages.length,
      needsActionEvents.length,
      newReplyEvents.length,
      unmatchedEvents.length,
      visibleMarketingWidgetLeads.length,
    ]
  );
  useEffect(() => {
    setMessagePage(1);
  }, [messageSearchTerm, messageStatusFilter, messages.length]);
  useEffect(() => {
    if (messagePage > messagePageCount) {
      setMessagePage(messagePageCount);
    }
  }, [messagePage, messagePageCount]);
  const selectedWizardAgents = useMemo(() => {
    const selectedIds = new Set((wizardState.email_agent_ids || []).map((value) => String(value)));
    const activeRows = emailAgents.filter((row) => row.status === "active");
    if (wizardState.use_all_active_agents) {
      return activeRows;
    }
    return emailAgents.filter(
      (row) => selectedIds.has(String(row.sales_rep_id || "")) || selectedIds.has(String(row.id || ""))
    );
  }, [emailAgents, wizardState.email_agent_ids, wizardState.use_all_active_agents]);
  const selectedWizardAgent = selectedWizardAgents[0] || null;
  const selectedWizardAgentMetrics = useMemo(
    () =>
      selectedWizardAgents.map((row) => {
        const limitRow = agentLimits.find((limit) => Number(limit.sales_rep_id) === Number(row.sales_rep_id));
        const dailyLimit = Number(limitRow?.daily_limit || row.daily_limit || 0);
        const sentToday = Number(limitRow?.sent_count || 0);
        return {
          ...row,
          daily_limit_effective: dailyLimit,
          sent_today: sentToday,
          remaining_today: Math.max(dailyLimit - sentToday, 0),
          paused: row.status !== "active" || Boolean(limitRow?.paused),
          warmup_stage_effective: limitRow?.warmup_stage || row.warmup_stage || "",
        };
      }),
    [agentLimits, selectedWizardAgents]
  );
  const wizardCapacityPreview = useMemo(() => {
    const eligibleLeads = Number(wizardPreview?.eligible_count || 0);
    const selectedAgentsCount = selectedWizardAgentMetrics.length;
    const totalDailyCapacity = selectedWizardAgentMetrics.reduce(
      (sum, row) => sum + (row.paused ? 0 : Number(row.daily_limit_effective || 0)),
      0
    );
    const estimatedDays = eligibleLeads && totalDailyCapacity ? Math.ceil(eligibleLeads / totalDailyCapacity) : null;
    return {
      eligibleLeads,
      selectedAgentsCount,
      totalDailyCapacity,
      estimatedDays,
    };
  }, [selectedWizardAgentMetrics, wizardPreview]);
  const resolvedPreviewAgentName = useMemo(
    () => previewValues.agent_name || selectedWizardAgent?.display_name || selectedWizardAgent?.from_name || "Yousef",
    [previewValues.agent_name, selectedWizardAgent]
  );
  const buildPreviewSampleLead = useCallback((overrides = {}) => ({
    name: overrides.contact_name || overrides.name || previewValues.contact_name || wizardSampleLead.name,
    contact_name: overrides.contact_name || overrides.name || previewValues.contact_name || wizardSampleLead.name,
    business_name: overrides.business_name || previewValues.business_name || wizardSampleLead.business_name,
    company_name: overrides.business_name || previewValues.business_name || wizardSampleLead.business_name,
    business_type:
      overrides.business_type ||
      previewValues.business_type ||
      wizardState.business_type ||
      wizardSampleLead.business_type,
    city: overrides.city || previewValues.city || wizardState.city || wizardSampleLead.city,
    email: wizardSampleLead.email,
  }), [previewValues, wizardState.business_type, wizardState.city]);
  const applyPreviewAgentOverride = useCallback((preview, overrideAgentName) => {
    if (!preview) return preview;
    const baseAgentName = preview.variables?.agent_name || "Yousef";
    if (!overrideAgentName || overrideAgentName === baseAgentName) return preview;
    return {
      ...preview,
      subject: String(preview.subject || "").replaceAll(baseAgentName, overrideAgentName),
      body: String(preview.body || "").replaceAll(baseAgentName, overrideAgentName),
      variables: {
        ...(preview.variables || {}),
        agent_name: overrideAgentName,
      },
    };
  }, []);
  const setupIncomplete = !providerConnections.length || !emailAgents.length || !campaigns.length;
  const templateGroups = useMemo(() => {
    const grouped = new Map();
    filteredTemplates.forEach((row) => {
      const businessType = row.business_type || "General";
      if (!grouped.has(businessType)) {
        grouped.set(businessType, {
          businessType,
          templates: [],
          defaultCount: 0,
          categories: new Map(),
        });
      }
      const group = grouped.get(businessType);
      group.templates.push(row);
      if (row.is_default || row.default_for_category) {
        group.defaultCount += 1;
      }
      const category = row.category || "uncategorized";
      if (!group.categories.has(category)) {
        group.categories.set(category, []);
      }
      group.categories.get(category).push(row);
    });
    return Array.from(grouped.values())
      .sort((a, b) => a.businessType.localeCompare(b.businessType))
      .map((group) => ({
        ...group,
        categories: Array.from(group.categories.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, rows]) => ({ category, rows })),
      }));
  }, [filteredTemplates]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const workspaceToRefresh = routeCampaignWorkspaceId || campaignWorkspaceId || null;
      const [
        overviewResp,
        opsSummaryResp,
        campaignRows,
        emailAgentResp,
        providerRows,
        segmentRows,
        templateRows,
        templatePackRows,
        routingRuleRows,
        marketingLeadRows,
        messageRows,
        hotRows,
        agentLimitRows,
        inboundReplyRows,
        unmatchedRows,
        bounceRows,
        needsActionRows,
        campaignReviewResp,
        replyReviewResp,
      ] = await Promise.all([
        getEmailSdrOverview(),
        getEmailSdrOpsSummary(),
        listEmailCampaigns(),
        listEmailAgents(),
        listEmailProviderConnections(),
        listEmailSegments(),
        listEmailTemplates(),
        listEmailTemplatePacks(),
        listEmailRoutingRules(),
        listMarketingChatbotLeads({ consent_only: false }),
        listEmailMessages(),
        listHotLeads({ my_only: myHotLeadsOnly }),
        listEmailAgentLimitsToday(),
        listEmailInboundEvents({ queue: "new_replies", limit: 50 }),
        listEmailInboundEvents({ queue: "unmatched", limit: 50 }),
        listEmailInboundEvents({ queue: "bounces", limit: 50 }),
        listEmailInboundEvents({ queue: "needs_action", limit: 50 }),
        listEmailCampaignReviewQueue(),
        listEmailReplyReviewQueue(),
      ]);
      setOverview(overviewResp || {});
      setOpsSummary(opsSummaryResp || null);
      setCampaigns(campaignRows || []);
      setEmailAgents(emailAgentResp?.agents || []);
      setProviderConnections(providerRows || []);
      setSegments(segmentRows || []);
      setTemplates(templateRows || []);
      setTemplatePacks(templatePackRows || []);
      setRoutingRules(routingRuleRows || []);
      setMarketingWidgetLeads(marketingLeadRows || []);
      setMessages(messageRows || []);
      setHotLeads(hotRows || []);
      setAgentLimits(agentLimitRows || []);
      setNewReplyEvents(inboundReplyRows || []);
      setUnmatchedEvents(unmatchedRows || []);
      setBounceEvents(bounceRows || []);
      setNeedsActionEvents(needsActionRows || []);
      setCampaignReviewRows(campaignReviewResp || []);
      setReplyReviewRows(replyReviewResp || []);
      if (workspaceToRefresh) {
        await loadCampaignWorkspaceById(workspaceToRefresh);
      }
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
  }, [campaignWorkspaceId, loadCampaignWorkspaceById, myHotLeadsOnly, routeCampaignWorkspaceId, showBanner]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!activeCampaignWorkspaceId) return;
    setWorkspaceView("control");
    loadCampaignWorkspaceById(activeCampaignWorkspaceId, { showLoader: true }).catch((error) => {
      showBanner("error", error?.response?.data?.error || "Failed to load campaign workspace.");
    });
  }, [activeCampaignWorkspaceId, loadCampaignWorkspaceById, showBanner]);

  const handleWorkspaceViewChange = (_, nextView) => {
    setWorkspaceView(nextView);
    if (activeCampaignWorkspaceId && nextView !== "control") {
      navigate("/admin/sales/crm");
    }
  };

  const handleOpenCampaignWorkspace = async (campaignId) => {
    if (!campaignId) return;
    setWorkspaceView("control");
    navigate(`/admin/sales/crm/campaigns/${campaignId}`);
  };

  const handleCloseCampaignWorkspace = () => {
    navigate("/admin/sales/crm");
  };

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

  const handleCreateRoutingRule = async () => {
    setSubmitting(true);
    try {
      await createEmailRoutingRule({
        ...routingRuleForm,
        target_segment_id: routingRuleForm.target_segment_id ? Number(routingRuleForm.target_segment_id) : null,
        suggested_campaign_id: routingRuleForm.suggested_campaign_id ? Number(routingRuleForm.suggested_campaign_id) : null,
        suggested_template_id: routingRuleForm.suggested_template_id ? Number(routingRuleForm.suggested_template_id) : null,
        priority: Number(routingRuleForm.priority || 100),
      });
      setRoutingRuleForm(emptyRoutingRuleForm);
      showBanner("success", "Routing rule created.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to create routing rule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRoutingRule = async (ruleId, active) => {
    setSubmitting(true);
    try {
      if (active) {
        await pauseEmailRoutingRule(ruleId);
        showBanner("success", "Routing rule paused.");
      } else {
        await activateEmailRoutingRule(ruleId);
        showBanner("success", "Routing rule activated.");
      }
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to update routing rule.");
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

  const handleCloneTemplate = async (templateId) => {
    setSubmitting(true);
    try {
      await cloneEmailTemplate(templateId);
      showBanner("success", "Template cloned.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to clone template.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefaultTemplate = async (templateId) => {
    setSubmitting(true);
    try {
      await setDefaultEmailTemplate(templateId, { default_for_category: true });
      showBanner("success", "Template marked as default.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to set template default.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewTemplate = async (templateId, samplePreset = "HVAC") => {
    setSubmitting(true);
    try {
      const result = await previewEmailTemplate(templateId, {
        sample_preset: samplePreset,
        sample_lead: buildPreviewSampleLead({ business_type: samplePreset }),
      });
      setTemplatePreviews((prev) => ({
        ...prev,
        [templateId]: applyPreviewAgentOverride(result.preview, resolvedPreviewAgentName),
      }));
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
      const result = await previewEmailTemplate(Number(templateId), {
        sample_preset: wizardState.business_type || previewValues.business_type || "HVAC",
        sample_lead: buildPreviewSampleLead({
          business_type: wizardState.business_type || previewValues.business_type || "HVAC",
          city: wizardState.city || previewValues.city || wizardSampleLead.city,
        }),
      });
      setTemplatePreviews((prev) => ({
        ...prev,
        [templateId]: applyPreviewAgentOverride(result.preview, resolvedPreviewAgentName),
      }));
    } catch {
      // Keep wizard flow usable even if preview fetch fails.
    }
  }, [applyPreviewAgentOverride, buildPreviewSampleLead, previewValues.business_type, previewValues.city, resolvedPreviewAgentName, wizardState.business_type, wizardState.city]);

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

  const handleDeleteCampaign = async (campaign) => {
    if (!campaign?.id) return;
    setSubmitting(true);
    try {
      const result = await deleteEmailCampaign(campaign.id);
      if (result?.mode === "archived") {
        showBanner("success", `Campaign "${campaign.name}" archived and removed from the active queue.`);
      } else {
        showBanner("success", `Campaign "${campaign.name}" deleted.`);
      }
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to clean up campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachImportBatchToCampaign = async (campaignId, importBatchId) => {
    if (!campaignId || !importBatchId) return;
    setSubmitting(true);
    try {
      await updateEmailCampaignAutomationSettings(campaignId, { import_batch_id: Number(importBatchId) });
      const preview = await previewEmailCampaignLeads(campaignId);
      setCampaignPreviews((prev) => ({ ...prev, [campaignId]: preview }));
      const campaign = campaigns.find((row) => row.id === campaignId);
      const batch = pendingImportBatch && Number(pendingImportBatch.id) === Number(importBatchId) ? pendingImportBatch : null;
      showBanner(
        "success",
        `Import batch "${batch?.filename || `#${importBatchId}`}" is now attached to campaign "${campaign?.name || `#${campaignId}`}".`
      );
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to attach imported batch.");
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

  const activeEmailAgents = useMemo(
    () => emailAgents.filter((row) => row.status === "active"),
    [emailAgents]
  );

  const syncAutoCampaignName = useCallback((nextPatch = {}) => {
    setWizardState((prev) => {
      const nextState = { ...prev, ...nextPatch };
      if (nextState.campaign_name_auto) {
        nextState.campaign_name = buildSuggestedCampaignName({
          importBatchName: nextState.import_batch_name,
          businessType: nextState.business_type,
          city: nextState.city,
          sourceLabel: nextState.import_batch_id ? "Imported Leads" : "Email Campaign",
        });
      }
      return nextState;
    });
  }, []);

  const openWizard = useCallback((context = {}) => {
    const businessType = context.business_type || context.importBatch?.business_type || "General";
    const city = context.city || context.importBatch?.city || "";
    const importBatchId = context.importBatch?.id || "";
    const importBatchName = context.importBatch?.label || context.importBatch?.filename || "";
    const defaultPack =
      templatePacks.find((row) => String(row.business_type || "").toLowerCase() === String(businessType || "").toLowerCase()) ||
      templatePacks.find((row) => row.business_type === "General") ||
      templatePacks[0];
    const initial = defaultPack?.default_template_ids?.cold_initial || defaultPack?.categories?.cold_initial?.[0]?.id || "";
    const follow1 = defaultPack?.default_template_ids?.follow_up_1 || defaultPack?.categories?.follow_up_1?.[0]?.id || "";
    const follow2 = defaultPack?.default_template_ids?.follow_up_2 || defaultPack?.categories?.follow_up_2?.[0]?.id || "";
    const defaultAgentIds = activeEmailAgents.map((row) => Number(row.sales_rep_id));
    setWizardState({
      provider_connection_id: providerConnections.find((row) => row.status === "active")?.id || "",
      email_agent_ids: defaultAgentIds,
      use_all_active_agents: true,
      import_batch_id: importBatchId,
      import_batch_name: importBatchName,
      campaign_name_auto: true,
      business_type: defaultPack?.business_type || businessType || "General",
      initial_template_id: initial,
      follow_up_1_template_id: follow1,
      follow_up_2_template_id: follow2,
      segment_id: "",
      campaign_name: buildSuggestedCampaignName({
        importBatchName,
        businessType: defaultPack?.business_type || businessType || "General",
        city,
        sourceLabel: importBatchId ? "Imported Leads" : "Email Campaign",
      }),
      city,
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
    setPreviewValues((prev) => ({
      ...prev,
      business_type: defaultPack?.business_type || prev.business_type || "General",
      city: city || prev.city || "",
    }));
    loadTemplatePreviewSilently(initial);
  }, [activeEmailAgents, loadTemplatePreviewSilently, providerConnections, templatePacks]);

  const handleWizardBusinessTypeChange = (value) => {
    const selectedPack = templatePacks.find((row) => row.business_type === value);
    const nextInitialId = selectedPack?.default_template_ids?.cold_initial || selectedPack?.categories?.cold_initial?.[0]?.id || "";
    const nextFollow1Id = selectedPack?.default_template_ids?.follow_up_1 || selectedPack?.categories?.follow_up_1?.[0]?.id || "";
    const nextFollow2Id = selectedPack?.default_template_ids?.follow_up_2 || selectedPack?.categories?.follow_up_2?.[0]?.id || "";
    syncAutoCampaignName({
      business_type: value,
      initial_template_id: nextInitialId,
      follow_up_1_template_id: nextFollow1Id,
      follow_up_2_template_id: nextFollow2Id,
    });
    setPreviewValues((prev) => ({
      ...prev,
      business_type: value,
    }));
    loadTemplatePreviewSilently(nextInitialId);
  };

  useEffect(() => {
    if (!importLaunchContext?.importBatch) return;
    setPendingImportBatch(importLaunchContext.importBatch);
    if (importLaunchContext.mode === "create") {
      setWorkspaceView("setup");
      openWizard(importLaunchContext);
    } else if (importLaunchContext.mode === "existing") {
      setWorkspaceView("control");
      setTimeout(() => scrollToSection(campaignQueueRef), 150);
    }
    onImportLaunchContextHandled?.();
  }, [importLaunchContext, onImportLaunchContextHandled, openWizard]);

  function scrollToSection(ref) {
    ref?.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  const handleWizardPreview = async () => {
    setSubmitting(true);
    try {
      const result = await previewEmailTargets(
        wizardState.segment_id
          ? { segment_id: Number(wizardState.segment_id) }
          : {
              import_batch_id: wizardState.import_batch_id ? Number(wizardState.import_batch_id) : undefined,
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
        name:
          wizardState.campaign_name ||
          buildSuggestedCampaignName({
            importBatchName: wizardState.import_batch_name,
            businessType: wizardState.business_type,
            city: wizardState.city,
            sourceLabel: wizardState.import_batch_id ? "Imported Leads" : "Email Campaign",
          }),
        business_type: wizardState.business_type,
        city: wizardState.city,
        import_batch_id: wizardState.import_batch_id ? Number(wizardState.import_batch_id) : null,
        provider_connection_id: wizardState.provider_connection_id ? Number(wizardState.provider_connection_id) : null,
        initial_template_id: wizardState.initial_template_id ? Number(wizardState.initial_template_id) : null,
        follow_up_1_template_id: wizardState.follow_up_1_template_id ? Number(wizardState.follow_up_1_template_id) : null,
        follow_up_2_template_id: wizardState.follow_up_2_template_id ? Number(wizardState.follow_up_2_template_id) : null,
        segment_id: wizardState.segment_id ? Number(wizardState.segment_id) : null,
        email_agent_ids: wizardState.use_all_active_agents ? [] : (wizardState.email_agent_ids || []).map(Number),
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

  const handleClassifyInboundReply = async (eventId, suggestedClassification = "") => {
    const classification = inboundReplyClass[eventId] || suggestedClassification || "";
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

  const handleCopyReplyDraft = async (event) => {
    const latest = event?.latest_classification || {};
    const subject = latest.draft_reply_subject || "";
    const body = latest.draft_reply_body || "";
    const clipboardText = subject ? `Subject: ${subject}\n\n${body}` : body;
    if (!clipboardText) {
      showBanner("error", "No suggested reply draft is available yet.");
      return;
    }
    setSubmitting(true);
    try {
      await copyEmailInboundReply(event.id);
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(clipboardText);
      }
      showBanner("success", "Suggested reply copied.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to copy suggested reply.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkReplySentManually = async (event) => {
    setSubmitting(true);
    try {
      await markEmailInboundReplyReplied(event.id, {
        note: inboundReplyText[event.id] || event.latest_classification?.draft_reply_subject || "",
      });
      showBanner("success", "Reply marked as handled manually.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to mark reply handled.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyMarkedCalled = async (event) => {
    if (!event?.matched_lead?.id) return;
    await handleMarkHotLeadContacted(event.matched_lead.id);
  };

  const handleReplyCreateDeal = async (event) => {
    if (!event?.matched_lead?.id) return;
    await handleCreateHotLeadDeal(event.matched_lead.id);
  };

  const handleReplySnooze = async (event) => {
    if (!event?.matched_lead?.id) return;
    setSubmitting(true);
    try {
      const classification = event.latest_classification?.classification || "";
      if (classification === "not_now") {
        const until = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString();
        await snoozeHotLead(event.matched_lead.id, { snooze_until: until, note: "Reply assistant snooze" });
      } else {
        await snoozeHotLead(event.matched_lead.id, { preset: "tomorrow", note: "Reply assistant snooze" });
      }
      showBanner("success", "Reply follow-up snoozed.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to snooze reply follow-up.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyUnsubscribe = async (event) => {
    setSubmitting(true);
    try {
      await unsubscribeEmailInboundLead(event.id, { note: inboundReplyText[event.id] || "" });
      showBanner("success", "Lead unsubscribed from future Email SDR outreach.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to unsubscribe lead.");
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

  const handleAssignHotLead = async (leadId, salesRepId) => {
    setSubmitting(true);
    try {
      await assignHotLead(leadId, { sales_rep_id: Number(salesRepId) });
      showBanner("success", "Hot lead owner updated.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to assign hot lead.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetHotLeadNextAction = async (leadId, nextActionAt) => {
    setSubmitting(true);
    try {
      await setHotLeadNextAction(leadId, { next_action_at: nextActionAt });
      showBanner("success", "Next action updated.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to set next action.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnoozeHotLead = async (leadId, preset) => {
    setSubmitting(true);
    try {
      await snoozeHotLead(leadId, { preset });
      showBanner("success", "Hot lead snoozed.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to snooze hot lead.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHotLeadContacted = async (leadId) => {
    setSubmitting(true);
    try {
      await markHotLeadContacted(leadId, {});
      showBanner("success", "Hot lead marked contacted.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to update hot lead.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateHotLeadDeal = async (leadId) => {
    setSubmitting(true);
    try {
      await createDealFromHotLead(leadId);
      showBanner("success", "Sales deal created from hot lead.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to create deal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseHotLead = async (leadId) => {
    setSubmitting(true);
    try {
      await closeHotLead(leadId, {});
      showBanner("success", "Hot lead closed.");
      await loadWorkspace();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to close hot lead.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Email SDR</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Admin-approved email-first outreach on top of the existing Sales CRM. Low-volume sends only, with suppression, reply classification, follow-up generation, and a hot-lead handoff queue.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" size="large" onClick={() => openWizard()} disabled={submitting}>
                Launch Email Campaign
              </Button>
              <Button variant="outlined" onClick={handleRunDueSendNow} disabled={submitting}>
                Run due send now
              </Button>
            </Stack>
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 3,
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(15,23,42,0.03) 100%)",
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {activeWorkspaceView.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeCampaignWorkspaceId
                  ? "You are inside a specific campaign workspace. Use Campaigns to stay in this campaign or switch tabs to return to the global Email SDR page."
                  : activeWorkspaceView.description}
              </Typography>
              <Tabs
                value={workspaceView}
                onChange={handleWorkspaceViewChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  "& .MuiTab-root": {
                    minHeight: 42,
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#334155",
                  },
                  "& .Mui-selected": {
                    color: "#1d4ed8 !important",
                  },
                }}
              >
                {workspaceViews.map((view) => (
                  <Tab key={view.key} value={view.key} label={view.label} />
                ))}
              </Tabs>
            </Stack>
          </Paper>
        </Stack>
      </Paper>

      {activeCampaignWorkspaceId ? (
        <EmailSdrCampaignWorkspacePage
          workspace={campaignWorkspaceData}
          loading={campaignWorkspaceLoading}
          reps={reps}
          classificationOptions={classificationOptions}
          inboundReplyClass={inboundReplyClass}
          inboundReplyText={inboundReplyText}
          setInboundReplyClass={setInboundReplyClass}
          setInboundReplyText={setInboundReplyText}
          onClassify={handleClassifyInboundReply}
          onCopyReply={handleCopyReplyDraft}
          onMarkReplied={handleMarkReplySentManually}
          onMarkCalled={handleReplyMarkedCalled}
          onCreateDeal={handleReplyCreateDeal}
          onReplySnooze={handleReplySnooze}
          onUnsubscribe={handleReplyUnsubscribe}
          onAssignHotLead={handleAssignHotLead}
          onSetHotLeadNextAction={handleSetHotLeadNextAction}
          onHotLeadSnooze={handleSnoozeHotLead}
          onMarkHotLeadContacted={handleMarkHotLeadContacted}
          onCreateHotLeadDeal={handleCreateHotLeadDeal}
          onCloseHotLead={handleCloseHotLead}
          onBack={handleCloseCampaignWorkspace}
        />
      ) : (
        <>
          {workspaceView === "control" ? (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1.25}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Campaign workspace is the default operating surface</Typography>
                <Typography variant="body2" color="text.secondary">
                  Use this page to find a campaign, then open its workspace route to handle replies, hot leads, sender identity, and full conversation history without scanning the global queue.
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                  <Chip size="small" variant="outlined" label={`Active campaigns: ${opsSummary?.active_campaign_count || campaigns.length || 0}`} />
                  <Chip size="small" variant="outlined" label={`New replies: ${overview.new_reply_events || 0}`} />
                  <Chip size="small" variant="outlined" label={`Hot leads: ${overview.hot_leads || 0}`} />
                  <Chip size="small" variant="outlined" label={`Campaigns needing review: ${campaignReviewRows.length || 0}`} />
                  <Chip size="small" variant="outlined" label={`Worker: ${formatWorkerStatus(opsSummary?.worker_status)}`} />
                </Stack>
              </Stack>
            </Paper>
          ) : null}

      {workspaceView === "setup" && pendingImportBatch ? (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "#bfdbfe", backgroundColor: "#f8fbff" }}>
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={{ color: "#2563eb", fontWeight: 800, letterSpacing: 0.8 }}>
              Imported leads ready
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {pendingImportBatch.filename || `Import batch #${pendingImportBatch.id}`}
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
              <Chip size="small" variant="outlined" label={`Imported: ${pendingImportBatch.imported_count || 0}`} />
              <Chip size="small" color="success" variant="outlined" label={`Eligible email: ${pendingImportBatch.eligible_email_count || 0}`} />
              <Chip size="small" color="warning" variant="outlined" label={`Missing email: ${pendingImportBatch.missing_email_count || 0}`} />
              <Chip size="small" color="warning" variant="outlined" label={`Duplicates/skipped: ${(pendingImportBatch.duplicate_count || 0) + (pendingImportBatch.skipped_count || 0)}`} />
              <Chip size="small" color="warning" variant="outlined" label={`DNC found: ${pendingImportBatch.do_not_contact_found_count || 0}`} />
              <Chip size="small" color="warning" variant="outlined" label={`Suppressed: ${pendingImportBatch.suppressed_count || 0}`} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
              <Button variant="contained" onClick={() => openWizard({ importBatch: pendingImportBatch })} disabled={submitting}>
                Create Email Campaign from this import
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setWorkspaceView("control");
                  setTimeout(() => scrollToSection(campaignQueueRef), 150);
                }}
                disabled={submitting}
              >
                Add to Existing Campaign
              </Button>
              <Button variant="text" onClick={() => setPendingImportBatch(null)} disabled={submitting}>
                Dismiss
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {workspaceView === "setup" && setupIncomplete && (
        <EmailSdrStartChecklist
          onAddProvider={() => scrollToSection(providerSectionRef)}
          onAddAgent={() => scrollToSection(agentSectionRef)}
          onTemplates={() => scrollToSection(templateSectionRef)}
          onLaunch={() => openWizard()}
          onReplies={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
        />
      )}

      {workspaceView === "setup" ? (
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(15,23,42,0.03) 100%)",
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={{ color: "#2563eb", fontWeight: 800, letterSpacing: 0.8 }}>
              Required before sending
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Launch and configure your campaign
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Build the sending setup first, then use the guided launch flow to preview leads, generate drafts, and move into review safely.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
              <Button variant="contained" size="large" onClick={() => openWizard()} disabled={submitting}>
                Launch Email Campaign
              </Button>
              <Chip
                size="small"
                color={overview.webhook_secret_configured ? "success" : "warning"}
                variant="outlined"
                label={overview.webhook_secret_configured ? "Webhook secret ready in backend env" : "Set EMAIL_SDR_WEBHOOK_SECRET in backend env"}
              />
              <Chip size="small" variant="outlined" label={`${providerConnections.length} provider connection(s)`} />
              <Chip size="small" variant="outlined" label={`${emailAgents.length} email agent(s)`} />
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {workspaceView === "setup" ? (
      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: 0.8 }}>
            Targeting setup
          </Typography>
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
      ) : null}

      {workspaceView === "setup" ? (
      <Paper sx={{ p: 2.5 }} ref={templateSectionRef}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Email Templates</Typography>
              <Typography variant="body2" color="text.secondary">
                Keep the template library focused. Start with defaults, then expand only when a manager needs deeper control.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                select
                size="small"
                label="Show"
                value={templateBusinessFilter}
                onChange={(e) => setTemplateBusinessFilter(e.target.value)}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="default">Default templates only</MenuItem>
                <MenuItem value="">All business types</MenuItem>
                {availableTemplateBusinessTypes.map((businessType) => (
                  <MenuItem key={businessType} value={businessType}>
                    {businessType}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant={templateShowAll ? "contained" : "outlined"}
                onClick={() => setTemplateShowAll((prev) => !prev)}
              >
                {templateShowAll ? "Compact list" : "Show more"}
              </Button>
            </Stack>
          </Stack>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(37,99,235,0.03)" }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Variables & preview values</Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep templates flexible by using variables. Managers can change preview values here without changing the saved workflow.
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", xl: "row" }} spacing={2}>
                <Stack spacing={1} sx={{ flex: 1 }}>
                  {templateVariableGuide.map((row) => (
                    <Paper key={row.key} variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip size="small" variant="outlined" label={row.label} />
                          {row.key === "agent_name" ? (
                            <Chip size="small" color="info" variant="outlined" label="Sender identity" />
                          ) : null}
                        </Stack>
                        <Typography variant="body2">{row.description}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.source}</Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, minWidth: { xl: 360 } }}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Preview values</Typography>
                    <Typography variant="caption" color="text.secondary">
                      These values are used by template preview and the launch wizard sample preview.
                    </Typography>
                    <TextField
                      size="small"
                      label="Preview sender name"
                      value={previewValues.agent_name}
                      onChange={(e) => setPreviewValues((prev) => ({ ...prev, agent_name: e.target.value }))}
                      helperText={
                        selectedWizardAgent
                          ? `Leave blank to use the selected Email Agent: ${selectedWizardAgent.display_name}.`
                          : "Leave blank to use the selected Email Agent display name."
                      }
                    />
                    <TextField
                      size="small"
                      label="Preview contact name"
                      value={previewValues.contact_name}
                      onChange={(e) => setPreviewValues((prev) => ({ ...prev, contact_name: e.target.value }))}
                    />
                    <TextField
                      size="small"
                      label="Preview business name"
                      value={previewValues.business_name}
                      onChange={(e) => setPreviewValues((prev) => ({ ...prev, business_name: e.target.value }))}
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <TextField
                        size="small"
                        label="Preview business type"
                        value={previewValues.business_type}
                        onChange={(e) => setPreviewValues((prev) => ({ ...prev, business_type: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="Preview city"
                        value={previewValues.city}
                        onChange={(e) => setPreviewValues((prev) => ({ ...prev, city: e.target.value }))}
                        fullWidth
                      />
                    </Stack>
                    <Alert severity="info" variant="outlined">
                      <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700 }}>{`{{agent_name}}`}</Box>
                      {" "}comes from the Email Agent display name in real sends. This box only changes preview text.
                    </Alert>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>
          </Paper>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: 0.8 }}>
            Message setup
          </Typography>
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
          {!templateGroups.length ? (
            <Alert severity="info" variant="outlined">No templates available.</Alert>
          ) : (
            <Stack spacing={1.5}>
              {templateGroups.map((group, index) => (
                <Accordion
                  key={`template-group-${group.businessType}`}
                  defaultExpanded={index === 0 && !templateShowAll}
                  disableGutters
                  sx={{ border: "1px solid #e2e8f0", borderRadius: "14px !important", overflow: "hidden" }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", md: "center" }}
                      spacing={1}
                      sx={{ width: "100%" }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{group.businessType}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {group.templates.length} template{group.templates.length === 1 ? "" : "s"} • {group.defaultCount} default
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {group.categories.map((categoryRow) => (
                          <Chip key={`${group.businessType}-${categoryRow.category}`} size="small" variant="outlined" label={`${categoryRow.category}: ${categoryRow.rows.length}`} />
                        ))}
                      </Stack>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {group.categories.map((categoryRow) => (
                        <Paper key={`${group.businessType}-${categoryRow.category}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                          <Stack spacing={1.25}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
                              {String(categoryRow.category).replaceAll("_", " ")}
                            </Typography>
                            {categoryRow.rows.map((row) => {
                              const draft = templateDrafts[row.id] || {};
                              const preview = templatePreviews[row.id];
                              return (
                                <Box key={row.id} sx={{ py: 1, borderTop: "1px solid #e2e8f0" }}>
                                  <Stack spacing={1}>
                                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                                      <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                                          <Chip size="small" variant="outlined" label={row.category} />
                                          <Chip size="small" variant="outlined" label={row.tone || "professional"} />
                                          {(row.is_default || row.default_for_category) ? (
                                            <Chip size="small" color="success" variant="outlined" label="Default" />
                                          ) : null}
                                        </Stack>
                                      </Box>
                                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        <Button size="small" variant="outlined" sx={{ color: "#2563eb", fontWeight: 700 }} onClick={() => handlePreviewTemplate(row.id, row.business_type || "General")} disabled={submitting}>Preview</Button>
                                        <Button size="small" variant="outlined" sx={{ color: "#2563eb", fontWeight: 700 }} onClick={() => handleSaveTemplate(row.id)} disabled={submitting}>Save</Button>
                                        <Button size="small" variant="outlined" sx={{ color: "#2563eb", fontWeight: 700 }} onClick={() => handleCloneTemplate(row.id)} disabled={submitting}>Clone</Button>
                                        <Button size="small" variant="outlined" sx={{ color: "#2563eb", fontWeight: 700 }} onClick={() => handleSetDefaultTemplate(row.id)} disabled={submitting}>Set default</Button>
                                        <Button size="small" variant="outlined" sx={{ color: "#2563eb", fontWeight: 700 }} onClick={() => handleArchiveTemplate(row.id)} disabled={submitting || row.status === "archived"}>Archive</Button>
                                      </Stack>
                                    </Stack>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                                      <TextField size="small" label="Name" value={draft.name || ""} onChange={(e) => setTemplateDrafts((prev) => ({ ...prev, [row.id]: { ...draft, name: e.target.value } }))} />
                                      <TextField size="small" label="Subject" value={draft.subject || ""} onChange={(e) => setTemplateDrafts((prev) => ({ ...prev, [row.id]: { ...draft, subject: e.target.value } }))} sx={{ flex: 1 }} />
                                    </Stack>
                                    {preview ? (
                                      <Paper variant="outlined" sx={{ p: 1.25 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                          Rendered with sender identity: {preview.variables?.agent_name || resolvedPreviewAgentName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">{preview.subject}</Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>{preview.body}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                          Variables: {(preview.variables_used || []).join(", ") || "none"}
                                        </Typography>
                                        {!!(preview.missing_variables || []).length && (
                                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                            {(preview.missing_variables || []).map((variable) => (
                                              <Chip key={`${row.id}-${variable}`} size="small" color="warning" variant="outlined" label={`Missing ${variable}`} />
                                            ))}
                                          </Stack>
                                        )}
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                          Character count: {preview.character_count || 0}
                                        </Typography>
                                      </Paper>
                                    ) : null}
                                  </Stack>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
      ) : null}

      {workspaceView === "results" ? (
        <EmailSdrAnalyticsSection
          campaigns={campaigns}
          providerConnections={providerConnections}
          onOpenWorkspace={handleOpenCampaignWorkspace}
          onOpenLead={onOpenLead}
          showBanner={showBanner}
        />
      ) : null}

      {workspaceView === "setup" ? (
      <Paper sx={{ p: 2.5 }} ref={providerSectionRef}>
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: 0.8 }}>
            Required before sending
          </Typography>
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
      ) : null}

      {workspaceView === "setup" ? (
      <Paper sx={{ p: 2.5 }} ref={agentSectionRef}>
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: 0.8 }}>
            Required before sending
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Provider Connections</Typography>
          <Alert severity={overview.webhook_secret_configured ? "success" : "warning"} variant="outlined">
            Webhook protection stays env-driven. Email SDR uses <strong>EMAIL_SDR_WEBHOOK_SECRET</strong> from backend environment configuration, not from the admin UI.
          </Alert>
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
                            <Chip size="small" variant="outlined" label={`Adapter: ${row.adapter_key || row.provider || "generic"}`} />
                            <Chip size="small" variant="outlined" label={row.capabilities?.reply_webhook_supported ? "Reply webhook" : "Manual reply setup"} />
                            <Chip size="small" variant="outlined" label={row.capabilities?.bounce_webhook_supported ? "Bounce webhook" : "Manual bounce setup"} />
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
                          Webhook: {row.webhook_setup?.webhook_url} • Header: {row.webhook_setup?.required_header_name}{row.last_test_send_at ? ` • Last test send: ${new Date(row.last_test_send_at).toLocaleString()}` : ""}{row.capabilities?.manual_setup ? " • Manual setup" : ""}
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
      ) : null}

      {workspaceView === "setup" ? (
      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: 0.8 }}>
            Required before sending
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Email Agents</Typography>
          <Typography variant="body2" color="text.secondary">
            AI Email Agents are separate from AI calling reps. They control mailbox identity, warmup, and send windows.
          </Typography>
          <Alert severity="info" variant="outlined">
            Templates use <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700 }}>{`{{agent_name}}`}</Box> for the human-looking sender name. In real sends, that comes from the Email Agent display name. From name controls the inbox sender label when the provider supports it, and Signature is optional closing text for future use.
          </Alert>
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
            <TextField fullWidth label="From name" value={agentForm.from_name} onChange={(e) => setAgentForm((prev) => ({ ...prev, from_name: e.target.value }))} />
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
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Signature"
            value={agentForm.signature}
            onChange={(e) => setAgentForm((prev) => ({ ...prev, signature: e.target.value }))}
            helperText="Optional. Keep the template body using {{agent_name}}. Use this only if you want a reusable signature block later."
          />
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
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              Sender identity: {row.display_name || "Not set"} • From name: {row.from_name || "Not set"}
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
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                          <TextField size="small" label="Display" value={draft.display_name || ""} onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, display_name: e.target.value } }))} />
                          <TextField size="small" label="From name" value={draft.from_name || ""} onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, from_name: e.target.value } }))} />
                          <TextField size="small" label="From email" value={draft.from_email || ""} onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, from_email: e.target.value } }))} />
                          <TextField size="small" label="Reply-To" value={draft.reply_to_email || ""} onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, reply_to_email: e.target.value } }))} />
                          <TextField size="small" label="Daily limit" type="number" value={draft.daily_limit || ""} onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, daily_limit: e.target.value } }))} sx={{ width: 120 }} />
                          <TextField
                            size="small"
                            label="Timezone"
                            value={draft.timezone || ""}
                            onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, timezone: e.target.value } }))}
                            sx={{ minWidth: 180 }}
                          />
                          <TextField
                            size="small"
                            label="Window start"
                            type="time"
                            value={draft.send_window_start || ""}
                            onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, send_window_start: e.target.value } }))}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 150 }}
                          />
                          <TextField
                            size="small"
                            label="Window end"
                            type="time"
                            value={draft.send_window_end || ""}
                            onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, send_window_end: e.target.value } }))}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 150 }}
                          />
                        </Stack>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          minRows={2}
                          label="Signature"
                          value={draft.signature || ""}
                          onChange={(e) => setAgentDrafts((prev) => ({ ...prev, [row.id]: { ...draft, signature: e.target.value } }))}
                        />
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
      ) : null}

      {workspaceView === "setup" ? (
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
      ) : null}

      {workspaceView === "setup" ? (
      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: 0.8 }}>
            Lead sources
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Marketing Chatbot Leads Shortcut</Typography>
          <Typography variant="body2" color="text.secondary">
            Marketing website leads land in Sales CRM and can be routed into Email SDR after consent and targeting review.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
            <Chip size="small" variant="outlined" label={`${visibleMarketingWidgetLeads.length} marketing widget lead(s)`} />
            <Chip size="small" color={marketingConsentOnly ? "success" : "default"} variant="outlined" label={marketingConsentOnly ? "Consent filter on" : "Showing all leads"} />
            <Button variant="outlined" onClick={() => setWorkspaceView("action")}>Open Action Queue</Button>
          </Stack>
        </Stack>
      </Paper>
      ) : null}

      {workspaceView === "setup" ? (
      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: 0.8 }}>
            Required before sending
          </Typography>
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
      ) : null}

      {workspaceView === "control" ? (
      <Paper sx={{ p: 2.5 }} ref={campaignQueueRef}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Campaign Queue</Typography>
          {archivedCampaignCount ? (
            <Typography variant="caption" color="text.secondary">
              Archived campaigns hidden from this queue: {archivedCampaignCount}
            </Typography>
          ) : null}
          {!visibleCampaigns.length ? (
            <Alert severity="info" variant="outlined">No email campaigns yet.</Alert>
          ) : (
            <List disablePadding>
              {visibleCampaigns.map((campaign) => {
                const preview = campaignPreviews[campaign.id];
                const analyticsRow = campaignAnalytics[campaign.id];
                const campaignSummary = campaignRowSummaryById[campaign.id] || {};
                const automationSummary = getCampaignAutomationSummary(campaign);
                const nextStepLabel = getCampaignNextStep(campaign, preview);
                const hasSendHistory =
                  campaignCount(campaign, "sent") +
                    campaignCount(campaign, "delivered") +
                    campaignCount(campaign, "replied") +
                    campaignCount(campaign, "bounced") +
                    campaignCount(campaign, "failed") >
                  0;
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
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Sender identity: {campaignSummary.senderLine || "No sender identity configured yet"}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {campaignSummary.latestConversationLine
                                ? `${campaignSummary.latestConversationType === "reply" ? "Latest reply" : "Latest message"}: ${compactMessageBody(campaignSummary.latestConversationLine, 180)}`
                                : "Latest conversation: No replies yet for this campaign."}
                            </Typography>
                            {campaignSummary.latestConversationSender ? (
                              <Typography variant="caption" color="text.secondary">
                                {campaignSummary.latestConversationSender}
                              </Typography>
                            ) : null}
                            {campaign.import_batch_name ? (
                              <Typography variant="caption" color="text.secondary">
                                Import batch: {campaign.import_batch_name}
                              </Typography>
                            ) : null}
                          </Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip size="small" variant="outlined" label={`Drafts: ${campaign.message_counts?.draft || 0}`} />
                            <Chip size="small" variant="outlined" label={`Approved: ${campaign.message_counts?.approved || 0}`} />
                            <Chip size="small" variant="outlined" label={`Sent: ${campaign.result_counters?.sent || 0}`} />
                            <Chip size="small" variant="outlined" label={`Delivered: ${campaign.result_counters?.delivered || 0}`} />
                            <Chip size="small" variant="outlined" label={`No reply yet: ${campaign.result_counters?.no_reply_yet || 0}`} />
                            <Chip size="small" color="info" variant="outlined" label={`Replies: ${campaign.result_counters?.replies || 0}`} />
                            <Chip size="small" color="success" variant="outlined" label={`Hot leads: ${campaign.result_counters?.hot_leads || 0}`} />
                            <Chip size="small" color="success" variant="outlined" label={`Positive: ${campaign.result_counters?.positive_replies || 0}`} />
                            <Chip size="small" color="warning" variant="outlined" label={`Negative: ${campaign.result_counters?.negative_replies || 0}`} />
                            <Chip size="small" color="warning" variant="outlined" label={`Not now: ${campaign.result_counters?.not_now || 0}`} />
                            <Chip size="small" color="warning" variant="outlined" label={`Wrong contact: ${campaign.result_counters?.wrong_contact || 0}`} />
                            <Chip size="small" color="warning" variant="outlined" label={`Needs action: ${campaign.result_counters?.needs_action || 0}`} />
                            <Chip size="small" color="error" variant="outlined" label={`Bounced: ${campaign.result_counters?.bounced || 0}`} />
                            <Chip size="small" color="error" variant="outlined" label={`Unsubscribed: ${campaign.result_counters?.unsubscribed || 0}`} />
                            <Chip size="small" color="error" variant="outlined" label={`Unmatched: ${campaign.result_counters?.unmatched_replies || 0}`} />
                            <Chip size="small" variant="outlined" label={`Agents: ${(campaign.email_agent_ids || []).length || "auto"}`} />
                          </Stack>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                          {automationSummary.map((label) => (
                            <Chip key={`${campaign.id}-${label}`} size="small" color="info" variant="outlined" label={label} />
                          ))}
                          <Chip size="small" color="success" variant="outlined" label={`Next step: ${nextStepLabel}`} />
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleCampaignAction(campaign.id, "preview")}>
                            Preview targets
                          </Button>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handlePrepareCampaign(campaign.id)}>
                            Prepare
                          </Button>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleOpenCampaignWorkspace(campaign.id)}>
                            Open workspace
                          </Button>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleCampaignAction(campaign.id, "drafts")}>
                            Generate drafts
                          </Button>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleLoadCampaignAnalytics(campaign.id)}>
                            Analytics
                          </Button>
                          {pendingImportBatch ? (
                            <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleAttachImportBatchToCampaign(campaign.id, pendingImportBatch.id)}>
                              Use import batch
                            </Button>
                          ) : null}
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
                          <Button
                            variant="text"
                            size="small"
                            disabled={submitting}
                            onClick={() =>
                              handleSaveCampaignAutomation(campaign.id, {
                                auto_approve_drafts: campaign.auto_approve_drafts,
                                auto_send_approved: !campaign.auto_send_approved,
                                follow_up_mode: campaign.follow_up_mode,
                                max_sequence_steps: campaign.max_sequence_steps,
                              })
                            }
                          >
                            {campaign.auto_send_approved ? "Auto-send on" : "Auto-send off"}
                          </Button>
                          <Button
                            color="error"
                            variant="text"
                            size="small"
                            disabled={submitting}
                            onClick={() => handleDeleteCampaign(campaign)}
                          >
                            {hasSendHistory ? "Archive campaign" : "Delete campaign"}
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
      ) : null}

      {workspaceView === "setup" ? (
      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Email Agent Daily Limits</Typography>
          <Typography variant="body2" color="text.secondary">
            Keep warmup, paused state, and daily limits here. Campaign operations now happen in campaign workspace pages.
          </Typography>
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
      ) : null}

      {workspaceView === "action" ? (
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, backgroundColor: "rgba(248,250,252,0.8)" }}>
        <Stack spacing={1.5}>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: 0.8 }}>
            Work to do now
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Action Queue priorities</Typography>
          <Typography variant="body2" color="text.secondary">
            Work this queue from replies first, then hot leads, then campaign approvals. Open a campaign workspace as soon as you know which campaign the conversation belongs to.
          </Typography>
          <Tabs
            value={actionPanel}
            onChange={(_, nextValue) => setActionPanel(nextValue)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
              minHeight: 0,
              ".MuiTab-root": {
                minHeight: 0,
                py: 0.9,
                px: 1.5,
                textTransform: "none",
                fontWeight: 700,
                color: "#334155",
                borderRadius: 2,
                alignItems: "flex-start",
              },
              ".Mui-selected": {
                backgroundColor: "rgba(37,99,235,0.1)",
                color: "#1d4ed8 !important",
              },
            }}
          >
            {actionPanels.map((panel) => (
              <Tab
                key={panel.key}
                value={panel.key}
                label={`${panel.label} (${actionPanelCounts[panel.key] || 0})`}
              />
            ))}
          </Tabs>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap">
            <Chip size="small" variant="outlined" sx={{ color: "#0f172a" }} label={`New replies: ${newReplyEvents.length || 0}`} />
            <Chip size="small" variant="outlined" sx={{ color: "#0f172a" }} label={`Unmatched replies: ${unmatchedEvents.length || 0}`} />
            <Chip size="small" variant="outlined" sx={{ color: "#0f172a" }} label={`Needs action: ${needsActionEvents.length || 0}`} />
            <Chip size="small" variant="outlined" sx={{ color: "#0f172a" }} label={`Hot leads: ${hotLeads.length || 0}`} />
            <Chip size="small" variant="outlined" sx={{ color: "#0f172a" }} label={`Campaigns needing review: ${campaignReviewRows.length || 0}`} />
            <Chip size="small" variant="outlined" sx={{ color: "#0f172a" }} label={`Bounces/unsubs: ${bounceEvents.length || 0}`} />
          </Stack>
        </Stack>
      </Paper>
      ) : null}

      {workspaceView === "action" && actionPanel === "hot_leads" ? (
      <EmailSdrHotLeadsSection
        hotLeads={hotLeads.map((lead) => ({ ...lead, campaign_workspace_id: leadWorkspaceCampaignMap[lead.id] || null }))}
        reps={reps}
        myHotLeadsOnly={myHotLeadsOnly}
        setMyHotLeadsOnly={setMyHotLeadsOnly}
        onOpenLead={onOpenLead}
        onOpenWorkspace={handleOpenCampaignWorkspace}
        onAssign={handleAssignHotLead}
        onNextAction={handleSetHotLeadNextAction}
        onSnooze={handleSnoozeHotLead}
        onContacted={handleMarkHotLeadContacted}
        onCreateDeal={handleCreateHotLeadDeal}
        onClose={handleCloseHotLead}
      />
      ) : null}

      {workspaceView === "action" && actionPanel === "campaigns" ? (
      <EmailSdrCampaignReviewSection
        rows={campaignReviewRows}
        campaignSummaries={campaignRowSummaryById}
        onOpenWorkspace={handleOpenCampaignWorkspace}
        onApproveDrafts={(campaignId) => handleCampaignAction(campaignId, "approve")}
        onTakeNext={() => {
          const next = campaignReviewRows[0];
          if (next) handleOpenCampaignWorkspace(next.campaign.id);
        }}
      />
      ) : null}

      {workspaceView === "action" && actionPanel === "replies" ? (
      <EmailSdrReplyReviewSection
        newReplyRows={replyReviewRows.filter((row) => row.issues?.includes("needs_classification")).length ? replyReviewRows.filter((row) => row.issues?.includes("needs_classification")) : newReplyEvents.map((event) => ({ event, issues: ["needs_classification"] }))}
        unmatchedRows={unmatchedEvents.map((event) => ({ event, issues: ["unmatched_reply"] }))}
        bounceRows={bounceEvents.map((event) => ({ event, issues: [event.event_type] }))}
        needsActionRows={needsActionEvents.map((event) => ({ event, issues: ["hot_lead_follow_up"] }))}
        classificationOptions={classificationOptions}
        inboundReplyClass={inboundReplyClass}
        inboundReplyText={inboundReplyText}
        setInboundReplyClass={setInboundReplyClass}
        setInboundReplyText={setInboundReplyText}
        onClassify={handleClassifyInboundReply}
        onCopyReply={handleCopyReplyDraft}
        onMarkReplied={handleMarkReplySentManually}
        onMarkCalled={handleReplyMarkedCalled}
        onCreateDeal={handleReplyCreateDeal}
        onSnooze={handleReplySnooze}
        onUnsubscribe={handleReplyUnsubscribe}
        onOpenWorkspace={handleOpenCampaignWorkspace}
      />
      ) : null}

      {workspaceView === "action" && actionPanel === "messages" ? (
      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Email Messages</Typography>
            <Typography variant="body2" color="text.secondary">
              Use campaign workspaces for campaign-specific message history. This queue stays global.
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              size="small"
              label="Search messages"
              placeholder="Company, email, subject, agent"
              value={messageSearchTerm}
              onChange={(event) => setMessageSearchTerm(event.target.value)}
              sx={{ minWidth: 280 }}
            />
            <TextField
              size="small"
              select
              label="Status"
              value={messageStatusFilter}
              onChange={(event) => setMessageStatusFilter(event.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {["draft", "approved", "scheduled", "sent", "delivered", "replied", "bounced", "failed", "cancelled"].map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </TextField>
          </Stack>
          {!messages.length ? (
            <Alert severity="info" variant="outlined">No email messages yet.</Alert>
          ) : !filteredMessages.length ? (
            <Alert severity="info" variant="outlined">No email messages match the current filters.</Alert>
          ) : (
            <Stack spacing={1.25}>
              {visibleMessages.map((message) => {
                const displayBody = editableStatuses.has(message.status)
                  ? (message.body || "")
                  : (message.rendered_body || message.body || "");
                const draft = messageDraftState[message.id] || {
                  subject: message.subject,
                  body: displayBody,
                  scheduled_for: message.scheduled_for || "",
                  status: message.status,
                };
                const editable = editableStatuses.has(message.status);
                return (
                  <Accordion key={message.id} disableGutters variant="outlined" sx={{ borderRadius: 2, "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
                        <Typography variant="body2" color="text.secondary">
                          {message.subject || "No subject"}
                        </Typography>
                        <Typography variant="body2">
                          {compactMessageBody(displayBody)}
                        </Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1.25}>
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
                    </AccordionDetails>
                  </Accordion>
                );
              })}
              {messagePageCount > 1 ? (
                <Stack alignItems="flex-end">
                  <Pagination size="small" page={messagePage} count={messagePageCount} onChange={(_, nextPage) => setMessagePage(nextPage)} />
                </Stack>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Paper>
      ) : null}


      {workspaceView === "action" && actionPanel === "marketing" ? (
      <EmailSdrMarketingLeadsSection
        leads={visibleMarketingWidgetLeads}
        consentOnly={marketingConsentOnly}
        setConsentOnly={setMarketingConsentOnly}
        onOpenLead={onOpenLead}
      />
      ) : null}

      {workspaceView === "setup" ? (
      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: 0.8 }}>
            Targeting setup
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Routing Rules</Typography>
          <Typography variant="body2" color="text.secondary">
            Suggest the next Email SDR step for new marketing widget leads. Rules do not auto-send or auto-enroll.
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="Rule name" value={routingRuleForm.name} onChange={(e) => setRoutingRuleForm((prev) => ({ ...prev, name: e.target.value }))} />
            <TextField fullWidth label="Business type" value={routingRuleForm.business_type} onChange={(e) => setRoutingRuleForm((prev) => ({ ...prev, business_type: e.target.value }))} />
            <TextField fullWidth label="City" value={routingRuleForm.city} onChange={(e) => setRoutingRuleForm((prev) => ({ ...prev, city: e.target.value }))} />
            <TextField label="Priority" type="number" value={routingRuleForm.priority} onChange={(e) => setRoutingRuleForm((prev) => ({ ...prev, priority: e.target.value }))} sx={{ minWidth: 120 }} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField select label="Source type" value={routingRuleForm.source_type} onChange={(e) => setRoutingRuleForm((prev) => ({ ...prev, source_type: e.target.value }))} sx={{ minWidth: 220 }}>
              <MenuItem value="website_chatbot">website_chatbot</MenuItem>
            </TextField>
            <TextField select label="Target segment" value={routingRuleForm.target_segment_id} onChange={(e) => setRoutingRuleForm((prev) => ({ ...prev, target_segment_id: e.target.value }))} sx={{ minWidth: 220 }}>
              <MenuItem value="">None</MenuItem>
              {segments.map((segment) => <MenuItem key={segment.id} value={segment.id}>{segment.name}</MenuItem>)}
            </TextField>
            <TextField select label="Suggested campaign" value={routingRuleForm.suggested_campaign_id} onChange={(e) => setRoutingRuleForm((prev) => ({ ...prev, suggested_campaign_id: e.target.value }))} sx={{ minWidth: 220 }}>
              <MenuItem value="">None</MenuItem>
              {campaigns.map((campaign) => <MenuItem key={campaign.id} value={campaign.id}>{campaign.name}</MenuItem>)}
            </TextField>
            <TextField select label="Suggested template" value={routingRuleForm.suggested_template_id} onChange={(e) => setRoutingRuleForm((prev) => ({ ...prev, suggested_template_id: e.target.value }))} sx={{ minWidth: 220 }}>
              <MenuItem value="">None</MenuItem>
              {templates.map((template) => <MenuItem key={template.id} value={template.id}>{template.name}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption">Consent required</Typography>
              <Switch checked={routingRuleForm.consent_required} onChange={(e) => setRoutingRuleForm((prev) => ({ ...prev, consent_required: e.target.checked }))} />
            </Stack>
            <Button variant="contained" onClick={handleCreateRoutingRule} disabled={submitting || !routingRuleForm.name}>Add rule</Button>
          </Stack>
          {!routingRules.length ? (
            <Alert severity="info" variant="outlined">No routing rules configured yet.</Alert>
          ) : (
            <List disablePadding>
              {routingRules.map((rule) => (
                <React.Fragment key={`rule-${rule.id}`}>
                  <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ width: "100%" }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{rule.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {rule.source_type || "any source"}{rule.business_type ? ` • ${rule.business_type}` : ""}{rule.city ? ` • ${rule.city}` : ""} • priority {rule.priority}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Segment: {rule.target_segment_name || "none"} • Campaign: {rule.suggested_campaign_name || "none"} • Template: {rule.suggested_template_name || "none"}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip size="small" color={rule.active ? "success" : "default"} variant="outlined" label={rule.active ? "Active" : "Paused"} />
                        <Button size="small" variant="outlined" onClick={() => handleToggleRoutingRule(rule.id, rule.active)} disabled={submitting}>
                          {rule.active ? "Pause" : "Activate"}
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
      ) : null}

            </>
          )}

      <EmailSdrLaunchWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        wizardStep={wizardStep}
        setWizardStep={setWizardStep}
        launchWizardSteps={launchWizardSteps}
        providerConnections={providerConnections}
        emailAgents={emailAgents}
        templatePacks={templatePacks}
        wizardTemplateOptions={wizardTemplateOptions}
        wizardState={wizardState}
        setWizardState={setWizardState}
        previewValues={previewValues}
        setPreviewValues={setPreviewValues}
        resolvedPreviewAgentName={resolvedPreviewAgentName}
        selectedWizardAgent={selectedWizardAgent}
        selectedWizardAgents={selectedWizardAgentMetrics}
        wizardCapacityPreview={wizardCapacityPreview}
        wizardPreview={wizardPreview}
        wizardResult={wizardResult}
        handleWizardBusinessTypeChange={handleWizardBusinessTypeChange}
        syncAutoCampaignName={syncAutoCampaignName}
        loadTemplatePreviewSilently={loadTemplatePreviewSilently}
        templatePreviews={templatePreviews}
        handlePreviewTemplate={handlePreviewTemplate}
        segments={segments}
        submitting={submitting}
        handleWizardPreview={handleWizardPreview}
        handleWizardGenerate={handleWizardGenerate}
        handleWizardApprove={handleWizardApprove}
        handleWizardSend={handleWizardSend}
      />

      {loading ? (
        <Alert severity="info" variant="outlined">Loading Email SDR workspace…</Alert>
      ) : null}
    </Stack>
  );
}
