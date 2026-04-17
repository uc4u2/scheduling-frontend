import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Pagination,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import ArticleIcon from "@mui/icons-material/Article";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useLocation, useNavigate } from "react-router-dom";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import ManagementFrame from "../../components/ui/ManagementFrame";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";
import api from "../../utils/api";

const compactText = (value, max = 130) => {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};
const formatTrainingDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
const lineClampSx = (lines = 2) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const getYouTubeVideoId = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("youtu.be")) return parsed.pathname.split("/").filter(Boolean)[0] || "";
    if (host.includes("youtube.com")) return parsed.searchParams.get("v") || "";
  } catch (_err) {
    return "";
  }
  return "";
};

const getVideoSource = (url) => {
  const text = String(url || "").toLowerCase();
  if (text.includes("youtube.com") || text.includes("youtu.be")) return "YouTube";
  if (text.includes("vimeo.com")) return "Vimeo";
  if (text.includes("loom.com")) return "Loom";
  if (text.includes("drive.google.com")) return "Drive";
  if (text.includes("cloudflare")) return "Cloudflare";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_err) {
    return "Video";
  }
};

const getVideoThumbnailUrl = (url) => {
  const youtubeId = getYouTubeVideoId(url);
  return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : "";
};

const getVimeoVideoId = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (!host.includes("vimeo.com")) return "";
    return parsed.pathname.split("/").filter(Boolean).reverse().find((part) => /^\d+$/.test(part)) || "";
  } catch (_err) {
    return "";
  }
};

const videoTrackingLabel = (asset) => {
  if (asset?.tracking_mode === "tracked_embed") return "Tracked in Schedulaa";
  if (asset?.tracking_mode === "hosted_future") return "Hosted video later";
  return "View only";
};

const videoActionLabel = (asset) => {
  if (asset?.tracking_mode === "hosted_future") return "Hosted later";
  if (asset?.tracking_mode === "tracked_embed") return "";
  return "View only";
};

const documentKind = (trainingItem) => {
  const asset = trainingItem?.asset || {};
  const type = String(asset.mime_type || "").toLowerCase();
  const name = String(asset.file_name || trainingItem.display_title || "").toLowerCase();
  if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (type.startsWith("image/") || [".png", ".jpg", ".jpeg"].some((ext) => name.endsWith(ext))) return "image";
  return "document";
};

const documentSecurityWaiting = (asset) => {
  const status = String(asset?.scan_status || asset?.download_status || "").toLowerCase();
  return status === "pending" || status === "scanning" || status === "processing";
};

const documentDownloadReady = (asset) => !asset?.has_file || Boolean(asset?.is_download_ready || String(asset?.download_status || "").toLowerCase() === "ready");

const documentSecurityLabel = (asset) => {
  if (!asset?.has_file) return "";
  const status = String(asset?.download_status || asset?.scan_status || "").toLowerCase();
  if (asset?.is_download_ready || status === "ready" || status === "clean") return "Ready";
  if (status === "blocked") return "Blocked";
  return "Security check";
};

const loadYouTubeApi = () => new Promise((resolve, reject) => {
  if (window.YT?.Player) {
    resolve(window.YT);
    return;
  }
  const existing = document.getElementById("schedulaa-youtube-iframe-api");
  const previous = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof previous === "function") previous();
    resolve(window.YT);
  };
  if (!existing) {
    const script = document.createElement("script");
    script.id = "schedulaa-youtube-iframe-api";
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = reject;
    document.body.appendChild(script);
  }
});

