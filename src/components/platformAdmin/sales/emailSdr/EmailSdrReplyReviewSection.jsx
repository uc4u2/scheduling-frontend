import React from "react";
import { Alert, Button, Chip, Divider, List, ListItem, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";

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

  return (
    <React.Fragment key={`reply-engine-${event.id}`}>
      <ListItem id={`reply-review-${event.id}`} disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
        <Stack spacing={1.25} sx={{ width: "100%" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
            <BoxLike
              title={matchedLead.company_name || event.from_email || "Inbound reply"}
              subtitle={[
                matchedLead.contact_name || null,
                matchedLead.email || event.from_email || null,
                matchedMessage.campaign_name || null,
              ].filter(Boolean).join(" • ")}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-start">
              {issues.map((issue) => (
                <Chip key={`${event.id}-${issue}`} size="small" variant="outlined" label={issue} />
              ))}
              {event.suggested_classification ? (
                <Chip
                  size="small"
                  color="info"
                  variant="outlined"
                  label={`Suggest: ${event.suggested_classification}${event.suggested_confidence ? ` (${Math.round(event.suggested_confidence * 100)}%)` : ""}`}
                />
              ) : null}
              {event.suggested_next_action ? (
                <Chip size="small" color="secondary" variant="outlined" label={`Next: ${event.suggested_next_action}`} />
              ) : null}
            </Stack>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Original: {matchedMessage.subject || "No original message"}{matchedMessage.sent_at ? ` • sent ${matchedMessage.sent_at}` : ""}
          </Typography>
          <TextField size="small" fullWidth multiline minRows={3} label="Reply text" value={event.body_text || ""} disabled />
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
          ) : null}
          {showClassify ? (
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
          ) : null}
        </Stack>
      </ListItem>
      <Divider />
    </React.Fragment>
  );
}

function BoxLike({ title, subtitle }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
      {subtitle ? <Typography variant="body2" color="text.secondary">{subtitle}</Typography> : null}
    </Stack>
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
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
          <Chip size="small" variant="outlined" label={`${rows.length}`} />
        </Stack>
        {!rows.length ? (
          <Alert severity={severity} variant="outlined">{emptyLabel}</Alert>
        ) : (
          <List disablePadding>
            {rows.map((row) => (
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
          </List>
        )}
      </Stack>
    </Paper>
  );
}

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
  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Reply Engine</Typography>
        <Typography variant="body2" color="text.secondary">
          Work new replies first, then resolve unmatched replies, then monitor negative events and hot-lead follow-up work.
        </Typography>
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
        />
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
        />
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
        />
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
        />
      </Stack>
    </Paper>
  );
}
