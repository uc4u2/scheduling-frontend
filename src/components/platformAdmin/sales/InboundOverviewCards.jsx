import React from "react";
import { Grid, Paper, Stack, Typography } from "@mui/material";

const CARD_ROWS = [
  { key: "answered_today", label: "Answered Today" },
  { key: "missed_today", label: "Missed Today" },
  { key: "abandoned_today", label: "Abandoned Today" },
  { key: "voicemail_today", label: "Voicemail Today" },
  { key: "avg_wait_seconds_today", label: "Avg Wait (s)" },
];

export default function InboundOverviewCards({ overview }) {
  return (
    <Grid container spacing={2}>
      {CARD_ROWS.map((card) => (
        <Grid item xs={12} sm={6} md={4} lg key={card.key}>
          <Paper sx={{ p: 2.25, height: "100%" }}>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {Number(overview?.[card.key] || 0).toLocaleString()}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