const TrackedVideoPlayer = ({ trainingItem, onProgress }) => {
  const theme = useTheme();
  const asset = trainingItem?.asset || {};
  const provider = asset.video_provider;
  const progress = trainingItem?.progress || {};
  const initialPositionRef = React.useRef(Number(progress.last_position_seconds || 0));
  const youtubeId = getYouTubeVideoId(asset.external_url);
  const vimeoId = getVimeoVideoId(asset.external_url);
  const playerContainerId = `training-youtube-${trainingItem?.id || "video"}`;
  const iframeId = `training-vimeo-${trainingItem?.id || "video"}`;
  const playerRef = React.useRef(null);
  const iframeRef = React.useRef(null);
  const onProgressRef = React.useRef(onProgress);
  const playingRef = React.useRef(false);
  const positionRef = React.useRef(initialPositionRef.current);
  const durationRef = React.useRef(Number(asset.duration_seconds || 0));
  const [localProgress, setLocalProgress] = useState(Number(progress.progress_percent || 0));

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, []);

  useEffect(() => {
    setLocalProgress(Number(progress.progress_percent || 0));
  }, [progress.progress_percent]);

  const postProgress = React.useCallback(async (eventType = "heartbeat", delta = 10) => {
    const position = Math.max(0, Math.floor(positionRef.current || 0));
    const duration = Math.max(0, Math.floor(durationRef.current || 0));
    if (!duration && eventType === "heartbeat") return;
    const result = await onProgressRef.current?.({
      position_seconds: position,
      watched_seconds_delta: eventType === "heartbeat" ? delta : 0,
      duration_seconds: duration,
      event_type: eventType,
    });
    const updated = result?.progress?.progress_percent;
    if (updated !== undefined && updated !== null) setLocalProgress(Number(updated || 0));
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (provider !== "youtube" || !youtubeId) return undefined;
    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player(playerContainerId, {
        videoId: youtubeId,
        playerVars: {
          start: Math.max(0, Math.floor(initialPositionRef.current || 0)),
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            durationRef.current = Math.floor(event.target.getDuration?.() || durationRef.current || 0);
            if (initialPositionRef.current > 0) event.target.seekTo(initialPositionRef.current, true);
          },
          onStateChange: (event) => {
            const state = event.data;
            const YTState = window.YT?.PlayerState || {};
            if (state === YTState.PLAYING) {
              playingRef.current = true;
            } else if (state === YTState.PAUSED) {
              playingRef.current = false;
              positionRef.current = event.target.getCurrentTime?.() || positionRef.current;
              durationRef.current = event.target.getDuration?.() || durationRef.current;
            } else if (state === YTState.ENDED) {
              playingRef.current = false;
              positionRef.current = event.target.getCurrentTime?.() || positionRef.current;
              durationRef.current = event.target.getDuration?.() || durationRef.current;
              postProgress("ended", 0);
            }
          },
        },
      });
    }).catch(() => {});
    return () => {
      cancelled = true;
      playingRef.current = false;
      try { playerRef.current?.destroy?.(); } catch (_err) {}
    };
  }, [provider, youtubeId, playerContainerId, postProgress]);

  useEffect(() => {
    if (provider !== "vimeo" || !vimeoId) return undefined;
    const listener = (event) => {
      const sourceWindow = iframeRef.current?.contentWindow;
      if (sourceWindow && event.source !== sourceWindow) return;
      let data = event.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (_err) { return; }
      }
      const eventName = data?.event || data?.method;
      const payload = data?.data || {};
      if (eventName === "play") playingRef.current = true;
      if (eventName === "pause") playingRef.current = false;
      if (eventName === "ended") {
        playingRef.current = false;
        postProgress("ended", 0);
      }
      if (eventName === "timeupdate") {
        positionRef.current = payload.seconds ?? positionRef.current;
        durationRef.current = payload.duration ?? durationRef.current;
        if (payload.percent) setLocalProgress(Math.round(payload.percent * 100));
      }
    };
    window.addEventListener("message", listener);
    const timer = window.setTimeout(() => {
      const target = iframeRef.current?.contentWindow;
      if (!target) return;
      ["play", "pause", "ended", "timeupdate"].forEach((eventName) => {
        target.postMessage(JSON.stringify({ method: "addEventListener", value: eventName }), "*");
      });
      if (initialPositionRef.current > 0) target.postMessage(JSON.stringify({ method: "setCurrentTime", value: initialPositionRef.current }), "*");
    }, 700);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", listener);
      playingRef.current = false;
    };
  }, [provider, vimeoId, postProgress]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!playingRef.current || document.hidden) return;
      if (provider === "youtube" && playerRef.current?.getCurrentTime) {
        positionRef.current = playerRef.current.getCurrentTime();
        durationRef.current = playerRef.current.getDuration?.() || durationRef.current;
      }
      postProgress("heartbeat", 10);
    }, 10000);
    const visibilityHandler = () => {
      if (document.hidden) playingRef.current = false;
    };
    document.addEventListener("visibilitychange", visibilityHandler);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [provider, postProgress]);

  const vimeoSrc = vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}?api=1&player_id=${iframeId}`
    : "";

  const watchedSeconds = Math.floor(Number(progress.watched_seconds || 0));
  const resumeSeconds = Math.floor(Number(progress.last_position_seconds || 0));
  const progressTone = localProgress >= 90 ? theme.palette.success : theme.palette.primary;

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: theme.palette.common.black,
          border: `1px solid ${alpha(theme.palette.common.white, 0.16)}`,
          boxShadow: `0 26px 80px ${alpha(theme.palette.common.black, 0.28)}`,
          background: `radial-gradient(circle at 18% 12%, ${alpha(theme.palette.primary.main, 0.35)}, transparent 32%), #05070f`,
        }}
      >
        {provider === "youtube" && youtubeId && (
          <Box
            id={playerContainerId}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              "& iframe": {
                position: "absolute",
                inset: 0,
                width: "100% !important",
                height: "100% !important",
                display: "block",
                border: 0,
              },
            }}
          />
        )}
        {provider === "vimeo" && vimeoSrc && (
          <Box
            component="iframe"
            ref={iframeRef}
            id={iframeId}
            src={vimeoSrc}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={trainingItem.display_title || "Training video"}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, display: "block" }}
          />
        )}
      </Box>
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          border: `1px solid ${alpha(progressTone.main, 0.22)}`,
          background: `linear-gradient(135deg, ${alpha(progressTone.main, 0.1)}, ${alpha(theme.palette.background.paper, 0.9)})`,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
          <Stack spacing={0.35}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <TaskAltIcon sx={{ fontSize: 18, color: progressTone.dark }} />
              <Typography variant="body2" sx={{ fontWeight: 900 }}>Tracked watch progress</Typography>
              <Chip size="small" label={localProgress >= 90 ? "Completion ready" : "Watching required"} {...readableChipProps(theme, localProgress >= 90 ? "success" : "info")} />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {watchedSeconds > 0 ? `${Math.round(watchedSeconds / 60)} min counted` : "No watch time counted yet"}
              {resumeSeconds > 0 ? ` · resumes near ${Math.floor(resumeSeconds / 60)}:${String(resumeSeconds % 60).padStart(2, "0")}` : ""}
            </Typography>
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 950, color: progressTone.dark }}>
            {Math.round(localProgress || 0)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={Math.min(Math.max(localProgress || 0, 0), 100)}
          sx={{
            mt: 1.4,
            height: 8,
            borderRadius: 1,
            bgcolor: alpha(progressTone.main, 0.14),
            "& .MuiLinearProgress-bar": {
              borderRadius: 1,
              background: `linear-gradient(90deg, ${progressTone.main}, ${progressTone.dark})`,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Progress is counted by playback heartbeat while this video is playing in Schedulaa. Skipping ahead alone does not complete the item.
        </Typography>
      </Box>
    </Stack>
  );
};

const SummaryCard = ({ label, value, helper, tone = "primary", icon }) => {
  const theme = useTheme();
  const palette = theme.palette[tone] || theme.palette.primary;
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 1,
        overflow: "hidden",
        borderColor: alpha(palette.main, 0.22),
        background: `radial-gradient(circle at 96% 0%, ${alpha(palette.main, 0.16)}, transparent 34%), linear-gradient(135deg, ${alpha(palette.main, 0.08)}, ${alpha(theme.palette.background.paper, 0.96)})`,
        boxShadow: `0 16px 44px ${alpha(palette.main, 0.08)}`,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              display: "grid",
              placeItems: "center",
              color: palette.dark,
              bgcolor: alpha(palette.main, 0.12),
            }}
          >
            {icon || <TrendingUpIcon sx={{ fontSize: 18 }} />}
          </Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 850 }}>{label}</Typography>
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 950, mt: 1 }}>{value ?? 0}</Typography>
        <Typography variant="body2" color="text.secondary">{helper}</Typography>
      </CardContent>
    </Card>
  );
};

const PreparedItem = ({ icon, title, text, disabled = false }) => {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 1,
        height: "100%",
        borderColor: disabled ? alpha(theme.palette.warning.main, 0.22) : alpha(theme.palette.primary.main, 0.1),
        bgcolor: disabled ? alpha(theme.palette.warning.main, 0.045) : alpha(theme.palette.background.paper, 0.64),
        backgroundImage: disabled
          ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.055)}, ${alpha(theme.palette.background.paper, 0.82)})`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.035)}, ${alpha(theme.palette.background.paper, 0.82)})`,
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1.1} alignItems="flex-start">
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1,
              display: "grid",
              placeItems: "center",
              color: disabled ? theme.palette.warning.dark : theme.palette.primary.dark,
              bgcolor: disabled ? alpha(theme.palette.warning.main, 0.12) : alpha(theme.palette.primary.main, 0.1),
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, ...lineClampSx(1) }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, ...lineClampSx(2) }}>{text}</Typography>
          </Box>
          {disabled && <Chip size="small" label="Future" {...readableChipProps(theme, "warning")} />}
        </Stack>
      </CardContent>
    </Card>
  );
};

