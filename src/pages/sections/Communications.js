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
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
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
import AnnouncementIcon from "@mui/icons-material/Campaign";
import ArchiveIcon from "@mui/icons-material/Archive";
import ArticleIcon from "@mui/icons-material/Article";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestoreIcon from "@mui/icons-material/Restore";
import SendIcon from "@mui/icons-material/Send";
import ManagementFrame from "../../components/ui/ManagementFrame";
import api from "../../utils/api";

const emptyAnnouncementForm = {
  id: null,
  title: "",
  body: "",
  priority: "normal",
  attachment_file_id: "",
  attachment_file: null,
  department_ids: [],
  employee_ids: [],
  is_published: true,
  is_archived: false,
};

const emptyFileForm = {
  id: null,
  file_id: "",
  file: null,
  title: "",
  description: "",
  category: "",
  department_ids: [],
  employee_ids: [],
  is_published: true,
  is_archived: false,
};

const lineClampSx = (lines = 2) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const formatBytes = (value) => {
  const size = Number(value || 0);
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const compactText = (value, max = 170) => {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
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

const statusTone = (row) => {
  if (row?.is_archived) return "neutral";
  return row?.is_published ? "success" : "warning";
};

const priorityTone = (priority) => ({ urgent: "error", important: "warning", normal: "info" }[priority] || "info");

const fileStatusTone = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "clean") return "success";
  if (value === "blocked") return "error";
  return "warning";
};

const fileName = (file) => file?.file_name || file?.original_filename || "Uploaded file";

const downloadStatusText = (file) => {
  const status = String(file?.download_status || "").toLowerCase();
  if (status === "ready" || file?.is_download_ready) return "Ready";
  if (status === "blocked" || String(file?.scan_status || "").toLowerCase() === "blocked") return "Blocked";
  return "Security check";
};

const fileIsWaitingForScan = (file) => {
  if (!file) return false;
  const status = String(file.scan_status || file.download_status || "").toLowerCase();
  return status === "pending" || status === "scanning" || status === "processing";
};

const FileSummary = ({ file, label = "File" }) => {
  const theme = useTheme();
  if (!file) return null;
  const scanStatus = String(file.scan_status || "").toLowerCase();
  const waitingForScan = fileIsWaitingForScan(file);
  return (
    <Box
      sx={{
        border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
        bgcolor: alpha(theme.palette.background.paper, 0.62),
        borderRadius: 1,
        px: 1,
        py: 0.85,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={0.9} alignItems="center" sx={{ minWidth: 0 }}>
          <ArticleIcon sx={{ fontSize: 18, color: theme.palette.primary.main, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900, ...lineClampSx(1) }}>
              {fileName(file)}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.6} alignItems="center" flexWrap="wrap" justifyContent="flex-end" useFlexGap>
          {file.file_size ? <Chip size="small" label={formatBytes(file.file_size)} {...readableChipProps(theme, "neutral")} /> : null}
          <Chip
            size="small"
            icon={waitingForScan ? <CircularProgress size={12} thickness={5} color="inherit" /> : undefined}
            label={downloadStatusText(file)}
            {...readableChipProps(theme, fileStatusTone(scanStatus))}
          />
        </Stack>
      </Stack>
    </Box>
  );
};

const normaliseContentType = (file) => {
  if (file?.type && file.type !== "application/octet-stream") return file.type;
  const name = String(file?.name || "").toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".txt")) return "text/plain";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  return file?.type || "application/octet-stream";
};

