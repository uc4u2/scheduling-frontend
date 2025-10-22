
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useParams } from "react-router-dom";
import axios from "axios";
import QUESTIONNAIRE_LIMITS from "../constants/questionnaireUploads";
import { candidateIntakeApi } from "../utils/api";
import { uploadQuestionnaireFile, downloadQuestionnaireFile } from "../utils/questionnaireUploads";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const BOOKING_CAPTURED_KEYS = new Set([
  "candidate_name",
  "full_name",
  "name",
  "email",
  "email_address",
  "phone",
  "phone_number",
  "candidate_email",
  "candidate_phone",
  "candidate_position",
  "linkedin",
  "other_link"
]);

const normaliseOptions = (options) => {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map((option) => {
      if (option && typeof option === "object") {
        const value = option.value ?? option.id ?? option.key ?? option.name ?? option.label;
        const label = option.label ?? option.name ?? String(value ?? "");
        return { value, label };
      }
      return { value: option, label: String(option) };
    });
  }
  if (typeof options === "object") {
    return Object.entries(options).map(([value, label]) => ({ value, label: String(label) }));
  }
  return [];
};

const normaliseField = (field) => {
  if (!field) return null;
  const key = field.key || field.id;
  if (!key) return null;
  const type = String(field.type || field.field_type || "text").toLowerCase();
  const config = field.config || {};
  const options = normaliseOptions(field.options || config.options);
  const orderIndex = field.order_index ?? field.order ?? 0;
  return {
    key,
    type,
    label: field.label || key,
    placeholder: field.placeholder || "",
    helperText: field.help_text || field.description || "",
    section: field.section || field.group || null,
    isRequired: Boolean(field.is_required || field.required),
    options,
    orderIndex,
  };
};

const buildSections = (template) => {

  if (!template) return [];

  const fields = (template.fields || [])

    .map(normaliseField)

    .filter(Boolean)

    .filter((field) => !BOOKING_CAPTURED_KEYS.has((field.key || '').toLowerCase()))

    .sort((a, b) => a.orderIndex - b.orderIndex);



  if (!fields.length) return [];



  const grouped = new Map();

  fields.forEach((field) => {

    const key = field.section || 'Candidate details';

    if (!grouped.has(key)) {

      grouped.set(key, []);

    }

    grouped.get(key).push(field);

  });



  return Array.from(grouped.entries())

    .map(([title, sectionFields]) => ({ title, fields: sectionFields }))

    .filter((section) => section.fields.length > 0);

};



const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  let value = Number(bytes);
  if (!Number.isFinite(value)) {
    return "";
  }
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  const display = value % 1 === 0 ? value : value.toFixed(1);
  return `${display} ${units[index]}`;
};



