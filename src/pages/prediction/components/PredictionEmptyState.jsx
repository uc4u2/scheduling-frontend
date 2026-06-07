import React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Button, Paper, Stack, Typography } from "@mui/material";

export default function PredictionEmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon,
}) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.16),
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
      }}
    >
      <Stack spacing={1.5} alignItems="flex-start">
        {icon || null}
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {body}
        </Typography>
        {actionLabel && onAction ? (
          <Button variant="contained" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
