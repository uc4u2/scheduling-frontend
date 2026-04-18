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
import DownloadIcon from "@mui/icons-material/Download";
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

const shiftLabel = (row) => {
  const shift = row?.shift || {};
  if (!shift.date) return "Shift";
  const time = shift.start_time ? ` · ${shift.start_time}${shift.end_time ? `-${shift.end_time}` : ""}` : "";
  return `${formatDate(shift.date)}${time}`;
};

const EmployeePhotoCard = ({ row, onOpen, loading }) => {
  const theme = useTheme();
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
            <Box sx={{ width: 42, height: 42, borderRadius: 1, display: "grid", placeItems: "center", bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.dark }}>
              <PhotoCameraIcon />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 950, ...lineClampSx(1) }}>{shiftLabel(row)}</Typography>
              <Typography variant="body2" color="text.secondary">Uploaded {formatDateTime(row.created_at)}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={row.security_status_label || "Security check in progress"} {...readableChipProps(theme, fileStatusTone(row))} />
            {row.location?.label && <Chip size="small" label={row.location.label} {...readableChipProps(theme, row.location.has_location ? "success" : "neutral")} />}
          </Stack>
          {row.note && <Typography variant="body2" color="text.secondary" sx={lineClampSx(2)}>{row.note}</Typography>}
          {!row.is_download_ready && (
            <Alert severity={String(row.scan_status || "").toLowerCase() === "blocked" ? "error" : "info"} variant="outlined" sx={{ py: 0.25 }}>
              {String(row.scan_status || "").toLowerCase() === "blocked"
                ? "This photo was blocked. Please upload another photo or contact your manager."
                : "Security check in progress."}
            </Alert>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={!row.is_download_ready || loading === row.id}
            onClick={() => onOpen(row)}
            sx={{ alignSelf: "flex-start", fontWeight: 900 }}
          >
            {row.is_download_ready ? "Open" : "Not ready yet"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const role = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";
  const managerViewingEmployee = role === "manager" && location.pathname.startsWith("/employee");

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

  const openPhoto = async (row) => {
    if (!row.is_download_ready) {
      setError(String(row.scan_status || "").toLowerCase() === "blocked"
        ? "This photo was blocked. Please upload another photo or contact your manager."
        : "Security check in progress. Available after scan completes.");
      return;
    }
    setActionLoading(row.id);
    setError("");
    try {
      const result = (await api.get(`/employee/field-photos/${row.id}/download`)).data;
      if (result?.url) window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to open this photo.");
    } finally {
      setActionLoading(null);
    }
  };

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
              {rows.map((row) => (
                <Grid item xs={12} md={6} lg={4} key={row.id}>
                  <EmployeePhotoCard row={row} onOpen={openPhoto} loading={actionLoading} />
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
      </Stack>
    </ManagementFrame>
  );
};

export default RecruiterFieldPhotosPage;
