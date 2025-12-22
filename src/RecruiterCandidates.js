import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useTheme } from "@mui/material/styles";
import { api } from "./utils/api";
import { useSnackbar } from "notistack";
import { downloadQuestionnaireFile } from "./utils/questionnaireUploads";
import PublicBookingInfoCard from "./components/PublicBookingInfoCard";
import { isoFromParts } from "./utils/datetime";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const statusOptions = [
  "Applied",
  "Interview Scheduled",
  "Interviewed",
  "Approved",
  "Offered",
  "Placed",
  "Rejected",
  "On hold",
];
const RecruiterCandidates = ({ token }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { email: emailParam = "" } = useParams();
  const decodedEmail = useMemo(() => {
    if (!emailParam) return "";
    try {
      return decodeURIComponent(emailParam);
    } catch {
      return emailParam;
    }
  }, [emailParam]);
  const encodedEmail = useMemo(() => {
    if (!emailParam) {
      return decodedEmail ? encodeURIComponent(decodedEmail) : "";
    }
    return emailParam.includes("%") ? emailParam : encodeURIComponent(emailParam);
  }, [emailParam, decodedEmail]);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  // Update phone: try both data.phone and data.candidate_phone
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [otherLink, setOtherLink] = useState("");
  const [position, setPosition] = useState("");
  const [resumeFilename, setResumeFilename] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [resumePolicy, setResumePolicy] = useState({ retention_limit: 3 });
  const [savingResumePolicy, setSavingResumePolicy] = useState(false);
  const [clearingResumeVersions, setClearingResumeVersions] = useState(false);
  const [docRequests, setDocRequests] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docSubject, setDocSubject] = useState("");
  const [docMessage, setDocMessage] = useState("");
  const [docFiles, setDocFiles] = useState([]);
  const [docSending, setDocSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null);
  const [authInfo, setAuthInfo] = useState(null);
  const authConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  useEffect(() => {
    let active = true;
    api
      .get("/auth/me", { ...authConfig, noCompanyHeader: true })
      .then((res) => {
        if (!active) return;
        setAuthInfo(res.data || {});
      })
      .catch(() => {
        if (!active) return;
        setAuthInfo({});
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!authInfo?.is_manager) {
      return;
    }
    let active = true;
    api
      .get("/manager/candidates/resume-policy", authConfig)
      .then((res) => {
        if (!active) return;
        setResumePolicy(res.data || { retention_limit: 3 });
      })
      .catch(() => {
        if (!active) return;
        setResumePolicy({ retention_limit: 3 });
      });
    return () => {
      active = false;
    };
  }, [API_URL, authInfo, token]);

  const canEditCandidate = Boolean(authInfo?.is_manager || authInfo?.can_manage_onboarding);
  const isReadOnly = authInfo ? !canEditCandidate : false;
  const canViewDocs = Boolean(
    authInfo?.is_manager || authInfo?.can_manage_onboarding || authInfo?.can_manage_onboarding_limited
  );
  const canSendDocs = Boolean(authInfo?.is_manager || authInfo?.can_manage_onboarding);
  const fetchDocumentRequests = useCallback(async () => {
    if (!candidate?.id || !canViewDocs) {
      setDocRequests([]);
      return;
    }
    setDocLoading(true);
    setDocError("");
    try {
      const res = await api.get(`/manager/candidates/${candidate.id}/document-requests`, authConfig);
      setDocRequests(Array.isArray(res.data?.results) ? res.data.results : []);
    } catch (err) {
      setDocError(err.response?.data?.error || "Failed to load document requests.");
      setDocRequests([]);
    } finally {
      setDocLoading(false);
    }
  }, [API_URL, candidate?.id, canViewDocs, token]);

  useEffect(() => {
    if (!candidate?.id || !canViewDocs) return;
    fetchDocumentRequests();
  }, [candidate?.id, canViewDocs, fetchDocumentRequests]);
  useEffect(() => {
    let isActive = true;
    const fetchCandidate = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/candidates/${encodedEmail}`, authConfig);
        if (!isActive) {
          return;
        }
        const data = res.data || null;
        if (!data) {
          setCandidate(null);
          setError("Candidate not found.");
          return;
        }
        setCandidate(data);
        setName(data.name || "");
        // Try both "phone" and "candidate_phone" keys
        setPhone(data.phone || data.candidate_phone || "");
        setNotes(data.notes || "");
        setAddress(data.address || "");
        setStatus(data.status || "");
        setLinkedin(data.linkedin || "");
        setOtherLink(data.other_link || "");
        setPosition(data.position || data.job_applied || "");
        setResumeFilename(data.resume_filename || "");
        setResumeUrl(data.resume_url || "");
        setError("");
      } catch (err) {
        console.error(err);
        if (isActive) {
          setCandidate(null);
          setError(err.response?.data?.error || "Error fetching candidate.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };
    if (!encodedEmail || !token) {
      if (isActive) {
        setCandidate(null);
        setLoading(false);
        if (!encodedEmail) {
          setMessage("");
          setError("");
        } else {
          setError("Authorization required to load candidate.");
        }
      }
      return () => {
        isActive = false;
      };
    }
    fetchCandidate();
    return () => {
      isActive = false;
    };
  }, [encodedEmail, token]);

  const profileSummary = useMemo(() => {
    if (!candidate) {
      return null;
    }
    const summary = candidate.profile_summary;
    if (summary && Array.isArray(summary.sections) && summary.sections.length) {
      return summary;
    }
    if (candidate.latest_submission_profile) {
      return candidate.latest_submission_profile;
    }
    return summary || null;
  }, [candidate]);

  const bookingSummary = profileSummary?.booking_summary || null;
  const attachments = profileSummary?.attachments || [];
  const missingRequired = profileSummary?.missing_required || [];
  const submissionHistory = useMemo(() => candidate?.submission_history || [], [candidate]);
  const bookingHistory = useMemo(() => candidate?.booking_history || [], [candidate]);
  const sortedBookingHistory = useMemo(() => {
    if (!bookingHistory?.length) return [];
    return [...bookingHistory].sort((a, b) => {
      const da = new Date(`${a.date || ""}T${a.start_time || "00:00"}`);
      const db = new Date(`${b.date || ""}T${b.start_time || "00:00"}`);
      return db - da;
    });
  }, [bookingHistory]);
  const primaryBooking = useMemo(() => {
    if (bookingSummary) return bookingSummary;
    return sortedBookingHistory[0] || null;
  }, [bookingSummary, sortedBookingHistory]);
  const timelineEvents = useMemo(() => {
    if (candidate?.timeline?.length) {
      return candidate.timeline;
    }
    if (profileSummary?.timeline?.length) {
      return profileSummary.timeline;
    }
    return [];
  }, [candidate, profileSummary]);
  const hasProfileSections = Boolean(profileSummary?.sections?.length);
  const statusMenuOptions = useMemo(() => {
    if (status && !statusOptions.includes(status)) {
      return [status, ...statusOptions];
    }
    return statusOptions;
  }, [status]);
  const conversionStatus = (candidate?.conversion_status || "none").toLowerCase();
  const conversionStateLabel = (() => {
    if (conversionStatus === "pending") return "Pending manager approval";
    if (conversionStatus === "approved") return "Approved";
    if (conversionStatus === "rejected") return "Rejected";
    return "Not requested";
  })();
  const canRequestConversion =
    conversionStatus === "none" || conversionStatus === "requested" || conversionStatus === "rejected";

  const requestConversion = async () => {
    if (!candidate?.id) return;
    try {
      setMessage("");
      setError("");
      await api.post(`/recruiter/candidates/${candidate.id}/request-conversion`, {}, authConfig);
      setMessage("Conversion request submitted for manager approval.");
      setCandidate((prev) =>
        prev
          ? {
              ...prev,
              conversion_status: "pending",
            }
          : prev
      );
    } catch (err) {
      setError(err.response?.data?.error || "Failed to request conversion.");
    }
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "N/A";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  const formatDateOnly = (value) => {
    if (!value) {
      return "N/A";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString();
  };

  const formatBookingDateTime = (booking) => {
    if (!booking) return "N/A";
    const { date, start_time, timezone } = booking;
    if (!date) return "N/A";
    const tz = timezone || "UTC";
    const iso = isoFromParts(date, start_time || "00:00", tz);
    const local = iso ? new Date(iso).toLocaleString() : `${date} ${start_time || ""}`;
    return `${local}${timezone ? ` (${timezone})` : ""}`;
  };

  const formatKeyLabel = (key) => {
    if (!key) {
      return "";
    }
    return key
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null) {
      return "";
    }
    const valueNumber = Number(bytes);
    if (!Number.isFinite(valueNumber)) {
      return "";
    }
    let value = valueNumber;
    const units = ["B", "KB", "MB", "GB"];
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }
    const display = Number.isInteger(value) ? value : value.toFixed(1);
    return `${display} ${units[index]}`;
  };
  const resumeSizeLabel = formatBytes(candidate?.resume_file_size);
  const resumeUploadedLabel = formatDateTime(candidate?.resume_uploaded_at);
  const docFileList = useMemo(() => Array.from(docFiles || []), [docFiles]);
  const resumeScanStatus = (candidate?.resume_scan_status || "").toLowerCase();
  const resumeScanLabel = resumeScanStatus || "unknown";
  const resumeScanColor =
    resumeScanStatus === "clean"
      ? "success"
      : resumeScanStatus === "blocked"
      ? "error"
      : resumeScanStatus
      ? "warning"
      : "default";
  const resumeDownloadBlocked = resumeScanStatus && resumeScanStatus !== "clean";
  const resumeVersions = useMemo(() => {
    const versions = candidate?.resume_versions || candidate?.custom_data?.resume_versions || [];
    return Array.isArray(versions) ? versions : [];
  }, [candidate]);
  const resolveLink = (url) => {
    if (!url) {
      return null;
    }
    if (/^https?:/i.test(url)) {
      return url;
    }
    if (url.startsWith("/")) {
      return `${API_URL}${url}`;
    }
    return `${API_URL}/${url}`;
  };

  const handleDownloadAttachment = useCallback(
    async (file) => {
      if (!file) {
        return;
      }

      const fileId = file?.id ?? file?.file_id ?? null;
      const fallbackUrl = resolveLink(file?.url);
      const scanStatus = (file?.scan_status || "").toLowerCase();

      if (!fileId) {
        if (fallbackUrl) {
          window.open(fallbackUrl, "_blank", "noopener,noreferrer");
        } else {
          enqueueSnackbar("File is not available for download.", { variant: "warning" });
        }
        return;
      }

      if (scanStatus === "blocked") {
        enqueueSnackbar("This file was blocked by antivirus scanning and cannot be downloaded.", { variant: "error" });
        return;
      }

      setDownloadingAttachmentId(fileId);
      try {
        const response = await downloadQuestionnaireFile({
          context: "recruiter",
          fileId,
          config: { responseType: "blob" },
        });

        const headers = response?.headers || {};
        const contentType = headers["content-type"] || headers["Content-Type"] || "";

        if (contentType.includes("application/json") && typeof response?.data?.text === "function") {
          const textBody = await response.data.text();
          try {
            const payload = JSON.parse(textBody);
            const url = payload?.download?.url;
            if (url) {
              window.open(url, "_blank", "noopener,noreferrer");
              return;
            }
          } catch (parseErr) {
            console.error("Failed to parse download payload", parseErr);
          }
        }

        if (response?.data) {
          const blob = response.data;
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download =
            file?.filename ||
            file?.original_filename ||
            file?.name ||
            `questionnaire-attachment-${fileId}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          return;
        }

        enqueueSnackbar("Unable to download the file. Please try again.", { variant: "error" });
      } catch (err) {
        const detail = err?.response?.data?.error || err?.message || "Download failed.";
        enqueueSnackbar(detail, { variant: "error" });
      } finally {
        setDownloadingAttachmentId(null);
      }
    },
    [enqueueSnackbar, resolveLink]
  );

  const handleResumeDownload = useCallback(async () => {
      if (!encodedEmail) {
        enqueueSnackbar("Resume is not available.", { variant: "warning" });
        return;
      }
    setDownloadingResume(true);
    try {
      const res = await api.get(`/api/candidates/${encodedEmail}/resume-url`, authConfig);
      const url = res?.data?.url;
      if (!url) {
        enqueueSnackbar("Resume is not available.", { variant: "warning" });
        return;
      }
      setResumeUrl(url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to fetch resume URL.";
      const friendly =
        msg === "resume_scan_pending"
          ? "Resume is still being scanned. Please try again shortly."
          : msg === "resume_blocked_by_scan"
          ? "Resume download blocked by antivirus scan."
          : msg;
      enqueueSnackbar(friendly, { variant: "error" });
    } finally {
      setDownloadingResume(false);
    }
  }, [API_URL, encodedEmail, enqueueSnackbar, token]);

  const handleResumeVersionDownload = useCallback(
    async (version) => {
      if (!encodedEmail || !version) {
        enqueueSnackbar("Resume is not available.", { variant: "warning" });
        return;
      }
      const versionStatus = (version?.scan_status || "").toLowerCase();
      if (versionStatus && versionStatus !== "clean") {
        enqueueSnackbar("This resume version is not available until scanning completes.", { variant: "warning" });
        return;
      }
      const versionKey = version?.object_key;
      if (!versionKey && version?.url) {
        window.open(version.url, "_blank", "noopener,noreferrer");
        return;
      }
      setDownloadingResume(true);
      try {
        const res = await api.get(`/api/candidates/${encodedEmail}/resume-url`, {
          ...authConfig,
          params: versionKey ? { object_key: versionKey } : {},
        });
        const url = res?.data?.url;
        if (!url) {
          enqueueSnackbar("Resume is not available.", { variant: "warning" });
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        const msg = err?.response?.data?.error || "Failed to fetch resume URL.";
        const friendly =
          msg === "resume_scan_pending"
            ? "Resume is still being scanned. Please try again shortly."
            : msg === "resume_blocked_by_scan"
            ? "Resume download blocked by antivirus scan."
            : msg;
        enqueueSnackbar(friendly, { variant: "error" });
      } finally {
        setDownloadingResume(false);
      }
    },
    [API_URL, encodedEmail, enqueueSnackbar, token]
  );

  const handleDocumentDownload = async (file) => {
    if (!file?.id) return;
    try {
      setDownloadingAttachmentId(file.id);
      const res = await api.get(`/manager/candidate-documents/${file.id}/download`, authConfig);
      const url = res.data?.url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        enqueueSnackbar("Document is not available.", { variant: "warning" });
      }
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === "document_scan_pending") {
        enqueueSnackbar("Document is still being scanned. Please try again shortly.", { variant: "warning" });
      } else if (code === "document_blocked_by_scan") {
        enqueueSnackbar("Document download blocked by antivirus scan.", { variant: "error" });
      } else {
        enqueueSnackbar("Document download failed.", { variant: "error" });
      }
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const handleSendDocumentRequest = async () => {
    if (!candidate?.id) return;
    setDocSending(true);
    setDocError("");
    try {
      const formData = new FormData();
      if (docSubject.trim()) formData.append("subject", docSubject.trim());
      if (docMessage.trim()) formData.append("message", docMessage.trim());
      docFileList.forEach((file) => formData.append("attachments", file));
      await api.post(
        `/manager/candidates/${candidate.id}/document-requests`,
        formData,
        { ...authConfig, headers: { ...(authConfig.headers || {}), "Content-Type": "multipart/form-data" } }
      );
      setDocDialogOpen(false);
      setDocSubject("");
      setDocMessage("");
      setDocFiles([]);
      enqueueSnackbar("Document request sent.", { variant: "success" });
      fetchDocumentRequests();
    } catch (err) {
      setDocError(err.response?.data?.error || "Failed to send document request.");
    } finally {
      setDocSending(false);
    }
  };

  const handleCopyRequestLink = (req) => {
    if (!req?.token) return;
    const origin =
      (typeof window !== "undefined" && window.location.origin) ||
      process.env.REACT_APP_FRONTEND_URL ||
      "http://localhost:3000";
    const link = `${origin.replace(/\/$/, "")}/document-request/${req.token}`;
    navigator.clipboard.writeText(link);
    enqueueSnackbar("Upload link copied.", { variant: "success" });
  };

  const handleCloseRequest = async (req) => {
    if (!req?.id) return;
    if (!window.confirm("Mark this request as closed?")) return;
    try {
      await api.post(`/manager/candidate-document-requests/${req.id}/close`, null, authConfig);
      fetchDocumentRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || "Failed to close request.", { variant: "error" });
    }
  };

  const handleDeleteRequest = async (req) => {
    if (!req?.id || !candidate?.id) return;
    if (!window.confirm("Delete this document request and all its files?")) return;
    try {
      await api.delete(
        `/manager/candidates/${candidate.id}/document-requests/${req.id}`,
        authConfig
      );
      fetchDocumentRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || "Failed to delete request.", { variant: "error" });
    }
  };

  const handleDeleteDocumentFile = async (file) => {
    if (!file?.id) return;
    if (!window.confirm("Delete this document?")) return;
    try {
      await api.delete(`/manager/candidate-documents/${file.id}`, authConfig);
      fetchDocumentRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || "Failed to delete document.", { variant: "error" });
    }
  };

  const handleResumePolicyChange = async (value) => {
    if (!authInfo?.is_manager) return;
    const retentionLimit = Number(value);
    setResumePolicy((prev) => ({ ...prev, retention_limit: retentionLimit }));
    setSavingResumePolicy(true);
    try {
      const res = await api.put(
        "/manager/candidates/resume-policy",
        { retention_limit: retentionLimit },
        authConfig
      );
      setResumePolicy(res.data || { retention_limit: retentionLimit });
      enqueueSnackbar("Resume retention updated.", { variant: "success" });
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update resume retention.";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setSavingResumePolicy(false);
    }
  };

  const handleClearResumeVersions = async () => {
    if (!authInfo?.is_manager || !candidate?.id) return;
    if (!window.confirm("Delete all previous resume versions? This cannot be undone.")) {
      return;
    }
    setClearingResumeVersions(true);
    try {
      await api.post(
        `/manager/candidates/${candidate.id}/resume-versions/cleanup`,
        {},
        authConfig
      );
      setCandidate((prev) =>
        prev ? { ...prev, resume_versions: [] } : prev
      );
      enqueueSnackbar("Previous resume versions deleted.", { variant: "success" });
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to delete resume versions.";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setClearingResumeVersions(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!encodedEmail || !token) {
        return;
      }
      if (!canEditCandidate) {
        setMessage("");
        setError("You have read-only access to this candidate profile.");
        return;
      }
      await api.put(`/api/candidates/${encodedEmail}`,
        {
          name,
          phone, // Include phone in update
          notes,
          address,
          status,
          linkedin,
          other_link: otherLink.startsWith("http") ? otherLink : `https://${otherLink}`,
          job_applied: position,
        },
        authConfig
      );
      setMessage("Candidate updated successfully.");
      setError("");
    } catch (err) {
      console.error(err);
      setMessage("");
      setError("Failed to update candidate.");
    }
  };
  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  if (!candidate) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Candidate profile not found.</Alert>
      </Box>
    );
  }
  const headerStyle = {
    color: theme.palette.text.primary,
    fontFamily: "Poppins, sans-serif",
    fontWeight: 600,
  };
  return (
    <Box sx={{ p: 4, backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
      <Accordion defaultExpanded={true}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h4" sx={{ fontWeight: 700, ...headerStyle }}>
            Candidate Profile
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, ...headerStyle }}>
              Candidate Profile
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              {/* Personal Info */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    borderLeft: `6px solid ${theme.palette.primary.main}`,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, ...headerStyle }}>
                    Personal Info
                  </Typography>
                  <Typography><strong>Full Name:</strong> {candidate.name}</Typography>
                  <Typography><strong>Email:</strong> {candidate.email}</Typography>
                  <Typography>
                    <strong>Phone:</strong> {phone ? phone : "N/A"}
                  </Typography>
                  <Typography><strong>Address:</strong> {candidate.address || "N/A"}</Typography>
                  <Typography><strong>Recruiter ID:</strong> {candidate.recruiter_id}</Typography>
                </Paper>
              </Grid>
              {/* Job Info */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    borderLeft: `6px solid ${theme.palette.success.main}`,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, ...headerStyle }}>
                    Job Information
                  </Typography>
                  <Typography><strong>Position:</strong> {candidate.job_applied || candidate.position}</Typography>
                  <Typography><strong>Interview Stage:</strong> {candidate.interview_stage || "N/A"}</Typography>
                  <Typography>
                    <strong>Interview Date:</strong>{" "}
                    {(() => {
                      if (candidate.interview_date) {
                        const d = new Date(candidate.interview_date);
                        if (!Number.isNaN(d.getTime())) return d.toLocaleString();
                      }
                      if (primaryBooking) return formatBookingDateTime(primaryBooking);
                      return "N/A";
                    })()}
                  </Typography>
                </Paper>
              </Grid>
              {/* Online Presence */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    borderLeft: `6px solid ${theme.palette.warning.main}`,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, ...headerStyle }}>
                    Online Presence
                  </Typography>
                  <Typography>
                    <strong>LinkedIn:</strong>{" "}
                    {candidate.linkedin ? (
                      <Link
                        href={candidate.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: theme.palette.primary.main }}
                      >
                        View Profile
                      </Link>
                    ) : "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Other Link:</strong>{" "}
                    {candidate.other_link ? (
                      <Link
                        href={
                          candidate.other_link.startsWith("http")
                            ? candidate.other_link
                            : `https://${candidate.other_link}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: theme.palette.primary.main }}
                      >
                        Visit Link
                      </Link>
                    ) : "N/A"}
                  </Typography>
                </Paper>
              </Grid>
              {/* Meeting & Resume */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    borderLeft: `6px solid ${theme.palette.secondary.main}`,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, ...headerStyle }}>
                    Interview & Documents
                  </Typography>
                  <Typography>
                    <strong>Meeting Link:</strong>{" "}
                    {candidate.meeting_link || primaryBooking?.meeting_link || primaryBooking?.meeting_url ? (
                      <Link
                        href={candidate.meeting_link || primaryBooking.meeting_link || primaryBooking.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: theme.palette.primary.main }}
                      >
                        Join Meeting
                      </Link>
                    ) : "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Resume:</strong>{" "}
                    {resumeUrl || resumeFilename ? (
                      <Tooltip title="The download link refreshes automatically each time you open it.">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CloudDownloadIcon fontSize="small" />}
                          onClick={handleResumeDownload}
                          disabled={downloadingResume || resumeDownloadBlocked}
                          sx={{ textTransform: "none" }}
                        >
                          {downloadingResume ? "Loading..." : "Download Resume"}
                        </Button>
                      </Tooltip>
                    ) : "N/A"}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                    <Typography>
                      <strong>Scan Status:</strong>
                    </Typography>
                    <Chip size="small" label={resumeScanLabel} color={resumeScanColor} />
                    {resumeScanStatus === "blocked" && (
                      <Chip
                        size="small"
                        icon={<WarningAmberIcon />}
                        label="Blocked file"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  {resumeScanStatus && resumeScanStatus !== "clean" && (
                    <Typography variant="caption" color="text.secondary">
                      Downloads are disabled until scanning is complete.
                    </Typography>
                  )}
                  <Typography>
                    <strong>Resume Type:</strong> {candidate.resume_mime || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Resume Size:</strong> {resumeSizeLabel || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Uploaded:</strong> {resumeUploadedLabel || "N/A"}
                  </Typography>
                  {authInfo?.is_manager && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      <TextField
                        select
                        size="small"
                        label="Resume retention (versions)"
                        value={resumePolicy?.retention_limit ?? 3}
                        onChange={(e) => handleResumePolicyChange(e.target.value)}
                        disabled={savingResumePolicy}
                        helperText="Applies company-wide for future uploads only."
                      >
                        {[0, 1, 2, 3, 5, 10].map((limit) => (
                          <MenuItem key={limit} value={limit}>
                            {limit === 0 ? "Disable versioning" : `${limit} versions`}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={handleClearResumeVersions}
                        disabled={clearingResumeVersions || resumeVersions.length === 0}
                        sx={{ textTransform: "none", alignSelf: "flex-start" }}
                      >
                        {clearingResumeVersions ? "Clearing..." : "Delete old versions"}
                      </Button>
                    </Stack>
                  )}
                  {resumeVersions.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Previous Versions
                      </Typography>
                      <List dense sx={{ mt: 0.5 }}>
                        {resumeVersions.map((version, index) => {
                          const name = version?.filename || `Resume v${resumeVersions.length - index}`;
                          const uploaded = formatDateTime(version?.uploaded_at);
                          const sizeLabel = formatBytes(version?.file_size);
                          const versionStatus = (version?.scan_status || "").toLowerCase();
                          const versionBlocked = versionStatus && versionStatus !== "clean";
                          return (
                            <ListItem
                              key={`${version?.object_key || version?.url || name}-${index}`}
                              disableGutters
                              divider
                              alignItems="flex-start"
                            >
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                justifyContent="space-between"
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                sx={{ width: "100%" }}
                              >
                                <Stack spacing={0.5}>
                                  <Typography variant="body2">{name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {uploaded || "—"}
                                    {sizeLabel ? ` • ${sizeLabel}` : ""}
                                  </Typography>
                                  {versionStatus && (
                                    <Chip
                                      size="small"
                                      label={`Scan: ${versionStatus}`}
                                      color={
                                        versionStatus === "clean"
                                          ? "success"
                                          : versionStatus === "blocked"
                                          ? "error"
                                          : "warning"
                                      }
                                    />
                                  )}
                                  {versionStatus === "blocked" && (
                                    <Chip
                                      size="small"
                                      icon={<WarningAmberIcon />}
                                      label="Blocked file"
                                      color="error"
                                      variant="outlined"
                                    />
                                  )}
                                </Stack>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<CloudDownloadIcon fontSize="small" />}
                                  onClick={() => handleResumeVersionDownload(version)}
                                  disabled={downloadingResume || versionBlocked}
                                  sx={{ textTransform: "none" }}
                                >
                                  Download
                                </Button>
                              </Stack>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  )}
                </Paper>
              </Grid>
              {canViewDocs && (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      borderLeft: `6px solid ${theme.palette.success.main}`,
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
                      <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, ...headerStyle }}>
                          Document Requests
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Request signed documents and track uploads from the candidate.
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => setDocDialogOpen(true)}
                        disabled={!canSendDocs}
                        sx={{ textTransform: "none" }}
                      >
                        Request documents
                      </Button>
                    </Stack>

                    {docError && <Alert severity="error" sx={{ mt: 2 }}>{docError}</Alert>}

                    {docLoading ? (
                      <Box sx={{ py: 3, textAlign: "center" }}>
                        <CircularProgress />
                      </Box>
                    ) : docRequests.length === 0 ? (
                      <Typography color="text.secondary" sx={{ mt: 2 }}>
                        No document requests yet.
                      </Typography>
                    ) : (
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        {docRequests.map((req) => (
                          <Box
                            key={req.id}
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                              p: 2,
                            }}
                          >
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} justifyContent="space-between">
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {req.subject || "Document request"}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  size="small"
                                  label={req.status || "sent"}
                                  color={req.status === "returned" ? "success" : "default"}
                                />
                                {req.token && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleCopyRequestLink(req)}
                                    sx={{ textTransform: "none" }}
                                  >
                                    Copy upload link
                                  </Button>
                                )}
                                {canSendDocs && req.status !== "closed" && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleCloseRequest(req)}
                                    sx={{ textTransform: "none" }}
                                  >
                                    Close
                                  </Button>
                                )}
                                {canSendDocs && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleDeleteRequest(req)}
                                    sx={{ textTransform: "none" }}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </Stack>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              Sent {formatDateTime(req.created_at)}
                              {req.returned_at ? ` • Returned ${formatDateTime(req.returned_at)}` : ""}
                            </Typography>
                            {req.message && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                                {req.message}
                              </Typography>
                            )}

                            {Array.isArray(req.files) && req.files.length > 0 ? (
                              <List dense sx={{ mt: 1 }}>
                                {req.files.map((file) => {
                                  const status = (file.scan_status || "").toLowerCase();
                                  const blocked = status && status !== "clean";
                                  return (
                                    <ListItem key={file.id} disableGutters divider>
                                      <ListItemText
                                        primary={file.filename || "Document"}
                                        secondary={`${file.uploaded_by === "staff" ? "Sent by HR" : "Uploaded by candidate"}${status ? ` • Scan: ${status}` : ""}`}
                                      />
                                      <Stack direction="row" spacing={1}>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => handleDocumentDownload(file)}
                                          disabled={downloadingAttachmentId === file.id || blocked}
                                          sx={{ textTransform: "none" }}
                                        >
                                          Download
                                        </Button>
                                        {canSendDocs && (
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleDeleteDocumentFile(file)}
                                            sx={{ textTransform: "none" }}
                                          >
                                            Delete
                                          </Button>
                                        )}
                                      </Stack>
                                    </ListItem>
                                  );
                                })}
                              </List>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                No files uploaded yet.
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Grid>
              )}
              {/* Public booking details */}
              <Grid item xs={12}>
                <PublicBookingInfoCard
                  candidate={candidate}
                  publicHistory={candidate.public_history || []}
                  publicMeetingLink={candidate.public_meeting_link || ""}
                />
              </Grid>
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    borderLeft: `6px solid ${theme.palette.info.main}`,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, ...headerStyle }}>
                    Conversion to Employee
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography><strong>Status:</strong> {conversionStateLabel}</Typography>
                      {conversionStatus !== "none" && (
                        <Chip
                          size="small"
                          label={conversionStatus}
                          color={
                            conversionStatus === "approved"
                              ? "success"
                              : conversionStatus === "rejected"
                              ? "error"
                              : "warning"
                          }
                        />
                      )}
                    </Stack>
                    {candidate.conversion_requested_at && (
                      <Typography>
                        <strong>Requested:</strong> {formatDateTime(candidate.conversion_requested_at)}
                      </Typography>
                    )}
                    {candidate.conversion_reviewed_at && (
                      <Typography>
                        <strong>Reviewed:</strong> {formatDateTime(candidate.conversion_reviewed_at)}
                      </Typography>
                    )}
                    {candidate.conversion_rejection_reason && (
                      <Alert severity="error">
                        Rejection reason: {candidate.conversion_rejection_reason}
                      </Alert>
                    )}
                    {candidate.employee_recruiter_id && (
                      <Typography>
                        <strong>Employee profile:</strong>{" "}
                        <Link
                          href={`/manager/employee-profiles?employee_id=${candidate.employee_recruiter_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: theme.palette.primary.main }}
                        >
                          Open profile
                        </Link>
                      </Typography>
                    )}
                    {canRequestConversion && (
                      <Button
                        variant="contained"
                        onClick={requestConversion}
                        sx={{ alignSelf: "flex-start" }}
                      >
                        Request manager approval
                      </Button>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
            <Divider sx={{ my: 4 }}>
              <Chip label="Update Details" color="primary" />
            </Divider>
            <Stack spacing={3}>
              {isReadOnly && (
                <Alert severity="info">
                  Read-only access: updates require full HR onboarding permissions.
                </Alert>
              )}
              <TextField
                label="Full Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isReadOnly}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="Phone Number"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isReadOnly}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="LinkedIn URL"
                fullWidth
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                disabled={isReadOnly}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="Other Link (e.g., portfolio)"
                fullWidth
                value={otherLink}
                onChange={(e) => setOtherLink(e.target.value)}
                disabled={isReadOnly}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="Position / Job Applied For"
                fullWidth
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={isReadOnly}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="Address (Optional)"
                fullWidth
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isReadOnly}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="Explanation / Notes"
                fullWidth
                multiline
                minRows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isReadOnly}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                select
                label="Status"
                fullWidth
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isReadOnly}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              >
                {statusOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                size="large"
                sx={{ mt: 1, fontFamily: "Poppins, sans-serif" }}
                onClick={handleSave}
                disabled={isReadOnly}
              >
                Save Changes
              </Button>
              {message && <Alert severity="success">{message}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </Paper>
        </AccordionDetails>

      {profileSummary && (
        <Accordion defaultExpanded={hasProfileSections} sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h4" sx={{ fontWeight: 700, ...headerStyle }}>
              Intake Responses
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {missingRequired.length > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Missing required fields captured during intake.
                <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {missingRequired.map((key) => (
                    <Chip key={key} label={formatKeyLabel(key)} size="small" color="warning" variant="outlined" />
                  ))}
                </Box>
              </Alert>
            )}

            {bookingSummary && (
              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  borderLeft: `6px solid ${theme.palette.info.main}`,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, ...headerStyle }}>
                  Interview Slot
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2">Date</Typography>
                    <Typography>{formatDateOnly(bookingSummary.date)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2">Start</Typography>
                    <Typography>{bookingSummary.start_time || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2">End</Typography>
                    <Typography>{bookingSummary.end_time || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2">Timezone</Typography>
                    <Typography>{bookingSummary.timezone || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2">Meeting Link</Typography>
                    {bookingSummary.meeting_link ? (
                      <Link
                        href={resolveLink(bookingSummary.meeting_link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: theme.palette.primary.main }}
                      >
                        Join Meeting
                      </Link>
                    ) : (
                      <Typography color="text.secondary">N/A</Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2">Cancellation Link</Typography>
                    {bookingSummary.cancel_link ? (
                      <Link
                        href={resolveLink(bookingSummary.cancel_link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: theme.palette.primary.main }}
                      >
                        Manage Booking
                      </Link>
                    ) : (
                      <Typography color="text.secondary">N/A</Typography>
                    )}
                  </Grid>
                  {bookingSummary.location && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Location</Typography>
                      <Typography>{bookingSummary.location}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}

            {hasProfileSections ? (
              <Stack spacing={3}>
                {profileSummary.sections.map((section, index) => (
                  <Paper
                    key={`${section.title || section.key || "section"}-${index}`}
                    sx={{
                      p: 3,
                      borderLeft: `6px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, ...headerStyle }}>
                      {section.title || `Section ${index + 1}`}
                    </Typography>
                    {section.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {section.description}
                      </Typography>
                    )}
                    <Grid container spacing={2}>
                      {(section.fields || []).map((field) => (
                        <Grid item xs={12} sm={6} key={`${section.title || section.key || "section"}-${field.key || field.label}`}>
                          <Typography variant="subtitle2">{field.label || formatKeyLabel(field.key)}</Typography>
                          <Typography sx={{ whiteSpace: "pre-wrap" }}>{field.value || "—"}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">No intake responses captured yet.</Typography>
            )}

            {attachments.length > 0 && (
              <Paper
                sx={{
                  p: 3,
                  mt: 3,
                  borderLeft: `6px solid ${theme.palette.secondary.main}`,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, ...headerStyle }}>
                  Attachments
                </Typography>
                <List dense>
                  {attachments.map((file, index) => {
                    const fileId = file?.id ?? file?.file_id ?? null;
                    const name = file?.filename || file?.original_filename || `Attachment ${index + 1}`;
                    const scanStatus = (file?.scan_status || "").toLowerCase();
                    const isBlocked = scanStatus === "blocked";
                    const isPending = scanStatus && scanStatus !== "clean" && scanStatus !== "blocked";
                    const fallbackUrl = resolveLink(file?.url);
                    const sizeLabel = typeof file?.file_size === "number" ? formatBytes(file.file_size) : "";
                    const downloading = fileId ? downloadingAttachmentId === fileId : false;
                    const secondaryLabel = file.label || formatKeyLabel(file.key);
                    return (
                      <ListItem
                        key={`${file.key || fileId || "attachment"}-${index}`}
                        disableGutters
                        divider
                        alignItems="flex-start"
                      >
                        <Stack spacing={0.75} sx={{ width: "100%" }}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="subtitle2">{name}</Typography>
                              {sizeLabel && (
                                <Typography variant="body2" color="text.secondary">
                                  {sizeLabel}
                                </Typography>
                              )}
                              {scanStatus && (
                                <Chip
                                  size="small"
                                  color={
                                    scanStatus === "clean"
                                      ? "success"
                                      : scanStatus === "blocked"
                                      ? "error"
                                      : "warning"
                                  }
                                  label={`Scan: ${scanStatus}`}
                                />
                              )}
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                              {fileId ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<CloudDownloadIcon fontSize="small" />}
                                  disabled={downloading || isBlocked}
                                  onClick={() => handleDownloadAttachment(file)}
                                >
                                  {isBlocked ? "Blocked" : downloading ? "Downloading..." : "Download"}
                                </Button>
                              ) : fallbackUrl ? (
                                <Button
                                  size="small"
                                  component="a"
                                  href={fallbackUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  variant="outlined"
                                  startIcon={<CloudDownloadIcon fontSize="small" />}
                                >
                                  Open
                                </Button>
                              ) : null}
                            </Stack>
                          </Stack>
                          {secondaryLabel && (
                            <Typography variant="body2" color="text.secondary">
                              {secondaryLabel}
                            </Typography>
                          )}
                          {isBlocked && (
                            <Alert severity="error">This file was blocked by antivirus scanning.</Alert>
                          )}
                          {isPending && (
                            <Alert severity="info">Scanning in progress. The download will become available once scanning completes.</Alert>
                          )}
                        </Stack>
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>

            )}
          </AccordionDetails>
        </Accordion>
      )}

      {timelineEvents.length > 0 && (
        <Accordion defaultExpanded sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h4" sx={{ fontWeight: 700, ...headerStyle }}>
              Timeline
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {timelineEvents.map((event, index) => (
                <ListItem key={`${event.type || "event"}-${index}`} disableGutters divider>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" color="info" label={formatKeyLabel(event.type || "event")} />
                        <Typography variant="subtitle2">{event.label || "Event"}</Typography>
                      </Stack>
                    }
                    secondary={formatDateTime(event.timestamp)}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {submissionHistory.length > 0 && (
        <Accordion sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h4" sx={{ fontWeight: 700, ...headerStyle }}>
              Submission History
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Submission</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Profession</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell>Submitted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissionHistory.map((submission) => (
                  <TableRow key={submission.id} hover>
                    <TableCell>#{submission.id}</TableCell>
                    <TableCell>{submission.template?.name || "—"}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{submission.status || "—"}</TableCell>
                    <TableCell>{submission.profession_key || "—"}</TableCell>
                    <TableCell>{formatDateTime(submission.updated_at)}</TableCell>
                    <TableCell>{formatDateTime(submission.submitted_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      )}

      {sortedBookingHistory.length > 0 && (
        <Accordion sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h4" sx={{ fontWeight: 700, ...headerStyle }}>
              Booking History
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Timezone</TableCell>
                  <TableCell>Meeting</TableCell>
                  <TableCell>Cancel Token</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedBookingHistory.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>#{entry.id}</TableCell>
                    <TableCell>{formatDateOnly(entry.date)}</TableCell>
                    <TableCell>{entry.start_time || "—"}</TableCell>
                    <TableCell>{entry.end_time || "—"}</TableCell>
                    <TableCell>{entry.timezone || "—"}</TableCell>
                    <TableCell>
                      {entry.meeting_link ? (
                        <Link
                          href={resolveLink(entry.meeting_link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: theme.palette.primary.main }}
                        >
                          Join
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{entry.cancellation_token || "—"}</TableCell>
                    <TableCell>{entry.location || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      )}

      <Dialog
        open={docDialogOpen}
        onClose={() => setDocDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Request signed documents</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Email subject"
              value={docSubject}
              onChange={(e) => setDocSubject(e.target.value)}
              placeholder="Document signing request by your company"
              fullWidth
            />
            <TextField
              label="Message"
              value={docMessage}
              onChange={(e) => setDocMessage(e.target.value)}
              placeholder="Add any instructions for the candidate..."
              multiline
              minRows={3}
              fullWidth
            />
            <Box>
              <Button variant="outlined" component="label" sx={{ textTransform: "none" }}>
                Attach files
                <input
                  hidden
                  multiple
                  type="file"
                  onChange={(e) => setDocFiles(e.target.files)}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Accepted: PDF, DOC, DOCX, PNG, JPG. Max 25MB per file.
              </Typography>
              {docFileList.length > 0 && (
                <List dense sx={{ mt: 1 }}>
                  {docFileList.map((file) => (
                    <ListItem key={`${file.name}-${file.size}`} disableGutters>
                      <ListItemText primary={file.name} secondary={`${Math.round(file.size / 1024)} KB`} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
            {docError && <Alert severity="error">{docError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocDialogOpen(false)} disabled={docSending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSendDocumentRequest} disabled={docSending}>
            {docSending ? "Sending..." : "Send request"}
          </Button>
        </DialogActions>
      </Dialog>

      </Accordion>
    </Box>
  );
};
export default RecruiterCandidates;
