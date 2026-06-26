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
  approveEmailCampaign,
  assignEmailHotLeadToYousef,
  classifyEmailInboundEvent,
  classifyEmailReply,
  createEmailCampaign,
  createEmailSuppression,
  createSalesDealFromEmailHotLead,
  generateEmailCampaignDrafts,
  generateEmailCampaignFollowUps,
  getEmailSdrOverview,
  listEmailAgentLimitsToday,
  listEmailCampaigns,
  listEmailHotLeads,
  listEmailInboundEvents,
  listEmailMessages,
  listEmailSuppression,
  markEmailHotLeadContacted,
  pauseEmailCampaign,
  previewEmailCampaignLeads,
  runEmailSdrDueSend,
  sendEmailCampaign,
  updateEmailAgentLimitToday,
  updateEmailMessage,
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
  const [hotLeads, setHotLeads] = useState([]);
  const [suppression, setSuppression] = useState([]);
  const [agentLimits, setAgentLimits] = useState([]);
  const [newReplyEvents, setNewReplyEvents] = useState([]);
  const [unmatchedEvents, setUnmatchedEvents] = useState([]);
  const [bounceEvents, setBounceEvents] = useState([]);
  const [campaignPreviews, setCampaignPreviews] = useState({});
  const [campaignForm, setCampaignForm] = useState(emptyCampaignForm);
  const [messageReplyText, setMessageReplyText] = useState({});
  const [messageReplyClass, setMessageReplyClass] = useState({});
  const [inboundReplyText, setInboundReplyText] = useState({});
  const [inboundReplyClass, setInboundReplyClass] = useState({});
  const [messageDraftState, setMessageDraftState] = useState({});
  const [agentLimitDrafts, setAgentLimitDrafts] = useState({});
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
        campaignRows,
        messageRows,
        hotRows,
        suppressionRows,
        agentLimitRows,
        inboundReplyRows,
        unmatchedRows,
        bounceRows,
      ] = await Promise.all([
        getEmailSdrOverview(),
        listEmailCampaigns(),
        listEmailMessages(),
        listEmailHotLeads(),
        listEmailSuppression(),
        listEmailAgentLimitsToday(),
        listEmailInboundEvents({ queue: "new_replies", limit: 50 }),
        listEmailInboundEvents({ queue: "unmatched", limit: 50 }),
        listEmailInboundEvents({ queue: "bounces", limit: 50 }),
      ]);
      setOverview(overviewResp || {});
      setCampaigns(campaignRows || []);
      setMessages(messageRows || []);
      setHotLeads(hotRows || []);
      setSuppression(suppressionRows || []);
      setAgentLimits(agentLimitRows || []);
      setNewReplyEvents(inboundReplyRows || []);
      setUnmatchedEvents(unmatchedRows || []);
      setBounceEvents(bounceRows || []);
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
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip size="small" variant="outlined" label={`Drafts: ${campaign.message_counts?.draft || 0}`} />
                            <Chip size="small" variant="outlined" label={`Approved: ${campaign.message_counts?.approved || 0}`} />
                            <Chip size="small" variant="outlined" label={`Sent: ${campaign.message_counts?.sent || 0}`} />
                          </Stack>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleCampaignAction(campaign.id, "preview")}>
                            Preview targets
                          </Button>
                          <Button variant="outlined" size="small" disabled={submitting} onClick={() => handleCampaignAction(campaign.id, "drafts")}>
                            Generate drafts
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
