import React from "react";
import { Paper, Stack, Typography } from "@mui/material";

function metricCard(title, value, caption, color = "primary.main") {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, minWidth: 150, flex: 1 }}>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color, lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{caption}</Typography>
    </Paper>
  );
}

export default function EmailSdrDashboardCards({ opsSummary, overview }) {
  return (
    <>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} useFlexGap>
        {metricCard("Sent Today", opsSummary?.today?.sent || 0, "Outbound delivered from worker or manual send")}
        {metricCard("Replies", opsSummary?.today?.replies || 0, "Inbound replies needing review", "success.main")}
        {metricCard("Positive", opsSummary?.today?.positive || 0, "Manual follow-up queue", "success.dark")}
        {metricCard("Bounce", opsSummary?.today?.bounce || 0, "Watch deliverability", "error.main")}
        {metricCard("Unsubscribe", opsSummary?.today?.unsubscribe || 0, "Compliance / fit signal", "warning.main")}
        {metricCard("Hot Leads", opsSummary?.today?.hot_leads || 0, "Ready for manual handoff", "secondary.main")}
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
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Quick Totals</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Campaigns: {overview.campaigns_total || 0} • Drafts: {overview.draft_messages || 0} • Approved: {overview.approved_messages || 0}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scheduled: {overview.scheduled_messages || 0} • New replies: {overview.new_reply_events || 0} • Unmatched: {overview.unmatched_events || 0}
          </Typography>
        </Paper>
      </Stack>
    </>
  );
}
