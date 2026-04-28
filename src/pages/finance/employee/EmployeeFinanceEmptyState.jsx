import React from "react";
import { Paper, Stack, Typography, Button } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function EmployeeFinanceEmptyState({ title, description, actionLabel, onAction }) {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 1,
        textAlign: "center",
        borderStyle: "dashed",
        borderColor: alpha(theme.palette.divider, 0.9),
        backgroundColor: alpha(theme.palette.action.hover, 0.35),
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
          {description}
        </Typography>
        {actionLabel && onAction ? (
          <Button variant="contained" onClick={onAction}>{actionLabel}</Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
