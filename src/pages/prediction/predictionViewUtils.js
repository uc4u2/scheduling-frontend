import { formatDateTimeInTz } from "../../utils/datetime";
import { formatTimezoneLabel, getUserTimezone } from "../../utils/timezone";

export const formatUtcLabel = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
};

export const getPredictionViewerTimezone = (explicitTz = "") => getUserTimezone(explicitTz);

export const formatViewerDateTimeLabel = (value, explicitTz = "") => {
  if (!value) return "-";
  const viewerTimezone = getPredictionViewerTimezone(explicitTz);
  return formatDateTimeInTz(value, viewerTimezone) || value;
};

export const formatViewerTimezoneLabel = (explicitTz = "") => {
  const viewerTimezone = getPredictionViewerTimezone(explicitTz);
  return formatTimezoneLabel(viewerTimezone) || viewerTimezone || "UTC";
};

export const formatWeekLabel = (weekKey) => {
  if (!weekKey) return "No week assigned";
  return weekKey
    .split("_")
    .map((part) => (part === "of" ? "of" : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join(" ");
};

export const getWeekHelperLabel = (weekKey) => {
  if (weekKey === "group_week_1") return "Current Week";
  if (weekKey === "group_week_2" || weekKey === "group_week_3") return "Upcoming Week · Open for early predictions";
  return "";
};

export const getWeekHelperLabelT = (weekKey, t) => {
  if (weekKey === "group_week_1") {
    return t ? t("prediction.week.current", "Current Week") : "Current Week";
  }
  if (weekKey === "group_week_2" || weekKey === "group_week_3") {
    return t
      ? t("prediction.week.upcomingOpen", "Upcoming Week · Open for early predictions")
      : "Upcoming Week · Open for early predictions";
  }
  return "";
};

export const formatStageLabel = (stageKey) => {
  if (!stageKey) return "Stage TBD";
  return stageKey
    .split("_")
    .map((part) => (part === "of" ? "of" : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join(" ");
};

export const formatMatchTitle = (match) => {
  if (!match) return "Match";
  return `${match.home_team_name} vs ${match.away_team_name}`;
};

export const getServerOffsetMs = (serverNowUtc) => {
  if (!serverNowUtc) return 0;
  const parsed = Date.parse(serverNowUtc);
  if (Number.isNaN(parsed)) return 0;
  return parsed - Date.now();
};

export const formatCountdownText = (lockAtUtc, isLocked, serverOffsetMs = 0) => {
  if (isLocked || !lockAtUtc) return "Locked";
  const lockAtMs = Date.parse(lockAtUtc);
  if (Number.isNaN(lockAtMs)) return "Open";
  const diffMs = lockAtMs - (Date.now() + serverOffsetMs);
  if (diffMs <= 0) return "Locked";
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `Locks in ${days}d ${hours}h`;
  if (hours > 0) return `Locks in ${hours}h ${minutes}m`;
  return `Locks in ${minutes}m`;
};

export const predictionStatusChipColor = (status) => {
  switch (status) {
    case "scored":
      return "success";
    case "locked":
      return "warning";
    case "pending":
      return "primary";
    default:
      return "default";
  }
};

export const getPredictionDerivedStatusLabel = (status, t) => {
  switch (status) {
    case "scored":
      return t ? t("prediction.status.scored", "Scored") : "Scored";
    case "locked":
      return t ? t("prediction.status.locked", "Locked") : "Locked";
    case "pending":
      return t ? t("prediction.status.pending", "Pending") : "Pending";
    default:
      return status || "";
  }
};

export const getPredictionStatusLabel = ({ match, myPick, derivedStatus, hasUnsavedChanges = false, t }) => {
  if (derivedStatus === "scored") {
    const scoredLabel = t ? t("prediction.status.scored", "Scored") : "Scored";
    const pointsSuffix = t ? t("prediction.points.short", "pts") : "pts";
    return `${scoredLabel}${myPick?.points_awarded != null ? `: +${myPick.points_awarded} ${pointsSuffix}` : ""}`;
  }
  if (derivedStatus === "locked") return t ? t("prediction.status.locked", "Locked") : "Locked";
  if (hasUnsavedChanges) return t ? t("prediction.status.unsaved", "Unsaved changes") : "Unsaved changes";
  if (myPick) {
    const predictedLabel = t ? t("prediction.status.predicted", "Predicted") : "Predicted";
    return `${predictedLabel}: ${myPick.home_score_predicted}-${myPick.away_score_predicted}`;
  }
  if (match?.is_locked) return t ? t("prediction.status.locked", "Locked") : "Locked";
  return t ? t("prediction.status.notPredicted", "Not predicted") : "Not predicted";
};
