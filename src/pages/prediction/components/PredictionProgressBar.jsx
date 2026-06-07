import React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";

const clampPercent = (current, target) => {
  const safeCurrent = Number.isFinite(Number(current)) ? Number(current) : 0;
  const safeTarget = Number.isFinite(Number(target)) ? Number(target) : 0;
  if (safeTarget <= 0) return safeCurrent > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, (safeCurrent / safeTarget) * 100));
};

const toneColor = (theme, tone) => {
  switch (tone) {
    case "success":
      return theme.palette.success.main;
    case "warning":
      return theme.palette.warning.main;
    case "info":
      return theme.palette.info.main;
    case "neutral":
      return theme.palette.text.secondary;
    case "primary":
    default:
      return theme.palette.primary.main;
  }
};

export default function PredictionProgressBar({
  current = 0,
  target = 0,
  label = "",
  helper = "",
  tone = "primary",
  showNumbers = true,
}) {
  const theme = useTheme();
  const safeCurrent = Number.isFinite(Number(current)) ? Number(current) : 0;
  const safeTarget = Number.isFinite(Number(target)) ? Number(target) : 0;
  const percent = clampPercent(safeCurrent, safeTarget);
  const color = toneColor(theme, tone);
  const completed = safeTarget > 0 && safeCurrent >= safeTarget;

  return (
    <Stack spacing={0.75}>
      <Stack direction="row" justifyContent="space-between" spacing={1}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        {showNumbers ? (
          <Typography variant="body2" color="text.secondary">
            {safeTarget > 0 ? `${safeCurrent}/${safeTarget}` : `${safeCurrent}`}
          </Typography>
        ) : null}
      </Stack>
      <Box
        sx={{
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: alpha(color, 0.12),
        }}
      >
        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            height: 10,
            backgroundColor: "transparent",
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
              backgroundColor: color,
            },
          }}
        />
      </Box>
      {helper ? (
        <Typography variant="caption" color={completed ? "success.main" : "text.secondary"}>
          {helper}
        </Typography>
      ) : null}
    </Stack>
  );
}
