import React from "react";
import { Alert, Paper, Stack, Typography } from "@mui/material";

export default function EmailSdrNeedsAttentionCard({ warnings = [] }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Needs Attention</Typography>
      {warnings.length ? (
        <Stack spacing={0.75} sx={{ mt: 1 }}>
          {warnings.slice(0, 6).map((warning) => (
            <Alert key={`ops-${warning.code}`} severity={warning.level === "warning" ? "warning" : "info"} variant="outlined">
              {warning.message}
            </Alert>
          ))}
        </Stack>
      ) : (
        <Alert severity="success" variant="outlined" sx={{ mt: 1 }}>
          No urgent Email SDR issues detected.
        </Alert>
      )}
    </Paper>
  );
}
