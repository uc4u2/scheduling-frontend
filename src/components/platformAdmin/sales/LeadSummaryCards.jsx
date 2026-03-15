import React from "react";
import { Grid, Paper, Stack, Typography } from "@mui/material";

const cards = [
  { key: "total", label: "Total Leads" },
  { key: "callbacks_due", label: "Callbacks Due" },
  { key: "overdue_callbacks", label: "Overdue Callbacks" },
  { key: "stale_assigned", label: "Stale Assigned" },
  { key: "attempt_limited", label: "Attempt-Limited" },
  { key: "retry_cooldown_blocked", label: "Retry Cooldown Blocked" },
  { key: "company_throttle_active", label: "Company Throttle Active" },
  { key: "converted", label: "Converted" },
  { key: "duplicate", label: "Duplicate" },
  { key: "suppressed", label: "Suppressed" },
  { key: "assigned", label: "Assigned" },
];

export default function LeadSummaryCards({ summary }) {
  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid key={card.key} item xs={12} sm={6} lg={3}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {summary?.[card.key] ?? 0}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
