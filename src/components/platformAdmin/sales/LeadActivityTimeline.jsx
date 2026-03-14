import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

function formatDateTime(value) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

export default function LeadActivityTimeline({ activity = [] }) {
  if (!activity.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No lead activity yet.
      </Typography>
    );
  }

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
        </Box>
      ))}
    </Stack>
  );
}
