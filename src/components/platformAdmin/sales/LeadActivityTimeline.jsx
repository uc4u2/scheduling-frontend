import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

function formatDateTime(value) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

function actorLabel(item, repNameById) {
  if (item.sales_rep_name) return item.sales_rep_name;
  if (item.sales_rep_id) return repNameById[String(item.sales_rep_id)] || `Rep #${item.sales_rep_id}`;
  if (item.admin_name) return item.admin_name;
  if (item.admin_id) return `Admin #${item.admin_id}`;
  return null;
}

function metaLines(item, repNameById) {
  const meta = item.meta && typeof item.meta === "object" && !Array.isArray(item.meta) ? item.meta : {};
  const lines = [];
  if (meta.attempt_number || meta.attempt_number_today) {
    lines.push(`Attempts: total ${meta.attempt_number || 0} · today ${meta.attempt_number_today || 0}`);
  }
  if (meta.reassignment_reason) {
    lines.push(`Reassignment reason: ${meta.reassignment_reason}`);
  }
  if (meta.previous_rep_id) {
    lines.push(`Previous rep: ${repNameById[String(meta.previous_rep_id)] || `Rep #${meta.previous_rep_id}`}`);
  }
  if (meta.suggested_outcome) {
    lines.push(`Suggested outcome: ${meta.suggested_outcome}`);
  }
  if (meta.twilio_status) {
    lines.push(`Twilio result: ${meta.twilio_status}`);
  }
  if (meta.rep_outcome) {
    lines.push(`Rep outcome: ${meta.rep_outcome}`);
  }
  if (meta.qa_outcome_match === true) {
    lines.push("QA outcome check: match");
  } else if (meta.qa_outcome_mismatch === true || meta.qa_outcome_match === false) {
    lines.push("QA outcome check: mismatch");
  }
  if (meta.call_duration) {
    lines.push(`Call duration: ${meta.call_duration}s`);
  }
  if (meta.call_sid) {
    lines.push(`Call SID: ${meta.call_sid}`);
  }
  if (meta.previous_state || meta.qa_review_state) {
    lines.push(`QA review state: ${meta.previous_state || "none"} -> ${meta.qa_review_state || "none"}`);
  }
  if (meta.stale_reason) {
    lines.push(`Stale reason: ${meta.stale_reason}`);
  }
  if (meta.strategy_state) {
    lines.push(`Strategy state: ${meta.strategy_state}`);
  }
  if (meta.throttle_until) {
    lines.push(`Throttle until: ${formatDateTime(meta.throttle_until)}`);
  }
  return lines;
}

export default function LeadActivityTimeline({ activity = [], reps = [] }) {
  if (!activity.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No lead activity yet.
      </Typography>
    );
  }

  const repNameById = {};
  reps.forEach((rep) => {
    repNameById[String(rep.id)] = rep.full_name;
  });

  return (
    <Stack spacing={1.5}>
      {activity.map((item) => (
        <Box
          key={item.id}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 1.5,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75, flexWrap: "wrap" }}>
            <Chip size="small" label={item.action_type || "activity"} variant="outlined" />
            {item.outcome ? <Chip size="small" label={item.outcome} color="primary" variant="outlined" /> : null}
            <Typography variant="caption" color="text.secondary">
              {formatDateTime(item.created_at)}
            </Typography>
          </Stack>
          {actorLabel(item, repNameById) ? (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Actor: {actorLabel(item, repNameById)}
            </Typography>
          ) : null}
          {item.note ? (
            <Typography variant="body2" sx={{ mb: item.callback_at ? 0.5 : 0 }}>
              {item.note}
            </Typography>
          ) : null}
          {item.callback_at ? (
            <Typography variant="caption" color="text.secondary">
              Callback: {formatDateTime(item.callback_at)}
            </Typography>
          ) : null}
          {metaLines(item, repNameById).map((line) => (
            <Typography key={line} variant="caption" color="text.secondary" display="block">
              {line}
            </Typography>
          ))}
        </Box>
      ))}
    </Stack>
  );
}
