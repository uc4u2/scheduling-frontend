import React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Button, Paper, Stack, Typography } from "@mui/material";

const toneStyles = (theme, tone) => {
  switch (tone) {
    case "success":
      return { color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.08) };
    case "warning":
      return { color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.1) };
    case "info":
      return { color: theme.palette.info.main, bg: alpha(theme.palette.info.main, 0.1) };
    case "neutral":
      return { color: theme.palette.text.primary, bg: alpha(theme.palette.text.primary, 0.04) };
    case "primary":
    default:
      return { color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.1) };
  }
};

export default function PredictionStatCard({
  label,
  value,
  helper,
  icon,
  tone = "primary",
  actionLabel,
  onAction,
}) {
  const theme = useTheme();
  const styles = toneStyles(theme, tone);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: { xs: 2, sm: 2.5 },
        border: "1px solid",
        borderColor: "divider",
        background: `linear-gradient(180deg, ${styles.bg} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
        height: "100%",
      }}
    >
      <Stack spacing={1.25} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: { xs: "0.68rem", sm: "0.75rem" }, lineHeight: 1.2 }}>
            {label}
          </Typography>
          {icon ? <Stack sx={{ color: styles.color }}>{icon}</Stack> : null}
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 700, color: styles.color, fontSize: { xs: "2rem", sm: "2.125rem" } }}>
          {value}
        </Typography>
        {helper ? (
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, fontSize: { xs: "0.95rem", sm: "0.875rem" } }}>
            {helper}
          </Typography>
        ) : <span />}
        {actionLabel && onAction ? (
          <Button variant="text" onClick={onAction} sx={{ alignSelf: "flex-start", px: 0 }}>
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