const statusLabel = (value) => ({
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
}[value] || "Not started");

const itemTypeLabel = (value) => ({
  video: "Video",
  document: "Document",
  quiz: "Quiz",
  acknowledgement: "Acknowledgement",
  live_session: "Live session",
}[value] || "Item");

const chipSx = (theme, tone = "neutral") => {
  const palette = {
    primary: theme.palette.primary,
    success: theme.palette.success,
    warning: theme.palette.warning,
    info: theme.palette.info,
  }[tone];
  if (!palette) {
    return {
      color: theme.palette.text.primary,
      backgroundColor: alpha(theme.palette.text.primary, 0.06),
      borderColor: alpha(theme.palette.text.primary, 0.18),
      fontWeight: 800,
    };
  }
  return {
    color: palette.dark,
    backgroundColor: alpha(palette.main, 0.13),
    borderColor: alpha(palette.main, 0.34),
    fontWeight: 800,
  };
};

const readableChipProps = (theme, tone = "neutral") => ({
  variant: "outlined",
  sx: chipSx(theme, tone),
});

const CompactPagination = ({ pagination, onChange }) => {
  if (!pagination || Number(pagination.total || 0) <= Number(pagination.page_size || 0)) return null;
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
      sx={{ pt: 0.5 }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
        Showing page {pagination.page || 1} of {pagination.total_pages || 1} · {pagination.total || 0} total
      </Typography>
      <Pagination
        size="small"
        shape="rounded"
        color="primary"
        page={pagination.page || 1}
        count={pagination.total_pages || 1}
        onChange={(_, page) => onChange(page)}
      />
    </Stack>
  );
};

