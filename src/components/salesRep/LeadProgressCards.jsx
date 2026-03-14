import React from "react";
import { Grid, Paper, Stack, Typography } from "@mui/material";

const cards = [
  { key: "assigned_total", label: "Assigned Total" },
  { key: "submitted_today", label: "Submitted Today" },
  { key: "callbacks_due", label: "Callbacks Due" },
];

export default function LeadProgressCards({ progress }) {
  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid key={card.key} item xs={12} sm={4}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">{card.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{progress?.[card.key] ?? 0}</Typography>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
