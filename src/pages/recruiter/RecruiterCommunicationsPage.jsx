import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AnnouncementIcon from "@mui/icons-material/Campaign";
import ArticleIcon from "@mui/icons-material/Article";
import DownloadIcon from "@mui/icons-material/Download";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
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

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
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

const priorityTone = (priority) => ({ urgent: "error", important: "warning", normal: "info" }[priority] || "info");

const CommunicationEmployeeCard = ({ kind, item, onOpen, loadingKey }) => {
  const theme = useTheme();
  const isAnnouncement = kind === "announcement";
  const file = isAnnouncement ? item.attachment_file : item.file;
  const hasAction = Boolean(file);
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 1,
        borderColor: alpha(isAnnouncement ? theme.palette.warning.main : theme.palette.primary.main, 0.18),
        background: `linear-gradient(135deg, ${alpha(isAnnouncement ? theme.palette.warning.main : theme.palette.primary.main, 0.055)}, ${alpha(theme.palette.background.paper, 0.96)})`,
        boxShadow: `0 16px 44px ${alpha(theme.palette.common.black, 0.055)}`,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.25} sx={{ height: "100%" }}>
          <Stack direction="row" spacing={1.15} alignItems="flex-start">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                color: isAnnouncement ? theme.palette.warning.dark : theme.palette.primary.dark,
                bgcolor: alpha(isAnnouncement ? theme.palette.warning.main : theme.palette.primary.main, 0.12),
                flexShrink: 0,
              }}
            >
              {isAnnouncement ? <AnnouncementIcon /> : <ArticleIcon />}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 950, letterSpacing: "-0.01em", ...lineClampSx(1) }}>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, ...lineClampSx(isAnnouncement ? 4 : 2) }}>
                {isAnnouncement ? item.body : item.description || "Shared company file."}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {isAnnouncement && <Chip size="small" icon={item.priority === "urgent" ? <PriorityHighIcon /> : undefined} label={item.priority || "normal"} {...readableChipProps(theme, priorityTone(item.priority))} />}
            {!isAnnouncement && item.category && <Chip size="small" label={item.category} {...readableChipProps(theme, "primary")} />}
            {file && <Chip size="small" label={file.file_name || "Attachment"} {...readableChipProps(theme, "neutral")} />}
            {file?.scan_status && <Chip size="small" label={`Scan: ${file.scan_status}`} {...readableChipProps(theme, file.scan_status === "clean" ? "success" : file.scan_status === "blocked" ? "error" : "warning")} />}
            {item.shared_by && <Chip size="small" label={`Shared by ${item.shared_by}`} {...readableChipProps(theme, "neutral")} />}
            {item.shared_date && <Chip size="small" label={formatDate(item.shared_date)} {...readableChipProps(theme, "neutral")} />}
          </Stack>
          <Box sx={{ flex: 1 }} />
          {hasAction && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              disabled={loadingKey === `${kind}-${item.id}`}
              onClick={() => onOpen(kind, item)}
              sx={{ alignSelf: "flex-start", fontWeight: 900 }}
            >
              Download
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const RecruiterCommunicationsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();
  const [announcements, setAnnouncements] = useState([]);
  const [files, setFiles] = useState([]);
  const [announcementPagination, setAnnouncementPagination] = useState(null);
  const [filePagination, setFilePagination] = useState(null);
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [filePage, setFilePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const role = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";
  const managerViewingEmployee = role === "manager" && location.pathname.startsWith("/employee");

  const loadCommunications = () => {
    let alive = true;
    setLoading(true);
    setError("");
    Promise.all([
      api.get("/employee/communications/announcements", { params: { page: announcementPage, page_size: 6 } }),
      api.get("/employee/communications/files", { params: { page: filePage, page_size: 6 } }),
    ])
      .then(([announcementRes, fileRes]) => {
        if (!alive) return;
        setAnnouncements(announcementRes.data?.items || []);
        setFiles(fileRes.data?.items || []);
        setAnnouncementPagination(announcementRes.data?.pagination || null);
        setFilePagination(fileRes.data?.pagination || null);
      })
      .catch((err) => {
        if (alive) setError(err?.response?.data?.error || "Unable to load communications.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  };

  useEffect(() => loadCommunications(), [announcementPage, filePage]);

  const handleLocalTabChange = (value) => {
    const basePath = location.pathname.startsWith("/recruiter") ? "/recruiter/dashboard" : "/employee/dashboard";
    navigate(`${basePath}?tab=${value}`);
  };

  const openItem = async (kind, item) => {
    const file = kind === "announcement" ? item.attachment_file : item.file;
    if (!file) return;
    setActionLoading(`${kind}-${item.id}`);
    setError("");
    try {
      const endpoint = kind === "announcement"
        ? `/employee/communications/announcements/${item.id}/attachment`
        : `/employee/communications/files/${item.id}/document`;
      const result = (await api.get(endpoint)).data;
      if (result?.url) window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to open this item.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <ManagementFrame
      title="Communications"
      subtitle="Company announcements and shared files targeted to you."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      contentVariant={false}
    >
      <RecruiterTabs
        localTab="communications"
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
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={20} /><Typography color="text.secondary">Loading communications...</Typography></Stack>
        ) : (
          <>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 1,
                borderColor: alpha(theme.palette.warning.main, 0.18),
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.06)}, ${alpha(theme.palette.background.paper, 0.96)})`,
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>Announcements</Typography>
                    <Typography variant="body2" color="text.secondary">Published updates from your manager.</Typography>
                  </Box>
                  <Chip size="small" label={`${announcements.length} announcement${announcements.length === 1 ? "" : "s"}`} {...readableChipProps(theme, "warning")} />
                </Stack>
                {announcements.length ? (
                  <Stack spacing={1.5}>
                    <Grid container spacing={1.5}>
                      {announcements.map((item) => (
                        <Grid item xs={12} md={6} key={item.id}>
                          <CommunicationEmployeeCard kind="announcement" item={item} onOpen={openItem} loadingKey={actionLoading} />
                        </Grid>
                      ))}
                    </Grid>
                    {announcementPagination?.total_pages > 1 && (
                      <Stack direction="row" justifyContent="flex-end">
                        <Pagination size="small" page={announcementPage} count={announcementPagination.total_pages} onChange={(_, page) => setAnnouncementPage(page)} />
                      </Stack>
                    )}
                  </Stack>
                ) : (
                  <Alert severity="info" variant="outlined">No announcements have been shared with you yet.</Alert>
                )}
              </CardContent>
            </Card>

            <Card
              variant="outlined"
              sx={{
                borderRadius: 1,
                borderColor: alpha(theme.palette.primary.main, 0.16),
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 0.96)})`,
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>Shared Files</Typography>
                    <Typography variant="body2" color="text.secondary">Documents and links shared for reference.</Typography>
                  </Box>
                  <Chip size="small" label={`${files.length} file${files.length === 1 ? "" : "s"}`} {...readableChipProps(theme, "primary")} />
                </Stack>
                {files.length ? (
                  <Stack spacing={1.5}>
                    <Grid container spacing={1.5}>
                      {files.map((item) => (
                        <Grid item xs={12} md={6} key={item.id}>
                          <CommunicationEmployeeCard kind="file" item={item} onOpen={openItem} loadingKey={actionLoading} />
                        </Grid>
                      ))}
                    </Grid>
                    {filePagination?.total_pages > 1 && (
                      <Stack direction="row" justifyContent="flex-end">
                        <Pagination size="small" page={filePage} count={filePagination.total_pages} onChange={(_, page) => setFilePage(page)} />
                      </Stack>
                    )}
                  </Stack>
                ) : (
                  <Alert severity="info" variant="outlined">No shared files have been sent to you yet.</Alert>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Stack>
    </ManagementFrame>
  );
};

export default RecruiterCommunicationsPage;
