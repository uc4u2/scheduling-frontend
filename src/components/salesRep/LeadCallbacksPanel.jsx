import React from "react";
import { List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";

function formatDateTime(value) {
  if (!value) return "—";
  return formatDateTimeInTz(value, getUserTimezone()) || value;
}

export default function LeadCallbacksPanel({ callbacks = [] }) {
  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Callbacks Today</Typography>
          <Typography variant="body2" color="text.secondary">
            Your due follow-ups for today.
          </Typography>
        </Stack>
        {!callbacks.length ? (
          <Typography variant="body2" color="text.secondary">
            No callbacks due today. Follow-ups will appear here as soon as they are scheduled.
          </Typography>
        ) : (
          <List disablePadding>
            {callbacks.map((lead) => (
              <ListItem key={lead.id} disableGutters divider>
                <ListItemText
                  primary={lead.company_name}
                  secondary={`${lead.contact_name || "No contact"} • ${formatDateTime(lead.callback_at)}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Stack>
    </Paper>
  );
}
