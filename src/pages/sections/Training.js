import React, { useEffect, useMemo, useState } from "react";
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
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Radio,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import ArticleIcon from "@mui/icons-material/Article";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import GroupsIcon from "@mui/icons-material/Groups";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import QuizIcon from "@mui/icons-material/Quiz";
import TimelineIcon from "@mui/icons-material/Timeline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import api from "../../utils/api";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "library", label: "Library" },
  { value: "resources", label: "Learning Resources" },
  { value: "collections", label: "Collections" },
  { value: "quizzes", label: "Quizzes" },
  { value: "sets", label: "Training Sets" },
  { value: "assignments", label: "Assignments" },
  { value: "progress", label: "Progress" },
];

const ASSET_TYPES = [
  { value: "video_link", label: "External video" },
  { value: "document", label: "Document" },
  { value: "video_hosted", label: "Hosted video" },
];

const DEFAULT_CATEGORY_OPTIONS = ["Onboarding", "New Hire", "HR Policies", "Safety", "Cleaning", "Customer Service"];

const TRAINING_PAGE_SIZES = {
  library: 12,
  resources: 12,
  quizzes: 12,
  collections: 10,
  sets: 10,
  assignments: 12,
  progress: 10,
};

const TRAINING_PAGE_SIZE_OPTIONS = [10, 12, 20, 50];

const emptyAssetForm = {
  id: null,
  asset_type: "video_link",
  title: "",
  description: "",
  external_url: "",
  duration_minutes: "",
  category: "Onboarding",
  is_active: true,
};

const emptyQuizForm = {
  id: null,
  title: "",
  description: "",
  category: "Onboarding",
  passing_score_percent: 80,
  is_active: true,
};

const emptyQuestionForm = {
  id: null,
  question_text: "",
  options: [
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ],
};

const emptyResourceForm = {
  id: null,
  asset_id: "",
  title_override: "",
  description_override: "",
  category: "",
  department_ids: [],
  employee_ids: [],
  is_published: true,
  is_archived: false,
};

const getQuestionDraftState = (questionForm) => {
  const options = (questionForm.options || [])
    .map((option) => ({
      option_text: (option.option_text || "").trim(),
      is_correct: Boolean(option.is_correct),
    }))
    .filter((option) => option.option_text);
  return {
    hasQuestion: Boolean((questionForm.question_text || "").trim()),
    optionCount: options.length,
    hasCorrect: options.some((option) => option.is_correct),
  };
};

const isQuestionDraftValid = (questionForm) => {
  const state = getQuestionDraftState(questionForm);
  return state.hasQuestion && state.optionCount >= 2 && state.hasCorrect;
};

const emptySetForm = {
  id: null,
  name: "",
  description: "",
  is_active: true,
};

const emptyCollectionForm = {
  id: null,
  name: "",
  description: "",
  category: "Onboarding",
  is_active: true,
};

const emptyAddCollectionForm = {
  collection_id: "",
};

const emptySetItemForm = {
  id: null,
  item_type: "video",
  asset_id: "",
  quiz_id: "",
  title_override: "",
  description_override: "",
  acknowledgement_text: "",
  is_required: true,
  scheduled_at: "",
  meeting_link: "",
};

const emptyManualAssignmentForm = {
  department_id: "",
  employee_id: "",
  training_set_id: "",
};

const emptyDepartmentAssignmentForm = {
  department_id: "",
  training_set_ids: [],
};

const tabCopy = {
  sets: {
    title: "Training sets",
    body: "Combine videos, documents, quizzes, acknowledgements, and later live sessions into a clear employee flow.",
    coming: "Training set building is available. Assignments and employee completion workflows arrive later.",
  },
  assignments: {
    title: "Assignments",
    body: "Assign training sets to departments or individual employees.",
    coming: "Assignment workflows are available. Employee completion actions are intentionally deferred.",
  },
  progress: {
    title: "Progress tracking",
    body: "Review completion status, quiz attempts, and employee progress once assignments exist.",
    coming: "The reporting contract is live; rows appear after assignment workflows are enabled.",
  },
};

const formatAssetType = (value) => ASSET_TYPES.find((item) => item.value === value)?.label || value || "Asset";
const minutesFromSeconds = (seconds) => (seconds ? Math.round(Number(seconds) / 60) : "");
const compactText = (value, max = 130) => {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};
const formatTrainingDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const lineClampSx = (lines = 2) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});
const deriveVideoSource = (url) => {
  const text = String(url || "").toLowerCase();
  if (!text) return "";
  if (text.includes("youtube.com") || text.includes("youtu.be")) return "YouTube";
  if (text.includes("vimeo.com")) return "Vimeo";
  if (text.includes("loom.com")) return "Loom";
  if (text.includes("drive.google.com")) return "Drive";
  if (text.includes("cloudflare")) return "Cloudflare";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_err) {
    return "";
  }
};
const videoTrackingLabel = (asset) => {
  if (asset?.tracking_mode === "tracked_embed") return "Tracked in Schedulaa";
  if (asset?.tracking_mode === "hosted_future") return "Hosted video later";
  return "View only";
};
const getExternalPreviewUrl = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (host.includes("youtube.com")) {
      const id = parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (host.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
    if (host.includes("loom.com")) {
      return url.replace("/share/", "/embed/");
    }
    if (host.includes("drive.google.com")) {
      return url.replace("/view", "/preview");
    }
    return url;
  } catch (_err) {
    return url;
  }
};

const audiencePreviewLabel = (resource) => {
  const departments = resource.audience_preview?.departments || resource.departments || [];
  const employees = resource.audience_preview?.employees || resource.employees || [];
  const departmentMore = Number(resource.audience_preview?.department_more_count || Math.max(0, (resource.departments || []).length - departments.length));
  const employeeMore = Number(resource.audience_preview?.employee_more_count || Math.max(0, (resource.employees || []).length - employees.length));
  const parts = [];
  if (departments.length) {
    parts.push(`${departments.map((department) => department.name).join(", ")}${departmentMore ? ` +${departmentMore} more` : ""}`);
  }
  if (employees.length) {
    parts.push(`${employees.map((employee) => employee.name || employee.email).join(", ")}${employeeMore ? ` +${employeeMore} more` : ""}`);
  }
  return parts.join(" · ") || resource.audience_summary || "No audience";
};
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
const getVideoThumbnailUrl = (url) => {
  const youtubeId = getYouTubeVideoId(url);
  return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : "";
};
const fileExtension = (asset) => {
  const name = String(asset?.file_name || asset?.external_url || "").split("?")[0].toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  return ext ? ext.toUpperCase() : "";
};
const documentPreviewKind = (asset, contentType = "") => {
  const type = String(contentType || asset?.mime_type || "").toLowerCase();
  const name = String(asset?.file_name || "").toLowerCase();
  if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (type.startsWith("image/") || [".png", ".jpg", ".jpeg"].some((ext) => name.endsWith(ext))) return "image";
  return "download";
};
const formatBytesAsMb = (bytes) => {
  const numeric = Number(bytes || 0);
  if (!numeric) return "";
  return `${Math.round((numeric / (1024 * 1024)) * 10) / 10} MB`;
};
const getCollectionBreakdown = (collection) => {
  const counts = {};
  (collection?.items || []).forEach((item) => {
    counts[item.item_type] = (counts[item.item_type] || 0) + 1;
  });
  return counts;
};
const formatBreakdown = (counts = {}) => {
  const labels = [
    ["video", "video"],
    ["document", "document"],
    ["quiz", "quiz"],
    ["acknowledgement", "acknowledgement"],
    ["live_session", "live session"],
  ];
  return labels
    .filter(([key]) => counts[key])
    .map(([key, label]) => `${counts[key]} ${label}${counts[key] === 1 ? "" : "s"}`)
    .join(" · ");
};

const StatCard = ({ label, value, helper }) => {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 1,
        borderColor: alpha(theme.palette.primary.main, 0.18),
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.075)}, ${alpha(theme.palette.background.paper, 0.96)})`,
        boxShadow: `0 14px 34px ${alpha(theme.palette.common.black, 0.045)}`,
      }}
    >
      <CardContent sx={{ p: 1.75 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 0.9 }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.25, fontWeight: 900, lineHeight: 1 }}>
          {value ?? 0}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block", lineHeight: 1.35 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
};

const CompactPagination = ({ pagination, onChange, pageSize, onPageSizeChange }) => {
  if (!pagination || Number(pagination.total || 0) <= Number(pagination.page_size || 0)) return null;
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
      sx={{ pt: 0.5 }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
        Showing page {pagination.page || 1} of {pagination.total_pages || 1} · {pagination.total || 0} total
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
        {onPageSizeChange && (
          <FormControl size="small" sx={{ minWidth: 116 }}>
            <InputLabel>Rows</InputLabel>
            <Select label="Rows" value={pageSize || pagination.page_size || 12} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
              {TRAINING_PAGE_SIZE_OPTIONS.map((size) => <MenuItem key={size} value={size}>{size} rows</MenuItem>)}
            </Select>
          </FormControl>
        )}
        <Pagination
          size="small"
          shape="rounded"
          color="primary"
          page={pagination.page || 1}
          count={pagination.total_pages || 1}
          onChange={(_, page) => onChange(page)}
        />
      </Stack>
    </Stack>
  );
};

const CapabilityCard = ({ icon, title, status, children, disabled = false }) => {
  const theme = useTheme();
  const statusStyles = disabled
    ? {
      color: theme.palette.warning.dark,
      backgroundColor: alpha(theme.palette.warning.main, 0.12),
      borderColor: alpha(theme.palette.warning.main, 0.36),
    }
    : status === "Available"
      ? {
        color: theme.palette.success.dark,
        backgroundColor: alpha(theme.palette.success.main, 0.12),
        borderColor: alpha(theme.palette.success.main, 0.3),
      }
      : {
        color: theme.palette.info.dark,
        backgroundColor: alpha(theme.palette.info.main, 0.12),
        borderColor: alpha(theme.palette.info.main, 0.3),
      };
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 1,
        borderColor: disabled ? alpha(theme.palette.warning.main, 0.24) : alpha(theme.palette.text.primary, 0.1),
        backgroundColor: disabled ? alpha(theme.palette.warning.main, 0.045) : alpha(theme.palette.background.paper, 0.82),
        boxShadow: disabled ? "none" : `0 10px 26px ${alpha(theme.palette.common.black, 0.035)}`,
      }}
    >
      <CardContent sx={{ p: disabled ? 1.75 : 2 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1,
              color: disabled ? theme.palette.warning.dark : theme.palette.primary.main,
              bgcolor: alpha(disabled ? theme.palette.warning.main : theme.palette.primary.main, 0.1),
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>{title}</Typography>
          <Chip
            size="small"
            label={status}
            variant="outlined"
            sx={{
              ...statusStyles,
              fontWeight: 800,
              "& .MuiChip-label": { px: 1 },
            }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>{children}</Typography>
      </CardContent>
    </Card>
  );
};

const DeferredSection = ({ activeTab, data }) => {
  const copy = tabCopy[activeTab] || tabCopy.sets;
  return (
    <Card variant="outlined" sx={{ borderRadius: 1 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{copy.title}</Typography>
          <Typography variant="body1" color="text.secondary">{copy.body}</Typography>
          <Alert severity="info" variant="outlined">{copy.coming}</Alert>
          <Typography variant="body2" color="text.secondary">
            Current rows: {Array.isArray(data?.items) ? data.items.length : 0}. No employee workflow mutations are enabled in this phase.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

const AssetCard = ({ asset, onEdit, onUpload, onDownload, onArchiveToggle, onPreview }) => {
  const theme = useTheme();
  const isHosted = asset.asset_type === "video_hosted";
  const videoSource = asset.asset_type === "video_link" ? deriveVideoSource(asset.external_url) : "";
  const thumbnailUrl = asset.asset_type === "video_link" ? getVideoThumbnailUrl(asset.external_url) : "";
  const docKind = asset.asset_type === "document" ? documentPreviewKind(asset) : "";
  const ext = fileExtension(asset);
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 1,
        height: "100%",
        overflow: "hidden",
        borderColor: alpha(asset.asset_type === "document" ? theme.palette.info.main : theme.palette.primary.main, 0.16),
        background: `radial-gradient(circle at 100% 0%, ${alpha(asset.asset_type === "document" ? theme.palette.info.main : theme.palette.primary.main, 0.12)}, transparent 28%), linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.045)}, ${alpha(theme.palette.background.paper, 0.98)} 42%)`,
        boxShadow: `0 18px 48px ${alpha(theme.palette.common.black, 0.055)}`,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          bgcolor: alpha(asset.asset_type === "document" ? theme.palette.info.main : theme.palette.primary.main, 0.08),
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ display: "flex", color: asset.asset_type === "document" ? "info.main" : "primary.main" }}>
            {asset.asset_type === "document" ? <ArticleIcon fontSize="small" /> : <OndemandVideoIcon fontSize="small" />}
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 850, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {asset.asset_type === "document" ? "Private document" : isHosted ? "Hosted video future" : "External video"}
          </Typography>
        </Stack>
      </Box>
      <Box
        onClick={() => !isHosted && !(asset.asset_type === "document" && !asset.has_file) && onPreview(asset)}
        sx={{
          height: 150,
          m: 1.5,
          mb: 0,
          borderRadius: 1,
          overflow: "hidden",
          position: "relative",
          cursor: isHosted || (asset.asset_type === "document" && !asset.has_file) ? "default" : "pointer",
          border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          background: thumbnailUrl
            ? `linear-gradient(135deg, ${alpha(theme.palette.common.black, 0.1)}, ${alpha(theme.palette.common.black, 0.36)}), url(${thumbnailUrl}) center/cover`
            : `radial-gradient(circle at 18% 20%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 30%), linear-gradient(135deg, ${alpha(asset.asset_type === "document" ? theme.palette.info.main : theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.text.primary, 0.05)})`,
        }}
      >
        <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", color: thumbnailUrl ? "common.white" : "text.primary" }} spacing={1}>
          {asset.asset_type === "video_link" && <PlayCircleOutlineIcon sx={{ fontSize: 48, filter: thumbnailUrl ? "drop-shadow(0 8px 20px rgba(0,0,0,0.35))" : "none" }} />}
          {isHosted && <OndemandVideoIcon sx={{ fontSize: 44, color: "warning.dark" }} />}
          {asset.asset_type === "document" && docKind === "pdf" && <PictureAsPdfIcon sx={{ fontSize: 46, color: "error.main" }} />}
          {asset.asset_type === "document" && docKind === "image" && <ImageIcon sx={{ fontSize: 46, color: "info.main" }} />}
          {asset.asset_type === "document" && !["pdf", "image"].includes(docKind) && <InsertDriveFileIcon sx={{ fontSize: 46, color: "info.main" }} />}
          <Chip
            size="small"
            label={
              asset.asset_type === "video_link"
                ? (videoSource || "Video link")
                : isHosted
                  ? "Future hosted video"
                  : asset.has_file
                    ? `${ext || "DOC"} preview`
                    : "No file uploaded"
            }
            sx={{
              fontWeight: 850,
              color: thumbnailUrl ? theme.palette.common.white : theme.palette.text.primary,
              bgcolor: thumbnailUrl ? alpha(theme.palette.common.black, 0.38) : alpha(theme.palette.background.paper, 0.72),
              borderColor: thumbnailUrl ? alpha(theme.palette.common.white, 0.28) : alpha(theme.palette.text.primary, 0.12),
              backdropFilter: "blur(8px)",
            }}
            variant="outlined"
          />
        </Stack>
      </Box>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={formatAssetType(asset.asset_type)} {...readableChipProps(theme, asset.asset_type === "document" ? "info" : "primary")} />
            <Chip size="small" label={asset.is_active ? "Active" : "Inactive"} {...readableChipProps(theme, asset.is_active ? "success" : "neutral")} />
            {asset.asset_type === "video_link" && (
              <Chip
                size="small"
                label={videoTrackingLabel(asset)}
                {...readableChipProps(theme, asset.tracking_mode === "tracked_embed" ? "success" : "neutral")}
              />
            )}
            {isHosted && <Chip size="small" label="Disabled" {...readableChipProps(theme, "warning")} />}
          </Stack>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: "-0.01em", ...lineClampSx(1) }}>{asset.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ minHeight: 38, ...lineClampSx(2) }}>
            {compactText(asset.description, 120) || "No description added."}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {asset.category && <Chip size="small" label={asset.category} />}
            {videoSource && <Chip size="small" label={videoSource} variant="outlined" />}
            {asset.duration_seconds ? <Chip size="small" label={`${minutesFromSeconds(asset.duration_seconds)} min`} /> : null}
            {asset.file_name && <Chip size="small" label={compactText(asset.file_name, 34)} />}
          </Stack>
          {asset.asset_type === "video_link" && asset.external_url && (
            <Stack spacing={0.5}>
              <Tooltip title={asset.external_url}>
                <Typography variant="caption" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", fontWeight: 750 }}>
                  External link{videoSource ? ` · ${videoSource}` : ""}
                </Typography>
              </Tooltip>
              <Typography variant="caption" color="text.secondary">
                {asset.tracking_mode === "tracked_embed"
                  ? "Employees watch this inside Schedulaa; progress can be tracked."
                  : "View-only link. Schedulaa cannot verify watch completion for this provider."}
              </Typography>
            </Stack>
          )}
          {isHosted && (
            <Alert severity="warning" variant="outlined" sx={{ py: 0.5 }}>
              Hosted upload is not active yet. Use an external video link for now.
            </Alert>
          )}
          <Divider />
          <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              disabled={(asset.asset_type === "document" && !asset.has_file) || isHosted}
              onClick={() => onPreview(asset)}
            >
              Preview
            </Button>
            {asset.asset_type === "document" && (
              <>
                <Button size="small" startIcon={<UploadFileIcon />} onClick={() => onUpload(asset)}>Upload</Button>
                <Button size="small" startIcon={<DownloadIcon />} disabled={!asset.has_file} onClick={() => onDownload(asset)}>Download</Button>
              </>
            )}
            <Button size="small" color={asset.is_active ? "warning" : "success"} onClick={() => onArchiveToggle(asset)}>
              {asset.is_active ? "Archive" : "Restore"}
            </Button>
            <Button size="small" startIcon={<EditIcon />} onClick={() => onEdit(asset)}>Edit</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const LearningResourceCard = ({ resource, onEdit, onArchiveToggle, onPublishToggle, onDetails }) => {
  const theme = useTheme();
  const asset = resource.asset || {};
  const videoSource = asset.asset_type === "video_link" ? deriveVideoSource(asset.external_url) : "";
  const audienceTone = resource.audience_type === "mixed" ? "primary" : resource.audience_type === "department" ? "success" : "info";
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 1,
        borderColor: alpha(theme.palette.primary.main, 0.12),
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.045)}, ${alpha(theme.palette.background.paper, 0.98)})`,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                color: theme.palette.primary.dark,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              {asset.asset_type === "document" ? <ArticleIcon fontSize="small" /> : <OndemandVideoIcon fontSize="small" />}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, ...lineClampSx(1) }}>
                {resource.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatAssetType(asset.asset_type)}{videoSource ? ` · ${videoSource}` : ""}
              </Typography>
            </Box>
            <Chip size="small" label={resourceStatusLabel(resource)} {...readableChipProps(theme, resourceStatusTone(resource))} />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ minHeight: 38, ...lineClampSx(2) }}>
            {compactText(resource.description, 130) || "No description added."}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {resource.category && <Chip size="small" label={resource.category} {...readableChipProps(theme, "primary")} />}
            <Chip size="small" label={resource.audience_summary || "No audience"} {...readableChipProps(theme, audienceTone)} />
            <Chip
              size="small"
              label={`Viewed ${resource.viewed_employee_count || 0}/${resource.targeted_employee_count || 0}`}
              {...readableChipProps(theme, "success")}
            />
            <Chip size="small" label={`Unread ${resource.unread_employee_count || 0}`} {...readableChipProps(theme, "warning")} />
            <Chip size="small" label={`Shared ${formatTrainingDate(resource.shared_date || resource.created_at)}`} variant="outlined" />
            {asset.file_name && <Chip size="small" label={compactText(asset.file_name, 30)} variant="outlined" />}
          </Stack>
          <Box sx={{ p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.045), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25, fontWeight: 800 }}>
              Audience
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 750, ...lineClampSx(1) }}>
              {audiencePreviewLabel(resource)}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Shared by {resource.shared_by || "Unknown"} · Updated {formatTrainingDate(resource.updated_at)}
          </Typography>
          <Divider />
          <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
            <Button size="small" startIcon={<VisibilityIcon />} onClick={() => onDetails(resource)}>
              Details
            </Button>
            {!resource.is_archived && (
              <Button size="small" color={resource.is_published ? "warning" : "success"} onClick={() => onPublishToggle(resource)}>
                {resource.is_published ? "Unpublish" : "Publish"}
              </Button>
            )}
            <Button size="small" color={resource.is_archived ? "success" : "warning"} onClick={() => onArchiveToggle(resource)}>
              {resource.is_archived ? "Restore" : "Archive"}
            </Button>
            <Button size="small" startIcon={<EditIcon />} onClick={() => onEdit(resource)}>
              Edit
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const QuizCard = ({ quiz, selected, onSelect, onEdit }) => {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 1,
        cursor: "pointer",
        borderColor: selected ? alpha(theme.palette.primary.main, 0.8) : alpha(theme.palette.primary.main, 0.12),
        background: selected
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.background.paper, 0.96)})`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.045)}, ${alpha(theme.palette.background.paper, 0.98)})`,
        boxShadow: selected ? `0 16px 42px ${alpha(theme.palette.primary.main, 0.12)}` : "none",
      }}
      onClick={() => onSelect(quiz)}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 900, flex: 1, ...lineClampSx(1) }}>{quiz.title}</Typography>
            <Chip size="small" label={`v${quiz.version || 1}`} {...readableChipProps(theme, "primary")} />
            <IconButton size="small" onClick={(event) => { event.stopPropagation(); onEdit(quiz); }}><EditIcon fontSize="small" /></IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={lineClampSx(2)}>{compactText(quiz.description, 120) || "No description added."}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {quiz.category && <Chip size="small" label={quiz.category} />}
            <Chip size="small" label={`${quiz.passing_score_percent || 0}% pass`} />
            <Chip size="small" label={`${quiz.question_count || 0} question(s)`} />
            <Chip size="small" label={quiz.is_active ? "Active" : "Inactive"} {...readableChipProps(theme, quiz.is_active ? "success" : "neutral")} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const TrainingSetCard = ({ trainingSet, selected, onSelect, onEdit }) => {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 1,
        cursor: "pointer",
        borderColor: selected ? alpha(theme.palette.primary.main, 0.8) : alpha(theme.palette.primary.main, 0.12),
        background: selected
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.background.paper, 0.96)})`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.045)}, ${alpha(theme.palette.background.paper, 0.98)})`,
        boxShadow: selected ? `0 16px 42px ${alpha(theme.palette.primary.main, 0.12)}` : "none",
      }}
      onClick={() => onSelect(trainingSet)}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 900, flex: 1, ...lineClampSx(1) }}>{trainingSet.name}</Typography>
            <Chip size="small" label={trainingSet.is_active ? "Active" : "Inactive"} {...readableChipProps(theme, trainingSet.is_active ? "success" : "neutral")} />
            <IconButton size="small" onClick={(event) => { event.stopPropagation(); onEdit(trainingSet); }}><EditIcon fontSize="small" /></IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={lineClampSx(2)}>{compactText(trainingSet.description, 120) || "No description added."}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`${trainingSet.item_count || trainingSet.items?.length || 0} item(s)`} />
            <Chip size="small" label="Reusable program" variant="outlined" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const CollectionCard = ({ collection, selected, onSelect, onEdit }) => {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 1,
        cursor: "pointer",
        borderColor: selected ? alpha(theme.palette.primary.main, 0.8) : alpha(theme.palette.primary.main, 0.12),
        background: selected
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.background.paper, 0.96)})`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.045)}, ${alpha(theme.palette.background.paper, 0.98)})`,
        boxShadow: selected ? `0 16px 42px ${alpha(theme.palette.primary.main, 0.12)}` : "none",
      }}
      onClick={() => onSelect(collection)}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 900, flex: 1, ...lineClampSx(1) }}>{collection.name}</Typography>
            <Chip size="small" label={collection.is_active ? "Active" : "Inactive"} {...readableChipProps(theme, collection.is_active ? "success" : "neutral")} />
            <IconButton size="small" onClick={(event) => { event.stopPropagation(); onEdit(collection); }}><EditIcon fontSize="small" /></IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={lineClampSx(2)}>{compactText(collection.description, 120) || "No description added."}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {collection.category && <Chip size="small" label={collection.category} />}
            <Chip size="small" label={`${collection.item_count || collection.items?.length || 0} item(s)`} />
            <Chip size="small" label="Reusable collection" variant="outlined" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const CategoryField = ({ label = "Category", value, onChange, categories }) => {
  const options = Array.from(new Set([...(categories || []), ...DEFAULT_CATEGORY_OPTIONS].filter(Boolean))).sort((a, b) => a.localeCompare(b));
  return (
    <>
      <TextField
        label={label}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        fullWidth
        placeholder="Example: New Hire, Safety, Reception"
        helperText="Choose an existing category or type a new one."
        inputProps={{ list: "training-category-options" }}
      />
      {options.length > 0 && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
          {options.slice(0, 6).map((category) => (
            <Chip key={category} size="small" label={category} variant="outlined" onClick={() => onChange(category)} />
          ))}
        </Stack>
      )}
      <datalist id="training-category-options">
        {options.map((category) => <option key={category} value={category} />)}
      </datalist>
    </>
  );
};