const CandidateIntakePage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [slots, setSlots] = useState([]);
  const [timezone, setTimezone] = useState("UTC");
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingMessage, setBookingMessage] = useState({ severity: "info", message: "" });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookedSlotInfo, setBookedSlotInfo] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [candidateBasics, setCandidateBasics] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    candidatePosition: "",
    linkedin: "",
    otherLink: "",
  });

  const [questionnaires, setQuestionnaires] = useState([]);
  const [storageInfo, setStorageInfo] = useState(QUESTIONNAIRE_LIMITS);
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [uploadStates, setUploadStates] = useState({});

  const sortedQuestionnaires = useMemo(
    () =>
      (questionnaires || [])
        .slice()
        .sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0)),
    [questionnaires]
  );
  const allowedMimeList = useMemo(() => {
    const list = storageInfo?.allowed_mime || storageInfo?.allowedMime;
    return Array.isArray(list) && list.length ? list : QUESTIONNAIRE_LIMITS.allowedMime;
  }, [storageInfo]);

  const fetchSubmission = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await candidateIntakeApi.get(token);
      setTemplate(data.template || {});
      setSubmission(data.submission || {});
      setQuestionnaires(Array.isArray(data.questionnaires) ? data.questionnaires : []);
      const storage = data.storage || {};
      const allowedMime = storage.allowed_mime || storage.allowedMime || QUESTIONNAIRE_LIMITS.allowedMime;
      setStorageInfo({
        ...QUESTIONNAIRE_LIMITS,
        ...storage,
        allowed_mime: allowedMime,
        allowedMime,
      });
      const files = Array.isArray(data.submission?.files) ? data.submission.files : [];
      setSubmissionFiles(files);
      setUploadStates({});
      const submissionResponses = data.submission?.responses || {};
      setResponses(submissionResponses);
      const confirmed = Boolean(submissionResponses.booking_confirmed);
      setBookingSuccess(confirmed);
      setBookingMessage({ severity: "info", message: "" });
      setBookedSlotInfo(
        confirmed
          ? {
              id: submissionResponses.slot_booking_id || null,
              date: submissionResponses.slot_booking_date || null,
              start: submissionResponses.slot_booking_start || null,
              end: submissionResponses.slot_booking_end || null,
              timezone: submissionResponses.slot_booking_timezone || data.submission?.timezone || "UTC",
              meetingLink: submissionResponses.slot_booking_meeting_link || null,
              location: submissionResponses.slot_booking_location || null,
              cancelLink: submissionResponses.slot_booking_cancel_link || null,
            }
          : null
      );
      const defaults = {
        candidateName: data.submission?.invite_name || submissionResponses.full_name || "",
        candidateEmail: data.submission?.invite_email || submissionResponses.email || "",
        candidatePhone: data.submission?.invite_phone || submissionResponses.phone || "",
        candidatePosition: submissionResponses.candidate_position || "",
        linkedin: submissionResponses.linkedin || "",
        otherLink: submissionResponses.other_link || "",
      };
      setCandidateBasics((prev) => ({ ...prev, ...defaults }));
    } catch (err) {
      const detail = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to load intake";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSlots = useCallback(async (recruiterId) => {
    if (!recruiterId) return;
    setSlotsLoading(true);
    setSlotsError("");
    try {
      const { data } = await axios.get(`${API_BASE}/public/availability/${recruiterId}`);
      setSlots(data?.available_slots || []);
      setTimezone(data?.timezone || "UTC");
    } catch (err) {
      setSlotsError(err.response?.data?.error || err.message || "Failed to load available slots.");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  useEffect(() => {
    if (submission?.recruiter_id) {
      fetchSlots(submission.recruiter_id);
    }
  }, [submission?.recruiter_id, fetchSlots]);

  const sections = useMemo(() => buildSections(template), [template]);
  const isReadOnly = submission?.status === "submitted";

  const upcomingSlots = useMemo(() => {
    const now = new Date();
    return (slots || [])
      .filter((slot) => {
        if (!slot?.date || !slot?.start_time) return false;
        const slotStart = new Date(`${slot.date}T${slot.start_time}`);
        return slotStart >= now;
      })
      .sort((a, b) =>
        new Date(`${a.date}T${a.start_time}`) - new Date(`${b.date}T${b.start_time}`)
      );
  }, [slots]);

  const groupedSlots = useMemo(() => {
    return upcomingSlots.reduce((acc, slot) => {
      (acc[slot.date] = acc[slot.date] || []).push(slot);
      return acc;
    }, {});
  }, [upcomingSlots]);

  const sortedDateKeys = useMemo(() =>
    Object.keys(groupedSlots).sort((a, b) => new Date(`${a}T00:00:00`) - new Date(`${b}T00:00:00`)),
  [groupedSlots]);

  const dateHeadingFormatter = useMemo(() =>
    new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
  []);

  const formatDateHeading = (dateStr) => {
    try {
      return dateHeadingFormatter.format(new Date(`${dateStr}T00:00:00`));
    } catch (error) {
      return dateStr;
    }
  };

  const formatTime = (dateStr, timeStr, tz) => {
    try {
      const date = new Date(`${dateStr}T${timeStr}`);
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: tz,
      }).format(date);
    } catch (error) {
      return timeStr;
    }
  };

  const selectedSlot = useMemo(() => upcomingSlots.find((slot) => slot.id === selectedSlotId) || null, [upcomingSlots, selectedSlotId]);

  const bookedSlotLabel = (() => {
    if (!bookingSuccess || !bookedSlotInfo) return "";
    const tzLabel = bookedSlotInfo?.timezone || timezone;
    if (bookedSlotInfo?.date && bookedSlotInfo?.start && bookedSlotInfo?.end) {
      return `Interview slot confirmed for ${formatDateHeading(bookedSlotInfo.date)} � ${formatTime(bookedSlotInfo.date, bookedSlotInfo.start, tzLabel)} - ${formatTime(bookedSlotInfo.date, bookedSlotInfo.end, tzLabel)} (${tzLabel})`;
    }
    return "Interview slot confirmed.";
  })();

  const bookedSlotLocation = bookingSuccess && bookedSlotInfo ? bookedSlotInfo.location || "" : "";
  const bookedSlotMeetingLink = bookingSuccess && bookedSlotInfo ? bookedSlotInfo.meetingLink || "" : "";
  const bookedSlotCancelLink = bookingSuccess && bookedSlotInfo ? bookedSlotInfo.cancelLink || "" : "";

  const handleSelectSlot = useCallback((slotId) => {
    setSelectedSlotId((current) => (current === slotId ? null : slotId));
  }, []);

  const handleBasicsChange = useCallback((field) => (event) => {
    const value = event?.target?.value ?? "";
    setCandidateBasics((prev) => ({ ...prev, [field]: value }));
    setResponses((prev) => {
      if (field === "candidateName") {
        return { ...prev, full_name: value, name: value };
      }
      if (field === "candidateEmail") {
        return { ...prev, email: value };
      }
      if (field === "candidatePhone") {
        return { ...prev, phone: value };
      }
      return prev;
    });
  }, []);

  const handleQuestionnaireFileSelect = useCallback(
    async (templateId, file) => {
      if (!submission?.id || !file) {
        return;
      }
      const fieldKey = `questionnaire_${templateId}`;
      setUploadStates((prev) => ({
        ...prev,
        [fieldKey]: { stage: "reserve", percent: 0, loading: true, error: null },
      }));
      try {
        const uploaded = await uploadQuestionnaireFile({
          context: "candidate",
          submissionId: submission.id,
          fieldKey,
          file,
          intakeToken: token,
          onProgress: ({ percent }) => {
            const safePercent = Number.isFinite(percent) ? Math.round(percent) : 0;
            setUploadStates((prev) => ({
              ...prev,
              [fieldKey]: {
                ...(prev[fieldKey] || {}),
                stage: "upload",
                percent: safePercent,
                loading: true,
                error: null,
              },
            }));
          },
        });
        setSubmissionFiles((prev) => {
          const filtered = prev.filter((item) => item.field_key !== fieldKey);
          return [...filtered, uploaded];
        });
        setSubmission((prev) =>
          prev
            ? {
                ...prev,
                files: Array.isArray(prev.files)
                  ? [...prev.files.filter((item) => item.field_key !== fieldKey), uploaded]
                  : [uploaded],
              }
            : prev
        );
        setUploadStates((prev) => ({
          ...prev,
          [fieldKey]: { stage: "complete", percent: 100, loading: false, error: null },
        }));
      } catch (err) {
        const detail = err?.response?.data?.error || err?.message || "Upload failed";
        setUploadStates((prev) => ({
          ...prev,
          [fieldKey]: { stage: "error", percent: 0, loading: false, error: detail },
        }));
        setError(detail);
      }
    },
    [submission?.id, token]
  );

  const handleDownloadQuestionnaireFile = useCallback(
    async (file) => {
      try {
        const response = await downloadQuestionnaireFile({
          context: "candidate",
          fileId: file.id,
          intakeToken: token,
          config: { responseType: "blob" },
        });
        const headers = response?.headers || {};
        const contentType =
          headers["content-type"] || headers["Content-Type"] || "";
        if (contentType.includes("application/json")) {
          const text = await response.data.text();
          const payload = JSON.parse(text);
          const url = payload?.download?.url;
          if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
            return;
          }
        } else if (response?.data) {
          const blob = response.data;
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = file.original_filename || `questionnaire-${file.id}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          return;
        }
        setError("Unable to download the file. Please try again.");
      } catch (err) {
        const detail = err?.response?.data?.error || err?.message || "Download failed.";
        setError(detail);
      }
    },
    [token]
  );

  const handleSaveProgress = useCallback(async () => {
    if (!token) return;
    setSubmitting(true);
    setSaveMessage("");
    setError("");
    try {
      const data = await candidateIntakeApi.save(token, { responses });
      if (data?.responses) {
        setResponses(data.responses);
      }
      setSubmission((prev) => (prev ? { ...prev, responses: data?.responses || responses } : prev));
      setSaveMessage("Progress saved.");
    } catch (err) {
      const detail = err.response?.data?.error || err.message || "Failed to save progress";
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  }, [token, responses]);

  const handleBookSlot = useCallback(async () => {
    if (!submission?.recruiter_id || !selectedSlot) {
      setBookingMessage({ severity: "warning", message: "Please pick a slot to book." });
      return;
    }
    const { candidateName, candidateEmail, candidatePhone, candidatePosition, linkedin, otherLink } = candidateBasics;
    if (!candidateName || !candidateEmail || !candidatePhone || !candidatePosition) {
      setBookingMessage({ severity: "warning", message: "Please provide your name, email, phone, and position before booking." });
      return;
    }
    setBookingMessage({ severity: "info", message: "" });
    const slotDetails = selectedSlot;
    try {
      setBookingSaving(true);
      const formData = new FormData();
      formData.append("candidate_name", candidateName);
      formData.append("candidate_email", candidateEmail);
      formData.append("candidate_phone", candidatePhone);
      formData.append("candidate_position", candidatePosition);
      formData.append("availability_id", slotDetails.id);
      if (linkedin) formData.append("linkedin", linkedin);
      if (otherLink) formData.append("other_link", otherLink);
      if (resumeFile) formData.append("resume", resumeFile);

      const { data } = await axios.post(`${API_BASE}/api/candidate-forms/intake/${token}/book-slot`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedResponses = data.responses || {};
      setResponses(updatedResponses);
      setBookingSuccess(Boolean(data.booking_confirmed));
      const slotSummary = data.slot || null;
      setSlots((prev) => prev.filter((slot) => slot.id !== (slotSummary?.id ?? slotDetails.id)));
      setSelectedSlotId(null);
      setResumeFile(null);
      setBookedSlotInfo(
        slotSummary
          ? {
              id: slotSummary.id ?? slotDetails.id,
              date: slotSummary.date ?? slotDetails.date,
              start: slotSummary.start_time ?? slotDetails.start_time,
              end: slotSummary.end_time ?? slotDetails.end_time,
              timezone: slotSummary.timezone || updatedResponses.slot_booking_timezone || timezone,
              meetingLink: slotSummary.meeting_link || data.meeting_link || updatedResponses.slot_booking_meeting_link || null,
              location: slotSummary.location || updatedResponses.slot_booking_location || null,
              cancelLink: data.cancellation_link || updatedResponses.slot_booking_cancel_link || null,
            }
          : null
      );
      setBookingMessage({ severity: "success", message: data.message || "Interview slot booked successfully." });
      setSubmission((prev) =>
        prev
          ? {
              ...prev,
              responses: updatedResponses,
              status: prev.status === "submitted" ? prev.status : "in_progress",
            }
          : prev
      );
    } catch (err) {
      console.error('slot booking failed', err);
      const detail =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (typeof err?.message === "string" ? err.message : "Failed to book slot.");
      setBookingMessage({ severity: "error", message: detail });
    } finally {
      setBookingSaving(false);
    }
  }, [submission?.recruiter_id, selectedSlot, candidateBasics, resumeFile, token, timezone]);


const handleSubmit = useCallback(async () => {
    if (!token) return;
    if (!bookingSuccess && !isReadOnly) {
      setError("Please book an interview slot before submitting the form.");
      return;
    }

    if (questionnaires.length) {
      const missingRequired = questionnaires.filter((assignment) =>
        assignment?.required !== false &&
        !submissionFiles.some((file) => file.field_key === `questionnaire_${assignment.template_id}`)
      );
      if (missingRequired.length) {
        setError("Please upload the required questionnaire documents before submitting.");
        return;
      }
    }

    const blockedFiles = submissionFiles.filter((file) => (file.scan_status || "").toLowerCase() === "blocked");
    if (blockedFiles.length) {
      setError("One or more uploads were blocked by antivirus scanning. Please replace them before submitting.");
      return;
    }

    const pendingFiles = submissionFiles.filter((file) => {
      const status = (file.scan_status || "").toLowerCase();
      return status && status !== "clean";
    });
    if (pendingFiles.length) {
      setError("File uploads are still pending antivirus scanning. Please wait until they complete.");
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setError("");
    setSuccess(false);
    try {
      const data = await candidateIntakeApi.submit(token, { responses });
      if (data?.submission) {
        setSubmission(data.submission);
        if (Array.isArray(data.submission.files)) {
          setSubmissionFiles(data.submission.files);
        }
      } else if (data) {
        setSubmission(data);
      }
      if (Array.isArray(data?.questionnaires)) {
        setQuestionnaires(data.questionnaires);
      }
      setSuccess(true);
    } catch (err) {
      if (err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
        setError("Please review the highlighted fields.");
      } else {
        const detail = err.response?.data?.error || err.message || "Submission failed";
        setError(detail);
      }
    } finally {
      setSubmitting(false);
    }
  }, [token, responses, bookingSuccess, isReadOnly, questionnaires, submissionFiles]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sections.length && !submission && error) {
    return (
      <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
        <Paper sx={{ maxWidth: 560, p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Intake unavailable
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  const heading = submission?.invite_name || template?.name || "Candidate intake";
  const description = template?.description || "Please complete the following information.";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 }, px: 2 }}>
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Paper elevation={4} sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={5}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {heading}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {description}
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                Step 1 � Pick an interview slot
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select a time that works best for you, then confirm the booking. The form below unlocks after your slot is reserved.
              </Typography>

              {slotsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {slotsError}
                </Alert>
              )}

              {bookingMessage.message && (
                <Alert severity={bookingMessage.severity} sx={{ mb: 2 }} onClose={() => setBookingMessage({ severity: "info", message: "" })}>
                  {bookingMessage.message}
                </Alert>
              )}

              {bookingSuccess && bookedSlotInfo && bookedSlotLabel && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {bookedSlotLabel}
                  {bookedSlotLocation && (
                    <>
                      <br />
                      Location: {bookedSlotLocation}
                    </>
                  )}
                  {bookedSlotMeetingLink && (
                    <>
                      <br />
                      <a href={bookedSlotMeetingLink} target="_blank" rel="noopener noreferrer">
                        Join meeting
                      </a>
                    </>
                  )}
                  {bookedSlotCancelLink && (
                    <>
                      <br />
                      Cancellation link:{' '}
                      <a href={bookedSlotCancelLink} target="_blank" rel="noopener noreferrer">
                        {bookedSlotCancelLink}
                      </a>
                    </>
                  )}
                </Alert>
              )}

              {slotsLoading ? (
                <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <>
                  {sortedDateKeys.length ? (
                    sortedDateKeys.map((dateKey, index) => {
                      const slotsForDate = groupedSlots[dateKey] || [];
                      return (
                        <Accordion key={dateKey} defaultExpanded={index === 0} sx={{ mt: index === 0 ? 2 : 1 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box>
                              <Typography variant="subtitle1">{formatDateHeading(dateKey)}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Times shown in {timezone}
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack direction="row" spacing={1.5} flexWrap="wrap">
                              {slotsForDate.map((slot) => {
                                const isSelected = selectedSlotId === slot.id;
                                return (
                                  <Button
                                    key={slot.id}
                                    variant={isSelected ? "contained" : "outlined"}
                                    color={isSelected ? "primary" : "inherit"}
                                    onClick={() => handleSelectSlot(slot.id)}
                                    disabled={bookingSuccess}
                                  >
                                    {formatTime(slot.date, slot.start_time, timezone)} � {formatTime(slot.date, slot.end_time, timezone)}
                                  </Button>
                                );
                              })}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No available slots at the moment. Please check back soon or contact the recruiter.
                    </Alert>
                  )}
                </>
              )}

              <Stack spacing={2} sx={{ mt: 3 }}>
                <TextField
                  label="Your name"
                  value={candidateBasics.candidateName}
                  onChange={handleBasicsChange("candidateName")}
                  required
                  fullWidth
                  disabled={bookingSaving || bookingSuccess}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={candidateBasics.candidateEmail}
                  onChange={handleBasicsChange("candidateEmail")}
                  required
                  fullWidth
                  disabled={bookingSaving || bookingSuccess}
                />
                <TextField
                  label="Phone number"
                  value={candidateBasics.candidatePhone}
                  onChange={handleBasicsChange("candidatePhone")}
                  required
                  fullWidth
                  disabled={bookingSaving || bookingSuccess}
                />
                <TextField
                  label="Purpose of this appointment"
                  value={candidateBasics.candidatePosition}
                  onChange={handleBasicsChange("candidatePosition")}
                  required
                  fullWidth
                  disabled={bookingSaving || bookingSuccess}
                />
                <TextField
                  label="Reference link (optional)"
                  value={candidateBasics.linkedin}
                  onChange={handleBasicsChange("linkedin")}
                  fullWidth
                  disabled={bookingSaving || bookingSuccess}
                />
                <TextField
                  label="Other relevant link (optional)"
                  value={candidateBasics.otherLink}
                  onChange={handleBasicsChange("otherLink")}
                  fullWidth
                  disabled={bookingSaving || bookingSuccess}
                />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Resume (optional)
                  </Typography>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                    disabled={bookingSaving || bookingSuccess}
                  />
                </Box>
                <Box>
                  <Button
                    variant="contained"
                    onClick={handleBookSlot}
                    disabled={bookingSaving || bookingSuccess || !selectedSlot}
                  >
                    {bookingSaving ? "Booking..." : bookingSuccess ? "Slot booked" : "Confirm slot"}
                  </Button>
                  {selectedSlot && !bookingSuccess && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      Selected: {formatDateHeading(selectedSlot.date)} � {formatTime(selectedSlot.date, selectedSlot.start_time, timezone)} � {formatTime(selectedSlot.date, selectedSlot.end_time, timezone)}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>

            {sortedQuestionnaires.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Step 2 � Upload questionnaire documents
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Allowed types: {allowedMimeList.join(', ')} � Max {storageInfo?.maxFileMb ?? QUESTIONNAIRE_LIMITS.maxFileMb} MB per file
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {sortedQuestionnaires.map((assignment) => {
                    const template = assignment.template || {};
                    const fieldKey = `questionnaire_${assignment.template_id}`;
                    const existingFile = submissionFiles.find((file) => file.field_key === fieldKey);
                    const uploadState = uploadStates[fieldKey];
                    const isRequired = assignment?.required !== false;
                    const scanStatus = (existingFile?.scan_status || "").toLowerCase();
                    const isPending = scanStatus && scanStatus !== "clean" && scanStatus !== "blocked";
                    const isBlocked = scanStatus === "blocked";
                    return (
                      <Paper key={assignment.template_id} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }} elevation={0}>
                        <Stack spacing={1.5}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {template.name || `Questionnaire #${assignment.template_id}`}
                            </Typography>
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                              {isRequired && <Chip label="Required" size="small" color="error" />}
                              {template.form_kind && <Chip label={template.form_kind} size="small" />}
                            </Stack>
                          </Box>
                          {template.description && (
                            <Typography variant="body2" color="text.secondary">
                              {template.description}
                            </Typography>
                          )}
                          <Stack spacing={1} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }}>
                            <Button
                              variant="outlined"
                              component="label"
                              size="small"
                              disabled={uploadState?.loading || isReadOnly}
                            >
                              {existingFile ? "Replace file" : "Upload file"}
                              <input
                                hidden
                                type="file"
                                accept={allowedMimeList?.join(',') || undefined}
                                onChange={(event) => {
                                  const nextFile = event.target.files?.[0];
                                  if (nextFile) {
                                    handleQuestionnaireFileSelect(assignment.template_id, nextFile);
                                    event.target.value = "";
                                  }
                                }}
                              />
                            </Button>
                            {existingFile && (
                              <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                <Typography variant="body2">
                                  {existingFile.original_filename}
                                  {existingFile.file_size ? ` � ${formatBytes(existingFile.file_size)}` : ""}
                                </Typography>
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
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleDownloadQuestionnaireFile(existingFile)}
                                  disabled={uploadState?.loading}
                                >
                                  Download
                                </Button>
                              </Stack>
                            )}
                            {uploadState?.loading && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <CircularProgress size={16} />
                                <Typography variant="body2" color="text.secondary">
                                  {uploadState?.percent ? `${uploadState.percent}%` : "Uploading..."}
                                </Typography>
                              </Stack>
                            )}
                            {uploadState?.error && (
                              <Typography variant="body2" color="error">
                                {uploadState.error}
                              </Typography>
                            )}
                          </Stack>
                          {isBlocked && (
                            <Alert severity="error">
                              This file was blocked by antivirus scanning. Please upload a different file.
                            </Alert>
                          )}
                          {isPending && (
                            <Alert severity="info">
                              Scanning in progress. You can submit once the scan finishes.
                            </Alert>
                          )}
                          {!existingFile && isRequired && (
                            <Alert severity="warning">This questionnaire requires an uploaded document.</Alert>
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            )}

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Step 2 � Complete your profile
              </Typography>
              {!bookingSuccess && !isReadOnly && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please confirm an interview slot above before submitting this form.
                </Alert>
              )}
              {bookingSuccess && bookedSlotLabel && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {bookedSlotLabel}
                </Alert>
              )}
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError("")}>{error}</Alert>
            )}
            {saveMessage && (
              <Alert severity="info" onClose={() => setSaveMessage("")}>{saveMessage}</Alert>
            )}
            {success && (
              <Alert severity="success">Thank you! Your information has been submitted.</Alert>
            )}

            <Stack spacing={4}>
              {sections.map((section) => (
                <Box key={section.title}>
                  <Typography variant="h6" gutterBottom>
                    {section.title}
                  </Typography>
                  <Stack spacing={2}>
                    {section.fields.map((field) => {
                      const value = responses[field.key] ?? (field.type === "boolean" ? false : "");
                      const fieldError = fieldErrors[field.key];
                      const disabled = isReadOnly;

                      if (field.type === "checkbox" || field.type === "boolean") {
                        return (
                          <FormControlLabel
                            key={field.key}
                            control={
                              <Checkbox
                                checked={Boolean(value)}
                                onChange={(event) =>
                                  setResponses((prev) => ({
                                    ...prev,
                                    [field.key]: event.target.checked,
                                  }))
                                }
                                disabled={disabled}
                              />
                            }
                            label={field.label}
                          />
                        );
                      }

                      const fieldKey = field.key;
                      const commonProps = {
                        label: field.label,
                        value: value === undefined || value === null ? "" : value,
                        onChange: (event) =>
                          setResponses((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          })),
                        required: field.isRequired,
                        disabled,
                        helperText: fieldError || field.helperText,
                        error: Boolean(fieldError),
                        fullWidth: true,
                      };

                      if (field.type === "textarea") {
                        return (
                          <TextField
                            key={fieldKey}
                            {...commonProps}
                            multiline
                            minRows={4}
                          />
                        );
                      }

                      if (field.type === "select" || field.type === "multi_select" || field.type === "radio") {
                        return (
                          <TextField
                            key={fieldKey}
                            {...commonProps}
                            select
                            SelectProps={{ multiple: field.type === "multi_select" }}
                          >
                            {field.options.length ? (
                              field.options.map((option) => (
                                <MenuItem key={option.value ?? option.label} value={option.value ?? option.label}>
                                  {option.label ?? option.value}
                                </MenuItem>
                              ))
                            ) : (
                              <MenuItem value="">No options configured</MenuItem>
                            )}
                          </TextField>
                        );
                      }

                      let inputType = "text";
                      if (["number", "integer", "decimal"].includes(field.type)) {
                        inputType = "number";
                      } else if (["email", "date", "time", "datetime"].includes(field.type)) {
                        inputType = field.type === "datetime" ? "datetime-local" : field.type;
                      }

                      return (
                        <TextField
                          key={fieldKey}
                          {...commonProps}
                          type={inputType}
                        />
                      );
                    })}
                  </Stack>
                  <Divider sx={{ mt: 3 }} />
                </Box>
              ))}
            </Stack>

            {!isReadOnly && (
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Button variant="outlined" onClick={handleSaveProgress} disabled={submitting}>
                    Save for later
                  </Button>
                  <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </Stack>
              </Stack>
            )}

            {isReadOnly && (
              <Typography variant="body1" color="success.main">
                This intake has already been submitted. Thank you!
              </Typography>
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default CandidateIntakePage;

