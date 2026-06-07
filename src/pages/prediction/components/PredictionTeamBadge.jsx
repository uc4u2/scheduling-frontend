import React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";
import FlagCircleOutlinedIcon from "@mui/icons-material/FlagCircleOutlined";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import "flag-icons/css/flag-icons.min.css";
import { getTeamIdentity } from "../predictionTeamIdentity";

export default function PredictionTeamBadge({
  teamName,
  shortName,
  compact = false,
  align = "left",
  placeholderMode,
}) {
  const theme = useTheme();
  const identity = getTeamIdentity(teamName, shortName);
  const isPlaceholder = placeholderMode ?? identity.type === "placeholder";
  const accentStart = identity.accentColors?.[0] || theme.palette.primary.main;
  const accentEnd = identity.accentColors?.[1] || theme.palette.primary.light;
  const alignItems = align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
  const textAlign = align === "right" ? "right" : align === "center" ? "center" : "left";
  const justifyContent = align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";

  return (
    <Stack
      direction={compact ? "row" : "column"}
      spacing={compact ? 1 : 0.85}
      alignItems={compact ? "center" : alignItems}
      justifyContent={compact ? justifyContent : "flex-start"}
      sx={{ minWidth: 0, width: "100%" }}
    >
      <Box
        sx={{
          width: compact ? 36 : 44,
          height: compact ? 36 : 44,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          border: "1px solid",
          borderColor: isPlaceholder ? alpha(theme.palette.text.secondary, 0.18) : alpha(accentStart, 0.28),
          bgcolor: isPlaceholder
            ? alpha(theme.palette.text.secondary, 0.08)
            : alpha(accentStart, 0.08),
          background: isPlaceholder
            ? alpha(theme.palette.text.secondary, 0.08)
            : `linear-gradient(135deg, ${alpha(accentStart, 0.16)} 0%, ${alpha(accentEnd, 0.08)} 100%)`,
          color: isPlaceholder ? "text.secondary" : "text.primary",
          flexShrink: 0,
          fontSize: compact ? "1rem" : "1.25rem",
          boxShadow: isPlaceholder ? "none" : `inset 0 0 0 1px ${alpha(theme.palette.common.white, 0.28)}`,
        }}
      >
        {isPlaceholder ? (
          <HelpOutlineRoundedIcon fontSize={compact ? "small" : "medium"} />
        ) : identity.flagClass ? (
          <Box
            component="span"
            className={`fi ${identity.flagClass}`}
            aria-hidden="true"
            sx={{
              width: compact ? 22 : 28,
              height: compact ? 16 : 20,
              borderRadius: 0.75,
              boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.18)}`,
              overflow: "hidden",
              flexShrink: 0,
            }}
          />
        ) : identity.flag ? (
          <Box component="span" aria-hidden="true" sx={{ lineHeight: 1 }}>
            {identity.flag}
          </Box>
        ) : (
          <FlagCircleOutlinedIcon fontSize={compact ? "small" : "medium"} />
        )}
      </Box>

      <Stack spacing={0.2} alignItems={compact ? alignItems : alignItems} sx={{ minWidth: 0 }}>
        <Typography
          variant={compact ? "caption" : "overline"}
          sx={{ lineHeight: 1.2, fontWeight: 700, letterSpacing: "0.08em", color: isPlaceholder ? "text.secondary" : alpha(accentStart, 0.9) }}
        >
          {isPlaceholder ? "Placeholder" : identity.shortCode}
        </Typography>
        <Typography
          variant={compact ? "body2" : "subtitle2"}
          sx={{
            fontWeight: 700,
            textAlign,
            lineHeight: 1.2,
            wordBreak: "break-word",
            width: "100%",
          }}
        >
          {isPlaceholder ? identity.placeholderLabel : identity.teamName}
        </Typography>
      </Stack>
    </Stack>
  );
}
