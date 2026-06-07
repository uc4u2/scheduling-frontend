import React from "react";
import { Paper, Typography } from "@mui/material";

export default function PredictionStreakCard({ streak }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
      <Typography variant="overline" color="text.secondary">Current streak</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>{streak?.current_streak ?? 0}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
        {streak?.label || "No active streak yet"}
      </Typography>
    </Paper>
  );
}