const AudienceSelect = ({ departments, employees, value, onChange }) => {
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = useState("");
  const visibleEmployees = employeeDepartmentFilter
    ? employees.filter((employee) => {
      if (employeeDepartmentFilter === "__unassigned") return !employee.department_id;
      return String(employee.department_id || "") === String(employeeDepartmentFilter);
    })
    : employees;
  const selectedEmployees = employees.filter((employee) => (value.employee_ids || []).some((id) => String(id) === String(employee.id)));
  const employeeOptions = [
    ...visibleEmployees,
    ...selectedEmployees.filter((selected) => !visibleEmployees.some((employee) => String(employee.id) === String(selected.id))),
  ];
  return (
    <Stack spacing={1.25}>
      <FormControl size="small" fullWidth>
        <InputLabel>Departments</InputLabel>
        <Select
          multiple
          label="Departments"
          value={value.department_ids || []}
          onChange={(event) => onChange({ ...value, department_ids: event.target.value })}
          renderValue={(selected) => selected.length ? `${selected.length} department${selected.length === 1 ? "" : "s"}` : "No departments"}
        >
          {departments.map((department) => (
            <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" fullWidth>
        <InputLabel>Filter employees by department</InputLabel>
        <Select
          label="Filter employees by department"
          value={employeeDepartmentFilter}
          onChange={(event) => setEmployeeDepartmentFilter(event.target.value)}
        >
          <MenuItem value="">All employees</MenuItem>
          <MenuItem value="__unassigned">Unassigned</MenuItem>
          {departments.map((department) => (
            <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" fullWidth>
        <InputLabel>Employees</InputLabel>
        <Select
          multiple
          label="Employees"
          value={value.employee_ids || []}
          onChange={(event) => onChange({ ...value, employee_ids: event.target.value })}
          renderValue={(selected) => selected.length ? `${selected.length} employee${selected.length === 1 ? "" : "s"}` : "No employees"}
        >
          {employeeOptions.map((employee) => (
            <MenuItem key={employee.id} value={employee.id}>
              {employee.name || employee.email} {employee.email ? `· ${employee.email}` : ""}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};

const CommunicationCard = ({ type, row, onEdit, onArchive, onView, onDelete }) => {
  const theme = useTheme();
  const isAnnouncement = type === "announcement";
  const title = row.title;
  const description = isAnnouncement ? row.body : row.description;
  const attachedFile = isAnnouncement ? row.attachment_file : row.file;
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 1,
        height: "100%",
        borderColor: alpha(theme.palette.primary.main, 0.14),
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.045)}, ${alpha(theme.palette.background.paper, 0.96)})`,
        boxShadow: `0 16px 44px ${alpha(theme.palette.common.black, 0.055)}`,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1.1} alignItems="flex-start">
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                color: isAnnouncement ? theme.palette.warning.dark : theme.palette.primary.dark,
                bgcolor: alpha(isAnnouncement ? theme.palette.warning.main : theme.palette.primary.main, 0.12),
                flexShrink: 0,
              }}
            >
              {isAnnouncement ? <AnnouncementIcon fontSize="small" /> : <ArticleIcon fontSize="small" />}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 950, letterSpacing: "-0.01em", ...lineClampSx(1) }}>{title}</Typography>
              {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, ...lineClampSx(2) }}>
                  {compactText(description, 190)}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={0.25}>
              <Tooltip title="Details">
                <IconButton size="small" onClick={() => onView(row)}><InfoOutlinedIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(row)}><EditIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title={row.is_archived ? "Restore" : "Archive"}>
                <IconButton size="small" color={row.is_archived ? "primary" : "default"} onClick={() => onArchive(row)}>
                  {row.is_archived ? <RestoreIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => onDelete(row)}><DeleteIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={row.status || (row.is_published ? "Published" : "Draft")} {...readableChipProps(theme, statusTone(row))} />
            {isAnnouncement && <Chip size="small" label={row.priority || "normal"} {...readableChipProps(theme, priorityTone(row.priority))} />}
            {!isAnnouncement && row.category && <Chip size="small" label={row.category} {...readableChipProps(theme, "primary")} />}
            <Chip size="small" label={row.audience_summary || "No audience"} {...readableChipProps(theme, "neutral")} />
            {row.targeted_employee_count !== undefined && <Chip size="small" label={`${row.targeted_employee_count} targeted`} {...readableChipProps(theme, "info")} />}
          </Stack>
          {attachedFile && <FileSummary file={attachedFile} label={isAnnouncement ? "Attachment" : "Shared file"} />}
          <Stack direction="row" spacing={1} color="text.secondary" flexWrap="wrap" useFlexGap>
            <Typography variant="caption">By {row.created_by || "Unknown"}</Typography>
            {row.created_at && <Typography variant="caption">Created {formatDate(row.created_at)}</Typography>}
            {row.updated_at && <Typography variant="caption">Updated {formatDate(row.updated_at)}</Typography>}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

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

const RowsPerPageSelect = ({ value, onChange }) => (
  <FormControl size="small" sx={{ minWidth: 118 }}>
    <InputLabel>Rows</InputLabel>
    <Select label="Rows" value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {[10, 12, 20, 50].map((size) => <MenuItem key={size} value={size}>{size} rows</MenuItem>)}
    </Select>
  </FormControl>
);

const DetailRow = ({ label, value }) => (
  <Stack spacing={0.25}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 750, wordBreak: "break-word" }}>{value === undefined || value === null || value === "" ? "—" : value}</Typography>
  </Stack>
);

const Communications = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("announcements");
  const [announcements, setAnnouncements] = useState({ items: [], context: {} });
  const [files, setFiles] = useState({ items: [], context: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [scanFilter, setScanFilter] = useState("");
  const [search, setSearch] = useState("");
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [filePage, setFilePage] = useState(1);
  const [announcementPageSize, setAnnouncementPageSize] = useState(12);
  const [filePageSize, setFilePageSize] = useState(12);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [detailType, setDetailType] = useState("announcement");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncementForm);
  const [fileForm, setFileForm] = useState(emptyFileForm);
  const [uploadingKey, setUploadingKey] = useState("");
  const [draftUploadIds, setDraftUploadIds] = useState([]);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [scanRefreshUntil, setScanRefreshUntil] = useState(0);

  const context = activeTab === "announcements" ? announcements.context || {} : files.context || announcements.context || {};
  const departments = context.departments || [];
  const employees = context.employees || [];
  const categories = Array.from(new Set(context.categories || [])).sort((a, b) => a.localeCompare(b));

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    const baseParams = {
      status: statusFilter === "active" ? undefined : statusFilter,
      audience_type: audienceFilter || undefined,
      search: search || undefined,
    };
    try {
      const [announcementRes, fileRes] = await Promise.all([
        api.get("/manager/communications/announcements", {
          params: {
            ...baseParams,
            priority: priorityFilter || undefined,
            page: announcementPage,
            page_size: announcementPageSize,
          },
        }),
        api.get("/manager/communications/files", {
          params: {
            ...baseParams,
            category: categoryFilter || undefined,
            scan_status: scanFilter || undefined,
            page: filePage,
            page_size: filePageSize,
          },
        }),
      ]);
      setAnnouncements(announcementRes.data || { items: [], context: {} });
      setFiles(fileRes.data || { items: [], context: {} });
    } catch (err) {
      if (!silent) setError(err?.response?.data?.error || "Unable to load communications.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadData(); }, [statusFilter, priorityFilter, audienceFilter, categoryFilter, scanFilter, announcementPage, filePage, announcementPageSize, filePageSize]);

  useEffect(() => {
    const annPagination = announcements.pagination;
    if (annPagination && Number(annPagination.page || 1) > Math.max(1, Number(annPagination.total_pages || 1))) setAnnouncementPage(Math.max(1, annPagination.total_pages || 1));
    if (annPagination && Number(annPagination.total || 0) === 0 && Number(annPagination.page || 1) !== 1) setAnnouncementPage(1);
    const filePagination = files.pagination;
    if (filePagination && Number(filePagination.page || 1) > Math.max(1, Number(filePagination.total_pages || 1))) setFilePage(Math.max(1, filePagination.total_pages || 1));
    if (filePagination && Number(filePagination.total || 0) === 0 && Number(filePagination.page || 1) !== 1) setFilePage(1);
  }, [announcements.pagination, files.pagination]);

  const filteredRows = activeTab === "announcements" ? announcements.items || [] : files.items || [];
  const activePagination = activeTab === "announcements" ? announcements.pagination : files.pagination;
  const summary = activeTab === "announcements" ? announcements.summary || files.summary || {} : files.summary || announcements.summary || {};
  const hasVisiblePendingScan = (announcements.items || []).some((row) => fileIsWaitingForScan(row.attachment_file))
    || (files.items || []).some((row) => fileIsWaitingForScan(row.file));

  useEffect(() => {
    if (!hasVisiblePendingScan || !scanRefreshUntil || Date.now() > scanRefreshUntil) return undefined;
    const timer = window.setTimeout(() => {
      loadData(true);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [hasVisiblePendingScan, scanRefreshUntil, announcements.items, files.items]);

  const refreshSearch = () => {
    setAnnouncementPage(1);
    setFilePage(1);
    loadData();
  };

  const resetPaginationForFilters = () => {
    setAnnouncementPage(1);
    setFilePage(1);
  };

  const openAnnouncementDialog = (row = null) => {
    setDraftUploadIds([]);
    setAnnouncementForm(row ? {
      id: row.id,
      title: row.title || "",
      body: row.body || "",
      priority: row.priority || "normal",
      attachment_file_id: row.attachment_file_id || "",
      attachment_file: row.attachment_file || null,
      department_ids: (row.departments || []).map((department) => department.id),
      employee_ids: (row.employees || []).map((employee) => employee.id),
      is_published: Boolean(row.is_published),
      is_archived: Boolean(row.is_archived),
    } : emptyAnnouncementForm);
    setAnnouncementDialogOpen(true);
  };

  const openFileDialog = (row = null) => {
    setDraftUploadIds([]);
    setFileForm(row ? {
      id: row.id,
      file_id: row.file_id || "",
      file: row.file || null,
      title: row.title || "",
      description: row.description || "",
      category: row.category || "",
      department_ids: (row.departments || []).map((department) => department.id),
      employee_ids: (row.employees || []).map((employee) => employee.id),
      is_published: Boolean(row.is_published),
      is_archived: Boolean(row.is_archived),
    } : emptyFileForm);
    setFileDialogOpen(true);
  };

  const hasAudience = (form) => Boolean((form.department_ids || []).length || (form.employee_ids || []).length);

  const rememberDraftUpload = (file) => {
    if (!file?.id) return;
    const id = String(file.id);
    setDraftUploadIds((prev) => prev.includes(id) ? prev : [...prev, id]);
  };

  const deleteDraftUpload = async (fileId) => {
    const id = String(fileId || "");
    if (!id || !draftUploadIds.includes(id)) return;
    try {
      await api.delete(`/manager/communications/uploads/${id}`);
    } catch {
      // If the file was already attached or removed server-side, keep the UI flow non-blocking.
    } finally {
      setDraftUploadIds((prev) => prev.filter((existingId) => existingId !== id));
    }
  };

  const cleanupDraftUploads = async (excludeIds = []) => {
    const ids = [...draftUploadIds];
    const exclude = new Set(excludeIds.map((id) => String(id)));
    const removableIds = ids.filter((id) => !exclude.has(String(id)));
    if (!removableIds.length) {
      setDraftUploadIds((prev) => prev.filter((id) => exclude.has(String(id))));
      return;
    }
    await Promise.allSettled(removableIds.map((id) => api.delete(`/manager/communications/uploads/${id}`)));
    setDraftUploadIds((prev) => prev.filter((id) => exclude.has(String(id))));
  };

  const closeAnnouncementDialog = async () => {
    await cleanupDraftUploads();
    setAnnouncementDialogOpen(false);
  };

  const closeFileDialog = async () => {
    await cleanupDraftUploads();
    setFileDialogOpen(false);
  };

  const uploadCommunicationFile = async (file, onUploaded) => {
    if (!file) return;
    setError("");
    setUploadingKey(file.name || "upload");
    try {
      const reserve = await api.post("/manager/communications/uploads", {
        filename: file.name,
        content_type: normaliseContentType(file),
        size: file.size,
      });
      const fileRecord = reserve?.data?.file;
      const upload = reserve?.data?.upload;
      if (!fileRecord?.id || !upload) throw new Error("Upload could not be prepared.");
      const provider = String(upload.provider || "local").toLowerCase();
      if (provider === "s3") {
        const formData = new FormData();
        Object.entries(upload.fields || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null) formData.append(key, value);
        });
        formData.append("file", file);
        await api({
          method: upload.method || "POST",
          url: upload.url,
          data: formData,
          noAuth: true,
          noCompanyHeader: true,
        });
        const completed = await api.post(`/manager/communications/uploads/${fileRecord.id}/complete`, {});
        const uploaded = completed?.data?.file || fileRecord;
        rememberDraftUpload(uploaded);
        onUploaded(uploaded);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const completed = await api.post(upload.url || `/manager/communications/uploads/${fileRecord.id}/local`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const uploaded = completed?.data?.file || fileRecord;
        rememberDraftUpload(uploaded);
        onUploaded(uploaded);
      }
      setScanRefreshUntil(Date.now() + 120000);
      setSuccess("File uploaded. Security check is running. Choose an audience and click Save to share it.");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to upload file.");
    } finally {
      setUploadingKey("");
    }
  };

  const saveAnnouncement = async () => {
    setError("");
    setSuccess("");
    if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
      setError("Title and message are required.");
      return;
    }
    if (!hasAudience(announcementForm)) {
      setError("Choose at least one department or employee audience.");
      return;
    }
    const { attachment_file, ...rest } = announcementForm;
    const payload = { ...rest, attachment_file_id: announcementForm.attachment_file_id || null };
    try {
      if (announcementForm.id) await api.patch(`/manager/communications/announcements/${announcementForm.id}`, payload);
      else await api.post("/manager/communications/announcements", payload);
      await cleanupDraftUploads([announcementForm.attachment_file_id]);
      setDraftUploadIds((prev) => prev.filter((id) => id !== String(announcementForm.attachment_file_id || "")));
      setAnnouncementDialogOpen(false);
      if (announcementForm.attachment_file_id) setScanRefreshUntil(Date.now() + 120000);
      setSuccess(announcementForm.attachment_file_id ? "Announcement saved. Attachment will become available after the security check." : "Announcement saved.");
      loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to save announcement.");
    }
  };

  const saveFile = async () => {
    setError("");
    setSuccess("");
    if (!fileForm.file_id) {
      setError("Upload a file before sharing it.");
      return;
    }
    if (!fileForm.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!hasAudience(fileForm)) {
      setError("Choose at least one department or employee audience.");
      return;
    }
    try {
      const { file, ...payload } = fileForm;
      payload.file_id = fileForm.file_id || null;
      if (fileForm.id) await api.patch(`/manager/communications/files/${fileForm.id}`, payload);
      else await api.post("/manager/communications/files", payload);
      await cleanupDraftUploads([fileForm.file_id]);
      setDraftUploadIds((prev) => prev.filter((id) => id !== String(fileForm.file_id || "")));
      setFileDialogOpen(false);
      setActiveTab("files");
      setFilePage(1);
      if (fileForm.file_id) setScanRefreshUntil(Date.now() + 120000);
      setSuccess("Shared file saved. File will become available after the security check.");
      loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to save shared file.");
    }
  };

  const toggleArchive = async (type, row) => {
    setError("");
    setSuccess("");
    try {
      if (type === "announcement") {
        await api.patch(`/manager/communications/announcements/${row.id}`, { is_archived: !row.is_archived });
      } else {
        await api.patch(`/manager/communications/files/${row.id}`, { is_archived: !row.is_archived });
      }
      setSuccess(row.is_archived ? "Restored." : "Archived.");
      loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to update archive state.");
    }
  };

  const deleteCommunication = async () => {
    if (!deleteTarget?.row?.id) return;
    setError("");
    setSuccess("");
    try {
      if (deleteTarget.type === "announcement") {
        await api.delete(`/manager/communications/announcements/${deleteTarget.row.id}`);
      } else {
        await api.delete(`/manager/communications/files/${deleteTarget.row.id}`);
      }
      setSuccess(deleteTarget.type === "announcement" ? "Announcement deleted." : "Shared file deleted.");
      setDeleteTarget(null);
      if (deleteTarget.type === "announcement") setAnnouncementPage(1);
      else setFilePage(1);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to delete this item.");
    }
  };

  const cleanupOrphanUploads = async () => {
    setCleanupLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/manager/communications/uploads/cleanup-orphans", {});
      const result = res.data || {};
      setSuccess(
        `Cleanup complete: ${result.deleted_files || 0} stale upload(s) removed, ${result.deleted_storage_objects || 0} storage object(s) deleted${result.storage_delete_failures ? `, ${result.storage_delete_failures} storage delete failure(s)` : ""}.`,
      );
      setCleanupDialogOpen(false);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to clean up stale uploads.");
    } finally {
      setCleanupLoading(false);
    }
  };

  const tabs = [
    { key: "announcements", label: "Announcements" },
    { key: "files", label: "Shared Files" },
  ];

  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === "announcements") {
      setCategoryFilter("");
      setScanFilter("");
      setAnnouncementPage(1);
    } else {
      setPriorityFilter("");
      setFilePage(1);
    }
  };

  return (
    <ManagementFrame
      fullWidth
      contentVariant={false}
      sx={{ px: { xs: 1, md: 2 } }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-0.02em" }}>Communications</Typography>
            <Typography variant="body2" color="text.secondary">Publish internal updates and share company files.</Typography>
          </Box>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", md: "flex-end" }}>
            {[
              ["Announcements", summary.total_announcements || 0, "warning"],
              ["Shared files", summary.total_shared_files || 0, "primary"],
              ["Pending scans", summary.pending_scan_files || 0, "warning"],
              ["Blocked", summary.blocked_files || 0, "error"],
            ].map(([label, value, tone]) => (
              <Chip
                key={label}
                label={`${label}: ${value}`}
                {...readableChipProps(theme, tone)}
                sx={{ ...readableChipProps(theme, tone).sx, height: 30, px: 0.5 }}
              />
            ))}
          </Stack>
        </Stack>

        <Card variant="outlined" sx={{ borderRadius: 1, borderColor: alpha(theme.palette.primary.main, 0.14), background: alpha(theme.palette.background.paper, 0.8) }}>
          <CardContent sx={{ p: 1 }}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={1} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between">
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {tabs.map((tab) => (
                  <Button
                    key={tab.key}
                    size="small"
                    variant={activeTab === tab.key ? "contained" : "outlined"}
                    onClick={() => switchTab(tab.key)}
                    sx={{ fontWeight: 900 }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} alignItems={{ xs: "stretch", sm: "center" }} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                <TextField size="small" label="Search" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") refreshSearch(); }} sx={{ minWidth: 190 }} />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={statusFilter} onChange={(event) => { resetPaginationForFilters(); setStatusFilter(event.target.value); }}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Audience</InputLabel>
                  <Select label="Audience" value={audienceFilter} onChange={(event) => { resetPaginationForFilters(); setAudienceFilter(event.target.value); }}>
                    <MenuItem value="">All audiences</MenuItem>
                    <MenuItem value="department">Departments</MenuItem>
                    <MenuItem value="employee">Employees</MenuItem>
                    <MenuItem value="mixed">Mixed</MenuItem>
                  </Select>
                </FormControl>
                {activeTab === "announcements" ? (
                  <FormControl size="small" sx={{ minWidth: 145 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select label="Priority" value={priorityFilter} onChange={(event) => { resetPaginationForFilters(); setPriorityFilter(event.target.value); }}>
                      <MenuItem value="">All priorities</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="important">Important</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <>
                    <FormControl size="small" sx={{ minWidth: 145 }}>
                      <InputLabel>Category</InputLabel>
                      <Select label="Category" value={categoryFilter} onChange={(event) => { resetPaginationForFilters(); setCategoryFilter(event.target.value); }}>
                        <MenuItem value="">All categories</MenuItem>
                        {categories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 145 }}>
                      <InputLabel>Scan</InputLabel>
                      <Select label="Scan" value={scanFilter} onChange={(event) => { resetPaginationForFilters(); setScanFilter(event.target.value); }}>
                        <MenuItem value="">All scans</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="scanning">Scanning</MenuItem>
                        <MenuItem value="clean">Clean</MenuItem>
                        <MenuItem value="blocked">Blocked</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                )}
                <RowsPerPageSelect
                  value={activeTab === "announcements" ? announcementPageSize : filePageSize}
                  onChange={(value) => {
                    if (activeTab === "announcements") {
                      setAnnouncementPage(1);
                      setAnnouncementPageSize(value);
                    } else {
                      setFilePage(1);
                      setFilePageSize(value);
                    }
                  }}
                />
                <Tooltip title="Remove stale uploaded files that were never attached to an announcement or shared file.">
                  <Button size="small" variant="text" color="warning" onClick={() => setCleanupDialogOpen(true)}>Maintenance</Button>
                </Tooltip>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>Refresh</Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => activeTab === "announcements" ? openAnnouncementDialog() : openFileDialog()}
                  sx={{ fontWeight: 900 }}
                >
                  {activeTab === "announcements" ? "New announcement" : "Share file"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>}

        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={20} /><Typography color="text.secondary">Loading communications...</Typography></Stack>
        ) : filteredRows.length ? (
          <Stack spacing={1.5}>
            <Grid container spacing={2}>
              {filteredRows.map((row) => (
                <Grid key={`${activeTab}-${row.id}`} item xs={12} md={6} lg={4}>
                  <CommunicationCard
                    type={activeTab === "announcements" ? "announcement" : "file"}
                    row={row}
                    onView={(item) => { setDetailType(activeTab === "announcements" ? "announcement" : "file"); setDetailRow(item); }}
                    onEdit={activeTab === "announcements" ? openAnnouncementDialog : openFileDialog}
                    onArchive={(item) => toggleArchive(activeTab === "announcements" ? "announcement" : "file", item)}
                    onDelete={(item) => setDeleteTarget({ type: activeTab === "announcements" ? "announcement" : "file", row: item })}
                  />
                </Grid>
              ))}
            </Grid>
            <PaginationBar
              pagination={activePagination}
              onChange={(page) => activeTab === "announcements" ? setAnnouncementPage(page) : setFilePage(page)}
            />
          </Stack>
        ) : (
          <Card variant="outlined" sx={{ borderRadius: 1 }}>
            <CardContent sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                {activeTab === "announcements" ? "No announcements yet." : "No shared files yet."}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>

      <Dialog open={announcementDialogOpen} onClose={closeAnnouncementDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 950 }}>{announcementForm.id ? "Edit announcement" : "New announcement"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <TextField size="small" label="Title" value={announcementForm.title} onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, title: event.target.value }))} fullWidth />
            <TextField size="small" label="Message" value={announcementForm.body} onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, body: event.target.value }))} minRows={4} multiline fullWidth />
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select label="Priority" value={announcementForm.priority} onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, priority: event.target.value }))}>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="important">Important</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={0.75}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={uploadingKey ? <CircularProgress size={16} thickness={5} /> : <ArticleIcon />}
                    disabled={Boolean(uploadingKey)}
                  >
                    {uploadingKey ? "Uploading..." : announcementForm.attachment_file_id ? "Replace attachment" : "Upload attachment"}
                    <input
                      hidden
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        const previousDraftId = announcementForm.attachment_file_id;
                        uploadCommunicationFile(file, (uploaded) => setAnnouncementForm((prev) => ({
                          ...prev,
                          attachment_file_id: uploaded.id,
                          attachment_file: uploaded,
                        })));
                        if (previousDraftId) deleteDraftUpload(previousDraftId);
                      }}
                    />
                  </Button>
                  {announcementForm.attachment_file && (
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                      <FileSummary file={announcementForm.attachment_file} />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          deleteDraftUpload(announcementForm.attachment_file_id);
                          setAnnouncementForm((prev) => ({ ...prev, attachment_file_id: "", attachment_file: null }));
                        }}
                      >
                        Remove
                      </Button>
                    </Stack>
                  )}
                  {announcementForm.attachment_file && draftUploadIds.includes(String(announcementForm.attachment_file_id || "")) && (
                    <Alert severity="info" sx={{ py: 0.5 }}>
                      Uploaded. Security check in progress. It will not be sent until you save this announcement.
                    </Alert>
                  )}
                </Stack>
              </Grid>
            </Grid>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Audience</Typography>
              <Tooltip title="Choose departments, employees, or both. Employees included by department do not need to be selected again.">
                <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              </Tooltip>
            </Stack>
            <AudienceSelect
              departments={departments}
              employees={employees}
              value={announcementForm}
              onChange={setAnnouncementForm}
            />
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Publishing</InputLabel>
                  <Select label="Publishing" value={announcementForm.is_published ? "published" : "draft"} onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, is_published: event.target.value === "published" }))}>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Archive state</InputLabel>
                  <Select label="Archive state" value={announcementForm.is_archived ? "archived" : "active"} onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, is_archived: event.target.value === "archived" }))}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAnnouncementDialog}>Cancel</Button>
          <Button variant="contained" startIcon={<SendIcon />} disabled={Boolean(uploadingKey)} onClick={saveAnnouncement}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={fileDialogOpen} onClose={closeFileDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 950 }}>{fileForm.id ? "Edit shared file" : "Share file"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Stack spacing={0.75}>
              <Button
                variant="outlined"
                component="label"
                startIcon={uploadingKey ? <CircularProgress size={16} thickness={5} /> : <ArticleIcon />}
                disabled={Boolean(uploadingKey)}
              >
                {uploadingKey ? "Uploading..." : fileForm.file_id ? "Replace file" : "Upload file"}
                <input
                  hidden
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    const previousDraftId = fileForm.file_id;
                    uploadCommunicationFile(file, (uploaded) => setFileForm((prev) => ({
                      ...prev,
                      file_id: uploaded.id,
                      file: uploaded,
                      title: prev.title || uploaded.file_name || uploaded.original_filename || "",
                    })));
                    if (previousDraftId) deleteDraftUpload(previousDraftId);
                  }}
                />
              </Button>
              {fileForm.file && (
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                  <FileSummary file={fileForm.file} />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      deleteDraftUpload(fileForm.file_id);
                      setFileForm((prev) => ({ ...prev, file_id: "", file: null }));
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              )}
              {fileForm.file && draftUploadIds.includes(String(fileForm.file_id || "")) && (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Uploaded. Security check in progress. It will not appear in Shared Files or employee Communications until you save this share.
                </Alert>
              )}
            </Stack>
            <TextField size="small" label="Title" value={fileForm.title} onChange={(event) => setFileForm((prev) => ({ ...prev, title: event.target.value }))} fullWidth />
            <TextField size="small" label="Description" value={fileForm.description} onChange={(event) => setFileForm((prev) => ({ ...prev, description: event.target.value }))} minRows={3} multiline fullWidth />
            <TextField
              size="small"
              label="Category"
              value={fileForm.category}
              onChange={(event) => setFileForm((prev) => ({ ...prev, category: event.target.value }))}
              fullWidth
              InputProps={{
                endAdornment: categories.length ? (
                  <Tooltip title={`Known categories: ${categories.slice(0, 8).join(", ")}${categories.length > 8 ? ", ..." : ""}`}>
                    <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </Tooltip>
                ) : null,
              }}
            />
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Audience</Typography>
              <Tooltip title="Choose departments, employees, or both. This does not create training progress or completion requirements.">
                <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              </Tooltip>
            </Stack>
            <AudienceSelect departments={departments} employees={employees} value={fileForm} onChange={setFileForm} />
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Publishing</InputLabel>
                  <Select label="Publishing" value={fileForm.is_published ? "published" : "draft"} onChange={(event) => setFileForm((prev) => ({ ...prev, is_published: event.target.value === "published" }))}>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Archive state</InputLabel>
                  <Select label="Archive state" value={fileForm.is_archived ? "archived" : "active"} onChange={(event) => setFileForm((prev) => ({ ...prev, is_archived: event.target.value === "archived" }))}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFileDialog}>Cancel</Button>
          <Button
            variant="contained"
            disabled={Boolean(uploadingKey) || (!fileForm.id && !fileForm.file_id) || (fileForm.is_published && !fileForm.file_id)}
            onClick={saveFile}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={Boolean(detailRow)} onClose={() => setDetailRow(null)}>
        <Box sx={{ width: { xs: 340, sm: 460 }, p: 2.25 }}>
          {detailRow && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: "-0.02em" }}>{detailRow.title}</Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    <Chip size="small" label={detailRow.status} {...readableChipProps(theme, statusTone(detailRow))} />
                    {detailType === "announcement" && <Chip size="small" label={detailRow.priority || "normal"} {...readableChipProps(theme, priorityTone(detailRow.priority))} />}
                    {detailType === "file" && detailRow.category && <Chip size="small" label={detailRow.category} {...readableChipProps(theme, "primary")} />}
                  </Stack>
                </Box>
                <IconButton color="error" onClick={() => setDeleteTarget({ type: detailType, row: detailRow })}><DeleteIcon /></IconButton>
              </Stack>
              <Divider />
              <DetailRow label={detailType === "announcement" ? "Message" : "Description"} value={detailType === "announcement" ? detailRow.body : detailRow.description} />
              <Grid container spacing={1.5}>
                <Grid item xs={6}><DetailRow label="Created by" value={detailRow.created_by} /></Grid>
                <Grid item xs={6}><DetailRow label="Targeted employees" value={detailRow.targeted_employee_count} /></Grid>
                <Grid item xs={6}><DetailRow label="Created" value={formatDateTime(detailRow.created_at)} /></Grid>
                <Grid item xs={6}><DetailRow label="Updated" value={formatDateTime(detailRow.updated_at)} /></Grid>
              </Grid>
              <Divider />
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Audience</Typography>
                <DetailRow label="Summary" value={detailRow.audience_summary} />
                <DetailRow label="Departments" value={(detailRow.departments || []).map((item) => item.name).join(", ") || "—"} />
                <DetailRow label="Employees" value={(detailRow.employees || []).map((item) => item.name || item.email).join(", ") || "—"} />
              </Stack>
              <Divider />
              {(() => {
                const file = detailType === "announcement" ? detailRow.attachment_file : detailRow.file;
                if (!file) return <Alert severity="info" variant="outlined">No uploaded file attached.</Alert>;
                return (
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>File</Typography>
                    <FileSummary file={file} label={detailType === "announcement" ? "Announcement attachment" : "Shared file"} />
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}><DetailRow label="File name" value={fileName(file)} /></Grid>
                      <Grid item xs={6}><DetailRow label="Size" value={formatBytes(file.file_size)} /></Grid>
                      <Grid item xs={6}><DetailRow label="Type" value={file.content_type} /></Grid>
                      <Grid item xs={6}><DetailRow label="Scan status" value={file.scan_status} /></Grid>
                      <Grid item xs={6}><DetailRow label="Uploaded" value={formatDateTime(file.created_at)} /></Grid>
                      <Grid item xs={6}><DetailRow label="Download" value={downloadStatusText(file)} /></Grid>
                    </Grid>
                    {file.scan_status === "blocked" && <Alert severity="error">Blocked by security scan. Replace or remove it before employees can access it.</Alert>}
                    {["pending", "scanning"].includes(String(file.scan_status || "").toLowerCase()) && <Alert severity="warning">Uploaded. Security check in progress. Available after scan completes.</Alert>}
                  </Stack>
                );
              })()}
            </Stack>
          )}
        </Box>
      </Drawer>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 950 }}>Delete {deleteTarget?.type === "announcement" ? "announcement" : "shared file"}?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            This permanently removes the selected {deleteTarget?.type === "announcement" ? "announcement" : "shared file"} from Communications. Archive keeps history; delete removes the row and cleans the uploaded file only if no other communication still references it.
          </Typography>
          {deleteTarget?.row?.title && <Typography sx={{ mt: 1.5, fontWeight: 900 }}>{deleteTarget.row.title}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" startIcon={<DeleteIcon />} onClick={deleteCommunication}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cleanupDialogOpen} onClose={() => setCleanupDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 950 }}>Clean up stale uploads?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            This removes uploaded files that were never attached to an announcement or shared file and are older than the cleanup window. Published, draft, and archived communication rows are preserved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialogOpen(false)} disabled={cleanupLoading}>Cancel</Button>
          <Button color="warning" variant="contained" onClick={cleanupOrphanUploads} disabled={cleanupLoading}>
            {cleanupLoading ? "Cleaning..." : "Run cleanup"}
          </Button>
        </DialogActions>
      </Dialog>
    </ManagementFrame>
  );
};

export default Communications;