const formatSetItemType = (value) => ({
  video: "Video",
  document: "Document",
  quiz: "Quiz",
  acknowledgement: "Acknowledgement",
  live_session: "Live session",
}[value] || value || "Item");

const formatTrainingStatus = (value) => ({
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
}[value] || "Not started");

const statusTone = (value) => (
  value === "completed" ? "success" : value === "in_progress" ? "warning" : "default"
);

const resourceStatusLabel = (resource) => {
  if (resource?.is_archived) return "Archived";
  return resource?.is_published ? "Published" : "Draft";
};

const resourceStatusTone = (resource) => {
  if (resource?.is_archived) return "neutral";
  return resource?.is_published ? "success" : "warning";
};

const completionPercent = (assignment) => {
  const required = Number(assignment?.required_item_count || 0);
  if (!required) return 100;
  return Math.round((Number(assignment?.completed_required_count || 0) / required) * 100);
};

const chipSx = (theme, tone = "neutral") => {
  const palette = {
    primary: theme.palette.primary,
    success: theme.palette.success,
    warning: theme.palette.warning,
    info: theme.palette.info,
    danger: theme.palette.error,
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

const Training = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [tabData, setTabData] = useState({});
  const [trainingPages, setTrainingPages] = useState({
    library: 1,
    resources: 1,
    quizzes: 1,
    collections: 1,
    sets: 1,
    assignments: 1,
    progress: 1,
  });
  const [trainingPageSizes, setTrainingPageSizes] = useState(TRAINING_PAGE_SIZES);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("all");
  const [assetStatusFilter, setAssetStatusFilter] = useState("active");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assetSearch, setAssetSearch] = useState("");
  const [resourceStatusFilter, setResourceStatusFilter] = useState("active");
  const [resourceAudienceFilter, setResourceAudienceFilter] = useState("all");
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceEmployeeDepartmentFilter, setResourceEmployeeDepartmentFilter] = useState("");
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [assetForm, setAssetForm] = useState(emptyAssetForm);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState(emptyResourceForm);
  const [resourceDetail, setResourceDetail] = useState(null);
  const [uploadAsset, setUploadAsset] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizForm, setQuizForm] = useState(emptyQuizForm);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [setDialogOpen, setSetDialogOpen] = useState(false);
  const [setForm, setSetForm] = useState(emptySetForm);
  const [selectedSet, setSelectedSet] = useState(null);
  const [setItemDialogOpen, setSetItemDialogOpen] = useState(false);
  const [setItemForm, setSetItemForm] = useState(emptySetItemForm);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [collectionForm, setCollectionForm] = useState(emptyCollectionForm);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionItemDialogOpen, setCollectionItemDialogOpen] = useState(false);
  const [collectionItemForm, setCollectionItemForm] = useState(emptySetItemForm);
  const [addCollectionDialogOpen, setAddCollectionDialogOpen] = useState(false);
  const [addCollectionForm, setAddCollectionForm] = useState(emptyAddCollectionForm);
  const [manualAssignmentForm, setManualAssignmentForm] = useState(emptyManualAssignmentForm);
  const [departmentAssignmentForm, setDepartmentAssignmentForm] = useState(emptyDepartmentAssignmentForm);
  const [departmentAssignments, setDepartmentAssignments] = useState({ items: [], context: {} });
  const [assignmentFilters, setAssignmentFilters] = useState({ department_id: "", employee_id: "", training_set_id: "", status: "", source_type: "" });
  const [syncResults, setSyncResults] = useState({});
  const [syncingDepartmentId, setSyncingDepartmentId] = useState("");
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewKind, setPreviewKind] = useState("");
  const [previewObjectUrl, setPreviewObjectUrl] = useState("");

  const loadOverview = () => {
    setLoading(true);
    return api.get("/manager/training/overview")
      .then((res) => setOverview(res.data || null))
      .catch((err) => setError(err?.response?.data?.error || "Unable to load training overview."))
      .finally(() => setLoading(false));
  };

  const loadTab = (tab = activeTab, force = false) => {
    if (tab === "overview") return Promise.resolve();
    if (!force && tabData[tab]) return Promise.resolve();
    const endpoint = {
      library: "/manager/training/assets",
      resources: "/manager/training/resources",
      collections: "/manager/training/collections",
      quizzes: "/manager/training/quizzes",
      sets: "/manager/training/sets",
      assignments: "/manager/training/assignments",
      progress: "/manager/training/progress",
    }[tab];
    if (!endpoint) return Promise.resolve();
    setTabLoading(true);
    const pageParams = {
      page: trainingPages[tab] || 1,
      page_size: trainingPageSizes[tab] || TRAINING_PAGE_SIZES[tab] || 12,
    };
    const params = tab === "library"
      ? { ...pageParams, asset_type: assetTypeFilter === "all" ? undefined : assetTypeFilter, status: assetStatusFilter, category: categoryFilter === "all" ? undefined : categoryFilter, search: assetSearch || undefined }
      : tab === "resources"
        ? {
          ...pageParams,
          status: resourceStatusFilter === "archived" ? "archived" : resourceStatusFilter === "draft" ? "draft" : resourceStatusFilter === "published" ? "published" : undefined,
          audience_type: resourceAudienceFilter === "all" ? undefined : resourceAudienceFilter,
          search: resourceSearch || undefined,
        }
      : tab === "collections" || tab === "quizzes"
        ? { ...pageParams, category: categoryFilter === "all" ? undefined : categoryFilter, search: assetSearch || undefined }
      : tab === "assignments"
        ? { ...pageParams, ...Object.fromEntries(Object.entries(assignmentFilters).filter(([, value]) => value)) }
      : pageParams;
    return api.get(endpoint, { params })
      .then((res) => setTabData((prev) => ({ ...prev, [tab]: res.data || {} })))
      .catch((err) => setError(err?.response?.data?.error || "Unable to load training section."))
      .finally(() => setTabLoading(false));
  };

  const updateTrainingPage = (tab, page) => {
    setTrainingPages((prev) => ({ ...prev, [tab]: page }));
  };

  const resetTrainingPage = (tab) => {
    setTrainingPages((prev) => ({ ...prev, [tab]: 1 }));
  };

  const updateTrainingPageSize = (tab, pageSize) => {
    setTrainingPageSizes((prev) => ({ ...prev, [tab]: pageSize }));
    setTrainingPages((prev) => ({ ...prev, [tab]: 1 }));
  };

  useEffect(() => { loadOverview(); }, []);

  useEffect(() => {
    loadTab(activeTab, true);
    if (activeTab === "sets") {
      api.get("/manager/training/assets", { params: { page_size: 100 } }).then((res) => setTabData((prev) => ({ ...prev, library: res.data || {} }))).catch(() => {});
      api.get("/manager/training/quizzes", { params: { page_size: 100 } }).then((res) => setTabData((prev) => ({ ...prev, quizzes: res.data || {} }))).catch(() => {});
      api.get("/manager/training/collections", { params: { page_size: 100 } }).then((res) => setTabData((prev) => ({ ...prev, collections: res.data || {} }))).catch(() => {});
    }
    if (activeTab === "collections") {
      api.get("/manager/training/assets", { params: { page_size: 100 } }).then((res) => setTabData((prev) => ({ ...prev, library: res.data || {} }))).catch(() => {});
      api.get("/manager/training/quizzes", { params: { page_size: 100 } }).then((res) => setTabData((prev) => ({ ...prev, quizzes: res.data || {} }))).catch(() => {});
    }
    if (activeTab === "resources") {
      api.get("/manager/training/assets", { params: { status: "active", page_size: 100 } }).then((res) => setTabData((prev) => ({ ...prev, library: res.data || {} }))).catch(() => {});
    }
    if (activeTab === "assignments") {
      api.get("/manager/training/department-assignments").then((res) => setDepartmentAssignments(res.data || { items: [], context: {} })).catch(() => {});
      api.get("/manager/training/sets", { params: { page_size: 100 } }).then((res) => setTabData((prev) => ({ ...prev, sets: res.data || {} }))).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "assignments") loadTab("assignments", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentFilters, trainingPages.assignments, trainingPageSizes.assignments]);

  useEffect(() => {
    if (["library", "collections", "quizzes"].includes(activeTab)) loadTab(activeTab, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetTypeFilter, assetStatusFilter, categoryFilter, trainingPages.library, trainingPages.collections, trainingPages.quizzes, trainingPageSizes.library, trainingPageSizes.collections, trainingPageSizes.quizzes]);

  useEffect(() => {
    if (activeTab === "resources") loadTab("resources", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceStatusFilter, resourceAudienceFilter, trainingPages.resources, trainingPageSizes.resources]);

  useEffect(() => {
    if (activeTab === "sets") loadTab("sets", true);
    if (activeTab === "progress") loadTab("progress", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingPages.sets, trainingPages.progress, trainingPageSizes.sets, trainingPageSizes.progress]);

  useEffect(() => {
    const pagination = tabData[activeTab]?.pagination;
    if (pagination && Number(pagination.page || 1) > Math.max(1, Number(pagination.total_pages || 1))) {
      updateTrainingPage(activeTab, Math.max(1, pagination.total_pages || 1));
    }
    if (pagination && Number(pagination.total || 0) === 0 && Number(pagination.page || 1) !== 1) updateTrainingPage(activeTab, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabData]);

  useEffect(() => {
    const currentRows = tabData[activeTab]?.items || [];
    if (activeTab === "quizzes" && selectedQuiz && !currentRows.some((quiz) => quiz.id === selectedQuiz.id)) setSelectedQuiz(null);
    if (activeTab === "collections" && selectedCollection && !currentRows.some((collection) => collection.id === selectedCollection.id)) setSelectedCollection(null);
    if (activeTab === "sets" && selectedSet && !currentRows.some((trainingSet) => trainingSet.id === selectedSet.id)) setSelectedSet(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabData]);

  useEffect(() => () => {
    if (previewObjectUrl) window.URL.revokeObjectURL(previewObjectUrl);
  }, [previewObjectUrl]);

  const summary = overview?.summary || {};
  const capabilities = overview?.capabilities || {};
  const activeData = activeTab === "overview" ? overview : tabData[activeTab];
  const activePagination = activeData?.pagination || null;
  const assets = tabData.library?.items || [];
  const resources = tabData.resources?.items || [];
  const collections = tabData.collections?.items || [];
  const quizzes = tabData.quizzes?.items || [];
  const trainingSets = tabData.sets?.items || [];
  const assignments = tabData.assignments?.items || [];
  const progressRows = tabData.progress?.items || [];
  const progressSummary = tabData.progress?.summary || {};
  const assignmentContext = tabData.assignments?.context || departmentAssignments.context || {};
  const resourceContext = tabData.resources?.context || {};
  const departments = assignmentContext.departments || resourceContext.departments || [];
  const employees = assignmentContext.employees || resourceContext.employees || [];
  const resourceAssets = resourceContext.assets || assets;
  const assignableSets = assignmentContext.training_sets || trainingSets;
  const readyAssignableSets = assignableSets.filter((trainingSet) => trainingSet.is_active && Number(trainingSet.item_count || trainingSet.items?.length || 0) > 0);
  const manualAssignmentEmployees = manualAssignmentForm.department_id
    ? employees.filter((employee) => String(employee.department_id || "") === String(manualAssignmentForm.department_id))
    : employees;
  const resourceDialogEmployees = resourceEmployeeDepartmentFilter
    ? employees.filter((employee) => {
        if (resourceEmployeeDepartmentFilter === "__unassigned") return !employee.department_id;
        return String(employee.department_id || "") === String(resourceEmployeeDepartmentFilter);
      })
    : employees;
  const resourceSelectedEmployees = employees.filter((employee) => (resourceForm.employee_ids || []).some((id) => String(id) === String(employee.id)));
  const resourceDialogEmployeeOptions = [
    ...resourceDialogEmployees,
    ...resourceSelectedEmployees.filter((selected) => !resourceDialogEmployees.some((employee) => String(employee.id) === String(selected.id))),
  ];
  const getDepartmentName = (departmentId) => departments.find((department) => String(department.id) === String(departmentId))?.name || "Unassigned";
  const selectedQuizId = selectedQuiz?.id;
  const selectedSetId = selectedSet?.id;
  const selectedCollectionId = selectedCollection?.id;
  const categories = Array.from(new Set([
    ...(overview?.categories || []),
    ...(tabData.library?.categories || []),
    ...(tabData.resources?.categories || []),
    ...(tabData.collections?.categories || []),
    ...(tabData.quizzes?.categories || []),
    ...DEFAULT_CATEGORY_OPTIONS,
  ].filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const visibleLibraryAssets = assets.filter((asset) => {
    if (assetStatusFilter === "active" && !asset.is_active) return false;
    if (assetStatusFilter === "archived" && asset.is_active) return false;
    if (assetTypeFilter !== "all" && asset.asset_type !== assetTypeFilter) return false;
    if (categoryFilter !== "all" && asset.category !== categoryFilter) return false;
    const search = String(assetSearch || "").trim().toLowerCase();
    if (search) {
      const haystack = [
        asset.title,
        asset.description,
        asset.category,
        asset.external_url,
        asset.file_name,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  const activeCollections = collections.filter((collection) => collection.is_active && Number(collection.item_count || collection.items?.length || 0) > 0);
  const activeVideoAssets = assets.filter((asset) => ["video_link", "video_hosted"].includes(asset.asset_type) && asset.is_active);
  const activeDocumentAssets = assets.filter((asset) => asset.asset_type === "document" && asset.is_active);
  const inactiveSetAssets = assets.filter((asset) => !asset.is_active);
  const activeQuizzes = quizzes.filter((quiz) => quiz.is_active);
  const inactiveQuizzes = quizzes.filter((quiz) => !quiz.is_active);
  const questionDraftState = getQuestionDraftState(questionForm);
  const questionDraftValid = isQuestionDraftValid(questionForm);
  const documentAllowedExtensions = capabilities.document_allowed_extensions || [];
  const documentAllowedLabel = documentAllowedExtensions.length
    ? documentAllowedExtensions.map((ext) => ext.replace(/^\./, "").toUpperCase()).join(", ")
    : "PDF, DOC, DOCX, TXT, RTF, PNG, JPG, JPEG";
  const documentMaxLabel = capabilities.document_max_mb
    ? `${capabilities.document_max_mb} MB`
    : formatBytesAsMb(capabilities.document_max_bytes) || "25 MB";
  const documentAccept = documentAllowedExtensions.join(",");
  const trainingDialogPaperSx = {
    borderRadius: 1,
    overflow: "hidden",
    bgcolor: `${theme.palette.background.paper} !important`,
    backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.075)}, ${theme.palette.background.paper} 180px) !important`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
    boxShadow: `0 28px 72px ${alpha(theme.palette.common.black, 0.24)}`,
  };
  const selectedCollectionForCopy = activeCollections.find((collection) => String(collection.id) === String(addCollectionForm.collection_id));
  const selectedCollectionBreakdown = getCollectionBreakdown(selectedCollectionForCopy);
  const departmentRuleGroups = useMemo(() => {
    const groups = {};
    (departmentAssignments.items || []).forEach((row) => {
      if (!groups[row.department_id]) {
        groups[row.department_id] = {
          department_id: row.department_id,
          department_name: row.department_name,
          rows: [],
          active_count: 0,
        };
      }
      groups[row.department_id].rows.push(row);
      if (row.is_active) groups[row.department_id].active_count += 1;
    });
    return Object.values(groups).sort((a, b) => String(a.department_name || "").localeCompare(String(b.department_name || "")));
  }, [departmentAssignments.items]);

  const insightText = useMemo(() => {
    if (!summary.assignments) return "Create library assets and reusable quizzes first. Training sets and assignments are intentionally deferred to keep this phase focused.";
    return `${summary.assignments} assignment(s) exist, with ${summary.completed_assignments || 0} completed.`;
  }, [summary.assignments, summary.completed_assignments]);

  const refreshAfterMutation = async (tab) => {
    await Promise.all([loadOverview(), loadTab(tab, true)]);
  };

  const openNewResource = () => {
    setResourceForm({ ...emptyResourceForm, category: "" });
    setResourceEmployeeDepartmentFilter("");
    setResourceDialogOpen(true);
  };

  const openEditResource = (resource) => {
    setResourceForm({
      ...emptyResourceForm,
      id: resource.id,
      asset_id: resource.asset_id || resource.asset?.id || "",
      title_override: resource.title_override || "",
      description_override: resource.description_override || "",
      category: resource.share_category || resource.category || "",
      department_ids: (resource.departments || []).map((row) => row.id),
      employee_ids: (resource.employees || []).map((row) => row.id),
      is_published: Boolean(resource.is_published),
      is_archived: Boolean(resource.is_archived),
    });
    setResourceEmployeeDepartmentFilter("");
    setResourceDialogOpen(true);
  };

  const saveResource = async () => {
    setError("");
    const payload = {
      asset_id: resourceForm.asset_id,
      title_override: resourceForm.title_override,
      description_override: resourceForm.description_override,
      category: resourceForm.category,
      department_ids: resourceForm.department_ids || [],
      employee_ids: resourceForm.employee_ids || [],
      is_published: resourceForm.is_published,
      is_archived: resourceForm.is_archived,
    };
    try {
      if (resourceForm.id) await api.patch(`/manager/training/resources/${resourceForm.id}`, payload);
      else await api.post("/manager/training/resources", payload);
      setResourceDialogOpen(false);
      setSuccess("Learning resource saved.");
      await refreshAfterMutation("resources");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to save learning resource.");
    }
  };

  const toggleResourceArchived = async (resource) => {
    if (!resource?.id) return;
    setError("");
    try {
      await api.patch(`/manager/training/resources/${resource.id}`, { is_archived: !resource.is_archived });
      setSuccess(resource.is_archived ? "Learning resource restored." : "Learning resource archived.");
      await refreshAfterMutation("resources");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to update learning resource.");
    }
  };

  const toggleResourcePublished = async (resource) => {
    if (!resource?.id) return;
    setError("");
    try {
      await api.patch(`/manager/training/resources/${resource.id}`, { is_published: !resource.is_published });
      setSuccess(resource.is_published ? "Learning resource unpublished." : "Learning resource published.");
      await refreshAfterMutation("resources");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to update learning resource.");
    }
  };

  const openNewAsset = (assetType = "video_link") => {
    setAssetForm({ ...emptyAssetForm, asset_type: assetType });
    setAssetDialogOpen(true);
  };

  const openEditAsset = (asset) => {
    setAssetForm({
      ...emptyAssetForm,
      ...asset,
      duration_minutes: minutesFromSeconds(asset.duration_seconds),
      category: asset.category || "Onboarding",
    });
    setAssetDialogOpen(true);
  };

  const saveAsset = async () => {
    setError("");
    const payload = {
      asset_type: assetForm.asset_type,
      title: assetForm.title,
      description: assetForm.description,
      external_url: assetForm.external_url,
      duration_minutes: assetForm.duration_minutes,
      category: assetForm.category,
      is_active: assetForm.is_active,
    };
    try {
      if (assetForm.id) await api.put(`/manager/training/assets/${assetForm.id}`, payload);
      else await api.post("/manager/training/assets", payload);
      setAssetDialogOpen(false);
      setSuccess("Training asset saved.");
      await refreshAfterMutation("library");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to save training asset.");
    }
  };

  const toggleAssetArchived = async (asset) => {
    if (!asset?.id) return;
    setError("");
    const nextActive = !asset.is_active;
    const payload = {
      asset_type: asset.asset_type,
      title: asset.title,
      description: asset.description,
      external_url: asset.external_url,
      duration_minutes: minutesFromSeconds(asset.duration_seconds),
      category: asset.category,
      is_active: nextActive,
    };
    try {
      await api.put(`/manager/training/assets/${asset.id}`, payload);
      setSuccess(nextActive ? "Training asset restored." : "Training asset archived. Existing sets keep their history, but inactive assets are labeled in pickers.");
      await refreshAfterMutation("library");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to update training asset.");
    }
  };

  const uploadDocument = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !uploadAsset) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setError("");
    try {
      await api.post(`/manager/training/assets/${uploadAsset.id}/upload-document`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadAsset(null);
      setSuccess("Training document uploaded.");
      await refreshAfterMutation("library");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to upload training document.");
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (asset) => {
    setError("");
    try {
      const res = await api.get(`/manager/training/assets/${asset.id}/download`, { responseType: "blob" });
      const contentType = res.headers?.["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await res.data.text();
        const parsed = JSON.parse(text || "{}");
        if (parsed.url) window.open(parsed.url, "_blank", "noopener,noreferrer");
        else throw new Error(parsed.error || "Document is not available.");
        return;
      }
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: contentType || asset.mime_type || "application/octet-stream" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = asset.file_name || "training-document";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to download training document.");
    }
  };

  const closeAssetPreview = () => {
    setPreviewDialogOpen(false);
    setPreviewAsset(null);
    setPreviewUrl("");
    setPreviewKind("");
    setPreviewLoading(false);
    if (previewObjectUrl) {
      window.URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl("");
    }
  };

  const openAssetPreview = async (asset) => {
    if (!asset) return;
    setError("");
    if (previewObjectUrl) {
      window.URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl("");
    }
    setPreviewAsset(asset);
    setPreviewDialogOpen(true);
    setPreviewUrl("");
    setPreviewKind("");
    if (asset.asset_type === "video_link") {
      setPreviewKind("video");
      setPreviewUrl(getExternalPreviewUrl(asset.external_url));
      return;
    }
    if (asset.asset_type === "video_hosted") {
      setPreviewKind("disabled");
      return;
    }
    if (asset.asset_type !== "document") return;
    if (!asset.has_file) {
      setPreviewKind("missing");
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await api.get(`/manager/training/assets/${asset.id}/download`, { responseType: "blob" });
      const contentType = res.headers?.["content-type"] || asset.mime_type || "";
      if (contentType.includes("application/json")) {
        const text = await res.data.text();
        const parsed = JSON.parse(text || "{}");
        if (parsed.url) {
          setPreviewUrl(parsed.url);
          setPreviewKind(documentPreviewKind(asset, parsed.content_type || asset.mime_type));
        } else {
          setPreviewKind("download");
        }
        return;
      }
      const kind = documentPreviewKind(asset, contentType);
      if (kind === "pdf" || kind === "image") {
        const objectUrl = window.URL.createObjectURL(new Blob([res.data], { type: contentType || asset.mime_type || "application/octet-stream" }));
        setPreviewObjectUrl(objectUrl);
        setPreviewUrl(objectUrl);
        setPreviewKind(kind);
      } else {
        setPreviewKind("download");
      }
    } catch (err) {
      setPreviewKind("error");
      setError(err?.response?.data?.error || err?.message || "Unable to preview training document.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const openNewQuiz = () => {
    setQuizForm(emptyQuizForm);
    setQuizDialogOpen(true);
  };

  const openEditQuiz = (quiz) => {
    setQuizForm({ ...emptyQuizForm, ...quiz });
    setQuizDialogOpen(true);
  };

  const saveQuiz = async () => {
    setError("");
    const payload = {
      title: quizForm.title,
      description: quizForm.description,
      category: quizForm.category,
      passing_score_percent: quizForm.passing_score_percent,
      is_active: quizForm.is_active,
    };
    try {
      let res;
      if (quizForm.id) res = await api.put(`/manager/training/quizzes/${quizForm.id}`, payload);
      else res = await api.post("/manager/training/quizzes", payload);
      setQuizDialogOpen(false);
      setSuccess("Training quiz saved.");
      await refreshAfterMutation("quizzes");
      if (res?.data?.quiz) setSelectedQuiz(res.data.quiz);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to save training quiz.");
    }
  };

  const selectQuiz = async (quiz) => {
    setSelectedQuiz(quiz);
    try {
      const res = await api.get(`/manager/training/quizzes/${quiz.id}`);
      setSelectedQuiz(res.data?.quiz || quiz);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to load quiz details.");
    }
  };

  const openNewQuestion = () => {
    setQuestionForm(emptyQuestionForm);
    setQuestionDialogOpen(true);
  };

  const openEditQuestion = (question) => {
    const options = [...(question.options || [])];
    while (options.length < 2) options.push({ option_text: "", is_correct: false });
    setQuestionForm({
      id: question.id,
      question_text: question.question_text || "",
      options: options.map((option) => ({
        id: option.id,
        option_text: option.option_text || "",
        is_correct: Boolean(option.is_correct),
      })),
    });
    setQuestionDialogOpen(true);
  };

  const saveQuestion = async () => {
    if (!selectedQuiz?.id) return;
    setError("");
    const cleanedOptions = (questionForm.options || [])
      .map((option, index) => ({
        option_text: (option.option_text || "").trim(),
        is_correct: Boolean(option.is_correct),
        sort_order: index,
      }))
      .filter((option) => option.option_text);
    if (!(questionForm.question_text || "").trim()) {
      setError("Question text is required.");
      return;
    }
    if (cleanedOptions.length < 2) {
      setError("Add at least two answer options before saving the question.");
      return;
    }
    if (!cleanedOptions.some((option) => option.is_correct)) {
      setError("Choose one correct answer before saving the question.");
      return;
    }
    const payload = {
      question_text: questionForm.question_text.trim(),
      options: cleanedOptions,
    };
    try {
      const res = questionForm.id
        ? await api.put(`/manager/training/quiz-questions/${questionForm.id}`, payload)
        : await api.post(`/manager/training/quizzes/${selectedQuiz.id}/questions`, payload);
      setSelectedQuiz(res.data?.quiz || selectedQuiz);
      setQuestionDialogOpen(false);
      setSuccess("Quiz question saved. Quiz version was updated.");
      await loadTab("quizzes", true);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to save quiz question.");
    }
  };

  const deleteQuestion = async (question) => {
    setError("");
    try {
      const res = await api.delete(`/manager/training/quiz-questions/${question.id}`);
      setSelectedQuiz(res.data?.quiz || null);
      setSuccess("Quiz question removed. Quiz version was updated.");
      await loadTab("quizzes", true);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to remove quiz question.");
    }
  };

  const openNewSet = () => {
    setSetForm(emptySetForm);
    setSetDialogOpen(true);
  };

  const openEditSet = (trainingSet) => {
    setSetForm({ ...emptySetForm, ...trainingSet });
    setSetDialogOpen(true);
  };

  const saveSet = async () => {
    setError("");
    const payload = {
      name: setForm.name,
      description: setForm.description,
      is_active: setForm.is_active,
    };
    try {
      const res = setForm.id
        ? await api.put(`/manager/training/sets/${setForm.id}`, payload)
        : await api.post("/manager/training/sets", payload);
      setSetDialogOpen(false);
      setSelectedSet(res.data?.training_set || selectedSet);
      setSuccess("Training set saved.");
      await refreshAfterMutation("sets");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to save training set.");
    }
  };

  const selectSet = async (trainingSet) => {
    setSelectedSet(trainingSet);
    try {
      const res = await api.get(`/manager/training/sets/${trainingSet.id}`);
      setSelectedSet(res.data?.training_set || trainingSet);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to load training set.");
    }
  };

  const openNewSetItem = (itemType = "video") => {
    setSetItemForm({ ...emptySetItemForm, item_type: itemType });
    setSetItemDialogOpen(true);
  };

  const openEditSetItem = (item) => {
    setSetItemForm({
      ...emptySetItemForm,
      ...item,
      asset_id: item.asset_id || "",
      quiz_id: item.quiz_id || "",
      scheduled_at: item.live_session_json?.scheduled_at || "",
      meeting_link: item.live_session_json?.meeting_link || "",
      title_override: item.title_override || item.live_session_json?.title || "",
      description_override: item.description_override || item.live_session_json?.description || "",
      acknowledgement_text: item.acknowledgement_text || "",
    });
    setSetItemDialogOpen(true);
  };

  const saveSetItem = async () => {
    if (!selectedSet?.id) return;
    setError("");
    const payload = {
      item_type: setItemForm.item_type,
      asset_id: setItemForm.asset_id || null,
      quiz_id: setItemForm.quiz_id || null,
      title_override: setItemForm.title_override,
      description_override: setItemForm.description_override,
      acknowledgement_text: setItemForm.acknowledgement_text,
      is_required: setItemForm.is_required,
      live_session_json: {
        title: setItemForm.title_override,
        description: setItemForm.description_override,
        scheduled_at: setItemForm.scheduled_at,
        meeting_link: setItemForm.meeting_link,
      },
    };
    try {
      const res = setItemForm.id
        ? await api.put(`/manager/training/set-items/${setItemForm.id}`, payload)
        : await api.post(`/manager/training/sets/${selectedSet.id}/items`, payload);
      setSelectedSet(res.data?.training_set || selectedSet);
      setSetItemDialogOpen(false);
      setSuccess("Training set item saved.");
      await loadTab("sets", true);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to save training set item.");
    }
  };

  const deleteSetItem = async (item) => {
    setError("");
    try {
      const res = await api.delete(`/manager/training/set-items/${item.id}`);
      setSelectedSet(res.data?.training_set || selectedSet);
      setSuccess("Training set item removed.");
      await loadTab("sets", true);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to remove training set item.");
    }
  };

  const moveSetItem = async (item, direction) => {
    const sorted = [...(selectedSet?.items || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);
    const index = sorted.findIndex((row) => row.id === item.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;
    try {
      await api.put(`/manager/training/set-items/${item.id}`, { sort_order: swapWith.sort_order ?? index + direction });
      const res = await api.put(`/manager/training/set-items/${swapWith.id}`, { sort_order: item.sort_order ?? index });
      setSelectedSet(res.data?.training_set || selectedSet);
      await loadTab("sets", true);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to reorder training set items.");
    }
  };

  const openNewCollection = () => {
    setCollectionForm(emptyCollectionForm);
    setCollectionDialogOpen(true);
  };

  const openEditCollection = (collection) => {
    setCollectionForm({ ...emptyCollectionForm, ...collection });
    setCollectionDialogOpen(true);
  };

  const saveCollection = async () => {
    setError("");
    const payload = {
      name: collectionForm.name,
      description: collectionForm.description,
      category: collectionForm.category,
      is_active: collectionForm.is_active,
    };
    try {
      const res = collectionForm.id
        ? await api.put(`/manager/training/collections/${collectionForm.id}`, payload)
        : await api.post("/manager/training/collections", payload);
      setCollectionDialogOpen(false);
      setSelectedCollection(res.data?.collection || selectedCollection);
      setSuccess("Training collection saved.");
      await refreshAfterMutation("collections");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to save training collection.");
    }
  };

  const selectCollection = async (collection) => {
    setSelectedCollection(collection);
    try {
      const res = await api.get(`/manager/training/collections/${collection.id}`);
      setSelectedCollection(res.data?.collection || collection);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to load training collection.");
    }
  };

  const openNewCollectionItem = (itemType = "video") => {
    setCollectionItemForm({ ...emptySetItemForm, item_type: itemType });
    setCollectionItemDialogOpen(true);
  };

  const openEditCollectionItem = (item) => {
    setCollectionItemForm({
      ...emptySetItemForm,
      ...item,
      asset_id: item.asset_id || "",
      quiz_id: item.quiz_id || "",
      scheduled_at: item.live_session_json?.scheduled_at || "",
      meeting_link: item.live_session_json?.meeting_link || "",
      title_override: item.title_override || item.live_session_json?.title || "",
      description_override: item.description_override || item.live_session_json?.description || "",
      acknowledgement_text: item.acknowledgement_text || "",
    });
    setCollectionItemDialogOpen(true);
  };

  const saveCollectionItem = async () => {
    if (!selectedCollection?.id) return;
    setError("");
    const payload = {
      item_type: collectionItemForm.item_type,
      asset_id: collectionItemForm.asset_id || null,
      quiz_id: collectionItemForm.quiz_id || null,
      title_override: collectionItemForm.title_override,
      description_override: collectionItemForm.description_override,
      acknowledgement_text: collectionItemForm.acknowledgement_text,
      is_required: collectionItemForm.is_required,
      live_session_json: {
        title: collectionItemForm.title_override,
        description: collectionItemForm.description_override,
        scheduled_at: collectionItemForm.scheduled_at,
        meeting_link: collectionItemForm.meeting_link,
      },
    };
    try {
      const res = collectionItemForm.id
        ? await api.put(`/manager/training/collection-items/${collectionItemForm.id}`, payload)
        : await api.post(`/manager/training/collections/${selectedCollection.id}/items`, payload);
      setSelectedCollection(res.data?.collection || selectedCollection);
      setCollectionItemDialogOpen(false);
      setSuccess("Training collection item saved.");
      await loadTab("collections", true);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to save training collection item.");
    }
  };

  const deleteCollectionItem = async (item) => {
    setError("");
    try {
      const res = await api.delete(`/manager/training/collection-items/${item.id}`);
      setSelectedCollection(res.data?.collection || selectedCollection);
      setSuccess("Training collection item removed.");
      await loadTab("collections", true);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to remove training collection item.");
    }
  };

  const moveCollectionItem = async (item, direction) => {
    const sorted = [...(selectedCollection?.items || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);
    const index = sorted.findIndex((row) => row.id === item.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;
    try {
      await api.put(`/manager/training/collection-items/${item.id}`, { sort_order: swapWith.sort_order ?? index + direction });
      const res = await api.put(`/manager/training/collection-items/${swapWith.id}`, { sort_order: item.sort_order ?? index });
      setSelectedCollection(res.data?.collection || selectedCollection);
      await loadTab("collections", true);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to reorder training collection items.");
    }
  };

  const addCollectionToSet = async () => {
    if (!selectedSet?.id || !addCollectionForm.collection_id) return;
    setError("");
    try {
      const res = await api.post(`/manager/training/sets/${selectedSet.id}/add-collection`, addCollectionForm);
      setSelectedSet(res.data?.training_set || selectedSet);
      setAddCollectionDialogOpen(false);
      setAddCollectionForm(emptyAddCollectionForm);
      setSuccess(res.data?.message || "Collection copied into training set.");
      await loadTab("sets", true);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to add collection to training set.");
    }
  };

  const saveManualAssignment = async () => {
    setError("");
    const selected = assignableSets.find((trainingSet) => String(trainingSet.id) === String(manualAssignmentForm.training_set_id));
    if (!selected || Number(selected.item_count || selected.items?.length || 0) <= 0) {
      setError("Add at least one item to the training set before assigning it.");
      return;
    }
    try {
      const { department_id: _departmentId, ...payload } = manualAssignmentForm;
      const res = await api.post("/manager/training/assignments", payload);
      setSuccess(res.data?.message || "Training assigned.");
      setManualAssignmentForm(emptyManualAssignmentForm);
      await Promise.all([loadOverview(), loadTab("assignments", true)]);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to assign training.");
    }
  };

  const saveDepartmentAssignment = async () => {
    if (!departmentAssignmentForm.department_id) return;
    setError("");
    const selectedIds = new Set((departmentAssignmentForm.training_set_ids || []).map((value) => String(value)));
    const hasEmptySet = assignableSets.some((trainingSet) => (
      selectedIds.has(String(trainingSet.id)) && Number(trainingSet.item_count || trainingSet.items?.length || 0) <= 0
    ));
    if (hasEmptySet) {
      setError("Add items to every selected training set before assigning it to a department.");
      return;
    }
    try {
      const res = await api.put(`/manager/training/departments/${departmentAssignmentForm.department_id}/sets`, {
        training_set_ids: departmentAssignmentForm.training_set_ids,
      });
      setSuccess(res.data?.message || "Department training sets updated.");
      setDepartmentAssignmentForm(emptyDepartmentAssignmentForm);
      const deptRes = await api.get("/manager/training/department-assignments");
      setDepartmentAssignments(deptRes.data || { items: [], context: {} });
      await Promise.all([loadOverview(), loadTab("assignments", true)]);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to update department training sets.");
    }
  };

  const syncDepartmentAssignments = async (departmentId) => {
    if (!departmentId) return;
    setError("");
    setSyncingDepartmentId(departmentId);
    try {
      const res = await api.post(`/manager/training/departments/${departmentId}/sync`);
      setSyncResults((prev) => ({ ...prev, [departmentId]: res.data || {} }));
      setSuccess(res.data?.message || "Department training assignments synced.");
      await Promise.all([loadOverview(), loadTab("assignments", true), loadTab("progress", true)]);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to sync department training assignments.");
    } finally {
      setSyncingDepartmentId("");
    }
  };

  const setCorrectOption = (index) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) => ({ ...option, is_correct: optionIndex === index })),
    }));
  };

  const updateOptionText = (index, value) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) => optionIndex === index ? { ...option, option_text: value } : option),
    }));
  };

  const addOption = () => {
    setQuestionForm((prev) => ({ ...prev, options: [...prev.options, { option_text: "", is_correct: false }] }));
  };

  const removeOption = (index) => {
    setQuestionForm((prev) => {
      const next = prev.options.filter((_, optionIndex) => optionIndex !== index);
      if (!next.some((option) => option.is_correct) && next[0]) next[0].is_correct = true;
      return { ...prev, options: next };
    });
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Training</Typography>
            <Typography variant="body2" color="text.secondary">
              Native e-learning for reusable videos, documents, quizzes, collections, and assignable training sets.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} onClick={() => setHelpDrawerOpen(true)}>
            How it works
          </Button>
        </Stack>

        <Box sx={{ p: 0.75, borderRadius: 1, border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`, bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable" scrollButtons="auto">
            {TABS.map((tab) => <Tab key={tab.value} value={tab.value} label={tab.label} />)}
          </Tabs>
        </Box>

        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>}

        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={20} /><Typography variant="body2" color="text.secondary">Loading training...</Typography></Stack>
        ) : (
          <>
            {activeTab === "overview" && (
              <Alert severity="info" variant="outlined">
                {insightText} Hosted video upload remains disabled; use external video links for production training videos.
              </Alert>
            )}

            {activeTab === "overview" && (
              <Stack spacing={2.25}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
                    Training summary
                  </Typography>
                  <Grid container spacing={1.5}>
                  <Grid item xs={12} md={3}><StatCard label="Assets" value={summary.assets} helper="External videos and documents" /></Grid>
                  <Grid item xs={12} md={3}><StatCard label="Quizzes" value={summary.quizzes} helper="Reusable tests stored once" /></Grid>
                  <Grid item xs={12} md={3}><StatCard label="Collections" value={summary.collections} helper="Reusable grouped content" /></Grid>
                  <Grid item xs={12} md={3}><StatCard label="Assignments" value={summary.assignments} helper="Department and manual assignments" /></Grid>
                  </Grid>
                </Box>

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 1,
                    borderColor: alpha(theme.palette.text.primary, 0.1),
                    bgcolor: alpha(theme.palette.background.paper, 0.72),
                  }}
                >
                  <CardContent sx={{ p: 1.5 }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1.25}
                      alignItems={{ xs: "flex-start", md: "center" }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase", minWidth: 108 }}>
                        Training model
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ "& .MuiChip-label": { whiteSpace: "nowrap" } }}
                      >
                        <Tooltip title="Categories help you organize and filter training content.">
                          <Chip size="small" label="Categories organize content" {...readableChipProps(theme, "neutral")} />
                        </Tooltip>
                        <Tooltip title="Collections group related videos, documents, and quizzes for reuse.">
                          <Chip size="small" label="Collections group reusable content" {...readableChipProps(theme, "info")} />
                        </Tooltip>
                        <Tooltip title="Training Sets are the final programs assigned to employees or departments.">
                          <Chip size="small" label="Training Sets are what you assign" {...readableChipProps(theme, "primary")} />
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                <Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "flex-end" }} sx={{ mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                        Available now
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Core training tools managers can use today.
                      </Typography>
                    </Box>
                  </Stack>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={4}><CapabilityCard icon={<OndemandVideoIcon fontSize="small" />} title="External video links" status="Available">Use YouTube, Vimeo, Loom, Drive, or company-hosted URLs.</CapabilityCard></Grid>
                    <Grid item xs={12} md={4}><CapabilityCard icon={<ArticleIcon fontSize="small" />} title="Training documents" status="Available">Upload private training documents with controlled access.</CapabilityCard></Grid>
                    <Grid item xs={12} md={4}><CapabilityCard icon={<QuizIcon fontSize="small" />} title="Reusable quizzes" status="Available">Create versioned quizzes and attach them to programs.</CapabilityCard></Grid>
                    <Grid item xs={12} md={4}><CapabilityCard icon={<ArticleIcon fontSize="small" />} title="Collections" status="Available">Group related content and copy it into a set.</CapabilityCard></Grid>
                    <Grid item xs={12} md={4}><CapabilityCard icon={<GroupsIcon fontSize="small" />} title="Assignments" status="Available">Assign sets to departments or employees safely.</CapabilityCard></Grid>
                    <Grid item xs={12} md={4}><CapabilityCard icon={<TimelineIcon fontSize="small" />} title="Progress" status="Available">Review completion status and quiz outcomes.</CapabilityCard></Grid>
                  </Grid>
                </Box>

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 1,
                    borderColor: alpha(theme.palette.warning.main, 0.22),
                    bgcolor: alpha(theme.palette.warning.main, 0.045),
                  }}
                >
                  <CardContent sx={{ p: 1.5 }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1.25}
                      alignItems={{ xs: "flex-start", md: "center" }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase", minWidth: 108 }}
                      >
                        Coming later
                      </Typography>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        sx={{ flex: 1, minWidth: 0 }}
                      >
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: 1,
                            color: "warning.dark",
                            bgcolor: alpha(theme.palette.warning.main, 0.12),
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <OndemandVideoIcon fontSize="small" />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                              Hosted video upload
                            </Typography>
                            <Chip
                              size="small"
                              label="Disabled"
                              variant="outlined"
                              sx={{
                                color: theme.palette.warning.dark,
                                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                borderColor: alpha(theme.palette.warning.main, 0.32),
                                fontWeight: 800,
                              }}
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {capabilities.hosted_video_message || "Hosted upload is disabled for this release. Use external video links."}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            )}

            {activeTab === "library" && (
              <Stack spacing={2}>
                <Card variant="outlined" sx={{ borderRadius: 1 }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      alignItems={{ xs: "stretch", md: "center" }}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Tooltip title="Create an external video link, private document, or future-gated hosted video asset.">
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openNewAsset("video_link")}>Add asset</Button>
                      </Tooltip>
                      <TextField size="small" label="Search" value={assetSearch} onChange={(event) => setAssetSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { resetTrainingPage("library"); loadTab("library", true); } }} sx={{ minWidth: { xs: "100%", sm: 220 } }} />
                      <FormControl size="small" sx={{ minWidth: 160 }}><InputLabel>Type</InputLabel><Select label="Type" value={assetTypeFilter} onChange={(event) => { resetTrainingPage("library"); setAssetTypeFilter(event.target.value); }}><MenuItem value="all">All assets</MenuItem>{ASSET_TYPES.map((type) => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}</Select></FormControl>
                      <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Category</InputLabel><Select label="Category" value={categoryFilter} onChange={(event) => { resetTrainingPage("library"); setCategoryFilter(event.target.value); }}><MenuItem value="all">All categories</MenuItem>{categories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}</Select></FormControl>
                      <Button
                        variant={assetStatusFilter === "archived" ? "contained" : "outlined"}
                        color="warning"
                        onClick={() => { resetTrainingPage("library"); setAssetStatusFilter((prev) => (prev === "archived" ? "active" : "archived")); }}
                      >
                        {assetStatusFilter === "archived" ? "Back to active" : "View archived"}
                      </Button>
                      <Button variant="outlined" onClick={() => loadTab("library", true)}>Refresh</Button>
                    </Stack>
                  </CardContent>
                </Card>
                {tabLoading ? <CircularProgress size={22} /> : visibleLibraryAssets.length ? (
                  <>
                    <Grid container spacing={2}>{visibleLibraryAssets.map((asset) => <Grid item xs={12} md={6} lg={4} key={asset.id}><AssetCard asset={asset} onEdit={openEditAsset} onUpload={setUploadAsset} onDownload={downloadDocument} onArchiveToggle={toggleAssetArchived} onPreview={openAssetPreview} /></Grid>)}</Grid>
                    <CompactPagination pagination={activePagination} pageSize={trainingPageSizes.library} onChange={(page) => updateTrainingPage("library", page)} onPageSizeChange={(pageSize) => updateTrainingPageSize("library", pageSize)} />
                  </>
                ) : (
                  <Alert severity="info" variant="outlined">
                    {assetStatusFilter === "archived"
                      ? "No archived assets match this view. Archive an active asset when you want it removed from normal use but kept for history."
                      : categoryFilter === "all" && !assetSearch
                      ? "No training assets yet. Start with an external video link or a private document asset."
                      : "No assets match these filters. Try another category, clear search, or create a new asset."}
                  </Alert>
                )}
              </Stack>
            )}

            {activeTab === "resources" && (
              <Stack spacing={2}>
                <Card variant="outlined" sx={{ borderRadius: 1 }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      alignItems={{ xs: "stretch", md: "center" }}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Tooltip title="Share an existing Library asset as optional reference material.">
                        <Button variant="contained" startIcon={<AddIcon />} onClick={openNewResource}>Share resource</Button>
                      </Tooltip>
                      <TextField
                        size="small"
                        label="Search"
                        value={resourceSearch}
                        onChange={(event) => setResourceSearch(event.target.value)}
                        onKeyDown={(event) => { if (event.key === "Enter") { resetTrainingPage("resources"); loadTab("resources", true); } }}
                        sx={{ minWidth: { xs: "100%", sm: 220 } }}
                      />
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select label="Status" value={resourceStatusFilter} onChange={(event) => { resetTrainingPage("resources"); setResourceStatusFilter(event.target.value); }}>
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="published">Published</MenuItem>
                          <MenuItem value="draft">Draft</MenuItem>
                          <MenuItem value="archived">Archived</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 190 }}>
                        <InputLabel>Audience type</InputLabel>
                        <Select label="Audience type" value={resourceAudienceFilter} onChange={(event) => { resetTrainingPage("resources"); setResourceAudienceFilter(event.target.value); }}>
                          <MenuItem value="all">All audience types</MenuItem>
                          <MenuItem value="department">Department shares</MenuItem>
                          <MenuItem value="employee">Employee shares</MenuItem>
                          <MenuItem value="mixed">Mixed shares</MenuItem>
                        </Select>
                      </FormControl>
                      <Button variant="outlined" onClick={() => loadTab("resources", true)}>Refresh</Button>
                    </Stack>
                  </CardContent>
                </Card>
                {tabLoading ? <CircularProgress size={22} /> : resources.length ? (
                  <>
                    <Grid container spacing={2}>
                      {resources.map((resource) => (
                        <Grid item xs={12} md={6} lg={4} key={resource.id}>
                          <LearningResourceCard
                            resource={resource}
                            onEdit={openEditResource}
                            onArchiveToggle={toggleResourceArchived}
                            onPublishToggle={toggleResourcePublished}
                            onDetails={setResourceDetail}
                          />
                        </Grid>
                      ))}
                    </Grid>
                    <CompactPagination pagination={activePagination} pageSize={trainingPageSizes.resources} onChange={(page) => updateTrainingPage("resources", page)} onPageSizeChange={(pageSize) => updateTrainingPageSize("resources", pageSize)} />
                  </>
                ) : (
                  <Alert severity="info" variant="outlined">
                    {resourceStatusFilter === "archived"
                      ? "No archived learning resources match this view."
                      : "No learning resources shared yet."}
                  </Alert>
                )}
              </Stack>
            )}

            {activeTab === "collections" && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ borderRadius: 1, mb: 2 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} flexWrap="wrap" useFlexGap>
                        <Tooltip title="Group related training content into a reusable collection.">
                          <Button variant="contained" startIcon={<AddIcon />} onClick={openNewCollection}>New collection</Button>
                        </Tooltip>
                        <TextField size="small" label="Search" value={assetSearch} onChange={(event) => setAssetSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { resetTrainingPage("collections"); loadTab("collections", true); } }} />
                        <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Category</InputLabel><Select label="Category" value={categoryFilter} onChange={(event) => { resetTrainingPage("collections"); setCategoryFilter(event.target.value); }}><MenuItem value="all">All categories</MenuItem>{categories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}</Select></FormControl>
                      </Stack>
                    </CardContent>
                  </Card>
                  <Stack spacing={1.5}>
                    {tabLoading ? <CircularProgress size={22} /> : collections.length ? (
                      <>
                        {collections.map((collection) => (
                          <CollectionCard key={collection.id} collection={collection} selected={selectedCollectionId === collection.id} onSelect={selectCollection} onEdit={openEditCollection} />
                        ))}
                        <CompactPagination pagination={activePagination} pageSize={trainingPageSizes.collections} onChange={(page) => updateTrainingPage("collections", page)} onPageSizeChange={(pageSize) => updateTrainingPageSize("collections", pageSize)} />
                      </>
                    ) : <Alert severity="info" variant="outlined">
                      {categoryFilter === "all" && !assetSearch
                        ? "No collections yet. Create a reusable group such as “New Employee Basics”."
                        : "No collections match these filters. Try another category or create a new collection."}
                    </Alert>}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Card variant="outlined" sx={{ borderRadius: 1, minHeight: 420 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      {selectedCollection ? (
                        <Stack spacing={2}>
                          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 850 }}>{selectedCollection.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{compactText(selectedCollection.description, 150) || "No description added."}</Typography>
                            </Box>
                            {selectedCollection.category && <Chip size="small" label={selectedCollection.category} />}
                            <Chip label={selectedCollection.is_active ? "Active" : "Inactive"} size="small" {...readableChipProps(theme, selectedCollection.is_active ? "success" : "neutral")} />
                            <Tooltip title="Add one video, document, quiz, acknowledgement, or live session placeholder to this collection.">
                              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openNewCollectionItem("video")}>Add item</Button>
                            </Tooltip>
                          </Stack>
                          <Alert severity="info" variant="outlined">
                            Collections are templates. Adding a collection into a Training Set copies the current items; future collection edits do not silently change existing sets.
                          </Alert>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button size="small" onClick={() => openNewCollectionItem("video")}>Add video</Button>
                            <Button size="small" onClick={() => openNewCollectionItem("document")}>Add document</Button>
                            <Button size="small" onClick={() => openNewCollectionItem("quiz")}>Add quiz</Button>
                            <Button size="small" onClick={() => openNewCollectionItem("acknowledgement")}>Add acknowledgement</Button>
                            <Button size="small" onClick={() => openNewCollectionItem("live_session")}>Add live session stub</Button>
                          </Stack>
                          {(selectedCollection.items || []).length ? [...(selectedCollection.items || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id).map((item, index, rows) => (
                            <Card key={item.id} variant="outlined" sx={{ borderRadius: 1 }}>
                              <CardContent sx={{ p: 2 }}>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                                  <Stack spacing={0.75} sx={{ flex: 1 }}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                      <Chip size="small" label={`${index + 1}`} {...readableChipProps(theme, "primary")} />
                                      <Chip size="small" label={formatSetItemType(item.item_type)} variant="outlined" />
                                      <Chip size="small" label={item.is_required ? "Required" : "Optional"} {...readableChipProps(theme, item.is_required ? "success" : "neutral")} />
                                    </Stack>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>{item.display_title}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {item.item_type === "acknowledgement" ? item.acknowledgement_text : item.item_type === "live_session" ? (item.live_session_json?.meeting_link || "Live session placeholder.") : (item.display_description || "No description added.")}
                                    </Typography>
                                  </Stack>
                                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                    <IconButton size="small" disabled={index === 0} onClick={() => moveCollectionItem(item, -1)}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" disabled={index === rows.length - 1} onClick={() => moveCollectionItem(item, 1)}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => openEditCollectionItem(item)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => deleteCollectionItem(item)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                  </Stack>
                                </Stack>
                              </CardContent>
                            </Card>
                          )) : <Alert severity="info" variant="outlined">This collection has no items yet. Add one item, or build the source content first in Library / Quizzes.</Alert>}
                        </Stack>
                      ) : <Alert severity="info" variant="outlined">Select a collection to preview and edit its reusable content.</Alert>}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeTab === "quizzes" && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <Card variant="outlined" sx={{ borderRadius: 1, mb: 2 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title="Create a reusable quiz that can be attached to training sets.">
                          <Button variant="contained" startIcon={<AddIcon />} onClick={openNewQuiz}>New quiz</Button>
                        </Tooltip>
                      </Stack>
                    </CardContent>
                  </Card>
                  <Stack spacing={1.5}>
                    {tabLoading ? <CircularProgress size={22} /> : quizzes.length ? (
                      <>
                        {quizzes.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} selected={selectedQuizId === quiz.id} onSelect={selectQuiz} onEdit={openEditQuiz} />)}
                        <CompactPagination pagination={activePagination} pageSize={trainingPageSizes.quizzes} onChange={(page) => updateTrainingPage("quizzes", page)} onPageSizeChange={(pageSize) => updateTrainingPageSize("quizzes", pageSize)} />
                      </>
                    ) : <Alert severity="info" variant="outlined">No quizzes yet. Create a reusable quiz to start.</Alert>}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={7}>
                  <Card variant="outlined" sx={{ borderRadius: 1, minHeight: 360 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      {selectedQuiz ? (
                        <Stack spacing={2}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Typography variant="h6" sx={{ fontWeight: 850 }}>{selectedQuiz.title}</Typography>
                                <Tooltip title="Question, option, and correctness edits increment the quiz version for future audit-safe attempts.">
                                  <Chip size="small" label={`v${selectedQuiz.version || 1}`} {...readableChipProps(theme, "primary")} />
                                </Tooltip>
                              </Stack>
                            </Box>
                            <Button startIcon={<AddIcon />} variant="outlined" onClick={openNewQuestion}>Add question</Button>
                          </Stack>
                          {(selectedQuiz.questions || []).length ? (selectedQuiz.questions || []).map((question, index) => (
                            <Card key={question.id} variant="outlined" sx={{ borderRadius: 1 }}><CardContent sx={{ p: 2 }}><Stack spacing={1.25}><Stack direction="row" spacing={1} alignItems="center"><Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>{index + 1}. {question.question_text}</Typography><IconButton size="small" onClick={() => openEditQuestion(question)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => deleteQuestion(question)}><DeleteOutlineIcon fontSize="small" /></IconButton></Stack>{(question.options || []).map((option) => <Chip key={option.id || option.option_text} size="small" label={`${option.is_correct ? "Correct: " : ""}${option.option_text}`} {...readableChipProps(theme, option.is_correct ? "success" : "neutral")} sx={{ ...chipSx(theme, option.is_correct ? "success" : "neutral"), alignSelf: "flex-start" }} />)}</Stack></CardContent></Card>
                          )) : <Alert severity="info" variant="outlined">This quiz has no questions yet.</Alert>}
                        </Stack>
                      ) : <Alert severity="info" variant="outlined">Select a quiz to edit questions and options.</Alert>}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeTab === "sets" && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ borderRadius: 1, mb: 2 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title="Build the final training program assigned to employees or departments.">
                          <Button variant="contained" startIcon={<AddIcon />} onClick={openNewSet}>New set</Button>
                        </Tooltip>
                      </Stack>
                    </CardContent>
                  </Card>
                  <Stack spacing={1.5}>
                    {tabLoading ? <CircularProgress size={22} /> : trainingSets.length ? (
                      <>
                        {trainingSets.map((trainingSet) => (
                          <TrainingSetCard key={trainingSet.id} trainingSet={trainingSet} selected={selectedSetId === trainingSet.id} onSelect={selectSet} onEdit={openEditSet} />
                        ))}
                        <CompactPagination pagination={activePagination} pageSize={trainingPageSizes.sets} onChange={(page) => updateTrainingPage("sets", page)} onPageSizeChange={(pageSize) => updateTrainingPageSize("sets", pageSize)} />
                      </>
                    ) : <Alert severity="info" variant="outlined">No training sets yet. Create a set, then add videos, documents, quizzes, acknowledgements, or a live session placeholder.</Alert>}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Card variant="outlined" sx={{ borderRadius: 1, minHeight: 420 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      {selectedSet ? (
                        <Stack spacing={2}>
                          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 850 }}>{selectedSet.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{compactText(selectedSet.description, 150) || "No description added."}</Typography>
                            </Box>
                            <Chip label={selectedSet.is_active ? "Active" : "Inactive"} size="small" {...readableChipProps(theme, selectedSet.is_active ? "success" : "neutral")} />
                            <Tooltip title="Copy a reusable group of content into this set.">
                              <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setAddCollectionForm(emptyAddCollectionForm); setAddCollectionDialogOpen(true); }}>Add collection</Button>
                            </Tooltip>
                            <Tooltip title="Add one video, document, quiz, acknowledgement, or live session placeholder.">
                              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openNewSetItem("video")}>Add item</Button>
                            </Tooltip>
                          </Stack>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Tooltip title="Add one video item from the Library.">
                              <Button size="small" onClick={() => openNewSetItem("video")}>Video</Button>
                            </Tooltip>
                            <Tooltip title="Add one document item from the Library.">
                              <Button size="small" onClick={() => openNewSetItem("document")}>Document</Button>
                            </Tooltip>
                            <Tooltip title="Add one reusable quiz.">
                              <Button size="small" onClick={() => openNewSetItem("quiz")}>Quiz</Button>
                            </Tooltip>
                            <Tooltip title="Add a simple employee confirmation item.">
                              <Button size="small" onClick={() => openNewSetItem("acknowledgement")}>Acknowledgement</Button>
                            </Tooltip>
                            <Tooltip title="Lightweight placeholder only; no attendance workflow is active.">
                              <Button size="small" onClick={() => openNewSetItem("live_session")}>Live session</Button>
                            </Tooltip>
                            <Tooltip title="Copy all current items from a reusable collection into this set. Future collection edits do not update this set automatically.">
                              <Button size="small" variant="outlined" onClick={() => { setAddCollectionForm(emptyAddCollectionForm); setAddCollectionDialogOpen(true); }}>Collection group</Button>
                            </Tooltip>
                          </Stack>
                          {(selectedSet.items || []).length ? [...(selectedSet.items || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id).map((item, index, rows) => (
                            <Card key={item.id} variant="outlined" sx={{ borderRadius: 1 }}>
                              <CardContent sx={{ p: 2 }}>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                                  <Stack spacing={0.75} sx={{ flex: 1 }}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                      <Chip size="small" label={`${index + 1}`} {...readableChipProps(theme, "primary")} />
                                      <Chip size="small" label={formatSetItemType(item.item_type)} variant="outlined" />
                                      <Chip size="small" label={item.is_required ? "Required" : "Optional"} {...readableChipProps(theme, item.is_required ? "success" : "neutral")} />
                                      {item.asset && !item.asset.is_active && <Chip size="small" label="Inactive asset" {...readableChipProps(theme, "warning")} />}
                                      {item.quiz && !item.quiz.is_active && <Chip size="small" label="Inactive quiz" {...readableChipProps(theme, "warning")} />}
                                    </Stack>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>{item.display_title}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {item.item_type === "acknowledgement" ? item.acknowledgement_text : item.item_type === "live_session" ? (item.live_session_json?.meeting_link || "Live session placeholder. Meeting workflow is not connected yet.") : (item.display_description || "No description added.")}
                                    </Typography>
                                  </Stack>
                                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                    <IconButton size="small" disabled={index === 0} onClick={() => moveSetItem(item, -1)}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" disabled={index === rows.length - 1} onClick={() => moveSetItem(item, 1)}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => openEditSetItem(item)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => deleteSetItem(item)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                  </Stack>
                                </Stack>
                              </CardContent>
                            </Card>
                          )) : <Alert severity="info" variant="outlined">This set has no items yet. Add one item, or copy a collection group to add several items at once.</Alert>}
                        </Stack>
                      ) : <Alert severity="info" variant="outlined">Select a training set to preview and edit its ordered item list.</Alert>}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeTab === "assignments" && (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 1, height: "100%" }}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack spacing={2}>
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="h6" sx={{ fontWeight: 850 }}>Assign to department</Typography>
                              <Tooltip title="Choose one department and one or more active training sets. Current employees in that department receive assignments.">
                                <HelpOutlineIcon fontSize="small" color="action" />
                              </Tooltip>
                            </Stack>
                          </Box>
                          <FormControl fullWidth size="small">
                            <InputLabel>Department</InputLabel>
                            <Select label="Department" value={departmentAssignmentForm.department_id} onChange={(event) => setDepartmentAssignmentForm((prev) => ({ ...prev, department_id: event.target.value }))}>
                              {departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}
                            </Select>
                          </FormControl>
                          <FormControl fullWidth size="small">
                            <InputLabel>Training sets</InputLabel>
                            <Select
                              multiple
                              label="Training sets"
                              value={departmentAssignmentForm.training_set_ids}
                              onChange={(event) => setDepartmentAssignmentForm((prev) => ({ ...prev, training_set_ids: event.target.value }))}
                              renderValue={(selected) => `${selected.length} set(s) selected`}
                            >
                              {assignableSets.map((trainingSet) => {
                                const itemCount = Number(trainingSet.item_count || trainingSet.items?.length || 0);
                                return (
                                  <MenuItem key={trainingSet.id} value={trainingSet.id} disabled={!trainingSet.is_active || itemCount <= 0}>
                                    {trainingSet.name} · {itemCount} item(s){trainingSet.is_active ? "" : " · inactive"}{itemCount <= 0 ? " · add items first" : ""}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                          <Button variant="contained" onClick={saveDepartmentAssignment} disabled={!departmentAssignmentForm.department_id || departmentAssignmentForm.training_set_ids.length === 0 || readyAssignableSets.length === 0}>Save department assignment</Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 1, height: "100%" }}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack spacing={2}>
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="h6" sx={{ fontWeight: 850 }}>Assign to employee</Typography>
                              <Tooltip title="Manual assignments are idempotent. Repeating the same employee and training set will not duplicate it. Employees can start after the selected set has items.">
                                <HelpOutlineIcon fontSize="small" color="action" />
                              </Tooltip>
                            </Stack>
                          </Box>
                          <FormControl fullWidth size="small">
                            <InputLabel>Department filter</InputLabel>
                            <Select
                              label="Department filter"
                              value={manualAssignmentForm.department_id}
                              onChange={(event) => setManualAssignmentForm((prev) => ({
                                ...prev,
                                department_id: event.target.value,
                                employee_id: "",
                              }))}
                            >
                              <MenuItem value="">All departments</MenuItem>
                              {departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}
                            </Select>
                          </FormControl>
                          <FormControl fullWidth size="small">
                            <InputLabel>Employee</InputLabel>
                            <Select label="Employee" value={manualAssignmentForm.employee_id} onChange={(event) => setManualAssignmentForm((prev) => ({ ...prev, employee_id: event.target.value }))}>
                              {manualAssignmentEmployees.map((employee) => <MenuItem key={employee.id} value={employee.id}>{employee.name}{employee.email ? ` - ${employee.email}` : ""}</MenuItem>)}
                            </Select>
                          </FormControl>
                          {manualAssignmentForm.department_id && manualAssignmentEmployees.length === 0 && (
                            <Alert severity="warning" variant="outlined" sx={{ py: 0.5 }}>
                              No employees found in this department.
                            </Alert>
                          )}
                          <FormControl fullWidth size="small">
                            <InputLabel>Training set</InputLabel>
                            <Select label="Training set" value={manualAssignmentForm.training_set_id} onChange={(event) => setManualAssignmentForm((prev) => ({ ...prev, training_set_id: event.target.value }))}>
                              {assignableSets.map((trainingSet) => {
                                const itemCount = Number(trainingSet.item_count || trainingSet.items?.length || 0);
                                return (
                                  <MenuItem key={trainingSet.id} value={trainingSet.id} disabled={!trainingSet.is_active || itemCount <= 0}>
                                    {trainingSet.name} · {itemCount} item(s){trainingSet.is_active ? "" : " · inactive"}{itemCount <= 0 ? " · add items first" : ""}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                          <Button variant="contained" onClick={saveManualAssignment} disabled={!manualAssignmentForm.employee_id || !manualAssignmentForm.training_set_id || readyAssignableSets.length === 0}>Assign employee</Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Card variant="outlined" sx={{ borderRadius: 1 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="h6" sx={{ fontWeight: 850 }}>Current assignments</Typography>
                          <Tooltip title="Top-level status stays simple: Not started, In progress, Completed.">
                            <HelpOutlineIcon fontSize="small" color="action" />
                          </Tooltip>
                        </Stack>
                      </Box>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
                        <FormControl size="small" sx={{ minWidth: 160 }}><InputLabel>Department</InputLabel><Select label="Department" value={assignmentFilters.department_id} onChange={(event) => { resetTrainingPage("assignments"); setAssignmentFilters((prev) => ({ ...prev, department_id: event.target.value })); }}><MenuItem value="">All departments</MenuItem>{departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}</Select></FormControl>
                        <FormControl size="small" sx={{ minWidth: 160 }}><InputLabel>Status</InputLabel><Select label="Status" value={assignmentFilters.status} onChange={(event) => { resetTrainingPage("assignments"); setAssignmentFilters((prev) => ({ ...prev, status: event.target.value })); }}><MenuItem value="">All statuses</MenuItem><MenuItem value="not_started">Not started</MenuItem><MenuItem value="in_progress">In progress</MenuItem><MenuItem value="completed">Completed</MenuItem></Select></FormControl>
                        <FormControl size="small" sx={{ minWidth: 160 }}><InputLabel>Source</InputLabel><Select label="Source" value={assignmentFilters.source_type} onChange={(event) => { resetTrainingPage("assignments"); setAssignmentFilters((prev) => ({ ...prev, source_type: event.target.value })); }}><MenuItem value="">All sources</MenuItem><MenuItem value="manual">Manual</MenuItem><MenuItem value="department">Department</MenuItem></Select></FormControl>
                        <Button variant="outlined" onClick={() => { resetTrainingPage("assignments"); setAssignmentFilters({ department_id: "", employee_id: "", training_set_id: "", status: "", source_type: "" }); }}>Reset</Button>
                      </Stack>
                      {tabLoading ? <CircularProgress size={22} /> : assignments.length ? (
                        <Stack spacing={1}>
                          {assignments.map((assignment) => (
                            <Card key={assignment.assignment_id} variant="outlined" sx={{ borderRadius: 1 }}>
                              <CardContent sx={{ p: 1.5 }}>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>{assignment.employee_name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{assignment.training_set_name} · {assignment.department || "Unassigned"}</Typography>
                                  </Box>
                                  <Chip size="small" label={assignment.source_type === "department" ? "Department" : "Manual"} {...readableChipProps(theme, "neutral")} />
                                  <Chip size="small" label={(assignment.status || "not_started").replace(/_/g, " ")} {...readableChipProps(theme, assignment.status === "completed" ? "success" : assignment.status === "in_progress" ? "warning" : "neutral")} />
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                          <CompactPagination pagination={activePagination} pageSize={trainingPageSizes.assignments} onChange={(page) => updateTrainingPage("assignments", page)} onPageSizeChange={(pageSize) => updateTrainingPageSize("assignments", pageSize)} />
                        </Stack>
                      ) : <Alert severity="info" variant="outlined">No assignments match the selected filters.</Alert>}
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 1 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="h6" sx={{ fontWeight: 850 }}>Department assignment rules</Typography>
                          <Tooltip title="Sync is safe and repeatable. It creates missing department assignments only, skips existing department assignments, and does not duplicate manual assignments. New hires and department changes also check these rules automatically.">
                            <HelpOutlineIcon fontSize="small" color="action" />
                          </Tooltip>
                        </Stack>
                      </Box>
                      {departmentRuleGroups.length ? departmentRuleGroups.map((group) => {
                        const result = syncResults[group.department_id];
                        return (
                          <Card key={group.department_id} variant="outlined" sx={{ borderRadius: 1 }}>
                            <CardContent sx={{ p: 1.5 }}>
                              <Stack spacing={1}>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>{group.department_name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{group.active_count} active training set rule(s)</Typography>
                                  </Box>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={!group.active_count || String(syncingDepartmentId) === String(group.department_id)}
                                    onClick={() => syncDepartmentAssignments(group.department_id)}
                                  >
                                    {String(syncingDepartmentId) === String(group.department_id) ? "Syncing..." : "Sync department"}
                                  </Button>
                                </Stack>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  {group.rows.map((row) => (
                                    <Chip
                                      key={row.id}
                                      size="small"
                                      label={row.training_set_name || "Training set"}
                                      {...readableChipProps(theme, row.is_active ? "success" : "neutral")}
                                    />
                                  ))}
                                </Stack>
                                {result && (
                                  <Alert severity="success" variant="outlined" sx={{ py: 0.5 }}>
                                    Evaluated {result.employees_evaluated || 0} employee(s). Created {result.assignments_created || 0}; skipped existing {result.assignments_skipped_existing || 0}; skipped manual {result.assignments_skipped_manual_already_present || 0}.
                                  </Alert>
                                )}
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      }) : <Typography variant="body2" color="text.secondary">No department training-set rules yet.</Typography>}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            )}

            {activeTab === "progress" && (
              <Stack spacing={2}>
                <Card variant="outlined" sx={{ borderRadius: 1 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 850 }}>Training progress</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Review employee progress, required item completion, and quiz attempt outcomes. This page is read-only.
                        </Typography>
                      </Box>
                      <Button variant="outlined" onClick={() => loadTab("progress", true)}>Refresh progress</Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4} lg={2}><StatCard label="Assignments" value={progressSummary.assignments} helper="Included in current view" /></Grid>
                  <Grid item xs={12} md={4} lg={2}><StatCard label="Completed" value={progressSummary.completed} helper="All required items done" /></Grid>
                  <Grid item xs={12} md={4} lg={2}><StatCard label="In progress" value={progressSummary.in_progress} helper="Started but incomplete" /></Grid>
                  <Grid item xs={12} md={4} lg={2}><StatCard label="Quiz attempts" value={progressSummary.quiz_attempts} helper="Submitted or active attempts" /></Grid>
                  <Grid item xs={12} md={4} lg={2}><StatCard label="Failed attempts" value={progressSummary.failed_quiz_attempts} helper="Assignment remains in progress" /></Grid>
                </Grid>

                <Alert severity="info" variant="outlined">
                  Assignment status remains simple: Not started, In progress, or Completed. Failed quiz attempts do not create a separate top-level status.
                </Alert>

                {tabLoading ? <CircularProgress size={22} /> : progressRows.length ? (
                  <Stack spacing={1.5}>
                    {progressRows.map((assignment) => {
                      const percent = completionPercent(assignment);
                      return (
                        <Card key={assignment.assignment_id} variant="outlined" sx={{ borderRadius: 1 }}>
                          <CardContent sx={{ p: 2 }}>
                            <Stack spacing={1.5}>
                              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>{assignment.employee_name}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {assignment.training_set_name} · {assignment.department || "Unassigned"} · {assignment.source_type === "department" ? "Department assignment" : "Manual assignment"}
                                  </Typography>
                                </Box>
                                <Chip size="small" label={formatTrainingStatus(assignment.status)} {...readableChipProps(theme, assignment.status === "completed" ? "success" : assignment.status === "in_progress" ? "warning" : "neutral")} />
                                <Chip size="small" label={`${assignment.completed_required_count || 0}/${assignment.required_item_count || 0} required`} {...readableChipProps(theme, "neutral")} />
                              </Stack>
                              <Box>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">Required completion</Typography>
                                  <Typography variant="caption" color="text.secondary">{percent}%</Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={percent} sx={{ borderRadius: 1, height: 8 }} />
                              </Box>
                              <Stack spacing={0.75}>
                                {(assignment.items || []).map((item, index) => {
                                  const latestAttempt = item.quiz_attempts?.latest_attempt;
                                  return (
                                    <Stack
                                      key={item.id}
                                      direction={{ xs: "column", md: "row" }}
                                      spacing={1}
                                      alignItems={{ xs: "flex-start", md: "center" }}
                                      sx={{ px: 1, py: 0.85, borderRadius: 0.75, bgcolor: alpha(theme.palette.text.primary, 0.035) }}
                                    >
                                      <Chip size="small" label={index + 1} {...readableChipProps(theme, "primary")} />
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.display_title}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {formatSetItemType(item.item_type)} · {item.is_required && item.item_type !== "live_session" ? "Required" : "Optional / informational"}
                                        </Typography>
                                      </Box>
                                      {item.item_type === "quiz" && (
                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                                          <Chip size="small" label={`${item.quiz_attempts?.attempt_count || 0} attempt(s)`} {...readableChipProps(theme, "neutral")} />
                                          {latestAttempt && (
                                            <Chip
                                              size="small"
                                              label={`${latestAttempt.passed ? "Passed" : latestAttempt.submitted_at ? "Not passed" : "Started"}${latestAttempt.score_percent != null ? ` · ${latestAttempt.score_percent}%` : ""}`}
                                              {...readableChipProps(theme, latestAttempt.passed ? "success" : latestAttempt.submitted_at ? "warning" : "neutral")}
                                            />
                                          )}
                                        </Stack>
                                      )}
                                      <Chip size="small" label={formatTrainingStatus(item.progress?.status)} {...readableChipProps(theme, item.progress?.status === "completed" ? "success" : item.progress?.status === "in_progress" ? "warning" : "neutral")} />
                                    </Stack>
                                  );
                                })}
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                    <CompactPagination pagination={activePagination} pageSize={trainingPageSizes.progress} onChange={(page) => updateTrainingPage("progress", page)} onPageSizeChange={(pageSize) => updateTrainingPageSize("progress", pageSize)} />
                  </Stack>
                ) : (
                  <Alert severity="info" variant="outlined">No training progress yet. Assign a training set, then employee actions will appear here.</Alert>
                )}
              </Stack>
            )}

            {!["overview", "library", "resources", "collections", "quizzes", "sets", "assignments", "progress"].includes(activeTab) && (
              tabLoading ? <CircularProgress size={22} /> : <DeferredSection activeTab={activeTab} data={activeData} />
            )}
          </>
        )}
      </Stack>

      <Dialog open={resourceDialogOpen} onClose={() => setResourceDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: trainingDialogPaperSx }}>
        <DialogTitle>{resourceForm.id ? "Edit learning resource" : "Share learning resource"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Library asset</InputLabel>
              <Select
                label="Library asset"
                value={resourceForm.asset_id}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, asset_id: event.target.value }))}
              >
                {resourceAssets.map((asset) => (
                  <MenuItem key={asset.id} value={asset.id} disabled={!asset.is_active || asset.asset_type === "video_hosted"}>
                    {asset.title} · {formatAssetType(asset.asset_type)}{asset.is_active ? "" : " · archived"}{asset.asset_type === "video_hosted" ? " · disabled" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Title override" value={resourceForm.title_override || ""} onChange={(event) => setResourceForm((prev) => ({ ...prev, title_override: event.target.value }))} fullWidth />
            <TextField label="Description override" value={resourceForm.description_override || ""} onChange={(event) => setResourceForm((prev) => ({ ...prev, description_override: event.target.value }))} multiline minRows={2} fullWidth />
            <CategoryField value={resourceForm.category} categories={categories} onChange={(value) => setResourceForm((prev) => ({ ...prev, category: value }))} />
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>Audience</Typography>
              <Typography variant="caption" color="text.secondary">
                Choose departments for broad sharing. Add individual employees only when they need this resource separately.
              </Typography>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Share with departments</InputLabel>
              <Select
                multiple
                label="Share with departments"
                value={resourceForm.department_ids || []}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, department_ids: event.target.value }))}
                renderValue={(selected) => selected.map((id) => departments.find((department) => String(department.id) === String(id))?.name || id).join(", ")}
              >
                {departments.length ? departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>) : (
                  <MenuItem disabled>No departments found</MenuItem>
                )}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Filter employees by department</InputLabel>
              <Select
                label="Filter employees by department"
                value={resourceEmployeeDepartmentFilter}
                onChange={(event) => setResourceEmployeeDepartmentFilter(event.target.value)}
              >
                <MenuItem value="">All employees</MenuItem>
                {departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}
                <MenuItem value="__unassigned">Unassigned employees</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Add individual employees</InputLabel>
              <Select
                multiple
                label="Add individual employees"
                value={resourceForm.employee_ids || []}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, employee_ids: event.target.value }))}
                renderValue={(selected) => selected.map((id) => employees.find((employee) => String(employee.id) === String(id))?.name || id).join(", ")}
              >
                {resourceDialogEmployeeOptions.length ? resourceDialogEmployeeOptions.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name || employee.email}{employee.email ? ` · ${employee.email}` : ""} · {getDepartmentName(employee.department_id)}
                  </MenuItem>
                )) : (
                  <MenuItem disabled>No employees found for this filter</MenuItem>
                )}
              </Select>
            </FormControl>
            <Alert severity="info" variant="outlined">
              Selected audience: {(resourceForm.department_ids || []).length} department(s), {(resourceForm.employee_ids || []).length} individual employee(s).
            </Alert>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <FormControlLabel control={<Switch checked={Boolean(resourceForm.is_published)} onChange={(event) => setResourceForm((prev) => ({ ...prev, is_published: event.target.checked }))} />} label="Published" />
              <FormControlLabel control={<Switch checked={Boolean(resourceForm.is_archived)} onChange={(event) => setResourceForm((prev) => ({ ...prev, is_archived: event.target.checked }))} />} label="Archived" />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResourceDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveResource}
            disabled={!resourceForm.asset_id || (!(resourceForm.department_ids || []).length && !(resourceForm.employee_ids || []).length)}
          >
            Save resource
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assetDialogOpen} onClose={() => setAssetDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: trainingDialogPaperSx }}>
        <DialogTitle>{assetForm.id ? "Edit training asset" : "Create training asset"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth><InputLabel>Asset type</InputLabel><Select label="Asset type" value={assetForm.asset_type} onChange={(event) => setAssetForm((prev) => ({ ...prev, asset_type: event.target.value }))}>{ASSET_TYPES.map((type) => <MenuItem key={type.value} value={type.value} disabled={type.value === "video_hosted" && !capabilities.hosted_video_upload_enabled}>{type.label}{type.value === "video_hosted" && !capabilities.hosted_video_upload_enabled ? " - coming soon" : ""}</MenuItem>)}</Select></FormControl>
            {assetForm.asset_type === "video_hosted" && <Alert severity="warning" variant="outlined">Hosted upload is not active for this plan yet. Use YouTube, Vimeo, Loom, Drive, or company video URLs for now.</Alert>}
            <TextField label="Title" value={assetForm.title} onChange={(event) => setAssetForm((prev) => ({ ...prev, title: event.target.value }))} fullWidth />
            <TextField label="Description" value={assetForm.description || ""} onChange={(event) => setAssetForm((prev) => ({ ...prev, description: event.target.value }))} multiline minRows={2} fullWidth />
            {assetForm.asset_type === "video_link" && <TextField label="External video URL" value={assetForm.external_url || ""} onChange={(event) => setAssetForm((prev) => ({ ...prev, external_url: event.target.value }))} fullWidth helperText="YouTube and Vimeo can usually be tracked when watched inside Schedulaa. Other links are view-only." />}
            {assetForm.asset_type === "document" && (
              <Alert severity="info" variant="outlined" sx={{ py: 0.75 }}>
                Documents stay private/internal and download through Schedulaa access controls. Supported: {documentAllowedLabel}. Maximum size: {documentMaxLabel}.
              </Alert>
            )}
            <Grid container spacing={2}><Grid item xs={12} sm={6}><TextField label="Duration minutes" type="number" value={assetForm.duration_minutes || ""} onChange={(event) => setAssetForm((prev) => ({ ...prev, duration_minutes: event.target.value }))} fullWidth /></Grid><Grid item xs={12} sm={6}><CategoryField value={assetForm.category} categories={categories} onChange={(value) => setAssetForm((prev) => ({ ...prev, category: value }))} /></Grid></Grid>
            <FormControlLabel control={<Switch checked={Boolean(assetForm.is_active)} onChange={(event) => setAssetForm((prev) => ({ ...prev, is_active: event.target.checked }))} />} label="Active" />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setAssetDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveAsset} disabled={assetForm.asset_type === "video_hosted" && !capabilities.hosted_video_upload_enabled}>Save asset</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(uploadAsset)} onClose={() => setUploadAsset(null)} fullWidth maxWidth="xs" PaperProps={{ sx: trainingDialogPaperSx }}>
        <DialogTitle>Upload training document</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Upload a private/internal document for {uploadAsset?.title}. Supported: {documentAllowedLabel}. Maximum size: {documentMaxLabel}.
            </Typography>
            <Alert severity="info" variant="outlined" sx={{ py: 0.75 }}>
              Documents are stored privately and downloaded through Schedulaa access controls.
            </Alert>
            <Button component="label" variant="contained" startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />} disabled={uploading}>
              Choose file
              <input hidden type="file" accept={documentAccept} onChange={uploadDocument} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setUploadAsset(null)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={previewDialogOpen} onClose={closeAssetPreview} fullWidth maxWidth="lg" PaperProps={{ sx: trainingDialogPaperSx }}>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 850 }}>Preview asset</Typography>
              <Typography variant="body2" color="text.secondary">{previewAsset?.title || "Training asset"}</Typography>
            </Box>
            {previewAsset?.asset_type === "video_link" && previewAsset?.external_url && (
              <Button size="small" startIcon={<OpenInNewIcon />} onClick={() => window.open(previewAsset.external_url, "_blank", "noopener,noreferrer")}>
                Open source
              </Button>
            )}
            {previewAsset?.asset_type === "document" && previewAsset?.has_file && (
              <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadDocument(previewAsset)}>
                Download
              </Button>
            )}
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: alpha(theme.palette.text.primary, 0.035) }}>
          {previewLoading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 360 }} spacing={1}>
              <CircularProgress size={26} />
              <Typography variant="body2" color="text.secondary">Preparing preview...</Typography>
            </Stack>
          ) : previewKind === "video" && previewUrl ? (
            <Box sx={{ position: "relative", pt: "56.25%", borderRadius: 1, overflow: "hidden", bgcolor: "black", boxShadow: `0 16px 50px ${alpha(theme.palette.common.black, 0.22)}` }}>
              <Box component="iframe" title={previewAsset?.title || "Video preview"} src={previewUrl} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
            </Box>
          ) : previewKind === "pdf" && previewUrl ? (
            <Box component="iframe" title={previewAsset?.title || "PDF preview"} src={previewUrl} sx={{ width: "100%", minHeight: { xs: 420, md: 680 }, border: 0, borderRadius: 1, bgcolor: "background.paper", boxShadow: `0 16px 50px ${alpha(theme.palette.common.black, 0.12)}` }} />
          ) : previewKind === "image" && previewUrl ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: { xs: 1, md: 3 } }}>
              <Box component="img" src={previewUrl} alt={previewAsset?.title || "Document preview"} sx={{ maxWidth: "100%", maxHeight: "72vh", borderRadius: 1, boxShadow: `0 16px 50px ${alpha(theme.palette.common.black, 0.16)}`, bgcolor: "background.paper" }} />
            </Box>
          ) : previewKind === "disabled" ? (
            <Alert severity="warning" variant="outlined">Hosted video upload and preview are prepared for a future phase but disabled for this release.</Alert>
          ) : previewKind === "missing" ? (
            <Alert severity="info" variant="outlined">This document asset does not have an uploaded file yet. Upload the file from the Library card first.</Alert>
          ) : previewKind === "download" ? (
            <Alert severity="info" variant="outlined">
              Inline preview is available for PDFs and images. This file type should be downloaded to review.
            </Alert>
          ) : previewKind === "error" ? (
            <Alert severity="error" variant="outlined">Preview could not be prepared. Try downloading the file instead.</Alert>
          ) : (
            <Alert severity="info" variant="outlined">Preview is not available for this asset.</Alert>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
            Document previews use the same controlled Schedulaa download access as normal document downloads. Some external video providers may block embedding; use Open source if that happens.
          </Typography>
        </DialogContent>
        <DialogActions><Button onClick={closeAssetPreview}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={quizDialogOpen} onClose={() => setQuizDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: trainingDialogPaperSx }}>
        <DialogTitle>{quizForm.id ? "Edit quiz" : "Create quiz"}</DialogTitle>
        <DialogContent dividers><Stack spacing={2} sx={{ pt: 1 }}><TextField label="Quiz title" value={quizForm.title} onChange={(event) => setQuizForm((prev) => ({ ...prev, title: event.target.value }))} fullWidth /><TextField label="Description" value={quizForm.description || ""} onChange={(event) => setQuizForm((prev) => ({ ...prev, description: event.target.value }))} multiline minRows={2} fullWidth /><CategoryField value={quizForm.category} categories={categories} onChange={(value) => setQuizForm((prev) => ({ ...prev, category: value }))} /><TextField label="Passing score %" type="number" value={quizForm.passing_score_percent} onChange={(event) => setQuizForm((prev) => ({ ...prev, passing_score_percent: event.target.value }))} fullWidth /><FormControlLabel control={<Switch checked={Boolean(quizForm.is_active)} onChange={(event) => setQuizForm((prev) => ({ ...prev, is_active: event.target.checked }))} />} label="Active" /><Alert severity="info" variant="outlined">Editing a quiz increments its version. Future employee attempts will store quiz version and answer snapshots.</Alert></Stack></DialogContent>
        <DialogActions><Button onClick={() => setQuizDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveQuiz}>Save quiz</Button></DialogActions>
      </Dialog>

      <Dialog open={questionDialogOpen} onClose={() => setQuestionDialogOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: trainingDialogPaperSx }}>
        <DialogTitle>{questionForm.id ? "Edit question" : "Add question"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Question"
              value={questionForm.question_text}
              onChange={(event) => setQuestionForm((prev) => ({ ...prev, question_text: event.target.value }))}
              fullWidth
              multiline
              minRows={2}
              placeholder="Example: What should you do if you cannot attend a shift?"
            />
            <Alert severity="info" variant="outlined" sx={{ py: 0.75 }}>
              Type the answer text into at least two option fields. “Option 1” and “Option 2” are labels only, not saved answers.
            </Alert>
            {questionForm.options.map((option, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center">
                <Radio checked={Boolean(option.is_correct)} onChange={() => setCorrectOption(index)} />
                <TextField
                  label={`Answer option ${index + 1}`}
                  placeholder={`Type answer option ${index + 1}`}
                  value={option.option_text}
                  onChange={(event) => updateOptionText(index, event.target.value)}
                  fullWidth
                  helperText={option.is_correct ? "Marked as the correct answer" : " "}
                />
                {questionForm.options.length > 2 && <IconButton color="error" onClick={() => removeOption(index)}><DeleteOutlineIcon /></IconButton>}
              </Stack>
            ))}
            <Button startIcon={<AddIcon />} onClick={addOption} sx={{ alignSelf: "flex-start" }}>Add option</Button>
            <Alert severity={questionDraftValid ? "success" : "warning"} variant="outlined">
              {questionDraftValid
                ? "Ready to save: question text, two answer options, and one correct answer are set."
                : `Before saving: ${questionDraftState.hasQuestion ? "" : "add question text; "}${questionDraftState.optionCount >= 2 ? "" : "type at least two answer options; "}${questionDraftState.hasCorrect ? "" : "choose one correct answer; "}`}
            </Alert>
            <Alert severity="info" variant="outlined">Question edits increment the quiz version for audit-safe future attempts.</Alert>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setQuestionDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveQuestion} disabled={!questionDraftValid}>Save question</Button></DialogActions>
      </Dialog>

      <Dialog open={setDialogOpen} onClose={() => setSetDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: trainingDialogPaperSx }}>
        <DialogTitle>{setForm.id ? "Edit training set" : "Create training set"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Set name" value={setForm.name} onChange={(event) => setSetForm((prev) => ({ ...prev, name: event.target.value }))} fullWidth />
            <TextField label="Description" value={setForm.description || ""} onChange={(event) => setSetForm((prev) => ({ ...prev, description: event.target.value }))} multiline minRows={2} fullWidth />
            <FormControlLabel control={<Switch checked={Boolean(setForm.is_active)} onChange={(event) => setSetForm((prev) => ({ ...prev, is_active: event.target.checked }))} />} label="Active" />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setSetDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveSet}>Save set</Button></DialogActions>
      </Dialog>

      <Dialog open={collectionDialogOpen} onClose={() => setCollectionDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: trainingDialogPaperSx }}>
        <DialogTitle>{collectionForm.id ? "Edit collection" : "Create collection"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Collection name" value={collectionForm.name} onChange={(event) => setCollectionForm((prev) => ({ ...prev, name: event.target.value }))} fullWidth />
            <TextField label="Description" value={collectionForm.description || ""} onChange={(event) => setCollectionForm((prev) => ({ ...prev, description: event.target.value }))} multiline minRows={2} fullWidth />
            <CategoryField value={collectionForm.category} categories={categories} onChange={(value) => setCollectionForm((prev) => ({ ...prev, category: value }))} />
            <FormControlLabel control={<Switch checked={Boolean(collectionForm.is_active)} onChange={(event) => setCollectionForm((prev) => ({ ...prev, is_active: event.target.checked }))} />} label="Active" />
            <Alert severity="info" variant="outlined">Collections are reusable templates. They are copied into training sets and are not assigned directly.</Alert>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setCollectionDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveCollection}>Save collection</Button></DialogActions>
      </Dialog>

      <Dialog open={addCollectionDialogOpen} onClose={() => setAddCollectionDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: trainingDialogPaperSx }}>
        <DialogTitle>Add collection to training set</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info" variant="outlined">This copies the collection’s current items into the training set. Future collection edits will not silently change this set.</Alert>
            <FormControl fullWidth>
              <InputLabel>Collection</InputLabel>
              <Select label="Collection" value={addCollectionForm.collection_id} onChange={(event) => setAddCollectionForm((prev) => ({ ...prev, collection_id: event.target.value }))}>
                {activeCollections.map((collection) => (
                  <MenuItem key={collection.id} value={collection.id}>{collection.name} · {collection.item_count || collection.items?.length || 0} item(s){collection.category ? ` · ${collection.category}` : ""}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedCollectionForCopy && (
              <Card variant="outlined" sx={{ borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Stack spacing={0.75}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>{selectedCollectionForCopy.name}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {selectedCollectionForCopy.category && <Chip size="small" label={selectedCollectionForCopy.category} />}
                      <Chip size="small" label={`${selectedCollectionForCopy.item_count || selectedCollectionForCopy.items?.length || 0} item(s)`} />
                      {formatBreakdown(selectedCollectionBreakdown) && <Chip size="small" label={formatBreakdown(selectedCollectionBreakdown)} variant="outlined" />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Copy-on-add keeps this set stable if the collection changes later.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}
            {activeCollections.length === 0 && <Alert severity="warning" variant="outlined">Create an active collection with at least one item first.</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setAddCollectionDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={addCollectionToSet} disabled={!addCollectionForm.collection_id}>Copy collection</Button></DialogActions>
      </Dialog>

      <Dialog open={setItemDialogOpen} onClose={() => setSetItemDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: trainingDialogPaperSx }}>
        <DialogTitle>{setItemForm.id ? "Edit training item" : "Add training item"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Item type</InputLabel>
              <Select label="Item type" value={setItemForm.item_type} onChange={(event) => setSetItemForm((prev) => ({ ...emptySetItemForm, id: prev.id, item_type: event.target.value }))}>
                <MenuItem value="video">Existing video</MenuItem>
                <MenuItem value="document">Existing document</MenuItem>
                <MenuItem value="quiz">Existing quiz</MenuItem>
                <MenuItem value="acknowledgement">Acknowledgement</MenuItem>
                <MenuItem value="live_session">Live session stub</MenuItem>
              </Select>
            </FormControl>

            {setItemForm.item_type === "video" && (
              <FormControl fullWidth>
                <InputLabel>Video asset</InputLabel>
                <Select label="Video asset" value={setItemForm.asset_id} onChange={(event) => setSetItemForm((prev) => ({ ...prev, asset_id: event.target.value }))}>
                  {activeVideoAssets.map((asset) => <MenuItem key={asset.id} value={asset.id}>{asset.title}{asset.asset_type === "video_hosted" ? " - hosted/future" : ""}</MenuItem>)}
                  {inactiveSetAssets.filter((asset) => ["video_link", "video_hosted"].includes(asset.asset_type)).map((asset) => <MenuItem key={asset.id} value={asset.id}>{asset.title} - inactive</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {setItemForm.item_type === "document" && (
              <>
                {activeDocumentAssets.length === 0 && (
                  <Alert
                    severity="info"
                    variant="outlined"
                    action={<Button size="small" onClick={() => { setSetItemDialogOpen(false); setActiveTab("library"); openNewAsset("document"); }}>Create document</Button>}
                  >
                    Documents are uploaded from the Library first. Create a document asset, upload the PDF/Word file on its Library card, then attach it here.
                  </Alert>
                )}
                <FormControl fullWidth>
                  <InputLabel>Document asset</InputLabel>
                  <Select label="Document asset" value={setItemForm.asset_id} onChange={(event) => setSetItemForm((prev) => ({ ...prev, asset_id: event.target.value }))}>
                    {activeDocumentAssets.map((asset) => (
                      <MenuItem key={asset.id} value={asset.id}>
                        {asset.title}{asset.has_file ? "" : " - file not uploaded yet"}
                      </MenuItem>
                    ))}
                    {inactiveSetAssets.filter((asset) => asset.asset_type === "document").map((asset) => <MenuItem key={asset.id} value={asset.id}>{asset.title} - inactive</MenuItem>)}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">
                  This picker attaches an existing document asset. File upload is managed in the Library tab so the same document can be reused in multiple training sets.
                </Typography>
              </>
            )}

            {setItemForm.item_type === "quiz" && (
              <>
                {activeQuizzes.some((quiz) => Number(quiz.question_count || 0) <= 0) && (
                  <Alert severity="warning" variant="outlined">
                    Quizzes need at least one question before employees can start them. Add questions in the Quizzes tab first.
                  </Alert>
                )}
                <FormControl fullWidth>
                  <InputLabel>Quiz</InputLabel>
                  <Select label="Quiz" value={setItemForm.quiz_id} onChange={(event) => setSetItemForm((prev) => ({ ...prev, quiz_id: event.target.value }))}>
                    {activeQuizzes.map((quiz) => (
                      <MenuItem key={quiz.id} value={quiz.id} disabled={Number(quiz.question_count || 0) <= 0}>
                        {quiz.title} - v{quiz.version || 1} · {quiz.question_count || 0} question(s){Number(quiz.question_count || 0) <= 0 ? " - add questions first" : ""}
                      </MenuItem>
                    ))}
                    {inactiveQuizzes.map((quiz) => <MenuItem key={quiz.id} value={quiz.id}>{quiz.title} - inactive</MenuItem>)}
                  </Select>
                </FormControl>
              </>
            )}

            {setItemForm.item_type === "live_session" && (
              <Alert severity="info" variant="outlined">This is a placeholder only. It does not create a Team Meeting, Jitsi room, attendance workflow, or completion action yet.</Alert>
            )}

            <TextField label={setItemForm.item_type === "live_session" ? "Session title" : "Title override"} value={setItemForm.title_override || ""} onChange={(event) => setSetItemForm((prev) => ({ ...prev, title_override: event.target.value }))} fullWidth />
            <TextField label="Description override" value={setItemForm.description_override || ""} onChange={(event) => setSetItemForm((prev) => ({ ...prev, description_override: event.target.value }))} multiline minRows={2} fullWidth />

            {setItemForm.item_type === "acknowledgement" && (
              <TextField label="Acknowledgement text" value={setItemForm.acknowledgement_text || ""} onChange={(event) => setSetItemForm((prev) => ({ ...prev, acknowledgement_text: event.target.value }))} multiline minRows={3} fullWidth helperText="Example: I have read and understood this training." />
            )}

            {setItemForm.item_type === "live_session" && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField label="Scheduled date/time" value={setItemForm.scheduled_at || ""} onChange={(event) => setSetItemForm((prev) => ({ ...prev, scheduled_at: event.target.value }))} fullWidth placeholder="2026-05-01 14:00" /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Meeting link" value={setItemForm.meeting_link || ""} onChange={(event) => setSetItemForm((prev) => ({ ...prev, meeting_link: event.target.value }))} fullWidth placeholder="Paste meeting URL later" /></Grid>
              </Grid>
            )}

            <FormControlLabel control={<Switch checked={Boolean(setItemForm.is_required)} onChange={(event) => setSetItemForm((prev) => ({ ...prev, is_required: event.target.checked }))} />} label={setItemForm.is_required ? "Required item" : "Optional item"} />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setSetItemDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveSetItem}>Save item</Button></DialogActions>
      </Dialog>

      <Dialog open={collectionItemDialogOpen} onClose={() => setCollectionItemDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: trainingDialogPaperSx }}>
        <DialogTitle>{collectionItemForm.id ? "Edit collection item" : "Add collection item"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Item type</InputLabel>
              <Select label="Item type" value={collectionItemForm.item_type} onChange={(event) => setCollectionItemForm((prev) => ({ ...emptySetItemForm, id: prev.id, item_type: event.target.value }))}>
                <MenuItem value="video">Existing video</MenuItem>
                <MenuItem value="document">Existing document</MenuItem>
                <MenuItem value="quiz">Existing quiz</MenuItem>
                <MenuItem value="acknowledgement">Acknowledgement</MenuItem>
                <MenuItem value="live_session">Live session stub</MenuItem>
              </Select>
            </FormControl>

            {collectionItemForm.item_type === "video" && (
              <FormControl fullWidth>
                <InputLabel>Video asset</InputLabel>
                <Select label="Video asset" value={collectionItemForm.asset_id} onChange={(event) => setCollectionItemForm((prev) => ({ ...prev, asset_id: event.target.value }))}>
                  {activeVideoAssets.map((asset) => <MenuItem key={asset.id} value={asset.id}>{asset.title}{asset.category ? ` · ${asset.category}` : ""}</MenuItem>)}
                  {inactiveSetAssets.filter((asset) => ["video_link", "video_hosted"].includes(asset.asset_type)).map((asset) => <MenuItem key={asset.id} value={asset.id}>{asset.title} - inactive</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {collectionItemForm.item_type === "document" && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Document asset</InputLabel>
                  <Select label="Document asset" value={collectionItemForm.asset_id} onChange={(event) => setCollectionItemForm((prev) => ({ ...prev, asset_id: event.target.value }))}>
                    {activeDocumentAssets.map((asset) => <MenuItem key={asset.id} value={asset.id}>{asset.title}{asset.category ? ` · ${asset.category}` : ""}{asset.has_file ? "" : " · file missing"}</MenuItem>)}
                    {inactiveSetAssets.filter((asset) => asset.asset_type === "document").map((asset) => <MenuItem key={asset.id} value={asset.id}>{asset.title} - inactive</MenuItem>)}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">
                  Upload files in Library first. Collections only reference reusable document assets.
                </Typography>
              </>
            )}

            {collectionItemForm.item_type === "quiz" && (
              <FormControl fullWidth>
                <InputLabel>Quiz</InputLabel>
                <Select label="Quiz" value={collectionItemForm.quiz_id} onChange={(event) => setCollectionItemForm((prev) => ({ ...prev, quiz_id: event.target.value }))}>
                  {activeQuizzes.map((quiz) => (
                    <MenuItem key={quiz.id} value={quiz.id} disabled={Number(quiz.question_count || 0) <= 0}>
                      {quiz.title} - v{quiz.version || 1} · {quiz.question_count || 0} question(s){quiz.category ? ` · ${quiz.category}` : ""}{Number(quiz.question_count || 0) <= 0 ? " · add questions first" : ""}
                    </MenuItem>
                  ))}
                  {inactiveQuizzes.map((quiz) => <MenuItem key={quiz.id} value={quiz.id}>{quiz.title} - inactive</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {collectionItemForm.item_type === "live_session" && (
              <Alert severity="info" variant="outlined">This is a placeholder only. It does not create a Team Meeting, Jitsi room, attendance workflow, or completion action yet.</Alert>
            )}

            <TextField label={collectionItemForm.item_type === "live_session" ? "Session title" : "Title override"} value={collectionItemForm.title_override || ""} onChange={(event) => setCollectionItemForm((prev) => ({ ...prev, title_override: event.target.value }))} fullWidth />
            <TextField label="Description override" value={collectionItemForm.description_override || ""} onChange={(event) => setCollectionItemForm((prev) => ({ ...prev, description_override: event.target.value }))} multiline minRows={2} fullWidth />

            {collectionItemForm.item_type === "acknowledgement" && (
              <TextField label="Acknowledgement text" value={collectionItemForm.acknowledgement_text || ""} onChange={(event) => setCollectionItemForm((prev) => ({ ...prev, acknowledgement_text: event.target.value }))} multiline minRows={3} fullWidth helperText="Example: I have read and understood this training." />
            )}

            {collectionItemForm.item_type === "live_session" && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField label="Scheduled date/time" value={collectionItemForm.scheduled_at || ""} onChange={(event) => setCollectionItemForm((prev) => ({ ...prev, scheduled_at: event.target.value }))} fullWidth placeholder="2026-05-01 14:00" /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Meeting link" value={collectionItemForm.meeting_link || ""} onChange={(event) => setCollectionItemForm((prev) => ({ ...prev, meeting_link: event.target.value }))} fullWidth placeholder="Paste meeting URL later" /></Grid>
              </Grid>
            )}

            <FormControlLabel control={<Switch checked={Boolean(collectionItemForm.is_required)} onChange={(event) => setCollectionItemForm((prev) => ({ ...prev, is_required: event.target.checked }))} />} label={collectionItemForm.is_required ? "Required item" : "Optional item"} />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setCollectionItemDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveCollectionItem}>Save item</Button></DialogActions>
      </Dialog>

      <Drawer anchor="right" open={Boolean(resourceDetail)} onClose={() => setResourceDetail(null)}>
        <Box sx={{ width: { xs: "100vw", sm: 460 }, p: 2.5 }}>
          {resourceDetail && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900, letterSpacing: 1 }}>
                    Learning resource
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 950, ...lineClampSx(2) }}>
                    {resourceDetail.title}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={resourceStatusLabel(resourceDetail)} {...readableChipProps(theme, resourceStatusTone(resourceDetail))} />
                    <Chip size="small" label={formatAssetType(resourceDetail.asset?.asset_type)} {...readableChipProps(theme, "neutral")} />
                    {resourceDetail.category && <Chip size="small" label={resourceDetail.category} {...readableChipProps(theme, "primary")} />}
                  </Stack>
                </Box>
                <IconButton onClick={() => setResourceDetail(null)}><CloseIcon /></IconButton>
              </Stack>

              <Card variant="outlined" sx={{ borderRadius: 1 }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.75 }}>Resource details</Typography>
                  <Stack spacing={0.85}>
                    <Typography variant="body2" color="text.secondary" sx={lineClampSx(4)}>
                      {resourceDetail.description || "No description added."}
                    </Typography>
                    <Divider />
                    {[
                      ["Asset", resourceDetail.asset?.title || "Not set"],
                      ["Asset type", formatAssetType(resourceDetail.asset?.asset_type)],
                      ["File / source", resourceDetail.asset?.file_name || deriveVideoSource(resourceDetail.asset?.external_url) || "Not set"],
                      ["Shared by", resourceDetail.shared_by || "Unknown"],
                      ["Shared date", formatTrainingDate(resourceDetail.shared_date || resourceDetail.created_at)],
                      ["Last updated", formatTrainingDate(resourceDetail.updated_at)],
                    ].map(([label, value]) => (
                      <Stack key={label} direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
                        <Typography variant="body2" sx={{ textAlign: "right", maxWidth: "68%", ...lineClampSx(2) }}>{value}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 1 }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.75 }}>Delivery visibility</Typography>
                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    {[
                      ["Audience employees", resourceDetail.targeted_employee_count || 0, "primary"],
                      ["Viewed", resourceDetail.viewed_employee_count || 0, "success"],
                      ["Unread", resourceDetail.unread_employee_count || 0, "warning"],
                    ].map(([label, value, tone]) => (
                      <Grid item xs={4} key={label}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: alpha(theme.palette[tone]?.main || theme.palette.primary.main, 0.08), border: `1px solid ${alpha(theme.palette[tone]?.main || theme.palette.primary.main, 0.18)}` }}>
                          <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1 }}>{value}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  <Divider sx={{ mb: 1.25 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.75 }}>Audience</Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={`${resourceDetail.audience_counts?.departments || 0} department(s)`} {...readableChipProps(theme, "success")} />
                      <Chip size="small" label={`${resourceDetail.audience_counts?.employees || 0} employee(s)`} {...readableChipProps(theme, "info")} />
                    </Stack>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>Departments</Typography>
                      {(resourceDetail.departments || []).length ? (
                        <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                          {resourceDetail.departments.map((department) => <Chip key={department.id} size="small" label={department.name} variant="outlined" />)}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No department audience.</Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>Individual employees</Typography>
                      {(resourceDetail.employees || []).length ? (
                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                          {resourceDetail.employees.map((employee) => (
                            <Typography key={employee.id} variant="body2">
                              {employee.name || employee.email}
                              <Typography component="span" variant="caption" color="text.secondary"> · {employee.department_name || "Unassigned"}</Typography>
                            </Typography>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No individual employee audience.</Typography>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={() => { openEditResource(resourceDetail); setResourceDetail(null); }} startIcon={<EditIcon />}>Edit</Button>
                <Button variant="outlined" onClick={() => setResourceDetail(null)}>Close</Button>
              </Stack>
            </Stack>
          )}
        </Box>
      </Drawer>

      <Drawer anchor="right" open={helpDrawerOpen} onClose={() => setHelpDrawerOpen(false)}>
        <Box sx={{ width: { xs: "100vw", sm: 420 }, p: 2.5 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Training help</Typography>
                <Typography variant="body2" color="text.secondary">Build content, group it, then assign it.</Typography>
              </Box>
              <IconButton onClick={() => setHelpDrawerOpen(false)}><CloseIcon /></IconButton>
            </Stack>
            <Alert severity="info" variant="outlined" sx={{ py: 0.75 }}>
              Categories organize content. Collections group reusable content. Training Sets are what you assign.
            </Alert>
            {[
              ["1. Build your content", "Create external videos and documents in Library. Create reusable quizzes in Quizzes."],
              ["2. Organize content", "Use Categories to label content by team, location, policy, or workflow."],
              ["3. Reuse content", "Create Collections when several videos, documents, and quizzes belong together."],
              ["4. Build assignable programs", "Create Training Sets and add individual items or copy a Collection into the set."],
              ["5. Assign training", "Assign Training Sets to departments or individual employees."],
              ["6. Employee completion", "Employees complete assigned items from My Training. Status stays Not started, In progress, or Completed."],
            ].map(([title, body]) => (
              <Box key={title}>
                <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary">{body}</Typography>
              </Box>
            ))}
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>Real-life example</Typography>
              <Typography variant="body2" color="text.secondary">
                For new hires, create a “New Hire” category, add a welcome video, safety PDF, and HR quiz, group them in a “New Hire Basics” collection, copy that collection into an “Onboarding Week 1” Training Set, then assign the set to the New Employees department.
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>Document uploads</Typography>
              <Typography variant="body2" color="text.secondary">
                Supported: {documentAllowedLabel}. Maximum size: {documentMaxLabel}. Documents stay private and download through Schedulaa access controls.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>Important notes</Typography>
              <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                <Typography variant="body2" color="text.secondary">Hosted video upload is visible for future plans but disabled for this release.</Typography>
                <Typography variant="body2" color="text.secondary">Collections copy into Training Sets. They do not stay linked after copying.</Typography>
                <Typography variant="body2" color="text.secondary">Archive library assets instead of hard-deleting them, so existing training history stays readable.</Typography>
                <Typography variant="body2" color="text.secondary">Live session items are placeholders only; no attendance workflow is active.</Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Training;
