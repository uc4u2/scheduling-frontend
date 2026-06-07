import React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import heroCover from "../../../assets/prediction/hero-cover.png";

export default function PredictionHero({
  title = "Football Prediction Challenge 2026",
  subtitle = "Predict every matchday, climb the leaderboard, invite friends, and compete for daily, weekly, and sponsor-supported grand prizes.",
  primaryActionLabel = "Predict Today",
  onPrimaryAction,
  secondaryActionLabel = "Invite Friends",
  onSecondaryAction,
  tertiaryActionLabel = "View Prizes",
  onTertiaryAction,
  stats = [],
}) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 2.5, md: 3.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.14),
        minHeight: { xs: 220, md: 250 },
        display: "flex",
        alignItems: "center",
        backgroundImage: `
          linear-gradient(90deg, ${alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.95 : 0.92)} 0%, ${alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.88 : 0.74)} 38%, ${alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.34 : 0.18)} 72%, ${alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.2 : 0.12)} 100%),
          linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)} 0%, ${alpha(theme.palette.success.main, 0.12)} 48%, ${alpha(theme.palette.warning.main, 0.08)} 100%),
          url(${heroCover})
        `,
        backgroundSize: "cover, cover, cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: {
          xs: "center center, center center, 68% center",
          md: "center center, center center, center center",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 78% 22%, ${alpha(theme.palette.warning.main, 0.28)} 0%, transparent 18%), radial-gradient(circle at 84% 62%, ${alpha(theme.palette.primary.light, 0.14)} 0%, transparent 22%)`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: -48,
          right: -36,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.warning.main, 0.24)} 0%, transparent 72%)`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -80,
          left: -20,
          width: 280,
          height: 180,
          borderRadius: "48% 52% 40% 60%",
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.16)} 0%, transparent 72%)`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: "auto 8% 24px auto",
          width: 180,
          height: 90,
          borderTop: `2px solid ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.1 : 0.18)}`,
          borderRadius: "999px 999px 0 0",
          transform: "rotate(-8deg)",
        }}
      />

      <Stack spacing={2} sx={{ position: "relative", zIndex: 1 }}>
        <Stack spacing={1}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em", maxWidth: 720 }}>
            {title}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 760,
              textShadow: theme.palette.mode === "dark" ? "none" : `0 1px 10px ${alpha(theme.palette.background.paper, 0.5)}`,
            }}
          >
            {subtitle}
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
          {primaryActionLabel && onPrimaryAction ? (
            <Button variant="contained" onClick={onPrimaryAction}>
              {primaryActionLabel}
            </Button>
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <Button variant="outlined" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : null}
          {tertiaryActionLabel && onTertiaryAction ? (
            <Button variant="text" onClick={onTertiaryAction}>
              {tertiaryActionLabel}
            </Button>
          ) : null}
        </Stack>

        {stats.length ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {stats.map((item) => (
              <Chip
                key={`${item.label}-${item.value}`}
                variant="outlined"
                label={`${item.label}: ${item.value}`}
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.62),
                  backdropFilter: "blur(6px)",
                }}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
