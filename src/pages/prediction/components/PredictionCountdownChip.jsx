import React, { useEffect, useMemo, useState } from "react";
import { Chip } from "@mui/material";
import { getServerOffsetMs } from "../predictionViewUtils";

const buildCountdown = (targetUtc, offsetMs = 0) => {
  if (!targetUtc) return { label: "Open", tone: "default", closed: false };
  const targetMs = Date.parse(targetUtc);
  if (Number.isNaN(targetMs)) return { label: "Open", tone: "default", closed: false };
  const diffMs = targetMs - (Date.now() + offsetMs);
  if (diffMs <= 0) return { label: "Locked", tone: "default", closed: true };

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return { label: `${days}d ${hours % 24}h`, tone: "success", closed: false };
  if (hours >= 2) return { label: `${hours}h ${minutes}m`, tone: "success", closed: false };
  if (hours >= 0) return { label: `${hours}h ${minutes}m`, tone: "warning", closed: false };
  return { label: "Open", tone: "default", closed: false };
};

export default function PredictionCountdownChip({
  targetUtc,
  serverNowUtc,
  closedLabel = "Locked",
  prefix = "",
  tone,
  sx,
}) {
  const [tick, setTick] = useState(0);
  const offsetMs = useMemo(() => getServerOffsetMs(serverNowUtc), [serverNowUtc]);

  useEffect(() => {
    const handle = window.setInterval(() => setTick((value) => value + 1), 30000);
    return () => window.clearInterval(handle);
  }, []);

  const countdown = useMemo(() => buildCountdown(targetUtc, offsetMs), [targetUtc, offsetMs, tick]);
  const color = tone || countdown.tone;
  const label = countdown.closed ? closedLabel : `${prefix || ""}${prefix ? " " : ""}${countdown.label}`;

  return (
    <Chip
      size="small"
      label={label}
      color={color}
      variant="outlined"
      sx={{
        width: "fit-content",
        maxWidth: "100%",
        "& .MuiChip-label": {
          display: "block",
          overflow: "visible",
          textOverflow: "clip",
          whiteSpace: "nowrap",
        },
        ...sx,
      }}
    />
  );
}
