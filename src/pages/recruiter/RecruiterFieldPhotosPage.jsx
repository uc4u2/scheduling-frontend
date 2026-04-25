import React, { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Pagination,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { useLocation, useNavigate } from "react-router-dom";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";
import ManagementFrame from "../../components/ui/ManagementFrame";
import api from "../../utils/api";

const lineClampSx = (lines = 2) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const readableChipProps = (theme, tone = "neutral") => {
  const palette = {
    primary: theme.palette.primary,
    success: theme.palette.success,
    warning: theme.palette.warning,
    error: theme.palette.error,
    info: theme.palette.info,
  }[tone];
  if (!palette) {
    return {
      variant: "outlined",
      sx: {
        color: theme.palette.text.primary,
        borderColor: alpha(theme.palette.text.primary, 0.18),
        bgcolor: alpha(theme.palette.text.primary, 0.055),
        fontWeight: 850,
      },
    };
  }
  return {
    variant: "outlined",
    sx: {
      color: palette.dark,
      borderColor: alpha(palette.main, 0.34),
      bgcolor: alpha(palette.main, 0.12),
      fontWeight: 850,
    },
  };
};

const fileStatusTone = (row) => {
  const status = String(row?.scan_status || row?.download_status || "").toLowerCase();
  if (status === "clean" || status === "ready" || row?.is_download_ready) return "success";
  if (status === "blocked") return "error";
  return "warning";
};

const fileIsWaitingForScan = (row) => {
  const status = String(row?.scan_status || row?.download_status || "").toLowerCase();
  return status === "pending" || status === "scanning" || status === "processing";
};

const formatBytes = (value) => {
  const size = Number(value || 0);
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const shiftLabel = (row) => {
  const shift = row?.shift || {};
  if (!shift.date) return "Shift";
  const time = shift.start_time ? ` · ${shift.start_time}${shift.end_time ? `-${shift.end_time}` : ""}` : "";
  return `${formatDate(shift.date)}${time}`;
};

const parseShiftDateTime = (shift, time) => {
  if (!shift?.date || !time) return null;
  const parsed = new Date(`${shift.date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const uploadTimingLabel = (row) => {
  const shift = row?.shift || {};
  const uploaded = row?.created_at ? new Date(row.created_at) : null;
  const start = parseShiftDateTime(shift, shift.start_time);
  let end = parseShiftDateTime(shift, shift.end_time);
  if (!uploaded || Number.isNaN(uploaded.getTime()) || !shift.date) return "Shift-linked";
  if (!start || !end) {
    const uploadDate = uploaded.toISOString().slice(0, 10);
    return uploadDate === shift.date ? "Uploaded on shift date" : "Uploaded outside shift";
  }
  if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  return uploaded >= start && uploaded <= end ? "Uploaded during shift" : "Uploaded outside shift";
};

const uploadTimingTone = (label) => {
  if (label === "Uploaded during shift" || label === "Uploaded on shift date") return "success";
  if (label === "Uploaded outside shift") return "warning";
  return "neutral";
};

const sessionKeyForPhoto = (row) => {
  const shift = row?.shift || {};
  const shiftKey = row?.related_shift_log_id
    ? `log-${row.related_shift_log_id}`
    : row?.related_shift_id
    ? `appointment-${row.related_shift_id}`
    : shift?.id
    ? `${shift.type || "shift"}-${shift.id}`
    : `date-${shift.date || "unknown"}-${shift.start_time || ""}-${shift.end_time || ""}`;
  return `${row?.uploaded_by_employee_id || row?.uploaded_by || "employee"}::${shiftKey}`;
};

const buildPhotoGroups = (items = []) => {
  const map = new Map();
  items.forEach((row) => {
    const key = sessionKeyForPhoto(row);
    if (!map.has(key)) {
      map.set(key, {
        key,
        primary: row,
        photos: [],
        totalSize: 0,
        readyCount: 0,
        waitingCount: 0,
        blockedCount: 0,
        latestAt: row.created_at,
      });
    }
    const group = map.get(key);
    group.photos.push(row);
    group.totalSize += Number(row.file_size || 0);
    if (row.is_download_ready) group.readyCount += 1;
    if (fileIsWaitingForScan(row)) group.waitingCount += 1;
    if (String(row.scan_status || "").toLowerCase() === "blocked") group.blockedCount += 1;
    if (new Date(row.created_at || 0).getTime() > new Date(group.latestAt || 0).getTime()) {
      group.latestAt = row.created_at;
      group.primary = row;
    }
  });
  return Array.from(map.values())
    .map((group) => ({
      ...group,
      photos: [...group.photos].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()),
    }))
    .sort((a, b) => new Date(b.latestAt || 0).getTime() - new Date(a.latestAt || 0).getTime());
};

const EmployeePhotoCard = ({ group, previewUrl, onOpen, onDelete, loading }) => {
  const theme = useTheme();
  const row = group.primary;
  const photoCount = group.photos.length;
  const waiting = group.waitingCount > 0;
  const blocked = group.blockedCount > 0;
  const timingLabel = uploadTimingLabel(row);
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 1,
        borderColor: alpha(theme.palette.primary.main, 0.16),
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 0.96)})`,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.1}>
          <Stack direction="row" spacing={1.1} alignItems="flex-start">
            <Box
              onClick={() => onOpen(group, row)}
              sx={{
                width: 108,
                height: 108,
                borderRadius: 1,
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.dark,
                position: "relative",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {previewUrl ? (
                <Box component="img" src={previewUrl} alt={row.file_name || "Field photo"} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <PhotoCameraIcon />
              )}
              {photoCount > 1 && (
                <Chip
                  size="small"
                  label={`${photoCount} photos`}
                  sx={{
                    position: "absolute",
                    right: 6,
                    bottom: 6,
                    fontWeight: 900,
                    bgcolor: alpha(theme.palette.common.black, 0.72),
                    color: theme.palette.common.white,
                  }}
                />
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 950, ...lineClampSx(1) }}>{shiftLabel(row)}</Typography>
              <Typography variant="body2" color="text.secondary">Latest upload {formatDateTime(group.latestAt)}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={blocked ? "Blocked" : waiting ? "Security check in progress" : "Ready"}
              {...readableChipProps(theme, blocked ? "error" : waiting ? "warning" : "success")}
            />
            {row.location?.label && <Chip size="small" label={row.location.label} {...readableChipProps(theme, row.location.has_location ? "success" : "neutral")} />}
            <Chip size="small" label={timingLabel} {...readableChipProps(theme, uploadTimingTone(timingLabel))} />
            {photoCount > 1 && <Chip size="small" label={`${photoCount} photos`} {...readableChipProps(theme, "info")} />}
            {group.totalSize ? <Chip size="small" label={formatBytes(group.totalSize)} {...readableChipProps(theme, "neutral")} /> : null}
          </Stack>
          {photoCount > 1 && (
            <Typography variant="caption" color="text.secondary">
              {group.readyCount} ready · {group.waitingCount} in security check · {group.blockedCount} blocked
            </Typography>
          )}
          {row.note && <Typography variant="body2" color="text.secondary" sx={lineClampSx(2)}>{row.note}</Typography>}
          {!row.is_download_ready && photoCount === 1 && (
            <Alert severity={String(row.scan_status || "").toLowerCase() === "blocked" ? "error" : "info"} variant="outlined" sx={{ py: 0.25 }}>
              {String(row.scan_status || "").toLowerCase() === "blocked"
                ? "This photo was blocked. Please upload another photo or contact your manager."
                : "Security check in progress."}
            </Alert>
          )}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              disabled={loading === group.key}
              onClick={() => onOpen(group, row)}
              sx={{ fontWeight: 900 }}
            >
              Open
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<DeleteIcon />}
              disabled={loading === group.key}
              onClick={() => onDelete(group)}
              sx={{ fontWeight: 900 }}
            >
              {photoCount > 1 ? "Delete session" : "Delete"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const EmployeeGalleryDialog = ({ rows, selectedId, previewUrls, onClose, onSelect, onDelete, deleting }) => {
  const theme = useTheme();
  const index = rows.findIndex((row) => row.id === selectedId);
  const row = index >= 0 ? rows[index] : null;
  useEffect(() => {
    if (!row) return undefined;
    const handler = (event) => {
      if (event.key === "ArrowLeft" && index > 0) onSelect(rows[index - 1].id);
      if (event.key === "ArrowRight" && index < rows.length - 1) onSelect(rows[index + 1].id);
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, onClose, onSelect, row, rows]);
  if (!row) return null;
  const previewUrl = previewUrls[row.id] || "";
  const timingLabel = uploadTimingLabel(row);
  return (
    <Dialog open={Boolean(row)} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Field Photo
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                minHeight: { xs: 280, md: 520 },
                borderRadius: 1,
                bgcolor: alpha(theme.palette.common.black, 0.055),
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
              }}
            >
              {row.is_download_ready && previewUrl ? (
                <Box component="img" src={previewUrl} alt={row.file_name || "Field photo"} sx={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />
              ) : (
                <Stack spacing={1} alignItems="center">
                  <PhotoCameraIcon />
                  <Typography sx={{ fontWeight: 900 }}>{row.security_status_label || (row.is_download_ready ? "Ready" : "Security check in progress")}</Typography>
                </Stack>
              )}
            </Box>
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
              <Button disabled={index <= 0} startIcon={<NavigateBeforeIcon />} onClick={() => onSelect(rows[index - 1].id)}>Previous</Button>
              <Typography variant="caption" color="text.secondary">{index + 1} of {rows.length}</Typography>
              <Button disabled={index >= rows.length - 1} endIcon={<NavigateNextIcon />} onClick={() => onSelect(rows[index + 1].id)}>Next</Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={1.25}>
              <Chip size="small" label={row.security_status_label || (row.is_download_ready ? "Ready" : "Security check in progress")} {...readableChipProps(theme, fileStatusTone(row))} sx={{ alignSelf: "flex-start", ...readableChipProps(theme, fileStatusTone(row)).sx }} />
              <Typography variant="h6" sx={{ fontWeight: 950 }}>Schedulaa</Typography>
              <Typography variant="body2" color="text.secondary">{shiftLabel(row)}</Typography>
              <Chip size="small" label={timingLabel} {...readableChipProps(theme, uploadTimingTone(timingLabel))} sx={{ alignSelf: "flex-start", ...readableChipProps(theme, uploadTimingTone(timingLabel)).sx }} />
              <Typography variant="body2" color="text.secondary">Uploaded {formatDateTime(row.created_at)}</Typography>
              <Typography variant="body2" color="text.secondary">{row.file_name || row.original_filename} · {formatBytes(row.file_size)}</Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<DownloadIcon />} disabled={!row.is_download_ready} onClick={() => row.is_download_ready && window.open(previewUrl, "_blank", "noopener,noreferrer")}>
                  Download
                </Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={deleting} onClick={() => onDelete(row)}>
                  Delete
                </Button>
              </Stack>
              <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.4 }}>
                  Photo location
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.location?.label || "Location not available"}</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

const RecruiterFieldPhotosPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [previewUrls, setPreviewUrls] = useState({});
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const role = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";
  const managerViewingEmployee = role === "manager" && location.pathname.startsWith("/employee");
  const photoGroups = buildPhotoGroups(rows);
  const selectedGalleryRows = selectedGroupKey
    ? photoGroups.find((group) => group.key === selectedGroupKey)?.photos || []
    : [];

  const loadPhotos = (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    api.get("/employee/field-photos", { params: { page, page_size: 12 } })
      .then((res) => {
        setRows(res.data?.items || []);
        setPagination(res.data?.pagination || null);
        setSummary(res.data?.summary || null);
      })
      .catch((err) => {
        if (!silent) setError(err?.response?.data?.error || "Unable to load Field Photos.");
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => loadPhotos(), [page]);

  useEffect(() => {
    if (!rows.some((row) => ["pending", "scanning"].includes(String(row.scan_status || "").toLowerCase()))) return undefined;
    const timer = window.setTimeout(() => loadPhotos(true), 8000);
    return () => window.clearTimeout(timer);
  }, [rows]);

  const handleLocalTabChange = (value) => {
    const basePath = location.pathname.startsWith("/recruiter") ? "/recruiter/dashboard" : "/employee/dashboard";
    navigate(`${basePath}?tab=${value}`);
  };

  const ensurePreviewUrl = async (row) => {
    if (!row?.id || previewUrls[row.id] || !row.is_download_ready) return previewUrls[row.id] || "";
    const result = (await api.get(`/employee/field-photos/${row.id}/download`)).data;
    if (result?.url) {
      setPreviewUrls((prev) => ({ ...prev, [row.id]: result.url }));
      return result.url;
    }
    return "";
  };

  const openPhoto = async (group, row) => {
    if (!row.is_download_ready) {
      setError(String(row.scan_status || "").toLowerCase() === "blocked"
        ? "This photo was blocked. Please upload another photo or contact your manager."
        : "Security check in progress. Available after scan completes.");
      return;
    }
    setActionLoading(group.key);
    setError("");
    try {
      await ensurePreviewUrl(row);
      setSelectedGroupKey(group.key);
      setSelectedPhotoId(row.id);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to open this photo.");
    } finally {
      setActionLoading(null);
    }
  };

  const deletePhoto = async (target) => {
    const rowsToDelete = Array.isArray(target?.photos) ? target.photos : [target];
    const confirmMessage = rowsToDelete.length > 1
      ? `Delete all ${rowsToDelete.length} photos from this upload session?`
      : "Delete this photo? You can upload another photo from the shift card if needed.";
    if (!window.confirm(confirmMessage)) return;
    setActionLoading(target.key || target.id);
    setError("");
    try {
      await Promise.all(rowsToDelete.map((row) => api.delete(`/employee/field-photos/${row.id}`)));
      if (selectedPhotoId && rowsToDelete.some((row) => row.id === selectedPhotoId)) {
        setSelectedPhotoId(null);
        setSelectedGroupKey("");
      }
      loadPhotos(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to delete photo.");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    const primaries = photoGroups
      .map((group) => group.primary)
      .filter((row) => row?.is_download_ready && !previewUrls[row.id]);
    if (!primaries.length) return;
    let cancelled = false;
    (async () => {
      for (const row of primaries.slice(0, 6)) {
        try {
          const result = (await api.get(`/employee/field-photos/${row.id}/download`)).data;
          if (!cancelled && result?.url) {
            setPreviewUrls((prev) => (prev[row.id] ? prev : { ...prev, [row.id]: result.url }));
          }
        } catch {
          // Keep cards usable even if preview fetch fails.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoGroups]);

  useEffect(() => {
    const current = selectedGalleryRows.find((row) => row.id === selectedPhotoId);
    if (!current || !current.is_download_ready || previewUrls[current.id]) return;
    ensurePreviewUrl(current).catch(() => {});
  }, [selectedGalleryRows, selectedPhotoId, previewUrls]);

  return (
    <ManagementFrame
      title="Field Photos"
      subtitle="Your shift-linked proof-of-work photos."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      contentVariant={false}
    >
      <RecruiterTabs
        localTab="field-photos"
        onLocalTabChange={handleLocalTabChange}
        allowHrAccess={allowHrAccess}
        isLoading={isLoading}
      />
      <Stack spacing={2} sx={{ mt: 2, maxWidth: 1480, mx: "auto", width: "100%" }}>
        {managerViewingEmployee && (
          <Alert severity="info" action={<Button color="inherit" size="small" onClick={() => navigate("/manager/dashboard")}>Back to Manager</Button>}>
            Viewing Employee Workspace (Manager Mode)
          </Alert>
        )}
        <Alert severity="info" variant="outlined" action={<Button size="small" color="inherit" onClick={() => navigate("/recruiter/my-time")}>Open My Time</Button>}>
          Upload photos from your shift cards in My Time.
        </Alert>
        {summary && !summary.addon_active && !summary.read_only && (
          <Alert severity="info" variant="outlined">Field Photos is not active for this company.</Alert>
        )}
        {summary?.read_only && (
          <Alert severity="warning" variant="outlined">Photo uploads are currently unavailable. Please contact your manager.</Alert>
        )}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={20} /><Typography color="text.secondary">Loading field photos...</Typography></Stack>
        ) : rows.length ? (
          <Stack spacing={1.5}>
            <Grid container spacing={1.5}>
              {photoGroups.map((group) => (
                <Grid item xs={12} md={6} lg={4} key={group.key}>
                  <EmployeePhotoCard
                    group={group}
                    previewUrl={previewUrls[group.primary.id] || ""}
                    onOpen={openPhoto}
                    onDelete={deletePhoto}
                    loading={actionLoading}
                  />
                </Grid>
              ))}
            </Grid>
            {pagination?.total_pages > 1 && (
              <Stack direction="row" justifyContent="flex-end">
                <Pagination size="small" page={page} count={pagination.total_pages} onChange={(_, nextPage) => setPage(nextPage)} />
              </Stack>
            )}
          </Stack>
        ) : (
          <Card variant="outlined" sx={{ borderRadius: 1, borderColor: alpha(theme.palette.primary.main, 0.14) }}>
            <CardContent sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>No field photos uploaded yet.</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Use Upload Photos from an eligible shift in My Time.</Typography>
            </CardContent>
          </Card>
        )}
        <EmployeeGalleryDialog
          rows={selectedGalleryRows}
          selectedId={selectedPhotoId}
          previewUrls={previewUrls}
          onClose={() => {
            setSelectedPhotoId(null);
            setSelectedGroupKey("");
          }}
          onSelect={setSelectedPhotoId}
          onDelete={deletePhoto}
          deleting={Boolean(actionLoading)}
        />
      </Stack>
    </ManagementFrame>
  );
};

export default RecruiterFieldPhotosPage;
