import React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Chip, Stack, Typography } from "@mui/material";
import {
  formatStageLabel,
  formatViewerDateTimeLabel,
  formatViewerTimezoneLabel,
  formatWeekLabel,
} from "../predictionViewUtils";
import PredictionCountdownChip from "./PredictionCountdownChip";
import PredictionTeamBadge from "./PredictionTeamBadge";

export default function PredictionMatchHeader({
  match,
  serverNowUtc,
  showVenue = true,
  showWeek = true,
  showCountdown = true,
  compact = false,
  headerAside = null,
}) {
  const theme = useTheme();
  const viewerTimezoneLabel = formatViewerTimezoneLabel();

  return (
    <Stack spacing={compact ? 1 : 1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {match?.source_payload_json?.match_number ? (
            <Chip size="small" variant="outlined" label={`Match #${match.source_payload_json.match_number}`} sx={{ bgcolor: alpha(theme.palette.background.paper, 0.72) }} />
          ) : null}
          {match?.stage_key ? (
            <Chip size="small" variant="outlined" label={formatStageLabel(match.stage_key)} sx={{ bgcolor: alpha(theme.palette.background.paper, 0.72) }} />
          ) : null}
          {match?.group_key ? (
            <Chip size="small" variant="outlined" label={`Group ${match.group_key}`} sx={{ bgcolor: alpha(theme.palette.background.paper, 0.72) }} />
          ) : null}
          {showWeek && match?.week_key ? (
            <Chip size="small" variant="outlined" label={formatWeekLabel(match.week_key)} sx={{ bgcolor: alpha(theme.palette.background.paper, 0.72) }} />
          ) : null}
        </Stack>
        {headerAside ? (
          <Stack flexShrink={0} alignSelf={{ xs: "flex-start", sm: "center" }}>
            {headerAside}
          </Stack>
        ) : null}
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={compact ? 1 : 1.5}
        alignItems="center"
        justifyContent="space-between"
        sx={{
          py: compact ? 0 : 0.5,
        }}
      >
        <PredictionTeamBadge
          teamName={match?.home_team_name}
          shortName={match?.home_team_code}
          compact={compact}
          align="left"
        />
        <Stack spacing={0.75} alignItems="center" sx={{ minWidth: compact ? 64 : 88 }}>
          <Typography
            variant={compact ? "body2" : "subtitle2"}
            sx={{
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "text.secondary",
              px: 1.25,
              py: 0.4,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.text.primary, 0.05),
              minWidth: compact ? 56 : 72,
              textAlign: "center",
            }}
          >
            VS
          </Typography>
          {showCountdown && match?.lock_at_utc ? (
            <PredictionCountdownChip
              targetUtc={match.lock_at_utc}
              serverNowUtc={serverNowUtc}
              prefix={compact ? "" : "Locks in"}
              closedLabel={match?.derived_status === "scored" ? "Scored" : "Locked"}
              sx={{ maxWidth: compact ? "100%" : "none" }}
            />
          ) : null}
        </Stack>
        <PredictionTeamBadge
          teamName={match?.away_team_name}
          shortName={match?.away_team_code}
          compact={compact}
          align="right"
        />
      </Stack>

      <Stack spacing={0.35}>
        <Typography variant="body2" color="text.secondary">
          Kickoff your time: {formatViewerDateTimeLabel(match?.kickoff_at_utc)}
        </Typography>
        {showCountdown && match?.lock_at_utc ? (
          <Typography variant="body2" color="text.secondary">
            Lock your time: {formatViewerDateTimeLabel(match?.lock_at_utc)}
          </Typography>
        ) : null}
        <Typography variant="caption" color="text.secondary">
          Shown in {viewerTimezoneLabel}
        </Typography>
        {showVenue && (match?.source_payload_json?.venue_name || match?.venue_timezone) ? (
          <Typography variant="body2" color="text.secondary">
            Venue: {match?.source_payload_json?.venue_name || "Venue TBD"} · {match?.venue_timezone || "UTC"}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}
