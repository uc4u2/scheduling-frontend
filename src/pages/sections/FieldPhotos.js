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
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import ArchiveIcon from "@mui/icons-material/Archive";
import ArticleIcon from "@mui/icons-material/Article";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import MapIcon from "@mui/icons-material/Map";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestoreIcon from "@mui/icons-material/Restore";
import { useLocation, useNavigate } from "react-router-dom";
import FieldPhotosBillingModal from "../../components/billing/FieldPhotosBillingModal";
import ManagementFrame from "../../components/ui/ManagementFrame";
import api from "../../utils/api";

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

const formatBytes = (value) => {
  const size = Number(value || 0);
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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

const lineClampSx = (lines = 2) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const fileIsWaitingForScan = (file) => {
  if (!file) return false;
  const status = String(file.scan_status || file.download_status || "").toLowerCase();
  return status === "pending" || status === "scanning" || status === "processing";
};

const fileStatusTone = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "clean" || value === "ready") return "success";
  if (value === "blocked") return "error";
  return "warning";
};

const storagePercent = (summary) => {
  const quota = Number(summary?.storage_quota_bytes || 0);
  const used = Number(summary?.storage_used_bytes || 0);
  if (!quota) return 0;
  return Math.min(100, Math.round((used / quota) * 100));
};

const statusLabel = (row) => row?.security_status_label || (row?.is_download_ready ? "Ready" : fileIsWaitingForScan(row) ? "Security check in progress" : "Blocked");

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
  return Array.from(map.values());
};

const shiftLabel = (row) => {
  const shift = row?.shift || {};
  if (!shift.date) return "Shift";
  const time = shift.start_time ? ` · ${shift.start_time}${shift.end_time ? `-${shift.end_time}` : ""}` : "";
  return `${formatDate(shift.date)}${time}`;
};

const RowsPerPageSelect = ({ value, onChange }) => (
  <FormControl size="small" sx={{ minWidth: 118 }}>
    <InputLabel>Rows</InputLabel>
    <Select label="Rows" value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {[10, 12, 20, 50].map((size) => <MenuItem key={size} value={size}>{size} rows</MenuItem>)}
    </Select>
  </FormControl>
);

const PaginationBar = ({ pagination, onChange }) => {
  if (!pagination || Number(pagination.total || 0) <= Number(pagination.page_size || 20)) return null;
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" justifyContent="space-between">
      <Typography variant="caption" color="text.secondary">
        Showing page {pagination.page || 1} of {pagination.total_pages || 1} · {pagination.total || 0} total
      </Typography>
      <Pagination
        size="small"
        count={Math.max(1, Number(pagination.total_pages || 1))}
        page={Number(pagination.page || 1)}
        onChange={(_, page) => onChange(page)}
      />
    </Stack>
  );
};

