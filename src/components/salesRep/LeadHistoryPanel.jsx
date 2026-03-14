import React from "react";
import { List, ListItem, ListItemText, Paper, Stack, Typography, Chip } from "@mui/material";

function formatDateTime(value) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

export default function LeadHistoryPanel({ history = [] }) {
  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Recent History</Typography>
          <Typography variant="body2" color="text.secondary">
            Minimal recent actions from your queue activity.
          </Typography>
        </Stack>
        {!history.length ? (
          <Typography variant="body2" color="text.secondary">
            No recent queue activity yet. Submitted and skipped actions will appear here.
          </Typography>
        ) : (
          <List disablePadding>
            {history.map((item) => (
              <ListItem key={item.id} disableGutters divider>
                <ListItemText
                  primary={item.company_name || `Lead #${item.lead_id}`}
                  secondary={`${item.action_type}${item.outcome ? ` • ${item.outcome}` : ""} • ${formatDateTime(item.created_at)}`}
                />
                {item.callback_at ? <Chip size="small" label={`Callback ${formatDateTime(item.callback_at)}`} variant="outlined" /> : null}
              </ListItem>
            ))}
          </List>
        )}
      </Stack>
    </Paper>
  );
}
