import React, { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const PAGE_SIZE = 5;

function normalizeSearch(value) {
  return String(value || "").toLowerCase();
}

function compactText(value, max = 240) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "No content.";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function SectionPagination({ page, setPage, pageCount }) {
  if (pageCount <= 1) return null;
  return (
    <Stack alignItems="flex-end">
      <Pagination size="small" page={page} count={pageCount} onChange={(_, nextPage) => setPage(nextPage)} />
    </Stack>
  );
}

function RepliesTab({
  replies = [],
  classificationOptions = [],
  inboundReplyClass = {},
  inboundReplyText = {},
  setInboundReplyClass,
  setInboundReplyText,
  onClassify,
  onCopyReply,
  onMarkReplied,
  onMarkCalled,
  onCreateDeal,
  onReplySnooze,
  onUnsubscribe,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredReplies = useMemo(() => {
    const q = normalizeSearch(searchTerm);
    if (!q) return replies;
    return replies.filter((row) => normalizeSearch([
      row.company_name,
      row.contact_name,
      row.email,
      row.reply_text,
      row.original_subject,
      row.sender_agent_name,
      row.from_email,
      row.suggested_classification,
      row.suggested_next_action,
      row.suggested_reply_subject,
      row.suggested_reply_body,
    ].filter(Boolean).join(" ")).includes(q));
  }, [replies, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredReplies.length / PAGE_SIZE));
  const visibleReplies = filteredReplies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, replies.length]);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        label="Search replies"
        placeholder="Company, email, reply text, subject, sender"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        sx={{ maxWidth: 420 }}
      />
      {!filteredReplies.length ? (
        <Alert severity="info" variant="outlined">No replies for this campaign yet.</Alert>
      ) : (
        <Stack spacing={1.25}>
          {visibleReplies.map((row) => {
            const isClassified = row.classification_status === "classified";
            const adaptedEvent = {
              id: row.inbound_event_id,
              matched_lead: { id: row.lead_id },
              latest_classification: {
                classification: row.suggested_classification,
                confidence: row.suggested_confidence ? row.suggested_confidence / 100 : undefined,
                suggested_next_action: row.suggested_next_action,
                draft_reply_subject: row.suggested_reply_subject,
                draft_reply_body: row.suggested_reply_body,
              },
            };
            const selectedClass = inboundReplyClass[row.inbound_event_id] || row.suggested_classification || "";
            const selectedText = inboundReplyText[row.inbound_event_id] || "";
            return (
              <Accordion key={`campaign-reply-${row.inbound_event_id}`} disableGutters variant="outlined" sx={{ borderRadius: 2, "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack spacing={1} sx={{ width: "100%" }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.company_name || row.email || "Reply"}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {[row.contact_name, row.email, row.sender_agent_name, row.from_email].filter(Boolean).join(" • ")}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip size="small" variant="outlined" label={row.classification_status || "pending"} />
                        {row.suggested_classification ? <Chip size="small" color="info" variant="outlined" label={row.suggested_classification} /> : null}
                        {row.suggested_next_action ? <Chip size="small" color="secondary" variant="outlined" label={`Next: ${row.suggested_next_action}`} /> : null}
                      </Stack>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Original: {row.original_subject || "No original subject"} • {formatDateTime(row.replied_at)}
                    </Typography>
                    <Typography variant="body2">{compactText(row.reply_text)}</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    <TextField size="small" fullWidth multiline minRows={4} label="Reply text" value={row.reply_text || ""} disabled />
                    {!isClassified ? (
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                        <TextField
                          select
                          size="small"
                          label="Classification"
                          value={selectedClass}
                          onChange={(event) => setInboundReplyClass((prev) => ({ ...prev, [row.inbound_event_id]: event.target.value }))}
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
                          value={selectedText}
                          onChange={(event) => setInboundReplyText((prev) => ({ ...prev, [row.inbound_event_id]: event.target.value }))}
                        />
                        <Button variant="outlined" size="small" disabled={!selectedClass} onClick={() => onClassify?.(row.inbound_event_id, row.suggested_classification)}>
                          Classify
                        </Button>
                      </Stack>
                    ) : (
                      <>
                        {row.suggested_reply_subject ? (
                          <TextField size="small" fullWidth label="Suggested reply subject" value={row.suggested_reply_subject || ""} disabled />
                        ) : null}
                        {row.suggested_reply_body ? (
                          <TextField size="small" fullWidth multiline minRows={4} label="Suggested reply draft" value={row.suggested_reply_body || ""} disabled />
                        ) : null}
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                          <Button variant="outlined" size="small" disabled={!row.suggested_reply_body} onClick={() => onCopyReply?.(adaptedEvent)}>
                            Copy reply
                          </Button>
                          <Button variant="outlined" size="small" onClick={() => onMarkReplied?.(adaptedEvent)}>
                            Mark replied manually
                          </Button>
                          <Button variant="outlined" size="small" onClick={() => onMarkCalled?.(adaptedEvent)}>
                            Mark called
                          </Button>
                          <Button variant="outlined" size="small" onClick={() => onCreateDeal?.(adaptedEvent)}>
                            Create deal
                          </Button>
                          <Button variant="outlined" size="small" onClick={() => onReplySnooze?.(adaptedEvent)}>
                            Snooze
                          </Button>
                          <Button color="warning" variant="outlined" size="small" onClick={() => onUnsubscribe?.(adaptedEvent)}>
                            Unsubscribe
                          </Button>
                        </Stack>
                      </>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })}
          <SectionPagination page={page} setPage={setPage} pageCount={pageCount} />
        </Stack>
      )}
    </Stack>
  );
}

function HotLeadsTab({
  hotLeads = [],
  reps = [],
  onAssign,
  onNextAction,
  onSnooze,
  onContacted,
  onCreateDeal,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const filteredLeads = useMemo(() => {
    const q = normalizeSearch(searchTerm);
    if (!q) return hotLeads;
    return hotLeads.filter((row) => normalizeSearch([
      row.company_name,
      row.contact_name,
      row.email,
      row.reply_status,
      row.hot_lead_status,
      row.hot_lead_next_action_type,
      row.owner?.name,
      row.last_reply_text,
      row.suggested_reply?.body,
    ].filter(Boolean).join(" ")).includes(q));
  }, [hotLeads, searchTerm]);
  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const visibleLeads = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, hotLeads.length]);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        label="Search hot leads"
        placeholder="Company, contact, owner, next action"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        sx={{ maxWidth: 420 }}
      />
      {!filteredLeads.length ? (
        <Alert severity="info" variant="outlined">No hot leads for this campaign yet.</Alert>
      ) : (
        <Stack spacing={1.25}>
          {visibleLeads.map((row) => (
            <Accordion key={`campaign-hotlead-${row.lead_id}`} disableGutters variant="outlined" sx={{ borderRadius: 2, "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack spacing={1} sx={{ width: "100%" }}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.company_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {[row.contact_name, row.email, row.reply_status || "positive"].filter(Boolean).join(" • ")}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip size="small" variant="outlined" label={`Owner: ${row.owner?.name || "Unassigned"}`} />
                      <Chip size="small" variant="outlined" label={`Status: ${row.hot_lead_status || "new"}`} />
                      {row.hot_lead_next_action_type ? <Chip size="small" color="secondary" variant="outlined" label={row.hot_lead_next_action_type} /> : null}
                    </Stack>
                  </Stack>
                  <Typography variant="body2">{compactText(row.last_reply_text)}</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.25}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
                    <TextField
                      select
                      size="small"
                      label="Owner"
                      value={row.owner?.id || ""}
                      onChange={(event) => onAssign?.(row.lead_id, event.target.value)}
                      sx={{ minWidth: 220 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {reps.map((rep) => (
                        <MenuItem key={rep.id} value={rep.id}>{rep.full_name}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      type="datetime-local"
                      label="Next action"
                      value={row.next_action_at ? String(row.next_action_at).replace("Z", "").slice(0, 16) : ""}
                      onChange={(event) => onNextAction?.(row.lead_id, event.target.value ? new Date(event.target.value).toISOString() : "")}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 220 }}
                    />
                    <Button size="small" variant="outlined" onClick={() => onSnooze?.(row.lead_id, "tomorrow")}>Tomorrow</Button>
                    <Button size="small" variant="outlined" onClick={() => onSnooze?.(row.lead_id, "3_days")}>3 days</Button>
                  </Stack>
                  {row.suggested_reply?.body ? (
                    <>
                      {row.suggested_reply?.subject ? <TextField size="small" fullWidth label="Suggested reply subject" value={row.suggested_reply.subject} disabled /> : null}
                      <TextField size="small" fullWidth multiline minRows={4} label="Suggested reply draft" value={row.suggested_reply.body} disabled />
                    </>
                  ) : null}
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                    <Button variant="outlined" size="small" onClick={() => onContacted?.(row.lead_id)}>Mark contacted</Button>
                    <Button variant="outlined" size="small" onClick={() => onCreateDeal?.(row.lead_id)}>Create deal</Button>
                    <Button variant="text" size="small" color="error" onClick={() => onClose?.(row.lead_id)}>Close</Button>
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
          <SectionPagination page={page} setPage={setPage} pageCount={pageCount} />
        </Stack>
      )}
    </Stack>
  );
}

function MessagesTab({ messages = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const filteredMessages = useMemo(() => {
    const q = normalizeSearch(searchTerm);
    return messages.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (!q) return true;
      return normalizeSearch([
        row.company_name,
        row.contact_name,
        row.email,
        row.subject,
        row.email_agent_name,
        row.from_email,
        row.provider,
        row.provider_message_id,
      ].filter(Boolean).join(" ")).includes(q);
    });
  }, [messages, searchTerm, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredMessages.length / PAGE_SIZE));
  const visibleMessages = filteredMessages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, messages.length]);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
        <TextField
          size="small"
          label="Search messages"
          placeholder="Company, subject, sender, provider"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          sx={{ minWidth: 320 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {["draft", "approved", "scheduled", "sent", "delivered", "replied", "bounced", "failed", "cancelled"].map((status) => (
            <MenuItem key={status} value={status}>{status}</MenuItem>
          ))}
        </TextField>
      </Stack>
      {!filteredMessages.length ? (
        <Alert severity="info" variant="outlined">No messages match the current campaign filters.</Alert>
      ) : (
        <Stack spacing={1.25}>
          {visibleMessages.map((row) => (
            <Accordion key={`campaign-message-${row.message_id}`} disableGutters variant="outlined" sx={{ borderRadius: 2, "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack spacing={1} sx={{ width: "100%" }}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.company_name || row.email || "Message"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {[row.email, row.email_agent_name, row.from_email, row.provider].filter(Boolean).join(" • ")}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip size="small" variant="outlined" label={row.status} />
                      {row.delivered_at ? <Chip size="small" color="success" variant="outlined" label="Delivered" /> : null}
                      {row.replied_at ? <Chip size="small" color="info" variant="outlined" label="Replied" /> : null}
                      {row.unsubscribe_used_at ? <Chip size="small" color="warning" variant="outlined" label="Unsubscribed" /> : null}
                    </Stack>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{row.subject || "No subject"}</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  <Typography variant="body2"><strong>Provider message id:</strong> {row.provider_message_id || "Not available"}</Typography>
                  <Typography variant="body2"><strong>Reply-To:</strong> {row.reply_to_email || "Default reply-to"}</Typography>
                  <Typography variant="body2"><strong>Sent:</strong> {formatDateTime(row.sent_at)}</Typography>
                  <Typography variant="body2"><strong>Delivered:</strong> {formatDateTime(row.delivered_at)}</Typography>
                  <Typography variant="body2"><strong>Replied:</strong> {formatDateTime(row.replied_at)}</Typography>
                  <Typography variant="body2"><strong>Bounced:</strong> {formatDateTime(row.bounced_at)}</Typography>
                  {row.unsubscribe_url ? (
                    <Typography variant="body2" sx={{ wordBreak: "break-all" }}><strong>Unsubscribe URL:</strong> {row.unsubscribe_url}</Typography>
                  ) : null}
                  <TextField size="small" fullWidth multiline minRows={4} label="Rendered body" value={row.rendered_body || ""} disabled />
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
          <SectionPagination page={page} setPage={setPage} pageCount={pageCount} />
        </Stack>
      )}
    </Stack>
  );
}

function AnalyticsTab({ overview = {}, analytics = {} }) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Chip size="small" variant="outlined" label={`Sent: ${overview.sent || 0}`} />
        <Chip size="small" variant="outlined" label={`Delivered: ${overview.delivered || 0}`} />
        <Chip size="small" color="info" variant="outlined" label={`Replies: ${overview.replies || 0}`} />
        <Chip size="small" color="success" variant="outlined" label={`Positive replies: ${overview.positive_replies || 0}`} />
        <Chip size="small" color="warning" variant="outlined" label={`Needs action: ${overview.needs_action || 0}`} />
        <Chip size="small" color="error" variant="outlined" label={`Bounced: ${overview.bounced || 0}`} />
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Campaign analytics</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip size="small" variant="outlined" label={`Reply rate: ${analytics.reply_rate || 0}%`} />
            <Chip size="small" variant="outlined" label={`Delivery rate: ${analytics.delivery_rate || 0}%`} />
            <Chip size="small" variant="outlined" label={`Bounce rate: ${analytics.bounce_rate || 0}%`} />
            <Chip size="small" variant="outlined" label={`Positive rate: ${analytics.positive_reply_rate || 0}%`} />
          </Stack>
          {(analytics.warnings || []).length ? (
            <Stack spacing={1}>
              {(analytics.warnings || []).map((warning) => (
                <Alert key={warning.code || warning.message} severity="warning" variant="outlined">
                  {warning.message || warning.code}
                </Alert>
              ))}
            </Stack>
          ) : (
            <Alert severity="success" variant="outlined">No campaign-specific warning thresholds are currently triggered.</Alert>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

const drawerTabs = [
  { key: "overview", label: "Overview" },
  { key: "replies", label: "Replies" },
  { key: "hot_leads", label: "Hot Leads" },
  { key: "messages", label: "Messages" },
  { key: "analytics", label: "Analytics" },
];

function CampaignWorkspacePanel({
  onClose,
  closeLabel = "Close",
  workspace,
  loading = false,
  reps = [],
  classificationOptions = [],
  inboundReplyClass = {},
  inboundReplyText = {},
  setInboundReplyClass,
  setInboundReplyText,
  onClassify,
  onCopyReply,
  onMarkReplied,
  onMarkCalled,
  onCreateDeal,
  onReplySnooze,
  onUnsubscribe,
  onAssignHotLead,
  onSetHotLeadNextAction,
  onHotLeadSnooze,
  onMarkHotLeadContacted,
  onCreateHotLeadDeal,
  onCloseHotLead,
}) {
  const [tab, setTab] = useState("overview");
  const campaign = workspace?.campaign || null;
  const overview = workspace?.overview || {};

  React.useEffect(() => {
    setTab("overview");
  }, [workspace?.campaign?.id]);

  return (
    <Stack spacing={0} sx={{ height: "100%" }}>
      <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
          <Stack spacing={0.75}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {campaign?.name || "Campaign workspace"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[campaign?.business_type || "Any business type", campaign?.city, campaign?.status, campaign?.provider_connection_name || campaign?.provider_connection?.name].filter(Boolean).join(" • ")}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip size="small" variant="outlined" label={`Sent: ${overview.sent || 0}`} />
            <Chip size="small" variant="outlined" label={`Replies: ${overview.replies || 0}`} />
            <Chip size="small" color="success" variant="outlined" label={`Hot leads: ${overview.hot_leads || 0}`} />
            <Chip size="small" color="warning" variant="outlined" label={`Needs action: ${overview.needs_action || 0}`} />
            <Button size="small" variant="outlined" onClick={onClose}>{closeLabel}</Button>
          </Stack>
        </Stack>
      </Box>
      <Box sx={{ px: 3, pt: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, nextValue) => setTab(nextValue)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ minHeight: 0, ".MuiTab-root": { minHeight: 0, py: 1 } }}
        >
          {drawerTabs.map((item) => (
            <Tab key={item.key} value={item.key} label={item.label} />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ p: 3, overflowY: "auto", flex: 1 }}>
        {loading ? <Alert severity="info" variant="outlined">Loading campaign workspace…</Alert> : null}
        {!loading && !campaign ? <Alert severity="info" variant="outlined">Choose a campaign to open its workspace.</Alert> : null}
        {!loading && campaign ? (
          <>
            {tab === "overview" ? (
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Campaign overview</Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip size="small" variant="outlined" label={`Sent: ${overview.sent || 0}`} />
                      <Chip size="small" variant="outlined" label={`Delivered: ${overview.delivered || 0}`} />
                      <Chip size="small" color="info" variant="outlined" label={`Replies: ${overview.replies || 0}`} />
                      <Chip size="small" color="success" variant="outlined" label={`Positive replies: ${overview.positive_replies || 0}`} />
                      <Chip size="small" color="success" variant="outlined" label={`Hot leads: ${overview.hot_leads || 0}`} />
                      <Chip size="small" color="warning" variant="outlined" label={`Needs action: ${overview.needs_action || 0}`} />
                      <Chip size="small" color="error" variant="outlined" label={`Bounced: ${overview.bounced || 0}`} />
                      <Chip size="small" color="error" variant="outlined" label={`Unsubscribed: ${overview.unsubscribed || 0}`} />
                      <Chip size="small" color="warning" variant="outlined" label={`Unmatched replies: ${overview.unmatched_replies || 0}`} />
                      <Chip size="small" variant="outlined" label={`No reply yet: ${overview.no_reply_yet || 0}`} />
                    </Stack>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Routing and sender setup</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Send window: {[campaign.send_window_start, campaign.send_window_end].filter(Boolean).join(" - ") || "Not set"}{campaign.timezone ? ` • ${campaign.timezone}` : ""}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Daily limit per agent: {campaign.daily_limit_per_agent || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Provider: {campaign.provider_connection?.name || campaign.provider_connection_name || "Fallback"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created: {formatDateTime(campaign.created_at)}
                    </Typography>
                    <Divider />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Selected email agents</Typography>
                    {(campaign.selected_email_agents || []).length ? (
                      <Stack spacing={1}>
                        {(campaign.selected_email_agents || []).map((agent) => (
                          <Paper key={`campaign-workspace-agent-${agent.sales_rep_id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{agent.display_name || agent.sales_rep_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {[agent.from_email, agent.provider_connection_name, agent.status].filter(Boolean).join(" • ")}
                            </Typography>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Alert severity="info" variant="outlined">No specific agent selection is stored on this campaign.</Alert>
                    )}
                  </Stack>
                </Paper>
              </Stack>
            ) : null}
            {tab === "replies" ? (
              <RepliesTab
                replies={workspace?.replies || []}
                classificationOptions={classificationOptions}
                inboundReplyClass={inboundReplyClass}
                inboundReplyText={inboundReplyText}
                setInboundReplyClass={setInboundReplyClass}
                setInboundReplyText={setInboundReplyText}
                onClassify={onClassify}
                onCopyReply={onCopyReply}
                onMarkReplied={onMarkReplied}
                onMarkCalled={onMarkCalled}
                onCreateDeal={onCreateDeal}
                onReplySnooze={onReplySnooze}
                onUnsubscribe={onUnsubscribe}
              />
            ) : null}
            {tab === "hot_leads" ? (
              <HotLeadsTab
                hotLeads={workspace?.hot_leads || []}
                reps={reps}
                onAssign={onAssignHotLead}
                onNextAction={onSetHotLeadNextAction}
                onSnooze={onHotLeadSnooze}
                onContacted={onMarkHotLeadContacted}
                onCreateDeal={onCreateHotLeadDeal}
                onClose={onCloseHotLead}
              />
            ) : null}
            {tab === "messages" ? <MessagesTab messages={workspace?.messages || []} /> : null}
            {tab === "analytics" ? <AnalyticsTab overview={overview} analytics={workspace?.analytics || {}} /> : null}
          </>
        ) : null}
      </Box>
    </Stack>
  );
}

export function EmailSdrCampaignWorkspacePage(props) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <CampaignWorkspacePanel {...props} closeLabel="Back to Email SDR" />
    </Paper>
  );
}

export default function EmailSdrCampaignWorkspaceDrawer({ open = false, onClose, ...rest }) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", lg: 1100 } } }}>
      <CampaignWorkspacePanel {...rest} onClose={onClose} />
    </Drawer>
  );
}
