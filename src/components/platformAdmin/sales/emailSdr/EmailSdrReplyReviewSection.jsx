import React, { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
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

function eventSearchBlob(event = {}) {
  const matchedLead = event.matched_lead || {};
  const matchedMessage = event.matched_message || {};
  const latest = event.latest_classification || {};
  return normalizeSearch([
    matchedLead.company_name,
    matchedLead.contact_name,
    matchedLead.email,
    event.from_email,
    event.to_email,
    matchedMessage.subject,
    matchedMessage.campaign_name,
    event.body_text,
    event.suggested_classification,
    event.suggested_next_action,
    latest.classification,
    latest.draft_reply_subject,
    latest.draft_reply_body,
  ].filter(Boolean).join(" "));
}

function replyExcerpt(value, max = 220) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "No reply text.";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function BoxLike({ title, subtitle }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
      {subtitle ? <Typography variant="body2" color="text.secondary">{subtitle}</Typography> : null}
    </Stack>
  );
}

function ReplyRow({
  event,
  issues = [],
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
  onSnooze,
  onUnsubscribe,
  showClassify = true,
}) {
  const matchedLead = event.matched_lead || {};
  const matchedMessage = event.matched_message || {};
  const latest = event.latest_classification || {};
  const selectedClass = inboundReplyClass[event.id] || event.suggested_classification || "";
  const selectedText = inboundReplyText[event.id] || "";
  const classificationLabel = latest.classification || event.suggested_classification || "pending";
  const nextActionLabel = latest.suggested_next_action || event.suggested_next_action || "review";

  return (
    <Accordion disableGutters variant="outlined" sx={{ borderRadius: 2, "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack spacing={1} sx={{ width: "100%" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
            <BoxLike
              title={matchedLead.company_name || event.from_email || "Inbound reply"}
              subtitle={[
                matchedLead.contact_name || null,
                matchedLead.email || event.from_email || null,
                matchedMessage.campaign_name || null,
              ].filter(Boolean).join(" • ")}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {issues.map((issue) => (
                <Chip key={`${event.id}-${issue}`} size="small" variant="outlined" label={issue} />
              ))}
              <Chip size="small" color="info" variant="outlined" label={classificationLabel} />
              <Chip size="small" color="secondary" variant="outlined" label={`Next: ${nextActionLabel}`} />
            </Stack>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Original: {matchedMessage.subject || "No original message"}{matchedMessage.sent_at ? ` • sent ${matchedMessage.sent_at}` : ""}
          </Typography>
          <Typography variant="body2">{replyExcerpt(event.body_text)}</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <TextField size="small" fullWidth multiline minRows={4} label="Reply text" value={event.body_text || ""} disabled />
          {!showClassify ? (
            <Stack spacing={1}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
                {latest.classification ? (
                  <Chip size="small" color="info" variant="outlined" label={`Classification: ${latest.classification}`} />
                ) : null}
                {latest.confidence ? (
                  <Chip size="small" variant="outlined" label={`Confidence: ${Math.round(latest.confidence * 100)}%`} />
                ) : null}
                {(latest.suggested_next_action || event.suggested_next_action) ? (
                  <Chip
                    size="small"
                    color="secondary"
                    variant="outlined"
                    label={`Suggested next action: ${latest.suggested_next_action || event.suggested_next_action}`}
                  />
                ) : null}
              </Stack>
              {(latest.draft_reply_subject || latest.draft_reply_body) ? (
                <>
                  <TextField size="small" fullWidth label="Suggested reply subject" value={latest.draft_reply_subject || ""} disabled />
                  <TextField size="small" fullWidth multiline minRows={4} label="Suggested reply draft" value={latest.draft_reply_body || ""} disabled />
                </>
              ) : null}
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                <Button variant="outlined" size="small" disabled={!(latest.draft_reply_subject || latest.draft_reply_body)} onClick={() => onCopyReply?.(event)}>
                  Copy reply
                </Button>
                <Button variant="outlined" size="small" onClick={() => onMarkReplied?.(event)}>
                  Mark replied manually
                </Button>
                <Button variant="outlined" size="small" onClick={() => onMarkCalled?.(event)}>
                  Mark called
                </Button>
                <Button variant="outlined" size="small" onClick={() => onCreateDeal?.(event)}>
                  Create deal
                </Button>
                <Button variant="outlined" size="small" onClick={() => onSnooze?.(event)}>
                  Snooze
                </Button>
                <Button color="warning" variant="outlined" size="small" onClick={() => onUnsubscribe?.(event)}>
                  Unsubscribe
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                select
                size="small"
                label="Classification"
                value={selectedClass}
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
                value={selectedText}
                onChange={(e) => setInboundReplyText((prev) => ({ ...prev, [event.id]: e.target.value }))}
              />
              <Button
                variant="outlined"
                size="small"
                disabled={!event.matched_message_id || !(inboundReplyClass[event.id] || event.suggested_classification)}
                onClick={() => onClassify?.(event.id, selectedClass)}
              >
                Classify
              </Button>
            </Stack>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function QueueBlock({
  title,
  emptyLabel,
  rows = [],
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
  onSnooze,
  onUnsubscribe,
  showClassify = true,
  severity = "info",
  searchTerm = "",
}) {
  const [page, setPage] = useState(1);
  const filteredRows = useMemo(() => {
    const q = normalizeSearch(searchTerm);
    if (!q) return rows;
    return rows.filter((row) => eventSearchBlob(row.event).includes(q));
  }, [rows, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, rows.length]);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" variant="outlined" label={`${filteredRows.length}`} />
            {filteredRows.length > PAGE_SIZE ? (
              <Typography variant="caption" color="text.secondary">Page {page} of {pageCount}</Typography>
            ) : null}
          </Stack>
        </Stack>
        {!filteredRows.length ? (
          <Alert severity={severity} variant="outlined">{emptyLabel}</Alert>
        ) : (
          <Stack spacing={1.25}>
            {visibleRows.map((row) => (
              <ReplyRow
                key={row.event.id}
                event={row.event}
                issues={row.issues || []}
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
                onSnooze={onSnooze}
                onUnsubscribe={onUnsubscribe}
                showClassify={showClassify}
              />
            ))}
            {pageCount > 1 ? (
              <Stack alignItems="flex-end">
                <Pagination size="small" page={page} count={pageCount} onChange={(_, nextPage) => setPage(nextPage)} />
              </Stack>
            ) : null}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

const queueTabs = [
  { key: "all", label: "All queues" },
  { key: "new", label: "New replies" },
  { key: "unmatched", label: "Unmatched" },
  { key: "needs", label: "Needs action" },
  { key: "bounce", label: "Bounces" },
];

export default function EmailSdrReplyReviewSection({
  newReplyRows = [],
  unmatchedRows = [],
  bounceRows = [],
  needsActionRows = [],
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
  onSnooze,
  onUnsubscribe,
}) {
  const [queueTab, setQueueTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Reply Engine</Typography>
        <Typography variant="body2" color="text.secondary">
          Work replies in compact queues, search by company, email, campaign, or reply text, then expand only the item you are actively working.
        </Typography>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems={{ lg: "center" }}>
          <Tabs
            value={queueTab}
            onChange={(_, nextValue) => setQueueTab(nextValue)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ minHeight: 0, ".MuiTab-root": { minHeight: 0, py: 0.75 } }}
          >
            {queueTabs.map((tab) => (
              <Tab key={tab.key} value={tab.key} label={tab.label} />
            ))}
          </Tabs>
          <TextField
            size="small"
            label="Search replies"
            placeholder="Company, contact, email, campaign, reply text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{ minWidth: { lg: 360 } }}
          />
        </Stack>
        {queueTab === "all" || queueTab === "new" ? (
          <QueueBlock
            title="New replies"
            emptyLabel="No replies are waiting for classification."
            rows={newReplyRows}
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
            onSnooze={onSnooze}
            onUnsubscribe={onUnsubscribe}
            showClassify
            severity="success"
            searchTerm={searchTerm}
          />
        ) : null}
        {queueTab === "all" || queueTab === "unmatched" ? (
          <QueueBlock
            title="Unmatched replies"
            emptyLabel="No unmatched replies."
            rows={unmatchedRows}
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
            onSnooze={onSnooze}
            onUnsubscribe={onUnsubscribe}
            showClassify={false}
            severity="info"
            searchTerm={searchTerm}
          />
        ) : null}
        {queueTab === "all" || queueTab === "bounce" ? (
          <QueueBlock
            title="Bounces & unsubscribes"
            emptyLabel="No bounce or unsubscribe events recorded."
            rows={bounceRows}
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
            onSnooze={onSnooze}
            onUnsubscribe={onUnsubscribe}
            showClassify={false}
            severity="info"
            searchTerm={searchTerm}
          />
        ) : null}
        {queueTab === "all" || queueTab === "needs" ? (
          <QueueBlock
            title="Needs action"
            emptyLabel="No classified positive replies need manual follow-up right now."
            rows={needsActionRows}
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
            onSnooze={onSnooze}
            onUnsubscribe={onUnsubscribe}
            showClassify={false}
            severity="info"
            searchTerm={searchTerm}
          />
        ) : null}
      </Stack>
    </Paper>
  );
}