const TrainingItemThumbnail = ({ trainingItem, index }) => {
  const theme = useTheme();
  const asset = trainingItem?.asset || {};
  const isVideo = trainingItem.item_type === "video";
  const isDocument = trainingItem.item_type === "document";
  const isQuiz = trainingItem.item_type === "quiz";
  const thumbnailUrl = isVideo ? getVideoThumbnailUrl(asset.external_url) : "";
  const docKind = isDocument ? documentKind(trainingItem) : "";
  const source = isVideo ? getVideoSource(asset.external_url) : itemTypeLabel(trainingItem.item_type);

  return (
    <Box
      sx={{
        width: { xs: "100%", md: isVideo ? 224 : 152 },
        height: isVideo ? { xs: 158, md: 126 } : 86,
        flexShrink: 0,
        borderRadius: 1,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${alpha(theme.palette.common.white, isVideo ? 0.22 : 0.08)}`,
        boxShadow: isVideo ? `0 18px 42px ${alpha(theme.palette.common.black, 0.16)}` : "none",
        background: thumbnailUrl
          ? `linear-gradient(180deg, ${alpha(theme.palette.common.black, 0.04)}, ${alpha(theme.palette.common.black, 0.58)}), url(${thumbnailUrl}) center/cover`
          : `radial-gradient(circle at 20% 18%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 32%), linear-gradient(135deg, ${alpha(isDocument ? theme.palette.info.main : isQuiz ? theme.palette.secondary.main : theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.text.primary, 0.05)})`,
      }}
    >
      <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", color: thumbnailUrl ? "common.white" : "text.primary" }} spacing={0.5}>
        {isVideo && (
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette.common.white, thumbnailUrl ? 0.18 : 0.74),
              border: `1px solid ${alpha(theme.palette.common.white, thumbnailUrl ? 0.38 : 0.2)}`,
              backdropFilter: "blur(10px)",
              boxShadow: `0 14px 34px ${alpha(theme.palette.common.black, 0.28)}`,
            }}
          >
            <PlayCircleOutlineIcon sx={{ fontSize: 32, filter: thumbnailUrl ? "drop-shadow(0 8px 18px rgba(0,0,0,0.35))" : "none" }} />
          </Box>
        )}
        {isDocument && docKind === "pdf" && <PictureAsPdfIcon sx={{ fontSize: 32, color: "error.main" }} />}
        {isDocument && docKind === "image" && <ImageIcon sx={{ fontSize: 32, color: "info.main" }} />}
        {isDocument && docKind === "document" && <InsertDriveFileIcon sx={{ fontSize: 32, color: "info.main" }} />}
        {isQuiz && <QuizIcon sx={{ fontSize: 32, color: "primary.main" }} />}
        {!isVideo && !isDocument && !isQuiz && <SchoolIcon sx={{ fontSize: 32, color: "primary.main" }} />}
        <Chip
          size="small"
          label={isVideo ? source : isDocument ? docKind.toUpperCase() : `${index + 1}`}
          sx={{
            height: 20,
            fontSize: 10,
            fontWeight: 850,
            color: thumbnailUrl ? theme.palette.common.white : theme.palette.text.primary,
            bgcolor: thumbnailUrl ? alpha(theme.palette.common.black, 0.42) : alpha(theme.palette.background.paper, 0.76),
            borderColor: thumbnailUrl ? alpha(theme.palette.common.white, 0.3) : alpha(theme.palette.text.primary, 0.12),
            backdropFilter: "blur(8px)",
          }}
          variant="outlined"
        />
      </Stack>
      {isVideo && (
        <Box
          sx={{
            position: "absolute",
            left: 10,
            bottom: 8,
            right: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: "common.white", fontWeight: 900, textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}>
            Training video
          </Typography>
          {asset?.duration_label && (
            <Chip
              size="small"
              label={asset.duration_label}
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 900,
                color: theme.palette.common.white,
                bgcolor: alpha(theme.palette.common.black, 0.48),
                borderColor: alpha(theme.palette.common.white, 0.28),
              }}
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

const LearningResourceThumbnail = ({ resource }) => {
  const theme = useTheme();
  const asset = resource?.asset || {};
  const isVideo = asset.asset_type === "video_link" || asset.asset_type === "video_hosted";
  const isDocument = asset.asset_type === "document";
  const thumbnailUrl = isVideo ? getVideoThumbnailUrl(asset.external_url) : "";
  const docKind = isDocument ? documentKind({ asset, display_title: resource?.title }) : "";
  const source = isVideo ? getVideoSource(asset.external_url) : docKind.toUpperCase();
  return (
    <Box
      sx={{
        width: { xs: "100%", md: 170 },
        height: { xs: 120, md: 96 },
        flexShrink: 0,
        borderRadius: 1,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
        background: thumbnailUrl
          ? `linear-gradient(180deg, ${alpha(theme.palette.common.black, 0.04)}, ${alpha(theme.palette.common.black, 0.6)}), url(${thumbnailUrl}) center/cover`
          : `radial-gradient(circle at 20% 18%, ${alpha(theme.palette.primary.main, 0.2)}, transparent 32%), linear-gradient(135deg, ${alpha(isDocument ? theme.palette.info.main : theme.palette.primary.main, 0.14)}, ${alpha(theme.palette.text.primary, 0.04)})`,
      }}
    >
      <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", color: thumbnailUrl ? "common.white" : "text.primary" }} spacing={0.5}>
        {isVideo && <PlayCircleOutlineIcon sx={{ fontSize: 34 }} />}
        {isDocument && docKind === "pdf" && <PictureAsPdfIcon sx={{ fontSize: 30, color: "error.main" }} />}
        {isDocument && docKind === "image" && <ImageIcon sx={{ fontSize: 30, color: "info.main" }} />}
        {isDocument && docKind === "document" && <InsertDriveFileIcon sx={{ fontSize: 30, color: "info.main" }} />}
        <Chip
          size="small"
          label={source || "Resource"}
          variant="outlined"
          sx={{
            height: 20,
            fontSize: 10,
            fontWeight: 850,
            color: thumbnailUrl ? theme.palette.common.white : theme.palette.text.primary,
            bgcolor: thumbnailUrl ? alpha(theme.palette.common.black, 0.42) : alpha(theme.palette.background.paper, 0.76),
            borderColor: thumbnailUrl ? alpha(theme.palette.common.white, 0.3) : alpha(theme.palette.text.primary, 0.12),
          }}
        />
      </Stack>
    </Box>
  );
};

const RecruiterMyTrainingPage = ({ token }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();
  const [data, setData] = useState(null);
  const [learningResources, setLearningResources] = useState([]);
  const [learningResourceSummary, setLearningResourceSummary] = useState({ resources: 0, unread_count: 0 });
  const [trainingPage, setTrainingPage] = useState(1);
  const [resourcePage, setResourcePage] = useState(1);
  const [learningResourcePagination, setLearningResourcePagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [quizDialog, setQuizDialog] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [videoDialog, setVideoDialog] = useState(null);
  const [scanRefreshUntil, setScanRefreshUntil] = useState(0);
  const role = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";
  const managerViewingEmployee = role === "manager" && location.pathname.startsWith("/employee");

  const replaceAssignment = (assignment) => {
    if (!assignment?.assignment_id) return;
    setData((prev) => {
      const rows = (prev?.items || []).map((row) => (
        row.assignment_id === assignment.assignment_id
          ? { ...assignment, description: assignment.training_set_description }
          : row
      ));
      return { ...(prev || {}), items: rows };
    });
  };

  const loadTraining = (silent = false) => {
    let alive = true;
    if (!silent) setLoading(true);
    Promise.all([
      api.get("/employee/my-training", { params: { page: trainingPage, page_size: 6 } }),
      api.get("/employee/training/resources", { params: { page: resourcePage, page_size: 6 } }),
    ])
      .then(([trainingRes, resourcesRes]) => {
        if (alive) {
          setData(trainingRes.data || null);
          setLearningResources(resourcesRes.data?.items || []);
          setLearningResourceSummary(resourcesRes.data?.summary || { resources: 0, unread_count: 0 });
          setLearningResourcePagination(resourcesRes.data?.pagination || null);
        }
      })
      .catch((err) => {
        if (alive && !silent) setError(err?.response?.data?.error || "Unable to load training.");
      })
      .finally(() => {
        if (alive && !silent) setLoading(false);
      });
    return () => { alive = false; };
  };

  useEffect(() => {
    return loadTraining();
  }, [trainingPage, resourcePage]);

  const runAction = async (key, action) => {
    setActionLoading(key);
    setError("");
    setSuccess("");
    try {
      const result = await action();
      if (result?.assignment) replaceAssignment(result.assignment);
      if (result?.message) setSuccess(result.message);
      return result;
    } catch (err) {
      setError(err?.response?.data?.error || "Training action failed.");
      return null;
    } finally {
      setActionLoading("");
    }
  };

  const startItem = (assignmentId, itemId) => runAction(
    `start-${assignmentId}-${itemId}`,
    async () => (await api.post(`/employee/my-training/${assignmentId}/items/${itemId}/start`)).data,
  );

  const confirmItem = (assignmentId, itemId) => runAction(
    `confirm-${assignmentId}-${itemId}`,
    async () => (await api.post(`/employee/my-training/${assignmentId}/items/${itemId}/confirm`)).data,
  );

  const openDocument = async (assignmentId, itemId) => {
    const result = await runAction(
      `download-${assignmentId}-${itemId}`,
      async () => (await api.get(`/employee/my-training/${assignmentId}/items/${itemId}/document`)).data,
    );
    if (result?.url) window.open(result.url, "_blank", "noopener,noreferrer");
  };

  const openLearningResource = async (resource) => {
    const asset = resource?.asset || {};
    if (asset.asset_type === "document") {
      const result = await runAction(
        `resource-${resource.id}`,
        async () => (await api.get(`/employee/training/resources/${resource.id}/document`)).data,
      );
      if (result?.url) window.open(result.url, "_blank", "noopener,noreferrer");
      loadTraining();
      return;
    }
    if (asset.external_url) {
      const openedWindow = window.open("about:blank", "_blank", "noopener,noreferrer");
      const result = await runAction(
        `resource-${resource.id}`,
        async () => (await api.post(`/employee/training/resources/${resource.id}/view`)).data,
      );
      const targetUrl = result?.resource?.action?.url || asset.external_url;
      if (openedWindow) openedWindow.location = targetUrl;
      else window.open(targetUrl, "_blank", "noopener,noreferrer");
      loadTraining();
    }
  };

  const openVideo = async (assignmentId, trainingItem) => {
    const result = await startItem(assignmentId, trainingItem.id);
    const latestItem = (result?.assignment?.items || []).find((row) => row.id === trainingItem.id) || trainingItem;
    const asset = latestItem?.asset || {};
    if (asset.tracking_mode === "tracked_embed") {
      setVideoDialog({ assignmentId, item: latestItem });
      return;
    }
    const url = asset.external_url;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const sendVideoProgress = async (assignmentId, itemId, payload) => {
    try {
      const result = (await api.post(`/employee/my-training/${assignmentId}/items/${itemId}/video-progress`, payload)).data;
      const isActivePlayer = videoDialog?.assignmentId === assignmentId && videoDialog?.item?.id === itemId;
      if (result?.assignment && !isActivePlayer) replaceAssignment(result.assignment);
      if (result?.assignment && isActivePlayer && payload?.event_type === "ended") {
        const updatedItem = (result.assignment.items || []).find((row) => row.id === itemId);
        if (updatedItem) setVideoDialog((prev) => prev ? { ...prev, item: updatedItem } : prev);
        replaceAssignment(result.assignment);
      }
      return result;
    } catch (err) {
      if (payload?.event_type !== "heartbeat") {
        setError(err?.response?.data?.error || "Unable to update video progress.");
      }
      return null;
    }
  };

  const closeVideoDialog = () => {
    setVideoDialog(null);
    loadTraining();
  };

  const startQuiz = async (assignmentId, itemId) => {
    const result = await runAction(
      `quiz-${assignmentId}-${itemId}`,
      async () => (await api.post(`/employee/my-training/${assignmentId}/items/${itemId}/quiz-start`)).data,
    );
    if (result?.attempt) {
      setQuizDialog({ assignmentId, itemId, attempt: result.attempt });
      setQuizAnswers({});
      setQuizResult(null);
    }
  };

  const submitQuiz = async () => {
    if (!quizDialog?.attempt?.attempt_id) return;
    const result = await runAction(
      `quiz-submit-${quizDialog.assignmentId}-${quizDialog.itemId}`,
      async () => (await api.post(
        `/employee/my-training/${quizDialog.assignmentId}/items/${quizDialog.itemId}/quiz-submit`,
        { attempt_id: quizDialog.attempt.attempt_id, answers: quizAnswers },
      )).data,
    );
    if (result) {
      setQuizResult(result);
      if (result.passed) {
        setQuizDialog(null);
        setQuizAnswers({});
      }
    }
  };

  const handleLocalTabChange = (value) => {
    const basePath = location.pathname.startsWith("/recruiter") ? "/recruiter/dashboard" : "/employee/dashboard";
    navigate(`${basePath}?tab=${value}`);
  };

  const summary = data?.summary || {};
  const capabilities = data?.capabilities || {};
  const items = Array.isArray(data?.items) ? data.items : [];
  const trainingPagination = data?.pagination || null;
  const hasDocumentWaiting = items.some((assignment) => (
    assignment.items || []
  ).some((trainingItem) => trainingItem.item_type === "document" && documentSecurityWaiting(trainingItem.asset)))
    || learningResources.some((resource) => resource.asset?.asset_type === "document" && documentSecurityWaiting(resource.asset));

  useEffect(() => {
    if (!hasDocumentWaiting) return undefined;
    if (!scanRefreshUntil) {
      setScanRefreshUntil(Date.now() + 120000);
      return undefined;
    }
    if (Date.now() > scanRefreshUntil) return undefined;
    const timer = window.setTimeout(() => {
      loadTraining(true);
    }, 7000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDocumentWaiting, scanRefreshUntil, items, learningResources]);

  const assignmentProgressPercent = (assignment) => {
    const rows = Array.isArray(assignment?.items) ? assignment.items : [];
    const requiredRows = rows.filter((row) => row.is_required && row.item_type !== "live_session");
    const denominator = requiredRows.length || rows.length || 1;
    const completed = (requiredRows.length ? requiredRows : rows).filter((row) => row.progress?.status === "completed").length;
    return Math.round((completed / denominator) * 100);
  };

  const assignmentProgressSummary = (assignment) => {
    const rows = Array.isArray(assignment?.items) ? assignment.items : [];
    const requiredRows = rows.filter((row) => row.is_required && row.item_type !== "live_session");
    const targetRows = requiredRows.length ? requiredRows : rows;
    const completed = targetRows.filter((row) => row.progress?.status === "completed").length;
    return {
      completed,
      total: targetRows.length,
      label: targetRows.length ? `${completed} of ${targetRows.length} required items complete` : "No required items yet",
    };
  };

  const renderTrainingItemActions = (assignment, trainingItem) => {
    const status = trainingItem.progress?.status || "not_started";
    const isDone = status === "completed";
    const loadingKey = `${assignment.assignment_id}-${trainingItem.id}`;
    const busy = actionLoading.endsWith(loadingKey);
    if (trainingItem.item_type === "video") {
      const asset = trainingItem.asset || {};
      const tracked = asset.tracking_mode === "tracked_embed";
      const progressPercent = Number(trainingItem.progress?.progress_percent || 0);
      const actionLabel = videoActionLabel(asset);
      return (
        <Stack spacing={0.75} alignItems={{ xs: "flex-start", md: "flex-end" }}>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ display: { xs: "none", md: "none" } }}>
            {actionLabel && (
              <Chip
                size="small"
                label={actionLabel}
                {...readableChipProps(theme, asset.tracking_mode === "hosted_future" ? "warning" : "neutral")}
              />
            )}
            {tracked && (
              <Chip
                size="small"
                label={`${Math.round(progressPercent)}% watched`}
                {...readableChipProps(theme, progressPercent >= 90 ? "success" : "info")}
              />
            )}
          </Stack>
          <Button
            size="small"
            variant={tracked ? "contained" : "outlined"}
            disabled={busy}
            onClick={() => openVideo(assignment.assignment_id, trainingItem)}
            sx={{ minWidth: 132, fontWeight: 900, alignSelf: { xs: "flex-start", md: "flex-end" } }}
          >
            {tracked ? progressPercent > 0 && !isDone ? "Resume video" : "Watch video" : "View externally"}
          </Button>
          {!tracked && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
              Watch completion is not verified for this link.
            </Typography>
          )}
        </Stack>
      );
    }
    if (trainingItem.item_type === "document") {
      const asset = trainingItem.asset || {};
      const ready = Boolean(asset.has_file) && documentDownloadReady(asset);
      const waiting = documentSecurityWaiting(asset);
      const blocked = String(asset.scan_status || "").toLowerCase() === "blocked";
      return (
        <Stack spacing={0.75} alignItems={{ xs: "flex-start", md: "flex-end" }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="outlined"
              startIcon={waiting ? <CircularProgress size={13} thickness={5} /> : undefined}
              disabled={busy || !ready}
              onClick={() => openDocument(assignment.assignment_id, trainingItem.id)}
              sx={{ fontWeight: 850 }}
            >
              {waiting ? "Checking file" : blocked ? "Blocked" : "Open document"}
            </Button>
            <Button
              size="small"
              variant={isDone ? "outlined" : "contained"}
              disabled={isDone || busy}
              onClick={() => confirmItem(assignment.assignment_id, trainingItem.id)}
              sx={{ fontWeight: 850 }}
            >
              {isDone ? "Reviewed" : "I reviewed this document"}
            </Button>
          </Stack>
          {asset.has_file && !ready && (
            <Typography variant="caption" color={blocked ? "error" : "text.secondary"}>
              {blocked ? "This file was blocked by security scanning." : "Uploaded. Security check in progress."}
            </Typography>
          )}
        </Stack>
      );
    }
    if (trainingItem.item_type === "acknowledgement") {
      return (
        <Stack spacing={0.75}>
          {trainingItem.acknowledgement_text && (
            <Typography variant="body2" color="text.secondary">{trainingItem.acknowledgement_text}</Typography>
          )}
          <Button
            size="small"
            variant={isDone ? "outlined" : "contained"}
            disabled={isDone || busy}
            onClick={() => confirmItem(assignment.assignment_id, trainingItem.id)}
            sx={{ alignSelf: "flex-start" }}
          >
            {isDone ? "Confirmed" : "Confirm acknowledgement"}
          </Button>
        </Stack>
      );
    }
    if (trainingItem.item_type === "quiz") {
      return (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant={isDone ? "outlined" : "contained"}
            disabled={busy}
            onClick={() => startQuiz(assignment.assignment_id, trainingItem.id)}
            sx={{ minWidth: 112, fontWeight: 900 }}
          >
            {isDone ? "Retake quiz" : status === "in_progress" ? "Retry quiz" : "Start quiz"}
          </Button>
          <Typography variant="caption" color="text.secondary">
            Quiz items complete only after a passing score.
          </Typography>
        </Stack>
      );
    }
    if (trainingItem.item_type === "live_session") {
      return (
        <Typography variant="caption" color="text.secondary">
          Live sessions are informational in this release. Attendance tracking is not active.
        </Typography>
      );
    }
    return (
      <Button size="small" variant="outlined" disabled={busy || isDone} onClick={() => startItem(assignment.assignment_id, trainingItem.id)}>
        {isDone ? "Completed" : "Start"}
      </Button>
    );
  };

  return (
    <ManagementFrame
      title="My Training"
      subtitle="Assigned onboarding and learning tasks will appear here."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      disableContentCard
      contentSx={{ p: 0 }}
    >
      <RecruiterTabs
        localTab="my-training"
        onLocalTabChange={handleLocalTabChange}
        allowHrAccess={allowHrAccess}
        isLoading={isLoading}
      />

      <Stack spacing={2} sx={{ mt: 2, maxWidth: 1480, mx: "auto", width: "100%" }}>
        {managerViewingEmployee && (
          <Alert
            severity="info"
            action={<Button color="inherit" size="small" onClick={() => navigate("/manager/dashboard")}>Back to Manager</Button>}
          >
            Viewing Employee Workspace (Manager Mode)
          </Alert>
        )}

        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>}

        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Loading your training...</Typography>
          </Stack>
        ) : (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><SummaryCard tone="primary" icon={<SchoolIcon sx={{ fontSize: 18 }} />} label="Assigned" value={summary.assigned} helper="Training programs assigned to you" /></Grid>
              <Grid item xs={12} md={3}><SummaryCard tone="success" icon={<TaskAltIcon sx={{ fontSize: 18 }} />} label="Completed" value={summary.completed} helper="Finished training programs" /></Grid>
              <Grid item xs={12} md={3}><SummaryCard tone="warning" icon={<TrendingUpIcon sx={{ fontSize: 18 }} />} label="In progress" value={summary.in_progress} helper="Started but not complete" /></Grid>
              <Grid item xs={12} md={3}><SummaryCard tone="info" icon={<PlayCircleOutlineIcon sx={{ fontSize: 18 }} />} label="Not started" value={summary.not_started} helper="Waiting for your first step" /></Grid>
            </Grid>

            {items.length === 0 ? (
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 1,
                  borderColor: alpha(theme.palette.text.primary, 0.12),
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.background.paper, 0.98)})`,
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SchoolIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>No training assigned yet</Typography>
                    </Stack>
                    <Typography variant="body1" color="text.secondary">
                      When your manager assigns onboarding or training, it will appear here with videos, documents, quizzes, and confirmations.
                    </Typography>
                    <Alert severity="info" variant="outlined">
                      Your manager can assign videos, documents, acknowledgements, and quizzes. Assigned items become actionable here.
                    </Alert>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={1.25}>
                {items.map((item) => (
                  <Card
                    key={item.assignment_id}
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      overflow: "hidden",
                      borderColor: alpha(theme.palette.primary.main, 0.16),
                      background: `radial-gradient(circle at 100% 0%, ${alpha(theme.palette.primary.main, 0.13)}, transparent 24%), linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.065)}, ${alpha(theme.palette.background.paper, 0.98)} 42%)`,
                      boxShadow: `0 20px 64px ${alpha(theme.palette.primary.main, 0.08)}`,
                    }}
                  >
                    <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                      <Stack spacing={1.75}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.5}
                          alignItems={{ xs: "flex-start", md: "flex-start" }}
                          justifyContent="space-between"
                        >
                          <Stack
                            direction="row"
                            spacing={1.25}
                            alignItems="flex-start"
                            sx={{ flex: 1, minWidth: 0 }}
                          >
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 1,
                                display: "grid",
                                placeItems: "center",
                                color: theme.palette.primary.dark,
                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              }}
                            >
                              <SchoolIcon />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.15 }}>{item.training_set_name || "Training set"}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={lineClampSx(2)}>{compactText(item.description, 180) || "Complete the assigned training items below."}</Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap" useFlexGap sx={{ minWidth: { md: 260 } }}>
                            <Chip
                              label={`${assignmentProgressPercent(item)}% complete`}
                              size="small"
                              {...readableChipProps(theme, item.status === "completed" ? "success" : "info")}
                            />
                            <Chip label={statusLabel(item.status)} size="small" {...readableChipProps(theme, item.status === "completed" ? "success" : item.status === "in_progress" ? "warning" : "neutral")} />
                          </Stack>
                        </Stack>
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }} spacing={1}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                              Required progress
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                              {assignmentProgressSummary(item).label}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={assignmentProgressPercent(item)}
                            sx={{
                              height: 8,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.primary.main, 0.12),
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 1,
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                              },
                            }}
                          />
                          <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
                            <Chip size="small" label={`${(item.items || []).length} item${(item.items || []).length === 1 ? "" : "s"}`} {...readableChipProps(theme, "neutral")} />
                            <Chip size="small" label={item.source_type === "department" ? "Department assigned" : "Direct assignment"} {...readableChipProps(theme, "primary")} />
                          </Stack>
                        </Box>
                        {(item.items || []).length ? (
                          <Stack spacing={0.75}>
                            {(item.items || []).map((trainingItem, index) => (
                              <Stack
                                key={trainingItem.id}
                                direction={{ xs: "column", md: "row" }}
                                spacing={1.35}
                                alignItems={{ xs: "stretch", md: "center" }}
                                sx={{
                                  p: 1.15,
                                  borderRadius: 1,
                                  bgcolor: trainingItem.item_type === "video"
                                    ? alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.16 : 0.03)
                                    : alpha(theme.palette.background.paper, 0.78),
                                  border: `1px solid ${alpha(trainingItem.item_type === "video" ? theme.palette.primary.main : theme.palette.text.primary, trainingItem.item_type === "video" ? 0.18 : 0.075)}`,
                                  boxShadow: trainingItem.item_type === "video"
                                    ? `0 18px 50px ${alpha(theme.palette.primary.main, 0.1)}`
                                    : `0 10px 28px ${alpha(theme.palette.common.black, 0.035)}`,
                                  transition: "border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
                                  "&:hover": {
                                    transform: "translateY(-1px)",
                                    borderColor: alpha(theme.palette.primary.main, 0.24),
                                    boxShadow: `0 16px 42px ${alpha(theme.palette.primary.main, 0.1)}`,
                                  },
                                }}
                              >
                                <TrainingItemThumbnail trainingItem={trainingItem} index={index} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 950, letterSpacing: "-0.01em", ...lineClampSx(1) }}>{trainingItem.display_title}</Typography>
                                  <Stack direction="row" spacing={0.75} sx={{ mt: 0.35 }} flexWrap="wrap" useFlexGap>
                                    <Chip size="small" label={itemTypeLabel(trainingItem.item_type)} {...readableChipProps(theme, "neutral")} />
                                    <Chip
                                      size="small"
                                      label={trainingItem.is_required && trainingItem.item_type !== "live_session" ? "Required" : "Optional"}
                                      {...readableChipProps(theme, trainingItem.is_required && trainingItem.item_type !== "live_session" ? "primary" : "neutral")}
                                    />
                                    {trainingItem.item_type === "video" && trainingItem.asset?.tracking_mode === "tracked_embed" && (
                                      <Chip size="small" label={`${Math.round(Number(trainingItem.progress?.progress_percent || 0))}% watched`} {...readableChipProps(theme, Number(trainingItem.progress?.progress_percent || 0) >= 90 ? "success" : "info")} />
                                    )}
                                    {trainingItem.item_type === "video" && trainingItem.asset?.tracking_mode !== "tracked_embed" && (
                                      <Chip size="small" label={videoActionLabel(trainingItem.asset) || "View only"} {...readableChipProps(theme, "neutral")} />
                                    )}
                                    {trainingItem.item_type === "document" && trainingItem.asset?.has_file && (
                                      <Chip
                                        size="small"
                                        icon={documentSecurityWaiting(trainingItem.asset) ? <CircularProgress size={12} thickness={5} color="inherit" /> : undefined}
                                        label={documentSecurityLabel(trainingItem.asset)}
                                        {...readableChipProps(
                                          theme,
                                          String(trainingItem.asset?.scan_status || "").toLowerCase() === "blocked"
                                            ? "warning"
                                            : documentDownloadReady(trainingItem.asset)
                                              ? "success"
                                              : "info",
                                        )}
                                      />
                                    )}
                                  </Stack>
                                  {trainingItem.display_description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, ...lineClampSx(2) }}>{compactText(trainingItem.display_description, 170)}</Typography>
                                  )}
                                </Box>
                                <Stack spacing={0.75} alignItems={{ xs: "flex-start", md: "flex-end" }} sx={{ minWidth: { md: 210 }, maxWidth: { md: 260 } }}>
                                  <Chip size="small" label={statusLabel(trainingItem.progress?.status)} {...readableChipProps(theme, trainingItem.progress?.status === "completed" ? "success" : trainingItem.progress?.status === "in_progress" ? "warning" : "neutral")} />
                                  {renderTrainingItemActions(item, trainingItem)}
                                </Stack>
                              </Stack>
                            ))}
                          </Stack>
                        ) : (
                          <Alert severity="warning" variant="outlined">
                            This training set has no items yet, so there is nothing to start. Ask your manager to add videos, documents, acknowledgements, or quizzes in Training Sets.
                          </Alert>
                        )}
                        <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
                          Training status uses only Not started, In progress, and Completed. Failed quiz attempts keep the training in progress until you pass.
                        </Alert>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
                <CompactPagination pagination={trainingPagination} onChange={setTrainingPage} />
              </Stack>
            )}

            <Card
              variant="outlined"
              sx={{
                borderRadius: 1,
                borderColor: alpha(theme.palette.primary.main, 0.12),
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.045)}, ${alpha(theme.palette.background.paper, 0.96)})`,
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 950 }}>Learning Resources</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Optional materials shared by your manager.
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {Number(learningResourceSummary.unread_count || 0) > 0 && (
                        <Chip size="small" label={`${learningResourceSummary.unread_count} new`} {...readableChipProps(theme, "warning")} />
                      )}
                      <Chip size="small" label={`${learningResourceSummary.resources || learningResources.length} resource${Number(learningResourceSummary.resources || learningResources.length) === 1 ? "" : "s"}`} {...readableChipProps(theme, "info")} />
                    </Stack>
                  </Stack>
                  {learningResources.length ? (
                    <Stack spacing={0.85}>
                      {learningResources.map((resource) => {
                        const asset = resource.asset || {};
                        const isDocument = asset.asset_type === "document";
                        const busy = actionLoading === `resource-${resource.id}`;
                        const resourceReady = !isDocument || (Boolean(asset.has_file) && documentDownloadReady(asset));
                        const resourceWaiting = isDocument && documentSecurityWaiting(asset);
                        const resourceBlocked = isDocument && String(asset.scan_status || "").toLowerCase() === "blocked";
                        return (
                          <Stack
                            key={resource.id}
                            direction={{ xs: "column", md: "row" }}
                            spacing={1.25}
                            alignItems={{ xs: "stretch", md: "center" }}
                            sx={{
                              p: 1.15,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.background.paper, 0.82),
                              border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                            }}
                          >
                            <LearningResourceThumbnail resource={resource} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 950, ...lineClampSx(1) }}>
                                {resource.title}
                              </Typography>
                              <Stack direction="row" spacing={0.75} sx={{ mt: 0.45 }} flexWrap="wrap" useFlexGap>
                                <Chip size="small" label={asset.asset_type === "document" ? "Document" : "Video link"} {...readableChipProps(theme, "neutral")} />
                                {resource.is_new && <Chip size="small" label="New" {...readableChipProps(theme, "warning")} />}
                                {resource.category && <Chip size="small" label={resource.category} {...readableChipProps(theme, "primary")} />}
                                {resource.shared_by && <Chip size="small" label={`Shared by ${resource.shared_by}`} variant="outlined" />}
                                {resource.shared_date && <Chip size="small" label={formatTrainingDate(resource.shared_date)} variant="outlined" />}
                                {isDocument && asset.has_file && (
                                  <Chip
                                    size="small"
                                    icon={resourceWaiting ? <CircularProgress size={12} thickness={5} color="inherit" /> : undefined}
                                    label={documentSecurityLabel(asset)}
                                    {...readableChipProps(theme, resourceBlocked ? "warning" : resourceReady ? "success" : "info")}
                                  />
                                )}
                              </Stack>
                              {resource.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, ...lineClampSx(2) }}>
                                  {compactText(resource.description, 180)}
                                </Typography>
                              )}
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={resourceWaiting ? <CircularProgress size={13} thickness={5} /> : isDocument ? <DownloadIcon /> : <OpenInNewIcon />}
                              disabled={busy || asset.asset_type === "video_hosted" || !resourceReady}
                              onClick={() => openLearningResource(resource)}
                              sx={{ alignSelf: { xs: "flex-start", md: "center" }, fontWeight: 900, minWidth: 128 }}
                            >
                              {resourceWaiting ? "Checking file" : resourceBlocked ? "Blocked" : isDocument ? "Download" : "Open"}
                            </Button>
                          </Stack>
                        );
                      })}
                      <CompactPagination pagination={learningResourcePagination} onChange={setResourcePage} />
                    </Stack>
                  ) : (
                    <Alert severity="info" variant="outlined" sx={{ py: 0.75 }}>
                      No optional learning resources have been shared with you yet.
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <PreparedItem icon={<OndemandVideoIcon />} title="Video learning" text="External video links are the supported first version, keeping bandwidth and storage predictable." />
              </Grid>
              <Grid item xs={12} md={4}>
                <PreparedItem icon={<ArticleIcon />} title="Documents" text="Open assigned training documents, then confirm once you have reviewed them." />
              </Grid>
              <Grid item xs={12} md={4}>
                <PreparedItem icon={<QuizIcon />} title="Quizzes" text="Start a quiz, submit answers, and retry if you do not reach the passing score." />
              </Grid>
              <Grid item xs={12}>
                <PreparedItem
                  icon={<OndemandVideoIcon />}
                  title="Hosted video upload"
                  disabled
                  text={capabilities.hosted_video_message || "Hosted video upload is prepared but disabled for this release."}
                />
              </Grid>
            </Grid>
          </>
        )}
      </Stack>

      <Dialog open={Boolean(quizDialog)} onClose={() => setQuizDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {quizDialog?.attempt?.quiz_title || "Training quiz"}
        </DialogTitle>
        <DialogContent dividers>
          {quizDialog?.attempt && (
            <Stack spacing={2}>
              <Alert severity={quizResult?.passed ? "success" : quizResult ? "warning" : "info"} variant="outlined">
                {quizResult
                  ? `${quizResult.passed ? "Passed" : "Not passed"} · Score ${quizResult.score_percent}%`
                  : `Attempt ${quizDialog.attempt.attempt_number}. Passing score: ${quizDialog.attempt.passing_score_percent}%.`}
              </Alert>
              <LinearProgress
                variant="determinate"
                value={
                  quizDialog.attempt.questions?.length
                    ? (Object.keys(quizAnswers).length / quizDialog.attempt.questions.length) * 100
                    : 0
                }
                sx={{ borderRadius: 999 }}
              />
              {(quizDialog.attempt.questions || []).map((question, index) => (
                <Card key={question.id} variant="outlined" sx={{ borderRadius: 1 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                        {index + 1}. {question.question_text}
                      </Typography>
                      <FormControl>
                        <RadioGroup
                          value={quizAnswers[question.id] || ""}
                          onChange={(event) => setQuizAnswers((prev) => ({ ...prev, [question.id]: Number(event.target.value) }))}
                        >
                          {(question.options || []).map((option) => (
                            <FormControlLabel
                              key={option.id}
                              value={option.id}
                              control={<Radio size="small" />}
                              label={option.option_text}
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
              {quizResult && !quizResult.passed && (
                <Alert severity="info" variant="outlined">
                  You can close this quiz and start a new attempt when ready.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuizDialog(null)}>Close</Button>
          <Button
            variant="contained"
            disabled={
              !quizDialog?.attempt
              || actionLoading.startsWith("quiz-submit-")
              || Object.keys(quizAnswers).length < (quizDialog?.attempt?.questions || []).length
            }
            onClick={submitQuiz}
          >
            Submit quiz
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(videoDialog)}
        onClose={closeVideoDialog}
        maxWidth="lg"
        fullWidth
        BackdropProps={{
          sx: {
            backgroundColor: alpha(theme.palette.common.black, 0.78),
            backdropFilter: "blur(10px)",
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: 1,
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            bgcolor: `${theme.palette.background.paper} !important`,
            backgroundImage: `radial-gradient(circle at 100% 0%, ${alpha(theme.palette.primary.main, 0.16)}, transparent 28%), linear-gradient(180deg, ${theme.palette.background.paper}, ${theme.palette.background.paper}) !important`,
            boxShadow: `0 34px 90px ${alpha(theme.palette.common.black, 0.42)}`,
          },
        }}
      >
        <DialogTitle
          sx={{
            p: { xs: 2, md: 2.5 },
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.dark,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                flexShrink: 0,
              }}
            >
              <OndemandVideoIcon />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900 }}>
                Tracked training video
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.2 }}>
                {videoDialog?.item?.display_title || "Training video"}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" label="Tracked in Schedulaa" {...readableChipProps(theme, "success")} />
                <Chip size="small" label="90% completion threshold" {...readableChipProps(theme, "info")} />
              </Stack>
            </Box>
            <IconButton onClick={closeVideoDialog} size="small" aria-label="Close video player">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: { xs: 2, md: 2.5 },
            borderColor: alpha(theme.palette.primary.main, 0.12),
          }}
        >
          {videoDialog?.item && (
            <Stack spacing={2}>
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 1 }}>
                This video is tracked only while it plays inside Schedulaa. Closing the player saves progress so you can resume later.
              </Alert>
              <TrackedVideoPlayer
                trainingItem={videoDialog.item}
                onProgress={(payload) => sendVideoProgress(videoDialog.assignmentId, videoDialog.item.id, payload)}
              />
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.text.primary, 0.035),
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Required video items complete after 90% watched. The top-level training status still uses only Not started, In progress, and Completed.
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 2.5 }, py: 1.5 }}>
          <Button onClick={closeVideoDialog} variant="outlined">Close and save progress</Button>
        </DialogActions>
      </Dialog>
    </ManagementFrame>
  );
};

export default RecruiterMyTrainingPage;
