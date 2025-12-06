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
  Grid,
  Link,
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
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { useSnackbar } from "notistack";
import { downloadQuestionnaireFile } from "./utils/questionnaireUploads";
import PublicBookingInfoCard from "./components/PublicBookingInfoCard";
import { isoFromParts } from "./utils/datetime";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const statusOptions = ["booked", "interviewed", "rejected", "hired", "on-hold"];
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null);
  useEffect(() => {
    let isActive = true;
    const fetchCandidate = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/candidates/${encodedEmail}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  const handleSave = async () => {
    try {
      if (!encodedEmail || !token) {
        return;
      }
      await axios.put(`${API_URL}/api/candidates/${encodedEmail}`,
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
        { headers: { Authorization: `Bearer ${token}` } }
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
                    {resumeFilename ? (
                      <Link
                        href={`http://localhost:5000/uploads/resume/${encodeURIComponent(resumeFilename)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        sx={{ color: theme.palette.primary.main }}
                      >
                        Download Resume
                      </Link>
                    ) : "N/A"}
                  </Typography>
                </Paper>
              </Grid>
              {/* Public booking details */}
              <Grid item xs={12}>
                <PublicBookingInfoCard
                  candidate={candidate}
                  publicHistory={candidate.public_history || []}
                  publicMeetingLink={candidate.public_meeting_link || ""}
                />
              </Grid>
            </Grid>
            <Divider sx={{ my: 4 }}>
              <Chip label="Update Details" color="primary" />
            </Divider>
            <Stack spacing={3}>
              <TextField
                label="Full Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="Phone Number"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="LinkedIn URL"
                fullWidth
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="Other Link (e.g., portfolio)"
                fullWidth
                value={otherLink}
                onChange={(e) => setOtherLink(e.target.value)}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="Position / Job Applied For"
                fullWidth
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="Address (Optional)"
                fullWidth
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                label="Explanation / Notes"
                fullWidth
                multiline
                minRows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ fontFamily: "Poppins, sans-serif" }}
              />
              <TextField
                select
                label="Status"
                fullWidth
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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

      </Accordion>
    </Box>
  );
};
export default RecruiterCandidates;
