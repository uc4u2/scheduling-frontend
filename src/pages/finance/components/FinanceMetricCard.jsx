import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function FinanceMetricCard({ label, value, helper, accent = "primary", action = null }) {
  const theme = useTheme();
  const tone = theme.palette[accent] || theme.palette.primary;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 1,
        borderColor: alpha(tone.main, 0.22),
        background: `linear-gradient(180deg, ${alpha(tone.main, 0.08)} 0%, ${alpha(
          theme.palette.background.paper,
          0.98
        )} 100%)`,
      }}
    >
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800}>
          {value}
        </Typography>
        {helper ? (
          <Typography variant="body2" color="text.secondary">
            {helper}
          </Typography>
        ) : null}
        {action ? <Box>{action}</Box> : null}
      </Stack>
    </Paper>
  );
}
