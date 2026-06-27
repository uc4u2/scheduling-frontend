import React from "react";
import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";

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
              <Typography variant="caption" color="text.secondary">{String(row.date || "").slice(5)}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function EmailSdrAnalyticsSection({ analytics, comparison }) {
  const combinedRows = (analytics?.time_series || []).map((row) => ({
    ...row,
    combined: Number(row.bounces || 0) + Number(row.unsubscribes || 0),
  }));
  return (
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
        <Typography variant="caption" color="text.secondary">
          Last 7 days: {analytics?.last_7_days?.sent || 0} sent / {analytics?.last_7_days?.replied || 0} replies. Last 30 days: {analytics?.last_30_days?.sent || 0} sent / {analytics?.last_30_days?.replied || 0} replies.
        </Typography>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
          <TinySeriesChart title="Sent over time" rows={analytics?.time_series || []} metric="sent" color="#2563eb" />
          <TinySeriesChart title="Replies over time" rows={analytics?.time_series || []} metric="replies" color="#059669" />
          <TinySeriesChart title="Positive replies" rows={analytics?.time_series || []} metric="positive" color="#0f766e" />
          <TinySeriesChart title="Bounces / Unsubs" rows={combinedRows} metric="combined" color="#dc2626" />
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Campaign Comparison</Typography>
            {(comparison?.by_campaign || []).slice(0, 5).map((row) => (
              <Typography key={`cmp-${row.campaign_id}`} variant="body2" color="text.secondary">
                {row.name}: {row.sent} sent • {row.reply_rate}% reply • {row.bounce_rate}% bounce
              </Typography>
            ))}
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Provider Comparison</Typography>
            {(comparison?.by_provider || []).slice(0, 5).map((row) => (
              <Typography key={`prv-${row.provider_connection_id}`} variant="body2" color="text.secondary">
                {row.name}: {row.sent || 0} sent • {row.reply_rate || 0}% reply
              </Typography>
            ))}
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Agent Comparison</Typography>
            {(comparison?.by_agent || []).slice(0, 5).map((row) => (
              <Typography key={`agt-${row.email_agent_id}`} variant="body2" color="text.secondary">
                {row.email_agent_name || "Unassigned"}: {row.sent || 0} sent • {row.reply_rate || 0}% reply
              </Typography>
            ))}
          </Paper>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Alert severity="info" variant="outlined" sx={{ flex: 1 }}>
            Best reply rate: {comparison?.best_reply_rate?.campaign?.name || "n/a"} {comparison?.best_reply_rate ? `(${comparison.best_reply_rate.reply_rate}%)` : ""}
          </Alert>
          <Alert severity="warning" variant="outlined" sx={{ flex: 1 }}>
            Worst bounce rate: {comparison?.worst_bounce_rate?.campaign?.name || "n/a"} {comparison?.worst_bounce_rate ? `(${comparison.worst_bounce_rate.bounce_rate}%)` : ""}
          </Alert>
        </Stack>
      </Stack>
    </Paper>
  );
}