const FieldPhotoCard = ({ group, previewUrl, onOpen, onArchive, onDelete, onDownload }) => {
  const theme = useTheme();
  const row = group?.primary || group;
  const photos = group?.photos || [row];
  const photoCount = photos.length;
  const waiting = fileIsWaitingForScan(row);
  const hasBlocked = group?.blockedCount > 0 || String(row.scan_status || "").toLowerCase() === "blocked";
  const hasWaiting = group?.waitingCount > 0 || waiting;
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 1,
        height: "100%",
        borderColor: alpha(theme.palette.primary.main, 0.14),
        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.055)}, ${alpha(theme.palette.background.paper, 0.96)})`,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.15}>
          <Stack direction="row" spacing={1.1} alignItems="flex-start">
            <Box
              role="button"
              tabIndex={0}
              onClick={() => onOpen(row)}
              onKeyDown={(event) => { if (event.key === "Enter") onOpen(row); }}
              sx={{
                width: { xs: 104, sm: 120 },
                height: { xs: 104, sm: 120 },
                borderRadius: 1,
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.palette.info.main, 0.13),
                color: theme.palette.info.dark,
                cursor: "pointer",
                position: "relative",
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
              <Typography variant="subtitle1" sx={{ fontWeight: 950, ...lineClampSx(1) }}>
                {row.uploaded_by || "Employee photo"}
              </Typography>
              <Typography variant="body2" color="text.secondary">{shiftLabel(row)}</Typography>
              {row.department?.name && <Typography variant="caption" color="text.secondary">{row.department.name}</Typography>}
            </Box>
            <Stack direction="row" spacing={0.25}>
              <Tooltip title="Download">
                <span>
                  <IconButton size="small" disabled={!row.is_download_ready} onClick={() => onDownload(row)}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={photoCount > 1 ? "Archive first photo" : row.is_archived ? "Restore" : "Archive"}>
                <IconButton size="small" onClick={() => onArchive(row)}>
                  {row.is_archived ? <RestoreIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title={photoCount > 1 ? "Delete first photo" : "Delete"}>
                <IconButton size="small" color="error" onClick={() => onDelete(row)}><DeleteIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              icon={waiting ? <CircularProgress size={12} thickness={5} color="inherit" /> : undefined}
              label={hasBlocked ? "Blocked" : hasWaiting ? "Security check in progress" : "Ready"}
              {...readableChipProps(theme, hasBlocked ? "error" : hasWaiting ? "warning" : "success")}
            />
            {row.location?.label && <Chip size="small" label={row.location.label} {...readableChipProps(theme, row.location.has_location ? "success" : "neutral")} />}
            {photoCount > 1 ? <Chip size="small" label={`${photoCount} photos`} {...readableChipProps(theme, "info")} /> : null}
            {group?.totalSize || row.file_size ? <Chip size="small" label={formatBytes(group?.totalSize || row.file_size)} {...readableChipProps(theme, "neutral")} /> : null}
            {row.is_archived ? <Chip size="small" label="Archived" {...readableChipProps(theme, "neutral")} /> : null}
          </Stack>
          {row.note && <Typography variant="body2" color="text.secondary" sx={lineClampSx(2)}>{row.note}</Typography>}
          <Typography variant="caption" color="text.secondary">
            {photoCount > 1 ? `Latest upload ${formatDateTime(group.latestAt)}` : `Uploaded ${formatDateTime(row.created_at)}`}
          </Typography>
          {hasWaiting && <Alert severity="info" sx={{ py: 0.3 }}>Uploaded. Security check in progress.</Alert>}
          {hasBlocked && (
            <Alert severity="error" sx={{ py: 0.3 }}>
              Blocked by security check. Ask the employee to upload another photo or remove this one.
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const LocationBlock = ({ title, location }) => {
  if (!location) return null;
  return (
    <Stack spacing={0.35}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</Typography>
      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>{location.label || "Location not available"}</Typography>
        {location.accuracy_m != null && <Typography variant="caption" color="text.secondary">±{Math.round(Number(location.accuracy_m))}m</Typography>}
        {location.captured_at && <Typography variant="caption" color="text.secondary">{formatDateTime(location.captured_at)}</Typography>}
        {location.maps_url && (
          <Button size="small" variant="text" startIcon={<MapIcon />} onClick={() => window.open(location.maps_url, "_blank", "noopener,noreferrer")}>
            Map
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

const GalleryDialog = ({ rows, selectedId, previewUrls, onClose, onSelect, onDownload }) => {
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
                minHeight: { xs: 280, md: 560 },
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
                  <Typography sx={{ fontWeight: 900 }}>{statusLabel(row)}</Typography>
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
              <Chip size="small" label={statusLabel(row)} {...readableChipProps(theme, fileStatusTone(row.scan_status))} sx={{ alignSelf: "flex-start", ...readableChipProps(theme, fileStatusTone(row.scan_status)).sx }} />
              <Typography variant="h6" sx={{ fontWeight: 950 }}>{row.uploaded_by || "Employee photo"}</Typography>
              <Typography variant="body2" color="text.secondary">{shiftLabel(row)}</Typography>
              {row.note && <Typography variant="body2">{row.note}</Typography>}
              <Typography variant="body2" color="text.secondary">Uploaded {formatDateTime(row.created_at)}</Typography>
              <Typography variant="body2" color="text.secondary">{row.file_name || row.original_filename} · {formatBytes(row.file_size)}</Typography>
              {String(row.scan_status || "").toLowerCase() === "blocked" && (
                <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
                  Blocked by security check. Ask the employee to upload another photo or remove this one.
                </Alert>
              )}
              <Button variant="outlined" startIcon={<DownloadIcon />} disabled={!row.is_download_ready} onClick={() => onDownload(row)} sx={{ alignSelf: "flex-start" }}>
                Download
              </Button>
              <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 1 }}>
                <Stack spacing={1}>
                  <LocationBlock title="Photo location" location={row.location} />
                  <LocationBlock title="Clock-in location" location={row.shift_location?.clock_in} />
                  <LocationBlock title="Clock-out location" location={row.shift_location?.clock_out} />
                </Stack>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

const FieldPhotos = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const initialParams = new URLSearchParams(location.search);
  const [data, setData] = useState({ items: [], context: {}, summary: {} });
  const [billingStatus, setBillingStatus] = useState(null);
  const [previewUrls, setPreviewUrls] = useState({});
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [selectedPhotoGroupKey, setSelectedPhotoGroupKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [billingModal, setBillingModal] = useState(null);
  const [search, setSearch] = useState("");
  const [readiness, setReadiness] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [period, setPeriod] = useState("30");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [archived, setArchived] = useState("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [shiftId, setShiftId] = useState(initialParams.get("shift_id") || "");

  const summary = data.summary || billingStatus?.field_photos || {};
  const visible = Boolean(summary.addon_active || summary.read_only);
  const rows = data.items || [];
  const photoGroups = useMemo(() => buildPhotoGroups(rows), [rows]);
  const selectedGalleryRows = useMemo(() => {
    if (!selectedPhotoGroupKey) return rows;
    return photoGroups.find((group) => group.key === selectedPhotoGroupKey)?.photos || rows;
  }, [photoGroups, rows, selectedPhotoGroupKey]);
  const departments = data.context?.departments || [];
  const employees = data.context?.employees || [];

  const dateRange = useMemo(() => {
    if (period === "custom") return { start_date: startDate || undefined, end_date: endDate || undefined };
    if (!period) return {};
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - Number(period || 30));
    const toYmd = (date) => date.toISOString().slice(0, 10);
    return { start_date: toYmd(start), end_date: toYmd(end) };
  }, [endDate, period, startDate]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const [billingRes, photosRes] = await Promise.all([
        api.get("/billing/status"),
        api.get("/manager/field-photos", {
          params: {
            page,
            page_size: pageSize,
            status: readiness || undefined,
            location_status: locationStatus || undefined,
            department_id: departmentId || undefined,
            employee_id: employeeId || undefined,
            search: search || undefined,
            shift_id: shiftId || undefined,
            archived: archived === "archived" ? "true" : undefined,
            ...dateRange,
          },
        }),
      ]);
      setBillingStatus(billingRes.data || null);
      setData(photosRes.data || { items: [], context: {}, summary: {} });
    } catch (err) {
      if (!silent) setError(err?.response?.data?.error || "Unable to load Field Photos.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page, pageSize, readiness, locationStatus, departmentId, employeeId, archived, shiftId, dateRange.start_date, dateRange.end_date]);

  useEffect(() => {
    rows.forEach((row) => {
      if (!row?.id || !row.is_download_ready || previewUrls[row.id]) return;
      api.get(`/manager/field-photos/${row.id}/download`)
        .then((res) => {
          const url = res?.data?.url;
          if (url) setPreviewUrls((prev) => ({ ...prev, [row.id]: url }));
        })
        .catch(() => {});
    });
  }, [rows, previewUrls]);

  useEffect(() => {
    if (!rows.some((row) => fileIsWaitingForScan(row))) return undefined;
    const timer = window.setTimeout(() => loadData(true), 8000);
    return () => window.clearTimeout(timer);
  }, [rows]);

  const resetPage = () => setPage(1);

  const handleBillingSuccess = (nextStatus, message) => {
    setBillingStatus(nextStatus || null);
    setSuccess(message);
    setBillingModal(null);
    loadData(true);
  };

  const downloadPhoto = async (row) => {
    try {
      const res = await api.get(`/manager/field-photos/${row.id}/download`);
      const url = res?.data?.url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err?.response?.data?.error || "Photo is not available yet.");
    }
  };

  const archivePhoto = async (row) => {
    try {
      await api.post(`/manager/field-photos/${row.id}/archive`, { archived: !row.is_archived });
      setSuccess(row.is_archived ? "Photo restored." : "Photo archived.");
      loadData(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to update photo.");
    }
  };

  const deletePhoto = async (row) => {
    if (!window.confirm("Delete this field photo? This removes the row and stored image.")) return;
    try {
      await api.delete(`/manager/field-photos/${row.id}`);
      setSuccess("Photo deleted.");
      resetPage();
      loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to delete photo.");
    }
  };

  const clearShiftFilter = () => {
    setShiftId("");
    setPage(1);
    navigate("/manager/field-photos", { replace: true });
  };

  return (
    <ManagementFrame fullWidth contentVariant={false} sx={{ px: { xs: 1, md: 2 } }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-0.02em" }}>Field Photos</Typography>
            <Typography variant="body2" color="text.secondary">Review shift-linked proof-of-work photos from your team.</Typography>
          </Box>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", md: "flex-end" }}>
            <Chip label={`Storage used: ${storagePercent(summary)}%`} {...readableChipProps(theme, "primary")} />
            <Chip label={`Sessions: ${photoGroups.length}`} {...readableChipProps(theme, "info")} />
            <Chip label={`Photos: ${data.pagination?.total || 0}`} {...readableChipProps(theme, "neutral")} />
            <Chip label={`Security check: ${rows.filter((row) => fileIsWaitingForScan(row)).length}`} {...readableChipProps(theme, "warning")} />
            <Chip label={`Blocked: ${rows.filter((row) => String(row.scan_status || "").toLowerCase() === "blocked").length}`} {...readableChipProps(theme, "error")} />
          </Stack>
        </Stack>

        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>}

        {!visible ? (
          <Card variant="outlined" sx={{ borderRadius: 1, borderColor: alpha(theme.palette.primary.main, 0.18), background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.background.paper, 0.98)})` }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={2} alignItems="flex-start">
                <Box sx={{ width: 46, height: 46, borderRadius: 1, display: "grid", placeItems: "center", bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
                  <PhotoCameraIcon />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 950 }}>Field Photos</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: 680 }}>
                    Let staff upload proof-of-work photos from their phone so managers can review them in one place.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {["Mobile photo upload", "Secure private storage", "Manager review page", "Shift-linked photos"].map((label) => (
                    <Chip key={label} label={label} {...readableChipProps(theme, "primary")} />
                  ))}
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>$29/month</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                  <Button variant="contained" onClick={() => setBillingModal("activate")} startIcon={<AddIcon />}>
                    Activate Field Photos
                  </Button>
                  <Typography variant="body2" color="text.secondary">Need more storage later? You can upgrade anytime.</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <>
            {shiftId && (
              <Alert severity="info" action={<Button size="small" onClick={clearShiftFilter}>Clear</Button>}>
                Showing photos for shift #{shiftId}.
              </Alert>
            )}

            <Card variant="outlined" sx={{ borderRadius: 1 }}>
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Photo storage</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatBytes(summary?.storage_used_bytes)} of {formatBytes(summary?.storage_quota_bytes)} used · Photos are stored for {summary?.retention_days || 90} days.
                      </Typography>
                    </Box>
                    {storagePercent(summary) >= 80 && <Button size="small" variant="outlined" onClick={() => setBillingModal("storage")}>Add 10 GB</Button>}
                  </Stack>
                  <LinearProgress variant="determinate" value={storagePercent(summary)} sx={{ height: 7, borderRadius: 1 }} />
                  {storagePercent(summary) >= 100 && <Alert severity="error">Photo storage is full. New uploads are paused until storage is upgraded or older photos are removed.</Alert>}
                  {storagePercent(summary) >= 80 && storagePercent(summary) < 100 && <Alert severity="warning">You are getting close to your included Field Photos storage.</Alert>}
                  {summary?.read_only && <Alert severity="warning">Field Photos has been cancelled. New uploads are disabled. Existing photos remain available during the read-only grace period.</Alert>}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 1, borderColor: alpha(theme.palette.primary.main, 0.14), background: alpha(theme.palette.background.paper, 0.8) }}>
              <CardContent sx={{ p: 1 }}>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={1} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between">
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} flexWrap="wrap" useFlexGap>
                    <TextField size="small" label="Search" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { resetPage(); loadData(); } }} sx={{ minWidth: 190 }} />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Department</InputLabel>
                      <Select label="Department" value={departmentId} onChange={(event) => { resetPage(); setDepartmentId(event.target.value); setEmployeeId(""); }}>
                        <MenuItem value="">All departments</MenuItem>
                        {departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Employee</InputLabel>
                      <Select label="Employee" value={employeeId} onChange={(event) => { resetPage(); setEmployeeId(event.target.value); }}>
                        <MenuItem value="">All employees</MenuItem>
                        {employees.filter((employee) => !departmentId || String(employee.department_id || "") === String(departmentId)).map((employee) => (
                          <MenuItem key={employee.id} value={employee.id}>{employee.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 145 }}>
                      <InputLabel>Period</InputLabel>
                      <Select label="Period" value={period} onChange={(event) => { resetPage(); setPeriod(event.target.value); }}>
                        <MenuItem value="0">Today</MenuItem>
                        <MenuItem value="7">Last 7 days</MenuItem>
                        <MenuItem value="30">Last 30 days</MenuItem>
                        <MenuItem value="">All dates</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                    {period === "custom" && (
                      <>
                        <TextField size="small" type="date" label="Start" InputLabelProps={{ shrink: true }} value={startDate} onChange={(event) => { resetPage(); setStartDate(event.target.value); }} />
                        <TextField size="small" type="date" label="End" InputLabelProps={{ shrink: true }} value={endDate} onChange={(event) => { resetPage(); setEndDate(event.target.value); }} />
                      </>
                    )}
                    <FormControl size="small" sx={{ minWidth: 165 }}>
                      <InputLabel>Readiness</InputLabel>
                      <Select label="Readiness" value={readiness} onChange={(event) => { resetPage(); setReadiness(event.target.value); }}>
                        <MenuItem value="">All photos</MenuItem>
                        <MenuItem value="pending">Security check in progress</MenuItem>
                        <MenuItem value="scanning">Security check in progress</MenuItem>
                        <MenuItem value="clean">Ready</MenuItem>
                        <MenuItem value="blocked">Blocked</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 170 }}>
                      <InputLabel>Location</InputLabel>
                      <Select label="Location" value={locationStatus} onChange={(event) => { resetPage(); setLocationStatus(event.target.value); }}>
                        <MenuItem value="">All locations</MenuItem>
                        <MenuItem value="captured">Location captured</MenuItem>
                        <MenuItem value="missing">Location missing</MenuItem>
                        <MenuItem value="denied">Permission denied</MenuItem>
                        <MenuItem value="weak_accuracy">Weak GPS accuracy</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 135 }}>
                      <InputLabel>Status</InputLabel>
                      <Select label="Status" value={archived} onChange={(event) => { resetPage(); setArchived(event.target.value); }}>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="archived">Archived</MenuItem>
                      </Select>
                    </FormControl>
                    <RowsPerPageSelect value={pageSize} onChange={(value) => { setPage(1); setPageSize(value); }} />
                  </Stack>
                  <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadData()}>Refresh</Button>
                </Stack>
              </CardContent>
            </Card>

            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={20} /><Typography color="text.secondary">Loading field photos...</Typography></Stack>
            ) : rows.length ? (
              <Stack spacing={1.5}>
                <Grid container spacing={2}>
                  {photoGroups.map((group) => (
                    <Grid key={`field-photo-group-${group.key}`} item xs={12} md={6}>
                      <FieldPhotoCard
                        group={group}
                        previewUrl={previewUrls[group.primary?.id]}
                        onOpen={(photo) => {
                          setSelectedPhotoGroupKey(group.key);
                          setSelectedPhotoId(photo.id);
                        }}
                        onArchive={archivePhoto}
                        onDelete={deletePhoto}
                        onDownload={downloadPhoto}
                      />
                    </Grid>
                  ))}
                </Grid>
                <PaginationBar pagination={data.pagination} onChange={(nextPage) => setPage(nextPage)} />
              </Stack>
            ) : (
              <Card variant="outlined" sx={{ borderRadius: 1 }}>
                <CardContent sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>No field photos yet.</Typography>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Stack>
      <GalleryDialog
        rows={selectedGalleryRows}
        selectedId={selectedPhotoId}
        previewUrls={previewUrls}
        onClose={() => {
          setSelectedPhotoId(null);
          setSelectedPhotoGroupKey("");
        }}
        onSelect={setSelectedPhotoId}
        onDownload={downloadPhoto}
      />
      <FieldPhotosBillingModal
        open={Boolean(billingModal)}
        mode={billingModal || "activate"}
        currentStorageQty={Number(summary?.storage_addon_qty || 0)}
        onClose={() => setBillingModal(null)}
        onSuccess={(nextStatus) => handleBillingSuccess(
          nextStatus,
          billingModal === "storage" ? "Field Photos storage updated." : "Field Photos activated."
        )}
      />
    </ManagementFrame>
  );
};

export default FieldPhotos;
