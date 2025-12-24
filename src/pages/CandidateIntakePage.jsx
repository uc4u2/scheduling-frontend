
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Snackbar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useParams } from "react-router-dom";
import axios from "axios";
import QUESTIONNAIRE_LIMITS from "../constants/questionnaireUploads";
import { candidateIntakeApi } from "../utils/api";
import { uploadQuestionnaireFile, downloadQuestionnaireFile } from "../utils/questionnaireUploads";
import CandidateSlotPicker from "../components/CandidateSlotPicker";
import TimezoneSelect from "../components/TimezoneSelect";

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
      config,
    };
  };

  const buildSections = (template) => {

  if (!template) return [];

  const fields = (template.fields || [])

    .map(normaliseField)

    .filter(Boolean)

    .filter((field) => !BOOKING_CAPTURED_KEYS.has((field.key || '').toLowerCase()))
    .filter((field) => {
      const k = (field.key || "").toLowerCase();
      const hidden = field.config?.hidden === true;
      const isPlaceholder = k.startsWith("__placeholder");
      return !hidden && !isPlaceholder;
    })

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
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingMessage, setBookingMessage] = useState({ severity: "info", message: "" });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookedSlotInfo, setBookedSlotInfo] = useState(null);
  const [bookingToast, setBookingToast] = useState({ open: false, message: "", severity: "success" });
  const [viewerTimezone, setViewerTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [resumeFile, setResumeFile] = useState(null);
  const [candidateBasics, setCandidateBasics] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    candidatePosition: "",
    linkedin: "",
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

  const rawBookingRequired = submission?.booking_required;
  const bookingRequired =
    rawBookingRequired === undefined
      ? true
      : !(
          rawBookingRequired === false ||
          rawBookingRequired === 0 ||
          rawBookingRequired === "0" ||
          rawBookingRequired === "false"
        );

  useEffect(() => {
    if (bookingRequired && submission?.recruiter_id) {
      fetchSlots(submission.recruiter_id);
    }
  }, [bookingRequired, submission?.recruiter_id, fetchSlots]);

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

  const formatRangeDual = (slot) => {
    if (!slot) return "";
    const baseTz = slot.timezone || timezone || "UTC";
    const localTz = viewerTimezone || baseTz;
    const base = `${formatDateHeading(slot.date)} — ${formatTime(slot.date, slot.start_time, baseTz)} to ${formatTime(slot.date, slot.end_time, baseTz)} (${baseTz})`;
    if (localTz === baseTz) return base;
    const local = `${formatTime(slot.date, slot.start_time, localTz)} to ${formatTime(slot.date, slot.end_time, localTz)} (${localTz})`;
    return `${base} · ${local}`;
  };

  useEffect(() => {
    if (!selectedSlotId) {
      if (selectedSlot) {
        setSelectedSlot(null);
      }
      return;
    }
    const match = upcomingSlots.find((slot) => slot.id === selectedSlotId);
    if (match) {
      if (!selectedSlot || match.id !== selectedSlot.id) {
        setSelectedSlot(match);
      }
    } else {
      setSelectedSlotId(null);
      setSelectedSlot(null);
    }
  }, [upcomingSlots, selectedSlotId, selectedSlot]);

  const bookedSlotLabel = (() => {
    if (!bookingSuccess || !bookedSlotInfo) return "";
    const tzLabel = bookedSlotInfo?.timezone || timezone;
    if (bookedSlotInfo?.date && bookedSlotInfo?.start && bookedSlotInfo?.end) {
      return `Interview slot confirmed for ${formatDateHeading(bookedSlotInfo.date)} — ${formatTime(bookedSlotInfo.date, bookedSlotInfo.start, tzLabel)} - ${formatTime(bookedSlotInfo.date, bookedSlotInfo.end, tzLabel)} (${tzLabel})`;
    }
    return "Interview slot confirmed.";
  })();

  const bookedSlotLocation = bookingSuccess && bookedSlotInfo ? bookedSlotInfo.location || "" : "";
  const bookedSlotMeetingLink = bookingSuccess && bookedSlotInfo ? bookedSlotInfo.meetingLink || "" : "";
  const bookedSlotCancelLink = bookingSuccess && bookedSlotInfo ? bookedSlotInfo.cancelLink || "" : "";
  const submittedAtLabel = useMemo(() => {
    const submittedAt = submission?.submitted_at || submission?.submittedAt;
    if (!submittedAt) return "";
    try {
      return new Date(submittedAt).toLocaleString();
    } catch (error) {
      return String(submittedAt);
    }
  }, [submission?.submitted_at, submission?.submittedAt]);
  const templateVersionLabel = useMemo(() => {
    if (template?.version_major == null && template?.version_minor == null) return "";
    const major = template?.version_major ?? 1;
    const minor = template?.version_minor ?? 0;
    return `v${major}.${minor}`;
  }, [template?.version_major, template?.version_minor]);
  const summaryEmail = candidateBasics.candidateEmail || submission?.invite_email || responses?.email || "";
  const summaryName = candidateBasics.candidateName || submission?.invite_name || responses?.full_name || responses?.name || "";
  const summaryPhone = candidateBasics.candidatePhone || submission?.invite_phone || responses?.phone || "";
  const jobTitle =
    responses?.job_title ||
    responses?.candidate_position ||
    responses?.position ||
    "";
  const jobOpeningId =
    responses?.source_job_opening_id ||
    responses?.job_opening_id ||
    "";
  const resumeSummaryFile = useMemo(() => {
    const files = submissionFiles || [];
    if (!files.length) return null;
    const allowedExt = [".pdf", ".doc", ".docx"];
    const isResumeName = (value) => {
      const lowered = String(value || "").toLowerCase();
      return lowered.includes("resume") || lowered.includes("cv");
    };
    const preferred = [];
    const fallback = [];
    files.forEach((file) => {
      const name = String(file.original_filename || "").toLowerCase();
      const matchesExt = allowedExt.some((ext) => name.endsWith(ext));
      if (!matchesExt) return;
      if (isResumeName(name) || isResumeName(file.field_key || "")) {
        preferred.push(file);
      } else {
        fallback.push(file);
      }
    });
    return preferred[0] || fallback[0] || null;
  }, [submissionFiles]);
  const sortedSubmissionFiles = useMemo(() => {
    const files = submissionFiles || [];
    return files.slice().sort((a, b) => {
      const aTime = a?.uploaded_at || a?.created_at || 0;
      const bTime = b?.uploaded_at || b?.created_at || 0;
      if (!aTime || !bTime) return 0;
      return new Date(bTime) - new Date(aTime);
    });
  }, [submissionFiles]);

  const handleSelectSlot = useCallback((slot) => {
    if (!slot) {
      setSelectedSlotId(null);
      setSelectedSlot(null);
      setBookingMessage({ severity: "info", message: "" });
      return;
    }
    setSelectedSlotId((current) => (current === slot.id ? null : slot.id));
    setSelectedSlot((current) => (current && current.id === slot.id ? null : slot));
    setBookingMessage({ severity: "info", message: "" });
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
      if (field === "candidatePosition") {
        return { ...prev, candidate_position: value, job_title: value };
      }
      if (field === "linkedin") {
        return { ...prev, linkedin: value };
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
    const { candidateName, candidateEmail, candidatePhone, candidatePosition, linkedin } = candidateBasics;
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
      setBookingToast({ open: true, severity: "success", message: data.message || "Interview slot booked successfully." });
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
      setBookingToast({ open: true, severity: "error", message: detail });
    } finally {
      setBookingSaving(false);
    }
  }, [submission?.recruiter_id, selectedSlot, candidateBasics, resumeFile, token, timezone]);


  const handleSubmit = useCallback(async () => {
    if (!token) return;
    if (bookingRequired && !bookingSuccess && !isReadOnly) {
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

    const mergedResponses = {
      ...responses,
      ...(candidateBasics.candidateName ? { full_name: candidateBasics.candidateName, name: candidateBasics.candidateName } : {}),
      ...(candidateBasics.candidateEmail ? { email: candidateBasics.candidateEmail } : {}),
      ...(candidateBasics.candidatePhone ? { phone: candidateBasics.candidatePhone } : {}),
      ...(candidateBasics.candidatePosition ? { candidate_position: candidateBasics.candidatePosition, job_title: candidateBasics.candidatePosition } : {}),
      ...(candidateBasics.linkedin ? { linkedin: candidateBasics.linkedin } : {}),
    };

    setSubmitting(true);
    setFieldErrors({});
    setError("");
    setSuccess(false);
    try {
      let data;
      if (resumeFile) {
        const formData = new FormData();
        formData.append("responses", JSON.stringify(mergedResponses));
        formData.append("resume", resumeFile);
        data = await candidateIntakeApi.submit(token, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        data = await candidateIntakeApi.submit(token, { responses: mergedResponses });
      }
      if (data?.submission) {
        setSubmission(data.submission);
        if (Array.isArray(data.submission.files)) {
          setSubmissionFiles(data.submission.files);
        }
      } else if (data) {
        setSubmission(data);
      }
      if (resumeFile) {
        setResumeFile(null);
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
  }, [token, responses, bookingRequired, bookingSuccess, isReadOnly, questionnaires, submissionFiles]);

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

  const bookingPanelsDesktop = (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
      <Box
        sx={{
          flex: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Booking summary
        </Typography>
        {selectedSlot ? (
          <>
            <Typography variant="body2" color="text.secondary">
              {formatRangeDual(selectedSlot)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              We’ll send the confirmation with timezone details.
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select a date to see available times in your timezone.
          </Typography>
        )}
        {bookingSuccess && bookedSlotInfo && (
          <Typography variant="caption" color="success.main" sx={{ display: "block", mt: 1 }}>
            Confirmation sent. Use the links above to join or cancel.
          </Typography>
        )}
      </Box>
      <Stack
        sx={{
          flex: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 2,
          bgcolor: "background.default",
          gap: 1.5,
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Good to know
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We hold your selected slot for a short time while you complete the form. All uploads are encrypted in transit. Need to reschedule? Use your confirmation link anytime.
        </Typography>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Your timezone
          </Typography>
          <TimezoneSelect
            label="Timezone"
            value={viewerTimezone}
            onChange={setViewerTimezone}
          />
        </Box>
      </Stack>
    </Stack>
  );

  const bookingPanelsMobile = (
    <Accordion defaultExpanded={false} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">Booking summary & timezone</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Stack spacing={2}>
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Booking summary
            </Typography>
            {selectedSlot ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  {formatRangeDual(selectedSlot)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  We’ll send the confirmation with timezone details.
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Select a date to see available times in your timezone.
              </Typography>
            )}
            {bookingSuccess && bookedSlotInfo && (
              <Typography variant="caption" color="success.main" sx={{ display: "block", mt: 1 }}>
                Confirmation sent. Use the links above to join or cancel.
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
              bgcolor: "background.default",
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Good to know
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              We hold your selected slot for a short time while you complete the form. All uploads are encrypted in transit. Need to reschedule? Use your confirmation link anytime.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Your timezone
            </Typography>
            <TimezoneSelect
              label="Timezone"
              value={viewerTimezone}
              onChange={setViewerTimezone}
            />
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

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
              {template?.name && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center" useFlexGap flexWrap="wrap">
                  <Chip size="small" label={template.name} />
                  {templateVersionLabel && <Chip size="small" variant="outlined" label={templateVersionLabel} />}
                </Stack>
              )}
            </Box>

            {isReadOnly && (
              <Alert severity="info">
                Submitted{submittedAtLabel ? ` on ${submittedAtLabel}` : ""}. This is a read-only view.
              </Alert>
            )}

            {isReadOnly && (
              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Summary</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Name:</strong> {summaryName || "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {summaryEmail || "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {summaryPhone || "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Submission ID:</strong> {submission?.id ?? "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Intake token:</strong> {token || "—"}
                    </Typography>
                    {jobTitle ? (
                      <Typography variant="body2">
                        <strong>Job:</strong> {jobTitle}
                      </Typography>
                    ) : jobOpeningId ? (
                      <Typography variant="body2">
                        <strong>Job opening ID:</strong> {jobOpeningId}
                      </Typography>
                    ) : null}
                  </Stack>

                  {resumeSummaryFile && (
                    <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                      <Typography variant="body2">
                        <strong>Resume:</strong> {resumeSummaryFile.original_filename || "Resume"}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleDownloadQuestionnaireFile(resumeSummaryFile)}
                      >
                        Download
                      </Button>
                      {resumeSummaryFile.scan_status && (
                        <Chip
                          size="small"
                          color={
                            resumeSummaryFile.scan_status === "clean"
                              ? "success"
                              : resumeSummaryFile.scan_status === "blocked"
                              ? "error"
                              : "warning"
                          }
                          label={`Scan: ${resumeSummaryFile.scan_status}`}
                        />
                      )}
                    </Stack>
                  )}

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!summaryEmail}
                      component="a"
                      href={summaryEmail ? `/recruiter/candidates/${encodeURIComponent(summaryEmail)}` : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open candidate profile
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      component="a"
                      href={summaryEmail ? `/recruiter/candidates/${encodeURIComponent(summaryEmail)}` : undefined}
                      disabled={!summaryEmail}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Move stage
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      component="a"
                      href="/recruiter/invitations"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Send follow-up
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            )}

            {isReadOnly && sortedSubmissionFiles.length > 0 && (
              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Attachments</Typography>
                  <Stack spacing={1.5}>
                    {sortedSubmissionFiles.map((file) => {
                      const scanStatus = (file.scan_status || "").toLowerCase();
                      return (
                        <Stack
                          key={file.id}
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          alignItems={{ sm: "center" }}
                          justifyContent="space-between"
                          useFlexGap
                          flexWrap="wrap"
                        >
                          <Stack spacing={0.25}>
                            <Typography variant="body2">
                              {file.original_filename || `File #${file.id}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {file.field_key ? `Field: ${file.field_key}` : "Uploaded file"}
                              {file.file_size ? ` • ${formatBytes(file.file_size)}` : ""}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
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
                              onClick={() => handleDownloadQuestionnaireFile(file)}
                            >
                              Download
                            </Button>
                          </Stack>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Stack>
              </Paper>
            )}

            {bookingRequired && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Step 1 — Pick an interview slot
                </Typography>
                <Accordion defaultExpanded={false} disableGutters sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Booking details & status</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Select a time that works best for you, then confirm the booking. The form below unlocks after your slot is reserved.
                    </Typography>

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
                  </AccordionDetails>
                </Accordion>

                {!isSmDown && bookingPanelsDesktop}

                <Box sx={{ mb: 2 }}>
                  <CandidateSlotPicker
                    slots={upcomingSlots}
                    timezone={timezone}
                    selectedSlotId={selectedSlotId}
                    onSelect={handleSelectSlot}
                    loading={slotsLoading}
                    error={slotsError}
                    disabled={bookingSuccess || bookingSaving}
                  />
                </Box>

                <Box>
                  <Button
                    variant="contained"
                    onClick={handleBookSlot}
                    disabled={bookingSaving || bookingSuccess || !selectedSlot}
                    startIcon={bookingSaving ? <CircularProgress size={16} /> : null}
                  >
                    {bookingSaving ? "Booking..." : bookingSuccess ? "Slot booked" : "Confirm slot"}
                  </Button>
                  {selectedSlot && !bookingSuccess && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      Selected: {formatDateHeading(selectedSlot.date)} — {formatTime(selectedSlot.date, selectedSlot.start_time, timezone)} — {formatTime(selectedSlot.date, selectedSlot.end_time, timezone)}
                    </Typography>
                  )}
                </Box>

                {isSmDown && (
                  <Box sx={{ mt: 2 }}>
                    {bookingPanelsMobile}
                  </Box>
                )}
              </Box>
            )}

            <Box>
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
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Resume / document (optional)
                  </Typography>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                    disabled={bookingSaving || bookingSuccess}
                  />
                </Box>
              </Stack>
            </Box>

          {sortedQuestionnaires.length > 0 && (
            <Box>
                <Typography variant="h6" gutterBottom>
                  Step 2 — Upload questionnaire documents
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Allowed types: {allowedMimeList.join(', ')} — Max {storageInfo?.maxFileMb ?? QUESTIONNAIRE_LIMITS.maxFileMb} MB per file
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

            {sections.length > 0 && (
              <>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {bookingRequired ? "Step 2 — Complete your profile" : "Step 1 — Complete your profile"}
                  </Typography>
                  {bookingRequired && !bookingSuccess && !isReadOnly && (
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
                          const isMultiSelect = ["multi_select", "multiselect", "checkboxes", "checkbox_group"].includes(
                            String(field.type || "").toLowerCase()
                          );
                          const value = responses[field.key] ?? (field.type === "boolean" ? false : isMultiSelect ? [] : "");
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

                          if (field.type === "textarea" || field.type === "longtext") {
                            return (
                              <TextField
                                key={fieldKey}
                                {...commonProps}
                                multiline
                                minRows={3}
                              />
                            );
                          }

                          if (field.type === "select" || isMultiSelect) {
                            return (
                              <TextField
                                key={fieldKey}
                                select
                                {...commonProps}
                                SelectProps={{ multiple: isMultiSelect }}
                                value={isMultiSelect ? (Array.isArray(value) ? value : []) : commonProps.value}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  setResponses((prev) => ({
                                    ...prev,
                                    [field.key]: isMultiSelect
                                      ? Array.isArray(nextValue)
                                        ? nextValue
                                        : [nextValue]
                                      : nextValue,
                                  }));
                                }}
                              >
                                {(field.options || []).map((option) => (
                                  <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                  </MenuItem>
                                ))}
                              </TextField>
                            );
                          }

                          return (
                            <TextField
                              key={fieldKey}
                              {...commonProps}
                            />
                          );
                        })}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </>
            )}

            {sections.length > 0 && !isReadOnly && (
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

            {sections.length > 0 && isReadOnly && (
              <Typography variant="body1" color="success.main">
                This intake has already been submitted. Thank you!
              </Typography>
            )}
          </Stack>
        </Paper>
      </Box>
      <Snackbar
        open={bookingToast.open}
        autoHideDuration={3000}
        onClose={() => setBookingToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setBookingToast((prev) => ({ ...prev, open: false }))}
          severity={bookingToast.severity}
          sx={{ width: "100%" }}
        >
          {bookingToast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CandidateIntakePage;
