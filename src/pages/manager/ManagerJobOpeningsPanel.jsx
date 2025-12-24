// src/pages/manager/ManagerJobOpeningsPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  MenuItem,
  Pagination,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PublishIcon from "@mui/icons-material/Publish";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import SendIcon from "@mui/icons-material/Send";

import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { jobOpeningsApi } from "../../utils/jobOpenings";
import JobOpeningEditorDialog from "./JobOpeningEditorDialog";
import JobStatusHistoryDrawer from "./JobStatusHistoryDrawer";

const STATUS_OPTIONS = [
  { value: "", label: "All (excluding deleted)" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
  { value: "deleted", label: "Deleted" },
];

const APPLICATION_STAGE_OPTIONS = [
  "Applied",
  "Interview Scheduled",
  "Interviewed",
  "Approved",
  "Offered",
  "Placed",
  "Rejected",
  "On hold",
];

const statusChipColor = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "published") return "success";
  if (v === "draft") return "warning";
  if (v === "closed") return "default";
  if (v === "deleted") return "error";
  return "default";
};

const fmtDate = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
};

export default function ManagerJobOpeningsPanel({ token }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [authInfo, setAuthInfo] = useState(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [total, setTotal] = useState(0);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyJob, setHistoryJob] = useState(null);

  const [appsOpen, setAppsOpen] = useState(false);
  const [appsJob, setAppsJob] = useState(null);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState("");
  const [appsRows, setAppsRows] = useState([]);
  const [appsPage, setAppsPage] = useState(1);
  const [appsTotal, setAppsTotal] = useState(0);
  const [appsQ, setAppsQ] = useState("");
  const [appsSavingId, setAppsSavingId] = useState(null);
  const [appsNotice, setAppsNotice] = useState("");
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const appsPageSize = 20;
  const appsPageCount = useMemo(
    () => Math.max(1, Math.ceil((appsTotal || 0) / appsPageSize)),
    [appsTotal]
  );
  const canEditJobs = Boolean(authInfo?.is_manager || authInfo?.can_manage_onboarding);
  const isAuthReady = authInfo !== null;
  const viewOnly = isAuthReady && !canEditJobs;

  const pageCount = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSize)), [total]);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await jobOpeningsApi.list({
        page,
        page_size: pageSize,
        status: status || undefined,
        q: q || undefined,
      });
      setRows(Array.isArray(data?.results) ? data.results : []);
      setTotal(Number(data?.total || 0));
    } catch (e) {
      setErr(e?.response?.data?.error || e?.displayMessage || e?.message || "Failed to load job openings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  useEffect(() => {
    let mounted = true;
    const loadAuth = async () => {
      try {
        const res = await api.get("/auth/me", { noCompanyHeader: true });
        if (mounted) setAuthInfo(res?.data || {});
      } catch {
        if (mounted) setAuthInfo({});
      }
    };
    loadAuth();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!appsOpen || !appsJob?.id) return;
    loadApplications(appsJob.id, appsPage);
    if (!templates.length && !templatesLoading) {
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appsOpen, appsJob?.id, appsPage]);

  useEffect(() => {
    let mounted = true;
    const loadCompanySlug = async () => {
      try {
        const res = await api.get("/api/company/me");
        const data = res?.data || {};
        const slug =
          data?.slug ||
          data?.company?.slug ||
          data?.settings?.slug ||
          data?.settings?.company?.slug ||
          "";
        if (mounted) setCompanySlug(String(slug || ""));
      } catch {
        if (mounted) setCompanySlug("");
      }
    };
    loadCompanySlug();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = async () => {
    setPage(1);
    await load();
  };

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (job) => {
    setEditing(job);
    setEditorOpen(true);
  };

  const openHistory = (job) => {
    setHistoryJob(job);
    setHistoryOpen(true);
  };

  const openApplications = (job) => {
    setAppsJob(job);
    setAppsOpen(true);
    setAppsPage(1);
  };

  const loadApplications = async (jobId, pageOverride) => {
    if (!jobId) return;
    setAppsLoading(true);
    setAppsError("");
    try {
      const data = await jobOpeningsApi.applications(jobId, {
        page: pageOverride || appsPage,
        page_size: appsPageSize,
        q: appsQ || undefined,
      });
      setAppsRows(Array.isArray(data?.results) ? data.results : []);
      setAppsTotal(Number(data?.total || 0));
    } catch (e) {
      setAppsError(e?.response?.data?.error || e?.displayMessage || e?.message || "Failed to load applications.");
    } finally {
      setAppsLoading(false);
    }
  };

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await api.get("/api/form-templates");
      const list = Array.isArray(res?.data) ? res.data : [];
      const eligible = list.filter((tpl) =>
        ["active", "published"].includes(String(tpl?.status || "").toLowerCase())
      );
      setTemplates(eligible);
    } catch (e) {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const resolveTemplateId = (row) => {
    if (row?.template_id) {
      const hasActive = (templates || []).some((tpl) => tpl?.id === row.template_id);
      if (hasActive) return row.template_id;
    }
    if (!row?.profession_key) return null;
    const candidates = (templates || []).filter(
      (tpl) =>
        tpl?.profession_key === row.profession_key &&
        (tpl?.status === "published" || tpl?.status === "active")
    );
    if (!candidates.length) return null;
    const sorted = candidates
      .slice()
      .sort((a, b) =>
        String(b.updated_at || b.created_at || "").localeCompare(
          String(a.updated_at || a.created_at || "")
        )
      );
    return sorted[0]?.id || null;
  };

  const handleSendInvite = async (row) => {
    setAppsError("");
    setAppsNotice("");
    if (!row?.email) {
      setAppsError("Candidate email is required to send an invitation.");
      return;
    }
    const templateId = resolveTemplateId(row);
    if (!templateId) {
      setAppsError(
        "No active template found. Set the profession and an active template in Invitations → Templates & Submissions."
      );
      return;
    }
    try {
      const jobTitle = appsJob?.title || "";
      await api.post("/api/candidate-forms/invite", {
        template_id: templateId,
        invite_email: row.email,
        invite_name: row.name || "",
        profession_key: row.profession_key || undefined,
        profession_label: jobTitle || undefined,
        profession: jobTitle || undefined,
        job_title: jobTitle || undefined,
        email_subject: jobTitle ? `You're invited to share your ${jobTitle} profile` : undefined,
        email_body: jobTitle
          ? [
              `Hello ${row.name || "there"},`,
              "",
              `Thank you for your interest in our ${jobTitle} opportunity. To help us move forward, please take a moment to share a few details.`,
              "",
              "Start your profile here: {link}",
              "",
              "We appreciate your time!",
            ].join("\n")
          : undefined,
        template_variables: {
          job_title: jobTitle || undefined,
          position: jobTitle || undefined,
          candidate_name: row.name || undefined,
          profession_label: jobTitle || undefined,
          profession: jobTitle || undefined,
        },
      });
      setAppsNotice("Invitation sent.");
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.displayMessage ||
        e?.message ||
        "Failed to send invitation.";
      setAppsError(msg);
    }
  };

  const handleApplicationStageChange = async (row, nextStage) => {
    if (!row?.application_id) return;
    const prevStage = row.candidate_status || row.stage || "";
    setAppsRows((prev) =>
      prev.map((item) =>
        item.application_id === row.application_id
          ? { ...item, candidate_status: nextStage, stage: nextStage }
          : item
      )
    );
    setAppsSavingId(row.application_id);
    setAppsError("");
    try {
      const data = await jobOpeningsApi.updateApplication(row.application_id, { stage: nextStage });
      setAppsRows((prev) =>
        prev.map((item) =>
          item.application_id === row.application_id
            ? {
                ...item,
                stage: data?.stage || nextStage,
                candidate_status: data?.candidate_status || nextStage,
                interview_stage: data?.interview_stage || item.interview_stage,
                stage_changed_at: data?.stage_changed_at || item.stage_changed_at,
              }
            : item
        )
      );
    } catch (e) {
      setAppsRows((prev) =>
        prev.map((item) =>
          item.application_id === row.application_id
            ? { ...item, candidate_status: prevStage, stage: prevStage }
            : item
        )
      );
      setAppsError(e?.response?.data?.error || e?.displayMessage || e?.message || "Failed to update stage.");
    } finally {
      setAppsSavingId(null);
    }
  };

  const exportApplicationsCsv = async () => {
    if (!appsJob?.id || viewOnly) return;
    setAppsError("");
    try {
      const res = await jobOpeningsApi.exportApplications(appsJob.id, {
        q: appsQ || undefined,
      });
      const blob = res?.data instanceof Blob ? res.data : new Blob([res?.data || ""], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const disposition = res?.headers?.["content-disposition"] || res?.headers?.["Content-Disposition"];
      const filenameMatch = disposition && /filename="([^"]+)"/.exec(disposition);
      link.download = filenameMatch?.[1] || `job-applications-${appsJob?.id || "export"}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setAppsError(
        e?.response?.data?.error || e?.displayMessage || e?.message || "Failed to export applications."
      );
    }
  };

  const resolveCompanySlug = () => {
    if (companySlug) return companySlug;
    const stored =
      localStorage.getItem("public_company_slug") ||
      localStorage.getItem("company_slug") ||
      localStorage.getItem("slug") ||
      localStorage.getItem("site");
    if (stored) return stored;
    const envSlug = process.env.REACT_APP_PUBLIC_COMPANY_SLUG;
    if (envSlug) return envSlug;
    return "company";
  };

  const copyPublicLink = async (job) => {
    const slug = resolveCompanySlug();
    const url = `${window.location.origin}/public/${slug}/jobs/${job.slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  const openPublicLink = (job) => {
    const slug = resolveCompanySlug();
    const url = `${window.location.origin}/public/${slug}/jobs/${job.slug}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const doPublish = async (job) => {
    setSaving(true);
    setErr("");
    try {
      await jobOpeningsApi.publish(job.id);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.displayMessage || e?.message || "Publish failed.");
    } finally {
      setSaving(false);
    }
  };

  const doClose = async (job) => {
    setSaving(true);
    setErr("");
    try {
      await jobOpeningsApi.close(job.id);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.displayMessage || e?.message || "Close failed.");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (job) => {
    const ok = window.confirm(
      "Delete (soft delete) this job? This is only allowed for Draft jobs with no applications."
    );
    if (!ok) return;

    setSaving(true);
    setErr("");
    try {
      await jobOpeningsApi.remove(job.id);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.displayMessage || e?.message || "Delete failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditorSave = async (payload) => {
    setSaving(true);
    setErr("");
    try {
      if (editing?.id) {
        await jobOpeningsApi.update(editing.id, payload);
      } else {
        await jobOpeningsApi.create(payload);
      }
      setEditorOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.displayMessage || e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Job Postings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create, publish, and track job openings. Public links show only published roles.
              </Typography>
            </Box>

            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={openCreate}
              disabled={saving || !isAuthReady || viewOnly}
              sx={{ whiteSpace: "nowrap" }}
            >
              Create job
            </Button>
          </Stack>

          <Divider />

          {viewOnly && (
            <Alert severity="info">
              You have view-only access to Job Postings. Ask a manager to grant HR Job Posting access
              if you need to create, edit, or publish roles.
            </Alert>
          )}

          {err && <Alert severity="error">{err}</Alert>}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <TextField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or slug..."
              size="small"
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              size="small"
              sx={{ minWidth: 220 }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <Button onClick={handleSearch} variant="outlined" disabled={loading || saving}>
              Search
            </Button>
          </Stack>

          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Published</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={18} />
                        <Typography variant="body2" color="text.secondary">
                          Loading...
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="text.secondary">No jobs found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{job.title}</TableCell>
                      <TableCell>{job.slug}</TableCell>
                      <TableCell>
                        <Chip size="small" color={statusChipColor(job.status)} label={job.status || "-"} />
                      </TableCell>
                      <TableCell>{job.application_count ?? 0}</TableCell>
                      <TableCell>{fmtDate(job.published_at)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => openEdit(job)}
                              disabled={saving || !isAuthReady || viewOnly}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Status history">
                            <IconButton size="small" onClick={() => openHistory(job)} disabled={saving}>
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Applications">
                            <IconButton size="small" onClick={() => openApplications(job)} disabled={saving}>
                              <PeopleAltIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Copy public link">
                            <IconButton size="small" onClick={() => copyPublicLink(job)} disabled={saving}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Open public link">
                            <IconButton size="small" onClick={() => openPublicLink(job)} disabled={saving}>
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {String(job.status).toLowerCase() !== "published" ? (
                            <Tooltip title="Publish">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => doPublish(job)}
                                  disabled={saving || !isAuthReady || viewOnly}
                                >
                                  <PublishIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Close">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => doClose(job)}
                                  disabled={saving || !isAuthReady || viewOnly}
                                >
                                  <StopCircleIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          <Tooltip title="Delete (draft only)">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => doDelete(job)}
                                disabled={saving || !isAuthReady || viewOnly}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Total: {total}
            </Typography>

            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, p) => setPage(p)}
              size="small"
              shape="rounded"
            />
          </Stack>
        </Stack>
      </Paper>

      <JobOpeningEditorDialog
        open={editorOpen}
        job={editing}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        onSave={handleEditorSave}
        saving={saving}
      />

      <JobStatusHistoryDrawer
        open={historyOpen}
        job={historyJob}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryJob(null);
        }}
      />

      <Dialog
        open={appsOpen}
        onClose={() => {
          setAppsOpen(false);
          setAppsJob(null);
          setAppsRows([]);
          setAppsQ("");
          setAppsPage(1);
          setAppsTotal(0);
          setAppsError("");
          setAppsNotice("");
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Applications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {appsJob?.title || "Job"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={exportApplicationsCsv}
              disabled={!appsJob?.id || viewOnly}
            >
              Export CSV
            </Button>
            <IconButton onClick={() => setAppsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              value={appsQ}
              onChange={(e) => setAppsQ(e.target.value)}
              placeholder="Search by name or email..."
              size="small"
              fullWidth
            />
            <Button variant="outlined" onClick={() => loadApplications(appsJob?.id, 1)} disabled={appsLoading}>
              Search
            </Button>

            {appsError && <Alert severity="error">{appsError}</Alert>}
            {appsNotice && <Alert severity="success">{appsNotice}</Alert>}
            {viewOnly && (
              <Alert severity="info">
                View-only access: stage updates are disabled. Ask a manager for HR Job Posting access
                to update applicant stages.
              </Alert>
            )}

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Stage</TableCell>
                    <TableCell>Applied</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CircularProgress size={18} />
                          <Typography variant="body2" color="text.secondary">
                            Loading...
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : appsRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary">No applications found.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    appsRows.map((row) => (
                      <TableRow key={row.application_id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.name || "Unnamed"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.email || "No email"}{row.phone ? ` • ${row.phone}` : ""}
                          </Typography>
                          {(row.source || row.utm_source || row.utm_medium || row.utm_campaign) && (
                            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
                              {row.source && <Chip size="small" label={`Source: ${row.source}`} />}
                              {row.utm_source && <Chip size="small" label={`UTM: ${row.utm_source}`} />}
                              {row.utm_medium && <Chip size="small" label={`Medium: ${row.utm_medium}`} />}
                              {row.utm_campaign && <Chip size="small" label={`Campaign: ${row.utm_campaign}`} />}
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            value={row.candidate_status || row.stage || "Applied"}
                            onChange={(e) => handleApplicationStageChange(row, e.target.value)}
                            disabled={!isAuthReady || viewOnly || appsSavingId === row.application_id}
                            fullWidth
                          >
                            {APPLICATION_STAGE_OPTIONS.map((opt) => (
                              <MenuItem key={opt} value={opt}>
                                {opt}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>{row.applied_at ? new Date(row.applied_at).toLocaleString() : "-"}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Open candidate profile">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => row.email && navigate(`/employee/candidates/${encodeURIComponent(row.email)}`)}
                                  disabled={!row.email}
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Open intake submission">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => row.intake_token && window.open(`/apply/${row.intake_token}`, "_blank")}
                                  disabled={!row.intake_token}
                                >
                                  <DescriptionIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Download resume">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => row.resume_url && window.open(row.resume_url, "_blank")}
                                  disabled={!row.resume_url}
                                >
                                  <CloudDownloadIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Send invitation">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleSendInvite(row)}
                                  disabled={!row.email}
                                >
                                  <SendIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Total: {appsTotal}
              </Typography>
              <Pagination
                count={appsPageCount}
                page={appsPage}
                onChange={(_, p) => setAppsPage(p)}
                size="small"
                shape="rounded"
              />
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
